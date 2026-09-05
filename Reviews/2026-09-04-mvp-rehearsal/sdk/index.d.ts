export type Hex = `0x${string}`
export type Address = `0x${string}`
export type Outcome = 'FOUND' | 'ABSENT_PROVEN' | 'UNKNOWN' | 'CONFLICT'
export type OperationStage = 'PLANNED' | 'AUTHORIZED' | 'SUBMITTED' | 'INCLUDED' | 'REVERTED' | 'READ_BACK_VERIFIED' | 'UNKNOWN'

export interface Eip1193Provider {
  request(args: { method: string; params?: readonly unknown[] }): Promise<unknown>
}

export interface Basis {
  chainId: bigint
  blockNumber: bigint
  blockHash: Hex
  timestamp: bigint
}

export interface Domain {
  realmId: Hex
  core: Address
  profile: string
  operation: string
  subject?: Hex
  key?: Hex
}

export interface Qualification {
  coverage: 'COMPLETE' | 'PARTIAL' | 'UNKNOWN'
  support: 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN'
  validation: 'VALID' | 'INVALID' | 'UNKNOWN'
  authority: 'AUTHORIZED_AT_BASIS' | 'UNAUTHORIZED_PROVEN' | 'UNKNOWN' | 'NOT_APPLICABLE'
  currentness: 'CURRENT_AT_BASIS' | 'HISTORICAL' | 'SUPERSEDED' | 'UNKNOWN' | 'NOT_APPLICABLE'
  finality: 'FINAL' | 'UNFINALIZED' | 'UNKNOWN' | 'NOT_APPLICABLE'
  integrity: 'VERIFIED' | 'FAILED' | 'UNKNOWN' | 'NOT_APPLICABLE'
  availability: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN' | 'NOT_APPLICABLE'
  bytes: 'RETURNED' | 'NOT_RETURNED' | 'UNKNOWN' | 'NOT_APPLICABLE'
  effect: 'COMMITTED' | 'NOT_COMMITTED_PROVEN' | 'UNKNOWN' | 'NOT_APPLICABLE'
}

export interface RawObservation {
  source: string
  request: unknown
  response: unknown
  responseBytes?: Hex
  error?: { name: string; message: string; code?: string | number; data?: unknown }
}

export interface ExactReadResult<T = unknown> {
  outcome: Outcome
  value?: T
  observedValue?: unknown
  computedSchemaId?: Hex
  domain: Domain
  basis?: Basis
  qualification: Qualification
  evidence: RawObservation[]
  reasonCode?: string
}

export interface Operation {
  kind: number
  target: Hex
  name: string
  schemaId: Hex
  data: Hex
  salt: Hex
  expectedRevision: bigint
  nonce: bigint
  deadline: bigint
  grantId: Hex
}

export interface Grant {
  key: Address
  scope: Hex
  operations: number
  expiry: bigint
  maxWrites: bigint
  maxBytes: bigint
  nonce: bigint
}

export interface LabDeployment {
  chainId: bigint | number | string
  core: Address
  byteStore: Address
  rootId: Hex
  runId: Hex
  realmId?: Hex
  owner: Address
  profile?: string
  coreAbi: readonly unknown[]
  byteStoreAbi: readonly unknown[]
  runtimeCodeHashes: { core: Hex; byteStore: Hex }
}

export interface PlannedWrite {
  family: 'PlannedWrite'
  stage: 'PLANNED'
  operation: Operation
  operationBytes: Hex
  digest: Hex
  predicted: Record<string, unknown> & { resultId: Hex }
  typedData: { domain: unknown; types: unknown; primaryType: 'Operation'; message: Operation }
  qualification: Qualification
}

export interface PreparedWrite extends Omit<PlannedWrite, 'family' | 'stage'> {
  family: 'PreparedWrite'
  stage: 'PLANNED' | 'AUTHORIZED'
  selectedPath: 'RELAYED' | 'DIRECT' | 'SESSION'
  actualSigner: Address
  witness: Hex
  providerEvidence: RawObservation[]
  localChecks: string[]
  grant?: Grant
}

export interface SubmittedWrite extends Omit<PreparedWrite, 'family' | 'stage'> {
  family: 'SubmittedWrite'
  stage: 'SUBMITTED' | 'INCLUDED' | 'REVERTED'
  transactionHash: Hex
  transactionReceipt: unknown | null
}

export type ReadBackComparison =
  | 'MATCH'
  | 'MATCH_WITH_SUBMITTED_METADATA_DRIFT'
  | 'MISMATCH'
  | 'STATE_MATCH_AUTHORITY_UNKNOWN'
  | 'STATE_MATCH_AUTHORITY_CONFLICT'
  | 'UNKNOWN'

export interface CanonicalReadBack {
  family: 'CanonicalReadBack'
  stage: SubmittedWrite['stage'] | 'READ_BACK_VERIFIED'
  comparison: ReadBackComparison
  stateEffect?: 'OBSERVED_AT_BASIS' | 'UNKNOWN'
  effect: 'COMMITTED' | 'UNKNOWN'
  basis?: Basis
  observedAt?: Basis
  checks: Array<[name: string, passed: boolean, detail?: unknown]>
  evidence: RawObservation[]
  predicted?: Record<string, unknown> & { resultId: Hex }
  recoveredReceipt?: Record<string, unknown>
  prior: SubmittedWrite
  qualification: Qualification
  reasonCode?: string
  error?: { name: string; message: string }
}

export interface LabSdk {
  readonly deployment: LabDeployment
  readonly operations: {
    mkdir(input: Partial<Operation> & Pick<Operation, 'target' | 'name' | 'salt' | 'deadline'>): Operation
    createFile(input: Partial<Operation> & Pick<Operation, 'target' | 'name' | 'data' | 'salt' | 'deadline'>): Operation
    reviseFile(input: Partial<Operation> & Pick<Operation, 'target' | 'data' | 'expectedRevision' | 'deadline'>): Operation
    publishRecord(input: Partial<Operation> & Pick<Operation, 'schemaId' | 'data' | 'deadline'>): Operation
  }
  readExact<T = unknown>(request: Record<string, unknown> & { kind: string; blockTag?: Basis | bigint | Hex | 'latest' }): Promise<ExactReadResult<T>>
  readPage(request: { kind: 'children' | 'records' | 'schemas'; directory?: Hex; cursor?: bigint; limit: number; blockTag?: Basis | bigint | Hex | 'latest' }): Promise<ExactReadResult & { items?: Hex[]; next?: bigint; total?: bigint; pageCoverage?: 'PAGE_COMPLETE' | 'PAGE_PARTIAL'; continuation?: unknown }>
  readVerifiedBytes(request: { contentId: Hex; expectedBytes?: Hex | Uint8Array; range?: { offset: bigint; length: number }; blockTag?: Basis | bigint | Hex | 'latest' }): Promise<ExactReadResult<{ bytes: Hex; range?: Hex }> & { observedBytes?: Hex; observedRange?: Hex; computedContentId?: Hex }>
  validateTypedPayloadAtBasis(request: { schemaId: Hex; data: Hex | Uint8Array; blockTag?: Basis | bigint | Hex | 'latest' }): Promise<ExactReadResult & { valid?: boolean; descriptor?: Hex; observedDescriptor?: Hex; computedSchemaId?: Hex; fields?: unknown[] }>
  planWrite(request: { operation: Operation; previousRevisionId?: Hex }): PlannedWrite
  prepareWrite(plan: PlannedWrite, request: { mode: 'relayed' | 'direct' | 'session'; account: Address; grant?: Grant }): Promise<PreparedWrite>
  submitWrite(prepared: PreparedWrite, request?: { from?: Address }): Promise<SubmittedWrite>
  readBack(submitted: SubmittedWrite, request?: { blockTag?: Basis | bigint | Hex | 'latest'; maxReceipts?: number; maxPages?: number }): Promise<CanonicalReadBack>
  registerSchema(request: { descriptor: Hex | Uint8Array; from?: Address }): Promise<Record<string, unknown>>
  registerGrant(request: { grant: Grant; owner?: Address; from?: Address }): Promise<Record<string, unknown>>
}

export function createLabSdk(config: {
  readProvider: Eip1193Provider
  walletProvider?: Eip1193Provider
  relayProvider?: Eip1193Provider
  sessionProvider?: Eip1193Provider
  deployment: LabDeployment
}): LabSdk

export function asDataHex(value: string | Uint8Array): Hex
export function canonicalOperation(operation: Partial<Operation> & Pick<Operation, 'kind' | 'target' | 'deadline'>): Operation
export function canonicalGrant(grant: Grant): Grant
export function encodeOperation(operation: Operation): Hex
export function decodeOperation(bytes: Hex): Operation
export function operationDigest(deployment: LabDeployment, operation: Operation): Hex
export function grantDigest(deployment: LabDeployment, grant: Grant): Hex
export function deriveRootId(input: { runId: Hex; owner: Address }): Hex
export function deriveNodeId(input: { runId: Hex; owner: Address; kind: number; target: Hex; name: string; salt: Hex }): Hex
export function deriveContentId(data: string | Uint8Array): Hex
export function deriveSchemaId(descriptor: Hex | Uint8Array): Hex
export function deriveRecordId(input: { schemaId: Hex; data: string | Uint8Array }): Hex
export function deriveRevisionId(input: { fileId: Hex; revision: bigint; contentId: Hex; previous?: Hex }): Hex
export function encodeSchema(fields: Array<number | { tag: 5; schemaId: Hex }>): Hex
export function parseSchema(descriptor: Hex | Uint8Array): Array<{ tag: number; schemaId?: Hex }>
export function encodeTypedPayload(descriptor: Hex | Uint8Array, fields: unknown[]): Hex
export function decodeTypedPayload(descriptor: Hex | Uint8Array, data: Hex | Uint8Array): unknown[]
export function exportEvidence(value: unknown): string
export function importEvidence(serialized: string): unknown

export const ZeroAddress: Address
export const ZeroHash: Hex
