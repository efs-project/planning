# Chicago + Vocdoni: a practical EVM/ZK voting brief

**Prepared:** July 24, 2026

**Scope:** unofficial, nonbinding opinion polling and civic consultation

## The short version

Vocdoni’s newer system, **DAVINCI**, is an experimental voting rollup that settles election proofs and results to Ethereum-compatible networks.

Voters encrypt their choices and prove that they are eligible and that their ballots follow the election rules. Sequencers batch those encrypted ballots, produce zero-knowledge proofs of the updated election state, and submit the proofs to an EVM smart contract. The intended final system uses a group of independent key wardens to decrypt only the aggregate result.

This is real working software, but it is not finished production infrastructure. Today it is appropriate for:

- synthetic demonstrations;
- private or organizational experiments;
- small, explicitly nonbinding resident consultations; and
- testing EFS as a publication, verification, and archival layer.

It is not ready for a binding Chicago election.

## What “EVM/ZK voting” means here

DAVINCI combines several technologies:

- **EVM contracts** record the election configuration, accepted state transitions, proofs, and final result.
- **Encrypted ballots** keep selections hidden while voting is open.
- **Zero-knowledge proofs** show that ballots and state transitions follow the rules without revealing the selections.
- **Nullifiers and election state** enforce one active vote per credential while allowing configured revoting.
- **Recursive proofs** compress batches of off-chain computation into proofs that an EVM contract can verify.
- **Threshold decryption**, in the intended design, allows independent wardens to decrypt the aggregate result without exposing individual ballots.

The EVM chain verifies the cryptographic computation. It does not decide who is a Chicago resident, make a phone or browser trustworthy, force a sequencer to include every submission, or prevent someone from pressuring a voter at home.

## How finished is DAVINCI?

DAVINCI is best described as a **working research prototype**.

### What exists

- EVM election-registry and verification contracts;
- prototype deployments on Sepolia and several EVM networks;
- browser-side ballot proof generation;
- encrypted ballot submission;
- sequencer batching and recursive state-transition proofs;
- EVM settlement of proofs and election roots;
- an emerging protocol specification, SDK, circuits, and independent DKG research.

### What remains unfinished

- The threshold distributed-key system described by the design is not integrated into the canonical voting node. The reviewed node currently stores a complete election private key.
- The contracts describe themselves as work in progress and not for production.
- No independent security audit of the current complete system was found.
- Public services were using development circuit artifacts; no production multiparty circuit-specific setup record was found.
- The protocol does not yet provide a voter-facing, protocol-level check that the client encrypted the choice displayed on screen.
- A mature forced-inclusion or escape path for sequencer censorship was not demonstrated.
- Long-term availability of ballot batches is unresolved. Ethereum blob data is temporary, and some reviewed L2 configurations did not require blob publication.
- Multiple independent sequencers, integrated independent wardens, city-scale burst testing, and public accessibility evidence were not demonstrated.

The core proof and settlement loop works. The production trust model around it is still being built.

## Notes on using it today

A responsible deployment today should be framed as research or consultation, not as an official election.

Use it only when:

- the result is explicitly nonbinding or has a conventional fallback;
- participants understand the experimental status;
- losing access or experiencing a software failure does not remove a civil right;
- the exact contracts, circuits, client, ballot, and verifying keys are frozen before opening;
- residents do not need cryptocurrency, tokens, gas, or an existing wallet;
- credentials are election-specific and separate from residents’ ordinary identities and wallets;
- there is an accessible conventional participation channel;
- the result, limitations, incidents, and verification material are published;
- personal data, addresses, device information, and network logs are minimized.

Do not describe the current system simply as “anonymous,” “coercion-resistant,” or “trustless.” Each of those properties depends on additional actors and assumptions.

## What EFS could solve

EFS could be valuable as a neutral **publication and audit sidecar**.

Before polling begins, EFS could publish one immutable package containing:

- the exact question and answer choices;
- participation rules and eligibility policy;
- reviewed translations and accessibility material;
- the frozen voting client;
- source commits, dependency manifest, and reproducible-build evidence;
- chain ID, contract addresses, process ID, circuit hashes, and verifying keys;
- the public election key and key-warden configuration; and
- a human-readable explanation of the trust model.

After polling closes, EFS could publish:

- the final state root and aggregate result;
- the result and decryption proofs;
- the EVM settlement transaction and finality basis;
- independent verifier software and verifier output;
- observer reports, incidents, and amendments; and
- an accessibility and participation report.

This would address several real problems:

1. **Mutable election material.** Participants can confirm that the question, client, circuit, and verifier did not silently change.
2. **Independent verification.** A verifier can be packaged separately from the voting client and reproduced by outside observers.
3. **Long-term evidence.** Results, proofs, exact versions, and public audit records can remain available after project servers or temporary Ethereum blobs disappear.
4. **Readable provenance.** Technical evidence, civic rules, translations, and incident history can be tied together in one content-addressed record.

EFS should not become the voter registry, ballot box, sequencer, tally authority, or election-key holder. It also should not permanently store residents’ identities, wallet mappings, IP addresses, individual receipts, or ballot ciphertexts by default.

Permanent ciphertext storage is not automatically a privacy benefit: keys can leak and cryptography can age. For real residents, EFS should normally preserve the public commitments, proofs, and aggregate result while ballot-bearing batch data follows a separate, limited retention policy.

## Feasibility for unofficial resident opinion polling

If residency can be verified, a nonbinding resident consultation is feasible—with important qualifications.

### A privacy-preserving eligibility flow

A residency authority could:

1. verify residency through an existing off-chain process;
2. issue one election-specific credential per eligible resident;
3. commit the eligible credential set as a Merkle root;
4. let residents prove membership without publishing their names or addresses; and
5. provide a correction, revocation, and appeal process for eligibility mistakes.

The public system should never publish a mapping between a resident, home address, credential, Ethereum address, or EFS identity. Residents should not need a reusable financial wallet.

The authority that verifies residency still learns who was approved. Organizational controls, log deletion, separation of duties, and privacy review therefore remain necessary even when the public proof is zero knowledge.

### What the result would mean

An open consultation of verified residents measures:

> the preferences of verified residents who chose and were able to participate.

It is not automatically a statistically representative opinion poll. Voluntary participation can overrepresent residents who are more motivated, technically comfortable, politically engaged, or connected to the organizers.

If the goal is a scientific estimate of public opinion, the project also needs:

- a defensible sampling method;
- outreach and nonresponse analysis;
- demographic and geographic coverage analysis that protects privacy;
- accessible phone, paper, or staffed participation;
- appropriate weighting and published methodology.

Without those elements, call the result a **resident consultation**, not a representative poll of Chicago.

### A sensible first pilot

Start with one neighborhood, ward, membership-defined community, or participatory-budgeting question:

- 500–5,000 eligible participants;
- no legal or financial consequence that cannot be reversed;
- one simple multilingual question;
- election-specific resident credentials;
- a parallel conventional channel or independent ground truth;
- staffed accessibility and credential support;
- an EFS-pinned client and separate verifier;
- no permanent voter list or individual ballot data on EFS;
- a published report on turnout, exclusions, proof failures, device performance, accessibility, privacy, cost, and public understanding.

The success test should not merely be “the smart contract produced a result.” It should be whether residents could participate privately and accessibly, whether outsiders could independently verify the evidence, and whether failures had understandable remedies.

## Bottom line

DAVINCI is technically credible and directionally well matched to Ethereum and EFS, but it is still pre-production. Its strongest near-term Chicago use is an unofficial, carefully bounded resident consultation—not an election.

EFS could materially improve the integrity, reproducibility, and long-term availability of the public election package and result evidence. It cannot solve residency administration, sampling bias, compromised voter devices, coercion, sequencer censorship, or the unfinished threshold-key and audit work.

The recommended next step is a synthetic demonstration followed by a small, opt-in resident consultation only after the client, credentials, privacy model, accessibility plan, and independent verification path have been tested.

## Primary references

- [DAVINCI protocol specification](https://spec.davinci.vote/)
- [DAVINCI paper and working analysis](https://github.com/vocdoni/davinci-paper)
- [DAVINCI contracts](https://github.com/vocdoni/davinci-contracts)
- [Vocdoni’s DAVINCI overview](https://vocdoni.io/)
- [U.S. Election Assistance Commission: end-to-end protocol evaluation](https://www.eac.gov/voting-equipment/end-end-e2e-protocol-evaluation-process)
- [National Academies: election security and Internet voting](https://www.nationalacademies.org/read/25120/chapter/7)

This brief describes the reviewed state as of July 24, 2026. It is technical and policy research, not legal advice.
