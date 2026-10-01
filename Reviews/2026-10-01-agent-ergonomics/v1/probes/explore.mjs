// Agent-as-user probe #1: cold exploration of live Sepolia, read-only.
import { createEfsClient } from '../dist/index.js'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
const RPC = process.env.RPC ?? 'https://ethereum-sepolia-rpc.publicnode.com'
const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC) })
const efs = createEfsClient({ publicClient })
const t0 = Date.now(); let rpc = 0
const show = (l, v) => console.log(l, typeof v === 'string' ? v : efs.toJSON(v))
async function walk(path, depth) {
  const out = []
  try {
    for await (const e of efs.fs.list(path)) { out.push(e); if (out.length > 40) break }
  } catch (e) { console.log('LIST FAIL', path, e.name, e.code, e.message); return }
  console.log(`${'  '.repeat(depth)}${path}  (${out.length} entries)`)
  for (const e of out) {
    console.log(`${'  '.repeat(depth+1)}${e.kind} ${JSON.stringify(e.name)}`)
    if (e.kind === 'dir' && depth < 1) await walk((path.endsWith('/')?path:path+'/') + e.name, depth + 1)
  }
}
await walk('/', 0)
console.log('walk ms', Date.now() - t0)
