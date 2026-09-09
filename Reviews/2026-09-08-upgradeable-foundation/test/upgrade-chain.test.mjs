import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { verifyUpgradeBatch, readUpgradeState, verifyUpgradeState, executionId } from '../reference/upgrade-reader.mjs';
import { compileUpgrade, withUpgrade } from '../scripts/local-upgrade.mjs';
import { publication, groupLeaf } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { verifyState, readState, ordinaryRecord } from '../../2026-09-05-c0-core/reference/state-reader.mjs';
import { keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { mkdirSync, writeFileSync } from 'node:fs';

const concat = (...xs) => '0x' + xs.map(x => x.replace(/^0x/, '')).join('');
const retained = s => Object.fromEntries(['bootstrap','counts','records','types','envelopes','principals','admissions','batches','bindings','postings','occurrences'].map(k => [k, s[k].map ? s[k].map(x => typeof x === 'object' ? { ...x, pin: undefined } : x) : s[k]]));
const checked = async lab => { const result = await readUpgradeState(lab); assert.equal(result.outcome, 'VERIFIED', result.reason); return result; };
const domain = s => keccak256(Buffer.from(s));
const tag = (domainName, value) => keccak256(concat(domain('efs2/'+domainName+'/1'),domain(value)));
const evidenceReport={};
after(()=>{
  if(process.env.EFS_UPGRADE_EVIDENCE !== '1')return;
  assert(evidenceReport.snapshots && evidenceReport.sameBlock && evidenceReport.bounds && evidenceReport.exceptionCleanup,'complete evidence scenarios');
  const encoded=JSON.stringify(evidenceReport,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n';assert(Buffer.byteLength(encoded)<=2*1024*1024,'bounded evidence export');
  const directory=new URL('../fixtures/',import.meta.url);mkdirSync(directory,{recursive:true});writeFileSync(new URL('managed-upgrade.json',directory),encoded);
});

const W = n => '0x' + BigInt(n).toString(16).padStart(64, '0');
const history = [
  { ordinal: '1', activationBlock: '10', activationAdmissionHigh: '0', operator: '0x0000000000000000000000000000000000000009', coreCodehash: W(101) },
  { ordinal: '2', activationBlock: '20', activationAdmissionHigh: '4', operator: '0x0000000000000000000000000000000000000009', coreCodehash: W(102) },
];
const batch = (first, count, block, revision, hash = W(100 + revision)) => [String(BigInt(first) | BigInt(count) << 48n | BigInt(block) << 64n | BigInt(revision) << 112n), '9', hash];

// Break: treating the current revision as the original batch revision, or using
// strict block ordering instead of the admission high at activation.
test('historical U1 and U2 batches in the same block retain exact revision membership', () => {
  assert.equal(verifyUpgradeBatch(batch(1, 4, 20, 1), history, 5n).outcome, 'VERIFIED');
  assert.equal(verifyUpgradeBatch(batch(5, 1, 20, 2), history, 5n).outcome, 'VERIFIED');
  assert.equal(verifyUpgradeBatch(batch(4, 2, 20, 1), history, 5n).outcome, 'INVALID');
  assert.equal(verifyUpgradeBatch(batch(5, 1, 20, 1), history, 5n).outcome, 'INVALID');
});
// Break: unknown history silently using the active implementation or U1 rules.
test('missing original revision is UNKNOWN, substituted authority is INVALID', () => {
  assert.equal(verifyUpgradeBatch(batch(1, 4, 20, 1), [history[1]], 5n).outcome, 'UNKNOWN');
  assert.equal(verifyUpgradeBatch(batch(1, 4, 20, 1, W(102)), history, 5n).outcome, 'INVALID');
});
test('unavailable raw snapshot is UNKNOWN rather than an invalid execution claim', () => {
  assert.equal(verifyUpgradeState(undefined,{}).outcome,'UNKNOWN');
});

// Break: accepting producer getters/code or current revision as their own oracle;
// losing retained state, or claiming staged bytes alone are a file publication.
test('managed source-pinned upgrade retains seven-leaf file metadata and refuses stale consent', { timeout: 300000 }, async t => {
  compileUpgrade();
  const report = {};
  await withUpgrade(async lab => {
    const groupCosts = [];
    for (const [i, g] of lab.inputs.candidates.groups.entries()) {
      const result = await lab.publish(publication([groupLeaf(lab.inputs.meta, '0x' + g.groupHex)], i + 1));
      assert.equal(result.receipt.status, '0x1'); groupCosts.push(result.receipt.gasUsed);
    }
    let state = await checked(lab);
    assert.deepEqual(state.counts.slice(0, 6), ['4','4','17','1','4','4']);
    const m = Object.fromEntries(lab.inputs.candidates.groups.flatMap(g => g.members.map(m => [m.descriptor.name, m.temporaryTypeSchemaId])));
    const principal = W(0xffffffffffffn);
    const object = (salt,meaning) => ({ typeId: m['ObjectGenesis/1'], body: concat(principal, domain('disposable fixture salt/'+salt), meaning ? concat('01',domain('efs2/files/meaning/'+meaning+'/1')) : '00') });
    const binding = (purpose, subject, role, target) => ({ typeId: m['BindingSet/1'], body: concat(purpose, subject, role, '01', target, '00', '00') });
    const charterPurpose=tag('purpose','objects/publisher-charter/1'), namePurpose=tag('purpose','files/name-slot/1'), headPurpose=tag('purpose','files/revision-head/1'),headRole=tag('fieldrole','files/current-revision/1'),nameRole=tag('fieldrole','note.txt');
    const rootObject = object(900,'directory'), rootId = ordinaryRecord(rootObject.typeId, rootObject.body);
    const rootPub = publication([rootObject, binding(charterPurpose,rootId,W(1),rootId)], 10, { revisions: [[1,0]] });
    assert.equal((await lab.publish(rootPub)).receipt.status, '0x1');
    const rootState=await checked(lab);
    assert.equal(rootState.entries[4].fields[2],'0x0101e215467b8ee4a99febf216e1261a7c600ab29c0e8fbc46f5bfe61f447ad57d');
    assert.deepEqual(rootState.entries[5].fields.slice(0,3),['0xa38d634601e6a7371a703cff7f264c94ccee832df3c91311ae024c644b081b6d',rootId,W(1)]);
    assert.equal(rootState.entries[5].principal,principal);
    const fileObject = object(901,'file'), fileId = ordinaryRecord(fileObject.typeId,fileObject.body);
    const bytes = '0x' + Buffer.from('EFS upgrade foundation\n').toString('hex');
    const root = keccak256(concat('00',bytes));
    const tree = { typeId: m['ChunkTree/1'], body: concat('00001000','00000001',BigInt((bytes.length-2)/2).toString(16).padStart(16,'0'),root) };
    const treeId = ordinaryRecord(tree.typeId,tree.body);
    const staged = await lab.stage(treeId,tree.body,bytes);
    assert.equal(staged.receipt.status,'0x1');
    assert(!(await checked(lab)).snapshot.records.some(x => x.id === treeId), 'staging is not admission');
    const revision = { typeId: m['FileRevision/1'], body: concat(fileId,treeId,'000a746578742f706c61696e','0100057574662d38','01','0000') };
    const revisionId = ordinaryRecord(revision.typeId,revision.body);
    const dir = { typeId: m['DirectoryEntry/1'], body: concat(rootId,'00086e6f74652e747874',fileId,'00') };
    const dirId = ordinaryRecord(dir.typeId,dir.body);
    const seven = publication([fileObject,binding(charterPurpose,fileId,W(1),fileId),tree,revision,binding(headPurpose,fileId,headRole,revisionId),dir,binding(namePurpose,rootId,nameRole,dirId)],11,{revisions:[[1,0],[4,0],[6,0]]});
    const written = await lab.publish(seven); assert.equal(written.receipt.status,'0x1');
    state = await checked(lab);
    assert.deepEqual(state.counts.slice(0,6),['13','6','17','1','13','6']);
    assert.equal(state.fold.bindings.size,4);
    assert.equal(state.entries[6].fields[2],'0x018effe7bf31bef1455749637690ce46a3be8417c2db89dfb3c99e2a9c61d30c91');
    assert.deepEqual(state.entries[10].fields.slice(0,3),['0xd2c275d9e47a3f3759e5f2eef32838d2bc54b4db5aad16bcb72592a2c88f2732',fileId,'0xb2f381846f7484626268a4b9e636e357a96826dc250038850c830d7736740b63']);
    assert.deepEqual(state.entries[12].fields.slice(0,3),['0x163851e733acd76695728186e4315f008e5f1fdfd21fb5687fd3e1e8b7dba32c',rootId,'0x55927d6fb76d610ad3b1aff1547a82bcc814afaa9857e3a7b3ceb4c09f792cd4']);
    for(const [purpose,subject,role,target] of [[charterPurpose,rootId,W(1),rootId],[charterPurpose,fileId,W(1),fileId],[headPurpose,fileId,headRole,revisionId],[namePurpose,rootId,nameRole,dirId]]) {
      const position=keccak256(concat(domain('efs2/position/1'),purpose,subject,role));
      const key=keccak256(concat(domain('efs2/binding/1'),principal,position));
      const head=state.fold.bindings.get(key);assert(head,'independent authored Binding key');
      assert.deepEqual([head.state,head.revision,head.targetKind,head.target,head.targetLeaf],[1,1n,1,target,0]);
    }
    assert.deepEqual(state.entries.slice(-7).map(e => e.recordId),seven.recordIds);
    assert.equal(await lab.readBytes(treeId,state.basis),bytes);
    const pending = await lab.prepare(publication([object(902)],12));
    const before = state;
    const upgraded = await lab.upgrade(); assert.equal(upgraded.receipt.status,'0x1');
    const after = await checked(lab);
    assert.deepEqual(retained(after.snapshot),retained(before.snapshot));
    assert.equal(await lab.readBytes(treeId,after.basis),bytes);
    const pinnedCall=async(address,name,args=[])=>lab.iface.decodeFunctionResult(name,await lab.rpc('eth_call',[{to:address,data:lab.iface.encodeFunctionData(name,args)},{blockHash:after.basis.hash,requireCanonical:true}]))[0];
    const presentationLabels=await Promise.all([lab.core,lab.carrier].map(address=>pinnedCall(address,'presentationLabel')));
    assert.deepEqual(presentationLabels,['Core U2','Carrier U2']);
    const nonceEvidence=await Promise.all([pinnedCall(lab.core,'nonceUsed',[pending.nonce-1n]),pinnedCall(lab.core,'nonceUsed',[pending.nonce]),pinnedCall(lab.carrier,'nonceUsed',[1])]);
    assert.deepEqual(nonceEvidence,[true,false,true],'U1 used and pending nonce state survives upgrade');
    assert.deepEqual(after.execution.history.map(e => e.ordinal),['1','2']);
    assert.equal(after.execution.history[1].activationAdmissionHigh,'13');
    assert.equal((await lab.reject(pending,'FixtureRevision')).receipt.status,'0x0');
    const fresh = await lab.prepare(publication([object(903)],13));
    const modified = structuredClone(fresh); modified.publication = publication([object(904)],14);
    await lab.reject(modified,'FixtureAuthorization');
    const accepted = await lab.submit(fresh); assert.equal(accepted.receipt.status,'0x1');
    await lab.reject(fresh,'FixtureNonce');
    const invalidObject=object(905);
    await lab.reject(await lab.prepare(publication([{...invalidObject,body:invalidObject.body+'ff'}],15)),'InvalidBody');
    const wrongType={...revision,body:concat(fileId,rootId,'000a746578742f706c61696e','0100057574662d38','01','0000')};
    await lab.reject(await lab.prepare(publication([wrongType],16)),'E_REF_UNSATISFIED');
    const rebound=binding(charterPurpose,fileId,W(1),fileId);
    rebound.body=rebound.body.slice(0,-2)+concat('01',seven.envelopeId,'0001').slice(2);
    const charterKey=keccak256(concat(domain('efs2/binding/1'),principal,keccak256(concat(domain('efs2/position/1'),charterPurpose,fileId,W(1)))));
    await lab.reject(await lab.prepare(publication([rebound],17,{revisions:[[0,99]]})),'ErrCasRevision',[charterKey,99n,1n]);
    const last = await checked(lab);
    assert.deepEqual(last.counts.slice(0,6),['14','7','17','1','14','7']);
    assert.deepEqual(last.snapshot.batches.map(x => String(BigInt(x.row[0]) >> 112n)),['1','1','1','1','1','1','2']);
    const changed = mutate => { const s = structuredClone(last.snapshot); mutate(s); return verifyUpgradeState(s,lab.expected); };
    for (const [name,mutate] of [
      ['substituted group bytes',s => s.records[0].row[1] += '00'],
      ['valid body with wrong Record ID',s => s.records.find(x=>x.id===fileId).row[1]=rootObject.body],
      ['substituted Record ID',s => s.records[0].id = W(99)],
      ['tampered posting word',s => s.postings[0].words[0] = '0'],
      ['tampered Binding head',s => s.bindings[0].row[0] = '0'],
      ['tampered actual implementation slot',s => s.execution.endpoints.core.implementation = s.execution.history[0].coreImplementation],
      ['tampered actual immutable admin',s => s.execution.endpoints.core.immutableAdmin = s.execution.history[0].carrierAdmin],
      ['tampered actual admin owner',s => s.execution.endpoints.core.owner = lab.core],
      ['tampered proxy runtime',s => s.components.core.code += '00'],
    ]) assert.equal(changed(mutate).outcome,'INVALID',name);
    const missing = changed(s => { s.execution.complete = false; s.execution.history = []; });
    assert.equal(missing.outcome,'UNKNOWN'); assert.equal(missing.rawIntegrity,'VERIFIED');
    assert.equal(changed(s => { delete s.execution; s.records[0].row[1] += '00'; }).outcome,'INVALID');
    assert.equal(changed(s => { s.execution.history.shift(); }).outcome,'UNKNOWN');
    assert.equal(changed(s => { s.execution.history[0].coreCodehash = W(0); s.execution.history[0].id = executionId(s.execution.history[0]); }).outcome,'INVALID');
    const legacy = { ...lab.expected, syntheticBatchAuthority: { authorityBasis: BigInt(lab.operator).toString(), authorityCodehash: last.execution.history.at(-1).coreCodehash } };
    assert.equal(verifyState(last.snapshot,legacy).outcome,'INVALID');
    assert.equal((await readState({ ...lab, expected: legacy })).outcome,'INVALID');
    Object.assign(report,{ groupCosts, rootId,fileId,treeId,revisionId,dirId,sevenLeafGas:written.receipt.gasUsed,sevenLeafRecordIds:seven.recordIds,retainedCounts:before.counts,finalCounts:last.counts,history:last.execution.history,presentationLabels,nonceEvidence,resources:lab.resources,transactions:lab.transactions,cleanup:lab.cleanup,sourceEvidence:last.snapshot.execution,expected:lab.expected,snapshots:{before:before.snapshot,after:after.snapshot,final:last.snapshot},bytes,rootPublication:rootPub,filePublication:seven, snapshotDigest:keccak256(Buffer.from(JSON.stringify(retained(last.snapshot)))) });
  });
  assert(report.cleanup.stopped);
  Object.assign(evidenceReport,report);
  t.diagnostic(JSON.stringify({groupGas:report.groupCosts.map(x=>String(BigInt(x))),sevenLeafGas:String(BigInt(report.sevenLeafGas)),retainedCounts:report.retainedCounts,finalCounts:report.finalCounts,cleanup:report.cleanup}));
});

// Break: block-only history attribution, or failing to capture admission high
// after an earlier U1 transaction in the same block as U2 activation.
test('managed same-block U1 admission and U2 activation use the real high-water', { timeout: 300000 }, async () => {
  compileUpgrade();
  await withUpgrade(async lab => {
    for (const [i,g] of lab.inputs.candidates.groups.slice(0,2).entries()) assert.equal((await lab.publish(publication([groupLeaf(lab.inputs.meta,'0x'+g.groupHex)],i+1))).receipt.status,'0x1');
    const typeId=lab.inputs.candidates.groups[0].members[0].temporaryTypeSchemaId;
    const p=publication([{typeId,body:concat(W(0xffffffffffffn),W(3001),'00')}],3001);
    const before=await lab.prepare(p);
    const upgrade=await lab.upgrade({before});
    const state=await checked(lab);
    assert.equal(state.counts[4],'3');
    assert.equal(state.execution.history[1].activationAdmissionHigh,'3');
    assert.equal(upgrade.beforeReceipt.blockHash,upgrade.receipt.blockHash);
    assert.equal(BigInt(state.snapshot.batches.at(-1).row[0])>>112n,1n);
    assert.equal(verifyUpgradeState(state.snapshot,lab.expected).outcome,'VERIFIED');
    evidenceReport.sameBlock={counts:state.counts,history:state.execution.history,transactions:lab.transactions,basis:state.basis,cleanup:lab.cleanup};
  });
});

// Break: an extension policy silently replacing legacy defaults, or an inflated
// revision count allocating/reading an unbounded history or certifying absence.
test('legacy APIs reject genuine revision-two-only state and history collection is bounded', { timeout: 300000 }, async () => {
  compileUpgrade();
  await withUpgrade(async lab => {
    assert.equal((await lab.upgrade()).receipt.status,'0x1');
    assert.equal((await lab.publish(publication([groupLeaf(lab.inputs.meta,'0x'+lab.inputs.candidates.groups[0].groupHex)],1))).receipt.status,'0x1');
    const state=await checked(lab);
    const legacy={...lab.expected,syntheticBatchAuthority:{authorityBasis:BigInt(lab.operator).toString(),authorityCodehash:state.execution.history[1].coreCodehash}};
    const direct=verifyState(state.snapshot,legacy),collected=await readState({...lab,expected:legacy});
    assert.equal(direct.outcome,'INVALID');assert.match(direct.reason,/synthetic revision/);
    assert.equal(collected.outcome,'INVALID');assert.match(collected.reason,/synthetic revision/);
    let observedBasis;
    const unavailable=await readUpgradeState({...lab,rpc:async(method,...args)=>{if(method==='eth_getCode')throw Error('fixture provider unavailable');return lab.rpc(method,...args);}},{onBasis:basis=>{observedBasis=basis;}});
    assert.equal(unavailable.outcome,'UNKNOWN');assert.equal(unavailable.attemptedBasis?.hash,observedBasis.hash);
    // Source/forge-inspected FixtureDeployment layout: carrierAdmin slot 3,
    // currentRevision at byte offset 20. This is test-only local storage damage.
    await lab.rpc('anvil_setStorageAt',[lab.expected.execution.controller,W(3),W(BigInt(lab.expected.execution.carrierAdmin)|(17n<<160n))]);
    const bounded=await readUpgradeState(lab);
    assert.equal(bounded.outcome,'UNKNOWN');assert.equal(bounded.rawIntegrity,'VERIFIED');assert.match(bounded.reason,/history revision budget/);
    evidenceReport.bounds={outcome:bounded.outcome,rawIntegrity:bounded.rawIntegrity,reason:bounded.reason,legacyOutcome:direct.outcome,legacyReason:direct.reason,cleanup:lab.cleanup};
  });
});

// Break: an exceptional consumer leaving its managed node/automine alive.
test('managed node is stopped and automine restored when consumer throws', { timeout: 300000 }, async () => {
  compileUpgrade();let cleanup;
  await assert.rejects(withUpgrade(async lab=>{cleanup=lab.cleanup;await lab.mine(false);throw Error('intentional consumer failure');}),/intentional consumer failure/);
  assert.equal(cleanup.stopped,true);assert.equal(cleanup.automineRestored,true);
  evidenceReport.exceptionCleanup=cleanup;
});
