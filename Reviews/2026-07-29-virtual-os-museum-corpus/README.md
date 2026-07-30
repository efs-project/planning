# Virtual OS Museum deep-dive corpus (2026-07-29)

**Status:** evidence corpus behind [[2026-07-29-virtual-os-museum-deep-dive|the main review]]; point-in-time research record
**Agent:** claude-fable-5 (orchestrated pass: 3 vault readers, 6 web lanes, 1 first-hand probe), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/efsv2 #topic/clientv2 #topic/content #topic/games #topic/wasm

Research corpus for the architecture-pressure pass on the [Virtual OS Museum](https://virtualosmuseum.org/) (Andrew Warkentin, launched 2026-05-19) and on browser OS emulation generally, against the EFS v2 / client v2 design set. Every lane report carries its own dated, evidence-graded source table (grades: A = official/primary, B = archived primary or code inspection, C = community/secondary). Claims are labeled VERIFIED / INFERRED / UNKNOWN / PROPOSED in place.

## Evidence lanes (parallel research agents)

| File | Lane |
| --- | --- |
| [`history-and-goals.md`](./history-and-goals.md) | Curator, origin (2003→2026 launch), scale (1,700+/250+/570+), thesis ("available somewhere" ≠ "one click and works"), roadmap, sustainability |
| [`architecture-teardown.md`](./architecture-teardown.md) | Full catalog-entry→running-OS trace: Debian VM, Qt launcher, RFC-822 info files, ~280 boot scripts, ~150+ emulators, aptly/apt update repo (GPG-signed, key unpublished), btrfs snapshots, SPOF analysis, offline reconstruction |
| [`licensing-and-neutrality.md`](./licensing-and-neutrality.md) | Old-MAME NC launcher license vs OSD/FSF, CC BY-NC-SA metadata, GPL source gap for patched emulators, abandonware forbearance posture, fork/mirror/exit analysis, governance, IA comparison, NEEDS-COUNSEL register |
| [`runtimes-x86.md`](./runtimes-x86.md) | v86, JSLinux, WebVM/CheerpX, halfix, Boxedwine, qemu-wasm, container2wasm — with live boot tests and measured payloads |
| [`runtimes-retro.md`](./runtimes-retro.md) | Internet Archive/Emularity at 326k-item scale, MAME-wasm, PCjs, js-dos/em-dosbox, 8/16-bit best-of-breed, consoles, mainframes/minis; ROM-legality islands (Amstrad grant, Caldera Ancient-UNIX license) |
| [`runtimes-mac-unix-mobile.md`](./runtimes-mac-unix-mobile.md) | Infinite Mac teardown (the "click Mac OS 7" existence proof), Unix workstations, PalmOS/Newton/WinCE/Symbian/Android/iPhone OS, modern-OS honesty, WASI/Component-Model + OCI reality check, server-stream fallbacks |
| [`hands-on-test-log.md`](./hands-on-test-log.md) | First-hand probe: Infinite Mac System 7.0 measured (1.4 MB transfer, <2 s boot, chunk-manifest format, OPFS overlay saves, COOP/COEP+SAB, cross-tab lock failure state); witnessed v86 Linux boot |

## Synthesis documents (main-session author)

| File | Contents |
| --- | --- |
| [`feasibility-matrix.md`](./feasibility-matrix.md) | Merged 23-row system-class × verdict matrix + browser-requirement split + one-sentence verdicts |
| [`feature-matrix.md`](./feature-matrix.md) | VOM vs EFS feature-by-feature (20 features) + the three structural differences (distribution, trust, liability) |
| [`efs-coverage-gap-ledger.md`](./efs-coverage-gap-ledger.md) | The 16-point architecture-pressure checklist with COVERED / SPEC-DEBT / GAP / DECISION verdicts; protocol-gap verdict |
| [`threats-and-failures.md`](./threats-and-failures.md) | VOM's SPOFs; EFS-side content/runtime/storage/institutional threats; failure modes of the parity claim |
| [`vertical-slice.md`](./vertical-slice.md) | PROPOSED minimal legal end-to-end slice (FreeDOS + Unix V7 + Spectrum), acceptance tests A1–A8, staged plan (Stage 0–5) |
| [`open-questions.md`](./open-questions.md) | Unresolved design questions with falsification tests; owner-decision candidates (not asked); factual unknowns |

## Reading order

Main review first; then `feasibility-matrix` + `efs-coverage-gap-ledger` for the verdict spine; lane reports as depth on demand.
