import { createLabClient, type Config, type LabClient, type Policy, type Operation, type Hex } from './lab-only.mjs'
import { createLabReader, type ReaderConfig } from './reader.mjs'

// The application supplies the network, trusted deployment, providers and UI.
export async function readExamples(config: ReaderConfig, fileId: Hex, recordId: Hex, schemaId: Hex) {
  const client = createLabReader(config) // no wallet config and no write capability
  const page = await client.files.list({ directory: config.deployment.rootId, cursor: 0n, limit: 16, at: 'latest' })
  if (page.qualification.coverage === 'PARTIAL') console.log('Only this page is known', page.items, page.continuation)
  else if (page.outcome === 'UNKNOWN') console.log('Listing unavailable', page.evidence)
  const file = await client.files.read({ id: fileId, at: 'latest' })
  if (file.value) console.log('Verified file bytes', file.value.bytes)
  else console.log('Inspect the exact unresolved read', file.raw, file.reason)
  const record = await client.records.read({ id: recordId, schemaId, at: 'latest' })
  // No unchecked generic T cast: use the lab-validated field values and narrow.
  if (record.value && typeof record.value.fields[0] === 'bigint') console.log('Exact integer', record.value.fields[0])
  else console.log('Unknown, invalid, or unexpected application shape', record.raw, record.reason)
  return { page, file, record }
}

export async function writeExample(config: Config, operation: Operation, policy: Policy, signal: AbortSignal, decide: Parameters<LabClient['writes']['approve']>[1]['decide']) {
  const client = createLabClient(config)
  const plan = client.writes.plan({ operation }) // deterministic; no RPC or wallet
  const approval = await client.writes.approve(plan, {
    // The application supplies its actual review UI/policy; no approve default.
    policy, signal, decide,
  })
  if (approval.status !== 'APPROVED') return approval // DECLINED or CANCELLED
  const sent = await client.writes.submit(approval.approval, { signal })
  if (sent.status !== 'SUBMITTED') return sent // UNKNOWN: reconcile, never resubmit automatically
  const verified = await client.writes.verify(sent.submission, { at: 'latest', maxReceipts: 128, maxPages: 4 })
  if (verified.stage === 'READ_BACK_VERIFIED' && verified.effect === 'COMMITTED') console.log('Independently verified', verified.stage, verified.qualification.authority)
  else console.log('Only progress or unresolved evidence', verified.comparison, verified.qualification)
  return verified
}
