import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { Interface, Wallet, ZeroHash, hexlify, keccak256, toUtf8Bytes } from 'ethers'
import {
  createLabSdk,
  decodeOperation,
  decodeTypedPayload,
  deriveContentId,
  deriveSchemaId,
  encodeOperation,
  encodeSchema,
  encodeTypedPayload,
  exportEvidence,
  grantDigest,
  importEvidence,
  operationDigest,
  parseSchema,
} from '../sdk/index.js'

const coreArtifact = JSON.parse(readFileSync(new URL('../out/EfsLab.sol/EfsLab.json', import.meta.url)))
const byteArtifact = JSON.parse(readFileSync(new URL('../out/EfsLabBytes.sol/EfsLabBytes.json', import.meta.url)))
const coreInterface = new Interface(coreArtifact.abi)
const byteInterface = new Interface(byteArtifact.abi)

const ownerWallet = new Wallet(`0x${'01'.repeat(32)}`)
const sessionWallet = new Wallet(`0x${'02'.repeat(32)}`)
const owner = ownerWallet.address
const relayer = '0x2000000000000000000000000000000000000002'
const session = sessionWallet.address
const core = '0x4000000000000000000000000000000000000004'
const byteStore = '0x5000000000000000000000000000000000000005'
const runId = `0x${'66'.repeat(32)}`
const rootId = `0x${'77'.repeat(32)}`
const blockHash = `0x${'88'.repeat(32)}`
const id = `0x${'99'.repeat(32)}`
const wrongSchema = `0x${'aa'.repeat(32)}`
const coreCode = '0x6000'
const byteCode = '0x6001'

const deployment = {
  chainId: 31337n,
  core,
  byteStore,
  rootId,
  runId,
  realmId: runId,
  owner,
  profile: 'efs-lab/1',
  coreAbi: coreArtifact.abi,
  byteStoreAbi: byteArtifact.abi,
  runtimeCodeHashes: { core: keccak256(coreCode), byteStore: keccak256(byteCode) },
}

function makeReadProvider({
  descriptor = '0x01',
  payload = hexlify(toUtf8Bytes('tampered')),
  rangePayload = payload,
  failBasis = false,
  exactError,
  page = [[id], 1n, 1n],
  coreRuntimeCode = coreCode,
} = {}) {
  const calls = []
  return {
    calls,
    async request(request) {
      calls.push(request)
      if (request.method === 'eth_chainId') return '0x7a69'
      if (request.method === 'eth_getBlockByNumber') {
        if (failBasis) throw Object.assign(new Error('provider offline'), { code: 4900 })
        return { number: '0x10', hash: blockHash, timestamp: '0x3e8' }
      }
      if (request.method === 'eth_getBlockByHash') return { number: '0x10', hash: blockHash, timestamp: '0x3e8' }
      if (request.method === 'eth_getCode') return request.params[0].toLowerCase() === core.toLowerCase() ? coreRuntimeCode : byteCode
      if (request.method === 'eth_getTransactionReceipt') return { status: '0x1', blockNumber: '0x10', blockHash }
      if (request.method !== 'eth_call') throw new Error(`unexpected method ${request.method}`)
      const tx = request.params[0]
      const isCore = tx.to.toLowerCase() === core.toLowerCase()
      const iface = isCore ? coreInterface : byteInterface
      const parsed = iface.parseTransaction({ data: tx.data })
      if (parsed.name === 'runId') return iface.encodeFunctionResult('runId', [runId])
      if (parsed.name === 'rootId') return iface.encodeFunctionResult('rootId', [rootId])
      if (parsed.name === 'owner') return iface.encodeFunctionResult('owner', [owner])
      if (parsed.name === 'byteStore') return iface.encodeFunctionResult('byteStore', [byteStore])
      if (exactError && ['getNode', 'getRevision', 'getRecord', 'getSchema', 'grantInfo', 'grantBasis', 'receipt'].includes(parsed.name)) {
        throw Object.assign(new Error(`execution reverted: ${exactError}`), {
          code: 'CALL_EXCEPTION',
          data: iface.encodeErrorResult(exactError, []),
        })
      }
      if (parsed.name === 'child') return iface.encodeFunctionResult('child', [ZeroHash])
      if (parsed.name === 'list') return iface.encodeFunctionResult('list', page)
      if (parsed.name === 'receiptCount') return iface.encodeFunctionResult('receiptCount', [0n])
      if (parsed.name === 'getSchema') return iface.encodeFunctionResult('getSchema', [descriptor])
      if (parsed.name === 'getRecord') return iface.encodeFunctionResult('getRecord', [{ schemaId: wrongSchema, contentId: id }])
      if (parsed.name === 'exists') return iface.encodeFunctionResult('exists', [true])
      if (parsed.name === 'read') return iface.encodeFunctionResult('read', [payload])
      if (parsed.name === 'readRange') return iface.encodeFunctionResult('readRange', [rangePayload])
      throw new Error(`unexpected call ${parsed.name}`)
    },
  }
}

function recorder(responses = {}) {
  const calls = []
  return {
    calls,
    async request(request) {
      calls.push(request)
      if (request.method in responses) {
        const response = responses[request.method]
        return typeof response === 'function' ? response(request) : response
      }
      throw new Error(`unexpected ${request.method}`)
    },
  }
}

test('operation bytes and typed digest are exact and domain-bound', () => {
  const readProvider = makeReadProvider()
  const sdk = createLabSdk({ readProvider, deployment })
  const op = sdk.operations.createFile({
    target: rootId,
    name: 'a.txt',
    data: 'hello',
    salt: `0x${'01'.repeat(32)}`,
    nonce: 0n,
    deadline: 1000n,
  })
  const bytes = encodeOperation(op)
  assert.deepEqual(decodeOperation(bytes), op)
  assert.equal(operationDigest(deployment, op), sdk.planWrite({ operation: op }).digest)
  assert.notEqual(operationDigest({ ...deployment, chainId: 31338n }, op), operationDigest(deployment, op))
  assert.throws(() => decodeOperation(`${bytes}00`), /NON_CANONICAL_OPERATION_BYTES/)
  assert.throws(() => sdk.operations.createFile({ ...op, nonce: Number.MAX_SAFE_INTEGER + 1 }), /safe integer/)
})

test('strict declarative codec rejects noncanonical and schema-mismatched values', async () => {
  const targetSchema = `0x${'bb'.repeat(32)}`
  const descriptor = encodeSchema([1, 2, 3, 4, { tag: 5, schemaId: targetSchema }])
  assert.deepEqual(parseSchema(descriptor)[4], { tag: 5, schemaId: targetSchema })
  const fields = [42n, true, id, 'ASCII', id]
  const data = encodeTypedPayload(descriptor, fields)
  assert.deepEqual(decodeTypedPayload(descriptor, data), fields)
  assert.throws(() => decodeTypedPayload('0x02', '0x02'), /NON_CANONICAL_BOOL/)
  assert.throws(() => decodeTypedPayload('0x01', '0x000000000000000001'), /TRAILING_TYPED_PAYLOAD/)

  const sdk = createLabSdk({ readProvider: makeReadProvider({ descriptor }), deployment })
  const checked = await sdk.validateTypedPayloadAtBasis({ schemaId: deriveSchemaId(descriptor), data })
  assert.equal(checked.outcome, 'FOUND')
  assert.equal(checked.valid, false)
  assert.equal(checked.qualification.validation, 'INVALID')
  assert.equal(checked.reasonCode, 'REFERENCE_SCHEMA_MISMATCH')
})

test('schema reads bind valid-shaped returned descriptor bytes to the requested identity', async () => {
  const requestedDescriptor = encodeSchema([1])
  const substitutedDescriptor = encodeSchema([2])
  const requestedSchemaId = deriveSchemaId(requestedDescriptor)
  const sdk = createLabSdk({ readProvider: makeReadProvider({ descriptor: substitutedDescriptor }), deployment })

  const validation = await sdk.validateTypedPayloadAtBasis({ schemaId: requestedSchemaId, data: '0x01' })
  assert.equal(validation.outcome, 'FOUND')
  assert.equal(validation.valid, false)
  assert.equal(validation.observedDescriptor, substitutedDescriptor)
  assert.equal(validation.computedSchemaId, deriveSchemaId(substitutedDescriptor))
  assert.equal(validation.qualification.validation, 'INVALID')
  assert.equal(validation.qualification.integrity, 'FAILED')
  assert(validation.evidence.some((entry) => entry.responseBytes))

  const exact = await sdk.readExact({ kind: 'schema', id: requestedSchemaId })
  assert.equal(exact.outcome, 'FOUND')
  assert.equal(exact.value, undefined)
  assert.equal(exact.observedValue, substitutedDescriptor)
  assert.equal(exact.computedSchemaId, deriveSchemaId(substitutedDescriptor))
  assert.equal(exact.qualification.validation, 'INVALID')
  assert.equal(exact.qualification.integrity, 'FAILED')
  assert(exact.evidence.some((entry) => entry.responseBytes))
})

test('exact absence, bounded completeness, tampering and basis outage stay distinct', async () => {
  const good = hexlify(toUtf8Bytes('good'))
  const expectedContentId = deriveContentId(good)
  const readProvider = makeReadProvider()
  const sdk = createLabSdk({ readProvider, deployment })
  const absent = await sdk.readExact({ kind: 'child', parent: rootId, name: 'missing', blockTag: 'latest' })
  assert.equal(absent.outcome, 'ABSENT_PROVEN')
  assert.equal(absent.qualification.coverage, 'COMPLETE')

  const hashPinned = await sdk.readExact({ kind: 'child', parent: rootId, name: 'missing', blockTag: blockHash })
  assert.equal(hashPinned.outcome, 'ABSENT_PROVEN')
  assert(readProvider.calls.some((call) => call.method === 'eth_getBlockByHash' && call.params[0] === blockHash))

  const page = await sdk.readPage({ kind: 'children', directory: rootId, cursor: 0n, limit: 64 })
  assert.equal(page.outcome, 'FOUND')
  assert.equal(page.qualification.coverage, 'COMPLETE')
  assert.deepEqual(page.items, [id])
  assert(readProvider.calls.filter((call) => call.method === 'eth_call').every((call) => call.params[1].blockHash === blockHash && call.params[1].requireCanonical === true))

  const suffixSdk = createLabSdk({ readProvider: makeReadProvider({ page: [[id], 2n, 2n] }), deployment })
  const suffix = await suffixSdk.readPage({ kind: 'children', directory: rootId, cursor: 1n, limit: 64 })
  assert.equal(suffix.outcome, 'FOUND')
  assert.equal(suffix.pageCoverage, 'PAGE_COMPLETE')
  assert.equal(suffix.qualification.coverage, 'PARTIAL')

  const missing = createLabSdk({ readProvider: makeReadProvider({ exactError: 'Missing' }), deployment })
  assert.equal((await missing.readExact({ kind: 'node', id })).outcome, 'ABSENT_PROVEN')
  const bounds = createLabSdk({ readProvider: makeReadProvider({ exactError: 'Bounds' }), deployment })
  assert.equal((await bounds.readExact({ kind: 'node', id })).outcome, 'UNKNOWN')

  const wrongRuntime = createLabSdk({ readProvider: makeReadProvider({ coreRuntimeCode: '0x6002' }), deployment })
  const untrusted = await wrongRuntime.readExact({ kind: 'child', parent: rootId, name: 'missing' })
  assert.equal(untrusted.outcome, 'UNKNOWN')
  assert(untrusted.evidence.some((entry) => entry.request.method === 'eth_getCode' && entry.response === '0x6002'))

  await assert.rejects(
    () => sdk.readPage({ kind: 'children', directory: rootId, cursor: Number.MAX_SAFE_INTEGER + 1, limit: 64 }),
    /safe integer/,
  )
  await assert.rejects(
    () => sdk.readVerifiedBytes({ contentId: expectedContentId, range: { offset: Number.MAX_SAFE_INTEGER + 1, length: 1 } }),
    /safe integer/,
  )
  await assert.rejects(
    () => sdk.readExact({ kind: 'revision', file: id, revision: Number.MAX_SAFE_INTEGER + 1 }),
    /safe integer/,
  )

  const bytes = await sdk.readVerifiedBytes({ contentId: expectedContentId, expectedBytes: good })
  assert.equal(bytes.outcome, 'FOUND')
  assert.equal(bytes.qualification.availability, 'AVAILABLE')
  assert.equal(bytes.qualification.bytes, 'RETURNED')
  assert.equal(bytes.qualification.integrity, 'FAILED')
  assert.equal(bytes.value, undefined)

  const rangedSdk = createLabSdk({ readProvider: makeReadProvider({ payload: good, rangePayload: '0xff' }), deployment })
  const badRange = await rangedSdk.readVerifiedBytes({ contentId: expectedContentId, range: { offset: 0n, length: 1 } })
  assert.equal(badRange.outcome, 'FOUND')
  assert.equal(badRange.qualification.availability, 'AVAILABLE')
  assert.equal(badRange.qualification.bytes, 'RETURNED')
  assert.equal(badRange.qualification.integrity, 'FAILED')
  assert.equal(badRange.observedBytes, good)
  assert.equal(badRange.observedRange, '0xff')

  const unavailable = createLabSdk({ readProvider: makeReadProvider({ failBasis: true }), deployment })
  const unknown = await unavailable.readExact({ kind: 'child', parent: rootId, name: 'x' })
  assert.equal(unknown.outcome, 'UNKNOWN')
  assert.equal(unknown.reasonCode, 'PROVIDER_OR_BASIS_UNAVAILABLE')
})

test('relayed, direct and session providers remain separate and inclusion is not success', async () => {
  const readProvider = makeReadProvider()
  const sign = (wallet) => async ({ params }) => {
    const payload = JSON.parse(params[1])
    return wallet.signTypedData(payload.domain, { [payload.primaryType]: payload.types[payload.primaryType] }, payload.message)
  }
  const walletProvider = recorder({ eth_signTypedData_v4: sign(ownerWallet), eth_sendTransaction: `0x${'12'.repeat(32)}` })
  const relayProvider = recorder({ eth_sendTransaction: `0x${'13'.repeat(32)}` })
  const sessionProvider = recorder({ eth_signTypedData_v4: sign(sessionWallet) })
  const sdk = createLabSdk({ readProvider, walletProvider, relayProvider, sessionProvider, deployment })
  const base = { target: rootId, name: 'dir', salt: `0x${'21'.repeat(32)}`, nonce: 0n, deadline: 1000n }

  const relayedPlan = sdk.planWrite({ operation: sdk.operations.mkdir(base) })
  const relayedPrepared = await sdk.prepareWrite(relayedPlan, { mode: 'relayed', account: owner })
  const relayed = await sdk.submitWrite(relayedPrepared, { from: relayer })
  assert.equal(walletProvider.calls.filter((x) => x.method === 'eth_signTypedData_v4').length, 1)
  assert.equal(relayProvider.calls.length, 1)
  assert.equal(relayed.stage, 'INCLUDED')
  assert.equal(relayed.qualification.effect, 'UNKNOWN')

  const directPlan = sdk.planWrite({ operation: sdk.operations.mkdir({ ...base, name: 'direct', salt: `0x${'22'.repeat(32)}` }) })
  const directPrepared = await sdk.prepareWrite(directPlan, { mode: 'direct', account: owner })
  const direct = await sdk.submitWrite(directPrepared)
  assert.equal(walletProvider.calls.filter((x) => x.method === 'eth_sendTransaction').length, 1)
  assert.equal(direct.qualification.effect, 'UNKNOWN')

  const grant = { key: session, scope: rootId, operations: 1, expiry: 1000n, maxWrites: 2n, maxBytes: 0n, nonce: 7n }
  const grantId = grantDigest(deployment, grant)
  const sessionPlan = sdk.planWrite({ operation: sdk.operations.mkdir({ ...base, name: 'session', salt: `0x${'23'.repeat(32)}`, grantId }) })
  const sessionPrepared = await sdk.prepareWrite(sessionPlan, { mode: 'session', account: session, grant })
  await sdk.submitWrite(sessionPrepared, { from: relayer })
  assert.equal(sessionProvider.calls.length, 1)
  assert.equal(walletProvider.calls.length, 2)

  const recovered = await sdk.readBack(relayed)
  assert.equal(recovered.effect, 'UNKNOWN')
  assert.equal(recovered.reasonCode, 'RECEIPT_NOT_RECOVERED')
})

test('lossless evidence export preserves bigint and exact byte arrays', () => {
  const input = { wide: 2n ** 100n, raw: Uint8Array.of(0, 1, 255), unknown: { future: 'kept' } }
  const output = importEvidence(exportEvidence(input))
  assert.equal(output.wide, input.wide)
  assert.deepEqual(output.raw, input.raw)
  assert.deepEqual(output.unknown, input.unknown)
})
