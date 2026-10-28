# Before the private data recovery pass

Captured October 27, 2026. Native rehearsal copy, 30 slides.

Native presentation title: Who Can Turn Off Your Ethereum App? | Devcon rehearsal draft

Preserves the native slide text and speaker notes captured before this revision.

## 1. Who Can Turn Off Your Ethereum App?

### On slide

Who Can Turn Off
Your Ethereum App?

James Carnley
Ethereum File System

A Full Stack Walk Away Test

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

I want users to keep their work and builders to rely on each other. We can make choices now that give both a better future.

Communities and network effects take years to build and need to be nurtured.

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

## 6. A walk away test

### On slide

The team disappears
Can users keep working?
Can others run the services?

Control becomes hostile
Can users keep their work?
Can they keep the rules they chose?

A walk away test

Single points of failure and control

TEST

Choose one important user task.
Try it without your team’s services or help.

### Speaker notes

Planned 2:35-3:10

Pick one task your users rely on. Keep it in mind as we go through the stack.

First, imagine your team disappears. Can people keep working, and can others run the services? Then imagine control becomes hostile. Someone takes the admin keys or changes the rules. What can users still keep using?

These are single points of failure and control. The test boxes turn each layer into a small exercise you can try on your own app. Use test accounts and copies, not production outages.

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

TEST

Block the usual website. Can you open
a trusted release through another route?

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

IPFS bundle
index.html
app.js + styles + assets

Team server: app.js
Offline

Client starts

Incomplete release

Complete release

Client cannot start

TEST

Block your team’s server, then reload the client.
Does it start?

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

The client starts. Can the user actually get in?

App

Locked out

User’s wallet

Same account
and permissions

An account another service can recognize

TEST

Disable company login. Can the user complete
the same action through another client?

### Speaker notes

Planned 5:40-6:25

The previous test showed that the client starts. Now can the user actually work?

The company’s login service can disappear even while the app and data survive. A user-controlled account gives another compatible service an identity it can recognize. Sign-In with Ethereum, or SIWE, standardizes proving control of an Ethereum account.

Whether you use SIWE or OAuth, try the complete authorized task through an independent route with the company offline. Recovery should work too, including recovery of the keys needed to decrypt private files.

We will examine the team’s administrative keys in the Rules chapter.

Optional detail (not part of the timed route)

The diagram contrasts company-mediated login with independently usable account authority. A wallet signature alone does not make a company API replaceable. The alternative requires compatible software, independently reachable services, and permission rules that recognize the same account. Safe is an optional recovery example: a configured two-of-three account can replace one lost signer using the remaining authorized signers, provided those signers and the execution path do not depend on the company. Account recovery does not reconstruct file-decryption keys. Standard encryption needs compatible formats and user-controlled key recovery. Keep sensitive data private and preserve authorization across clients. Team admin-key loss/compromise belongs in Rules and the explicit powers checklist.

SIWE authenticates an Ethereum account to an offchain service. It does not make that service independent or replaceable. OAuth/OIDC is not inherently incompatible with portability. The illustrated alternative must preserve authorization through a compatible, independently usable service or contract path.
Sources
https://docs.safe.global/advanced/smart-account-overview
https://docs.safe.global/advanced/cli-overview
https://eips.ethereum.org/EIPS/eip-4361

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
  body: Review proposals.
  file: agenda.md
  vers: 2
}

Shared meaning

What each field means

Who can change it

How versions fit together

Who can read and decrypt it

Shared schemas with EAS         Documented exports from your database.

TEST

Hand over an export and its format.
Can another developer read it without asking you?

### Speaker notes

Planned 6:40-7:40

Another app needs to understand what your data means. This example has a stable identifier, an author, some text and an attachment. Publish the field meanings and the rules for reading and changing the record.

EAS, the Ethereum Attestation Service, makes this explicit through schemas for structured statements and a record of who made them.

Your existing database can benefit too. Export a documented format with identifiers, relationships, attachments and the encryption information an authorized reader needs.

Give another developer an export and its format documentation. Can they read it without asking you what you meant?

Optional detail (not part of the timed route)

The displayed note is illustrative, not a deployed EAS schema or EAS/EFS integration. EAS has separate schema, attester and data fields and supports onchain and offchain attestations. An attester is not a proof of truth. Stable IDs, author identity, references, schema versions and permission rules must retain meaning across implementations. Export offers a migration/recovery path; ongoing shared writes additionally need agreed synchronization, conflict handling and authorization. A database does not have to move onchain for these improvements.

Sources
https://attest.org/
https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/SchemaRegistry.sol
https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/IEAS.sol

## 16. Different tools. The same work.

### On slide

Different tools. The same work.

Same record: note-17 and agenda.md (revision 2)

MY NOTES

Meeting

Ideas
Projects
Archive

Edit     Format     Attach

Meeting at 10

0xDEADBEEF…

Review proposals.

agenda.md     revision 2

Saved as note-17

Following      Community

0xDEADBEEF…

Shared note   /   note-17

Meeting at 10

Review proposals.

Open agenda.md   (rev 2)

Reply       Share       Save

TEST

Open the same record in another app.
Can the user continue their work?

Notes

Community

### Speaker notes

Planned 7:40-8:30

Here is the same work in two different tools. On the left, a person edits a note. On the right, their community reads it in a feed. The author, note and attachment retain their meaning.

These are illustrative interfaces, not a requirement to use these particular apps. Your users should be able to choose another tool without losing their work.

The check goes beyond whether a file imports. Can the user open the attachment and continue the task? Shared formats make that possible. Agreed permissions and synchronization matter when both apps also write to the same records.

Optional detail (not part of the timed route)

Illustrative mockups, not screenshots of deployed products. note-17 and 0xDEADBEEF… are visibly abbreviated example identifiers. A copied export supports recovery/migration; two live clients sharing edits need common authority, synchronization and compatible versions. Neither path requires EAS or EFS. Private clients must preserve authorized access and compatible decryption.

## 17. Who keeps a usable copy?

### On slide

Who keeps a usable copy?

Files and databases

Files + attachments
Database export

IPFS host

Independent Arweave copy

User saved backup

Onchain records

Contract state

Ethereum full nodes

TEST

Block the primary storage provider.
Can you recover the record and attachments elsewhere?

### Speaker notes

Planned 8:30-9:25

Where will a usable copy come from when the main provider disappears?

For files and databases, arrange independently retained copies. That could be an IPFS host, a copy on Arweave, or a backup the user controls. Keep attachments and the format information needed to restore useful work.

For records on Ethereum, full nodes replicate the state. Your app still needs a route to those nodes and any history it uses.

Give retention a budget and an owner. Block the primary provider in a test setup, recover through an alternative, and open the result.

Optional detail (not part of the timed route)

The diagram shows two storage arrangements, not a prescription to move every database to Ethereum. Offchain copies are illustrative and must be refreshed under a defined policy. A chain state commitment is not an archive of every historical state or offchain file. Rebuilding indexes may require retained event history and suitable node access. IPFS persistence requires providers to retain content. Backups alone do not preserve a live multiwriter service; independent deployment/sync and authorization may also be needed.

Sources
https://docs.ipfs.tech/concepts/persistence/
https://ethereum.org/developers/docs/nodes-and-clients/
https://www.inkandswitch.com/essay/local-first/

## 18. Shared paths, data verifiability

### On slide

Shared paths, data verifiability

Example path: /notes/meeting.md

Onchain file record
File details + fingerprint
Retrieval references

Contract reads
file details

Web client retrieves a copy
and checks its fingerprint

IPFS copy

Arweave copy

TEST

Fetch from another source. Does its fingerprint
match the accepted file record?

### Speaker notes

Planned 9:25-10:30

This is one job I built Ethereum File System to help with. A readable path leads to an onchain record with file details, retrieval references and a fingerprint for verifying its bytes.

A contract can read the file details. A web client can retrieve a copy from IPFS or Arweave and check its fingerprint against the expected value.

Ethereum provides metadata. Any provider can serve the same file, and another app can use its reference. What identifies the accepted version in your app, and how can someone obtain and check a replacement copy?

Optional detail (not part of the timed route)

The /notes/meeting.md path is illustrative. The EFS Sepolia proof package supplies historical evidence for retrieving and checking the same artifact through IPFS and Arweave, not a fresh run in this revision. A digest is a cryptographic hash, called a content fingerprint in the spoken explanation. It checks byte integrity relative to an accepted reference, not semantic truth, freshness or retention. Onchain contracts read metadata; clients fetch offchain bytes. Include chain, deployment and exact revision in a stable reference. No public EFS version or new deployment promise.

Visible historical summary source: EVIDENCE.md at pinned commit e86e6e77fcb5cda31374e07c5f582b502455ba80. It records a July 29, 2026 capture for efs-sepolia-deployment-reference-v0.tar.gz, 63,245 bytes, SHA-256 9c5bbda410deea8714a37b5ab82d3e22982cee79d1d1320cd43a91d562f34d39. Both retrieval rows say VERIFIED. The retained evidence is a dated results table, not raw timestamped verifier stdout. The illustrative note path above is not that archive. This pass inspected the record and did not rerun retrieval or verify present availability.

Sources
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof
https://efs.eth.limo/
https://github.com/efs-project/contracts/blob/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof/EVIDENCE.md

## 19. The data survives. Can your app read it?

### On slide

The data survives. Can your app read it?

Read a wallet balance

Ethereum
Chain state

RPC provider
or your own node

Balance
2.40 ETH

Show a transaction history

Published
records + history

Independent indexers
Example: The Graph

Recent transfers
0.20 ETH received

Light clients such as Helios can verify supported chain reads.

TEST

Switch data providers. Can users still find
their records and latest changes?

### Speaker notes

Planned 10:30-11:40

The data can survive while your app loses its way to read it.

Reading a wallet balance is a chain-state query. An RPC connects the app to a node. Make that provider replaceable, with a route to your own node. A light client such as Helios can verify supported chain reads.

A useful transaction-history view often comes from an index. The Graph is one Ethereum example. Another operator needs the recipe and retained history to recreate that view.

Test the two jobs separately. Switch the RPC, then try another index or rebuild it. Can users still find known records and their latest changes?

Optional detail (not part of the timed route)

The Graph network is live; this is a mechanism example, not a blanket reliability assessment of every subgraph. Its normal gateway/API-key/billing path has its own dependencies. A replacement needs the subgraph definition, linked files, schema, chain history, RPC and database. Helios verifies supported Ethereum consensus/execution responses with checkpoint and RPC assumptions; it does not automatically verify arbitrary index queries or retain offchain files. Multiple RPCs offer alternatives, not verification by majority vote. For completeness checks, compare an expected set of known records as well as the indexed block height. No EFS light-client integration is claimed.

The wallet balance and transfer amounts are invented UI examples, not live account data. Test RPC replacement and index replacement separately. A known-record check and sync height are bounded evidence, not proof that every result is complete.
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

TEST

Stop your transaction service. Can another
operator complete the user’s request?

### Speaker notes

Planned 11:40-12:35

A contract still needs someone to submit a transaction to move important business processes forward. Many apps also need background services to supply inputs or do work.

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

User-controlled app upgrades

Clear rules for shared governance

### Speaker notes

Planned 12:40-12:50

Stable contracts give builders a foundation. Users should be able to choose app upgrades. Shared systems need clear agreements about how their rules change.

Check who can change those rules, and what users can keep using if that power is abused.

## 23. Immutable contracts

### On slide

A stable core
Keep contract code fixed
Let other apps build on it

Room to improve
Deploy a new version
Let users choose to migrate

Immutable contracts

Uniswap: fixed code, shared exchange logic

UNIX mindset: Do one thing and do it well

TEST

Keep the old app release and contract address.
Can users complete the task without upgrading?

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

Use another node
Keep required history
Check inclusion and finality

L2 and settlement

Who orders transactions?
Can users submit through L1?
How can users withdraw?

The network beneath the app

TEST

Rehearse a documented network outage.
Can the user complete the recovery steps?

### Speaker notes

Planned 14:15-15:15

Your app inherits the chain beneath it. On Ethereum, preserve a usable node connection and the history your app needs. Understand when a transaction is included and final.

On an L2, learn who orders transactions, where the data lives and how it settles on L1. Choose one concrete failure to rehearse. For a sequencer outage, OP Stack documentation describes submitting through L1. Withdrawal and a hostile upgrade are different cases.

Use your chain’s documented path and your app’s actual account. Can the user complete the recovery steps? Record the delay, cost and anything they must prepare beforehand.

Optional detail (not part of the timed route)

An unavailable sequencer, a faulty prover, missing data and a hostile upgrade are distinct failure modes. OP Stack forced inclusion through OptimismPortal is not a universal exit guarantee or a cure for hostile upgrades. Withdrawal rules, bridges, security councils, upgrade controls and deployment configuration need separate inspection. Inherited token, oracle, bridge and other protocol dependencies can change an otherwise fixed application. Nodes need peer connectivity and required history. This is an app design check, not a performed recovery test.

The network test starts with one named failure and its chain-specific documented response. Sequencer outage, withdrawal and hostile upgrade are distinct. Do not perform production disruption or wallet transactions during the presentation.
Sources
https://ethereum.org/developers/docs/nodes-and-clients/
https://docs.optimism.io/op-stack/protocol/outages

## 25. Could someone run it without you?

### On slide

Could someone run it without you?

software + license
data + instructions
configuration + costs

Independent
operator

User’s task
completed

No private help from the team

Public handoff

Their own keys
and hosting

A working service
users can choose

TEST

Give an outsider the docs. Can they run it
and complete the task without contacting you?

### Speaker notes

Planned 15:15-15:55

The code may be public, but can someone actually take over?

Give an outsider the published software, license, inputs, configuration and instructions. Then stop helping. They use their own accounts and hosting to start a replacement and help a test user complete the task.

Record every missing instruction, permission or secret. Include the running costs and how an operator can cover them. This dry run finds knowledge that otherwise lives only in your team’s heads.

The result we want is a service users can choose, without asking the original team for permission.

Optional detail (not part of the timed route)

Illustrative handoff, not a completed operator exercise. Three participants is James's resilience ambition, not a universal safety threshold. Shared cloud accounts, credentials, funders and undocumented privileges can defeat apparent redundancy. Include licenses, documentation, funding and compatible standards so a willing operator can act.

The dry run is proposed audience practice, not a completed EFS operator handoff. An outsider must complete the actual user task using their own accounts and accessible inputs, not merely install the software.

## 26. A walk away test for your app

### On slide

A walk away test for your app

Putting this into practice

### Speaker notes

Planned 15:55-16:00

Here is the checklist to take back to your own app.

## 27. Your walk away checklist

### On slide

Your walk away checklist

Interface

Open a saved release
Recover access and keys

Data

Restore usable records
Switch clients and providers
Run essential background jobs

Rules

Identify who can change rules
Keep using accepted rules
Try the chain’s outage or exit path

TEST

Remove one team dependency. Repeat the user’s task.
Improve what stops it, then try again.

### Speaker notes

Planned 16:00-16:45

Return to the task you chose at the start.

Interface: can someone open a saved release and recover access? Data: can they restore usable records, choose another provider and keep required background work running? Rules: who can change them, what can users refuse, and what happens during a chain outage?

Remove one team dependency in a test setup. Repeat the task, fix what stops it, and try again.

Optional detail (not part of the timed route)

A practical exercise, not certification or a maintained scoring tool. Keep an explicit inventory of upgrade, pause, routing, account and data-writing powers. Record time, cost, privacy, required inputs and remaining assumptions. The next slide shows an illustrative export/import failure, not an observed EFS outage.

## 28. A walk away test in practice

### On slide

A walk away test in practice

Test a saved export with the original app blocked.

1. Import saved data

2. Fix the export

3. Import again

Meeting at 10

Review proposals.

agenda.md
Attachment missing

Task blocked

Complete export

notes.json
agenda.md

Reconnect. Save all files.
Block the app again.

Meeting at 10

Review proposals.

agenda.md opens
Review proposals

Task completed

TEST

Import a saved export into another app.
Can you open the note and its attachment?

### Speaker notes

Planned 16:45-17:45

Here is one small test you could run: import a saved export into another client, then open a note and its attachment with the original app unavailable.

The first attempt imports the note, but the attachment is missing. The user cannot finish. That is a useful failure.

While the original system is still available, improve the export to include the attachment. Retain the complete copy, repeat the outage, and import again. Now the note and its attachment open.

This is an illustrative example. The method is what matters: choose a task, expose one dependency, improve it, and repeat the same task.

Optional detail (not part of the timed route)

The export, notes, attachment and application states are illustrative. No live import, runtime verification or measured recovery is claimed. The complete export must be prepared and retained while the source data is still accessible, before repeating the outage. An import is a migration/recovery path; ongoing shared edits need agreed authorization and synchronization. Use test accounts and copies.

## 29. Our work can outlive us

### On slide

Our work can outlive us

### Speaker notes

Planned 17:45-18:30

I envision future where people can trust software with the important parts of their lives. Where their work remains theirs, they choose their own tools, and developers keep adding to foundations everyone can build on.

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

Let’s build reliable and long lasting apps together 🖖

### Speaker notes

Q&A

Thank you. Which part of your app would you most like to make independent of your team?

Optional detail (not part of the timed route)

Q&A and public contact slide. No live demo or new protocol deployment is claimed.

Sources
https://efs.eth.limo/
https://app.efs.eth.limo/
https://youtu.be/gZl711IriSM
