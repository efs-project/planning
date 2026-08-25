import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  loadCommittedEvidence,
  validateAcceptance,
  verifyAcceptance,
} from './check-acceptance.mjs';

const reviewRoot = path.dirname(fileURLToPath(import.meta.url));

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function lane(manifest, role) {
  return manifest.lanes.find((entry) => entry.role === role);
}

function relockReport(evidence, role, mutate) {
  const report = JSON.parse(evidence.artifacts[role].reportBytes);
  mutate(report);
  const reportBytes = Buffer.from(`${JSON.stringify(report)}\n`);
  evidence.artifacts[role].reportBytes = reportBytes;
  lane(evidence.manifest, role).reportSha256 = sha256(reportBytes);
}

function relockBothReceipts(evidence, mutate) {
  let receiptBytes;
  for (const role of ['SDK', 'EXPLORER']) {
    const receipt = JSON.parse(evidence.artifacts[role].receiptBytes);
    mutate(receipt);
    receiptBytes = Buffer.from(`${JSON.stringify(receipt)}\n`);
    evidence.artifacts[role].receiptBytes = receiptBytes;
    lane(evidence.manifest, role).receiptSha256 = sha256(receiptBytes);
  }
  evidence.manifest.core.commonReceiptSha256 = sha256(receiptBytes);
}

test('accepts exact committed SDK and Explorer evidence without authorizing code', () => {
  assert.deepEqual(verifyAcceptance(reviewRoot), {
    coreCommit: 'b9088d6a24f4d40bcca6ba300523b25cc7c608d2',
    sdkCommit: '57d04f85ae2687ee8ea63d945378df5a9a6492a5',
    explorerCommit: '8d90ecbf85390f1151fa1b2dbf93852a1bfc8448',
    commonReceiptSha256: 'c750a63b248d5a9a24d591046aa439d4e1b2eb07b127d49d734700b3048a2858',
    technicalDisposition: 'RECOMMEND-GO-CODE',
    recommendedOwnerAnswer: 'YES',
    ownerDecision: 'PENDING',
    v2C1Answerable: true,
    goCodeAuthorized: false,
    unresolvedP0: 0,
    unresolvedP1: 0,
    vendoredInputCountPerLane: 5,
  });
});

test('loads and verifies exactly five committed serialized inputs per lane', () => {
  const evidence = loadCommittedEvidence(reviewRoot);
  assert.equal(Array.isArray(evidence.artifacts.SDK.vendoredInputs), true, 'SDK committed inputs must be loaded');
  assert.equal(Array.isArray(evidence.artifacts.EXPLORER.vendoredInputs), true, 'Explorer committed inputs must be loaded');
  assert.equal(evidence.artifacts.SDK.vendoredInputs.length, 5);
  assert.equal(evidence.artifacts.EXPLORER.vendoredInputs.length, 5);

  evidence.artifacts.SDK.vendoredInputs.pop();
  assert.throws(() => validateAcceptance(evidence), /SDK.*exactly five|SDK.*input/i);
});

test('rejects a vendored input that differs from exact Core committed bytes', () => {
  const evidence = loadCommittedEvidence(reviewRoot);
  assert.equal(Array.isArray(evidence.artifacts.EXPLORER.vendoredInputs), true, 'Explorer committed inputs must be loaded');
  evidence.artifacts.EXPLORER.vendoredInputs[0].bytes = Buffer.from('{}\n');
  assert.throws(() => validateAcceptance(evidence), /Explorer.*consumer-contract.*Core|vendored input/i);
});

test('rejects missing, duplicate, and reordered lane roles', () => {
  const missing = loadCommittedEvidence(reviewRoot);
  missing.manifest.lanes.pop();
  assert.throws(() => validateAcceptance(missing), /exactly two lanes|lane order/i);

  const duplicate = loadCommittedEvidence(reviewRoot);
  duplicate.manifest.lanes[1].role = 'SDK';
  assert.throws(() => validateAcceptance(duplicate), /lane order or roles/i);

  const reordered = loadCommittedEvidence(reviewRoot);
  reordered.manifest.lanes.reverse();
  assert.throws(() => validateAcceptance(reordered), /lane order or roles/i);
});

test('rejects one changed receipt byte even when both receipts still parse', () => {
  const evidence = loadCommittedEvidence(reviewRoot);
  const receipt = JSON.parse(evidence.artifacts.EXPLORER.receiptBytes);
  receipt.profile = 'EXP-C0/v1';
  evidence.artifacts.EXPLORER.receiptBytes = Buffer.from(`${JSON.stringify(receipt)}\n`);
  assert.throws(() => validateAcceptance(evidence), /receipt bytes differ|receipt SHA-256/i);
});

test('rejects a relocked role report that no longer passes', () => {
  const evidence = loadCommittedEvidence(reviewRoot);
  relockReport(evidence, 'SDK', (report) => {
    report.verdict = 'FAIL';
    report.nonadoption.protocolConformance = true;
  });
  assert.throws(() => validateAcceptance(evidence), /SDK report SHA-256|SDK verdict|protocolConformance/i);
});

test('rejects substituted lane and Core commits', () => {
  const laneEvidence = loadCommittedEvidence(reviewRoot);
  lane(laneEvidence.manifest, 'SDK').commit = '1111111111111111111111111111111111111111';
  assert.throws(() => validateAcceptance(laneEvidence), /SDK commit/i);

  const coreEvidence = loadCommittedEvidence(reviewRoot);
  relockBothReceipts(coreEvidence, (receipt) => {
    receipt.corePacketCommit = '2222222222222222222222222222222222222222';
  });
  assert.throws(() => validateAcceptance(coreEvidence), /receipt SHA-256|Core commit|Core locks/i);
});

for (const priority of ['unresolvedP0', 'unresolvedP1']) {
  test(`rejects a nonzero ${priority} count`, () => {
    const evidence = loadCommittedEvidence(reviewRoot);
    evidence.manifest.checks[priority] = 1;
    assert.throws(() => validateAcceptance(evidence), new RegExp(priority, 'i'));
  });
}

test('rejects any claim that recommendation itself authorizes code or permanence', () => {
  const evidence = loadCommittedEvidence(reviewRoot);
  evidence.manifest.goCodeAuthorized = true;
  evidence.manifest.authority.freezeAuthorized = true;
  assert.throws(() => validateAcceptance(evidence), /goCodeAuthorized|freezeAuthorized/i);
});

test('rejects conflated technical recommendation and pending owner decision', () => {
  const bareStatus = loadCommittedEvidence(reviewRoot);
  bareStatus.manifest.technicalDisposition = 'GO-CODE';
  assert.throws(() => validateAcceptance(bareStatus), /technicalDisposition/i);

  const wrongRecommendation = loadCommittedEvidence(reviewRoot);
  wrongRecommendation.manifest.recommendedOwnerAnswer = 'PENDING';
  assert.throws(() => validateAcceptance(wrongRecommendation), /recommendedOwnerAnswer/i);

  const inventedRuling = loadCommittedEvidence(reviewRoot);
  inventedRuling.manifest.ownerDecision = 'YES';
  assert.throws(() => validateAcceptance(inventedRuling), /ownerDecision/i);
});

test('rejects an Explorer role report that gains an ambient dependency', () => {
  const evidence = loadCommittedEvidence(reviewRoot);
  relockReport(evidence, 'EXPLORER', (report) => {
    report.directGuest.requiresWallet = true;
  });
  assert.throws(() => validateAcceptance(evidence), /Explorer report SHA-256|requiresWallet/i);
});
