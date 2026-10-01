import { mk, pc, account } from './local.mjs'
const efs = mk()
async function measure(label, f) {
  const b0 = await pc.getBlockNumber(); const t = Date.now(); await f(); const b1 = await pc.getBlockNumber()
  let gas = 0n, txs = 0
  for (let b = b0 + 1n; b <= b1; b++) { const blk = await pc.getBlock({ blockNumber: b, includeTransactions: true })
    for (const tx of blk.transactions) if (tx.from.toLowerCase() === account.address.toLowerCase()) { txs++; gas += (await pc.getTransactionReceipt({ hash: tx.hash })).gasUsed } }
  console.log(label, { txs, gas: gas.toString(), ms: Date.now() - t })
}
const enc = s => new TextEncoder().encode(s)
await measure('new 1KB file, existing folder', () => efs.fs.write('/agent-probe/notes/a.txt', enc('a'.repeat(1024)), { contentType: 'text/plain' }))
await measure('new 1KB file, 3 new folders', () => efs.fs.write('/agent-probe/x/y/z/b.txt', enc('b'.repeat(1024)), { contentType: 'text/plain' }))
await measure('overwrite 1KB', () => efs.fs.write('/agent-probe/notes/a.txt', enc('c'.repeat(1024)), { contentType: 'text/plain' }))
await measure('1KB with external mirror (no bytes on-chain)', () => efs.fs.write('/agent-probe/notes/m.txt', enc('d'.repeat(1024)), { contentType: 'text/plain', mirrors: ['ipfs://bafkreibcjpin4gtkxieeq3ujrcme656hmd5uyo6ucxg7v374gbgonchcoe'] }))
