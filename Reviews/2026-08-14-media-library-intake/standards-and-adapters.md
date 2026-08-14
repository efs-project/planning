# Media standards and adapter boundary

**Status:** current primary-source research as of 2026-08-14; standards do not
select an EFS application schema
**Date:** 2026-08-14

#status/done #kind/research #repo/planning #topic/content #topic/media-library

## Bottom line

No portable booru interchange standard emerged from the primary-source review.
That is an inference from the different first-party models and APIs of Danbooru,
e621 and Hydrus, not a claim that no undocumented converter exists.

The smallest defensible interoperable spine is exact digest + byte length,
deterministic manifest bytes, separate source observations, and loss-preserving
adapters. Media interpretation, tags, rights, moderation, federation and
perceptual matching remain above Core.

## High-leverage standards

| Area | Current source/status | Reuse | Boundary |
|---|---|---|---|
| HTTP digests | [RFC 9530](https://www.rfc-editor.org/rfc/rfc9530.html), Standards Track; [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html), Internet Standard | algorithm-tagged SHA-256, byte length, `Content-Digest` for returned content and `Repr-Digest` for the selected representation | digest headers are not authenticated by themselves; ETags are opaque validators, not content identity |
| Verifiable ranges | [IPFS Trustless Gateway](https://specs.ipfs.tech/http-gateways/trustless-gateway/), living reliable spec; [BitTorrent v2 BEP 52](https://www.bittorrent.org/beps/bep_0052.html), Draft | CAR entity ranges or another declared Merkle-piece profile can prove a range against a committed whole | HTTP 206 plus a digest of the returned slice does not prove whole-object membership |
| Packaging/preservation | [BagIt RFC 8493](https://www.rfc-editor.org/rfc/rfc8493.html), Informational; [OCFL 1.1](https://ocfl.io/1.1/spec/); [WARC 1.1](https://iipc.github.io/warc-specifications/specifications/warc-format/warc-1.1/) | BagIt + SHA-256 as minimum export package; OCFL for versioned preservation; WARC for acquisition context | export/preservation adapters, not the Core object model |
| Image/video metadata | [IPTC Photo Metadata 2025.1](https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata-2025.1.html); [IPTC Video Metadata Hub 1.7](https://iptc.org/standards/video-metadata-hub/); [Exif 3.1](https://www.cipa.jp/e/std/std-sec.html); [XMP](https://developer.adobe.com/xmp/docs/xmp-specifications/) | retain creator/source/rights and technical observations with extractor identity/version | preserve original bytes; sanitized or re-encoded output is a new derivative |
| Provenance | [C2PA 2.4](https://spec.c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html), evolving consortium spec | retain embedded/sidecar manifests, hard bindings, soft bindings and validation results | a valid signature proves an assertion by a signer, not identity, rights or consent truth; soft bindings are discovery candidates |
| Rights/policy vocabulary | [SPDX 3.0.1 Licensing](https://spdx.github.io/spdx-spec/v3.0.1/model/Licensing/Licensing/); [ODRL 2.2](https://www.w3.org/TR/odrl-model/), W3C Recommendation; [Creative Commons ccREL](https://wiki.creativecommons.org/images/d/d6/Ccrel-1.0.pdf) | reuse stable license identifiers and attributed policy expressions where they fit; retain source wording and evidence | vocabulary is not proof of ownership, consent or legal validity; SPDX is software-oriented and cannot represent every media-rights situation |
| Tags/annotations | [SKOS](https://www.w3.org/TR/skos-reference/), [Web Annotation](https://www.w3.org/TR/annotation-model/) and [Media Fragments](https://www.w3.org/TR/media-frags/), W3C Recommendations | vocabulary IDs and labels; attributed region/temporal annotations | booru implication is directional policy, not automatically `skos:broader`; alias is not automatically semantic equality |
| Duplicate candidates | [ISO 24138:2024 ISCC](https://www.iso.org/standard/77899.html) and [reference implementation](https://github.com/iscc/iscc-core) | one versioned perceptual candidate method | exact identity remains a full cryptographic digest + length; perceptual output never authorizes merge/deletion |
| Presentation | [IIIF Presentation 3.0](https://iiif.io/api/presentation/3.0/) | optional canvases, rights statements, annotations and interoperable views | useful projection, not fixity/preservation or booru semantics |
| Federation | [ActivityPub](https://www.w3.org/TR/activitypub/) and [ActivityStreams 2.0](https://www.w3.org/TR/activitystreams-vocabulary/), W3C Recommendations | optional distribution of updates | not required by the smallest fixture and does not supply fixity or media relations |
| Selective disclosure | [SD-JWT RFC 9901](https://www.rfc-editor.org/rfc/rfc9901.html), Standards Track | optional disclosure of credential claims | cannot hide public digests, retract bytes, sanitize metadata or prevent exact/perceptual correlation |

## Booru and personal-library adapter inputs

- [Danbooru source](https://github.com/danbooru/danbooru)
- [e621 source](https://github.com/e621ng/e621ng)
- [Hydrus Client API](https://hydrusnetwork.github.io/hydrus/developer_api.html)

Adapters should preserve posts/source IDs, categorized tags, tag aliases and
implications, histories, pools/order, notes/geometry, parent/replacement state,
ratings/warnings, source URLs and deletion state. Danbooru/e621 MD5 values are
legacy crosswalk evidence, not the EFS exact-identity floor. Hydrus storage tags,
display tags and duplicate-relation states must not be flattened.

## Reusable interoperability requirements

1. Every blob row contains digest algorithm, full SHA-256, exact byte length and
   the EFS exact commitment. Recompute after transport and before acceptance.
2. Every source observation separately records source system, remote ID,
   revision/change sequence where available, retrieval time and precision,
   source URLs, reported hashes, and a digest of an exact retained public
   response-body/source-record artifact. Public evidence is screened before
   retention; cookies, authorization data, request/client identifiers, private
   Locators and unscreened HTTP headers are excluded.
3. Every manifest declares schema/profile version and hashes or signs its exact
   bytes. If semantic JSON identity is needed, pin [RFC 8785 JCS](https://www.rfc-editor.org/rfc/rfc8785.html)
   and reject duplicate keys, invalid Unicode, unsafe paths and ambiguous
   normalization.
4. A range verifier checks status, `Content-Range`, total size and returned bytes.
   Untrusted range membership requires a versioned chunk/Merkle profile and root.
5. Original EXIF/IPTC/XMP/C2PA bytes remain retained. Extraction is a versioned
   observation; stripping or re-encoding creates a distinct derivative.
6. Rights carry asserted-by, asserted-at, scope, rights URI or statement and
   evidence reference, including explicit `NOASSERTION`.
7. Tags have namespace-scoped stable IDs; labels are separate; aliases and
   implications are directional, versioned, sourced and reviewable.
8. Exact duplicate, decoded-content equality, perceptual candidate and human
   duplicate judgment are four distinct states.
9. Export a SHA-256 BagIt package containing normalized records plus retained,
   privacy-screened exact response-body/source-record snapshots. IIIF and WARC
   are optional projections/evidence packages.
10. Each importer/exporter is versioned and has a round-trip loss report; no
    normalized success may discard source information silently.

## Highest-risk tests

- JSON duplicate keys, Unicode, negative zero/large numbers, array order, path
  traversal, case sensitivity and canonicalization-version drift;
- content encodings, final partial chunks, wrong totals, omitted/surplus blocks
  and proof malleability during range verification;
- EXIF orientation, ICC profiles, alpha, animation, variable-frame-rate video,
  multiple audio tracks and subtitles across exact/decoded/perceptual identity;
- perceptual false positives/negatives, adversarial robustness and version drift
  on the actual fixture corpus;
- lossless tag-category, alias/implication-cycle, note-geometry, pool-order,
  replacement and deletion round trips;
- offline C2PA trust, certificate revocation, timestamps, and UI wording that
  might mistake a valid assertion for proof of rights or consent; and
- GPS, device serial, legal identity, private URL, credential, hidden-tag,
  blacklist and retrieval-interest leakage.
