import assert from 'node:assert/strict';
import test from 'node:test';
import { keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import * as runner from '../scripts/local-upgrade.mjs';

// Real solc/Foundry shapes, reduced to two contracts. An unchanged proxy's
// bytecode can survive a compilation that renumbers its immutable AST IDs.
function fixture() {
  const currentSources = {
    'src/Core.sol': 'pragma solidity ^0.8.30; contract Core {}',
    'src/Proxy.sol': 'pragma solidity ^0.8.30; contract Proxy { address immutable _admin; constructor() { _admin = msg.sender; } }'
  };
  const artifacts = {};
  const info = { input: { sources: {} }, output: { contracts: {}, sources: {} } };
  for (const [name, path, id] of [['Core', 'src/Core.sol', 10], ['Proxy', 'src/Proxy.sol', 33499]]) {
    const abi = name === 'Proxy' ? [{ type: 'constructor', inputs: [], stateMutability: 'nonpayable' }] : [];
    const bytecode = { object: '60006000', linkReferences: {} };
    const deployedBytecode = { object: '73' + '00'.repeat(32), linkReferences: {}, immutableReferences: name === 'Proxy' ? { [id]: [{ start: 1, length: 32 }] } : {} };
    artifacts[name] = {
      abi, bytecode: { ...bytecode, object: '0x' + bytecode.object },
      deployedBytecode: { ...deployedBytecode, object: '0x' + deployedBytecode.object },
      metadata: { settings: { compilationTarget: { [path]: name } }, sources: { [path]: { keccak256: keccak256(Buffer.from(currentSources[path])) } } }
    };
    info.input.sources[path] = { content: currentSources[path] };
    info.output.contracts[path] = { [name]: { abi: structuredClone(abi), evm: structuredClone({ bytecode, deployedBytecode }) } };
    info.output.sources[path] = { id, ast: { nodeType: 'SourceUnit', nodes: name === 'Proxy' ? [{ nodeType: 'VariableDeclaration', id, name: '_admin', mutability: 'immutable' }] : [] } };
  }
  return { artifacts, info, currentSources };
}

test('selects coherent current output after stale output with identical core bytecode', () => {
  const { artifacts, info, currentSources } = fixture();
  const stale = structuredClone(info);
  stale.output.contracts['src/Proxy.sol'].Proxy.evm.deployedBytecode.immutableReferences = { 32736: [{ start: 1, length: 32 }] };
  stale.output.sources['src/Proxy.sol'].ast.nodes[0].id = 32736;
  assert.equal(typeof runner.selectCompilerEvidence, 'function', 'pure compiler evidence selector is available');
  assert.equal(runner.selectCompilerEvidence([stale, info], artifacts, currentSources), info);
});

const corruptions = {
  'ABI': f => { f.info.output.contracts['src/Proxy.sol'].Proxy.abi = []; },
  'creation bytecode': f => { f.info.output.contracts['src/Proxy.sol'].Proxy.evm.bytecode.object = 'ff'; },
  'runtime bytecode': f => { f.info.output.contracts['src/Proxy.sol'].Proxy.evm.deployedBytecode.object = 'ff'; },
  'creation links': f => { f.info.output.contracts['src/Proxy.sol'].Proxy.evm.bytecode.linkReferences = { 'src/Lib.sol': { Lib: [{ start: 0, length: 20 }] } }; },
  'runtime links': f => { f.info.output.contracts['src/Proxy.sol'].Proxy.evm.deployedBytecode.linkReferences = { 'src/Lib.sol': { Lib: [{ start: 0, length: 20 }] } }; },
  'immutable AST IDs': f => { f.info.output.contracts['src/Proxy.sol'].Proxy.evm.deployedBytecode.immutableReferences = { 32736: [{ start: 1, length: 32 }] }; },
  'missing compiled artifact': f => { delete f.info.output.contracts['src/Proxy.sol']; },
  'compiler input source': f => { f.info.input.sources['src/Proxy.sol'].content += '\n// stale'; },
  'disk source': f => { f.currentSources['src/Proxy.sol'] += '\n// edited'; },
  'missing source AST': f => { delete f.info.output.sources['src/Proxy.sol'].ast; },
  'immutable reference absent from AST': f => { f.info.output.sources['src/Proxy.sol'].ast.nodes[0].id = 32736; },
  'cross-artifact source hashes': f => { f.artifacts.Core.metadata.sources['src/Proxy.sol'] = { keccak256: '0x' + '00'.repeat(32) }; }
};
for (const [name, corrupt] of Object.entries(corruptions)) {
  test('refuses no-coherent bundle: ' + name, () => {
    const f = fixture(); corrupt(f);
    assert.equal(typeof runner.selectCompilerEvidence, 'function', 'pure compiler evidence selector is available');
    assert.throws(() => runner.selectCompilerEvidence([f.info], f.artifacts, f.currentSources), /No coherent full compiler output.*EFS_TEST_FULL_BUILD=1/s);
  });
}

test('refuses an empty compiler evidence inventory', () => {
  const f = fixture();
  assert.equal(typeof runner.selectCompilerEvidence, 'function', 'pure compiler evidence selector is available');
  assert.throws(() => runner.selectCompilerEvidence([], f.artifacts, f.currentSources), /No coherent full compiler output/);
});

test('explicit full-build option forces a complete artifact bundle; default retains cache', () => {
  assert.equal(typeof runner.upgradeBuildArgs, 'function', 'pure build argument construction is available');
  assert.equal(runner.upgradeBuildArgs({ fullBuild: false }).includes('--force'), false);
  assert.equal(runner.upgradeBuildArgs({ fullBuild: true }).filter(x => x === '--force').length, 1);
});
