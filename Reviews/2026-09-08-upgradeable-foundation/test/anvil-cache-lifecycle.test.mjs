import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import { access, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import * as managed from '../scripts/local-upgrade.mjs';

const exists = path => access(path).then(() => true, () => false);
const childSource = `
  const fs = require('node:fs');
  const path = require('node:path');
  const args = JSON.parse(process.argv[1]);
  const cache = args[args.indexOf('--cache-path') + 1];
  fs.writeFileSync(path.join(cache, 'started.json'), JSON.stringify(args));
  setInterval(() => {}, 1000);
`;
async function ready(cachePath) {
  for (let i = 0; i < 100; i++) {
    if (await exists(join(cachePath, 'started.json'))) return;
    await delay(10);
  }
  assert.fail('lightweight subprocess did not start');
}
async function fixture(t, options = {}) {
  const cacheParent = await mkdtemp(join(tmpdir(), 'efs-cache-lifecycle-test-'));
  const signals = new EventEmitter();
  const warnings = [];
  t.after(() => rm(cacheParent, { recursive: true, force: true }));
  return {
    cacheParent, signals, warnings,
    options: {
      cacheParent, signalTarget: signals, stopGraceMs: 250,
      report: message => warnings.push(message), watchdogMs: 10000,
      spawnProcess(command, args, settings) {
        assert.equal(command, 'anvil');
        return spawn(process.execPath, ['-e', childSource, JSON.stringify(args)], settings);
      },
      ...options
    }
  };
}
function implementation() {
  assert.equal(typeof managed.withManagedAnvil, 'function', 'managed cache lifecycle is required');
  return managed.withManagedAnvil;
}

test('normal completion removes only the unique cache after the child has exited', async t => {
  const f = await fixture(t);
  const neighbor = join(f.cacheParent, 'keep-other-run');
  await writeFile(neighbor, 'independent evidence');
  let observed;
  const value = await implementation()(['--host', '127.0.0.1', '--silent'], async node => {
    observed = node;
    await ready(node.cachePath);
    assert.equal(await exists(node.cachePath), true);
    const args = JSON.parse(await readFile(join(node.cachePath, 'started.json'), 'utf8'));
    assert.deepEqual(args, ['--host', '127.0.0.1', '--silent', '--cache-path', node.cachePath]);
    assert.equal(args.some(arg => /prune|history-limit/.test(arg)), false);
    return 'kept result';
  }, f.options);
  assert.equal(value, 'kept result');
  assert.equal(observed.cleanup.stopped, true);
  assert.equal(observed.cleanup.cacheRemoved, true);
  assert.equal(await exists(observed.cachePath), false);
  assert.equal(await readFile(neighbor, 'utf8'), 'independent evidence');
  assert.equal(f.signals.listenerCount('SIGINT'), 0);
  assert.equal(f.signals.listenerCount('SIGTERM'), 0);
  assert.equal(f.signals.listenerCount('exit'), 0);
});

test('callback failure still stops the node and deletes its owned cache', async t => {
  const f = await fixture(t);
  let observed;
  await assert.rejects(implementation()([], async node => {
    observed = node;
    await ready(node.cachePath);
    throw new Error('deliberate action failure');
  }, f.options), /deliberate action failure/);
  assert.equal(observed.cleanup.stopped, true);
  assert.equal(await exists(observed.cachePath), false);
});

test('missing executable startup failure cleans the cache without claiming a live child exited', async t => {
  const f = await fixture(t, {
    spawnProcess: (_command, _args, settings) => spawn('/efs-no-such-anvil-executable', [], settings)
  });
  let observed;
  await assert.rejects(implementation()([], async node => {
    observed = node;
    for (let i = 0; i < 100 && !node.spawnError; i++) await delay(5);
    assert.equal(node.spawnError?.code, 'ENOENT');
    throw new Error('startup failed');
  }, f.options), /startup failed/);
  assert.equal(observed.cleanup.stopped, true);
  assert.equal(observed.cleanup.cacheRemoved, true);
  assert.deepEqual(await readdir(f.cacheParent), []);
});

test('synchronous spawn failure removes only the newly allocated cache', async t => {
  const f = await fixture(t, { spawnProcess() { throw new Error('spawn rejected'); } });
  await assert.rejects(implementation()([], () => assert.fail('must not run'), f.options), /spawn rejected/);
  assert.deepEqual(await readdir(f.cacheParent), []);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  test(`${signal} stops and cleans each concurrent invocation without removing unrelated listeners`, async t => {
    const f = await fixture(t);
    let unrelated = 0;
    const unrelatedListener = () => { unrelated++; };
    f.signals.on(signal, unrelatedListener);
    const nodes = [];
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const work = Array.from({ length: 2 }, () => implementation()([], async node => {
      nodes.push(node);
      await ready(node.cachePath);
      await gate;
      return node.stop();
    }, f.options));
    for (let i = 0; i < 100 && nodes.length < 2; i++) await delay(10);
    assert.equal(nodes.length, 2);
    await Promise.all(nodes.map(node => ready(node.cachePath)));
    assert.notEqual(nodes[0].cachePath, nodes[1].cachePath);
    f.signals.emit(signal);
    release();
    await Promise.all(work);
    assert.equal(unrelated, 1);
    assert.equal(f.signals.listenerCount(signal), 1);
    for (const node of nodes) {
      assert.equal(node.cleanup.stopped, true);
      assert.equal(await exists(node.cachePath), false);
    }
    assert.equal(f.signals.exitCode, signal === 'SIGINT' ? 130 : 143);
  });
}

test('watchdog stops and removes the owned cache while the callback is still pending', async t => {
  const f = await fixture(t, { watchdogMs: 80 });
  await implementation()([], async node => {
    await ready(node.cachePath);
    for (let i = 0; i < 100 && !node.cleanup.cacheRemoved; i++) await delay(10);
    assert.equal(node.cleanup.stopped, true);
    assert.equal(node.cleanup.cacheRemoved, true);
    assert.equal(await exists(node.cachePath), false);
  }, f.options);
});

test('unconfirmed exit retains state, reports the exact path, and never deletes it', async t => {
  const child = new EventEmitter();
  Object.assign(child, { pid: 7654321, exitCode: null, signalCode: null, kill() { return false; } });
  const f = await fixture(t, { spawnProcess: () => child, stopGraceMs: 5 });
  let observed;
  await implementation()([], async node => { observed = node; }, f.options);
  assert.equal(observed.cleanup.stopped, false);
  assert.equal(observed.cleanup.cacheRemoved, false);
  assert.equal(await exists(observed.cachePath), true);
  assert.equal(f.warnings.some(message => message.includes(observed.cachePath)), true);
});

test('abrupt parent exit only requests a stop; it cannot delete state before exit confirmation', async t => {
  const f = await fixture(t);
  await implementation()([], async node => {
    await ready(node.cachePath);
    f.signals.emit('exit');
    assert.equal(await exists(node.cachePath), true);
    assert.equal(f.warnings.some(message => message.includes(node.cachePath)), true);
  }, f.options);
});

test('caller cannot replace the owned cache path', async t => {
  const f = await fixture(t);
  await assert.rejects(implementation()(['--cache-path', f.cacheParent], () => assert.fail('must not run'), f.options), /owned cache/);
  await assert.rejects(implementation()(['--cache-path=/elsewhere'], () => assert.fail('must not run'), f.options), /owned cache/);
  assert.deepEqual(await readdir(f.cacheParent), []);
});
