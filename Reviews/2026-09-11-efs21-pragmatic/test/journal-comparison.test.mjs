// Offline differential checks of the fresh full-C0 receipts; no Anvil/build.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { keccak256, Transaction } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';

const read = arm => JSON.parse(readFileSync(new URL('../evidence/journal-' + arm + '.json', import.meta.url)));
const control = read('control'), candidate = read('candidate');
const txFor = (report, op) => report.transactions.find(t => t.hash === op.hash);
const kernelPath = '../2026-09-05-c0-core/src/StateKernel.sol';

test('matched logical plans, compiler settings and one production source change', () => {
  assert.equal(control.sourceDiff, '');
  assert(candidate.sourceDiff.includes('uint256[] memory pointers = new uint256[](capacity)'));
  assert.deepEqual(candidate.supportPins, control.supportPins, 'same measurement/fixture runner bytes');
  assert.deepEqual(candidate.resources.compiler, control.resources.compiler);
  assert.deepEqual(candidate.resources.settings, control.resources.settings);
  assert.equal(candidate.resources.compilerBinaryHash, control.resources.compilerBinaryHash);
  const changed = Object.keys(control.resources.sourcePins).filter(p => candidate.resources.sourcePins[p] !== control.resources.sourcePins[p]);
  assert.deepEqual(changed, [kernelPath]);
  assert.equal(keccak256(readFileSync(new URL('../../2026-09-05-c0-core/src/StateKernel.sol', import.meta.url))), candidate.resources.sourcePins[kernelPath], 'current production seam matches candidate evidence');
  for (const [path, hash] of Object.entries(candidate.supportPins)) assert.equal(keccak256(readFileSync(new URL('../' + path, import.meta.url))), hash, 'current support source matches evidence: ' + path);
  assert.deepEqual(candidate.operations.map(x => [x.name,x.category,x.plan]), control.operations.map(x => [x.name,x.category,x.plan]));
});

test('complete canonical kernel inventory is equal except recorded authority codehashes', () => {
  const normalized = report => {
    const value = structuredClone(report.inventory);
    // Batch authorityCodehash names the then-active Core implementation. It is
    // executable provenance, not a Type/Record/Binding semantic field. Check
    // each raw value against a retained runtime before excluding it.
    const hashes = new Set(Object.values(report.runtimes).map(x => x.hash));
    for (const batch of value.batches) { assert(hashes.has(batch[2])); batch[2] = 'PINNED_AUTHORITY_CODEHASH'; }
    return value;
  };
  assert.deepEqual(normalized(candidate), normalized(control));
  assert.equal(control.inventory.records.length, 80);
  assert.equal(control.inventory.occurrences.length, 84);
  assert.equal(control.inventory.bindings.length, 22);
  assert.equal(control.inventory.postings.length, 257);
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
    assert.equal(txFor(report,partial).transaction.from.toLowerCase(), '0x' + BigInt(report.inventory.batches.at(-1)[1]).toString(16).padStart(40,'0'), 'actual author transaction');
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
    assert.equal(report.transactions.length,90);
    for (const tx of report.transactions) {
      assert.equal(keccak256(tx.raw),tx.hash);
      const parsed = Transaction.from(tx.raw);
      assert.equal(parsed.data,tx.transaction.input);
      assert.equal(parsed.from.toLowerCase(),tx.transaction.from.toLowerCase());
      assert.equal(tx.receipt.transactionHash,tx.hash);
      assert(BigInt(tx.receipt.gasUsed) <= 16777216n);
      assert.equal(tx.calldata.bytes,tx.calldata.zeroBytes+tx.calldata.nonzeroBytes);
    }
  }
});

test('allocation savings are actual matched operation receipts, with intrinsic differences retained', () => {
  const pairs = control.operations.map((op,i) => {
    const before = txFor(control,op), after = txFor(candidate,candidate.operations[i]);
    assert.equal(before.receipt.status,after.receipt.status);
    assert.equal(before.calldata.bytes,after.calldata.bytes);
    if (['tag-first','tag-steady','binding-rebind','create-7-leaf-41B','edit-3-leaf-41B','mixed-ACTIVE-fresh'].includes(op.name)) assert(BigInt(after.receipt.gasUsed) < BigInt(before.receipt.gasUsed),op.name);
    return { name: op.name, control: Number(BigInt(before.receipt.gasUsed)), candidate: Number(BigInt(after.receipt.gasUsed)), intrinsicDelta: after.calldata.intrinsicGas-before.calldata.intrinsicGas };
  });
  console.log(JSON.stringify(pairs));
});
