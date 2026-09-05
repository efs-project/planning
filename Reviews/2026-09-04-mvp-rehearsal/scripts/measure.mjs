import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { AbiCoder, ContractFactory, hexlify, keccak256, toUtf8Bytes, toBeHex } from 'ethers';
import { artifact, compile, send, withLabChain, TX_GAS } from './local-chain.mjs';
import { createLabSdk } from '../sdk/index.js';

if (process.env.EFS_LAB_SKIP_BUILD !== '1') compile();
const abi = AbiCoder.defaultAbiCoder();
const report = { profile: 'efs-lab/1', c0Conformance: false, compiler: '0.8.30+commit.73712a01',
  node: process.version, evm: 'cancun', optimizerRuns: 200, viaIR: true, measurements: [] };
await withLabChain(async lab => {
  report.runtimeBytes = lab.runtimeBytes;
  report.deploymentGas = String(lab.deploymentReceipt.gasUsed);
  const readProvider = { request: ({ method, params = [] }) => lab.provider.send(method,
    method === 'eth_sendTransaction' ? [{ ...params[0], gas: `0x${TX_GAS.toString(16)}` }] : params) };
  const sdk = createLabSdk({ deployment: lab.deployment, readProvider, walletProvider: readProvider,
    relayProvider: readProvider, sessionProvider: readProvider });
  const deadline = BigInt((await lab.provider.getBlock('latest')).timestamp + 3600);
  let last;
  for (const size of [0, 32, 256, 1024, 4096, 16384]) {
    const data = hexlify(new Uint8Array(size).fill(97));
    const op = sdk.operations.createFile({ target: lab.deployment.rootId, name: `${size}.txt`, data,
      salt: toBeHex(size + 1, 32), nonce: await lab.core.ownerNonce(), deadline });
    const plan = sdk.planWrite({ operation: op });
    const receipt = await send(lab.core.executeDirect, op);
    const expectedContent = keccak256(abi.encode(['bytes32', 'bytes32'], [keccak256(toUtf8Bytes('efs-lab/bytes/1')), keccak256(data)]));
    const exact = await sdk.readExact({ kind: 'revision', file: plan.predicted.resultId, revision: 1 });
    assert.equal(exact.outcome, 'FOUND'); assert.equal(exact.value.contentId, expectedContent);
    const bytes = await sdk.readVerifiedBytes({ contentId: expectedContent, blockTag: exact.basis });
    assert.equal(bytes.qualification.integrity, 'VERIFIED'); assert.equal(bytes.value.bytes, data);
    report.measurements.push({ operation: 'direct create file and retained receipt', payloadBytes: size, gasUsed: String(receipt.gasUsed) });
    last = plan.predicted.resultId;
  }
  const schema = '0x01'; await send(lab.core.registerSchema, schema);
  const schemaId = keccak256(abi.encode(['bytes32', 'bytes32'], [keccak256(toUtf8Bytes('efs-lab/schema/1')), keccak256(schema)]));
  const data = '0x000000000000002a';
  const recordId = keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32'], [keccak256(toUtf8Bytes('efs-lab/record/1')), schemaId, keccak256(data)]));
  const op = sdk.operations.publishRecord({ schemaId, data, nonce: await lab.core.ownerNonce(), deadline });
  const prepared = await sdk.prepareWrite(sdk.planWrite({ operation: op }), { mode: 'relayed', account: lab.deployment.owner });
  const submitted = await sdk.submitWrite(prepared, { from: await lab.relay.getAddress() });
  assert.equal((await sdk.readBack(submitted)).effect, 'COMMITTED');
  const receipt = await lab.provider.getTransactionReceipt(submitted.transactionHash);
  report.measurements.push({ operation: 'relayed exact typed u64 record', payloadBytes: 8, gasUsed: String(receipt.gasUsed) });
  const compiled = await artifact('LabReadConsumer');
  const consumer = await new ContractFactory(compiled.abi, compiled.bytecode.object, lab.owner).deploy({ gasLimit: TX_GAS });
  await consumer.waitForDeployment();
  report.runtimeBytes.consumer = ((await lab.provider.getCode(await consumer.getAddress())).length - 2) / 2;
  assert(report.runtimeBytes.consumer <= 24576);
  const args = [lab.deployment.core, lab.deployment.runtimeCodeHashes.core, lab.deployment.runId, 1];
  const file = await consumer.currentFile(...args, last); assert.equal(file.status, 0n); assert.equal(file.revision, 1n);
  const score = await consumer.score(...args, recordId, schemaId); assert.equal(score[0], 0n); assert.equal(score[1], 42n);
  report.measurements.push({ operation: 'Solidity consumer current file eth_estimateGas', gasUsed: String(await consumer.currentFile.estimateGas(...args, last)) });
  report.measurements.push({ operation: 'Solidity consumer exact typed u64 eth_estimateGas', gasUsed: String(await consumer.score.estimateGas(...args, recordId, schemaId)) });
});
report.caveats = [
  'Gas is this synthetic local Cancun lab, not full C0 or a named L2 fee forecast.',
  'Payload a-bytes include full storage and retained operation history; equal-content deduplication changes costs.',
  'Consumer estimates include transaction intrinsic cost; these are not just inner STATICCALL gas.',
  'Small inline payloads only; use full C0 ChunkTree work for large-file design.',
];
await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
await writeFile(new URL('../artifacts/measurements.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
