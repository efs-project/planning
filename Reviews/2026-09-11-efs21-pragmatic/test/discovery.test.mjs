import test from 'node:test';
import assert from 'node:assert/strict';
import {withWorld,E,artifact} from '../scripts/world.mjs';
import {failureReceipts} from '../scripts/discovery-failures.mjs';

test('reviewed history baseline remains runnable beside additive discovery ABI',{timeout:120000},async()=>{
  const result=await withWorld(async w=>{
    assert.equal(w.provenance.kernelArtifact.sourceCommit,'bf566dc0e26f486364947f82fadcd87149c01d59');
    await w.client.write('ensureRoot',[],'root');
    return {provenance:w.provenance};
  },{kernelArtifact:'baseline-bf566dc'});
  assert.equal(result.cleanup.cacheRemoved,true);
});

test('actual partial-write and child/outer OOG receipts preserve trusted health boundary',{timeout:120000},async()=>{
  const result=await withWorld(failureReceipts);
  assert.equal(result.cleanup.cacheRemoved,true);
  assert.equal(result.cases.length,2);
  for(const fixture of result.cases) for(const action of fixture.actions) {
    assert(action.benchmarkCanonicalCheck);
    assert(BigInt(action.gasUsed)>0n);
  }
});

test('real discovery receipts and same-basis reads preserve qualified duplicate files',{timeout:120000},async()=>{
  const result=await withWorld(async w=>{
    assert(w.provenance.runtimes.DiscoveryIndex,'coordinator runtime identity pinned');
    const c=w.client,n=w.config.namespace;
    const d=w.provenance.runtimes.DiscoveryIndex.address,di=new E.Interface(artifact('DiscoveryIndex').abi);
    await c.write('ensureRoot',[],'root'); const root=(await c.call('rootId',[n])).value;
    for(const name of ['a','b']) await c.write('createFile',[root,E.toUtf8Bytes(name),w.config.quoteType,E.AbiCoder.defaultAbiCoder().encode(['uint256'],[0])],name);
    await c.sendData('attach',di.encodeFunctionData('attach',[w.config.quoteType,false]),d);
    const s=(await c.call('status',[n],undefined,d,di)).value;
    assert.equal(s.highWater,3n); assert.equal(s.health,1n);
    await c.sendData('backfill',di.encodeFunctionData('backfill',[n,s.epoch,0,64]),d);
    const basis=await c.observe(),p=(await c.call('page',[n,s.epoch,0,[E.ZeroHash,0,0],64],basis,d,di)).value;
    assert.equal(p.ids.length,2); assert.equal(p.complete,true);
    assert.notEqual(p.ids[0],p.ids[1]);
    const first=(await c.call('page',[n,s.epoch,0,[E.ZeroHash,0,0],1],basis,d,di)).value;
    assert.equal(first.complete,false);
    const last=(await c.call('page',[n,s.epoch,0,[...first.next],1],basis,d,di)).value;
    assert.equal(last.complete,true); assert.deepEqual([...first.ids,...last.ids],[...p.ids]);
    const end=(await c.call('page',[n,s.epoch,0,[...last.next],1],basis,d,di)).value;
    assert.equal(end.complete,true); assert.equal(end.ids.length,0);
    for(const id of p.ids) {
      const f=(await c.call('fileInfo',[id],basis)).value;
      assert.equal(f.live,true); assert.equal(f.directory,false);
      const r=(await c.record(f.recordId,basis)).value;
      assert.equal(r.typeId,w.config.quoteType); assert.equal(r.body,E.ZeroHash);
    }
    return {};
  });
  assert.equal(result.cleanup.cacheRemoved,true);
});
