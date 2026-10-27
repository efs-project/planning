# Before the polish revision

Captured October 26, 2026. Native rehearsal copy, 30 slides.

Native presentation title: Who Can Turn Off Your Ethereum App? | Devcon rehearsal draft

Preserves the native slide text and speaker notes captured before this revision.

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

Imagine years of notes, attachments and shared work inside an app. The company closes, or a new owner changes the deal. Your work still matters, but you lose the tools you need to use it.

If you built another app on that service, your users inherit the failure. This is why fragile apps make poor foundations for important work.

I want users to keep their work and builders to rely on each other. We can make choices now that give both a better future.

Optional detail (not part of the timed route)

Illustrative human stakes, not a customer testimonial. Shutdown and hostile changes create different recovery problems.

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

## 5. Hyperstructures: build on each other

### On slide

Hyperstructures: build on each other

Community social app
Team F

DAO app
Team D

Moderation
Team E

Membership
Team A

Voting
Team B

Treasury
Team C

Independent teams work together via stable interfaces

### Speaker notes

Planned 1:40-2:35

Hyperstructures give a name to this ambition: lasting public protocols that anyone can use and build on without depending on their creators.

Different teams provide membership, voting and treasury components. A DAO app combines them. Another team builds a social app using that DAO and a moderation module.

Each team adds a useful capability instead of rebuilding everything beneath it. Stable interfaces and dependable operation let their work accumulate.

That is the future I want us to build. CROPS brings our values: censorship resistance, open source, privacy and security.

Optional detail (not part of the timed route)

Illustrative composition, not a deployed DAO or a claim that every module meets the full hyperstructure definition. Arrows point from a reusable capability to its consumer. Moderation changes an interface's selection, not all retained records or the DAO's shared rules. Jacob Horne's definition has additional economic conditions. Ethereum operation, storage, funding and participants remain assumptions.

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

Planned 2:35-3:10

The walk-away test gives us a way to work toward that future. Choose a task your users already rely on.

First, your team disappears. Can users continue and can someone else operate what they need? Then, someone hostile gets your team's powers. What could they change, and what could users refuse?

At each layer, we want to remove a single point of failure or control. Other operators can keep services running. Credibly neutral contracts can enforce shared rules.

Optional detail (not part of the timed route)

Absence and hostile control are separate scenarios. Several operators only help when they have the inputs and authority to act independently. Use test accounts and copied data for exercises.

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

Planned 3:10-3:30

There are eight jobs to consider, grouped into three chapters: getting into the app, continuing the work, and keeping dependable rules.

For each, we'll look at an improvement you can make and something you can check. People, documentation and funding support the whole picture.

## 8. Finding and using the app

### On slide

Finding and using the app

Interface

### Speaker notes

Planned 3:30-3:35

First, give people a dependable way into the app.

## 9. Can people find and use your app?

### On slide

Can people find and use your app?

Find a saved release

Run it without your servers

Recover access without your help

### Speaker notes

Planned 3:35-3:45

They need a way to find a release, run the software and recover their access. Those are three useful checks before we even reach the app's data.

## 10. More than one way into the app

### On slide

More than one way into the app

DNS + HTTP

DNS name
ethereum.org

Hosted website endpoint
104.18.176.152

Page in
your browser

ENS + IPFS

ENS name
efs.eth

IPFS release
bafybeicrisk…p5ku

Operator A copy

Operator B copy

Operator C copy

IPFS gateways: efs.eth.limo (or .link) or your own IPFS node

### Speaker notes

Planned 3:45-4:55

Here are real names and lookup values. Ethereum dot org resolves to network addresses for a hosted website. That endpoint serves the page.

EFS dot eth points to an IPFS content identifier for a particular release. Different people can retain that same release and serve identical files. The lower drawing shows the arrangement we want: independent copies that other people can keep available.

People can open the name through dot limo or dot link, or use their own IPFS node. Those are ways to reach the release. Keeping the release with several operators gives those entrances something to serve.

Save the identifier and opening instructions. Then try an ordinary task without the usual website.

Optional detail (not part of the timed route)

Lookup snapshot: 2026-10-26. ethereum.org returned A records 104.18.176.152 and 104.19.239.224 through both 1.1.1.1 and 8.8.8.8. These are Cloudflare network endpoints, not proof of one physical server; the slide groups the hosted service, not its internal machines. ENS mainnet at block 26279986 (hash 0xd812e26824d24b4ef54112803d47e0fdb7b6c5ffabe1631d624ab2cb1c349b0e, 22:54:35Z) resolved efs.eth through resolver 0xF29100983E058B709F3D539b0c765937B804AC15 to ipfs://bafybeicrisk74xwozdpx4v5kaqjmimzjqsrp74r5tsrgdyv5kju3dnp5ku. The shortened CID on the slide is explicitly an abbreviation. Three retained copies are an illustrative deployment pattern, not a measured EFS operator count. .link and .limo share the eth.limo operator; do not count them as independent retention. ENS controller, resolver and renewal powers and browser verification remain relevant.

Sources
https://docs.ens.domains/dweb/intro/
https://docs.ens.domains/ensip/7/
https://docs.ipfs.tech/concepts/content-addressing/
https://docs.ipfs.tech/concepts/persistence/
https://discuss.ens.domains/t/eth-limo-update/19707
https://developers.cloudflare.com/dns/proxy-status/

## 11. A release others can run

### On slide

A release others can run

What if the page opens but its scripts are gone?

Runnable release
HTML + JavaScript
Styles + images
Config + loaded code

Build materials
Source code
Locked dependencies
Build instructions

A user opens the app

A developer rebuilds it

Check both paths on a fresh machine

### Speaker notes

Planned 4:55-5:40

A release is the application someone can actually open: HTML, JavaScript, styles, images and configuration, including code loaded later.

Keeping only the homepage can leave it waiting for a script from a vanished server. Publish the complete runnable bundle.

Also keep the source, locked dependencies and build instructions. A user can run the saved release. Another developer can rebuild and improve it.

Check both paths on a fresh machine. Can someone perform a useful task without your hosting or your build account?

Optional detail (not part of the timed route)

Running a saved release and reproducing a build are separate checks. Inspect dynamic imports, remote configuration, wallet connectors and deep links. The Ledger Connect Kit compromise is an optional historical example of distribution becoming an attack path.

Sources
https://docs.ipfs.tech/how-to/websites-on-ipfs/single-page-website/
https://www.ledger.com/blog/security-incident-report

## 12. Access people can recover

### On slide

Access people can recover

Safe example: two of three signers

Lost phone
Signer 1 offline

Backup signer
Signer 2

Recovery signer
Signer 3

Two signers replace the lost key

Same account
Same permissions

Practice lost-device recovery. Back up private-file keys too.

### Speaker notes

Planned 5:40-6:25

The app may survive while the user loses access to it. Think about a lost phone or a login service that closes.

With a Safe configured for two of three signers, two remaining signers can replace the lost key. The person keeps the same account and its permissions.

Private files also need recoverable decryption keys. A replacement client needs a documented encryption format and the user's authorization to decrypt.

Try a lost-device recovery with a test account. Could the user return without your personal help?

Optional detail (not part of the timed route)

Safe is a real Ethereum example; the signer arrangement is illustrative. Owners, threshold, modules and guards determine actual recovery. Key independence depends on the threat model. Account recovery does not reconstruct file-decryption keys. Standard encryption needs a compatible envelope, key derivation, algorithm version and user-controlled key recovery. Never expose production keys in a practice exercise.

Sources
https://docs.safe.global/advanced/smart-account-overview
https://docs.safe.global/advanced/cli-overview

## 13. Continuing the work

### On slide

Continuing the work

Data

### Speaker notes

Planned 6:25-6:30

Now let's make the user's work useful beyond a single app.

## 14. Is the data portable?

### On slide

Is the data portable?

Keep the files and their meaning
Use them through another app
Let others run the supporting services

### Speaker notes

Planned 6:30-6:40

Keep the files, keep their meaning, and give another app or operator the information needed to continue the task.

## 15. Data another app can understand

### On slide

Data another app can understand

Example shared record

{
	id: note-17
author: 0xDEADBEEF…
text: Meeting at 10
filename: agenda.md
}

Shared meaning

What each field means
Who can change it
How versions fit together
How users decrypt it

EAS uses schemas. Existing databases can offer documented exports.

### Speaker notes

Planned 6:40-7:40

Another app needs to understand what your data means. This small record has an identifier, an author, some text and an attachment. Its file reference selects the accepted version. Publish the field meanings and the rules for reading and changing it.

EAS, the Ethereum Attestation Service, makes this idea explicit through schemas for structured statements and a record of who made them.

Your existing database can benefit too. Export a documented format with stable identifiers and relationships. Include attachments and the encryption information an authorized reader needs.

Ask another developer to open one useful record. Their questions reveal what your format still leaves implicit.

Optional detail (not part of the timed route)

The displayed note is illustrative, not a deployed EAS schema or EAS/EFS integration. EAS has separate schema, attester and data fields and supports onchain and offchain attestations. An attester is not a proof of truth. Stable IDs, author identity, references, schema versions and permission rules must retain meaning across implementations. Export offers a migration/recovery path; ongoing shared writes additionally need agreed synchronization, conflict handling and authorization. A database does not have to move onchain for these improvements.

Sources
https://attest.org/
https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/SchemaRegistry.sol
https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/IEAS.sol

## 16. Same data, different apps

### On slide

Same data, different apps

Notes app

Community feed

Same record ID, author and attachment

Meeting at 10

note-17 by 0xA…

agenda.md (rev 2)

note-17 by 0xA…

Meeting at 10

Open agenda.md (rev 2)

### Speaker notes

Planned 7:40-8:30

Here are two possible interfaces to the same record. One puts the note in an editor. Another shows it in a community feed. The author, content and attachment still mean the same thing.

That gives users a useful choice and gives developers room to compete on the experience. Someone can build a better tool without asking people to abandon their work.

For an existing app, begin with a second reader for an export. If clients will share ongoing work, agree on how they read and write the same records.

The check is a real task in another client.

Optional detail (not part of the timed route)

Illustrative mockups, not screenshots of deployed products. note-17 and 0xA… are visibly abbreviated example identifiers. A copied export supports recovery/migration; two live clients sharing edits need common authority, synchronization and compatible versions. Neither path requires EAS or EFS. Private clients must preserve authorized access and compatible decryption.

## 17. Who keeps a usable copy?

### On slide

Who keeps a usable copy?

Files and databases

Files + attachments
Database export

Storage operator A

Storage operator B

User backup

Check: restore useful work through an alternative

Onchain records

Contract state

Replicated by validator nodes

### Speaker notes

Planned 8:30-9:25

Where will a usable copy come from when the original provider disappears?

For files and databases, arrange independently retained copies. That might mean storage operators, an independent database replica, or a user backup. Keep the attachments and format information needed to restore useful work.

For onchain records, chain nodes already replicate the state. Your app needs a route to those nodes and any history it uses to rebuild views.

Give retention a budget and someone responsible for it. Then restore through an alternative and open the result. That tells you much more than an export button.

Optional detail (not part of the timed route)

The diagram shows two storage arrangements, not a prescription to move every database to Ethereum. Offchain copies are illustrative and must be refreshed under a defined policy. A chain state commitment is not an archive of every historical state or offchain file. Rebuilding indexes may require retained event history and suitable node access. IPFS persistence requires providers to retain content. Backups alone do not preserve a live multiwriter service; independent deployment/sync and authorization may also be needed.

Sources
https://docs.ipfs.tech/concepts/persistence/
https://ethereum.org/developers/docs/nodes-and-clients/
https://www.inkandswitch.com/essay/local-first/

## 18. EFS: find a file and check a copy

### On slide

EFS: find a file and check a copy

Example path: /notes/meeting.md

Onchain file record
File details + fingerprint
Retrieval references

Contract reads
file details

Client retrieves a copy
and checks its fingerprint

IPFS copy

Arweave copy

Same accepted file. A different provider or app can use it.

### Speaker notes

Planned 9:25-10:30

This is one job I built Ethereum File System to help with. A readable path leads to an onchain record describing a file. It includes metadata, which is information about the file, and a content fingerprint for checking its bytes.

A contract can read that public metadata. A client can retrieve a copy from IPFS or Arweave and compare its fingerprint with the expected value.

Another provider can serve the same file, and another app can understand the reference.

For your app, ask what identifies the accepted version and how someone can obtain and check a replacement copy.

Optional detail (not part of the timed route)

The /notes/meeting.md path is illustrative. The EFS Sepolia proof package supplies historical evidence for retrieving and checking the same artifact through IPFS and Arweave, not a fresh run in this revision. A digest is a cryptographic hash, called a content fingerprint in the spoken explanation. It checks byte integrity relative to an accepted reference, not semantic truth, freshness or retention. Onchain contracts read metadata; clients fetch offchain bytes. Include chain, deployment and exact revision in a stable reference. No public EFS version or new deployment promise.

Sources
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof
https://efs.eth.limo/

## 19. Reading and finding shared data

### On slide

Reading and finding shared data

Read chain state

Ethereum
Chain state

RPC / own node
Light client: Helios

App reads
state

Find records in lists and searches

Check: change providers, rebuild a view and check its freshness

Published
records + history

Independent indexers
Example: The Graph

App lists
and searches

### Speaker notes

Planned 10:30-11:40

There are two jobs here. An RPC is the app's connection to a node. It lets the app read chain state. Make that connection replaceable, including a route to your own node. For supported reads, a light client such as Helios can check responses against Ethereum.

An index organizes records into the lists and searches people use. The Graph is an Ethereum example with independent indexers. Publish the recipe and preserve the inputs so another operator can rebuild your important views.

Show how far the view has synced. Then change providers and rebuild one list. Can the user still find the records they need?

Optional detail (not part of the timed route)

The Graph network is live; this is a mechanism example, not a blanket reliability assessment of every subgraph. Its normal gateway/API-key/billing path has its own dependencies. A replacement needs the subgraph definition, linked files, schema, chain history, RPC and database. Helios verifies supported Ethereum consensus/execution responses with checkpoint and RPC assumptions; it does not automatically verify arbitrary index queries or retain offchain files. Multiple RPCs offer alternatives, not verification by majority vote. For completeness checks, compare an expected set of known records as well as the indexed block height. No EFS light-client integration is claimed.

Sources
https://thegraph.com/docs/en/indexing/overview/
https://thegraph.com/docs/en/gateways/subgraphs/components/overview/
https://thegraph.com/docs/en/subgraphs/providers/subgraph-studio/managing-api-keys/
https://github.com/a16z/helios

## 20. Who sends the next transaction?

### On slide

Who sends the next transaction?

Tornado Cash: replaceable relayers

Relayer A
Offline

Relayer B
Submits proof

Pool contract
Checks the proof

User authorizes
a withdrawal

Check: could another operator complete your background job?

### Speaker notes

Planned 11:40-12:35

A contract still needs someone to submit a transaction. Many apps also need background services to supply inputs or do work.

Tornado Cash Classic gives one focused example. A relayer submits a user's withdrawal proof and pays the transaction's gas. The pool contract checks the proof. The user can choose another relayer and generate a proof for that choice.

Ask the same question about your workers. Could another operator get the code and inputs, pay the costs and complete the job? Could the user take over?

Try a replacement in a test environment before the original service disappears.

Optional detail (not part of the timed route)

Technical mechanism only, not instructions to use the service or a current legal/availability claim. Classic pool withdrawal checks the proof, known root and unspent nullifier rather than a privileged caller allowlist. The proof binds recipient, relayer payment address, fee and refund; a replacement paid relayer may require a new proof. UI registry/listing rules are distinct from pool-level permissionless submission. Pool contracts, relayer registry and upgradeable governance are separate components. Oracles, provers, bundlers and paymasters have different inputs, economics and authorities; test the actual job instead of assuming every worker is interchangeable.

Sources
https://github.com/tornadocash/tornado-core/blob/master/contracts/Tornado.sol
https://github.com/tornadocash/tornado-core/blob/master/contracts/ETHTornado.sol
https://github.com/tornadocash/docs/blob/en/general/how-to-become-a-relayer.md

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

Uniswap v2 core: fixed code, shared exchange logic

### Speaker notes

Planned 12:50-14:15

I want to encourage immutable core contracts. When the logic at an address stays fixed, other developers can depend on it without asking what the original team will change next year.

Uniswap v2 core is a useful example. Other applications can call its fixed exchange logic. Zerion, for example, integrates Uniswap swaps through its API. That shows how a shared capability can become part of another app.

Developers can release new contract versions and let users choose to migrate. Keep the old version usable for people who stay.

For most app software, I want that choice to belong to the user. Shared networks coordinate protocol changes, which is a different kind of decision.

Find a small core you can test carefully and keep stable. That can become someone else's foundation.

Optional detail (not part of the timed route)

Fixed core code does not freeze external inputs, fees or all dependencies. v2 Factory has bounded feeTo/feeToSetter powers and no arbitrary core upgrade. Official docs describe v2/v3/v4 core as non-upgradeable; v4 hooks can introduce separate custom and upgradeable behavior. Use v2 as the simple slide example. A canonical v2 USDC/WETH Swap receipt was independently checked October 26, 2026: transaction 0xd5cc225a285adc402669af3930dca1e486e5508feb1289be447a3d1660aaa4f7, block 26280293, status 1. This establishes activity, not general safety. Zerion cites liquidity and execution benefits, not immutability as its selection motive; its API integration adds an offchain dependency. Immutability removes in-place repair, so scope/audit carefully and plan voluntary migration. No new EFS immutability verification.

Sources
https://developers.uniswap.org/docs/get-started/concepts/how-uniswap-works
https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Factory.sol
https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol
https://developers.uniswap.org/docs/protocols/v4/security
https://zerion.io/blog/zerion-wallet-now-offers-swaps-powered-by-uniswap-api/
https://etherscan.io/tx/0xd5cc225a285adc402669af3930dca1e486e5508feb1289be447a3d1660aaa4f7

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

Planned 14:15-15:15

Your app inherits the chain beneath it. Ethereum nodes and validators maintain shared state and agree on transactions. Preserve a usable connection and the history your app needs.

On an L2, find out who orders transactions, where the data is available and how results settle on L1. These choices affect what your users can do during an outage.

OP Stack documentation, for example, describes submitting through L1 when the sequencer is unavailable.

Turn your network's recovery documentation into an exercise for your app's actual account and task. How long does it take, what does it cost, and can the user finish?

Optional detail (not part of the timed route)

An unavailable sequencer, a faulty prover, missing data and a hostile upgrade are distinct failure modes. OP Stack forced inclusion through OptimismPortal is not a universal exit guarantee or a cure for hostile upgrades. Withdrawal rules, bridges, security councils, upgrade controls and deployment configuration need separate inspection. Inherited token, oracle, bridge and other protocol dependencies can change an otherwise fixed application. Nodes need peer connectivity and required history. This is an app design check, not a performed recovery test.

Sources
https://ethereum.org/developers/docs/nodes-and-clients/
https://docs.optimism.io/op-stack/protocol/outages

## 25. A community can carry it forward

### On slide

A community can carry it forward

Public handoff
Release + contract addresses
Retained data + index recipe
Worker code + running costs

Volunteer A opens the app

Volunteer B rebuilds the list

Volunteer C runs a worker

Illustrative handoff: let people outside your team follow the instructions

### Speaker notes

Planned 15:15-15:55

People can carry the work forward when they have the materials and the instructions.

Publish the release, contract addresses, retained inputs and recipes for rebuilding services. Explain replacement endpoints and running costs.

Then give the handoff to people outside your team. Can they open the app, rebuild a view or run a worker?

Aim for several genuinely independent participants at important layers. Their questions will show you where your app still depends on knowledge or permission only your team has.

Optional detail (not part of the timed route)

Illustrative handoff, not a completed operator exercise. Three participants is James's resilience ambition, not a universal safety threshold. Shared cloud accounts, credentials, funders and undocumented privileges can defeat apparent redundancy. Include licenses, documentation, funding and compatible standards so a willing operator can act.

## 26. A walk-away test for your app

### On slide

A walk-away test for your app

Putting this into practice

### Speaker notes

Planned 15:55-16:00

Here is the checklist to take back to your own app.

## 27. Your walk-away checklist

### On slide

Your walk-away checklist

A user can:
Run a saved app release
Recover access and keys
Restore usable data
Choose another client

Another operator can:
Switch RPCs; rebuild views
Run workers; keep copies
Inspect admin powers
Use network recovery

Try it without your team. Improve one dependency.

### Speaker notes

Planned 16:00-16:45

Here is the checklist to take back to your app. Choose one task whose loss would hurt a user.

Can they run the software, recover access, restore useful data and use another client? Can someone else run the supporting services and explain the contract and network recovery paths?

Try the task without your team's services or personal help. Separately, inspect what a hostile holder of your remaining powers could do.

Use test accounts and copies. Fix the first dependency that stops the task, then try again.

Optional detail (not part of the timed route)

A practical exercise, not certification or a maintained scoring tool. Keep an explicit inventory of upgrade, pause, routing, account and data-writing powers. Record time, cost, privacy, required inputs and remaining assumptions. The next slide shows an illustrative index failure, not an observed EFS outage.

## 28. A walk-away test in practice

### On slide

A walk-away test in practice

Find an existing note and open its attachment

1. Before

Meeting at 10
agenda.md

2. Index offline

Cannot load list
Index unavailable

3. After repair

Meeting at 10
agenda.md

Repair: publish the index recipe and allow endpoint switching

Rebuild from retained records. Retry and open the attachment.

Illustrative test, not a recorded outage

### Speaker notes

Planned 16:45-17:45

Here is one small example. The task is to find and open an existing note. Normally, the list shows the meeting note and its attachment.

In a test environment, we stop the team's index. The list cannot load. The records still exist, but the app has no replacement route.

The improvement is to publish the indexing recipe and let the app select another endpoint. An independent operator rebuilds the view from retained records.

On the next attempt, the same note appears and its attachment opens. We check both, along with how current the view is.

One failed task has told us what to improve.

Optional detail (not part of the timed route)

Illustrative before/failure/retest, not a live demo or measured outage. The first attempt exposes a missing replacement path. Publishing the recipe and endpoint selection is the improvement before the second attempt. Retained records/history and attachments are explicit prerequisites; they are not reconstructed from a blank response. An actual failure must appear as unavailable rather than a misleading empty list. A real drill records observed results and never disables production services. This checks one dependency, not the whole stack.

## 29. Our work can outlive us

### On slide

Our work can outlive us

### Speaker notes

Planned 17:45-18:30

I want a future where people can trust software with the important parts of their lives. Where their work remains theirs, better tools can use it, and developers keep adding to foundations everyone can build on.

That is what draws me to Ethereum and what I am trying to contribute with EFS.

Start with one important task. Make it easier for someone else to keep it working. Every dependable piece gives the next person more to build with.

Our work can outlive us.

## 30. Thank you!

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
