/** Disposable compact Files adapter. No wallet, private keys, Node APIs, name
 * catalog, RPC URL, or document fixtures live here. Inject ethers v6 and raw RPC.
 * All evidence is RPC_OBSERVED, not a portable source-state proof.
 * Contexts/plans/continuations are immutable, instance-owned capabilities.
 * Journal entries are JSON-safe and must be durably stored by put() before it
 * resolves. Reconcile works after reload from that journal, without re-signing.
 */
// `knowledge:PRESENT` on a tag means its assessment is available, including a
// successful negative. Presence itself is exclusively the assessment below.
// Do not recover a missing discriminant from a legacy nullable boolean.
export function normalizeTagAssessment(tag={}) {
  const assessment=['PRESENT','NOT_PRESENT','UNKNOWN','NOT_APPLICABLE'].includes(tag.assessment)?tag.assessment:'UNKNOWN';
  return {subject:null,concept:null,selection:null,...tag,assessment,
    present:assessment==='PRESENT'?true:assessment==='NOT_PRESENT'?false:null,
    evaluated:assessment!=='UNKNOWN',applicable:assessment!=='NOT_APPLICABLE',
    knowledge:assessment==='NOT_PRESENT'?'PRESENT':assessment};
}
export function createCompactSdk(options) {
  if (options.manifest.protocol && options.manifest.protocol !== 'compact-legacy-v1') throw new Error('COMPACT_PROTOCOL');
  return createCompactEngine(options);
}

// Raw strings only: decode anew for each caller so ethers Results are never
// shared mutable cache values. This helper is instantiated inside one engine;
// neither transport nor profile identity can be changed after construction.
export function createExactReadCache({identity,enabled=true,maxEntries=512,maxBytes=8*1024*1024,maxInflight=64}={}) {
  for(const n of [maxEntries,maxBytes,maxInflight])if(!Number.isSafeInteger(n)||n<1)throw Error('COMPACT_CACHE_LIMIT');
  const entries=new Map(),pending=new Map(),encoder=new TextEncoder();let bytes=0,active=0,generation=0;
  const totals={attempts:0,hits:0,misses:0,inflightHits:0,evictions:0,oversize:0};
  const size=value=>encoder.encode(value).byteLength;
  const remove=key=>{bytes-=entries.get(key).bytes;entries.delete(key);};
  return Object.freeze({
    async read(method,params,load,validate=()=>{}) {
      totals.attempts++;
      const key=JSON.stringify([identity,method,params]);
      if(enabled&&entries.has(key)){const entry=entries.get(key);entries.delete(key);entries.set(key,entry);totals.hits++;validate(entry.value);return entry.value;}
      if(enabled&&pending.has(key)){totals.inflightHits++;const value=await pending.get(key);validate(value);return value;}
      if(active>=maxInflight)throw Error('COMPACT_CACHE_INFLIGHT_LIMIT');
      totals.misses++;active++;const atGeneration=generation;
      const promise=Promise.resolve().then(load).then(value=>{
        if(typeof value!=='string')throw Error('COMPACT_CACHE_RAW_VALUE');
        validate(value);const accounted=size(key)+size(value);
        if(enabled&&atGeneration===generation){
          if(accounted>maxBytes)totals.oversize++;
          else {while(entries.size>=maxEntries||bytes+accounted>maxBytes){remove(entries.keys().next().value);totals.evictions++;}
            entries.set(key,{value,bytes:accounted});bytes+=accounted;}
        }
        return value;
      }).finally(()=>{active--;if(pending.get(key)===promise)pending.delete(key);});
      if(enabled)pending.set(key,promise);return promise;
    },
    clear(){generation++;entries.clear();pending.clear();bytes=0;},
    stats:()=>({...totals,entries:entries.size,bytes,inflight:active,maxEntries,maxBytes,maxInflight,enabled}),
  });
}

// Additive seam: guarded fixtures import this engine. Live-served legacy assets
// never import a new module (the existing server has a closed asset allowlist).
export function createCompactEngine({ethers: e, rpc: transport, manifest, journal,contentCodec,readCache={},onPhase=()=>{}}, protocolFactory) {
  const Z = e.ZeroHash, coder = e.AbiCoder.defaultAbiCoder();
  // Track transport failures by provenance, not message spelling. Local ABI,
  // journal and programming errors must not become persisted availability claims.
  const rpcFailures = new WeakSet();
  const rpc = async (...args) => {
    try {return await transport(...args);}
    catch (cause) {
      const error = cause && typeof cause === 'object' ? cause : new Error(String(cause));
      rpcFailures.add(error); throw error;
    }
  };
  const isRpcUnavailable = error => rpcFailures.has(error);
  const fail = (code) => {throw new Error(`COMPACT_${code}`);};
  const check = (condition, code) => {if (!condition) fail(code);};
  const eq = (a,b) => String(a).toLowerCase() === String(b).toLowerCase();
  const plain = value => JSON.parse(JSON.stringify(value,(_,v) => typeof v === 'bigint' ? String(v) : v));
  const freeze = value => {
    if (value && typeof value === 'object') {Object.values(value).forEach(freeze); Object.freeze(value);}
    return value;
  };
  const config = freeze(plain(manifest));
  const cache=createExactReadCache({identity:e.keccak256(e.toUtf8Bytes(JSON.stringify(config))),...readCache});
  const verifiedContexts=new Map();let contextBytes=0;
  const contextLimits={maxEntries:8,maxBytes:128*1024};
  // Chunk inputs rather than constructing an unbounded pending Promise queue.
  const readGroup=async(values,visit)=>{
    const out=[];for(let i=0;i<values.length;i+=16){
      const rows=await Promise.allSettled(values.slice(i,i+16).map((value,j)=>visit(value,i+j)));
      const failure=rows.find(row=>row.status==='rejected');if(failure)throw failure.reason;
      out.push(...rows.map(row=>row.value));
    }return out;
  };
  const directories=config.filesProfile==='typed-directory-v1';
  check(!config.filesProfile||(directories&&config.protocol==='compact-guarded-v2'),'FILES_PROFILE');
  const carriers=config.contentProfile==='raw-sha256-aesgcm-v2';
  check(!config.contentProfile||(carriers&&directories&&contentCodec),'CONTENT_PROFILE');
  const carrierKeys=['bytes','content','carrierRoot','carrierChild','concept'];
  const hash = (types,values) => e.keccak256(coder.encode(types,values));
  const purpose = Object.fromEntries(['head','folder','tag'].map(k => [k,e.id(`efs2/purpose/${k}/1`)]));
  const positionOf = (p,s,r) => hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),p,s,r]);
  const recordOf = (type,bodyHash) => hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),type,bodyHash]);
  const bindingOf = (author,position) => hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),e.zeroPadValue(author,32),position]);
  const contexts = new WeakSet(), continuations = new WeakMap(), plans = new WeakSet(), signedPlans = new WeakSet(), submissions = new Map();
  const interfaces = Object.fromEntries(Object.entries(config.contracts).map(([k,c]) => [k,new e.Interface(c.abi)]));
  // Select by the pinned deployment ABI, never by a failed live getter. Older
  // demos retain their original genesis-attachment qualification and code pins.
  const indexOriginGetter=interfaces.index.hasFunction('provenFrom()')?'provenFrom':'attachedFrom';
  const blockArg = context => ({blockHash:context.blockHash,requireCanonical:true});
  const rawRead=(method,params,validate)=>cache.read(method,params,async()=>{
    try{return await (transport.read?transport.read(method,params):rpc(method,params));}
    catch(cause){const error=cause&&typeof cause==='object'?cause:new Error(String(cause));rpcFailures.add(error);throw error;}
  },validate);
  const decode=(iface,fn,raw)=>{const value=iface.decodeFunctionResult(fn,raw);check(e.checkResultErrors(value).length===0,'ABI_RESULT');return value;};
  const call = async (key,fn,args,context) => {
    const data = interfaces[key].encodeFunctionData(fn,args);
    return decode(interfaces[key],fn,await rawRead('eth_call',[{to:config.contracts[key].address,data},blockArg(context)],raw=>decode(interfaces[key],fn,raw)));
  };
  const scalar = async (...args) => (await call(...args))[0];
  const code = (address,context) => rawRead('eth_getCode',[address,blockArg(context)],raw=>check(/^0x(?:[0-9a-f]{2})*$/i.test(raw),'CODE_BYTES'));
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
  const legacy = {
    selectors:async (args) => authorsOf(args.authors),
    lensHash:authors => e.keccak256(e.concat(authors.map(a => e.zeroPadValue(a,32)))),
    lensFields:authors=>({authors}), readContext:async()=>{},revisionEvidence:async()=>({}),watchPositions:false,unavailable:()=>false,
    signedPrincipal:async(author,context)=>{check(await code(author,context)==='0x','SIGNED_EOA_ONLY');return e.zeroPadValue(author,32);},
    resolve:(authors,p,s,r,c)=>call('lens','resolve',[authors,p,s,r],c),
    conflicts:(authors,p,s,r,c)=>call('lens','resolveNoTiebreak',[authors,p,s,r],c),
    list:(authors,p,s,cursor,budget,c)=>scalar('lens','list',[authors,p,s,cursor,budget],c),
    cursorMatches:(cursor,c)=>eq(cursor.coreCodeCommitment,c.core),
    name:(position,folder,role,c)=>scalar('names','readName',[position,folder,role,[c.admission,c.epoch,c.core]],c),
    authorization:async({intent,actionsHash,context})=>({intent,digest:await scalar('ledger','intentDigest',[intent,actionsHash],context),
      publicationId:hash(['address','uint64','bytes32'],[intent.author,intent.nonce,actionsHash])}),
    encode:(plan,signature)=>interfaces.ledger.encodeFunctionData('executeSigned',[plan.intent,plan.actions,plan.bodies,signature]),
    preflight:async()=>{},
    verifyJournal:(entry,id)=>{
      const p=entry.plan, pub=hash(['address','uint64','bytes32'],[p.intent.author,p.intent.nonce,p.actionsHash]);
      check(eq(pub,p.publicationId)&&eq(id,hash(['uint256','address','bytes32'],[p.basis.chainId,addresses.ledger,pub])),'JOURNAL_INTEGRITY');
    },
    verifyRetained:async(plan,publication,retained,c)=>eq(await scalar('ledger','intentDigest',[plan.intent,plan.actionsHash],c),plan.digest),
    history:(plan,expected,asOf,c)=>call('lens','history',[plan.intent.author,expected.position,asOf],c),
    principal:plan=>e.zeroPadValue(plan.intent.author,32),
    recoveryError:null,capabilities:{protocol:'compact-legacy-v1',guardedWrites:false},
  };
  const protocol = {...legacy,...protocolFactory?.({e,rpc,isRpcUnavailable,config,hash,eq,check,fail,plain,freeze,call,scalar,code,readGroup,addresses,interfaces,blockArg,positionOf,recordOf,bindingOf})};
  const basisFor = (context,authors,policy='ordered') => ({...context,
    lens:{address:addresses.lens,codeHash:config.contracts.lens.codeHash,policy,
      ...protocol.lensFields(authors ?? []), hash:authors ? protocol.lensHash(authors) : null},
  });
  const result = (context,knowledge,coverage,value,extra={}) => ({basis:context,knowledge,coverage,value,...extra});

  async function validateProfile(context) {
    await readGroup(Object.entries(config.contracts),async([key,c])=>{
      check(c.codeHash && !eq(c.codeHash,Z),'MANIFEST_CODE');
      const runtime = await code(c.address,context);
      check(runtime !== '0x' && eq(e.keccak256(runtime),c.codeHash),`CODE_${key}`);
    });
    await readGroup([
      ['ledger','registry','registry'],['ledger','indexModule','index'],
      ['lens','ledger','ledger'],['lens','index','index'],['index','ledger','ledger'],
      ['files','ledger','ledger'],['files','lensReader','lens'],['files','filesIndex','index'],
      ['names','ledger','ledger'],['names','source','ledger'],
      ...(config.contracts.joined?[['joined','ledger','ledger'],['joined','lens','lens'],['joined','index','index']]:[]),
    ],async([key,fn,target])=>check(eq(await scalar(key,fn,[],context),addresses[target]),'BINDING'));
    await readGroup(['root','child','name',...(directories?['directory']:[])],async type=>{
      const id = config.types[type], expected = config.ruleHashes[type];
      check(id && expected && !eq(id,Z) && !eq(expected,Z),'PROFILE');
      const [d,refValues] = await Promise.all([call('registry','descriptor',[id],context),scalar('registry','refTypes',[id],context)]);
      const refs = Array.from(refValues);
      const shape = e.id(`lab/type/files-${type === 'name' ? 'name-raw-ascii' : type==='directory'?'directory':`joined-${type}`}/1`);
      const count = type === 'child' ? 1 : 0;
      check(eq(d[0],shape) && eq(d[1],expected) && Number(d[3]) === count && refs.length === count
        && (!count || eq(refs[0],Z)) && eq(e.keccak256(await code(d[2],context)),expected),'PROFILE');
      check(eq(hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/type/1'),shape,hash(['bytes32[]'],[refs]),expected]),id),'TYPE_ID');
      for (const key of type==='directory'?['index']:type === 'name' ? ['index','names'] : ['index','files']) {
        check(eq(await scalar(key,`${type}Type`,[],context),id),'PROFILE');
        check(eq(await scalar(key,`expected${type[0].toUpperCase()}${type.slice(1)}RuleHash`,[],context),expected),'PROFILE');
      }
      if (type === 'child') {
        const iface = new e.Interface(['function rootType() view returns(bytes32)']);
        const raw = await rawRead('eth_call',[{to:d[2],data:iface.encodeFunctionData('rootType')},blockArg(context)],raw=>decode(iface,'rootType',raw));
        check(eq(iface.decodeFunctionResult('rootType',raw)[0],config.types.root),'PROFILE');
      }
    });
    check(eq(await scalar('ledger','coreCodeCommitment',[],context),context.core),'CORE');
    check(eq(await scalar('names','coreCodehash',[],context),context.core),'CORE');
    if(carriers)await readGroup(carrierKeys,async(key,i)=>{
      const type=config.types[key],expected=config.ruleHashes[key];
      const shape=e.id(`lab/type/files-${['bytes','content','carrier-root','carrier-child','concept'][i]}/1`);
      const refs=i===1?[config.types.bytes]:i===2?[config.types.content]:i===3?[Z,config.types.content]:[];
      const [d,refValues]=await Promise.all([call('registry','descriptor',[type],context),scalar('registry','refTypes',[type],context)]),actual=Array.from(refValues);
      check(type&&expected&&!eq(expected,Z)&&eq(d[0],shape)&&eq(d[1],expected)&&Number(d[3])===refs.length
        &&actual.length===refs.length&&actual.every((r,j)=>eq(r,refs[j]))&&eq(e.keccak256(await code(d[2],context)),expected)
        &&eq(hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/type/1'),shape,hash(['bytes32[]'],[refs]),expected]),type),'CONTENT_PROFILE');
      check(eq(await scalar('index','carrierTypes',[i],context),type)&&eq(await scalar('index','carrierRuleHashes',[i],context),expected),'CONTENT_PROFILE');
    });
  }

  async function pinAt(block) {
    check(block?.hash && block?.number,'BLOCK_UNAVAILABLE');
    const chainId = String(BigInt(await rpc('eth_chainId',[])));
    check(chainId === String(BigInt(config.chainId)),'CHAIN');
    const context = {chainId,blockHash:block.hash,blockNumber:String(BigInt(block.number)),
      timestamp:String(BigInt(block.timestamp)), core:config.contracts.ledger.codeHash,
      ledger:addresses.ledger,index:addresses.index,grade:'RPC_OBSERVED'};
    await canonical(context);
    const cached=verifiedContexts.get(context.blockHash);
    if(cached){check(cached.value.blockNumber===context.blockNumber&&cached.value.timestamp===context.timestamp,'BLOCK_METADATA');
      verifiedContexts.delete(context.blockHash);verifiedContexts.set(context.blockHash,cached);
      const fresh=freeze({...cached.value});contexts.add(fresh);return fresh;}
    try {
    [context.admission,context.generation,context.epoch] = (await Promise.all([
      scalar('ledger','counts',[],context),scalar('index','generation',[],context),scalar('registry','epoch',[],context),
    ])).map(String);
    await validateProfile(context);
    await protocol.readContext(context);
    await canonical(context);
    freeze(context); contexts.add(context);
    if(readCache.enabled!==false){const bytes=new TextEncoder().encode(JSON.stringify(context)+context.blockHash).byteLength;
      if(verifiedContexts.has(context.blockHash)){contextBytes-=verifiedContexts.get(context.blockHash).bytes;verifiedContexts.delete(context.blockHash);}
      if(bytes<=contextLimits.maxBytes){while(verifiedContexts.size>=contextLimits.maxEntries||contextBytes+bytes>contextLimits.maxBytes){
        const key=verifiedContexts.keys().next().value;contextBytes-=verifiedContexts.get(key).bytes;verifiedContexts.delete(key);}
        verifiedContexts.set(context.blockHash,{value:context,bytes});contextBytes+=bytes;}}
    return context;
    }catch(error){cache.clear();throw error;}
  }
  const pin = async () => pinAt(await rpc('eth_getBlockByNumber',['latest',false]));
  async function canonical(context) {
    const canonical = await rpc('eth_getBlockByNumber',[e.toQuantity(BigInt(context.blockNumber)),false]);
    check(eq(canonical?.hash,context.blockHash),'BLOCK_REORG');
  }
  async function guard(context) {
    check(contexts.has(context),'CONTEXT');
    await canonical(context);
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
    let cell;
    try {cell = await call('ledger','positionCell',[position],context);}
    catch(error){if(!isRpcUnavailable(error))throw error;return result(basisFor(context),'UNKNOWN','PARTIAL',null,{reason:'NAME_COORDINATE_UNAVAILABLE'});}
    check(eq(cell[0],purpose.folder) && eq(cell[1],folder) && eq(cell[2],role)
      && eq(position,positionOf(purpose.folder,folder,role)),'POSITION');
    let record;
    try {record = await protocol.name(position,folder,role,context);}
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
    return freeze(await nameAt({...args,folder:await folderFor(args.folder,args.context)}));
  }
  async function directoryAt(directory,context) {
    check(directories,'DIRECTORY_PROFILE');
    try {
      const [t,first,,body]=await call('ledger','record',[directory],context);
      check(eq(t,config.types.directory)&&first>0n&&first<=BigInt(context.admission)
        &&e.getBytes(body).length===32&&eq(recordOf(t,e.keccak256(body)),directory),'DIRECTORY_INTEGRITY');
      const seed=body,created=await scalar('ledger','subjectCreatedAt',[seed],context);
      check(!eq(seed,Z)&&created>0n&&created<=first,'DIRECTORY_INTEGRITY');
      const admission=await call('ledger','admission',[first],context);
      check(Number(admission[0])===1&&eq(admission[6],e.keccak256(body))&&eq(admission[7],t),'DIRECTORY_INTEGRITY');
      return result(basisFor(context),'PRESENT','COMPLETE',{directory,seed,typeId:t,firstAdmission:String(first)});
    } catch(error) {
      if(!isRpcUnavailable(error)&&!String(error.message).startsWith('COMPACT_DIRECTORY_INTEGRITY'))throw error;
      return result(basisFor(context),isRpcUnavailable(error)?'UNKNOWN':'INVALID','PARTIAL',null,
        {reason:isRpcUnavailable(error)?'DIRECTORY_UNAVAILABLE':'DIRECTORY_INTEGRITY'});
    }
  }
  async function readDirectory({directory,context}) {await guard(context);return freeze(await directoryAt(directory,context));}
  async function folderFor(folder,context) {
    if(!directories)return mounted(folder);
    const id=folder??config.folder,qualified=await directoryAt(id,context);
    check(qualified.knowledge==='PRESENT',qualified.reason);return id;
  }
  async function targetAt(target,context) {
    try {
      const created=await scalar('ledger','subjectCreatedAt',[target],context);
      if(!eq(target,Z)&&created>0n&&created<=BigInt(context.admission))return {kind:'file',knowledge:'PRESENT'};
      const d=await directoryAt(target,context);
      return {kind:d.knowledge==='PRESENT'?'directory':d.knowledge==='UNKNOWN'?'unknown':'invalid',knowledge:d.knowledge,descriptor:d};
    }catch(error){if(!isRpcUnavailable(error))throw error;return {kind:'unknown',knowledge:'UNKNOWN',reason:'TARGET_UNAVAILABLE'};}
  }
  async function readPlacement(args) {
    await guard(args.context);check(directories,'DIRECTORY_PROFILE');
    const folder=args.folder??config.folder,parent=await directoryAt(folder,args.context);
    if(parent.knowledge!=='PRESENT')return freeze({...parent,value:{folder},reason:parent.reason});
    const bytes=bytesOf(args.name);validName(bytes);const role=e.keccak256(bytes),authors=await protocol.selectors(args,args.context);
    try {
      const selected=await resolve(authors,purpose.folder,folder,role,args.context),position=positionOf(purpose.folder,folder,role);
      const value={folder,role,position,selection:selected};
      if(selected.status!==1)return freeze(result(basisFor(args.context,authors),['ABSENT','PRESENT','MASKED','CONFLICT'][selected.status],'COMPLETE',value));
      const classification=await targetAt(selected.target,args.context),name=await nameAt({folder,role,position,context:args.context});
      const knowledge=classification.knowledge==='PRESENT'?name.knowledge:classification.knowledge;
      return freeze(result(basisFor(args.context,authors),knowledge,knowledge==='PRESENT'?'COMPLETE':'PARTIAL',
        {...value,target:selected.target,...classification,name}));
    }catch(error){
      if(!isRpcUnavailable(error))throw error;
      return freeze(result(basisFor(args.context,authors),'UNKNOWN','PARTIAL',{folder,role},{reason:'PLACEMENT_UNAVAILABLE'}));
    }
  }
  function selection(values) {
    const [status,target,revision,author,admission] = values;
    check(Number(status) >= 0 && Number(status) <= 3,'SELECTION');
    return {status:Number(status),target,revision:Number(revision),author,admission:String(admission)};
  }
  async function resolve(authors,p,subject,role,context) {
    const s = selection(await protocol.resolve(authors,p,subject,role,context));
    check(BigInt(s.admission) <= BigInt(context.admission)
      && (s.status === 0 || (BigInt(s.admission) > 0n && authors.some(a => eq(a,s.author)))),'SELECTION');
    return s;
  }
  async function revisionAt(recordId,file,context) {
    const [typeId,first,occurrences,body] = await call('ledger','record',[recordId],context);
    const carrier=carriers&&(eq(typeId,config.types.carrierRoot)||eq(typeId,config.types.carrierChild));
    const bytes = e.getBytes(body), child = eq(typeId,config.types.child)||(carrier&&eq(typeId,config.types.carrierChild)), prefix = (child ? 64 : 32)+(carrier?32:0);
    check((carrier || child || eq(typeId,config.types.root)) && first > 0n && first <= BigInt(context.admission)
      && bytes.length >= prefix && bytes.length <= 8192 && eq(recordOf(typeId,e.keccak256(body)),recordId),'FILE_PROFILE');
    check(!carrier||bytes.length===prefix,'FILE_PROFILE');
    const embeddedFile = e.hexlify(bytes.slice(prefix-32,prefix));
    const parent = child ? e.hexlify(bytes.slice(0,32)) : Z;
    check(eq(embeddedFile,file),'FILE_ID');
    const created = await scalar('ledger','subjectCreatedAt',[file],context);
    check(!eq(file,Z) && created > 0n && created <= BigInt(context.admission),'FILE_SUBJECT');
    const admission = await call('ledger','admission',[first],context);
    check(Number(admission[0]) === 1 && eq(admission[6],e.keccak256(body)) && eq(admission[7],typeId),'FILE_ADMISSION');
    if (child) {
      const [pt,pf,,pb] = await call('ledger','record',[parent],context), pbytes = e.getBytes(pb);
      const parentCarrier=carriers&&(eq(pt,config.types.carrierRoot)||eq(pt,config.types.carrierChild));
      const pp = eq(pt,config.types.root) ? 32 : eq(pt,config.types.child) ? 64 : carrier&&parentCarrier ? (eq(pt,config.types.carrierRoot)?64:96) : 0;
      check(pp && pf > 0n && pf < first && pbytes.length >= pp && pbytes.length <= 8192
        &&(!parentCarrier||pbytes.length===pp)
        && eq(recordOf(pt,e.keccak256(pb)),parent) && eq(e.hexlify(pbytes.slice(pp-32,pp)),file),'FILE_PARENT');
    }
    const document = carrier?null:e.hexlify(bytes.slice(prefix));
    const descriptorRecord=carrier?e.hexlify(bytes.slice(prefix-64,prefix-32)):null;
    return {recordId,typeId,file,parent,document,documentHash:carrier?null:e.keccak256(document),
      ...(carrier?{profile:'carrier-v1',descriptorRecord,content:await descriptorAt(descriptorRecord,context,first)}:{profile:'legacy-inline'}),...await protocol.revisionEvidence(admission[2],context),
      firstAdmission:String(first),occurrences:String(occurrences),maintenance:'RETAINED_OCCURRENCE_COUNT',validity:'NOT_ASSESSED'};
  }
  async function retainedAt(id,type,context,through=BigInt(context.admission)) {
    const [t,first,,body]=await call('ledger','record',[id],context);
    check(eq(t,type)&&first>0n&&first<=through&&eq(recordOf(t,e.keccak256(body)),id),'CONTENT_INTEGRITY');
    const a=await call('ledger','admission',[first],context);
    check(Number(a[0])===1&&eq(a[6],e.keccak256(body))&&eq(a[7],type),'CONTENT_INTEGRITY');
    return {body,firstAdmission:String(first)};
  }
  // Raw exact-Record evidence, NOT a Files revision and NOT application validity.
  // No Lens selection: callers supply the exact immutable Record. The envelope
  // retains the pinned basis, original bytes and historical admission provenance.
  async function readTypedRecord({record,context}) {
    check(contexts.has(context),'CONTEXT');
    const answer=(knowledge,coverage,value,reason)=>freeze(result(context,knowledge,coverage,value,reason?{reason}:{}));
    try {
      await guard(context);
      const [typeId,first,occurrences,body]=await call('ledger','record',[record],context);
      if(first===0n){check(eq(typeId,Z)&&occurrences===0n&&body==='0x','RECORD_INTEGRITY');return answer('ABSENT','COMPLETE',null);}
      check(first<=BigInt(context.admission)&&e.getBytes(body).length<=8192&&eq(recordOf(typeId,e.keccak256(body)),record),'RECORD_INTEGRITY');
      const d=await call('registry','descriptor',[typeId],context),refs=Array.from(await scalar('registry','refTypes',[typeId],context));
      check(refs.length===Number(d[3])&&Number(d[3])<=8,'RECORD_DESCRIPTOR');
      check(eq(hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/type/1'),d[0],hash(['bytes32[]'],[refs]),d[1]]),typeId),'RECORD_TYPE_ID');
      if(eq(d[1],Z))check(eq(d[2],e.ZeroAddress),'RECORD_RULE');
      else {const runtime=await code(d[2],context);check(runtime!=='0x'&&eq(e.keccak256(runtime),d[1]),'RECORD_RULE');}
      const a=await call('ledger','admission',[first],context),acceptance=await call('ledger','acceptanceBasis',[first],context);
      check(Number(a[0])===1&&eq(a[6],e.keccak256(body))&&eq(a[7],typeId),'RECORD_ADMISSION');
      check(eq(acceptance[0],typeId)&&eq(acceptance[2],d[2])&&eq(acceptance[3],d[1])&&acceptance[1]>0n,'RECORD_ACCEPTANCE');
      const publication=await call('ledger','evidence',[a[2]],context);
      check(publication[4]+BigInt(a[1])===first&&Number(a[1])<Number(publication[3])&&publication[9]<=BigInt(context.blockNumber),'RECORD_PUBLICATION');
      await guard(context);
      return answer('PRESENT','COMPLETE',{recordId:record,typeId,body,bodyHash:e.keccak256(body),firstAdmission:String(first),occurrences:String(occurrences),
        descriptor:{shape:d[0],ruleId:d[1],mandatoryAcceptor:d[2],refTypes:refs},acceptance:plain(Array.from(acceptance)),
        provenance:{author:publication[0],proofKind:Number(publication[1]),publication:String(a[2]),leaf:Number(a[1]),withdrawn:a[5],
          ...await protocol.revisionEvidence(a[2],context)},validity:'NOT_ASSESSED',maintenance:'RETAINED_OCCURRENCE_COUNT'});
    }catch(error){
      if(isRpcUnavailable(error))return answer('UNKNOWN','PARTIAL',null,'RECORD_UNAVAILABLE');
      if(['COMPACT_HISTORY_UNAVAILABLE','COMPACT_BLOCK_REORG'].includes(error.message))
        return answer('UNKNOWN','PARTIAL',null,error.message);
      if(error.message?.startsWith('COMPACT_'))return answer('INVALID','PARTIAL',null,error.message);
      throw error;
    }
  }
  async function descriptorAt(id,context,through) {
    const retained=await retainedAt(id,config.types.content,context,through);
    let descriptor;try{descriptor=contentCodec.decodeDescriptor(e.getBytes(retained.body));}catch{fail('CONTENT_INTEGRITY');}
    return {...descriptor,recordId:id,firstAdmission:retained.firstAdmission};
  }
  async function readContent(args) {
    check(carriers,'CONTENT_PROFILE');await guard(args.context);
    let revision,selection=null;
    if(args.record)revision=await revisionAt(args.record,args.file,args.context);
    else {const point=await fileAt({...args,authors:await protocol.selectors(args,args.context)});revision=point.value.revision;selection=point.value.selection;
      if(!revision)return {state:'UNAVAILABLE',reason:point.reason??point.knowledge,basis:point.basis,selection};}
    const extra={basis:args.context,file:args.file,recordId:revision.recordId,selection};
    if(revision.profile==='legacy-inline')return {...extra,state:'AVAILABLE_VERIFIED',bytes:e.getBytes(revision.document),plaintextVerified:true,profile:'legacy-inline'};
    const d=revision.content;
    const loadCarrier=async(descriptor,limits)=>{
      if(descriptor.carrier===1){check(args.loadCarrier,'CARRIER_UNAVAILABLE');return args.loadCarrier(descriptor,limits);}
      const stored=await retainedAt('0x'+descriptor.inline,config.types.bytes,args.context,BigInt(d.firstAdmission));
      const body=e.getBytes(stored.body);check(body.length>=32&&eq(e.hexlify(body.slice(0,32)),'0x'+descriptor.digest),'CONTENT_INTEGRITY');return body.slice(32);
    };
    return {...extra,descriptor:d,...await contentCodec.openContent(d,{loadCarrier,signal:args.signal,maxBytes:args.maxBytes,key:args.key})};
  }
  function conceptBody(namespace,label) {
    check(/^0x[0-9a-f]{64}$/i.test(namespace)&&!eq(namespace,Z)&&typeof label==='string'&&/^[\x20-\x7e]{1,128}$/.test(label),'CONCEPT_LABEL');
    return e.concat([namespace,e.toUtf8Bytes(label)]);
  }
  function conceptId({namespace,label}) {check(carriers,'CONTENT_PROFILE');return recordOf(config.types.concept,e.keccak256(conceptBody(namespace,label)));}
  async function conceptAt(concept,context) {
    try {
      const [t,first]=await call('ledger','record',[concept],context);
      if(eq(t,Z)&&first===0n)return result(basisFor(context),'UNKNOWN','PARTIAL',null,{reason:'CONCEPT_MISSING',legacyHashedTextNotReinterpreted:true});
      const retained=await retainedAt(concept,config.types.concept,context),bytes=e.getBytes(retained.body);
      const namespace=e.hexlify(bytes.slice(0,32)),label=e.toUtf8String(bytes.slice(32));conceptBody(namespace,label);
      return result(basisFor(context),'PRESENT','COMPLETE',{concept,namespace,label,firstAdmission:retained.firstAdmission,authority:'NOT_INFERRED'});
    }catch(error){if(!isRpcUnavailable(error)&&!/^COMPACT_/.test(error.message))throw error;
      return result(basisFor(context),isRpcUnavailable(error)?'UNKNOWN':'INVALID','PARTIAL',null,{reason:'CONCEPT_UNAVAILABLE_OR_INVALID'});}
  }
  async function readConcept({concept,context}) {check(carriers,'CONTENT_PROFILE');await guard(context);return freeze(await conceptAt(concept,context));}
  async function readTag(args) {await guard(args.context);const authors=await protocol.selectors(args,args.context);
    const tag=await tagAt(authors,args.subject,args.concept,args.target,args.context);
    return freeze(result(basisFor(args.context,authors),tag.knowledge,tag.assessment==='UNKNOWN'?'PARTIAL':'COMPLETE',tag));}
  async function tagAt(authors,subject,concept,file,context) {
    if(eq(concept,Z))return normalizeTagAssessment({subject,concept});
    let s;
    try{s=await resolve(authors,purpose.tag,subject,concept,context);}
    catch(error){if(!isRpcUnavailable(error))throw error;return normalizeTagAssessment({subject,concept,reason:'TAG_UNAVAILABLE'});}
    return normalizeTagAssessment({subject,concept,selection:s,
      assessment:s.status===1?(eq(s.target,file)?'PRESENT':'NOT_PRESENT'):[0,2].includes(s.status)?'NOT_PRESENT':'UNKNOWN',
      ...(carriers?{label:await conceptAt(concept,context)}:{legacy:true})});
  }
  async function fileAt({file,authors,concept=Z,context,policy='ordered'}) {
    check(policy === 'ordered' || policy === 'no-tiebreak','LENS_POLICY');
    let s, candidates = [];
    if (policy === 'ordered') s = await resolve(authors,purpose.head,file,Z,context);
    else {
      const [status,entries] = await protocol.conflicts(authors,purpose.head,file,Z,context);
      s = {status:Number(status),target:Z,revision:0,author:e.ZeroAddress,admission:'0'};
      for (const entry of entries) {
        check(eq(entry.position,positionOf(purpose.head,file,Z)) && entry.admission > 0n
          && entry.admission <= BigInt(context.admission) && authors.some(a => eq(a,entry.author)),'SELECTION');
        const candidateSelection = selection([1,entry.target,entry.revision,entry.author,entry.admission]);
        let revision=null,knowledge='PRESENT';
        try {revision=await revisionAt(entry.target,file,context);}
        catch(error) {knowledge=String(error?.message).startsWith('COMPACT_')&&!protocol.unavailable(error)?'INVALID':'UNKNOWN';}
        candidates.push({selection:candidateSelection,revision,knowledge});
      }
      if (s.status === 1) {check(candidates.length === 1,'SELECTION'); s = candidates[0].selection;}
    }
    let revision = null, revisionFailure = null;
    if (s.status === 1) {
      try {revision = await revisionAt(s.target,file,context);}
      catch (error) {
        const invalid = String(error?.message).startsWith('COMPACT_')&&!protocol.unavailable(error);
        revisionFailure = {knowledge:invalid ? 'INVALID' : 'UNKNOWN',reason:invalid ? 'FILE_INTEGRITY' : 'BYTES_UNAVAILABLE'};
      }
    }
    const value = {file,selection:s,revision,candidates,
      fileTag:await tagAt(authors,file,concept,file,context),
      revisionTag:revision ? await tagAt(authors,revision.recordId,concept,file,context)
        : normalizeTagAssessment({subject:s.status===1?s.target:null,concept}),
    };
    return result(basisFor(context,authors,policy),revisionFailure?.knowledge ?? ['ABSENT','PRESENT','MASKED','CONFLICT'][s.status],
      revisionFailure || candidates.some(c=>c.knowledge!=='PRESENT') ? 'PARTIAL' : 'COMPLETE',value,revisionFailure ? {reason:revisionFailure.reason} : {});
  }
  async function readFile(args) {
    await guard(args.context);
    return freeze(await fileAt({...args,authors:await protocol.selectors(args,args.context)}));
  }

  const emptyCursor = () => [0,0,0,Z,Z,Z,Z,0,0,0];
  // Page bytes share the finite exact-hash raw-read budget. Continuations remain
  // private capabilities; they are not transferable serialized cursors.
  const joinedContinuations=new WeakMap();
  async function listFolderPage(args={}) {
    check(carriers&&config.contracts.joined,'JOINED_PROFILE');
    const {context,continuation}=args;check(contexts.has(context),'CONTEXT');
    check(!('cursor' in args),'CURSOR_NOT_ACCEPTED');
    const suppliedSelectors=args.authors??args.principals;
    check(Array.isArray(suppliedSelectors)&&suppliedSelectors.length>0&&suppliedSelectors.length<=64,'LENS');
    const authors=await protocol.selectors(args,context);
    const basis=basisFor(context,authors,args.policy??'ordered');
    check(authors.length<=64,'LENS');
    const folder=args.folder??config.folder,budget=args.budget??32,concept=args.concept??Z;
    const scope=args.tagScope??'none',policy=args.policy??'ordered',search=(args.search??'').toLowerCase();
    check(Number.isInteger(budget)&&budget>=1&&budget<=256,'BUDGET');
    check(['none','file','revision','either'].includes(scope)&&['ordered','no-tiebreak'].includes(policy)
      &&typeof search==='string'&&e.toUtf8Bytes(search).length<=255&&(scope==='none'||!eq(concept,Z)),'QUERY');
    const query=[concept,['none','file','revision','either'].indexOf(scope),policy==='no-tiebreak',search];
    const queryId=hash(['bytes32','bytes32','bytes32','uint8','bool','string'],[folder,basis.lens.hash,...query]);
    let walk={cursor:'0x',scanned:0n,selected:0n,retained:0n,knownMatch:false,rawTotal:null};
    if(continuation!==undefined){walk=joinedContinuations.get(continuation);
      check(walk&&walk.context===context&&eq(walk.queryId,queryId),'CONTINUATION');}
    const unavailable=reason=>freeze({kind:'files-joined-page',basis,pageRows:[],queryKnowledge:walk.knownMatch?'PRESENT':'UNKNOWN',queryCoverage:'UNKNOWN',
      scanStatus:'UNKNOWN',segmentStartsAtOrigin:walk.cursor==='0x',segmentCompleteFromOrigin:false,
      scanned:null,scannedSoFar:String(walk.scanned),rawTotal:walk.rawTotal===null?null:String(walk.rawTotal),selectedSoFar:String(walk.selected),hydrations:null,
      completeFromOwnedOrigin:false,queryAbsent:false,retainedSoFar:String(walk.retained),filtered:scope!=='none'||search!=='',reason,
      nameCoverage:'PARTIAL',kindCoverage:'PARTIAL',headerCoverage:'PARTIAL',tagCoverage:'PARTIAL',tagCoverageScope:'PAGE'});
    const canonical=await rpc('eth_getBlockByNumber',[e.toQuantity(BigInt(context.blockNumber)),false]);
    check(eq(canonical?.hash,context.blockHash),'BLOCK_REORG');
    let page;
    try{page=await scalar('joined','readPage',[folder,authors,query,[context.admission,context.generation,context.epoch,context.executionSet],walk.cursor,budget],context);}
    catch(error){if(!isRpcUnavailable(error))throw error;return unavailable('JOINED_UNAVAILABLE');}
    const placement=Number(page.scanStatus),scanned=walk.scanned+page.scanned;
    check(page.startsAtOrigin===(walk.cursor==='0x')&&page.completeFromOrigin===(page.startsAtOrigin&&placement===2&&page.scanned===page.rawTotal),'PAGE_ORIGIN');
    if(placement===0)return unavailable('INDEX_COVERAGE');
    check((placement===1||placement===2)&&page.scanned<=BigInt(budget)&&scanned<=page.rawTotal
      &&page.selectedSoFar>=walk.selected&&(walk.rawTotal===null||walk.rawTotal===page.rawTotal),'PAGE');
    check(placement===1?page.scanned>0n&&page.continuation!=='0x':scanned===page.rawTotal&&page.continuation==='0x','INCOMPLETE_TRAVERSAL');
    const selected=s=>({status:Number(s.status),target:s.target,revision:Number(s.revision),author:s.principalId,admission:String(s.admission)});
    const qualification=q=>({0:'UNKNOWN',1:'PRESENT',2:'NOT_APPLICABLE',3:'INVALID',4:'UNSUPPORTED'})[Number(q)];
    const tag=t=>normalizeTagAssessment({subject:eq(t.subject,Z)?null:t.subject,concept,selection:selected(t.selection),
      assessment:eq(concept,Z)?'UNKNOWN':Number(t.qualification)===2?'NOT_APPLICABLE':Number(t.qualification)===1
        ?t.present===true?'PRESENT':t.present===false?'NOT_PRESENT':'UNKNOWN':'UNKNOWN'});
    const rows=page.rows.map(row=>{
      const entry=row.placement,n=row.name,h=row.header,kind=Number(row.kind)===1?'file':Number(row.kind)===2?'directory':'unsupported';
      check(entry.admission>0n&&entry.admission<=BigInt(context.admission)&&authors.some(a=>eq(a,entry.principalId))
        &&eq(entry.position,positionOf(purpose.folder,folder,row.role)),'MEMBERSHIP');
      let name=result(basis,qualification(n.qualification),Number(n.qualification)===1?'COMPLETE':'PARTIAL',null,{recordId:n.recordId,firstAdmission:String(n.firstAdmission)});
      if(Number(n.qualification)===1){name.value=validName(e.getBytes(n.value));check(eq(e.keccak256(n.value),row.role)&&eq(recordOf(config.types.name,row.role),n.recordId),'NAME_INTEGRITY');}
      const head=selected(row.head),headerKnowledge=qualification(h.qualification);
      const revision=head.status===1?{recordId:h.recordId,typeId:h.typeId,firstAdmission:String(h.firstAdmission),bodyLength:Number(h.bodyLength),
        parent:h.parent,file:entry.target,descriptorRecord:eq(h.descriptor,Z)?null:h.descriptor,
        profile:eq(h.descriptor,Z)?'legacy-inline':'carrier-v1',assurance:Number(h.qualification)===1?'HEADER_VERIFIED_BODY_NOT_FETCHED':'HEADER_UNVERIFIED_BODY_NOT_FETCHED',knowledge:headerKnowledge,carrierAvailability:'NOT_FETCHED'}:null;
      const knowledge=kind==='directory'?'PRESENT':kind==='unsupported'?'UNSUPPORTED':head.status===1?headerKnowledge:['ABSENT','PRESENT','MASKED','CONFLICT','UNKNOWN'][head.status];
      const keyedRevisionTag=tag(row.revisionTag);
      // A successful keyed lookup alone does not qualify a selected revision.
      // Keep its provenance and exact selected subject without certifying a tag
      // on an unavailable/invalid revision (the point reader has the same gate).
      const revisionTag=kind==='file'&&(head.status!==1||headerKnowledge!=='PRESENT')
        ?normalizeTagAssessment({...keyedRevisionTag,subject:head.status===1?head.target:null,assessment:'UNKNOWN'}):keyedRevisionTag;
      const value={file:entry.target,selection:kind==='directory'?null:head,revision,fileTag:tag(row.stableTag),revisionTag};
      return {file:entry.target,target:entry.target,kind,knowledge:kind==='unsupported'?'UNSUPPORTED':'PRESENT',position:entry.position,folder,role:row.role,
        selection:{status:1,target:entry.target,revision:Number(entry.revision),author:entry.principalId,admission:String(entry.admission)},name,
        point:result(basis,knowledge,kind==='directory'||head.status===0||head.status===2||headerKnowledge==='PRESENT'?'COMPLETE':'PARTIAL',value),
        match:({0:'UNKNOWN',1:'MATCH',2:'NONMATCH'})[Number(row.matchStatus)]};
    });
    const retained=walk.retained+BigInt(rows.length),knownMatch=walk.knownMatch||rows.some(row=>row.match==='MATCH'),completeFromOwnedOrigin=placement===2&&scanned===page.rawTotal;
    const extra={scanned:String(page.scanned),scannedSoFar:String(scanned),rawTotal:String(page.rawTotal),selectedSoFar:String(page.selectedSoFar),retainedSoFar:String(retained),hydrations:String(page.hydrations),
      nameCoverage:rows.every(r=>r.name.knowledge==='PRESENT')?'COMPLETE':'PARTIAL',kindCoverage:rows.every(r=>r.kind!=='unsupported')?'COMPLETE':'PARTIAL',
      headerCoverage:rows.every(r=>r.kind==='directory'||r.point.value.revision?.knowledge==='PRESENT')?'COMPLETE':'PARTIAL',
      // Both tag joins are requested whenever concept != 0, even without a tag
      // filter. Match status is independent (notably positive OR + unknown).
      // This covers returned page rows only, never earlier continuation pages.
      tagCoverage:eq(concept,Z)||rows.every(r=>[r.point.value.fileTag,r.point.value.revisionTag].every(t=>t.assessment!=='UNKNOWN'))?'COMPLETE':'PARTIAL',
      tagCoverageScope:'PAGE',filtered:scope!=='none'||search!=='',
      scanStatus:['UNKNOWN','PARTIAL','EXHAUSTED'][placement],segmentStartsAtOrigin:page.startsAtOrigin,segmentCompleteFromOrigin:page.completeFromOrigin,
      completeFromOwnedOrigin,queryAbsent:completeFromOwnedOrigin&&retained===0n};
    if(placement===1){const token=Object.freeze({kind:'compact-joined-page-continuation'});
      joinedContinuations.set(token,{context,queryId,cursor:page.continuation,scanned,selected:page.selectedSoFar,retained,knownMatch,rawTotal:page.rawTotal});extra.continuation=token;}
    return freeze({kind:'files-joined-page',basis,pageRows:rows,queryKnowledge:knownMatch?'PRESENT':completeFromOwnedOrigin&&retained===0n?'ABSENT':'UNKNOWN',
      queryCoverage:placement===2?'COMPLETE':'PARTIAL',...extra});
  }
  async function listFolder(args={}) {
    const {context,continuation} = args;
    check(!('cursor' in args),'CURSOR_NOT_ACCEPTED');
    await guard(context);
    const folder=directories?(args.folder??config.folder):mounted(args.folder);
    if(directories){const d=await directoryAt(folder,context);if(d.knowledge!=='PRESENT')return freeze({...d,value:[],nameCoverage:'PARTIAL',kindCoverage:'PARTIAL'});}
    const authors = await protocol.selectors(args,context);
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
      || await scalar('index',indexOriginGetter,[],context) !== 1n) {
      return result(basis,'UNKNOWN','UNKNOWN',walk.rows,{nameCoverage:'PARTIAL',reason:'INDEX_COVERAGE'});
    }
    const page = await protocol.list(authors,purpose.folder,folder,walk.cursor,budget,context);
    const next = page.next, scanned = walk.scanned + page.scanned;
    check(!page.mutated && String(next.basisAdmission) === context.admission && String(next.indexGeneration) === context.generation
      && String(next.rulesEpoch) === context.epoch && protocol.cursorMatches(next,context)
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
      let classification={};
      if(directories)classification=await targetAt(entry.target,context);
      else {const created = await scalar('ledger','subjectCreatedAt',[entry.target],context);
        check(!eq(entry.target,Z) && created > 0n && created <= BigInt(context.admission),'FILE_SUBJECT');}
      rows.push({file:entry.target,...classification,position:entry.position,folder,role:cell[2],selection:s,
        name:await nameAt({position:entry.position,folder,role:cell[2],context})});
    }
    check(page.selectedSoFar === BigInt(rows.length) && next.selectedSoFar === page.selectedSoFar,'PAGE_COUNT');
    const complete = Number(page.status) === 2;
    if (complete) check(Number(next.lensIndex) === authors.length && next.rawIndex === 0n && scanned === page.rawTotal,'INCOMPLETE_TRAVERSAL');
    else check(Number(page.status) === 1 && page.scanned > 0n,'PAGE_PROGRESS');
    const extra = {nameCoverage:rows.every(r => r.name.knowledge === 'PRESENT') ? 'COMPLETE' : 'PARTIAL',
      ...(directories?{kindCoverage:rows.every(r=>r.knowledge==='PRESENT')?'COMPLETE':'PARTIAL'}:{}),
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
    onPhase('prepare');
    const context = args.context ?? await pin(); await guard(context);
    const author = e.getAddress(args.author), authors = await protocol.selectors(args,context);
    const principalId = await protocol.signedPrincipal(author,context);
    const actions = [], bodies = [], expectedHeads = new Map(), startingHeads = new Map(), retainedNames = new Set(), selectionDependencies = [];
    const guardPositions = new Map();
    const watch = async(p,s,r,meaning,selected) => {
      if(!protocol.watchPositions)return;
      const position=positionOf(p,s,r);
      if(!guardPositions.has(position))guardPositions.set(position,{position,purpose:p,subject:s,role:r,meaning,
        selection:selected??await resolve(authors,p,s,r,context)});
    };
    let file = args.file, newRevision = null,concept=args.concept;
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
    const retain=async(type,body)=>{
      const hash=e.keccak256(body),id=recordOf(type,hash),[t,first,,stored]=await call('ledger','record',[id],context);
      if(eq(t,Z)&&first===0n)push({kind:1,typeId:type,bodyHashOrRecordId:hash},body);
      else check(eq(t,type)&&first>0n&&first<=BigInt(context.admission)&&eq(stored,e.hexlify(body)),'CONTENT_INTEGRITY');return id;
    };
    const publishRevision = async(document,parent,content) => {
      if(content){
        check(carriers,'CONTENT_PROFILE');
        let d=content.descriptor??await contentCodec.describe(bytesOf(content.bytes),{media:content.media??0});
        const raw=d.carrier===0?bytesOf(content.bytes):new Uint8Array();
        if(d.carrier===0)check(raw.length<=8160&&raw.length===d.length&&await contentCodec.digest(raw)===d.digest,'CONTENT_INTEGRITY');
        const inline=await retain(config.types.bytes,e.concat(['0x'+await contentCodec.digest(raw),raw]));d={...d,inline:inline.slice(2)};
        const descriptor=await retain(config.types.content,contentCodec.encodeDescriptor(d));
        const body=e.concat(parent?[parent,descriptor,file]:[descriptor,file]),type=parent?config.types.carrierChild:config.types.carrierRoot;
        newRevision=recordOf(type,e.keccak256(body));push({kind:1,typeId:type,bodyHashOrRecordId:e.keccak256(body)},body);return;
      }
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
      await watch(purpose.head,file,Z,'selected-head',point.value.selection);
      return point.value.revision;
    };
    const operation = args.operation;
    const destination=async(folder,role)=>{
      if(!directories){await watch(purpose.folder,folder,role,'destination');return;}
      const selected=await resolve(authors,purpose.folder,folder,role,context);
      check(selected.status===0||args.replace===true,'DESTINATION_OCCUPIED');
      await watch(purpose.folder,folder,role,'destination',selected);
    };
    if (operation === 'create' || (directories&&operation==='createDirectory')) {
      check(args.salt && !eq(args.salt,Z),'SALT');
      file = hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),e.zeroPadValue(author,32),args.salt]);
      check(await scalar('ledger','subjectCreatedAt',[file],context) === 0n,'SUBJECT_EXISTS');
      push({kind:5,salt:args.salt});
      if(operation==='createDirectory'){
        const body=coder.encode(['bytes32'],[file]);file=recordOf(config.types.directory,e.keccak256(body));
        push({kind:1,typeId:config.types.directory,bodyHashOrRecordId:e.keccak256(body)},body);
      }else await publishRevision(args.content?null:bytesOf(args.document),null,args.content);
      const role = await retainName(args.name);
      const folder=await folderFor(args.folder,context);await destination(folder,role);
      if(operation==='create')await binding(purpose.head,file,Z,newRevision);
      await binding(purpose.folder,folder,role,file);
    } else {
      check(file && !eq(file,Z),'FILE_ID');
      const placementOperation=['move','rename','remove','restorePlacement'].includes(operation);
      if(directories&&(placementOperation||(carriers&&['addTag','removeTag'].includes(operation)&&args.scope==='directory')))check((await targetAt(file,context)).knowledge==='PRESENT','TARGET_UNAVAILABLE');
      else {const created = await scalar('ledger','subjectCreatedAt',[file],context);
        check(created > 0n && created <= BigInt(context.admission),'FILE_SUBJECT');}
      if (operation === 'edit' || operation === 'restoreContents') {
        const current = await selected();
        const historical=operation==='restoreContents'?await revisionAt(args.record,file,context):null;
        let content=args.content,document;
        if(historical?.profile==='carrier-v1'){
          const d=historical.content;content={descriptor:d,bytes:d.carrier===0?e.getBytes((await retainedAt('0x'+d.inline,config.types.bytes,context)).body).slice(32):undefined};
        }else {document=historical?e.getBytes(historical.document):content?null:bytesOf(args.document);
          if(!content&&current.profile==='carrier-v1')content={bytes:document};}
        // A supplied-key read must never make ordinary editing publish plaintext.
        // Restore is also a new successor, so only ciphertext history can follow
        // an encrypted selection without a separate explicit decryption API.
        check(current.content?.encryption!==1||content?.descriptor?.encryption===1,'ENCRYPTED_SUCCESSOR_REQUIRED');
        await publishRevision(document,current.recordId,content);
        await binding(purpose.head,file,Z,newRevision);
      } else if (operation === 'move' || operation === 'rename') {
        const from = await folderFor(args.fromFolder ?? args.folder,context), to = await folderFor(args.toFolder ?? args.folder,context);
        if(directories)check(!eq(to,file),'DIRECTORY_SELF_LINK');
        const fromRole = await retainName(args.fromName), toRole = await retainName(args.name);
        check(!eq(from,to) || !eq(fromRole,toRole),'SAME_PLACEMENT');
        const source = await resolve(authors,purpose.folder,from,fromRole,context);
        check(source.status === 1 && eq(source.target,file),'SOURCE_PLACEMENT');
        selectionDependencies.push({purpose:purpose.folder,subject:from,role:fromRole,selection:source});
        await watch(purpose.folder,from,fromRole,'source',source);
        await destination(to,toRole);
        await binding(purpose.folder,from,fromRole,file,true);
        await binding(purpose.folder,to,toRole,file);
      } else if (operation === 'remove' || operation === 'restorePlacement') {
        const folder = await folderFor(args.folder,context), role = await retainName(args.name);
        if(directories)check(!eq(folder,file),'DIRECTORY_SELF_LINK');
        if (operation === 'remove') {
          const source = await resolve(authors,purpose.folder,folder,role,context);
          check(source.status === 1 && eq(source.target,file),'SOURCE_PLACEMENT');
          selectionDependencies.push({purpose:purpose.folder,subject:folder,role,selection:source});
          await watch(purpose.folder,folder,role,'source',source);
        } else {
          await destination(folder,role);
        }
        await binding(purpose.folder,folder,role,file,operation === 'remove');
      } else if (operation === 'addTag' || operation === 'removeTag') {
        check(args.scope === 'file' || args.scope === 'revision'||(carriers&&args.scope==='directory'&&(await directoryAt(file,context)).knowledge==='PRESENT'),'TAG_SCOPE');
        if(args.conceptLabel!==undefined){check(carriers,'CONTENT_PROFILE');concept=await retain(config.types.concept,conceptBody(args.conceptNamespace??principalId,args.conceptLabel));}
        check(concept && !eq(concept,Z),'TAG_CONCEPT');
        if(carriers&&args.conceptLabel===undefined)check((await conceptAt(concept,context)).knowledge==='PRESENT','CONCEPT_UNAVAILABLE');
        const subject = args.scope === 'revision' ? (await selected()).recordId : file;
        await binding(purpose.tag,subject,concept,file,operation === 'removeTag');
      } else fail('OPERATION');
    }
    const actionsHash = hash([interfaces.ledger.getFunction('execute').inputs[0]],[actions]);
    const intent = {realmId:await scalar('ledger','realmId',[],context),coreCodeCommitment:context.core,author,
      nonce:String(await scalar('ledger','nonces',[author],context)),deadline:String(args.deadline ?? BigInt(context.timestamp)+3600n),
      acceptanceProfile:await scalar('ledger','acceptanceProfileOf',[actions],context),indexObligations:await scalar('ledger','indexObligations',[],context)};
    check(BigInt(intent.deadline) > BigInt(context.timestamp),'EXPIRED');
    const authorization = await protocol.authorization({intent,actionsHash,actions,authors,principalId,context,guardPositions:[...guardPositions.values()]});
    const {publicationId} = authorization;
    const id = hash(['uint256','address','bytes32'],[context.chainId,addresses.ledger,publicationId]);
    const plan = freeze(plain({id,operation,file,newRevision,concept,authors,basis:context,intent,actions,bodies,actionsHash,...authorization,
      startingHeads:[...startingHeads.values()],expectedHeads:[...expectedHeads.values()],selectionDependencies}));
    await canonical(context);plans.add(plan); return plan;
  }
  async function authorize(plan,signDigest) {
    onPhase('authorize');
    check(plans.has(plan),'PLAN');
    await canonical(plan.basis);
    const signature = e.Signature.from(await signDigest(plan.digest,plan)).serialized;
    check(eq(e.recoverAddress(plan.digest,signature),plan.intent.author),'SIGNER');
    const transaction = {to:addresses.ledger,data:protocol.encode(plan,signature),value:'0x0'};
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
    onPhase('submit-preflight');
    check(journal?.put && journal?.get,'DURABLE_JOURNAL_REQUIRED');
    const prior = await journal.get(signed.id);
    if (prior) return reconcile(signed.id); // no accidental duplicate broadcast
    const context = await pin(), {plan} = signed;
    check(context.chainId === plan.basis.chainId && eq(context.core,plan.basis.core),'BASIS');
    await protocol.preflight(plan,context);
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
    await canonical(context);
    let entry = plain({...signed,status:'BROADCAST_UNKNOWN',transactionHash:null});
    await journal.put(entry); // write-ahead: response loss cannot erase the authorized plan
    let response;
    onPhase('send');
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
    onPhase('reconcile-receipt');
    check(journal?.get && journal?.put,'DURABLE_JOURNAL_REQUIRED');
    const entry = await journal.get(id); check(entry && entry.id === id,'JOURNAL_NOT_FOUND');
    const {plan} = entry;
    // Complete local validation before any RPC and outside availability catches.
    check(eq(entry.transaction.to,addresses.ledger) && String(plan.basis.chainId) === String(config.chainId),'JOURNAL_REALM');
    check(eq(hash([interfaces.ledger.getFunction('execute').inputs[0]],[plan.actions]),plan.actionsHash),'JOURNAL_INTEGRITY');
    protocol.verifyJournal(entry,id);
    check(eq(e.recoverAddress(plan.digest,entry.signature),plan.intent.author),'JOURNAL_SIGNATURE');
    check(eq(entry.transaction.data,protocol.encode(plan,entry.signature)),'JOURNAL_INTEGRITY');
    let context = null;
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
    let status, evidence = null, reason;
    try {
    onPhase('reconcile-current');context = await pin();
    const publication = await scalar('ledger','publicationOf',[plan.publicationId],context);
    if (publication === 0n) status = receipt ? (BigInt(receipt.status) === 0n ? 'REVERTED' : 'EFFECTS_MISMATCH') : 'BROADCAST_UNKNOWN';
    else {
      const currentEvidence = await call('ledger','evidence',[publication],context);
      const committedBlock = await rpc('eth_getBlockByNumber',[e.toQuantity(currentEvidence[9]),false]);
      onPhase('reconcile-committed');context = await pinAt(committedBlock);
      const retained = await call('ledger','evidence',[publication],context);
      let matches = eq(retained[0],plan.intent.author) && Number(retained[1]) === 2
        && Number(retained[3]) === plan.actions.length && String(retained[7]) === plan.intent.nonce
        && String(retained[8]) === plan.intent.deadline && eq(retained[10],plan.intent.acceptanceProfile)
        && eq(retained[11],plan.intent.indexObligations) && eq(retained[12],plan.actionsHash)
        && await protocol.verifyRetained(plan,publication,retained,context)
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
          const subject=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),protocol.principal(plan),a.salt]);
          matches &&= eq(row[6],a.salt) && await scalar('ledger','subjectCreatedAt',[subject],context) === ordinal;
        }
      }
      // Rebuild effect obligations from the signed actions, never unsigned journal
      // hints (which could otherwise drop a head check after a browser reload).
      const finalHeads = new Map();
      for (const a of plan.actions) if (a.kind === 3 || a.kind === 4) {
        const position = positionOf(a.purpose,a.subject,a.role), key = bindingOf(protocol.principal(plan),position);
        finalHeads.set(key,{key,position,state:Number(a.kind) === 3 ? 1 : 2,revision:Number(a.expectedRevision)+1,target:a.target});
      }
      let supersededAtPublicationBlock=false;
      for (const expected of finalHeads.values()) {
        const historical=await protocol.history(plan,expected,first+BigInt(plan.actions.length)-1n,context);
        matches &&= Number(historical[0])===2 && historical[1]===(expected.state===1)
          && eq(historical[2],expected.target) && Number(historical[3])===expected.revision
          && historical[4]>=first && historical[4]<first+BigInt(plan.actions.length);
        const h = await call('ledger','head',[expected.key],context);
        supersededAtPublicationBlock ||= h[2]>=first+BigInt(plan.actions.length);
      }
      status = matches ? 'EFFECTS_VERIFIED' : 'EFFECTS_MISMATCH';
      evidence = {publication:String(publication),firstAdmission:String(first),leafCount:plan.actions.length,supersededAtPublicationBlock};
    }
    await canonical(context);
    } catch(error) {
      const qualification=protocol.recoveryError?.(error);if(!qualification)throw error;
      ({status,reason}=qualification);evidence=null;
    }
    const outcome = {...entry,status,knowledge:status === 'EFFECTS_VERIFIED' ? 'VERIFIED' : 'UNKNOWN',
      coverage:status === 'EFFECTS_VERIFIED' ? 'COMPLETE' : 'PARTIAL',basis:context?basisFor(context,plan.authors):null,evidence,
      receipt,receiptObservation,receiptAttribution,...(reason?{reason}:{})};
    await journal.put(plain(outcome)); return outcome;
  }
  const publicRead=fn=>async args=>{const value=await fn(args);await canonical(args.context);return value;};
  return Object.freeze({pin,...Object.fromEntries(Object.entries({listFolder,listFolderPage,readFile,readName,readDirectory,readPlacement,readContent,readTypedRecord,readConcept,readTag}).map(([name,fn])=>[name,publicRead(fn)])),conceptId,prepare,authorize,submit,reconcile,
    readMetrics:()=>({...cache.stats(),contexts:verifiedContexts.size,contextBytes,contextLimits:{...contextLimits},groupWidth:16}),
    capabilities:()=>freeze(plain({...protocol.capabilities,typedDirectories:directories,globalTree:false}))});
}
