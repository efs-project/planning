import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ContractFactory, hexlify, keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { withLabChain } from '../../2026-09-04-mvp-rehearsal/scripts/local-chain.mjs';

const compiled = JSON.parse(await readFile(new URL('out/BudgetProbe.sol/BudgetProbe.json', import.meta.url), 'utf8'));
const deploy = async (signer, budget = 20_000_000n) => {
  const probe = await new ContractFactory(compiled.abi, compiled.bytecode.object, signer)
    .deploy(budget, { gasLimit: 3_000_000 });
  await probe.waitForDeployment();
  return probe;
};

test('separate transactions compare full reservations with measured cold and repeated-content charges', { timeout: 60000 }, async () => {
  const rows = [];
  await withLabChain(async chain => {
    for (const length of [0, 32, 256, 1024]) {
      const data = hexlify(Uint8Array.from({ length }, (_, i) => (i % 251) + 1));
      for (const arm of ['stipend', 'measured']) {
        const probe = await deploy(chain.owner);
        for (const occurrence of ['first', 'repeated-content']) {
          const before = await probe.remaining();
          const receipt = await (await probe[arm](data, 2_000_000, false, { gasLimit: 3_000_000 })).wait();
          const charged = before - await probe.remaining();
          assert.equal(receipt.status, 1);
          assert(charged > 0n && charged <= 2_000_000n);
          if (arm === 'stipend') assert.equal(charged, 2_000_000n);
          assert.equal(await probe.nonce(), occurrence === 'first' ? 1n : 2n);
          assert.equal(await probe.head(), keccak256(data));
          assert.equal(await probe.retained(keccak256(data)), data);
          rows.push({ arm, payloadBytes: length, occurrence, charged: String(charged), transactionGas: String(receipt.gasUsed) });
        }
      }
    }
  });
  console.log(JSON.stringify({ profile: 'budget-probe/1', evm: 'cancun', compiler: '0.8.30', fullC0: false, rows }));
});

test('foreign controller, native value and oversized input cannot create a side effect', { timeout: 30000 }, async () => {
  await withLabChain(async chain => {
    const probe = await deploy(chain.owner);
    for (const arm of ['stipend', 'measured']) {
      await assert.rejects(probe.connect(chain.stranger)[arm].staticCall('0xaa', 200_000, false));
      await assert.rejects(chain.owner.call({ to: await probe.getAddress(), value: 1n,
        data: probe.interface.encodeFunctionData(arm, ['0xaa', 200_000, false]) }));
      await assert.rejects(probe[arm].staticCall(hexlify(new Uint8Array(1025)), 2_000_000, false));
    }
    assert.equal(await probe.nonce(), 0n);
    assert.equal(await probe.remaining(), 20_000_000n);
    assert.equal(await probe.head(), `0x${'00'.repeat(32)}`);
  });
});

test('underfunded outer transaction fails without consuming a reservation or manufacturing budget diagnosis', { timeout: 30000 }, async () => {
  await withLabChain(async chain => {
    const probe = await deploy(chain.owner);
    const tx = await probe.stipend(hexlify(new Uint8Array(1024).fill(1)), 2_000_000, false, { gasLimit: 80_000 });
    await assert.rejects(tx.wait());
    assert.equal(await probe.nonce(), 0n);
    assert.equal(await probe.remaining(), 20_000_000n);
    assert.equal(await probe.retained(keccak256(hexlify(new Uint8Array(1024).fill(1)))), '0x');
  });
});
