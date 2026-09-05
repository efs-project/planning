import { createLabClient, type Config, type Operation, type Policy } from './lab-only.mjs'
import { createLabReader, type ReaderConfig } from './reader.mjs'
declare const readerConfig: ReaderConfig
const reader = createLabReader(readerConfig)
// @ts-expect-error reader-only callers cannot write
reader.writes.plan({ operation: {} })
// @ts-expect-error reader entry point cannot accept wallet capabilities
createLabReader({ ...readerConfig, walletProvider: readerConfig.readProvider })
declare const config: Config
declare const operation: Operation
const client = createLabClient(config)
const plan = client.writes.plan({ operation })
// @ts-expect-error explicit profile is not C0
const profile: Config['deployment']['profile'] = 'efs-c0/1'
// @ts-expect-error missing explicit read basis
client.files.read({ id: config.deployment.rootId })
// @ts-expect-error no ambient account or approval policy
client.writes.approve(plan, { decide: async () => true, signal: new AbortController().signal })
// @ts-expect-error a plan cannot be submitted
client.writes.submit(plan, { signal: new AbortController().signal })
// @ts-expect-error inclusion requires a submission handle, not a plan
client.writes.verify(plan, { at: 'latest', maxReceipts: 128, maxPages: 4 })
// @ts-expect-error relay account cannot be implicit
const policy: Policy = { mode: 'relayed', account: config.deployment.owner }
// @ts-expect-error reads cannot masquerade as arbitrary typed application values
client.records.read<{ score: number }>({ id: config.deployment.rootId, schemaId: config.deployment.rootId, at: 'latest' })
void profile; void policy
