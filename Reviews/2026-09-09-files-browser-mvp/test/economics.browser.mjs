import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from '../scripts/environment.mjs';
test('real upload costs match independent chunk receipts; immutable context and reload recovery', { timeout: 600000 }, async () => {
  compileUpgrade(); compileRouter();
  const browser = await chromium.launch({ headless: true });
  try { await withUpgrade(async lab => {
    const { server } = await startEnvironment(lab, { write: true });
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(server.url); await page.waitForSelector('main[data-state="settled"]');
      await page.selectOption('#signer', 'A'); await page.click('#new-note');
      await page.fill('#prompt-input', 'cost-note.txt'); await page.fill('#prompt-text', 'Chunk sample '.repeat(900)); await page.click('#prompt-ok');
      await page.waitForSelector('#consent[open]');
      assert.equal(await page.$eval('#lens', e => e.disabled), true, 'Lens disabled while authorizing');
      // An injected DOM change cannot change the captured signing/verification context.
      await page.$eval('#lens', e => { e.value = 'bFirst'; e.dispatchEvent(new Event('change')); });
      await page.click('#consent-approve');
      await page.waitForFunction(() => !document.querySelector('main').dataset.writing, null, { timeout: 90000 });
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('efs-files-cost-v1') ?? '{}').actions?.some(a => a.attempts.length >= 4), null, { timeout: 90000 });
      const ledger = await page.evaluate(() => JSON.parse(localStorage.getItem('efs-files-cost-v1')));
      const action = ledger.actions.find(a => a.label.includes('cost-note'));
      assert.equal(action.context.lensId, 'aFirst'); assert.equal(action.attempts.length, 4);
      let gas = 0n;
      for (const attempt of action.attempts) { const receipt = await lab.rpc('eth_getTransactionReceipt', [attempt.hash]); assert.equal(attempt.receipt.gasUsed, String(BigInt(receipt.gasUsed))); gas += BigInt(receipt.gasUsed); }
      assert.match(await page.textContent('#economics > summary'), new RegExp(String(gas)));
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('efs-files-recovery-v1')).actions.some(a => a.effect === 'COMMITTED' && a.bytes === 'VERIFIED'), null, { timeout: 15000 });
      await page.click('#economics > summary');
      for (const family of ['ethereum', 'optimism', 'base', 'arbitrum']) {
        await page.selectOption('#economics select[name="family"]', family);
        await page.fill('#economics input[name="gasPrice"]', '1'); await page.fill('#economics input[name="l1Fee"]', '0.000001');
        await page.fill('#economics input[name="operatorFee"]', '0'); await page.fill('#economics input[name="fx"]', '2000');
        await page.click('button:has-text("Pin manual model snapshot")');
      }
      await page.locator('#economics details > summary').first().click();
      assert.equal(await page.locator('#economics details p').filter({ hasText: 'MANUAL MODEL' }).count(), 4, 'per-action four-chain alternatives');
      const publicState = await page.evaluate(() => localStorage.getItem('efs-files-recovery-v1'));
      assert(!publicState.includes('Chunk sample')); assert(!publicState.includes('signature'));
      await page.reload(); await page.waitForSelector('main[data-state="settled"]');
      assert.match(await page.textContent('#economics > summary'), new RegExp(String(gas)));
      assert.match(await page.textContent('#economics > summary'), /arbitrum MODEL/, 'pinned scenarios survive reload');
      await page.click('#economics > summary'); await page.click('button:has-text("Reconcile recorded actions")');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('efs-files-recovery-v1')).actions.some(a => a.effect === 'COMMITTED' && a.bytes === 'VERIFIED'), null, { timeout: 90000 });
      assert.deepEqual(errors, []);
    } catch (error) { console.error(await page.evaluate(() => ({ status: document.querySelector('#status')?.textContent, problem: document.querySelector('#op-status')?.textContent, recovery: localStorage.getItem('efs-files-recovery-v1'), costs: localStorage.getItem('efs-files-cost-v1') }))); throw error; }
    finally { await page.close(); await server.close(); }
  }, { profile: 'reads' }); } finally { await browser.close(); }
});
test('mined revert and lost publish response retain costs; interrupted chunks resume only matching bytes after reload', { timeout: 600000 }, async () => {
  compileUpgrade(); compileRouter(); const browser = await chromium.launch({ headless: true });
  try { await withUpgrade(async lab => {
    const { f, auth, config, server } = await startEnvironment(lab, { write: true }); const page = await browser.newPage();
    try {
      await page.goto(server.url); await page.waitForSelector('main[data-state="settled"]'); await page.selectOption('#signer', 'A');
      await page.click('#new-folder'); await page.fill('#prompt-input', 'race'); await page.click('#prompt-ok'); await page.waitForSelector('#consent[open]');
      await auth.execute({ kind: 'createDir', mountId: config.mounts.aFirst, parent: f.root, name: 'race', principal: auth.A });
      await page.click('#consent-approve'); await page.waitForFunction(() => !document.querySelector('main').dataset.writing);
      let costs = await page.evaluate(() => JSON.parse(localStorage.getItem('efs-files-cost-v1')));
      const reverted = costs.actions[0].attempts[0]; assert.equal(reverted.receipt.status, 'reverted');
      const independent = await lab.rpc('eth_getTransactionReceipt', [reverted.hash]); assert.equal(reverted.receipt.gasUsed, String(BigInt(independent.gasUsed)));
      // The third publish IS mined but its HTTP response is lost; later chunks stop.
      let publishes = 0;
      await page.route('**/publish', async route => { publishes++; if (publishes === 3) { await route.fetch(); await route.abort(); } else await route.continue(); });
      const original = 'Recovery chunk data '.repeat(600);
      await page.click('#new-note'); await page.fill('#prompt-input', 'partial.txt'); await page.fill('#prompt-text', original); await page.click('#prompt-ok'); await page.click('#consent-approve');
      await page.waitForFunction(() => !document.querySelector('main').dataset.writing, null, { timeout: 30000 });
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('efs-files-recovery-v1')).actions.some(a => a.label.includes('partial') && a.effect === 'COMMITTED' && a.bytes === 'UNAVAILABLE'), null, { timeout: 15000 });
      await page.unroute('**/publish'); await page.reload(); await page.waitForSelector('main[data-state="settled"]'); await page.selectOption('#signer', 'A'); await page.click('#economics > summary');
      const row = page.locator('#economics details').filter({ hasText: 'partial.txt' }); await row.locator('summary').click();
      await row.locator('input[type="file"]').setInputFiles({ name: 'wrong.txt', mimeType: 'text/plain', buffer: Buffer.from('wrong') });
      await page.waitForFunction(() => document.querySelector('#op-status').textContent.includes('do not match'));
      await row.locator('input[type="file"]').setInputFiles({ name: 'original.txt', mimeType: 'text/plain', buffer: Buffer.from(original) });
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('efs-files-recovery-v1')).actions.some(a => a.label.includes('partial') && a.bytes === 'VERIFIED'), null, { timeout: 30000 });
      costs = await page.evaluate(() => JSON.parse(localStorage.getItem('efs-files-cost-v1')));
      const resumed = costs.actions.find(a => a.label.includes('partial'));
      assert.equal(resumed.attempts.length, 4, 'metadata plus three chunks; no duplicate broadcast on recovery');
      for (const attempt of resumed.attempts) { const receipt = await lab.rpc('eth_getTransactionReceipt', [attempt.hash]); assert.equal(attempt.receipt.gasUsed, String(BigInt(receipt.gasUsed))); }
    } finally { await page.close(); await server.close(); }
  }, { profile: 'reads', watchdogMs: 600000 }); } finally { await browser.close(); }
});
test('browser rollover retains exact directory rows across bounded read acquisitions', { timeout: 600000 }, async () => {
  compileUpgrade(); compileRouter(); const browser = await chromium.launch({ headless: true });
  try { await withUpgrade(async lab => {
    const { f, auth, config, server } = await startEnvironment(lab, { write: true });
    const folder = await auth.execute({ kind: 'createDir', mountId: config.mounts.aFirst, parent: f.root, name: 'rollover', principal: auth.A });
    for (let i = 0; i < 40; i++) await auth.execute({ kind: 'createDir', mountId: config.mounts.aFirst, parent: folder.plan.op.object, name: 'child' + String(i).padStart(2, '0'), principal: auth.A });
    const page = await browser.newPage();
    try {
      await page.route('**/config', async route => { const response = await route.fetch(); const body = await response.json(); await route.fulfill({ response, json: { ...body, readerLimits: { maxRequests: 180 }, directoryPageSize: 4 } }); });
      await page.goto(server.url); await page.waitForSelector('main[data-state="settled"]');
      for (let i = 0; i < 15 && !(await page.locator('#rows li').filter({ hasText: 'rollover/' }).count()); i++) { await page.click('#more'); await page.waitForSelector('main[data-state="settled"]'); }
      await page.locator('#rows li').filter({ hasText: 'rollover/' }).locator('button').filter({ hasText: /^Open$/ }).click(); await page.waitForSelector('main[data-state="settled"]');
      assert.equal(await page.locator('#rows > li').count(), 4, 'bounded configured first page');
      let previous = [];
      for (let i = 0; i < 40; i++) {
        const names = await page.locator('#rows .row-title').allTextContents();
        assert(previous.every(name => names.includes(name)), 'sealed rows never reset during rollover'); assert.equal(new Set(names).size, names.length);
        previous = names;
        if (await page.$eval('#more', e => e.hidden)) break;
        await page.click('#more'); await page.waitForSelector('main[data-state="settled"]');
      }
      assert.deepEqual(previous.sort(), Array.from({ length: 40 }, (_, i) => 'child' + String(i).padStart(2, '0') + '/'));
      assert(Number((await page.textContent('#basis')).match(/Snapshot (\d+)/)?.[1]) >= 3, 'multiple read acquisitions were needed');
      assert.equal(await page.textContent('#coverage'), 'Listing complete');
      // Acquire again, then hold a postings response from the resumed scope.
      // Navigation within this pin does not abort that scope: the app must
      // reject the old generation even when its response arrives successfully.
      await page.click('#refresh'); await page.waitForSelector('main[data-state="settled"]');
      let reopening = false, intercepted = false, release, markIntercepted;
      const held = new Promise(resolve => { release = resolve; });
      const interceptedReady = new Promise(resolve => { markIntercepted = resolve; });
      const selector = lab.readIface.getFunction('pagePostingsHydrated').selector;
      await page.route(/\/rpc(?:-batch)?$/, async route => {
        const body = route.request().postDataJSON(), requests = body.batch ?? [body];
        if (requests.some(r => r.method === 'eth_getCode')) reopening = true;
        if (reopening && !intercepted && requests.some(r => r.method === 'eth_call' && r.params[0].data.startsWith(selector))) {
          const response = await route.fetch(); intercepted = true; markIntercepted(); await held; await route.fulfill({ response });
        } else await route.continue();
      });
      try {
        for (let i = 0; i < 12 && !intercepted; i++) {
          await page.click('#more');
          await Promise.race([page.waitForSelector('main[data-state="settled"]'), interceptedReady]);
        }
        assert(intercepted, 'held an actual resumed-scope postings response');
        await page.evaluate(() => {
          window.__staleRows = [];
          new MutationObserver(() => {
            if (document.querySelector('#crumbs').textContent === 'trip') {
              const names = [...document.querySelectorAll('#rows .row-title')].map(e => e.textContent);
              window.__staleRows.push(...names.filter(name => /^child\d/.test(name)));
            }
          }).observe(document.querySelector('#rows'), { childList: true, subtree: true });
        });
        await page.getByRole('button', { name: 'trip', exact: true }).click();
        release(); await page.waitForSelector('main[data-state="settled"]');
        assert.deepEqual(await page.evaluate(() => window.__staleRows), [], 'old folder never paints after navigating to root');
        assert(!(await page.locator('#rows .row-title').allTextContents()).some(name => /^child\d/.test(name)));
      } finally { release(); }
    } finally { await page.close(); await server.close(); }
  }, { profile: 'reads', watchdogMs: 600000 }); } finally { await browser.close(); }
});
