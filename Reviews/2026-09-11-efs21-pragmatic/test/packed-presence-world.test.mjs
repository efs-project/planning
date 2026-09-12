import test from 'node:test';
import assert from 'node:assert/strict';
import {E,withWorld} from '../scripts/world.mjs';

test('frozen always-code control and packed current preserve helper and exact identities',{timeout:180000},async()=>{
  const identities=[];
  for(const selection of ['baseline-58e61c4','baseline-f43501a','current']){
    const result=await withWorld(async w=>{
      const c=w.client,helper=w.provenance.runtimes.BodyWriter.address;
      const nonce=BigInt(await c.rpc('eth_getTransactionCount',[helper,'latest']));
      const a=await c.write('storeRecord',[w.config.rawType,'0x']);
      const id=E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes'],[E.id('EFS21_RECORD_V1'),w.config.rawType,'0x']));
      assert.equal((await c.record(id,await c.observe(a.receipt.blockNumber))).value.body,'0x');
      assert.equal(await c.rpc('eth_getCode',[E.getCreateAddress({from:helper,nonce}),'latest']),selection==='current'?'0x':'0x00');
      await c.write('storeRecord',[w.config.rawType,'0x']);
      assert.equal(BigInt(await c.rpc('eth_getTransactionCount',[helper,'latest'])),nonce+(selection==='current'?0n:1n));
      const slot=E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','uint256'],[id,4]));
      assert.equal(BigInt(await c.rpc('eth_getStorageAt',[w.config.kernel,slot,'latest'])),selection==='baseline-58e61c4'?1n:0n);
      identities.push([w.config.rawType,w.config.bytesType,w.config.quoteType,w.provenance.runtimes.BodyWriter.codeHash]);
      return {};
    },{kernelArtifact:selection});
    assert(result.cleanup.stopped&&result.cleanup.cacheRemoved);
  }
  for(const identity of identities.slice(1))assert.deepEqual(identity,identities[0]);
});
