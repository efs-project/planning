import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { analyzeRpcObserved, recordIdFromRawBody } from './rpc-observed.mjs';

const expectations = JSON.parse(await readFile(new URL('rpc-observed-expectations.json', import.meta.url), 'utf8'));
const profile = JSON.parse(await readFile(new URL('rpc-observed-profile-dcc7b94.json', import.meta.url), 'utf8'));

const ZERO = `0x${'00'.repeat(32)}`;
const Q3000_BODY = '0x0000000000000000000000000000000000000000000000000000000000000bb8';
const Q3100_BODY = '0x0000000000000000000000000000000000000000000000000000000000000c1c';
const Q3000 = '0xb450bbac098c4101ea9b6a23a7fff9d13f7bdd99f0f3eb6c0d680393571f6a95';
const Q3100 = '0xf3057b44e5c1d41b301b8f0cfeb9b6b48c9c3b0db9ddc88a4eb63243781b6d2c';
const LEDGER = '0x1111111111111111111111111111111111111111';
const CONSUMER = '0x2222222222222222222222222222222222222222';
const OTHER = '0x3333333333333333333333333333333333333333';
const LENS_PRINCIPAL = '0x1212121212121212121212121212121212121212';
const PURPOSE = `0x${'55'.repeat(32)}`;
const SUBJECT = `0x${'44'.repeat(32)}`;
const ROLE = ZERO;
const BLOCKS = Object.freeze({
  16: `0x${'16'.repeat(32)}`,
  17: `0x${'17'.repeat(32)}`,
  18: `0x${'18'.repeat(32)}`,
  19: `0x${'19'.repeat(32)}`,
  20: `0x${'20'.repeat(32)}`,
});

// Generated independently from the authorized ABI tuple declarations, then
// frozen here as literal bytes. Tests never ask production code to construct
// its own expected calldata.
const CREATE_SIGNED = '0x8846f57e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008888888888888888888888888888888888888888000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000630000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000280000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001cde0354ba21b75c3a1ab88546911ea621263d535d76ee05983d95aa655f85068e76dc8c2cbfeda1a9b742dc422eca76098e9c5e0a82c5e4f1ad3ef5bd9efe552000000000000000000000000000000000000000000000000000000000000000044444444444444444444444444444444444444444444444444444444444444440000000000000000000000000000000000000000000000000000000000000000b450bbac098c4101ea9b6a23a7fff9d13f7bdd99f0f3eb6c0d680393571f6a95000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000bb800000000000000000000000000000000000000000000000000000000000000011100000000000000000000000000000000000000000000000000000000000000';
const EDIT_SIGNED = [
  '0x8846f57e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008888888888888888888888888888888888888888000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000630000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000280000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001cde0354ba21b75c3a1ab88546911ea621263d535d76ee05983d95aa655f850685a25a1af',
  '59e5c9fbb1b35d4f17b3ec95ad60075c34a87c7e570d596153677cb3000000000000000000000000000000000000000000000000000000000000000044444444444444444444444444444444444444444444444444444444444444440000000000000000000000000000000000000000000000000000000000000000f3057b44e5c1d41b301b8f0cfeb9b6b48c9c3b0db9ddc88a4eb63243781b6d2c000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000c1c00000000000000000000000000000000000000000000000000000000000000011100000000000000000000000000000000000000000000000000000000000000',
].join('');
const READ_QUOTE = '0x6a59728b000000000000000000000000000000000000000000000000000000000000008055555555555555555555555555555555555555555555555555555555555555554444444444444444444444444444444444444444444444444444444444444444000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000001212121212121212121212121212121212121212';
const READ_LIST = '0xd67f2355000000000000000000000000000000000000000000000000000000000000008055555555555555555555555555555555555555555555555555555555555555554444444444444444444444444444444444444444444444444444444444444444000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000000010000000000000000000000001212121212121212121212121212121212121212';
const ABSENT_RECORD = '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000';

function receipt(blockNumber) {
  return { status: 1, blockNumber, blockHash: BLOCKS[blockNumber] };
}

function call(rpcId, to, calldata, blockTag, returnData) {
  return {
    rpcId,
    method: 'eth_call',
    source: 'SYNTHETIC_LITERAL_VECTOR',
    to,
    calldata,
    blockTag,
    blockHash: BLOCKS[blockTag],
    returnData,
    request: {
      jsonrpc: '2.0',
      id: rpcId,
      method: 'eth_call',
      params: [{ to, data: calldata }, `0x${blockTag.toString(16)}`],
    },
    response: { jsonrpc: '2.0', id: rpcId, result: returnData },
  };
}

function consumerCalls(prefix) {
  return [
    call(`${prefix}-control-target`, CONSUMER, '0x36abbd1d', 16, ZERO),
    call(`${prefix}-control-admission`, CONSUMER, '0x519ef1f8', 16, ZERO),
    call(`${prefix}-control-revision`, CONSUMER, '0xe08871ca', 16, ZERO),
    call(`${prefix}-control-scanned`, CONSUMER, '0x336d5392', 16, ZERO),
    call(`${prefix}-control-status`, CONSUMER, '0xd6d86712', 16, ZERO),
    call(`${prefix}-control-value`, CONSUMER, '0x43183834', 16, ZERO),
    call(`${prefix}-control-count`, CONSUMER, '0x6b16ad67', 16, ZERO),
    call(`${prefix}-paid-target`, CONSUMER, '0x36abbd1d', 19, Q3100),
    call(`${prefix}-paid-revision`, CONSUMER, '0xe08871ca', 19, '0x0000000000000000000000000000000000000000000000000000000000000002'),
    call(`${prefix}-paid-value`, CONSUMER, '0x43183834', 19, '0x0000000000000000000000000000000000000000000000000000000000000c1c'),
    call(`${prefix}-listing-count`, CONSUMER, '0x6b16ad67', 20, '0x0000000000000000000000000000000000000000000000000000000000000001'),
    call(`${prefix}-control-record-3000`, LEDGER, `0xb5c645bd${Q3000.slice(2)}`, 16, ABSENT_RECORD),
    call(`${prefix}-control-record-3100`, LEDGER, `0xb5c645bd${Q3100.slice(2)}`, 16, ABSENT_RECORD),
  ];
}

function signedTransactions() {
  return [
    { to: LEDGER, data: CREATE_SIGNED, receipt: receipt(17) },
    { to: LEDGER, data: EDIT_SIGNED, receipt: receipt(18) },
    { to: CONSUMER, data: READ_QUOTE, receipt: receipt(19) },
    { to: CONSUMER, data: READ_LIST, receipt: receipt(20) },
  ];
}

function basePacket() {
  return {
    sealedInitialState: { blockNumber: 16, blockHash: BLOCKS[16] },
    candidateVerdict: 'PASS_THIS_FIELD_MUST_BE_IGNORED',
    cells: {
      'native-one/quote': {
        afterRevert: { blockNumber: 16, blockHash: BLOCKS[16] },
        transactions: [
          { to: OTHER, data: '0x70f8b526', receipt: receipt(17) },
          { to: OTHER, data: '0x70f8b526', receipt: receipt(18) },
          { to: CONSUMER, data: READ_QUOTE, receipt: receipt(19) },
          { to: CONSUMER, data: READ_LIST, receipt: receipt(20) },
        ],
        raw: consumerCalls('native'),
        consumerChecks: [{ expected: 'FAKE', actual: 'FAKE', match: true }],
      },
      'signed-one/quote': {
        afterRevert: { blockNumber: 16, blockHash: BLOCKS[16] },
        transactions: signedTransactions(),
        raw: consumerCalls('signed'),
        consumerChecks: [{ expected: 'FAKE', actual: 'FAKE', match: true }],
      },
    },
  };
}

function analyze(packet = basePacket()) {
  return analyzeRpcObserved(packet, profile, expectations, {
    sourceLabel: 'synthetic test',
    expectedTargets: { Ledger: LEDGER, Consumer: CONSUMER },
    expectedConsumerControl: {
      lastAdmission: '0',
      lastCount: '0',
      lastRevision: '0',
      lastScanned: '0',
      lastStatus: '0',
      lastTarget: ZERO,
      lastValue: '0',
    },
    expectedCoordinates: {
      'native-one': {
        readQuote: [[LENS_PRINCIPAL], PURPOSE, SUBJECT, ROLE],
        readList: [[LENS_PRINCIPAL], PURPOSE, SUBJECT, '100'],
      },
      'signed-one': {
        readQuote: [[LENS_PRINCIPAL], PURPOSE, SUBJECT, ROLE],
        readList: [[LENS_PRINCIPAL], PURPOSE, SUBJECT, '100'],
      },
    },
    pinStanding: 'INDEPENDENT_SYNTHETIC_TEST_VECTOR',
  });
}

function signedCell(report) {
  return report.cells.find((cell) => cell.cellId === 'signed-one');
}

test('recomputes Record identities from literal raw bodies', () => {
  assert.deepEqual(recordIdFromRawBody(Q3000_BODY, expectations), {
    typeId: '0xcde0354ba21b75c3a1ab88546911ea621263d535d76ee05983d95aa655f85068',
    bodyHash: '0xe76dc8c2cbfeda1a9b742dc422eca76098e9c5e0a82c5e4f1ad3ef5bd9efe552',
    recordId: Q3000,
  });
  assert.equal(recordIdFromRawBody(Q3100_BODY, expectations).recordId, Q3100);
});

test('decodes supported bytes without upgrading unsupported native or body semantics', () => {
  const report = analyze();
  const native = report.cells.find((cell) => cell.cellId === 'native-one');
  const signed = signedCell(report);

  assert.equal(native.axes.writeSequence.status, 'UNSUPPORTED');
  assert.equal(native.axes.controlRecords.status, 'UNKNOWN');
  assert.equal(signed.axes.writeSequence.status, 'OBSERVED_MATCH');
  assert.equal(signed.axes.controlRecords.status, 'OBSERVED_MATCH');
  assert.equal(signed.axes.controlConsumer.status, 'OBSERVED_MATCH');
  assert.equal(signed.axes.paidQuoteRead.status, 'OBSERVED_MATCH');
  assert.equal(signed.axes.listing.status, 'OBSERVED_MATCH');
  assert.equal(signed.axes.bodyScalarSemantics.status, 'UNSUPPORTED');
  assert.equal(signed.axes.transportCorrelation.status, 'OBSERVED_MATCH');
  assert.equal(report.chainTruth.status, 'UNKNOWN');
  assert.equal(report.candidatePass, 'NOT_EVALUATED');
});

test('raw return mutation is an observed mismatch', () => {
  const packet = basePacket();
  const call = packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-paid-value');
  call.returnData = '0x0000000000000000000000000000000000000000000000000000000000000c1d';
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'OBSERVED_MISMATCH');
});

test('selector substitution is an observed mismatch', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-paid-revision').calldata = '0xdeadbeef';
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'OBSERVED_MISMATCH');
});

test('substitution with another declared selector is still an observed mismatch', () => {
  const packet = basePacket();
  const observation = packet.cells['signed-one/quote'].raw
    .find((item) => item.rpcId === 'signed-paid-revision');
  observation.calldata = '0x519ef1f8';
  observation.request.params[0].data = observation.calldata;
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'OBSERVED_MISMATCH');
});

test('target substitution is an observed mismatch', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-paid-revision').to = OTHER;
  assert.equal(signedCell(analyze(packet)).axes.targetConsistency.status, 'OBSERVED_MISMATCH');
});

test('basis substitution is an observed mismatch', () => {
  const packet = basePacket();
  const call = packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-paid-revision');
  call.blockTag = 20;
  call.blockHash = BLOCKS[20];
  assert.equal(signedCell(analyze(packet)).axes.transportCorrelation.status, 'OBSERVED_MISMATCH');
});

test('equally malformed flat and request block bases cannot correlate', () => {
  const packet = basePacket();
  const call = packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-paid-revision');
  call.blockTag = true;
  call.request.params[1] = true;
  assert.equal(signedCell(analyze(packet)).axes.transportCorrelation.status, 'OBSERVED_MISMATCH');
});

test('paid read subject arguments stay bound to the signed write subject', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].transactions[2].data = READ_QUOTE.replace(
    '44'.repeat(32),
    '45'.repeat(32),
  );
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'OBSERVED_MISMATCH');
});

test('raw return omission remains unknown rather than success', () => {
  const packet = basePacket();
  const observation = packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-paid-revision');
  delete observation.returnData;
  delete observation.response.result;
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'UNKNOWN');
});

test('whole-call omission remains unknown rather than becoming a basis mismatch', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].raw = packet.cells['signed-one/quote'].raw
    .filter((item) => item.rpcId !== 'signed-paid-revision');
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'UNKNOWN');
});

test('one omitted Record control remains unknown despite its sibling selector', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].raw = packet.cells['signed-one/quote'].raw
    .filter((item) => item.rpcId !== 'signed-control-record-3100');
  assert.equal(signedCell(analyze(packet)).axes.controlRecords.status, 'UNKNOWN');
});

test('conflicting duplicate return is an observed mismatch', () => {
  const packet = basePacket();
  const original = packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-paid-revision');
  packet.cells['signed-one/quote'].raw.push({
    ...original,
    rpcId: 'signed-paid-revision-conflict',
    returnData: '0x0000000000000000000000000000000000000000000000000000000000000003',
  });
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'OBSERVED_MISMATCH');
});

test('an omitted duplicate return cannot mask a malformed sibling return', () => {
  const packet = basePacket();
  const original = packet.cells['signed-one/quote'].raw
    .find((item) => item.rpcId === 'signed-paid-value');
  const malformed = structuredClone(original);
  malformed.rpcId = 'signed-paid-value-malformed';
  malformed.request.id = malformed.rpcId;
  malformed.response.id = malformed.rpcId;
  malformed.returnData = '0x01';
  malformed.response.result = malformed.returnData;
  delete original.returnData;
  delete original.response.result;
  packet.cells['signed-one/quote'].raw.push(malformed);
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'OBSERVED_MISMATCH');
});

test('candidate decoded summaries and verdict labels are inert', () => {
  const packet = basePacket();
  const before = analyze(packet).cells;
  packet.candidateVerdict = 'FAIL';
  packet.cells['signed-one/quote'].consumerChecks = [{ expected: Q3000, actual: ZERO, match: false }];
  packet.cells['signed-one/quote'].pre = { controls: { invented: true } };
  packet.cells['signed-one/quote'].post = { consumer: { lastValue: '999999' } };
  assert.deepEqual(analyze(packet).cells, before);
});

test('a signed-cell transplant cannot satisfy the frozen native arm', () => {
  const packet = basePacket();
  packet.cells['native-one/quote'] = structuredClone(packet.cells['signed-one/quote']);
  const native = analyze(packet).cells.find((cell) => cell.cellId === 'native-one');
  assert.equal(native.axes.writeSequence.status, 'OBSERVED_MISMATCH');
  assert.match(native.axes.writeSequence.reason, /SIGNED_WRITER_PRESENT_IN_NATIVE_CELL/);
});

test('an unknown cell-key suffix cannot satisfy the frozen quote cell', () => {
  const packet = basePacket();
  packet.cells['signed-one/not-quote'] = packet.cells['signed-one/quote'];
  delete packet.cells['signed-one/quote'];
  const signed = signedCell(analyze(packet));
  assert.equal(signed.packetKey, 'UNAVAILABLE');
  assert.equal(signed.axes.writeSequence.status, 'UNKNOWN');
});

test('block number never manufactures a block hash', () => {
  const packet = basePacket();
  delete packet.sealedInitialState.blockHash;
  delete packet.cells['signed-one/quote'].afterRevert.blockHash;
  for (const item of packet.cells['signed-one/quote'].raw.filter((item) => item.blockTag === 16)) delete item.blockHash;
  assert.equal(signedCell(analyze(packet)).axes.controlConsumer.basis.blockHash, 'UNAVAILABLE');
  assert.equal(signedCell(analyze(packet)).axes.controlConsumer.basis.status, 'UNKNOWN');
});

test('a malformed retained anchor cannot erase its conflict with a receipt basis', () => {
  const packet = basePacket();
  packet.sealedInitialState = { blockNumber: 17, blockHash: 'garbage' };
  assert.equal(signedCell(analyze(packet)).axes.writeSequence.status, 'OBSERVED_MISMATCH');
});

test('a noncanonical receipt block quantity cannot earn an exact write match', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].transactions[0].receipt.blockNumber = '0x011';
  assert.equal(signedCell(analyze(packet)).axes.writeSequence.status, 'OBSERVED_MISMATCH');
});

test('a noncanonical baseline block quantity is an observed control mismatch', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].afterRevert.blockNumber = '0x010';
  assert.equal(signedCell(analyze(packet)).axes.controlConsumer.status, 'OBSERVED_MISMATCH');
});

test('malformed return bytes are an observed mismatch', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-paid-value').returnData = '0x01';
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'OBSERVED_MISMATCH');
});

test('ABI-decodable trailing return bytes are still malformed', () => {
  const packet = basePacket();
  const observation = packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-paid-value');
  observation.returnData = `${observation.returnData}${'00'.repeat(32)}`;
  observation.response.result = observation.returnData;
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'OBSERVED_MISMATCH');
});

test('ABI-decodable trailing no-arg calldata is still malformed', () => {
  const packet = basePacket();
  const observation = packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-paid-value');
  observation.calldata = `${observation.calldata}${'00'.repeat(32)}`;
  observation.request.params[0].data = observation.calldata;
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'OBSERVED_MISMATCH');
});

test('changed write body breaks its independent body hash and Record target checks', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].transactions[0].data = CREATE_SIGNED.replace(
    '0000000000000000000000000000000000000000000000000000000000000bb8',
    '0000000000000000000000000000000000000000000000000000000000000bb9',
  );
  assert.equal(signedCell(analyze(packet)).axes.writeSequence.status, 'OBSERVED_MISMATCH');
});

test('transplanted return bytes do not satisfy a different stage', () => {
  const packet = basePacket();
  const paidValue = packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-paid-value');
  const listing = packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-listing-count');
  [paidValue.returnData, listing.returnData] = [listing.returnData, paidValue.returnData];
  const result = signedCell(analyze(packet));
  assert.equal(result.axes.paidQuoteRead.status, 'OBSERVED_MISMATCH');
  assert.equal(result.axes.listing.status, 'OBSERVED_MISMATCH');
});

test('independently pinned listing coordinates reject purpose and subject substitution', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].transactions[3].data = READ_LIST
    .replace('55'.repeat(32), 'aa'.repeat(32))
    .replace('44'.repeat(32), 'bb'.repeat(32));
  assert.equal(signedCell(analyze(packet)).axes.listing.status, 'OBSERVED_MISMATCH');
});

test('missing RPC envelope metadata leaves transport correlation unknown but does not rewrite bytes', () => {
  const packet = basePacket();
  for (const item of packet.cells['signed-one/quote'].raw) {
    delete item.rpcId;
    delete item.method;
    delete item.source;
    delete item.request;
    delete item.response;
  }
  const result = signedCell(analyze(packet));
  assert.equal(result.axes.transportCorrelation.status, 'UNKNOWN');
  assert.equal(result.axes.paidQuoteRead.status, 'OBSERVED_MATCH');
});

test('present malformed RPC envelope containers are mismatches rather than missing', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].raw[0].request = [];
  packet.cells['signed-one/quote'].raw[0].response = [];
  assert.equal(signedCell(analyze(packet)).axes.transportCorrelation.status, 'OBSERVED_MISMATCH');
});

test('unmodeled eth_call transaction fields prevent a transport match', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].raw[0].request.params[0].from = OTHER;
  assert.equal(signedCell(analyze(packet)).axes.transportCorrelation.status, 'UNKNOWN');
});

test('request and response IDs must correlate exactly', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].raw[0].response.id = 'different-id';
  assert.equal(signedCell(analyze(packet)).axes.transportCorrelation.status, 'OBSERVED_MISMATCH');
});

test('request and response IDs reject non-JSON-RPC ID types', () => {
  const packet = basePacket();
  const invalidId = { attacker: true };
  packet.cells['signed-one/quote'].raw[0].rpcId = invalidId;
  packet.cells['signed-one/quote'].raw[0].request.id = invalidId;
  packet.cells['signed-one/quote'].raw[0].response.id = invalidId;
  assert.equal(signedCell(analyze(packet)).axes.transportCorrelation.status, 'OBSERVED_MISMATCH');
});

test('failed read transaction cannot produce an observed-matching stage', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].transactions[2].receipt.status = 0;
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'OBSERVED_MISMATCH');
});

test('failed signed write receipt cannot produce an observed-matching write sequence', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].transactions[0].receipt.status = '0x0';
  assert.equal(signedCell(analyze(packet)).axes.writeSequence.status, 'OBSERVED_MISMATCH');
});

test('an unknown first signed receipt cannot mask a failed second receipt', () => {
  const packet = basePacket();
  delete packet.cells['signed-one/quote'].transactions[0].receipt.status;
  packet.cells['signed-one/quote'].transactions[1].receipt.status = 0;
  assert.equal(signedCell(analyze(packet)).axes.writeSequence.status, 'OBSERVED_MISMATCH');
});

test('failed listing receipt cannot produce an observed-matching listing stage', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].transactions[3].receipt.status = 0;
  assert.equal(signedCell(analyze(packet)).axes.listing.status, 'OBSERVED_MISMATCH');
});

test('listing remains unknown when its prior paid read transaction is omitted', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].transactions = packet.cells['signed-one/quote'].transactions
    .filter((item) => !item.data.startsWith('0x6a59728b'));
  assert.equal(signedCell(analyze(packet)).axes.listing.status, 'UNKNOWN');
});

test('listing rejects paid-read and listing stage reversal', () => {
  const packet = basePacket();
  const cell = packet.cells['signed-one/quote'];
  cell.transactions[2].receipt = receipt(20);
  cell.transactions[3].receipt = receipt(19);
  for (const observation of cell.raw.filter((item) => item.rpcId.startsWith('signed-paid-'))) {
    observation.blockTag = 20;
    observation.blockHash = BLOCKS[20];
    observation.request.params[1] = '0x14';
  }
  const count = cell.raw.find((item) => item.rpcId === 'signed-listing-count');
  count.blockTag = 19;
  count.blockHash = BLOCKS[19];
  count.request.params[1] = '0x13';
  assert.equal(signedCell(analyze(packet)).axes.listing.status, 'OBSERVED_MISMATCH');
});

test('missing transaction receipt status remains unknown', () => {
  const packet = basePacket();
  delete packet.cells['signed-one/quote'].transactions[2].receipt.status;
  assert.equal(signedCell(analyze(packet)).axes.paidQuoteRead.status, 'UNKNOWN');
});

for (const malformedStatus of [true, [1]]) {
  test(`non-quantity receipt status ${JSON.stringify(malformedStatus)} is malformed`, () => {
    const packet = basePacket();
    packet.cells['signed-one/quote'].transactions[0].receipt.status = malformedStatus;
    assert.equal(signedCell(analyze(packet)).axes.writeSequence.status, 'OBSERVED_MISMATCH');
  });
}

test('ABI-decodable trailing dynamic transaction calldata is still malformed', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].transactions[3].data = `${READ_LIST}${'00'.repeat(32)}`;
  assert.equal(signedCell(analyze(packet)).axes.listing.status, 'OBSERVED_MISMATCH');
});

test('response bytes must correlate with the retained flat return bytes', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].raw[0].response.result = `0x${'ff'.repeat(32)}`;
  assert.equal(signedCell(analyze(packet)).axes.transportCorrelation.status, 'OBSERVED_MISMATCH');
});

test('a JSON-RPC response cannot contain both result and error', () => {
  const packet = basePacket();
  packet.cells['signed-one/quote'].raw[0].response.error = { code: -32000, message: 'conflicting envelope' };
  assert.equal(signedCell(analyze(packet)).axes.transportCorrelation.status, 'OBSERVED_MISMATCH');
});

test('the full independently pinned Consumer control rejects a nonzero extra getter', () => {
  const packet = basePacket();
  const observation = packet.cells['signed-one/quote'].raw.find((item) => item.rpcId === 'signed-control-count');
  observation.returnData = '0x0000000000000000000000000000000000000000000000000000000000000009';
  observation.response.result = observation.returnData;
  assert.equal(signedCell(analyze(packet)).axes.controlConsumer.status, 'OBSERVED_MISMATCH');
});

test('coherent target replacement is rejected only with an independent target pin', () => {
  const packet = basePacket();
  for (const observation of packet.cells['signed-one/quote'].raw.filter((item) => item.to === CONSUMER)) {
    observation.to = OTHER;
    observation.request.params[0].to = OTHER;
  }
  for (const transaction of packet.cells['signed-one/quote'].transactions.filter((item) => item.to === CONSUMER)) {
    transaction.to = OTHER;
  }
  assert.equal(signedCell(analyze(packet)).axes.targetConsistency.status, 'OBSERVED_MISMATCH');
});

test('an explicit malformed target cannot downgrade into missing target evidence', () => {
  const packet = basePacket();
  const cell = packet.cells['signed-one/quote'];
  for (const observation of cell.raw.filter((item) => item.to === CONSUMER)) {
    observation.to = '0x1234';
    observation.request.params[0].to = '0x1234';
  }
  for (const transaction of cell.transactions.filter((item) => item.to === CONSUMER)) {
    transaction.to = '0x1234';
  }
  assert.equal(signedCell(analyze(packet)).axes.targetConsistency.status, 'OBSERVED_MISMATCH');
});

test('missing Consumer evidence cannot mask a wrong observed Ledger target pin', () => {
  const packet = basePacket();
  const cell = packet.cells['signed-one/quote'];
  cell.raw = cell.raw.filter((item) => item.to === LEDGER);
  cell.transactions = cell.transactions.filter((item) => item.to === LEDGER);
  for (const observation of cell.raw) {
    observation.to = OTHER;
    observation.request.params[0].to = OTHER;
  }
  for (const transaction of cell.transactions) transaction.to = OTHER;
  assert.equal(signedCell(analyze(packet)).axes.targetConsistency.status, 'OBSERVED_MISMATCH');
});

test('unsealed target and query coordinates stay unknown even when internally consistent', () => {
  const packet = basePacket();
  const report = analyzeRpcObserved(packet, profile, expectations, { sourceLabel: 'unsealed synthetic pressure' });
  const result = signedCell(report);
  assert.equal(result.axes.targetConsistency.status, 'UNKNOWN');
  assert.equal(result.axes.controlRecords.status, 'UNKNOWN');
  assert.equal(result.axes.controlConsumer.status, 'UNKNOWN');
  assert.equal(result.axes.paidQuoteRead.status, 'UNKNOWN');
  assert.equal(result.axes.listing.status, 'UNKNOWN');
});

test('a block number plus unrelated receipt hash does not bind a raw call to a block hash', () => {
  const packet = basePacket();
  for (const observation of packet.cells['signed-one/quote'].raw) {
    delete observation.blockHash;
  }
  const result = signedCell(analyze(packet));
  assert.equal(result.axes.paidQuoteRead.basis.status, 'UNKNOWN');
  assert.equal(result.axes.paidQuoteRead.status, 'UNKNOWN');
});

test('one duplicate missing its block hash cannot borrow a matching basis from its sibling', () => {
  const packet = basePacket();
  const original = packet.cells['signed-one/quote'].raw
    .find((item) => item.rpcId === 'signed-control-count');
  const duplicate = structuredClone(original);
  duplicate.rpcId = 'signed-control-count-unbound-duplicate';
  duplicate.request.id = duplicate.rpcId;
  duplicate.response.id = duplicate.rpcId;
  delete duplicate.blockHash;
  packet.cells['signed-one/quote'].raw.push(duplicate);
  const control = signedCell(analyze(packet)).axes.controlConsumer;
  assert.equal(control.status, 'OBSERVED_MISMATCH');
  const countObservation = control.components.find((item) => item.reason?.startsWith('Consumer.lastCount'));
  assert.equal(countObservation.basis.status, 'UNKNOWN');
});

test('separately named CLI seals profile and expectations without calling UNKNOWN a failure', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'efs-rpc-observed-'));
  try {
    const packetPath = join(directory, 'packet.json');
    const profilePath = join(directory, 'profile.json');
    const expectationsPath = join(directory, 'expectations.json');
    await writeFile(packetPath, JSON.stringify(basePacket()));
    await writeFile(profilePath, await readFile(new URL('rpc-observed-profile-dcc7b94.json', import.meta.url), 'utf8'));
    await writeFile(expectationsPath, await readFile(new URL('rpc-observed-expectations.json', import.meta.url), 'utf8'));

    const success = spawnSync(process.execPath, [
      new URL('check-rpc-observed.mjs', import.meta.url).pathname,
      packetPath,
      profilePath,
      expectationsPath,
    ], { encoding: 'utf8', env: process.env });
    assert.equal(success.status, 0, success.stderr);
    const report = JSON.parse(success.stdout);
    assert.equal(report.summary.OBSERVED_MISMATCH, 0);
    assert.equal(report.candidatePass, 'NOT_EVALUATED');

    const canonicalPacketText = JSON.stringify(basePacket());
    const duplicateKeyPacketText = canonicalPacketText.replace(
      '"request":{"jsonrpc":"2.0","id":"native-control-target"',
      '"request":{"jsonrpc":"2.0","id":"conflicting-id","id":"native-control-target"',
    );
    assert.notEqual(duplicateKeyPacketText, canonicalPacketText);
    await writeFile(packetPath, duplicateKeyPacketText);
    const duplicateKey = spawnSync(process.execPath, [
      new URL('check-rpc-observed.mjs', import.meta.url).pathname,
      packetPath,
      profilePath,
      expectationsPath,
    ], { encoding: 'utf8', env: process.env });
    assert.equal(duplicateKey.status, 2);
    assert.match(duplicateKey.stderr, /DUPLICATE_PACKET_JSON_OBJECT_KEY:id/);
    await writeFile(packetPath, canonicalPacketText);

    await writeFile(profilePath, `${JSON.stringify(profile)}\n `);
    const replaced = spawnSync(process.execPath, [
      new URL('check-rpc-observed.mjs', import.meta.url).pathname,
      packetPath,
      profilePath,
      expectationsPath,
    ], { encoding: 'utf8', env: process.env });
    assert.equal(replaced.status, 2);
    assert.match(replaced.stderr, /FROZEN_RPC_PROFILE_BLOB_MISMATCH/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
