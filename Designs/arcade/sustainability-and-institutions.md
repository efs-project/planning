# EFS Arcade — sustainability and institutional form

**Status:** draft
**Target repos:** planning
**Depends on:** [[playable-archive-requirements]]
**Last touched:** 2026-08-07 — claude-fable-5 (arcade pass)

#status/draft #kind/design #repo/planning #topic/games #topic/arcade

One-line: the Arcade launches as a separately-branded, first-party-operated project with no legal entity, viable at $0 external funding, bound by four credible-neutrality product rules; everything else (entity, grants beyond FUTO, revenue features) is deferred behind explicit triggers.

All recommendations below are **proposals of this pass** (2026-08-07 arcade orchestration), not owner rulings, except where a vault ruling is cited. Primary evidence: [research-sustainability-and-institutions](../../Reviews/2026-08-07-arcade-corpus/research-sustainability-and-institutions.md) (grades noted inline), [research-alternatives-and-falsification](../../Reviews/2026-08-07-arcade-corpus/research-alternatives-and-falsification.md) §Q7, [research-communities-and-outreach](../../Reviews/2026-08-07-arcade-corpus/research-communities-and-outreach.md) §3 (donor persona).

---

## 1. Institutional recommendation: Form B

**Proposal (this pass): a separately-branded arcade, first-party-operated by James, no new legal entity.** Own name + domain (owner picks; ~$10–30/yr DNS for the guest front door; ENS/eth.limo as verifiable mirror only). Frontend MIT. Every catalog/curation record written to EFS/Sepolia so a stranger can rebuild the site. "Powered by EFS" in the colophon — EFS never endorses the arcade's curation as protocol truth. This matches the lunch-derived owner guidance (separate branding; foundation later) and is the settled frame of this pass's orchestrator recommendation.

### Scoring (condensed from the 9-criterion table, [sustainability corpus §5](../../Reviews/2026-08-07-arcade-corpus/research-sustainability-and-institutions.md))

| Criterion (1–5) | A: first-party EFS app | **B: separate brand** | C: commercial | D: DAO |
|---|---|---|---|---|
| Ordinary-player trust | 3 | **5** — reads as a normal games site | 3 | 2 |
| EFS credible neutrality | 2 — flagship curation reads as protocol rulings (Bluesky problem) | **4** | 4 | 3 |
| Grant/donation eligibility | 4 | **4** | 1 | 3 |
| Liability containment | 2 | 3 — brand distance, but no entity = same personal exposure | 3 | 2 |
| Contributor path / governance / bandwidth / clarity / operator-death (5 rows) | 19 | **23** | 12 | 12 |
| **Total** | 30 | **39** | 23 | 22 |

Key inference behind B: neutrality of EFS is enforced by **immutable contracts + portable data**, not by who runs a frontend — so the cheap reversible form of "separation" is brand + license + data-layer separation, not entity separation (splits are expensive and premature below ~$100k/yr scale; see §6 precedents).

### Reversibility paths (none blocked by anything done in September)
- **Re-absorb** as the EFS reference app: delete the brand.
- **Add entity wrapper** later ($1–5k formation, grade C estimate) if liability or money warrants.
- **Hand to a collective**: transfer Open Collective + repo + ENS name + domain.

### Graduation triggers (revisit Form B when EITHER fires)
- **>$500/mo recurring** money (donations + grant amortization), or
- **>2 regular co-maintainers** doing curation/moderation for 4+ consecutive weeks.

Until then: **explicitly deferred** — any entity, foundation, DAO, token, or revenue feature.

### Fiscal rails without an entity (do before launch, before the Aug 15–29 away window)
Open Collective via Open Source Collective host (Ruffle/Flashpoint pattern, grade A observed) + GitHub Sponsors + `.github/FUNDING.yml` + a published infra-cost transparency page (Flashpoint model: publish the server bill). These are already open tasks in the vault's grant-ops list (grade A).

## 2. Credible-neutrality boundary tests (testable product rules)

Derived from lunch-transcript owner guidance, made testable by this pass ([sustainability corpus §8](../../Reviews/2026-08-07-arcade-corpus/research-sustainability-and-institutions.md)). Every future revenue or funding idea must pass **all four**; each has a check anyone can run.

| # | Rule | Test |
|---|---|---|
| 1 | **No tollbooth on browsing** | Every catalog/game/comment page loads free, as a guest, with no wall — verifiable by loading any page logged-out, forever. |
| 2 | **No pay-to-rank** | Money can never author or reorder curation attestations. Ranked surfaces derive only from disclosed non-payment signals. Any sponsored slot would be labeled and non-attested (default: none exist at all). |
| 3 | **No surveillance** | No third-party trackers, no behavioral profiles, no ad-tech. At most aggregate self-hosted counts. Verifiable via the page's network requests. **Two disclosed exceptions, named on the about page (post-review):** (a) the comments embed (giscus, if D2 chooses it) is a third-party script — self-hosted/pinned, loading only on comment interaction, with GitHub seeing what GitHub always sees; (b) measurement uses first-party, local-only counters that report anonymous aggregate buckets (see U1) — no cross-site anything, no server-side per-visitor profiles. If either exception is unacceptable, the feature goes, not the rule. |
| 4 | **Portable exit** | Catalog, curation, and comment corpora live on EFS/Sepolia under open schemas; frontend MIT; a stranger can re-host the whole arcade without permission. Payment can never rewrite EFS truth. Verified by the second-operator reconstruction demo (a launch differentiator in this pass's frame). |

These align with the alternatives lane's neutrality red lines (no pay-for-placement; public attributable curation; donations fund operations, never ranking — [alternatives corpus Q7](../../Reviews/2026-08-07-arcade-corpus/research-alternatives-and-falsification.md)) and with standing vault postures (no shared relayer; label-don't-ban curation).

## 3. Funding plan (12 months, honest envelope)

Design constraint (proposal, this pass): **the arcade must be viable at $0 external funding.** ~$10–30/mo infra is personally absorbable; grants accelerate, never gate.

| When | Action | Ask / expected | Basis (grade) |
|---|---|---|---|
| Aug 2026, pre-away | Open Collective (OSC host) + GitHub Sponsors + FUNDING.yml + cost-transparency page | $0 setup; $0–100/mo trickle | A (vault grant-ops tasks); Flashpoint/Ruffle comparables |
| Aug–Sep | **FUTO microgrant: already submitted 2026-07-29** (proof-backed $5k application, per agent-status) — monitor for acknowledgment; do NOT resend. The Grants/README "send-ready draft" row is stale. | **$5k**, rolling decision | A (agent-status 2026-07-29 grants line; Grants/README row predates it) |
| Sep 11 → Oct | KarmaHQ milestone update; collect usage evidence | $0; evidence capital | A (vault tasks) |
| Oct–Nov | **ESP Office Hours** with preservation + credible-neutrality story and live traffic | $15–30k scoped; months-long pipeline | B (ESP restarted, Wishlist/RFP modes; Q1-26 $9.85M skewed to infra — pitch infra angle, not "games site") |
| Nov (Devcon) | Devcon talk if accepted; Gitcoin/Giveth profiles ready | $1–5k QF signal, cadence TBD post-GG24 | A (Milestones) / B |
| Q1 2027 | **Nouns DAO candidate** (Walk-Away Archive rhyme) — only if live + proof works + 2–3 warm sponsor soundings | $20–30k pilot, KYC via DUNA | A (vault nouns-dao-funding.md) |
| **Envelope** | | **base ~$10k/yr · good ~$40k · floor $0 — must survive at $0** | C (modeled) |

Off the table this planning year (grade B): Optimism Retro Funding (paused ≥12 months), Octant (invite-gated, prior EFS rejection), Arbitrum (no L2 deployment). Do not build any budget line on a single crypto funder.

Donor persona note ([outreach corpus §3](../../Reviews/2026-08-07-arcade-corpus/research-communities-and-outreach.md)): sponsors fund a **legible public good** — preservation mission + itemized server costs. Anxiety: "a startup dressed as a charity" and crypto-reputation contagion. Messaging split to manage, not hide: crypto funders want the chain named; game communities don't.

## 4. Cost model (condensed)

Full table in [sustainability corpus §6](../../Reviews/2026-08-07-arcade-corpus/research-sustainability-and-institutions.md); grades B/C (modeled).

- **Cash at launch scale: ≈$120–400/yr** (~$10–30/mo): domain + ENS ~$1–3/mo; VPS $6–24/mo (no devnet VPS baseline in vault — James to fill actuals); IPFS pinning $0 on Pinata free tier (the 500-file cap binds before the GB does); Sepolia gas ≈ $0 (faucet-limited, not priced — the drip is owner-time, not money).
- **The RPC line is the first real bill — model corrected post-review.** The corpus's call-count model had a unit error (it compared raw eth_calls against Alchemy's compute-unit quota ~1:1; an eth_call costs ~26 CU, so its numbers were 5–26× off) and costed the chatty explorer architecture the design bans. Re-derived for the *designed* architecture: browse ≈ 0 RPC (baked manifest); one Play ≈ 7–11 eth_calls ≈ ~200–300 CU. At 1k plays/day ≈ ~6–9M CU/mo — comfortably inside a 30M-CU free tier; at 10k plays/day ≈ ~60–90M CU/mo — a paid tier ($49-class) *or* a read-through cache brings it back down. The binding constraint on launch day is the **per-second rate cap** (~500 CU/s free ≈ ~2 concurrent Play resolutions): a Show HN spike will hit it, so ship the same-origin caching proxy (or accept queued Play starts) *before* the launch posts, not as a contingency. Grade C model, B tiers; the corpus §6 row carries the correction note.
- **The real cost is labor: 5–12 founder-hours/week steady-state** — dominated by curation (license verification, provenance, playtesting: 3–8 hrs/wk — the single largest cost of the whole product) and moderation (2–4 hrs/wk at launch; 10+ hrs/wk at 10k/day breaks the solo model). **Honesty note (post-review): that figure is ops only** — the same design set also schedules outreach follow-ups, grant-ops (KarmaHQ, ESP prep), the weekly game cadence, and incident response, which realistically add 2–5 hrs/wk through October. Guest-read/gated-write and drip-rate limits are therefore **sustainability features**, not just UX.
- Legal one-offs: DMCA designated-agent registration $6; ToS/AUP counsel review $1–3k **flagged, counsel-dependent, not legal advice**. Flashpoint precedent: responsive takedown posture has substituted for entity armor for years (grade B).

Consequence: grants should buy **time/features**; donations should target **transparent infra costs**.

## 5. Backup models ranked, with boundary-test results

| Rank | Model | Boundary tests | Notes |
|---|---|---|---|
| 1 | Donations/patronage (OC + Sponsors + Ko-fi) | Pass 1–4 | Primary. Expect $0–100/mo year one (treated as upside, not budget — grade C from A/B comparables). |
| 2 | Grants (§3 plan) | Pass 1–4 | Lumpy; report publicly via KarmaHQ. |
| 3 | Creator-side optional rev-share, itch-style (later "app-store" phase) | Pass, **iff** paid placement never touches ranking (test 2) | Creator sets the split, default ~0–10%; browsing and free games untouched. itch.io proves the shape runs lean for a decade (grade B). Not for September. |
| 4 | Merch / commissions / bounties (e.g., commissioned ports of freely-licensed classics via OC projects) | Pass 1–4 | Small. |
| 5 | Services on top (paid pinning/mirroring SLAs for others' EFS data; white-label arcades) | Pass — sells operations, not truth | Post-SDK, post-hackathon per vault scope ruling (grade A). |

**Excluded permanently** (each fails a boundary test outright): paid ranking (fails 2), browsing paywalls (fails 1), surveillance ads (fails 3), token sale (fails 2 and 4 in practice, plus DAO overhead §6).

## 6. Precedent warnings — set expectations brutally

All grade A/B, [sustainability corpus §2, §4](../../Reviews/2026-08-07-arcade-corpus/research-sustainability-and-institutions.md).

- **Nobody in game preservation is rich.** **Ruffle** — load-bearing for the entire Flash ecosystem (IA, itch, Newgrounds embed it) — runs on **~$20k/yr** (OC, observed: $173,760 lifetime / 310 contributors). That is the **top** of the niche. **libretro/RetroArch**, world-famous, earns **<$10k/yr** on Patreon (~$800/mo, ~330 members). **Flashpoint** hosts ~200k games on **€60–120/mo** of donated server money and a takedown-on-request posture. Planning number: $0–100/mo donations, year one.
- **Farcaster**: $180M raised for protocol + flagship client; when growth missed, the **protocol itself was sold to Neynar (Jan 2026)** and the money returned. The VC path put a neutral protocol inside a venture vehicle and the protocol changed hands.
- **Matrix Foundation**: entity split without a funding plan = rolling crisis — Feb 2025 shut-down-the-bridges ultimatum unless $100k raised in a month; freemium homeserver to keep matrix.org alive. The foundation absorbed the unfunded public-goods bill.
- **Signal** runs on **$38M/yr** and is still donor-dependent — total trust bought with a ~$105M patron loan. Not replicable solo; do not cite it as a model.
- **Treasure DAO** (from this pass's competitor lane): its dedicated game chain died ~5 months after launch — chains and tokens do not make games sustainable ([research-competitors-and-precedents](../../Reviews/2026-08-07-arcade-corpus/research-competitors-and-precedents.md)).
- **Legal lane is the funding lane**: the US Copyright Office denied (4th time, Oct 2024) the DMCA exemption for remote access to preserved games; Internet Archive lost *Hachette* finally. Freely-licensed browser-native games are the only lane with no DMCA cloud — the preservation moral story is a funding asset **only while the catalog is unimpeachable**.
- **Do not repeat** the "VGHF 2025 layoffs" claim anywhere public or funder-facing — searched, not corroborated (grade C); VGHF in fact hired and launched its digital library.

Synthesis: brand separation now, entity maybe never; budget founder-hours as the scarce resource; treat every dollar as acceleration, none as oxygen.

## Open questions

- [ ] Owner: pick the arcade's name and domain (blocks OC/Sponsors setup copy and the FUTO framing).
- [ ] Reconcile FUTO status: sustainability lane says "send-ready pending sign-off"; alternatives lane records "submitted 2026-07-29." Which is true, and is a follow-up (not a duplicate send) the right move?
- [ ] Open Collective host choice (OSC vs OC Europe) and who is the legal payee while there is no entity — confirm James is comfortable with personal receipt.
- [ ] VPS actuals: no devnet VPS cost baseline exists in the vault — James to fill in real numbers for the transparency page.
- [ ] Does the cost-transparency page ship at launch (recommended) or after the first real bill?
- [ ] Should the four boundary tests be published verbatim on the arcade's about page as a standing public commitment (this pass recommends yes — it is the donor persona's anti-"startup-dressed-as-charity" answer)?
- [ ] Sepolia honesty: how does the funding pitch scope the permanence claim (testnet, v2 supersession planned) without undercutting the preservation story? Needs one agreed paragraph reused everywhere.

## Pre-promotion checklist

- [ ] All Open questions resolved or deferred
- [ ] Target repos confirmed
- [ ] Depends on chain accepted
- [ ] No AGENT-Q comments remain
- [ ] One review round completed
