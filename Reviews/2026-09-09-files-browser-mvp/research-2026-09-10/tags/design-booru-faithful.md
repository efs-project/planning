<!-- Tag deep dive strand: Architect memo: booru-faithful -->
<!-- Provenance: produced 2026-09-10 by a research/design agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering lead's
     reading, spot-checks and position are in ../../tag-system-2026-09-10.md. -->

# EFS v2 tag system — booru-faithful design memo

**Date:** 2026-09-10. **Status:** design proposal for the owner's tag deep-dive; not a ruling, nothing frozen. **Angle:** maximise Danbooru/e621/Hydrus parity first, then minimise on-chain cost, and say what parity costs. **Gas labels:** MEASURED (a real transaction, cited), QUOTED (spec/doc text), ESTIMATED (arithmetic from those). Schedules: today (fresh slot 22,100 / rewrite 5,000 / cold SLOAD 2,100) and Glamsterdam (110,020 / 12,100 / 2,100), per `Reviews/2026-09-09-files-browser-mvp/indexing-and-state-2026-09-10.md:37-46`. Reads are the same on both schedules. All paths below are under `/Users/james/Code/EFS/planning-fable-files-browser/`.

## 0. The design in twelve lines

1. **A tag is a stable concept Object, not a string and not a path.** `tagId` is the RecordId of a `TagConcept/1 {owner, salt}` genesis record; the name is a binding under it. This is the szurubooru/Wikidata/Notion shape, and it is the only shape under which the on-chain bitmap column survives a rename (the index is keyed by `tagId`; a name-bearing id splits the column on every rename and no REDIRECT re-merges bits).
2. **Bootstrap needs no coordination:** the SDK's default salt is `keccak("adhoc/1", canonicalName)`, so two clients tagging "nimbus" under the same principal derive the same id without a lookup; convergence across principals is an alias claim, exactly as in every booru.
3. **`/clouds/nimbus` is three claims on one concept:** a placement (`nimbus` at name "nimbus" under grouper `clouds` in vocabulary V — display and browse), a label ("Nimbus"@en), and, only if the curator says so, an implication `nimbus ⇒ clouds`. The grouper is a SKOS Collection, not a broader concept, and is excluded from transitive walks.
4. **Folders are not tags.** The active Files spine already makes a directory a stable Object whose name and parent are placements (`Designs/efsv2/hierarchical-files-and-folders.md:56-57`) and supersedes the July path-derived TAGDEF (`:9`). Vocabularies reuse that machinery: a vocabulary is a directory-shaped tree of concept placements.
5. **`image/png` is a typed field, addressable as a system tag.** The Files profile writes two bits at revision-bind time (`type:image/png`, `type:image`) under deterministic system concept ids. No string prefix matching, no vocabulary walk.
6. **All tag metadata is bindings at positions whose subject is the `tagId`** (label, category, canonical/alias, implies, wiki, status, related). Anyone writes under their own principal; a reader chooses a Vocabulary Plan (ordered principals + basis block); card-1 positions resolve first-present, card-N positions union.
7. **An assertion is `TagAssertion/1 {target, tag, polarity ASSERT|DENY, confidence}` bound at `(PURPOSE_TAG, target, role=tagId)` per principal.** Retract = tombstone; deny = bind a DENY record; supersede = rebind. A principal has exactly one current stance per (target, tag). This extends the MVP's existing TAG op (`Reviews/2026-09-09-files-browser-mvp/contracts/src/FilesRouterV2.sol:540-551`) by one word.
8. **Index rule:** every assertion writes (a) the binding head, (b) a packed global posting for the tag, and (c) if the writer names a placement `(listingPrincipal, D)`, one bit in the writer's own column `direct[scope(O,D)][tagId][writer]`. Implied ancestors go into a *separate* `implied` column, bounded at 16 per assertion, stamped with the writer's vocabulary basis. Denials go into a `deny` column.
9. **Implications are materialised at write time into `implied`, never retroactively by the protocol.** Adding an implication later reaches old files only through a paid, bounded, word-wise backfill (`implied[B] |= direct[A] | implied[A]`) per (scope, writer) column, or through read-time expansion in the client. Both are offered; neither is hidden.
10. **Rename = one binding rewrite. Merge = one canonical binding + read-time OR of two columns (optional paid merge). Split = deprecate + retag, as in Danbooru.** No assertion is ever rewritten.
11. **Pluralism:** `direct` is universal, `implied` is Plan-relative, `deny` is per-principal. A reader's Plan names which columns are read; the category of the tag (safety vs content) picks the combinator (ASSERT_WINS vs UNION). The contract claims only "under Plan P at basis b, these principals said this."
12. **What on-chain cannot do:** open-world NOT, global dense scans past a word budget, open attester sets, retroactive closure across all scopes, wildcard/prefix on labels, related-tag co-occurrence, ranking, historical counts. The web client does those with `eth_call` at a pinned block over the same columns plus local joins.

The cost, stated up front: parity with a booru's *semantics* is affordable at the spec floor (≈160k gas per assertion today, ≈660k under Glamsterdam, ESTIMATED); parity with a booru's *write volume* (35 tags per post, 12M posts) is not affordable on either schedule without the batching Type in §3.4, and even then the p95 100-tag post is a multi-transaction object under Glamsterdam. Today's MEASURED assertion is 2,838,264 gas (`Reviews/2026-09-09-files-browser-mvp/gas-engineering-2026-09-10.md:30`), 17× the floor; that gap is the physical-layer problem the gas report owns, not a tag-design problem, and nothing here hides it.

---

## 1. Identity

### 1.1 What the vault holds, and why none of it can be adopted as-is

Five incompatible identity formulas coexist (vault strand §2): July's `tagId = keccak(DOMAIN, parentTagId, keccak(name), kind)` (`Designs/efsv2/fable-handoff-v2-tag-core.md:70`), efs15's kind-less `H(DOMAIN_TAGDEF, parent, nameHash)` (`Designs/efs15/efs-id-1-candidate.md:151-171`), Stage A's flat `Topic/1{name}` (`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/harness-and-fixtures.md:505-506`), the booru draft's unformulated namespace-scoped `TagConcept` (`Designs/media-library/booru-app.md:128-137`), and the costing strand's bare `keccak(tagString)` (`Reviews/2026-09-09-files-browser-mvp/research-2026-09-10/indexing.md:105`). Three of the five put the name in the id. The active spine retired the path-derived one and gives tags no formula at all: "a tag is a many-valued relationship Record" (`Designs/efsv2/hierarchical-files-and-folders.md:107-111`).

The decisive fact is not taste; it is the index. The bitmap plan keys columns by `(scope, tagId)` (`indexing-and-state-2026-09-10.md:114`). If `tagId` carries the name, then renaming `nimbus` to `cumulonimbus` creates a new column, and every AND/NOT over the old column silently misses new assertions. Danbooru survives name-as-identity only because it owns a mutable database and runs `TagMover` over every post (`app/logical/tag_mover.rb:21-35, 73-82`, raw GitHub master, 2026-09-10); Wikipedia categories needed ~6.4M bot edits (Cydebot, `https://en.wikipedia.org/wiki/User:Cydebot`); LCSH took 2014–2021 for one heading. An immutable ledger has no rewrite path at all. szurubooru is the booru that got this right — integer id, many names, `post_tag` by id, rename free (`server/szurubooru/model/tag.py:57-98`).

### 1.2 The formula

```text
TagConcept/1 { owner: PrincipalId, salt: bytes32 }          // genesis record, ownerless-by-policy
tagId = RecordId(TagConcept/1, body) = keccak(TYPE_TAGCONCEPT_1, owner, salt)

default salt (SDK, no coordination needed):
  salt = keccak(DOM_TAG_ADHOC_1, keccak(canonicalName))      // canonicalName: NFC, lowercase, ' '→'_'
```

- Content-addressed, so it is a v2 Record like every other (`id = keccak(type, body)`), deduplicated by Core, portable, chain-free. The `core-architecture-candidate.md:133-135` line — "Topics and ownerless literals can use separate canonical genesis/value profiles rather than fake owners" — is satisfied: the owner word is provenance (who minted), never authority (kinds ruling: registration grants no privilege, `Reviews/2026-07-07-efsv2-corpus/kind-set-conservative.md:378`).
- The deterministic default salt gives Bluesky's property — a value scoped by its source (`https://atproto.com/specs/label`, label `val` scoped by `src`) — without a second identity family: a personal tag "toread" under Alice's principal is a real concept that can later be aliased to a community concept without changing its id.
- Because keccak is one-way, a bare `tagId` is unreadable (the July red-team caveat, `fable-handoff-v2-tag-core.md:71`). Therefore **first use of a concept in a Realm must publish one label binding** (§2). Cost of a new concept, minimum: genesis record + label record + label binding.
- The `kind` word from July (GENERIC/DATA/PROPERTY/LIST) is dropped: it existed to keep folder-names and file-names apart in one shared namespace (`kind-set-conservative.md:379`). Tags no longer share the path namespace, so name shadowing across kinds (`Designs/efsv2/read-lens-spec.md:275-285`) is not a tag problem.

### 1.3 `/clouds/nimbus`

The owner's v1 memory is not written anywhere in the vault (vault strand §1.4 could not find a nimbus/clouds display rule; the closest is "canonical TAGDEF segment; display name remains metadata", `Designs/efsv2/mountable-filesystem-semantics.md:123`). Here it becomes three separately authored claims, all on `tagId(nimbus)`:

| Claim | Position | Who | Meaning |
|---|---|---|---|
| Placement | `PositionKey(PURPOSE_VOCAB_NAME_SLOT_1, groupObject(clouds), nameRole("nimbus"))` → `VocabularyEntry/1 {parent, name, concept}` | vocabulary principal V | "in V's tree, `nimbus` is filed under `clouds`" — the **grouper**. Browsable exactly like a Files directory (same name-slot grammar as `hierarchical-files-and-folders.md:622-640`, own Type so Files/1's FILE/DIRECTORY meaning check at `:431-433` is untouched) |
| Label | `PositionKey(PURPOSE_TAG_LABEL_1, tagId, langRole("en"))` → `TagLabel/1 {tag, lang, text:"Nimbus"}` | anyone; Plan picks | what the chip says |
| Implication | `PositionKey(PURPOSE_TAG_IMPLIES_1, tagId(nimbus), roleOf(tagId(clouds)))` → `TagImplication/1 {from, to}` | anyone; Plan picks | only if the curator means "every nimbus photo is a clouds photo" |

SKOS is explicit that a node label/grouper "does not represent a label for a concept in its own right" and that Collections may not sit in `broader` chains (`https://www.w3.org/TR/skos-reference/` §9.6.4; Primer §4.1); Wikipedia's `{{Container category}}` is the same rule. Danbooru's newest implication, `kaiser_pmc_director_(hawaii)_(blue_archive) -> kaiser_pmc_director_(blue_archive)` (`/tag_implications.json` id 246196, 2026-09-10), shows the booru convention: the "folder" is a naming suffix *plus* an explicit implication edge, never a path. The vault's "is X under /pizza = walk `_parents`" (`fable-handoff-v2-tag-core.md:70`) survives for **paths** (one homogeneous containment relation, GATE-consumable per `Reviews/2026-07-10-fs-pass-corpus/query-graph-boundary.md:135`) and is replaced for **tags** by the typed `implies` walk (§2.3).

### 1.4 `images` vs `image/png`

A typed field on `FileRevision/1` (media type), not a vocabulary tag. The owner's own clarification question names the trap: "'images' versus 'image/png' is a prefix relation on one field — cheap if the schema declares the extra posting, impossible to add later to opaque strings" (`indexing-and-state-2026-09-10.md:428-430`). Rule:

```text
SYS = the system vocabulary principal (a fixed constant, no keys)
tagId(type:image/png) = RecordId(TagConcept/1 {owner: SYS, salt: keccak(DOM_SYS_MEDIATYPE_1, "image/png")})
tagId(type:image)     = RecordId(TagConcept/1 {owner: SYS, salt: keccak(DOM_SYS_MEDIATYPE_1, "image")})
```

At every revision bind the Files profile sets both bits in the *placer's* column. Any query over "images" is then an ordinary column scan, and `images AND nsfw` is a plain bitmap AND with a curator column — one query grammar for fields and tags. Booru parity: this is the `type:png` metatag (Danbooru `post_query_builder.rb:31-38`), which boorus also implement as a column, not a tag. Cost: +5,070 today / +12,500 Glamsterdam per extra bit, ESTIMATED (`indexing.md:72`). The same mechanism serves `rating:`, `width:>=1920` bucketed (exact buckets only — ranges are off-chain by constitution `Designs/efsv2/system-constitution.md:185-187`).

---

## 2. Tag metadata — the booru "dynamic tag"

Records are immutable; everything a booru edits on a tag row (Danbooru `tags.category`, `is_deprecated`, wiki, aliases, implications, `related_tags`) becomes a binding at a position whose **subject is the `tagId`**. Positions are the generic `PositionKey(purpose, subject, fieldRole)`; bindings are Principal-qualified (`hierarchical-files-and-folders.md:638-639`). Nothing here is a Core primitive.

### 2.1 Positions

| Purpose | fieldRole | Card. per principal | Target record | Booru equivalent |
|---|---|---|---|---|
| `PURPOSE_TAG_LABEL_1` | lang | 1 | `TagLabel/1 {tag, lang, text ≤170B}` | tag name; SKOS `prefLabel`, S14 one per language |
| `PURPOSE_TAG_ALTLABEL_1` | keccak(text) | N | `TagLabel/1` | search-only spellings; Wikidata aliases (search keys, never identity) |
| `PURPOSE_TAG_CATEGORY_1` | 1 | 1 | `ref(TagConcept)` of a category concept (`artist`, `character`, `species`…, themselves concepts in SYS or a community vocab) | Danbooru category int; e621's 9; Hydrus namespace |
| `PURPOSE_TAG_CANONICAL_1` | 1 | 1 | `ref(TagConcept)` B: "A's ideal is B" | Danbooru alias `A -> B`; Hydrus sibling (one ideal, `advanced_siblings.html`) |
| `PURPOSE_TAG_IMPLIES_1` | roleOf(B) | N | `TagImplication/1 {from A, to B}` | implication; Hydrus parent (n→n) |
| `PURPOSE_TAG_RELATED_1` | 1 | 1 | `RelatedTags/1 {tag, refs[≤25]}` | e621 `related_tags` string (25 pairs, computed by job) |
| `PURPOSE_TAG_WIKI_1` | lang | 1 | `ref(FileRevision)` or `Document/1` | wiki page; Danbooru requires wikis on both sides of an implication |
| `PURPOSE_TAG_STATUS_1` | 1 | 1 | `TagStatus/1 {deprecated, locked, dnp, invalid}` | `is_deprecated`, `is_locked`, e621 `avoid_posting` |
| `PURPOSE_TAG_GOVERNANCE_1` | proposalId | N | `BulkUpdateRequest/1 {lines[≤100], reason, forumRef}` | BUR (Danbooru `processor.rb:7` max 100 lines) |

Enumeration of card-N positions ("all implications of A under principal P") is exactly the kind-10 BindingScope page over `(P, PURPOSE_TAG_IMPLIES_1, A)` (`hierarchical-files-and-folders.md:690-708`) — already paid for at first bind, no new family.

### 2.2 Who may write, and how a reader picks a vocabulary

Anyone, under their own principal. There is no registration gate; Stack-Overflow-style creation friction is the *cost* of the genesis+label write and the UI's autocomplete from the Plan's existing concepts (theory strand P7: convergence is a UI/social effect — Golder & Huberman 2006, Suchanek 2008; contract-level vocabulary enforcement appears in no working system).

A **Vocabulary Plan** is an ordinary lens Plan (`Designs/efsv2/lens-spec.md:16,35`): a Roster of `(tier, principal)` plus combiner, purpose-locked to the tag purposes above. Card-1 positions (label, category, canonical, status, wiki, related) resolve `PRIORITY_FIRST_PRESENT` — first principal in the roster with a bound head wins, which is precisely Hydrus's ordered sibling-application list ("The service at the top of the list has precedence over all else", `getting_started_more_tags.html` line 262, hydrusnetwork.github.io, 2026-09-10) and its `AddPair` rule (first service wins per bad tag, `ClientDBTagSiblings.py:986-1020`). Card-N positions (implies, altlabel, governance) resolve `UNION` — Hydrus unions parents across services (`TagParentsStructure.AddPair`). Cycles in the union are dropped by the reader (Hydrus does; Wikidata tracks P279 cycles to 6th order and cannot prevent them).

**Vocabulary version pinning.** A version is `(PlanId, basisBlock)`. Every query page and every write that expands implications carries it. For effectful consumers (a contract or a GATE), an optional `VocabularySnapshot/1 {plan, basis, heads[(tagId, purpose, role, recordId)] ≤ 64}` record pins the exact heads used, so a later vocabulary edit cannot change what the contract evaluated — the same discipline as the consumer-tournament verdict (pin the TypeId/view, `indexing-and-state-2026-09-10.md:224`).

### 2.3 Bounds (read-side, normative for the SDK)

- Alias chains: ≤ 8 hops (Danbooru forbids chains at the validator, `tag_alias.rb:39-60`; Hydrus allows transitive chains — 8 covers both).
- Implication closure: ≤ 16 ancestors per assertion at write (§4.2), ≤ 8 hops at read.
- Roster: the lens design center of 15–55 entries (`lens-spec.md:97`); on-chain Plans are bounded at 1/8/32/64 (`hierarchical-files-and-folders.md:671-672`).

---

## 3. Assertions

### 3.1 Record and position

```text
TagAssertion/1 {
  target:     ref(object)            // File/Directory/Post Object — the stable ObjectId, never a revision
  tag:        ref(object TagConcept/1)
  polarity:   uint8   ASSERT=1 | DENY=2
  confidence: uint8   0..255 (0 = unstated)        // e621/Sankaku AI-tag scores, human = 255
}                                                  // 66 bytes; evidence, if any, is a separate Evidence/1 record referencing this one

position = PositionKey(PURPOSE_TAG_1, target, roleOf(tagId))
binding  = BindingKey(principalId, position)
```

- **Attribution** is the binding's principal (the Occurrence's author), never a field in the record — so the record is author-neutral and content-addressed: curator B asserting the same `(F, T, ASSERT)` reuses A's record and pays only the binding (`booru-app.md:164-166`; measured in `Reviews/2026-09-08-upgradeable-foundation/validation-frontier.md:71-89`).
- **Polarity in the body, one position per (principal, target, tag)** fixes PRD-27 (assert and deny sharing a backlink key and both counting as live): a principal's current stance is exactly one of {ASSERT, DENY, none}; the head tells you which. Bluesky's `neg` is retraction, not denial (`https://atproto.com/specs/label`); EFS keeps both: **retract = tombstone** ("I make no claim", permits Plan fallthrough), **deny = DENY record** ("I claim it is not", subtracts). This is the read-lens rule that "advisory claims are ordinary claims… a derivable point read" (`read-lens-spec.md:224`) applied to tags.
- **Weight is dropped.** Danbooru, e621, szurubooru and Hydrus have no per-assertion weight; v1's `int256 weight` was ruled kernel-neutral forever (`kind-set-conservative.md:240`). `confidence` is the booru-faithful residue (AI tagging scores, `booru-app.md:54-58`). If a weight is ever wanted it is an additive field.
- **Supersede** = rebind the position to a new record (e.g. confidence changed). History is Core's binding history — the `post_versions` table (9.57 GB gzip on e621, `/db_exports.json`, 2026-09-10) comes free.
- **Live count ≠ current claims.** The index's occurrence `live` count is not the number of current stances; readers join the Principal-qualified head (`validation-frontier.md:86-89`). Counts are popcounts of columns (§4), never a stored per-tag integer maintained per assertion (e621 abandoned DB counts for OpenSearch; the beacon-contract lesson in `gas-engineering-2026-09-10.md:222-248`).

### 3.2 Compatibility with the MVP

The MVP already writes `TAG` as a 64-byte `(tagId, object)` leaf + a binding at `(tagPurpose, object, aux=tagId)` and `UNTAG` as a tombstone (`FilesRouterV2.sol:540-551`; acceptance "A's untag preserves B's", `Reviews/2026-09-09-files-browser-mvp/acceptance.md:23`). This design adds one packed word (polarity, confidence) to the leaf and a placement reference to the op. Nothing in the MVP's identity or binding grammar changes.

### 3.3 Placement reference (what makes the bitmap possible)

A `TagAssertion` op MAY name one placement `(listingPrincipal O, directory D)`. The bitmap index (§4) lives over O's kind-10 scope ordinals for D (`indexing-and-state-2026-09-10.md:110-114`); a tag bit is meaningful only at a specific placement's ordinal. If the writer names none, no bit is written and the assertion is still fully valid, point-probe-able and globally posted — it is just invisible to directory-local AND/NOT until someone sets the bit. If the file has three placements, three bits are three writes. This is the honest shape: bits belong to placements (a booru "post"), assertions belong to Objects (a booru "work") — BOORU-01 (`booru-app.md:79`).

### 3.4 The batching Type (for booru write volume)

`TagSet/1 {target, tags[≤16] ref(TagConcept), polarity: ASSERT}` bound at `(PURPOSE_TAGSET_1, target, setIndex)`. It writes the same bits and postings as 16 separate assertions but one record and one binding. The vault noted this lever and that nobody had written it down (`Reviews/2026-09-02-efs2-coherence-review-corpus/seams/S3-media-x-types-x-indexes.md:80`). Its cost: the per-(F,T) *binding* point probe disappears — but the *bit* probe (2 SLOADs) does not, so with the bitmap layer in place TagSet loses nothing a contract needs. Its price: every edit rebinds a fresh 16-ref record (Danbooru also rewrites the whole `tag_string` on every save, `post.rb:424-426`). Numbers in §8.

---

## 4. Index materialisation rule

### 4.1 What one assertion writes (normative list)

| # | Write | Key | Purpose | today | Glamsterdam |
|---|---|---|---|---|---|
| a | `TagAssertion/1` record (skipped if it exists: 1 SLOAD) | RecordId | truth | 3 fresh slots ≈ 66,300 | ≈ 330,060 |
| b | binding head (fresh) | `BindingKey(P, pos)` | current stance | 22,100 | 110,020 |
| c | BindingScope append `(P, PURPOSE_TAG_1, F)` + head rewrite | kind 10 | "everything P tagged on F" | 27,100 | 122,120 |
| d | global tag posting, **packed 8 ordinals/word** | `(TagAssertion/1, role=tag, tagId)` (kind 6) | booru `tag:T` global list, newest-first paging | ≈ 7,760 amortised | ≈ 25,850 |
| e | object backlink posting, packed | `(0, targetKey=F)` (kind 5) | "which records point at F" — ruled required (`Designs/efsv2/onchain-graph-queries.md:11-15,55`) | ≈ 7,760 | ≈ 25,850 |
| f | `direct[scope(O,D)][tagId][P]` bit (if placement named) | bitmap | AND/NOT within listing, O(1) probe | ≈ 5,070 | ≈ 12,500 |
| g | `implied[scope(O,D)][A_i][P]` bit × d ancestors, d ≤ 16 | bitmap | ancestor probes for contracts | 5,070·d | 12,500·d |
| h | `deny[...]` bit instead of f, when polarity=DENY | bitmap | deny-wins reads | 5,070 | 12,500 |
| i | optional `count[scope][tagId][P]` rewrite | slot | sparsest-first planning | 5,000 | 12,100 |
| — | ABI/keccak/intrinsic share (≈15%, from the MEASURED 28% plumbing halved by gas-engineering §5.6) | | | ≈ 20,000 | ≈ 20,000 |
| | **Floor, first assertion of (F,T), d=0, no count** | | | **≈ 161k** | **≈ 658k** |
| | **Floor, another principal re-asserting existing (F,T)** | | | **≈ 97k** | **≈ 330k** |
| | **MEASURED today, MVP (no bits, no packing, 94 slots)** | | | **2,838,264** | ≈ 11.1M (ESTIMATED, `indexing-and-state:41`) |
| | Engineering target after gas-engineering §5.1–5.6 | | | 400–700k (ESTIMATED, `gas-engineering:134`) | — |

All rows ESTIMATED except the MEASURED line. Row (a) assumes a Store-style packed record (3 slots; MUD measured 2 slots for 64 B, `indexing-and-state:259`); rows d/e assume packed 32-bit ordinals — id-per-entry postings at 22,100/110,020 each are the shape the repricing punishes (`indexing-and-state:88-90, 203`). Row (f) is the `indexing.md:44` amortised figure (5,000 typical; 22,100 when a word opens).

Removing a tag: tombstone rewrite 5,000/12,100 + clear bit 5,000/12,100 (refund only if the word empties). Rebinding a position to a new revision with a different media type: flip the two system bits, 5,070 each.

### 4.2 Implications: write time, with an explicit non-promise

**At write:** the SDK reads the writer's Vocabulary Plan at the pinned basis, computes the closure of T (≤ 16, deterministic order, cycles dropped), and the op sets `direct[T]` plus `implied[A_i]` for each ancestor. The op carries `(PlanId, basisBlock)`; the router stores it once per `(scope, P)` column-set as `impliedBasis[scope][P]` (one slot, rewritten only when it changes). That is Danbooru's `tags_implied_by` at save (`post_edit.rb:44-50`) — but into a **separate column**, which is Hydrus's storage/display split (`developer_api.html:2381`: `storage_tags` vs `display_tags`). Why separate: e621's own comment concedes that once an alias/implication has rewritten a post, "an occurrence of the consequent tag can no longer be told apart from one the user put there on purpose" (`app/models/tag_alias.rb:206-215`, raw master, 2026-09-10); a mixed column cannot be un-implied. Two columns cost one extra word per predicate per 256 entries at read (§4.4) and 5,070·d at write.

**Adding an implication later (`nimbus ⇒ clouds` after 300 nimbus photos exist):**
- The protocol does nothing. New assertions of `nimbus` set `implied[clouds]`; old ones do not. `impliedBasis` tells a reader that P's implied column predates the edge.
- **Paid backfill, bounded per call:** `backfill(scope, P, A, B, fromWord, toWord)`: for each word, `implied[B][w] |= direct[A][w] | implied[A][w]`. Cost per word: 2 SLOADs + 1 SSTORE = 4,200 + (5,000 rewrite | 22,100 fresh) = **9,200–26,300 today; 16,300–114,220 Glamsterdam** (ESTIMATED). Anyone may pay; the natural payer is the vocabulary curator who added the edge (Danbooru: BUR approval triggers `update_posts!` re-saving every post under a row lock, `tag_implication.rb:157-166`; e621 does it in Sidekiq with undo snapshots). After backfill the router bumps `impliedBasis[scope][P]`.
- **What the backfill cannot do:** find the scopes that contain A. The index has no "which directories hold tag A" map (`indexing-and-state:57-73` lists the families; none is tag→scopes). The booru case is fine — one corpus, one scope — but a tag used across 10,000 personal directories is backfilled only where someone pays.
- **Removing an implication:** drop the edge (one tombstone); `implied[B]` keeps stale bits until a `rederive(scope, P, B, words)` call recomputes `implied[B] = OR over remaining A_i ⇒ B of (direct[A_i] | implied[A_i])` — cost 2,100·(#remaining edges)+SSTORE per word. This is e621's `undo!` (`tag_implication.rb:217-332`) made explicit and bounded; Danbooru cannot do it at all (`reject!` only flips status, `tag_relationship.rb:58-65`).
- **Read-time expansion** always remains available in the client and is correct under *the reader's* Plan regardless of what any writer materialised (§7).

**Why not read-time only?** A contract probing "is F nsfw or anything implying it" needs the fan-in of `nsfw`; e621's `breasts`-class fan-in is hundreds of tags → ~0.4M gas per probe, unaffordable in a transaction (booru strand §8). Write-time bits make that probe 2 SLOADs. **Why not write-time only?** Because old files never change, and two communities' closures differ (§6). Hence both, with the honesty stamp.

### 4.3 The four owner queries — worked at n = 1,000 (W = 4), Plan [A, B], listing principal O

Reads are unchanged by Glamsterdam. Hydrating a hit (entry name + object) is ≈ 2,100–4,200 per hit on top; page it.

| Query | Columns read | Words | Gas (ESTIMATED) | Notes |
|---|---|---|---|---|
| tagged `images` | `direct[type:image][O]` | 4 | **8,400** | system bit set by the placer; one principal |
| tagged `image/png` | `direct[type:image/png][O]` | 4 | **8,400** | second bit written at bind time; same price |
| tagged `nsfw` (UNION) | `direct[nsfw][A]`, `direct[nsfw][B]` | 8 | **16,800** | + `implied` columns if enabled: +16,800; + `deny` for DENY_WINS: +16,800 |
| **NOT** tagged `nsfw` | `alive[O]` & ~(A ∪ B) | 12 | **25,200** | legal only because the listing is a closed universe (`indexing-and-state:77-79, 157`); `alive` is the placer's whiteout/tombstone-maintained bitmap |
| membership probe (contract): "did A tag F nsfw?" | binding head (polarity packed in flags) | — | **2,100** | or 2 SLOADs on the bit; the operation a game contract runs most |
| membership under Plan [A,B], ASSERT_WINS | 2 heads | — | **4,200** | |

At n = 10,000 (W = 40) multiply the word counts by 10 (`nsfw` UNION = 168k; NOT = 252k); at n = 100,000 the NOT is ≈ 2.5M — `eth_call` territory, so the read surface must take `(fromWord, toWord)` like Uniswap's `tickBitmap` (`indexing-and-state:160-163`).

### 4.4 Booru staples, same directory

| Query | Cost (ESTIMATED) | How |
|---|---|---|
| `A AND B AND C`, Plan [A,B] | 3 tags × 2 principals × 4 words = 24 words = **50,400** | word-wise AND; selectivity irrelevant |
| `A OR B` | 16 words = **33,600** | word-wise OR |
| `A AND NOT B` | (2+1+2) × 4 = 20 words = **42,000** | within listing |
| `artist:alice` | 1 head read (name slot under the vocabulary grouper `artist/`) ≈ 2,100–4,300, then a column scan | namespace = grouper placement; category binding is the authoritative facet |
| alias `red_fox` → `fox` | `PURPOSE_TAG_CANONICAL_1` head under Plan: 2,100 per roster principal per hop, ≤ 8 hops | resolved at read *and* canonicalised at write so new bits land on the ideal (Danbooru `to_aliased` at both ends, `post_edit.rb:83-99`, `post_query.rb:196-200`) |
| global `tag:fox` list, newest first | packed posting: 2,100 per 8 entries; a 20-item page ≈ **6,300** | row (d); descending = read from the tail |
| global `fox AND canid` (open corpus) | enumerate the rarer posting (e.g. 2,000 entries → 525k) and probe the other's bit per candidate (2 SLOADs) — but the probe needs the candidate's placement ordinal, which the posting must carry (pack `(scopeIdx, ordinal)`) | the query-graph-boundary line: one enumeration + point probes (`query-graph-boundary.md:12,107`); the vault's 3-tag example was ≈ 4.2M with head probes (`:301`) — bit probes are ~3× cheaper |
| count of `nsfw` in D | popcount of 8 words = 16,800 (+ ~10 per set bit) | never a stored integer; governance thresholds (Danbooru 200/1,000, e621 100/10,000 posts) become a paid read |
| wildcard `fox*` | **not on-chain** | Danbooru caps it at 100 tags via trigram GIN; on EFS the client filters its local label table (§7) |
| `-tag` where the universe is "all posts ever" | **not on-chain** (`query-graph-boundary.md:123`) | client/indexer, as-of labelled |

The Lens read formula: **words per predicate per 256 entries = (listing principals) × (tagger principals) × (columns enabled: direct, +implied, +deny).** Danbooru's 2/6/∞-tag limits and 3/6/9 s statement timeouts (`user.rb:662-692`) and e621's 40-tag cap (`config:382-384`) are the same knob as an `eth_call` gas ceiling; the SDK exposes it as a word budget.

### 4.5 Hot directories: the Roster column (optional, additive)

When m curators is large, k·m reads hurt. A **curation contract** that owns one principal and accepts assertions from a roster writes a single pre-combined column — the "hundreds-of-curators folders are bespoke curation contracts publishing one principal" pattern (`lens-spec.md:97`), and literally Hydrus's one display cache per (file domain, tag domain). It is a write-gate (governance), not an index primitive, and the individual curators' own columns still exist for anyone who distrusts the roster. Not required for the MVP.

---

## 5. Rename, merge, split

| Operation | On EFS | Cost today / Glam (ESTIMATED) | What it does *not* touch |
|---|---|---|---|
| **Rename** `nimbus` → `cumulonimbus` | new `TagLabel/1` record + rewrite the label head | 66,300 + 5,000 = **71k / 342k** | every assertion, every bit, every link; old label stays in binding history (Danbooru `tag_versions`) |
| **Regroup** `/clouds/nimbus` → `/weather/nimbus` | tombstone old placement + bind new | ≈ 5,000 + 115,500 = **121k / 574k** | identity, assertions |
| **Recategorise** general → character | rewrite category head | **5,000 / 12,100** | Danbooru re-saves every post to recount `tag_count_<cat>` (`tag.rb:167-185`) — do not replicate |
| **Merge / alias** A → B | bind `PURPOSE_TAG_CANONICAL_1` under A → B (record + head + scope) | **115k / 562k** | A's column stays; readers compute `effective(B) = B ∪ aliasesOf(B)` (reverse map = kind-6 backlink on `TagAlias` records, one page; bounded ≤ 8); optional paid word-wise merge `direct[B] |= direct[A]` at the backfill price (§4.2) after which A's column is ignorable |
| **Un-alias** | tombstone the canonical head | 5,000 / 12,100 | nothing was rewritten, so nothing to undo — the e621 undo problem does not exist |
| **Split** A → A1, A2 | mint A1, A2; bind `TagStatus{deprecated}` on A; wiki pointing at A1/A2; curators retag | 2 × new-tag + retags at assertion price | nobody can split automatically (which nimbus is which?); Danbooru's answer is `deprecate` + a wiki listing replacements + manual BUR `update` lines — same here |
| **Deprecate** | `TagStatus/1` head | 5,000–115k | UI refuses to *add* a deprecated tag (Danbooru `post_edit.rb:76-79`); existing assertions untouched |
| **DNP** an artist | operator binds `TagStatus{dnp}` on the artist concept + an ADVISORY/1 rule in the serving Lens | one head | it is a Lens/serving decision, not a rewrite; nothing public is erased (BOORU-16) |

Links never break: a `web3://…/~tag:<tagId>` citation resolves the concept forever; the label it shows depends on the reader's Plan and basis. Compare: Danbooru's BUR `rename` is capped at 200 posts (`command/rename.rb:7`) *because* rename is O(posts); here rename is O(1) and the cap disappears.

---

## 6. Pluralism

**Case 1 — hierarchy.** Vocabulary V1 (meteorology) says `nimbus ⇒ clouds`; V2 (Latin-names club) says nimbus is not under clouds and files it under `/latin/`. Curator A tags under V1, B under V2.

- Reader with Plan [V1]: `nimbus` placement shows under `clouds`; A's `implied[clouds]` bits are stamped `impliedBasis = (V1, b)` → trusted; B's implied column is stamped V2 → the SDK ignores it for `clouds` and expands B's `direct[nimbus]` at read under V1 instead. The `direct` column is Plan-independent truth; `implied` is Plan-relative and says so.
- Reader with Plan [V2]: sees nimbus under `/latin/`; A's implied bits are foreign and ignored; a query for `clouds` does not include nimbus photos unless the reader also subscribes V1.
- On-chain honest claim: `implied[clouds][A]` means "A, following (V1, b), materialised clouds for these ordinals" — never "these are clouds photos".

**Case 2 — meaning of `nsfw`.** A (strict) asserts nsfw on 30 photos B (permissive) denies. The category of `nsfw` in the reader's vocabulary is `safety`, so the combinator is ASSERT_WINS: under Plan [A,B] or [B,A] all 30 are nsfw, and the UI shows "A: nsfw · B: denies" — the "who said what" requirement (`Reviews/2026-07-29-target-communities/visual-gallery-and-booru-ecosystems.md:157-168`). For a content tag (`character:foo`) the combinator is UNION with visible provenance; a `PRIORITY` combinator (first roster principal with a stance wins per (file, tag)) is available for viewers who want one curator's word. Bluesky's `decision.ts` does the same thing with severities: union of causes, most restrictive wins, no ordering among labelers (`packages/api/src/moderation/decision.ts`, 2026-09-10). The vault already asked for exactly this: "Curator policy selects which assertions count… it does not erase the rest" (`booru-app.md:166-167`). The July Lens's single combinator (first-attester-wins, `fable-handoff-v2-tag-core.md:33`) is right for card-1 positions and wrong for tag claims; the lens-spec's ADVISORY/1 and DISCOVERY/1 profiles (`lens-spec.md:52`) are the two combinators this design uses.

**What is honest to claim on-chain, in one sentence:** a contract that reads `direct[nsfw][A] | direct[nsfw][B]` at block b under Plan P may assert "under P at b, A or B asserted nsfw at this ordinal" — and nothing about anyone outside P, nothing about the file's other placements, and nothing about later blocks. The read-lens "closed, trusted author sets" limitation (`Designs/efsv2/owner-rulings.md`, 2026-07-15 item F) applies verbatim.

---

## 7. Not answerable on-chain, and what the web client does with `eth_call`

**Not answerable (say so in the product):**
1. NOT over an open universe ("every post not tagged X"): non-monotone, unbounded (`query-graph-boundary.md:123`). Only within a listing.
2. Dense global scans past the word budget: `1girl` over Danbooru's 12,116,012 posts (`/counts/posts.json`, 2026-09-10) is 47,329 words ≈ 99M gas per full pass; only tail-paging (newest N words) and sparse tags via two-level summaries fit (`indexing.md:70,75`).
3. A Lens over an open attester set ("anyone who tagged this"): the columns are per principal; there is no on-chain union over unknown writers (`indexing-and-state:117-120`).
4. Retroactive implication closure across all scopes; "which scopes hold tag A".
5. Wildcard/prefix/fuzzy on labels (`fox*`, `night~`), full-text wiki search, autocomplete (Danbooru's trigram/tsvector GINs, `structure.sql:5862-5911`).
6. Related-tag co-occurrence over the corpus (Danbooru samples 5,000 posts and caches 8 h; e621 stores 25 pairs per tag by job).
7. Ranking, trending, `order:score`, historical counts ("nsfw as of block N" — only current bindings are indexed, `indexing-and-state:176-177`).
8. Counts at governance thresholds as stored integers.

**The web client, `eth_call` only, no Graph:**
- Pin a `blockTag`; compare the scope `count` before/after each page (`indexing-and-state:167-169`).
- Build the vocabulary locally: page the Plan principals' `PURPOSE_TAG_LABEL_1` / `_CATEGORY_1` / `_CANONICAL_1` / `_IMPLIES_1` BindingScopes once per session (a 40-tag vocab ≈ 200 heads ≈ 0.5M gas of free reads; Danbooru-scale 2.7M tags is a multi-minute sync the way Hydrus's PTR is, and is cached). Autocomplete, wildcard, namespace prefix, alias chains and implication walks (≤ 8 hops) are then local.
- Directory queries: bitmap scans by word range; NOT only inside the listing, labelled "within this listing, for principals {…}".
- Global `tag:T`: page the packed posting from the tail; AND via rarest-posting + bit probes; anything that needs a second enumeration goes to a labelled as-of lane.
- Private blacklist: joined locally after results arrive, resolved through the alias heads so a rename never breaks it (`booru-app.md:211-215`; Danbooru instead string-rewrites every user's blacklist on alias, `tag_mover.rb:134-142`).
- Related tags, counts, ranking: computed client-side over the page or from an optional curator-published `RelatedTags/1`.
- Every result page carries `(Plan, basis, columns read, completeness)`; `UNKNOWN` is rendered distinctly from zero (`booru-app.md:216-218`).

---

## 8. Worked example — 1,000 photos, 40 tags, two curators who disagree

Setup: owner O places 1,000 photos in `D` (W = 4). Curator A mints a 40-concept vocabulary with 10 implications, 5 aliases, 40 labels, 40 placements, 40 categories, and tags at ≈ 5 tags/photo (5,000 assertions; booru p50 is 35). Curator B, following a different vocabulary, re-asserts 3,000 of A's pairs, adds 500 new pairs, and denies `nsfw` on 30. All figures ESTIMATED at the spec floor (§4.1); the MEASURED MVP rate is shown for scale.

**Vocabulary (one-time, A):**

| Item | each today / Glam | × | today | Glam |
|---|---|---|---|---|
| concept genesis (3 slots) | 66,300 / 330,060 | 40 | 2.65M | 13.2M |
| label record + head + scope | 115,500 / 562,200 | 40 | 4.62M | 22.5M |
| placement under grouper | 115,500 / 562,200 | 40 | 4.62M | 22.5M |
| category head + scope (record shared) | 49,200 / 232,140 | 40 | 1.97M | 9.3M |
| implication record + head + scope | 115,500 / 562,200 | 10 | 1.16M | 5.6M |
| alias | 115,500 / 562,200 | 5 | 0.58M | 2.8M |
| **total** | | | **≈ 15.6M** | **≈ 76M** |
| per new tag, full / minimum (genesis + label only) | **≈ 390k / 182k** | | | **≈ 1.9M / 0.89M** |

B reuses A's concepts (content-addressed, 0 cost) and publishes 3 differing implications and 2 labels: ≈ 0.6M / 2.8M.

**Assertions:**

| Writer | Kind | n | each | today | Glam |
|---|---|---|---|---|---|
| O | system bits at bind (2 per photo) | 2,000 | 5,070 / 12,500 | 10M | 25M |
| A | first assertion of (F,T), d≈1 implied | 5,000 | 166k / 671k | 830M | 3.36B |
| B | re-assert existing pair (record skipped) | 3,000 | 97k / 330k | 291M | 990M |
| B | new pairs | 500 | 161k / 658k | 81M | 329M |
| B | DENY nsfw | 30 | 161k / 658k | 4.8M | 20M |
| | **total tagging** | 8,530 | | **≈ 1.22B** | **≈ 4.7B** |
| | same at MEASURED MVP rate (2,838,264, no bits) | 8,530 | | **≈ 24.2B** | ≈ 95B |
| | for scale: 1,000 file creates at MEASURED 8,766,869 (`report-for-codex-2026-09-10.md:145`) | | | 8.77B | — |

At the floor, booru-density tagging of the directory costs ≈ 14% of creating its files at today's measured rate; at today's measured tag rate it costs 2.8× the files. Under Glamsterdam the floor per first assertion (≈ 660k) is 3× today's, and a 35-tag booru post (≈ 23M) exceeds the 16,777,216 EIP-7825 cap → two transactions, the same conclusion S3 reached for B0 (`S3-media-x-types-x-indexes.md:68-80`). With `TagSet/1` (§3.4): 16 tags ≈ 17 slots + binding + bits ≈ 506k today / 2.3M Glam ≈ 32k / 144k per tag — 5× cheaper to write, but each edit is a fresh 17-slot record (≈ 380k / 1.9M); at e621's observed ~5 versions per post (post_versions export 9.57 GB vs posts 1.94 GB) TagSet still wins ≈ 30% over the lifetime of a post. Recommendation: per-pair is canonical (the MVP has it); TagSet is additive and measured before adoption.

**Later events:**
- A adds `nimbus ⇒ clouds` (300 nimbus photos): edge 115k / 562k; backfill of `implied[clouds][A]` over 4 words: 37k–105k / 65k–457k; B's column is untouched because B does not follow A's vocabulary.
- A renames `nimbus` → `cumulonimbus`: 71k / 342k. Zero assertions touched. (Danbooru-equivalent on EFS: 300 × 161k = 48M.)
- Reader with Plan vocab=[A], tags=[A,B]: "images AND nimbus AND NOT nsfw" = `direct[type:image][O]` (4) + `direct[nimbus][A]`, `direct[nimbus][B]`, `implied[nimbus][A]` (12) + `alive` (4) + `direct[nsfw][A]`, `direct[nsfw][B]` (8) = 28 words ≈ **58,800**, plus hydration of hits. Under ASSERT_WINS, B's 30 denials change the rendering ("B disputes") not the set; under DENY_WINS the reader adds `deny[nsfw][B]` (4 words, +8,400) and 30 photos move.
- A game contract asking "is photo #412 nsfw under [A,B]": 2 head reads = **4,200**.

---

## 9. Owner decisions

| # | Decision | Recommendation | Cheapest reversible default | Reversibility note |
|---|---|---|---|---|
| 1 | Tag identity: concept genesis `{owner, salt}` vs name-derived | concept genesis with deterministic ad-hoc salt | same | name-derived is *not* reversible once bitmap columns exist; concept ids can always gain a name-derived alias layer |
| 2 | Are folders tags? | no; vocabulary trees reuse the name-slot machinery, own Type | same | the active spine already ruled it for Files (`hierarchical-files-and-folders.md:9,56-57`) |
| 3 | `image/png`: field or tag? | typed field materialised as two system-tag bits at bind | same (≈ 10k/photo today) | bits can be added later only by a paid pass over every placement |
| 4 | Assertion shape | per-pair binding, polarity in body, no weight, optional confidence | same (extends the MVP op) | `TagSet/1` additive; weight additive |
| 5 | Implication materialisation | write-time into a separate `implied` column, ≤ 16, stamped with basis; no protocol backfill; paid bounded backfill op | **read-time only, `implied` column reserved** (saves 5,070·d per assertion) | enabling later = the backfill op; disabling = ignore the column |
| 6 | Deny as separate column | yes | same | cheap (only DENY writers pay) |
| 7 | Column keying | per (listing scope, tag, tagger) | same | Roster-contract column additive |
| 8 | Global per-tag posting (kind 6) on `TagAssertion/1` | on, packed 8 ordinals/word | same | the mandatory-indexing ruling (`owner-rulings.md`, 2026-07-15 item 12) says on; packing is the Glamsterdam survival condition |
| 9 | Combinator per category | safety → ASSERT_WINS; content → UNION; PRIORITY optional | UNION everywhere, client-side | on-chain combinators are Plan-side, redeployable |
| 10 | Vocabulary version | `(PlanId, basisBlock)`; `VocabularySnapshot/1` for GATE consumers | basis block only | snapshot Type additive |
| 11 | Bounds | alias ≤ 8 hops; closure ≤ 16 at write, ≤ 8 hops at read; roster per lens design center | same | SDK constants |
| 12 | Category representation | ref to a category concept (not a string) | same | strings would re-import name identity |
| 13 | Who writes vocabulary metadata | anyone, own principal; Plans select | same | governance (BUR) is a record type, not a gate |
| 14 | Retroactive backfill payer | the curator who adds the edge; bounded per call | nobody (read-time) | — |
| 15 | Label required at first use | yes (one record + head) | yes | unreadable ids otherwise (July red team) |

---

## 10. What parity costs — the honest ledger

| Booru expectation | Parity here | Price |
|---|---|---|
| stable tag with mutable name/category/wiki/history | full, better (history free) | ≈ 390k / 1.9M per new tag (full), one-time |
| aliases redirect search and write | full (read-time REDIRECT + write canonicalisation) | 1 head read per hop; never a TagMover |
| implications auto-add and apply retroactively | auto-add: yes at write; retroactive: **only if someone pays, only in known scopes** | 5,070·d per assertion; backfill 9k–26k per 256 entries per (scope, tagger) today |
| counts on every tag | within a listing: popcount; globally: from posting length | 2,100 per 256 entries |
| AND/OR/NOT | within a listing: full; globally: AND via rarest posting + probes; **global NOT: no** | k·m·W words |
| wildcards, autocomplete, related tags, ranking | client-side over a synced vocabulary | RPC reads, no gas |
| private blacklist surviving renames | yes, local | none |
| BUR + undo | governance record + Core history; undo = tombstone (nothing was rewritten) | one record |
| DNP | status head + serving Lens rule | one head |
| my rules over shared rules (Hydrus) | Plan roster order (card-1) / union (card-N) | none |
| 35 tags per post at 12M posts | **not at these prices on either schedule** without TagSet; even then p95 posts are multi-tx under Glamsterdam | see §8 |

---

## 11. What could not be found or verified

- **No vault document states the v1 `/clouds/nimbus` → "Nimbus under the clouds grouper" display rule**; the owner's chat statement is the only record. Grep for nimbus/clouds across `Designs/`, `Reviews/`, `Brainstorms/` returns nothing (vault strand §1.4).
- **No measured bitmap index exists in any EFS repo.** All column costs are ESTIMATED from Uniswap/OZ figures (`indexing.md:44-45`); the "3 slots per record" Store-style assumption is ESTIMATED from MUD's measurement, not from EFS code. The only MEASURED tag write is the MVP's 2,838,264 (94 slots) — with a second unreconciled figure of 3,060,354 / ~133 slots on a different run (`report-for-codex-2026-09-10.md:145`).
- **The target L2 and whether Glamsterdam pricing applies to it are unknown** (`indexing-and-state:431-435`); MegaETH storage pricing could not be found.
- **Sankaku**: every help route redirected to a JS shell or returned 403 on 2026-09-10; the only evidence remains `booru-app.md:32-64`, whose URLs are now dead.
- **Danbooru's `RemoveImplication` command** was not fetched; the claim that Danbooru never removes materialised consequents is inferred from `reject!` (`tag_relationship.rb:58-65`).
- **Gelbooru** DAPI needs a key (401); whether its aliases retag posts is unverified (independent counts on the alias list suggest not).
- **LCSH authority-record behaviour** (whether `sh85066343` kept its number): id.loc.gov returned 403; not cited as fact.
- **"Ethereum Attestation topics"**: no such concept exists in EAS docs or contracts.
- **The kind-10 scope stores admission ordinals, not object ids** (`hierarchical-files-and-folders.md:703-704`); this memo assumes the tagger's bit is an unverified writer claim in the writer's own column (hydration catches lies). If the owner wants the router to verify `ordinal i in scope(O,D) == F`, add ≈ 4 SLOADs (≈ 8,400) per bit — not included in §4.1.
- **No source for whether EFS's `alive` bitmap (whiteout/tombstone-maintained) exists yet**; the MVP maintains `DirectoryWhiteout/1` and tombstones (`hierarchical-files-and-folders.md:60-62`) but no bit. It is assumed at 5,070 per state change (`indexing.md:98`).

**Sources.** Vault files as cited inline. Web (all raw GitHub `master` or live JSON, 2026-09-10 unless noted): Danbooru `tag_mover.rb`, `post_edit.rb`, `tag_implication.rb`, `tag_alias.rb`, `post_query.rb`, `post_query_builder.rb`, `user.rb`, `structure.sql`, `/counts/posts.json`, `/tag_implications.json`; e621ng `tag_alias.rb`, `tag_implication.rb`, `post.rb`, `config`, `/db_exports.json`, `help/tags`; Hydrus `advanced_siblings.html`, `advanced_parents.html`, `developer_api.html`, `getting_started_more_tags.html` (hydrusnetwork.github.io), `ClientDBTagSiblings.py`, `ClientTagsHandling.py`; szurubooru `model/tag.py`, `func/tags.py`; SKOS Reference (W3C REC 2009-08-18) `https://www.w3.org/TR/skos-reference/` §9.6.4 and Primer §4.1; AT Protocol label spec `https://atproto.com/specs/label` and `decision.ts`; Wikidata `Help:Redirects`; Wikipedia `User:Cydebot`, `Template:Container_category`; Hats Protocol hat-ids `https://docs.hatsprotocol.xyz/for-developers/hats-protocol-for-developers/hat-ids`.