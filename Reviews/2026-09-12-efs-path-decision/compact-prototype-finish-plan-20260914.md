# Compact prototype completion implementation plan

> **For agentic workers:** Use subagent-driven development for the bounded tasks below. The coordinator owns integration, local compiler/chain scheduling, review, and publication. Do not create another architecture arm or production repository.

**Goal:** Connect the selected compact B contracts to a usable static Files workflow and measure its real onchain costs, then state exactly what is safe to build next.

**Architecture:** Keep the current Ledger, separate mandatory IndexModule/FilesNamesIndex, exact Type rules and LensReader. A small browser-compatible adapter combines qualified reads and operation-specific atomic writes; a static screen uses that adapter directly over RPC. A separate application contract exercises the same retained Files data without a privileged offchain bridge.

**Tech stack:** Existing Solidity 0.8.30/Cancun/via-IR lab; ethers 6 already installed in the fuller prototype; native browser modules and Node tests; bounded local Anvil. No production package or framework selection.

**Spec:** [[sdk-explorer-build-boundary-20260914]] and [[morning-handoff-20260914]]. James's September 14 instruction authorizes finishing and testing this prototype with Astra High/Extra High workers and requests a concrete production plan afterward. Ordinary reversible implementation judgment is delegated; no permanent guarantee is waived.

## Global constraints

- Prototype source starts at `1829dad1b2172aea4931864c538429e030361c94` in the existing `planning-warroom-b-run` worktree; documentation/results are published on planning main. Do not move or merge the other prototype worktrees.
- Use Astra High or Extra High for scoped workers. No Fable/Opus dispatch, no cheap-model implementation, no dedicated production Dev task, no automatic overnight wakeups.
- One owned compiler/Anvil workload at a time, finite history and an explicit scratch/cache directory. Do not collect full storage traces or unbounded history.
- No public deployment or production repository creation. Local test keys are conspicuously disposable; no claimed real-wallet prompt result.
- Missing names/content, unsupported types, partial enumeration and conflicts never become complete-empty or verified data. Results carry their basis, coverage and provenance together.
- Writes journal the exact authorized plan before sending, use one atomic action batch, and reconcile its actual canonical effects. A receipt alone is insufficient. Never automatically re-sign after CAS/nonce/policy drift.
- No private name dictionary or hosted data API. The static artifact has configuration/ABIs/code but no authoritative directory/file contents. The adapter reads retained Name records.
- The initial explicit folder ID is mounted as `/`; do not claim that its hash establishes nested ancestry. Current name grammar and 8192-byte body limit are disposable profile boundaries, not final user requirements.
- Signed portability, native historical authorship, source-state proof and destination authority remain distinct. No transcript is called a state proof.

## Task 1: Browser-compatible compact Files adapter

**Files:** create `lab-b/browser/compact-sdk.mjs` and `lab-b/browser/compact-sdk.test.mjs`. Do not modify Solidity or the earlier prototype. These paths are under `Reviews/2026-09-12-efs-path-decision/` in the code worktree.

**Interfaces:** export `createCompactSdk({ethers, rpc, manifest, journal})`. `rpc(method, params)` returns a raw JSON-RPC result; `manifest` includes actual addresses, ABIs, exact Type IDs, required rule hashes, mounted folder and named author addresses, never names or file contents. `journal` supplies async `put(entry)` and `get(id)`. The returned API offers `pin()`, `listFolder({folder, authors, budget, context})`, `readFile({file, authors, concept, context})`, `readName({position, folder, role, context})`, `prepare({operation, author, ...arguments})`, `authorize(plan, signDigest)`, `submit(signedPlan, sendTransaction)`, `reconcile(journalId)`; agree any clearer compatible signature with the coordinator before the browser task.

**Read result:** a structured object with `basis` (chain ID/block hash/admission/generation/epoch/core/Lens), `knowledge`, `coverage`, `value`, and optional `continuation`. File results preserve selection author, HEAD revision/admission, exact content/revision identity and exact tag subjects. Complete folder traversal starts at zero and is owned by the adapter; an arbitrary terminal cursor cannot certify an empty folder. All reads use one block-hash context and fail closed on code/index/profile mismatch. Unknown names preserve member rows.

**Writes:** create, edit, rename/move, remove placement, restore placement, restore historical contents as a fresh revision, add/remove File or selected-revision tag. Follow current contract action semantics and CAS. Root revisions carry File ID then document; child revisions carry parent Record ID, File ID then document. Filename bytes are published as ordinary required Name records, reused without republishing where already retained.

- [x] Write failure controls first: missing/corrupt Name, mixed block/index context, forged terminal cursor, hidden lower-author fallback, File-versus-revision tags, response loss after submission, stale CAS, mismatched read-back, and an oversized document.
- [x] Implement the smallest adapter using actual contract ABIs. Example test obligation:
  ```js
  const result = await sdk.listFolder({folder, authors, budget: 1, context});
  assert.equal(result.coverage, 'PARTIAL');
  assert.equal(result.value[0].name.knowledge, 'UNKNOWN');
  assert.equal(result.value[0].file, expectedFile);
  ```
  Test inputs must be independent fixtures; pure negative tests may substitute RPC responses, but real deployment integration in Task 2 is mandatory.
- [x] Run `node --test browser/compact-sdk.test.mjs`; retain the expected RED and final result in the task report. Include exact imports/runtime requirements and API examples for Task 2.
- [x] Commit only owned code/test files with the repository trailers; return the bounded report. Coordinator obtains independent spec/quality review before integration.

## Task 2: Static Files screen, owned deployment and real journey

**Files:** create `lab-b/browser/{index.html,app.mjs,files.css}`, `lab-b/script/compact-browser.mjs`, and `lab-b/browser/integration.test.mjs`. Consume Task 1's final API, not a second implementation of Ledger semantics. The runner uses existing artifacts and installed ethers, binds loopback only, owns its Anvil lifecycle, and serves static files. A static export contains no test keys; an explicit local demo mode may provide disposable signers separately. Do not ship a dynamic `/api/files`.

- [x] Write a real-chain integration test that fails before the adapter/deployment is connected: cold name/body recovery, Alice/Bob selection, edit, rename, move between explicit mounted folders, reused old name, remove, restore, exact-subject tags, pinned historical read and fresh reload.
- [x] Deploy actual Name/Files rules, NamesIndex, Lens and consumer under normal size/gas limits; verify code/Type pins. Seed only through real Ledger admission. Mount explicit root and second folder IDs with no hierarchy claim.
- [x] Implement the static screen: guest read, explicit disposable signer switch, folder/Lens selection, names/content, lifecycle actions, File-versus-revision tag choice, honest partial/conflict/unavailable UI, and download only verified content. The floating cost drawer displays actual receipt gas, action history, RPC work, and clearly labelled editable per-chain estimates if a current sourced snapshot is available; never mix local ETH spending with mainnet/L2 quote models.
- [x] Run the real journey and a fresh browser context, inspect visually, and retain compact JSON results plus source/artifact/runtime pins. Missing/corrupt Name and unsupported content cases preserve known membership in both the adapter tests and screen behavior.
- [x] Commit the tested increment; record URL/start/stop instructions and distinguish automated from manual UI evidence.

## Task 3: Third-party contract application, not just a logging wrapper

**Files:** create `lab-b/test/FilesApplication.sol` and `lab-b/test/FilesApplication.t.sol`; use the existing `FilesJoinedConsumer`, `FilesNamesIndex`, `Ledger.execute` and `LensReader` without privileged ingress or modifying the kernel.

**Interface:** an authorized application caller supplies a File ID, expected selected parent and expected application HEAD revision; the application checks a selected source revision and writes a new app-authored child plus HEAD in one native Ledger batch. The app retains a decision/counter only if the whole operation succeeds. Its Lens is fixed/configured explicitly, not silently caller-escalated. Helpers preserve the app's own `msg.sender` authorship at Ledger.

- [x] Test unauthorized invocation, changed expected source, foreign parent, bad document, stale app CAS, and required-index failure with unchanged application and Ledger effects; then implement the smallest real app.
- [x] Test success through an unrelated external caller and independently read the new child, HEAD, principal and evidence grade. Retain source selection provenance separately from app-authored output.
- [x] Add actual receipt rows for this whole application call to the owned runner; compare with paid read and native/signed direct update, separating app-specific work rather than claiming a universal minimum.
- [x] Review and commit. Native cross-chain historical authorship remains explicitly unsupported unless independently proven; do not fake a signature to close the gate.

## Task 4: Measured limits and one build plan

**Files:** extend the owned runner/tests only as needed; publish `compact-prototype-results-20260914.md` and `compact-mvp-build-plan-20260914.md` on planning main.

- [x] Measure named create/edit/tag/rename/move/remove/restore, deployment separately, data sizes through 4 KiB and the current bound, paid third-party application calls, and RPC cost for bounded listing with 1/8/32/64 authors where supported.
- [x] Measure live versus lifetime-name churn without raising limits or fabricating COMPLETE. Use actual contract calls; the existing 13-test live-placement model is only a reference, not an onchain result. If ordinary churn is a blocker, implement and test the smallest separate live-candidate index before calling the browser scalable, pricing its writes and preserving masks/history. Otherwise record precise bounds and a falsifiable production gate.
- [x] Run full Solidity and adapter/integration regression suites on the final source; verify normal runtime sizes and artifact pins. Obtain a targeted independent final review of changed code and claims, fix material findings, and re-run affected checks.
- [x] Publish a short requirements ledger with DEMONSTRATED / LIMITED / UNSUPPORTED / UNTESTED, exact named-action cost table, and a concrete repository/module/test sequence. Specifically cover type compatibility, arbitrary mandatory acceptance, retained signed portability, native-source proof, identity recovery/delegation, populated upgrades, privacy/carrier failure and scale. Unchanged historical evidence is labelled, not rerun indiscriminately.
- [x] Return one recommendation and only decisions James actually must make. No implementation-ready claim for an unresolved load-bearing foundation defect.

## Progress and review

**September 14 outcome:** the bounded tasks are complete at prototype source
`67f92c5`:217 Solidity executions /41 Node tests pass; actual cold browser
lifecycle, unrelated contract app and matched audit/live receipt runs are
retained. See [[compact-prototype-results-20260914|results and honest limits]]
and [[compact-mvp-build-plan-20260914|the concrete build plan]]. The completed
checklist below each task records its acceptance contract, not an instruction
to rerun completed work. Standalone key-free packaging, nested directories,
large live queries, native source proof and populated compact upgrades are
explicitly not claimed. The final build plan carries the remaining foundation gates.

The private per-plan execution ledger records source checkpoints, red/green tests, active worker ownership, provisional engineering choices and review fixes. Results and followups are published here on main. This plan is a disposable implementation pass, not protocol promotion.
