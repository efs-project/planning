// Ergonomic UX pass in real Chromium: phone-width reachability, keyboard-only
// operation, 200% text, dialog focus restoration and honest state copy.
// EFS_BROWSER_EVIDENCE=1 exports screenshots to evidence/browser/ (exclusive).
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from '../scripts/environment.mjs';

const exporting = process.env.EFS_BROWSER_EVIDENCE === '1';
const evidenceDir = new URL('../evidence/browser/', import.meta.url);
async function settle(page) { await page.waitForSelector('main[data-state="settled"]', { timeout: 60000 }); }
async function shot(page, name) { if (exporting) await page.screenshot({ path: new URL(name + '.png', evidenceDir).pathname, fullPage: false }); }
const focused = page => page.evaluate(() => document.activeElement?.id || document.activeElement?.textContent?.slice(0, 24) || 'body');

test('phone, keyboard, 200% text and focus behavior', { timeout: 600000 }, async () => {
  compileUpgrade(); compileRouter();
  if (exporting) { if (existsSync(evidenceDir)) throw Error('evidence/browser already exists; refusing to overwrite'); await mkdir(evidenceDir, { recursive: true }); }
  const browser = await chromium.launch({ headless: true, ...(process.env.EFS_LAB_CHROMIUM ? { executablePath: process.env.EFS_LAB_CHROMIUM } : {}) });
  try {
    await withUpgrade(async lab => {
      const { server } = await startEnvironment(lab, { write: true });

      // ---- phone width: everything reachable, no horizontal scroll --------
      const phone = await browser.newContext({ viewport: { width: 320, height: 640 } });
      const p = await phone.newPage();
      await p.goto(server.url); await settle(p);
      const overflowX = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(overflowX <= 1, 'no horizontal scroll at 320px (overflow ' + overflowX + 'px)');
      // Why? reachable and its dialog fits
      await p.click('#rows li button.why-button');
      await p.waitForSelector('#why[open]');
      const whyBox = await p.$eval('#why', d => { const r = d.getBoundingClientRect(); return { w: r.width, x: r.x }; });
      assert(whyBox.w <= 320 && whyBox.x >= 0, 'Why drawer fits the phone viewport');
      await shot(p, 'phone-why');
      await p.keyboard.press('Escape');
      // file panel reachable at 320px
      const items = await p.$$('#rows li');
      for (const li of items) { const t = await li.$eval('.row-title', e => e.textContent); if (t === 'note.txt') { await (await li.$('button:has-text("Open")')).click(); break; } }
      await p.waitForSelector('#file-panel[open]');
      await p.waitForFunction(() => document.querySelector('#file-body .note-view'));
      await shot(p, 'phone-file');
      await p.click('#close-file');
      await shot(p, 'phone-listing');
      await phone.close();

      // ---- desktop: keyboard-only flow, focus restoration, 200% text ------
      const desk = await browser.newContext({ viewport: { width: 1280, height: 960 } });
      const page = await desk.newPage();
      await page.goto(server.url); await settle(page);
      await shot(page, 'desktop-guest');

      // Escape from Why restores the opener button.
      const whyButton = await page.$('#rows li button.why-button');
      await whyButton.focus(); await page.keyboard.press('Enter');
      await page.waitForSelector('#why[open]');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.getElementById('why').open);
      assert.equal(await page.evaluate(() => document.activeElement?.className), 'why-button', 'Escape restores focus to the opener');

      // Keyboard-only: sign in, create a folder, approve — no mouse.
      await page.focus('#signer');
      await page.selectOption('#signer', 'A');
      await page.focus('#new-folder'); await page.keyboard.press('Enter');
      await page.waitForSelector('#prompt-dialog[open]');
      assert.equal(await focused(page), 'prompt-input', 'name field focused on open');
      await page.keyboard.type('kbd-folder'); await page.keyboard.press('Enter');
      await page.waitForSelector('#consent[open]');
      await shot(page, 'desktop-consent');
      // dialog is native: Tab cycles within; Enter on the approve button submits
      await page.focus('#consent-approve'); await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.getElementById('status').textContent.includes('Folder created'), null, { timeout: 90000 });
      await settle(page);
      assert((await page.$$eval('#rows li .row-title', els => els.map(e => e.textContent))).includes('kbd-folder/'), 'keyboard-only create landed');
      assert.equal(await page.textContent('#prompts'), '1 approval', 'approval counted');

      // Cancel path: Escape before approving has no effect and says so.
      await page.focus('#new-folder'); await page.keyboard.press('Enter');
      await page.waitForSelector('#prompt-dialog[open]');
      await page.keyboard.type('never-created'); await page.keyboard.press('Enter');
      await page.waitForSelector('#consent[open]');
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.getElementById('status').textContent.includes('Cancelled before submission'));
      assert.equal(await page.textContent('#prompts'), '1 approval', 'cancel is not an approval');
      await settle(page);
      assert(!(await page.$$eval('#rows li .row-title', els => els.map(e => e.textContent))).includes('never-created/'), 'cancel had no semantic effect');

      // 200% text: controls stay visible and unclipped.
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      await settle(page);
      const clipped = await page.evaluate(() => {
        const ids = ['refresh', 'lens', 'coverage', 'status', 'signer', 'prompts'];
        return ids.filter(id => { const e = document.getElementById(id); if (!e) return true; const r = e.getBoundingClientRect(); return r.width === 0 || r.height === 0; });
      });
      assert.deepEqual(clipped, [], 'core controls visible at 200% text');
      const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(overflow2 <= 1, 'no horizontal scroll at 200% text');
      await shot(page, 'desktop-200pct');

      await desk.close();
      await server.close();
    }, { profile: 'reads', watchdogMs: 600000 });
  } finally { await browser.close(); }
});
