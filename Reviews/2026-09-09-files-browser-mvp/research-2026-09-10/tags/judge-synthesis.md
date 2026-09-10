<!-- Tag deep dive strand: Judge: scores, hand-waves, synthesised design, decisions, contradictions -->
<!-- Provenance: produced 2026-09-10 by a research/design agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering lead's
     reading, spot-checks and position are in ../../tag-system-2026-09-10.md. -->

# Judge report — EFS v2 tag deep dive (2026-09-10)

All vault paths below are relative to `/Users/james/Code/EFS/planning-fable-files-browser/`. Line numbers were re-checked against the files today; where a design cited a line that does not say what it claims, that is called out. Gas labels: MEASURED / QUOTED / ESTIMATED. Schedules: **today** (fresh slot 22,100; rewrite 5,000; cold SLOAD 2,100) and **Glamsterdam** (110,020 / 12,100 / 2,100), per `Reviews/2026-09-09-files-browser-mvp/indexing-and-state-2026-09-10.md:37-46`. Reads are identical on both schedules.

---

## Part A — Scores

| Criterion | booru-faithful (BF) | filesystem-minimal (FM) | graph-native (GN) |
|---|---|---|---|
| (a) fit with immutable records + mutable bindings + Lens | 4 | 3 | 5 |
| (b) on-chain query cost, four owner queries + booru staples, both schedules | 3 | 3 | 5 |
| (c) simplicity / legibility | 2 | 4 | 3 |
| (d) rename / merge / split safety over 10 years | 4 | 2 | 5 |
| (e) honesty about pluralism and about what is not answerable on-chain | 5 | 4 | 4 |
| (f) gives the owner what he described (free-text feel, hierarchy with grouper display, mutable tag metadata) | 4 | 3 | 5 |
| **Total** | **22** | **19** | **27** |

Read costs are the same across all three (identical bitmap layer over the kind-10 ordinal, `indexing-and-state-2026-09-10.md:110-120`), so (b) is decided by the write side and by what each design silently omits.

### A.1 booru-faithful — where it hand-waves

1. **Backfill authority.** §4.2: "Anyone may pay" `backfill(scope, P, A, B, …)` writes into principal P's `implied` column and bumps `impliedBasis[scope][P]`. That lets a stranger alter what P's column asserts. FM states the invariant BF violates ("writing into P_tagger's column must remain P_tagger's act"); GN solves it with a delegate binding. BF never separates payer from authoriser.
2. **One basis stamp per column-set is meaningless after the second edge.** `impliedBasis[scope][P]` is a single word, but backfill is per edge (A→B). After one backfill of `clouds` and none of `weather`, the stamp claims a basis the column does not satisfy. Needs a stamp per (scope, P, ancestor) or must be dropped.
3. **`owner: SYS` "a fixed constant, no keys"** — fine for a content-addressed record, but BF also rules "first use of a concept in a Realm must publish one label binding" (§1.2). Nobody can bind under SYS. Who binds the label for `type:image/png` is unstated.
4. **Combinator keyed on tag category** (§6: safety → ASSERT_WINS, content → UNION). Category is itself a card-1 binding resolved by the *vocabulary* Plan, so the combinator for an *assertion* Plan depends on a second Plan's metadata; two readers with the same attester roster and different vocab rosters get different sets from the same bits. GN keys it on the lens purpose instead, which is stable.
5. **Global posting "packed 8 ordinals/word"** (row d) while §4.4 admits the posting must carry `(scopeIdx, ordinal)` for AND probes — two values per entry, so 4/word at best, and the 7,760 figure is understated by ~20%.
6. **Per-pair binding as the canonical carrier** is the shape Glamsterdam punishes hardest (one fresh 110,020 head per (P, file, tag)); BF's own §8 shows a 35-tag post exceeding the EIP-7825 cap and then recommends "per-pair is canonical; TagSet additive". That is the wrong default given its own numbers.
7. **Redundant namespace**: `artist:alice` is both a grouper placement and a category binding (§4.4), with "category binding is authoritative" — two representations of one fact.
8. Surface: 9 purposes, 6 new Types, 3 bit families, 15 decisions. The legibility cost is real and BF does not price it.

### A.2 filesystem-minimal — where it hand-waves

1. **The recommended identity is not admissible today; the default identity fractures the namespace.** The ownerless `ObjectGenesis{publisher=0x0, salt=keccak(name)}` profile needs a publisher-qualified charter binding the spine requires (`Designs/efsv2/hierarchical-files-and-folders.md:385-387, :418-425`) and envelopes reject `principalId == 0` (`Reviews/2026-09-05-c0-core/src/StatePointReads.sol:386`). FM admits this and falls back to *owned* nodes, under which two curators minting `nsfw` get two nodes and, in FM's own worked example, "a path-only client would silently miss Y's 30 photos". The design's headline benefit (Schelling identity) is exactly the part that does not work.
2. **Merge is directionally wrong.** §5: "rebind A's path to node B; bind `A ⇒ B`". After that, the *name* "A" resolves to node B; a query typed "A" reads B's column; A's own column (every historical assertion of A) is reachable only via the implication *in the B direction*. Queries for A lose A's history; queries for B gain it. No `replacedBy`/REDIRECT exists in FM. Over ten years this orphans columns silently.
3. **Implication overloads `tagPurpose` on the tag node.** "A `TagSet` bound at `(tagPurpose, nodeA, 0)` read as A implies B." That is indistinguishable from *tagging the tag node* (`meta:needs-wiki` on `nimbus`). No typed relations (`related`, `exactMatch`, `partOf`) exist at all.
4. **Label = leaf segment** breaks under multiple placements (which placement's segment is "the" label?) and under translation ("language subtrees hard-linking the node" means the label depends on which path you arrived by). No `prefLabel` per language per concept.
5. **Tags-as-directories leak file semantics.** "wiki = an ordinary file inside the tag directory" means `readdir(/tags/clouds)` lists subtags *and* files, and `DirectoryEntry.child` must be FILE or DIRECTORY (`hierarchical-files-and-folders.md:429-434`) — so a FILE under `/tags/clouds` is a valid entry that is not a tag. Whether `/tags` is a Files mount is never said.
6. **"No global 'everything tagged T'"** contradicts the 2026-07-15 ruling that definition-keyed enumeration is on-chain and indexing is mandatory (`Designs/efsv2/owner-rulings.md:59-60`), while §7 item 4 simultaneously relies on kind-6 for reverse tag-graph reads — which would *be* the global posting.
7. **Rename tombstones the old name** unless "optionally" kept as an alias — the July red team's path-permanence property ("links never structurally 404", `Designs/efsv2/fable-handoff-v2-tag-core.md:71`) becomes an SDK courtesy, not a rule.
8. **Per-new-tag cost is a 4-leaf createDir** (5,132,853 MEASURED; `Reviews/2026-09-09-files-browser-mvp/gas-engineering-2026-09-10.md:42-44`), structurally ~2× a genesis+label. FM prices everything at today's MEASURED shape and refuses to price the floor, which makes "the index is 1%" a statement about the MVP's overhead, not about the design.
9. The reconciliation claim (§1.1: the July `keccak(DOMAIN, parent, keccak(name), kind)` "survives as the position key") is cosmetic: positions are per-principal-bound; the Schelling property lived in the *id*, and under owned nodes the id differs per curator.

### A.3 graph-native — where it hand-waves

1. **"Nobody can mint under another principal's word; ownership buys exactly that"** (§1.1) is false. Records are content-addressed and admission is permissionless; anyone can admit `TagConcept/1{V, salt}`. What V controls is V's *bindings* (catalog placement, labels). The `vocabulary` word is a namespace label, not ownership — which is fine and matches "registration grants no privilege" (`Reviews/2026-07-07-efsv2-corpus/kind-set-conservative.md:378`), but GN states the opposite.
2. **No global per-concept posting.** §4's family list is `alive / assert / deny / implied` per scope; §7 sends "cross-directory global tag search" off-chain. Yet §4.1 item 4 claims "the mandatory-indexing ruling holds: every on-chain tag is queryable". It is queryable only inside a directory you already know. The owner's "everything tagged X" and the ruled-on-chain definition-keyed enumeration (`owner-rulings.md:59-60`) are dropped without saying so.
3. **`memberOf` duplicates catalog placement.** `/clouds/nimbus` is both a Files name binding under `V:/tags/clouds` *and* a `TagRelation{memberOf}` edge. Two representations of "under clouds"; which one the grouper UI reads is unspecified.
4. **`materialised` lives in `TagStatus` "in the vocabulary release the TagSet cites"** — so the router either reads a release closure to verify the writer's ancestor list (≤16 SLOADs, GN's optimistic count ignores tree descent) or "simply trusts it". Trusted bits in a public index that contracts probe are a lie vector; GN does not choose.
5. **Derived-salt preimage collision** (a renamed `nimbus` blocks a new `nimbus` in V under the derived convention) is admitted but the consequence — the birth name is semi-identity-bearing for derived ids — is not carried into §5.
6. **Per-vocabulary islands.** `TagConcept{V, keccak("nimbus")}` ≠ `TagConcept{V′, keccak("nimbus")}`. Every casual tagger is a vocabulary; convergence needs `exactMatch` bindings. GN argues this is right for `nsfw`; it does not argue it for the owner's "free text" case, where the July research valued cross-client convergence to one id (`kind-set-conservative.md:374-376`).
7. **SSTORE2 under Glamsterdam**: GN cites the ≈195,600 per-account fixed cost (`indexing-and-state-2026-09-10.md:334-337`) and still quotes 0.8–0.9M for an 8-tag TagSet body; that number only holds if the fixed cost is amortised across many sets per chunk, which contradicts one-record-per-TagSet.
8. Surface: 8 purposes, 7 relation kinds, two lenses, `VocabularyRelease/1`, `TAG_VOCAB_DELEGATE`. GN's ship-list default (D4, D7, D8, D12) trims it, but the memo reads as the full set.

### A.4 Common to all three

- **None has measured anything.** The only MEASURED tag write is 2,838,264 / 94 slots (`gas-engineering-2026-09-10.md:30-34`), with an unreconciled 3,060,354 / ~133 slots on another run (`Reviews/2026-09-09-files-browser-mvp/report-for-codex-2026-09-10.md:145-149`). Every floor in every memo is tier-table arithmetic (`indexing-and-state-2026-09-10.md:198-204`).
- **The tagger's bit needs the placer's ordinal, and none of the three verifies it by default.** A bit in `assert[scope(O,D)][P][C]` at ordinal i claims "O's i-th entry in D is the file I tagged". If the router does not check `entryAt(scope, i)` against the assertion's target, a contract probing that bit (which never hydrates) reads a possibly false claim. BF prices the check at ≈8,400 and leaves it optional; FM and GN note the ordinal lookup is unpriced.
- **`alive` does not exist.** The MVP has whiteouts and tombstones, not a bit (`hierarchical-files-and-folders.md:60-62`); all three assume it at 5,070 per state change.
- **All three lose the only GATE-consumable traversal.** July's `isWithin` walk was consumable *because* TAGDEF parents were permanent (`Reviews/2026-07-10-fs-pass-corpus/query-graph-boundary.md:133-136`). With hierarchy as a binding, "is X under /clouds" can change; a contract gating on it must pin a release. Only FM half-says this ("the answer can change").

---

## Part B — Winner and grafts

**Winner: graph-native.** It is the only design that (i) applies the vault's already-ruled Type principle — "a path must not be the canonical identity; renaming a catalog entry does not break exact Records" (`Designs/efsv2/layered-type-system-and-data-abi.md:707-709, :741-751`) — to tags; (ii) types the relations, which ISO 25964 / SKOS §9.6.4 show is the precondition for any safe transitive walk; (iii) has a correct merge (`REPLACED_BY`, never-deleted redirect, un-merge by tombstone); (iv) makes materialisation an opt-in per concept rather than a per-assertion tax; (v) gives the owner a browsable `V:/tags/clouds/nimbus` Files tree without making the path the identity.

**Grafted from booru-faithful:** the normative "what one assertion writes" table with the global per-concept posting *kept and priced* (the July ruling stands until the owner reverses it); the ASSERT_WINS / PRIORITY / UNION policy vocabulary (re-keyed to lens purpose, not tag category); "label at first use" as an SDK default; alias/closure bounds; the honest-ledger table; the `alive` bitmap made explicit; the ordinal-verification cost made mandatory for contract-consumable bits.

**Grafted from filesystem-minimal:** the **commons profile** — a global Schelling id for free text — implemented on `TagConcept/1` (a plain record with no charter) rather than on `ObjectGenesis`, which is what makes it admissible today; the invariant "no principal writes into another principal's column"; placement ≠ implication (all three agree); the leaf-segment-as-fallback-label rule; the union-with-priority-deny formula as one named policy.

**Dropped from GN:** the `memberOf` edge (placement is the grouper); "ownership" language on the vocabulary word; SSTORE2 as the Glamsterdam default (measure first).

---

## Part C — Synthesised design memo

### 0. Verdict

A tag is a **concept record** `TagConcept/1 {vocabulary: bytes32, salt: bytes32}` whose id is the ordinary content-addressed RecordId. Two profiles share the Type: **commons** (`vocabulary = COMMONS`, `salt = keccak(canonical string)`), which any client derives offline and which gives the owner's free-text tags one global Schelling id; and **namespaced** (`vocabulary = a principal's word`, derived or random salt), for communities whose `nsfw` must differ from another community's. Every human string is a **binding under the id** (label per language, catalog name under a vocabulary's Files-style `/tags` tree); the catalog parent *is* the grouper the owner described. Hierarchy-as-inference, aliasing and merge are **typed edge records bound at positions under the concept** (`implies`, `exactMatch`, `replacedBy`, `related`); grouping is never inference. An assertion is one `TagSet/1` record per (author, target) with `asserts[]` and `denies[]`, bound at `(TAG_SET, target, k)`; its index shadow is one bit per (directory scope, attester, concept) in `assert` / `deny` families, plus one packed global posting per concept. Expansion is **read-time by default**; write-time materialisation is opt-in per concept into a separate `implied` family, retroactive fold is delegated, bounded and paid — never automatic. Rename is one binding; merge is one redirect binding; nobody's assertion is ever rewritten. Open-world NOT, open attester sets, prefix/regex, global dense scans, ranking and historical counts are off-chain and the client answers them with `eth_call` at a pinned block.

The cost, up front: at the engineering floor an 8-tag `TagSet` is ≈ 414k gas today / ≈ 1.78M Glamsterdam with bodies in slots (≈ 52k / 223k per tag), ESTIMATED; today's MEASURED per-pair write is 2,838,264 (≈ 11.1M Glamsterdam ESTIMATED), 55× the floor per tag. Booru-density (35 tags/post, 12M posts) is unaffordable on either schedule at any of these numbers; a 1,000-photo, 9,500-assertion album costs ≈ 0.3–0.5B today at the floor and ≈ 27B at today's MEASURED rate.

### 1. Identity

```text
TagConcept/1 { vocabulary: bytes32, salt: bytes32 }
conceptId = keccak(TypeId(TagConcept/1), body)

COMMONS = keccak("efs2/vocab/commons/1")            // reserved word, no keys, no owner
SYS_MEDIATYPE = keccak("efs2/vocab/mediatype/1")     // reserved word

commons:   vocabulary = COMMONS,        salt = keccak(canon(string))
namespaced: vocabulary = principalWord, salt = keccak(canon(birthName)) | random
system:    vocabulary = SYS_MEDIATYPE,  salt = keccak("image/png")

canon(s) = NFC(s) → lowercase → ' ' → '_'   // Danbooru normalize_name / e621 NFC+downcase (booru strand §1); frozen once chosen
```

- The record is content-addressed, dedup'd by the kernel, lazily admitted by whoever first needs a kind-6 target to resolve (`indexing-and-state-2026-09-10.md:298-300`). Admission is permissionless; the `vocabulary` word is a **namespace label, not ownership** — squatting is inert because registration grants nothing (`kind-set-conservative.md:378`). What a vocabulary principal controls is its *bindings* (§2).
- **Why concept ids, not name-bearing ids.** The bitmap index is keyed by `(scope, attester, conceptId)` (`indexing-and-state-2026-09-10.md:110-114`); a name-bearing id splits the column on every rename and no REDIRECT re-merges bits. Every mutable-store system that made the name the identity pays per-item rewrites (Danbooru `TagMover`, `app/logical/tag_mover.rb:21-35, 73-82`, raw master 2026-09-10; Wikipedia Cydebot ~6.4M edits; LCSH 2014–2021) — a repair mechanism an immutable ledger does not have.
- **Why a commons profile.** The July research made cross-client convergence to one id ("the Schelling property") a first-class value and called splitting it a failure mode (`kind-set-conservative.md:374-376`); efs15 said "no creator owns the topic" (`Designs/efs15/efs-id-1-candidate.md:167-175`). BF and GN give every principal its own island; FM's fix was blocked by the Files charter rule (`hierarchical-files-and-folders.md:385-387, :418-425`). `TagConcept/1` is not an `ObjectGenesis` and carries no charter, so the commons profile is admissible today. The owner's typed `nimbus` is `commons:nimbus` for everyone, offline-derivable, no lookup.
- **Preimage wart, stated.** Because keccak is one-way, a bare id is unreadable (`fable-handoff-v2-tag-core.md:71`), so the SDK binds a label on first use (§2). Because the commons salt is the canonical string, that string is permanently the *birth name* of one concept; a later, different concept that wants the display label "nimbus" uses a random salt and a label binding — the preimage is never displayed, so nothing is lost except derivability for the second concept.
- **The July derivation survives as the catalog position key**, not as identity: `PositionKey(PURPOSE_TAG_NAME, dir, nameRole(name))` under a vocabulary principal is `keccak(DOMAIN, parent, keccak(name), kind)` with `kind` = purpose (`hierarchical-files-and-folders.md:620-640`). Hierarchy falls out of positions; it no longer enters ids.

**`/clouds/nimbus` — three claims on one id:**

| Claim | Position | Identity-bearing? |
|---|---|---|
| catalog placement `V:/tags/clouds/nimbus` | `(PURPOSE_TAG_NAME, dirObject(V:/tags/clouds), nameRole("nimbus")) → conceptId`, under V | no — this **is** the grouper |
| display label "Nimbus" | `(PURPOSE_TAG_LABEL, conceptId, lang) → Label/1{text}` | no |
| inference "nimbus things are clouds things" | `(PURPOSE_TAG_RELATION, conceptId, keccak(implies, cloudsId)) → TagRelation/1` | no; **separate from placement** |

Rendering rule (the first written record of the owner's v1 behaviour, which the vault does not contain — vault strand §1.4): show `prefLabel` under the reader's vocabLens, falling back to the catalog leaf segment; show the catalog parent as the grouper. Placement does **not** make `nimbus` photos answer a `clouds` query — SKOS node labels are not concepts and may not sit in `broader` chains (`https://www.w3.org/TR/skos-reference/` §9.6.4, Primer §4.1, 2026-09-10); Danbooru's own newest implication is a parenthetical suffix *plus* an explicit edge (`/tag_implications.json` id 246196, 2026-09-10). The "create tag under folder" dialog may *propose* the `implies` edge; the protocol never assumes it.

**`images` vs `image/png`:** a typed field on `FileRevision`, addressed as two system concepts; `SYS_MEDIATYPE` declares `image/png implies image` with `materialised = true`. The **placer** sets both bits under its own attester key at placement: +2 bits ≈ 10,140 today / ≈ 25,000 Glamsterdam (`indexing-and-state-2026-09-10.md:131-137`). This is the "second posting the schema declares" the index doc requires (`:428-430`).

### 2. Tag metadata — the "dynamic tag"

All metadata is Principal-qualified bindings at positions whose subject is the concept id; history is Core binding history; a reader's **vocabLens** (an ordinary `ResolutionPlan/1`, mirroring the Files spine's split between the name plan and the revision plan, `hierarchical-files-and-folders.md:64-66`) decides whose bindings count.

| Purpose | subject / role | card. per principal | value | booru equivalent |
|---|---|---|---|---|
| `TAG_NAME` | catalog dir / `nameRole(name)` | 1 per name | `conceptId` | tag name; a second name for the same concept **is** an alias (szurubooru's many-names model, `server/szurubooru/model/tag.py:57-98`) |
| `TAG_LABEL` | concept / `lang` | 1 per lang | `Label/1{text ≤170B}` | SKOS `prefLabel`, S14 |
| `TAG_CATEGORY` | concept / 0 | 1 | `conceptId` of a category concept | Danbooru/e621 category (a facet) |
| `TAG_STATUS` | concept / 0 | 1 | `TagStatus/1{deprecated, invalid, ambiguous, locked, dnp, materialised, replacements[≤4]}` | `is_deprecated`, `is_locked`, `avoid_posting` |
| `TAG_DEFINITION` | concept / `lang` | 1 per lang | Files `File` ObjectId | wiki; history free |
| `TAG_REPLACED_BY` | concept / 0 | 1 | `conceptId` | alias/merge redirect; ≤4 hops at read; never deleted (Wikidata `Help:Redirects`, 2026-09-10) |
| `TAG_RELATION` | concept (from) / `keccak(kind, toId)` | 1 per (kind, to) | `TagRelation/1{from, to, kind}` | implication / related / mapping |
| `TAG_VOCAB_DELEGATE` | attester principal / 0 | 1 | vocabulary word | "V may fold implications into my derived bits" (§4.3) |

**Relation kinds, closed set, shipped in two tranches.** Tranche 1: `implies` (directional; the only kind expanded in queries; transitive under a bounded walk), `replacedBy` (via `TAG_REPLACED_BY`), `exactMatch` (symmetric, transitive; joins two vocabularies' `nsfw` without merging them — SKOS Primer §3.1's argument against `owl:sameAs`), `related` (display only, never walked). Tranche 2 (additive kinds): `broader`, `partOf`, `closeMatch`. **No `memberOf`**: the catalog placement is the grouper.

**Resolution.** Card-1 positions (label, category, status, definition, replacedBy): `PRIORITY_FIRST_PRESENT` by vocabLens order (`Designs/efsv2/lens-spec.md:16`). Card-N edges: union, with first-vocabulary-wins *per source concept* on conflicting `implies` sets — Hydrus's ordered application list and `AddPair` (`ClientDBTagSiblings.py:986-1020`; "the service at the top of the list has precedence", `getting_started_more_tags.html`, 2026-09-10). Cycles are dropped by the reader; Wikidata cannot prevent them with typed relations either (`WikiProject Ontology/Problems`, 2026-09-10).

**Vocabulary version.** Default: `(vocabLens, blockTag)` — a block-hash-pinned Realm view (`hierarchical-files-and-folders.md:76-78`). For contracts and auditable materialisation: `VocabularyRelease/1`, an immutable closure of `(conceptId, edges)` built as a record tree under the 16-reference bound (`Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md:482`), cited by `TagSet.vocabRelease`. This is the first concrete definition of `booru-app.md:209`'s "explicit vocabulary version".

**Who writes; convergence.** Anyone, under their own principal. Creation friction is the first-use cost (concept + label ≈ 138k today / ≈ 672k Glamsterdam, §4), and the imitation channel is autocomplete over the vocabLens's catalogs plus the client's local dictionary of commons strings it has seen — the mechanisms the folksonomy literature shows produce convergence (Golder & Huberman 2006, `arXiv cs/0508082`; Suchanek et al. CIKM 2008: ~⅓ of applications induced by suggestions). Contract-level vocabulary enforcement exists in no working system (theory strand P7).

**Bounds (SDK-normative):** redirect chains ≤4; `implies` closure ≤8 hops / ≤16 ancestors; vocabLens and attesterLens within the lens design center (15–55 entries, `lens-spec.md:97`; on-chain plans 1/8/32/64, `hierarchical-files-and-folders.md:669-673`).

### 3. Assertions

```text
TagSet/1 {
  target:       ObjectId                 // stable Object, never a revision
  vocabRelease: RecordId | 0
  asserts:      ConceptId[≤16]
  denies:       ConceptId[≤16]
  confidence:   uint8[]                  // parallel to asserts; 0 = unstated; unindexed
}
position = PositionKey(PURPOSE_TAG_SET, target, k)     // k = 0,1,2… beyond 16 concepts
binding  = BindingKey(author, position)
```

- **Attribution is the binding principal**; the record is author-neutral and content-addressed (`booru-app.md:164-166`; measured in `Reviews/2026-09-08-upgradeable-foundation/validation-frontier.md:71-89`).
- **One author has exactly one stance per (target, concept): assert, deny, or silent.** DENY is a positive claim ("I looked; it is not"), retraction is a tombstone ("I make no claim", permits Plan fallthrough — `hierarchical-files-and-folders.md:60-62`). Bluesky's `neg` is retraction, not denial (`https://atproto.com/specs/label`, 2026-09-10); EFS keeps both. Assert and deny are distinct reference roles, so their kind-6 keys and bit families never collide — PRD-27 (`Reviews/2026-09-02-efs2-coherence-review-corpus/findings-ledger.md:121-129`) closed by construction.
- **Edit = rebind** to a new `TagSet`; old record stays resolvable, exportable, and out of the index (`indexing-and-state-2026-09-10.md:180-187`). The binding history is Danbooru's `post_versions` for free. Retract-all = tombstone.
- **`int256 weight` is dropped**; it was kernel-neutral in every generation (`Reviews/2026-07-07-efsv2-corpus/tags-maximalist.md:233`). `confidence` is the booru residue (AI-tag scores) and is not indexed.
- **Live count ≠ claim count**: postings are candidates; the bit is the current head (`validation-frontier.md:85-89`).
- **Compatibility**: the MVP's per-pair `(tagId, object)` leaf + binding at `(tagPurpose, object, aux)` (`Reviews/2026-09-09-files-browser-mvp/contracts/src/FilesRouterV2.sol:540-551`) is "shape P": a `TagSet` of one. Both shapes write identical bits and postings; the choice is measured, not argued (D4).
- **Placement reference.** The op names one placement `(placer O, directory D, ordinal i)`; the router **verifies** `entryAt(scope(O,D), i)` resolves to a binding whose target is `TagSet.target` (≈ 4 SLOADs ≈ 8,400) before setting any bit. Unverified bits are inadmissible because contracts probe bits without hydrating. A file with three placements is three bits, three verifications. No placement → no bit, still globally posted.

### 4. Index materialisation rule

Families, all keyed by the binding-position ordinal, never the record id (`indexing-and-state-2026-09-10.md:94-120, :180-187`):

```text
scope    = kind-10 scopeKey(placer, DIRECTORY, D)              // exists; admission ordinals (hierarchical-files:690-708)
alive    [scope][word]                                          // placer-maintained; whiteout/tombstone/remove flip it
assert   [scope][attester][conceptId][word]                     // storage layer: exactly what the attester said
deny     [scope][attester][conceptId][word]
implied  [scope][attester][conceptId][word]                     // derived; opt-in; separate family
posting  (TagSet/1, role=asserts, conceptId)  → packed uint64 admission ordinals, 4/word   // kind 6, the global "tag:T" list
backlink (0, targetKey = target)               → packed, 1 per TagSet                       // kind 5, ruled required (Designs/efsv2/onchain-graph-queries.md:11-15)
```

Read surface (every write must have a reader — the "confirms-but-unreadable" bug class): `entryAt(scope, i)`, `words(scope, family, attester, concept, from, to)`, `aliveWords`, `popcount`, `postingTail(concept, n)`, plus raw `extsload` range getters for contracts (`indexing-and-state-2026-09-10.md:355-358`).

**Invariant:** a principal's `assert`/`deny`/`implied` columns are written only by an op signed by that principal, or by a fold op signed by a vocabulary that principal has bound under `TAG_VOCAB_DELEGATE`. Anyone may *submit* and pay; nobody else may *author*.

#### 4.1 What one `TagSet` write does (k = 8, ESTIMATED at the floor)

| # | write | today | Glamsterdam |
|---|---|---|---|
| a | `TagSet/1` body, ≈10 slots (SSTORE2 alt: ≈300 B) | 221,000 (65,400) | 1,100,200 (654,600 incl. ≈195,600 per-account) |
| b | binding head, fresh | 22,100 | 110,020 |
| c | kind-10 scope append + head rewrite | 27,100 | 122,120 |
| d | ordinal verification (≈4 SLOADs) | 8,400 | 8,400 |
| e | 8 `assert` bits | 40,560 | 100,000 |
| f | 8 global postings, packed 4/word | 74,400 | 292,800 |
| g | 1 kind-5 backlink, packed | 9,300 | 36,600 |
| h | `implied` bits, only for concepts marked `materialised` (d ≤ 16) | 5,070·d | 12,500·d |
| — | ABI / intrinsic share after gas-engineering §5.2–5.6 | 20,000 | 20,000 |
| | **total, bodies in slots** | **≈ 423k (≈ 53k/tag)** | **≈ 1.79M (≈ 224k/tag)** |
| | **total, SSTORE2 body** | **≈ 267k (≈ 33k/tag)** | **≈ 1.34M (≈ 168k/tag)** |
| | without f + g (if the owner takes the opt-in-per-Type direction) | ≈ 339k / 184k | ≈ 1.46M / 1.01M |
| | shape P (per pair): first curator / second curator | ≈ 140k / 96k | ≈ 561k / 341k |
| | **MEASURED today, MVP per pair** | **2,838,264** | ≈ 11.1M |

Edit one tag of eight: new body + head rewrite 5,000 + 2 bits + 1 posting ≈ 274k (slots) / 119k (SSTORE2) today; ≈ 1.19M / 0.75M Glamsterdam. Per-pair edit ≈ 10k + a fresh pair. The Glamsterdam column is dominated by allocation; the two levers are body encoding (D4) and never allocating an id on rename (D1).

#### 4.2 Expansion — read-time by default, write-time per concept

| | write-time (`implied`) | read-time over `assert` |
|---|---|---|
| semantics | frozen at the writer's cited release; auditable via `vocabRelease` | correct under the reader's vocabLens at the reader's basis |
| contract probe "is f a clouds thing?" | 1–2 SLOADs per attester | (1 + d) per attester |
| listing | W words per attester | (1 + d)·W per attester |
| when | low-fan-in umbrellas contracts must probe cheaply; system media types | **default** |

`materialised` is read from the cited `VocabularyRelease` (router verifies the declared ancestor list, ≤16 SLOADs); unreleased vocabularies cannot materialise. Kept separate from `assert` because e621's code concedes a mixed column cannot be un-implied ("can no longer be told apart from one the user put there on purpose", `app/models/tag_alias.rb:206-215`, raw master 2026-09-10) — this is Hydrus's storage/display split (`developer_api.html:2381`).

#### 4.3 Retroactive fold

`foldImplied(scope, attester, A, B, fromWord, toWord)`: `implied[B] |= assert[A] | implied[A]`, word-wise. Authorised iff `TAG_VOCAB_DELEGATE(attester) → V` and V's current release binds `implies(A→B)` (two head reads); signed by V, submitted and paid by anyone. Per 256 entries: 2 SLOADs + 1 SSTORE = 9,200–26,300 today / 16,300–114,220 Glamsterdam. Per scope only — no "which scopes contain A" map exists (`indexing-and-state-2026-09-10.md:57-83`). Removal of an implication with other antecedents is a recompute `implied[B] = OR over remaining A′`, O(fan-in × W): hence `materialised` only on low-fan-in umbrellas; e621's `breasts`-class fan-in stays read-time. The stamp is per (scope, attester, B): `impliedBasis[scope][attester][B] = releaseId`.

#### 4.4 The four owner queries and booru staples (n = 1,000, W = 4, attesterLens [A, B]; reads unchanged by Glamsterdam; ESTIMATED)

| query | columns / SLOADs | gas |
|---|---|---|
| tagged `images` | `implied[placer][image]` — 4 | 8,400 |
| tagged `image/png` | `assert[placer][image/png]` — 4 | 8,400 |
| tagged `nsfw` (UNION over A, B) | 8 | 16,800 |
| `nsfw` with read-time closure {explicit, questionable} | 24 | 50,400 |
| `nsfw` honouring trusted DENY | + 8 | 33,600 |
| **NOT** `nsfw`, within the listing = `alive & ~(A ∪ B)` | 12 | 25,200 (closure: 58,800) |
| membership probe by a contract (verify entry + 2 columns) | ≈ 6 | ≈ 12,600 |
| `A AND B AND C` | 24 | 50,400 |
| `A OR B OR C` | 24 | 50,400 |
| `character:foo` | catalog head ≤ 2 + record + 8 | ≈ 21,000–25,000 |
| alias `girl` → `female` | ≤ 2 `TAG_NAME` + ≤ 4 `REPLACED_BY` hops | ≤ 12,600 then the query |
| popcount `nsfw` under [A, B] (current basis only) | 8 | 16,800 |
| global `tag:T`, newest 20 (any directory) | 5 posting words + 20 × ≈3 SLOADs to resolve ordinal → binding → target | ≈ 137k |
| global `T AND U` over an open corpus | enumerate the rarer posting (300 entries ≈ 158k) + per candidate resolve + 2 bit probes (≈ 10,500) | ≈ 3.3M — `eth_call` only; the query-graph line (`query-graph-boundary.md:10-25`) |
| wildcard `cloud*`, related tags, ranking, historical counts | **not on-chain** (§7) | — |

n = 10,000 → ×10; n = 100,000 → a 2-attester 3-tag AND ≈ 5M; the read ABI takes `(fromWord, toWord)` (`indexing-and-state-2026-09-10.md:160-163`). Danbooru's 12.1M posts in one scope (W ≈ 47k, ≈ 99M per column) is not a directory anyone builds. Words per predicate per 256 entries = attesters × (1 + implied? + deny?) — Danbooru's 2/6/∞ tag limits and 3/6/9 s timeouts (`app/models/user.rb:662-692`) are the same knob as an `eth_call` gas ceiling.

### 5. Rename, merge, split

| operation | writes (today / Glamsterdam, ESTIMATED) | touches assertions? | index column | old references |
|---|---|---|---|---|
| **rename** `nimbus` → `cumulonimbus` | new `TAG_NAME` binding ≈ 49k / 232k; label record + rebind ≈ 49k / 232k; **old name stays bound** (= alias) — mandatory, not optional; tombstoning it is a separate, deliberate act | no | unchanged | every link to `V:/tags/clouds/nimbus` resolves; the July path-permanence property re-earned by rule |
| **merge** A into B | `TAG_REPLACED_BY(A) → B` ≈ 49k / 232k + `TAG_STATUS(A){deprecated}` | no | A's `assert` column never rewritten; readers compute `B ∪ redirectsTo(B)` (reverse map = kind-6 on `TAG_REPLACED_BY` bindings, one page, ≤ 4 hops) until an optional delegated fold | "author said A" stays verifiable and is presented as B under a Lens that trusts the redirect |
| **un-merge** | tombstone the redirect ≈ 5k / 12k | no | if folded: recompute (§4.3) | history intact |
| **split** A → A1, A2 | mint A1, A2; `TAG_STATUS(A){deprecated, replacements:[A1, A2]}` | cannot be automatic | new columns fill as curators re-tag; client flags "tagged A only — needs review" | Danbooru's `deprecate` + BUR |
| **re-group** `/clouds/nimbus` → `/weather/nimbus` | Files rename of the catalog entry (bind under new dir + whiteout/tombstone under old) ≈ 54k / 244k | no | none — grouping is not indexed | old path: keep as alias or let it 404 by *choice* |
| **recategorise** | one head rewrite 5k / 12k | no | none | Danbooru re-saves every post to recount `tag_count_<cat>` (`tag.rb:167-185`); do not replicate |
| **deprecate / DNP** | one `TAG_STATUS` head | no | none | UI refuses to *add*; serving Lens applies the deny rule |

No operation rewrites another principal's claim. Danbooru's `TagMover` and e621's Sidekiq undo snapshots (booru strand §3) are neither available nor needed.

### 6. Pluralism

**Case 1 — hierarchy.** V1 binds `implies(nimbus→clouds)`; V2 (meteorologists) places `nimbus` under `/precipitation` and binds no implication. Reader with vocabLens `[V2, V1]`: `nimbus` is grouped under `precipitation`; V2's `implies` set for `nimbus` wins per source concept (empty), so `clouds` does not expand to nimbus. `[V1, V2]`: the reverse. A's `implied[clouds]` bits stamped with V1's release are trusted only by readers whose vocabLens agrees with that release; others fall back to read-time expansion over `assert[nimbus]`. The "Why?" drawer the MVP already has (`Reviews/2026-09-09-files-browser-mvp/acceptance.md:22`) names the vocabulary that supplied each edge.

**Case 2 — `nsfw`.** Commons profile: one id, disagreement lives in the columns. Namespaced: `V1:nsfw` ≠ `V2:nsfw`, joined by `exactMatch` on request. A asserts, B denies on 40 photos. The combinator is a **per-purpose lens policy**, never a tag property: `UNION_PROVENANCE` (default — everything shown, chips say "A: nsfw · B: not nsfw"), `ASSERT_WINS` (safety purposes — Bluesky's most-restrictive-wins, `packages/api/src/moderation/decision.ts`, 2026-09-10), `PRIORITY` (first roster principal with a stance wins; = FM's `∃i assert ∧ ¬∃j<i deny`). This is the card-N combinator the theory strand says the Lens lacks (P6) and that `visual-gallery-and-booru-ecosystems.md:157-168` demands; it belongs in `lens-spec.md` as a profile parameter beside ADVISORY/1 and DISCOVERY/1 (`lens-spec.md:52`), not in three memos.

**What is honest to claim on-chain, in one sentence:** at basis b, under a closed named attesterLens L and vocabLens V, "principal P asserted/denied concept C on ordinal i of scope S" and "the effective stance under (L, V, policy) is X" — never "f is nsfw", never anything about principals outside L, other placements, or later blocks (`owner-rulings.md:51`, ruling F: "on-chain gates use closed, trusted author sets").

### 7. Not answerable on-chain, and what the web client does with `eth_call` only

| question | why not | client, `eth_call` at a pinned `blockTag`, no Graph |
|---|---|---|
| NOT over the ledger | open-world, non-monotone (`query-graph-boundary.md:121-124`) | only inside a listing: `alive & ~T`; copy "hidden by filter / zero is not proof" (`acceptance.md:24`) |
| "anyone tagged f with T" | columns are per attester; no union over unknown writers (`indexing-and-state-2026-09-10.md:117-120`) | the Lens is always a closed list; discovering attesters is a catalog/social act |
| global search over a large corpus | dense column over 1M entries ≈ 8.2M per scan (`:172-174`); global AND needs one enumeration + probes | posting tail pages; rarest-posting + bit probes; per-directory word ranges; coverage labelled; The Graph last resort (`Designs/media-library/query-and-indexing.md:83-88`) |
| prefix / regex / wildcard, autocomplete | no bit exists | filter the paged catalog listing + local commons dictionary |
| deep implication closure | O(fan-in) columns | walk ≤ 8 hops locally; label "expanded under V@block, depth d" |
| counts at a past basis | only current bits are indexed | popcount at an archive `blockTag`; else `UNKNOWN` |
| related / trending / ranking / full text | off-chain by ruling (`owner-rulings.md:45`) | sampled co-occurrence over pages, cached, labelled |
| private blacklist | must never leave the device (`booru-app.md:211-212`) | resolve through `TAG_REPLACED_BY` locally; subtract after results arrive |
| "is X under /clouds" as a contract gate | hierarchy is now a binding; the July GATE-consumable `isWithin` (`query-graph-boundary.md:133-136`) is gone | contracts pin a `VocabularyRelease` and evaluate the closure in it |

Paging discipline: compare the kind-10 scope `count` before and after each page (`indexing-and-state-2026-09-10.md:167-169`).

### 8. Worked example — 1,000 photos, 40 tags, two curators who disagree

Setup: O places 1,000 photos in `O:/photos/alps` (W = 4). Vocabulary V mints 40 namespaced concepts under `V:/tags/{clouds/{nimbus,cumulus,cirrus}, place/…, subject/…, rating/{nsfw,questionable,explicit}}`, 30 edges, marks `nsfw` materialised with `implies(explicit→nsfw)`, `implies(questionable→nsfw)`, publishes a release. A tags all 1,000 photos, 8 tags each (delegated to V). B re-tags 300 with 5-tag sets, denies `nsfw` on 40 of A's, places `nimbus` under `/precipitation` in B's own catalog with no implication.

**Writes (ESTIMATED at the floor, bodies in slots unless noted; today / Glamsterdam):**

| item | count | today | Glamsterdam |
|---|---|---|---|
| V: concept + label + placement (≈ 231k / 1.12M each) | 40 | 9.2M | 44.8M |
| V: edges (≈ 115k / 562k each) | 30 | 3.5M | 16.9M |
| V: release closure (≈ 3 records) | 1 | ≈ 0.3M | ≈ 1.5M |
| O: media-type bits (2 per photo) | 2,000 | 10.1M | 25.0M |
| O: `alive` bits | 1,000 | 5.1M | 12.5M |
| A: 1,000 `TagSet`s, k = 8 (≈ 423k / 1.79M; SSTORE2 ≈ 267k / 1.34M) | 1,000 | **423M** (267M) | **1.79B** (1.34B) |
| A: `implied[nsfw]` bits for ≈ 120 explicit/questionable photos | 120 | 0.6M | 1.5M |
| B: 300 `TagSet`s, k = 5 incl. 40 denies (≈ 314k / 1.31M; SSTORE2 ≈ 202k / 1.04M) | 300 | **94M** (61M) | **394M** (313M) |
| **total** | | **≈ 546M** (≈ 390M SSTORE2) | **≈ 2.29B** (≈ 1.75B) |
| same 9,500 pairs at today's MEASURED 2,838,264 | 9,500 | **≈ 27.0B** | ≈ 105B |
| for scale: 1,000 file creates at MEASURED 8,766,869 (`report-for-codex-2026-09-10.md:145`) | 1,000 | 8.8B | — |

At the floor, booru-density tagging of the album is ≈ 6% of creating its files at today's MEASURED rate; at today's MEASURED tag rate it is 3× the files. Under Glamsterdam the floor rises ≈ 4.2× (allocation-dominated), and a 35-tag post (3 `TagSet` chunks ≈ 5.4M) still fits one transaction; a per-pair 35-tag post (≈ 19.6M) does not (EIP-7825 cap 16,777,216) — the S3 conclusion (`Reviews/2026-09-02-efs2-coherence-review-corpus/seams/S3-media-x-types-x-indexes.md:68-80`) survives only for shape P.

**Reads, attesterLens [A, B], vocabLens [V, B] (ESTIMATED, either schedule):**

- `images` 8,400 · `image/jpeg` 8,400.
- `nsfw`, safety policy (ASSERT_WINS over A.assert ∪ A.implied ∪ B.assert; B.deny read for display): 16 SLOADs = **33,600**. 40 photos render "A: nsfw · B: not nsfw"; under PRIORITY [B, A] they move.
- NOT `nsfw` in the album: alive + 12 = **33,600**, labelled "according to A, B under V@block N".
- `clouds`, V-first: {clouds, nimbus, cumulus, cirrus} × 2 × 4 = **67,200**; B-first: nimbus excluded = **50,400**, visibly, with the drawer naming B's placement.
- `nimbus AND alpine AND NOT nsfw`: 16 + 4 + 12 = **67,200**.
- Contract: "is photo #412 nsfw under [A, B], safety?" = verify entry (2) + 4 columns × 1 word = **≈ 12,600**, O(1) in n.
- Global `tag:nimbus`, newest 20 across all directories: **≈ 137k**.
- Popcount `nsfw` under A: **16,800** (current bits, never occurrences).

**Later events:**

- V adds `implies(overcast→clouds)`, not materialised: `clouds` reads one more column per attester (+16,800). No write anywhere.
- V marks `clouds` materialised; A delegated: `foldImplied(alps, A, overcast→clouds)` ≈ 37–105k today / 65–457k Glamsterdam, once, this directory only. B never delegated; B's assertions expand at read time.
- V renames `nimbus` → `cumulonimbus`: ≈ 98k today / ≈ 464k Glamsterdam. Zero of A's or B's 9,500 assertions move; `assert[nimbus]` columns untouched; `V:/tags/clouds/nimbus` still resolves (old name kept as alias by rule). Danbooru-equivalent on EFS: 300 nimbus photos × a per-pair rewrite ≈ 42M.
- V merges `nimbus_cloud` (a commons tag 50 people used) into `V:nimbus`: one `TAG_REPLACED_BY` ≈ 49k / 232k; readers OR two columns (+8 words) until a fold.

### 9. Owner decisions — see Part D.

### 10. Contradictions — see Part E.

### 11. What could not be found or verified

- No vault text records the v1 "`/clouds/nimbus` shows as Nimbus under the clouds grouper" rule; the owner's 2026-09-10 chat is the only record. Closest: `Designs/efsv2/read-lens-spec.md:269` and `Designs/efsv2/mountable-filesystem-semantics.md:123` (segment canonical, display name metadata).
- No bitmap, `TagSet`, fold, `alive`, or ordinal-verification write has been measured in any EFS repo; every non-MEASURED number above is tier-table arithmetic. The two MEASURED tag figures (2,838,264 / 94 slots; 3,060,354 / ~133 slots) are unreconciled.
- Whether REF targets must exist at admission (lazy concept records assume open-world REF); whether SR-18e's 16-reference bound can be raised for `TagSet`/`VocabularyRelease` (`indexing-and-state-2026-09-10.md:441-445`).
- Target L2 and whether it adopts EIP-8037/8038 as written (`:431-435`); MegaETH storage pricing.
- Sankaku (all help routes dead 2026-09-10); Danbooru's `RemoveImplication` command (inferred from `reject!` only); Gelbooru alias retagging (DAPI 401); LCSH authority-record retention (id.loc.gov 403).
- Danbooru's SQL implication behaviour on deletion and Marlow et al. 2006 full text: not fetched.

---

## Part D — Decisions for the owner

| # | decision | recommendation | cheapest reversible default | reversibility |
|---|---|---|---|---|
| D1 | Tag identity | `TagConcept/1{vocabulary, salt}`; two profiles (commons, namespaced) on one Type; paths stay catalog placements | same — one Type, no Files change | name-bearing ids are **not** reversible once bitmap columns exist; concept ids can always gain a derived alias layer |
| D2 | Free-text convergence | commons profile (`COMMONS`, `salt = keccak(canon(s))`) is the SDK's default for typed tags | same | a client can always switch to namespaced later; the reverse is a migration |
| D3 | Canonical string folding for commons salts | NFC + lowercase + space→underscore (booru norm); Files names stay unfolded — different object | pick now | **irreversible**; folding cannot be added or removed later without forking ids |
| D4 | Assertion carrier | `TagSet/1` per (author, target); measure slot vs SSTORE2 bodies on both schedules | keep the MVP per-pair op (it exists); index is identical for both | fully reversible — same bits, same postings |
| D5 | DENY | `denies[]` in the same `TagSet`, separate `deny` bit family | same | adding DENY later splits the position; dropping it is a field removal |
| D6 | Weight / confidence | drop `int256 weight`; `uint8 confidence`, unindexed | same | additive |
| D7 | Does catalog placement imply the parent? | no — grouping only; `implies` is an explicit edge (SKOS §9.6.4) | no | adding implication later is one edge per concept; removing an implicit one is impossible |
| D8 | Relation kinds | tranche 1: `implies`, `replacedBy`, `exactMatch`, `related`; tranche 2 additive | `implies` + `replacedBy` only | kinds are additive; never ship an untyped `broader` |
| D9 | Expansion default | read-time; `materialised` opt-in per concept via a release; separate `implied` family | read-time only; no `implied` family | the family is an additive posting kind |
| D10 | Retroactive fold | delegated (`TAG_VOCAB_DELEGATE`), bounded word range, per scope; nobody writes into another's column | do not ship `foldImplied` in v2 | additive |
| D11 | Global per-concept posting (kind 6 on `asserts`/`denies`) + kind-5 backlink | keep, packed 4/word — the 2026-07-15 ruling says on-chain | keep writing it now | can be *stopped* free; cannot be *added* later without a paid pass over every assertion |
| D12 | Ordinal verification on bit writes | mandatory (≈ 8,400) — unverified bits are a lie vector for contracts | mandatory | dropping it later is free; adding it later cannot repair old bits |
| D13 | `alive` bitmap | placer-maintained, 5,070 per state change | ship with the bitmap read side | NOT-within-listing is impossible without it |
| D14 | Media type | `SYS_MEDIATYPE` vocabulary; placer writes two bits | same | bits added later need a pass over every placement |
| D15 | Card-N combinator | lens-spec profile parameter: `UNION_PROVENANCE` default, `ASSERT_WINS`, `PRIORITY` | client-side only; on-chain `ResolutionPlan` stays card-1 | additive |
| D16 | Vocabulary pinning | `(vocabLens, blockTag)`; `VocabularyRelease/1` for contracts and for `materialised` | `blockTag` only | additive Type |
| D17 | Label at first use | SDK binds a label under the tagger's principal for any concept not already labelled in its vocabLens (≈ 93k today / 452k Glam) | on | a tombstone withdraws it |
| D18 | Deny model | polarity DENY on the concept (this memo) vs advisory-definition TAGs (`read-lens-spec.md:224`) | polarity for content tags; advisory feeds stay a separate ADVISORY/1 surface | two models forever if not chosen now |
| D19 | Mandatory indexing vs opt-in per Type | reconcile: tags opt **in** to kind-5/6; nothing else automatic | tags opt in | a ruling, not a mechanism |
| D20 | Is "is X under /clouds" GATE-consumable? | no; contracts pin a release | no | the July permanent-walk property is gone in all three designs; say so |
| D21 | Measure before Stage B | shape S vs P, bitmap, verification, fold, on both schedules, slot-profiled | the measurement itself | — |

---

## Part E — Contradictions between research and designs

1. **Schelling identity.** July ruled splitting the shared id space "halves the Schelling property" and is a failure mode (`Reviews/2026-07-07-efsv2-corpus/kind-set-conservative.md:374-376`); efs15: "No creator owns the topic" (`Designs/efs15/efs-id-1-candidate.md:175`). BF and GN give every principal/vocabulary its own island; FM's ownerless fix is blocked by the Files charter (`hierarchical-files-and-folders.md:385-387, :418-425`; `StatePointReads.sol:386`). Resolved here by the commons profile on a charter-less Type — but the owner should know all three architects abandoned the property.
2. **Mandatory indexing.** 2026-07-15: indexing is mandatory and definition-keyed enumeration is on-chain (`owner-rulings.md:59-60`). 2026-09-10: "make the families opt-in per Type" (`indexing-and-state-2026-09-10.md:392-397`), to which James said "I trust you" (`:412-417`). GN and FM drop the global posting; BF keeps it. Two live directions; D19.
3. **Folder = label.** July: "`/pizza` the folder and `#pizza` the label are the same tagId" (`kinds-ruling.md:167`; `kind-set-conservative.md:372-380`). Active spine: supersedes path-derived TAGDEF (`hierarchical-files-and-folders.md:9`) but `mountable-filesystem-semantics.md:123` still says "Directory = TAGDEF structural namespace node". All three designs retire the identity collapse for concepts; the vault has not updated the older documents.
4. **GATE-consumable hierarchy.** `query-graph-boundary.md:133-136`: `isWithin` over permanent TAGDEF parents is "the only traversal that is" GATE-consumable. Every concept-id design makes hierarchy a binding, so no such walk exists. None of the three says the property is lost; D20.
5. **What an assertion is.** `layered-type-system-and-data-abi.md:689` and `hierarchical-files-and-folders.md:107-111`: a tag is a relationship *Record*. The MVP (`FilesRouterV2.sol:540-551`) and the bitmap plan key on a *binding position*. PRD-27 (`findings-ledger.md:121-129`) says the media set already has two incompatible assertion shapes; `TagSet` is a third. Reconciled only by "record is truth, bit is index" — and only if D4 is decided before the Query Lab.
6. **`keccak(tagString)` costing.** The 2026-09-10 index costing assumed bare string hashes with no registry (`Reviews/2026-09-09-files-browser-mvp/research-2026-09-10/indexing.md:105`); all three designs reject it; the bitmap numbers the vault now quotes were derived under it and should be re-run with a concept + label at first use.
7. **Retroactive implications.** Booru practice: implications apply retroactively (Danbooru `update_posts!`, `tag_implication.rb:157-166`; e621 Sidekiq). BOORU-04 requires "reverse an implication and fail the fixture" (`booru-app.md:82`). Theory P4 and all three designs: not automatic, not global. Reversal is satisfiable only read-time or with a bounded recompute — the fixture must be written for that, not for Danbooru's semantics.
8. **Two deny models.** `read-lens-spec.md:224`: an advisory is an ordinary TAG under an advisory definition, subtracted client-side. All three designs: DENY is a polarity on the *same* concept. Both now exist in the vault; D18.
9. **Card-N combinator.** `lens-spec.md:16`: a lens is "never merely an ordered author list" and already has ADVISORY/1 and DISCOVERY/1 profiles (`:52`); the July Lens is first-attester-wins (`fable-handoff-v2-tag-core.md:33` as quoted by the strands). BF maps to the existing profiles; FM and GN each define a new combinator. The theory strand (P6, Bluesky `decision.ts`) and `visual-gallery…:157-168` agree a card-N combinator is missing; it should be one lens-spec amendment, not three memos.
10. **Floors below the coherence review's estimate.** S3 derived ≈ 174k per assertion leaf on B0 rows (`S3-media-x-types-x-indexes.md:68-80`) with mandatory `KIND_TARGET`/`KIND_ROLE` postings per reference; the three designs' floors (30–160k per tag) are lower because they drop or pack those families. Whichever way D19 goes, one of the two estimates is wrong.
11. **MEASURED figures.** 2,838,264 / 94 slots (`gas-engineering-2026-09-10.md:30`) vs 3,060,354 / ~133 slots (`report-for-codex-2026-09-10.md:145-149`) — unreconciled; no design or strand reconciles them.
12. **Owner's v1 intuition vs SKOS.** The owner's "`/clouds/nimbus` shows as Nimbus under clouds" is a grouping statement; v1 never expanded TAGs up the anchor tree, so there is no conflict with v1 behaviour — but any Obsidian-style expectation ("tagged nimbus matches clouds") contradicts SKOS §9.6.4 and all three designs. D7 makes the choice explicit.
13. **Path permanence.** The July red team's "links never structurally 404" (`fable-handoff-v2-tag-core.md:71`) is a *positive* property the theory strand's negative examples (ENS namehash, Hats) also have; concept-id designs must re-earn it by rule (old name stays bound as alias). GN says so; FM makes it optional; BF is silent. This memo makes it mandatory.
14. **Tags as directories vs the DirectoryEntry meaning check.** FM's tag nodes carry DIRECTORY meaning, so files are valid children (`hierarchical-files-and-folders.md:429-434`); whether `/tags` is a Files mount or a separate purpose is unstated. The synthesis uses a separate `PURPOSE_TAG_NAME` so tag catalogs never collide with Files name slots.