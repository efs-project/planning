# Full-C0 initialization outlining

> **For agentic workers:** use `superpowers:subagent-driven-development`; one bounded implementation, independent review and root verification. Fresh-genesis experiment only.

**Goal:** recover actual deployed Core code-size headroom without adding a call to recurring reads or removing filesystem/data guarantees.

**Architecture:** route the existing one-time StateKernel initializer through the already pinned, storage-authorized UpgradeAdmissionLibrary. Keep the proxy bootstrap guard first and explicitly check the linked library immediately before delegatecall. Do not introduce another module or change the execution-set shape.

**Tech Stack:** existing Solidity0.8.30, optimizer200, via-IR, Cancun, Foundry and full-C0 paired runner.

**Spec:** [[2026-09-11-efs21-full-model-storage-preflight]], [[2026-09-11-efs21-overnight]]. Source-only preflight checked exact`ab13d89` and the Envelope candidate. **Dispatched September12 07:48UTC** after the Envelope and metadata-read gates, against exact reviewed/root-reproduced/pushed control `1cb402a19c9b6f1ddf4137dfa2597f85bc50dd82`. Fresh actual CoreU3 runtime remains24536bytes, only40 below EIP-170; admission library20317 and PreparationHelper18953. One implementation/build/new finite-world worker owns this task; root owns review/publication. No shared-slab or Type-codec change is bundled.

Independent read-only plan review approved the bootstrap order, exact dependency check, fresh-genesis linkage restriction and actual U3/paired-cost gates. No compiled saving is established by source review.

**Completed September12 08:33UTC:** source/support`b6ffadea`, evidence`d0a908de`, independent review/root closure`8688d5299eac8d9f83264806c32de471f427bbb2`. Root reproduced233 Core/37 foundation tests,276 passing Node/browser/offline checks plus one existing Type skip, strict TypeScript, formatting and actual module sizes. U3 runtime is23,619bytes (917 recovered,957 margin); library runtime21,635. Bootstrap+3,029gas, complete create+330gas and paid reads+4–22 are reported, not called savings. Six compiler-generated Core error declarations move to the library ABI with unchanged revert tuples and tested union decoding. [Exact results and retained limitations](https://github.com/efs-project/planning/blob/8688d5299eac8d9f83264806c32de471f427bbb2/Reviews/2026-09-11-efs21-pragmatic/initialization-outline-results.md). All owned worlds stopped; three demos preserved. The unchecked original task list below is the historical assignment, not an open queue.

## Global constraints

- Code only in authorized `planning-efs21-direct` / `codex/efs21-direct-apply`; main-visible plans on planning/main. One implementation/build/new finite-world owner. Preserve native49966/RPC49941, old54154/RPC54148, Fable60731/RPC60726 and all Fable work.
- No production repository, migration, public chain/funds or adopted protocol. Runtime24576/initcode49152/transaction16777216 and existing full-C0 block33554432 limits unchanged. No trace/large-history diagnostics; stop heavy work below20GiB. Only exact owned stopped temporary paths may be cleaned up.
- StateKernel.initialize, stored layouts/rows, Type/cache rules, every index, public Core function selectors/tuples/events, authority and recurring read checks stay unchanged. No generic write-switch reduction claim: initialization already calls StateStore.writeType directly.
- Freeze the complete old source/artifact bundle before edits. Candidate U1/U2/U3 and Carrier generations must bind the same candidate admission library from genesis. Existing upgradePair preserves library identity and cannot install a newly linked library into the old populated control pair. No controller/formula expansion or old-library migration in this task.
- Existing 21-word ExecutionSet shape remains; actual module/runtime/configuration commitments and execution IDs change. Authenticate those differences; never normalize changed code identity into a false equality. Root owns review, push and main results.

## Task 1: Outline initialization into the existing admission library

**Files:** `Reviews/2026-09-08-upgradeable-foundation/src/UpgradeAdmissionLibrary.sol` and `src/UpgradeableFixtureCore.sol`; focused `test/InitializationOutline.t.sol`; only required loader/runtime-profile selectors; an isolated paired script and exclusive evidence under`Reviews/2026-09-11-efs21-pragmatic/`. Retain old evidence unchanged. Do not move raw getters or edit Preparation/StateKernel to obtain a larger saving.

- [ ] **Freeze and first size experiment.** Pin actual control CoreU3 deployed runtime length and all linked dependency artifacts/settings. In the focused test deploy the actual candidate U3 with ordinary caps and require `candidate.code.length < controlRuntimeLength`; run this assertion against the unchanged control first and retain its intended failure. Existing initialization/authority tests establish the semantic baseline. Compile after the two minimal changes below. If actual U3 does not shrink, or another actual deployed module exceeds a cap, retain the failed probe as evidence and stop this candidate for root reassessment. Do not change optimization settings or cut functionality to force a win.

- [ ] **Minimal implementation.** Add this external wrapper to the existing library:

```solidity
function initialize(
    StateStore.Store storage s,
    StateKernel.Init memory init,
    Preparation.Config memory prep
) external {
    StateKernel.initialize(s, init, prep);
}
```

In the existing public Core initializer, keep `_initialize(controller, peer, admin, operator, treeType);` first. Replace only the following inline engine call with:

```solidity
if (
    address(UpgradeAdmissionLibrary) != admissionLibrary
        || admissionLibrary.code.length == 0
        || admissionLibrary.codehash != admissionCodehash
) revert FixtureConfiguration();
UpgradeAdmissionLibrary.initialize(
    UpgradeStorage.efs(), init,
    Preparation.Config(preparationHelper, preparationCodehash)
);
```

The equality predicate is explicit binding discipline; compiler folding is acceptable. Do not call `_execution()` or `configuration()` during bootstrap: peer/admin/active revision are not ready. The library is trusted Store-authorized code, not an index/plugin. Its delegatecall retains proxy storage and caller/address context; actual helper calls/CREATE order must be checked rather than assumed.

- [ ] **Bootstrap and failure tests.** Compare all bootstrap bytes/IDs, intrinsic Type cache, counts, helper child code/nonce, proxy/admin addresses and exact execution configuration. Direct implementation, unauthorized sender, second initialization and post-construction initialization must still refuse. After constructing an implementation, etch its linked library to missing/different code in test-only fixtures and require the new early FixtureConfiguration refusal; use a deliberately failing preparation helper to distinguish this guard from a later setup failure. Force malformed init and helper failure after the guard, then assert proxy/factory storage, helper nonce/child code and control flags fully roll back. Public direct calls to the deployed Solidity library must not authorize mutation of proxy state.

- [ ] **Paired actual deployments and recurring controls.** Same source-frozen control/candidate workload and support revision, serial worlds. Record every actual U1/U2/U3/Carrier/library/helper runtime and initcode size, actual linked addresses and deployment/bootstrap receipt. Compare complete Files create/edit/tag/rebind, checked/current Record reads, occurrence/Binding reads and reached late refusal; retain all receipt gas, IDs, inventories and qualified effects. Initialize the candidate pair with its library from genesis and run the existing populated upgrades within that candidate identity. A one-time call may cost more; library dispatch/compiler changes can affect recurring admissions, so do not promise unchanged gas without paired receipts.

- [ ] **Final gate.** Full applicable Core/foundation Forge, exact bounded SDK/authority/independent-effect/Chromium list, strict TypeScript and touched formatting. Name existing exclusions and unsupported legal large-Type case. Source/support commit before final exclusive evidence; independent source/evidence review, root reproduction and exact-path push. Confirm all owned test worlds have exited and preserved demos remain.

## Interpretation

This is an enabling size experiment, not a direct claim that file creation becomes cheaper. Its value is a smaller actual browser Core without imposing an additional external call on every raw/qualified read. Aggregate dependency size and deployment cost may rise. Raw-reader outlining remains an alternative if this probe fails; it is not bundled here because it changes recurring failure/cost boundaries.
