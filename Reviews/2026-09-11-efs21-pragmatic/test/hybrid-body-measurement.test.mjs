import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {E} from '../scripts/world.mjs';
import {compareFinalArms} from '../scripts/hybrid-body-benchmark.mjs';

test('source-pinned retained four-arm hybrid receipts disclose writes, paid reads, regressions and cleanup',()=>{
  const r=JSON.parse(readFileSync(new URL('../evidence/hybrid-body-final.json',import.meta.url)));
  assert.deepEqual(compareFinalArms(r.arms),r.comparison);
  assert.equal(r.arms.length,4);
  for(const arm of r.arms){
    assert(arm.cleanup.stopped&&arm.cleanup.cacheRemoved);
    assert.equal(arm.actions.filter(a=>a.status==='REVERTED').length,9);
    for(const a of [...arm.setup,...arm.actions]){
      assert.equal(a.hash,a.receipt.transactionHash);assert.equal(a.hash,a.transaction.hash);
      assert.equal(a.calldataHash,E.keccak256(a.transaction.input));assert.equal(a.transaction.input,a.calldata);
      assert(BigInt(a.gasUsed)<=16777216n);assert.equal(a.receipt.blockHash,a.block.hash);
    }
    assert(arm.matrixObservations.some(o=>o.length===4096));
    assert(arm.actions.some(a=>a.label==='quote independent reader paid'));
    for(const count of [1,2])assert(arm.actions.some(a=>a.label===`matrix paid read raw 4096 0 first dispersed ${count}`));
  }
  assert(r.comparison.some(r=>BigInt(r.savedVsFrozen)<0n),'do not hide regressions');
  assert(r.comparison.some(r=>BigInt(r.savedVsFrozen)>0n));
  assert(r.comparison.some(r=>r.label==='matrix paid read raw 4096 0 first dispersed 1'),'paid comparison labels cannot be overwritten by body labels');
  assert.equal(r.comparison.find(r=>r.label==='raw 637 7 first dispersed').selectedBackend,0);
  assert.equal(r.comparison.find(r=>r.label==='raw 638 7 first dispersed').selectedBackend,1);
  const bad=structuredClone(r.arms);bad[3].actions[0].calldata='0x00';assert.throws(()=>compareFinalArms(bad));
});

test('calibration snapshots preserve actual pre-policy sources instead of relabeling final source',()=>{
  const r=JSON.parse(readFileSync(new URL('../evidence/hybrid-calibration.json',import.meta.url)));
  const snapshot=JSON.parse(readFileSync(new URL('../evidence/hybrid-calibration-sources.json',import.meta.url)));
  assert.equal(r.comparison.length,48);
  for(const arm of r.arms.slice(1)){
    for(const [path,pin] of Object.entries(arm.provenance.kernelArtifact.sourcePins))assert.equal(E.keccak256(E.toUtf8Bytes(snapshot.sources['contracts/'+path])),pin.keccak256);
    for(const [path,pin] of Object.entries(arm.provenance.supportPins))assert.equal(E.keccak256(E.toUtf8Bytes(snapshot.support[path])),pin);
  }
});
