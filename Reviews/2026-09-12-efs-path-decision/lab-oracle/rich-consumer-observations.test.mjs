import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  analyzeRichConsumerObservations,
  gitBlobHash,
  parsePinnedRichConsumerProfile,
  parsePinnedRpcAbiProfile,
} from './rich-consumer-observations.mjs';

const require = createRequire(import.meta.url);
const { Interface } = require('ethers');

const profileBytes = await readFile(new URL(
  'rich-consumer-observations-profile-e77f36d.json',
  import.meta.url,
));
const profile = parsePinnedRichConsumerProfile(profileBytes);
const abiBytes = await readFile(new URL('rpc-observed-profile-dcc7b94.json', import.meta.url));
const abiProfile = parsePinnedRpcAbiProfile(abiBytes, profile);
const consumer = new Interface(abiProfile.artifacts.Consumer.abi
  .map(({ selector: _selector, ...declaration }) => declaration));

const TARGET = '0x1111111111111111111111111111111111111111';
const ZERO_WORD = `0x${'00'.repeat(32)}`;

function word(nibble) {
  return `0x${nibble.repeat(64)}`;
}

function quantity(value) {
  return `0x${BigInt(value).toString(16)}`;
}

function getterValues(stage) {
  return stage === 'paid-quote-read'
    ? {
      lastAdmission: 8n,
      lastCount: 12n,
      lastRevision: 2,
      lastScanned: 55n,
      lastStatus: 3,
      lastTarget: profile.recordIdentity.comparisonOnly.recordId,
      lastValue: 3100n,
    }
    : {
      lastAdmission: 9n,
      lastCount: 1n,
      lastRevision: 77,
      lastScanned: 66n,
      lastStatus: 4,
      lastTarget: word('e'),
      lastValue: 999n,
    };
}

function rawGetter({ name, value, blockNumber, blockHash, source, rpcId }) {
  const calldata = consumer.encodeFunctionData(name, []).toLowerCase();
  const returnData = consumer.encodeFunctionResult(name, [value]).toLowerCase();
  const block = quantity(blockNumber);
  return {
    to: TARGET,
    calldata,
    returnData,
    blockTag: block,
    blockHash,
    source,
    rpcId,
    method: 'eth_call',
    request: {
      jsonrpc: '2.0',
      id: rpcId,
      method: 'eth_call',
      params: [{ to: TARGET, data: calldata }, block],
    },
    response: { jsonrpc: '2.0', id: rpcId, result: returnData },
  };
}

function makeCell(cellIndex) {
  const lens = `0x${String(cellIndex + 2).repeat(40)}`;
  const quoteBlock = 100 + (cellIndex * 10);
  const listBlock = quoteBlock + 1;
  const quoteHash = word((cellIndex + 10).toString(16));
  const listHash = word((cellIndex + 12).toString(16));
  const quoteSource = `independent-${cellIndex}-paid-quote`;
  const listSource = `independent-${cellIndex}-listing`;
  const readQuoteCoordinates = [[lens], word('a'), word('b'), ZERO_WORD];
  const readListCoordinates = [[lens], word('c'), word('d'), '16'];
  const transactions = [
    {
      to: TARGET,
      data: consumer.encodeFunctionData('readQuote', readQuoteCoordinates).toLowerCase(),
      receipt: { status: '0x1', blockNumber: quantity(quoteBlock), blockHash: quoteHash },
    },
    {
      to: TARGET,
      data: consumer.encodeFunctionData('readList', [
        ...readListCoordinates.slice(0, 3),
        BigInt(readListCoordinates[3]),
      ]).toLowerCase(),
      receipt: { status: '0x1', blockNumber: quantity(listBlock), blockHash: listHash },
    },
  ];
  let rpcId = 1000 + (cellIndex * 100);
  const raw = [];
  for (const [stage, blockNumber, blockHash, source] of [
    ['paid-quote-read', quoteBlock, quoteHash, quoteSource],
    ['listing', listBlock, listHash, listSource],
  ]) {
    const values = getterValues(stage);
    for (const getter of profile.getters) {
      raw.push(rawGetter({
        name: getter.name,
        value: values[getter.name],
        blockNumber,
        blockHash,
        source,
        rpcId,
      }));
      rpcId += 1;
    }
  }
  return {
    packetCell: { transactions, raw },
    pins: {
      consumerTarget: TARGET,
      'paid-quote-read': { coordinates: readQuoteCoordinates, source: quoteSource },
      listing: { coordinates: readListCoordinates, source: listSource },
    },
  };
}

function fixture() {
  const packet = { cells: {}, candidateSuppliedPins: { consumerTarget: word('f') } };
  const pins = {
    standing: profile.pinContract.standing,
    measurementSourceAssociation: profile.source.measurementSourceAssociation.commit,
    coreSourceAssociation: profile.source.coreSourceAssociation,
    consumerTarget: TARGET,
    cells: {},
  };
  for (const [index, cellId] of profile.scope.cells.entries()) {
    const cell = makeCell(index);
    packet.cells[cellId] = cell.packetCell;
    pins.cells[cellId] = cell.pins;
  }
  return { packet, pins };
}

function analyze(value = fixture(), selectedProfileBytes = profileBytes) {
  return analyzeRichConsumerObservations(
    value.packet,
    selectedProfileBytes,
    abiBytes,
    value.pins,
  );
}

function stage(report, cellId, stageId) {
  return report.cells.find((cell) => cell.cellId === cellId).stages[stageId];
}

function rawAt(value, cellId, stageId, getterName) {
  const transactionName = profile.stages[stageId].transaction.name;
  const transactionSelector = profile.stages[stageId].transaction.selector;
  const transaction = value.packet.cells[cellId].transactions
    .find(({ data }) => data.slice(0, 10) === transactionSelector);
  const blockNumber = BigInt(transaction.receipt.blockNumber).toString();
  const getterSelector = profile.getters.find(({ name }) => name === getterName).selector;
  return value.packet.cells[cellId].raw.find((item) => (
    item.calldata === getterSelector && BigInt(item.blockTag).toString() === blockNumber
  ));
}

function replaceReturn(item, getterName, value) {
  const returnData = consumer.encodeFunctionResult(getterName, [value]).toLowerCase();
  item.returnData = returnData;
  item.response.result = returnData;
}

test('seals the richer profile and inherited ABI profile before interpretation', () => {
  assert.equal(gitBlobHash(profileBytes), '367c836d1952c19c16b3bdf6738675e3ea91233d');
  assert.equal(gitBlobHash(abiBytes), profile.source.publicAbiProfile.gitBlob);
  assert.equal(profile.frozenBeforeNewPacket, true);

  const changed = Buffer.from(profileBytes);
  changed[changed.indexOf(Buffer.from('"quote3100RawBody"'))] ^= 1;
  assert.throws(
    () => parsePinnedRichConsumerProfile(changed),
    /RICH_CONSUMER_PROFILE_BLOB_MISMATCH/,
  );
});

test('public analysis accepts exact pinned bytes and rejects caller-supplied parsed objects', () => {
  const value = fixture();
  const report = analyzeRichConsumerObservations(
    value.packet,
    profileBytes,
    abiBytes,
    value.pins,
  );
  assert.equal(report.provenance.status, 'OBSERVED_MATCH');
  assert.equal(report.profile.gitBlob, '367c836d1952c19c16b3bdf6738675e3ea91233d');
  assert.throws(
    () => analyzeRichConsumerObservations(value.packet, profile, abiProfile, value.pins),
    /RICH_CONSUMER_PROFILE_BYTES_REQUIRED/,
  );
  assert.throws(
    () => analyzeRichConsumerObservations(value.packet, profileBytes, abiProfile, value.pins),
    /RICH_CONSUMER_ABI_PROFILE_BYTES_REQUIRED/,
  );
});

test('accepts seven same-receipt-basis getters while keeping extra meanings UNKNOWN', () => {
  const report = analyze();
  assert.equal(report.candidatePass, 'NOT_EVALUATED');
  assert.equal(report.identity.comparisons.typeId, 'MATCH');
  assert.equal(report.identity.comparisons.bodyHash, 'MATCH');
  assert.equal(report.identity.comparisons.recordId, 'MATCH');

  for (const cellId of profile.scope.cells) {
    for (const stageId of profile.scope.stages) {
      const observed = stage(report, cellId, stageId);
      assert.equal(observed.rawCollection.status, 'OBSERVED_MATCH');
      assert.equal(observed.inheritedSemanticComparisons.status, 'OBSERVED_MATCH');
      assert.equal(observed.semanticInterpretation.status, 'UNKNOWN');
      assert.equal(Object.keys(observed.getters).length, 7);
      for (const name of profile.stages[stageId].unknownMeanings) {
        assert.equal(observed.getters[name].semantic.status, 'UNKNOWN');
      }
    }
  }
});

test('changing an uninterpreted getter value preserves raw consistency but not semantic meaning', () => {
  const value = fixture();
  const item = rawAt(value, 'native-one/quote', 'listing', 'lastValue');
  replaceReturn(item, 'lastValue', 123456n);
  const observed = stage(analyze(value), 'native-one/quote', 'listing');

  assert.equal(observed.rawCollection.status, 'OBSERVED_MATCH');
  assert.equal(observed.inheritedSemanticComparisons.status, 'OBSERVED_MATCH');
  assert.equal(observed.getters.lastValue.semantic.status, 'UNKNOWN');
  assert.equal(observed.getters.lastValue.observed, '123456');
});

test('changing an inherited semantic return is a mismatch despite valid raw encoding', () => {
  const value = fixture();
  const item = rawAt(value, 'signed-one/quote', 'paid-quote-read', 'lastValue');
  replaceReturn(item, 'lastValue', 3101n);
  const observed = stage(analyze(value), 'signed-one/quote', 'paid-quote-read');

  assert.equal(observed.rawCollection.status, 'OBSERVED_MATCH');
  assert.equal(observed.inheritedSemanticComparisons.status, 'OBSERVED_MISMATCH');
  assert.equal(observed.getters.lastValue.semantic.status, 'OBSERVED_MISMATCH');
});

test('changed predeclared body bytes cannot enter public analysis under supplied hash claims', () => {
  const changedProfileBytes = Buffer.from(profileBytes.toString().replace(
    profile.recordIdentity.quote3100RawBody,
    `${profile.recordIdentity.quote3100RawBody.slice(0, -2)}1d`,
  ));
  assert.throws(
    () => analyzeRichConsumerObservations(
      fixture().packet,
      changedProfileBytes,
      abiBytes,
      fixture().pins,
      {
        profileGitBlob: gitBlobHash(profileBytes),
        abiProfileGitBlob: gitBlobHash(abiBytes),
      },
    ),
    /RICH_CONSUMER_PROFILE_BLOB_MISMATCH/,
  );
});

test('missing independent target, coordinate, or source pins cannot produce raw agreement', () => {
  const cases = [
    (value) => { delete value.pins.cells['native-one/quote'].consumerTarget; },
    (value) => { delete value.pins.cells['native-one/quote']['paid-quote-read'].coordinates; },
    (value) => { delete value.pins.cells['native-one/quote']['paid-quote-read'].source; },
  ];
  for (const mutate of cases) {
    const value = fixture();
    mutate(value);
    const observed = stage(analyze(value), 'native-one/quote', 'paid-quote-read');
    assert.equal(observed.rawCollection.status, 'UNKNOWN');
    assert.equal(observed.inheritedSemanticComparisons.status, 'UNKNOWN');
  }
});

test('wrong independent target, coordinates, source, or source association is a mismatch', () => {
  const cases = [
    (value) => {
      value.pins.cells['native-one/quote'].consumerTarget =
        '0x9999999999999999999999999999999999999999';
    },
    (value) => { value.pins.cells['native-one/quote']['paid-quote-read'].coordinates[2] = word('9'); },
    (value) => { value.pins.cells['native-one/quote']['paid-quote-read'].source = 'wrong-source'; },
    (value) => { value.pins.measurementSourceAssociation = '0'.repeat(40); },
  ];
  for (const mutate of cases) {
    const value = fixture();
    mutate(value);
    const observed = stage(analyze(value), 'native-one/quote', 'paid-quote-read');
    assert.equal(observed.rawCollection.status, 'OBSERVED_MISMATCH');
  }
});

test('Consumer target authority is independent per cell and global target pins are inert', () => {
  const missing = fixture();
  delete missing.pins.cells['native-one/quote'].consumerTarget;
  missing.pins.consumerTarget = TARGET;
  assert.equal(
    stage(analyze(missing), 'native-one/quote', 'paid-quote-read').rawCollection.status,
    'UNKNOWN',
  );
  assert.equal(
    stage(analyze(missing), 'signed-one/quote', 'paid-quote-read').rawCollection.status,
    'OBSERVED_MATCH',
  );

  const wrong = fixture();
  wrong.pins.cells['native-one/quote'].consumerTarget =
    '0x9999999999999999999999999999999999999999';
  wrong.pins.consumerTarget = TARGET;
  assert.equal(
    stage(analyze(wrong), 'native-one/quote', 'paid-quote-read').rawCollection.status,
    'OBSERVED_MISMATCH',
  );
  assert.equal(
    stage(analyze(wrong), 'signed-one/quote', 'paid-quote-read').rawCollection.status,
    'OBSERVED_MATCH',
  );
});

test('a missing required getter remains UNKNOWN rather than agreement', () => {
  const value = fixture();
  const cell = value.packet.cells['native-one/quote'];
  const omitted = rawAt(value, 'native-one/quote', 'paid-quote-read', 'lastAdmission');
  cell.raw = cell.raw.filter((item) => item !== omitted);
  const observed = stage(analyze(value), 'native-one/quote', 'paid-quote-read');

  assert.equal(observed.rawCollection.status, 'UNKNOWN');
  assert.equal(observed.inheritedSemanticComparisons.status, 'UNKNOWN');
});

test('duplicate and substituted getter calls are visible mismatches', () => {
  const duplicate = fixture();
  duplicate.packet.cells['native-one/quote'].raw.push(structuredClone(
    rawAt(duplicate, 'native-one/quote', 'paid-quote-read', 'lastAdmission'),
  ));
  assert.equal(
    stage(analyze(duplicate), 'native-one/quote', 'paid-quote-read').rawCollection.status,
    'OBSERVED_MISMATCH',
  );

  const substituted = fixture();
  const item = rawAt(substituted, 'native-one/quote', 'paid-quote-read', 'lastAdmission');
  item.calldata = '0xdeadbeef';
  item.request.params[0].data = item.calldata;
  assert.equal(
    stage(analyze(substituted), 'native-one/quote', 'paid-quote-read').rawCollection.status,
    'OBSERVED_MISMATCH',
  );
});

test('basis drift or a conflicting block hash is a mismatch', () => {
  const drifted = fixture();
  const driftedItem = rawAt(drifted, 'signed-one/quote', 'listing', 'lastStatus');
  driftedItem.blockTag = quantity(999);
  driftedItem.request.params[1] = driftedItem.blockTag;
  assert.equal(
    stage(analyze(drifted), 'signed-one/quote', 'listing').rawCollection.status,
    'OBSERVED_MISMATCH',
  );

  const conflicted = fixture();
  rawAt(conflicted, 'signed-one/quote', 'listing', 'lastStatus').blockHash = word('f');
  assert.equal(
    stage(analyze(conflicted), 'signed-one/quote', 'listing').rawCollection.status,
    'OBSERVED_MISMATCH',
  );
});

test('malformed raw and transaction containers or entries fail closed before filtering', () => {
  const cases = [
    (value) => { value.packet.cells['native-one/quote'].raw = {}; },
    (value) => { value.packet.cells['native-one/quote'].raw.unshift(null); },
    (value) => { value.packet.cells['native-one/quote'].raw.length += 1; },
    (value) => { value.packet.cells['native-one/quote'].transactions = {}; },
    (value) => { value.packet.cells['native-one/quote'].transactions.unshift(null); },
    (value) => { value.packet.cells['native-one/quote'] = null; },
    (value) => { value.packet.cells = null; },
  ];
  for (const mutate of cases) {
    const value = fixture();
    mutate(value);
    assert.equal(
      stage(analyze(value), 'native-one/quote', 'paid-quote-read').rawCollection.status,
      'OBSERVED_MISMATCH',
    );
  }
});

test('malformed public packet values produce mismatch reports while absent packet evidence is unknown', () => {
  const value = fixture();
  for (const packet of [null, [], 7]) {
    const report = analyzeRichConsumerObservations(packet, profileBytes, abiBytes, value.pins);
    assert.equal(
      stage(report, 'native-one/quote', 'paid-quote-read').rawCollection.status,
      'OBSERVED_MISMATCH',
    );
  }
  const missing = fixture();
  delete missing.packet.cells;
  assert.equal(
    stage(analyze(missing), 'native-one/quote', 'paid-quote-read').rawCollection.status,
    'UNKNOWN',
  );
});

test('request/reply disagreement and duplicate JSON-RPC ids are mismatches', () => {
  const disagreement = fixture();
  const item = rawAt(disagreement, 'native-one/quote', 'listing', 'lastScanned');
  item.response.id += 1;
  assert.equal(
    stage(analyze(disagreement), 'native-one/quote', 'listing').rawCollection.status,
    'OBSERVED_MISMATCH',
  );

  const duplicate = fixture();
  const cell = duplicate.packet.cells['native-one/quote'];
  cell.raw[1].rpcId = cell.raw[0].rpcId;
  cell.raw[1].request.id = cell.raw[0].request.id;
  cell.raw[1].response.id = cell.raw[0].response.id;
  assert.equal(
    stage(analyze(duplicate), 'native-one/quote', 'paid-quote-read').rawCollection.status,
    'OBSERVED_MISMATCH',
  );
});

test('duplicate correlated envelope ids mismatch even when flat rpc ids are absent', () => {
  const value = fixture();
  const cell = value.packet.cells['native-one/quote'];
  delete cell.raw[0].rpcId;
  delete cell.raw[1].rpcId;
  cell.raw[1].request.id = cell.raw[0].request.id;
  cell.raw[1].response.id = cell.raw[0].response.id;
  assert.equal(
    stage(analyze(value), 'native-one/quote', 'paid-quote-read').rawCollection.status,
    'OBSERVED_MISMATCH',
  );
});

test('missing required raw transport evidence remains UNKNOWN rather than conflict', () => {
  const cases = [
    (item) => { delete item.rpcId; },
    (item) => { delete item.method; },
    (item) => { delete item.source; },
    (item) => { delete item.returnData; },
  ];
  for (const mutate of cases) {
    const value = fixture();
    mutate(rawAt(value, 'native-one/quote', 'listing', 'lastScanned'));
    assert.equal(
      stage(analyze(value), 'native-one/quote', 'listing').rawCollection.status,
      'UNKNOWN',
    );
  }
});

test('missing nested RPC evidence remains UNKNOWN', () => {
  const cases = [
    (item) => { delete item.request.jsonrpc; },
    (item) => { delete item.response.jsonrpc; },
    (item) => { delete item.request.id; },
    (item) => { delete item.response.id; },
    (item) => { delete item.request.method; },
    (item) => { delete item.request.params; },
    (item) => { delete item.request.params[0].to; },
    (item) => { delete item.request.params[0].data; },
    (item) => { delete item.request.params[1]; },
    (item) => { delete item.response.result; },
  ];
  for (const mutate of cases) {
    const value = fixture();
    mutate(rawAt(value, 'native-one/quote', 'listing', 'lastScanned'));
    assert.equal(
      stage(analyze(value), 'native-one/quote', 'listing').rawCollection.status,
      'UNKNOWN',
    );
  }
});

test('present contradictory nested RPC evidence remains OBSERVED_MISMATCH', () => {
  const cases = [
    (item) => { item.request.jsonrpc = '1.0'; },
    (item) => { item.request.id += 1; },
    (item) => { item.request.method = 'eth_getBalance'; },
    (item) => { item.request.params[0].to = '0x9999999999999999999999999999999999999999'; },
    (item) => { item.request.params[1] = quantity(999); },
    (item) => { item.response.result = word('f'); },
    (item) => { item.response.error = { code: -32000, message: 'conflict' }; },
  ];
  for (const mutate of cases) {
    const value = fixture();
    mutate(rawAt(value, 'native-one/quote', 'listing', 'lastScanned'));
    assert.equal(
      stage(analyze(value), 'native-one/quote', 'listing').rawCollection.status,
      'OBSERVED_MISMATCH',
    );
  }
});

test('missing RPC peers do not suppress malformed present carriers or fields', () => {
  const cases = [
    (item) => {
      delete item.request;
      item.response = 17;
    },
    (item) => {
      delete item.request.jsonrpc;
      item.response.jsonrpc = '1.0';
    },
    (item) => {
      delete item.request.id;
      item.response.id = {};
    },
    (item) => {
      delete item.returnData;
      delete item.response.result;
      item.response.error = { message: 17 };
    },
  ];
  for (const mutate of cases) {
    const value = fixture();
    mutate(rawAt(value, 'native-one/quote', 'listing', 'lastScanned'));
    assert.equal(
      stage(analyze(value), 'native-one/quote', 'listing').rawCollection.status,
      'OBSERVED_MISMATCH',
    );
  }
});

test('duplicate request-only and response-only ids remain visible without flat ids', () => {
  for (const carrier of ['request', 'response']) {
    const value = fixture();
    const [first, second] = value.packet.cells['native-one/quote'].raw;
    delete first.rpcId;
    delete second.rpcId;
    const peer = carrier === 'request' ? 'response' : 'request';
    first[carrier].id = 17;
    second[carrier].id = 17;
    delete first[peer].id;
    delete second[peer].id;
    assert.equal(
      stage(analyze(value), 'native-one/quote', 'paid-quote-read').rawCollection.status,
      'OBSERVED_MISMATCH',
    );
  }
});

test('duplicate paid transactions cannot select a convenient receipt basis', () => {
  const value = fixture();
  const cell = value.packet.cells['signed-one/quote'];
  cell.transactions.push(structuredClone(cell.transactions[0]));
  const observed = stage(analyze(value), 'signed-one/quote', 'paid-quote-read');
  assert.equal(observed.rawCollection.status, 'OBSERVED_MISMATCH');
  assert.equal(observed.inheritedSemanticComparisons.status, 'OBSERVED_MISMATCH');
});
