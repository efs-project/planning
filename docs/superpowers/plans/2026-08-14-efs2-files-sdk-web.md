# EFS v2 Files SDK and Direct Web Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task by task.

**Goal:** Deliver one walletless, self-hostable Web File Browser and reusable
resolver library that agree exactly with the Files/1 contracts and never turn
unknown state or unavailable bytes into absence.

**Architecture:** Add a quarantined v2 package to the existing SDK repository
without reusing its v1 EAS model. Build the product UI in a new OS/Web
repository, provisionally `os/`, while keeping the direct guest Web Client
independent of booting an OS shell or Commons. One pure resolver core serves
Web, later OS surfaces, and mounts; transport, cache, rendering, and signing are
capabilities around it.

**Tech Stack:** TypeScript, Bun/Vitest, viem, Web Components or the framework
selected by the Client v2 design, browser Cache API/IndexedDB, Playwright.

## Global Constraints

- Governing draft: `Designs/efsv2/hierarchical-files-and-folders.md`.
- Preserve `../client/` as legacy-v1 evidence. Confirm `efs-project/os` before
  initializing a new repository; do not retrofit v2 piecemeal into `client/`.
- The direct File Browser works in a clean browser without wallet, account,
  local daemon, OS boot, or Commons.
- No server cache/index is required for correctness. Browser caches are
  disposable and keyed by exact basis/profile/authority.
- `UNKNOWN`, `PARTIAL`, `CONFLICT`, `OPAQUE`, and `BYTES_UNAVAILABLE` remain
  distinct through every public API and UI state.
- No executable or active document receives trusted-origin authority merely
  because its bytes verify.
- All packages and reports remain experimental candidates with
  `protocolConformance=false`; technical success cannot perform V2-F1/F2 owner
  promotion.

---

## Task 1: Establish quarantined v2 SDK and Web workspaces

**Files:**

- Create: `../sdk/packages/v2/package.json`
- Create: `../sdk/packages/v2/tsconfig.json`
- Create: `../sdk/packages/v2/src/index.ts`
- Create: `../sdk/packages/v2/test/no-v1-imports.test.ts`
- Create: `../os/AGENTS.md`
- Create: `../os/README.md`
- Create: `../os/package.json`
- Create: `../os/apps/web/package.json`
- Create: `../os/apps/web/src/main.ts`
- Create: `../os/apps/web/test/smoke.test.ts`

1. Confirm the new Web/OS repository name; preferred local/GitHub name is
   `os` / `efs-project/os` because the Web Client is the first OS surface.
2. Add a failing dependency-boundary test that rejects imports of EAS, v1
   UID/ANCHOR/PIN/TAG/PATH modules, legacy client code, and hidden hosted-index
   clients.
3. Create `@efs/v2-sdk-experimental` with only viem/codec dependencies and a
   minimal direct Web app that renders its nonconformance label.
4. Run SDK and Web tests; verify GREEN.
5. Commit separately in each repo: `chore: open the EFS v2 resolver workspace`
   and `chore: initialize the EFS Web OS`.

## Task 2: Implement canonical IDs, names, URLs, and views

**Files:**

- Create: `../sdk/packages/v2/src/codec/ids.ts`
- Create: `../sdk/packages/v2/src/files/name.ts`
- Create: `../sdk/packages/v2/src/files/url.ts`
- Create: `../sdk/packages/v2/src/files/control.ts`
- Create: `../sdk/packages/v2/src/files/view.ts`
- Create: `../sdk/packages/v2/src/files/results.ts`
- Test: `../sdk/packages/v2/test/files-name-url.test.ts`
- Test: `../sdk/packages/v2/test/files-view-control.test.ts`

1. Import only manifest-verified Core vectors; write RED tests for every Unicode,
   `FILES_MEDIA_HINTS_V1`, profile-validation grade, percent, dot,
   query/control, trailing-directory, direct-ID, FilesView, and transcript
   vector, including exact citation chain/address/path/query/control mismatch
   rejection.
2. Vendor/hash the exact candidate Unicode tables and implement strict
   user-normalizing versus signed/citation-rejecting constructors.
3. Implement raw-path, decoded-5219, manual, and exact citation constructors as
   distinct types so a decoded segment can never be decoded twice.
4. Implement exact PATH/DIRECT_ID transcripts, source→entered/terminal
   view+Mount transitions, first-use 1..65 view vectors, canonical path/query
   preimages, and result-dependent presence/zero rules.
5. Implement EIP-1898 block-hash view reads and portable profile-validation,
   authority, finality-proof, and recorded/current freshness grades.
6. Run property/fuzz tests across TS/Rust/Solidity vectors.
7. Commit: `feat: add canonical Files names, links, and views`.

## Task 3: Implement point resolution and complete directory listing

**Files:**

- Create: `../sdk/packages/v2/src/core/reader.ts`
- Create: `../sdk/packages/v2/src/files/mount.ts`
- Create: `../sdk/packages/v2/src/files/resolve.ts`
- Create: `../sdk/packages/v2/src/files/list.ts`
- Create: `../sdk/packages/v2/src/files/transcript.ts`
- Test: `../sdk/packages/v2/test/files-resolve.test.ts`
- Test: `../sdk/packages/v2/test/files-list.test.ts`

1. Write RED fixtures for three-level/deep paths, Mount changes, Plan 1/8/32/64,
   whiteout/tombstone, malformed selected value, cycle, unknown, and foreign
   view leg with an explicit target ChainRef/Core/Realm/Route/config/basis.
2. Implement typed Core reads and point Lens resolution at one exact view;
   compare mount-local purpose/scope and RECORD leaf-zero targets.
3. Implement BindingScope merge/list with resumable per-Principal cursors,
   bounded budgets, bytewise sort, and no complete claim before every scope is
   terminal.
4. Emit a canonical resolution transcript and logical directory manifest.
   Cross-Realm transcripts carry the full unique ordered FilesView vector and
   use no ambient Realm registry or default route.
5. Recompute each selected dependency's profile-validation grade and reject a
   transcript/result whose per-component and aggregate grades disagree.
6. Run the 10,240-dead + 63-live hostile listing and prove ten empty PARTIAL
   pages precede the complete 63-item result.
7. Implement basis-qualified `getPropertyV1`/`listPropertiesV1`; preserve
   selected/losing candidates, provenance, attachment scope, cursors, grade,
   and completeness without treating a partial page as absence.
8. Commit: `feat: resolve and enumerate exact Files views`.

## Task 4: Implement verified byte acquisition and open handles

**Files:**

- Create: `../sdk/packages/v2/src/content/chunk-tree.ts`
- Create: `../sdk/packages/v2/src/content/locators.ts`
- Create: `../sdk/packages/v2/src/content/range.ts`
- Create: `../sdk/packages/v2/src/files/open-handle.ts`
- Test: `../sdk/packages/v2/test/content-range.test.ts`
- Test: `../sdk/packages/v2/test/files-open-handle.test.ts`

1. Write RED tests for empty bytes, Merkle boundaries, corrupt primary, verified
   fallback, mixed carriers, whole-file-only carrier, EOF/416, unavailable and
   incomplete Locator pages.
2. Implement content-head selection independently from Locator admissibility
   and ranking.
3. Verify full chunks/proofs before exposing any slice; pin FileRevision and
   ChunkTree for the lifetime of an open handle.
4. Emit planned and actual `RetrievalPrivacyReportBytesV1` for raw RPC,
   gateway, carrier, relay/OHTTP, snapshot, mixed, and local-replica paths;
   never infer privacy from TLS or integrity.
5. Add abort, memory, byte, proof, RPC, and wall-time budgets with typed
   resumable outcomes.
6. Commit: `feat: verify EFS file bytes and ranges`.

## Task 5: Implement operation builders without hiding authority

**Files:**

- Create: `../sdk/packages/v2/src/files/operations.ts`
- Create: `../sdk/packages/v2/src/files/sensitivity.ts`
- Create: `../sdk/packages/v2/src/files/signing.ts`
- Test: `../sdk/packages/v2/test/files-operations.test.ts`
- Test: `../sdk/packages/v2/test/files-sensitivity.test.ts`

1. Write RED builders for create/edit/rename/move/unlink/mask/copy, Object
   charter, exact Binding CAS, pre-admitted `FilesOperation/1`,
   `RoutedAdmissionIntent/1` executor/code/operation association, and the full
   ordered multi-Principal intent set.
2. Encode the exact closed Core consent-kind discriminant and prove no
   implicit, ordinary, or routed consent payload can be decoded under another
   branch.
3. Implement a dry-run plan that exposes Principal, authority basis, Realm,
   route/Plans, historical preflight FilesView, basis-free exact dependency
   commitments, records, pre/postconditions, gas estimate, and signing digest
   before any signature request.
4. Ask the Router for `FILES_PRECONDITION_CERTIFIED` only when every relevant
   component is `FILES_PROFILE_VALIDATED`. The initial contract arm supports
   the fully validated `FILES_ROUTER_ASCII_NAME_V1`; rich Unicode remains
   readable/offchain-validatable but certified writes return
   `UNSUPPORTED(PROFILE_VALIDATION)` until the pinned Router can prove it.
5. Enforce local sensitivity inheritance before upload/encode/sign; reject
   mixed public/private operations and prove public-to-private warnings.
6. Make direct `/1` publication available only as generic Core publication;
   never label it Files precondition-certified.
7. Verify a completed exact retry resolves the prior Router receipt, while an
   ACTIVE occurrence with no/different routed association fails locally before
   asking for a signature.
8. Reject a certified operation that enters an external view leg; re-root a
   separately authorized target-Route operation instead.
9. Commit: `feat: build authority-explicit Files operations`.

## Task 6: Build the direct guest Web File Browser

**Files:**

- Create: `../os/apps/web/src/files/FileBrowser.ts`
- Create: `../os/apps/web/src/files/DirectoryView.ts`
- Create: `../os/apps/web/src/files/FileView.ts`
- Create: `../os/apps/web/src/files/ResultState.ts`
- Create: `../os/apps/web/src/files/cache.ts`
- Create: `../os/apps/web/test/files-browser.test.ts`
- Create: `../os/apps/web/test/e2e/files-browser.spec.ts`

1. Write a failing clean-browser E2E for
   `/myfolder/mysubfolder/myfile.jpg`: no wallet, account, OS shell, hosted
   index, or prefilled database.
2. Render directory, file metadata, selected authority, profile-validation,
   Realm/view/finality, freshness, retrieval observers, completeness,
   application properties, and byte-availability grades without
   exposing Core ceremony in the default UI.
3. Add resumable PARTIAL/UNKNOWN states; prove neither shows a 404 or populates
   a negative cache.
4. Corrupt the primary carrier, reject before display, verify fallback, and
   show the exact pinned revision/content IDs in details.
5. Cache only exact state/verified chunks in Cache API/IndexedDB; invalidate by
   view/profile/authority key, not path alone.
6. Commit: `feat: add the direct guest EFS File Browser`.

## Task 7: Enforce active-content and capability boundaries

**Files:**

- Create: `../os/apps/web/src/render/RawDownload.ts`
- Create: `../os/apps/web/src/render/OpaquePreview.ts`
- Create: `../os/apps/web/src/render/PlayRequest.ts`
- Test: `../os/apps/web/test/e2e/active-content.spec.ts`

1. Write RED HTML/SVG/PDF/XML/script fixtures that attempt parent-origin reads,
   storage, service workers, network, wallet/provider, and ambient EFS access.
2. Default all active formats to attachment + nosniff.
3. Implement Preview in an opaque sandbox with zero capabilities; implement
   Play only as a separate, explicit capability request after full closure
   verification.
4. Prove zero executable-byte fetch before explicit action and zero execution
   before verification.
5. Commit: `feat: isolate verified active content from route authority`.

## Task 8: Prove portable Web/SDK reconstruction

**Files:**

- Create: `../sdk/packages/v2/src/files/reconstruct.ts`
- Create: `../sdk/packages/v2/test/files-reconstruct.test.ts`
- Create: `../os/apps/web/test/e2e/clean-room.spec.ts`
- Create: `../os/reports/files-web-vertical.md`

1. Delete browser storage, caches, derived indexes, and any development DB.
2. Reconstruct the same logical tree, transcript, selected IDs, listing,
   property pages, routed consent/operation receipt when present, rejected
   carrier, verified bytes, authority/finality/freshness grades, this run's
   retrieval-observer reports, and portable host metadata from RPC and byte
   carriers only.
3. Compare against independent Rust and contract fixtures after reconstruction,
   not by sharing writer inputs.
4. Retain exact browser/toolchain/corpus hashes and a video or trace of the
   clean guest flow.
5. Only then call the direct Web/OS candidate ready for broader experimental OS
   surfaces; keep `protocolConformance=false`.
6. Commit: `test: prove clean-room EFS Web reconstruction`.
