import {createCompactEngine} from './compact-sdk.mjs';
import {createGuardedArchiveReader} from './guarded-archive.mjs';

export function createGuardedCompactSdk(options) {
  if (options.manifest.protocol !== 'compact-guarded-v2') throw new Error('COMPACT_PROTOCOL');
  const engine=createCompactEngine(options, guardedProtocol);
  return Object.freeze({...engine,...createGuardedArchiveReader(options)});
}

// Only protocol/context/identity codecs live here. Files construction, traversals,
// capability ownership, journals and receipt attribution remain in one engine.
export function guardedProtocol({e,rpc,isRpcUnavailable,config,hash,eq,check,fail,plain,call,scalar,code,readGroup,addresses,interfaces,bindingOf}) {
  const Z=e.ZeroHash,coder=e.AbiCoder.defaultAbiCoder(),family=config.executionFamily;
  const layout=e.id('efs.lab.ledger-layout/2:roots-0-12-preserved:context-13:execution-14:readsets-15');
  const domain={name:'EFS2-RoadB-Lab',version:'2'};
  const fields=['realmId:bytes32','realmOrigin:bytes32','executionSet:bytes32','author:address','nonce:uint64',
    'deadline:uint64','acceptanceProfile:bytes32','indexObligations:bytes32','readSetHash:bytes32','actionsHash:bytes32']
    .map(field=>{const [name,type]=field.split(':');return {name,type};});
  const intentType=interfaces.ledger.getFunction('executeGuardedSigned').inputs[0];
  const readType=interfaces.ledger.getFunction('readSetHash').inputs[0];
  const executionType=interfaces.ledger.getFunction('executionInfo').outputs[0];
  const keyPrincipal=account=>e.zeroPadValue(e.getAddress(account),32);
  const contractPrincipal=(account,origin)=>hash(['bytes32','uint256','bytes32','address'],[e.id('efs2/principal/1'),2,origin,account]);
  const isKey=runtime=>runtime==='0x'||/^0xef0100[0-9a-f]{40}$/i.test(runtime);
  const executionHash=info=>hash(['bytes32','bytes32','bytes32','bytes32',executionType],
    [e.id('efs.lab.execution-set/2'),family.layoutId,family.domainSeparator,family.guardedDomainSeparator,info]);
  const digest=(intent,actionsHash)=>e.TypedDataEncoder.hash(domain,{IntentV2:fields},{...intent,actionsHash});
  const publicationId=(principal,commitment)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs.lab.publication/2'),principal,commitment]);
  check(family && eq(family.layoutId,layout) && family.implementations?.length>0,'MANIFEST_EXECUTION');
  // layout is the compatible sequential-root family, NOT a complete physical
  // read-set codec. Old saved ABIs/manifests retain their root15-only adapter.
  const legacyReads=e.id('efs.lab.read-set-storage/1:root15-bytes');
  const carrierReads=e.id('efs.lab.read-set-storage/2:root15-legacy-first:namespaced-stop-code:all-new');
  const carrierRoot=e.id('efs.lab.ledger.read-set-carriers/1');
  const lifecycle=e.id('efs.lab.binding-lifecycle/2:bind-mask-release');
  const profileAbi=new e.Interface(['function bindingLifecycleProfile() view returns(bytes32)',
    'function readSetStorageProfile() view returns(bytes32,bytes32)',
    'function publicationSupportIdentity() view returns(address,bytes32)']);
  for(const implementation of family.implementations){
    const p=implementation.readSetStorage;
    if(p)check(eq(p.profile,legacyReads)&&eq(p.namespace,Z)
      ||eq(p.profile,carrierReads)&&eq(p.namespace,carrierRoot)&&implementation.publicationSupport?.address
        &&/^0x[0-9a-f]{64}$/i.test(implementation.publicationSupport.codeHash),'MANIFEST_READSET_PROFILE');
  }
  check(eq(family.guardedDomainSeparator,e.TypedDataEncoder.hashDomain(domain))
    && eq(family.domainSeparator,e.TypedDataEncoder.hashDomain({...domain,version:'1'})),'MANIFEST_DOMAIN');
  const expectedOrigin=hash(['bytes32','uint256','address'],[e.id('efs.lab.realm-origin/2'),config.chainId,addresses.ledger]);
  check(eq(expectedOrigin,family.origin),'MANIFEST_ORIGIN');
  const reviewExecution=info=>{
    check(info && BigInt(info.revision)>0n,'HISTORY_UNAVAILABLE');
    check(eq(info.origin,family.origin) && eq(info.shellCodeHash,config.contracts.ledger.codeHash)
      && eq(info.registryAddress,addresses.registry) && eq(info.registryCodeHash,config.contracts.registry.codeHash)
      && eq(info.indexAddress,addresses.index) && eq(info.indexCodeHash,config.contracts.index.codeHash),'EXECUTION_FAMILY');
    check(family.implementations.some(i=>eq(i.address,info.implementation)&&eq(i.codeHash,info.implementationCodeHash)),'EXECUTION_UNSUPPORTED');
  };
  const validateReads=rs=>{
    const n=rs?.principalIds?.length,m=rs?.positions?.length;
    check(Number.isInteger(n)&&Number.isInteger(m)&&n<=64&&m<=4&&rs.expectedHeads?.length===n*m&&(n===0)===(m===0),'READSET_SHAPE');
    for(const values of [rs.principalIds,rs.positions])check(values.every(v=>/^0x[0-9a-f]{64}$/i.test(v)&&!eq(v,Z))
      && new Set(values.map(v=>v.toLowerCase())).size===values.length,'READSET_SHAPE');
    check(rs.expectedHeads.every(v=>/^0x[0-9a-f]{64}$/i.test(v)),'READSET_SHAPE');
    return hash(['bytes32',readType],[e.id('efs.lab.read-set/2:ordered-first-binding'),rs]);
  };
  const snapshot=async(principal,position,context)=>{
    const head=await call('ledger','head',[bindingOf(principal,position)],context);
    return {principal,position,state:Number(head[0]),revision:Number(head[1]),admission:String(head[2]),target:head[5],
      hash:hash(['bytes32','uint8','uint32','uint64','bytes32'],[e.id('efs.lab.head-snapshot/2'),head[0],head[1],head[2],head[5]])};
  };
  const namedExecution=result=>Object.fromEntries(executionType.components.map((c,i)=>[c.name,String(result[i])]));
  const encode=(plan,signature)=>interfaces.ledger.encodeFunctionData('executeGuardedSigned',[plan.intent,plan.actions,plan.bodies,plan.readSet,signature]);
  function validateJournal(entry,id) {
    const p=entry.plan;
    check(p.protocol==='compact-guarded-v2'&&p.authorizationContext?.format===2,'JOURNAL_FORMAT');
    check(BigInt(entry.transaction.value)===0n,'JOURNAL_VALUE');
    check(eq(p.intent.realmId,family.realmId)&&eq(p.intent.realmOrigin,family.origin)
      &&eq(p.authorizationContext.layoutId,layout)&&eq(p.authorizationContext.domainSeparator,family.guardedDomainSeparator),'JOURNAL_CONTEXT');
    reviewExecution(p.authorizationContext.execution);
    check(eq(executionHash(p.authorizationContext.execution),p.intent.executionSet),'JOURNAL_EXECUTION');
    // ABI roundtrip enforces unsigned integer ranges and exact field encoding.
    coder.encode([intentType],[p.intent]);
    check(p.actions.length>0&&p.actions.length<=64&&p.bodies.length===p.actions.length,'JOURNAL_BODIES');
    for(let i=0;i<p.actions.length;i++) {
      const a=p.actions[i],body=p.bodies[i];
      check([1,3,4,5,7].includes(a.kind),'JOURNAL_ACTION');
      check(a.kind===1?e.getBytes(body).length<=8192&&eq(e.keccak256(body),a.bodyHashOrRecordId):body==='0x','JOURNAL_BODIES');
    }
    check(eq(validateReads(p.readSet),p.intent.readSetHash),'JOURNAL_READSET');
    const reconstructed=digest(p.intent,p.actionsHash),principal=keyPrincipal(p.intent.author),pub=publicationId(principal,reconstructed);
    check(eq(reconstructed,p.digest)&&eq(principal,p.principalId)&&eq(pub,p.publicationId)
      &&eq(id,p.id)&&eq(id,hash(['uint256','address','bytes32'],[config.chainId,addresses.ledger,pub])),'JOURNAL_DIGEST');
  }
  const entryAuthor=entry=>({...Object.fromEntries(['position','target','revision','admission'].map(k=>[k,entry[k]])),author:entry.principalId});
  return {
    watchPositions:true,
    unavailable:error=>/HISTORY_UNAVAILABLE|UNSUPPORTED/.test(String(error?.message)),
    capabilities:{protocol:'compact-guarded-v2',guardedWrites:true,explicitPrincipalHistory:true,legacyReading:false,
      guardedImport:false,guardedArchive:'SIGNED_CLAIMS_WITH_EXPLICIT_CLOSURE',addressConvenience:'authors-at-pinned-basis',evidence:'RPC_OBSERVED'},
    lensFields:principals=>({principals}),lensHash:principals=>hash(['bytes32[]'],[principals]),
    async selectors(args,context) {
      check(!(args.authors&&args.principals),'LENS_INPUT');
      let ids;
      if(args.principals) {
        ids=args.principals.map(p=>{
          if(typeof p==='string')return p;
          check(p&&[1,2].includes(p.kind)&&p.account,'PRINCIPAL');
          const expected=p.kind===1?keyPrincipal(p.account):contractPrincipal(p.account,p.origin);
          check(eq(expected,p.id)&&(p.kind===1||eq(p.origin,context.origin)),'PRINCIPAL');return p.id;
        });
      }else{
        // The caller explicitly opts into current account classification through
        // `authors`; prepared plans retain the resulting IDs, never reclassify.
        check(Array.isArray(args.authors),'EXPLICIT_LENS_REQUIRED');
        check(args.authors.length>0&&args.authors.length<=255,'LENS');
        ids=await readGroup(args.authors,async account=>isKey(await code(e.getAddress(account),context))
          ?keyPrincipal(account):contractPrincipal(account,context.origin));
      }
      check(ids.length>0&&ids.length<=255&&ids.every(p=>/^0x[0-9a-f]{64}$/i.test(p)&&!eq(p,Z))
        &&new Set(ids.map(p=>p.toLowerCase())).size===ids.length,'LENS');return ids;
    },
    async readContext(context) {
      const names=['realmOrigin','realmId','layoutId','domainSeparator','guardedDomainSeparator','executionRevision','implementationSelf','executionSet'];
      const values=Object.fromEntries(await readGroup(names,async name=>[name,await scalar('ledger',name,[],context)]));
      check(eq(values.realmOrigin,family.origin)&&eq(values.realmId,family.realmId)&&eq(values.layoutId,layout)
        &&eq(values.domainSeparator,family.domainSeparator)&&eq(values.guardedDomainSeparator,family.guardedDomainSeparator),'EXECUTION_FAMILY');
      const execution={origin:values.realmOrigin,revision:String(values.executionRevision),shellCodeHash:context.core,
        implementation:values.implementationSelf,implementationCodeHash:e.keccak256(await code(values.implementationSelf,context)),
        registryAddress:addresses.registry,registryCodeHash:config.contracts.registry.codeHash,
        indexAddress:addresses.index,indexCodeHash:config.contracts.index.codeHash,indexGeneration:context.generation};
      reviewExecution(execution);check(eq(executionHash(execution),values.executionSet),'EXECUTION_HASH');
      const supported=family.implementations.find(i=>eq(i.address,execution.implementation)&&eq(i.codeHash,execution.implementationCodeHash));
      const expected=supported.readSetStorage??{profile:legacyReads,namespace:Z};
      // Probe the actual codehash-qualified implementation, even when its
      // manifest says legacy. A shared proxy ABI is not per-implementation proof.
      const rawProbe=fn=>rpc('eth_call',[{to:execution.implementation,data:profileAbi.encodeFunctionData(fn)},
        {blockHash:context.blockHash,requireCanonical:true}]);
      let lifecycleRaw,lifecycleAbsent=false;
      try{lifecycleRaw=await rawProbe('bindingLifecycleProfile');}
      catch(error){
        if(supported.bindingLifecycleProfile!==undefined||!isRpcUnavailable(error)
          ||error.rpcError?.code!==3||error.rpcError?.data!=='0x')throw error;
        lifecycleAbsent=true;
      }
      if(!lifecycleAbsent){
        const actual=profileAbi.decodeFunctionResult('bindingLifecycleProfile',lifecycleRaw)[0];
        check(eq(actual,lifecycle)&&eq(supported.bindingLifecycleProfile,lifecycle),'BINDING_LIFECYCLE_UNSUPPORTED');
        check(eq(await scalar('lens','bindingLifecycleProfile',[],context),actual),'BINDING_LIFECYCLE_UNSUPPORTED');
        context.bindingLifecycleProfile=actual;
      }
      let declared,legacyRefusal=false;
      try{declared=await rawProbe('readSetStorageProfile');}
      catch(error){
        // The old binary has no selector and explicitly EVM-reverts with empty
        // bytes. Only that typed RPC result may establish legacy compatibility;
        // timeout/untyped/provider errors and declared-new refusals remain errors.
        if(!eq(expected.profile,legacyReads)||!isRpcUnavailable(error)
          ||error.rpcError?.code!==3||error.rpcError?.data!=='0x')throw error;
        legacyRefusal=true;
      }
      if(!legacyRefusal){
        const physical=profileAbi.decodeFunctionResult('readSetStorageProfile',declared);
        check(eq(physical[0],expected.profile)&&eq(physical[1],expected.namespace),'READSET_PROFILE_UNSUPPORTED');
      }
      if(eq(expected.profile,carrierReads)){
        const support=profileAbi.decodeFunctionResult('publicationSupportIdentity',await rawProbe('publicationSupportIdentity'));
        check(eq(support[0],supported.publicationSupport.address)&&eq(support[1],supported.publicationSupport.codeHash)
          &&eq(e.keccak256(await code(support[0],context)),supported.publicationSupport.codeHash),'READSET_SUPPORT_UNSUPPORTED');
      }
      Object.assign(context,{protocol:'compact-guarded-v2',origin:values.realmOrigin,executionSet:values.executionSet,execution});
    },
    async revisionEvidence(publication,context) {
      const retained=await scalar('ledger','publicationContext',[publication],context);
      check(!eq(retained.principalId,Z),'HISTORY_UNAVAILABLE');
      return {publication:String(publication),publicationContext:Object.fromEntries(
        ['principalId','executionSet','readSetHash','intentDigest','principalKind','authorizationProfile','intentFormat'].map(k=>[k,String(retained[k])]))};
    },
    async signedPrincipal(author,context){check(isKey(await code(author,context)),'SIGNED_KEY_ONLY');return keyPrincipal(author);},
    resolve:(ids,p,s,r,c)=>call('lens','resolvePrincipals',[ids,p,s,r,c.executionSet],c),
    async conflicts(ids,p,s,r,c){const [status,entries]=await call('lens','resolveNoTiebreakPrincipals',[ids,p,s,r,c.executionSet],c);
      return [status,entries.map(entryAuthor)];},
    async list(ids,p,s,cursor,budget,c){const page=await scalar('lens','listPrincipals',[ids,p,s,cursor,budget],c);
      return {...Object.fromEntries(['next','scanned','rawTotal','mutated','status','selectedSoFar'].map(k=>[k,page[k]])),items:page.items.map(entryAuthor)};},
    cursorMatches:(cursor,c)=>eq(cursor.executionSet,c.executionSet),
    name:(position,folder,role,c)=>scalar('names','readNameAt',[position,folder,role,[c.admission,c.epoch,c.executionSet]],c),
    async authorization({intent:old,actionsHash,authors,principalId,context,guardPositions}) {
      check(authors.length<=64&&guardPositions.length<=4,'READSET_SHAPE');
      const snapshots=[];
      for(const dep of guardPositions)snapshots.push(...await readGroup(authors,principal=>snapshot(principal,dep.position,context)));
      const readSet={principalIds:guardPositions.length?authors:[],positions:guardPositions.map(d=>d.position),expectedHeads:snapshots.map(s=>s.hash)};
      const {coreCodeCommitment,...base}=old;
      const intent={...base,realmOrigin:context.origin,executionSet:context.executionSet,readSetHash:validateReads(readSet)};
      const commitment=digest(intent,actionsHash);
      check(eq(await scalar('ledger','guardedIntentDigest',[intent,actionsHash],context),commitment),'DIGEST');
      return {protocol:'compact-guarded-v2',principalId,intent,readSet,digest:commitment,publicationId:publicationId(principalId,commitment),
        authorizationContext:{format:2,layoutId:layout,domainSeparator:family.guardedDomainSeparator,execution:context.execution},
        guards:guardPositions.map(d=>({...d,expectation:d.meaning==='destination'?['empty','replace-selected','replace-mask','conflict'][d.selection.status]:d.meaning})),snapshots};
    },
    encode,
    async preflight(plan,context) {
      check(eq(context.executionSet,plan.intent.executionSet),'EXECUTION_DRIFT');
      for(let i=0;i<plan.readSet.positions.length;i++)await readGroup(plan.readSet.principalIds,async(principal,j)=>{
        const now=await snapshot(principal,plan.readSet.positions[i],context);
        check(eq(now.hash,plan.readSet.expectedHeads[i*plan.readSet.principalIds.length+j]),'READSET_DRIFT');
      });
    },
    verifyJournal:validateJournal,principal:plan=>keyPrincipal(plan.intent.author),
    async verifyRetained(plan,publication,retained,context) {
      const pub=await scalar('ledger','publicationContext',[publication],context);
      if(Number(pub.intentFormat)!==2)fail('FORMAT_UNSUPPORTED');
      // Proof-kind3 r/s are a typed evidence hash/store union, never ECDSA.
      if(Number(retained[1])!==2||Number(pub.principalKind)!==1||Number(pub.authorizationProfile)!==2)fail('FORMAT_UNSUPPORTED');
      const execution=namedExecution(await scalar('ledger','executionInfo',[pub.executionSet],context));
      reviewExecution(execution);check(eq(executionHash(execution),pub.executionSet),'HISTORY_EXECUTION');
      const bytes=await scalar('ledger','readSetBytes',[pub.readSetHash],context);
      check(bytes!=='0x','HISTORY_UNAVAILABLE');
      const decoded=coder.decode([readType],bytes)[0],reads=Object.fromEntries(['principalIds','positions','expectedHeads'].map(k=>[k,Array.from(decoded[k])]));
      check(eq(coder.encode([readType],[reads]),bytes),'HISTORY_READSET');
      const rebuilt={realmId:family.realmId,realmOrigin:execution.origin,executionSet:pub.executionSet,author:retained[0],nonce:retained[7],
        deadline:retained[8],acceptanceProfile:retained[10],indexObligations:retained[11],readSetHash:validateReads(reads)};
      const commitment=digest(rebuilt,retained[12]);
      const signature=e.Signature.from({v:Number(retained[2]),r:retained[5],s:retained[6]});
      return Number(pub.principalKind)===1&&Number(pub.authorizationProfile)===2
        &&eq(pub.principalId,keyPrincipal(retained[0]))&&eq(pub.executionSet,plan.intent.executionSet)
        &&eq(pub.readSetHash,rebuilt.readSetHash)&&eq(pub.readSetHash,plan.intent.readSetHash)
        &&eq(pub.intentDigest,commitment)&&eq(commitment,plan.digest)
        &&eq(e.recoverAddress(commitment,signature),retained[0])&&eq(publicationId(pub.principalId,commitment),plan.publicationId);
    },
    async history(plan,expected,asOf,context) {
      const stateful=eq(context.bindingLifecycleProfile,lifecycle);
      const result=await call('lens',stateful?'historyStatePrincipalAt':'historyPrincipalAt',[keyPrincipal(plan.intent.author),expected.position,asOf,context.executionSet],context);
      check(Number(result[0])!==0,'HISTORY_UNAVAILABLE');return stateful?result:[result[0],result[1]?1:2,...result.slice(2)];
    },
    recoveryError(error) {
      const message=String(error?.message??error);
      if(/^COMPACT_(EXECUTION|FORMAT)_UNSUPPORTED$/.test(message))return {status:'UNSUPPORTED',reason:message};
      if(/^COMPACT_(HISTORY_UNAVAILABLE|BLOCK_UNAVAILABLE|BLOCK_REORG)$/.test(message)||isRpcUnavailable(error))return {status:'UNKNOWN',reason:message};
      return null;
    },
  };
}
