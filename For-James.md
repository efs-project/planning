# For James

> Scan **DECIDE NOW**. Reply with your picks. Everything below it can wait or needs nothing.

## ⚡ DECIDE NOW (each is a fork — just pick a letter)

**🛑 #1 — REDIRECT `kind` width MISMATCH: confirm before you sign the freeze table.** The holistic review (ENG-1) caught it, verified: the **canonical freeze artifacts** (`ADR-0050`, `SEPOLIA_FREEZE_TABLE.md`, `AliasResolver.sol`, `schemas.ts`) all freeze **`uint16 kind`** — with a documented rationale (free headroom, `kind` is an open vocabulary). But your **decision summaries in this vault** (For-James below, Decisions, agent-status) all say **`uint8 kind`** ("Option B, James's pick … only uint8 kind frozen"). So the permanent UID you're about to sign hashes `uint16`, while what you decided from says `uint8`. **Pick: (a) confirm `uint16` (PM rec — it's the canonical artifact + has the better rationale; I'll correct the vault), or (b) you meant `uint8` — then the freeze table is wrong and must change before signing.** This is a permanent UID; a field-string mismatch orphans data. (My fault the vault drifted — flagging loudly.)

**🛑 #2 — the split-brain (ENG-2).** The real schema source of truth is the unmerged **`schema-freeze` branch**; `main`, the specs, and this vault each tell different stories. Merge it to `main` (or banner main loudly) **before** signing — it's the root cause of #1 and several other findings. Then the freeze-deploy agent works from one truth.

**arch-review: schema set converged → 9 schemas, ready to build.** Resolved with you over chat (3 workflows, 159 agents total). Decisions locked: DATA → empty/pure-identity (hash+size become trust-scoped PROPERTYs); REDIRECT added as 9th schema (`bytes32 target, uint8 kind`) for canonical/sameAs/symlink; proxy→burn-to-immutable; on-chain property index for find-by-hash (tracked, non-blocking). ADRs 0048 r2 / 0049 r2 / 0050 + freeze table on branch `arch-review` (commit 2fa0f13). **Frozen-UID table still needs your signature before any Sepolia registration.** Next: build the resolver refactor test-first. (Earlier [[For-James-tomorrow]] is now partly superseded by the empty-DATA + REDIRECT decisions.)


**hackathon — entry path (gates the flyer):** how do participants actually add data? (a) **concierge-first** — submit folder+tags in Discord, our seeding script attests it; explorer = self-serve extra (rec — works day-1, routes everyone through Discord which IS the goal) / (b) explorer self-serve only / (c) wait for SDK. Draft at `/Users/james/Code/EFS/hackathon/onepager-draft.md`.

**hackathon — prizes (UPDATED per James 2026-06-11 "spend more, seed the flywheel"):** (a) two mirrored pools $150/$75/$25+🧅 each ($500+1500🧅) / (b) one deep ladder $250/$150/$100/$50/$50 + 5×250🧅 ($600) / (c) **rec: two pools + 100🧅 ship-bounty for EVERY accepted entry** (cap 30) + optional first-10 early-bird 250🧅 — guaranteed micro-reward makes everyone ship; shipped datasets ARE the flywheel. Details in `/Users/james/Code/EFS/hackathon/onepager-draft.md`.

**Milestones wording (Tier-1, your OK):** the OnionDAO list still says *"Smart contract .sol file list freeze"* — stale per your "set stays flexible." Want me to update it? (Milestone scope = your call.)

**SDK architecture — TWO PICKS** → [[Designs/sdk-architecture]] at `#status/review`. Your clarification reframed it: **on-chain SDK = a Solidity library** (used from a dev's own contract; library form keeps the dev's contract as attester, which lenses require) and **off-chain SDK = just the TypeScript SDK** (no indexer/The-Graph baggage — reverse-lookup reads are `NotImplemented` shims; the SDK doesn't bundle indexing). Both folded in: new "Two deliverables" framing + a full On-chain SDK (Solidity) section + on-chain requirements; stripped the EFS-in-Postgres/reference-index apparatus. Q2–Q5 unchanged. Earlier expert review had also fixed a Q5 attribution defect (only EIP-5792/4337 give one-approval-with-correct-attribution; sequential is the auto EOA fallback; gateway demoted to opt-in). **Latest:** (1) on-chain SDK is a *first-class client*, not write-only — contracts read files through lenses, read lists, enumerate first-N children (bounded gas window), create files/folders; added a parity contract to stop on-chain/TS drift. (2) Multi-team review round (3 agents) added a **Shared-namespace conventions** section (attester-keyed overlays vs Unix single-owner paths — the big footgun; `/apps/<reverse-dns>/` namespacing; reading another team's config; untrusted-read safety) and sharpened the discovery boundary. (3) you corrected the shared-config framing — apps share a path like `/swaps/maxSlippage` and disambiguate by **lens** (caller / DAO / self), *not* by namespace; namespacing is just navigation, not collision-avoidance. Q6 closed: no lens registry today, SDK won't build one. (4) **on-chain identity decided + adversarially reviewed** (your anxiety item, now written down): `read(path)` = `address(this)` ("my own files", AA-safe), `readAs(path, who)` for any explicit address, **never `tx.origin`**, **no `readAsEndUser`** (reaching through a middleman to the true end user can't be done safely — use Aave-style `onBehalfOf` / EIP-712+ERC-1271). A 4th review agent web-verified it: core decision sound, claims sharpened (EIP-7702 mutable-controller caveat, "address-keyed not AA-native", ERC-1271/7739 hardening, `read` now returns `(bool exists,…)`). See revision entries 9–10. Heads-up: all 3 agents cried "these schemas don't exist!" — **false alarm from your stale `contracts/` checkout**; the PIN/Lists/lenses model is on the `custom-lists` branch, not `main`. `git pull` when convenient. See Revision log (entries 6–8). Forks:

- **1. Q1 — where does the Solidity library live? RESOLVED (2026-06-10): both SDKs in the `sdk/` repo.** Your reasoning: even the Solidity SDK is consumed via npm (compile-in, not deployed by us), so the on-chain and TS SDKs ship together as one package/repo.
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

- **Reference dataset ready: crypto whitepapers** at `/Users/james/Code/EFS/datasets/crypto-whitepapers/` — 20 coins, 7 category folders each with a README (demos folders + markdown-per-folder + files + metadata), 18 PDFs fetched + license-verified. Feeds the flyer's "interesting datasets" anchor; uploads once Sepolia's live. Glance when convenient: Tron + BNB PDFs intentionally omitted (restrictive/unclear license — link-only); Monero/Zcash included via free preprints; Litecoin + Dogecoin have no real whitepaper (markdown-only, flagged).
- **arch-review thread (freeze/deploy) started** — your 4 freeze calls captured (8 schemas: ANCHOR/PROPERTY/DATA/PIN/TAG/MIRROR/LIST/LIST_ENTRY; drop BLOB+NAMING; defer SORT_INFO; proxy-first; simple single-admin key). ADR-0048 + `contracts/docs/SEPOLIA_FREEZE_TABLE.md` on contracts branch `arch-review`. Two things will come back to you: (a) **contracts local checkout is 226 behind** with 2 uncommitted PR-review-protocol edits — left untouched; say the word to stash + fast-forward + re-apply; (b) the **frozen-UID table needs your signature** before any Sepolia registration (gate fires once the proxies are deployed).
- SDK posture decided: **(a) bare-bones read/write SDK by end of next week** (gated on Lists→Sepolia). ADR-0043 collision **resolved by the dev** (renumbered to 0045). Lists has a GO; dev started. Typed-edge gap is NOT a blocker. Local `contracts/` checkout is ~30 commits stale — `git pull` when convenient.
- **Contracts-side ADR candidates** surfaced by the identity work (the SDK can't resolve these — they're protocol-level; flagged to PM): (1) state "attester identity = address's *current controller*, not durable principal" + make ADR-0039 systemLenses trust roots immutable contracts/multisigs, not EOAs; (2) ~~verify EFS's pinned EAS accepts ERC-1271 signers~~ **VERIFIED ✅ (2026-06-10): EFS's EAS uses OZ `SignatureChecker` (`EIP1271Verifier.sol:123,157`) — smart wallets (Safe/4337/passkey) work in BOTH direct and delegated attestation. No gap; the gating risk is closed.**; (3) expose attestation provenance (timestamp/refUID/revocation) as a cross-SDK read concern. Detail in the doc's "EFS-wide implications" note.
- **ADR-0049 follow-up for the schema-freeze dev (content-hash encoding):** ADR-0049 gestured at "self-describing multihash / CID" but the encoding spec was never written. After two expert passes (James-decided 2026-06-10), the SDK standardized `contentHash` on **bare SHA-256** (lowercase hex, `sha256sum`-identical; the PROPERTY *key* is the algorithm tag — no multihash/CID/keccak). Rationale: multihash's future-proofing is illusory (readers still update per new algorithm) and the IPFS-CID interop reason is false (a CID is a Merkle-DAG root, not `sha256(bytes)`). The contract stores `contentHash` opaquely so there's **no code change** — just align ADR-0049's unwritten convention to bare SHA-256 so EFS-wide stays consistent. Full reasoning: SDK `docs/adr/0006` + `docs/specs/content-hash.md`.

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
