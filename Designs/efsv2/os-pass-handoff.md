# EFS v2 — FS pass → OS pass handoff

**Status:** draft — input to the next (OS) design pass
**Target repos:** planning, sdk
**Depends on:** [[fs-pass-synthesis]], [[client-os-pressure-report]]
**Last touched:** 2026-07-10

#status/draft #kind/design #repo/planning #repo/sdk

## What this is

The FS pass adjudicated the OS pressure report (P1–P13) and moved several things under the OS pass while it ran. This is the contract the next OS pass designs against: what the FS layer now guarantees, what it never will, and what the OS pass must adjudicate next. Where an FS ruling changed an OS assumption, it's flagged.

## What changed under you while this pass ran

- **P1 (`admittedAt`) is recommended-ADOPT — with fences you must respect.** It is **existence-since evidence only** (cooldowns from a venue's own admission; predate upper-bounds; write-once per venue). It is **NEVER a freshness anchor** — the checkpoint **recency beacon** ([[fs-pass-freeze-reservations]] D5) is. The FS pass's answer to your P1 originally routed freshness through `admittedAt` (verify-time-model fix 6; the os-contract lane's fence 4 / G8 in the corpus — not [[codex-kernel]]'s unrelated gap G8); that routing is **dead** (fail-open even at home) and superseded by critic C1 — the corrected fences are the ones above. It is fenced out of all comparators and all folds.
- **G4 (batch atomicity) is scoped.** Batches **tear at the writing venue mid-resume** (`submitSubset` partial admission is first-class). You own a **pending / confirmed / final** UX taxonomy, or GATE reads consume soft state; the manifest-root-in-the-final-chunk rule is your commit marker.
- **Public fine-grained collaborative documents do not exist.** Route open-world docs to **revision-DAG + curation** (B2) or **OR-set containers** (B4); op-fold docs (B3) require a **blinded / capability-gated / stable-membership** container. **The privacy tier is availability infrastructure for you, not a nice-to-have.** Ejection in a B3 container is content-only, never cost-reducing; churning-membership surfaces are B2.
- **"Write permission" is retired.** Your sharing UX decomposes into: **visibility** (curation — and the *remove-member* verb MUST ship the approval-sweep-as-curator-re-PIN affordance, or teams lose work / keep thieves); **authority** (`act` rows, dual-attributed "Bob for ACME", GATE never expands implicitly); **read-exclusion** (caps/keys, forward-only law surfaced at grant time); **write-exclusion** (gone); **retraction** (prospective now; windowed only where P1 lands — without it, a 90-day-expiry default causes renewal-lapse history wipes unless paired with sweeps).
- **Timestamps:** `claimedAt` = performed-at testimony, always-present (0 allowed); render backdate suspicion as **"unproven-early," never "detected"**; private tier writes 0. Admission order is **tamper-evident but not neutral** at creation — precedence UX must not promise sequencer neutrality; multi-venue earliest-admission is the anchor.
- **Watch:** `authorHead` is a **hint**; completeness is the venue **spine cursor**; watcher silence = UNKNOWN; **multi-venue cursor composition is unwritten** (you specify it with the indexer lane).
- **Reserved surface you can rely on:** `lang`/`dir` minted; persona-link + `label` reserved; `act` reserved; `encryptionKey` minted (separate KEM registry); **salted family fully pinned with HKDF salts legal** (your P9 roaming design is confirmed); WHITEOUT ships as `/.well-known/whiteout` REF-PIN; per-chunk SHA-256 in EFSBytes.
- **Your P10 convention got harder requirements:** device bits are now **FOLD-correctness-blocking** (`clientId = f(author, deviceBits)`); one SDK convention, roster-assigned, private-roster variant available.

## P1–P13 adjudications

| Ask | Ruling | Note |
|---|---|---|
| P1 store `admittedAt` getProof-provable | **ADOPT (⚖ James, in the P1 kernel-state bundle — freeze-gates A2 sign-off)** | fenced: existence-since only, out of comparators/folds |
| P3 eight grade-vocabulary extensions | **ADOPT (read-lens revision batch)** | land as qualifiers/composition rules over existing grades — the closed base-grade set never grows |
| P2 `lang`/`dir` | **ADOPT rows** | minted now |
| P2 handler-binding | **CONVENTION** | x-bit re-homed as handler-binding key; re-check trigger named |
| P2 freshness-beacon key | **CONVENTION** (distinct from the D5 checkpoint word) | |
| P4 delegated write | **ADOPT** as the `act` read-side row (kernel verifies nothing) | machinery Durable, shippable in v2 |
| P4 delegated revocation | **REJECT** kernel change | deny-advisories + curator placements + KEL subsume it |
| P5 risk-class taxonomy for batch preflights | **ADOPT (cookbook)** | S0–S3 composed with `act` dual-attribution |
| P7 app-package convention | **ADOPT (cookbook)** | identity tuple + manifest hash + atomic resolve-closure-at-pinned-root + `.efs-bundle` |
| P8 read-path privacy | **ADOPT (upgraded — normative now)** | bulk snapshot distribution for lens/deny/index/checkpoint lists; one-head-per-venue revalidation; chunk-size normalization + padding guidance; OHTTP-cleanliness — lands in the read-lens-spec revision batch §5 + codex-bytes |
| P9 lens/view config survives device loss | **ADOPT** | lens state lives as the user's own on-EFS claims under salted-family keys (HKDF salts legal) |
| P10 device bits | **ADOPT (SDK convention)** | roster-assigned; now fold-correctness-blocking |
| P11 per-chunk SHA-256 + web3:// liaison | **ADOPT** | SHA-256 word minted ([[fs-pass-freeze-reservations]] C4); liaison owner = James decision 9 |
| P12 v1-doc banners + REVOKED-closure boot posture | **ADOPT (housekeeping)** | boot = interstitial for humans, flat refusal for agents; the colliding "P12" gas-sign-off label was renamed per C14 |
| P13 social blessed pattern | **ADOPT (cookbook)** | order by venue admission, cite exact version, render edit history, grade cross-chain replicas incomplete |
| P6 channel observatory | **⚖ James** (resourcing) | doctrine without a funded monitor recreates the CT failure it cites |

## The OS-facing contract (what the FS layer guarantees / never will)

**Guarantees:** deterministic per-lens read resolution (identical on any venue with the same admitted set); confluent, replay-safe replication; a closed grade vocabulary (PRESENT / PROVEN-ABSENT / UNKNOWN; EQUIVOCAL→…→LIVE dispositions; currency qualifiers); existence-since evidence via `admittedAt` (⚖ pending James decision 1, the P1 kernel-state bundle — if refused, the priced degradations in [[fs-pass-james-decisions]] §1 replace this line); native soft-delete + infinite undo + version history; native single-author atomic batches; the salted-family privacy substrate.

**Never:** a global clock, cross-author linearizability, cross-chain currency, sequencer-neutral ordering, write-time exclusion/locking, hard delete (crypto-shred is the only "gone"), a query language, or push/watch (poll only).

## What you must adjudicate next

The pending/confirmed/final taxonomy; **the lens-object encoding (you are its biggest consumer — co-own it with the SDK)**; GATE consumption of folds/snapshots (gate-picks-the-lens rule; audit/historical gates take EXACT or venue-conjoined anchors only, never bare ORDER anchors) and of anchored/as-of reads (ANCHORED flag, never-current); S0–S3 risk classes composed with `act` dual-attribution in preflights; Trash/undelete surfaces with the "deletions are public history" disclosure; conflict-copy UX for EQUIVOCAL and self-concurrent multi-device merges; **private-by-default onboarding** (per decision 4's recommended dual posture — born-shreddable files, explicit share/publish acts, the forward-only law at grant time); device-enrollment ceremony (roster + clientId + re-enroll-on-clone); snapshot/restore UX over the basis/manifest tri-split (my-writes / my-view / canonical); and the venue-selection doctrine (finality heterogeneity, sequencer-neutrality as a selection criterion, home-hint rendering).

## Dependencies to watch at the ceremony

The P1/A2 bundle (your cooldowns, precedence defenses, windowed delegation ride it); `claimedAt` (your timeline UX); the target index (your cited-by / what-links-here surfaces — REF-only trim keeps them, full refusal makes them indexer-shaped); the merge-rule declaration (only if you ship B3-private surfaces).

## Open questions

- [ ] Confirm the OS pass takes co-ownership of the lens-object encoding with the SDK.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] OS pass has read [[fs-pass-synthesis]] corrected canon + [[fs-pass-freeze-reservations]]
