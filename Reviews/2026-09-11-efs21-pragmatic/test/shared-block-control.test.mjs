import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {keccak256} from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const frozen=JSON.parse(readFileSync(new URL('../evidence/shared-block-control-sources.json',import.meta.url)));
function open(value){
  assert.equal(value.format,'EFS21_SHARED_BLOCK_CONTROL_GZIP_BASE64_V1');
  assert.equal(value.commit,'8688d5299eac8d9f83264806c32de471f427bbb2','exact historical profile');
  const zipped=Buffer.from(value.gzipBase64,'base64');
  assert(zipped.length<=1024**2&&value.canonical.bytes<=4*1024**2);
  assert.equal(zipped.length,value.compressed.bytes);assert.equal(keccak256(zipped),value.compressed.keccak256);
  assert.equal(zipped[3],0);assert.equal(zipped.readUInt32LE(4),0);
  const raw=gunzipSync(zipped,{maxOutputLength:4*1024**2});
  assert.equal(raw.length,value.canonical.bytes);assert.equal(keccak256(raw),value.canonical.keccak256);
  const data=JSON.parse(raw);assert.equal(data.commit,value.commit);
  for(const source of Object.values(data.sources))assert.equal(keccak256(Buffer.from(source.content)),source.keccak256);
  for(const artifact of Object.values(data.artifacts))for(const [path,source]of Object.entries(artifact.metadata.sources))assert.equal(data.sources[artifact.root+':'+path]?.keccak256,source.keccak256);
  return data;
}
test('historical full source/artifact graph opens without substituting current split sources',()=>{
  const data=open(frozen);assert.equal(Object.keys(data.artifacts).length,10);
  const store=Object.entries(data.sources).find(([p])=>p.endsWith('/StateStore.sol'))[1].content;
  assert(store.includes('mapping(bytes32 => RecordRow) records;'));
  assert(!store.includes('struct RecordCell'));
  assert.equal((data.artifacts.UpgradeableFixtureCoreU3.deployedBytecode.object.length-2)/2,23619);
  assert.equal((data.artifacts.PreparationHelper.deployedBytecode.object.length-2)/2,18953);
});
test('unknown historical profile and forged compressed/canonical content are refused',()=>{
  for(const mutate of [x=>x.commit='current',x=>x.compressed.keccak256='0x00',x=>x.canonical.keccak256='0x00',x=>x.canonical.bytes=4*1024**2+1]){
    const value=structuredClone(frozen);mutate(value);assert.throws(()=>open(value));
  }
});
test('actual compiler layout proves three Record words, one Envelope word and unchanged mapping roots',()=>{
  const evidence=JSON.parse(readFileSync(new URL('../evidence/shared-block-candidate-layout.json',import.meta.url)));
  for(const [path,source]of Object.entries(evidence.sourcePins))assert.equal(keccak256(readFileSync(resolve(new URL('../../2026-09-05-c0-core/',import.meta.url).pathname,path))),source.keccak256);
  const types=Object.values(evidence.storageLayout.types),record=types.find(x=>x.label==='struct StateStore.RecordCell'),envelope=types.find(x=>x.label==='struct StateStore.EnvelopeCell'),store=types.find(x=>x.label==='struct StateStore.Store');
  assert.equal(record.numberOfBytes,'96');assert.deepEqual(record.members.map(x=>[x.label,x.slot,x.offset]),[['typeId','0',0],['byteRef','1',0],['recordOrdinal','2',0],['firstAdmissionOrdinal','2',8]]);
  assert.equal(envelope.numberOfBytes,'32');assert.deepEqual(envelope.members.map(x=>[x.label,x.slot,x.offset]),[['pointer','0',0],['offset','0',20],['length','0',22],['extent','0',24],['envelopeOrdinal','0',26]]);
  assert.deepEqual(store.members.filter(x=>['records','envelopes','types'].includes(x.label)).map(x=>[x.label,x.slot]),[['records','12'],['envelopes','13'],['types','14']]);
});
