import { mk, account } from './local.mjs'
const efs = mk(); const L = { lens: account.address }
const ls = async p => { const o=[]; for await (const e of efs.fs.list(p, L)) o.push(e.kind+':'+e.name); return o }
console.log('list /agent-probe', await ls('/agent-probe'))
for (const p of ['/agent-probe/notes', '/agent-probe/notes/hello.txt']) {
  try { console.log('readText', p, JSON.stringify(await efs.fs.readText(p, L))) } catch (e) { console.log('readText', p, 'ERR', e.name, e.message.slice(0,200)) }
}
console.log('list /agent-probe/notes', await ls('/agent-probe/notes'))
// web3:// router view of the same paths (what a browser/gateway would see)
