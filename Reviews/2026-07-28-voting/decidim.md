# Decidim — civic-process platform, not a cryptographic ballot backend

**Reviewed:** 2026-07-28
**Status:** point-in-time research profile; factual claims use versioned Decidim source, documentation, release, and project sources; EFS recommendations are analysis
**Scope:** Decidim 0.32.0, especially Elections, Meetings polls, participatory budgets, authorization/census integration, and a bounded EFS v2 integration

#kind/research #status/done #repo/planning #topic/efsv2 #topic/privacy #topic/governance #topic/voting

## Bottom line

Decidim is the strongest **civic participation and participatory-process platform** in this comparison. It is mature software for proposals, deliberation, meetings, consultations, assemblies, participatory budgets, phases, participant authorization, communications, and accountability.

It is not currently a cryptographic voting protocol. The versioned `v0.32.0` Elections README is explicit: the component provides **“non-cryptographic elections”** that are essentially polls or surveys with census access management. The implementation stores responses in the application database against a `voter_uid`; casting again deletes the earlier response rows and inserts the new ones. There is no current end-to-end-verifiable bulletin board, cryptographic ballot tracker, threshold tally, or public proof system in that component. [Decidim Elections 0.32 README](https://github.com/decidim/decidim/blob/v0.32.0/decidim-elections/README.md) · [0.32 vote-casting command](https://github.com/decidim/decidim/blob/v0.32.0/decidim-elections/app/commands/decidim/elections/cast_votes.rb) · [0.32 vote model](https://github.com/decidim/decidim/blob/v0.32.0/decidim-elections/app/models/decidim/elections/vote.rb)

This distinction matters because some general Decidim pages still describe secure or encrypted e-voting, and older Decidim Elections code expected a separate cryptographic bulletin-board service. Those descriptions are not evidence that the current `v0.32.0` module supplies that capability.

**EFS verdict:** Decidim is a strong candidate for the civic-process shell around EFS voting, not a substitute for MACI, Vocdoni, Belenios, ElectionGuard, or another cryptographic ballot backend. A Decidim plugin could bind proposals, election configuration, electorate snapshots, results, and implementation/accountability records to EFS while sending secret ballot casting through a separate trusted flow.

## Questions used for this review

1. Is Decidim a voting protocol, a civic application, or both?
2. What does the current versioned Elections implementation actually store and prove?
3. Which older cryptographic-election claims are still implemented in the current release?
4. Who defines and administers a census, and what does authorization establish?
5. Can an administrator or database operator learn or change votes?
6. Are cast-as-intended, recorded-as-cast, and tallied-as-recorded independently verifiable?
7. Are election results reconstructible without trusting a Decidim server and database?
8. How mature are the broader proposals, meetings, budgeting, and accountability workflows?
9. How active is the project, how widely is it deployed, and under what license?
10. Is its alignment with Ethereum technical, ideological, or neither?
11. Can Decidim safely embed an external EFS-backed ballot flow without receiving ballot secrets?
12. Which process records belong in EFS, and which identity or ballot data must remain private?

## What Decidim is

Decidim is an AGPLv3, self-hostable participatory-democracy framework built as Ruby on Rails engines and gems. An organization deploys a Rails application backed by ordinary application infrastructure, commonly PostgreSQL, and enables participatory spaces and components appropriate to its process. [Installation architecture](https://docs.decidim.org/en/develop/install/index.html) · [Components architecture](https://docs.decidim.org/en/develop/develop/components.html) · [Decidim repository](https://github.com/decidim/decidim)

### Participatory spaces

Decidim organizes activity into spaces such as:

- participatory processes with phases;
- assemblies;
- initiatives;
- consultations;
- conferences.

Components such as proposals, meetings, surveys, debates, budgets, accountability, and elections can be enabled within those spaces. Consultations can also act as a gateway to an external e-voting system. [Participatory spaces](https://docs.decidim.org/en/develop/features/participatory-spaces.html) · [General feature description](https://docs.decidim.org/en/develop/features/general-description.html)

### Identity, census, and authorization

The platform supports registered participants, OAuth-style application integration, configurable authorizations, and custom verification methods. An Elections census can be populated or dynamically evaluated according to a census manifest. Decidim also supports one-time or ephemeral verified participants for some processes. [Elections developer documentation](https://docs.decidim.org/en/develop/develop/elections.html) · [Custom authorizations](https://docs.decidim.org/en/develop/customize/authorizations.html) · [Ephemeral verifications](https://docs.decidim.org/en/develop/admin/participants/authorizations/ephemeral_verifications.html)

These are extensibility and access-control features, not decentralized identity proofs. The deploying institution still chooses:

- who qualifies;
- which records or provider establish qualification;
- how duplicate people or accounts are handled;
- who can modify the census;
- which appeals and corrections are allowed.

### API and extension surface

Decidim has a GraphQL API for public reads and OAuth/JWT mechanisms for authorized writes. Components are designed as Rails engines, so an EFS adapter can be built as a separate component or integration gem instead of modifying the core application. [API authentication](https://docs.decidim.org/en/develop/develop/api/authentication.html) · [Components architecture](https://docs.decidim.org/en/develop/develop/components.html)

## Current Elections implementation: the version-specific ruling

### Fact: version 0.32 is non-cryptographic

The `decidim-elections` README at tag `v0.32.0` says:

> The Decidim::Elections is a component that allows users to setup non-cryptographic elections.

It describes them as polls or surveys with census access management. This is the most direct, version-specific statement of current behavior. [Decidim Elections 0.32 README](https://github.com/decidim/decidim/blob/v0.32.0/decidim-elections/README.md)

### Fact: votes are ordinary application rows

The current code records selected response options in database rows associated with a `voter_uid`, question, and response option. When casting, the command removes that voter UID’s existing responses for each question and creates the new response rows. The schema contains ordinary timestamps and counters, not ciphertexts, zero-knowledge proofs, signatures, commitments, or decryption shares. [Vote-casting command](https://github.com/decidim/decidim/blob/v0.32.0/decidim-elections/app/commands/decidim/elections/cast_votes.rb) · [Vote model](https://github.com/decidim/decidim/blob/v0.32.0/decidim-elections/app/models/decidim/elections/vote.rb) · [Vote-table migration](https://github.com/decidim/decidim/blob/v0.32.0/decidim-elections/db/migrate/20250703090427_create_decidim_elections_votes.rb)

**Inference:** a party with sufficient application or database privilege is within the confidentiality and integrity trust boundary. Exact real-world linkability depends on how a deployment derives and handles `voter_uid`, but the database itself associates that identifier with response-option rows.

### Fact: the current receipt is not a cryptographic receipt

The interface confirms that a vote was submitted. The current component does not give the voter a cryptographic tracker that can be checked against a public append-only ballot box, nor a proof that the final result includes the submitted ballot.

Calling this interface a receipt must not be allowed to imply:

- cast-as-intended verification;
- recorded-as-cast verification;
- tallied-as-recorded verification;
- a non-transferable proof;
- an independently reconstructible result.

### Historical fact: an older cryptographic direction existed

The `v0.28.5` Elections README described a module under development, warned that it was not production-ready, and required a separate Decidim Bulletin Board application to provide an end-to-end auditable election. [Historical 0.28.5 Elections README](https://github.com/decidim/decidim/blob/v0.28.5/decidim-elections/README.md)

The current 0.32 component no longer makes that claim and instead explicitly says it is non-cryptographic. The historical design is useful evidence that Decidim can integrate an external election service, but it must not be represented as a live, supported cryptographic backend without a new code and deployment review.

### Documentation conflict

Some general Decidim descriptions use broad language about secure or encrypted e-voting. The current versioned component README and source code are more specific and testable. For this review:

1. the `v0.32.0` source decides what the current bundled component does;
2. general marketing language describes an aspiration or wider ecosystem capability;
3. the historical bulletin-board module is treated as retired evidence unless separately revived and validated.

## Assurance matrix

| Property | Current native Elections behavior | Limit or external dependency |
|---|---|---|
| Eligibility | A configured census/authorization gates access and a voter UID supports one current response per question | Census creation, personhood, duplicate handling, administrator powers, appeals, and legitimacy are institutionally trusted |
| Ballot privacy | The user interface need not show choices publicly | Responses are stored as ordinary rows associated with voter UIDs; no ballot encryption protects against a privileged application/database operator |
| Cast as intended | The interface shows the choices before submission | No independent cryptographic challenge or trusted display proves that the server received the intended encoding |
| Recorded as cast | The application presents a successful-submission state | No public ballot tracker or independently checkable append-only record proves persistence |
| Tallied as recorded | The application can count stored responses and publish results | No public proof binds the displayed tally to all and only valid submitted votes |
| Revoting | The server replaces earlier stored responses with the newest ones | Correct last-vote behavior depends on server code, database state, authentication, and logs |
| Receipt/coercion resistance | No cryptographic proof of a selection is issued | It also supplies no coercion-resistant protocol; screen sharing, credential control, or an observed remote device remain unsolved |
| Anti-equivocation | Ordinary application operations, backups, and monitoring can detect some inconsistencies | No protocol-level public bulletin board prevents different servers or times from showing different histories |
| Availability | Mature web-application operations can provide practical uptime | The application, database, identity provider, and administrators remain live dependencies |
| Public auditability | Some process content and exports are public | Exports and APIs are server assertions unless independently committed and verified |

This matrix describes the current native Elections module. A separate cryptographic backend can change the ballot rows of the matrix, but only if its proofs and trust model are preserved end to end.

## Other voting and participation modes

### Meeting polls

Meeting administrators can create polls and publish questions, responses, and results during a meeting. Results and responses can be exported in several ordinary data formats. This is useful for facilitated, low-stakes opinion gathering but retains administrator and server trust. [Meeting polls](https://docs.decidim.org/en/develop/admin/components/meetings/polls.html)

### Participatory budgets

The Budgets component lets participants choose among projects subject to configured rules and lets administrators move the process through selection and result phases. It is a mature civic workflow, not a cryptographic tally protocol. The platform’s greatest value here is the surrounding proposal, deliberation, project, and accountability lifecycle. [Participatory budgets](https://docs.decidim.org/en/develop/admin/components/budgets.html)

### Consultations and external voting

Decidim’s own participatory-spaces documentation allows a Consultation to link to an external voting system. This is the clean architectural precedent for an EFS or external cryptographic-backend integration: Decidim owns the civic workflow and context; another bounded system owns ballot privacy, tally proofs, and the election evidence closure. [Participatory spaces](https://docs.decidim.org/en/develop/features/participatory-spaces.html)

## Maturity and maintenance

### Current release and activity

- Decidim `v0.32.0` was released in July 2026. [0.32.0 release](https://github.com/decidim/decidim/releases/tag/v0.32.0)
- The main repository remained active in July 2026. [Decidim repository](https://github.com/decidim/decidim)
- The project publishes current release and community activity through its official site. [Decidim blog](https://decidim.org/blog/)
- The license is AGPLv3, supporting self-hosting, inspection, modification, and reciprocal publication of network-service changes. [Repository license](https://github.com/decidim/decidim)

### Deployment evidence

The project’s current “used by” directory reports hundreds of instances across dozens of countries, including both institutions and civil-society organizations. It lists major municipal and organizational deployments and reports aggregate participant counts. These figures support **civic-platform operational maturity**, not cryptographic-election assurance. [Official Decidim deployments](https://decidim.org/usedby/)

Decidim has real strengths that the voting protocols do not try to provide:

- multi-phase public processes;
- proposals and amendments;
- assemblies and meetings;
- participatory budgets;
- moderation and communications;
- institutional accountability and follow-through;
- multilingual and accessibility-oriented public interfaces;
- reusable organizational administration.

### Security and audit posture

The repository maintains a supported-version and coordinated-disclosure policy and publishes security advisories. [Decidim security policy](https://github.com/decidim/decidim/security)

No current primary source was found establishing a comprehensive independent cryptographic audit of the 0.32 Elections component. That absence is not surprising because the component is explicitly non-cryptographic. Its relevant assurance is ordinary web-application security and operational review, not proof of an end-to-end-verifiable election protocol.

This review intentionally keeps vulnerability detail outside the voting comparison.

## Fit by use case

| Use case | Fit | Reason |
|---|---:|---|
| Casual public opinion poll with accepted platform trust | Good | Full poll/process UX exists; central administration is often acceptable when the result is advisory |
| Daily “hotdog or hamburger” folder poll | Good as UX; optional as authority | Decidim is heavier than necessary, but can host discussion and a poll; EFS can provide a smaller durable result closure |
| Election of EFS folder moderators | Conditional | Strong nomination, deliberation, phase, and accountability UX; use an external verifiable ballot backend if the result controls consequential powers |
| Participatory budgeting | Strong process fit | Decidim supplies proposal selection and lifecycle; cryptographic tallying is separate if required |
| Organizational secret ballot | Weak natively | Current Elections depends on server/database confidentiality and integrity |
| Coercion-resistant remote election | Poor | Neither native Elections nor Decidim identity flows solve coercion or compromised voter devices |
| Official public election | Poor as ballot system | Useful for engagement and information, but not a certified or cryptographically verifiable official-election backend |

## Ethereum alignment

### Technical alignment: none

The current system is a conventional Rails/PostgreSQL application with web identity, configurable authorization, APIs, and plugins. It does not provide:

- EVM contracts;
- wallet-native ballot authorization;
- onchain commitments or tally verification;
- zero-knowledge voting proofs;
- decentralized consensus or data availability;
- trustless execution.

An Ethereum integration would be a new adapter or component, not an activation of existing Decidim protocol machinery.

### Ideological alignment: strong, but different

Decidim describes itself as a public, open, participatory-democracy and technopolitical project. Its AGPL license, community governance, self-hosting, transparency norms, and institutional accountability are compatible with many Ethereum-public-goods values. [About Decidim](https://docs.decidim.org/en/develop/understand/about.html)

That is civic and organizational alignment, not “trustlessness.” Decidim deliberately accommodates public institutions, administrators, verified participant registries, moderation, legal rules, and hybrid online/offline processes. Those human institutions are features of its political model rather than defects that a blockchain automatically removes.

## Exact EFS integration boundary

### Good integration: Decidim as process shell

A bounded integration would treat Decidim as the participant-facing civic application while EFS and a chosen ballot backend own the authoritative voting evidence:

1. **Define the process in Decidim.** Host proposals, debate, meetings, nomination, translations, and phase scheduling.
2. **Create a canonical EFS election manifest.** Bind the Decidim process and proposal versions to exact question text, options, rules, times, electorate basis, tally rule, backend, chain/domain, and result policy.
3. **Freeze or checkpoint the electorate basis.** If eligibility is derived from an EFS folder or capability state, name the exact stable snapshot and private-data handling policy.
4. **Cast outside the native Elections database.** Launch a trusted EFS/System Chrome flow or an external MACI, Vocdoni, Belenios, or ElectionGuard ceremony appropriate to the assurance target.
5. **Keep ballot secrets out of Decidim.** Decidim should receive an opaque election reference and public status, not credentials, plaintext selections, decryption material, or identity-ballot mappings.
6. **Verify before displaying authority.** A verifier independently reconstructs the backend result and publishes a result closure into EFS. Decidim displays that verified closure and makes any local result a labeled cache.
7. **Record implementation and accountability.** Decidim continues the civic process after the vote, while EFS preserves the binding decision, actions, reports, and later supersession.

### Records EFS can preserve

Subject to privacy classification, EFS can preserve or commit to:

- process and election manifests;
- canonical question and option bytes;
- proposal versions and amendments;
- participation rules and phase schedule;
- eligible-state snapshot identifiers or privacy-preserving commitments;
- moderator or administrator role definitions;
- election-backend identifiers and verification profile;
- ballot-box checkpoints or backend archive roots;
- verifier source/version/digest and deterministic result;
- challenge, objection, and dispute records;
- final result and implementation/accountability reports;
- supersession links and reconstruction instructions.

### Records EFS must not publish by default

- voter credentials or authentication links;
- identity-to-ballot or identity-to-credential mappings;
- plaintext secret selections;
- IP addresses, browser fingerprints, access logs, or avoidable timing metadata;
- trustee, coordinator, or administrator secrets;
- private census fields;
- recovery data that weakens ballot secrecy.

### What EFS cannot supply

EFS cannot make the current Decidim database votes cryptographically verifiable after the fact. It also cannot by itself:

- prove that a participant is a unique eligible human;
- prevent a registrar from defining a biased electorate;
- protect a compromised voter browser or observed remote voting environment;
- make a coordinator, trustee, census authority, or Decidim administrator honest;
- guarantee liveness or usable accessibility;
- confer legal authority;
- solve coercion, vote buying, or durable metadata leakage.

### Trusted-display requirement

If Decidim embeds or links a consequential EFS vote, the authoritative casting display must independently decode and show:

- the exact question and options;
- the Decidim proposal/process version being decided;
- the eligibility snapshot;
- open and close conditions;
- tally rule and tie behavior;
- ballot backend and trust assumptions;
- any privacy or coercion warning.

The voter must not have to trust mutable Decidim JavaScript alone for this interpretation.

## Minimum EFS validation experiment

Use synthetic participants and no real civic identities.

1. Deploy Decidim 0.32 with a process containing proposal, deliberation, election, result, and accountability phases.
2. Install a small EFS integration component rather than modifying core Decidim.
3. Canonicalize one two-option question and bind it to an exact EFS folder-state snapshot.
4. Route 100 synthetic voters to a separate EFS-backed or cryptographic-backend casting flow.
5. Publish checkpoints and a complete result-verification closure to EFS.
6. Have two independent implementations reconstruct the result without using Decidim’s result endpoint.
7. Alter or delete Decidim’s local election/result database rows and confirm that the authoritative EFS result and basis remain detectable and reconstructible.
8. Shut down the Decidim instance and reconstruct the election definition, evidence, verifier, and result from EFS.
9. Restore Decidim and verify that it labels its local projection as a cache of the EFS closure.
10. Test that no ballot secret, private credential, voter mapping, or sensitive access metadata entered EFS.

This experiment validates the integration boundary. It does not validate coercion resistance, real-world eligibility, device security, or official-election suitability.

## Questions to answer before an implementation

1. Is Decidim only the process/UX layer, or is any native Decidim database state intended to be authoritative?
2. Which EFS stable-state rule names the eligible electorate at opening?
3. Does a participant need a Decidim account, an EFS capability, an Ethereum address, or some combination?
4. Can Decidim learn whether a person voted without learning the ballot, and is even that participation metadata acceptable?
5. Which backend serves each class: casual poll, moderator election, treasury decision, or official/civic consultation?
6. Who verifies and signs the result closure, and can independent clients reproduce it?
7. How are question amendments, cancellations, extensions, and reruns represented without rewriting history?
8. Which Decidim content must be mirrored for the process to remain intelligible after the instance disappears?
9. What is the recovery path when Decidim is available but EFS/backend settlement is delayed, or vice versa?
10. Which accessibility and non-wallet participation path avoids excluding legitimate voters?
11. How are moderation and appeals handled before and after a binding vote?
12. Does the integration need to preserve secrecy forever, through a bounded period, or not at all?

## Verdict

**Use Decidim for:**

- proposal intake and amendment;
- discussion, meetings, consultations, and nomination;
- participatory-budgeting workflow;
- election phase orchestration and participant communication;
- ordinary low-stakes polls where central platform trust is explicit;
- publishing and following through on verified EFS/external-backend results.

**Do not use current native Decidim Elections as:**

- an end-to-end-verifiable secret ballot;
- an Ethereum voting protocol;
- a threshold-trust tally;
- a coercion-resistant remote election;
- proof that an official result follows from immutable ballots.

The best combined design is **Decidim for democratic process, EFS for durable process/evidence closure, and a separately chosen voting backend for the assurance level of each election**.

## Primary sources

- [Decidim repository](https://github.com/decidim/decidim)
- [Decidim 0.32.0 release](https://github.com/decidim/decidim/releases/tag/v0.32.0)
- [Current Elections component README](https://github.com/decidim/decidim/blob/v0.32.0/decidim-elections/README.md)
- [Current vote-casting command](https://github.com/decidim/decidim/blob/v0.32.0/decidim-elections/app/commands/decidim/elections/cast_votes.rb)
- [Current vote model](https://github.com/decidim/decidim/blob/v0.32.0/decidim-elections/app/models/decidim/elections/vote.rb)
- [Current vote schema migration](https://github.com/decidim/decidim/blob/v0.32.0/decidim-elections/db/migrate/20250703090427_create_decidim_elections_votes.rb)
- [Historical 0.28.5 Elections README](https://github.com/decidim/decidim/blob/v0.28.5/decidim-elections/README.md)
- [Elections developer documentation](https://docs.decidim.org/en/develop/develop/elections.html)
- [Participatory spaces](https://docs.decidim.org/en/develop/features/participatory-spaces.html)
- [Components architecture](https://docs.decidim.org/en/develop/develop/components.html)
- [Meeting polls](https://docs.decidim.org/en/develop/admin/components/meetings/polls.html)
- [Participatory budgets](https://docs.decidim.org/en/develop/admin/components/budgets.html)
- [Authorizations](https://docs.decidim.org/en/develop/customize/authorizations.html)
- [API authentication](https://docs.decidim.org/en/develop/develop/api/authentication.html)
- [Official deployment directory](https://decidim.org/usedby/)
- [About Decidim](https://docs.decidim.org/en/develop/understand/about.html)
- [Security policy](https://github.com/decidim/decidim/security)
