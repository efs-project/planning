# Hands-on test log — browser OS emulation, first-hand probes

**Status:** research-lane report for the 2026-07-29 Virtual OS Museum deep dive; first-hand evidence record, not canon
**Agent:** hands-on (claude-fable-5, main session), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/clientv2 #topic/games #topic/wasm

## Scope and method

The mission's hands-on validation: pick the target experience — "a user follows a normal hyperlink, sees an archived operating system, clicks Play, and runs it safely in the browser" — and falsify or confirm it against a live, existing deployment. The probe used the exact scenario James named ("You click Mac OS 7 and a real little computer running in your browser pops up") against **Infinite Mac** (infinitemac.org), the strongest existing implementation of that experience, plus a witnessed **v86** Linux boot (copy.sh). No production implementation was built; every number below was measured in-session on 2026-07-29.

**Environment:** Chromium-based embedded browser pane, macOS host, automated driving. One material caveat: the automated pane frequently loses page visibility between tool calls, which stops `requestAnimationFrame`-gated painting. Emulator *pixels* were therefore hard to capture in screenshots even while the emulator itself demonstrably ran (console + network + storage evidence below). This is a limitation of the probe harness, not of the site (INFERRED — the same page renders normally in ordinary interactive use, and the page did render its error dialog and chrome when captured at navigation time).

## Test 1 — Infinite Mac, System 7.0 (`https://infinitemac.org/1991/System%207.0`)

### Cold load and boot (VERIFIED)

Navigating the plain hyperlink boots a Macintosh IIfx running System 7.0 with **no account, no wallet, no install, and no Play gate** (execution is automatic on navigation — a divergence from PAF's explicit-Play requirement, worth noting as a deliberate design difference).

Console-reported boot milestones from the emulator's own instrumentation:

| Milestone | Time from emulator start |
| --- | --- |
| First video blit | **274 ms** |
| Emulator quiescent (boot settled) | **1926 ms** |

### Critical-path bytes (VERIFIED, measured via the Performance API)

Main-thread network transfer on a warm load: **~1.4 MB compressed / 5.6 MB decoded**. **Correction (measured later the same session):** this figure excludes the disk chunks entirely — they are fetched *inside the emulator worker*, which does not appear in the document's resource timing, and the first measurement was also served partly from cache. After clearing Cache Storage, the service worker, and OPFS and re-booting, the `disk-cache` held **exactly 36 chunk entries totalling 9.00 MB** — the true on-demand disk cost of booting System 7.0 to a settled desktop. Corrected accounting below.

| Asset | Transfer | Decoded | Role |
| --- | --- | --- | --- |
| `BasiliskII-*.wasm` | 468 KB | 1,673 KB | 68k Mac emulator, WASM build |
| `Mac-IIfx-*.rom` | 322 KB | 512 KB | machine ROM |
| `MacLibraryContents-*.js` | 478 KB | 1,617 KB | software-library index (not needed to boot) |
| `System 7.0 HD.dsk-*.js` | **1 KB** | 1 KB | boot-disk **chunk manifest** |
| `Infinite HD.dsk-*.js` | 85 KB | 165 KB | software-library disk chunk manifest |
| `Saved HD.dsk-*.js` | 1 KB | 5 KB | persistent-disk chunk manifest |
| `worker-*.js` | 11 KB | 29 KB | emulator worker glue |

The load-bearing trick: disk "images" ship as **tiny chunk manifests**; chunk bytes stream on demand as the emulated OS touches disk blocks. Corrected total for a cold boot to a settled System 7 desktop (VERIFIED by cache-clear + re-measure):

| Component | Decoded | Notes |
| --- | --- | --- |
| BasiliskII wasm + ROM + worker glue | ~2.2 MB | execute-critical; 0.8 MB over the wire compressed |
| Disk chunks actually read | **9.00 MB** (36 × 256 KB) | worker-fetched, Brotli on the wire, Cache-Storage-backed |
| Software-library index (`MacLibraryContents`) | 1.6 MB | not boot-critical |
| **Total to a booted desktop** | **~11–12 MB decoded** | the project's own published cold figure is ~3 s to fully booted |

The multi-GB library disk and the 1.1 GB sparse `Saved HD` cost essentially nothing until touched. Asset filenames embed content hashes (`BasiliskII-Dm9iTInD.wasm`), pinning an exact build generation per page load (VERIFIED); the site's overall release/version identifier was not captured in this probe (UNKNOWN).

### Disk chunk-manifest format (VERIFIED, fetched and inspected)

The `*.dsk-*.js` files are trivial ES modules of the shape:

```js
{ name: "System 7.0 HD", totalSize: 41943040, chunkSize: 262144,
  chunks: ["9a188b6d…", "dd87c018…", …, "", "", …] }   // one 128-bit hex hash per 256 KB chunk
```

The 40 MB System 7.0 boot disk is 160 content-addressed 256 KB chunks; empty array slots mark sparse/all-zero chunks that are never fetched. The 1.1 GB `Saved HD` manifest is almost entirely empty slots — a sparse image that costs almost nothing until written. Chunks are fetched individually on demand as the emulated OS touches disk blocks, and the service worker caches them. This is within an inch of EFS's `FileManifest` draft (`chunksRoot` + `chunkCount` + `chunkSize` + `size`): the differences are hash family, EFS's Merkle apex binding the count (vs. Infinite Mac's bare hash list), and EFS's on-chain/mirror grading. Nothing about the museum-class workload requires more than the generic chunked-file primitive plus range-granular fetch (VERIFIED for this workload; argued generally in the main review).

### Emulator configuration (VERIFIED, logged by the page)

Generated Basilisk II prefs: `rom Mac-IIfx`, `cpu 3` (68030), `modelid 7`, `ramsize 134217728` (128 MB), `screen win/640/480`, `frameskip 0`, `jit false`, disks `System 7.0 HD` + `Infinite HD` + `Saved HD` + 7 placeholder slots, `extfs /Shared/` (host file sharing), `ether js` (networking via a JS Ethernet bridge), audio 22050 Hz/16-bit/mono. The complete machine definition is expressible as a small config text — the museum-relevant lesson: an exact launch generation = emulator build + ROM + disk chunk manifests + one config blob.

### Browser requirements (VERIFIED)

`window.crossOriginIsolated === true` and `SharedArrayBuffer` is available on the machine page — the deployment sets COOP/COEP and uses SAB (worker↔main framebuffer/input sharing). A service worker registers and activates on load (chunk caching/offline layer). This confirms the museum-class runtime wants cross-origin isolation, which the clientv2 kernel currently provides only via SW header injection on repeat loads (`KERNEL:40`) — a first-load gap EFS would have to close or design around.

### Persistence (VERIFIED)

Origin storage after boot:

- OPFS: `Saved HD.data` (262,144 bytes) + `Saved HD.dirtychunks` (1 byte) — the persistent disk is a **base image + dirty-chunk overlay**, exactly the shape clientv2's Tier-A/pin model would need to host.
- `navigator.storage.persisted()` → **false**; quota ≈ 4.8 GB in this profile; IndexedDB empty. User saves are evictable browser storage — the same honesty problem persistence-and-sync.md names (Safari 7-day lease etc.).

### Failure state observed (VERIFIED)

Opening the same machine in a second context while the first instance held the saved-disk lock produced a Mac-styled dialog:

> **Emulator Error** — Could not open saved disk "Saved HD" (it may be open in another tab). It will be mounted, but it will be empty and changes to it will not be saved. — [Bummer]

Cross-tab single-writer locking on the persistent disk, with graceful degradation (run anyway, saves disabled) and honest copy. This is a live example of PAF-6's "promise only the local-data behavior it can observe" and of persistence-and-sync's single-writer discipline, shipped in a real product.

### Input, reset, media (partially verified)

Mouse/keyboard reach the emulated Mac in normal interactive use and library items load from the Infinite HD disk (INFERRED from design + library index fetch; not directly exercised here due to the paint-capture limitation). The page exposes CD-ROM and Macintosh Garden import drawers, drag-and-drop disk import, and per-machine "embed into your own site" support (VERIFIED from page chrome and site copy).

### Legal shape (cross-reference)

The probe fetched an **Apple Mac IIfx ROM and Apple System 7.0 disk image from Infinite Mac's origin with no authentication** (VERIFIED). Apple system software and ROMs are not freely redistributable; Infinite Mac's risk posture (and any takedown history) is the licensing lane's territory — but the hands-on fact stands: today's best "click Mac OS 7" experience is built on bytes EFS could **not** mirror under PAF-7's "refuse non-redistributable bytes" rule. An EFS parity story for classic Mac OS requires a BYO-media flow, a rights-cleared subset, or metadata-only records — not default mirroring.

## Test 2 — v86 Linux at copy.sh (witnessed)

During the session a shared-pane probe (runtimes lane) had `https://copy.sh/v86` running: Linux booted **to an interactive root shell in ~9 s** entirely in-browser, with v86's control panel showing live speed (~53 mIPS average), IDE bytes read (~6.2 MB), and a full launcher-grade control set: Pause / Reset / Ctrl-Alt-Del / insert-eject floppy & CD images / **Save State / Load State** / Memory Dump / network-traffic capture / mouse lock / fullscreen / screenshot / mute (VERIFIED by direct observation of the running page). FreeDOS and Linux images on copy.sh are freely redistributable system classes — the legally clean end of the spectrum. The runtimes-x86 lane owns the deep dive; this log records only the first-hand observation.

## What the probe establishes for EFS

1. **The target experience exists and is cheap.** A real classic-Mac boot needs ~2.2 MB of execute-critical bytes plus exactly 9.00 MB of on-demand disk chunks — ~11–12 MB decoded total against a 40 MB image — and the emulator reaches quiescence 1.9 s after start (VERIFIED above; the project's own cold-cache figure is ~3 s to fully booted). "Click a link, a little computer pops up" is not speculative; parity is an integration problem, not a research problem, *for system classes whose media is lawful to serve*.
2. **The manifest closure is small and legible.** Exact generation = emulator WASM (content-hashed) + ROM + config blob + N disk-chunk manifests. All are ordinary files; nothing museum-specific. EFS's PAF-2 versioned-manifest model expresses this closure directly (PROPOSED mapping, to be argued in the main review).
3. **Range/chunk reads are the load-bearing primitive.** The entire UX rests on lazy verified chunk fetch against an immutable image — precisely the `BYTES-PARTIAL` chunk machinery in large-file-uploads.md plus the range-read spec text it still lacks, and precisely what packages-and-updates.md's all-or-nothing closure staging currently refuses (a named gap for the review).
4. **Persistence = overlay, not image mutation.** Dirty-chunk overlays over an immutable base keep saves tiny, portable, and generation-scoped; browser storage is evictable and the honest-failure dialog is mandatory product surface, not polish.
5. **Cross-origin isolation must be a designed lane.** SAB-threaded emulators need COOP/COEP on first paint; clientv2's SW-injection-on-repeat-load approach leaves the guest deep-link cold start (the museum's whole front door) unisolated (VERIFIED site behavior vs. KERNEL:40/BOOT:125 — resolution belongs to the review).
6. **Explicit Play is a real divergence.** Infinite Mac auto-executes on navigation; PAF and the resolver doctrine (grades exist before destination bytes render) require an explicit Play after preflight. EFS should treat auto-boot as a curated-embed option at most, never the hyperlink default (PROPOSED).

## Sources

| URL | What it evidences | Accessed | Grade |
| --- | --- | --- | --- |
| https://infinitemac.org/1991/System%207.0 | Boot timings, asset sizes, config, COOP/COEP+SAB, OPFS layout, saved-disk lock dialog | 2026-07-29 | A (live measurement) |
| https://infinitemac.org/ | Product claims: every-version library, embed, import/export | 2026-07-29 | A |
| https://copy.sh/v86 | Witnessed Linux boot to shell; launcher-grade controls incl. save/load state | 2026-07-29 | A (live observation) |
