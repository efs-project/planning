# Tag identity and hierarchy: prior art and verdict

**Status:** reference: a research corpus with @pm's verdict. Nothing here is a ruling. The recommendation at the end waits for @james.
**Given:** 2026-11-25, after [[2026-11-25-tag-discussion-round-3]]. @james asked whether a static hierarchy (the parent is part of a tag's identity) or parent-as-data (as the boorus do it) is clearly better for EFS, and asked for the prior-art comparison to be extended.
**Made by:** a side session of the "EFS v2 Dev PM" session (Fable 5.2) coordinating eight research passes and one report writer (Sonnet- and Opus-tier subagents). Every outside claim is cited in the notes; this page cites the note that holds the source.

#status/reference #kind/brief #repo/planning #repo/contracts #repo/sdk #repo/client

## What is in this folder

| File | What it is |
|---|---|
| `reports/Tag identity and hierarchy prior art.md` | The evidence report, written from the notes. Start here for sources and numbers. |
| `research_notes/Tag identity and hierarchy prior art/` | Eight notes, one per research pass, each with URLs, labelled inferences and gaps. |
| `design-hypothesis-sealed.md` | @pm's reasoning and seven predictions, written before any research returned. |
| `mesh_parents.py` | The script behind the MeSH figures (run on NLM's `desc2026.gz`, file dated 2026-08-12). |

## The verdict in one paragraph

Neither pure option is right, and one combination is clearly better. **The word is the permanent shared id. A tag is a short path of words, which records how the tagger filed the thing. Every tag is listed under each of its words and under its path.** Parents, synonyms and "moved to" are separate statements that readers' lenses apply. The evidence rules out making the whole path the unit people must agree on. It also shows that pure flat words only worked where somebody curated the relations, which EFS has nobody to do. Paths give roll-up and specific places with no curator; words give the pooling that makes a Schelling point.

## What the evidence says

| Finding | Numbers | Note |
|---|---|---|
| Strangers rarely choose the same word | under 20% in all five domains (Furnas and others, 1987); the remedy they recommend is many aliases | `convergence_research.md` |
| Agreement falls as the unit gets more specific | cataloguers matched a full compound heading 16% of the time, 36% when a missing sub-part and a synonym were forgiven (Tonta, 1991); medical indexers agreed 75% on broad check-tags and 48% on main headings, lower again with a sub-heading attached (Funk and Reid, 1983) | `pre_post_coordination.md` |
| Single words find more; compounds are more exact | Cranfield II: single terms 66.7% recall at 14.8% precision; pre-combined concepts 14.1% recall at 50.9% precision | `pre_post_coordination.md` |
| A convention forms only when people can see everyone's choices | one name reached about 96% when anyone could meet anyone; the leading name held about 30% when people saw only neighbours (Centola and Baronchelli, 2015) | `convergence_research.md` |
| Subjects often have several parents | 30.1% of MeSH 2026 subjects have two to six distinct parents (computed here) | `pre_post_coordination.md`, `mesh_parents.py` |
| Mature systems separate the id from the position | MeSH tree numbers are "subject to change" and its ids are not; SKOS, Wikidata, AO3 and Hydrus do the same | `knowledge_organization.md`, `ao3_and_nested_tags.md` |
| A path in the name can't be reorganized without an authority or a rewrite | Usenet's 1986–87 renaming mapped 242 names onto 222 and needed the backbone sites plus a 271-line alias file; `alt.*` groups "can't be removed or even re-named"; Obsidian's rename edits every note; Logseq moved the parent out of the name | `usenet_precedent.md`, `ao3_and_nested_tags.md` |
| Hierarchy in names stops carrying meaning | only 1,171 of 2,381 active Usenet groups with "comp" in the name sat under `comp.*` (2000–01) | `usenet_precedent.md` |
| Flat tags plus relations need curators | AO3: about 400 volunteers and about 4.9 million tags handled in 2025; Stack Exchange: reputation-gated votes; Danbooru: approvers | `ao3_and_nested_tags.md` |
| Redirects can be undone; merges can't | Stack Exchange synonyms only redirect; a merge rewrites every question | `ao3_and_nested_tags.md` |
| Hashed text is frozen | ENS kept a legacy normalization quirk because registered hashes can't change | `decentralized_naming.md` |
| Designers of persistent links leave classification out | Berners-Lee (1998); the DOI Handbook's opaque identifiers | `identifiers_and_persistence.md` |

## The design that fits

1. **Words are the shared ids.** `tesla` is one topic for everyone, folded as D-B rules. Display names per language and synonyms attach to the word, so one statement (`car` = `cars`, `汽车` = `cars`) repairs every path that uses it.
2. **A tag is a path of words.** `/cars/tesla/model_y` records how the tagger filed the thing. It is a claim by the tagger, not part of the identity of `tesla`.
3. **Every tag is listed twice over.** Under its path and each parent path (so `/cars` rolls up everything filed beneath it, with no curator), and under each word in it (so `tesla` pools `/cars/tesla`, `/companies/tesla` and `/vehicles/cars/tesla`).
4. **`/cars/tesla` is still a permanent, readable link.** It always computes the same view. It is an address made of words, not a second identity that people must agree on.
5. **Relations are optional statements.** "model_y is a kind of tesla", "moved to" and synonyms are read through the lens, tolerate cycles, and are never merges. The system works with none of them.
6. **Suggestions show global counts.** When tagging, the client shows existing words and paths with how many items each holds across everyone, not only the reader's lens. Centola's result makes this the main driver of convergence, and the view-all lists already ruled provide the counts.

What this changes from the T-2 ruling of 2026-11-25: the unit of identity moves from the whole path to the word. Everything @james asked for in that ruling still holds: `/cars/tesla` and `/companies/tesla` are different places, typing `tesla` shows both, synonyms join them, and links are readable and permanent.

## The strongest arguments against it

1. **Nobody curates relations.** Every flat system that worked had people deciding synonyms and parents. Here the baseline needs none, but `car` and `cars` stay split until someone in a reader's lens says otherwise.
2. **A bare word pools unrelated meanings.** The word page for `tesla` mixes the company, the inventor and the unit. The path is the context that separates them, and the client should group a word's results by path. Qualifiers (`mercury_(planet)`) are still needed inside one parent.
3. **Filing under every word is untested.** One statement can land in up to twice as many lists as it has words, which is cheap spam fan-out. The contracts dev has to measure the cost and the abuse case; a directory of paths per word is the fallback.
4. **Paths still pile up.** `alt.*` has junk names 21 levels deep. A depth limit and listing by global count are the defences.
5. **The fold rule is frozen at launch.** ENS's experience says to settle it carefully first.
6. **No study tests path tags with ordinary users.** The depth penalty is extrapolated from professional cataloguers.

## The sealed predictions, scored

The report judges each against the notes only. Supported: P1 (indirectly for depth), P3 (mostly), P4 (for thesauri; Dewey and LC Classification are counter-examples), the first half of P6. Partly contradicted: P2 (Usenet, PyPI classifiers and ENS are large multi-user path namespaces) and P7 (OSM, Danbooru and Stack Exchange merges do rewrite). Mixed: P5 (the "can't reorganize" half is strong; "worked as Schelling points" is weak).

Two things the sealed hypothesis got wrong or missed:
- It treated prefix roll-up as central. The report's caution is right that roll-up along a path only finds what was filed under that exact path, so the word lists, not the path lists, have to be the main pool.
- It underrated the curation cost of parent-as-data, which is the strongest reason not to choose pure flat words here.

## Waiting on @james

One decision: adopt this design, which refines T-2 (the word, not the whole path, is the shared id) and includes path roll-up. If yes, it is recorded in `Designs/efsv2/owner-rulings.md` and the work order in round 3 gains: the per-word lists and their cost and abuse measurement (contracts), word-level synonym and label statements, and global counts in tag suggestions (SDK and client).
