# EFS v2 on-chain-completeness audit — LANE: Graph-database queries

**Auditor key:** graph-queries
**Date:** 2026-07-10
**Constraint (James, 2026-07-10):** ALL core functionality must work on-chain (Tier 1/2). Every Tier-3 defer must be explicit + James-signed-off. "event-derived / log-only-sync" = Tier 3 for a 100-year archive.
**Builds on:** [[onchain-graph-queries]] (backlink finding already ruled REQUIRED — this lane confirms its Tier and extends to the other six graph queries).

---

## 0. The unification that organizes this lane (state it first)

In v2 the kind set collapses (codex-kinds §"v2 kind set"): **LIST_ENTRY → TAG(definitionId=listId)**, **REDIRECT → typed REF-edges (sameAs/supersededBy/symlink/movedTo/relatedVersion = PIN/TAG)**, **MIRROR → reserved-key `mirrors` edge (PIN/TAG)**. Consequence: **every reverse query in this lane is the same query** — *"which claims (edges) have `targetId == X`, optionally filtered by `definitionId`/kind."* Backlinks, cited-by, which-lists-contain-X, which-predicates-target-X, who-mirrored/tagged-X are **one index**: the **target-keyed discovery index** (`discoverByTarget`, R1 / [[fs-pass-freeze-reservations]] B3). One ruling — *B3 is REQUIRED (core), James rules trim not whether* — resolves lane items 1, 2b, 5, 6, 7 simultaneously.

Two distinct v2 indices must not be conflated (the trap [[onchain-graph-queries]] §3 names):
- **`discover(tagId)`** (codex-kernel amendment 9; [[read-lens-spec]] §7.1) — keyed on **`definitionId == tagId`**: *forward* "what is IN this container / targets under predicate D." This is the v1 `_targetsByDef`/`getChildrenWithEdge` role. **Un-ratified** (pins P12, pending James gas sign-off; §7.3 indexer-lane is the labeled Tier-3 fallback).
- **`discoverByTarget`** (B3) — keyed on the edge's **`targetId`**: *reverse* "what points AT this object." The v1 `_allReferencing`/`_edgeDefinitions`/`_referencingAttestations` role. **⚖ shape/trim pending, capability REQUIRED.**

Postings layout (B4, ADOPTED): `author(160) | spineIdx(64) | flags(32)`. It does **not** store `definitionId` — predicate filtering recovers it via `spineIdx → allClaims → getClaim(claimId)` (the spine, full bodies in state). So predicate-filtered reverse queries are **Tier 2 bounded by #edges-at-X** (one spine read per posting), never Tier 1 for the filtered enumeration — but existence/count stays Tier 1.

---

## 1. Capability × tier × verification × ruling — the master table

Legend: **T1** contract-answerable bounded-gas call · **T2** on-chain STATE, client-reconstructs verifiably (acceptable for core) · **T3** trusted off-chain indexer OR event-log-only (unacceptable for core).

| # | Query | v1 status (file:line) | v2 status (doc§) | Tier v1 → v2 | Core / analytics | Ruling |
|---|---|---|---|---|---|---|
| 1 | **Backlinks — "which records point at X"** (any author) | ON-CHAIN: `_allReferencing` EFSIndexer.sol:215, `getAllReferencing` :791, `getAllReferencingCount` :899 (O(1)), write :1133. Paginated, revoked-filtered. | **DEMOTED → event-derived** (deterministic-ids.md:202 keep/demote line; native-kernel.md:251 "ports unchanged … `_allReferencing` **not** kernel state"). B3 restores as `discoverByTarget`. | T2/T1 → **T3** (regression); fix → T2 (page)+T1 (count) | **CORE** | **REGRESSION — must-fix.** Already ruled REQUIRED ([[onchain-graph-queries]] §4.1, B3). Confirmed Tier: existence/count **T1**, full enum **T2**. |
| 2a | **"which targets under predicate D"** (forward) | ON-CHAIN: `_targetsByDef` EdgeResolver.sol:206, `getTargetsByDefinition` :808; parent-scoped `_childrenWithEdge` :211/`getChildrenWithEdge` :822. | `discover(definitionId)` (codex-kernel amdt 9; read-lens-spec.md:442 `definitionId==tagId`) — **un-ratified**, P12; Tier-3 indexer fallback specced (read-lens-spec §7.3). | T2 → **T2 if ratified, else T3** | **CORE** (cross-author container/folder browse) | **MUST-CONFIRM (freeze-sensitive).** `discover(tagId)` must ship as kernel state (James gas sign-off). If silently dropped → regression. Recommend REQUIRED. |
| 2b | **"which edges of type D target X"** / "which predicates target X" | ON-CHAIN: `_edgeDefinitions[targetID]` EdgeResolver.sol:202, `getEdgeDefinitions` :795; O(1) existence `hasActiveEdge(X,D)` :745, `_activeCount` :198. | Reverse-by-target (B3) + per-posting `definitionId` via spine; OR per-lens O(1) `isActiveEdge`. `_edgeDefinitions` cross-author reverse **demoted** (subsumed by B3, not separately kept). | T2/T1 → **T3** (demoted) → T2 w/ B3 | **CORE** | **REGRESSION — rides B3.** Enum **T2** (bounded by #edges@X, spine read/posting); existence `hasActiveEdge` **T1** (kept via active-slot/count). |
| 3 | **Multi-tag AND / bounded set intersection** ("files tagged A AND B") | No dedicated index (never existed). Composed: enumerate A (`getTargetsByDefinition`/`getChildrenWithEdge`), O(1) membership-test each vs B (`isActiveEdge`/`hasActiveEdge` :722/:745, list `getMemberCount`/`_entryCount` ListEntryResolver:346/:167). T2 for bounded containers. | Same composition: `discover(A)` ∩ O(1) membership(B). T2 **iff** (a) `discover(tagId)` ships [amdt 9] AND (b) O(1) forward membership/count map kept. | T2 (bounded) → **T2 if amdt-9 + membership land, else T3** | **CORE = bounded; analytics = unbounded** | **DRAW THE LINE (sharp call).** *Bounded* 2–3-tag AND over a **bounded container** (folder/list) = **T2 view-contract convenience** — REQUIRED-class, contingent on 2a + O(1) membership. *Unbounded / global-tag-population / ranked / NOT / OR / full-text* = **T3, LEGITIMATELY off-chain (The Graph)** — signed-off (fs-pass-synthesis master table; fs-pass-james decisions). No query language ships. |
| 4 | **k-hop bounded traversal** ("files 2 hops from X") | Single-chain path resolve on-chain (`_parents` :173, `resolvePath`); general k-hop = client composition of single-hop reads. No traversal index. | `tagParent`/`tagChildren` KEPT (native-kernel.md:243-245). k-hop = bounded client/view composition of item-1/2 single-hop legs; global visited-set, `MAX_AUTO_FOLLOWS=8`/segment ([[fs-pass-freeze-reservations]] E3). | T2 → **T2 (bounded)** | **CORE = bounded; analytics = unbounded** | **NO NEW INDEX.** Path/parent-walk resolve = **T2 KEPT (native)**. Bounded k-hop **inherits the tier of its single-hop legs** (so it depends on items 1–2 landing). Unbounded traversal / shortest-path / PageRank over whole graph = **T3 legit off-chain**. |
| 5 | **Reverse LIST membership — "which lists contain X"** | **OFF-CHAIN even in v1.** Only forward `list→members` (`_entries` ListEntryResolver.sol:164); LIST_ENTRY **forbids `refUID`** (:220 `UsesRefUID`), so members never enter `_allReferencing`. No `member→lists[]` map. | LIST_ENTRY → TAG(definitionId=listId). "which lists" = `discoverByTarget(X)` postings whose definitionId is a listId. **Falls out of B3 for free** if list-membership TAGs post to the target index. | T3 → **T2 if B3 + list-TAGs routed in** | **CORE** (basic: "what collections is this in") | **GENUINELY-NEW DECISION (now-or-never).** Not a regression (v1 never had it). Recommend **REQUIRED** ([[onchain-graph-queries]] §6): LISTs are a core graph primitive. §6 sub-decision under B3 trim. |
| 6 | **Cited-by / "which REDIRECTs point at X"** | **OFF-CHAIN even in v1.** `AliasResolver.onAttest` writes **zero state** (AliasResolver.sol:37-38 explicit note; :203 "No state to unwind — reverse fan-in is off-chain"). | REDIRECT → typed REF-edges (PIN/TAG). Cited-by = `discoverByTarget(X)` filtered to the redirect definitionIds. Falls out of B3 **iff REDIRECT targets are routed into the reverse index**. | T3 → **T2 if B3 + REDIRECT targets routed** | **CORE** (version chains: "what supersedes X"; canonical: "what aliases X") | **GENUINELY-NEW DECISION (now-or-never).** Not a regression. Recommend **REQUIRED**; the AliasResolver.sol:38 punt is **superseded by §0** ([[onchain-graph-queries]] §6). §6 sub-decision under B3. |
| 7 | **"who mirrored / pinned / tagged this"** (reverse by predicate) | Mixed: **who-mirrored-X ON-CHAIN** (`_referencingAttestations[X][MIRROR_SCHEMA]` :203, `getReferencingAttestations` :740/:750; `_allReferencing` :215). who-pinned/tagged-X: active-edge maps + `_referencingByAttester` :216; O(1) `hasActiveEdge` :745. | who-mirrored/tagged/pinned-X = `discoverByTarget(X)` filter definitionId. **Cross-author schema-scoped reverse `_referencingAttestations[target][schema]` NOT in v2 keep set** (only `referencingByAuthor` kept, native-kernel.md:248) → demoted. Per-lens reverse kept (T2). | who-mirrored: T2 → **T3** (regression) → T2 w/ B3; per-lens: T2 → **T2 KEPT** | **CORE** (mirror-health, "who else hosts this", social attribution) | **REGRESSION (cross-author leg) — rides B3.** Per-author `referencingByAuthor` **T2 KEPT**; the cross-author / by-predicate reverse is the B3 item. |

---

## 2. The two sharp calls, ruled explicitly

### 2.1 Multi-tag AND — where the on-chain/off-chain line sits
- **ON-CHAIN (T2, core):** bounded k-tag AND (k ≤ ~3) over a **bounded container** — a folder's files, a list's members, a comment thread. Cost model: `discover(tagA)` returns n_A entries (paginated, ≤256/page); iterate the smaller side, O(1) membership-test each against tag B (`isActiveEdge`/`getMemberCount`). Total ≈ **O(min(n_A, n_B))** point reads for one page. A view contract (`EFSFileView`-class, redeployable) computes it — kernel ships no AND.
- **OFF-CHAIN (T3, legitimately deferred, James-signed-off):** intersection over an **unbounded global tag population** ("every file on EFS tagged #photo AND #2026"), any **ranked** result, **NOT**/**OR**/negation, full-text. These inflate to whole-graph scans — The Graph's job. This is the disposition fs-pass-synthesis already carries ("BOUNDED native + off-chain; unbounded/ranked/NOT/OR = The Graph"); it stands under §0 because it is **not a basic reverse lookup** — the §0 carve-out ("basic operations core; analytics off-chain") applies cleanly.
- **The dependency the line hides:** bounded-AND is T2 **only if both** (a) `discover(tagId)` [amdt 9, item 2a] ships as kernel state, and (b) the forward per-(definitionId, member) O(1) membership/count map is kept. If either is demoted, even bounded-AND loses a leg to events → T3. **Both are freeze-sensitive.**

### 2.2 The unbounded/ranked "= The Graph" stance
Affirmed and scoped. EFS deliberately ships **no query language** (fs-pass-synthesis "Schema/CREATE CONSTRAINT → GONE from kernel"; read-lens-spec §7.2 "discovery counts are indexer artifacts, never GATE-consumable"). Legitimately-T3, all with existing sign-off in the FS-pass dispositions: unbounded ranked search, aggregate counts across the whole graph, full-text, analytics, `N-comments`/`N-likes` counts, subtree accounting ("Quotas/accounting → GONE, subtree accounting = indexer job"). **The line is honest:** a *single reverse lookup* and a *bounded intersection* are core (T1/2); *ranked/unbounded/aggregate* is analytics (T3-OK). The one guard: this must be an **explicit** sign-off row, never inherited by silence — which fs-pass-synthesis + [[onchain-graph-queries]] §9 now provide.

---

## 3. Regressions found in this lane (v1-had-it-on-chain, v2-lost-it)

1. **General backlink `getAllReferencing`** — v1 EFSIndexer.sol:215/:791/:899 → v2 demoted event-derived (deterministic-ids.md:202; native-kernel.md:251). *Already found by prior audit; CONFIRMED, Tier T3, must-fix via B3.*
2. **Schema-scoped cross-author reverse `_referencingAttestations[target][schema]`** ("who mirrored X" cross-author) — v1 :203/:750 → v2 keep set retains only per-author `referencingByAuthor` (native-kernel.md:248); the cross-author schema-scoped reverse is **not kept**. **NEW in this lane.** Rides B3 (predicate-filtered reverse).
3. **`_edgeDefinitions[targetID]` / cross-author "which predicates target X"** — v1 EdgeResolver.sol:202/:795 → no cross-author target-keyed predicate index in v2 keep set; demoted. **NEW in this lane.** Rides B3 + spine predicate-recovery.
4. **`_receivedAttestations` (address-target backlink, "records naming address R")** — v1 EFSIndexer.sol:200/:762 → demoted (deterministic-ids.md:202). Reverse-by-target where target is an address; a graph query too. Flagged NEEDS-JAMES in [[onchain-graph-queries]] §5 (recommend restore); note here as the address-target trim under B3.

Items 5 and 6 (LIST-reverse, REDIRECT-cited-by) are **NOT regressions** — off-chain even in v1 — but are genuinely-new **now-or-never** decisions §0 reopens.

---

## 4. Freeze-sensitive on-chain state to reserve before the ceremony (so these queries are T1/2)

1. **B3 target-keyed discovery index (`discoverByTarget`) — REQUIRED, shape/trim pending James.** One postings word/claim, keyed on `targetId`. This single index makes items 1, 2b, 5, 6, 7 T2. REF-target postings **required**; VAL-target the one optional trim; address-target + LIST-reverse + REDIRECT-cited-by are the §6 sub-decisions James rules. Etched kernel storage — cannot be added post-freeze.
2. **Amendment-9 `discover(tagId)` container-scoped cross-author forward index — RATIFY (James gas sign-off).** Makes item 2a T2 and supplies the enumeration leg for bounded-AND (item 3). Currently P12/un-ratified; fallback is Tier-3 indexer (read-lens-spec §7.3). Etched.
3. **Forward per-(definitionId, member) O(1) membership/count map — KEEP.** The `_activeEdge`/`_activeCount`/`_entryCount` analogs. Required for bounded-AND membership tests (item 3) and `hasActiveEdge` existence (item 2b) to stay T1/T2.
4. **Route REDIRECT targets + LIST-membership TAGs INTO the target-keyed index** (the §6 sub-decisions) — now-or-never for items 5 and 6. Without routing, cited-by/which-lists stay T3.
5. **Postings must let `definitionId`/kind be recovered** — via B4 `spineIdx` → `allClaims` spine → `getClaim` (full bodies in state, native-kernel.md:23). Keep the spine + state-resident bodies; this is what makes predicate-filtered reverse (2b/5/6/7) reconstructable without event logs.

---

## 5. What stays legitimately Tier 3 in this lane (explicit, needs James sign-off entry)

- Unbounded / global-tag-population multi-tag AND; any ranked, NOT, OR, negation, or full-text query (§2.1/§2.2). *Signed-off in fs-pass-synthesis master table — CORE-must-fix: none; legitimately-deferrable: all of these.*
- Aggregate/analytics counts across the whole graph (N-comments, N-likes, subtree size). *read-lens-spec §7.1 "counts are indexer artifacts."*
- Unbounded k-hop traversal / shortest-path / graph-analytics (item 4 unbounded case).

None of the above is a "basic operation" under §0; each is analytics. The **one guard**: keep these as explicit rows, never silent inheritance.

---

## 6. Bottom line for this lane

Six of seven queries reduce to **one required on-chain index (B3 `discoverByTarget`)** plus the **already-required forward `discover(tagId)`**. Confirm B3 REQUIRED (shape-only for James), ratify amendment-9, keep the O(1) membership map, and route REDIRECT+LIST targets in — and the entire basic graph-query surface (backlinks, predicate-reverse, which-lists, cited-by, who-mirrored, bounded-AND, bounded k-hop) is T1/T2. The **regressions** (items 1, 2b, 7-cross-author, plus address-target rider) all ride the same B3 fix. The **legitimately-off-chain** set (unbounded/ranked/NOT/OR/full-text/aggregate) is honestly drawn and already signed off — but must stay an explicit row.
