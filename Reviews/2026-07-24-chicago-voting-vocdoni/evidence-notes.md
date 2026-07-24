# Vocdoni and Chicago voting — evidence and working notes

**Research date:** 2026-07-24

**Status:** done

**Parent report:** [Vocdoni, Ethereum, EFS, and Chicago voting](./README.md)

**Purpose:** preserve the supplied recording, version pins, observed endpoint state, claim ledger, detailed technical notes, legal/political-science sources, alternatives research, and unresolved questions behind the synthesis

#kind/research #status/done #repo/planning #topic/privacy #topic/efsv2 #topic/onchain

## Method and evidence policy

Four independent lanes were used:

1. Vocdoni/Vochain and DAVINCI architecture, code, live-network state, ZK/encryption, and operational maturity;
2. voting alternatives by use case;
3. Illinois/Chicago law, election security, equity, accessibility, and democratic legitimacy;
4. EFS v2 integration and privacy red-team.

The main synthesis then checked contradictions across those lanes. In particular:

- legacy Vochain and DAVINCI are analyzed separately;
- a protocol paper describes intended architecture, while deployed source and live configuration describe current implementation;
- ZK, encryption, nullifiers, consensus, data availability, receipt-freeness, and coercion resistance are separate properties;
- project-reported use and benchmarks are labeled as such;
- current endpoint observations are timestamped and are not generalized into all-time/global totals;
- legal analysis is research, not legal advice.

Evidence priority:

1. Illinois statutes, rules, official reports, election-administration sources, and authoritative federal security guidance;
2. pinned source code, protocol specifications, papers, and direct live endpoints;
3. project-authored documentation and case studies;
4. independent reporting;
5. marketing;
6. the supplied conversation for reputation and historical recollection.

The research snapshot will age. Deployment addresses, endpoint state, release status, audits, law, administrative rules, and security findings must be re-checked before reuse.

## Supplied audio

### Provenance

- Google Drive path supplied by user: `/crypto/EFS/`
- Drive folder `Crypto`: `1ra6HH3Ek5dYE8cw2d57wPH3o_VuS6Q0f`
- Drive folder `EFS`: `1BfUF-2RmTFJz86TFH52TNyH5QLE3HlRp`
- File: [`Vocdoni griff green Jason lee.ogg`](https://drive.google.com/file/d/1KuBttUV-txtcfTqpwKf6OHpacgBOpU1g/view?usp=drivesdk)
- Drive file ID: `1KuBttUV-txtcfTqpwKf6OHpacgBOpU1g`
- MIME type: `audio/ogg`
- Size: 2,243,800 bytes
- Created/modified: 2026-07-24
- Local inspection: Opus, mono, 48 kHz, 108.900 seconds
- SHA-256: `57e1525e58705bfc7e8e31f0e7fdc512be8266abe30d92a0aaf2c0ebdb1923e5`

The user identifies the speaker as Griff Green. The audio was not independently voice-authenticated. The transcript is an automated Whisper transcription with punctuation added by the model; consult the recording for exact wording.

### Timestamp summary

| Time | Topic |
|---|---|
| 00:00–00:12 | Barcelona team; real-world experiments |
| 00:12–00:25 | Giveth House; Catalan independence-movement origin |
| 00:25–00:44 | 2017 referendum violence and ballot seizure |
| 00:45–00:55 | voting application; accessibility and trust |
| 00:55–01:03 | relationship with Aragon |
| 01:03–01:11 | Cosmos/Tendermint history |
| 01:12–01:43 | idealism, blockchain experience, non-crypto organizations |
| 01:44–01:48 | strong endorsement |

### Automated transcript

> Yeah, well I love those guys. They're out of Barcelona and they have actually run real experiments with real people.
>
> So they actually work out of the Giveth House a lot and they were formed basically out of the independence movement in Barcelona to try to...
>
> They had this vote in 2017 where Spain actually came in and beat people and stole the ballots.
>
> People were literally trying to be human shields for their ballots and their vote for independence.
>
> And Spain said it was illegal and they were throwing old ladies down the stairs and shit. It was pretty intense.
>
> So they made this voting app and they've been dedicated to making voting accessible and trustworthy.
>
> And they've done a great job. For a while they were basically the Aragon team as well.
>
> And they have tried Cosmos. They've moved around a lot. They've done all sorts of interesting work over the years.
>
> So hard to find a team that's more idealistically driven with more blockchain experience in the voting space.
>
> Like I don't know. And they're looking at it from a practical standpoint.
>
> Like trying to get real organizations, not crypto orgs, but like real people.
>
> Professional organizations and citizens groups to actually use blockchain tech for voting.
>
> I'm pretty sure they're the best that we have to offer.

### Historical claim ledger

| Audio claim | Finding | Confidence / qualification |
|---|---|---|
| Barcelona-based | Vocdoni describes itself as founded in Barcelona in 2018 | High; [Vocdoni about page](https://vocdoni.io/en/about-us) |
| Inspired by Catalan independence events | Consistent with Vocdoni’s own history | High as an origin narrative; not a security claim |
| Police violence and ballot seizure in 2017 | Independent human-rights reporting documents excessive force at polling places | High; [Human Rights Watch](https://www.hrw.org/news/2017/10/12/spain-police-used-excessive-force-catalonia), [Amnesty International](https://www.amnesty.org/en/latest/news/2017/10/spain-excessive-use-of-force-by-national-police-and-civil-guard-in-catalonia-2/). The referendum was suspended/held unlawful, which belongs in the history too. |
| Worked from Giveth House | Giveth House is a real Barcelona Web3 space operating since 2017 | The specific work-history claim remains oral/unverified; [Giveth House](https://giveth.house/) |
| “Basically the Aragon team” for a period | Aragon says it acquired Dvote Labs, the company behind Vocdoni, in January 2021 and the team became Aragon Labs | High with less colloquial wording; [Aragon retrospective](https://blog.aragon.org/2021-retrospective/) |
| Tried Cosmos | Vochain uses Tendermint/CometBFT | High for the consensus lineage; insufficient evidence that it used the Cosmos SDK or Cosmos Hub |
| Real organizations used it | Vocdoni publishes civic and association case studies; the live network contains many elections | Moderate. Counts are observable, but adoption/impact narratives are mostly vendor-reported. |
| “Best that we have to offer” | Opinion | Not an empirical claim |

Two useful real-world cases:

- Vocdoni reports that Bellpuig held a nonbinding hybrid civic consultation in 2022: 3,458 eligible residents, 1,095 participants, mailed QR credentials, and staffed in-person support. The project account importantly says the mayor could not call the process a legally binding referendum. [Vocdoni Bellpuig case study](https://blog.vocdoni.io/referendum-bellpuig/)
- Vocdoni reports 6,723 votes and seven observers in the 2024 New Belarus Coordination Council election. [Vocdoni New Belarus case study](https://blog.vocdoni.io/new-belarus-vocdoni/)

These are evidence of operational ambition and use, not independent certification of privacy, turnout, or result correctness.

## Reproducibility pins

### Legacy Vocdoni/Vochain

- Reviewed repository: [`vocdoni-node`](https://github.com/vocdoni/vocdoni-node)
- Current repository head inspected: `0fadb29d9e3f3831a8312b445c3d6d7bb41e45dc` (2026-07-14)
- Pinned current README: [`README.md`](https://github.com/vocdoni/vocdoni-node/blob/0fadb29d9e3f3831a8312b445c3d6d7bb41e45dc/README.md)
- Relevant code: [`vochain/genesis/genesis.go`](https://github.com/vocdoni/vocdoni-node/blob/0fadb29d9e3f3831a8312b445c3d6d7bb41e45dc/vochain/genesis/genesis.go), [`vochain/keykeeper/keykeeper.go`](https://github.com/vocdoni/vocdoni-node/blob/0fadb29d9e3f3831a8312b445c3d6d7bb41e45dc/vochain/keykeeper/keykeeper.go), [`crypto/ethereum/vocdoni_sik.go`](https://github.com/vocdoni/vocdoni-node/blob/0fadb29d9e3f3831a8312b445c3d6d7bb41e45dc/crypto/ethereum/vocdoni_sik.go), [`crypto/zk/circuit/config.go`](https://github.com/vocdoni/vocdoni-node/blob/0fadb29d9e3f3831a8312b445c3d6d7bb41e45dc/crypto/zk/circuit/config.go)
- SDK pins observed: `vocdoni-sdk` `1287eea2…`, release `v0.9.1` marked beta/prerelease; `integrator-sdk` `556de894…`

### DAVINCI

- Paper: [`davinci-paper`](https://github.com/vocdoni/davinci-paper/tree/467dc62f0e82426fd6ca6a294d6673edba7762f1), commit `467dc62f0e82426fd6ca6a294d6673edba7762f1`
- Protocol specification: [`spec.davinci.vote`](https://spec.davinci.vote/)
- Contracts: [`davinci-contracts`](https://github.com/vocdoni/davinci-contracts/tree/719d9a8d2d92af5abb589ed6edab763629692071), commit `719d9a8d2d92af5abb589ed6edab763629692071`, observed tag `v0.0.49`
- Node: [`davinci-node`](https://github.com/vocdoni/davinci-node/tree/b1055b6b57463f135c283363de98c7a355206f4b), commit `b1055b6b57463f135c283363de98c7a355206f4b`, observed stable tag `v0.0.7`
- Circom circuits: [`davinci-circom`](https://github.com/vocdoni/davinci-circom/tree/a39a9f9867bb70726ad2137ed536d75670e042b9), commit `a39a9f9867bb70726ad2137ed536d75670e042b9`
- Circuit artifacts: [`davinci-circuit-artifacts`](https://github.com/vocdoni/davinci-circuit-artifacts/tree/131beb669eb939d3329eb3aa2f0a2cf2a9133d88), commit `131beb669eb939d3329eb3aa2f0a2cf2a9133d88`
- Alternate zkVM prototype: `davinci-zkvm` `ec0cd661…`; no release tag observed
- DKG research: [`davinci-dkg`](https://github.com/vocdoni/davinci-dkg), [IACR ePrint 2026/552](https://eprint.iacr.org/2026/552)
- Process ID binding: [`ProcessIdLib.sol`](https://github.com/vocdoni/davinci-contracts/blob/719d9a8d2d92af5abb589ed6edab763629692071/src/libraries/ProcessIdLib.sol)
- Registry and conditional blob enforcement: [`ProcessRegistry.sol`](https://github.com/vocdoni/davinci-contracts/blob/719d9a8d2d92af5abb589ed6edab763629692071/src/ProcessRegistry.sol)
- Deployment-address definitions: [`golang-types/addresses.go`](https://github.com/vocdoni/davinci-contracts/blob/719d9a8d2d92af5abb589ed6edab763629692071/golang-types/addresses.go)
- Current single-key storage: [`storage/keys.go`](https://github.com/vocdoni/davinci-node/blob/b1055b6b57463f135c283363de98c7a355206f4b/storage/keys.go#L35-L100)
- Current single-key finalization: [`sequencer/finalizer.go`](https://github.com/vocdoni/davinci-node/blob/b1055b6b57463f135c283363de98c7a355206f4b/sequencer/finalizer.go#L352-L374)

Pins describe the reviewed state, not endorsed releases.

## Live observations

### Vochain

Observed from the [Vochain live chain-info endpoint](https://api.vocdoni.io/v2/chain/info) at approximately 2026-07-24 22:54 UTC:

| Field | Value |
|---|---:|
| Chain ID | `vocdoni/LTS/1.2` |
| Genesis | 2024-04-24 |
| Height | approximately 8,079,005 |
| Block-store base | approximately 7,517,000 |
| Elections | 2,573 |
| Organizations | 266 |
| Votes | 134,436 |
| Validators | 11 |
| Maximum census size | 1,000,000 |

The block-store base indicates the exposed gateway did not retain all historical blocks. The API-reported `networkCapacity=5000` appears to be a votes-per-block configuration/pricing expectation, not a measured, adversarially validated throughput figure.

The live validator endpoint returned 11 equal-power entries: `vocdoni-validator0` through `vocdoni-validator8`, `cryptonita`, and `lucas`. Labels do not prove distinct beneficial ownership or independent operations. The inspected genesis configuration had nine vendor-labelled validators and four keykeeper indexes.

With 11 equal-power validators, ordinary CometBFT safety/liveness assumptions tolerate fewer than one-third Byzantine voting power; four equal validators cross that threshold. That statement describes the consensus assumption, not evidence that four are malicious or jointly controlled.

The largest election observed in the live dataset had 60,686 votes over roughly 72 hours, approximately 0.23 votes/second on average. This is evidence of nontrivial use but not a peak-load test. A sample of the 100 most recent elections had `anonymous=false` for every sampled election. Many were encrypted CSP elections. The sample should not be generalized to all history, but live use should not be described as universally ZK-anonymous.

### DAVINCI

Observed from the public sequencer service at approximately 2026-07-24 22:55 UTC:

- [`sequencer5 /info`](https://sequencer5.davinci.vote/info) advertised Sepolia, Arbitrum, Arbitrum Sepolia, and Celo; artifact URLs used a `/dev/` path; one sequencer address was exposed.
- [`sequencer5 /processes`](https://sequencer5.davinci.vote/processes) returned 175 locally observed processes.
- [`sequencer5 /sequencer/stats`](https://sequencer5.davinci.vote/sequencer/stats) reported 71 verified votes, 124 aggregated votes, 77 transitions, 31 settled transitions, zero active processes, and last activity on 2026-06-17.
- [`sequencer5 /sequencer/workers`](https://sequencer5.davinci.vote/sequencer/workers) returned no connected workers.
- [`sequencer2 /sequencer/stats`](https://sequencer2.davinci.vote/sequencer/stats) showed single-digit vote activity and last activity on 2026-05-08.

These are per-service observations, not global DAVINCI totals.

Direct chain checks associated with the pinned address configuration found deployed prototype contracts and approximately:

| Network | Observed processes | `blobsDA` behavior |
|---|---:|---|
| Sepolia | 232 | enabled |
| Arbitrum | 1 | disabled |
| Base | 0 | disabled |
| Celo | 12 | disabled |

Ethereum-mainnet addresses in the reviewed configuration were zero/dummy. No mainnet launch announcement was found. A 2025 roadmap projected a July 2026 mainnet/TGE milestone but warned dates could change; current code and deployment evidence should outrank that projection. [Vocdoni DAVINCI roadmap post](https://blog.vocdoni.io/davinci-universal-voting-protocol/)

## Legacy Vochain technical notes

### Election lifecycle

1. Organizer defines the process, election rules, ballot metadata URI, start/end, capacity, census root, and envelope mode.
2. Eligibility may be proven from off-chain Merkle censuses, a CSP/certificate authority, Ethereum ERC-20 or MiniMe state proofs, or supported external credentials.
3. For encrypted elections, keykeepers publish public keys.
4. Client encodes a vote package, optionally applies each available keykeeper’s encryption layer, attaches its eligibility proof, and submits through a gateway.
5. Permissioned validators execute timing, eligibility, nullifier/overwrite, capacity, and transaction checks under CometBFT.
6. At close, keykeepers reveal complete private keys.
7. Nodes decrypt individual vote packages and deterministically tally.

Legacy encrypted voting is not threshold homomorphic tallying. Every selected layer must be opened; a missing required key can delay or prevent a result. Once keys are public, individual ciphertexts can be decrypted. Long-term secrecy therefore depends on anonymity and metadata separation, not encryption alone.

### Identity and CSP privacy

In the stable integrator flow, a person authenticates to Vocdoni’s service/CSP, the client creates an election-specific secp256k1 signer, and the CSP signs that address for the election. This prevents the voter’s ordinary wallet address from appearing directly on Vochain, but the CSP receives the authenticated person/member token and the election-specific address. The service can link them if it logs or retains that relationship.

This is pseudonymity from public observers, not anonymity against the credential issuer. A civic implementation would need enforceable logging, deletion, separation-of-duties, and audit controls in addition to cryptography.

### Anonymous ZK path

The anonymous path is Groth16/Circom. The public inputs and surrounding code bind:

- election/process identifier;
- census root;
- secret-identity-key root;
- deterministic election nullifier;
- voting weight;
- intended vote-package hash.

The proof hides the ordinary census leaf/address. It does not decide whether the leaf represents a legally eligible, unique Chicago voter.

### Legacy trust table

| Actor/component | Required trust or failure |
|---|---|
| Organizer | Fair election definition, lifecycle changes, capacity, and metadata |
| Census authority/CSP | Correct inclusion, exclusion, uniqueness, and weights; privacy of identity-to-credential relation |
| Validators | CometBFT safety/liveness, transaction ordering, censorship resistance, protocol upgrades |
| Keykeepers | Key secrecy until close and eventual availability of every required key |
| Gateway | Availability and network-metadata handling; alternate gateway may route around one failure |
| Client/device | Correct displayed choice, package construction, encryption, and proof generation |
| Voter environment | Privacy from coercers, buyers, employers, and household observers |
| Historical archive | Continued access to process data and blocks despite gateway pruning |

## DAVINCI technical notes

### Intended lifecycle

1. Organizer creates a census and external metadata.
2. Census root and process configuration are committed to an EVM `ProcessRegistry`.
3. Intended wardens run threshold DKG for a BabyJubJub ElGamal public key.
4. Voter obtains a census path, encrypts ballot fields with fresh randomness, constructs a Groth16 validity proof, signs a vote identifier with secp256k1, and submits to a sequencer.
5. Sequencer verifies authentication and membership, applies last-vote-wins/overwrite rules, rerandomizes ciphertext, updates a sparse state tree and homomorphic encrypted accumulator, recursively aggregates proofs, publishes batch data where configured, and submits a compact state-transition proof.
6. Sufficient wardens partially decrypt only the aggregate.
7. A result circuit proves the plaintext aggregate corresponds to the encrypted result; the valid result proof is settled publicly.

The paper describes layers over BN254, BLS12-377, and BW6-761 for voter proofs, recursion, and final settlement. The precise curve/circuit set must be pinned per deployment rather than inferred from the paper indefinitely.

### Intended versus implemented privacy

| Property | Intended DAVINCI | Reviewed canonical node |
|---|---|---|
| Election key | Threshold key from DKG | Complete private ElGamal key generated and stored by the node |
| Decryption | Wardens partially decrypt aggregate | Finalizer uses the complete private key |
| Individual ballot exposure | No party below threshold should decrypt | Key-holding service can decrypt ciphertexts if compromised or malicious |
| Rerandomization | New submissions plus additional old-state rerandomization described as receipt-freeness support | Submitted ballots rerandomized; no periodic random old-leaf rerandomization found |
| Sequencers | Multiple/proof-gated design | Public endpoint showed one sequencer address and no workers |
| Data availability | EIP-4844 batches plus future long-term plan | Blob enforcement is deployment-specific; long-term plan open |

The separate DKG repository and paper are valuable progress but cannot be attributed as a deployed security property until integrated, tested, independently reviewed, and used by the canonical node.

### Proof and security-property map

| Mechanism | Positive guarantee under assumptions | Residual problem |
|---|---|---|
| Voter Groth16 proof | Encrypted ballot satisfies circuit rules; authentication/membership inputs are consistent | Malicious client can encode the wrong valid choice; issuer can build a biased census |
| Recursive aggregation | Batch computation is compressed without trusting the worker’s arithmetic | Sequencer can omit or delay an otherwise valid vote |
| State-transition proof | Contract accepts only a valid transition under the pinned verifier | Contract/verifier/setup bugs; mutable governance; chain/L2 failure |
| Threshold ElGamal, when integrated | Fewer than threshold wardens cannot decrypt; aggregate can be tallied without individual plaintext | Current node is single-key; threshold members may collude or fail to appear |
| Rerandomization/revote | Makes a previously shown ciphertext less useful as a receipt | Sequencer may retain linkage; coercer can observe device, demand a late vote, or prevent safe revote |
| EIP-4844 blob | Makes the accepted batch public for a limited interval where enforced | Pruning; disabled enforcement on some deployments; no forced inclusion |
| EVM settlement | Public final state/proof under the settlement domain’s rules | L2 sequencer, DA, bridge, finality, upgrade, congestion, and censorship trust |

### Cast-as-intended gap

The current casting flow proves that an encrypted ballot is valid under the circuit. It does not let the voter independently challenge or verify that the ciphertext represents the selection displayed by the same device.

This is the classic distinction:

- cast as intended;
- recorded as cast;
- tallied as recorded.

The paper source contains a commented comparison acknowledging the absence of protocol-level cast-as-intended verification. [`introduction.tex`](https://github.com/vocdoni/davinci-paper/blob/467dc62f0e82426fd6ca6a294d6673edba7762f1/v2/sections/introduction.tex)

An independent verifier that checks only inclusion and tally does not repair a malicious casting device. A serious civic pilot needs a challenge/audit ceremony or a second independently trusted path that does not merely re-read the first client’s assertion.

### Trusted setup

Groth16 requires:

1. a common Powers of Tau contribution; and
2. circuit-specific phase two.

The reviewed `davinci-circom` preparation script invokes `snarkjs groth16 setup` after obtaining the Powers of Tau material. The reviewed Go artifact generator invokes `groth16.Setup`. The node defaults to a `dev` artifact release, and the live endpoint exposed `/dev/` artifact URLs.

No production multiparty phase-two ceremony transcript was found. The defensible statement is:

> No public evidence was found that the reviewed deployed verifier keys came from a completed multiparty circuit-specific ceremony; repository tooling includes a single-process setup path.

Do not claim retained toxic waste without evidence. Do require ceremony provenance before consequential use.

### Data availability and retention paradox

The paper’s approximate design point is one 128 KiB EIP-4844 blob per 60-vote batch. Ethereum blob data is pruned after a limited interval; the paper uses approximately 18 days and identifies long-term DA as open. [`background.tex`](https://github.com/vocdoni/davinci-paper/blob/467dc62f0e82426fd6ca6a294d6673edba7762f1/v2/sections/background.tex), [`analysis.tex`](https://github.com/vocdoni/davinci-paper/blob/467dc62f0e82426fd6ca6a294d6673edba7762f1/v2/sections/analysis.tex)

For independent reconstruction, an archive needs:

- exact process ID and settlement domain;
- batch number/order;
- previous and new state roots;
- original blob bytes;
- versioned blob hash and KZG commitment/opening;
- settlement transaction, block, and finality basis;
- circuit and verifying-key identifiers;
- sequencer signature/identity where applicable.

A later mirror cannot:

- force a sequencer to include an omitted ballot;
- repair data withheld at the moment a transition was accepted;
- make `blobsDA=false` equivalent to contract-enforced blob publication;
- remove L2 DA, bridge, sequencer, upgrade, or finality assumptions.

Permanent ballot-bearing blobs also preserve voter addresses/positions, timing/order, and ciphertext. Future key compromise, warden collusion, implementation failure, or cryptanalytic advances could reveal choices. The privacy-preserving default is a permanent signed manifest/commitment/result bundle plus a retention-limited, legally governed ballot-data archive—not automatic permanent EFS replication.

### Performance claims

DAVINCI’s paper reports, without independent validation:

- about 10 seconds for a browser voter proof;
- 60 votes per batch/blob;
- a GPU batch proof in under three minutes;
- around 200 settled votes per minute with two sequencers and ten workers each;
- around 480,000 gas for a transition.

Two hundred votes per minute is roughly 3.3 votes/second. A Chicago-scale test must model deadline bursts, older/mobile devices, retries, proof failures, endpoint rate limits, L2 congestion, state races, outages, worker loss, and fee spikes. Average total electorate divided by a multi-day window is not a useful capacity proof.

The alternate zkVM prototype’s reported 1.5–2.4 votes/second on an RTX 5090 and large VRAM/proving-key footprint describe an experimental alternative, not the canonical deployed stack.

### DAVINCI governance and trust

The organizer can create the election, set or update dynamic census behavior, pause/cancel/end/extend, and increase capacity under contract rules. ZK prevents an invalid transition under the circuit; it does not make organizer authority democratically legitimate.

The contract’s transition function may be proof-gated rather than allowlisted, but operational permissionlessness also requires:

- public transaction intake;
- multiple independent sequencers;
- access to proving workers and exact artifacts;
- no privileged unpublished state;
- a tested method to resolve races;
- a forced-inclusion or escape path;
- durable DA.

Those were not demonstrated by the current public endpoint.

## Chicago legal and institutional notes

### Official sources

| Topic | Source | Relevance |
|---|---|---|
| Voting rights and election administration | [Illinois Constitution, Article III](https://www.ilga.gov/commission/lrb/con3.htm) | Constitutional baseline |
| Paper record, voter verification, accessibility | [10 ILCS 5/24C-11](https://www.ilga.gov/Documents/legislation/ilcs/documents/001000050K24C-11.htm) | Permanent paper/equipment requirements |
| Certification/testing | [10 ILCS 5/24C-16](https://www.ilga.gov/legislation/ilcs/fulltext?DocName=001000050K24C-16) | Approval and testing |
| Paper as recount basis | [10 ILCS 5/24C-2](https://www.ilga.gov/Documents/legislation/ilcs/documents/001000050K24C-2.htm) | Recount evidence |
| Post-election check | [10 ILCS 5/24C-15](https://www.ilga.gov/legislation/ilcs/fulltext?DocName=001000050K24C-15) | 5% check |
| State administrative rules | [26 Ill. Adm. Code Part 204](https://www.ilga.gov/agencies/JCAR/EntirePart?titlepart=02600204) | Voting-system administration |
| State election security | [Illinois State Board of Elections, Safeguarding Your Vote](https://www.elections.il.gov/VotingAndRegistrationSystems/ElectionSecurity/SafeguardingYourVote.aspx) | Current public security posture |
| Remote ballot return study | [Illinois Remote Vote by Mail Task Force final report](https://www.ilga.gov/Documents/Reports/ReportsSubmitted/6317RSGAEmail13939RSGAAttachSRVBM%20Final%20Report-Approved%20August%2020-25.pdf) | Significant risk; no viable implementation identified |
| Advisory referenda | [Chicago Board of Elections 2026 advisory-referenda guidelines](https://cboeprod.blob.core.usgovcloudapi.net/prod/2025-09/2026%20Advisory%20Referenda%20Guidelines.pdf) | Advisory legal effect does not create an alternate voting channel |
| Federal remote-return risk | [CISA joint guidance](https://www.cisa.gov/sites/default/files/2024-02/Final_%20Risk_Management_for_Electronic-Ballot_05082020_508c.pdf) | Electronic marked-ballot return is high risk |
| Internet/blockchain voting | [National Academies, chapter 5](https://www.nationalacademies.org/read/25120/chapter/7) | Blockchain does not repair endpoints, secrecy, coercion, DoS, or Internet return |
| E2E protocol evaluation | [U.S. EAC](https://www.eac.gov/voting-equipment/end-end-e2e-protocol-evaluation-process) | Cast-as-intended, recorded-as-cast, tallied-as-recorded |
| Current expert perspectives | [NIST 2026 study](https://www.nist.gov/publications/us-election-expert-perspectives-end-end-verifiable-voting-systems) | Contemporary E2E implementation considerations |

The Illinois remote-return finding targets remote electronic return. It should not be stretched into opposition to supervised, paper-backed E2E verification, publication of public audit evidence, or synthetic research.

### Use-case classification

| Proposed process | Legal/institutional classification for research | Recommendation |
|---|---|---|
| Binding candidate election or referendum | Statutory public election | No remote chain return |
| Advisory question on official ballot | Official election administration despite nonbinding effect | No alternate chain replacement |
| Ward participatory budgeting | Civic allocation/consultation outside the Election Code when correctly structured | Best real-world research target |
| Citywide resident poll | Potentially sensitive civic process; authority, records, procurement, accessibility, and communications need review | Possible only with explicit non-election framing and approval |
| Private organization | Bylaws, contracts, membership rights, sector law | Appropriate risk-scaled proving ground |
| DAO/EFS governance | Private cryptoeconomic institution | Use DAO-specific tools unless one-person/member privacy is genuinely required |

### Threat and remedy table

| Failure | Why a blockchain proof does not solve it | Required institutional control |
|---|---|---|
| Legitimate voter omitted/mis-weighted | Root faithfully commits the bad list | Notice, correction window, issuer separation, human appeal |
| Malware changes choice | Proof validates a different but valid ciphertext | Cast/challenge or independent cast-as-intended path; supervised/paper ground truth |
| Coercer watches voter | Valid ballot can still be coerced | Private booth/channel, safe revote opportunity, conventional fallback; remote protocol cannot guarantee |
| Credential stolen/sold | Nullifier tracks credential use, not rightful human control | Identity recovery, revocation/reissue, dispute procedure |
| Sequencer censors | Proof blocks forgery, not omission | Multiple independent intake paths, forced inclusion/fallback, deadline procedure |
| Chain/L2 outage or reorg | Settlement inherits domain failure | Finality rule, contingency extension/cancellation, non-chain authority |
| Public data disappears | State root is insufficient for full replay | Independent monitored archive bound to settlement |
| Permanent ciphertext later breaks | Past publication cannot be recalled | Data minimization and retention limit |
| Accessibility failure | Cryptographic validity says nothing about usable completion | WCAG/manual assistive-technology tests, staffed channels, paper/phone/in-person alternatives |
| Result challenged in court | Smart-contract finality is not legal finality | Paper or cognizable evidence, chain of custody, canvass, recount/remedy authority |
| Misinformation delegitimizes outcome | Hashes are not public communication | Prebunking, observer education, public exercises, transparent incident response |

### Equity and accessibility

The current [U.S. Census QuickFacts Chicago table](https://www.census.gov/quickfacts/fact/table/chicagocityillinois/COM100223) reports approximately:

- 94.9% of households with a computer;
- 89.1% with broadband;
- 35.4% of people age five and older speaking a language other than English at home;
- 8.4% disability among people under 65.

These aggregates do not identify the population eligible for a particular election and do not establish private/safe device access. A pilot should measure:

- completion and abandonment by device/browser class;
- proof-generation time and failures;
- screen-reader and keyboard-only completion;
- language comprehension, not only translation presence;
- help requests and whether support compromises secrecy;
- access to a safe private place;
- whether alternative channels are substantively equal;
- error/appeal resolution by group without publishing sensitive demographics.

## Alternatives research notes

### Security-property glossary

- **Ballot secrecy:** identity cannot be linked to choice under stated assumptions.
- **Hidden until close:** choices are unavailable before the deadline but may become public afterward.
- **End-to-end verifiability:** voters can check cast-as-intended and recorded-as-cast; observers can check tallied-as-recorded.
- **Receipt-freeness:** voter cannot produce convincing evidence of the final choice to a buyer.
- **Coercion resistance:** also addresses observation, forced abstention, credential surrender, and forced/blocked revoting.
- **Anonymous eligibility:** proves membership without revealing a leaf; does not encrypt or tally.
- **Universal verifiability:** outside observers can verify the tally/proofs.
- **Software independence:** an undetected software change cannot cause an undetectable result change; paper often supplies this evidence.

### Candidate detail

#### ElectionGuard

- Official site: [ElectionGuard](https://electionguard.vote/)
- Role: SDK/protocol components, not a complete certified voting product.
- Cryptography: threshold ElGamal and conventional ZK proofs; confirmation codes, cast-or-challenge, tally/decryption verification.
- Eligibility and accessibility remain the integrating election system’s responsibility.
- The strongest use is supervised voting with human-readable paper and post-election audit.
- Real municipal uses are valuable engineering evidence but not proof that an arbitrary integration is certified or reusable. The [College Park 2023 record](https://electionguard.vote/elections/College_Park_Maryland_2023/) documents election-specific limitations.

#### Swiss Post e-voting

- Official program: [Swiss Federal Chancellery](https://www.bk.admin.ch/en/e-voting)
- Best current institutional benchmark for authorized binding remote voting.
- Combines voter materials/return codes, distributed cryptographic controls, complete-verifiability requirements, examination, and state operations.
- It does not make remote coercion or compromised personal devices disappear.
- Jurisdiction-specific, very high institutional cost, and disclosed source is not a productively reusable Chicago component.

#### Belenios

- [How it works](https://www.belenios.org/howitworks.html)
- [Implementation caveats](https://www.belenios.org/caveats.pdf)
- Credential plus separate authentication; independent credential authority and threshold trustees can be configured.
- Homomorphic ElGamal for simple contests; verifiable mixing for some ranked/graded ballots.
- Public inclusion/tally verification.
- Its own caveats acknowledge absence of cast-as-intended verification and meaningful coercion resistance, plus bulletin-board/revoting limitations.
- Strong candidate for capable, self-hosting associations; not a Chicago statutory election.

#### Helios

- [Helios FAQ](https://vote.heliosvoting.org/faq)
- Long-lived open system with browser encryption, trustees, trackers, and challenge ballots.
- No meaningful remote coercion resistance.
- Its own guidance says not to use it for high-stakes public-office elections because home devices are insufficiently secure.

#### Decidim

- [General architecture/features](https://docs.decidim.org/en/develop/features/general-description.html)
- [Elections component](https://docs.decidim.org/en/develop/develop/elections.html)
- Strong civic proposal, deliberation, participatory-budgeting, and accountability workflows.
- Extensible identity/authorization mechanisms and multilingual focus.
- Do not infer cryptographic E2E tallying from broad “cryptographic guarantees” language without an exact deployed protocol.
- Best Chicago civic-process shell; connect a separate ballot backend only when the process needs one.

#### CONSUL Democracy

- [Repository](https://github.com/consuldemocracy/consuldemocracy)
- Municipal proposals, consultations, legislation, polls, and participatory budgeting.
- Conventional application/registry trust, not a cryptographic E2E ballot system.
- Credible second choice when its workflow and operational footprint fit better than Decidim.

#### MACI v3

- [MACI introduction and trust model](https://maci.pse.dev/docs/introduction)
- [v3.0.0 release](https://github.com/privacy-ethereum/maci/releases/tag/v3.0.0)
- EVM-oriented encrypted commands with ZK tally and revoting/key changes to resist collusion/receipts against outsiders.
- Coordinator can decrypt ballots and can fail liveness by not completing the tally.
- Eligibility is delegated to a gatekeeper; one-person-one-vote and civil identity remain external.
- Best Ethereum-native comparison for private grants/DAO voting, not an official-election shortcut.

#### Semaphore v4

- [Semaphore docs](https://docs.semaphore.pse.dev/)
- Merkle group membership plus Groth16 proof and scope/nullifier.
- Useful for election-specific anonymous eligibility.
- Group administrator, credential uniqueness/recovery, and issuance remain trusted.
- Supplies no encrypted ballot, tally, election lifecycle, cast-as-intended, receipt-freeness, or coercion resistance.

#### Snapshot, Aragon, and OpenZeppelin Governor

- [Snapshot docs](https://docs.snapshot.box/)
- [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/5.x/governance)
- Snapshot is mature for wallet/token/strategy-based DAO signaling. Public signed votes are auditable and highly receiptable; shielded mode hides choices only until close.
- Standard Governor is strong transparent on-chain execution with public token-weighted voting and timelocks.
- Aragon OSx is useful modular DAO authority; private voting through experimental MACI integration inherits MACI assumptions.
- These are good EFS/DAO governance candidates but poor one-resident-one-vote civil systems.

#### Managed association vendors

- [Simply Voting security/reliability](https://www.simplyvoting.com/security-reliability/)
- [Simply Voting results/receipts](https://help.simplyvoting.com/docs/checking-interpreting-and-publishing-results)
- [ElectionBuddy pricing](https://electionbuddy.com/pricing/)
- Simply Voting has comparatively strong vendor-published accessibility and mixed-channel evidence.
- ElectionBuddy emphasizes inexpensive communications and logistics.
- Vendor audit logs, downloads, and receipts are not equivalent to independently verifiable cryptographic election records. Raw receipt-linked exports should not be archived on EFS.

### Recommendation by institution

| Institution | Default candidate |
|---|---|
| Binding public election research | ElectionGuard + voter-verifiable paper + risk-limiting audit |
| Participatory budgeting/civic process | Decidim; CONSUL second |
| Cryptographically verifiable association | Belenios |
| Managed accessible association | Simply Voting, subject to procurement validation |
| Ethereum anti-collusion experiment | MACI |
| Anonymous membership component | Semaphore |
| Transparent DAO signaling | Snapshot |
| Transparent executable DAO governance | OpenZeppelin Governor / mature DAO tooling |
| Remote binding benchmark | Swiss Post research, not direct reuse |

## EFS v2 integration notes

### Current design constraints

Relevant current EFS design:

- [[privacy-pass-synthesis]]: EFS can be confidential and honestly bounded, but not anonymous; graph/timing metadata remain structural. PC-9 keeps ZK in conventions and sibling verifiers, not kernel admission.
- [[privacy-freeze-reservations]]: rejects kernel accommodation for voting-style ZK and threshold-committee decryption.
- [[onchain-completeness]]: favors a long-lived, reconstructable archive and warns against relying on prunable logs/off-chain indexers for core meaning.
- [[playable-archive-requirements]]: application packages should use generic data/manifest/byte primitives rather than adding app-specific permanent surface.
- [[human-overview]]: a view is not a capability, private does not mean invisible, and content authority is distinct from transport authority.
- [[assumptions-and-requirements]]: copied evidence can be portable while live authority remains domain- and basis-bound.
- [[packages-and-updates]]: one closure manifest must pin executable/data dependencies.
- [[network-privacy]]: endpoint integrity, identity privacy, and interest privacy must not be conflated.
- [[locale-and-accessibility]]: WCAG 2.2 AA and manual assistive-technology verification are baseline client requirements.
- [[threat-model]]: a compromised host/browser remains a residual threat.

EFS v2 is still under constitutional reconciliation. These notes are an integration boundary for research, not permission to deploy permanent election bytes.

### Architecture ruling

Allowed:

- application/SDK adapter;
- frozen election package;
- explicit exact-host network capabilities;
- narrow process-bound voting credential/signing service at the client boundary;
- independent verifier;
- signed audit/result manifest;
- minimized public evidence bundle.

Rejected:

- election kernel record kind or reserved row;
- EFS/KEL principal as voter identity;
- ZK state in admission;
- threshold decryption in the kernel;
- EFS as census authority, ballot box, tally authority, keykeeper, or settlement domain;
- claim that an EFS copy changes the authoritative chain/process basis.

### Artifact classification

| Artifact | EFS disposition | Conditions |
|---|---|---|
| Exact election definition | Yes | Canonical options/rules/time/revote/retention and hash-pinned reviewed translations |
| Deployment identity | Yes | Chain ID, finality basis, registry and verifier addresses/code hashes, process/circuit IDs |
| Frozen voting client | Yes | Complete closure; no mutable live asset |
| Source, SBOM, build recipes | Yes | At least two independent reproducible-build attestations |
| Circuits/verifying keys/setup evidence | Yes | Exact hashes, phase-two ceremony transcript, participant attestations |
| Public encryption configuration | Yes | Public key, warden set, threshold, governance/liveness assumptions |
| Census root | Yes | Commitment only |
| DKG commitments/proofs | Conditional | Only artifacts defined as public by the audited DKG |
| Aggregate partial decryptions | Conditional | Aggregate-result shares/proofs after close; never secret shares |
| Final root/result/proofs/settlement | Yes | Bound to finalized chain basis and exact versions |
| Audits/incidents/observer reports | Yes | Attributed evidence, not a generic safety grade |
| Individual receipt | Local/private user export | Never auto-publish |
| Individual ciphertexts/full blobs | Default no | Synthetic or explicitly consented research only; otherwise retention-limited external archive |

### Client boundary

A prototype client should:

- freeze ballot, UI, translations, endpoints, contracts, circuits, artifacts, and verifying keys before opening;
- create a new process for any in-election change rather than silently auto-updating;
- allow only exact RPC/sequencer/artifact hosts;
- prohibit analytics, trackers, remote fonts, wildcard HTTP, and unrestricted URLs;
- keep election credential secret separate from EFS signing, wrapping/encryption, wallet, and device keys;
- avoid generic `wallet.sign` and `sendTransaction`; use a process-bound ceremony/capability if DAVINCI authentication needs a signature;
- keep the choice and receipt out of ordinary EFS outbox/receipt journals;
- use an independently built verifier rather than a verifier embedded only in the casting client;
- run in a high-assurance profile until secret-state and signing boundaries are reviewed.

Network mediation does not create anonymity. DAVINCI submissions authenticate an address in the payload, and submission timing remains observable even if a relay hides IP information from one endpoint.

### Full-blob archive test

For a synthetic election, the research prototype should prove it can:

1. obtain each accepted blob/batch from an independent carrier;
2. verify byte equality to the versioned blob/KZG commitment;
3. replay each transition from the prior root;
4. reproduce the final state and result proof without Vocdoni-hosted services;
5. detect missing, reordered, or equivocated data;
6. document the exact retention/privacy cost.

Passing this test makes EFS useful archival infrastructure. It does not provide near-real-time DA, censorship resistance, ballot anonymity, or election authority.

## Questions for Vocdoni

### Legacy Vochain

1. What independent security audits cover the current LTS circuits, node, gateway, CSP, keykeeper, and client?
2. Who controls the 11 validator operators and four keykeeper roles, and what governance admits/removes them?
3. Is every legacy encryption layer required for tally, and what is the documented recovery procedure for a missing keykeeper?
4. What are the precise CSP logging, retention, and identity-to-ephemeral-address separation guarantees?
5. What historical data can an observer reconstruct without a Vocdoni gateway, given current pruning?

### DAVINCI

1. What is the canonical production architecture: Circom/recursive Groth16, zkVM, or both?
2. When will threshold DKG replace the complete private key in the canonical node?
3. Which party holds the complete private key on current public deployments, what logs/ciphertexts can it access, and how is key deletion verified?
4. Is periodic rerandomization of prior state leaves implemented? If so, where; if not, how should current receipt-freeness be described?
5. What cast-as-intended mechanism is planned?
6. What forced-inclusion, alternate-intake, or last-minute revote path exists if a sequencer censors?
7. How are multiple sequencers coordinated when they build from the same prior root?
8. Which exact circuits/verifying keys are deployed, and where is the multiparty circuit-specific setup transcript?
9. Which independent audits are scheduled or complete, and against which commits/artifacts?
10. Why is `blobsDA` disabled on reviewed L2 deployments, and how can an independent observer reconstruct those elections?
11. What is the durable DA and retention plan after EIP-4844 pruning?
12. How will address/turnout/state-position metadata and harvest-now-decrypt-later risk be handled?
13. What accessibility evidence exists for proof generation on old/mobile devices, screen readers, keyboard-only use, low bandwidth, and multilingual ballots?
14. What city-scale burst, outage, reorganization, worker-loss, warden-loss, and incident-response tests have passed?
15. What launch criteria distinguish a research/test deployment from production?

### Integration and governance

1. Can process metadata commit a stable content hash for an EFS package rather than depend on a mutable URL?
2. What minimum public bundle is sufficient for a fully independent verifier/replay implementation?
3. Would Vocdoni support a synthetic EFS archival/replay exercise and a public threat-model workshop?
4. What claims does Vocdoni itself consider inappropriate for legacy anonymous mode and current DAVINCI deployments?

## Validation backlog

Highest priority:

1. Rebuild deployed DAVINCI contracts from pinned source and compare runtime bytecode.
2. Hash every deployed proving/verifying artifact and establish setup provenance.
3. Integrate and adversarially test threshold DKG with independent wardens.
4. Test sequencer censorship, crash recovery, concurrent-root races, and deadline revotes.
5. Reconstruct a complete synthetic election from independently archived data with no Vocdoni service dependency.
6. Model CSP, sequencer, client, RPC, archive, and support logs as one privacy graph.
7. Add an independent cast-as-intended experiment.
8. Benchmark Chicago-shaped bursts and disadvantaged client devices, not average throughput.
9. Commission cryptographic, contract, application-security, privacy, accessibility, and election-procedure reviews.
10. Re-check Illinois/Chicago authority and records/privacy law before any civic cohort is recruited.

## Source-quality cautions

- Project case studies and historical vote totals are vendor-reported.
- A live endpoint proves only the state returned at the observation time.
- GitHub source proves what a pinned revision says, not which binary every server runs.
- A paper describes an intended system; code may lag it.
- Open source means review is possible, not that independent review occurred.
- A contract address and bytecode are not enough without reproducible build matching.
- “Anonymous,” “private,” “secure,” “verified,” and “decentralized” are underspecified unless the protected party, adversary, time horizon, and trust assumptions are named.
