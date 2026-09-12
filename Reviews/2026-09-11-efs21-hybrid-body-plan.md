# Native hybrid body-storage plan

> **For agentic workers:** use `superpowers:subagent-driven-development`, one bounded task with independent review. This is fresh-genesis prototype evidence, not an adopted layout or migration.

**Goal:** retain exact bytes, Type/Record IDs, explicit existence and bounded integrity checks, while avoiding code-deployment cost for tiny/sparse bodies. Measure both write savings and paid-read regressions.

**Architecture:** two metadata slots plus a private fixed-capacity body-word mapping. Backend0 keeps the existing code pointer; backend1 stores only nonzero 32-byte words. A deterministic internal write-oriented selector chooses one for new Records after validation/dedup. No public API/configuration change.

**Tech Stack:** existing Solidity0.8.30/optimizer200/via-IR/Cancun, Foundry and serial ethers/Chromium harness; no new dependency.

**Spec:** [[2026-09-11-efs21-overnight]], [[2026-09-11-efs21-packed-presence-plan]]. Read-only expert preflight checked packed source`f43501a`; root checked metadata/admission seams. Dense-code versus zero-heavy counterexamples are retained at`58e61c4`. Packing source/evidence`f43501a`/`b8896a7` completed independent Approved/root99Forge27Node/format/sizes gates. Later`03f0160` changes only the historical report's integrity-comparison wording, not code/evidence; root must recheck the exact clean base before dispatch.

## Global constraints

- Dispatched after the actual Files anchor-batch independent/root gate (68reader/27targeted browser tests, strict TS/syntax/diff). Exact clean base`03f0160a85469e1a37c019f364417a875fbc890b` is pinned in the task ledger. The hybrid worker owns the sole implementation/build/new finite-world slot. Code stays `planning-efs21` / `codex/efs21-pragmatic`; plans/status remain on main.
- Preserve native54154/RPC54148, Fable60731/RPC60726, all historical sources/evidence and other worktrees. No demo replacement, migration, production repository, public deployment/funds, raised limits or protocol promotion.
- Ordinary24576 runtime/49152 initcode/4096 body/16777216 transaction-and-block gas ceilings. Finite serial managed worlds; no traces; stop heavy work below20GiB. Clean only exact owned paths after exit.
- No new validator, Type grammar, identity, indexing, Files semantics, SDK/browser API, carrier or third inline backend. Keep BodyWriter deployed in the same constructor position and unchanged runtime. Reserve the old presence root.
- Validate before dedup; duplicate bodies never relocate or allocate. Keep helper-codehash validation on **all new admissions**, including word-backed choices. Skipping it changes helper-outage behavior and is outside this task.
- Exact-path commits using message files, actual model and `Agent: v2-pm` / `Harness: codex` trailers. Root reviews/verifies/pushes; source frozen before final retained receipts.

### Task 1: Two bounded backends, measured selection and whole-file evidence

**Files**, relative to `Reviews/2026-09-11-efs21-pragmatic/`:

- Modify only private Record metadata/backend admission and `readRecord` in `contracts/src/NativeKernel.sol`.
- Create `contracts/test/HybridBody.t.sol` and test-only forced-backend fixtures. An internal pure virtual selector may support test-only subclasses; no public switch or privileged body mutation method.
- Freeze the exact reviewed packed always-code artifact under `contracts/test/fixtures/`; add explicit source-backed capabilities in `scripts/world.mjs`.
- Add `scripts/hybrid-body-benchmark.mjs`, focused world/measurement tests and exclusive calibration/final JSON/Markdown evidence. Minimal shared workload reuse and explicit legacy replay routing below are allowed; never rewrite older measured evidence or silently relabel changed controls.
- Narrowly retarget **individual code-specific assertions** to the explicit forced-code fixture where their intended prerequisite is code storage; do not blindly retarget whole files. Ordinary Native/Raw/Types/Discovery/History/Examples and browser tests must exercise the real hybrid, with explicit real-hybrid empty/presence, dedup, corruption and rollback coverage. Do not simply delete old assertions when backend choices change. Record every test-maintenance reason.
- Update README/interface only after evidence, preserving the running demo's source boundary.

**Legacy always-code replay routing:** both old body/packed runners currently select dynamic `current`, and the shared workload requires one child per distinct Record. After hybrid, default code-only calls must refuse that selection clearly **before starting worlds** and offer explicit frozen replay. Narrow changes to those two wrappers, shared workload capability guards, `world.mjs` and replay tests are allowed. Add a source-backed `bodyBackend` capability distinct from `bodyWriter`: helper presence does not imply all Records use it. Frozen replay uses the exact recorded code candidate for body-storage and reviewed packed candidate for packed-presence, never forced-code hybrid. Preserve all child/runtime/nonce/corruption assertions; new reports use actual frozen selection names and current support-source provenance, with separate exclusive output paths. Retained historical JSON/labels/pins remain untouched and valid only against their own provenance. Do not alias hybrid `current` to a frozen or forced-code artifact.

- [ ] **Step 1: Freeze, calibrate and prove behavioral RED.** Freeze packed source/artifact before changing production. Establish old fresh empty/sparse receipts and actual metadata/helper behavior. Write tests showing the intended failure: tiny/zero bodies still create a child and cannot be represented as bounded headerless words. Keep the old private layout/presence tests meaningful. Build both candidate backend paths with test-only forced selectors, then run a bounded equal-workload calibration before fixing the production selection constants. Label calibration sources/artifacts honestly; they are not final-source receipts.

- [ ] **Step 2: Minimal physical layout.** Append `uint8 backend` after existing bool: pointer bytes0–19, length20–21, present22, backend23 of the second word. Code tag0 preserves the old encoding; words tag1 requires pointer zero. Append `mapping(bytes32 => bytes32[128]) private sparseBodyWords` after `locations`; retain records root3, reserved presence root4, locations root5, new words root6. Check layout from the compiler, not assumptions. No dynamic-bytes header/length slot and no presence shortcut from TypeId/pointer/length.

Preserve `_store` order: bound body, unchanged Type validation, exact RecordId, presence/dedup, helper identity check, physical selection/write, complete metadata, existing inventory/event. Scan only new Records. Mask final partial word before nonzero counting/storage; calldata after the body is not part of it. Store only nonzero words and never share word locations across RecordIds or Types. Keep every late mandatory failure atomic.

- [ ] **Step 3: Bounded identical reads.** Presence false still means MissingRecord before other fields. Presence true bounds length<=4096 and rejects unknown backend before copying. Code path retains pointer, exact code size, STOP and exact RecordId checks. Words path requires zero pointer, loads exactly `ceil(length/32)` words, rejects nonzero tail padding and returns exactly authoritative length. Hash both backends with the unchanged identity expression. Empty present words mode has no child/body word; it is not missing. Do not claim to detect a cleared presence flag or garbage beyond the authoritative word range.

Attack unknown tags, length65535, pointer in words mode, missing/corrupt/same-length code, changed/deleted word, wrong Type, tail padding, empty presence, duplicate and cross-Type behavior. Exercise late name/index failures in **both chosen backends**, including restored words/metadata/history/inventories and helper nonce/child code where applicable. Reuse bounded differential sequences against frozen packed code control for exact public current/history results.

- [ ] **Step 4: Fix a transparent internal policy.** Selection uses exact canonical body length and masked nonzero **storage-word count**, including ABI headers. Do not use length alone or nonzero-byte count. A write-oriented proxy may compare fresh nonzero SSTORE cost plus bounded loops against CREATE/code-deposit/copy/helper cost, with explicit constants and tie rule derived from the bounded forced-backend calibration. This is an experimental deterministic heuristic, not an opcode-price oracle or a lifetime optimum. Preserve selector scan/dispatch cost even when code wins; report misselections rather than silently excluding them. A tie-rule unit test is required; if no reachable length/occupancy yields an arithmetic tie, disclose it and use nearest feasible receipt cases. No per-record configuration, mutable threshold or owner decision is introduced.

Zero-heavy writes may be cheap while reads still touch every word, including zeros. Keep paid read cost separate; do not invent an assumed number of future reads to hide that tradeoff. Freeze selected constants/source before final benchmarks. Escalate if the policy cannot yield a useful bounded result without new semantics.

- [ ] **Step 5: Matched evidence, not an unbounded matrix.** Use a fixed finite calibration matrix, then final source-pinned frozen-code / forced-code / forced-words / hybrid arms on identical calldata/setup order. Report why both forced controls are needed: they compare the final hybrid with each physical write path. State whether forced overrides bypass occupancy scanning. Their receipt deltas include compiler/dispatch differences and are not automatically an exact isolated selector-gas measurement. Test-only fixtures are not production profiles. Reuse the established whole-file/producer/paid-reader actions and choose a representative bounded occupancy matrix rather than blindly multiplying all dimensions.

Cover lengths0/1/20/31/32/33/41/63/64/65/256/4032/4096, feasible occupancies0/1/2/3/4/quarter/half/full across representative sizes, concentrated/dispersed bytes, first/last/tail words, exact tie/adjacent cases and canonical headers. Include same length/nonzero-byte count with different word occupancy. Preserve unique versus dedup collisions explicitly. Whole-file fresh create/edit, same-content edit, rename/unlink, quote producer first/update, independent one/two paid reads and reached late failures are mandatory.

Record actual backend metadata using a separately checked source-layout observation, exact words, helper nonce/created objects and return bytes. Record count no longer equals helper-child count. Distinguish paid receipts from estimates, deployment from actions, intrinsic from execution, local-chain measurements from network/USD projections. Retain source/compiler/runtime/artifact/configuration/transaction pins and exact cleanup. New evidence creation must be exclusive; no full traces.

- [ ] **Step 6: Verify and hand off.** Full native Forge, touched formatter, ordinary sizes and serial Node/browser suite; exact public ABI/selectors/TypeIds unchanged. Keep historical receipt checks labelled historical, with fresh forced/current world integrity tests. Record RED/GREEN, counts including inherited repetitions, all regressions, actual limits, stopped finite processes and owned cleanup. Root reproduces proportional tests and commissions a fresh independent source/evidence reviewer before publication or optional later demo replacement.

## Important comparison boundary

The old`c088363-read-integrity` fixture adds a post-copy hash but does not prebound a corrupted dynamic-bytes length. It is historical hash-integrity evidence, not a bounded-reader safety control for this task. Use the reviewed **packed always-code** source as the old control; forced words and final hybrid must share the new bounded metadata/range/hash discipline. Do not relabel the older three-arm result.

No saving, policy adoption or full-v2 capability is established by this plan.
