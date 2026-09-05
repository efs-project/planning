import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { Interface, hexlify } from 'ethers';
import { deriveContentId } from '../sdk/index.js';
import { startDemo } from './demo.mjs';

const { chromium } = await import(process.env.EFS_LAB_PLAYWRIGHT
  ? pathToFileURL(process.env.EFS_LAB_PLAYWRIGHT).href : 'playwright');
const demo = await startDemo({ compileFirst: process.env.EFS_LAB_SKIP_BUILD !== '1', lifetimeMs: 300000 });
const results = [], errors = [], externalRequests = [];
const directory = new URL('../artifacts/', import.meta.url);
const carrier = new Interface(['function read(bytes32) view returns(bytes)', 'function exists(bytes32) view returns(bool)']);
let browser, context, page;
const counts = () => ({ ...demo.counts });
const noWallet = before => {
  for (const key of ['wallet:eth_signTypedData_v4', 'wallet:eth_sendTransaction', 'relay:eth_sendTransaction', 'session:eth_signTypedData_v4']) {
    assert.equal((demo.counts[key] ?? 0) - (before[key] ?? 0), 0, key);
  }
};
const check = async (name, action) => {
  const started = performance.now(); await action();
  results.push({ name, status: 'PASS', elapsedMs: Math.round(performance.now() - started) }); console.log(`PASS ${name}`);
};
const routeTo = hash => page.evaluate(hash => { location.hash = hash; }, hash);
async function within(promise, label) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timed out`)), 12000); })]); }
  finally { clearTimeout(timer); }
}
const downloadBytes = async button => {
  const event = page.waitForEvent('download'); await button.click();
  const download = await event, chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  return Buffer.concat(chunks);
};
async function faultBytes(contentId, mode) {
  const handler = async route => {
    const request = route.request().postDataJSON();
    if (request.method === 'eth_call' && request.params[0]?.to?.toLowerCase() === demo.config.deployment.byteStore.toLowerCase()) {
      let parsed; try { parsed = carrier.parseTransaction({ data: request.params[0].data }); } catch {}
      if (parsed?.args[0]?.toLowerCase() === contentId.toLowerCase()) {
        if (mode === 'unavailable' && parsed.name === 'exists') return route.fulfill({ json: { result: carrier.encodeFunctionResult('exists', [false]) } });
        if (mode === 'corrupt' && parsed.name === 'read') return route.fulfill({ json: { result: carrier.encodeFunctionResult('read', ['0xdeadbeef']) } });
      }
    }
    await route.continue();
  };
  await page.route('**/rpc', handler);
  return () => page.unroute('**/rpc', handler);
}

try {
  await mkdir(directory, { recursive: true });
  browser = await chromium.launch({ headless: true, ...(process.env.EFS_LAB_CHROMIUM ? { executablePath: process.env.EFS_LAB_CHROMIUM } : {}) });
  context = await browser.newContext({ viewport: { width: 1440, height: 960 }, acceptDownloads: true });
  page = await context.newPage(); page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (![demo.origin, 'blob:', 'data:'].some(prefix => request.url().startsWith(prefix))) externalRequests.push(request.url()); });
  await check('exact directory link and continuation retain one pre-mined basis', async () => {
    const before = counts();
    await page.goto(`${demo.origin}/#files/dir/${demo.config.pagination.directoryId}`);
    await page.getByRole('cell', { name: 'sample-08.txt', exact: true }).waitFor();
    assert.equal(await page.locator('#file-list tr').count(), 8);
    assert.match(await page.locator('#files-notice').textContent(), /PARTIAL|partial|incomplete/i);
    const basis = await page.locator('#basis-summary').textContent();
    await demo.lab.provider.send('evm_mine', []);
    await page.locator('#files-load-more').click();
    await page.getByRole('cell', { name: 'sample-11.txt', exact: true }).waitFor();
    assert.equal(await page.locator('#file-list tr').count(), 11);
    assert.equal(await page.locator('#basis-summary').textContent(), basis);
    assert.match(await page.locator('#files-notice').textContent(), /COMPLETE|complete/);
    noWallet(before);
  });
  await check('keyboard skip link moves focus without changing the selected Files route', async () => {
    const hash = await page.evaluate(() => location.hash);
    await page.locator('.skip').focus(); await page.locator('.skip').press('Enter');
    assert.equal(await page.evaluate(() => location.hash), hash);
    assert.equal(await page.locator('[data-view="files"]').evaluate(node => node.classList.contains('active')), true);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'workspace');
  });
  await check('old exact game revision is readable and downloadable without execution', async () => {
    const before = counts();
    await routeTo(`#files/file/${demo.config.game.fileId}?revision=1`);
    await page.locator('#exact-file-link[href$="revision=1"]').waitFor();
    await page.locator('#download-file:not([disabled])').waitFor();
    const bytes = await downloadBytes(page.locator('#download-file'));
    assert.equal(deriveContentId(bytes), demo.config.game.legacy.contentId);
    assert.equal(await page.locator('iframe').count(), 0);
    await page.waitForFunction(() => document.querySelectorAll('#file-history a').length >= 2);
    noWallet(before);
  });
  await check('binary upload round-trips exactly after one local message approval', async () => {
    await page.locator('#root-node').click();
    await page.getByRole('cell', { name: 'welcome.md', exact: true }).waitFor();
    await page.locator('[data-action="file"]').click();
    await page.locator('#write-name').fill('binary-example.bin');
    const input = Buffer.from([0, 255, 254, 13, 10, 128, 42, 0]);
    await page.locator('#write-upload').setInputFiles({ name: 'binary-example.bin', mimeType: 'application/octet-stream', buffer: input });
    const before = counts();
    await page.locator('#plan-submit').click();
    await page.locator('#confirm-dialog[open] button[value="approve"]').click();
    await page.getByRole('cell', { name: 'binary-example.bin', exact: true }).waitFor();
    await page.getByRole('cell', { name: 'binary-example.bin', exact: true }).click();
    await page.locator('#download-file:not([disabled])').waitFor();
    assert.deepEqual(await downloadBytes(page.locator('#download-file')), input);
    assert.equal((demo.counts['wallet:eth_signTypedData_v4'] ?? 0) - (before['wallet:eth_signTypedData_v4'] ?? 0), 1);
    assert.equal((demo.counts['wallet:eth_sendTransaction'] ?? 0) - (before['wallet:eth_sendTransaction'] ?? 0), 0);
  });
  await check('oversize upload rejects before signing or session setup', async () => {
    await page.locator('[data-action="file"]').click();
    await page.locator('#write-name').fill('too-large.bin');
    const before = counts();
    await page.locator('#write-upload').setInputFiles({ name: 'too-large.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(16385) });
    await page.locator('#plan-submit').click();
    await page.waitForFunction(() => /16384|16.?KiB|16.?384|too large|limit/i.test(document.querySelector('#plan-preview').textContent));
    assert.equal(await page.locator('#confirm-dialog[open]').count(), 0); noWallet(before);
    await page.locator('#cancel-write').click();
  });
  await check('Data exact-schema table keeps large u64 values and numeric ordering lossless', async () => {
    const before = counts();
    await page.locator('[data-tab="data"]').click();
    await page.locator('#data-schema-select option').filter({ hasText: demo.config.data.numericSchemaId }).waitFor({ state: 'attached' });
    const option = await page.locator('#data-schema-select option').filter({ hasText: demo.config.data.numericSchemaId }).getAttribute('value');
    await page.locator('#data-schema-select').selectOption(option);
    await page.locator('#data-sort').selectOption('field:1');
    const rows = await page.locator('#record-list tr').allTextContents();
    assert.equal(rows.length, 3);
    assert.match(rows[0], /42/); assert.match(rows[1], /9007199254740993/); assert.match(rows[2], /18446744073709551615/);
    assert.match(await page.locator('#data-notice').textContent(), /PARTIAL|partial|incomplete/i);
    await page.locator('#record-list button').nth(1).click();
    assert.match(await page.locator('#schema-card').textContent(), /9007199254740993/);
    await page.locator('#load-more-data').click();
    await page.waitForFunction(() => /COMPLETE|complete/.test(document.querySelector('#data-notice').textContent));
    assert.equal(await page.locator('#record-list tr').count(), 3, 'challenge schema stays separate');
    await page.screenshot({ path: new URL('data-table-desktop.png', directory).pathname, fullPage: true });
    noWallet(before);
  });
  await check('loaded-row filter, keyboard selection, copy and mobile table preserve scope and precision', async () => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('#data-filter').fill('9007199254740993');
    assert.equal(await page.locator('#record-list tr').count(), 1);
    await page.locator('#record-list tr').focus(); await page.locator('#record-list tr').press('Enter');
    assert.match(await page.locator('#schema-card').textContent(), /9007199254740993/);
    await page.locator('#copy-data-rows').click();
    await page.waitForFunction(() => /Copied 1 loaded rows/.test(document.querySelector('#live-status').textContent));
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    assert.match(copied, /LOADED_FILTERED_ROWS_ONLY/); assert.match(copied, /9007199254740993/); assert.match(copied, /blockHash/);
    await page.locator('#data-filter').fill('');
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.locator('#data-table td[data-tag="1"]').first().isVisible(), 'typed numeric column must not inherit Files mobile hiding');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.screenshot({ path: new URL('data-table-mobile.png', directory).pathname, fullPage: true });
    await page.setViewportSize({ width: 1440, height: 960 });
  });
  for (const mode of ['unavailable', 'corrupt']) {
    await check(`Data retains a ${mode} payload as a visible failed row`, async () => {
      const record = await demo.lab.core.getRecord(demo.config.data.numericRecordIds[1]);
      const undo = await faultBytes(record.contentId, mode);
      try {
        await page.locator('#refresh-data').click();
        await page.locator('#data-schema-select option').filter({ hasText: demo.config.data.numericSchemaId }).waitFor({ state: 'attached' });
        const option = await page.locator('#data-schema-select option').filter({ hasText: demo.config.data.numericSchemaId }).getAttribute('value');
        await page.locator('#data-schema-select').selectOption(option);
        const row = page.locator(`#record-list tr[data-id="${demo.config.data.numericRecordIds[1]}"]`);
        await row.waitFor();
        assert.match(await row.textContent(), /UNAVAILABLE|UNVERIFIED|UNKNOWN|FAILED|unavailable|failed/i);
        assert.doesNotMatch(await row.textContent(), /9007199254740993/, 'unverified fields must not render as data');
        await row.locator('button').click();
        assert.match(await page.locator('#schema-card').textContent(), /CARRIER_MISSING|CONTENT_ID_MISMATCH|UNVERIFIED|UNAVAILABLE|FAILED/i);
      } finally { await undo(); }
    });
  }
  let firstSequence;
  await check('same exact challenge and release reproduce the obstacle sequence after Stop', async () => {
    const before = counts();
    await page.locator('[data-tab="arcade"]').click();
    assert.equal(await page.locator('iframe').count(), 0);
    await page.locator('#play-game').click();
    const frame = page.frameLocator('#game-stage iframe');
    await frame.locator('#sequence-hash').waitFor();
    firstSequence = await frame.locator('#sequence-hash').textContent();
    assert.ok(firstSequence);
    await page.locator('#stop-game').click();
    assert.equal(await page.locator('iframe').count(), 0);
    await page.locator('#play-game').click();
    await frame.locator('#sequence-hash').waitFor();
    assert.equal(await frame.locator('#sequence-hash').textContent(), firstSequence);
    noWallet(before);
  });
  await check('a fresh browser context reconstructs the same challenge sequence with no wallet', async () => {
    const before = counts();
    const fresh = await browser.newContext();
    try {
      const reader = await fresh.newPage(); reader.setDefaultTimeout(12000);
      reader.on('pageerror', error => errors.push(error.message));
      await reader.goto(`${demo.origin}/#arcade?challenge=${demo.config.game.challengeIds[0]}`);
      await reader.locator('#play-game:not([disabled])').waitFor();
      assert.equal(await reader.locator('iframe').count(), 0);
      await reader.locator('#play-game').click();
      const hash = reader.frameLocator('#game-stage iframe').locator('#sequence-hash'); await hash.waitFor();
      assert.equal(await hash.textContent(), firstSequence);
      noWallet(before);
    } finally { await fresh.close(); }
  });
  await check('another shared typed challenge changes sequence and preserves the sandbox', async () => {
    await routeTo(`#arcade?challenge=${demo.config.game.challengeIds[1]}`);
    await page.waitForFunction(id => document.querySelector('#arcade-challenge-id')?.textContent.includes(id), demo.config.game.challengeIds[1]);
    assert.equal(await page.locator('iframe').count(), 0);
    await page.locator('#play-game').click();
    const frame = page.frameLocator('#game-stage iframe'); await frame.locator('#sequence-hash').waitFor();
    assert.notEqual(await frame.locator('#sequence-hash').textContent(), firstSequence);
    assert.equal(await page.locator('#game-stage iframe').getAttribute('sandbox'), 'allow-scripts');
    await page.screenshot({ path: new URL('arcade-challenge-desktop.png', directory).pathname, fullPage: true });
    await page.locator('#stop-game').click();
  });
  for (const interruption of ['stop', 'navigate']) {
    await check(`delayed Play cannot mount after ${interruption}`, async () => {
      if (interruption === 'navigate') {
        await page.locator('#refresh-arcade').click();
        await page.locator('#play-game:not([disabled])').waitFor();
      }
      let unblock, entered;
      const gate = new Promise(resolve => { unblock = resolve; });
      const blocked = new Promise(resolve => { entered = resolve; });
      const core = new Interface(demo.config.deployment.coreAbi);
      let intercepted = false;
      const handler = async request => {
        const rpc = request.request().postDataJSON();
        if (!intercepted && rpc.method === 'eth_call' && rpc.params[0]?.to?.toLowerCase() === demo.config.deployment.core.toLowerCase()) {
          let parsed; try { parsed = core.parseTransaction({ data: rpc.params[0].data }); } catch {}
          if (parsed?.name === 'getRevision') { intercepted = true; entered(); await gate; }
        }
        await request.continue();
      };
      await page.route('**/rpc', handler);
      try {
        await page.locator('#play-game').click(); await within(blocked, 'intercepted game read');
        if (interruption === 'stop') await page.locator('#stop-game').click();
        else await page.locator('[data-tab="data"]').click();
        const resumed = page.waitForResponse(response => {
          try { return response.request().postDataJSON()?.params?.[0]?.data?.startsWith(core.getFunction('getRevision').selector); } catch { return false; }
        });
        unblock(); await (await resumed).finished();
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert.equal(await page.locator('iframe').count(), 0);
        if (interruption === 'navigate') assert(await page.locator('[data-view="data"]').evaluate(node => node.classList.contains('active')));
      } finally { unblock(); await page.unroute('**/rpc', handler); }
    });
  }
  await check('corrupt game bytes never launch and remain inspectable', async () => {
    await page.locator('[data-tab="arcade"]').click();
    await page.locator('#play-game:not([disabled])').waitFor();
    const undo = await faultBytes(demo.config.game.contentId, 'corrupt');
    try {
      await page.locator('#play-game').click();
      await page.waitForFunction(() => /failed|cannot|blocked|stopped|unverified|not launched/i.test(document.querySelector('#game-byte-state').textContent));
      assert.equal(await page.locator('iframe').count(), 0);
      assert.match(await page.locator('#raw-evidence').textContent(), /FAILED|CONTENT_ID_MISMATCH/);
    } finally { await undo(); }
  });
  await check('missing challenge never falls back to random game configuration', async () => {
    await routeTo(`#arcade?challenge=0x${'ab'.repeat(32)}`);
    await page.waitForFunction(id => document.querySelector('#arcade-challenge-id').textContent === id
      && /Play blocked/.test(document.querySelector('#challenge-state').textContent), `0x${'ab'.repeat(32)}`);
    if (await page.locator('#play-game').isEnabled()) await page.locator('#play-game').click();
    assert.equal(await page.locator('iframe').count(), 0);
  });
  await check('malformed file link fails closed without silently selecting another node', async () => {
    await routeTo('#files/file/0x123?revision=-1');
    await page.waitForFunction(() => /invalid|malformed|unknown|could not/i.test(document.querySelector('#live-status').textContent + document.querySelector('#files-notice').textContent));
    assert.equal(await page.locator('#file-preview:not([hidden])').count(), 0);
  });
  for (const setup of [true, false]) {
    await check(`Cancel fences a pending ${setup ? 'new' : 'established'} session write on the actual SDK`, async () => {
      await page.locator('#root-node').click();
      await page.locator('[data-action="file"]:not([disabled])').waitFor();
      await page.locator('[data-action="file"]').click();
      await page.locator('#write-name').fill(setup ? 'cancel-new-session.txt' : 'cancel-session.txt');
      await page.locator('#write-content').fill('This must never be published.');
      await page.locator('input[name="mode"][value="SESSION"]').check();
      const selector = new Interface(demo.config.deployment.coreAbi).getFunction('ownerNonce').selector;
      let release, entered, intercepted = false;
      const gate = new Promise(resolve => { release = resolve; });
      const waiting = new Promise(resolve => { entered = resolve; });
      const handler = async route => {
        const rpc = route.request().postDataJSON();
        if (!intercepted && rpc.method === 'eth_call' && rpc.params[0]?.data === selector) {
          intercepted = true; entered(); await gate;
        }
        await route.continue();
      };
      const before = counts(), nonce = await demo.lab.core.ownerNonce();
      await page.route('**/rpc', handler);
      try {
        await page.locator('#plan-submit').click();
        if (setup) await page.locator('#confirm-dialog[open] button[value="approve"]').click();
        await within(waiting, 'intercepted nonce read');
        await page.locator('#cancel-write').click(); release();
        await page.waitForFunction(() => !document.querySelector('#plan-submit').disabled);
        assert.equal(await page.locator('#confirm-dialog[open]').count(), 0);
        assert.equal(await demo.lab.core.ownerNonce(), nonce);
        assert.equal((demo.counts['session:eth_signTypedData_v4'] ?? 0) - (before['session:eth_signTypedData_v4'] ?? 0), 0);
        assert.equal((demo.counts['relay:eth_sendTransaction'] ?? 0) - (before['relay:eth_sendTransaction'] ?? 0), setup ? 1 : 0, 'approved setup survives; cancelled operation must not submit');
      } finally { release(); await page.unroute('**/rpc', handler); }
    });
  }
  assert.deepEqual(errors, []); assert.deepEqual(externalRequests, []);
} catch (error) {
  results.push({ name: 'extension integration failure', status: 'FAIL', error: error.message });
  if (page && !page.isClosed()) {
    await page.screenshot({ path: new URL('extension-failure.png', directory).pathname, fullPage: true });
    console.error('Status:', await page.locator('#live-status').textContent());
  }
  throw error;
} finally {
  await writeFile(new URL('browser-extension-results.json', directory), JSON.stringify({ profile: 'efs-lab/1', c0Conformance: false,
    generatedAt: new Date().toISOString(), browser: browser?.version(), results, errors, externalRequests, providerCounts: counts() }, null, 2) + '\n');
  await context?.close(); await browser?.close(); await demo.close();
}
