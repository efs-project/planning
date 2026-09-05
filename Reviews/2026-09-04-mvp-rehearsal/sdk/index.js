import {
  AbiCoder,
  Interface,
  Signature,
  TypedDataEncoder,
  ZeroAddress,
  ZeroHash,
  concat,
  getAddress,
  getBytes,
  hexlify,
  keccak256,
  recoverAddress,
  toBeHex,
  toUtf8Bytes,
  zeroPadValue,
} from 'ethers'

const coder = AbiCoder.defaultAbiCoder()
const OPERATION_TUPLE =
  'tuple(uint8 kind,bytes32 target,string name,bytes32 schemaId,bytes data,bytes32 salt,uint64 expectedRevision,uint64 nonce,uint64 deadline,bytes32 grantId)'

export const OperationTypes = Object.freeze({
  Operation: Object.freeze([
    { name: 'kind', type: 'uint8' },
    { name: 'target', type: 'bytes32' },
    { name: 'name', type: 'string' },
    { name: 'schemaId', type: 'bytes32' },
    { name: 'data', type: 'bytes' },
    { name: 'salt', type: 'bytes32' },
    { name: 'expectedRevision', type: 'uint64' },
    { name: 'nonce', type: 'uint64' },
    { name: 'deadline', type: 'uint64' },
    { name: 'grantId', type: 'bytes32' },
  ]),
})

export const GrantTypes = Object.freeze({
  Grant: Object.freeze([
    { name: 'key', type: 'address' },
    { name: 'scope', type: 'bytes32' },
    { name: 'operations', type: 'uint8' },
    { name: 'expiry', type: 'uint64' },
    { name: 'maxWrites', type: 'uint32' },
    { name: 'maxBytes', type: 'uint64' },
    { name: 'nonce', type: 'uint64' },
  ]),
})

const DOMAIN_ROOT = keccak256(toUtf8Bytes('efs-lab/root/1'))
const DOMAIN_NODE = keccak256(toUtf8Bytes('efs-lab/node/1'))
const DOMAIN_BYTES = keccak256(toUtf8Bytes('efs-lab/bytes/1'))
const DOMAIN_SCHEMA = keccak256(toUtf8Bytes('efs-lab/schema/1'))
const DOMAIN_RECORD = keccak256(toUtf8Bytes('efs-lab/record/1'))
const DOMAIN_REVISION = keccak256(toUtf8Bytes('efs-lab/revision/1'))

const DEFAULT_QUALIFICATION = Object.freeze({
  coverage: 'UNKNOWN',
  support: 'SUPPORTED',
  validation: 'UNKNOWN',
  authority: 'NOT_APPLICABLE',
  currentness: 'UNKNOWN',
  finality: 'UNKNOWN',
  integrity: 'NOT_APPLICABLE',
  availability: 'UNKNOWN',
  bytes: 'NOT_APPLICABLE',
  effect: 'NOT_APPLICABLE',
})

function qualification(overrides = {}) {
  return { ...DEFAULT_QUALIFICATION, ...overrides }
}

function assertHex(value, bytes, name) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]*$/.test(value) || value.length !== 2 + bytes * 2) {
    throw new TypeError(`${name} must be ${bytes}-byte hex`)
  }
  return value.toLowerCase()
}

function u64(value, name) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new RangeError(`${name} number is not a safe integer`)
  const n = BigInt(value)
  if (n < 0n || n > 0xffffffffffffffffn) throw new RangeError(`${name} must fit uint64`)
  return n
}

function u32(value, name) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new RangeError(`${name} number is not a safe integer`)
  const n = BigInt(value)
  if (n < 0n || n > 0xffffffffn) throw new RangeError(`${name} must fit uint32`)
  return n
}

function unsigned(value, name) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new RangeError(`${name} number is not a safe integer`)
  const n = BigInt(value)
  if (n < 0n) throw new RangeError(`${name} must be unsigned`)
  return n
}

function u8(value, name) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 0 || n > 255) throw new RangeError(`${name} must fit uint8`)
  return n
}

export function asDataHex(value) {
  if (typeof value === 'string' && /^0x(?:[0-9a-fA-F]{2})*$/.test(value)) return value.toLowerCase()
  if (typeof value === 'string') return hexlify(toUtf8Bytes(value))
  return hexlify(value)
}

export function canonicalOperation(operation) {
  return Object.freeze({
    kind: u8(operation.kind, 'kind'),
    target: assertHex(operation.target, 32, 'target'),
    name: String(operation.name ?? ''),
    schemaId: assertHex(operation.schemaId ?? ZeroHash, 32, 'schemaId'),
    data: asDataHex(operation.data ?? '0x'),
    salt: assertHex(operation.salt ?? ZeroHash, 32, 'salt'),
    expectedRevision: u64(operation.expectedRevision ?? 0n, 'expectedRevision'),
    nonce: u64(operation.nonce ?? 0n, 'nonce'),
    deadline: u64(operation.deadline, 'deadline'),
    grantId: assertHex(operation.grantId ?? ZeroHash, 32, 'grantId'),
  })
}

export function canonicalGrant(grant) {
  return Object.freeze({
    key: getAddress(grant.key),
    scope: assertHex(grant.scope, 32, 'scope'),
    operations: u8(grant.operations, 'operations'),
    expiry: u64(grant.expiry, 'expiry'),
    maxWrites: u32(grant.maxWrites, 'maxWrites'),
    maxBytes: u64(grant.maxBytes, 'maxBytes'),
    nonce: u64(grant.nonce, 'nonce'),
  })
}

export function labDomain(deployment) {
  return Object.freeze({
    name: 'efs-lab',
    version: '1',
    chainId: BigInt(deployment.chainId),
    verifyingContract: getAddress(deployment.core),
  })
}

export function encodeOperation(operation) {
  const op = canonicalOperation(operation)
  return coder.encode([OPERATION_TUPLE], [[
    op.kind,
    op.target,
    op.name,
    op.schemaId,
    op.data,
    op.salt,
    op.expectedRevision,
    op.nonce,
    op.deadline,
    op.grantId,
  ]])
}

export function decodeOperation(bytes) {
  const decoded = coder.decode([OPERATION_TUPLE], bytes)[0]
  const op = canonicalOperation({
    kind: decoded.kind,
    target: decoded.target,
    name: decoded.name,
    schemaId: decoded.schemaId,
    data: decoded.data,
    salt: decoded.salt,
    expectedRevision: decoded.expectedRevision,
    nonce: decoded.nonce,
    deadline: decoded.deadline,
    grantId: decoded.grantId,
  })
  if (encodeOperation(op).toLowerCase() !== bytes.toLowerCase()) throw new Error('NON_CANONICAL_OPERATION_BYTES')
  return op
}

export function operationDigest(deployment, operation) {
  return TypedDataEncoder.hash(labDomain(deployment), OperationTypes, canonicalOperation(operation))
}

export function grantDigest(deployment, grant) {
  return TypedDataEncoder.hash(labDomain(deployment), GrantTypes, canonicalGrant(grant))
}

export function deriveRootId({ runId, owner }) {
  return keccak256(coder.encode(['bytes32', 'bytes32', 'address'], [DOMAIN_ROOT, runId, owner]))
}

export function deriveNodeId({ runId, owner, kind, target, name, salt }) {
  return keccak256(coder.encode(
    ['bytes32', 'bytes32', 'address', 'uint8', 'bytes32', 'bytes32', 'bytes32'],
    [DOMAIN_NODE, runId, owner, kind, target, keccak256(toUtf8Bytes(name)), salt],
  ))
}

export function deriveContentId(data) {
  return keccak256(coder.encode(['bytes32', 'bytes32'], [DOMAIN_BYTES, keccak256(asDataHex(data))]))
}

export function deriveSchemaId(descriptor) {
  return keccak256(coder.encode(['bytes32', 'bytes32'], [DOMAIN_SCHEMA, keccak256(asDataHex(descriptor))]))
}

export function deriveRecordId({ schemaId, data }) {
  return keccak256(coder.encode(['bytes32', 'bytes32', 'bytes32'], [DOMAIN_RECORD, schemaId, keccak256(asDataHex(data))]))
}

export function deriveRevisionId({ fileId, revision, contentId, previous = ZeroHash }) {
  return keccak256(coder.encode(
    ['bytes32', 'bytes32', 'uint64', 'bytes32', 'bytes32'],
    [DOMAIN_REVISION, fileId, revision, contentId, previous],
  ))
}

export function encodeSchema(fields) {
  if (!Array.isArray(fields) || fields.length < 1 || fields.length > 8) throw new RangeError('schema has 1..8 fields')
  const parts = []
  for (const field of fields) {
    const tag = u8(typeof field === 'object' ? field.tag : field, 'schema tag')
    if (tag < 1 || tag > 5) throw new RangeError('schema tag must be 1..5')
    parts.push(Uint8Array.of(tag))
    if (tag === 5) {
      if (!field || typeof field !== 'object') throw new TypeError('tag5 requires {tag:5,schemaId}')
      parts.push(getBytes(assertHex(field.schemaId, 32, 'tag5 schemaId')))
    }
  }
  return hexlify(concat(parts))
}

export function parseSchema(descriptor) {
  const bytes = getBytes(asDataHex(descriptor))
  const fields = []
  let offset = 0
  while (offset < bytes.length) {
    if (fields.length === 8) throw new Error('TOO_MANY_SCHEMA_FIELDS')
    const tag = bytes[offset]
    offset += 1
    if (tag < 1 || tag > 5) throw new Error(`UNSUPPORTED_SCHEMA_TAG_${tag}`)
    if (tag === 5) {
      if (offset + 32 > bytes.length) throw new Error('TRUNCATED_REFERENCE_SCHEMA')
      fields.push({ tag, schemaId: hexlify(bytes.slice(offset, offset + 32)) })
      offset += 32
    } else fields.push({ tag })
  }
  if (fields.length < 1) throw new Error('SCHEMA_FIELD_COUNT')
  if (encodeSchema(fields).toLowerCase() !== asDataHex(descriptor).toLowerCase()) throw new Error('NON_CANONICAL_SCHEMA')
  return fields
}

function uintBytes(value, width, name) {
  const n = BigInt(value)
  if (n < 0n || n >= (1n << BigInt(width * 8))) throw new RangeError(`${name} does not fit ${width} bytes`)
  return getBytes(zeroPadValue(toBeHex(n), width))
}

export function encodeTypedPayload(descriptor, fields) {
  const schema = parseSchema(descriptor)
  if (fields.length !== schema.length) throw new Error('SCHEMA_FIELD_COUNT')
  const parts = []
  for (let i = 0; i < schema.length; i += 1) {
    const tag = schema[i].tag
    const field = fields[i]
    if (tag === 1) parts.push(uintBytes(field, 8, `field ${i}`))
    else if (tag === 2) {
      if (field !== true && field !== false) throw new TypeError(`field ${i} must be boolean`)
      parts.push(Uint8Array.of(field ? 1 : 0))
    } else if (tag === 3 || tag === 5) parts.push(getBytes(assertHex(field, 32, `field ${i}`)))
    else if (tag === 4) {
      const bytes = toUtf8Bytes(String(field))
      if (bytes.length > 256 || bytes.some((b) => b < 0x20 || b > 0x7e)) throw new Error(`field ${i} must be printable ASCII <=256 bytes`)
      parts.push(uintBytes(bytes.length, 2, `field ${i} length`), bytes)
    } else throw new Error(`UNSUPPORTED_SCHEMA_TAG_${tag}`)
  }
  return hexlify(concat(parts))
}

export function decodeTypedPayload(descriptor, data) {
  const schema = parseSchema(descriptor)
  const bytes = getBytes(asDataHex(data))
  const fields = []
  let offset = 0
  const take = (length) => {
    if (offset + length > bytes.length) throw new Error('TRUNCATED_TYPED_PAYLOAD')
    const out = bytes.slice(offset, offset + length)
    offset += length
    return out
  }
  for (const { tag } of schema) {
    if (tag === 1) fields.push(BigInt(hexlify(take(8))))
    else if (tag === 2) {
      const value = take(1)[0]
      if (value > 1) throw new Error('NON_CANONICAL_BOOL')
      fields.push(value === 1)
    } else if (tag === 3 || tag === 5) fields.push(hexlify(take(32)))
    else if (tag === 4) {
      const lengthBytes = take(2)
      const length = lengthBytes[0] * 256 + lengthBytes[1]
      if (length > 256) throw new Error('TEXT_TOO_LONG')
      const value = take(length)
      if (value.some((b) => b < 0x20 || b > 0x7e)) throw new Error('NON_CANONICAL_TEXT')
      fields.push(new TextDecoder().decode(value))
    } else throw new Error(`UNSUPPORTED_SCHEMA_TAG_${tag}`)
  }
  if (offset !== bytes.length) throw new Error('TRAILING_TYPED_PAYLOAD')
  if (encodeTypedPayload(descriptor, fields).toLowerCase() !== asDataHex(data).toLowerCase()) {
    throw new Error('NON_CANONICAL_TYPED_PAYLOAD')
  }
  return fields
}

function jsonValue(value) {
  if (typeof value === 'bigint') return { $efsBigInt: value.toString() }
  if (value instanceof Uint8Array) return { $efsBytes: hexlify(value) }
  if (Array.isArray(value)) return value.map(jsonValue)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, jsonValue(v)]))
  return value
}

function typedDataJsonValue(value) {
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Uint8Array) return hexlify(value)
  if (Array.isArray(value)) return value.map(typedDataJsonValue)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, typedDataJsonValue(v)]))
  return value
}

function reviveJson(_key, value) {
  if (value && typeof value === 'object' && Object.keys(value).length === 1) {
    if ('$efsBigInt' in value) return BigInt(value.$efsBigInt)
    if ('$efsBytes' in value) return getBytes(value.$efsBytes)
  }
  return value
}

export function exportEvidence(value) {
  return JSON.stringify(jsonValue(value))
}

export function importEvidence(serialized) {
  return JSON.parse(serialized, reviveJson)
}

function plain(value) {
  if (typeof value === 'bigint' || typeof value === 'string' || typeof value === 'boolean' || value == null) return value
  if (value && typeof value.toObject === 'function') {
    try {
      return plain(value.toObject(true))
    } catch (error) {
      if (!Array.isArray(value) || !/unnamed/i.test(String(error?.message ?? error))) throw error
    }
  }
  if (Array.isArray(value)) return value.map(plain)
  if (value && typeof value === 'object') {
    const named = Object.keys(value).filter((key) => Number.isNaN(Number(key)))
    if (named.length) return Object.fromEntries(named.map((key) => [key, plain(value[key])]))
  }
  return value
}

function plainAbi(value, param) {
  if (param?.baseType === 'array') return Array.from(value, (entry) => plainAbi(entry, param.arrayChildren))
  if (param?.baseType === 'tuple') {
    const components = param.components ?? []
    if (components.every((component) => component.name)) {
      return Object.fromEntries(components.map((component, index) => [component.name, plainAbi(value[index], component)]))
    }
    return components.map((component, index) => plainAbi(value[index], component))
  }
  return plain(value)
}

function namedCallValue(functionName, value) {
  if (functionName === 'grantInfo' && Array.isArray(value)) {
    const [grant, approval, revoked, writes, bytesUsed] = value
    return { grant, approval, revoked, writes, bytesUsed }
  }
  if (functionName === 'grantBasis' && Array.isArray(value)) {
    const [registeredAtReceipt, revokedAtReceipt, registeredBlock, revokedBlock, registeredTimestamp, revokedTimestamp] = value
    return { registeredAtReceipt, revokedAtReceipt, registeredBlock, revokedBlock, registeredTimestamp, revokedTimestamp }
  }
  return value
}

function errorObservation(error, request) {
  return {
    source: 'eip1193',
    request,
    response: null,
    error: {
      name: error?.name ?? 'Error',
      message: String(error?.shortMessage ?? error?.message ?? error),
      code: error?.code,
      data: error?.data,
    },
  }
}

function errorEvidence(error) {
  return [
    ...(Array.isArray(error?.observations) ? error.observations : []),
    ...(error?.observation ? [error.observation] : []),
  ]
}

function isCallRevert(error) {
  return error?.code === 'CALL_EXCEPTION' || /revert/i.test(String(error?.shortMessage ?? error?.message ?? ''))
}

function revertData(error) {
  const candidates = [error?.data, error?.data?.data, error?.info?.error?.data, error?.error?.data]
  return candidates.find((value) => typeof value === 'string' && /^0x[0-9a-fA-F]{8,}$/.test(value))
}

function isExactError(error, iface, name) {
  const data = revertData(error)
  if (!data) return false
  try {
    return iface.parseError(data)?.name === name
  } catch {
    return false
  }
}

function verifySignature(digest, signature, expectedSigner) {
  if (getBytes(signature).length !== 65) throw new Error('SIGNATURE_LENGTH')
  const parsed = Signature.from(signature)
  if (parsed.v !== 27 && parsed.v !== 28) throw new Error('SIGNATURE_V')
  const halfOrder = 0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0n
  if (BigInt(parsed.s) > halfOrder) throw new Error('SIGNATURE_HIGH_S')
  const recovered = recoverAddress(digest, parsed.serialized)
  if (getAddress(recovered) !== getAddress(expectedSigner)) throw new Error('SIGNATURE_SIGNER_MISMATCH')
  return recovered
}

function makeRpc(provider, deployment) {
  if (!provider || typeof provider.request !== 'function') throw new TypeError('provider must implement EIP-1193 request')
  const core = new Interface(deployment.coreAbi)
  const byteStore = new Interface(deployment.byteStoreAbi)

  async function rpc(method, params = []) {
    const request = { method, params }
    try {
      const response = await provider.request(request)
      return { value: response, observation: { source: 'eip1193', request, response } }
    } catch (error) {
      error.observation = errorObservation(error, request)
      throw error
    }
  }

  async function basis(blockTag = 'latest') {
    async function fromHash(blockHash, declared) {
      const hash = assertHex(blockHash, 32, 'basis.blockHash')
      const chain = await rpc('eth_chainId')
      const observedChainId = BigInt(chain.value)
      if (observedChainId !== BigInt(deployment.chainId)) throw new Error('BASIS_CHAIN_MISMATCH')
      if (declared && unsigned(declared.chainId, 'basis.chainId') !== observedChainId) throw new Error('BASIS_CHAIN_MISMATCH')
      const block = await rpc('eth_getBlockByHash', [hash, false])
      if (!block.value || block.value.hash.toLowerCase() !== hash) throw new Error('BASIS_HASH_MISMATCH')
      const blockNumber = BigInt(block.value.number)
      if (declared && blockNumber !== unsigned(declared.blockNumber, 'basis.blockNumber')) throw new Error('BASIS_HASH_MISMATCH')
      return {
        basis: { chainId: observedChainId, blockNumber, blockHash: hash, timestamp: BigInt(block.value.timestamp) },
        observations: [chain.observation, block.observation],
      }
    }
    if (blockTag && typeof blockTag === 'object' && 'blockHash' in blockTag) {
      return fromHash(blockTag.blockHash, blockTag)
    }
    if (typeof blockTag === 'string' && /^0x[0-9a-fA-F]{64}$/.test(blockTag)) return fromHash(blockTag)
    if (typeof blockTag === 'number') throw new TypeError('numeric blockTag must be bigint to preserve precision')
    const chain = await rpc('eth_chainId')
    const tag = typeof blockTag === 'bigint' ? toBeHex(blockTag) : blockTag
    const block = await rpc('eth_getBlockByNumber', [tag, false])
    if (!block.value) throw new Error('BASIS_UNAVAILABLE')
    const resolved = {
      chainId: BigInt(chain.value),
      blockNumber: BigInt(block.value.number),
      blockHash: block.value.hash.toLowerCase(),
      timestamp: BigInt(block.value.timestamp),
    }
    if (resolved.chainId !== BigInt(deployment.chainId)) throw new Error('BASIS_CHAIN_MISMATCH')
    return { basis: resolved, observations: [chain.observation, block.observation] }
  }

  async function call(which, functionName, args, at) {
    const iface = which === 'core' ? core : byteStore
    const to = which === 'core' ? deployment.core : deployment.byteStore
    const data = iface.encodeFunctionData(functionName, args)
    const request = { method: 'eth_call', params: [{ to, data }, { blockHash: at.blockHash, requireCanonical: true }] }
    try {
      const result = await provider.request(request)
      const decoded = iface.decodeFunctionResult(functionName, result)
      const outputs = iface.getFunction(functionName).outputs
      const value = decoded.length === 1
          ? plainAbi(decoded[0], outputs[0])
          : Array.from(decoded, (entry, index) => plainAbi(entry, outputs[index]))
      return {
        value: namedCallValue(functionName, value),
        observation: { source: 'eip1193', request, response: result, responseBytes: result },
      }
    } catch (error) {
      error.observation = errorObservation(error, request)
      throw error
    }
  }

  async function verifyDeployment(at) {
    const observations = []
    try {
      for (const [which, address] of [['core', deployment.core], ['byteStore', deployment.byteStore]]) {
        const code = await rpc('eth_getCode', [address, { blockHash: at.blockHash, requireCanonical: true }])
        observations.push(code.observation)
        if (code.value === '0x' || keccak256(code.value).toLowerCase() !== deployment.runtimeCodeHashes[which].toLowerCase()) {
          throw new Error(`RUNTIME_CODE_HASH_MISMATCH_${which}`)
        }
      }
      for (const [functionName, expected] of [
        ['runId', deployment.runId],
        ['rootId', deployment.rootId],
        ['owner', deployment.owner],
        ['byteStore', deployment.byteStore],
      ]) {
        const result = await call('core', functionName, [], at)
        observations.push(result.observation)
        const actual = String(result.value).toLowerCase()
        if (actual !== String(expected).toLowerCase()) throw new Error(`DEPLOYMENT_FACT_MISMATCH_${functionName}`)
      }
      return observations
    } catch (error) {
      error.observations = [...observations, ...errorEvidence(error)]
      delete error.observation
      throw error
    }
  }

  return { rpc, basis, call, verifyDeployment, core, byteStore }
}

function domainFor(deployment, operation, subject, key) {
  return {
    realmId: deployment.realmId,
    core: getAddress(deployment.core),
    profile: deployment.profile ?? 'efs-lab/1',
    operation,
    ...(subject ? { subject } : {}),
    ...(key ? { key } : {}),
  }
}

function foundResult({ value, domain, basis, evidence, bytes = 'RETURNED', integrity = 'NOT_APPLICABLE' }) {
  return {
    outcome: 'FOUND',
    value,
    domain,
    basis,
    qualification: qualification({
      coverage: 'COMPLETE',
      validation: 'VALID',
      currentness: 'CURRENT_AT_BASIS',
      integrity,
      availability: 'AVAILABLE',
      bytes,
    }),
    evidence,
  }
}

function unknownResult({ domain, basis, evidence, reasonCode }) {
  return {
    outcome: 'UNKNOWN',
    domain,
    basis,
    qualification: qualification({ coverage: 'UNKNOWN', availability: 'UNKNOWN' }),
    evidence,
    reasonCode,
  }
}

function typedDataPayload(domain, types, primaryType, message) {
  return {
    domain: typedDataJsonValue(domain),
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ...types,
    },
    primaryType,
    message: typedDataJsonValue(message),
  }
}

async function providerRequest(provider, method, params) {
  if (!provider || typeof provider.request !== 'function') throw new Error(`MISSING_PROVIDER_${method}`)
  const request = { method, params }
  try {
    const response = await provider.request(request)
    return { value: response, observation: { source: 'eip1193', request, response } }
  } catch (error) {
    error.observation = errorObservation(error, request)
    throw error
  }
}

function validateDeployment(deployment) {
  if (!deployment) throw new TypeError('deployment is required')
  if (typeof deployment.chainId === 'number' && !Number.isSafeInteger(deployment.chainId)) throw new RangeError('chainId number is not a safe integer')
  if (!deployment.runtimeCodeHashes) throw new TypeError('runtimeCodeHashes are required')
  return Object.freeze({
    ...deployment,
    chainId: BigInt(deployment.chainId),
    core: getAddress(deployment.core),
    byteStore: getAddress(deployment.byteStore),
    owner: getAddress(deployment.owner),
    rootId: assertHex(deployment.rootId, 32, 'rootId'),
    runId: assertHex(deployment.runId, 32, 'runId'),
    realmId: assertHex(deployment.realmId ?? deployment.runId, 32, 'realmId'),
    profile: deployment.profile ?? 'efs-lab/1',
    runtimeCodeHashes: Object.freeze({
      core: assertHex(deployment.runtimeCodeHashes.core, 32, 'runtimeCodeHashes.core'),
      byteStore: assertHex(deployment.runtimeCodeHashes.byteStore, 32, 'runtimeCodeHashes.byteStore'),
    }),
  })
}

export function createLabSdk({ readProvider, walletProvider, relayProvider, sessionProvider, deployment }) {
  const deployed = validateDeployment(deployment)
  const read = makeRpc(readProvider, deployed)

  async function readExact(request) {
    const operation = `exact:${request.kind}`
    const subject = request.id ?? request.file
    const key = request.kind === 'child' ? keccak256(toUtf8Bytes(request.name)) : undefined
    const domain = domainFor(deployed, operation, subject, key)
    const exactRevision = request.kind === 'revision' ? u64(request.revision, 'revision') : undefined
    const exactOrdinal = request.kind === 'receipt' ? unsigned(request.ordinal, 'ordinal') : undefined
    let pinned
    try {
      pinned = await read.basis(request.blockTag)
      const deploymentEvidence = await read.verifyDeployment(pinned.basis)
      let functionName
      let args
      if (request.kind === 'node') [functionName, args] = ['getNode', [request.id]]
      else if (request.kind === 'revision') [functionName, args] = ['getRevision', [request.file, exactRevision]]
      else if (request.kind === 'record') [functionName, args] = ['getRecord', [request.id]]
      else if (request.kind === 'schema') [functionName, args] = ['getSchema', [request.id]]
      else if (request.kind === 'child') [functionName, args] = ['child', [request.parent, request.name]]
      else if (request.kind === 'grant') [functionName, args] = ['grantInfo', [request.id]]
      else if (request.kind === 'grantBasis') [functionName, args] = ['grantBasis', [request.id]]
      else if (request.kind === 'receipt') [functionName, args] = ['receipt', [exactOrdinal]]
      else if (request.kind === 'receiptCount') [functionName, args] = ['receiptCount', []]
      else if (request.kind === 'ownerNonce') [functionName, args] = ['ownerNonce', []]
      else throw new Error('UNSUPPORTED_EXACT_KIND')
      const result = await read.call('core', functionName, args, pinned.basis)
      const evidence = [...pinned.observations, ...deploymentEvidence, result.observation]
      if (request.kind === 'child' && String(result.value).toLowerCase() === ZeroHash) {
        return {
          outcome: 'ABSENT_PROVEN',
          domain,
          basis: pinned.basis,
          qualification: qualification({ coverage: 'COMPLETE', validation: 'VALID', currentness: 'CURRENT_AT_BASIS', availability: 'AVAILABLE' }),
          evidence,
          reasonCode: 'NO_CHILD_AT_NAME',
        }
      }
      if (request.kind === 'schema') {
        const observedValue = asDataHex(result.value)
        const computedSchemaId = deriveSchemaId(observedValue)
        const identityMatches = computedSchemaId === assertHex(request.id, 32, 'schemaId')
        if (!identityMatches) {
          return {
            outcome: 'FOUND',
            value: undefined,
            observedValue,
            computedSchemaId,
            domain,
            basis: pinned.basis,
            qualification: qualification({
              coverage: 'COMPLETE',
              validation: 'INVALID',
              currentness: 'CURRENT_AT_BASIS',
              integrity: 'FAILED',
              availability: 'AVAILABLE',
              bytes: 'RETURNED',
            }),
            evidence,
            reasonCode: 'SCHEMA_ID_MISMATCH',
          }
        }
        return foundResult({ value: observedValue, domain, basis: pinned.basis, evidence, integrity: 'VERIFIED' })
      }
      return foundResult({ value: result.value, domain, basis: pinned.basis, evidence })
    } catch (error) {
      const evidence = [...(pinned?.observations ?? []), ...errorEvidence(error)]
      if (pinned && isExactError(error, read.core, 'Missing') && ['node', 'revision', 'record', 'schema', 'grant', 'grantBasis', 'receipt'].includes(request.kind)) {
        return {
          outcome: 'ABSENT_PROVEN',
          domain,
          basis: pinned.basis,
          qualification: qualification({ coverage: 'COMPLETE', validation: 'VALID', currentness: 'CURRENT_AT_BASIS', availability: 'AVAILABLE' }),
          evidence,
          reasonCode: 'LAB_EXACT_GETTER_REVERT',
        }
      }
      return unknownResult({ domain, basis: pinned?.basis, evidence, reasonCode: 'PROVIDER_OR_BASIS_UNAVAILABLE' })
    }
  }

  async function readPage(request) {
    const limit = Number(request.limit)
    if (!Number.isInteger(limit) || limit < 1 || limit > 64) throw new RangeError('page limit must be 1..64')
    const cursor = unsigned(request.cursor ?? 0n, 'cursor')
    const domain = domainFor(deployed, `page:${request.kind}`, request.directory)
    let pinned
    try {
      pinned = await read.basis(request.blockTag)
      const deploymentEvidence = await read.verifyDeployment(pinned.basis)
      const fn = request.kind === 'children' ? 'list' : request.kind
      const args = request.kind === 'children' ? [request.directory, cursor, limit] : [cursor, limit]
      if (!['list', 'records', 'schemas'].includes(fn)) throw new Error('UNSUPPORTED_PAGE_KIND')
      const call = await read.call('core', fn, args, pinned.basis)
      const [ids, next, total] = call.value
      const nextCursor = BigInt(next)
      const totalCount = BigInt(total)
      const validPage = nextCursor === cursor + BigInt(ids.length) && nextCursor <= totalCount && ids.length <= limit
      if (!validPage) {
        return {
          ...unknownResult({
            domain,
            basis: pinned.basis,
            evidence: [...pinned.observations, ...deploymentEvidence, call.observation],
            reasonCode: 'MALFORMED_PAGE',
          }),
          qualification: qualification({ coverage: 'UNKNOWN', validation: 'INVALID', availability: 'AVAILABLE', bytes: 'RETURNED' }),
        }
      }
      const pageComplete = nextCursor >= totalCount
      const scopeComplete = cursor === 0n && pageComplete
      const outcome = scopeComplete && totalCount === 0n ? 'ABSENT_PROVEN' : 'FOUND'
      return {
        outcome,
        items: ids,
        cursor,
        next: nextCursor,
        total: totalCount,
        pageCoverage: pageComplete ? 'PAGE_COMPLETE' : 'PAGE_PARTIAL',
        continuation: pageComplete ? null : { cursor: nextCursor, basis: pinned.basis, domain, total: totalCount },
        domain,
        basis: pinned.basis,
        qualification: qualification({
          coverage: scopeComplete ? 'COMPLETE' : 'PARTIAL',
          validation: 'VALID',
          currentness: 'CURRENT_AT_BASIS',
          availability: 'AVAILABLE',
          bytes: 'RETURNED',
        }),
        evidence: [...pinned.observations, ...deploymentEvidence, call.observation],
      }
    } catch (error) {
      return unknownResult({
        domain,
        basis: pinned?.basis,
        evidence: [...(pinned?.observations ?? []), ...errorEvidence(error)],
        reasonCode: 'PAGE_UNAVAILABLE',
      })
    }
  }

  async function readVerifiedBytes(request) {
    const contentId = assertHex(request.contentId, 32, 'contentId')
    const requestedRange = request.range
      ? { offset: unsigned(request.range.offset, 'range.offset'), length: u32(request.range.length, 'range.length') }
      : undefined
    const domain = domainFor(deployed, 'verified-bytes', contentId)
    let pinned
    try {
      pinned = await read.basis(request.blockTag)
      const deploymentEvidence = await read.verifyDeployment(pinned.basis)
      const exists = await read.call('byteStore', 'exists', [contentId], pinned.basis)
      const evidence = [...pinned.observations, ...deploymentEvidence, exists.observation]
      if (!exists.value) {
        return {
          outcome: 'FOUND',
          domain,
          basis: pinned.basis,
          qualification: qualification({ coverage: 'COMPLETE', validation: 'VALID', availability: 'UNAVAILABLE', bytes: 'NOT_RETURNED', integrity: 'UNKNOWN' }),
          evidence,
          reasonCode: 'CARRIER_MISSING',
        }
      }
      const full = await read.call('byteStore', 'read', [contentId], pinned.basis)
      evidence.push(full.observation)
      const bytes = asDataHex(full.value)
      const computed = deriveContentId(bytes)
      let range
      let rangeMatches = true
      if (requestedRange) {
        const { offset, length } = requestedRange
        const ranged = await read.call('byteStore', 'readRange', [contentId, offset, length], pinned.basis)
        evidence.push(ranged.observation)
        range = asDataHex(ranged.value)
        const fullBytes = getBytes(bytes)
        const start = offset > BigInt(fullBytes.length) ? fullBytes.length : Number(offset)
        const source = fullBytes.slice(start, start + Number(length))
        rangeMatches = range === hexlify(source).toLowerCase()
      }
      const expectedBytesMatch = request.expectedBytes == null || asDataHex(request.expectedBytes) === bytes
      const valid = computed === contentId && expectedBytesMatch && rangeMatches
      return {
        outcome: 'FOUND',
        value: valid ? { bytes, ...(range != null ? { range } : {}) } : undefined,
        observedBytes: bytes,
        ...(range != null ? { observedRange: range } : {}),
        computedContentId: computed,
        domain,
        basis: pinned.basis,
        qualification: qualification({
          coverage: 'COMPLETE',
          validation: 'VALID',
          currentness: 'CURRENT_AT_BASIS',
          integrity: valid ? 'VERIFIED' : 'FAILED',
          availability: 'AVAILABLE',
          bytes: 'RETURNED',
        }),
        evidence,
        ...(!valid ? { reasonCode: !rangeMatches ? 'RANGE_MISMATCH' : 'CONTENT_ID_MISMATCH' } : {}),
      }
    } catch (error) {
      return unknownResult({
        domain,
        basis: pinned?.basis,
        evidence: [...(pinned?.observations ?? []), ...errorEvidence(error)],
        reasonCode: 'BYTE_PROVIDER_UNAVAILABLE',
      })
    }
  }

  async function validateTypedPayloadAtBasis({ schemaId, data, blockTag = 'latest' }) {
    const requestedSchemaId = assertHex(schemaId, 32, 'schemaId')
    const domain = domainFor(deployed, 'validate-typed-payload', requestedSchemaId)
    let pinned
    try {
      pinned = await read.basis(blockTag)
      const deploymentEvidence = await read.verifyDeployment(pinned.basis)
      const schemaCall = await read.call('core', 'getSchema', [requestedSchemaId], pinned.basis)
      const descriptor = asDataHex(schemaCall.value)
      const computedSchemaId = deriveSchemaId(descriptor)
      const evidence = [...pinned.observations, ...deploymentEvidence, schemaCall.observation]
      if (computedSchemaId !== requestedSchemaId) {
        return {
          outcome: 'FOUND',
          valid: false,
          observedDescriptor: descriptor,
          computedSchemaId,
          domain,
          basis: pinned.basis,
          qualification: qualification({
            coverage: 'COMPLETE',
            validation: 'INVALID',
            currentness: 'CURRENT_AT_BASIS',
            integrity: 'FAILED',
            availability: 'AVAILABLE',
            bytes: 'RETURNED',
          }),
          evidence,
          reasonCode: 'SCHEMA_ID_MISMATCH',
        }
      }
      const schema = parseSchema(descriptor)
      const fields = decodeTypedPayload(descriptor, data)
      const references = []
      for (let i = 0; i < schema.length; i += 1) {
        if (schema[i].tag !== 5) continue
        const recordCall = await read.call('core', 'getRecord', [fields[i]], pinned.basis)
        evidence.push(recordCall.observation)
        const actualSchemaId = recordCall.value.schemaId.toLowerCase()
        references.push({ recordId: fields[i], expectedSchemaId: schema[i].schemaId, actualSchemaId })
        if (actualSchemaId !== schema[i].schemaId.toLowerCase()) {
          return {
            outcome: 'FOUND',
            valid: false,
            descriptor,
            fields,
            references,
            domain,
            basis: pinned.basis,
            qualification: qualification({ coverage: 'COMPLETE', validation: 'INVALID', integrity: 'VERIFIED', availability: 'AVAILABLE', bytes: 'RETURNED' }),
            evidence,
            reasonCode: 'REFERENCE_SCHEMA_MISMATCH',
          }
        }
      }
      return {
        outcome: 'FOUND',
        valid: true,
        descriptor,
        fields,
        references,
        domain,
        basis: pinned.basis,
        computedSchemaId,
        qualification: qualification({ coverage: 'COMPLETE', validation: 'VALID', integrity: 'VERIFIED', availability: 'AVAILABLE', bytes: 'RETURNED' }),
        evidence,
      }
    } catch (error) {
      return unknownResult({
        domain,
        basis: pinned?.basis,
        evidence: [...(pinned?.observations ?? []), ...errorEvidence(error)],
        reasonCode: isCallRevert(error) ? 'REFERENCE_OR_SCHEMA_ABSENT' : 'TYPED_VALIDATION_UNAVAILABLE',
      })
    }
  }

  function planWrite({ operation, previousRevisionId }) {
    const op = canonicalOperation(operation)
    const domain = labDomain(deployed)
    const operationBytes = encodeOperation(op)
    const digest = operationDigest(deployed, op)
    let predicted
    if (op.kind === 1 || op.kind === 2) {
      const resultId = deriveNodeId({ ...deployed, kind: op.kind, target: op.target, name: op.name, salt: op.salt })
      predicted = { resultId }
      if (op.kind === 2) {
        const contentId = deriveContentId(op.data)
        predicted = { ...predicted, contentId, revision: 1n, revisionId: deriveRevisionId({ fileId: resultId, revision: 1n, contentId }) }
      }
    } else if (op.kind === 3) {
      if (!previousRevisionId) throw new Error('PREVIOUS_REVISION_ID_REQUIRED')
      const contentId = deriveContentId(op.data)
      const revision = op.expectedRevision + 1n
      predicted = {
        resultId: op.target,
        contentId,
        revision,
        previousRevisionId,
        revisionId: deriveRevisionId({ fileId: op.target, revision, contentId, previous: previousRevisionId }),
      }
    } else if (op.kind === 4) {
      predicted = { resultId: deriveRecordId({ schemaId: op.schemaId, data: op.data }), contentId: deriveContentId(op.data) }
    } else throw new Error('UNSUPPORTED_OPERATION_KIND')
    return {
      family: 'PlannedWrite',
      stage: 'PLANNED',
      operation: op,
      operationBytes,
      typedData: { domain, types: OperationTypes, primaryType: 'Operation', message: op },
      digest,
      predicted,
      roles: { principal: deployed.owner },
      sourceEvidence: [],
      qualification: qualification({ effect: 'UNKNOWN' }),
    }
  }

  async function prepareWrite(plan, { mode, account, grant } = {}) {
    if (plan.family !== 'PlannedWrite' || plan.digest !== operationDigest(deployed, plan.operation)) throw new Error('PLAN_TAMPERED')
    const selected = mode?.toUpperCase()
    if (!['RELAYED', 'DIRECT', 'SESSION'].includes(selected)) throw new Error('UNKNOWN_WRITE_MODE')
    const prepared = {
      ...plan,
      family: 'PreparedWrite',
      stage: 'AUTHORIZED',
      selectedPath: selected,
      actualSigner: account ? getAddress(account) : undefined,
      witness: '0x',
      providerEvidence: [],
      localChecks: ['PLAN_DIGEST_MATCH'],
      qualification: qualification({ effect: 'UNKNOWN' }),
    }
    if (selected === 'DIRECT') {
      if (getAddress(account) !== deployed.owner) throw new Error('DIRECT_OWNER_REQUIRED')
      prepared.stage = 'PLANNED'
      prepared.localChecks.push('DIRECT_OWNER_MATCH')
      return prepared
    }
    if (selected === 'SESSION') {
      const checked = canonicalGrant(grant)
      if (grantDigest(deployed, checked) !== plan.operation.grantId) throw new Error('GRANT_ID_MISMATCH')
      if (getAddress(account) !== checked.key) throw new Error('SESSION_KEY_MISMATCH')
      if (plan.operation.deadline > checked.expiry) throw new Error('PLAN_AFTER_GRANT_EXPIRY')
      const requiredMask = plan.operation.kind === 1 ? 1 : plan.operation.kind === 2 ? 2 : plan.operation.kind === 3 ? 4 : 0
      if (requiredMask === 0 || (checked.operations & requiredMask) === 0) throw new Error('GRANT_OPERATION_OUT_OF_SCOPE')
      if (BigInt(getBytes(plan.operation.data).length) > checked.maxBytes) throw new Error('GRANT_SINGLE_PAYLOAD_OVER_BUDGET')
      prepared.grant = checked
      prepared.localChecks.push('GRANT_DIGEST_MATCH', 'SESSION_KEY_MATCH', 'GRANT_DEADLINE_MATCH', 'GRANT_OPERATION_MASK')
    } else if (getAddress(account) !== deployed.owner) throw new Error('OWNER_SIGNER_REQUIRED')
    const signingProvider = selected === 'SESSION' ? sessionProvider : walletProvider
    const payload = typedDataPayload(plan.typedData.domain, OperationTypes, 'Operation', plan.operation)
    const signed = await providerRequest(signingProvider, 'eth_signTypedData_v4', [getAddress(account), JSON.stringify(payload)])
    verifySignature(plan.digest, signed.value, account)
    prepared.witness = signed.value
    prepared.providerEvidence.push(signed.observation)
    prepared.localChecks.push('SIGNATURE_LOW_S_AND_RECOVERED')
    return prepared
  }

  async function submitWrite(prepared, { from } = {}) {
    if (prepared.family !== 'PreparedWrite') throw new Error('PREPARED_WRITE_REQUIRED')
    const direct = prepared.selectedPath === 'DIRECT'
    const iface = read.core
    const data = direct
      ? iface.encodeFunctionData('executeDirect', [prepared.operation])
      : iface.encodeFunctionData('execute', [prepared.operation, prepared.witness])
    const submitter = direct ? getAddress(prepared.actualSigner) : getAddress(from)
    const submitProvider = direct ? walletProvider : relayProvider
    const sent = await providerRequest(submitProvider, 'eth_sendTransaction', [{ from: submitter, to: deployed.core, data }])
    let receipt
    let receiptObservation
    try {
      const observed = await providerRequest(readProvider, 'eth_getTransactionReceipt', [sent.value])
      receipt = observed.value
      receiptObservation = observed.observation
    } catch (error) {
      receiptObservation = error.observation
    }
    return {
      ...prepared,
      family: 'SubmittedWrite',
      stage: receipt ? (BigInt(receipt.status) === 1n ? 'INCLUDED' : 'REVERTED') : 'SUBMITTED',
      roles: { ...prepared.roles, signer: prepared.actualSigner, submitter },
      transactionHash: sent.value,
      transactionReceipt: receipt ?? null,
      providerEvidence: [...prepared.providerEvidence, sent.observation, ...(receiptObservation ? [receiptObservation] : [])],
      qualification: qualification({ effect: 'UNKNOWN' }),
    }
  }

  async function readBack(submitted, { blockTag = 'latest', maxReceipts = 128, maxPages = 4 } = {}) {
    if (submitted.family !== 'SubmittedWrite') throw new Error('SUBMITTED_WRITE_REQUIRED')
    if (!Number.isSafeInteger(maxPages) || maxPages < 1 || maxPages > 64) throw new RangeError('maxPages must be a safe integer in 1..64')
    const receiptCap = u32(maxReceipts, 'maxReceipts')
    const evidence = []
    const checks = []
    let searchBasis
    try {
      const operationBytes = asDataHex(submitted.operationBytes)
      const operation = decodeOperation(operationBytes)
      const digest = operationDigest(deployed, operation)
      checks.push(['submitted.digest', String(submitted.digest).toLowerCase() === digest])

      const searched = await read.basis(blockTag)
      searchBasis = searched.basis
      evidence.push(...searched.observations, ...(await read.verifyDeployment(searchBasis)))
      const countCall = await read.call('core', 'receiptCount', [], searchBasis)
      evidence.push(countCall.observation)
      const count = BigInt(countCall.value)
      const cap = receiptCap
      const start = count > cap ? count - cap : 0n
      let storedReceipt
      for (let ordinal = start; ordinal < count; ordinal += 1n) {
        const receiptCall = await read.call('core', 'receipt', [ordinal], searchBasis)
        evidence.push(receiptCall.observation)
        const receipt = receiptCall.value
        if (String(receipt.digest).toLowerCase() === digest) {
          storedReceipt = { ordinal, ...receipt }
          break
        }
      }
      if (!storedReceipt) {
        return {
          family: 'CanonicalReadBack',
          stage: submitted.stage,
          comparison: 'UNKNOWN',
          effect: 'UNKNOWN',
          basis: searchBasis,
          checks,
          evidence,
          prior: submitted,
          qualification: qualification({ effect: 'UNKNOWN' }),
          reasonCode: start > 0n ? 'RECEIPT_SEARCH_BOUNDED' : 'RECEIPT_NOT_RECOVERED',
        }
      }

      const effectPinned = await read.basis(BigInt(storedReceipt.blockNumber))
      const effectBasis = effectPinned.basis
      evidence.push(...effectPinned.observations, ...(await read.verifyDeployment(effectBasis)))
      checks.push(['receipt.timestamp', BigInt(storedReceipt.timestamp) === BigInt(effectBasis.timestamp)])
      checks.push(['receipt.digest', String(storedReceipt.digest).toLowerCase() === digest])
      checks.push(['receipt.operationBytes', String(storedReceipt.operationBytes).toLowerCase() === operationBytes])
      checks.push(['receipt.operationCanonical', encodeOperation(decodeOperation(storedReceipt.operationBytes)).toLowerCase() === operationBytes])

      let predicted
      if (operation.kind === 1 || operation.kind === 2) {
        const resultId = deriveNodeId({ ...deployed, kind: operation.kind, target: operation.target, name: operation.name, salt: operation.salt })
        predicted = { resultId }
        if (operation.kind === 2) {
          const contentId = deriveContentId(operation.data)
          predicted = { ...predicted, revision: 1n, contentId, revisionId: deriveRevisionId({ fileId: resultId, revision: 1n, contentId }) }
        }
      } else if (operation.kind === 3) {
        const previous = await read.call('core', 'getRevision', [operation.target, operation.expectedRevision], effectBasis)
        evidence.push(previous.observation)
        const previousRevisionId = deriveRevisionId({
          fileId: operation.target,
          revision: operation.expectedRevision,
          contentId: previous.value.contentId,
          previous: previous.value.previous,
        })
        const contentId = deriveContentId(operation.data)
        predicted = {
          resultId: operation.target,
          revision: operation.expectedRevision + 1n,
          contentId,
          previousRevisionId,
          revisionId: deriveRevisionId({ fileId: operation.target, revision: operation.expectedRevision + 1n, contentId, previous: previousRevisionId }),
        }
      } else if (operation.kind === 4) {
        predicted = { resultId: deriveRecordId({ schemaId: operation.schemaId, data: operation.data }), contentId: deriveContentId(operation.data) }
      } else throw new Error('UNSUPPORTED_OPERATION_KIND')
      checks.push(['receipt.resultId', String(storedReceipt.resultId).toLowerCase() === predicted.resultId])
      checks.push(['receipt.revision', BigInt(storedReceipt.revision) === BigInt(predicted.revision ?? 0n)])

      let authority = 'UNKNOWN'
      const mode = Number(storedReceipt.mode)
      if (mode === 2) {
        verifySignature(digest, storedReceipt.witness, deployed.owner)
        const signerMatches = getAddress(storedReceipt.signer) === deployed.owner
        checks.push(['authority.owner-signature', signerMatches])
        authority = signerMatches ? 'AUTHORIZED_AT_BASIS' : 'UNAUTHORIZED_PROVEN'
      } else if (mode === 3) {
        if (operation.grantId === ZeroHash) throw new Error('SESSION_RECEIPT_WITHOUT_GRANT')
        const grantInfo = await read.call('core', 'grantInfo', [operation.grantId], searchBasis)
        const grantBasis = await read.call('core', 'grantBasis', [operation.grantId], searchBasis)
        evidence.push(grantInfo.observation, grantBasis.observation)
        const grant = canonicalGrant(grantInfo.value.grant)
        const basis = grantBasis.value
        verifySignature(operation.grantId, grantInfo.value.approval, deployed.owner)
        verifySignature(digest, storedReceipt.witness, grant.key)
        checks.push(['authority.grant-id', grantDigest(deployed, grant) === operation.grantId])
        checks.push(['authority.session-signer', getAddress(storedReceipt.signer) === grant.key])
        checks.push(['authority.registered-boundary', storedReceipt.ordinal >= BigInt(basis.registeredAtReceipt)])
        const revokedAt = BigInt(basis.revokedAtReceipt)
        checks.push(['authority.revoked-boundary', revokedAt === 0n || storedReceipt.ordinal < revokedAt])
        checks.push(['authority.expiry', BigInt(storedReceipt.timestamp) <= grant.expiry])
        let usedWrites = 0n
        let usedBytes = 0n
        const registeredAt = BigInt(basis.registeredAtReceipt)
        if (storedReceipt.ordinal - registeredAt > cap) throw new Error('SESSION_HISTORY_BOUND_EXCEEDED')
        for (let ordinal = registeredAt; ordinal < storedReceipt.ordinal; ordinal += 1n) {
          const earlierCall = await read.call('core', 'receipt', [ordinal], searchBasis)
          evidence.push(earlierCall.observation)
          const earlier = earlierCall.value
          if (Number(earlier.mode) !== 3) continue
          const earlierOp = decodeOperation(earlier.operationBytes)
          if (earlierOp.grantId !== operation.grantId) continue
          usedWrites += 1n
          usedBytes += BigInt(getBytes(earlierOp.data).length)
        }
        checks.push(['authority.historical-nonce', operation.nonce === usedWrites])
        checks.push(['authority.write-budget', usedWrites < BigInt(grant.maxWrites)])
        checks.push(['authority.byte-budget', usedBytes + BigInt(getBytes(operation.data).length) <= grant.maxBytes])
        let scoped = operation.target === grant.scope
        let cursor = operation.target
        for (let depth = 0; !scoped && depth < 16 && cursor !== ZeroHash; depth += 1) {
          const nodeCall = await read.call('core', 'getNode', [cursor], effectBasis)
          evidence.push(nodeCall.observation)
          cursor = nodeCall.value.parent.toLowerCase()
          scoped = cursor === grant.scope
        }
        checks.push(['authority.scope', scoped])
        authority = checks.filter(([name]) => name.startsWith('authority.')).every(([, pass]) => pass)
          ? 'AUTHORIZED_AT_BASIS'
          : 'UNAUTHORIZED_PROVEN'
      } else if (mode === 1) {
        checks.push(['authority.direct-empty-witness', storedReceipt.witness === '0x'])
        checks.push(['authority.direct-stored-signer', getAddress(storedReceipt.signer) === deployed.owner])
        if (submitted.transactionHash) {
          const transaction = await providerRequest(readProvider, 'eth_getTransactionByHash', [submitted.transactionHash])
          evidence.push(transaction.observation)
          if (transaction.value) {
            const expectedData = read.core.encodeFunctionData('executeDirect', [operation]).toLowerCase()
            checks.push(['authority.direct-transaction-from', getAddress(transaction.value.from) === deployed.owner])
            checks.push(['authority.direct-transaction-to', getAddress(transaction.value.to) === deployed.core])
            checks.push(['authority.direct-transaction-data', String(transaction.value.input).toLowerCase() === expectedData])
            authority = checks.filter(([name]) => name.startsWith('authority.direct-transaction')).every(([, pass]) => pass)
              ? 'AUTHORIZED_AT_BASIS'
              : 'UNAUTHORIZED_PROVEN'
          }
        }
      } else throw new Error('UNKNOWN_RECEIPT_MODE')

      let currentness = 'CURRENT_AT_BASIS'
      if (operation.kind === 1 || operation.kind === 2 || operation.kind === 3) {
        const node = await read.call('core', 'getNode', [predicted.resultId], effectBasis)
        evidence.push(node.observation)
        if (operation.kind < 3) {
          checks.push(['node.parent', node.value.parent.toLowerCase() === operation.target])
          checks.push(['node.name', node.value.name === operation.name])
          const child = await read.call('core', 'child', [operation.target, operation.name], effectBasis)
          evidence.push(child.observation)
          checks.push(['child.slot', child.value.toLowerCase() === predicted.resultId])
          let cursor = 0n
          let found = false
          let closed = false
          for (let page = 0; page < maxPages; page += 1) {
            const listed = await read.call('core', 'list', [operation.target, cursor, 64], effectBasis)
            evidence.push(listed.observation)
            const [ids, next, total] = listed.value
            const nextCursor = BigInt(next)
            if (nextCursor !== cursor + BigInt(ids.length) || nextCursor > BigInt(total)) throw new Error('MALFORMED_PAGE')
            found ||= ids.some((entry) => entry.toLowerCase() === predicted.resultId)
            cursor = nextCursor
            closed = cursor >= BigInt(total)
            if (closed) break
          }
          checks.push(['directory.contains', found])
          checks.push(['directory.complete', closed])
        }
        if (operation.kind === 2 || operation.kind === 3) {
          checks.push(['node.revision-at-effect', BigInt(node.value.revision) === predicted.revision])
          const revision = await read.call('core', 'getRevision', [predicted.resultId, predicted.revision], effectBasis)
          evidence.push(revision.observation)
          checks.push(['revision.contentId', revision.value.contentId.toLowerCase() === predicted.contentId])
          checks.push(['revision.previous', revision.value.previous.toLowerCase() === (predicted.previousRevisionId ?? ZeroHash)])
          const bytes = await readVerifiedBytes({ contentId: predicted.contentId, expectedBytes: operation.data, blockTag: effectBasis })
          evidence.push(...bytes.evidence)
          checks.push(['bytes.integrity', bytes.qualification.integrity === 'VERIFIED'])
          const currentNode = await read.call('core', 'getNode', [predicted.resultId], searchBasis)
          evidence.push(currentNode.observation)
          if (BigInt(currentNode.value.revision) > predicted.revision) currentness = 'SUPERSEDED'
        }
      } else {
        const record = await read.call('core', 'getRecord', [predicted.resultId], effectBasis)
        evidence.push(record.observation)
        checks.push(['record.schemaId', record.value.schemaId.toLowerCase() === operation.schemaId])
        checks.push(['record.contentId', record.value.contentId.toLowerCase() === predicted.contentId])
        const body = await readVerifiedBytes({ contentId: predicted.contentId, expectedBytes: operation.data, blockTag: effectBasis })
        evidence.push(...body.evidence)
        checks.push(['record.body-integrity', body.qualification.integrity === 'VERIFIED'])
        const typed = await validateTypedPayloadAtBasis({ schemaId: operation.schemaId, data: operation.data, blockTag: effectBasis })
        evidence.push(...typed.evidence)
        checks.push(['record.schema-validation', typed.valid === true])
      }

      const effectChecks = checks.filter(([name]) => !name.startsWith('authority.') && name !== 'submitted.digest')
      const stateMatches = effectChecks.every(([, passed]) => passed)
      const submittedMatches = checks.find(([name]) => name === 'submitted.digest')?.[1] === true
      const authorityMatches = authority === 'AUTHORIZED_AT_BASIS'
      const verified = stateMatches && authorityMatches
      const comparison = !stateMatches
        ? 'MISMATCH'
        : !authorityMatches
          ? authority === 'UNAUTHORIZED_PROVEN' ? 'STATE_MATCH_AUTHORITY_CONFLICT' : 'STATE_MATCH_AUTHORITY_UNKNOWN'
          : submittedMatches ? 'MATCH' : 'MATCH_WITH_SUBMITTED_METADATA_DRIFT'
      return {
        family: 'CanonicalReadBack',
        stage: verified ? 'READ_BACK_VERIFIED' : submitted.stage,
        comparison,
        stateEffect: stateMatches ? 'OBSERVED_AT_BASIS' : 'UNKNOWN',
        effect: verified ? 'COMMITTED' : 'UNKNOWN',
        basis: effectBasis,
        observedAt: searchBasis,
        checks,
        evidence,
        predicted,
        recoveredReceipt: storedReceipt,
        prior: submitted,
        qualification: qualification({
          coverage: stateMatches ? 'COMPLETE' : 'UNKNOWN',
          validation: stateMatches ? 'VALID' : 'INVALID',
          authority,
          currentness,
          availability: 'AVAILABLE',
          effect: verified ? 'COMMITTED' : 'UNKNOWN',
        }),
      }
    } catch (error) {
      checks.push(['readBack.available', false, String(error?.shortMessage ?? error?.message ?? error)])
      return {
        family: 'CanonicalReadBack',
        stage: submitted.stage,
        comparison: 'UNKNOWN',
        effect: 'UNKNOWN',
        basis: searchBasis,
        checks,
        evidence: [...evidence, ...errorEvidence(error)],
        prior: submitted,
        qualification: qualification({ coverage: 'UNKNOWN', validation: 'UNKNOWN', authority: 'UNKNOWN', availability: 'UNKNOWN', effect: 'UNKNOWN' }),
        reasonCode: 'READ_BACK_UNAVAILABLE',
        error: { name: error.name ?? 'Error', message: String(error.message ?? error) },
      }
    }
  }

  async function registerSchema({ descriptor, from = deployed.owner }) {
    const data = read.core.encodeFunctionData('registerSchema', [asDataHex(descriptor)])
    const sent = await providerRequest(walletProvider, 'eth_sendTransaction', [{ from: getAddress(from), to: deployed.core, data }])
    return { transactionHash: sent.value, predictedSchemaId: deriveSchemaId(descriptor), evidence: [sent.observation] }
  }

  async function registerGrant({ grant, owner = deployed.owner, from = owner }) {
    const value = canonicalGrant(grant)
    const payload = typedDataPayload(labDomain(deployed), GrantTypes, 'Grant', value)
    const signed = await providerRequest(walletProvider, 'eth_signTypedData_v4', [getAddress(owner), JSON.stringify(payload)])
    const grantId = grantDigest(deployed, value)
    verifySignature(grantId, signed.value, owner)
    const data = read.core.encodeFunctionData('registerGrant', [value, signed.value])
    const sent = await providerRequest(relayProvider ?? walletProvider, 'eth_sendTransaction', [{ from: getAddress(from), to: deployed.core, data }])
    return { grantId, grant: value, ownerSignature: signed.value, transactionHash: sent.value, evidence: [signed.observation, sent.observation] }
  }

  const operations = Object.freeze({
    mkdir: (input) => canonicalOperation({ ...input, kind: 1, schemaId: ZeroHash, data: '0x', expectedRevision: 0n, grantId: input.grantId ?? ZeroHash }),
    createFile: (input) => canonicalOperation({ ...input, kind: 2, schemaId: ZeroHash, expectedRevision: 0n, grantId: input.grantId ?? ZeroHash }),
    reviseFile: (input) => canonicalOperation({ ...input, kind: 3, name: '', schemaId: ZeroHash, salt: ZeroHash, grantId: input.grantId ?? ZeroHash }),
    publishRecord: (input) => canonicalOperation({ ...input, kind: 4, name: '', target: input.target ?? deployed.rootId, salt: ZeroHash, expectedRevision: 0n, grantId: ZeroHash }),
  })

  return Object.freeze({
    deployment: deployed,
    operations,
    readExact,
    readPage,
    readVerifiedBytes,
    validateTypedPayloadAtBasis,
    planWrite,
    prepareWrite,
    submitWrite,
    readBack,
    registerSchema,
    registerGrant,
  })
}

export { ZeroAddress, ZeroHash }
