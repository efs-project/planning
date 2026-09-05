# C0-shaped Type admission implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development. This is an authorized disposable engineering slice, not a protocol implementation or full C0 ceremony.

**Goal:** Admit the sixteen source-pinned candidate Types as ordinary authenticated TypeSchemaGroup Records, atomically materialize parsed caches, and independently reconstruct them from local-chain state.

**Architecture:** A finite run-local Solidity admission probe uses the actual candidate MC/1 bytes and C0 composite EOA WritePlan shape. An internal parser validates the documented ASCII/DIRECT subset before deriving caches; an independent JavaScript reader checks retained publication, witness, admission and cache evidence. Missing general Core features stay explicit rather than being replaced by a schema-registry shortcut.

**Tech Stack:** Solidity 0.8.30, Cancun, optimizer 200, via IR; Foundry 1.7.1; Node 26 and the existing rehearsal's ethers 6.15.0. No new dependency.

**Spec:** [source-pinned Type inputs](../2026-09-05-mvp-build-start/type-inputs/README.md), [C0 publication law](../../Designs/efsv2/disposable-mvp-profile.md), [G4](../../Designs/efsv2/mvp-c0-genesis-manifest.md), and the linked Stage A chapters. Source base: `499bfca98e47ad2aa16244045c844a66710a62e4`; original Type-source pins remain unchanged.

## Global constraints

- Work only in this new experiment and narrow coordination notes on `codex/mvp-c0-coherence`; preserve prior demo sources and artifacts.
- No real wallets, public RPC/deployment, durable data, new product repo, main merge or protocol freeze. Synthetic local Anvil only.
- Group bytes at most 8190; outer body at most 8192; at most 16 members. All four candidates must remain byte-identical.
- Admission is one group/one Record/one leaf per call in this slice. All sixteen exact candidates are pinned; repeated Records in new Envelopes remain distinct admissions with idempotent caches.
- A temporary intrinsic meta-Type descriptor is derived from exact MC/1 bytes; its semantic metadata, local capability inventory and run commitment are explicitly experimental. This is not a complete Codex or G0–G12 initialization.
- Separate actual checks from deferred general Unicode, arbitrary Record-body validation, full extraction compiler, general Core indexes, Binding/Lens and session authorization.
- Measure deployment bytes and transaction gas with a 16,777,216 transaction ceiling. Report ordinary cache/admission state retention cost, not an optimized Core estimate.
- Use test-first implementation. Root stages exact paths and commits/pushes only after independent review. Implementers do not commit or spawn agents.

### Task 1: Bounded onchain descriptor parser and cache derivation

**Files:** Create `src/TypeGroupParser.sol`, `test/TypeGroupParser.t.sol`, and parser test fixtures under `test/fixtures/` in this directory. Root owns configuration and admission files.

**Interfaces:** Produce internal library `TypeGroupParser` with:

```solidity
struct FieldCache { uint8 kind; uint8 innerKind; uint16 widthOrMax; uint32 maxBodyBytes; uint32 references; uint32 skipReads; bytes descriptor; }
struct RoleCache { uint8 targetClass; bytes32 expectedType; uint8 fieldIdx; }
struct IndexCache { uint8 kind; uint8 target; }
struct ConstraintCache { uint8 kind; uint8 fieldIdx; int256 min; int256 max; }
struct SchemaCache { bytes32 typeId; bytes32 blobHash; uint32 maxBodyBytes; FieldCache[] fields; RoleCache[] roles; IndexCache[] indexes; ConstraintCache[] constraints; }
function parse(bytes memory groupBytes, bytes32[] memory admittedTypes) internal pure returns (bytes32 groupHash, SchemaCache[] memory schemas);
```

Each field descriptor preserves its exact packed bytes including name. Parse metadata to validate and advance, retain it through the complete group Record rather than duplicate all text in cache. `expectedType` in a cache is resolved: SELF to own TypeId, GROUP_REF to the group's member TypeId, ANY to zero. External exact targets must occur in `admittedTypes`. DIRECT roles only, including source-supported optional and bounded REF arrays. Cache rejects unsupported shapes rather than pretending to cover them.

- [x] Write and run a failing small literal-vector test: one UINT field produces one Type ID and max-body width; malformed/trailing framing rejects. Use independent literal framing, not the parser's own encoder.
- [x] Implement cursor bounds, MC/1 metadata, recursive fields with depth/sibling-name checks, source bounds, role closure/reference budget, indexes, constraints, conservative extraction bounds; preserve candidate checker limitations.
- [x] Test all four retained groups in order against literal retained Type IDs. Check malformed widths, truncation, duplicate names (nested too), unused expected targets, bad GROUP_REF/SELF, unknown external target, role fanout/extraction and index mismatch.
- [x] Report exact supported grammar, unimplemented source obligations, sizes and test evidence. Do not label this a full SR-17 compiler.

### Task 2: Retained composite-EOA admission, atomic caches and bounded indexes

**Files:** Root creates `foundry.toml`, `.gitignore`, `src/AdmissionProbe.sol`, `test/AdmissionProbe.t.sol`, `README.md`, `run-codec.md` and coordination notes.

**Interfaces:** Consume Task 1's library. Publish a shared ABI in `run-codec.md` before Task 3 integration. Use the exact C0 unsigned Envelope, RealmEffects and WritePlan field order. One selected group record per publication; `leafMask=1`, operation kind 1, pre-route zero fields, empty revision hash, pinned byte-store address. Keep `getRecord`, `getEnvelope`, `getAdmission`, `getTypeCache` point reads, bounded indexed access to Type/Record/Occurrence/Principal entries, and a per-author nonce lane.

- [x] First test that an unsigned or misbound request creates no Record, admission, nonce consumption or cache. Then test one valid author-neutral Record with attributable retained EOA evidence.
- [x] Validate canonical body length, exact inventory membership/order for first admissions, independently derived meta-Type, Principal, publication, effects and typed-plan digest; low-s witness; executor/code hash, expiry and nonce lane. Unknown/malformed inputs fail before persistence.
- [x] Persist exact body, unsigned envelope, effects, WritePlan and witness alongside logical admission evidence in the same call as every parsed cache. An authenticated existing Occurrence returns ALREADY_ADMITTED without new nonce, batch, index or cache mutation, before expiry/nonce replay checks. A newly signed Envelope over the same Record adds an admission, not duplicate caches.
- [x] Test failures and low-gas rollback after substantial work; no partial cache, index, nonce or admission changes. No configurable failure switch in the admission path.
- [x] Measure runtime/initcode bytes and actual group admission transactions; if resource limits fail, report the falsifier and fix only a bounded identified cause.

### Task 3: Independent producer, cold reconstruction and resource evidence

**Files:** Create `codec.mjs`, `reader.mjs`, `integration.test.mjs`, `scripts/local-chain.mjs`, `scripts/measure.mjs`, and generated `measurements.json` in this directory. The producer and reader may share the ethers crypto primitive, but the reader may not import producer hash/preimage helpers or trust the contract's computed IDs.

**Interfaces:** Consume Task 2's documented ABI, Task 1's explicit cache tuple and unchanged `../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json`. Exact formulas come from the source spine, not by copying Solidity helpers. Reuse the existing independent descriptor parser, with its ASCII/DIRECT limits named.

- [x] Start with a failing independent-record/publication fixture and a cold-reader failure when retained state is substituted or missing.
- [x] Generate a run-local intrinsic MC/1 singleton descriptor and a named finite capability/inventory commitment; pin every temporary choice and exact bytes.
- [x] Deploy only to managed loopback Anvil; sign with explicit synthetic keys; submit all four actual groups through the sole admission path and read all state back at a pinned block.
- [x] Independently recompute Record/Principal/publication/Envelope/Occurrence/effects/WritePlan IDs, recover signer, compare each parsed cache and bounded index; no `valid=true` oracle or event-only recovery.
- [x] Test substitution, reorder/missing group, replay, new-envelope same-record reuse, signer/nonce/expiry/executor/chain/profile/effect mismatch, and full rollback on a reverted transaction. Assert honest UNKNOWN for unavailable state.
- [x] Retain measured transaction receipts and byte-size summaries with source/toolchain/chain profile and exact limitations. Root runs final verification and obtains independent reviews before publication.
