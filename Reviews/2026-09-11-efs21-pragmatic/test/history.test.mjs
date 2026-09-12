import test from 'node:test';
import assert from 'node:assert/strict';
import {pairedHistory} from '../scripts/history-benchmark.mjs';

test('same SDK preserves after-operation state/history across pinned baseline and compressed-history worlds',{timeout:240000},async()=>{
  const {baseline,current,comparison}=await pairedHistory();
  assert.equal(current.states.length,50);
  assert.notEqual(current.provenance.kernelArtifact.creationBytecodeHash,baseline.provenance.kernelArtifact.creationBytecodeHash);
  assert.equal(baseline.provenance.kernelArtifact.selection,'baseline-aa6b1b6');
  assert.equal(current.contractInterop.publications[1].value,3100);
  assert.equal(current.contractInterop.publications[1].revision,2);
  assert.equal(current.contractInterop.consumerRead.value,'3100');
  assert(comparison.some(a=>a.label==='producer uint256 update'));
  assert(comparison.some(a=>a.label==='consumer uint256 read transaction'));
  for(const length of [1,31,32,33,64]) {
    const edit=comparison.find(a=>a.label===`name-${length} edit 2 fresh 41B`);
    assert(BigInt(edit.savedGas)>0n,'actual paired fresh-content edit receipts improve');
  }
});
