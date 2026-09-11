# K10 and state-readable storage comparison implementation plan

> For agentic workers: use `superpowers:subagent-driven-development` task by task. This implements the authorized disposable experiment, not a permanent protocol selection.

**Goal:** hand Fable an isolated, tested K10 writer/reader comparison and an independently measured state-readable storage experiment.
**Architecture:** retain the legacy admission-ordinal control. A fresh-initialization-only, explicitly identified K10 arm uses binding-key ordinals in scope words, with corresponding checked readers and independent reconstruction. Storage alternatives are a separate lab, not a silent rewrite of deployed C0 state.
**Tech Stack:** existing Solidity 0.8.30, Cancun, optimizer 200, via IR, Foundry and Node test runner.
**Spec:** [[Reviews/2026-09-10-foundation-reply-after-economics]], especially section 3. James authorized execution after prompting Fable.
**Status:** authorized experiment plan; execution in progress

#status/draft #kind/task #repo/planning #topic/efsv2

## Global Constraints

- Work only in the owned `codex/mvp-c0-coherence` worktree; base `832c7ae722d525a8c2e2e7e441b8c76df029273f`. Fable's `cb6e76e10c77ac907ba4cd3bd79743a5857bb1c7` is a read-only source pin, not a runtime import.
- No main merge, public deployment, real funds, protocol freeze, or writes in Fable's worktree.
- Canonical Type, Record, Envelope and Occurrence identities and kind-8 history remain unchanged.
- Preserve legacy behavior by default. K10 is explicit and fresh-initialization-only; no reinterpreting populated legacy scope words.
- Admission ordinal, global binding-key ordinal and zero-based scope position remain distinct. u48 guard and five packed ordinals per word remain.
- Qualify current/historical reads and cursors. No partial absence, false COMPLETE, or hidden unbounded scans.
- Ordinary application tags remain outside this patch. A tag follows its declared subject; File, exact version and location semantics are not interchangeable. Fable owns that experiment and UI.
- Tests and measurements are local disposable evidence, not production readiness or future-fork measurements. Preserve current schedule and exact accounting boundaries.

## Task 1: Fresh-only K10 writer, readers and independent reconstruction

**Files:**
- Modify only the necessary modules under `Reviews/2026-09-05-c0-core/src/`: `StateStore.sol`, `StateKernel.sol`, `StateReadPrimitives.sol`, `StateAuditPages.sol`, `QueryReadLibrary.sol` if a forwarding method is necessary.
- Add `Reviews/2026-09-05-c0-core/test/K10Scope.t.sol` and a narrowly scoped harness there or in `K10ScopeHarness.sol`.
- Modify `Reviews/2026-09-05-c0-core/reference/state-reader.mjs` and add focused Node tests only as needed to reconstruct both explicitly selected layouts.
- Narrowly repair `Reviews/2026-09-05-c0-core/scripts/local-stateful.mjs` build-info selection if needed: match deployed bytecode and immutable-reference metadata as well as creation bytecode before choosing the AST. Incremental builds must not use an unrelated AST with different immutable IDs.
- Apply that same provenance check to `Reviews/2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs` if its existing `compilerEvidence` has the same mismatch; no upgrade production-contract change is included.
- Add `Reviews/2026-09-05-c0-core/k10-scope-experiment.md` with format, integration and evidence notes.

**Interfaces:** consumes existing `StateStore.Store`, sole `StateKernel` writer, `StateAuditPages.PageRequest/PageResult`, and `foldAdmissions`. Produces an explicit fresh-only mode-selection seam, checked pages/counts in both modes, and a source-pinned handoff. Any new public-facing mode/ordinal meaning must be documented; no auto-detection from values.

- [x] Write the first discriminating test before implementation. Make unrelated admissions precede the first binding, so admission ordinal differs from binding-key ordinal. The old control's first scope entry is the admission ordinal; K10's physical entry must be global binding-key ordinal 1, resolving to that same binding key. Use actual admissions, not only seeded storage.
- [x] Run `forge test --root Reviews/2026-09-05-c0-core --match-path test/K10Scope.t.sol -vv`; retain the expected RED failure. A compile failure is not sufficient RED evidence: start with a runnable legacy-control assertion that demonstrates the incorrect K10 result, then introduce new APIs as required.
- [x] Implement the explicit comparison mode with an appended storage discriminator and a mode-selection function that refuses after initialization. Default zero remains the current legacy control. Use a full-word discriminator in its standalone slot, accepting only 0/1 and refusing malformed full-width values without truncation. Ensure new initialization validates the selected mode, and unknown modes fail closed. A dedicated new initializer is also acceptable if it enforces the same pre-state restriction; document the exact chosen call sequence.
- [x] In K10 mode, `bindingEffect` appends `p.count.bindingKeys` to kind 10 on first binding only. Other posting families retain their current domains and semantics. Do not add a reverse map to every write in this first arm.
- [x] Separate physical posting bounds from admission-time eligibility. Kind-10 head/word checks use binding-key bounds; historical prefix eligibility and hydration recover the first admission from the key's kind-8 history. Validate missing key/history, reserved bits, ordering and guards. Counts must state which domain `last` uses.
- [x] Version or translate raw and hydrated outputs explicitly. Preferred comparison: K10 raw items are binding-key ordinals, while hydrated rows retain first-admission ordinals and original occurrence identity; document the different domains rather than relying on positional equality. Use distinct cursor context modes so a legacy raw/hydrated token cannot be reused in K10 even at equal count/high-water/revision inputs. Keep the original ABI meanings unchanged for the legacy mode.
- [x] Add a bounded scope-position to binding-key read usable by a future generic contract, if raw page plus existing key lookup is insufficient. Any direct lookup must validate the selected scope and position. No reverse-locator claim without a separately priced mechanism.
- [x] Test unrelated admissions between bindings; multiple scopes/authors; first-op tombstone; rebind; withdrawal of selected and old binding; exact replay; five-packed boundaries; historical cuts before/at/after first admission; continuation across append at the original basis; cross-mode/raw/hydrated/scope/basis cursor refusal; malformed keys/history/words; u48 boundaries. Reuse existing admission fixture builders.
- [x] Independently fold the same events into expected scope entries for both explicit layouts, without importing the production writer. Legacy verification must not silently accept K10 snapshots or vice versa. Add a real consumer test rather than source-text assertions.
- [x] Measure control versus K10 cold scope-to-key lookup and hydrated-history access with the same final logical data and separate warm runs. Report exactly what the measurement includes; no unmeasured 10k or total transaction claim. Verify the contract runtime-size budget for changed deployable libraries.
- [x] Run the full Core Forge suite, focused Node reconstruction tests and relevant upgrade-foundation regressions. Retain command, output and RED/GREEN evidence. All existing control tests must remain green.
- [x] Self-review and commit only task paths with repository trailers. Write the report to the controller-provided task report file. Report any omitted matrix row honestly rather than declaring the entire split complete.

## Task 2: State-readable immutable bytes and content-dedup comparison

**Files:** create a self-contained lab at `Reviews/2026-09-10-storage-arms/` with `foundry.toml`, `src/ImmutableBytesArms.sol`, `test/ImmutableBytesArms.t.sol`, `test/LayoutHarness.sol`, and `README.md`. The layout harness imports actual `StateStore` structs; no existing C0 storage replacement in this task.

**Interfaces:** equivalent `put(bytes)` and checked `read(id)` behavior for storage bytes, immutable code bytes, and content-addressed reuse with per-file/per-position references. Every returned byte string is checked against an exact length and content commitment. No private offchain body store. Reference keys bind publisher namespace, an exact revision/tree commitment, and position—not a mutable filename or continuing File whose future contents must change. Content upload grants no authority over another publisher's references. This is a storage experiment, not an alternative Files authorization model.

- [ ] First write runnable storage-control tests for exact round-trip, repeat writes and differing bytes; add a failing expectation for cross-file/cross-position content-only reuse before implementing the dedup arm.
- [ ] Implement a small state-bytes control and code-bytes arm using an inert prefix and immutable deployed payload, with explicit max length and code identity checks. Do not add a dependency solely to hide the experiment; name the design as code-backed immutable bytes, not proof of a production SSTORE2 integration.
- [ ] Add content-only deduplication plus separately keyed file/position references. Same bytes across different references reuse one payload; different bytes never alias. Reject wrong length, malformed/substituted pointers and unavailable code. Do not overwrite a previously committed exact reference silently.
- [ ] Test zero bytes, 1, 31, 32, 33, 1024 and 4096 byte payloads, with zero-filled and nonzero contents; identical restage; changed bytes; two files and two positions; fresh independent contract reading after original writer is no longer consulted; corruption and missing payload. The empty code payload is a real one-byte STOP contract, not address zero. Check same-length altered code, truncated/missing code, and reference/pointer substitution. Share no encoder-derived expected hashes with the decoder under test when a literal vector can establish the boundary.
- [ ] Run measured first/repeat/different-file writes and cold/warm reads against identical payloads. Use `forge test --isolate` (installed CLI confirms separate top-level EVM transaction contexts) and a probe whose first and second reads are measured in one call, or explicitly demonstrated cooling. Keep setup outside the measured transaction. Report deployment/write/read costs separately, without future-fork or all-EFS savings claims.
- [ ] Record actual Foundry compiler storage layouts for existing C0 row structs in the report and identify packing headroom from slots/offsets, not field counts. If already packed, say so; this measurement is input to a later actual row-reencoding/shared-context patch, not its implementation.
- [ ] Run the complete lab suite and a task-scoped review; commit only task paths and write the provided report. Keep canonical protocol selection, carrier permanence guarantees and full integration open.

## Joint finish

- [ ] Review each task, fix material findings, run fresh covering tests, and publish exact commits on the owned branch.
- [ ] Update the handoff/status with measured results, current limitations and next integration steps. Give Fable the K10 commit independently of the storage experiment.
- [ ] Preserve follow-ups: actual row-reencoding/shared-context patch, populated-layout migration, reverse locator comparison, joined 10k index run, and acceptance/evolution/continuity after the kernel checkpoint. This two-task plan does not claim to finish those later phases.

## Execution record

Task 1 passed task review after one fix round: `c38b1f4` adds the fresh-only
writer/readers; `fe98f18` closes missing offline layout qualification. Fresh
controller runs passed 210 Core Forge, 19 upgrade Forge and 30 selected Node
tests, including the 11-test stateful-chain consumer suite. Detailed interfaces,
RED/GREEN evidence and measured costs are in
[[Reviews/2026-09-05-c0-core/k10-scope-experiment]].

The seven-key fixture saves 40,023 gas for cold scope-to-key lookup but costs
4,471 more for the cold lookup-plus-history path. Those are bounded call-work
measurements, not transaction totals or directory-scale results. The upgrade
admission library has only 23 runtime bytes spare: module decomposition is an
explicit integration follow-up before adding features, not delivered headroom.

Experiment choices: keep legacy mode0 as default and opt into mode1 only before
initialization; use a full-word discriminator in the same standalone slot;
require explicit trusted read layout/profile. This costs a mode branch and an
experimental read-configuration change, without reinterpreting populated state.
The separate storage lab remains next; actual row-reencoding/shared-context
optimization is not being bundled into it.
