import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AbiCoder, Interface, keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { HEADER, readState } from '../reference/state-reader.mjs';
import {
  ROOT,
  TX_GAS,
  compileStateful,
  groupLeaf,
  publication,
  withStateful,
} from '../scripts/local-stateful.mjs';

const abi = AbiCoder.defaultAbiCoder();
const byteLength = value => (value.length - 2) / 2;
const word = value => '0x' + BigInt(value).toString(16).padStart(64, '0');
const concat = (...values) => '0x' + values.map(value => value.replace(/^0x/, '')).join('');

function artifact(name) {
  return JSON.parse(readFileSync(join(ROOT, 'out', name + '.sol', name + '.json'), 'utf8'));
}

function patch(template, references, values) {
  let code = template.replace(/^0x/, '');
  for (const [name, positions] of Object.entries(references ?? {})) {
    assert(values[name], 'unknown artifact patch ' + name);
    for (const position of positions) {
      const value = values[name].replace(/^0x/, '').padStart(position.length * 2, '0');
      assert.equal(value.length, position.length * 2, 'exact artifact patch width');
      assert(position.start >= 0 && (position.start + position.length) * 2 <= code.length, 'artifact patch bounds');
      code = code.slice(0, position.start * 2) + value + code.slice((position.start + position.length) * 2);
    }
  }
  assert(!code.includes('_'), 'unresolved artifact link');
  return '0x' + code;
}

function patchLinks(bytecode, libraryAddress) {
  const references = {};
  for (const [file, libraries] of Object.entries(bytecode.linkReferences ?? {})) {
    assert.equal(file, 'src/AdmissionLibrary.sol', 'only fixed admission library link');
    for (const [name, positions] of Object.entries(libraries)) {
      assert.equal(name, 'AdmissionLibrary');
      references[name] = positions;
    }
  }
  return patch(bytecode.object, references, { AdmissionLibrary: libraryAddress });
}

function lifecycleFor(state, entry) {
  const life = state.fold.lifecycle.get(entry.envelopeId + ':' + entry.leaf);
  assert(life, 'independently reconstructed lifecycle');
  return life;
}

function envelopeHeader(state, envelopeId) {
  const row = state.snapshot.envelopes.find(item => item.id === envelopeId)?.row;
  assert(row, 'retained Envelope row');
  return abi.decode([HEADER, 'bytes32[]'], row[0])[0];
}

function expectedOccurrence(state, entry) {
  const life = lifecycleFor(state, entry);
  return [BigInt(life.status), entry.ordinal, entry.recordId, entry.typeId, entry.principal, life.withdrawal];
}

function expectedByOrdinal(state, entry) {
  const [status, , recordId, typeId, principal, withdrawal] = expectedOccurrence(state, entry);
  return [entry.envelopeId, BigInt(entry.leaf), recordId, typeId, principal, status, withdrawal];
}

function expectedReceipt(state, entry) {
  const life = lifecycleFor(state, entry);
  const batch = state.batchByOrdinal.get(entry.ordinal);
  assert(batch, 'independently reconstructed accepting batch');
  const row = state.snapshot.batches[Number(batch.batch - 1n)]?.row;
  assert(row, 'retained accepting-batch row');
  const header = envelopeHeader(state, entry.envelopeId);
  return [
    entry.envelopeId,
    BigInt(entry.leaf),
    state.snapshot.bootstrap[0],
    state.snapshot.bootstrap[1],
    BigInt(row[1]),
    row[2],
    BigInt(header.authEpoch),
    entry.ordinal,
    batch.block,
    1n,
    BigInt(life.status),
    life.withdrawal,
  ];
}

test('normal occurrence host matches independently reconstructed current occurrences and original receipts', { timeout: 240000 }, async t => {
  compileStateful();
  const report = {};
  await withStateful(async lab => {
    const occurrenceArtifact = artifact('OccurrenceReadHarness');
    const inheritedImmutableNames = Object.entries(lab.resources.deployment.core.immutables)
      .sort(([a], [b]) => Number(BigInt(a) - BigInt(b)))
      .map(([, name]) => name);
    const immutableIds = Object.keys(occurrenceArtifact.deployedBytecode.immutableReferences)
      .sort((a, b) => Number(BigInt(a) - BigInt(b)));
    assert.equal(immutableIds.length, inheritedImmutableNames.length, 'inherited immutable inventory');
    const immutableNames = Object.fromEntries(immutableIds.map((id, index) => [id, inheritedImmutableNames[index]]));
    const immutableValues = Object.fromEntries(
      Object.entries(immutableNames).map(([id, name]) => [id, lab.expected.getters[name]]),
    );
    const libraryAddress = lab.expected.components.library.address;
    const linkedRuntime = patchLinks(occurrenceArtifact.deployedBytecode, libraryAddress);
    const expectedRuntime = patch(
      linkedRuntime,
      occurrenceArtifact.deployedBytecode.immutableReferences,
      immutableValues,
    );
    assert(byteLength(expectedRuntime) <= 24576, 'occurrence host EIP-170 ceiling');

    const constructor = abi.encode(
      [
        'tuple(bytes32 realmId,bytes32 initialRevisionId,bytes intrinsicGroupBytes,bytes objectGroup1Bytes,bytes kernelGroup2Bytes)',
        'address',
        'bytes32',
        'bytes32',
      ],
      [
        lab.inputs.init,
        lab.expected.getters.preparationHelper,
        lab.expected.getters.preparationCodehash,
        lab.expected.getters.admissionCodehash,
      ],
    );
    const linkedCreation = patchLinks(occurrenceArtifact.bytecode, libraryAddress);
    const creation = linkedCreation + constructor.slice(2);
    assert(byteLength(creation) <= 49152, 'occurrence host initcode ceiling');
    const deployment = await lab.send(creation);
    const deploymentReceipt = await lab.receipt(deployment);
    assert.equal(deploymentReceipt.status, '0x1', 'normal occurrence host deployment');
    assert(BigInt(deploymentReceipt.gasUsed) <= TX_GAS, 'occurrence deployment transaction ceiling');
    const host = deploymentReceipt.contractAddress;
    const runtime = await lab.rpc('eth_getCode', [host, deploymentReceipt.blockNumber]);
    assert.equal(runtime, expectedRuntime, 'actual occurrence runtime matches exact artifact');
    const iface = new Interface(occurrenceArtifact.abi);

    const expected = {
      ...lab.expected,
      core: host,
      components: {
        ...lab.expected.components,
        core: { address: host, code: runtime },
      },
      getters: { ...lab.expected.getters },
    };
    assert.deepEqual(expected.components.helper, lab.expected.components.helper, 'retained independently checked helper');
    assert.deepEqual(expected.components.library, lab.expected.components.library, 'retained independently checked library');
    const readerLab = { ...lab, core: host, iface, expected };
    const callRaw = async (name, args, blockPin) => {
      const data = iface.encodeFunctionData(name, args);
      return lab.rpc('eth_call', [{ to: host, data, gas: '0x1000000' }, blockPin]);
    };
    const call = async (name, args, blockPin) =>
      iface.decodeFunctionResult(name, await callRaw(name, args, blockPin));
    const hostPublish = async p => {
      const data = iface.encodeFunctionData('publishTrustedForTest', [lab.context(p.header.principalId), p]);
      const transaction = await lab.send(data, host);
      const receipt = await lab.receipt(transaction);
      assert.equal(receipt.status, '0x1', 'bounded occurrence-host admission');
      assert(BigInt(receipt.gasUsed) <= TX_GAS, 'occurrence-host admission transaction ceiling');
      return { transaction, receipt };
    };

    const groups = lab.inputs.candidates.groups;
    await hostPublish(publication([groupLeaf(lab.inputs.meta, '0x' + groups[0].groupHex)], 700));
    await hostPublish(publication([groupLeaf(lab.inputs.meta, '0x' + groups[1].groupHex)], 701));
    const pairLeaves = [
      groupLeaf(lab.inputs.meta, '0x' + groups[2].groupHex),
      groupLeaf(lab.inputs.meta, '0x' + groups[3].groupHex),
    ];
    const partial = publication(pairLeaves, 702, { selected: [0] });
    await hostPublish(partial);
    const mixed = publication(pairLeaves, 702, { selected: [0, 1] });
    await hostPublish(mixed);
    const retry = await hostPublish(mixed);
    assert.equal((await call('counts', [], retry.receipt.blockNumber))[0].batches, 4n, 'all-reused creates no batch');

    const sparseLeaves = Array.from({ length: 64 }, (_, index) => ({
      typeId: lab.inputs.meta,
      body: index === 63 ? pairLeaves[1].body : '0x' + (index + 1).toString(16).padStart(4, '0'),
    }));
    const sparse = publication(sparseLeaves, 703, { selected: [63] });
    assert.equal(sparse.recordIds[63], mixed.recordIds[1], 'same Record retained across Envelopes');
    const sparseResult = await hostPublish(sparse);
    const beforeState = await readState(readerLab, { blockTag: sparseResult.receipt.blockNumber });
    assert.equal(beforeState.outcome, 'VERIFIED', beforeState.reason ?? 'independent pre-withdraw state');
    assert.deepEqual(beforeState.counts.slice(4, 6), ['5', '5'], 'fresh/mixed/retry/sparse inventory');
    const beforePin = { blockHash: beforeState.basis.hash, requireCanonical: true };

    let representative = null;
    for (const entry of beforeState.entries) {
      const occurrenceRaw = await callRaw('getOccurrence', [entry.envelopeId, entry.leaf], beforePin);
      const byOrdinalRaw = await callRaw('getOccurrenceByOrdinal', [entry.ordinal], beforePin);
      const receiptRaw = await callRaw('getReceipt', [entry.ordinal], beforePin);
      const occurrence = iface.decodeFunctionResult('getOccurrence', occurrenceRaw);
      const byOrdinal = iface.decodeFunctionResult('getOccurrenceByOrdinal', byOrdinalRaw);
      const receipt = iface.decodeFunctionResult('getReceipt', receiptRaw);
      assert.deepEqual([...occurrence], expectedOccurrence(beforeState, entry), 'pair fields from same-pin snapshot');
      assert.deepEqual([...byOrdinal], expectedByOrdinal(beforeState, entry), 'ordinal fields from same-pin snapshot');
      assert.deepEqual([...receipt[0]], expectedReceipt(beforeState, entry), 'receipt fields from retained batch');
      assert.equal(byteLength(occurrenceRaw), 192, 'exact occurrence returndata');
      assert.equal(byteLength(byOrdinalRaw), 224, 'exact ordinal returndata');
      assert.equal(byteLength(receiptRaw), 384, 'exact receipt returndata');
      if (entry.ordinal === 4n) representative = { entry, occurrenceRaw, byOrdinalRaw, receiptRaw, receipt: [...receipt[0]] };
    }
    assert(representative, 'representative mixed fresh admission');
    const neverSelected = await call('getOccurrence', [sparse.envelopeId, 0], beforePin);
    assert.deepEqual([...neverSelected], [0n, 0n, word(0), word(0), word(0), 0n], 'known unselected whole zero');

    const withdrawalType = groups.flatMap(group => group.members)
      .find(member => member.descriptor.name === 'Withdrawal/1').temporaryTypeSchemaId;
    const withdrawal = publication([
      { typeId: withdrawalType, body: concat(mixed.envelopeId, '0001') },
    ], 704);
    const withdrawalResult = await hostPublish(withdrawal);
    const afterState = await readState(readerLab, { blockTag: withdrawalResult.receipt.blockNumber });
    assert.equal(afterState.outcome, 'VERIFIED', afterState.reason ?? 'independent post-withdraw state');
    const afterPin = { blockHash: afterState.basis.hash, requireCanonical: true };
    for (const entry of afterState.entries) {
      const occurrence = await call('getOccurrence', [entry.envelopeId, entry.leaf], afterPin);
      const byOrdinal = await call('getOccurrenceByOrdinal', [entry.ordinal], afterPin);
      const receipt = await call('getReceipt', [entry.ordinal], afterPin);
      assert.deepEqual([...occurrence], expectedOccurrence(afterState, entry), 'post-withdraw pair fields');
      assert.deepEqual([...byOrdinal], expectedByOrdinal(afterState, entry), 'post-withdraw ordinal fields');
      assert.deepEqual([...receipt[0]], expectedReceipt(afterState, entry), 'post-withdraw receipt fields');
    }
    const target = afterState.entries.find(entry => entry.ordinal === 4n);
    assert(target, 'withdrawn original admission');
    const retainedReceiptRaw = await callRaw('getReceipt', [4n], afterPin);
    const retainedReceipt = [...iface.decodeFunctionResult('getReceipt', retainedReceiptRaw)[0]];
    assert.deepEqual(retainedReceipt, expectedReceipt(afterState, target), 'post-withdraw receipt from new pin');
    assert.deepEqual(retainedReceipt.slice(0, 10), representative.receipt.slice(0, 10), 'immutable receipt fields retained');
    assert.deepEqual(retainedReceipt.slice(10), [2n, 6n], 'current lifecycle updated separately');

    const occurrenceData = iface.encodeFunctionData('getOccurrence', [target.envelopeId, target.leaf]);
    const receiptData = iface.encodeFunctionData('getReceipt', [target.ordinal]);
    const occurrenceGas = BigInt(await lab.rpc('eth_estimateGas', [{ to: host, data: occurrenceData }]));
    const receiptGas = BigInt(await lab.rpc('eth_estimateGas', [{ to: host, data: receiptData }]));
    assert(occurrenceGas <= TX_GAS && receiptGas <= TX_GAS, 'getter transaction gas ceiling');

    report.resources = {
      source: lab.expected.source,
      sourceBlocks: { before: beforeState.basis, after: afterState.basis },
      compiler: occurrenceArtifact.metadata.compiler,
      settings: occurrenceArtifact.metadata.settings,
      sourcePins: occurrenceArtifact.metadata.sources,
      txGasCeiling: TX_GAS.toString(),
      dependencies: {
        helper: lab.resources.deployment.helper,
        library: lab.resources.deployment.library,
      },
      occurrenceHost: {
        runtimeBytes: byteLength(runtime),
        initcodeBytes: byteLength(creation),
        deploymentGas: BigInt(deploymentReceipt.gasUsed).toString(),
        links: occurrenceArtifact.bytecode.linkReferences,
        immutables: immutableNames,
      },
      cleanup: lab.cleanup,
    };
    report.measurement = {
      occurrenceGas: occurrenceGas.toString(),
      receiptGas: receiptGas.toString(),
      occurrenceReturndataBytes: byteLength(representative.occurrenceRaw),
      ordinalReturndataBytes: byteLength(representative.byOrdinalRaw),
      receiptReturndataBytes: byteLength(representative.receiptRaw),
    };
    report.boundary = 'unauthenticated test-host component evidence; not full initialized C0 authority';
  });
  assert(report.resources.cleanup.stopped, 'managed Anvil stopped');
  t.diagnostic(JSON.stringify(report));
});
