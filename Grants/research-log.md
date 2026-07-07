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
