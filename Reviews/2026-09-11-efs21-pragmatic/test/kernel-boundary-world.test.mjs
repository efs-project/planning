import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {E,ROOT,withWorld} from '../scripts/world.mjs';
import {boundaryWorkload,compareBoundary} from '../scripts/kernel-boundary-benchmark.mjs';
import {benchmarkHybrid} from '../scripts/hybrid-body-benchmark.mjs';

test('extraction CLI reaches one finite world and historical hybrid requires explicit selection',{timeout:60000},async()=>{
  await assert.rejects(()=>benchmarkHybrid(),/explicit frozenReplay/);
  const r=spawnSync(process.execPath,['scripts/kernel-boundary-benchmark.mjs','--probe'],{cwd:ROOT,encoding:'utf8',timeout:55000});
  assert.equal(r.status,0,r.stderr||r.error?.message);
  const result=JSON.parse(r.stdout);assert.notEqual(result.root,E.ZeroHash);assert.equal(result.actionCount,1);
  assert(result.cleanup.stopped&&result.cleanup.cacheRemoved);
});

test('two source-qualified boundary worlds preserve Files and Record semantics with honest costs',{timeout:180000},async()=>{
  const arms=[];
  for(const kernelArtifact of ['baseline-7db38cd','current'])arms.push(await withWorld(boundaryWorkload,{kernelArtifact}));
  const comparison=compareBoundary(arms);
  assert(comparison.actions.length>50);
  for(const arm of arms){
    assert(arm.cleanup.stopped&&arm.cleanup.cacheRemoved);
    assert.equal(arm.failures.length,8);assert.equal(arm.reads.length,6);
    assert.equal(arm.observations.filter(r=>r.backend===0).length,2);
    assert.equal(arm.observations.filter(r=>r.backend===1).length,4);
    assert(arm.reads.every(r=>r.qualificationCost.logicalRpcCalls>10));
  }
  const altered=structuredClone(arms);altered[1].semantics[0].file=E.ZeroHash;
  assert.throws(()=>compareBoundary(altered));
});
