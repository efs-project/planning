# EFS v2 on-chain-completeness audit — LANE: Filesystem operations

**Auditor key:** filesystem-ops
**Date:** 2026-07-10
**Scope:** the classic-FS read primitives — path resolution, directory listing, containment, move/rename/symlink/mount follow, version history, directory snapshot/restore, hardlink resolution.
**Method:** v1 = cited from `/Users/james/Code/EFS/contracts/packages/hardhat/contracts/` (file:line). v2 = cited from `/Users/james/Code/EFS/planning/Designs/efsv2/` (doc§) and corpus `Reviews/2026-07-07-efsv2-corpus/`.

## Tier legend
- **T1** contract-answerable in a bounded on-chain call (composability).
- **T2** on-chain STATE, client-reconstructible, no trusted third party (verify-don't-trust — acceptable for core).
- **T3** trusted off-chain indexer OR event-log-only (prunable under EIP-4444) — **must not be a core path; every T3 is an explicit James-signed defer.**

---

## Master table

| # | Capability | v1 (file:line) | v1 tier | v2 (doc§) | v2 tier | Core? | Regression? |
|---|---|---|---|---|---|---|---|
| 1 | Path resolve `/a/b/c → object` | `resolvePath` EFSIndexer.sol:523 (`_nameToAnchor[p][name][0]`), `resolveAnchor` :527 | T1 | offline `anchorId = keccak(DOMAIN_ANCHOR, parentId, keccak(name), kindTag)` deterministic-ids §1:73 / read-lens P10; existence `getObject(id)`, placement `getSlot(slotId)` codex-kernel Read-ABI; `_nameToAnchor` replaced native-kernel:263 | **T1** (stronger) | yes | **NO — improved** |
| 2a | Directory listing, **lens-scoped** ("folder for lens L") | `getChildrenByAttester` EFSIndexer.sol:545 over `_childrenByAttester` :176 | T1 | `childrenByAuthor[tagId][author][]` KEPT kernel state native-kernel:248,473; paged read = redeployable view codex-kernel:47, native-kernel:51 | **T2** (T1 via view) | yes | **NO** |
| 2b | Directory listing, **cross-author** ("everything placed here") | `getChildren` EFSIndexer.sol:531 over `_children` :167; `getChildrenByAddressList` :851 | T1 | `discover(tagId)` read-lens §7.1 = codex-kernel **amendment 9 / P12** (pending James); tagChildren survival = freeze-reservations **E10 CONFIRM**; fallback = indexer-lane read-lens §7.3 | **T1 if P12/E10 land, else T3** | yes (composability + "show all") | **RISK — flag** |
| 3 | Containment "is X under /pizza" | `getParent` EFSIndexer.sol:1201 O(1) over `_parents` :173 (walk to root, MAX_DEPTH=32); lens `containsAttestations` :915 over `_containsAttestations` :226 (`_propagateContains` :347) | T1 | TagTree **parent ptr** native-kernel:41,242; parent-walk at read/view codex-kernel amendment 12; `containsBy[tagId][author]` KEPT native-kernel:248 | **T1** (bounded walk) / T2 | yes | **NO** (but freeze-sensitive: E10 CONFIRM) |
| 4a | Move/rename follow (`movedTo`) | none in v1 (v2 addition) | — | `movedTo` PIN at folder node fs-synthesis:48; follow-policy read-lens §4.3; the PIN slot is on-chain (`getSlot` point read T1/T2); follow logic client/view; budget `MAX_AUTO_FOLLOWS=8` §4.3 | **T2** (slot T1/T2) | yes | **NO** (new) |
| 4b | Symlink follow | `symlink` kind 2, AliasResolver.sol:25; "read-time multi-hop resolution is client/spec" :33; reverse fan-in NOT indexed :38 | T2 (client follow over on-chain edge) | `symlink` PIN auto-follow fs-synthesis:50; read-lens §4.3; slot = `getSlot` T1/T2 | **T2** | yes | **NO** (parity) |
| 4c | Cross-container mount / union | none in v1 | — | union = `efs.fs/union` convention ("mount is a lens", first-attester-wins = Plan-9 union) fs-synthesis:50; freeze-reservations H | **T2** (lens composition) | yes | **NO** (new) |
| 5 | Version history "prior versions of this slot" | PIN supersession O(1) `_activeBySlot` EdgeResolver.sol:231; **prior pointer `supersededPinUID` is EVENT-only** PinSet event :96-102; `supersededBy` REDIRECT writes no reverse state | current T1; **prior chain T3 (event-only)** | `getSlot` returns **supersessionCount + priorClaimId** stored O(1) words codex-kernel Read-ABI/P8; full chain via spine `allClaims` native-kernel §4.2; ADR-0051 | current **T1**; 1-hop prior **T1**; full chain **T2** | yes | **NO — v2 fixes a latent v1 T3** |
| 6 | Dir snapshot / restore (per-lens as-of / basis) | none in v1 | — | RE-HOMED per-lens fs-synthesis:47; **basis** = vector of per-author `checkpoint` reserved-KEY claims under a named lens; checkpoint = ordinary PIN VAL(throughSeq, stateRoot) read-lens §5.2/P7; recency-beacon D5; view-params C8 | **T2** (checkpoints on-chain state; as-of read client/view) | yes | **NO** (new); P7 pending James |
| 7a | Hardlink resolve (forward: name → DATA) | placement PIN → DATA (T1 point read); "many PINs → one DATA" | T1 | placement `getSlot` → dataId; fs-synthesis:49 NATIVE (better) | **T1** | yes | **NO** |
| 7b | Hardlink reverse (enumerate all names for a DATA) | `getReferencingAttestations(data, PIN)` EFSIndexer.sol:740 over `_referencingAttestations` :203; `getAllReferencing` :791 | T1 | target-keyed backlink = **B3 `discoverByTarget`** freeze-reservations B3 / onchain-graph-queries §0 (REQUIRED but currently demoted to event-derived unless B3 lands) | **T1 if B3 lands, else T3** | yes | **RIDES the already-found backlink regression** |

---

## Detailed rulings

### 1. Path resolution — T1, improved, no regression
v1 needed a 3-level storage mapping `_nameToAnchor[parent][name][schema]` (EFSIndexer.sol:523-528). v2 makes the child id a **pure offline keccak** of `(DOMAIN_ANCHOR, parentId, keccak(name), kindTag)` (deterministic-ids §1:73; read-lens P10). A smart contract resolves a path by computing the id inline and doing one `getObject`/`getSlot` point read per segment — **more composable than v1**, not less. `_nameToAnchor` is explicitly deleted as redundant (native-kernel:263). Path-segment grammar is frozen (freeze-reservations **E4**, ceremony-blocking; `MAX_NAME_BYTES=255`). No regression.

### 2. Directory listing — split verdict
- **Lens-scoped (2a):** the doctrinal read. v1 `_childrenByAttester` ports to v2 `childrenByAuthor[tagId][author][]` as KEPT kernel state (native-kernel:248, LoC row :473 "tree, contains/childrenByAuthor"). On-chain state; paginated enumeration is a redeployable view over that state (kernel-minimality, native-kernel:51). **T2, acceptable, no regression.**
- **Cross-author (2b):** the RISK. v1 `getChildren` over `_children` (EFSIndexer.sol:531/:167) answered "everything anyone placed under this folder" **on-chain, T1**. v2 routes cross-author enumeration to `discover(tagId)` — the container-scoped discovery index (codex-kernel **amendment 9**, read-lens §7.1) — which is **pending James (P12)**; and the tree-side `tagChildren` survival through the amendment-2 re-cut is only a **CONFIRM** item (freeze-reservations **E10**). If neither is ratified, cross-author listing degrades to the **indexer-lane** (read-lens §7.3) = **T3**. This is a genuine on-chain→(maybe)-off-chain demotion for a basic FS read a composing contract needs. **FLAG.** (Line drawn honestly: *bounded* per-container enumeration is core; only *unbounded/ranked* listing is legitimately off-chain.)

### 3. Containment — T1, no regression, freeze-sensitive
v1 `getParent` (EFSIndexer.sol:1201) is O(1) over a stored `_parents` pointer; walk to root is bounded by `MAX_ANCHOR_DEPTH=32`. v2 keeps the **parent pointer in TagTree** (native-kernel:41 "parent ptr + children (path walk)", :242 "ports `_parents`") and derives folder visibility from the kernel parent-walk (codex-kernel amendment 12); lens-scoped `_containsAttestations` ports to `containsBy[tagId][author]` (native-kernel:248). Bounded parent-walk is contract-answerable → **T1** (T2 client). No regression — **but** the parent-ptr/child-tree survival is a **CONFIRM**, not yet ratified (E10). If amendment-2's re-cut drops the stored parent ptr in favor of reading the ANCHOR body for parentId, containment stays T2 (body-in-state) but a naive contract loses the O(1) parent hop. Reserve it.

### 4. Move / symlink / mount follow — T2, parity or new, no regression
The redirect edges themselves (`movedTo` PIN, `symlink` PIN) are on-chain slots resolved by `getSlot` point reads (T1/T2). The **auto-follow chain resolution** is client/view (read-lens §4.3, `MAX_AUTO_FOLLOWS=8`, cycle-detected). This matches v1 exactly: AliasResolver did **zero** read-time resolution (AliasResolver.sol:33) — follow was always client-side. So v2 is parity (symlink) or net-new (movedTo, union mount). **T2 is acceptable** because the bounded (≤8) follow is a pure function of on-chain slot state; a view contract *could* make it T1 if composability later demands. Freeze-sensitive: **E1** (movedTo follow-policy vectors — ceremony-blocking, "as-written vectors bake in broken lazy moves"), **E2** (symlink/movedTo cross-container `targetKind` — CONFIRM), **E3** (per-segment budget). Cross-container grafting "dies in a table cell" if E2 is not confirmed — flag E2.

### 5. Version history — T1/T2, v2 FIXES a latent v1 T3
This is the mirror-image of the backlink story: here **v2 improves on v1**. v1's active PIN is T1 (`_activeBySlot`), but the **prior-version pointer lives only in the `PinSet` event** (`supersededPinUID`, EdgeResolver.sol:96-102) and the `supersededBy` REDIRECT writes no reverse state — so v1's *prior-version chain* was **event-derived (T3)** on a 100-year archive. v2's `getSlot` returns **`priorClaimId` + `supersessionCount` as stored O(1) words** (codex-kernel Read-ABI, P8), and the full ordered chain is reconstructible from the enumeration **spine** (`allClaims`, native-kernel §4.2) — **T1 one-hop, T2 full chain**. fs-synthesis:46 rules Versioning NATIVE. No regression; note the improvement.

### 6. Directory snapshot / restore — T2, new capability
v1 had none. v2 RE-HOMES it per-lens (fs-synthesis:47): a **basis** = the vector of per-author `checkpoint` reserved-KEY claims under a named lens. A checkpoint is an ordinary PIN carrying `(throughSeq, stateRoot)` (read-lens §5.2), so the checkpoints are **on-chain state (T2 point reads)**; the as-of/restore reconstruction is client/view over spine + checkpoints (inherently reader-side — acceptable T2). Freeze: **P7** (checkpoint reserved-key activation) is pending James (read-lens §0; codex-kernel amendment 10 "activation pending freeze-gates A1"); **D5** recency-beacon word must land before checkpoint vectors freeze. Not core-broken, but the whole capability is void if P7 is refused.

### 7. Hardlink resolution
- **Forward (7a):** name→DATA via placement PIN slot, T1 point read; "many PINs → one DATA, no refcount-GC" (fs-synthesis:49). No regression.
- **Reverse (7b):** "which names/paths point at this DATA" = target-keyed backlink over PIN→DATA edges. v1 answered it on-chain via `getReferencingAttestations`/`getAllReferencing` (EFSIndexer.sol:740/:791, T1). v2 makes it **B3 `discoverByTarget`** — REQUIRED per onchain-graph-queries §0 but **currently demoted to event-derived** until B3 is reserved. **This rides the already-found backlink regression** (do not re-litigate); I record it here only to note that *reverse hardlink enumeration is one of the concrete FS reads that regression breaks.*

---

## What is legitimately T3 (line drawn honestly)
- **Unbounded / ranked / multi-tag-AND / NOT-OR directory queries** — fs-synthesis:54 "unbounded/ranked/NOT/OR = The Graph." Legitimately off-chain; **needs an explicit James defer entry, not silent inheritance.**
- **Subtree accounting / quotas** — fs-synthesis:53 "subtree accounting = indexer job." Legitimately T3 (analytics), **explicit defer.**
- **Cross-chain / cross-venue global listing** — discovery is venue-relative by construction (read-lens §7.1); "all claims anywhere" is not a T1/T2 target. Legitimately T3.

---

## Freeze-sensitive items this lane depends on (reserve before ceremony)
1. **E10 (CONFIRM)** — tagParent/tagChildren + per-author KEEP-set survival through amendment-2. Backs items 2a/2b/3. If tagChildren is dropped, cross-author listing (2b) falls to T3.
2. **P12 / codex-kernel amendment 9 (pending James)** — container-scoped cross-author discovery index. Makes 2b (and comment/discovery reads) T1 instead of indexer-lane T3.
3. **B3 (NEEDS-JAMES shape/trim only)** — target-keyed backlink; makes reverse-hardlink (7b) T1. Already REQUIRED per onchain-graph-queries §0.
4. **P7 + D5 (pending James)** — checkpoint reserved-key row + recency beacon. Whole snapshot/restore capability (item 6) void without it.
5. **E1 (ceremony-blocking) + E2 (CONFIRM) + E3** — movedTo/symlink follow-policy vectors, cross-container targetKind, per-segment budget. Back item 4.
6. **E4 (ceremony-blocking)** — path-segment grammar + MAX_NAME_BYTES=255. Backs item 1.

## Composability note (does a contract need T1?)
- Path-resolve (1): **yes, and v2 delivers** — inline keccak + point read.
- Containment (3): **yes** — bounded parent-ptr walk is T1 via view; keep the parent ptr (E10).
- Cross-author listing (2b): **yes for a contract that lists a folder** — this is the one place composability *forces* an on-chain index (P12), and it is not yet ratified. Strongest lane argument for landing P12.
- Move/mount/history/snapshot (4/5/6): **client/view T2 is acceptable** — the underlying slots/checkpoints are on-chain state; bounded follows can be promoted to a T1 view later without freeze cost.
