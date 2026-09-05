import { createLabSdk, deriveRecordId } from '../../2026-09-04-mvp-rehearsal/sdk/index.js'

const operationKeys = ['kind', 'target', 'name', 'schemaId', 'data', 'salt', 'expectedRevision', 'nonce', 'deadline', 'grantId']
const hex = (value, bytes, name) => {
  if (typeof value !== 'string' || !new RegExp(`^0x[0-9a-fA-F]{${bytes * 2}}$`).test(value)) throw new TypeError(`${name} requires ${bytes}-byte hex`)
}
const basis = at => {
  if (at === 'latest' || (typeof at === 'bigint' && at >= 0n)) return
  if (typeof at === 'string') return hex(at, 32, 'at')
  if (at && typeof at.chainId === 'bigint' && typeof at.blockNumber === 'bigint' && typeof at.timestamp === 'bigint') return hex(at.blockHash, 32, 'at.blockHash')
  throw new TypeError('at requires an explicit block basis or latest')
}
const abortSignal = signal => {
  if (!signal || typeof signal.aborted !== 'boolean' || typeof signal.addEventListener !== 'function') throw new TypeError('AbortSignal required')
}
const freeze = value => {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value) }
  return value
}
const snapshot = value => freeze(structuredClone(value))
const usable = result => result.outcome === 'FOUND' && result.qualification.validation === 'VALID' && result.qualification.coverage === 'COMPLETE' && result.basis && result.value !== undefined
const cancelled = evidence => ({ status: 'CANCELLED', evidence })

/** Explicit experimental adapter. No C0 compatibility is implied. */
export function createLabClient(config) {
  if (!config?.deployment) throw new TypeError('deployment required')
  if (config.deployment.profile !== 'efs-lab/1') throw new TypeError('explicit efs-lab/1 profile required')
  hex(config.deployment.realmId, 32, 'realmId')
  if (typeof config.readProvider?.request !== 'function') throw new TypeError('readProvider required')
  if (typeof config.deployment.chainId !== 'bigint' || config.deployment.chainId <= 0n) throw new TypeError('positive bigint chainId required')
  const sdk = createLabSdk({ ...config, deployment: structuredClone(config.deployment) })
  const plans = new WeakMap(), approvals = new WeakMap(), submissions = new WeakMap()
  const handle = (map, evidence, extra = {}) => {
    const value = Object.freeze({ profile: 'efs-lab/1', evidence: snapshot(evidence) })
    map.set(value, { evidence: value.evidence, consumed: false, ...extra })
    return value
  }
  const lookup = (map, value, name, consume = false) => {
    const state = map.get(value)
    if (!state) throw new TypeError(`local ${name} handle required`)
    if (state.consumed) throw new Error(`${name} already consumed`)
    if (consume) state.consumed = true
    return state
  }

  async function readFile({ id, at }) {
    const raw = { node: await sdk.readExact({ kind: 'node', id, blockTag: at }) }
    if (!usable(raw.node)) return { raw }
    if (Number(raw.node.value.kind) !== 2) return { raw, reason: 'NOT_A_FILE' }
    raw.revision = await sdk.readExact({ kind: 'revision', file: id, revision: raw.node.value.revision, blockTag: raw.node.basis })
    if (!usable(raw.revision)) return { raw }
    raw.bytes = await sdk.readVerifiedBytes({ contentId: raw.revision.value.contentId, blockTag: raw.node.basis })
    if (!usable(raw.bytes) || raw.bytes.qualification.integrity !== 'VERIFIED') return { raw }
    return { value: { id, revision: raw.node.value.revision, bytes: raw.bytes.value.bytes }, raw }
  }

  async function readRecord({ id, schemaId, at }) {
    const raw = { record: await sdk.readExact({ kind: 'record', id, blockTag: at }) }
    if (!usable(raw.record)) return { raw }
    if (raw.record.value.schemaId.toLowerCase() !== schemaId.toLowerCase()) return { raw, reason: 'SCHEMA_MISMATCH' }
    raw.bytes = await sdk.readVerifiedBytes({ contentId: raw.record.value.contentId, blockTag: raw.record.basis })
    if (!usable(raw.bytes) || raw.bytes.qualification.integrity !== 'VERIFIED') return { raw }
    const computedRecordId = deriveRecordId({ schemaId, data: raw.bytes.value.bytes })
    if (computedRecordId !== id.toLowerCase()) return { raw, reason: 'RECORD_ID_MISMATCH', computedRecordId }
    raw.typed = await sdk.validateTypedPayloadAtBasis({ schemaId, data: raw.bytes.value.bytes, blockTag: raw.record.basis })
    if (raw.typed.valid !== true || raw.typed.qualification.validation !== 'VALID' || raw.typed.qualification.integrity !== 'VERIFIED') return { raw }
    return { value: { id, schemaId, fields: raw.typed.fields, bytes: raw.bytes.value.bytes }, raw }
  }

  return Object.freeze({
    profile: 'efs-lab/1',
    files: Object.freeze({
      list({ directory, cursor, limit, at }) {
        hex(directory, 32, 'directory'); basis(at)
        if (typeof cursor !== 'bigint' || cursor < 0n) throw new TypeError('nonnegative bigint cursor required')
        if (!Number.isInteger(limit) || limit < 1 || limit > 64) throw new TypeError('limit must be 1..64')
        return sdk.readPage({ kind: 'children', directory, cursor, limit, blockTag: snapshot(at) })
      },
      read(request) { hex(request.id, 32, 'id'); basis(request.at); return readFile({ ...request, at: snapshot(request.at) }) },
    }),
    records: Object.freeze({
      read(request) { hex(request.id, 32, 'id'); hex(request.schemaId, 32, 'schemaId'); basis(request.at); return readRecord({ ...request, at: snapshot(request.at) }) },
    }),
    writes: Object.freeze({
      plan(request) {
        if (!request?.operation || operationKeys.some(key => request.operation[key] === undefined)) throw new TypeError('complete explicit operation required')
        if (!Number.isInteger(request.operation.kind) || request.operation.kind < 1 || request.operation.kind > 4) throw new TypeError('operation.kind must be 1..4')
        if (typeof request.operation.name !== 'string') throw new TypeError('operation.name requires string')
        for (const key of ['target', 'schemaId', 'salt', 'grantId']) hex(request.operation[key], 32, `operation.${key}`)
        for (const key of ['expectedRevision', 'nonce', 'deadline']) if (typeof request.operation[key] !== 'bigint') throw new TypeError(`operation.${key} requires bigint`)
        if (typeof request.operation.data !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(request.operation.data)) throw new TypeError('operation.data requires exact hex bytes')
        return handle(plans, sdk.planWrite(request))
      },
      async approve(plan, { policy, decide, signal } = {}) {
        abortSignal(signal)
        if (!policy || !['direct', 'relayed'].includes(policy.mode)) throw new TypeError('explicit direct or relayed policy required')
        hex(policy.account, 20, 'account')
        if (policy.mode === 'relayed') hex(policy.submitter, 20, 'submitter')
        if (typeof decide !== 'function') throw new TypeError('decide callback required')
        const selected = snapshot(policy)
        const state = lookup(plans, plan, 'plan', true)
        const evidence = { plan: state.evidence, policy: selected }
        if (signal.aborted) return cancelled(evidence)
        const decision = await decide(Object.freeze({ evidence: state.evidence, policy: selected, signal }))
        if (signal.aborted) return cancelled(evidence)
        if (typeof decision !== 'boolean') throw new TypeError('decision must be boolean')
        if (!decision) return { status: 'DECLINED', evidence }
        const prepared = await sdk.prepareWrite(state.evidence, selected)
        evidence.prepared = prepared
        if (signal.aborted) return cancelled(evidence)
        return { status: 'APPROVED', approval: handle(approvals, prepared, { policy: selected, signal }) }
      },
      async submit(approval, { signal } = {}) {
        abortSignal(signal)
        const state = lookup(approvals, approval, 'approval', true)
        if (signal.aborted || state.signal.aborted) return cancelled({ prepared: state.evidence })
        // Consume before crossing the provider boundary, including ambiguous failures.
        // Cancellation after this call starts cannot retract a sent transaction.
        try {
          const submitted = await sdk.submitWrite(state.evidence, { from: state.policy.mode === 'relayed' ? state.policy.submitter : state.policy.account })
          return { status: 'SUBMITTED', submission: handle(submissions, submitted) }
        } catch (error) {
          return { status: 'UNKNOWN', evidence: { prepared: state.evidence, error } }
        }
      },
      async verify(submission, { at, maxReceipts, maxPages } = {}) {
        basis(at)
        if (!Number.isInteger(maxReceipts) || maxReceipts < 1 || maxReceipts > 0xffffffff) throw new TypeError('explicit maxReceipts in 1..uint32 required')
        if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 64) throw new TypeError('explicit maxPages in 1..64 required')
        const state = lookup(submissions, submission, 'submission')
        return sdk.readBack(state.evidence, { blockTag: snapshot(at), maxReceipts, maxPages })
      },
    }),
  })
}
