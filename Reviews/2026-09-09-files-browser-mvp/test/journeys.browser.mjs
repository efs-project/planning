// The everyday browser journeys against real local v2 contracts, driven in
// actual Chromium through the shared SDK — the automated counterpart of the
// owner walkthrough rows. Guest wallet-freedom is asserted with a throwing
// window.ethereum; approvals are the counted simulated local-signer dialogs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from '../scripts/environment.mjs';

const PNG_1PX = Buffer.from('89504e470d0a1a0a0000000d494844520000000100000001080600000' +
  '01f15c4890000000d4944415478da63fcffff3f0300050201cfcfe2f10000000049454e44ae426082', 'hex');

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
async function approveConsent(page) {
  await page.waitForSelector('#consent[open]');
  await page.click('#consent-approve');
}
async function fillPrompt(page, name, textValue) {
  await page.waitForSelector('#prompt-dialog[open]');
  if (!(await page.$eval('#prompt-input', e => e.readOnly))) await page.fill('#prompt-input', name);
  if (textValue !== undefined) await page.fill('#prompt-text', textValue);
  await page.click('#prompt-ok');
}
async function signIn(page, who) { await page.selectOption('#signer', who); }
async function waitToast(page, includes) {
  await page.waitForFunction(t => document.getElementById('status').textContent.includes(t), includes, { timeout: 90000 });
}

test('everyday loop in real Chromium: browse, create, edit, organize, explain, upgrade', { timeout: 900000 }, async () => {
  compileUpgrade(); compileRouter();
  const browser = await chromium.launch({ headless: true, ...(process.env.EFS_LAB_CHROMIUM ? { executablePath: process.env.EFS_LAB_CHROMIUM } : {}) });
  try {
    await withUpgrade(async lab => {
      const { server, auth } = await startEnvironment(lab, { write: true });
      const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
      await context.addInitScript(() => { window.walletTouches = 0; Object.defineProperty(window, 'ethereum', { get() { window.walletTouches++; throw Error('wallet touched'); } }); });
      const errors = [];
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(e.message));

      // 1. Guest browse with breadcrumbs, zero wallet touches, zero prompts.
      await page.goto(server.url); await settle(page);
      assert.deepEqual(await rows(page), ['kept.txt', 'note.txt', 'photos/']);
      await clickRowAction(page, 'photos', 'Open'); await settle(page);
      assert.deepEqual(await rows(page), ['draft.txt', 'pixel.png']);
      assert.equal(await page.textContent('#crumbs'), 'trip / photos');
      await page.click('#crumbs .crumb'); await settle(page);
      assert.deepEqual(await rows(page), ['kept.txt', 'note.txt', 'photos/']);
      assert.equal(await page.evaluate(() => window.walletTouches), 0, 'guest touched no wallet');
      assert.equal(await page.textContent('#prompts'), '0 approvals');

      // 2. Guest opens verified content + an old revision; unavailable bytes are honest.
      await clickRowAction(page, 'note.txt', 'Open');
      await page.waitForSelector('#file-panel[open]');
      await page.waitForFunction(() => document.querySelector('#file-body .note-view')?.textContent.length > 0);
      assert.match(await page.textContent('#file-body .note-view'), /trip edited note/);
      assert.match(await page.textContent('#file-body'), /integrity VERIFIED/);
      await page.click('#file-body button:has-text("Open this revision")');
      await page.waitForFunction(() => document.querySelectorAll('#file-body .note-view').length === 2);
      assert.match((await page.$$eval('#file-body .note-view', els => els.map(e => e.textContent))).join('|'), /trip original note/);
      await page.click('#close-file');
      await clickRowAction(page, 'photos', 'Open'); await settle(page);
      await clickRowAction(page, 'pixel.png', 'Open');
      await page.waitForSelector('#file-panel[open]');
      await waitPanel(page, 'not currently available');
      await page.click('#close-file');
      await page.click('#crumbs .crumb'); await settle(page);

      // 3. Author A creates a folder and a note; ONE approval each — the note's
      //    byte staging is covered by the same author-signed intent.
      await signIn(page, 'A');
      const create = page.click('#new-folder');
      await fillPrompt(page, 'journeys');
      await approveConsent(page); await create;
      await waitToast(page, 'Folder created. Committed and read back');
      await settle(page);
      assert((await rows(page)).includes('journeys/'), 'journeys/ listed after read-back');
      await clickRowAction(page, 'journeys', 'Open'); await settle(page);
      const note = page.click('#new-note');
      await fillPrompt(page, 'diary.md', 'first entry');
      await approveConsent(page); // the ONLY approval: intent covers records + bytes
      await note;
      await waitToast(page, 'Note created with verified bytes');
      await settle(page);
      assert.equal(await page.textContent('#prompts'), '2 approvals');

      // 4. Reload in a FRESH context: same data, same IDs (no browser cache).
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      await page2.goto(server.url); await settle(page2);
      await clickRowAction(page2, 'journeys', 'Open'); await settle(page2);
      assert.deepEqual(await rows(page2), ['diary.md']);
      await context2.close();

      // 5. Edit with draft-preserving stale handling.
      await clickRowAction(page, 'diary.md', 'Open');
      await page.waitForSelector('#file-panel[open]');
      await page.waitForSelector('#file-body button:has-text("Edit note")');
      const edit = page.click('#file-body button:has-text("Edit note")');
      await fillPrompt(page, 'diary.md', 'first entry, edited');
      await approveConsent(page); // one approval covers the edit and its bytes
      await edit;
      await waitToast(page, 'Edited; new revision verified');
      await settle(page);

      // 5b. An ordinary file BEYOND 16 KiB: one approval, multiple staged
      //     chunks, verified read-back and display.
      const bigText = 'The quick brown fox jumps over the lazy dog. '.repeat(500); // 22,500 bytes -> 6 chunks
      const big = page.click('#new-note');
      await fillPrompt(page, 'large.md', bigText);
      await approveConsent(page); await big;
      await waitToast(page, 'Note created with verified bytes'); await settle(page);
      await clickRowAction(page, 'large.md', 'Open');
      await page.waitForSelector('#file-panel[open]');
      await page.waitForFunction(n => (document.querySelector('#file-body .note-view')?.textContent.length ?? 0) === n, bigText.length);
      assert.match(await page.textContent('#file-body'), /integrity VERIFIED/);
      await page.click('#close-file');

      // 6. Rename keeps identity; explain shows the unchanged File Object.
      const before = await idOf(page, 'diary.md');
      const rename = clickRowAction(page, 'diary.md', 'Rename');
      await fillPrompt(page, 'journal.md');
      await approveConsent(page); await rename;
      await waitToast(page, 'Renamed. The file identity did not change');
      await settle(page);
      assert.equal(await idOf(page, 'journal.md'), before, 'stable identity across rename');

      // 7. Copy vs placement.
      const copy = clickRowAction(page, 'journal.md', 'Copy');
      await fillPrompt(page, 'journal-copy.md');
      await approveConsent(page); await copy;
      await waitToast(page, 'Copied as a new file'); await settle(page);
      assert.notEqual(await idOf(page, 'journal-copy.md'), before, 'copy has a NEW identity');
      const link = clickRowAction(page, 'journal.md', 'Link');
      await fillPrompt(page, 'journal-link.md');
      await approveConsent(page); await link;
      await waitToast(page, 'Placement added'); await settle(page);
      assert.equal(await idOf(page, 'journal-link.md'), before, 'placement has the SAME identity');

      // 8. Remove one placement -> Removed items -> restore-as (collision path).
      const remove = clickRowAction(page, 'journal.md', 'Remove');
      await approveConsent(page); await remove;
      await waitToast(page, 'Removed from this folder (not erased)'); await settle(page);
      assert(!(await rows(page)).includes('journal.md'));
      assert((await rows(page)).includes('journal-link.md'), 'other placement survives');
      await page.click('#trash summary');
      const restore = page.click('#trash-rows button:has-text("Restore")');
      await approveConsent(page); await restore;
      await waitToast(page, 'Restored'); await settle(page);
      assert((await rows(page)).includes('journal.md'));

      // 9. Tags: A tags; the filter narrows honestly; untag withdraws only A's.
      await clickRowAction(page, 'journal.md', 'Open');
      await page.waitForSelector('#file-panel[open]');
      const tag = page.click('#file-body button:has-text("Add tag")');
      await fillPrompt(page, 'ocean');
      await approveConsent(page); await tag;
      await waitToast(page, 'Tagged'); await settle(page);
      await page.fill('#tag-filter', 'ocean');
      await page.dispatchEvent('#tag-filter', 'change');
      // the tag is on the File OBJECT: both placements of it stay visible
      await page.waitForFunction(() => document.querySelectorAll('#rows li').length === 2);
      assert.deepEqual(await rows(page), ['journal-link.md', 'journal.md']);
      assert.match(await page.textContent('#status'), /hidden by filters/);
      await page.fill('#tag-filter', '');
      await page.dispatchEvent('#tag-filter', 'change');
      await settle(page);

      // 10. Upload an image; verified preview renders from a blob URL.
      await page.setInputFiles('#upload', { name: 'dot.png', mimeType: 'image/png', buffer: PNG_1PX });
      await approveConsent(page); // one approval covers the record and its bytes
      await waitToast(page, 'Image uploaded with verified bytes'); await settle(page);
      await clickRowAction(page, 'dot.png', 'Open');
      await page.waitForSelector('#file-panel img.preview');
      await page.click('#close-file');

      // 11. Export the folder, then INDEPENDENTLY verify the downloaded
      //     bundle offline with the clean-reader CLI (a separate process,
      //     no RPC): the authenticated-export round trip, end to end.
      const downloadPromise = page.waitForEvent('download');
      await page.click('#export');
      const download = await downloadPromise;
      const bundlePath = await download.path();
      const bundle = JSON.parse(await (await import('node:fs/promises')).readFile(bundlePath, 'utf8'));
      assert.equal(bundle.kind, 'EFS_FILES_EXPORT_V1');
      const journal = bundle.selection.find(r => r.name === 'journal.md');
      assert.equal(journal?.integrity, 'VERIFIED');
      assert(bundle.records[journal.revisionRecordId], 'revision record retained');
      assert(bundle.evidence.length > 0, 'raw transcript retained');
      const { execFileSync } = await import('node:child_process');
      const verdict = execFileSync(process.execPath, [new URL('../scripts/verify-export.mjs', import.meta.url).pathname, bundlePath], { encoding: 'utf8' });
      assert.match(verdict, /OFFLINE verification complete relative to the DECLARED anchor/);
      assert.match(verdict, /DirectoryEntry chain runs mount root/, 'subfolder export authenticates its path');
      assert.match(verdict, /0 failed/);

      // 12. Upgrade the POPULATED contracts in place; same addresses, data survives,
      //     old citations readable, and a new write succeeds at revision 3.
      const upgraded = await auth.upgradeAgain();
      assert.equal(upgraded.receipt.status, '0x1');
      await page.click('#refresh'); await settle(page);
      assert((await rows(page)).includes('journal.md'), 'data survives the upgrade');
      assert.match(await page.textContent('#basis'), /host revision 3/);
      const post = page.click('#new-note');
      await fillPrompt(page, 'after-upgrade.md', 'written at revision 3');
      await approveConsent(page); await post;
      await waitToast(page, 'Note created with verified bytes'); await settle(page);
      assert((await rows(page)).includes('after-upgrade.md'));

      assert.deepEqual(errors, [], 'zero page errors');
      assert.equal(await page.evaluate(() => window.walletTouches), 0, 'no wallet discovery ever');
      await context.close();
      await server.close();
    }, { profile: 'reads', watchdogMs: 900000 });
  } finally { await browser.close(); }
});
async function idOf(page, name) {
  const items = await page.$$('#rows li');
  for (const li of items) {
    const title = await li.$eval('.row-title', e => e.textContent);
    if (title === name) return JSON.parse(await li.getAttribute('data-result')).value.nodeId;
  }
  assert.fail('row not found: ' + name);
}
async function waitPanel(page, includes) {
  await page.waitForFunction(t => document.getElementById('file-body').textContent.includes(t), includes, { timeout: 60000 });
}
