# The query/graph boundary — FS-pass lane report

**Lane:** multi-tag AND cost model · bounded traversal · backlinks (kickoff Q6) · watch/inotify · subgraph-indexability verification · schema stance
**Kind:** spec-grade where normative; verification findings where auditing; everything overturnable with cause except mission ends
**Ground truth used:** [[codex-kernel]] (+ base `native-kernel.md` §4/§7), [[codex-envelope]], [[codex-kinds]], [[read-lens-spec]] §3.4/§7, [[freeze-gates]] §A.8/§C, [[fable-next-pass-scope]], [[client-os-pressure-report]] P1/P13, `fable-fs-prep/state-brief.md`
**Last touched:** 2026-07-10

---

## 0. THE LINE (the deliverable, in one rule)

> **A chain-side query may spend at most ONE bounded, paginated, cross-author enumeration, composed with point reads.** Point reads are O(1) slot/object probes (`getSlot`, `getObject`, `getClaim`, parent-walk hops, follow-budget hops). The one enumeration is a discovery-postings walk (per-tagId today; per-targetId if the backlink index ships). Anything that requires a **second dependent enumeration** — fan-out per hop, joining two enumerations without a probe side, negation over an open world, global ordering/ranking/aggregation, full-text — leaves the chain for the indexer lane (The Graph / export-to-DB / RPC tooling), honestly labeled.

This is one line, instantiated three times:

| Question | On-chain (view contract, free via `eth_call`) | Indexer lane |
|---|---|---|
| Multi-tag AND | enumerate the rarest conjunct once; **hash-probe** the other conjuncts via TAG-slot point reads | unbounded AND, OR-with-ranking, NOT, range, full-text, counts |
| Traversal | single-successor walks (parent-walk, symlink/movedTo/supersededBy chains) + **one** children/postings page | k-hop fan-out (friends-of-friends, subtree aggregation, shortest path) |
| Backlinks | one target-postings walk (**iff the target index ships**, §5) + per-author point probes | cross-author backlinks without the index; ranked/filtered citation graphs |

Two structural facts make the line principled rather than folkloric:

1. **The slot table is a native hash index.** A TAG slot is keyed `(author, definitionId, targetId)` (read-lens-spec §3.4 — the deny pass already exploits this). So "does author *a* tag object *X* into container *T*" is one derivable point read. Intersection therefore never needs a second postings walk: the classic hash-join beats the merge-join whenever one side has a hash index — and EFS's hottest read path *is* that hash index. Roaring-bitmap / skip-list galloping intersection (Lucene/Tantivy lore) is the wrong import here: those exist because inverted indexes *lack* a point-membership oracle. EFS has one.
2. **Enumerations are never GATE-consumable anyway.** Every enumeration result is DISCOVERY-flagged; counts are never consumable; discovery never satisfies PROVEN-ABSENT (read-lens-spec §7.2). So the on-chain/off-chain line for queries is a **cost/convenience line for INTERACTIVE and off-chain readers, not a trust line** — no contract may gate on an AND result at any price. This dissolves half the "is 10M gas too expensive" anxiety: on-chain *consumption* is excluded by doctrine before cost is even asked.

---

## 1. Substrate facts this report stands on (cited, so later phases can check me)

- Discovery index (pending James, P12): `discover(tagId, cursor, limit ≤ 256)` → `[(authorWord, claimId)]`, admission-ordered, container-scoped, DISCOVERY-flagged `[codex-kernel am.9, read-lens-spec §7]`.
- Enumeration spine `allClaims[]`: append-only, **every admitted record incl. REVOKEs, evidence, genesis**; ~22–27k gas/record, stated as ~7–15% of a typical record's total ⇒ **typical full record admission ≈ 150–390k gas** (derived; the A2 gas snapshot replaces this) `[native-kernel §4.2]`.
- Full record bodies in state; `getClaim` synchronous; storage layout ERC-7201-frozen; `eth_getProof` is a documented trustless read path `[codex-kernel adopted core]`.
- TAG slot key `(author, definitionId, targetId)`; PIN slot key `(author, definitionId)`; slotId derivable offline `[read-lens-spec §3.4, P10]`.
- Read ABI (frozen): `getObject, getSlot, getClaim, isRevoked, allClaims/claimCount, getValue, authorHead` `[codex-kernel G5]`.
- Base-text storage (awaiting the amendment-2 inlining, so treat as *provisional*): `tagParent`, `tagChildren[]`, `tagChildrenByKind[]`, and the per-author KEEP set `containsBy[tagId][author]`, `childrenByAuthor[tagId][author][]`, **`referencingByAuthor[targetId][author][]`** `[native-kernel §4.3]`. Cross-author `_allReferencing` is explicitly **demoted** ("never a read index"; the spine "is not a resurrection of `_allReferencing`") `[native-kernel §4.3]`.
- Events: ID-keyed first topics, "full payload in data (log-only-sync capable)", acceptance test: *"a subgraph reconstructs full placement/supersession/mirror/property/visibility state from logs alone — zero eth_calls during sync"* `[native-kernel §7]` — but the drafted event set predates the kinds re-cut and the expiresAt amendment (§7 below finds real gaps).
- EVM cost constants used throughout (EIP-2929/3529): cold SLOAD 2,100 / warm 100; SSTORE fresh slot 22,100 (incl. cold access); nonzero-update 5,000 cold. `eth_call` gas cap: geth default 50M; hosted providers commonly 25–50M. All numbers below are **estimates pending the freeze-gates B gas snapshot**; the *shapes* of the conclusions survive ±2× error.

---

## 2. Cost-model primitives (the numbers everything else composes from)

| Primitive | What it is | Est. gas (cold) |
|---|---|---|
| `getSlot` point probe | TAG/PIN membership check: derive slotId offline, read winner + expiresAt + revocation | ~5–9k |
| `getObject` / parent hop | one tagId → registered body (parent, name, kind) | ~2–5k |
| `getClaim` body resolve | claim meta + body bytes (small edge body ≈ 3–5 slots) | ~10–15k |
| postings-entry scan | one 32-byte postings word (§3.4 layout) | ~2.1k |
| `allClaims[i]` spine read | one word | ~2.1k |
| postings append (write) | one fresh array slot + length update, steady-state | ~27k |
| two-word postings append | (author, claimId) pair layout | ~49k |
| packed-uint64 postings append | 4/slot amortized | ~14k |

Scan throughput under a 50M `eth_call` cap: ~20k one-word postings entries per call (pagination extends indefinitely). Under a 25M cap: ~10k.

---

## 3. Multi-tag AND — semantics, algorithm, cost model, and the exact line

### 3.1 Semantics (normative if adopted)

`select(T₁ … T_k; L, ctx, V)` returns the set of **target objects** X such that for *every* conjunct Tᵢ there exists a claim tagging X into Tᵢ that grades **LIVE** under lens L at venue V (STALE handled per the K6 context split; EQUIVOCAL/REVOKED never match). Precisions that must not be fudged:

- **The intersection key is the target, not the claim.** A file tagged A and tagged B carries *two claims with two claimIds*; postings lists share no claimIds. Any AND design that intersects claimIds is wrong by construction. The join key is `targetId` (REF) / interned `propertyId` (VAL).
- **Two variants, both legal, differently labeled:** *lens-graded AND* (each conjunct satisfied by a lens-admitted author — the trusted view) and *raw AND* (any author — the labeled untrusted browse, LC5). Cross-author satisfaction (Alice supplies the A-tag, Bob the B-tag) is legal in both — each conjunct grades independently; render the per-conjunct attribution (the §4.4 chip generalizes).
- **The result is an enumeration**: DISCOVERY-flagged, venue-relative, admission-ordered by the driving list, deduped by target. Empty result ≠ PROVEN-ABSENT. Count ≠ consumable. Never GATE input. (These are restatements of read-lens-spec §7.2, extended to derived enumerations: **any read whose completeness depends on an enumeration inherits the DISCOVERY flag, no matter how much per-item verification followed.**)

### 3.2 Algorithm (enumerate-rarest + hash-probe)

```
selectAND(tagIds[1..k], lensAuthors[1..A], cursor, limit):
  drive = tagId with the smallest postings length          // k SLOADs to pick
  for each postings entry e in drive from cursor:          // ONE enumeration
    if e.author ∉ lensAuthors: skip                        // 2.1k/entry pre-filter (lens-graded variant)
    X = targetOf(e)                                        // spine + claim resolve, ~10k
    if X already emitted: skip                             // supersession/dup noise
    for each other conjunct Tj:                            // hash-probes, NOT enumerations
      for a in lensAuthors (early-exit on first LIVE):
        probe getSlot(derive(a, Tj, X))                    // ~5–9k
      if no LIVE hit: reject X
    emit (X, witnesses[])                                  // witness = claimId per conjunct
  return (matches, witnesses, nextCursor)
```

- `witnesses` make the output **re-verifiable with ≤ k·A point reads per item** — the read-lens-spec rule-3 discipline (*precompute legal, verification mandatory*) extended to the query lane. An indexer-lane AND MUST return the same witness shape.
- Duplicity (EQUIVOCAL) and deny-subtraction cannot be computed from kernel state (no `(author,order)` state exists, by design) — final grading stays client-side over the view's output, exactly as for any precomputed winner.
- OR needs no machinery at all: client-side union of `discover()` streams. *Ranked/merged* OR is indexer-lane.

### 3.3 Cost formula and the numeric line

```
G ≈ P·2.1k  +  C·(~10k)  +  C·(k−1)·A_eff·(~7k)
    scan       target-resolve   probes (A_eff ≈ 1–2 with early exit)
```
P = postings entries scanned in the driving conjunct; C = candidates surviving the author pre-filter.

Worked points (k = 3, lens of 5, A_eff = 1.5):

| Driving container | P | C | Est. gas | Fits? |
|---|---|---|---|---|
| small (1 page) | 256 | 100 | ~2.7M | any cap, interactive-instant |
| medium (4 pages) | 1,024 | 300 | ~11.5M | 25M yes |
| large (8 pages) | 2,048 | 800 | ~29M | 50M yes / 25M paginate |
| hostile/huge | 20k+ | — | >50M | paginate or indexer |

**The line, stated for the spec:** bounded k-tag AND is a **view-contract convenience** (Durable, redeployable, zero Etched surface) whenever the *rarest* conjunct's postings fit a few pages — as SDK defaults: `k ≤ 4`, driving enumeration ≤ 4 pages (1,024 entries) per call with cursor continuation, lens ≤ 8 authors. Everything larger, and all OR-ranked / NOT / range / full-text / count / sort-by-value, is indexer-lane. James's ask ("2–3-tag AND over small containers") is confirmed **cheap — and the budget is a formula, not a tag-count**: the tag count k barely matters (probes are cheap); what matters is the rarest conjunct's postings size. A 5-tag AND over a 200-entry container is cheaper than a 2-tag AND over a 5,000-entry one.

### 3.4 Postings entry layout (freeze-adjacent: storage layout is Etched)

The AND economics hinge on one storage decision: what a postings entry *is*.

| Layout | Write cost | Scan cost | Author pre-filter | Verdict |
|---|---|---|---|---|
| `(authorWord, claimId)` two words (as the §7.1 ABI implies) | ~49k | 4.2k/entry | free | too expensive to write |
| packed `uint64 spineIdx` ×4/slot | ~14k | 0.5k + **~6k/entry resolve to learn author** | expensive | spam-weak reads |
| **one word: `author(160) ‖ spineIdx(64) ‖ flags(32)`** | **~27k** | **2.1k/entry** | **free** | **recommended** |

The one-word layout is the spam story: a poisoned container costs the attacker ~27k gas per junk entry (writer-pays doctrine) and costs the reader 2.1k per junk entry to *skip* (author pre-filter before any expensive resolve) — ~20k junk entries absorbable per call. `discover()`'s public ABI still returns `(authorWord, claimId)`; the view resolves claimId via `allClaims[spineIdx]` only for surviving entries. **Decide this layout inside the A2 gas bundle; it is frozen with the storage layout.**

### 3.5 NOT, and why it is not a missing feature

"Tagged A AND NOT B" requires *absence of a matching claim by any author* — an open-world negation. It is (a) non-monotone (a later admission falsifies a served result — the exact disease the confluence invariant banishes from admission, resurfacing at read), (b) unsatisfiable on partial venues (absence needs PROVEN-ABSENT, which enumeration can never supply), (c) lens-relative at best. Disposition: **declared gone on-chain**; indexer-lane NOT is legal but its results are venue-and-time-qualified snapshots ("no B-tag known to indexer I as of block N"), never facts. SDKs should name this in the API (`excludeTags` only on the indexer client, documented as as-of).

---

## 4. Bounded traversal — does the parent-walk generalize?

Yes, but along exactly one axis, and the generalization exposes a distinction the kickoff didn't name: **structural walks and claim walks have different trust grades.**

### 4.1 Structural walks (permanent substrate — the strong kind)

`tagId` derivation embeds `parentTagId`; the registered TAGDEF body stores it; `MAX_TAG_DEPTH = 32` bounds it. So:

- **`isWithin(x, ancestor)`** — walk `tagParent` up to 32 hops, ~2–5k each, ≤ ~100k total. This is a walk over **permanent, unrevocable objects**: its answer can never become false, is `eth_getProof`-provable, and is therefore **GATE-consumable — the only traversal that is**. On-chain contracts may legitimately gate on derivation ancestry ("this claim sits under `/registry/packages/`"), and this should be said in the cookbook because it is the one traversal exception to "enumerations aren't trust."
- **`childrenPage(tagId, kind?, cursor, limit)`** — one page of `tagChildren`/`tagChildrenByKind`: structural existence only (TAGDEFs are permissionlessly mintable — a child's *existence* is not content, occupancy comes from claims). One level = one enumeration = within the line. A *recursive* subtree walk is enumeration-per-hop = indexer-lane. *(Provisional: the tag-tree arrays are base-text storage awaiting the amendment-2 re-cut — confirm they survive; the parent mapping alone suffices for `isWithin`.)*

### 4.2 Claim walks (revocable edges — the graded kind)

`symlink`/`movedTo`/`supersededBy`-PIN chains are **single-successor** (cardinality-1 PIN slots): each hop is one point probe (~7–9k), already budgeted (`MAX_AUTO_FOLLOWS = 8`, cycle-detected). These compose with the parent-walk (containment *through* a moved subtree = up-walk + movedTo follows, all within budgets). Every hop is a claim ⇒ graded ⇒ the walk's composite grade is the **min** of its hops' grades (a STALE hop mid-chain makes the destination STALE-qualified; an UNKNOWN hop stops the walk — anti-fallthrough applies to traversal too, which no doc currently states: **a resolver MUST NOT skip an unreadable hop**).

### 4.3 Fan-out walks (the gone kind)

Any hop that expands over cardinality-N edges (all TAGs of X's tags, followers-of-followers, subtree aggregate) multiplies enumerations — indexer-lane by the line, with no half-measure worth blessing: a "bounded 2-hop" view would still be O(pages²) and its result inherits DISCOVERY anyway. **Same line as multi-tag AND — deliberately.** The kickoff asked whether it's the same line: it is, because both reduce to "how many dependent enumerations does the read spend," and the answer the chain supports is *one*.

Blessed SDK verbs: `isWithin` (GATE-legal), `resolveFollowing` (budget-8 claim walk, graded), `childrenPage` (structural DISCOVERY), `selectAND` (§3), everything else → `indexerQuery(…)` with the honesty labels baked into the return type.

---

## 5. Backlinks (kickoff Q6) — decide it with costs both ways

### 5.1 What is actually at stake, precisely

The discovery index keys on `definitionId` (the container/tag). The **target** side is today: per-author state (`referencingByAuthor[targetId][author][]`, base KEEP set — "which of Alice's claims reference X" is enumerable *if you already trust/know Alice*), plus indexed `targetId` topics on `TagSet`/`PinSet` events (log-lane, RPC/archive trust, EIP-4444-mortal). What does **not** exist is trustless *cross-author* target enumeration: "who cited X," "which lists contain X," "which paths place this DATA" (the hardlink reverse lookup), "who revoked X." v1 had this as `_allReferencing` and the kernel round **demoted it** — but note the demotion was a default porting of the keep/demote line, not an adversarial ruling against a bounded form; amendment 9 then *added* the per-tagId index under consumer-app pressure, establishing the exact doctrine (bounded, paginated, admission-ordered, DISCOVERY-flagged, spam-at-writer's-gas, poisoning-contained-to-one-key) under which such an index is legal. The FS/graph-DB pass supplies the app pressure the kernel round lacked on the target side. This is the symmetric half of G2.

### 5.2 Costs both ways (the honest table)

**ADD** — `discoverByTarget(targetKey, cursor, limit ≤ 256)`, same entry layout as §3.4, one postings append per claim keyed on the claim's 32-byte target word: REF ⇒ `targetId`; VAL ⇒ interned `propertyId`; REVOKE ⇒ target `claimId`. One uniform rule, no admission branch, never read by admission (confluence-clean bookkeeping, same class as the spine).

- Write cost: **~27k/claim, permanent, paid by every writer forever** — same order as the spine itself; as a fraction of a typical record: **+7–18%**. State growth: one word per claim (≈ a second spine).
- Read payoff: cited-by / bibliographies; "which lists contain X" (LIST entries are TAGs with `definitionId = listId`, target = X — *only* a target key answers this trustlessly); reverse placement lookup ("all names of this file" — the hardlink enumeration, and the `fsck`-style link audit); "who revoked X" (revocation transparency); annotation/comment aggregation on a DATA; and — underappreciated — **value-keyed selection for free**: VAL edges post under their interned `propertyId`, so "everything with `contentType = image/png`" is one postings walk, and a VAL conjunct can *drive* a §3 AND ("tagged /photos AND contentType=png"). The graph-DB half of the mission (edges first-class, natively reified) currently ships **forward-native, backward-indexer**; this one word per claim makes the graph bidirectional at the same trust grade in both directions.
- The 100-year argument (the sharpest one): the log-lane backlink alternative dies with EIP-4444 history expiry; the archival reconstruction path is the state-walk. **Citation graphs are core archive value — "who cited this" should survive on the same terms as "what does this cite."** Under state-walk-only reconstruction both are *derivable* offline either way; the index is about the *live trustless read*, which is what two of five consumer apps already forced for the tag side.

**REJECT** — keep the demotion. Backlinks become the specced indexer-lane pattern: subgraph entity `Reference {target, author, claim, definition, live}` built from `TagSet`/`PinSet` (targetId is already an indexed topic — `eth_getLogs` topic-filter works today), results labeled `DISCOVERY(INDEXED)`, per-item verification via witnesses (each returned claimId re-checked with `getSlot`/`isRevoked` point reads — authenticity provable per item; "there are no hidden citations" is indexer-trust, permanently). What the OS loses: Roam/Obsidian-grade backlinks and "what links here" become RPC-provider-shaped reads; list-containment and reverse-placement have **no** trustless live answer; the deny lane is unaffected (point reads); GATE reads are unaffected (enumerations were never GATE-legal).

**Trimmed middle** (if the A2 bundle needs shrinking): index REF-layout targets only (skip VAL/propertyId postings) — keeps object backlinks, drops value-select; or ship the ABI reserved-but-inactive (a reverting selector + reserved storage namespace) so retrofit stays additive. The second is cheap insurance if James defers.

### 5.3 Ruling recommendation

**ADD, as one decision with the spine and the tag-index in the A2 gas bundle** (three postings writes/claim ≈ 22–27k + ~27k + ~27k on a 150–390k record — the bundle is now ~15–35% of record cost and must be priced as one number for James). If the bundle must shrink, cut in this order: revoke-echo (§6.4, reject anyway) → VAL-target postings → target index (reserve the selector) — never the spine. Freeze-sensitivity: kernel storage + read-ABI surface ⇒ **Etched, now-or-never**; flagged in §10.

---

## 6. Watch / inotify — the blessed poll pattern

EFS has no push and no read traces (atime is gone — a privacy feature). "Did anything change" is answered by **cursors over monotone state**, with push demoted to untrusted cache-invalidation hints. Three trustless cursors, one log lane, one service pattern:

### 6.1 The cursor set (state-poll lane — trustless, venue-local)

| Cursor | Probe | Catches | Cost/tick |
|---|---|---|---|
| **Venue** | `claimCount()` | everything admitted here, incl. REVOKEs, evidence, genesis (the spine holds all of them) | 1 SLOAD |
| **Author** | `authorHead(a)` per lens author | any new admission by *a* at this venue | k SLOADs |
| **Container** | postings length of `tagId` (+ its reserved-key fan, §6.3) | new claims placed/tagged into the container | m + 13·m′ SLOADs |
| **Slot** | `getSlot(slotId)` winner claimId compare | one key's winner changed (IN_MODIFY) | ~3 SLOADs |

One multicall batches the whole watch set into a single free `eth_call`; block time is the tick floor. Delta fetch after a tick: scan `allClaims[old..new]` (venue cursor) or the container postings range — both bounded by what actually changed.

### 6.2 The log lane (standard infra, RPC-trust)

Deterministic IDs make watch filters *derivable offline*: `eth_subscribe`/`eth_getLogs` on `PinSet(slotId/definitionId topics)`, `TagSet(definitionId/targetId topics)`, `ClaimRevoked(targetClaimId topic)` — the base text sells exactly this ("namespace subscriptions are bare eth_subscribe filters from a static site"). Completeness = your RPC's honesty; history = EIP-4444-mortal. Fine as the *mechanism*, never the *truth*: a client acting on a watched change re-reads state (RR-style: the log woke you; the slot answers you).

### 6.3 Two real gaps found, with dispositions

- **Container cursors miss revocations.** Postings are append-on-claim; a REVOKE of a claim in container F does not touch F's postings — "file deleted from folder" doesn't tick the folder cursor. Options: (a) watchers hold the container's known claimIds (they enumerated them) and subscribe/poll `ClaimRevoked`/`revokedBy` on that bounded set — works today, log or state lane; (b) a kernel **revoke-echo**: on admission of an effective REVOKE whose target is already admitted, append an entry to the target's definition postings (pre-revocation completes at target admission, whose own append already ticks — pair-completion covers both orders). Echo cost ~27k per first-effective revoke + an admission-path branch. **Ruling: REJECT the echo** — (a) covers the need at zero Etched cost, and admission-path minimalism outranks a poll convenience. Recorded as an explicit reject so it isn't re-invented (§10).
- **Watching a container means watching its reserved-key fan.** A move of F is a `movedTo` PIN under F's reserved node, not a claim into F. `watchContainer` MUST statically expand to F + its ~13 derivable reserved-key slotIds (all offline keccak). SDK detail, no chain surface.

### 6.4 The watcher-service pattern (honestly labeled) + the grade rule

An off-chain watcher (self-hostable; anyone can run one — it's a log follower with a webhook/WS/push-API front) maintains cursors and pushes hints. Normative honesty rules, mirroring the read-grade grain:

1. **A hint is never truth.** Every hint triggers a verified pull (point reads); a fabricated hint costs a wasted read, nothing more.
2. **Suppression is undetectable** ⇒ every watcher subscription carries a **reconciliation poll** at the data-class freshness horizon (§5.3 H): the IMAP-IDLE-plus-periodic-full-sync shape.
3. **"No news" is never PROVEN-UNCHANGED.** Watcher silence grades UNKNOWN-currency for the watched keys; a GATE read never consumes "watcher reported no change" — it re-resolves. (This is the anti-fallthrough rule wearing a watch face; it belongs in read-lens-spec's next revision alongside P3's NO-TRANSPORT.)
4. **Reorg discipline:** cursors are `(blockHash, index)` pairs; on hash mismatch, rewind to the last finalized cursor and rescan. Spine indices are venue-local bookkeeping and may be orphaned with their blocks.

**inotify disposition: re-homed** (cursors + hints + reserved-key fan); push-as-truth and read-notification (atime) **declared gone** — the first by the no-push/verify-don't-trust grain, the second deliberately (reads leave no trace). **Privacy note (James pulled privacy in):** topic-filtered subscriptions and per-container polls disclose your *watch set* — your interest graph — to the RPC/watcher. Nothing on-chain learns it (no atime), but the transport does. Private watching = bulk sync + local filter (bandwidth-for-privacy), or run your own node; the SDK should name the trade on the watch API, and salted TAGDEFs (Pass-2 slot) make watched *keys* opaque but not watch *timing*.

---

## 7. Subgraph-indexability: verified per op — with three real findings

Method: every FS operation is a macro over the record/op alphabet, so log-only-sync holds for all FS ops **iff** it holds for the alphabet and the alphabet's events carry enough to replay admission. Walked: place, move, rename, symlink, tag, untag, revoke/trash, undo (re-assert), supersede/edit, checkpoint, mount (lens = LIST + entries), collab-ops (per-author TAGs), mirrors, xattrs (VAL edges), list ops, folder mint, genesis.

| FS op | Records | Events (post-re-cut) | Indexer derivation |
|---|---|---|---|
| mkdir / mint path | TAGDEF | `TagDefCreated` (+`ObjectRegistered`) | upsert node; parent edge from body |
| create file | DATA | `DataCreated` | upsert object |
| place / rename target / symlink / move | PIN (placement or reserved row) | `PinSet(slotId, definitionId, …, supersededClaimId)` | slotId derivable offline; winner = replay `(order, recordDigest)` comparator (pure fn — batch-shuffle-safe) |
| tag / list-entry / advisory / collab-op | TAG | `TagSet(definitionId, targetId, author, weight, claimId)` | N-set upsert; slot key derivable |
| xattr / property | VAL edge | `TagSet`/`PinSet` + `PropertyInterned` (first intern only) | join on propertyId (derivable offline even unevented) |
| delete / trash | REVOKE | `ClaimRevoked(targetClaimId, author, revokeClaimId)` | pending-revocation entity, lazy pair-completion join (pre-revocation legal — indexers MUST upsert-out-of-order, which The Graph does natively) |
| undo / restore | new ASSERT | `PinSet`/`TagSet` | ordinary claim |
| edit / supersede | higher-order ASSERT | same | comparator replay; SUPERSEDED derived |
| checkpoint | ordinary reserved-key claim | `PinSet` | nothing special (P7's whole point) |
| duplicity / refusals | — | `SeqCollision`, `RefusedAppendOnly` | evidence entities, never state |
| genesis | manifest records | **must emit the standard events** | else every subgraph special-cases genesis |

**Verdict: log-only-sync holds for every FS op — after the event set is re-cut.** Three findings, all pre-freeze obligations (event signatures live in Etched bytecode):

- **F1 (real gap): the drafted `PinSet`/`TagSet` do not carry the claim body.** They predate envelope amendment 4 — no `expiresAt`, no future `claimedAt`, no VAL value bytes in the edge event itself. A log-only subgraph cannot grade STALE, cannot serve timelines, cannot reconstruct bodies once EIP-4444 prunes… without falling back to state-sync, which contradicts the §7 header's own "full payload in data" claim and the ported acceptance test. **Fix: emit the full canonical record body (or at minimum `expiresAt` + trailing optional words) in every claim event.** Cheap (LOG data gas 8/byte; a small edge body ≈ few hundred gas) and mandatory.
- **F2 (housekeeping with teeth): the alphabet itself needs the kinds re-cut.** `MirrorSet`, `ListEntrySet`, `RedirectSet` (deleted kinds — re-homed onto `PinSet`/`TagSet` under reserved keys), `OwnedConflict` (dead code post config-fold), and `ListFull` (deleted by am.2) must go; `SeqCollision` and `RefusedAppendOnly` must be added. Frozen event signatures carrying deleted-kind vocabulary would be a permanent embarrassment and a per-indexer special case.
- **F3 (verify): genesis event parity + `submitSubset` first-touch-only `EnvelopeAdmitted`** — the latter is fine for state derivation (per-record events fire per admission) but artifact re-export joins multiple submissions; document for indexer authors.

Two doctrine lines for the subgraph chapter: (1) **subgraphs index venue facts, never viewer truth** — per-viewer lens resolution cannot be pre-materialized for an unbounded lens space; the subgraph stores claims/slots/revocations/evidence + witnesses, the client folds its lens over them (rule-3 verification discipline); (2) **the indexer inherits confluence**: subgraph state must be a pure function of the admitted set — add a batch-shuffle acceptance test for the reference subgraph, mirroring the kernel's.

---

## 8. Schema: the stance, said properly for database people

**The kernel enforces well-formedness, never validity — and the boundary is principled, not lazy:** *a constraint is kernel-checkable iff checking it reads only permanent, monotone state.* Canonical encoding, NFC names, closed kindTags, targetKind-existence (parents-first over permanent objects), derivation math — all monotone-stable, all enforced. Uniqueness-across-authors, cardinality caps, value ranges, required-properties, referential *currency* — all read revocable or open-world state, all therefore banished from admission **by the same master confluence invariant that keeps replication convergent**. The schema boundary and the replication story are one decision, not two.

Where `CREATE CONSTRAINT` went (tell them, constructively — three read-side homes):

1. **The lens** — "rows I accept" = "authors I trust." Named-graph trust policies, first-class.
2. **Validator authors** — SHACL reborn as signed claims: a validator publishes conformance TAGs ("X conforms to schema S, expires in 90d"); consumers put validators in lenses; a conformance claim is graded, denyable, STALE-able like anything else. Schema conformance becomes *attested, portable, and provenance-carrying* instead of gate-kept. Schemas themselves are publishable on EFS (a TAGDEF subtree + spec DATA) — **convention, not reserved rows** (§10).
3. **The subgraph schema** — the literal `schema.graphql` is where typed shapes, required fields, and enumerable-integrity checks live for DB tooling. "Your DDL is in your subgraph manifest and your lens config, not in the kernel."

One-liner for the docs: **EFS is schema-on-read taken to its logical conclusion: the kernel is a notary, not a DBA.** LIST charters (`appendOnly`, `targetKind`, config-in-listId) are the lone, deliberately tiny write-side exception — immutable-by-derivation constraints, i.e. still monotone. Datomic's schema-as-data and RDF's open-world assumption are the lineage; Neo4j-style constraints and SQL DDL are the consciously rejected expectation, and Datalog/SPARQL remain the named non-goal markers for where query expressiveness lives (off-chain, above the indexable substrate).

---

## 9. Dispositions (pass rule 3 — every touched feature, stated)

| Classic feature | Disposition |
|---|---|
| Multi-tag select (Gmail labels, saved searches) | **native-bounded** (view contract, §3 line); beyond → indexer |
| Query language (SQL/SPARQL/Datalog) | **declared gone** (ruled non-goal); export/The-Graph lane |
| Secondary indexes | **native, exactly two blessed** (tag postings; target postings if §5 adopted); all others indexer |
| Backlinks / reverse lookup / "what links here" | **native iff target index ships**; else **re-homed** to labeled indexer lane |
| JOIN | one-probe-side hash-join **native within budget**; general joins indexer |
| NOT / negation | **declared gone on-chain** (open-world, non-monotone); indexer with as-of labels |
| ORDER BY value / ranking / full-text / aggregation | **re-homed to indexer**; counts never GATE-consumable |
| watch / inotify | **re-homed**: state cursors + log filters + hint services (§6); push-as-truth **gone** |
| atime / read notification | **declared gone deliberately** (reads leave no trace — privacy) |
| Triggers / stored procedures | **declared gone** (no kernel hooks); watcher services are the honest substitute |
| Recursive traversal (find -R, FOAF) | up-walk **native + GATE-legal** (permanent structure); fan-out **re-homed** to indexer |
| Schema / constraints / DDL | **re-homed read-side** (lens + validator claims + subgraph schema, §8) |

---

## 10. FREEZE-SENSITIVE RESERVATIONS (loud, per pass rule 2)

| # | Item | Surface | Ruling | Why |
|---|---|---|---|---|
| R1 | **Target-keyed discovery index** (`discoverByTarget`, one postings word per claim keyed on target/propertyId/revoked-claimId) | kernel storage + frozen read ABI = **Etched, now-or-never** | **ROW-equivalent: ADD** (join the A2 gas bundle as one priced decision with spine + tag index; fallback trims in §5.3; minimum: reserve the selector + storage namespace) | reopens the `_allReferencing` demotion *in bounded form* under amendment-9's own doctrine; the graph-DB mission-half is forward-only without it; retrofit after freeze = a second spine walk nobody will pay for |
| R2 | **Postings entry layout** `author(160)‖spineIdx(64)‖flags(32)` for both indexes | ERC-7201 storage layout = **Etched** | **ROW: pin the layout** with the A2 snapshot | the spam-absorption and AND-cost numbers (§3.4) are functions of this word; layout is unchangeable post-freeze |
| R3 | **Event-set re-cut**: delete `MirrorSet`/`ListEntrySet`/`RedirectSet`/`OwnedConflict`/`ListFull`; add `SeqCollision`/`RefusedAppendOnly`; **full body (incl. `expiresAt`, future `claimedAt`) in every claim event**; genesis event parity | event signatures live in Etched bytecode | **ROW: mandatory pre-freeze fix** (finding F1/F2 — not optional) | without F1 the ported "log-only-sync, zero eth_calls" acceptance test is false as drafted |
| R4 | **Revoke-echo postings append** (container cursors ticking on revocation) | admission-path behavior | **REJECT, explicitly** | covered at zero Etched cost by known-claimId revocation watching (§6.3a); admission minimalism outranks a poll convenience; recorded so it isn't re-invented |
| R5 | Advisory/deny keys, schema + conformance vocabularies, saved-searches/virtual folders, watch subscriptions | would-be reserved rows | **CONVENTION, not rows** (watch subscriptions: no record at all — purely off-chain) | none needs kernel legibility; user TAGDEFs/LISTs suffice; minting rows would freeze app-layer vocabulary |
| R6 | Multi-tag AND / traversal verbs / indexer-lane patterns | view contracts + SDK | **NOT freeze-bound** (Durable) — but **dependent on P12** (discovery index) and R1/R2 | if P12 is refused, §3 collapses wholly to indexer-lane; say so in the P12 decision memo |
| R7 | Base-text KEEP-set survival (`tagParent`/`tagChildren`, `containsBy`, `referencingByAuthor`) through the amendment-2 storage re-cut | kernel storage | **VERIFY before freeze** | §4 traversal (`isWithin`, children pages) and per-author backlinks lean on provisional base-text storage |

Cross-lane dependency flags: `claimedAt` (freeze-gates A.8b) must appear in the re-cut events if adopted (R3 absorbs it); `admittedAt` (P1) is consumed by watch ordering and P13 defenses but is decided elsewhere — nothing in this lane blocks on it, everything in this lane gets more honest with it.

---

## 11. Failure modes, named

- **FM-Q1 Count-as-truth:** UI surfaces "N results" from AND/discovery; an app gates on it. Forbidden — counts are indexer artifacts (existing doctrine, restated for the query lane).
- **FM-Q2 Absence-by-empty-result:** empty AND result consumed as PROVEN-ABSENT. Forbidden — enumeration never proves absence; derived enumerations inherit DISCOVERY (§3.1).
- **FM-Q3 Postings inflation:** adversary stuffs a hot tag/target's postings. Absorbed at ~27k/junk-entry written vs 2.1k/junk-entry skipped (R2 layout); reads paginate; the *container owner's* recourse is curation (drive the AND from a moderator LIST instead of the raw tag), never exclusion.
- **FM-Q4 Indexer-result laundering:** The-Graph AND/backlink results rendered in the trusted pane without per-item witness verification. Violates LC5/RR discipline; the witness shape (§3.2) exists so verification is one point read per item.
- **FM-Q5 Watcher lying/suppression:** fake hints waste a read; suppressed hints are undetectable ⇒ reconciliation poll at horizon H; watcher silence is UNKNOWN, never PROVEN-UNCHANGED; GATEs never consume watch output (§6.4).
- **FM-Q6 Reorged cursors:** spine indices orphaned with their blocks; cursors carry blockHash and rewind to finality (§6.4.4).
- **FM-Q7 The NOT trap:** devs emulate NOT by client-side subtraction and cache it as fact; a later admission falsifies it silently. Indexer NOT is as-of-only, labeled (§3.5).
- **FM-Q8 Fan-expansion creep:** "just one more hop" views (2-hop, then 3-hop) re-grow a query engine on-chain. The line (§0) is one enumeration; hold it.

## 12. Worked example (numbers end-to-end)

*"Photos tagged `beach` AND `2024` AND `family`, trusted view, lens = [me, partner, mom]."* Postings lengths: beach 12,400 / 2024 8,100 / family 310 ⇒ drive `family` (2 pages). Scan 310 entries (651k gas), author pre-filter survives 120; resolve targets (~1.2M); probe `beach` and `2024` per candidate, early-exit avg 1.4 authors ⇒ 120·2·1.4·7k ≈ 2.35M. **Total ≈ 4.2M gas, one free `eth_call`, ~90 matches with witnesses**, admission-ordered, DISCOVERY-flagged, each match re-verifiable in ≤ 6 point reads. The same query with `NOT screenshots` → indexer, labeled "as of block N per indexer I." The same query as a *saved search* → a client artifact or a user LIST (R5: convention). Watching the album for changes → container cursor + reserved-key fan, one multicall/tick; grandma's tablet uses a watcher service and reconciles hourly (§6.4).

## 13. Open questions passed forward

1. James: R1 (target index) inside the A2 bundle — one priced yes/no/trim; and P12 remains the load-bearing antecedent for this whole lane.
2. Kernel iteration: execute R3 (event re-cut) — it is currently a latent spec bug, not a design choice.
3. Read-lens-spec next revision: adopt §6.4's watch-grade rules (hint-never-truth; silence-is-UNKNOWN) and the traversal anti-fallthrough sentence (§4.2), alongside the P3 items.
4. OS pass: the watch API's privacy label (watch-set disclosure to RPC) belongs in the P8/P9 read-path-privacy section; salted-TAGDEF interaction with postings keys is a Pass-2 checkpoint.
5. Reference subgraph + batch-shuffle acceptance test (§7) as a named deliverable next to the SDK resolver.
