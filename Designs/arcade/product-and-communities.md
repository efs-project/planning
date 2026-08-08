# EFS Arcade — product verdict, communities, and alternative selection

**Status:** draft
**Target repos:** planning
**Depends on:** [[playable-archive-requirements]]
**Last touched:** 2026-08-07 — claude-fable-5 (arcade pass)

#status/draft #kind/design #repo/planning #topic/games #topic/arcade

> **Initial-pass draft:** read the post-pass correction in [[Designs/arcade/README]] before using this plan. James's current framing is a bounded founding-product/community pilot, not a disposable demo.

The Arcade's product case, tested against EFS's own prior research and fresh evidence. Full evidence: [alternatives & falsification](../../Reviews/2026-08-07-arcade-corpus/research-alternatives-and-falsification.md), [communities & outreach](../../Reviews/2026-08-07-arcade-corpus/research-communities-and-outreach.md), [competitors & precedents](../../Reviews/2026-08-07-arcade-corpus/research-competitors-and-precedents.md). Everything here is this pass's analysis, not an owner ruling.

## 1. Verdict

**Conditional go: build it as a labeled public demo and guest-UX probe, not as a validated community or permanent flagship.**

Keep four statuses distinct. On current evidence Arcade earns exactly one of them:

| Status | Earned? | Why |
|---|---|---|
| Product demo | **Yes — buildable by Sept 11** | v1 stack + 3 working weeks suffice for catalog → verified Play → stable links → minimal social loop (see [[september-plan]]) |
| Engineering fixture | Partly | It exercises verified bytes, mirrors, hostile code, receipts — but the generic playable-archive docs already carry that role |
| Community pilot | **No** | The 15-game corpus is EFS-assembled; EFS's own red team demoted "playable commons" for exactly this ("a collection assembled by EFS, not a socially connected adopter"). Zero contacted creators/stewards to date |
| First joined-system reference app (N5) | **Not decided here** | N5 stays open in [[Designs/efsv2/owner-decision-inbox|the EFS v2 owner inbox]]; Arcade generates evidence for N5A without deciding it |

**Default recommendation: GO-AS-DEMO-ONLY**, upgradeable to a product bet only when the GO conditions below are met with evidence.

## 2. Why Arcade, honestly — the seven falsification answers

Compressed from the [falsification lane](../../Reviews/2026-08-07-arcade-corpus/research-alternatives-and-falsification.md):

1. **Vs the ranked communities** (wiki admins 76, data-rescue 76, open-hardware 75, mod maintainers 69): Arcade loses as a *community* bet — no pre-existing social group, no loss pain among its demand side. It wins on one axis none of them has: it is the only candidate exercising the **instant guest deep link** product surface (Ideas.md, James 2026-07-28) end-to-end with content a normal person might follow a link to.
2. **Vs the Git wiki**: not rivals for one slot. The wiki is the differentiator proving workload (months-scale, gated on P-1/AMBIENT/1, `GIT-REF/1` undemonstrated). Arcade is a weeks-scale demand-side probe on the existing v1 stack. Both carry the identical unvalidated-demand cold start. The danger is letting Arcade absorb the "first product" mantle while exercising *fewer* EFS differentiators than the wiki would.
3. **Vs static site + GitHub / IPFS / Internet Archive / portals**: EFS wins only at the curator/preservation layer — operator-independent link identity, permissionless second-party curation, walk-away reconstruction, verified bytes. All invisible at Play time. **Honesty box (post-adversarial-review):** the red team's own test says *"if the demo ends at 'the files still download and the hash matches,' the conventional baseline wins on simplicity"* — and the mirror-kill + tamper-rejection + stranger-rebuild demos are, alone, exactly that: a signed manifest + GitHub Pages + IPFS fallback can replicate each. They are **parity beats plus on-chain identity**, worth showing but not the Q3 answer. The one property no incumbent has is **permissionless curator plurality**: a second attester publishing a competing curation claim/playlist over the *same game identities* without the operator's permission or database. The demo must therefore include that beat — a second, clearly-labeled identity (honestly disclosed as demo-operated if no outsider exists yet) publishes an independent playlist over the same DATA UIDs, live — and the *validation* claim stays with evidence-bar test 4, which requires it to happen unprompted. If neither the plurality beat nor an unprompted second party ever materializes, Q3 is falsified and the STOP trigger applies.
4. **Real community or manufactured?** Today: manufactured. The documented pain sits with mod maintainers, speedrunners, and Flashpoint-class preservationists — none of whom are the Arcade's target user. And the one demand-side experiment EFS has ever run — the June–July buildathon, which shipped a full participant path — got low turnout and was wound down (falsification lane, grade A). What this pass does differently: named communities with evidence of fit (js13k's decentralized-category history), consequential permission asks instead of an open event, and pre-registered kill thresholds. The escape is recruitment (below), and it is the central GO condition.
5. **Repeat use after novelty?** Structurally doubtful: a 12–18 game catalog against itch.io's 711,932 free web games loses on fun/convenience/discovery. Expect spiky link traffic and near-zero week-4 retention; measure curator/creator behavior, not DAU.
6. **Sept 11 feasible?** Only at demo scope. ~3 net working weeks (away ~Aug 15–29), solo reviewer. The v1 assets are real: live Sepolia `/games` (verified on-chain), burner session, faucet code, seeder, static-export deep links. The gaps are client work, not protocol work.
7. **Sustainability without breaking neutrality?** Yes at demo scale (~$120–400/yr cash; the real cost is 5–12 founder-hours/week of curation+moderation). Grants-legible; must remain viable at $0. See [[sustainability-and-institutions]].

## 3. What the fresh evidence adds

- **Demand signal exists, at HN-nerd altitude, not mass-player altitude**: "Show HN: The HN Arcade" (Feb 2026) drew 352 points for a curated browser-game directory. Read precisely ([communities lane](../../Reviews/2026-08-07-arcade-corpus/research-communities-and-outreach.md), grade A on the thread fetch): the *dominant* asks were discovery features (random ordering, thumbnails, popularity sort, date filters) — which a 12–18-game catalog doesn't need or offer; broken links and fabricated metadata were flagged as trust-killers (the Arcade's durability + provenance directly address these); and **one** established commenter argued for maintainer-independent community stewardship (the successor-operator property). Supportive, not a mandate — and the discovery asks cut against a small catalog.
- **Crypto-aversion is real but specific**: itch.io institutional hostility (A), GDC 77% dev disinterest (B) — but js13kGames ran a NEAR/Protocol-Labs-sponsored "Decentralized" category in 2021–22 (A). The aversion targets speculation and wallet-gating, not permanence or provenance. Pitch: *"no wallet, no token, nothing for sale; the chain is the filing cabinet, not the product."*
- **The permanence claim's soft underbelly is Sepolia itself** — a testnet with no lifetime guarantee. r/DataHoarder and HN will find this in minutes. A straight answer must exist before any technical-audience outreach (see [[Reviews/2026-08-07-arcade-deep-dive|the arcade deep dive]] §risks).
- **A preservation story with a real clock — for one audience only**: Ludum Dare winds down by 2028; tens of thousands of jam games on ldjam.com have an uncertain home (opt-in only — LD entries are not freely licensed by default). **Pitch-framing rule (the corpus's own instruction, kept here deliberately):** the September catalog is js13k medalists whose real archive is a healthy 2,500-repo GitHub org — games that need no rescuing. General outreach and grant pitches therefore lead with **substrate properties** (survives-the-operator identity, verified bytes, stranger-rebuild), not rescue; preservation-with-a-clock language is reserved for the LD-specific opt-in ask. And permanence claims disclose current pin custody (one VPS node, until U16 closes) rather than implying replication that doesn't exist yet.
- **The gap no incumbent fills** (tested across 15 platforms in the [competitor matrix](../../Reviews/2026-08-07-arcade-corpus/research-competitors-and-precedents.md)): rehostability-by-strangers, verifiable bytes, curator plurality, and no-single-owner durability are ✗ essentially everywhere; every durable catalog is durable because one org keeps paying. Evidence collected this pass: leereilly/games archived 2025; Treasure Chain dead in 5 months; Sort the Court's canonical build locked inside Poki.

## 4. Personas and the community system

Twelve persona cards with jobs/incentives/anxieties live in the [communities lane](../../Reviews/2026-08-07-arcade-corpus/research-communities-and-outreach.md) §3. The load-bearing compressions:

- **Guest visitor**: r/WebGames' motto — "no downloads, signups, or plugins required" — *is* the product contract. Any wallet prompt or boot screen on the play path breaks it.
- **Creator**: wants attribution, durability, and control; fears unconsented archiving and crypto-reputation contagion. Opt-in with informed permanence is both the ethical rule and the pitch.
- **Curator**: wants earned status and real tooling (Flashpoint's audition model proves curators value formal roles). The Arcade's scarce resource is curation labor, not games.
- **Successor operator**: the HN thread demonstrated live demand for exactly this persona's needs — documented ops, portable data, rebuildable service.

How communities interact: creators publish → curators test/include → players arrive via shared links → commenters react → mirror operators replicate → a successor can rebuild. September exercises a thin slice of each; the full loops are post-validation work.

## 5. Outreach plan (no contact without fresh authorization from James)

Ranked September targets with honest pitches, full detail in the corpus §6: **js13kGames organizer** — retimed post-review: the jam runs ~Aug 13–Sep 13, so a partnership/prize-category ask on Aug 14 lands one day into his busiest month with locked sponsors; Week 0 sends at most a short awareness/congrats note, and the real ask (with the live site attached) goes **post-jam, late Sep/Oct**; it remains the one venue where decentralized storage is a feature → **r/opensourcegames + LibreGaming** (supply + curators) → **Show HN** (best free QA on the permanence claim; name Sepolia up front) → **r/WebGames** (post one great game per their norms — the site must embody their motto) → **Flashpoint Discord** (join and learn; no pitch in 2026) → **Ludum Dare orbit** (opt-in mirror, timed to wind-down news). Do **not** approach: r/DataHoarder (until the Sepolia answer is hardened), anything itch.io-official, TikTok/Shorts.

Recruitment tests T1–T7 with thresholds (T1 recut post-review: scored on the 6 consequential Tier-3 permission asks, ≥2 written grants = supply signal, courtesy notes non-scoring; ≥3 volunteer curations; comment conversion ≥2%…) and the kill signal (0/6 Tier-3 grants **and** zero curation-labor evidence → wrong first community) are defined in the corpus §5, recut in [[unknowns-and-experiments]], and tracked there.

## 6. Decision conditions (proposed to the owner — see [[Designs/arcade/owner-decision-inbox|owner-decision-inbox]])

- **GO (product)** — **evaluated Sep 15, not Aug 21** (post-adversarial-review correction: the T1/Tier-3 response evidence cannot exist before then — the calendar makes an Aug-21 product upgrade unreachable, so pretending otherwise would make "conditional" decorative). September 11 ships as a demo *regardless*; the product decision is the first E1 review. Conditions, re-derived for the recut scope: (1) ≥1 outside steward **or** ≥3 Tier-3/PR-class creators granting written informed-permanence permission (courtesy-note acknowledgments do **not** count; only ~6 such asks exist, so this is a high bar on purpose); (2) the build spike passed within budget (checkable Aug 14); (3) pipeline throughput demonstrated at ≥3 verified games/week on the 12–18 catalog (not the corpus's stale "≥30 games" figure); (4) the differentiator demo **including the curator-plurality beat** works.
- **GO-AS-DEMO-ONLY** *(default on current evidence)* — ship Sept 11 explicitly labeled a demo; 12–18 games; no community claims; instrument the guest funnel (within the privacy rules — see U1); outreach continues as the real validation workstream. **Scope honesty:** this plan adds several things the corpus's demo definition excluded — a brand/domain, funding rails, Show HN, a weekly content cadence. Each is enumerated as an explicit owner choice in D1, with one pre-registered disconfirming outcome so the demo label can't absorb every bad result.
- **RESIZE** — cut in order: curation UI (keep a documented manual process) → comments write path (read-only). Never cut the guest fast path or verified Play.
- **PARTNER** — if Flashpoint-adjacent curators, js13kGames, or a mod-maintainer collective responds: reposition EFS as the integrity/mirror layer beneath *their* catalog; require a named integration owner on their side.
- **PIVOT** — if 60 days of outreach concentrates energy in mod capsules or speedrun evidence: fold the player surface into that wedge; keep the guest-link substrate as the reusable output.
- **STOP** — any of: no outside contribution within 60 days of launch; a rights incident on permanent bytes; the differentiator demo cannot be made user-visible; Arcade displaces v2 work for 2+ consecutive weeks; the stable-URL story cannot survive the v2 recut honestly.

## 7. Community-validation evidence bar

Seven tests, never averaged; all currently `UNVALIDATED` (thresholds and rationale in the [falsification lane](../../Reviews/2026-08-07-arcade-corpus/research-alternatives-and-falsification.md)): outside steward ≥4 weeks · ≥3 knowing creators (Tier-3 written grants only; courtesy notes excluded) · repeat behavior (measured within the privacy rules — see U1) · ≥1 **unprompted** independent playlist/mirror/correction · ≥1 documented EFS-vs-baseline benefit statement tied to a real, **non-operator-staged** event (restating the launch video's scripted mirror-kill does not count) · ≥1 non-James party — **not recruited by James** — knowingly paying a recurring cost ≥1 month · 1 independent operator reconstructing the catalog **unsolicited** (running the packaged S2 script on request is a capability proof, not this test). **Promotion needs 4-of-7 including steward-or-creators AND at least one behavior test (repeat behavior or unprompted-second-party). ≤1 by day 60 → STOP review.** The independence qualifiers exist because without them one recruited volunteer plus three costless acknowledgments would clear the bar with zero organic demand (adversarial-review finding, accepted).

## 8. Composition, not competition

The Arcade should *feed* the other candidates, not fight them: it is the first implementation of the shared guest-link substrate (which the wiki's account-free reading also needs); its burner→pseudonymous write ladder is a cheap live probe of the wiki's proposer-funding/spam contradiction; its curation claims use the same lens vocabulary as wiki accepted-heads and mod-capsule attestations; and speedruns of the Arcade's own freely-licensed games would be a rare fully-rights-clean evidence-bundle pilot. **Anti-composition rule:** all of this is void if the Arcade mints bespoke schemas or a private index — every Arcade object must be ordinary DATA/claims readable by the standard stack.

## Open questions

- [ ] Does the owner ratify GO-AS-DEMO-ONLY + the GO upgrade conditions? (→ [[Designs/arcade/owner-decision-inbox|owner-decision-inbox]] D1)
- [ ] Which outreach sends happen before the away window? (→ [[september-plan]] week 0)
- [ ] What is the public wording of the Sepolia-permanence answer? (→ [[Designs/arcade/owner-decision-inbox|owner-decision-inbox]] D6)

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed (no surprise repos at implementation time)
- [ ] `**Depends on:**` chain — all dependencies `accepted` or `landed`
- [ ] No `<!-- AGENT-Q: -->` comments left in the design body
- [ ] At least one round of `#status/review` with another agent or human comment
