/** Disposable compact Files adapter. No wallet, private keys, Node APIs, cache of
 * names, RPC URL, or document fixtures live here. Inject ethers v6 and raw RPC.
 * All evidence is RPC_OBSERVED, not a portable source-state proof.
 * Contexts/plans/continuations are immutable, instance-owned capabilities.
 * Journal entries are JSON-safe and must be durably stored by put() before it
 * resolves. Reconcile works after reload from that journal, without re-signing.
 */
export function createCompactSdk({ethers: e, rpc, manifest, journal}) {
  const Z = e.ZeroHash, coder = e.AbiCoder.defaultAbiCoder();
  const fail = (code) => {throw new Error(`COMPACT_${code}`);};
  const check = (condition, code) => {if (!condition) fail(code);};
  const eq = (a,b) => String(a).toLowerCase() === String(b).toLowerCase();
  const plain = value => JSON.parse(JSON.stringify(value,(_,v) => typeof v === 'bigint' ? String(v) : v));
  const freeze = value => {
    if (value && typeof value === 'object') {Object.values(value).forEach(freeze); Object.freeze(value);}
    return value;
  };
  const config = freeze(plain(manifest));
  const hash = (types,values) => e.keccak256(coder.encode(types,values));
  const purpose = Object.fromEntries(['head','folder','tag'].map(k => [k,e.id(`efs2/purpose/${k}/1`)]));
  const positionOf = (p,s,r) => hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),p,s,r]);
  const recordOf = (type,bodyHash) => hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),type,bodyHash]);
  const bindingOf = (author,position) => hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),e.zeroPadValue(author,32),position]);
  const contexts = new WeakSet(), continuations = new WeakMap(), plans = new WeakSet(), signedPlans = new WeakSet(), submissions = new Map();
  const interfaces = Object.fromEntries(Object.entries(config.contracts).map(([k,c]) => [k,new e.Interface(c.abi)]));
  const blockArg = context => ({blockHash:context.blockHash,requireCanonical:true});
  const call = async (key,fn,args,context) => {
    const data = interfaces[key].encodeFunctionData(fn,args);
    return interfaces[key].decodeFunctionResult(fn,await rpc('eth_call',[{to:config.contracts[key].address,data},blockArg(context)]));
  };
  const scalar = async (...args) => (await call(...args))[0];
  const code = (address,context) => rpc('eth_getCode',[address,blockArg(context)]);
  const addresses = Object.fromEntries(Object.entries(config.contracts).map(([k,c]) => [k,c.address]));
  const authorsOf = authors => {
    const result = (authors ?? Object.values(config.authors)).map(a => e.getAddress(a));
    check(result.length > 0 && result.length <= 255 && new Set(result).size === result.length,'LENS');
    return result;
  };
  const mounted = folder => {
    const f = folder ?? config.folder;
    check((config.folders ?? [config.folder]).some(x => eq(x,f)),'UNMOUNTED_FOLDER');
    return f;
  };
  const basisFor = (context,authors,policy='ordered') => ({...context,
    lens:{address:addresses.lens,codeHash:config.contracts.lens.codeHash,policy,
      authors:authors ?? [], hash:authors ? e.keccak256(e.concat(authors.map(a => e.zeroPadValue(a,32)))) : null},
  });
  const result = (context,knowledge,coverage,value,extra={}) => ({basis:context,knowledge,coverage,value,...extra});

  async function validateProfile(context) {
    for (const [key,c] of Object.entries(config.contracts)) {
      check(c.codeHash && !eq(c.codeHash,Z),'MANIFEST_CODE');
      const runtime = await code(c.address,context);
      check(runtime !== '0x' && eq(e.keccak256(runtime),c.codeHash),`CODE_${key}`);
    }
    for (const [key,fn,target] of [
      ['ledger','registry','registry'],['ledger','indexModule','index'],
      ['lens','ledger','ledger'],['lens','index','index'],['index','ledger','ledger'],
      ['files','ledger','ledger'],['files','lensReader','lens'],['files','filesIndex','index'],
      ['names','ledger','ledger'],['names','source','ledger'],
    ]) check(eq(await scalar(key,fn,[],context),addresses[target]),'BINDING');
    for (const type of ['root','child','name']) {
      const id = config.types[type], expected = config.ruleHashes[type];
      check(id && expected && !eq(id,Z) && !eq(expected,Z),'PROFILE');
      const d = await call('registry','descriptor',[id],context);
      const refs = Array.from(await scalar('registry','refTypes',[id],context));
      const shape = e.id(`lab/type/files-${type === 'name' ? 'name-raw-ascii' : `joined-${type}`}/1`);
      const count = type === 'child' ? 1 : 0;
      check(eq(d[0],shape) && eq(d[1],expected) && Number(d[3]) === count && refs.length === count
        && (!count || eq(refs[0],Z)) && eq(e.keccak256(await code(d[2],context)),expected),'PROFILE');
      check(eq(hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/type/1'),shape,hash(['bytes32[]'],[refs]),expected]),id),'TYPE_ID');
      for (const key of type === 'name' ? ['index','names'] : ['index','files']) {
        check(eq(await scalar(key,`${type}Type`,[],context),id),'PROFILE');
        check(eq(await scalar(key,`expected${type[0].toUpperCase()}${type.slice(1)}RuleHash`,[],context),expected),'PROFILE');
      }
      if (type === 'child') {
        const iface = new e.Interface(['function rootType() view returns(bytes32)']);
        const raw = await rpc('eth_call',[{to:d[2],data:iface.encodeFunctionData('rootType')},blockArg(context)]);
        check(eq(iface.decodeFunctionResult('rootType',raw)[0],config.types.root),'PROFILE');
      }
    }
    check(eq(await scalar('ledger','coreCodeCommitment',[],context),context.core),'CORE');
    check(eq(await scalar('names','coreCodehash',[],context),context.core),'CORE');
  }

  async function pinAt(block) {
    check(block?.hash && block?.number,'BLOCK_UNAVAILABLE');
    const chainId = String(BigInt(await rpc('eth_chainId',[])));
    check(chainId === String(BigInt(config.chainId)),'CHAIN');
    const context = {chainId,blockHash:block.hash,blockNumber:String(BigInt(block.number)),
      timestamp:String(BigInt(block.timestamp)), core:config.contracts.ledger.codeHash,
      ledger:addresses.ledger,index:addresses.index,grade:'RPC_OBSERVED'};
    [context.admission,context.generation,context.epoch] = (await Promise.all([
      scalar('ledger','counts',[],context),scalar('index','generation',[],context),scalar('registry','epoch',[],context),
    ])).map(String);
    await validateProfile(context);
    freeze(context); contexts.add(context);
    return context;
  }
  const pin = async () => pinAt(await rpc('eth_getBlockByNumber',['latest',false]));
  async function guard(context) {
    check(contexts.has(context),'CONTEXT');
    const canonical = await rpc('eth_getBlockByNumber',[e.toQuantity(BigInt(context.blockNumber)),false]);
    check(eq(canonical?.hash,context.blockHash),'BLOCK_REORG');
    const [admission,generation,epoch,index] = await Promise.all([
      scalar('ledger','counts',[],context),scalar('index','generation',[],context),
      scalar('registry','epoch',[],context),scalar('ledger','indexModule',[],context),
    ]);
    check(String(admission) === context.admission && String(generation) === context.generation
      && String(epoch) === context.epoch && eq(index,addresses.index),'BASIS');
  }

  function validName(bytes) {
    const text = e.toUtf8String(bytes);
    check(bytes.length > 0 && bytes.length <= 255 && /^[a-z0-9._-]+$/.test(text) && text !== '.' && text !== '..','NAME_GRAMMAR');
    return text;
  }
  async function nameAt({position,folder,role,context}) {
    const cell = await call('ledger','positionCell',[position],context);
    check(eq(cell[0],purpose.folder) && eq(cell[1],folder) && eq(cell[2],role)
      && eq(position,positionOf(purpose.folder,folder,role)),'POSITION');
    let record;
    try {record = await scalar('names','readName',[position,folder,role,[context.admission,context.epoch,context.core]],context);}
    catch (error) {return result(basisFor(context),'UNKNOWN','PARTIAL',null,{reason:'NAME_UNAVAILABLE'});}
    const [status,id,first,bytes] = record;
    if (Number(status) !== 1) return result(basisFor(context),Number(status) === 3 ? 'INVALID' : 'UNKNOWN','PARTIAL',null,
      {reason:Number(status) === 3 ? 'NAME_INTEGRITY' : 'NAME_UNAVAILABLE',recordId:id});
    try {
      const value = validName(e.getBytes(bytes));
      check(eq(id,recordOf(config.types.name,role)) && eq(e.keccak256(bytes),role)
        && first > 0n && first <= BigInt(context.admission),'NAME_INTEGRITY');
      return result(basisFor(context),'PRESENT','COMPLETE',value,{recordId:id,firstAdmission:String(first)});
    } catch {return result(basisFor(context),'INVALID','PARTIAL',null,{reason:'NAME_INTEGRITY',recordId:id});}
  }
  async function readName(args) {
    await guard(args.context);
    return nameAt({...args,folder:mounted(args.folder)});
  }
  function selection(values) {
    const [status,target,revision,author,admission] = values;
    check(Number(status) >= 0 && Number(status) <= 3,'SELECTION');
    return {status:Number(status),target,revision:Number(revision),author,admission:String(admission)};
  }
  async function resolve(authors,p,subject,role,context) {
    const s = selection(await call('lens','resolve',[authors,p,subject,role],context));
    check(BigInt(s.admission) <= BigInt(context.admission)
      && (s.status === 0 || (BigInt(s.admission) > 0n && authors.some(a => eq(a,s.author)))),'SELECTION');
    return s;
  }
  async function revisionAt(recordId,file,context) {
    const [typeId,first,occurrences,body] = await call('ledger','record',[recordId],context);
    const bytes = e.getBytes(body), child = eq(typeId,config.types.child), prefix = child ? 64 : 32;
    check((child || eq(typeId,config.types.root)) && first > 0n && first <= BigInt(context.admission)
      && bytes.length >= prefix && bytes.length <= 8192 && eq(recordOf(typeId,e.keccak256(body)),recordId),'FILE_PROFILE');
    const embeddedFile = e.hexlify(bytes.slice(prefix-32,prefix));
    const parent = child ? e.hexlify(bytes.slice(0,32)) : Z;
    check(eq(embeddedFile,file),'FILE_ID');
    const created = await scalar('ledger','subjectCreatedAt',[file],context);
    check(!eq(file,Z) && created > 0n && created <= BigInt(context.admission),'FILE_SUBJECT');
    const admission = await call('ledger','admission',[first],context);
    check(Number(admission[0]) === 1 && eq(admission[6],e.keccak256(body)) && eq(admission[7],typeId),'FILE_ADMISSION');
    if (child) {
      const [pt,pf,,pb] = await call('ledger','record',[parent],context), pbytes = e.getBytes(pb);
      const pp = eq(pt,config.types.root) ? 32 : eq(pt,config.types.child) ? 64 : 0;
      check(pp && pf > 0n && pf < first && pbytes.length >= pp && pbytes.length <= 8192
        && eq(recordOf(pt,e.keccak256(pb)),parent) && eq(e.hexlify(pbytes.slice(pp-32,pp)),file),'FILE_PARENT');
    }
    const document = e.hexlify(bytes.slice(prefix));
    return {recordId,typeId,file,parent,document,documentHash:e.keccak256(document),
      firstAdmission:String(first),occurrences:String(occurrences),maintenance:'RETAINED_OCCURRENCE_COUNT',validity:'NOT_ASSESSED'};
  }
  async function tagAt(authors,subject,concept,file,context) {
    const s = await resolve(authors,purpose.tag,subject,concept,context);
    return {subject,concept,evaluated:true,present:s.status === 1 && eq(s.target,file),selection:s};
  }
  async function fileAt({file,authors,concept=Z,context,policy='ordered'}) {
    check(policy === 'ordered' || policy === 'no-tiebreak','LENS_POLICY');
    let s, candidates = [];
    if (policy === 'ordered') s = await resolve(authors,purpose.head,file,Z,context);
    else {
      const [status,entries] = await call('lens','resolveNoTiebreak',[authors,purpose.head,file,Z],context);
      s = {status:Number(status),target:Z,revision:0,author:e.ZeroAddress,admission:'0'};
      for (const entry of entries) {
        check(eq(entry.position,positionOf(purpose.head,file,Z)) && entry.admission > 0n
          && entry.admission <= BigInt(context.admission) && authors.some(a => eq(a,entry.author)),'SELECTION');
        const candidateSelection = selection([1,entry.target,entry.revision,entry.author,entry.admission]);
        let revision=null,knowledge='PRESENT';
        try {revision=await revisionAt(entry.target,file,context);}
        catch(error) {knowledge=String(error?.message).startsWith('COMPACT_')?'INVALID':'UNKNOWN';}
        candidates.push({selection:candidateSelection,revision,knowledge});
      }
      if (s.status === 1) {check(candidates.length === 1,'SELECTION'); s = candidates[0].selection;}
    }
    let revision = null, revisionFailure = null;
    if (s.status === 1) {
      try {revision = await revisionAt(s.target,file,context);}
      catch (error) {
        const invalid = String(error?.message).startsWith('COMPACT_');
        revisionFailure = {knowledge:invalid ? 'INVALID' : 'UNKNOWN',reason:invalid ? 'FILE_INTEGRITY' : 'BYTES_UNAVAILABLE'};
      }
    }
    const value = {file,selection:s,revision,candidates,
      fileTag:await tagAt(authors,file,concept,file,context),
      revisionTag:revision ? await tagAt(authors,revision.recordId,concept,file,context) : {subject:null,concept,evaluated:false,present:false},
    };
    return result(basisFor(context,authors,policy),revisionFailure?.knowledge ?? ['ABSENT','PRESENT','MASKED','CONFLICT'][s.status],
      revisionFailure || candidates.some(c=>c.knowledge!=='PRESENT') ? 'PARTIAL' : 'COMPLETE',value,revisionFailure ? {reason:revisionFailure.reason} : {});
  }
  async function readFile(args) {
    await guard(args.context);
    return fileAt({...args,authors:authorsOf(args.authors)});
  }

  const emptyCursor = () => [0,0,0,Z,Z,Z,Z,0,0,0];
  async function listFolder(args={}) {
    const {context,continuation} = args, folder = mounted(args.folder), authors = authorsOf(args.authors);
    check(!('cursor' in args),'CURSOR_NOT_ACCEPTED');
    await guard(context);
    const budget = args.budget ?? 64;
    check(Number.isInteger(budget) && budget >= 1 && budget <= 256,'BUDGET');
    const basis = basisFor(context,authors), scope = hash(['bytes32','bytes32'],[purpose.folder,folder]);
    let walk = {context,folder,lensHash:basis.lens.hash,cursor:emptyCursor(),rows:[],scanned:0n,rawTotal:null};
    if (continuation !== undefined) {
      walk = continuations.get(continuation);
      check(walk && walk.context === context && eq(walk.folder,folder) && eq(walk.lensHash,basis.lens.hash),'CONTINUATION');
    }
    check(config.listing===undefined || config.listing==='audit' || config.listing==='live-positive','LISTING_PROFILE');
    const family = await scalar('index',config.listing==='live-positive'?'FAMILY_LIVE_SCOPE':'FAMILY_SCOPE',[],context);
    const coverage = await call('index','coverage',[family,scope],context);
    if (Number(coverage[0]) !== 2 || coverage[1] !== 1n || String(coverage[2]) !== context.admission
      || await scalar('index','attachedFrom',[],context) !== 1n) {
      return result(basis,'UNKNOWN','UNKNOWN',walk.rows,{nameCoverage:'PARTIAL',reason:'INDEX_COVERAGE'});
    }
    const page = await scalar('lens','list',[authors,purpose.folder,folder,walk.cursor,budget],context);
    const next = page.next, scanned = walk.scanned + page.scanned;
    check(!page.mutated && String(next.basisAdmission) === context.admission && String(next.indexGeneration) === context.generation
      && String(next.rulesEpoch) === context.epoch && eq(next.coreCodeCommitment,context.core)
      && eq(next.scopeKey,scope) && eq(next.lensHash,basis.lens.hash),'BASIS');
    check(page.scanned <= BigInt(budget) && scanned <= page.rawTotal
      && (walk.rawTotal === null || page.rawTotal === walk.rawTotal),'PAGE');
    const rows = [...walk.rows];
    for (const entry of page.items) {
      const cell = await call('ledger','positionCell',[entry.position],context);
      check(eq(cell[0],purpose.folder) && eq(cell[1],folder) && eq(entry.position,positionOf(purpose.folder,folder,cell[2]))
        && !rows.some(r => eq(r.position,entry.position)),'POSITION');
      const s = await resolve(authors,purpose.folder,folder,cell[2],context);
      check(s.status === 1 && eq(s.target,entry.target) && eq(s.author,entry.author)
        && s.revision === Number(entry.revision) && s.admission === String(entry.admission),'MEMBERSHIP');
      const created = await scalar('ledger','subjectCreatedAt',[entry.target],context);
      check(!eq(entry.target,Z) && created > 0n && created <= BigInt(context.admission),'FILE_SUBJECT');
      rows.push({file:entry.target,position:entry.position,folder,role:cell[2],selection:s,
        name:await nameAt({position:entry.position,folder,role:cell[2],context})});
    }
    check(page.selectedSoFar === BigInt(rows.length) && next.selectedSoFar === page.selectedSoFar,'PAGE_COUNT');
    const complete = Number(page.status) === 2;
    if (complete) check(Number(next.lensIndex) === authors.length && next.rawIndex === 0n && scanned === page.rawTotal,'INCOMPLETE_TRAVERSAL');
    else check(Number(page.status) === 1 && page.scanned > 0n,'PAGE_PROGRESS');
    const extra = {nameCoverage:rows.every(r => r.name.knowledge === 'PRESENT') ? 'COMPLETE' : 'PARTIAL',
      scanned:String(scanned),rawTotal:String(page.rawTotal)};
    if (!complete) {
      const token = Object.freeze({kind:'compact-folder-continuation'});
      continuations.set(token,{context,folder,lensHash:basis.lens.hash,cursor:Array.from(next),rows,scanned,rawTotal:page.rawTotal});
      extra.continuation = token;
    }
    return freeze(result(basis,rows.length ? 'PRESENT' : complete ? 'ABSENT' : 'UNKNOWN',complete ? 'COMPLETE' : 'PARTIAL',rows,extra));
  }

  const action = fields => ({kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z,...fields});
  const bytesOf = input => typeof input === 'string' ? e.toUtf8Bytes(input) : e.getBytes(input);
  async function prepare(args) {
    const context = args.context ?? await pin(); await guard(context);
    const author = e.getAddress(args.author), authors = authorsOf(args.authors);
    check(await code(author,context) === '0x','SIGNED_EOA_ONLY');
    const actions = [], bodies = [], expectedHeads = new Map(), startingHeads = new Map(), retainedNames = new Set(), selectionDependencies = [];
    let file = args.file, newRevision = null;
    const push = (fields,body='0x') => {actions.push(action(fields)); bodies.push(e.hexlify(body));};
    const ownHead = async (p,s,r) => {
      const position = positionOf(p,s,r), key = bindingOf(author,position);
      if (!expectedHeads.has(key)) {
        const h = await call('ledger','head',[key],context);
        const value = {key,position,purpose:p,subject:s,role:r,state:Number(h[0]),revision:Number(h[1]),target:h[5]};
        expectedHeads.set(key,{...value}); startingHeads.set(key,{...value});
      }
      return expectedHeads.get(key);
    };
    const binding = async (p,s,r,target,remove=false) => {
      const h = await ownHead(p,s,r);
      if (remove && h.state !== 1) {
        push({kind:3,purpose:p,subject:s,role:r,target,expectedRevision:h.revision});
        h.revision++; h.state=1; h.target=target;
      }
      push({kind:remove ? 4 : 3,purpose:p,subject:s,role:r,target:remove ? Z : target,expectedRevision:h.revision});
      h.revision++; h.state=remove ? 2 : 1; h.target=remove ? Z : target;
    };
    const retainName = async name => {
      const bytes = bytesOf(name); validName(bytes);
      const role = e.keccak256(bytes), id = recordOf(config.types.name,role);
      if (!retainedNames.has(id)) {
        const [t,first,,stored] = await call('ledger','record',[id],context);
        if (eq(t,Z) && first === 0n) push({kind:1,typeId:config.types.name,bodyHashOrRecordId:role},bytes);
        else check(eq(t,config.types.name) && first > 0n && first <= BigInt(context.admission) && eq(e.hexlify(bytes),stored),'NAME_INTEGRITY');
        retainedNames.add(id);
      }
      return role;
    };
    const publishRevision = (document,parent) => {
      const body = e.concat(parent ? [parent,file,document] : [file,document]);
      check(e.getBytes(body).length <= 8192,'BODY_LIMIT');
      const type = parent ? config.types.child : config.types.root, bodyHash = e.keccak256(body);
      newRevision = recordOf(type,bodyHash);
      push({kind:1,typeId:type,bodyHashOrRecordId:bodyHash},body);
    };
    const selected = async () => {
      const point = await fileAt({file,authors,context});
      check(point.knowledge === 'PRESENT','NO_SELECTED_REVISION');
      selectionDependencies.push({purpose:purpose.head,subject:file,role:Z,selection:point.value.selection});
      return point.value.revision;
    };
    const operation = args.operation;
    if (operation === 'create') {
      check(args.salt && !eq(args.salt,Z),'SALT');
      file = hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),e.zeroPadValue(author,32),args.salt]);
      check(await scalar('ledger','subjectCreatedAt',[file],context) === 0n,'SUBJECT_EXISTS');
      push({kind:5,salt:args.salt});
      publishRevision(bytesOf(args.document),null);
      const role = await retainName(args.name);
      await binding(purpose.head,file,Z,newRevision);
      await binding(purpose.folder,mounted(args.folder),role,file);
    } else {
      check(file && !eq(file,Z),'FILE_ID');
      const created = await scalar('ledger','subjectCreatedAt',[file],context);
      check(created > 0n && created <= BigInt(context.admission),'FILE_SUBJECT');
      if (operation === 'edit' || operation === 'restoreContents') {
        const current = await selected();
        const document = operation === 'edit' ? bytesOf(args.document)
          : e.getBytes((await revisionAt(args.record,file,context)).document);
        publishRevision(document,current.recordId);
        await binding(purpose.head,file,Z,newRevision);
      } else if (operation === 'move' || operation === 'rename') {
        const from = mounted(args.fromFolder ?? args.folder), to = mounted(args.toFolder ?? args.folder);
        const fromRole = await retainName(args.fromName), toRole = await retainName(args.name);
        check(!eq(from,to) || !eq(fromRole,toRole),'SAME_PLACEMENT');
        const source = await resolve(authors,purpose.folder,from,fromRole,context);
        check(source.status === 1 && eq(source.target,file),'SOURCE_PLACEMENT');
        selectionDependencies.push({purpose:purpose.folder,subject:from,role:fromRole,selection:source});
        await binding(purpose.folder,from,fromRole,file,true);
        await binding(purpose.folder,to,toRole,file);
      } else if (operation === 'remove' || operation === 'restorePlacement') {
        const folder = mounted(args.folder), role = await retainName(args.name);
        if (operation === 'remove') {
          const source = await resolve(authors,purpose.folder,folder,role,context);
          check(source.status === 1 && eq(source.target,file),'SOURCE_PLACEMENT');
          selectionDependencies.push({purpose:purpose.folder,subject:folder,role,selection:source});
        }
        await binding(purpose.folder,folder,role,file,operation === 'remove');
      } else if (operation === 'addTag' || operation === 'removeTag') {
        check(args.scope === 'file' || args.scope === 'revision','TAG_SCOPE');
        check(args.concept && !eq(args.concept,Z),'TAG_CONCEPT');
        const subject = args.scope === 'file' ? file : (await selected()).recordId;
        await binding(purpose.tag,subject,args.concept,file,operation === 'removeTag');
      } else fail('OPERATION');
    }
    const actionsHash = hash([interfaces.ledger.getFunction('execute').inputs[0]],[actions]);
    const intent = {realmId:await scalar('ledger','realmId',[],context),coreCodeCommitment:context.core,author,
      nonce:String(await scalar('ledger','nonces',[author],context)),deadline:String(args.deadline ?? BigInt(context.timestamp)+3600n),
      acceptanceProfile:await scalar('ledger','acceptanceProfileOf',[actions],context),indexObligations:await scalar('ledger','indexObligations',[],context)};
    check(BigInt(intent.deadline) > BigInt(context.timestamp),'EXPIRED');
    const digest = await scalar('ledger','intentDigest',[intent,actionsHash],context);
    const publicationId = hash(['address','uint64','bytes32'],[author,intent.nonce,actionsHash]);
    const id = hash(['uint256','address','bytes32'],[context.chainId,addresses.ledger,publicationId]);
    const plan = freeze(plain({id,operation,file,newRevision,authors,basis:context,intent,actions,bodies,actionsHash,digest,publicationId,
      startingHeads:[...startingHeads.values()],expectedHeads:[...expectedHeads.values()],selectionDependencies}));
    plans.add(plan); return plan;
  }
  async function authorize(plan,signDigest) {
    check(plans.has(plan),'PLAN');
    const signature = e.Signature.from(await signDigest(plan.digest,plan)).serialized;
    check(eq(e.recoverAddress(plan.digest,signature),plan.intent.author),'SIGNER');
    const transaction = {to:addresses.ledger,data:interfaces.ledger.encodeFunctionData('executeSigned',[plan.intent,plan.actions,plan.bodies,signature]),value:'0x0'};
    const signed = freeze({id:plan.id,plan,signature,transaction});
    signedPlans.add(signed); return signed;
  }
  function submit(signed,sendTransaction) {
    check(signedPlans.has(signed),'SIGNED_PLAN');
    // Single-flight inside this adapter instance. Cross-tab/process exclusion is
    // the durable journal host's responsibility, not a claim of this Map.
    if(submissions.has(signed.id)) return submissions.get(signed.id);
    const pending=submitOnce(signed,sendTransaction).finally(()=>submissions.delete(signed.id));
    submissions.set(signed.id,pending);return pending;
  }
  async function submitOnce(signed,sendTransaction) {
    check(journal?.put && journal?.get,'DURABLE_JOURNAL_REQUIRED');
    const prior = await journal.get(signed.id);
    if (prior) return reconcile(signed.id); // no accidental duplicate broadcast
    const context = await pin(), {plan} = signed;
    check(context.chainId === plan.basis.chainId && eq(context.core,plan.basis.core),'BASIS');
    check(String(await scalar('ledger','nonces',[plan.intent.author],context)) === plan.intent.nonce,'NONCE_DRIFT');
    check(BigInt(context.timestamp) <= BigInt(plan.intent.deadline),'EXPIRED');
    check(eq(await scalar('ledger','acceptanceProfileOf',[plan.actions],context),plan.intent.acceptanceProfile),'POLICY_DRIFT');
    check(eq(await scalar('ledger','indexObligations',[],context),plan.intent.indexObligations),'INDEX_DRIFT');
    for (const h of plan.startingHeads) {
      const now = await call('ledger','head',[h.key],context);
      check(Number(now[0]) === h.state && Number(now[1]) === h.revision && eq(now[5],h.target),'CAS_DRIFT');
    }
    for (const dep of plan.selectionDependencies) {
      const now = await resolve(plan.authors,dep.purpose,dep.subject,dep.role,context), was = dep.selection;
      check(now.status === was.status && eq(now.target,was.target) && now.revision === was.revision
        && eq(now.author,was.author) && now.admission === was.admission,'SELECTION_DRIFT');
    }
    await rpc('eth_call',[signed.transaction,blockArg(context)]); // exact signed atomic batch preflight
    let entry = plain({...signed,status:'BROADCAST_UNKNOWN',transactionHash:null});
    await journal.put(entry); // write-ahead: response loss cannot erase the authorized plan
    let response;
    try {response = await sendTransaction(signed.transaction,signed);}
    catch (error) {
      entry = {...entry,error:String(error?.message ?? error)}; await journal.put(entry); return entry;
    }
    const transactionHash = typeof response === 'string' ? response : response?.hash;
    if (transactionHash && /^0x[0-9a-fA-F]{64}$/.test(transactionHash)) {
      entry = {...entry,status:'SUBMITTED',transactionHash}; await journal.put(entry);
    }
    return entry;
  }
  async function reconcile(id) {
    check(journal?.get && journal?.put,'DURABLE_JOURNAL_REQUIRED');
    const entry = await journal.get(id); check(entry && entry.id === id,'JOURNAL_NOT_FOUND');
    const {plan} = entry;
    check(eq(entry.transaction.to,addresses.ledger) && String(plan.basis.chainId) === String(config.chainId),'JOURNAL_REALM');
    check(eq(hash([interfaces.ledger.getFunction('execute').inputs[0]],[plan.actions]),plan.actionsHash),'JOURNAL_INTEGRITY');
    const publicationId = hash(['address','uint64','bytes32'],[plan.intent.author,plan.intent.nonce,plan.actionsHash]);
    check(eq(publicationId,plan.publicationId) && eq(id,hash(['uint256','address','bytes32'],[plan.basis.chainId,addresses.ledger,publicationId])),'JOURNAL_INTEGRITY');
    check(eq(e.recoverAddress(plan.digest,entry.signature),plan.intent.author),'JOURNAL_SIGNATURE');
    check(eq(entry.transaction.data,interfaces.ledger.encodeFunctionData('executeSigned',[plan.intent,plan.actions,plan.bodies,entry.signature])),'JOURNAL_INTEGRITY');
    let context = await pin();
    // The wallet's returned hash is a hint, not evidence that its receipt belongs
    // to this plan. Economic attribution is separate from canonical EFS effects.
    let receipt=null,receiptObservation=null,receiptAttribution='UNAVAILABLE';
    if(entry.transactionHash) {
      try {
        receiptObservation=await rpc('eth_getTransactionReceipt',[entry.transactionHash]);
        if(receiptObservation) {
          const r=receiptObservation;
          const [tx,block]=await Promise.all([rpc('eth_getTransactionByHash',[entry.transactionHash]),
            rpc('eth_getBlockByNumber',[r.blockNumber,false])]);
          receiptAttribution=tx&&block?'MISMATCH':'UNKNOWN';
          const quantity=x=>typeof x==='string' && /^0x(?:0|[1-9a-f][0-9a-f]*)$/i.test(x);
          if(tx&&block && [r.status,r.gasUsed,r.blockNumber,r.transactionIndex,tx.value,block.number].every(quantity)
            && (r.effectiveGasPrice===undefined || quantity(r.effectiveGasPrice))
            && BigInt(r.blockNumber)===BigInt(block.number)
            && eq(r.transactionHash,entry.transactionHash) && eq(tx.hash,entry.transactionHash)
            && eq(tx.to,entry.transaction.to) && eq(tx.input,entry.transaction.data)
            && BigInt(tx.value)===BigInt(entry.transaction.value)
            && eq(r.blockHash,tx.blockHash) && eq(r.blockHash,block.hash)
            && eq(block.transactions?.[Number(BigInt(r.transactionIndex))],entry.transactionHash)
            && (BigInt(r.status)===0n || BigInt(r.status)===1n) && BigInt(r.gasUsed)>=0n
            && (r.effectiveGasPrice===undefined || BigInt(r.effectiveGasPrice)>=0n)) {
            receipt=r;receiptAttribution='RPC_MATCHED_DIRECT_PLAN';
          }
        }
      } catch {receiptAttribution='UNKNOWN';}
    }
    const publication = await scalar('ledger','publicationOf',[plan.publicationId],context);
    let status, evidence = null;
    if (publication === 0n) status = receipt ? (BigInt(receipt.status) === 0n ? 'REVERTED' : 'EFFECTS_MISMATCH') : 'BROADCAST_UNKNOWN';
    else {
      const currentEvidence = await call('ledger','evidence',[publication],context);
      const committedBlock = await rpc('eth_getBlockByNumber',[e.toQuantity(currentEvidence[9]),false]);
      context = await pinAt(committedBlock);
      const retained = await call('ledger','evidence',[publication],context);
      let matches = eq(retained[0],plan.intent.author) && Number(retained[1]) === 2
        && Number(retained[3]) === plan.actions.length && String(retained[7]) === plan.intent.nonce
        && String(retained[8]) === plan.intent.deadline && eq(retained[10],plan.intent.acceptanceProfile)
        && eq(retained[11],plan.intent.indexObligations) && eq(retained[12],plan.actionsHash)
        && eq(await scalar('ledger','intentDigest',[plan.intent,plan.actionsHash],context),plan.digest)
        && await scalar('ledger','publicationOf',[plan.publicationId],context) === publication;
      const first = retained[4];
      for (let i=0; i<plan.actions.length; i++) {
        const a = plan.actions[i], ordinal = first+BigInt(i), row = await call('ledger','admission',[ordinal],context);
        matches &&= Number(row[0]) === a.kind && Number(row[1]) === i && row[2] === publication && Number(row[4]) === a.expectedRevision;
        if (a.kind === 1) {
          matches &&= eq(row[6],a.bodyHashOrRecordId) && eq(row[7],a.typeId) && eq(e.keccak256(plan.bodies[i]),a.bodyHashOrRecordId);
          const r = await call('ledger','record',[recordOf(a.typeId,a.bodyHashOrRecordId)],context);
          matches &&= eq(r[0],a.typeId) && r[1] > 0n && r[1] <= ordinal && eq(e.keccak256(r[3]),a.bodyHashOrRecordId);
        } else if (a.kind === 3 || a.kind === 4) {
          matches &&= eq(await scalar('ledger','bindingPosition',[row[3]],context),positionOf(a.purpose,a.subject,a.role));
          matches &&= eq(row[6],a.target);
        } else if (a.kind === 5) {
          matches &&= eq(row[6],a.salt) && await scalar('ledger','subjectCreatedAt',[plan.file],context) === ordinal;
        }
      }
      // Rebuild effect obligations from the signed actions, never unsigned journal
      // hints (which could otherwise drop a head check after a browser reload).
      const finalHeads = new Map();
      for (const a of plan.actions) if (a.kind === 3 || a.kind === 4) {
        const position = positionOf(a.purpose,a.subject,a.role), key = bindingOf(plan.intent.author,position);
        finalHeads.set(key,{key,position,state:a.kind === 3 ? 1 : 2,revision:a.expectedRevision+1,target:a.target});
      }
      let supersededAtPublicationBlock=false;
      for (const expected of finalHeads.values()) {
        const historical=await call('lens','history',[plan.intent.author,expected.position,first+BigInt(plan.actions.length)-1n],context);
        matches &&= Number(historical[0])===2 && historical[1]===(expected.state===1)
          && eq(historical[2],expected.target) && Number(historical[3])===expected.revision
          && historical[4]>=first && historical[4]<first+BigInt(plan.actions.length);
        const h = await call('ledger','head',[expected.key],context);
        supersededAtPublicationBlock ||= h[2]>=first+BigInt(plan.actions.length);
      }
      status = matches ? 'EFFECTS_VERIFIED' : 'EFFECTS_MISMATCH';
      evidence = {publication:String(publication),firstAdmission:String(first),leafCount:plan.actions.length,supersededAtPublicationBlock};
    }
    const outcome = {...entry,status,knowledge:status === 'EFFECTS_VERIFIED' ? 'VERIFIED' : 'UNKNOWN',
      coverage:status === 'EFFECTS_VERIFIED' ? 'COMPLETE' : 'PARTIAL',basis:basisFor(context,plan.authors),evidence,
      receipt,receiptObservation,receiptAttribution};
    await journal.put(plain(outcome)); return outcome;
  }
  return Object.freeze({pin,listFolder,readFile,readName,prepare,authorize,submit,reconcile});
}
