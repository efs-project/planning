import { createEfsClient, lens } from '../dist/index.js'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
const efs = createEfsClient({ publicClient: createPublicClient({ chain: sepolia, transport: http('https://ethereum-sepolia-rpc.publicnode.com') }) })
const C11 = '0x11CbE1b619bb9fe79e2F4C22c9A62412b3E79912'
const ref = await efs.fs.locate('/games/pong.html', { lens: lens([C11]) })
for (const [l, o] of [['Lens obj', { lens: lens([C11]) }], ['address', { lens: C11 }], ['array', { lens: [C11] }], ['none', undefined]]) {
  try { const m = await efs.mirrors.list(ref.data.uid, o); console.log(l, efs.toJSON(m).slice(0,400)) } catch (e) { console.log(l, 'ERR', e.name, e.message.slice(0,200)) }
}
try { console.log('canonical', efs.toJSON(await efs.redirects.canonical(ref.data.uid, { lens: lens([C11]) }))) } catch (e) { console.log('canon ERR', e.name, e.message.slice(0,200)) }
try { console.log('history', efs.toJSON(await efs.redirects.history(ref.data.uid, { lens: lens([C11]) }))) } catch (e) { console.log('hist ERR', e.name, e.message.slice(0,200)) }
try { const a = await efs.eas.attestationsFor(ref.data.uid); console.log('attestationsFor', efs.toJSON(a).slice(0,300)) } catch (e) { console.log('attFor ERR', e.name, e.message.slice(0,200)) }
