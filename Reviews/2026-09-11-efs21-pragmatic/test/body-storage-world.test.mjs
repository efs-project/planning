import test from 'node:test';
import assert from 'node:assert/strict';
import {E,withWorld} from '../scripts/world.mjs';

test('both frozen expanded controls keep raw and discovery; candidate has pinned helper and exact inert child',{timeout:180000},async()=>{
  const identities=[];
  for(const selection of ['baseline-c088363','integrity-c088363','current']){
    const result=await withWorld(async w=>{
      const c=w.client;
      assert(w.config.rawType,'expanded control must not be treated as legacy registry');
      assert(w.provenance.runtimes.DiscoveryIndex);
      identities.push([w.config.rawType,w.config.bytesType,w.config.quoteType,...['RawBytesValidator','BytesValidator','Uint256Validator'].map(k=>w.provenance.runtimes[k].codeHash)]);
      const helper=E.getCreateAddress({from:w.config.kernel,nonce:4});
      const nonce=BigInt(await c.rpc('eth_getTransactionCount',[helper,'latest']));
      const body='0xef0080ff00';
      const a=await c.write('storeRecord',[w.config.rawType,body]);
      const id=E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes'],[E.id('EFS21_RECORD_V1'),w.config.rawType,body]));
      assert.equal((await c.record(id,await c.observe(a.receipt.blockNumber))).value.body,body);
      if(selection==='current'){
        const pin=w.provenance.runtimes.BodyWriter;assert.equal(pin.address.toLowerCase(),helper.toLowerCase());
        assert.equal(pin.codeHash,E.keccak256(await c.rpc('eth_getCode',[helper,'latest'])));
        const child=E.getCreateAddress({from:helper,nonce});
        assert.equal(await c.rpc('eth_getCode',[child,'latest']),'0x00'+body.slice(2));
        await c.write('storeRecord',[w.config.rawType,body]);
        assert.equal(BigInt(await c.rpc('eth_getTransactionCount',[helper,'latest'])),nonce+1n);
        await c.rpc('anvil_setCode',[child,'0x00ef0080fe00']);
        await assert.rejects(()=>c.record(id),/CorruptRecord|revert/i);
      }
      return {};
    },{kernelArtifact:selection});
    assert(result.cleanup.stopped&&result.cleanup.cacheRemoved);
  }
  assert.deepEqual(identities[0],identities[1]);assert.deepEqual(identities[1],identities[2]);
});
