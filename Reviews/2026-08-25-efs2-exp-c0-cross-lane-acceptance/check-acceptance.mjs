import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED = Object.freeze({
  core: Object.freeze({
    commit: 'b9088d6a24f4d40bcca6ba300523b25cc7c608d2',
    handoffSha256: '2e8d191e4dd7c2130378e09f3cbc5b71441906cbaa6c448c30139aafe9ec203d',
    consumerContractSha256: '7be0ca1c742fcc61d16316456e2e8937de50c6e6864a5533d24e614d2caee512',
    helloPayloadSha256: 'ac1651b08e1cd120adb3fd47062d2bb4858c5a4fa59743e11ac3d6c46c731969',
    commonReceiptSha256: 'c750a63b248d5a9a24d591046aa439d4e1b2eb07b127d49d734700b3048a2858',
  }),
  lanes: Object.freeze({
    SDK: Object.freeze({
      commit: '57d04f85ae2687ee8ea63d945378df5a9a6492a5',
      receiptPath: 'Reviews/2026-08-25-sdkv2-exp-c0-mvp/core-source-lock-v0.json',
      reportPath: 'Reviews/2026-08-25-sdkv2-exp-c0-mvp/sdk-consumption-v0.json',
      reportSha256: 'ef8ba1b09f42f8287b2e4ab9a87ef30a6e3d2e5af98cccb7f2bf06c2c1799f7b',
    }),
    EXPLORER: Object.freeze({
      commit: '8d90ecbf85390f1151fa1b2dbf93852a1bfc8448',
      receiptPath: 'Reviews/2026-08-25-data-explorer-exp-c0-consumption/core-source-lock-v0.json',
      reportPath: 'Reviews/2026-08-25-data-explorer-exp-c0-consumption/explorer-consumption-v0.json',
      reportSha256: '094c87a0650390065976dd51f097946eefb6be0c128d54861f2ee70fc914d1b3',
    }),
  }),
});

const FALSE_CEILINGS = Object.freeze([
  'protocolConformance',
  'durable',
  'productionReady',
  'deploymentAuthorized',
  'freezeAuthorized',
]);

const INPUTS = Object.freeze([
  Object.freeze({
    name: 'consumer-contract-v0.json',
    corePath: 'Reviews/2026-08-25-efs2-exp-c0-v0-control/consumer-contract-v0.json',
    SDK: 'Reviews/2026-08-25-sdkv2-exp-c0-mvp/core-inputs/consumer-contract-v0.json',
    EXPLORER: 'Reviews/2026-08-25-data-explorer-exp-c0-consumption/inputs/consumer-contract-v0.json',
  }),
  Object.freeze({
    name: 'handoff-v0.json',
    corePath: 'Reviews/2026-08-25-efs2-exp-c0-v0-control/handoff-v0.json',
    SDK: 'Reviews/2026-08-25-sdkv2-exp-c0-mvp/core-inputs/handoff-v0.json',
    EXPLORER: 'Reviews/2026-08-25-data-explorer-exp-c0-consumption/inputs/handoff-v0.json',
  }),
  Object.freeze({
    name: 'hello-files-v0.json',
    corePath: 'Reviews/2026-08-25-efs2-exp-c0-v0-control/hello-files-v0.json',
    SDK: 'Reviews/2026-08-25-sdkv2-exp-c0-mvp/core-inputs/hello-files-v0.json',
    EXPLORER: 'Reviews/2026-08-25-data-explorer-exp-c0-consumption/inputs/hello-files-v0.json',
  }),
  Object.freeze({
    name: 'result-v0.json',
    corePath: 'Reviews/2026-08-25-efs2-exp-c0-v0-control/vectors/result-v0.json',
    SDK: 'Reviews/2026-08-25-sdkv2-exp-c0-mvp/core-inputs/vectors/result-v0.json',
    EXPLORER: 'Reviews/2026-08-25-data-explorer-exp-c0-consumption/inputs/result-v0.json',
  }),
  Object.freeze({
    name: 'type-envelope-v0.json',
    corePath: 'Reviews/2026-08-25-efs2-exp-c0-v0-control/vectors/type-envelope-v0.json',
    SDK: 'Reviews/2026-08-25-sdkv2-exp-c0-mvp/core-inputs/vectors/type-envelope-v0.json',
    EXPLORER: 'Reviews/2026-08-25-data-explorer-exp-c0-consumption/inputs/type-envelope-v0.json',
  }),
]);

const RECEIPT_KEYS = Object.freeze([
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

const FORBIDDEN_MANIFEST_KEYS = new Set([
  'timestamp',
  'generatedAt',
  'environment',
  'nodeVersion',
  'platform',
  'architecture',
  'cwd',
  'absolutePath',
]);

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function exactKeys(value, keys, label) {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value), keys, `${label} fields or field order differ`);
}

function assertFalseCeilings(value, label) {
  for (const key of FALSE_CEILINGS) assert.equal(value[key], false, `${label}.${key} must remain false`);
}

function assertNoForbiddenManifestFields(value, label = 'acceptance') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenManifestFields(entry, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.equal(FORBIDDEN_MANIFEST_KEYS.has(key), false, `${label}.${key} is forbidden`);
    assertNoForbiddenManifestFields(child, `${label}.${key}`);
  }
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new assert.AssertionError({ message: `${label} is not JSON: ${error.message}` });
  }
}

function gitShow(planningRoot, commit, artifactPath) {
  try {
    return execFileSync('git', ['show', `${commit}:${artifactPath}`], {
      cwd: planningRoot,
      encoding: 'buffer',
      maxBuffer: 16 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const detail = error.stderr?.toString('utf8').trim() || error.message;
    throw new assert.AssertionError({ message: `cannot read committed artifact ${commit}:${artifactPath}: ${detail}` });
  }
}

function laneEntry(manifest, role) {
  const entry = manifest.lanes.find((candidate) => candidate.role === role);
  assert(entry, `${role} lane is missing`);
  return entry;
}

function validateManifest(manifest) {
  exactKeys(
    manifest,
    [
      'format',
      'profile',
      'technicalDisposition',
      'recommendedOwnerAnswer',
      'ownerDecision',
      'goCodeAuthorized',
      'core',
      'lanes',
      'checks',
      'authority',
    ],
    'acceptance',
  );
  assertNoForbiddenManifestFields(manifest);
  assert.equal(manifest.format, 'efs2-exp-c0-v0-cross-lane-acceptance/0');
  assert.equal(manifest.profile, 'EXP-C0/v0');
  assert.equal(manifest.technicalDisposition, 'RECOMMEND-GO-CODE', 'technicalDisposition differs');
  assert.equal(manifest.recommendedOwnerAnswer, 'YES', 'recommendedOwnerAnswer differs');
  assert.equal(manifest.ownerDecision, 'PENDING', 'ownerDecision differs');
  assert.equal(manifest.goCodeAuthorized, false, 'goCodeAuthorized must remain false');

  exactKeys(
    manifest.core,
    ['commit', 'handoffSha256', 'consumerContractSha256', 'helloPayloadSha256', 'commonReceiptSha256'],
    'acceptance.core',
  );
  assert.deepEqual(manifest.core, EXPECTED.core, 'Core locks differ from the accepted source lock');

  assert.equal(manifest.lanes.length, 2, 'acceptance must contain exactly two lanes');
  assert.deepEqual(manifest.lanes.map(({ role }) => role), ['SDK', 'EXPLORER'], 'lane order or roles differ');
  for (const role of ['SDK', 'EXPLORER']) {
    const entry = laneEntry(manifest, role);
    const expected = EXPECTED.lanes[role];
    exactKeys(
      entry,
      ['role', 'commit', 'receiptPath', 'receiptSha256', 'reportPath', 'reportSha256', 'roleCheck'],
      `${role} lane`,
    );
    assert.equal(entry.commit, expected.commit, `${role} commit differs`);
    assert.equal(entry.receiptPath, expected.receiptPath, `${role} receipt path differs`);
    assert.equal(entry.receiptSha256, EXPECTED.core.commonReceiptSha256, `${role} receipt SHA-256 differs`);
    assert.equal(entry.reportPath, expected.reportPath, `${role} report path differs`);
    assert.equal(entry.reportSha256, expected.reportSha256, `${role} report SHA-256 differs`);
    assert.equal(entry.roleCheck, 'PASS', `${role} role check must pass`);
    assert.equal(path.isAbsolute(entry.receiptPath), false, `${role} receipt path must be repository-relative`);
    assert.equal(path.isAbsolute(entry.reportPath), false, `${role} report path must be repository-relative`);
  }

  exactKeys(
    manifest.checks,
    ['receiptBytesIdentical', 'coreLocksMatched', 'sdkRoleCheck', 'explorerRoleCheck', 'unresolvedP0', 'unresolvedP1'],
    'acceptance.checks',
  );
  assert.equal(manifest.checks.receiptBytesIdentical, true);
  assert.equal(manifest.checks.coreLocksMatched, true);
  assert.equal(manifest.checks.sdkRoleCheck, 'PASS');
  assert.equal(manifest.checks.explorerRoleCheck, 'PASS');
  assert.equal(manifest.checks.unresolvedP0, 0, 'unresolvedP0 must be zero');
  assert.equal(manifest.checks.unresolvedP1, 0, 'unresolvedP1 must be zero');

  exactKeys(
    manifest.authority,
    [
      'v2C1Answerable',
      'ownerRulingRecorded',
      'protocolConformance',
      'durable',
      'productionReady',
      'deploymentAuthorized',
      'freezeAuthorized',
      'exactExecutableTraceReplayCount',
    ],
    'acceptance.authority',
  );
  assert.equal(manifest.authority.v2C1Answerable, true);
  assert.equal(manifest.authority.ownerRulingRecorded, false);
  assertFalseCeilings(manifest.authority, 'acceptance.authority');
  assert.equal(manifest.authority.exactExecutableTraceReplayCount, 0);
}

function validateReceipt(receiptBytes, role) {
  assert.equal(sha256(receiptBytes), EXPECTED.core.commonReceiptSha256, `${role} receipt SHA-256 differs`);
  const receipt = parseJson(receiptBytes, `${role} receipt`);
  assert.equal(receiptBytes.toString('utf8'), `${JSON.stringify(receipt)}\n`, `${role} receipt serialization differs`);
  exactKeys(receipt, RECEIPT_KEYS, `${role} receipt`);
  assert.equal(receipt.format, 'efs2-exp-c0-v0-same-source-lock-receipt/0');
  assert.equal(receipt.profile, 'EXP-C0/v0');
  assert.equal(receipt.corePacketCommit, EXPECTED.core.commit, `${role} receipt Core commit differs`);
  assert.equal(receipt.handoffSha256, EXPECTED.core.handoffSha256);
  assert.equal(receipt.consumerContractSha256, EXPECTED.core.consumerContractSha256);
  assert.equal(receipt.helloPayloadSha256, EXPECTED.core.helloPayloadSha256);
  assertFalseCeilings(receipt, `${role} receipt`);
  return receipt;
}

function validateVendoredInputs(role, vendoredInputs) {
  assert.equal(vendoredInputs.length, INPUTS.length, `${role} must expose exactly five committed inputs`);
  assert.deepEqual(vendoredInputs.map(({ name }) => name), INPUTS.map(({ name }) => name), `${role} input names or order differ`);
  for (let index = 0; index < INPUTS.length; index += 1) {
    const expected = INPUTS[index];
    const actual = vendoredInputs[index];
    assert.equal(actual.corePath, expected.corePath, `${role} ${expected.name} Core path differs`);
    assert.equal(actual.lanePath, expected[role], `${role} ${expected.name} vendored path differs`);
    assert.equal(
      Buffer.compare(actual.bytes, actual.coreBytes),
      0,
      `${role} vendored input ${expected.name} differs from exact Core committed bytes`,
    );
  }
}

function validateSdkReport(reportBytes, vendoredInputs) {
  assert.equal(sha256(reportBytes), EXPECTED.lanes.SDK.reportSha256, 'SDK report SHA-256 differs');
  const report = parseJson(reportBytes, 'SDK report');
  assert.equal(report.format, 'efs2-sdkv2-exp-c0-consumption/0');
  assert.equal(report.status, 'EXACT_SOURCE_LOCKED_DISPOSABLE_EVIDENCE');
  assert.equal(report.profile, 'EXP-C0/v0');
  assert.equal(report.verdict, 'PASS_DISPOSABLE_CONSUMPTION_ONLY', 'SDK verdict must pass disposable consumption');
  assert.equal(report.coreSourceOrScriptImports, false);
  assert.equal(report.coreTestsImported, false);
  assert.deepEqual(report.allowedCoreSerializedInputs, INPUTS.map(({ corePath }) => corePath));
  assert.equal(report.vendoredInputDirectory, 'Reviews/2026-08-25-sdkv2-exp-c0-mvp/core-inputs');
  assert.equal(report.sourceReceipt.path, EXPECTED.lanes.SDK.receiptPath);
  assert.equal(report.sourceReceipt.sha256, EXPECTED.core.commonReceiptSha256);
  assert.equal(report.sourceReceipt.corePacketCommit, EXPECTED.core.commit);
  assert.equal(report.sourceReceipt.publicationBlocked, false);
  for (const [check, passed] of Object.entries(report.checks)) assert.equal(passed, true, `SDK check ${check} must pass`);
  assert.equal(report.validatedCounts.coreSerializedFiles, vendoredInputs.length);
  assert.equal(report.validatedCounts.adversarialMutations, 13);
  assert.equal(report.receiptSeparation.conflated, false);
  assert.equal(report.receiptSeparation.transportAcknowledgementProvesCanonicalEffect, false);
  assertFalseCeilings(report.nonadoption, 'SDK report.nonadoption');
  assert.equal(report.nonadoption.sdkPackagePublished, false);
}

function validateExplorerReport(reportBytes, vendoredInputs) {
  assert.equal(sha256(reportBytes), EXPECTED.lanes.EXPLORER.reportSha256, 'Explorer report SHA-256 differs');
  const report = parseJson(reportBytes, 'Explorer report');
  assert.equal(report.format, 'efs2-data-explorer-exp-c0-serialized-consumption/0');
  assert.equal(report.status, 'COMMIT_READY_SERIALIZED_CONSUMPTION_PASS');
  assert.equal(report.profile, 'EXP-C0/v0');
  assert.equal(report.sourceLock.path, 'core-source-lock-v0.json');
  assert.equal(report.sourceLock.sha256, EXPECTED.core.commonReceiptSha256);
  assert.deepEqual(report.authorizedInputs, vendoredInputs.map((input) => ({
    path: input.lanePath.slice('Reviews/2026-08-25-data-explorer-exp-c0-consumption/'.length),
    sourcePath: input.corePath,
    sha256: sha256(input.bytes),
  })));
  assert.equal(report.inputBoundary.serializedJsonOnly, true);
  assert.equal(report.inputBoundary.coreSourceImports, false);
  assert.equal(report.inputBoundary.coreScriptImports, false);
  assert.equal(report.inputBoundary.coreTestImports, false);
  assert.equal(report.directGuest.enabled, true);
  for (const key of ['requiresWallet', 'requiresAccount', 'requiresCommons', 'requiresHostedIndexer', 'requiresOsBoot']) {
    assert.equal(report.directGuest[key], false, `Explorer ${key} must remain false`);
  }
  assert.equal(report.evidenceCeiling.staticSerializedConsumption, 'PASS');
  assert.equal(report.evidenceCeiling.e1a, 'NOT_PROVEN_BY_THIS_CONTRACT');
  assert.equal(report.evidenceCeiling.e1b, 'NOT_RUN');
  assert.equal(report.evidenceCeiling.runtimeDependencyTrace, 'NOT_RUN');
  assert.equal(report.evidenceCeiling.serializedDependencyClaimsOnly, true);
  assertFalseCeilings(report.nonadoption, 'Explorer report.nonadoption');
}

export function loadCommittedEvidence(reviewRoot = path.dirname(fileURLToPath(import.meta.url))) {
  const planningRoot = path.resolve(reviewRoot, '../..');
  const manifestBytes = fs.readFileSync(path.join(reviewRoot, 'acceptance-v0.json'));
  const manifest = parseJson(manifestBytes, 'acceptance manifest');
  assert.equal(
    manifestBytes.toString('utf8'),
    `${JSON.stringify(manifest)}\n`,
    'acceptance manifest must use JSON.stringify plus LF serialization',
  );
  const artifacts = {};
  for (const entry of manifest.lanes) {
    artifacts[entry.role] = {
      loadedCommit: entry.commit,
      loadedReceiptPath: entry.receiptPath,
      loadedReportPath: entry.reportPath,
      receiptBytes: gitShow(planningRoot, entry.commit, entry.receiptPath),
      reportBytes: gitShow(planningRoot, entry.commit, entry.reportPath),
      vendoredInputs: INPUTS.map((input) => ({
        name: input.name,
        corePath: input.corePath,
        lanePath: input[entry.role],
        coreBytes: gitShow(planningRoot, EXPECTED.core.commit, input.corePath),
        bytes: gitShow(planningRoot, entry.commit, input[entry.role]),
      })),
    };
  }
  return { manifest, artifacts };
}

export function validateAcceptance(evidence) {
  validateManifest(evidence.manifest);
  for (const role of ['SDK', 'EXPLORER']) {
    const entry = laneEntry(evidence.manifest, role);
    const artifact = evidence.artifacts[role];
    assert(artifact, `${role} committed artifacts are missing`);
    assert.equal(artifact.loadedCommit, entry.commit, `${role} loaded commit differs from manifest`);
    assert.equal(artifact.loadedReceiptPath, entry.receiptPath, `${role} loaded receipt path differs from manifest`);
    assert.equal(artifact.loadedReportPath, entry.reportPath, `${role} loaded report path differs from manifest`);
    assert.equal(sha256(artifact.receiptBytes), entry.receiptSha256, `${role} receipt SHA-256 differs from manifest`);
    assert.equal(sha256(artifact.reportBytes), entry.reportSha256, `${role} report SHA-256 differs from manifest`);
    validateVendoredInputs(role, artifact.vendoredInputs);
  }
  assert.equal(
    Buffer.compare(evidence.artifacts.SDK.receiptBytes, evidence.artifacts.EXPLORER.receiptBytes),
    0,
    'SDK and Explorer receipt bytes differ',
  );
  validateReceipt(evidence.artifacts.SDK.receiptBytes, 'SDK');
  validateReceipt(evidence.artifacts.EXPLORER.receiptBytes, 'Explorer');
  validateSdkReport(evidence.artifacts.SDK.reportBytes, evidence.artifacts.SDK.vendoredInputs);
  validateExplorerReport(evidence.artifacts.EXPLORER.reportBytes, evidence.artifacts.EXPLORER.vendoredInputs);

  return {
    coreCommit: EXPECTED.core.commit,
    sdkCommit: EXPECTED.lanes.SDK.commit,
    explorerCommit: EXPECTED.lanes.EXPLORER.commit,
    commonReceiptSha256: EXPECTED.core.commonReceiptSha256,
    technicalDisposition: evidence.manifest.technicalDisposition,
    recommendedOwnerAnswer: evidence.manifest.recommendedOwnerAnswer,
    ownerDecision: evidence.manifest.ownerDecision,
    v2C1Answerable: evidence.manifest.authority.v2C1Answerable,
    goCodeAuthorized: evidence.manifest.goCodeAuthorized,
    unresolvedP0: evidence.manifest.checks.unresolvedP0,
    unresolvedP1: evidence.manifest.checks.unresolvedP1,
    vendoredInputCountPerLane: INPUTS.length,
  };
}

export function verifyAcceptance(reviewRoot = path.dirname(fileURLToPath(import.meta.url))) {
  return validateAcceptance(loadCommittedEvidence(reviewRoot));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(`${JSON.stringify(verifyAcceptance(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  }
}
