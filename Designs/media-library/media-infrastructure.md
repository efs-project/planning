# Shared media infrastructure

**Status:** draft
**Target repos:** planning, contracts, sdk, client
**Depends on:** [[Designs/efsv2/README]], [[query-and-indexing]]
**Reviewers:** 2026-08-14 — independent authority/architecture pass; no Critical or Important finding after repair
**Last touched:** 2026-08-14

#status/draft #kind/design #repo/planning #repo/contracts #repo/sdk #repo/client #topic/media-library #topic/content #topic/privacy #topic/read-path

## Problem

Images, video, audio, documents and playable media need one durable foundation
without pretending they are all one application. A Booru needs plural public
tagging and fast discovery; a Plex/Jellyfin system needs private scanning,
playback and device-specific transformations. Building separate identity,
verification and export stacks would make the same bytes mean different things
in each product and would make exit depend on whichever operator won.

The foundation must also avoid the opposite mistake: putting media-specific
objects, codec policy, moderation or recommendation logic into generic EFS
Core. The completed [[Reviews/2026-08-14-media-library-intake/fixture-pressure-map|fixture pressure map]] has not demonstrated such a Core gap.

## Scope

This design owns the common application layer between generic EFS and media
products:

- honest media identity and relationships;
- exact and range-verifiable bytes;
- provenance, rights and source observations;
- derived representations and duplicate evidence;
- plural authored claims and ordered collections;
- local/private overlays;
- import, export and independent reconstruction;
- query-provider and verified-reader interfaces; and
- application-visible error and completeness states.

It does not own Booru workflow, Plex household/player workflow, one public
Realm, one canonical tag vocabulary, storage economics, codec implementation,
moderation policy or recommendation algorithms.

## Requirements

The canonical detailed ledger remains
[[Reviews/2026-08-14-media-library-intake/evidence-and-requirements]]. This
table selects the foundation requirements needed by both products.

| ID | Requirement | Acceptance direction |
|---|---|---|
| MEDIA-01 | Creative Work, authored Edition/Release, Representation, Exact Blob, Source Observation, Post/Submission and current selection remain distinct identities. | A fixture can change one without changing the others; two source observations may reference one blob without merging provenance. |
| MEDIA-02 | Every Exact Blob binds algorithm-tagged digest, exact length and, when needed, a chunk/range commitment independently of every Locator. | Whole-byte and arbitrary-range corruption reject before render/play. |
| MEDIA-03 | Original, crop, thumbnail, poster, preview, remux, transcode, subtitle rendition and alternate encode are distinct Representations/Exact Blobs linked by attributable derivation evidence. | No transformation overwrites or impersonates its input. |
| MEDIA-04 | Source, creator, rights, consent, retrieval and availability statements remain separate attributable evidence with explicit uncertainty. | Deduplication preserves all observations; `NOASSERTION` is not silently upgraded. |
| MEDIA-05 | Tags, ratings, warnings, moderation decisions, duplicate judgments and collection membership are authored claims rather than one globally mutable truth row. | Conflicting authors survive export and reconstruction. |
| MEDIA-06 | Exact duplicate, decoded-equivalence, perceptual similarity and human judgment remain separate evidence classes. | Only exact equality may automatically reuse bytes; no probabilistic result transfers tags or merges identity. |
| MEDIA-07 | Private tags, collections, paths, Locators, watch state and household state work without a Core write. | Public artifacts and public indexes contain none of the private fixture markers or digests. |
| MEDIA-08 | Locators are plural, replaceable observations. Retrieval emits only verified bytes and reports unavailable, mismatch, partial and unknown honestly. | Corrupt preferred source rejects; verified fallback succeeds without identity drift. |
| MEDIA-09 | Ordered collections retain target version, position, author and history. | The same shape can represent a gallery pool or playlist without asserting shared Work identity. |
| MEDIA-10 | Import is resumable, idempotent and loss-preserving; export is conventional and sufficient for a second implementation. | Every input has a success/skip/quarantine/failure receipt; clean-room reconstruction needs no original app DB. |
| MEDIA-11 | Public derived search is replaceable and never authoritative; exact inspection and bounded browse survive its loss. | Core/client results expose Realm, basis, cursor, coverage and completeness; Graph outage is not rendered as zero matches. |
| MEDIA-12 | Media loading policy runs before thumbnail, preview, original or range requests. | Hidden or blocked media creates no eager network request. |

These restate `ML-ID-*`, `ML-TAG-*`, `ML-SAFE-*`, `ML-PRIV-*`, `ML-QRY-*`,
`ML-BYTE-*` and `ML-OPS-*`; they are not a second normative ledger.

## Proposed conceptual model

Names below are explanatory application-profile names, not frozen EFS Types.

```text
CreativeWork
  ├─ AuthoredEdition / ReleaseClaim
  ├─ Post / Submission                  public presentation/intake identity
  ├─ Representation                    original, preview, encode, subtitle, ...
  │    └─ ExactBlob                    digest + length + optional chunk tree
  │         ├─ LocatorObservation      where bytes may be retrieved
  │         └─ AvailabilityObservation what one observer saw at one time
  ├─ DerivationClaim                   input → output + recipe/tool/version
  ├─ SourceObservation                 upstream page/post/revision/evidence
  ├─ RightsClaim                       attribution/license/scope/evidence
  ├─ ClassificationClaim               tag/rating/warning/denial
  ├─ DuplicateEvidence                 exact/decoded/perceptual/human
  └─ Annotation                        region/time/text/language/author

OrderedCollection
  └─ OrderedEntry                      target + version + position + author
```

### Identity rules

1. **Work is not bytes.** A Work can outlive one file and have multiple
   authored editions and representations.
2. **Representation is not exact blob.** The role “1080p direct-play WebM” is
   distinct from the digest of one exact encoding.
3. **Post is not Work.** Two communities may create separate submissions for
   the same Work or Exact Blob, preserving uploader, source, discussion and
   moderation histories.
4. **Locator is not identity.** HTTP, IPFS, Arweave, EFS inline bytes, a home
   server or removable media may all locate the same blob.
5. **Selection is not identity.** “Preferred poster” or “current edition” is an
   authored statement or bounded Binding at an explicit purpose and basis.
6. **Similarity is not equality.** Perceptual methods produce versioned
   evidence and review candidates only.

The exact existing fixture exercises these separations; see
[[Reviews/2026-08-14-media-library-intake/candidate-fixture-evidence]].

## Mapping to generic EFS

| Media responsibility | Generic EFS candidate | Media-layer responsibility |
|---|---|---|
| Portable typed fact | Type + author-neutral Record | define versioned media profile and validation |
| Authorship/provenance | signed Envelope/Context + Occurrence | preserve actor role, source and evidence references |
| Realm inclusion | admission receipt | show Realm, policy and basis; never invent global admission |
| Exact lookup and graph navigation | declared equality/digest/reference/backlink indexes | choose only fields real media traces require and measure aggregate write/state cost |
| Current point selection | Principal-qualified Binding | define purpose such as preferred-poster or selected-edition; keep immutable history |
| Curator point policy | bounded contract Lens | keep wide gallery folds, rankings and moderation composition above Core |
| Exact bytes | ByteDigest/ChunkTree proposal plus content carriers | verify whole/range bytes before release to decoder/player |
| Location | Locator and availability observations | fetch, rotate, retry, grade and disclose observers |

The B0 names and algorithms in
[[Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators]] and
[[Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes]] are proposal-only
engineering inputs until Stage B.

## Components and interfaces

### Media profile registry

Consumes a generic EFS profile/Type registry and exposes the application
profile versions understood by a client. It validates body shape, relationships
and profile-local invariants without minting a canonical global vocabulary.

Tentative read interface:

```text
loadMediaObject(recordId, realm, basis)
  -> VERIFIED(MediaObject, witnesses)
   | INVALID(reason)
   | UNKNOWN(reason, coverage)
```

`VERIFIED` means the selected profile and exact evidence checked. It does not
mean a rights claim is legally true or a curator statement is endorsed.

### Verified media resolver

Inputs:

- Exact Blob commitment;
- requested whole file or byte interval;
- ordered, policy-filtered Locator observations; and
- verification profile and resource budget.

Outputs:

```text
NOT_REQUESTED
FETCHING
PARTIAL_VERIFIED
COMPLETE_VERIFIED
UNAVAILABLE
MISMATCH
UNKNOWN
```

The labels are application vocabulary, not frozen wire codes. The resolver
never hands an unverified interval to a decoder. Whole-file hashing is
sufficient for small files. Seeking and streaming require a fixed chunk/Merkle
profile; an HTTP `206` response alone proves transport range, not membership in
the committed whole.

The Stage A passive-range machine in
[[Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-content-locators]] and the
host-neutral range contract in
[[Designs/efsv2/mountable-filesystem-semantics]] are the principal inputs.

### Derivation and media-processing worker

Thumbnailing, metadata sanitation, waveform generation, remuxing and
transcoding consume verified inputs and produce:

- a new Exact Blob;
- a declared representation role and media type;
- recipe/tool/version and relevant environment evidence;
- source and output digests/lengths; and
- a Derivation Claim joining input to output.

Ephemeral streaming segments may remain explicitly disposable session output.
Anything presented as a stable reusable representation must be independently
identifiable and reproducible or retained as exact bytes with honest limits.

The integrity contracts differ:

- a direct or retained Representation is released only from exact committed
  chunks/bytes verified before decoder consumption; and
- an ephemeral transform verifies committed **input** chunks before processing,
  then relies on an authenticated/trusted worker and session transport. Its
  output is not an exact EFS Representation until the output closes, is hashed
  and is deliberately retained.

### Query provider

All clients consume one result contract while implementations vary:

```text
search(queryAst, realmSet, basis, page)
  -> items + nextCursor + coverage + completeness + providerIdentity
```

Provider families are:

1. direct Core/index reads;
2. bounded onchain view/query contracts; and
3. the reference The Graph fallback after the first two fail a measured trace.

See [[query-and-indexing]]. Private overlays may join results locally but are
never sent to the public provider without a separate user action.

### Local/private overlay

At minimum:

- private tags, ratings and collections;
- viewer blacklist and policy;
- watch progress, history and playback choices;
- unpublished server paths and Locators; and
- draft import, rights and moderation material.

Storage technology, sync and encryption remain application decisions. A local
plaintext database is private only relative to publication; same-origin code,
the host, backups or malware may still read it. Encryption must separately
describe key recovery and metadata leakage.

### Import/export and reconstruction

Importers retain raw source identities and versioned adapter output. They do
not flatten a Danbooru post, Jellyfin item or local file directly into one
canonical media row. Every transformed value links to the raw observation that
produced it.

The shared walk-away floor is:

- normalized versioned records;
- exact digest and length manifests;
- privacy-screened source/adapter evidence;
- exact media or declared external references;
- explicit profile and tool versions; and
- enough fixtures/tests for a second implementation to rebuild the selected
  public view.

SHA-256 BagIt is the current conventional package recommendation; it is an
export format, not the Core data model. See
[[Reviews/2026-08-14-media-library-intake/standards-and-adapters]].

## Data flows

### Local ingest

1. Discover a local file or selected external source.
2. Stage it without publication.
3. Compute exact digest/length and technical observations.
4. Detect duplicates and possible privacy/rights hazards.
5. Produce previews or derived representations from verified input.
6. Record an enumerated import receipt.
7. Add private organization locally.
8. Stop unless a separate publication/export action is requested.

### Deliberate public publication

1. Select exact Work/Edition/Representation/Blob and source evidence.
2. Review rights, safety, metadata and Locator exposure.
3. Separate sensitive/private context from the public batch.
4. Precompute portable IDs and show the exact public payload.
5. Sign and submit through generic EFS admission.
6. Verify the receipt and automatic index coverage.
7. Update public query providers from the admitted evidence.
8. Export a reconstructable public package.

### Read and play

1. Resolve a known ID or search through a provider with explicit coverage.
2. Apply viewer and safety policy before requesting any media.
3. Choose a representation compatible with the surface/device.
4. Fetch from a permitted Locator.
5. Verify the whole blob or requested range.
6. Only then render, decode or execute.
7. Keep personal activity local unless deliberately shared.

## Failure and honesty rules

- `UNKNOWN`, incomplete coverage and provider failure never become “no result.”
- A valid record with unavailable bytes stays visible as metadata with an
  unavailable-media state.
- A digest mismatch blocks only the affected Exact Blob/Locator observation;
  it does not erase the Work or silently accept a fallback without verification.
- Loss of a disposable index triggers rebuild or degraded bounded browsing;
  it does not delete canonical inputs.
- Loss of private state is reported as loss, not reconstructed from public
  behavior or analytics.
- A rights or moderation claim is evidence, not a protocol warranty.
- A public byte may remain retrievable after one operator hides it. Product
  copy and operations must not promise global deletion.

## Acceptance program

### Existing exact seed

Retain the current A/A-prime/V fixture with two conflicting curators, one
private relationship, exact and perceptual duplicate evidence, provenance,
rights, corrupt-primary fallback, verified video ranges and clean-room
reconstruction. Do not replace it with a prose-only example.

### Next shared tests

- two implementations derive every application ID from the same profile;
- whole-file and first/middle/final/cross-chunk range vectors agree;
- a crop, thumbnail, remux and transcode never collide with their input;
- import reruns are idempotent and preserve skipped/quarantined records;
- public export contains no private marker, digest, path or Locator;
- deleting every project cache/index still permits reconstruction from declared
  inputs;
- one Locator corrupts, one is unavailable and one verifies;
- a viewer policy blocks the media request before any thumbnail fetch; and
- Booru and Plex surfaces resolve the same Work/Blob identities.

Scale, gas and operational gates are owned by [[query-and-indexing]],
[[booru-app]] and [[plex-jellyfin-app]].

## Limitations

- No profile body, Type ID, Record ID or Realm is frozen.
- No universal media metadata schema exists; adapters will be lossy unless raw
  source evidence and unmapped fields survive.
- Exact fixity proves bytes, not meaning, authorship, legality or availability.
- Incremental verification does not make every codec safe to decode.
- Private local state is outside onchain reconstruction unless the user exports
  it; encrypted export introduces key-loss and metadata-leakage risks.
- Shared ordered membership does not make a playlist, season and booru pool
  semantically identical; each application adds validation and presentation.
- The current experiment is browser-only and cannot prove reliable folder
  watching, broad codec support or live transcoding.

## Open questions

- [ ] Which minimum application profiles belong in Foundation Slice 1 without
      freezing every later Booru/Plex field?
- [ ] Which chunk/range profile survives independent implementations and
      browser, home-server and mount performance tests?
- [ ] Which event/state surface lets a reference subgraph reconstruct every
      public media query result without granting it semantic authority?
- [ ] Which metadata fields are safe enough for public automatic indexes under
      the adopted public-by-default policy?
- [ ] What export profile preserves private state without overstating
      encryption, recovery or secure deletion?

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] `**Target repos:**` confirmed
- [ ] Dependencies are accepted/landed or explicitly treated as provisional
- [ ] No `<!-- AGENT-Q: -->` comments remain
- [ ] At least one `#status/review` pass receives another agent or human review
