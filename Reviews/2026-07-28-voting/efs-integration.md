---
agent: codex-gpt-5
date: 2026-07-28
status: done
anchors:
  - area: governance
  - area: efsv2
  - area: client
  - area: privacy
  - review: 2026-07-28-voting
source: EFS integration synthesis across Ethereum-aligned voting systems
---

# EFS integration profile for voting backends

#kind/research #status/done #repo/planning #topic/governance #topic/privacy #topic/onchain #topic/efsv2

## Decision

EFS should define an **application-level voting-backend profile**, not a voting protocol, ZK circuit, eligibility system, or new kernel record kind.

The profile should work with:

- native public signed EFS polls;
- anonymous public signaling built with a primitive such as Semaphore;
- MACI;
- Interfold/CRISP;
- DAVINCI;
- Snapshot, Snapshot X, and Shutter shielded voting;
- an OpenZeppelin Governor-style executable decision; and
- non-EVM evidence packages produced by systems such as Belenios or ElectionGuard.

No reviewed alternative justifies a **backend-specific** EFS v2 kernel change. The comparison instead strengthens existing generic requirements: exact manifests, scoped authority, authenticated finality bases, complete discovery, package closure, independent verification, and privacy-aware retention.

It also exposes one unresolved generic authority seam: current EFS v2 doctrine does not let a foreign EVM contract directly become canonical EFS record authority. Automatic folder mutation therefore needs a separately adopted, fail-closed external-result/GATE adapter or a scoped native EFS actor that witnesses the result. Until that design exists, every external vote is **evidence-only** or **binding-manual**, not automatically binding in EFS.

## Boundary

```text
EFS folder and policy
  ├─ final poll manifest
  ├─ exact client/verifier package closure
  ├─ authority + eligibility commitments
  ├─ backend locator and trust declaration
  ├─ public lifecycle receipts
  └─ result, proof, challenge, and disposition records
                         │
                         ▼
replaceable voting backend
  ├─ native EFS public records
  ├─ EVM contracts + coordinator/prover
  ├─ EVM contracts + threshold key network
  └─ external organizational/civic election system
```

EFS can make substitution, equivocation, omission, and version drift easier to detect. It cannot make an unfair electorate fair, make a compromised voter device encode the intended choice, force a coordinator or key network to finish, provide civil identity, or adjudicate a political dispute.

EFS must not become, implicitly or explicitly:

- the authoritative voter registry or proof-of-personhood issuer;
- a secret-ballot database;
- a MACI coordinator;
- an Interfold/CRISP ciphernode or network operator;
- a DAVINCI sequencer or distributed key-network role;
- a Shutter Keyper;
- the only relayer, RPC, mirror, verifier, or frontend;
- an official election system of record; or
- the authority that decides whether a disputed outcome is legitimate.

## Evidence-only versus binding integration

### Evidence-only is available as an application design

An EFS profile can preserve the frozen intent, electorate basis, exact backend, public evidence, verified result, challenge state, and human disposition. The imported result is evidence. An authorized EFS actor may later make a separately witnessed change under ordinary EFS authority.

### Automatic binding is an unresolved v2 design

OpenZeppelin Governor, Snapshot X, MACI, CRISP, DAVINCI, or another foreign contract cannot simply sign a canonical EFS record under the current authority model. A future generic bridge must choose and specify one of at least these patterns:

1. **External-result GATE:** an EFS actor witnesses a finalized external result and produces a narrowly scoped EFS action; the residual actor/oracle trust is explicit.
2. **Native scoped adapter actor:** a deliberately authorized EFS actor accepts only a named backend, poll and precommitted action set; its contract/account and witness semantics must be compatible with the adopted EFS authority design.
3. **Manual binding:** the institution treats a verified result as politically binding, while an ordinary authorized EFS actor applies it after the challenge period.

The bridge must fail closed on missing data, unknown finality, disagreement, reorganization, a void poll, or a result outside the precommitted action set. This is a generic cross-system authority problem, not a reason to embed MACI- or Vocdoni-specific logic in the kernel.

## Candidate manifest, not frozen bytes

The exact encoding must wait for the EFS v2 envelope/kernel/profile reconciliation. Conceptually, a final poll manifest needs at least:

### Institution

- purpose class: `social-poll`, `opinion-poll`, `governance-vote`, `grant-allocation`, `organizational-election`, or another explicitly reviewed class;
- consequence: `advisory`, `binding-manual`, or one exact `binding-executable` action; `binding-executable` is invalid until an adopted generic EFS authority adapter is named;
- policy, question, options, supporting materials, translations, and accessibility statement;
- open, close, finality, challenge, cancellation, tie, zero-vote, and rerun rules;
- organizer, proposer, reviewers, eligibility authority, backend operator roles, challenge authority, and executor;
- privacy and participation notice.

### Frozen electorate

- eligibility mechanism and issuer;
- source set or commitment;
- voting weights/voice credits and snapshot algorithm;
- authority domain, block/checkpoint/state root, and finality rule;
- member count and privacy treatment;
- recovery/delegation behavior and uniqueness rule.

### Exact backend

- backend family and protocol version;
- ordered cross-domain basis vector, described below;
- contract addresses and code hashes;
- configuration and capacity bounds;
- circuit, verification-key, and setup-artifact digests;
- coordinator, sequencer, key-holder, relayer, RPC, and upgrade assumptions;
- client and verifier closure identifiers;
- supported ballot, revote, delegation, and tally semantics.

### Evidence and retention

- accepted-message/state commitment;
- final result and finality basis;
- processing, tally, and decryption proofs where applicable;
- independently runnable verification instructions and output digest;
- challenge, response, void/rerun, execution, and final disposition records;
- explicit retention class for each artifact.

The retention class matters. Permanently preserving an aggregate proof is different from permanently preserving a civil membership list, attributable ballot, network log, encrypted individual ballot, or decryption share. “Store everything for auditability” can destroy privacy today or create a harvest-now/decrypt-later archive.

### Ordered cross-domain basis vector

There is no atomic global “current state” across EFS and an EVM/L2. A poll spanning several domains must bind an ordered vector rather than one generic `chainId` or timestamp:

1. EFS electorate snapshot authority domain, finalized basis and cutoff;
2. EFS poll-intent approval basis;
3. backend deployment/open domain, transaction/block and finality rule;
4. vote-close and result-finality basis on the backend domain;
5. EFS result-import/disposition basis; and
6. optional execution-adapter basis and cooling-off/challenge deadline.

For every transition, name:

- the adapter or witness;
- minimum confirmation/finality lag;
- data and proof required to advance;
- reorganization and rollback behavior;
- challenge window;
- timeout; and
- the exact `UNKNOWN`, `INCOMPLETE`, `FAILED`, `VOID`, `DISPUTED`, or superseded state when the transition cannot be proven.

No later basis may silently reinterpret an earlier electorate or poll intent.

## Backend capability declaration

The manifest should not contain a single `private: true` flag. It should declare independently:

| Capability | Example values |
|---|---|
| Ballot visibility | public; pseudonymous; anonymous-public-choice; encrypted-until-close; permanently secret under named assumptions |
| Participation visibility | public; commitment-only; intended hidden; unknown |
| Running tally | public; hidden from public but visible to coordinator; threshold-hidden; unavailable |
| Receipt property | transferable; nontransferable under revoting assumptions; unknown |
| Correctness | deterministic replay; onchain execution; ZK-proven offchain computation; trustee evidence |
| Completion trust | permissionless; one coordinator; threshold network; election trustees; hosted operator |
| Eligibility | address; token snapshot; EFS organization snapshot; anonymous group; external credential; civil roll |
| Cast-as-intended | none; code inspection only; challenge/Benaloh-style check; voter-verifiable paper |
| Result execution | none; manual disposition; timelocked exact action |

A client should render these in ordinary language before the voter acts. It must not compress “correct tally proof” into “secure election.”

## Four integration profiles

### 1. `public-replayable`

Use for a genuinely harmless daily folder poll or an accountable representative roll call.

- Each vote is an attributable or deliberately pseudonymous signed record.
- Independent clients discover the complete finalized set and run the same tally.
- Revoting, if allowed, follows one declared authority-domain ordering rule.
- There is no claim of secret ballot, anonymity, receipt-freeness, or representative sampling.

This is the smallest useful EFS implementation and does not need MACI.

### 2. `anonymous-signal`

Use for low-stakes opinion polling where the choice can be public but membership linkage should be hidden.

- A group commitment and scoped nullifier establish eligibility and one signal per poll.
- The ballot remains a public signal; no running-tally secrecy or coercion resistance is implied.
- Semaphore is the leading Ethereum primitive for this profile.

This profile still needs a complete poll application, membership process, finality basis, result rules, and verifier. The primitive is not the institution.

### 3. `temporarily-shielded`

Use when choices should be hidden from the public only until close.

- Shutter or another named threshold release network encrypts accepted ballots before the deadline.
- The manifest states that individual choices become public after key release.
- EFS preserves the host poll semantics, ciphertext commitment, key-network configuration, release evidence, plaintext accepted set and deterministic result.
- Threshold release failure yields an explicit failure state.

This is not a secret-ballot profile and should not inherit MACI, Belenios or permanent-private claims.

### 4. `private-external`

Use for an experimental consequential community vote only after the selected backend passes a stated launch gate.

- Ballots and tally semantics live in MACI, Interfold/CRISP, DAVINCI, Belenios, ElectionGuard, or another named backend.
- EFS binds the exact backend, software, rules, electorate commitment, trust map, public evidence, result, challenge, and disposition.
- Failure to produce the required proof/result by the deadline yields `FAILED` or `VOID`, never an operator-entered substitute tally.
- Executable effects remain binding-manual until EFS adopts a separate, exact, delayed and narrowly authorized generic external-result adapter.

MACI is the strongest current Ethereum candidate when receipt resistance is the reason for the added complexity. Shutter is simpler when only hidden-until-close voting is required. Interfold/CRISP is the highest-priority **no-single-plaintext-holder** private-EVM prototype, but its public Aragon deployment is testnet-only and its production network/audit evidence remains incomplete. DAVINCI is a research backend until its distributed design is integrated and validated.

## EFS v2 requirements exercised by voting

The earlier folder-poll review found the following gaps; the alternatives review does not remove them:

1. **Exact authority profile.** A community organization, scoped poll actors, per-poll approval, recovery, and executor authority must be distinguishable and basis-bound.
2. **Complete discovery.** Two clean-room clients must derive the same candidate and counted record sets without trusting an EFS-operated indexer.
3. **Authenticated finality.** Deadlines, snapshots, revotes, and close must use one named authority domain and a reproducible finalized basis.
4. **Package closure.** The client and verifier—including WASM, circuits, keys, dependencies, translations, and configuration—must be content-addressed and independently executable.
5. **Honest absence and failure.** Missing evidence is `UNKNOWN`, `INCOMPLETE`, `FAILED`, or `VOID`, never silently treated as no vote or a valid result.
6. **Privacy-aware publication.** The profile must distinguish public evidence from sensitive membership, ballots, ciphertext, metadata, keys, and recovery material.
7. **Narrow execution.** If a generic external-result authority bridge is adopted, it can authorize only the exact action disclosed before opening, after finality and a challenge/cooling-off delay.
8. **Walk-away verification.** Exported evidence must remain verifiable without the official EFS client, gateway, or hosted election operator.
9. **Cross-domain authority bridge.** Evidence import and automatic execution are separate. Current EFS authority rules require an explicit native witness/adapter; foreign contract state is not canonical EFS authority by itself.

Most are already generic EFS concerns. Item 9 is a concrete v2 design question that voting makes unavoidable if automatic folder mutation is desired. Voting is a high-value conformance test, not grounds to freeze backend-specific assumptions into v2.

## Validation work

Before choosing a consequential backend:

1. implement the same synthetic binary poll under `public-replayable`, Semaphore-style `anonymous-signal`, MACI, and—when independently operable artifacts are available—Interfold/CRISP or DAVINCI;
2. use at least 100 synthetic members, revotes, invalid messages, an ineligible attempt, an RPC outage, relayer loss, and a result operator that stops;
3. export each complete EFS evidence package;
4. have two clean-room verifiers reproduce the accepted-set commitment and result without the official frontend or EFS indexer;
5. measure voter transactions, organizer gas, proving time/RAM, completion latency, bundle size, and recovery work;
6. test keyboard, screen-reader, mobile, low-bandwidth, translation, key-loss, and interrupted-flow cases;
7. verify that the manifest makes each backend’s remaining human and system trust visible before voting;
8. verify that deletion of every EFS-operated service does not prevent use of the exported verifier and public backend evidence.
9. if automatic binding is desired, separately validate the adopted native authority adapter against cross-domain reorganization, stale/unknown basis, disagreement, timeout, void result, out-of-set action and signer/oracle failure.

The backend should be selected only after those results. A paper architecture comparison cannot establish operational fitness.

## Relationship to existing work

- [[Brainstorms/2026-07-24-codex-folder-voting-use-case|Folder-scoped polls and elections]]
- [[Reviews/2026-07-24-chicago-voting-vocdoni/folder-poll-question-resolution|Folder polling: research answers and implementation gates]]
- [[Reviews/2026-07-28-voting/comparison|Ethereum-aligned voting-system comparison]]
- [[Designs/efsv2/README|EFS v2 design status and reading order]]
- [[Designs/efsv2/joined-pass-synthesis|joined authority/filesystem synthesis]]
- [[Designs/efsv2/kel|KEL and native actor authority]]
- [[Designs/efsv2/assumptions-and-requirements|EFS v2 assumptions and requirements]]
- [[Designs/clientv2/packages-and-updates|content-addressed package closure and capability review]]
