import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

let server, browser, origin;
test.before(async () => {
  const source = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
  server = createServer(async (request, response) => {
    try {
      if (request.url === '/') {
        response.setHeader('content-type', 'text/html'); response.end(source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, ''));
      } else if (['/files-view.mjs', '/model.mjs', '/styles.css'].includes(request.url)) {
        response.setHeader('content-type', request.url.endsWith('.css') ? 'text/css' : 'text/javascript');
        response.end(await readFile(new URL(`../web${request.url}`, import.meta.url)));
      } else { response.statusCode = 404; response.end(); }
    } catch (error) { response.statusCode = 500; response.end(error.message); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.EFS_LAB_CHROMIUM ? { executablePath: process.env.EFS_LAB_CHROMIUM } : {}) });
});
test.after(async () => { await browser?.close(); await new Promise(resolve => server?.close(resolve)); });

async function fixture() {
  const page = await browser.newPage(); await page.goto(origin);
  await page.evaluate(async () => {
    const { createFilesView } = await import('/files-view.mjs');
    const id = n => `0x${n.toString(16).padStart(64, '0')}`;
    const basis = { blockHash: id(100), blockNumber: 100n };
    const q = { coverage: 'COMPLETE', support: 'SUPPORTED', validation: 'VALID', currentness: 'CURRENT_AT_BASIS', availability: 'AVAILABLE', bytes: 'RETURNED', integrity: 'NOT_APPLICABLE' };
    const result = (kind, subject, value) => ({ outcome: 'FOUND', value, basis, domain: { operation: kind, subject }, qualification: q });
    window.calls = []; window.selection = null;
    const sdk = {
      deployment: { rootId: id(1) },
      readExact: async request => {
        window.calls.push(request);
        if (request.kind === 'node') return result('exact:node', request.id, request.id === id(1)
          ? { kind: 1n, name: 'Lab root', parent: id(0), revision: 0n }
          : { kind: 2n, name: request.id === id(2) ? 'example.bin' : `file-${BigInt(request.id)}.txt`, parent: id(1), revision: 2n });
        if (request.kind === 'revision') return result('exact:revision', request.file, { contentId: id(1000 + Number(request.revision)), previous: id(0) });
        return { outcome: 'UNKNOWN', qualification: { coverage: 'UNKNOWN' } };
      },
      readPage: async request => {
        window.calls.push(request); const cursor = BigInt(request.cursor ?? 0); const next = cursor + 8n < 10n ? cursor + 8n : 10n;
        const domain = { operation: 'page:children', subject: id(1) };
        return { outcome: 'FOUND', basis, domain, cursor, next, total: 10n, items: Array.from({ length: Number(next - cursor) }, (_, index) => id(Number(cursor) + index + 2)),
          continuation: next < 10n ? { cursor: next, basis, domain, total: 10n } : null,
          qualification: { ...q, coverage: cursor === 0n && next === 10n ? 'COMPLETE' : 'PARTIAL' } };
      },
      readVerifiedBytes: async request => {
        window.calls.push(request);
        return { ...result('verified-bytes', request.contentId, { bytes: request.contentId === id(1001) ? '0x6f6c64' : '0x00ff8001' }), qualification: { ...q, integrity: 'VERIFIED' } };
      },
      planWrite() { window.calls.push({ kind: 'planWrite' }); throw new Error('A validated input reached planning'); },
    };
    window.fixtureSdk = sdk; window.fixtureConfig = {};
    window.view = createFilesView({ root: document.querySelector('[data-view="files"]'), sdk, config: window.fixtureConfig,
      utilities: { deriveRevisionId: () => id(900) }, onEvidence: (_label, evidence) => { window.selection = evidence; },
      onStatus: text => { document.querySelector('#live-status').textContent = text; }, onBasis: () => {}, navigate: hash => window.view.open(hash) });
    await window.view.open('#files');
  });
  return page;
}

test('Files view renders bounded pages, loads more, and follows exact old revision links without wallet calls', async () => {
  const page = await fixture();
  try {
    assert.equal(await page.locator('#file-list tr').count(), 8);
    await page.locator('#files-load-more').click();
    await page.waitForFunction(() => document.querySelectorAll('#file-list tr').length === 10);
    assert.match(await page.locator('#files-notice').textContent(), /COMPLETE/);
    await page.getByRole('cell', { name: 'example.bin', exact: true }).click();
    await page.locator('#download-file:not([disabled])').waitFor();
    assert.match(await page.locator('#exact-file-link').getAttribute('href'), /revision=2$/);
    await page.locator('#file-history a').filter({ hasText: 'Revision 1' }).click();
    await page.locator('#preview-body').filter({ hasText: /^old$/ }).waitFor();
    assert.match(await page.locator('#exact-file-link').getAttribute('href'), /revision=1$/);
    assert.equal(await page.evaluate(() => window.calls.some(call => call.kind === 'planWrite')), false);
  } finally { await page.close(); }
});

test('invalid names and oversized uploads are rejected before any plan or approval', async () => {
  const page = await fixture();
  try {
    await page.locator('[data-action="file"]').click();
    await page.locator('#write-name').fill('a'.repeat(65)); await page.locator('#plan-submit').click();
    await page.locator('#plan-preview').filter({ hasText: /name must/i }).waitFor();
    assert.equal(await page.locator('#write-name').inputValue(), 'a'.repeat(65), 'invalid oversized names must not be silently truncated');
    assert.equal(await page.locator('#confirm-dialog[open]').count(), 0);
    await page.locator('#write-name').fill('invalid/name'); await page.locator('#plan-submit').click();
    await page.locator('#plan-preview').filter({ hasText: /name must/i }).waitFor();
    assert.equal(await page.locator('#confirm-dialog[open]').count(), 0);
    await page.locator('#write-name').fill('large.bin');
    await page.locator('#write-upload').setInputFiles({ name: 'large.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(16385) });
    await page.locator('#plan-submit').click();
    await page.locator('#plan-preview').filter({ hasText: /16 KiB/ }).waitFor();
    assert.equal(await page.locator('#confirm-dialog[open]').count(), 0);
    assert.equal(await page.evaluate(() => window.calls.some(call => call.kind === 'planWrite')), false);
  } finally { await page.close(); }
});

test('deactivation rejects a late read and prevents stale Files selection evidence from reaching the shell', async () => {
  const page = await fixture();
  try {
    await page.evaluate(async () => {
      window.selection = 'unchanged';
      const pending = window.view.open('#files/file/0x' + '0'.repeat(63) + '2?revision=1');
      window.view.deactivate(); await pending;
    });
    assert.equal(await page.evaluate(() => window.selection), 'unchanged');
  } finally { await page.close(); }
});

for (const fault of ['corrupt', 'unavailable']) {
  test(`${fault} exact file bytes remain inspectable but cannot be downloaded or executed`, async () => {
    const page = await fixture();
    try {
      await page.evaluate(async fault => {
        const originalRead = window.fixtureSdk.readVerifiedBytes;
        window.fixtureSdk.readVerifiedBytes = async request => {
          const result = await originalRead(request);
          return { ...result, value: undefined, reasonCode: fault === 'corrupt' ? 'CONTENT_ID_MISMATCH' : 'CARRIER_MISSING',
            qualification: { ...result.qualification, integrity: fault === 'corrupt' ? 'FAILED' : 'UNKNOWN', availability: fault === 'corrupt' ? 'AVAILABLE' : 'UNAVAILABLE' } };
        };
        await window.view.open('#files/file/0x' + '0'.repeat(63) + '2?revision=1');
      }, fault);
      assert.equal(await page.locator('#download-file').isDisabled(), true);
      assert.match(await page.locator('#preview-body').textContent(), /unavailable or failed verification/);
      assert.equal(await page.locator('iframe').count(), 0);
      assert.equal(await page.evaluate(() => window.selection.bytes.reasonCode), fault === 'corrupt' ? 'CONTENT_ID_MISMATCH' : 'CARRIER_MISSING');
    } finally { await page.close(); }
  });
}

for (const cancel of ['cancel button', 'close button', 'Escape']) {
  test(`${cancel} during delayed write planning cannot reopen approval or submit`, async () => {
    const page = await fixture();
    try {
      await page.evaluate(() => {
        const sdk = window.fixtureSdk, readExact = sdk.readExact;
        sdk.readExact = request => {
          if (request.kind !== 'ownerNonce') return readExact(request);
          window.noncePending = true;
          return new Promise(resolve => { window.releaseNonce = () => resolve({ outcome: 'FOUND', value: 0n,
            basis: { blockHash: '0x' + 'a'.repeat(64) }, qualification: { coverage: 'COMPLETE', support: 'SUPPORTED', validation: 'VALID', currentness: 'CURRENT_AT_BASIS', availability: 'AVAILABLE' } }); });
        };
        sdk.operations = { createFile: payload => payload };
        sdk.planWrite = () => ({ digest: '0x' + 'b'.repeat(64), predicted: { revision: 1n } });
        sdk.prepareWrite = async () => { window.calls.push({ kind: 'prepareWrite' }); return {}; };
        sdk.submitWrite = async () => { window.calls.push({ kind: 'submitWrite' }); return {}; };
      });
      await page.locator('[data-action="file"]').click(); await page.locator('#write-name').fill('cancelled.txt');
      await page.locator('#plan-submit').click(); await page.waitForFunction(() => window.noncePending);
      if (cancel === 'Escape') await page.keyboard.press('Escape');
      else await page.locator(cancel === 'close button' ? '#close-write' : '#cancel-write').click();
      await page.evaluate(() => window.releaseNonce());
      await page.waitForFunction(() => !document.querySelector('#plan-submit').disabled || document.querySelector('#confirm-dialog').open);
      assert.equal(await page.locator('#confirm-dialog[open]').count(), 0, 'cancelled planning must not request approval');
      assert.equal(await page.evaluate(() => window.calls.some(call => ['prepareWrite', 'submitWrite'].includes(call.kind))), false);
    } finally { await page.close(); }
  });
}

test('session Cancel after observed grant setup blocks the zero-prompt routine signature and submission', async () => {
  const page = await fixture();
  try {
    await page.evaluate(() => {
      const id = n => '0x' + n.toString(16).padStart(64, '0');
      const grant = { key: '0x' + 'a'.repeat(40), scope: id(1), operations: 7, expiry: BigInt(Math.floor(Date.now() / 1000) + 6000), maxWrites: 10n, maxBytes: 16384n, nonce: 0n };
      const q = { coverage: 'COMPLETE', support: 'SUPPORTED', validation: 'VALID', currentness: 'CURRENT_AT_BASIS', availability: 'AVAILABLE' };
      window.fixtureConfig.sessionGrant = { grant, grantId: id(33) };
      const sdk = window.fixtureSdk, originalRead = sdk.readExact;
      sdk.registerGrant = async () => { window.calls.push({ kind: 'registerGrant' }); return { grantId: id(33), grant }; };
      sdk.readExact = request => {
        if (request.kind === 'grant') return Promise.resolve({ outcome: 'FOUND', basis: { blockHash: id(100) }, domain: { subject: id(33) }, qualification: q,
          value: { grant, revoked: false, approval: '0x1234', writes: 0n, payloadBytes: 0n } });
        if (request.kind !== 'ownerNonce') return originalRead(request);
        window.noncePending = true;
        return new Promise(resolve => { window.releaseNonce = () => resolve({ outcome: 'FOUND', value: 0n, basis: { blockHash: id(100) }, qualification: q }); });
      };
      sdk.operations = { createFile: payload => payload };
      sdk.planWrite = () => ({ digest: id(44), predicted: { revision: 1n } });
      sdk.prepareWrite = async () => { window.calls.push({ kind: 'prepareWrite' }); return {}; };
      sdk.submitWrite = async () => { window.calls.push({ kind: 'submitWrite' }); return {}; };
    });
    await page.locator('[data-action="file"]').click(); await page.locator('#write-name').fill('session-cancelled.txt');
    await page.locator('input[name="mode"][value="SESSION"]').check();
    await page.locator('#plan-submit').click();
    await page.locator('#confirm-dialog[open] button[value="approve"]').click();
    await page.waitForFunction(() => window.noncePending);
    await page.locator('#cancel-write').click(); await page.evaluate(() => window.releaseNonce());
    await page.waitForFunction(() => !document.querySelector('#plan-submit').disabled);
    assert.equal(await page.locator('#confirm-dialog[open]').count(), 0);
    assert.equal(await page.evaluate(() => window.calls.filter(call => call.kind === 'registerGrant').length), 1, 'separately approved grant setup is not undone');
    assert.equal(await page.evaluate(() => window.calls.some(call => ['prepareWrite', 'submitWrite'].includes(call.kind))), false);
  } finally { await page.close(); }
});
