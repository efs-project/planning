# Native Record kernel / Files extraction plan

> **For agentic workers:** use `superpowers:subagent-driven-development`, one bounded implementation followed by fresh independent review. Fresh-genesis prototype only; not an adopted generic EFS Core.

**Goal:** implement James's separate ingestion/index contract boundary in the native experiment without disguising a Files-specific contract as the generic kernel. Preserve the reviewed native profile's data and Files behavior; measure the cost of the boundary, including regressions.

**Architecture:** `NativeRecordKernel` owns exact typed immutable bytes; `RecordInventoryIndex` owns mandatory unique-by-Type enumeration; the existing `NativeKernel` becomes the Files facade. Navigation and configurable Discovery remain separate accounts/storage. Ordinary calls only.

**Technology:** existing Solidity0.8.30/optimizer200/via-IR/Cancun, Foundry, ethers and static local browser. No new dependency or repository.

**Spec:** [[2026-09-11-efs21-overnight]], [[2026-09-11-efs21-native-kernel-extraction-preflight]]. The source preflight was reviewed at the packed always-code baseline. The [[2026-09-11-efs21-hybrid-body-plan|hybrid gate]] is now complete at exact clean`7db38cd75292c86df6b6e4c2748fd78a26dd71b5`: independent Approved plus root117Forge/33serialNode, formatter/sizes/diff checks. This is the extraction base; worker ownership and dispatch are recorded in the task ledger. Do not combine backend-policy tuning with this extraction.

Independent read-only implementation-plan review approved this gate and the actual source seams at`03f0160`: constructor authority, facade ABI, inventory cursor identity, cross-contract rollback, same-basis dependency graph and frozen control runtime templates. No extraction build or gas result exists yet.

## Constraints and ownership

- Code remains the authorized `planning-efs21` / `codex/efs21-pragmatic` experiment; plans/status on planning/main. Preserve all frozen controls and historical evidence.
- One implementation/build/new finite-world owner. Preserve native54154/RPC54148 and Fable60731/RPC60726. No demo replacement, migration, public deployment/funds, production repository, protocol freeze or limits increase.
- Ordinary24576 runtime/49152 initcode/4096 body/16777216 transaction-and-block gas bounds. Serial managed finite worlds, watchdogs, no traces. Stop heavy work below20GiB; remove only exact owned temporary paths after their processes exit.
- Keep reviewed hybrid selection constants, body validation/storage/integrity and exact Type/Record identity unchanged. No new validator, arbitrary acceptance hook, Files policy, user authority, tags/Lenses, external carrier, privacy or upgrade feature.
- Root owns main-visible updates, review and push; worker commits only exact listed experiment paths with actual model and `Agent: v2-pm` / `Harness: codex` trailers. Source must be frozen before retained final receipts.

## Task 1: Extract, qualify and measure the unchanged native profile

**Files**, relative to `Reviews/2026-09-11-efs21-pragmatic/`:

- Add `contracts/src/NativeRecordKernel.sol` and `RecordInventoryIndex.sol`.
- Modify `contracts/src/NativeKernel.sol` and `NavigationIndex.sol`; minimal import/interface changes to Discovery/Examples only if necessary, with no behavior changes.
- Add focused `contracts/test/KernelBoundary.t.sol` and direct-Record producer/reader test fixtures. Retarget individual private-layout/corruption tests to the actual Record-storage owner; do not weaken or mass-relabel tests.
- Modify `scripts/world.mjs`, minimal shared workload/replay helpers, `sdk/client.mjs`, relevant serial Node/browser tests and local demo configuration producer for explicit source-backed dependency profiles.
- Freeze the reviewed pre-extraction kernel **and the dependency artifact metadata/runtime templates needed to reconstruct its exact graph**, under `contracts/test/fixtures/`. Add `scripts/kernel-boundary-benchmark.mjs` and exclusive final JSON/Markdown evidence. README/interface changes only after evidence.

### 1. Freeze the control and prove the boundary is missing

- [ ] Pin the reviewed hybrid commit and source/runtime/ABI/storage layout. Retain a selectable frozen monolithic-Files control with explicit source-backed profile metadata. Historical always-code controls must keep their explicit selection and assertions; no silent substitution of `current`.
- [ ] RED tests require a distinct generic Record-storage account, a mandatory distinct inventory writer, and author-neutral direct ingestion that does not create a root, File nonce, Files history or Navigation entry. Existing code fails this boundary, not its already-working `storeRecord` behavior.

### 2. Extract bytes from Files, without changing authority

- [ ] `NativeRecordKernel` owns the reviewed Record metadata/body mapping and writer, exact registry, `storeRecord`, `recordId`, `readRecord`, relevant bounds/errors and `RecordStored`. No Files imports, paths, caller namespace state or Files callback. It is permissionless author-neutral admission, **not an authorship claim**. Validation still happens before dedup.
- [ ] `RecordInventoryIndex` stores the unique per-Type RecordIds, exposes the existing bounded cursor/page semantics and is appendable only by its immutable Record kernel. No Files ownership predicate or optional switch. The ingestion call checks pinned inventory code identity and an exact fixed-size success marker; missing/reverting/wrong/short/long replies cannot produce a successful admission.
- [ ] Files facade retains existing external Files signatures, tuple shapes, error selectors and Record forwarding signatures. Define/convert the facade `Record` tuple explicitly if Solidity nominal types change; do not confuse source-level struct identity with wire-ABI equivalence. Add explicit Record-kernel/inventory getters; Record kernel also exposes registry/writer/inventory getters needed for qualification.
- [ ] Direct Files methods retain original `msg.sender`, facade-address FileId domain, CAS, revision/nonce, location sharing, history, terminal unlink and parent/name rules. No external self-call, `tx.origin` or trusted `owner` argument. Producer-contract ownership remains with that contract, not its user.
- [ ] Navigation retains directories, live membership, per-owner all-created inventory and location generations. Remove its stored Record postings. Preserve `typeInventory` as a read-only forwarding compatibility method, with equivalent tuple/high-water behavior and no duplicate storage. Cursor scope must identify the actual source; moved child/index addresses mean old cursor bytes need not match. Fresh-genesis only, never resume an old-deployment cursor silently.
- [ ] `RecordStored` emits from the Record kernel; document the emitter change rather than duplicating a facade event. No claim of byte-identical logs or portable FileIds. Keep Type/RecordIds exact, and preserve facade/producer EOA deployment order so FileIds can be compared exactly where they truly remain identical.

### 3. Wire real separate contracts and preserve atomicity

- [ ] Facade constructor creates Record kernel; its constructor creates registry, inventory and the unchanged BodyWriter, each bound to the correct actual caller. Facade then creates Navigation/Discovery, with Discovery still bound to facade and the same registry. Use explicit getters, not old facade CREATE-nonce4 assumptions.
- [ ] Keep required Navigation and Discovery semantics; tolerated Discovery maintenance failure may retain a Files mutation only with DIRTY search coverage. Preserve processing guard and the existing callback read of provisional updated Files state. No new arbitrary callback surface in Record kernel/inventory/writer.
- [ ] Test both chosen body backends through a reached late failure: all Record metadata/words/child code/helper nonce/inventory writes, facade nonce/current/history and Navigation must roll back. Exercise duplicate admission, wrong writer, missing/bad inventory code, malformed success, stale CAS, name conflict and required/tolerated Discovery outcomes. Preserve failure precedence where the unchanged native rules define it; disclose any unavoidable boundary-induced error change.

### 4. Qualify the actual dependency graph at one basis

- [ ] New source-backed profile explicitly pins facade→Record kernel/Navigation/Discovery; Record kernel→registry/inventory/BodyWriter; inventory writer; Navigation writer; Discovery source/Navigation/registry; and selected registry validator addresses/runtime hashes. Read immutable links and runtime identities at the same observation block and retain the closing block-hash check. An arbitrary caller-supplied graph is not source authentication.
- [ ] Use same-build compiler runtime templates and exact immutable patch inventories to validate deployments. Preserve corresponding frozen templates/provenance for controls; do not check an old Navigation deployment against the new Navigation artifact. Failed/missing/wrong graph configuration refuses before writes or qualified results.
- [ ] SDK observation and subsequent basis checks bind the profile/graph identity. Test tampered dependency code/link/writer/validator, wrong chain/genesis/deployment/basis, missing graph and historical profile selection. Keep explicit legacy profiles only for genuine frozen controls; absence of new metadata must not silently downgrade a new split deployment.
- [ ] Existing plain browser API and uncertainty/reconcile behavior stay intact. Its config producer emits the new profile metadata; raw bytes/static files and route handling are unchanged. Qualifying a source-pinned graph via RPC remains **an RPC observation, not a chain state proof**. Report new qualification/read RPC costs rather than hiding them in setup.

### 5. Matched whole-workflow evidence

- [ ] Two finite worlds: exact frozen reviewed hybrid control and extraction-only candidate. Same validators, data, external setup order and action calldata wherever meaningful. Keep prior gas/account/block ceilings. Retain actual source/compiler/runtime/configuration/transaction pins and cleanup.
- [ ] Direct generic Record admission/read/by-Type inventory; facade forwarding; root/directory/create/edit/same-content edit/rename/unlink/history/reload; contract quote first/update; independent paid one/two reads; exact by-Type dedup across direct and Files admission; required/tolerated index failure and late rollback. Cover tiny, dense maximum and sparse maximum bodies so call-copy overhead is visible. Do not rerun an unbounded occupancy matrix or change the hybrid policy.
- [ ] Compare setup and each complete action/read separately. Public state/bytes/IDs must match where their domains are preserved; enumerate event-emitter/dependency/cursor-scope differences rather than deleting mismatches. Extra calls/copies may increase cost; this task claims separation, not automatic savings.
- [ ] Run the existing native Forge/serial Node/browser suites with real candidate behavior, touched formatting, ABI/TypeId checks and ordinary sizes. Root reproduces proportional verification and commissions a fresh independent source/evidence review before publication. Optional new clickable demo is a separate root action after the gate; do not mutate either preserved demo.

## Success and nonclaims

A useful result is actual independently qualified generic Record ingestion with separate mandatory inventory, usable unchanged Files operations and priced overhead. It still has the native prototype's three fixed stateless validators, local caller authority and bounded Files rules—not full-v2 Principal recovery, portable authored envelopes, arbitrary acceptance, Lenses, privacy or global discovery. A reviewed physical boundary does not settle which larger-v2 features James should keep or sacrifice.
