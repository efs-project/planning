# Retro Runtimes in the Browser: Micros, DOS, Arcade, Consoles, Mainframes

**Status:** research-lane report for the 2026-07-29 Virtual OS Museum deep dive; evidence record, not canon
**Agent:** runtimes-retro (claude-fable-5 workflow), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/games #topic/wasm #topic/content

---

## 1. Executive summary

Browser execution of pre-1995 computing is a solved problem for almost everything smaller than a 32-bit workstation. The Internet Archive has been running MAME/DOSBox-derived emulators in browsers at six-figure item scale for over a decade (VERIFIED, §2). Best-of-breed single-system emulators (JSSpeccy 3, vc64web, vAmigaWeb, js-dos v8, PCjs) are dramatically better than the IA's generic stack: smaller payloads (0.2–3.5 MB wasm), snapshots, touch/PWA support, and in some cases legally clean ROMs. The hard cases are not technical but legal (arcade ROMs, console ROMs, Kickstart/TOS/C64 ROMs) — with three notable islands of legal cleanliness: Amstrad's blanket ROM permission for Spectrum/CPC (VERIFIED), free ROM replacements (AROS, EmuTOS, MEGA65 open-roms) (VERIFIED), and the Caldera Ancient UNIX license making PDP-11 UNIX V1–V7/32V freely redistributable (VERIFIED, license text read in full). IBM-mainframe emulation (Hercules) has no browser port found and remains local-native or server-side (UNKNOWN/none found, §9.3).

---

## 2. Internet Archive: Emularity + the software collections

### 2.1 The loader stack

- **Emularity** (github db48x/emularity) is a JavaScript loader framework, GPL-3.0, by Daniel Brooks et al. It downloads emulator + software files, arranges a BrowserFS filesystem, builds runtime arguments, shows the progress/logo screen, and manages fullscreen (VERIFIED). It drives: **MAME** builds ("over 1,000 different machines" per its README), **EM-DOSBox** (standard and sync variants), **Scripted Amiga Emulator (SAE)** (VERIFIED), and per its latest commit also **Mini vMac** (`vmac_disk_N` parameters added alongside `emulator_ext`) (VERIFIED).
- Maintenance is quiet: last commit `3cbca38`, 2024-01-27 (vMac multi-disk support) (VERIFIED via GitHub API). The stack still runs in production but the loader itself is essentially frozen (INFERRED).
- MAME's own docs recommend Emularity as the HTML loader for Emscripten builds (VERIFIED, docs.mamedev.org).

### 2.2 How items are structured (metadata precedent)

Two layers, both verified by reading live item metadata:

1. **Item metadata** (per software title). Example `msdos_Oregon_Trail_The_1990`: `emulator: "dosbox"`, `emulator_ext: "zip"`, `emulator_start: "oregont/OREGON.EXE"`, collections `softwarelibrary_msdos_games`, `stream_only`, `emulation`, … (VERIFIED). Arcade example `arcade_choplift`: `emulator: "choplift"` (the MAME driver name doubles as the emulator id), `emulator_ext: "zip"`, `mediatype: software`, collections `internetarcade` + `stream_only` — and the ROM zip is not in the public file listing; `stream_only` items are playable but not downloadable (VERIFIED).
2. **Engine items** (per emulator build). `emularity_engine_v1` contains one small JSON per machine/driver plus gzipped wasm builds. `pacman.json`: `{"name":"Pac-Man","arcade":"1","bios_filenames":[""],"peripherals":[""],"native_resolution":[224,288],"driver":"pacman","wasmjs_filename":"mamepacman.js.gz","wasm_filename":"mamepacman.wasm.gz","file_locations":{...}}` (VERIFIED, file fetched). This is a clean precedent for machine-definition metadata: driver id → binary artifact mapping + display hints, kept separate from the software items.

Measured engine sizes: `mamepacman.wasm.gz` 4.40 MB, `mamecps1.wasm.gz` 4.60 MB, one uncompressed hashed wasm 6.37 MB (VERIFIED, HTTP measurements 2026-07-29). So each arcade family costs ~4–6 MB of emulator before the ROM.

### 2.3 Scale (advancedsearch API counts, 2026-07-29, all VERIFIED)

| Collection | Items |
|---|---|
| `emulation` (everything browser-runnable) | 326,975 |
| `softwarelibrary` | 250,307 |
| `softwarelibrary_c64` | 98,843 |
| `softwarelibrary_apple` | 42,258 |
| `consolelivingroom` | 24,746 |
| `softwarelibrary_msdos` | 23,199 |
| `softwarelibrary_zx_spectrum` | 12,305 |
| `softwarelibrary_msdos_games` | 8,903 |
| `internetarcade` | 2,663 |

### 2.4 Legal stance (brief — another lane owns legal)

- IA hosts unlicensed commercial software openly and mitigates via `stream_only` (no download) plus takedown-on-request (INFERRED from item structure + observed removals).
- Concrete precedent both ways: the flagship item `arcade_pacman` is now **darkened** (`is_dark: true` in its metadata API response) — even marquee items get removed (VERIFIED). The collections as a whole have survived 12+ years without being litigated out of existence (INFERRED).

### 2.5 Known UX weaknesses (all sourced)

- **No saves**: the official MS-DOS help page: "Currently, there is no way to save your game, although we are trying to work out if this is technologically possible." (VERIFIED). em-dosbox writes saves to an in-memory Emscripten FS lost on page close (VERIFIED, em-dosbox README).
- **Sound**: "one of the more difficult issues" per the JSMESS FAQ; per-browser audio differences, crackle (VERIFIED, blog.archive.org 2013).
- **Speed control is manual**: users are told to mash CTRL-F11/F12 to fix mis-clocked DOS titles (VERIFIED, help page).
- **Size ceiling**: help page warns items ">10 or 20mb run into all sorts of issues" (VERIFIED).
- **Stale engines**: emulator builds are pinned per engine-item and rarely rebuilt (engine JSONs dated 2020–2022; loader frozen 2024) (INFERRED from file mtimes).
- **Broken/removed items**: IA's own blog documents emulations silently breaking ("Those Hilarious Times When Emulations Stop Working", 2016) (VERIFIED title/existence; content not re-read).
- **Mobile**: Emularity has no touch controls or virtual keyboard; effectively desktop-only (INFERRED; contrast §6–7 PWAs).

---

## 3. MAME compiled with Emscripten

- **Coverage**: MAME upstream is the universal emulator (arcade plus thousands of computer/console/handheld drivers). Browser builds cannot ship all of it: the official docs state a full Emscripten build "exceeds browser memory capacity", so you compile per-driver subsets via `emmake make SUBTARGET=... SOURCES=src/mame/pacman/pacman.cpp` (VERIFIED, docs.mamedev.org).
- **Build/maintenance status**: the Emscripten target is documented in current MAME docs and requires "Emscripten 6.0.2 or later" with SDL3 (`embuilder build sdl3 sdl3_ttf`) — i.e., the wasm target tracks a very recent toolchain and is actively maintained (VERIFIED). MAME repo pushed 2026-07-29 (VERIFIED, GitHub API).
- **License**: project as a whole GPL-2.0(-or-later); many files BSD-3-Clause (VERIFIED, mamedev.org/legal). ROMs are explicitly not covered; even MAME's "free ROMs" are non-commercial and site-restricted (VERIFIED, mamedev.org/legal).
- **Performance in browser**: 8/16-bit-era drivers run full speed on desktop; the IA experience shows sound and pacing as the weak points (VERIFIED via IA docs); 3D-era drivers are not realistic in wasm (INFERRED — no counterexamples found).
- **Sizes**: ~4.5 MB gzip per driver-family build (measured, §2.2). **Determinism**: MAME supports input recording/playback tied to an exact MAME version; cross-version determinism is not guaranteed (INFERRED from MAME practice; not re-verified this session).

---

## 4. PCjs (Jeff Parsons)

- **Machines**: IBM PC line (PCx86, its flagship), 8080 machines (Space Invaders, VT100 terminal), 6502 (OSI Challenger 1P), **DEC PDP-11** (11/20, 11/45, 11/70 with animated front panels, e.g. the 11/70 panel+debugger machine page), PDP-10, TI-57 calculator (VERIFIED repo + pcjs.org machine pages).
- **Technology**: hand-written JavaScript, **no wasm** (VERIFIED). This is deliberate; fidelity is instruction-level, not cycle-exact analog (INFERRED).
- **Config format — key precedent**: machines are declared in **XML configuration files** (`machine.xml` + `components.xsl` templates); machine state is serialized as **JSON state files**; a "Save Machine" feature emits a self-contained embeddable machine (VERIFIED, pcjs.org blog 2016-02-17). Declarative machine definition + separable state snapshot is exactly the metadata shape a museum wants (PROPOSED).
- **Save states**: PCjs machines auto-save/restore via localStorage ("without localStorage enabled, machines will always reboot") (VERIFIED).
- **License**: MIT, "PCjs © 2012-2026 Jeff Parsons"; actively maintained (2,200 commits) (VERIFIED). PCjs also hosts hundreds of curated disk images (legal status of those images varies; not licensed by PCjs's MIT — INFERRED).

---

## 5. DOS in the browser

### 5.1 js-dos (current: v8)

- **Status**: default branch `8.xx`, pushed 2026-07-13; actively developed (VERIFIED, GitHub API). Client `js-dos.js` = 323 KB; `wdosbox.wasm` = **1.46 MB** (VERIFIED, measured from v8.js-dos.com CDN).
- **Backends**: DOSBox and **DOSBox-X** wasm builds, including Win9x support "with prebuilt Windows 95/98 system images and support for Windows games with DirectX and 3Dfx drivers" (WebGL-accelerated 3Dfx) (VERIFIED, js-dos.com). Runs in worker or render thread; Node or browser; AudioWorklet + experimental JSPI (VERIFIED).
- **`.jsdos` bundle format — packaging precedent**: a renamed ZIP containing the program files plus `.jsdos/dosbox.conf` (required; js-dos refuses to start without it) with an `[autoexec]` that launches the title, plus optional `jsdos.json` for virtual controls/settings (VERIFIED, js-dos bundle docs). Content + machine-config + input-mapping in one addressable archive — directly reusable shape for content-addressed storage (PROPOSED).
- **Saves**: OPFS-based local persistence with `fsChanges` hooks for custom save backends; save/load plus **cloud-ish disk streaming (Sockdrive V2)** (VERIFIED, js-dos.com).
- **Networking**: IPX over WebRTC ("webrtc-net") for multiplayer (VERIFIED).
- **Mobile**: v7 mobile is production; v8 mobile marked WIP (VERIFIED).
- **Licensing caution**: the emulator backends repo (caiiiycuk/emulators) is **GPL-2.0** (VERIFIED, GitHub API), but the js-dos client repo has **no license file** (SPDX "none" via API) and monetizes via CloudSDK subscriptions (VERIFIED). Treat the client library as "source available, license unclear", not open source (INFERRED).
- **Determinism**: DOSBox's adaptive `cycles` scheduling is wall-clock coupled; deterministic replay is not a supported feature (INFERRED).

### 5.2 em-dosbox (legacy, what IA runs)

Emscripten port of DOSBox by dreamlayers; GPL-2.0; Asyncify-based with modest overhead; includes `packager.py`/`repackager.py` (the proto-bundle idea js-dos later formalized); saves live in in-memory FS and vanish on close; FPU is 64-bit doubles not 80-bit (VERIFIED, repo README). No recent activity signals; superseded by js-dos for new work (INFERRED).

### 5.3 DOSBox-X wasm

Upstream DOSBox-X documents no official browser/wasm target that I could find (UNKNOWN — searches surfaced only em-dosbox forks); the working DOSBox-X-in-browser is js-dos's own build (VERIFIED via js-dos feature list).

---

## 6. 8-bit home computers — best of breed

| System | Best browser emulator | Tech | License | Notes |
|---|---|---|---|---|
| ZX Spectrum | **JSSpeccy 3** (gasman) | AssemblyScript→wasm core in a Web Worker | GPL-3.0 | 48K/128K/Pentagon; all documented+undocumented Z80 ops; cycle-accurate multicolour effects; SZX/Z80/SNA/TZX/TAP; embedding API (VERIFIED). Measured payload: 190 KB total (VERIFIED). No save states beyond snapshot files (VERIFIED). |
| C64 | **vc64web** (VirtualC64 core, same team as vAmigaWeb) | C++→wasm | GPL (core) | PAL/NTSC VIC-II variants, 6581/8580 SID, REU up to 16MB, two drives, cartridges; **"install open roms" button pulls MEGA65 open-roms as legal ROM alternative**; snapshots to browser storage; strong touch UI (VERIFIED, vc64web.github.io). Older options: vice.js (VICE 2.4), Sgeo's vice32.js (VICE 3.2) — stale (VERIFIED existence; staleness INFERRED). |
| Amstrad CPC | **floooh's Tiny Emulators (chips)** | C headers→wasm | zlib | CPC 464/6128 + KC Compact in browser; repo pushed 2026-07-22 (VERIFIED). |
| Apple II | **Apple2js** (whscullin) | TypeScript, no wasm | MIT | Apple ][ and //e (enhanced/unenhanced), Videx, RGB card, gamepad API; `dsk2json` disk pipeline; "rough around the edges" per README; no save states documented (VERIFIED). |
| Also | chips suite covers VIC-20, C64, Spectrum, Atom, KC85/2–4, Z1013/Z9001 etc. in one zlib-licensed codebase (VERIFIED) | | | |

**ROM legality for this tier** (the museum-relevant part):
- **Amstrad permission (Spectrum + CPC)**: Cliff Lawson's 1999 statement — Amstrad "are happy for emulator writers to include images of their copyrighted code" provided copyright messages are unaltered and credit is given; applies to Spectrum 48/128 code Amstrad acquired from Sinclair and to CPC ROMs (VERIFIED via preserved statement copies: rpmfusion rom-distribution.txt, comp.sys.amstrad.8bit, worldofspectrum permits archive). This makes ZX Spectrum and CPC the **legally cleanest full-stack 8-bit platforms**.
- **C64**: Cloanto claims the Commodore ROM copyrights and licenses them commercially (C64 Forever; licensed to Retro Games etc.); community disputes the chain of title but nobody distributes kernal/BASIC freely on that theory (VERIFIED claims exist, grade C sources; legal conclusion UNKNOWN). Practical path: MEGA65 **open-roms** replacements, with compatibility gaps (VERIFIED that vc64web integrates them; gap extent UNKNOWN).
- **Apple II**: no permission from Apple exists analogous to Amstrad's (UNKNOWN/none found); IA hosts 42k Apple items regardless (VERIFIED count). Treat Apple ROMs as unlicensed (INFERRED).

All of this tier runs full speed on phones; payloads are sub-4 MB; startup is ~1 s (measured sizes VERIFIED; speed on mobile INFERRED from PWA targeting of vc64web/vAmigaWeb and small payloads).

---

## 7. 16-bit: Amiga and Atari ST

### 7.1 Amiga — vAmigaWeb (flagship-quality)

- WebAssembly port of Dirk Hoffmann's vAmiga, "builds exactly on the same cycle exact and efficient core as the mac version"; OCS/ECS machines (VERIFIED, project docs). GPL-3.0, 804 commits; deployed as versioned static folders (v108 live 2026-07-29) (VERIFIED).
- `vAmiga.wasm` = **3.49 MB** (VERIFIED, measured).
- **ROMs**: needs a Kickstart; site states Commodore Kickstarts "are still under copyright" and offers **AROS ROM replacements** in-app (VERIFIED). Kickstart rights are commercially held (Cloanto/Amiga Forever) (grade C, VERIFIED claims exist).
- **Saves**: snapshot saving to local storage; zip multi-volume support (VERIFIED). **Mobile**: full PWA — offline, homescreen install, virtual keyboard, touch joystick (VERIFIED). **Networking**: none mentioned (UNKNOWN/none). **Determinism**: cycle-exact core makes input-replay determinism plausible (INFERRED).
- The older Scripted Amiga Emulator (SAE) is what Emularity integrates; vAmigaWeb supersedes it in fidelity (INFERRED).

### 7.2 Atari ST — thin ecosystem

- No polished maintained browser ST emulator equivalent to vAmigaWeb (UNKNOWN/none found). The demonstrated path is **Hatari compiled with Emscripten** (atari-forum thread; the "Atariaviary" demo browser) with a reported **24 MB wasm** and the SDL GUI disabled (grade C, VERIFIED thread exists).
- **TOS ROMs**: still proprietary (rights trail via Atari SA — UNKNOWN details). **EmuTOS** is the free GPL TOS replacement, v1.4, actively developed, and is the standard legal boot path (VERIFIED, repo). Compatibility with commercial games is good-not-perfect (INFERRED).

---

## 8. Consoles briefly: EmulatorJS / RetroArch-web

- **EmulatorJS**: GPL-3.0 web frontend bundling **libretro cores compiled to wasm** — NES, SNES, N64, PS1, GB/GBA, Sega line, Atari line, DS, Virtual Boy, arcade cores (VERIFIED, repo). Self-hostable; configured via `EJS_*` globals + CDN data package; save states supported; active (715 commits, stable/latest/nightly channels) (VERIFIED). Loader `emulator.min.js` = 426 KB; example core data (fceumm) = 1.05 MB (VERIFIED, measured on cdn.emulatorjs.org).
- **RetroArch Web Player**: official libretro browser build (web.libretro.com); stable 1.22.2, 2025-11-17; docs recommend Chrome for v-sync/audio; touch support historically weak (open issue) (VERIFIED via libretro.com/docs + issue tracker; grade B).
- As an aggregation layer EmulatorJS is the pragmatic choice: one embed API over ~30 systems (INFERRED).
- **Legal**: console ROMs are not redistributable; several cores additionally need copyrighted BIOS files (PS1 notably; most 8/16-bit cores need none). Emulators themselves are lawful per the Sony v. Connectix line of cases. Details belong to the legal lane (INFERRED summary; not re-verified this session).

---

## 9. Early mainframes and minis

### 9.1 PDP-11 — surprisingly excellent in browser

- **Paul Nankervis's pdp11-js**: hand-written JS PDP-11/70 + 11/45 with animated front panel (console light patterns were the original motivation); boots RSTS/E (multiple versions), RSX-11M, RT-11-era software, **Unix V5, 2.11BSD, Ultrix** in the browser from hosted disk images (VERIFIED, paulnank.github.io). License not stated (UNKNOWN).
- **PCjs PDPjs**: PDP-11/20/45/70 machines with front panels and debuggers, MIT-licensed, XML-configured, localStorage state (VERIFIED, §4).
- **simh/open-simh in wasm**: no official wasm target (UNKNOWN/none found in repos); one documented community experiment (ohmgeek 2022, VAX) hit friction from simh's per-simulator library structure and runtime linking (grade C, VERIFIED blog exists). Browser PDP-11 today means the JS emulators above, not simh (INFERRED).
- **Legal-media jackpot**: the **Caldera license (2002-01-23, read in full)** grants a "fee free license" to use, modify and distribute source and binaries of **16-bit UNIX V1–V7 and 32-bit 32V** (BSD-style with advertising clause; System III/V excluded) (VERIFIED, license text). A PDP-11/70 booting Unix V6/V7 in a browser is a **fully legally redistributable stack** — emulator, OS, and userland. DEC's own OSes (RSTS/RSX/RT-11) remain under murky hobbyist-license terms tied to defunct entities (UNKNOWN; legal lane).

### 9.2 PDP-8

**SoCDP-8** and other in-browser PDP-8s with functional front panels + teletype exist (grade C, forum-sourced; VERIFIED existence). Machine is trivial to emulate at full speed (INFERRED).

### 9.3 IBM mainframes — the gap

- **Hercules** (System/370, ESA/390, z/Architecture; open source) has **no browser/wasm port found** (UNKNOWN/none found after targeted search). Its threading + networking model makes a port nontrivial (INFERRED). Verdict: local-native, or server-side Hercules with a web 3270 terminal (server-stream fallback) (PROPOSED).
- OS media: MVS 3.8j (TK4-/TK5 distributions) is widely treated as public-domain-era IBM software; later OS/VS, z/OS are firmly proprietary (INFERRED; legal lane owns this).

### 9.4 Historic machines

- **EDSAC**: multiple browser simulators — the Warwick EDSAC Simulator (successor of Martin Campbell-Kelly's), the Cambridge EDSAC99 simulators, nishio's GPL-3 EDSAC-on-browser (VERIFIED existence). These are simulators of a machine with no surviving copyrighted software problem — initial orders and tapes are public heritage (INFERRED).
- **IBM 1401**: browser-based simulators exist (cap-lore CSI-426 JS simulator; masswerk's Virtual Card Read-Punch ecosystem); the high-fidelity rolffson 1401 datacenter simulator is a native Unreal Engine app, not browser (VERIFIED existence, grade C details).

---

## 10. Cross-cutting measurements (all sizes measured 2026-07-29 unless noted)

| Runtime | Payload (engine only) | Saves | Mobile | Networking | Determinism |
|---|---|---|---|---|---|
| JSSpeccy 3 | 0.19 MB | snapshot files only | untested (VERIFIED size; mobile UNKNOWN) | none | cycle-accurate core (VERIFIED); replay plausible (INFERRED) |
| vc64web | ~wasm few MB (not measured) | snapshots to browser storage (VERIFIED) | first-class touch/PWA (VERIFIED) | none found | INFERRED good |
| vAmigaWeb | 3.49 MB wasm (VERIFIED) | snapshots to local storage (VERIFIED) | first-class PWA (VERIFIED) | none found | cycle-exact (VERIFIED claim) |
| js-dos v8 | 0.32 MB js + 1.46 MB wasm (VERIFIED) | OPFS + hooks + Sockdrive (VERIFIED) | v7 prod / v8 WIP (VERIFIED) | IPX via WebRTC (VERIFIED) | not a goal (INFERRED) |
| MAME wasm (IA-style) | ~4.5 MB gz per driver family (VERIFIED) | none in IA deployment (VERIFIED) | none (INFERRED) | none | version-pinned replay (INFERRED) |
| EmulatorJS | 0.43 MB loader + ~1 MB/core (VERIFIED) | save states (VERIFIED) | touch UI (INFERRED) | netplay via RetroArch (VERIFIED claim, untested) | core-dependent (INFERRED) |
| PCjs | JS, sub-MB (INFERRED) | localStorage auto-save/restore (VERIFIED) | keyboard-centric, poor touch (INFERRED) | none | instruction-level, replay untested (UNKNOWN) |
| pdp11-js | small JS + OS disk images (INFERRED tens of MB) | none documented (UNKNOWN) | no (INFERRED) | none | UNKNOWN |
| Hatari-wasm (demo) | 24 MB wasm reported (grade C) | UNKNOWN | no | none | UNKNOWN |

Browser requirements across the board: plain WebAssembly + Web Audio; workers used by JSSpeccy/js-dos; no hard SharedArrayBuffer requirement observed in the flagship PWAs (they run on iOS Safari) (INFERRED from iOS support claims). RAM: 8-bit ≪100 MB; DOS/Amiga ~100–300 MB; MAME per-driver ~256 MB heap typical (INFERRED — not instrumented).

---

## 11. Feasibility table

| Tier | Best runtime today | Verdict | Size (engine + media) | RAM | Perf | Legal-media status |
|---|---|---|---|---|---|---|
| Early mainframes/minis (PDP-8/11, EDSAC, 1401) | pdp11-js / PCjs PDPjs / SoCDP-8 / EDSAC sims | **browser-native-practical** (PDP-class & earlier) | <1 MB engine + 1–200 MB OS disks | low–moderate | full speed (machines were ~1 MIPS) | **Best in class**: Ancient UNIX V1–V7/32V freely redistributable (Caldera, VERIFIED); DEC OSes murky; EDSAC/1401 media effectively unencumbered (INFERRED) |
| IBM mainframes (S/360→z) | Hercules (native) + web 3270 front-end | **local-native-required / server-stream-fallback** (no wasm port found) | n/a in browser | GBs native | good native | MVS 3.8j treated as free (INFERRED); everything later proprietary |
| 8-bit micros (Spectrum, CPC, C64, Apple II) | JSSpeccy 3, tiny8bit/chips, vc64web, Apple2js | **browser-native-practical** | 0.2–4 MB + KB-scale media | very low | full speed incl. mobile | Split: Spectrum/CPC ROMs licensed by Amstrad (VERIFIED); C64 via open-roms or encumbered; Apple II ROMs unlicensed; game media mostly unlicensed |
| 16-bit micros (Amiga / ST) | vAmigaWeb / Hatari-emscripten | Amiga: **browser-native-practical**; ST: **browser-capable-with-limits** (port is demo-grade) | 3.5 MB / 24 MB + ADF/ST images | moderate | full speed desktop; Amiga good on tablets | Kickstart/TOS copyrighted; AROS + EmuTOS free replacements with compat gaps; game media unlicensed |
| DOS gaming | js-dos v8 (DOSBox/DOSBox-X wasm) | **browser-native-practical** (Win9x era: browser-capable-with-limits) | 1.8 MB engine + bundle (KB–CD-scale; Sockdrive streams big disks) | 64–512 MB | 286–486 era full speed; late Pentium/Win9x variable | Engine GPL; huge shareware/freeware corpus is clean; commercial titles unlicensed (IA precedent tolerated, not licensed) |
| Arcade | MAME per-driver wasm (Emularity or custom loader) | **browser-capable-with-limits** (pre-3D era practical; 3D era not) | ~4.5 MB gz/driver + ROMs (KB–tens of MB) | ~256 MB | full speed for classics; audio historically weak | **Worst tier**: ROMs essentially never redistributable; even IA darkens items (arcade_pacman VERIFIED) |
| Consoles (NES→PS1) | EmulatorJS (libretro cores) / RetroArch-web | **browser-capable-with-limits** technically; for a public museum realistically **metadata-only-BYO** | 0.4 MB + ~1–3 MB/core + ROMs | low–moderate (PS1 higher) | 8/16-bit + PS1 fine; N64 shaky | ROMs not redistributable; PS1 BIOS additionally encumbered; homebrew corpus is the clean subset |

Verdict taxonomy used: browser-native-practical / browser-capable-with-limits / local-native-required / server-stream-fallback / metadata-only-BYO / unavailable.

---

## Sources

| URL | What it evidences | Accessed | Grade |
|---|---|---|---|
| https://github.com/db48x/emularity | Emularity scope, GPL-3.0, MAME/EM-DOSBox/SAE support | 2026-07-29 | A |
| https://api.github.com/repos/db48x/emularity/commits?per_page=1 | Last commit 3cbca38, 2024-01-27, vMac disk support | 2026-07-29 | A |
| https://archive.org/advancedsearch.php (collection queries) | Item counts: emulation 326,975; softwarelibrary 250,307; c64 98,843; apple 42,258; consolelivingroom 24,746; msdos 23,199; zx 12,305; msdos_games 8,903; internetarcade 2,663 | 2026-07-29 | A |
| https://archive.org/metadata/msdos_Oregon_Trail_The_1990 | emulator/emulator_ext/emulator_start fields, stream_only | 2026-07-29 | A |
| https://archive.org/metadata/arcade_choplift | Arcade items: emulator=driver name, stream_only, hidden ROM file | 2026-07-29 | A |
| https://archive.org/metadata/arcade_pacman | `is_dark: true` — flagship item darkened | 2026-07-29 | A |
| https://archive.org/download/emularity_engine_v1/pacman.json (+1941.json, /files) | Per-driver engine JSON schema; mamepacman.wasm.gz 4.40 MB; mamecps1.wasm.gz 4.60 MB; 6.37 MB raw wasm | 2026-07-29 | A |
| https://docs.mamedev.org/initialsetup/compilingmame.html | Emscripten 6.0.2+, SDL3, per-driver SOURCES builds, full build exceeds browser memory, Emularity recommended | 2026-07-29 | A |
| https://www.mamedev.org/legal.html | MAME GPL-2.0 overall + BSD-3 files; ROM restrictions | 2026-07-29 | A |
| https://blog.archive.org/2013/12/31/still-life-with-emulator-the-jsmess-faq/ | Sound difficulties, browser requirements, JS rationale | 2026-07-29 | A |
| https://help.archive.org/help/ms-dos-emulation/ | "no way to save your game", CTRL-F11 speed, 10–20 MB ceiling | 2026-07-29 | A |
| https://github.com/jeffpar/pcjs | PCjs machines list, MIT license, active 2026 | 2026-07-29 | A |
| https://www.pcjs.org/blog/2016/02/17/ (+ search corroboration) | machine.xml config, JSON state files, localStorage save/restore, Save Machine | 2026-07-29 | B |
| https://www.pcjs.org/machines/dec/pdp11/1170/panel/debugger/ | PCjs PDP-11/70 with front panel exists | 2026-07-29 | B |
| https://js-dos.com/overview.html | v8 features: DOSBox-X Win9x, OPFS, workers, mobile v7/v8 status | 2026-07-29 | A |
| https://js-dos.com/jsdos-bundle.html (via search snippets) | .jsdos = ZIP + .jsdos/dosbox.conf (+jsdos.json) | 2026-07-29 | B |
| https://api.github.com/repos/caiiiycuk/js-dos | branch 8.xx, pushed 2026-07-13, no license file | 2026-07-29 | A |
| https://api.github.com/repos/caiiiycuk/emulators | Backends GPL-2.0, pushed 2026-07-13 | 2026-07-29 | A |
| https://v8.js-dos.com/latest/… (HTTP measurements) | js-dos.js 323 KB, wdosbox.wasm 1.46 MB | 2026-07-29 | B |
| https://github.com/dreamlayers/em-dosbox | GPL-2.0, Asyncify, packager.py, in-memory saves lost on close, 64-bit FPU | 2026-07-29 | A |
| https://github.com/EmulatorJS/EmulatorJS | GPL-3.0, libretro-wasm frontend, systems, channels | 2026-07-29 | A |
| https://cdn.emulatorjs.org/stable/… (HTTP measurements) | loader 426 KB, fceumm core data 1.05 MB | 2026-07-29 | B |
| https://www.libretro.com/index.php/retroarch-web-player/ + https://docs.libretro.com/guides/web-player/ (via search) | RetroArch web player status, 1.22.2 (2025-11-17), Chrome recommendation | 2026-07-29 | B |
| https://github.com/gasman/jsspeccy3 | AssemblyScript wasm core, models, GPL-3, embedding API | 2026-07-29 | A |
| https://jsspeccy.zxdemo.org/ (HTTP measurement) | 190 KB payload | 2026-07-29 | B |
| https://floooh.github.io/tiny8bit/ + https://api.github.com/repos/floooh/chips | Systems covered; zlib license; pushed 2026-07-22 | 2026-07-29 | A |
| https://github.com/whscullin/apple2js | Apple ][ + //e, TypeScript, MIT, dsk2json | 2026-07-29 | A |
| https://vamigaweb.github.io/doc/about.html + https://github.com/vAmigaWeb/vAmigaWeb | Cycle-exact core, AROS replacements, snapshots, PWA, GPL-3.0 | 2026-07-29 | A |
| https://vamigaweb.github.io/v108/vAmiga.wasm (HTTP measurement) | 3.49 MB wasm; v108 deployment live | 2026-07-29 | B |
| https://vc64web.github.io/ | VirtualC64 wasm, MEGA65 open-roms integration, snapshots, touch | 2026-07-29 | A |
| https://github.com/emutos/emutos | Free TOS replacement, GPL, v1.4 | 2026-07-29 | A |
| https://www.atari-forum.com/viewtopic.php?t=27255 | Hatari Emscripten port, 24 MB wasm, GUI disabled | 2026-07-29 | C |
| https://github.com/rpmfusion/fuse-emulator-roms/blob/master/rom-distribution.txt + https://worldofspectrum.net/permits/ | Amstrad/Cliff Lawson 1999 ROM permission (Spectrum + CPC) | 2026-07-29 | B |
| https://www.lemon64.com/forum/viewtopic.php?t=73857 (+related) | Cloanto C64/Amiga ROM copyright claims and disputes | 2026-07-29 | C |
| https://paulnank.github.io/pdp11-js/ | JS PDP-11/70+11/45, front panel, boots RSTS/E, RSX-11M, Unix V5, 2.11BSD, Ultrix | 2026-07-29 | A |
| https://ohmgeek.co.uk/2022-07-17-running-a-vax-in-web-assembly-part-1/ | simh-to-wasm experiment and obstacles; no official target | 2026-07-29 | C |
| https://retrocomputingforum.com/t/a-pdp-8-in-your-browser/4047 | SoCDP-8 browser PDP-8 with front panel | 2026-07-29 | C |
| https://www.tuhs.org/Archive/Caldera-license.pdf | Full text: free redistribution of UNIX V1–V7 + 32V (BSD-style) | 2026-07-29 | A |
| https://www.dcs.warwick.ac.uk/~edsac/ + https://www.cl.cam.ac.uk/events/EDSAC99/simulators/ + https://github.com/nishio/EDSAC-on-browser | EDSAC simulator landscape | 2026-07-29 | B |
| http://www.cap-lore.com/Hardware/1401Manual.html + https://www.masswerk.at/card-readpunch/ | Browser IBM 1401 simulation options | 2026-07-29 | C |
| https://sdl-hercules-390.github.io/html/ (+searches) | Hercules scope; no browser port found | 2026-07-29 | B |
