// Actual Chromium + canonical local-chain reads. These fail if URL state skips
// root ancestry, download accepts partial bytes, or copy/alias/restore semantics
// are implemented as labels without the corresponding File/revision effects.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from '../scripts/environment.mjs';
import { createFixtureReader, openFile, openRevisions } from '../../2026-09-09-files-reader/index.mjs';

async function settled(page) { await page.waitForSelector('main[data-state="settled"]', { timeout: 60000 }); }
async function row(page, name) {
  const rows = page.locator('#rows > li');
  for (let i = 0; i < await rows.count(); i++) {
    const item = rows.nth(i), title = await item.locator('.row-title').textContent();
    if (title === name || title === name + '/') return item;
  }
  assert.fail('missing current row ' + name);
}
async function action(page, name, label) { await (await row(page, name)).getByRole('button', { name: label + ': ' + name, exact: true }).click(); }
async function id(page, name) { return JSON.parse(await (await row(page, name)).getAttribute('data-result')).value.nodeId; }
async function fill(page, name, body) {
  await page.waitForSelector('#prompt-dialog[open]');
  if (!await page.$eval('#prompt-input', e => e.readOnly)) await page.fill('#prompt-input', name);
  if (body !== undefined) await page.fill('#prompt-text', body);
  await page.click('#prompt-ok');
}
async function approve(page) { await page.waitForSelector('#consent[open]'); await page.click('#consent-approve'); }
async function saved(page, message) {
  await page.waitForFunction(s => document.querySelector('#status').textContent.includes(s), message, { timeout: 90000 });
  await settled(page);
}
async function panel(page, expected) {
  await page.waitForSelector('#file-panel[open]');
  await page.waitForFunction(s => document.querySelector('#file-body').textContent.includes(s), expected, { timeout: 30000 });
}
async function download(page, selector = '#file-body .content') {
  const pending = page.waitForEvent('download');
  await page.locator(selector).first().getByRole('button', { name: 'Download verified file', exact: true }).click();
  const file = await pending;
  return { bytes: await readFile(await file.path()), filename: file.suggestedFilename() };
}
async function fresh(lab, config, fileId, revisionId) {
  const reader = createFixtureReader({ source: { identity: config.expected.source, epoch: 1, request: (m, p, { maxBytes } = {}) => lab.rpc(m, p, maxBytes ? { maxBytes } : {}) }, context: { expected: config.expected } });
  const opened = await reader.open({ blockTag: 'latest' }); assert.equal(opened.status, 'READY', opened.reason);
  try { return await openFile(opened.scope, { mountId: config.mounts.aFirst, fileId, ...(revisionId ? { revisionId } : {}) }); }
  finally { opened.scope.close(); }
}
let compiled = false;
async function world(run) {
  if (!compiled) { compileUpgrade(); compileRouter(); compiled = true; }
  const browser = await chromium.launch({ headless: true });
  try { await withUpgrade(async lab => {
    const env = await startEnvironment(lab, { write: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
    await context.addInitScript(() => { window.walletTouches = 0; Object.defineProperty(window, 'ethereum', { get() { window.walletTouches++; throw Error('guest touched wallet'); } }); });
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(30000); page.on('pageerror', e => errors.push(e.message));
    try { await run({ lab, ...env, page }); assert.deepEqual(errors, []); assert.equal(await page.evaluate(() => window.walletTouches), 0); }
    catch (error) { console.error(await page.evaluate(() => ({ url: location.href, status: document.querySelector('#status')?.textContent, problem: document.querySelector('#op-status')?.textContent, panel: document.querySelector('#file-body')?.textContent }))); throw error; }
    finally { await context.close(); await env.server.close(); }
  }, { profile: 'reads', watchdogMs: 900000 }); } finally { await browser.close(); }
}

test('guest root-qualified hash routes survive nested/history reload and back/forward; stale routes refuse', { timeout: 900000 }, async () => world(async ({ page, server }) => {
  await page.goto(server.url); await settled(page);
  await action(page, 'photos', 'Open'); await settled(page);
  assert.equal(new URL(page.url()).hash, '#/files/v1/aFirst/photos');
  await page.reload(); await settled(page);
  assert.equal(await page.textContent('#crumbs'), 'trip / photos');
  await page.goBack(); await settled(page); assert.equal(await page.textContent('#crumbs'), 'trip');
  await page.goForward(); await settled(page); assert.equal(await page.textContent('#crumbs'), 'trip / photos');
  await action(page, 'pixel.png', 'Open'); await panel(page, 'not currently available');
  assert.equal(await page.getByRole('button', { name: 'Download verified file', exact: true }).count(), 0, 'unavailable bytes cannot download');
  await page.click('#close-file'); await settled(page); await page.click('#crumbs .crumb'); await settled(page);
  await action(page, 'note.txt', 'Open'); await panel(page, 'trip edited note');
  const currentURL = page.url();
  await page.getByRole('button', { name: 'Open this revision', exact: true }).click(); await panel(page, 'trip original note');
  const oldURL = page.url(); assert.match(oldURL, /revisionId=0x[0-9a-f]{64}/);
  assert.match(await page.textContent('#file-body'), /Versions/); assert.match(await page.textContent('#file-body'), /Name history/);
  await page.reload(); await settled(page); await panel(page, 'trip original note');
  await page.goBack(); await panel(page, 'trip edited note'); assert.equal(page.url(), currentURL);
  assert.equal(await page.getByRole('button', { name: 'Back to current', exact: true }).count(), 0);
  await page.goForward(); await panel(page, 'trip original note'); assert.equal(page.url(), oldURL);
  await page.getByRole('button', { name: 'Back to current', exact: true }).click(); await panel(page, 'trip edited note');
  await page.goto(server.url + '#/files/v1/aFirst/photos?fileId=' + '0x' + '11'.repeat(32)); await settled(page);
  assert.match(await page.textContent('#op-status'), /No longer here/); assert.equal(await page.locator('#file-panel[open]').count(), 0);
  await page.goto(server.url + '#/files/v1/aFirst/%2e%2e/note.txt'); await settled(page);
  assert.match(await page.textContent('#op-status'), /invalid path segment/);
}));

test('general binary/empty/hostile uploads download only exact verified bytes and remain inert after reload', { timeout: 900000 }, async () => world(async ({ page, server, lab, config }) => {
  await page.goto(server.url); await settled(page); await page.selectOption('#signer', 'A');
  await action(page, 'photos', 'Open'); await settled(page);
  const binary = Buffer.from(Array.from({ length: 9001 }, (_, i) => (i * 73 + 19) % 256));
  for (const [name, mimeType, bytes] of [
    ['sample.bin', 'application/octet-stream', binary], ['empty.bin', 'application/octet-stream', Buffer.alloc(0)],
    ['hostile.html', 'text/html', Buffer.from('<script>window.hostileRan=true</script><img src=x onerror="window.hostileRan=true">')],
  ]) {
    await page.setInputFiles('#upload', { name, mimeType, buffer: bytes }); await approve(page); await saved(page, 'File uploaded with verified bytes');
    const fileId = await id(page, name), checked = await fresh(lab, config, fileId);
    assert.equal(checked.value.integrity, 'VERIFIED'); assert.equal(checked.value.bytes, '0x' + bytes.toString('hex'));
    await action(page, name, 'Open'); await panel(page, 'integrity VERIFIED');
    assert.deepEqual((await download(page)).bytes, bytes); assert.equal((await download(page)).filename, name);
    if (name === 'hostile.html') { assert.equal(await page.locator('#file-body iframe, #file-body script, #file-body img').count(), 0); assert.equal(await page.evaluate(() => window.hostileRan), undefined); }
    const url = page.url(); await page.reload(); await settled(page); await panel(page, 'integrity VERIFIED'); assert.equal(page.url(), url);
    assert.deepEqual((await download(page)).bytes, bytes); await page.click('#close-file'); await settled(page); await page.selectOption('#signer', 'A');
  }
}));

test('independent copy and shared name retain real identities; historical restore authors a new current revision', { timeout: 900000 }, async () => world(async ({ page, server, lab, config }) => {
  await page.goto(server.url); await settled(page); await page.selectOption('#signer', 'A');
  await page.click('#new-folder'); await fill(page, 'journey'); await approve(page); await saved(page, 'Folder created.');
  await action(page, 'journey', 'Open'); await settled(page);
  await page.click('#new-note'); await fill(page, 'original.txt', 'version one'); await approve(page); await saved(page, 'Note created with verified bytes');
  const originalId = await id(page, 'original.txt'), old = await fresh(lab, config, originalId);
  await action(page, 'original.txt', 'Make independent copy'); await fill(page, 'copy.txt'); await approve(page); await saved(page, 'Copied as a new file');
  const copyId = await id(page, 'copy.txt'); assert.notEqual(copyId, originalId);
  await action(page, 'original.txt', 'Add another name'); await fill(page, 'alias.txt'); await approve(page); await saved(page, 'Placement added'); assert.equal(await id(page, 'alias.txt'), originalId);
  await action(page, 'original.txt', 'Open'); await panel(page, 'version one'); const staleURL = page.url();
  await page.getByRole('button', { name: 'Edit note', exact: true }).click(); await fill(page, 'original.txt', 'version two'); await approve(page); await saved(page, 'Edited; new revision verified');
  const edited = await fresh(lab, config, originalId); assert.notEqual(edited.value.revisionId, old.value.revisionId);
  await page.reload(); await settled(page); await page.selectOption('#signer', 'A');
  await action(page, 'alias.txt', 'Open'); await panel(page, 'version two'); assert.equal(await id(page, 'alias.txt'), originalId); await page.click('#close-file'); await settled(page);
  await action(page, 'copy.txt', 'Open'); await panel(page, 'version one'); await page.click('#close-file'); await settled(page);
  assert.equal((await fresh(lab, config, copyId)).value.bytes, '0x' + Buffer.from('version one').toString('hex'));
  await action(page, 'original.txt', 'Remove'); await approve(page); await saved(page, 'Removed from this folder'); assert.equal(await id(page, 'alias.txt'), originalId);
  await action(page, 'alias.txt', 'Open'); await panel(page, 'version two');
  await page.getByRole('button', { name: 'Open this revision', exact: true }).click(); await panel(page, 'version one');
  await page.getByRole('button', { name: 'Restore as new current version', exact: true }).click(); await approve(page); await saved(page, 'Restored as a new current version');
  const restored = await fresh(lab, config, originalId);
  assert.equal(restored.value.bytes, old.value.bytes); assert.notEqual(restored.value.revisionId, old.value.revisionId); assert.notEqual(restored.value.revisionId, edited.value.revisionId);
  assert.equal((await fresh(lab, config, originalId, old.value.revisionId)).value.bytes, old.value.bytes);
  assert.equal((await fresh(lab, config, originalId, edited.value.revisionId)).value.bytes, edited.value.bytes);
  const reader = createFixtureReader({ source: { identity: config.expected.source, epoch: 1, request: (m, p, { maxBytes } = {}) => lab.rpc(m, p, maxBytes ? { maxBytes } : {}) }, context: { expected: config.expected } });
  const opened = await reader.open({ blockTag: 'latest' });
  try { const versions = await openRevisions(opened.scope, { mountId: config.mounts.aFirst, fileId: originalId }); assert.equal(versions.value.revisions.filter(r => r.revisionId).length, 3); }
  finally { opened.scope.close(); }
  await page.goto(staleURL); await settled(page); assert.match(await page.textContent('#op-status'), /No longer here/); assert.equal(await page.locator('#file-panel[open]').count(), 0);
  await page.goto(server.url + '#/files/v1/aFirst/journey'); await settled(page); await page.selectOption('#signer', 'A');
  await action(page, 'alias.txt', 'Open'); await panel(page, 'version one'); const renamedURL = page.url(); await page.click('#close-file'); await settled(page);
  await action(page, 'alias.txt', 'Rename'); await fill(page, 'renamed.txt'); await approve(page); await saved(page, 'Renamed.');
  assert.equal(await id(page, 'renamed.txt'), originalId);
  await page.evaluate(hash => { location.hash = hash; }, new URL(renamedURL).hash); await page.waitForFunction(() => !document.querySelector('#op-status').hidden && document.querySelector('#op-status').textContent.includes('“alias.txt”'));
  assert.equal(await page.$eval('#toolbar', e => e.hidden), true, 'a refused path must not leave mutation controls targeting a stale folder');
  await page.goto(server.url + '#/files/v1/aFirst/journey'); await settled(page); await page.selectOption('#signer', 'A');
  await page.click('#new-note'); await fill(page, 'alias.txt', 'replacement identity'); await approve(page); await saved(page, 'Note created with verified bytes');
  assert.notEqual(await id(page, 'alias.txt'), originalId);
  await page.goto(renamedURL); await settled(page); assert.match(await page.textContent('#op-status'), /No longer here/); assert.equal(await page.locator('#file-panel[open]').count(), 0, 'a rebound name cannot open replacement bytes for the old File ID');
}));

test('hash navigation during approval keeps the signed folder and resolves after success or cancellation', { timeout: 900000 }, async () => world(async ({ page, server, lab, config }) => {
  await page.goto(server.url); await settled(page); await page.selectOption('#signer', 'A'); await action(page, 'photos', 'Open'); await settled(page);
  await page.click('#new-note'); await fill(page, 'captured.txt', 'original folder'); await page.waitForSelector('#consent[open]');
  await page.evaluate(() => { location.hash = '#/files/v1/aFirst'; }); await approve(page); await saved(page, 'Note created with verified bytes');
  assert.equal(await page.textContent('#crumbs'), 'trip');
  assert.equal(await page.locator('#rows .row-title').filter({ hasText: /^captured.txt$/ }).count(), 0);
  await action(page, 'photos', 'Open'); await settled(page); const fileId = await id(page, 'captured.txt');
  assert.equal((await fresh(lab, config, fileId)).value.bytes, '0x' + Buffer.from('original folder').toString('hex'));
  const recorded = await page.evaluate(() => JSON.parse(localStorage.getItem('efs-files-recovery-v1')).actions.find(a => a.label.includes('captured.txt')));
  assert.equal(recorded.context.lensId, 'aFirst'); assert.equal(recorded.effect, 'COMMITTED'); assert.equal(recorded.bytes, 'VERIFIED');
  await page.click('#new-folder'); await fill(page, 'cancelled'); await page.waitForSelector('#consent[open]');
  await page.evaluate(() => { location.hash = '#/files/v1/aFirst'; }); await page.click('#consent-cancel');
  await page.waitForFunction(() => !document.querySelector('main').dataset.writing); await settled(page);
  assert.equal(await page.textContent('#crumbs'), 'trip', 'cancelled authorization still honors the requested next navigation');
  const otherId = await id(page, 'note.txt'), otherHash = '#/files/v1/aFirst/note.txt?fileId=' + otherId;
  await action(page, 'photos', 'Open'); await settled(page); await action(page, 'captured.txt', 'Open'); await panel(page, 'original folder');
  await page.getByRole('button', { name: 'Edit note', exact: true }).click(); await fill(page, 'captured.txt', 'edited original folder'); await page.waitForSelector('#consent[open]');
  await page.evaluate(hash => { location.hash = hash; }, otherHash); await approve(page); await saved(page, 'Edited; new revision verified');
  assert.equal(new URL(page.url()).hash, otherHash, 'edit must not close the newly requested File route'); await panel(page, 'trip edited note');
  assert.equal((await fresh(lab, config, fileId)).value.bytes, '0x' + Buffer.from('edited original folder').toString('hex'));
  await page.click('#close-file'); await settled(page); await action(page, 'photos', 'Open'); await settled(page); await action(page, 'captured.txt', 'Open'); await panel(page, 'edited original folder');
  await page.getByRole('button', { name: 'Open this revision', exact: true }).click(); await panel(page, 'selected historical version');
  await page.getByRole('button', { name: 'Restore as new current version', exact: true }).click(); await page.waitForSelector('#consent[open]');
  await page.evaluate(hash => { location.hash = hash; }, otherHash); await approve(page); await saved(page, 'Restored as a new current version');
  assert.equal(new URL(page.url()).hash, otherHash, 'restore must not close the newly requested File route'); await panel(page, 'trip edited note');
  assert.equal((await fresh(lab, config, fileId)).value.bytes, '0x' + Buffer.from('original folder').toString('hex'));
}));
