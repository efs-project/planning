import assert from 'node:assert/strict';
import test from 'node:test';
import { Interface, keccak256 } from 'ethers';
import * as utilities from '../sdk/index.js';
import { readDataRow, groupDataRows, selectDataRows, createDataInventory } from '../web/data-view.mjs';

const basis = { chainId: 31337n, blockNumber: 12n, blockHash: `0x${'ab'.repeat(32)}`, timestamp: 123n };
const domain = { realmId: 'lab-realm', core: 'lab-core', profile: 'efs-lab/1' };
const schemaId = utilities.deriveSchemaId('0x0401');
const otherSchema = utilities.deriveSchemaId('0x0402');
const qualification = { coverage: 'COMPLETE', support: 'SUPPORTED', validation: 'VALID', currentness: 'CURRENT_AT_BASIS', availability: 'AVAILABLE', bytes: 'RETURNED', integrity: 'VERIFIED', authority: 'NOT_APPLICABLE', finality: 'UNKNOWN', effect: 'NOT_APPLICABLE' };
const result = (subject, value, extra = {}) => ({ outcome: 'FOUND', value, basis, domain: { ...domain, subject }, qualification: { ...qualification }, evidence: [{ source: 'test-reader', response: value }], ...extra });

function reader({ descriptor = '0x0401', fields = ['ASCII', 42n], fault, replacementBasis, gate } = {}) {
  const schema = utilities.deriveSchemaId(descriptor);
  const bytes = utilities.encodeTypedPayload(descriptor, fields);
  const contentId = utilities.deriveContentId(bytes);
  const id = utilities.deriveRecordId({ schemaId: schema, data: bytes });
  const requests = [];
  const sdk = {
    async readExact(request) {
      requests.push(request);
      if (request.kind === 'record') return result(id, { schemaId: schema, contentId });
      return result(schema, fault === 'wrong-schema' ? '0x0402' : descriptor);
    },
    async readVerifiedBytes(request) {
      requests.push(request);
      if (gate) await gate;
      if (fault === 'corrupt') return result(contentId, undefined, { observedBytes: '0xff', reasonCode: 'CONTENT_ID_MISMATCH', qualification: { ...qualification, integrity: 'FAILED' } });
      if (fault === 'unavailable') return result(contentId, undefined, { reasonCode: 'CARRIER_MISSING', qualification: { ...qualification, availability: 'UNAVAILABLE', bytes: 'NOT_RETURNED', integrity: 'UNKNOWN' } });
      return result(contentId, { bytes }, replacementBasis ? { basis: replacementBasis } : {});
    },
    async validateTypedPayloadAtBasis(request) {
      requests.push(request);
      return result(schema, undefined, { descriptor, computedSchemaId: schema, valid: true, fields: utilities.decodeTypedPayload(descriptor, request.data), qualification: { ...qualification, currentness: 'UNKNOWN' } });
    },
  };
  return { sdk, id, contentId, requests };
}

test('u64 values remain decimal strings and sort numerically without Number rounding', async () => {
  const values = [18446744073709551615n, 42n, 9007199254740993n, 9007199254740992n];
  const rows = await Promise.all(values.map(async number => {
    const { sdk, id } = reader({ fields: ['value', number] });
    return readDataRow({ sdk, utilities, id, basis, domain });
  }));
  assert.deepEqual(rows.map(row => row.fields[1].value), ['18446744073709551615', '42', '9007199254740993', '9007199254740992']);
  assert.deepEqual(selectDataRows(rows, { schemaId, sort: 'field:1', direction: 'asc' }).map(row => row.fields[1].value), ['42', '9007199254740992', '9007199254740993', '18446744073709551615']);
  assert.deepEqual(rows[0].fields[1], { index: 1, path: [1], tag: 1, kind: 'u64', state: 'VALID', value: '18446744073709551615' });
});

test('different exact schemas never merge and filter affects only selected loaded rows', async () => {
  const one = reader({ fields: ['<img src=x onerror=alert(1)>', 42n] });
  const two = reader({ descriptor: '0x0402', fields: ['ASCII', true] });
  const rows = await Promise.all([one, two].map(({ sdk, id }) => readDataRow({ sdk, utilities, id, basis, domain })));
  const groups = groupDataRows(rows);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map(group => [group.schemaId, group.rows.length]), [[schemaId, 1], [otherSchema, 1]]);
  assert.equal(selectDataRows(rows, { schemaId, filter: 'onerror' })[0].fields[0].value, '<img src=x onerror=alert(1)>');
  assert.equal(selectDataRows(rows, { schemaId: otherSchema, filter: 'onerror' }).length, 0);
});

test('corrupt and unavailable payload rows remain in their schema with raw failure evidence', async () => {
  const rows = await Promise.all(['corrupt', 'unavailable'].map(async fault => {
    const { sdk, id, requests } = reader({ fault });
    const row = await readDataRow({ sdk, utilities, id, basis, domain });
    assert.equal(requests.filter(request => 'data' in request).length, 0, 'unverified bytes must never reach typed validation');
    return row;
  }));
  assert.deepEqual(rows.map(row => row.status), ['FAILED', 'UNAVAILABLE']);
  assert.equal(groupDataRows(rows)[0].rows.length, 2);
  assert.equal(rows[0].evidence.payload.observedBytes, '0xff');
  assert.equal(rows[1].evidence.payload.reasonCode, 'CARRIER_MISSING');
  assert.equal(rows[0].fields.length, 0);
});

test('all record/schema/byte/validation requests pin the page basis and reject a mixed basis', async () => {
  const good = reader();
  assert.equal((await readDataRow({ ...good, utilities, basis, domain })).status, 'VALIDATED');
  assert.ok(good.requests.every(request => request.blockTag === basis));
  const bad = reader({ replacementBasis: { ...basis, chainId: 1n } });
  const row = await readDataRow({ ...bad, utilities, basis, domain });
  assert.equal(row.status, 'FAILED');
  assert.equal(row.reasonCode, 'MIXED_READ_BASIS');
  assert.equal(row.evidence.payload.basis.chainId, 1n);
});

test('descriptor substitution cannot label values under a different exact schema', async () => {
  const fixture = reader({ fault: 'wrong-schema' });
  const row = await readDataRow({ ...fixture, utilities, basis, domain });
  assert.equal(row.status, 'FAILED');
  assert.equal(row.reasonCode, 'SCHEMA_ID_MISMATCH');
  assert.equal(row.fields.length, 0);
});

test('genuine verified payload substituted under a different requested Record ID is a retained failed row', async () => {
  const fixture = reader({ fields: ['Substituted payload', 42n] });
  const requestedId = `0x${'99'.repeat(32)}`;
  const readExact = fixture.sdk.readExact;
  fixture.sdk.readExact = async request => {
    const observed = await readExact(request);
    return request.kind === 'record' ? { ...observed, domain: { ...observed.domain, subject: requestedId } } : observed;
  };
  const row = await readDataRow({ ...fixture, id: requestedId, utilities, basis, domain });
  assert.equal(row.status, 'FAILED');
  assert.equal(row.reasonCode, 'RECORD_ID_MISMATCH');
  assert.equal(row.id, requestedId);
  assert.equal(row.schemaId, schemaId);
  assert.deepEqual(row.fields, []);
  assert.equal(row.evidence.computedRecordId, fixture.id);
  assert.equal(row.evidence.payload.qualification.integrity, 'VERIFIED');
  assert.equal(row.evidence.record.domain.subject, requestedId);
  assert.equal(fixture.requests.filter(request => 'data' in request).length, 0);
});

test('missing Record identity utility never permits a validated or decoded row', async () => {
  const fixture = reader();
  const { deriveRecordId, ...incompleteUtilities } = utilities;
  const row = await readDataRow({ ...fixture, utilities: incompleteUtilities, basis, domain });
  assert.equal(row.status, 'UNSUPPORTED');
  assert.equal(row.reasonCode, 'UNSUPPORTED_RECORD_IDENTITY_UTILITY');
  assert.deepEqual(row.fields, []);
  assert.ok(row.evidence.payload);
  assert.equal(fixture.requests.filter(request => 'data' in request).length, 0);
});

test('actual SDK RPC substitution cannot lend the requested Record ID to genuine different bytes', async () => {
  const coreAbi = [
    'function runId() view returns (bytes32)', 'function rootId() view returns (bytes32)',
    'function owner() view returns (address)', 'function byteStore() view returns (address)',
    'function getRecord(bytes32) view returns (tuple(bytes32 schemaId,bytes32 contentId))',
    'function getSchema(bytes32) view returns (bytes)',
  ];
  const byteStoreAbi = ['function exists(bytes32) view returns (bool)', 'function read(bytes32) view returns (bytes)'];
  const core = '0x4000000000000000000000000000000000000004';
  const byteStore = '0x5000000000000000000000000000000000000005';
  const deployment = { chainId: basis.chainId, core, byteStore, coreAbi, byteStoreAbi, rootId: `0x${'77'.repeat(32)}`, runId: `0x${'66'.repeat(32)}`, realmId: `0x${'66'.repeat(32)}`, profile: 'efs-lab/1', owner: '0x1000000000000000000000000000000000000001', runtimeCodeHashes: { core: keccak256('0x6000'), byteStore: keccak256('0x6001') } };
  const sourceDomain = { realmId: deployment.realmId, core, profile: deployment.profile };
  const coreInterface = new Interface(coreAbi);
  const byteInterface = new Interface(byteStoreAbi);
  const bytes = utilities.encodeTypedPayload('0x0401', ['Substituted payload', 42n]);
  const contentId = utilities.deriveContentId(bytes);
  const genuineId = utilities.deriveRecordId({ schemaId, data: bytes });
  const requestedId = `0x${'99'.repeat(32)}`;
  const provider = { async request(request) {
    if (request.method === 'eth_chainId') return '0x7a69';
    if (request.method === 'eth_getBlockByHash') return { number: '0xc', hash: basis.blockHash, timestamp: '0x7b' };
    if (request.method === 'eth_getCode') return request.params[0].toLowerCase() === core ? '0x6000' : '0x6001';
    if (request.method !== 'eth_call') throw new Error(`Unexpected RPC ${request.method}`);
    const iface = request.params[0].to.toLowerCase() === core ? coreInterface : byteInterface;
    const parsed = iface.parseTransaction({ data: request.params[0].data });
    if (['runId', 'rootId', 'owner', 'byteStore'].includes(parsed.name)) return iface.encodeFunctionResult(parsed.name, [deployment[parsed.name]]);
    if (parsed.name === 'getRecord') return iface.encodeFunctionResult('getRecord', [{ schemaId, contentId }]);
    if (parsed.name === 'getSchema') return iface.encodeFunctionResult('getSchema', ['0x0401']);
    if (parsed.name === 'exists') return iface.encodeFunctionResult('exists', [true]);
    if (parsed.name === 'read') return iface.encodeFunctionResult('read', [bytes]);
    throw new Error(`Unexpected call ${parsed.name}`);
  } };
  const sdk = utilities.createLabSdk({ deployment, readProvider: provider });
  const genuine = await readDataRow({ sdk, utilities, id: genuineId, basis, domain: sourceDomain });
  assert.equal(genuine.status, 'VALIDATED');
  assert.equal(genuine.fields[0].value, 'Substituted payload');
  const substituted = await readDataRow({ sdk, utilities, id: requestedId, basis, domain: sourceDomain });
  assert.equal(substituted.status, 'FAILED');
  assert.equal(substituted.reasonCode, 'RECORD_ID_MISMATCH');
  assert.deepEqual(substituted.fields, []);
  assert.equal(substituted.evidence.record.domain.subject, requestedId);
  assert.equal(substituted.evidence.payload.qualification.integrity, 'VERIFIED');
  assert.equal(substituted.evidence.computedRecordId, genuineId);
  assert.ok(substituted.evidence.record.evidence.some(observation => observation.responseBytes));
});

function page(ids, cursor, total, pageBasis = basis) {
  const next = cursor + BigInt(ids.length);
  return result(undefined, undefined, {
    items: ids, cursor, next, total, basis: pageBasis,
    domain: { ...domain, operation: 'page:records' },
    continuation: next < total ? { cursor: next, basis: pageBasis, domain, total } : null,
    pageCoverage: next === total ? 'PAGE_COMPLETE' : 'PAGE_PARTIAL',
    qualification: { ...qualification, coverage: cursor === 0n && next === total ? 'COMPLETE' : 'PARTIAL' },
  });
}

test('bounded continuation preserves PARTIAL until the complete finite inventory is loaded', async () => {
  const fixtures = ['one', 'two', 'three', 'four', 'five'].map(label => reader({ fields: [label, 42n] }));
  const ids = fixtures.map(fixture => fixture.id);
  const pageRequests = [];
  const sdk = { ...fixtures[0].sdk, async readPage(request) {
    pageRequests.push(request);
    return page(ids.slice(Number(request.cursor ?? 0n), Number(request.cursor ?? 0n) + request.limit), request.cursor ?? 0n, 5n);
  }, readExact(request) {
    return (request.kind === 'record' ? fixtures.find(fixture => fixture.id === request.id) : fixtures[0]).sdk.readExact(request);
  }, readVerifiedBytes(request) {
    return fixtures.find(fixture => fixture.contentId === request.contentId).sdk.readVerifiedBytes(request);
  } };
  const model = createDataInventory({ sdk, utilities });
  await model.refresh();
  assert.equal(model.snapshot().rows.length, 4);
  assert.equal(model.snapshot().coverage, 'PARTIAL');
  await model.loadMore();
  assert.equal(model.snapshot().rows.length, 5);
  assert.ok(model.snapshot().rows.every(row => row.status === 'VALIDATED'));
  assert.equal(model.snapshot().coverage, 'COMPLETE');
  assert.equal(pageRequests[1].blockTag.blockHash, basis.blockHash);
  assert.deepEqual(pageRequests.map(request => request.limit), [4, 4]);
});

test('refresh clears old rows immediately and deferred old page cannot replace the new generation', async () => {
  let releaseOld;
  const old = new Promise(resolve => { releaseOld = resolve; });
  let calls = 0;
  const changes = [];
  const model = createDataInventory({ sdk: { readPage: async () => ++calls === 1 ? old : page([], 0n, 0n, { ...basis, blockNumber: 13n }) }, utilities, onChange: state => changes.push(state) });
  const pending = model.refresh();
  await model.refresh();
  releaseOld(page(['obsolete'], 0n, 1n));
  await pending;
  assert.equal(model.snapshot().basis.blockNumber, 13n);
  assert.deepEqual(model.snapshot().rows, []);
  assert.equal(changes.at(-1).coverage, 'COMPLETE');
});

test('deactivation suppresses deferred row results and all later callbacks', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const fixture = reader({ gate });
  const changes = [];
  const model = createDataInventory({ sdk: { ...fixture.sdk, readPage: async () => page([fixture.id], 0n, 1n) }, utilities, onChange: state => changes.push(state) });
  const pending = model.refresh();
  await new Promise(resolve => setImmediate(resolve));
  model.deactivate();
  const previous = changes.length;
  release();
  await pending;
  assert.equal(changes.length, previous);
  assert.equal(model.snapshot().rows.length, 0);
});

test('failed continuation retains loaded rows and does not imply complete or absent inventory', async () => {
  const fixture = reader();
  let count = 0;
  const model = createDataInventory({ sdk: { ...fixture.sdk, readPage: async () => ++count === 1 ? page([fixture.id], 0n, 2n) : { outcome: 'UNKNOWN', reasonCode: 'PAGE_UNAVAILABLE', evidence: [{ error: 'offline' }], qualification: { ...qualification, coverage: 'UNKNOWN' } } }, utilities });
  await model.refresh();
  await model.loadMore();
  assert.equal(model.snapshot().rows.length, 1);
  assert.equal(model.snapshot().coverage, 'PARTIAL');
  assert.equal(model.snapshot().pageError.reasonCode, 'PAGE_UNAVAILABLE');
});

test('continuation with a conflicting domain or total cannot establish a partial inventory', async () => {
  for (const mutation of [
    continuation => ({ ...continuation, domain: { ...domain, realmId: 'other-realm' } }),
    continuation => ({ ...continuation, total: 99n }),
  ]) {
    const fixture = reader();
    const malformed = page([fixture.id], 0n, 2n);
    malformed.continuation = mutation(malformed.continuation);
    const model = createDataInventory({ sdk: { ...fixture.sdk, readPage: async () => malformed }, utilities });
    await model.refresh();
    assert.equal(model.snapshot().rows.length, 0);
    assert.equal(model.snapshot().coverage, 'UNKNOWN');
    assert.equal(model.snapshot().pageError.reasonCode, 'INVALID_PAGE_CONTINUATION');
  }
});

test('a nonterminal page mislabeled complete cannot establish complete inventory', async () => {
  const fixture = reader();
  const malformed = page([fixture.id], 0n, 2n);
  malformed.pageCoverage = 'PAGE_COMPLETE';
  const model = createDataInventory({ sdk: { ...fixture.sdk, readPage: async () => malformed }, utilities });
  await model.refresh();
  assert.equal(model.snapshot().rows.length, 0);
  assert.equal(model.snapshot().pageError.reasonCode, 'INVALID_PAGE_COVERAGE');
});

test('unsupported schema retains the record with its exact schema and observed attempt', async () => {
  const fixture = reader();
  const readExact = fixture.sdk.readExact;
  fixture.sdk.readExact = async request => {
    const observed = await readExact(request);
    return request.kind === 'schema' ? { ...observed, qualification: { ...observed.qualification, support: 'UNSUPPORTED' }, reasonCode: 'SCHEMA_UNSUPPORTED' } : observed;
  };
  const row = await readDataRow({ ...fixture, utilities, basis, domain });
  assert.equal(row.schemaId, schemaId);
  assert.equal(row.status, 'UNSUPPORTED');
  assert.equal(row.evidence.schema.reasonCode, 'SCHEMA_UNSUPPORTED');
  assert.equal(row.fields.length, 0);
});

test('every typed-data hop rejects a different basis or source domain with its evidence intact', async () => {
  for (const [method, kind, evidenceKey] of [
    ['readExact', 'record', 'record'],
    ['readExact', 'schema', 'schema'],
    ['readVerifiedBytes', undefined, 'payload'],
    ['validateTypedPayloadAtBasis', undefined, 'decoded'],
  ]) {
    for (const change of ['basis', 'domain']) {
      const fixture = reader();
      const original = fixture.sdk[method];
      fixture.sdk[method] = async request => {
        const observed = await original(request);
        if (kind && request.kind !== kind) return observed;
        return change === 'basis' ? { ...observed, basis: { ...basis, blockHash: `0x${'cd'.repeat(32)}` } } : { ...observed, domain: { ...observed.domain, profile: 'different-profile' } };
      };
      const row = await readDataRow({ ...fixture, utilities, basis, domain });
      assert.equal(row.status, 'FAILED', `${method}/${kind}/${change}`);
      assert.equal(row.reasonCode, change === 'basis' ? 'MIXED_READ_BASIS' : 'MIXED_READ_DOMAIN');
      assert.ok(row.evidence[evidenceKey]);
      assert.deepEqual(row.fields, []);
    }
  }
});
