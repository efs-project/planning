// Offline retained-evidence diagnostic; it does not authenticate a chain header.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { Transaction, keccak256 } from '/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';

export function audit(packet) {
  const rows = [...packet.artifacts, ...packet.operations];
  assert.equal(rows.length, 18);
  const checked = [];
  for (const row of rows) {
    const { transaction: t, receipt: r, header: h } = row.exact;
    const tx = Transaction.from({ type: Number(t.type), chainId: BigInt(t.chainId), nonce: Number(t.nonce), gasLimit: BigInt(t.gas), maxFeePerGas: BigInt(t.maxFeePerGas), maxPriorityFeePerGas: BigInt(t.maxPriorityFeePerGas), to: t.to, value: BigInt(t.value), accessList: t.accessList, data: t.input, signature: { r: t.r, s: t.s, yParity: Number(t.yParity) } });
    assert.equal(tx.hash, t.hash);
    assert.equal(tx.from.toLowerCase(), t.from.toLowerCase());
    assert.equal(t.hash, r.transactionHash);
    assert.equal(t.blockHash, r.blockHash);
    assert.equal(h.hash, r.blockHash);
    assert.equal(h.number, r.blockNumber);
    assert.equal(t.blockNumber, r.blockNumber);
    assert.equal(t.transactionIndex, r.transactionIndex);
    assert.equal(h.transactions[Number(r.transactionIndex)], t.hash);
    assert.equal(BigInt(h.gasUsed), BigInt(r.cumulativeGasUsed));
    assert(BigInt(r.gasUsed) <= BigInt(t.gas));
    assert(BigInt(h.gasUsed) <= BigInt(h.gasLimit));
    assert.equal(BigInt(h.gasLimit), 30000000n);
    if (row.gasUsed) assert.equal(BigInt(row.gasUsed), BigInt(r.gasUsed));
    if (row.runtime) {
      assert.equal(keccak256(row.runtime), row.runtimeHash);
      assert.equal(keccak256(t.input), row.initcodeHash);
      assert.equal(tx.to, null);
    }
    checked.push({ operation: row.operation, status: Number(r.status), gas: BigInt(r.gasUsed).toString(), signedHash: t.hash, recoveredSender: tx.from, block: r.blockNumber });
  }
  return { standing: 'Offline signed-transaction and retained receipt/header consistency, not authenticated chain-state proof; aggregate gas is across restored branches, not one canonical-chain bill.', transactions: checked.length, deploymentGas: checked.slice(0, 8).reduce((s, r) => s + BigInt(r.gas), 0n).toString(), allRowsGas: checked.reduce((s, r) => s + BigInt(r.gas), 0n).toString(), rows: checked };
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  const packet = JSON.parse(fs.readFileSync(process.argv[2]));
  const result = audit(packet);
  const wrongHash = structuredClone(packet);
  wrongHash.operations[0].exact.receipt.transactionHash = '0x' + '00'.repeat(32);
  assert.throws(() => audit(wrongHash));
  const wrongGas = structuredClone(packet);
  wrongGas.operations[0].gasUsed = '1';
  assert.throws(() => audit(wrongGas));
  result.mutationChecks = ['changed receipt transaction hash rejected', 'changed reported gas rejected'];
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ transactions: result.transactions, deploymentGas: result.deploymentGas, mutationChecks: result.mutationChecks }));
}
