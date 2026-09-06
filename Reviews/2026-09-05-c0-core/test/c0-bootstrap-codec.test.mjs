import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AbiCoder, Interface, keccak256, toUtf8Bytes } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { encodeSeed as encodeSeedV1, decodeSeed as decodeSeedV1, encodeDeployment as encodeDeploymentV1, decodeDeployment as decodeDeploymentV1 } from '../../2026-09-04-mvp-c0-foundation/reference/run-codec.mjs';
import { compileStateful, TX_GAS, withStateful } from '../scripts/local-stateful.mjs';
import {
  encodeSeedV2, decodeSeedV2, experimentSeedV2, encodeDeploymentV2, decodeDeploymentV2,
  experimentCommitmentV2, c0ProfileId, selectionDigest, nullPolicyBytes, encodeSelection,
  decodeSelection, openSelection, initConfig, requireInitConfig,
} from '../reference/c0-bootstrap-codec.mjs';

const abi = AbiCoder.defaultAbiCoder();
const fixed = (value, width) => BigInt(value).toString(16).padStart(width * 2, '0');
const h = n => '0x' + fixed(n, 32);
const a = n => '0x' + fixed(n, 20);
const strip = value => value.slice(2);
const join = parts => '0x' + parts.map(value => value.startsWith('0x') ? strip(value) : value).join('');
const domain = value => keccak256(toUtf8Bytes(value));
const NULL_POLICY_BYTES = '0x0e735d47bf02b2e2b70a1f98558edb97e05716aefea4cfefca467ee81b6035d1';
const NULL_POLICY_HASH = '0x80d2031f82575d55c8f1d29a21b42e289fb7fa84b20e8ea27db9a16d385ddf81';

const selection = () => ({ initConfigVersion: 1, finalityRuleKind: 2, finalityParam: 1,
  upgradeAuthorityKind: 0, upgradeAuthorityRef: h(0), declaredTxGasLimit: 16777216n,
  nullPolicyHash: NULL_POLICY_HASH, bootstrapExecutor: a(0x21) });
const SELECTION_RAW = abi.encode(
  ['bytes32','uint16','uint8','uint32','uint8','bytes32','uint64','bytes32','address'],
  [domain('efs2/mvp-c0/initialization-selection/1'), 1, 2, 1, 0, h(0), 16777216n, NULL_POLICY_HASH, a(0x21)],
);
const SELECTION_DIGEST = '0x8c4d457812c3f0c62aeb450161e928a65340381d626d93a3502c4b828d34da65';

const baseSeed = () => ({
  namespace: 'efs2/mvp-c0/2026-09-03', runId: h(1),
  sourceCommitments: [{ label: 'c0/init-selection/1', digest: SELECTION_DIGEST }, { label: 'z', digest: h(3) }],
  toolchainCommitments: [{ label: 'node', digest: h(4) }], chainConfigCommitment: h(5),
  deploymentFactoryAddress: a(6), coreCreate2Salt: h(0), byteStoreCreate2Salt: h(0),
  coreCreationCodeTemplateHash: h(7), byteStoreCreationCodeTemplateHash: h(8), codexConstantsHash: h(9),
  indexCapabilityRoot: h(10), orderedTypeGroupRoot: h(11), schemaAuthorAddress: a(12),
  bootstrapAuthorAddress: a(13), byteMeasurementReportHash: h(14), maxStateFileBytes: 8192n,
  maxReadRangeBytes: 4096n, transactionGasMargin: 0n, stateGrowthMargin: 1n, destructionPolicyHash: h(15),
});
const seed = () => ({ base: baseSeed(), admissionLibraryCreate2Salt: h(0), preparationHelperCreate2Salt: h(0),
  admissionCreationCodeTemplateHash: h(16), preparationCreationCodeTemplateHash: h(17), coreLinkReferencesHash: h(18) });
const SEED_RAW = join([
  '0002', '0016656673322f6d76702d63302f323032362d30392d3033', h(1),
  '000200000035001363302f696e69742d73656c656374696f6e2f31', SELECTION_DIGEST,
  '0000002300017a', h(3), '00010000002600046e6f6465', h(4), h(5), a(6), h(0), h(0),
  h(7), h(8), h(9), h(10), h(11), a(12), a(13), h(14),
  '0000000000002000000000000000100000000000000000000000000000000001', h(15), h(0), h(0), h(16), h(17), h(18),
]);

const component = (account, first) => ({ account: a(account), create2Salt: h(0), initCodeHash: h(first), runtimeCodeHash: h(first + 1) });
const deployment = () => ({ experimentSeed: h(1), core: component(0x31, 41), byteStore: component(0x32, 43),
  admissionLibrary: component(0x33, 45), preparationHelper: component(0x34, 47) });
const componentRaw = value => join([value.account, value.create2Salt, value.initCodeHash, value.runtimeCodeHash]);
const DEPLOYMENT_RAW = join(['0002', h(1), componentRaw(component(0x31, 41)), componentRaw(component(0x32, 43)),
  componentRaw(component(0x33, 45)), componentRaw(component(0x34, 47))]);

const hashDomain = (name, values) => keccak256(abi.encode(
  Array(values.length + 1).fill('bytes32'), [domain(name), ...values],
));
const EXPECTED_SEED = '0x59d609567132e54f487f3a5d8b450974c9eb79c8c60c4f9c1dc89ff003530088';
const EXPECTED_COMMITMENT = '0xa426619b6ac27d3574136823eba0b668d49e38f6ca874cafcd2f3fec9055022e';
const EXPECTED_PROFILE = '0x56a2fa0a83f2dd325da8831c2034ab40d5fb8dca43e93af87cbf8bf77a6cf654';
const EXPECTED_POLICY = '0x0f3357d6cac3e4e31deecaf8dc6600381b3ad815c23fe911f29905d8fab8332a';
const INIT_CONFIG_RAW = abi.encode(['uint16','uint8','uint32','uint8','bytes32','uint64','bytes32'],
  [1, 2, 1, 0, h(0), 16777216n, EXPECTED_POLICY]);

function mutateByte(raw, offset, value) {
  const index = 2 + offset * 2;
  return raw.slice(0, index) + value.toString(16).padStart(2, '0') + raw.slice(index + 2);
}
function flipByte(raw, offset) {
  const index = 2 + offset * 2;
  return mutateByte(raw, offset, Number.parseInt(raw.slice(index, index + 2), 16) ^ 1);
}
function maxSeed() {
  const value = seed();
  value.base.sourceCommitments = [{ label: 'c0/init-selection/1', digest: SELECTION_DIGEST }];
  for (let i = 1; i < 64; ++i) value.base.sourceCommitments.push({ label: `d${String(i).padStart(2, '0')}`.padEnd(64, 'z'), digest: h(i + 1) });
  value.base.toolchainCommitments = Array.from({ length: 64 }, (_, i) => ({ label: `a${String(i).padStart(2, '0')}`.padEnd(64, 'z'), digest: h(i + 100) }));
  return value;
}
function minSeed() {
  const value = seed();
  value.base.sourceCommitments = [{ label: 'c0/init-selection/1', digest: SELECTION_DIGEST }];
  value.base.toolchainCommitments = [{ label: 'a', digest: h(4) }];
  return value;
}

test('independent selection, V1-wrapper seed, deployment and InitConfig fixtures match exactly', () => {
  assert.equal((SELECTION_RAW.length - 2) / 2, 288);
  assert.equal((SEED_RAW.length - 2) / 2, 772);
  assert.equal((DEPLOYMENT_RAW.length - 2) / 2, 498);
  assert.equal((INIT_CONFIG_RAW.length - 2) / 2, 224);
  assert.equal(encodeSelection(selection()), SELECTION_RAW);
  assert.deepEqual(decodeSelection(SELECTION_RAW), selection());
  assert.equal(encodeSeedV2(seed()), SEED_RAW);
  assert.deepEqual(decodeSeedV2(SEED_RAW), seed());
  assert.equal(encodeDeploymentV2(deployment()), DEPLOYMENT_RAW);
  assert.deepEqual(decodeDeploymentV2(DEPLOYMENT_RAW), deployment());
  assert.equal(initConfig(selection(), EXPECTED_COMMITMENT), INIT_CONFIG_RAW);
});

test('literal domain commitments bind exact framed bytes and profile input', () => {
  assert.equal(NULL_POLICY_BYTES, abi.encode(['bytes32'], [domain('efs2/mvp-c0/null-policy/1')]));
  assert.equal(NULL_POLICY_HASH, keccak256(NULL_POLICY_BYTES));
  assert.equal(SELECTION_DIGEST, keccak256(SELECTION_RAW));
  assert.equal(EXPECTED_SEED, hashDomain('efs2/mvp-c0/experiment-seed/2', [keccak256(SEED_RAW)]));
  assert.equal(EXPECTED_COMMITMENT, hashDomain('efs2/mvp-c0/experiment-deployment/2', [h(1), keccak256(DEPLOYMENT_RAW)]));
  assert.equal(EXPECTED_PROFILE, hashDomain('efs2/mvp-c0/profile/1', [EXPECTED_COMMITMENT]));
  assert.equal(EXPECTED_POLICY, hashDomain('efs2/mvp-c0/initial-policy/1', [NULL_POLICY_HASH, EXPECTED_COMMITMENT]));
  assert.equal(experimentSeedV2(seed()), EXPECTED_SEED);
  assert.equal(experimentCommitmentV2(deployment()), EXPECTED_COMMITMENT);
  assert.equal(c0ProfileId(EXPECTED_COMMITMENT), EXPECTED_PROFILE);
  assert.equal(selectionDigest(seed()), SELECTION_DIGEST);
  assert.equal(nullPolicyBytes(), NULL_POLICY_BYTES);
  assert.throws(() => c0ProfileId(h(0)));
});

test('all compact frame prefixes, suffixes and cross-version inputs refuse', () => {
  for (const [decode, raw] of [[decodeSeedV2, SEED_RAW], [decodeDeploymentV2, DEPLOYMENT_RAW], [decodeSelection, SELECTION_RAW]]) {
    for (let i = 2; i < raw.length; i += 2) assert.throws(() => decode(raw.slice(0, i)), `prefix ${i}`);
    assert.throws(() => decode(raw + '00'));
    assert.throws(() => decode(raw + 'f'));
  }
  assert.throws(() => decodeSeedV1(SEED_RAW));
  assert.throws(() => decodeDeploymentV1(DEPLOYMENT_RAW));
  assert.throws(() => decodeSeedV2(encodeSeedV1(baseSeed())));
  const old = { experimentSeed: h(1), coreAddress: a(2), coreCreate2Salt: h(0), coreInitCodeHash: h(3),
    coreRuntimeCodeHash: h(4), byteStoreAddress: a(5), byteStoreCreate2Salt: h(0),
    byteStoreInitCodeHash: h(6), byteStoreRuntimeCodeHash: h(7) };
  assert.throws(() => decodeDeploymentV2(encodeDeploymentV1(old)));
});

test('required label narrows valid seed extrema while the outer grammar ceiling remains a refusal guard', () => {
  const minimum = encodeSeedV2(minSeed());
  const maximum = encodeSeedV2(maxSeed());
  assert.equal((minimum.length - 2) / 2, 730);
  assert.equal((maximum.length - 2) / 2, 13645);
  assert.deepEqual(decodeSeedV2(minimum), minSeed());
  assert.deepEqual(decodeSeedV2(maximum), maxSeed());
  assert.throws(() => decodeSeedV2(maximum + '00'.repeat(45)));
  assert.throws(() => decodeSeedV2(maximum + '00'.repeat(46)));
});

test('original arrays must be dense own-index inputs before V1 validation', () => {
  for (const field of ['sourceCommitments', 'toolchainCommitments']) {
    const value = seed();
    const inherited = value.base[field][0];
    value.base[field] = new Array(value.base[field].length);
    if (value.base[field].length > 1) value.base[field][1] = seed().base[field][1];
    Array.prototype[0] = inherited;
    try { assert.throws(() => encodeSeedV2(value), /own array index/); }
    finally { delete Array.prototype[0]; }
    const hole = seed();
    delete hole.base[field][0];
    assert.throws(() => encodeSeedV2(hole), /own array index/);
  }
});

test('V1 commitment count, label width and unsigned order remain binding', () => {
  for (const field of ['sourceCommitments', 'toolchainCommitments']) {
    const tooMany = seed();
    tooMany.base[field] = Array.from({ length: 65 }, (_, i) => ({ label: `a${String(i).padStart(2, '0')}`, digest: h(i + 1) }));
    assert.throws(() => encodeSeedV2(tooMany));
  }
  const width = minSeed();
  width.base.toolchainCommitments[0].label = 'a'.repeat(64);
  assert.equal(decodeSeedV2(encodeSeedV2(width)).base.toolchainCommitments[0].label.length, 64);
  width.base.toolchainCommitments[0].label += 'a';
  assert.throws(() => encodeSeedV2(width));
  const ordered = minSeed();
  ordered.base.sourceCommitments = [{ label: '-', digest: h(1) }, { label: 'A', digest: h(2) }, { label: 'c0/init-selection/1', digest: SELECTION_DIGEST }];
  assert.deepEqual(decodeSeedV2(encodeSeedV2(ordered)).base.sourceCommitments, ordered.base.sourceCommitments);
  ordered.base.sourceCommitments.reverse();
  assert.throws(() => encodeSeedV2(ordered));
});

test('V2 seed suffix and unique reserved selection membership are strict', () => {
  for (const field of ['admissionCreationCodeTemplateHash', 'preparationCreationCodeTemplateHash', 'coreLinkReferencesHash']) {
    assert.throws(() => encodeSeedV2({ ...seed(), [field]: h(0) }), field);
  }
  const missing = seed();
  missing.base.sourceCommitments = [{ label: 'a', digest: h(1) }];
  assert.throws(() => encodeSeedV2(missing));
  const duplicate = seed();
  duplicate.base.sourceCommitments = [{ label: 'c0/init-selection/1', digest: h(1) }, { label: 'c0/init-selection/1', digest: h(2) }];
  assert.throws(() => encodeSeedV2(duplicate));
  const altered = seed();
  altered.base.sourceCommitments[0] = { ...altered.base.sourceCommitments[0], digest: h(99) };
  assert.equal(selectionDigest(altered), h(99));
  assert.throws(() => openSelection(SELECTION_RAW, selectionDigest(altered)));
  const executorRaw = abi.encode(
    ['bytes32','uint16','uint8','uint32','uint8','bytes32','uint64','bytes32','address'],
    [domain('efs2/mvp-c0/initialization-selection/1'), 1, 2, 1, 0, h(0), 16777216n, NULL_POLICY_HASH, a(0x22)],
  );
  const executorSeed = seed();
  executorSeed.base.sourceCommitments[0] = { ...executorSeed.base.sourceCommitments[0], digest: keccak256(executorRaw) };
  assert.notEqual(experimentSeedV2(executorSeed), EXPECTED_SEED, 'valid executor mutation changes seed commitment');
  assert.deepEqual(openSelection(executorRaw, selectionDigest(executorSeed)), { ...selection(), bootstrapExecutor: a(0x22) });
  for (const field of ['admissionLibraryCreate2Salt','preparationHelperCreate2Salt','admissionCreationCodeTemplateHash','preparationCreationCodeTemplateHash','coreLinkReferencesHash']) {
    assert.notEqual(experimentSeedV2({ ...seed(), [field]: h(99) }), EXPECTED_SEED, field);
  }
  assert.throws(() => decodeSeedV2(mutateByte(SEED_RAW, 1, 3)));
});

test('wide seed and selection values preserve bigint and canonical decimal while refusing Numbers and coercion', () => {
  const max = (1n << 64n) - 1n;
  for (const field of ['maxStateFileBytes','maxReadRangeBytes','transactionGasMargin','stateGrowthMargin']) {
    const value = seed(); value.base.maxStateFileBytes = max; value.base[field] = max;
    assert.equal(decodeSeedV2(encodeSeedV2(value)).base[field], max);
    for (const bad of [1, -1n, 1n << 64n, '01', '-1', '1.0', '1e3', { valueOf: () => 1n }]) {
      assert.throws(() => encodeSeedV2({ ...seed(), base: { ...baseSeed(), [field]: bad } }));
    }
  }
  const maxSelection = { ...selection(), declaredTxGasLimit: max };
  assert.equal(decodeSelection(encodeSelection(maxSelection)).declaredTxGasLimit, max);
  assert.equal(decodeSelection(encodeSelection({ ...selection(), declaredTxGasLimit: max.toString() })).declaredTxGasLimit, max);
  for (const bad of [16777216, -1n, 1n << 64n, '016777216', '1e3', { toString: () => '16777216' }]) assert.throws(() => encodeSelection({ ...selection(), declaredTxGasLimit: bad }));
});

test('deployment validates version, all required hashes and all six account inequalities', () => {
  assert.throws(() => decodeDeploymentV2(mutateByte(DEPLOYMENT_RAW, 1, 1)));
  assert.throws(() => encodeDeploymentV2({ ...deployment(), experimentSeed: h(0) }));
  const names = ['core','byteStore','admissionLibrary','preparationHelper'];
  for (const name of names) for (const field of ['initCodeHash','runtimeCodeHash']) {
    const value = deployment(); value[name] = { ...value[name], [field]: h(0) };
    assert.throws(() => encodeDeploymentV2(value));
  }
  for (let left = 0; left < 4; ++left) for (let right = left + 1; right < 4; ++right) {
    const value = deployment(); value[names[right]] = { ...value[names[right]], account: value[names[left]].account };
    assert.throws(() => encodeDeploymentV2(value));
  }
  const zero = deployment(); zero.core = { ...zero.core, account: a(0) };
  assert.throws(() => encodeDeploymentV2(zero));
});

test('every deployment field affects commitment while zero salts remain legal', () => {
  const expected = experimentCommitmentV2(deployment());
  assert.equal(decodeDeploymentV2(DEPLOYMENT_RAW).core.create2Salt, h(0));
  const names = ['core','byteStore','admissionLibrary','preparationHelper'];
  assert.notEqual(experimentCommitmentV2({ ...deployment(), experimentSeed: h(99) }), expected);
  for (const [index, name] of names.entries()) for (const field of ['account','create2Salt','initCodeHash','runtimeCodeHash']) {
    const value = deployment(); const changed = field === 'account' ? a(0x80 + index) : h(0x80 + index);
    value[name] = { ...value[name], [field]: changed };
    assert.notEqual(experimentCommitmentV2(value), expected, `${name}.${field}`);
  }
});

test('selection validates every finality mode, scalar canonicality, policy and authenticated opening', () => {
  for (let kind = 0; kind <= 3; ++kind) {
    const value = { ...selection(), finalityRuleKind: kind, finalityParam: kind === 2 ? 1 : 0 };
    assert.deepEqual(decodeSelection(encodeSelection(value)), value);
  }
  for (const value of [
    { ...selection(), initConfigVersion: 2 }, { ...selection(), finalityRuleKind: 4 },
    { ...selection(), finalityParam: 0 }, { ...selection(), finalityRuleKind: 1, finalityParam: 1 },
    { ...selection(), upgradeAuthorityKind: 1 }, { ...selection(), upgradeAuthorityRef: h(1) },
    { ...selection(), declaredTxGasLimit: 16777215n }, { ...selection(), nullPolicyHash: h(1) },
    { ...selection(), bootstrapExecutor: a(0) },
  ]) assert.throws(() => encodeSelection(value));
  assert.throws(() => decodeSelection(mutateByte(SELECTION_RAW, 0, 1)));
  assert.throws(() => decodeSelection(mutateByte(SELECTION_RAW, 32, 1)));
  assert.deepEqual(openSelection(SELECTION_RAW, SELECTION_DIGEST), selection());
  assert.throws(() => openSelection(SELECTION_RAW, h(0)));
  assert.throws(() => openSelection(SELECTION_RAW, h(1)));
});

test('InitConfig is exact, omits executor and refuses every altered word and length', () => {
  assert.equal(initConfig(selection(), EXPECTED_COMMITMENT), INIT_CONFIG_RAW);
  assert.equal(requireInitConfig(INIT_CONFIG_RAW, selection(), EXPECTED_COMMITMENT), undefined);
  assert.equal(initConfig({ ...selection(), bootstrapExecutor: a(0x22) }, EXPECTED_COMMITMENT), INIT_CONFIG_RAW);
  assert.notEqual(encodeSelection({ ...selection(), bootstrapExecutor: a(0x22) }), SELECTION_RAW);
  for (let word = 0; word < 7; ++word) assert.throws(() => requireInitConfig(flipByte(INIT_CONFIG_RAW, word * 32 + 31), selection(), EXPECTED_COMMITMENT));
  assert.throws(() => requireInitConfig(INIT_CONFIG_RAW.slice(0, -2), selection(), EXPECTED_COMMITMENT));
  assert.throws(() => requireInitConfig(INIT_CONFIG_RAW + '00', selection(), EXPECTED_COMMITMENT));
  assert.throws(() => requireInitConfig(INIT_CONFIG_RAW, selection(), h(99)));
  assert.throws(() => initConfig(selection(), h(0)));
});

function assertHex(actual, expected, field) {
  assert.equal(actual.toLowerCase(), expected.toLowerCase(), field);
}

function assertSelectionResult(actual, expected) {
  for (const field of ['initConfigVersion', 'finalityRuleKind', 'finalityParam', 'upgradeAuthorityKind', 'declaredTxGasLimit']) {
    assert.equal(actual[field], BigInt(expected[field]), field);
  }
  for (const field of ['upgradeAuthorityRef', 'nullPolicyHash', 'bootstrapExecutor']) {
    assertHex(actual[field], expected[field], field);
  }
}

function assertCommitmentResults(actual, expected, field) {
  assert.equal(actual.length, expected.length, `${field}.length`);
  for (let index = 0; index < expected.length; ++index) {
    assert.equal(actual[index].label, expected[index].label, `${field}[${index}].label`);
    assertHex(actual[index].digest, expected[index].digest, `${field}[${index}].digest`);
  }
}

function assertSeedResult(actual, expected) {
  assert.equal(actual.base.namespace, expected.base.namespace, 'base.namespace');
  for (const field of [
    'runId', 'chainConfigCommitment', 'coreCreate2Salt', 'byteStoreCreate2Salt',
    'coreCreationCodeTemplateHash', 'byteStoreCreationCodeTemplateHash', 'codexConstantsHash',
    'indexCapabilityRoot', 'orderedTypeGroupRoot', 'byteMeasurementReportHash', 'destructionPolicyHash',
  ]) assertHex(actual.base[field], expected.base[field], `base.${field}`);
  for (const field of ['deploymentFactoryAddress', 'schemaAuthorAddress', 'bootstrapAuthorAddress']) {
    assertHex(actual.base[field], expected.base[field], `base.${field}`);
  }
  assertCommitmentResults(actual.base.sourceCommitments, expected.base.sourceCommitments, 'base.sourceCommitments');
  assertCommitmentResults(actual.base.toolchainCommitments, expected.base.toolchainCommitments, 'base.toolchainCommitments');
  for (const field of ['maxStateFileBytes', 'maxReadRangeBytes', 'transactionGasMargin', 'stateGrowthMargin']) {
    assert.equal(actual.base[field], BigInt(expected.base[field]), `base.${field}`);
  }
  for (const field of [
    'admissionLibraryCreate2Salt', 'preparationHelperCreate2Salt', 'admissionCreationCodeTemplateHash',
    'preparationCreationCodeTemplateHash', 'coreLinkReferencesHash',
  ]) assertHex(actual[field], expected[field], field);
}

function assertComponentResult(actual, expected, field) {
  assertHex(actual.account, expected.account, `${field}.account`);
  for (const name of ['create2Salt', 'initCodeHash', 'runtimeCodeHash']) {
    assertHex(actual[name], expected[name], `${field}.${name}`);
  }
}

function assertDeploymentResult(actual, expected) {
  assertHex(actual.experimentSeed, expected.experimentSeed, 'experimentSeed');
  for (const field of ['core', 'byteStore', 'admissionLibrary', 'preparationHelper']) {
    assertComponentResult(actual[field], expected[field], field);
  }
}

test('deployed pure Solidity receiver agrees with independent bytes and hashes under normal caps', { timeout: 240000 }, async t => {
  compileStateful();
  const artifact = JSON.parse(readFileSync(new URL('../out/C0BootstrapCodecHarness.sol/C0BootstrapCodecHarness.json', import.meta.url)));
  const iface = new Interface(artifact.abi);
  assert((artifact.bytecode.object.length - 2) / 2 <= 49152, 'initcode ceiling');
  assert((artifact.deployedBytecode.object.length - 2) / 2 <= 24576, 'runtime ceiling');
  const resources = await withStateful(async lab => {
    const transaction = await lab.send(artifact.bytecode.object);
    const receipt = await lab.receipt(transaction);
    assert.equal(receipt.status, '0x1');
    assert(BigInt(receipt.gasUsed) <= TX_GAS, 'deployment transaction ceiling');
    const deployed = await lab.rpc('eth_getCode', [receipt.contractAddress, receipt.blockNumber]);
    assert.equal(deployed, artifact.deployedBytecode.object);
    const call = async (name, args) => {
      const data = iface.encodeFunctionData(name, args);
      const raw = await lab.rpc('eth_call', [{ to: receipt.contractAddress, data, gas: '0x1000000' }, 'latest']);
      const decoded = iface.decodeFunctionResult(name, raw);
      return decoded.length === 0 ? undefined : decoded[0];
    };
    assert.equal(await call('encodeSelection', [selection()]), SELECTION_RAW);
    const opened = await call('openSelection', [SELECTION_RAW, SELECTION_DIGEST]);
    assertSelectionResult(opened, selection());
    assert.equal(await call('nullPolicyBytes', []), NULL_POLICY_BYTES);
    assert.equal(await call('encodeSeed', [seed()]), SEED_RAW);
    const decodedSeed = await call('decodeSeed', [SEED_RAW]);
    assertSeedResult(decodedSeed, seed());
    assert.equal(await call('selectionDigest', [seed()]), SELECTION_DIGEST);
    assert.equal(await call('experimentSeed', [seed()]), EXPECTED_SEED);
    assert.equal(await call('encodeDeployment', [deployment()]), DEPLOYMENT_RAW);
    const decodedDeployment = await call('decodeDeployment', [DEPLOYMENT_RAW]);
    assertDeploymentResult(decodedDeployment, deployment());
    assert.equal(await call('experimentCommitment', [deployment()]), EXPECTED_COMMITMENT);
    assert.equal(await call('c0ProfileId', [EXPECTED_COMMITMENT]), EXPECTED_PROFILE);
    assert.equal(await call('initConfig', [selection(), EXPECTED_COMMITMENT]), INIT_CONFIG_RAW);
    await call('requireInitConfig', [INIT_CONFIG_RAW, selection(), EXPECTED_COMMITMENT]);
    const maxSelection = { ...selection(), declaredTxGasLimit: (1n << 64n) - 1n };
    assertSelectionResult(await call('decodeSelection', [await call('encodeSelection', [maxSelection])]), maxSelection);
    const maxSeedU64 = seed();
    maxSeedU64.base = { ...maxSeedU64.base, maxStateFileBytes: (1n << 64n) - 1n,
      maxReadRangeBytes: (1n << 64n) - 1n, transactionGasMargin: (1n << 64n) - 1n,
      stateGrowthMargin: (1n << 64n) - 1n };
    assertSeedResult(await call('decodeSeed', [await call('encodeSeed', [maxSeedU64])]), maxSeedU64);
    return { gas: BigInt(receipt.gasUsed), initcodeBytes: (artifact.bytecode.object.length - 2) / 2,
      runtimeBytes: (deployed.length - 2) / 2, cleanup: lab.cleanup };
  });
  assert.equal(resources.cleanup.stopped, true, 'managed runner cleanup');
  t.diagnostic(`pure bootstrap receiver deployment gas=${resources.gas} initcode=${resources.initcodeBytes} runtime=${resources.runtimeBytes}`);
});
