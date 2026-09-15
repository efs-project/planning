# Devcon presentation evidence and demonstration notes

Prepared 2026-09-14 for [[presentation-spine]]. These are private working
notes. A source inspection is not a fresh demonstration run. Public slides
should describe the actual deployment shown without EFS version labels.

## Evidence status

| Candidate claim or demonstration | Evidence available | What remains before using it on stage |
| --- | --- | --- |
| EFS publishes paths, provenance and mirror records on Sepolia | Accepted [[application-draft]] and the fixed-commit proof package below contain the publication records and transaction references. | Re-read the exact records at a recorded chain basis; retain the output and transaction references with the talk assets. |
| The public EFS web client uses ENS and IPFS | Submitted application records this architecture; the public app URL is https://app.efs.eth.limo/. | Resolve the current name and release, save the bundle reference, inspect runtime requests and exercise an alternative access path. This drafting session did not retest the live client. |
| The same artifact can be retrieved through IPFS and Arweave and verified | The archived proof README names the two carriers, manifest, receipts, verifier checks and expected outcomes. Its source was inspected on 2026-09-14. | Reproduce retrieval and verification from a clean environment using the fixed source. Save a dated recording and outputs. Do not describe source inspection as a successful rerun. |
| Invalid content differs from retrieval failure | Archived verifier documents VERIFIED, INVALID and UNAVAILABLE. Application notes record prior positive and negative test results. | Reproduce deliberate bad-byte and unavailable-source cases. Check which failures each result actually covers. Unavailability is not proof that data is gone everywhere. |
| Users can recover without the EFS web client | The archived verifier is separate from the client. It requires Node.js, an RPC endpoint and an IPFS or Arweave gateway. | Have another person run the retained instructions without James's accounts. State the remaining RPC and gateway dependencies; do not call this independent chain verification unless that is separately demonstrated. |
| Users can reject a hostile authorized change | This is a threat analysis and design requirement in the story, not established by the artifact hash test. | Inventory actual authorities. Test the retained release/reference path if presenting it as an implemented EFS capability. A compromised record can point at new, internally consistent bytes. |
| EFS contracts cannot be changed by a maintainer | Immutability is James's intended direction. The historical Sepolia system and current redesign are not interchangeable evidence. | Inspect the exact deployed contracts, proxies, implementation addresses, configuration powers and dependencies used for the talk. Do not infer immutability from a goal or one burned key. |
| A newer EFS implementation could provide a clearer file journey | [[Reviews/2026-09-12-efs-path-decision/compact-prototype-results-20260914]] contains local prototype evidence. | Candidate only. It is not a public deployment or a commitment to ship by Devcon. Substitute it only after it demonstrates the same learning goals reliably. |

### Fixed historical proof

The source inspected is the [walk-away proof package at commit e86e6e7](https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof).
The commit is available in the local contracts Git history even though the
package is not present in the current contracts working tree.

- Artifact: `efs-sepolia-deployment-reference-v0.tar.gz`.
- Expected SHA-256:
  `9c5bbda410deea8714a37b5ab82d3e22982cee79d1d1320cd43a91d562f34d39`.
- The package retains `proof/manifest.json`, `proof/proof.json`, verifier source
  and reproducibility instructions. The README describes signed-manifest,
  attestation, receipt and retrieved-byte checks.
- This is an existing public proof fixture, not a claim that the whole app
  passes a walk-away test. The expected digest and authority must come from
  the retained trusted reference, not just the same endpoint serving the file.
- Recover and run it in an isolated environment. Do not rewind the current
  contracts checkout or disturb active EFS implementation work to rehearse.

Keep these exact identifiers in the evidence notes. A person in the audience
needs to understand what was checked, not hear an archive size or a long hash.

## Full-stack inspection list

Expanded after James's **2026-09-14** direction: teach what each layer does,
how a developer can recognize failure, and ways to improve it with explicit
tradeoffs. These are design questions, not claims that EFS implements every
defense. The inventory covers the major dependency families relevant to the
talk, not every possible app architecture.

For the spoken story, group the checks around reaching the trusted app,
recovering and checking the user's work, and continuing under acceptable
rules. Keep the detailed inventory in accompanying notes. At each group,
draw from [[presentation-examples]] when an outside project makes the choice
clearer than another explanation of EFS.

| Layer | Its job and failure to recognize | Check and improvement path | Cost or remaining limit |
| --- | --- | --- | --- |
| Source, build and release supply chain | Produces the code users run. Source hosts, registries, CI or runtime-loaded libraries can disappear or publish a harmful change. | Retain the runnable release, source, licenses, dependency versions and build instructions. Test running it without the publisher. Separately test rebuilding it. Ledger Connect Kit illustrates runtime update authority. | Retention and deliberate updates take effort. Reproducible output helps compare source and binaries, but does not establish that the code is safe. A version label without verified bytes is weaker evidence. |
| Browser, operating system and device | Runs the app and holds local state. Extension stores, browser APIs, device failure, remote scripts or a compromised client can break or misrepresent the task. | Try a fresh device without founder caches. Inspect runtime requests and signing prompts. Retain needed assets and export local state. Exercise a usable alternative client or supported environment. | Maintaining compatibility and secure execution costs work. An immutable app bundle does not secure a compromised operating system or preserve every device API. |
| Naming, entry points and discovery | Helps users find the app and the accepted reference. Domains, DNS/TLS bridges, ENS renewal, parent control or resolver changes can remove or redirect the entry point. | Inspect actual controllers and resolver dependencies. Retain an accepted release identifier and test an alternate route. Provide a way for newcomers to recognize the intended reference. | Stable references lose automatic updates. Mutable names ease discovery but carry change authority. Knowing a CID is different from discovering which CID to trust. |
| Login, signing and account recovery | Establishes who can act. Hosted authentication, wallet transport or unavailable signers may stop access. Modules or recovery parties may have powers beyond the apparent owner threshold. | Separate read access, login, signing and recovery. Inventory every authority and rehearse device/provider loss using test accounts. Safe provides a concrete configurable-authority example. | Recovery improves availability while adding potential takeover paths. Alternative clients need the right account capabilities, not just a different URL. Never rehearse with real funds. |
| Encryption and private state | Makes retained bytes readable only to intended users. Available ciphertext can become useless if a device or key service is lost. A recovery service may also expose plaintext. | Test authorized decryption recovery separately from file retrieval. Preserve appropriate user-controlled recovery material and document any external key-service or guardian dependence. | Recoverability and confidentiality can pull in different directions. Permanent public storage is often inappropriate for private data. No EFS encryption or key-recovery implementation is implied here. |
| Storage and retrieval | Retains and returns bytes. Copies, gateways, provider discovery or paid retention can disappear. A source can substitute or withhold a version. | Retrieve against a known reference from independently operated carriers. Confirm that someone retains the bytes, not merely that two gateways exist. Test mismatch and timeout separately. | Replication needs resources and ongoing retention. Content addressing detects mismatches but cannot make a missing copy appear. Privacy and accessibility still need separate decisions. |
| RPC, indexing and verification | Supplies state and makes records discoverable. A valid response can be stale or incomplete. An index may require history that a replacement RPC cannot provide. | Pin the chain basis, retain index definitions and required inputs, and rebuild an important query. Compare with appropriate canonical evidence. Check intended state after writes, not just transaction inclusion. Graph Node makes rebuild requirements concrete. | Full validation or reconstruction costs time, storage and bandwidth. Provider agreement is weaker than independent validation. One recovered file does not prove complete discovery of the user's work. |
| Offchain computation and transaction delivery | Backends, workers, keepers, provers, relayers, bundlers or paymasters may do essential work before a contract can act. An operator or subsidy can stop while the chain stays healthy. | Disable the essential service in a test setup. Check whether another operator can obtain inputs, reproduce the work and submit it. Publish sufficient instructions and allow replacement where the design permits. Define safe degraded operation. | Replacement needs usable permissions, funds and compute. Permissionless execution may need spam controls. An ordinary transaction may not substitute for every smart-account or proving flow. |
| Internet, hosting and peer access | Connects users to services and chain peers. DNS, routing, ISPs, bootstrapping, a cloud account or physical infrastructure can fail across several apparent alternatives. | Trace shared operators and infrastructure. Exercise another route and peer/bootstrap path from a cold setup. Test loss of the controlling account or facility, not only one process. | Redundant paths increase cost and coordination. No browser app can guarantee connectivity under every network restriction or power failure. Cloudflare's historical incident illustrates hidden shared dependencies. |
| Contracts, permissions and upgrades | Enforces app rules. Pause/configuration roles or upgrades can block or change behavior. Immutable code may also contain a permanent bug. | Inspect the exact deployed authority graph, including proxies and external settings. Bound privileges where possible. Make upgrade consent or migration explicit, and test what the user can retain or refuse. | Multisigs and delays can limit some risks while retaining authority and response costs. Fixed code trades in-place repair for stable rules. An old frontend cannot reverse a shared-contract upgrade. |
| External protocols and data inputs | Tokens, bridges, oracle feeds and other contracts supply behavior the app inherits. Their pause controls, upgrades or stale inputs can break an otherwise unchanged app. | Follow dependencies beyond your own contracts. Inspect freshness and configuration. Define acceptable degraded behavior and test migration with relationships and meaning intact. Chainlink's feed checks illustrate this responsibility. | Pinning an input may lose fixes. Switching an oracle, token or bridge may change semantics or trust. Stopping sensitive writes can be safer than using an unreviewed fallback. |
| Base chain and consensus | Execution clients validate computation and consensus establishes accepted history. Peers, validators, finality, inclusion and needed history remain dependencies. | Test node/RPC replacement and transaction submission separately. State finality, history and client/operator assumptions. Consider network lifecycle and migration, especially when demonstrating on a testnet. | Running a node reduces RPC-vendor reliance but still needs peers, resources and a functioning network. It does not guarantee prompt inclusion or affordable transactions. |
| L2 execution, data availability and settlement | Sequencers and other actors connect execution to settlement. Data withholding, proposer/prover outages, upgrade powers or bridge conditions can obstruct recovery. | Inspect the chosen chain's actual architecture. Distinguish forced inclusion from withdrawal and retain required data. Test the documented route with the user's account type. OP Stack provides one specific example. | Recovery may require L1 fees, delays and specialized inputs. Proofs require available data and applicable verification rules. One chain's recovery procedure is not a guarantee for every L2. |
| Portability and continued use | Lets users or another maintainer reopen and continue work elsewhere. An export may omit relationships, history, keys, attachments or essential services. | On a fresh machine, import the export and complete the original task. Preserve formats, interpretation, runnable tools and public instructions. Git bundles show a concrete offline transfer with explicit boundaries. | A usable exit costs design and maintenance effort. Bytes alone do not reproduce an application, hosted collaboration features or its community. The intended user must be able to afford and understand recovery. |

### Questions that cross every layer

Who controls and pays for the alternatives? Trace accounts, credentials,
renewals, storage bills, transaction fees and operator incentives. Several
services sponsored by the same person can disappear together. A replacement
operator needs both permission and a reason to keep doing the work.

Can users tell when to switch? Show stale state, incomplete discovery and
service failure clearly. A recovery plan that needs a broken dashboard, a
hidden founder hint or an unavailable index is not ready. Separate continued
operation from the ability to reconfigure and repair the system.

What is the app trying to protect? Record the acceptable data loss, recovery
time and user effort for the chosen task. A replaceable gateway can be a
reasonable convenience. Loss of the only decryption key or authority to
withdraw has different consequences. Defend, accept explicitly, or investigate
each material risk based on user harm rather than a project score.

For EFS's default `.eth.limo` route, separate "no project-owned web server"
from "no servers or gateways anywhere." A conventional browser still crosses
a gateway. A replacement path is something to demonstrate, not a property
conferred by the suffix.

The target is not zero dependencies. It is users being able to understand,
replace or reject critical dependencies without the original team's permission.
Also decide what should not be permanent: private personal data, secrets and
disposable state do not belong in immutable public storage by default.

## Outside examples throughout the story

[[presentation-examples]] is the source bank for selecting comparisons at each
layer. James explicitly asked for multiple non-EFS viewpoints where useful.
Keep this goal in future drafts and rehearsals. The following Uniswap example
remains a useful opening comparison, not the only permitted outside example.

Use **Uniswap's protocol versus its interface**, for about 45 seconds. Its
[published interface policy](https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy)
explicitly distinguishes Labs' interfaces from the protocol and describes
restrictions applied through those interfaces. Checked 2026-09-14.

Suggested explanation: "You may already know this distinction from Uniswap.
The website you normally use and the protocol it talks to are different
layers. A restriction at the interface doesn't establish that the protocol
has stopped. But an ordinary user's path to it can still break. Now ask that
question about every layer of your own app."

Do not claim a particular historical outage, perform a trade, discuss avoiding
legal restrictions, or generalize about every token, hook or associated
contract. This is a sourced architecture comparison, not an endorsement or a
verdict on the entire system's durability.

ENS and IPFS remain mechanisms inside the EFS story and can also anchor a
general design lesson. Add other projects when they explain a distinct
failure or improvement. Short sourced comparisons replace generic exposition
within the existing time blocks. The full source bank need not all be spoken.

## Bounded demonstration runbook

Budget: 3 minutes 30 seconds. Prepare as a short recording first; decide later
whether a live run adds enough value to justify the risk. Never require a new
transaction, a faucet, a project login or stage Wi-Fi to finish the talk.

1. **Establish the reference, 40 seconds.** Show one file's identity and the
   public records used to check it. State which reference and authority were
   accepted in advance. Show the verifier's remaining infrastructure inputs.
2. **Retrieve, 35 seconds.** Fetch through IPFS and show the bytes matching
   that reference. Say what VERIFIED means in this run.
3. **Change the path, 45 seconds.** Simulate the selected IPFS retrieval path
   being unavailable. Fetch the same file through Arweave and verify it
   against the same expected reference. Do not claim this simulates all IPFS
   providers disappearing.
4. **Reject changed bytes, 35 seconds.** Supply a deliberately corrupted local
   fixture and show the mismatch. Mark it as an injected test, not a real
   network incident.
5. **Report missing evidence honestly, 30 seconds.** Simulate no response from
   the selected source. Explain why that result says unavailable from this
   path, not invalid and not nonexistent everywhere.
6. **State the result, 25 seconds.** "We recovered this file and checked it
   using a different carrier. We have not proved that every app operation
   survives, or that nobody needs to retain the data."

The later hostile-key beat uses a separate diagram: accepted release A,
compromised authority publishes release B, both have valid hashes. Retaining
A helps only if its required state and contracts still allow the task.
If an upgrade changes shared contract behavior, an old frontend alone cannot
undo it. Do not turn this diagram into a claim of a completed EFS takeover test.

Save the exact source commit, runtime/dependency versions, chain and block
basis, input references, operator assumptions, outputs, video and failure
fixtures together. Test the retained instructions on a second machine. The
fallback is a locally stored video plus screenshots and readable results,
clearly identified as a recording, not a live network response.

## Primary sources for notes and later slide citations

- [Uniswap Labs interface policy](https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy): the specific outside comparison above.
- [ENS decentralized website introduction](https://docs.ens.domains/dweb/intro/): naming through resolver contenthash, separate hosting, and gateway access. Check the chosen name's actual resolver; do not generalize the documented default to every name.
- [IPFS persistence](https://docs.ipfs.tech/concepts/persistence/): retention and pinning responsibilities, separate from addressing.
- [IPFS gateways](https://docs.ipfs.tech/concepts/ipfs-gateway/): access routes and verification models. Candidate reference for the eventual browser demonstration.
- [Ethereum nodes and clients](https://ethereum.org/developers/docs/nodes-and-clients/): execution and consensus clients and the role of one's own node.
- [Ethereum client diversity](https://ethereum.org/developers/docs/nodes-and-clients/client-diversity/): correlated client-failure risk. Avoid volatile market-share percentages.
- [OP Stack outage handling](https://docs.optimism.io/op-stack/protocol/outages): a chain-family-specific illustration of sequencer outage handling, not evidence that all L2s share an exit mechanism. If used on a slide, recheck the selected chain's current configuration and distinguish inclusion from withdrawal.
- [EFS proof source](https://github.com/efs-project/contracts/tree/e86e6e77fcb5cda31374e07c5f582b502455ba80/packages/walk-away-proof): fixed historical fixture described above.

Research references were reviewed for the 2026-09-14 draft. Deployment and
demo checks remain open as listed above. Refresh any chain-specific claim
before the slide freeze.
