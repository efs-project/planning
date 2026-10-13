# Slides and speaker notes at first read-through

Captured October 13, 2026 from the working rehearsal deck. James reports a 17-minute read of the speaker notes. Demo timing treatment was not reported. The slide order and wording below preserve this revision, including its rehearsal-only disclosures.

## Slide 1

### Slide text

Who Can Turn Off
Your Ethereum App?
James Carnley
Ethereum File System
A Full-Stack Walk-Away Test

### Speaker notes

Planned 0:00-0:15 (15 seconds). Timing not measured.

I'm James Carnley. I build Ethereum File System. I want the things people build with my software to have a future that doesn't depend on me being there. This is a talk about what it takes to make that possible.

## Slide 2

### Slide text

The archive
is still theirs
A community spends years building an archive.

Someone returns for a file.
The builder is gone.

Can they still find it, open it and trust it?

### Speaker notes

Planned 0:15-0:50 (35 seconds). Timing not measured.

Imagine a community building an archive over years. Someone returns because they need a file they put there. The person who built the app has died, burned out, or stopped answering. This is an imagined user, not an EFS customer story. The work still matters to them. If I disappear, I don't want their work to disappear with me. Now imagine I'm still here, but somebody else has my keys. What happens to their work then?

## Slide 3

### Slide text

The maintainer disappears

Can users continue without the team's services, accounts or help?
The maintainer's keys are hostile

Can users refuse a change and continue with what they trusted?
Absence and hostile control

### Speaker notes

Planned 0:50-1:15 (25 seconds). Timing not measured.

Those are the two tests we'll keep using. Absence asks whether someone can continue without us. Hostile control asks whether they can refuse someone acting as us. Redundancy helps with an outage. It can still leave one person able to redirect every alternative. We'll follow one task through the stack and ask both questions.

## Slide 4

### Slide text

Ethereum File System
An open-source public good for file names and onchain records
Paths, provenance and verifiable file references
File bytes can live on different storage networks
Sepolia is the working example in this talk

### Speaker notes

Planned 1:15-2:30 (75 seconds). Timing not measured.

I built Ethereum File System because I want public infrastructure where the maintainer is optional. EFS gives files shared paths and onchain records describing their provenance and references. The bytes can live on different storage networks. A file reference connects what you want with what you retrieve. That separation gives us a useful task to follow: find one file, retrieve it, and check it against an accepted public reference. The public web client uses ENS and IPFS. The example for this talk uses Sepolia. My design goal is stable rules and users who can carry on without me. We'll inspect the actual powers and dependencies of any deployment we demonstrate. Onchain records help preserve shared facts, while storage still needs people retaining the bytes. This is also a way to think about your app, even if it never uses EFS.

Sources:
https://efs.eth.limo/
https://app.efs.eth.limo/
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## Slide 5

### Slide text

Uniswap Labs interface

Labs documents restrictions through its interfaces.

The usual entrance has its own controls.
Underlying protocol

A different access layer.

A user still needs a compatible client and a safe way to use it.
The interface and the protocol

### Speaker notes

Planned 2:30-3:15 (45 seconds). Timing not measured.

Uniswap gives us a familiar example. Labs explicitly distinguishes its interfaces from the protocol and describes restrictions it applies through those interfaces. That shows why a contract staying available and a user's normal workflow staying available are different achievements. This is a comparison of layers, not a judgment about the team or every related contract. For our archive user, the question is whether another entrance actually lets them finish the same task. A different URL is only useful if it reaches the right rules and data safely.

Sources:
https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy

## Slide 6

### Slide text

The code the user actually runs
Retain the runnable release and its dependencies
Inspect scripts loaded after the app starts
Test an old release on a fresh device
Rebuilding from source is a separate check

### Speaker notes

Planned 3:15-4:15 (60 seconds). Timing not measured.

Our user needs to open the app they trusted. That means retaining the runnable release, as well as source, dependency versions and build instructions. Try it on a fresh device, without the founder's caches. Check the browser and operating system assumptions too. In the December 2023 Ledger Connect Kit incident, compromised package distribution supplied malicious code to integrating apps at runtime. Those apps' own repositories did not need to change. Your release boundary includes code loaded later. Retaining reviewed dependencies and making updates deliberate reduces that moving target. It also leaves you responsible for security updates and compatibility. Running an old release and rebuilding it from source are different checks. Neither proves the code is safe on a compromised device.

Sources:
https://www.ledger.com/blog/security-incident-report

## Slide 7

### Slide text

A familiar name
can change
ENS names point to content.
A browser gateway provides an access route.

Retain the accepted release reference.
Test another route.

Who chooses the next reference?

### Speaker notes

Planned 4:15-5:15 (60 seconds). Timing not measured.

The public EFS client uses ENS and IPFS. ENS helps someone find content, and the familiar eth.limo address lets a conventional browser reach it through a gateway. There are still servers in that access path, even without my own web server. Inspect the name's controller, resolver and renewal requirements. A mutable name is convenient because it can point to a new release. That same authority can redirect users. Keep an accepted release reference and test a route that doesn't depend on the original gateway. Then ask how a newcomer discovers which reference to trust after the name changes. Pinning bytes helps preserve an app. It doesn't automatically preserve discovery, security updates or the behavior of its contracts.

Sources:
https://docs.ens.domains/dweb/intro/
https://app.efs.eth.limo/

## Slide 8

### Slide text

Finding and checking the records
Storage needs retained copies
RPC responses need a known chain and block basis
Indexes need definitions and sufficient history
A correct result may still be stale or incomplete

### Speaker notes

Planned 5:15-6:15 (60 seconds). Timing not measured.

Next, the archive user needs to find the records and reach the bytes. Two gateways can serve the same retained copy. If that copy is gone, changing gateways won't create another one. IPFS addressing and retention solve different parts of the problem. An RPC supplies state, while an index helps discover it. Graph Node is a useful outside example: rebuilding an index needs definitions, storage and suitable chain history, sometimes archive or trace capabilities. Open code alone isn't the recovery plan. Test a query on a replacement setup. Record its chain basis and check freshness and completeness for the task. Comparing providers can expose a discrepancy, but agreement isn't independent validation. Rebuilding has real costs in storage, bandwidth and time.

Sources:
https://docs.ipfs.tech/concepts/persistence/
https://thegraph.com/docs/en/indexing/tooling/graph-node/

## Slide 9

### Slide text

Public file retrieval

Bytes and a trusted reference may be enough to read.

Our EFS task follows this path.
Private work or new writes

Decryption, signing and account recovery add dependencies.

Test them separately with test accounts.
Recovery needs the right keys

### Speaker notes

Planned 6:15-7:15 (60 seconds). Timing not measured.

For our public file, reading can be much easier than publishing a new record. A private archive adds another requirement: the authorized user must still have a way to decrypt it. Available ciphertext can become useless when the only key service or device disappears. A wallet, login service, guardian or recovery module can also stop someone from acting. Test device and provider loss separately from file retrieval. Recovery helps availability, but extra recovery parties can gain takeover power or access to private data. Keep the recovery material appropriate to the user and rehearse with test accounts, never real funds. EFS file references don't by themselves solve private-key recovery. Success at reading one public file tells us nothing about every write path.

Sources:
https://docs.safe.global/advanced/smart-account-modules

## Slide 10

### Slide text

Who can change the rules?
Contract upgrades, pauses and configuration roles
Account modules and recovery powers
External contracts and their controllers
Fixed code still needs a plan for bugs

### Speaker notes

Planned 7:15-8:20 (65 seconds). Timing not measured.

Now inspect authority. Start with the actual deployed contracts, not the label in a README. Follow proxies, implementation addresses, pause roles, configuration powers and dependencies. Include the account that calls them. Safe modules illustrate why a multisig threshold is only part of the permission model: enabled modules can execute through their own logic. That can support recovery and automation, and also introduce another path to control. Limiting powers makes the promise clearer. Immutability can give users stable rules after I leave, but it also means I can't repair a bug in place. Make any migration or upgrade consent explicit. An old frontend can't undo a change to shared contract behavior. The useful question is what a user can preserve or refuse.

Sources:
https://docs.safe.global/advanced/smart-account-modules

## Slide 11

### Slide text

Work that happens offchain
Keepers, provers, relayers and sponsored transactions
Fresh oracle inputs and inherited protocols
Replacement operators need inputs, permission and funds
Some failures call for a safe read-only mode

### Speaker notes

Planned 8:20-9:00 (40 seconds). Timing not measured.

A healthy chain doesn't guarantee the rest of the work happens. A keeper, prover, relayer or paymaster may be essential. Can another operator get the inputs, do the work and submit it? Does the user have funds when a subsidy ends? Inputs need suitable freshness too. Chainlink documents timestamp checks for feeds. A successful call can return an input that's too old for the operation. Define a safe degraded mode. Sometimes keeping reads available and pausing sensitive writes protects users better than switching to an unreviewed fallback.

Sources:
https://docs.chain.link/data-feeds

## Slide 12

### Slide text

The network underneath the app
Internet access and reachable peers
Execution and consensus clients
Validators, transaction inclusion and finality
Required history and network lifetime

### Speaker notes

Planned 9:00-10:20 (80 seconds). Timing not measured.

The EFS task ultimately inherits the network and blockchain underneath its records. An execution client checks computation. A consensus client helps follow the accepted chain. Peers and validators still have to exist, and a transaction still needs inclusion and finality. Running a node can replace an RPC vendor. It still needs connectivity, resources and a functioning network. Check the history your recovery task needs. A testnet example also depends on the testnet's lifetime. Internet routing, cloud accounts and bootstrapping can make apparently separate paths fail together. Trace the operator and the funding, not just the URLs. For apps that require proofs, the recent ISA discussion adds a long-term question: can another operator still perform the computation when tooling changes? That's exploratory research, not an activated Ethereum feature or an EFS mechanism. More decentralization changes the dependency choices. It doesn't remove physics, upkeep or every network assumption.

Sources:
https://ethereum.org/developers/docs/nodes-and-clients/
https://ethresear.ch/t/exposing-an-isa-for-post-quantum-proofs-on-ethereum/26136
https://eips.ethereum.org/EIPS/eip-8288

## Slide 13

### Slide text

An L2 recovery path
has conditions
OP Stack documents an L1 route during sequencer outages.

Check the chosen chain and account type.
Budget fees and delay.

Forced inclusion and withdrawal are separate tests.

### Speaker notes

Planned 10:20-11:30 (70 seconds). Timing not measured.

If your app is on an L2, keep following the dependencies. Ask about its sequencer, available data, settlement, bridge and upgrade powers. OP Stack documents a way to submit through L1 when its sequencer is unavailable. That is a useful recovery mechanism. It also has conditions, including timing and account behavior. Test the chosen chain's actual route with the account your user has. Retain the inputs and enough funds for L1 fees. Forced inclusion and withdrawing an asset are separate questions. Other L2s can have different mechanisms. The point is to turn 'there is an escape hatch' into a task an ordinary user can actually finish. A mechanism that needs a specialist, a missing index or an unaffordable fee may not meet your recovery goal.

Sources:
https://docs.optimism.io/op-stack/protocol/outages

## Slide 14

### Slide text

One file and an accepted reference
Rehearsal walkthrough: planned checks
File identity and public records
Expected content reference accepted in advance
Remaining inputs: RPC, gateway and retained bytes

### Speaker notes

Planned 11:30-12:10 (40 seconds). Timing not measured.

This is the planned demonstration sequence. I haven't rerun and recorded it for this talk yet. We start with one known file and an accepted public reference. The expected value must come from something we already trust, rather than just the endpoint serving the file. We identify the chain basis, records and remaining RPC and gateway inputs. The archived proof package contains the original fixture and verifier. For this rehearsal, I'm describing the checks, not showing a fresh deployment result.

Sources:
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## Slide 15

### Slide text

First retrieval

Fetch through IPFS.
Compare against the accepted reference.

Planned check
Replacement retrieval

Disable the selected IPFS path.
Fetch through Arweave.
Check the same reference.

Planned check
A different route to the same file

### Speaker notes

Planned 12:10-13:30 (80 seconds). Timing not measured.

First we retrieve the file through IPFS and compare its bytes with the accepted reference. The planned result is a match. Then we make that selected retrieval path unavailable and use Arweave for the same file. We use the same expected reference. That would establish a replacement route for this artifact, rather than trusting a new server's assertion that it returned the right file. It would not simulate every IPFS provider disappearing. It would not establish that the RPC view is independently validated. Someone must retain a usable copy on the second carrier. During this rehearsal, reserve the full eighty seconds for these two steps. A quick explanation doesn't establish the final recording's timing.

Sources:
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## Slide 16

### Slide text

INVALID

Retrieved bytes fail the expected check.

Inject a changed local fixture.

Planned check
UNAVAILABLE

The selected source returns no usable response.

That says nothing about every other copy.

Planned check
Bad bytes and a missing response

### Speaker notes

Planned 13:30-15:00 (90 seconds). Timing not measured.

Next we deliberately change a local copy. That's an injected test, not a real network incident. The planned verifier outcome is INVALID because those bytes fail the expected check. Separately, we simulate no usable response from the selected source. That outcome is UNAVAILABLE. Missing evidence isn't evidence that the bytes are corrupt or gone everywhere. Finally we state exactly what the completed demonstration would show: recovering one artifact through another carrier and checking it against the accepted records. It would not prove every app operation survives, or that no one needs to keep the data. Before the stage version, this needs recorded outputs, an offline video and a second-machine run. For practice, use the rest of this ninety-second slot to explain the distinction without rushing.

Sources:
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## Slide 17

### Slide text

The attacker has
the right key
You accepted release A.
The controller publishes release B.
Both have valid hashes.

Can you keep using A?
What shared state can still change?

### Speaker notes

Planned 15:00-16:30 (90 seconds). Timing not measured.

Now change the threat. The attacker has a key that the system recognizes. They publish a different app or point the record at new bytes. The new bytes can have a perfectly valid hash. A content check tells us that bytes match a reference. It can't decide whether we wanted that authorized change. Keep the release or reference the user accepted, make changes visible, and give them a meaningful way to refuse. That helps only if the old release's required state and contracts still support the task. If the attacker upgrades the shared contract, keeping an old frontend doesn't restore its old rules. This is a threat illustration, separate from the file retrieval demonstration. The actual deployment needs its own authority inventory and takeover tests. Absence asks who will keep the path alive. Hostile control asks who can change the path underneath the user.

Sources:
https://docs.ens.domains/dweb/intro/
https://docs.safe.global/advanced/smart-account-modules

## Slide 18

### Slide text

One essential task in your app
Choose the task users cannot afford to lose
Trace what it needs and who controls it
Remove the team's services, credentials and help
Repeat with the team's authority in hostile hands
Record the recovery path, effort and remaining trust

### Speaker notes

Planned 16:30-17:45 (75 seconds). Timing not measured.

You don't need a new scoring system or EFS to do this. Pick one essential task in your own app. Start with the harm if someone loses it. Trace the code, data, keys, services and chain assumptions needed to finish it. Remove your team's services, accounts and help. Give a fresh person the public instructions and see whether they can finish. Then repeat with the team's authority in hostile hands. What can the user refuse, retain or move? Write down what worked, what failed, the time and resources, and the remaining trust. This can be a paragraph in your existing README or an issue. Choose the smallest improvement that protects the task, then retest it. A read-only gateway can be a reasonable convenience if replacement works. The only decryption key is a very different dependency.

## Slide 19

### Slide text

Recovery has to be usable
An export needs a working importer
Copies need people and funding
Recovery needs affordable time, fees and tools
The user has to recognize when to switch

### Speaker notes

Planned 17:45-18:30 (45 seconds). Timing not measured.

Git bundles give a familiar positive example: a self-contained bundle can carry Git objects and references into a new repository. It doesn't include every hosted platform feature. That's the right question for an app export too. Can someone reopen the work and continue the task elsewhere, with its relationships and keys? Someone still has to keep copies, run nodes and maintain tools. Two providers paid by the same account can disappear together. Decide which costs and assumptions your users can accept. Test recovery time and who can afford it. A path that only I know how to use still depends on me.

Sources:
https://git-scm.com/docs/git-bundle

## Slide 20

### Slide text

Let their work outlive yours

### Speaker notes

Planned 18:30-19:00 (30 seconds). Timing not measured.

Someone still has to do the work. The question is whether it has to be you, and whether users need your permission to carry on. Pick one thing your users should never lose because you stopped answering. Try it without your team. Then try it with your team's keys in the wrong hands. I want people to build things with EFS that outlive me. Whatever you're building, your users deserve that chance too.

## Slide 21

### Slide text

Resources and discussion
Ethereum File System: efs.eth.limo
Working Sepolia app: app.efs.eth.limo
EFS overview video: youtu.be/gZl711IriSM
Take-home exercise: one task, absence, hostile control
Sources and deployment limits are in the speaker notes

### Speaker notes

Q&A reserve. Outside the 20-minute talk.

Q&A begins here. Website: https://efs.eth.limo/
App: https://app.efs.eth.limo/
Overview video: https://youtu.be/gZl711IriSM
The source bank and full layer inventory are retained in the planning repository. This deck is a rehearsal draft, with planned demo checks rather than a fresh recorded demonstration.

Sources:
https://efs.eth.limo/
https://app.efs.eth.limo/

## Slide 22 (skipped in slideshow)

### Slide text

App and data recovery checks
Release, source, dependency versions and runtime scripts
Device, browser, local state and signing interface
Name controllers, resolver, renewal and accepted reference
Storage copies, gateways and retention funding
RPC basis, index definitions, freshness and completeness

### Speaker notes

Q&A reserve. Outside the 20-minute talk.

Reserve material. Each line needs a job, recognizable failure, improvement and cost. Retain a runnable release and test it without founder caches. Trace the name and runtime dependencies. Rebuild a meaningful index from sufficient history. An honest incomplete result is preferable to a confident partial view.

Sources:
https://www.ledger.com/blog/security-incident-report
https://docs.ens.domains/dweb/intro/
https://docs.ipfs.tech/concepts/persistence/
https://thegraph.com/docs/en/indexing/tooling/graph-node/

## Slide 23 (skipped in slideshow)

### Slide text

Authority and computation checks
Login, signer transport, recovery and decryption keys
Proxy, pause, configuration and account-module powers
Keepers, provers, relayers, bundlers and paymasters
Oracle freshness, tokens, bridges and inherited upgrades
Permission, inputs and funding for replacement operators

### Speaker notes

Q&A reserve. Outside the 20-minute talk.

Reserve material. Separate reading from signing and decryption. Follow authority beyond the visible owner list. Test replacement computation and a safe degraded mode. These are inspection questions, not claims that EFS implements every defense.

Sources:
https://docs.safe.global/advanced/smart-account-modules
https://docs.chain.link/data-feeds

## Slide 24 (skipped in slideshow)

### Slide text

Network, chain and exit checks
Internet paths, cloud accounts, peers and bootstrapping
Execution, consensus, validators, inclusion and finality
Required history and testnet lifetime
L2 data, settlement, upgrade powers and recovery routes
Usable import, continued work, shared operators and cost

### Speaker notes

Q&A reserve. Outside the 20-minute talk.

Reserve material. A node replaces a vendor, not the entire network. Forced inclusion and withdrawal need separate evaluation. Preserve interpretation and useful operations in an export. Check the user's affordable recovery time and data loss.

Sources:
https://ethereum.org/developers/docs/nodes-and-clients/
https://docs.optimism.io/op-stack/protocol/outages
https://git-scm.com/docs/git-bundle

## Slide 25 (skipped in slideshow)

### Slide text

Exploratory proposal

Retain a program and versioned execution rules while proving tools evolve.

EIP-8288 is Draft.
Application question

Can a replacement operator still perform every required computation?

Compatibility has a maintenance cost.
Immutable programs and changing tools

### Speaker notes

Q&A reserve. Outside the 20-minute talk.

Reserve Q&A. The ethresear.ch post describes the risk of an immutable privacy pool pinning a proof-system verification key permanently. It proposes identifying a program and versioned interpretation instead. Maintained compatible provers remain necessary. This is exploratory research and a Draft EIP, not an activated feature or an EFS file-verifier dependency. In the main talk, keep only the operator and compatibility question.

Sources:
https://ethresear.ch/t/exposing-an-isa-for-post-quantum-proofs-on-ethereum/26136
https://eips.ethereum.org/EIPS/eip-8288

## Slide 26 (skipped in slideshow)

### Slide text

What the EFS demonstration establishes
One accepted reference and one artifact
Alternate carrier retrieval, mismatch and unavailable-path checks
Separate authority analysis for authorized malicious changes
Still to verify: fresh outputs, deployed powers and cold recovery
Reading one file does not establish every write or discovery path

### Speaker notes

Q&A reserve. Outside the 20-minute talk.

Reserve Q&A. Exact source commit: e86e6e77fcb5cda31374e07c5f582b502455ba80. Proof artifact: efs-sepolia-deployment-reference-v0.tar.gz. Expected SHA-256: 9c5bbda410deea8714a37b5ab82d3e22982cee79d1d1320cd43a91d562f34d39. This draft uses the documented historical fixture. Source inspection is not a fresh run. Needed before delivery: retained runtime/dependency versions, chain and block basis, inputs, outputs, remaining operators, video, failure fixtures and second-machine reproduction. Immutability is a design goal. Inspect the exact deployed authority graph before making a deployment claim.

Sources:
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## Slide 27 (skipped in slideshow)

### Slide text

Questions worth practicing
What survives if an RPC, gateway or sequencer disappears?
What can a compromised controller still change?
How does a newcomer find the accepted reference?
What did the demonstration actually prove?
What should a small team improve first?

### Speaker notes

Q&A reserve. Outside the 20-minute talk.

Answer with the task and observed scope. Name the remaining dependency and the next test that would establish the claim. For a small team, prioritize the dependency whose failure hurts users most, then make its replacement path usable. Fixed code trades in-place repair for stable rules. Never equate a valid signature with a desirable update or a retrievable file with a complete exit.
