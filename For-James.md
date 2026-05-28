# For James

> Scan **DECIDE NOW**. Reply with your picks. Everything below it can wait or needs nothing.

## ⚡ DECIDE NOW (each is a fork — just pick a letter)

**SDK architecture — TWO PICKS** → [[Designs/sdk-architecture]] at `#status/review`. Your clarification reframed it: **on-chain SDK = a Solidity library** (used from a dev's own contract; library form keeps the dev's contract as attester, which lenses require) and **off-chain SDK = just the TypeScript SDK** (no indexer/The-Graph baggage — reverse-lookup reads are `NotImplemented` shims; the SDK doesn't bundle indexing). Both folded in: new "Two deliverables" framing + a full On-chain SDK (Solidity) section + on-chain requirements; stripped the EFS-in-Postgres/reference-index apparatus. Q2–Q5 unchanged. Earlier expert review had also fixed a Q5 attribution defect (only EIP-5792/4337 give one-approval-with-correct-attribution; sequential is the auto EOA fallback; gateway demoted to opt-in). **Latest:** (1) on-chain SDK is a *first-class client*, not write-only — contracts read files through lenses, read lists, enumerate first-N children (bounded gas window), create files/folders; added a parity contract to stop on-chain/TS drift. (2) Multi-team review round (3 agents) added a **Shared-namespace conventions** section (attester-keyed overlays vs Unix single-owner paths — the big footgun; `/apps/<reverse-dns>/` namespacing; reading another team's config; untrusted-read safety) and sharpened the discovery boundary. (3) you corrected the shared-config framing — apps share a path like `/swaps/maxSlippage` and disambiguate by **lens** (caller / DAO / self), *not* by namespace; namespacing is just navigation, not collision-avoidance. Q6 closed: no lens registry today, SDK won't build one. (4) **on-chain identity decided + adversarially reviewed** (your anxiety item, now written down): `read(path)` = `address(this)` ("my own files", AA-safe), `readAs(path, who)` for any explicit address, **never `tx.origin`**, **no `readAsEndUser`** (reaching through a middleman to the true end user can't be done safely — use Aave-style `onBehalfOf` / EIP-712+ERC-1271). A 4th review agent web-verified it: core decision sound, claims sharpened (EIP-7702 mutable-controller caveat, "address-keyed not AA-native", ERC-1271/7739 hardening, `read` now returns `(bool exists,…)`). See revision entries 9–10. Heads-up: all 3 agents cried "these schemas don't exist!" — **false alarm from your stale `contracts/` checkout**; the PIN/Lists/lenses model is on the `custom-lists` branch, not `main`. `git pull` when convenient. See Revision log (entries 6–8). Forks:

- **1. Q1 — where does the Solidity library live?** (reopened by the reframe; the old "one sdk/ repo" answer assumed both SDKs were TS)
  - **(a) `contracts/`** — co-located with the immutable contracts it imports + version-locks to; same build; deploy/verify together. *(PM rec)*
  - **(b) `sdk/contracts/`** — kept with the TS SDK so "the SDK" is one repo.
- **2. PROMOTE / REVISE** the reframed doc:
  - **(a) Promote** — assign a number; OnionDAO-subset implementation can start (gated on Lists→Sepolia).
  - **(b) Revise** — name what's wrong; I'll fix and re-surface.

(Q6 — canonical shared config — **closed by you**: dev picks the lens, no registry today, and a registry if ever built is a contracts artifact, not the SDK's. Folded into the doc's Shared-namespace conventions.)

PM rec: **1a + 2 promote.** (Expert-review + brainstorm round on the reframe is done — findings folded in, revision log entries 5–6. Nothing else blocking your call.)

## 🕐 WHEN YOU HAVE TIME (not blocking OnionDAO)

- **Start the OnionDAO onboarding + flyers discussion** — you said you'll fork a chain for this; PM will keep reminding you each session until you do (you asked not to let it slip).
- Frame-review the proposed design process → [[Brainstorms/2026-05-28-pm-design-process-synthesis]] (then I formalize it)
- Promote [[brainstorm-system]] when you're happy with it

## ℹ️ FYI (no action — details in [[Decisions]])

- SDK posture decided: **(a) bare-bones read/write SDK by end of next week** (gated on Lists→Sepolia). ADR-0043 collision **resolved by the dev** (renumbered to 0045). Lists has a GO; dev started. Typed-edge gap is NOT a blocker. Local `contracts/` checkout is ~30 commits stale — `git pull` when convenient.
- **Contracts-side ADR candidates** surfaced by the identity work (the SDK can't resolve these — they're protocol-level; flagged to PM): (1) state "attester identity = address's *current controller*, not durable principal" + make ADR-0039 systemLenses trust roots immutable contracts/multisigs, not EOAs; (2) **verify EFS's pinned EAS version accepts ERC-1271 (smart-account) signers in `attestByDelegation`** — if EOA-only, smart-wallet users can't use any `onBehalfOf`/gateway flow (gates the off-chain batch story for the fastest-growing wallet class); (3) expose attestation provenance (timestamp/refUID/revocation) as a cross-SDK read concern. Detail in the doc's "EFS-wide implications" note.

---

*(Agent docs below. Skip past unless you're an agent updating this file.)*

## How agents use this file

This file exists to make James's decision queue **scannable in 10 seconds**. James found a flat list of 12 mixed bullets unreadable (2026-05-28) — so the file is now sorted by what it asks of him, not by date.

Place each item in the right section:

- **⚡ DECIDE NOW** — genuine forks only. Phrase as a numbered question with lettered options and a PM recommendation. James should be able to reply "1a, 2b" and be done. Keep this section SHORT; if it has more than ~4 items, the most important ones are getting buried.
- **🕐 WHEN YOU HAVE TIME** — reviews / promotions that aren't time-critical. One line each.
- **ℹ️ FYI** — things James should know but that need no action. Collapse aggressively; one or two lines total, pointing at [[Decisions]] for detail. Do NOT let FYIs accumulate as separate bullets.

Rules:

- **Prune ruthlessly.** When James acts on an item, delete it (git history is the archive). Stale items are the enemy — they're what made this file unreadable.
- **A decision is a fork James picks.** Status updates, things-in-progress, and PM observations are NOT decisions — they go in [[Decisions]] or `Daily Notes/`, not here.
- **Empty DECIDE NOW = James has nothing blocking him.** That's the goal state.
- **WIP limit:** if DECIDE NOW has 3 awaiting-promotion items, don't queue more promotions (per [[conventions#WIP limits]]).
