import type { Address, Basis, CanonicalReadBack, Eip1193Provider, ExactReadResult, Hex, LabDeployment, LabSdk, Operation, PlannedWrite, PreparedWrite, SubmittedWrite } from '../../2026-09-04-mvp-rehearsal/sdk/index.js'
export type { Hex, Operation }
export type At = Basis | bigint | Hex | 'latest'
export type Config = {
  deployment: Omit<LabDeployment, 'profile' | 'realmId' | 'chainId'> & { profile: 'efs-lab/1'; realmId: Hex; chainId: bigint }
  readProvider: Eip1193Provider
  walletProvider?: Eip1193Provider
  relayProvider?: Eip1193Provider
}
export type Policy = { mode: 'direct'; account: Address; submitter?: never } | { mode: 'relayed'; account: Address; submitter: Address }
type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T
declare const brand: unique symbol
type Handle<Name extends string, Evidence> = { readonly [brand]: Name; readonly profile: 'efs-lab/1'; readonly evidence: DeepReadonly<Evidence> }
export type Plan = Handle<'Plan', PlannedWrite>
export type Approval = Handle<'Approval', PreparedWrite>
export type Submission = Handle<'Submission', SubmittedWrite>
type BytesRead = Awaited<ReturnType<LabSdk['readVerifiedBytes']>>
type TypedRead = Awaited<ReturnType<LabSdk['validateTypedPayloadAtBasis']>>
export type FileRead = {
  value?: { id: Hex; revision: bigint; bytes: Hex }
  raw: { node: ExactReadResult; revision?: ExactReadResult; bytes?: BytesRead }
  reason?: string
}
export type RecordRead = {
  value?: { id: Hex; schemaId: Hex; fields: unknown[]; bytes: Hex }
  raw: { record: ExactReadResult; bytes?: BytesRead; typed?: TypedRead }
  reason?: string
  computedRecordId?: Hex
}
type ApprovalEvidence = { plan: DeepReadonly<PlannedWrite>; policy: DeepReadonly<Policy>; prepared?: PreparedWrite }
export interface LabClient {
  readonly profile: 'efs-lab/1'
  readonly files: {
    list(request: { directory: Hex; cursor: bigint; limit: number; at: At }): ReturnType<LabSdk['readPage']>
    read(request: { id: Hex; at: At }): Promise<FileRead>
  }
  readonly records: { read(request: { id: Hex; schemaId: Hex; at: At }): Promise<RecordRead> }
  readonly writes: {
    plan(request: { operation: Operation; previousRevisionId?: Hex }): Plan
    approve(plan: Plan, request: {
      policy: Policy; signal: AbortSignal
      decide(request: { evidence: DeepReadonly<PlannedWrite>; policy: DeepReadonly<Policy>; signal: AbortSignal }): Promise<boolean>
    }): Promise<{ status: 'APPROVED'; approval: Approval } | { status: 'CANCELLED' | 'DECLINED'; evidence: ApprovalEvidence }>
    submit(approval: Approval, request: { signal: AbortSignal }): Promise<
      { status: 'SUBMITTED'; submission: Submission } |
      { status: 'CANCELLED'; evidence: { prepared: DeepReadonly<PreparedWrite> } } |
      { status: 'UNKNOWN'; evidence: { prepared: DeepReadonly<PreparedWrite>; error: unknown } }
    >
    verify(submission: Submission, request: { at: At; maxReceipts: number; maxPages: number }): Promise<CanonicalReadBack>
  }
}
export function createLabClient(config: Config): LabClient
