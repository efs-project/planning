---
agent: codex-gpt-5
date: 2026-07-28
status: done
anchors:
  - area: governance
  - area: efsv2
  - area: privacy
  - review: 2026-07-28-voting
source: Comparative synthesis of current voting-system project reviews
---

# Ethereum-aligned voting systems: comparative decision

#kind/research #status/done #repo/planning #topic/governance #topic/privacy #topic/onchain #topic/efsv2

## Direct answer

The four named alternatives and the leading shortlisted Ethereum candidates had not previously been researched to the same depth as Vocdoni. They now have enough primary-source review for an **architecture and pilot decision**, but not for a production launch or public-election certification.

There is no universal winner:

- **MACI v3 is the strongest current Ethereum-native choice when anti-collusion and private choices justify operational complexity.**
- **OpenZeppelin Governor is the strongest mature EVM baseline for public, binding, executable governance.**
- **Snapshot Classic is the most practical finished product for cheap, low-stakes opinion polling.**
- **Semaphore is the strongest mature Ethereum primitive for anonymous membership with a public choice.**
- **Shutter is the simpler deployed option when choices need only remain hidden until the poll closes.**
- **Interfold/CRISP is the most interesting emerging private-EVM direction without one plaintext-holding coordinator, but is still testnet-stage and retains committee/compute-provider liveness dependencies.**
- **DAVINCI is also architecturally attractive for distributed private voting, but remains a research/prototype integration.**
- **Belenios is the strongest mature non-EVM cryptographic organizational-voting baseline.**
- **ElectionGuard is the strongest paper-backed official-election research direction.**
- **Decidim is the strongest civic participation/process layer in this set, but not a cryptographic ballot system.**

For a daily EFS “hotdog or hamburger” poll, MACI is the wrong default. Use a native public EFS poll or Snapshot Classic; add Semaphore only if unlinking voters from their public choices is worth the extra ceremony.

For a consequential private EFS community vote, MACI v3 is the leading system to prototype now. EFS can make the election definition and verification package durable. It cannot yet let a foreign voting contract mutate a folder automatically: current v2 authority requires an explicit EFS witness/adapter, so the first integration must be evidence-only or binding-manual. EFS also cannot remove MACI’s coordinator or turn EFS membership into legitimate one-person-one-vote by itself.

No reviewed system should presently be proposed as a standalone platform for a binding Chicago public election.

## These systems are not all substitutes

| Category | Systems | What the category answers |
|---|---|---|
| Public opinion/signaling | native EFS poll; Snapshot Classic | What did participating members publicly prefer? |
| Anonymous authorization primitive | Semaphore | Did one eligible but unnamed group member submit this public signal? |
| Public EVM governance and execution | OpenZeppelin Governor; Snapshot X; Aragon OSx plugins | Did a public onchain electorate authorize this exact EVM action? |
| Temporarily shielded voting | Shutter | Can choices and the running tally remain hidden until close? |
| Anti-collusion private voting | MACI | Can voters privately revise their choice so a buyer cannot reliably know which vote ultimately counted? |
| Distributed private computation | Interfold/CRISP; DAVINCI | Can private tallying avoid one party holding all ballot plaintext while distributing computation and key roles? |
| Organizational election system | Belenios | Can an organization run a mature, verifiable secret-ballot election? |
| Paper-backed public-election protocol | ElectionGuard | Can cryptographic evidence supplement a supervised, paper-backed election? |
| Civic participation platform | Decidim | How are proposals, debate, phases, budgeting, communications, and institutional accountability organized? |

## Comparative matrix

“Private” is deliberately decomposed. A system that hides the running tally, one that hides the voter’s identity, and one that hides the final individual ballot provide different political properties.

| System | Ethereum/EVM role | Voter/choice visibility | Correctness and execution | Decisive remaining trust or liveness role | Current maturity | EFS disposition |
|---|---|---|---|---|---|---|
| Native EFS signed poll | EFS-native, not necessarily EVM | Public or pseudonymous | Deterministic EFS replay; execution must be separately scoped | EFS discovery, finality and authority design | Design only in v2 | Build first for harmless polls |
| Snapshot Classic | Wallet signatures; offchain Hub/IPFS and strategy evaluation | Normally public wallet and choice | Reproducible signaling if all messages and strategy inputs survive; not natively binding | Hub admission/availability and external strategy data | High product maturity | Optional low-stakes backend |
| Semaphore V4 | EVM group and Groth16 proof verification | Member-to-signal link hidden; choice normally public | Proves eligible group membership and one scoped signal; application supplies tally/execution | Membership issuance, group administration, relaying and custom application logic | High as a primitive | Prototype `anonymous-signal` |
| OpenZeppelin Governor | Fully onchain EVM voting and exact execution | Public address, weight and choice | Deterministic onchain count and permissionless execution | Electorate construction, chain, module/controller and upgrade design | High library maturity | Binding EVM reference |
| Snapshot X | Modular fully onchain EVM/Starknet path | Public by default | Onchain voting, modules and execution | Space controller, chosen modules, chain and exact-version maturity | Active and deployable; less proven than Classic/Governor | Testnet pilot |
| Aragon OSx | Modular EVM DAO, permission and plugin framework | Depends on plugin; TokenVoting/AddresslistVoting are public | Installed plugin can authorize exact DAO actions | DAO permission graph, plugin, upgrades and electorate | Mature framework; each voting plugin differs | Consider when EFS needs a multi-plugin organization, not as one ballot protocol |
| Shutter shielded voting | Threshold encryption integrated with Ethereum applications | Choice hidden until close, then revealed | Prevents early public tally; host application still determines vote/result semantics | Threshold Keyper network must release keys | Deployed integration | Use only for hidden-until-close |
| MACI v3 | EVM contracts verify ZK state-processing and tally proofs | Hidden from public; coordinator can decrypt individual messages | Coordinator cannot publish a false accepted tally proof; a passing result can feed a narrow adapter | One coordinator can see ballots and can prevent completion | Released; core audit and documented bounded setup exist, but exact mode/artifact reconciliation and v3 operations remain gates | Leading private EVM prototype |
| Interfold/CRISP | EVM contracts plus threshold FHE/MPC and proof infrastructure | Intended private from any single node; aggregate is revealed | Distributed private computation and verification | Threshold ciphernodes and compute-provider availability; exact coercion claim and production posture remain to validate | Sepolia/testnet; production rollout and audits pending | Watch and prototype, no authority yet |
| Vocdoni DAVINCI | EVM-verifiable ZK/threshold architecture | Intended secret ballot under distributed roles | Distributed design aims at verifiable tally without one coordinator | Exact network, availability, integration and deployment maturity | Research/prototype integration | Comparative prototype only |
| Belenios 3.3 | Non-EVM cryptographic election server and public archive | Encrypted ballots; organizer/credential and metadata boundaries remain | Public archive, ballot proofs and threshold tally verification | Election server for admission/availability; credential authority and trustees | High organizational-use maturity | Non-EVM secret-ballot baseline |
| ElectionGuard | Non-EVM election record; optional commitments could be anchored | Encrypted electronic ballot plus voter-verifiable paper in the strongest profile | End-to-end evidence complements audits and recountable paper | Election administration, devices, guardians, paper chain of custody and law | Strong research/specification direction; implementation profiles fragmented | Official-election evidence comparator |
| Decidim 0.32 | No material EVM role by default | Current Elections module is not a cryptographic secret-ballot protocol | Institutional workflow and public accountability, not cryptographic tally assurance | Platform operator, database and configured civic process | Mature civic platform | Process shell around a separate backend |

Release or component maturity is not election readiness. Every consequential use still needs an exact deployment, electorate, client, accessibility process, operational rehearsal, incident procedure and independent verification.

## MACI v3 in more detail

### How it works

A MACI poll combines:

1. an eligibility gatekeeper and voice-credit policy;
2. per-voter MACI keys and an onchain signup/state commitment;
3. encrypted, signed vote messages addressed to a coordinator;
4. a rule that lets a voter publish later key changes or votes so an earlier coerced or purchased instruction need not be the one counted;
5. an offchain coordinator that decrypts messages, processes the state tree and computes the tally; and
6. EVM contracts that accept zero-knowledge proofs of valid message processing and tally computation.

The ZK proofs are the central correctness property: the coordinator cannot simply invent a tally that contradicts the accepted messages and protocol rules. They do **not** hide messages from the coordinator and do **not** force the coordinator to publish a result.

Version 3.0.0 materially improves the integration story. It includes reusable per-poll gatekeeper and voice-credit policies, anonymous poll joining, EVM-network support, relayer/deployer/coordinator/subgraph packages, IPFS relaying, and policies for common Ethereum membership sources such as ERC-20/`ERC20Votes`, EAS, Semaphore, Merkle roots, Gitcoin Passport, Hats, Zupass and Anon Aadhaar.

The v3 trusted-setup page reports a completed small-batch ceremony for a documented bounded profile of up to 16,384 users, 25 messages per processing batch, 32 tally entries per batch and 125 options. Other tagged setup/testing pages disagree about v3 and non-QV/full-credit artifact coverage, so a pilot must reconcile and pin the exact mode, parameters, transcript and artifact hashes. The larger setup profile was not complete in the reviewed trusted-setup documentation.

### How finished is it?

MACI v3 is **finished enough for a bounded testnet or explicitly low-stakes pilot**, not finished enough to inherit production confidence without one:

- `v3.0.0` is a real tagged release from June 2026, not only a roadmap or paper;
- the trusted-setup page says the v3 small-batch ceremony is complete and the circuits can be used in production within its bounds, subject to reconciling conflicting mode/artifact documentation;
- the release includes a 2026 HashCloak review and points to earlier protocol/circuit reviews;
- the repository supplies deployer, coordinator, relayer, subgraph, SDK, CLI, circuit and contract packages; and
- the Ethereum ecosystem has substantial experience with earlier MACI versions and grant/governance experiments.

The remaining qualification is operational:

- the public case studies found in the v3 documentation are mainly earlier-version deployments;
- the network guidance says its network testing was performed with v2 and expects similar v3 results;
- shared deployed contracts do not by themselves prove a full v3 election operated end-to-end under production stakes; and
- one exact EFS-scale poll still needs measured proving cost, gas, client behavior, coordinator recovery, inclusion and independent replay.

The honest label is:

> **Released and ready for a bounded evidence-building pilot; production setup coverage and exact-v3 operations still need reconciliation and proof.**

### Is MACI ideologically better?

It depends which EFS value is being optimized.

| Value | MACI assessment |
|---|---|
| Open source and independently verifiable result | Strong |
| Ethereum composability and narrow EVM execution | Strong; automatic EFS mutation still needs an adopted native authority adapter |
| Private choices from the public | Strong |
| Private choices from the election operator | Weak: coordinator decrypts |
| Anti-vote-buying design | Stronger than public ballots or ordinary encrypted ballots |
| Permissionless completion | Weak: coordinator can withhold the result |
| No privileged human/system role | Not achieved |
| One-person-one-vote or legitimate membership | Not supplied |
| Replaceable client and durable evidence | Strong fit with EFS packaging |

Compared with public Governor/Snapshot voting, MACI is more protective of political independence but operationally less trustless. DAVINCI and Interfold/CRISP are closer to the **no single plaintext holder** goal, but neither currently provides permissionless completion and both are much earlier operationally. Compared with Semaphore, MACI is a more complete anti-collusion voting protocol but much heavier. Compared with Belenios, it is more EVM-native and more explicitly anti-collusion; Belenios has a longer record as an organizational-election product and distributes tally decryption among trustees.

The right conclusion is not “MACI is decentralized” or “MACI is centralized.” It separates properties:

- correctness is publicly ZK-verifiable;
- privacy from the public is strong under the protocol and client assumptions;
- privacy from and completion by the coordinator remain trusted; and
- political legitimacy of the electorate remains outside the protocol.

## Best choice by EFS use case

| EFS use case | First choice | Why | Avoid claiming |
|---|---|---|---|
| Daily harmless “hotdog or hamburger” poll | Native `public-replayable`; Snapshot Classic if a finished product is needed now | Cheap, understandable, independently replayable | Secret ballot; representative public opinion |
| Public choice but unlink the member | Semaphore-backed `anonymous-signal` | Mature ZK membership/nullifier primitive | Hidden choice; coercion resistance; proof of personhood |
| Hide choices and running tally only until close | Snapshot plus Shutter | Smaller requirement and deployed integration | Permanent ballot secrecy |
| Public, binding folder configuration | OpenZeppelin Governor for the EVM decision; binding-manual in EFS until a generic native adapter is adopted | Mature onchain count and exact EVM execution | That current foreign-contract state is canonical EFS authority |
| Private, anti-collusion EFS community decision | MACI v3 testnet/low-stakes pilot | Best current EVM combination of private choices, revoting and proven tally | Privacy from coordinator; guaranteed completion |
| No-single-plaintext-holder private EVM research | Interfold/CRISP, then DAVINCI | Architecturally closest to distributed ballot privacy | Permissionless completion or production maturity |
| Mature private organizational election | Belenios | Long-running election product and public verification archive | EVM-native execution; coercion resistance |
| Civic proposal and participatory-budget workflow | Decidim plus a separately selected ballot backend | Strong deliberation, phases and public institutional process | Cryptographic voting from Decidim itself |
| Statutory public election research | ElectionGuard with voter-verifiable paper and election administration | Best match for evidence, paper audit and public-election process | Internet/EVM voting replacing the election institution |

## EFS integration boundary

EFS should use a replaceable voting-backend profile:

```text
frozen EFS poll manifest + electorate basis + verifier closure
                              |
                              v
                 named external voting backend
                              |
                              v
              proof/result + finality + challenge record
                              |
                              v
      optional future narrow EFS authority adapter
```

EFS can:

- content-address the exact poll, options, policy, client, contracts, circuits, verification keys and setup provenance;
- bind an ordered basis vector across the EFS electorate/intent, backend deployment/open/result, EFS import, and any later execution;
- publish role-specific trust and privacy claims before voting;
- preserve public messages, commitments, proofs, results, challenges and independent verification instructions;
- mirror non-authoritative public inputs and frontend packages;
- after a generic EFS external-result authority design is adopted, constrain it to one precommitted reversible folder action after a delay; and
- preserve enough evidence for a verifier that does not use an EFS-operated service.

EFS cannot:

- remove the MACI coordinator, Interfold committee, DAVINCI network, Shutter Keypers, Belenios trustees or ElectionGuard guardians;
- manufacture civil identity, proof of personhood or a fair membership policy;
- guarantee that the voter’s device showed or encoded the intended option;
- turn a self-selected opinion poll into representative political research;
- adjudicate coercion, eligibility or institutional disputes; or
- safely make every private artifact permanent.

The evidence integration should remain an application/profile. None of these systems justifies embedding backend-specific fields or ZK logic in the EFS v2 kernel. Automatic mutation does expose a generic v2 design requirement: a fail-closed external-result/GATE or scoped native-actor adapter whose residual signer/oracle trust is explicit.

## Pilot sequence

1. **Native public poll:** prove complete discovery, authority, snapshot, revote, finality, tally and evidence export in EFS v2.
2. **Semaphore poll:** prove a frozen membership root, poll-scoped nullifier, plural submission paths and independent verification.
3. **MACI v3 bounded poll:** use synthetic EFS membership and a supported small-batch circuit on one selected EVM L2/testnet; measure the entire signup-to-proof workflow.
4. **Authority-bridge design:** decide whether EFS will support a generic external-result/GATE or scoped native-actor adapter. Until then, record the verified result and apply it through a separately witnessed binding-manual action.
5. **Binding adapter pilot:** only after that design is adopted, let a successful public Governor pilot—and later a successful MACI pilot—select one of two prepublished reversible folder manifests.
6. **Distributed-private comparison:** rerun the same synthetic poll on Interfold/CRISP or DAVINCI only when exact deployable artifacts and verifier instructions are available.
7. **Non-EVM baselines:** replay one Belenios election archive and one ElectionGuard synthetic record to test whether EFS’s evidence package is genuinely backend-neutral.

For MACI, the pilot is not complete until:

- two clean-room verifiers reproduce the accepted result;
- the coordinator stops in at least one rehearsal and the documented result is `FAILED` or `VOID`, not manually substituted;
- exact gas, proving time, memory, result latency and evidence size are recorded;
- signup, relayer and coordinator outages are exercised;
- the client is tested on mobile, keyboard, screen reader, low bandwidth and interrupted flows;
- the EFS principal-to-voting-credential mapping is minimized and does not become a permanent identity dossier; and
- the result adapter rejects every action except the exact manifest choices disclosed before voting.

## Research confidence and remaining questions

This review is thorough enough to rank architectural fit and select experiments. The most decision-relevant unknowns now require implementation evidence, not more product descriptions:

1. Can a clean team deploy and operate exact MACI v3 artifacts without undocumented maintainer help?
2. What are the observed end-to-end costs and failure modes for the intended EFS electorate and chosen L2?
3. Can coordinator failover be designed without exposing ballots, invalidating state or introducing an undeclared shared secret?
4. Can EFS membership be snapshotted into a MACI gatekeeper or Semaphore group without publishing a permanent principal/address map?
5. What precise privacy promise survives relayer, RPC, timing and client telemetry in a real mobile workflow?
6. Can two EFS implementations discover the same finalized poll evidence without a privileged indexer?
7. Does Interfold/CRISP complete its audits and production network launch, and what coercion/receipt claim does its deployed poll actually support?
8. Does DAVINCI ship an independently operable distributed deployment with stable EVM interfaces?
9. Which decisions should be advisory, binding-manual or binding-executable, and who has legitimate authority to choose that class?
10. What retention policy prevents EFS from turning ciphertext, membership and metadata into a permanent privacy liability?
11. Which native EFS actor or fail-closed GATE may witness a foreign result, and what signer/oracle trust remains?

Those questions should be answered by the synthetic validation program in [[efs-integration]], not by asserting that one protocol is “trustless.”
