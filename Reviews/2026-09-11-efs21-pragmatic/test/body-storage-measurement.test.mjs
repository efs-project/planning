import test from 'node:test';
import assert from 'node:assert/strict';
const runner=await import('../scripts/body-storage-benchmark.mjs').catch(()=>({}));
test('three-arm fresh receipts retain exact matched bodies, negative savings, failure receipts and cleanup',{timeout:300000},async()=>{
  assert.equal(typeof runner.compareBodyStorage,'function');
  const r=await runner.compareBodyStorage();
  assert.equal(r.arms.length,3);
  for(const arm of r.arms){
    assert(arm.cleanup.stopped&&arm.cleanup.cacheRemoved);
    assert(arm.actions.length>150);
    for(const a of [...arm.setup,...arm.actions]){
      assert.equal(a.transaction.hash,a.hash);
      assert.equal(a.transaction.input,a.calldata);
      assert.equal(a.receipt.transactionHash,a.hash);
      assert(BigInt(a.gasUsed)<=16777216n);
    }
    assert.equal(arm.actions.filter(a=>a.status==='REVERTED').length,5);
  }
  assert(r.comparison.some(row=>BigInt(row.primarySavedGas)<0n));
  assert(r.comparison.some(row=>row.payloadBytes===4032&&BigInt(row.primarySavedGas)>0n));
  for(const representation of ['raw','canonical'])for(const size of [0,1,31,32,33,41,256,4032])for(const pattern of ['zero','nonzero','mixed']){
    assert(r.comparison.some(row=>row.label===`admit ${representation} ${size} ${pattern} first`));
  }
  for(const row of r.comparison){
    for(const key of ['typeId','payloadBytes','bodyBytes','bodyComposition','dedup','admission'])assert(Object.hasOwn(row,key));
    assert.equal(row.costs.length,3);assert(row.costs.every(c=>c.hash&&c.blockHash&&c.blockNumber));
    assert(row.costs.every(c=>c.intrinsicGas));
  }
  assert(r.readComparison.length>20);assert(r.readComparison.every(r=>!r.paidReceipt));
});
