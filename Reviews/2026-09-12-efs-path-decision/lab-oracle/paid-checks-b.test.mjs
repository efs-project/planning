import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { deriveBInputs, deriveBReadCoordinates } from './paid-vectors-b.mjs';

const require = createRequire(import.meta.url);
const { keccak256, toUtf8Bytes } = require('ethers');
const rawNeutral = readFileSync(new URL('../../../../planning/Reviews/2026-09-12-efs-path-decision/paid-neutral-expectations.json', import.meta.url));
const neutral = JSON.parse(rawNeutral);
const api = async () => import('./paid-checks-b.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('paid-checks-b.mjs')) assert.fail('Independent raw B check mapper is not implemented');
  throw error;
});
const word = value => BigInt(value).toString(16).padStart(64, '0');
const hexWord = value => value.slice(2).padStart(64, '0');
const bytes = (...words) => `0x${words.join('')}`;
const selector = signature => keccak256(toUtf8Bytes(signature)).slice(0, 10);
const ZERO = `0x${'0'.repeat(64)}`;
const opts = () => {
  const targets = {
    ledger: { address: '', runtime: '0x6001600055' },
    registry: { address: '0x1111111111111111111111111111111111111111', runtime: '0x6002' },
    index: { address: '0x2222222222222222222222222222222222222222', runtime: '0x6003' },
    acceptor: { address: '0x3333333333333333333333333333333333333333', runtime: '0x6004' },
    quoteRule: { address: '0x4444444444444444444444444444444444444444', runtime: '0x6005' },
    pairRule: { address: '0x5555555555555555555555555555555555555555', runtime: '0x6006' },
    quoteAcceptor: { address: '0x6666666666666666666666666666666666666666', runtime: '0x6007' },
    labelAcceptor: { address: '0x7777777777777777777777777777777777777777', runtime: '0x6008' },
  };
  const runtimeCodehashes = Object.fromEntries(['quoteRule', 'pairRule', 'quoteAcceptor', 'labelAcceptor'].map(name => [name, keccak256(targets[name].runtime)]));
  runtimeCodehashes.ledger = keccak256(targets.ledger.runtime);
  const vectorOptions = { neutral, runtimeCodehashes };
  const inputs = deriveBInputs(vectorOptions);
  const coordinates = deriveBReadCoordinates(vectorOptions);
  targets.ledger.address = coordinates.deployment.ledger.address;
  return { inputs, coordinates, targets };
};
const byLabel = result => Object.fromEntries(result.checks.afterB1.map(row => [row.label, row]));

test('neutral source bytes remain the independently authored seal', () => {
  assert.equal(createHash('sha256').update(rawNeutral).digest('hex'), 'ff7c4fc735504c9871e8241c7cc461293b7ffc37f3d5e9dd50840e005cc37795');
});

test('fresh-state counts and post-B1 checkpoint distinguish all four counters', async () => {
  const { deriveBChecks } = await api();
  const options = opts();
  const actual = deriveBChecks(options);
  const before = actual.checks.beforeFixture.find(row => row.label === 'counts');
  assert.equal(before.data, selector('counts()'));
  assert.equal(before.expected, bytes(word(0), word(0), word(0), word(0)));
  assert.equal(byLabel(actual).counts.expected, bytes(word(12), word(6), word(4), word(4)));
  assert.deepEqual(actual.checkpoint, {
    frontier: { admissions: '12', records: '6', bindings: '4', publications: '4' },
    indexGeneration: '0', registryEpoch: '8', coreCodeCommitment: keccak256(options.targets.ledger.runtime), realmId: options.coordinates.realmId,
  });
  assert.deepEqual(actual.initial, { registryEpoch: '8' });
  assert.equal(actual.evidenceCeiling, 'RPC_OBSERVED');
});

test('both stages assert the actual Ledger index attachment rather than merely reading an independent Index', async () => {
  const { deriveBChecks } = await api();
  const options = opts();
  const actual = deriveBChecks(options);
  for (const stage of ['beforeFixture', 'afterB1']) {
    assert.deepEqual(actual.checks[stage].find(row => row.label === 'ledger.indexModule'), {
      label: 'ledger.indexModule', to: options.targets.ledger.address,
      data: selector('indexModule()'), expected: bytes(hexWord(options.targets.index.address)),
    });
  }
});

test('both stages check the complete six-Type genesis profile with separately committed rules, policies and ordered refs', async () => {
  const { deriveBChecks } = await api();
  const options = opts();
  const actual = deriveBChecks(options);
  // Handwritten ABI words, independent of the mapper encoder and Type IDs in inputs.
  const domain = keccak256(toUtf8Bytes('efs2/type/1'));
  const typeIds = {};
  const descriptions = [
    ['QUOTE', 'quote', 'quoteRule', true, []],
    ['BINARY', 'binary', null, false, []],
    ['ITEM', 'item', null, false, []],
    ['PAIR', 'pair', 'pairRule', true, ['ITEM', 'ITEM']],
    ['QUOTE_J', 'quote-joined', 'quoteAcceptor', false, ['PAIR']],
    ['LABEL', 'label', 'labelAcceptor', false, []],
  ];
  for (const [label, shape, rule, policy, refNames] of descriptions) {
    const refs = refNames.map(name => typeIds[name]);
    const refsReturn = bytes(word(32), word(refs.length), ...refs.map(hexWord));
    const ruleHash = rule ? keccak256(options.targets[rule].runtime) : ZERO;
    typeIds[label] = keccak256(bytes(hexWord(domain), hexWord(keccak256(toUtf8Bytes(`lab/type/${shape}/1`))), hexWord(keccak256(refsReturn)), hexWord(ruleHash)));
    const expectedInfo = bytes(word(1), rule ? hexWord(options.targets[rule].address) : word(0), hexWord(ruleHash), policy ? hexWord(options.targets.acceptor.address) : word(0), policy ? hexWord(keccak256(options.targets.acceptor.runtime)) : word(0), word(refs.length), word(policy ? 2 : 1));
    for (const stage of ['beforeFixture', 'afterB1']) {
      const rows = Object.fromEntries(actual.checks[stage].map(row => [row.label, row]));
      assert.deepEqual(rows[`typeInfo.${label}`], { label: `typeInfo.${label}`, to: options.targets.registry.address, data: `${selector('typeInfo(bytes32)')}${hexWord(typeIds[label])}`, expected: expectedInfo });
      assert.deepEqual(rows[`refTypes.${label}`], { label: `refTypes.${label}`, to: options.targets.registry.address, data: `${selector('refTypes(bytes32)')}${hexWord(typeIds[label])}`, expected: refsReturn });
    }
  }
});

test('Type identity cannot be supplied with a changed shape or stale mandatory runtime hash', async () => {
  const { deriveBChecks } = await api();
  for (const mutate of [
    o => { o.inputs.types.QUOTE = ZERO; },
    o => { o.inputs.types.BINARY = ZERO; },
    o => { o.targets.quoteRule.runtime = '0x6009'; },
    o => { o.targets.pairRule.runtime = '0x6009'; },
    o => { o.targets.quoteAcceptor.runtime = '0x6009'; },
    o => { o.targets.labelAcceptor.runtime = '0x6009'; },
    o => { delete o.targets.acceptor; },
  ]) {
    const options = opts(); mutate(options);
    assert.throws(() => deriveBChecks(options));
  }
});

test('head tuple ordering keeps placement source, A2 previous head and B native head distinct', async () => {
  const { deriveBChecks } = await api();
  const options = opts();
  const rows = byLabel(deriveBChecks(options));
  const { inputs, coordinates, targets } = options;
  assert.deepEqual(rows.aPlacement, {
    label: 'aPlacement', to: targets.ledger.address,
    data: `${selector('head(bytes32)')}${hexWord(coordinates.bindings.A_PLACEMENT)}`,
    expected: bytes(word(1), word(1), word(7), word(0), word(2), hexWord(inputs.subject.FILE_QUOTE)),
  });
  assert.equal(rows.aHead.expected, bytes(word(1), word(2), word(10), word(6), word(1), hexWord(inputs.fixture.QUOTE_A2.id)));
  assert.equal(rows.bHead.expected, bytes(word(1), word(1), word(12), word(0), word(4), hexWord(inputs.fixture.QUOTE_B1.id)));
  assert.equal(rows.bPlacementAbsent.expected, bytes(word(0), word(0), word(0), word(0), word(0), hexWord(ZERO)));
  assert.equal(rows.bPlacementAbsent.data, `${selector('head(bytes32)')}${hexWord(coordinates.bindings.B_PLACEMENT)}`);
});

test('scope coverage and raw entry checks do not turn an empty slot into a completeness claim', async () => {
  const { deriveBChecks } = await api();
  const options = opts();
  const rows = byLabel(deriveBChecks(options));
  assert.equal(rows.scopeA.to, options.targets.index.address);
  assert.equal(rows.scopeA.data, `${selector('postingHead(bytes32)')}${hexWord(options.coordinates.scopes.A_FOLDER_SWAPS.scopeList)}`);
  assert.equal(rows.scopeA.expected, bytes(word(1), word(1), word(2), word(1)));
  assert.equal(rows.scopeB.expected, bytes(word(0), word(0), word(0), word(0)));
  assert.equal(rows['scopeA.entry0'].expected, bytes(word(2)));
  assert.equal(rows['scopeA.coverage'].expected, bytes(word(2), word(1), word(12)));
  assert.equal(rows['scopeB.coverage'].expected, bytes(word(2), word(1), word(12)));
  assert.equal(rows['index.gapped'].expected, bytes(word(0)));
  assert.equal(rows['aHead.history.entry0'].expected, bytes(word(6)));
  assert.equal(rows['aHead.history.entry1'].expected, bytes(word(10)));
});

test('record results encode dynamic bytes offset and retain all six immutable bodies', async () => {
  const { deriveBChecks } = await api();
  const options = opts();
  const rows = byLabel(deriveBChecks(options));
  for (const [name, first] of [['ITEM_ETH', 1], ['ITEM_USDC', 2], ['PAIR_ETH_USDC', 3], ['QUOTE_A1', 5], ['QUOTE_A2', 9], ['QUOTE_B1', 11]]) {
    const record = options.inputs.fixture[name];
    assert.equal(rows[`record.${name}`].data, `${selector('record(bytes32)')}${hexWord(record.id)}`);
    assert.equal(rows[`record.${name}`].expected, bytes(hexWord(record.typeId), word(first), word(1), word(128), word((record.body.length - 2) / 2), record.body.slice(2)));
  }
});

test('admission rows recover historical CAS and placement publication without selected-author laundering', async () => {
  const { deriveBChecks } = await api();
  const options = opts();
  const rows = byLabel(deriveBChecks(options));
  assert.equal(rows['admission.7'].data, `${selector('admission(uint64)')}${word(7)}`);
  assert.equal(rows['admission.7'].expected, bytes(word(3), word(3), word(2), word(2), word(0), word(0), hexWord(options.inputs.subject.FILE_QUOTE), hexWord(ZERO)));
  assert.equal(rows['admission.10'].expected, bytes(word(3), word(1), word(3), word(1), word(1), word(0), hexWord(options.inputs.fixture.QUOTE_A2.id), hexWord(ZERO)));
  assert.equal(rows['admission.5'].expected, bytes(word(1), word(1), word(2), word(0), word(0), word(0), hexWord(keccak256(options.inputs.fixture.QUOTE_A1.body)), hexWord(options.inputs.types.QUOTE_J)));
});

test('the separately fixed B tag marker targets the stable File and has its own admission, history and complete scope entry', async () => {
  const { deriveBChecks } = await api();
  const options = opts();
  const actual = deriveBChecks(options);
  const rows = byLabel(actual);
  const { inputs, coordinates, targets } = options;
  const file = inputs.subject.FILE_QUOTE;
  const scopeKey = keccak256(bytes(hexWord(keccak256(toUtf8Bytes('efs2/vk/binding-scope/1'))), hexWord(coordinates.principals.AUTHOR_A), hexWord(coordinates.purposes.TAG), hexWord(file)));
  const scopeList = keccak256(bytes(hexWord(keccak256(toUtf8Bytes('efs2/pk/1'))), word(0), word(10), word(0), hexWord(scopeKey)));
  assert.deepEqual(rows.aTag, { label: 'aTag', to: targets.ledger.address, data: `${selector('head(bytes32)')}${hexWord(coordinates.bindings.A_TAG)}`, expected: bytes(word(1), word(1), word(8), word(0), word(3), hexWord(file)) });
  assert.equal(rows['admission.8'].expected, bytes(word(3), word(4), word(2), word(3), word(0), word(0), hexWord(file), word(0)));
  assert.equal(rows['aTag.history'].expected, bytes(word(1), word(1), word(8), word(1)));
  assert.equal(rows['aTag.history.entry0'].expected, bytes(word(8)));
  assert.deepEqual(rows['aTag.scope'], { label: 'aTag.scope', to: targets.index.address, data: `${selector('postingHead(bytes32)')}${hexWord(scopeList)}`, expected: bytes(word(1), word(1), word(3), word(1)) });
  assert.equal(rows['aTag.scope.entry0'].data, `${selector('postingAt(bytes32,uint64)')}${hexWord(scopeList)}${word(0)}`);
  assert.equal(rows['aTag.scope.entry0'].expected, bytes(word(3)));
  assert.equal(rows['aTag.scope.coverage'].expected, bytes(word(2), word(1), word(12)));
  assert.ok(!actual.unverified.some(value => /TAG_MARKET|admission 8/.test(value)));
});

test('publication word assertions use ABI positions and expose unverified signature and execution basis fields', async () => {
  const { deriveBChecks } = await api();
  const options = opts();
  const actual = deriveBChecks(options);
  const rows = byLabel(actual);
  assert.equal(rows['publication.2'].data, `${selector('evidence(uint64)')}${word(2)}`);
  assert.deepEqual(rows['publication.2'].expectedWords, { byteLength: 416, equals: {
    0: bytes(hexWord(options.inputs.roles.AUTHOR_A.address)), 1: bytes(word(2)), 3: bytes(word(5)), 4: bytes(word(4)), 7: bytes(word(0)),
  } });
  assert.deepEqual(rows['publication.3'].expectedWords, { byteLength: 416, equals: {
    0: bytes(hexWord(options.inputs.roles.AUTHOR_A.address)), 1: bytes(word(2)), 3: bytes(word(2)), 4: bytes(word(9)), 7: bytes(word(1)),
  } });
  assert.equal(rows['publication.4'].expectedWords.equals[0], bytes(hexWord(options.inputs.roles.actorB.address)));
  assert.equal(rows['publication.4'].expectedWords.equals[1], bytes(word(1)));
  for (const index of [2, 5, 6]) assert.equal(rows['publication.4'].expectedWords.equals[index], ZERO);
  assert.ok(actual.unverified.some(value => /signature/i.test(value)));
  assert.ok(actual.unverified.some(value => /basis/i.test(value)));
  for (const row of [...actual.checks.beforeFixture, ...actual.checks.afterB1]) {
    assert.notEqual(row.expected === undefined, row.expectedWords === undefined, row.label);
  }
});

test('malformed targets, mismatched runtime origin and unsupported ordinal changes fail closed', async () => {
  const { deriveBChecks } = await api();
  for (const mutate of [
    o => { o.targets.ledger.runtime = '0x'; },
    o => { o.targets.registry.address = '0x1234'; },
    o => { delete o.targets.index; },
    o => { o.targets.ledger.address = o.targets.registry.address; },
    o => { o.targets.ledger.runtime = '0x6004'; },
    o => { o.coordinates.realmOrigin = ZERO; },
    o => { o.inputs.ordinals.placementAdmission = '8'; },
    o => { o.inputs.fixture.QUOTE_A1.body = '0x12'; },
    o => { o.coordinates.bindings.B_PLACEMENT = ZERO; },
  ]) {
    const options = opts(); mutate(options);
    assert.throws(() => deriveBChecks(options));
  }
});
