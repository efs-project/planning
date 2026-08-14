# EFS v2 Core and Files Contracts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task by task.

**Goal:** Build a disposable, exact, independently reconstructible EFS v2 Core
and Files/1 contract slice without modifying or relabeling the deployed v1
contracts.

**Architecture:** Create a new sibling repository, provisionally named
`core/`. Begin with one state-owning Core contract assembled from internal
libraries, plus separately deployed `FilesRouter` and ERC-5219 compatibility
adapter. The logical module boundaries are fixed; the physical Core split is a
measured gate because the partial Stage B monolith left only 4,707 runtime bytes
while still omitting important mechanisms. No production deployment, Type ID,
or adopted-conformance claim occurs in this plan. Every output remains an
experimental candidate until the separate V2-F1/F2 owner promotion ceremony.

**Tech Stack:** Foundry, Solidity 0.8.34 (or the stable compiler explicitly
re-pinned at execution), Bun/TypeScript, Rust stable, Anvil, viem.

## Global Constraints

- Governing draft: `Designs/efsv2/hierarchical-files-and-folders.md`.
- Preserve `../contracts/` as deployed-v1 evidence. Do not copy EAS schemas,
  UIDs, storage, or privileged PIN/TAG/PATH kinds into v2.
- Use `EXPERIMENT_ONLY` and `protocolConformance=false` throughout this plan.
  Keep `protocolConformance=false` even after every exact corpus gate; this
  plan cannot self-promote the protocol. Synthetic Realm/Profile roots remain
  conspicuously labeled.
- No permanent Files bytes before V2-E1 closes and one Unicode pin is shared by
  MC/1 and Files.
- All writes are multi-leaf atomic, state-only reconstructible, and tested for
  retry, rollback, stale CAS, direct-submit bypass, and ordinal exhaustion.
- Run `forge test`, `bun test`, `cargo test`, `git diff --check`, runtime-size,
  and retained-corpus hash verification before each review checkpoint.

---

## Task 1: Initialize the new Core repository

**Files:**

- Create: `../core/AGENTS.md`
- Create: `../core/README.md`
- Create: `../core/foundry.toml`
- Create: `../core/remappings.txt`
- Create: `../core/package.json`
- Create: `../core/tsconfig.json`
- Create: `../core/rust/Cargo.toml`
- Create: `../core/rust/src/lib.rs`
- Create: `../core/.github/workflows/ci.yml`
- Create: `../core/src/BuildInfo.sol`
- Test: `../core/test/BuildInfo.t.sol`

1. Confirm the local/GitHub repository name `efs-project/core`; if renamed,
   update this plan before initialization.
2. Initialize a clean Git repository without importing v1 history or generated
   experiment artifacts.
3. Write a failing `BuildInfo.t.sol` asserting the experimental conformance
   flag is false and the corpus hash cannot be zero.
4. Run `forge test --match-contract BuildInfoTest`; verify RED.
5. Implement immutable build metadata: compiler/profile/corpus hashes and
   `protocolConformance=false`.
6. Add Bun and Rust no-op test harnesses plus CI jobs for Solidity, TS, Rust,
   formatting, corpus hashes, and runtime size.
7. Run the whole empty scaffold; verify GREEN.
8. Commit: `chore: initialize the EFS v2 Core laboratory`.

## Task 2: Mint and independently verify the exact candidate corpus

**Files:**

- Create: `../core/corpus/EXPERIMENT_LOCK.json`
- Create: `../core/corpus/domains.json`
- Create: `../core/corpus/types/*.bin`
- Create: `../core/corpus/vectors/ids.json`
- Create: `../core/corpus/vectors/files.json`
- Create: `../core/corpus/manifest.json`
- Create: `../core/src/libraries/EfsIds.sol`
- Create: `../core/src/ts/ids.ts`
- Create: `../core/rust/src/ids.rs`
- Create: `../core/scripts/check-corpus.ts`
- Test: `../core/test/EfsIds.t.sol`
- Test: `../core/test/ts/ids.test.ts`
- Test: `../core/rust/tests/ids.rs`

1. Add failing vectors for every domain, TypeSchemaGroup member/order, Record,
   Principal, Envelope, Occurrence, Binding, Realm, revision, cursor, Files
   view/finality/profile-validation/result grade, operation/receipt boundary,
   transcript, host alias/root placement, property key, retrieval disclosure,
   `FILES_MEDIA_HINTS_V1`, and projection formula.
2. Run all three language suites; verify they fail on missing literals.
3. Mint bytes independently in TS and Rust; use `cast`/deployed Solidity only as
   the third comparison, never as the oracle for both.
4. Hash every source input, generated vector, tool version, and retained compare
   transcript into `corpus/manifest.json`.
5. Reject missing/extra domains, unknown fields, noncanonical lengths, stale
   manifests, and any nonzero conformance flag throughout this experimental
   plan.
6. Run `bun run corpus:check`, `forge test --match-contract EfsIdsTest`, and
   `cargo test ids`; retain one cross-language equality transcript.
7. Commit: `feat: add cross-language EFS v2 candidate vectors`.

## Task 3: Implement Principal authority and Realm bootstrap

**Files:**

- Create: `../core/src/interfaces/IEFSCore.sol`
- Create: `../core/src/types/EfsTypes.sol`
- Create: `../core/src/libraries/PrincipalCodec.sol`
- Create: `../core/src/libraries/AuthorityVerifier.sol`
- Create: `../core/src/libraries/RealmState.sol`
- Create: `../core/src/EFSCore.sol`
- Test: `../core/test/PrincipalAuthority.t.sol`
- Test: `../core/test/RealmBootstrap.t.sol`

1. Write failing EOA, EIP-7702, ERC-1271 historical-basis, invalid-v, high-s,
   empty-code, gas-cap, upgrade-authority, and u48-exhaustion tests.
2. Implement exact packed Principal bytes and the V2-E1-selected uniform
   Principal surface. Do not constructor-seed application Types.
3. Implement Realm genesis/revision/authority-transition state and public
   enumeration reads, including exact codehash/basis facts.
4. Verify current authority is never substituted for a recorded historical
   acceptance fact.
5. Run focused tests plus a clean-process state reader.
6. Commit: `feat: implement principal authority and realm bootstrap`.

## Task 4: Implement the generic TypeSchema and Record engine

**Files:**

- Create: `../core/src/libraries/TypeSchemaCodec.sol`
- Create: `../core/src/libraries/RecordCodec.sol`
- Create: `../core/src/libraries/TypeRegistry.sol`
- Create: `../core/src/interfaces/ITypeRecordReader.sol`
- Test: `../core/test/TypeSchemaGroup.t.sol`
- Test: `../core/test/RecordCodec.t.sol`

1. Write RED tests for the intrinsic `TypeSchemaGroup/1` bootstrap, canonical
   MC/1 decoding, group member order/materialization, SELF and GROUP_REF
   resolution, staged earlier-leaf schema use, exact field/constraint grammar,
   bounded selector/reference/index extraction, and malformed-body rejection.
2. Implement the generic Type/Record cache and public enumeration reads. Every
   member materialized by one group receives exact metadata and ordinal state,
   including members not yet used by an application Record.
3. Enforce whole-body/reference/selector/constraint budgets before persistence;
   derive Record IDs from canonical schema/body bytes only.
4. Add a source/ABI/bytecode boundary test proving state-owning `EFSCore`
   contains no Files Type IDs, Files result codes, application validation
   selector, or profile dispatch branch.
5. Run focused Solidity tests plus independent TS/Rust parsing of the retained
   Type/Record corpus.
6. Commit: `feat: implement generic EFS type and record semantics`.

## Task 5: Implement multi-leaf admission and routed consent

**Files:**

- Create: `../core/src/libraries/EnvelopeCodec.sol`
- Create: `../core/src/libraries/Admission.sol`
- Create: `../core/src/libraries/ShadowState.sol`
- Create: `../core/src/interfaces/IAdmission.sol`
- Test: `../core/test/Admission.t.sol`
- Test: `../core/test/RoutedAdmissionIntent.t.sol`
- Test: `../core/test/AdmissionShadow.t.sol`

1. Write RED tests for masks `k=1..64`, whole-wire/body bounds, ordered
   expected revisions, retry after expiry, nonce lanes, target commitments,
   bind-then-withdraw, same-key sequential effects, and rollback.
2. Add routed-consent tests: intents require exact executor, Core-checked
   runtime code hash, and a nonzero state-readable generic operation Record;
   direct
   Core submit, wrong executor/code, proxy dispatch, mixed intent forms,
   omitted intent, and changed operation reference fail before SSTORE.
3. Version the one `publish` ABI with the exact closed consent-kind
   discriminator. Prove implicit, AdmissionIntent/1, and
   RoutedAdmissionIntent/1 payloads cannot be cross-decoded or magic-prefix
   guessed.
4. Consume only the Task 4 generic Type/Record engine. Implement authenticated
   decode, ascending deterministic shadow preflight, prospective ordinals,
   frozen journal, and identical-order assert-only commit.
5. Persist/export exact `RoutedConsentMetaV1` per accepting batch. Before the
   all-ACTIVE shortcut, require an identical operation association and reject
   unrouted/differently routed existing occurrences without writes.
6. Export batch, receipt, nonce-lane, Envelope, and admission-log enumeration.
7. Run `forge test --match-path 'test/*Admission*.t.sol' -vvvv` and retain cold
   Anvil transaction/trace rows.
8. Commit: `feat: implement atomic admission and operation-bound consent`.

## Task 6: Implement Binding, indexes, and complete Binding scopes

**Files:**

- Create: `../core/src/libraries/Binding.sol`
- Create: `../core/src/libraries/PackedPostings.sol`
- Create: `../core/src/libraries/IndexCodec.sol`
- Create: `../core/src/interfaces/IBindingReader.sol`
- Create: `../core/src/interfaces/IIndexReader.sol`
- Test: `../core/test/Binding.t.sol`
- Test: `../core/test/Indexes.t.sol`
- Test: `../core/test/BindingScope.t.sol`

1. Write RED tests for first bind/rebind/tombstone, no resurrection, exact raw
   slots, full target tuple, CAS, history, withdrawal overlay, and reconstruction.
2. Write RED BindingScope tests: exactly one first-mutation anchor per key;
   first tombstone; withdrawn source; historical basis; hostile 10,240-dead +
   63-live pagination; cursor Realm/basis/scope rejection.
3. Implement the closed Index Codex including canonical cursor grammar and
   `KIND_BINDING_SCOPE` as genesis-active RAW_AUDIT.
4. Verify all state changes are already represented in Admission's shadow
   journal and no library accepts unauthenticated evidence bytes.
5. Re-run 64-leaf and isolated Git P6 fixtures with the added scope posting.
6. Commit: `feat: add bindings, canonical indexes, and scope enumeration`.

## Task 7: Implement bounded Lens point resolution

**Files:**

- Create: `../core/src/libraries/Lens.sol`
- Create: `../core/src/interfaces/ILensReader.sol`
- Test: `../core/test/Lens.t.sol`

1. Write RED Plan `1/8/32/64` tests for priority/agreement combiners, complete
   `ResolvedTarget`, absence, conflict, unknown, tombstone fallthrough,
   malformed selected target, wrong purpose/scope, basis, and challenge window.
2. Implement point-only Lens evaluation; keep path traversal, wide listing,
   sorting, and locator ranking outside Core.
3. Ensure a higher-tier malformed/unknown candidate never falls through.
4. Run focused tests and cold gas rows for `1/8/32/64`.
5. Commit: `feat: implement bounded basis-qualified lens reads`.

## Task 8: Implement content and Files application profiles

**Files:**

- Create: `../core/src/readers/ContentProfileReader.sol`
- Create: `../core/src/readers/FilesProfileReader.sol`
- Create: `../core/src/interfaces/IFilesPointReader.sol`
- Test: `../core/test/ContentProfile.t.sol`
- Test: `../core/test/FilesProfile.t.sol`

1. Write RED exact-Type tests for ObjectGenesis, publisher charter,
   DirectoryEntry/Whiteout, FileRevision, MountDescriptor/configs, RouteConfig,
   FilesOperation frame, FilesPropertyProfile representative families,
   ResolutionPlan purpose/scope, `FILES_MEDIA_HINTS_V1`, profile-validation
   grades, ChunkTree empty/nonempty, and RECORD leaf-zero target constraints.
2. Include Route freshness policy and ExternalLink exact EIP-155 ChainRef/Core/
   Realm/Route validation; non-EIP-155 `/1` links reject.
3. Use Task 4 for generic MC/1/Record validation. Implement Content/Files
   checks only in stateless read helpers and the immutable Router/adapter layer;
   state-owning `EFSCore` may not import, dispatch to, or embed these application
   Type IDs. Return `EXACT_BYTES_ONLY` where Solidity cannot prove the full
   profile. Prove the first Router arm fully validates
   `FILES_ROUTER_ASCII_NAME_V1` and returns
   `UNSUPPORTED(PROFILE_VALIDATION)` for rich
   names until a measured immutable validator can prove the pinned Unicode
   profile.
4. Test empty bytes through Locator, representation/observation, range reader,
   reconstruction, and file-head selection.
5. Measure worst legal bodies/references and fail the corpus build if any Type
   exceeds the pinned Core budgets.
6. Commit: `feat: add generic content and Files candidate profiles`.

## Task 9: Implement the FilesRouter and web3 compatibility adapter

**Files:**

- Create: `../core/src/FilesRouter.sol`
- Create: `../core/src/ERC5219FilesAdapter.sol`
- Create: `../core/src/interfaces/IFilesRouter.sol`
- Create: `../core/src/interfaces/IERC5219.sol`
- Test: `../core/test/FilesRouter.t.sol`
- Test: `../core/test/ERC5219FilesAdapter.t.sol`

1. Write RED Router tests for the exact 6,776-byte worst-case operation frame,
   canonical Record/hash, exact ordered intent set, runtime codehash,
   basis-free dependency commitments over whole-Plan preconditions and
   postconditions (with a separate historical preflight FilesView), copied call, direct submit,
   omission/reordering/substitution, split/front-run, reentrancy,
   expiry/nonce/CAS, profile-validation-tier mismatch, rich-name unsupported
   behavior, ASCII full-profile certification, and zero-state rollback.
2. Implement one immutable non-proxy Router call that loads the exact operation
   Record and alone validates it as `FilesOperation/1`, preflights and executes every routed intent, verifies the committed
   postcondition, and appends the exact immutable/enumerable
   `FilesOperationReceiptBytesV1`. Prove completed retry returns the same
   receipt and a clean reader joins it to every Core batch consent association.
   Persist exact pre/post admission highs; require disjoint leaves, one fresh
   consecutive batch per intent, contiguous ranges, and boundary-state
   condition recomputation at the exact recorded validation grade. Persist the
   closed `FILES_PRECONDITION_CERTIFIED` receipt grade and require its aggregate
   profile grade be `FILES_PROFILE_VALIDATED`. Reject every
   external-view-leg write. Emit `FILES_PRECONDITION_CERTIFIED` only when every
   relevant component is `FILES_PROFILE_VALIDATED`; structural-only state may
   not receive that label.
3. Write RED adapter vectors for canonical percent encoding, decoded-resource
   rejection, trailing-directory presentation, exact control query, text body,
   external-body, resource limits, and caller-independence.
4. Implement the Final ERC-5219 ABI and status codes; label the ERC-6944 bridge
   draft and keep arbitrary binary/range on the EFS-native ABI.
5. Commit: `feat: add certified Files operations and web3 compatibility`.

## Task 10: Prove one complete Files vertical and state-only reconstruction

**Files:**

- Create: `../core/test/FilesVertical.t.sol`
- Create: `../core/scripts/write-files-fixture.ts`
- Create: `../core/scripts/read-files-state.ts`
- Create: `../core/scripts/compare-files-state.ts`
- Create: `../core/artifacts/files-vertical/manifest.json`
- Create: `../core/reports/files-vertical.md`

1. Publish root/directory/subdirectory/file, exact bytes, two Locators, charter,
   name/head Bindings, Mount/Plans/Route, rename/edit/unlink, and scope pages.
2. Resolve `web3://efs.eth/myfolder/mysubfolder/myfile.jpg` at one exact block;
   corrupt the primary carrier, verify fallback, and serve a verified range.
3. Start a separate reader with only RPC, chain, addresses, public ABI, and
   exact byte carriers. Forbid logs, receipts, raw storage, writer manifest,
   cache, hosted index, and hidden database.
4. Reconstruct every ID, Type, Principal, Core receipt, Router operation
   receipt, routed consent association, batch, nonce, Binding, posting, view,
   authority/finality/freshness grade, transcript, logical tree, property
   control page, and byte result; compare in
   a third process only after reconstruction finishes.
5. Retain toolchain, inputs, RPC transcript, state projection, and hashes.
6. Commit: `test: prove state-only hierarchical Files reconstruction`.

## Task 11: Run the physical-contract gate

**Files:**

- Create: `../core/scripts/measure-size.ts`
- Create: `../core/artifacts/size/metrics.json`
- Create: `../core/reports/physical-contract-gate.md`

1. Compile the complete vertical with pinned optimizer/EVM settings and record
   runtime/initcode for Core, every separately deployed Content/Files profile
   reader, Router, and adapter.
2. Enforce a pre-deployment safety margin rather than merely fitting EIP-170.
3. If Core fits with the agreed margin, retain one state-owning Core and
   internal logical libraries for the first MVP.
4. If it does not, compare only bounded alternatives: shared-storage
   delegatecall modules versus Core-owned state modules with exact atomic
   coordinator. Re-run every admission, reentrancy, reconstruction, and upgrade
   test; do not choose by byte count alone.
5. Return the measured physical split as an experimental engineering
   recommendation. Keep `protocolConformance=false`; ask the
   owner only if two surviving shapes imply a permanent trust/upgrade/product
   fork.
6. Commit: `bench: close the EFS Core physical-contract gate`.
