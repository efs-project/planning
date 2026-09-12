import test from 'node:test';
import assert from 'node:assert/strict';
import {withWorld,E} from '../scripts/world.mjs';
test('actual canonical SDK Files world qualifies and verifies a canonical write',async()=>{
 const r=await withWorld(async w=>{
  const c=w.client,basis=await c.observe();assert.equal(basis.selectedTypes.length,2);
  assert.equal(w.config.deploymentBlockHash,w.setup.find(x=>x.label==='deploy NativeKernel').receipt.blockHash);
  assert(!w.config.rawType&&!w.config.graph.BytesValidator);
  await c.write('ensureRoot',[]);const root=(await c.call('rootId',[w.config.namespace])).value;
  const body=c.encodePayload(w.config.bytesType,'0xef008000');
  const action=await c.write('createFile',[root,E.toUtf8Bytes('binary'),w.config.bytesType,body]);assert.equal(action.status,'COMMITTED');
  const info=(await c.call('fileInfo',[action.fileId])).value;const record=await c.record(info.recordId);assert.equal(record.value.body,'0x0004ef008000');
  return {};
 },{kernelArtifact:'canonical-ref-free-v1'});assert(r.cleanup.stopped&&r.cleanup.cacheRemoved);
});
