## Slide 1

Who Can Turn Off
Your Ethereum App?

James Carnley
Ethereum File System

A Full Stack Walk Away Test

### Speaker notes

I'm James Carnley and I build Ethereum File System. I want the things we build to remain useful long after we are gone. Today we'll take a high level look at what that asks of your whole application.


## Slide 2

Why make an app you can walk away from?

Building Cypherpunk Apps

### Speaker notes

Why put the work into making an app people can keep using without you?


## Slide 3

What happens when an app disappears?

Users lose their work and trust

Other developers can’t rely on that functionality

Communities splinter

### Speaker notes

Imagine you're a researcher with years of notes, attachments and shared work inside an app. The company closes or a new owner alters the deal. Your work still matters, but you lose the tools you need to use it.

Developers feel this too. If an app you depend on disappears, part of your app can disappear with it.

And communities can take years to build. When an app dies, people lose the place where they worked together. Many never find each other again.

We can make choices now that give all of them a better future.

Optional detail (not part of the timed route)

Illustrative human stakes, not a customer testimonial. Shutdown and hostile changes create different recovery problems.


## Slide 4

For people

Keep years of useful work
Choose better tools

For builders

Reuse dependable capabilities
Build bigger things together

Software worth building on

### Speaker notes

We want people to keep their work, choose better tools and trust software with important parts of their lives. And we need developers to build on top of useful capabilities without worrying whether the original company will still exist next year or might rug them.

That is why app dependability matters to me. Each dependable component gives the next builder somewhere to start. Over time, those components can support bigger shared projects and even the institutions our communities depend on.


## Slide 5

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

Hyperstructures give a name to this ambition: lasting public protocols that anyone can use and build on without depending on their creators.

Different teams provide membership, voting and treasury components. A DAO app combines them. Another team builds a social app using that DAO and a moderation module.

Each team adds a useful capability instead of rebuilding everything beneath it. Stable interfaces and dependable operation let their work accumulate.

That is the future I want to help build. CROPS gives us the values to aim for: censorship resistance, open source, privacy and security. The walk away test helps us put those values into practice.

Optional detail (not part of the timed route)

Illustrative composition, not a deployed DAO or a claim that every module meets the full hyperstructure definition. Arrows point from a reusable capability to its consumer. Moderation changes an interface's selection, not all retained records or the DAO's shared rules. Jacob Horne's definition has additional economic conditions. Ethereum operation, storage, funding and participants remain assumptions.

Sources
https://jacob.energy/hyperstructures.html
https://ethereum.org/foundation/mandate


## Slide 6

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

Think of one task your users rely on. Keep it in mind as we go through the stack.

First, imagine your team disappears. Can people keep working, and can others run the services? Then imagine control becomes hostile. Someone takes the admin keys or changes the rules. What can users still keep using?

We're looking for single points of failure and control. The test boxes turn each layer into a small exercise you can try on your own app. Use test accounts and copies of data.

Optional detail (not part of the timed route)

Absence and hostile control are separate scenarios. Several operators only help when they have the inputs and authority to act independently. Use test accounts and copied data for exercises.

Sources
https://vitalik.eth.limo/general/2024/09/28/alignment.html


## Slide 7

Interface

Names and discovery
Runnable software
Accounts and recovery

Data

Storage and formats
Chain reads and indexes
Background work

Rules

Contracts and governance
Network and settlement

The application stack

### Speaker notes

Here is our map of the app, grouped into three chapters.

Interface covers finding and running the app and recovering access. Data covers usable records, reliable reads and the work happening in the background. Rules covers contract powers and the network beneath them.

For each part, we'll look at an improvement you can make and something you can check.


## Slide 8

Finding and using the app

Interface

### Speaker notes

First, can someone still get into your app and do that task?


## Slide 9

Can people find and use your app?

Find a saved release

Run it without your servers

Recover access without your help

### Speaker notes

They need a way to find a release, run the software and recover their access. Those are three useful checks before we even reach the app's data.


## Slide 10

More than one way into the app

DNS + HTTPS

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

Most Web3 apps are web apps, so people still need a way to load the interface in a browser.

On the left, a DNS name leads to a hosted website. If that service disappears, users need another route.

On the right, efs dot eth points to an IPFS identifier for a particular release. Different people can keep copies of those same files. Users can reach a copy through a gateway or their own IPFS node. With a verifying client or node, they can also check that the files match the identifier.

Now imagine someone takes control of your name and points it to a malicious release. A user who kept the identifier of a previously trusted release can bypass that name and open a retained copy.

Keep that identifier, independent copies and clear opening instructions. Block the usual website. Can the user open that release and do their task?

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
https://docs.ipfs.tech/how-to/gateway-best-practices/


## Slide 11

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

A saved web page is only useful if people can run the client behind it.

On the left, the HTML lives on IPFS, but it still loads JavaScript from your team's server. When that server disappears, the client cannot start.

On the right, the release contains all of the code, styles, assets and configuration needed to run. Someone can save and serve that complete release.

Try blocking your team's host in a test environment, clear the browser cache and reload. Does the client start?

Remember to keep the source, dependencies and build instructions too, so another developer can maintain it.

Optional detail (not part of the timed route)

Running a saved release and reproducing a build are separate checks. Inspect dynamic imports, remote configuration, wallet connectors and deep links. The Ledger Connect Kit compromise is an optional historical example of distribution becoming an attack path.

This slide tests the client release, not all external services. Bundle or independently retain essential scripts, lazy-loaded code, assets and configuration. Runtime RPCs, indexes and authorization paths are assessed in their own layers. Build source and dependency inputs must remain obtainable; a lockfile alone is insufficient. Diagram is illustrative.

Sources
https://docs.ipfs.tech/how-to/websites-on-ipfs/single-page-website/
https://www.ledger.com/blog/security-incident-report


## Slide 12

Access without the company

The client starts. Can the user actually get in?

App

Locked out

User’s wallet

Same account
Shared access rules

A compatible service recognizes the same account

TEST

Disable company login. Can the user complete
the same action through another client?

### Speaker notes

The previous test showed that the client starts. Now can the user actually get in?

The company's login service can disappear even while the app and data survive. A user-controlled account gives another compatible service an identity it can recognize. Sign-In with Ethereum, or SIWE, standardizes proving control of an Ethereum account.

That service also needs the permission rules, so it knows what the account is allowed to do.

Whether you use SIWE or OAuth, try the same authorized task through another client with the company offline. Check account recovery too. We'll look at private-file keys separately in the Data chapter.

Optional detail (not part of the timed route)

The diagram contrasts company-mediated login with independently usable account authority. A wallet signature alone does not make a company API replaceable. The alternative requires compatible software, independently reachable services, and permission rules that recognize the same account. Safe is an optional recovery example: a configured two-of-three account can replace one lost signer using the remaining authorized signers, provided those signers and the execution path do not depend on the company. Account recovery does not reconstruct file-decryption keys. Standard encryption needs compatible formats and user-controlled key recovery. Keep sensitive data private and preserve authorization across clients. Team admin-key loss/compromise belongs in Rules and the explicit powers checklist.

SIWE authenticates an Ethereum account to an offchain service. It does not make that service independent or replaceable. OAuth/OIDC is not inherently incompatible with portability. The illustrated alternative must preserve authorization through a compatible, independently usable service or contract path.
Sources
https://docs.safe.global/advanced/smart-account-overview
https://docs.safe.global/advanced/cli-overview
https://eips.ethereum.org/EIPS/eip-4361


## Slide 13

Continuing the work

Data

### Speaker notes

Next, could they keep using the data that your task depends on?


## Slide 14

Is the data portable?

Keep the files and their meaning

Use them through another app

Let others run the supporting services

### Speaker notes

Now we need to keep the work usable. That means keeping the files and their meaning, opening them in another app, and making the supporting services replaceable.


## Slide 15

Data another app can understand

Example shared record

{
  "id": "note-17",
  "author": "0x1234…",
  "text": "Meeting at 10",
  "file": "agenda.md",
  "version": 2
}

Shared meaning

What each field means

Who can change it

How versions fit together

Who can read and decrypt it

Shared schemas with EAS         Documented exports from your database.

TEST

Hand over an export and its format.
Can another developer understand it without asking you?

### Speaker notes

Another app needs to understand what your data means. This example has a stable identifier, an author, some text, an attachment and a version. Publish the field meanings and the rules for reading and changing the record.

Ethereum Attestation Service, or EAS, uses shared schemas to describe structured statements and records who made them.

Your existing database can benefit too. Export a documented format with identifiers, relationships, attachments and the encryption information an authorized reader needs.

Give another developer an export and its documentation. Can they use it without asking you how?

Optional detail (not part of the timed route)

The displayed note is illustrative, not a deployed EAS schema or EAS/EFS integration. EAS has separate schema, attester and data fields and supports onchain and offchain attestations. An attester is not a proof of truth. Stable IDs, author identity, references, schema versions and permission rules must retain meaning across implementations. Export offers a migration/recovery path; ongoing shared writes additionally need agreed synchronization, conflict handling and authorization. A database does not have to move onchain for these improvements.

Sources
https://attest.org/
https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/SchemaRegistry.sol
https://github.com/ethereum-attestation-service/eas-contracts/blob/master/contracts/IEAS.sol


## Slide 16

Private data you can recover

TEST

With the company offline, recover the keys
and reopen a private file in another reader.

Keep private work readable without company approval.

Encrypted copy
private-notes.enc

File decryption keys
User’s recovery method

Compatible
reader

Private note
opens

A documented encryption format

### Speaker notes

Private files add another requirement: keys that can decrypt them. Imagine the company closes, but you kept an encrypted copy of an important note.

You also need a protected key backup or recovery method that works without the company, plus software that understands the encrypted format.

In a test, block the company’s services. Recover the keys using the planned method, then reopen the private file in another reader. The user keeps both their privacy and access to their own work.

Optional detail (not part of the timed route)

This is an illustrative dependency diagram, not a claim of deployed EFS encryption or recovery. Account recovery on slide 12 and file decryption here are separate checks. A wallet signature or recovered account does not automatically recreate decryption keys. The recovery path must protect confidentiality, preserve authorized access, and work without company approval. Retain the encrypted bytes, required headers/parameters, a documented format, compatible software and usable recovery material. Prepare and test recovery while the source is accessible. Use test copies and never expose real keys during a presentation.

age is one example of a documented encrypted-file format. It specifies a versioned header and recipient-wrapped file keys. It is not required here and does not by itself supply a complete recovery system. OWASP discusses protecting and testing key backups and recovery. Recovery design adds security and usability work that must fit the user's threat model.

Sources
https://c2sp.org/age@v1.1.0
https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html


## Slide 17

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

Where will a usable copy come from when the main provider disappears?

For files and databases, arrange independently maintained copies. That could be an IPFS host, a copy on Arweave, or a backup the user controls. Keep the attachments and format information too, so the work can actually be restored.

For data on Ethereum, nodes validate and retain the current contract state. That can be a useful home for small or critical records.

Block the primary data provider, recover through an alternative or backup, and check that the result still works.

Optional detail (not part of the timed route)

The diagram shows two storage arrangements, not a prescription to move every database to Ethereum. Offchain copies are illustrative and must be refreshed under a defined policy. A chain state commitment is not an archive of every historical state or offchain file. Rebuilding indexes may require retained event history and suitable node access. IPFS persistence requires providers to retain content. Backups alone do not preserve a live multiwriter service; independent deployment/sync and authorization may also be needed.

Sources
https://docs.ipfs.tech/concepts/persistence/
https://ethereum.org/developers/docs/nodes-and-clients/
https://www.inkandswitch.com/essay/local-first/


## Slide 18

Shared paths, verifiable files

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

This is one job I built Ethereum File System to help with. I wanted a file reference that different apps could use, even when they got the file from different providers.

In this example, a readable path leads to an onchain record with file details, retrieval references and a fingerprint. That fingerprint is a cryptographic hash of the file.

A contract can read the file details. A web client can retrieve a copy from IPFS or Arweave and check its fingerprint against the record.

Think about your own app. What identifies the accepted version of a file, and can someone obtain and check a copy from another source?

Optional detail (not part of the timed route)

The /notes/meeting.md path is illustrative. The EFS Sepolia proof package supplies historical evidence for retrieving and checking the same artifact through IPFS and Arweave, not a fresh run in this revision. A digest is a cryptographic hash, called a content fingerprint in the spoken explanation. It checks byte integrity relative to an accepted reference, not semantic truth, freshness or retention. Onchain contracts read metadata; clients fetch offchain bytes. Include chain, deployment and exact revision in a stable reference. No public EFS version or new deployment promise.

Historical evidence source: EVIDENCE.md at pinned commit e86e6e77fcb5cda31374e07c5f582b502455ba80. It records a July 29, 2026 capture for efs-sepolia-deployment-reference-v0.tar.gz, 63,245 bytes, SHA-256 9c5bbda410deea8714a37b5ab82d3e22982cee79d1d1320cd43a91d562f34d39. Both retrieval rows say VERIFIED. The retained evidence is a dated results table, not raw timestamped verifier stdout. The illustrative note path above is not that archive. This pass inspected the record and did not rerun retrieval or verify present availability.

Sources
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof
https://efs.eth.limo/
https://github.com/efs-project/contracts/blob/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof/EVIDENCE.md


## Slide 19

The data survives. Can your app read it?

Read a file record

Ethereum
Contract state

RPC provider
or your own node

File record
agenda.md v2

Find a list of records

Published records
and history

Independent indexers
Example: The Graph

Your notes
and changes

Helios verifies supported Ethereum RPC responses.

TEST

Switch the RPC, then the index. Can users
still find their notes and latest changes?

### Speaker notes

The data can survive while your app loses its way to read it.

The top row reads one onchain file record. An RPC provider connects your app to an Ethereum node. Make that provider replaceable, or connect to a node you run yourself. The response gives us the file reference and version. Storage supplies the actual file.

Helios is a light client that can verify supported Ethereum RPC responses, rather than simply trusting the provider.

The bottom row finds a list of records. An index organizes those records for queries, like finding all your notes. The Graph is one Ethereum example. Another operator needs the indexing instructions and retained history to recreate that view.

Switch the RPC, then try another index or rebuild it. Can users still find their notes and latest changes?

Optional detail (not part of the timed route)

The Graph network is live; this is a mechanism example, not a blanket reliability assessment of every subgraph. Its normal gateway/API-key/billing path has its own dependencies. A replacement needs the subgraph definition, linked files, schema, chain history, RPC and database. Helios verifies supported Ethereum consensus/execution responses with checkpoint and RPC assumptions; it does not automatically verify arbitrary index queries or retain offchain files. Multiple RPCs offer alternatives, not verification by majority vote. For completeness checks, compare an expected set of known records as well as the indexed block height. No EFS light-client integration is claimed.

The file name, version and notebook entries are illustrative, not live EFS results. RPC reads the onchain file reference and version. Storage supplies the file bytes. Private notebook discovery must preserve the user’s authorization. Test RPC replacement and index replacement separately. A known-record check and sync height are bounded evidence, not proof that every result is complete.
Sources
https://thegraph.com/docs/en/indexing/overview/
https://thegraph.com/docs/en/gateways/subgraphs/components/overview/
https://thegraph.com/docs/en/subgraphs/providers/subgraph-studio/managing-api-keys/
https://github.com/a16z/helios
https://github.com/a16z/helios/blob/master/rpc.md


## Slide 20

Who sends the next transaction?

Tornado Cash Classic: replaceable relayers

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

A contract can stay onchain while the service that sends it transactions disappears. The same question applies to background jobs such as updating an index or providing an oracle's inputs.

Tornado Cash Classic gives one focused example. A relayer submits a user's withdrawal proof and pays the transaction's gas. The pool contract checks the proof. The user can choose another relayer and generate a proof for that choice. The pool doesn't require the original team's relayer.

Ask the same question about your workers. Could another operator get the code and inputs, pay the costs, and complete the job? Could the user take over?

Try a replacement in a test environment before your original service disappears.

Optional detail (not part of the timed route)

Technical mechanism only, not instructions to use the service or a current legal/availability claim. Classic pool withdrawal checks the proof, known root and unspent nullifier rather than a privileged caller allowlist. The proof binds recipient, relayer payment address, fee and refund; a replacement paid relayer may require a new proof. UI registry/listing rules are distinct from pool-level permissionless submission. Pool contracts, relayer registry and upgradeable governance are separate components. Oracles, provers, bundlers and paymasters have different inputs, economics and authorities; test the actual job instead of assuming every worker is interchangeable.

Sources
https://github.com/tornadocash/tornado-core/blob/master/contracts/Tornado.sol
https://github.com/tornadocash/tornado-core/blob/master/contracts/ETHTornado.sol
https://github.com/tornadocash/docs/blob/en/general/how-to-become-a-relayer.md


## Slide 21

Keeping dependable rules

Rules

### Speaker notes

Finally, can users keep the rules they accepted for that task?


## Slide 22

Who chooses the changes?

Stable core contracts

User controlled app upgrades

Clear rules for shared governance

### Speaker notes

Stable contracts give builders a foundation. Users should be able to choose app upgrades. Shared systems still need an agreed way to change shared rules.

Check who can upgrade, pause or redirect the system, and what users can keep using if that power is abused.


## Slide 23

A stable core
Keep contract code fixed
Let other apps build on it

Room to improve
Deploy a new version
Let users choose to migrate

Immutable contracts

Uniswap v2: fixed core exchange logic

UNIX mindset: Do one thing and do it well

TEST

Keep the old app release and contract address.
Can users complete the task without upgrading?

### Speaker notes

Remember the saved app release? A stable contract gives that interface something dependable to call.

I want to encourage everyone in the room to write immutable core contracts. That becomes more manageable if you keep the UNIX philosophy in mind: do one small thing very well.

Uniswap v2 is a useful example. Its core exchange code stays fixed, so other apps can keep calling the same contracts when newer versions arrive. Users can choose which version to use.

That is a foundation another team can build on without depending on your next release. Tokens, liquidity and any remaining admin powers still matter.

Deploy a new version and let users choose to migrate. Fixed code can't be patched in place, so keep the core small and test it carefully. Check what happens if your team loses its keys, and inspect any powers that can still change behavior.

Optional detail (not part of the timed route)

Fixed core code does not freeze external inputs, fees or all dependencies. v2 Factory has bounded feeTo/feeToSetter powers and no arbitrary core upgrade. Official docs describe v2/v3/v4 core as non-upgradeable; v4 hooks can introduce separate custom and upgradeable behavior. Use v2 as the simple slide example. A canonical v2 USDC/WETH Swap receipt was independently checked October 26, 2026: transaction 0xd5cc225a285adc402669af3930dca1e486e5508feb1289be447a3d1660aaa4f7, block 26280293, status 1. This establishes activity, not general safety. Zerion cites liquidity and execution benefits, not immutability as its selection motive; its API integration adds an offchain dependency. Immutability removes in-place repair, so scope/audit carefully and plan voluntary migration. No new EFS immutability verification.

Sources
https://developers.uniswap.org/docs/get-started/concepts/how-uniswap-works
https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Factory.sol
https://github.com/Uniswap/v2-core/blob/master/contracts/UniswapV2Pair.sol
https://developers.uniswap.org/docs/protocols/v4/security
https://zerion.io/blog/zerion-wallet-now-offers-swaps-powered-by-uniswap-api/
https://etherscan.io/tx/0xd5cc225a285adc402669af3930dca1e486e5508feb1289be447a3d1660aaa4f7


## Slide 24

Ethereum L1

Use another node
Keep required history
Check inclusion and finality

L2 settlement

Who orders transactions?
Can users submit through L1?
How can users withdraw?

The network beneath the app

TEST

Rehearse a documented network outage.
Can the user complete the recovery steps?

### Speaker notes

Your app inherits the chain beneath it. On Ethereum, keep a usable node connection and the history your app needs. Know when a transaction is included and when it is final.

On an L2, learn who orders transactions, where the data lives and how the chain settles on L1. For an OP Stack sequencer outage, there is a documented route to submit through L1. Withdrawal is a separate path to understand.

Use your chain's documented recovery path and your user's actual account. Can they complete the steps? Record the delay, cost and anything they must prepare beforehand. Include the bridges, tokens and oracles your app relies on.

Optional detail (not part of the timed route)

An unavailable sequencer, a faulty prover, missing data and a hostile upgrade are distinct failure modes. OP Stack forced inclusion through OptimismPortal is not a universal exit guarantee or a cure for hostile upgrades. Withdrawal rules, bridges, security councils, upgrade controls and deployment configuration need separate inspection. Inherited token, oracle, bridge and other protocol dependencies can change an otherwise fixed application. Nodes need peer connectivity and required history. This is an app design check, not a performed recovery test.

The network test starts with one named failure and its chain-specific documented response. Sequencer outage, withdrawal and hostile upgrade are distinct. Do not perform production disruption or wallet transactions during the presentation.
Sources
https://ethereum.org/developers/docs/nodes-and-clients/
https://docs.optimism.io/op-stack/protocol/outages


## Slide 25

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

A service
users can choose

TEST

Give an outsider the docs. Can they run it
and complete the task without contacting you?

### Speaker notes

The code may be public, but can someone actually take over?

Give an outsider the published software, license, inputs, configuration and instructions. Then stop helping. They use their own accounts and hosting to start a replacement and help a test user complete the task.

Record every missing instruction, permission or secret. Include the running costs and how an operator can cover them. Check for shared dependencies too. Three operators using your cloud account still depend on you.

The result we want is a service users can choose, without asking the original team for permission.

Optional detail (not part of the timed route)

Illustrative handoff, not a completed operator exercise. Three participants is James's resilience ambition, not a universal safety threshold. Shared cloud accounts, credentials, funders and undocumented privileges can defeat apparent redundancy. Include licenses, documentation, funding and compatible standards so a willing operator can act.

The dry run is proposed audience practice, not a completed EFS operator handoff. An outsider must complete the actual user task using their own accounts and accessible inputs, not merely install the software.


## Slide 26

A walk away test for your app

Putting this into practice

### Speaker notes

Here is the checklist to take back to your own app.


## Slide 27

Your walk away checklist

Interface

Find a trusted release
Run it independently
Recover account access

Data

Restore files and keys
Switch RPCs and indexes
Run background work

Rules

Identify who can change rules
Keep using accepted rules
Rehearse recovery or exit

TEST

Remove one team dependency. Repeat the user’s task.
Fix what stops it, then try again.

### Speaker notes

Think back to the task you chose at the start.

For the Interface: can users find a trusted release, run it and recover their account?

For Data: can they restore files and decryption keys in another client, replace the RPC and index, and keep background work running?

For Rules: who can change them, what can users keep using, and can they follow the chain's recovery or exit path?

Remove one team dependency in a test setup. Repeat the task, fix what breaks, and try again.

You may not pass every test yet. Each improvement makes the app more dependable for its users and the next developer building on it.

Optional detail (not part of the timed route)

A practical exercise, not certification or a maintained scoring tool. Keep an explicit inventory of upgrade, pause, routing, account and data-writing powers. Record time, cost, privacy, required inputs and remaining assumptions.


## Slide 28

Our work can outlive us

### Speaker notes

I envision a future where people can trust software with the important parts of their lives. Where their work remains theirs, they choose their own tools, and developers keep adding to foundations everyone can build on.

That is what draws me to Ethereum and what I am trying to contribute with EFS.

Start with one important task. Make it easier for someone else to keep it working. Every dependable piece gives the next person more to build with.

If we do this right, our work can outlive us.


## Slide 29

Thank you!

James Carnley
Ethereum File System
efs.eth.link
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
