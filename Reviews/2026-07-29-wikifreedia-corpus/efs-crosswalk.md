# EFS crosswalk — plural knowledge as a design pressure test

**Date:** 2026-07-29
**Status:** review synthesis only; all candidate mappings and `WF-*` items are non-canonical

## Executive judgment

Wikifreedia is a strong cross-cutting EFS workload because it asks the generic design to demonstrate:

- independent authors own signed records;
- several records can address the same subject;
- nobody mutates another author's version;
- readers choose how to discover, rank, label, and present them;
- exact provenance and portable exit matter.

The fit is **promising, not proven**.

The current EFS v2 set is draft and reconciliation-ready, not promotion-ready. The portable-schema handoff explicitly says arbitrary developer-defined record shapes, deterministic portable validation, schema catalogs, and complete contract composition are not demonstrated. Candidate lens profiles remain owner-gated; the guest path has blocking gaps; KEL is not frozen; the public revision-DAG approach is a strong draft synthesis; the preservation bundle and Client app runtime remain owed/research-stage.

Therefore:

> This workload does not justify a Wikifreedia-specific kernel primitive. It should test whether the generic schema pass can preserve five kinds or whether EFS needs a generic `SCHEMA` kind.

## Status discipline

Do not present these mechanisms as settled:

| Surface | Current status relevant to this review |
|---|---|
| EFS v2 joined design | all-draft/reconciliation-ready; coordinated recut and measurements still owed |
| portable schemas/validators | draft handoff; explicitly says no architecture adopted |
| `DISCOVERY/1`, `ADVISORY/1`, G1 guest, typed lenses | candidate replacement spec; LP owner choices remain unanswered |
| `AMBIENT/1` | owed and blocking for guest |
| KEL/strong authority | draft; top authority choices remain owner-gated |
| open-world revision DAG + curation | strong draft FS synthesis, not an owner ruling |
| automatic onchain indexing/full bodies | James has ruled the direction; recut/gas/freeze remain |
| `.efs-bundle` | normative encoding owed |
| HTMX/Wasm/third-party app runner | research handoff/hypothesis, not an implemented security boundary |

Primary local sources:

- [EFS v2 status map](../../Designs/efsv2/README.md)
- [portable schemas and validators handoff](../../Designs/efsv2/fable-handoff-portable-schemas-and-validators.md)
- [candidate lens replacement spec](../../Designs/efsv2/lens-spec.md)
- [lens limitations digest](../../Designs/efsv2/lens-read-gotchas.md)
- [owner decision inbox](../../Designs/efsv2/owner-decision-inbox.md)
- [FS pass synthesis](../../Designs/efsv2/fs-pass-synthesis.md)
- [owner rulings](../../Designs/efsv2/owner-rulings.md)
- [Client third-party app handoff](../../Designs/clientv2/fable-third-party-app-model-handoff.md)
- [Client persistence and sync](../../Designs/clientv2/persistence-and-sync.md)

## The crucial conceptual separation to test

### Perspective

A perspective is an authored artifact:

- exact bytes;
- exact signer/authority claim;
- topic;
- schema;
- citations;
- revision/fork lineage;
- license;
- optional stance/epistemic metadata.

It remains evidence even if no reader trusts or displays it.

### Candidate lens

Under the unresolved LP-1/LP-3 model, this workload suggests testing a lens as a reader- or risk-bearer-selected policy over authenticated evidence:

- candidate sources;
- filters;
- labels and consequences;
- purpose and scope;
- basis/completeness;
- bounded result/provenance receipt.

It would not own the perspective, prove it true, silently grant its author authority elsewhere, or itself perform opaque ranking and synthesis.

### Derived artifact

A ranking, comparison, cluster, consensus map, due-weight synthesis, or AI summary is an app/enhanced derived result with its own:

- inputs;
- policy/algorithm/model;
- operator/executor;
- basis and omissions;
- output;
- reproducibility limitations;
- signature/attribution;
- supersession history.

It is not a canonical truth. A candidate policy may select or consume it, but current lens receipts do not yet demonstrate the richer model/prompt/omission provenance proposed here.

## Abstract workload model

This table is an application-level trace, not a frozen EFS carrier decision:

| Concept | Required semantics | Possible current design ingredients to test |
|---|---|---|
| `Topic` | stable semantic identity, aliases, language, disambiguation, split/merge/`sameAs` | candidate portable schema-typed artifact; carrier open; aliases/redirect relationships |
| `PerspectiveEntry` | immutable authored version, schema, body, license, citations, topic link | candidate portable schema-typed artifact; DATA+TAGDEF is one option, not an adopted carrier |
| `Revision` | new immutable version; earlier remains citable | exact claim IDs plus generic lineage or the current `supersededBy` relation |
| `Fork` | exact base and independent author | revision DAG / typed relationship |
| `MergeProposal` | exact base/target/source plus state/history | independently authored proposal record and replies/reactions |
| `Citation` | exact object/version/source plus locator and license | typed edge/record and backlink index |
| `Annotation` | exact target plus robust selector and quote fallback | child DATA/typed relation |
| `Vouch` | revocable evidence about an exact version/author/policy | revocable relationship/claim; discovery input only by default |
| `Label` | labeler-authored evidence, not automatic consequence | label record plus candidate ADVISORY action policy |
| `TopicRelation` | alias, redirect, `sameAs`, broader/narrower, merge, split | typed graph relation; exact carrier remains open |
| `PluralTopicView` | candidate enumeration, basis, presentation, omissions, no false winner | candidate DISCOVERY + View/receipt concepts |
| `DerivedComparison` | exact inputs and execution provenance | portable app schema plus signed/attributable derived record |
| guest link | semantic and exact paths, fast read, honest unknown/absence | candidate guest ladder/G1 plus Client deep links |
| exit bundle | complete records, bytes, proofs, licenses, policies, views | owed `.efs-bundle` |

## What current EFS work plausibly contributes

### 1. Author-owned immutable evidence

The five-kind/meta-model direction separates durable data/definitions from revocable relationships. The current FS synthesis routes public open-world collaboration toward an immutable revision DAG plus human curation instead of one universally writable document.

That is a good fit for plural knowledge:

- authors publish their own versions;
- revisions and forks remain exact;
- citations and replies target immutable records;
- a current alias may move without rewriting history.

Status caveat: this is design-pass synthesis, not a finished protocol or owner-ratified app pattern.

Sources:

- [kind-set draft](../../Designs/efsv2/codex-kinds.md)
- [FS pass synthesis](../../Designs/efsv2/fs-pass-synthesis.md)
- [apps cookbook](../../Designs/efsv2/apps-cookbook.md)

### 2. Shared graph discovery

James has ruled toward mandatory automatic indexing for onchain EFS records, including records by known definition, backlinks/reverse relationships, live counts, and full record bodies; ranked/full-text/global analytics remain offchain. Enumerating every schema remains open.

For plural knowledge, that direction can support:

- records using a known definition;
- cited-by and replied-to;
- exact claim lookup;
- bounded topic candidate pages only if the eventual portable schema/convention maps topics onto an indexed key;
- canonical point verification after enhanced search.

Status caveat: the coordinated kernel/envelope recut, gas measurements, exact definitions catalog, and freeze still remain. “Onchain direction” is not “implemented and final.”

Sources:

- [owner rulings](../../Designs/efsv2/owner-rulings.md)
- [onchain completeness](../../Designs/efsv2/onchain-completeness.md)
- [current design status](../../Designs/efsv2/README.md)

### 3. Portable identity/authority direction

The draft KEL direction would add stable principals, recovery, rotation, delegation, personas, and scoped actor/app keys beyond bare addresses. If adopted and demonstrated, that could be stronger than treating one Nostr pubkey as permanent identity.

For plural knowledge, an adopted KEL could enable:

- user rotation/recovery of signing authority;
- scoped app or device authoring power;
- explicit organization/community authorship;
- identity continuity across key changes.

It still does **not** prove:

- one legal human;
- real-world name;
- credentials;
- truth;
- quote authenticity;
- lack of Sybils.

Status caveat: KEL remains draft and top authority choices are owner-gated.

Sources:

- [KEL draft](../../Designs/efsv2/kel.md)
- [owner decision inbox](../../Designs/efsv2/owner-decision-inbox.md)

### 4. Candidate lens family

The candidate lens work proposes a potentially useful separation:

- contract/core bounded policy;
- client-rich policy;
- enhanced index/search features that cannot silently become correctness dependencies;
- authority-free discovery candidate;
- advisory labels plus reader-selected consequences;
- explicit basis/UNKNOWN/completeness limits;
- Views and receipts;
- guest ladder.

For Wikifreedia, the workload suggests testing whether:

- `DISCOVERY/1` could enumerate candidate perspectives;
- `ADVISORY/1` could consume spam/misinformation/quality labels;
- a View could package location + presentation + disclosed policy hint;
- current receipts can disclose policy, basis, result, and provenance without overstating omissions;
- due-weight, WoT, bridge-scoring, ranking, or clustering can remain attributable app/enhanced outputs that a replaceable policy selects or consumes.

Status caveat: these are LP-gated proposals. `AMBIENT/1`, lane labels, authority ABI, migration, and acceptance fixtures remain blocking/owed.

Sources:

- [lens spec](../../Designs/efsv2/lens-spec.md)
- [lens pass synthesis](../../Designs/efsv2/lens-pass-synthesis.md)
- [lens read gotchas](../../Designs/efsv2/lens-read-gotchas.md)

### 5. Guest-first direct links

The candidate G1 path targets client-verified authorship and bytes over a hosted endpoint, with absence never claimed. A complete guest product would additionally need to prove the user-facing performance goals:

- a Reddit/HN/social link opens quickly;
- the reader sees content before account/auth setup;
- heavy OS/auth components can load later;
- richer proofs may raise confidence after first paint.

For plural knowledge, guest copy must say:

- which endpoint/index basis supplied candidates;
- which bytes/signatures were verified;
- that “not found here” is not “does not exist”;
- whether the view used a foreign/default policy;
- what was hidden or unevaluated where knowable.

Status caveat: this is the LP-5 recommendation, not adopted, and `AMBIENT/1` still blocks the guest product.

Sources:

- [lens pass synthesis](../../Designs/efsv2/lens-pass-synthesis.md)
- [lens read gotchas](../../Designs/efsv2/lens-read-gotchas.md)
- [owner decision inbox LP-5](../../Designs/efsv2/owner-decision-inbox.md)

### 6. Client app confinement

The Client research handoff targets third-party apps as untrusted guests with explicit capabilities and a typed membrane. If a runtime adopts that threat model, it would fit a knowledge app rendering adversarial user content.

The Wikifreedia audit makes one acceptance fixture concrete:

> An untrusted perspective emits markup containing a `javascript:` URL, deceptive link text, nested actions, oversized content, and an AI prompt injection. No click or render may escape the app/content boundary or receive ambient authority.

Status caveat: the Wasm/HTMX/safe-HTML design is a research handoff with explicit non-decisions. Do not claim an EFS runtime exists.

Sources:

- [third-party app handoff](../../Designs/clientv2/fable-third-party-app-model-handoff.md)
- [SDK boundaries](../../Designs/clientv2/sdk-boundaries.md)
- [threat model](../../Designs/clientv2/threat-model.md)

### 7. Preservation and walk-away direction

The current corpus repeatedly names `.efs-bundle` as the portable replay/export vehicle. A plural knowledge bundle needs:

- all exact records and revisions;
- original signatures and authority evidence;
- schemas and validator references;
- citations and source licenses;
- annotations/replies/relationships;
- labels and vouches;
- lens/View definitions and receipts where shared;
- required content bytes and mirror information;
- import/provenance mapping;
- submission/replication state.

Status caveat: the normative format is owed.

Sources:

- [Client persistence and sync](../../Designs/clientv2/persistence-and-sync.md)
- [lens pass synthesis](../../Designs/efsv2/lens-pass-synthesis.md)
- [file browser requirements](../../Designs/clientv2/file-browser-requirements.md)

## The largest real gap: portable schemas and validators

The [schema handoff](../../Designs/efsv2/fable-handoff-portable-schemas-and-validators.md) contains James's regression test:

- developers share/reuse schemas;
- users browse/search types;
- applications/contracts query records by type;
- structural/application rules are checked;
- independently written clients exchange data;
- EAS remains interoperable where possible.

It currently concludes that the five-kind/tag meta-model has not demonstrated arbitrary multi-field application schemas or permissionless portable validation.

Wikifreedia supplies a concrete workload:

```text
PerspectiveEntry
Citation
Vouch
Label
TopicRelation
DerivedComparison
```

Three independent clients should:

1. discover the same schema identity without private coordination;
2. generate compatible encoders/decoders and runtime validation;
3. preserve the same portable record identity across venues;
4. distinguish schema-valid from venue-admitted and reader-trusted;
5. page records by exact type/topic;
6. fork/extend schemas without overwriting history;
7. map to/from NIP-54 and EAS without identity laundering;
8. preserve license, language, attribution, and unknown fields;
9. let communities reject/admit differently without changing portable existence.

The pass must still compare:

- enriched `TAGDEF`;
- a dedicated generic `SCHEMA` kind;
- a canonical DATA/manifest schema referenced by TAGDEF;
- a standardized external adapter.

This review does not choose.

## Proposed `WF-*` acceptance requirements

These are pressure-test outputs, not design canon:

| ID | Requirement | Why Wikifreedia/precedents expose it |
|---|---|---|
| WF-1 | plural candidate enumeration with source basis and no false completeness | a hosted search relay can omit valid perspectives |
| WF-2 | semantic topic link plus immutable exact citation | reader choice and reproducible evidence need different identities |
| WF-3 | exact revision/fork/merge/defer/redirect/alias/split lineage | mutable coordinates otherwise inherit reputation and break audit |
| WF-4 | discoverable portable schemas and deterministic validators | NIP-54 prose tags do not supply shared application types |
| WF-5 | signer/pseudonym/identity/quote/third-party/AI attribution taxonomy | signatures are routinely overread as identity/truth |
| WF-6 | inspectable replaceable policy; WoT/vouches remain discovery evidence unless explicitly adopted | default ranking and Sybil graphs can become hidden authority |
| WF-7 | separately attributable derived artifact binding inputs, basis, algorithm/model/prompt/config/operator/output/omissions; test whether a richer receipt is needed | AI, ranking, and clustering are framing actors outside the current core lens operation |
| WF-8 | complete export and independent reconstruction | portable records without bytes/indexers/readers are theoretical exit |
| WF-9 | dangerous markup, URLs, actions, and authority escape fail closed under hostile fixtures; mechanism remains open | current reference code preserves dangerous link schemes |
| WF-10 | attributable moderation, omission, takedown, appeal, quarantine | “undeletable” does not answer legal/safety operations |
| WF-11 | license/language/source/evidence/epistemic/import metadata | public bytes are not automatically reusable or trustworthy |
| WF-12 | guest-first verified read with honest UNKNOWN/absence | hyperlinks must work before auth without lying |
| WF-13 | independent conformance plus a walk-away drill before neutrality claims | operator count alone does not prove exit |
| WF-14 | loss-aware Nostr/EAS/Wikipedia/Web Annotation round trip | interop must preserve original signature/license/identity limits |
| WF-15 | local/private/confidential reactions and safe aggregates | public trust graphs expose sensitive beliefs/relationships |
| WF-16 | due-weight/source-quality policies without protocol truth | plurality can otherwise amplify manufactured disagreement |

## Falsifiable end-to-end trace

### Setup

Use one controversial topic with:

- three authors;
- two schema publishers;
- two labelers;
- two indexers;
- two reader policies;
- one deterministic comparison;
- one nondeterministic LLM comparison;
- three independent client implementations;
- two availability providers.

### Events

1. Alice publishes entry v1 and three citations.
2. Bob publishes an independent entry under the semantic topic.
3. Carol forks Alice v1.
4. Alice publishes v2; one citation is later retracted.
5. One recommender vouches for exact Alice v1; another vouches for Bob.
6. A labeler flags Bob; another disputes that label.
7. Indexer A returns all known candidates; Indexer B omits Carol.
8. Policy P uses due-weight/source evidence; policy Q displays raw plurality.
9. Both comparisons run against pinned inputs.
10. A guest opens semantic and exact links.
11. The application is reconstructed from an exported bundle with the original service offline.
12. NIP-54 import/export preserves raw Nostr events and observations.

### Required observations

- Both reader results explain candidate basis and differences.
- Neither calls an index miss nonexistence.
- The vouch for Alice v1 does not transfer to v2.
- The two labels remain distinct evidence; policy chooses consequences.
- No comparison is called consensus or neutral.
- Deterministic result replays exactly.
- LLM result discloses limits and stays attributable even if exact replay fails.
- The bundle reconstructs exact versions, schemas, citations, licenses, relationships, and receipts.
- Another client can operate without the original index/API/model.
- Imported Nostr signatures remain Nostr provenance, not silently upgraded to KEL authority.

### Falsification conditions

Evidence of a generic substrate/design gap includes:

- private coordination needed to decode records;
- incompatible schema IDs or encodings across clients;
- no bounded way to discover records of a known type/topic;
- no exact immutable citation;
- no way to bind policy output to basis/inputs;
- false completeness through an ordinary hosted endpoint;
- inability to carry the workload through the preservation bundle;
- unavoidable unsafe rendering or ambient app authority;
- venue admission changing portable record identity;
- inability to distinguish signer from attributed person/AI.

## Questions for the owning design passes

### Portable schema pass

1. What exact schema language covers these six record types?
2. Is the minimal onchain-decodable profile sufficient, or is a richer offchain profile required?
3. Which checks are deterministic structural validity versus stateful venue admission?
4. How are schemas versioned, forked, extended, aliased, and searched?
5. Does the workload force a generic `SCHEMA` kind, or can DATA+TAGDEF preserve the developer path?
6. How does EAS schema/attestation import preserve chain-local provenance without becoming the portable identity?

### Candidate lens replacement work

1. Can candidate `DISCOVERY/1 + ADVISORY/1 + View` express a plural page without a new profile?
2. Which vouch/WoT signals may affect discovery, and which require explicit authority adoption?
3. Can a policy select or consume an attributable due-weight artifact without making it universal protocol policy?
4. Which policy, basis, result, and provenance facts can current View/receipts actually bind?

### App/enhanced derived-artifact work

1. How does an attributable ranker disclose why an entry ranked and what was omitted, and how may a candidate policy consume that output?
2. What provenance artifact is needed for clustering, bridge scoring, or AI comparison?
3. How are nondeterministic/proprietary-model limits represented?
4. How do these artifacts remain replaceable without becoming correctness dependencies?

### Guest/Client

1. What verifies before first paint?
2. What exact sentence replaces “no perspectives exist” when an endpoint returns none?
3. Can a deep link select a location/presentation without loosening the user's trust?
4. How does the UI separate signed author, attributed person, quote, and AI?
5. What safe rendering profile handles Djot/Markdown/HTML and app actions?
6. Can reactions remain local/private?

### Collaboration/preservation

1. How do exact diffs and merge-request state survive?
2. How are topic collisions, aliases, splits, and disputed merges represented?
3. What does an exit bundle contain, and can generic tools inspect it?
4. Which operators must exist for a credible neutrality claim?
5. What walk-away drill proves the product survives the primary project's disappearance?

### Moderation/governance

1. What can an author withdraw or tombstone without claiming erasure?
2. How do gateways disclose legal/safety unavailability?
3. How are default labelers/reader policies selected, changed, and escaped?
4. What appeal/dispute records are portable?
5. How does funding/subsidy disclose its effect on content supply?

## Boundaries — what should remain application-level unless falsified

Do not add these to the kernel merely because a plural encyclopedia needs them:

- topic-page UI;
- editorial style;
- stance vocabularies;
- ranking and recommendation algorithms;
- due-weight calculation;
- clustering and bridge scoring;
- AI comparison;
- moderation labels;
- default curator packs;
- identity credential providers;
- Wikipedia/Nostr ingestion;
- notifications/feeds;
- funding;
- language-specific aliases;
- peer-review workflow.

The generic substrate should make them:

- portable where interoperability matters;
- signed or attributable;
- versioned;
- independently replaceable;
- inspectable;
- impossible to confuse with protocol truth.

## Recommended routing

1. Add the six-record trace to the portable-schema pass's workload.
2. Reuse it in the candidate lens acceptance suite without adopting an LP answer.
3. Route WF-7 ranking, clustering, and synthesis provenance to app/enhanced derived-artifact work; candidate lenses only select or consume those outputs.
4. Reuse the guest semantic/exact link in `AMBIENT/1` and Client deep-link tests.
5. Reuse the revision/fork/citation trace in the public-collaboration cookbook.
6. Reuse the export/reconstruction trace in the normative `.efs-bundle` work.
7. Reuse the hostile content in the Client third-party-app safety workload.

Do not:

- create a milestone;
- declare EFS can already ship this;
- add a Wikifreedia-specific kind;
- choose the generic schema carrier in this review;
- promote draft lens/KEL/guest mechanisms;
- commit EFS to a flagship knowledge product.

The highest-leverage outcome is a generic design that can pass this trace and several unrelated application traces with the same primitives.
