# The application stack and its walk-away checks

Working teaching model, October 13, 2026. Prepared after James's first
17-minute read-through. This formalizes the dependencies for the next talk
draft; it does not declare a universal networking standard or an EFS design.
The current implemented story and timing are in [[presentation-spine]].

The October 20 integrated deck teaches these eight jobs through a person
keeping their work. Each receives its function, recognizable failure, specific
example, improvement/check and cost or remaining assumption. Shared operators
and usable continuation are closing checks across the jobs, not layers nine
and ten. A public EFS file read does not exercise every signing, worker or L2
path, so the narration explicitly uses other tasks for those comparisons.
Current example boundaries and reserves are in [[example-audit-2026-10-20]].

## What we are testing

Choose one essential user task. A walk-away test asks whether a user or
independent operator can continue or recover that task without the original
team's permission, accounts or personal help, under stated conditions and
within a usable time and cost.

Run two scenarios:

1. The team and its services disappear.
2. Someone hostile controls the powers that team used to hold.

For the second case, inspect what the user can refuse, preserve or move. A
safe pause can protect assets while still failing the goal of continued use.
Describe the actual outcome rather than awarding a single pass to the app.

## Eight functional layers

These layers describe jobs the app must keep doing. They form a dependency
graph: code needs storage, an indexer needs compute, and a recovery path may
need keys and chain history. The slide can show a simple stack while the
notes retain those connections.

| Layer and job | Components and visible failure | Check and improvement | Example to explain it | Cost and remaining assumptions |
| --- | --- | --- | --- | --- |
| **1. Naming and access:** find and reach an accepted app or reference | DNS, ENS, registrars, resolvers, discovery, TLS, gateways and network routes. The normal address disappears or redirects. | Start from retained public instructions without the team's domain or usual gateway. Keep an accepted release/reference and a discoverable alternative route. Inspect name control and renewal. | ENS/IPFS and EFS's conventional gateway entrance. Uniswap's interface/protocol distinction shows why the usual entrance is a separate dependency. | Names can remain mutable. An alternative must be discoverable and reachable, and a newcomer still needs a basis for trusting it. |
| **2. Software and execution environment:** obtain and run the intended code | Web hosting, app bundles, IPFS distribution, source, build tools, package registries, CI, runtime imports, releases and updates; browser, OS, extensions and device. A retained source repo may not build, or loaded code may change outside the app's release. | Retain runnable builds and the source/build inputs. Test running and rebuilding separately on a fresh setup. Inspect every runtime fetch and make update acceptance explicit. | Ledger Connect Kit's 2023 distribution compromise. Git bundles are a limited positive example of retaining development history. | Compatibility and security fixes need ongoing work. Reproducible bytes can still contain bugs; a compromised device can misrepresent them. |
| **3. Identity, authority and key recovery:** let the intended person read, decrypt and act | Login providers, wallets, signing transport, account modules, recovery parties, local secrets and decryption services. The bytes survive but the owner cannot use them. | Test device and provider loss with test accounts. Separate public reads, private decryption and signing. Preserve a recovery path with explicit powers and appropriate user control. | Safe's configurable modules and recovery authority. A private archive illustrates why a file backup is insufficient without keys. | Recovery parties can add takeover and privacy risks. User identity, signing authority and encryption keys need not be the same thing. |
| **4. Storage and retained history:** preserve and retrieve the required bytes | User content, app assets, replicas, storage providers, IPFS pins, archives and required chain history. Multiple gateways lead to a copy nobody retains. | Retrieve a real retained copy through another operator. Preserve format/schema information and required history. Test mismatch separately from failure to retrieve. | IPFS persistence; EFS references and mirrored file retrieval. Pocket makes the difference between a list of URLs and saved article content concrete. | Somebody retains and pays for data. Permanent public storage is unsuitable for many private records. Content addressing does not retain bytes. |
| **5. State access and verification:** find the right records and establish what they mean | RPCs, indexes, query definitions, schemas, chain/block basis, integrity, freshness and completeness. A reachable API returns old or incomplete data. | Rebuild one essential query from retained inputs/history. Specify the state basis and test freshness/completeness appropriate to the task. Use independent validation where supported. | Graph Node rebuild requirements. EFS's public records provide a concrete query to inspect, not proof of every possible query. | Index rebuilds cost storage, bandwidth and time. Provider agreement does not establish independent validation. One correct record does not establish complete results. |
| **6. Required computation and delivery:** do the work that makes an operation happen | Backends, workers, keepers, relayers, bundlers, paymasters, provers, oracle inputs and transaction submission. The chain works but a required operator stops. | Give a replacement operator the code, inputs and instructions. Test the direct or alternative path, including fees and permission. Define a safe response to missing or stale inputs. | Chainlink's feed freshness checks and the app's own keeper/relayer dependencies. | Compute, transaction fees, secrets and incentives remain. A different oracle can change meaning and trust. Permissionless execution may still require protections against abuse. |
| **7. Application rules and control:** enforce the rules the user accepted | Contracts, proxies, external protocols, pause/configuration roles, governance, tokens and authority over required dependencies. An administrator changes the deal, or fixed buggy code prevents use. | Inspect deployed authority, including inherited controls. Remove unnecessary powers, bound others, make migrations explicit and test the user's ability to continue or exit. | Uniswap as a protocol/interface distinction; Safe modules as an authority example. EFS contract goals need an exact deployed authority inventory before a stage claim. | Fixed code preserves the rules encoded there and removes in-place repair. Inherited protocols, mutable inputs and other authorities may still change behavior. Timelocks help only if users can detect and complete an exit. A retained UI cannot undo a shared-contract upgrade. |
| **8. Network, chain and settlement:** provide connectivity and an accepted execution history | Internet routing, peers/bootstrap, execution and consensus clients, validators, inclusion/finality; L2 sequencers, provers/proposers, chain data availability, settlement, bridges and their controls. The app inherits outages or unavailable recovery inputs. | Test network/node/RPC replacement. Inspect the chosen chain and task's documented recovery route with the user's actual account type, required data, delay and fees. Separate forced inclusion from withdrawal. | Ethereum nodes and clients; the documented OP Stack sequencer-outage route. | A node still needs connectivity, peers and consensus. An L2 escape route is chain-specific. Chain data availability for reconstruction differs from long-term file storage. |

Sources for established examples and their limits live in
[[presentation-examples]]. Mechanism documentation supplies examples of
questions to ask; it does not establish the state of a particular deployment.

## Controls and continuity across every layer

Every box needs the same two annotations:

- **Control:** who can stop, redirect, modify or deny it? Include release keys,
  parent names, governance, account recovery, pause roles and provider policy.
- **Continuity:** who runs it, pays for it, retains its inputs and knows how to
  replace it? Include shared cloud accounts, credentials, funding, renewals,
  operator incentives, documentation, licenses, community knowledge and new
  maintainer onboarding.

Cloud hosting belongs on the components that use it. It is not one networking
layer. Three URLs under one cloud account or funder may share a single failure.
DNS and ENS primarily name things; RPCs supply views of state. Verification
applies to code, data, authority and chain state, with different evidence at
each point.

Community can supply care and maintenance, but its existence does not replace
usable instructions, permission to operate, retained inputs or a viable budget.
Likewise, open source helps replacement only when another operator can obtain
the dependencies, run the system and afford the task.

## What counts as a usable exit

Start on a fresh machine or with another person. Reopen the user's work and
complete the chosen task elsewhere, preserving the needed relationships,
history, formats, interpretation and keys. Record the time, cost and missing
features. Recovery that requires the founder to explain a secret step still
depends on the founder.

For a read task, test reading. For publishing, collaboration, decryption or
asset withdrawal, test that operation separately. A token balance surviving
onchain is different from its owner being able to use it. A fork may preserve
code while losing shared state, identity, liquidity or social coordination.

## A small record developers can use

Put this in an existing README or issue, with a row for each critical dependency:

| User task | Required component and operator | Who can change it? | Retained inputs | Replacement or exit | Observed time/cost | Remaining assumptions |
| --- | --- | --- | --- | --- | --- | --- |
| One task whose loss would hurt a user | Identify service, runtime and shared accounts | List actual powers | Code, data, history, keys, instructions | Describe what another person actually tries | Measure a test; label untested paths | State accepted dependence or next investigation |

Choose one improvement based on user harm. Options include removing a power,
making the operator replaceable, preserving a tested recovery path, or
explicitly accepting a dependency whose benefit justifies its risk. Keep
convenient defaults when users have a working alternative. No maintained
scoring service or universal decentralization score is required.

## Fitting this into the talk

Use the map once, then three chapters. The numbering is an inspection aid,
not eight equally long lectures.

1. **Entering the app:** naming, runnable software and user authority.
2. **Continuing the work:** retained data, usable state and required computation.
3. **Keeping the rules:** application control and the network/chain underneath.

Within each chapter, show one recognizable failure, a concrete check and a
repair with its cost. Bring EFS in when it demonstrates that mechanism clearly.
Keep additional project details, cryptographic compatibility research and the
full checklist in companion notes unless they improve the spoken argument.
