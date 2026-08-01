# Nouns DAO Funding Research

Point-in-time funder research checked 2026-07-31. This is evidence and a proposed funding strategy, not a decision to apply, buy a Noun, contact a delegate, or make the proposed pilot part of EFS v2.

## Current verdict

Nouns DAO is a credible funding prospect for a **bounded Nouns-serving EFS pilot**. It is a weak prospect for an abstract request to fund the whole EFS redesign.

The strongest initial concept is a **Nouns Walk-Away Archive**: a portable, verifiable, anonymously browsable archive of Nouns artwork, governance history, media references, and funded-project evidence. A playful Nounish EFS OS or file-browser surface could make that archive useful and visible, but the archive and independent exit proof are the substance. “Forever” is useful Nouns language, not a technical guarantee; each carrier and maintenance claim must name its actual conditions.

The working line is:

> One Noun every day, forever deserves a walk-away archive that does not depend on today's websites.

Do not submit or buy a Noun yet. First validate the concept against recent voting behavior and likely sponsors, then produce an inspectable vertical slice.

## Why Nouns could fit

- Nouns explicitly funds projects across domains, including crypto infrastructure, from a treasury governed by Noun holders.
- Nouns has funded an open-source Ethereum operating system: [Proposal 279, ethOS](https://nouns.wtf/vote/279), executed for 40 ETH. The team already had ethOS v2.1 and a year of self-funded development; its proposal added a concrete Nounish phone edition.
- Nouns has funded open-source, self-hostable governance infrastructure: [Proposal 242, House of Nouns v2](https://nouns.wtf/vote/242), executed for 95 ETH after the team reduced its original budget substantially. The proposal emphasized permanent community access and prior MVP usage.
- Nouns funded the development of [Prop House](https://www.nouns.com/vote/469), public infrastructure for community funding rounds, and has supported other governance infrastructure such as Agora.
- Nouns has funded CC0 repositories, including [Proposal 94's CC0 space image bank](https://www.nouns.com/vote/94) for 12 ETH, which is adjacent to EFS's archive, reuse, provenance, and discovery strengths.
- More recently, [Proposal 856](https://www.nouns.camp/proposals/856) passed 210 FOR to 9 AGAINST for concrete Nouns developer-learning missions, evidence that current voters can still support legible technical ecosystem work.
- Nouns artwork and official brand assets are [CC0](https://nouns.wtf/brand), so a Nounish demonstration has unusually permissive reuse rights.

These precedents show possibility, not entitlement. The closest precedent, ethOS, also shows the bar: existing proof, a bounded deliverable, a capable team, and an explicit benefit to Nouns.

## Current governance and funding mechanics

Official documentation and read-only Ethereum calls were checked on 2026-07-31.

| Item | Current read | Implication for EFS |
|---|---|---|
| Proposal threshold | 3 votes | One purchased Noun cannot independently submit a proposal. |
| Proposal Candidate | Available below the threshold; proposer and sponsor votes must total 3 | James can seek sponsors instead of buying enough Nouns to propose. |
| Candidate creation cost | Live `NounsDAOData.createCandidateCost()` returned 0.01 ETH | The permissionless candidate route is far cheaper than buying a Noun. |
| Voting | One Noun equals one vote; votes can be delegated | A Noun gives participation and signaling, not likely passage. |
| Quorum | Dynamic; live checks at block 25,657,114 indicated roughly 136-204 FOR votes depending on eligible supply and opposition | Sponsorship only opens voting. Broad community support still determines funding. The official documentation's 108-162 example was stale when checked. |
| Lifecycle | At least 9 days after proposal creation | Pre-proposal discussion and sponsor work will take longer than the formal vote. |
| Legal/compliance | Nouns operates through a Wyoming DUNA; grant recipients undergo KYC and AML/OFAC checks | Any proposal must name a compliant recipient and payment arrangement. |

Sources: [official proposal documentation](https://docs.nouns.wtf/governance/proposals), [DUNA documentation](https://docs.nouns.wtf/legal/duna), and [official contract deployments](https://docs.nouns.wtf/protocol/deployments). At the same check, `proposalThreshold()` returned `3`, `proposalCount()` returned `987`, and the official treasury executor held approximately `81.487 ETH` plus approximately `2,134.075 wstETH`, `934.894 mETH`, `163.089 rETH`, `484,743.289 USDC`, and `55.065 WETH`. Token prices and treasury composition move; the controlling conclusion is only that funding capacity exists and community fit is the harder constraint. [Treasury explorer](https://etherscan.io/address/0xb1a32fc9f9d8b2cf86c068cae13108809547ef71)

The [executed DUNA bylaws](https://www.nouns.camp/proposals/727) authorize grants that further the DAO's purposes and say voters may not consider whether a proposed grantee is a member. This is unusually direct evidence that buying a Noun should not be treated as a funding prerequisite.

## Should James buy a Noun?

**Not for the purpose of obtaining funding.**

On 2026-07-31, the verified Nouns collection showed a secondary-market floor around 0.70 ETH. That is volatile, listing-specific, and not a guarantee of liquidity or authenticity; verify the token contract and current market before any purchase. [Observed collection](https://opensea.io/collection/nouns)

Buying one Noun would provide:

- one governance vote;
- the ability to delegate that vote;
- a visible long-term stake in the community;
- one of the three votes needed to promote a candidate, leaving two more to secure.

It would not provide:

- independent proposal power;
- enough votes to pass a proposal;
- privileged access to funding;
- protection from price or liquidity loss.

Buy only if James independently wants long-term Nouns membership and can accept losing the full purchase value. A current 2026 candidate asks the DAO for one Noun as part of its long-term alignment package, but it was unsponsored when checked; that is a possible structure, not evidence that Nouns will accept it. [Secret-ballot candidate](https://www.nouns.camp/candidates/0xd714dd60e22bbb1cbafd0e40de5cfa7bbdd3f3c8-secret-ballot-voting-%26-sealed-bid-auctions-for-nouns-dao)

## Current funding route

The only current, official, adequately funded route verified in this pass is:

1. publish a Proposal Candidate;
2. obtain enough sponsor votes for proposer plus sponsors to total 3;
3. promote it to a formal proposal;
4. win the onchain vote and dynamic quorum.

Other surfaces should not be represented as current EFS application channels:

- Prop House remains live as general infrastructure, but no accepting Nouns House round was found.
- The later [Flows proposal 794](https://www.nouns.camp/proposals/794) was defeated, and its current site did not provide a reliable open application path.
- Legacy Small Grants instructions appear stale. An experimental [noun.wtf grants contract](https://noun.wtf/grants) was active, but its own UI warned that it was unaudited and its balance was only about 0.0814 ETH when checked; it is not a serious EFS route.
- Nouns' [2026 DUNA update](https://paragraph.com/@nouns/2026-duna-updates) confirms that compliance administration and KYC remain operational.

## Cultural and proposal risks

- A technically useful product does not automatically win. [Proposal 204](https://nouns.wtf/vote/204), a zero-fee NFT exchange with Nouns-specific benefits, was defeated 22 FOR to 213 AGAINST.
- A live 2026 candidate says Nouns culture has moved from raw grants toward mutually beneficial or investment-like arrangements. That is the proposer's interpretation, not official DAO policy, but it is a useful current signal.
- Nouns voters can reject a large ask even when the underlying mission fits. House of Nouns succeeded only after a major budget reduction; ethOS passed narrowly, 143 FOR to 124 AGAINST.
- Generic public-good language will be weak. The proposal must answer what Nouns itself retains, can verify, can use, and can keep if the EFS team or today's frontends disappear.
- Much of the core Nouns artwork and governance record is already onchain. The honest preservation problem is reconstructing a usable history across chain data, fragmented indexes, linked media, documents, project evidence, websites, and APIs—not rescuing onchain facts from disappearance.
- Not every photograph, video, document, or funded-project artifact linked by Nouns is CC0. Preserve CC0 or permissioned bytes; otherwise record source, hash, rights status, and availability without assuming redistribution rights.
- [Nounspace](https://www.nouns.camp/candidates/double-down-on-nounspace---final-attempt-06ae622bf2029db79bdebd38f723f1f33f95f6c5) and Nouns Camp already cover parts of the community and governance-interface problem. The proposed browser must demonstrate portable reconstruction and walk-away verification, not present itself as another social homepage or replacement governance client.
- EFS v2 remains a redesign. The proposal must separate v1 evidence, any grant-specific prototype, and unresolved v2 architecture.
- Prop House is historically relevant, and its [FAQ](https://offchain.prop.house/faq) still describes open funding rounds, but this pass did not verify a currently open Nouns round. Do not call it an active route until a live round is found.
- The user-supplied [2023 video](https://youtu.be/oa79nN4gMPs?is=tWYXfhSCnLEU6nml) is a useful cultural introduction to Nouns, Prop House, and CC0. It is historical context, not current program evidence; captions were unavailable during this review.

## Proposed pilot: Nouns Walk-Away Archive

This is a funding concept, not adopted EFS scope.

### User promise

A person can follow a public link and immediately browse a useful Nouns archive without an account, wallet, or full EFS OS startup. A technically capable user can export the archive and independently verify what was preserved, where the bytes are mirrored, who made each claim, and what is unavailable.

### Candidate contents

- Nouns onchain artwork and identifiers;
- proposals, candidates, versions, votes, and public updates;
- propdates and funded-project evidence where publicly available;
- public media references and CC0 assets, with licensing and provenance recorded;
- explicit mirror and retrieval status rather than unsupported permanence claims.

The pilot should use a representative corpus—perhaps 10-25 important proposals and dependencies—rather than promise a complete historical crawl.

### Candidate deliverables

1. **Importer and manifest:** ingest a bounded, named Nouns corpus into a carrier-independent manifest with hashes, sizes, sources, provenance, and mirror locators.
2. **Anonymous browser:** a fast hyperlinkable file-browser or Nounish desktop that opens the archive before wallet authentication or heavy OS components.
3. **Independent verifier/export:** command-line or static verifier plus a downloadable export that does not require an EFS account or hosted EFS API.
4. **Walk-away demonstration:** document what still works when the project's preferred frontend or API is removed, and report `VERIFIED`, `UNAVAILABLE`, or `INVALID` honestly.
5. **Open-source handoff:** code, documentation, test vectors, maintenance expectations, and a public report suitable for Nouns review.

Possible later work—full EFS OS integration, other Nounish DAOs, broad historical crawling, and ongoing archival operations—must remain outside the pilot unless separately costed and approved.

## Funding posture

- Seek a small, staged pilot rather than funding for all of EFS.
- Do not select an exact amount until current precedent and sponsor expectations are checked. An independent review suggested a 6-8 week pilot around USD 20,000-30,000 in USDC across three milestones; this is a scope estimate, not an observed Nouns rate, and still requires a line-item budget.
- Prefer milestones or a stream over an unconditional lump sum.
- Make Nouns the named user and preservation subject, not merely a sponsor logo.
- Lead with a working five-minute proof: one real Nouns artifact, two retrieval paths, a portable manifest, an independent verification result, and the anonymous browser.
- If sponsors want commercial reciprocity or treasury upside, return to James. Revenue sharing, token allocation, investment terms, or a Noun request are owner decisions, not agent-selected proposal tactics.

## Three concepts to pressure-test

1. **Nouns Walk-Away Archive** — strongest current fit; direct durable benefit and a clear EFS proof.
2. **Nounish EFS OS** — attractive demonstration surface, but weak if it is only visual branding or a theme.
3. **EFS for Nounish DAOs** — potentially larger later market, but too broad for the first ask without one working community deployment.

Working recommendation: combine 1 with a narrow piece of 2. Preserve the archive first; use the Nounish OS/browser to make it delightful and publicly legible.

## Evidence gate before outreach

Do not move this opportunity from `watching` to `drafting` until EFS has:

- a bounded corpus and named preservation failure it solves;
- a working anonymous browser path;
- a portable export and independent verifier;
- an honest v1 / prototype / v2 boundary;
- a line-item budget and recipient/KYC plan;
- current confirmation of the best submission route;
- feedback or sponsorship interest from several relevant Nouns voters or delegates;
- a clear answer to “what does Nouns retain if EFS disappears?”

The five-minute proof should let a reviewer open ethOS Proposal 279 anonymously, inspect its chain-derived record and dependency status, download the pilot archive, run the verifier, and launch the same usable record locally without an EFS-hosted API.

## Suggested next steps

1. Run the dedicated deep dive below to inspect recent votes, active funding routes, likely sponsor interests, and comparable proposal delivery records.
2. If the deep dive remains positive, build the smallest Nouns archive proof before asking for money.
3. Show that proof informally to relevant Nouns participants and revise from objections.
4. Only then ask James to choose among `stop`, `continue research`, `draft candidate`, or `buy a Noun for independent membership reasons`.

The highest-leverage next action is step 1. Nothing in the current evidence makes buying a Noun urgent.

## Dedicated deep-dive prompt

```text
You are conducting a source-grounded funding deep dive for Ethereum File
System (EFS) into Nouns DAO.

Start by running `date`. Read the workspace AGENTS.md, planning/AGENTS.md,
planning/Grants/efs-grant-packet.md, planning/Grants/programs.md,
planning/Grants/proposals.md, and planning/Grants/nouns-dao-funding.md. EFS
v1 is existing evidence; EFS v2 is an active redesign, not a production
implementation. Do not blur them.

Research whether Nouns DAO is a realistic funding source for EFS as of
today. Use current primary sources, onchain reads, and proposal records.
Do not rely on old summaries where current facts can be checked.

Investigate:

1. Nouns' current treasury, governance thresholds, proposal-candidate cost,
   sponsorship process, voting requirements, DUNA/KYC obligations, and
   realistic application routes.
2. Whether Prop House, small grants, Flows, or another route currently
   accepts Nouns-related applications. Distinguish active routes from
   historical programs.
3. Recent 2025-2026 technical, open-source, public-good, archival, Ethereum,
   and governance proposals and candidates. Analyze winners and failures.
4. Deep precedents: ethOS 279, House of Nouns 242, Nouns Agora, Prop House,
   CC0 repositories, Protocol Guild/Ethereum public goods, and failed
   technical proposals with superficial Nouns integrations.
5. Whether owning one Noun measurably improves a builder's funding
   prospects. Separate governance capability, community credibility,
   financial risk, and speculation. Compare buying, delegated votes,
   sponsorship, and requesting a Noun as part of a proposal.
6. Current Nouns culture around grants, investment, revenue sharing,
   sustainability, milestone payments, and demonstrated work. Treat
   individual opinions as opinions, not official policy.
7. Identify 10-15 publicly visible holders or delegates whose voting
   histories suggest interest in open-source infrastructure, Ethereum public
   goods, archives, governance tooling, or operating systems. Explain the
   evidence. Do not contact anyone.

Pressure-test:

A. Nouns Walk-Away Archive — portable, verifiable Nouns history and media.
B. Nounish EFS OS — fast anonymous desktop/file-browser demonstration.
C. EFS for Nounish DAOs — reusable infrastructure for related communities.

Recommend one concept or a bounded combination. It must benefit Nouns
directly; do not place Nouns branding on generic EFS work.

Produce a blunt fund/do-not-fund assessment, confidence and unknowns, best
current route, 6-8 week pilot, justified budget/payment structure,
five-minute proof, success metrics, likely voter objections, sponsor-ready
one-page brief, draft Proposal Candidate, go/no-go checklist for buying a
Noun, and exactly one next action for James.

Clearly separate verified evidence, inference, recommendation, and decisions
only James can make. Cite every time-sensitive claim. Do not submit, contact
anyone, buy anything, or turn research into an EFS architecture commitment.
```

## Independent review record

Three read-only review lanes challenged this note before publication:

- **Governance and funding mechanics:** corrected the stale documented quorum example against live contracts; separated the current candidate route from historical, broken, or experimental funding surfaces.
- **Precedent and pitch fit:** narrowed the pitch to walk-away reconstruction; added onchain-data, rights, Nounspace-collision, proof-before-funding, corpus, and budget cautions.
- **Planning-vault integration:** kept the opportunity `watching`, made this file explicitly non-binding, and kept proposal state in [[proposals]].
