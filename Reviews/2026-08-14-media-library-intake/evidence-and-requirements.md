# Media-library evidence and retained requirements

**Status:** evidence synthesis; requirements are adopted only where the source
authority says so
**Date:** 2026-08-14

#status/done #kind/research #repo/planning #topic/content #topic/requirements #topic/media-library

## Source precedence

| Source | Standing in this packet | What it contributes |
|---|---|---|
| [[Designs/efsv2/owner-rulings]] | owner-adopted direction | greenfield reset, layer boundary, automatic bounded indexes, contract Lens and direct guest reads |
| [[Designs/efsv2/system-constitution]] | current draft requirements synthesis | identity separation, typed graph, honest reads, content/Locator boundary, privacy and large-content acceptance traces |
| [[Designs/efsv2/owner-decision-inbox]] | live evidence queue | measurement gates; no immediate mechanism decision |
| [[Reviews/2026-08-13-efs2-stage-a-corpus/STATUS]] and B0 chapters | proposal-only engineering evidence | exact candidate interfaces, fixtures, falsifiers and known gaps; Stage B unrun |
| [[Reviews/2026-07-29-target-communities/visual-gallery-and-booru-ecosystems]] | completed research judgment | booru mechanics, rights contradiction, plural curation and missing product work |
| [[Reviews/2026-07-29-target-communities/gallery-opportunity-ranking-and-launch-plan]] | completed recommendation, not ruling | creator-consented product shape, 10k/1m workload, intake gates and kill criteria |
| [[Designs/clientv2/README]] and linked July client docs | historical client/OS evidence | offline, cache, Files and privacy hypotheses requiring revalidation under the direct-client split |
| v1 contracts/content practice | deployed/reference evidence only | additive tags, exact-hash hints, mirrors and provenance patterns that must re-earn v2 inclusion |

## Retained product requirements

Labels mean:

- **A** — required by current owner-adopted direction or constitution-level
  acceptance obligation;
- **R** — strong research recommendation, not yet an owner ruling; and
- **T** — test obligation needed to distinguish a claim from a working product.

### Identity and media graph

| ID | Label | Requirement | Likely layer |
|---|---|---|---|
| ML-ID-01 | A | Stable creative-work identity, exact blob identity, representation identity, authored publication, source submission and current selection remain distinct. | application profile over generic Core |
| ML-ID-02 | A | Every exact blob has an algorithm-tagged digest, exact byte length and a verifiable EFS commitment independent of Locator or storage provider. | content profile + client |
| ML-ID-03 | R | Original, crop, edit, thumbnail, poster, preview, transcode, animation and alternate encode are separate exact blobs joined by attributable typed relations. | application profile |
| ML-ID-04 | R | A second source post that resolves to the same bytes retains its own source identity and provenance; deduplication never erases source observations. | importer + application profile |
| ML-ID-05 | R | Decoded-content and perceptual similarity are versioned evidence only. They never silently merge exact identity, delete an object, or transfer tags. | local/replaceable analysis + claims |

### Authorship, tags and collections

| ID | Label | Requirement | Likely layer |
|---|---|---|---|
| ML-TAG-01 | A | Publisher, curator, mirror observer, rights claimant and moderator remain attributable authors of separate Occurrences. | generic Core |
| ML-TAG-02 | R | Tag concepts have stable namespace-scoped identities; lexical labels and translations do not define identity. | media vocabulary profile |
| ML-TAG-03 | R | Categories, aliases, implications and replacements are directional, versioned, sourced and reviewable; raw imported terms remain recoverable. | vocabulary profile + adapters |
| ML-TAG-04 | R | Conflicting assertions remain visible. A Lens or local policy may select a view but must not rewrite disagreement into one canonical truth. | client/OS Lens policy |
| ML-TAG-05 | R | Ordered pools, galleries, parent/child relations, annotations and playlists preserve order, target version, author and history. | application profiles |
| ML-TAG-06 | T | Measure one-claim-per-Record against bounded assertion sets under realistic p50 35 / p95 100 tags per public item. | Stage B application workload |

### Rights, safety and moderation

| ID | Label | Requirement | Likely layer |
|---|---|---|---|
| ML-SAFE-01 | R | Public bytes enter only through creator/rightsholder/steward authorization or an unambiguous open/public-domain basis; online availability is not permission. | intake operations + client ceremony |
| ML-SAFE-02 | R | Local staging detects unsupported formats, metadata leakage, duplicates, missing rights facts and policy hazards before any irreversible publication. | importer/client |
| ML-SAFE-03 | R | Rights, consent and provenance are attributable claims with evidence, scope and explicit `NOASSERTION`; validation does not silently turn them into legal truth. | profile + presentation policy |
| ML-SAFE-04 | A | Lenses and gateways may warn, blur, omit or refuse service. They cannot promise deletion of public bytes, establish rights/consent, or discharge operator duties. | client/gateway/operations |
| ML-SAFE-05 | R | Sensitive contracts, releases, legal identities, addresses, abuse reports and similar evidence stay private unless separately and deliberately authorized. | local/encrypted store |
| ML-SAFE-06 | R | Viewer safety policy runs before thumbnail, preview or original fetch so hidden-media requests do not leak through eager loading. | client/gateway |

### Privacy and personal use

| ID | Label | Requirement | Likely layer |
|---|---|---|---|
| ML-PRIV-01 | A | A local-only tag, rating or collection is useful without any Core write. | local application state |
| ML-PRIV-02 | A | Encrypted portable state discloses its authorship, timing, graph and retrieval leakage honestly; ciphertext does not imply hidden relationships or interest privacy. | client/OS privacy profile |
| ML-PRIV-03 | A | Public and private material do not share a signed batch/context when that linkage defeats the privacy boundary. | SDK/client conformance |
| ML-PRIV-04 | T | Export, loss and key-rotation tests distinguish recoverable encrypted archives from intentionally shreddable state. | future privacy/crypto profile |

### Query, indexing and presentation

| ID | Label | Requirement | Likely layer |
|---|---|---|---|
| ML-QRY-01 | A | Core supplies bounded exact Type/Record/scalar/digest/reference/backlink/current reads with Realm, basis, cursor, coverage and honest completeness. | generic Core |
| ML-QRY-02 | A | Multi-tag intersections, negative filters, full text, prefix search, similarity, visual search, ranking and recommendations remain local or replaceable enhanced services unless a contract trace proves otherwise. | replaceable index/client |
| ML-QRY-03 | R | At least two independent implementations can rebuild the enhanced index from portable public inputs; results disclose index identity, basis and coverage. | indexer + export format |
| ML-QRY-04 | A | Loss of the enhanced index may remove fast ranking or intersections, but never exact-item inspection, bounded collection browse or an honest `UNKNOWN/PARTIAL` result. | client fallback |
| ML-QRY-05 | R | The browsing grid never downloads originals merely to render cards; absent, unverified or policy-hidden previews remain explicit states. | client/media pipeline |

### Bytes, preservation and exit

| ID | Label | Requirement | Likely layer |
|---|---|---|---|
| ML-BYTE-01 | A | Locators are plural claims, not identity. A mismatching source is rejected and retrieval rotates without emitting unverified bytes. | content profile + client |
| ML-BYTE-02 | A | Video and other large passive media support resumable arbitrary-range verification with `PARTIAL`, `COMPLETE`, `MISMATCH`, `STALLED` and `UNKNOWN` states. | chunk profile + client |
| ML-BYTE-03 | R | Import preserves original embedded metadata and a raw source response or source-record digest; sanitized or re-encoded output is a new derivative. | importer + export |
| ML-BYTE-04 | R | Export contains normalized records, raw adapter evidence, exact manifests and byte fixity in a conventional package a non-EFS operator can inspect. | export adapter |
| ML-BYTE-05 | A/T | A second implementation and operator reconstruct the selected catalog and verify its media without the original app, hosted index or Commons. | acceptance harness |

### Import, scale and operations

| ID | Label | Requirement | Likely layer |
|---|---|---|---|
| ML-OPS-01 | R | Importers are versioned, resumable, idempotent and structure-preserving; every item ends with an enumerated success, skip, quarantine or failure receipt. | importer/SDK |
| ML-OPS-02 | R | Ecosystem-specific post IDs, tags, histories, pools, notes, ratings and deletion/replacement state survive round trips without flattening. | adapters |
| ML-OPS-03 | T | Measure 10k and synthetic 1m-item libraries, p50/p95 tag load, 1,000-tag personal blacklists, animated/video media, cache loss, mirror outage and cold guest browse. | fixture/harness |
| ML-OPS-04 | T | Report Core admission, tag assertions, derived media, enhanced indexes, byte storage, traffic, moderation and retention as separate cost centers. | measurement report |
| ML-OPS-05 | R | A public pilot names its steward, serving operator, at least two curators, at least two genuinely independent custody operators and a notice/appeal process before launch. | operations gate |

## Explicit non-requirements for the first design

- one official universal moderation Lens;
- a Core global trending, recommendation or perceptual-similarity oracle;
- public identity, age, release or abuse-report documents;
- automatic scraping of public boorus, imageboards or creator platforms;
- a promise that public plaintext can later be deleted;
- payments, subscriptions, private messaging or commission-marketplace scope;
- live-action adult user-generated content; and
- federation as a prerequisite for the smallest end-to-end fixture.
