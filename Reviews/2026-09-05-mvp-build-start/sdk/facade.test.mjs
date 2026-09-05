import assert from 'node:assert/strict'
import test from 'node:test'
import { createLabClient } from './lab-only.mjs'
import { createLabReader } from './reader.mjs'
import { readExamples, writeExample } from './examples.mts'
import { withLabChain, TX_GAS, send } from '../../2026-09-04-mvp-rehearsal/scripts/local-chain.mjs'
import { createLabSdk, deriveSchemaId, deriveRecordId } from '../../2026-09-04-mvp-rehearsal/sdk/index.js'

const zero = `0x${'00'.repeat(32)}`
const signal = () => new AbortController().signal
const operation = (lab, nonce, name = 'note.txt') => ({ kind: 2, target: lab.deployment.rootId, name, data: '0x6869', schemaId: zero, salt: `0x${'11'.repeat(32)}`, expectedRevision: 0n, nonce, deadline: 9999999999n, grantId: zero })

test('runtime boundary rejects missing or disguised profiles before any provider call', () => {
  assert.throws(() => createLabClient({}), /deployment/)
  assert.throws(() => createLabClient({ deployment: { profile: 'efs-c0/1' } }), /efs-lab\/1/)
})

test('lab-only facade composes actual SDK reads and one-use writes', { timeout: 120000 }, async t => {
  await withLabChain(async lab => {
    const calls = []
    let hideTransaction = false
    const rpc = { async request(request) {
      calls.push(request)
      if (hideTransaction && request.method === 'eth_getTransactionByHash') return null
      const params = request.method === 'eth_sendTransaction' ? [{ ...request.params[0], gas: `0x${TX_GAS.toString(16)}` }] : request.params
      return lab.provider.send(request.method, params ?? [])
    } }
    const config = { deployment: { ...lab.deployment, realmId: lab.deployment.runId }, readProvider: rpc }
    const client = createLabClient({ ...config, walletProvider: rpc, relayProvider: rpc })
    const policy = { mode: 'direct', account: lab.deployment.owner }
    let sent, fileId

    await t.test('construction and planning need neither RPC nor wallet; incomplete JS operations rejected', () => {
      assert.equal(calls.length, 0)
      const guest = createLabClient(config)
      assert.equal(guest.writes.plan({ operation: operation(lab, 0n) }).evidence.stage, 'PLANNED')
      assert.equal(calls.length, 0)
      assert.throws(() => guest.writes.plan({ operation: { kind: 2 } }), /operation/)
      assert.throws(() => guest.writes.plan({ operation: { ...operation(lab, 0n), nonce: '0' } }), /bigint/)
      assert.throws(() => guest.writes.plan({ operation: { ...operation(lab, 0n), data: 'not hex' } }), /data/)
      assert.throws(() => guest.writes.plan({ operation: { ...operation(lab, 0n), schemaId: null } }), /schemaId/)
      assert.throws(() => guest.writes.plan({ operation: { ...operation(lab, 0n), kind: '2' } }), /kind/)
      assert.throws(() => guest.files.list({ directory: zero, cursor: 0n, limit: 2 }), /at/)
      assert.throws(() => guest.files.read({ id: '0x12', at: 'latest' }), /32-byte/)
    })
    await t.test('reader-only entry point exposes no write capabilities or wallet config', async () => {
      const reader = createLabReader(config)
      assert.equal('writes' in reader, false)
      assert.throws(() => createLabReader({ ...config, walletProvider: rpc }), /reader/)
      const result = await reader.files.list({ directory: config.deployment.rootId, cursor: 0n, limit: 1, at: 'latest' })
      assert.equal(result.outcome, 'ABSENT_PROVEN')
      assert.equal(result.qualification.coverage, 'COMPLETE')
    })
    await t.test('real write needs explicit decision and independent read-back', async () => {
      const plan = client.writes.plan({ operation: operation(lab, 0n) })
      assert(Object.isFrozen(plan.evidence.operation))
      const approval = await client.writes.approve(plan, { policy, signal: signal(), decide: async () => true })
      assert.equal(approval.status, 'APPROVED')
      assert.equal(calls.filter(c => c.method === 'eth_sendTransaction').length, 0)
      sent = await client.writes.submit(approval.approval, { signal: signal() })
      assert.equal(sent.status, 'SUBMITTED')
      assert.equal(sent.submission.evidence.qualification.effect, 'UNKNOWN')
      const verified = await client.writes.verify(sent.submission, { at: 'latest', maxReceipts: 128, maxPages: 4 })
      assert.equal(verified.stage, 'READ_BACK_VERIFIED')
      assert.equal(verified.effect, 'COMMITTED')
      assert.equal(verified.qualification.authority, 'AUTHORIZED_AT_BASIS')
      assert(verified.evidence.some(e => e.responseBytes))
      fileId = verified.predicted.resultId
      await assert.rejects(client.writes.submit(approval.approval, { signal: signal() }), /consumed/)
      await assert.rejects(client.writes.submit(plan, { signal: signal() }), /approval/)
    })
    await t.test('file read pins all component reads and preserves raw bytes and evidence', async () => {
      const file = await client.files.read({ id: fileId, at: 'latest' })
      assert.equal(file.value.bytes, '0x6869')
      assert.equal(file.raw.bytes.observedBytes, '0x6869')
      assert.equal(file.raw.node.basis.blockHash, file.raw.bytes.basis.blockHash)
      assert.equal(file.raw.revision.basis.blockHash, file.raw.bytes.basis.blockHash)
      const at = { ...file.raw.node.basis }
      const pending = client.files.read({ id: fileId, at })
      at.chainId = 1n
      assert.equal((await pending).value?.bytes, '0x6869', 'caller mutation must not change an in-flight source context')
    })
    await t.test('partial suffix and provider outage never become empty complete success', async () => {
      const page = await client.files.list({ directory: lab.deployment.rootId, cursor: 1n, limit: 1, at: 'latest' })
      assert.equal(page.qualification.coverage, 'PARTIAL')
      const offline = createLabClient({ ...config, readProvider: { request: async () => { throw new Error('offline') } } })
      const absent = await offline.files.read({ id: fileId, at: 'latest' })
      assert.equal(absent.value, undefined)
      assert.equal(absent.raw.node.outcome, 'UNKNOWN')
      assert(absent.raw.node.evidence.length > 0)
    })
    await t.test('typed records validate bytes, schema and requested record identity', async () => {
      const schemaId = deriveSchemaId('0x01')
      await send(lab.core.registerSchema, '0x01')
      const old = createLabSdk({ ...config, walletProvider: rpc })
      const op = { ...operation(lab, await lab.core.ownerNonce()), kind: 4, name: '', salt: zero, data: '0x000000000000002a', schemaId }
      const prepared = await old.prepareWrite(old.planWrite({ operation: op }), policy)
      await old.submitWrite(prepared)
      const id = deriveRecordId({ schemaId, data: op.data })
      const result = await client.records.read({ id, schemaId, at: 'latest' })
      assert.deepEqual(result.value.fields, [42n])
      assert.equal(result.raw.typed.valid, true)
      const mismatch = await client.records.read({ id, schemaId: zero, at: 'latest' })
      assert.equal(mismatch.value, undefined)
      assert.equal(mismatch.reason, 'SCHEMA_MISMATCH')
    })
    await t.test('abort before decision and during async decision fences wallet and submission', async () => {
      for (const before of [true, false]) {
        const controller = new AbortController()
        if (before) controller.abort('closed')
        let decisions = 0
        const start = calls.length
        const plan = client.writes.plan({ operation: operation(lab, await lab.core.ownerNonce(), `cancel-${before}`) })
        const approved = await client.writes.approve(plan, { policy, signal: controller.signal, decide: async () => { decisions++; await Promise.resolve(); controller.abort('closed'); return true } })
        assert.equal(approved.status, 'CANCELLED')
        assert.equal(decisions, before ? 0 : 1)
        assert.equal(calls.length, start)
      }
    })
    await t.test('abort after wallet signature fences submission and keeps signed evidence', async () => {
      const controller = new AbortController()
      const wallet = { async request(request) { const result = await rpc.request(request); controller.abort('closed'); return result } }
      const c = createLabClient({ ...config, walletProvider: wallet, relayProvider: rpc })
      const plan = c.writes.plan({ operation: operation(lab, await lab.core.ownerNonce(), 'cancel-signature') })
      const count = calls.filter(c => c.method === 'eth_sendTransaction').length
      const approved = await c.writes.approve(plan, { policy: { mode: 'relayed', account: lab.deployment.owner, submitter: await lab.relay.getAddress() }, signal: controller.signal, decide: async () => true })
      assert.equal(approved.status, 'CANCELLED')
      assert(approved.evidence.prepared.providerEvidence.length > 0)
      assert.equal(calls.filter(c => c.method === 'eth_sendTransaction').length, count)
    })
    await t.test('uncertain submission preserves error evidence and cannot be sent twice', async () => {
      let sends = 0
      const failure = Object.assign(new Error('transport lost after send'), { code: 4900 })
      const wallet = { async request() { sends++; throw failure } }
      const c = createLabClient({ ...config, walletProvider: wallet })
      const plan = c.writes.plan({ operation: operation(lab, await lab.core.ownerNonce(), 'uncertain') })
      const a = await c.writes.approve(plan, { policy, signal: signal(), decide: async () => true })
      const result = await c.writes.submit(a.approval, { signal: signal() })
      assert.equal(result.status, 'UNKNOWN')
      assert.equal(result.evidence.error, failure)
      assert.equal(result.evidence.error.observation.request.method, 'eth_sendTransaction')
      await assert.rejects(c.writes.submit(a.approval, { signal: signal() }), /consumed/)
      assert.equal(sends, 1)
    })
    await t.test('receipt inclusion without recovered authority is not verified completion', async () => {
      hideTransaction = true
      const unresolved = await client.writes.verify(sent.submission, { at: 'latest', maxReceipts: 128, maxPages: 4 })
      assert.equal(unresolved.effect, 'UNKNOWN')
      assert.equal(unresolved.qualification.authority, 'UNKNOWN')
      assert.notEqual(unresolved.stage, 'READ_BACK_VERIFIED')
      hideTransaction = false
      const c = createLabClient({ ...config, readProvider: { request: r => r.method === 'eth_getTransactionByHash' ? null : rpc.request(r) } })
      // Handles are client-bound, so imported progress is deliberately rejected.
      await assert.rejects(c.writes.verify(sent.submission, { at: 'latest', maxReceipts: 128, maxPages: 4 }), /submission/)
    })
    await t.test('approval signal remains a fence even when submit receives a different signal', async () => {
      const controller = new AbortController()
      const plan = client.writes.plan({ operation: operation(lab, await lab.core.ownerNonce(), 'cancel-before-submit') })
      const approved = await client.writes.approve(plan, { policy, signal: controller.signal, decide: async () => true })
      controller.abort('closed')
      const count = calls.length
      const result = await client.writes.submit(approved.approval, { signal: signal() })
      assert.equal(result.status, 'CANCELLED')
      assert.equal(calls.length, count)
    })
    await t.test('declined policy has no provider effects and cannot be approved twice', async () => {
      const plan = client.writes.plan({ operation: operation(lab, await lab.core.ownerNonce(), 'declined') })
      const count = calls.length
      const result = await client.writes.approve(plan, { policy, signal: signal(), decide: async () => false })
      assert.equal(result.status, 'DECLINED')
      assert.equal(calls.length, count)
      await assert.rejects(client.writes.approve(plan, { policy, signal: signal(), decide: async () => true }), /consumed/)
    })
    await t.test('substituted record tuple cannot grant a typed value for another requested ID', async () => {
      const schemaId = deriveSchemaId('0x01')
      const realId = deriveRecordId({ schemaId, data: '0x000000000000002a' })
      const selector = lab.core.interface.getFunction('getRecord').selector
      const provider = { request(request) {
        if (request.method !== 'eth_call' || !request.params[0].data.startsWith(selector)) return rpc.request(request)
        return rpc.request({ ...request, params: [{ ...request.params[0], data: lab.core.interface.encodeFunctionData('getRecord', [realId]) }, request.params[1]] })
      } }
      const c = createLabClient({ ...config, readProvider: provider })
      const result = await c.records.read({ id: zero, schemaId, at: 'latest' })
      assert.equal(result.value, undefined)
      assert.equal(result.reason, 'RECORD_ID_MISMATCH')
      assert.equal(result.computedRecordId, realId)
      assert(result.raw.record.evidence.some(e => e.responseBytes))
    })
    await t.test('TypeScript consumer examples execute reads and explicitly approved relayed write', async () => {
      const schemaId = deriveSchemaId('0x01')
      const recordId = deriveRecordId({ schemaId, data: '0x000000000000002a' })
      const reads = await readExamples(config, fileId, recordId, schemaId)
      assert.equal(reads.file.value.bytes, '0x6869')
      assert.deepEqual(reads.record.value.fields, [42n])
      const result = await writeExample({ ...config, walletProvider: rpc, relayProvider: rpc }, operation(lab, await lab.core.ownerNonce(), 'example-relayed'), { mode: 'relayed', account: lab.deployment.owner, submitter: await lab.relay.getAddress() }, signal(), async () => true)
      assert.equal(result.stage, 'READ_BACK_VERIFIED')
      assert.equal(result.effect, 'COMMITTED')
    })
  })
})
