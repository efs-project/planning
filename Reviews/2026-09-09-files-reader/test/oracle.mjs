// Independent full-retained-state expectation, never a runtime dependency.
// Reverification rebuilds descriptors, lifecycle, history, BindingScope and Lens.
import assert from 'node:assert/strict';
import { verifyUpgradeState,readUpgradeState } from '../../2026-09-08-upgradeable-foundation/reference/upgrade-reader.mjs';
import { parsePlan,modelLens } from '../../2026-09-05-c0-core/reference/lens-resolver.mjs';
import { decodeBody } from '../../2026-09-05-c0-core/reference/record-body.mjs';
import { C,hash,key,role,position,scopeKey,purposeScope } from './fixture.mjs';
import { word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
const opt=s=>s==='0x00'?null:'0x'+s.slice(4);
const name=s=>new TextDecoder('utf-8',{fatal:true}).decode(Buffer.from(s.slice(6),'hex'));
const fail=reason=>{throw Error(reason);};
const check=(ok,reason='MALFORMED_SELECTED')=>{if(!ok)fail(reason);};
const nameGrade=s=>!s||s==='.'||s==='..'||Buffer.byteLength(s)>255||/[\/\\\u0000-\u001f\u007f]/u.test(s)?'MALFORMED_SELECTED':/^[a-z0-9._-]+$/.test(s)?null:'UNSUPPORTED_NAME';
export async function oracle(lab){return fromSnapshot((await readUpgradeState(lab)).snapshot,lab.expected);}
export function fromSnapshot(snapshot,expected){
  const verified=verifyUpgradeState(snapshot,expected);assert.equal(verified.outcome,'VERIFIED',verified.reason);
  const entries=verified.entries,records=new Map(snapshot.records.map(r=>[r.id,r]));
  function decoded(id,type){const r=records.get(id);check(r,'RECORD_UNAVAILABLE');const e=entries.find(e=>e.recordId===id);check(e,'RECORD_UNAVAILABLE');check(!type||e.schema.name===type);return {...decodeBody(e.schema,r.row[1]),type:e.schema.name,row:r.row};}
  function node(id){const d=decoded(id,'ObjectGenesis/1'),publisher=d.fields[0],meaning=opt(d.fields[2]);check([hash('efs2/files/meaning/file/1'),hash('efs2/files/meaning/directory/1')].includes(meaning));
    const k=key(publisher,C.charter,id,word(1)),history=verified.fold.histories.get(k)??[];
    const exact=e=>{if(e?.schema.name!=='BindingSet/1')return false;const f=e.fields;return e.principal===publisher&&f[0]===C.charter&&f[1]===id&&f[2]===word(1)&&opt(f[3])===id&&f[4]==='0x00';};
    const current=verified.fold.bindings.get(k),currentEntry=entries.find(e=>e.ordinal===current?.ordinal),maintained=current?.state===1&&exact(currentEntry);
    const historical=maintained||history.slice(0,64).some(n=>exact(entries.find(e=>e.ordinal===n)));
    check(historical,history.length>64?'CHARTER_HISTORY_LIMIT':'NO_HISTORICAL_CHARTER');
    return {nodeId:id,kind:meaning===hash('efs2/files/meaning/file/1')?'FILE':'DIRECTORY',historicalCharter:'VALID',maintenance:maintained?'MAINTAINED':current?.state===1?'WRONG_TARGET':'NOT_MAINTAINED'};
  }
  function plan(id,kind,root){const d=decoded(id,'ResolutionPlan/1'),p=parsePlan(d.row[0],d.row[1]);check(p.code===0);check(p.profile===C.lens,'UNSUPPORTED_PLAN');check(p.purposeAndScope===purposeScope(kind,root));return p;}
  function mount(id){const d=decoded(id,'MountDescriptor/1'),[rootId,profile,config]=d.fields;check(profile===C.profile,'UNSUPPORTED_MOUNT');const root=node(rootId),c=decoded(config,'PublicFilesMountConfig/1').fields;
    check((opt(c[2])===null)===(opt(c[3])===null));check(opt(c[2])===null,'UNSUPPORTED_PROPERTIES');check(root.kind==='DIRECTORY'?opt(c[0])!==null:opt(c[0])===null);
    const p=opt(c[0])?plan(opt(c[0]),'namespace',rootId):null;plan(c[1],'content',rootId);return {root,plan:p,planId:opt(c[0])};}
  const basis={realmRevisionId:verified.execution.history.at(-1).id,blockNumber:BigInt(verified.basis.number),admissionHigh:BigInt(verified.counts[4]),basisKind:0};
  function lookup(mountId,fieldRole,requestedName){try{
    const m=mount(mountId);check(m.root.kind==='DIRECTORY','NOT_A_DIRECTORY');const lens=modelLens(m.plan,verified.fold.bindings,position(C.name,m.root.nodeId,fieldRole),basis);
    if(lens.presence===2)return {outcome:'ABSENT',fieldRole};if(lens.presence===3)return {outcome:'CONFLICT',fieldRole};check(lens.presence===1,'LENS_UNKNOWN');
    check(lens.target.targetKind===1&&lens.target.targetLeaf===0);const selectedId=lens.target.targetA,d=decoded(selectedId);check(['DirectoryEntry/1','DirectoryWhiteout/1'].includes(d.type));
    const f=d.fields,n=name(f[1]);check(f[0]===m.root.nodeId&&role(n)===fieldRole&&(requestedName===undefined||n===requestedName));const grade=nameGrade(n);if(grade)fail(grade);
    if(d.type==='DirectoryWhiteout/1')return {outcome:'MASKED',fieldRole,selectedId};const child=node(f[2]);if(opt(f[3]))check(mount(opt(f[3])).root.nodeId===child.nodeId);
    return {outcome:'FOUND',fieldRole,selectedId,value:{...child,name:n}};
  }catch(e){return {outcome:'UNKNOWN',fieldRole,reason:e.message};}}
  function inventory(mountId){const m=mount(mountId);const sources=m.plan.entries.map(e=>({principal:e.principal,ordinals:[...(verified.fold.scopes.get(scopeKey(e.principal,m.root.nodeId))??[])]}));
    const roles=[...new Set(sources.flatMap(s=>s.ordinals.map(n=>entries.find(e=>e.ordinal===n).fields[2])))];return {sources,roles,results:roles.map(r=>lookup(mountId,r))};}
  return {snapshot,verified,expected,basis,lookup,inventory,node,mount};
}
export function comparable(r){return {outcome:r.outcome,fieldRole:r.fieldRole,...(r.reason?{reason:r.reason}:{}),...(r.selectedId?{selectedId:r.selectedId}:{}),...(r.value?{value:{nodeId:r.value.nodeId,kind:r.value.kind,name:r.value.name,historicalCharter:r.value.historicalCharter,maintenance:r.value.maintenance}}:{})};}
