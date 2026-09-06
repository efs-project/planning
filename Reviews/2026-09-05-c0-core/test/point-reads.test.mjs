import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AbiCoder, Interface, keccak256, ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { parseGroup } from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
import { verifyCache } from '../../2026-09-05-c0-admission/reader.mjs';
import { ordinaryEnvelope, ordinaryRecord } from '../reference/state-reader.mjs';
import {
  ROOT,
  TX_GAS,
  compileStateful,
  groupLeaf,
  publication,
  withStateful,
} from '../scripts/local-stateful.mjs';

const abi = AbiCoder.defaultAbiCoder();
const bytes = value => Buffer.from(value.replace(/^0x/, ''), 'hex');
const byteLength = value => (value.length - 2) / 2;
const word = value => '0x' + BigInt(value).toString(16).padStart(64, '0');

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

function rawBlobs(groupBytes) {
  const source = Buffer.from(groupBytes);
  assert(source.length >= 4, 'bounded group framing');
  const count = source.readUInt16BE(0);
  const out = [];
  let position = 2;
  for (let i = 0; i < count; i++) {
    assert(position + 2 <= source.length, 'member length in range');
    const length = source.readUInt16BE(position);
    position += 2;
    assert(length > 0 && position + length <= source.length, 'positive member in range');
    out.push(source.subarray(position, position + length));
    position += length;
  }
  assert.equal(position, source.length, 'exact group end');
  return out;
}

test('normal point-read host returns independently verified retained bytes at one pinned source', { timeout: 240000 }, async t => {
  compileStateful();
  const report = {};
  await withStateful(async lab => {
    const pointArtifact = artifact('PointReadHarness');
    const baseImmutableNames = lab.resources.deployment.core.immutables;
    const pointImmutableIds = Object.keys(pointArtifact.deployedBytecode.immutableReferences)
      .sort((a, b) => Number(BigInt(a) - BigInt(b)));
    const inheritedNames = Object.entries(baseImmutableNames)
      .sort(([a], [b]) => Number(BigInt(a) - BigInt(b)))
      .map(([, name]) => name);
    assert.equal(pointImmutableIds.length, inheritedNames.length, 'inherited immutable inventory');
    const immutableNames = Object.fromEntries(pointImmutableIds.map((id, index) => [id, inheritedNames[index]]));
    const immutableValues = {};
    for (const [id, name] of Object.entries(immutableNames)) immutableValues[id] = lab.expected.getters[name];
    const libraryAddress = lab.expected.components.library.address;
    const linkedRuntime = patchLinks(pointArtifact.deployedBytecode, libraryAddress);
    const expectedRuntime = patch(linkedRuntime, pointArtifact.deployedBytecode.immutableReferences, immutableValues);
    assert(byteLength(expectedRuntime) <= 24576, 'point host EIP-170 ceiling');

    const constructor = abi.encode(
      ['tuple(bytes32 realmId,bytes32 initialRevisionId,bytes intrinsicGroupBytes,bytes objectGroup1Bytes,bytes kernelGroup2Bytes)', 'address', 'bytes32', 'bytes32'],
      [lab.inputs.init, lab.expected.getters.preparationHelper, lab.expected.getters.preparationCodehash, lab.expected.getters.admissionCodehash],
    );
    const linkedCreation = patchLinks(pointArtifact.bytecode, libraryAddress);
    const creation = linkedCreation + constructor.slice(2);
    assert(byteLength(creation) <= 49152, 'point host initcode ceiling');
    const deployment = await lab.send(creation);
    const deploymentReceipt = await lab.receipt(deployment);
    assert.equal(deploymentReceipt.status, '0x1', 'normal point host deployment');
    assert(BigInt(deploymentReceipt.gasUsed) <= TX_GAS, 'point deployment transaction ceiling');
    const point = deploymentReceipt.contractAddress;
    const runtime = await lab.rpc('eth_getCode', [point, deploymentReceipt.blockNumber]);
    assert.equal(runtime, expectedRuntime, 'actual point runtime matches exact artifact');
    const iface = new Interface(pointArtifact.abi);

    const callRaw = async (name, args = [], blockTag = 'latest') => {
      const data = iface.encodeFunctionData(name, args);
      return lab.rpc('eth_call', [{ to: point, data, gas: '0x1000000' }, blockTag]);
    };
    const call = async (name, args = [], blockTag = 'latest') =>
      iface.decodeFunctionResult(name, await callRaw(name, args, blockTag));
    const pointPublish = async p => {
      const data = iface.encodeFunctionData('publishTrustedForTest', [lab.context(p.header.principalId), p]);
      const transaction = await lab.send(data, point);
      const receipt = await lab.receipt(transaction);
      assert.equal(receipt.status, '0x1', 'bounded point-host admission');
      assert(BigInt(receipt.gasUsed) <= TX_GAS, 'point-host admission transaction ceiling');
      return { transaction, receipt };
    };

    const publications = [];
    for (const [index, group] of lab.inputs.candidates.groups.entries()) {
      const p = publication([groupLeaf(lab.inputs.meta, '0x' + group.groupHex)], 700 + index);
      const result = await pointPublish(p);
      publications.push({ p, ...result });
    }
    const blockTag = publications.at(-1).receipt.blockNumber;
    const block = await lab.rpc('eth_getBlockByNumber', [blockTag, false]);
    assert(block?.hash, 'pinned source block');

    const [intrinsicRaw] = await call('intrinsicTypeGroupBytes', [], blockTag);
    assert.equal(intrinsicRaw, lab.inputs.init.intrinsicGroupBytes, 'intrinsic group original bytes');
    const intrinsicParsed = parseGroup(bytes(intrinsicRaw));
    assert.deepEqual(intrinsicParsed.ids, [lab.inputs.meta], 'independent intrinsic identity');
    const intrinsicBlobs = rawBlobs(bytes(intrinsicRaw));
    const intrinsicSchema = await call('getTypeSchema', [lab.inputs.meta], blockTag);
    assert.equal(intrinsicSchema[0], '0x' + intrinsicBlobs[0].toString('hex'));
    assert.deepEqual(
      [intrinsicSchema[1], intrinsicSchema[2], intrinsicSchema[3], intrinsicSchema[4]],
      [1n, 0n, 0n, 0n],
      'intrinsic public metadata',
    );
    const intrinsicOrigin = await call('getTypeOrigin', [lab.inputs.meta], blockTag);
    assert.deepEqual([intrinsicOrigin[0], intrinsicOrigin[1], intrinsicOrigin[2]], [ZeroHash, 0n, true]);

    const knownTypes = [lab.inputs.meta];
    let expectedOrdinal = 2n;
    for (const [groupIndex, item] of publications.entries()) {
      const recordResult = await call('getRecord', [item.p.recordIds[0]], blockTag);
      const body = bytes(recordResult[1]);
      assert.equal(recordResult[0], lab.inputs.meta, 'group Record Type');
      assert.equal(recordResult[2], BigInt(groupIndex + 1), 'group first admission');
      assert.equal(body.readUInt16BE(0), body.length - 2, 'returned Record BYTES prefix');
      assert.equal(ordinaryRecord(recordResult[0], recordResult[1]), item.p.recordIds[0], 'independent Record identity');
      const returnedGroup = body.subarray(2);
      const expectedIds = lab.inputs.candidates.groups[groupIndex].members.map(member => member.temporaryTypeSchemaId);
      const parsed = parseGroup(returnedGroup, { knownTypes, expectedIds });
      const blobs = rawBlobs(returnedGroup);
      for (let memberIndex = 0; memberIndex < parsed.ids.length; memberIndex++) {
        const typeId = parsed.ids[memberIndex];
        const schema = await call('getTypeSchema', [typeId], blockTag);
        assert.equal(schema[0], '0x' + blobs[memberIndex].toString('hex'), 'selected original Type blob');
        assert.equal(schema[1], expectedOrdinal++, 'Type ordinal');
        assert.equal(schema[2], BigInt(groupIndex + 1), 'Type admission ordinal');
        assert.equal(schema[3], BigInt(parsed.members[memberIndex].roles.length), 'role count');
        assert.equal(schema[4], BigInt(parsed.members[memberIndex].indexes.length), 'index count');
        const origin = await call('getTypeOrigin', [typeId], blockTag);
        assert.deepEqual(
          [origin[0], origin[1], origin[2]],
          [item.p.recordIds[0], BigInt(memberIndex), false],
          'Type source join',
        );
        const row = (await call('typeRow', [typeId], blockTag))[0];
        verifyCache(
          { ordinal: row.typeOrdinal, cacheBytes: row.cacheBytes },
          parsed.members[memberIndex],
          typeId,
          parsed.ids,
          blobs[memberIndex],
        );
        knownTypes.push(typeId);
      }
      const envelope = await call('getEnvelope', [item.p.envelopeId], blockTag);
      const expectedUnsigned = abi.encode(
        ['tuple(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter)', 'bytes32[]'],
        [item.p.header, item.p.recordIds],
      );
      assert.equal(envelope[0], expectedUnsigned, 'exact unsigned Envelope');
      assert.deepEqual(
        [envelope[1], envelope[2], envelope[3], envelope[4]],
        [BigInt(groupIndex + 1), 1n, item.p.header.principalId, 0n],
        'Envelope projected fields',
      );
      assert.equal(ordinaryEnvelope(item.p.header, item.p.recordIds), item.p.envelopeId, 'independent Envelope identity');
    }
    assert.equal(knownTypes.length, 17, 'intrinsic plus all sixteen candidate Types');

    const unknownType = await call('getTypeSchema', [keccak256(Buffer.from('unknown-Type'))], blockTag);
    assert.deepEqual([...unknownType], ['0x', 0n, 0n, 0n, 0n], 'unknown Type sentinel');
    const unknownRecord = await call('getRecord', [keccak256(Buffer.from('unknown-Record'))], blockTag);
    assert.deepEqual([...unknownRecord], [ZeroHash, '0x', 0n], 'unknown Record sentinel');
    const unknownEnvelope = await call('getEnvelope', [keccak256(Buffer.from('unknown-Envelope'))], blockTag);
    assert.deepEqual([...unknownEnvelope], ['0x', 0n, 0n, ZeroHash, 0n], 'unknown Envelope sentinel');

    const sparseLeaves = Array.from({ length: 64 }, () => groupLeaf(lab.inputs.meta, '0x' + lab.inputs.candidates.groups[3].groupHex));
    const sparse = publication(sparseLeaves, 800, { selected: [63] });
    await pointPublish(sparse);
    const sparseEnvelope = await call('getEnvelope', [sparse.envelopeId]);
    assert.equal(sparseEnvelope[2], 64n, 'full sparse membership retained');
    assert.equal(ordinaryEnvelope(sparse.header, sparse.recordIds), sparse.envelopeId, 'sparse Envelope identity');

    const withdrawalType = lab.inputs.candidates.groups.flatMap(group => group.members)
      .find(member => member.descriptor.name === 'Withdrawal/1').temporaryTypeSchemaId;
    const withdrawal = publication([{ typeId: withdrawalType, body: itemOccurrence(publications[0].p, 0) }], 801);
    await pointPublish(withdrawal);
    const retainedRecord = await call('getRecord', [publications[0].p.recordIds[0]]);
    const retainedEnvelope = await call('getEnvelope', [publications[0].p.envelopeId]);
    assert.equal(ordinaryRecord(retainedRecord[0], retainedRecord[1]), publications[0].p.recordIds[0], 'withdrawn source Record retained');
    assert.equal(ordinaryEnvelope(publications[0].p.header, publications[0].p.recordIds), publications[0].p.envelopeId, 'withdrawn source Envelope retained');

    const groupSizes = lab.inputs.candidates.groups.map((group, index) => ({ index, bytes: group.groupHex.length / 2 }));
    const smallest = groupSizes.reduce((a, b) => a.bytes <= b.bytes ? a : b);
    const largest = groupSizes.reduce((a, b) => a.bytes >= b.bytes ? a : b);
    const measurement = {};
    for (const [label, selected] of Object.entries({ smallest, largest })) {
      const typeId = lab.inputs.candidates.groups[selected.index].members[0].temporaryTypeSchemaId;
      const data = iface.encodeFunctionData('getTypeSchema', [typeId]);
      const raw = await lab.rpc('eth_call', [{ to: point, data }, 'latest']);
      measurement[label] = {
        groupBytes: selected.bytes,
        estimateGas: BigInt(await lab.rpc('eth_estimateGas', [{ to: point, data }])).toString(),
        returndataBytes: byteLength(raw),
      };
    }
    const recordRaw = await callRaw('getRecord', [publications[2].p.recordIds[0]]);
    const envelopeRaw = await callRaw('getEnvelope', [sparse.envelopeId]);
    report.measurement = {
      ...measurement,
      recordReturndataBytes: byteLength(recordRaw),
      sparseEnvelopeReturndataBytes: byteLength(envelopeRaw),
    };
    report.resources = {
      source: lab.expected.source,
      sourceBlock: { number: block.number, hash: block.hash },
      compiler: pointArtifact.metadata.compiler,
      sourcePins: pointArtifact.metadata.sources,
      txGasCeiling: TX_GAS.toString(),
      helper: lab.resources.deployment.helper,
      library: lab.resources.deployment.library,
      point: {
        runtimeBytes: byteLength(runtime),
        initcodeBytes: byteLength(creation),
        deploymentGas: BigInt(deploymentReceipt.gasUsed).toString(),
        links: pointArtifact.bytecode.linkReferences,
        immutables: immutableNames,
      },
      cleanup: lab.cleanup,
    };
  });
  assert(report.resources.cleanup.stopped, 'managed Anvil stopped');
  t.diagnostic(JSON.stringify({ resources: report.resources, measurement: report.measurement }));
});

function itemOccurrence(p, leaf) {
  return p.envelopeId + leaf.toString(16).padStart(4, '0');
}
