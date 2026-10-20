# October 20 practice deck

Captured October 20, 2026 after James authorized a practice-ready content pass. Eighteen main slides and a resource/Q&A page. Nineteen minutes remain the planned allocation, not measured delivery. The source PDF before editing matched the October 13 opening-and-vision snapshot exactly.

Read the main notes for the first run. Slides 13 and 14 also contain a shorter alternative. Reference notes and source lists are not part of the spoken route. The file-verification sequence explains the checks. It is not a fresh runtime result.

## 1. Who Can Turn Off Your Ethereum App?

### On slide

Who Can Turn Off
Your Ethereum App?

James Carnley
Ethereum File System

A Full-Stack Walk-Away Test

### Speaker notes

Planned 0:00-0:15

I'm James Carnley, the creator of Ethereum File System. I want us to build apps people can trust with important work, and that other developers can build on long after we're gone.

## 2. Apps are fragile foundations

### On slide

Apps are fragile foundations

Users can lose access to their data and work.
Other apps inherit the failure of their dependencies.

### Speaker notes

Planned 0:15-1:00

We put years of our lives and work into apps that can disappear. A company closes, a service breaks, or somebody changes the rules. Users lose access to their data and workflows. If your app depends on that service, its failure becomes your failure.

We can build apps whose useful functions outlive their original teams, so people can rely on them and other developers can build on them. This talk follows that promise through the whole stack, using EFS and other projects to identify what can break and what we can improve.

## 3. Apps we can keep building on

### On slide

Apps we can keep building on

### Speaker notes

Planned 1:00-2:15

I want us to build apps people can trust with their most important data and work. Apps they can depend on next year, and that other developers can treat as lasting foundations.

Imagine a community archive that a research app can read and a publishing tool can reuse. Each adds something useful to the same foundation. The next developer can build on that work instead of starting over. This is how progress compounds.

CROPS names the qualities we need: censorship resistance, open source, privacy and security. Hyperstructures push the ambition further: permanent, permissionless protocols that keep working on their underlying blockchain without the original operator. I want that ambition to reach the entire app.

Trusting software with important data also means controlling who can access it. The goal is continued usefulness for its users, with their privacy and choices intact.

Sources
https://devcon.org/en/ecosystem-program/
https://ethereum.org/foundation/mandate
https://jacob.energy/hyperstructures.html

## 4. Absence and hostile control

### On slide

The team disappears
Can users continue without its services or help?

The keys change hands
Can users refuse a harmful change and continue?

Absence and hostile control

### Speaker notes

Planned 2:15-3:15

That goal has two tests. First, the original team disappears. Can people keep doing the task without its services or help?

Pocket gives us a familiar example of the cost of losing an app. After the shutdown, users had a limited window to export their saves. That export included links and metadata, not the article text.

Second, somebody hostile gets the team's authority. The familiar app may stay online while an attacker changes its behavior. Can users refuse the change and continue?

Keeping more servers does not answer both questions. We'll examine absence and hostile control throughout the stack, using safe tests with copies and test accounts.

Sources
https://support.mozilla.org/en-US/kb/future-of-pocket
https://support.mozilla.org/en-US/kb/exporting-your-pocket-list

## 5. The application stack

### On slide

The application stack

Entering the app
Names, software, identity
Continuing the work
Data, state, computation
Keeping the rules
Application control, network and settlement

### Speaker notes

Planned 3:15-4:00

To make that vision real, we need to follow a user's task through the entire application. These are eight jobs, grouped into three chapters: entering the app, continuing the work, and keeping the rules. A dependency can affect more than one chapter.

Ethereum File System, or EFS, makes some of these questions concrete. It's an open-source public good for shared file paths, onchain metadata and verifiable file references. The file bytes can live on different storage networks. Our example is recovering a file and checking that it's the one we expected.

For your app, choose the task your users most need to preserve. At each layer, we'll identify the failure, a way to improve it, and the remaining cost or assumption.

Sources
https://efs.eth.limo/
https://app.efs.eth.limo/

## 6. Names and entry points

### On slide

Names and entry points

ENS points to an app release.
HTTPS gateways provide access routes.
A retained release needs a tested independent path.

### Speaker notes

Planned 4:00-5:00

The first job is reaching the software. EFS's public web client uses ENS and IPFS. The name points to content, and an HTTPS gateway makes it convenient to open in an ordinary browser.

That separates the app release from my own web server, but the gateway still has an operator. In September 2024, eth.link migrated to the eth.limo service. Two gateway names can still mean one operator. What matters is who runs the alternatives.

The check is to retain the accepted release reference and actually open it through an independent path. Then inspect the name's controller, resolver and renewal requirements. A mutable name helps people find updates, but somebody can change where it points. A fixed reference preserves a choice, while making discovery and deliberate updates our responsibility.

Sources
https://docs.ens.domains/dweb/intro/
https://discuss.ens.domains/t/eth-limo-update/19707
https://app.efs.eth.limo/

## 7. The code that actually runs

### On slide

The code that actually runs

A retained, runnable release
Source and the inputs needed to rebuild it
Every script the app loads after startup

### Speaker notes

Planned 5:00-6:15

Now the user has reached a page. What code will it execute?

In December 2023, attackers compromised the distribution of Ledger Connect Kit. Apps loaded malicious connector code, and users were tricked into signing transactions that drained assets. Those apps' own repositories didn't need to change. Their runtime dependency was another publishing channel into the app.

So keep the runnable release and inspect everything it loads later. Separately, retain the source, dependency versions, build tools and instructions needed to recreate it. Open it on a fresh setup without the founder's cache. Then try rebuilding it.

Keeping reviewed code together and making updates deliberate reduces surprise changes. It also leaves real maintenance work: security fixes, browser compatibility and supported devices. Retaining the code gives another maintainer something they can carry forward.

Sources
https://www.ledger.com/blog/security-incident-report

## 8. Accounts and recovery

### On slide

Accounts and recovery

Safe: two of three independent signers
One lost signer need not lock the account.
Decryption needs its own recovery path.

### Speaker notes

Planned 6:15-7:30

The app can survive while its user loses access. Reading public data, decrypting a private file and signing a transaction require different things.

Consider a Safe account with three independently controlled signers and a threshold of two. If one signer becomes inaccessible, the remaining two can remove that owner. If two become inaccessible, this ordinary path no longer works.

That recovers account control. It does not recover an unrelated file-decryption key. Enabled modules can create other paths into the account, so inspect those powers too. Three keys on one lost device are also one shared failure.

Test device and provider loss with a test account. Recovery should make lockout less likely without quietly giving someone else control.

Reference notes (not part of the spoken route)

A hosted login or wallet connection service may be an additional dependency. Test access to each required capability separately. For Safe, inspect the actual owners, threshold, enabled modules and guards. Signer independence is a requirement of this example, not something the threshold itself proves.

Sources
https://help.safe.global/articles/9622260218-account-recovery-with-saferecoveryhub
https://docs.safe.global/advanced/smart-account-modules

## 9. Data that remains available

### On slide

Data that remains available

Someone retains the actual bytes.
Another operator can retrieve them.
Private data needs decryption recovery.

### Speaker notes

Planned 7:30-8:15

The second chapter is continuing the work. Storage has a straightforward job: keep the bytes someone will need. A content address identifies data, but somebody still has to retain it. Two gateways may be two routes to the same remaining copy.

For EFS, the onchain reference and the file's storage are separate dependencies. For another app, the missing piece might be an attachment, a database history or a decryption key.

Test retrieval from a genuinely retained alternative copy. Know who pays for retention and how another operator takes over. Replication costs resources. Private information also needs an appropriate retention policy. Publishing everything permanently is rarely a sensible recovery plan.

Sources
https://docs.ipfs.tech/concepts/persistence/
https://efs.eth.limo/

## 10. File verification with EFS

### On slide

File verification with EFS

An accepted public record and expected digest
The same file through IPFS or Arweave
Matching bytes, altered bytes, or no response

### Speaker notes

Planned 8:15-9:15

Here's the verification sequence for our EFS example. Begin with an accepted public file reference, including which chain state supplied it. That reference gives us the expected digest. Retrieve a candidate copy through IPFS and check its bytes.

If that path fails, try the Arweave copy against the same reference. Matching bytes support the integrity check. Altered bytes fail it. No usable response means this retrieval path was unavailable. It doesn't tell us the file is gone everywhere.

These are the checks we're explaining here, rather than a live retrieval. The useful distinction is between changing the route and changing what you accept. The same test also exposes its limits: somebody must retain a copy, and we still need a basis for trusting the public record. A hash alone cannot choose that reference for us.

Sources
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## 11. State you can rely on

### On slide

State you can rely on

Reachable: a provider answers
Verified: evidence supports the claim
Fresh: the state is recent enough
Complete: the task has all required records

### Speaker notes

Planned 9:15-10:30

To check our archive file, how do we establish its public reference? This is the job of RPCs, indexes and the queries using them.

Multiple RPCs can help when one provider stops answering. Agreement between them doesn't independently establish correctness. A light client can check supported answers against its chain trust basis. It still needs someone to serve the data.

Freshness and completeness are separate questions. A valid old record may be wrong for today's task. A correct result may omit other records the user needs.

Specify what state the task needs. Test a replacement query, check its evidence and keep missing or stale results visible. To rebuild an index, retain its definition and the required history. These checks cost time and resources. They let the user know what an answer actually establishes.

Reference notes (not part of the spoken route)

Helios is a concrete light-client example. Supported methods, networks, providers and checkpoint assumptions matter. It does not verify arbitrary indexer results or retain application files. Graph Node illustrates index reconstruction: retain deployment definitions and linked files, appropriate chain access, database capacity and any required history. Requirements differ by subgraph.

Sources
https://ethereum.org/developers/docs/nodes-and-clients/light-clients/
https://github.com/a16z/helios
https://thegraph.com/docs/en/indexing/tooling/graph-node/

## 12. The work outside the contracts

### On slide

The work outside the contracts

PoolTogether: anyone can run a prize claimer.
Replacement needs inputs and an incentive.
What if nobody does the work?

### Speaker notes

Planned 10:30-11:30

Contracts often need somebody to do work around them. A chain can keep running while an application stops making progress.

PoolTogether provides a useful example. Other operators can run prize-claiming bots and receive fees for doing that work. The replacement path includes permission and an incentive, as well as code.

An operator still needs the account data, RPC access, gas and current configuration. Permission does not guarantee that somebody will find the work worth doing.

Follow one operation in your app. Stop its required worker in a safe test. Can someone else finish the job? If an input or worker remains unavailable, decide which operations can safely continue.

Reference notes (not part of the spoken route)

The same check covers keepers, relayers, provers, paymasters and external inputs. Chainlink feed consumers must check the answer's timestamp against their application's freshness requirements. Replacing an oracle can change meaning and trust assumptions. A pause or restricted mode may be safer than continuing with an unexamined fallback.

PoolTogether's documented claimers compute and submit prize claims for recipients and receive fees. A replacement still needs the relevant deployment configuration, inputs and execution resources. No bot run or financial transaction is part of this presentation.

Sources
https://v4.docs.pooltogether.com/protocol/guides/bots/
https://v4.docs.pooltogether.com/protocol/guides/bots/claiming-prizes/
https://github.com/underethsea/pooltogether-node
https://docs.chain.link/data-feeds/overview#check-the-timestamp-of-the-latest-answer

## 13. Rules and change authority

### On slide

Changeable rules
Who can upgrade, pause or redirect the app?
Can the user refuse?

Fixed rules
What behavior stays fixed?
How can users move if it breaks?

Rules and change authority

### Speaker notes

Planned 11:30-13:30

The third chapter asks what rules the user can rely on. Fixed rules give other developers something to build on without asking what I will decide next. That is what I want EFS to provide.

Uniswap v2 core gives us a specific example of fixed contract code. The interface someone operates is a separate layer. A restriction in the interface does not itself rewrite the protocol.

Fixed code does not remove every authority or dependency. The v2 factory still has fee controls. Tokens, liquidity and the network can also determine whether a user completes the task.

For an upgradeable app, inspect who can upgrade, pause or redirect it. Now imagine someone hostile gets that power. Keeping yesterday's interface cannot undo a change to the shared contract underneath.

Fixed bugs are harder to repair. Upgrade power can help repair them and can also be abused. A timelock helps only if users can notice the change and complete an exit in time.

Draw the powers in the deployed system, including the protocols it calls. Then ask what users can refuse, and what they can actually do afterward.

Short route (use instead if behind)

Uniswap v2 core illustrates fixed contract code with a separately operated interface. Its factory still has fee controls, and tokens and other dependencies still matter.

For an upgradeable app, an old interface cannot undo a hostile change to the shared contract. Fixed code trades easy repair for stable rules. Map the actual powers and test what users can refuse or leave.

Reference notes (not part of the spoken route)

Scope the Uniswap example to v2 core, not every version, router, token or surrounding service. The factory has feeTo and feeToSetter authority. This is not an allegation that v2 core uses an upgrade proxy. An app may inherit token freezes, oracle changes or other protocols' upgrades. Multisigs distribute authority without removing it.

EFS expresses the immutable-infrastructure goal. Claims about a user's actual guarantees must identify the exact deployed contracts and inherited dependencies.

Sources
https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy
https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol
https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Factory.sol

## 14. The network beneath the app

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

Planned 13:30-15:30

Our app inherits the network beneath it. Even our own node needs connectivity, peers and usable chain history. Transactions need inclusion, and the task needs an appropriate view of finality.

On an L2, ask what happens when the sequencer or another required operator stops. Can users still submit their transaction, reconstruct the needed state and reach settlement? Inspect the bridge and upgrade powers as well.

OP Stack documents an L1 submission route for sequencer outages. That is a transaction-inclusion mechanism. Withdrawal is a separate operation with its own requirements.

Test the specific chain, account and task your app uses. Record the fees and delay. Check whether users can complete the route without your backend.

Also keep two kinds of availability separate: data needed to reconstruct chain state and files your app needs to retain for years. Our EFS example uses Sepolia, so the testnet's lifetime is another explicit assumption.

We don't need every developer to build a chain. We do need to choose inherited assumptions deliberately and explain what happens when they fail.

Short route (use instead if behind)

Your app inherits its chain's connectivity, data, inclusion and settlement assumptions.

OP Stack documents an L1 route for transaction inclusion during a sequencer outage. Withdrawal is a different operation. Test the exact chain, account, fees, delay and required data without your backend.

Chain data availability also does a different job from retaining an application's files. Our EFS example inherits Sepolia's testnet lifetime.

Reference notes (not part of the spoken route)

For L2s, examine the sequencer, proposer, prover, bridge controls, data publication and reconstruction path. Forced-inclusion parameters and account behavior vary by chain. A documented route does not prove the user's transaction or withdrawal succeeds. Chain reconstruction data and long-term application-file retention require separate checks.

Sources
https://ethereum.org/developers/docs/nodes-and-clients/
https://docs.optimism.io/op-stack/protocol/outages

## 15. Operators and continuity

### On slide

Operators and continuity

Shared operators, cloud accounts and funding
Retained inputs and permission to operate
Documentation another maintainer can use

### Speaker notes

Planned 15:30-16:30

Across every layer, ask who controls the alternatives and who keeps them useful. Several services can share one cloud account, one credential or one person paying the bills. That person leaving can remove every apparent fallback at once.

A community can take over only if it has the means. That includes the code, the necessary data, permission to run it and instructions that make sense without the founder. It also needs a reason and a viable budget to keep operating.

Trace the shared dependencies, and give the recovery instructions to somebody outside the team. Ask where they get stuck. Decentralized infrastructure still involves work. Making that work transferable gives the application more possible futures.

## 16. Continuing somewhere else

### On slide

Continuing somewhere else

Safe CLI can use the same onchain account.
The blockchain path works without Safe’s API.
Users still need keys, gas and a usable route.

### Speaker notes

Planned 16:30-17:15

Return to the Safe account from earlier. Safe documents a command-line path that can manage the same account without its hosted API.

The user still needs compatible tools, enough supported signers, chain access and gas. Changing interfaces does not by itself recover missing keys or repair compromised account configuration. The CLI also doesn't reproduce every web feature.

For our archive, the equivalent test is opening the file and continuing the promised work elsewhere.

Give that task to a new person on a fresh setup. Record the missing steps and how long it takes. A path that only the founder understands still depends on the founder.

Reference notes (not part of the spoken route)

The independent route is Safe CLI's blockchain mode. Do not generalize that independence to its tx-service mode. Continuing through another interface, recovering a missing signing key and decrypting private content are different capabilities. Test the exact supported signer flow and account configuration.

Sources
https://docs.safe.global/advanced/cli-overview
https://docs.safe.global/advanced/cli-reference/common-commands

## 17. A walk-away test for your app

### On slide

A walk-away test for your app

Choose one task whose loss would hurt.
Try it without your team's services or help.
Test what hostile authority could change.
Fix the dependency that causes the most harm.

### Speaker notes

Planned 17:15-18:30

You can start this week without creating a new framework or redesigning your whole product.

Choose one task whose loss would hurt a user. Trace the components it needs and who controls them. Give another developer the retained inputs and instructions, then remove your services and personal help from the test. Use a safe environment, not real users' funds or only copies of their data.

Repeat the reasoning with the team's authority in hostile hands. Which changes can the user refuse? Which ones change shared state for everybody?

Write down what happened: the time, cost, missing information and remaining trust. Then choose the improvement with the greatest benefit to your users. You might remove an unnecessary power, make a service replaceable or preserve a usable exit. You may also accept a dependency for a good reason. The important step is knowing what that choice means before your users discover it during a crisis.

## 18. Their work can outlive us

### On slide

Their work can outlive us

### Speaker notes

Planned 18:30-19:00

I want apps we can trust with our most important work, and foundations other developers can rely on long after we're gone.

Every durable capability gives the next person something to build on. Their app can make our work useful in ways we never imagined.

That's why the walk-away test matters. We can build software whose usefulness keeps growing beyond us.

## 19. Questions

### On slide

Questions

Ethereum File System
Try the Sepolia app
Watch the EFS overview

### Speaker notes

Q&A

Thank you. I'd like to hear which dependency in your app would be hardest for a user to replace, and what a realistic recovery path would look like.

Sources
https://efs.eth.limo/
https://app.efs.eth.limo/
https://youtu.be/gZl711IriSM

Example directory
ENS and IPFS: slide 6
Runtime supply chain and Ledger: slide 7
Safe signer recovery: slide 8
EFS file verification: slide 10
State verification and index rebuilding: slide 11
PoolTogether workers and oracle inputs: slide 12
Uniswap v2 and change authority: slide 13
OP Stack inclusion route: slide 14
Safe CLI continuation: slide 16

Each example's primary sources are in that slide's notes. These are specific mechanisms and historical incidents, not whole-project safety ratings.
