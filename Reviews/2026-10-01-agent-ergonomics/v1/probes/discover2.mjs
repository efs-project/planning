import { createEfsClient, lens } from '../dist/index.js'
import { createPublicClient, http, decodeAbiParameters } from 'viem'
import { sepolia } from 'viem/chains'
const publicClient = createPublicClient({ chain: sepolia, transport: http('https://ethereum-sepolia-rpc.publicnode.com') })
const efs = createEfsClient({ publicClient })
const sch = {schema: "(skipped)"}
console.log('ANCHOR schema string:', sch.schema)
const root = await efs.raw.indexer.read.rootAnchorUID()
const kids = await efs.raw.indexer.read.getChildren([root, 0n, 50n, false, false])
const atts = new Set()
for (const uid of kids) {
  const a = await efs.raw.eas.read.getAttestation([uid])
  const [name] = decodeAbiParameters([{type:'string'},{type:'bytes32'}], a.data)
  console.log(' /' + name, 'by', a.attester); atts.add(a.attester)
}
for (const at of atts) {
  const names = []
  try { for await (const e of efs.fs.list('/', { lens: lens([at]) })) names.push(e.kind[0]+':'+e.name) } catch (e) { names.push('ERR '+e.name+' '+e.message) }
  console.log('lens', at, '→', names.join(' '))
}
