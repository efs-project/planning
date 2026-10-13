# Content-first rehearsal snapshot

Captured October 13, 2026 from the native rehearsal deck. Eighteen main slides, 19 minutes planned, plus a resource/Q&A page. This revision has not been rehearsed. Timings below are planning allocations, not measured delivery times. The EFS verification slide explains a check sequence, not newly captured retrieval results.

## 1. Who Can Turn Off Your Ethereum App?

Planned 0:00-0:15

### On slide

Who Can Turn Off
Your Ethereum App?

James Carnley
Ethereum File System

A Full-Stack Walk-Away Test

### Speaker notes

I'm James Carnley, the creator of Ethereum File System. I want the things people build with my software to have a future that doesn't depend on me. Today we'll look at what that asks of the whole application.

## 2. When an app closes

Planned 0:15-1:30

### On slide

When an app closes

People keep years of work in applications.
Pocket closed in 2025.
Users had to recover and move their libraries.

### Speaker notes

Think about what people put into an app. A reading library built over years. A community's shared archive. The records they need to keep an organization running. The company can close long before that work stops mattering.

Pocket closed in 2025. Users had a limited window to export their saves. The export contained article links and metadata, but not the article text. Keeping a useful reading library became a migration project, with a deadline somebody else chose.

The harm goes beyond a missing website. People lose time, context and the ability to continue a familiar task. Other apps inherit the same problem when they depend on that service. A shutdown exposes a dependency that was there all along. We can design for a different outcome.

Sources
https://support.mozilla.org/en-US/kb/future-of-pocket
https://support.mozilla.org/en-US/kb/exporting-your-pocket-list

## 3. Software people can inherit

Planned 1:30-2:30

### On slide

Software people can inherit

### Speaker notes

Imagine a community archive whose creator retires. Someone else can keep it useful. Imagine an organization changing software without leaving its history behind. Imagine another developer building a new app on shared public records without needing a deal with the company that published them.

That's the cypherpunk future I want to help build. Users have choices because the software gives them the means to act. Important workflows can become something we maintain together, instead of something we rent until one provider changes its mind.

The hyperstructures idea gives us a useful ambition: shared protocols that outlast their creators. To make that real for a user, we also need the interface, data and recovery paths around the protocol. People will still maintain infrastructure. The design should let those people change.

Sources
https://jacob.energy/hyperstructures.html

## 4. Absence and hostile control

Planned 2:30-3:15

### On slide

The team disappears
Can users continue without its services or help?

The keys change hands
Can users refuse a harmful change and continue?

Absence and hostile control

### Speaker notes

There are two different situations to test. First, the team disappears. The founder dies, the company closes, or the storage bill stops getting paid. Can people keep doing the task?

Second, somebody hostile gets the team's authority. That might mean a compromised publishing account, an upgrade key, or control of a name. The service can remain online while working against its users. Can they refuse the change?

More servers can help with the first problem and do nothing about the second. We'll keep both questions in view, and judge recovery by whether a person can actually continue. We can test this safely using copies and test accounts.

## 5. The application stack

Planned 3:15-4:00

### On slide

The application stack

Entering the app
Names, software, identity
Continuing the work
Data, state, computation
Keeping the rules
Application control, network and settlement

### Speaker notes

Here's the map. These are eight jobs an application needs, grouped into three chapters. First we enter the app. Then we do useful work. Underneath both are the rules and the network enforcing them. A dependency can affect more than one chapter.

I'll use Ethereum File System, or EFS, where it makes these questions concrete. It's an open-source public good for shared file paths, onchain metadata and verifiable file references. The file bytes can live on different storage networks. Our small example is recovering a file and checking that it's the one we expected.

For your app, follow whichever task your users most need to preserve. At every layer, ask what it does, what can fail, and what a usable alternative would cost.

Sources
https://efs.eth.limo/
https://app.efs.eth.limo/

## 6. Names and entry points

Planned 4:00-5:00

### On slide

Names and entry points

ENS points to an app release.
HTTPS gateways provide access routes.
A retained release needs a tested independent path.

### Speaker notes

The first job is reaching the software. EFS's public web client uses ENS and IPFS. The name points to content, and an HTTPS gateway makes it convenient to open in an ordinary browser.

That separates the app release from my own web server, but the gateway still has an operator. There's a useful catch: eth.link and eth.limo share the eth.limo service. Two addresses don't necessarily give us two independent alternatives.

The check is to retain the accepted release reference and actually open it through an independent path. Then inspect the name's controller, resolver and renewal requirements. A mutable name helps people find updates, but somebody can change where it points. A fixed reference preserves a choice, while making discovery and deliberate updates our responsibility.

Sources
https://docs.ens.domains/dweb/intro/
https://discuss.ens.domains/t/eth-limo-update/19707
https://app.efs.eth.limo/

## 7. The code that actually runs

Planned 5:00-6:15

### On slide

The code that actually runs

A retained, runnable release
Source and the inputs needed to rebuild it
Every script the app loads after startup

### Speaker notes

Now the user has reached a page. What code will it execute?

In December 2023, attackers compromised the distribution of Ledger Connect Kit. Apps loaded malicious connector code, and users were tricked into signing transactions that drained assets. Those apps' own repositories didn't need to change. Their runtime dependency was another publishing channel into the app.

So keep the runnable release and inspect everything it loads later. Separately, retain the source, dependency versions, build tools and instructions needed to recreate it. Open it on a fresh setup without the founder's cache. Then try rebuilding it.

Keeping reviewed code together and making updates deliberate reduces surprise changes. It also leaves real maintenance work: security fixes, browser compatibility and supported devices. Retaining the code gives another maintainer something they can carry forward.

Sources
https://www.ledger.com/blog/security-incident-report

## 8. Accounts and recovery

Planned 6:15-7:30

### On slide

Accounts and recovery

Reading a file
Decrypting private content
Signing or changing shared state

### Speaker notes

The app and file can survive while the owner loses the ability to use them. Reading public data, decrypting private content and signing a change require different capabilities.

A hosted login might disappear. A wallet connection service might fail. The only decryption key might be on a lost device. These are separate recovery tests. Ask what the person needs, who can help them recover it, and who gains power through that help.

Safe provides a useful authority example. Enabled modules can authorize operations through their own logic, so the visible owner threshold doesn't describe every path into the account.

Rehearse provider and device loss with test accounts. Check signing and decryption separately. Recovery can reduce lockout while adding takeover or privacy risks. Those are choices to make explicitly, not reasons to leave recovery untested.

Sources
https://docs.safe.global/advanced/smart-account-modules

## 9. Data that remains available

Planned 7:30-8:15

### On slide

Data that remains available

Someone retains the actual bytes.
Another operator can retrieve them.
Private data needs decryption recovery.

### Speaker notes

The second chapter is continuing the work. Storage has a straightforward job: keep the bytes someone will need. A content address identifies data, but somebody still has to retain it. Two gateways may be two routes to the same remaining copy.

For EFS, the onchain reference and the file's storage are separate dependencies. For another app, the missing piece might be an attachment, a database history or a decryption key.

Test retrieval from a genuinely retained alternative copy. Know who pays for retention and how another operator takes over. Replication costs resources. Private information also needs an appropriate retention policy. Publishing everything permanently is rarely a sensible recovery plan.

Sources
https://docs.ipfs.tech/concepts/persistence/
https://efs.eth.limo/

## 10. File verification with EFS

Planned 8:15-9:15

### On slide

File verification with EFS

An accepted public record and expected digest
The same file through IPFS or Arweave
Matching bytes, altered bytes, or no response

### Speaker notes

Here's the verification sequence for our EFS example. Begin with an accepted public file reference, including which chain state supplied it. That reference gives us the expected digest. Retrieve a candidate copy through IPFS and check its bytes.

If that path fails, try the Arweave copy against the same reference. Matching bytes support the integrity check. Altered bytes fail it. No usable response means this retrieval path was unavailable. It doesn't tell us the file is gone everywhere.

These are the checks we're explaining here, rather than a live retrieval. The useful distinction is between changing the route and changing what you accept. The same test also exposes its limits: somebody must retain a copy, and we still need a basis for trusting the public record. A hash alone cannot choose that reference for us.

Sources
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## 11. State you can rely on

Planned 9:15-10:30

### On slide

State you can rely on

Reachable: a provider answers
Verified: evidence supports the claim
Fresh: the state is recent enough
Complete: the task has all required records

### Speaker notes

To check a file this way, how do we establish its reference? This is the job of RPCs, indexes and the queries using them.

Multiple RPCs can help when one provider stops answering. Agreement between them doesn't independently establish correctness. Light clients such as Helios can validate supported data against a chain basis, while still needing providers to serve it. They don't retain our files for us.

Freshness and completeness are additional questions. A valid old record may be useless for the current task. A correct result can omit other records the user needs. Graph Node illustrates why rebuilding an index needs its definition, suitable chain access and enough history.

Specify what state the task needs. Test a replacement query and validate the evidence it supports. Keep missing or stale results visible. Verification and rebuilding cost time and resources, but they let users make informed choices.

Sources
https://ethereum.org/developers/docs/nodes-and-clients/light-clients/
https://github.com/a16z/helios
https://thegraph.com/docs/en/indexing/tooling/graph-node/

## 12. The work outside the contracts

Planned 10:30-11:30

### On slide

The work outside the contracts

Required workers and external inputs
Permission and resources to replace them
A safe response when the work stops

### Speaker notes

A healthy chain doesn't mean the application can finish its work. A keeper may trigger an operation. A relayer may submit it. A prover may be required before the contract accepts it. A paymaster may be paying fees the user can't currently pay another way.

Follow one operation and list the work that happens before and after the transaction. Then stop the required service in a test environment. Can another operator get the code and inputs, have the necessary permission without new approval from the original team, and afford to complete it?

Oracles add another dependence. Chainlink's documentation makes freshness part of the consumer's responsibility. A replacement source can have different meaning or trust assumptions. Sometimes the safe outcome is to pause a sensitive operation rather than continue with an unexamined fallback. Recovery needs usable inputs and incentives as well as open code.

Sources
https://docs.chain.link/data-feeds/overview#check-the-timestamp-of-the-latest-answer

## 13. Rules and change authority

Planned 11:30-13:30

### On slide

Changeable rules
Who can upgrade, pause or redirect the app?
Can the user refuse?

Fixed rules
What behavior stays fixed?
How can users move if it breaks?

Rules and change authority

### Speaker notes

The third chapter asks what rules the user can rely on. An application may have an upgrade key, a pause role, configurable addresses, governance, or permissions in a protocol it calls. Draw the powers as they exist in the deployed system, rather than stopping at the word decentralized.

Now give one of those powers to a hostile actor. What can they change? Can the user detect it and refuse? Keeping an old interface preserves its code, but it cannot reverse an upgrade to the shared contract underneath.

This is why I care about immutable public infrastructure. Fixed rules can let other people build without depending on my future decisions. EFS is an expression of that goal. The meaningful technical claim still concerns the exact contracts and dependencies people use.

There are tradeoffs. Fixed buggy code loses in-place repair. Upgradeable code keeps repair power and the possibility of abuse. A multisig distributes a power without removing it. A timelock buys useful time only if someone can notice the change and complete an exit.

Uniswap's distinction between its interface and underlying protocol helps illustrate the layers. We should inspect authority at both. An unchanged application can also inherit a token freeze, an oracle change or an upgrade in another protocol. The user's actual choices define the recovery path.

Sources
https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy
https://docs.safe.global/advanced/smart-account-modules

## 14. The network beneath the app

Planned 13:30-15:30

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

Our application inherits the network underneath it. Users need internet access. Nodes need peers and working clients. Transactions need inclusion, and the task needs an appropriate view of finality. Replacing an RPC vendor with your own node changes the dependence, but doesn't remove connectivity, hardware or network assumptions.

An L2 introduces another set of questions. Who orders transactions? Who publishes the data needed to reconstruct state? What happens if the sequencer, proposer or prover stops? Which contracts can still change, including the bridge?

The OP Stack documentation gives a specific recovery example for sequencer outages through an L1 submission route. Forced inclusion and withdrawal are different operations. A documented mechanism still has to work for the user's account, available data and intended task. Other chains have different rules.

Test the route your app actually depends on. Record the delay and fees, and check whether an ordinary user can use it without your backend. Chain data availability for reconstruction is also different from retaining application files for years.

We don't need every developer to build a chain. We do need to choose inherited assumptions deliberately and explain what happens when they fail. The EFS example here uses Sepolia, so testnet lifetime is another assumption, not a promise of permanent production availability.

Sources
https://ethereum.org/developers/docs/nodes-and-clients/
https://docs.optimism.io/op-stack/protocol/outages

## 15. Operators and continuity

Planned 15:30-16:30

### On slide

Operators and continuity

Shared operators, cloud accounts and funding
Retained inputs and permission to operate
Documentation another maintainer can use

### Speaker notes

Across every layer, ask who controls the alternatives and who keeps them useful. Several services can share one cloud account, one credential or one person paying the bills. That person leaving can remove every apparent fallback at once.

A community can take over only if it has the means. That includes the code, the necessary data, permission to run it and instructions that make sense without the founder. It also needs a reason and a viable budget to keep operating.

Trace the shared dependencies, and give the recovery instructions to somebody outside the team. Ask where they get stuck. Decentralized infrastructure still involves work. Making that work transferable gives the application more possible futures.

## 16. An exit someone can actually use

Planned 16:30-17:15

### On slide

An exit someone can actually use

A new person or a fresh machine
Enough data, context and keys
The original task completed elsewhere

### Speaker notes

An export is useful when somebody can continue with it. Return to the task we chose at the start. Can the user reopen the archive and read the file? Can they also publish, collaborate or decrypt, if that was the promise?

A self-contained Git bundle is a useful example of retained data with a compatible importer. It can preserve repository history and let someone clone it elsewhere. It doesn't reproduce every hosted service around that repository.

Try the recovery from a fresh setup. Keep the relationships, formats and keys the task needs. Measure the time and missing features. A path that only the founder understands still depends on the founder.

Sources
https://git-scm.com/docs/git-bundle

## 17. A walk-away test for your app

Planned 17:15-18:30

### On slide

A walk-away test for your app

Choose one task whose loss would hurt.
Try it without your team's services or help.
Test what hostile authority could change.
Fix the dependency that causes the most harm.

### Speaker notes

You can start this week without creating a new framework or redesigning your whole product.

Choose one task whose loss would hurt a user. Trace the components it needs and who controls them. Give another developer the retained inputs and instructions, then remove your services and personal help from the test. Use a safe environment, not real users' funds or only copies of their data.

Repeat the reasoning with the team's authority in hostile hands. Which changes can the user refuse? Which ones change shared state for everybody?

Write down what happened: the time, cost, missing information and remaining trust. Then choose the improvement with the greatest benefit to your users. You might remove an unnecessary power, make a service replaceable or preserve a usable exit. You may also accept a dependency for a good reason. The important step is knowing what that choice means before your users discover it during a crisis.

## 18. Their work can outlive us

Planned 18:30-19:00

### On slide

Their work can outlive us

### Speaker notes

I want people to trust software with work that matters to them, and I want other developers to build on it with confidence.

A community can gain a new maintainer. A shared record can support an app its original author never imagined. People still need to retain data and run infrastructure, but the original team needn't control the future.

Our users' work may matter long after we're gone. We can give it a way to continue.

## 19. Questions

Resource/Q&A page, outside the main timed talk.

### On slide

Questions

Ethereum File System
Try the Sepolia app
Watch the EFS overview

### Speaker notes

Thank you. I'd like to hear which dependency in your app would be hardest for a user to replace, and what a realistic recovery path would look like.

Sources
https://efs.eth.limo/
https://app.efs.eth.limo/
https://youtu.be/gZl711IriSM
