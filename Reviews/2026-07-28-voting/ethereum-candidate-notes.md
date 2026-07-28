# Ethereum voting candidate triage — 2026-07-28

**Reviewed:** 2026-07-28
**Status:** done; primary-source candidate map and scope decisions for the project profiles in this folder
**Scope:** Ethereum/EVM-aligned voting protocols, primitives, governance frameworks, and product layers relevant to EFS

#kind/research #status/done #repo/planning #topic/efsv2 #topic/privacy #topic/governance #topic/voting #topic/onchain

## Bottom line

There is no single “best Ethereum voting system.” The strongest current candidates solve different layers:

| Need | Strongest current candidate | Readiness |
|---|---|---|
| Low-cost public opinion polling | Snapshot Classic | Production product |
| Anonymous membership, public choice | Semaphore V4 | Mature primitive |
| Public binding EVM execution | OpenZeppelin Governor | Mature library/deployment pattern |
| Mature temporary hidden tally | Shutter + Snapshot | Production product with explicit keyper assumptions |
| Anti-collusion/private grants voting | MACI V3 | Released specialist protocol; exact v3 production profile and operations remain early |
| General ZK rollup-style private election | Vocdoni DAVINCI | Active advanced prototype/preproduction direction |
| Permanent-secret, threshold/FHE Ethereum vote | Interfold CRISP | Sepolia/testnet prototype; highest-priority new watch |
| Modular DAO permissions/execution | Aragon OSx | Mature framework, not itself one ballot protocol |

The most honest EFS architecture is therefore a **voting-backend profile interface**, not one frozen voting engine.

## Included project profiles from this research pass

### [Semaphore](./semaphore.md)

Included because it is the strongest mature Ethereum-native anonymous-group signaling primitive. It is ideal for “one eligible credential, one public signal” and composes naturally with an EFS member-root manifest. It is not a secret ballot, tally, or governor.

### [Snapshot](./snapshot.md)

Included because it is the most finished low-friction Ethereum governance product. The profile distinguishes Classic offchain signaling, SafeSnap optimistic execution, Snapshot X fully onchain execution, and Governor frontend/relayer support.

### [OpenZeppelin Governor and Cactus](./openzeppelin-governor.md)

Included as the mature binding EVM baseline. Cactus—formerly Tally—is treated as a replaceable UI/indexer/operations layer, not the source of authority.

### [Shutter Governance](./shutter-governance.md)

Included because its temporary Snapshot ballot shielding is a genuinely deployed privacy product. The permanent-secret and onchain-governor variants are kept separate as PoC/roadmap work.

### [Interfold / CRISP](./interfold-crisp.md)

Promoted from watchlist to a full profile after the 2026-06-30 Aragon integration announcement. It is now a public Sepolia/testnet implementation of permanent-secret, FHE-computed, threshold-decrypted, ZK-verifiable voting with an Aragon execution plugin. It remains preproduction: Network Alpha and production ciphernode participation are not live as of this review.

## Aragon OSx: included as framework context, not a separate ballot recommendation

Aragon OSx is a serious active EVM governance framework:

- a DAO contract holds assets and executes actions;
- a permission manager defines who or which plugin may do what;
- installable/upgradable plugins supply token voting, multisig, address-list voting, administration, and custom governance;
- the current core repository is AGPL-3.0-or-later and publishes deployment artifacts;
- the audit index covers core releases including v1.4; and
- current development remains active. [Aragon OSx repository and audit index](https://github.com/aragon/osx)

It is relevant to EFS for two reasons:

1. it is an alternative binding execution/permission framework to OpenZeppelin Governor; and
2. it is the host for current MACI and CRISP private-voting integrations.

It is not one cryptographic voting scheme. Its privacy, electorate, tally, upgrade, and execution properties depend on the installed plugin and permission graph. For a simple public binding EVM action, OpenZeppelin Governor is the narrower reference baseline; importing either result into EFS remains binding-manual until the generic authority bridge is resolved. For a modular organization with multiple governance plugins, Aragon OSx may be the better product/framework fit.

The older joint Aragon/Aztec private-voting research remains a 2023 preliminary PoC, not a current shipping OSx privacy plugin. It used Ethereum storage proofs and Noir circuits and reported long proving times as the census grew. [General report](https://research.aragon.org/nouns.html) · [technical report](https://research.aragon.org/nouns-tech.html)

## Important candidate triage

### SIV — high real-world maturity, not Ethereum aligned

The 2026 private-voting survey gives SIV strong real-election maturity and coercion-resistance marks. Its current architecture is entirely offchain, relies on centralized vote entry/operation, has no Ethereum integration plan identified in the reviewed material, and is not fully open under an unrestricted software license.

**Decision:** compare when studying organizational/civic secret ballots; do not present it as an Ethereum/EFS backend candidate today.

### Incendia — elegant trust minimization, research-stage

Incendia uses a private proof-of-burn to establish voting power and can submit a private vote proof to Ethereum without a coordinator or decryption committee. The 2026 survey reports:

- no public testnet or mainnet deployment;
- research-stage implementation;
- roughly 300k gas for submission;
- multi-step voter flow; and
- substantial proving latency in the measured prototype.

**Decision:** watch as a minimal-trust research direction; not an EFS pilot candidate until a maintained release, public deployment, independent review, and mobile benchmark exist.

### Cicada — interesting time-lock/revoting research

Cicada explores private onchain voting using time-lock puzzles and ZK proofs, with designs for revoting and ballot secrecy. It remains better treated as protocol research than an operated voting stack.

**Decision:** watch for cryptographic design ideas; do not select as an EFS product backend.

### Kite — research protocol

Kite appears in the 2026 survey as another private-voting research direction but lacks the deployment and operations evidence of MACI, Semaphore, or deployed Shutter.

**Decision:** watch only.

### Freedom Tool — strong identity/election evidence, specialized stack

Freedom Tool has meaningful real-world use and an Ethereum-adjacent ZK identity architecture, but it is specialized around Rarimo identity/citizenship-style credentials and political parallel elections rather than a reusable EFS/DAO voting primitive.

**Decision:** study as a real-world identity-and-voting case, particularly for Chicago/civic threat modeling; do not use as the first EFS folder-poll backend.

### SafeSnap, Cactus, and Snapshot Governor support — layers, not independent protocols

- SafeSnap is an optimistic execution bridge from Snapshot Classic through Reality.eth and a Zodiac module.
- Cactus is a Governor UI/indexer/relayer/operations product.
- Snapshot Governor support is another Governor UI and relay path.

They matter operationally, but comparing them to MACI or CRISP as if each were a ballot protocol would be a category error.

### Permanent Shutter — keep separate from deployed Shutter

The homomorphic, aggregate-only-decryption Shutter design is promising. The primary announcement still describes a forked Snapshot UI PoC followed by testnet and mainnet stages. It must not inherit the maturity or usage counts of temporary Shutter Shielded Voting.

**Decision:** watch/prototype only after a current public testnet release and exact-version evidence.

## Candidate selection questions

Before picking a backend, answer these in order:

1. Is the output advisory, institutionally binding, or directly executable?
2. Must the ballot be public, anonymous-but-public-choice, hidden until close, or permanently secret?
3. Is resistance to vote buying/coercion required, or only privacy from casual observers?
4. What establishes one eligible member, one resident, one token, or one person?
5. May a voter revise a vote, and can a coercer verify the final choice?
6. Which role may learn votes, censor ballots, change membership, or prevent finalization?
7. Does Ethereum provide only a timestamp, or actual proof verification, ordering, data availability, and execution?
8. Can voters bypass every hosted frontend, relayer, sequencer, or coordinator?
9. What exact version, deployment, circuits, setup, verifier, and admin state were reviewed?
10. What artifacts must EFS preserve for an independent verifier, and which must it avoid preserving for privacy?

## Recommended EFS research sequence

1. **Snapshot Classic profile:** ship the lowest-risk daily opinion-poll experiment and complete message/result replay.
2. **Semaphore profile:** validate anonymous-membership/public-choice polling with an EFS-derived frozen root.
3. **Governor evidence profile:** validate one public EVM result with direct contract fallback; keep EFS application binding-manual while the generic external-result authority seam is unresolved.
4. **MACI profile:** test coordinator accountability, anti-collusion, signup, proving, tally, and key loss.
5. **CRISP reproduction:** run both local-development and real-proof profiles; independently replay Sepolia artifacts and measure the entire E3 lifecycle.
6. **Privacy comparison:** run the same synthetic electorate/question through Semaphore, MACI, Shutter, and CRISP and record exactly what each observer and operator learns.
7. **Only then choose a consequential backend.**

## EFS v2 design conclusion

No candidate justifies embedding voting cryptography into frozen EFS v2 schemas. The cross-backend requirements are:

- typed, versioned poll manifests;
- content-addressed implementation closure;
- explicit electorate and finality basis;
- named trust/role manifest;
- lifecycle states and challenge/supersession;
- privacy-aware artifact retention;
- chain, contract, code-hash, circuit, proving-key, and verification-key bindings;
- deterministic result replay; and
- a generic, fail-closed native authority adapter before any external result may automatically mutate EFS.

EFS should be able to prove:

> “These were the frozen rules, implementation, eligible-set basis, accepted public artifacts, verified result, and authorized consequence.”

It should not claim:

> “Therefore the electorate was legitimate, every device represented voter intent, privacy never failed, or the decision was politically valid.”

## Sources used for cross-project triage

- [State of Private Voting 2026 — PSE/Shutter, v2](https://pse.dev/articles/state-of-private-voting-2026/state-of-private-voting-2026-v2.pdf)
- [PSE announcement and project list](https://pse.dev/blog/state-of-private-voting-2026)
- each project’s current official documentation, repositories, releases, audit indexes, and deployment/launch notices linked in its profile

The PSE/Shutter report is ecosystem-authored synthesis, not independent certification. Readiness claims in these files were checked against project-primary material current to 2026-07-28.
