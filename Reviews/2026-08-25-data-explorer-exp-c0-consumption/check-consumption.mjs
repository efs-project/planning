import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const INPUTS = Object.freeze([
  {
    file: 'consumer-contract-v0.json',
    sourcePath: 'Reviews/2026-08-25-efs2-exp-c0-v0-control/consumer-contract-v0.json',
  },
  {
    file: 'handoff-v0.json',
    sourcePath: 'Reviews/2026-08-25-efs2-exp-c0-v0-control/handoff-v0.json',
  },
  {
    file: 'hello-files-v0.json',
    sourcePath: 'Reviews/2026-08-25-efs2-exp-c0-v0-control/hello-files-v0.json',
  },
  {
    file: 'result-v0.json',
    sourcePath: 'Reviews/2026-08-25-efs2-exp-c0-v0-control/vectors/result-v0.json',
  },
  {
    file: 'type-envelope-v0.json',
    sourcePath: 'Reviews/2026-08-25-efs2-exp-c0-v0-control/vectors/type-envelope-v0.json',
  },
]);

const NONADOPTION = Object.freeze({
  deploymentAuthorized: false,
  durable: false,
  freezeAuthorized: false,
  productionReady: false,
  protocolConformance: false,
});

const LOCK_FIELDS = Object.freeze([
  'format',
  'profile',
  'corePacketCommit',
  'handoffSha256',
  'consumerContractSha256',
  'artifactLocks',
  'helloPayloadSha256',
  'protocolConformance',
  'durable',
  'productionReady',
  'deploymentAuthorized',
  'freezeAuthorized',
]);

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256HexBytes(value, label) {
  assert.match(value, /^0x(?:[0-9a-fA-F]{2})*$/, `${label} must be canonical hex bytes`);
  return sha256(Buffer.from(value.slice(2), 'hex'));
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function jsonPointer(document, pointer) {
  assert.match(pointer, /^#(?:\/|$)/, `invalid JSON pointer ${pointer}`);
  if (pointer === '#') return document;
  return pointer.slice(2).split('/').reduce((value, token) => {
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    assert.notEqual(value, undefined, `JSON pointer ${pointer} is missing ${key}`);
    return value[key];
  }, document);
}

function reportReference(documents, reference) {
  const separator = reference.indexOf('#');
  assert.ok(separator > 0, `report reference lacks a JSON pointer: ${reference}`);
  const file = reference.slice(0, separator).replace(/^inputs\//, '');
  const pointer = reference.slice(separator);
  const key = INPUTS.find(({ file: candidate }) => candidate === file)?.file;
  assert.ok(key, `report reference names unauthorized input ${file}`);
  return jsonPointer(documents.byFile[key], pointer);
}

function sortedLocks(value) {
  return [...value].sort((left, right) => left.path.localeCompare(right.path));
}

function assertNonadoption(value, label) {
  for (const [field, expected] of Object.entries(NONADOPTION)) {
    assert.equal(value?.[field], expected, `${label}.${field} must remain literal ${expected}`);
  }
}

export function loadDocuments(packetRoot) {
  const byFile = Object.fromEntries(INPUTS.map(({ file }) => [
    file,
    JSON.parse(fs.readFileSync(path.join(packetRoot, 'inputs', file), 'utf8')),
  ]));
  return {
    byFile,
    consumer: byFile['consumer-contract-v0.json'],
    handoff: byFile['handoff-v0.json'],
    hello: byFile['hello-files-v0.json'],
    resultVector: byFile['result-v0.json'],
    typeEnvelope: byFile['type-envelope-v0.json'],
    sourceLock: JSON.parse(fs.readFileSync(path.join(packetRoot, 'core-source-lock-v0.json'), 'utf8')),
    report: JSON.parse(fs.readFileSync(path.join(packetRoot, 'explorer-consumption-v0.json'), 'utf8')),
  };
}

export function validateDocuments(documents, { mode = 'draft' } = {}) {
  const {
    consumer,
    handoff,
    hello,
    report,
    resultVector,
    sourceLock,
    typeEnvelope,
  } = documents;

  assert.ok(['draft', 'commit-ready'].includes(mode), `unknown checker mode ${mode}`);
  assert.equal(handoff.format, 'efs2-exp-c0-v0-build-handoff/0');
  assert.equal(consumer.format, 'efs2-exp-c0-v0-consumer-contract/0');
  assert.equal(hello.status, 'DISPOSABLE_INTEGRATION_CONTROL');
  assert.equal(resultVector.format, 'efs2-exp-c0-v0-result-vector/0');
  assert.equal(typeEnvelope.format, 'efs2-exp-c0-v0-type-envelope-corpus/0');
  assert.equal(report.format, 'efs2-data-explorer-exp-c0-serialized-consumption/0');
  assert.equal(sourceLock.format, consumer.sameSourceReceipt.format);
  assert.deepEqual(Object.keys(sourceLock), LOCK_FIELDS, 'role-neutral source-lock field order/surface drifted');

  if (mode === 'commit-ready') {
    assert.match(
      sourceLock.corePacketCommit,
      /^[0-9a-f]{40}$/,
      'exact Core commit is required; pending is forbidden in commit-ready mode',
    );
    assert.notEqual(report.status, 'WORKING_DRAFT_PENDING_EXACT_CORE_COMMIT');
  } else {
    assert.ok(
      sourceLock.corePacketCommit === 'PENDING_EXACT_CORE_COMMIT'
        || /^[0-9a-f]{40}$/.test(sourceLock.corePacketCommit),
      'draft source lock must use the exact PENDING placeholder or a lowercase Core commit',
    );
  }

  assert.deepEqual(
    sourceLock.artifactLocks,
    sortedLocks(handoff.pinnedVectors),
    'role-neutral source lock must retain the exact handoff lock set in lexical path order',
  );
  assert.equal(sourceLock.helloPayloadSha256, hello.payloadSha256);
  assert.equal(consumer.helloExpected.payloadSha256, hello.payloadSha256);
  assert.equal(
    sha256(Buffer.from(canonicalJson(hello.payload))),
    hello.payloadSha256,
    'HELLO canonical payload SHA-256 mismatch',
  );

  for (const pointer of consumer.requiredJsonPointers.explorer) jsonPointer(hello, pointer);
  for (const pointer of consumer.requiredJsonPointers.shared) jsonPointer(hello, pointer);

  const helloGuest = hello.payload.adapter.explorer;
  const dependencies = ['requiresWallet', 'requiresAccount', 'requiresCommons', 'requiresHostedIndexer', 'requiresOsBoot'];
  assert.equal(helloGuest.directGuest, true, 'direct guest must remain enabled');
  assert.equal(report.directGuest.enabled, true, 'Explorer report must retain direct guest');
  for (const field of dependencies) {
    assert.equal(helloGuest[field], false, `direct guest ${field} must remain false`);
    assert.equal(consumer.explorer.forbiddenDependencies[field], false, `consumer ${field} must remain false`);
    assert.equal(report.directGuest[field], false, `report ${field} must remain false`);
  }
  assert.deepEqual(report.forbiddenOwnership, consumer.explorer.forbiddenOwnership);

  assert.equal(report.evidenceCeiling.e1a, consumer.explorer.evidenceCeiling.e1a);
  assert.equal(report.evidenceCeiling.e1b, 'NOT_RUN');
  assert.equal(report.evidenceCeiling.runtimeDependencyTrace, 'NOT_RUN');
  assert.equal(report.evidenceCeiling.serializedDependencyClaimsOnly, true);
  assert.equal(report.evidenceCeiling.staticSerializedConsumption, 'PASS');

  assert.deepEqual(report.qualifiedResult.rawFacts, consumer.helloExpected.decodedResult.facts);
  assert.deepEqual(report.qualifiedResult.namedFacts, consumer.helloExpected.namedResult.facts);
  const qualificationCodes = {
    bytesPartial: consumer.resultV0.enums.bytes.PARTIAL,
    coveragePartial: consumer.resultV0.enums.coverage.PARTIAL,
    effectUnknown: consumer.resultV0.enums.effect.UNKNOWN,
    presenceUnknown: consumer.resultV0.enums.presence.UNKNOWN,
    selectionUnknown: consumer.resultV0.enums.selection.UNKNOWN,
  };
  assert.deepEqual(
    report.qualifiedResult.qualificationCodesThatMustNotCollapse,
    qualificationCodes,
    'UNKNOWN/PARTIAL qualification codes drifted or collapsed',
  );

  const rawResult = reportReference(documents, report.rawRetention.resultV0.ref);
  assert.equal(rawResult, hello.payload.result.encoded, 'raw ResultV0 reference was replaced');
  assert.equal(
    sha256HexBytes(rawResult, 'raw ResultV0'),
    report.rawRetention.resultV0.sha256RawBytes,
    'raw ResultV0 bytes were replaced by a decoded facade',
  );
  const rawFile = reportReference(documents, report.rawRetention.canonicalFileBytes.ref);
  assert.equal(rawFile, hello.payload.portable.fileBytes);
  assert.equal(sha256HexBytes(rawFile, 'canonical file bytes'), report.rawRetention.canonicalFileBytes.sha256RawBytes);

  const helloTypes = hello.payload.portable.typeEnvelopes;
  assert.deepEqual(Object.keys(report.rawRetention.typeEnvelopes).sort(), Object.keys(helloTypes).sort());
  for (const [name, retained] of Object.entries(report.rawRetention.typeEnvelopes)) {
    const rawTypeBytes = reportReference(documents, retained.ref);
    assert.equal(rawTypeBytes, helloTypes[name].rawTypeBytes, `${name} raw Type envelope reference mismatch`);
    assert.equal(retained.typeSchemaId, helloTypes[name].typeSchemaId, `${name} TypeSchemaId mismatch`);
    assert.equal(
      sha256HexBytes(rawTypeBytes, `${name} raw Type envelope`),
      retained.sha256RawBytes,
      `${name} raw Type envelope bytes changed`,
    );
  }
  assert.deepEqual(report.rawRetention.opaqueUnknownTypeControl, {
    ref: 'inputs/type-envelope-v0.json#/opaqueCodec1/rawTypeBytes',
    support: typeEnvelope.opaqueCodec1.expected.support,
    validation: typeEnvelope.opaqueCodec1.expected.validation,
    semanticReconstruction: typeEnvelope.opaqueCodec1.expected.semanticReconstruction,
    rawRetention: typeEnvelope.opaqueCodec1.expected.rawRetention,
  });
  assert.equal(reportReference(documents, report.rawRetention.opaqueUnknownTypeControl.ref), typeEnvelope.opaqueCodec1.rawTypeBytes);

  assert.equal(report.explorerProjection.projectionRoot, hello.payload.projection.root);
  assert.equal(report.explorerProjection.entryCount, hello.payload.projection.entryCount);
  assert.deepEqual(reportReference(documents, report.explorerProjection.listRowRef), helloGuest.listRow);
  assert.deepEqual(reportReference(documents, report.explorerProjection.inspectorRef), helloGuest.inspector);
  assert.equal(report.explorerProjection.viewAuthority, 'DERIVED_PRESENTATION_ONLY');

  assert.equal(resultVector.protocolConformance, false);
  assert.equal(resultVector.durable, false);
  assert.equal(typeEnvelope.protocolConformance, false);
  assert.equal(typeEnvelope.durable, false);
  assert.equal(typeEnvelope.deployable, false);
  assertNonadoption(sourceLock, 'sourceLock');
  assertNonadoption(report.nonadoption, 'report.nonadoption');
  assertNonadoption(consumer.nonadoption, 'consumer.nonadoption');
  assertNonadoption(handoff, 'handoff');

  return {
    evidenceCeiling: structuredClone(report.evidenceCeiling),
    nonadoption: structuredClone(report.nonadoption),
    qualificationCodes,
    rawResultV0Retained: rawResult === hello.payload.result.encoded,
    rawTypeEnvelopeCount: Object.keys(helloTypes).length,
  };
}

export function verifyPacket(packetRoot, { mode = 'draft' } = {}) {
  const inputRoot = path.join(packetRoot, 'inputs');
  const actualNames = fs.readdirSync(inputRoot, { withFileTypes: true })
    .map((entry) => {
      assert.equal(entry.isFile(), true, `unauthorized input entry ${entry.name}`);
      return entry.name;
    })
    .sort();
  const allowedNames = INPUTS.map(({ file }) => file).sort();
  assert.deepEqual(actualNames, allowedNames, 'input surface must contain exactly five authorized serialized JSON files');

  const documents = loadDocuments(packetRoot);
  const sourceLockBytes = fs.readFileSync(path.join(packetRoot, 'core-source-lock-v0.json'));
  assert.equal(
    sourceLockBytes.toString('utf8'),
    `${JSON.stringify(documents.sourceLock)}\n`,
    'role-neutral source lock must use exact JSON.stringify(receipt) plus LF serialization',
  );
  const fileHashes = Object.fromEntries(INPUTS.map(({ file }) => [
    file,
    sha256(fs.readFileSync(path.join(inputRoot, file))),
  ]));

  assert.equal(documents.sourceLock.handoffSha256, fileHashes['handoff-v0.json']);
  assert.equal(documents.sourceLock.consumerContractSha256, fileHashes['consumer-contract-v0.json']);
  assert.equal(documents.consumer.helloExpected.artifactSha256, fileHashes['hello-files-v0.json']);

  const handoffLocks = new Map(documents.handoff.pinnedVectors.map((entry) => [entry.path, entry.sha256]));
  for (const { file, sourcePath } of INPUTS) {
    if (file === 'handoff-v0.json') continue;
    assert.equal(handoffLocks.get(sourcePath), fileHashes[file], `${file} differs from the handoff lock`);
  }

  assert.equal(
    documents.report.sourceLock.sha256,
    sha256(sourceLockBytes),
    'Explorer report source-lock hash mismatch',
  );
  assert.deepEqual(documents.report.authorizedInputs, INPUTS.map(({ file, sourcePath }) => ({
    path: `inputs/${file}`,
    sourcePath,
    sha256: fileHashes[file],
  })));

  const summary = validateDocuments(documents, { mode });
  return {
    authorizedInputCount: actualNames.length,
    coreCommitStatus: documents.sourceLock.corePacketCommit,
    ...summary,
  };
}

function cliOptions(argv) {
  const modeIndex = argv.indexOf('--mode');
  const rootIndex = argv.indexOf('--root');
  return {
    mode: modeIndex === -1 ? 'draft' : argv[modeIndex + 1],
    root: rootIndex === -1 ? path.resolve(import.meta.dirname) : path.resolve(argv[rootIndex + 1]),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const options = cliOptions(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(verifyPacket(options.root, { mode: options.mode }), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  }
}
