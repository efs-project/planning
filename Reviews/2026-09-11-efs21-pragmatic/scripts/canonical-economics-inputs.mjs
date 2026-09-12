// Exact retained BOOL-only cache oracle, independently matched to immutable Task1 goldens.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {encodeBlob,encodeGroup,derive} from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
import {parseGroup} from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
import {CACHE,verifyCache} from '../../2026-09-05-c0-admission/reader.mjs';
const abi=E.AbiCoder.defaultAbiCoder();
const descriptor=(name,fields)=>({name,meaning:'',specDigest:null,qualifier:'00'.repeat(32),fields,roles:[],indexes:[],constraints:[]});
export function expectedBooleanCache(schema,typeId){
 const fields=schema.fields.map(field=>{const name=Buffer.from(field.name,'ascii');const raw=Buffer.concat([Buffer.from([0,name.length]),name,Buffer.from([1])]);return[1,0,0,1,0,0,'0x'+raw.toString('hex')];});
 return abi.encode([CACHE],[[typeId,E.keccak256(encodeBlob(schema)),schema.fields.length,fields,[],[],[]]]);
}
export function largeInputs(){
 const boundary=[descriptor('CacheBoundary/1',Array.from({length:64},(_,i)=>({name:`flag${String(i).padStart(2,'0')}${'a'.repeat(58)}`,kind:'BOOL'})))];
 const aggregate=Array.from({length:16},(_,i)=>descriptor(`G${String(i).padStart(2,'0')}`,Array.from({length:64},(_,j)=>({name:`f${String(j).padStart(2,'0')}`,kind:'BOOL'}))));
 const golden=JSON.parse(readFileSync(new URL('../contracts/test/fixtures/canonical-types-golden.json',import.meta.url)));
 return Object.entries({boundary,aggregate}).map(([name,members])=>{
  const rawBytes=encodeGroup(members),raw=E.hexlify(rawBytes),identity=derive(rawBytes);assert.equal(raw,golden.groups[name].raw);assert.deepEqual(identity.ids,golden.groups[name].ids);
  const parsed=parseGroup(E.getBytes(raw));
  const caches=members.map((m,i)=>{const bytes=expectedBooleanCache(m,identity.ids[i]);verifyCache({ordinal:1,cacheBytes:bytes},parsed.members[i],identity.ids[i],identity.ids,encodeBlob(m));return bytes;});
  const complete=abi.encode(['tuple(bytes32 groupHash,bytes32 rawHash,tuple(bytes32 typeId,bytes cacheBytes)[] types,bytes32[] dependencies)'],[[identity.groupHash,E.keccak256(raw),identity.ids.map((id,i)=>[id,caches[i]]),[]]]);
  assert.equal(E.getBytes(raw).length,name==='boundary'?4356:7010);assert(caches.every(c=>E.getBytes(c).length===(name==='boundary'?24960:20864)));
  const aggregateCacheBytes=caches.reduce((n,c)=>n+E.getBytes(c).length,0);if(name==='aggregate'){assert.equal(aggregateCacheBytes,333824);assert.equal(E.getBytes(complete).length,336096);}
  return{name,members,raw,...identity,caches,groupBytes:E.getBytes(raw).length,cacheBytes:caches.map(c=>E.getBytes(c).length),aggregateCacheBytes,completeResponseBytes:E.getBytes(complete).length};
 });
}
export function payloadCases(){return [['empty','0x'],['tiny','0xef008000'],...[31,32,33,4032,4094].map(n=>['payload'+n,E.hexlify(Uint8Array.from({length:n},(_,i)=>(i*37+19)&255))])];}
