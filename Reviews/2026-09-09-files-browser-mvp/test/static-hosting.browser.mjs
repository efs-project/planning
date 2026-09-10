// Standalone static hosting: the exported browser served by a GENERIC file
// server, talking to an explicitly configured JSON-RPC endpoint directly.
// Asserts the everyday read AND one-approval write journeys work with ZERO
// EFS-specific server endpoints in existence, and that every network request
// goes only to the static origin or the configured RPC endpoint.
process.env.EFS_LAB_ANVIL_CORS = '1'; // before withUpgrade spawns the node
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from '../scripts/environment.mjs';
import { exportStatic } from '../scripts/export-static.mjs';
import { startStaticServer } from '../scripts/static-server.mjs';

async function settle(page) { await page.waitForSelector('main[data-state="settled"]', { timeout: 60000 }); }
async function rows(page) { return page.$$eval('#rows li .row-title', els => els.map(e => e.textContent)); }
async function clickRowAction(page, name, action) {
  const items = await page.$$('#rows li');
  for (const li of items) {
    const title = await li.$eval('.row-title', e => e.textContent);
    if (title === name || title === name + '/') { const b = await li.$(`button:has-text("${action}")`); assert(b, action + ' button on ' + name); await b.click(); return; }
  }
  assert.fail('row not found: ' + name);
}
async function approveConsent(page) { await page.waitForSelector('#consent[open]'); await page.click('#consent-approve'); }
async function fillPrompt(page, name, textValue) {
  await page.waitForSelector('#prompt-dialog[open]');
  if (!(await page.$eval('#prompt-input', e => e.readOnly))) await page.fill('#prompt-input', name);
  if (textValue !== undefined) await page.fill('#prompt-text', textValue);
  await page.click('#prompt-ok');
}
async function waitToast(page, includes) {
  await page.waitForFunction(t => document.getElementById('status').textContent.includes(t), includes, { timeout: 90000 });
}

test('static hosting: generic file server + direct RPC, no EFS endpoints', { timeout: 900000 }, async () => {
  compileUpgrade(); compileRouter();
  const browser = await chromium.launch({ headless: true, ...(process.env.EFS_LAB_CHROMIUM ? { executablePath: process.env.EFS_LAB_CHROMIUM } : {}) });
  const dist = await mkdtemp(join(tmpdir(), 'efs-static-'));
  try {
    await withUpgrade(async lab => {
      // World only — the EFS relay server is NEVER started in this suite.
      const { config, rpcUrl } = await startEnvironment(lab, { write: true, relay: false });
      // A DEFAULT static build is publishable: it must carry no signer keys.
      const safe = await exportStatic({ config, rpcUrl, outDir: dist });
      assert(safe.written.includes('/config.json'), 'config.json exported');
      assert.equal(safe.disposableKeysIncluded, false, 'default build declares no keys');
      const publishedConfig = await (await import('node:fs/promises')).readFile(join(dist, 'config.json'), 'utf8');
      for (const author of Object.values(config.writeConfig.authors)) {
        assert(!publishedConfig.includes(author.key), 'a default static build must never contain a signer private key');
      }
      assert(JSON.parse(publishedConfig).write.authors.A.principal, 'author identities are still published (only keys are withheld)');

      // This suite then exercises the LOCAL write journey, which needs the
      // fixture's disposable keys — an explicit, labeled opt-in.
      const exported = await exportStatic({ config, rpcUrl, outDir: dist, includeDisposableKeys: true });
      assert.equal(exported.disposableKeysIncluded, true);
      const statics = await startStaticServer({ root: dist });

      const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const origins = new Set();
      page.on('request', r => { try { origins.add(new URL(r.url()).origin); } catch {} });

      // Guest reads work from static hosting; the banner names the transport.
      await page.goto(statics.url); await settle(page);
      assert.match(await page.textContent('#delay'), /Standalone static hosting: direct JSON-RPC to http/);
      assert.deepEqual(await rows(page), ['kept.txt', 'note.txt', 'photos/']);
      await clickRowAction(page, 'note.txt', 'Open');
      await page.waitForSelector('#file-panel[open]');
      await page.waitForFunction(() => document.querySelector('#file-body .note-view')?.textContent.length > 0);
      assert.match(await page.textContent('#file-body'), /integrity VERIFIED/);
      await page.click('#close-file');

      // One-approval writes work: signed author intent straight to the chain.
      await page.selectOption('#signer', 'A');
      const create = page.click('#new-folder');
      await fillPrompt(page, 'static-hosted');
      await approveConsent(page); await create;
      await waitToast(page, 'Folder created. Committed and read back'); await settle(page);
      assert((await rows(page)).includes('static-hosted/'));
      await clickRowAction(page, 'static-hosted', 'Open'); await settle(page);
      const note = page.click('#new-note');
      await fillPrompt(page, 'hello.md', 'written through direct RPC from a static page');
      await approveConsent(page); await note;
      await waitToast(page, 'Note created with verified bytes'); await settle(page);
      assert.deepEqual(await rows(page), ['hello.md']);
      assert.equal(await page.textContent('#prompts'), '2 approvals');

      // The page touched ONLY the static origin and the configured RPC origin.
      assert.deepEqual([...origins].sort(), [new URL(rpcUrl).origin, new URL(statics.url).origin].sort(), 'no third origin, no EFS relay');
      assert.deepEqual(errors, [], 'zero page errors');

      await context.close();
      await statics.close();
    }, { profile: 'reads', watchdogMs: 900000 });
  } finally {
    await browser.close();
    await rm(dist, { recursive: true, force: true });
  }
});
