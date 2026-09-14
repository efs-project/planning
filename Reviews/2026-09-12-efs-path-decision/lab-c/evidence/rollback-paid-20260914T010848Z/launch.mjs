// Root-only, finite loopback control run. No compiler or persistent chain.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, openSync, closeSync, statfsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createServer } from 'node:net';

const run = '/tmp/efs-c-controls-paid-20260914.MCwNJk';
const repo = '/Users/james/Code/EFS/planning-warroom-c-run';
const lab = `${repo}/Reviews/2026-09-12-efs-path-decision/lab-c`;
const pins = JSON.parse(readFileSync(`${run}/pins.json`));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const start = Date.parse(process.env.EFS_CONTROL_LEASE_START ?? '');
const latest = Date.parse(process.env.EFS_CONTROL_LATEST_START ?? '');
const end = Date.parse(process.env.EFS_CONTROL_LEASE_END ?? '');
assert(Number.isFinite(start) && Number.isFinite(latest) && Number.isFinite(end) && start <= Date.now() && Date.now() <= latest && latest < end && end - start <= 20 * 60_000, 'current finite root lease required');
assert.equal(process.version, 'v26.0.0');
const git = args => execFileSync('git', args, { cwd: repo, encoding: 'utf8' }).trim();
assert.equal(git(['rev-parse', 'HEAD']), pins.source);
assert.equal(git(['status', '--porcelain', '--untracked-files=no']), '');
assert(!execFileSync('ps', ['-axo', 'pid,comm'], { encoding: 'utf8' }).split('\n').some(line => /\/(anvil|forge|solc)(\s|$|-)/.test(line)), 'competing heavy process');
for (const [path, expected] of Object.entries(pins.files)) assert.equal(hash(readFileSync(path)), expected, `source/input pin ${path}`);
const bytes = path => readdirSync(path, { withFileTypes: true }).reduce((sum, e) => sum + (e.isDirectory() ? bytes(`${path}/${e.name}`) : e.isFile() ? statSync(`${path}/${e.name}`).size : 0), 0);
const disk = () => {
  const fs = statfsSync(run);
  const freeBytes = fs.bavail * fs.bsize;
  const scratchBytes = pins.scratchRoots.reduce((sum, path) => sum + bytes(path), 0);
  assert(freeBytes >= 50 * 1024 ** 3, 'free disk reserve');
  assert(scratchBytes < 15 * 1024 ** 3, 'total owned scratch budget');
  return { freeBytes, scratchBytes };
};
const record = { startedAt: new Date().toISOString(), source: pins.source, preparation: pins.preparation, lease: { start, latest, end }, pins, resources: disk(), anvilVersion: execFileSync('/Users/james/.foundry/bin/anvil', ['--version'], { encoding: 'utf8' }).trim() };
const save = () => writeFileSync(`${run}/launch-record.json`, `${JSON.stringify(record, null, 2)}\n`);
const children = new Set();
const spawnOwned = (exe, args, log, env = process.env) => {
  const fd = openSync(`${run}/${log}`, 'wx');
  const child = spawn(exe, args, { cwd: lab, env, detached: true, stdio: ['ignore', fd, fd] });
  closeSync(fd); children.add(child);
  child.once('error', error => { record.spawnError = error.message; stop('spawn error'); });
  return child;
};
let stopping = false;
const validPid = pid => Number.isSafeInteger(pid) && pid > 0;
const kill = signal => {
  for (const child of children) {
    if (!validPid(child.pid)) continue;
    try { process.kill(-child.pid, signal); }
    catch (error) { if (error.code !== 'ESRCH') (record.killErrors ??= []).push({ pid: child.pid, signal, error: error.message }); }
  }
};
const groupsStopped = () => [...children].every(child => {
  if (!validPid(child.pid)) return true;
  try { process.kill(-child.pid, 0); return false; }
  catch (error) { return error.code === 'ESRCH'; }
});
const stop = reason => {
  if (stopping) return;
  stopping = true; record.stopReason = reason;
  // Exhausted disk must never prevent stopping the process consuming it.
  try { save(); } catch (error) { record.recordingFailure = error.message; }
  finally { kill('SIGTERM'); setTimeout(() => kill('SIGKILL'), 3000).unref(); }
};
const watchdog = setTimeout(() => stop('deadline/watchdog'), Math.max(0, Math.min(12 * 60_000, end - Date.now() - 5000)));
const budget = setInterval(() => { try { disk(); } catch (e) { stop(e.message); } }, 3000);
process.once('SIGTERM', () => stop('SIGTERM'));
process.once('SIGINT', () => stop('SIGINT'));
const server = createServer();
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const port = server.address().port;
await new Promise(resolve => server.close(resolve));
record.rpc = `http://127.0.0.1:${port}`;
const anvilArgs = ['--host', '127.0.0.1', '--port', String(port), '--chain-id', '31337', '--hardfork', 'cancun', '--gas-limit', '30000000', '--timestamp', '1800000000', '--prune-history', '256', '--cache-path', `${run}/anvil-cache`, '--silent'];
let node;
try {
  const env = { ...process.env, NODE_PATH: '/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules' };
  for (const key of ['PRIVATE_KEY', 'PK_A', 'RUN_MNEMONIC']) delete env[key];
  node = spawnOwned('/Users/james/.foundry/bin/anvil', anvilArgs, 'anvil.log', env);
  record.anvil = { pid: node.pid, args: anvilArgs }; save();
  let ready = false;
  for (let i = 0; i < 100 && !stopping && node.exitCode === null; i++) {
    try {
      const response = await fetch(record.rpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }), signal: AbortSignal.timeout(1000) });
      const body = await response.json();
      if (body.result === '0x0') { ready = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(ready && !stopping, 'fresh Anvil readiness');
  const args = [`${lab}/script/rollback-control.mjs`, '--rpc', record.rpc, '--artifacts', pins.artifacts, '--expectations', pins.expectations, '--run-dir', `${run}/result`];
  const runner = spawnOwned(process.execPath, args, 'runner.log', env);
  record.runner = { pid: runner.pid, args }; save();
  const outcome = await new Promise((resolve, reject) => { runner.once('error', reject); runner.once('close', (code, signal) => resolve({ code, signal })); });
  record.runner.outcome = outcome;
  assert.equal(outcome.code, 0, 'candidate control runner failed');
  assert(!stopping, 'run stopped');
  record.runnerSucceeded = true;
} catch (error) {
  record.failure = error.stack;
} finally {
  clearTimeout(watchdog); clearInterval(budget);
  kill('SIGTERM');
  await new Promise(resolve => setTimeout(resolve, 500));
  kill('SIGKILL');
  for (let i = 0; i < 30 && !groupsStopped(); i++) await new Promise(resolve => setTimeout(resolve, 100));
  record.finishedAt = new Date().toISOString();
  try { record.resourcesAfter = disk(); } catch (error) { record.failure ??= error.message; record.diskError = error.message; }
  record.ownedProcessesStopped = groupsStopped();
  save();
}
assert(record.ownedProcessesStopped, 'owned process still alive');
assert(!record.failure, record.failure);
console.log(JSON.stringify({ runnerSucceeded: record.runnerSucceeded, source: record.source, rpc: record.rpc, startedAt: record.startedAt, finishedAt: record.finishedAt, ownedProcessesStopped: record.ownedProcessesStopped }));
