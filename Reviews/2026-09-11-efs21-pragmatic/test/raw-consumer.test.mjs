import test from 'node:test';
import assert from 'node:assert/strict';
import {E,withWorld,artifact} from '../scripts/world.mjs';
test('unrelated consumer resolves both representations and stores independently checked payload digest',{timeout:180000},async()=>{
  await withWorld(async w=>{
    const consumer=await w.deploy('PayloadConsumer',[w.config.bytesType,w.config.rawType]);
    const iface=new E.Interface(artifact('PayloadConsumer').abi),c=w.client;
    await c.write('ensureRoot',[]);const root=(await c.call('rootId',[w.config.namespace])).value;
    for(const [name,typeId,payload] of [['canonical',w.config.bytesType,'0xef008000'],['raw',w.config.rawType,'0xef008000'],['empty',w.config.rawType,'0x']]){
      const created=await c.write('createFile',[root,E.toUtf8Bytes(name),typeId,c.encodePayload(typeId,payload)]);
      const args=[w.config.kernel,w.config.namespace,[E.toUtf8Bytes(name)]];
      const before=await c.call('read',args,undefined,consumer,iface);
      assert.equal(before.value.digest,E.keccak256(payload));assert.equal(before.value[1],BigInt(E.getBytes(payload).length));
      const action=await c.sendData('consumer '+name,iface.encodeFunctionData('capture',args),consumer);
      const basis=await c.observe(action.receipt.blockNumber);
      assert.equal((await c.call('lastDigest',[],basis,consumer,iface)).value,E.keccak256(payload));
      assert.equal((await c.call('lastLength',[],basis,consumer,iface)).value,BigInt(E.getBytes(payload).length));
      assert.equal((await c.call('lastRevision',[],basis,consumer,iface)).value,1n);
      assert.equal((await c.call('lastRecordId',[],basis,consumer,iface)).value,(await c.call('fileInfo',[created.fileId],basis)).value.recordId);
      await c.write('unlink',[created.fileId,1]);
      await assert.rejects(()=>c.call('read',args,undefined,consumer,iface));
    }
    await assert.rejects(()=>c.call('read',[w.config.kernel,w.config.namespace,[]],undefined,consumer,iface));
    await c.write('createFile',[root,E.toUtf8Bytes('scalar'),w.config.quoteType,E.AbiCoder.defaultAbiCoder().encode(['uint256'],[42])]);
    await assert.rejects(()=>c.call('read',[w.config.kernel,w.config.namespace,[E.toUtf8Bytes('scalar')]],undefined,consumer,iface));
    return {};
  });
});
