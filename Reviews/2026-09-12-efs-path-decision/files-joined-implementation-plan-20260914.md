# Joined FileRevision experiment implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Root owns compilation, measurement, review and exact-path publication. This executes James's existing overnight disposable-prototype mandate, not a production API decision.

**Goal:** demonstrate real checked file parentage and head-first revision tags on compact B's existing kernel.

**Architecture:** Root and Child revision Types carry arbitrary document bytes and a stable File Subject. Mandatory rules enforce same-File parents through bounded reads. A separate required index retains exact parent backlinks; an unrelated consumer composes current Lens selection with explicitly qualified tag reads.

**Tech Stack:** Solidity 0.8.30, viaIR, optimizer 200, Cancun; installed Forge, no new dependencies. Existing isolated `planning-warroom-b-run`, lab path `Reviews/2026-09-12-efs-path-decision/lab-b/`.

**Spec:** [[files-next-joined-gate-20260914]] and [[files-journey]]. This plan implements only the real parentage/selection slice, not the entire Files journey. Source-only preflight found the existing APIs sufficient with the explicit qualifications below.

## Global constraints

- Disposable test profile only. No Ledger, Keys, Registry, IndexModule, LensReader, LabBase, archive, existing diagnostic, SDK, production repository, migration or protocol change.
- Existing Ledger SHA256 `7576874b52a81ebc0f7b64640332b345096e0c09000ed4f09811bdc21dd6c3d5`; body maximum 8,192 bytes and mandatory-rule gas 300,000 remain unchanged.
- Root body = File ID word 0 plus arbitrary bytes; Child = parent Record ID word 0, File ID word 1, arbitrary bytes. Root minimum 32, Child minimum 64. Both File IDs must be nonzero, existing Subjects. Child descriptor has exactly one checked reference `[bytes32(0)]`; the mandatory rule narrows parent Type to pinned Root or the incoming Child Type, and enforces same File.
- Storage-layout helper is test-only and coupled to the pinned Ledger: record mapping slot 2, meta at base+1; body-word mapping slot 3. `first = uint64(meta & ((uint256(1)<<48)-1))`; `length = uint32(meta >> 48)`. Never infer length from unmasked meta or read the entire parent to validate its header.
- Alice is `eoaA`/PK_A through genuine `executeSigned`; Bob is `address(bob)` through genuine `Actor.execute`. No forged contract signature or helper that substitutes its own authorship. Historical native source proof remains unsupported.
- Exact root/child shapes, descriptors, rule codehashes and Child's configured Root Type must be checked by the Files profile. A length check is not proof of a profile. Callbacks remain mandatory and atomic; retained membership is not current validity.
- COMPLETE parent-family coverage means the exact pinned module's declared family is gap-free, from admission 1 through the current basis, plus exhaustion of a parent's count-bounded list. Generic `coverage` ignores its scope argument; never claim independently maintained per-parent coverage.
- All point/tag/folder composition occurs at current state in one EVM call with supplied frontier, rule epoch, index generation and Core commitment checked. PARTIAL, UNKNOWN, stale basis and conflict do not become empty success.
- Root one-heavy-slot only, finite watchdog, installed/pinned toolchain, private caches; 50 GiB free reserve and 15 GiB aggregate scratch. No worker compiler, Anvil, RPC or subagent launch. Stop before September 14 14:00 UTC / 09:00 Chicago.
- Each task hands a compiling stub plus unchanged executable assertions to root for real behavioral RED before implementation. Compilation errors are not RED. Root commits only exact task files after GREEN and reviews; designs/reports stay on main. Previously passing measurements are not repeated without a source/semantic reason.

## File responsibilities and shared fixture

`test/FilesJoinedProfile.sol`: pinned raw header helper, mandatory Root/Child acceptors and exact Files-parent index. `test/FilesJoined.t.sol`: integration fixture and assertions, extending existing LabBase. Task 2 adds `test/FilesJoinedConsumer.sol` for unrelated qualified reads. Three files keep acceptance/indexing, test orchestration and consuming behavior separate.

Fixture: `R0=Root(F,"Meeting at 10:00.\n")`; `RA=Child(R0,F,"Meeting at 11:00.\n")`; `RB=Child(R0,F,"Meeting at 09:00.\n")`; `RR=Child(RA,F,"Meeting at 10:00.\n")`. Derive exact IDs with `Keys.recordFromHash(typeId,keccak256(fullBody))`. RR differs from R0 despite equal document bytes.

### Task 1: Checked revisions and required parent backlinks

**Files:** create `test/FilesJoinedProfile.sol` and `test/FilesJoined.t.sol` only.

**Interfaces:** existing `IAcceptor.accept(bytes32,bytes,bytes32[])`, `IndexModule.onAdmission(uint64,Effect[])`, `Ledger.executeSigned`, `Actor.execute`, and LabBase action/signing helpers. Produce `FilesRootRule`, `FilesChildRule(rootType)`, `FilesParentIndex`, and `FilesJoinedTest`. Test fixture exposes internal `rootType`, `childType`, `file`, `r0`, `ra`, `rb`, `rr`, `filesIndex`, and `_rootBody`, `_childBody`, `_createRoot`, `_publishBranches`, `_publishGrandchild` helpers for Task 2. Root has no refs; Child has one wildcard checked ref. Register Root, deploy Child rule configured with Root, then register Child. No circular Type-ID constructor argument.

- [ ] Add exact profile derivation/setup and compiling false Child-rule stub. Root's real rule checks Subject existence and shape. Add acceptance, parent-reference and negative tests; request a focused behavioral RED on the first valid Child. No Child implementation until observed RED.

Core encodings and identity assertions must use these actual operations:

```solidity
bytes memory rootBody = bytes.concat(abi.encode(file), bytes("Meeting at 10:00.\n"));
bytes memory childBody = bytes.concat(abi.encode(r0, file), bytes("Meeting at 11:00.\n"));
require(r0 == Keys.recordFromHash(rootType, keccak256(rootBody)), "root identity");
require(ra == Keys.recordFromHash(childType, keccak256(childBody)), "child identity");
```

- [ ] Implement only the bounded Child rule. It uses the admitting Ledger (`msg.sender`), proves current File Subject existence, exact matching checked parent ID, and reads parent Type/length/one File word. Root parent requires length >=32 and word0=file; same incoming Child Type requires >=64 and word1=file. Missing parent must fail Core reference existence; unrelated registered Type and Root/Child of another real File must fail required acceptance. Request targeted GREEN. Include a real existing Subject and large cold parent control if the existing diagnostic cannot cover a concrete changed predicate; do not repeat it merely for test count.
- [ ] Add a no-append Files-parent index stub and require exact backlink sets `R0->{RA,RB}` and `RA->{RR}`; root observes the empty-set RED before append implementation. Then inherit `super.onAdmission`, inspect only Child PUBLISH/REUSE, check exact Type, length >=64, nonzero first admission <= effect.admission, and append only when first==effect.admission. Use `Keys.referenceList(childType,0,parent)` and `_append(key,first,true)`. Reuse/republication must not add duplicate retained members.
- [ ] Pin both descriptors, shapes, mandatory codehashes, exact Child ref vector and Child rule's Root configuration in module construction. Declare `FAMILY_FILES_PARENT = keccak256("efs2/family/files-parent/1")` mandatory at attachment. Install before admission1; **replace both fixture `index` and `lens = new LensReader(ledger,filesIndex)`** because the old Lens keeps its immutable old index. Replacing the kernel's index alone is insufficient.
- [ ] Force the first Child callback to revert in an immutable fault subclass using `E_FORCED_CHILD()`. On a fresh correctly wired Ledger/module, assert the wrapped `E_INDEX(abi.encodeWithSelector(E_FORCED_CHILD.selector))`, absent candidate Record and unchanged nonce, four counts, current head, inherited postings and parent postings. Failed writes cannot leave either index half committed. Root validates full GREEN and normal size outputs, then stages only these two files for task review.

Minimum tests: `test_revision_acceptance_history_and_parent_backlinks`, `test_missing_unrelated_and_wrong_file_parents_roll_back`, `test_required_parent_callback_failure_rolls_back`, and `test_reuse_does_not_duplicate_parent_membership`. Each negative has a real successful control; snapshot comparisons identify precisely what was checked rather than claim all storage equality.

Alice's signed creation orders CREATE before R0 publication, HEAD binding, placement `/drafts/note.txt`, File tag `project_efs(F)` and revision tag `draft(R0)`. Tags use concept hashes as roles, an already-existing File F as the legal positive BIND target, and a hit means FOUND with target==F. Alice publishes/binds RA with CAS and asserts `approved(RA)`; Bob natively publishes/binds RB. Alice later publishes/binds RR. Assert evidence category and actual author for both accounts. `historyByRole` returns a single as-of result (`H_FOUND=2`), so compare sealed pre/post frontiers; it is not a history array. Parent postings prove parentage independently of this binding history.

### Task 2: Qualified head-first revision tags and one folder window

**Files:** create `test/FilesJoinedConsumer.sol`; modify `test/FilesJoined.t.sol` only. Consume Task1 profile/fixture without changing its validation/index semantics.

**Interfaces:** `FilesJoinedConsumer` constructor pins `Ledger`, `LensReader`, `FilesParentIndex`, Root/Child Types and profile hashes. `Basis` contains `uint64 admission`, `uint64 generation`, `uint64 epoch`, `bytes32 core`. `readFilePoint(bytes32 file,address[] lens,bytes32 concept,Basis basis)` returns a typed result containing point status, selected Record/Type/parent, File ID, document bytes/hash and separate File-tag/revision-tag hit fields. `readFileConflict` uses `resolveNoTiebreak` and decodes every returned candidate. `readFolderTaggedOnce(bytes32 folder,address[] lens,bytes32 concept,bool revisionTag,uint256 budget,Basis basis)` returns selected verified file results only after complete/end/context checks. It never returns an unqualified empty array for an incomplete source. Use `E_BASIS`, `E_INCOMPLETE` and `E_PROFILE` rather than silently skipping defects.

- [ ] Add compiling consumer stub and behavioral tests. First demonstrate a failing expected result from applying `approved` to File F instead of the selected revision; root observes RED before the corrected read order. Tests require L-A `[eoaA,address(bob)]` selects RA with File tag yes and approved yes, L-B reversed selects RB with File tag yes and approved no; no-tiebreak yields CONFLICT with both exact candidates retained. After RR, Alice-first keeps the File tag but no longer inherits approved(RA).
- [ ] Implement current-basis guard and exact Record/body/Type/ID/File/parent decoding, then tag resolution **after** HEAD selection. Required order:

```solidity
(uint8 status, bytes32 selected,,,) = lensReader.resolve(authors, HEAD, file, bytes32(0));
// Preserve ABSENT/MASKED/CONFLICT, and decode only a FOUND exact profile Record.
(uint8 fileTag, bytes32 fileTarget,,,) = lensReader.resolve(authors, TAG, file, concept);
(uint8 revisionTag, bytes32 revisionTarget,,,) = lensReader.resolve(authors, TAG, selected, concept);
// A positive hit requires FOUND and target == file, never mere nonzero state.
```

Use constants matching LabBase's HEAD/FOLDER/TAG domains. Point `resolve` has no historical parameter: reject any supplied admission not equal to current counts. Require exact active index, immutable Lens/index agreement, epoch, generation and Core commitment. Current inline byte reads may cost more than bounded validators; do not label this as a gas optimization.

- [ ] Implement the separate one-window folder join using an all-zero fresh cursor. Require COMPLETE, !mutated, `next.lensIndex==authors.length`, `next.rawIndex==0`, exact next basis/generation/epoch/Core/lensHash/scopeKey, and scope-family coverage from1 through current admission. `scopeKey=keccak256(abi.encode(FOLDER,folder))`. Resolve each selected File HEAD before applying the requested tag tier. In the one-entry fixture, project_efs returns F under both ordered lenses; approved returns F only under Alice-first before RR. A zero-budget nonempty folder is PARTIAL and must fail `E_INCOMPLETE`, not appear empty. A stale basis and detached/replaced index fail closed. Parent lookup requires ordinal<count and nonzero valid admission; zero default posting is not a child.
- [ ] Root observes targeted GREEN, complete B suite and normal runtime/init sizes. Retain source hashes, full logs, semantic limits and any newly actionable failures. Review and publish exact paths. Paid read/write pricing is a separately bounded follow-up only if it can compare useful work at an explicit source pin; Forge test gas is not an ordinary transaction receipt.

Minimum tests: `test_point_selection_applies_revision_tag_after_head`, `test_conflict_preserves_both_exact_revisions`, `test_complete_one_page_folder_tag_join_is_not_point_evidence`, `test_partial_stale_and_wrong_index_reads_fail_closed`. Existing Task1 tests must remain passing without changing their executable assertions to accommodate the reader.

## Completion and exclusions

This earns local checked revision chains, retained parent discovery, signed/native authorship separation, competing current selection, explicit tag tiers and one exhausted folder window. It does not earn global tag discovery, arbitrary churn, multi-page cross-transaction coherence, native portable proof, cold filename reconstruction, move/reused-path/whiteout integration, a working browser, or production readiness. Those broader existing journey gates stay open, with their next discriminating test named rather than silently waived.
