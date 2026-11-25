# Sealed design hypothesis: where should a tag's hierarchy live?

**Status:** reference: @pm's reasoning and predictions, written on 2026-11-25 **before** reading any of the research notes in `research_notes/`, so the evidence can confirm or overturn it. Do not edit after the research returns; the comparison goes in the synthesis.
**Question from @james:** is a static hierarchy (the parent is part of a tag's identity) or parent-as-data (boorus) clearly better for EFS, given decentralized Schelling points, no authority, permanence and lenses?

#status/reference #kind/brief #repo/planning #repo/contracts #repo/sdk #repo/client

## What EFS needs (the yardstick)

1. **Schelling points:** strangers who never talk reach the same id for the same idea.
2. **No authority:** nobody can grant, rename, merge or delete a topic. Curation exists only as overlays chosen by each reader (the lens).
3. **Permanence:** links work forever; nobody's statement is ever rewritten.
4. **Readable links.**
5. **Readable from the chain alone** where possible; The Graph is an enhancement.
6. **View-all** and roll-up (rulings and proposals of 2026-11-25).
7. **General:** files, folders, chess moves; not only a file browser.

## Three candidates

- **(I) Path identity.** A topic is its path (`/cars/tesla`). The parent is a fact. Roll-up is objective.
- **(II) Flat words, parents as data.** A topic is one word. "tesla is under cars" is somebody's statement, read through the lens. This is the booru, Hydrus, SKOS and Wikidata shape.
- **(III) Words are the atoms; a tag is a path of words; file it under both.** A tag statement names an ordered path of words. The index lists it under every prefix of the path (roll-up) and under every word in it (pooling). Synonyms are statements about words. Parent-as-data stays available as an optional overlay for smart search.

## Reasoning, before evidence

**A. A path is a conjunction of choices.** For two strangers to match on `/cars/tesla/model_y`, they must match on every word, on the depth, and on the order (`/cars/electric/tesla` or `/cars/tesla/electric`?). Agreement can only fall as levels are added. A single common word is the strongest focal point available.

**B. Disagreement has to go somewhere.** People will disagree about how things should be organized. If the organization is data, the disagreement becomes competing overlays over the same ids, and the tagged content still pools under the shared word. If the organization is in the id, the disagreement becomes competing ids, and the content splits. On a ledger with no authority to reconcile them, splits are permanent.

**C. An id should assert as little as possible.** `/planets/pluto` bakes a classification into a permanent name. A classification is a claim, and claims belong in dated, attributable statements that a lens can weigh, not in identity.

**D. Hierarchical identifiers usually exist to delegate ownership** (DNS, OIDs, package names): each level is somebody's to administer. EFS topics have no owners at any level, so that reason is absent. What hierarchy still offers here is specificity and roll-up.

**E. The world is not a tree.** A Model Y is a car, a Tesla product and an electric vehicle. One path gives one parent chain; the rest need other paths or other tags.

**F. But (I) has real strengths that (II) lacks.** Roll-up along a path is objective and cheap for the contract; `/cars/tesla` is a specific, linkable place; and it matches how people browse.

**G. (III) keeps F and fixes A–C.** The path stays as the specific place and the roll-up axis. Filing under each word keeps the pool whole: `/cars/tesla`, `/companies/tesla` and `/vehicles/cars/tesla` all appear under the word `tesla`. The contestable classification lives in the tagger's statement ("I filed this under cars > tesla"), not in the identity of the concept `tesla`. Word-level synonyms (`car` = `cars`) repair many paths at once. A statement can carry more than one path for more than one parent chain.

**Hypothesis:** (III) is better than (I) on every requirement at a small extra index cost, and better than (II) on roll-up, browsing and readable places while keeping (II)'s pooling. Pure (I) is the weakest for Schelling points.

## Predictions the research can falsify

- **P1.** Spontaneous agreement on even one word for the same thing is low (well under half), so systems that work rely on aliases and on showing people the tags already in use. Agreement on multi-level names is lower still.
- **P2.** No large multi-user tagging system puts the parent in a tag's identity. Nested-tag tools that do (Obsidian and similar) are single-user.
- **P3.** Hierarchical identifier schemes in technical systems exist mainly to delegate authority, and their designers warn against putting classification into persistent identifiers.
- **P4.** Mature subject systems are polyhierarchical (several parents per subject) and keep identity separate from position.
- **P5.** Authority-free shared hierarchies (Usenet `alt.*`) did work as Schelling points, could not be reorganized without an authority, and saw over-specific branches fragment or die.
- **P6.** Roll-up in existing systems is done either at write time by a database someone owns, or at read time virtually. The second is the only shape an append-only ledger can copy for subjective parents.
- **P7.** Where free tagging and curated structure coexist at scale (AO3, OpenStreetMap), the tags as typed are never rewritten and meaning is layered on as data.

## What would change my mind

- Evidence that path-identified shared vocabularies converge well without an authority.
- Evidence that pooling by word is unusable at scale because of ambiguity.
- Evidence that roll-up by statement or convention fails where roll-up by baked-in hierarchy succeeds.
- A cost result from the contracts dev showing that filing under each word is expensive or easy to abuse.
