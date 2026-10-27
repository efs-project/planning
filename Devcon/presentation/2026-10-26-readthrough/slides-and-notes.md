# Read-through revision

Captured October 26, 2026. Native rehearsal copy, 30 slides.

Native presentation title: Who Can Turn Off Your Ethereum App? | Devcon rehearsal draft

Main planned duration: 18:30. Main narrative word count: 2097. Both values come from the current design plan; this is not a measured rehearsal or an organizer submission.

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

Choose one task your users rely on.

Single points of failure and control

### Speaker notes

Planned 2:35-3:10

Think of one task your users depend on your app to do. Keep it in mind as we go through the layers.

The walk-away test exposes single points of failure and control. If your team disappears, can users keep working and can someone else run what they need? If someone hostile gets your team's powers, what could they change and what could users refuse?

At each layer, look for something that only one team can operate or control. Independent operators can keep services running. Credibly neutral contracts can enforce shared rules.

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

First, can someone still get into your app and do that task?

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

Name redirected? Open a saved, trusted release.

### Speaker notes

Planned 3:45-4:55

Here are real names and lookup values. Ethereum dot org resolves to addresses for a hosted website. EFS dot eth points to an IPFS identifier for a particular release.

Different people can retain that release and serve the same files. Users can reach it through a gateway or their own IPFS node.

Now imagine someone takes control of the name and points it at a malicious release. A user with the previously trusted identifier can bypass that changed name and open a retained copy of the release they chose.

Keep that identifier, independent copies and clear opening instructions. Test an ordinary task without the usual website. Later, we'll ask whether its underlying contracts still keep the rules the user accepted.

Optional detail (not part of the timed route)

Lookup snapshot: 2026-10-26. ethereum.org returned A records 104.18.176.152 and 104.19.239.224 through both 1.1.1.1 and 8.8.8.8. These are Cloudflare network endpoints, not proof of one physical server; the slide groups the hosted service, not its internal machines. ENS mainnet at block 26279986 (hash 0xd812e26824d24b4ef54112803d47e0fdb7b6c5ffabe1631d624ab2cb1c349b0e, 22:54:35Z) resolved efs.eth through resolver 0xF29100983E058B709F3D539b0c765937B804AC15 to ipfs://bafybeicrisk74xwozdpx4v5kaqjmimzjqsrp74r5tsrgdyv5kju3dnp5ku. The shortened CID on the slide is explicitly an abbreviation. Three retained copies are an illustrative deployment pattern, not a measured EFS operator count. .link and .limo share the eth.limo operator; do not count them as independent retention. ENS controller, resolver and renewal powers and browser verification remain relevant.

The compromised-name scenario is illustrative, not a reported EFS incident. A retained trusted CID and a working retrieval route bypass a changed name. This protects selection of the UI release, not mutable contract powers, external dependencies or a compromised device. Newly arriving users still need a trustworthy way to find the accepted release.

Sources
https://docs.ens.domains/dweb/intro/
https://docs.ens.domains/ensip/7/
https://docs.ipfs.tech/concepts/content-addressing/
https://docs.ipfs.tech/concepts/persistence/
https://discuss.ens.domains/t/eth-limo-update/19707
https://developers.cloudflare.com/dns/proxy-status/

## 11. A complete runnable release

### On slide

A complete runnable release

Keep every file the client needs to start

index.html on IPFS

IPFS release
index.html
app.js + styles + assets

Team server: app.js
Offline

Client starts

Check: block the team's host, then reload the client

Incomplete release

Complete release

Client cannot start

### Speaker notes

Planned 4:55-5:40

A saved page is only useful if people can run the client behind it.

On the left, the HTML lives on IPFS, but it still loads JavaScript from the team's server. When that server disappears, the client cannot start.

On the right, the release contains its code, styles, assets and configuration. Someone can retain and serve that complete release.

Try blocking your team's host in a test environment, clear the browser cache and reload. Does the client start? We will check its data and network dependencies separately.

Keep the source, locked dependencies and build instructions too, so another developer can maintain it.

Optional detail (not part of the timed route)

Running a saved release and reproducing a build are separate checks. Inspect dynamic imports, remote configuration, wallet connectors and deep links. The Ledger Connect Kit compromise is an optional historical example of distribution becoming an attack path.

This slide tests the client release, not all external services. Bundle or independently retain essential scripts, lazy-loaded code, assets and configuration. Runtime RPCs, indexes and authorization paths are assessed in their own layers. Build source and dependency inputs must remain obtainable; a lockfile alone is insufficient. Diagram is illustrative.

Sources
https://docs.ipfs.tech/how-to/websites-on-ipfs/single-page-website/
https://www.ledger.com/blog/security-incident-report

## 12. Access without the company

### On slide

Access without the company

The login service closes. Can users still get in?

App

Company login
Offline

Locked out

Independent
client

User's keys

Check access and recovery with the company offline

Same account
on Ethereum

A route the user can control

### Speaker notes

Planned 5:40-6:25

Imagine the app and its records survive, but the company's login service closes. Users can reach the page and still be locked out.

Give them a route they can control. In this Ethereum example, their keys authorize actions through an independent client under the same account rules. The company does not have to approve each return.

Recovery needs the same independence. If users lose a device, can their chosen recovery arrangement work without your team? Keep a separate recovery path for private-file encryption keys.

Test access and recovery with the company's services unavailable. We will examine the team's own administrative keys in the Rules chapter.

Optional detail (not part of the timed route)

The diagram contrasts company-mediated login with independently usable account authority. A wallet signature alone does not make a company API replaceable. The alternative requires compatible software, independently reachable services, and permission rules that recognize the same account. Safe is an optional recovery example: a configured two-of-three account can replace one lost signer using the remaining authorized signers, provided those signers and the execution path do not depend on the company. Account recovery does not reconstruct file-decryption keys. Standard encryption needs compatible formats and user-controlled key recovery. Keep sensitive data private and preserve authorization across clients. Team admin-key loss/compromise belongs in Rules and the explicit powers checklist.

Sources
https://docs.safe.global/advanced/smart-account-overview
https://docs.safe.global/advanced/cli-overview

## 13. Continuing the work

### On slide

Continuing the work

Data

### Speaker notes

Planned 6:25-6:30

Next, could they keep using the data that task depends on?

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
file: agenda.md (rev 2)
}

Shared meaning

What each field means
Who can change it
How versions fit together
Who can read and decrypt it

EAS uses schemas. Existing databases can offer documented exports.

### Speaker notes

Planned 6:40-7:40

Another app needs to understand what your data means. This record has an identifier, an author, some text and a particular attachment revision. Publish the field meanings and the rules for reading and changing it.

EAS, the Ethereum Attestation Service, makes this idea explicit through schemas for structured statements and a record of who made them.

Your existing database can benefit too. Export a documented format with stable identifiers, relationships, attachments and the encryption information an authorized reader needs.

Ask another developer to open one useful record. Their questions reveal what your format still leaves implicit.

Optional detail (not part of the timed route)

The displayed note is illustrative, not a deployed EAS schema or EAS/EFS integration. EAS has separate schema, attester and data fields and supports onchain and offchain attestations. An attester is not a proof of truth. Stable IDs, author identity, references, schema versions and permission rules must retain meaning across implementations. Export offers a migration/recovery path; ongoing shared writes additionally need agreed synchronization, conflict handling and authorization. A database does not have to move onchain for these improvements.

Sources
https://attest.org/
https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/SchemaRegistry.sol
https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/IEAS.sol

## 16. Different tools. The same work.

### On slide

Different tools. The same work.

Notes editor

Community feed

Shared record: note-17 + agenda.md (rev 2)

Meeting at 10

Author: 0xDEADBEEF…

agenda.md (rev 2)

0xDEADBEEF… posted a note

Meeting at 10

Open agenda.md (rev 2)

Edit    Format    Attach

Notes

Meeting
Ideas
Archive

Saved as note-17

Reply    Share                 note-17

### Speaker notes

Planned 7:40-8:30

This is what that shared format buys the user. On the left, they work in a note editor. On the right, the same note appears in a community feed. The author, text and attachment are the same, even though the tools organize them differently.

Someone can build a better experience without asking users to abandon their work. They can choose another client when the original app disappears or no longer suits them.

For an existing app, a second reader for a documented export is a useful first step. Sharing ongoing edits also needs common permission and synchronization rules.

The check is simple: open a useful record and its attachment in another client.

Optional detail (not part of the timed route)

Illustrative mockups, not screenshots of deployed products. note-17 and 0xDEADBEEF… are visibly abbreviated example identifiers. A copied export supports recovery/migration; two live clients sharing edits need common authority, synchronization and compatible versions. Neither path requires EAS or EFS. Private clients must preserve authorized access and compatible decryption.

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

Ethereum full nodes

### Speaker notes

Planned 8:30-9:25

Where will a usable copy come from when the original provider disappears?

For files and databases, arrange independently retained copies. That might mean storage operators, an independent database replica, or a user backup. Keep the attachments and format information needed to restore useful work.

For records on Ethereum, full nodes replicate the state. Your app needs a route to those nodes and the history it uses to rebuild views.

Give retention a budget and someone responsible for it. Then restore through an alternative and open the result.

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

Recorded 29 Jul 2026: archive verified via IPFS and Arweave

### Speaker notes

Planned 9:25-10:30

This is one job I built Ethereum File System to help with. A readable path leads to an onchain record with file details, retrieval references and a fingerprint for checking its bytes.

A contract can read the file details. A client can retrieve a copy from IPFS or Arweave and check its fingerprint against the expected value.

The path in this diagram is an example. In the recorded July 29 check, copies of a deployment archive from both networks matched the expected fingerprint.

Another provider can serve the same file, and another app can use its reference. What identifies the accepted version in your app, and how can someone obtain and check a replacement copy?

Optional detail (not part of the timed route)

The /notes/meeting.md path is illustrative. The EFS Sepolia proof package supplies historical evidence for retrieving and checking the same artifact through IPFS and Arweave, not a fresh run in this revision. A digest is a cryptographic hash, called a content fingerprint in the spoken explanation. It checks byte integrity relative to an accepted reference, not semantic truth, freshness or retention. Onchain contracts read metadata; clients fetch offchain bytes. Include chain, deployment and exact revision in a stable reference. No public EFS version or new deployment promise.

Visible historical summary source: EVIDENCE.md at pinned commit e86e6e77fcb5cda31374e07c5f582b502455ba80. It records a July 29, 2026 capture for efs-sepolia-deployment-reference-v0.tar.gz, 63,245 bytes, SHA-256 9c5bbda410deea8714a37b5ab82d3e22982cee79d1d1320cd43a91d562f34d39. Both retrieval rows say VERIFIED. The retained evidence is a dated results table, not raw timestamped verifier stdout. The illustrative note path above is not that archive. This pass inspected the record and did not rerun retrieval or verify present availability.

Sources
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof
https://efs.eth.limo/
https://github.com/efs-project/contracts/blob/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof/EVIDENCE.md

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

Finally, can users keep the rules they accepted for that task?

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
Let other apps
build on it

Room to improve
Deploy a new version
Let users choose to migrate

Immutable contracts

Uniswap v2 core: fixed code, shared exchange logic

UNIX mindset: Do one thing and do it well

### Speaker notes

Planned 12:50-14:15

Remember the saved app release? Keeping that interface is useful. Keeping the contract rules it relies on makes the choice meaningful.

I want to encourage immutable core contracts. When the logic at an address stays fixed, another developer can build on it without asking what the original team will change next year.

Uniswap v2 core is a useful example. Other apps can call its fixed exchange logic. Release new contract versions and let users choose to migrate. Keep the old version usable for people who stay. Most app upgrades can offer that choice. Shared networks coordinate protocol changes differently.

Start with a small core you can test carefully and keep stable. Check what happens if the team loses its keys, and inspect any remaining powers that can change behavior.

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

## 25. Someone else can take over

### On slide

Someone else can take over

Software + license
Data + instructions
Configuration + costs

Independent
operator

Replacement
service

Original team offline

Check: can someone start it without contacting you?

Public handoff

Their own keys
and hosting

Users can
switch to it

### Speaker notes

Planned 15:15-15:55

The code may be public, but someone still needs to be able to run the service.

Imagine your team has stopped. Another operator takes the published software and license, retained inputs, configuration and instructions. They start a replacement with their own keys and hosting. Users can choose it.

The handoff should explain the running costs and how someone can cover them. Remove any requirement for a secret account or permission only your team can provide.

Ask someone outside the team to try it without contacting you. That is how you discover the knowledge and privileges that still live only in your heads.

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
☑ Run a saved app release
☑ Recover access and keys
☑ Restore usable data
☑ Choose another client

Another operator can:
☑ Switch RPCs, rebuild views
☑ Run workers, keep copies
☑ Inspect admin powers
☑ Use network recovery

Try it without your team. Improve one dependency.

Who can upgrade, pause, redirect or change permissions?

### Speaker notes

Planned 16:00-16:45

Return to the task you chose at the start. Can a user run the software, recover access, restore useful data and use another client? Can someone else operate its supporting services?

Try it without your team's services or personal help. Then check hostile control separately. Who can upgrade a contract, pause it, redirect an entry point or change permissions? What could the user keep using if those powers were abused?

Use test accounts and copies. Fix the first dependency that stops the task, then try again.

Optional detail (not part of the timed route)

A practical exercise, not certification or a maintained scoring tool. Keep an explicit inventory of upgrade, pause, routing, account and data-writing powers. Record time, cost, privacy, required inputs and remaining assumptions. The next slide shows an illustrative index failure, not an observed EFS outage.

## 28. A walk-away test in practice

### On slide

A walk-away test in practice

Example: find a note and open its attachment

1. Index stops

2. Rebuild index

3. Switch and retry

Change the app's index endpoint to the replacement

Check: the same note appears and its attachment opens

App: cannot load notes

Team index
Offline

Retained records

New index

Public indexing recipe

Index: community

Meeting at 10

agenda.md

Opened attachment:
Review proposals

### Speaker notes

Planned 16:45-17:45

Imagine this test in your app: find an existing note and open its attachment.

In a test environment, stop the team's index. The app cannot load the note list. The records and attachment are still retained, but this app has only one route to find them.

The improvement is to publish the indexing recipe and let users select another endpoint. An independent operator can rebuild an index from those retained records.

Select that replacement in the app and retry. Success means finding the same note and opening its attachment. Check that the result is current too.

That is the method: expose one dependency, make it replaceable, and repeat the user's task.

Optional detail (not part of the timed route)

Illustrative before/failure/retest, not a live demo or measured outage. The first attempt exposes a missing replacement path. Publishing the recipe and endpoint selection is the improvement before the second attempt. Retained records/history and attachments are explicit prerequisites; they are not reconstructed from a blank response. An actual failure must appear as unavailable rather than a misleading empty list. A real drill records observed results and never disables production services. This checks one dependency, not the whole stack.

UI and index states are illustrative. The agenda preview is invented sample content, not an EFS retrieval. The replacement index must use the published recipe and retained authoritative records/history. The client must support endpoint selection; the diagram does not imply an existing app has that capability without implementation.

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
