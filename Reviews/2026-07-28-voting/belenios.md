# Belenios — mature verifiable organizational voting

**Reviewed:** 2026-07-28
**Status:** point-in-time research profile; factual claims use Belenios/VCAST, Inria, repository, specification, and project-authored research sources; EFS recommendations are analysis
**Scope:** Belenios 3.3.0, its standard and non-homomorphic election modes, operational trust, current limitations, and a bounded EFS v2 integration

#kind/research #status/done #repo/planning #topic/efsv2 #topic/privacy #topic/governance #topic/voting

## Bottom line

Belenios is the most mature **ready-to-run cryptographic organizational voting system** among these non-Ethereum comparators. It combines:

- client-side encrypted ballots;
- per-voter private credentials that sign ballots;
- a public ballot box and tracking numbers;
- homomorphic tallying for ordinary questions;
- shuffle/decrypt workflows for supported ranked or scored questions;
- distributed or threshold decryption trustees;
- public verification tools and a detailed protocol specification.

It is not Ethereum-native, coercion-resistant, or safe against a compromised voter device. Its own maintainers advise that it should not be equated with high-stakes on-site paper voting. [Belenios FAQ](https://www.belenios.net/faq.html)

Belenios is a better immediate secret-ballot experiment for EFS than ElectionGuard because it is a complete Internet-voting application with extensive organizational use. ElectionGuard remains the better official paper-backed research direction. MACI and DAVINCI remain better tests of Ethereum-native settlement and different trust models.

**EFS verdict:** run one synthetic Belenios election as the non-EVM secret-ballot baseline. Integrate by preserving and independently monitoring a complete Belenios election archive—not by moving Belenios credentials, ballot admission, trustees, or tally logic into the EFS kernel.

## Questions used for this review

1. What election types does Belenios actually implement?
2. Which artifacts are encrypted, signed, shuffled, aggregated, or decrypted?
3. Who issues eligibility credentials, and can that authority stuff ballots?
4. Who can decrypt votes, block a tally, or correlate voters and ballots?
5. Does the voter verify cast-as-intended, recorded-as-cast, and tallied-as-recorded?
6. Does revoting provide genuine coercion resistance or only mitigation?
7. Can the server omit, replace, or equivocate about ballots without detection?
8. What must an auditor observe during voting rather than only after tally?
9. Which code and protocol versions are current?
10. What formal proofs, evaluation, deployments, and operational history exist?
11. What private artifacts must never be made durable in EFS?
12. Can EFS improve availability and anti-equivocation without misrepresenting Belenios’s trust model?

## What Belenios is

Belenios is an AGPLv3 web application and command-line tool derived from the Helios family of verifiable voting protocols. It supplies substantially more of the election lifecycle than a cryptographic library:

- election setup and administration;
- voter lists and authentication integration;
- private voting-credential generation and distribution;
- an in-browser voting booth;
- a public ballot box;
- trustee key generation and decryption interfaces;
- tallying, election archives, an API, and audit tooling.

The current project is maintained by VCAST, a company co-founded by long-time Belenios developer Stéphane Glondu. The academic public platform continues separately. Version `3.3.0` was released on 2026-07-02. [Current project home and release notice](https://www.belenios.net/) · [3.3.0 changelog](https://gitlab.com/vcast.vote/belenios/-/blob/3.3.0/CHANGES.md)

It is not:

- a blockchain or consensus protocol;
- an EVM or smart-contract system;
- a self-sovereign identity system;
- a protocol that eliminates election administrators;
- a coercion-resistant remote voting system;
- a legal certification or paper audit.

## Roles and ceremony

At maximum separation, a Belenios election has five roles:

1. **Election administrator** — defines the election, voter list, timing, questions, and workflow.
2. **Credential authority** — generates one private voting credential per eligible voter, sends private credentials to voters, and publishes the corresponding public credentials.
3. **Voting server** — authenticates voters, verifies ballot credentials and proofs, enforces last-ballot semantics, and publishes accepted encrypted ballots.
4. **Decryption trustees** — generate the election key material and later shuffle/decrypt or partially decrypt the tally.
5. **Auditor(s)** — continuously capture and verify the public election state, ballot-box evolution, active web code, and final tally evidence.

The project recommends separating these roles. Its simplest deployment allows the server to perform credential-authority and trustee work, but that substantially weakens ballot-stuffing and privacy guarantees. [Belenios source README](https://gitlab.com/vcast.vote/belenios/-/blob/3.3.0/README.md) · [Participant instructions](https://www.belenios.net/instructions.html)

### Important political fact

Belenios distributes technical powers, but the administrator and election committee still define the electorate and question. Cryptography can show that ballots correspond to the configured public credentials and that the tally corresponds to the published ballots. It cannot establish that the initial voter list is politically legitimate.

## Protocol architecture

### 1. Election definition and credentials

The administrator supplies the election definition and voter list. The credential authority generates a secret credential for each voter and a corresponding public credential. The private credential signs the encrypted ballot; the public credential lets the server and auditors reject ballot stuffing by parties that do not possess an eligible credential.

For the stronger profile:

- credential generation happens outside the voting server;
- the credential authority checks and preserves the voter-list/public-credential fingerprints;
- private credentials are delivered separately from ordinary authentication;
- the credential-to-voter correspondence is destroyed after validation because retaining it can damage long-term ballot privacy.

[Belenios setup guidance](https://www.belenios.net/setup.html) · [Participant instructions](https://www.belenios.net/instructions.html)

### 2. Client-side encryption and ballot validity

The browser encrypts the voter’s choice using the election public key. The ballot includes:

- ciphertexts;
- zero-knowledge proofs that the choices satisfy the configured selection rules; and
- a signature derived from the voter’s private credential.

The server validates the proof and credential before publishing the ballot. The voter receives a “smart ballot tracker,” a hash/fingerprint of the ballot. [How Belenios works](https://www.belenios.net/howitworks.html) · [Belenios protocol specification](https://vote.vcast.vote/specification.pdf)

### 3. Recorded-as-cast and revoting

The voter checks that the tracker for their last ballot appears in the public ballot box. A voter may vote repeatedly; only the final accepted ballot associated with the credential remains effective.

Revoting provides moderate protection if a voter can later vote privately, but it is not coercion resistance:

- a coercer can demand the credential or authentication material;
- a coercer can use a modified booth that reveals encryption randomness;
- a compromised device can alter or disclose the vote.

The project’s FAQ states these limits directly. [Belenios FAQ](https://www.belenios.net/faq.html)

### 4. Ordinary homomorphic tally

For standard questions, Belenios uses ElGamal’s additive homomorphism:

- each ballot remains encrypted;
- corresponding ciphertexts are aggregated;
- trustees decrypt only the aggregate;
- proofs show that the announced totals are the correct decryption.

Individual ballots are not opened in the normal tally. [How Belenios works](https://www.belenios.net/howitworks.html)

### 5. Ranked/scored and other non-homomorphic questions

For supported complex methods such as Condorcet, STV, and majority judgment, Belenios cannot obtain the result from a simple additive aggregate. It instead uses verifiable shuffles/re-randomization, then decrypts individual plaintext ballots after breaking their association with their original ciphertext position.

This increases ceremony and changes the privacy analysis: privacy relies on the shuffle trustees and on preserving the voter/ciphertext separation. The project still labels ranked/scored mode experimental in its current FAQ. [Belenios FAQ](https://www.belenios.net/faq.html) · [Protocol specification, tally procedure](https://vote.vcast.vote/specification.pdf)

### 6. Event chain and election archive

Belenios 2.0 introduced an election-event format in which events such as ballot submissions are hash-chained. Version 3.1 added an optional sealing concept and displays the final event hash. Version 3.3.0 provides a complete archive ZIP for tallied elections and an archive API endpoint. [Belenios changelog](https://gitlab.com/vcast.vote/belenios/-/blob/3.3.0/CHANGES.md)

These features make Belenios unusually compatible with an EFS evidence sidecar:

- the event chain provides ordered local evidence;
- EFS can timestamp and preserve independent checkpoints;
- the final archive can be content-addressed and replayed;
- neither mechanism alone proves that the server showed every observer the same live view.

## Assurance matrix

| Property | What Belenios provides | Limit or external dependency |
|---|---|---|
| Eligibility/ballot stuffing | Every accepted ballot must verify under one configured public credential | Legitimacy and correct delivery of the credential set remain with the voter-list and credential authorities; a server plus credential authority can undermine the boundary |
| Ballot privacy | Client-side ElGamal encryption; ordinary mode decrypts only the aggregate; trustees can distribute decryption authority | Simplest server-held-key mode lets the server compromise privacy; browser/device and metadata remain trusted; enough trustees can collude |
| Cast as intended | Baseline public release does not protect against a malicious/compromised voter device | Separate Belenios cast-as-intended research exists, but the official FAQ still identifies device corruption as a current limitation; do not treat research variants as released 3.3 behavior |
| Recorded as cast | Voter checks that the last smart ballot tracker appears in the public ballot box | Requires an actual voter/watcher check; a later-only archive cannot prove that a temporarily omitted ballot was visible during voting |
| Tallied as recorded | Anyone can verify ballot validity, public credentials, shuffle/decryption evidence, and announced result | Requires complete authentic archive bytes and a trustworthy verifier implementation |
| Server equivocation | Continuous auditors can compare ballot-box evolution and event hashes | At least one honest, timely observer must preserve a view; the server is not a consensus network |
| Coercion resistance | Revoting is a moderate practical mitigation | Credential surrender, coerced randomness disclosure, device compromise, and forced abstention remain |
| Liveness | Threshold trustee mode can tolerate missing trustees below the threshold | Too few available trustees or missing key material prevents tallying; the server can deny service |
| Long-term privacy | Credential/voter linkage can be destroyed and individual ordinary ballots remain encrypted | Archiving ciphertext forever creates future cryptanalytic exposure; storing the private linkage would make that worse |

## What the three verifiability phrases mean here

### Cast as intended

**Not guaranteed by the standard released booth.** The voter’s browser constructs the encrypted ballot. If that browser is malicious, the tracker may faithfully identify a ballot that encodes the wrong choice.

The Belenios research program has published cast-as-intended variants and user-interface work, but the current product FAQ still lists compromised devices as an unsolved limitation. [Belenios research index](https://www.belenios.net/documentation.html) · [Belenios FAQ](https://www.belenios.net/faq.html)

### Recorded as cast

**Supported if the voter or an auditor checks in time.** The voter compares their smart ballot tracker with the public ballot box. With revoting, only the tracker for the final ballot should remain.

### Tallied as recorded

**Strongly supported for the published archive.** An auditor verifies credential signatures, ballot proofs, event consistency, homomorphic aggregation or shuffles, trustee decryptions, and the final result.

The qualification “for the published archive” matters. Continuous monitoring is what converts a final internally consistent archive into stronger evidence that accepted ballots were not silently removed during the election.

## Trust profile

For a serious organizational election, the minimum defensible profile is:

- an externally validated voter list;
- an external credential authority;
- at least two external trustees, preferably a threshold set such as `2-of-3` or `3-of-5`;
- at least one independent auditor monitoring throughout setup, voting, and tally;
- an independently built verifier or reproducibly pinned official verifier;
- independent preservation of the live commitments and final archive;
- an explicit recovery/cancellation procedure if keys are lost or the archive diverges.

This is not “no trusted humans.” It is **separated, observable, and partially thresholded human authority**.

## Maturity, releases, and use

### Current software

- **Current release:** `3.3.0`, 2026-07-02. [Release announcement](https://www.belenios.net/) · [Changelog](https://gitlab.com/vcast.vote/belenios/-/blob/3.3.0/CHANGES.md)
- **Recent activity:** the public repository continued receiving work in July 2026; releases `3.2.0` and `3.3.0` landed in April and July 2026.
- **Implementation:** OCaml server/tooling plus browser code, REST/integration APIs, an election archive API, and self-hosting instructions. [Installation instructions](https://gitlab.com/vcast.vote/belenios/-/blob/3.3.0/INSTALL.md)
- **License:** GNU AGPLv3 with the project’s stated OpenSSL exception. [Belenios source](https://gitlab.com/vcast.vote/belenios/-/blob/3.3.0/COPYING)
- **Sustainability:** VCAST took over commercial development/maintenance in late 2024 while retaining the open-source protocol and an independent academic platform. [Belenios project home](https://www.belenios.net/)

### Operational use

Inria’s 2025 activity report says the public platform ran about:

- 1,500 elections;
- 200,000 registered voters; and
- 60,000 counted ballots

during 2025. Earlier reports identify recurring use by CNRS, Inria, universities, scientific organizations, associations, unions, sports organizations, and companies. [Inria 2025 activity report](https://radar.inria.fr/report/2025/pesto/index.html) · [Inria Belenios/VCAST account](https://www.inria.fr/en/vcast-vote-security-confidentiality)

**Assessment:** this is a much deeper operational record for remote organizational elections than the Ethereum-native candidates presently have.

### Research, formal analysis, and certification

Belenios has:

- a detailed protocol/format specification suitable for independent verifier construction;
- machine-checked research on privacy and verifiability;
- research on eligibility, device compromise, verifiability, and cast-as-intended variants;
- a public security analysis against French CNIL requirements.

[Belenios research documentation](https://www.belenios.net/documentation.html)

The CSPN evaluation is easy to misstate:

- Quarkslab evaluated Belenios `1.19` in a process coordinated with ANSSI.
- The initial cryptographic evaluation found the primitives and handling satisfactory after two conformance hardenings.
- The evaluation scope was expanded to include more of the web/server system.
- That expansion precluded certification in the campaign; the team states that the CSPN effort was unsuccessful.

[Belenios certification-campaign paper](https://www.sstic.org/media/SSTIC2024/SSTIC-actes/belenios_the_certification_campaign/SSTIC2024-Article-belenios_the_certification_campaign-bossuat_brocas_kovacs_gaudry_glondu_cortier.pdf) · [Current Belenios release history](https://www.belenios.net/)

**Assessment:** “formally studied and externally evaluated” is supported. “ANSSI-certified” is false. The evaluated `1.19` code is also not the current `3.3.0` release.

## Opinion-poll and election fit

| Use | Fit | Why |
|---|---|---|
| Daily casual folder poll | Usually excessive | Credential distribution, trustees, monitoring, and archive verification cost more than the decision warrants |
| Occasional secret-choice folder/organization poll | Strong | This is close to Belenios’s mature operating domain if an external credential authority and trustees are used; participation and server metadata are not necessarily anonymous |
| Board, union, university, association election | Strong with process design | Extensive real use, voter eligibility, revoting, secret aggregate, and verifiable tally |
| Participatory preference using ranked/scored methods | Plausible but treat as experimental | Supported through shuffle/decrypt modes with a more complex ceremony |
| High-stakes public remote election | Poor without a much broader system | The maintainers explicitly identify coercion and compromised-device limits and decline to equate it with on-site paper voting |
| Paper-backed official election | Less natural than ElectionGuard | Belenios is Internet-first; ElectionGuard is designed to augment scanners, paper, and post-election auditing |

## Ethereum alignment

### Technical alignment: very low

Belenios has no:

- Ethereum accounts or wallet-signature workflow;
- Solidity verifier;
- EVM state machine;
- L1/L2 settlement;
- smart-contract tally or execution gate;
- native content-addressed Ethereum evidence publication.

Its cryptographic groups, ElGamal ciphertexts, proofs, shuffles, and threshold ceremonies are implemented for off-chain verification. EFS could put commitments and archive references on an EVM chain, but it should not attempt to reproduce the complete Belenios verifier in Solidity as the default architecture.

### Ideological alignment: moderate to strong

Belenios aligns with EFS through:

- AGPL network-software freedom;
- self-hosting;
- public protocol and evidence;
- independent auditors;
- distributed decryption roles;
- explicit acknowledgement of residual trust;
- long-lived academic research and practical institutional use.

It differs from Ethereum culture through:

- administrator-created elections;
- private credential delivery;
- centralized online ballot admission;
- no permissionless censorship resistance or on-chain composability.

For organizational democracy, its explicit institutions may be more honest than pretending that a token address is a voter or that a chain removes governance.

## Exact EFS integration boundary

### EFS can preserve and bind

An EFS Belenios closure should include:

1. **Election descriptor**
   - exact Belenios version, source commit, build/package closure, specification, and cryptographic group;
   - election UUID, questions, answer encodings, weights, timing, revote rule, and tally method;
   - administrator, credential-authority, trustee, auditor, and publication-role identifiers;
   - EFS authority domain and finality profile.
2. **Eligibility evidence**
   - voter-list count and fingerprint;
   - public-credential set and fingerprint;
   - the source membership policy and frozen EFS set root, if EFS supplies the source roster;
   - never the private credential list or voter-to-public-credential linkage in a public closure.
3. **Key ceremony**
   - trustee public keys, threshold, signed setup artifacts, and verification fingerprints;
   - no trustee secret keys.
4. **Live monitoring**
   - periodic event-chain/high-water commitments;
   - signed observations from independent auditors;
   - explicit gaps rather than reconstructed claims of continuous observation.
5. **Final archive**
   - encrypted ballots;
   - public credentials;
   - event sequence/final event hash;
   - encrypted aggregate or shuffle sequence;
   - trustee partial decryptions and proofs;
   - result bytes and election summary.
6. **Verifier closure**
   - exact verifier program/package;
   - canonical input archive hash;
   - checks and exclusions;
   - deterministic output;
   - verification receipt signed or authored under a scoped EFS actor.

### EFS can improve

- Durable availability of the final election evidence.
- Earlier detection of server equivocation when several watchers publish EFS checkpoints.
- Reproducible package/version binding.
- Independent re-verification after the original Belenios instance disappears.
- Explicit authority provenance for organizers, trustees, auditors, and result publishers.
- A common authenticated-set snapshot feeding several voting backends.

### EFS cannot replace

- credential issuance and secure private delivery;
- voter authentication;
- the in-browser encryption booth;
- Belenios ballot validation and last-vote state;
- trustee DKG, shuffle, or decryption;
- timely availability of the voting server;
- coercion resistance or a trustworthy voter device;
- an official voter registry, dispute body, or legal decision.

### Privacy prohibition

Do not publish to permanent EFS storage:

- private voting credentials;
- authentication secrets or one-time links;
- trustee private keys;
- the credential-to-voter correspondence;
- server logs or network metadata that could link a voter to a ballot;
- plaintext individual ballots from ordinary secret elections.

Belenios explicitly instructs the credential authority to destroy the private mapping after validation because it can threaten long-term privacy if ciphertext security weakens. [Belenios participant instructions](https://www.belenios.net/instructions.html)

## Minimum EFS experiment

Run the same synthetic election used for the native EFS and DAVINCI/MACI comparison:

1. Freeze 100 synthetic eligible principals in EFS.
2. Derive a Belenios voter-list fingerprint from that snapshot without publishing personal identifiers.
3. Use an external credential authority and a `2-of-3` trustee threshold.
4. Cast ordinary selections plus revotes, abstentions, one malformed ballot, one omitted live view, and one unavailable trustee.
5. Have two independent auditors checkpoint the event chain into EFS during voting.
6. Export and pin the final archive and exact verifier package.
7. Shut down the Belenios server and require a clean machine to reproduce:
   - archive validity;
   - final event hash;
   - accepted tracker set;
   - tally;
   - result closure root.
8. Record which claims cannot be recovered after the fact:
   - cast-as-intended;
   - timely voter observation;
   - legitimate roster construction;
   - credential delivery;
   - lack of coercion;
   - lack of device compromise.

## Questions to ask Belenios/VCAST

1. Is the 3.3.0 protocol serialization fully described by the currently linked specification?
2. Is there an independently maintained verifier for the complete 3.3.0 archive?
3. Which exact released modes have machine-checked privacy/verifiability results?
4. Is the cast-as-intended research interface planned for a production release?
5. What live-monitoring frequency and checkpoint procedure does VCAST recommend?
6. Can several auditors safely publish signed high-watermarks without exposing voter/ballot linkage?
7. What is the precise privacy effect of permanently retaining all encrypted ballots and shuffle data?
8. Which artifacts are required to reproduce ranked/scored tallies offline?
9. How does the new external credential-authority protocol bind its output to the voter list and election UUID?
10. Can EFS stable-principal membership be used as a source roster without using Ethereum wallet signatures as ballot credentials?
11. What is the supported archival migration story, given that 3.3 no longer supports election data before 3.1?
12. Is another full product evaluation planned after the unsuccessful `1.19` CSPN campaign?

## Verdict

**Use Belenios as EFS’s mature off-chain secret-ballot baseline.**

It is a good fit for occasional organizational opinion polling and internal elections when privacy matters enough to justify credential and trustee ceremony. It is not a good default for a daily trivial poll, and it is not a shortcut to high-stakes civic Internet voting.

The integration should be deliberately asymmetric:

- Belenios runs the secret-ballot election.
- EFS binds authority, snapshots, live observations, exact software, and the final replay closure.
- Neither system is allowed to claim the other proved eligibility legitimacy, device integrity, coercion resistance, or legal validity.

## Primary sources

- [Belenios current project and 3.3.0 release](https://www.belenios.net/)
- [Belenios 3.3.0 changelog](https://gitlab.com/vcast.vote/belenios/-/blob/3.3.0/CHANGES.md)
- [Belenios protocol specification](https://vote.vcast.vote/specification.pdf)
- [Belenios source README and role model](https://gitlab.com/vcast.vote/belenios/-/blob/3.3.0/README.md)
- [How Belenios works](https://www.belenios.net/howitworks.html)
- [Belenios participant, trustee, authority, and auditor instructions](https://www.belenios.net/instructions.html)
- [Belenios FAQ and explicit limitations](https://www.belenios.net/faq.html)
- [Belenios research and security documentation](https://www.belenios.net/documentation.html)
- [Inria 2025 project activity and usage statistics](https://radar.inria.fr/report/2025/pesto/index.html)
- [Belenios: the Certification Campaign](https://www.sstic.org/media/SSTIC2024/SSTIC-actes/belenios_the_certification_campaign/SSTIC2024-Article-belenios_the_certification_campaign-bossuat_brocas_kovacs_gaudry_glondu_cortier.pdf)
- [Belenios AGPLv3 source license](https://gitlab.com/vcast.vote/belenios/-/blob/3.3.0/COPYING)
