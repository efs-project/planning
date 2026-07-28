---
agent: codex-gpt-5
date: 2026-07-28
status: done
anchors:
  - area: governance
  - area: efsv2
  - review: 2026-07-24-chicago-voting-vocdoni
  - review: 2026-07-28-voting
source: Comparative entry pointing to the full 2026-07-24 Vocdoni and DAVINCI review
---

# Vocdoni and DAVINCI

#kind/research #status/done #repo/planning #topic/governance #topic/privacy #topic/onchain #topic/efsv2

## Comparative verdict

**Category:** deployed purpose-built voting chain (legacy Vochain) plus an experimental EVM-settled voting ZK rollup (DAVINCI).

**Best at:** DAVINCI has one of the strongest long-term architectures in this set for private, verifiable, receipt-resistant EVM voting without giving one coordinator all ballot plaintext. It combines encrypted ballots, voter validity/eligibility proofs, recursive state-transition proofs, rerandomization/revoting, threshold decryption of an aggregate, and EVM settlement.

**Present limitation:** the attractive description is ahead of the integrated, independently validated product. The reviewed DAVINCI artifacts remained development/test infrastructure, with production operation, integrated DKG/threshold decryption, independent protocol audit, forced inclusion, long-term data availability, cast-as-intended verification, accessible client evidence, and independent replay still open.

**EFS disposition:** **prototype as a `private-external` backend; do not make it the default or place its cryptography in the EFS kernel.** It is unnecessary for a harmless public daily poll and not ready to authorize a consequential EFS action.

The complete point-in-time review is:

- [[Reviews/2026-07-24-chicago-voting-vocdoni/README|Vocdoni, Ethereum, EFS, and Chicago voting]];
- [[Reviews/2026-07-24-chicago-voting-vocdoni/ChicagoVocdoni|shareable technical brief]];
- [[Reviews/2026-07-24-chicago-voting-vocdoni/evidence-notes|pinned evidence and research notes]]; and
- [[Reviews/2026-07-24-chicago-voting-vocdoni/folder-poll-question-resolution|folder-poll decisions and validation gates]].

## Why it is not the same thing as MACI

| Dimension | DAVINCI target | MACI v3 |
|---|---|---|
| Off-chain privileged role | A sequencer/key-warden network with threshold responsibilities | One coordinator in the ordinary deployment |
| Who can learn ballots | Intended threshold design avoids any one party holding the full decryption key and tallies homomorphically | Coordinator decrypts and processes individual messages |
| False tally | ZK state/tally proofs should prevent it | ZK message-processing/tally proofs should prevent it |
| Result liveness | Requires sufficient sequencer/warden participation and a complete integrated protocol | Coordinator can withhold the result or lose the key |
| Receipt resistance | Rerandomization plus stealth overwrite/revoting is intended to frustrate receipts | Key changes and later valid commands make a coerced message non-final |
| Ethereum relationship | Specialized voting rollup settling commitments/proofs to an EVM domain | Voting contracts and encrypted message commitments/events on an EVM domain; tally computation off-chain |
| Maturity | Prototype/test-stage successor; medium implementation maturity in the 2026 PSE/Shutter landscape report | Tagged v3 implementation with documented bounded setup artifacts that still need mode/provenance reconciliation, plus repeated earlier-version deployments; materially more mature |
| Integration cost | High: rollup/sequencer/DKG/prover/DA lifecycle | High: coordinator/prover/contracts/gatekeeper/relayer lifecycle, but more packaged today |

The ideological trade is therefore real:

- DAVINCI aims closer to **avoiding one plaintext-holding privacy authority**, which fits part of EFS’s walk-away aspiration; sequencer/key-network liveness and forced inclusion remain unresolved.
- MACI is the more credible **near-term Ethereum integration**, but asks the community to trust a coordinator for ballot privacy and completion.

Neither produces a human-free institution. Eligibility, agenda setting, client correctness, credentials, upgrades, disputes, and the meaning of the outcome remain social and operational.

## Minimum EFS experiment

Use a synthetic electorate and a nonbinding poll. Pin:

1. the final poll manifest and eligibility commitment;
2. settlement chain, contract addresses, code commits, circuit digests, verification keys, and setup provenance;
3. sequencer/key-warden roster and threshold;
4. accepted state roots, proofs, finality basis, aggregate result, and verifier output;
5. the exact independently runnable verifier closure.

Do not default to permanently pinning real membership, network metadata, decryption material, or every long-lived individual ciphertext. Auditability and future ballot confidentiality must be designed together.

## Current evidence

- Full local review: [[Reviews/2026-07-24-chicago-voting-vocdoni/README]]
- [DAVINCI paper repository, pinned review commit](https://github.com/vocdoni/davinci-paper/tree/467dc62f0e82426fd6ca6a294d6673edba7762f1)
- [DAVINCI contracts, pinned review commit](https://github.com/vocdoni/davinci-contracts/tree/719d9a8d2d92af5abb589ed6edab763629692071)
- [State of Private Voting 2026](https://pse.dev/articles/state-of-private-voting-2026/state-of-private-voting-2026-v2.pdf), especially pp. 37–41; use as comparative ecosystem analysis rather than certification
