# Checked Record batching implementation plan

> **For agentic workers:** use `superpowers:subagent-driven-development` task-by-task, with independent review. This is a disposable prototype arm, not a protocol/API freeze.

**Goal:** let contracts and the Files SDK obtain several checked Records with one execution-state qualification and one actual call, preserving existing read semantics and explicit observation basis.

**Architecture:** two thin Core entry points share one bounded implementation. Current reads need no preflight; checked reads additionally enforce the SDK's expected basis. One existing point-library dispatch loops through the unchanged scalar checked reader. This is Record hydration only, not a complete directory or Lens query engine.

**Tech Stack:** existing Solidity 0.8.30, optimizer 200, via-IR, Cancun, upgradeable fixture, ethers/Node test harness. No new linked-library role or dependency.

**Spec:** [[2026-09-11-efs21-overnight]], fuller-model read followup. Expert source inspection found repeated `_readBasis()` and point-library dispatch work. A homogeneous Record batch is a smaller independently testable step than general selector batching, history or grouped Lens resolution.

## Global constraints

- Code arm begins from reviewed `67f11f7` in the isolated `codex/efs21-direct-apply` worktree. Preserve native/Fable code and live worlds, previous receipt JSONs and source controls. No mainnet/public deployment, funds, migration, production repository or normative design promotion.
- Start implementation only after the body-storage task releases the single implementation/build/new-finite-Anvil slot. Read-only preparation can run concurrently. Root owns planning/main documentation and eventual push.
- Keep current scalar read APIs, `StateKernel`, `StateStore`, `StatePointReads`, all write behavior, record representation and Lens/history behavior unchanged. Existing linked readers remain trusted Store-authorized code, not arbitrary plugins.
- Keep ordinary EIP-170/initcode and 16,777,216-gas local limits. No traces or raised ceilings. Managed bounded worlds, serial execution, exact owned-cache cleanup; stop heavy work below 20 GiB free.
- Full code/runtime/manifest qualification, EIP-1898 block-hash pinning and final SDK sealing remain. Data returned by an RPC is still an observation, not a state proof. Never normalize away an incorrect deployment/execution identity.
- Commit exact owned paths using `chore:` or `docs:` and actual model, `Agent: v2-pm`, `Harness: codex` trailers. Do not push before controller review/verification. Results and proposed decisions return to main-visible documentation.

### Task 1: Current/checked Record batch and qualified SDK acquisition

**Files:**

- Modify `Reviews/2026-09-05-c0-core/src/PointReadLibrary.sol`: result struct and bounded loop through unchanged `StatePointReads.getRecord`.
- Modify `Reviews/2026-09-08-upgradeable-foundation/src/UpgradeableReadFixtureCore.sol`: current/checked entries and shared captured-basis logic.
- Modify `Reviews/2026-09-09-files-reader/reader-scope.mjs`: explicit `scope.getRecords(ids)` with the same qualification, accounting, cancellation and seal lifecycle as scalar calls.
- Create focused `Reviews/2026-09-08-upgradeable-foundation/test/CheckedRecordBatch.t.sol`, `Reviews/2026-09-09-files-reader/test/checked-record-batch.test.mjs`, and a small test-only consumer/multicall fixture if needed for mined read costs.
- Create `Reviews/2026-09-11-efs21-pragmatic/scripts/checked-record-batch-benchmark.mjs` and new exclusive `evidence/checked-record-batch.json` / `evidence/checked-record-batch.md`. Use existing fresh-deployment builders/manifests; only minimal owned test/runner wiring to discover the new APIs. Preserve previous runners/evidence.

**Interfaces:**

```solidity
struct ReadBasis {
    bytes32 executionSetId;
    uint32 revision;
    uint64 blockNumber;
    uint64 admissionHigh;
}
struct RecordResult {
    bytes32 recordId;
    bytes32 typeSchemaId;
    bytes canonicalBody;
    uint64 firstAdmitOrdinal;
}
function getRecordsCurrent(bytes32[] calldata ids)
    external view returns (ReadBasis memory actual, RecordResult[] memory records);
function getRecordsChecked(ReadBasis calldata expected, bytes32[] calldata ids)
    external view returns (ReadBasis memory actual, RecordResult[] memory records);
```

Place shared structs in the existing point library if that avoids duplicate tuple definitions; expose the same external ABI. Current is for a contract reading current EVM state; checked is for explicit optimistic preconditions. Both keep all code/execution validation. No zero sentinel, validation-disable flag or external self-call.

- [ ] **Step 1: Write the contract falsifiers before implementation.** Matching current/checked/scalar tuples must agree, including order, duplicate IDs and scalar missing-record zero tuples. Write cases for zero and nine requests, each wrong expected-basis field, changed point/query library code, malformed eighth row and 8193-byte stored body. Existing single-fault scalar errors must survive; the batch must never return an apparently successful short prefix. Use existing test fixture/cheatcodes, not production mutation hooks.

```solidity
// Local test helper captures the actual context from the current fixture.
(ReadBasis memory observed, RecordResult[] memory rows) = core.getRecordsCurrent(ids);
(ReadBasis memory checked, RecordResult[] memory same) = core.getRecordsChecked(observed, ids);
assertEq(keccak256(abi.encode(observed, rows)), keccak256(abi.encode(checked, same)));
// Corrupt the eighth row with the existing test-only storage harness.
// Current/checked must reject rather than expose the seven earlier results.
```

Confirm intended RED, then implement the smallest loop. Arity is checked before result allocation; `_readBasis()` is obtained once; checked expectation is compared before any body reads/allocation. Verify `block.number` fits uint64 before narrowing. The shared internal reader consumes the captured basis and must not qualify again. The point library loop calls the unchanged `StatePointReads.getRecord` for each ID, with a defensive maximum-eight check at its allocation boundary too.

- [ ] **Step 2: Verify fixed bounds and existing semantics.** Maximum eight Records and the existing 8192-byte per-body pre-copy guard imply at most 65,536 body bytes. Eight maximal echoed-ID results plus four-field context encode to **67,264 ABI bytes**; controller independently encoded this shape with ethers. A JSON-RPC response with a short numeric ID is approximately **134,566 bytes**, under the current 262,144-byte response budget. Test actual serialization rather than assuming a bytes budget means decoded ABI bytes. Read-history work is zero; Lens work is zero. Duplicates count toward the eight-item bound.

Run focused Solidity tests, unchanged read/foundation regressions and normal build sizes. Confirm no writes, guard-before-data failure precedence and matching same-call results. Changing the point-library runtime changes linked Core codehash/configuration/execution identities: regenerate genuine fresh fixture manifests through existing deployment paths. No new constructor parameters, store slots, library roles or manifest schema are needed for this contract slice.

- [ ] **Step 3: Add an explicit qualified SDK method.** `scope.getRecords(ids)` sends `getRecordsChecked` with the already-qualified execution ID, revision, block number and admission high. It uses the existing transport queue, byte/request limits, source identity/epoch checks, canonical ABI round-trip check, cancellation and tracked `dataWork`; `seal()` waits for it. Decode and require exact count/order/echoed IDs and exact actual-basis equality before releasing any item. Return the basis and aligned results together with one real acquisition evidence ID and item indexes. Do not fabricate eight RPC evidence records. Existing scalar `scope.call` behavior and signature remain unchanged.

```javascript
// Public method contract; full values remain qualified together.
const result = await scope.getRecords(ids);
// Success: {status:'OK', basis, records:[{recordId,typeSchemaId,
// canonicalBody,firstAdmitOrdinal,evidenceIndex}], evidenceId}
// Failure: existing UNAVAILABLE vocabulary, no partial records.
const sealed = await scope.seal(); // mandatory before publishing a completed observation
```

Do not silently guess capability from an RPC revert or change the required baseline manifest inventory. The new method is explicitly experimental and can return UNAVAILABLE against an older deployment. Automatic Files adoption/fallback is a separate task. Tests cover wrong basis, reordered/truncated/extra/noncanonical replies, over-budget response, cancellation, source switch, and reorg before seal. Existing `assessRecord` remains responsible for independent exact body/ID/application checks; a batch RPC response is not proof of those checks.

- [ ] **Step 4: Measure useful workload differences.** Use identical fresh data and compare scalar RPC requests, a test-only external multicall of existing scalar APIs, and typed batching for 1/2/4/8 IDs. Include distinct, duplicate, missing, short and maximum legal bodies. Keep setup and actual consumer receipt gas separate from RPC execution estimates, response bytes, qualification/data/seal timing and logical-call count. A consumer of `getRecordsCurrent` must not preflight the context; compare like-for-like scalar reads in the same transaction so warm-access savings are not attributed to batching alone. Include a separate checked-path consumer or pinned eth_call measurement for SDK preconditions.

Retain full actual transactions/calldata/receipts, source/compiler/runtime/deployment pins and canonical block-basis results. Check exact values against scalar results and independently recomputed Record IDs. Use legitimate accepted maximum-size records where feasible; if a max-size fixture needs test-only storage injection, label that arm as a read stress test, not end-to-end legal admission proof. Capture failed receipts/limits. Do not claim directory RPC reduction from this standalone batch alone.

- [ ] **Step 5: Verify and hand off.** Run focused and affected complete C0/upgrade/reader tests serially, formatter checks and ordinary runtime/initcode sizes. Record test counts accurately; direct-apply branch retains its 15 explicitly excluded baseline-only journal tests. Verify owned finite nodes exit and caches are removed; old evidence/write sources stay unchanged. Self-review, commit exact owned paths and report RED/GREEN, exact metrics, API/error boundaries, deployment changes and limitations. Root verifies and commissions independent review before publication or another implementation.

## Follow-on directory hydration integration — not in this plan

This follow-on is **not dispatched by this plan yet**. Its deliverable is a measured real directory browse using the new acquisition rather than a standalone SDK demo. Use an explicit source/manifest capability, bounded per-page Record hydration and retained scalar compatibility. Preserve per-item assessment, all anchor/charter/Lens checks, unresolved rows, sealed-frontier continuation and honest COMPLETE/PARTIAL results. No automatic microtask batching or generic call scheduler is assumed. Once Task 1 evidence lands, define the smallest exact `files-reader.mjs` cache/prefetch seam and its failure semantics before implementation.

## Later, separate questions

Grouped Lens resolution may reuse a decoded plan, but a 64-entry plan across eight positions can examine 512 heads before combination/hydration. History also has per-entry dependent reads. Neither is bounded adequately by copying this eight-Record cap. Keep those budgets explicit in a later design. Raw-slot getters remain advanced unqualified access, not an everyday contract/SDK substitute for this checked API.
