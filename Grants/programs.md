# Grant Programs

Initial funder landscape for Ethereum File System. This is not exhaustive; it is the working shortlist and watchlist for grant strategy.

Last broad research pass: 2026-07-07.

## Fit thesis

EFS should not pitch itself as "another storage network." The strongest grant framing is:

> EFS is Ethereum-native public infrastructure for durable paths, provenance, mirrors, and verifiable data references across Ethereum and EVM L2s.

That makes storage systems such as IPFS, Filecoin, Arweave, and future backends complements. EFS should track and verify where content lives, who attested it, which mirrors exist, and which lens/path currently points to it.

## Program landscape

| Program | Status | Fit | Why it matters | Caveats | Next action | Links |
|---|---|---|---|---|---|---|
| Ethereum Foundation ESP | Wishlist/RFP framework active; no active open rounds found in last pass | Very high | Best philosophical fit for open Ethereum infrastructure, builder tools, public goods, and research | Use Office Hours for alignment; do not treat it as a generic grant inbox | Prepare an Office Hours packet around EFS as Ethereum-native verifiable data/path infrastructure | [ESP](https://esp.ethereum.foundation/applicants), [Office Hours](https://esp.ethereum.foundation/applicants/office-hours), [Open Rounds](https://esp.ethereum.foundation/applicants/open-rounds), [RFPs](https://esp.ethereum.foundation/applicants/rfp) |
| Filecoin Foundation Grants | Open Grants appear active; FIL PGF appears recurring/planned | High, if scoped as complementary | Funds developer/data tooling, integrations, protocols, storage, retrieval, and research | Filecoin is a storage network, so proposal must avoid implying EFS competes at the same layer | Draft a Filecoin-specific concept around EFS mirrors/provenance over IPFS/Filecoin CIDs | [Filecoin Grants](https://fil.org/grants), [FIL PGF](https://www.filecoin.io/blog/the-future-of-public-goods-funding-in-filecoin-scaling-the-pl-pgf-vision) |
| IPFS Implementations / Utility Grants | Winter 2026 cycle closed; future RFPs expected | High, when RFP matches | Strong fit for content-addressed tooling, DASL/CID/CAR utilities, resolver/provenance libraries, and domain-specific IPFS workflows | No open deadline in last pass; prior RFPs were narrow and short-cycle | Prepare a 2-page EFS resolver/provenance/CAR tooling concept for the next relevant RFP | [IPFS Grants](https://ipfsgrants.io/utility-grants/) |
| The Graph Grants | Application page live; no open RFPs listed in last pass | Medium-high | EFS could contribute open subgraphs, Substreams, event indexing, data services, and dashboards for provenance/path records | Must clearly benefit The Graph ecosystem, not just use it privately | Draft "EFS open provenance subgraph + public explorer data service" | [The Graph Grants](https://thegraph.com/grants/) |
| Arweave ecosystem funding | Rolling/contact route through ecosystem funders | Medium-high, if Arweave-native | EFS can treat Arweave as a permanent mirror backend and provide verifiable indexes, provenance, and discovery | Arweave funders will expect real Arweave usage; avoid pitching EFS as alternate permanent storage | Build or specify an Arweave mirror/provenance demo before outreach | [Arweave Funding](https://arweave.org/funding) |
| Ocean Shipyard | Application route appears live | Medium | Fit for data-economy provenance, access receipts, Data NFT/datoken workflows, data co-ops, and infrastructure-as-a-service | Must use Ocean technology and show Ocean ecosystem impact | Draft an Ocean-specific concept only if EFS will integrate Ocean data primitives | [Ocean Shipyard](https://oceanprotocol.com/build/shipyard) |
| Gitcoin Grants | Seasonal/domain-based | High for community signal | Ethereum public-goods visibility, QF/retro/direct funding mechanisms, and useful campaign pressure | Depends on active domains and donor mobilization | Prepare project profile and watch next relevant infra/public-goods round | [Gitcoin Program](https://gitcoin.co/program), [Gitcoin Grants](https://grants.gitcoin.co/) |
| Giveth | Year-round project pages; QF rounds recur | High for donation surface | Always-on public-goods fundraising and grant round participation | Verification and donor mobilization matter | Create or prepare EFS project profile if not already present | [Giveth](https://giveth.io/) |
| Octant | Public-goods rounds; prior proposal rejected | High, but competitive | Strong alignment with Ethereum public goods and digital commons | Prior proposal rejected; future attempt needs stronger traction/evidence | Keep prior proposal row; track feedback and next round timing | [Octant](https://octant.build/en/about), [EFS KarmaHQ](https://www.karmahq.xyz/project/ethereum-file-system/about) |
| Karma GAP | Not a fund; accountability layer | High as credibility infrastructure | Onchain milestone/progress trail for grants and public-good reputation | Does not replace grant applications | Keep EFS KarmaHQ page updated; use for proposal evidence | [Karma Project](https://www.karmahq.xyz/project/ethereum-file-system/about), [GAP Docs](https://docs.gap.karmahq.xyz/) |
| Base / Superchain | Builder Grants and weekly rewards appear live; retroactive routes exist | Medium-high after deployment | Good once EFS has Base/Superchain usage, SDK support, or visible builder tooling | Requires Base/Superchain-specific impact; Builder Grants are small and retroactive | Watch and apply after a Base-specific demo or usage story exists | [Base Get Funded](https://docs.base.org/get-started/get-funded) |
| Optimism Retro Funding / Grants | Season 9 appears open but growth/DEX-focused; retro routes recur | Medium-high after impact | Strong public-goods funding precedent for Superchain contributions | Current season may not fit core EFS; retroactive evidence matters | Monitor for dev-tooling/public-goods missions and collect Superchain impact metrics | [Optimism Grants](https://www.opgrants.io/), [Optimism Governance Grants](https://gov.optimism.io/c/grants/87) |
| Arbitrum Grants | Active but fragmented; official pages show mixed/inactive program states | Medium | Possible fit for Arbitrum-native resolver/indexer/SDK work | Needs exact current route and Arbitrum-specific adoption/milestones | Ask Foundation/DAO which route fits infrastructure before spending proposal time | [Arbitrum Grants](https://arbitrum.foundation/grants), [Arbitrum Questbook](https://arbitrum.questbook.app/) |
| ENS ecosystem funding | PG Builder Grants closed; successor routing unclear | Medium | EFS could support ENS contenthash, resolver, CCIP-Read, or `.eth` directory workflows | Fit must be ENS-first; Public Goods Working Group is sunsetting | Track ENS Ecosystem WG/forum and successor grant structure | [ENS Builder Grants](https://builder.ensgrants.xyz/), [ENS Forum](https://discuss.ens.domains/) |
| Starknet Seed Grants | Active seed grants found in last pass | Medium-low unless Starknet-native | Could fund Cairo/Starknet resolver or bridge integration | Requires Starknet ecosystem involvement and MVP/PoC | Keep watchlist only until there is a Starknet-specific build | [Starknet Seed Grants](https://www.starknet.io/grants/seed-grants/) |
| Scroll | Security subsidy found; community grant timing unclear | Low-medium | Useful for audit/security support if EFS deploys on Scroll | Not general development funding | Watch for security/audit subsidy once Scroll deployment is real | [Scroll Grants](https://grants.scroll.io/) |
| Polygon Community Grants | Watchlist; Questbook page live but direct grant deadline appears stale/passed | Low-medium | Could fit if EFS has Polygon/AggLayer deliverables | Do not spend proposal time until a new relevant season opens | Monitor next CGP/PFP cycle and prepare AggLayer/path-provenance angle | [Polygon Questbook](https://polygon.questbook.xyz/) |
| Linea Builder Grants | Coming soon | Medium later | Linea positions itself around Ethereum-aligned builders; potential fit for shared infrastructure, dev tools, and public goods | No open program in last pass | Track grant launch and prepare Linea-specific shared-infra pitch | [Linea Association](https://linea.build/association) |
| ZKsync community/RFP routes | Prior 2025-2026 pilot found; current route unclear | Low-medium | Could fit appchain/Gateway/Prividium data provenance or education work | Not a pure infra grant unless a specific RFP appears | Watch ZK Nation for RFPs and only pursue if EFS has a ZKsync-specific angle | [ZK Nation Forum](https://forum.zknation.io/) |
| NLnet / Open Internet Stack | Broad open calls temporarily paused; only Taler/Fediversity accepted in last pass | High later | Strong historical fit for digital commons, decentralized infrastructure, open standards, open data, and FOSS | Current open funds do not fit EFS unless scoped to Taler/Fediversity; regular open call expected after summer | Monitor the Open Internet Stack transition and consider an office hour | [NLnet Apply](https://nlnet.nl/propose/), [NGI Zero Commons Fund](https://nlnet.nl/commonsfund/) |
| FUTO Grants | Informal/rolling email intake | Medium-high | Mission fit for user-controlled, anti-centralized, open-source infrastructure | Subjective fit; no formal grant portal or guaranteed process found | Send a short demo-backed inquiry with a concrete ask | [FUTO Grants](https://futo.org/grants/) |
| Open Technology Fund Internet Freedom Fund | Rolling | Medium, with right use case | Could fit resilient public data, mirror discovery, and verifiable provenance for censorship/surveillance-risk communities | Must serve internet freedom and human-rights users, not generic Ethereum tooling | Draft a narrow "verifiable public data under censorship pressure" concept | [OTF Internet Freedom Fund](https://www.opentech.fund/funds/internet-freedom-fund/) |
| Internet Society Foundation Common Good Cyber Fund | Open 2026-06-23 to 2026-08-04 | Low-medium | Possible fit for cybersecurity/provenance services for high-risk communities | Nonprofit/org capacity and cyber-service evidence likely required | Pursue only with fiscal/nonprofit rail and a clear high-risk-community use case | [Common Good Cyber Fund](https://www.isocfoundation.org/grant-programme/common-good-cyber-fund/) |
| Sovereign Tech Fund | Rolling application platform; strategic open-source infrastructure funding | Medium-high after adoption | Strong fit if EFS becomes reusable open digital base technology for attestable data/provenance | Minimum work cost exceeds EUR 50k; not for prototypes or user-facing file storage services | Build adoption/dependency evidence before applying | [Sovereign Tech Fund](https://www.sovereign.tech/programs/fund) |
| Sovereign Tech Resilience | Rolling services route | Medium later | Useful for audits, technical debt, test coverage, bug bounty setup, and security hardening | Criticality bar is high; often services rather than direct operating cash | Revisit after stable SDK/contracts and real users | [Sovereign Tech Resilience](https://www.sovereign.tech/programs/bug-resilience) |
| GitHub Secure Open Source Fund | Application route appears available; security education + funding | Medium later | Could support security hardening once EFS is a fast-growing open-source dependency | Wants adoption/traction, governance, and security engagement; 2025 program language may need freshness check before applying | Add to post-launch security list | [GitHub Secure Open Source Fund](https://github.com/open-source/github-secure-open-source-fund) |
| Alpha-Omega / OpenSSF | Grant submission form available | Medium later | Could fund security quality work if EFS becomes critical open-source software | Criticality bar is high and monthly public reporting is expected | Use after EFS can show downstream dependence | [Alpha-Omega How to Apply](https://alpha-omega.dev/grants/how-to-apply/) |
| Protocol Guild | Not an EFS target | Low direct fit | Useful model for dependency/public-goods funding | EFS is not Ethereum L1 core R&D maintainer work | Reference only | [Protocol Guild](https://protocol-guild.readthedocs.io/) |
| Web3 Foundation Grants | No-go in last pass | Low | General grants program discontinued | Not Ethereum-native; no current fit | Ignore unless a new relevant program opens | [W3F Grants repo](https://github.com/w3f/Grants-Program) |

## Priority read

Near-term routes that look most actionable:

- ESP Office Hours, because EFS is philosophically aligned but needs Wishlist/RFP routing.
- Filecoin Open Grants, if scoped as EFS mirrors/provenance over IPFS/Filecoin-backed content.
- FUTO, as a short, demo-backed open-source funding inquiry.
- Giveth/Gitcoin profile prep, because those improve public-goods legibility even before a specific round.
- Base Builder Grants only after a Base-specific shipped demo exists.
- The Graph or Ocean only if EFS commits to those ecosystem-specific integrations.

Medium-term routes that get stronger after traction:

- Sovereign Tech Fund / Resilience.
- GitHub Secure Open Source Fund.
- Alpha-Omega / OpenSSF.
- Optimism/Superchain retro funding.
- FIL PGF / RetroPGF.

## Grant-finding resources

| Resource | Use | Link |
|---|---|---|
| ethereum.org grants directory | Canonical Ethereum grant index and aggregator list | [Ethereum grants](https://ethereum.org/community/grants/) |
| Karma Funding Map | Web3 funding directory | [Karma Funding Map](https://www.karmahq.xyz/funding-map) |
| Gitcoin public-goods directory | Funding mechanisms, apps, case studies, research | [Gitcoin](https://gitcoin.co/) |
| Questbook | Web3 grant discovery/applications | [Questbook](https://questbook.app/) |
| CharmVerse grants | Grant workflow and proposal operations | [CharmVerse Grants](https://charmverse.io/solutions/grants/) |
| OSS.Fund | Open-source sustainability directory | [OSS.Fund](https://www.oss.fund/) |
| OpenGrants | Broader non-Web3 grant search | [OpenGrants](https://opengrants.io/) |
| useWeb3 grants | Secondary Web3 grant directory | [useWeb3 grants](https://www.useweb3.xyz/grants) |
| CoinFabrik Web3 grants | Secondary Web3 grant directory | [CoinFabrik Web3 grants](https://www.coinfabrik.com/web3-grants/) |
| DAOstar OpenGrants | Web3 grants data/API and historical funding research | [DAOstar OpenGrants](https://daostar.org/opengrants) |
| OSO | Open-source/onchain impact analytics for funding evidence | [Open Source Observer](https://opensource.observer/) |
| Open Source Collective | Fiscal hosting, transparent budget, invoicing, and grant/donation rail | [Open Source Collective](https://opencollective.com/opensource) |
| GitHub Sponsors | Baseline open-source sponsorship rail | [GitHub Sponsors](https://github.com/open-source/sponsors) |
| Drips | Ethereum-native repo funding, dependency streams, and RetroPGF tooling | [Drips](https://www.drips.network/) |
| Instrumentl | Paid general grant CRM/search if EFS pursues many non-crypto grants | [Instrumentl](https://www.instrumentl.com/) |
| Airtable / Grist grant trackers | Lightweight proposal tracking templates if markdown table overflows | [Airtable template](https://www.airtable.com/templates/nonprofit-grant-tracker/expwzMEi50HFbV7TN), [Grist template](https://www.getgrist.com/templates/grant-application-tracker-template/) |

## Watch rules

- Prefer current official pages over aggregators.
- Date every meaningful status check in [[research-log]].
- Mark stale or closed programs instead of deleting them.
- Add a row to [[proposals]] only when there is a plausible EFS application path, deadline, or submitted proposal.
