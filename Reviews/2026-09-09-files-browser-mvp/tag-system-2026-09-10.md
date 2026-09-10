# Tag system — research synthesis and engineering position

**Status:** experiment document on the files-browser branch; not a design and
not a ruling. Written 2026-09-10 by the integration-test-lead after the owner
asked for a tag deep dive ("Tags in my head are kinda free text but in v1 we
also made them Topics / hierarchical folder names … Booru systems have dynamic
tags where … the metadata for that tag can be updated"). Companion to
[indexing-and-state-2026-09-10.md](indexing-and-state-2026-09-10.md). Every
figure carries **MEASURED**, **QUOTED** or **ESTIMATED**.

**Provenance.** Three research strands (vault survey; booru systems from
primary sources; tagging theory and pluralistic labeling), three independent
architect memos (booru-faithful, filesystem-minimal, graph-native) and an
adversarial judge ran under my workflow; all seven are kept verbatim in
[research-2026-09-10/tags/](research-2026-09-10/tags/). I spot-checked the
judge's seven load-bearing vault citations at the cited lines today
(`owner-rulings.md:44-62` and `:171-175`, `hierarchical-files-and-folders.md:9`
and `:107-111`, `lens-spec.md:16` and `:52`, `StatePointReads.sol:386`,
`read-lens-spec.md:224`, `report-for-codex-2026-09-10.md:145-149`); all say
what the judge says they say. I have not re-fetched the booru or theory web
sources; those carry the strands' own citations and dates.

---

## 0. The answer in one paragraph

A tag is a **concept record**, not a string and not a path:
`TagConcept/1 {vocabulary, salt}`, whose id is the ordinary content-addressed
RecordId. Two profiles share the Type. **Commons** (`vocabulary = COMMONS`,
`salt = keccak(canonical string)`) gives the owner's free-text tags one global,
offline-derivable id with no registry — everyone who types `nimbus` gets the
same concept. **Namespaced** (`vocabulary = a principal's word`) is for
communities whose `nsfw` must differ from another community's. Every human
string is a **binding under the id**: the display label per language, and the
catalog placement `V:/tags/clouds/nimbus` under a vocabulary — that placement
*is* the "clouds grouper" the owner described. Hierarchy-as-inference
(`implies`), aliasing and merge (`exactMatch`, `replacedBy`) are typed edge
records bound at positions under the concept; grouping is never inference. An
assertion is one `TagSet/1` per (author, target) with `asserts[]` and
`denies[]`, bound at the target; its index shadow is one bit per (directory
scope, attester, concept) plus one packed global posting per concept.
Expansion is read-time by default; write-time materialisation is opt-in per
concept into a *separate* `implied` family. Rename is one binding, merge is
one redirect binding, and nobody's assertion is ever rewritten.

---

## 1. What changed, and corrections to my own earlier framing

1. **"Free-text or typed fields?" dissolves.** I asked the owner to choose.
   The two profiles above give both on one Type: free text converges through
   the commons salt; communities and system vocabularies use namespaces.
2. **"images vs image/png" is not a prefix index.** It is a system vocabulary
   (`SYS_MEDIATYPE`) with `image/png implies image` marked *materialised*; the
   placer writes both bits at placement (+2 bits ≈ 10,140 gas today / ≈ 25,000
   Glamsterdam, ESTIMATED). Same outcome as my "second posting the schema
   declares", cleaner framing, and it generalises to every umbrella a
   contract must probe cheaply.
3. **My "opt-in per Type" direction conflicts with a ruling.** On 2026-07-15
   the owner ruled "MANDATORY automatic indexing; EAS opt-in REJECTED … the
   moment it goes on-chain via EFS, indexing is mandatory" and "list all
   records of a given definition → ON-CHAIN"
   ([owner-rulings.md:44-62](../../Designs/efsv2/owner-rulings.md)). My
   2026-09-10 recommendation to make families opt-in per Type — to which he
   said "I trust you" — was made without that ruling in front of me. It is
   surfaced in §6 as a decision, not taken.
4. **"/clouds/nimbus" is three claims on one id**, and the owner's v1
   behaviour is a *display* statement: v1 never expanded a tag up the anchor
   tree (vault strand §1.4), so "tagged nimbus" never matched a `clouds`
   search. SKOS says the same thing formally — a grouper "does not represent a
   label for a concept in its own right" and may not sit in a `broader` chain
   (§9.6.4). Whether `clouds` *should* find nimbus photos is therefore a real
   decision (§6, D-A), not an inherited behaviour.
5. **The July tag-core's `tagId = keccak(DOMAIN, parent, keccak(name), kind)`
   is the wrong identity for an indexed tag**, and the active Files spine
   already retired it ([hierarchical-files-and-folders.md:9](../../Designs/efsv2/hierarchical-files-and-folders.md)).
   The bitmap index is keyed by tag id; a name-bearing id splits the column
   on every rename and no REDIRECT re-merges bits. Every system that put the
   name or the parent in the identity paid with per-item rewrites the ledger
   cannot do: LCSH (a seven-year rename, 40+ local forks), Wikipedia categories
   (~6.4M bot edits), macOS Finder tags (rewrite every xattr), Danbooru
   (`TagMover` re-saves every post). The derivation survives as the *catalog
   position key*, which is where hierarchy belongs.

---

## 2. What the booru evidence actually says (primary sources, 2026-09-10)

- **Danbooru and e621 are write-time materialisers keyed on name strings.**
  Implications are baked into every post's `tag_string` at save and applied
  *retroactively* by re-saving every affected post; aliases retag every post;
  removal of an implication touches nothing (Danbooru) or replays an undo
  snapshot (e621, whose own code concedes a materialised tag "can no longer be
  told apart from one the user put there on purpose"). Their hardest
  engineering — `TagMover`, Sidekiq jobs, 9.6 GB/day of `post_versions` —
  exists to pay for that choice, and it requires owning a mutable database.
- **Hydrus is the shape an immutable ledger can be.** Storage tags are never
  rewritten; siblings (aliases) and parents (implications) are *virtual*,
  resolved into a derived, rebuildable display cache; and it has the only
  working pluralistic-authority rule: an ordered list of tag services where
  the first service wins per conflicting alias and parents union across
  services. That is the Lens, deployed, for a booru-class corpus (PTR: >2
  billion mappings, QUOTED).
- **No booru encodes hierarchy as a path.** Hierarchy is flat namespaces
  (`character:`, categories) plus an n→n implication DAG; today's newest
  Danbooru implication is a parenthetical suffix plus an explicit edge.
- **Scale:** Danbooru 12.1M posts, ~2.7M tags, ~237k aliases, ~246k
  implications; e621 6.7M posts (all QUOTED 2026-09-10). Search limits (2/6/∞
  tags by tier, 3/6/9-second timeouts, e621's 40-tag cap) are the same budget
  knob as an `eth_call` gas ceiling.
- **Sankaku's help routes are all dead** today; the vault's 2026-08-14 summary
  is the only Sankaku evidence and cites the same now-dead URLs.

Theory strand, one line: every successful labeling system separates concept
identity from labels and treats hierarchy as an editable claim over stable
ids (SKOS, Wikidata, Notion, Gmail, Hats); Bluesky labelers are the closest
deployed analogue to Lenses and deliberately use union-then-most-restrictive
rather than first-wins for their (cardinality-N) labels.

---

## 3. The design, condensed from the judge's synthesis

**Identity.** `TagConcept/1 {vocabulary: bytes32, salt: bytes32}`; commons
`salt = keccak(canon(s))` with `canon = NFC → lowercase → space→underscore`
(the Danbooru/e621 rule; frozen once chosen). Admission is permissionless;
the `vocabulary` word is a namespace label, not ownership — squatting is
inert because registration grants nothing. The SDK binds a label on first use
so a bare id is never unreadable.

**Metadata = bindings under the concept**, resolved through a `vocabLens`
(an ordinary resolution plan): `TAG_NAME` (catalog placement; a second name for
the same concept *is* an alias), `TAG_LABEL` per language, `TAG_CATEGORY`,
`TAG_STATUS` (deprecated / invalid / ambiguous / locked / DNP / materialised /
replacements), `TAG_DEFINITION` (a File; wiki with history for free),
`TAG_REPLACED_BY` (merge redirect, ≤ 4 hops, never deleted), `TAG_RELATION`
(typed edges: `implies`, `exactMatch`, `related` in tranche 1; `broader`,
`partOf`, `closeMatch` additive later; **no `memberOf`** — placement is the
grouper), `TAG_VOCAB_DELEGATE` ("V may fold implications into my derived
bits"). Card-1 positions resolve first-present by lens order; card-N edges
union with first-vocabulary-wins per source concept (Hydrus's rule). A
`VocabularyRelease/1` closure exists for contracts and for materialisation.

**Assertions.** `TagSet/1 {target, vocabRelease, asserts[≤16], denies[≤16],
confidence[]}` bound at `(TAG_SET, target, k)` under the author. One author
has exactly one stance per (target, concept): assert, deny, or silent. DENY
is a positive claim ("I looked; it is not"); retraction is a tombstone
(Bluesky's `neg` is retraction, not denial — EFS keeps both). Edit = rebind;
history retained. The MVP's per-pair op is "a `TagSet` of one" and writes
identical bits, so the carrier choice is measured, not argued.

**Index rule.** Families keyed by the binding-position ordinal (the kind-10
scope list, per placer per directory), never the record id: `alive`,
`assert[scope][attester][concept]`, `deny[…]`, `implied[…]` (derived,
opt-in, separate), plus the packed global posting per concept (kind 6) and
the target backlink (kind 5). **Invariant:** a principal's columns are written
only by an op signed by that principal or by a fold signed by a vocabulary it
delegated to; anyone may pay, nobody else may author. **Ordinal verification
is mandatory** (≈ 8,400 gas): a bit at ordinal *i* claims "the placer's i-th
entry is the file I tagged", and contracts probe bits without hydrating, so an
unverified bit is a lie vector.

**Expansion.** Read-time by default (correct under the reader's vocabLens at
the reader's basis; a contract probe costs 1+d SLOADs per attester).
Write-time `implied` bits only for low-fan-in umbrellas contracts must probe
cheaply (media types, safety ratings), frozen at the writer's cited release
and auditable. Retroactive fold is delegated, word-wise (`implied[B] |=
assert[A]`, 9–26k per 256 entries today), per scope, paid by whoever runs it
— never automatic, never global. e621's `breasts`-class fan-in stays
read-time.

**Rename / merge / split.** Rename = one new `TAG_NAME` binding; the old name
*stays bound* as an alias by rule (the July red team's "links never
structurally 404" re-earned). Merge = one `TAG_REPLACED_BY` binding; readers OR
two columns until an optional fold; un-merge = tombstone the redirect. Split
cannot be automatic anywhere; curators re-tag. No operation rewrites another
principal's claim.

**Pluralism.** Two vocabularies disagreeing on whether nimbus is under clouds
is two placements and two (or zero) `implies` edges; the reader's vocabLens
order decides, and the MVP's "Why?" drawer names the vocabulary that supplied
each edge. Two curators disagreeing on `nsfw` is two columns; the combinator
is a **per-purpose lens policy**, never a tag property: `UNION_PROVENANCE`
(default — "A: nsfw · B: not nsfw"), `ASSERT_WINS` (safety), `PRIORITY`
(first roster principal with a stance). This is the cardinality-N combinator
the Lens spec currently lacks; it belongs in `lens-spec.md` as a profile
parameter. What is honest to claim on-chain: "under closed lens L and
vocabulary V at basis b, the effective stance is X" — never "f is nsfw".

**Not on-chain** (the client answers with `eth_call` at a pinned block):
NOT over the ledger (only within a listing), "anyone tagged f with T",
global dense scans, prefix/regex/autocomplete, deep closures, counts at a
past basis, related/trending/ranking, private blacklists (never leave the
device), and "is X under /clouds" as a contract gate (contracts pin a
release instead — the July permanent-parent walk is gone in every concept-id
design, and the judge is right that none of the three memos said so).

---

## 4. Costs

**Floor, ESTIMATED from the tier table** (bodies in slots; SSTORE2 body in
parentheses), for one `TagSet` of 8 tags: **≈ 423k today (267k) / ≈ 1.79M
Glamsterdam (1.34M)**, i.e. ≈ 53k (33k) / ≈ 224k (168k) per tag. Per-pair
shape: ≈ 140k first curator / 96k second today. **MEASURED today, MVP per
pair: 2,838,264** — 55× the floor per tag. Read costs are identical on both
schedules: the four owner queries in a 1,000-entry directory under a
two-attester lens are 8.4k / 8.4k / 16.8k / 25.2k; a contract's membership
probe is ≈ 12,600 including ordinal verification; a global "newest 20 tagged
T" is ≈ 137k; a global two-tag AND over an open corpus is ≈ 3.3M and
`eth_call`-only.

**The verdict the owner should hear plainly.** Booru density — 35 tags per
post over millions of posts — is unaffordable on-chain on either schedule at
any of these numbers (a 1,000-photo, 9,500-assertion album is ≈ 0.4–0.5
billion gas at the floor today, ≈ 27 billion at today's MEASURED rate). What
is affordable is what EFS is actually for: attributed, moderate-density tags
on curated sets, with the bulk of a booru's vocabulary work (aliases,
implications, wiki, categories) costing one binding each and never a
per-post rewrite. Under Glamsterdam the floor rises ≈ 4.2× because it is
allocation-dominated; the two levers are body encoding (measure slots vs
SSTORE2) and never allocating a new id on rename (concept ids).

**Unreconciled:** the vault carries two MEASURED "tag" figures — 2,838,264 /
94 slots (steady state, gas-engineering §2) and 3,060,354 / ~133 slots
(report-for-codex §7; consistent with the *first* tag in a scope, which my
ablation run put at 3,046,565). The slot-level profile that is already next
step 1 will settle it. No bitmap, `TagSet`, fold, `alive` or verification
write has been measured anywhere yet; every non-MEASURED number here is
arithmetic.

---

## 5. Decisions for the owner

Five are genuinely his; the rest I take as engineering defaults (listed
after, with what I will do unless told otherwise).

| # | Decision | Recommendation | Why it is his |
| --- | --- | --- | --- |
| **D-A** | When a reader searches `clouds`, should photos tagged only `nimbus` appear? | **No by default.** Placement is grouping; a vocabulary adds an explicit `implies(nimbus → clouds)` edge (one record), and the "create tag under folder" dialog *proposes* it. | It is the user-visible meaning of his `/clouds/nimbus` model, and SKOS, the boorus and v1 all say grouping ≠ inference. Adding an implication later is one edge; removing an implicit one is impossible. |
| **D-B** | Free-text convergence: one global id per canonical string (`NFC → lowercase → space→underscore`)? | **Yes**, the booru rule. Files names stay unfolded — a different object. | The folding rule is **irreversible**: it cannot be added or removed later without forking every commons id. |
| **D-C** | Is DENY a first-class stance ("I looked; it is not nsfw"), distinct from retraction? | **Yes.** Polarity in the same `TagSet`, separate `deny` family; advisory feeds stay a separate ADVISORY/1 surface. | The vault currently holds two deny models (`read-lens-spec.md:224` advisory-TAGs vs booru polarity); leaving both means two forever. |
| **D-D** | The 2026-07-15 "mandatory automatic indexing" ruling versus the measured cost. | **Amend, narrowly:** the target backlink (kind 5) and definition-keyed enumeration (kind 6 — "everything tagged T") stay automatic for every on-chain record; the other families are declared per Type. Tags get kind 5/6 plus the bitmap families. | His ruling; I recommended "opt-in per Type" without it in front of me. Stopping a family later is free; adding one later needs a paid pass over every record. |
| **D-E** | Tag budget: is ≈ 50k gas per tag today (≈ 220k Glamsterdam) at the floor an acceptable design target, given booru density is out of reach? | **Yes**, and say so in the booru design's requirements (BOORU-15 measures; BOORU-04's "reverse an implication and fail the fixture" must be rewritten for read-time semantics). | It sets what the booru and media products may promise. |

### 5a. Owner answers, 2026-09-10 (recorded in `Designs/efsv2/owner-rulings.md`)

| # | Answer | Consequence |
| --- | --- | --- |
| D-A | **No** on-chain; **yes** in Graph-enhanced search "if nimbus has metadata saying its a child of clouds" | On-chain: placement is grouping, `implies` is an explicit edge. Off-chain: the search provider may expand over placement *or* implication edges under the reader's vocabulary; which one is a client/provider setting, defaulting to explicit `implies`. |
| D-B | **Yes** | Commons salt = `keccak(NFC → lowercase → space→underscore)`; frozen. |
| D-C | Keep v1's signed weight semantics (+1 "is nsfw", −1 "is NOT nsfw") without a separate `not_nsfw` tag | That is exactly DENY as polarity on the same concept: per author, assert / deny / silent. The carrier (`asserts[]`/`denies[]` vs a signed weight) is engineering; the index has two bit families either way. Graded weights beyond the sign stay unindexed (`confidence`). |
| D-D | Explanation requested; "for the most part I agree" | Pending. Plain-language version below; the 2026-07-15 ruling stands until he answers. |
| D-E | **Acceptable** "if that's the best we can do"; asks whether thousands of taggers break anything | Answered below: no. |

**D-D in plain language.** An "index" here is a list a contract — or the
browser with no Graph — can read to *find* records: "everything that points
at file F", "everything tagged T", "everything by principal P", "every record
whose field X = V", "every record carrying digest D". In July the owner ruled
that every record written through EFS goes into every such list
automatically, so no writer can hide from the index and anyone can build on
anyone's data (unlike EAS, where indexing is a separate optional call). The
reason is right and is kept. What was measured since: those automatic lists
are ≈ 20% of every write, most have no reader yet, and a fresh list entry
goes from 22,100 to 110,020 gas under Glamsterdam. The amendment on the
table: keep two lists automatic for every record — "what points at this"
(kind 5) and "all records of this Type/definition" (kind 6, which is what
"everything tagged T" is) — and let the **Type definition**, written once by
whoever defines the Type, declare which extra lists its records maintain.
Writers still cannot opt out; the choice moves from each writer to the Type
author, once. What it gives up: a Type author who leaves a list out cannot
add it later without a paid pass over existing records. The question for the
owner is therefore: *should the Type definition decide which extra indexes
its records keep, with backlinks and per-Type enumeration always on?*
Recommendation: yes.

**Do thousands of taggers break anything? No.** Each `TagSet` is its own
binding under its own principal, and the bitmap columns are per attester, so
a thousand taggers create a thousand independent columns, each paid for by
its writer. The only shared state per item is two list heads — the target
backlink and the per-concept global posting — each rewritten once per
assertion (5,000 today / 12,100 Glamsterdam) as part of that writer's cost;
transactions serialise, so there is no contention failure mode. Reads scale
with the *reader's lens*, not the crowd: a Lens of k principals reads k
columns per predicate (plans are bounded at 1/8/32/64), regardless of how
many people tagged. "What do all N taggers say about item X" is a paged walk
of the target backlink, ≈ 2,100 gas per entry (≈ 2.1M per thousand taggers)
— fine as an `eth_call`, not something a contract does inside a transaction;
a contract that wants crowd counts uses a closed lens or a delegated fold.
What §4 called unaffordable was a *single payer* replicating a booru (12.1M
posts × 35 tags ≈ 424M assertions, ≈ 2×10¹³ gas at the floor), not fan-in on
one item. The one hard per-transaction limit is EIP-7825: one `TagSet` holds
≤ 16 concepts, so a 35-tag post is three `TagSet`s in one transaction
(≈ 5.4M gas under Glamsterdam pricing, ESTIMATED), which fits.

**Delegated defaults I will take** (the judge's D1, D4–D6, D8–D17, D20–D21):
concept ids on one Type with two profiles; measure `TagSet` vs per-pair
bodies in slots vs SSTORE2 on both schedules before choosing; drop `int256
weight`, keep unindexed `confidence`; relation kinds `implies`, `replacedBy`,
`exactMatch`, `related` first, additive later; read-time expansion default,
`implied` family and `foldImplied` deferred until a contract consumer needs
them; ordinal verification mandatory; an explicit placer-maintained `alive`
bitmap (it does not exist in the MVP — whiteouts and tombstones do); media
types as `SYS_MEDIATYPE`; the card-N combinator as a lens-spec profile
parameter, client-side first; vocabulary pinned by `(vocabLens, blockTag)`
with `VocabularyRelease/1` for contracts; label-at-first-use in the SDK;
"is X under /clouds" is not a contract gate.

---

## 6. Contradictions and open items carried forward

1. Two MEASURED tag figures (§4) — settle with the slot profile.
2. July's shared TAGDEF space ("`/pizza` the folder and `#pizza` the label
   are the same tagId", `kinds-ruling.md:167`) versus every 2026 successor;
   `mountable-filesystem-semantics.md:123` still says "Directory = TAGDEF
   structural namespace node". The older documents need a superseded note.
3. The Stage-A coherence review estimated ≈ 174k per assertion leaf with
   mandatory `KIND_TARGET`/`KIND_ROLE` postings; the three memos' floors
   (30–160k) drop or pack those families. D-D decides which estimate is right.
4. BOORU-04 ("reverse an implication and fail the fixture") assumes
   Danbooru's retroactive semantics; satisfiable only read-time or by a
   bounded recompute.
5. "Is X under /clouds" was the one GATE-consumable traversal in July's
   design; every concept-id design loses it. Contracts pin a release.
6. Whether REF targets must exist at admission (lazy concept records assume
   open-world references) and whether the 16-reference bound can be raised
   for `TagSet`/`VocabularyRelease`.
7. Could not be verified: Sankaku (all help routes dead), Danbooru's
   implication-removal code path, LCSH authority-record retention, Gelbooru
   alias retagging.

---

## 7. Next steps (additions to the sequence in indexing-and-state §9)

- Fold into step 2 (bitmap prototype): `TagSet` vs per-pair carriers, the
  `assert`/`deny`/`alive` families, ordinal verification, and the four owner
  queries plus a 3-tag AND and an in-listing NOT, measured on both schedules.
- Add: `foldImplied` word-wise over one scope, measured; a rename and a merge
  as bindings, asserting zero assertion rewrites.
- Add: one lens-spec amendment draft for the cardinality-N combinator
  (`UNION_PROVENANCE` / `ASSERT_WINS` / `PRIORITY`).
- Hand to the Booru PM: BOORU-04 rewrite; the "what a booru user assumes"
  table (research-2026-09-10/tags/booru-systems.md §8) as the parity ledger.
