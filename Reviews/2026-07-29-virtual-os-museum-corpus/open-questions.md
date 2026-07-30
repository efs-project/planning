# Unresolved questions and falsification tests

**Status:** synthesis for the 2026-07-29 Virtual OS Museum deep dive; tracks what this pass could NOT settle. Owner-decision candidates are listed as candidates only — N5 and the runner-lane items stay undecided and held per the owner inbox
**Agent:** claude-fable-5 (main session synthesis), 2026-07-29

#kind/review #status/done #repo/planning #pass/vom-deep-dive #topic/efsv2 #topic/clientv2

## A. Design questions with named falsification tests

| # | Question | Falsification test |
|---|---|---|
| A1 | Can the five-kind model give exact canonical manifest bytes one portable generation name? (PAF open question 1 — sharpened, not new) | Vertical-slice A1: independent resolver round-trip on one generation name. Fails → design handoff on DATA/manifest reconciliation. |
| A2 | Can range-granular verified reads be specified over the existing chunk model without new contract surface? | Write the spec text; implement in slice Stage 1; A3's corrupted-chunk test. Fails only if verification *requires* new on-chain data — no evidence suggests it does. |
| A3 | Can closure staging distinguish execute-critical from streamable entries without breaking FM-U10's no-half-verified-apps guarantee? | Slice A3 + A8 together: emulator bytes verify-before-execute while disk chunks verify-on-read; a missing disk chunk mid-session degrades to an in-emulator I/O error, never a half-verified *app*. |
| A4 | Does the single-elected-storage-worker survive GB-scale dirty-chunk overlay writes at emulator disk-I/O rates? | Instrumented Stage 0/2 measurement (VOM-style test mode). Fails → storage-worker design change (client), not protocol. |
| A5 | Can a canvas-mode SES worker actually host v86-class emulators (no DOM, no fetch, kernel-brokered chunk reads) at playable frame rates? | Stage 2 adapter v0. Fails → the sandboxed-iframe compat lane becomes load-bearing evidence for the kernel runner decision. |
| A6 | What is the COOP/COEP answer for first-load guest links to SAB-class runtimes? | Design spike: isolated archive origin vs. header-serving lane vs. SAB-free-first sequencing (Stage 4). Constraint on record: storage must never require COOP/COEP, and Safari lacks SAB in cross-origin iframes. |
| A7 | What does the semantic-sidecar rule (system-surfaces: canvas mode requires a semantic sidecar or it does not ship) mean for an emulated 1984 Mac screen? | Honest options memo + a11y experiment: terminal-class exhibits (PDP-11) have a natural text sidecar; bitmap desktops may need an explicit accessibility-limited label — or the rule relaxed for the compat lane. Unsolved industry-wide; do not hand-wave it. |
| A8 | Does the archive catalog stress lens scale under the current two-caps-plus-budgets structure (LP-4; the old MAX_LENSES=20 is retired; ~64 per-plan core cap, ~256 compile ceiling, 15–55-principal design center)? | Model a realistic museum lens (2–5 curators, 3 claim families, 10k items) against the LR-1 plan format; measure. Likely mild; verify, don't assume. |
| A9 | Bulk-byte economics: what does a 10k-item, TB-class-media archive cost across tiers? | Blocked on the gas snapshot (freeze-gates A2) + a mirror-pinning cost model (Arweave/IPFS-grant). Until then, claims stay at "names, verifies, locates" — not "hosts". |
| A10 | Deterministic replay as exhibit citation ("cite a runnable historical state"): feasible per runtime? | Per-core audit: cycle-exact cores (vAmiga, JSSpeccy) plausible; v86/DOSBox wall-clock-coupled, save-states only. Scope citation claims to save-states now; replay is research. |

## B. Owner-decision candidates surfaced (NOT asked here; queue discipline applies)

These belong to their existing queues; this pass only sharpens the evidence:

- **N5** (held): playable software archive as first joined-system reference app — this review strengthens N5A's evidence (funnel, existence proofs, clean-media slice) without resolving the retention-loop counter-candidates.
- **Runner lanes** (kernel/app-model round): approve an isolated legacy/compat lane, or defer legacy-direct — now with the museum-specific fact that the *entire SAB-class runtime tier* hangs on it (PAF open question 5).
- **Content posture** (new decision packet needed *if* N5A advances): strict-clean vs. BYO-media vs. any tolerated-hosting tier — with the protocol's no-takedown permanence, T-C1's asymmetry vs. VOM/IA, and the NEEDS-COUNSEL register from the licensing lane as inputs.
- **Runtime capability additions** (app-model round): audio, fullscreen, pointer-lock, gamepad, timing precision — currently absent from the kernel capability list entirely.
- **Guest-floor placement of `render.canvas`** (kernel round): the museum's whole guest experience is canvas-mode; today it sits above the zero-grant floor.

## C. Factual unknowns worth closing cheaply

- Whether VOM's full VM contains GPL corresponding sources (would close its compliance gap narrative); whether its apt GPG key ships pre-trusted in the VM (INFERRED, unconfirmed).
- Infinite Mac's release/version identity surface (asset hashes observed; no version string captured).
- Whether a maintained Hercules or SIMH wasm effort exists anywhere non-public (searched, none found).
- js-dos client-library license status (repo has none; backends GPL-2).
- Actual mobile interaction quality for v86/js-dos exhibits (lane evidence is desktop-weighted).

## D. Questions this pass explicitly declines to answer

- Whether EFS *should* operate an official museum (product/owner question; the review only establishes capability and cost shape).
- Any legal conclusion beyond the NEEDS-COUNSEL register (licensing lane §10).
- Protocol freeze implications — the sequencing hold and reconciliation queue own that; this review is an input, not a lever.
