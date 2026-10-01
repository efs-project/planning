// Probe #2: "who has written anything?" — what an agent must do with raw views.
import { createEfsClient } from '../dist/index.js'
import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
const publicClient = createPublicClient({ chain: sepolia, transport: http('https://ethereum-sepolia-rpc.publicnode.com') })
const efs = createEfsClient({ publicClient })
const ix = efs.raw.indexer
const eas = efs.raw.eas
const root = await ix.read.rootAnchorUID()
console.log('root', root)
const n = await ix.read.getChildrenCount([root])
console.log('root children (all attesters):', n)
const kids = await ix.read.getChildren([root, 0n, n, false, false])
const byAtt = new Map()
for (const uid of kids) {
  const a = await eas.read.getAttestation([uid])
  // ANCHOR data = (string name, bytes32 schema)? decode loosely
  const dec = efs.eas ? null : null
  byAtt.set(a.attester, (byAtt.get(a.attester) ?? 0) + 1)
}
console.log('root child anchors by attester', Object.fromEntries(byAtt))
// global DATA / PIN counts and distinct attesters among most recent
const S = (await import('../dist/index.js'))
for (const [k, uid] of Object.entries({ data: '0xa3400cecc384d66d84f502fd91e56dc0321edccde9ef8e49d303ba63cc841b3c', pin: '0x5aaabaea19accff34c604f6f1b0dd2361a0a9ba64f7746ea6b3ed95d4047d878', tag:'0x0c41f8ee209fdbea4de3942c488a4098dd5a8bb1afce117857c5493002dd0e87', anchor:'0xf818abd74da70345c8acd7087e6ce69fd48eaf4e79c1931e5c6b08fb148c921a' })) {
  const c = await ix.read.getAttestationCountBySchema([uid])
  const recent = await ix.read.getAttestationsBySchema([uid, 0n, c < 60n ? c : 60n, true, false])
  const atts = new Map()
  for (const u of recent) { const a = await eas.read.getAttestation([u]); atts.set(a.attester, (atts.get(a.attester)??0)+1) }
  console.log(k, 'total', c, 'recent-60 attesters', Object.fromEntries(atts))
}
