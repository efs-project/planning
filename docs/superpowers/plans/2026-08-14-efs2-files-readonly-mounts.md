# EFS v2 Cross-Platform Read-Only Mount Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task by task.

**Goal:** Mount one exact EVM EFS Files view usefully and honestly through
Linux, macOS, and Windows using the same resolver and portable host contract.

**Architecture:** Create a dedicated native `drive/` repository after name
confirmation. Its Rust core consumes the same vectors and logical resolver
contract as the SDK, emits `DirectoryProjectionV1` and
`HostEntryMetadataV1`, and has thin libfuse3/macFUSE/WinFsp adapters. The common
profile is read-only, noexec, pinned-view, and strict: incomplete state is an
I/O/retry condition, never a missing file. Platform callbacks and ordering are
projections, not canonical EFS semantics.

**Tech Stack:** Rust stable, tokio, Alloy or a minimal JSON-RPC client,
libfuse3, macFUSE (with FSKit evaluated separately), WinFsp native API, GitHub
Actions plus real Linux/macOS/Windows runners.

## Global Constraints

- Governing drafts: `Designs/efsv2/hierarchical-files-and-folders.md` and
  `Designs/efsv2/mountable-filesystem-semantics.md`.
- Confirm `efs-project/drive` before initializing; do not bury the native
  adapters inside the legacy Web client.
- Linux success is only the first adapter result. The adopted requirement is
  one golden view through Linux, macOS, and Windows plus ordinary CLI and
  graphical file-manager tests.
- The common profile exposes directories and regular files only: no symlink,
  hardlink, device, socket, executable, ACL authority, alternate stream, or
  write semantics.
- Mount `ro,noexec,nosuid,nodev,noatime` where supported. Every mutation and
  metadata write fails read-only.
- The daemon may use disposable caches but must reconstruct from RPC/state and
  byte carriers with caches deleted.
- Every report and binary produced here remains an experimental candidate with
  `protocolConformance=false`. Only a later V2-F1/F2 owner promotion may call it
  adopted EFS v2 conformance.

---

## Task 1: Build the platform-neutral resolved-filesystem core

**Files:**

- Create: `../drive/AGENTS.md`
- Create: `../drive/README.md`
- Create: `../drive/Cargo.toml`
- Create: `../drive/crates/files-core/Cargo.toml`
- Create: `../drive/crates/files-core/src/lib.rs`
- Create: `../drive/crates/files-core/src/result.rs`
- Create: `../drive/crates/files-core/src/projection.rs`
- Create: `../drive/crates/files-core/src/metadata.rs`
- Create: `../drive/crates/files-core/src/control.rs`
- Test: `../drive/crates/files-core/tests/golden_view.rs`

1. Confirm/initialize the repository and import only manifest-hashed SDK/Core
   vectors, not v1 path/index code.
2. Write RED tests for exact names, aliases, DirectoryProjection bytes,
   root-placement ID/native ID 1, placement-specific non-root HostFileId,
   collision failure, modes, size, times,
   result/error mapping, diagnostic and eligible application-property xattr/EA
   values, authority/finality/freshness/retrieval-observer diagnostics, lossless
   selected/losing property control pages, and local-cache-only
   statfs.
3. Implement a platform-neutral trait with `lookup`, `getattr`, `readdir`,
   `open`, `read`, `release`, `get_metadata`, `get_property`,
   `list_properties`, and paged control reads over pinned view/handle IDs.
4. Implement the common alias codec and persist full-to-64-bit ID mappings with
   full-hash collision verification.
5. Implement the exact framed local control protocol, including request/
   response/error payloads, u32 directory-cardinality failure, cursors, and
   property-query bodies.
6. Prove unknown/incomplete/unavailable/corrupt results never map to `NotFound`.
7. Commit: `feat: add the portable EFS resolved-filesystem core`.

## Task 2: Implement the independent Rust state and content resolver

**Files:**

- Create: `../drive/crates/files-core/src/rpc.rs`
- Create: `../drive/crates/files-core/src/state.rs`
- Create: `../drive/crates/files-core/src/view.rs`
- Create: `../drive/crates/files-core/src/resolve.rs`
- Create: `../drive/crates/files-core/src/list.rs`
- Create: `../drive/crates/files-core/src/properties.rs`
- Create: `../drive/crates/files-core/src/transcript.rs`
- Create: `../drive/crates/files-core/src/content.rs`
- Create: `../drive/crates/files-core/src/reconstruct.rs`
- Test: `../drive/crates/files-core/tests/state_reconstruction.rs`
- Test: `../drive/crates/files-core/tests/content_acquisition.rs`

1. Write RED tests that start with only chain, Core/Router addresses, public ABI,
   exact Route, RPC endpoints, and byte carriers—never a TypeScript service,
   pre-resolved manifest, hosted index, logs, receipts, raw storage, or writer
   database.
2. Implement EIP-1898 block-hash reads and independently reconstruct generic
   Type/Record state, publisher charters, Mount/config graphs, Binding heads and
   history, Plans/Lens results, BindingScope pages, properties, Router receipts,
   FilesViews, validation/authority/finality/freshness grades, and canonical
   transcripts.
3. Implement Locator enumeration separately from content-head authority;
   verify ChunkTree geometry, chunks/proofs, ranges, corrupt-primary rejection,
   fallback, and empty bytes before any adapter receives file data.
4. Emit planned/actual retrieval-observer reports and preserve archive loss,
   hostile scope pagination, incomplete Locator pages, proof failure, budget
   exhaustion, and unavailable bytes as typed non-absence outcomes.
5. Compare Rust output with the independent SDK and contract vectors only after
   Rust reconstruction finishes. Delete all caches and repeat in a fresh
   process.
6. Commit: `feat: reconstruct and verify EFS Files in Rust`.

## Task 3: Implement the Linux libfuse3 adapter

**Files:**

- Create: `../drive/crates/drive-linux/Cargo.toml`
- Create: `../drive/crates/drive-linux/src/main.rs`
- Create: `../drive/crates/drive-linux/src/fuse.rs`
- Test: `../drive/crates/drive-linux/tests/integration.rs`
- Create: `../drive/scripts/test-linux.sh`

1. Write RED integration tests for lookup/getattr/readdir/open/range read,
   continuation cookies, pinned handles, xattrs/control, read-only failures,
   timeout, unknown, byte corruption, and daemon restart.
2. Implement the thinnest libfuse3 translation into the Task 1 host projection
   and Task 2 Rust resolver; never resolve EFS semantics in callbacks
   independently and never consume a pre-resolved TypeScript manifest.
3. Mount the golden view with strict flags. Run `find`, `stat`, `cp`, `sha256sum`,
   ranged reads, and one graphical file manager.
4. Delete caches and repeat from state/carriers. Retain command outputs and
   hashes.
5. Commit: `feat: mount exact EFS views with libfuse3`.

## Task 4: Implement the macOS adapter and packaging probe

**Files:**

- Create: `../drive/crates/drive-macos/Cargo.toml`
- Create: `../drive/crates/drive-macos/src/main.rs`
- Create: `../drive/crates/drive-macos/src/fuse.rs`
- Test: `../drive/crates/drive-macos/tests/integration.rs`
- Create: `../drive/scripts/test-macos.sh`
- Create: `../drive/reports/macos-backend-gate.md`

1. Write RED tests for NFD-presenting host behavior versus canonical NFC EFS
   names, case collisions, colon, long path, Finder, xattrs, metadata times,
   pinned enumeration, read-only failures, and unmount/restart.
2. Implement macFUSE using the common Rust core. Configure aliasing before any
   native normalization/collision can merge names.
3. Run CLI and Finder golden tests and compare the logical manifest byte-for-byte
   with Linux.
4. Probe FSKit separately for support floors, callbacks, signing/notarization,
   and packaging. Do not replace the passing adapter unless evidence improves
   the product without changing semantics.
5. Commit: `feat: mount exact EFS views on macOS`.

## Task 5: Implement the Windows WinFsp adapter

**Files:**

- Create: `../drive/crates/drive-windows/Cargo.toml`
- Create: `../drive/crates/drive-windows/src/main.rs`
- Create: `../drive/crates/drive-windows/src/winfsp.rs`
- Test: `../drive/crates/drive-windows/tests/integration.rs`
- Create: `../drive/scripts/test-windows.ps1`

1. Write RED tests for UTF-16 conversion, reserved/device names, trailing
   dot/space, case collisions, ADS syntax, path length, FileId persistence,
   EAs/control, directory markers, Explorer, PowerShell, and all NTSTATUS
   mappings.
2. Implement the WinFsp native adapter over files-core; reject alternate
   streams/reparse/security mutations and expose one read-only security
   descriptor owned by the local mounting user.
3. Run `Get-ChildItem`, `Get-Item`, `Copy-Item`, `Get-FileHash`, ranged reads,
   and Explorer against the same golden view.
4. Compare the reconstructed logical manifest with Linux/macOS; native order
   and display aliases may vary only where the common profile permits.
5. Commit: `feat: mount exact EFS views with WinFsp`.

## Task 6: Prove pinned handles, refresh, and failure honesty

**Files:**

- Create: `../drive/crates/files-core/src/session.rs`
- Create: `../drive/crates/files-core/tests/refresh.rs`
- Create: `../drive/tests/cross-platform/golden-manifest.json`
- Create: `../drive/tests/cross-platform/failure-cases.json`

1. Write RED tests where a file head, directory entry, Realm revision, and
   Locator availability change while old file/directory handles stay open.
2. Implement immutable session/view generations: old handles retain old
   Revision/ChunkTree/projection; new opens see the refreshed exact view.
3. On reorg, archive loss, timeout, incomplete scope, or corrupt carrier, fail
   the affected read with retry/I/O status and invalidate no unrelated exact
   cache entry.
4. Prove no negative cache is created from any nondefinitive outcome on all
   three hosts.
5. Commit: `test: prove EFS mount view and failure isolation`.

## Task 7: Prove metadata/control parity and clean-room reconstruction

**Files:**

- Create: `../drive/scripts/orchestrate-golden.ts`
- Create: `../drive/artifacts/golden/{linux,macos,windows}/manifest.json`
- Create: `../drive/reports/three-host-candidate.md`

1. Use TypeScript only to launch, observe, and compare. Start each Rust daemon
   and host from an empty cache and the same exact route/view fixture; the
   daemon itself performs every state/content reconstruction from Task 2.
2. Reconstruct canonical path/name bytes, entry/node/revision/content IDs,
   selected Principal, Binding revision, result/completeness, aliases, metadata,
   authority/finality/freshness grades, retrieval-observer reports, full
   property candidate pages/projected xattr envelopes, and file bytes.
3. Compare canonical manifests byte-for-byte. Validate native diagnostics
   against the same portable control structure.
4. Exercise every mutation/xattr/EA/stream/metadata write and prove read-only
   failure without remote or local overlay state.
5. Retain tool/driver/OS versions, installation/licensing notes, hashes, CLI
   transcripts, and graphical smoke evidence.
6. Retain `protocolConformance=false` and label the result experimental even if
   all three hosts match.
7. Commit: `test: execute the Linux macOS Windows mount candidate`.

## Task 8: Produce the packaging and support-floor decision

**Files:**

- Create: `../drive/reports/distribution-gate.md`
- Create: `../drive/packaging/linux/README.md`
- Create: `../drive/packaging/macos/README.md`
- Create: `../drive/packaging/windows/README.md`

1. Measure install privileges, driver/runtime dependencies, signing,
   notarization, update/uninstall, recovery from daemon crash, and licensing on
   supported OS versions.
2. Keep libfuse3/macFUSE/WinFsp as Durable implementation choices, not Etched
   protocol dependencies.
3. Return only genuine product forks: support floors, driver installation
   friction, or packaging/licensing alternatives. Do not reopen canonical Files
   identity because one host is inconvenient.
4. Commit: `docs: close the EFS Drive distribution gate`.
