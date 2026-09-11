import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { compileUpgrade, withUpgrade, mountedFixture, A, hash } from './fixture.mjs';
import { createFixtureReader } from '../reader-scope.mjs';
import * as scopeApi from '../reader-scope.mjs';
import { openDirectory } from '../files-reader.mjs';
import { compileRouter, routerFixture } from '../../2026-09-09-files-browser-mvp/test/router-fixture.mjs';
import { authorityFixture } from '../../2026-09-09-files-browser-mvp/test/authority-fixture.mjs';

const ready = async (lab, { source, expected = lab.expected, limits, blockTag = 'latest' } = {}) => {
  const opened = await createFixtureReader({ source: source ?? { identity: expected.source, epoch: 1, request: lab.rpc }, context: { expected, limits } }).open({ blockTag });
  assert.equal(opened.status, 'READY', opened.reason);
  assert.equal(scopeApi.isQualifiedScope(opened.scope), true);
  assert.equal(scopeApi.isQualifiedScope({ ...opened.scope }), false);
  return opened.scope;
};

// Break: duck-typed objects are accepted as independently qualified scopes.
test('scope provenance brand refuses plain and primitive values', () => {
  assert.equal(typeof scopeApi.isQualifiedScope, 'function');
  for (const scope of [undefined, null, 0, 'scope', {}, { basis: {}, call() {}, seal() {} }]) assert.equal(scopeApi.isQualifiedScope(scope), false);
});

// Break: compiler and any actual deployment loader disagree about isolated outputs.
test('isolated foundation and router artifacts deploy through every fixture loader', { timeout: 600000 }, async () => {
  compileUpgrade(); compileRouter();
  if (process.env.EFS_TEST_BUILD_ROOT) {
    for (const name of ['foundation/out/UpgradeableReadFixtureCore.sol/UpgradeableReadFixtureCore.json', 'foundation/out/build-info', 'router/out/FilesRouterV1.sol/FilesRouterV1.json', 'router/out/FilesRouterV2.sol/FilesRouterV2.json']) {
      assert(existsSync(join(process.env.EFS_TEST_BUILD_ROOT, name)), 'isolated artifact: ' + name);
    }
  }
  await withUpgrade(async lab => {
    await mountedFixture(lab);
    await routerFixture(lab);
    const authority = await authorityFixture(lab);
    assert(authority.router);
  }, { profile: 'reads' });
});

// Break: rollover discards, duplicates or promotes an unsealed partial page.
test('real small-budget directory resumes the sealed frontier across acquisitions', { timeout: 300000 }, async t => {
  await withUpgrade(async lab => {
    const f = await mountedFixture(lab);
    for (const name of ['a.txt', 'b.txt', 'c.txt', 'd.txt', 'e.txt', 'f.txt', 'g.txt', 'h.txt']) await f.claim(A, name);
    let scope = await ready(lab, { limits: { maxRequests: 100 } });
    const basis = scope.basis, blockTag = '0x' + basis.blockNumber.toString(16);
    const stream = openDirectory(scope, { mountId: f.mounts.aFirst, pageSize: 1 });
    let acquisitions = 1, last, prior, rollovers = 0;
    for (let i = 0; i < 40; i++) {
      last = await stream.loadMore();
      assert.deepEqual(last.basis, basis);
      assert.equal(new Set(last.rows.map(row => row.fieldRole)).size, last.rows.length);
      if (last.qualification.status === 'UNAVAILABLE') {
        assert.match(last.detail, /request budget exceeded/);
        assert(prior, 'at least one sealed page fits the budget');
        assert.deepEqual(last.rows, prior.rows); assert.deepEqual(last.progress, prior.progress);
        const next = await ready(lab, { limits: { maxRequests: 100 }, blockTag });
        assert.equal(typeof stream.resume, 'function', 'in-process resume is available');
        assert.equal((await stream.resume(next)).status, 'RESUMED');
        scope.close(); scope = next; acquisitions++; rollovers++;
      } else {
        prior = last;
        if (last.coverage === 'COMPLETE') break;
      }
    }
    assert.equal(last.coverage, 'COMPLETE');
    assert.equal(last.qualification.status, 'QUALIFIED');
    assert.deepEqual(last.rows.map(row => row.value.name), ['a.txt', 'b.txt', 'c.txt', 'd.txt', 'e.txt', 'f.txt', 'g.txt', 'h.txt', 'note.txt']);
    assert(rollovers >= 2, 'multiple independent acquisitions are needed');
    let predecessor = last.priorSealed, segments = 1;
    while (predecessor) { assert.deepEqual(predecessor.basis, basis); assert.equal(predecessor.rowsEvidence, 'CURRENT_SEALED'); assert(predecessor.evidence.some(e => e.purpose === 'seal')); segments++; predecessor = predecessor.priorSealed; }
    assert.equal(segments, acquisitions, 'final evidence retains each sealed acquisition predecessor');
    assert.equal(last.progress.reduce((n, source) => n + source.scanned, 0n), 9n);
    t.diagnostic(JSON.stringify({ acquisitions, rows: last.rows.length, budget: 100 })); scope.close();
  }, { profile: 'reads' });
});

// Break: scope handoff races caller-owned work or closes/shared-mutates scopes on refusal.
test('candidate work and close during asynchronous handoff leave the old frontier intact', { timeout: 300000 }, async () => {
  await withUpgrade(async lab => {
    const f = await mountedFixture(lab); await f.claim(A, 'second.txt');
    let holding = null, release, entered;
    const request = async (method, params, options) => {
      const raw = await lab.rpc(method, params, options);
      if (method === 'eth_call') {
        const q = lab.readIface.parseTransaction({ data: params[0].data });
        if (q?.name === 'getRecord' && q.args[0] === holding) { entered(); await new Promise(resolve => { release = resolve; }); }
      }
      return raw;
    };
    const source = { identity: lab.expected.source, epoch: 1, request };
    const first = await ready(lab, { source }), stream = openDirectory(first, { mountId: f.mounts.aFirst, pageSize: 1 });
    const prior = await stream.loadMore(), next = await ready(lab, { source, blockTag: '0x' + first.basis.blockNumber.toString(16) });
    holding = f.fileA;
    let gate = new Promise(resolve => { entered = resolve; });
    const pending = next.call('getRecord', [f.fileA]); await gate;
    try { assert.equal((await stream.resume(next)).reason, 'SCOPE_BUSY'); assert.equal(stream.snapshot(), prior); }
    finally { holding = null; release(); await pending; }
    holding = f.mounts.aFirst; gate = new Promise(resolve => { entered = resolve; });
    const handoff = stream.resume(next); await gate;
    assert.equal((await stream.resume(next)).reason, 'STREAM_BUSY');
    stream.close(); holding = null; release();
    assert.equal((await handoff).reason, 'STREAM_CLOSED'); assert.equal(stream.snapshot(), prior);
    assert.equal((await next.call('getRecord', [f.fileB])).status, 'OK');
    first.close(); next.close();
  }, { profile: 'reads' });
});

// Break: matching only execution/high-water accepts a different independently
// qualified header or a changed manifest (the local source is the trust boundary).
test('independently qualified hash, state root, high-water and manifest drift are refused', { timeout: 300000 }, async () => {
  await withUpgrade(async lab => {
    const f = await mountedFixture(lab); await f.claim(A, 'second.txt');
    let change = null, realHash;
    const request = async (method, params, options) => {
      let actual = params;
      if (change?.hash && params.at(-1)?.blockHash === change.hash) actual = [...params.slice(0, -1), { ...params.at(-1), blockHash: realHash }];
      const raw = await lab.rpc(method, actual, options);
      if (method === 'eth_getBlockByNumber') { realHash = raw.hash; return { ...raw, ...(change?.hash ? { hash: change.hash } : {}), ...(change?.stateRoot ? { stateRoot: change.stateRoot } : {}) }; }
      if (change?.high && method === 'eth_call') {
        const q = lab.readIface.parseTransaction({ data: params[0].data });
        if (q?.name === 'fixtureReadContext' || q?.name === 'counts') {
          const values = lab.readIface.decodeFunctionResult(q.fragment, raw).toArray(true);
          if (q.name === 'counts') values[0][4]++; else values[3]++;
          return lab.readIface.encodeFunctionResult(q.fragment, values);
        }
      }
      return raw;
    };
    const source = { identity: lab.expected.source, epoch: 1, request };
    const first = await ready(lab, { source }), stream = openDirectory(first, { mountId: f.mounts.aFirst, pageSize: 1 });
    const prior = await stream.loadMore(), blockTag = '0x' + first.basis.blockNumber.toString(16);
    for (const delta of [{ hash: hash('other-block-hash') }, { stateRoot: hash('other-state-root') }, { high: true }]) {
      change = delta;
      const next = await ready(lab, { source, blockTag });
      assert.notDeepEqual(next.basis, first.basis);
      assert.equal((await stream.resume(next)).reason, 'BASIS_MISMATCH');
      assert.equal(stream.snapshot(), prior); next.close();
    }
    change = null;
    const expected = structuredClone(lab.expected);
    expected.components.duplicateCore = { ...expected.components.core };
    const next = await ready(lab, { source, expected, blockTag });
    assert.deepEqual(next.basis, first.basis, 'basis alone does not cover the manifest');
    assert.equal((await stream.resume(next)).reason, 'BASIS_MISMATCH');
    assert.equal(stream.snapshot(), prior); first.close(); next.close();
  }, { profile: 'reads' });
});

// Break: handoff accepts changed observation/source context or mutates a refused stream.
test('resume refuses basis drift, forged scopes, closed and in-flight handoffs', { timeout: 300000 }, async () => {
  await withUpgrade(async lab => {
    const f = await mountedFixture(lab); await f.claim(A, 'second.txt');
    const source = { identity: lab.expected.source, epoch: 1, request: lab.rpc };
    const first = await ready(lab, { source });
    const stream = openDirectory(first, { mountId: f.mounts.aFirst, pageSize: 1 });
    const partial = await stream.loadMore(), blockTag = '0x' + first.basis.blockNumber.toString(16);
    async function refused(next, reason) {
      const before = stream.snapshot();
      const result = await stream.resume(next);
      assert.equal(result.status, 'REFUSED'); if (reason) assert.equal(result.reason, reason);
      assert.equal(stream.snapshot(), before);
    }
    assert.equal(typeof stream.resume, 'function', 'in-process resume is available');
    const same = await ready(lab, { source, blockTag });
    for (const field of ['source', 'epoch', 'chainId', 'core', 'blockNumber', 'blockHash', 'stateRoot', 'executionSetId', 'revision', 'admissionHigh']) {
      const value = first.basis[field];
      await refused({ ...same, basis: { ...same.basis, [field]: typeof value === 'bigint' ? value + 1n : typeof value === 'number' ? value + 1 : value + 'changed' } });
    }
    await refused({ ...same }, 'UNQUALIFIED_SCOPE');
    const epoch = await ready(lab, { source: { ...source, epoch: 2 }, blockTag }); await refused(epoch); epoch.close();
    const expected = { ...lab.expected, source: 'other-local-source' };
    const other = await ready(lab, { expected, source: { ...source, identity: expected.source }, blockTag }); await refused(other); other.close();
    const replacedTransport = await ready(lab, { source: { ...source, request: (...args) => lab.rpc(...args) }, blockTag }); await refused(replacedTransport); replacedTransport.close();
    const dead = await ready(lab, { source, blockTag }); dead.close(); await refused(dead);
    await lab.rpc('evm_mine', []); const newBlock = await ready(lab); await refused(newBlock); newBlock.close();
    await f.claim(A, 'third.txt'); const newHigh = await ready(lab); await refused(newHigh); newHigh.close();
    await lab.upgrade(); const upgraded = await ready(lab); await refused(upgraded); upgraded.close();
    const loading = stream.loadMore(); await refused(same, 'STREAM_BUSY'); await loading;
    assert.equal(stream.snapshot().rows.length, 2, 'refusals retain the old numeric observation');
    assert.deepEqual(partial.basis, stream.snapshot().basis);
    assert.equal((await stream.resume(same)).status, 'RESUMED');
    assert.equal((await first.call('getRecord', [f.fileA])).status, 'OK', 'successful resume does not close a shared previous scope');
    stream.close(); await refused(same, 'STREAM_CLOSED');
    assert.equal((await same.call('getRecord', [f.fileA])).status, 'OK', 'refusal does not close caller scope');
    same.close(); first.close();
  }, { profile: 'reads' });
});

// Break: a failed seal overwrites the first data-validation error.
test('data failure remains primary when the final seal also fails', { timeout: 300000 }, async () => {
  await withUpgrade(async lab => {
    const f = await mountedFixture(lab); let corrupt = false, sealing = false;
    const request = async (method, params, options) => {
      const raw = await lab.rpc(method, params, options);
      if (corrupt && method === 'eth_call') {
        const q = lab.readIface.parseTransaction({ data: params[0].data });
        if (q?.name === 'pagePostingsHydrated') {
          const values = lab.readIface.decodeFunctionResult(q.name, raw).toArray(true);
          values[0][4]++; sealing = true;
          return lab.readIface.encodeFunctionResult(q.name, values);
        }
      }
      return sealing && method === 'eth_getBlockByNumber' ? { ...raw, hash: hash('changed-canonical-block') } : raw;
    };
    const scope = await ready(lab, { source: { identity: lab.expected.source, epoch: 1, request } }); corrupt = true;
    const result = await openDirectory(scope, { mountId: f.mounts.aFirst }).loadMore();
    assert.equal(result.reason, 'PAGE_ALIGNMENT');
    assert.equal(result.qualification.status, 'UNAVAILABLE'); assert.equal(result.rows.length, 0);
    scope.close();
  }, { profile: 'reads' });
});
