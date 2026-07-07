---
cssclasses:
  - grants-wide-tables
---

# Grant Proposals

Single source of truth for EFS grant proposal status.

Keep rejected and withdrawn proposals. Use `archived` only when a row should stop showing prominently but remain historically available.

## Status table

| Proposal | Program | Status | Priority | Owner | Amount | Deadline | Last checked | Submitted | Decision | Gate / evidence needed | Next action | Links / notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Octant public-goods proposal | Octant | rejected | Historical | @grants | Unknown | Unknown | 2026-07-07 | Unknown | Rejected; highly competitive round | Historical row; submitted text, rejection date, and feedback still missing | Capture any proposal text or feedback if available; use the rejection as calibration, not a dead end | [EFS KarmaHQ](https://www.karmahq.xyz/project/ethereum-file-system/about) |
| ESP Office Hours alignment call | Ethereum Foundation ESP | researching | High | @grants | N/A | Rolling / unknown | 2026-07-07 | Not submitted | N/A | Reviewer-ready Office Hours packet: 1-page context, demo links, and routing questions | Prepare 1-page context and ask for alignment guidance, not funding pitch | [ESP Office Hours](https://esp.ethereum.foundation/applicants/office-hours) |
| Filecoin Open Grant concept | Filecoin Foundation Grants | researching | High | @grants | Up to program guidance | Rolling / unknown | 2026-07-07 | Not submitted | N/A | Mine public Filecoin GitHub proposals; define an IPFS/Filecoin mirror/provenance milestone | Draft Filecoin-specific angle: EFS mirrors/provenance over IPFS/Filecoin CIDs | [Filecoin Grants](https://fil.org/grants) |
| FUTO grant inquiry | FUTO Grants | researching | Medium-high | @grants | Unknown | Rolling / email intake | 2026-07-07 | Not submitted | N/A | Demo-backed inquiry with concrete ask, public repo/profile links, and user-control framing | Draft a short demo-backed email with a concrete funding ask | [FUTO Grants](https://futo.org/grants/) |
| The Graph provenance subgraph concept | The Graph Grants | researching | Medium-high | @grants | Unknown | Rolling / no open RFP found | 2026-07-07 | Not submitted | N/A | Only pursue if EFS will ship a public subgraph/data service that benefits Graph users | Draft only if EFS will ship a public subgraph/data service for EFS path/provenance records | [The Graph Grants](https://thegraph.com/grants/) |
| OTF Internet Freedom concept | Open Technology Fund Internet Freedom Fund | researching | Medium | @grants | USD 10k-900k program range | Rolling | 2026-07-07 | Not submitted | N/A | Concrete civil-society, censorship-resistance, or high-risk public-data use case | Develop only if EFS can name a censorship/surveillance-risk public-data use case | [OTF Internet Freedom Fund](https://www.opentech.fund/funds/internet-freedom-fund/) |
| Ocean Shipyard data-provenance concept | Ocean Shipyard | researching | Medium | @grants | Avg. grant size listed as USD 30k | Rolling / application form live | 2026-07-07 | Not submitted | N/A | Real Ocean data primitive integration and Ocean ecosystem impact | Draft only if EFS will integrate Ocean data primitives | [Ocean Shipyard](https://oceanprotocol.com/build/shipyard) |
| IPFS Implementations next RFP watch | IPFS Implementations / Utility Grants | watching | Medium-high later | @grants | USD 5k-25k in last Utility Grants cycle | No current deadline; last deadline 2026-03-15 | 2026-07-07 | Not submitted | N/A | Next relevant RFP opens; 2-page resolver/provenance/CAR concept stays ready | Keep a 2-page EFS resolver/provenance/CAR tooling concept ready for next relevant RFP | [IPFS Grants](https://ipfsgrants.io/utility-grants/) |
| NLnet / Open Internet Stack watch | NLnet | watching | High later | @grants | Historically EUR 5k-50k style small grants; current fit unknown | Broad calls paused; current deadline 2026-08-01 only for specific funds | 2026-07-07 | Not submitted | N/A | Broad call reopens or exact Open Internet Stack fit appears | Monitor post-summer Open Internet Stack transition; do not force-fit current Taler/Fediversity calls | [NLnet Apply](https://nlnet.nl/propose/) |
| Giveth project profile / verification | Giveth | researching | Medium-high | @grants | Donations / QF dependent | Rolling | 2026-07-07 | Not submitted | N/A | Public profile cleanup, verification readiness, and donor-facing copy | Decide whether EFS should create a Giveth page now or wait until packet cleanup | [Giveth](https://giveth.io/) |
| Gitcoin next relevant infra/public-goods round | Gitcoin Grants | watching | Medium-high | @grants | Round dependent | Watch next round | 2026-07-07 | Not submitted | N/A | Relevant round opens; public profile and donor/community activation plan ready | Watch domains; prepare public profile and donor campaign material | [Gitcoin Grants](https://grants.gitcoin.co/) |
| Base/Superchain retro funding | Base / Optimism | watching | Medium | @grants | Retro/reward dependent | Watch | 2026-07-07 | Not submitted | N/A | Base/Superchain deployment, demo, or usage evidence exists | Wait for Base/Superchain deployment or usage evidence | [Base Get Funded](https://docs.base.org/get-started/get-funded) |

## Status vocabulary

- `watching` - plausible future route, but no active application path yet.
- `researching` - active fit/evidence check underway.
- `drafting` - proposal or profile is being prepared.
- `needs-signoff` - James must approve, send, or choose; mirror to [[For-James]] only for real forks/deadlines.
- `submitted` - submitted and waiting.
- `follow-up` - submitted and requires a reply, update, office-hours call, milestone, or clarification.
- `accepted` - awarded or otherwise approved.
- `reporting` - awarded and now in milestone/update/report obligations.
- `rejected` - declined; keep feedback.
- `withdrawn` - intentionally stopped by EFS.
- `archived` - no longer active or prominent, retained for history.

## Proposal detail notes

### Octant public-goods proposal

- First known EFS grant proposal.
- Rejected, but reported as a highly competitive round.
- Related external profile: [EFS KarmaHQ page](https://www.karmahq.xyz/project/ethereum-file-system/about).
- [ ] Add submitted proposal text or link if available.
- [ ] Add rejection date if available.
- [ ] Add any Octant feedback if available.

### ESP Office Hours alignment call

Use ESP Office Hours to ask for routing and alignment feedback. Do not treat the session as a funding pitch.

Candidate questions:

- Which current or likely future Wishlist/RFP areas could fit Ethereum-native data/path/provenance infrastructure?
- Does ESP see EFS as infrastructure, developer tooling, data availability composition, public-goods research, or something else?
- What evidence would make EFS more fundable: demo usage, third-party integrations, standards work, audits, or ecosystem partnerships?

### Filecoin Open Grant concept

Draft only if EFS is framed as a complement:

- EFS records stable Ethereum-native paths and lens-scoped pointers.
- IPFS/Filecoin provide content-addressed storage and persistence.
- EFS can track mirrors, provenance, retrieval metadata, and verification receipts for content stored through Filecoin/IPFS.
- The proposal should not imply EFS is trying to replace Filecoin as a storage market.

### Second-pass candidates

These are not all first-priority proposals. They are rows because each has either a plausible application path, a live intake surface, or a likely future RFP to watch.

- FUTO is worth a short inquiry because the intake is lightweight and the mission fit is plausible.
- The Graph is worth pursuing only if EFS will publish an open subgraph/data service that benefits Graph users.
- OTF is worth pursuing only with a concrete civil-society, censorship-resistance, or high-risk-public-data use case.
- Ocean Shipyard is worth pursuing only if EFS actually integrates Ocean primitives.
- IPFS Implementations and NLnet are high-fit watchlist items, but neither should be force-fit into currently closed or mismatched calls.
