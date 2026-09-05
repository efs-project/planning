import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';

// Removing export/bootstrap support must fail before any server can mask it.
test('static export is self-contained, prefixed, explicit and read-only in a fresh browser', async t => {
  const exporter = await import('./export.mjs').catch(() => null);
  assert.ok(exporter?.exportSpa, 'Static exporter must exist; the application server is not a static export');
  const { startStatic } = await import('./serve.mjs');
  const { startGateway } = await import('./dev-gateway.mjs');
  const temporary = await mkdtemp(join(tmpdir(), 'efs-static-proof-'));
  let browser, host, gateway;
  t.after(async () => {
    await browser?.close(); await gateway?.close(); await host?.close();
    await rm(temporary, { recursive: true, force: true });
  });
  const outputDir = join(temporary, 'site');
  await exporter.exportSpa({ outputDir });
  host = await startStatic({ directory: outputDir, prefix: '/ipfs/static-proof/' });
  browser = await chromium.launch({ headless: true,
    ...(process.env.EFS_LAB_CHROMIUM ? { executablePath: process.env.EFS_LAB_CHROMIUM } : {}) });

  await t.test('missing configuration stays UNKNOWN without default RPC or signing traffic', async () => {
    const page = await browser.newPage(); const requests = [];
    page.on('request', request => requests.push(request));
    await page.goto(host.url + '#data');
    await page.locator('#live-status').filter({ hasText: /UNKNOWN.*configuration/i }).waitFor();
    assert.equal(requests.some(request => request.method() === 'POST'), false);
    assert.equal(await page.locator('iframe').count(), 0);
    await page.close();
  });

  gateway = await startGateway({ allowedOrigin: host.origin, compileFirst: process.env.EFS_SPA_COMPILE === '1' });
  const { manifest } = gateway;
  await t.test('export refuses credential-like fields and authenticated provider URLs', async () => {
    await assert.rejects(exporter.exportSpa({ outputDir: join(temporary, 'bad'),
      manifest: { ...manifest, privateKey: 'DO_NOT_EXPORT' }, rpcUrl: gateway.rpcUrl }), /secret|credential/i);
    await assert.rejects(exporter.exportSpa({ outputDir: join(temporary, 'bad-url'),
      manifest, rpcUrl: 'https://username:password@example.invalid/' }), /credential/i);
  });
  // Export again into a fresh output, never overwrite an earlier deployment.
  await host.close();
  const configured = join(temporary, 'configured');
  await exporter.exportSpa({ outputDir: configured, manifest, rpcUrl: gateway.rpcUrl });
  host = await startStatic({ directory: configured, prefix: '/ipfs/static-proof/', port: new URL(host.origin).port });
  const page = await browser.newPage(); const requests = [], errors = [];
  page.on('request', request => requests.push(request)); page.on('pageerror', error => errors.push(error.message));

  await t.test('Files and Data read real seeded contracts from a separate RPC origin', async () => {
    for (const endpoint of ['config', 'rpc', 'wallet', 'relay', 'session']) {
      assert.equal((await fetch(host.origin + '/' + endpoint)).status, 404);
      assert.equal((await fetch(host.url + endpoint)).status, 404);
      assert.equal((await fetch(host.url + endpoint, { method: 'POST' })).status, 404);
    }
    await page.goto(host.url + '#files');
    await page.getByRole('cell', { name: 'welcome.md', exact: true }).waitFor();
    await page.getByRole('cell', { name: 'welcome.md', exact: true }).click();
    await page.locator('#preview-body').filter({ hasText: /These bytes were stored by a real local Solidity contract/ }).waitFor();
    assert.equal(await page.locator('#download-file').isDisabled(), false);
    const exactUrl = page.url();
    assert.match(exactUrl, /\/ipfs\/static-proof\/#files\/file\/0x[0-9a-f]+/);
    await page.reload();
    await page.locator('#preview-body').filter({ hasText: /real local Solidity contract/ }).waitFor();
    await page.locator('[data-tab="data"]').click();
    await page.locator('#data-notice').filter({ hasText: /PARTIAL inventory · 4 loaded/ }).waitFor();
    await page.reload();
    await page.locator('#data-notice').filter({ hasText: /PARTIAL inventory · 4 loaded/ }).waitFor();
    assert.equal(await page.locator('[data-view="data"]').evaluate(el => el.classList.contains('active')), true);
    assert.match(await page.locator('#record-list').textContent(), /VALIDATED/);
    assert.equal(await page.locator('iframe').count(), 0, 'browsing must not execute game content');
    const arcadeFrames = [];
    const observeFrame = frame => arcadeFrames.push(frame);
    page.on('frameattached', observeFrame);
    await page.locator('[data-tab="arcade"]').click();
    assert.equal(new URL(page.url()).hash, '#arcade', 'Arcade browse proof must actually enter the Arcade route');
    await page.locator('#challenge-state').filter({ hasText: /Exact challenge verified/ }).waitFor();
    assert.equal(await page.locator('[data-view="arcade"]').evaluate(el => el.classList.contains('active')), true);
    assert.equal(await page.locator('#play-game').isDisabled(), false, 'inspection must complete before asserting pre-Play behavior');
    assert.match(await page.locator('#game-byte-state').textContent(), /verified bytes · not running/);
    assert.equal(await page.locator('iframe').count(), 0);
    assert.equal(page.frames().length, 1, 'only the host frame exists before Play');
    assert.equal(arcadeFrames.length, 0, 'browse must not even transiently mount executable content');
    const arcadeEvidence = JSON.parse(await page.locator('#arcade-evidence').textContent());
    assert.equal(arcadeEvidence.teardown.state, 'NOT_LAUNCHED');
    assert.equal(arcadeEvidence.teardown.frameRemoved, true);
    assert.equal(arcadeEvidence.teardown.blobRevoked, true);
    page.off('frameattached', observeFrame);
    await page.locator('[data-tab="data"]').click();
    await page.locator('#data-notice').filter({ hasText: /PARTIAL inventory · 4 loaded/ }).waitFor();
    assert.equal(await page.locator('[data-action="file"]').isVisible(), false, 'read-only export must not offer simulated writes');
    assert.equal(await page.evaluate(() => Boolean(window.EFS_LAB_BOOTSTRAP.walletProvider)), false);
    assert.equal(await page.evaluate(async () => {
      try { await window.EFS_LAB_BOOTSTRAP.readProvider.request({ method: 'eth_sendTransaction', params: [] }); return 'unexpected success'; }
      catch (error) { return error.message; }
    }), 'READ_METHOD_REQUIRED');
    assert.equal(errors.length, 0, errors.join('\n'));
    const posts = requests.filter(request => request.method() === 'POST');
    assert.ok(posts.length > 0, 'real browser must read the real RPC');
    assert.ok(posts.every(request => request.url() === gateway.rpcUrl));
    assert.ok(posts.every(request => !/sign|send|accounts|wallet/i.test(request.postDataJSON().method)));
    assert.ok(requests.filter(request => request.method() === 'GET').every(request => {
      const url = new URL(request.url()); return url.origin === host.origin && url.pathname.startsWith('/ipfs/static-proof/');
    }), 'every page, config and module must be served below the static prefix');
    assert.notEqual(new URL(gateway.rpcUrl).origin, host.origin);
  });

  await t.test('gateway has no page, manifest, wallet endpoint or cross-origin signing permission', async () => {
    const origin = new URL(gateway.rpcUrl).origin;
    assert.equal((await fetch(origin + '/')).status, 404);
    assert.equal((await fetch(origin + '/config')).status, 404);
    assert.equal((await fetch(origin + '/wallet', { method: 'POST' })).status, 404);
    const request = { jsonrpc: '2.0', id: 1, method: 'eth_sendTransaction', params: [] };
    const denied = await fetch(gateway.rpcUrl, { method: 'POST', headers: { origin: host.origin, 'content-type': 'application/json' }, body: JSON.stringify(request) });
    assert.equal(denied.status, 400);
    const foreign = await fetch(gateway.rpcUrl, { method: 'POST', headers: { origin: 'https://other.invalid', 'content-type': 'application/json' }, body: JSON.stringify({ ...request, method: 'eth_chainId' }) });
    assert.equal(foreign.status, 403);
  });

  await t.test('denied CORS does not turn the readable static shell into qualified data', async () => {
    const foreignHost = await startStatic({ directory: configured, prefix: '/ipfs/cors-denied/' });
    const foreignPage = await browser.newPage();
    try {
      await foreignPage.goto(foreignHost.url + '#data');
      await foreignPage.locator('#data-notice').filter({ hasText: /UNKNOWN inventory.*PAGE_UNAVAILABLE/ }).waitFor();
      assert.equal(await foreignPage.locator('#record-list').textContent().then(text => /VALIDATED/.test(text)), false);
    } finally { await foreignPage.close(); await foreignHost.close(); }
  });

  await t.test('a manifest naming the wrong chain cannot display qualified rows', async () => {
    const wrong = join(temporary, 'wrong-chain');
    await exporter.exportSpa({ outputDir: wrong, rpcUrl: gateway.rpcUrl,
      manifest: { ...manifest, deployment: { ...manifest.deployment, chainId: '1' } } });
    const port = new URL(host.origin).port;
    await host.close();
    host = await startStatic({ directory: wrong, prefix: '/ipfs/static-proof/', port });
    try {
      await page.reload();
      await page.locator('#data-notice').filter({ hasText: /UNKNOWN inventory.*PAGE_UNAVAILABLE/ }).waitFor();
      const evidence = JSON.parse(await page.locator('#raw-evidence').textContent());
      assert.equal(evidence.qualification.coverage, 'UNKNOWN');
      assert.equal(await page.evaluate(() => String(window.EFS_LAB_BOOTSTRAP.deployment.chainId)), '1');
      assert.equal(await page.evaluate(() => window.EFS_LAB_BOOTSTRAP.readProvider.request({ method: 'eth_chainId', params: [] })), '0x7a69');
      assert.equal(await page.locator('#record-list').textContent().then(text => /VALIDATED/.test(text)), false);
    } finally {
      await host.close(); host = await startStatic({ directory: configured, prefix: '/ipfs/static-proof/', port });
    }
  });

  await t.test('failed provider remains UNKNOWN while static deep routing still loads', async () => {
    await gateway.close();
    const navigation = await page.reload();
    assert.ok(navigation, 'provider-failure probe must create a fresh document, not a same-hash navigation');
    await page.locator('#data-notice').filter({ hasText: /UNKNOWN inventory.*PAGE_UNAVAILABLE/ }).waitFor();
    assert.equal(await page.locator('iframe').count(), 0);
    assert.equal(await page.locator('#data-notice').textContent().then(text => /COMPLETE inventory/.test(text)), false);
    assert.equal((await fetch(host.url)).status, 200, 'assets survive gateway shutdown');
    await page.close();
  });

  await t.test('export contains public assets only and preserves active view bytes', async () => {
    const names = await readdir(configured, { recursive: true });
    assert.ok(!names.some(name => /node_modules|scripts|\.sol$|package|dev-gateway|session|private/i.test(name)));
    const saved = JSON.parse(await readFile(join(configured, 'manifest.json'), 'utf8'));
    assert.equal(saved.deployment.profile, 'efs-lab/1');
    assert.equal(saved.accounts, undefined); assert.equal(saved.sessionGrant, undefined);
    for (const name of ['workflow-app.mjs', 'files-view.mjs', 'data-view.mjs', 'arcade-view.mjs']) {
      assert.equal(await readFile(join(configured, name), 'utf8'), await readFile(new URL('../../2026-09-04-mvp-rehearsal/web/' + name, import.meta.url), 'utf8'));
    }
    await assert.rejects(exporter.exportSpa({ outputDir: configured }), /exist/i, 'export must not overwrite a deployment');
  });
});
