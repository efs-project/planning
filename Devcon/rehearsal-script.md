# Rehearsal script

## Current script, October 20

The current speaking draft is
[[Devcon/presentation/2026-10-20-integrated-spine/slides-and-notes|the latest deck's native slide text and speaker notes]].
It has 18 main slides and one resource/Q&A page. Nineteen minutes are planned,
but this revision has not been rehearsed. The notes contain spoken narration
followed by clearly separated reference notes and public sources. Slides 13
and 14 have shorter alternatives to use instead of their main narration.
The main route is 2,089 words, or 1,825 with both alternatives.
The verification sequence is explanatory, not a
fresh runtime result. There is no live demo or animation in this draft.

The opening follows a person keeping their work, then connects dependable
capabilities to CROPS and hyperstructures. The title's two walk-away scenarios
guide all three technical chapters. Pocket sits beside retention, and Teia
supplies a positive continuity story. The closing returns to what the person,
the next builder and a community can gain.

James's 17-minute first read applies to the earlier version preserved below.
For today's practice, speak through slides 1-18 without stopping to edit.
Do not read both versions, reference notes or sources aloud. Report the time,
the least clear section and wording that does not sound like James.

## October 12 script, preserved for comparison

Prepared October 12, 2026. This is the speaking draft for the native Google Slides rehearsal copy built from Devcon's supplied template. The organizer's original deck has not been changed. Find the working copy in this Codex task or Google Drive by its title, `Who Can Turn Off Your Ethereum App? | Devcon rehearsal draft`; private presentation links stay outside Git.

Draft for 20 minutes plus five minutes Q&A. Twenty main slides carry 19 minutes of planned material and one minute margin. Timing has not been measured. Demo slides are a narrated walkthrough, not a fresh run. Keep the full 3:30 demo allocation. Seven appendix slides support Q&A.

## 1. Who Can Turn Off Your Ethereum App?

Planned 0:00-0:15

I'm James Carnley. I build Ethereum File System. I want the things people build with my software to have a future that doesn't depend on me being there. This is a talk about what it takes to make that possible.

## 2. The archive is still theirs

Planned 0:15-0:50

Imagine a community building an archive over years. Someone returns because they need a file they put there. The person who built the app has died, burned out, or stopped answering. This is an imagined user, not an EFS customer story. The work still matters to them. If I disappear, I don't want their work to disappear with me. Now imagine I'm still here, but somebody else has my keys. What happens to their work then?

## 3. Absence and hostile control

Planned 0:50-1:15

Those are the two tests we'll keep using. Absence asks whether someone can continue without us. Hostile control asks whether they can refuse someone acting as us. Redundancy helps with an outage. It can still leave one person able to redirect every alternative. We'll follow one task through the stack and ask both questions.

## 4. Ethereum File System

Planned 1:15-2:30

I built Ethereum File System because I want public infrastructure where the maintainer is optional. EFS gives files shared paths and onchain records describing their provenance and references. The bytes can live on different storage networks. A file reference connects what you want with what you retrieve. That separation gives us a useful task to follow: find one file, retrieve it, and check it against an accepted public reference. The public web client uses ENS and IPFS. The example for this talk uses Sepolia. My design goal is stable rules and users who can carry on without me. We'll inspect the actual powers and dependencies of any deployment we demonstrate. Onchain records help preserve shared facts, while storage still needs people retaining the bytes. This is also a way to think about your app, even if it never uses EFS.

Sources: https://efs.eth.limo/
https://app.efs.eth.limo/
https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## 5. The interface and the protocol

Planned 2:30-3:15

Uniswap gives us a familiar example. Labs explicitly distinguishes its interfaces from the protocol and describes restrictions it applies through those interfaces. That shows why a contract staying available and a user's normal workflow staying available are different achievements. This is a comparison of layers, not a judgment about the team or every related contract. For our archive user, the question is whether another entrance actually lets them finish the same task. A different URL is only useful if it reaches the right rules and data safely.

Sources: https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy

## 6. The code the user actually runs

Planned 3:15-4:15

Our user needs to open the app they trusted. That means retaining the runnable release, as well as source, dependency versions and build instructions. Try it on a fresh device, without the founder's caches. Check the browser and operating system assumptions too. In the December 2023 Ledger Connect Kit incident, compromised package distribution supplied malicious code to integrating apps at runtime. Those apps' own repositories did not need to change. Your release boundary includes code loaded later. Retaining reviewed dependencies and making updates deliberate reduces that moving target. It also leaves you responsible for security updates and compatibility. Running an old release and rebuilding it from source are different checks. Neither proves the code is safe on a compromised device.

Sources: https://www.ledger.com/blog/security-incident-report

## 7. A familiar name can change

Planned 4:15-5:15

The public EFS client uses ENS and IPFS. ENS helps someone find content, and the familiar eth.limo address lets a conventional browser reach it through a gateway. There are still servers in that access path, even without my own web server. Inspect the name's controller, resolver and renewal requirements. A mutable name is convenient because it can point to a new release. That same authority can redirect users. Keep an accepted release reference and test a route that doesn't depend on the original gateway. Then ask how a newcomer discovers which reference to trust after the name changes. Pinning bytes helps preserve an app. It doesn't automatically preserve discovery, security updates or the behavior of its contracts.

Sources: https://docs.ens.domains/dweb/intro/
https://app.efs.eth.limo/

## 8. Finding and checking the records

Planned 5:15-6:15

Next, the archive user needs to find the records and reach the bytes. Two gateways can serve the same retained copy. If that copy is gone, changing gateways won't create another one. IPFS addressing and retention solve different parts of the problem. An RPC supplies state, while an index helps discover it. Graph Node is a useful outside example: rebuilding an index needs definitions, storage and suitable chain history, sometimes archive or trace capabilities. Open code alone isn't the recovery plan. Test a query on a replacement setup. Record its chain basis and check freshness and completeness for the task. Comparing providers can expose a discrepancy, but agreement isn't independent validation. Rebuilding has real costs in storage, bandwidth and time.

Sources: https://docs.ipfs.tech/concepts/persistence/
https://thegraph.com/docs/en/indexing/tooling/graph-node/

## 9. Recovery needs the right keys

Planned 6:15-7:15

For our public file, reading can be much easier than publishing a new record. A private archive adds another requirement: the authorized user must still have a way to decrypt it. Available ciphertext can become useless when the only key service or device disappears. A wallet, login service, guardian or recovery module can also stop someone from acting. Test device and provider loss separately from file retrieval. Recovery helps availability, but extra recovery parties can gain takeover power or access to private data. Keep the recovery material appropriate to the user and rehearse with test accounts, never real funds. EFS file references don't by themselves solve private-key recovery. Success at reading one public file tells us nothing about every write path.

Sources: https://docs.safe.global/advanced/smart-account-modules

## 10. Who can change the rules?

Planned 7:15-8:20

Now inspect authority. Start with the actual deployed contracts, not the label in a README. Follow proxies, implementation addresses, pause roles, configuration powers and dependencies. Include the account that calls them. Safe modules illustrate why a multisig threshold is only part of the permission model: enabled modules can execute through their own logic. That can support recovery and automation, and also introduce another path to control. Limiting powers makes the promise clearer. Immutability can give users stable rules after I leave, but it also means I can't repair a bug in place. Make any migration or upgrade consent explicit. An old frontend can't undo a change to shared contract behavior. The useful question is what a user can preserve or refuse.

Sources: https://docs.safe.global/advanced/smart-account-modules

## 11. Work that happens offchain

Planned 8:20-9:00

A healthy chain doesn't guarantee the rest of the work happens. A keeper, prover, relayer or paymaster may be essential. Can another operator get the inputs, do the work and submit it? Does the user have funds when a subsidy ends? Inputs need suitable freshness too. Chainlink documents timestamp checks for feeds. A successful call can return an input that's too old for the operation. Define a safe degraded mode. Sometimes keeping reads available and pausing sensitive writes protects users better than switching to an unreviewed fallback.

Sources: https://docs.chain.link/data-feeds

## 12. The network underneath the app

Planned 9:00-10:20

The EFS task ultimately inherits the network and blockchain underneath its records. An execution client checks computation. A consensus client helps follow the accepted chain. Peers and validators still have to exist, and a transaction still needs inclusion and finality. Running a node can replace an RPC vendor. It still needs connectivity, resources and a functioning network. Check the history your recovery task needs. A testnet example also depends on the testnet's lifetime. Internet routing, cloud accounts and bootstrapping can make apparently separate paths fail together. Trace the operator and the funding, not just the URLs. For apps that require proofs, the recent ISA discussion adds a long-term question: can another operator still perform the computation when tooling changes? That's exploratory research, not an activated Ethereum feature or an EFS mechanism. More decentralization changes the dependency choices. It doesn't remove physics, upkeep or every network assumption.

Sources: https://ethereum.org/developers/docs/nodes-and-clients/
https://ethresear.ch/t/exposing-an-isa-for-post-quantum-proofs-on-ethereum/26136
https://eips.ethereum.org/EIPS/eip-8288

## 13. An L2 recovery path has conditions

Planned 10:20-11:30

If your app is on an L2, keep following the dependencies. Ask about its sequencer, available data, settlement, bridge and upgrade powers. OP Stack documents a way to submit through L1 when its sequencer is unavailable. That is a useful recovery mechanism. It also has conditions, including timing and account behavior. Test the chosen chain's actual route with the account your user has. Retain the inputs and enough funds for L1 fees. Forced inclusion and withdrawing an asset are separate questions. Other L2s can have different mechanisms. The point is to turn 'there is an escape hatch' into a task an ordinary user can actually finish. A mechanism that needs a specialist, a missing index or an unaffordable fee may not meet your recovery goal.

Sources: https://docs.optimism.io/op-stack/protocol/outages

## 14. One file and an accepted reference

Planned 11:30-12:10

This is the planned demonstration sequence. I haven't rerun and recorded it for this talk yet. We start with one known file and an accepted public reference. The expected value must come from something we already trust, rather than just the endpoint serving the file. We identify the chain basis, records and remaining RPC and gateway inputs. The archived proof package contains the original fixture and verifier. For this rehearsal, I'm describing the checks, not showing a fresh deployment result.

Sources: https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## 15. A different route to the same file

Planned 12:10-13:30

First we retrieve the file through IPFS and compare its bytes with the accepted reference. The planned result is a match. Then we make that selected retrieval path unavailable and use Arweave for the same file. We use the same expected reference. That would establish a replacement route for this artifact, rather than trusting a new server's assertion that it returned the right file. It would not simulate every IPFS provider disappearing. It would not establish that the RPC view is independently validated. Someone must retain a usable copy on the second carrier. During this rehearsal, reserve the full eighty seconds for these two steps. A quick explanation doesn't establish the final recording's timing.

Sources: https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## 16. Bad bytes and a missing response

Planned 13:30-15:00

Next we deliberately change a local copy. That's an injected test, not a real network incident. The planned verifier outcome is INVALID because those bytes fail the expected check. Separately, we simulate no usable response from the selected source. That outcome is UNAVAILABLE. Missing evidence isn't evidence that the bytes are corrupt or gone everywhere. Finally we state exactly what the completed demonstration would show: recovering one artifact through another carrier and checking it against the accepted records. It would not prove every app operation survives, or that no one needs to keep the data. Before the stage version, this needs recorded outputs, an offline video and a second-machine run. For practice, use the rest of this ninety-second slot to explain the distinction without rushing.

Sources: https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## 17. The attacker has the right key

Planned 15:00-16:30

Now change the threat. The attacker has a key that the system recognizes. They publish a different app or point the record at new bytes. The new bytes can have a perfectly valid hash. A content check tells us that bytes match a reference. It can't decide whether we wanted that authorized change. Keep the release or reference the user accepted, make changes visible, and give them a meaningful way to refuse. That helps only if the old release's required state and contracts still support the task. If the attacker upgrades the shared contract, keeping an old frontend doesn't restore its old rules. This is a threat illustration, separate from the file retrieval demonstration. The actual deployment needs its own authority inventory and takeover tests. Absence asks who will keep the path alive. Hostile control asks who can change the path underneath the user.

Sources: https://docs.ens.domains/dweb/intro/
https://docs.safe.global/advanced/smart-account-modules

## 18. One essential task in your app

Planned 16:30-17:45

You don't need a new scoring system or EFS to do this. Pick one essential task in your own app. Start with the harm if someone loses it. Trace the code, data, keys, services and chain assumptions needed to finish it. Remove your team's services, accounts and help. Give a fresh person the public instructions and see whether they can finish. Then repeat with the team's authority in hostile hands. What can the user refuse, retain or move? Write down what worked, what failed, the time and resources, and the remaining trust. This can be a paragraph in your existing README or an issue. Choose the smallest improvement that protects the task, then retest it. A read-only gateway can be a reasonable convenience if replacement works. The only decryption key is a very different dependency.

## 19. Recovery has to be usable

Planned 17:45-18:30

Git bundles give a familiar positive example: a self-contained bundle can carry Git objects and references into a new repository. It doesn't include every hosted platform feature. That's the right question for an app export too. Can someone reopen the work and continue the task elsewhere, with its relationships and keys? Someone still has to keep copies, run nodes and maintain tools. Two providers paid by the same account can disappear together. Decide which costs and assumptions your users can accept. Test recovery time and who can afford it. A path that only I know how to use still depends on me.

Sources: https://git-scm.com/docs/git-bundle

## 20. Let their work outlive yours

Planned 18:30-19:00

Someone still has to do the work. The question is whether it has to be you, and whether users need your permission to carry on. Pick one thing your users should never lose because you stopped answering. Try it without your team. Then try it with your team's keys in the wrong hands. I want people to build things with EFS that outlive me. Whatever you're building, your users deserve that chance too.

## 21. Resources and discussion

Q&A reserve

Q&A begins here. Website: https://efs.eth.limo/
App: https://app.efs.eth.limo/
Overview video: https://youtu.be/gZl711IriSM
The source bank and full layer inventory are retained in the planning repository. This deck is a rehearsal draft, with planned demo checks rather than a fresh recorded demonstration.

Sources: https://efs.eth.limo/
https://app.efs.eth.limo/

## 22. App and data recovery checks

Q&A reserve

Reserve material. Each line needs a job, recognizable failure, improvement and cost. Retain a runnable release and test it without founder caches. Trace the name and runtime dependencies. Rebuild a meaningful index from sufficient history. An honest incomplete result is preferable to a confident partial view.

Sources: https://www.ledger.com/blog/security-incident-report
https://docs.ens.domains/dweb/intro/
https://docs.ipfs.tech/concepts/persistence/
https://thegraph.com/docs/en/indexing/tooling/graph-node/

## 23. Authority and computation checks

Q&A reserve

Reserve material. Separate reading from signing and decryption. Follow authority beyond the visible owner list. Test replacement computation and a safe degraded mode. These are inspection questions, not claims that EFS implements every defense.

Sources: https://docs.safe.global/advanced/smart-account-modules
https://docs.chain.link/data-feeds

## 24. Network, chain and exit checks

Q&A reserve

Reserve material. A node replaces a vendor, not the entire network. Forced inclusion and withdrawal need separate evaluation. Preserve interpretation and useful operations in an export. Check the user's affordable recovery time and data loss.

Sources: https://ethereum.org/developers/docs/nodes-and-clients/
https://docs.optimism.io/op-stack/protocol/outages
https://git-scm.com/docs/git-bundle

## 25. Immutable programs and changing tools

Q&A reserve

Reserve Q&A. The ethresear.ch post describes the risk of an immutable privacy pool pinning a proof-system verification key permanently. It proposes identifying a program and versioned interpretation instead. Maintained compatible provers remain necessary. This is exploratory research and a Draft EIP, not an activated feature or an EFS file-verifier dependency. In the main talk, keep only the operator and compatibility question.

Sources: https://ethresear.ch/t/exposing-an-isa-for-post-quantum-proofs-on-ethereum/26136
https://eips.ethereum.org/EIPS/eip-8288

## 26. What the EFS demonstration establishes

Q&A reserve

Reserve Q&A. Exact source commit: e86e6e77fcb5cda31374e07c5f582b502455ba80. Proof artifact: efs-sepolia-deployment-reference-v0.tar.gz. Expected SHA-256: 9c5bbda410deea8714a37b5ab82d3e22982cee79d1d1320cd43a91d562f34d39. This draft uses the documented historical fixture. Source inspection is not a fresh run. Needed before delivery: retained runtime/dependency versions, chain and block basis, inputs, outputs, remaining operators, video, failure fixtures and second-machine reproduction. Immutability is a design goal. Inspect the exact deployed authority graph before making a deployment claim.

Sources: https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof

## 27. Questions worth practicing

Q&A reserve

Answer with the task and observed scope. Name the remaining dependency and the next test that would establish the claim. For a small team, prioritize the dependency whose failure hurts users most, then make its replacement path usable. Fixed code trades in-place repair for stable rules. Never equate a valid signature with a desirable update or a retrievable file with a complete exit.
