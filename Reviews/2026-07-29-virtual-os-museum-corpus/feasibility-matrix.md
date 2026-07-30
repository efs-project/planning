# Browser-runtime feasibility matrix — merged verdicts by system class

**Status:** synthesis of the three runtime lanes for the 2026-07-29 Virtual OS Museum deep dive; evidence lives in the lane reports
**Agent:** claude-fable-5 (main session synthesis), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/wasm #topic/games

Merged from [`runtimes-x86.md`](./runtimes-x86.md), [`runtimes-retro.md`](./runtimes-retro.md), and [`runtimes-mac-unix-mobile.md`](./runtimes-mac-unix-mobile.md); every cell is sourced there. The hands-on evidence for the classic-Mac row is in [`hands-on-test-log.md`](./hands-on-test-log.md).

**Verdict taxonomy** (from the mission): `browser-native-practical` / `browser-capable-with-limits` / `local-native-required` / `server-stream-fallback` / `metadata-only-BYO` / `unavailable`.

**Media-legality shorthand:** **CLEAN** = redistributable as of right (FOSS or explicit grant) · **TOLERATED** = copyrighted, distributed openly by existing archives on a forbearance/takedown posture · **BYO** = bring-your-own media is the only clean posture · **ENFORCED** = rights actively enforced.

## The matrix

| # | System class | Best runtime today | Verdict | Engine + media payload | Guest RAM | Perf | Media legality |
|---|---|---|---|---|---|---|---|
| 1 | Early minis (PDP-8/11), EDSAC, IBM 1401 | pdp11-js, PCjs PDPjs, SoCDP-8, EDSAC sims | **browser-native-practical** | <1 MB engine + 1–200 MB disks | low | full speed | **CLEAN for Unix V1–V7/32V (Caldera grant)**; DEC OSes murky; EDSAC/1401 unencumbered |
| 2 | IBM mainframes (S/360→z) | Hercules (native only; no wasm port found) | **local-native-required** / server-stream | n/a | GBs | good native | MVS 3.8j treated as free; later ENFORCED |
| 3 | 8-bit micros (Spectrum, CPC, C64, Apple II) | JSSpeccy 3, chips/tiny8bit, vc64web, Apple2js | **browser-native-practical** (incl. mobile) | 0.2–4 MB + KB media | very low | full speed | Split: **Spectrum/CPC ROMs CLEAN (Amstrad permission)**; C64 via open-roms; Apple II TOLERATED; game media mostly TOLERATED |
| 4 | 16-bit micros (Amiga / Atari ST) | vAmigaWeb / Hatari-emscripten (demo-grade) | Amiga **browser-native-practical**; ST **browser-capable-with-limits** | 3.5 MB / 24 MB + images | moderate | full speed | Kickstart/TOS encumbered; **AROS/EmuTOS CLEAN replacements**; game media TOLERATED |
| 5 | DOS (FreeDOS / MS-DOS) | v86; js-dos v8 for gaming | **browser-native-practical** | 1.8 MB + 0.6–2.4 MB | 16–64 MB | above period hardware | **FreeDOS CLEAN**; MS-DOS TOLERATED/BYO |
| 6 | Windows 3.x | v86 (apps-only: Boxedwine) | **browser-native-practical** | ~1.8 MB + 10–20 MB | 32–64 MB | snappy | TOLERATED/BYO |
| 7 | Windows 95/98 | v86 (FIX95CPU, state-image resume) | **browser-native-practical** (setup quirks) | +50–300 MB | 128 MB | boot minutes cold, seconds from state | TOLERATED/BYO |
| 8 | Windows 2000/XP | v86 (2000 solid; XP fragile) | **browser-capable-with-limits** | 28 MB–2 GB | 128–512 MB | sluggish | TOLERATED/BYO |
| 9 | 68k Mac (System 1–7.5) | Mini vMac / Basilisk II / Snow via Infinite Mac | **browser-native-practical** | 0.8–1.6 MB core + streamed chunks (measured: **1.4 MB to booted System 7**) | ≤128 MB | ≥ original; <2 s boot measured | TOLERATED (ROMs never licensed; openly served since 2022 without takedown) |
| 10 | PPC Mac OS 8/9 | SheepShaver via Infinite Mac | **browser-native-practical** | 0.7 MB core + streamed 100s MB | 64–256 MB | usable | TOLERATED |
| 11 | Mac OS X 10.0–10.4 (PPC) | DingusPPC / PearPC wasm | **browser-capable-with-limits** | 1–2 MB + GB-class streamed | 128–512 MB | ~2 min boot; qemu-wasm ~2× tracked | TOLERATED |
| 12 | NeXTSTEP / OPENSTEP | Previous via Infinite Mac | **browser-native-practical** | 2.8 MB + images | 8–128 MB | paced to original | TOLERATED |
| 13 | Unix workstations (SPARC/Solaris, IRIX, HP-UX, AIX) | qemu-system-* / MAME Indy — native only | **local-native-required**; else metadata-only-BYO / server-stream | GB-class | 256 MB–4 GB | partial even natively | ENFORCED-adjacent (Oracle/HPE/IBM retain rights) |
| 14 | PalmOS 1–5 | CloudpilotEmu (POSE + uARM) PWA | **browser-native-practical** | app + 1–16 MB ROMs | tens of MB | full speed, continuous saves | TOLERATED (PalmDB) |
| 15 | Newton / WinCE / Symbian | Leibniz (WIP) / none / EKA2L1 (desktop) | **local-native-required** or metadata-only-BYO | small | small | varies | BYO |
| 16 | Early Android (x86) | v86 (1.6-r2, 4.4-r2 demonstrated) | **browser-capable-with-limits** | 100–300 MB | 256 MB–1 GB | slow but real | **CLEAN (AOSP/Android-x86)** |
| 17 | iPhone OS 2–3 apps | touchHLE (no wasm port) | **local-native-required** | MBs | small | good for short compat list | no Apple firmware needed; apps BYO |
| 18 | DOS/Win9x gaming (as exhibits) | js-dos v8 (DOSBox-X, 3Dfx) | **browser-native-practical** | 1.8 MB + bundle | 64–512 MB | era-appropriate | shareware CLEAN; commercial TOLERATED (IA precedent) |
| 19 | Arcade | MAME per-driver wasm | **browser-capable-with-limits** (pre-3D) | ~4.5 MB/driver + ROMs | ~256 MB | full speed classics | **worst tier** — ROMs never redistributable; IA darkens items |
| 20 | Consoles (NES→PS1) | EmulatorJS / RetroArch-web | technically capable; for a public museum **metadata-only-BYO** | 0.4 MB + 1–3 MB/core + ROMs | low–mod | good ≤PS1 | ENFORCED; homebrew CLEAN |
| 21 | Modern Linux (the fully-legal modern row) | v86 (32-bit) / qemu-wasm (x86-64) / WebVM (i386 userland) | **browser-capable-with-limits** | 50 MB–1 GB | ≤4 GB (wasm32 ceiling) | 1–2 orders below native | **CLEAN** (CheerpX engine itself proprietary) |
| 22 | Modern Windows 10/11 | none in browser | **server-stream-fallback** / unavailable | 10s GB | 4–8 GB+ | — | ENFORCED |
| 23 | Modern macOS | none in browser (Apple-hardware SLA) | **server-stream-fallback** on Apple hardware / unavailable | 10s GB | 8 GB+ | — | ENFORCED (EC2 Mac 24 h minimum) |

## Browser-requirement split (the deciding constraint after licensing)

| Requirement tier | Runtimes | Consequence for EFS |
| --- | --- | --- |
| **No threads, no SAB, no COOP/COEP** | v86, js-dos, JSSpeccy 3, vc64web, vAmigaWeb, Apple2js, PCjs, pdp11-js, EmulatorJS cores, CloudpilotEmu | Embed anywhere, including first-load guest links and iframes without isolation headers. Rows 1, 3–8, 14, 16, 18–20. |
| **SAB + cross-origin isolation required** | Infinite Mac's cores (measured `crossOriginIsolated === true`), qemu-wasm (PROXY_TO_PTHREAD), WebVM/CheerpX | Needs COOP/COEP on first paint — collides with clientv2's SW-injected-headers-on-repeat-load approach and Safari's cross-origin-iframe SAB gap. Rows 9–12, 21 (partly). |
| **Proprietary/CDN-locked engines** | CheerpX (self-hosting needs commercial license), JSLinux x86-64 (no source) | Cannot be EFS-archived as verifiable packages; exclude or license. |

## The one-sentence verdicts

1. **"Every OS runs in the browser" is false** — and the museum's curator said so himself. What is true: the most *iconic* consumer-computing classes (DOS, Win 3.x–98, classic Mac, Amiga, 8-bits, PalmOS, NeXT, DOS gaming) are browser-native-practical *today* — with early Android and modern Linux close behind as browser-capable-with-limits — on engines that are small, mostly GPL/BSD/MIT, and forkable.
2. The genuine technical gaps are IBM mainframes, commercial Unix workstations, and anything modern-and-proprietary — local-native or server-stream territory, honestly labeled.
3. The binding constraint on almost every desirable row is **media rights, not code**: the legally CLEAN core is FreeDOS + Linux + Unix V1–V7 + Spectrum/CPC + AROS/EmuTOS + Android-x86 + homebrew; everything Apple/Microsoft/Commodore-branded runs on tolerated-hosting or BYO-media postures.
4. VOM's 250+ platforms include hundreds (PERQ, Cray, P8000, mainframes, workstations…) with **no browser emulator at all** — parity of breadth is not achievable in-browser; parity of *the popular core* plus superiority of *access* is.
