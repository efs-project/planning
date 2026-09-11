// Approval-authorized EIP-1193 test harness, not proof of a real wallet's UI.
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from '../../2026-09-04-mvp-rehearsal/node_modules/playwright/index.mjs';
import { Wallet } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from '../scripts/environment.mjs';
test('wallet claim cost, sponsored receipt payer, account swap halt, and durable nonce guard', { timeout: 600000 }, async () => {
  compileUpgrade(); compileRouter(); const browser = await chromium.launch({ headless: true });
  try { await withUpgrade(async lab => {
    const { server, sponsor } = await startEnvironment(lab, { write: true });
    const wallet = new Wallet('0x' + 'c0ffee'.repeat(10) + 'dead'); await lab.rpc('anvil_setBalance', [wallet.address, '0xde0b6b3a7640000']);
    const context = await browser.newContext();
    await context.exposeFunction('__walletRpc', (method, params) => lab.rpc(method, params));
    await context.addInitScript(({ key, account }) => {
      window.__walletState = { account, chain: '0x7a69', calls: [], swapAfterSignature: false };
      window.ethereum = { async request({ method, params = [] }) {
        const state = window.__walletState; state.calls.push(method);
        if (method === 'eth_accounts' || method === 'eth_requestAccounts') return [state.account];
        if (method === 'eth_chainId') return state.chain;
        const { Wallet } = await import('/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js'); const signer = new Wallet(key);
        if (method === 'eth_signTypedData_v4') { const p = JSON.parse(params[1]), { EIP712Domain, ...types } = p.types; const signature = await signer.signTypedData(p.domain, types, p.message); if (state.swapAfterSignature) state.account = '0x' + '9'.repeat(40); return signature; }
        if (method === 'eth_sendTransaction') { const tx = params[0]; const nonce = Number(BigInt(await window.__walletRpc('eth_getTransactionCount', [signer.address, 'pending']))); return window.__walletRpc('eth_sendRawTransaction', [await signer.signTransaction({ chainId: 31337, nonce, to: tx.to, data: tx.data, gasLimit: BigInt(tx.gas), gasPrice: 2000000000n })]); }
        throw Error('Unsupported harness request');
      } };
    }, { key: wallet.privateKey, account: wallet.address });
    const page = await context.newPage();
    try {
      await page.goto(server.url); await page.waitForSelector('main[data-state="settled"]'); await page.selectOption('#signer', 'wallet');
      await page.waitForFunction(() => document.querySelector('#signer-label').textContent.startsWith('Wallet '));
      let ledger = await page.evaluate(() => JSON.parse(localStorage.getItem('efs-files-cost-v1') ?? '{}'));
      assert(ledger.actions?.some(a => a.label === 'Claim author identity' && a.attempts[0]?.receipt), 'one-time claim receipt included in session costs');
      await page.click('#new-folder'); await page.fill('#prompt-input', 'sponsored'); await page.click('#prompt-ok');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('efs-files-recovery-v1')).actions.some(a => a.label.includes('sponsored') && a.effect === 'COMMITTED'), null, { timeout: 15000 });
      ledger = await page.evaluate(() => JSON.parse(localStorage.getItem('efs-files-cost-v1')));
      const sponsored = ledger.actions.find(a => a.label.includes('sponsored'));
      for (const tx of sponsored.attempts.filter(a => a.receipt)) { const receipt = await lab.rpc('eth_getTransactionReceipt', [tx.hash]); assert.equal(tx.receipt.gasUsed, String(BigInt(receipt.gasUsed))); assert.equal(tx.payerAddress, sponsor.address.toLowerCase()); }
      const other = await context.newPage(); await other.goto(server.url); await other.waitForSelector('main[data-state="settled"]');
      await other.evaluate(() => { void navigator.locks.request('efs-files-authorizing-v1', async () => { window.__locked = true; await new Promise(resolve => { window.__unlock = resolve; }); }); });
      await other.waitForFunction(() => window.__locked);
      await page.click('#new-folder'); await page.fill('#prompt-input', 'tab-race'); await page.click('#prompt-ok');
      await page.waitForFunction(() => document.querySelector('#op-status').textContent.includes('another tab'));
      assert.equal(await page.evaluate(() => window.__walletState.calls.filter(m => m === 'eth_signTypedData_v4').length), 1, 'another tab writer lock prevents another signature');
      await other.evaluate(() => window.__unlock()); await other.close();
      await page.evaluate(() => { window.__walletState.swapAfterSignature = true; });
      await page.click('#new-folder'); await page.fill('#prompt-input', 'swapped'); await page.click('#prompt-ok');
      await page.waitForFunction(() => document.querySelector('#op-status').textContent.includes('account changed'));
      const before = await page.evaluate(() => window.__walletState.calls.filter(m => m === 'eth_signTypedData_v4').length); assert.equal(before, 2);
      await page.reload(); await page.waitForSelector('main[data-state="settled"]'); await page.selectOption('#signer', 'wallet'); await page.waitForFunction(() => document.querySelector('#signer-label').textContent.startsWith('Wallet '));
      await page.click('#new-folder'); await page.fill('#prompt-input', 'blocked'); await page.click('#prompt-ok');
      await page.waitForFunction(() => document.querySelector('#op-status').textContent.includes('earlier signed approval'));
      assert.equal(await page.evaluate(() => window.__walletState.calls.filter(m => m === 'eth_signTypedData_v4').length), 0, 'reload cannot race the still-live nonce');
      await page.selectOption('#signer', 'B');
      await page.evaluate(() => { Storage.prototype.setItem = () => { throw Error('test quota refusal'); }; });
      await page.click('#new-folder'); await page.fill('#prompt-input', 'no-storage'); await page.click('#prompt-ok');
      await page.waitForFunction(() => document.querySelector('#op-status').textContent.includes('Recovery storage'));
      assert.equal(await page.locator('#consent[open]').count(), 0, 'storage failure refuses before signing');
    } finally { await context.close(); await server.close(); }
  }, { profile: 'reads', watchdogMs: 600000 }); } finally { await browser.close(); }
});
