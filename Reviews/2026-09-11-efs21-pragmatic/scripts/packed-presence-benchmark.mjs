import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {ROOT,build,withWorld} from './world.mjs';
import {workload} from './body-storage-benchmark.mjs';

export function compareMatchedArms(arms){
  assert.deepEqual(arms.map(a=>a.selection),['baseline-58e61c4','current']);
  const [before,after]=arms;
  assert.deepEqual(after.types,before.types);
  assert.deepEqual(after.memberships,before.memberships);
  for(const name of ['RawBytesValidator','BytesValidator','Uint256Validator','ExpandedTypeRegistry','DiscoveryIndex','NavigationIndex','BodyWriter']){
    assert.deepEqual(after.provenance.runtimes[name],before.provenance.runtimes[name]);
  }
  assert.deepEqual(after.actions.map(a=>a.label),before.actions.map(a=>a.label));
  const comparison=before.actions.map((a,i)=>{
    const b=after.actions[i];
    assert.equal(b.calldata,a.calldata,'matched action calldata');
    assert.deepEqual(b.workload,a.workload);
    assert.equal(b.status,a.status);
    assert.equal(b.intrinsicGas,a.intrinsicGas,'matched intrinsic gas');
    const w=a.workload??{};
    return {label:a.label,...w,admission:a.status==='REVERTED'?'refused':typeof w.dedup==='boolean'?(w.dedup?'dedup':'fresh'):'not-applicable',status:a.status,costs:[a,b].map((r,j)=>({arm:arms[j].selection,gas:r.gasUsed,intrinsicGas:r.intrinsicGas,hash:r.hash,blockNumber:r.receipt.blockNumber,blockHash:r.receipt.blockHash})),savedGas:String(BigInt(a.gasUsed)-BigInt(b.gasUsed)),intrinsicDeltaGas:String(BigInt(b.intrinsicGas)-BigInt(a.intrinsicGas))};
  });
  assert.deepEqual(after.reads.map(r=>r.label),before.reads.map(r=>r.label));
  const readComparison=before.reads.map((a,i)=>{
    const b=after.reads[i];
    assert.deepEqual(b.returnValue,a.returnValue);assert.equal(b.returnBytes,a.returnBytes);
    return {label:a.label,typeId:a.typeId??null,bodyBytes:a.bodyBytes??null,returnBytes:a.returnBytes,estimates:[a,b].map((r,j)=>({arm:arms[j].selection,gas:r.executionEstimateGas,basis:r.basis})),savedEstimateGas:String(BigInt(a.executionEstimateGas)-BigInt(b.executionEstimateGas)),paidReceipt:false};
  });
  assert.deepEqual(after.setup.map(a=>a.label),before.setup.map(a=>a.label));
  const setupComparison=before.setup.map((a,i)=>{
    const b=after.setup[i];
    if(i>0)assert.equal(b.calldata,a.calldata,'matched non-kernel setup calldata');
    return {label:a.label,beforeGas:a.gasUsed,afterGas:b.gasUsed,savedGas:String(BigInt(a.gasUsed)-BigInt(b.gasUsed)),intrinsicDeltaGas:String(BigInt(b.intrinsicGas)-BigInt(a.intrinsicGas)),sameCalldata:a.calldata===b.calldata};
  });
  return {comparison,readComparison,setupComparison};
}

export async function comparePackedPresence(){
  build();const arms=[];
  for(const kernelArtifact of ['baseline-58e61c4','current'])arms.push(await withWorld(workload,{kernelArtifact,buildFirst:false}));
  return {createdAt:new Date().toISOString(),standing:'Fresh-genesis native always-code packed-presence comparison only; frozen reviewed 58e61c4 versus current',arms,...compareMatchedArms(arms),limits:{runtime:24576,initcode:49152,body:4096,transactionAndBlockGas:16777216},limitations:[
    'No hybrid, full-v2 saving, adoption, migration, production deployment or live browser replacement',
    'Exact public ABI, Type/Record IDs, validators, helper and index runtimes are unchanged; only private Record metadata/presence differs',
    'Whole-operation receipt costs include setup and paid reads separately; eth_estimateGas is not a paid receipt',
    'All action calldata is exactly matched; action intrinsic deltas are zero; kernel deployment bytes and intrinsic gas differ',
    'A cleared presence flag is indistinguishable from absence; true malformed metadata still refuses as CorruptRecord',
    'Both backends remain always-code: tiny/zero-heavy regressions relative to storage are not solved or remeasured here',
    'Mandatory discovery failure uses local code replacement/restoration; no traces, raised ceilings or public funds',
    'Historical three-arm benchmark defaults/evidence retained; this run does not rerun the unrelated original-storage control',
  ]};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const result=await comparePackedPresence();
  writeFileSync(ROOT+'evidence/packed-presence.json',JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({sources:result.arms.map(a=>a.provenance.kernelArtifact.sourceCommit),transactions:result.arms.map(a=>a.setup.length+a.actions.length),cleanup:result.arms.map(a=>a.cleanup),selected:result.comparison.filter(r=>/file raw-(41|256|4032) (create fresh|edit fresh)|quote |refuse/.test(r.label)).map(({label,costs,savedGas})=>({label,gas:costs.map(c=>c.gas),savedGas}))},null,2));
}
