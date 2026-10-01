import { mk, pc, account } from './local.mjs'
const efs = mk()
const b0 = await pc.getBlockNumber()
await efs.fs.write('/agent-probe/notes/e.txt', new TextEncoder().encode('e'.repeat(1024)), { contentType: 'text/plain' })
const b1 = await pc.getBlockNumber()
for (let b = b0 + 1n; b <= b1; b++) { const blk = await pc.getBlock({ blockNumber: b, includeTransactions: true })
  for (const tx of blk.transactions) { const r = await pc.getTransactionReceipt({ hash: tx.hash }); console.log('block', b, 'to', tx.to?.slice(0,10) ?? 'CREATE', 'sel', tx.input.slice(0,10), 'gas', r.gasUsed, 'logs', r.logs.length) } }
