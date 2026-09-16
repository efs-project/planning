// Producer-only fixture emitter. The independent Task2 decoder must not import
// this file or derive expectations from it. Literal vectors.json is the handoff.
import {loadEthers} from '../script/compact-environment.mjs';
export const e=await loadEthers(),abi=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
export const uint=(n,size)=>e.toBeHex(n,size);
export const word=n=>uint(n,32);
export const field=(id,kind,{optional=0,width=0,lower=0,upper=0,ref=Z,semantic=id+100}={})=>
  e.concat([word(id),word(semantic),uint(kind,1),uint(optional,1),uint(width,2),word(lower),word(upper),ref]);
export const descriptor=(key,namespace,description,fields,customHash=Z)=>{
  const prose=e.toUtf8Bytes(description);
  return e.concat(['0x0101',uint(customHash===Z?0:1,1),uint(fields.length,1),key,namespace,customHash,uint(prose.length,2),prose,...fields]);
};
export const text=value=>e.concat([uint(e.toUtf8Bytes(value).length,2),e.toUtf8Bytes(value)]);
export const shape=d=>e.keccak256(abi.encode(['bytes32','bytes'],[e.id('efs.lab.described-shape/1'),d]));
export const typeId=(d,refs,rule)=>e.keccak256(abi.encode(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/type/1'),shape(d),e.keccak256(abi.encode(['bytes32[]'],[refs])),rule]));
export const record=(t,b)=>e.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),t,e.keccak256(b)]));
export const declarationDigest=t=>e.keccak256(abi.encode(['bytes32','bytes32'],[e.id('efs.lab.portable-type-declaration/1'),t]));
