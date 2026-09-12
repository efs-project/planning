// Offline differential checks of the fresh full-C0 receipts; no Anvil/build.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { keccak256, Transaction } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';

const read = arm => JSON.parse(readFileSync(new URL('../evidence/direct-apply-' + arm + '.json', import.meta.url)));
const control = read('control'), candidate = read('candidate');
const txFor = (report, op) => report.transactions.find(t => t.hash === op.hash);
const kernelPath = '../2026-09-05-c0-core/src/StateKernel.sol';

test('matched logical plans, compiler settings and only the two owned production source changes', () => {
  assert.equal(control.sourceDiff, '');
  assert.deepEqual(candidate.supportPins, control.supportPins, 'same measurement/fixture runner bytes');
  assert.deepEqual(candidate.resources.supportSourcePins, control.resources.supportSourcePins);
  assert.deepEqual(candidate.resources.compiler, control.resources.compiler);
  assert.deepEqual(candidate.resources.settings, control.resources.settings);
  assert.equal(candidate.resources.compilerBinaryHash, control.resources.compilerBinaryHash);
  const changed = Object.keys(control.resources.sourcePins).filter(p => candidate.resources.sourcePins[p] !== control.resources.sourcePins[p]);
  const storePath = "../2026-09-05-c0-core/src/StateStore.sol";
  assert.deepEqual(changed.sort(), [kernelPath,storePath].sort());
  for(const p of [kernelPath,storePath]) assert.equal(keccak256(readFileSync(new URL("../"+p,import.meta.url))),candidate.resources.sourcePins[p]);
  assert.equal(keccak256(readFileSync(new URL('../../2026-09-05-c0-core/src/StateKernel.sol', import.meta.url))), candidate.resources.sourcePins[kernelPath], 'current production seam matches candidate evidence');
  for (const [path, hash] of Object.entries(candidate.supportPins)) assert.equal(keccak256(readFileSync(new URL('../' + path, import.meta.url))), hash, 'current support source matches evidence: ' + path);
  assert.deepEqual(candidate.operations.map(x => [x.name,x.category,x.plan]), control.operations.map(x => [x.name,x.category,x.plan]));
});

function normalizedInventory(report) {
  const value = structuredClone(report.inventory);
  // StateKernel packs VerifiedContext.revisionOrdinal (uint32) at bit 112.
  // Both fixture hosts supply that revision's e.coreCodehash. This workload
  // upgrades the initial read Core to CoreU3 at execution-set revision TWO;
  // U3 is an implementation name, not the persisted revision ordinal.
  const coreByRevision = new Map([
    [1n, report.runtimes.UpgradeableReadFixtureCore.hash],
    [2n, report.runtimes.UpgradeableFixtureCoreU3.hash],
  ]);
  for (const batch of value.batches) {
    const revision = (BigInt(batch[0]) >> 112n) & 0xffffffffn;
    assert(coreByRevision.has(revision), 'known retained Core for Batch revision');
    assert.equal(batch[2], coreByRevision.get(revision), 'Batch authorityCodehash must match revision Core');
    batch[2] = 'PINNED_AUTHORITY_CODEHASH';
  }
  return value;
}

test('complete canonical kernel inventory is equal except recorded authority codehashes', () => {
  assert.deepEqual(normalizedInventory(candidate), normalizedInventory(control));
  assert.equal(control.inventory.records.length, 82);
  assert.equal(control.inventory.occurrences.length, 87);
  assert.equal(control.inventory.bindings.length, 22);
  assert.equal(control.inventory.postings.length, 259);
  for (const report of [control,candidate]) {
    const revisions = report.inventory.batches.map(b => (BigInt(b[0]) >> 112n) & 0xffffffffn);
    assert.equal(revisions.filter(r => r === 1n).length,56);
    assert.equal(revisions.filter(r => r === 2n).length,9);
  }
});

test('inventory normalization rejects a retained runtime that is not the revision Core', () => {
  for (const report of [control,candidate]) {
    for (const revision of [1n,2n]) {
      for (const component of ['PreparationHelper', revision === 1n ? 'UpgradeableFixtureCoreU3' : 'UpgradeableReadFixtureCore']) {
        const forged = structuredClone(report);
        const batch = forged.inventory.batches.find(b => ((BigInt(b[0]) >> 112n) & 0xffffffffn) === revision);
        assert(batch, 'negative fixture has a Batch at the intended revision');
        const wrongHash = report.runtimes[component].hash;
        assert.notEqual(batch[2],wrongHash,'wrong hash must differ from the actual Core');
        batch[2] = wrongHash;
        assert.throws(() => normalizedInventory(forged), /Batch authorityCodehash must match revision Core/);
      }
    }
  }
});

test('receipt-basis records, occurrences, bindings, history and Lens decisions agree', () => {
  function normalized(report, op) {
    const result = structuredClone(op.observed), tx = txFor(report, op);
    for (const b of result.bindings) {
      assert.equal(b.head[1], report.identity.execution.executionSetId);
      assert.equal(b.lens[0][8][0], report.identity.execution.executionSetId);
      assert.equal(BigInt(b.lens[0][8][1]), BigInt(tx.receipt.blockNumber));
      b.head[1] = 'PINNED_EXECUTION_SET'; b.lens[0][8][0] = 'PINNED_EXECUTION_SET';
      // Paired fresh worlds use identical transaction prefixes: even block
      // numbers remain equal. No temporal or semantic normalization needed.
    }
    return result;
  }
  for (let i = 0; i < control.operations.length; i++) assert.deepEqual(normalized(candidate,candidate.operations[i]), normalized(control,control.operations[i]), control.operations[i].name);
});

test('ACTIVE retry branch preserves admission state, consumes fresh authorization, and retains rejection', () => {
  for (const report of [control,candidate]) {
    const partial = report.operations.find(o => o.name === 'partial-direct-author');
    const mixed = report.operations.find(o => o.name === 'mixed-ACTIVE-fresh');
    const exact = report.operations.find(o => o.name === 'exact-ACTIVE-retry');
    const rejected = report.operations.find(o => o.name === 'old-signature-rejected');
    assert.equal(txFor(report,partial).transaction.from.toLowerCase(), '0x' + BigInt(report.inventory.batches.find(b=>BigInt(b[0]) % (1n<<48n) === BigInt(mixed.observed.counts[4]))[1]).toString(16).padStart(40,'0'), 'actual author transaction');
    assert.equal(partial.plan.publication.envelopeId,mixed.plan.publication.envelopeId);
    assert.deepEqual(partial.plan.publication.recordIds,mixed.plan.publication.recordIds);
    assert.equal(partial.plan.publication.leafMask,'1');
    assert.equal(mixed.plan.publication.leafMask,'3');
    assert.deepEqual(mixed.plan,exact.plan);
    assert.equal(BigInt(mixed.observed.counts[4]),BigInt(partial.observed.counts[4])+1n,'one fresh admission only');
    assert.deepEqual(exact.observed.counts,mixed.observed.counts);
    assert.equal(BigInt(exact.observed.principalNonce),BigInt(mixed.observed.principalNonce)+1n);
    assert.deepEqual(rejected.observed.counts,exact.observed.counts);
    assert.equal(rejected.observed.principalNonce,exact.observed.principalNonce);
    assert.equal(txFor(report,rejected).receipt.status,'0x0');
    assert(txFor(report,rejected).receipt.gasUsed !== '0x0');
  }
});

test('all receipt/raw transaction/calldata pins and ordinary runtime/gas ceilings hold', () => {
  for (const report of [control,candidate]) {
    assert(!report.resources.nodeArgs.includes('--steps-tracing'));
    assert(!report.resources.nodeArgs.includes('--disable-code-size-limit'));
    assert(!existsSync(report.cleanup.cachePath), 'owned Anvil cache actually removed after report snapshot');
    for (const [name,r] of Object.entries(report.runtimes)) assert(r.bytes <= 24576, name);
    assert.equal(report.transactions.length,95);
    assert.equal(report.cleanup.stopped,true); assert.equal(report.cleanup.cacheRemoved,true);
    assert.equal(report.buildCleanup.removed,true); assert(!existsSync(report.buildCleanup.path));
    for (const tx of report.transactions) {
      assert.equal(keccak256(tx.raw),tx.hash);
      const parsed = Transaction.from(tx.raw);
      assert.equal(parsed.data,tx.transaction.input);
      assert.equal(parsed.from.toLowerCase(),tx.transaction.from.toLowerCase());
      assert.equal(tx.receipt.transactionHash,tx.hash);
      assert.equal(tx.transaction.blockHash,tx.receipt.blockHash);
      assert.equal(tx.transaction.blockNumber,tx.receipt.blockNumber);
      assert.equal(tx.transaction.transactionIndex,tx.receipt.transactionIndex);
      assert.equal(parsed.gasLimit,BigInt(tx.transaction.gas));
      assert(BigInt(tx.receipt.gasUsed) <= 16777216n);
      assert.equal(tx.calldata.bytes,tx.calldata.zeroBytes+tx.calldata.nonzeroBytes);
    }
  }
});

test('actual matched receipts retain intrinsic differences without assuming savings', () => {
  const pairs = control.operations.map((op,i) => {
    const before = txFor(control,op), after = txFor(candidate,candidate.operations[i]);
    assert.equal(before.receipt.status,after.receipt.status);
    assert.equal(before.calldata.bytes,after.calldata.bytes);
    return { name: op.name, control: Number(BigInt(before.receipt.gasUsed)), candidate: Number(BigInt(after.receipt.gasUsed)), intrinsicDelta: after.calldata.intrinsicGas-before.calldata.intrinsicGas };
  });
  console.log(JSON.stringify(pairs));
});

test('successful Type groups preserve cache pointers, bytes, CREATE order and nonce', () => {
  const multi = report => report.operations.find(o=>o.name==='multiple-Type-groups').observed.cacheState;
  const reuse = report => report.operations.find(o=>o.name==='existing-Types-fresh-envelope').observed.cacheState;
  assert.deepEqual(multi(candidate),multi(control));
  for (const report of [control,candidate]) {
    assert.deepEqual(reuse(report),multi(report),'existing Type group must not redeploy caches');
    assert.equal(BigInt(multi(report).helperNonce),BigInt(multi(report).caches.length)+1n);
  }
});
test('compound failure order is exactly allowlisted, with Core/authorization/cache rollback', () => {
  assert.deepEqual(candidate.cacheCases.map(c=>c.fault),['late-reference','cache-then-reference','cache-then-CAS']);
  for (let i=0;i<3;i++) {
    const before=control.cacheCases[i], after=candidate.cacheCases[i];
    assert.deepEqual(after.compiled,before.compiled);
    assert.equal(before.error,before.expectedLaterError);
    assert.equal(after.error,i===0 ? before.expectedLaterError : keccak256(Buffer.from('HelperDeploy()')).slice(0,10));
    for (const c of [before,after]) {
      assert.deepEqual(c.before,c.after);
      assert.deepEqual(c.codeBefore,c.codeAfter);
      assert(c.codeAfter.every(x=>x==='0x'));
      if (i!==0) assert.equal((c.compiled.caches[1].length-2)/2,24960,'known large-Type limit remains');
    }
  }
});
