import test from 'node:test';
import assert from 'node:assert/strict';
import * as benchmark from '../scripts/raw-benchmark.mjs';
test('canonical/raw matched receipts keep build/profile/effects equal and capacity refusals separate',{timeout:240000},async()=>{
  assert.equal(typeof benchmark.pairedRaw,'function');
  const result=await benchmark.pairedRaw();
  assert.equal(result.comparison.length,60);
  assert.equal(result.canonical.provenance.kernelArtifact.creationBytecodeHash,result.raw.provenance.kernelArtifact.creationBytecodeHash);
  assert.deepEqual(result.canonical.provenance.sourcePins,result.raw.provenance.sourcePins);
  assert.equal(result.canonical.discoveryMode,'UNSUPPORTED / no attached profile');
  assert.equal(result.raw.discoveryMode,result.canonical.discoveryMode);
  for(const side of [result.canonical,result.raw]){
    assert(side.cleanup.stopped&&side.cleanup.cacheRemoved);
    assert.equal(side.consumer.digest,benchmark.E.keccak256(new Uint8Array(41).fill(66)));
    assert.equal(side.consumer.length,41);
    assert(side.actions.every(a=>a.receipt&&a.calldataZeroBytes+a.calldataNonzeroBytes===a.calldataBytes));
    assert(side.setup.every(a=>a.receipt&&a.calldataZeroBytes+a.calldataNonzeroBytes===a.calldataBytes));
  }
  assert.equal(result.canonical.capacity.find(x=>x.payloadBytes===4096).status,'REVERTED');
  assert.equal(result.raw.capacity.find(x=>x.payloadBytes===4096).status,'COMMITTED_RECORD');
  assert(result.comparison.every(x=>x.payloadBytes<=4032));
  for(const size of [0,1,31,32,33,41,256,4032])for(const pattern of ['zero','nonzero','mixed'])assert(result.comparison.some(x=>x.label===`matrix ${pattern} ${size} first`));
});
