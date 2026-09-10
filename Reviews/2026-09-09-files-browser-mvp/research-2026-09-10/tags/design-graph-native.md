<!-- Tag deep dive strand: Architect memo: graph-native (judged winner) -->
<!-- Provenance: produced 2026-09-10 by a research/design agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering lead's
     reading, spot-checks and position are in ../../tag-system-2026-09-10.md. -->

# EFS v2 tag system — graph-native design memo

**Date:** 2026-09-10. **Angle:** tags are first-class concept records with typed edges; the vocabulary is itself lens-scoped data. **Status:** design proposal for the owner's tag deep-dive; not a ruling. All gas figures carry MEASURED / QUOTED / ESTIMATED. Vault paths are relative to `/Users/james/Code/EFS/planning-fable-files-browser/`. Two schedules throughout: **today** (fresh slot 22,100; rewrite 5,000; cold SLOAD 2,100) and **Glamsterdam** (fresh slot 110,020; rewrite 12,100; SLOAD unchanged; ESTIMATED sums of QUOTED parts per `Reviews/2026-09-09-files-browser-mvp/indexing-and-state-2026-09-10.md:37-46`).

## 0. Verdict in one paragraph

A tag is a **concept object with an opaque, owner-minted id**; every string a human sees (name, label, translation, path) is a **binding** under that id; hierarchy, aliasing and implication are **typed edge records bound at positions under the concept**; a tag *assertion* is a per-(author, target) `TagSet` binding whose index shadow is one **bit per (directory scope, attester, concept)**. Paths keep the July derived-id shape because paths must resolve deterministically, but a path is a *catalog placement* of a concept, never the concept's identity — the same rule `Designs/efsv2/layered-type-system-and-data-abi.md:707-709, :741-751` already applies to Types. This is the only shape that survives rename, merge and split on an immutable ledger, and it is the only shape under which a rename does not split the on-chain index column. Expansion (implications) is read-time by default; write-time materialisation is opt-in per concept, kept in a separate derived bit family, and retroactive backfill is a bounded, delegated, word-wise fold that someone chooses to pay for — never automatic. Open-world NOT, open attester sets, prefix/regex over tag strings, and cross-directory global search stay off-chain, and the memo says exactly how the web client answers them with `eth_call` alone.

Where this disagrees with the vault: it retires "the folder `/pizza` and the label `#pizza` are the same tagId" (`Reviews/2026-07-07-efsv2-corpus/kinds-ruling.md:167`) for *concepts* while keeping it for *paths*; the active spine already superseded path-derived TAGDEF (`Designs/efsv2/hierarchical-files-and-folders.md:9`) and says only "a tag is a many-valued relationship Record" (`:107-111`) with no identity formula — this memo supplies one. It also replaces the `keccak(tagString)` costing assumption (`Reviews/2026-09-09-files-browser-mvp/research-2026-09-10/indexing.md:105`) with a concept id, because a string-keyed bitmap column splits on every rename and no REDIRECT re-merges bits.

---

## 1. Identity

### 1.1 The concept record

```
TagConcept/1 { vocabulary: PrincipalId, salt: bytes32 }
conceptId = keccak(TypeId(TagConcept/1), body)            // ordinary content-addressed RecordId
```

- **Owned genesis, same pattern as `ObjectGenesis/1`** (`Designs/efsv2/core-architecture-candidate.md:130-135`: "Topics and ownerless literals can use separate canonical genesis/value profiles rather than fake owners"). The `vocabulary` word is the namespace: Danbooru-the-DAO, a curator collective, or a single user. Nobody can mint under another principal's word; ownership buys exactly that and nothing else — it grants no authority over what the concept means to anyone else's Lens.
- **Salt convention (default): `salt = keccak(canonical birth name)`.** This keeps ids client-computable with no lookup (the deterministic-ids leaning, `Designs/efsv2/fable-handoff-v2-tag-core.md:51`) and gives Schelling convergence *within a vocabulary*: anyone who knows `(V, "nimbus")` derives the same id offline. The birth name is frozen in the preimage but is **never displayed** — the display label is a binding (§2). Consequence to document: after `nimbus` is renamed, a *new* concept cannot be born as `nimbus` in vocabulary V under the derived convention (preimage collision); it must use a random salt. Random salts are always allowed.
- **Two genesis profiles, one Type.** *Community vocabularies* mint under a principal. *System vocabularies* use a reserved principal word (e.g. `keccak("efs.vocab.mediatype.v1")`) and `salt = keccak(canonical string)`; they are unowned, derivable, and minted lazily by anyone (idempotent — the kernel dedups by id, `indexing-and-state-2026-09-10.md:298-300`). Key-in-id is *correct* here because IANA never renames `image/png`; it is wrong for community tags because communities rename constantly (theory strand §6: LCSH seven years, Cydebot ~6.4M edits).

Cost to mint (ESTIMATED, tier table `indexing-and-state-2026-09-10.md:198-204`): one-slot body record ≈ 45k today / ≈ 220k Glamsterdam. With a catalog name binding (§1.2) ≈ 67–110k today / ≈ 330–550k Glamsterdam. That is the Stack-Overflow-style creation friction the theory strand's P7 wants; autocomplete over the Lens's catalogs is the imitation channel that produces convergence (Golder & Huberman; Suchanek's ⅓-of-applications-from-suggestions).

### 1.2 `/clouds/nimbus`: three claims on one id, and what each is

| Layer | What it is | Identity-bearing? | Mechanism |
|---|---|---|---|
| **concept** `nimbus` | `TagConcept/1{V, keccak("nimbus")}` | **yes** — the only identity | immutable record |
| **catalog placement** `V:/tags/clouds/nimbus` | a Files-style name position in V's vocabulary catalog: `(TAG_NAME, dir=V:/tags/clouds, nameRole("nimbus")) → conceptId` | no — display/browse | ordinary Files name binding + kind-10 scope, reused verbatim (`hierarchical-files-and-folders.md:64-68`) |
| **display label** "Nimbus" | `(TAG_PREF_LABEL, conceptId, lang="en") → Label/1` | no | binding |
| **grouping** "under clouds" | `TagRelation/1{from: nimbus, to: clouds, kind: memberOf}` bound at `(TAG_RELATION, nimbus, keccak(memberOf, clouds))` | no | typed edge binding |
| **inference** "nimbus things are cloud things" | `TagRelation/1{…, kind: implies}` (or `broader`) | no | typed edge binding, **separate from grouping** |

The owner's v1 behaviour ("shows as Nimbus, we know it's under clouds") is a client rule: render `prefLabel` (falling back to the catalog leaf name), show the catalog parent as the grouper. The vault has no written record of this rule (vault strand §1.4); this memo is the first place it is specified.

The `memberOf`/`implies` split is deliberate. SKOS says a grouper ("node label") is not a concept and must not sit in the broader chain (SKOS §9.6.4, Primer §4.1); Wikipedia has `{{Container category}}` for the same reason; ISO 25964 shows mixed BTG/BTP chains produce false transitive inferences (Alexiev et al. 2015). So: *placing* a tag under a catalog folder groups it for display and **does not** make files tagged `nimbus` answer a `clouds` query. If the vocabulary wants that, it adds an explicit `implies` edge — and the client's "create tag under folder" dialog may *propose* both edges at once. That is UI, not protocol. Owner decision D3 (§8) is whether the default flips to Obsidian semantics (nested tag matches parent); recommendation: no.

Because the catalog is a Files tree, `web3://danbooru.eth/tags/clouds/nimbus` resolves through ordinary Files resolution to the concept object; the tag's "file content" is its definition/wiki (§2); its children are member tags. The v1 intuition that tags are browsable like folders is preserved without making a file-folder and a tag the same identity.

### 1.3 `images` vs `image/png`

Neither is a community tag. `image/png` is the **media-type field** of a `FileRevision`; `images` is the **top-level type**, a prefix relation on that field (`indexing-and-state-2026-09-10.md:428-430`: "cheap if the schema declares the extra posting, impossible to add later to opaque strings"). In this design both are concepts in the **system media-type vocabulary**, with the derived ids `mediatype:image/png` and `mediatype:image`, and the system vocabulary declares `image/png implies image` with **`materialised = true`** (§4.1). The *placer* of the file (not a curator) sets both bits at placement time under its own attester key. Write: two bits ≈ 10,140 today / ≈ 25,000 Glamsterdam (ESTIMATED, `indexing-and-state-2026-09-10.md:137`). Read: one column each. A community may still mint its own `photos` concept and map it (`closeMatch`) to `mediatype:image`; that is pluralism, not the schema.

---

## 2. Tag metadata — the booru "dynamic tag"

All metadata is **bindings at positions under the concept**, principal-qualified, retained with history. Anyone may write under their own principal; a reader's Lens decides whose bindings count. The vocabulary principal's own bindings are simply the ones most Lenses will list first.

| Purpose | Subject | Field role | Value | Cardinality per principal | Notes |
|---|---|---|---|---|---|
| `TAG_NAME` | catalog directory | `nameRole(name)` | `conceptId` | 1 per name | Files name machinery reused. **A second name bound to the same concept is an alias** (szurubooru's model, verified in the booru strand §1). |
| `TAG_PREF_LABEL` | `conceptId` | `lang` | `Label/1{text}` | 1 per lang | SKOS S14. Translations are more `lang` roles. |
| `TAG_CATEGORY` | `conceptId` | 0 | `conceptId` of a category concept | 1 | Danbooru/e621 category = a facet; categories are concepts in a `category` vocabulary. |
| `TAG_STATUS` | `conceptId` | 0 | `TagStatus/1{deprecated\|invalid\|ambiguous, replacements[], materialised: bool}` | 1 | `materialised` is the §4 write-time flag. |
| `TAG_DEFINITION` | `conceptId` | `lang` | Files `File` ObjectId | 1 per lang | Wiki page is a file; edit history = `FileRevision` history. Free. |
| `TAG_REPLACED_BY` | `conceptId` | 0 | `conceptId` | 1 | Merge/redirect (§5). ≤ 4 hops at read; acyclic per Lens. |
| `TAG_RELATION` | `conceptId` (from) | `keccak(kind, toConceptId)` | `TagRelation/1{from, to, kind, note?}` | 1 per (kind, to) → card-N via positions | Tombstone removes. |
| `TAG_VOCAB_DELEGATE` | attester principal | 0 | vocabulary `PrincipalId` | 1 | "My assertions follow V; V may fold implications into my derived bits" (§4.3). |

**Relation kinds (closed set, typed per theory P3):** `broader` (generic is-a; not transitive by default, SKOS §8.1), `partOf` (partitive), `memberOf` (grouper; **excluded from every walk**), `implies` (directional; the only kind expanded in queries; transitive under a bounded walk), `related` (associative; never walked), `exactMatch` / `closeMatch` (cross-vocabulary mapping; `exactMatch` is symmetric+transitive and is how two vocabularies' `nsfw` concepts are joined without merging them — SKOS Primer §3.1's argument against `owl:sameAs`).

**How a reader picks a vocabulary.** A query carries two ordered principal lists, both ordinary `ResolutionPlan/1` inputs (the Files spine already separates the plan for names from the plan for revisions, `hierarchical-files-and-folders.md:64-66`): `vocabLens` (whose *metadata* bindings count) and `attesterLens` (whose *assertions* count). Card-1 positions (label, category, status, replacedBy) resolve **first-wins** by `vocabLens` order. Card-N edges (`TAG_RELATION`) resolve **union, with first-wins per source concept on conflicts** — exactly Hydrus's `AddPair` over its ordered application list (booru strand §7), which is the only deployed pluralistic tag resolver.

**Vocabulary version pinning.** No new object is needed for the common case: a basis is a block-hash-pinned Realm view (`hierarchical-files-and-folders.md:77`), so "expand under vocabulary V at block B" is `(vocabLens, blockTag)`. For contracts and for auditable write-time materialisation, a vocabulary may mint `VocabularyRelease/1` — an immutable closure of `(conceptId, edges)` at a basis, built as a tree of records because of the 16-reference bound (`indexing-and-state-2026-09-10.md:444-445`), the same structure as a Type package release closure (`layered-type-system-and-data-abi.md:670-672`). Cost O(vocabulary size) records, one-time per release; a 40-concept/30-edge vocabulary ≈ 5–7M today / ≈ 23–34M Glamsterdam (§9). This is what `booru-app.md:209` ("expand under an explicit vocabulary version/Lens") means concretely; the vault never defined it (vault strand §3).

---

## 3. Assertions

**Logical edge:** `(author, target, concept, polarity ∈ {ASSERT, DENY}, confidence: uint8)`. Authorship is the envelope-recovered principal, never a body field (`booru-app.md:164-166`). Weight/confidence is body data the kernel never interprets (`Reviews/2026-07-07-efsv2-corpus/tags-maximalist.md:233`) and the index ignores.

**Physical carrier (recommended, shape S):** one `TagSet/1` record per (author, target), bound at `(TAG_SET, target, k)` under the author:

```
TagSet/1 { target: ObjectId, vocabRelease: RecordId|0, asserts: ConceptId[≤16], denies: ConceptId[≤16], confidence: uint8[] }
```

- This is Danbooru's per-post `tag_string` made immutable and attributed; the binding history is `post_versions` for free (booru strand §5).
- Retract one tag = rebind to a new `TagSet` without it (record + head rewrite + clear one bit). Retract all = tombstone at the position ("I make no claim", permits fallthrough — the `BindingTombstone` semantics of `hierarchical-files-and-folders.md:52-54`).
- DENY is a positive stance in `denies[]`, not a tombstone: "I looked and say it is not." Retraction ≠ denial (Bluesky `neg`; theory P5). One author has exactly one stance per (target, concept): assert, deny, or silent — so ASSERT and DENY can never share a live posting for one author, which is the PRD-27 defect (`Reviews/2026-09-02-efs2-coherence-review-corpus/findings-ledger.md:121-129`) closed by construction: the index carries two bit columns, `assert` and `deny`.
- Supersession: a later binding at the same position supersedes; the old `TagSet` record stays resolvable by id and exportable, is **never in the index** (`indexing-and-state-2026-09-10.md:180-187`). An index's live occurrence count is not a claim count — join the current head (`Reviews/2026-09-08-upgradeable-foundation/validation-frontier.md:85-89`); with bits, the bit *is* the current head.
- `k` extends beyond 16 concepts (`(TAG_SET, target, 1)`, …) until the SR-18e bound is revisited for closure-typed records.

**Alternative (shape P):** the MVP fixture's shape — one `TagAssertion/1{concept, target}` (64 B) + one binding at `(tagPurpose, target, conceptId)` per tag (`Reviews/2026-09-09-files-browser-mvp/contracts/src/FilesRouterV2.sol:540-551`), extended with polarity. Author-neutral records dedup across curators (second curator pays binding + bit only). Cheaper per *edit*, 2–5× dearer per *initial tagging*. Costed side by side in §9; owner decision D5.

**Per-assertion write (ESTIMATED, engineering floor from the tier table; today's implementation is 2,838,264 MEASURED / 94 slots, `Reviews/2026-09-09-files-browser-mvp/gas-engineering-2026-09-10.md:30-34`, and the MUD-style bound is ≈180–280k / ≈0.6–0.95M, `indexing-and-state-2026-09-10.md:289-292`):**

| | today | Glamsterdam |
|---|---|---|
| Shape P, one tag: record (2–3 slots) + binding + bit | ≈ 72–115k | ≈ 343–563k |
| Shape P, second curator, same (target, concept): binding + bit | ≈ 27–49k | ≈ 122–232k |
| Shape S, 8 tags, body in slots (~10 slots) + binding + 8 bits | ≈ 283–305k | ≈ 1.3–1.4M |
| Shape S, 8 tags, body as SSTORE2 bytecode (≈218 gas/B today; 1,530/B + 195,600/account Glam, `indexing-and-state-2026-09-10.md:329-337`) + binding + 8 bits | ≈ 122–164k | ≈ 0.8–0.9M |
| Shape S, edit one tag: new record + head rewrite + 1 bit | ≈ 65–230k | ≈ 0.6–1.1M |
| Shape P, edit one tag: tombstone/rebind + 1 bit | ≈ 27k | ≈ 122k |

Batching amortises only the 21,000 intrinsic fee (`gas-engineering-2026-09-10.md:42-44`); one envelope = one signature is a UX win, not a gas win.

---

## 4. Index materialisation rule

Index families, all keyed by the **binding position ordinal**, never the record id (`indexing-and-state-2026-09-10.md:94-120, :180-187`):

```
scope     = kind-10 scopeKey(placer, DIRECTORY, D)          // per-placer directory ordinal, already paid for
alive     [scope][word]                                     // placer's live entries
assert    [scope][attester][conceptId][word]                // exactly what the attester asserted — the "storage" layer
deny      [scope][attester][conceptId][word]
implied   [scope][attester][conceptId][word]                // derived; write-time or backfilled; separate family
```

Read surface (every write gate must have a reader — the EFS "confirms-but-unreadable" bug class): `ordinal(scope, entryKey)`, `words(scope, family, attester, concept, fromWord, toWord)`, `aliveWords(scope, from, to)`, `entryAt(scope, ordinal)`, plus raw `extsload` range getters for contracts (`indexing-and-state-2026-09-10.md:355-358`).

### 4.1 Exactly what is written at assertion time

1. `assert[scope][author][C]` bit set for each `C ∈ asserts`; `deny[…]` for each in `denies`; the old set's differing bits cleared on rebind (≈5,070 per differing bit today / ≈12,500 Glam; rewrite of an existing word 5,000 / 12,100; a fresh word 22,100 / 110,020 once per 256 entries per column).
2. **No implication expansion by default.** The storage layer is Hydrus's: "it will secretly remember A; no information is lost" (booru strand §3).
3. **Opt-in write-time materialisation:** for each `C` whose `TagStatus.materialised == true` *in the vocabulary release the `TagSet` cites*, the writer's client expands `implies` ancestors (bounded: ≤ 8 hops, ≤ 16 ancestors) and sets `implied[scope][author][ancestor]` bits. The kernel does not walk the graph; the router verifies the writer's declared ancestor list against the cited release (≤ 16 SLOADs) or simply trusts it and lets the `vocabRelease` field make it auditable. The system media-type vocabulary marks `image`, `video`, `audio`, `text`, `application` as materialised; a community marks its handful of hot umbrellas (`nsfw`, `character`-class facets) and nothing else.
4. Every file placement writes the two media-type bits under the **placer's** attester key.

The mandatory-indexing ruling holds (`Designs/efsv2/owner-rulings.md:59-60`): every on-chain tag is queryable. What is *not* mandatory is expansion.

### 4.2 Write time vs read time — the rule per query class

| | Write-time materialised (`implied` family) | Read-time expansion over `assert` columns |
|---|---|---|
| semantics | frozen at the writer's cited vocabulary release; Danbooru's `update_posts!` staleness problem, but auditable | correct under the *reader's* vocabulary at the reader's basis |
| contract point probe "is f a cloud thing?" | 1 SLOAD per attester (`implied[…][clouds]`) + ordinal | `(1 + d)` SLOADs per attester, d = narrower closure |
| listing "all cloud things" | `W` words per attester | `(1 + d)·W` words per attester |
| when | fan-in that contracts must probe cheaply; system vocab | everything else; **default** |
| e621 undo problem (derived bits indistinguishable from user bits) | avoided — separate family | n/a |

A reader trusts `implied[…][attester]` bits only if its `vocabLens` agrees with the release the attester cited; otherwise it falls back to read-time expansion. The client can decide this from the `TagSet.vocabRelease` field with one record read.

### 4.3 Implication added later — retroactive backfill

Not automatic, not free, not global. Mechanism: `foldImplied(scope, attester, A, B, fromWord, toWord)` sets `implied[B] |= assert[A] | implied[A]` word-wise. Authorised when `(TAG_VOCAB_DELEGATE, attester) → V` and `V` currently binds `implies(A→B)` (two head reads). Anyone may submit V's signed op; the submitter pays.

- Per 256 entries: 2 reads + 1 rewrite ≈ 9,200 today (26,300 if the `implied[B]` word is fresh); ≈ 16,300 / 114,220 Glamsterdam. ESTIMATED.
- 1,000-entry directory (W = 4): ≈ 37–105k today / ≈ 65–457k Glamsterdam per (scope, attester, A→B).
- **Per scope only.** There is no on-chain "which scopes contain A" map (`indexing-and-state-2026-09-10.md:117-120` boundary); Danbooru-scale global backfill is exactly the O(affected posts) job every booru runs off-line (booru strand §6) and is not offered on-chain. A community backfills the directories it cares about, on demand, or relies on read-time expansion — which is always correct anyway.
- **Removing an implication** cannot be a word-wise subtraction when B has other antecedents (the e621 `undo!` limit). Correct recompute: `implied[B] = OR over remaining antecedents A'` = `(fan-in + 1)·2,100 + 5,000` per word — bounded, but O(fan-in × W). This is why `materialised` should be set only on low-fan-in umbrellas; hot high-fan-in tags (e621's `breasts` class, hundreds of antecedents) stay read-time.

### 4.4 The four owner queries and the booru staples, priced

Directory of n = 1,000 → W = 4 words per column. `attesterLens = [A, B]` (two curators), placer = archive owner. Reads unchanged by Glamsterdam. h = hits; materialising each hit's ObjectId is +2,100 per hit unless the client already holds the listing page (it usually does). ESTIMATED throughout.

| Query | Columns read | SLOADs | Gas |
|---|---|---|---|
| `images` (system, materialised, placer's key) | `implied[placer][image]` | 4 | 8,400 |
| `image/png` | `assert[placer][image/png]` | 4 | 8,400 |
| `nsfw` exact, union of A, B | 2 columns | 8 | 16,800 |
| `nsfw` with read-time closure {explicit, questionable} | 3 concepts × 2 attesters | 24 | 50,400 |
| `nsfw` where the Lens honours DENY (assert minus trusted deny) | + 2 deny columns | 32 | 67,200 |
| **NOT `nsfw`** within the listing = `alive & ~(A∪B)` | alive + 2 | 12 | 25,200 (closure: 58,800) |
| membership: "is f nsfw under this Lens?" (ordinal + 2 columns) | | 3 | 6,300 (+ closure) |
| AND of 3 tags, 2 attesters | 6 columns | 24 | 50,400 |
| OR of 3 tags | 6 columns | 24 | 50,400 |
| `character:foo` (namespace:tag) | catalog head read under vocabLens (≤ 2) + record, then single-tag | 2–4 + 8 | ≈ 21,000–25,000 |
| alias resolution (`girl` → `female`) | `TAG_NAME` head per vocab in lens + ≤ 4 `TAG_REPLACED_BY` hops | ≤ 2 + 4 | ≤ 12,600, then the query |
| count of `nsfw` under the Lens (popcount, current basis) | 2 columns | 8 | 16,800 |
| wildcard `cloud*` | **not on-chain**; client filters the paged catalog listing (kind-10 scope of `V:/tags`) | — | one listing page |
| related tags | **off-chain** (sampled co-occurrence, as Danbooru/e621) | — | — |

Scale: n = 10,000 → ×10; n = 100,000 → a 2-attester 3-tag AND ≈ 5M, still `eth_call`-fine, transaction-marginal, so the read ABI takes `(fromWord, toWord)` (`indexing-and-state-2026-09-10.md:160-163`). Danbooru's 12.1M posts in *one* scope would be W ≈ 47k → ≈ 99M per column: not a directory anyone builds, and not an on-chain query. Contracts probe membership (O(1)) and gate only on closed attester lists (`owner-rulings.md:51`); they never consume an enumeration as truth (`Reviews/2026-07-10-fs-pass-corpus/query-graph-boundary.md:22-24`).

---

## 5. Rename, merge, split

| Operation | Writes | Touches assertions? | Index column | Old references |
|---|---|---|---|---|
| **Rename** (`nimbus` → `cumulonimbus`) | new `TAG_NAME` binding (22–44k / 110–220k); old name: leave bound (= alias) or tombstone (22k / 110k); `TAG_PREF_LABEL` rebind (5k / 12k rewrite, or fresh) | **no** | unchanged | every `TagSet` still cites the same `conceptId`; every catalog link to the old name still resolves if kept as alias |
| **Merge** (A into B) | vocabulary binds `(TAG_REPLACED_BY, A) → B` (22–44k / 110–220k) + `TAG_STATUS(A).deprecated` | **no** | A's `assert` column is **never rewritten** (storage layer). Queries for B read `A ∪ B` (2 columns) until someone pays `foldImplied(scope, attester, A→B)` per scope (§4.3). | assertions of A remain verifiable as "author said A"; readers present them as B under a Lens that trusts the redirect |
| **Un-merge** | tombstone the `TAG_REPLACED_BY` binding | no | if folded: recompute `implied[B]` (§4.3 removal) | history intact — Wikidata's "never delete a redirect" is satisfied because the old binding stays in history |
| **Split** (A into A1, A2) | `TAG_STATUS(A){deprecated, replacements:[A1,A2]}` + mint A1, A2 | **not automatically — cannot be** | A's column stays; new columns for A1/A2 fill as curators re-tag | client flags items still tagged only A as "needs review"; Danbooru does the same with `deprecate` + a BUR |
| **Re-parent** (`nimbus` from `clouds` to `weather`) | tombstone one `TAG_RELATION`, bind another; move the catalog placement (Files rename: one binding under the new dir + whiteout/tombstone under the old) | no | none (grouping is not indexed) | — |

None of these rewrites another principal's claim; all of them are one or two bindings. Compare Danbooru's `TagMover` (per-post rewrite, capped at 200 posts for `rename`) and e621's Sidekiq job with undo snapshots (booru strand §3) — mechanisms an immutable ledger cannot run and does not need. Redirect chains: the client bounds at 4 hops, drops cycles, first vocabulary in `vocabLens` wins per source concept; multi-hop resolution is deliberately not on-chain (`tags-maximalist.md:90`).

---

## 6. Pluralism

**Case 1 — is `nimbus` under `clouds`?** Community V1 binds `memberOf(nimbus→clouds)` and `implies(nimbus→clouds)`; community V2 (meteorologists) binds `memberOf(nimbus→precipitation)` and no implication. A reader with `vocabLens = [V2, V1]` sees `nimbus` grouped under `precipitation` (first-wins per source concept), and a `clouds` query expands to nothing from `nimbus` (V2's edge set wins for `nimbus`); with `[V1, V2]` the reverse. Both edge sets are on-chain, attributed, and the client's "Why?" drawer (the MVP already has one, `Reviews/2026-09-09-files-browser-mvp/acceptance.md:22`) shows which vocabulary supplied the edge.

**Case 2 — what does `nsfw` mean?** V1 and V2 mint *different* concepts (`TagConcept/1{V1, keccak("nsfw")}` ≠ `TagConcept/1{V2, keccak("nsfw")}`). V2 binds `closeMatch(V2:nsfw → V1:nsfw)`. A query typed as `nsfw` resolves through the catalog under `vocabLens` order to one conceptId; the client may widen to `closeMatch` targets on request, labelled. Curator A asserts `V1:nsfw`, curator B asserts `V2:nsfw` and denies `V1:nsfw` on the same photo. Under `attesterLens = [A, B]` with a **safety policy** (assert-wins, Bluesky's most-restrictive combinator) the photo is nsfw under either concept; under a **correction policy** (first-wins by lens order) A's assertion stands and B's denial is shown as disagreement. Which policy applies is a per-purpose Lens setting, not a protocol fact. This is the second combinator the theory strand says the Lens is missing (P6): first-attester-wins for card-1 bindings; union-with-provenance plus per-viewer policy for card-N claims.

**What is honest to claim on-chain.** A contract can establish, at basis B: (i) record R exists and says `(target, asserts, denies)`; (ii) principal P currently binds R at `(TAG_SET, target)`; (iii) bit `assert[scope][P][C][ord(f)]` is set; (iv) under a **closed, named** `ResolutionPlan` the effective stance on `(f, C)` is ASSERT / DENY / none. It can never establish "f is nsfw" — only "nsfw according to these principals under this plan at this block" (`owner-rulings.md:51`; `Designs/efsv2/read-lens-spec.md:220-224` deny composition is client-side by design). The client must render provenance on every chip; a merged tag cloud that hides who said what throws away the differentiator (`Reviews/2026-07-29-target-communities/visual-gallery-and-booru-ecosystems.md:157-168`).

---

## 7. Not answerable on-chain, and what the web client does with `eth_call` only

| Question | Why not on-chain | Web client, `eth_call` only |
|---|---|---|
| NOT `T` over the ledger (open world) | non-monotone, unbounded universe (`query-graph-boundary.md:121-124`; `indexing-and-state-2026-09-10.md:79`) | NOT only inside a listing: `alive & ~T` at a pinned `blockTag`; UI copy "hidden by filter / zero is not proof" as the MVP already does (`acceptance.md:24`) |
| "anyone tagged f with T" (open attester set) | index is per attester; no on-chain answer at any price (`indexing-and-state-2026-09-10.md:117-120`; `research-2026-09-10/indexing.md:101`) | the Lens is always a closed list; discovery of *new* attesters is a catalog/social act, then the client adds them |
| cross-directory global tag search over a large corpus | dense column over 1M entries ≈ 8.2M per scan (`:172-174`) | per-directory scans with a `(fromWord, toWord)` cursor; federate; label coverage; The Graph as last resort (`Designs/media-library/query-and-indexing.md:83-88`) |
| prefix / regex / wildcard over tag strings | no bit exists (`:175`) | filter the paged catalog listing client-side; autocomplete over cached catalog pages |
| unbounded implication closure (fan-in in the hundreds) | O(fan-in) columns | client walks ≤ d, shows "expanded under V@block, depth d"; materialised umbrellas only where the vocabulary chose to pay |
| count at a historical basis | only current bits are indexed (`:177`) | popcount at a pinned `blockTag` via archive-capable `eth_call`; label `UNKNOWN` if the node lacks the state |
| ranked / related / trending | off-chain by ruling (`owner-rulings.md:45`) | sampled co-occurrence from listing pages, cached, labelled as a client estimate |
| full text over definitions/wiki | off-chain | client-side over fetched files; The Graph if wanted |
| private blacklist | must never leave the device (`booru-app.md:211-212`) | resolve blacklist names through `TAG_REPLACED_BY` locally; subtract after public results arrive |

Paging discipline: pin `blockTag`; read the kind-10 scope `count` before and after a page; re-page on change (`indexing-and-state-2026-09-10.md:167-169`).

---

## 8. Owner decisions this design requires

| # | Decision | Recommendation | Cheapest reversible default |
|---|---|---|---|
| D1 | Tag identity: derived path id (July) / `keccak(string)` / **owner-minted concept record** | concept record: `TagConcept/1{vocabulary, salt}` | same; it is one Type, and paths stay as catalog placements so nothing about Files changes |
| D2 | Salt convention | `keccak(birth name)` default, random allowed | same; a convention, not protocol |
| D3 | Does catalog placement imply the parent (Obsidian) or only group (Notion/SKOS)? | **group only**; implication is an explicit typed edge | group only — adding implication later is one edge per concept; removing an implicit one is impossible |
| D4 | Relation kinds closed set | `broader, partOf, memberOf, implies, related, exactMatch, closeMatch` | ship `implies, memberOf, exactMatch`; add the rest as new kinds (additive) |
| D5 | Assertion carrier: **`TagSet` per (author, target)** vs per-concept binding | `TagSet` with SSTORE2 body (2–5× cheaper to write; Danbooru-shaped history) | per-concept binding is the MVP's existing shape and cheaper per edit; either is reversible because the *index* (bits) is identical for both — choose by the measured initial-tag vs edit ratio |
| D6 | Polarity: DENY as first-class stance in the same position | yes; separate `deny` bit family | yes — dropping DENY later is a Type field removal; adding it later splits the position |
| D7 | Expansion default | read-time; `materialised` opt-in per concept; separate `implied` family | read-time only, no `implied` family — add the family later as an opt-in posting kind (additive) |
| D8 | Retroactive backfill | delegated, permissionless-submit, bounded word range, per scope; never automatic | do not ship `foldImplied` at all in v2; read-time expansion is always correct |
| D9 | Media type as system vocabulary with materialised umbrella | yes; placer writes two bits at placement | yes — it is the "second posting the schema declares" the index doc already assumes |
| D10 | Weight/confidence | `uint8 confidence` in body, unindexed; drop `int256 weight` | same |
| D11 | Card-N Lens combinator (union + per-purpose policy: assert-wins vs first-wins) | define in the Lens spec as a per-purpose plan parameter | client-side policy only; on-chain `ResolutionPlan` stays card-1 |
| D12 | Vocabulary release object for pinning | `VocabularyRelease/1` closure record, minted by the vocabulary, cited by `TagSet.vocabRelease` | `(vocabLens, blockTag)` only; add the release Type when a contract needs to pin a vocabulary |
| D13 | Concept ownership: minted under a principal vs ownerless global Schelling id | minted (namespaced meaning; `nsfw` differs by community) | minted; the system-vocab profile already covers the ownerless case where a global string is right |
| D14 | Re-run the tag write against this shape on both schedules | measure shape S and P at the engineering floor before Stage B | the measurement itself |

---

## 9. Worked example — 1,000 photos, 40 tags, two curators who disagree

**Setup.** Archive owner O places 1,000 photos in `O:/photos/2026-alps` (scope = kind-10 `(O, DIRECTORY, alps)`, W = 4). Vocabulary V (a club) mints 40 concepts under `V:/tags/…` (`clouds/{nimbus, cumulus, cirrus}`, `place/{…}`, `subject/{…}`, `rating/{nsfw, questionable, explicit}`, …) with ~30 edges, marking `nsfw` as `materialised` with `implies(explicit→nsfw)`, `implies(questionable→nsfw)`. Curator A tags all 1,000 photos, 8 tags each. Curator B reviews 300 photos: re-tags them with its own 5-tag sets, denies `nsfw` on 40 of A's, and disagrees that `nimbus` is under `clouds` (B's own vocabulary binds `memberOf(nimbus→precipitation)` and no implication).

**One-time vocabulary cost (ESTIMATED).** 40 concepts × (record ≈ 45k + `TAG_NAME` ≈ 22–44k) ≈ 2.7–3.6M today / 40 × (220k + 110–220k) ≈ 13–18M Glamsterdam. 30 edges × (record 45–66k + binding 22–44k) ≈ 2–3.3M today / ≈ 10–16M Glamsterdam. Optional 40 English labels +2.7M / +13M. Total ≈ 5–7M today, ≈ 23–34M Glamsterdam. Negligible against assertions.

**Placement bits.** O's 1,000 placements write `image` + `image/jpeg` bits: 2,000 × 5,070 ≈ 10M today / ≈ 25M Glamsterdam, amortised into placement (mostly rewrites of the same 8 words; fresh-word cost is 8 × 22,100 ≈ 177k today / 880k Glam).

**Curator A, 8,000 logical assertions.**

| Shape | today | Glamsterdam | vs today's MEASURED implementation (8,000 × 2,838,264 = 22.7B) |
|---|---|---|---|
| S (`TagSet`, SSTORE2), 1,000 records | ≈ 122–164M | ≈ 0.8–0.9B | 140–185× cheaper |
| S, slot bodies | ≈ 283–305M | ≈ 1.3–1.4B | 75–80× |
| P (per-concept), 8,000 records+bindings | ≈ 576–920M | ≈ 2.7–4.5B | 25–39× |

Plus A's `implied[nsfw]` bits for the ~120 photos tagged `explicit`/`questionable`: 120 × 5,070 ≈ 0.6M / 1.5M — trivial.

**Curator B, 300 `TagSet`s (≈1,500 assertions, 40 denies).** Shape S ≈ 37–49M today / ≈ 240–270M Glamsterdam. B's DENY of `nsfw` costs nothing extra beyond the `deny` bit. B's vocabulary edges: 2 bindings ≈ 90–220k / 0.4–0.9M.

**Reads under `attesterLens = [A, B]`, `vocabLens = [V, B]` (ESTIMATED, unchanged by Glamsterdam).**

- `images`: 8,400. `image/jpeg`: 8,400.
- `nsfw` (safety policy, assert-wins, honouring A's materialised umbrella and B's denies): A's `implied[nsfw]` (4) + A's `assert[nsfw]` (4) + B's `assert[nsfw]` (4) + B's `deny[nsfw]` (4) = 16 SLOADs = **33,600**. The 40 denied photos show as "A: nsfw · B: not nsfw" chips; under assert-wins they remain hidden by a strict viewer, under first-wins-with-B-first they show.
- `NOT nsfw` in the album: alive (4) + the 12 above = **33,600**; result labelled "not nsfw according to A, B under V@block N".
- `clouds`: V's implication set makes `clouds` expand to {nimbus, cumulus, cirrus} for V-first readers: 4 concepts × 2 attesters × 4 = 32 SLOADs = **67,200**. A B-first reader gets B's edge set for `nimbus` (no implication), so `clouds` expands to {cumulus, cirrus} = 24 SLOADs = **50,400**, and nimbus photos are absent from that reader's `clouds` view — visibly, with the "Why?" drawer naming B's `memberOf(nimbus→precipitation)`.
- `nimbus AND alpine AND NOT nsfw`: 2×2×4 + 4 + 12 = 32 SLOADs = **67,200**.
- Membership for a game contract: "is photo #412 nsfw under [A, B], safety policy?" = ordinal (1) + 4 columns × 1 word = 5 SLOADs ≈ **10,500**, O(1) in n.
- Popcount `nsfw` under A: 8 SLOADs = 16,800; the count is of current bits, never of occurrences.

**A later change.** V adds `implies(overcast→clouds)` and marks nothing new as materialised: `clouds` queries simply read one more column (+16,800 for 2 attesters). V decides `clouds` should be materialised after all and A has delegated to V: `foldImplied(alps, A, overcast→clouds)` ≈ 4 × 26,300 ≈ 105k today / ≈ 457k Glamsterdam, paid by whoever submits it — once, for this directory. B never delegated; B's assertions expand at read time only.

**A rename.** V renames `nimbus` → `cumulonimbus`: one `TAG_NAME` binding + one label rebind ≈ 27–49k today / ≈ 122–232k Glamsterdam. Zero of A's or B's 9,500 assertions move; the `assert[nimbus]` columns are untouched; every existing link to `V:/tags/clouds/nimbus` still resolves because the old name stays bound as an alias.

**Honest bottom line.** At the engineering floor, tagging this album costs ≈ 0.16–0.21B gas today under shape S and ≈ 1.0–1.2B under Glamsterdam — roughly 5× worse after the repricing, and 100+× better than today's 2.84M-per-tag implementation, which is unaffordable for this album on either schedule (22.7B). Everything above the floor is the Store-encoding, slot-packing and unread-family work already proposed in `gas-engineering-2026-09-10.md:119-135`; the tag *design* adds at most one record and one binding per (author, target) on top of the bits. Under Glamsterdam the fresh-slot term dominates every row, so the two levers that matter are SSTORE2 bodies (D5) and never allocating a new id on rename (D1) — which is the whole argument for concept ids over strings.

---

## 10. What could not be found

- No written vault rule that `/clouds/nimbus` renders as "Nimbus" grouped under `clouds`; the owner's 2026-09-10 chat is the only record (vault strand §1.4).
- No vault definition of "vocabulary version" (`booru-app.md:209`) beyond this memo's `(vocabLens, blockTag)` / `VocabularyRelease/1` proposal.
- No measurement of any tag write at the engineering floor; every figure in §3, §4.4 and §9 except the 2,838,264 baseline is tier-table arithmetic (`indexing-and-state-2026-09-10.md:198-204`).
- Sankaku's current alias/implication governance (all help routes dead today; booru strand preamble); whether Danbooru removes consequents on implication deletion (code not fetched; inferred from `reject!` only setting status).
- MegaETH storage pricing and whether the target L2 adopts EIP-8037/8038 as written (`indexing-and-state-2026-09-10.md:431-435`); both schedules are therefore scored.
- Whether SR-18e's 16-reference bound can be raised for `TagSet`/`VocabularyRelease` closures (`:444-445`); the design works under the bound via `k`-suffixed positions but is uglier.