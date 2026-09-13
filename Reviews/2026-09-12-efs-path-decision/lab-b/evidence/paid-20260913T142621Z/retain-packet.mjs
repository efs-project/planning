// Copy generated evidence without changing it. This checks receipt consistency,
// not architecture semantics or chain-state authenticity.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, mkdirSync, copyFileSync, writeFileSync, constants } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Transaction, keccak256 } = require('/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers');
const run = '/tmp/efs-paid-b-run-20260913.Kf4SOz';
const target = '/Users/james/Code/EFS/planning-warroom-b-run/Reviews/2026-09-12-efs-path-decision/lab-b/evidence/paid-20260913T142621Z';
const sha = b => createHash('sha256').update(b).digest('hex');
const r = JSON.parse(readFileSync(join(run, 'measure.json')));
const c = r.cells['joined/paid-slice'];
assert.equal(r.failure, null); assert.equal(r.consumerMismatches, 0);
assert.deepEqual(r.executedCells, ['joined/paid-slice']);
const txs = [...r.setupTransactions, ...c.transactions];
assert.equal(txs.length, 34);
for (const t of txs) {
  const receipt = t.rpc.getTransactionReceipt.response.result;
  const observedTx = t.rpc.getTransactionByHash.response.result;
  assert.equal(receipt.status, '0x1');
  assert.equal(BigInt(receipt.gasUsed).toString(), t.receipt.gasUsed);
  assert.equal(receipt.transactionHash.toLowerCase(), t.hash.toLowerCase());
  assert.equal(keccak256(t.rawTransaction), t.hash.toLowerCase());
  const decoded = Transaction.from(t.rawTransaction);
  assert.equal(decoded.from.toLowerCase(), t.from.toLowerCase());
  assert.equal(decoded.data.toLowerCase(), t.data.toLowerCase());
  assert.equal(observedTx.input.toLowerCase(), t.data.toLowerCase());
  assert.equal(observedTx.blockHash, receipt.blockHash);
}
const after = JSON.parse(readFileSync(join(run, 'controller/ack-afterB1.json'))).sealedCheckpoint;
for (const t of c.transactions.slice(4)) {
  const b = t.rpc.getBlockByHash.response.result;
  assert.deepEqual(b.transactions, [t.hash]);
  assert.equal(b.parentHash, after.blockHash);
  assert.equal(BigInt(b.timestamp), BigInt(after.timestamp) + 1n);
  assert.equal(t.receipt.transactionIndex, 0);
}
const totals = { grade: 'RPC_OBSERVED; receipt consistency only, not state proof',
  receiptCount: txs.length,
  setupGas: r.setupTransactions.reduce((s,t) => s + BigInt(t.receipt.gasUsed), 0n).toString(),
  fixtureAndPaidRows: c.transactions.map(t => ({ label: t.label.split(' (')[0], gas: t.receipt.gasUsed, hash: t.hash })),
};
const files = ['arm-b.json', 'assemble-arm.mjs', 'launch.log', 'measure.json', 'retain-packet.mjs'];
for (const dir of ['controller', 'independent-observations']) {
  for (const file of readdirSync(join(run, dir)).sort()) files.push(`${dir}/${file}`);
}
mkdirSync(target, { recursive: false });
const hashes = {};
for (const file of files) {
  const destination = join(target, file);
  if (file.includes('/')) mkdirSync(join(target, file.split('/')[0]), { recursive: true });
  copyFileSync(join(run,file), destination, constants.COPYFILE_EXCL);
  hashes[file] = sha(readFileSync(destination));
  assert.equal(hashes[file], sha(readFileSync(join(run,file))));
}
writeFileSync(join(target,'receipt-check.json'), `${JSON.stringify(totals,null,2)}\n`, { flag:'wx' });
hashes['receipt-check.json'] = sha(readFileSync(join(target,'receipt-check.json')));
writeFileSync(join(target,'SHA256.json'), `${JSON.stringify(hashes,null,2)}\n`, { flag:'wx' });
console.log(JSON.stringify({target, files:Object.keys(hashes).length, ...totals},null,2));
