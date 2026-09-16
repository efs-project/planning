import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {createTagEnvironment} from '../core-closeout-tags-20260915/fixture.mjs';
import {createTagStancePlanner} from './tag-stance-profile.mjs';
let env,planner,s,e;
before(async()=>{
  env=await createTagEnvironment();s=env.tags;e=env.ethers;
  planner=createTagStancePlanner({ethers:e,call:env.call,ledgerAbi:env.contracts.ledger.abi,profileHash:(await env.call('tagIndex','tagProfileHash'))[0]});
});
after(async()=>env?.close());
const args=()=>({author:env.wallets.alice.address,principals:[s.principals.alice],subject:s.fileF,scope:'file',concept:s.conceptC});
test('explicit operations construct exact stance targets and ordinary CAS',async()=>{
  for(const [fn,index] of [['assertStance',0],['denyStance',1],['retractToSilent',2]]){
    const p=await planner[fn](args());assert.equal(p.actions[0].target,s.tokens[index]);assert.equal(p.actions[0].kind,3);assert.equal(p.actions[0].expectedRevision,0n);
    assert.equal(p.readSet.positions.length,1);assert.equal(p.actions[0].purpose,s.purpose);
  }
});
test('new Concept is published before its first ASSERT in the same guarded action',async()=>{
  const p=await planner.assertStance({...args(),concept:undefined,conceptNamespace:e.id('new-planner-concept'),conceptLabel:'new'});
  assert.deepEqual(p.actions.map(a=>a.kind),[1,3]);assert.equal(p.actions[1].role,p.concept);assert.equal(p.bodies[1],'0x');
});
test('supplied revision is explicit and claimed File mismatch refuses before signing',async()=>{
  await assert.rejects(planner.assertSuppliedRevision({...args(),subject:s.revision1,claimedFile:s.fileG}),/FILE_MISMATCH/);
  const p=await planner.assertSuppliedRevision({...args(),subject:s.revision1,claimedFile:s.fileF});
  assert.equal(p.actions[0].subject,s.revision1);assert.equal(p.selectionClaim,'EXACT_SUPPLIED_REVISION_NOT_CURRENT');
  await assert.rejects(planner.assertStance({...args(),subject:s.revision1,scope:'file'}),/SUBJECT_CLASS/);
});
test('selected revision guards HEAD and coordinate; changed HEAD rejects before signature',async()=>{
  await env.transact('ledger','bind',[e.id('efs2/purpose/head/1'),s.fileF,e.ZeroHash,s.revision1,0],'planner/head-1','alice');
  const p=await planner.assertStance({...args(),scope:'selectedRevision'});assert.equal(p.actions[0].subject,s.revision1);assert.equal(p.readSet.positions.length,2);
  await env.transact('ledger','bind',[e.id('efs2/purpose/head/1'),s.fileF,e.ZeroHash,s.revision2,1],'planner/head-2','alice');
  let called=false;await assert.rejects(planner.sign(p,()=>{called=true;return '0x';}),/READSET_DRIFT/);assert.equal(called,false);
});
test('wrong exact Concept and missing profile never plan a publication',async()=>{
  await assert.rejects(planner.assertStance({...args(),concept:s.tokens[0]}),/CONCEPT/);
  const opaque=createTagStancePlanner({ethers:e,call:env.call,ledgerAbi:env.contracts.ledger.abi,profileHash:e.ZeroHash});
  await assert.rejects(opaque.assertStance(args()),/PROFILE/);
});
test('the signed whole publication is admitted and read back semantically',async()=>{
  const p=await planner.assertStance({...args(),subject:s.fileG});const signed=await planner.sign(p,d=>env.wallets.alice.signingKey.sign(d).serialized);
  const tx=await env.observe(await env.enqueue('planner/signed-whole',{to:env.contracts.ledger.address,data:signed.data},'bob'));
  assert.equal(tx.status,'SUCCESS');
  const position=(await env.call('lens','positionKey',[s.purpose,s.fileG,s.conceptC]))[0];
  const key=e.keccak256(e.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),s.principals.alice,position]));
  const selected=await env.call('ledger','head',[key]);
  assert.equal(selected[0],1n);assert.equal(selected[5],s.tokens[0]);assert.notEqual(position,e.ZeroHash);
});
