# Placement release implementation plan

> For agentic workers: use subagent-driven-development for the bounded tasks below. This is a disposable prototype change, not a permanent protocol freeze.

**Goal:** Complete the missing distinction between releasing one's placement (allow fallback), masking it (hide lower authors), and withdrawing a record occurrence (stop maintaining that occurrence).

**Architecture:** Add action `RELEASE=7` and retained head state `RELEASED=3`. Keep existing actions and packed storage offsets unchanged. Ship matching Ledger, indexes and readers; old readers are not assumed to understand a new lifecycle.

**Tech stack:** Solidity 0.8.30/Cancun/Foundry; existing static JavaScript SDK and Vite prototype.

**Spec/authorization:** James approved the separate release prototype September 17 and authorized needed contract/data-model work. The requirements immediately below are the experimental spec. Source baseline `331cac5`, code on the existing `codex/efs-warroom-b-run` worktree; design notes stay on planning/main.

This restores the older Files design's distinction in [[Designs/efsv2/hierarchical-files-and-folders#8.1 Operation shapes|operation shapes]]: Stop claiming allows lower-tier fallthrough, while Unlink/mask blocks it. The old larger representation is not being reintroduced.

## Global constraints and semantics

- `UNBIND=4` stays a mask; `WITHDRAW=6` stays occurrence withdrawal. No old signed action gains a new meaning.
- `RELEASE=7` changes LIVE(1) or MASK(2) to RELEASED(3), clears the selected target, increments the revision, and preserves binding ordinal/history/coordinates. Reject unset, already released and stale revision. Repeating the exact publication retains existing idempotency.
- Only the authenticated author's binding changes. Rebinding after release uses its current revision and existing ordinal. No earlier revision of that author revives.
- Ordered Lens resolution skips released authors, stops at masks, and never skips missing/unsupported evidence. Current/as-of, point/list and replay agree.
- Release removes a live backlink only when the prior state was live. Mask-to-release never decrements twice. Required index failure rolls the whole publication back.
- Releasing a nonempty folder placement preserves the Directory, its children and other placements. Recursive deletion is not implied; graph-wide erasure is not authorized.
- Use a matched fresh local deployment for new lifecycle semantics, not an in-place patch of James's saved demo. Do not start/stop the existing runtime, use public funds or ask Claude/Fable to work.
- Preserve UNKNOWN/PARTIAL/CONFLICT. Keep unsupported archive/recovery/tag cases explicit until their exact semantics are implemented and covered.
- Focused prototype tests only: no new testing framework, broad cleanup, or architecture tournament. Apply patches, stage exact files, preserve unrelated edits.

## Task 1: Coordinated Solidity lifecycle

**Files:** `lab-b/src/{Ledger,IndexModule,IndexReplaySource,LensReader,LabHarness,Interfaces,GuardedRecovery}.sol`; affected `lab-b/test/Files*` and `TagStance*` helpers; new `lab-b/test/BindingRelease.t.sol` and a bounded Files integration test as needed.

**Interface:** Existing `Action` shape with `kind=7`, purpose/subject/role/expectedRevision; no new fields. Expose `bindingLifecycleProfile()` with `keccak256("efs.lab.binding-lifecycle/2:bind-mask-release")` from matched Ledger and LensReader. Add `historyStatePrincipalAt(bytes32 principal,bytes32 position,uint64 asOf,bytes32 execution)` returning `(uint8 coverage,uint8 state,bytes32 target,uint32 revision,uint64 admission)`; preserve the old bool history wrapper for diagnostics, but never use it internally to distinguish mask/release.

- [x] Add a real-contract failing test using `Action(kind=7)` before implementation. Core assertion: Bob live beats Alice; Bob release makes Alice win; Bob mask still blocks Alice; mask-to-release makes Alice win without backlink underflow.
- [x] Run `forge test --match-path test/BindingRelease.t.sol` with isolated out/cache directories and record the expected unsupported-action failure.
- [x] Implement retained state transition and paired index replay. The fold is `if (oldLive) release(oldTarget); appendHistory(admission)`. Replay shadow state must distinguish unset/live/mask/released, not only a live bool.
- [x] Update current/as-of point/list/conflict readers and live/retained scope helpers. Reject unknown states. Stamp a changed scope even for mask-to-release, so old continuations cannot silently mix selection rules.
- [x] Update native/signed action reconstruction. Refuse release for the separate TagStance purpose in this pass: that profile already has its own SILENT token. Retain release support in the existing fresh-authority contiguous-prefix recovery only if Task 2 demonstrates it; unlike occurrence withdrawal, release has no source-admission ordinal to remap.
- [x] Test authority/CAS/repeat rejection, same-ordinal rebind, historical release followed by later bind, replay/live agreement, backlinks, rollback, and a nonempty Directory placement release with children preserved. Reuse existing fixtures, not exhaustive duplicated suites.
- [x] Run focused Lens/index/Files/tag/recovery tests and capture deployed runtime sizes. If a deployed contract exceeds EIP-170, report it and isolate code rather than weakening size checks.
- [x] Commit exact code paths with required role/model/harness trailers; report commands, failures-before-fix, successes, sizes, limitations. Do not edit browser files or planning/main.

## Task 2: SDK and portable action integration

**Files:** `lab-b/browser/{compact-sdk,compact-sdk-v2,guarded-archive,app}.mjs`, `lab-b/script/compact-environment.mjs`, existing SDK tests/runners, new `lab-b/browser/placement-release.integration.test.mjs`, and minimal workbench action wiring. Matching lifecycle contract API comes from Task 1.

**Interfaces:** `sdk.prepare({operation:'releasePlacement', author, authors|principals, folder, name})` does not require a selected File or target: a mask has no target. It resolves the retained name coordinate, requires the signer's own head to be live or masked, guards the displayed Lens selection and produces one action7, expected state3 and a current-revision CAS. It must not publish a redundant name, create a temporary binding, change a File HEAD or withdraw an occurrence. An optional `file` is descriptive only, never evidence for authority.

The fresh fixture manifest gives each supported implementation its exact `bindingLifecycleProfile`. Probe the implementation at the pinned block, and require the Lens getter to match. A manifest cannot relabel a new implementation as legacy; only an actual empty-selector EVM revert from a code-pinned older implementation can establish absent legacy support. RPC failure or malformed success never does. Old matched deployments can keep using their existing operations; they cannot offer release. Reconciliation compares actual historical state, not `live=false` for both mask and release.

For the UI, keep current remove behavior but label it **Hide placement**. Expose **Release my placement…** as a coordinate-based control available even when the row is hidden (current folder plus exact name); explain that another author's entry may become visible and contents are retained. No visual redesign. Existing `restorePlacement` is a new bind at the current revision, not undo of history.

- [x] Add a focused failing check for reconstructing/reconciling RELEASE without confusing it with MASK or restoring an older head.
- [x] Introduce SDK placement release as a distinct planned action; preserve current mask and restore semantics. Require the supported lifecycle profile before offering release.
- [x] Decode state-bearing history for release reconciliation; extend exact archive reconstruction of kind7 with actionsHash comparison, or clearly refuse unsupported export without claiming a complete archive.
- [x] Exercise a fresh local real-chain create → overlay → mask → release → fallback → rebind journey, including nonempty directory placement release. Capture receipt gas for bind/mask/release/rebind. Keep user runtime separate and stop only owned experiment services.
- [x] Confirm stale release plans fail when a watched Lens head changes, missing/relabelled lifecycle support fails closed, cold journal reconciliation still verifies after a later rebind, and an exported release signature detects action tampering. Reuse existing journal/Anvil helpers and a small number of integration fixtures.
- [x] Extend `guarded-recovery.integration.test.mjs`'s existing source-off, fresh-authority EOA-prefix journey with a placed alias, its release, and rebind. Exact actions, author and source signatures survive; source admission remains NOT_PROVEN. Do not claim general merging, native proof portability or occurrence-withdrawal import. If this fails, preserve explicit refusal and report the concrete blocker rather than silently losing a release.
- [x] Run the existing narrow SDK checks and static build. Record what is implemented versus merely tested in contracts, plus remaining v1 parity gaps. Do not turn a prototype pass into production readiness.

## Completion record

### Solidity checkpoint — a93f29d

Task 1 is implemented and independently reviewed: spec PASS, quality PASS,
no important findings or actionable minors. The final focused contract pass
was 107/107; an earlier, overlapping integration selection was 154/154. These
counts are not additive independent coverage. Baseline LensReview passed before
the change; new release tests initially failed as unsupported actions.

The change retains raw storage roots and history and adds state-bearing history
reads. Release is rejected for the separate TagStance purpose, whose own SILENT
token already expresses its application semantics. Original-author contiguous
signed-prefix recovery has a bounded contract test and the source-off SDK
evidence recorded below.

Size checks exposed two real deployment constraints. Existing `acceptanceBasis`
read-only decoding moved to the code-pinned PublicationSupport helper, and a
finite digest-declaration lookup moved to its IndexFieldProfile storage owner.
No compiler limits, validators or required indexes were removed. All 14 measured
deployment variants fit EIP-170; Ledger is **24,524 bytes** (52 bytes of margin),
ProfiledFilesIndex **24,424**, TagStanceIndex **21,674**. This is enough to deploy
this prototype, not comfortable room for ongoing production feature growth.
Production packaging remains a concrete engineering task.

Parent verification also deployed the updated proxy/Directory stack on a fresh,
pruned local chain and passed the existing nested-folder/cold-read/rename/move/
mask/restore/cycle journey. It used local RPC and ordinary byte-size limits;
it was not a public-chain or owner MetaMask run. The temporary chain was stopped
by its fixture. The saved workbench was not restarted.

### SDK checkpoint — 517d335

Task 2 implements coordinate-only `releasePlacement`, exact implementation/Lens
lifecycle negotiation, state-bearing historical reconciliation, signed archive
reconstruction, and the minimal workbench control. **Hide placement** remains a
mask. **Release my placement** accepts an exact name in the current folder even
when the caller's mask has hidden the row. Release publishes one action, no new
name/content records and no temporary binding.

The real-chain journey verifies overlay → mask → release → lower-author fallback
→ rebind. A cold journal still verifies the earlier release after that rebind;
forged MASK history cannot satisfy RELEASE. Stale watched Lens heads refuse
before broadcast. Missing/relabelled lifecycle declarations, malformed answers,
provider errors and mismatched Lens profiles refuse. Nonempty Directory release
leaves an alias and its child bytes usable.

The existing source-off recovery journey now includes an alias's exact heads
LIVE/revision1 → RELEASED/revision2 → LIVE/revision3. Twelve contiguous EOA claims
retain their exact signed actions and source authors; the destination requires
fresh authority. This demonstrates claim recovery, not authenticated source
admission, arbitrary history merging or portable proof of native contract calls.
Source admission remains `NOT_PROVEN`.

The parent independently reran both release and source-off recovery integrations:
**2/2 pass** on fresh, pruned local chains, with owned services stopped afterwards.
SDK/archive units: **54 pass**. Profile checks: **8 pass, 1 optional historical
artifact skip**. The focused guarded-engine check and static Vite build pass.
A stale transport test harness was repaired to inject the real read transport;
production transport was unchanged. Actual old guarded-binary compatibility is
still unverified; this pass supports a fresh matched deployment. No owner wallet
click-through or saved-demo rollout is claimed.

### Measured cost, not an optimization headline

Whole guarded transactions from one fresh proxy + typed-Directory fixture:

| Operation | Receipt gas |
|---|---:|
| Bob create and bind overlay | 1,702,518 |
| Bob hide/mask | 761,554 |
| Bob release masked name | 742,030 |
| Bob rebind | 923,852 |
| Bob release live name | 744,673 |
| Release nonempty Directory placement | 777,178 |

The mask and release transactions each carry 1,316 bytes of calldata. These are
local EVM receipts, not measured L1/L2 bills; deployment, upload fees and L2 data
fees are excluded. This Directory fixture is not the full TagStance workbench
profile, so its create cost must not be compared with that profile as a saving.
Release closes a semantic gap with one action; it does not solve the broader
write-cost floor.

Reproduce from `lab-b` using installed dependencies, Foundry artifacts built from
the same source (including the existing proxy, Files and recovery application
fixtures), and Anvil. `FOUNDRY_OUT`, `EFS_ETHERS_PATH` and `ANVIL_BIN` select those
existing local tools/artifacts:

```sh
node --test --test-concurrency=1 browser/placement-release.integration.test.mjs browser/guarded-recovery.integration.test.mjs
node --test browser/compact-sdk.test.mjs browser/guarded-archive.test.mjs
node --test browser/readset-profile.test.mjs
npm run build
```

The integration runners print their temporary evidence paths and include exact
transaction receipts and manifests. Those local files are disposable; committed
runners and this result summary are the retained reproduction record.

### Still outside this pass

- Recursive removal needs an explicit bounded list of the caller's placements;
  release/hide never imply deleting everyone's data or erasing retained bytes.
- Paid durable uploads, one-approval wallet transport, richer history/copy/link
  controls and full v1 workflow parity remain separate integration work.
- Production module packaging must provide more runtime-bytecode headroom. No
  deployment limit, validator or required index was relaxed to fit this pass.
- Lifecycle profile numbers/opcodes remain prototype choices. Deploy matched
  contracts/readers; do not assume old readers understand state3.

Final independent Task 2 spec and whole-change quality review: **PASS**, with
no important findings or actionable minors. The reviewer reran 54 SDK/archive
checks and the full-range whitespace check. This closes the placement-release
slice, not full v1 parity or the remaining integration work above.
