# Tags: query and retraction gaps, with a cost-conscious repair candidate

September15,2026 · v2 PM · core-closeout-20260915

**Status:** source-inspection evidence and design alternatives, not implemented behavior or a permanent profile choice. Inspected published prototype`3ac53d57b41a34e3bc915e19daf063dc5ac9ed7d`; the active replay worker's changes are separate. One bounded read-only specialist pass and parent counterproposal; no additional build/chain/test campaign.

## What works, and what does not

Current tags bind `(Principal,TAG,subject,Concept) -> File`. Subject is the stable File, an exact revision, or supported Directory. The SDK can assess a known Concept on a known subject and filter one selected folder under a Lens.

- **No keyed Concept→all subjects route.** Existing scope lists start with a known subject; binding backlinks target the File, not the Concept stored in role. Generic reference postings index Record bodies, not binding roles. A complete `bindingPosition`/`positionCell` scan can reconstruct candidates but scans all lifetime binding coordinates, including unrelated purposes/authors/tags. Folder walking also misses unplaced Files. This is reconstructible data, not a demonstrated practical keyed query.
- **Removal is a persistent mask.** `removeTag` uses UNBIND and even creates BIND→UNBIND when needed. Ordered Lens stops at that author rather than falling through. Core cannot reset the coordinate to never-touched state0. Occurrence WITHDRAW neither retracts bindings nor changes this result.
- **No explicit deny versus retraction.** Current tag readers do not distinguish “I affirm this is not nsfw” from “I removed my annotation,” or express return-to-SILENT after a stance. Wrong-target bindings are not secretly negative testimony.
- **Same label is not necessarily the same Concept.** The prototype uses exact Type plus namespace/ASCII label, defaulting to the author's namespace. Two independently entered `nsfw` labels need not share an ID. Commons canonical strings are a separate adopted direction; do not silently reinterpret existing experimental bytes.

Source anchors in the prototype's `lab-b/`: `browser/compact-sdk.mjs` Concept/tag/remove paths and their existing tests; `src/Keys.sol` scope/reference keys; `src/IndexModule.sol` actual family fold; `src/LensReader.sol` first-author masking; `src/Ledger.sol` binding/history/withdrawal and coordinate getters. [[../../Designs/efsv2/owner-rulings#Tags — rulings on the tag deep dive|Owner tag rulings]] preserve same-Concept polarity and distinguish grouping from inference. The current testnet Files plan only claims folder-first filtering; the broader gaps cannot be silently labelled complete or waived.

## Two representations worth comparing

Both candidates use existing Core actions and a new versioned purpose/profile; neither changes old TAG or folder-mask meaning. In either, the author is established by the binding/publication evidence, not the first publisher of reusable bytes.

| Candidate | Data and indexes | Main tradeoff |
| --- | --- | --- |
| A: per-pair typed stance Record | File stance96B or revision stance128B; checked Concept and finite validated revision references; author binds the exact Record. Transposing scope to Concept gives subjects-by-Concept, but needs another inverse route for all tags on a File. | Independently referenceable `(Concept,subject,stance)` object, at the cost of fresh Record/evidence/required-index work for new tuples. |
| B: shared immutable stance tokens | Three32B Records define ASSERT/DENY/SILENT once. New per-File/revision bindings target these tokens. Keep subject scope; add required Concept-role candidate inventory in the separate index. | No fresh per-pair Record. Pays inverse-index and required validation work; the authored statement is binding coordinates+token+evidence, not token alone. |

**B is the better first cost candidate, not a measured winner.** Retained bindings already commit author, coordinates, target, revision and history. No inspected portability or validity requirement inherently demands repeating that tuple inside another fresh Record. A may still be useful when applications need to reference a standalone statement value. Do not call A the minimum simply because generic Record-reference indexing already exists.

B's exact required profile checks token identity, Concept Type, subject class and revision/File relationship. Required final checks must reject invalid coordinates atomically and use the publication's own terminal basis during replay. A also needs binding-to-Record coordinate alignment; its Record validator alone cannot constrain arbitrary binding coordinates. A reader-only filter is a weaker validity guarantee and cannot be compared as if equivalent to required acceptance.

The inverse inventory's unit is a distinct author-binding coordinate, appended only on its first use, not every stance change. Principal-qualified Concept lists avoid charging a closed Lens for unrelated authors' statements. An additional all-author list costs extra writes; its necessity must be explicit, not an automatic mirror. Existing mandatory target-backlink updates still occur for shared tokens and cannot be omitted from the bill. Retained candidate counts are not current ASSERT counts.

## Selection and preservation that must remain explicit

Read each author's stance at one qualified origin. Validated SILENT may fall through; ASSERT or DENY stops a priority policy with attribution. Unknown/malformed/unavailable higher-priority data does not fall through. A provenance/conflict view exposes disagreement rather than declaring objective truth. Do not call generic first-found Lens once and reinterpret a SILENT winner afterward.

Under a new-purpose policy, UNBIND can mean retraction-to-silence; explicit SILENT BIND separately retains intent. Legacy UNBIND remains a mask. The owner was asked whether removing one's tag should restore lower-priority fallback, with a distinct denial action; no response has been assumed. This question does not block already-approved replay/query work.

Revision testimony stays about that immutable revision. “Tag the selected revision” guards the HEAD used to choose it; “currently selected revision is tagged” resolves HEAD at the query origin. An old revision's tag is not automatically a current File match. Same-Concept lookup does not imply child-tag inference, cross-Realm search or namespace folding.

Recovery must retain token/stance Type and rule descriptions, coordinate preimages, histories and authority evidence. Source-off meaning cannot depend on one live SDK's token labels. Legacy and new-profile coverage stay separate until an explicit union/migration reader exists; no automatic historical rewriting.

## Small decisive next experiment, not another architecture tournament

After query progress, select or compare the two bounded profiles at the same required-validation/retention guarantee. Use two authors, one shared Concept plus a same-label different Concept, Files across two folders and an orphan File, stable/revision tags, and ASSERT→DENY→SILENT. Verify both query directions, exact-origin selected-revision joins, wrong-coordinate rollback, stale guards, rebuilt inverse indexes and source-off interpretation. Add unrelated authors/Concepts to expose accidental Realm-wide scan work.

Measure whole fresh/native/signed tagging operations, existing-Concept controls and repeated stance transitions; setup tokens/Types separately. Include mandatory postings, inverse-list header/packing boundaries, guards and validation. No old one-BIND tag figure, marginal append cost or hypothetical slot estimate establishes the new whole-action price. This closes a specific capability/cost gap without new Core opcodes or a claim that every fact needs its own Record.

**Bounded implementation follow-through:** [[core-closeout-tags-plan-20260915]] selects B for a reversible experiment after reviewed query/SDK/Types/live-File work. It validates every new-purpose BIND before exposing its prefix, not merely the last head at publication end; dependencies precede that BIND. Explicit ASSERT/DENY/SILENT APIs and new-purpose UNBIND-as-silence are named experiment semantics, not a change to legacy masking or the default remove button. Query/replay/source-off and whole-operation costs must pass their own review before any implemented-capability claim. No all-author index or parallel architecture tournament is added.
