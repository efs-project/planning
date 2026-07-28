# Semaphore — anonymous membership signaling, not a voting system

**Reviewed:** 2026-07-28
**Status:** point-in-time research profile; factual claims use official documentation, source, releases, deployments, and audit references; recommendations are EFS analysis
**Scope:** Semaphore V4 as an Ethereum application primitive and a bounded EFS v2 integration

#kind/research #status/done #repo/planning #topic/efsv2 #topic/privacy #topic/governance #topic/voting #topic/zk

## Bottom line

Semaphore is the cleanest mature Ethereum-native primitive in this review for:

> “Prove that I am one member of an eligible group, send one signal for this poll, and do not reveal which member I am.”

It is **ZK-based**. A voter proves membership in a Merkle group and derives a poll-specific nullifier, using a Groth16 proof. The verifier can reject a second signal under the same scope without learning which member produced either signal. Proof verification and group management can run in EVM contracts; identity creation and proof generation normally run in JavaScript offchain.

Semaphore is **not** a complete ballot protocol. It does not supply:

- a voter registry or one-human-one-vote;
- ballot encryption or a secret tally;
- coercion resistance, receipt-freeness, or vote overwriting;
- proposal, quorum, tally, dispute, or execution rules; or
- an anonymous way to issue an eligible person their secret credential.

That distinction is decisive. Semaphore is excellent for a private-participation but **public-choice** EFS folder poll. It is not by itself a secret election.

**EFS verdict:** prototype Semaphore as an optional EFS voting-profile primitive. Use EFS to freeze and publish the eligible-group root, poll scope, verifier closure, rules, and result evidence. Do not put Semaphore into the generic EFS kernel, and do not store the mapping between a real person, EFS principal, and Semaphore identity.

## What Semaphore is

Semaphore is a generic privacy layer maintained within Privacy & Scaling Explorations. The official documentation describes two halves:

- offchain libraries create identities, maintain groups, generate proofs, and verify proofs locally; and
- Solidity contracts maintain groups and verify proofs on EVM chains.

The application defines what a “signal” means. It may be a vote option, a review, an anti-spam action, a chat message, or merely proof that somebody participated. [Semaphore documentation](https://docs.semaphore.pse.dev/) · [Semaphore source](https://github.com/semaphore-protocol/semaphore)

This makes Semaphore closer to an anonymous authorization primitive than to Vocdoni, MACI, Snapshot, or an OpenZeppelin Governor.

## How a Semaphore poll works

### 1. Each voter has a secret identity

A Semaphore identity contains secret values from which a public identity commitment is derived. The public commitment may be inserted into a group; the secrets must remain with the voter.

An EFS principal, Ethereum address, or civil identity is not automatically a Semaphore identity. If an organizer derives or records both sides of that relationship, the organizer can destroy the intended unlinkability.

### 2. Eligible commitments form a Merkle group

The group stores identity commitments as leaves in an incremental Merkle tree. A group administrator can add, update, or remove members in the canonical onchain implementation. The administrator may be an EOA or a contract. An application can instead use a fixed root or constrain updates through its own governance.

The group answers “which commitments are eligible?” It does not answer “does each commitment belong to one distinct human?” That remains an issuance and membership-policy problem. [Semaphore contract](https://github.com/semaphore-protocol/semaphore/blob/main/packages/contracts/contracts/Semaphore.sol)

### 3. The voter proves membership without naming the leaf

The voter’s device generates a Groth16 proof that:

- its commitment is included under an accepted group root;
- it knows the corresponding identity secrets;
- it formed the signal and nullifier consistently; and
- it has not exposed which leaf was used.

The ballot or message itself is normally an explicit public value or hash. Semaphore hides the voter-to-signal link; it does not encrypt the signal. If an application posts `HAMBURGER` or `HOTDOG` onchain, the option and running tally remain public.

### 4. Scope makes a nullifier poll-specific

The application supplies a scope, often called an external nullifier in earlier Semaphore versions. The circuit derives a nullifier from the voter’s secret and that scope. A verifier records the nullifier and rejects reuse.

For EFS, the scope should be a canonical digest over at least:

- the EFS poll-manifest identifier;
- chain ID and verifying-contract address;
- group-root epoch or eligibility-basis identifier; and
- contest/round identifier.

This prevents accidental nullifier reuse across unrelated polls and replay into another deployment. The SDK exposes proof generation with an explicit `scope`. [Semaphore proof API](https://js.semaphore.pse.dev/functions/_semaphore_protocol_proof.generateProof.html)

### 5. An application contract verifies and counts

The Semaphore verifier confirms the proof and nullifier. A separate application contract must define:

- valid choices;
- open and close conditions;
- whether roots may change;
- tally semantics;
- cancellation and tie rules; and
- whether an accepted result may execute anything.

Anyone can make such a contract binding, but that binding behavior is custom application logic—not a Semaphore guarantee.

## What privacy it does and does not provide

| Property | Semaphore V4 |
|---|---|
| Hide which eligible member signaled | Yes, within the effective anonymity set |
| Hide whether an address submitted a transaction | No, unless a relayer/private transport is used correctly |
| Hide the signal or vote choice | No |
| Hide the running tally | No |
| Stop a second vote in one scope | Yes, through nullifier uniqueness |
| Establish one human per commitment | No |
| Prevent a voter proving how they voted | No |
| Permit coercion-resistant revoting | No native mechanism |
| Produce a tally or execute a proposal | No; application responsibility |

The effective anonymity set can be much smaller than the nominal group. Timing, a unique relayer path, a small active subset, public registration order, or an organizer-held identity map can all narrow it. EFS should describe the privacy claim as **unlinkability within a named eligible set**, not “anonymous voting” without qualification.

Because the option is public and a voter can disclose their secrets or local state, Semaphore is not receipt-free. It should not be presented as an anti-bribery system.

## Ethereum and L2 support

Semaphore is EVM-native rather than Ethereum-mainnet-only. Its official deployment registry includes Ethereum and Sepolia plus EVM networks such as Arbitrum, Optimism, Polygon, Base, Linea, Gnosis, and associated testnets. A project can also deploy its own contracts. [Official deployed-contract registry](https://github.com/semaphore-protocol/semaphore/blob/main/packages/utils/src/networks/deployed-contracts.json)

An L2 lowers verification and signaling cost, but adds that L2’s sequencer, upgrade, data-availability, censorship, bridge, and finality assumptions. EFS must name the exact chain and finality basis rather than treating all EVM verification as equivalent to Ethereum L1.

## Maturity as of 2026-07-28

Semaphore is one of the more mature reusable ZK primitives in the Ethereum ecosystem:

- the maintained line is V4; the repository published `v4.14.3` on 2026-07-08; [release](https://github.com/semaphore-protocol/semaphore/releases/tag/v4.14.3)
- the V4 trusted-setup ceremony completed on 2024-07-13 with more than 400 participants;
- official audit references cover V2, V2.5, V3, and V4, with the V4 review covering circuits, contracts, and libraries; and
- the repository is MIT licensed. [Documentation, setup, and audit index](https://docs.semaphore.pse.dev/) · [license](https://github.com/semaphore-protocol/semaphore/blob/main/LICENSE)

That supports “mature primitive,” not “pre-certified election system.” An EFS pilot must pin the exact circuit, proving key, verification key, verifier bytecode, library versions, and application contract. A V4 audit does not automatically cover an EFS-specific membership bridge, tally, relayer, UI, or upgrade configuration.

The ecosystem-authored [State of Private Voting 2026](https://pse.dev/articles/state-of-private-voting-2026/state-of-private-voting-2026-v2.pdf) also classifies Semaphore V4 as high in implementation maturity, while correctly noting that it offers no ballot secrecy or coercion resistance. That report is useful comparative synthesis, not independent certification.

## Ideological fit

Semaphore aligns well with EFS when the principle is:

> Publish the rules and evidence; minimize public identity disclosure; let any compatible verifier check the claim.

It is less ideologically complete when the principle is:

> No administrator, issuer, relayer, or human authority should ever matter.

Somebody or some rule still defines the group. A contract can make group updates transparent, delayed, or immutable, but it cannot prove that one leaf equals one eligible human without an external identity or membership institution.

Semaphore also makes a useful separation:

- eligibility can be a political/institutional decision;
- membership proofs can be cryptographic and unlinkable; and
- tally/execution can be deterministic application code.

EFS should preserve that separation instead of pretending a Merkle root settles legitimacy.

## EFS integration design

### Recommended boundary

Build a sibling `SemaphorePoll` application/profile, not a kernel feature:

1. An eligibility process produces a list of Semaphore identity commitments.
2. A root is frozen before the poll opens.
3. EFS publishes a poll manifest that binds the root, scope derivation, verifier, choices, timing, tally, and chain.
4. Voters generate proofs locally and submit directly or through plural relayers.
5. A contract verifies proofs and emits accepted signals/nullifiers.
6. EFS publishes the final evidence package and result.

EFS is the reproducible package and evidence layer. Ethereum is the proof-verification and ordering layer. The membership authority remains explicitly named.

### Artifacts EFS should preserve

- poll question, options, consequences, quorum, tie, cancellation, and close rule;
- eligible-group root and reproducible membership-basis manifest;
- canonical scope derivation and test vectors;
- Semaphore release and commit;
- circuit source hash, circuit parameters, proving key, verification key, and trusted-setup provenance;
- verifier and poll-contract addresses, bytecode hashes, ABI, chain ID, and upgrade/admin state;
- frontend source/build closure and wallet/relayer protocol;
- accepted signal/nullifier log and finality checkpoint; and
- deterministic tally implementation, result, and independent replay instructions.

### Artifacts EFS should not preserve

- identity secrets;
- a person-to-commitment or address-to-commitment mapping;
- private credential-delivery logs;
- IP/network metadata; or
- a convenient permanent dataset that needlessly shrinks the anonymity set.

### EFS v2 implications

No new frozen EFS kernel schema is justified. The useful requirements are generic:

- content-addressed package closure;
- explicit chain/finality bindings;
- typed poll/profile manifests;
- detached signatures and attestations;
- privacy-aware publication policy; and
- the ability to distinguish proposed, open, closed, finalized, challenged, and superseded artifacts.

These benefit every voting backend.

## Best pilot

Use Semaphore for a low-stakes, non-secret EFS member poll:

> “Which example should appear first in this folder next week?”

Use a small, frozen eligible group, equal weight, two choices, no automatic execution, a short-lived EVM testnet deployment, and two independent relayer/direct-submission paths. Publish the complete verifier closure and have a second implementation replay the accepted signals.

Call it:

> “anonymous-membership, public-choice signaling”

Do not call it a secret ballot or one-person-one-vote unless a separate eligibility system actually establishes those properties.

## Suitability

| Use case | Suitability | Reason |
|---|---|---|
| Daily harmless folder poll | **Good**, if anonymous participation is worth the proof overhead | Clean one-credential/one-signal primitive |
| Anonymous non-secret opinion poll | **Very good** | Its strongest native fit |
| Consequential EFS community decision | **Prototype first** | Needs frozen membership, complete tally contract, recovery, and governance rules |
| Ethereum DAO vote | **Useful component** | Requires a binding governor/execution adapter |
| Private organizational election | **Insufficient alone** | Choices and tally are public; no coercion resistance |
| Binding public election | **Do not use alone** | No voter registry, secret ballot, election administration, accessibility, or legal process |

**Disposition:** **prototype as an optional backend/primitive**. Semaphore is a strong ingredient, not the whole recipe.
