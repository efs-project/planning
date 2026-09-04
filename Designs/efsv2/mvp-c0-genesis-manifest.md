# EFS 2.0 — MVP-C0 genesis and application-bootstrap manifest

**Status:** draft — ordered disposable-run manifest; not ceremony-final genesis
**Target repos:** planning, contracts, sdk
**Depends on:** [[disposable-mvp-profile]], [[core-architecture-candidate]], [[hierarchical-files-and-folders]], and the [Stage A SR-17 control](../../Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-overview.md)
**Supersedes:** —
**Reviewers:** —
**Last touched:** 2026-09-04

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #topic/efsv2 #topic/content #topic/coherence

> **Use.** This is the mandatory order for one
> [[disposable-mvp-profile|MVP-C0]] run. It consumes SR-17; it does not rewrite
> Stage A or turn any B0 proposal into permanent EFS v2 law.

## Problem

Type admission exists at proposal stage, but a fresh application Realm still
needs one explicit sequence: commit the experiment, activate all indexes that
must claim complete coverage, admit candidate Types, create the bootstrap
Principal and Files roots, and persist enough post-state evidence for another
implementation to prove that it reached the same genesis.

If any application write occurs before that sequence finishes, complete listing
and later reconstruction can never be inferred safely. If the sequence leaves
roles or expected roots implicit, a plausible-looking fixture can start from
state no clean implementation knows how to reproduce.

## 1. Roles and immutable inputs

The run assigns four explicit roles:

| Role | Authority |
|---|---|
| experiment operator | generates the manifest, deploys the local chain/contracts, submits transactions, and archives evidence; it receives no semantic authorship by operating infrastructure |
| schema author | one freshly generated synthetic EOA/account Principal that authors the C0 TypeSchemaGroup Records; it receives no application-root authority |
| bootstrap author | one freshly generated synthetic EOA whose intrinsic account Principal creates the root, Plans, Mount, and Route |
| relayer/payer | submits typed WritePlans and pays gas; it may equal the operator but never the bootstrap Principal by inference |

Bootstrap uses two non-cyclic commitments. Before deployment the operator
canonicalizes and hashes `ExperimentSeedInputsV1`:

```text
ExperimentSeedInputsV1 {
  namespace = "efs2/mvp-c0/2026-09-03"
  runId
  sourceCommitments[]
  toolchainCommitments[]
  chainConfigCommitment
  deploymentFactoryAddress
  coreCreate2Salt
  byteStoreCreate2Salt
  coreCreationCodeTemplateHash
  byteStoreCreationCodeTemplateHash
  codexConstantsHash
  indexCapabilityRoot
  orderedTypeGroupRoot
  schemaAuthorAddress
  bootstrapAuthorAddress
  byteMeasurementReportHash
  maxStateFileBytes
  maxReadRangeBytes
  transactionGasMargin
  stateGrowthMargin
  destructionPolicyHash
}

DOM_EXPERIMENT_SEED = keccak256("efs2/mvp-c0/experiment-seed/1")
seedInputsHash = keccak256(canonical(ExperimentSeedInputsV1))
experimentSeed = keccak256(abi.encode(DOM_EXPERIMENT_SEED, seedInputsHash))
```

`sourceCommitments` include the exact Stage A corpus tip, this profile/manifest
commit, and both independent codec implementations. Toolchain versions and
compiler flags are content-addressed. `runId` is random and nonzero.
`canonical(...)` is the C0 run codec: field order above, unsigned integers at
their declared fixed widths, fixed-width values unpadded beyond that width,
and arrays encoded as a fixed-width count followed by length-delimited elements
in manifest order. No machine path or secret enters it.

After `experimentSeed` is fixed, concrete init code and CREATE2 addresses are
computed in this acyclic order:

```text
coreInitCode = coreCreationCodeTemplate ||
  abi.encode(experimentSeed, codexConstantsBytes)
coreInitCodeHash = keccak256(coreInitCode)
coreAddress = create2Address(
  deploymentFactoryAddress, coreCreate2Salt, coreInitCodeHash)

byteStoreInitCode = byteStoreCreationCodeTemplate || abi.encode(
  experimentSeed, coreAddress, maxStateFileBytes, maxReadRangeBytes)
byteStoreInitCodeHash = keccak256(byteStoreInitCode)
byteStoreAddress = create2Address(
  deploymentFactoryAddress, byteStoreCreate2Salt, byteStoreInitCodeHash)
```

Core construction does not take `byteStoreAddress`, so this order has no
cross-address cycle. Neither constructor takes `experimentCommitment`.
`codexConstantsBytes` contains the fixed C0 grammar/domain/capability material
whose hash is in the seed; it contains no derived contract address,
`experimentCommitment`, or `c0ProfileId`. After both contracts exist and their
code is read back, the operator canonicalizes:

```text
ExperimentDeploymentV1 {
  experimentSeed
  coreAddress
  coreCreate2Salt
  coreInitCodeHash
  coreRuntimeCodeHash
  byteStoreAddress
  byteStoreCreate2Salt
  byteStoreInitCodeHash
  byteStoreRuntimeCodeHash
}

DOM_EXPERIMENT_DEPLOYMENT =
  keccak256("efs2/mvp-c0/experiment-deployment/1")
deploymentHash = keccak256(canonical(ExperimentDeploymentV1))
experimentCommitment = keccak256(abi.encode(
  DOM_EXPERIMENT_DEPLOYMENT, experimentSeed, deploymentHash))

DOM_C0_PROFILE = keccak256("efs2/mvp-c0/profile/1")
c0ProfileId = keccak256(abi.encode(
  DOM_C0_PROFILE, experimentCommitment))
```

The seed commits source, toolchain, chain, semantics, measured bounds, code
templates, and salts without depending on derived init code. The final
`experimentCommitment` transitively commits all seed inputs and directly
commits the actual addresses and init/runtime code hashes. `c0ProfileId` is the
WritePlan profile reference. It is distinct from the Stage A-derived
`coreProfileId` returned by `genesisFacts()` after initialization.

The byte bounds are not hand-picked defaults. The pre-genesis measurement
sweeps candidate exact-byte sizes and chooses the largest candidate satisfying
all declared write-gas, state-growth, cold-read, proof, and client-memory
margins. The selected values are immutable for this run and have no protocol
meaning. A run without the report hash and selected finite nonzero bounds is
invalid.

The schema/bootstrap author keys, deployer key, relayer key, RPC credentials,
and any funding material are secret local inputs and never enter the committed
manifest. Only public addresses and role labels do.

## 2. Ordered bootstrap

Every step emits a machine-readable run transcript. A failed assertion aborts
the run; the operator does not patch state manually and continue.

### G0 — Freeze the run

1. Recompute `experimentSeed` independently in two implementations.
2. Require exact equality of the seed-input bytes and digest.
3. Require a clean local EVM chain with its chain ID/genesis hash committed by
   `chainConfigCommitment` and no prior C0 deployment.
4. Construct the two init-code values in the order above and independently
   recompute their hashes and intended CREATE2 addresses. The Core address is
   fixed before it enters byte-store init code.

No deployment occurs until G0 passes.

### G1 — Deploy and verify the state-readable byte carrier

1. Deploy `MvpC0StateByteStore` with `experimentSeed`, the precomputed
   `coreAddress`, `maxStateFileBytes`, and `maxReadRangeBytes` immutable. It
   begins `UNSEALED` and rejects every byte write.
2. Read its exact runtime code, code hash, seed, expected Core, public
   parameters, empty coverage, and empty byte count from state.
3. Recompute the expected carrier address/init/runtime code hashes and compare.

The byte store is a carrier only. It does not mint File, FileRevision,
ChunkTree, Record, or Locator identity.

### G2 — Deploy and initialize Core

1. Deploy one atomic C0 Core whose constructor commits `experimentSeed` and the
   namespaced B0 Codex, WritePlan, and index capability bytes. It begins
   `UNINITIALIZED` and rejects publication.
2. Read both contracts' actual addresses and runtime code from state; recompute
   init-code hashes from the frozen creation-code templates and constructor
   bytes. Build `ExperimentDeploymentV1`; require two implementations to
   produce the same `experimentCommitment` and `c0ProfileId`.
3. Call the C0 wrapper `initializeC0(initConfigBytes,
   experimentDeploymentBytes)` once. It recomputes the final commitment and
   C0 profile, checks its stored seed/address/code hashes, decodes the exact
   Stage A `InitConfig/1` tuple unchanged, and requires the existing
   `initialPolicyCommitment` field to equal
   `keccak256(abi.encode(keccak256("efs2/mvp-c0/initial-policy/1"),
   keccak256(nullPolicyBytes), experimentCommitment))` before storing that
   tuple. No field is appended or rewritten.
4. In that same transaction, Core calls the byte store's one-time
   `sealFromCore(experimentDeploymentBytes)`. The store recomputes the same
   commitment, requires `msg.sender == coreAddress`, persists
   `experimentCommitment`, and changes `UNSEALED -> SEALED_EMPTY`. Either both
   initialization and seal commit or both revert.
5. Read `c0GenesisFacts()`, `genesisFacts()`, and `codexConstants()`; require
   the exact seed, final commitment, C0 profile, byte-store address/code hash,
   `codexConstantsHash`, `coreProfileId`, `initConfigHash`,
   `genesisCommitment`, and `RealmId` to recompute independently.
6. Require chain reference, addresses, code hashes, all configuration fields,
   and recomputed IDs to match. Unknown, duplicate, reordered, or trailing
   Codex or deployment material aborts.

No application Record or Binding is admitted during G2.

### G3 — Activate and prove index capabilities before writes

Core exposes a state-readable ordered capability manifest. Before any
application write, require it to contain exactly the C0 bundle:

1. exact Type, Record, Envelope/Occurrence, and admission-receipt point reads;
2. global admission-order pages;
3. unique Records by Type;
4. Occurrences by Type, Record, and Principal;
5. declared scalar equality, typed references, and typed backlinks needed by
   the admitted Types;
6. current Binding point reads and history;
7. digest lookup used by the C0 byte/Files Types; and
8. `KIND_BINDING_SCOPE`, with its C0 value-key domain and complete genesis
   coverage.

Recompute `indexCapabilityRoot` from the returned ordered entries and compare
it with `ExperimentSeedInputsV1` and the Core/Codex commitment. Any missing,
additional, mutable, or post-genesis capability aborts. In particular,
`BindingScope` cannot be enabled after the first Binding while retaining a
complete-listing claim.

### G4 — Admit Types through SR-17

`TypeSchemaGroup/1` is the intrinsic bootstrap meta-Type recognized by Core.
All other C0 Types enter as Records of that meta-Type through the C0
`publishWithPlanC0` variation of ordinary admission. C0 structurally reuses
SR-17's TypeSchemaGroup body, derived TypeSchemaIds, one Record/Occurrence
spine, group validation, and atomic materialization of every deterministic
parsed-schema cache entry in the same admission. It varies only the publication
witness: the composite Realm-bound WritePlan signature is verified under
`C0_COMPOSITE_EOA_V1`, not mislabelled as Stage A's direct chain-free envelope
signature. There is no standalone registration entrypoint and no
admit-then-materialize interval.

The schema author signs one `ADMIT_TYPE_GROUP` WritePlan per group. For these
pre-Route plans, `routeConfigId` is exactly zero and all other C0 WritePlan
checks still apply. Its intrinsic account Principal is mechanically derived
and separately reported; it is not the bootstrap application Principal and
gains no root, namespace, Mount, or Route authority.

Admit groups in this exact dependency order:

| Group | Types |
|---:|---|
| 1 — generic identity/read | `ObjectGenesis/1`, `ResolutionPlan/1`, `ByteDigest/1`, `ChunkTree/1`, `Locator/1`, `RepresentationBinding/1` |
| 2 — generic effects | `BindingSet/1`, `BindingTombstone/1`, `Withdrawal/1` |
| 3 — Files | `DirectoryEntry/1`, `DirectoryWhiteout/1`, `FileRevision/1`, `PublicFilesMountConfig/1`, `MountDescriptor/1`, `FilesRouteConfig/1` |
| 4 — experiment seal | `MvpC0BootstrapSeal/1` |

Within each group, freeze member order exactly as listed left-to-right in the
table above. Assign zero-based member indexes before encoding Type blobs;
encode local references using SR-17's `SELF`/`GROUP_REF(k)` rules and those
assigned indexes, not the eventual derived Type IDs. Then
encode the ordered `groupBytes`, derive `groupHash`, and derive each
`TypeSchemaId` using SR-17's member-index formula. Type IDs are outputs of
this process, never sort keys: sorting by them would change the group hash
and the IDs used to sort. Missing, duplicate, substituted or reordered members
reject against the manifest's committed ordered group inventory; no fixed-point
search or post-hash reordering is permitted. After each admission:

- recompute the group Record/Envelope/Occurrence IDs and admission receipt;
- recompute the exact unsigned Stage A publication digest, derive EnvelopeId
  and OccurrenceRefs, then separately verify the retained composite WritePlan
  witness and `C0_COMPOSITE_EOA_V1` authority basis;
- point-read every Type and cache entry;
- verify its bundled index declarations against `indexCapabilityRoot`;
- require automatic Type/Record/Occurrence/Principal/admission indexing; and
- require two implementations to produce the same ordered Type IDs.

An app Type not present in the ordered group root is unsupported for that run.
A later Type or index change creates a new run; it is never appended to a
sealed C0 Realm.

### G5 — Establish the bootstrap account Principal

1. Canonically encode the bootstrap EOA's intrinsic account-Principal
   descriptor and derive `bootstrapPrincipalId` independently.
2. Require no registration transaction or hidden mapping to create the ID.
3. On the first accepted WritePlan, require Core to persist the exact Principal
   descriptor, WritePlan bytes, low-s EOA witness, and authority basis needed
   for state-only verification.
4. Require the relayer/payer and transaction sender to remain separately
   reported.

Failure to re-recover the EOA from retained state aborts the bootstrap.

### G6 — Create the root Directory

The bootstrap author signs one C0 WritePlan that atomically admits:

1. an `ObjectGenesis/1` with `FILES_DIRECTORY_1` meaning and a fresh synthetic
   salt; and
2. the publisher-charter `BindingSet/1` for that Object.

Canonical read-back must prove the Object/Record IDs, authored Occurrences,
admission/effect receipts, charter Binding head/revision, Principal, and
`FOUND` result at one committed basis. Record `rootDirectoryObjectId`.

### G7 — Create the Plans

In one `ADMIT_RESOLUTION_PLANS` WritePlan, admit exactly two immutable
`ResolutionPlan/1` Records:

1. `namespacePlanId`, containing only `bootstrapPrincipalId` and the exact
   Files namespace purpose/scope for the root; and
2. `contentPlanId`, containing only `bootstrapPrincipalId` and the exact Files
   content purpose/scope for the root.

Both use the bounded C0 point combiner. Point-read, validate, and recompute
both IDs before continuing. No ambient default Plan is legal.

The post-genesis delegated-session control in
[[disposable-mvp-profile#4.3 Same-Principal delegated-session path]] acts for
this same `bootstrapPrincipalId`. It neither adds a smart-account/session-key
Principal to either Plan nor replaces their immutable IDs or contents. A
session revision targets the EOA-authored File and its existing head Binding
author/key; the grant changes only the permitted actual signer and retained
authority basis.

### G8 — Create the public Mount configuration

In one `ADMIT_MOUNT_CONFIG` WritePlan, admit one `PublicFilesMountConfig/1`
Record naming `namespacePlanId` and `contentPlanId`, with no metadata/property
Plan. Recompute and point-read `mountConfigId`; verify every purpose/scope and
the root association.

### G9 — Create the Mount

In one `ADMIT_MOUNT` WritePlan, admit one `MountDescriptor/1` Record with:

- `rootNode = rootDirectoryObjectId`;
- the exact C0 public Files profile ID; and
- `configRef = mountConfigId`.

Recompute and point-read `rootMountId`. An unknown profile, wrong root, or
wrong config Type aborts.

### G10 — Create the Route configuration

In one `ADMIT_ROUTE_CONFIG` WritePlan, admit one `FilesRouteConfig/1` Record
naming this Realm, `rootMountId`, the C0 Files profile, one explicit
basis/completeness policy, and no ambient endpoint. This is the last operation
whose WritePlan has `routeConfigId=0`; the newly derived nonzero
`routeConfigId` is mandatory from G11 onward.

The route's `writeRouter` and `writeRouterCodeHash` remain zero because C0 does
not claim the future FilesRouter's view-level certification. The external C0
manifest binds the experimental direct-Core `WritePlan` profile and byte-store
address/code hash. A client must display
`EXPERIMENTAL_DIRECT_CORE` and `filesPreconditionCertified=false`; zero Router
fields must never be presented as a certified writable Route.

Recompute and point-read `routeConfigId` before continuing.

### G11 — Seal the bootstrap

The bootstrap author admits one `MvpC0BootstrapSeal/1` Record in the sole
`ADMIT_BOOTSTRAP_SEAL` WritePlan, using the nonzero `routeConfigId`, containing:

```text
experimentCommitment
realmId
coreCodeHash
byteStoreAddress
byteStoreCodeHash
codexConstantsHash
indexCapabilityRoot
orderedTypeGroupRoot
bootstrapPrincipalId
rootDirectoryObjectId
namespacePlanId
contentPlanId
mountConfigId
rootMountId
routeConfigId
preSealAdmissionHigh
```

The seal is evidence, not an upgrade/admin power. Core performs only the
ordinary Type-structural validation of the Record. Separately, the C0
bootstrap state machine treats successful completion of this one operation as
`BOOTSTRAP_OPEN -> RECEIPT_PENDING`: it closes every publication/runtime-write
entrypoint before returning, while leaving read/proof endpoints available. The
byte store checks this Core state and rejects writes while receipt-pending. The
operator submits the seal only after all referenced exact point reads succeed
and `preSealAdmissionHigh` equals the complete admission high immediately
before the seal operation. Any attempt to write between the seal and activation
must revert and invalidates the run if it does not.

### G12 — Persist and verify post-state roots

Use the successful G11 transaction receipt's exact `blockNumber`, `blockHash`,
and `transactionIndex`. Read and persist `MvpC0GenesisReceiptV1` against that
exact block—not the next block and not a later `latest` snapshot:

```text
experimentCommitment
realmId
genesisCommitment
sealTransactionHash
sealTransactionIndex
blockNumber
blockHash
stateRoot
realmRevisionId
admissionHigh
typeCount
recordCount
envelopeCount
occurrenceCount
principalCount
bindingHeadRoot
bindingScopeRoot
indexStateRoot
byteStoreStateRoot
bootstrapSealRecordId
routeConfigId
canonicalReadBackRoot

DOM_C0_GENESIS_RECEIPT =
  keccak256("efs2/mvp-c0/genesis-receipt/1")
genesisReceiptBodyHash = keccak256(canonical(
  MvpC0GenesisReceiptV1 fields above, in order))
genesisReceiptHash = keccak256(abi.encode(
  DOM_C0_GENESIS_RECEIPT, genesisReceiptBodyHash))
```

Each named logical root is the hash of an ordered, length-delimited set of
state-readable point/page results at the seal receipt's exact `blockHash`; its
codec and ordering are part of the C0 run inputs. Because G11 entered
`RECEIPT_PENDING` before returning, the seal transaction's immediate Core and
byte-store post-state equals their end-of-block state even if unrelated
transactions follow it in the block. `canonicalReadBackRoot` commits to the
seal transaction hash/index, all other returned roots, and exact IDs. The
receipt also carries account/storage proofs tying Core and byte-store state to
that block's `stateRoot`.

Both implementations must:

1. verify the block header and proofs;
2. reconstruct the Realm/Codex/Type/Record/Occurrence/admission/Binding/index
   state without logs or historical calldata;
3. independently verify every retained bootstrap EOA witness;
4. enumerate the root Directory to a complete empty result through
   genesis-active `BindingScope`;
5. resolve the root, Plans, Mount, and Route to the expected `FOUND` results;
   and
6. require Core state to be `RECEIPT_PENDING`, prove that no Core or byte-store
   runtime mutation followed the seal, and produce byte-identical
   `MvpC0GenesisReceiptV1` and `canonicalReadBackRoot`; and
7. only after both readers agree, hash the exact receipt and let the bootstrap
   author call the one-use `activateRuntime(experimentCommitment,
   genesisReceiptHash)` transition. Core persists that hash and changes
   `RECEIPT_PENDING -> RUNTIME_ACTIVE`; a separate activation receipt records
   this later state change.

An empty root listing is `ABSENT_PROVEN` per name domain only after the complete
scope pages close at this basis; an empty page alone proves nothing.

G12's genesis receipt always describes the G11 seal post-state. The activation
transaction is not folded back into it. Runtime writes remain contract-gated
until activation succeeds, and the first post-genesis operation below must
name the persisted `genesisReceiptHash`.

## 3. First post-genesis write

After G12 activation, the genesis is usable only after one synthetic
create-file operation proves the whole profile:

1. plan exact bytes and store them through `MvpC0StateByteStore`;
2. create File Object/charter, ChunkTree, FileRevision, DirectoryEntry,
   file-head Binding, and name-slot Binding in one normal EOA WritePlan that
   places the persisted `genesisReceiptHash` in `C0RealmEffects/1`;
3. submit through a distinct relayer;
4. preserve authorship/publication, authorization, submission,
   admission/effect, and byte-store receipts separately;
5. canonically read back the new path, FileRevision, ChunkTree, verified bytes,
   indexes, and scope-complete directory listing; and
6. extend the run receipt with the new committed block/state/read-back root.

The operation has failed unless canonical read-back matches. Wallet approval,
signature generation, submission, or a successful transaction receipt alone
does not finish it.

## 4. Abort and retirement

Any failed phase or divergent root invalidates the run. Do not repair a sealed
Realm in place. Mark its `runId` and RealmId retired, revoke session grants,
stop submitters, preserve non-secret evidence, destroy local secrets and local
state that can actually be erased, and create a new run after the cause is
understood.

Public-chain state cannot be destroyed. Therefore this manifest authorizes
only a local synthetic run; a later testnet run requires a separate decision
and must disclose permanent residue before deployment.

## Open questions

- [ ] **Evidence gate:** execute the pre-genesis byte-size measurement and seal
  the chosen finite run-local bounds.
- [ ] **Evidence gate:** mint exact C0 Type blobs, capability/root codecs, and
  golden vectors in two independent implementations.
- [ ] **Evidence gate:** execute G0–G12 and the first post-genesis write without
  a divergent digest, hidden input, unretained EOA witness, or false absence.

These are implementation gates, not owner questions. The permanent Type/query
axis, carrier policy, Principal model, venue, and product scope remain open.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [x] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain — all dependencies accepted or landed
- [x] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment

## Implementation notes

The implementation harness writes the filled run manifest and
`MvpC0GenesisReceiptV1` beside its vectors and measurements. Those artifacts
must contain relative source references or commit IDs, never machine-local
absolute paths or secrets.
