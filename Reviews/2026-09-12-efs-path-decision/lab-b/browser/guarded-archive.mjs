/** Disposable format-2 signed evidence. No wallet, journal, current-code author
 * classification, source-state proof, or destination write authority. Pure
 * verification never accepts an RPC transport. Type/rule closure is a sidecar;
 * hashing rule bytes does not execute or authenticate historical rule state. */
import * as contentCodec from './compact-content.mjs';
export const ACTION='tuple(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)';
export const INTENT='tuple(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash)';
export const READ_SET='tuple(bytes32[] principalIds,bytes32[] positions,bytes32[] expectedHeads)';
export const EXECUTION='tuple(bytes32 origin,uint256 revision,bytes32 shellCodeHash,address implementation,bytes32 implementationCodeHash,address registryAddress,bytes32 registryCodeHash,address indexAddress,bytes32 indexCodeHash,uint64 indexGeneration)';
export const ARCHIVE_ABI=[
  `function retainGuardedSignedClaim(${INTENT},${ACTION}[],${READ_SET},${EXECUTION},bytes,tuple(uint16 leaf,bytes body)[]) returns(bytes32)`,
  `function guardedClaim(bytes32) view returns(${INTENT} source,bytes32 actionsHash,uint16 leafCount,bytes32 r,bytes32 s,uint8 v,uint64 bodyCoverage,uint8 proof,address firstImporter,uint64 retainedAt)`,
  'function claimFormat(bytes32) view returns(uint8)',`function actionAt(bytes32,uint16) view returns(${ACTION})`,
  'function selectedRecord(bytes32,uint16) view returns(bytes32 recordId,bytes32 typeId,bool claimBodyAttached,bytes body)',
  'function readSetBytes(bytes32) view returns(bool exists,bytes raw)',`function executionInfo(bytes32) view returns(bool exists,${EXECUTION} info)`,
  'function attachBodies(bytes32,tuple(uint16 leaf,bytes body)[])',
];
const FORMAT='efs.lab.guarded-signed-claim/2',PROOF='AUTHOR_SIGNATURE_VERIFIED';
const fail=code=>{throw Error(`ARCHIVE_${code}`);},need=(yes,code)=>{if(!yes)fail(code);};
const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const hex=value=>typeof value==='string'&&/^0x([0-9a-f]{2})*$/i.test(value);
const plain=value=>JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v));
const names=(e,type,result)=>Object.fromEntries(e.ParamType.from(type).components.map((c,i)=>[c.name,
  c.baseType==='array'?Array.from(result[i]):['uint8','uint16','uint32'].includes(c.type)?Number(result[i]):typeof result[i]==='bigint'?String(result[i]):result[i]]));
export function archiveProfile(e){return {layoutId:e.id('efs.lab.ledger-layout/2:roots-0-12-preserved:context-13:execution-14:readsets-15'),
  legacyDomain:e.TypedDataEncoder.hashDomain({name:'EFS2-RoadB-Lab',version:'1'}),guardedDomain:e.TypedDataEncoder.hashDomain({name:'EFS2-RoadB-Lab',version:'2'})};}
function codec(e){const coder=e.AbiCoder.defaultAbiCoder();return {coder,hash:(t,v)=>e.keccak256(coder.encode(t,v)),
  record:(type,bodyHash)=>e.keccak256(coder.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),type,bodyHash]))};}
function decodeReads(e,bytes){
  need(hex(bytes),'READSET_MISSING');const {coder}=codec(e),rs=names(e,READ_SET,coder.decode([READ_SET],bytes)[0]);
  need(eq(coder.encode([READ_SET],[rs]),bytes),'READSET_NONCANONICAL');
  const n=rs.principalIds.length,m=rs.positions.length;
  need(n<=64&&m<=4&&rs.expectedHeads.length===n*m&&(n===0)===(m===0),'READSET_SHAPE');
  for(const values of [rs.principalIds,rs.positions])need(values.every(v=>!eq(v,e.ZeroHash))&&new Set(values.map(v=>v.toLowerCase())).size===values.length,'READSET_SHAPE');
  return rs;
}
function actionRecords(e,actions){const {record}=codec(e);return actions.flatMap((a,leaf)=>[1,2].includes(Number(a.kind))?
  [{leaf,typeId:a.typeId,recordId:Number(a.kind)===1?record(a.typeId,a.bodyHashOrRecordId):a.bodyHashOrRecordId}]:[]);}
function checkBodies(e,x){
  need(Array.isArray(x.bodies),'BODIES');const expected=actionRecords(e,x.actions);
  need(x.bodies.length===expected.length,'BODY_LEAVES');
  let complete=true;const ids=new Set();
  for(let i=0;i<expected.length;i++){
    const b=x.bodies[i],a=expected[i];need(Number(b.leaf)===a.leaf&&!ids.has(b.leaf),'BODY_LEAVES');ids.add(b.leaf);
    need(typeof b.present==='boolean'&&(b.present?hex(b.body):b.body===undefined),'BODY_PRESENCE');
    if(b.present)need(eq(codec(e).record(a.typeId,e.keccak256(b.body)),a.recordId),'BODY_MISMATCH');else complete=false;
  }
  return {expected,complete};
}
export function checkTypeSidecarBudget(types){
  let descriptors=0,code=0,other=0;
  for(const t of types){
    const take=(value,max,kind)=>{need(typeof value==='string'&&(value.length-2)/2<=max&&hex(value),'TYPE_SIDECAR_BOUNDS');return (value.length-2)/2;};
    // Absence is a knowledge qualification, never a payload-budget exemption.
    if(t.present!==false||t.ruleCode!==undefined)code+=take(t.ruleCode,24576);
    const s=t.described;if(!s)continue;
    if(s.descriptor!==undefined)descriptors+=take(s.descriptor,4096);
    for(const k of ['wrapperInitcode','customCode'])if(s[k]!==undefined)code+=take(s[k],k==='wrapperInitcode'?49152:24576);
    for(const k of ['declaration','bindingSignature','bindingPreimage'])if(s[k]!==undefined)other+=take(s[k],k==='bindingPreimage'?384:65);
    need(descriptors<=2_097_152&&code<=4_194_304&&other<=262_144,'TYPE_SIDECAR_AGGREGATE_BOUNDS');
  }
  need(code<=4_194_304,'TYPE_SIDECAR_AGGREGATE_BOUNDS');
  return {descriptors,code,other};
}
function checkClosure(e,x,expected){
  const c=x.closure;need(c&&Array.isArray(c.records)&&Array.isArray(c.types)&&Array.isArray(c.roots),'CLOSURE');
  const roots=[...new Set(expected.map(a=>a.recordId.toLowerCase()))];
  need(c.roots.length===roots.length&&c.roots.every((r,i)=>eq(r,roots[i])),'CLOSURE_ROOTS');
  need(c.records.length<=4096&&c.types.length<=512,'CLOSURE_BOUNDS');
  checkTypeSidecarBudget(c.types);
  const records=new Map(),types=new Map(),{hash,record}=codec(e);let missing=false,total=0;
  for(const t of c.types){
    need(!types.has(t.typeId.toLowerCase()),'TYPE_DUPLICATE');types.set(t.typeId.toLowerCase(),t);
    if(t.present===false){missing=true;continue;}
    need(Array.isArray(t.refTypes)&&t.refTypes.length<=8&&hex(t.ruleCode),'TYPE_DESCRIPTOR');
    need(eq(hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/type/1'),t.shape,hash(['bytes32[]'],[t.refTypes]),t.ruleId]),t.typeId),'TYPE_ID');
    need(eq(t.ruleId,e.ZeroHash)?t.ruleCode==='0x':eq(e.keccak256(t.ruleCode),t.ruleId),'TYPE_RULE_CODE');
  }
  for(const r of c.records){
    need(!records.has(r.recordId.toLowerCase()),'RECORD_DUPLICATE');records.set(r.recordId.toLowerCase(),r);
    need(typeof r.present==='boolean'&&(r.present?hex(r.body):r.body===undefined),'CLOSURE_BODY_PRESENCE');
    if(!r.present){missing=true;continue;}
    total+=e.getBytes(r.body).length;need(total<=16_777_216,'CLOSURE_BOUNDS');
    need(eq(record(r.typeId,e.keccak256(r.body)),r.recordId),'RECORD_ID');
    const t=types.get(r.typeId.toLowerCase());need(t,'TYPE_MISSING');
    if(t.present!==false)need(e.getBytes(r.body).length>=32*t.refTypes.length,'REFERENCE_LENGTH');
  }
  for(const r of c.records)if(r.present){
    const t=types.get(r.typeId.toLowerCase());if(t.present===false)continue;
    for(let i=0;i<t.refTypes.length;i++){
      // A zero expected Type is a wildcard, not an optional Record reference.
      const id=e.dataSlice(r.body,i*32,i*32+32);
      const ref=records.get(id.toLowerCase());need(ref,'REFERENCE_MISSING');
      if(ref.present&&!eq(t.refTypes[i],e.ZeroHash))need(eq(ref.typeId,t.refTypes[i]),'REFERENCE_TYPE');
    }
  }
  for(const a of expected){
    const r=records.get(a.recordId.toLowerCase());need(r&&(!r.present||eq(r.typeId,a.typeId)),'CLOSURE_ROOT_MISSING');
    const body=x.bodies.find(b=>Number(b.leaf)===a.leaf);
    // A verified global closure copy is not a claim-local attachment. The claim
    // may lack bytes even when another claim's sidecar has retained them.
    if(body.present)need(r.present&&eq(body.body,r.body),'CLOSURE_BODY_MISMATCH');
  }
  const coverage=missing?'PARTIAL':'COMPLETE';need(c.coverage===coverage,'CLOSURE_COVERAGE');return coverage;
}
async function contentEvidence(e,closure){
  const types=new Map(closure.types.map(t=>[t.typeId.toLowerCase(),t])),records=new Map(closure.records.map(r=>[r.recordId.toLowerCase(),r])),result=[];
  for(const r of closure.records){
    const t=types.get(r.typeId.toLowerCase());if(!r.present||!t||t.present===false)continue;
    if(eq(t.shape,e.id('lab/type/files-bytes/1'))){
      const bytes=e.getBytes(r.body),valid=bytes.length>=32&&'0x'+await contentCodec.digest(bytes.slice(32))===e.hexlify(bytes.slice(0,32));
      result.push({recordId:r.recordId,state:valid?'AVAILABLE_VERIFIED':'CORRUPT',kind:'raw-sha256-bytes'});
    }
    if(eq(t.shape,e.id('lab/type/files-content/1'))){
      let descriptor;try{descriptor=contentCodec.decodeDescriptor(e.getBytes(r.body));}catch{result.push({recordId:r.recordId,state:'CORRUPT',kind:'content-descriptor'});continue;}
      const open=await contentCodec.openContent(descriptor,{loadCarrier:async d=>{
        if(d.carrier!==0)throw Error('EXTERNAL_BYTES_NOT_BUNDLED');const bytes=records.get('0x'+d.inline);if(!bytes?.present)throw Error('INLINE_BYTES_MISSING');return e.getBytes(bytes.body).slice(32);
      }});
      result.push({recordId:r.recordId,kind:'content-descriptor',state:open.state,reason:open.reason,rawId:contentCodec.rawId(descriptor),length:descriptor.length});
    }
  }
  return result;
}
export async function verifyGuardedClaim(e,x,{described}={}){
  need(x?.format===FORMAT&&x.proof===PROOF,'FORMAT_UNSUPPORTED');
  const profile=archiveProfile(e),{hash,coder}=codec(e);
  need(x.profile&&Object.keys(profile).every(k=>eq(x.profile[k],profile[k])),'DOMAIN_UNSUPPORTED');
  need(Array.isArray(x.actions)&&x.actions.length>0&&x.actions.length<=64&&Number(x.leafCount)===x.actions.length,'ACTION_BOUNDS');
  coder.encode([INTENT],[x.intent]);const actionsHash=hash([ACTION+'[]'],[x.actions]);need(eq(actionsHash,x.actionsHash),'ACTIONS_HASH');
  const reads=decodeReads(e,x.readSetBytes),readSetHash=hash(['bytes32',READ_SET],[e.id('efs.lab.read-set/2:ordered-first-binding'),reads]);
  need(eq(readSetHash,x.intent.readSetHash),'READSET_HASH');
  need(x.execution&&eq(x.execution.origin,x.intent.realmOrigin)&&eq(hash(['bytes32','bytes32','bytes32','bytes32',EXECUTION],
    [e.id('efs.lab.execution-set/2'),profile.layoutId,profile.legacyDomain,profile.guardedDomain,x.execution]),x.intent.executionSet),'EXECUTION_HASH');
  const th=e.id('IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)');
  const claimId=e.keccak256(e.concat(['0x1901',profile.guardedDomain,hash(['bytes32',INTENT,'bytes32'],[th,x.intent,actionsHash])]));
  need(hex(x.signature)&&e.getBytes(x.signature).length===65,'SIGNATURE_UNSUPPORTED');
  const signature=e.Signature.from(x.signature);need([27,28].includes(e.getBytes(x.signature)[64]),'SIGNATURE');
  need(eq(e.recoverAddress(claimId,signature),x.intent.author)&&!eq(x.intent.author,e.ZeroAddress),'SIGNATURE');
  const principalId=e.zeroPadValue(x.intent.author,32),publicationId=hash(['bytes32','bytes32','bytes32'],[e.id('efs.lab.publication/2'),principalId,claimId]);
  need(eq(claimId,x.claimId)&&eq(principalId,x.principalId)&&eq(publicationId,x.publicationId),'CLAIM_ID');
  const {expected,complete}=checkBodies(e,x),closureCoverage=checkClosure(e,x,expected);
  const interpretation=described?described.interpretationFor(e,x.closure):{coverage:'PARTIAL',reason:'INTERPRETER_NOT_SUPPLIED'};
  if(x.observations)need(x.observations.grade==='RPC_OBSERVED_NOT_STATE_PROOF','OBSERVATION_GRADE');
  return {claimId,publicationId,principalId,author:e.getAddress(x.intent.author),proof:PROOF,bodyCoverage:complete?'COMPLETE':'PARTIAL',closureCoverage,interpretationCoverage:interpretation.coverage,interpretation,content:await contentEvidence(e,x.closure),
    missingMeaning:[...x.closure.types.filter(t=>t.present===false).map(t=>`type:${t.typeId}`),...x.closure.records.filter(r=>!r.present).map(r=>`record:${r.recordId}`)],
    authority:'NONE',sourceAdmission:'NOT_PROVEN',guardTruth:'NOT_PROVEN',historicalExecution:'SIGNER_COMMITTED_NOT_AUTHENTICATED',currentness:'NOT_PROVEN'};
}
export function encodeGuardedRetention(e,x){
  const reads=decodeReads(e,x.readSetBytes),bodies=x.bodies.filter(b=>b.present).map(({leaf,body})=>({leaf,body}));
  need(x.actions.length>0&&x.actions.length<=64&&bodies.length<=64,'ACTION_BOUNDS');
  need(bodies.reduce((n,b)=>n+e.getBytes(b.body).length,0)<=8192,'BODY_BOUNDS');
  const data=new e.Interface(ARCHIVE_ABI).encodeFunctionData('retainGuardedSignedClaim',[x.intent,x.actions,reads,x.execution,x.signature,bodies]);
  need(e.getBytes(data).length<=48292,'CALLDATA_BOUNDS');return data;
}

/** Export all claims from retained state, not transaction input or SDK journal.
 * The caller supplies the immutable lab ABI/address profile. Latest execution,
 * author account code and source digest helpers are never consulted. */
export function createGuardedArchiveReader({ethers:e,rpc,manifest,described}){
  need(manifest.protocol==='compact-guarded-v2','FORMAT_UNSUPPORTED');
  const li=new e.Interface(manifest.contracts.ledger.abi),ri=new e.Interface(manifest.contracts.registry.abi),ai=new e.Interface(ARCHIVE_ABI);
  const {hash,record}=codec(e),ledger=manifest.contracts.ledger.address,registry=manifest.contracts.registry.address;
  const pin=async context=>{
    const block=context?.blockHash?await rpc('eth_getBlockByHash',[context.blockHash,false]):await rpc('eth_getBlockByNumber',['latest',false]);
    need(block&&block.hash,'BLOCK_UNAVAILABLE');return {blockHash:block.hash,blockNumber:String(BigInt(block.number)),
      chainId:String(BigInt(await rpc('eth_chainId',[]))),tag:{blockHash:block.hash,requireCanonical:true}};
  };
  const call=async(address,iface,fn,args,basis)=>iface.decodeFunctionResult(fn,await rpc('eth_call',[{to:address,data:iface.encodeFunctionData(fn,args)},basis.tag]));
  const lc=(fn,args,basis)=>call(ledger,li,fn,args,basis),rc=(fn,args,basis)=>call(registry,ri,fn,args,basis);
  async function closureFor(actions,basis){
    const leaves=actionRecords(e,actions),roots=[...new Set(leaves.map(a=>a.recordId.toLowerCase()))],records=new Map(),types=new Map();
    const queue=leaves.map(a=>({id:a.recordId,type:a.typeId}));let copied=0;
    while(queue.length){
      const {id,type}=queue.shift(),key=id.toLowerCase();if(records.has(key))continue;
      need(records.size<4096,'EXPORT_RECORD_BUDGET');let row;
      try{row=await lc('record',[id],basis);}catch{records.set(key,{recordId:id,typeId:type??e.ZeroHash,present:false,reason:'RPC_UNAVAILABLE'});continue;}
      if(BigInt(row[1])===0n){records.set(key,{recordId:id,typeId:type??e.ZeroHash,present:false,reason:'RECORD_UNAVAILABLE'});continue;}
      need(!type||eq(type,e.ZeroHash)||eq(type,row[0]),'REFERENCE_TYPE');
      const r={recordId:id,typeId:row[0],present:true,body:row[3]};records.set(key,r);
      need(eq(record(r.typeId,e.keccak256(r.body)),r.recordId),'RECORD_ID');copied+=e.getBytes(r.body).length;need(copied<=16_777_216,'EXPORT_BYTE_BUDGET');
      const tkey=r.typeId.toLowerCase();let t=types.get(tkey);
      if(!t){
        need(types.size<512,'EXPORT_TYPE_BUDGET');
        try{
          const d=await rc('descriptor',[r.typeId],basis),refs=Array.from((await rc('refTypes',[r.typeId],basis))[0]);
          const ruleCode=eq(d[1],e.ZeroHash)?'0x':await rpc('eth_getCode',[d[2],basis.tag]);
          t={typeId:r.typeId,present:true,shape:d[0],ruleId:d[1],refTypes:refs,ruleCode};
          if(described&&ri.hasFunction('describedStatus'))t.described=await described.captureType({type:t,rc,basis,registry,code:address=>rpc('eth_getCode',[address,basis.tag])});
          else if(!ri.hasFunction('describedStatus'))t.described={status:0};
        }catch{t={typeId:r.typeId,present:false,reason:'TYPE_PREIMAGE_UNAVAILABLE'};}
        types.set(tkey,t);
        checkTypeSidecarBudget([...types.values()]);
      }
      if(t.present)for(let i=0;i<t.refTypes.length;i++){
        need(e.getBytes(r.body).length>=32*(i+1),'REFERENCE_LENGTH');const ref=e.dataSlice(r.body,i*32,i*32+32);
        queue.push({id:ref,type:t.refTypes[i]});
      }
    }
    return {roots,records:[...records.values()],types:[...types.values()],coverage:[...records.values()].some(r=>!r.present)||[...types.values()].some(t=>!t.present)?'PARTIAL':'COMPLETE'};
  }
  async function exportPublication({publication,context}={}){
    need(/^[1-9][0-9]*$/.test(String(publication)),'PUBLICATION');const basis=await pin(context);
    need(basis.chainId===String(manifest.chainId),'SOURCE_CHAIN');
    const evidence=await lc('evidence',[publication],basis),retained=(await lc('publicationContext',[publication],basis))[0];
    need(Number(retained.intentFormat)===2&&Number(retained.principalKind)===1&&Number(retained.authorizationProfile)===2&&Number(evidence[1])===2,'SOURCE_UNSUPPORTED');
    const leafCount=Number(evidence[3]),first=BigInt(evidence[4]);need(leafCount>0&&leafCount<=64&&first>0n,'SOURCE_UNSUPPORTED');
    const actions=[];
    for(let leaf=0;leaf<leafCount;leaf++){
      const row=await lc('admission',[first+BigInt(leaf)],basis);
      need(Number(row[1])===leaf&&BigInt(row[2])===BigInt(publication),'ADMISSION_SEQUENCE');
      const a={kind:Number(row[0]),typeId:e.ZeroHash,bodyHashOrRecordId:e.ZeroHash,purpose:e.ZeroHash,subject:e.ZeroHash,role:e.ZeroHash,target:e.ZeroHash,expectedRevision:0,salt:e.ZeroHash};
      if(a.kind===1){a.typeId=row[7];a.bodyHashOrRecordId=row[6];}
      else if(a.kind===2){a.typeId=(await lc('record',[row[6]],basis))[0];a.bodyHashOrRecordId=row[6];}
      else if(a.kind===3||a.kind===4||a.kind===7){
        const position=(await lc('bindingPosition',[row[3]],basis))[0],fields=await lc('positionCell',[position],basis);
        [a.purpose,a.subject,a.role]=Array.from(fields);a.expectedRevision=Number(row[4]);if(a.kind===3)a.target=row[6];
      }else if(a.kind===5)a.salt=row[6];else if(a.kind===6)a.target=row[6];else fail('SOURCE_ACTION_UNSUPPORTED');
      actions.push(a);
    }
    const execution=names(e,EXECUTION,(await lc('executionInfo',[retained.executionSet],basis))[0]);
    const readSetBytes=(await lc('readSetBytes',[retained.readSetHash],basis))[0];need(readSetBytes!=='0x','READSET_MISSING');
    const intent={realmId:(await lc('realmId',[],basis))[0],realmOrigin:execution.origin,executionSet:retained.executionSet,author:evidence[0],nonce:String(evidence[7]),
      deadline:String(evidence[8]),acceptanceProfile:evidence[10],indexObligations:evidence[11],readSetHash:retained.readSetHash};
    const claimId=retained.intentDigest,principalId=retained.principalId;
    const publicationId=hash(['bytes32','bytes32','bytes32'],[e.id('efs.lab.publication/2'),principalId,claimId]);
    need(BigInt((await lc('publicationOf',[publicationId],basis))[0])===BigInt(publication),'PUBLICATION_ID');
    const closure=await closureFor(actions,basis),byId=new Map(closure.records.map(r=>[r.recordId.toLowerCase(),r]));
    const bodies=actionRecords(e,actions).map(a=>{const r=byId.get(a.recordId.toLowerCase());return r.present?{leaf:a.leaf,present:true,body:r.body}:{leaf:a.leaf,present:false};});
    const x={format:FORMAT,proof:PROOF,profile:archiveProfile(e),intent,actions,actionsHash:evidence[12],leafCount,execution,readSetBytes,
      signature:e.Signature.from({r:evidence[5],s:evidence[6],v:Number(evidence[2])}).serialized,claimId,principalId,publicationId,bodies,closure,
      observations:{grade:'RPC_OBSERVED_NOT_STATE_PROOF',source:{chainId:basis.chainId,ledger,blockHash:basis.blockHash,blockNumber:basis.blockNumber},
        publication:String(publication),firstAdmission:String(first),finalAdmission:String(first+BigInt(leafCount)-1n),publicationContext:plain(retained.toObject())}};
    await verifyGuardedClaim(e,x,{described});return x;
  }
  async function exportArchivedClaim({address,claimId,closure,context}={}){
    const basis=await pin(context),ac=(fn,args)=>call(address,ai,fn,args,basis);
    need(Number((await ac('claimFormat',[claimId]))[0])===2,'SOURCE_UNSUPPORTED');
    const c=await ac('guardedClaim',[claimId]);need(Number(c.proof)===1,'SOURCE_UNSUPPORTED');
    const intent=names(e,INTENT,c.source),leafCount=Number(c.leafCount),actions=[];
    for(let leaf=0;leaf<leafCount;leaf++)actions.push(names(e,ACTION,(await ac('actionAt',[claimId,leaf]))[0]));
    const reads=await ac('readSetBytes',[intent.readSetHash]),ex=await ac('executionInfo',[intent.executionSet]);need(reads.exists&&ex.exists,'PREIMAGE_MISSING');
    const bodies=[],records=new Map(),types=new Map();
    for(const a of actionRecords(e,actions)){
      const r=await ac('selectedRecord',[claimId,a.leaf]);need(eq(r.recordId,a.recordId)&&eq(r.typeId,a.typeId),'BODY_ID');
      bodies.push(r.claimBodyAttached?{leaf:a.leaf,present:true,body:r.body}:{leaf:a.leaf,present:false});
      const old=records.get(a.recordId.toLowerCase());if(!old||r.claimBodyAttached)records.set(a.recordId.toLowerCase(),{recordId:a.recordId,typeId:a.typeId,present:r.claimBodyAttached,...(r.claimBodyAttached?{body:r.body}:{})});
      types.set(a.typeId.toLowerCase(),{typeId:a.typeId,present:false,reason:'ARCHIVE_DOES_NOT_RETAIN_TYPE_DESCRIPTOR'});
    }
    const principalId=e.zeroPadValue(intent.author,32),publicationId=hash(['bytes32','bytes32','bytes32'],[e.id('efs.lab.publication/2'),principalId,claimId]);
    const x={format:FORMAT,proof:PROOF,profile:archiveProfile(e),intent,actions,actionsHash:c.actionsHash,leafCount,execution:names(e,EXECUTION,ex.info),readSetBytes:reads.raw,
      signature:e.Signature.from({r:c.r,s:c.s,v:Number(c.v)}).serialized,claimId,principalId,publicationId,bodies,
      closure:closure?plain(closure):{roots:[...records.keys()],records:[...records.values()],types:[...types.values()],coverage:types.size?'PARTIAL':'COMPLETE'},
      observations:{grade:'RPC_OBSERVED_NOT_STATE_PROOF',archive:{chainId:basis.chainId,address,blockHash:basis.blockHash,blockNumber:basis.blockNumber},
        firstImporter:c.firstImporter,retainedAt:String(c.retainedAt),bodyCoverage:String(c.bodyCoverage)}};
    await verifyGuardedClaim(e,x,{described});return x;
  }
  return Object.freeze({exportPublication,exportArchivedClaim});
}
