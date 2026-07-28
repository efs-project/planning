# Snapshot — mature offchain signaling plus newer onchain execution paths

**Reviewed:** 2026-07-28
**Status:** point-in-time research profile; factual claims use official documentation, repositories, and announcements; recommendations are EFS analysis
**Scope:** Snapshot Classic, Snapshot X, SafeSnap, and current Governor support

#kind/research #status/done #repo/planning #topic/efsv2 #topic/governance #topic/voting #topic/onchain

## Bottom line

“Snapshot” now names several materially different systems:

1. **Snapshot Classic** is the mature, gasless, offchain signed-vote platform used for DAO signaling. It is flexible and inexpensive, but the result is not natively enforced by Ethereum.
2. **SafeSnap** connects a Classic result to Safe execution through Reality.eth and the Zodiac Reality Module. It is an optimistic oracle bridge, not direct protocol execution.
3. **Snapshot X** is a newer modular, fully onchain protocol for EVM chains and Starknet, with onchain voting-power calculation and permissionless execution. Its optional UI, API, SDK, and gas sponsor can be bypassed.
4. **Governor support** lets OpenZeppelin Governor and Governor Bravo DAOs use Snapshot as a frontend and gasless relay while authority remains in their Governor contracts.

For a harmless daily “hotdog or hamburger” poll, Snapshot Classic is the best finished Ethereum-adjacent product in this set. For consequential EFS folder governance, Snapshot X or an OpenZeppelin Governor is a cleaner binding foundation than Classic plus an oracle bridge.

Snapshot is not a private voting system by default. Classic votes are publicly attributable to wallets. Its currently deployed Shutter option hides choices only until close and then reveals individual votes; see the separate Shutter profile.

**EFS verdict:** integrate Snapshot only as an optional application backend. EFS can publish a frozen poll manifest, electorate basis, strategy code, signed messages, receipts, execution payload, and replayable result. EFS must not silently convert a Snapshot space’s hosted result into protocol truth.

## Snapshot Classic

### Mechanism

A space defines:

- proposal-validation rules;
- one or more voting-power strategies;
- voting type, quorum, timing, and metadata; and
- optional execution integrations.

Voters sign structured messages rather than sending transactions. Snapshot’s Hub validates and stores the messages, and the system produces IPFS-linked receipts. A later vote can replace an earlier one; the latest valid vote is used. Strategies can read token balances, delegation, NFTs, allowlists, or custom data at a selected block. [Snapshot documentation](https://docs.snapshot.box/) · [strategies](https://docs.snapshot.box/user-guides/voting-strategies) · [API and message receipts](https://docs.snapshot.box/tools/api) · [FAQ](https://docs.snapshot.box/faq)

This makes Classic:

- inexpensive for the voter;
- flexible across chains and communities;
- easy to operate through the hosted product; and
- reproducible if the exact messages, strategy versions, RPC state, and block basis are preserved.

It is not a consensus protocol. Availability and message admission normally pass through Snapshot services, and strategy execution may depend on APIs or RPCs. An independent verifier needs the complete signed-message set and deterministic strategy inputs—not just a screenshot of the final number.

### Privacy

The normal Classic ballot is public:

- the signing address is visible;
- vote weight and choice are visible;
- participation and timing are visible; and
- the latest-vote update behavior is visible.

That is acceptable for ordinary DAO signaling. It is not a secret ballot and does not resist bribery, retaliation, or forced proof of choice.

### Best use

Classic is excellent for:

- daily or weekly opinion polls;
- temperature checks;
- agenda ordering;
- public grants/community signaling; and
- any low-stakes decision where the cost and convenience of participation matter more than protocol-enforced execution.

“One wallet, one vote” should never be labeled “one person, one vote” without a separate identity or eligibility system.

## Current binding path 1: SafeSnap

SafeSnap uses:

- a Snapshot Classic proposal;
- a corresponding Reality.eth oracle question;
- a bond and an arbitrator/challenge process;
- a Zodiac Reality Module attached to a Safe; and
- a cooldown before permissionless execution.

The question asks whether the proposal passed and whether its transaction payload matches what the proposal said. After resolution and cooldown, anyone can trigger the approved transactions. Snapshot recommends a meaningful bond, named arbitrator, long cooldown, and monitoring. [SafeSnap documentation](https://docs.snapshot.box/v1-interface/plugins/safesnap-reality)

This is “trust-minimized optimistic execution,” not a pure cryptographic derivation from an onchain vote:

- an incorrect oracle answer must be challenged in time;
- arbitrator configuration matters;
- monitoring and bond economics matter;
- the Safe module and enabled scopes matter; and
- the offchain proposal/message record still matters.

Snapshot’s earlier `oSnap` path is no longer current. UMA ended support on 2025-12-15; Snapshot directs users to Snapshot X or SafeSnap. [Snapshot migration FAQ](https://docs.snapshot.box/faq#migrations)

## Current binding path 2: Snapshot X

Snapshot X is a distinct onchain protocol. Its primary `Space` contract stores proposals and votes, while modules define:

- authenticators;
- who may propose;
- how voting power is calculated;
- how proposal status is calculated; and
- what accepted proposals execute.

Anyone may execute an accepted proposal. Snapshot supplies quorum variants, Safe/Zodiac and timelock execution strategies, and voting strategies including OpenZeppelin checkpoint tokens and Merkle whitelists. Custom modules can implement other rules. [Snapshot X overview](https://docs.snapshot.box/snapshot-x/overview) · [protocol architecture](https://docs.snapshot.box/snapshot-x/protocol/overview) · [voting strategies](https://docs.snapshot.box/snapshot-x/protocol/voting-strategies) · [execution strategies](https://docs.snapshot.box/snapshot-x/protocol/execution-strategies)

Offchain services improve UX but are optional:

- an API/indexer;
- `SX.js`;
- a hosted UI; and
- Mana, a meta-transaction relayer.

Direct contract interaction remains possible, so one hosted service cannot be the only inclusion path. [Snapshot X services](https://docs.snapshot.box/snapshot-x/services/architecture)

Important qualifications:

- a space controller has broad settings authority unless governance constrains or removes it;
- modules and execution payloads matter as much as the Space contract;
- custom strategies need their own review;
- votes remain public unless a separate privacy system is integrated; and
- Classic’s years of usage do not automatically establish equal maturity for Snapshot X.

The public monorepo is MIT licensed and actively maintained. The latest tagged package at review time was `@snapshot-labs/sx@0.1.11`, released 2026-05-07. [Snapshot X repository](https://github.com/snapshot-labs/sx-monorepo) · [releases](https://github.com/snapshot-labs/sx-monorepo/releases)

The `0.x` version is not proof of insecurity, but it is a useful warning not to transfer Classic’s product reputation to an exact X deployment without checking its modules, audits, code hashes, controller, and operating history. We did not find a current official audit index comparable to OpenZeppelin’s; a binding EFS pilot should obtain exact-version evidence before assigning material authority.

## Current binding path 3: Governor through Snapshot

Snapshot now supports the full lifecycle for OpenZeppelin Governor and Governor Bravo DAOs, including delegated voting views, proposal execution, and an optional funded relayer for gasless onchain votes. ENS and Uniswap are named launch users. Authority remains in the Governor contract; Snapshot is the interface and relay path. [Governor support announcement](https://blog.snapshot.box/snapshot-is-now-home-for-governor-daos)

This is an important decentralization property: if Snapshot’s interface or relayer fails, a voter can submit directly to the Governor. EFS should prefer this kind of replaceable interface over a hosted result that has no protocol-level alternative path.

## Maturity split

| Component | Current maturity | Honest description |
|---|---|---|
| Snapshot Classic | High product maturity | Widely used offchain public signaling |
| Shutter on Classic | High product maturity for temporary secrecy | Choices hidden until close, then revealed |
| SafeSnap | Established but configuration/monitoring sensitive | Optimistic bridge from offchain result to Safe |
| Snapshot X | Active, deployable, less proven than Classic | Modular fully onchain governance |
| Governor UI/relay | Current product integration | Frontend/relayer over established Governor contracts |

Snapshot code is generally MIT licensed and the project documents self-hosting and mirrors. That helps exit and replay, but decentralization depends on whether a particular poll preserved enough public data and whether an equivalent direct submission path existed.

## Ideological fit

Snapshot Classic’s ideology is pragmatic:

> Participation should be cheap and governance rules should be expressive, even if not every message and calculation is settled onchain.

Snapshot X’s ideology is closer to EFS’s strongest decentralization goal:

> Core voting and execution should remain available through public contracts; hosted services are conveniences.

Neither solves political legitimacy. Token strategies are plutocratic by construction; allowlists are only as fair as their issuer; wallet counts do not establish humans; and public ballots may chill dissent.

## EFS integration

### Classic profile

An EFS `snapshot-classic` poll profile should bind:

- space identifier and controller state;
- proposal ID, canonical metadata, choices, start/end, and snapshot block;
- exact validation and voting strategies, parameters, code versions, and external data dependencies;
- electorate/member-root derivation where EFS membership is used;
- signed proposal and vote messages with IPFS receipts;
- Hub acceptance/rejection log or a reproducible message export;
- deterministic tally code and result;
- Shutter configuration, if enabled; and
- any SafeSnap question, bond, arbitrator, module, cooldown, answer, and execution receipt.

An EFS strategy should avoid a live mutable “is this address in the folder now?” API query. Prefer a frozen, content-addressed member list or Merkle root named in the proposal.

### Snapshot X profile

A custom X voting strategy could verify an EFS-derived membership root:

1. freeze eligible EFS principals at a named finality point;
2. deterministically map the authorized voting accounts and weights;
3. publish the tree and root in EFS;
4. configure a whitelist or custom strategy against that root;
5. pin Space/module/controller/execution code and addresses; and
6. publish proposal, vote, result, and execution evidence.

EFS principals are `bytes32`-style identities while the common voting strategies are address-oriented. Do not create a permanent public principal-to-address identity map merely for convenience. A poll-scoped account or privacy credential may be preferable.

### Folder configuration

For an advisory poll, the folder can reference the finalized result without changing permissions.

After EFS adopts a generic external-result authority bridge, a binding config change should use a narrow adapter that accepts only a precommitted action, for example:

- select one of two named moderators;
- enable one already-reviewed folder policy;
- set one bounded parameter; or
- install one content-addressed config manifest after a delay.

Until that bridge exists, treat the result as binding-manual and have an ordinary authorized EFS actor apply it after verification and challenge delay. Do not give a generic governance executor arbitrary write authority over every EFS object.

## Best pilots

### Pilot A — daily opinion polling

Use Snapshot Classic with:

- a frozen EFS member allowlist;
- equal address weight;
- no automatic execution;
- public choices;
- complete signed-message export; and
- explicit language that respondents are self-selected folder members, not a representative population.

This is the fastest useful EFS experiment.

### Pilot B — binding testnet configuration

Use Snapshot X on an EVM testnet with:

- a frozen Merkle whitelist;
- a no-upgrade or timelocked controller posture;
- a narrow execution strategy;
- one reversible folder-config action;
- a minimum voting duration; and
- independent direct contract interaction and replay.

## Suitability

| Use case | Classic | Snapshot X / Governor path |
|---|---|---|
| Daily harmless folder poll | **Excellent** | Overkill |
| Anonymous non-secret opinion poll | Poor by default; add Semaphore for unlinkability | Custom integration required |
| Consequential EFS decision | Advisory only, or SafeSnap with explicit oracle assumptions | **Promising as an EVM decision layer; binding-manual in current EFS v2** |
| Ethereum DAO vote | Excellent signaling/product layer | **Strong binding fit** |
| Private organizational election | Insufficient; current Shutter is temporary | Insufficient without a private-voting module |
| Binding public election | Do not use | Do not use without the surrounding public-election institution |

**Disposition:** **integrate Classic as an optional backend for low-stakes opinion polling; prototype Snapshot X or Governor for binding EVM actions; keep EFS binding manual until a generic native authority adapter is adopted; do not treat Classic as self-executing consensus.**
