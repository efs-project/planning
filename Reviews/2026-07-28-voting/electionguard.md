# ElectionGuard — paper-backed end-to-end election evidence

**Reviewed:** 2026-07-28
**Status:** point-in-time research profile; factual claims use primary project, repository, deployment, and research sources; recommendations are EFS analysis, not an ElectionGuard endorsement
**Scope:** ElectionGuard 2.1 specification, the publicly available implementation family, real deployments, and a bounded EFS v2 integration

#kind/research #status/done #repo/planning #topic/efsv2 #topic/privacy #topic/governance #topic/voting

## Bottom line

ElectionGuard is the strongest comparator in this set for **supervised, paper-backed, end-to-end-verifiable public-election research**. It is not an Ethereum system, a voter registry, a complete election product, or a coercion-resistant Internet-voting protocol.

Its central idea is valuable for EFS: publish a complete election record containing encrypted ballots, validity proofs, challenge openings, an encrypted aggregate, a threshold decryption, and proofs so independent verifiers can reproduce the result. EFS could be a durable, content-addressed publication and anti-equivocation layer for that record. EFS must not claim that anchoring the record supplies eligibility, ballot secrecy, cast-as-intended behavior, availability, or legal certification.

There is an important maturity split:

- **The protocol direction is serious.** ElectionGuard 2.1 is a detailed public specification; its authors published the design and deployment experience at USENIX Security 2024. [ElectionGuard specifications](https://electionguard.vote/spec/) · [USENIX Security paper](https://www.usenix.org/conference/usenixsecurity24/presentation/benaloh)
- **The public implementation family is not one clean 2.1 production release.** The official serialization specification says it matches 2.0, the Python reference implementation still labels itself against specification 0.95 and last released `1.4.0` in 2022, while Core2 calls itself pre-release/not production-ready and last released `v1.91.18.2` in 2023. Development resumed in the Python and Core2 repositories in 2026, but repository activity is not the same as a conformant 2.1 release. [Serialization specification](https://electionguard.vote/spec/Serialization_Spec/) · [Python implementation](https://github.com/Election-Tech-Initiative/electionguard-python) · [Core2 implementation](https://github.com/Election-Tech-Initiative/electionguard-core2)

**EFS verdict:** preserve ElectionGuard as the official-election evidence comparator and build an offline synthetic adapter only after choosing one exact protocol/code profile. Do not make it the daily folder-poll backend.

## Questions used for this review

1. Is this a protocol, SDK, hosted service, or complete election system?
2. What does the cryptography prove, and what remains external?
3. Who can compromise privacy, integrity, availability, or eligibility?
4. Are cast-as-intended, recorded-as-cast, and tallied-as-recorded separately supported?
5. Does a voter obtain a transferable proof of how they voted?
6. What happens if an administrator, guardian, device, verifier, or publication server is malicious or unavailable?
7. Is the intended environment supervised polling, paper-backed voting, or unsupervised Internet voting?
8. Which specification and serialization version does each implementation actually support?
9. Has the system been independently implemented, tested, audited, or used?
10. Can a fresh verifier reconstruct a result without a project-operated endpoint?
11. What exact artifacts could EFS preserve, and what claims would remain unsupported?
12. Could any material verification occur in an EVM contract, or is Ethereum only an anchor?

## What ElectionGuard is

ElectionGuard is an open-source cryptographic SDK intended to be incorporated into existing voting equipment and election procedures. Its preferred role is additive: an ordinary election can retain its paper and administrative process while ElectionGuard produces a parallel, independently verifiable encrypted record and tally. It deliberately separates the cryptographic core from ballot marking, voter registration, user interfaces, legal procedure, and official canvass. [Project overview](https://electionguard.vote/) · [USENIX paper](https://www.usenix.org/system/files/usenixsecurity24-benaloh.pdf)

It is not:

- a blockchain or distributed ledger;
- a permissionless voting network;
- a hosted election service;
- an eligibility or one-person-one-vote system;
- a complete voting machine;
- a replacement for paper evidence or ordinary election administration;
- a general solution to remote public elections.

## Protocol architecture

### 1. Manifest and guardian ceremony

An election manifest identifies the contests, candidates/options, ballot styles, and selection limits. A set of `n` guardians runs a distributed key-generation ceremony and creates a joint ElGamal election public key with a decryption threshold `k`.

Each guardian retains a secret share. The full election secret is not meant to be reconstructed. At least `k` guardians are later required to decrypt the aggregate tally, and guardian records allow the participants to check the key ceremony. Version 2.1 adds distinct key sets and an explicit guardian record that guardians verify. [Structures and processes](https://electionguard.vote/concepts/Structure_and_Processes/) · [2.1 release notes](https://electionguard.vote/spec/)

### 2. Ballot encryption and well-formedness

The voting system supplies a voter’s selections to an ElectionGuard implementation on an encryption device. Each selection is encoded and encrypted with exponential ElGamal. Zero-knowledge proofs establish that the encrypted selections obey the manifest’s vote limits without revealing the choices.

ElectionGuard 2.x also supports range proofs and voting methods whose tally can be represented by bounded additive values. It does not currently support ranked-choice voting as a native homomorphic tally according to the project glossary. [Project glossary](https://electionguard.vote/overview/Glossary/) · [2.0/2.1 specification notes](https://electionguard.vote/spec/)

### 3. Confirmation code and cast-or-challenge

The encrypted ballot produces a confirmation code derived from its encrypted content and election context. Before finalizing, the voter must be able to choose:

- **cast** — retain the encrypted ballot for the tally; or
- **challenge/spoil** — open that ballot, check that it encodes the intended choices, discard it from the tally, and vote again.

A cast ballot cannot subsequently be opened as the voter’s cast-as-intended proof; doing so would reveal the vote. Confidence therefore comes from the possibility that any prepared ballot may be challenged, plus actual challenges and independent verification. The project treats this cast-or-challenge capability as mandatory for an end-to-end-verifiable ElectionGuard deployment. [Creating a verifiable election](https://electionguard.vote/concepts/Verifiability/) · [USENIX paper, §2.8](https://www.usenix.org/system/files/usenixsecurity24-benaloh.pdf)

### 4. Public election record

After voting, the publisher produces an election record containing the election parameters, encryption-device information, encrypted cast ballots, challenged ballots and their openings, tally artifacts, guardian material needed for verification, and the decrypted result. The record is intended for public distribution and must exclude guardian private keys. [Election record format](https://electionguard.vote/develop/Election_Record/)

The specification allows ballot confirmation-code chaining, which makes later deletion or modification in a device’s chain more detectable. Chaining is evidence, not a consensus ledger: the publisher can still withhold a view or show different views unless external observers compare signed commitments.

### 5. Homomorphic tally and threshold decryption

Anyone can multiply corresponding ciphertext selections to form the encrypted aggregate. At least `k` guardians produce partial decryptions. Their contributions are combined to recover the plaintext totals, accompanied by Chaum-Pedersen-style proof material showing that the announced result decrypts the encrypted aggregate correctly. [USENIX paper, tally and verification](https://www.usenix.org/system/files/usenixsecurity24-benaloh.pdf)

## Assurance matrix

| Property | What ElectionGuard provides | Limit or external dependency |
|---|---|---|
| Ballot privacy | Individual cast selections remain ElGamal ciphertexts; the aggregate rather than each ballot is normally decrypted | Requires fewer than the threshold of guardians to collude, secure devices/randomness, and a deployment that does not leak selections through cameras, malware, metadata, or procedure |
| Cast as intended | Cast-or-challenge lets voters open selected prepared ballots and test the encryption behavior | It is challenge-based evidence, not direct opening of the voter’s cast ballot; the host must offer a usable and correctly sequenced challenge |
| Recorded as cast | The voter checks that the expected confirmation code appears in the published record | The voter or watcher must actually check; a hidden or unavailable alternate record remains an availability/equivocation problem |
| Tallied as recorded | Anyone can verify ballot proofs, aggregate included ciphertexts, and verify the decryption proof | Requires complete authentic election-record bytes plus a conformant verifier |
| Eligibility | ElectionGuard can verify ballot count but not who originated each ballot | Voter registration, authentication, poll books, duplicate prevention, and public list/reconciliation are external |
| Coercion/receipt resistance | In a properly supervised in-person deployment, a confirmation code commits to ciphertext and does not reveal the choice | ElectionGuard is not a coercion-resistant remote-voting protocol; it does not protect an unsupervised voter’s device, credentials, or environment |
| Integrity against administrators | Published proofs prevent administrators and even colluding guardians from forging a mathematically inconsistent tally | Administrators can still affect eligibility, availability, election setup, or distribute/withhold views; signed records and independent publication expose rather than prevent equivocation |
| Liveness | Threshold guardians tolerate some unavailable guardians when `k < n` | The election still depends on enough guardians, the administrator workflow, devices, record publication, and ordinary election operations |
| Official legitimacy | Supports evidence that can supplement paper and post-election auditing | Legal authority, certification, accessibility, paper reconciliation, dispute handling, and canvass are outside the SDK |

### Cast-as-intended terminology

ElectionGuard’s paper uses:

- **cast-as-intended** for verifying that selections were properly encoded; and
- **tallied-as-cast** for verifying that recorded encrypted ballots were correctly included and tallied.

For EFS comparison, it is clearer to decompose the second phrase:

1. **recorded-as-cast:** the voter’s confirmation code is present in the canonical record;
2. **tallied-as-recorded:** the record’s accepted ciphertexts produce the announced tally.

That decomposition avoids implying that ElectionGuard itself authenticates ballot origin.

## Trust and ceremony

ElectionGuard reduces trust in the tallying authority, but it does not remove people or trusted systems.

| Actor/system | Residual responsibility |
|---|---|
| Election authority | Correct manifest, ballot styles, official timing, voter eligibility process, equipment configuration, publication, remedies, and certification |
| Guardians | Complete key ceremony; protect secret shares; inspect the election record before decryption; provide enough timely shares |
| Encryption device | Preserve choice privacy, display the intended ballot accurately, use secure randomness, and correctly offer cast/challenge |
| Voter | Review the displayed/paper ballot, decide whether to challenge, preserve the confirmation code, and check inclusion if they want individual evidence |
| Independent watchers | Capture signed record commitments, compare views, preserve bytes, and run independent verification |
| Paper/procedure | Provide resilience against device compromise, denial of service, accessibility failures, and disputes that cryptographic evidence alone cannot resolve |

The authors explicitly identify in-person poll-site voting as the primary intended use. They state that Internet voting creates problems that end-to-end verifiability does not solve and is not suitable for public elections merely because ElectionGuard is present. Their remote House-caucus use was justified as a bounded exception involving a small electorate, managed phones, direct training, and a secondary confirmation channel. [USENIX paper, §§2.9, 3, and 6.3](https://www.usenix.org/system/files/usenixsecurity24-benaloh.pdf)

## Maturity and evidence

### Specification and code status

- **Specification:** version 2.1 is the latest official design specification listed by the project, released in 2024. [Official specifications](https://electionguard.vote/spec/)
- **Serialization:** the published serialization specification says it currently matches ElectionGuard 2.0, not 2.1. [Serialization specification](https://electionguard.vote/spec/Serialization_Spec/)
- **Python:** the repository is a complete reference workflow and saw maintenance commits again in 2026, but its public badge still targets specification 0.95 and its latest tagged release is `1.4.0` from 2022. [Python repository](https://github.com/Election-Tech-Initiative/electionguard-python) · [Python releases](https://github.com/Election-Tech-Initiative/electionguard-python/releases/tag/1.4.0)
- **Core2:** the C++ repository covers the intended 2.x workflow surface, but its own README calls the software pre-release, incomplete, and inappropriate for production. Its latest tagged release remains `v1.91.18.2` from 2023, although maintenance/build work resumed in 2026. [Core2 repository](https://github.com/Election-Tech-Initiative/electionguard-core2) · [Core2 release](https://github.com/Election-Tech-Initiative/electionguard-core2/releases/tag/v1.91.18.2)
- **License:** the project repositories and site identify the SDK as MIT-licensed. [ElectionGuard licensing](https://electionguard.vote/)

**Assessment:** ElectionGuard has a more mature research and deployment record than its current “choose one supported production SDK” story. An EFS adapter must pin an exact code commit, specification, serializer, constants, manifest profile, and verifier rather than saying “ElectionGuard 2.”

### Deployments

The 2024 paper reports use in:

- public U.S. election settings in Wisconsin, California, Idaho, Utah, and Maryland;
- U.S. House Democratic caucus leadership elections;
- civic voting in Neuilly-sur-Seine, France; and
- a private organizational election.

The deployments are not all equivalent:

- In Preston, Idaho in 2022, ElectionGuard-enhanced scanning was optional; the official result was hand-counted and the encrypted tally served as confirmation. MITRE supplied an independent verifier. [Preston deployment](https://electionguard.vote/elections/Preston_Idaho_2022/)
- In College Park, Maryland in 2023, all 1,468 voters’ ballots were encrypted, but the project states that the deployed `1.91.18` was a one-election hybrid and must not be reused. It also documents several verification checks that the frozen implementation could not support. [College Park deployment](https://electionguard.vote/elections/College_Park_Maryland_2023/)

**Assessment:** these are meaningful real-world evidence, especially for integrating cryptography with scanners and independent verifiers. They are not evidence that the current public 2.1 software stack is turnkey or certified for a Chicago election.

### Review and audit evidence

- The cryptographic design and deployment lessons were peer-reviewed at USENIX Security 2024. [USENIX publication](https://www.usenix.org/conference/usenixsecurity24/presentation/benaloh)
- MITRE produced independent verifiers for live deployments, demonstrating clean-room interpretation of deployed profiles. [Preston verifier account](https://electionguard.vote/elections/Preston_Idaho_2022/) · [MITRE requirements for 1.91](https://www.electionguard.vote/images/MITRE-EG-CP-requirements.pdf)
- Microsoft launched an ElectionGuard bug-bounty program and reported that NCC Group tested the early code before the 2020 Wisconsin pilot. [Microsoft pilot report](https://blogs.microsoft.com/on-the-issues/2020/02/17/wisconsin-electionguard-polls/) · [Bounty announcement](https://www.microsoft.com/en-us/msrc/blog/2019/10/introducing-the-electionguard-bounty-program)

**Assessment:** this is stronger assurance evidence than ordinary open-source activity, but it is not a published comprehensive audit or certification of one current, feature-complete 2.1 production implementation. EFS should ask that question explicitly before consequential use.

## Opinion-poll and election fit

| Use | Fit | Why |
|---|---|---|
| Daily “hotdog or hamburger” poll | Poor | Guardian ceremonies, ballot challenges, election-record publication, and independent verification are disproportionate |
| Occasional private organizational secret poll | Plausible but operationally heavy | The House caucus demonstrates a bounded remote pattern, but it depended on managed devices and custom operations |
| Supervised civic preference exercise | Good research fit | Can pair paper or supervised devices with confirmation codes and a public audit record |
| Binding public election | Research/pilot layer, not turnkey answer | This is the project’s intended domain, but certification, exact implementation readiness, paper/process integration, accessibility, and law remain unresolved |
| Unsupervised public Internet election | Poor | The project authors explicitly reject the inference that E2E verifiability alone makes remote public voting suitable |

## Ethereum alignment

### Technical alignment: low

ElectionGuard does not use Ethereum, an L2, smart contracts, accounts, tokens, or EVM settlement. Its finite-field ElGamal operations and proofs are not designed for economical Solidity verification. Publishing a record root on Ethereum is straightforward; replaying the full ElectionGuard verifier inside the EVM is not a credible default.

### Ideological alignment: partial

It aligns with EFS through:

- public specifications and permissive open source;
- portable public evidence;
- independent verifiers rather than one official software oracle;
- distributed decryption authority;
- explicit separation between evidence and external administrative authority.

It diverges from a permissionless Ethereum ideology through:

- institutionally configured elections and manifests;
- named guardians and administrators;
- externally controlled eligibility;
- supervised equipment and paper as the preferred deployment;
- no permissionless state-transition or censorship-resistance mechanism.

That is not a defect. It reflects a political-science lesson important to EFS: public elections require accountable institutions and contestable procedures, not merely decentralized computation.

## Exact EFS integration boundary

### EFS can do

EFS can serve as a durable election-evidence sidecar:

1. Publish an immutable election descriptor binding:
   - ElectionGuard specification and serialization versions;
   - exact implementation and verifier commits/packages;
   - manifest bytes and translations;
   - guardian roster, quorum, ceremony record, and public keys;
   - election authority, device/profile identifiers, and timing policy;
   - EFS authority domain and finality basis.
2. Preserve content-addressed election-record bytes:
   - encrypted submitted ballots;
   - challenge/spoil openings;
   - ballot-chain and device commitments;
   - encrypted aggregate;
   - partial/final decryption artifacts;
   - announced tally and proofs.
3. Publish periodic signed high-water commitments while voting is open, making later deletion or split-view publication detectable when independent watchers compare checkpoints.
4. Pin several independent verifier packages and their reproducible closures.
5. Publish a verification receipt binding:
   - exact input closure root;
   - verifier package;
   - output tally bytes;
   - checks performed, skipped, or unsupported;
   - EFS and election finality bases.
6. Mirror the closure across independent content stores and test endpoint-free reconstruction.

### EFS cannot do merely by storing the record

EFS does not thereby:

- decide or prove who is an eligible voter;
- stop duplicate voters unless the external admission system does so;
- make a compromised encryption device preserve choice privacy or intent;
- cause voters to challenge or check confirmation codes;
- protect an unsupervised voter from coercion;
- make guardians available;
- guarantee that omitted ballots were ever submitted;
- create paper evidence or reconcile it;
- certify equipment, satisfy election law, or conduct a canvass;
- turn ElectionGuard’s proofs into EVM-native execution authority.

### Optional EFS membership bridge

For a synthetic organizational experiment, an EFS authenticated-set snapshot could supply an eligibility input to an external credential/poll-book service. The bridge must bind:

- the EFS member set and finalized basis;
- the ElectionGuard election identifier and manifest;
- the external authentication/admission rule;
- the number of admitted ballots and any public participation list;
- a privacy rule that prevents publishing principal-to-ballot links.

ElectionGuard itself will still not prove ballot origin. Calling an EFS root “ElectionGuard eligibility” would overstate the protocol.

## Minimum EFS experiment

Run a 100-voter synthetic, supervised election:

1. Freeze one exact ElectionGuard profile and two independent verifiers.
2. Generate a manifest, a `2-of-3` guardian ceremony, and an EFS election descriptor.
3. Exercise casts, challenges, undervotes, malformed ballots, one missing guardian, one late artifact, and two attempted publisher views.
4. Post signed record checkpoints during voting and the full closure after tally.
5. Verify the result independently from only EFS-resolved bytes and ordinary chain state.
6. Disable every ElectionGuard/EFS-project endpoint and repeat with a fresh verifier implementation.
7. Compare:
   - exact record bytes and closure root;
   - confirmation-code inclusion;
   - checks performed by each verifier;
   - result bytes;
   - unsupported eligibility, device, paper, privacy, and coercion claims.

Pass only if both verifiers agree and the report does not silently upgrade cryptographic tally correctness into election legitimacy.

## Questions to ask before any integration

1. Which public implementation is the supported implementation of specification 2.1?
2. Which serializer and sample vectors are normative for 2.1?
3. Is there a current feature-complete release rather than a repository commit?
4. Which independent verifiers support that exact profile?
5. Which components have been independently audited since the 2.1 changes?
6. Which deployment profile is recommended for a remote organizational poll, if any?
7. How are election-record completeness and publisher equivocation handled operationally?
8. How are encrypted ballots and metadata retained without degrading long-term privacy?
9. What voter-list artifact supports eligibility reconciliation without linking voters to ciphertexts?
10. What procedure applies when the encrypted record, paper result, and official canvass disagree?
11. What accessibility studies and certified-device integrations exist for the intended profile?
12. Can the project publish a single signed conformance matrix mapping specification, serialization, core library, verifier, and deployed election profiles?

## Verdict

**Keep and prototype as an evidence adapter, not a folder-poll dependency.**

ElectionGuard is the best system in this comparison for teaching EFS what a serious election evidence closure should contain. It is also a useful warning against equating “cryptographically verifiable tally” with “decentralized election.” The most valuable EFS contribution is durable, non-equivocating, independently replayable publication—not transplanting ElectionGuard cryptography into the kernel or Solidity.

## Primary sources

- [ElectionGuard official specifications and release notes](https://electionguard.vote/spec/)
- [ElectionGuard serialization specification](https://electionguard.vote/spec/Serialization_Spec/)
- [ElectionGuard: a Cryptographic Toolkit to Enable Verifiable Elections, USENIX Security 2024](https://www.usenix.org/conference/usenixsecurity24/presentation/benaloh)
- [ElectionGuard structures and processes](https://electionguard.vote/concepts/Structure_and_Processes/)
- [ElectionGuard verifiability requirements](https://electionguard.vote/concepts/Verifiability/)
- [ElectionGuard public election-record format](https://electionguard.vote/develop/Election_Record/)
- [ElectionGuard Python reference implementation](https://github.com/Election-Tech-Initiative/electionguard-python)
- [ElectionGuard Core2](https://github.com/Election-Tech-Initiative/electionguard-core2)
- [Preston, Idaho 2022 deployment](https://electionguard.vote/elections/Preston_Idaho_2022/)
- [College Park, Maryland 2023 deployment and limitations](https://electionguard.vote/elections/College_Park_Maryland_2023/)
- [Microsoft report on the NCC Group test and first pilot](https://blogs.microsoft.com/on-the-issues/2020/02/17/wisconsin-electionguard-polls/)
