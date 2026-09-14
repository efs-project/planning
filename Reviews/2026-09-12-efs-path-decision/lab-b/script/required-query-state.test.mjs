import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import {
  buildInitializationChecks,
  buildPublicationChecks,
  buildStateChecks,
} from './required-query-state.mjs';

const require = createRequire(import.meta.url);
const { AbiCoder, Interface, concat, keccak256, toBeHex, zeroPadValue } =
  require(process.env.EFS_ETHERS_PATH ?? 'ethers');
const abi = AbiCoder.defaultAbiCoder();
const input = JSON.parse(readFileSync(process.env.EFS_QUERY_INPUT, 'utf8'));
const ZERO = `0x${'00'.repeat(32)}`;
const B_LEDGER = new Interface([
  'function counts() view returns (uint64,uint64,uint64,uint64)',
  'function nonces(address) view returns (uint64)',
  'function record(bytes32) view returns (bytes32,uint64,uint32,bytes)',
  'function evidence(uint64) view returns (address,uint8,uint8,uint16,uint64,bytes32,bytes32,uint64,uint64,uint64,bytes32,bytes32,bytes32)',
  'function acceptanceBasis(uint64) view returns (bytes32,uint16,address,bytes32,address,bytes32,uint64,uint64)',
]);
const B_INDEX = new Interface([
  'function postingHead(bytes32) view returns (uint64,uint64,uint64,uint16)',
  'function coverage(bytes32,bytes32) view returns (uint8,uint64,uint64)',
]);
const C_STORE = new Interface([
  'function getRecord(bytes32,bytes32[],bytes32) view returns (bytes,bytes32,bytes)',
  'function getFieldLayout(bytes32) view returns (bytes32)',
]);
const C_LEDGER = new Interface(['function highWater() view returns (uint64)']);
const C_INDEX = new Interface(['function coverage(bytes32,bytes32) view returns (uint8,uint64)']);

function byLabel(checks, label) {
  const found = checks.find((p) => p.label === label);
  assert.ok(found, `missing ${label}`);
  return found;
}

function assertProbeShape(checks) {
  assert.equal(new Set(checks.map((p) => p.label)).size, checks.length);
  for (const p of checks) {
    assert.match(p.label, /^\S(?:.*\S)?$/);
    assert.match(p.to, /^0x[0-9a-f]{40}$/);
    assert.match(p.data, /^0x[0-9a-f]+$/);
    assert.match(p.expected, /^0x[0-9a-f]*$/);
  }
}

function decodeStore(probe) {
  return C_STORE.decodeFunctionResult('getRecord', probe.expected);
}

function word(n) {
  return zeroPadValue(toBeHex(BigInt(n)), 32);
}

function encodedLengths(n) {
  return word(BigInt(n) | (BigInt(n) << 56n));
}

test('all arm checkpoints produce complete unique literal probes', () => {
  for (const armName of ['bScan', 'bSelective', 'c']) {
    for (let common = 0; common <= 8; common += 1) {
      assertProbeShape(buildStateChecks(input, armName, common));
    }
  }
});

test('B counts and next nonces follow every common checkpoint', () => {
  const counts = [
    [0, 0, 0, 0], [5, 4, 0, 1], [8, 6, 1, 2], [11, 8, 1, 3], [12, 8, 1, 4],
    [13, 9, 1, 5], [15, 10, 2, 6], [21, 16, 2, 7], [24, 18, 2, 8],
  ];
  const nonces = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [4, 1], [4, 2], [5, 2], [6, 2]];
  for (const armName of ['bScan', 'bSelective']) {
    for (let common = 0; common <= 8; common += 1) {
      const checks = buildStateChecks(input, armName, common);
      assert.equal(byLabel(checks, 'counts').expected, abi.encode(['uint64', 'uint64', 'uint64', 'uint64'], counts[common]));
      assert.equal(byLabel(checks, 'nonce.A').expected, abi.encode(['uint64'], [nonces[common][0]]));
      assert.equal(byLabel(checks, 'nonce.B').expected, abi.encode(['uint64'], [nonces[common][1]]));
    }
  }
});

test('B old seal keeps A3 absent and tail preserves reused Record identity', () => {
  const arm = input.arms.bScan;
  const old = buildStateChecks(input, 'bScan', 7);
  const tail = buildStateChecks(input, 'bScan', 8);
  assert.equal(byLabel(old, 'record.A3').expected, B_LEDGER.encodeFunctionResult('record', [ZERO, 0, 0, '0x']));
  assert.equal(byLabel(tail, 'record.A3').expected, B_LEDGER.encodeFunctionResult('record', [arm.graph.records.A3.typeId, 22, 1, arm.graph.records.A3.body]));
  assert.equal(byLabel(tail, 'record.B1').expected, B_LEDGER.encodeFunctionResult('record', [arm.graph.records.B1.typeId, 14, 2, arm.graph.records.B1.body]));
});

test('B packed Quote ordinals are little-endian 48-bit lanes including tail reuse', () => {
  const checks = buildStateChecks(input, 'bScan', 8);
  assert.equal(byLabel(checks, 'posting.byType.QUOTE.word.0').expected, abi.encode(['uint256'], [75325220824640392173481458385436465813039372825850206486534n]));
  assert.equal(byLabel(checks, 'posting.byType.QUOTE.word.2').expected, abi.encode(['uint256'], [150650441649280851249198512363059268883290622636008966979603n]));
});

test('B selective reference lists advance P 3 to 4 and Q 8 to 9 while scan is undeclared', () => {
  const old = buildStateChecks(input, 'bSelective', 7);
  const tail = buildStateChecks(input, 'bSelective', 8);
  assert.equal(byLabel(old, 'posting.reference.P.head').expected, B_INDEX.encodeFunctionResult('postingHead', [3, 3, 14, 1]));
  assert.equal(byLabel(tail, 'posting.reference.P.head').expected, B_INDEX.encodeFunctionResult('postingHead', [4, 4, 22, 1]));
  assert.equal(byLabel(old, 'posting.reference.Q.head').expected, B_INDEX.encodeFunctionResult('postingHead', [8, 8, 20, 1]));
  assert.equal(byLabel(tail, 'posting.reference.Q.head').expected, B_INDEX.encodeFunctionResult('postingHead', [9, 9, 23, 1]));
  const scan = buildStateChecks(input, 'bScan', 8);
  assert.equal(byLabel(scan, 'posting.reference.P.head').expected, B_INDEX.encodeFunctionResult('postingHead', [0, 0, 0, 0]));
  assert.equal(byLabel(scan, 'coverage.reference-position').expected, B_INDEX.encodeFunctionResult('coverage', [0, 0, 0]));
});

test('B HEAD history and backlink live count preserve the A1 to A2 move', () => {
  const checks = buildStateChecks(input, 'bScan', 8);
  assert.equal(byLabel(checks, 'posting.history.A.head').expected, B_INDEX.encodeFunctionResult('postingHead', [2, 2, 11, 1]));
  assert.equal(byLabel(checks, 'posting.backlink.A1.head').expected, B_INDEX.encodeFunctionResult('postingHead', [1, 0, 8, 0]));
  assert.equal(byLabel(checks, 'posting.backlink.A2.head').expected, B_INDEX.encodeFunctionResult('postingHead', [1, 1, 11, 0]));
  assert.equal(byLabel(checks, 'posting.backlink.B1.head').expected, B_INDEX.encodeFunctionResult('postingHead', [1, 1, 15, 0]));
});

test('C high-water and last nonces preserve the Type offset', () => {
  const highs = [4, 9, 12, 15, 16, 17, 19, 25, 28];
  const nonces = [[1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [5, 1], [5, 2], [6, 2], [7, 2]];
  for (let common = 0; common <= 8; common += 1) {
    const checks = buildStateChecks(input, 'c', common);
    assert.equal(byLabel(checks, 'ledger.highWater').expected, C_LEDGER.encodeFunctionResult('highWater', [highs[common]]));
    assert.equal(decodeStore(byLabel(checks, 'counter.admissions'))[0], `0x${BigInt(highs[common]).toString(16).padStart(16, '0')}`);
    assert.equal(decodeStore(byLabel(checks, 'nonce.A'))[0], `0x${BigInt(nonces[common][0]).toString(16).padStart(16, '0')}`);
    assert.equal(decodeStore(byLabel(checks, 'nonce.B'))[0], `0x${BigInt(nonces[common][1]).toString(16).padStart(16, '0')}`);
  }
});

test('C Type rows are omitted before admission and complete immediately after', () => {
  const before = buildStateChecks(input, 'c', 0, { typesAdmitted: false });
  assert.ok(!before.some((p) => p.label.startsWith('type.') || p.label.startsWith('record.type') || p.label.startsWith('occurrence.type')));
  assert.equal(decodeStore(byLabel(before, 'counter.admissions'))[0], '0x0000000000000000');
  const after = buildStateChecks(input, 'c', 0);
  for (const name of ['ITEM', 'PAIR', 'QUOTE', 'OTHER']) {
    assert.ok(byLabel(after, `type.${name}`));
    assert.equal(decodeStore(byLabel(after, `occurrence.type${name}`))[0], '0x00000001');
  }
});

test('C old/tail inventories keep P and Q backlinks, Item backlinks, and unique Quote ByType', () => {
  const records = input.arms.c.graph.records;
  const old = buildStateChecks(input, 'c', 7);
  const tail = buildStateChecks(input, 'c', 8);
  assert.equal(decodeStore(byLabel(old, 'posting.backlink.P'))[2].length, 2 + (4 * 64));
  assert.equal(decodeStore(byLabel(tail, 'posting.backlink.P'))[2].length, 2 + (5 * 64));
  const oldP = concat(['A1', 'A2', 'B1', 'R1'].map((name) => records[name].id));
  const tailP = concat(['A1', 'A2', 'B1', 'R1', 'A3'].map((name) => records[name].id));
  assert.equal(
    byLabel(old, 'posting.backlink.P').expected,
    C_STORE.encodeFunctionResult('getRecord', ['0x', encodedLengths(4 * 32), oldP]),
  );
  assert.equal(
    byLabel(tail, 'posting.backlink.P').expected,
    C_STORE.encodeFunctionResult('getRecord', ['0x', encodedLengths(5 * 32), tailP]),
  );
  assert.equal(decodeStore(byLabel(old, 'posting.backlink.Q'))[2].length, 2 + (8 * 64));
  assert.equal(decodeStore(byLabel(tail, 'posting.backlink.Q'))[2].length, 2 + (9 * 64));
  const oldQ = concat(['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'U8'].map((name) => records[name].id));
  const tailQ = concat(['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'U8', 'U9'].map((name) => records[name].id));
  assert.equal(
    byLabel(old, 'posting.backlink.Q').expected,
    C_STORE.encodeFunctionResult('getRecord', ['0x', encodedLengths(8 * 32), oldQ]),
  );
  assert.equal(
    byLabel(tail, 'posting.backlink.Q').expected,
    C_STORE.encodeFunctionResult('getRecord', ['0x', encodedLengths(9 * 32), tailQ]),
  );
  assert.equal(decodeStore(byLabel(tail, 'posting.backlink.I_ETH'))[2], concat([input.arms.c.graph.records.P.id, input.arms.c.graph.records.Q.id]));
  assert.equal(decodeStore(byLabel(tail, 'posting.byType.QUOTE'))[2].length, 2 + (13 * 64));
  const oldQuote = concat(['U1', 'A1', 'U2', 'A2', 'U3', 'B1', 'U4', 'U5', 'U6', 'U7', 'U8'].map((name) => records[name].id));
  const tailQuote = concat(['U1', 'A1', 'U2', 'A2', 'U3', 'B1', 'U4', 'U5', 'U6', 'U7', 'U8', 'A3', 'U9'].map((name) => records[name].id));
  assert.equal(
    byLabel(old, 'posting.byType.QUOTE').expected,
    C_STORE.encodeFunctionResult('getRecord', ['0x', encodedLengths(11 * 32), oldQuote]),
  );
  assert.equal(
    byLabel(tail, 'posting.byType.QUOTE').expected,
    C_STORE.encodeFunctionResult('getRecord', ['0x', encodedLengths(13 * 32), tailQuote]),
  );
  assert.equal(decodeStore(byLabel(tail, 'occurrence.A1'))[0], '0x00000002');
  assert.equal(decodeStore(byLabel(tail, 'occurrence.B1'))[0], '0x00000002');
});

test('C shared scope is one dynamically padded row of two triples', () => {
  const arm = input.arms.c;
  const checks = buildStateChecks(input, 'c', 8);
  const purpose = arm.publications.find((p) => p.name === 'common2').actions.find((a) => a.kind === 4).purpose;
  const bindingA = keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [arm.graph.principals.A, purpose, arm.graph.subject, ZERO]));
  const bindingB = keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [arm.graph.principals.B, purpose, arm.graph.subject, ZERO]));
  const dynamic = concat([arm.graph.principals.A, ZERO, bindingA, arm.graph.principals.B, ZERO, bindingB]);
  const expected = C_STORE.encodeFunctionResult('getRecord', ['0x', encodedLengths(192), dynamic]);
  assert.equal(byLabel(checks, 'posting.scope.HEAD').expected, expected);
  assert.ok(!checks.some((p) => p.label.includes('bindingTargetLive')));
});

test('C raw coverage stays zero-frontier while API synthesizes current high-water', () => {
  const checks = buildStateChecks(input, 'c', 8);
  assert.equal(decodeStore(byLabel(checks, 'coverage.raw.scopes'))[0], '0x010100000000000000000000000000000000');
  assert.equal(byLabel(checks, 'coverage.api.scopes').expected, C_INDEX.encodeFunctionResult('coverage', [1, 28]));
  assert.equal(decodeStore(byLabel(checks, 'coverage.raw.optional-digest'))[0], '0x000100000000000000000000000000000000');
  assert.equal(byLabel(checks, 'coverage.api.optional-digest').expected, C_INDEX.encodeFunctionResult('coverage', [2, 0]));
});

test('initialization checks include exact B registration blocks and all C table layouts', () => {
  const scan = buildInitializationChecks(input, 'bScan');
  const selective = buildInitializationChecks(input, 'bSelective');
  const scanItem = B_LEDGER.decodeFunctionResult('acceptanceBasis', byLabel(buildPublicationChecks(input, 'bScan', 'common1'), 'acceptanceBasis.1').expected);
  const selectiveItem = B_LEDGER.decodeFunctionResult('acceptanceBasis', byLabel(buildPublicationChecks(input, 'bSelective', 'common1'), 'acceptanceBasis.1').expected);
  assert.equal(scanItem[6], 1n);
  assert.equal(scanItem[7], 4n);
  assert.equal(selectiveItem[6], 1n);
  assert.equal(selectiveItem[7], 39n);
  assertProbeShape(scan);
  assertProbeShape(selective);
  const c = buildInitializationChecks(input, 'c');
  assert.equal(c.filter((p) => p.label.startsWith('layout.')).length, 15);
  assert.equal(byLabel(c, 'layout.Ledger.Records').expected, C_STORE.encodeFunctionResult('getFieldLayout', ['0x0028020120080000000000000000000000000000000000000000000000000000']));
  const cBefore = buildInitializationChecks(input, 'c', { typesAdmitted: false });
  assert.ok(!cBefore.some((p) => p.label.startsWith('type.')));
});

test('publication deltas encode B publication-block basis and C prior-high-water basis', () => {
  const bScan = buildPublicationChecks(input, 'bScan', 'common7');
  const bSelective = buildPublicationChecks(input, 'bSelective', 'common7');
  assert.equal(B_LEDGER.decodeFunctionResult('evidence', byLabel(bScan, 'evidence.common7').expected)[9], 19n);
  assert.equal(B_LEDGER.decodeFunctionResult('evidence', byLabel(bSelective, 'evidence.common7').expected)[9], 54n);
  const c = buildPublicationChecks(input, 'c', 'common7');
  const evidenceStatic = decodeStore(byLabel(c, 'evidence.common7'))[0];
  assert.equal(`0x${evidenceStatic.slice(2 + (220 * 2), 2 + (228 * 2))}`, '0x0000000000000013');
  assert.ok(byLabel(c, 'admission.25'));
});

test('every publication delta is finite, unique and contains every acceptance row', () => {
  const actionCounts = [5, 3, 3, 1, 1, 2, 6, 3];
  const acceptedCounts = [4, 2, 2, 1, 1, 1, 6, 3];
  const registrationBlocks = { bScan: [4, 5, 6, 7], bSelective: [39, 40, 41, 42] };
  for (const armName of ['bScan', 'bSelective']) {
    for (let i = 0; i < 8; i += 1) {
      const checks = buildPublicationChecks(input, armName, `common${i + 1}`);
      assertProbeShape(checks);
      assert.equal(checks.filter((p) => p.label.startsWith('admission.')).length, actionCounts[i]);
      assert.equal(checks.filter((p) => p.label.startsWith('acceptanceBasis.')).length, acceptedCounts[i]);
      for (const check of checks.filter((p) => p.label.startsWith('acceptanceBasis.'))) {
        const decoded = B_LEDGER.decodeFunctionResult('acceptanceBasis', check.expected);
        assert.equal(decoded[1], 1n);
        const typeIndex = Object.values(input.arms[armName].graph.types).findIndex((type) => type.id === decoded[0]);
        assert.notEqual(typeIndex, -1);
        assert.equal(decoded[6], BigInt(typeIndex + 1));
        assert.equal(decoded[7], BigInt(registrationBlocks[armName][typeIndex]));
      }
    }
  }
  for (const [name, count] of [['types', 4], ...actionCounts.map((count, i) => [`common${i + 1}`, count])]) {
    const checks = buildPublicationChecks(input, 'c', name);
    assertProbeShape(checks);
    assert.equal(checks.filter((p) => p.label.startsWith('admission.')).length, count);
    assert.equal(checks.filter((p) => p.label.startsWith('evidence.')).length, 1);
  }
});

test('terminal inventories include exact B and C author/type postings', () => {
  const b = buildStateChecks(input, 'bScan', 8);
  assert.equal(byLabel(b, 'posting.byType.ITEM.head').expected, B_INDEX.encodeFunctionResult('postingHead', [2, 2, 2, 0]));
  assert.equal(byLabel(b, 'posting.byType.PAIR.head').expected, B_INDEX.encodeFunctionResult('postingHead', [2, 2, 4, 0]));
  assert.equal(byLabel(b, 'posting.byType.QUOTE.head').expected, B_INDEX.encodeFunctionResult('postingHead', [15, 15, 24, 0]));
  assert.equal(byLabel(b, 'posting.byType.OTHER.head').expected, B_INDEX.encodeFunctionResult('postingHead', [1, 1, 21, 0]));
  assert.equal(byLabel(b, 'posting.byAuthor.A.head').expected, B_INDEX.encodeFunctionResult('postingHead', [18, 18, 24, 0]));
  assert.equal(byLabel(b, 'posting.byAuthor.B.head').expected, B_INDEX.encodeFunctionResult('postingHead', [2, 2, 14, 0]));
  const oldC = buildStateChecks(input, 'c', 7);
  const tailC = buildStateChecks(input, 'c', 8);
  assert.equal(decodeStore(byLabel(tailC, 'posting.byAuthor.A'))[2].length, 2 + (25 * 16));
  const oldAuthorAOrdinals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 20, 21, 22, 23, 24, 25];
  const tailAuthorAOrdinals = [...oldAuthorAOrdinals, 26, 27, 28];
  const oldAuthorA = concat(oldAuthorAOrdinals.map((ordinal) => zeroPadValue(toBeHex(BigInt(ordinal)), 8)));
  const tailAuthorA = concat(tailAuthorAOrdinals.map((ordinal) => zeroPadValue(toBeHex(BigInt(ordinal)), 8)));
  assert.equal(
    byLabel(oldC, 'posting.byAuthor.A').expected,
    C_STORE.encodeFunctionResult('getRecord', ['0x', encodedLengths(22 * 8), oldAuthorA]),
  );
  assert.equal(
    byLabel(tailC, 'posting.byAuthor.A').expected,
    C_STORE.encodeFunctionResult('getRecord', ['0x', encodedLengths(25 * 8), tailAuthorA]),
  );
  assert.equal(decodeStore(byLabel(tailC, 'posting.byAuthor.B'))[2], '0x000000000000001000000000000000120000000000000013');
  assert.equal(decodeStore(byLabel(tailC, 'posting.byType.PAIR'))[2], concat([input.arms.c.graph.records.P.id, input.arms.c.graph.records.Q.id]));
  assert.equal(decodeStore(byLabel(tailC, 'posting.byType.OTHER'))[2], input.arms.c.graph.records.R1.id);
});

test('raw selectors and result widths match the source recipe', () => {
  const b = buildStateChecks(input, 'bScan', 8);
  assert.equal(byLabel(b, 'counts').data.slice(0, 10), '0x817cc1ea');
  assert.equal(byLabel(b, 'record.A1').data.slice(0, 10), '0xb5c645bd');
  const c = buildStateChecks(input, 'c', 8);
  assert.equal(byLabel(c, 'record.A1').data.slice(0, 10), '0x419b58fd');
  assert.equal(decodeStore(byLabel(c, 'record.A1'))[0].length, 2 + (40 * 2));
  const init = buildInitializationChecks(input, 'c');
  assert.equal(byLabel(init, 'layout.Ledger.Records').data.slice(0, 10), '0x3a77c2c2');
});

test('malformed actions, checkpoints, names and arm combinations are rejected', () => {
  assert.throws(() => buildStateChecks(input, 'bogus', 0), /unknown arm/);
  assert.throws(() => buildStateChecks(input, 'bScan', -1), /checkpoint/);
  assert.throws(() => buildStateChecks(input, 'c', 9), /checkpoint/);
  assert.throws(() => buildStateChecks(input, 'c', 1, { typesAdmitted: false }), /pre-Type/);
  assert.throws(() => buildStateChecks(input, 'bScan', 0, { typesAdmitted: false }), /requires admitted Types/);
  assert.throws(() => buildPublicationChecks(input, 'bScan', 'bogus'), /unknown publication/);
  const badKind = structuredClone(input);
  badKind.arms.bScan.publications[0].actions[0].kind = 99;
  assert.throws(() => buildStateChecks(badKind, 'bScan', 1), /unknown B action kind/);
  const badName = structuredClone(input);
  badName.arms.c.publications[1].names[0] = 'not-a-record';
  badName.arms.c.publications[1].admissions[0].name = 'not-a-record';
  assert.throws(() => buildStateChecks(badName, 'c', 1), /unknown action name/);
});
