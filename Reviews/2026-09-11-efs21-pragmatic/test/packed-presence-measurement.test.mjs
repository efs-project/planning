import test from 'node:test';
import assert from 'node:assert/strict';
const runner=await import('../scripts/packed-presence-benchmark.mjs').catch(()=>({}));
test('fresh packed-presence pair retains exact action calldata, semantic reads and cleanup',{timeout:300000},async()=>{
  assert.equal(typeof runner.comparePackedPresence,'function');
  const r=await runner.comparePackedPresence();
  assert.deepEqual(r.arms.map(a=>a.selection),['baseline-58e61c4','current']);
  for(const arm of r.arms){
    assert(arm.cleanup.stopped&&arm.cleanup.cacheRemoved);
    assert(arm.actions.length>150);
    assert.equal(arm.actions.filter(a=>a.status==='REVERTED').length,5);
    for(const a of [...arm.setup,...arm.actions]){
      assert.equal(a.transaction.input,a.calldata);
      assert.equal(a.transaction.hash,a.receipt.transactionHash);
      assert(BigInt(a.gasUsed)<=16777216n);
    }
  }
  for(const row of r.comparison){
    assert.equal(row.costs.length,2);
    assert.equal(row.intrinsicDeltaGas,'0');
    assert(row.costs.every(c=>c.hash&&c.blockHash&&c.blockNumber));
  }
  for(const size of [0,31,32,33,41,256,4032])for(const pattern of ['zero','nonzero']){
    assert(r.comparison.some(a=>a.label===`admit raw ${size} ${pattern} first`));
    assert(r.comparison.some(a=>a.label===`admit raw ${size} ${pattern} duplicate`));
  }
  assert(r.comparison.some(a=>a.label==='boundary raw4096 zero first'));
  assert(r.comparison.some(a=>a.label==='file raw-4032 edit fresh'&&BigInt(a.savedGas)>0n));
  assert(r.comparison.some(a=>a.label==='quote independent reader paid'));
  assert(r.readComparison.every(a=>a.paidReceipt===false));
  // Catches a comparator silently accepting non-matched calldata in a reused arm.
  const corrupted=structuredClone(r.arms);
  corrupted[1].actions[0].calldata='0x00';
  assert.throws(()=>runner.compareMatchedArms(corrupted),/calldata/);
});
