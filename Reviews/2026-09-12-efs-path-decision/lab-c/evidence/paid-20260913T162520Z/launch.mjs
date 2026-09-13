// Run-owned disposable C launch; it does not grant its own heavy-run lease.
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, openSync, closeSync, copyFileSync, constants, statfsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertMaySpawn, verifyBuild } from './launch-guards.mjs';

const scratch = path.dirname(fileURLToPath(import.meta.url));
const repo = '/Users/james/Code/EFS/planning-warroom-c-run';
const lab = path.join(repo, 'Reviews/2026-09-12-efs-path-decision/lab-c');
const sourceInput = '/tmp/efs-c-independent-prep-20260913.DM1226/c-native-inputs.json';
const inputHash = '16739ae05cb8a77c16b4c0edc9b5acd3a4b9b5074510a1d6d69c42aeed3f335c';
const artifacts = '/tmp/efs-c-readiness-build-20260913.NoPDle/out';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
const source = process.env.C_RUN_SOURCE;
const start = Date.parse(process.env.C_LEASE_START ?? '');
const latest = Date.parse(process.env.C_LATEST_START ?? '');
const end = Date.parse(process.env.C_LEASE_END ?? '');
if (!/^[0-9a-f]{40}$/.test(source ?? '') || !Number.isFinite(start) || !Number.isFinite(latest) || !Number.isFinite(end)) throw new Error('explicit pinned source and finite lease required');
if (!(start <= Date.now() && Date.now() <= latest && latest < end && end - start <= 30 * 60_000)) throw new Error('lease not current or not bounded');
if (git('rev-parse', 'HEAD') !== source || git('status', '--porcelain', '--untracked-files=no')) throw new Error('runner source changed or tracked tree dirty');
if (hash(readFileSync(sourceInput)) !== inputHash) throw new Error('independent inputs changed');
const disk = statfsSync(scratch);
if (disk.bavail * disk.bsize < 50 * 1024 ** 3) throw new Error('free disk reserve');
const controller = path.join(lab, 'script/paid-controller.mjs');
const controllerHash = hash(readFileSync(controller));
const compiledSource = '2ca7349e5d683c3ff10651c0fc106c10da946145';
const buildFile = path.join(lab, 'evidence/readiness-20260913T145917Z/run3.json');
const artifactCount = verifyBuild(buildFile, artifacts, compiledSource);
const buildManifestHash = hash(readFileSync(buildFile));
const runId = `c-paid-${new Date().toISOString().replace(/[-:.]/g, '')}`;
const localInput = path.join(scratch, 'inputs.json');
copyFileSync(sourceInput, localInput, constants.COPYFILE_EXCL);
const guard = createServer();
await new Promise((resolve, reject) => { guard.once('error', reject); guard.listen(0, '127.0.0.1', resolve); });
const port = guard.address().port;
await new Promise((resolve) => guard.close(resolve));
const rpcUrl = `http://127.0.0.1:${port}`;
const anvilArgs = ['--silent', '--host', '127.0.0.1', '--port', String(port), '--accounts', '4', '--chain-id', '31337', '--hardfork', 'cancun', '--gas-limit', '30000000', '--prune-history', '256', '--cache-path', path.join(scratch, 'anvil-cache')];
const env = { ...process.env, RPC_URL: rpcUrl, OUT_DIR: artifacts, EVIDENCE_PATH: path.join(scratch, 'measure.json'), C_CONTROLLER_PATH: controller, C_CONTROLLER_SHA256: controllerHash, C_INPUT_PATH: localInput, C_INPUT_SHA256: inputHash, C_RUN_ID: runId, C_RUN_SOURCE: source, C_GATE_DIR: path.join(scratch, 'controller') };
// Only the runner's documented public Anvil defaults, never inherited user keys.
for (const key of ['PRIVATE_KEY', 'PK_A', 'RUN_MNEMONIC']) delete env[key];
env.PAID_CALLER_INDEX = '3';
const record = { runId, source, compiledSource, buildManifestHash, artifactCount, inputHash, controllerHash, rpcUrl, artifacts, lease: { start, latest, end }, anvilArgs, nodeVersion: process.version, anvilVersion: execFileSync('anvil', ['--version'], { encoding: 'utf8' }).trim(), startedAt: new Date().toISOString(), stages: [] };
const persist = () => writeFileSync(path.join(scratch, 'launch-record.json'), JSON.stringify(record, null, 2) + '\n');
const jobs = [];
let stopped = false;
const launch = (name, executable, args, jobEnv = env) => {
  assertMaySpawn({ stopped, start, latest, end });
  const fd = openSync(path.join(scratch, `${name}.log`), 'wx');
  const child = spawn(executable, args, { cwd: lab, env: jobEnv, detached: true, stdio: ['ignore', fd, fd] });
  closeSync(fd);
  const stage = { name, args, pid: child.pid, startedAt: new Date().toISOString() };
  record.stages.push(stage);
  const done = new Promise((resolve) => {
    child.once('error', (error) => { stage.error = String(error); persist(); resolve(stage); });
    child.once('close', (code, signal) => { Object.assign(stage, { code, signal, finishedAt: new Date().toISOString() }); persist(); resolve(stage); });
  });
  const job = { child, stage, done };
  jobs.push(job); persist(); return job;
};
const kill = (job, signal) => { if (job.child.exitCode === null && job.child.signalCode === null && job.child.pid) { try { process.kill(-job.child.pid, signal); } catch (e) { if (e.code !== 'ESRCH') throw e; } } };
const stop = (reason) => { if (stopped) return; stopped = true; record.stopReason = reason; for (const job of jobs) kill(job, 'SIGTERM'); persist(); setTimeout(() => { for (const job of jobs) kill(job, 'SIGKILL'); }, 5_000).unref(); };
process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
const timer = setTimeout(() => stop('lease/watchdog'), Math.max(0, Math.min(end - Date.now() - 5_000, 25 * 60_000)));
const sizes = (directory) => readdirSync(directory, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? sizes(path.join(directory, e.name)) : e.isFile() ? statSync(path.join(directory, e.name)).size : 0), 0);
const budget = setInterval(() => {
  try {
    const d = statfsSync(scratch);
    if (d.bavail * d.bsize < 50 * 1024 ** 3 || sizes(scratch) > 14 * 1024 ** 3) stop('disk budget');
  } catch (error) { stop(`disk check failed: ${error}`); }
}, 10_000);
const request = async () => {
  const response = await fetch(rpcUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_chainId', params: [] }), signal: AbortSignal.timeout(2_000) });
  const body = await response.json();
  if (!response.ok || body.jsonrpc !== '2.0' || body.id !== 1 || body.error || body.result !== '0x7a69') throw new Error('chain readiness mismatch');
};
let succeeded = false;
try {
  const anvil = launch('anvil', 'anvil', anvilArgs);
  let ready = false;
  for (let i = 0; i < 40 && !stopped && !anvil.stage.finishedAt; i++) {
    try { await request(); ready = true; break; } catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  if (!ready) throw new Error('owned Anvil not ready');
  if (git('rev-parse', 'HEAD') !== source || git('status', '--porcelain', '--untracked-files=no')) throw new Error('source changed after launch');
  const runner = launch('runner', process.execPath, [path.join(lab, 'script/measure.mjs'), '--anvil', '--cells', 'typed-joined']);
  await runner.done;
  if (runner.stage.code !== 0 || stopped) throw new Error(`runner failed: ${runner.stage.code}/${runner.stage.signal}`);
  succeeded = true;
} catch (error) { record.error = String(error?.stack ?? error); }
finally {
  stop(succeeded ? 'completed' : 'failed');
  await Promise.all(jobs.map((job) => job.done));
  clearTimeout(timer); clearInterval(budget);
  record.finishedAt = new Date().toISOString(); record.success = succeeded; persist();
}
console.log(JSON.stringify({ success: succeeded, runId, source, scratch, stopReason: record.stopReason, error: record.error }, null, 2));
process.exitCode = succeeded ? 0 : 1;
