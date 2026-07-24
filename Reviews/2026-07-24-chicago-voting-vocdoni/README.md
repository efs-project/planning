# Vocdoni, Ethereum, EFS, and Chicago voting

**Research date:** 2026-07-24

**Status:** done — point-in-time architecture, security, legal, and political-science review

**Disposition:** research only; no EFS v2 design is promoted and no public-election deployment is recommended

**Companion record:** [evidence, transcript, source pins, and working notes](./evidence-notes.md)

#kind/research #status/done #repo/planning #topic/privacy #topic/efsv2 #topic/onchain

## Executive answer

Vocdoni is credible, unusually experienced voting-technology work, but the name now covers two materially different architectures:

1. **The deployed legacy Vocdoni stack** uses a purpose-built, permissioned CometBFT chain called **Vochain**. It can derive eligibility from Ethereum accounts and uses Ethereum-style signatures, but votes are not settled on Ethereum or an L2. Zero-knowledge proofs are optional and principally provide anonymous census membership and a nullifier. Separate election-key encryption hides choices until keykeepers reveal the keys.
2. **DAVINCI**, the successor under active development, is a specialized voting ZK rollup that settles proofs and state roots to an EVM contract. It combines Groth16 proofs, encrypted ballots, recursive aggregation, threshold ElGamal decryption of the aggregate, and—in its preferred deployment—EIP-4844 blobs. It can target Ethereum or EVM L2s. As of this review it is a promising prototype, not production election infrastructure.

The short answers are:

| Question | Answer |
|---|---|
| Is Vocdoni ZK-based? | **Sometimes.** Legacy Vochain has an optional ZK-anonymous mode. DAVINCI is fundamentally ZK-rollup-based. ZK alone does not create ballot secrecy, receipt-freeness, eligibility, or coercion resistance. |
| Does it work on Ethereum? | **Legacy: no, not as the settlement chain. DAVINCI: yes, on EVM settlement domains.** Current public DAVINCI deployments are test/prototype deployments, not Ethereum mainnet. |
| Does it work on L2s? | DAVINCI contracts can be deployed to EVM L2s, and current source/configuration includes several. Each L2 adds its own sequencer, data-availability, upgrade, bridge, and finality assumptions. “On an L2” is not equivalent to Ethereum-L1 security. |
| Could it integrate with EFS? | **Yes, as a non-authoritative application, package, verifier, and minimized evidence archive.** EFS must not be the voter registry, identity provider, ballot box, tally authority, keykeeper, or election system of record. No EFS kernel change is justified. |
| Should Chicago use it for a binding public election? | **No under the present legal, certification, operational, and security posture.** Illinois’s own remote-vote-by-mail study found no viable implementation solution and significant cybersecurity risk. |
| What is the strongest first experiment? | A synthetic or explicitly nonbinding civic/organizational election, with no real voter file, an independently packaged verifier, paper or conventional ground truth, and a deliberately minimized EFS audit bundle. |

The most promising Chicago application is therefore not “replace the ballot with Ethereum.” It is **publicly verifiable civic-decision infrastructure**: participatory budgeting, an off-ballot consultation, a community allocation process, or a supervised mock election in which the cryptographic result is compared against an independently auditable paper or conventional result.

For that first application, Vocdoni/DAVINCI is not automatically the best choice:

- **Decidim** is stronger as a civic participation and participatory-budgeting platform.
- **ElectionGuard plus voter-verifiable paper** is the more relevant direction for a supervised public-election research path.
- **Belenios** is a mature open cryptographic option for lower-stakes associations.
- **MACI** is more directly optimized for Ethereum-native anti-collusion voting, but it gives its coordinator substantial privacy and liveness trust.
- **Semaphore** is a useful anonymous-membership primitive, not a complete voting system.

The right answer depends on which political institution is being built. A binding municipal election, an advisory question printed on an official ballot, an off-ballot participatory-budgeting process, and a private association vote are not interchangeable.

## The stronger question this review actually answered

The original prompt was improved in six ways before research:

1. **Separate the use cases.** The review tests a binding Chicago election, an official advisory referendum, an off-ballot civic or participatory-budgeting process, and a private organization vote independently.
2. **Separate the two Vocdoni generations.** Current Vochain behavior is not inferred from DAVINCI plans, and DAVINCI claims are not attributed to the legacy product.
3. **Define the security properties.** Ballot secrecy, anonymous eligibility, hidden-until-close voting, end-to-end verifiability, receipt-freeness, coercion resistance, accessibility, and operational resilience are scored separately.
4. **Use an evidence hierarchy.** Statutes, government reports, official protocol papers, source code, and live endpoints outrank marketing. The supplied conversation is historical testimony, not technical proof.
5. **Threat-model institutions, not only cryptography.** The voter’s device, credential issuer, election organizer, sequencer, validators, key wardens, chain governance, support staff, courts, and public legitimacy all matter.
6. **Treat EFS as a candidate boundary, not a presumed dependency.** The review asks what EFS can safely publish, what it must never retain, and whether any kernel change is warranted.

This framing matters because a protocol may correctly prove a tally while still failing democracy. It may exclude legitimate voters, expose who participated, let a coercer observe a voter at home, encrypt a different choice than the screen displayed, become inaccessible during a deadline, or leave no legally cognizable remedy.

## What the recording contributes

The supplied 1 minute 49 second audio is an enthusiastic historical recommendation identified by the user as Griff Green. It describes Vocdoni as Barcelona-based, inspired by the 2017 Catalan independence referendum, connected with Giveth House and Aragon, technically experienced, and unusually focused on adoption by real civic and professional organizations.

The broad history checks out, with qualifications:

- Human Rights Watch and Amnesty International documented excessive police force at Catalan polling places in 2017. The referendum had also been suspended by Spain’s Constitutional Court, so the legal and human-rights facts should be stated together rather than reduced to a blockchain origin myth. [Human Rights Watch](https://www.hrw.org/news/2017/10/12/spain-police-used-excessive-force-catalonia), [Amnesty International](https://www.amnesty.org/en/latest/news/2017/10/spain-excessive-use-of-force-by-national-police-and-civil-guard-in-catalonia-2/)
- Vocdoni describes its formation in Barcelona in 2018 and the Catalan events as part of its motivation. [Vocdoni, “About us”](https://vocdoni.io/en/about-us)
- Aragon’s own 2021 retrospective says it acquired Dvote Labs, the company behind Vocdoni, and that the team became Aragon Labs. [Aragon 2021 retrospective](https://blog.aragon.org/2021-retrospective/)
- “They tried Cosmos” is best read as conversational shorthand. The deployed chain is built on Tendermint/CometBFT; that is not evidence that the product was an application on the Cosmos Hub.

The recording is useful evidence of mission and reputation. It is not evidence that a current protocol is secure, audited, lawful for Illinois elections, decentralized, or ready for Chicago. The complete automated transcript and provenance are in the [companion notes](./evidence-notes.md#supplied-audio).

## Vocdoni generation one: the deployed Vochain system

### Architecture in plain language

The legacy system is an application-specific voting blockchain.

1. An organizer creates an organization and an election.
2. The organizer defines an eligibility census. Depending on the election, the census can be a Merkle tree, an Ethereum-derived token/account snapshot, or another supported proof source.
3. The voter’s client obtains or constructs an eligibility proof, encodes the ballot, optionally encrypts it, signs the transaction, and submits it through a gateway.
4. Vochain validators order and execute election transactions with CometBFT consensus.
5. The chain rejects invalid census proofs, duplicate nullifiers, invalid timing, and ballots that violate the configured protocol rules.
6. At close, the tally is computed. For encrypted elections, designated keykeepers reveal decryption keys after the election ends.

This is a useful design choice for throughput and predictable election rules, but it is not “voting on Ethereum.” The current node README describes Vochain as a blockchain using CometBFT, and admission to its validator set is selective and coordinated with the Vocdoni team. [Pinned `vocdoni-node` README](https://github.com/vocdoni/vocdoni-node/blob/0fadb29d9e3f3831a8312b445c3d6d7bb41e45dc/README.md)

The current public LTS endpoint reported, at the 2026-07-24 snapshot:

- chain `vocdoni/LTS/1.2`;
- 2,573 elections and 266 organizations;
- 134,436 accepted votes;
- 11 equal-power validators;
- a maximum census size of 1,000,000.

Those are endpoint observations, not an audit and not necessarily all historical Vocdoni usage. Vocdoni’s site reports more than 200,000 historical votes; that larger number may span networks and product generations. Marketing totals and current-chain totals should not be silently merged.

### What the legacy ZK mode actually does

The word “ZK” hides several different jobs:

| Mechanism | What it establishes | What it does not establish |
|---|---|---|
| Census Merkle proof | A submitted credential/address belongs to the organizer’s committed eligible set | That the organizer built a fair or complete voter list |
| Groth16 anonymous-voting proof | Census and secret-identity-key membership, a valid election-bound nullifier, weight, and a commitment/hash binding to the submitted vote | That the voter’s device encrypted the intended choice; lasting secrecy of the choice; coercion resistance |
| Election nullifier | The same secret identity cannot cast multiple concurrently valid ballots under the configured rules | One-human-one-vote across duplicate civil or cryptographic credentials |
| Layered NaCl ballot encryption | Selected keykeepers cannot read the ballot before the necessary private keys are revealed | Permanent secrecy after key release; threshold tolerance if the configured design requires every key |
| Chain consensus and public state | Accepted transactions and deterministic tally inputs are replicated and inspectable | Neutral census administration, endpoint availability, correct client software, or legal certification |

The anonymous mode uses a secret identity key and a ZK proof to avoid publishing the voter’s ordinary identity with the ballot. Its public inputs include the election identifier, census and identity-key roots, a nullifier, voting weight, and a vote hash. This makes “eligible and not already used” verifiable without disclosing the underlying leaf. [Legacy ZK census-proof documentation](https://docs.vocdoni.io/architecture/protocol/anonymous-voting/zk-census-proof.html)

Ballot encryption is a separate switch. The legacy ballot can be:

- **public and identified**;
- **public but ZK-unlinked**;
- **encrypted until close but submitted under an identifiable account**; or
- **both encrypted until close and ZK-unlinked**.

That last combination is the closest to an ordinary secret ballot, but even then the privacy statement is conditional. Network timing, gateways, the census issuer, browser compromise, duplicate credentials, keykeeper behavior, and later key disclosure remain outside the simple “uses ZK” claim.

### Trust and operational limits

Legacy Vochain distributes execution, but its real trust model is not trustless:

- the organizer controls election configuration and the initial census;
- census issuers control inclusion, exclusion, and voting weight;
- the validator set is permissioned rather than open Ethereum consensus;
- keykeepers are selected from a small validator environment;
- gateways can observe network metadata and can delay or censor a submission, even if another gateway may provide a route around one failure;
- a compromised browser can alter a ballot before proving or encryption;
- a voter at home can be watched, pressured, paid, or required to surrender a credential;
- revealing decryption keys after close means individual ciphertext confidentiality is not timeless;
- the currently exposed gateway prunes older blocks, so “blockchain” does not by itself guarantee that every observer has permanent reconstructable data.

Legacy Vocdoni is therefore best understood as a specialized, inspectable election network with useful privacy modes—not an Ethereum rollup and not a permissionless public-election substrate.

## Vocdoni generation two: DAVINCI

### Architecture in plain language

DAVINCI changes the design substantially:

```text
organizer + census commitment + key wardens
                       │
                       ▼
voter client: encrypt ballot and prove validity/membership
                       │
                       ▼
sequencer: verify, rerandomize, batch, and recursively prove
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
EIP-4844 batch data        EVM ProcessRegistry
                                   │
                                   ▼
key wardens partially decrypt only the aggregate
                                   │
                                   ▼
public result + decryption/result proof
```

The intended flow is:

1. The organizer commits the election definition, census, metadata, capacity, and key-warden configuration to an EVM process registry.
2. Key wardens run a distributed-key-generation ceremony for a threshold ElGamal election key.
3. The voter client encrypts the selections and creates a Groth16 proof covering ballot validity/encryption and eligibility state. The submission also uses Ethereum-style authentication.
4. A sequencer verifies submissions, rerandomizes encrypted ballots, and batches roughly 60 votes.
5. Recursive proofs attest that authentication, aggregation, and the state transition were computed correctly.
6. On the preferred path, batch data is published in an EIP-4844 blob and the proof/state root is settled to the EVM contract.
7. After close, enough key wardens publish provable partial decryptions of the aggregate. Individual plaintext ballots are not supposed to be decrypted for the tally.

The current DAVINCI paper is an accepted E-Vote-ID 2025 poster/demo working paper, not a completed independent security review. The conference explicitly distinguishes poster/demo acceptance from full scientific review or endorsement. [E-Vote-ID 2025 program note](https://e-vote-id-2025.inria.fr/pages/program.html), [DAVINCI paper repository](https://github.com/vocdoni/davinci-paper/tree/467dc62f0e82426fd6ca6a294d6673edba7762f1)

### What ZK, encryption, and rerandomization each do

DAVINCI is accurately called ZK-based, but only if the components remain distinct:

- **Groth16 voter proofs** aim to show that a submitted encrypted ballot follows the circuit rules, is associated with an eligible census state, and has the required authentication without revealing the ballot.
- **Recursive aggregation/state-transition proofs** let the settlement contract verify a large amount of off-chain election computation from a compact proof.
- **Threshold ElGamal encryption** provides secrecy. ZK proves claims about the encrypted computation; it does not itself encrypt the vote.
- **Rerandomization and revoting** are intended to prevent a voter from proving which final ciphertext encodes an earlier choice, improving receipt-freeness.
- **Nullifiers/state rules** enforce the protocol’s duplicate/revote behavior.
- **Settlement on an EVM chain** makes a verified state transition difficult for a sequencer to forge. It does not force a sequencer to include a vote, make a credential issuer honest, or make the voter’s device safe.

DAVINCI aims at receipt-freeness, but that is not a blanket claim of remote coercion resistance. An in-room coercer, compromised phone, forced abstention, credential surrender, denial of a safe later revote, or timing correlation remain meaningful threats.

Most importantly, the current design does not provide a protocol-level **cast-as-intended** check. It can prove that a ciphertext and state transition satisfy the circuit, but a compromised client can encode a different valid selection from the one shown to the voter. That is different from:

- **recorded as cast:** the submitted ciphertext is included in the accepted election state; and
- **tallied as recorded:** the accepted state is correctly aggregated and decrypted.

Current U.S. Election Assistance Commission evaluation work treats all three as distinct parts of end-to-end verifiability. [EAC E2E protocol evaluation](https://www.eac.gov/voting-equipment/end-end-e2e-protocol-evaluation-process)

### Ethereum and L2 support

DAVINCI’s settlement contracts are EVM contracts. The pinned source includes nonzero prototype addresses for Sepolia, Arbitrum, Arbitrum Sepolia, Base, and Celo, while Ethereum-mainnet addresses are zero. The current public sequencer advertises Sepolia, Arbitrum, Arbitrum Sepolia, and Celo. [Pinned contracts README](https://github.com/vocdoni/davinci-contracts/blob/719d9a8d2d92af5abb589ed6edab763629692071/README.md), [pinned address configuration](https://github.com/vocdoni/davinci-contracts/blob/719d9a8d2d92af5abb589ed6edab763629692071/golang-types/addresses.go)

This supports three precise conclusions:

1. DAVINCI can settle to Ethereum-compatible domains.
2. It was not deployed to Ethereum mainnet in the reviewed configuration.
3. Security is domain-specific. A DAVINCI process ID binds the chain ID and process-registry address, so an EFS reference cannot turn one election into a chain-independent election.

The preferred data path also differs across domains. At the snapshot, Sepolia’s process registry required blob data, while the reviewed Arbitrum, Arbitrum Sepolia, and Celo configurations did not. When blob enforcement is disabled, a valid contract transition does not by itself guarantee that every outside observer can retrieve the full batch data needed for reconstruction. The chain or L2’s own DA and operational model becomes part of the election system.

### Data availability is a first-class problem

DAVINCI’s working paper says EIP-4844 blobs are available for only a limited period—approximately 18 days in its current analysis—and identifies long-term data availability as open. [DAVINCI background](https://github.com/vocdoni/davinci-paper/blob/467dc62f0e82426fd6ca6a294d6673edba7762f1/v2/sections/background.tex), [DAVINCI analysis](https://github.com/vocdoni/davinci-paper/blob/467dc62f0e82426fd6ca6a294d6673edba7762f1/v2/sections/analysis.tex)

Preserving batches matters for independent replay, but preserving encrypted individual ballots forever creates a privacy problem: ciphertext is a “harvest now, decrypt later” asset if wardens later collude, keys leak, cryptography ages, or an implementation defect appears. Long-term auditability and long-term ballot secrecy pull in opposite directions.

EFS can preserve a signed manifest, commitments, public proofs, settlement receipts, and the final result. It should not casually solve DAVINCI’s DA problem by permanently replicating every ballot-bearing blob. For real civic use, complete batch retention needs a protocol-specific and legally reviewed retention policy outside the assumption that all EFS bytes are a desirable 100-year archive.

### Current maturity

The project is active, but the reviewed evidence says prototype:

- the contracts README labels the system work in progress and not for production;
- the paper says distributed key generation is implemented but not yet integrated;
- the paper says there has been no independent security audit;
- no protocol-level cast-as-intended mechanism was found;
- the code and public artifact configuration use `dev` circuit artifacts;
- current setup scripts and generators perform a single-process Groth16 phase-two setup after the common Powers of Tau input; no production multiparty phase-two ceremony transcript was found;
- the public sequencer endpoint exposed one sequencer address, no connected workers, no active election, and modest test activity at the snapshot;
- long-term DA and censorship/fallback behavior remain incomplete.

The current canonical DAVINCI node also generates and stores a complete private ElGamal key and uses that key in finalization. That is consistent with the paper’s admission that DKG is not integrated, but it has an important practical consequence: current test deployments do not yet have the intended threshold-privacy trust model. A compromise of the key-holding service can expose individual ballot ciphertexts to decryption. The separate DKG project and design cannot be treated as a deployed property of the canonical voting node.

Groth16 security depends on destroying the toxic waste from the circuit-specific setup. A production election therefore needs a public multiparty phase-two ceremony, exact circuit and verifying-key hashes, participant attestations, and reproducible artifact generation. “We used a Powers of Tau file” is not enough if one party then performs the circuit-specific setup alone.

DAVINCI’s own reported benchmarks are encouraging engineering evidence, not independent capacity proof: approximately ten seconds for a browser-side voter proof, about 60 votes per batch, under three minutes for a GPU worker, and roughly 200 settled votes per minute in the paper’s two-sequencer/ten-worker model. Chicago-scale capacity, election-day bursts, client diversity, recovery, accessibility, and adversarial availability have not been demonstrated by those benchmarks.

## Chicago is primarily an election-governance problem

### Binding public election: present no-go

Illinois law and administration center certified systems, durable voter-verifiable paper, testing, recount evidence, and post-election checks. Relevant provisions include:

- [Illinois Constitution, Article III](https://www.ilga.gov/commission/lrb/con3.htm);
- [10 ILCS 5/24C-11](https://www.ilga.gov/Documents/legislation/ilcs/documents/001000050K24C-11.htm), including permanent paper and verification/accessibility requirements;
- [10 ILCS 5/24C-16](https://www.ilga.gov/legislation/ilcs/fulltext?DocName=001000050K24C-16), covering approval and testing;
- [10 ILCS 5/24C-15](https://www.ilga.gov/legislation/ilcs/fulltext?DocName=001000050K24C-15), including the 5% post-election check; and
- [Illinois Administrative Code Part 204](https://www.ilga.gov/agencies/JCAR/EntirePart?titlepart=02600204).

Most directly, the Illinois Remote Vote by Mail Task Force’s final report, approved on 2025-08-20, concluded that the cybersecurity risks of remote electronic ballot return were significant and that it could not identify a viable implementation solution. [Illinois Remote Vote by Mail Task Force final report](https://www.ilga.gov/Documents/Reports/ReportsSubmitted/6317RSGAEmail13939RSGAAttachSRVBM%20Final%20Report-Approved%20August%2020-25.pdf)

That conclusion is aligned with:

- joint federal guidance describing electronic marked-ballot return as high risk; [CISA and partners](https://www.cisa.gov/sites/default/files/2024-02/Final_%20Risk_Management_for_Electronic-Ballot_05082020_508c.pdf)
- the National Academies’ conclusion that marked ballots should not be returned over the Internet and that blockchain does not solve the core security problems; [National Academies](https://www.nationalacademies.org/read/25120/chapter/7)
- Illinois’s existing accessible-vote-by-mail flow, in which a ballot may be delivered and marked electronically but must still be printed and physically returned.

The conclusion here is narrower than “cryptography can never improve elections.” It is:

> Do not use remote Ethereum, an L2, Vochain, DAVINCI, EFS, email, or any other Internet channel as the binding return path for a Chicago public-election ballot under the present legal and security posture.

A supervised, paper-backed, end-to-end-verifiable experiment is a different category and remains worth studying.

### Four use cases, four answers

| Use case | Present feasibility | Best interpretation |
|---|---|---|
| Binding Chicago candidate election or referendum | **No** | Certified equipment, voter-verifiable paper, canvass, recount, and audit remain authoritative. Research may run in parallel without affecting the result. |
| Advisory question placed on the official CBOE ballot | **No as a replacement channel** | “Advisory” describes legal effect, not a waiver of official ballot administration. |
| Off-ballot participatory budgeting or civic consultation | **Yes, conditionally** | Best fit for a bounded pilot if it is clearly non-Election-Code, offers accessible conventional channels, and does not claim official-election status. |
| Private association, cooperative, board, DAO, or professional organization | **Yes, risk-scaled** | Legal/bylaw review, membership appeals, accessibility, and the value at stake still matter, but this is a much more appropriate proving ground. |

Chicago already has ward-level participatory-budgeting precedents. Those processes are politically meaningful without pretending to be statutory elections. [Example: 40th Ward People’s Budget](https://40thward.org/2025/10/announcing-the-2026-peoples-budget/)

### Political-science and legitimacy constraints

A legitimate municipal vote is more than a correct cryptographic function:

- **Eligibility is an administrative judgment.** Residents move, die, change names, have duplicate records, contest district assignment, lack standard identity documents, and need an appeal path. A Merkle root merely commits the issuer’s decisions.
- **The secret ballot protects social power relations.** Remote voting occurs around employers, landlords, partners, political organizers, family members, vote buyers, and abusive household members. Revoting may help some voters but cannot guarantee a private later opportunity.
- **Accessibility is substantive equality.** A ten-second proof on a modern laptop may become failure on an older phone, screen reader, limited-data plan, or unstable connection. Chicago’s language diversity requires reviewed translations and support, not just localized strings.
- **Audit must be comprehensible and contestable.** Experts need mathematical evidence; voters, observers, journalists, judges, and campaigns need understandable procedures, deadlines, paper or independent ground truth, and a remedy when something fails.
- **Public confidence is adversarial.** A genuine outage, misleading screenshot, unexplained chain reorganization, wallet scam, or false claim that “the blockchain changed my vote” can delegitimize a sound tally.
- **Turnout metadata can be sensitive.** Publishing who obtained a credential or when a district voted can expose political affiliation even if choices remain encrypted.
- **Crypto-economic voting is the wrong default.** Civil eligibility must not depend on owning a token, paying gas, holding a wallet, or accepting a transferable financial identity.

U.S. Census QuickFacts currently reports high but non-universal household computer and broadband access in Chicago, substantial use of languages other than English at home, and a meaningful under-65 disability population. Broadband availability is not the same as a safe, private, supported voting device. [U.S. Census QuickFacts, Chicago](https://www.census.gov/quickfacts/fact/table/chicagocityillinois/COM100223)

## Alternatives: which is better for what?

No alternative dominates across binding elections, civic participation, private associations, and DAOs.

| System | Best use | Core security/trust model | Better than Vocdoni when… | Chicago verdict |
|---|---|---|---|---|
| [ElectionGuard 2.x](https://electionguard.vote/) | Supervised, paper-backed public-election E2E research | Threshold ElGamal, cast/challenge verification, public tally/decryption proofs; paper remains authoritative; election system handles eligibility | Paper evidence, ceremonies, independent verification, and public-election integration are more important than Ethereum | Best technical direction for an official supervised research track, never a reason to remove paper |
| [Swiss Post e-voting](https://www.bk.admin.ch/en/e-voting) | Production benchmark for carefully authorized remote public voting | Complete-verifiability program, state identity/operations, independent examination, distributed cryptography | Studying the institutional cost and controls of binding remote voting | Benchmark only; jurisdiction-specific and not a reusable Chicago product |
| [Belenios](https://www.belenios.org/howitworks.html) | Associations, universities, unions, lower-coercion elections | Credentials, trustees, homomorphic tally or mixnet, public verification; its own caveats acknowledge no cast-as-intended and weak coercion resistance | A mature self-hosted, non-chain cryptographic election is preferred | Strong private-organization candidate; not suitable for a Chicago binding election |
| [Helios](https://vote.heliosvoting.org/faq) | Low-coercion boards and academic elections | Browser ElGamal, trustees, inclusion tracker, challenge ballots | Simplicity and long-lived open implementation outweigh newer architecture | Low-stakes only; Helios itself warns against high-stakes public-office remote use |
| [Decidim](https://docs.decidim.org/en/develop/features/general-description.html) | Civic proposals, deliberation, participatory budgeting, accountability | Municipal authorization and application transparency; not inherently cryptographic E2E voting | The actual institution is a civic process rather than a ballot cryptosystem | Best overall shell for a Chicago PB/civic pilot |
| [CONSUL Democracy](https://github.com/consuldemocracy/consuldemocracy) | Municipal proposals, polls, legislation, PB | Open municipal application and registry integration; conventional rather than cryptographic E2E audit | A simpler municipal participation workflow fits better | Credible second civic-platform choice |
| [MACI v3](https://maci.pse.dev/docs/introduction) | Ethereum-native private, anti-collusion grants or DAO voting | Encrypted commands and ZK tally; coordinator can read votes and can fail liveness | Receipt-freeness against outsiders and EVM integration matter more than coordinator trust | Excellent research comparison; inappropriate as a civil-election default |
| [Semaphore v4](https://docs.semaphore.pse.dev/) | Anonymous group membership and one-per-scope signaling | Merkle membership proof plus nullifier; group administrator remains trusted | A reusable anonymous-eligibility primitive is needed | Component only; it supplies no ballot encryption, tally, lifecycle, accessibility, or coercion resistance |
| [Snapshot](https://docs.snapshot.box/) | DAO signaling and wallet-weighted governance | Signed public wallet votes; optional choices hidden only until close | Token/account governance is the real institution | Good DAO tool, poor one-resident-one-vote system |
| [OpenZeppelin Governor](https://docs.openzeppelin.com/contracts/5.x/governance) | Transparent executable DAO governance | Mature public on-chain proposals, quorum, votes, timelock | Binding smart-contract execution matters and votes may be public | Appropriate for EFS/DAO governance, not secret civic ballots |
| Simply Voting / ElectionBuddy | Managed association logistics | Vendor-operated identity, database, reports, and receipts rather than independently verifiable cryptographic tally | Accessibility/support or inexpensive communications dominate | Procurement candidates for private organizations, not municipal statutory voting |

Two especially useful comparisons:

- **ElectionGuard is better than DAVINCI for a supervised official research track** because it is designed around paper-backed public-election evidence and cast/challenge verification rather than remote chain settlement.
- **Decidim is better than either for participatory budgeting** because proposals, deliberation, eligibility, implementation tracking, translation, and civic accountability are the central product. A cryptographic ballot backend can be evaluated separately if the process truly needs it.

MACI deserves a direct DAVINCI comparison in an Ethereum research pilot. MACI’s revoting/key-change approach is explicitly anti-collusion, but its coordinator can decrypt ballots and stop the tally. DAVINCI distributes decryption among wardens and proves rollup transitions, but its present DKG integration, DA, cast-as-intended, and production setup are incomplete. Neither is ready to turn a civil voter file into wallet addresses.

## The safe EFS integration

### Boundary

EFS can be a distribution and evidence sidecar:

```text
EFS election package + signed audit manifest
                      │
                      ▼
isolated, frozen voting client ──► voting network / sequencers
                      │
                      ▼
             settlement domain
                      │
                      ▼
       minimized result/proof bundle on EFS
```

It must not become the election authority. EFS v2’s current privacy work explicitly says that EFS can be confidential but is not an anonymity system, and that ZK belongs in durable conventions or replaceable sibling verifiers rather than kernel admission. See [[privacy-pass-synthesis]], [[privacy-freeze-reservations]], and [[onchain-completeness]].

The integration therefore belongs in:

- an election-specific, content-addressed client package;
- explicit network and credential capabilities;
- an external Vocdoni/DAVINCI adapter;
- a separately built verifier application;
- a signed public audit manifest; and
- a minimized result/evidence archive.

It does **not** justify an EFS election record type, reserved row, KEL authority, voter principal, admission rule, tally circuit, or threshold-decryption committee.

### Appropriate EFS records

EFS may publish:

- the exact election definition, rules, dates, revote policy, retention policy, and reviewed translations;
- chain ID, finality basis, process-registry address and code hash, process ID, circuit/version IDs, and verifier addresses;
- frozen client source, build inputs, SBOM, dependency closure, deterministic-build instructions, and independent rebuild attestations;
- circuits, verifying keys, proving-key metadata, multiparty setup transcripts, and participant attestations;
- public election key, warden set, threshold, DKG commitments/proofs that the audited protocol defines as public, and governance assumptions;
- the census commitment/root—but never the voter list or identity mapping;
- final state root, aggregate result, result/decryption proof, settlement receipt, and verifier output;
- observer statements, accessibility/usability reports, incident reports, and security audits;
- for a paper-backed process, audit manifest hashes, public audit seed, risk-limiting-audit evidence, canvass, and certification.

The independently packaged verifier should not share the voting application’s build and trust path. EFS client v2’s closure manifests, explicit endpoint capabilities, and accessibility requirements are useful architecture for such a package. See [[packages-and-updates]], [[network-privacy]], and [[locale-and-accessibility]].

### Data EFS should not retain

Do not place these on public or nominally “private” EFS:

- Chicago voter-registration data, names, addresses, dates of birth, signatures, district cases, or accommodation data;
- identity-to-wallet, EFS-principal, KEL-principal, passkey, device, or credential mappings;
- access codes, membership proofs, credential secrets, recovery material, ballot randomness, or key-warden shares;
- ballot plaintext;
- IP addresses, precise submission times, device fingerprints, analytics, crash reports, or support logs;
- coordinator plaintext/decrypted commands;
- raw receipt-linked exports or a permanent voter-to-nullifier link;
- individual encrypted ballots or voter-address-indexed state by default.

“Encrypted” does not mean safe to replicate indefinitely. EFS graph, timing, size, author, and funding metadata can remain visible, and durable ciphertext can become plaintext after future key compromise or cryptanalytic change.

Use an election-specific credential namespace independent of EFS signing, encryption/wrapping, and wallet keys. An EFS identity must never be treated as proof that someone is an eligible Chicago voter.

### The DAVINCI DA boundary

EFS can mirror full synthetic DAVINCI blobs for engineering and reconstruction tests. For a real civic cohort, default to:

- a permanent signed manifest and commitments;
- permanent public aggregate result and proofs;
- a retention-limited, legally governed external archive for any ballot-bearing batch data; and
- explicit byte-level binding among process ID, batch number, old/new roots, versioned blob hash, blob bytes, KZG commitment/opening, settlement transaction, block, and finality basis.

A CID alone is not proof that a mirror equals the blob accepted by a settlement contract. A later EFS mirror also cannot repair data that was withheld at transition time or provide forced inclusion. On an L2, it cannot erase that L2’s sequencer, DA, bridge, finality, or upgrade trust.

## Recommended research program

### Phase 0 — Devcon 2026 synthetic demonstration

Build a Chicago-shaped but entirely synthetic election:

- no real voter file or resident identity;
- one realistic multilingual ballot and an accessible conventional comparison UI;
- DAVINCI and one alternative, preferably MACI for an Ethereum comparison or Belenios for a non-chain comparison;
- an EFS-pinned client, source/build/circuit manifest, independent verifier, and minimized result bundle;
- deliberate failures: bad census leaf, duplicate credential, sequencer outage, missing blob, warden dropout, client update, L2 reorganization, and inaccessible device;
- complete cost, latency, proof-generation, accessibility, and reconstruction measurements.

The demonstration should explain which properties were proved and which were assumed. Do not market it as a Chicago election pilot.

### Phase 1 — low-stakes private allocation

Run an opt-in organizational vote where:

- every participant understands the research;
- a conventional result can independently resolve the allocation;
- losing availability does not disenfranchise anyone from a civil right;
- independent wardens and observers are recruited;
- support, appeal, fallback, and deletion procedures are rehearsed.

### Phase 2 — nonbinding civic or participatory-budgeting pilot

Only after legal, community, accessibility, privacy, and security review:

- use Decidim or an equivalent civic shell for proposals and accountability;
- offer staffed in-person, paper, telephone, or other appropriate channels;
- keep the cryptographic channel off-ballot and explicitly non-Election-Code;
- issue non-wallet, election-specific credentials with an appeal path;
- publish a privacy impact assessment and clear retention schedule;
- compare turnout, completion, exclusion, language/accessibility failures, help requests, proof verification, and public understanding—not merely whether the hashes match.

### Phase 3 — supervised paper-backed E2E mock

If election officials are interested, evaluate ElectionGuard or another EAC-reviewed E2E protocol in a supervised setting with paper ground truth. Ethereum/EFS may timestamp or distribute signed public artifacts, but paper and official procedures remain canonical.

No official remote-return phase should be scheduled unless Illinois law, certification, election-security consensus, independent audits, and operational evidence materially change.

## Gates before a consequential nonbinding pilot

1. Exact contracts, circuits, node, client, bytecode, verifying keys, proving assets, and ballot definition are pinned.
2. Independent cryptographic-protocol, circuit, contract, frontend, accessibility, and operational audits cover those exact artifacts.
3. DAVINCI DKG is integrated and independently reviewed; the public ceremony, warden independence, threshold/dropout tests, and recovery behavior are documented.
4. A production multiparty circuit-specific Groth16 setup and transcript replace `dev` artifacts.
5. A cast-as-intended mechanism independent of the device path that encrypted the ballot is designed and tested.
6. Multiple independent sequencers plus a tested inclusion/escape/fallback path exist.
7. Eligibility uses a non-wallet credential, with issuer error detection and a human appeal process.
8. A complete synthetic election is reconstructed from independent carriers and every batch is matched to its settlement commitment.
9. Counsel and privacy reviewers approve an artifact-by-artifact retention schedule.
10. At least two independent builders reproduce the frozen client and verifier.
11. Exact endpoints are capability-scoped; there is no telemetry, wildcard network access, remote font, or mutable dependency.
12. WCAG 2.2 AA, keyboard-only, mobile, VoiceOver, NVDA, reviewed-translation, and assisted-channel testing pass.
13. Sequencer outage, warden dropout, RPC censorship, chain reorganization, blob loss, cache loss, revote, dispute, recount, and incident-response exercises pass.
14. EFS v2 is not treated as production infrastructure before its relevant kernel, privacy, lens, package, and client surfaces are reconciled, frozen, implemented, and audited.

## Immediate kill criteria

Stop or redesign if the project requires:

- binding public-election use before law and certification explicitly permit it;
- a token balance, gas payment, wallet, or transferable financial key as a condition of civil participation;
- raw voter data, identity mappings, ballot plaintext, key shares, or network logs on EFS;
- permanent public individual-ballot ciphertext without an explicit and defensible future-decryption risk decision;
- EFS/KEL/wallet identity reused as civil eligibility;
- one organization controlling the organizer, census authority, sequencer, wardens, client, and archive;
- current WIP contracts, unintegrated DKG, single-party production setup, or unaudited artifacts;
- no cast-as-intended path;
- generic wallet access, wildcard network access, telemetry, or live mutable dependencies in the voting client;
- an in-election code, circuit, verifier, ballot, or contract update without a new process and visible cutover;
- a claim that EFS availability proves election authority, anonymity, receipt-freeness, L2 security, or coercion resistance.

## Overall recommendation

Continue the research, but change the product thesis:

> Build an auditable civic-decision laboratory first, not an Internet replacement for Chicago’s public ballot.

Use Vocdoni’s real-world experience and DAVINCI’s architecture as serious research inputs. Invite the team to answer the unresolved technical questions in the [companion notes](./evidence-notes.md#questions-for-vocdoni). Compare DAVINCI against MACI, Belenios, Decidim, and ElectionGuard in the use cases each is actually designed for.

For EFS, pursue one narrow prototype: an immutable election package, a separately reproducible verifier, and a minimized proof/result archive. Keep every voting-specific mechanism outside the EFS kernel. Preserve no civil identity data and no permanent individual ballot data.

For Chicago, make the first real-world target an opt-in, nonbinding participatory-budgeting or civic consultation process with conventional access channels and independent ground truth. Treat legality, voter-device safety, coercion, accessibility, remedy, and public legitimacy as design requirements equal to proof correctness.

This report is technical and policy research, not legal advice. Illinois election law, administrative rules, certification, and municipal authority must be re-checked with qualified counsel and election officials before any public-facing pilot.
