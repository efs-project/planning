# MVP rehearsal SDK design

**Status:** implemented disposable browser/contract consumer interface and
bound to the rehearsal ABI. This is not a public SDK, C0 wire format, protocol
freeze, or production package.

## Outcome

The rehearsal SDK exposes five lossless seams over one explicitly supplied lab
deployment. It never hides the exact Realm/Core/profile/domain, block basis,
coverage, raw ABI values, provider observations, or causal write receipts.
Decoded convenience values are views over retained evidence.

```ts
type Hex = `0x${string}`

interface Basis {
  chainId: bigint
  blockNumber: bigint
  blockHash: Hex
  timestamp: bigint
}

interface Domain {
  realmId: Hex
  core: string
  profile: string
  operation: string
  subject?: Hex
  key?: Hex
}

interface Qualification {
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

interface RawObservation {
  source: string
  request: unknown
  response: unknown
  responseBytes?: Hex
  error?: { name: string; message: string; code?: string | number }
}

interface ExactReadResult<T> {
  outcome: 'FOUND' | 'ABSENT_PROVEN' | 'UNKNOWN' | 'CONFLICT'
  value?: T
  domain: Domain
  basis: Basis
  qualification: Qualification
  evidence: RawObservation[]
  evidenceCommitment?: Hex
  reasonCode?: string
}
```

All five APIs return self-contained evidence snapshots. Unknown fields and wide integers are
retained. JSON export uses explicitly tagged bigint/bytes encodings rather than
lossy `JSON.stringify` coercion.

## Five seams

### 1. `readExact(request)`

Reads one exact subject/key at an explicit block hash or resolves `latest` once
and pins it before the contract read. Contract calls and runtime-code reads use
EIP-1898 `{blockHash, requireCanonical:true}`; an unsupported pinned call becomes
`UNKNOWN` rather than silently falling back to a number or `latest`. A zero
value, provider error, unavailable block, or unsupported schema cannot become
`ABSENT_PROVEN`. Only the verified lab runtime's exact decoded `Missing()` error
(or the explicit zero child slot) can prove absence. The result includes the raw
return tuple/bytes and independent local identity/schema validation. Exact
schema reads recompute the schema ID from the returned descriptor bytes; a
valid-shaped substituted descriptor stays returned evidence with
`integrity=FAILED` and `validation=INVALID`, never a trusted value.

### 2. `readPage(request)`

Reads a bounded page under one directory/scope, ordering and high-water value.
The continuation token commits to the same domain and basis. Only the contract's
terminal page from cursor zero yields whole-scope `coverage=COMPLETE`; a
terminal suffix is `pageCoverage=PAGE_COMPLETE` but whole-scope `PARTIAL`.
Observed entries survive timeout or later-page failure; partial never means
empty or absent.

### 3. `readVerifiedBytes(request)`

Reads exact carrier content by commitment, attempts
only the named carrier, retains every attempt, recomputes the byte digest/tree
locally, then returns verified bytes only on equality. Returned corrupt bytes
remain `AVAILABLE`/`RETURNED` with `integrity=FAILED`; provider failure is
qualified `UNKNOWN`, never an absent File.

### 4. `planWrite`, `prepareWrite`, `submitWrite`

`planWrite` is deterministic and wallet-free. It returns exact typed-data
domain/types/message, digest, calldata ingredients, predicted identifiers,
CAS predecessor, byte commitment, roles and source-read evidence.

`prepareWrite` selects exactly one path:

- `RELAYED_EOA`: one EIP-712 signature over the unchanged plan;
- `DIRECT_EOA`: no typed-data prompt, one transaction request;
- `SESSION`: a locally produced signature bound to one already-observed grant.

It records provider method calls and locally checked witnesses but no Core
authorization receipt. `submitWrite` appends only observed submission and
transaction-receipt evidence. A transaction receipt advances the
stage to `INCLUDED` or `REVERTED`; `effect` remains `UNKNOWN`.

### 5. `readBack(submitted, basis?)`

Drops reliance on transient input buffers while retaining the exact serialized
operation evidence, re-reads state at one committed basis, independently
recomputes every predicted identity/commitment, and compares every planned
effect. State equality is reported separately as `stateEffect=OBSERVED_AT_BASIS`.
Only complete state equality *and* independently recovered historical admission
authority become `READ_BACK_VERIFIED` with `effect=COMMITTED`. Missing receipt,
unavailable transaction authority, contradictory signer/grant evidence,
unavailable basis, partial page, mismatched bytes, or changed CAS state cannot
become canonical success.

## Transport boundary

The browser SDK accepts four explicit injected EIP-1193 providers (each only
needs `request({method, params})`): `readProvider`, `walletProvider`,
`relayProvider`, and `sessionProvider`. The last three may be omitted when a
journey does not use them. Guest reads and planning use only `readProvider` and
never call wallet methods. Relayed preparation asks `walletProvider` for the one
owner typed signature and submits through `relayProvider`; direct preparation
does not sign and direct submission asks `walletProvider` for one transaction;
session preparation asks `sessionProvider` for a typed signature without a
wallet UI and submits through `relayProvider`. Provider instrumentation is part
of result evidence, so browser tests can prove guest-zero / relay-one /
direct-one / session-zero prompt claims rather than infer them.

```ts
createLabSdk({
  readProvider,
  walletProvider?,
  relayProvider?,
  sessionProvider?,
  deployment,
})
```

The deployment descriptor is data, not a singleton:

```ts
interface LabDeployment {
  chainId: bigint
  core: string
  byteStore: string
  rootId: Hex
  runId: Hex
  realmId: Hex
  profile: string
  coreAbi: readonly unknown[]
  byteStoreAbi: readonly unknown[]
  runtimeCodeHashes: { core: Hex; byteStore: Hex }
}
```

Every semantic read verifies both runtime hashes and the Core's `runId`,
`rootId`, `owner`, and `byteStore` facts at the same pinned basis before decoding
the requested value. The hashes are supplied deployment evidence, not discovered
trustlessly by this SDK.

No default network, address, provider, ambient signer, v1 contract, EAS package,
or sibling SDK import is legal.

## Required lab ABI properties

The exact contract ABI remains contract-worker-owned. The SDK needs:

- state-readable realm/profile/runtime facts;
- exact object/revision/directory-entry reads with existence separate from zero;
- bounded directory pages with explicit continuation/high-water/closed state;
- carrier metadata plus bounded full/range bytes;
- pure calldata-independent typed-data domain/message specification;
- relayed, direct and session write entry points using the same semantic plan;
- state-readable grant, nonce/CAS and accepted-effect facts;
- events sufficient for progress receipts, never required for canonical state
  reconstruction.

The rehearsal's strict descriptor subset has one to eight fields: `u64`, bool,
bytes32, length-prefixed ASCII, and exact-schema record reference. Reference tag
5 carries the required target schema ID in the descriptor; its payload carries
only the referenced record ID. Descriptor bytes, payload bytes, and all observed
reference tuples remain separate evidence. Typed payload validation first binds
the returned descriptor to the requested schema ID before parsing any field.

## Solidity consumer recommendation

Use the rehearsal's stateless compile-in `LabRead` library and narrow
`LabReadConsumer`, not a deployed SDK helper. Its bounded `currentFile` and
one-u64 `score` probes accept explicit Core/runtime/run/profile expectations,
use capped-gas `staticcall`, and return FOUND/UNKNOWN/MISMATCH/UNSUPPORTED. It
does not choose a provider, cache, relayer, default Plan, or create new mutable
state. This lab consumer is experiment evidence, not a permanent Solidity SDK
API decision.

## Test contract

Synthetic transport tests cover result preservation, page faults, corrupt byte
attempts, typed-data/domain mutation, missing receipts and tagged export. A
separate real-chain fault test removes direct transaction evidence and mutates a
relayed receipt signer to ensure observed state cannot bypass authority.
Actual Anvil tests must separately prove serialized-ABI interaction, one-signature
relay, direct/session paths where implemented, CAS/replay rejection, immutable
basis reads, state-only reconstruction after input disposal, and bounded onchain
consumer reads. Neither class is full C0/M0 conformance.
