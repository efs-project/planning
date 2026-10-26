# Owner theme edits before cleanup

Captured October 26, 2026. Native rehearsal copy, 27 slides. Preserves the source inspected at the start, including unfinished template text.

## 1. Who Can Turn Off Your Ethereum App?

### On slide

Who Can Turn Off
Your Ethereum App?

James Carnley
Ethereum File System

A Full-Stack Walk-Away Test

### Speaker notes

Planned 0:00-0:15

I'm James Carnley, the creator of Ethereum File System. I want the things people build with our software to have a future that doesn't depend on us still being here, or still being benevolent.

## 2. What happens when an app disappears?

### On slide

What happens when an app disappears?

Building Cypherpunk Apps

### Speaker notes

(No speaker notes.)
## 3. When an app disappears

### On slide

When an app disappears


Years of work can become unusable.
Every app built on it inherits that risk.

### Speaker notes

Planned 0:15-1:00

Imagine someone with years of research notes, attachments and shared work inside an app. The team shuts down, or somebody changes the deal. They may still own the work, yet lose the ability to use it.

If you built another app on that service, your users inherit the same failure. It becomes hard to trust software with important work, and hard to build anything lasting on top of it.

This talk asks how we can give users a way to continue. We'll follow the application stack, find who can turn each part off, and look at improvements we can make.

## 4. Software people can keep building on

### On slide

Software people can keep building on

### Speaker notes

Planned 1:00-2:00

Now imagine that person opening the same work in another compatible tool. They choose a better editor without handing their history to a new gatekeeper. Another developer can improve one part without replacing everything.

That is the future I want: dependable capabilities we can combine into things none of us could build alone. Eventually, communities could rely on these foundations for important shared work and governance.

CROPS gives us the values: censorship resistance, open source, privacy and security. Hyperstructures express the ambition of lasting, permissionless protocols on an underlying blockchain. I want us to carry that ambition through the whole app.

The walk-away test gives us a way to work toward it. It won't certify every CROPS property. It will expose where a user's freedom still depends on somebody staying helpful.

Reference notes (not part of the spoken route)

The research-notes user is illustrative, not an EFS customer or a deployed collaborative editor. Open formats, compatible tools and usable keys are additional requirements beyond retaining bytes. Jacob Horne's full hyperstructure definition also includes specific economic properties. This talk applies the longevity ambition to user-facing apps, without labeling every example a completed hyperstructure.

Sources
https://ethereum.org/foundation/mandate
https://jacob.energy/hyperstructures.html

## 5. Absence and hostile control

### On slide

The team disappears
Can users continue without its services or help?

The keys change hands
Can users refuse a harmful change and continue?

Absence and hostile control

### Speaker notes

Planned 2:00-2:30

We'll test one important user task under two conditions.

First, the team disappears. Remove its services, accounts and personal help. Can the user continue?

Second, someone hostile gets the powers the team kept. What can they change, and what can the user refuse?

More copies can help with absence. They don't automatically protect us from an authorized harmful change. Keep both questions in mind as we go.

## 6. The application stack

### On slide

The application stack

App Discoverability

1. Names
2. Software
3. Accounts

Data Portability

4. Storage
5. State
6. Computation

Governance

7. Application rules
8. Network and settlement

### Speaker notes

Planned 2:30-3:00

These eight jobs form three chapters. They are a dependency map, not a single straight line.

Ethereum File System, or EFS, provides shared file paths, onchain metadata and verifiable file references. We'll use EFS on Sepolia for our file example, then other projects for jobs that a public file read doesn't exercise.

For each layer: what does it do, who can stop or change it, and what could let the user continue?

Sources
https://efs.eth.limo/
https://app.efs.eth.limo/

## 7. Entering the app

### On slide

Entering the app

The application stack

### Speaker notes

(No speaker notes.)

## 8. Can people find and use your app?

### On slide

Can people find and use your app?

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

### Speaker notes

(No speaker notes.)

## 9. Names and entry points

### On slide

Names and entry points

ENS names an app release on IPFS.
A gateway is one route to that release.
An independent route must actually work.

### Speaker notes

Planned 3:00-4:15

Our user first needs an entrance to the software. With a conventional hosted app, a URL directs the browser to a server that supplies the release. EFS's public client uses ENS to name content on IPFS. The release can come from another holder of the same content.

The usual HTTPS gateway remains a service with an operator. In September 2024, eth.link moved to the eth.limo service. Two names can still share one operator.

Retain the accepted release reference and test opening it through an independently operated route. Then inspect who controls the name and its renewal.

A name makes updates discoverable. Its controller can also redirect people. A retained release gives users a choice, but someone must retain its bytes and make the alternative understandable.

Reference notes (not part of the spoken route)

HTTP and IPFS are not mutually exclusive. IPFS content can travel through an HTTP gateway. Content addressing identifies bytes. It does not itself authenticate their author, retain a copy, or make an ordinary gateway response independently verified in the browser. The eth.link migration is a dated operator example, not a current infrastructure audit. EFS alternate-path behavior has not been freshly exercised for this deck.

Sources
https://docs.ens.domains/dweb/intro/
https://docs.ipfs.tech/concepts/ipfs-gateway/
https://discuss.ens.domains/t/eth-limo-update/19707
https://discuss.ens.domains/t/run-your-own-local-ens-gateway-the-easy-way/21890

## 10. The code that actually runs

### On slide

The code that actually runs

Ledger Connect Kit exposed a runtime dependency.
A retained release includes what it loads later.
Rebuilding also needs source and build inputs.

### Speaker notes

Planned 4:15-5:30

Reaching the page only gets us to the next question: what code runs on the user's device?

In December 2023, attackers compromised Ledger Connect Kit's publishing channel. Apps loaded malicious connector code that led users into asset-draining transactions. Those apps' own repositories didn't need to change. A runtime dependency supplied another way to alter them.

Keep a runnable release and inspect everything it fetches after startup. Separately, retain source, dependency versions, build tools and instructions. Test running the release and rebuilding it on a fresh setup without the founder's cache.

Reviewed releases and deliberate updates reduce surprise changes. They still need security fixes and compatibility work. A retained bundle also can't protect someone whose device is compromised.

Reference notes (not part of the spoken route)

Incident: December 14, 2023. Ledger's report dates December 20. It identifies malicious Connect Kit releases 1.1.5 through 1.1.7. The example concerns application code distribution and misleading transaction requests, not extraction of hardware-wallet private keys. A reproducible build establishes a relationship between inputs and output, not absence of vulnerabilities.

Sources
https://www.ledger.com/blog/security-incident-report

## 11. Accounts and recovery

### On slide

Accounts and recovery

Safe: two of three independent signers
Two remaining signers can replace a lost one.
File decryption needs separate recovery.

### Speaker notes

Planned 5:30-7:00

A working app can still leave its user locked out. Public reading, private decryption and signing are different capabilities. Our public EFS file read doesn't require a signing key. A private file or a transaction may.

Consider a basic Safe account with three independent signers and a threshold of two. Lose one signer, and the remaining two can replace it. Lose two, and that ordinary path fails.

This preserves account control. It doesn't recover the lost private key or an unrelated file-decryption key. Recovery modules can add another path, with their own powers. Guards can also block execution.

Test device and provider loss with a test account. Keep recovery material genuinely independent. Three keys on one lost device still share a failure. Recovery reduces lockout only if the user can actually use it without quietly handing control to someone else.

Reference notes (not part of the spoken route)

The example is threshold continuity using an owner replacement transaction, not a demonstration of SafeRecoveryHub's module recovery flow. Inspect owners, threshold, modules, guards, signer support, available chain access and gas for the actual account. No recovery transaction occurred in this preparation.

Sources
https://docs.safe.global/reference-smart-account/owners/swapOwner
https://help.safe.global/articles/9622260218-account-recovery-with-saferecoveryhub
https://docs.safe.global/advanced/smart-account-modules
https://docs.safe.global/advanced/smart-account-guards

## 12. Continuing the work

### On slide

Continuing the work

The application stack

### Speaker notes

(No speaker notes.)

## 13. Is the data portable?

### On slide

Is the data portable?

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

### Speaker notes

(No speaker notes.)

## 14. Data that remains available

### On slide

Data that remains available

A content address still needs retained bytes.
Independent copies reduce provider dependence.
Formats and decryption keep those bytes useful.

### Speaker notes

Planned 7:00-7:45

Our user can reach software and regain access. Now they need their work.

IPFS identifies content, but somebody still has to retain it. Several gateways can lead to the same remaining copy. Pocket's shutdown gives a familiar warning: its export preserved links and metadata, not the saved article text.

For EFS, the onchain reference and the stored file are separate dependencies. Retrieve a genuinely retained alternative copy. Keep the format information and any decryption recovery the task needs.

Somebody pays for retention. Replication costs resources, and private records need an appropriate retention policy. The aim is to keep the work useful to its user.

Sources
https://docs.ipfs.tech/concepts/persistence/
https://support.mozilla.org/en-US/kb/exporting-your-pocket-list
https://support.mozilla.org/en-US/kb/future-of-pocket

## 15. File verification with EFS

### On slide

File verification with EFS

An accepted file reference supplies a digest.
IPFS and Arweave can carry the same file.
A mismatch differs from a failed retrieval.

### Speaker notes

Planned 7:45-8:45

Our earlier EFS proof package illustrates this sequence. Start from an accepted public reference and the chain state that supplied it. The reference gives an expected digest. Retrieve the candidate file through IPFS and compare its bytes.

If that route fails, try the Arweave copy against the same reference. A match supports integrity. Altered bytes fail the check. No usable response means that retrieval attempt failed, not that the file has vanished everywhere.

This sequence explains the checks. The important freedom is changing the route without changing which file we accept. Somebody must still retain a copy, and a hash cannot choose the authoritative reference for us.

Reference notes (not part of the spoken route)

Historical walk-away proof package, pinned source below. This is a static explanation, not a new retrieval run. The carrier reference, expected digest and accepted chain record have distinct jobs. Integrity does not establish discovery completeness, freshness, semantic truth or confidentiality.

Sources
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## 16. State you can rely on

### On slide

State you can rely on

Reachable: a provider answers
Verified: evidence supports the claim
Fresh: the state is recent enough
Complete: the task has all required records

### Speaker notes

Planned 8:45-10:00

Where did that public reference come from? RPCs give us access to chain state. Indexes organize it into the queries our apps need.

Several RPC providers can help when one stops answering. Their agreement alone doesn't independently establish correctness. A light client such as Helios can check supported answers against its chain trust basis. Someone still has to supply the data.

Then ask whether the answer is recent enough and whether anything is missing. One valid file record doesn't prove we found all of someone's work.

An indexer such as Graph Node offers another check: can we rebuild the view of all the records we need? Retain its definition and required history, then test rebuilding it. Show users stale or incomplete results honestly. Verification and rebuilding cost resources, but let us depend on evidence instead of a single dashboard.

Reference notes (not part of the spoken route)

Helios support and trust assumptions vary by network and method. It does not verify arbitrary GraphQL results, guarantee index completeness, or retain application files. Graph Node needs deployment files, suitable chain access and a database. It may need archive access for eth_calls and tracing for particular handlers. Preserve manifests and linked files. This deck does not claim EFS has integrated a light client or automatic multi-RPC failover.

Sources
https://github.com/a16z/helios
https://thegraph.com/docs/en/indexing/tooling/graph-node/

## 17. Keeping the rules

### On slide

Keeping the rules

The application stack

### Speaker notes

(No speaker notes.)

## 18. Who upgrades?

### On slide

Who upgrades?

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

### Speaker notes

(No speaker notes.)

## 19. The work outside the contracts

### On slide

The work outside the contracts

PoolTogether V5 rewards permissionless claimers.
Replacement needs inputs, gas and an incentive.
Unclaimed prizes can expire.

### Speaker notes

Planned 10:00-11:00

Some tasks need someone to do work outside the contracts. Our file read doesn't cover every keeper, relayer or external input. An application can stop progressing while its chain remains healthy.

PoolTogether V5 lets others claim prizes for winners and earn a fee. If nobody claims in time, prizes expire. The design makes replacement possible and gives operators a reason to participate.

Those operators still need account data, chain access, gas and the right configuration. Permission doesn't guarantee that the work will be worthwhile.

Stop a required worker in a safe test. Can somebody else finish the operation? If an input remains missing or stale, decide which actions can safely continue.

Reference notes (not part of the spoken route)

Scope to the documented V5 prize-claiming mechanism. Draw windows and vault/claimer behavior vary. The official guide enumerates active accounts, computes winners, evaluates fees and submits claims. Old v4.docs links currently serve/canonicalize V5 content, but use dev.pooltogether.com to avoid misleading version cues. No profitability or live bot execution was tested. Chainlink consumers separately need application-appropriate timestamp checks. A fallback oracle can change meaning and trust.

Sources
https://dev.pooltogether.com/protocol/guides/bots/
https://dev.pooltogether.com/protocol/guides/bots/claiming-prizes/
https://dev.pooltogether.com/protocol/design/prize-claimer/
https://github.com/underethsea/pooltogether-node
https://docs.chain.link/data-feeds/overview#check-the-timestamp-of-the-latest-answer

## 20. Rules and change authority

### On slide

User-chosen software
Can users keep a release or switch clients?
Shared state may still change.

Shared application rules
Who can upgrade, pause or redirect them?
What can a user refuse or leave?

Rules and change authority

### Speaker notes

Planned 11:00-13:00

We can get into the app and continue the work. But can somebody change the deal underneath us?

For most application software, I want upgrades to be the user's choice. Shared systems also need agreed ways to evolve. These are different promises. Keeping yesterday's client cannot undo a change to the shared contract it calls.

Uniswap v2 core is a useful fixed-code example. Its interface is a separate layer. The factory retains control over the protocol-fee recipient, within rules already in the code. That doesn't give it arbitrary power to rewrite the swap logic.

Stable rules let another developer build without asking what we'll decide next. That's the credible-neutrality goal I want EFS to serve.

Bugs in fixed code are harder to repair. Upgrade powers can repair bugs or enable a takeover. A governance decision can authorize a change without every user consenting. Exit can protect a user, but differs from continuing under the old rules. A timelock helps only if users can notice and finish an exit in time.

Map the actual powers, including protocols and tokens your contracts depend on. Remove unnecessary powers, bound the others, and make migrations understandable. Ask what a dissenting user can really keep using.

Short route (use instead if behind)

Choosing a client release and changing shared state are different decisions. An old interface cannot undo a hostile contract upgrade.

Uniswap v2 core illustrates fixed code with a bounded protocol-fee authority. Fixed rules support other builders, but also make bugs harder to repair. Inspect your app's actual powers and inherited dependencies. Test what users can refuse, retain or leave.

Reference notes (not part of the spoken route)

Uniswap v2 Factory feeToSetter can set feeTo and change feeToSetter. The Pair's fee logic is fixed. No current deployed holder or fee-on/off state was queried. Tokens, liquidity, oracles and networks remain dependencies. Do not extend this to every Uniswap version or claim an upgrade proxy in v2 core. EFS immutability is the stated goal, not a new audit of deployed powers. Individual software choice differs from coordinated protocol rule changes.

Sources
https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Factory.sol
https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol
https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy

## 21. The network beneath the app

### On slide

Connectivity and L1
Peers and node access
Inclusion and finality
Required chain history

L2 and settlement
Sequencer and proving
Available chain data
A tested recovery route

The network beneath the app

### Speaker notes

Planned 13:00-15:00

Those rules inherit a network. Even our own node needs connectivity, peers and usable history. Our task also depends on transaction inclusion and a sufficiently settled view of the chain.

On an L2, a sequencer commonly orders transactions. Other components publish data, prove or propose state, and connect it to settlement. Ask what happens when a required operator stops or uses its powers against users.

OP Stack documents an L1 submission route around a sequencer outage. That supplies a path toward transaction inclusion. It doesn't promise every application task will finish. Withdrawal has its own steps and conditions.

Test the exact chain and account type you chose. Record the required data, fees and delay. Inspect bridge and upgrade powers, and whether the user can take the route without your backend.

Also separate data needed to reconstruct chain state from keeping an application's files for years. Our EFS example uses Sepolia and inherits its testnet lifetime.

We don't each need to build a blockchain. We do need to choose our inherited assumptions deliberately and know what a failure means for our users.

Short route (use instead if behind)

Your app inherits connectivity, chain data, inclusion and settlement assumptions.

OP Stack documents an L1 route around a sequencer outage. Inclusion, application success and withdrawal are separate outcomes. Test the actual chain and account, including data, fees, delay and bridge controls.

Chain reconstruction data and long-term file retention also serve different jobs. Our EFS example inherits Sepolia's testnet lifetime.

Reference notes (not part of the spoken route)

The OP Stack route uses the selected chain's OptimismPortal. Sequencing windows differ and contract callers may encounter address aliasing. Withdrawal involves initiation, proving and finalization under applicable settlement conditions. A documented recovery route is not evidence that this user's operation succeeds. No forced-inclusion or withdrawal transaction was performed.

Sources
https://ethereum.org/developers/docs/nodes-and-clients/
https://docs.optimism.io/op-stack/protocol/outages
https://docs.optimism.io/op-stack/bridging/withdrawal-flow

## 22. Operators and continuity

### On slide

Operators and continuity

Hic et Nunc’s website closed. Community mirrors followed.
Usable code and retained artwork made continuation possible.
Independent operators still need resources.

### Speaker notes

Planned 15:00-16:00

Across all eight jobs, alternatives need people who can actually run them.

Hic et Nunc, an art marketplace on Tezos, lost its website in November 2021. Community mirrors used its open-source code, and the community developed Teia. Artists' work had a route forward. That took available artwork, usable software and people willing to operate it. Teia introduced a new marketplace contract.

I want important layers to have several independent participants. Three is a useful ambition, not proof of resilience. They may still share one cloud account, credential or funder.

Trace those shared dependencies. Give another person the retained inputs and instructions. Can they operate the service without you, and can they afford to keep doing it?

Reference notes (not part of the spoken route)

Teia's FAQ dates the Hic et Nunc shutdown to November 11, 2021, subsequent mirrors, return of the original domain January 25, 2022 and Teia launch February 2, 2022. It documents a new marketplace contract and indexer compatibility needs. Continued access is not proof that every feature or rule stayed identical. Artwork still needs retention and backups. This is a Tezos comparison, not an Ethereum deployment.

Sources
https://docs.teia.art/faqs/general-faqs

## 23. Continuing somewhere else

### On slide

Continuing somewhere else

Safe CLI offers a route without the hosted API.
The same account still needs signers and gas.
A usable alternative preserves the user’s task.

### Speaker notes

Planned 16:00-17:00

Now put those dependencies together around a complete user task. Safe documents a command-line route to the same onchain account without its hosted API. That's a concrete alternative to a missing interface.

The user still needs supported signers, chain access and gas. A different interface doesn't recover missing keys, undo a hostile account configuration or reproduce every web feature.

For the person with years of notes, the equivalent test is opening the files in a compatible tool and continuing their work, with relationships and privacy intact.

Give the task to someone on a fresh setup. Measure the time, cost and missing steps. A route only the founder can use still depends on the founder.

Reference notes (not part of the spoken route)

Use Safe CLI's direct-chain/blockchain route. Its transaction-service commands are a different dependency. Check actual version and signer support. No Safe account operation was performed. A file export, interface replacement, key recovery and asset exit are different outcomes and must be evaluated separately.

Sources
https://docs.safe.global/advanced/cli-overview
https://docs.safe.global/advanced/cli-reference/common-commands
https://docs.safe.global/advanced/cli-reference/tx-service-commands

## 24. A Walk Away Test for your App

### On slide

A Walk Away Test for your App

Putting this into practice

### Speaker notes

(No speaker notes.)

## 25. A walk-away test for your app

### On slide

A walk-away test for your app

Choose one task whose loss would hurt.
Try it without your team's services or help.
Test what hostile authority could change.
Fix the dependency that causes the most harm.

### Speaker notes

Planned 17:00-18:00

Start with one task whose loss would genuinely hurt a user. Trace what it needs and who controls those parts.

Have another person try it without your team's services or personal help. Use test accounts and copies, never somebody's only data or real funds.

Then examine the powers a hostile maintainer could use. What can the user refuse, and what changes for everyone?

Record what happened, including time, cost and remaining assumptions. Improve the dependency that causes the most harm. You might remove a power, make an operator replaceable, or preserve a usable exit. You can also accept a dependency for a reason. The point is to make that choice before your users discover its consequences during a crisis.

## 26. Their work can outlive us

### On slide

Their work can outlive us

### Speaker notes

Planned 18:00-19:00

Think back to the person with years of work in an app. They should be able to keep using it, choose better tools, and decide what to share. Their future shouldn't depend on the founder staying alive or agreeing with them.

For developers, each dependable capability is something we can build on. For communities, those capabilities can become foundations for work that matters to all of us.

That is why I care about CROPS and why I'm building EFS. The walk-away test turns that vision into a concrete question about our own software.

Choose one important task. Make it survive without you. Give the next person something they can rely on.

## 27. Thank you!

### On slide

Thank you!

James Carnley
Ethereum File System
JamesCarnley@gmail.com
@JamesCarnley


Let’s build reliable and long lasting apps together

### Speaker notes

(No speaker notes.)
