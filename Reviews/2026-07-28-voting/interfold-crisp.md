# Interfold / CRISP — the strongest new Ethereum secret-ballot candidate, still testnet

**Reviewed:** 2026-07-28
**Status:** point-in-time research profile; factual claims use current Interfold and Aragon documentation, source, releases, and launch notices; recommendations are EFS analysis
**Naming:** Enclave renamed to The Interfold in 2026; older reports and URLs may still say Enclave
**Scope:** CRISP reference implementation, Interfold E3 network, and the June 2026 Aragon OSx testnet integration

#kind/research #status/done #repo/planning #topic/efsv2 #topic/privacy #topic/governance #topic/voting #topic/zk #topic/fhe

## Bottom line

CRISP is the most interesting newly available Ethereum-aligned private-voting design found in this update:

- ballots are encrypted client-side;
- FHE computes over the encrypted ballots;
- only an aggregate tally is decrypted;
- a threshold committee, rather than one coordinator, controls keys;
- ZK proofs check ballot formation, distributed key operations, computation, and decryption;
- vote masking is designed to provide receipt-freeness and reduce participation/timing leakage; and
- an Aragon OSx plugin can connect an accepted secret result to onchain execution.

That is closer to EFS’s no-single-plaintext-holder goal than MACI’s single coordinator: no one operator should learn all votes or determine a valid tally alone, although a compute provider can still block completion.

It is not finished enough to displace MACI, Semaphore, Snapshot, or Governor today:

- Aragon explicitly calls the integration **testnet form** and says production paths will follow the Interfold network rollout;
- the current demo identifies itself as Sepolia;
- Interfold’s July 2026 launch material says Network Alpha is not yet live and production ciphernode participation is not open;
- Interfold says protocol audits and Network Alpha preparation are still in progress;
- no public exact-deployment audit map or representative production-scale benchmark was found;
- the open CRISP stack includes a coordination server, compute provider/prover, committee network, contracts, circuits, and multiple liveness windows; and
- its reference local configuration defaults to an insecure development BFV preset and skipped/mock proof aggregation, which must never be confused with a production profile.

**EFS verdict:** move CRISP from “watch” to **high-priority prototype**. Build an evidence-packaging adapter around the existing Sepolia demo or a controlled local deployment. Do not give it binding EFS authority or make production privacy claims until Network Alpha, production parameters, audits, operator diversity, benchmarks, and failover have public evidence.

## What changed in June–July 2026

The 2025 PSE/Shutter survey described Enclave/CRISP as low-maturity research/devnet work. That is now stale in one important respect.

On 2026-06-30, Aragon and Interfold announced:

- a dedicated CRISP governance plugin for Aragon OSx;
- a public Sepolia/testnet implementation;
- encrypted ballot submission;
- threshold committee key generation and aggregate decryption;
- FHE tallying with verifiable computation; and
- optional execution of an approved onchain payload through the DAO.

[Aragon/Interfold testnet announcement](https://blog.aragon.org/verifiable-secret-ballots-with-interfold-and-aragon/) · [Sepolia demo](https://dao.theinterfold.com/)

The same announcement is equally clear that:

- easier deployment and more workflows are future work; and
- “production deployment paths will follow Interfold’s network rollout.”

The current launch sequence is not complete. Interfold’s July launch notice separates the FOLD auction, token transferability, and Network Alpha, and explicitly states that Network Alpha and production ciphernode participation are not yet live. [Interfold launch sequence](https://blog.theinterfold.com/fold-auction-uniswap/) · [ciphernode status](https://blog.theinterfold.com/what-are-ciphernodes-confidential-coordination/)

So “available” means **available to demo and prototype on testnet**, not general production availability.

## Architecture

### Interfold and E3s

The Interfold is a general encrypted-computation network. An application requests an Encrypted Execution Environment, or E3, which moves through an onchain state machine:

1. requested;
2. committee selected;
3. distributed key generated and published;
4. encrypted inputs accepted;
5. encrypted computation completed;
6. threshold decryption completed; or
7. failed with an explicit reason and refund path.

The onchain protocol coordinates state and verifies proofs. Offchain ciphernodes perform distributed key operations. A compute provider evaluates the application’s FHE program and supplies verifiable computation evidence. [Interfold architecture](https://docs.theinterfold.com/architecture-overview) · [cryptographic flow](https://docs.theinterfold.com/cryptography)

### CRISP ballot setup

A CRISP round defines:

- eligibility root;
- choices and tally program;
- open/close conditions;
- committee size and threshold;
- compute provider/proving system;
- decryption conditions; and
- optional Aragon execution payload.

The current implementation uses an address-based voter census represented by a Merkle tree. A voter proves an ECDSA-authorized address is included without exposing the authentication witness inside the circuit. That proves eligibility under the published root; it does not establish that each address is one person or that the issuer chose a fair electorate.

### Encrypted ballots

The client encrypts the vote under the committee’s threshold BFV public key. A Noir proof establishes that:

- encryption used the correct key;
- the voter is eligible;
- the plaintext is a valid option; and
- the state update is valid.

The contracts verify the proof and maintain accepted encrypted state in a Merkle structure. [CRISP documentation and source map](https://docs.theinterfold.com/CRISP/introduction) · [public implementation](https://github.com/theinterfold/interfold/tree/main/examples/CRISP)

### FHE tally and proof

The current CRISP example homomorphically sums BFV ciphertexts inside a RISC Zero guest program. A proof binds the computation to the accepted-input Merkle root, program parameters, and encrypted output. The contract verifies the computation proof before accepting the encrypted tally.

This is stronger than asking a tally server to publish a number: correctness is intended to be verified even though the input values remain secret.

### Threshold decryption

Ciphernodes are selected by sortition and run publicly verifiable distributed key generation. No complete secret key is assembled in one operator. After close, enough committee members publish verifiable partial decryptions of the permitted output; an aggregator combines them into the plaintext tally.

This separates:

- **correctness:** proofs should reject malformed ballots, incorrect computation, and invalid decryption shares;
- **privacy:** fewer than the privacy threshold must collude or leak key material; and
- **liveness:** enough selected operators and the compute provider must complete each phase before timeout.

“No trusted tallier” is defensible as a correctness goal. “No trust assumptions” is not.

## Vote masking and coercion claims

CRISP’s distinctive feature is a ZK OR-proof over two indistinguishable paths:

1. an eligible voter submits or updates a valid encrypted choice; or
2. any masker adds a fresh encryption of zero to a slot.

Both update the same encrypted state and produce structurally equivalent proofs. A watcher cannot reliably tell whether an apparent update was a real vote change or a zero mask. Masks may also target empty slots. [Vote-masking design](https://blog.theinterfold.com/vote-masking-receipt-freeness-secret-ballots/)

The intended benefits are:

- the voter can later change a coerced choice;
- the observed transaction need not reflect the final choice;
- timing and participation become less reliable;
- a ciphertext is less useful as a receipt; and
- forced abstention is harder to prove.

This is materially stronger than permanent encryption alone and stronger than deployed Shutter temporary privacy.

The correct maturity label is still **promising coercion-resistance design**, not settled real-world coercion resistance. Interfold’s own analysis names constraints:

- mask operations cost gas and require incentives/activity;
- an attacker may coerce a transaction at the end of the window;
- state-update races can make a proof stale; and
- the effectiveness of anonymity and deniability depends on actual masking traffic.

It also does not by itself defeat a coercer who controls a voter’s device, account, recovery channel, or physical environment for the entire election.

## Roles and trust

| Role | Can it falsify a proved result alone? | Can it harm privacy or liveness? |
|---|---|---|
| Poll/DAO administrator | Should not bypass proof checks; can choose rules, electorate, modules, and upgrades | Yes, through configuration and admin power |
| Coordination server | Clients may bypass it and transact directly | Can degrade UX or censor users who rely only on it |
| Compute provider | Incorrect output should fail proof verification | Can delay or withhold computation |
| One ciphernode | No complete decryption key | Can withhold; learns protocol metadata |
| Threshold of ciphernodes | Proofs constrain output correctness | Can compromise ballot privacy/key-release policy |
| Too few responsive ciphernodes | Cannot forge a valid tally | Can prevent completion |
| Ethereum/Sepolia/L2 | Orders contract state and verifies proofs | Chain censorship, finality, and upgrade assumptions apply |
| Voter client | Produces ballot and proof | A compromised client can expose or alter intent before proof generation |

The protocol includes explicit timeouts, failure reasons, refund logic, bonding, slashing, and planned permissionless operator entry. Those are good engineering signals. They do not make the current Sepolia committee a production decentralized network.

## Maturity as of 2026-07-28

### Positive evidence

- Full-stack public source: EVM contracts, Rust services, FHE code, Noir circuits, SDK, client, tests, and CRISP example.
- Active maintained repository and unified `v0.4.0` release on 2026-07-19.
- LGPL-3.0-or-later license.
- Public Sepolia demo and Aragon OSx testnet plugin.
- Documented direct-chain bypass for the coordination server.
- Documented E3 state machine, failure reasons, timeout configuration, operator selection, proofs, and slashing design.

[Interfold repository](https://github.com/theinterfold/interfold) · [`v0.4.0` release](https://github.com/theinterfold/interfold/releases/tag/v0.4.0) · [license](https://github.com/theinterfold/interfold/blob/main/LICENSE.md)

### Missing production evidence

- Network Alpha/mainnet availability and permissionless production operators;
- exact testnet and future production contract addresses/code hashes in one canonical deployment manifest;
- public operator count, independence, threshold, geographic/provider diversity, and uptime history;
- exact audit reports mapped to deployed contracts, circuits, FHE parameters, zkVM image, SDK, and Aragon plugin;
- production-safe cryptographic parameters and proof-aggregation configuration;
- representative browser/mobile proving time, ciphertext size, gas per vote/mask, committee setup time, tally proving time, and total finalization latency;
- load tests by voter count and option count;
- independent verifier or implementation;
- high-stakes completed governance history; and
- a demonstrated recovery/rerun process after committee, computation, or decryption failure.

No representative current benchmark or complete public audit index was found in primary project materials reviewed.

### Development-profile warning

The public CRISP quick start defaults to:

- BFV preset `insecure-512`; and
- skipped proof aggregation with a mock verifier for local development.

The docs explain how to enable production-style RISC Zero/Boundless proving. An EFS prototype must record which path actually ran. A successful demo using development flags is not evidence of cryptographic production readiness. [CRISP quick start/configuration](https://github.com/theinterfold/interfold/tree/main/examples/CRISP)

## Ideological comparison with MACI

CRISP matches the **no single plaintext holder** goal better than MACI if its network reaches the intended form:

- no single coordinator sees the plaintext ballot set;
- only the aggregate should be decrypted;
- public proofs cover key operations, computation, and decryption;
- operator selection is designed to be permissionless and economic; and
- masking aims at receipt-freeness without one coordinator’s secret overwrite knowledge.

MACI is presently stronger in:

- deployment history;
- grants/governance use;
- exact protocol familiarity in the Ethereum ZK ecosystem;
- simpler role topology;
- published iterations and operational knowledge; and
- availability today.

The trade is not “trust versus no trust.” It is:

- MACI: one highly privileged but accountable coordinator, mature anti-collusion workflow;
- CRISP: threshold-distributed privacy, but liveness still depends on sufficient ciphernodes and a compute provider; broader cryptographic stack and earlier operations.

## EFS integration

### Recommended boundary

Use a versioned `interfold-crisp` poll profile outside the EFS kernel:

1. EFS publishes and freezes the poll package.
2. An EFS-to-address adapter derives a reproducible eligible-set root.
3. CRISP creates an E3 bound to that root and poll digest.
4. Voters submit directly or through multiple relayers.
5. Interfold produces the proved encrypted tally and threshold-decrypted aggregate.
6. EFS publishes result evidence.
7. Only after later validation may a narrow adapter execute a precommitted EFS action.

### Evidence closure EFS should preserve

- question, choices, consequence, quorum, tie, cancellation, and close rules;
- eligibility source, root, snapshot/finality basis, and address-binding policy;
- Interfold and CRISP release/commit, contracts, circuits, SDK, client, and server;
- BFV parameter set and security rationale;
- Noir circuit artifacts and verifier code hashes;
- zkVM program/image ID, source closure, proof system and prover route;
- E3 request, committee, threshold, sortition evidence, DKG proofs, and public key;
- accepted ciphertext-state root and input-count evidence;
- computation proof and encrypted aggregate;
- decryption shares/proofs and plaintext tally;
- Aragon DAO/plugin/permission and execution payload;
- chain and finality checkpoint; and
- exact development/production feature flags.

### Privacy-aware storage

EFS should not automatically mirror raw per-voter ciphertexts and address-linked metadata forever. Preserve the minimum independently verifiable public closure:

- accepted-input Merkle root;
- inclusion/availability commitments;
- aggregate ciphertext;
- proofs;
- final tally; and
- protocol/config artifacts.

Whether complete ciphertext availability is necessary for independent recomputation must be resolved before a binding pilot. If it is necessary, document the long-term privacy trade explicitly.

### What EFS cannot remove

EFS cannot:

- make the ciphernode network diverse;
- force committee participation;
- protect a compromised voter device;
- decide legitimate eligibility;
- make mask traffic appear;
- validate cryptographic parameters by persistence alone;
- turn a Sepolia demo into mainnet operations; or
- substitute for external audits and adversarial trials.

## Validation plan

Run four bounded phases:

1. **Reproduction:** build `v0.4.0`, run CRISP locally with development flags, and reproduce a binary poll.
2. **Real-proof profile:** repeat with production-safe BFV parameters, proof aggregation enabled, and RISC Zero/Boundless proof verification; measure every stage.
3. **Sepolia EFS adapter:** freeze an EFS member root and poll package, submit through direct and coordinated paths, replay from a clean machine, and force every documented timeout/failure branch.
4. **Adversarial governance pilot:** independent operators, meaningful mask traffic, key rotation, late coercion simulation, committee withholding, UI/API outage, and a reversible Aragon action.

Do not progress toward binding EFS authority until phases 1–3 are independently reproducible, the exact deployed stack has audit coverage, and EFS has separately adopted a generic native external-result authority adapter.

## Suitability

| Use case | Suitability now | Potential |
|---|---|---|
| Daily harmless folder poll | Technically possible, excessive overhead | Useful as a test harness |
| Anonymous non-secret opinion poll | Overkill | Semaphore is simpler |
| Consequential EFS decision | **Prototype only** | Potentially excellent |
| Ethereum DAO vote | Testnet pilot | Strong secret-binding candidate |
| Private organizational election | Research/testnet only | One of the best Ethereum-aligned directions |
| Binding public election | Do not use | Requires much more than protocol maturity |

**Disposition:** **high-priority prototype and watch for Network Alpha; not production adoption yet.**
