# OpenZeppelin Governor and Cactus — the mature EVM binding baseline

**Reviewed:** 2026-07-28
**Status:** point-in-time research profile; factual claims use official documentation, source, releases, audits, and operator announcements; recommendations are EFS analysis
**Scope:** OpenZeppelin Contracts 5.x Governor as the protocol layer and Cactus, formerly Tally, as a leading UI/operations layer

#kind/research #status/done #repo/planning #topic/efsv2 #topic/governance #topic/voting #topic/onchain

## Bottom line

OpenZeppelin Governor is the strongest established baseline for:

> public, token- or account-weighted, fully onchain EVM governance whose accepted proposal can execute a precommitted transaction payload.

It is a modular Solidity library, not a hosted voting service and not one universal Governor deployment. Each organization composes and deploys its own Governor, voting-power source, counting module, quorum rules, proposal threshold, timelock, and execution authority.

Its ideological strengths are unusually clear:

- votes, rules, state transitions, and execution are public;
- a hosted frontend is optional;
- anyone can independently index or call the contracts;
- the proposal payload can be exactly what executes; and
- timelocks make accepted actions inspectable before execution.

Its ideological weaknesses are equally clear:

- normal votes are permanently public and attributable;
- the common default is one token/delegated unit per vote, not one person per vote;
- wealth concentration and delegated power are institutional choices, not technical bugs;
- voter gas, RPC access, and chain/L2 assumptions affect participation; and
- coercion resistance and secret ballots are absent.

For a daily EFS opinion poll, Governor is too heavy. For a consequential public EVM decision and exact EVM execution, it is the best mature reference architecture in this comparison. Importing that result as canonical EFS authority is a separate unresolved v2 bridge.

**EFS verdict:** use an OpenZeppelin Governor only as an optional sibling governance authority. EFS should package the complete proposal and verification evidence and remain usable if Cactus or any other frontend disappears. Keep folder changes binding-manual until EFS adopts a generic fail-closed external-result/GATE or scoped native-actor adapter; never give that adapter arbitrary EFS writes.

## What Governor is

OpenZeppelin Contracts supplies an abstract `Governor` core and composable extensions. A typical deployment adds:

- `GovernorVotes` or another voting-power source;
- a counting module such as `GovernorCountingSimple`;
- voting delay and voting period settings;
- quorum and proposal-threshold logic;
- a timelock or other executor; and
- optional modules for late-quorum protection, super-quorum behavior, fractional voting, or storage/indexing.

The core proposal identifies:

- target contracts;
- ETH values;
- calldata payloads; and
- a description hash.

The proposal lifecycle is enforced onchain: pending, active, succeeded/defeated, queued when applicable, executed, cancelled, or expired depending on composition. [OpenZeppelin governance guide](https://docs.openzeppelin.com/contracts/5.x/governance) · [Governor API](https://docs.openzeppelin.com/contracts/5.x/api/governance) · [source](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/governance)

## Voting power and eligibility

The common `IVotes` pattern reads historical voting power at a proposal snapshot. `ERC20Votes` and `ERC721Votes` checkpoint balances and delegation so power cannot be moved after the snapshot and counted twice.

This provides:

- deterministic weight at a named block or ERC-6372 clock point;
- delegation;
- public verification; and
- direct composability with EVM contracts.

It does not provide:

- personhood;
- residency;
- non-transferable membership;
- anonymous eligibility;
- a secret vote; or
- democratic equality.

An organization can replace token voting with a custom `IVotes` source, allowlist, membership NFT, or external-root adapter. The fairness and security of that custom source become part of the election system and are not inherited from OpenZeppelin.

## Counting, timing, and execution

OpenZeppelin’s modularity is more consequential than it first appears. A Governor is not “safe” or “democratic” merely because it imports OpenZeppelin. Review must include:

- whether abstentions count toward quorum;
- quorum numerator/denominator and supply basis;
- proposal threshold;
- voting delay and voting period;
- whether votes may be changed;
- whether late quorum extends the period;
- proposal cancellation authority;
- timelock roles and delay;
- upgradeability and upgrade administrator;
- cross-chain execution assumptions; and
- any custom counting or voting-power logic.

Version 5.x includes modules for stored/enumerable proposals, fractional or overridable delegation, late-quorum protection, super-quorum behavior, timestamp/block clocks, and multiple timelock patterns. The newer `GovernorStorage` option also reduces reliance on one indexer for enumerating proposals.

An accepted proposal does not need a human multisig to translate the result. Anyone can call the permissionless execute path once the contract’s conditions are satisfied. A timelock can add a review/exit window and precisely limits what will execute to the queued payload.

## Privacy and coercion

Governor is deliberately transparent:

| Property | Ordinary Governor |
|---|---|
| Public voter address | Yes |
| Public choice and weight | Yes |
| Public running tally | Yes |
| Direct onchain inclusion path | Yes |
| Deterministic onchain result | Yes |
| Binding execution | Yes |
| Secret ballot | No |
| Receipt-freeness | No |
| Anti-collusion/coercion resistance | No |

A relayer can pay gas but does not make the vote secret. A privacy layer such as MACI, CRISP, or a future Shutter governor integration would be a distinct voting/counting architecture whose result eventually authorizes Governor-like execution.

## Maturity as of 2026-07-28

OpenZeppelin Governor is a mature library family:

- OpenZeppelin Contracts `v5.6.1` is the latest stable release at review time, released 2026-02-27; `v5.7.0-rc.0` exists but is a release candidate; [releases](https://github.com/OpenZeppelin/openzeppelin-contracts/releases)
- the repository labels the default `latest` npm line as audited and distinguishes unaudited development and release-candidate tags; [repository release policy](https://github.com/OpenZeppelin/openzeppelin-contracts)
- the public audit index contains version-specific assessments through the 5.6 line and older formal-verification work covering governance components; [audit index](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/audits/README.md)
- the package is MIT licensed; and
- the codebase remains actively maintained.

This evidence applies to the exact OpenZeppelin code covered. It does not automatically review a DAO’s inheritance graph, settings, custom modules, proxy, timelock roles, deployment ceremony, or frontend.

## Cactus, formerly Tally

Tally became the dominant specialized interface and operations layer around Governor-style DAOs. The 2026 transition needs precise wording:

1. Tally announced a platform sunset in March 2026.
2. ScopeLift took over operations on 2026-03-31, preserving active DAO data and service continuity.
3. ScopeLift renamed the platform **Cactus** on 2026-06-17.

[ScopeLift takeover announcement](https://scopelift.co/blog/scopelift-tally-operation) · [Cactus rebrand announcement](https://scopelift.co/blog/tally-is-now-cactus) · [current documentation notice](https://docs.tally.xyz/tally-is-now-cactus/)

Cactus supplies product features such as:

- proposal discovery and construction;
- voting and delegation interfaces;
- DAO and delegate dashboards;
- indexing and API access;
- transaction simulation/operations support; and
- sponsored or relayed voting flows.

The critical architecture point is:

> Cactus is not the Governor.

If the UI, API, indexer, or relayer is unavailable, a voter or executor can use another frontend or call the contracts directly. The onchain state remains authoritative. EFS should preserve that substitutability and should never require Cactus’s API to determine whether a vote occurred.

The operator transition is nevertheless relevant operationally. Documentation still carries Tally-era URLs and some pages warn that they are being revamped. Treat the product as actively operated but recently transitioned; test exact supported networks, DAO type, relayer behavior, and export paths before depending on it.

Snapshot now also offers a Governor frontend and optional gasless relay. That competition is healthy: multiple frontends over the same Governor reduce product lock-in. [Snapshot Governor support](https://blog.snapshot.box/snapshot-is-now-home-for-governor-daos)

## Ideological assessment

### Where Governor is stronger

Governor is ideologically stronger than MACI or CRISP when the priority is:

- no coordinator or decryption committee;
- direct individual inclusion;
- public auditability from ordinary EVM state;
- deterministic execution; and
- minimal special cryptographic infrastructure.

It is ideologically weaker when the priority is:

- freedom from retaliation;
- secret political judgment;
- resistance to vote buying;
- equality independent of token wealth; or
- participation without public identity linkage.

Transparency is not a universal democratic virtue. A public legislative roll call may need accountability; a membership election may need a secret ballot. EFS should not pick one backend without first naming the institution being designed.

## EFS integration design

### Proposed future authority boundary

Current EFS v2 authority requires an EFS actor witness; a foreign Governor contract is not canonical EFS record authority by itself. If a generic native adapter is adopted, use this structure:

```text
Governor + voting-power source + timelock
                  |
                  | executes one bounded action
                  v
   future EFS authority adapter
                  |
                  | publishes/authorizes a named config
                  v
               EFS objects
```

The future adapter should expose narrow operations, for example:

- approve one content-addressed folder-config manifest;
- select a moderator from a frozen candidate set;
- set a bounded numeric parameter;
- grant or revoke one scoped actor permission;
- activate a pre-reviewed policy after a delay; or
- replace one pointer with an explicit rollback path.

It should not expose “execute arbitrary EFS writes.”

### Electorate options

1. **Token/delegation:** easiest and most mature, but explicitly plutocratic.
2. **One-address-one-vote:** simple, but addresses are not humans.
3. **EFS membership snapshot:** a custom `IVotes`-compatible adapter could expose weight for poll-scoped addresses at a named EFS/chain basis.
4. **Privacy-preserving result adapter:** a separate private voting system may publish a verified accepted result that a narrow execution contract consumes.

EFS principals and Ethereum addresses are different identity domains. If EFS membership controls voting, define:

- account binding and rotation;
- snapshot/finality;
- duplicate-account prevention;
- delegation;
- recovery;
- revocation timing; and
- whether the principal-to-address mapping is public.

Do not improvise these rules in a frontend.

### Artifacts EFS should preserve

- chain ID and finality basis;
- Governor, voting-power source, timelock, proxy, and adapter addresses;
- verified source/commit, compiler settings, ABI, deployed bytecode and code hashes;
- upgrade and administrative roles at proposal creation and execution;
- all Governor parameters and module composition;
- proposal targets, values, calldata, description, and proposal hash;
- voting snapshot, deadline, vote events, quorum calculation, and state transitions;
- queue and execution receipts;
- Cactus/Snapshot/alternate frontend package versions; and
- independent replay instructions that use RPC state, not a hosted indexer.

## Best EFS pilot

Run a Sepolia or low-stakes L2 test:

- 5–20 named EFS contributors;
- equal, non-transferable test voting units;
- one narrow proposal: choose between two prepublished folder-config manifests;
- a 48-hour voting period and 24-hour timelock;
- no upgrade during the poll;
- direct contract-voting instructions plus two independent frontends; and
- manual EFS application of the verified outcome in the first pilot; automatic execution only after the generic native adapter is separately designed and adopted.

The pilot should test abstention, key loss, quorum failure, late participation, UI outage, RPC outage, and replay—not just the happy path.

## Suitability

| Use case | Suitability | Reason |
|---|---|---|
| Daily harmless folder poll | Poor | Too much gas and ceremony |
| Anonymous non-secret opinion poll | Poor | Votes are attributable |
| Consequential EFS community decision | **Strong as the public EVM decision layer; binding-manual in current EFS v2** | Mature transparent EVM result; native authority bridge remains unresolved |
| Ethereum DAO vote | **Excellent baseline** | This is the native target |
| Private organizational election | Poor alone | No ballot secrecy or anti-coercion |
| Binding public election | Do not use as a standalone election system | No civil roll, secret ballot, accessibility/process, or legal certification |

**Disposition:** **adopt as the EVM binding reference; preserve results as evidence now; prototype a narrow EFS adapter only after the generic native authority seam is designed; keep Cactus replaceable.**
