// Real-wallet flow through an EXECUTABLE EIP-1193 HARNESS. The page gets a
// faithful window.ethereum provider whose key lives in the harness (never the
// app): every eth_requestAccounts / eth_signTypedData_v4 / eth_sendTransaction
// waits for an explicit approval driven by this test, exactly like wallet
// software. What this suite PROVES: the actual provider request counts and
// payloads, role separation (author/signer/submitter/payer), cancellation,
// expiry, and sponsor behavior. What it does NOT prove: real wallet UI
// behavior (MetaMask etc.) — that remaining manual gate is documented in the
// walkthrough. Request counts here are real EIP-1193 requests, not simulated
// dialog counts.
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import { Wallet } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from '../scripts/environment.mjs';
import { core3Interface, encodeExecuteV2, decodeAuthorityError } from '../sdk/files-actions.mjs';

async function settle(page) { await page.waitForSelector('main[data-state="settled"]', { timeout: 60000 }); }
async function rows(page) { return page.$$eval('#rows li .row-title', els => els.map(e => e.textContent)); }
async function fillPrompt(page, name, textValue) {
  await page.waitForSelector('#prompt-dialog[open]');
  if (!(await page.$eval('#prompt-input', e => e.readOnly))) await page.fill('#prompt-input', name);
  if (textValue !== undefined) await page.fill('#prompt-text', textValue);
  await page.click('#prompt-ok');
}
async function waitToast(page, includes) {
  await page.waitForFunction(t => document.getElementById('status').textContent.includes(t), includes, { timeout: 90000 });
}
async function waitProblem(page, includes) {
  await page.waitForFunction(() => !document.getElementById('op-status').hidden && !document.querySelector('main').dataset.writing, undefined, { timeout: 90000 });
  assert((await page.textContent('#op-status')).includes(includes), await page.textContent('#op-status'));
}

// Harness provider: queues approval-gated requests; the TEST plays the user.
// Chain access goes through a Playwright binding (window.__harnessRpc), i.e.
// OUTSIDE the page — like real wallet software's background process — so the
// page's CSP applies to the app, not to the wallet.
function injectWallet(privateKey) {
  return `(() => {
    const KEY = ${JSON.stringify(privateKey)};
    const log = []; const queue = []; let connectedAccount = null;
    window.__wallet = { log, queue };
    async function rpc(method, params) {
      const b = await window.__harnessRpc(method, params);
      if (b && b.__error) { const e = new Error(b.__error); e.data = b.__data ?? null; throw e; }
      return b;
    }
    async function perform(method, params) {
      const { Wallet } = await import('/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js');
      const wallet = new Wallet(KEY);
      if (method === 'eth_requestAccounts') { connectedAccount = wallet.address; return [wallet.address]; }
      if (method === 'eth_signTypedData_v4') {
        const payload = JSON.parse(params[1]);
        const { EIP712Domain, ...types } = payload.types;
        return wallet.signTypedData(payload.domain, types, payload.message);
      }
      if (method === 'eth_sendTransaction') {
        const tx = params[0];
        const nonce = parseInt(await rpc('eth_getTransactionCount', [wallet.address, 'pending']), 16);
        const raw = await wallet.signTransaction({ chainId: 31337, nonce, gasLimit: BigInt(tx.gas ?? '0x1000000'), gasPrice: 2000000000n, to: tx.to, data: tx.data ?? '0x', value: BigInt(tx.value ?? 0) });
        return rpc('eth_sendRawTransaction', [raw]);
      }
      throw new Error('harness: unsupported ' + method);
    }
    window.ethereum = {
      isHarnessWallet: true,
      request({ method, params = [] }) {
        log.push({ method });
        if (method === 'eth_chainId') return Promise.resolve('0x7a69');
        if (method === 'eth_accounts') return Promise.resolve(connectedAccount ? [connectedAccount] : []);
        return new Promise((resolve, reject) => {
          queue.push({ method, params,
            approve: () => perform(method, params).then(resolve, reject),
            reject: () => { const e = new Error('User rejected the request.'); e.code = 4001; reject(e); } });
        });
      },
      on() {}, removeListener() {},
    };
  })()`;
}
const nextPrompt = async page => page.waitForFunction(() => window.__wallet.queue.length > 0, undefined, { timeout: 60000 });
const approve = page => page.evaluate(() => window.__wallet.queue.shift().approve());
const reject = page => page.evaluate(() => window.__wallet.queue.shift().reject());
const requestCounts = page => page.evaluate(() => window.__wallet.log.reduce((m, e) => ({ ...m, [e.method]: (m[e.method] ?? 0) + 1 }), {}));

test('sponsored wallet flow: one signature per change, sponsor pays, honest failure handling', { timeout: 900000 }, async () => {
  compileUpgrade(); compileRouter();
  const browser = await chromium.launch({ headless: true, ...(process.env.EFS_LAB_CHROMIUM ? { executablePath: process.env.EFS_LAB_CHROMIUM } : {}) });
  try {
    await withUpgrade(async lab => {
      const { server, sponsor } = await startEnvironment(lab, { write: true });
      try {
      const walletKey = new Wallet('0x' + 'c0ffee'.repeat(10) + 'dead'); // disposable, generated for this run only
      await lab.rpc('anvil_setBalance', [walletKey.address, '0xde0b6b3a7640000']); // 1 ETH for the ONE claim tx
      const balance = async a => BigInt(await lab.rpc('eth_getBalance', [a, 'latest']));

      const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
      await context.exposeFunction('__harnessRpc', async (method, params) => {
        try { return await lab.rpc(method, params); }
        catch (e) { return { __error: e.message, __data: e.data ?? null }; }
      });
      await context.addInitScript(injectWallet(walletKey.privateKey));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(server.url); await settle(page);

      // The served config must not leak the sponsor key.
      const served = await page.evaluate(() => fetch('/config').then(r => r.json()));
      assert(!JSON.stringify(served).includes(sponsor.privateKey), 'the sponsor private key must never be served');
      assert(!JSON.stringify(served).includes('sponsorKey'), 'no sponsor key field is served either');
      assert.equal(served.write.sponsor.payer, sponsor.address, 'sponsor payer address is public');

      // Connect: real provider prompts — accounts, then the ONE-TIME claim tx.
      await page.selectOption('#signer', 'wallet');
      await nextPrompt(page); await approve(page); // eth_requestAccounts
      await nextPrompt(page); await approve(page); // claim transaction (setup, paid by the account)
      await waitToast(page, 'Author identity claimed');
      assert.match(await page.textContent('#signer-label'), /REAL EIP-1193 signer/);
      assert.equal(await page.textContent('#prompts'), '2 wallet requests', 'connect + claim, honestly counted');

      // ONE wallet signature per change; the sponsor submits and PAYS.
      const accountBefore = await balance(walletKey.address);
      const sponsorBefore = await balance(sponsor.address);
      const note = page.click('#new-note');
      await fillPrompt(page, 'wallet-note.md', 'signed by real provider requests, sponsored submission');
      await nextPrompt(page); await approve(page); // eth_signTypedData_v4 — the ONLY prompt
      await note;
      await waitToast(page, 'Note created with verified bytes'); await settle(page);
      assert((await rows(page)).includes('wallet-note.md'));
      const counts1 = await requestCounts(page);
      assert.equal(counts1.eth_signTypedData_v4, 1, 'exactly one typed-data signature request');
      assert.equal(counts1.eth_sendTransaction, 1, 'still only the setup claim transaction — the sponsor submitted the write');
      assert.equal(await balance(walletKey.address), accountBefore, 'the wallet account paid NOTHING for the write');
      assert(await balance(sponsor.address) < sponsorBefore, 'the sponsor paid the gas');

      // Multichunk content under the same single signature.
      const big = page.click('#new-note');
      await fillPrompt(page, 'wallet-big.md', 'x'.repeat(9000));
      await nextPrompt(page); await approve(page);
      await big;
      await waitToast(page, 'Note created with verified bytes'); await settle(page);
      const counts2 = await requestCounts(page);
      assert.equal(counts2.eth_signTypedData_v4, 2, 'one more signature, nothing else');
      assert.equal(counts2.eth_sendTransaction, 1, 'sponsor staged all three chunks — zero extra wallet transactions');

      // Cancellation: rejecting the wallet prompt sends nothing.
      const cancelled = page.click('#new-note');
      await fillPrompt(page, 'never.md', 'should not exist');
      await nextPrompt(page); await reject(page);
      await cancelled;
      await waitToast(page, 'Cancelled in the wallet; nothing was sent'); await settle(page);
      assert(!(await rows(page)).includes('never.md'));
      assert.equal((await requestCounts(page)).eth_signTypedData_v4, 3, 'the shown-and-rejected prompt is still counted');

      // Expired intent: hold the prompt open past the deadline, then approve —
      // the sponsor's free simulation refuses; nothing is submitted.
      const expiredAccountBalance = await balance(walletKey.address), expiredSponsorBalance = await balance(sponsor.address);
      const authorNonce = async () => BigInt(await lab.rpc('eth_call', [{ to: served.write.core, data: core3Interface.encodeFunctionData('principalNonce', [served.write.walletPrincipal]) }, 'latest']));
      const nonceBeforeExpiry = await authorNonce();
      let expiredRequest, expiredResponse;
      await page.route('**/sponsor', async route => {
        expiredRequest = route.request().postDataJSON(); // test-local only; never persisted or printed
        const response = await route.fetch(); expiredResponse = await response.json(); await route.fulfill({ response });
      });
      const expired = page.click('#new-note');
      await fillPrompt(page, 'stale.md', 'signed too late');
      await nextPrompt(page);
      await lab.rpc('evm_increaseTime', [4000]); await lab.rpc('evm_mine', []);
      await approve(page);
      await expired;
      await waitProblem(page, 'check the transaction journal before retrying'); await settle(page);
      assert.equal(expiredResponse.submitted, false); assert.deepEqual(expiredResponse.transactions, []);
      assert.equal(expiredResponse.data, null, 'parameterized revert data stays private at the sponsor boundary');
      const exactCall = encodeExecuteV2({ op: expiredRequest.op, publication: expiredRequest.publication }, expiredRequest.expectedRevision, expiredRequest.intent, expiredRequest.signature);
      await assert.rejects(lab.rpc('eth_call', [{ from: sponsor.address, to: served.write.router, data: exactCall, gas: '0x1000000' }, 'latest']), error => {
        const decoded = decodeAuthorityError(error.data);
        return decoded?.name === 'ErrIntentExpired' && BigInt(decoded.args[0]) === BigInt(expiredRequest.intent.deadline);
      }, 'independent exact signed-operation simulation proves contract expiry, not an unrelated refusal');
      assert.equal(await authorNonce(), nonceBeforeExpiry, 'expired intent did not consume author nonce');
      assert.equal(await balance(walletKey.address), expiredAccountBalance); assert.equal(await balance(sponsor.address), expiredSponsorBalance, 'sponsor paid nothing for refused simulation');
      assert.equal((await requestCounts(page)).eth_sendTransaction, 1, 'expiry introduced no wallet transaction');
      await page.unroute('**/sponsor');
      assert(!(await rows(page)).includes('stale.md'));

      assert.deepEqual(errors, [], 'zero page errors');
      await context.close();
      } finally { await server.close(); }
    }, { profile: 'reads', watchdogMs: 900000 });
  } finally { await browser.close(); }
});

test('direct wallet mode without a sponsor: every transaction is its own counted prompt', { timeout: 900000 }, async () => {
  compileUpgrade(); compileRouter();
  const browser = await chromium.launch({ headless: true, ...(process.env.EFS_LAB_CHROMIUM ? { executablePath: process.env.EFS_LAB_CHROMIUM } : {}) });
  try {
    await withUpgrade(async lab => {
      const { server } = await startEnvironment(lab, { write: true, sponsor: false });
      try {
      const walletKey = new Wallet('0x' + 'd1ce'.repeat(16));
      await lab.rpc('anvil_setBalance', [walletKey.address, '0x21e19e0c9bab2400000']);
      const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
      await context.exposeFunction('__harnessRpc', async (method, params) => {
        try { return await lab.rpc(method, params); }
        catch (e) { return { __error: e.message, __data: e.data ?? null }; }
      });
      await context.addInitScript(injectWallet(walletKey.privateKey));
      const page = await context.newPage();
      await page.goto(server.url); await settle(page);
      assert.match(await page.$eval('#signer option[value="wallet"]', e => e.textContent), /direct/, 'mode is labeled before selection');

      await page.selectOption('#signer', 'wallet');
      await nextPrompt(page); await approve(page); // accounts
      await nextPrompt(page); await approve(page); // claim
      await waitToast(page, 'Author identity claimed');

      // A two-chunk note in DIRECT mode: 1 signature + 1 admission tx + 2
      // staging txs = 4 further prompts, none hidden.
      const note = page.click('#new-note');
      await fillPrompt(page, 'direct.md', 'y'.repeat(5000));
      await nextPrompt(page); await approve(page); // signature
      await nextPrompt(page); await approve(page); // admission transaction
      await nextPrompt(page); await approve(page); // chunk 1
      await nextPrompt(page); await approve(page); // chunk 2
      await note;
      await waitToast(page, 'Note created with verified bytes'); await settle(page);
      const counts = await requestCounts(page);
      assert.equal(counts.eth_signTypedData_v4, 1);
      assert.equal(counts.eth_sendTransaction, 4, 'claim + admission + 2 chunks, each its own wallet prompt');
      assert.equal(await page.textContent('#prompts'), '6 wallet requests', 'connect + claim + signature + 3 transactions');
      await context.close();
      } finally { await server.close(); }
    }, { profile: 'reads', watchdogMs: 900000 });
  } finally { await browser.close(); }
});
