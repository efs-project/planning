# MACI v3 — Ethereum-native anti-collusion voting

**Reviewed:** 2026-07-28
**Status:** point-in-time primary-source review of released MACI v3.0.0; recommendations are EFS analysis, not a MACI endorsement or an election-security certification
**Scope:** architecture, guarantees, trust, EVM deployment, maturity, operations, EFS integration, and comparison with DAVINCI

#kind/research #status/done #repo/planning #topic/efsv2 #topic/privacy #topic/governance #topic/voting #topic/zk #topic/onchain

## Bottom line

MACI is the most credible **currently released, Ethereum-native option in this review when the specific problem is vote buying or collusion**. It combines encrypted commands, revoting/key changes, EVM commitments, and Groth16 proofs of correct message processing and tallying. A finalized MACI result is not merely an operator's assertion: EVM contracts verify the proof chain and the committed tally.

It is not decentralized in the strongest EFS sense. A single trusted coordinator normally holds the decryption key. That coordinator can read every ballot, reveal them or collude with a briber, learn a running tally, and prevent the poll from finalizing. The proofs prevent the coordinator from finalizing a false result; they do not make the coordinator private, replaceable, or live.

MACI is therefore:

- a good **optional experimental backend** for a secret, nonbinding EFS community poll where receipt resistance matters;
- a plausible subject for a carefully gated DAO-governance prototype;
- unnecessary for a harmless daily “hotdog or hamburger” folder poll;
- not a route to a human-free or trust-free institution; and
- not ready to be treated as an official public-election system. MACI's own governance documentation says government elections remain far away. [MACI governance use case](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/use-cases/governance.md)

**EFS disposition:** **prototype MACI v3 as a replaceable `private-external` backend, outside the EFS kernel.** EFS can make the question, electorate snapshot, implementation, contracts, setup artifacts, chain history, proofs, and result independently reproducible. EFS cannot remove the coordinator's ballot-privacy and completion trust.

## Current version: what is actually released

The canonical repository is now [`privacy-ethereum/maci`](https://github.com/privacy-ethereum/maci), is MIT-licensed, and was active after the release reviewed here. The latest tagged release on the review date is **v3.0.0**, published 2026-06-16. The tagged release commit is `4d0e3a35f9f0c0122101050903bfcb383f7aaaa4`. The core npm packages—contracts, circuits, core, and SDK—are published as `3.0.0`; the coordinator and relayer applications are published as `1.0.0`. [MACI v3.0.0 release](https://github.com/privacy-ethereum/maci/releases/tag/v3.0.0) · [contracts package](https://www.npmjs.com/package/@maci-protocol/contracts) · [SDK package](https://www.npmjs.com/package/@maci-protocol/sdk)

This corrects stale search indexes and earlier reviews that still identify v2.5 as current. It does **not** mean every production claim from older MACI rounds automatically transfers to v3. The exact v3 contracts, circuits, setup artifacts, policies, relayer, coordinator, client, and deployment profile must be evaluated together.

## Research questions

This review asks:

1. Which property is MACI optimizing: secrecy, anti-collusion, correctness, availability, or all four?
2. What can a dishonest coordinator learn, change, omit, or stop?
3. What does “uncensorable” mean if the coordinator can withhold final proofs?
4. Can a voter prove how they voted, sell a key, be forced to abstain, or be watched while voting?
5. Does anonymous poll joining hide choice, participation, identity, or only the link between two MACI keys?
6. Who establishes eligibility and uniqueness?
7. Which bytes and transitions are on an EVM chain, and which remain in a coordinator or IPFS?
8. Is v3 a protocol release, a deployable operator stack, or a maintained turnkey voting product?
9. Which exact v3 components were audited and covered by a trusted setup?
10. What capacity has been demonstrated rather than encoded as a circuit limit or stated on a roadmap?
11. Can a result safely authorize an EFS folder action or an EVM call?
12. What can EFS preserve or verify without becoming the coordinator, registry, or election authority?

### Evidence labels

- **Observed fact** means the claim is supported by the linked tagged source, contract, release, audit, or deployment artifact.
- **Project claim** means MACI states a capacity, property, or roadmap result that this review did not independently reproduce.
- **EFS assessment/recommendation** means the integration, ideological, or deployment conclusion is this review's inference from those sources; it is not a MACI protocol guarantee.

## What MACI is

Minimum Anti-Collusion Infrastructure is an Ethereum application for private on-chain voting and allocation mechanisms. It was proposed by Vitalik Buterin in 2019 to combine blockchain-enforced input commitments and proof verification with a secret operator-held decryption key. The goal is narrower than perfect coercion resistance: make purely online vote buying unreliable because a voter can later change their key or vote without giving the briber dependable evidence of the final state. The original proposal explicitly centralizes that anti-collusion guarantee and lists key selling and trusted-hardware attacks as unresolved. [Original MACI proposal](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413)

MACI v3 is infrastructure, not a political institution or a complete voter application. Its repository contains:

- Solidity contracts;
- Circom circuits and Groth16 proving/verification support;
- TypeScript core, domain objects, SDK, and CLI;
- a coordinator service;
- an optional off-chain relayer;
- a subgraph; and
- documentation and integration tooling.

Eligibility is supplied through external policy contracts, principally the related Excubiae framework. Question design, voter outreach, representativeness, disputes, accessibility, credential recovery, and the legal or organizational meaning of a result remain outside MACI. [MACI introduction](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/introduction.md) · [v3 repository tree](https://github.com/privacy-ethereum/maci/tree/v3.0.0) · [Excubiae repository](https://github.com/privacy-ethereum/excubiae)

## Protocol architecture

### 1. Global signup

A deployment starts with a `MACI` contract and a signup policy. A voter creates a BabyJubJub MACI keypair and calls `signUp`. The policy decides whether the transaction sender may register. The contract places a hash of the MACI public key into a binary Lean incremental Merkle tree and emits the signup data.

MACI does not establish personhood. The documentation assumes an external identity system in which each legitimate participant controls a unique key. An address, token, attestation, credential, or Merkle-tree membership rule proves only what that rule actually checks. [MACI contract](https://github.com/privacy-ethereum/maci/blob/v3.0.0/packages/contracts/contracts/MACI.sol) · [MACI workflow](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/core-concepts/workflow.md)

### 2. Poll deployment and anonymous poll joining

A `MACI` instance deploys distinct `Poll`, `MessageProcessor`, and `Tally` contracts for each poll. Configuration includes:

- start and end timestamps;
- coordinator public key;
- quadratic, non-quadratic, or full-credit mode;
- state, vote-option, and proof-batch parameters;
- poll-specific policy;
- initial voice-credit rule;
- option count; and
- allowed relayer addresses.

V3 adds anonymous poll joining. A participant proves knowledge of a private key corresponding to a public key already in the global signup tree, derives a per-poll nullifier, and joins with a poll public key. This prevents a public cryptographic link from the global MACI key to the poll key.

“Anonymous” needs careful interpretation. The join transaction still publicly emits the poll public key, nullifier, voice-credit balance, and poll state index. Its sender is visible, and the poll policy is enforced against that sender. An address-based policy can therefore make participation directly linkable. Fresh accounts, sponsorship, relaying, and an anonymous policy such as Semaphore can reduce linkage, but MACI does not itself hide transaction timing, network metadata, policy issuance, or the fact that a poll key participated. [Poll contract and `PollJoined` event](https://github.com/privacy-ethereum/maci/blob/v3.0.0/packages/contracts/contracts/Poll.sol) · [poll-joining circuit](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/technical-references/zk-snark-circuits/joinPoll.md)

### 3. Voting

A vote is a signed MACI command containing the voter state index, new public key, option, weight, nonce, poll identifier, and salt. The voter encrypts the signed command using an ECDH shared secret derived from an ephemeral encryption key and the coordinator's public key.

There are two submission paths:

1. **Direct on-chain.** `publishMessage` emits the ciphertext and ephemeral encryption public key and updates an on-chain hash chain.
2. **Relayed/off-chain.** An allowlisted relayer stores full message batches in IPFS and submits the ordered message hashes plus a bytes32 digest of the IPFS CID to the poll contract.

The direct path is the stronger evidence path. A voter can inspect the transaction and the public ciphertext event. Any ciphertext committed through that path must be included in a valid final processing proof. This is commitment to an encrypted command, not proof to the voter that a possibly compromised interface encoded the choice shown on screen. [MACI messages](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/core-concepts/maci-messages.md) · [hashing and encryption](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/core-concepts/hashing-and-encryption.md) · [Poll source](https://github.com/privacy-ethereum/maci/blob/v3.0.0/packages/contracts/contracts/Poll.sol)

### 4. Reverse processing, revoting, and key changes

After the close time, the coordinator fetches every committed message, decrypts it, validates the embedded MACI signature and state transition, and processes messages in reverse order. Later valid commands therefore determine the effective key and ballot. A voter can submit a later vote or key change that silently makes an earlier command ineffective.

That uncertainty is the core anti-collusion mechanism. A voter may show a briber an earlier encrypted command, its randomness, or even appear to surrender a key, while retaining a path to a later effective command. The briber cannot reliably infer the final vote merely from the demonstrated message.

This is **receipt resistance under assumptions**, not complete coercion resistance. It depends on the voter retaining a secret and a practical opportunity to change the key or vote before close, and on the coordinator not revealing its key or decryption transcript. It does not solve:

- a briber who buys a key in trusted hardware or otherwise controls the usable credential;
- surveillance of the voter or device throughout the voting window;
- forced abstention;
- denial of access near the deadline;
- malware that changes the displayed or encrypted choice; or
- retaliation based on participation metadata.

The mechanism is most persuasive against automated, purely online bribes—not every real-world coercion model. [MACI key changes](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/core-concepts/key-change.md) · [original proposal and stated limits](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413)

### 5. ZK processing and tally

The coordinator creates a Groth16 proof for each batch of message processing. The circuit proves, without publishing individual plaintext commands, that:

- the coordinator secret corresponds to the poll's public key;
- the committed messages were processed in the prescribed reverse order;
- invalid commands were handled according to the circuit;
- valid key, nonce, voice-credit, and ballot transitions were applied; and
- the old and new state/ballot commitments are consistent.

`MessageProcessor.processMessages` verifies each proof and advances the public commitment. It has no owner check: anyone may submit a valid proof. In practice, only the coordinator-key holder can generate one because the secret key is a private circuit input.

After message processing, tally proofs connect the final state/ballot commitment to a tally commitment. `Tally` can then verify and publish each option result with its Merkle path and salts. These contract methods also are not coordinator-gated; proof possession is the capability. [process-messages circuit](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/technical-references/zk-snark-circuits/processMessages.md) · [MessageProcessor source](https://github.com/privacy-ethereum/maci/blob/v3.0.0/packages/contracts/contracts/MessageProcessor.sol) · [Tally source](https://github.com/privacy-ethereum/maci/blob/v3.0.0/packages/contracts/contracts/Tally.sol)

## Trust and assurance matrix

| Property | What released MACI v3 provides | Residual limit |
|---|---|---|
| False-result resistance | EVM contracts verify the message-processing and tally proof chain | Depends on exact circuit, verifier, verifying key, setup, contract code, and chain finality |
| Vote forgery resistance | Valid commands require the voter's MACI signature; arbitrary posted ciphertexts are ignored by the proven transition | Eligibility and initial key issuance remain external; a compromised voter key can vote |
| Public ballot secrecy | Public observers see ciphertexts and commitments rather than plaintext choices | The coordinator can decrypt every ballot; later key compromise can expose permanently archived ciphertext |
| Running-tally secrecy | The public does not receive a valid tally until finalization | The coordinator has privileged access to plaintext commands and can learn intermediate sentiment |
| Receipt resistance | Later hidden key changes or votes make an earlier demonstrated command unreliable as proof of the final choice | Conditional on coordinator honesty, a private revoting path, timing, and coercion model; not protection against full surveillance, forced abstention, or robust key sale |
| Direct-message inclusion | A finalized proof must process the committed on-chain message sequence | The coordinator can refuse to finalize the entire poll; the chain/L2 can censor or be unavailable before commitment |
| Off-chain-message inclusion | Hashes are committed on-chain and voters can fall back to direct submission | Current relayer availability and monitoring are additional dependencies; reviewed v3 code does not implement the proposal's signed inclusion promise/challenge mechanism |
| Participation anonymity | Poll joining hides the public cryptographic link between the global signup key and poll key | Sender, policy, timing, nullifier, poll key, and network metadata may still reveal or correlate participation |
| Cast as intended | Open code permits independent ballot construction in principle | No ElectionGuard-style cast-or-challenge, trusted display, or standardized independent check that the device encoded the shown choice |
| Recorded as cast | A voter can check a direct ciphertext transaction or inspect an off-chain batch | This checks ciphertext presence, not that the final effective plaintext equals the voter's intent |
| Tallied as recorded | Yes, if the poll reaches a valid final proof and the full result opening is available | No result is available if the coordinator withholds proofs or loses its key |
| Eligibility/uniqueness | Replaceable on-chain policies can enforce a committed criterion and one-use behavior | Personhood, citizenship, organization membership, recovery, appeals, and issuer correctness are not solved |
| Completion | Anyone can submit an already-generated valid proof | Only the coordinator-key holder can generate processing proofs in the ordinary design; no protocol failover |

The key distinction is:

> MACI strongly reduces trust in the coordinator for **result correctness**, but retains trust in that coordinator for **ballot privacy, privileged information, anti-collusion, and completion**.

### What “uncensorable” should mean here

The v3 introduction says the coordinator cannot censor a vote, while the workflow correctly says the coordinator can halt a round. These are compatible only under a narrow definition:

- if a message is committed directly on-chain and the coordinator finalizes, the proof must account for it;
- the coordinator cannot selectively omit it and still produce a valid result;
- but the coordinator can censor the **outcome** by producing no result at all.

EFS should describe these as **forced accounting conditional on finalization** and **single-coordinator liveness**, not collapse them into one “censorship resistant” badge.

## The off-chain relayer is not the full proposed protocol

Vitalik's 2024 mostly-off-chain proposal has a relayer sign a promise naming a batch position. If the promised message is absent, the voter can challenge on-chain and prevent a result until the promise is satisfied. [Mostly-off-chain MACI proposal](https://ethresear.ch/t/maci-with-mostly-off-chain-happy-path/19527)

The reviewed v3.0.0 implementation is simpler:

- it saves message batches in a database and IPFS;
- it sends their message hashes and an IPFS digest to `Poll.relayMessagesBatch`;
- the coordinator later retrieves the bytes; and
- voters can use the ordinary direct on-chain path if they detect trouble.

The reviewed contracts and relayer do not contain the proposal's signed position promise, challenge, or slashing path. The relayer README recommends that only the coordinator operate it and warns that committing hashes without actually storing the IPFS messages makes the poll impossible to finalize. [v3 relayer README](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/relayer/README.md) · [relayer service source](https://github.com/privacy-ethereum/maci/tree/v3.0.0/apps/relayer) · [Poll relayer path](https://github.com/privacy-ethereum/maci/blob/v3.0.0/packages/contracts/contracts/Poll.sol)

EFS could mirror the IPFS bytes and improve retrieval. It cannot retroactively prove that bytes were available to voters during the challenge/fallback window. A later-recovered batch is not evidence of timely availability.

For an initial EFS pilot, use direct on-chain messages. Test the relayer as a separate availability profile only after adding explicit voter receipts, monitoring, fallback time, and archival evidence.

## EVM and L2 support

MACI is genuinely EVM-native, not a web service with wallet login. V3 contracts use Solidity `0.8.28`; Groth16 verification and Poseidon/BabyJubJub-oriented state commitments settle in contracts. Poll commitments, message ordering, proof verification, and result publication occur on the selected EVM chain. [v3 contracts](https://github.com/privacy-ethereum/maci/tree/v3.0.0/packages/contracts/contracts) · [v3 circuits](https://github.com/privacy-ethereum/maci/tree/v3.0.0/packages/circuits)

The v3 repository has configurations for Ethereum mainnet/Sepolia and many L2s or sidechains. The documentation lists tests on Optimism, Arbitrum, Base, Gnosis, Polygon, Scroll, Linea, zkSync Era, Polygon zkEVM, and their named testnets, and recommends Optimism, Arbitrum, or Base. However, the page explicitly says those network tests used **MACI v2** and only expects similar v3 results. A chain appearing in configuration or a reusable verifier/factory address appearing in the docs is not evidence of a complete production v3 poll on that chain. [supported networks](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/supported-networks/supported-networks.md) · [Hardhat network configuration](https://github.com/privacy-ethereum/maci/blob/v3.0.0/packages/contracts/hardhat.config.ts) · [reusable deployed contracts](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/supported-networks/deployed-contracts.md)

An L2 adds its own sequencer, data availability, upgrade, reorganization, bridge, and finality assumptions. An EFS manifest must bind a named settlement/finality profile rather than say only “Ethereum.”

## Maturity: how finished is it?

### Released and actively maintained

V3.0.0 is a real release with published packages, current maintainers, contracts, circuits, SDK, coordinator service, relayer, and tests. MACI also has a multi-year protocol history and prior production applications, especially quadratic-funding systems such as clr.fund and Gitcoin's MACI QF work. The official project list and case studies demonstrate meaningful adoption history. They do not establish that those applications used the exact released v3 stack or that MACI has run a high-stakes v3 governance election. [v3 release](https://github.com/privacy-ethereum/maci/releases/tag/v3.0.0) · [official project list](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/src/content/projects.json) · [case studies](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/case-studies.md)

### Assurance evidence, segregated from vulnerability details

This review does not reproduce a vulnerability catalog; it records only the assurance boundary.

The project lists five audit reports from 2021 through the v3 review. The v3 HashCloak report covered:

- `packages/circuits`;
- `packages/contracts`;
- MACI testing files; and
- Excubiae contracts.

The report says all findings were resolved in reviewed follow-up commits. It did **not** provide equivalent coverage for the coordinator service, relayer, SDK, subgraph, voter UI, deployment automation, key-custody procedure, setup ceremony operations, or an entire live election process. The report's cover says 2025, but its baseline and remediation commits are dated January and March 2026; treat that year as a provenance inconsistency to clarify before relying on it. [MACI audit index](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/security/audit.md) · [HashCloak v3 report](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/static/audit_reports/20260317_Hashcloak_audit_report.pdf) · [audit baseline commit](https://github.com/privacy-ethereum/maci/commit/d79aaad297f0721bae2ec7c416dc989442b8d335)

### Trusted-setup readiness needs reconciliation

MACI uses Groth16 and therefore needs exact proving and verifying keys tied to exact circuit parameters. The v3 trusted-setup page says the small-batch ceremony is complete and supports at most:

- 16,384 users;
- message-processing batches of 25;
- tally batches of 32; and
- 125 options.

The same page says the large-batch ceremony has not started. Meanwhile:

- the v3 quick-start says ceremony artifacts work only through v2;
- the v3 testing guide says non-QV and full-credit variants have not undergone a setup;
- production and “large” v3 artifact archives exist in the project's S3 bucket; and
- the tagged v3 download script used invalid production/large URLs, fixed on `main` hours after release without a patch release on the review date.

These may be documentation/release-engineering inconsistencies rather than cryptographic defects, but they prevent an honest blanket statement that every v3 mode and capacity is production-ready. A real deployment must pin the exact circuit, R1CS, WASM/native witness generator, zkey, verifying key, archive hash, ceremony transcript, contribution chain, and on-chain registry value—and obtain clarification about which modes/configurations the completed ceremony covers. [v3 trusted setup](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/security/trusted-setup.md) · [v3 quick-start](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/quick-start.md) · [v3 testing guide](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/guides/testing/testing-introduction.md) · [post-release artifact-URL fix](https://github.com/privacy-ethereum/maci/commit/eaf31fecaf01af187ef2e195097d4f0d882963f7)

### Capacity is not the same as demonstrated throughput

The setup parameters encode capacity for 16,384 users. The public roadmap says technical feasibility for 10,000 concurrent voters was achieved in 2023 and targets 100,000 in 2026, but it also lists whole-stack benchmarking as future R&D. The tagged v3 CI stress fixture uses 100 signups; it is not a public, independently reproducible v3 full-stack 10,000-voter result.

Consequently, this review found no current primary-source package containing a full v3 benchmark at 10,000 or 16,384 voters with:

- client proof times across representative phones and browsers;
- coordinator CPU, memory, storage, and wall time;
- direct and relayed submission load;
- IPFS recovery behavior;
- process/tally proof generation and chain finalization time; and
- total organizer and voter cost.

Treat 16,384 as a configured circuit ceiling for the cited setup, not a demonstrated service-level objective. [MACI roadmap](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/src/pages/roadmap.md) · [v3 stress fixture](https://github.com/privacy-ethereum/maci/blob/v3.0.0/packages/testing/ts/__tests__/stress/stress.full.test.ts)

### Gas and voter flow

The official workflow says a first-time voter performs at least three on-chain transactions: global signup, poll join, and vote. The relayer can make the vote transaction gasless in the happy path, but does not eliminate signup/join or the need for a funded fallback.

The project's gas table gives useful operation-level measurements—for one Polygon zkEVM profile, average figures include about 315,320 gas for signup, 334,837 for joining, 358,725 for direct message publication, 1.58 million for poll deployment, and 7.58 million to add a full set of tally results. Its displayed dollar costs use time-specific gas and ETH-price assumptions and should not be reused as forecasts. [workflow](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/core-concepts/workflow.md) · [official cost tables](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/supported-networks/costs.md)

### The voter-product layer is incomplete

The repository provides building blocks and operator services, but there is no maintained canonical turnkey v3 voter application. The official MACI Platform repository now says it is unmaintained and remains on MACI v2. The Aragon plugin repository was still largely a template and had no evidence of a released production integration in the reviewed primary sources.

This is the largest practical gap for EFS. A secure voter experience needs more than contract calls:

- key generation, backup, recovery, and deletion;
- comprehensible signup/join/vote/finalization states;
- direct-chain fallback;
- accessible mobile and assistive-technology flows;
- independent ballot construction or verification;
- accurate privacy and trust explanations;
- RPC and relayer diversity; and
- robust handling of refreshes, reorgs, dropped transactions, and deadlines.

[MACI Platform repository and maintenance notice](https://github.com/privacy-ethereum/maci-platform) · [MACI Aragon plugin repository](https://github.com/privacy-ethereum/maci-voting-plugin) · [coordinator service](https://github.com/privacy-ethereum/maci/tree/v3.0.0/apps/coordinator)

### Maturity summary

| Layer | Assessment on 2026-07-28 |
|---|---|
| Anti-collusion protocol lineage | Mature research direction with years of iteration |
| V3 contracts/circuits/SDK | Tagged, packaged, active, and specifically audited in important scopes |
| Exact production setup profile | Promising but documentation and artifact provenance need reconciliation |
| Coordinator operations | Packaged service, still a privileged single-key dependency |
| Off-chain relayer | Implemented, but weaker than the signed-promise/challenge proposal and availability-sensitive |
| Maintained v3 voter application | Missing |
| Public v3 large-scale benchmark | Insufficient |
| Production-history evidence | Meaningful for earlier MACI funding rounds; not proof of exact v3 governance readiness |
| High-stakes DAO execution | Prototype/gated-pilot territory |
| Statutory election | Not ready; explicitly future-facing in project docs |

## Is MACI ideologically better for EFS?

### Strong alignment

MACI embodies several Ethereum values better than traditional hosted polling:

- MIT-licensed open implementation;
- EVM-native commitments and verification;
- public encrypted inputs rather than a private ballot database;
- permissionless verification of finalized proofs;
- no owner restriction on submitting valid process/tally proofs;
- direct on-chain submission as the strongest path;
- explicit concern for bribery and collusion rather than only tally integrity; and
- replaceable eligibility policies instead of one hard-coded identity vendor.

### Material mismatch

It conflicts with the strongest EFS “walk away from every privileged operator” aspiration:

- one coordinator sees all plaintext ballots;
- one coordinator key is required to generate processing proofs;
- the coordinator can stop finalization;
- current relaying adds an allowlisted service, database, and IPFS availability path;
- Groth16 setup provenance must be trusted unless independently validated; and
- permanently public ciphertext creates future-decryption exposure if the coordinator key leaks.

Automating the coordinator in an EFS-distributed package changes who launches the software, not the trust model. Storing its private key in EFS would catastrophically convert a secret ballot into a public archive. A TEE would replace human/operator trust with hardware and attestation trust. Threshold MPC or homomorphic-encryption work could improve the model, but coordinator decentralization remains roadmap work rather than a released v3 property. [MACI roadmap, coordinator decentralization](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/src/pages/roadmap.md)

**Ideological verdict:** MACI is highly Ethereum-aligned for **verifiable correctness and online anti-bribery**, but only partially decentralized for **privacy and liveness**. It is better than a hosted black-box poll; it does not meet a “no trusted humans or systems” requirement.

## Suitability by use case

| Use | MACI fit | Recommendation |
|---|---|---|
| Daily harmless folder poll | Poor | Use native signed EFS public records; if membership linkage matters, consider an anonymous-signal primitive |
| Private nonbinding opinion poll | Good experimental fit | Use v3 on a testnet/low-cost EVM domain, with direct messages and explicit coordinator disclosure |
| Funding/allocation round | Strongest proven application family | Still pin exact version, setup, policy, operator, and evidence |
| Consequential EFS community decision | Conditional | Pilot only after independent evidence replay, failure semantics, and coordinator procedure pass |
| DAO governance vote | Plausible | Use a delayed, narrow execution adapter; never treat non-finalization as approval or rejection |
| Folder-moderator election | Plausible experimental use | Appropriate only if the community accepts coordinator trust and a void/rerun outcome |
| Private organizational election | Research/pilot | Needs stronger operations, accessible client, independent verifier, and institutional procedure |
| Binding public election | No | Eligibility, coercion, devices, accessibility, certification, disputes, and current trust model are inadequate |

For an ordinary daily binary poll, MACI's three voter steps, browser proof, coordinator key, proving service, setup artifacts, chain calls, and delayed tally are disproportionate. Use MACI only when secrecy, hidden running results, or resistance to vote buying is valuable enough to justify those costs.

## Exact EFS integration boundary

The names below are proposed profile concepts, not frozen EFS v2 schemas.

### Keep MACI outside the kernel

EFS should not add:

- a MACI-specific kernel record kind;
- coordinator or voter secrets;
- MACI nullifier semantics;
- Groth16 circuit logic;
- a MACI tally rule; or
- a hard-coded EVM chain.

Treat MACI as an application-level backend selected by the general voting profile in [[Reviews/2026-07-28-voting/efs-integration|EFS integration profile for voting backends]].

### Two-stage poll commitment

A single manifest cannot contain both a digest committed during deployment and the deployment addresses/transactions that do not exist until afterward. Use two linked records.

#### `MaciPollIntentV1`

Before deployment, publish a final intent containing:

##### Political/institutional definition

- EFS poll and series identifier;
- purpose class and whether the result is advisory, binding-manual, EVM-executable, or pending a separately adopted EFS authority adapter;
- exact question, option order, option identifiers, supporting content, translations, and accessibility statement;
- open, close, finality, challenge, tie, cancellation, failure, and rerun rules;
- proposer, folder moderators, eligibility authority, coordinator, relayer, result verifier, challenge authority, and executor;
- coordinator trust and privacy notice in ordinary language.

##### Electorate

- eligibility mechanism and issuer;
- source EFS authenticated-set snapshot or external credential commitment;
- snapshot algorithm, authority domain, finalized basis, root, and member count;
- one-person/one-principal/one-address semantics;
- voice-credit/weight rule;
- delegation, recovery, revocation, and duplicate-prevention behavior;
- explicit statement of what uniqueness is **not** proved.

##### Intended MACI profile

- MACI tag, release commit, npm package versions, and build digest;
- target chain ID, settlement domain, RPC-independent finality rule, and L2 assumptions;
- known factory, verifier, verifying-key registry, policy, checker and voice-credit-proxy addresses/code hashes where they already exist;
- start/end, mode, option count, tree depths, batch sizes, permitted relayer policy, and coordinator public key;
- circuit source/R1CS, witness generator/WASM, proving-key, verifying-key, and setup transcript digests;
- exact voter-client and independent-verifier package closures;
- ciphertext retention and coordinator-key destruction policy.

If deterministic deployment is used, the intent may include predicted addresses only together with the complete derivation inputs and test vectors. Otherwise, deployed poll addresses are deliberately absent.

#### `MaciSettlementBindingV1`

After deployment and before voting opens, publish a binding containing:

- the `pollIntentDigest`;
- actual chain ID and backend domain;
- ordered cross-domain basis-vector rules for the EFS electorate/intent, EVM deployment/open/result, EFS import, and any later execution, with the realized electorate/intent/deployment entries available at this stage;
- `MACI`, `Poll`, `MessageProcessor`, `Tally`, verifier, verifying-key registry, factories, policy, checker and voice-credit-proxy addresses;
- deployment transactions, blocks and finalized basis;
- runtime code hashes, proxy implementations and administrative state;
- actual `pollId`, timing, mode, option count, tree depths, batch sizes, relayers and coordinator public key;
- a field-by-field assertion that the deployment conforms to the intent;
- any permitted and approved deviation, or an explicit cancellation when it does not conform; and
- required EFS moderator approvals.

The intent digest and settlement-binding digest together identify the poll. The evidence bundle and every verification receipt must bind both.

### Bind the EFS intent to the EVM poll

Stock `DeployPoll` emits the poll identifier, coordinator key, and mode, but not an EFS poll-intent digest. A web page claiming that an address represents a particular EFS question is therefore only an off-chain assertion.

Use one of:

1. a thin, reviewed `EfsMaciPollRegistry` or factory wrapper that atomically emits
   `pollIntentDigest -> chainId, MACI address, pollId, Poll/MessageProcessor/Tally addresses`; or
2. the post-deployment `MaciSettlementBindingV1` containing the deployment receipt, block, code hashes, full configuration, intent digest, and required moderator approvals.

The atomic wrapper is stronger against substitution and is not circular because it commits only to the already-final intent. It must remain a narrow binding adapter, not fork MACI's cryptography or become an upgradeable election controller.

### Compile EFS membership into a policy

Two initial bridges are feasible:

#### Linkable address bridge

Compile a finalized EFS folder-member snapshot into an Excubiae `MerkleProofPolicy`. The current checker hashes an Ethereum address into each leaf, verifies it against a fixed root, and prevents the same address from enforcing twice.

This is simple and reproducible, but the joining address is public. It proves membership of that address in the compiled snapshot, not one human, and needs explicit rules for EFS controller rotation and duplicate principals. [Excubiae Merkle policy](https://github.com/privacy-ethereum/excubiae/blob/a7640301fcdf805a45a4647bc33045900b31f37d/packages/contracts/contracts/extensions/merkle/MerkleProofPolicy.sol) · [Merkle checker](https://github.com/privacy-ethereum/excubiae/blob/a7640301fcdf805a45a4647bc33045900b31f37d/packages/contracts/contracts/extensions/merkle/MerkleProofChecker.sol)

#### Privacy-oriented group bridge

Compile the same authenticated EFS snapshot into a Semaphore group or credential issuance ceremony, then use Excubiae's Semaphore policy. The current checker binds the proof message to the transaction subject, scopes the nullifier to the group, and prevents reuse.

For meaningful unlinkability, do not reuse the EFS controller address as the joining account. Use a fresh account plus sponsorship/relaying and publish the exact group-construction algorithm. This still does not hide network metadata or make EFS identity a proof of personhood. [Excubiae Semaphore policy](https://github.com/privacy-ethereum/excubiae/blob/a7640301fcdf805a45a4647bc33045900b31f37d/packages/contracts/contracts/extensions/semaphore/SemaphorePolicy.sol) · [Semaphore checker](https://github.com/privacy-ethereum/excubiae/blob/a7640301fcdf805a45a4647bc33045900b31f37d/packages/contracts/contracts/extensions/semaphore/SemaphoreChecker.sol)

Excubiae v0.13.0 was current in the reviewed repository, but its README still calls the framework an MVP with possible breaking changes. Pin it exactly and test the chosen policy rather than depending on the framework name. [Excubiae v0.13.0](https://github.com/privacy-ethereum/excubiae/releases/tag/v0.13.0) · [Excubiae README](https://github.com/privacy-ethereum/excubiae/blob/a7640301fcdf805a45a4647bc33045900b31f37d/README.md)

### `MaciEvidenceBundleV1`

Preserve enough public evidence for a clean-room verifier:

#### Chain closure

- the completed ordered basis vector, with later result/import/execution entries linked as they become final;
- finalized headers and the named finality basis;
- deployment receipts and runtime code;
- signup and poll-join roots required by the proof profile;
- every direct `PublishMessage`, `ChainHashUpdated`, `MergeState`, process-proof, tally-proof, and `ResultAdded` receipt in canonical order;
- final contract storage needed to establish processing and tally completion.

#### Off-chain closure, if the relayer is used

- exact IPFS batch bytes, canonical serialization, full CIDs, and on-chain CID digests;
- ordered message-hash chain;
- mirror retrieval observations with timestamps;
- voter receipt/fallback evidence, if a future profile supplies it;
- an explicit statement that later byte availability does not prove timely availability.

#### Proof and result closure

- all process and tally proofs and public inputs;
- every intermediate and final state/ballot/tally commitment;
- complete result vector, salts, and Merkle paths or the resulting on-chain `ResultAdded` state;
- exact verifier, verifying keys, circuit/setup provenance, and configuration;
- canonical result encoding and digest.

Do **not** preserve in EFS:

- coordinator private keys;
- voter private keys;
- plaintext ballots;
- coordinator decryption logs;
- principal-to-poll-key maps;
- RPC/IP/network logs beyond a deliberately reviewed audit need; or
- credential-recovery material.

Encrypted ballots are already permanent on the chain when submitted directly. EFS should not multiply copies by default without recording the future-decryption risk and retention purpose.

### `MaciVerificationReceiptV1`

An independent verifier should issue a content-addressed receipt binding:

- poll-intent and settlement-binding digests;
- settlement/finality basis;
- exact chain-input closure root;
- exact MACI proof profile;
- contract code and verifying-key hashes;
- proof-chain verification result;
- message-count/hash-chain closure;
- final contract state;
- canonical tally bytes and digest;
- verifier package digest; and
- checks performed, skipped, failed, or unsupported.

The receipt must explicitly mark these as unsupported:

- coordinator honesty or key secrecy;
- coordinator liveness;
- cast as intended;
- one-human-one-vote;
- hidden participation;
- resistance to surveillance, forced abstention, or robust key sale;
- device integrity;
- institutional legitimacy; and
- legal certification.

### Folder-moderator election flow

A bounded EFS use can be:

1. Folder moderators approve the final poll manifest and EVM binding.
2. A finalized EFS member snapshot is compiled into the named eligibility policy.
3. Voters sign up/join and submit encrypted commands directly on-chain.
4. The coordinator processes and tallies after close.
5. Two independent verifiers reproduce the proof chain and result from the exported closure.
6. EFS publishes `VERIFIED`, `FAILED`, `VOID`, or `DISPUTED`; missing coordinator proofs can never become a result.
7. If the outcome changes folder moderators, an ordinary authorized EFS actor applies the exact precommitted membership action after a challenge/cooling-off delay. Automatic application remains out of scope until EFS adopts a generic external-result authority adapter.

The coordinator should not be an election candidate, sole folder administrator, or sole verifier. Social separation does not remove cryptographic trust, but it reduces obvious conflicts of interest.

## Can EFS make MACI entirely decentralized?

No—not released MACI v3.

EFS can decentralize or harden:

- discovery of the poll;
- preservation of the manifest and software;
- mirroring of public artifacts and relayed batches;
- independent verification;
- comparison of signed moderator approvals;
- detection of manifest/address substitution;
- result publication;
- deterministic verification of whether one narrowly precommitted action won; automatic EFS execution still requires an adopted native authority adapter; and
- evidence export after every EFS-operated service disappears.

EFS cannot:

- derive the coordinator secret from public data without destroying privacy;
- make another prover generate the required processing proof after key loss;
- prevent the coordinator from decrypting or leaking ballots;
- make a coordinator finalize;
- prove that a voter device encoded the displayed choice;
- create personhood or civic eligibility; or
- adjudicate disputes about the electorate or the consequence of the vote.

The architectural answer is to make the backend replaceable and declare its trust model. If a future MACI release ships audited threshold/MPC coordination, an EFS profile can bind its committee, threshold, DKG transcript, shares, failover rules, and proofs without changing the kernel.

## MACI versus DAVINCI

| Dimension | MACI v3.0.0 | DAVINCI reviewed 2026-07 |
|---|---|---|
| Main goal | Anti-collusion through hidden key changes/revoting plus proven tally | Purpose-built private voting rollup with recursive state-transition proofs |
| Current privacy authority | One coordinator can decrypt every message | Intended threshold/DKG key-warden design, but reviewed canonical node still held a full key |
| False-result resistance | Released Groth16 message-processing and tally contracts | ZK rollup/state proof architecture in prototype form |
| Direct forced accounting | Voter can post ciphertext directly to the poll contract; valid final proof must account for it | No complete forced-inclusion path in the reviewed prototype |
| Liveness | Coordinator can halt | Sequencer/key-warden liveness; integrated threshold failover remained open |
| Receipt resistance | Key changes and reverse processing | Rerandomization/overwrite design |
| Client ballot-validity proof | No separate cast-as-intended proof; joining proof plus coordinator processing proof | Client ballot-validity proof is part of the intended design |
| Release/audit/setup | Tagged v3, repeated audit history, v3 audit and setup artifacts with documentation gaps | Research/prototype stage; integrated production audit/setup remained open |
| Production history | Earlier MACI funding rounds and applications | No comparable deployed successor history in the reviewed evidence |
| License/integration | MIT core and related tooling, with some application exceptions | Mixed artifact licenses and a less packaged integration surface |

**Near-term choice:** MACI is the better first EFS secret-poll prototype because it is released, packaged, audited in core scopes, EVM-native, and has a direct message path.

**Long-term ideology:** DAVINCI's intended threshold design is closer to EFS's goal of avoiding one ballot-reading coordinator. It becomes the stronger candidate only after threshold/DKG custody, forced inclusion, data availability, audits, setup, independent replay, and production operations are actually integrated and demonstrated.

Neither provides cast-as-intended assurance, personhood, accessible election procedure, or a human-free political institution. See [[Reviews/2026-07-28-voting/vocdoni-davinci|Vocdoni and DAVINCI]].

## Minimum EFS pilot

Run a synthetic, nonbinding binary poll on an EVM testnet or inexpensive deployment domain:

1. Use MACI v3.0.0 QV or another mode only after confirming exact setup coverage.
2. Use at least 100 synthetic EFS members and a frozen, reproducibly compiled eligibility root.
3. Use direct on-chain messages for the baseline.
4. Include revotes, key changes, invalid commands, an ineligible attempt, a dropped transaction, a reorganization simulation, coordinator delay, and coordinator disappearance.
5. Export the complete EFS/MACI evidence bundle.
6. Have two clean-room verifiers reconstruct the chain closure, verify every proof, and agree on the canonical result without the official subgraph, coordinator endpoint, EFS indexer, or hosted frontend.
7. Repeat with the relayer and deliberately lose IPFS bytes, delay publication, and trigger direct fallback.
8. Measure signup/join/vote latency and gas, client proof time on representative devices, coordinator CPU/RAM/time, chain finalization time, artifact size, and recovery work.
9. Test keyboard, screen-reader, mobile, low-bandwidth, translation, refresh, and lost-key flows.
10. Delete every EFS-operated mirror and endpoint, then verify again from exported content and ordinary chain data.

Pass only if:

- the two verifiers agree;
- every manifest-to-contract binding is reproducible;
- missing proof or data becomes `FAILED`/`VOID`, never a guessed result;
- no secret enters the EFS package;
- trust disclosures match observed behavior; and
- a coordinator outage cannot trigger an unintended folder action.

## Questions for the MACI team before a consequential pilot

1. Which exact v3.0.0 modes and parameter tuples are covered by the completed ceremony?
2. What are the canonical transcript, contribution, artifact-hash, and verifying-key records for those tuples?
3. Why do the v3 trusted-setup, quick-start, and testing pages disagree about v3/non-QV/full-credit coverage?
4. Is the “large” v3 archive ceremony-derived, development-only, or otherwise non-production?
5. Will the post-release artifact-URL fix receive a patch release?
6. Is there a public v3 benchmark bundle at 10,000+ voters with hardware, commands, logs, proof times, gas, and failure behavior?
7. Which real election or funding round has used the exact v3 release and setup?
8. What maintained voter application is recommended for v3?
9. Is a signed receipt/challenge protocol planned for the relayer, and what is its specification?
10. What is the recommended coordinator key-custody, backup, compromise, destruction, and disaster-recovery procedure?
11. Can a poll recover or cleanly void if the coordinator key is lost?
12. What coordinator-decentralization design—MPC, FHE, or another approach—is active, and what security/liveness threshold is targeted?
13. Are multiple concurrent polls officially supported? The v3 polls page says yes while the workflow says only one poll may be active.
14. Which v3 components outside circuits/contracts/Excubiae have received independent operational or security review?
15. Is there a normative, independently implemented verifier and canonical election-evidence serialization?
16. What privacy claim is recommended for participation metadata and for ciphertext after coordinator-key compromise?
17. Which eligibility policy is recommended for an externally supplied, privacy-preserving organization snapshot?
18. What exact contract state establishes “fully finalized and results completely published” for an execution adapter?

## Verdict

**Prototype MACI v3 as the first EFS Ethereum-native secret/anti-collusion backend, but do not call it decentralized voting without qualification.**

It is substantially farther along than DAVINCI as deployable software and is more Ethereum-native than ElectionGuard, Belenios, or Decidim. It is also more complex than an ordinary opinion poll needs. Its defining trade is unusually crisp:

- **strong, public, EVM-verifiable tally correctness if it finalizes;**
- **useful resistance to ordinary online vote buying;**
- **one coordinator trusted for ballot secrecy, privileged information, and completion.**

EFS is well suited to expose that trade honestly and preserve the exact evidence. It cannot cryptographically erase it.

## Primary sources

- [MACI canonical repository](https://github.com/privacy-ethereum/maci)
- [MACI v3.0.0 release](https://github.com/privacy-ethereum/maci/releases/tag/v3.0.0)
- [MACI v3 introduction](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/introduction.md)
- [MACI v3 workflow](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/core-concepts/workflow.md)
- [MACI, Poll, MessageProcessor, and Tally contracts](https://github.com/privacy-ethereum/maci/tree/v3.0.0/packages/contracts/contracts)
- [MACI v3 circuits](https://github.com/privacy-ethereum/maci/tree/v3.0.0/packages/circuits)
- [MACI v3 trusted-setup record](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/security/trusted-setup.md)
- [MACI audit index](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/versioned_docs/version-v3.x/security/audit.md)
- [HashCloak MACI v3 report](https://github.com/privacy-ethereum/maci/blob/v3.0.0/apps/website/static/audit_reports/20260317_Hashcloak_audit_report.pdf)
- [Original MACI proposal](https://ethresear.ch/t/minimal-anti-collusion-infrastructure/5413)
- [Mostly-off-chain MACI proposal](https://ethresear.ch/t/maci-with-mostly-off-chain-happy-path/19527)
- [Excubiae v0.13.0](https://github.com/privacy-ethereum/excubiae/releases/tag/v0.13.0)
