# MVP-C0 executable foundation — run-local choices

**Status:** experimental engineering specification, not permanent EFS bytes
**Authorization:** James approved the next encodings/local-contract/recovery steps, 2026-09-04.
**Source:** `c561edafb5ee48ab5a7414101b24b0410f0b0828`, especially
[[../../Designs/efsv2/disposable-mvp-profile]] and
[[../../Designs/efsv2/mvp-c0-genesis-manifest]].

This package implements the first independently testable foundation. It is
not a full C0 Realm, SR-17 interpreter, Files admission engine or G0–G12 run.
Its synthetic sample commitments cannot be used as a valid genesis. The
existing design remains authoritative where this specification is narrower.

## Build boundary

Solidity 0.8.30, Cancun EVM, optimizer enabled with 200 runs and via-IR;
Foundry 1.7.1 (4072e48705af9d93e3c0f6e29e93b5e9a40caed8); Node 26.0.0;
ethers 6.15.0 exactly, private package and npm lockfile. These are laboratory
reproduction choices, not EFS support floors. No dependency on sibling v1
contracts or SDK. The compiler path is supplied by `EFS_C0_SOLC` locally;
no absolute machine path or key appears in committed artifacts. Library/tool
versions and settings are recorded, not silently treated as protocol defaults.

## Packed manifest codec

Use unsigned big-endian fixed-width integers, exactly 20-byte addresses and
32-byte hashes/IDs/salts. Strings are `u16 byteLength || ASCII bytes`.
No padding beyond the declared width; no trailing input; unknown namespaces,
short input, overflow, negative or imprecise numeric input reject.

`ExperimentSeedInputsV1` preserves the manifest's existing field order:

| Field | Encoding |
|---|---|
| namespace | string, exactly `efs2/mvp-c0/2026-09-03` |
| runId | bytes32, nonzero |
| sourceCommitments, toolchainCommitments | each an array below |
| chainConfigCommitment | bytes32 |
| deploymentFactoryAddress | address |
| coreCreate2Salt, byteStoreCreate2Salt | bytes32 each |
| coreCreationCodeTemplateHash, byteStoreCreationCodeTemplateHash | bytes32 each |
| codexConstantsHash, indexCapabilityRoot, orderedTypeGroupRoot | bytes32 each |
| schemaAuthorAddress, bootstrapAuthorAddress | address each |
| byteMeasurementReportHash | bytes32 |
| maxStateFileBytes, maxReadRangeBytes | u64, nonzero, range cap <= file cap |
| transactionGasMargin, stateGrowthMargin | u64; gas units and bytes respectively |
| destructionPolicyHash | bytes32 |

Each commitment array is `u16 count || concat(u32 elementLength || element)`;
count is 1..64. Each element is `string label || bytes32 digest`. Labels are
1..64 ASCII bytes from `[A-Za-z0-9._/-]`, strictly increasing by unsigned byte
lexicographic order with no duplicates. Digests are nonzero. This defines
the declared order of these two manifests. All commitment/hash fields and
addresses above are nonzero, except CREATE2 salts may be zero. Schema and
bootstrap author addresses differ. Any changed source/toolchain entry changes
the encoded seed. Arrays cannot be truncated, reordered or silently deduped.

`seedInputsHash=keccak256(seedBytes)`; `experimentSeed` uses the original
`DOM_EXPERIMENT_SEED` formula. The deployment codec is exactly **264 bytes**:

```text
experimentSeed:bytes32
coreAddress:address
coreCreate2Salt:bytes32
coreInitCodeHash:bytes32
coreRuntimeCodeHash:bytes32
byteStoreAddress:address
byteStoreCreate2Salt:bytes32
byteStoreInitCodeHash:bytes32
byteStoreRuntimeCodeHash:bytes32
```

The two addresses differ and are nonzero; seed and code hashes are nonzero.
Salts may be zero. Deployment/final-profile hash formulas are unchanged from
the source. Canonical decoding must round-trip exactly; no ABI padding is
introduced into these packed bytes. ABI encoding is used only where the
source hash formula explicitly says `abi.encode`.

## Byte carrier component

The carrier constructor remains `(bytes32 experimentSeed, address expectedCore,
uint64 maxStateFileBytes, uint64 maxReadRangeBytes)`. All are nonzero; the
range cap does not exceed the file cap. It starts unsealed and stores no bytes.

The test host is explicitly **not EFS Core**. Its narrow interface is:

```solidity
function c0CarrierContext() external view returns (
    bytes32 experimentSeed, bytes32 experimentCommitment,
    bytes32 chunkTreeTypeId, uint8 phase);
// phase: 0 UNINITIALIZED, 1 BOOTSTRAP_OPEN, 2 RECEIPT_PENDING, 3 RUNTIME_ACTIVE
```

Only `expectedCore` may call `sealFromCore(bytes deploymentBytes)`, once. Decode
exactly, verify seed and both addresses against immutable values, check both
actual runtime code hashes, and recompute the final experiment commitment.
Core context must report matching seed/commitment, nonzero frozen ChunkTree
Type and phase BOOTSTRAP_OPEN. Persist exact deployment bytes and pinned Type.
The test host simulates enclosing initialization so rollback can be tested.
The component cannot prove CREATE2 init-code provenance on its own: the full
G0/G2 operator/readers must verify that. Never label runtime-hash checks as
complete deployment attestation.

Only `expectedCore` may `putFromCore(bytes32 treeRecordId, bytes treeBody,
bytes data)`, and only while both sealed and Core context is RUNTIME_ACTIVE
with unchanged seed/commitment/Type. No other phase permits writes. Core's
actual future transaction must enclose admission and carrier mutation atomically.
No minting File, Locator or semantic identity; the carrier validates the
supplied ChunkTree RecordId against its pinned Type and exact canonical body.

`treeBody` is the MC/1 static tuple `(uint32 chunkSize,uint32 chunkCount,
uint64 totalSize,bytes32 merkleRoot)`, encoded as packed big-endian fields.
The body is exactly 48 bytes; ABI-padded 128-byte bodies are invalid.
Use the Stage A RecordId formula, not a carrier-local identity formula.
The run's byte-writing `C0RealmEffects.byteCommitment` is that exact
ChunkTree RecordId. This is an explicit C0 engineering choice, not a new
permanent field interpretation.

Use the existing ChunkTree rules: leaf `keccak256(0x00 || chunk)`;
node `keccak256(0x01 || left || right)`; promote an unpaired node unchanged.
No sorted pairs or duplicate-last padding. Nonempty chunk size is aligned to
4096 and in [4096,8388608], with exact ceiling count (at most 16777216) and matching totalSize.
The sole empty form is `(262144,0,0,keccak256(0x02))`, from Files' correction.

Store complete bounded files atomically. Identical repeated puts are
idempotent and do not inflate counts; conflicting bytes/body for a key reject.
Expose explicit existence separately from zero-length bytes, exact retained
tree body, an append-only bounded inventory, unique entry count and total
stored bytes. `read` enforces the file cap. `readRange(id,offset,length)`
uses checked bounds: zero length succeeds only for offset<=totalSize, including
the sole empty range at offset zero; any range beyond EOF rejects. Range
length cannot exceed its cap. A missing ID never returns an invented empty file.

The independent reader fetches the complete bounded file and body from state,
recomputes the full tree and RecordId without calling Solidity's hash helpers,
then slices a requested range. Raw `readRange` bytes alone are not a Merkle
proof. RPC observations in this component test are not Ethereum state proofs.

## Measurement and limits of this increment

Measure candidate sizes and full/range reads with the real carrier; retain
toolchain, code hashes, write gas, read gas, unique stored bytes and observed
response sizes. Test caps are laboratory inputs, never a selected valid C0
limit. Full cold-read/proof/client-memory budgets and actual Core overhead
still precede any valid G0 cap selection. No complete measurement report or
valid genesis is claimed from a carrier-only sample.

Still required after this increment: complete capability/Codex and 16 exact
Type blobs, group/reference structural admission, grant budgets/authority,
G0–G12 proofs and roots, BindingScope, Files mutations, real signatures and
all nine browser/Core journeys. Preserve them as NOT_RUN rather than
substituting the test host or synthetic input hashes for those components.
