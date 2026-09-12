# A cheaper known-Record read for contracts?

September 12, 2026 · independent source preflight and root verification · **not implemented or priced**.

Subsequent implementation-plan review is captured in [[2026-09-12-efs21-known-record-consumer-plan]]. It adds explicit returned-Type equality, exact ABI framing and the distinction between invalid metadata and internally consistent fabricated metadata. Raw and qualified checks are not strictly ordered; compare total acquisition cost, not isolated qualification overhead. That refined plan governs any dispatch.

The user wants contracts to use EFS as practical shared storage. The fuller prototype's qualified point read repeatedly verifies execution/dependency context. An ordinary contract reading a known content commitment from an already trusted deployment may need a different, explicitly narrower read surface than a browser accepting answers from an untrusted RPC.

## Smallest useful experiment: no Core change

The existing actual Core already exposes `record(id)`, `counts()`, `recordIdAt(ordinal)`, `typeIdAt(ordinal)` and qualified `getRecord(id)`. A separate paid consumer can compare them against the same admitted data and application effect. Source basis: full-C0 `1cb402a`; re-pin after any intervening storage changes.

Both consumer arms pin chain/Core address, expected RecordId/TypeId and known Record/Type inventory ordinals. Both check the same exact content commitment:

```solidity
keccak256(abi.encode(
    keccak256("efs2/record/1"), expectedType, keccak256(body)
)) == expectedRecordId
```

Both require body length at most 8,192; nonzero, non-exhausted expected ordinals within committed counts; exact inventory IDs; and nonzero first-admission ordinal within committed admission high-water. The raw arm additionally checks its returned Record ordinal equals the pinned one. The qualified arm retains `getRecord`'s initialization, actual Type-row ordinal and execution/dependency checks. It is not charged an additional raw body fetch merely to manufacture an identical call sequence.

Bound STATICCALL output before copying: raw Record tuple at most 8,384 bytes, qualified tuple 8,320, counts exactly 256. Strictly decode/canonicalize the expected ABI; use an explicit per-call gas budget and the same consumer state effect in both arms. A known Type's meaning/validation is a trusted prior input, not reconstructed from inventory membership on every read. Avoid `typeRow` in this narrow comparison because it copies the complete compiled cache.

Measure tiny and legal large bodies, cold standalone transactions and separately labelled warm repeated reads, every deployment/setup/failed receipt and exact calldata/returndata. Use the existing authorized publication path; forwarding an author-signed intent through a producer contract is **not autonomous contract authorship** in U3. Native contract authorship remains the separately qualified native-profile experiment.

## The guarantees must not get mixed

- Matching the trusted RecordId proves the returned Type/body bytes match that content commitment. It does not alone prove that Core ever admitted them or that their values passed a validator.
- Under the source-pinned trusted state machine, ordinal/count/inventory checks establish committed Record membership. A malicious implementation can return correct committed bytes and fabricate these metadata fields.
- Neither arm in this narrow experiment establishes authorship, a live Occurrence, non-withdrawal, current file/path/Binding selection, a Lens result or availability of an entire chunk tree. Immutable Records remain useful after an occurrence is withdrawn.
- Internal EVM calls execute against chain state, unlike fabricated RPC `eth_call` output. Consensus execution does not make a malicious contract's claims truthful. The qualified reader also relies on the installed reader code and its dependency/authority model; self-attestation is not an external proof of a proxy implementation slot.

### The current test factory is not an immutable-source guarantee

Root checked the actual `FixtureDeployment`: `upgradeCoreOnlyForTest` and `upgradeCarrierOnlyForTest` are deliberately adversarial owner-only methods that bypass revision-history updates. Consequently, neither `currentRevision`, a retained `revisionAt` entry, proxy runtime hash, nor Core's `implementationSelf()` response independently proves the currently installed implementation.

For the benchmark, freeze and independently inspect the actual proxy/admin/factory/implementation/dependency graph and manifest; keep upgrades frozen during measurement. Treat that as an explicit controlled-deployment assumption, not an onchain proof supplied by the consumer. A future immutable deployment or a differently constrained upgrade controller needs its own trust analysis; do not silently remove the adversarial fixture methods as part of a read-cost experiment.

## Prefix safety and decisive failures

Core installs new Record rows before publishing final counts. Their future Record/admission ordinals allow the proposed count checks to refuse a provisional new row. Already committed immutable content can remain usable during a new Occurrence's in-flight admission. This does **not** license the same shortcut for mutable Binding/posting rows, which can already reflect the provisional prefix.

Required falsifiers before a paid result:

1. Missing/wrong Record, Type/body/hash mismatch, malformed or oversized return and exhausted/future ordinals.
2. Wrong Record/Type inventory mirrors and fabricated first-admission metadata.
3. Callback observes provisional new Record versus previously committed dedup content.
4. Deliberate one-sided factory upgrade leaves history unchanged, demonstrating why historical pins are insufficient.
5. Malicious implementation returns the expected bytes with invented membership metadata: distinguish content integrity from the failed admission claim.

This is a promising way to price contract access without changing Core. Any measured saving is for **trusted-deployment known-content consumption with the stated checks**, not proof that RPC qualification, path resolution, Types or Lenses are unnecessary.

## Source map

- [Existing raw Core APIs](https://github.com/efs-project/planning/blob/1cb402a/Reviews/2026-09-08-upgradeable-foundation/src/UpgradeableFixtureCore.sol#L66).
- [Qualified execution/dependency read wrapper](https://github.com/efs-project/planning/blob/1cb402a/Reviews/2026-09-08-upgradeable-foundation/src/UpgradeableReadFixtureCore.sol#L49).
- [Actual Record checks and returned first-admission ordinal](https://github.com/efs-project/planning/blob/1cb402a/Reviews/2026-09-05-c0-core/src/StatePointReads.sol#L265).
- [Ordered Record installation and final count publication](https://github.com/efs-project/planning/blob/1cb402a/Reviews/2026-09-05-c0-core/src/StateKernel.sol#L230).
- [Test-only out-of-band upgrade methods](https://github.com/efs-project/planning/blob/1cb402a/Reviews/2026-09-08-upgradeable-foundation/test/FixtureDeployment.sol#L126).

No source was changed and no new gas result, safe production API, immutable-source proof or protocol choice follows from this preflight. Current work: [[2026-09-11-efs21-overnight]].
