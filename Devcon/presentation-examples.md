# Outside examples for the Devcon talk

Source bank initially checked **2026-09-14** for [[presentation-spine]]. James's direction
is to use non-EFS examples wherever they sharpen a point or reveal another
design choice. EFS remains the running user journey. This bank supports
selection during drafting, not a promise to cover every project in 20 minutes.

For each example, separate the source-supported fact from our proposed lesson.
None is a verdict on the whole project's decentralization or a claim that EFS
solves the same problem. Refresh changing documentation and the relevant
deployment configuration before using it on stage.

## October 20 integrated deck and fresh audit

[[example-audit-2026-10-20]] records current primary-source checks, corrections
and candidate substitutions. The integrated deck adds Teia's positive
community-continuation story, labels PoolTogether V5 and uses canonical links,
and separates Safe signer replacement from decryption and interface recovery.
Uniswap's fee authority and OP Stack's inclusion route remain narrowly scoped.
Helios and Graph Node each receive a brief spoken mechanism explanation.
dYdX v3, Async Art and Liquity V1 remain reserves, not additional sections.
The current snapshot is [[Devcon/presentation/2026-10-20-integrated-spine/README]].

## Earlier October 20 practice selection

The practice deck now uses the approved substitutions from the
[private example research](../../../Personal/devcon-2026/web3-examples-2026-10-18.md).
Safe 2-of-3 replaces generic account-recovery wording, PoolTogether claimers
replace the generic worker list, Uniswap v2 makes the fixed-code claim precise,
and Safe CLI replaces Git bundles as the continuation example. EFS remains
the archive through line. Ledger and OP Stack remain brief contrasts.

The snapshot's notes retain public primary sources and the limits of each
claim. Decryption recovery is separate from signer recovery. Worker permission
does not guarantee willing operators. Fixed v2 code retains fee authority and
other dependencies. Changing interfaces alone does not repair compromised
account configuration. No new recovery transaction or EFS retrieval occurred.
Helios, Graph Node and oracle detail remain reference material rather than
extra spoken project introductions. See
[[Devcon/presentation/2026-10-20-practice/slides-and-notes]].

## October 13 opening and vision additions

### CROPS and hyperstructures

**Checked October 13:** [Devcon's ecosystem program](https://devcon.org/en/ecosystem-program/)
expands CROPS as Censorship Resistance, Open Source, Privacy and Security.
The [Ethereum Foundation Mandate](https://ethereum.org/foundation/mandate)
connects those values with a walkaway goal for Ethereum's protocol and core
application layers. It also emphasizes reusable infrastructure and protection
against unwanted disclosure.

[Jacob Horne's original Hyperstructures essay](https://jacob.energy/hyperstructures.html)
describes entirely onchain protocols designed to continue on the underlying
blockchain without an indispensable operator. Permissionless use lets other
builders rely on their functionality. The full definition includes properties
beyond durability, including its fee and incentive model. Do not label an
entire application, or EFS, a completed hyperstructure based on one surviving
contract or retrieval path.

**Talk framing approved by James:** reliable apps people can trust with their
most important data and that future developers can build upon. Explain this
benefit first, name CROPS and hyperstructures afterward, then use the stack to
test the promise. Important-data trust includes confidentiality and appropriate
access. The vision is not a recommendation to publish sensitive data onchain.
The aspiration supplies direction, not a certification that all examples meet it.

### Harm and recovery examples

James now wants the problem and the positive future to carry more of the
talk. [[presentation-revision#Evidence for the stakes and vision]] records
fresh primary-source checks for Pocket's shutdown, Ledger Connect Kit's
runtime distribution compromise, Stadia controller recovery and the original
Hyperstructures essay. Pocket and Ledger are the leading harm examples;
Stadia, Git or a protocol with replaceable interfaces can supply a positive
contrast. These are candidates, not extra mandatory project tours.

Pocket's current shutdown FAQ names **November 12, 2025** as the export/API
end date. Its separate export page still has an old October 8 line as well
as the November 12 banner. Use the explicit shutdown FAQ for the historical
date and the export page only for the documented URL-versus-content limit.
Google's controller page also has stale updater deadlines; the supported
teaching claim is the historical recovery design, not current tool availability.

## ENS gateways: two addresses can share an operator

**Fact, checked October 13:** the eth.limo team's
[migration report](https://discuss.ens.domains/t/eth-limo-update/19707)
states that eth.link moved from Cloudflare onto the eth.limo service on
September 19, 2024. ENS [contenthash documentation](https://docs.ens.domains/dweb/intro/)
separates the name's content reference from its storage and gateway path.

**Teaching use:** show the convenience of reaching a content-addressed app
through familiar HTTPS URLs, then reveal the shared operator. Do not present
`.eth.link` and `.eth.limo` as independent infrastructure or freedom from DNS.

**Improvement and tradeoff:** retain the accepted app release and test a
separately operated retrieval path. The team's February 2026
[local gateway announcement](https://discuss.ens.domains/t/run-your-own-local-ens-gateway-the-easy-way/21890)
offers a concrete option. Local operation shifts setup and infrastructure
work to the user or replacement operator. Inspect its ENS/RPC and retrieval
dependencies; do not assume that installing it removes all trust or hosting
dependencies. The reference's authority and availability of bytes remain.

**Limit:** these are source-supported architectural examples, not a fresh EFS
alternate-path test. Resolve and exercise the exact app release before using
screenshots as evidence. Best fit: the first chapter's entry-path sequence.

## Light clients: checking an answer is different from obtaining it

**Fact, checked October 13:** Ethereum's
[light-client explanation](https://ethereum.org/developers/docs/nodes-and-clients/light-clients/)
describes requesting data from providers and validating it against a chain
basis. [Helios](https://github.com/a16z/helios) is a concrete light-client
example that exposes an RPC interface with verification for supported data.
Its supported methods and checkpoint assumptions matter.

**Teaching use:** distinguish another available RPC, evidence supporting a
particular answer, and somebody retaining the file bytes. Multiple providers
can improve access without establishing correctness. A light client does not
make withheld data appear or automatically prove freshness or completeness
of arbitrary indexer queries.

**Improvement and tradeoff:** make providers replaceable and validate the
claims needed for the user's task where supported. Retain an appropriate
verification basis and handle missing or stale responses explicitly. This
adds verification and integration work while leaving provider availability
and data retention as separate responsibilities.

**Limit:** no EFS light-client integration or multiple-RPC failover was
verified in this revision. Present them as design options, not shipped EFS
features. Best fit: a small contrast in the second chapter, not another demo.

## Uniswap: interface and protocol access

**Fact:** Uniswap Labs' [interface policy](https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy)
distinguishes its interfaces from the protocol and describes restrictions
applied through those interfaces.

**Teaching use:** An app's normal entrance and the underlying contracts have
different controls. Ask whether a user has another usable way to perform the
same permitted task if the usual interface disappears.

**Improvement and tradeoff:** Retain a compatible client and test the task
through another entry point. Compatibility, state discovery and safe signing
still need maintenance. Contracts remaining accessible does not make every
user's workflow recoverable.

**Limit:** Do not generalize across every token, hook or related contract,
turn the example into legal advice, or claim an outage that the source does
not describe. Best fit: the opening interface/protocol distinction.

## Ledger Connect Kit: code can change outside your release

**Fact:** Ledger's [December 20, 2023 incident report](https://www.ledger.com/blog/security-incident-report)
describes the December 14 compromise of its JavaScript connector distribution.
A loader fetched the connector at runtime. A compromised publishing account
allowed malicious versions to reach integrating apps without changing those
apps' own repositories.

**Teaching use:** "What code runs in my app?" includes dependencies fetched
after deployment. An unchanged contract does not protect a malicious signing
interface.

**Improvement and tradeoff:** Retain reviewed dependencies in a verifiable
release and make updates deliberate. Inventory runtime scripts and publishing
authority. This shifts update and security-maintenance work to the app team.
It does not make the retained code inherently safe.

**Limit:** Historical connector incident, not evidence of extracted hardware
wallet keys or the current security of every Ledger product. Best fit: a
20-second example in the app/release layer.

## Safe: authority extends beyond the owner threshold

**Fact:** Safe's [module documentation](https://docs.safe.global/advanced/smart-account-modules)
describes enabled modules executing transactions through their own logic.
Modules can support automation, allowances or recovery, and the documentation
warns about malicious-module authority.

**Teaching use:** The visible multisig threshold alone does not describe all
ways an account can act. Ask which enabled components can authorize an
operation and who can change those components.

**Improvement and tradeoff:** Inspect the exact deployed account configuration
and test the relevant recovery path. Limit permissions to what the workflow
needs. Extra recovery and automation options can introduce additional parties
or code capable of taking control.

**Limit:** This is a configurable capability, not a claim that all Safes use
modules or share the same authorities. Best fit: wallet and contract control.

## Graph Node: rebuilding an index requires more than open code

**Fact:** [Graph Node's documentation](https://thegraph.com/docs/en/indexing/tooling/graph-node/)
describes an independently operated indexing service using PostgreSQL, chain
RPC and IPFS-hosted subgraph definitions. Certain mappings require archive
RPC or trace functionality.

**Teaching use:** An indexer can be replaceable, but its code is only part of
what must survive. The definition, relevant history and a compatible data
source also matter.

**Improvement and tradeoff:** Retain the indexing definition and inputs, rebuild
an important query on another machine, and test switching the app to it.
Measure synchronization time and resources. Rebuilding may be expensive or
slow, and matching two providers is not independent proof of completeness.

**Limit:** Requirements depend on the subgraph and software version. This is
not a claim that a particular EFS index is a Graph subgraph or that every
deployment can be rebuilt from an arbitrary RPC. Best fit: public reads and
discovery, or companion notes if the main talk is already full.

## Git bundles: an export with a usable importer

**Fact:** The [Git bundle manual](https://git-scm.com/docs/git-bundle) describes
offline transfer of Git objects and references. A self-contained bundle can
be cloned into a new repository. Incremental bundles may require an earlier
baseline. Bundles do not include arbitrary working-tree files or repository
configuration.

**Teaching use:** Ask whether exported work can actually reopen elsewhere.
Git provides a familiar concrete example of carrying both data and enough
structure for another tool to use it.

**Improvement and tradeoff:** Rehearse export, import and continued use on a
clean machine. List omitted state. Self-contained exports take more space,
while incremental exports can hide prerequisites.

**Limit:** A Git bundle is not a backup of every hosted development-platform
feature. Do not imply that relationships or attachments outside the repository
automatically survive. Best fit: the audience exercise or a positive recovery
example between failure stories.

## Chainlink feeds: authentic data can be too old to use

**Fact:** Chainlink's [data-feed documentation](https://docs.chain.link/data-feeds#check-the-timestamp-of-the-latest-answer)
describes heartbeat/deviation-driven updates and tells consuming applications
to check the latest answer's timestamp. Feed configurations differ, and the
docs discuss pausing or changing operation when an answer is too old.

**Teaching use:** "The call succeeded" and "this input is suitable now" are
different conclusions. Onchain applications inherit dependencies on the
freshness and meaning of external inputs.

**Improvement and tradeoff:** Define acceptable freshness for the operation,
check it and choose safe degraded behavior. Suspending sensitive writes can
protect users while reducing availability. Switching feeds may introduce a
different meaning or trust assumption and needs its own review.

**Limit:** No universal timeout fits all feeds, chains or applications. This
is developer responsibility documented by the provider, not an allegation of
a feed incident. Best fit: external inputs or verification scope.

## OP Stack: a sequencer fallback has conditions

**Fact:** OP Stack's [sequencer-outage documentation](https://docs.optimism.io/op-stack/protocol/outages)
describes submitting through an L1 portal without the sequencer. Inclusion
rules, timing and account behavior matter to this route.

**Teaching use:** A recovery mechanism should be something the intended user
can exercise. Ask which inputs, funds and permissions it needs when the usual
service is unavailable.

**Improvement and tradeoff:** Read the specific chain's configuration and test
the fallback with the relevant account type. Budget the delay and L1 fees.
Keep forced inclusion and asset withdrawal as separate questions.

**Limit:** This is an OP Stack mechanism, not a general promise for all L2s.
Do not quote one default delay as a property of every deployment. No fallback
transaction was executed during this research. Best fit: blockchain/L2 layer.

## Cloudflare: serving and reconfiguring can fail separately

**Fact:** Cloudflare's [November 2023 postmortem](https://blog.cloudflare.com/post-mortem-on-cloudflare-control-plane-and-analytics-outage/)
reports that network and security traffic continued during a control-plane
and analytics outage, while customers sometimes could not change settings.
It describes non-obvious dependencies on a failed facility.

**Teaching use:** Test both continued operation and the ability to recover or
reconfigure it. Several redundant-looking services may share the dependency
needed to switch them.

**Improvement and tradeoff:** Rehearse losing a whole operator/account or
facility, not only restarting one process. Keep recovery instructions and
essential access outside the failed administration path. Stronger isolation
costs resources and operational effort.

**Limit:** A historical, service-specific incident, not a claim that all
Cloudflare traffic stopped or a current architecture assessment. Best fit:
shared dependencies and recovery costs, or a reserve Q&A example.

## Immutable programs and changing proof systems

**Source checked October 12, 2026:** [Exposing an ISA for post-quantum proofs
on Ethereum](https://ethresear.ch/t/exposing-an-isa-for-post-quantum-proofs-on-ethereum/26136).
The underlying [EIP-8288](https://eips.ethereum.org/EIPS/eip-8288) is Draft.

**Fact:** The post describes how permanently pinning a proof-system verification
key could break an immutable privacy pool when proving technology changes.
It proposes identifying the program and its versioned execution rules instead,
so the prover can evolve while preserving the program's meaning. Continued
compatibility still requires maintained provers and support for older rules.

**Teaching use:** Removing an application's administrator does not remove the
software and compatibility work needed to keep using it. Ask whether someone
can still perform each required computation after the original builder leaves.

**Improvement and tradeoff:** Preserve executable programs and specify their
interpretation. Test replacement tooling and examine migration or compatibility
paths. Keeping old behavior usable costs maintenance and may cost more compute.
This is a design question for the audience, not an implemented EFS capability.

**Limit:** Exploratory research, not an activated Ethereum feature or a claim
that EFS file-hash verification uses a zkVM. Keep ISA choices and benchmarks
in supporting notes or Q&A. Optional 20-30 seconds inside the existing
blockchain section, replacing generic explanation rather than adding time.

Suggested spoken line: "Removing your admin key doesn't remove every
dependency. If your users need a proof to act, someone must still be able to
produce it when the original builder is gone and the tools have changed."

## Related building blocks already in the EFS journey

[ENS](https://docs.ens.domains/dweb/intro/) separates the name's content
reference from hosting. [IPFS persistence](https://docs.ipfs.tech/concepts/persistence/)
explains the retention behind content addressing. These make good positive
design examples as well as occasions to discuss what still needs an operator.

[Browser subresource integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity)
can check fetched assets against an expected digest where the browser feature
applies. It requires a trusted expected value and does not protect an entry
document an attacker can change. It is a bounded improvement option, not a
complete release-security answer.

## Selection rule for the next draft

Choose comparisons by the decision they teach. Mix implemented recovery
mechanisms with failure reports so the talk gives people routes forward.
Introduce only the detail necessary for that lesson, then return to the EFS
user journey. A spoken example can take 15-30 seconds and replace a generic
explanation. Keep longer mechanisms in the linked notes.

The bank is deliberately broader than the stage selection. Do not turn these
examples into a leaderboard, a logo slide or a guarantee that any system is
fully decentralized. We have researched the described mechanisms and reports,
not conducted hands-on audits of these projects.
