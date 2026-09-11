import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';

// Real panel + ledger + stylesheet; no contracts or network prices needed to
// catch layout obstruction, inaccessible controls or silently lost qualifiers.
const setup = `
import {createLedger, reduceLedger} from '/screen/cost-ledger.mjs';
import {createEconomicsPanel} from '/screen/economics-panel.mjs';
let ledger=createLedger({sessionId:'ui',createdAt:'2026-09-11T21:00:00Z'});
const add=e=>{ledger=reduceLedger(ledger,e)};
add({type:'fx/add',snapshot:{id:'fx',capturedAt:'2026-09-11T21:00:00Z',source:'Controlled test FX',usdPerEth:'2000'}});
for(const [family,price] of [['ethereum','1000000000'],['optimism','1000000'],['base','10000000'],['arbitrum','20000000']])add({type:'fee/add',snapshot:{id:family,capturedAt:'2026-09-11T21:00:00Z',source:'Controlled rate; illustrative L1 allowance, not a live quote',chainFamily:family,executionGasPriceWei:price,l1FeeWei:'1000000000000',operatorFeeWei:'0',...(family==='arbitrum'?{arbitrumMode:'separate-execution'}:{})}});
for(let i=0;i<7;i++){
 add({type:'action/start',actionId:'a'+i,label:'Create note '+i,createdAt:'2026-09-11T21:00:00Z',context:{environmentId:'test-world',chainId:'31337',lensId:'aFirst'}});
 const hash='0x'+String(i+1).repeat(64);
 add({type:'attempt/upsert',actionId:'a'+i,attemptId:'t'+i,hash,status:'submitted',payer:'user'});
 add({type:'receipt/record',actionId:'a'+i,attemptId:'t'+i,receipt:{hash,status:i===1?'reverted':'success',gasUsed:'1000000',effectiveGasPrice:'2000000000',chainFamily:'ethereum'}});
}
const recovery=ledger.actions.map(a=>({actionId:a.actionId,admission:'ADMITTED',selection:'SELECTED',effect:'COMMITTED',bytes:'VERIFIED'}));
const options={scenarioSnapshotIds:['ethereum','optimism','base','arbitrum'],fxSnapshotId:'fx'};
let resets=0,exports=0,reconciles=0;
document.querySelector('#economics').replaceChildren();
const panel=createEconomicsPanel(document.querySelector('#economics'),{onModel:async v=>{window.submittedModel=v},onExport:()=>exports++,onReset:()=>resets++,onReconcile:()=>reconciles++,onReselect:()=>{}});
const render=()=>panel.render(ledger,recovery,{logicalCalls:123,httpBatches:20,requestBytes:500,responseBytes:1500},options);
window.costTest={render,stats:()=>({resets,exports,reconciles}),unknown:()=>{add({type:'attempt/upsert',actionId:'a6',attemptId:'lost',status:'unknown',payer:'user'});render();}};
render();document.body.dataset.ready='true';
`;

async function fixture(run) {
  const html = await readFile(new URL('../web/index.html', import.meta.url));
  const assets = new Map(['/screen/cost-ledger.mjs', '/screen/economics-panel.mjs', '/screen/files.css'].map(p => [p, new URL('../web/' + p.split('/').at(-1), import.meta.url)]));
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url === '/') { res.setHeader('content-type', 'text/html'); res.end(html); }
      else if (req.url === '/screen/app.mjs') { res.setHeader('content-type', 'text/javascript'); res.end(setup); }
      else if (assets.has(req.url)) { res.setHeader('content-type', req.url.endsWith('.css') ? 'text/css' : 'text/javascript'); res.end(await readFile(assets.get(req.url))); }
      else { res.statusCode = 404; res.end(); }
    } catch { res.statusCode = 500; res.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  try { await run(browser, `http://127.0.0.1:${server.address().port}`); }
  finally { await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test('floating costs do not move files; four estimates and recent actions work without setup', async () => fixture(async (browser, url) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url); await page.waitForSelector('body[data-ready="true"]');
  const before = await page.locator('.listing').boundingBox();
  assert.equal(await page.locator('#economics').evaluate(e => getComputedStyle(e).position), 'fixed');
  const toggle = page.locator('#economics > summary');
  assert.match(await toggle.textContent(), /7M/);
  await toggle.focus(); await page.keyboard.press('Enter');
  assert.deepEqual(await page.locator('.listing').boundingBox(), before, 'opening never shifts file layout');
  assert.equal(await page.locator('.cost-chain').count(), 4);
  assert.match(await page.locator('.cost-chain[data-family="ethereum"]').textContent(), /\$14\.00/);
  assert.match(await page.locator('.cost-chain[data-family="base"]').textContent(), /\$0\.15/);
  assert.equal(await page.locator('.cost-actions > details').count(), 5, 'starts with last five, not whole history');
  assert.match(await page.locator('.cost-actions > details').first().textContent(), /Create note 6/);
  assert.match(await page.locator('.cost-actions > details > summary').first().textContent(), /1M gas/, 'recent actions expose gas before expanding evidence');
  assert.equal(await page.locator('.cost-model').isVisible(), false, 'no settings wall on opening');
  await page.getByRole('button', { name: /Show all 7 actions/ }).click();
  assert.equal(await page.locator('.cost-actions > details').count(), 7);
  await page.locator('.cost-actions > details').first().locator(':scope > summary').click();
  const evidence = page.locator('.cost-actions > details').first().locator('.cost-evidence');
  await evidence.locator('summary').click();
  await evidence.locator('summary').focus();
  await page.evaluate(() => window.costTest.render());
  assert.equal(await page.locator('.cost-actions > details').first().getAttribute('open'), '', 'updates retain open action');
  assert.equal(await evidence.getAttribute('open'), '', 'updates retain the receipt evidence being inspected');
  assert.equal(await evidence.locator('summary').evaluate(e => e === document.activeElement), true, 'updates preserve evidence keyboard focus');
  await page.evaluate(() => window.costTest.unknown());
  assert.match(await toggle.textContent(), /pending/i, 'unknown receipt is never a complete dollar total');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#economics').getAttribute('open'), null);
  assert.equal(await toggle.evaluate(e => e === document.activeElement), true, 'close returns keyboard focus');
  await page.close();
}));

test('mobile sheet fits viewport, prefilled settings remain editable and diagnostics stay reachable', async () => fixture(async (browser, url) => {
  const page = await browser.newPage({ viewport: { width: 320, height: 640 } });
  await page.goto(url); await page.waitForSelector('body[data-ready="true"]');
  await page.locator('#economics > summary').click();
  assert.equal(await page.locator('.cost-popover').count(), 1, 'costs open in a contained sheet');
  assert.equal(await page.getByRole('button', { name: 'Close costs', exact: true }).evaluate(e => e === document.activeElement), true, 'focus moves inside mobile sheet when opener is hidden');
  const sheet = await page.locator('.cost-popover').boundingBox();
  assert(sheet.x >= 0 && sheet.x + sheet.width <= 321 && sheet.y >= 0 && sheet.y + sheet.height <= 641);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.locator('.cost-settings > summary').click();
  await page.selectOption('.cost-model select[name="family"]', 'base');
  assert.equal(await page.inputValue('.cost-model input[name="gasPrice"]'), '0.01');
  assert.equal(await page.inputValue('.cost-model input[name="fx"]'), '2000');
  await page.fill('.cost-model input[name="gasPrice"]', '0.025');
  await page.evaluate(() => window.costTest.render());
  assert.equal(await page.inputValue('.cost-model input[name="gasPrice"]'), '0.025', 'read updates do not destroy an in-progress edit');
  await page.getByRole('button', { name: 'Apply estimates', exact: true }).click();
  assert.equal(await page.evaluate(() => window.submittedModel.gasPrice), '0.025');
  await page.getByRole('button', { name: /Reconcile recorded actions/ }).click();
  assert.equal(await page.evaluate(() => window.costTest.stats().reconciles), 1);
  assert.match(await page.locator('.cost-sources').textContent(), /2026-09-11.*Controlled rate/s);
  await page.getByRole('button', { name: 'Close costs', exact: true }).click();
  assert.equal(await page.locator('#economics').getAttribute('open'), null);
  await page.setViewportSize({ width: 844, height: 300 });
  await page.locator('#economics > summary').click();
  const landscape = await page.locator('.cost-popover').boundingBox();
  assert(landscape.y >= 0 && landscape.y + landscape.height <= 301, 'short landscape keeps the close button on screen');
  await page.close();
}));
