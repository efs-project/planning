# EFS Media Library / Booru intake

**Status:** completed evidence intake; non-authoritative product research
**Date:** 2026-08-14
**Scope:** tagged image, video, and media-database use case for EFS 2.0

#status/done #kind/research #repo/planning #topic/content #topic/efsv2 #topic/requirements #topic/privacy #topic/media-library

> This packet does not adopt an application schema, change the EFS 2.0 spine,
> freeze Core bytes, select a Realm, authorize a public corpus, or start an
> implementation. It separates verified project state, prior research
> recommendations, candidate fixture obligations, and open product choices.

## Verdict

Every media-library obligation tested so far maps to the current generic EFS
2.0 candidate without a media-specific Core kind, contract, or index. No exact
failure trace currently demonstrates a media-specific Core gap.

The product burden sits above Core: creative-work and representation profiles,
tag vocabularies and claims, rights/provenance profiles, private/local state,
replaceable search and similarity indexes, import/export adapters, moderation
policy, and user experience.

Three conditional mismatches remain useful falsifiers, not present Core gaps:

1. a hidden private relationship that is nevertheless completely enumerable
   from public Core;
2. a contract requirement for wide set-valued curator-policy resolution; and
3. a contract requirement for an open-set distinct-Principal endorsement count.

The current layer boundary routes all three to above-Core candidate
dispositions; none currently demonstrates a Core gap. See
[[fixture-pressure-map]].

## Authority register

### Owner-adopted direction

- EFS 2.0 is the one greenfield successor; v1, EAS, and the July tag/Core
  mechanisms are evidence, not inherited requirements.
- Standalone Core, optional Commons, a self-hostable direct guest Web Client,
  reusable Files behavior, and optional EFS OS are the current layer boundary.
- Core must earn bounded automatic typed/equality/backlink/current reads and a
  bounded contract Lens; exact mechanisms remain engineering questions. Rich
  search, ranking, moderation, and private policy do not become arbitrary Core
  execution.
- Public on-chain metadata is public. Sensitive or private plaintext is handled
  before signing or publication.

Sources: [[Designs/efsv2/owner-rulings]],
[[Designs/efsv2/system-constitution]], and
[[Designs/efsv2/owner-decision-inbox]].

### Proposal-only engineering state

[[Reviews/2026-08-13-efs2-stage-a-corpus/STATUS]] reports Stage A complete as a
specification/evidence package and, at that handoff, reported Stage B unrun. A
separate disposable local repository has since executed a partial
Stage-B-oriented generic corpus preflight at commit `ad35926` (14 domains, 3
Types, 5 Records; a clean archive verification in this pass produced 5 passing
Bun tests, 3 passing Rust tests and a successful corpus check). It is not
execution of the Stage B program defined by the Stage A status, and it does not
implement `ByteDigest/1`, `ChunkTree/1`, media Types, gas/state measurements,
independent reconstruction, freeze or deployment. The B0 content and fixture
chapters therefore remain proposal inputs, not adopted protocol.

### Mature research recommendation, not an owner ruling

The strongest prior product recommendation is a **creator-consented portable
booru**: creators or authorized stewards publish exact intentional editions;
independent curators add attributable tags, collections, warnings, and source
facts; multiple Lenses preserve disagreement; mirrors can change without
identity drift; and a second operator can reconstruct the useful catalog.

The acquisition boundary is firm: do not seed by scraping boorus, imageboards,
creator platforms, or adult archives. Use synthetic media or a directly
authorized or operator-reviewed open/public-domain proof corpus with attributed
rights evidence and residual caveats. See
[[Reviews/2026-07-29-target-communities/gallery-opportunity-ranking-and-launch-plan]].

## Product clarification before design

One choice changes the charter, first fixture presentation, and MVP acceptance
tests:

- **Personal/local-first:** a personally useful private library can explicitly
  promote reviewed objects into a deliberately operator-reviewed public
  edition with attributed rights evidence and residual caveats.
- **Public-gallery-first:** an anonymous guest can browse that deliberately
  reviewed proof gallery, with personal/private features added around it.

The intake recommendation is **personal/local-first**. It creates immediate use,
makes privacy an honest default rather than a late exception, and still includes
a narrow public share/export path that tests guest reads, plural curation,
verified retrieval, and walk-away reconstruction.

This media-use-case recommendation is evidence input to the existing `V2-F2`
first-product implementation-scope decision, not a new Core decision or owner
inbox item. Committing this packet neither confirms the ordering nor answers
`V2-F2`.

## Contents

- [[product-charter-and-roadmap]] — common product charter, smallest useful MVP,
  staged exit gates and the unconfirmed media-use-case ordering input to
  `V2-F2`.
- [[evidence-and-requirements]] — authority-aware source inventory and retained
  product requirements.
- [[fixture-pressure-map]] — smallest fixture obligations, generic-Core map,
  exact conditional failure traces, and measurement gates.
- [[standards-and-adapters]] — current primary standards, ecosystem adapter
  boundary, and interoperability requirements.

## Provenance and method

The pass read the root and planning agent instructions, current EFS 2.0 spine,
owner rulings and evidence queue, Stage A status and B0 chapters, client-v2
status map, prior gallery/adult-safety/large-file/privacy research, v1 content
practice, and corrected August evidence. Three independent read-only lanes
covered prior-art inventory, current-Core pressure mapping, and current
standards/interoperability. The intake began from a planning checkout clean and
equal to `origin/main` at `ffef1be`; it was refreshed over `8b81bdd` before the
exact-candidate and Stage B observations were reviewed.
