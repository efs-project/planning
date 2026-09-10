// Root-directory-only fixture reader. No bytes, revision heads, actions or wallet.
import { FIXTURE,TYPES,assessRecord,nameAssessment,nameRole,positionKey,bindingKey,bindingScopeKey,purposeAndScope,parsePlan,contentDigest,byteLength,foldChunkLeaves,EMPTY_CONTENT_ROOT } from './files-profile.mjs';
const ZERO='0x'+'0'.repeat(64),END=(1n<<256n)-1n,MASK48=(1n<<48n)-1n;
const caches=new WeakMap();
const freeze=x=>{if(x&&typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};
class Failure extends Error{constructor(reason,detail=reason){super(detail);this.reason=reason;}}
const require=(ok,reason='MALFORMED_SELECTED')=>{if(!ok)throw new Failure(reason);};
const equal=(a,b)=>String(a).toLowerCase()===String(b).toLowerCase();
const cache=scope=>{if(!caches.has(scope))caches.set(scope,{records:new Map(),nodes:new Map(),mounts:new Map()});return caches.get(scope);};
async function memo(map,key,read){if(map.has(key))return map.get(key);const p=read();map.set(key,p);try{return await p;}catch(e){map.delete(key);throw e;}}
async function together(work){const done=await Promise.allSettled(work),failed=done.find(r=>r.status==='rejected');if(failed)throw failed.reason;return done.map(r=>r.value);}
async function call(scope,name,args){const r=await scope.call(name,args);if(r.status!=='OK')throw new Failure('EVIDENCE_UNAVAILABLE',r.reason);return r.values;}
function readBasis(scope,basis,H){require(equal(basis,scope.basis.executionSetId)&&H===scope.basis.admissionHigh,'BASIS_MISMATCH');}
async function record(scope,id,type){
  const r=await memo(cache(scope).records,id,async()=>{
    const [T,body,ordinal]=await call(scope,'getRecord',[id]);
    require(ordinal>0n&&ordinal<=scope.basis.admissionHigh,'RECORD_UNAVAILABLE');
    const a=assessRecord(id,T,body);
    if(a.status!=='ACCEPTED')throw new Failure(a.status==='UNSUPPORTED'?'UNSUPPORTED_TYPE':'MALFORMED_SELECTED',a.reason);
    return a;
  });
  require(!type||r.type===type);return r;
}
const isCharter=(head,id)=>head[0]===1n&&head[1]===1n&&head[5]===id&&head[6]===0n;
async function node(scope,id){return memo(cache(scope).nodes,id,async()=>{
  const {fields:o}=await record(scope,id,'ObjectGenesis/1');
  require(o.meaning===FIXTURE.fileMeaning||o.meaning===FIXTURE.directoryMeaning);
  const key=bindingKey(o.publisher,FIXTURE.charterPurpose,id,FIXTURE.charterRole);
  const [current,basis,H]=await call(scope,'getBindingHead',[key]);readBasis(scope,basis,H);
  require(current[4]<=H,'HISTORY_MISMATCH');
  async function source(head,history){
    const [envelopeId,leafIndex,recordId,typeId,principal,status,revoked]=await call(scope,'getOccurrenceByOrdinal',[head[4]]);
    require(principal===o.publisher&&head[4]>0n&&head[4]<=H,'CHARTER_SOURCE_MISMATCH');
    if(history)require(envelopeId===history[2]&&leafIndex===history[3]&&status===history[4]&&revoked===history[5],'HISTORY_SOURCE_MISMATCH');
    require(status===1n||status===2n,'CHARTER_SOURCE_UNAVAILABLE');
    const occurrence=await call(scope,'getOccurrence',[envelopeId,leafIndex]);
    require(occurrence[0]===status&&occurrence[1]===head[4]&&occurrence[2]===recordId&&occurrence[3]===typeId&&occurrence[4]===principal&&occurrence[5]===revoked,'CHARTER_SOURCE_MISMATCH');
    return {recordId,typeId,status,revoked};
  }
  async function witness(head,history){
    const s=await source(head,history);
    const [at,atBasis,atH]=await call(scope,'getBindingAtBasis',[key,head[4]]);
    require(equal(atBasis,basis)&&atH===head[4]&&at[3]===head[3]&&at[4]===head[4],'HISTORY_MISMATCH');
    if(!isCharter(at,id))return false;
    const {fields:f}=await record(scope,s.recordId,'BindingSet/1');
    require(s.typeId===TYPES['BindingSet/1']&&f.purpose===FIXTURE.charterPurpose&&f.subject===id&&f.fieldRole===FIXTURE.charterRole&&f.targetRecord===id&&f.targetOccurrence===null,'CHARTER_SOURCE_MISMATCH');
    require(s.status===1n||(s.revoked>head[4]&&s.revoked<=H),'HISTORY_SOURCE_MISMATCH');
    return s;
  }
  let witnessed=false,maintenance=isCharter(current,id)?'UNKNOWN':current[0]===1n?'WRONG_TARGET':'NOT_MAINTAINED';
  if(isCharter(current,id)){
    const s=await witness(current);require(s&&s.status===1n&&s.revoked===0n,'CHARTER_SOURCE_MISMATCH');witnessed=true;maintenance='MAINTAINED';
  }else{
    const [history,next,complete]=await call(scope,'readHistory',[key,1,64]);
    require(history.length<=64&&(complete===1n||complete===2n)&&((complete===1n&&next===0n)||(complete===2n&&next===BigInt(history.length+1)&&history.length===64)),'HISTORY_MISMATCH');
    let previous=0n;
    for(const [i,h] of history.entries()){
      require(h[0]===BigInt(i+1)&&h[1]>previous&&h[1]<=H,'HISTORY_MISMATCH');previous=h[1];
      const [at,atBasis,atH]=await call(scope,'getBindingAtBasis',[key,h[1]]);
      require(equal(atBasis,basis)&&atH===h[1]&&at[3]===h[0]&&at[4]===h[1],'HISTORY_MISMATCH');
      if(isCharter(at,id)){witnessed=!!await witness(at,h);if(witnessed)break;}
      else await source(at,h);
    }
    require(witnessed,complete===2n?'CHARTER_HISTORY_LIMIT':'NO_HISTORICAL_CHARTER');
  }
  return freeze({nodeId:id,kind:o.meaning===FIXTURE.fileMeaning?'FILE':'DIRECTORY',publisher:o.publisher,historicalCharter:'VALID',maintenance,content:'NOT_READ'});
});}
async function plan(scope,id,kind,root){
  const r=await record(scope,id,'ResolutionPlan/1'),p=parsePlan(r.raw.typeId,r.raw.body);
  require(p.code===0);require(p.profile===FIXTURE.lensProfile,'UNSUPPORTED_PLAN');require(p.purposeAndScope===purposeAndScope(kind,root));
  const [valid,code]=await call(scope,'validatePlan',[id]);require(valid&&code===0n,'PLAN_VALIDATION_MISMATCH');return p;
}
async function mount(scope,id){return memo(cache(scope).mounts,id,async()=>{
  const {fields:m}=await record(scope,id,'MountDescriptor/1');require(m.profileId===FIXTURE.publicProfile,'UNSUPPORTED_MOUNT');
  const [{fields:c},root]=await together([record(scope,m.configRef,'PublicFilesMountConfig/1'),node(scope,m.rootNode)]);
  require((c.metadataPlan===null)===(c.propertyProfile===null));require(c.metadataPlan===null,'UNSUPPORTED_PROPERTIES');
  require(root.kind==='DIRECTORY'?c.namespacePlan!==null:c.namespacePlan===null);
  const [namespace,content]=await together([c.namespacePlan?plan(scope,c.namespacePlan,'namespace',root.nodeId):null,plan(scope,c.contentPlan,'content',root.nodeId)]);
  return freeze({mountId:id,root,namespace,content,namespacePlan:c.namespacePlan,contentPlan:c.contentPlan});
});}
const unknown=e=>({outcome:'UNKNOWN',reason:e.reason??'EVIDENCE_UNAVAILABLE',detail:e.message});
// subject: the listed directory's node id. The mount root remains the plan
// scope anchor; child directories share the mount's namespace plan (§4.2).
async function resolveRole(scope,m,subject,fieldRole,requestedName){
  try{
    const [r]=await call(scope,'resolve',[m.namespacePlan,positionKey(FIXTURE.namePurpose,subject,fieldRole)]);
    const b=r[8];readBasis(scope,b[0],b[2]);require(b[1]===scope.basis.blockNumber&&b[3]===0n,'BASIS_MISMATCH');
    if(r[0]===3n)return {outcome:'CONFLICT',fieldRole};
    if(r[0]===2n)return {outcome:'ABSENT',fieldRole};
    require(r[0]===1n,r[0]===4n?'UNSUPPORTED_PLAN':'LENS_UNKNOWN');
    require(r[2][0]===1n&&r[2][2]===0n);
    const selectedId=r[2][1],entry=await record(scope,selectedId);
    require(entry.type==='DirectoryEntry/1'||entry.type==='DirectoryWhiteout/1');const f=entry.fields;
    require(f.parent===subject&&nameRole(f.name)===fieldRole&&(requestedName===undefined||requestedName===f.name));
    const name=nameAssessment(f.name);require(name.status==='ACCEPTED',name.status==='UNSUPPORTED'?'UNSUPPORTED_NAME':'MALFORMED_SELECTED');
    if(entry.type==='DirectoryWhiteout/1')return {outcome:'MASKED',fieldRole,selectedId};
    const child=await node(scope,f.child);
    let override=null;if(f.mountOverride){override=await mount(scope,f.mountOverride);require(override.root.nodeId===f.child);}
    // Navigation handle: a child DIRECTORY without an override mount is listed
    // under the SAME mount with subject=f.child — never by re-following mountId.
    return {outcome:'FOUND',fieldRole,selectedId,value:{...child,name:f.name,mountId:override?.mountId??m.mountId,mountOverride:f.mountOverride,subject:f.child}};
  }catch(e){return {...unknown(e),fieldRole};}
}
async function directorySubject(scope,m,subject){
  if(subject===undefined||subject===m.root.nodeId){require(m.root.kind==='DIRECTORY','NOT_A_DIRECTORY');return m.root.nodeId;}
  const n=await node(scope,subject);require(n.kind==='DIRECTORY','NOT_A_DIRECTORY');return n.nodeId;
}
const missing=reason=>['EVIDENCE_UNAVAILABLE','RECORD_UNAVAILABLE','CHARTER_SOURCE_UNAVAILABLE','CHARTER_HISTORY_LIMIT','LENS_UNKNOWN'].includes(reason);
function qualification(status,coverage,outcome,reason){return freeze({status,coverage,support:reason?.startsWith('UNSUPPORTED')?'UNSUPPORTED':'FIXTURE_ASCII_ONLY',validation:outcome==='FOUND'?'FIXTURE_FILES_VALIDATED':outcome==='UNKNOWN'?'UNRESOLVED':'NO_SELECTED_NODE',integrity:status==='QUALIFIED'?'SOURCE_PINNED_EXACT_ABI':'UNAVAILABLE',authority:'SYNTHETIC_OPERATOR_ONLY',finality:'PROVISIONAL',availability:status==='QUALIFIED'&&!missing(reason)?'OBTAINED':'UNAVAILABLE',effect:'NOT_APPLICABLE'});}
async function sealed(scope,value,coverage='COMPLETE',domain='FIXTURE_ROOT_DIRECTORY_ONLY'){
  const seal=await scope.seal();
  if(seal.status!=='SEALED')return freeze({...unknown(new Failure('SEAL_FAILED',seal.reason)),basis:scope.basis,domain,qualification:qualification('UNAVAILABLE','UNKNOWN','UNKNOWN'),evidence:seal.evidence});
  return freeze({...value,basis:scope.basis,domain,qualification:qualification('QUALIFIED',missing(value.reason)?'UNKNOWN':coverage,value.outcome,value.reason),evidence:seal.evidence});
}
const domainFor=(m,subject)=>subject===m?.root.nodeId?'FIXTURE_ROOT_DIRECTORY_ONLY':'FIXTURE_DIRECTORY_SUBTREE';
/** A top-level acquisition: do not overlap with another top-level use of scope. */
export async function lookupName(scope,{mountId,subject,name}){
  let result,dom='FIXTURE_ROOT_DIRECTORY_ONLY';
  try{const n=nameAssessment(name);require(n.status==='ACCEPTED',n.status==='UNSUPPORTED'?'UNSUPPORTED_NAME':'MALFORMED_NAME');const m=await mount(scope,mountId);const s=await directorySubject(scope,m,subject);dom=domainFor(m,s);result=await resolveRole(scope,m,s,nameRole(name),name);}
  catch(e){result=unknown(e);}return sealed(scope,result,'COMPLETE',dom);
}
/** Verified file content at the mount's content plan. Top-level acquisition. */
export async function openFile(scope,{mountId,fileId,revisionId:requested}){
  let result,revisionId=null;
  try{
    const m=await mount(scope,mountId);
    const file=await node(scope,fileId);require(file.kind==='FILE','NOT_A_FILE');
    let selected=requested??null;
    if(!selected){
      const [r]=await call(scope,'resolve',[m.contentPlan,positionKey(FIXTURE.headPurpose,fileId,FIXTURE.headRole)]);
      const b=r[8];readBasis(scope,b[0],b[2]);require(b[1]===scope.basis.blockNumber&&b[3]===0n,'BASIS_MISMATCH');
      if(r[0]===3n)selected='CONFLICT';
      else if(r[0]===2n)selected='ABSENT';
      else{
        require(r[0]===1n,r[0]===4n?'UNSUPPORTED_PLAN':'LENS_UNKNOWN');
        require(r[2][0]===1n&&r[2][2]===0n);
        selected=r[2][1];
      }
    }
    if(selected==='CONFLICT')result={outcome:'CONFLICT'};
    else if(selected==='ABSENT')result={outcome:'ABSENT'};
    else{
      revisionId=selected;
      const rev=await record(scope,revisionId,'FileRevision/1');const f=rev.fields;
      require(f.node===fileId,'REVISION_NODE_MISMATCH');
      const tree=await record(scope,f.content,'ChunkTree/1');const t=tree.fields;
      const meta={fileId,revisionId,mediaType:f.mediaType,charset:f.charset,executableHint:f.executableHint,parents:f.parents,totalSize:String(t.totalSize)};
      if(t.totalSize===0n){
        // Canonical empty content: verified from the tree commitment alone.
        require(t.merkleRoot===EMPTY_CONTENT_ROOT&&t.chunkCount===0,'MALFORMED_SELECTED');
        result={outcome:'FOUND',value:{...meta,bytes:'0x',integrity:'VERIFIED'}};
      }else{
      const has=await scope.carrierCall('hasFixtureBytes',[f.content]);
      if(has.status!=='OK')throw new Failure('EVIDENCE_UNAVAILABLE',has.reason);
      if(has.values[0]){
        // Legacy pre-upgrade single-blob staging.
        const read=await scope.carrierCall('readFixtureBytes',[f.content]);
        if(read.status!=='OK')throw new Failure('EVIDENCE_UNAVAILABLE',read.reason);
        const data=read.values[0];
        const okBytes=byteLength(data)===t.totalSize&&t.chunkCount===1&&contentDigest(data)===t.merkleRoot;
        // Mismatching bytes are returned with failed integrity, never as verified.
        result={outcome:'FOUND',value:{...meta,bytes:okBytes?data:null,rawBytes:okBytes?undefined:data,integrity:okBytes?'VERIFIED':'DIGEST_MISMATCH'}};
      }else{
        // Chunked staging: fetch every chunk, rebuild leaves, refold the tree.
        require(t.chunkCount<=256,'UNSUPPORTED_CHUNKS');
        const parts=[];let present=0;
        for(let i=0;i<t.chunkCount;i++){
          const one=await scope.carrierCall('readChunk',[f.content,i]);
          if(one.status==='OK'){parts.push(one.values[0]);present++;}else parts.push(null);
        }
        if(present<t.chunkCount){
          result={outcome:'FOUND',value:{...meta,bytes:null,integrity:'BYTES_UNAVAILABLE',chunksPresent:present,chunkCount:t.chunkCount}};
        }else{
          const data='0x'+parts.map(x=>x.slice(2)).join('');
          const okBytes=byteLength(data)===t.totalSize&&foldChunkLeaves(parts.map(contentDigest))===t.merkleRoot;
          result={outcome:'FOUND',value:{...meta,bytes:okBytes?data:null,rawBytes:okBytes?undefined:data,integrity:okBytes?'VERIFIED':'DIGEST_MISMATCH',chunksPresent:present,chunkCount:t.chunkCount}};
        }
      }
      }
    }
  }catch(e){result=unknown(e);}
  return sealed(scope,result,'COMPLETE','FIXTURE_FILE_CONTENT');
}
/** Per-principal timeline of one name slot, oldest first. Top-level acquisition. */
export async function openHistory(scope,{mountId,subject,name}){
  let result,dom='FIXTURE_ROOT_DIRECTORY_ONLY';
  try{
    const n=nameAssessment(name);require(n.status==='ACCEPTED',n.status==='UNSUPPORTED'?'UNSUPPORTED_NAME':'MALFORMED_NAME');
    const m=await mount(scope,mountId);const s=await directorySubject(scope,m,subject);dom=domainFor(m,s);
    const fieldRole=nameRole(name),principals=[...new Set(m.namespace.entries.map(e=>e.principal))];
    const timeline=[];
    for(const principal of principals){
      const key=bindingKey(principal,FIXTURE.namePurpose,s,fieldRole);
      const [history,next,complete]=await call(scope,'readHistory',[key,1,64]);
      require(history.length<=64&&(complete===1n||complete===2n),'HISTORY_MISMATCH');
      for(const h of history){
        if(h[1]>scope.basis.admissionHigh)continue;
        const [at,atBasis,atH]=await call(scope,'getBindingAtBasis',[key,h[1]]);
        require(equal(atBasis,scope.basis.executionSetId)&&atH===h[1],'HISTORY_MISMATCH');
        let entryKind='TOMBSTONE',target=null,child=null;
        if(at[0]===1n&&at[1]===1n){
          const rec=await record(scope,at[5]);
          entryKind=rec.type==='DirectoryWhiteout/1'?'WHITEOUT':'ENTRY';target=at[5];
          if(rec.type==='DirectoryEntry/1')child=rec.fields.child;
        }
        timeline.push({principal,revision:String(at[3]),ordinal:String(h[1]),kind:entryKind,target,child});
      }
      if(complete===2n)timeline.push({principal,revision:'>64',ordinal:null,kind:'TRUNCATED',target:null,child:null});
    }
    timeline.sort((a,b)=>(BigInt(a.ordinal??0)<BigInt(b.ordinal??0)?-1:1));
    result={outcome:'FOUND',value:{name,subject:s,timeline}};
  }catch(e){result=unknown(e);}
  return sealed(scope,result,'COMPLETE',dom);
}
/** Revision chain of one file under the content plan's selected principal. */
export async function openRevisions(scope,{mountId,fileId}){
  let result;
  try{
    const m=await mount(scope,mountId);
    const file=await node(scope,fileId);require(file.kind==='FILE','NOT_A_FILE');
    const principals=[...new Set(m.content.entries.map(e=>e.principal))];
    const revisions=[];
    for(const principal of principals){
      const key=bindingKey(principal,FIXTURE.headPurpose,fileId,FIXTURE.headRole);
      const [history,,complete]=await call(scope,'readHistory',[key,1,64]);
      require(history.length<=64&&(complete===1n||complete===2n),'HISTORY_MISMATCH');
      for(const h of history){
        if(h[1]>scope.basis.admissionHigh)continue;
        const [at,atBasis,atH]=await call(scope,'getBindingAtBasis',[key,h[1]]);
        require(equal(atBasis,scope.basis.executionSetId)&&atH===h[1],'HISTORY_MISMATCH');
        if(at[0]===1n&&at[1]===1n){
          const rev=await record(scope,at[5],'FileRevision/1');
          require(rev.fields.node===fileId,'REVISION_NODE_MISMATCH');
          revisions.push({principal,revision:String(at[3]),ordinal:String(h[1]),revisionId:at[5],mediaType:rev.fields.mediaType,parents:rev.fields.parents,current:false});
        }else revisions.push({principal,revision:String(at[3]),ordinal:String(h[1]),revisionId:null,mediaType:null,parents:[],current:false});
      }
    }
    revisions.sort((a,b)=>(BigInt(a.ordinal)<BigInt(b.ordinal)?-1:1));
    if(revisions.length)revisions.at(-1).current=true;
    result={outcome:'FOUND',value:{fileId,revisions}};
  }catch(e){result=unknown(e);}
  return sealed(scope,result,'COMPLETE','FIXTURE_FILE_CONTENT');
}

function checkedPage(scope,state,page,rows,pageSize){
  readBasis(scope,page[0],page[1]);const cursor=page[2],coverage=page[4],complete=page[5],ids=page[3];
  require((complete===1n||complete===2n)&&ids.length===rows.length&&ids.length<=pageSize&&coverage===BigInt(rows.length),'PAGE_ALIGNMENT');
  const scanned=state.scanned+coverage;
  if(complete===1n){require(cursor===END,'PAGE_TERMINAL');if(state.end!==null)require(scanned===state.end,'PAGE_PREFIX_GAP');}
  else{
    require(cursor!==0n&&cursor!==END&&cursor!==state.cursor&&cursor>>255n===0n&&((cursor>>144n)&255n)===1n,'PAGE_CURSOR');
    const next=cursor&MASK48,end=(cursor>>48n)&MASK48,H=(cursor>>96n)&MASK48,tag=cursor>>152n;
    require(coverage>0n&&next===scanned&&next<end&&H===scope.basis.admissionHigh,'PAGE_PREFIX_GAP');
    require(state.end===null||(end===state.end&&tag===state.tag),'PAGE_CONTEXT');state.end=end;state.tag=tag;
  }
  let previous=state.last;
  for(let i=0;i<rows.length;i++){const r=rows[i];require(BigInt(ids[i])===r[0]&&r[0]>previous&&r[0]<=scope.basis.admissionHigh,'PAGE_ORDINAL');require(r[4]===state.principal&&(r[5]===1n||r[5]===2n)&&(r[5]===1n?r[6]===0n:r[6]>r[0]&&r[6]<=scope.basis.admissionHigh),'PAGE_SOURCE');previous=r[0];}
  state.last=previous;state.scanned=scanned;state.cursor=cursor;state.complete=complete===1n;
}
export function openDirectory(scope,{mountId,subject,pageSize=8}){
  require(Number.isInteger(pageSize)&&pageSize>=1&&pageSize<=32,'PAGE_SIZE');
  let closed=false,flight=null,sources=null,positions=new Map(),last=null,latest=null,listDomain='FIXTURE_ROOT_DIRECTORY_ONLY';
  const progress=ss=>(ss??[]).map(s=>({principal:s.principal,cursor:s.cursor,scanned:s.scanned,complete:s.complete}));
  function snapshot(rowsMap,ss,coverage){const all=[...rowsMap.values()];return {coverage,rows:all.filter(r=>r.outcome==='FOUND').sort((a,b)=>a.value.name<b.value.name?-1:a.value.name>b.value.name?1:0),unresolved:all.filter(r=>r.outcome==='UNKNOWN'||r.outcome==='CONFLICT'),masked:all.filter(r=>r.outcome==='MASKED'),absent:all.filter(r=>r.outcome==='ABSENT'),progress:progress(ss),continuation:!(ss?.every(s=>s.complete)??false)};}
  async function step(){
    let ss=sources?.map(s=>({...s,roles:[...s.roles]})),next=new Map(positions),failure;
    try{
      require(!closed,'STREAM_CLOSED');const m=await mount(scope,mountId);
      const listed=await directorySubject(scope,m,subject);listDomain=domainFor(m,listed);
      ss??=[...new Set(m.namespace.entries.map(e=>e.principal))].map(principal=>({principal,cursor:0n,scanned:0n,last:0n,end:null,tag:null,roles:[],complete:false}));
      const pages=await Promise.all(ss.filter(s=>!s.complete).map(async s=>{
        try{const [page,rows]=await call(scope,'pagePostingsHydrated',[ZERO,10,0,bindingScopeKey(s.principal,FIXTURE.namePurpose,listed),[s.cursor,pageSize,scope.basis.admissionHigh]]);checkedPage(scope,s,page,rows,pageSize);return {s,rows};}catch(e){return {s,error:e};}
      }));
      const roles=new Set([...positions].filter(([,v])=>v.outcome==='UNKNOWN').map(([r])=>r));
      await Promise.all(pages.map(async ({s,rows,error})=>{
        if(error){failure??=error;return;}
        try{const checked=await Promise.allSettled(rows.map(async row=>{
          const occurrence=await call(scope,'getOccurrenceByOrdinal',[row[0]]);
          require(occurrence[0]===row[1]&&occurrence[1]===row[2]&&occurrence[2]===row[3]&&occurrence[4]===row[4]&&occurrence[5]===row[5]&&occurrence[6]===row[6],'ANCHOR_SOURCE');
          const a=await record(scope,row[3]);require(a.type==='BindingSet/1'||a.type==='BindingTombstone/1','ANCHOR_TYPE');const f=a.fields;
          require(occurrence[3]===a.raw.typeId,'ANCHOR_SOURCE');
          require(f.purpose===FIXTURE.namePurpose&&f.subject===listed,'ANCHOR_SCOPE');
          const k=bindingKey(s.principal,f.purpose,f.subject,f.fieldRole);
          const [at,b,H]=await call(scope,'getBindingAtBasis',[k,row[0]]);require(equal(b,scope.basis.executionSetId)&&H===row[0]&&at[3]===1n&&at[4]===row[0],'ANCHOR_FIRST_MUTATION');
          if(a.type==='BindingSet/1')require((f.targetRecord===null)!==(f.targetOccurrence===null)&&at[0]===1n&&at[1]===(f.targetRecord?1n:2n)&&at[5]===(f.targetRecord??f.targetOccurrence.envelopeId)&&at[6]===BigInt(f.targetOccurrence?.leafIndex??0),'ANCHOR_TARGET');
          else require(at[0]===2n&&at[2]===1n,'ANCHOR_TARGET');
          require(!s.roles.includes(f.fieldRole),'DUPLICATE_ANCHOR_ROLE');s.roles.push(f.fieldRole);
          roles.add(f.fieldRole);
        }));const rejected=checked.find(r=>r.status==='rejected');if(rejected)throw rejected.reason;}catch(e){failure??=e;}
      }));
      const resolved=await Promise.all([...roles].map(async r=>[r,await resolveRole(scope,m,listed,r)]));for(const [r,v] of resolved)next.set(r,v);
      require(!closed,'STREAM_CLOSED');
    }catch(e){failure=e;}
    // Drain all internally owned row work before the one aggregate seal.
    const seal=await scope.seal();
    if(seal.status!=='SEALED'||closed)failure=new Failure(closed?'STREAM_CLOSED':'SEAL_FAILED',seal.reason);
    if(failure){latest=freeze({...snapshot(positions,sources,positions.size?'PARTIAL':'UNKNOWN'),basis:scope.basis,domain:listDomain,reason:failure.reason??failure.message,detail:failure.message,rowsEvidence:'PRIOR_SEALED',qualification:qualification('UNAVAILABLE',positions.size?'PARTIAL':'UNKNOWN','UNKNOWN'),evidence:seal.evidence,priorSealed:last});return latest;}
    const coverage=ss.every(s=>s.complete)?'COMPLETE':'PARTIAL';
    for(const [r,v] of next)next.set(r,freeze({...v,qualification:qualification('QUALIFIED',missing(v.reason)?'UNKNOWN':'COMPLETE',v.outcome,v.reason)}));
    const rows=[...next.values()],unavailable=rows.filter(r=>missing(r.reason)).length;
    const validation=rows.some(r=>r.outcome==='UNKNOWN'||r.outcome==='CONFLICT')?'UNKNOWN':rows.some(r=>r.outcome==='FOUND')?'FOUND':'ABSENT';
    const aggregate={...qualification('QUALIFIED',coverage,validation),availability:unavailable?(unavailable===rows.length?'UNAVAILABLE':'PARTIAL'):'OBTAINED',support:rows.some(r=>r.reason?.startsWith('UNSUPPORTED'))?'UNSUPPORTED':'FIXTURE_ASCII_ONLY'};
    sources=ss;positions=next;last=freeze({...snapshot(next,ss,coverage),basis:scope.basis,domain:listDomain,rowsEvidence:'CURRENT_SEALED',qualification:aggregate,evidence:seal.evidence});latest=last;return last;
  }
  return Object.freeze({loadMore(){if(!flight)flight=step().finally(()=>{flight=null;});return flight;},snapshot(){return latest;},close(){closed=true;}});
}

/** Removed items of one directory: per-principal enumeration of removal
 *  markers under the removed-item purpose. ACTIVE markers are current Trash
 *  rows; TOMBSTONED markers were restored. Top-level acquisition. */
export async function openRemoved(scope,{mountId,subject}){
  let result,dom='FIXTURE_ROOT_DIRECTORY_ONLY';
  try{
    const m=await mount(scope,mountId);
    const s=subject===undefined?m.root.nodeId:subject;
    const n=await node(scope,s);require(n.kind==='DIRECTORY','NOT_A_DIRECTORY');dom=domainFor(m,s);
    const principals=[...new Set(m.namespace.entries.map(e=>e.principal))];
    const items=[];
    for(const principal of principals){
      const state={principal,cursor:0n,scanned:0n,last:0n,end:null,tag:null,roles:[],complete:false};
      while(!state.complete){
        const [page,rows]=await call(scope,'pagePostingsHydrated',[ZERO,10,0,bindingScopeKey(principal,FIXTURE.removedPurpose,s),[state.cursor,8,scope.basis.admissionHigh]]);
        checkedPage(scope,state,page,rows,8);
        for(const row of rows){
          const a=await record(scope,row[3]);
          if(a.type!=='BindingSet/1')continue;
          const f=a.fields;
          require(f.purpose===FIXTURE.removedPurpose&&f.subject===s,'ANCHOR_SCOPE');
          const key=bindingKey(principal,f.purpose,s,f.fieldRole);
          const [head,basis,H]=await call(scope,'getBindingHead',[key]);readBasis(scope,basis,H);
          const marker=await record(scope,f.fieldRole,'RemovalMarker/1');
          const entry=await record(scope,marker.fields.entry,'DirectoryEntry/1');
          items.push({principal,markerId:f.fieldRole,entryId:marker.fields.entry,
            name:entry.fields.name,object:entry.fields.child,
            active:head[0]===1n&&head[5]===f.fieldRole,revision:String(head[3])});
        }
      }
    }
    result={outcome:'FOUND',value:{subject:s,items}};
  }catch(e){result=unknown(e);}
  return sealed(scope,result,'COMPLETE',dom);
}
/** Current attributed tags of one node for the plan's trusted authors. */
export async function openTags(scope,{mountId,nodeId,tagIds}){
  let result;
  try{
    const m=await mount(scope,mountId);
    await node(scope,nodeId);
    const principals=[...new Set(m.namespace.entries.map(e=>e.principal))];
    const current=[];
    for(const principal of principals)for(const t of tagIds){
      const key=bindingKey(principal,FIXTURE.tagPurpose,nodeId,t);
      const [head,basis,H]=await call(scope,'getBindingHead',[key]);readBasis(scope,basis,H);
      if(head[3]===0n)continue;
      if(head[0]===1n&&head[1]===1n){
        const assertion=await record(scope,head[5],'FileTagAssertion/1');
        require(assertion.fields.tagId===t&&assertion.fields.target===nodeId,'TAG_TARGET_MISMATCH');
        current.push({principal,tagId:t,active:true,assertionId:head[5]});
      }else current.push({principal,tagId:t,active:false,assertionId:null});
    }
    result={outcome:'FOUND',value:{nodeId,current}};
  }catch(e){result=unknown(e);}
  return sealed(scope,result,'COMPLETE','FIXTURE_FILE_CONTENT');
}
