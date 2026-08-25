import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const packetRoot = path.resolve(import.meta.dirname);
const checkerPath = path.join(packetRoot, 'check-consumption.mjs');

async function checker() {
  assert.equal(fs.existsSync(checkerPath), true, 'serialized-only checker must exist');
  return import(`${pathToFileURL(checkerPath).href}?test=${Date.now()}`);
}

function temporaryPacket() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'efs-explorer-c0-'));
  fs.cpSync(packetRoot, root, { recursive: true });
  return root;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function relockMutatedHello(documents) {
  const hash = crypto.createHash('sha256').update(canonicalJson(documents.hello.payload)).digest('hex');
  documents.hello.payloadSha256 = hash;
  documents.consumer.helloExpected.payloadSha256 = hash;
  documents.sourceLock.helloPayloadSha256 = hash;
}

test('draft mode independently consumes exactly five serialized Core artifacts', async () => {
  const { verifyPacket } = await checker();
  const summary = verifyPacket(packetRoot, { mode: 'draft' });
  assert.equal(summary.authorizedInputCount, 5);
  assert.equal(summary.coreCommitStatus, 'b9088d6a24f4d40bcca6ba300523b25cc7c608d2');
  assert.equal(summary.rawTypeEnvelopeCount, 4);
  assert.equal(summary.rawResultV0Retained, true);
});

test('commit-ready mode accepts the exact locked Core source commit', async () => {
  const { verifyPacket } = await checker();
  const summary = verifyPacket(packetRoot, { mode: 'commit-ready' });
  assert.equal(summary.coreCommitStatus, 'b9088d6a24f4d40bcca6ba300523b25cc7c608d2');
});

test('role-neutral source receipt retains its exact compact JSON plus LF serialization', () => {
  const lockPath = path.join(packetRoot, 'core-source-lock-v0.json');
  const lockBytes = fs.readFileSync(lockPath, 'utf8');
  assert.equal(lockBytes, `${JSON.stringify(JSON.parse(lockBytes))}\n`);
});

test('commit-ready mode rejects a synthetic pending Core source placeholder', async (t) => {
  const { verifyPacket } = await checker();
  const root = temporaryPacket();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const lockPath = path.join(root, 'core-source-lock-v0.json');
  const reportPath = path.join(root, 'explorer-consumption-v0.json');
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  lock.corePacketCommit = 'PENDING_EXACT_CORE_COMMIT';
  report.status = 'WORKING_DRAFT_PENDING_EXACT_CORE_COMMIT';
  const lockBytes = `${JSON.stringify(lock)}\n`;
  fs.writeFileSync(lockPath, lockBytes);
  report.sourceLock.sha256 = crypto.createHash('sha256').update(lockBytes).digest('hex');
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  assert.throws(
    () => verifyPacket(root, { mode: 'commit-ready' }),
    /exact Core commit.*required|pending.*commit-ready/i,
  );
});

test('direct guest consumption cannot acquire wallet, account, Commons, hosted-indexer, or OS dependencies', async () => {
  const { loadDocuments, validateDocuments } = await checker();
  const documents = loadDocuments(packetRoot);
  documents.hello.payload.adapter.explorer.requiresWallet = true;
  relockMutatedHello(documents);
  assert.throws(() => validateDocuments(documents), /requiresWallet.*false|direct guest/i);
});

test('raw Result bytes and raw Type envelopes cannot be replaced by decoded facades', async () => {
  const { loadDocuments, validateDocuments } = await checker();
  const documents = loadDocuments(packetRoot);
  documents.hello.payload.result.encoded = '0x00';
  relockMutatedHello(documents);
  assert.throws(() => validateDocuments(documents), /raw ResultV0|raw result/i);

  const second = loadDocuments(packetRoot);
  second.hello.payload.portable.typeEnvelopes.fileRevision.rawTypeBytes = '0x00';
  relockMutatedHello(second);
  assert.throws(() => validateDocuments(second), /raw Type envelope|raw type/i);
});

test('UNKNOWN and PARTIAL remain literal independent grades and E1b remains unrun', async () => {
  const { verifyPacket } = await checker();
  const summary = verifyPacket(packetRoot, { mode: 'draft' });
  assert.deepEqual(summary.qualificationCodes, {
    bytesPartial: 2,
    coveragePartial: 2,
    effectUnknown: 3,
    presenceUnknown: 3,
    selectionUnknown: 4,
  });
  assert.equal(summary.evidenceCeiling.e1b, 'NOT_RUN');
  assert.equal(summary.evidenceCeiling.runtimeDependencyTrace, 'NOT_RUN');
});

test('an extra input file violates the serialized-only authority surface', async (t) => {
  const { verifyPacket } = await checker();
  const root = temporaryPacket();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'inputs', 'core-source.cjs'), 'module.exports = {};\n');
  assert.throws(() => verifyPacket(root, { mode: 'draft' }), /exactly five|unauthorized input/i);
});

test('nonadoption ceilings stay literal in both source lock and Explorer report', async () => {
  const { verifyPacket } = await checker();
  const summary = verifyPacket(packetRoot, { mode: 'draft' });
  assert.deepEqual(summary.nonadoption, {
    deploymentAuthorized: false,
    durable: false,
    freezeAuthorized: false,
    productionReady: false,
    protocolConformance: false,
  });
});
