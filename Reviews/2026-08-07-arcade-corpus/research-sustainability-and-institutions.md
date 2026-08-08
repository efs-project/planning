# EFS Arcade — Sustainability and Institutional Form

One-line purpose: evidence-graded research on funding sources, game-preservation funding precedents, protocol/app institutional splits, an honest cost model, and a recommended September institutional path for the EFS Arcade hypothesis.

Research date: 2026-08-07. All web sources accessed 2026-08-07 unless noted. Local vault sources read same day.

**Evidence-grade legend**
- **A** — primary source directly observed (fetched page, local vault file, on-chain read).
- **B** — reputable secondary source (news, docs surfaced via search snippets, not independently re-fetched).
- **C** — uncertain, inferred, modeled, or not corroborated.

---

## 1. Grant landscape as of August 2026 (the "grant winter" is partial but real)

| Program | Status 2026-08 | Fit for Arcade | Grade |
|---|---|---|---|
| **Ethereum Foundation ESP** | Restarted after 2025 pause; new two-mode model (Wishlist + RFPs); allocated $9.85M in Q1 2026, skewed to core infra/crypto/security | Office Hours route is live. Arcade = legible human-facing public good on Ethereum; but Q1 spend pattern favors infrastructure. Pitch the *preservation + credible-neutrality infra* angle, not "a games site." | B |
| **Gitcoin** | GG24 (first Gitcoin 3.0 round) ran Oct 2025–Mar 2026; ~$1.8M across 6 domains via Domain Allocators; next round cadence not yet announced | Good for small QF signal ($1–5k realistic) + public legibility, once a public profile and donor base exist. Not a base-load funder. | B |
| **Octant** | v1 sunset; v2 "Atlas" invite-gated during beta; EFS's prior proposal was rejected (vault record) | Blocked near-term. Re-approach only with traction evidence and possibly an invite. | A (vault) / B (web) |
| **Optimism Retro Funding** | **Paused ≥12 months**; no rounds in Year 4/5 forecast; 777.6M OP (90.5% of allocation) held in reserve; Optimism cut OP spend ~35%, pivoting to enterprise | Off the table for this planning year. Remove from any 12-month revenue assumptions. | B |
| **Arbitrum DAO (D.A.O. / Questbook DDA)** | Season 3 live with ~$7M, grants up to $25k (1 allocator) / $50k (2 allocators); program year runs to ~March 2026, renewal unclear | Has a *Gaming* domain precedent (Wayfinders grant). But EFS is Sepolia-native; Arbitrum grants require Arbitrum-specific impact. Weak fit unless an Arbitrum deployment exists. | B |
| **Protocol Guild** | Membership-based funding for Ethereum L1 core R&D; not an application target for EFS (vault ruling stands) | Model reference only: dependency-funding via pledges works when you ARE the dependency. Arcade is not. | A (vault) / B |
| **Nouns DAO** | Candidate route live (0.01 ETH creation, 3-vote threshold, sponsors possible); treasury ~81 ETH + large LST/USDC holdings at 2026-07-31 check; DUNA + KYC apply | Deep vault research already exists ([nouns-dao-funding](../../Grants/nouns-dao-funding.md) in main planning vault). The "Walk-Away Archive" concept rhymes exactly with the Arcade's preservation story. A *Nouns arcade/archive slice* is a plausible Q1-2027 $20–30k pilot — but only after a working proof and sponsor soundings. | A (vault) |
| **FUTO** | Microgrants $1–5k rolling; EFS application worksheet + send-ready email already drafted in vault | **Nearest-term real money.** FUTO's "user control, walk-away, anti-lock-in" values fit the Arcade's guest-first, portable-exit promise. The arcade could BE the walk-away file-proof demo. | A (vault) |
| **Giveth / Drips / GitHub Sponsors / Open Collective** | Always-on donation rails; vault has open tasks to decide on OSC fiscal host, Drips, FUNDING.yml | Cheap to set up pre-launch; do it before any public traffic exists. | A (vault) |

Net read: 2026 is a consolidation year for crypto public-goods funding (Optimism paused, Octant gated, Gitcoin restructured, EF concentrated on infra). The realistic 12-month grant envelope for a project of this size is **$5k–$40k**, base case ~$10k, not six figures.

## 2. Game-preservation funding precedents

### Flashpoint Archive (closest operational analog)
- Volunteer project; fiscally hosted via **Open Collective Europe**; 100% of donations to infrastructure. A recent campaign raised **~€7,600 from 122 contributors**; server costs are **€60–120/month**. (Grade B)
- Legal posture: **takedown-on-request** — removes games when IP owners ask, quickly. No entity armor; goodwill + responsiveness + noncommercial posture is the shield. Flashpoint hosts ~200k games this way and has survived for years. (Grade B)
- Lesson: a preservation catalog can run on a three-digit monthly budget and a compliance-friendly posture. Labor is donated; donations cover metal.

### Ruffle (best donation comparable — web-game preservation infra)
- Open Collective (Open Source Collective 501(c)(6) fiscal host), directly observed 2026-08-07: **$173,760 total raised lifetime; $93,895 disbursed; $79,865 balance; estimated annual budget $20,685; 310 contributors**. (Grade A)
- That is the *top* of the niche: Ruffle is load-bearing for the entire Flash-game ecosystem (Internet Archive, itch.io, Newgrounds all embed it) and still runs on ~$20k/yr. Funds reimburse core contributors and pay CI/domains.

### libretro / RetroArch
- Public Patreon: **~$776–809/month, ~330 paid members** (Graphtreon + Patreon page). One of the most famous emulation projects on earth earns under $10k/yr on Patreon. (Grade B)

### Video Game History Foundation (VGHF)
- 501(c)(3). **The rumored 2025 layoffs could NOT be corroborated** — searches found no layoff reports; instead VGHF *hired* a Development Director and launched its free digital library (magazines, dev materials) in early 2025 with a v2 archive portal rollout in 2026. Treat "VGHF layoffs" as unverified until shown otherwise. (Grade C on the layoff claim; B on the library launch)
- Legal: the US Copyright Office **denied (4th time) the DMCA exemption for remote access to preserved games (Oct 2024)**; ESA said it would never support remote access "under any conditions." VGHF's response: researchers are forced to extra-legal channels. (Grade B)
- Lesson: *emulated/proprietary* game preservation is legally stuck in the US. The Arcade's easy-lawful-browser-games-only scope (owner guidance) is not just pragmatic — it is the only lane with no DMCA cloud. Freely-licensed games sidestep the entire fight while still serving the preservation moral story.

### Internet Archive
- Lost *Hachette v. Internet Archive* (2d Cir., Sept 2024; no cert petition by Dec 2024 deadline — final). Fair use rejected for controlled digital lending; **500k+ books removed**. (Grade B)
- Lesson: "we're a library" is not a defense for redistributing in-copyright works at scale, even for a well-funded nonprofit. Reinforces: license-permitted content only, provenance recorded, takedown path published.

### Funding-precedent synthesis
Nobody in game preservation is rich. Realistic recurring-donation bands for a niche preservation/OSS project with public numbers:
- Typical small project: **$50–300/month** (most OC/Patreon pages in this niche).
- Famous, load-bearing project: **$800–1,700/month** (libretro; Ruffle lifetime average ≈ $1.7k/mo but lumpy).
- Institutional nonprofit (VGHF): grants + donors + events; staffed org; not reachable solo.
Planning number for EFS Arcade year one: **$0–100/month donations**, treated as upside, not budget. (Grade C, modeled from A/B comparables)

## 3. itch.io as marketplace model
- **Open revenue sharing since March 2015: the developer chooses itch.io's cut, 0–100%, default 10%** (vs 30% industry standard). Buyers pay-what-you-want; itch charges nothing to list. (Grade B)
- Relevance: this is the proven non-extractive marketplace shape. If the Arcade ever adds a paid/creator lane ("app-store-for-games later," per owner guidance), the itch model — creator sets the split, platform default modest, browsing always free — passes all four credible-neutrality boundary tests below. It also proves such a platform can run lean for a decade+.

## 4. Protocol / flagship-app split precedents

| Case | Structure | What the split bought / cost | Grade |
|---|---|---|---|
| **Bluesky / atproto** | One PBC ships both protocol and flagship app; stated intent to move protocol governance to a neutral long-lived structure; PBC retains bsky.app product control | Bought: speed, one brand, one funding story. Cost: persistent "is atproto really neutral?" skepticism; governance separation still promissory in 2025 protocol check-ins. | B |
| **Farcaster / Warpcast (Merkle Manufactory)** | VC company owned protocol + flagship client (>90% of users on Warpcast) | Raised $180M ($30M a16z 2022 + $150M Paradigm 2024, ~$1B valuation). Jan 2026: **protocol sold to Neynar; Merkle refunding the full $180M to investors**; protocol continues, "developer-focused." Cost of the VC path: when growth missed, the *protocol itself* changed hands. Cautionary tale for putting a neutral protocol inside a venture vehicle. | B |
| **Signal Foundation** | Nonprofit owns protocol + app | Runs on **$38M/yr (2024)**; bootstrapped by Acton's ~$105M loan (later reduced); Sustainer donations ~$8–12M/yr by late 2025 — still structurally donor-dependent at massive scale. Bought: total trust. Cost: needs a patron; not replicable solo. | B |
| **Matrix / Element** | Protocol foundation split from commercial company (Element) | The split without a funding plan produced a rolling crisis: Foundation went from Element-dependent to 11 funding members covering ~half its budget; **Feb 2025: shut-down-the-bridges ultimatum unless $100k raised by March**; 2025: freemium homeserver introduced to avoid turning matrix.org off. Bought: legitimacy and multi-vendor ecosystem. Cost: the foundation absorbed the unfunded public-goods bill. | B |
| **DAO overhead for tiny projects** | — | Nouns-style DUNA (Wyoming) shows even DAOs now need a legal wrapper, compliance admin, KYC of grantees (vault Nouns research, 2026 DUNA update). A governance token/DAO for a one-person project adds entity cost ($1–5k+ setup), tax/compliance surface, and decision latency, and buys nothing James lacks (he already has full legitimacy over a new app). | A (vault) / C (cost est.) |

Synthesis: **splits are expensive and premature below ~$100k/yr scale.** The cheap, reversible version of "separation" is *brand separation + license separation + data-layer neutrality*, not entity separation. Neutrality of EFS is enforced by the contracts being immutable and the data portable — not by who runs the arcade frontend.

## 5. Institutional forms scored

Forms: **(A) First-party EFS reference app** ("EFS Arcade", explicitly the protocol's own demo app). **(B) Separately-branded project on EFS** (own name/domain/identity; "powered by EFS" in the colophon; still built and operated by James; no new entity yet). **(C) Commercial service on neutral EFS** (a company product with revenue intent). **(D) DAO/collective from day one.**

Score 1–5 (5 best):

| Criterion | A first-party | B separate brand | C commercial | D DAO |
|---|---|---|---|---|
| User trust (ordinary player) | 3 — protocol branding smells like a crypto site | **5** — reads as a normal games site | 3 — commercial intent invites suspicion of future rug | 2 — confusing to normies |
| Credible neutrality of EFS | 2 — flagship app's choices read as protocol rulings (Bluesky problem) | **4** — curation opinions belong to the brand, not the protocol | 4 — clearly just one client | 3 |
| Funding eligibility (grants/donations) | 4 — EF/public-goods legible | **4** — preservation story is grant-legible; can still disclose EFS underneath | 1 — grant funders shun commercial; VC premature | 3 — some DAO-to-DAO money, high overhead |
| Liability containment | 2 — complaints hit EFS itself | 3 — brand distance, same person (no entity = same personal exposure) | 3 — entity possible but costs | 2 — DUNA/KYC overhead |
| Contributor ownership path | 2 | **4** — a project identity people can join without "joining EFS core" | 2 | 5 |
| Governance burden | **5** — none | **5** — none | 3 | 1 |
| Founder bandwidth fit (solo, away 2 wks Aug) | 5 | **5** | 2 — revenue ops | 1 |
| Operational clarity | 4 | **5** — one owner, clear scope | 3 | 1 |
| Operator-death survival | 3 | 4 — if catalog/curation data live on EFS + frontend is MIT + mirrors documented, anyone re-hosts | 2 | 4 in theory, 1 in practice at this size |
| **Total** | 30 | **39** | 23 | 22 |

This matches the lunch-transcript guidance (separate branding suggested; foundation later) and the Farcaster/Matrix evidence.

### Recommendation for September (reversible default)
**Form B: a separately-branded arcade, first-party-operated, no new legal entity.**
- Own name + domain (normal DNS domain for the guest path, ~$10–30/yr; ENS/eth.limo as the verifiable mirror, not the front door).
- Frontend MIT-licensed; every catalog/curation record written to EFS/Sepolia so any third party can rebuild the site (operator-death test).
- "Powered by EFS" positioning in about/colophon; EFS keeps its own site and never endorses the arcade's curation as protocol truth.
- Fiscal rails without an entity: **Open Collective via Open Source Collective** (Ruffle/Flashpoint pattern) + GitHub Sponsors + `.github/FUNDING.yml` — these are already open tasks in the vault's grant-ops list; close them before launch.
- Reversibility: can be re-absorbed as the EFS reference app (delete brand), spun into an entity (add wrapper), or handed to a collective (transfer OC + repo + ENS name) — none of these are blocked by anything done in September.
- Explicitly deferred: any entity, foundation, DAO, token, or revenue feature. Revisit at >$500/mo recurring money or >2 regular co-maintainers, whichever first.

## 6. Cost model (monthly unless noted)

| Line | Now → 100 visitors/day | 1k/day | 10k/day | Notes | Grade |
|---|---|---|---|---|---|
| Sepolia gas | ~$0 | ~$0 | ~$0 | Testnet ETH is faucet-limited, not priced. Gasless faucet-drip for user writes is the hackathon must-have (vault memory); budget owner time, not money. Comments at scale = drip-rate design problem. | A (vault) / C (scale) |
| IPFS pinning (<1GB corpus) | $0 (Pinata free: 1GB storage, 10GB bandwidth, 500 files) | $0–20 (bandwidth is the binding limit, not storage; Pinata paid entry ≈ $20; Storacha pricing unverified) | $20–100 (serve game bundles via cached gateway/CDN or self-host on VPS to cap egress) | 500-file cap on Pinata free matters more than the GB for a many-file catalog. Self-hosted Kubo on existing VPS ≈ $0 marginal. | B / C |
| VPS | $6–24 | $12–48 | $24–80 | **No devnet VPS cost baseline found in the planning vault** — flag for James to fill in actuals. Ranges are standard Hetzner/DO 2026 shared-instance pricing. | C |
| RPC | $0 (Alchemy free: 30M CU/mo, ~500 CU/s; Infura free: 3M/day per docs, some sources say 6M/day) | $0–49 (with server-side caching; without caching a chatty catalog page can burn free tier) | $49–300, or $0–49 with an indexer/cache layer | Modeled: 20–100 RPC reads per uncached visit → 10k/day ≈ 6–30M calls/mo, over free tier. A read-through cache (the site is mostly-static catalog data) cuts this 10–100×. Vault memory: live Sepolia already needs a dedicated RPC key. | C (model) / B (tiers) |
> **Correction note (2026-08-07 adversarial review):** the row above compares raw eth_calls against a compute-unit quota ~1:1 — an eth_call costs ~26 CU, so the call counts understate CU consumption by 5–26×; it also costs the chatty explorer architecture the design bans. Re-derived for the designed architecture (zero-RPC browse; ~7–11 eth_calls ≈ 200–300 CU per Play): 1k plays/day ≈ 6–9M CU/mo (inside free tier); 10k/day ≈ 60–90M CU/mo (paid tier or cache). The launch-day binding constraint is the per-second cap (~500 CU/s ≈ ~2 concurrent Play resolutions) — a Show HN spike hits it; ship the caching proxy before the launch posts. See the design set's sustainability doc §4 for the corrected model.
| Domain + ENS | ~$1–3 (domain $10–30/yr; .eth renewal ~$5/yr for 5+ chars; eth.limo free) | same | same | | B |
| **Cash subtotal** | **~$10–30** | **~$15–120** | **~$100–450** | Cash is not the constraint. | C |
| Moderation labor | 2–4 hrs/wk | 4–8 hrs/wk | 10+ hrs/wk (breaks solo model) | Comments + takedown requests + spam. Guest-read/gated-write keeps this low early. | C |
| Curation/testing labor | 3–8 hrs/wk | same | same | Building the real catalog beyond the 15-game technical corpus: license verification, provenance, playtesting. This is the single largest cost of the whole product. | C |
| Legal one-offs | $0 DIY license audit; DMCA designated-agent registration $6 (US Copyright Office fee) | — | — | **Counsel-dependent (flagged, not researched as legal advice):** ToS/AUP review $1–3k; entity formation $1–5k if/when Form B graduates. Flashpoint precedent: responsive takedown posture has substituted for entity armor for years. | C |

Bottom line: **≈$120–400/year cash at launch scale; the true budget is 5–12 founder-hours/week**, dominated by curation and moderation. Grants should therefore buy *time/features*, and donations should target *infra cost transparency* (Flashpoint model: publish the server bill).

## 7. 12-month funding plan (realistic)

| When | Action | Ask / expected | Basis |
|---|---|---|---|
| Aug 2026 (pre-launch, before James leaves) | Stand up Open Collective (OSC host) + GitHub Sponsors + FUNDING.yml; publish infra-cost transparency page | $0 setup; expect $0–100/mo trickle | Flashpoint/Ruffle pattern; vault grant-ops open tasks |
| Aug–Sep 2026 | Send the drafted **FUTO microgrant** with the Arcade as the walk-away file-proof demo (guest link → verified play → export & verify offline) | **$5k**, decision on FUTO's rolling timeline | Vault: futo-microgrant-application.md is send-ready pending James sign-off |
| Sep 11 launch → Oct | Update KarmaHQ page with Arcade milestone; register OSO if pursued; collect usage evidence | $0; evidence capital | Vault grant-ops tasks |
| Oct–Nov 2026 | **ESP Office Hours** with the preservation + credible-neutrality story and live traffic numbers; route to Wishlist/RFP as advised | $15–30k scoped grant; months-long pipeline | ESP restarted with Wishlist/RFP modes; Q1-2026 $9.85M shows money flows |
| Nov 2026 (Devcon) | Devcon talk (if accepted) as distribution + funder-legibility event; Gitcoin/Giveth profiles ready before it | $1–5k QF signal in next Gitcoin round (cadence TBD post-GG24) | Vault Milestones; GG24 retrospectives |
| Q1 2027 | **Nouns DAO candidate** for a Nouns-slice of the arcade/archive (Walk-Away Archive rhyme) — only if arcade is live, proof works, and 2–3 sponsor soundings are warm; candidate costs 0.01 ETH | $20–30k pilot, milestone-paid, KYC via DUNA | Vault nouns-dao-funding.md evidence gate |
| Q1–Q2 2027 | Re-approach Octant v2 (if invited) and Arbitrum only if program renews AND an L2 angle exists; watch Optimism un-pause | contingent | This file §1 |
| **12-month envelope** | | **base ~$10k; good case ~$40k; floor $0 (project must survive at $0)** | |

Design constraint honored: the arcade must be **viable at $0 external funding** — ~$30/mo infra is personally absorbable; grants accelerate, never gate.

## 8. Backup revenue models, ranked, with boundary tests

Credible-neutrality boundary tests (from lunch-transcript guidance, made testable):
1. **No tollbooth on browsing** — every catalog/game/comment page loads free, guest, no wall, forever.
2. **No pay-to-rank** — money can never author or reorder curation attestations; ranked surfaces derive only from disclosed non-payment signals; any sponsored slot would be labeled and non-attested (default: none at all).
3. **No surveillance** — no third-party trackers, no behavioral profiles, no ad-tech; aggregate self-hosted counts at most.
4. **Portable exit** — catalog, curation, comments live on EFS/Sepolia under open schemas; frontend MIT; a stranger can re-host the whole arcade without permission. Payment can never rewrite EFS truth.

Ranked backups (all pass the tests unless noted):
1. **Donations/patronage** (OC + GitHub Sponsors + Ko-fi): passes all; expect $0–100/mo (§2 comparables). Primary.
2. **Grants** (§7): passes all; lumpy; report publicly via KarmaHQ.
3. **Creator-side optional rev-share, itch-style, later** ("app-store-for-games" phase): creators may sell/donate-gate *their own* games; arcade default cut ~0–10%, creator-adjustable; browsing and free games untouched. Passes tests if paid placement never touches ranking. Not for September.
4. **Merch/commissions/bounties** (e.g., commissioned ports of freely-licensed classics, funded via OC projects): passes; small.
5. **Services on top** (paid pinning/mirroring SLAs for *others'* EFS data, white-label arcades): passes (sells operations, not truth); post-SDK, post-hackathon per vault scope ruling.
- **Excluded permanently:** paid ranking, browsing paywalls, surveillance ads, token sale — each fails a boundary test outright.

## 9. Key risks for this lane
- Optimism-style pauses can spread; do not build a budget on any single crypto funder (mitigated: $0-viable design).
- The preservation moral story is strong but legally scoped: stay strictly in freely-licensed/browser-native games (VGHF DMCA denial, Hachette) — this is a *funding* asset only while the catalog is unimpeachable.
- Solo-founder moderation labor is the first thing that breaks at traction; comment write-gating and drip-rate limits are sustainability features, not just UX.
- VGHF "layoffs" claim in the brief: **not corroborated** — do not repeat it in any public or funder-facing material.

---

## Source index (all accessed 2026-08-07)

**Local (grade A):**
- [../../Grants/programs.md](../../Grants/programs.md) (funder landscape, 2026-07-28 pass)
- [../../Grants/README.md](../../Grants/README.md) (grant-ops tasks: OC/Drips/GitHub Sponsors decisions pending)
- [../../Grants/nouns-dao-funding.md](../../Grants/nouns-dao-funding.md) (2026-07-31 on-chain reads, candidate route, Walk-Away Archive concept)
- [../../Milestones.md](../../Milestones.md) (Devcon application pending; v2 design phase)
- Vault memory: devnet chainId 26001993; gasless faucet-drip = hackathon must-have; dedicated RPC needed for live Sepolia.

**Web (grade A where fetched, else B):**
- Ruffle Open Collective (fetched): https://opencollective.com/ruffle
- EF ESP restart: https://blog.ethereum.org/2025/08/29/esp-next-chapter ; Q1-2026 allocation: https://www.kucoin.com/news/flash/ethereum-foundation-announces-9-85m-q1-2026-ecosystem-funding
- Gitcoin GG24: https://gitcoin.co/case-studies/gg24-first-funding-round-of-gitcoin-3-0 ; https://gov.gitcoin.co/t/gg24-public-goods-tooling-development-round-full-retrospective/25276
- Optimism Retro Funding pause: https://www.optimism.io/blog/season-9-from-experiment-to-organization ; https://www.cryptotimes.io/2026/08/06/optimism-cuts-op-spending-35-in-year-4-pivots-to-enterprise/
- Octant v2: https://docs.octant.app/en-EN/faq.html ; https://octant.build/en/about
- Arbitrum DDA Season 3: https://forum.arbitrum.foundation/t/arbitrum-d-a-o-grant-program-season-3-official-thread/28753
- Flashpoint funding: https://opencollective.com/flashpointarchive ; https://flashpointarchive.org/
- libretro Patreon: https://graphtreon.com/creator/libretro ; https://www.patreon.com/libretro
- VGHF status/library: https://gamehistory.org/ ; https://gamehistory.org/archive-portal-update-2026/ ; DMCA denial: https://gamehistory.org/dmca-2024-statement/ ; https://www.gamedeveloper.com/business/u-s-copyright-office-rejects-dmca-exemption-to-support-game-preservation
- Hachette v. Internet Archive: https://www.eff.org/cases/hachette-v-internet-archive ; https://publishers.org/news/aap-celebrates-final-victory-in-infringement-case-against-internet-archive/
- itch.io open revenue share: https://itch.io/updates/introducing-open-revenue-sharing ; https://www.gamedeveloper.com/business/itch-io-launches-open-revenue-sharing
- Bluesky/atproto governance: https://docs.bsky.app/blog/protocol-roadmap ; https://docs.bsky.app/blog/protocol-checkin-fall-2025
- Farcaster→Neynar + $180M refund: https://decrypt.co/355668/farcaster-to-repay-180m-to-investors-amid-pivot-to-developer-focused-direction ; https://cointelegraph.com/news/farcaster-neynar-acquisition-investor-capital-return
- Signal costs/funding: https://en.wikipedia.org/wiki/Signal_Foundation ; https://factually.co/fact-checks/technology/signal-foundation-financing-irs-form-990s-57cec8
- Matrix Foundation crisis: https://matrix.org/blog/2025/02/crossroads/ ; https://matrix.org/blog/2024/12/25/the-matrix-holiday-special-2024/
- Pinata pricing: https://pinata.cloud/blog/pinatas-new-pricing-no-more-pin-limits-more-storage-for-less/
- Alchemy free tier: https://www.alchemy.com/support/free-tier-details ; Infura pricing: https://docs.infura.io/get-started/pricing/
- Protocol Guild (model reference): https://protocol-guild.readthedocs.io/

**Modeled / uncorroborated (grade C):** RPC-load-per-visitor model; VPS baseline (absent from vault); Storacha pricing; DAO overhead cost estimates; VGHF 2025 layoffs (searched, no evidence found); donation planning band.
