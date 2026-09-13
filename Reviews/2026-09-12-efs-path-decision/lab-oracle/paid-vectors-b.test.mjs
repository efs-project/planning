import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { keccak256: hash } = require('ethers');
const rawNeutral = readFileSync(new URL('../../../../planning/Reviews/2026-09-12-efs-path-decision/paid-neutral-expectations.json', import.meta.url));
const neutral = JSON.parse(rawNeutral);
const runtimeCodehashes = Object.fromEntries(['quoteRule', 'pairRule', 'quoteAcceptor', 'labelAcceptor', 'ledger'].map((name, i) => [name, `0x${String(i + 1).repeat(64)}`]));
const options = () => ({ neutral: structuredClone(neutral), runtimeCodehashes: { ...runtimeCodehashes }, placementBudget: '16' });
const api = async () => import('./paid-vectors-b.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes('paid-vectors-b.mjs')) assert.fail('Independent B vector module has not been implemented');
  throw error;
});

// Test-side ABI words are handwritten, not produced by the module or AbiCoder.
const ZERO = '0'.repeat(64);
const ONE = `${'0'.repeat(63)}1`;
const TWO = `${'0'.repeat(63)}2`;
const OFFSET = `${'0'.repeat(62)}20`;
const bare = hex => hex.slice(2);
const wordsHash = (...words) => hash(`0x${words.join('')}`);
const domType = hash('0x656673322f747970652f31'); // UTF-8 efs2/type/1
const domRecord = hash('0x656673322f7265636f72642f31'); // UTF-8 efs2/record/1
const itemShape = hash('0x6c61622f747970652f6974656d2f31'); // UTF-8 lab/type/item/1
const refsEmpty = wordsHash(OFFSET, ZERO);
const handItemType = wordsHash(bare(domType), bare(itemShape), bare(refsEmpty), ZERO);
const handItemEth = wordsHash(bare(domRecord), bare(handItemType), bare(hash(`0x${ONE}`)));
const handItemUsdc = wordsHash(bare(domRecord), bare(handItemType), bare(hash(`0x${TWO}`)));

test('fixture source is the requirements-only manifest at the independently supplied seal', () => {
  assert.equal(createHash('sha256').update(rawNeutral).digest('hex'), 'ff7c4fc735504c9871e8241c7cc461293b7ffc37f3d5e9dd50840e005cc37795');
});

test('Type and Item IDs match manually laid out ABI preimages, and Pair preserves ordered references', async () => {
  const { deriveBInputs } = await api();
  const actual = deriveBInputs(options());
  assert.equal(actual.types.ITEM, handItemType);
  assert.deepEqual(actual.fixture.ITEM_ETH, { typeId: handItemType, body: `0x${ONE}`, id: handItemEth });
  assert.deepEqual(actual.fixture.ITEM_USDC, { typeId: handItemType, body: `0x${TWO}`, id: handItemUsdc });
  assert.equal(actual.fixture.PAIR_ETH_USDC.body, `0x${bare(handItemEth)}${bare(handItemUsdc)}${ONE}`);
});

test('all public interface inputs are complete, correctly normalized and retain physical ordinal distinctions', async () => {
  const { deriveBInputs } = await api();
  const actual = deriveBInputs(options());
  assert.deepEqual(Object.keys(actual).sort(), ['expect', 'fixture', 'lenses', 'ordinals', 'placementExpect', 'roles', 'subject', 'types']);
  assert.deepEqual(Object.keys(actual.types), ['QUOTE', 'BINARY', 'ITEM', 'PAIR', 'QUOTE_J', 'LABEL']);
  assert.deepEqual(Object.keys(actual.fixture), ['ITEM_ETH', 'ITEM_USDC', 'PAIR_ETH_USDC', 'QUOTE_A1', 'QUOTE_A2', 'QUOTE_B1']);
  const expectFields = ['subject', 'expectedHead', 'selectedAuthor', 'selectedProofKind', 'pairId', 'itemA', 'itemB', 'mantissa', 'scale', 'observedAt', 'noteCommitment', 'basisAdmission'];
  for (const row of Object.values(actual.expect)) assert.deepEqual(Object.keys(row), expectFields);
  assert.deepEqual(actual.ordinals, { placementAdmission: '7', placementPublication: '2', placementRevision: '1', aHeadAdmission: '10', aHeadRevision: '2', bHeadAdmission: '12', bHeadRevision: '1', postB1Frontier: '12', registryEpoch: '8', indexGeneration: '0' });
  for (const [role, index] of [['deployer', 0], ['AUTHOR_A', 1], ['paidCaller', 3]]) {
    assert.equal(actual.roles[role].derivationIndex, index);
    assert.match(actual.roles[role].address, /^0x[0-9a-f]{40}$/);
  }
  assert.equal(actual.roles.actorB.deploymentNonce, 9);
  assert.equal(new Set(Object.values(actual.roles).map(x => x.address)).size, 4);
});

test('Quote ABI uses the semantic fields in order and keeps the note commitment separate from note bytes', async () => {
  const { deriveBInputs } = await api();
  const actual = deriveBInputs(options());
  // Quote A1: pairId, 0x9502f900, 6, 0x6b49d200, keccak(reference quote).
  const note = hash('0x7265666572656e63652071756f7465');
  const a1Tail = `${'0'.repeat(56)}9502f900${'0'.repeat(63)}6${'0'.repeat(56)}6b49d200${bare(note)}`;
  assert.equal(actual.fixture.QUOTE_A1.body, `0x${bare(actual.fixture.PAIR_ETH_USDC.id)}${a1Tail}`);
  assert.equal(actual.expect.A_FIRST.mantissa, '2502000000');
  assert.equal(actual.expect.B_FIRST.mantissa, '2501000000');
  assert.equal(actual.expect.A_FIRST.scale, '6');
  assert.equal(actual.expect.A_FIRST.observedAt, '1800000000');
  assert.equal(actual.expect.A_FIRST.noteCommitment, note);
  for (const name of ['QUOTE_A1', 'QUOTE_A2', 'QUOTE_B1']) assert.equal(actual.fixture[name].body.length, 322);
});

test('changed Pair rule propagates through Pair Type and ID to joined Quote Type, bodies and IDs', async () => {
  const { deriveBInputs } = await api();
  const before = deriveBInputs(options());
  const altered = options(); altered.runtimeCodehashes.pairRule = `0x${'a'.repeat(64)}`;
  const after = deriveBInputs(altered);
  for (const key of ['PAIR', 'QUOTE_J']) assert.notEqual(after.types[key], before.types[key]);
  for (const key of ['PAIR_ETH_USDC', 'QUOTE_A1', 'QUOTE_A2', 'QUOTE_B1']) assert.notEqual(after.fixture[key].id, before.fixture[key].id);
  assert.equal(after.fixture.PAIR_ETH_USDC.body, before.fixture.PAIR_ETH_USDC.body);
  assert.notEqual(after.fixture.QUOTE_A1.body, before.fixture.QUOTE_A1.body);
  assert.deepEqual(after.fixture.ITEM_ETH, before.fixture.ITEM_ETH);
  assert.deepEqual(after.subject, before.subject);
});

test('each acceptor hash binds only its declared Type graph', async () => {
  const { deriveBInputs } = await api();
  const base = deriveBInputs(options());
  for (const [rule, type] of [['quoteRule', 'QUOTE'], ['quoteAcceptor', 'QUOTE_J'], ['labelAcceptor', 'LABEL']]) {
    const altered = options(); altered.runtimeCodehashes[rule] = `0x${'f'.repeat(64)}`;
    const actual = deriveBInputs(altered);
    assert.notEqual(actual.types[type], base.types[type]);
    assert.equal(actual.types.ITEM, base.types.ITEM);
    assert.equal(actual.types.PAIR, base.types.PAIR);
    if (rule === 'quoteAcceptor') assert.notEqual(actual.fixture.QUOTE_A2.id, base.fixture.QUOTE_A2.id);
    else assert.equal(actual.fixture.QUOTE_A2.id, base.fixture.QUOTE_A2.id);
  }
});

test('B-first content selection never substitutes B provenance for the one A1 placement', async () => {
  const { deriveBInputs } = await api();
  const actual = deriveBInputs(options());
  assert.deepEqual(actual.lenses.LENS_A_FIRST, [actual.roles.AUTHOR_A.address, actual.roles.actorB.address]);
  assert.deepEqual(actual.lenses.LENS_B_FIRST, [actual.roles.actorB.address, actual.roles.AUTHOR_A.address]);
  assert.equal(actual.expect.A_FIRST.expectedHead, actual.fixture.QUOTE_A2.id);
  assert.equal(actual.expect.B_FIRST.expectedHead, actual.fixture.QUOTE_B1.id);
  assert.equal(actual.expect.A_FIRST.selectedProofKind, '2');
  assert.equal(actual.expect.B_FIRST.selectedProofKind, '1');
  assert.equal(actual.expect.B_FIRST.selectedAuthor, actual.roles.actorB.address);
  assert.deepEqual(actual.placementExpect, { folder: hash('0x2f7377617073'), nameRole: hash('0x6574682d75736463'), actor: actual.roles.AUTHOR_A.address, proofKind: '2', publication: '2', budget: '16' });
  assert.notEqual(actual.expect.B_FIRST.selectedAuthor, actual.placementExpect.actor);
});

test('wrong neutral scope, semantic labels, item order and placement author are rejected', async () => {
  const { deriveBInputs } = await api();
  for (const mutate of [
    n => { n.fixtures.oneAPlacement.coordinate.parent = '/other'; },
    n => { n.fixtures.subject = 'OTHER_FILE'; },
    n => { n.fixtures.oneAPlacement.coordinate.name = 'usdc-eth'; },
    n => { n.fixtures.pair.orderedItems.reverse(); },
    n => { n.fixtures.tag.subject = 'QUOTE_A1'; },
    n => { n.fixtures.oneAPlacement.provenance.actor = 'AUTHOR_B'; },
    n => { n.rows.find(x => x.row === 'POINT_B_FIRST').selectedHead = 'QUOTE_A2'; },
    n => { n.paidCommon.candidateCoverage.expectedHeads = ['QUOTE_A1', 'QUOTE_B1']; },
  ]) {
    const altered = options(); mutate(altered.neutral);
    assert.throws(() => deriveBInputs(altered), /NEUTRAL_MISMATCH/);
  }
});

test('missing or malformed runtime hashes and unsupported chain profiles fail closed', async () => {
  const { deriveBInputs } = await api();
  for (const key of Object.keys(runtimeCodehashes)) {
    for (const bad of [undefined, '0x12', 'not-a-hash', `0x${'0'.repeat(64)}`]) {
      const altered = options(); altered.runtimeCodehashes[key] = bad;
      assert.throws(() => deriveBInputs(altered), /RUNTIME_CODEHASH/);
    }
  }
  assert.throws(() => deriveBInputs({ ...options(), chainId: 1 }), /PROFILE/);
  assert.throws(() => deriveBInputs({ ...options(), placementBudget: '0' }), /BUDGET/);
  assert.throws(() => deriveBInputs({ ...options(), placementBudget: '016' }), /BUDGET/);
});

test('read coordinates bind B principal to the declared origin and keep scope distinct from position and binding', async () => {
  const { deriveBInputs, deriveBReadCoordinates } = await api();
  const input = deriveBInputs(options());
  const coordinates = deriveBReadCoordinates(options());
  // Origin is a static tuple of chainId and runtime hash, with no ledger address.
  const handOrigin = wordsHash(`${'0'.repeat(60)}7a69`, bare(runtimeCodehashes.ledger));
  assert.equal(coordinates.realmOrigin, handOrigin);
  assert.equal(coordinates.principals.AUTHOR_A, `0x${'0'.repeat(24)}${bare(input.roles.AUTHOR_A.address)}`);
  const domPrincipal = hash('0x656673322f7072696e636970616c2f31');
  assert.equal(coordinates.principals.AUTHOR_B, wordsHash(bare(domPrincipal), TWO, bare(handOrigin), `${'0'.repeat(24)}${bare(input.roles.actorB.address)}`));
  assert.notEqual(coordinates.bindings.A_PLACEMENT, coordinates.bindings.B_PLACEMENT);
  assert.notEqual(coordinates.scopes.A_FOLDER_SWAPS.scopeKey, coordinates.scopes.B_FOLDER_SWAPS.scopeKey);
  assert.notEqual(coordinates.positions.PLACEMENT_SWAPS_ETH_USDC, coordinates.scopes.A_FOLDER_SWAPS.scopeKey);
  assert.notEqual(coordinates.scopes.A_FOLDER_SWAPS.scopeKey, coordinates.scopes.A_FOLDER_SWAPS.scopeList);
  const changed = options(); changed.runtimeCodehashes.ledger = `0x${'b'.repeat(64)}`;
  const altered = deriveBReadCoordinates(changed);
  assert.notEqual(altered.principals.AUTHOR_B, coordinates.principals.AUTHOR_B);
  assert.notEqual(altered.bindings.B_HEAD, coordinates.bindings.B_HEAD);
  assert.equal(altered.bindings.A_PLACEMENT, coordinates.bindings.A_PLACEMENT);
  assert.equal(altered.lensIds.LENS_A_FIRST, coordinates.lensIds.LENS_A_FIRST);
});

test('derivation is pure and normalizes hash inputs without mutating the caller objects', async () => {
  const { deriveBInputs } = await api();
  const supplied = options(); supplied.runtimeCodehashes.ledger = `0x${'AB'.repeat(32)}`;
  const retained = structuredClone(supplied);
  assert.deepEqual(deriveBInputs(supplied), deriveBInputs(supplied));
  assert.deepEqual(supplied, retained);
  assert.match(deriveBInputs(supplied).types.LABEL, /^0x[0-9a-f]{64}$/);
});
