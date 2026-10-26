# Positive-vision revision

Captured October 26, 2026. Native rehearsal copy, 29 slides.

Native presentation title: Who Can Turn Off Your Ethereum App? | Devcon rehearsal draft

Main planned duration: 18:30. Main narrative word count: 1961. Both values come from the current design plan; this is not a measured rehearsal or an organizer submission.

## 1. Who Can Turn Off Your Ethereum App?

### On slide

Who Can Turn Off
Your Ethereum App?

James Carnley
Ethereum File System

A Full-Stack Walk-Away Test

### Speaker notes

Planned 0:00-0:15

I'm James, and I build Ethereum File System. I want the things we build to remain useful long after we are gone. Today we'll look at what that asks of the whole application.

## 2. Why make an app you can walk away from?

### On slide

Why make an app you can walk away from?

Building Cypherpunk Apps

### Speaker notes

Planned 0:15-0:20

Why put the work into making an app people can keep using without you?

## 3. What happens when an app disappears?

### On slide

What happens when an app disappears?


Users lose their work and trust
Other developers can’t rely on that functionality
Communities splinter

### Speaker notes

Planned 0:20-1:05

Imagine someone with years of research notes, attachments and shared work inside an app. Then the company closes, or a new owner changes the deal. Their work still matters, but they lose the tools they need to use it.

Now imagine you built another app on that service. Your users inherit the same failure. Fragile foundations limit what we can responsibly build on top.

We can give people a better future. Let's look at how.

Optional detail (not part of the timed route)

The research-notes persona is illustrative, not an EFS customer or a deployed collaborative editor.

## 4. Software worth building on

### On slide

For people
Keep years of useful work
Choose better tools

For builders
Reuse dependable capabilities
Build bigger things together

Software worth building on

### Speaker notes

Planned 1:05-1:40

I want people to keep their work, choose better tools and trust software with important parts of their lives. And I want developers to build on useful capabilities without asking whether the original company will still exist next year.

That is why this work matters to me. Each dependable component gives the next builder somewhere to start. Over time, those components can support bigger shared projects and even the institutions our communities depend on.

## 5. Hyperstructures: shared foundations

### On slide

Hyperstructures: shared foundations

Public protocols that work without their creators

Wallet

Trading app

Community app

Open protocol with stable rules

Each new app adds value to the shared foundation

### Speaker notes

Planned 1:40-2:45

Hyperstructures give a name to part of this ambition: long-lived public protocols that anyone can use and build on. People can keep using them without the creator operating them or choosing who may participate.

Picture a shared exchange protocol. One team builds a wallet around it. Another builds a trading interface. A community uses it in a treasury tool. They can improve their own applications while relying on the same foundation.

The useful idea is that each new contribution adds to something others can keep using. I want that dependability to reach all the way from Ethereum to the software and data in a person's hands.

CROPS names the values we bring with us: censorship resistance, open source, privacy and security.

Optional detail (not part of the timed route)

The diagram illustrates a composability pattern, not three measured deployments. Jacob Horne's original hyperstructure definition includes additional economic properties, including protocol-wide fee conditions, participant incentives and value. This slide introduces the lasting public-protocol ambition, not a certification that every app in this talk satisfies the full definition. Blockchain operation and user transaction costs remain assumptions.

Sources
https://jacob.energy/hyperstructures.html
https://ethereum.org/foundation/mandate

## 6. A walk-away test

### On slide

The team disappears
Can users keep working?
Can others run the services?

Control becomes hostile
Can users keep their work?
Can they keep the rules they chose?

A walk-away test

### Speaker notes

Planned 2:45-3:15

The walk-away test makes that vision practical. Choose an important thing a user does. First, imagine your team and its services disappear. Can someone else help that user continue?

Then imagine someone hostile gets the powers your team kept. Can users keep their work and the rules they chose?

We'll carry those questions through the stack.

Optional detail (not part of the timed route)

Absence and hostile control are different scenarios. Use test accounts and copied data for exercises.

Sources
https://vitalik.eth.limo/general/2024/09/28/alignment.html

## 7. Interface

### On slide

Interface

Names and discovery
Runnable software
Accounts and recovery

Data

Storage and formats
State and indexes
Background work

Rules

Contracts and governance
Network and settlement

The application stack

### Speaker notes

Planned 3:15-3:35

There are eight jobs to consider, grouped into three chapters: getting into the app, continuing the work, and keeping dependable rules.

For each, we'll look at an improvement you can make and something you can check. People, documentation and funding support the whole picture.

## 8. Finding and using the app

### On slide

Finding and using the app

Interface

### Speaker notes

Planned 3:35-3:40

First, give people a dependable way into the app.

## 9. Can people find and use your app?

### On slide

Can people find and use your app?

Find a saved release
Run it without your servers
Recover access without your help

### Speaker notes

Planned 3:40-3:50

They need a way to find a release, run the software and recover their access. Those are three useful checks before we even reach the app's data.

## 10. More than one way into the app

### On slide

More than one way into the app

Save the release and the instructions to open it

DNS + HTTP

ENS + IPFS

DNS name

Team's server

Browser

ENS name

IPFS app release

Gateway or own node

### Speaker notes

Planned 3:50-5:05

A familiar website sends people through a domain to a web server. That is convenient. We can also give the app a release that people can retain and serve themselves.

Publish the web bundle to IPFS. Its content identifier names that particular release. An ENS name can point to it, and users can reach it through different gateways or their own IPFS node.

Now somebody else can keep an entrance open using the same release. Save the release identifier and the instructions somewhere people can find them.

The check is straightforward: open the saved app without its usual website. Then try an ordinary task inside it.

Optional detail (not part of the timed route)

The diagram simplifies discovery and retrieval. ENS controller/resolver/renewal powers still matter. A retained CID identifies a release but initial release authenticity and browser content verification require an appropriate trust path. An ordinary HTTP gateway may be trusted for the response. EFS uses ENS/IPFS, but this diagram is a general deployment pattern rather than a fresh hosting test.

Sources
https://docs.ens.domains/dweb/intro/
https://docs.ipfs.tech/how-to/websites-on-ipfs/single-page-website/
https://docs.ipfs.tech/concepts/ipfs-gateway/

## 11. A release others can run

### On slide

A release others can run

Keep a complete runnable release
Include the code it loads later
Publish source and build instructions
Try a fresh-machine rebuild

### Speaker notes

Planned 5:05-5:55

Give the next person a complete runnable release, and the source and build instructions to improve it.

A web app can load more code after its first page opens: a wallet connector, a script or a configuration file. Include those dependencies in your release plan. The Ledger Connect Kit incident is a reminder that delivered code is part of the application's security.

Try the app on a fresh machine. Can you open a deep link, read data and submit a change? Then give another developer the build instructions. A useful handoff lets them run the app and maintain it.

Optional detail (not part of the timed route)

Runnable releases and reproducible builds are separate checks. The Ledger Connect Kit reference is a historical distribution compromise, not a statement about current Ledger products. Inspect runtime network requests and retain exact dependency versions.

Sources
https://www.ledger.com/blog/security-incident-report

## 12. Access people can recover

### On slide

Access people can recover

Give users a recovery route
Safe example: two of three signers
Back up decryption keys for private files
Practice a lost-device recovery

### Speaker notes

Planned 5:55-6:45

The next job is keeping the user's access in their hands.

Safe gives a familiar example. A two-of-three account can let two remaining signers replace a lost signer. That gives the user a planned recovery route.

For private files, also plan how the person recovers their decryption keys. Walk through a lost-device scenario with a test account. Could they regain access without calling your team?

Publish an alternative way to use the account as well. Safe's command-line tools illustrate how a different interface can reach the same account.

Optional detail (not part of the timed route)

Safe thresholds, modules and guards depend on actual configuration. Two signers only suffice if the account's active rules permit the action. Account ownership, transaction signing and file decryption are distinct. Safe CLI's direct-chain path can avoid the hosted API, but transaction-service commands do not. No wallet operation or recovery test was performed.

Sources
https://docs.safe.global/advanced/smart-account-overview
https://docs.safe.global/advanced/cli-overview

## 13. Continuing the work

### On slide

Continuing the work

Data

### Speaker notes

Planned 6:45-6:50

Now let's make the user's work useful beyond a single app.

## 14. Is the data portable?

### On slide

Is the data portable?

Keep the files and their meaning
Use them through another app
Let others run the supporting services

### Speaker notes

Planned 6:50-7:00

Keep the files, keep their meaning, and give another app or operator the information needed to continue the task.

## 15. EAS

### On slide

EAS

Attestation schemas
Who said what

EFS

Shared file paths
Provenance and references

Nostr

Signed social events
Public posts and follows

Data other apps can understand

Publish the structure so another app can use the same records

### Speaker notes

Planned 7:00-7:55

Shared data structures let developers improve the tools while preserving the work underneath them.

EAS, the Ethereum Attestation Service, provides schemas for structured attestations: a common way to record who said what. Ethereum File System provides shared paths, provenance and file references. Nostr defines signed social events such as posts and follows.

These solve different jobs, but share a useful approach: publish the structure so another developer can understand and use the same records.

For your app, document the format, identifiers and relationships. Give someone enough information to build another reader. Then test a useful task with it.

Optional detail (not part of the timed route)

These are separate examples, not an integrated EAS/EFS/Nostr stack. Schema agreement includes semantics and authorization, not just field encoding. EAS signatures establish attester identity, not truth. EFS is the Sepolia working example; do not infer current v2 deployment or a deployed interchangeable editor.

Sources
https://attest.org/
https://github.com/ethereum-attestation-service/eas-contracts
https://efs.eth.limo/
https://github.com/nostr-protocol/nips/blob/master/01.md

## 16. Two apps, one social identity

### On slide

Two apps, one social identity

Your key lets you participate through either app

Damus

Amethyst

Shared Nostr events
Public posts and follows

Choose a different interface. Keep participating.

### Speaker notes

Planned 7:55-9:00

Damus and Amethyst make the benefit easy to picture. They are two applications using Nostr.

Your identity is a key. Public posts and follows use shared event formats. With that key and available copies of your events, you can use another client and keep participating in the same network.

The next developer can make a better interface without asking everyone to rebuild their social identity. That is the kind of competition I want: better tools around work the user can keep.

Ask the same question of your own data. Could a second application open it and carry on?

Optional detail (not part of the timed route)

Documentation-backed public-event interoperability, not a fresh Damus-to-Amethyst migration test. Limit the claim to supported identity, public posts and follow-list conventions. Media availability, relay retention, moderation, client features and private messages vary. Preserve keys safely. This is a non-Ethereum comparison and does not depict an EFS integration.

Sources
https://damus.io/
https://amethyst.social/
https://github.com/damus-io/damus#spec-compliance
https://github.com/vitorpamplona/amethyst#supported-features
https://github.com/nostr-protocol/nips/blob/master/01.md
https://github.com/nostr-protocol/nips/blob/master/02.md
https://github.com/nostr-protocol/nips/blob/master/10.md

## 17. Data people can keep using

### On slide

Data people can keep using

Retain copies with independent operators
Use documented formats and identifiers
Protect private data and recover its keys
Restore a real piece of work from a backup

### Speaker notes

Planned 9:00-9:50

Useful data needs someone to keep it. Arrange retained copies with independent operators and make it easy for the user to keep their own backup.

Preserve the format information and the keys needed to read private material. For personal work, local storage and local computation can be part of this design too.

The check is to restore a real piece of work from another copy, then open it in the tool that needs it. Include the attachments and relationships that make it useful.

Make retention an operating plan with a budget, so people know who will keep serving those copies.

Optional detail (not part of the timed route)

Multiple gateways can share one retained source. Content addressing identifies bytes but does not retain them. Preserve application releases, schemas and required history as well as user files. Encryption does not remove metadata exposure or guarantee revocation of copies. Pocket's export preserved links and metadata rather than saved article text; retain as an optional failure example.

Sources
https://docs.ipfs.tech/concepts/persistence/
https://www.inkandswitch.com/essay/local-first/
https://support.mozilla.org/en-US/kb/exporting-your-pocket-list

## 18. EFS: a file you can verify

### On slide

EFS: a file you can verify

Keep the reference and choose where to retrieve the file

EFS file reference
Expected digest

IPFS copy

Arweave copy

Check digest
Matching file

### Speaker notes

Planned 9:50-11:00

Here is EFS on Sepolia. A public file record gives us a reference to the file we want, including an expected digest.

We can retrieve a copy through IPFS and compare the bytes with that digest. We can retrieve a copy through Arweave and do the same check. The carrier can change while the file we accept stays the same.

That gives users and other applications a useful freedom: choose a provider, check the result and keep their own copy.

For your app, try retrieving a retained alternative copy against the same accepted reference. This is a small test you can actually run.

Optional detail (not part of the timed route)

Static explanation of the historical EFS proof package, not a fresh retrieval run. If asked: altered bytes fail the digest check; an unavailable response means that route failed, not proof of global loss. A matching digest establishes byte integrity relative to the accepted reference. Authority, freshness, completeness and semantic truth are other questions. IPFS CIDs and an application-level file digest have different roles.

Sources
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## 19. A dependable view of the data

### On slide

A dependable view of the data

Let users choose an RPC or their own node
Use verified reads where supported
Show how recent the data is
Publish what another indexer needs to rebuild

### Speaker notes

Planned 11:00-11:55

Apps also need a dependable view of chain state. Make the RPC endpoint configurable, so a user or operator can choose another provider or their own node.

For supported chain reads, a light client such as Helios offers a path to checking responses against the chain. Show users how recent the data is.

Indexes turn records into useful lists and searches. Publish the index definition and the history needed to rebuild it. Graph Node is one example of software another operator can run.

The practical check is to switch the endpoint and rebuild one important view. Can the user still find the records their task needs?

Optional detail (not part of the timed route)

Multiple RPCs improve availability but their agreement alone is not independent verification. Helios support and trust assumptions vary by network and method; it does not verify arbitrary index queries or retain files. Completeness and freshness are task-specific. Graph Node needs manifests, linked files, suitable history, chain access and a database. No EFS light-client or automatic failover integration is claimed.

Sources
https://github.com/a16z/helios
https://thegraph.com/docs/en/indexing/tooling/graph-node/

## 20. Work another operator can do

### On slide

Work another operator can do

Publish the worker code and required inputs
Make the job open to another operator
Give someone a reason to run it
Example: PoolTogether prize claimers

### Speaker notes

Planned 11:55-12:35

Somebody also has to do the work around a contract: submit a transaction, update an input, relay a message or trigger a scheduled action.

PoolTogether V5 gives a concrete example. It rewards permissionless claimers for delivering prizes. That gives another participant a reason to take over the job.

List your app's background jobs. Publish the code and inputs, make replacement possible, and account for the cost. Then stop your worker in a test environment and see whether another operator can finish the task.

Optional detail (not part of the timed route)

Use the PoolTogether V5 example specifically. Claims have economic and timing conditions and unclaimed prizes can expire. Oracles, bundlers, paymasters, provers and relayers can carry additional authority or secret inputs. Do not imply all computation can be replaced by a generic keeper.

Sources
https://dev.pooltogether.com/protocol/design/prize-claimer/

## 21. Keeping dependable rules

### On slide

Keeping dependable rules

Rules

### Speaker notes

Planned 12:35-12:40

Finally, let's give people rules they can build on.

## 22. Who chooses the changes?

### On slide

Who chooses the changes?

Stable core contracts
User-chosen app upgrades
Clear rules for shared governance

### Speaker notes

Planned 12:40-12:50

Stable contracts give builders a foundation. User-chosen app upgrades let better tools grow around it. Shared systems need a clear agreement about how their rules evolve.

## 23. Immutable contracts

### On slide

A stable core
Keep the contract code fixed
Let other apps build on it

Room to improve
Deploy a new version
Let users choose to migrate

Immutable contracts

Example: Uniswap v2 core

### Speaker notes

Planned 12:50-14:15

I want to encourage you to build immutable core contracts. When the logic at an address stays fixed, another developer can build against it without depending on the original team's future decisions.

Uniswap v2 core is a useful example of fixed contract code that other applications can call. The interface can keep improving around that shared capability.

You can develop new versions by deploying new contracts and letting users choose when to move. Keep the old contract and its instructions usable for people who stay.

For most app software, I want that choice to belong to the user. Networks like Ethereum coordinate changes to shared protocol rules, which is a different kind of decision.

The practical step is to identify the smallest core you can keep stable, test it carefully, and remove unnecessary upgrade powers. That is a foundation other people can confidently build on.

Optional detail (not part of the timed route)

Fixed code preserves encoded logic, not every input or economic condition. Uniswap v2 Factory retains bounded protocol-fee configuration through feeTo/feeToSetter; there is no arbitrary upgrade mechanism in these core contracts. Immutability removes in-place repair, so scope the core, test/audit it and plan voluntary new deployments. Dependencies, governance, pause and token powers remain relevant. EFS immutability is James's goal, not a newly verified deployment claim. Keeping a client release cannot reverse a shared-contract upgrade.

Sources
https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Factory.sol
https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol

## 24. The network beneath the app

### On slide

Ethereum and L1
Keep a working node route
Retain the history you need
Understand inclusion and finality

L2 and settlement
Know who orders and proves
Find the required chain data
Practice the recovery route

The network beneath the app

### Speaker notes

Planned 14:15-15:35

Your app also inherits the network underneath it. On Ethereum, nodes and validators provide access to shared state and agreement about accepted transactions. Make sure the app has a working path to that network and the history it needs.

On an L2, learn which components order transactions, publish the data and establish the result on the settlement chain. Then find the documented recovery route for your chosen network.

For example, OP Stack documentation describes a way to submit through L1 when a sequencer is unavailable. Turn that documentation into instructions for the account and task your user actually has.

Choose a network whose normal operation and recovery paths fit the promise your app makes.

Optional detail (not part of the timed route)

L1 inclusion/finality, peer connectivity, required history, L2 sequencer/proving/data availability and bridge powers are distinct dependencies. Forced inclusion and withdrawal are different operations. OP Stack recovery details vary by chain/configuration and account. This talk gives a design check, not a tested universal L2 escape route.

Sources
https://ethereum.org/developers/docs/nodes-and-clients/
https://docs.optimism.io/op-stack/protocol/outages

## 25. A community can carry it forward

### On slide

A community can carry it forward

Hic et Nunc community mirrors kept an entrance open
Teia continued the community’s work
Share code, retained data and operating instructions
Plan who can run it and pay for it

### Speaker notes

Planned 15:35-16:20

These improvements become real when other people can operate the system.

When Hic et Nunc's website closed, community mirrors gave people another entrance, and the community went on to build Teia. Available code, retained artwork and people willing to run services made that possible.

Help the next operator succeed. Publish the instructions, retain the inputs and explain the running costs. Aim for several independent participants at important layers.

Give someone outside your team the handoff. Their questions will show you where the next useful improvement is.

Optional detail (not part of the timed route)

This is a Tezos example. Teia used a new marketplace contract, so continued access is not a claim that every feature and rule stayed identical. Three operators is James's useful ambition, not a universal threshold. Shared cloud accounts, credentials and funders can correlate failures.

Sources
https://docs.teia.art/faqs/general-faqs

## 26. A walk-away test for your app

### On slide

A walk-away test for your app

Putting this into practice

### Speaker notes

Planned 16:20-16:25

Here is the checklist to take back to your own app.

## 27. Your walk-away checklist

### On slide

Your walk-away checklist

A user can
Run a saved app release
Recover access and keys
Restore usable data
Choose another client

Another operator can
Switch RPCs; rebuild views
Run workers; keep copies
Inspect admin powers
Use network recovery

Try it without your team. Improve one dependency.

### Speaker notes

Planned 16:25-17:45

Choose one task whose loss would hurt a user. For a notes app, that might be opening existing work and adding another note.

Can someone find and run a saved release, recover their access, restore the data and use a compatible tool? Can another operator switch the RPC, rebuild the important views and run the background jobs? Can they explain the contract powers and use the network's recovery path?

Have someone else try that task without your team's services or personal help. Then examine what a hostile holder of the remaining powers could change.

Use test accounts and copies. Record where they get stuck, and choose one improvement. You can start making the app more dependable without rebuilding the whole stack at once.

Optional detail (not part of the timed route)

Checks summarize the talk, not a maintained certification system. Repeat after meaningful changes. Record the observed result, time, cost, required data and remaining assumptions. No fresh end-to-end application test was performed during deck preparation.

## 28. Our work can outlive us

### On slide

Our work can outlive us

### Speaker notes

Planned 17:45-18:30

I want a future where people can trust software with the important parts of their lives. Where their work remains theirs, better tools can use it, and developers keep adding to foundations everyone can build on.

That is what draws me to Ethereum and what I am trying to contribute with EFS.

Start with one important task. Make it easier for someone else to keep it working. Every dependable piece gives the next person more to build with.

Our work can outlive us.

## 29. Thank you!

### On slide

Thank you!

James Carnley
Ethereum File System
efs.eth.limo
JamesCarnley@gmail.com
@JamesCarnley


Let’s build reliable and long-lasting apps together

### Speaker notes

Q&A

Thank you. Which part of your app would you most like to make independent of your team?

Optional detail (not part of the timed route)

Q&A and public contact slide. No live demo or new protocol deployment is claimed.

Sources
https://efs.eth.limo/
https://app.efs.eth.limo/
https://youtu.be/gZl711IriSM
