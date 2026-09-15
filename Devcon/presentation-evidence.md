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

This is preparation coverage, not a slide to read aloud. Choose one concrete
question per group for the main talk and keep the rest for Q&A or linked notes.

| Layer | When the maintainer disappears | When authority is compromised | A useful check |
| --- | --- | --- | --- |
| App release and browser | Bundle, dependencies, source or build instructions may disappear; a static page can still call a private backend. | A publisher can serve a malicious new release or dependency. | Retain an exact release and its needed assets. Inspect network requests. Start from a fresh browser and test core tasks without team services. |
| Identity, wallet and local data | Hosted login, relayers, wallet services or device-local state can block otherwise public functions. | An altered frontend can request harmful signatures or hide what the user is authorizing. | Separate public reads from signed actions. Document required keys, recoverable state and an alternative usable client. Never use real funds in a hostile-client rehearsal. |
| Naming and discovery | A name may expire, its resolver may depend on another service, or the familiar URL may disappear. | A name controller or resolver authority may redirect users. | Record the actual name and parent/renewal/control setup plus an accepted release identifier. Test reaching that release without the usual name or bridge. |
| Storage and retrieval | Copies, providers, subscriptions, gateways or discovery paths can disappear. | A source can substitute bytes, withhold a version or advertise a different reference. | Retrieve against a known reference from distinct carriers; check retained copies and their operators. Separately exercise mismatch and timeout. A pin is not an eternal hosting budget. |
| RPC and indexing | One provider may be the only way to read records, find history or build a transaction. | A service can omit records, return stale state or present a misleading history. | Test a replaceable RPC and rebuildable indexing path. Record the chain basis and completeness limitations. Comparing providers is not the same as locally validating the chain. |
| Internet and peer access | DNS/TLS bridges, hosting accounts, routing, ISPs or peer discovery may fail together. | A shared operator or network boundary can filter several apparent alternatives. | Identify common operators and accounts. Test another route and a fresh setup. Do not promise global censorship resistance from a second URL. |
| Contracts and external services | A required keeper, oracle, subsidy or privileged transaction may stop. | Upgrade, pause, configuration or external dependency control may change the rules. | Inspect all effective authorities for the exact contracts. Check which operations remain possible, not only whether code exists. Plan opt-in migration when fixed code needs a fix. |
| Blockchain and consensus | Users still need a live network, peers, retained required data and resources to transact. | Consensus/client failures, censorship or concentrated control can affect the base everyone relies on. | Explain execution versus consensus, finality and inclusion. Identify client/operator dependence and data retention needs. An RPC replacement does not replace consensus or guarantee affordable writes. |
| L2 and settlement, if applicable | Sequencer, proposer, data availability or bridge outages may interrupt the app. | Upgrade/security-council powers or changed bridge rules can affect recovery. | Use the exact chain's documented forced-inclusion and withdrawal procedures, delays and required data. Do not assume an L1 contract means a practical exit exists. |

For EFS's default `.eth.limo` route, separate "no project-owned web server"
from "no servers or gateways anywhere." A conventional browser still crosses
a gateway. A replacement path is something to demonstrate, not a property
conferred by the suffix.

The target is not zero dependencies. It is users being able to understand,
replace or reject critical dependencies without the original team's permission.
Also decide what should not be permanent: private personal data, secrets and
disposable state do not belong in immutable public storage by default.

## The one outside example

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

ENS and IPFS remain mechanisms inside the EFS story, not additional case-study
tours. A familiar app comparison plus one running EFS example is enough for
20 minutes.

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
