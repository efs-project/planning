import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AbiCoder, concat, Interface, keccak256, toBeHex, ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { compileStateful, TX_GAS, withStateful } from '../scripts/local-stateful.mjs';

const abi = AbiCoder.defaultAbiCoder();
const RECORD_DOMAIN = keccak256(Buffer.from('efs2/record/1'));
const ENVELOPE_ID_DOMAIN = keccak256(Buffer.from('efs2/envelope/1'));
const ENVELOPE_DOMAIN_SEPARATOR = keccak256(abi.encode(
  ['bytes32', 'bytes32', 'bytes32'],
  [keccak256(Buffer.from('EIP712Domain(string name,string version)')), keccak256(Buffer.from('EFS2-Envelope')), keccak256(Buffer.from('1'))],
));
const ENVELOPE_TYPEHASH = keccak256(Buffer.from('PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)'));
const word = value => toBeHex(value, 32);
const address = value => toBeHex(value, 20);
const zeroBytes = length => '0x' + '00'.repeat(length);
const ceil32 = value => Math.ceil(value / 32) * 32;

function recordId(typeId, body) {
  return keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32'], [RECORD_DOMAIN, typeId, keccak256(body)]));
}

function arithmetic(n, bodyLengths, m, payloadLength = 0) {
  const w = 544 + 32 * n + 160 * bodyLengths.length + bodyLengths.reduce((sum, length) => sum + ceil32(length), 0);
  return { n, k: bodyLengths.length, m, bodyLengths, w, compositeCall: w + 928 + 64 * m + ceil32(payloadLength) + 4 };
}

function publicationDigest(header, recordIds) {
  const structHash = keccak256(abi.encode(
    ['bytes32', 'uint16', 'bytes32', 'bytes32', 'uint64', 'bytes32', 'uint64', 'bytes32'],
    [ENVELOPE_TYPEHASH, header.profile, header.principalId, header.authorityRef, header.authEpoch, header.pubNonce, header.notAfter, keccak256(concat(recordIds))],
  ));
  return keccak256(concat(['0x1901', ENVELOPE_DOMAIN_SEPARATOR, structHash]));
}

function envelopeId(digest) {
  return keccak256(abi.encode(['bytes32', 'bytes32'], [ENVELOPE_ID_DOMAIN, digest]));
}

function baseRequest() {
  const body = '0x42';
  const typeId = word(7);
  return {
    header: { profile: 1, principalId: word(11), authorityRef: ZeroHash, authEpoch: 0, pubNonce: word(12), notAfter: 0 },
    recordIds: [recordId(typeId, body)],
    selectedLeaves: [{ leafIndex: 0, typeId, body }],
    expectedRevisions: [],
    effects: { realmId: ZeroHash, core: address(0), routeConfigId: ZeroHash, genesisReceiptHash: ZeroHash, operationKind: 255, envelopeId: ZeroHash, leafMask: 0, expectedRevisionsHash: ZeroHash, stateByteStore: address(0), byteCommitment: ZeroHash },
    plan: { c0ProfileId: ZeroHash, publicationDigest: ZeroHash, realmId: ZeroHash, realmEffectsDigest: ZeroHash, executor: address(0), executorCodeHash: ZeroHash, nonceKey: 0, nonceSeq: 0, notAfter: 0 },
    branch: 255,
    principal: { authorityKind: 1, originRef: '0x', accountOrKey: address(0xa11ce) },
    witness: '0x' + Array.from({ length: 65 }, (_, index) => (index + 1).toString(16).padStart(2, '0')).join(''),
    payload: '0x',
  };
}

function maximumRequest(firstLength, otherLength) {
  const request = baseRequest();
  request.recordIds = [];
  request.selectedLeaves = [];
  request.expectedRevisions = [];
  for (let index = 0; index < 64; index++) {
    const body = zeroBytes(index === 0 ? firstLength : otherLength);
    const typeId = word(index + 7);
    request.recordIds.push(recordId(typeId, body));
    request.selectedLeaves.push({ leafIndex: index, typeId, body });
    request.expectedRevisions.push({ leafIndex: index, revision: index });
  }
  request.principal = { authorityKind: 1, originRef: '0x', accountOrKey: address(0xa11ce) };
  request.witness = '0x' + Array.from({ length: 65 }, (_, index) => (index + 1).toString(16).padStart(2, '0')).join('');
  return request;
}

function argumentsFor(request) {
  return [request.header, request.recordIds, request.selectedLeaves, request.expectedRevisions, request.effects, request.plan, request.branch, request.principal, request.witness, request.payload];
}

function exactError(signature, types = [], values = []) {
  return keccak256(Buffer.from(signature)).slice(0, 10) + abi.encode(types, values).slice(2);
}

async function reverted(lab, to, data) {
  try {
    await lab.rpc('eth_call', [{ to, data, gas: toBeHex(TX_GAS) }, 'latest']);
    assert.fail('expected exact application revert');
  } catch (error) {
    const parsed = JSON.parse(error.message);
    assert.equal(typeof parsed.data, 'string', 'Anvil returned revert bytes');
    return parsed.data;
  }
}

test('managed receiver independently prepares bounded publication calldata', { timeout: 240000 }, async t => {
  const rows = [
    arithmetic(1, [1], 0),
    arithmetic(64, Array(64).fill(128), 64),
    arithmetic(64, [1505, ...Array(63).fill(1)], 64),
    arithmetic(5, [128, 256, 128], 1),
  ];
  assert.deepEqual(rows.map(row => [row.w, row.compositeCall]), [[768, 1700], [21024, 26052], [16384, 21412], [1696, 2692]]);
  for (const row of rows) t.diagnostic(`arithmetic N/K/M=${row.n}/${row.k}/${row.m} bodies=[${row.bodyLengths.join(',')}] W=${row.w} compositeP0=${row.compositeCall}`);

  compileStateful();
  const artifact = JSON.parse(readFileSync(new URL('../out/C0RequestHarness.sol/C0RequestHarness.json', import.meta.url)));
  const iface = new Interface(artifact.abi);
  const result = await withStateful(async lab => {
    async function deploy(fileCap) {
      const creation = artifact.bytecode.object + abi.encode(['uint64'], [fileCap]).slice(2);
      assert((creation.length - 2) / 2 <= 49152, 'harness initcode ceiling');
      const transaction = await lab.send(creation);
      const receipt = await lab.receipt(transaction);
      assert.equal(receipt.status, '0x1', 'harness deployment');
      assert(BigInt(receipt.gasUsed) <= TX_GAS, 'deployment transaction ceiling');
      const code = await lab.rpc('eth_getCode', [receipt.contractAddress, receipt.blockNumber]);
      assert((code.length - 2) / 2 <= 24576, 'harness runtime ceiling');
      return { address: receipt.contractAddress, gas: BigInt(receipt.gasUsed), initcodeBytes: (creation.length - 2) / 2, runtimeBytes: (code.length - 2) / 2 };
    }
    const h0 = await deploy(0);
    const h32 = await deploy(32);
    const h8192 = await deploy(8192);
    const encode = request => iface.encodeFunctionData('inspectBoundsForTest', argumentsFor(request));
    const call = async (receiver, request) => {
      const raw = await lab.rpc('eth_call', [{ to: receiver.address, data: encode(request), gas: toBeHex(TX_GAS) }, 'latest']);
      return iface.decodeFunctionResult('inspectBoundsForTest', raw)[0];
    };

    const request = baseRequest();
    const expectedDigest = publicationDigest(request.header, request.recordIds);
    const expectedEnvelopeId = envelopeId(expectedDigest);
    assert.equal(encode(request).length / 2 - 1, 1700, 'canonical one-byte call');
    const prepared = await call(h0, request);
    assert.equal(prepared.publicationDigest, expectedDigest);
    assert.equal(prepared.equivalentWireBytes, 768n);
    assert.equal(prepared.publication.envelopeId, expectedEnvelopeId);
    assert.equal(prepared.publication.header.profile, 1n);
    assert.equal(prepared.publication.header.principalId, request.header.principalId);
    assert.equal(prepared.publication.header.authorityRef, ZeroHash);
    assert.equal(prepared.publication.header.authEpoch, 0n);
    assert.equal(prepared.publication.header.pubNonce, request.header.pubNonce);
    assert.equal(prepared.publication.header.notAfter, 0n);
    assert.deepEqual([...prepared.publication.recordIds], request.recordIds);
    assert.equal(prepared.publication.leafMask, 1n);
    assert.equal(prepared.publication.leaves.length, 1);
    assert.equal(prepared.publication.leaves[0].leafIndex, 0n);
    assert.equal(prepared.publication.leaves[0].typeId, word(7));
    assert.equal(prepared.publication.leaves[0].body, '0x42');
    assert.equal(prepared.publication.expectedRevisions.length, 0);

    const wireRequest = maximumRequest(128, 128);
    const wireData = encode(wireRequest);
    assert.equal(wireData.length / 2 - 1, 26052, 'canonical wire-refusal call');
    assert.equal(
      await reverted(lab, h8192.address, wireData),
      exactError('E_WIRE_LIMIT(uint256)', ['uint256'], [21024]),
    );

    const payloadRequest = baseRequest();
    payloadRequest.payload = zeroBytes(33);
    payloadRequest.header.profile = 2;
    assert.equal(
      await reverted(lab, h32.address, encode(payloadRequest)),
      exactError('C0_PAYLOAD_LIMIT(uint256,uint256)', ['uint256', 'uint256'], [33, 32]),
    );

    const mismatch = baseRequest();
    mismatch.recordIds[0] = word(1);
    assert.equal(
      await reverted(lab, h0.address, encode(mismatch)),
      exactError('E_BODY_MISMATCH(uint16)', ['uint16'], [0]),
    );

    const exact = maximumRequest(1505, 1);
    const exactData = encode(exact);
    assert.equal(exactData.length / 2 - 1, 21412, 'canonical exact call ceiling');
    const exactResult = await call(h0, exact);
    assert.equal(exactResult.equivalentWireBytes, 16384n);
    assert.equal(
      await reverted(lab, h0.address, exactData + '00'),
      exactError('C0_CALL_LIMIT(uint256,uint256)', ['uint256', 'uint256'], [21413, 21412]),
    );

    return { deployments: { h0, h32, h8192 }, cleanup: lab.cleanup };
  });
  assert.equal(result.cleanup.stopped, true, 'managed runner cleanup');
  for (const [name, deployed] of Object.entries(result.deployments)) {
    t.diagnostic(`${name} deployment gas=${deployed.gas} initcode=${deployed.initcodeBytes} runtime=${deployed.runtimeBytes}`);
  }
});
