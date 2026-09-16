/** Standalone interpretation extension; existing served modules inject this API
 * explicitly, never add it to the owner demo's static-import graph. */
import {decodeDescribedType,decodeDescribedBody,verifyPortableDeclaration} from './described-type-reader.mjs';
export const WRAPPER_RUNTIME='0x685da87926b52f471eca3b7994db46cccf1f3e8166c2af378fb45d7768806ec8';
export const WRAPPER_INIT='0xe9eef707a978ff6519b427f0ffb6de5a01a73b076b3aa1591b18c3879991e725';
const need=(yes,code)=>{if(!yes)throw Error('DESCRIBED_ARCHIVE_'+code);};
const eq=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const hex=x=>typeof x==='string'&&/^0x(?:[0-9a-f]{2})*$/i.test(x);
const bounded=(x,n)=>hex(x)&&(x.length-2)/2<=n;
export function verifyDescribedSidecar(e,t){
  if(t.present===false||!t.described)return {coverage:'PARTIAL'};
  const s=t.described;if(s.status===0)return {coverage:'OPAQUE_LEGACY'};
  need(s.status===1||s.status===2,'STATUS');
  if(!s.descriptor||s.descriptor==='0x')return {coverage:'PARTIAL'};
  let d;try{d=decodeDescribedType(e,s.descriptor,t.ruleId);}catch(error){if(error.coverage==='UNSUPPORTED')return {coverage:'UNSUPPORTED'};throw error;}
  need(eq(t.ruleId,WRAPPER_RUNTIME),'WRAPPER_PROFILE');
  need(eq(d.typeId,t.typeId)&&eq(d.shape,t.shape)&&JSON.stringify(d.refTypes)===JSON.stringify(t.refTypes.map(v=>v.toLowerCase())),'TYPE_JOIN');
  if(!s.declaration||!s.wrapperInitcode||!t.ruleCode)return {coverage:'PARTIAL'};
  need(bounded(t.ruleCode,24576)&&eq(e.keccak256(t.ruleCode),WRAPPER_RUNTIME),'WRAPPER_RUNTIME');
  need(bounded(s.wrapperInitcode,49152)&&eq(e.keccak256(s.wrapperInitcode),WRAPPER_INIT),'WRAPPER_INIT');
  verifyPortableDeclaration(e,d,s.declaration);
  if(s.status===1)return {coverage:'COMPLETE',descriptor:d,installation:'NOT_INSTALLED',customState:'NOT_PROVEN'};
  need(e.isAddress(s.wrapperAddress)&&!eq(s.wrapperAddress,e.ZeroAddress),'WRAPPER_ADDRESS');
  need(e.isAddress(s.registry)&&!eq(s.registry,e.ZeroAddress)&&/^[1-9][0-9]*$/.test(s.chainId),'SOURCE_CONTEXT');
  if(d.customAbi===0){
    need(eq(s.custom,e.ZeroAddress)&&eq(s.allowedLedger,e.ZeroAddress)&&eq(s.bindingId,e.ZeroHash)&&s.bindingPreimage==='0x'&&s.bindingSignature==='0x'&&s.customCode==='0x','CUSTOM_FREE_BINDING');
  }else{
    if(s.bindingPreimage===undefined||s.bindingSignature===undefined||s.customCode===undefined)return {coverage:'PARTIAL'};
    need(e.isAddress(s.custom)&&!eq(s.custom,e.ZeroAddress)&&e.isAddress(s.allowedLedger)&&!eq(s.allowedLedger,e.ZeroAddress),'CUSTOM_ADDRESS');
    need(bounded(s.customCode,24576)&&eq(e.keccak256(s.customCode),d.customRuntimeHash),'CUSTOM_RUNTIME');
    const types=['bytes32','bytes32','bytes32','bytes32','uint256','address','bytes32','address','address','bytes32','uint256','address'];
    const preimage=e.AbiCoder.defaultAbiCoder().encode(types,[e.id('efs.lab.local-type-binding/1'),e.id('efs.lab.described-wrapper/1'),WRAPPER_RUNTIME,WRAPPER_INIT,s.chainId,s.registry,t.typeId,s.allowedLedger,s.custom,d.customRuntimeHash,d.customAbi,d.creator]);
    need(eq(preimage,s.bindingPreimage)&&eq(e.keccak256(preimage),s.bindingId),'BINDING_PREIMAGE');
    need(eq(e.getCreate2Address(s.registry,s.bindingId,WRAPPER_INIT),s.wrapperAddress),'CREATE2');
    need(bounded(s.bindingSignature,65)&&e.getBytes(s.bindingSignature).length===65&&[27,28].includes(e.getBytes(s.bindingSignature)[64]),'BINDING_SIGNATURE');
    need(eq(e.recoverAddress(s.bindingId,s.bindingSignature),d.creator),'BINDING_AUTHORITY');
  }
  return {coverage:'COMPLETE',descriptor:d,installation:'RPC_OBSERVED_NOT_STATE_PROOF',customState:'NOT_PROVEN'};
}
export function interpretationFor(e,closure){
  const types=new Map(closure.types.map(t=>[t.typeId.toLowerCase(),verifyDescribedSidecar(e,t)]));
  const records=closure.records.map(r=>{
    const type=types.get(r.typeId.toLowerCase());
    if(!r.present||!type)return {recordId:r.recordId,coverage:'PARTIAL'};
    if(type.coverage!=='COMPLETE')return {recordId:r.recordId,coverage:type.coverage};
    const decoded=decodeDescribedBody(e,type.descriptor,r.body);need(eq(decoded.recordId,r.recordId),'RECORD_JOIN');
    return {recordId:r.recordId,coverage:'COMPLETE',decoded};
  });
  const states=[...Array.from(types.values(),t=>t.coverage),...records.map(r=>r.coverage)];
  const coverage=states.includes('PARTIAL')?'PARTIAL':states.includes('UNSUPPORTED')?'UNSUPPORTED':states.includes('OPAQUE_LEGACY')?'OPAQUE_LEGACY':'COMPLETE';
  return {coverage,records,types:[...types].map(([typeId,t])=>({typeId,coverage:t.coverage})),semanticTruth:'NOT_PROVEN',referenceMeaning:'PER_TYPE_COVERAGE',authority:'NONE'};
}
export function projectDescribedText(e,record,{targetView,approved=[],adapter,acceptLoss=false}={}){
  // Approval belongs to this consumer. Descriptor assertions never enter lookup.
  const rules=approved.filter(p=>eq(p.sourceType,record.typeId)&&eq(p.targetView,targetView));
  need(rules.length===1,'UNAPPROVED_PROJECTION');const p=rules[0];
  need(/^0x[0-9a-f]{64}$/i.test(p.projectionId),'PROJECTION_ID');
  if(p.adapter)need(adapter===p.adapter&&acceptLoss===true&&typeof p.loss==='string'&&p.loss.length>0,'LOSS_CONSENT');
  const text=record.fields.find(f=>eq(f.id,p.textField));need(text?.present&&[7,8].includes(text.kind)&&typeof text.value==='string','TEXT_FIELD');
  return {value:{text:text.value},sourceType:record.typeId,targetView,projectionId:p.projectionId,
    omitted:record.fields.filter(f=>!eq(f.id,p.textField)).map(f=>({fieldId:f.id,present:f.present,value:f.value})),loss:p.loss??null,
    originalBody:record.body,authority:'READ_ONLY_NOT_WRITE_PERMISSION'};
}
export function assertExactWriter(typeId,understoodTypes){need(understoodTypes.some(t=>eq(t,typeId)),'WRITER_UNSUPPORTED');return true;}

export function createDescribedArchiveExtension(e,{wrapperInitcode}={}){
  need(bounded(wrapperInitcode,49152)&&eq(e.keccak256(wrapperInitcode),WRAPPER_INIT),'WRAPPER_INIT');
  return Object.freeze({interpretationFor,
    async captureType({type,rc,code,basis,registry}){
      const status=Number((await rc('describedStatus',[type.typeId],basis))[0]);
      if(status===0)return {status:0};
      const info=(await rc('describedInfo',[type.typeId],basis))[0],binding=await rc('describedBinding',[type.typeId],basis);
      const descriptor=(await rc('descriptorBytes',[type.typeId],basis))[0],declaration=(await rc('declarationSignature',[type.typeId],basis))[0];
      const custom=info.custom;
      return {status,descriptor,declaration,wrapperInitcode,wrapperAddress:info.mandatory,chainId:basis.chainId,registry,
        custom,allowedLedger:info.allowedLedger,bindingId:binding[0],bindingPreimage:binding[1],bindingSignature:binding[2],
        customCode:eq(custom,e.ZeroAddress)?'0x':await code(custom),descriptorAddress:info.blob};
    },
  });
}
