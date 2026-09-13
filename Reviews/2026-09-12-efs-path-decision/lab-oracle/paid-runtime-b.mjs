/** Independent, disposable B pre-run runtime derivation. No compiler, RPC or candidate helpers. */
import { createRequire } from 'node:module';
import { deriveBInputs } from './paid-vectors-b.mjs';
const require = createRequire(import.meta.url);
const { AbiCoder, HDNodeWallet, getCreateAddress, keccak256, toUtf8Bytes } = require('ethers');
const abi = AbiCoder.defaultAbiCoder();
const word = (type, value) => abi.encode([type], [value]).toLowerCase();
const textHash = value => keccak256(toUtf8Bytes(value));
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new Error(message); };
const emptyObject = (value, reason) => {
  if (!object(value) || Object.keys(value).length) fail(reason);
};

// Full source maps opt into inherited declaration resolution. The legacy
// exact-contract path still rejects any compiler reference it cannot resolve.
function runtimeContracts(contract, sourceAst, sourceAsts) {
  if (sourceAsts === undefined) return [contract];
  if (!object(sourceAsts)) fail('AST:source map required');
  const units = [sourceAst];
  for (const [name, ast] of Object.entries(sourceAsts)) {
    if (ast?.nodeType !== 'SourceUnit' || ast.absolutePath !== name || !Array.isArray(ast.nodes)) fail('AST:source map unit mismatch');
    if (name === sourceAst.absolutePath) {
      if (JSON.stringify(ast) !== JSON.stringify(sourceAst)) fail('AST:conflicting target source');
    } else units.push(ast);
  }
  const byId = new Map();
  const validId = id => Number.isSafeInteger(id) && id > 0;
  for (const unit of units) for (const node of unit.nodes) {
    if (node.nodeType !== 'ContractDefinition') continue;
    if (!validId(node.id) || byId.has(node.id)) fail('ANCESTRY:invalid or duplicate contract ID');
    byId.set(node.id, node);
  }
  const linear = contract.linearizedBaseContracts;
  if (!Array.isArray(linear) || !linear.length || linear[0] !== contract.id || linear.some(id => !validId(id)) || new Set(linear).size !== linear.length) fail('ANCESTRY:invalid target linearization');
  const visiting = new Set(), reached = new Set();
  const visit = id => {
    if (visiting.has(id)) fail('ANCESTRY:cycle');
    if (reached.has(id)) return;
    const node = byId.get(id);
    if (!node || !Array.isArray(node.nodes) || !Array.isArray(node.baseContracts)) fail('ANCESTRY:missing or malformed base contract');
    visiting.add(id);
    const directBaseIds = new Set();
    for (const base of node.baseContracts) {
      const baseId = base?.baseName?.referencedDeclaration;
      if (!validId(baseId) || directBaseIds.has(baseId)) fail('ANCESTRY:invalid or duplicate direct base reference');
      directBaseIds.add(baseId);
      visit(baseId);
    }
    visiting.delete(id); reached.add(id);
  };
  visit(contract.id);
  if (reached.size !== linear.length || linear.some(id => !reached.has(id))) fail('ANCESTRY:linearization differs from reachable bases');
  return linear.map(id => byId.get(id));
}

/**
 * Requires a source-unit AST and an artifact for precisely one source/contract.
 * immutableValues maps declaration NAME to an independently encoded bytes32 word.
 * Every expected declaration and every compiler reference must match exactly.
 * sourceAsts optionally supplies the complete inheritance source units, keyed by
 * compiler source name. Same-named inherited immutables are refused, not guessed.
 */
export function instantiateBRuntime({ artifact, sourceAst, sourceAsts, sourceName, contractName, immutableValues } = {}) {
  if (!object(artifact)) fail('ARTIFACT:missing');
  const target = artifact.metadata?.settings?.compilationTarget;
  if (!object(target) || Object.keys(target).length !== 1 || target[sourceName] !== contractName) fail('TARGET:artifact source/contract mismatch');
  if (sourceAst?.nodeType !== 'SourceUnit' || sourceAst.absolutePath !== sourceName || !Array.isArray(sourceAst.nodes)) fail('AST:source unit mismatch or missing');
  const contracts = sourceAst.nodes.filter(node => node.nodeType === 'ContractDefinition' && node.name === contractName);
  if (contracts.length !== 1 || !Array.isArray(contracts[0].nodes)) fail('CONTRACT:missing or ambiguous exact AST contract');
  const declarations = runtimeContracts(contracts[0], sourceAst, sourceAsts).flatMap(contract => contract.nodes.filter(node => node.nodeType === 'VariableDeclaration' && node.stateVariable === true && node.mutability === 'immutable'));
  const byId = new Map(), byName = new Map();
  for (const declaration of declarations) {
    if (!Number.isSafeInteger(declaration.id) || declaration.id <= 0 || typeof declaration.name !== 'string' || !declaration.name || byId.has(String(declaration.id)) || byName.has(declaration.name)) fail('IMMUTABLE:invalid or duplicate AST declaration');
    byId.set(String(declaration.id), declaration); byName.set(declaration.name, declaration);
  }
  if (!object(immutableValues) || Object.keys(immutableValues).length !== byName.size) fail('IMMUTABLE:missing or unexpected values');
  for (const [name, value] of Object.entries(immutableValues)) {
    if (!byName.has(name) || typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value)) fail(`IMMUTABLE:unexpected name or malformed word:${name}`);
  }
  const runtime = artifact.deployedBytecode;
  if (typeof runtime?.object !== 'string' || !/^0x(?:[0-9a-fA-F]{2})+$/.test(runtime.object)) fail('RUNTIME:nonempty even-length hex required');
  emptyObject(runtime.linkReferences, 'LINK:runtime links missing, malformed or unsupported');
  emptyObject(artifact.bytecode?.linkReferences, 'LINK:initcode links missing, malformed or unsupported');
  emptyObject(artifact.metadata.settings.libraries, 'LINK:configured libraries missing, malformed or unsupported');
  // solc/Forge omits this field (rather than emitting {}) for no immutables.
  const refs = runtime.immutableReferences === undefined && byId.size === 0 ? {} : runtime.immutableReferences;
  if (!object(refs) || Object.keys(refs).length !== byId.size) fail('IMMUTABLE:missing or unexpected references');
  const slots = [], substitutions = [];
  for (const [id, locations] of Object.entries(refs)) {
    if (!/^[1-9][0-9]*$/.test(id) || !byId.has(id) || !Array.isArray(locations) || !locations.length) fail(`IMMUTABLE:unresolved or empty reference:${id}`);
    const declaration = byId.get(id);
    const value = immutableValues[declaration.name].toLowerCase();
    const offsets = [];
    for (const location of locations) {
      if (!object(location) || !Number.isSafeInteger(location.start) || location.start < 0 || location.length !== 32 || location.start + 32 > (runtime.object.length - 2) / 2) fail(`OFFSET:invalid immutable substitution:${declaration.name}`);
      offsets.push(location.start); slots.push({ start: location.start, value });
    }
    substitutions.push({ name: declaration.name, astId: declaration.id, value, offsets: offsets.sort((a, b) => a - b) });
  }
  slots.sort((a, b) => a.start - b.start);
  for (let i = 1; i < slots.length; i++) if (slots[i].start < slots[i - 1].start + 32) fail('OVERLAP:duplicate or overlapping substitutions');
  const bytes = Buffer.from(runtime.object.slice(2), 'hex');
  for (const { start, value } of slots) {
    if (!bytes.subarray(start, start + 32).every(byte => byte === 0)) fail('PLACEHOLDER:immutable compiler word must be zero');
    Buffer.from(value.slice(2), 'hex').copy(bytes, start);
  }
  const expectedRuntime = `0x${bytes.toString('hex')}`;
  return { expectedRuntime, runtimeCodehash: keccak256(expectedRuntime), runtimeBytes: bytes.length, substitutions };
}

// Public CREATE schedule. Noncreation transactions 16..24 intentionally consume
// deployer nonces: setIndexModule, six registrations, two policy activations.
const deployments = [
  ['registry', 'src/TypeRegistry.sol', 'TypeRegistry', 0, []],
  ['acceptor', 'src/LabHarness.sol', 'MockAcceptor', 1, []],
  ['quoteAcceptor', 'src/LabAcceptors.sol', 'QuoteAcceptor', 2, []],
  ['labelAcceptor', 'src/LabAcceptors.sol', 'LabelAcceptor', 3, []],
  ['ledger', 'src/Ledger.sol', 'Ledger', 4, ['address', 'bytes32']],
  ['index', 'src/IndexModule.sol', 'IndexModule', 5, ['address']],
  ['failingIndex', 'src/LabHarness.sol', 'FailingIndexModule', 6, []],
  ['lens', 'src/LensReader.sol', 'LensReader', 7, ['address', 'address']],
  ['actorA', 'src/LabHarness.sol', 'Actor', 8, ['address']],
  ['actorB', 'src/LabHarness.sol', 'Actor', 9, ['address']],
  ['consumer', 'src/LabHarness.sol', 'Consumer', 10, ['address']],
  ['recon', 'src/LabHarness.sol', 'Reconstructor', 11, []],
  ['strictAcceptor', 'test/Falsify.t.sol', 'StrictQuoteAcceptor', 12, []],
  ['quoteRule', 'src/LabAcceptors.sol', 'MinBodyAcceptor', 13, ['uint256']],
  ['pairRule', 'src/LabAcceptors.sol', 'MinBodyAcceptor', 14, ['uint256']],
  ['statelessConsumer', 'src/JoinedConsumer.sol', 'StatelessConsumer', 15, ['address']],
  ['joinedConsumer', 'src/JoinedConsumer.sol', 'JoinedConsumer', 25, ['address', 'address', 'bytes32', 'bytes32', 'bytes32', 'bytes32']],
];

/**
 * Pure derivation from pinned, caller-read artifacts and source ASTs.
 * artifacts keys: "src/Ledger.sol:Ledger"; sourceAsts keys: "src/Ledger.sol".
 * Caller must establish compiler/source/artifact provenance before sealing.
 */
export function deriveBRuntimeTargets({ artifacts, sourceAsts, neutral, chainId = 31337 } = {}) {
  if (chainId !== 31337) fail('CHAIN:only declared fresh chain 31337 supported');
  const deployer = HDNodeWallet.fromPhrase('test test test test test test test test test test test junk', undefined, "m/44'/60'/0'/0/0").address.toLowerCase();
  const addresses = Object.fromEntries(deployments.map(([name, , , nonce]) => [name, getCreateAddress({ from: deployer, nonce }).toLowerCase()]));
  const addressWord = name => word('address', addresses[name]);
  const admin = word('address', deployer);
  const realmId = textHash('lab/realm/1');
  const constructorValues = {
    ledger: [addresses.registry, realmId], index: [addresses.ledger],
    lens: [addresses.ledger, addresses.index], actorA: [addresses.ledger], actorB: [addresses.ledger],
    consumer: [addresses.lens], quoteRule: [32], pairRule: [96], statelessConsumer: [addresses.lens],
  };
  const immutableValues = {
    registry: { admin }, acceptor: {}, quoteAcceptor: {}, labelAcceptor: {},
    ledger: {
      registry: addressWord('registry'), realmId, admin,
      // Ledger.sol constructor: no chainId, verifyingContract, or realm field.
      domainSeparator: keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32'], ['EIP712Domain(string name,string version)', 'EFS2-RoadB-Lab', '1'].map(textHash))),
    },
    // IndexModule.sol constructor asks newly deployed Ledger.counts(); no
    // admissions have occurred in the public nonce schedule, so attachedFrom=1.
    index: { ledger: addressWord('ledger'), admin, attachedFrom: word('uint64', 1) },
    failingIndex: {}, lens: { ledger: addressWord('ledger'), index: addressWord('index') },
    actorA: { ledger: addressWord('ledger') }, actorB: { ledger: addressWord('ledger') },
    consumer: { lens: addressWord('lens') }, recon: {}, strictAcceptor: {},
    quoteRule: { minBody: word('uint256', 32) }, pairRule: { minBody: word('uint256', 96) },
    statelessConsumer: { lens: addressWord('lens') },
  };
  const targets = {}, runtimeCodehashes = {};
  for (const [name, sourceName, contractName, nonce, expectedConstructor] of deployments) {
    if (name === 'joinedConsumer') {
      for (const hashName of ['quoteRule', 'pairRule', 'quoteAcceptor', 'labelAcceptor', 'ledger']) runtimeCodehashes[hashName] = targets[hashName].runtimeCodehash;
      const { types } = deriveBInputs({ neutral, runtimeCodehashes, chainId });
      immutableValues.joinedConsumer = { ledger: addressWord('ledger'), lens: addressWord('lens'), quoteType: types.QUOTE_J, pairType: types.PAIR, itemType: types.ITEM, labelType: types.LABEL };
      constructorValues.joinedConsumer = [addresses.ledger, addresses.lens, types.QUOTE_J, types.PAIR, types.ITEM, types.LABEL];
    }
    const artifact = artifacts?.[`${sourceName}:${contractName}`];
    if (!object(artifact)) fail(`ARTIFACT:missing:${sourceName}:${contractName}`);
    const constructors = Array.isArray(artifact.abi) ? artifact.abi.filter(entry => entry.type === 'constructor') : null;
    const actualConstructor = constructors?.length === 1 && Array.isArray(constructors[0].inputs) ? constructors[0].inputs.map(input => input.type) : constructors?.length === 0 ? [] : null;
    if (JSON.stringify(actualConstructor) !== JSON.stringify(expectedConstructor)) fail(`CONSTRUCTOR:ABI declaration mismatch:${contractName}`);
    const initcode = artifact.bytecode?.object;
    if (typeof initcode !== 'string' || !/^0x(?:[0-9a-fA-F]{2})+$/.test(initcode)) fail(`INITCODE:nonempty even-length hex required:${contractName}`);
    const expectedInitcode = `${initcode}${abi.encode(expectedConstructor, constructorValues[name] ?? []).slice(2)}`.toLowerCase();
    targets[name] = {
      sourceName, contractName, address: addresses[name], nonce,
      expectedInitcode, initcodeHash: keccak256(expectedInitcode), initcodeBytes: (expectedInitcode.length - 2) / 2,
      ...instantiateBRuntime({ artifact, sourceAst: sourceAsts?.[sourceName], sourceName, contractName, immutableValues: immutableValues[name] }),
    };
  }
  return { chainId, deployer, targets, runtimeCodehashes };
}
