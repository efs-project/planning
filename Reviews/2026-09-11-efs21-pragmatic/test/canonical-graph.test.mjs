import test from 'node:test';
import assert from 'node:assert/strict';
import {withWorld,E,observeBody} from '../scripts/world.mjs';
import {createClient} from '../sdk/client.mjs';
test('candidate qualification rejects actual helper/registry/cache/writer corruption at one basis',async()=>{
 await withWorld(async w=>{
  const c=w.client;const initial=await c.observe();assert.equal(initial.selectedTypes.length,2);
  for(const role of ['NativeKernel','NativeRecordKernel','types','PreparationHelper','BodyWriter','RecordInventoryIndex','NavigationIndex','DiscoveryIndex']){
   const address=w.config.graph[role],code=await c.rpc('eth_getCode',[address,'latest']);await c.rpc('anvil_setCode',[address,'0x00']);
   await assert.rejects(()=>c.observe(),/identity mismatch/);await assert.rejects(()=>c.write('ensureRoot',[]),/identity mismatch/);await c.rpc('anvil_setCode',[address,code]);
  }
  for(const type of initial.selectedTypes){
   const address=type.cacheCode,code=await c.rpc('eth_getCode',[address,'latest']);
   const variants=['0x','0x01'+code.slice(4),code.slice(0,-2)+'ff',code+'00'];
   for(const bad of variants){await c.rpc('anvil_setCode',[address,bad]);await assert.rejects(()=>c.observe());await assert.rejects(()=>c.write('ensureRoot',[]));}
   await c.rpc('anvil_setCode',[address,code]);
  }
  // Actual canonical registry Type mapping root1, cache pointer word3 (after group/member/blob).
  const type=w.config.bytesType,registry=w.config.graph.types;
  const base=BigInt(E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','uint256'],[type,1])));
  const slot=E.toBeHex(base+3n,32),word=await c.rpc('eth_getStorageAt',[registry,slot,'latest']);
  await c.rpc('anvil_setStorageAt',[registry,slot,E.ZeroHash]);await assert.rejects(()=>c.observe());await c.rpc('anvil_setStorageAt',[registry,slot,word]);
  for(const delta of [{genesisHash:E.ZeroHash},{deploymentBlockHash:E.ZeroHash},{codeHash:E.ZeroHash}])await assert.rejects(()=>createClient(E,{...w.config,...delta}).observe(),/identity mismatch/);
  await assert.rejects(()=>c.call('rootId',[w.config.namespace],{...initial,blockHash:E.ZeroHash}),/Stale observation/);
  assert.equal((await c.observe()).graphId,initial.graphId);return {};
 },{kernelArtifact:'canonical-ref-free-v1'});
});
test('actual candidate Record body storage and reached late helper failure retain rollback evidence',async()=>{
 await withWorld(async w=>{
  const c=w.client;await c.write('ensureRoot',[]);const root=(await c.call('rootId',[w.config.namespace])).value;
  const payload='0x'+'ff'.repeat(80),body=c.encodePayload(w.config.bytesType,payload);
  const action=await c.write('createFile',[root,E.toUtf8Bytes('body'),w.config.bytesType,body]);const before=(await c.call('fileInfo',[action.fileId])).value;
  const storage=await observeBody(w,before.recordId,body,await c.observe());assert.equal(storage.backend,0);
  const original=await c.rpc('eth_getCode',[storage.pointer,'latest']);await c.rpc('anvil_setCode',[storage.pointer,original.slice(0,-2)+'00']);await assert.rejects(()=>c.record(before.recordId));await c.rpc('anvil_setCode',[storage.pointer,original]);
  const helper=w.config.graph.PreparationHelper,code=await c.rpc('eth_getCode',[helper,'latest']);
  const nonce=await c.rpc('eth_getTransactionCount',[helper,'latest']),writer=w.config.graph.BodyWriter,writerNonce=await c.rpc('eth_getTransactionCount',[writer,'latest']);
  await c.rpc('anvil_setCode',[helper,'0x00']);
  const failed=await w.faultWrite('editFile',[action.fileId,1,w.config.bytesType,c.encodePayload(w.config.bytesType,'0x010203')],'reached helper failure');assert.equal(failed.receipt.status,'0x0');
  await c.rpc('anvil_setCode',[helper,code]);
  assert.equal(await c.rpc('eth_getTransactionCount',[helper,'latest']),nonce);assert.equal(await c.rpc('eth_getTransactionCount',[writer,'latest']),writerNonce);
  const after=(await c.call('fileInfo',[action.fileId])).value;assert.equal(after.revision,before.revision);assert.equal(after.recordId,before.recordId);assert.equal((await c.record(before.recordId)).value.body,body);
  return {};
 },{kernelArtifact:'canonical-ref-free-v1'});
});
