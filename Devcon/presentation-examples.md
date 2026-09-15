# Outside examples for the Devcon talk

Source bank checked **2026-09-14** for [[presentation-spine]]. James's direction
is to use non-EFS examples wherever they sharpen a point or reveal another
design choice. EFS remains the running user journey. This bank supports
selection during drafting, not a promise to cover every project in 20 minutes.

For each example, separate the source-supported fact from our proposed lesson.
None is a verdict on the whole project's decentralization or a claim that EFS
solves the same problem. Refresh changing documentation and the relevant
deployment configuration before using it on stage.

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
