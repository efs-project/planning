# Compact Type-cache integration preflight

2026-09-12 overnight · read-only source analysis at full-C0 `ab13d89e4e6111efc5eea6fc61c3ac56181c9a70`; no integrated code, build, test or gas result.

## Practical finding

There is a plausible way to repair two current implementation limits **without reducing the Type language**: compact caches inside the preparation helper, before its bounded response is emitted, then retain compact bytes in immutable storage. Decode the exact original logical ABI when existing consumers need it. The [[2026-09-11-efs21-overnight|mission]] distinguishes this unresolved support problem from measured filesystem savings.

The existing standalone codec has differential evidence, including a parser-produced64-field cache of24960 logical bytes becoming5536 physical bytes. It is not on the actual admission path. Its synthetic12110-byte representation envelope is not a measured largest legal Type. [Codec-only evidence](https://github.com/efs-project/planning/blob/ab13d89/Reviews/2026-09-11-type-cache-codec-lab/README.md).

A further independent read-only review of the actual codec and corpus found no concrete lossless/framing defect and approved it **as an integration candidate only**. The source hash matches retained evidence`0x68ac331e2d5ed6450e52914c43d61753800056ba6f7582a6ea133c4db9c079ac`. Counts, descriptor totals, exact framing and signed256 values are retained; this is not a security audit or an actual admission result.

Two independent constraints must be addressed:

1. A single raw cache can exceed the24575-byte payload ceiling of one STOP-prefixed code contract.
2. `Preparation.invoke` rejects group responses larger than131072 **before copying/decoding**. Packing later inside Core or just before CREATE cannot fix this earlier refusal. Likewise, raw transport for every individually small cache does not bound their aggregate group response.

The old codec README's11-byte admission-library headroom and journal wording are historical. The direct-apply arm has different source/size; that is not proof a codec integration will fit. Fresh ordinary sizes remain a gate for every changed module.

## A source-derived group bound

Root and an independent source reader checked `TypeGroupParser`: group input is at most8190 bytes; at most16 schemas, each with64 fields,16 roles,8 indexes and32 constraints; at most256 external dependencies. Retained top-level field descriptors are disjoint slices across that bounded group. A nested descriptor is already inside its parent slice, not another additive copy.

For the existing compact format, a deliberately loose aggregate payload bound is:

```text
16*96 headers + 1024*18 field metadata + 8190 descriptor bytes
+ 256*34 roles + 128*2 indexes + 512*66 constraints = 70,910 bytes
```

With the current outer CompiledGroup tuple shape, add at most10960 ABI bytes: outer offset/head, both array headers,16 element offsets/tuple/bytes headers,31 padding bytes per cache and256 dependency words. The total conservative bound is81870, below131072. Maxima need not be jointly attainable. An actual ABI test must verify the framing calculation; this is neither a measured legal maximum nor proof that parsing/packing/admission fits unchanged helper/transaction gas limits.

Source: `Reviews/2026-09-05-c0-admission/src/TypeGroupParser.sol` parseGroup/field/roles/indexes/constraints, and `Reviews/2026-09-11-type-cache-codec-lab/src/CompactCacheCodec.sol`, at the pinned revision.

## Smallest recommended integration shape

- One ordinary external codec contract, pinned by immutable address and runtime hash in a modified preparation helper. Check actual current codec identity before bounded STATICCALLs; a helper hash commits to its immutable fields but does not check the callee's currently installed code. Do not inline the whole codec or give it storage-authorized delegatecall access.
- Explicitly versioned compact compile transport methods parse canonical Types first, pack each logical schema inside the helper, then serialize the bounded group response. Returned physical bytes are named/qualified as physical; do not silently redefine logical `TypeRow.cacheBytes`.
- Bounded helper unpack/header facade methods keep `Preparation.Config(helper,hash)` as the configuration carrier. Propagate that config to the logical Type-row/header readers that need decoding; do not create a mutable global codec registry.
- An explicit physical Type writer stores compact bytes with the unchanged three-slot TypeCell/metadata/TypeId mirrors and ordered installation. Do not unpack then repack every fresh Type merely to reuse a logical row dispatcher. Existing-group comparison must still compare equal logical caches or a separately justified exact equivalent.
- Logical `StateStore.typeRow` reconstructs the original ABI. Record preparation and active Withdrawal keep their existing logical-cache validation path; update Withdrawal's direct cache-byte access too. Preserve exact Type/Record identity and reference/index/effect behavior.
- PointReads' current raw-code ABI-header walker must understand compact framing and retain TypeId, canonical blob hash, body-bound and count checks. The lab's `readHeader` walks field frames and takes the complete physical bytes: it is not constant-time authenticated pointer reading, nor canonical Type validation. Binding reads keep their independent Record hashing.
- Every return boundary checks size before copy, with separate physical-payload, ABI-envelope, logical-output, failure-data and call-gas bounds. A12110-byte payload is not the entire ABI response. Unknown/malformed physical formats fail closed.

An **all-compact** first arm has one transport/storage interpretation to validate. Mixed raw-small/compact-large storage can follow, but all schemas still need bounded compact transport if that is what fixes the aggregate response. Mixed storage requires explicit per-cell format dispatch and its own corruption/threshold tests; do not infer it is cheaper without whole-operation measurements.

### Wrapper falsifiers from the actual codec review

- A maximum12110-byte `pack` payload has a **12192-byte external ABI bytes-return envelope**; `readHeader` returns exactly256 bytes. Bound the actual response, not just its decoded payload.
- The existing synthetic maximum stores all8190 descriptor bytes in one field. Distributing them as63 one-byte descriptors plus one8127-byte descriptor retains12110 physical bytes but reconstructs **35104 logical ABI bytes**, or35168 including the bytes-return envelope. Per-descriptor padding is the difference from the existing33152-byte synthetic case. Add this exact fixture before tightening an unpack cap; it is codec-valid synthetic data, not a legal parser Type claim.
- Direct lab calls use16777216 gas and only small/boundary receipts were measured. Neither maximum-case codec gas nor bounded nested helper calls have been established. Measure these before pinning a smaller internal call budget.
- `abi.decode` precedes count/canonicality checks in `pack`. Hostile offsets, aliasing and lengths may exhaust bounded gas before producing `InvalidCache`. Integration needs bounded refusal/rollback tests, oversized success/revert return data and child OOG; do not require one selector for every malformed ABI.

## Configuration, replay and actual consumers

Bind compact-profile/codec address/hash in authenticated Core configuration, with an explicit domain wrapper preserving the current21-word execution-set shape and Carrier formula. The changed Core configuration changes execution identity. Update Solidity expected-configuration checks, independent readers, helper immutable patch inventories, deployment/runtime/source manifests and capability qualification; old profiles must refuse rather than silently reinterpret new physical caches. Upgrades must preserve the intended helper/codec binding or explicitly refuse a mismatch. Fresh-genesis experiments do not prove old populated raw caches migrate.

Actual source seams include `Preparation.sol`/`PreparationHelper.sol`; StateKernel initialization/group creation, existing-group equality, `checked` and Withdrawal; `StateStore.typeRow`, Type writes and `cacheBytes`; `StatePointReads._cacheCounts`; raw `UpgradeableFixtureCore.typeRow`; `UpgradeStorage`/endpoint configuration and deployment/read manifests. Point-library calls needing new config must preserve the external user-facing read ABI. Search and update every raw physical-cache observer, not only the factory.

## Next evidence gate

Before implementation, recheck the then-reviewed full-C0 base, review the codec and write one bounded integration plan. Retain the original raw-cache control with explicit source-backed selection; no limit raise or grammar reduction. Early compiler/module-size refusal is a real result, not permission to trim checks.

Require the existing64-field24960-byte support falsifier through **actual Type admission**, plus a parser-valid multi-member group targeting the old return ceiling. Preserve exact logical cache bytes, Type/Record IDs, dependent records, Type-member reads, existing-group equality, valid/invalid bodies and reached late rollback including helper nonce/new code.

Measure small/intrinsic/application Type controls, repeated preparation/all-ACTIVE retry, Withdrawal, paid scalar Type reads and actual Files workflows. Compact packing/unpacking can make ordinary operations more expensive even if a large Type now fits. Retarget physical-corruption tests, preserve logical integrity checks, retain failure receipts and report helper/transaction gas refusals honestly. Output-fit alone is not support for every maximum-size legal group.

This preflight establishes a coherent next candidate, not lower gas, full Type support, protocol adoption or implementation completion.
