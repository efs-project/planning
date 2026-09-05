// Independent reader: no producer, encoder or contract hash-helper import.
// Shared crypto/ABI library, independent framing/hash preimages and parser.
import assert from 'node:assert/strict';
import { AbiCoder, TypedDataEncoder, keccak256, recoverAddress, getBytes, ZeroHash } from '../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { parseGroup } from '../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
const abi = AbiCoder.defaultAbiCoder();
const names = ['', 'BOOL','UINT','INT','BYTES_FIXED','BYTES','STRING','REF','OCCREF','PRINCIPAL','DIGEST','ARRAY','MAP','STRUCT','OPTION'];
const hash = x => Buffer.from(keccak256(x).slice(2),'hex');
const bytes = x => Buffer.from(x.replace(/^0x/,''),'hex');
const word = x => Buffer.from(BigInt(x).toString(16).padStart(64,'0'),'hex');
const dom = x => hash(Buffer.from(x));
const hashedWords = (...parts) => keccak256(Buffer.concat(parts));
const eq = (a,b,message) => assert.equal(typeof a==='string'?a.toLowerCase():a,typeof b==='string'?b.toLowerCase():b,message);
const H = 'tuple(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter)';
const E = 'tuple(bytes32 realmId,address core,bytes32 routeConfigId,bytes32 genesisReceiptHash,uint8 operationKind,bytes32 envelopeId,uint64 leafMask,bytes32 expectedRevisionsHash,address stateByteStore,bytes32 byteCommitment)';
const P = 'tuple(bytes32 c0ProfileId,bytes32 publicationDigest,bytes32 realmId,bytes32 realmEffectsDigest,address executor,bytes32 executorCodeHash,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)';
export const CACHE = 'tuple(bytes32 typeId,bytes32 blobHash,uint32 maxBodyBytes,tuple(uint8 kind,uint8 innerKind,uint16 widthOrMax,uint32 maxBodyBytes,uint32 references,uint32 skipReads,bytes descriptor)[] fields,tuple(uint8 targetClass,bytes32 expectedType,uint8 fieldIdx)[] roles,tuple(uint8 kind,uint8 target)[] indexes,tuple(uint8 kind,uint8 fieldIdx,int256 min,int256 max)[] constraints)';
const fields = spec => spec.split(',').map(s=>{const [type,name]=s.split(' ');return {type,name};});
const envelopeTypes={PublicationEnvelope:fields('uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds')};
const effectTypes={C0RealmEffects:fields('bytes32 realmId,address core,bytes32 routeConfigId,bytes32 genesisReceiptHash,uint8 operationKind,bytes32 envelopeId,uint64 leafMask,bytes32 expectedRevisionsHash,address stateByteStore,bytes32 byteCommitment')};
const planTypes={WritePlan:fields('bytes32 c0ProfileId,bytes32 publicationDigest,bytes32 realmId,bytes32 realmEffectsDigest,address executor,bytes32 executorCodeHash,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter')};
const object = (row,spec) => Object.fromEntries(spec.map(f=>[f.name,row[f.name]]));
function traits(f) {
  let max=0, refs=0, skips=0;
  if(f.kind==='BOOL')max=1;
  else if(['UINT','INT','BYTES_FIXED'].includes(f.kind))max=f.width;
  else if(['REF','PRINCIPAL'].includes(f.kind)){max=32;refs=f.kind==='REF'?1:0;}
  else if(f.kind==='OCCREF'){max=34;refs=1;}
  else if(f.kind==='DIGEST'){max=68;skips=1;}
  else if(['BYTES','STRING'].includes(f.kind)){max=f.max+2;skips=1;}
  else if(f.kind==='OPTION'){const x=traits(f.inner);max=x.max+1;refs=x.refs;skips=x.skips+1;}
  else if(f.kind==='ARRAY'){const x=traits(f.inner);max=2+f.max*x.max;refs=f.max*x.refs;skips=1+f.max*x.skips;}
  else if(f.kind==='STRUCT'){for(const m of f.members){const x=traits(m);max+=x.max;refs+=x.refs;skips+=x.skips;}}
  else if(f.kind==='MAP'){const a=traits(f.key),b=traits(f.value);max=2+f.max*(a.max+b.max);refs=f.max*(a.refs+b.refs);skips=1+f.max*(a.skips+b.skips);}
  else throw Error('unsupported cache field');
  return {max,refs,skips};
}
// Slice descriptors directly from retained MC/1 bytes; no re-encoding by producer.
function rawBlobs(group) {
  const b=bytes(group),out=[];let p=2;
  for(let i=0;i<b.readUInt16BE(0);i++){const n=b.readUInt16BE(p);p+=2;out.push(b.subarray(p,p+n));p+=n;}
  return out;
}
function rawFields(blob) {
  let p=2; const u16=()=>{const n=blob.readUInt16BE(p);p+=2;return n;};
  const text=()=>{const n=u16();p+=n;};
  text();text();const digest=blob[p++];if(digest){p+=2;const n=u16();p+=n;}p+=32;
  const count=u16();
  function field(){const start=p;text();const k=blob[p++];if([2,3,4].includes(k))p++;else if([5,6,11,12].includes(k)){u16();if(k===11)field();if(k===12){field();field();}}else if(k===14)field();else if(k===13){const n=u16();for(let i=0;i<n;i++)field();}return '0x'+blob.subarray(start,p).toString('hex');}
  return Array.from({length:count},field);
}
export function verifyCache(row,member,id,ids,blob) {
  assert(row&&BigInt(row.ordinal)>0,'missing Type cache');
  const c=abi.decode([CACHE],row.cacheBytes)[0];
  eq(abi.encode([CACHE],[c]),row.cacheBytes,'noncanonical cache ABI');
  eq(c.typeId,id,'cache Type identity');eq(c.blobHash,keccak256(blob),'cache blob identity');
  eq(Number(c.maxBodyBytes),member.fields.reduce((n,f)=>n+traits(f).max,0),'cache body bound');
  eq(c.fields.length,member.fields.length,'cache field length');const raw=rawFields(blob);
  member.fields.forEach((f,i)=>{const x=c.fields[i],t=traits(f),inner=f.inner??f.key;eq(Number(x.kind),names.indexOf(f.kind),'cache field kind');eq(Number(x.innerKind),inner?names.indexOf(inner.kind):0,'cache inner kind');eq(Number(x.widthOrMax),f.width??f.max??0,'cache width/max');eq(Number(x.maxBodyBytes),t.max,'cache field bound');eq(Number(x.references),t.refs,'cache ref bound');eq(Number(x.skipReads),t.skips,'cache skip bound');eq(x.descriptor,raw[i],'cache descriptor bytes');});
  eq(c.roles.length,member.roles.length,'cache roles');member.roles.forEach((r,i)=>{const x=c.roles[i];const target=r.expectedType==='ANY'?ZeroHash:r.expectedType==='SELF'?id:r.expectedType.startsWith('GROUP_REF:')?ids[Number(r.expectedType.split(':')[1])]:'0x'+r.expectedType;eq(Number(x.targetClass),r.targetClass,'cache role class');eq(x.expectedType,target,'cache role resolution');eq(Number(x.fieldIdx),r.fieldIdx,'cache role field');});
  eq(c.indexes.length,member.indexes.length,'cache indexes');member.indexes.forEach((x,i)=>{eq(Number(c.indexes[i].kind),x.kind,'cache index kind');eq(Number(c.indexes[i].target),x.target,'cache index target');});
  eq(c.constraints.length,member.constraints.length,'cache constraints');member.constraints.forEach((x,i)=>{const c1=c.constraints[i];eq(Number(c1.kind),x.kind,'cache constraint kind');eq(Number(c1.fieldIdx),x.fieldIdx,'cache constraint field');eq(c1.min,BigInt(x.min??0),'cache constraint min');eq(c1.max,BigInt(x.max??0),'cache constraint max');});
}
export function verifySnapshot(s,expected) {
  assert(s.basis&&Number.isSafeInteger(s.basis.number)&&s.basis.hash,'missing fixed chain basis');
  assert(s.config&&s.records&&s.types&&s.envelopes&&s.admissions&&s.indexes,'missing retained state');
  const cfg=expected.config;
  for(const k of ['realmId','stateByteStore','schemaAuthor','bootstrapAuthor'])eq(s.config[k],cfg[k],'configuration '+k);
  eq(s.core,expected.core,'core');eq(s.chainId,Number(expected.chainId),'chain');eq(keccak256(s.runtimeCode),expected.runtimeCodeHash,'runtime');
  eq(s.intrinsicGroup,expected.intrinsicGroup,'intrinsic substitution');eq(s.declarationInventory,expected.declarationInventory,'declaration inventory substitution');
  assert.deepEqual(s.inventory.map(x=>x.toLowerCase()),cfg.groupByteHashes.map(x=>x.toLowerCase()),'group inventory substitution');
  const commitment=hashedWords(dom('efs2/c0-admission-probe/run/1'),bytes(cfg.realmId),word(cfg.stateByteStore),word(cfg.schemaAuthor),word(cfg.bootstrapAuthor),...s.inventory.map(bytes),hash(bytes(s.intrinsicGroup)),hash(bytes(s.declarationInventory)));
  const profile=hashedWords(dom('efs2/mvp-c0/profile/1'),bytes(commitment));eq(s.probeCommitment,commitment,'probe commitment');eq(s.c0ProfileId,profile,'profile commitment');
  const intrinsic=parseGroup(bytes(s.intrinsicGroup));assert.equal(intrinsic.ids.length,1,'intrinsic singleton');
  const im=intrinsic.members[0];assert.deepEqual(im.fields,[{name:'groupBytes',kind:'BYTES',max:8190}]);assert.deepEqual([im.roles,im.indexes,im.constraints],[[],[],[]]);
  const meta=intrinsic.ids[0];eq(s.metaTypeId,meta,'intrinsic Type identity');
  const allTypes=[meta], recordIds=[], occurrenceIds=[], principals=[], expectedIndexes={};
  const put=(kind,key,id)=>{(expectedIndexes[kind+':'+key]??=[]).push(id);};
  put(1,ZeroHash,meta);verifyCache(s.types[meta],im,meta,[meta],rawBlobs(s.intrinsicGroup)[0]);
  eq(Number(s.types[meta].ordinal),1,'intrinsic ordinal');eq(s.types[meta].groupRecordId,ZeroHash,'intrinsic provenance');eq(Number(s.types[meta].memberIndex),0,'intrinsic member index');eq(Number(s.types[meta].admittedAtOrdinal),0,'intrinsic admission');
  const count=expected.expectedGroupCount??4;eq(Number(s.admittedGroupCount),count,'missing group inventory');
  const occurrences=s.indexes['7:'+ZeroHash];assert(Array.isArray(occurrences),'missing occurrence index');
  const uniqueRecords=new Map(),seenGroups=new Set(),lanes=new Map();let nextTypeOrdinal=2;
  for(let n=0;n<occurrences.length;n++){
    const key=occurrences[n],a=s.admissions[key];assert(a,'missing admission');eq(Number(a.ordinal),n+1,'admission ordinal');eq(Number(a.leafIndex),0,'leaf index');
    assert(Number(a.admittedAtBlock)<=s.basis.number&&Number(a.admittedAtBlock)>0,'admission block basis');assert(Number(a.admittedAtTimestamp)<=s.basis.timestamp,'admission timestamp basis');
    const e=s.envelopes[a.envelopeId],r=s.records[a.recordId];assert(e&&r,'missing envelope or record');
    const [h,leaves]=abi.decode([H,'bytes32[]'],e.unsignedStatement);eq(abi.encode([H,'bytes32[]'],[h,leaves]),e.unsignedStatement,'canonical unsigned statement');eq(leaves.length,1,'leaf count');eq(leaves[0],a.recordId,'record position');
    eq(r.typeId,meta,'Record Type');const body=bytes(r.body);assert(body.length>=2&&body.length<=8192&&body.readUInt16BE(0)===body.length-2,'body framing');
    const rid=hashedWords(dom('efs2/record/1'),bytes(meta),hash(body));eq(rid,a.recordId,'Record identity');
    const descriptor=s.principals[a.principalId];assert(descriptor,'missing principal descriptor');const d=bytes(descriptor);assert(d.length===22&&d[0]===1&&d[1]===0,'principal descriptor kind');eq('0x'+d.subarray(2).toString('hex'),cfg.schemaAuthor,'schema authority');
    const pid=hashedWords(dom('efs2/principal/1'),word(1),hash(d));eq(pid,a.principalId,'Principal identity');eq(h.principalId,pid,'publication Principal');eq(e.principalId,pid,'envelope Principal');eq(Number(h.profile),1,'publication profile');eq(h.authorityRef,ZeroHash,'authority ref');eq(h.authEpoch,0n,'auth epoch');
    const pd=TypedDataEncoder.hash({name:'EFS2-Envelope',version:'1'},envelopeTypes,{...object(h,envelopeTypes.PublicationEnvelope.slice(0,-1)),recordIds:[...leaves]});
    const eid=hashedWords(dom('efs2/envelope/1'),bytes(pd));eq(eid,a.envelopeId,'Envelope identity');eq(hashedWords(dom('efs2/occurrence/1'),bytes(eid),word(0)),key,'Occurrence identity');
    const fx=abi.decode([E],e.effects)[0],plan=abi.decode([P],e.plan)[0];eq(abi.encode([E],[fx]),e.effects,'canonical effects');eq(abi.encode([P],[plan]),e.plan,'canonical plan');
    for(const [k,value]of Object.entries({realmId:cfg.realmId,core:s.core,routeConfigId:ZeroHash,genesisReceiptHash:ZeroHash,operationKind:1n,envelopeId:eid,leafMask:1n,expectedRevisionsHash:keccak256('0x'),stateByteStore:cfg.stateByteStore,byteCommitment:ZeroHash}))eq(fx[k],value,'effects '+k);
    const ed=TypedDataEncoder.hashStruct('C0RealmEffects',effectTypes,object(fx,effectTypes.C0RealmEffects));
    for(const [k,value]of Object.entries({c0ProfileId:profile,publicationDigest:pd,realmId:cfg.realmId,realmEffectsDigest:ed,executor:s.core,executorCodeHash:expected.runtimeCodeHash,notAfter:h.notAfter}))eq(plan[k],value,'plan '+k);
    const digest=TypedDataEncoder.hash({name:'EFS2-MVP-C0-WritePlan',version:'1',chainId:s.chainId,verifyingContract:s.core},planTypes,object(plan,planTypes.WritePlan));
    const sig=getBytes(e.witness);assert(sig.length===65&&[27,28].includes(sig[64]),'canonical witness framing');const sigS=BigInt('0x'+Buffer.from(sig.subarray(32,64)).toString('hex'));assert(sigS>0n&&sigS<=0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n,'canonical low-s witness');eq(recoverAddress(digest,e.witness),cfg.schemaAuthor,'authenticated signer');
    assert(plan.notAfter===0n||BigInt(a.admittedAtTimestamp)<=plan.notAfter,'admission expired at retained basis');eq(a.witnessProfile,keccak256(Buffer.from('C0_COMPOSITE_EOA_V1')),'probe witness profile');eq(BigInt(a.nonceKey),plan.nonceKey,'nonce lane');eq(BigInt(a.nonceSeq),plan.nonceSeq,'nonce sequence');
    const lane=pid+':'+plan.nonceKey,seq=(lanes.get(lane)??0n)+1n;eq(plan.nonceSeq,seq,'nonce progression');lanes.set(lane,seq);eq(Number(e.ordinal),n+1,'envelope ordinal');
    const gi=expected.candidates.groups.findIndex(g=>'0x'+g.recordBodyHex===r.body);assert(gi>=0&&gi<count,'unknown candidate bytes');
    if(!uniqueRecords.has(rid)){
      eq(gi,seenGroups.size,'group ordering');seenGroups.add(gi);uniqueRecords.set(rid,n+1);recordIds.push(rid);eq(Number(r.ordinal),recordIds.length,'Record ordinal');
      const group=expected.candidates.groups[gi],parsed=parseGroup(body.subarray(2),{knownTypes:allTypes,expectedIds:group.members.map(m=>m.temporaryTypeSchemaId)}),blobs=rawBlobs('0x'+body.subarray(2).toString('hex'));
      parsed.ids.forEach((id,i)=>{const row=s.types[id];verifyCache(row,parsed.members[i],id,parsed.ids,blobs[i]);eq(row.groupRecordId,rid,'Type group provenance');eq(Number(row.memberIndex),i,'Type member index');eq(Number(row.ordinal),nextTypeOrdinal++,'Type ordinal');eq(Number(row.admittedAtOrdinal),n+1,'Type first admission');allTypes.push(id);put(1,ZeroHash,id);});put(3,meta,rid);
    }
    if(!principals.includes(pid)){principals.push(pid);put(2,ZeroHash,pid);}
    occurrenceIds.push(key);put(4,meta,key);put(5,rid,key);put(6,pid,key);put(7,ZeroHash,key);
  }
  eq(seenGroups.size,count,'missing admitted group');eq(Number(s.recordCount),recordIds.length,'Record count');eq(Number(s.envelopeCount),occurrenceIds.length,'Envelope count');eq(Number(s.admissionCount),occurrenceIds.length,'admission count');
  assert.deepEqual(s.indexes,expectedIndexes,'bounded indexes mismatch');
  assert.deepEqual(Object.keys(s.types).sort(),allTypes.sort(),'Type cache inventory');assert.deepEqual(Object.keys(s.records).sort(),recordIds.sort(),'Record row inventory');assert.deepEqual(Object.keys(s.admissions).sort(),occurrenceIds.sort(),'admission row inventory');
  assert.deepEqual(Object.keys(s.envelopes).sort(),occurrenceIds.map(k=>s.admissions[k].envelopeId).sort(),'Envelope row inventory');assert.deepEqual(Object.keys(s.principals).sort(),principals.sort(),'Principal inventory');
  for(const [lane,seq] of lanes)eq(BigInt(s.sequences[lane]),seq,'retained nonce lane');
  return {outcome:'VERIFIED',basis:s.basis,typeCount:allTypes.length,recordCount:recordIds.length,admissionCount:occurrenceIds.length,limitations:['ASCII/DIRECT descriptor subset','fixed-block finite inventory; not a general COMPLETE QueryProfile','shared ethers cryptography; independently constructed preimages','temporary probe commitment; not full C0']};
}
export async function readCold(source,expected) {
  // These are caller-supplied expected source pins, never observations inferred
  // from an unavailable read. `basis` is populated only after verification.
  const context={source:{id:source.source??null,chainId:expected.chainId??null,core:expected.core??null,c0ProfileId:expected.c0ProfileId??null,runtimeCodeHash:expected.runtimeCodeHash??null},requestedBasis:structuredClone(source.requestedBasis??null),attemptedBasis:structuredClone(source.attemptedBasis??source.basis??source.requestedBasis??null)};
  const onBasis=basis=>{context.attemptedBasis=structuredClone(basis);};
  let snapshot;
  try { snapshot=await source.collect({onBasis}); }
  catch(error) { return {...context,outcome:'UNKNOWN',basis:null,reason:String(error?.message??error)}; }
  if(snapshot?.basis)onBasis(snapshot.basis);
  try { return {...context,...verifySnapshot(snapshot,expected)}; }
  catch(error) { return {...context,outcome:'INVALID',basis:null,reason:String(error?.message??error)}; }
}
