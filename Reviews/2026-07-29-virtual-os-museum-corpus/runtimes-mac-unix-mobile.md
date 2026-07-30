# Browser Execution of Classic Mac OS, Unix Workstations, Mobile and Modern OSes

**Status:** research-lane report for the 2026-07-29 Virtual OS Museum deep dive; evidence record, not canon
**Agent:** runtimes-mac-unix-mobile (claude-fable-5 workflow), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/wasm #topic/wasi #topic/content

---

## 1. Infinite Mac — the key precedent

Infinite Mac (infinitemac.org) is the existence proof for "click Mac OS 7 and a little computer pops up." One person, Mihai Parparita, has been running it since March 2022. Everything below is from reading the live repo (`mihaip/infinite-mac`, shallow-cloned at commit `a73d016b` dated 2026-07-26 — i.e., actively maintained three days before this report) plus the project's blog series.

### 1.1 Emulator cores ported (seven, all Emscripten/WASM)

All confirmed in `src/emulator/common/emulators.ts` and the About page (VERIFIED):

| Core | Covers | WASM size (in repo) | Upstream license |
|---|---|---|---|
| Mini vMac (6 per-machine builds: 128K, 512Ke, Plus, SE, II, IIx) | System 1.0–7.x on early 68k | 0.8–1.1 MB each | GPL v2 (VERIFIED, gryphel.com license page) |
| Basilisk II | 68040 Quadra, System 7–8.1 | 1.6 MB | GPL (macemu README; v2) (VERIFIED) |
| SheepShaver | PPC, Mac OS 7.5.2–9.0.4 | 0.7 MB | GPL (macemu README; v2) (VERIFIED) |
| DingusPPC | Power Mac 6100/7500/9500/G3; OS X 10.0–10.1 + Classic | 1.9 MB | GPL-3.0 (VERIFIED, GitHub API) |
| PearPC | New World PPC; OS X 10.2–10.4 | 0.7 MB (`ppc.wasm`) | GPL-2.0 (VERIFIED, GitHub API) |
| Previous | NeXT 68030/68040 machines, NeXTSTEP/OPENSTEP | 2.8 MB | GPL v2 (INFERRED from Previous/Hatari lineage; not re-verified) |
| Snow | Hardware-level 68k Macs incl. 68851 PMMU → runs A/UX | 7.1 MB | MIT (VERIFIED, twvd/snow) |

The WASM binary sizes are measured from the checked-in `emscripten/` artifacts (VERIFIED). Note how small these cores are — the *entire runtime* for a Mac Plus is under 1 MB before the OS disk.

### 1.2 OS coverage

66 system-disk definitions in `src/defs/disks.ts` (VERIFIED): System 1.0 (1984-01-24) through Mac OS 7.6.1, Mac OS 8.0–8.6, 9.0–9.2.2, Mac OS X 10.0–10.4 (added 2025-03), KanjiTalk 7.5.3 (Japanese), NeXTStep 0.8 (1988) through OPENSTEP 4.2 (added 2024-03), and A/UX 3.1.1 — Apple's 68k Unix — running on a Snow-emulated Mac IIcx but flagged `hiddenInBrowser: true`, i.e. experimental and not publicly listed yet (VERIFIED, code). Mac OS X beyond 10.4 is not offered; the About FAQ points to open GitHub issue #72 ("adding QEMU as an emulator option") for the future (VERIFIED).

### 1.3 How "instant boot" works — chunked streaming, not snapshots

- Disk images are split into **fixed-size, content-addressed 256 KiB chunks** (`CHUNK_SIZE = 256*1024` in `scripts/import-disks.py`; CD-ROMs use 128 KiB), Brotli-compressed, served from Cloudflare R2 behind a Worker (VERIFIED, code + launch blog post).
- Emulator disk reads are intercepted; missing chunks are fetched on demand. Each disk definition carries a hand-recorded `prefetchChunks` array (hundreds of indices, visible in `disks.ts`) so boot-critical chunks stream first (VERIFIED, code).
- Result claimed at launch: boot screen in ~1 s, fully booted in ~3 s with a cold HTTP cache (VERIFIED, 2022-03 launch post). It is a *real boot*, not a resumed RAM snapshot — there is no saved-state/suspend mechanism in the codebase (INFERRED from code inspection; no snapshot machinery present).
- Idle CPU was optimized to ~13% via Atomics-based idling of Basilisk II's idle loop (VERIFIED, launch post). Input is polled at 1,000 Hz for ~1 ms latency (VERIFIED, networking post).

### 1.4 Persistence and file exchange

- **Saved HD**: a persistent disk stored in the browser's **Origin Private File System (OPFS)** with a data file plus a dirty-chunk bitmap (`navigator.storage.getDirectory()` in `disk-saver.ts`, VERIFIED). Importable/exportable as a file (changelog 2023-09-09).
- **The Outside World** drive (System 7–9.0.4): drag files into the page → "Downloads" folder inside the Mac; drop files in "Uploads" → zipped and downloaded to the host. Zip round-tripping preserves resource forks and Finder metadata (VERIFIED, About + 2025-09 blog post). Text clipboard syncs both ways (VERIFIED, changelog).

### 1.5 Networking — yes, multiplayer

AppleTalk-over-Ethernet is bridged to two providers (VERIFIED, `src/net/`): a `BroadcastChannel` provider (same-browser tabs) and a **Cloudflare Durable Object** provider — each subdomain is a "zone"; instances in a zone exchange Ethernet frames over WebSockets. Marathon and Bolo LAN games work across the internet, though the LAN-era protocols desync after ~15–20 minutes of play (VERIFIED, 2022-07 networking post). AppleTalk is off by default because its self-addressing protocol adds a mandatory ~5 s boot delay (VERIFIED, same post).

### 1.6 Embedding and deep links

- Dedicated one-OS domains: system6.app, system7.app, kanjitalk7.app, macos8.app, macos9.app (VERIFIED, README).
- Custom instances at `/run` with URL-specified system disks, arbitrary disk-image URLs, RAM size, screen size, and date override (VERIFIED, changelog 2023-07/2023-08).
- Since 2025-07, a first-class `/embed` endpoint + HTML builder: iframe with URL params, `postMessage` control events (pause/unpause, mouse, keyboard, `emulator_load_disk`) and notification events including raw screen frames; auto-pauses via IntersectionObserver when off-screen (VERIFIED, `src/embed-types.ts` + 2025-07 blog post). Caveat: Safari/WebKit lacks SharedArrayBuffer in cross-origin iframes, requiring a fallback path (VERIFIED, blog).
- "Infinite Monkey" demo drives an embedded Mac 128K with Anthropic/OpenAI computer-use models via this embed API (VERIFIED, blog + `src/monkey/`).

### 1.7 Performance

- 68k emulation (Mini vMac/Basilisk II) runs at or well above original hardware speed on any modern machine (INFERRED from design + author's statements; Mini vMac even has an "All Out" overclock mode used during image builds — VERIFIED, README).
- SheepShaver-era Mac OS 9 is comfortably usable (INFERRED; it shipped as macos9.app in 2022 and remains a headline domain).
- Mac OS X is the pain point: PearPC takes ~2 minutes to a usable desktop; author's benchmark (MD5 of 100 MB) — DingusPPC 13 s, PearPC 18 s, **qemu-wasm 8 s** (VERIFIED, 2025-03 blog post). That comparison is why QEMU-in-WASM is the tracked upgrade path.
- Previous deliberately paces emulation to original NeXT hardware speed (VERIFIED, 2024-03 blog post).

### 1.8 ROM/OS legality — the actual observed posture

- **24 Apple and NeXT ROM files (64 KiB–4 MiB, including three NeXT ROM revisions and 4 MB Power Mac ROMs) are committed directly to the public GitHub repo** in `src/Data/`, and OS disk images are served from the public site (VERIFIED, repo listing).
- The About/FAQ contains **no legality statement at all** — no "abandonware" defense, no disclaimer (VERIFIED, full read of `About.tsx`).
- No DMCA/takedown against Infinite Mac was found: the only 2025 Apple notice in GitHub's DMCA repo targets an `apps.apple.com` website clone, unrelated (VERIFIED, github/dmca 2025-11-05 notice). The project has operated publicly since 2022-03 with mainstream press coverage (Boing Boing etc.).
- Nuance for the record: Apple made some classic System releases (e.g., 7.5.3/7.5.5) gratis downloads in the 1990s, but gratis ≠ freely redistributable, and ROMs were never licensed at all (INFERRED, widely documented history). The accurate description is **"copyrighted, distribution tolerated in practice"** — the same posture as Macintosh Garden, which Infinite Mac's software library explicitly builds on (VERIFIED, README `import-library` uses a Macintosh Garden data dump).

### 1.9 Maintenance / bus factor

Single maintainer (mihaip), ~1,100 commits, 1.6k stars, active through 2026-07-26 (VERIFIED). All six C/C++ emulator cores are consumed via *his own forks* (macemu, minivmac, dingusppc, previous, pearpc submodules; snow tracks upstream) (VERIFIED, `.gitmodules`/README). Funding is GitHub Sponsors + PayPal donations (VERIFIED, `funding.yml`). Frontend is Apache-2.0 so the machinery is forkable, but disk/ROM hosting (Cloudflare R2 + Worker) is centrally operated and personally funded — bus factor is effectively 1 for the hosted service, higher for the code (INFERRED).

## 2. Classic Mac emulation generally

- The WASM lineage starts with James Friend's in-browser Basilisk II port, which Infinite Mac extended (VERIFIED, launch post). Internet Archive's in-browser early-Mac software items use a PCE-based Mac Plus emulator under Emularity (INFERRED, not re-verified this pass).
- License reality: every relevant core except Snow (MIT) is GPL v2/v3 (see table above). GPL is compatible with a museum that ships the emulator as a separate WASM artifact with source offer; it does not restrict the OS images, which are the actual legal exposure (INFERRED).
- ROM requirement reality: Basilisk II needs a Mac II-class ROM + a MacOS copy; SheepShaver needs a PowerMac ROM ("Mac OS ROM" New World file) + MacOS (VERIFIED, macemu README). Mini vMac needs a machine ROM (VERIFIED, gryphel site). None are redistributable under any license; every working deployment either ships them anyway (Infinite Mac) or makes the user bring them (BYO-ROM) (VERIFIED/INFERRED as labeled).

## 3. Unix workstations: SPARC / MIPS-IRIX / PA-RISC / POWER

Short version: **nothing runs these in a browser today; this is local-native QEMU/MAME territory, with server-streaming as the only web path.**

- **NeXT is the exception** — full NeXTSTEP/OPENSTEP in the browser via Infinite Mac's Previous port (VERIFIED, section 1). A/UX (Apple's Unix) is the second exception, experimentally, via Snow (VERIFIED).
- **SPARC/Solaris**: `qemu-system-sparc` emulates sun4m SPARCstations, but QEMU's own docs state "older Solaris kernels don't work" (OpenBIOS interface issues) (VERIFIED, qemu.org target-sparc docs). sun4u/Solaris 8–10 boots exist as community recipes with caveats (INFERRED, C-grade). No browser demo found (UNKNOWN — none located).
- **SGI/IRIX (MIPS)**: MAME emulates the SGI Indy/Indigo2 well enough to install and run IRIX (community-documented) (INFERRED, C-grade). MAME has Emscripten builds, so an IRIX-in-browser stunt is *conceivable*, but no demo exists and MAME's cycle-accurate MIPS+gfx emulation is already slow natively — in-browser would be far below usable (INFERRED). No browser IRIX/Solaris demo found anywhere (UNKNOWN).
- **HP-UX (PA-RISC)**: `qemu-system-hppa` (in QEMU since 2.12, Helge Deller/Richard Henderson) boots HP-UX 11.11 including X11, with ongoing firmware/graphics fixes (VERIFIED via community writeups + patch series; B/C-grade). Local-native only.
- **AIX (POWER)**: `qemu-system-ppc64 -M pseries` can boot AIX 7.2 to a shell with heavy workarounds; installation loops without patches; QEMU upstream explicitly does not support AIX and 7.3 fails (VERIFIED via qemu-ppc list + GitLab issue #1501; B/C-grade).
- **qemu-wasm relevance**: the browser QEMU port currently demos only x86_64, AArch64, riscv64 guests (VERIFIED, ktock/qemu-wasm README). SPARC/MIPS/HPPA targets would need their own porting effort; nobody has published one (UNKNOWN/INFERRED).
- Media legality: Solaris (Oracle), IRIX (HPE), HP-UX (HPE), AIX (IBM) are all still-owned commercial OSes with no free-redistribution grant; hobbyist image circulation is grey-market (INFERRED). "Metadata-only, bring-your-own-media" is the only clean archival posture here.

## 4. Mobile OSes

- **PalmOS — the standout: CloudpilotEmu** (cloudpilot-emu.github.io, GPL-3.0, pushed 2026-07-29). Browser PWA emulating Dragonball devices (PalmOS 1–4, POSE-derived) **plus ARM OS5 (Tungsten E2) via Dmitry Grinberg's uARM**; continuous state saves (survives reload), SD card support, networking via websocket proxy, clipboard, an embeddable variant for third-party sites, and an iOS app (VERIFIED, project site + GitHub API). ROMs come from PalmDB (community-hosted, copyrighted by successors to Palm/ACCESS; tolerated) (VERIFIED site pointer; legality INFERRED). This is browser-native-practical, tiny (ROMs are single-digit MB), and the closest thing PalmOS has to Infinite Mac.
- **Newton**: Einstein runs NewtonOS 2.1 on desktop platforms and requires a user-dumped Newton ROM (VERIFIED via project docs/search; C-grade). A browser-based NewtonOS 1.x emulator, **Leibniz** (pablomarx), exists as a work-in-progress for RUNT-based Newtons — repo has **no license file** and 34 stars, last pushed 2026-06 (VERIFIED, GitHub API; browser build reported in secondary coverage — C-grade). Verdict: borderline; treat as local-native/experimental-browser, BYO ROM.
- **Windows Mobile / CE**: no browser emulator found (UNKNOWN — none located). Local options are weak too (Microsoft's old Device Emulator on Windows; scattered QEMU images). Effectively metadata-only for a museum (INFERRED).
- **Symbian**: EKA2L1 (GPL-3.0, ~2k stars) is a high-level Symbian OS / N-Gage emulator for Windows/macOS/Linux/Android covering S60v1–S^3 and S80; no browser/WASM port (VERIFIED, project pages + API). Symbian's 2010 EPL source release was later withdrawn by Nokia; mirrors persist, but the OS images/apps remain copyrighted (INFERRED). Local-native-required.
- **Early Android**: legally the *cleanest* mobile row — AOSP is Apache-2.0 and Android-x86 is redistributable (INFERRED, well-established licensing). v86's own README lists working **Android-x86 1.6-r2 and 4.4-r2** in-browser demos (VERIFIED). Slow but real: browser-capable-with-limits. Newer Android (ART, 64-bit, GPU expectations) is out of reach client-side (INFERRED).
- **iPhone OS**: **touchHLE** — high-level emulator providing its own implementations of the iPhone OS 2.x/3.0 frameworks; needs only decrypted `.ipa`/`.app` binaries, **no Apple firmware**; MPL-2.0 source, GPLv3 binaries; runs on x64 Windows/macOS and AArch64 Android; **no browser/WASM version**, and "the vast majority of iPhone OS 2.x/3.x apps do not currently work" (VERIFIED, touchHLE README). Full-device iOS emulation (QEMU-t8030 lineage) is research-grade and local-only (INFERRED). Verdict: local-native-required, BYO app binaries, games-first.

## 5. Modern OSes in the browser — honesty section

- **Windows 10/11**: not browser-feasible. v86 is 32-bit-only (no 64-bit kernels, explicitly) and tops out around XP/Vista/8 "under certain conditions" (VERIFIED, v86 README). qemu-wasm does x86_64 but wasm32 caps addressable memory at 4 GB and TCG-in-WASM is interpreter-to-JIT-hybrid speed — Win10/11's requirements plus activation/licensing make this unusable-and-unlicensed (INFERRED). Verdict: server-stream-fallback (Windows 365 / AVD / self-hosted QEMU+RDP), or local-native.
- **Modern macOS**: unavailable in any browser form. No practical Apple Silicon system emulation exists; macOS's SLA ties execution to Apple-branded hardware — even AWS implements a **24-hour minimum allocation on dedicated Mac minis/Studios explicitly "to comply with the Apple macOS Software License Agreement"** (VERIFIED, AWS EC2 Mac page). Server-stream on genuine Apple hardware (EC2 Mac, MacStadium, MacinCloud) is the only web-adjacent path (VERIFIED/C for the latter).
- **Modern Linux**: the one genuinely browser-viable modern OS. Options, all real today: v86 (32-bit, Alpine/Arch/Debian demos; BSD-2-Clause; 23k stars) (VERIFIED); **qemu-wasm** (x86_64/AArch64/RISC-V guests; TCI for 32-bit guests **merged into upstream QEMU 10.1**, 64-bit TCI and TCG JIT still under discussion) (VERIFIED, ktock/qemu-wasm README); **CheerpX/WebVM** (Leaning Technologies) executing 32- and 64-bit x86 binaries via a WASM JIT, running full Debian with graphics — but the engine is dual-licensed: free "Community License" for individuals/FOSS/evaluation, paid commercial license otherwise — i.e., **not open source in the OSI sense** (VERIFIED licensing page; characterization INFERRED). Limits everywhere: no real GPU, networking via relays/fetch shims, perf roughly 1–2 orders of magnitude below native (INFERRED). Verdict: browser-capable-with-limits, and the media is fully legal — the only row with zero legal caveats.

## 6. WASI + Component Model reality check

What WASI **is**: a standardized, capability-based system interface (filesystem, clocks, sockets, HTTP…) for *compiled programs* targeting WebAssembly, expressed since 0.2 as Component Model interfaces (WIT). Versions: preview1 (legacy), **0.2 released 2024-01, 0.3.0 released 2026-06-11** adding native async (`async func`, `stream<T>`, `future<T>`) into the Canonical ABI; supported in Wasmtime 43+ and jco (VERIFIED, wasi.dev).

What WASI is **not**: hardware virtualization. A WASI runtime executes one program compiled to wasm against typed capabilities; it cannot boot a Mac OS 8 disk image, has no CPU emulation, no MMU, no framebuffer-as-hardware. Note also that **browsers do not implement WASI natively** — running a WASI component in a page requires a shim/transpiler (e.g., jco, browser_wasi_shim) (INFERRED, standard ecosystem knowledge). Every emulator discussed in this report uses **Emscripten's POSIX-on-web layer, not WASI** (VERIFIED for Infinite Mac's cores and qemu-wasm by build inspection/README).

Where WASI plausibly fits a virtual-OS museum:
- Running *individually ported apps* (a recompiled classic game or tool) as sandboxed components, where you have source — a different exhibit type than booted OSes (PROPOSED).
- Server-side services (thumbnailers, converters, disk-image tooling) in a sandbox (PROPOSED).
- container2wasm emits binaries that run on WASI runtimes *and* browsers — but it does so by embedding a CPU emulator inside the wasm, which proves the point: WASI hosts the emulator; the emulator does the work (VERIFIED, container2wasm README).
- A Component Model WIT interface as a *standardized emulator plugin ABI* (screen, input, disk, audio as typed streams) is attractive but entirely speculative — no project does this today (PROPOSED; UNKNOWN precedent).

## 7. OCI / Docker reality check

An OCI image is layered filesystem + config metadata for a host kernel to execute — **a browser cannot run one, full stop** (analysis). Legitimate roles in a museum architecture:
- **Reproducible build input**: Infinite Mac itself builds all emulator cores inside a Docker Emscripten (`macemu_emsdk`) image (VERIFIED, README) — OCI as the toolchain pin, not the artifact.
- **Server deployment unit** for the streaming fallback tier (Guacamole, Kasm, noVNC stacks all ship as containers) (VERIFIED for guacamole/kasm packaging generally; B/C).
- **Conversion input**: container2wasm (Apache-2.0, ~2.7k stars, active 2026-07) converts an x86_64/riscv64 OCI image into a wasm binary by bundling Bochs (x86_64) or TinyEMU (riscv64), with a `--to-js` QEMU-wasm path for browsers, demos running Debian/Python/Node in-page (VERIFIED, README). Detail owned by another lane; recorded here as the OCI→browser bridge that exists.

## 8. Server-side fallbacks (for the otherwise-impossible rows)

Stack options, all battle-tested: QEMU/KVM with VNC → websockify → **noVNC** (browser client; mixed licensing, core MPL-2.0 — GitHub reports NOASSERTION) (VERIFIED API / INFERRED license detail); SPICE + spice-html5; **Apache Guacamole** (Apache-2.0) as a clientless RDP/VNC/SSH gateway (VERIFIED); Kasm Workspaces for container streaming; WebRTC pipelines (Parsec, Moonlight) when >30 fps matters (INFERRED).

Existing precedents: **DistroSea** streams 100+ Linux/BSD/Haiku/ReactOS distros to browsers free of charge (ThinLinc-based) (VERIFIED, site); OnWorks similar (C-grade); MacinCloud/MacStadium for macOS; Windows 365 for Windows (C-grade). AWS EC2 Mac shows the cost floor for legal macOS: dedicated Apple hardware, per-second billing with a 24-hour minimum (VERIFIED).

Tradeoffs vs. client-side wasm (analysis): latency 50–150 ms and compression artifacts; **cost scales per concurrent user** (a modest always-on VM is tens of $/month, vs. ~zero marginal cost for static chunk hosting — Infinite Mac serves everything from R2 + one Worker); sessions are ephemeral unless you build per-user disk persistence; and it reintroduces a central operator — the opposite of the local-first/archival property that makes the browser-native rows durable. For a museum: streaming is a *fallback tier for Unix workstations and modern Windows/macOS*, never the default.

## 9. Feasibility table

Verdicts: browser-native-practical / browser-capable-with-limits / local-native-required / server-stream-fallback / metadata-only-BYO / unavailable.

| Row | Best runtime today | Verdict | Payload size | RAM (guest+overhead) | Perf | Legal-media status |
|---|---|---|---|---|---|---|
| 68k Mac, System 1–7.5.5 | Mini vMac / Basilisk II / Snow WASM (Infinite Mac) | **browser-native-practical** | core 0.8–1.6 MB; boot streams a few MB of 256 KiB chunks | 0.1–128 MB; trivial | ≥ original hardware; ~3 s cold boot | Apple copyright; some System releases were gratis downloads; ROMs never licensed; openly distributed since 2022 w/o takedown (tolerated) |
| PPC Mac OS 8/9 | SheepShaver WASM (Infinite Mac) | **browser-native-practical** | core 0.7 MB; images 100s of MB, chunk-streamed | 64–256 MB | usable, sub-original but fine for UI/apps | copyrighted, never freed; tolerated distribution |
| Mac OS X 10.0–10.4 (PPC) | DingusPPC (10.0/10.1) / PearPC (10.2–10.4) WASM | **browser-capable-with-limits** | cores ~1–2 MB; images GB-class, streamed | 128–512 MB | slow: ~2 min boot, sluggish desktop; qemu-wasm would roughly double speed (benchmarked) | copyrighted commercial OS; tolerated so far |
| NeXTSTEP / OPENSTEP | Previous WASM (Infinite Mac) | **browser-native-practical** | core 2.8 MB + images | 8–128 MB | paced to original hardware (intentionally) | Apple-owned (via NeXT); ROMs+images openly served; tolerated |
| A/UX 3.1.1 (bonus Unix-on-Mac) | Snow WASM (hidden in Infinite Mac) | **browser-capable-with-limits** (experimental) | core 7.1 MB | ~8–32 MB | early; hidden flag | Apple copyright; tolerated |
| Unix workstations: SPARC/Solaris, SGI/IRIX, HP-UX, AIX | qemu-system-{sparc,hppa,ppc64} / MAME Indy — local only | **local-native-required**; server-stream-fallback for web; else **metadata-only-BYO** | ISO/disk GB-class | 256 MB–4 GB | native QEMU ok for HP-UX 11/AIX-7.2-with-hacks; sun4m Solaris broken per QEMU docs; MAME IRIX slow | Oracle/HPE/IBM retain rights; no redistribution grant; grey-market images |
| PalmOS 1–5 | CloudpilotEmu (POSE + uARM) PWA | **browser-native-practical** | app + 1–16 MB ROMs | tens of MB | full speed, continuous state save | ROMs copyrighted (ACCESS lineage), PalmDB-hosted, tolerated |
| Newton | Leibniz (browser, WIP, NewtonOS 1.x) / Einstein (desktop, OS 2.1) | **local-native-required**, borderline browser-experimental | ROM 4–8 MB | small | Einstein usable; Leibniz WIP | Apple ROM, dump-your-own; Leibniz repo unlicensed |
| WinCE / Windows Mobile | (none credible) | **metadata-only-BYO / unavailable** | — | — | — | Microsoft copyright; no emulator ecosystem to speak of |
| Symbian / N-Gage | EKA2L1 (HLE), desktop+Android | **local-native-required** | app packages small | modest | good for supported titles | OS briefly EPL (2010, withdrawn); apps copyrighted; BYO |
| Early Android (x86 builds) | v86 in browser; qemu-wasm | **browser-capable-with-limits** | 100–300 MB images | 256 MB–1 GB | slow but demonstrated (1.6, 4.4) | **clean: AOSP Apache-2.0 / Android-x86 redistributable** |
| iPhone OS 2–3 apps | touchHLE (HLE), desktop/Android | **local-native-required** (no wasm port) | app binaries MBs | small | good for the short compat list | no Apple firmware needed; **apps** copyrighted → BYO-ipa |
| Modern Windows 10/11 | none in browser; QEMU/KVM + RDP server-side | **server-stream-fallback** | 10s of GB | 4–8 GB+ | fine when streamed | licensed + activation; streaming licenses via MS cloud offerings |
| Modern macOS | none in browser; EC2 Mac / MacStadium | **server-stream-fallback** (Apple hardware only), else **unavailable** | 10s of GB | 8 GB+ | fine when streamed | SLA ties to Apple hardware; AWS enforces 24 h minimum |
| Modern Linux | v86 / qemu-wasm / WebVM(CheerpX) in browser | **browser-capable-with-limits** (and the only fully-legal browser row) | 50 MB–1 GB | up to ~4 GB (wasm32 ceiling) | 1–2 orders below native; fine for CLI/light desktop | fully redistributable (FOSS); CheerpX engine itself dual-licensed/proprietary |

Cross-cutting takeaways: (1) the "little computer pops up" experience is *solved technology* for 68k/PPC Mac, NeXT, and PalmOS — small GPL/MIT wasm cores + chunk-streamed images + OPFS persistence; (2) the binding constraint on every non-Linux row is media licensing, not code — every practical deployment either tolerated-hosts or BYO-media; (3) WASI/OCI are supporting cast (app sandbox, build pinning, conversion), not OS runtimes; (4) the commercial-Unix workstation era is the genuine gap — no browser runtime exists, natively-emulated support is partial, and rights holders still exist, making metadata-only-BYO plus optional streaming the honest design.

## Sources

| URL | What it evidences | Accessed | Grade |
|---|---|---|---|
| https://github.com/mihaip/infinite-mac | Repo: README, architecture, emulator list, Apache-2.0, activity (commit a73d016b 2026-07-26), submodules, funding.yml; code inspection of chunking (256 KiB), OPFS disk-saver, embed-types, net providers, disks/machines defs, ROMs in `src/Data/`, wasm sizes | 2026-07-29 | A/B (repo + shallow-clone code inspection) |
| https://infinitemac.org/about | About/FAQ content (also read as `About.tsx` in repo): emulators, no legality statement, OS X slowness + QEMU issue #72 | 2026-07-29 | A |
| https://blog.persistent.info/2022/03/blog-post.html | Launch: chunked content-addressed streaming, 3 s cold boot, ~13% idle CPU, Emscripten port lineage | 2026-07-29 | A |
| https://blog.persistent.info/2022/07/infinite-mac-networking.html | AppleTalk via Cloudflare Durable Object zones; Marathon/Bolo multiplayer; desync; 1 ms input | 2026-07-29 | A |
| https://blog.persistent.info/2024/03/infinite-mac-nextstep.html | Previous WASM port; NeXTSTEP 0.8–OPENSTEP 4.2; paced-to-hardware perf | 2026-07-29 | A |
| https://blog.persistent.info/2025/03/infinite-mac-os-x.html | OS X 10.0–10.4 via DingusPPC/PearPC; MD5 benchmark incl. qemu-wasm 8 s | 2026-07-29 | A |
| https://blog.persistent.info/2025/07/infinite-mac-embedding.html | /embed endpoint, postMessage API, Infinite Monkey, Safari SAB caveat | 2026-07-29 | A |
| https://www.gryphel.com/c/minivmac/license.html | Mini vMac GPL v2 | 2026-07-29 | A |
| https://github.com/cebix/macemu | Basilisk II/SheepShaver GPL; ROM + MacOS copy required | 2026-07-29 | A |
| https://github.com/twvd/snow | Snow: Rust, hardware-level 68k incl. 68851 PMMU (A/UX), MIT | 2026-07-29 | A |
| GitHub API (api.github.com/repos/...) for dingusdev/dingusppc, sebastianbiallas/pearpc, cloudpilot-emu/cloudpilot-emu, EKA2L1/EKA2L1, pablomarx/Leibniz, copy/v86, container2wasm/container2wasm, novnc/noVNC, apache/guacamole-server | SPDX licenses, stars, last-push dates (all pulled 2026-07-29) | 2026-07-29 | A |
| https://github.com/github/dmca/blob/master/2025/11/2025-11-05-apple.md | Only recent Apple GitHub DMCA is apps.apple.com clone; not emulation-related | 2026-07-29 | A |
| https://cloudpilot-emu.github.io/ | CloudpilotEmu scope: PalmOS 1–4 (POSE) + OS5 uARM/Tungsten E2, state saves, PalmDB ROMs, embed version | 2026-07-29 | A |
| https://github.com/touchHLE/touchHLE | touchHLE: HLE for iPhone OS 2.x/3.0 apps, MPL-2.0/GPLv3, platforms, no wasm, no firmware needed | 2026-07-29 | A |
| https://github.com/ktock/qemu-wasm | qemu-wasm: x86_64/AArch64/riscv64 guests, TB-hotness JIT hybrid, TCI-32bit merged in QEMU 10.1, demos | 2026-07-29 | A |
| https://github.com/copy/v86 | v86: 32-bit-only x86-to-wasm JIT, OS demo list incl. Android-x86 1.6/4.4 and Windows caveats, BSD-2-Clause | 2026-07-29 | A |
| https://webvm.io/ and https://cheerpx.io/ + /docs/licensing | WebVM/CheerpX: x86 (32+64-bit binaries) in wasm, Leaning Technologies, dual license (community free / commercial) | 2026-07-29 | A |
| https://wasi.dev/releases/wasi-p3 | WASI 0.3.0 released 2026-06-11; native async in Component Model; capability interfaces | 2026-07-29 | A |
| https://github.com/container2wasm/container2wasm (via ktock fork README) | OCI→wasm via Bochs/TinyEMU, `--to-js` QEMU path, Apache-2.0, browser demos | 2026-07-29 | A |
| https://www.qemu.org/docs/master/system/target-sparc.html | sun4m emulation "somewhat complete"; older Solaris kernels don't work | 2026-07-29 | A |
| https://www.openpa.net/qemu_pa-risc_emulation.html + astr0baby HP-UX 11.11 writeup | qemu-system-hppa boots HP-UX 11.11; ongoing Deller fixes | 2026-07-29 | C |
| https://lists.gnu.org/archive/html/qemu-ppc/2018-05/msg00387.html + https://gitlab.com/qemu-project/qemu/-/issues/1501 + worthdoingbadly.com/aixqemu/ | AIX 7.2 partial boot on pseries; AIX unsupported upstream; 7.3 fails | 2026-07-29 | B/C |
| https://wiki.preterhuman.net/SGI_emulation + SGUG forums | MAME emulates SGI Indy/Indigo2 running IRIX (native) | 2026-07-29 | C |
| https://eka2l1.github.io/ + repo | EKA2L1 Symbian/N-Gage HLE emulator, platforms, GPL-3.0 | 2026-07-29 | A |
| http://blog.smartphonefanatics.com/newton-os-1-0-emulator-in-your-browser/ + github.com/pguyot/Einstein | Leibniz browser NewtonOS 1.0 (WIP); Einstein desktop, ROM required | 2026-07-29 | C |
| https://distrosea.com/ | Free server-streamed Linux distro test-driving in browser (ThinLinc) | 2026-07-29 | A |
| https://aws.amazon.com/ec2/instance-types/mac/ | EC2 Mac: dedicated Apple hardware, 24 h minimum per Apple SLA | 2026-07-29 | A |
