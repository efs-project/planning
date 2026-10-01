import { mk, account, dep, pc } from './local.mjs'
import { routerAbi } from '../dist/index.js'
const efs = mk()
const call = async (segs, params=[]) => { try { const r = await pc.readContract({ address: dep.contracts.router, abi: routerAbi, functionName: 'request', args: [segs, params] }); const [status, body, headers] = r; console.log(segs.join('/'), JSON.stringify(params), '→', status, JSON.stringify(Buffer.from(body.slice(2),'hex').toString('utf8').slice(0,160)), JSON.stringify(headers).slice(0,200)) } catch (e) { console.log(segs.join('/'), 'ERR', e.shortMessage) } }
await call(['agent-probe','notes','hello.txt'])
await call(['agent-probe','notes','hello.txt'], [{ key: 'lenses', value: account.address }])
await call(['agent-probe','notes'], [{ key: 'lenses', value: account.address }])
await call(['agent-probe','interrupted','report.md'], [{ key: 'lenses', value: account.address }])
await call(['agent-probe'], [{ key: 'lenses', value: account.address }])
