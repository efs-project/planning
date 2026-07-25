# Chicago + Vocdoni: verified-resident polling with an EVM/ZK system

**Prepared:** July 24, 2026

**Scope:** near-term unofficial opinion research; long-term official-election research

## At a glance

| | Current position |
|---|---|
| Goal now | Unofficial, nonbinding opinion research in which each participant is verified as a local resident |
| Long-term aspiration | Contribute toward a legally authorized, accessible, independently auditable Chicago election system |
| DAVINCI status | Working EVM/ZK research prototype; not production election infrastructure |
| EFS role | Future content-addressed publication, verification, and evidence sidecar |
| Biggest constraints | Ballot-key custody, audits, voter-device trust, sequencer censorship, data availability, accessibility, and polling methodology |

These are two separate horizons. A successful resident poll could test eligibility operations, usability, privacy, proof verification, and public reporting. It would not by itself establish that the system is ready or legally authorized for an official election.

## What DAVINCI does

DAVINCI is Vocdoni’s newer experimental voting rollup. It settles election proofs and state to Ethereum-compatible networks.

In plain language:

1. An organizer defines the question, eligible credential set, timing, and election rules.
2. A resident’s device encrypts the response and proves that it follows the rules.
3. A **sequencer**—an operator that batches submissions—checks the proof and updates the election state.
4. A compact zero-knowledge proof of that update is submitted to an EVM smart contract.
5. After closing, the intended design uses independent **key wardens** to decrypt only the aggregate result.

Each eligible credential has one census-authenticated state slot. If revoting is allowed, a later valid response replaces the earlier response in that slot rather than adding another vote.

The EVM contract verifies the cryptographic computation. It does not determine who is a Chicago resident, make the voter’s device trustworthy, force a sequencer to include a response, prevent coercion, or make a voluntary sample representative.

## How finished is it?

DAVINCI is a working research prototype.

### What exists

- EVM election-registry and proof-verification contracts;
- prototype deployments on Sepolia and several EVM networks;
- browser-side ballot encryption and proof generation;
- sequencer batching and recursive state-transition proofs;
- EVM settlement of election roots and proofs;
- an evolving specification, SDK, circuits, and a separate DKG implementation/research effort.

### Why it is not production-ready

- The intended distributed-key system is not integrated into the canonical voting node. The reviewed node stores a complete election private key, so its operator must currently be trusted not to inspect individual encrypted responses.
- The contracts describe themselves as work in progress and not for production.
- No independent audit of the complete current system was found.
- Public services were using development circuit artifacts; no production multiparty circuit-specific setup record was found.
- There is no protocol-level, voter-facing check that the client encrypted the choice displayed on screen.
- A mature forced-inclusion or escape path for sequencer censorship was not demonstrated.
- Long-term availability of ballot batches is unresolved. Ethereum blobs are temporary, and some reviewed L2 configurations did not require blob publication.
- Independent sequencers and wardens, city-scale burst testing, and public accessibility evidence were not demonstrated.

The proof and settlement loop is real. The surrounding production trust model is still being built.

## Near-term goal: verified-resident opinion research

A small resident consultation is technically feasible as an experimental pilot, provided it is clearly unofficial and nonbinding and no consequential decision depends solely on it.

Residency verification establishes eligibility and helps prevent duplicate participation. It does **not** make a voluntary participant pool representative of Chicago.

### Use the right public label

| Research goal | Recruitment | Defensible description |
|---|---|---|
| Give interested residents a voice | Open, verified opt-in participation | Verified-resident consultation |
| Explore views in a recruited sample | Deliberate nonprobability or quota recruitment | Findings from the recruited sample, with limitations |
| Estimate opinion in a defined population | Probability-based, multimode sample with weighting and nonresponse analysis | Resident opinion survey with disclosed uncertainty |

An unrestricted opt-in consultation should report:

> Among the verified residents who participated, X% selected…

It should not claim:

> X% of Chicago residents believe…

unless the sampling and analysis actually support a population estimate. A conventional margin of error should never be attached to an unrestricted opt-in poll.

### Define “resident” first

The project can act as the eligibility issuer, but it must publish the rules before enrollment:

- geographic boundary: city, ward, neighborhood, or another defined area;
- age requirement and residency reference date;
- whether citizenship or voter registration matters—normally neither is necessary for resident opinion research;
- treatment of renters, students, unhoused residents, shelter residents, recent movers, and people without conventional documents;
- acceptable evidence and an equitable alternative-attestation path;
- one credential per person, not one per address or household;
- correction, revocation, replacement, and appeal deadlines;
- deletion schedule for source documents and issuance logs.

The cryptographic proof means “this credential was approved under the published policy.” It does not prove residence from first principles.

### Current privacy is pseudonymous, not fully anonymous

A practical first flow would:

1. verify residency off-chain;
2. have the resident’s device generate a fresh, nonfinancial keypair for this poll only;
3. enroll only its public address in a frozen eligible census;
4. privately deliver the census proof while the private key remains on the resident’s device;
5. let the client sign, encrypt, and prove locally without requiring gas or cryptocurrency;
6. give the resident an opaque submission identifier and an inclusion check.

DAVINCI’s available batch data can expose the poll-specific address and participation metadata, although not the resident’s name, home address, or plaintext choice. If the project records which identity received which key, it can link that address back to the resident.

The first pilot should disclose this honestly, restrict the linkage, separate residency verification from voting operations, and delete it on a published schedule. Stronger issuer unlinkability would require blind issuance, a two-party issuance design, or another anonymous-credential layer that DAVINCI has not yet demonstrated as an integrated feature.

Never derive a credential from a name, address, property PIN, email, wallet, or EFS identity. The private key must be random, high-entropy, election-specific, and generated on the resident’s device.

A frozen first-pilot census cannot silently replace a lost key. Recovery should use a resident-controlled encrypted backup. Any mid-poll replacement requires a prepublished revocation/replacement mechanism or an explicitly dynamic census, with duplicate-response behavior tested and disclosed.

### Who must still be trusted?

Residents should be told which role can affect what:

- the **residency verifier/credential issuer** decides eligibility and may know the identity-to-key link;
- the **poll sponsor** chooses the question, rules, timing, and intended use;
- the **client** displays and encrypts the intended response;
- the **sequencer** can delay or omit a submission;
- today’s **key-holding node** can technically decrypt individual responses;
- the **EVM network** supplies settlement availability and finality;
- the **EFS publisher** signs and distributes the public materials;
- independent **observers and verifiers** check the released evidence.

ZK proofs constrain computation. They do not remove these institutional responsibilities.

## What a future EFS integration could solve

EFS v2 is still being designed. If implemented, it could serve as a content-addressed publication and verification sidecar—not as the voting system.

| Problem | Potential EFS contribution | Limit |
|---|---|---|
| Question or software changes silently | Signed, versioned release packages containing the exact question, client, translations, contracts, circuits, and keys | An amendment must create a linked successor release; EFS does not decide whether the amendment is legitimate |
| Verification depends on the voting operator | A separately built verifier, reproducible-build evidence, and exact proof-system identifiers | EFS cannot make a malicious voter device encode the intended choice |
| Public evidence disappears | Replicated manifests, aggregate proofs, results, settlement references, audits, and incident reports | Availability requires an explicit replication and retrieval plan; hashes alone do not preserve bytes |
| Technical evidence lacks human context | Rules, methodology, translations, eligibility policy, operator roles, and limitations can be bound to the same release | EFS does not make the publisher neutral or the sample representative |

The integration should be an ordinary EFS application/adapter plus a separately built verifier and, where useful, a sibling verifier contract. It requires no EFS kernel change, and voting ZK state should never gate EFS admission.

Resident ballots must not become ordinary EFS records signed by resident EFS identities. EFS exposes authorship, timing, and graph metadata and is not an anonymity system. EFS should carry organizer, observer, software, proof, and aggregate-result artifacts—not resident identity mappings or ballot submissions.

Do not place these on EFS:

- residency documents or the eligibility roster;
- identity-to-credential, wallet, address, or EFS-principal mappings;
- credential secrets, device/IP logs, or precise response times;
- individual receipts or plaintext responses;
- per-response ciphertexts by default.

EFS could preserve exact DAVINCI batches for synthetic reconstruction testing. For real residents, permanent ciphertext storage creates future-decryption and metadata risk. Public commitments, aggregate proofs, results, and signed manifests should be durable; ballot-bearing data needs a separate, justified retention policy.

EFS cannot repair data withheld when a batch is accepted, provide forced inclusion, verify residency, operate key wardens, make the poll representative, or turn DAVINCI into an official election system.

## Recommended staged program

### Track A — resident opinion research

1. **Method and governance design.** Define the target population, residency rules, question-review process, recruitment model, privacy, appeals, accessibility, public claims, and operator roles.
2. **Synthetic and load testing.** Exercise proofs, outages, missing data, low-end phones, screen readers, translations, credential recovery, and several times the expected peak submission rate.
3. **Invited usability/privacy pilot.** Test with roughly 50–200 consenting participants. Validate issuance, support, key recovery, role separation, and independent verification.
4. **Open verified-resident consultation.** Expand to roughly 500–5,000 participants in one defined area after the earlier gates pass. Label it opt-in and nonrepresentative.
5. **Representative survey pilot.** Work with a survey-methodology partner on a probability-based, likely address-based and multimode sample. Compare DAVINCI with a conventional survey implementation using randomized mode assignment or another preregistered design.

Alternative participation modes need a documented bridge that prevents duplicate participation, never gives operators the resident’s credential secret, and minimizes staff visibility into responses. Any interviewer-visible mode and potential mode effects must be disclosed. Staffed digital participation should preserve a private response step; paper transcription requires dual control and an auditable procedure. Synthetic or shadow tests may additionally use independent ground truth.

Every public release should identify the sponsor, funders, operators, question authors, eligibility and sampling rules, field dates, intended use, participation counts, exclusions, weighting, incidents, and limitations. Report technical failures and broad geographic coverage only in privacy-safe aggregates, and suppress small cells that could identify residents.

Unless official partners are involved, label the work:

> Unofficial and nonbinding; not affiliated with or administered by the City of Chicago or the Chicago Board of Elections.

### Track B — long-term Chicago election research

A legitimate Chicago election remains a valid long-term aspiration, but it is a separate legal, administrative, and election-assurance program.

Resident-polling pilots can generate useful evidence about credential operations, accessibility, client performance, observer verification, dispute handling, and EFS publication. They cannot establish legal compliance, coercion resistance, representative legitimacy, or suitability for remote binding elections.

Any official path would require:

- partnership with Chicago and Illinois election authorities;
- applicable legal authority, certification, testing, procurement, and records compliance;
- a voter-verifiable paper record and compliant audit/recount procedures under the current Illinois posture;
- independent cryptographic, software, privacy, and accessibility evaluation;
- production key ceremonies and genuinely independent operators;
- recount, dispute, incident-response, and remedy procedures;
- public observation and rigorous usability testing.

DAVINCI and EFS may ultimately fit better as supplementary verification and public-evidence layers than as the sole official ballot-return system. A realistic research progression is:

> synthetic test → invited resident pilot → verified-resident consultation → statistically designed resident survey → supervised civic experiment with conventional ground truth → independently audited institutional research

## Bottom line

Verified-resident consultation is a feasible near-term research goal. Scientifically representative polling is also feasible, but sampling and recruitment—not ZK—will be the hardest parts.

DAVINCI can make credential use, response inclusion, and tally computation more independently verifiable. Today it remains pre-production and publicly pseudonymous rather than fully anonymous. EFS could make the public poll package and aggregate result evidence versioned, reproducible, and independently retrievable. It would not verify residency, anonymize participants, carry ballots, operate the tally, or make a voluntary sample representative.

The best next step is to design the residency and polling methodology first, then run a synthetic test and a 50–200-person invited pilot before attempting a public consultation.

## Primary references

- [DAVINCI protocol specification](https://spec.davinci.vote/)
- [DAVINCI paper and working analysis](https://github.com/vocdoni/davinci-paper)
- [DAVINCI contracts](https://github.com/vocdoni/davinci-contracts)
- [DAVINCI node](https://github.com/vocdoni/davinci-node)
- [AAPOR disclosure standards](https://aapor.org/standards-and-ethics/disclosure-standards/)
- [AAPOR best practices](https://aapor.org/standards-and-ethics/best-practices/)
- [U.S. Election Assistance Commission: end-to-end protocol evaluation](https://www.eac.gov/voting-equipment/end-end-e2e-protocol-evaluation-process)
- [National Academies: election security and Internet voting](https://www.nationalacademies.org/read/25120/chapter/7)
- [Illinois Remote Vote by Mail Task Force final report](https://www.ilga.gov/Documents/Reports/ReportsSubmitted/6317RSGAEmail13939RSGAAttachSRVBM%20Final%20Report-Approved%20August%2020-25.pdf)

This brief describes the reviewed state as of July 24, 2026. It is technical and policy research, not legal advice.
