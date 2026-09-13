import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { keccak256: hash } = require('ethers');
const Z = '00'.repeat(32);
const W32 = `0x${'0'.repeat(62)}20`;
const W96 = `0x${'0'.repeat(62)}60`;
const api = async () => import('./paid-runtime-b.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('paid-runtime-b.mjs')) assert.fail('Independent runtime derivation not implemented');
  throw error;
});

function handFixture() {
  return {
    sourceName: 'src/Hand.sol', contractName: 'Hand', immutableValues: { size: W32 },
    artifact: {
      abi: [], metadata: { settings: { compilationTarget: { 'src/Hand.sol': 'Hand' }, libraries: {} } },
      bytecode: { object: '0x60016000f3', linkReferences: {} },
      deployedBytecode: { object: `0x7f${Z}507f${Z}00`, linkReferences: {}, immutableReferences: { 7: [{ start: 1, length: 32 }, { start: 35, length: 32 }] } },
    },
    sourceAst: { nodeType: 'SourceUnit', absolutePath: 'src/Hand.sol', nodes: [
      { nodeType: 'ContractDefinition', name: 'Hand', nodes: [{ nodeType: 'VariableDeclaration', id: 7, name: 'size', stateVariable: true, mutability: 'immutable' }] },
      { nodeType: 'ContractDefinition', name: 'Other', nodes: [{ nodeType: 'VariableDeclaration', id: 99, name: 'size', stateVariable: true, mutability: 'immutable' }] },
    ] },
  };
}

test('substitutes every zero placeholder by exact contract and AST name without mutating input', async () => {
  const { instantiateBRuntime } = await api();
  const input = handFixture(); const before = structuredClone(input);
  const result = instantiateBRuntime(input);
  const expected = `0x7f${'0'.repeat(62)}20507f${'0'.repeat(62)}2000`;
  assert.equal(result.expectedRuntime, expected);
  assert.equal(result.runtimeCodehash, hash(expected));
  assert.equal(result.runtimeBytes, 68);
  assert.deepEqual(result.substitutions, [{ name: 'size', astId: 7, value: W32, offsets: [1, 35] }]);
  assert.deepEqual(input, before);
});

test('compiler AST ID shifts are resolved by name, not remembered numeric IDs', async () => {
  const { instantiateBRuntime } = await api();
  const input = handFixture();
  input.sourceAst.nodes[0].nodes[0].id = 409;
  input.artifact.deployedBytecode.immutableReferences[409] = input.artifact.deployedBytecode.immutableReferences[7];
  delete input.artifact.deployedBytecode.immutableReferences[7];
  assert.equal(instantiateBRuntime(input).expectedRuntime, `0x7f${'0'.repeat(62)}20507f${'0'.repeat(62)}2000`);
});

test('compiler omission of immutableReferences is accepted only for an AST with no immutables', async () => {
  const { instantiateBRuntime } = await api(); const input = handFixture();
  input.sourceAst.nodes[0].nodes = [];
  input.immutableValues = {};
  input.artifact.deployedBytecode.object = '0x600000';
  delete input.artifact.deployedBytecode.immutableReferences;
  assert.equal(instantiateBRuntime(input).expectedRuntime, '0x600000');
});

const failures = [
  ['missing source AST', x => { delete x.sourceAst; }, /AST/],
  ['wrong source AST', x => { x.sourceAst.absolutePath = 'src/Other.sol'; }, /AST/],
  ['wrong contract AST', x => { x.sourceAst.nodes[0].name = 'Other'; }, /CONTRACT/],
  ['duplicate exact contracts', x => { x.sourceAst.nodes.push(structuredClone(x.sourceAst.nodes[0])); }, /CONTRACT/],
  ['wrong metadata target', x => { x.artifact.metadata.settings.compilationTarget['src/Hand.sol'] = 'Other'; }, /TARGET/],
  ['ambiguous metadata targets', x => { x.artifact.metadata.settings.compilationTarget['src/Other.sol'] = 'Other'; }, /TARGET/],
  ['missing runtime', x => { delete x.artifact.deployedBytecode.object; }, /RUNTIME/],
  ['empty runtime', x => { x.artifact.deployedBytecode.object = '0x'; }, /RUNTIME/],
  ['odd runtime hex', x => { x.artifact.deployedBytecode.object = '0x123'; }, /RUNTIME/],
  ['nonhex runtime', x => { x.artifact.deployedBytecode.object = '0x__bad__'; }, /RUNTIME/],
  ['runtime link references', x => { x.artifact.deployedBytecode.linkReferences = { 'Lib.sol': { Lib: [{ start: 1, length: 20 }] } }; }, /LINK/],
  ['initcode link references', x => { x.artifact.bytecode.linkReferences = { 'Lib.sol': { Lib: [{ start: 1, length: 20 }] } }; }, /LINK/],
  ['configured libraries', x => { x.artifact.metadata.settings.libraries = { 'Lib.sol': { Lib: '0x' + '11'.repeat(20) } }; }, /LINK/],
  ['malformed link reference map', x => { x.artifact.deployedBytecode.linkReferences = []; }, /LINK/],
  ['missing immutable references', x => { delete x.artifact.deployedBytecode.immutableReferences; }, /IMMUTABLE/],
  ['unknown immutable ID from another contract', x => { x.artifact.deployedBytecode.immutableReferences[99] = [{ start: 1, length: 32 }]; }, /IMMUTABLE/],
  ['noncanonical immutable ID', x => { x.artifact.deployedBytecode.immutableReferences['07'] = [{ start: 1, length: 32 }]; }, /IMMUTABLE/],
  ['missing declared immutable reference', x => { x.artifact.deployedBytecode.immutableReferences = {}; }, /IMMUTABLE/],
  ['empty immutable reference list', x => { x.artifact.deployedBytecode.immutableReferences[7] = []; }, /IMMUTABLE/],
  ['missing immutable value', x => { delete x.immutableValues.size; }, /IMMUTABLE/],
  ['unexpected immutable value', x => { x.immutableValues.extra = W32; }, /IMMUTABLE/],
  ['malformed immutable value', x => { x.immutableValues.size = '0x20'; }, /IMMUTABLE/],
  ['duplicate immutable name', x => { x.sourceAst.nodes[0].nodes.push({ ...x.sourceAst.nodes[0].nodes[0], id: 8 }); }, /IMMUTABLE/],
  ['duplicate immutable ID', x => { x.sourceAst.nodes[0].nodes.push({ ...x.sourceAst.nodes[0].nodes[0], name: 'extra' }); }, /IMMUTABLE/],
  ['nonimmutable AST declaration', x => { x.sourceAst.nodes[0].nodes[0].mutability = 'mutable'; }, /IMMUTABLE/],
  ['negative offset', x => { x.artifact.deployedBytecode.immutableReferences[7][0].start = -1; }, /OFFSET/],
  ['fractional offset', x => { x.artifact.deployedBytecode.immutableReferences[7][0].start = 1.5; }, /OFFSET/],
  ['string offset', x => { x.artifact.deployedBytecode.immutableReferences[7][0].start = '1'; }, /OFFSET/],
  ['unsafe integer offset', x => { x.artifact.deployedBytecode.immutableReferences[7][0].start = Number.MAX_SAFE_INTEGER + 1; }, /OFFSET/],
  ['out-of-bounds substitution', x => { x.artifact.deployedBytecode.immutableReferences[7][0].start = 67; }, /OFFSET/],
  ['non-word substitution', x => { x.artifact.deployedBytecode.immutableReferences[7][0].length = 20; }, /OFFSET/],
  ['duplicate substitution', x => { x.artifact.deployedBytecode.immutableReferences[7][1].start = 1; }, /OVERLAP/],
  ['overlapping substitution', x => { x.artifact.deployedBytecode.immutableReferences[7][1].start = 2; }, /OVERLAP/],
  ['already-substituted nonzero word', x => { x.artifact.deployedBytecode.object = `0x7f${'11'.repeat(32)}507f${Z}00`; }, /PLACEHOLDER/],
];
for (const [name, mutate, match] of failures) test(`fails closed: ${name}`, async () => {
  const { instantiateBRuntime } = await api(); const input = handFixture(); mutate(input);
  assert.throws(() => instantiateBRuntime(input), match);
});

// A broken ancestry walk either misses the base word or includes unrelated
// declarations. Literal byte positions distinguish both; no Solidity helper.
function inheritedFixture() {
  const x = handFixture();
  const derived = x.sourceAst.nodes[0];
  derived.id = 10; derived.linearizedBaseContracts = [10, 20];
  derived.baseContracts = [{ baseName: { referencedDeclaration: 20 } }];
  x.sourceAst.nodes[1].id = 30;
  const base = { nodeType: 'ContractDefinition', id: 20, name: 'Base', nodes: [
    { nodeType: 'VariableDeclaration', id: 8, name: 'baseSize', stateVariable: true, mutability: 'immutable' },
  ], baseContracts: [], linearizedBaseContracts: [20] };
  x.sourceAsts = { 'src/Base.sol': { nodeType: 'SourceUnit', absolutePath: 'src/Base.sol', nodes: [base] } };
  x.immutableValues.baseSize = W96;
  x.artifact.deployedBytecode.immutableReferences = { 7: [{ start: 1, length: 32 }], 8: [{ start: 35, length: 32 }] };
  return x;
}

test('resolves inherited immutable IDs across supplied source units without unrelated same-name declarations', async () => {
  const { instantiateBRuntime } = await api(); const x = inheritedFixture();
  const before = structuredClone(x);
  const result = instantiateBRuntime(x);
  assert.equal(result.expectedRuntime, `0x7f${'0'.repeat(62)}20507f${'0'.repeat(62)}6000`);
  assert.deepEqual(result.substitutions, [
    { name: 'size', astId: 7, value: W32, offsets: [1] },
    { name: 'baseSize', astId: 8, value: W96, offsets: [35] },
  ]);
  assert.deepEqual(x, before);
});

test('visits a diamond base once while retaining all exact compiler references', async () => {
  const { instantiateBRuntime } = await api(); const x = inheritedFixture();
  const base = x.sourceAsts['src/Base.sol'].nodes[0];
  const left = { nodeType: 'ContractDefinition', id: 21, name: 'Left', nodes: [], baseContracts: [{ baseName: { referencedDeclaration: 20 } }], linearizedBaseContracts: [21, 20] };
  const right = { ...structuredClone(left), id: 22, name: 'Right', linearizedBaseContracts: [22, 20] };
  x.sourceAsts['src/Base.sol'].nodes.push(left, right);
  x.sourceAst.nodes[0].baseContracts = [21, 22].map(id => ({ baseName: { referencedDeclaration: id } }));
  x.sourceAst.nodes[0].linearizedBaseContracts = [10, 22, 21, 20];
  assert.equal(instantiateBRuntime(x).expectedRuntime, `0x7f${'0'.repeat(62)}20507f${'0'.repeat(62)}6000`);
});

for (const [name, mutate, match] of [
  ['missing base source', x => { x.sourceAsts = {}; }, /ANCESTRY/],
  ['malformed source map', x => { x.sourceAsts = []; }, /AST/],
  ['mismatched source map key', x => { x.sourceAsts['src/Base.sol'].absolutePath = 'wrong'; }, /AST/],
  ['conflicting target source', x => { x.sourceAsts['src/Hand.sol'] = structuredClone(x.sourceAst); x.sourceAsts['src/Hand.sol'].nodes[0].id = 77; }, /AST/],
  ['duplicate contract ID', x => { x.sourceAsts['src/Base.sol'].nodes.push(structuredClone(x.sourceAsts['src/Base.sol'].nodes[0])); }, /ANCESTRY/],
  ['missing linearization', x => { delete x.sourceAst.nodes[0].linearizedBaseContracts; }, /ANCESTRY/],
  ['malformed linearization', x => { x.sourceAst.nodes[0].linearizedBaseContracts = [10, '20']; }, /ANCESTRY/],
  ['duplicate linearized ID', x => { x.sourceAst.nodes[0].linearizedBaseContracts = [10, 20, 20]; }, /ANCESTRY/],
  ['root not first', x => { x.sourceAst.nodes[0].linearizedBaseContracts = [20, 10]; }, /ANCESTRY/],
  ['linearized unrelated contract', x => { x.sourceAst.nodes[0].linearizedBaseContracts.push(30); }, /ANCESTRY/],
  ['omitted reachable base', x => { x.sourceAst.nodes[0].linearizedBaseContracts = [10]; }, /ANCESTRY/],
  ['malformed base declaration', x => { x.sourceAst.nodes[0].baseContracts[0].baseName.referencedDeclaration = '20'; }, /ANCESTRY/],
  ['duplicate direct base declaration', x => { x.sourceAst.nodes[0].baseContracts.push(structuredClone(x.sourceAst.nodes[0].baseContracts[0])); }, /ANCESTRY/],
  ['cycle in base graph', x => { x.sourceAsts['src/Base.sol'].nodes[0].baseContracts = [{ baseName: { referencedDeclaration: 10 } }]; }, /ANCESTRY/],
  ['ambiguous inherited immutable name', x => { x.sourceAsts['src/Base.sol'].nodes[0].nodes[0].name = 'size'; }, /IMMUTABLE/],
  ['inherited reference omitted', x => { delete x.artifact.deployedBytecode.immutableReferences[8]; }, /IMMUTABLE/],
]) test(`inherited runtime fails closed: ${name}`, async () => {
  const { instantiateBRuntime } = await api(); const x = inheritedFixture(); mutate(x);
  assert.throws(() => instantiateBRuntime(x), match);
});

// Hand-authored source/constructor declarations; no candidate helper or worked answer.
const contracts = [
  ['registry', 'src/TypeRegistry.sol', 'TypeRegistry', 0, { admin: 'address' }, []],
  ['acceptor', 'src/LabHarness.sol', 'MockAcceptor', 1, {}, []],
  ['quoteAcceptor', 'src/LabAcceptors.sol', 'QuoteAcceptor', 2, {}, []],
  ['labelAcceptor', 'src/LabAcceptors.sol', 'LabelAcceptor', 3, {}, []],
  ['ledger', 'src/Ledger.sol', 'Ledger', 4, { registry: 'address', realmId: 'bytes32', admin: 'address', domainSeparator: 'bytes32' }, ['address', 'bytes32']],
  ['index', 'src/IndexModule.sol', 'IndexModule', 5, { ledger: 'address', admin: 'address', attachedFrom: 'uint64' }, ['address']],
  ['failingIndex', 'src/LabHarness.sol', 'FailingIndexModule', 6, {}, []],
  ['lens', 'src/LensReader.sol', 'LensReader', 7, { ledger: 'address', index: 'address' }, ['address', 'address']],
  ['actorA', 'src/LabHarness.sol', 'Actor', 8, { ledger: 'address' }, ['address']],
  ['actorB', 'src/LabHarness.sol', 'Actor', 9, { ledger: 'address' }, ['address']],
  ['consumer', 'src/LabHarness.sol', 'Consumer', 10, { lens: 'address' }, ['address']],
  ['recon', 'src/LabHarness.sol', 'Reconstructor', 11, {}, []],
  ['strictAcceptor', 'test/Falsify.t.sol', 'StrictQuoteAcceptor', 12, {}, []],
  ['quoteRule', 'src/LabAcceptors.sol', 'MinBodyAcceptor', 13, { minBody: 'uint256' }, ['uint256']],
  ['pairRule', 'src/LabAcceptors.sol', 'MinBodyAcceptor', 14, { minBody: 'uint256' }, ['uint256']],
  ['statelessConsumer', 'src/JoinedConsumer.sol', 'StatelessConsumer', 15, { lens: 'address' }, ['address']],
  ['joinedConsumer', 'src/JoinedConsumer.sol', 'JoinedConsumer', 25, { ledger: 'address', lens: 'address', quoteType: 'bytes32', pairType: 'bytes32', itemType: 'bytes32', labelType: 'bytes32' }, ['address', 'address', 'bytes32', 'bytes32', 'bytes32', 'bytes32']],
];
const neutral = JSON.parse(readFileSync(new URL('../../../../planning/Reviews/2026-09-12-efs-path-decision/paid-neutral-expectations.json', import.meta.url)));
function syntheticBundle() {
  const artifacts = {}, sourceAsts = {}; let id = 100;
  for (const [, source, contract, , immutables, constructor] of contracts) {
    const key = `${source}:${contract}`; if (artifacts[key]) continue;
    const nodes = Object.keys(immutables).map(name => ({ nodeType: 'VariableDeclaration', stateVariable: true, mutability: 'immutable', name, id: ++id }));
    sourceAsts[source] ??= { nodeType: 'SourceUnit', absolutePath: source, nodes: [] };
    sourceAsts[source].nodes.push({ nodeType: 'ContractDefinition', name: contract, nodes });
    artifacts[key] = {
      abi: constructor.length ? [{ type: 'constructor', inputs: constructor.map(type => ({ type })) }] : [],
      metadata: { settings: { compilationTarget: { [source]: contract }, libraries: {} } },
      bytecode: { object: '0x60016000f3', linkReferences: {} },
      deployedBytecode: { object: `0x${nodes.map(() => `7f${Z}`).join('')}00`, linkReferences: {}, immutableReferences: Object.fromEntries(nodes.map((node, i) => [node.id, [{ start: 1 + 33 * i, length: 32 }]])) },
    };
  }
  return { artifacts, sourceAsts, neutral: structuredClone(neutral) };
}

test('derives all 17 deployment targets from mnemonic and hand-encoded CREATE RLP including nonce gap', async () => {
  const { deriveBRuntimeTargets } = await api();
  const result = deriveBRuntimeTargets(syntheticBundle());
  assert.equal(result.deployer, '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
  assert.equal(result.chainId, 31337);
  assert.equal(Object.keys(result.targets).length, 17);
  for (const [name, , , nonce] of contracts) {
    // RLP([20-byte sender, nonce]) = d6 94 <sender> 80|01..19.
    const expectedAddress = `0x${hash(`0xd694${result.deployer.slice(2)}${nonce === 0 ? '80' : nonce.toString(16).padStart(2, '0')}`).slice(-40)}`;
    assert.equal(result.targets[name].address, expectedAddress);
    assert.equal(result.targets[name].nonce, nonce);
  }
  assert.equal(new Set(Object.values(result.targets).map(x => x.address)).size, 17);
});

test('constructor substitutions retain distinct rules, initial attachedFrom and independently laid-out Ledger domain', async () => {
  const { deriveBRuntimeTargets } = await api(); const result = deriveBRuntimeTargets(syntheticBundle());
  assert.equal(result.targets.quoteRule.expectedRuntime, `0x7f${W32.slice(2)}00`);
  assert.equal(result.targets.pairRule.expectedRuntime, `0x7f${W96.slice(2)}00`);
  assert.notEqual(result.runtimeCodehashes.quoteRule, result.runtimeCodehashes.pairRule);
  const substitutions = name => Object.fromEntries(result.targets[name].substitutions.map(s => [s.name, s.value]));
  const addressWord = address => `0x${'0'.repeat(24)}${address.slice(2)}`;
  const textHash = text => hash(`0x${Buffer.from(text).toString('hex')}`);
  const handDomain = hash(`0x${['EIP712Domain(string name,string version)', 'EFS2-RoadB-Lab', '1'].map(textHash).map(s => s.slice(2)).join('')}`);
  assert.deepEqual(substitutions('ledger'), { registry: addressWord(result.targets.registry.address), realmId: textHash('lab/realm/1'), admin: addressWord(result.deployer), domainSeparator: handDomain });
  assert.deepEqual(substitutions('index'), { ledger: addressWord(result.targets.ledger.address), admin: addressWord(result.deployer), attachedFrom: `0x${'0'.repeat(63)}1` });
  assert.deepEqual(Object.keys(result.runtimeCodehashes), ['quoteRule', 'pairRule', 'quoteAcceptor', 'labelAcceptor', 'ledger']);
  for (const key of Object.keys(result.runtimeCodehashes)) assert.equal(result.runtimeCodehashes[key], hash(result.targets[key].expectedRuntime));
});

test('full deployment initcode appends literal one-word and two-word constructor ABI values', async () => {
  const { deriveBRuntimeTargets } = await api(); const result = deriveBRuntimeTargets(syntheticBundle());
  assert.equal(result.targets.registry.expectedInitcode, '0x60016000f3');
  assert.equal(result.targets.quoteRule.expectedInitcode, `0x60016000f3${'0'.repeat(62)}20`);
  assert.equal(result.targets.pairRule.expectedInitcode, `0x60016000f3${'0'.repeat(62)}60`);
  const expectedLens = `0x60016000f3${'0'.repeat(24)}${result.targets.ledger.address.slice(2)}${'0'.repeat(24)}${result.targets.index.address.slice(2)}`;
  assert.equal(result.targets.lens.expectedInitcode, expectedLens);
  assert.equal(result.targets.lens.initcodeBytes, 69);
  assert.equal(result.targets.lens.initcodeHash, hash(expectedLens));
  const realm = hash(`0x${Buffer.from('lab/realm/1').toString('hex')}`);
  assert.equal(result.targets.ledger.expectedInitcode, `0x60016000f3${'0'.repeat(24)}${result.targets.registry.address.slice(2)}${realm.slice(2)}`);
  for (const target of Object.values(result.targets)) {
    assert.equal(target.initcodeHash, hash(target.expectedInitcode));
    assert.equal(target.initcodeBytes, (target.expectedInitcode.length - 2) / 2);
  }
});

test('initcode template changes affect full deployment hash without changing expected runtime', async () => {
  const { deriveBRuntimeTargets } = await api(); const input = syntheticBundle();
  const before = deriveBRuntimeTargets(input);
  input.artifacts['src/Ledger.sol:Ledger'].bytecode.object += '00';
  const after = deriveBRuntimeTargets(input);
  assert.notEqual(after.targets.ledger.initcodeHash, before.targets.ledger.initcodeHash);
  assert.equal(after.targets.ledger.runtimeCodehash, before.targets.ledger.runtimeCodehash);
  assert.equal(after.targets.ledger.initcodeBytes, before.targets.ledger.initcodeBytes + 1);
});

test('changed rule runtime changes the dependent JoinedConsumer immutable Type IDs', async () => {
  const { deriveBRuntimeTargets } = await api(); const input = syntheticBundle();
  const before = deriveBRuntimeTargets(input);
  input.artifacts['src/LabAcceptors.sol:MinBodyAcceptor'].deployedBytecode.object += '00';
  const after = deriveBRuntimeTargets(input);
  const joined = value => Object.fromEntries(value.targets.joinedConsumer.substitutions.map(s => [s.name, s.value]));
  for (const name of ['pairType', 'quoteType']) assert.notEqual(joined(before)[name], joined(after)[name]);
  for (const name of ['itemType', 'labelType', 'ledger', 'lens']) assert.equal(joined(before)[name], joined(after)[name]);
  assert.notEqual(before.targets.joinedConsumer.expectedRuntime, after.targets.joinedConsumer.expectedRuntime);
  assert.notEqual(before.targets.joinedConsumer.expectedInitcode, after.targets.joinedConsumer.expectedInitcode);
  assert.notEqual(before.targets.joinedConsumer.initcodeHash, after.targets.joinedConsumer.initcodeHash);
});

for (const [name, mutate, match] of [
  ['unsupported chain', x => { x.chainId = 1; }, /CHAIN/],
  ['missing required artifact', x => { delete x.artifacts['src/TypeRegistry.sol:TypeRegistry']; }, /ARTIFACT/],
  ['missing required source AST', x => { delete x.sourceAsts['src/Ledger.sol']; }, /AST/],
  ['wrong constructor ABI', x => { x.artifacts['src/Ledger.sol:Ledger'].abi[0].inputs.reverse(); }, /CONSTRUCTOR/],
  ['ambiguous constructor ABI', x => { x.artifacts['src/Ledger.sol:Ledger'].abi.push(x.artifacts['src/Ledger.sol:Ledger'].abi[0]); }, /CONSTRUCTOR/],
  ['missing initcode template', x => { delete x.artifacts['src/Ledger.sol:Ledger'].bytecode.object; }, /INITCODE/],
  ['empty initcode template', x => { x.artifacts['src/Ledger.sol:Ledger'].bytecode.object = '0x'; }, /INITCODE/],
  ['odd initcode template', x => { x.artifacts['src/Ledger.sol:Ledger'].bytecode.object = '0x123'; }, /INITCODE/],
  ['nonhex initcode template', x => { x.artifacts['src/Ledger.sol:Ledger'].bytecode.object = '0xnothex'; }, /INITCODE/],
]) test(`target derivation fails closed: ${name}`, async () => {
  const { deriveBRuntimeTargets } = await api(); const input = syntheticBundle(); mutate(input);
  assert.throws(() => deriveBRuntimeTargets(input), match);
});

test('real compiler artifacts map all exact source-contract immutables when explicitly supplied', { skip: !process.env.B_RUNTIME_ARTIFACT_DIR }, async () => {
  const { deriveBRuntimeTargets } = await api(); const artifacts = {}, sourceAsts = {};
  for (const [, source, contract] of contracts) {
    const artifact = JSON.parse(readFileSync(`${process.env.B_RUNTIME_ARTIFACT_DIR}/${source.split('/').at(-1)}/${contract}.json`));
    artifacts[`${source}:${contract}`] = artifact;
    sourceAsts[source] = artifact.ast;
  }
  const result = deriveBRuntimeTargets({ artifacts, sourceAsts, neutral });
  assert.equal(Object.keys(result.targets).length, 17);
  for (const [name, , , , names] of contracts) {
    const target = result.targets[name];
    assert.deepEqual(target.substitutions.map(s => s.name).sort(), Object.keys(names).sort());
    assert.equal(target.runtimeCodehash, hash(target.expectedRuntime));
    assert.equal(target.runtimeBytes, (target.expectedRuntime.length - 2) / 2);
    assert.ok(target.runtimeBytes > 0 && target.runtimeBytes <= 24576);
    assert.equal(target.initcodeHash, hash(target.expectedInitcode));
    assert.equal(target.initcodeBytes, (target.expectedInitcode.length - 2) / 2);
    assert.ok(target.initcodeBytes > 0 && target.initcodeBytes <= 49152);
  }
});

test('real inherited Index fixture resolves only its four exact immutable values', { skip: !process.env.B_RUNTIME_ARTIFACT_DIR }, async () => {
  const { instantiateBRuntime } = await api();
  const read = path => JSON.parse(readFileSync(`${process.env.B_RUNTIME_ARTIFACT_DIR}/${path}`));
  const artifact = read('MatchedRollback.t.sol/LateRefusingIndexModule.json');
  const sourceAsts = {
    'src/IndexModule.sol': read('IndexModule.sol/IndexModule.json').ast,
    'src/Interfaces.sol': read('Interfaces.sol/IIndexModule.json').ast,
  };
  const immutableValues = { ledger: `0x${'0'.repeat(24)}${'11'.repeat(20)}`, admin: `0x${'0'.repeat(24)}${'22'.repeat(20)}`, attachedFrom: `0x${'0'.repeat(63)}1`, poisonBindingKey: `0x${'33'.repeat(32)}` };
  const input = { artifact, sourceAst: artifact.ast, sourceAsts, sourceName: 'test/MatchedRollback.t.sol', contractName: 'LateRefusingIndexModule', immutableValues };
  const result = instantiateBRuntime(input);
  assert.deepEqual(result.substitutions.map(x => x.name).sort(), ['admin', 'attachedFrom', 'ledger', 'poisonBindingKey']);
  for (const sub of result.substitutions) for (const offset of sub.offsets) {
    assert.equal(`0x${result.expectedRuntime.slice(2 + offset * 2, 2 + (offset + 32) * 2)}`, immutableValues[sub.name]);
  }
  assert.ok(result.runtimeBytes > 0 && result.runtimeBytes <= 24576);
  delete sourceAsts['src/Interfaces.sol'];
  assert.throws(() => instantiateBRuntime(input), /ANCESTRY/);
});
