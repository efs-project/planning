<!-- Tag deep dive strand: Architect memo: filesystem-minimal -->
<!-- Provenance: produced 2026-09-10 by a research/design agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering lead's
     reading, spot-checks and position are in ../../tag-system-2026-09-10.md. -->

# EFS v2 tag system — filesystem-minimal design memo

**Angle:** tags are paths. Reuse the Files spine (ObjectGenesis nodes, name bindings, whiteouts, tombstones, the kind-10 scope ordinal, the planned `(scope, tag)` bitmap) with zero new Core kinds and zero new index families. **Date:** 2026-09-10. **Status:** design proposal for the owner's tag deep dive; nothing here is a ruling. All vault paths are under `/Users/james/Code/EFS/planning-fable-files-browser/`.

**Gas constants used throughout.** QUOTED: cold SLOAD 2,100; fresh slot 22,100 today → 110,020 Glamsterdam; rewrite 5,000 → 12,100; keccak ≈42/64 B. MEASURED: one 2-leaf tag op 2,838,264 gas / 94 slots; createDir (4 leaves) 5,132,853; ≈1.42M per leaf (`Reviews/2026-09-09-files-browser-mvp/gas-engineering-2026-09-10.md:30-44, :93-94`). ESTIMATED: one bit set ≈5,070 today / ≈12,500 Glamsterdam amortised, 22,100 / 110,020 when the word is untouched (`Reviews/2026-09-09-files-browser-mvp/indexing-and-state-2026-09-10.md:131-141`); post-§5 2-leaf op target 400–700k (`gas-engineering:134-136`); today's 94-slot tag ≈11.1M under Glamsterdam (`indexing-and-state:41-42`). Reads are unchanged by Glamsterdam. `n` = files in a directory, `W = ⌈n/256⌉`, `k` = principals in the tag plan, `d` = implication fan-in.

---

## 0. Verdict

A tag is a **directory node placed under a `/tags` tree**. Its identity is the node's `ObjectGenesis/1` id; its path, parent, label and aliases are name bindings; a file's tags are one `TagSet/1` record bound per (principal, file); DENY is a `DirectoryWhiteout`-shaped tag-set at a deny position; implications are a tag-set bound *on the tag node*; the index is the already-planned bitmap keyed `(scope(P_dir, D), tagNodeId, P_tagger)`. Rename, move, alias, deprecate and wiki are the existing `RENAME_MOVE` / `PLACEMENT` / `REMOVE` ops and ordinary files. **New surface: one application Type (`TagSet/1`, replacing the fixture's `tagAssertion`), one purpose word already present in the fixture (`tagPurpose`, `FilesRouterV2.sol:142`), one derived bitmap key convention for deny bits, and one union-with-priority-deny read view over the bitmaps.** Optionally one genesis-profile relaxation (ownerless name-derived salt) to buy a Schelling point.

What the angle buys: every booru vocabulary operation except retroactive rewrite maps onto an existing Files verb, and the four owner queries plus AND/OR/NOT/namespace/alias all cost `≤ 4·k·W` cold SLOADs inside a listing. What it loses, plainly: (1) **no global "everything tagged T"** — queries are per directory scope (a booru must be one big directory); (2) **no on-chain retroactive implication backfill** — readers expand at read time, writers may pre-expand into their own column; (3) **a Lens over an open tagger set has no on-chain answer** — k is named and paid per word; (4) NOT only inside a listing; (5) weight/confidence dropped from the record. §9 argues each loss is acceptable for the stated mission; §10 lists the decisions.

The dominant cost is not the index. It is the **admission** of a tag record+binding (2.84M MEASURED today, ≈11.1M Glamsterdam ESTIMATED) — the `TagSet` shape exists to pay that once per file per retag instead of once per (file, tag). Until the gas-engineering §5 proposals land (400–700k target), booru-density tagging (p50 35 tags/post) is unaffordable on every schedule, with or without this design; the coherence review already computed 6.1M per p50 post and >cap per p95 post on B0 rows (`Reviews/2026-09-02-efs2-coherence-review-corpus/seams/S3-media-x-types-x-indexes.md:72-80`).

---

## 1. Identity

### 1.1 What the tag id is

**A tag is an `ObjectGenesis/1` Object with DIRECTORY meaning** (`Designs/efsv2/hierarchical-files-and-folders.md:372-392`: `{publisher, salt, meaning}`; RecordId content-derived). Its id never changes across rename, move or re-parenting because "name and parent are placements, not identity" (`:55-56`). The bitmap keys on this id, so a rename costs zero index writes (theory strand P8: a name-bearing id splits the bit column on rename; this avoids it).

Two genesis profiles, both the same Type:

| Profile | Body | Id behaviour | Status |
|---|---|---|---|
| **Owned** (default, works today) | `publisher = curator, salt = high-entropy, meaning = DIRECTORY` | unique per curator; two curators minting "nsfw" get two nodes | zero changes to the spine; charter binding as `:402-425` |
| **Ownerless / Schelling** (recommended follow-up) | `publisher = 0x0, salt = keccak(NFC canonical string), meaning = DIRECTORY` | client-computable, chain-independent; everyone deriving `nsfw` gets one node; the July TAGDEF's "unowned registry" property (`Designs/efsv2/fable-handoff-v2-tag-core.md:70-72`) without a parent in the id | needs one profile rule: the spine requires a high-entropy salt and a publisher-qualified charter (`:385-387, :418-424`); an ownerless node has no charter principal (envelopes reject `principalId == 0`, `Reviews/2026-09-05-c0-core/src/StatePointReads.sol:386`), so validity must be "placed by anyone under a Lens" instead. `Designs/efsv2/core-architecture-candidate.md:133-135` already anticipates "separate canonical genesis/value profiles rather than fake owners". |

The **derived path tagId of the July handoff survives as the position key**, not the object id: `positionKey = keccak(DOM_POSITION, namePurpose, parentNode, nameRole(name))` (BindingFold.sol per `indexing-and-state:100-103`) is exactly `keccak(DOMAIN, parentTagId, keccak(name), kind)` with `kind` = purpose. Hierarchy still "falls out of the derivation" for *positions*; it no longer enters *identity*. This is the reconciliation of `fable-handoff:70` with the spine that superseded it (`hierarchical-files-and-folders.md:9`).

**Canonical string for the ownerless profile:** FilesName/1 grammar (NFC, 1–255 bytes, case-sensitive, no folding — `:139-154`) applied to a booru-style `namespace:subtag` string (`artist:alice`, `nimbus`, `nimbus_(cloud)`). No lowercase folding in the id; the client folds before derivation (Danbooru `normalize_name`, e621 NFC+downcase, booru strand §1). Folding can be layered later; unfolding cannot.

### 1.2 How `/clouds/nimbus` works

| Thing | Representation | Identity-bearing? |
|---|---|---|
| the tag | node `N = ObjectGenesis{…, salt = keccak("nimbus")}` | **yes** |
| `/tags/clouds/nimbus` | name binding `(namePurpose, node(/tags/clouds), "nimbus") → DirectoryEntry{parent, "nimbus", child = N}` under principal P | no — a placement |
| "Nimbus" the label | the leaf segment, capitalised by the client; optionally a per-language override (§2) | no |
| "under the clouds grouper" | the parent of the placement; `readdir(/tags/clouds)` lists it | no — and **not an implication** (§2.2) |
| a second grouper (`/tags/weather/nimbus`) | a second placement of the same node (`PLACEMENT`, `FilesRouterV2.sol:118`) — n→n parents, the booru shape (booru strand §1: Hydrus parents are n→n) | no |
| a disambiguated sibling | a different node, `salt = keccak("nimbus_(cloud)")`, per booru convention | yes |

"Is X under /tags/clouds" on-chain: forward, given the name witness, it is d binding reads (the fixture already takes `ancestorNames` witnesses, `FilesRouterV2.sol:156`) — GATE-consumable at a basis, but unlike July's permanent `_parents` walk (`Reviews/2026-07-10-fs-pass-corpus/query-graph-boundary.md:135`) the answer can change, because placement is a binding. Reverse ("parents of N" given only N) is the kind-6 typed backlink, whose read side is unfinished (`indexing-and-state:62-73`); until it lands, the client walks the (small) tag tree.

### 1.3 "images" vs "image/png"

`image/png` is **a typed field** (`contentType` on the file revision / reserved key, `Reviews/2026-07-07-efsv2-corpus/tags-maximalist.md:186`), not a hand-asserted tag. The owner's queries need it in the same index, so the router **derives two system bits** at `CREATE_FILE`/`EDIT` under the placing principal: `sys:mime/image` and `sys:mime/image/png`, keyed by ownerless nodes `/tags/sys/mime/image[/png]` — tags in the index and paths in the namespace, but derived from the field and never asserted by hand. +2 bits ≈10,140 today / ≈25,000 Glamsterdam per file (`indexing-and-state:137`). This answers clarification 2 of `indexing-and-state:428-430`: "images" is a prefix relation materialised as a second bit at write time; if the derived bits are dropped later nothing about identity changes. The alternative (make `image/png` a user tag with parent `image`) loses the field's single-source-of-truth and invites disagreement about a fact the bytes already determine.

---

## 2. Tag metadata — the booru "dynamic tag" requirement

Every metadata item is a **binding at a position whose subject is the tag node**, written under the writer's own principal, never an edit to the node. Nobody can write into another principal's namespace or bit column. The reader's Lens (ResolutionPlan) picks whose bindings count.

| Metadata | Position / mechanism | Writes | New Type? |
|---|---|---|---|
| parent / child (grouper) | name binding `(namePurpose, parentNode, segment) → DirectoryEntry{…, child = tagNode}` | 1 entry record + 1 binding (a `CREATE_DIR`/`PLACEMENT`-class op: ≈2.8–5.1M MEASURED-derived today; 400–700k post-§5 ESTIMATED) | no |
| multiple parents | additional placements of the same node | 1 op each | no |
| **alias** (`nimbus_cloud` → `nimbus`) | a **second name for the same node** (hard link): `(namePurpose, parent, "nimbus_cloud") → DirectoryEntry{child = N}`. szurubooru's many-names-one-row model (booru strand §1). Resolved at path resolution, i.e. read time; the bit column is shared automatically | 1 op | no |
| **implication** (A ⇒ B) | a `TagSet/1{polarity=ASSERT, tags=[B]}` bound at `(tagPurpose, nodeA, 0)` — "A has tag B" read as "A implies B". Directional, per author, versioned by binding history | 1 tag op | no (reuses §3's Type) |
| display label / translation | default: the leaf segment. Optional: language subtrees `/tags/@ja/雲/積乱雲` hard-linking the node (zero new Types) or a `Label/1{lang,text}` bound at `(labelPurpose, node, lang)` (one new app Type) | 1 op | optional |
| category / namespace | the top-level grouper under `/tags` (`/tags/artist`, `/tags/rating`); the string namespace prefix for ownerless ids | free | no |
| definition / wiki | an ordinary file inside the tag directory: `/tags/clouds/nimbus/wiki.md`; history = file revisions | a file write | no |
| deprecated / invalid | `REMOVE` the name binding (whiteout) or `RENAME_MOVE` into `/tags/.deprecated/`; the node and every assertion keyed on it persist; path resolution fails → client shows "deprecated" | 1 op | no |
| related tags | off-chain (Danbooru samples, e621 caches; booru strand §5) | — | — |
| locked / DNP | a top-priority principal's deny set (§3) | 1 op | no |

### 2.1 Who may write, how a reader picks a vocabulary

Anyone writes under their own principal. A reader names an ordered plan over the `/tags` namespace (the Files name plan; the mount already separates "the plan controlling immediate child names" from "the plan controlling file revisions", `hierarchical-files-and-folders.md:64-66`) — this design adds a third: the **tag plan** (which taggers' sets count, §4.3). Name resolution is first-wins-per-position with tombstone fallthrough (`:59-62`).

**Vocabulary version pinning** = `(namePlanRecordId, tagPlanRecordId, blockHash)`. Snapshots are block-hash-pinned views (`:76-77`); the client's query transcript lists the exact node ids its expansion used, satisfying `Designs/media-library/booru-app.md:209-218` (expand "under an explicit vocabulary version/Lens"; pages name basis and coverage). No vocabulary-version record is needed.

### 2.2 Placement is not implication

SKOS Collections and Wikipedia container categories both say a grouper is not a concept and must not sit in a transitive chain (theory strand §2, P3). Booru categories (`artist:`) are facets; nobody searches `artist` alone. So: **the parent placement is display grouping and namespace only; implication is always an explicit tag-on-tag set.** The owner's v1 intuition ("Nimbus under clouds") is preserved for browsing; whether "tagged nimbus" means "tagged clouds" is a separate, stated claim. This removes the need for a facet-vs-concept marker. (Reversible: a client may later opt in to "treat placement under a concept node as implication" by reading a marker; nothing on-chain changes.)

---

## 3. Assertions

### 3.1 Shape

```
TagSet/1 { polarity: u8 (0 = ASSERT, 1 = DENY), tags: ARRAY(REF object) ≤ 16 }
position  = (tagPurpose, fileObject, chunk)            // chunk = 0,1,2… for >16 tags
binding   = BindingKey(P_tagger, position) → RECORD(TagSet id)
```

- **Attribution** is the binding's principal; the record is author-neutral and content-addressed, so identical sets dedup (`indexing-and-state:298-300`). Same idea as the fixture's `tagAssertion` (`FilesRouterV2.sol:540-548`) but one binding per (principal, file, chunk) instead of per (principal, file, tag).
- **Polarity**: ASSERT and DENY sets live at **different positions** (`tagPurpose` vs `tagDenyPurpose`) so they never share a binding, a backlink key or a bit column — the defect PRD-27 flagged for the media set (`Reviews/2026-09-02-efs2-coherence-review-corpus/findings-ledger.md:121`). Deny is Bluesky's "retraction is not denial" made explicit: a DENY set says "I say f is *not* T"; a tombstone says "I withdraw my claim".
- **Retract** = `BindingTombstone` at the position (the fixture's `UNTAG`, `:549-552`); "A's untag preserves B's" holds by construction (`Reviews/2026-09-09-files-browser-mvp/acceptance.md:23`).
- **Supersede** = rebind the position to a new set; prior sets remain in binding history and resolvable by id (`indexing-and-state:233-242`).
- **Weight / confidence**: dropped from the record. Weight was kernel-neutral in every generation (`tags-maximalist.md:38, :233`); a confidence, if wanted, is a sibling VAL binding. Putting it in the body would defeat set dedup and the point probe.
- **Why 16**: `REF_INSTANCES_MAX = 16` per leaf (`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md:482`, SR-18e). A 35-tag post is 3 chunks; a 100-tag post 7. Raising the bound for closure-typed records is an open question already (`indexing-and-state:442-445`).

### 3.2 Cost per assertion (ESTIMATED from MEASURED)

| Op | today | Glamsterdam |
|---|---|---|
| fixture: tag one file with one tag (2 leaves) | 2,838,264 MEASURED | ≈11.1M |
| fixture: 5 tags on one file | ≈14.2M | ≈55M |
| **TagSet: 5 tags on one file (2 leaves + 5 bits)** | ≈2.86M | ≈11.2M |
| TagSet post-§5 target | 0.43–0.73M | not estimated by the vault |
| retag (edit one tag of 5): rebind + Δbits | 2 leaves again (≈2.84M today) — the price of the set shape | ≈11.1M |
| DENY set for one file (2 leaves + deny bit) | ≈2.84M | ≈11.1M |
| untag one tag of 5 | rebind (2 leaves) | — |

The index term (5 × 5,070 ≈ 25k) is <1% of the op today; the vault's per-leaf overhead is the whole story until §5 lands.

---

## 4. Index materialisation rule

### 4.1 What is written at assertion time

For file `f` placed by `P_dir` in directory `D` at ordinal `o` (its index in `scope(P_dir, DIRECTORY, D)`, `indexing-and-state:94-113`), when `P_tagger` binds a `TagSet` on `f`:

```
for T in set.tags:      bits[scope(P_dir, D)][T][P_tagger][o/256] |= 1 << (o%256)     // ASSERT
for T in denySet.tags:  bits[scope(P_dir, D)][keccak("deny", T)][P_tagger][o/256] |= …  // DENY, same map, derived key
on rebind:              flip the delta (the index is keyed on the binding position, never the record id — :180-187)
```

Three facts to state plainly:

1. **Bits are per placement, bindings are per object.** A file placed in two directories has two ordinals; the `TAG` op names `op.parent` (`FilesRouterV2.sol:150`) so the router knows which scope to flip. A tagger who wants the tag queryable in both directories pays both bits.
2. **Bits are keyed by tagger**, using the *directory owner's* ordinal space — the `(D, tag, attester)` keying `indexing-and-state:117-120` names. A Lens of `k` taggers reads `k` words per 256 entries per predicate. **An open tagger set has no on-chain answer** (`:119-120`); a booru with 10,000 taggers needs an aggregating principal that re-asserts (the Hydrus PTR shape, booru strand §7) or a named curator list.
3. **No new families.** Deny bits and system mime bits are the same `(scope, key, principal)` map with derived keys.

### 4.2 Implications: read time by default, write time by choice, never backfilled on-chain

- **Read time (default).** Query "B" = `OR` over `bits[B]` and `bits[A]` for every `A ⇒ B` the reader's tag plan accepts: `(1+d)·k·W` words. The reader gets the implication list from the tag tree (`readdir` + the tag-on-tag sets: a few dozen point reads for a 40-tag vocabulary; the reverse "what implies B" needs kind-6 or a client walk). Correct semantics, always current, no writer cost. A **contract** must probe `(1+d)` bits per membership check: `2,100·(1+d)` — fine for `d ≤ 8`, unaffordable for e621-class fan-in (hundreds; booru strand §8).
- **Write time (writer's option).** `P_tagger` may also set bits for the closure of each tag under *its own* declared vocabulary at write time (+5,070 / +12,500 per implied bit) into **its own column**. This is Danbooru's `tags_implied_by` at save (booru strand §3). Because the `TagSet` record is the truth and the bit is only an index, a derived bit is distinguishable from an asserted one by comparing to the record — e621's indistinguishability problem (booru strand §3, `tag_alias.rb:206-215`) does not arise. Contracts that need a single-bit probe for a hot ancestor get it only where writers chose to pay.
- **Implication added later.** Old files are **not** updated. No permissionless backfill entry point: writing into `P_tagger`'s column must remain `P_tagger`'s act, and a `backfill(scope, A, B, fromWord, toWord)` by the tagger costs per 256 entries `2·2,100 + (5,000 | 22,100)` = 9,200–26,300 today, 16,300–114,220 Glamsterdam — `n = 1,000`: 37k–105k today / 65k–457k Glamsterdam (ESTIMATED). Bounded and cheap, but it is an index write path the kernel does not have today; recommended **deferred**, with read-time OR as the standing answer. Danbooru's `update_posts!` (re-save every post) has no on-chain analogue and none is needed: readers expand.
- **Implication removed.** Read time: drop the edge, done. Write-time bits already set stay (Danbooru's `reject!` behaviour, booru strand §3); the record shows they were derived.

### 4.3 The tag-plan combinator

The Files plan is first-wins-per-position — right for card-1 names, wrong for card-N tags (theory strand P6; `Reviews/2026-07-29-target-communities/visual-gallery-and-booru-ecosystems.md:157-168` demands union-with-provenance). With `TagSet` per (file, chunk), first-wins would mask a lower curator's whole set. So the tag plan uses **union with priority deny**, evaluated in a redeployable view over the bitmaps (candidate shape 4 of `Designs/media-library/query-and-indexing.md:127-131`), not in Core:

```
tagged(f, T) = ∃ i: bits[T][P_i](f) ∧ ¬∃ j < i: deny[T][P_j](f)
```

Word cost per predicate: `k` assert words + up to `k−1` deny words per 256 entries.

### 4.4 Per-query gas, `n = 1,000` (W = 4), reads (same on both schedules), ESTIMATED

| Query | words | gas | notes |
|---|---|---|---|
| **images** (`sys:mime/image`, k=1: the placer) | 4 | 8,400 | + ≈2,100·h to materialise ids (`indexing-and-state:152-154`; likely 2–3 SLOADs/hit) |
| **image/png** (second sys bit) | 4 | 8,400 | |
| **nsfw** (sparse, two-level summary) | 1 + nonempty | 4,200–10,500 | |
| **NOT nsfw** in D | `alive & ~nsfw` = 8 | 16,800 | only inside a listing |
| AND of 3 tags | 12 | 25,200 | or rarest-first via summaries |
| OR of 2 | 8 | 16,800 | |
| `artist:alice` (namespace) | path resolve 3 segments ≈ 6 SLOADs + 4 | ≈21,000 | |
| alias `nimbus_cloud` | same as above | ≈21,000 | hard link → same node → same column |
| B with read-time implications, fan-in d | (1+d)·4 | 8,400·(1+d) | |
| any predicate under a tag plan of k=2 with deny | 2·4 + 4 | 25,200 | |
| membership point probe (contract) | 2 | 4,200 | + `(k−1)` deny words under a plan |
| `n = 10,000` | ×10 | 84k positive / 168k NOT | |
| `n = 1,000,000` (booru in one directory) | W = 3,907 | 8.2M positive / 16.4M NOT / AND-of-3, k=8: ≈197M | `eth_call` only with `(fromWord, toWord)` paging; no contract |

Write side per file (index only, ESTIMATED): alive bit ≈5,070 / 12,500; 2 sys bits ≈10,140 / 25,000; per tag bit ≈5,070 / 12,500 (first bit in an untouched word 22,100 / 110,020); deny bit same. Summary-word transitions 5,000 / 12,100 once per 256 files per tag (`indexing-and-state:133-141`).

---

## 5. Rename / merge / split

| Operation | Mechanism | Assertions & links | Index | Cost |
|---|---|---|---|---|
| **Rename** `nimbus` → `nimbus_cloud` | `RENAME_MOVE` on the name binding (tombstone old, bind new) | untouched — keyed on node id; old path fails (or keep the old name as an alias hard link) | **zero bit changes** | 1 op ≈2.84M MEASURED-derived today |
| **Move** `/tags/clouds/nimbus` → `/tags/weather/nimbus` | same | untouched | zero | 1 op |
| **Alias** (add a synonym) | `PLACEMENT` of the node at a second name | shared column | zero | 1 op |
| **Merge** A into B (both already used) | (1) rebind A's path to node B (A's name becomes an alias of B); (2) bind `A ⇒ B` on node A | A-keyed assertions stay valid and resolvable by node id forever; readers `OR` `bits[A] \| bits[B]` via the implication | +W words per query, forever, unless the tagger pre-expands; old links to A still resolve (Wikidata's "never delete redirects", theory strand §3) | 2 ops |
| **Split** A into A′, A″ | mint new nodes; curators re-tag; optionally bind `A′ ⇒ A`, `A″ ⇒ A` so old queries for A still find the new sets | manual re-tagging, as in every booru (booru strand §6) | new columns | 2 node mints + re-tags |
| **Deprecate** | `REMOVE` the name (whiteout) | intact | zero | 1 op |
| **Undo** any of the above | rebind; history retained | — | — | 1 op |

Nothing ever rewrites another principal's bindings. Danbooru's `TagMover` (retag every post) is structurally unavailable and unnecessary.

---

## 6. Pluralism

Two communities X and Y:

- **Disagree on grouping** (Y: nimbus under `weather`). Under name plan `[X]`, `/tags/clouds/nimbus` → X's placement; under `[Y, X]`, `/tags/clouds` falls through to X (Y made no claim there, tombstone-fallthrough `hierarchical-files-and-folders.md:61-62`) and `/tags/weather/nimbus` resolves to Y's placement. If Y hard-linked X's node the columns are shared; if Y minted its own node there are two columns, and a client that resolves only X's tree misses Y's assertions. **Honest claim on-chain:** "under plan L at basis b, position p resolves to node N" — never "nimbus is under clouds".
- **Disagree on what `nsfw` means.** With owned nodes, X's and Y's `nsfw` are two nodes; a reader ORs both or picks one via the name plan. With the ownerless profile they are one node and the disagreement is entirely in the assertion columns, resolved by the tag plan's union-with-priority-deny: `[Y, X]` lets Y's DENY mask X's ASSERT per file; `[X, Y]` the reverse; a plan `[X]` never sees Y. **Honest claim on-chain:** "under tag plan L at basis b, f is tagged N", with provenance (which `P_i` asserted, which `P_j` denied) reconstructible from the bits and the sets. Popularity, registration and first-placement confer nothing (`Designs/efsv2/layered-type-system-and-data-abi.md:699-700`).
- What cannot be claimed: "the community agrees", "N is the canonical nsfw", or any statement about taggers not in the plan.

This is the Hydrus ordered-service list (booru strand §7) for names (n→1: first wins) and the Bluesky union-then-policy combinator (theory strand §4) for tags (card-N), which is the split P6 called for.

---

## 7. Not answerable on-chain, and what the web client does with `eth_call`

**Not answerable on-chain (say so in the product):**
1. "Everything tagged T" across directories/principals — scopes are an open set (`indexing-and-state:171-176`). A booru that wants global search puts all posts in one directory under one placing principal and pages words.
2. Any predicate under a Lens over an unnamed/open tagger set (`:119-120`).
3. NOT outside a listing (`:78-79, :157`).
4. Reverse tag-graph reads ("what implies B", "parents of N") until the kind-6 read side exists.
5. Ranked/related/co-occurrence beyond per-scope popcount; global counts; full text; prefix over assertion columns (wildcards are an OR over the matching nodes the client found via `readdir`); numeric/date ranges (typed fields, off-chain or bucketed sys bits); "tagged as of block B" — only current bindings are indexed (`:180-187`).
6. Retroactive implication backfill (§4.2).

**Web client, `eth_call` only, no indexer:** pin `blockTag`; `readdir` the `/tags` tree per level under the name plan (this *is* on-chain autocomplete and the category sidebar — one page per level); read tag-on-tag sets and compute the implication closure locally; resolve aliases by path; issue the bitmap reads with `(fromWord, toWord)` ranges, AND/OR/NOT locally or in the view; compare scope `count` before and after a page (`:166-169`); apply private blacklists locally by node id (they survive renames; never sent, `booru-app.md:211-212`); label every page with `(namePlan, tagPlan, blockHash, node ids expanded, coverage)`; render "hidden by filters / zero is not proof" (`acceptance.md:24`). Hot-window sync from logs is a cache, not a source (`:47-53`).

---

## 8. Worked example — `/photos`, 1,000 photos, 40 tags, curators X and Y

**Setup.** X places 1,000 photos in `D = /photos` → `scope(X, DIRECTORY, D)` ordinals 0…999, `W = 4`. X mints 40 tag nodes under `/tags/` (owned profile) in a tree such as `/tags/clouds/{nimbus,cumulus,…}`, `/tags/rating/{safe,nsfw}`, `/tags/artist/…`. X asserts on average 5 tags per photo (one `TagSet` each). The router derives `sys:mime/image` and `sys:mime/image/png|jpeg` bits at each create.

**Y disagrees twice:** Y hard-links X's `nimbus` node at `/tags/weather/nimbus` in Y's namespace; Y denies `nsfw` on 12 photos X flagged and asserts `nimbus` on 30 photos X did not.

**Write costs (ESTIMATED from MEASURED; today / Glamsterdam):**

| Item | count | today | Glamsterdam |
|---|---|---|---|
| 40 tag nodes (createDir class, 4 leaves) | 40 | 40 × 5.13M ≈ **205M** MEASURED-derived; post-§5 ≈17–29M | ≈ ×2.9 on the SSTORE share ≈ 590M (today's slot shape) |
| X's 1,000 `TagSet` ops (2 leaves) | 1,000 | 1,000 × 2.84M ≈ **2.84B**; post-§5 0.4–0.7B | ≈11.1B (today's shape) |
| — vs fixture per-tag bindings | 5,000 | ≈14.2B | ≈55B |
| X's tag bits: 160 fresh words + 4,840 rewrites | 5,000 | 3.5M + 24.2M ≈ **27.7M** | 17.6M + 58.6M ≈ **76M** |
| alive bits | 1,000 | ≈5.1M | ≈12.5M |
| sys mime bits | 2,000 | ≈10.1M | ≈25M |
| Y's hard link | 1 | ≈2.84M | ≈11.1M |
| Y's 12 deny sets + 12 deny bits | 12 | ≈34M + 0.1M | ≈133M + 0.2M |
| Y's 30 assert sets + 30 bits | 30 | ≈85M + 0.2M | ≈333M + 0.4M |

The index is ≈1% of the bill on both schedules; admission is 99%. (The fixture's per-tag shape would make the index look even smaller and the bill 5× larger.)

**Reads (ESTIMATED, either schedule):**

| Query | plan | words | gas |
|---|---|---|---|
| images | dir plan `[X]` | 4 | 8,400 |
| image/png | `[X]` | 4 | 8,400 |
| nsfw | tag plan `[X]` | ≤4 (sparse: summary + nonempty) | ≤8,400 |
| nsfw | `[Y, X]`: `(nsfw_X & ~deny_Y) \| nsfw_Y` | 12 | 25,200 |
| NOT nsfw | `[Y, X]`: `alive & ~(…)` | 16 | 33,600 |
| nimbus | `[X, Y]` (shared node via hard link) | 8 | 16,800 |
| nimbus AND images AND NOT nsfw | `[Y, X]` | 8 + 4 + 12 + 4 = 28 | 58,800 |
| `/tags/weather/nimbus` under name plan `[Y, X]` | 3 segment resolutions | ≈6 SLOADs | ≈12,600 + scan |
| "is photo #417 nsfw?" (a contract, plan `[Y, X]`) | deny_Y, nsfw_Y, nsfw_X words | 3 (+ ordinal lookup) | ≈6,300–8,400 |

Had Y minted its own `nimbus` node instead of linking X's, "nimbus" under `[X, Y]` still costs 8 words — but only if the client discovered Y's node by reading Y's tree; a path-only client would silently miss Y's 30 photos. This is why the ownerless profile is worth its one rule.

---

## 9. What the filesystem-minimal angle loses, and whether it is acceptable

| Booru feature (booru strand §8; `visual-gallery…:137-153`) | Status here | Acceptable? |
|---|---|---|
| stable id + mutable name/category | yes (node + placements) | — |
| aliases redirecting search and write | yes (hard links; write clients canonicalise by resolving the path) | yes |
| n→n parents | yes (multi-placement), but placement ≠ implication | yes, by design (SKOS) |
| implications applied at write | writer's option, own column only | yes |
| implications applied retroactively | **no on-chain backfill**; read-time OR | yes: readers are correct; contracts get what writers materialised |
| implication removal restoring old state | read time: free; write-time bits persist but are distinguishable from the record | yes |
| categories/facets | top-level groupers | yes |
| wiki, edit history, undo | files in the tag directory; binding history | better than incumbents |
| tag counts | popcount per scope; global off-chain | partial — e621 already abandoned DB counts |
| `-tag` (NOT) | inside a listing only | the loss users hit first; the standing vault line (`indexing-and-state:371`) and a booru is one listing |
| OR, AND, namespace, alias | yes | — |
| wildcard / autocomplete | `readdir` per level; wildcard = OR over matched nodes | yes for vocabularies of thousands; not for 2.7M-tag Danbooru vocabularies on-chain |
| ranges, metatags (`width:>=1920`, `score:`) | typed fields; bucketed sys bits at most | off-chain, as in the ladder Q5 |
| **global search across the corpus** | **no** — per scope; one giant directory + paged word ranges for `eth_call` | acceptable for a creator-consented gallery (`visual-gallery…:242-246`), not for "put Danbooru on-chain" — which the vault already rejected |
| private blacklist surviving renames | yes (node ids, local) | — |
| BUR / reviewed bulk changes / DNP | a curator principal signs a batch; DNP = top-priority deny; no on-chain approval workflow | yes |
| weight / confidence | dropped | yes |
| many taggers (open set) | **no** — named k or an aggregating principal | the honest boundary; Hydrus draws the same one |
| p50 35-tag posts | 3 `TagSet` chunks ≈8.5M today, ≈1.3–2.2M post-§5 | unaffordable today on any schedule; the set shape is what makes it possible later |

---

## 10. Owner decisions

| # | Decision | Recommendation | Cheapest reversible default |
|---|---|---|---|
| 1 | Tag identity: owned node vs ownerless name-derived node vs July path-derived tagId vs `keccak(string)` | **Ownerless name-derived `ObjectGenesis` (flat: no parent in the id)** for public tags; owned nodes for private/personal tags | **Owned nodes** — works today with zero profile changes; adding the ownerless profile later is additive (curators link/imply into it) |
| 2 | Do tag nodes get their own `meaning` word or are they directories? | Directories (`readdir`, wiki-as-file, DirectoryEntry validation all unchanged) | Directories; a `FILES_TAG_1` meaning can be added later as a new Object kind without touching existing nodes |
| 3 | `image/png`: typed field or tag? | Typed field + router-derived system bits `sys:mime/*` | Field only, no sys bits (cheapest); sys bits are index, droppable |
| 4 | Assertion shape: fixture per-(file, tag) binding vs `TagSet` per (file, chunk) | `TagSet/1`, ≤16 refs, chunked | Keep the fixture's `tagAssertion` (exists); migrate to `TagSet` when density > 3 tags/file appears — both are app Types, both index identically |
| 5 | DENY: separate position vs polarity field vs whiteout | Separate position + derived deny key | Separate position (no whiteout reuse; one purpose word) |
| 6 | Weight/confidence | Not in the record | Not in the record (add a sibling VAL later if needed) |
| 7 | Implications: read-time only vs writer-optional write-time vs on-chain backfill | Read-time default + writer-optional pre-expansion into own column; no backfill entry point | Read-time only |
| 8 | Is placement under a concept node an implication? | No — grouping only; implication explicit | No (a client marker can opt in later) |
| 9 | Tag-plan combinator | Union with priority deny, in a redeployable view | Same; first-wins is wrong for card-N and would silently mask curators |
| 10 | Canonical string folding for ownerless ids | FilesName/1 (NFC, no folding); client lowercases before derivation | No folding (irreversible either way; not folding keeps options) |
| 11 | Raise `REF_INSTANCES_MAX` for `TagSet`? | Only if p95 100-tag posts must be one binding; otherwise chunk | Chunk |
| 12 | Finish kind-6 read side for reverse tag-graph reads | Yes, as part of the bitmap read-side work already directed 2026-09-10 (`indexing-and-state:412-420`) | Client walks the tree until then |
| 13 | Labels/translations | Leaf segment; language subtrees via hard links | Leaf segment only |
| 14 | Which L2 / schedule to score against | Both, until known (`indexing-and-state:431-435`) | — |

---

## 11. What could not be found or verified

- The vault has no written rule that `/clouds/nimbus` renders as "Nimbus" under a `clouds` grouper; the owner's chat statement is the only record (vault strand §1.4). The closest written rules are `Designs/efsv2/mountable-filesystem-semantics.md:123` and `read-lens-spec.md:269` (segment canonical, display name metadata).
- Whether the kernel admits an `ObjectGenesis/1` with `publisher = 0x0` and a low-entropy salt, and what "valid node" means without a charter, is unverified — the spine forbids both for Files nodes (`hierarchical-files-and-folders.md:385-387, :418-424`). Decision 1's default avoids the question.
- The fixture does not say how it derives `op.aux` (the tag id) (`FilesRouterV2.sol:155`); the 2026-09-10 costing assumed `keccak(tagString)` (`Reviews/2026-09-09-files-browser-mvp/research-2026-09-10/indexing.md:105`). This memo replaces that assumption with the node id.
- The "2 SLOADs per membership probe" figure (`indexing-and-state:164-165`) presumes the caller already holds the ordinal; object→ordinal lookup cost is not stated in the vault and may add 1–2 SLOADs.
- No rename, placement, or deny op has been measured; the 2.84M figures for those are the 2-leaf tag op applied by analogy.
- No Glamsterdam estimate exists for createDir; the ×2.9 factor is my arithmetic on the MEASURED 47% SSTORE share and the 4.98× fresh-slot ratio.
- Sankaku primary sources remain unreachable (booru strand, preamble); nothing here depends on them.