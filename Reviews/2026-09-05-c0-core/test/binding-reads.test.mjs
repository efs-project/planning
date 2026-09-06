import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AbiCoder, ZeroAddress, ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { ROOT, compileStateful, fixtureInputs } from '../scripts/local-stateful.mjs';

const byteLength = value => (value.length - 2) / 2;
const abi = AbiCoder.defaultAbiCoder();

test('normal joined Binding reader remains within the deployment caps before state comparison', { timeout: 240000 }, t => {
  compileStateful();
  const artifact = JSON.parse(
    readFileSync(join(ROOT, 'out', 'BindingReadHarness.sol', 'BindingReadHarness.json'), 'utf8'),
  );
  const constructorArguments = abi.encode(
    [
      'tuple(bytes32 realmId,bytes32 initialRevisionId,bytes intrinsicGroupBytes,bytes objectGroup1Bytes,bytes kernelGroup2Bytes)',
      'address',
      'bytes32',
      'bytes32',
    ],
    [fixtureInputs().init, ZeroAddress, ZeroHash, ZeroHash],
  );
  const creationBytecodeBytes = byteLength(artifact.bytecode.object);
  const fullTransactionInitcodeBytes = creationBytecodeBytes + byteLength(constructorArguments);
  const resources = {
    compiler: artifact.metadata.compiler,
    settings: artifact.metadata.settings,
    sourcePins: artifact.metadata.sources,
    normalBindingHost: {
      runtimeBytes: byteLength(artifact.deployedBytecode.object),
      creationBytecodeBytes,
      constructorArgumentsBytes: byteLength(constructorArguments),
      fullTransactionInitcodeBytes,
      runtimeLimit: 24576,
      initcodeLimit: 49152,
      links: artifact.bytecode.linkReferences,
      immutables: artifact.deployedBytecode.immutableReferences,
    },
  };
  t.diagnostic(JSON.stringify(resources));
  assert(resources.normalBindingHost.fullTransactionInitcodeBytes <= resources.normalBindingHost.initcodeLimit);
  assert(
    resources.normalBindingHost.runtimeBytes <= resources.normalBindingHost.runtimeLimit,
    `normal BindingReadHarness runtime ${resources.normalBindingHost.runtimeBytes} exceeds EIP-170 ${resources.normalBindingHost.runtimeLimit}`,
  );
});
