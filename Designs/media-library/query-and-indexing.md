# Media query and indexing — onchain first, The Graph last

**Status:** draft
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[Designs/efsv2/README]], [[media-infrastructure]]
**Reviewers:** 2026-08-14 — independent authority/architecture pass; no Critical or Important finding after repair
**Last touched:** 2026-09-04

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/media-library #topic/onchain #topic/graph-queries #topic/read-path

## Problem

Booru-class search needs tag intersections, negative filters, aliases,
implications, ranges, full text, facets, ranking and similarity. It is easy to
declare the whole problem “offchain” and quietly make The Graph or one hosted
database mandatory. That would violate the point of EFS: a fresh Realm and
direct client must retain useful bounded graph behavior and independent
reconstruction without an EFS-operated indexer.

The reverse mistake is to force every global search, rank or recommendation
into permanent EVM state. That can create combinatorial indexes, unbounded
reads, unaffordable writer fan-out and hot-tag denial of service.

This design makes query placement an evidence ladder. **Try and measure the
smallest generic onchain shape first. Use The Graph only after a concrete
bounded trace fails.**

## Authority and status

### Adopted direction

[[Designs/efsv2/owner-rulings#On-chain sign-off — partial rulings (the 18-item list, onchain-completeness §3)]] records:

- lean hard onchain;
- keep backlinks, reverse membership/cited-by, digest lookup,
  revocation-aware counts and useful bounded reads onchain;
- automatically populate a Type's admitted index profile for every admitted
  item; and
- reserve The Graph for genuinely heavy ranked, full-text and global aggregate
  search.

The greenfield reset retained these as acceptance obligations but reopened the
old physical machinery. A fresh Realm cannot require Commons, EFS OS or an
EFS-operated indexer; see [[Designs/efsv2/system-constitution]].

### User-directed media policy, 2026-08-14

For public media queries that genuinely must be offchain, build the first
reference implementation on **The Graph** because it targets decentralized
indexing and is familiar to web3 developers. It remains a last-resort escape
hatch rather than the default architecture.

This policy covers public derived query/search. It does not assign media byte
storage, range transport, previewing, transcoding, private library search,
private tags or watch state to The Graph.

### Proposal-only mechanics

Stage A's `SCALAR_EQ`, `REF_BACKLINK`, `DIGEST_EQ`, page ABI, cursors and exact
bounds are candidate engineering inputs in
[[Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes]]. Stage A adopts
nothing and Stage B has not measured aggregate gas/state; see
[[Reviews/2026-08-13-efs2-stage-a-corpus/STATUS]]. Current B0 does not implement
a booru multi-tag query language.

## Placement rule

Every proposed public query follows this order:

1. **Define the exact consumer trace.** Name inputs, Realm(s), basis, result
   semantics, maximum page, completeness requirement and adversarial shape.
2. **Try existing generic Core reads.** Known-ID, exact Type, equality, digest,
   reference, backlink, Binding or Lens point reads may already suffice.
3. **Try the smallest generic onchain addition.** A materialized exact key,
   same-basis point membership or redeployable bounded view/query contract is
   preferred over a media-specific kernel primitive.
4. **Measure the complete bundle.** Include admission/write gas, state growth,
   churn, revocation, hot keys, page/cursor reads, reconstruction and contract
   composition—not one happy query.
5. **Record the falsifier.** State exactly why the onchain arm is unbounded,
   unsafe or economically incredible and what measurement would reverse that
   conclusion.
6. **Use The Graph.** Implement the public derived query in a versioned,
   independently deployable subgraph with explicit basis, coverage and
   Core-verifiable identifiers.

“Cheaper in a database” is not a falsifier. “This open-world NOT query requires
enumerating an unknown universe” is.

## Query ladder

| Level | Query class | First onchain shape to test | The Graph threshold |
|---|---|---|---|
| Q0 | Known Work, Post, Representation, Exact Blob, claim, receipt or current point | direct Core read | Never the sole path. |
| Q1 | Exact digest; one exact tag, artist, character, series, source or collection key | digest/equality index or typed backlink, bounded pages | Acceleration is allowed; exact bounded path remains available. |
| Q2 | Current live count, curator point choice, deterministic best Locator | revocation-aware count, Binding/Lens point read or bounded selector | Only if the required result is not actually a bounded point query. |
| Q3 | `tag:A AND tag:B` or a small selective conjunction | enumerate the rarest posting at one basis; point-probe remaining memberships; return a resumable bounded page | Use Graph when no conjunct/candidate page is bounded or the measured probe/state envelope fails. |
| Q4 | Small `OR`; `A AND NOT B` within an explicit finite positive candidate set | capped union/subtraction over basis-pinned pages | Open-world OR/NOT or unknown universe. |
| Q5 | Rating/date/dimension/type facets | exact/bucket equality or one workload-proven small compound key; prohibit combinatorial materialization | Arbitrary range/facet combinations whose write fan-out or read cost fails. |
| Q6 | Top-k inside a bounded candidate set | deterministic capped selector with explicit score/basis | Global ordering, trending and arbitrary score sorts. |
| Q7 | Full text, prefix/autocomplete, global counts/facets, huge Boolean search | first test exact materialized vocabulary keys and bounded edges where plausible | Graph after exact falsifier. |
| Q8 | Perceptual/embedding similarity and recommendations | exact digest remains native; optionally publish versioned similarity edges as evidence | Feature extraction and global nearest-neighbor/recommendation computation are external; Graph may index published edges, not perform authoritative identity merging. |

Older [[Designs/efsv2/onchain-completeness]] and
[[Designs/efsv2/onchain-graph-queries]] preserve important requirements and
falsifiers, but their July mechanisms are historical evidence after the
greenfield reset.

## Selective multi-tag experiment

Multi-tag search is the highest-value unresolved boundary.

### Candidate trace

For `tag:A AND tag:B` under one Realm, basis and curator policy:

1. estimate or read revocation-aware live counts for A and B;
2. choose the rarer tag deterministically;
3. page its live Tag Assertions;
4. hydrate each candidate target;
5. point-test membership of the other tag at the same basis and policy;
6. emit at most one bounded result page plus a resumable cursor; and
7. expose scanned candidates, coverage and completeness.

Candidate application shapes to test, in order:

1. exact author-neutral `TagAssertion(target, tag)` Record plus authored
   Occurrences and point-queryable liveness;
2. a generic application `Position(target, tag)` with bounded Lens resolution;
3. a workload-proven generic small compound key; and
4. a redeployable bounded view/query contract over existing Core indexes.

The two-field assertion is a distinct minimal-profile candidate, not a partial
encoding of [[booru-app#Attributable tag claims]]. An exact RecordId probe
requires the exact Type/profile and every canonical identity-bearing body
field. For the richer claim shape, target and tagConcept alone cannot determine
the RecordId: use bounded indexed candidates and evaluate the complete claims,
including polarity, scope, confidence and evidence references, at the same
basis and curator policy. No application profile is selected by this query
sketch.

Do not add a media-specific Core contract merely because the first application
schema is inconvenient. A Core escalation requires the exact failure trace and
smaller generic falsifier defined by the media intake.

### Adversarial cases

- rare A with extremely hot B;
- two extremely hot tags with few shared results;
- duplicate assertions by many authors for one target;
- 1/8/32/64-curator policies;
- withdrawal/dead-posting churn;
- tag spray and hostile common tags;
- cursor replay at a changed basis;
- partial index coverage; and
- result deduplication without losing authorship.

## Reference The Graph architecture

Official documentation currently describes a subgraph as an open API that
extracts blockchain data, maps it to entities and exposes GraphQL. Its manifest
names contracts, networks, events/calls/blocks, mappings and entities:

- [Subgraphs overview](https://thegraph.com/docs/en/subgraphs/overview/)
- [Subgraph manifest](https://thegraph.com/docs/en/subgraphs/developing/creating/subgraph-manifest/)
- [GraphQL API and `_meta`](https://thegraph.com/docs/en/subgraphs/querying/graphql-api/)
- [Graph Node](https://thegraph.com/docs/en/indexing/tooling/graph-node/)
- [Supported networks](https://thegraph.com/docs/en/supported-networks/)

The exact EFS design remains tentative.

### Deployment unit

- One versioned subgraph deployment indexes one explicit EFS Realm/chain
  contract set and start basis. The official manifest documentation says one
  subgraph may index multiple contracts but not multiple networks.
- A client explicitly chooses a Realm set and federates pages. It never calls a
  partial Realm list “all EFS media.”
- Deployment identity, schema version, indexed Core/profile identity, start
  block and latest indexed block/hash travel with every result page.
- Anyone may deploy the same manifest/mappings or an alternative compatible
  index. No endpoint or deployment becomes protocol-canonical.
- A Graph Network deployment served by independently chosen Indexers and a
  self-hosted Graph Node are different service topologies. Both may run the
  same subgraph, but one operator running Graph Node is a replaceable index—not
  evidence of decentralized serving. Clients expose service kind, endpoint or
  gateway and operator policy separately from subgraph deployment identity.

### Tentative entity projection

These are derived Graph entities, not new canonical media objects:

```text
RealmIndexState
  realmId, chainId, coreProfile, deployment, indexedBlock, errors

MediaRecord
  portableRecordId, typeId, admittedBasis, selected fields

AuthoredOccurrence
  occurrenceRef, recordId, principalId, status, admittedBasis

TagConceptProjection
  conceptRecordId, namespace, selected public labels

TagAssertionProjection
  assertionRecordId, occurrenceRef, targetId, tagId, polarity

VocabularyEdgeProjection
  edgeRecordId, occurrenceRef, relation, sourceTagId, targetTagId

CollectionEntryProjection
  entryRecordId, occurrenceRef, collectionId, targetId, position

MediaRelationProjection
  relationRecordId, occurrenceRef, sourceId, targetId, relationKind

LocatorProjection
  locatorRecordId, occurrenceRef, blobId, scheme, public policy fields
```

Search documents, facets, expanded tags and curator-selected rows are explicitly
derived entities. Every row retains underlying EFS IDs and enough source links
for the client to verify material facts against Core.

### Indexing inputs

Prefer deterministic event handlers over call tracing. Core/Realm events must
be sufficient to discover admissions, withdrawals, Bindings and other state
changes, while direct state reads remain the reconstruction authority. The
current Stage A event parity is not yet proved; a reference-subgraph prototype
must identify every missing event or state query without changing Core merely
for indexer convenience.

Public immutable IPFS/Arweave file data may be a later subgraph input, but it
must not be the only source of canonical EFS records. The Graph's official
[advanced features documentation](https://thegraph.com/docs/en/subgraphs/developing/creating/advanced/)
describes deterministic file-data-source isolation and its limitations; no
arbitrary HTTP source or private Locator belongs in the reference mapping.

### Result contract

Every Graph-backed page includes or permits retrieval of:

```text
providerKind = THE_GRAPH
serviceKind = GRAPH_NETWORK | SELF_HOSTED_GRAPH_NODE | OTHER_COMPATIBLE
realmId + chainId + Core/profile identity
subgraph deployment ID + schema version
query block number + hash + Realm finality status
hasIndexingErrors
query AST/version + vocabulary/Lens basis
coverage statement
items carrying underlying EFS IDs
next cursor binding deployment + schema/query version + Realm/Lens basis
  + query block number/hash + final sort tuple and stable tie-break ID
```

Clients query `_meta`, reject a deployment/profile mismatch, display lag or
indexing errors, and verify selected result records against Core. A Proof of
Indexing concerns deterministic subgraph execution; it does not make a derived
tag selection, rights claim or ranking semantically true.

Pagination is a historical-basis query, not repeated “latest” reads. Page one
chooses a block accepted by the Realm finality policy. Every later page uses
The Graph's historical `block` query argument for that same number/hash and
must match the cursor-bound sort tuple. If the deployment cannot serve that
basis, the page is `UNKNOWN`/`UNAVAILABLE`; it must not silently continue at a
new head. See the official
[time-travel query documentation](https://thegraph.com/docs/en/subgraphs/querying/graphql-api/#time-travel-queries),
including its reorg/finality caveats.

### Failure behavior

| Failure | Required client behavior |
|---|---|
| no Graph endpoint | switch to bounded Core browse/read where supported; label enhanced query unavailable |
| partial sync or lag | show indexed basis and partial/stale coverage; never report global completeness |
| indexing error | surface error state; do not silently serve inconsistent results as complete |
| endpoint disagreement | compare deployment/basis and verify sampled/selected Core records; permit operator choice |
| subgraph upgrade | keep version/deployment visible; old saved query names its original basis |
| historical block unavailable or page-basis mismatch | return `UNKNOWN`/`UNAVAILABLE`; never mix pages from different blocks |
| Realm reorg/finality change | follow explicit Realm finality policy and invalidate incompatible cursors/pages rather than rebasing them silently |
| subgraph deletion | rebuild from declared chain state/events or deploy another compatible index |

The
[[media-infrastructure#Ethereum history and content-resolution pressure|history-availability pressure]]
makes the last row conditional: reconstruction succeeds only when declared
state is sufficient or a qualified archive/history source actually supplies
the required raw state, bodies or receipts at the pinned basis through the
declared evidence and verification path. A named capability is not proof, and
a current RPC that has pruned old bodies or receipts does not prove absence.
Any unverified or incomplete backfill keeps the activation and affected query
`PARTIAL`/`UNKNOWN`; exact inspection or reconstruction that depends on one
historical provider is a redesign trigger.

## API and SDK boundary

Clients should depend on a provider-neutral query AST and page contract, not a
GraphQL schema directly:

```text
compileMediaQuery(text, vocabularyBasis) -> QueryAst
planMediaQuery(ast, capabilities, budgets) -> CorePlan | ViewPlan | GraphPlan
executeMediaQuery(plan, realmBasis, cursor) -> QueryPage
verifyQueryItem(item, realmBasis) -> VERIFIED | INVALID | UNKNOWN
```

The SDK explains why a plan moved to Graph and which onchain arms were not
supported or failed measured budgets. A deployment may offer Graph directly to
advanced clients, but the product UI still preserves basis/completeness and
Core verification.

Private filters are applied after public results arrive. A personal blacklist,
private tag or watch history is never embedded in a remote Graph query unless
the user explicitly accepts that disclosure.

## Stage B media query extension

Add a versioned media workload beside—not silently inside—the generic Stage A
corpus:

- rare, normal and extremely hot single-tag populations;
- p50 35 / p95 100 tags per public item;
- 2/3/5-tag AND with varied rarest-list size;
- bounded OR and finite-base exclusion;
- tag edit, denial and withdrawal churn;
- duplicate targets and plural authored Occurrences;
- 1/8/32/64-curator point policies;
- 10k and synthetic 1m global checkpoints;
- exact same-basis Core/view/Graph parity;
- Graph backfill, pruned-history/archive-capability loss, reorg, lag, error,
  outage and reconstruction; and
- no-Graph guest fallback.

Report:

- cold/warm gas;
- calldata and returndata;
- SSTORE count and long-run state growth;
- postings visited and candidates point-probed;
- page/cursor count and completeness;
- admission/update/withdrawal costs;
- tag spray and hot-key amplification;
- subgraph sync time, storage, query latency and query cost; and
- client verification overhead.

Use one aggregate mandatory Type/index bundle. Do not approve an optional media
index from isolated read gas while ignoring permanent writer/state costs.

## Falsifiers

Move a query to The Graph only with one or more recorded failures:

- no bounded key or candidate page exists;
- cost necessarily scales with global history or an unknown universe;
- a hot value makes one result page unbounded;
- a generic materialized key causes combinatorial writer/state growth;
- a contract cannot consume the answer within the measured gas/returndata
  envelope;
- coverage cannot be represented honestly at a pinned basis; or
- the aggregate mandatory bundle is economically incredible.

Redesign rather than defer if:

- partial coverage can masquerade as absence;
- exact inspection or reconstruction requires The Graph;
- the subgraph result cannot be traced to portable EFS IDs;
- one private/hosted database is needed to recover canonical evidence; or
- a media query can work only by adding media-specific authority to Core.

Numeric acceptance budgets remain a Stage B output. This draft does not invent
gas limits before the generic and media workloads run.

## Limitations

- The Graph's network support, manifest/API versions and operational economics
  can change; pin exact versions and reverify official documentation during
  implementation.
- A decentralized protocol does not guarantee that multiple independent
  Indexers serve a particular deployment or that a gateway is uncensorable.
- Graph Node is software that can be self-hosted; a single node/operator is not
  decentralized merely because it uses The Graph's stack. Graph Network and
  self-hosted service availability, censorship and trust assumptions are shown
  separately.
- A subgraph normally projects one network; multi-Realm search is federation
  with explicitly partial coverage, not a global query illusion.
- GraphQL performance still depends on entity/index design; `OR`, deep joins
  and huge pagination are not free merely because they are offchain.
- Full-text and similarity computation may require services beyond ordinary
  subgraph mappings. The Graph remains the public query integration point where
  feasible; derived feature generation must be separately reproducible and
  disclosed.
- The Graph cannot index unpublished private libraries without destroying the
  intended privacy boundary.

## Open questions

- [ ] Which same-basis tag-membership point shape makes selective AND generic
      and bounded without a media-specific Core primitive?
- [ ] Which media fields justify permanent automatic indexes after the
      aggregate Stage B cost pass?
- [ ] What exact event/state contract lets a subgraph reconstruct admissions,
      withdrawals, Bindings and Lens-relevant inputs without logs becoming the
      only truth?
- [ ] How should one client federate multiple Realm subgraphs while preserving
      independent cursors, finality and honest partial coverage?
- [ ] Which full-text/facet features are actually supported on the selected
      Graph Network/version and which require a separately disclosed service?

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Dependencies are accepted/landed or explicitly treated as provisional
- [ ] No `<!-- AGENT-Q: -->` comments remain
- [ ] At least one `#status/review` pass receives another agent or human review
