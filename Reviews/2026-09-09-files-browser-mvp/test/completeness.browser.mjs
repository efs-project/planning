// Browser-side completeness honesty: a PARTIAL listing must never be
// exportable as a folder copy. The export control appears only once the
// enumeration is COMPLETE, and the exported bundle says so. Companion to
// test/completeness-regressions.test.mjs (the reader-boundary half).
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from '../scripts/environment.mjs';

async function settle(page) { await page.waitForSelector('main[data-state="settled"]', { timeout: 60000 }); }

test('a partial listing cannot masquerade as a complete folder copy', { timeout: 900000 }, async () => {
  compileUpgrade(); compileRouter();
  const browser = await chromium.launch({ headless: true, ...(process.env.EFS_LAB_CHROMIUM ? { executablePath: process.env.EFS_LAB_CHROMIUM } : {}) });
  try {
    await withUpgrade(async lab => {
      const { f, auth, config, server } = await startEnvironment(lab, { write: true });
      // A folder larger than one page (app page size 32).
      const mountId = config.mounts.aFirst;
      const folder = await auth.execute({ kind: 'createDir', mountId, parent: f.root, name: 'many', principal: auth.A });
      for (let i = 0; i < 40; i++) {
        await auth.execute({ kind: 'createDir', mountId, parent: folder.plan.predicted.objectId, name: 'c' + String(i).padStart(2, '0'), principal: auth.A });
      }
      const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(server.url); await settle(page);
      await page.selectOption('#signer', 'A');
      // Navigate into many/.
      const items = await page.$$('#rows li');
      for (const li of items) {
        if ((await li.$eval('.row-title', e => e.textContent)) === 'many/') { await (await li.$('button:has-text("Open")')).click(); break; }
      }
      await settle(page);

      // First page: PARTIAL — the copy control must NOT be offered.
      assert.equal(await page.textContent('#coverage'), 'Partial listing');
      assert.equal(await page.$$eval('#rows li', els => els.length), 32, 'one page of rows');
      assert(await page.$eval('#export', e => e.hidden), 'export hidden while the listing is partial');
      assert(!(await page.$eval('#more', e => e.hidden)), 'More is offered instead');

      // Load the rest: COMPLETE — now the copy control appears and the
      // bundle itself carries the COMPLETE claim.
      await page.click('#more'); await settle(page);
      assert.equal(await page.textContent('#coverage'), 'Listing complete');
      assert.equal(await page.$$eval('#rows li', els => els.length), 40, 'all rows visible');
      assert(!(await page.$eval('#export', e => e.hidden)), 'export offered once COMPLETE');
      const downloadPromise = page.waitForEvent('download');
      await page.click('#export');
      const download = await downloadPromise;
      const bundle = JSON.parse(await (await import('node:fs/promises')).readFile(await download.path(), 'utf8'));
      assert.equal(bundle.kind, 'EFS_FILES_EXPORT_V1');
      assert.equal(bundle.coverage.listing, 'COMPLETE');
      assert.equal(bundle.selection.length, 40);

      assert.deepEqual(errors, [], 'zero page errors');
      await context.close();
      await server.close();
    }, { profile: 'reads', watchdogMs: 900000 });
  } finally { await browser.close(); }
});
