import { mk, account, pc } from './local.mjs'
const efs = mk(); const L = { lens: account.address }
const enc = s => new TextEncoder().encode(s)
const P = '/agent-probe/interrupted/report.md'
const ac = new AbortController()
let err
const b0 = await pc.getBlockNumber()
try {
  await efs.fs.write(P, enc('# half'), { contentType: 'text/markdown', signal: ac.signal,
    onProgress: p => { console.log('progress', p); if (p.step === 3) ac.abort() } })
  console.log('write completed despite abort')
} catch (e) { err = e
  console.log('ERR', e.name, e.code, '::', e.message.slice(0,600))
  console.log('fields', Object.keys(e), 'layer', e.layer, 'landed type', e.landed?.constructor?.name, 'size', e.landed?.size)
  console.log('landed', e.landed ? [...e.landed.entries()].map(([k,v]) => k + '=' + String(v).slice(0,12)) : null)
  console.log('toJSON(err)', efs.toJSON(e).slice(0,300))
}
console.log('blocks mined during attempt', (await pc.getBlockNumber()) - b0)
const show = async () => { try { console.log('  read:', JSON.stringify(await efs.fs.readText(P, L))) } catch (e) { console.log('  read ERR', e.name, e.message.slice(0,160)) }
  try { const o=[]; for await (const e of efs.fs.list('/agent-probe/interrupted', L)) o.push(e.kind+':'+e.name); console.log('  list:', o) } catch (e) { console.log('  list ERR', e.name, e.message.slice(0,160)) } }
console.log('state after interruption:'); await show()
// naive agent recovery: just retry the same call
const b1 = await pc.getBlockNumber()
try { const r = await efs.fs.write(P, enc('# half'), { contentType: 'text/markdown' }); console.log('retry OK, steps:', r.steps.map(s => s.id).join(',')) }
catch (e) { console.log('retry ERR', e.name, e.code, e.message.slice(0,400)) }
console.log('blocks mined during retry', (await pc.getBlockNumber()) - b1)
console.log('state after retry:'); await show()
// what about resume?
try { await efs.fs.write(P, enc('# half'), { resume: { profile: 'efs/v1', steps: [] } }) } catch (e) { console.log('resume ERR', e.name, e.code, e.message.slice(0,250)) }
