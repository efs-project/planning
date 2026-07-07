# Grants Research Log

Dated notes for grant-specific research, funder intel, rejected leads, and community signals. Keep broad project decisions in [[Decisions]] only when they outlive a specific grant.

## 2026-07-07 - KarmaHQ anchor and tracker seed

- EFS has a public KarmaHQ project page: [Ethereum File System on Karma](https://www.karmahq.xyz/project/ethereum-file-system/about).
- The page currently frames EFS as a credibly neutral, open-source public good for organizing data on Ethereum and EVM L2s.
- Quick links on the page include EFS website, pitch deck, and demo video.
- Visible cleanup items:
  - no team members listed;
  - total funds raised shows `0`;
  - "Path to Success" is bare and should be sharpened before major grant pushes.
- PM blessed `Grants/` as operational tracking, not a design. PM owns top-level integration; @grants owns files inside this folder.

## 2026-07-07 - Filecoin/IPFS fit clarification

Question: why include Filecoin if there is a storage-layer positioning risk?

Working answer: Filecoin creates a positioning risk only if EFS pitches itself as a storage network. EFS should instead pitch as the Ethereum-native path, provenance, mirror, and verification layer above storage backends.

Relevant facts from live research:

- IPFS CIDs address content; they do not guarantee persistence by themselves. IPFS docs say data must be pinned to prevent garbage collection.
- Filecoin positions itself as an incentive/persistence layer for IPFS.
- IPFS and Filecoin are different networks/protocols. An IPFS CID is not automatically stored on Filecoin unless a Filecoin storage placement/deal/import exists.
- Filecoin Pin is a current bridge: it stores IPFS content on Filecoin and keeps standard IPFS Mainnet tooling in the workflow.
- Filecoin Pin maps an IPFS Root CID to a Filecoin Piece CID through metadata and indexing. The mapping is not magically derivable from one CID alone.

Grant implication: Filecoin belongs in the shortlist only with a complementary thesis: EFS makes IPFS/Filecoin-backed content easier for Ethereum developers and agents to resolve, verify, mirror, and curate.

Sources:

- [IPFS persistence and pinning](https://docs.ipfs.tech/concepts/persistence/)
- [Filecoin content persistence](https://www.filecoin.io/blog/ipfs-filecoin-and-content-persistence)
- [Filecoin Pin](https://github.com/filecoin-project/filecoin-pin/)
- [Filecoin/IPFS CID discussion](https://github.com/filecoin-project/community/discussions/543)

## 2026-07-07 - EF ESP status read

- EF ESP remains the best philosophical fit for EFS.
- ESP now appears targeted through Wishlist/RFP/Open Rounds rather than a generic open grant inbox.
- Last check found no active open grant rounds.
- Office Hours is appropriate for non-financial guidance and alignment, not a funding pitch.

Grant implication: prepare an ESP Office Hours packet before trying to force a proposal.

Sources:

- [ESP Applicants](https://esp.ethereum.foundation/applicants)
- [ESP Office Hours](https://esp.ethereum.foundation/applicants/office-hours)
- [ESP Open Rounds](https://esp.ethereum.foundation/applicants/open-rounds)

## 2026-07-07 - Initial non-exhaustive shortlist

High-confidence first-pass routes:

- EF ESP Office Hours / future Wishlist or RFP.
- Filecoin Foundation Grants.
- Gitcoin rounds if a developer tooling, infrastructure, public-goods, or interoperability domain fits.
- Giveth profile/verification and future QF.
- Octant future round, using the rejected prior proposal as calibration.
- Base/Optimism only after Superchain-specific evidence exists.
- Arbitrum, ENS, Starknet, Scroll, and Polygon only with ecosystem-specific deliverables.

Not a fit or low priority in last pass:

- Protocol Guild: useful model, not a direct EFS target.
- Web3 Foundation Grants: general grants program not accepting new applications in last pass.

Sources:

- [Ethereum grants directory](https://ethereum.org/community/grants/)
- [Gitcoin Grants](https://grants.gitcoin.co/)
- [Filecoin Grants](https://fil.org/grants)
- [Base Get Funded](https://docs.base.org/get-started/get-funded)
- [Arbitrum Grants](https://arbitrum.foundation/grants)
- [Starknet Seed Grants](https://www.starknet.io/grants/seed-grants/)

## 2026-07-07 - Second-pass expansion sweep

Research lanes:

- Ethereum/L2 ecosystem grants.
- Broader open-source and public-goods funders.
- Storage, data, indexing, and provenance ecosystems.
- Grant discovery and application-ops resources.

Key additions:

- Base Builder Grants look more actionable than generic Superchain/Optimism funding once EFS has a Base-specific shipped demo. Base lists fast retroactive Builder Grants, weekly rewards, OP Retro Funding, and founder programs.
- Optimism Grants Season 9 appears open, but the visible priority is DEX TVL/fees and audit/growth support, so core EFS should not force-fit unless a Superchain-specific data/tooling angle appears.
- ENS Public Goods Builder Grants are closed because the Public Goods Working Group is sunsetting. ENS remains strategically interesting only through successor routes or an ENS-first resolver/contenthash/CCIP-Read proposal.
- Linea grants are worth watching: the Linea Association says grants for Linea builders are coming soon, but no open program was found.
- NLnet remains a strong digital-commons fit, but broad open calls are temporarily paused during the Open Internet Stack transition. Current August 1 intake is for specific Taler/Fediversity funds, not generic EFS.
- FUTO is a plausible lightweight inquiry route because its grants page invites engineers/projects to email funding requests.
- OTF Internet Freedom Fund is rolling and potentially meaningful if EFS can name a civil-society/high-risk/public-data use case.
- Internet Society Foundation Common Good Cyber Fund is open through 2026-08-04, but likely needs nonprofit/fiscal-host posture and a cybersecurity service story.
- Sovereign Tech Fund and Sovereign Tech Resilience are strong later-stage leads once EFS has adoption/dependency evidence; current criteria reject prototypes and user-facing file-storage services.
- IPFS Implementations / Utility Grants are a strong conceptual match for EFS content-addressing/provenance tooling, but the Winter 2026 deadline passed on 2026-03-15.
- The Graph and Ocean Shipyard are plausible only with ecosystem-specific integrations that benefit those communities directly.
- Arweave funding is a possible contact route if EFS demonstrates Arweave-as-mirror/permanence support.
- GitHub Secure Open Source Fund and Alpha-Omega/OpenSSF belong on the later-stage security funding list after EFS has real dependency/criticality evidence.

Grant-ops additions:

- DAOstar OpenGrants, Karma Funding Map, useWeb3, and CoinFabrik are useful discovery directories but require official-source verification before adding proposal rows.
- OSO can help prove open-source/onchain impact for retroactive and public-goods funders.
- Open Source Collective, GitHub Sponsors, and Drips are funding rails rather than grant programs.
- Airtable/Grist/Instrumentl are only needed if the markdown proposal table becomes operationally too small.

Community signal:

- Ethereum subreddit and forum search mostly confirmed recurring advice: use EF/ESP, Gitcoin, Giveth, Octant, L2 ecosystem grants, and retroactive public-goods funding, but avoid assuming old posts reflect current deadlines.

Sources:

- [Base Get Funded](https://docs.base.org/get-started/get-funded)
- [Optimism Grants](https://www.opgrants.io/)
- [ENS PG Builder Grants](https://builder.ensgrants.xyz/)
- [Linea Association](https://linea.build/association)
- [NLnet Apply](https://nlnet.nl/propose/)
- [FUTO Grants](https://futo.org/grants/)
- [OTF Internet Freedom Fund](https://www.opentech.fund/funds/internet-freedom-fund/)
- [Common Good Cyber Fund](https://www.isocfoundation.org/grant-programme/common-good-cyber-fund/)
- [Sovereign Tech Fund](https://www.sovereign.tech/programs/fund)
- [Sovereign Tech Resilience](https://www.sovereign.tech/programs/bug-resilience)
- [IPFS Implementations Grants](https://ipfsgrants.io/utility-grants/)
- [The Graph Grants](https://thegraph.com/grants/)
- [Ocean Shipyard](https://oceanprotocol.com/build/shipyard)
- [Arweave Funding](https://arweave.org/funding)
- [GitHub Secure Open Source Fund](https://github.com/open-source/github-secure-open-source-fund)
- [Alpha-Omega grants](https://alpha-omega.dev/grants/how-to-apply/)
- [Open Source Collective](https://opencollective.com/opensource)
- [GitHub Sponsors](https://github.com/open-source/sponsors)
- [Drips](https://www.drips.network/)
- [OSO](https://opensource.observer/)
