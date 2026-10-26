# Concrete-examples revision

Captured October 26, 2026. Native rehearsal copy, 30 slides.

Native presentation title: Who Can Turn Off Your Ethereum App? | Devcon rehearsal draft

Main planned duration: 18:40. Main narrative word count: 2094. Both values come from the current design plan; this is not a measured rehearsal or an organizer submission.

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

## 5. Hyperstructures: build on each other

### On slide

Hyperstructures: build on each other

Community social app
Team F

Garden DAO app
Team D

Moderation
Team E

Membership
Team A

Voting
Team B

Treasury
Team C

Illustrative architecture: each team adds a dependable capability

### Speaker notes

Planned 1:40-2:45

Hyperstructures give a name to an ambition: public protocols that people can keep using and building on without their creators.

Here is an illustrative community, Garden DAO. Maya is a member. Three teams build membership, voting and treasury components. A fourth team combines them into a DAO app. A fifth builds a moderation module. Now another team can build a social app using the DAO and that moderation module.

They do not have to rebuild membership, voting or payments. Each dependable component gives the next team somewhere to start.

That is the future I want: useful work accumulating into larger systems people can trust. CROPS brings our values to that work: censorship resistance, open source, privacy and security.

Optional detail (not part of the timed route)

Illustrative architecture, not a deployed DAO or a claim that every module meets the full economic definition of a hyperstructure. Arrows point from a reusable component to its consumer. Membership determines eligibility, voting records decisions and treasury executes approved actions. Moderation selects what this social interface displays; it does not rewrite membership or treasury rules or erase every copy. Stable interfaces, retained inputs and independently operable services make composition dependable. Jacob Horne's definition includes additional economic properties.

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

Gateways: efs.eth.limo / efs.eth.link • or your own IPFS node

Real lookup values, Oct 26. Shortened CID. Copies are illustrative.

### Speaker notes

Planned 3:50-5:05

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

Maya opens the app

A developer rebuilds it

Check both paths on a fresh machine

### Speaker notes

Planned 5:05-5:55

A release is the actual application someone can open. For a web app, that means the HTML, JavaScript, styles, images and configuration, including code it loads later.

If Garden DAO keeps only its homepage, that page might still ask a vanished server for the script it needs. Keep the complete runnable bundle instead.

Beside it, publish the source, locked dependencies and build instructions. The saved bundle lets Maya use the app today. The source and recipe let another developer maintain it tomorrow.

Check both paths on a fresh machine: open the release, then rebuild it.

Optional detail (not part of the timed route)

The release folder is illustrative, not an actual Garden DAO artifact. Running a saved release and reproducing a build are separate accomplishments. Inspect runtime requests, dynamic imports, deep links, configuration and wallet connector dependencies. The Ledger Connect Kit incident can be mentioned if useful as a historical distribution compromise.

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
Same membership

Practice lost-device recovery. Back up private-file keys too.

### Speaker notes

Planned 5:55-6:45

Maya loses her phone. If that device held her only signing key, she might lose her ability to participate.

Here is a Safe-style two-of-three recovery arrangement. The lost phone is one signer. Two remaining signers authorize replacing it. The key changes, while the same account keeps its membership and voting history.

Private documents need their own recovery plan for decryption keys. Include that in the lost-device exercise.

Use a test account and ask someone to follow the recovery instructions without your team. Their work should remain usable even when their device changes.

Optional detail (not part of the timed route)

Safe is a real Ethereum smart-account example; Maya and this signer arrangement are illustrative. Actual owners, threshold, modules and guards must permit the recovery. Signers should be separately controlled according to the user's threat model. Account recovery does not reconstruct file-decryption keys. Do not expose keys or conduct recovery against production accounts for this exercise.

Sources
https://docs.safe.global/advanced/smart-account-overview
https://docs.safe.global/advanced/cli-overview

## 13. Continuing the work

### On slide

Continuing the work

Portable Data

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

## 15. A record both apps understand

### On slide

A record both apps understand

Garden DAO • Proposal 42: Fund the garden

EAS statement

proposalId: 42
title: Fund the garden
documentRef: EFS revision
voteRef: chain + contract + #42

EFS document

/garden/proposals/42.md
Format: Markdown
Metadata + file references

Illustrative records: publish the fields, meanings and reference format

### Speaker notes

Planned 7:00-7:50

Now give another app a record it can understand. Garden DAO has proposal 42, Fund the garden.

EAS, the Ethereum Attestation Service, can provide a structured statement with a proposal identifier, title, document reference and voting reference. Ethereum File System supplies the named document and its file metadata.

These are example records, showing how the two could fit together. The document reference selects the particular revision. The voting reference identifies the chain, contract and proposal.

Publish the field meanings and reference format. Another developer can then write a different reader without guessing how the user's work fits together.

Optional detail (not part of the timed route)

Illustrative design, not a deployed EAS/EFS integration. Proposed EAS schema: uint256 proposalId, string title, string documentRef, string voteRef. voteRef uses an agreed encoding of chain ID, voting-contract address and proposal ID. An EAS attestation UID identifies a statement and its attester is a separate field. documentRef must identify the selected EFS revision, including chain and deployment; the displayed path is the human-readable name, not the entire stable reference. EAS refUID is for another EAS attestation, not an arbitrary EFS reference. Apps agree on field meaning, permitted authors and reference conventions.

Sources
https://docs.attest.org/docs/tutorials/create-a-schema
https://docs.attest.org/docs/tutorials/referenced-attestations
https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/IEAS.sol
https://efs.eth.limo/

## 16. Two apps, the same proposal

### On slide

Two apps, the same proposal

DAO portal
Proposal 42 voting page

Community social app
Proposal 42 in the feed

Same EAS statement + EFS document
Same voting contract

Illustrative design: change the interface and keep participating

### Speaker notes

Planned 7:50-8:40

The DAO portal shows proposal 42 as a voting page. A community social app shows the same proposal in its feed. Both read the same statement and document reference and can reach the same voting contract.

Maya can choose a different interface and still participate in the same DAO. The social app's team can improve the experience without making everyone recreate their proposals and documents.

That is what portable data is for. Give a second client one useful task: find this proposal, open its plan and let the user vote. Shared records become valuable when another tool can actually use them.

Optional detail (not part of the timed route)

Illustrative applications using a proposed shared-record convention. This is not an observed client migration or a claim of existing EAS/EFS integration. A second reader must preserve proposal identity, author and authorization semantics, the exact document revision and the voting-contract reference. Different clients can offer different features and moderation policies while using the same underlying records.

Sources
https://attest.org/
https://efs.eth.limo/

## 17. Data people can keep using

### On slide

Data people can keep using

Proposal survives. Its only attachment copy disappears.

Proposal 42
Plan + attachments

Operator A: retained copy

Operator B: retained copy

Maya: personal backup

Restore the plan from another copy and open it in a compatible reader

### Speaker notes

Planned 8:40-9:30

The proposal record can survive while its attachment disappears. That would leave Maya able to see a vote but unable to read what she is voting on.

Arrange retained copies of the plan with independent operators, and let Maya keep a backup. Preserve the document's format and any attachments or relationships needed to understand it.

Then disconnect the original provider and restore the plan from another copy. Open it in a compatible reader. That is a much stronger check than knowing an export button exists.

Give retention a budget and a named operator, so the copies are still there when someone needs them.

Optional detail (not part of the timed route)

Illustrative copies, not a measured EFS retention deployment. Multiple gateways may serve the same retained source. Keep bytes, schemas, relevant history and private-data decryption material. The underlying lesson is a restore check, not an assurance of perpetual storage.

Sources
https://docs.ipfs.tech/concepts/persistence/
https://www.inkandswitch.com/essay/local-first/

## 18. EFS: find a file and check a copy

### On slide

EFS: find a file and check a copy

Example path: /garden/proposals/42.md

Onchain file record
Metadata + digest
Retrieval references

Contract reads
file metadata

Client retrieves bytes
and checks the digest

IPFS copy

Arweave copy

Illustrative path: a shared reference connects apps to matching data

### Speaker notes

Planned 9:30-10:35

Here is the job EFS contributes. A readable path leads to an onchain file record. That record describes the file and gives us the reference needed to check it.

A contract can read the onchain metadata. A client can use the retrieval references to get the document from IPFS or Arweave, then check its bytes against the expected digest.

The storage provider can change while the accepted document stays the same. Another app can find the reference, retrieve a copy and check what it received.

For your own app, make that handoff explicit: what names the document, what identifies the right version, and where can another person obtain a matching copy?

Optional detail (not part of the timed route)

Garden DAO's path and composition are illustrative. EFS's Sepolia proof package is historical evidence for checking a file retrieved from IPFS and Arweave, not a fresh test in this turn. Onchain metadata reads and offchain byte retrieval are different paths: contracts do not directly fetch IPFS or Arweave in this diagram. Pin the exact file revision with chain/deployment context when a proposal must refer to fixed content. A digest checks byte integrity relative to the accepted reference, not truth, currentness or retention. No public EFS version or new deployment is promised.

Sources
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof
https://efs.eth.limo/

## 19. A dependable view of the data

### On slide

A dependable view of the data

The records exist. Can Maya find proposal 42?

Ethereum
Public events
+ contract state

Independent index
Published recipe
Rebuild the list

Proposal #42
Fund the garden
Synced: 12345

Choose another RPC, node or replacement index

Illustrative view: rebuild discovery and show how current it is

### Speaker notes

Planned 10:35-11:35

The chain may still hold the proposal even when the app's list is empty. The missing piece can be the index: the service that turns public records into a useful search or list.

Here, another operator reads public proposal events and follows the published indexing recipe. Maya selects that replacement index in the app. Proposal 42 appears again, along with how far the view has synced.

Keep the chain connection configurable, so the operator can use another RPC or their own node. For supported reads, light clients offer a path to checking responses.

The useful test is to rebuild one important view. Can Maya find the proposal, see its current vote state and continue?

Optional detail (not part of the timed route)

The displayed block 12345 is illustrative, not a live chain height. RPC means the app's connection to a node. An index organizes records for discovery; direct contract reads supply current state. Helios support varies by network/method, and it does not verify arbitrary index queries or retain files. Graph Node is an Ethereum ecosystem example of a rebuildable indexer; an operator needs manifests, linked files, suitable history, RPC and a database. Publish schema, start block and indexing rules as applicable.

Sources
https://github.com/a16z/helios
https://thegraph.com/docs/en/indexing/tooling/graph-node/

## 20. Who sends the next transaction?

### On slide

Who sends the next transaction?

A proposal passes. Someone still has to execute it.

Team bot
Offline

Volunteer
runs executor

Treasury contract
Checks the rules

Approved
payment

Same rules. Another operator.

Illustrative drill: stop your bot and have another operator finish the job

### Speaker notes

Planned 11:35-12:25

Proposal 42 passes. Its rules allow a payment for the garden. But a contract does not wake up on its own. Someone still has to send the execution transaction.

The original team's bot is offline. A volunteer runs the published executor and submits the same approved action. The treasury contract checks the proposal and its conditions before paying the specified recipient.

That is a replaceable background job. Publish the code, inputs and operating instructions. Make it possible for another operator to do the work, and explain how the transaction costs are covered.

Then stop your bot in a test environment and try the replacement.

Optional detail (not part of the timed route)

Illustrative permissionless proposal-execution design. The operator triggers the pre-authorized action and cannot choose a different recipient or amount. Avoid duplicate payments with the contract's execution-state checks. PoolTogether V5's permissionless prize claimers are a real example of incentives for submitting useful transactions; do not imply Garden DAO is deployed. Other jobs, such as oracles or provers, may require different inputs and authority.

Sources
https://dev.pooltogether.com/protocol/design/prize-claimer/

## 21. Keeping dependable rules

### On slide

Keeping dependable rules

Rules

### Speaker notes

Planned 12:25-12:30

Finally, let's give people rules they can build on.

## 22. Who chooses the changes?

### On slide

Who chooses the changes?

Stable core contracts
User-chosen app upgrades
Clear rules for shared governance

### Speaker notes

Planned 12:30-12:40

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

Planned 12:40-14:05

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

Planned 14:05-15:25

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

Public handoff
Release + contract addresses
Retained files + index recipe
Executor + running costs

Volunteer A opens the app

Volunteer B rebuilds the list

Volunteer C runs the executor

Illustrative handoff: let people outside your team follow the instructions

### Speaker notes

Planned 15:25-16:10

A community can carry the work forward when the next person has the materials and the instructions.

For Garden DAO, the handoff includes the release, contract addresses, retained documents, index recipe and executor instructions. It explains how to select replacement endpoints, what running those services costs and how the community can fund them.

Now volunteers can open the app, rebuild its view and run the executor. Aim for several independent participants at the important layers.

Give this handoff to someone outside your team. Their questions will show you what to improve before people need it in an emergency.

Optional detail (not part of the timed route)

Garden DAO and volunteers are illustrative. Three independent participants is James's resilience ambition, not a universal safety threshold. Separate operators, credentials, infrastructure and funding where the threat model warrants it. No live handoff has been performed. The operator should need public instructions rather than the departed team's private permissions or undocumented knowledge.

## 26. A walk-away test for your app

### On slide

A walk-away test for your app

Putting this into practice

### Speaker notes

Planned 16:10-16:15

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

Planned 16:15-17:00

Here is the checklist. Start with one task whose loss would hurt a user.

Can they open a saved app, recover access, restore their data and use a compatible client? Can another operator rebuild the views, run the jobs and understand the contract and network recovery paths?

Try the task without your team's services or personal help. Then ask what a hostile holder of your remaining powers could change.

Use test accounts and copies. Record where someone gets stuck and choose one improvement.

Optional detail (not part of the timed route)

This is a practical checklist, not a certification system. Record observed results, time, cost and remaining assumptions. The next slide is a fictional tabletop illustration, not an executed EFS test.

## 28. Garden DAO's practice run

### On slide

Garden DAO's practice run

Find proposal 42, read its plan and cast a test vote

1. Open

Saved release opens

2. Find

List missing: private index

3. Repair

Rebuild + select
replacement index

Continue: plan matches its digest → test vote gets a receipt

Next improvement: ship the index recipe and switching instructions

Illustrative drill with the original team services switched off

### Speaker notes

Planned 17:00-17:55

Let's use it. Maya's task is to find proposal 42, read the plan and cast a test vote. In this illustrative drill, the original team's services are switched off.

The saved release opens, but the proposal list is empty. We have found the dependency: a private index.

A volunteer rebuilds the list from public events using the published recipe. Maya selects the replacement index, and proposal 42 appears. The plan loads from another retained copy and matches its expected digest. Maya casts a test vote and sees its chain receipt.

The concrete improvement is to include that index recipe in every release handoff. One user task has shown us exactly what to fix.

Optional detail (not part of the timed route)

Illustrative tabletop result, not an observed deployment test or assurance that the complete stack passes. The task starts with discovery; a supplied direct path would bypass the failed list. Assume published event history, the recipe, suitable chain access, the compatible client, retained bytes and a test account. A real drill records actual failures and must not switch off production services. Hostile-control testing is separate from this absence drill.

## 29. Our work can outlive us

### On slide

Our work can outlive us

### Speaker notes

Planned 17:55-18:40

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
