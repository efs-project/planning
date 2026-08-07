# Alternatives comparison and falsification — EFS Arcade

**Purpose:** one lane of the 2026-08-07 Arcade validation pass — compares the Arcade hypothesis against the strongest previously identified EFS product/community candidates, answers seven falsification questions from local primary evidence, and defines explicit GO/DEMO/RESIZE/PARTNER/PIVOT/STOP conditions plus the evidence bar for claiming "community validation."
**Status:** research judgment only — adopts nothing, decides nothing; all cited candidate rankings and reviews are themselves evidence, not owner rulings.
**Agent:** claude-fable-5 (alternatives lane), 2026-08-07. Local-docs lane; no web research performed (none was needed — every question turned on internal evidence).

**Evidence grades:** **A** = primary source read directly this pass (local planning documents, agent status logs, kanban/milestones); **B** = reputable secondary (claims those documents make about external sources, e.g. platform statistics quoted with their own citations); **C** = uncertain/inferred (my analysis, extrapolations, thresholds). Every load-bearing claim below is tagged.

---

## 0. What the Arcade hypothesis actually is, restated for testing

A guest-friendly catalog of freely-licensed browser games on EFS: fast catalog/game pages with no account/wallet/boot, genuinely fun games, stable share URLs, one intentional Play click, guest-readable comments (write after minimal identity), a real curation workflow, and at least one part advancing EFS's crowdsourcing/plural-curation model. Target: public MVP 2026-09-11, solo founder, ~2 weeks away late August.

The existing 15-game corpus is `hackathon/datasets/web-games/` — 15 verified CC0/MIT single-file HTML5 games (Snake/Tetris/Breakout/Pong + js13kGames MIT entries), license-read-per-file, verbatim bytes, iframe-sandbox rendering verified, already branded "EFS Arcade" as a buildathon proof point [A: agent-status 2026-06-18/22/23]. Owner correctly classes this as technical evidence, not a launch catalog.

---

## Q1 — Why Arcade vs the strongest previously identified EFS communities?

**The target-community pass (planning-target-communities @ a0ec765) ranked five serious community prospects, all `UNVALIDATED`** [A: opportunity-map.md scorecard]:

| Rank | Community | Score |
|---:|---|---:|
| 1 | Independent wiki migration admins/hosts | 76 |
| 2 | Public-data rescue coalitions (two operators) | 76 |
| 3 | OSHWA/open-hardware creators | 75 |
| 4 | **Open-game mod maintainers** (strongest gaming candidate) | 69 |
| 5 | Furry/independent-illustrator collective | 66 |

**The Arcade's shape was explicitly examined and demoted by that pass's red team.** The shortlist-red-team replaced "generic rights-cleared playable commons" with the opt-in mod-maintainer collective, on the grounds that *"'Playable commons' is a collection assembled by EFS, not a socially connected adopter"* [A: shortlist-red-team.md §Verdict item 2]. The broad-scan row for web-game preservation reads: Flashpoint = **"Partner/teacher; no wholesale ingest"** [A: opportunity-map.md scan table]. The games lane's cluster ranking puts mod release capsules and speedrun evidence bundles above any player-facing collection [A: games-mods-speedruns-preservation.md ranking table].

**So the honest comparison:** as a *community* candidate, Arcade is weaker than all five ranked prospects — it has no pre-existing social group, no recurring contributor job, and no loss-pain among its intended demand side (players lose nothing when a free Tetris clone disappears; open-source games live in forkable repos). What Arcade has that none of the five ranked candidates has is a **demand-side/consumer product surface**: it is the only candidate that exercises the instant-guest-deep-link product idea [A: Ideas.md §Instant guest deep links, James 2026-07-28] end-to-end with content ordinary people might follow a link to. The five ranked communities are all supply-side steward plays with essentially no consumer moment.

**Verdict (C):** Arcade is not a better community bet than the ranked candidates — it is a different *kind* of bet (guest-UX and demo proof, not community validation). Claiming it as EFS's community-validation vehicle would contradict the project's own red-team. Claiming it as the guest-link proving ground and public face is defensible.

## Q2 — Why Arcade vs the Git-backed wiki?

The 2026-08-07 efs-git deep dive recommends (GD-2, unanswered) the **EFS Wiki workspace as first proving workload** — while stating plainly that all three legs of its case are supply-side and *"who edits this wiki, why, and how it cold-starts … is a genuine open product question"* [A: efs-git-deep-dive.md §1, §6 GD-2]. Comparison:

| Axis | Wiki | Arcade |
|---|---|---|
| Exercises EFS differentiators (proposals, ref history, plural curation, identity) | Fully | Barely (curation claims + comments only) |
| Demand side | Unvalidated (Everipedia/NIP-54 lesson named) | Unvalidated (no evidence players want this) |
| Machinery needed | `GIT-REF/1` fold at honest "GATE/1 scale", P-1-contingent strongest grade, AMBIENT/1, proposer-funding contradiction unresolved [A: §5] | Static bytes + guest viewer + comments; v1 stack arguably sufficient |
| Sept-11 shippable by solo founder | No (M1–M6 prototype plan, undemonstrated fold determinism) | Plausibly, as demo scope (Q6) |
| Aligned owner steering | Q3A arm + G-FORGE long-horizon steering [A: §8b] | Guest-link idea + "fun/discovery" hypothesis |

**Verdict (C):** these are not rivals for the same slot. The wiki is the *differentiator proving workload* (months-scale, gated on undecided rulings); the Arcade is a *demand-side/guest-UX probe* (weeks-scale, low machinery). The failure mode to avoid is letting Arcade absorb the "first product" mantle and the September deadline pressure while quietly carrying the same unvalidated-demand problem the wiki was criticized for — with *fewer* EFS differentiators exercised. If only one can be pursued, the wiki tests more of what makes EFS EFS; the Arcade tests whether anyone shows up. Both share the identical cold-start lesson: community, not substrate, makes these succeed.

## Q3 — Why EFS vs static catalog + GitHub Pages / CDN / IPFS / Internet Archive / existing portals?

The red team's **conventional-baseline challenge** applies verbatim: *canonical manifest + steward signature + S3/R2 + IPFS or torrent + static browser* already gives exact hashes, portable bytes, multiple locations, cheap serving, operator choice; EFS is justified only if a second party can append value permissionlessly, plural reproducible views exist, identity survives operator churn, or historical basis is independently verifiable — and *"if the demo ends at 'the files still download and the hash matches,' the conventional baseline wins on simplicity"* [A: shortlist-red-team.md §conventional-baseline].

Applied to Arcade specifically:

- **The play experience itself:** itch.io, Newgrounds, js13kGames, CrazyGames already deliver catalogs of free browser games with stable-enough URLs, comments, ratings, and vastly larger supply. For a player, nothing EFS adds is visible at Play time. (B: platform roles as characterized across the target-community corpus.)
- **What EFS genuinely adds:** (1) share links whose *identity* survives any single operator, with verified bytes from interchangeable mirrors (`CONTENT-MISMATCH` not silent corruption); (2) permissionless second-party curation — anyone can publish a playlist/compatibility claim/mirror receipt over the same game identity without the catalog owner's database; (3) walk-away reconstruction — the catalog is rebuildable from public records by an independent operator [A: museum deep dive §"where EFS can be materially better" items 3–5, same properties]. All three are **preservation/curation-layer** properties, invisible to a fun-seeking player.
- **The awkward stable-URL fact (C, sharp):** v1 Sepolia is officially "evidence and reference implementations, not the baseline" and v2 proposes superseding the frozen v1 schema/UID set [A: Milestones.md header; Kanban v2 card]. A September Arcade ships on v1. Promising "stable URLs forever" on a surface the project itself plans to supersede is a self-inflicted falsifier unless links are scoped as names with a committed forwarding story across the v2 recut. Internet Archive's URLs, by contrast, actually have two decades of stability. This must be answered honestly in the product copy.

**Verdict (C):** EFS beats the baseline only for the curator/preservation layer and only if the MVP *demonstrates* it (e.g., kill the primary host live and the link keeps working; a second party publishes an independent playlist). If the MVP can't show a user-visible EFS property a GitHub-Pages catalog lacks, question 3 is answered against EFS.

## Q4 — Identifiable community with a painful problem, or EFS manufacturing a community around its own files?

**Current evidence says: manufacturing.** The 15-game corpus was assembled by EFS's own agents for EFS's own event [A: agent-status]. Freely-licensed browser-game *creators* have no acute loss pain (their canonical home is a forkable Git repo plus itch/js13k pages); *players* of such games have none at all. The communities with real, documented pain in the gaming space are exactly the ones the target-community pass already ranked: mod maintainers (platform-ownership churn, Nexus archived-file conflict), speedrunners (Twitch 7/14/60-day VOD expiry as daily operational fact), and web-game preservationists (Flashpoint's 220k-entry corpus — with a removal discretion EFS structurally cannot reproduce) [A: games-mods-speedruns lane, incl. its GM-source index]. None of those is the Arcade's target user.

Direct field evidence on EFS-manufactured demand: the June–July buildathon shipped a full participant path and got low turnout, and was wound down [A: Milestones.md History; Kanban Done]. That is one data point, not proof — but it is the only demand-side experiment EFS has run, and it failed.

The strongest available Arcade counter-story (C): *open-game creators and preservation-minded curators* could adopt the Arcade as their shelf — js13kGames alumni whose jam pages rot, open-engine game maintainers, Flashpoint-adjacent curators of the rights-clean sliver. That is a real, reachable class — but it is currently **zero contacted people**, and the target-community pass's own cap applies: seedability ≤2/5 until contact [A: shortlist-red-team seedability correction].

**Verdict (C):** as scoped today, Q4 falsifies the *community* claim. The Arcade can only escape "EFS curating its own files" by recruiting at least one outside steward or a handful of knowing creators — which becomes the central GO condition below.

## Q5 — Does the player experience have repeat-use value after novelty?

**Unproven and structurally doubtful (C).** The catalog is small (15 now; maybe 30–50 by launch given license-verification labor is per-game and real [A: agent-status license-audit method]), the games are deliberately the *easy lawful* tier (single-file CC0/MIT arcade clones and jam games — fun for minutes), and the discovery/ratings/creator-following loops that give itch/Newgrounds retention are out of September scope. The owner's own hypothesis — players come for fun/convenience/discovery — is precisely the axis where incumbent portals are strongest and a 30-game catalog is weakest. The preservation moral story motivates curators and donors, not daily play.

What *could* create repeat use, in order of realism (C): (1) a steady curation cadence — new verified game weekly — which requires supply-side labor the solo founder does not have spare; (2) social artifacts — comments, and later the open cross-app achievements idea already captured in the vault [A: agent-status 2026-07-28 @pm guest deep-link + open achievements]; (3) local high-scores/saves (overlay-save shape is already field-proven in the museum pass [A: museum deep dive PAF-6]). None is free.

**Planning consequence:** expect spiky link-driven demo traffic and near-zero week-4 retention; define success on curator/creator behavior and guest-funnel conversion, not DAU. A repeat-player threshold belongs in the validation bar (§ below) so novelty decay is measured rather than argued.

## Q6 — Can a solo, busy founder realistically hit Sept 11?

**Only at demo scope on the existing v1 stack (C, with A-grade inputs).** Calendar: ~5 weeks minus ~2 away = **~3 working weeks**. Assets already real: live v1 Sepolia deployment + nextjs explorer; instant burner session (PR #39) covering the "minimal identity for comments" flow; the 15-game corpus with verified iframe-sandbox rendering; a designed/approved dataset seeder; gas-drip faucet [A: Kanban Done column; agent-status]. Missing for the promise: fast unauthenticated catalog/game pages (the guest deep-link path is an Idea + clientv2 boot design, **not implemented** [A: Ideas.md §Instant guest deep links "Existing foundation"]), a comments surface, a public curation workflow, license-verified catalog expansion, and all polish/copy. Known repo hazards are recorded (dev/build clash, two lint gates, Sepolia RPC gotchas) — friction, not blockers.

What is **not** achievable by Sept 11: anything v2-native (v2 is reconciliation-ready under a sequencing hold with P-1 unanswered [A: Kanban v2 card]), any SAB-class emulator tier, multiplayer, or a real community. Hidden costs to price in: shipping a *public product* on v1 creates maintenance + messaging debt against the official "v1 is evidence" posture [A: Milestones.md], and every launch-week operational surprise lands during or right after the away window. Upside alignment: a working Arcade is a natural Devcon (Nov) demo asset [A: Milestones Devcon section].

**Verdict:** feasible as a labeled demo with ~30 games, catalog+play+stable-links+burner-comments; not feasible as a "public MVP" implying an operated product with community and curation cadence.

## Q7 — Sustainability path that doesn't damage credible neutrality?

**Exists at demo scale; unpriced beyond it (C).** Costs: Sepolia gas ≈ trivial; pinning/mirror costs small for KB–MB single-file games (the museum probe showed MB-scale exhibit economics [A: museum deep dive]); the dominant cost is **curation labor** (license verification, testing, intake review) — the same labor VOM's bus-factor-1 curator shows never goes away [A: museum deep dive §fragility]. Funding evidence: grants track is live (FUTO $5k submitted 2026-07-29 with a walk-away-proof; Octant rejected; KarmaHQ page needs work) [A: agent-status; Kanban grants card]; owner preference is grants/donations. The game-preservation moral story is genuinely grant-legible (public-goods framing) — but note the tension: the *moral story* is preservation while the *September corpus* is games that need no preserving; grant narratives should lead with the substrate properties (walk-away, verified mirrors) already proven for FUTO, not overclaim rescue.

**Neutrality red lines (C):** no pay-for-placement or sponsored catalog slots; curation policy public and attributable (lens-scoped claims, never silent removal — matching the mirror-scheme-gate and no-shared-relayer postures already in the vault); donations/grants fund operations, never ranking. An ads model fails neutrality; a paid-placement model fails it worse. Accepted-cost honesty from the red team applies: someone must knowingly pay the recurring bill or the "network" is a subsidy [A: shortlist-red-team economics gate].

---

## Decision conditions (proposed, for the owner packet — not adopted)

**GO (full public MVP as a product)** — all four by ~2026-08-21 (before the away window):
1. ≥1 outside curator/steward **or** ≥3 knowing game creators committed in writing to participate at launch (contact evidence, not intent-to-contact);
2. a ≤1-week build spike proves catalog→Play→guest-read-comments on the v1 stack within budget;
3. license pipeline validated to ≥30 games without new rights classes;
4. the EFS-visible differentiator demo works (primary host disabled live; link still resolves from a second mirror).

**GO-AS-DEMO-ONLY** *(default recommendation on current evidence)* — conditions 2+4 met but 1 not: ship by Sept 11 explicitly labeled a demo/showcase; corpus 15–30 games; no community claims, no launch marketing beyond a share test; instrument the guest funnel; treat as Devcon asset and guest-deep-link proving ground; creator/steward outreach continues in parallel as the *real* validation workstream.

**RESIZE** — if the spike shows 3 weeks is short: cut in this order — curation workflow UI (replace with a documented manual process), then comments write-path (read-only launch), never the guest fast-path or Play. Minimum honest ship = fast catalog + Play + stable links.

**PARTNER** — if outreach lands interest from Flashpoint(-adjacent curators), js13kGames, or an open-game/mod maintainer collective: reposition EFS as the integrity/mirror/provenance layer beneath *their* catalog per the standing "partner/teacher, no wholesale ingest" judgment; require a named integration owner on their side before building anything bespoke [A: opportunity-map; games lane].

**PIVOT** — if 60 days of outreach shows supply-side energy concentrating in mod maintainers or speedrun evidence rather than arcade curation: fold Arcade's guest/player surface into that wedge (ranked 4th at 69, vs Arcade's unranked/demoted shape) and keep the guest-link substrate as the reusable output.

**STOP** — any of: (a) no outside human contributes *anything* (game, comment beyond tests, playlist, mirror, correction) within 60 days of public launch; (b) a rights/licensing incident on permanent bytes; (c) the differentiator demo cannot be made user-visible (Q3 falsified); (d) Arcade maintenance measurably displaces v2 reconciliation work for two consecutive weeks; (e) the stable-URL promise cannot survive the v2 recut story honestly.

---

## Evidence bar for claiming "community validation" (thresholds + rationale)

All states render `UNVALIDATED` until met — never averaged away [A: red-team three-evidence-states rule]. Thresholds are deliberately small-but-real (C): sized for a solo-founder testnet demo, yet each requires a *different human than James* to act.

| # | Evidence | Threshold | Rationale |
|---|---|---|---|
| 1 | **Outside steward** | 1 named person (not James, not an agent) making inclusion/exclusion decisions for ≥4 consecutive weeks | Red-team seedability cap: a reachable class ≠ a committed operator |
| 2 | **Knowing creators** | ≥3 creators explicitly authorizing EFS publication of their own game with permanence understood (forks with provenance don't count toward this row) | Opt-in-with-informed-permanence is the standing content law; forks prove licensing, not adoption |
| 3 | **Repeat behavior** | ≥20 distinct guests with 2+ visits ≥7 days apart, sustained in weeks 3–6 post-launch; or ≥5 humans commenting in ≥2 separate weeks | Measures post-novelty value (Q5); week-1 traffic is a share-link artifact |
| 4 | **Independent curation/mirroring** | ≥1 unprompted second party publishes a playlist/view, mirror receipt, or correction over existing game identities | The network-effect test: second party improves an existing object, someone consumes it [A: red-team network-effect correction] |
| 5 | **EFS-specific benefit vs baseline** | ≥1 documented participant statement naming a benefit the static/GitHub/IA baseline lacks, tied to a demonstrated event (e.g., survived host death) | A/B counterfactual requirement — advantage must be shown, not asserted |
| 6 | **Accepted costs** | ≥1 party other than James knowingly pays a recurring real cost (pinning, gas, curation hours) for ≥1 month | Economics as hard gate, not 5% bonus weight |
| 7 | **Independent reconstructing operator** | 1 operator rebuilds and serves the catalog from public records + export bundle with no EFS-operated index/gateway | Direct reuse of the target-community Phase-3 gate and the FUTO walk-away proof method |

Meeting 4-of-7 including #1 or #2 justifies promoting Arcade from demo to product. Meeting ≤1 by day 60 triggers STOP review.

---

## Where Arcade and the other candidates COMPOSE rather than compete

1. **Shared guest-link substrate (the big one).** Arcade's catalog/Play page is the first real implementation of the instant-guest-deep-link idea; the wiki's G1 account-free reading, the file browser, and every future guest product need the identical fast unauthenticated viewer, boot budgets, link classification, and AMBIENT/1 answer [A: Ideas.md; efs-git-deep-dive §4]. Build it once as substrate; the Arcade is its cheapest, most shareable exerciser.
2. **Shared identity ladder for participation.** Burner-session → pseudonymous-permanent comments is the same ladder as the wiki's pseudonymous proposals; Arcade comments are a low-stakes rehearsal of that flow (and of its spam/funding economics — a small live probe of the wiki's sharpest open contradiction, proposer funding vs spam [A: efs-git §5]).
3. **Shared curation machinery.** Game-catalog inclusion claims, playlists, and compatibility notes use the same lens-scoped claim primitives as wiki accepted-heads/revision-hiding and mod-capsule curator attestations — one vocabulary, three workloads [A: lens/curation threads across both reviews].
4. **Playable-archive lineage (N5).** Arcade is the legally-clean shallow end of the playable archive: it reuses PAF requirements (explicit Play, exact generations, overlay saves, smoke-test claims) and generates evidence for the still-undecided N5 without deciding it [A: owner-decision-inbox N5; museum deep dive].
5. **Gaming-community wedges plug in later.** Mod release capsules and speedrun evidence bundles (the actually-ranked gaming wedges) can attach to Arcade game identities — speedruns of Arcade's *own* games are rights-clean end-to-end, a rare fully-legal evidence-bundle pilot [A: games lane].
6. **Devcon + grants.** The Arcade demo, the FUTO walk-away proof, and the Devcon talk all want the same artifact: independent retrieval/verification of something an audience cares about, live [A: Milestones Devcon shape].

The anti-composition warning: none of this composes if Arcade mints bespoke schemas or a private index. Every Arcade object should be ordinary DATA/claims readable by the standard stack, or the composition claims above are marketing.

---

## Source index (all local, all accessed 2026-08-07)

| ID | Grade | Source (relative to this file) |
|---|---|---|
| S1 | A | [EFS Git deep dive](../../../planning-efs-git/Reviews/2026-08-07-efs-git-deep-dive.md) — wiki-as-first-product recommendation; demand-side openly unvalidated; GD-1..5; §5 risks; §8b G-FORGE steering |
| S2 | A | [Target-community opportunity map](../../../planning-target-communities/Reviews/2026-07-29-target-communities/opportunity-map.md) (@ a0ec765) — five-prospect scorecard; broad scan incl. web-game-preservation row |
| S3 | A | [Shortlist red team](../../../planning-target-communities/Reviews/2026-07-29-target-communities/shortlist-red-team.md) — playable-commons demotion; seedability cap; conventional-baseline challenge; evidence-states rule |
| S4 | A | [Games/mods/speedruns lane](../../../planning-target-communities/Reviews/2026-07-29-target-communities/games-mods-speedruns-preservation.md) — cluster ranking; Flashpoint/Nexus/Twitch loss evidence (B for its external stats, via its own GM-index) |
| S5 | A | [Mainstream candidate ranking](../../../planning-target-communities/Reviews/2026-07-29-target-communities/mainstream-candidate-ranking.md) — fixture-vs-community discipline; 90-day discovery plan; Phase-3 independent-operator gate |
| S6 | A | [Virtual OS Museum deep dive](../2026-07-29-virtual-os-museum-deep-dive.md) (+ corpus, read-only) — browser-runtime feasibility; PAF confirmations; VOM fragility; N5 evidence |
| S7 | A | [Owner decision inbox — N5](../../../planning/Designs/efsv2/owner-decision-inbox.md) (line ~246) — N5 UNDECIDED, arms N5A/B/C |
| S8 | A | [Ideas.md — instant guest deep links + two-mode applications](../../../planning/Ideas.md) (§ lines ~74–128) — guest path as product surface; dual-mode contract; boot-and-profiles foundation |
| S9 | A | [Milestones.md](../../../planning/Milestones.md) — "v1 is evidence, not baseline"; Devcon status; buildathon wound down (low turnout) |
| S10 | A | [Kanban.md](../../../planning/Kanban.md) — v2 sequencing hold + P-1 root; grants card; Done column (Sepolia deploy, burner session, faucet) |
| S11 | A | [Daily Notes/agent-status.md](../../Daily%20Notes/agent-status.md) (this worktree) — 15-game web-games dataset provenance, license method, "EFS Arcade" naming; FUTO submission; buildathon record |
