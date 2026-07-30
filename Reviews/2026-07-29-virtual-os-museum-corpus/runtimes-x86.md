# Browser Execution of x86 PC Operating Systems — Runtime Survey

**Status:** research-lane report for the 2026-07-29 Virtual OS Museum deep dive; evidence record, not canon
**Agent:** runtimes-x86 (claude-fable-5 workflow), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/wasm #topic/games #topic/content

---

## Scope and method

This lane surveys every serious runtime for executing x86 PC operating systems inside a stock web browser: v86, JSLinux, WebVM/CheerpX, halfix, Boxedwine, qemu-wasm, and container2wasm. Method: GitHub API metadata pulls, README/docs reads (including a shallow clone of v86, webvm, and container2wasm for code inspection), primary project sites, and two live boot tests performed in a real browser on 2026-07-29 (copy.sh/v86 Linux profile; webvm.io Debian). Every load-bearing claim is labeled VERIFIED / INFERRED / UNKNOWN; PROPOSED marks suggestions only.

Key taxonomy used in the final table: browser-native-practical / browser-capable-with-limits / local-native-required / server-stream-fallback / metadata-only or BYO-media / unavailable.

---

## 1. v86 — the workhorse

### Identity, license, maintenance

- Repo `copy/v86`, description "x86 PC emulator and x86-to-wasm JIT, running in the browser". License **BSD-2-Clause**, 23,306 stars, last push 2026-07-05, latest commit `2f1346b0e7d8` (2026-07-05), rolling "latest" release republished 2026-07-05. Actively maintained. (VERIFIED, GitHub API 2026-07-29)
- The live copy.sh deployment reports build version `1e4f43c95` (Jul 3, 2026). (VERIFIED, live page footer)
- Bundled BIOS: SeaBIOS + Bochs VGABIOS binaries ship in the repo under LGPL (`COPYING.LESSER` present in the bios directory). (VERIFIED, repo inspection)

### Architecture

- CPU core written in **Rust**, compiled to `wasm32-unknown-unknown`; x86 machine code is **translated to WebAssembly modules at runtime** (a true x86→wasm JIT, not an interpreter-only design). (VERIFIED, README + docs)
- JIT design (from the project's how-it-works doc, VERIFIED): interpreted mode collects entry points and per-page "hotness"; hot pages are compiled whole (plus up to `MAX_PAGES` reachable pages) into a single wasm function with a large `br_table` dispatch, using the "stackifier" structured-control-flow algorithm. No wasm module linking — module exit/re-entry is handled by the main loop. Paging is fully software-emulated with a 4 MB TLB-like cache and fast/slow path split. Lazy flags speed up arithmetic; FPU uses Berkeley SoftFloat because guest code depends on 80-bit floats ("very slow" per the author, VERIFIED).
- Emulated CPU level: approximately **Pentium 4 with full SSE3**; no 64-bit extensions, missing task gates, some 16-bit protected-mode features, trap flag details. (VERIFIED, README)
- Emulated hardware (VERIFIED, README): 8272A floppy, 8042 kbd/PS2 mouse, 8254 PIT, 8259 PIC, CMOS RTC, VGA/SVGA with Bochs VBE extensions, PCI, IDE + on-the-fly ISO9660 CD generator, NE2000 NIC, VirtIO (filesystem/network/balloon), SoundBlaster 16, Hayes-compatible modem.

### What actually boots

From the README compatibility list (VERIFIED unless noted):

- **DOS:** FreeDOS, MS-DOS 6.22, Windows 1.01 "run very well".
- **Windows 3.x/9x/NT:** "Windows 1, 3.x, 95, 98, ME, NT and 2000 work reasonably well"; Windows 2000+ requires switching HAL from ACPI PC to Standard PC; known boot issues are tracked in half a dozen linked issues; dedicated Windows 9x and Windows NT setup guides exist (install under QEMU with `-M pc,acpi=off`, apply FIX95CPU/patcher9x for 9x CPU-speed bugs, VFD.VXD workarounds for Win95).
- **Windows XP/Vista/8:** "work under certain conditions" (issues #86, #208) — i.e., fragile, not default-supported. (VERIFIED README wording)
- **ReactOS, Haiku, 9front, QNX, KolibriOS, SerenityOS (32-bit only), FreeBSD, OpenBSD (specific boot flags), Android-x86 up to 4.4-r2, Arch Linux 32, Alpine** all work. NetBSD needs a custom kernel.
- **OS/2 does not work. Plan 9 does not work.** (VERIFIED README) BeOS is not mentioned anywhere in the compatibility list; its BeOS-successor Haiku does work. (VERIFIED absence; BeOS status UNKNOWN)

### Sizes, memory, startup

- Runtime download: `v86.wasm` = 1,418,156 bytes + `libv86.js` = 353,762 bytes ≈ **1.8 MB total engine**. (VERIFIED, measured 2026-07-29)
- Demo image sizes on copy.sh (VERIFIED from the site's own listing): FreeDOS 0.6 MB, Windows 1.01 0.7 MB, MS-DOS 2.4 MB, Buildroot Linux 4.9 MB, Arch ~15 MB, FreeBSD ~16 MB, Windows 2000 ~28 MB, Android-x86 ~54 MB. Disk images stream in chunks on demand, with optional zstd-compressed chunk support (`AsyncXHRPartfileBuffer` in the buffer code, VERIFIED code inspection).
- Guest RAM: example configs range 32–512 MB `memory_size` (VERIFIED, examples dir). No documented hard cap; everything must fit in one wasm32 linear memory, so a practical ceiling of well under 4 GB applies (INFERRED).
- **Live boot test (VERIFIED, 2026-07-29):** copy.sh `linux26` profile booted a Buildroot-style Linux 2.6 to an interactive shell in well under 14 seconds total including download (page counter read "Running: 14s" after deliberate waits; kernel timestamps show ~1.05 s guest-time boot), average speed 34.5 mIPS. UI exposes Save State / Load State, screenshot, fullscreen, mouse lock, network capture.
- Windows 9x/2000 boot takes minutes cold; copy.sh mitigates with pre-booted **state images** so profiles resume instantly. (INFERRED from the state-image machinery + MAC-address-translation workarounds documented specifically for Windows/ReactOS profiles, which only matter for restored states — VERIFIED that the mechanism exists and is used by "Windows, ReactOS and SerenityOS profiles")

### Save-state / snapshots

- First-class: `save_state()` / `restore_state()` public API, `initial_state` config option, UI buttons. (VERIFIED, starter code + live UI)
- Restoring a state randomizes the guest MAC; documented workarounds include `preserve_mac_from_state_image`, `mac_address_translation` (ethernet/ipv4/dhcp/arp rewriting), or unloading the NIC driver pre-save. DHCP must re-run post-restore. (VERIFIED, networking doc)

### Networking

Four backends, all documented (VERIFIED, networking doc):

| Backend | Transport | Layer | Needs server? |
|---|---|---|---|
| `inbrowser` | BroadcastChannel between tabs | raw ethernet | no |
| `wsproxy` | WebSocket to a relay (websockproxy, wsnic, node-relay, RootlessRelay…) | raw ethernet | yes |
| `wisp` | WISP protocol (MercuryWorkshop) | TCP payloads only; v86 terminates guest TCP, synthesizes ARP/DHCP/DNS-over-HTTPS/NTP/ICMP-echo | yes (wisp server) |
| `fetch` | browser `fetch()` | HTTP(S) only; CORS-bound unless a CORS proxy is used; guest can reach host localhost via `<port>.external` | optional CORS proxy |

- The fetch and wisp backends give **zero-infrastructure networking** for HTTP workloads straight from a static host; raw-socket realism requires a WebSocket relay server. (VERIFIED)

### Filesystem, threading, mobile

- **9p filesystem** over virtio: JSON-indexed, HTTP on-demand file loading into an in-memory FS; a Linux guest can mount it or even boot with `root=host9p`. Host-side `create_file`/`read_file` API for file exchange. (VERIFIED, filesystem doc)
- **No SharedArrayBuffer, no COOP/COEP, no threads required**: zero grep hits for SharedArrayBuffer/COOP/COEP across the entire repo; the emulator runs in a single Web Worker. This means v86 embeds cleanly in pages that cannot set cross-origin-isolation headers. (VERIFIED grep; significance INFERRED)
- Audio via SB16 + Web Audio; pointer lock optional ("Lock mouse" in UI); WebGL not required (canvas 2D text/graphics). (VERIFIED UI + repo; WebGL non-requirement INFERRED from absence)
- Mobile: keyboard code contains explicit handling for "mobile browsers and virtual keyboards". (VERIFIED code comment) Practical mobile usability is fair for keyboard-light guests (INFERRED).
- Determinism: no documented record/replay or determinism guarantee; state images give reproducible resume points but wall-clock/RTC and network make runs non-deterministic. (UNKNOWN as a feature; reasoning INFERRED)

### Legal / media

- The emulator itself is BSD-2-Clause and freely redistributable. (VERIFIED)
- copy.sh publicly serves MS-DOS 6.22 and Windows 1.01/95/98/ME/2000 images; the README credits WinWorld and OS/2 Museum as "sources of some old operating systems" — i.e., abandonware archives, **not** licensed redistribution. Old Microsoft OSes remain copyrighted; unavailability for sale does not make them redistributable. A museum hosting these is assuming the same legal posture as WinWorld. (VERIFIED credits; legal characterization INFERRED)
- FreeDOS, Linux distros, ReactOS, Haiku, KolibriOS etc. are freely redistributable under their FOSS licenses. (VERIFIED licenses of those projects at the ecosystem level)

---

## 2. JSLinux — Bellard's tech demo, not an open-source product

- Site: bellard.org/jslinux, © 2011-2026 Fabrice Bellard. (VERIFIED)
- **Current VM list (VERIFIED, 2026-07-29):** x86_64 Alpine 3.23.2 console 256 MB (with AVX-512 and APX); x86 Alpine 3.12 console 192 MB and X Window 256 MB; **Windows 2000 graphical 192 MB**; FreeDOS VGA text 64 MB; riscv64 Buildroot and Fedora 33 (console + X).
- **News timeline (VERIFIED, news page):** 2026-01-12 "JSLinux now supports 64 bit x86"; 2026-03-09 added AVX2/AVX-512/APX — "JSLinux is currently the only public full system x86 emulator supporting APX"; 2021-01-09 nested virtualization via the Linux KVM API inside the emulator.
- Technology (VERIFIED, tech notes): based on TinyEMU, compiled to JS/WASM with **emscripten**; devices are mostly VirtIO (console/9P/net/block/input) plus 8259/8254/RTC/PCI and optional IDE/PS2/VGA; ~100 MIPS on a 2017 desktop in Firefox (dated figure); networking is a **websocket VPN capped at 40 kB/s, two connections per IP** (VERIFIED FAQ); file import/export via UI arrow + `export_file`.
- **Source availability — the critical nuance:** TinyEMU (MIT license, VERIFIED) was last released **2019-12-21** and contains the RISC-V and 32-bit x86 emulators; the tech notes say only that RISC-V source "is available in the TinyEMU project". The 2026 x86_64/AVX-512/APX emulator **postdates the last TinyEMU release by six years and has no published source**; no license or source link exists on the site for it. JSLinux as deployed today is therefore **proprietary with a partially source-available ancestor** — "open source" is the wrong label; even "source available" only covers the obsolete components. (VERIFIED facts; conclusion INFERRED)
- No save-state/snapshot feature documented (UNKNOWN/absent). Browser requirements are modest — it predates SharedArrayBuffer requirements; no COOP/COEP needed (INFERRED from age and lack of any such documentation; not directly tested).
- Windows 2000 hosted by Bellard is the same unauthorized-redistribution posture as copy.sh's Windows images. (INFERRED)
- Museum takeaway: JSLinux cannot be self-hosted or forked for the x86_64 experience; it is a reference point and a dependency risk, not a building block. (INFERRED)

---

## 3. WebVM / CheerpX — best UX, hardest dependency

### Identity and versions

- `leaningtech/webvm` repo: **Apache-2.0**, 17,081 stars, last push 2026-06-12, package version 2.0.0. (VERIFIED, API + package.json)
- **CheerpX engine: proprietary** (npm license field: "SEE LICENSE IN LICENSE.txt"); npm `@leaningtech/cheerpx` latest **1.3.5, published 2026-06-12** (1.3.0 2026-04-29 → 1.3.5 cadence shows active development). (VERIFIED, npm registry API)
- CheerpX docs describe a two-tier engine: interpreter + "sophisticated JIT compiler" generating WebAssembly for hot code, handling self-modifying code; a virtual block-based filesystem; and a **Linux syscall emulator** — i.e., user-mode virtualization: no guest kernel boots. (VERIFIED docs; architectural significance INFERRED — startup is fast precisely because there is no kernel boot, and consequently it can never run Windows, kernels, or drivers.)

### The 32-bit surprise

- **CheerpX executes 32-bit x86 binaries only.** The docs overview says support covers "32-bit x86 native binaries"; the npm/docs state 64-bit is a future plan; the live webvm.io banner says "execution of x86 binaries" (not x86-64). The widely repeated framing of WebVM as "x86-64 in the browser" is wrong as of 2026-07-29 — WebVM's "unmodified Debian" is an **i386 userland**. (VERIFIED across three primary sources + live banner; contradicts the lane brief's own assumption)

### Live test

- webvm.io reached an interactive bash prompt (`user@:~$`, Debian, xterm.js UI with sidebar for networking/CPU/disk) in roughly 30 seconds cold including engine + initial disk chunks on a fast connection. (VERIFIED, live 2026-07-29; keyboard input injection into the backgrounded tab failed in our harness, so no in-guest commands were captured — interaction quality beyond the prompt is INFERRED from prior public reports)

### Disk, storage, and the CDN question

- Public webvm.io config points the root disk at `wss://disks.webvm.io/debian_buster_large_permis_fixed_01-06-2026.ext2` with backend type `"cloud"` — **disk blocks stream over WebSocket from Leaning Technologies' backend**. (VERIFIED, config file in repo)
- Self-hosted forks use `"bytes"` backend with a local `.ext2` file; the official `debian_mini` image is exactly **629,145,600 bytes (600 MiB)** (VERIFIED via HTTP HEAD on the GitHub release asset). Larger images are "too large for GitHub Pages". Custom images build via Dockerfile → ext2 in a GitHub Action. (VERIFIED, README + workflow)
- Storage devices available to CheerpX apps: DataDevice, HttpBytesDevice, IDBDevice (IndexedDB persistence), OverlayDevice, WebDevice. (VERIFIED docs; the public WebVM persists writes via an IndexedDB overlay — INFERRED from device list, not directly traced)
- **What breaks if Leaning Technologies disappears:** (1) the Community License only grants "unlimited, unmetered use of CheerpX from the `cxrtnc.leaningtech.com` domain" — the engine loads from their CDN; (2) **"If you wish to self-host CheerpX, you will need a Commercial License"**; (3) the public disk backend is their infrastructure. So an Apache-licensed WebVM fork dies with the CDN unless a commercial self-hosting license was obtained beforehand. This is the single most fragile dependency of any runtime in this survey. (VERIFIED license terms; failure analysis INFERRED)
- License tiers (VERIFIED, licensing page): free Community License for individuals ("any personal projects, whether they generate income or not"), one-person companies, FOSS projects, and technical evaluations, with credit required; organizations, teams, self-hosting, redistribution/OEM require the Commercial License.

### Networking and requirements

- Networking is **Tailscale-over-WebSockets**: join a tailnet, use an exit node for general internet; ICMP/ping unavailable; Headscale (self-hosted control server) supported behind a CORS-adding proxy; auth keys passed in the URL fragment. (VERIFIED, README)
- Requires **cross-origin isolation**: the repo's nginx config sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` on all responses — i.e., SharedArrayBuffer/threads are needed. This constrains embedding (no third-party iframes without CORP cooperation). (VERIFIED nginx.conf; SAB implication INFERRED)
- Graphical: alpine.html variant runs Alpine + Xorg + i3 with KMS-style framebuffer display. (VERIFIED README; rendering path details UNKNOWN)
- RAM footprint for the Debian terminal workload: not published; wasm32 constrains the tab to <4 GB. (UNKNOWN; ceiling INFERRED)

---

## 4. halfix — dormant, but the only OS/2-in-browser claim

- `nepx/halfix`, **GPL-3.0**, 781 stars, last commit `37a2d1394617` **2021-01-28** — effectively unmaintained for 5+ years. (VERIFIED, API)
- C99 emulator, dual-target: native and browser via **Emscripten** (asm.js and wasm). (VERIFIED README)
- Claimed guests (VERIFIED README wording; not independently reproduced): all DOS versions, "most Windows versions (excluding Windows 8)", **OS/2 Warp 3 and 4.5** — notable because v86 explicitly cannot boot OS/2 — plus ReactOS, Damn Small Linux, Red Star OS 2, Buildroot, Ubuntu, 9front, NeXTSTEP.
- Performance per its own README: "70-100 MIPS native, 10-30 MIPS browser"; "timing is completely off". (VERIFIED quote)
- Demo: nepx.github.io/halfix-demo (VERIFIED link; live status UNKNOWN — not tested).
- Museum takeaway: candidate donor code or revival target for an OS/2 exhibit; not a dependable runtime today. (PROPOSED)

---

## 5. Boxedwine — Windows apps without Windows

- `danoon2/Boxedwine`, **GPL-2.0**, 1,062 stars, extremely active: last commit 2026-07-28 (the day before this survey), release **26R1.0 (2026-04-22)**, prior 25R1.0 (2025-09-13). (VERIFIED, API)
- Architecture: runs a 32-bit **Wine** (selectable versions 1.6–5.0) on an **emulated Linux kernel + emulated x86 CPU** written in C++/SDL; therefore runs 16-bit and 32-bit Windows programs **with no Microsoft code at all** — this sidesteps the OS-media legal problem entirely for the app-runner use case. (VERIFIED README/site; legal significance INFERRED)
- Browser build via Emscripten (wasm and asm.js). Its own docs concede: "Emscripten/Web Boxedwine is still slow, need to implement a JIT" (the JIT/binary-translation cores are native-only); multi-threaded browser build "studders with sound". 26R1 was "50% faster for all platforms **except WASM**". (VERIFIED quotes)
- Live demo catalog at boxedwine.org includes 10 browser demos: Age of Empires (1997), Caesar III, 3-D Ultra Pinball, Full Tilt! Pinball, Marble Drop, Return of Arcade, AbiWord 2017, and Win 3.x titles (Castle of the Winds, Klotz, Lander). (VERIFIED site listing; in-browser performance of these demos UNKNOWN — not tested)
- OpenGL/Direct3D/Vulkan app support exists on native; browser is GDI/DirectDraw-era practical. (VERIFIED claims; browser graphics ceiling INFERRED)
- Museum takeaway: the legally cleanest way to exhibit *Windows software* (as opposed to Windows itself) in a browser, at interpreter speeds. Game content itself remains copyrighted. (INFERRED)

---

## 6. qemu-wasm — real QEMU, real kernels, heavyweight

- `ktock/qemu-wasm`, a patched QEMU tree ("experimental software"); repo license is QEMU's (COPYING/COPYING.LIB — GPLv2 core); 350 stars; last commit `0ef7b4e2814b` 2025-09-04. (VERIFIED, API + README)
- Built with **Emscripten**; flags in the official build recipe: `-pthread -sPROXY_TO_PTHREAD -sASYNCIFY=1 -sTOTAL_MEMORY=2300MB -matomics -mbulk-memory`, mimalloc, xterm-pty console. Threads ⇒ SharedArrayBuffer ⇒ **COOP/COEP cross-origin isolation required**. Note the 2300 MB fixed linear memory — a Chrome-tab-scale RAM commitment per VM. (VERIFIED flags; header implication INFERRED)
- Execution engine: adds a **TCG backend emitting WebAssembly** — each hot Translation Block (~1000 executions) becomes its own `WebAssembly.Module`; everything else runs on TCI (the IR interpreter), because "browsers don't look like capable of creating thousands of modules". Multi-Threaded TCG is enabled. (VERIFIED, README "How does it work")
- **Upstreaming status (VERIFIED, README, checked against its links):** Wasm/Emscripten TCI host for 32-bit guests **upstreamed in QEMU 10.1**; TCI for 64-bit guests under discussion (patch series Aug 2025); TCG-to-wasm JIT under discussion (patch series Aug 2025). Browser support is becoming a first-class QEMU target rather than a fork novelty.
- Demonstrated guests: x86_64 Linux (busybox, Alpine), AArch64 (Raspberry Pi 3), riscv64 Linux; examples also cover **networking** (in-browser `c2w-net-proxy.wasm` fetch-based HTTP(S) proxy that terminates TLS in the browser, or host-side `c2w-net` WebSocket relay), **virtfs** file sharing, and **VM migration from native QEMU into the browser** — a snapshot-equivalent workflow. (VERIFIED, examples index + networking README)
- Performance: no published MIPS figures; hybrid TCI+JIT with per-TB module creation is decisively slower than v86's page-batched JIT for x86 guests, but it is the only maintained path that executes **x86-64 kernels** in a browser today. Boot of the busybox demo is tens of seconds; full distros take minutes. (UNKNOWN hard numbers; characterization INFERRED)
- Demo: ktock.github.io/qemu-wasm-demo. (VERIFIED link)

---

## 7. container2wasm — "Docker in the browser" is CPU emulation in a trench coat

- Moved to its own org: `container2wasm/container2wasm` (the old `ktock/` path now near-empty — API shows 3 stars there vs 2,746 at the org repo). **Apache-2.0**, latest release **v0.8.4 (2026-03-16)**, last push 2026-07-17. (VERIFIED, API)
- What it does (VERIFIED, README): `c2w` converts an OCI/Docker image into a WASM blob that boots **a real Linux kernel + runc + the container rootfs on an emulated CPU**: patched **Bochs** (LGPL-2.1) for x86_64 images, patched **TinyEMU** (MIT) for riscv64, compiled with wasi-sdk for WASI runtimes (wasmtime, wamr, wazero, wasmer, wasmedge) and with emscripten (via **QEMU Wasm**, `--to-js`) for browsers. Non-x86_64/riscv64 images run under *additional* qemu-user binfmt emulation inside the emulated machine — double emulation.
- Browser networking (VERIFIED, README): `?net=browser` runs a gvisor-tap-vsock-derived network stack (`c2w-net-proxy`) inside the page forwarding HTTP/HTTPS through fetch (CORS-restricted; TLS re-terminated in the browser), or `?net=delegate=ws://…` relays all packets to a host-side `c2w-net` daemon over WebSocket.
- Sizes from the official demo (VERIFIED, demo page): x86_64 images 130–200 MB (python 146 MB), riscv64 78–136 MB (python 90 MB) — "compiled as WASI images and run on browser via polyfill".
- Performance reality: the project itself recommends x86_64/riscv64 images and warns everything else is slow; Bochs is a classic interpreter, so x86_64 container execution is interpreter-speed (order tens of MIPS at best), fine for `python`/`vim` demos, painful for compilers or servers. Startup in browsers runs tens of seconds to minutes. (README warning VERIFIED; speed characterization INFERRED — no benchmarks published)
- What it proves: full Docker semantics (real kernel, real runc) are achievable in a browser tab with zero server, but only by paying full-system-emulation costs; it is packaging innovation, not execution innovation. The interesting museum angle is its determinism: a converted image is a single frozen artifact whose behavior is self-contained (network aside). (INFERRED)

---

## 8. Cross-cutting findings

### Browser feature requirements matrix

| Runtime | Threads/SAB | COOP/COEP | WebGL/GPU | Audio | Pointer lock | Persistent storage | Works from a dumb static host? |
|---|---|---|---|---|---|---|---|
| v86 | **No** (single worker) (VERIFIED) | **Not required** (VERIFIED) | No (2D canvas) | SB16 → Web Audio | Optional | manual save-states; 9p in-memory | **Yes** |
| JSLinux | No (INFERRED) | Not required (INFERRED) | No | UNKNOWN | No | none documented | n/a — cannot be self-hosted at all |
| WebVM/CheerpX | **Yes** | **Required** (VERIFIED nginx.conf) | No (canvas fb) | UNKNOWN | For Xorg variant (INFERRED) | IndexedDB overlay (INFERRED) | Only while Leaning CDN exists (VERIFIED license) |
| halfix | No (INFERRED) | Not required (INFERRED) | No | UNKNOWN | UNKNOWN | UNKNOWN | Yes (GPL, self-hostable) |
| Boxedwine (wasm) | Optional MT build (buggy audio) (VERIFIED) | For MT build (INFERRED) | No (software GDI) | Yes (stutters MT) | UNKNOWN | Emscripten FS (INFERRED) | Yes |
| qemu-wasm | **Yes** (PROXY_TO_PTHREAD) (VERIFIED) | **Required** (INFERRED from flags) | No | UNKNOWN | UNKNOWN | via virtfs/images | Yes (GPL) — but 2.3 GB memory config |
| container2wasm | Depends on runtime path; emscripten path = qemu-wasm reqs (VERIFIED) | ditto | No | No | No | No (frozen image) | Yes |

The stark split: **v86 needs nothing special; the QEMU-derived and CheerpX stacks need cross-origin isolation.** For a museum embedding exhibits in iframes or third-party pages, that is the deciding architectural constraint after licensing. (INFERRED synthesis)

### License / media obstacles

- Engines: v86 BSD-2; halfix GPL-3; Boxedwine GPL-2; qemu-wasm GPL-2 (QEMU); container2wasm Apache-2 (bundling LGPL Bochs, MIT TinyEMU, GPL Linux/GRUB — the *generated* blobs carry copyleft components, VERIFIED README acknowledgement). CheerpX proprietary (CDN-only without commercial license). JSLinux x86_64 emulator proprietary/unreleased. (VERIFIED)
- Guest media: FreeDOS/Linux/ReactOS/Haiku/KolibriOS freely redistributable. **All Microsoft OSes (DOS 6.22 through Windows 11) and OS/2 remain copyrighted and are not legally redistributable**; copy.sh, JSLinux, and Internet-Archive-style sites ship them anyway via abandonware sourcing (WinWorld, OS/2 Museum credited by v86 itself). A museum must choose: BYO-media flows, the WinWorld posture, or FOSS-guest-only exhibits. (VERIFIED facts; posture analysis INFERRED)
- Boxedwine is the loophole for *application* exhibits: Wine replaces Windows, so only the app binary's copyright matters. (INFERRED)

### Determinism / reproducibility

- None of the seven ships documented deterministic replay. Closest approximations: v86 state images (byte-exact resume points, VERIFIED feature), qemu-wasm native→browser migration (VERIFIED feature), container2wasm frozen images (INFERRED property). Timers, RTC, and networking break run-to-run determinism everywhere. (INFERRED)
- Reproducible builds: v86, Boxedwine, qemu-wasm, container2wasm are buildable from source (Docker recipes provided, VERIFIED); WebVM's UI is, but its engine is not; JSLinux is not buildable at all. (VERIFIED)

---

## 9. Feasibility table

Columns: best runtime today / browser-native verdict / size (engine + representative image) / guest RAM / perf / legal-media status.

| Guest | Best runtime | Verdict | Download size | RAM | Perf | Legal media |
|---|---|---|---|---|---|---|
| **DOS (FreeDOS / MS-DOS)** | v86 | **browser-native-practical** (VERIFIED live-class) | ~1.8 MB engine + 0.6–2.4 MB image (VERIFIED) | 16–64 MB | Faster than period hardware; instant boot (VERIFIED/INFERRED) | FreeDOS: fully redistributable. MS-DOS: **BYO-media** (abandonware posture common but unlicensed) (VERIFIED/INFERRED) |
| **Windows 3.x** | v86 (apps-only alternative: Boxedwine Win3.x titles) | **browser-native-practical** (VERIFIED README + demos) | ~1.8 MB + ~10–20 MB image (INFERRED from neighbors on copy.sh listing) | 32–64 MB | Snappy at 30+ mIPS (INFERRED from measured v86 speed) | **BYO-media / not redistributable** (Windows 3.x still MS-copyrighted) |
| **Windows 95/98** | v86 (with FIX95CPU/patcher9x, state-image resume) | **browser-native-practical**, with documented setup quirks (VERIFIED docs) | ~1.8 MB + ~50–300 MB image; state images enable instant resume (INFERRED sizes) | 128 MB | Usable; boot minutes cold, seconds from state (INFERRED) | **BYO-media / not redistributable**; copy.sh hosts anyway (VERIFIED) |
| **Windows 2000/XP** | v86 (2000 solid on Standard-PC HAL; XP "under certain conditions"); JSLinux also demos Win2000 | 2000: **browser-capable-with-limits**; XP: **browser-capable-with-limits** (fragile) (VERIFIED README wording) | ~28 MB (copy.sh 2000 listing, VERIFIED) to 500 MB–2 GB real installs (INFERRED) | 128–512 MB | Sluggish but interactive; XP setup unreliable (VERIFIED wording/INFERRED) | **BYO-media / not redistributable** |
| **Modern Linux x86 (32-bit)** | v86 (Alpine/Arch32/Buildroot; 9p rootfs; fetch/wisp networking) | **browser-native-practical** for console + light X (VERIFIED live: shell in <14 s) | 1.8 MB + 5–55 MB (VERIFIED listing) | 256–512 MB | 30–100 mIPS class (VERIFIED measurement + JSLinux figure) | Fully redistributable (FOSS) |
| **Modern Linux x86-64** | Userland-only: WebVM/CheerpX (but engine is **32-bit-only** — its Debian is i386, VERIFIED). Real x86-64 kernel: qemu-wasm (GPL, heavy) or JSLinux (proprietary) | **browser-capable-with-limits** (VERIFIED components; verdict INFERRED) | WebVM: 600 MiB mini image, streamed (VERIFIED). qemu-wasm: 100–500 MB (INFERRED). c2w: 130–200 MB (VERIFIED) | WebVM <4 GB tab; qemu-wasm configured at 2.3 GB (VERIFIED flag) | WebVM: near-usable dev shell (~30 s to prompt, VERIFIED). qemu-wasm/Bochs: interpreter-class, minutes to boot (INFERRED) | FOSS guests redistributable; **CheerpX engine is the non-free component** (VERIFIED) |
| **Modern Windows 10/11** | None demonstrated. qemu-wasm is the only theoretically capable engine (x86-64 + ACPI), but 2.3 GB wasm memory vs Win10's 2–4 GB floor, TCI-dominated speed, and TPM/activation make it unexhibitable; no public instance found (UNKNOWN — none located; analysis INFERRED) | **local-native-required / server-stream-fallback**; in-browser: **unavailable** today | n/a (10+ GB media) | 4 GB+ (exceeds wasm32) | n/a | **Not redistributable**; licensing actively enforced (INFERRED) |

### Contradictions of common assumptions worth carrying forward

1. "WebVM = x86-64 in the browser" is false: CheerpX executes 32-bit x86 only; 64-bit is a roadmap item. (VERIFIED)
2. "JSLinux is open source because Bellard" is false for the current deployment: the 2026 x86_64/AVX-512/APX emulator has no released source; TinyEMU (MIT) froze in 2019. (VERIFIED/INFERRED)
3. "Browser VMs need SharedArrayBuffer" is false for the single most capable retro runtime: v86 needs neither threads nor COOP/COEP. (VERIFIED)
4. "Docker in the browser" (container2wasm) is full-system CPU emulation (Bochs/TinyEMU/QEMU) around an unmodified container — a packaging achievement at interpreter speeds, not a new execution tier. (VERIFIED mechanism)
5. OS/2 — unbootable in maintained runtimes (v86 explicitly "doesn't work"); the only claim is 5-years-dormant halfix. (VERIFIED)
6. qemu-wasm is quietly becoming upstream QEMU capability (wasm TCI host merged in QEMU 10.1), so the "fork risk" objection is fading. (VERIFIED)

---

## Sources

| URL | What it evidences | Accessed | Grade |
|---|---|---|---|
| https://api.github.com/repos/copy/v86 (+commits, releases) | v86 license BSD-2, stars, 2026-07-05 activity, commit `2f1346b0e7d8` | 2026-07-29 | A |
| https://github.com/copy/v86 (README) | v86 architecture, guest compatibility list, OS/2/Plan9 non-support, Windows caveats | 2026-07-29 | A |
| copy/v86 shallow clone: docs/how-it-works.md, docs/networking.md, docs/filesystem.md, docs/windows-9x.md, docs/windows-nt.md, src/buffer.js, src/browser/keyboard.js, bios/ | JIT design, 4 network backends, WISP/fetch details, 9p FS, state-image MAC workarounds, zstd chunk streaming, mobile keyboard handling, SeaBIOS bundling; zero SAB/COOP/COEP hits | 2026-07-29 | B |
| https://copy.sh/v86/ | live demo catalog + image sizes, UI features (save/load state, mouse lock) | 2026-07-29 | A |
| Live boot test of copy.sh/v86/?profile=linux26 (browser pane) | Linux shell in <14 s incl. download, 34.5 mIPS avg, build `1e4f43c95` (Jul 3 2026) | 2026-07-29 | B |
| https://copy.sh/v86/build/v86.wasm, …/libv86.js (measured) | engine size 1,418,156 + 353,762 bytes | 2026-07-29 | B |
| https://bellard.org/jslinux/ | current VM list incl. x86_64 Alpine 3.23.2 (AVX-512/APX), Win2000, riscv64; © 2011-2026 Bellard | 2026-07-29 | A |
| https://bellard.org/jslinux/news.html | 2026-01-12 x86_64 support; 2026-03-09 AVX-512/APX ("only public full system x86 emulator supporting APX") | 2026-07-29 | A |
| https://bellard.org/jslinux/tech.html | TinyEMU basis, emscripten build, device list, ~100 MIPS (2017), websocket VPN, 9P | 2026-07-29 | A |
| https://bellard.org/jslinux/faq.html | 40 kB/s VPN cap, file import/export, no license/source statements for deployed emulator | 2026-07-29 | A |
| https://bellard.org/tinyemu/ | TinyEMU MIT license, last release 2019-12-21, riscv+x86 scope | 2026-07-29 | A |
| https://api.github.com/repos/leaningtech/webvm | Apache-2.0, 17k stars, push 2026-06-12 | 2026-07-29 | A |
| https://github.com/leaningtech/webvm (README) | Debian userland, Tailscale networking, GH-Pages self-hosting, image size limits, no-ICMP | 2026-07-29 | A |
| leaningtech/webvm shallow clone: config_public_terminal.js, nginx.conf, package.json | `wss://disks.webvm.io/debian_buster_large_permis_fixed_01-06-2026.ext2` cloud disk; COOP/COEP headers; cheerpx "latest" dep | 2026-07-29 | B |
| https://cheerpx.io/docs/overview | CheerpX 32-bit x86 only, interpreter+JIT, syscall emulator, device/back-end list | 2026-07-29 | A |
| https://cheerpx.io/docs/licensing | Community License terms: CDN-only, self-hosting requires Commercial License, individual/one-person-company scope | 2026-07-29 | A |
| npm registry API for @leaningtech/cheerpx | v1.3.5 published 2026-06-12; proprietary license field | 2026-07-29 | A |
| HTTP HEAD github.com/leaningtech/webvm/releases/download/ext2_image/debian_mini_20230519_5022088024.ext2 | mini image exactly 629,145,600 bytes | 2026-07-29 | B |
| Live test of https://webvm.io | bash prompt ~30 s cold; banner "execution of x86 binaries"; sidebar UI | 2026-07-29 | B |
| https://labs.leaningtech.com/blog/cx-10 (via search) | CheerpX 1.0 positioning; 64-bit named as future work | 2026-07-29 | C |
| https://api.github.com/repos/nepx/halfix | GPL-3.0, last commit 2021-01-28 (dormant) | 2026-07-29 | A |
| https://github.com/nepx/halfix (README) | OS/2 Warp 3/4.5, NeXTSTEP, "most Windows" claims; 10-30 MIPS browser; Emscripten | 2026-07-29 | A |
| https://api.github.com/repos/danoon2/Boxedwine | GPL-2.0, commit 2026-07-28, releases 26R1.0/25R1.0 | 2026-07-29 | A |
| https://github.com/danoon2/Boxedwine (README) | Wine 1.6–5.0 on emulated kernel/CPU; wasm "still slow, need to implement a JIT"; MT audio stutter | 2026-07-29 | A |
| https://www.boxedwine.org/ and /demo/ | browser demo catalog (Age of Empires, Caesar III, etc.) | 2026-07-29 | A |
| https://api.github.com/repos/ktock/qemu-wasm | 350 stars, last commit `0ef7b4e2814b` 2025-09-04 | 2026-07-29 | A |
| https://raw.githubusercontent.com/ktock/qemu-wasm/master/README.md | TB→wasm-module JIT + TCI hybrid, emscripten flags (2300MB, pthread/PROXY_TO_PTHREAD), upstreaming: TCI-32 merged QEMU 10.1, TCI-64 + TCG under discussion; demo link; "v86 64bit not supported as of Nov 2024" | 2026-07-29 | A |
| https://raw.githubusercontent.com/ktock/qemu-wasm/master/examples/networking/README.md | c2w-net-proxy fetch stack (in-browser TLS termination) and c2w-net WebSocket relay | 2026-07-29 | A |
| https://api.github.com/repos/container2wasm/container2wasm | Apache-2.0, 2,746 stars, v0.8.4 (2026-03-16), org migration (ktock repo now 3 stars) | 2026-07-29 | A |
| container2wasm/container2wasm shallow clone: README.md | Bochs(x86_64)/TinyEMU(riscv64)/QEMU-wasm architecture, runc-in-emulated-Linux, networking modes, bundled-license inventory, "other platforms slow" warning | 2026-07-29 | B |
| https://ktock.github.io/container2wasm-demo/ | demo image sizes: x86_64 130–200 MB, riscv64 78–136 MB, WASI-via-polyfill note | 2026-07-29 | A |
