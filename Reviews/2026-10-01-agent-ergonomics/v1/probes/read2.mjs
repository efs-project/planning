import { createEfsClient, lens } from '../dist/index.js'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
const publicClient = createPublicClient({ chain: sepolia, transport: http('https://ethereum-sepolia-rpc.publicnode.com') })
const efs = createEfsClient({ publicClient })
const J = (x) => efs.toJSON(x)
const C = lens(['0x11CbE1b619bb9fe79e2F4C22c9A62412b3E79912'])
const A = lens(['0x4F1a606508cA075F8cFBE06aC30a7C7aA023e89D'])
async function tryit(label, f) { const t=Date.now(); try { const r = await f(); console.log('OK ', label, `${Date.now()-t}ms`, typeof r === 'string' ? JSON.stringify(r.slice(0,200)) : J(r).slice(0,700)) } catch (e) { console.log('ERR', label, `${Date.now()-t}ms`, e.name, e.code ?? '', '::', e.message.slice(0,300)) } }
await tryit('read /games/pong.html', async () => { const r = await efs.fs.read('/games/pong.html', { lens: C }); return { v: r.verification, n: r.bytes.length, via: r.via, mirror: r.mirror ?? r.source } })
await tryit('readText /cypherpunk/cypherpunks-manifesto-full.md', () => efs.fs.readText('/cypherpunk/cypherpunks-manifesto-full.md', { lens: C }).then(s => s.slice(0,80)))
await tryit('list /agents/nanda-town-agent', async () => { const o=[]; for await (const e of efs.fs.list('/agents/nanda-town-agent', { lens: A })) o.push(e.kind+':'+e.name); return o })
await tryit('mirrors.list pong', () => efs.mirrors.list ? efs.mirrors.list('/games/pong.html', { lens: C }) : 'no mirrors.list')
await tryit('redirects', () => efs.redirects.canonical ? efs.redirects.canonical('/games/pong.html', { lens: C }) : Object.keys(efs.redirects))
await tryit('graph keys', async () => Object.keys(efs.graph).concat(Object.keys(efs.props), Object.keys(efs.lists), Object.keys(efs.index)))
await tryit('preview', () => efs.fs.preview('/x', new Uint8Array(1)))
await tryit('sorts', () => efs.sorts.get ? efs.sorts.get('/games') : Object.keys(efs.sorts))
