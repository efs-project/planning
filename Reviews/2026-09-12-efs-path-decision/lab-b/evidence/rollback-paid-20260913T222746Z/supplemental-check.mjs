import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const run = path.dirname(new URL(import.meta.url).pathname);
const read = file => fs.readFileSync(path.join(run, file));
const json = file => JSON.parse(read(file));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const expected = json('expectations-node26.json');
const report = json('result/report.json');
const raw = read('result/raw.jsonl').toString().trimEnd().split('\n').map(JSON.parse);
const expectedRoles = {
  registry: 'TypeRegistry.sol/TypeRegistry.json',
  quoteAcceptor: 'LabAcceptors.sol/QuoteAcceptor.json',
  pairRule: 'LabAcceptors.sol/MinBodyAcceptor.json',
  ledger: 'Ledger.sol/Ledger.json',
  index: 'MatchedRollback.t.sol/LateRefusingIndexModule.json',
  prefixActor: 'LabHarness.sol/Actor.json',
};
const checkArtifacts = candidate => {
  assert.deepEqual(Object.keys(candidate).sort(), Object.keys(expectedRoles).sort());
  for (const [role, suffix] of Object.entries(expectedRoles)) {
    const paths = Object.keys(expected.source.artifactSha256).filter(p => p.endsWith('/' + suffix));
    assert.equal(paths.length, 1, 'one sealed artifact per exact role');
    assert.deepEqual(candidate[role], { path: paths[0], sha256: expected.source.artifactSha256[paths[0]] });
  }
};
const checkHeaders = rows => {
  const headers = rows.filter(r => ['eth_getBlockByHash', 'eth_getBlockByNumber'].includes(r.request.method));
  const numbers = new Set();
  for (const row of headers) {
    assert.equal(BigInt(row.response.result.gasLimit), 30_000_000n);
    numbers.add(Number(BigInt(row.response.result.number)));
  }
  assert.deepEqual([...numbers].sort((a,b) => a-b), Array.from({length:37}, (_, i) => i));
  return headers.length;
};
assert.equal(sha(read('expectations-node26.json')), '0b26e6d2a0037de6f89089eece41cbb1174a76eb87e8de945d9c599bf8b28622');
checkArtifacts(report.artifactInputs);
const headerReplies = checkHeaders(raw);
const missingRole = structuredClone(report.artifactInputs);
delete missingRole.index;
assert.throws(() => checkArtifacts(missingRole), /AssertionError/);
const wrongRole = structuredClone(report.artifactInputs);
wrongRole.index = wrongRole.ledger;
assert.throws(() => checkArtifacts(wrongRole), /AssertionError/);
const wrongLimit = structuredClone(raw);
wrongLimit.find(r => r.request.method === 'eth_getBlockByNumber').response.result.gasLimit = '0x3938700';
assert.throws(() => checkHeaders(wrongLimit), /AssertionError/);
const pins = json('pins.json');
assert.equal(Object.keys(pins.files).length, 41);
for (const [file, digest] of Object.entries(pins.files)) assert.equal(sha(fs.readFileSync(file)), digest, file);
const launch = json('launch-record.json');
assert.equal(launch.ownedProcessesStopped, true);
assert.deepEqual(launch.runner.outcome, { code: 0, signal: null });
process.stdout.write(JSON.stringify({
  status: 'PASS_RPC_OBSERVED_SUPPLEMENT',
  checks: { distinctHeaders: 37, headerReplies, blockGasLimit: 30000000, exactArtifactRoles: 6, unchangedSealedFiles: 41, negativeChecks: 3 },
  inputSha256: Object.fromEntries(['expectations-node26.json', 'result/raw.jsonl', 'result/report.json', 'pins.json', 'launch-record.json'].map(p => [p, sha(read(p))])),
  scope: 'Closes the two inventory/gas-limit qualifications in the prior auditor review; not authenticated state proof or a chain rerun.'
}, null, 2) + '\n');
