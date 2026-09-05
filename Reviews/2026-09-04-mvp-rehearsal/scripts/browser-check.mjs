import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { startDemo } from './demo.mjs';

const playwrightPath = process.env.EFS_LAB_PLAYWRIGHT;
const { chromium } = await import(playwrightPath ? pathToFileURL(playwrightPath).href : 'playwright');
const demo = await startDemo({ compileFirst: process.env.EFS_LAB_SKIP_BUILD !== '1', lifetimeMs: 180000 });
const results = [], errors = [], requests = [], failedResources = [];
const reportDir = new URL('../artifacts/', import.meta.url);
await mkdir(reportDir, { recursive: true });
let browser, context, page;
const counts = () => ({ ...demo.counts });
const delta = (before, key) => (demo.counts[key] ?? 0) - (before[key] ?? 0);
const check = async (name, action) => { await action(); results.push({ name, status: 'PASS' }); console.log(`PASS ${name}`); };

try {
  browser = await chromium.launch({ headless: true,
    ...(process.env.EFS_LAB_CHROMIUM ? { executablePath: process.env.EFS_LAB_CHROMIUM } : {}) });
  context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  page.on('response', response => { if (response.status() >= 400) failedResources.push({ url: response.url(), status: response.status() }); });
  page.on('requestfailed', request => failedResources.push({ url: request.url(), failure: request.failure() }));
  await check('guest boot and verified file read use zero wallet/relay/session calls', async () => {
    const before = counts();
    await page.goto(demo.origin);
    await page.getByText('welcome.md', { exact: true }).waitFor();
    assert.equal(await page.locator('iframe').count(), 0);
    await page.getByText('welcome.md', { exact: true }).click();
    await page.locator('#preview-body').filter({ hasText: 'These bytes were stored' }).waitFor();
    for (const key of ['wallet:eth_signTypedData_v4', 'wallet:eth_sendTransaction', 'relay:eth_sendTransaction', 'session:eth_signTypedData_v4']) assert.equal(delta(before, key), 0);
    await page.screenshot({ path: new URL('files-desktop.png', reportDir).pathname, fullPage: true });
  });

  async function write(action, name, content, mode, shouldPrompt = true) {
    await page.locator(`[data-action="${action}"]`).click();
    if (action !== 'revision') await page.locator('#write-name').fill(name);
    if (action !== 'folder') await page.locator('#write-content').fill(content);
    await page.locator(`input[name="mode"][value="${mode}"]`).check();
    await page.locator('#plan-submit').click();
    if (shouldPrompt) {
      await page.locator('#confirm-dialog[open]').waitFor();
      await page.locator('#confirm-dialog button[value="approve"]').click();
    }
    await page.waitForFunction(() => !document.querySelector('#plan-submit').disabled
      && (/Saved · read-back verified/.test(document.querySelector('#live-status').textContent)
      || /Write not completed:/.test(document.querySelector('#live-status').textContent)), null, { timeout: 20000 });
    const status = await page.locator('#live-status').textContent();
    assert.match(status, /Saved · read-back verified/);
    assert.equal(await page.locator('#confirm-dialog[open]').count(), 0);
    return status;
  }
  await check('relayed file creation has exactly one simulated message approval', async () => {
    const before = counts();
    await write('file', 'browser-note.txt', 'Written in the browser, recovered from the local EVM.', 'RELAYED_EOA');
    assert.equal(delta(before, 'wallet:eth_signTypedData_v4'), 1);
    assert.equal(delta(before, 'wallet:eth_sendTransaction'), 0);
    assert.equal(delta(before, 'relay:eth_sendTransaction'), 1);
    await page.getByRole('cell', { name: 'browser-note.txt', exact: true }).waitFor();
  });
  await check('direct directory creation has exactly one simulated transaction approval', async () => {
    const before = counts();
    await write('folder', 'BrowserFolder', '', 'DIRECT_EOA');
    assert.equal(delta(before, 'wallet:eth_signTypedData_v4'), 0);
    assert.equal(delta(before, 'wallet:eth_sendTransaction'), 1);
    assert.equal(delta(before, 'relay:eth_sendTransaction'), 0);
    await page.getByText('BrowserFolder', { exact: true }).waitFor();
  });
  await check('session setup is separate; a second routine revision has zero wallet calls', async () => {
    await page.getByRole('cell', { name: 'browser-note.txt', exact: true }).click();
    await page.locator('#preview-body').filter({ hasText: 'Written in the browser' }).waitFor();
    const beforeSetup = counts();
    await write('revision', '', 'First session revision.', 'SESSION');
    assert.equal(delta(beforeSetup, 'wallet:eth_signTypedData_v4'), 1, 'one grant setup signature');
    assert.equal(delta(beforeSetup, 'wallet:eth_sendTransaction'), 0);
    assert.equal(delta(beforeSetup, 'session:eth_signTypedData_v4'), 1);
    await page.getByRole('cell', { name: 'browser-note.txt', exact: true }).click();
    await page.locator('#preview-body').filter({ hasText: 'First session revision.' }).waitFor();
    const before = counts();
    await write('revision', '', 'Second session revision, with no routine wallet popup.', 'SESSION', false);
    assert.equal(delta(before, 'wallet:eth_signTypedData_v4'), 0); assert.equal(delta(before, 'wallet:eth_sendTransaction'), 0);
    assert.equal(delta(before, 'session:eth_signTypedData_v4'), 1);
  });
  await check('typed Data inspector decodes schema-qualified payloads', async () => {
    await page.locator('[data-tab="data"]').click();
    await page.locator('#record-list button').first().waitFor();
    await page.locator('#record-list button').first().click();
    await page.waitForFunction(() => document.querySelector('#schema-card').textContent.includes('Notes are ordinary typed data'));
    await page.screenshot({ path: new URL('data-desktop.png', reportDir).pathname, fullPage: true });
  });
  await check('Arcade browsing is inert; explicit Play verifies bytes and starts an isolated game', async () => {
    const before = counts();
    await page.locator('[data-tab="arcade"]').click();
    assert.equal(await page.locator('iframe').count(), 0);
    await page.locator('#play-game').click();
    await page.locator('#game-stage iframe').waitFor();
    assert.equal(await page.locator('#game-stage iframe').getAttribute('sandbox'), 'allow-scripts');
    const frame = page.frameLocator('#game-stage iframe');
    await frame.locator('canvas').waitFor();
    await frame.locator('#score').filter({ hasNotText: /^0$/ }).waitFor();
    assert.equal(delta(before, 'wallet:eth_signTypedData_v4'), 0); assert.equal(delta(before, 'wallet:eth_sendTransaction'), 0);
    await page.screenshot({ path: new URL('arcade-desktop.png', reportDir).pathname, fullPage: true });
    await page.locator('#stop-game').click();
    assert.equal(await page.locator('iframe').count(), 0);
  });
  await check('cold browser reopens the latest verified revision with zero wallet calls', async () => {
    await context.close();
    context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => requests.push(request.url()));
    page.on('response', response => { if (response.status() >= 400) failedResources.push({ url: response.url(), status: response.status() }); });
    page.on('requestfailed', request => failedResources.push({ url: request.url(), failure: request.failure() }));
    const before = counts();
    await page.goto(demo.origin); await page.getByRole('cell', { name: 'browser-note.txt', exact: true }).waitFor();
    await page.getByRole('cell', { name: 'browser-note.txt', exact: true }).click();
    await page.locator('#preview-body').filter({ hasText: 'Second session revision, with no routine wallet popup.' }).waitFor();
    assert.equal(delta(before, 'wallet:eth_signTypedData_v4'), 0); assert.equal(delta(before, 'wallet:eth_sendTransaction'), 0);
  });
  await check('mobile viewport keeps file reading usable without horizontal page overflow', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.locator('#preview-body').isVisible());
    const widths = await page.evaluate(() => ({ full: document.documentElement.scrollWidth, viewport: innerWidth }));
    assert(widths.full <= widths.viewport + 1, JSON.stringify(widths));
    await page.screenshot({ path: new URL('files-mobile.png', reportDir).pathname, fullPage: true });
  });
  assert.deepEqual(errors, [], 'browser page errors');
  assert.deepEqual(failedResources, [], 'browser resources must load, including stylesheets');
  assert(requests.every(url => url.startsWith(demo.origin) || url.startsWith('blob:') || url.startsWith('data:')), 'no external runtime requests');
} catch (error) {
  if (page && !page.isClosed()) {
    await page.screenshot({ path: new URL('browser-failure.png', reportDir).pathname, fullPage: true });
    console.error('Visible status:', await page.locator('#live-status').textContent().catch(() => 'unavailable'));
  }
  results.push({ name: 'integration failure', status: 'FAIL', error: error.message });
  throw error;
} finally {
  await writeFile(new URL('browser-results.json', reportDir), JSON.stringify({ profile: 'efs-lab/1', c0Conformance: false,
    generatedAt: new Date().toISOString(), browser: browser?.version(), results, errors, failedResources,
    providerCounts: counts(), runtimeRequestCount: requests.length }, null, 2) + '\n');
  await context?.close(); await browser?.close(); await demo.close();
}
