# Threat and failure analysis — VOM's fragilities, and EFS's own

**Status:** synthesis for the 2026-07-29 Virtual OS Museum deep dive; risk record, not canon
**Agent:** claude-fable-5 (main session synthesis), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/efsv2 #topic/clientv2 #topic/trust

## 1. What disappears if VOM's pieces vanish (from the architecture lane, condensed)

| Failure | Immediate loss | Recoverable? |
|---|---|---|
| Website down | Discovery, torrents, SHA256 publication | Yes — Wayback snapshots + site source on GitLab + IA items |
| GitLab group deleted | Code *history* | Mostly — shipped launcher/scripts/metadata live inside every full ZIP and the apt-mirror ZIP on IA |
| Update server down | Incremental updates, lite-edition downloads | Partially — IA apt-mirror ZIP re-hostable, but it lags the live repo; existing installs keep working offline |
| **Curator gone** | New content, testing, takedown handling, **the unpublished GPG signing key**, **the mostly-unpublished patched-emulator sources**, the image backlog toward 2,000–3,000 installations, all judgment | **No.** Collection survives as frozen bytes; the *institution* does not. Bus factor is 1 by the project's own description |
| Internet Archive falters | The museum's entire big-file distribution (full/lite/apt ZIPs are IA items) | Torrent swarms only — VOM is a *tenant* of IA's legal and financial health, not an alternative to it |
| Copyright enforcement wave | Any subset of the ~1,700 installs; personal liability lands on one individual | Precedent both ways: VOM untouched so far; IA has darkened flagship items (`arcade_pacman`) and lost *Hachette* |

The pattern: **bytes are survivable, the institution is not, and the legal posture is forbearance all the way down** (VOM → IA → rightsholders).

## 2. Threats to an EFS playable archive (new risks EFS takes on)

### Content-layer

- **T-C1 — Permanent hostile or infringing bytes.** EFS permanence is a recorded 2026-07-07 James ruling in the large-file draft (fully permissionless byte pool, no gating): no protocol takedown; placement revocation + deny claims + lens filtering only. VOM/IA survive on remove-on-request; EFS structurally cannot make that promise. An infringing disk image pinned to permanent tiers is forever. *Mitigation:* publisher refuses non-redistributable bytes into the default collection; tolerated-content, if ever adopted, stays on revocable mirror tiers (ipfs/https), never permanent tiers; metadata-only records otherwise. This is an owner-level posture decision, not a technical one.
- **T-C2 — ROM/BIOS inclusion by accident.** Emulator packages that "just work" tend to smuggle firmware (Infinite Mac commits Apple ROMs to a public repo; MAME ROM sets; PS1 BIOS). Closure validation must treat firmware as first-class rights-bearing entries, not opaque runtime assets.
- **T-C3 — NC-license contamination on import.** VOM metadata is CC BY-NC-SA; the launcher license is noncommercial-only. Importing VOM's curation into a permissionless, commercially-adjacent system needs counsel and probably a clean-room or facts-only import path.
- **T-C4 — Curation capture.** Paid suggestion priority is mild in VOM; in EFS, lens-level curation markets could recreate it invisibly. Provenance of curation claims (who attested, when, paid or not) should be inspectable.

### Runtime-layer

- **T-R1 — Emulator regression rot.** VOM's deepest lesson: guests break when emulators advance; ~150 emulators, many pinned to specific versions, some patched, some closed-source. EFS equivalents: content-addressed runtime generations never rot *in place*, but browsers do — a wasm build that runs today may break on a future Chrome/Safari change (COOP/COEP policy shifts, SAB gating, JSPI churn). *Mitigation:* smoke-test claims tied to (runtime generation × browser version × date); continuous re-testing as content ops; multiple runtime generations per exhibit.
- **T-R2 — Proprietary/CDN-locked engines.** CheerpX self-hosting requires a commercial license; JSLinux's current x86-64 engine has no source. Archiving either as an EFS package is impossible (unverifiable, unmirrorable). Exclude, or license explicitly. Engine survivability = FOSS wasm cores only.
- **T-R3 — Hostile packages.** An emulator package is Turing-complete untrusted code fed untrusted media. The kernel cage (SES worker, no ambient network, no wallet) is designed for exactly this; the unresolved seams are the runner-lane decision (iframe compat lane), canvas capability above the guest floor, and side channels (timing coarsening vs. A/V sync). A hostile *disk image* attacking a buggy emulator is contained by the same cage — the blast radius is the sandbox, not EFS authority.
- **T-R4 — Spoofing from inside the exhibit.** An emulated OS drawing a fake wallet prompt is pixel-perfect phishing material. Existing doctrine holds (apps own no pixels; System Chrome compositor-top; prompt identity Kernel-derived; emulated desktops are package pixels, never trusted chrome) — but retro theming (an Ideas entry) must never blur this for the *host* OS while an *emulated* OS is on screen.

### Storage/distribution-layer

- **T-S1 — Browser eviction of saves.** Safari's 7-day lease vs. a user's month-long emulated-Mac project. Everything except the save overlay is re-fetchable; the overlay needs pin/export ceremonies and honest loss events (PERSIST already specifies; must actually ship).
- **T-S2 — Mirror rot at disk-image scale.** GB-class images live on mirror tiers (ruled DA boundary). `BYTES-PARTIAL`/`CONTENT-MISMATCH` grades prevent lying, but *availability* still needs funded pinning (Arweave/IPFS grants) — the funding problem is flagged unsolved in the large-file draft. An archive whose images grade `BYTES-UNAVAILABLE` is honest but dead.
- **T-S3 — Economics unknown.** The gas snapshot (freeze-gates A2) is unproduced; the web-archive-economics verdict is explicitly hostage to it. Do not promise on-chain byte hosting for images until it exists.

### Institutional

- **T-I1 — EFS-the-company as SPOF.** The mission's bar: exhibits must survive EFS's official services. The design meets it on paper (chains-don't-die ruling, full-body spine, permissionless resubmission, CAR export, walk-away reconstruction) — *stronger than VOM's unpublished-key model* — but only if replicator tooling and export actually ship.
- **T-I2 — Single-maintainer runtimes.** Infinite Mac is verified single-maintainer; v86, CloudpilotEmu, and vAmigaWeb are one-or-few-maintainer projects (INFERRED from repo patterns, not established) — the browser-emulation commons trends toward VOM-grade bus factors. EFS archiving *exact runtime generations* (wasm + source bundle) is the mitigation: the museum outlives its emulator authors.

## 3. Failure modes of the parity claim itself

- **F-1: "Every OS in the browser" overpromise.** False; hundreds of VOM's platforms have no browser emulator (mainframes, workstations, long tail). Honest scope: the popular core (see [`feasibility-matrix.md`](./feasibility-matrix.md)) + metadata-only/BYO/native-runner lanes for the rest.
- **F-2: "Click Mac OS 7" without a rights decision.** The flagship demo class runs on tolerated Apple bytes. Without an owner content-posture ruling, the legally clean flagship set is FreeDOS/Linux/Unix-V7/Spectrum/CPC/AROS-Amiga/EmuTOS-ST/Android-x86/homebrew — good, but not "Mac OS 7". BYO-media flows partially close the gap at real UX cost.
- **F-3: First-load isolation gap.** SAB-class emulators need COOP/COEP at the guest link's first paint; clientv2 currently provides isolation only via SW-injected headers on repeat loads and forbids requiring COOP/COEP for storage. Either serve archive links from an isolated origin/lane, or sequence SAB-free runtimes (v86, js-dos, 8-bit cores) first and treat SAB-class as a designed second wave.
- **F-4: All-or-nothing staging vs. streamed disks.** PKG's closure staging ("all-or-nothing") applied naively to a 1 GB disk image kills the 2-second boot. The manifest must distinguish *execute-critical* entries (verify-before-run) from *streamable* entries (chunk-verified on demand) — a manifest-schema and client change, not protocol.
- **F-5: Maintenance underestimate.** VOM: 20 years collecting, 2.5 years from "bytes in hand" to "runnable release", half-tested at launch, breakage discovered by users within weeks. A curated EFS archive inherits the same ops burden; the design's contribution is making test claims cheap, plural, and attributable — not making testing free.
