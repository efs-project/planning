// Shared helper: build an SDK client for the disposable fork at :8617 (hardhat test account #1).
import { readFileSync } from 'node:fs'
import { createEfsV1Client, deployments, indexerAbi, listResolverAbi, listEntryResolverAbi, aliasResolverAbi } from '../dist/index.js'
import { createPublicClient, createWalletClient, http, defineChain, getAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
const D = '/private/tmp/claude-501/-Users-james-Code-EFS/1fb012dc-c610-45cc-8268-c405872b98d5/scratchpad/c-agent/packages/hardhat/deployments/localhost/'
const addr = (n) => getAddress(JSON.parse(readFileSync(D + n + '.json', 'utf8')).address)
export const chain = defineChain({ id: 31337, name: 'fork', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: ['http://127.0.0.1:8617'] } } })
export const pc = createPublicClient({ chain, transport: http() })
const c = { eas: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e', schemaRegistry: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0',
  indexer: addr('Indexer'), router: addr('EFSRouter'), fileView: addr('EFSFileView'), edgeResolver: addr('EdgeResolver'),
  mirrorResolver: addr('MirrorResolver'), listResolver: addr('ListResolver'), listEntryResolver: addr('ListEntryResolver'),
  listReader: addr('ListReader'), aliasResolver: addr('AliasResolver'), systemAccount: addr('SystemAccount') }
const r = (a, abi, fn) => pc.readContract({ address: a, abi, functionName: fn })
const schemas = {}
for (const [k, fn] of [['anchor','ANCHOR_SCHEMA_UID'],['property','PROPERTY_SCHEMA_UID'],['data','DATA_SCHEMA_UID'],['pin','PIN_SCHEMA_UID'],['tag','TAG_SCHEMA_UID'],['mirror','MIRROR_SCHEMA_UID']]) {
  try { schemas[k] = await r(c.indexer, indexerAbi, fn) } catch (e) { schemas[k] = 'ERR:' + e.shortMessage }
}
schemas.list = await r(c.listResolver, listResolverAbi, 'listSchemaUID').catch(e => 'ERR:' + e.shortMessage)
schemas.listEntry = await r(c.listEntryResolver, listEntryResolverAbi, 'listEntrySchemaUID').catch(e => 'ERR:' + e.shortMessage)
schemas.redirect = await r(c.aliasResolver, aliasResolverAbi, 'redirectSchemaUID').catch(e => 'ERR:' + e.shortMessage)
export const dep = { chainId: 31337, contracts: c, schemas }
// Hardhat's publicly-known test account #1 (local fork only).
export const account = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d')
export const wc = createWalletClient({ chain, transport: http(), account })
export const mk = (extra = {}) => createEfsV1Client({ publicClient: pc, walletClient: wc, deployments: { ...deployments, 31337: dep }, ...extra })
