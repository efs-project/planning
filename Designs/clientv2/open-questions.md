# Client v2 — open questions and next investigations

**Status:** draft
**Target repos:** planning, client, sdk
**Depends on:** [[web-os-thesis]] (+ the full clientv2 set), [[client-os-pressure-report]]
**Reviewers:** —
**Last touched:** 2026-07-07 — fable-5

#status/draft #kind/design #repo/planning #repo/client #repo/sdk

## What this is

The consolidation the kickoff asked for: what only James can decide, what the design set left open (with owner docs), and the concrete next investigations that would settle the biggest bets cheaply. Per-doc open questions live in their docs; this indexes the ones that matter across the set.

## James-level decisions

- [ ] **Ratify the thesis frame** (or amend): apps-in-Workers with render-as-capability (F1), System Chrome/Session Shell split (F3 + amendment 3's "plurality is contingent" honesty), personas as the promptless path (F6), draft-first lifecycle (F7).
- [ ] **Pressure report freeze-window items** ([[client-os-pressure-report]]): P1 read-ABI decisions (must precede the freeze-gates gas snapshot), P2 reserved-key candidates (row vs convention vs reject, five candidates), P4 actor/delegation reservation vs client-only ruling, P4c the P-256/WebAuthn un-reservation owner + date, P11 EFSBytes SHA-256 word.
- [ ] **The retention app** ([[system-surfaces]], webos-precedents lesson): name the daily-use flow (candidate: permanent archive + citations that never rot) and let it sequence which surfaces ship first. Every dead web-OS precedent shipped platform-first.
- [ ] **Naming** ([[web-os-thesis]] §Naming): product name for the OS; "EFS OS" is the safe default; decision is launch-gating, not design-gating.
- [ ] **REVOKED-closure boot posture** ([[boot-and-profiles]]): user may boot a revoked/denied generation behind a loud interstitial — confirm or tighten.
- [ ] **Default launch curators / endpoint sets**: the k-of-n auto-update quorum and the LC6-style published-on-EFS default endpoint sets both need named, disclosed first-party defaults (the "defaults are the product" Bluesky lesson).

## Design-level opens (owner in parentheses)

- [ ] Surface-mode UI schema: bespoke node/signal tree v0 vs subset-of-HTML vs existing IDL — prototype before the OS SDK render vocabulary freezes ([[kernel-capability-model]]).
- [ ] Kernel CSP-asymmetry mechanics: real-URL worker vs cradle-iframe fallback per engine — needs the cross-browser test matrix ([[kernel-capability-model]]).
- [ ] Persona doctrine details: persona-per-app vs per-workspace default; funding UX; what deserves the primary author — doctrine table ratification ([[wallet-and-actions]]).
- [ ] Economic-effect simulation for the ceremony: user-configured simulation endpoint vs local light-client vs preview-from-records-only with honest label ([[wallet-and-actions]], [[shell-and-sessions]]).
- [ ] Sync dashboard split (chrome owns authority/loss events, Shell owns the dashboard) — confirm amendment 11's cut ([[system-surfaces]]).
- [ ] Journal encryption threat-model note: encryption-at-rest buys little against same-origin compromise; kept for backup/escrow lanes — confirm ([[persistence-and-sync]]).
- [ ] Shell-contract@1 conformance receipts: record shape + who signs them ([[shell-and-sessions]], pressure P2-adjacent).
- [ ] Agent evaluation suite: adopt the benchmark task list as CI-runnable fixtures ([[agent-native]]).
- [ ] Locale entropy budget: initial budget numbers + what spends them ([[locale-and-accessibility]]).

## Recommended next investigations (cheap, ordered — the client analog of the efsv2 B-gates)

| # | Spike | Effort | What it settles |
|---|---|---|---|
| 1 | **The cage matrix**: blob-worker CSP inheritance, real-URL-worker CSP asymmetry, cradle-iframe fallback, Permissions-Policy strip — across Chrome/Firefox/Safari (+ iOS WebKit) | days | F1/F2 mechanics; the one assumption everything sits on. Exit: a table of engine behaviors + the chosen per-engine lane |
| 2 | **Surface-mode prototype**: build one real app (Files list view) as a declarative tree over a worker boundary with signals; measure expressiveness pain + frame budget | ~1 week | the biggest UX bet (render-as-capability); feeds the OS SDK schema |
| 3 | **Cold-boot budget slice**: ≤15KiB static shell + thin-router SW + Kernel slice served from an IPFS gateway; measure P75 cold/warm boot on a Galaxy-A24-class device | days | F12 budgets are real, not aspirational; the first-visit cliff quantified |
| 4 | **Journal→flush vertical slice**: draft offline → sign one envelope → kill the submitter at 60% → resume from a second tab and a second device; verify pending-state ladder honesty end-to-end | ~1 week | F7 mechanics + the multi-device seq question (pressure P10) with real hardware |
| 5 | **Verified-read slice**: Helios-in-worker + `eth_getProof` point reads + envelope verification against a devnet kernel; confirm every §3.3 GATE-consumable grade is computable state-backed | days | pressure P1 evidence; the "unverified bytes never render" flagship de-risked |
| 6 | **OHTTP assembly**: front one RPC + one IPFS gateway with an off-the-shelf OHTTP relay/gateway pair; measure latency + failure modes | days | F5's relay tier goes from paper to priced option |
| 7 | **Ceremony usability probe**: activation delays + negative indicator + aggregated batch preview on ~10 users signing deliberately-boobytrapped batches | later | T5/T6 tuning; catches the one-dangerous-record-hides problem empirically |

Spikes 1–5 are pre-ADR blockers for the client repo; 6–7 can trail.

## Cross-doc consistency review residue

A post-fan-out adversarial consistency review ran across the set (2026-07-07): 4 HIGH + 13 MED/LOW findings, all adjudicated and applied inline the same day (full findings + dispositions in the corpus worklog, `Reviews/2026-07-07-clientv2-corpus/worklog.md`). Notable rulings it produced, recorded here because they refined the set's vocabulary:

- The canonical **eight ceremonies** include identity/custody ceremonies under #5 (admin grants) — thesis Amendment 4 amended in place.
- **"suspect-backward"** (client state) is the term for a backward-moving channel pointer; EQUIVOCAL stays reserved for duplicity evidence.
- **Channel monitor split:** client-side checks = courier duties at launch; the global observatory = uncommissioned workstream (thesis open question).
- **S0–S3 record severity classes** (wallet doc) are a separate axis from R0–R3 ceremony/surface classes (shell doc); a batch runs at the surface class implied by its worst record.
- **"Path Link"** replaces "Live Link" (grade-word collision); "deny facts" reserved for advisory TAGs; "freshness beacon" reserved for the channel-head expiry record.
- Protocol-truth check passed everywhere except three fixed misstatements (bundle-expiry UI copy ×4 docs, EQUIVOCAL misuse, "REVOKED manifest" category error) — load-bearing claims about signatures, revocation, LWW, GATE rules all verified accurate against the efsv2 set.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
