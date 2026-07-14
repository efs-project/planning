# EFS v2 — On-chain graph queries: what's required and verified

**Status:** draft — **regression finding + requirement**, verified against v1 code and v2 docs (2026-07-10)
**Target repos:** contracts, planning
**Depends on:** [[codex-kernel]], [[deterministic-ids]], [[fs-pass-freeze-reservations]], [[read-lens-spec]]
**Verification:** two independent expert audits, 2026-07-10 — v1 code audit (EFSIndexer.sol / EdgeResolver.sol / ListEntryResolver.sol / AliasResolver.sol, with file:line) and v2 design audit (the keep/demote line + the discovery/target indices). Findings below are quoted from those audits.
**Last touched:** 2026-07-10

#status/draft #kind/design #repo/contracts #repo/planning #topic/graph-queries

## 0. The constraint (ruled by James, 2026-07-10)

> **All core functionality must work on-chain. EFS must not depend on The Graph (or any off-chain indexer) for core graph queries. Basic graph functionality — "which records point here" — is a basic index and must work on-chain.**

This is a mission-level constraint, not a cost tradeoff. It re-classifies the reverse/backlink index from "optional, price it" to **required**, and forces a re-audit of every "demoted to event-derived" ruling: anything that is *core graph functionality* must be kept on-chain; only genuinely non-core enumeration may be off-chain.

## 1. The finding, in one paragraph

**v1 answered "which records point at X" purely on-chain; v2 as currently specced demoted the general form to off-chain — a regression that violates §0.** The fix (a target-keyed reverse index) is already sketched in the FS pass but was mis-filed as an optional, needs-James feature rather than a required capability. This doc records the verified baseline, the verified regression, the required query set, and the corrected classification.

## 2. Verified v1 baseline — what worked on-chain (with file:line)

All in `/Users/james/Code/EFS/contracts/packages/hardhat/contracts/`.

| Query | v1 index (decl) | Read fn | On-chain? |
|---|---|---|---|
| **"ALL records pointing at X"** (general backlink, any author, any schema) | `_allReferencing` (EFSIndexer.sol:215) | `getAllReferencing` :791, count :899 | **YES** — paginated, revoked-filtered |
| "Records of schema S pointing at X" | `_referencingAttestations` (:203) | `getReferencingAttestations` :740, count :758 | **YES** |
| "Author A's records pointing at X" | `_referencingByAttester` (:216) | `getReferencingByAttester` :801 | **YES** |
| "Which schema types reference X" | `_referencingSchemas` (:206) | `getReferencingSchemas` :893 | **YES** |
| "Records naming address R as recipient" (address-target backlink) | `_receivedAttestations` (:200) | `getIncomingAttestations` :762 | **YES** |
| "Which predicates target X" | `_edgeDefinitions[targetID]` (EdgeResolver.sol:202) | `getEdgeDefinitions` :795 | **YES** |
| "Which targets under predicate D" | `_targetsByDef` (:206) | `getTargetsByDefinition` :808 | **YES** |
| "Is anyone actively edging X under D" | `_activeCount` (:198) | `hasActiveEdge` :745 | **YES** — O(1) |
| "X's parent" | `_parents` (:173) | `getParent` :1201 | **YES** — O(1) |

**Off-chain even in v1** (not regressions, but reopened by §0):
- **"Which LISTs contain member X"** — no `member → lists[]` map; only forward `list → members` (`ListEntryResolver._entries`). LIST_ENTRY forbids `refUID`, so entries don't even enter `_allReferencing`.
- **"Cited-by / which REDIRECTs point at X"** — `AliasResolver.onAttest` writes zero state; explicit code note (AliasResolver.sol:38): *"reverse fan-in is intentionally NOT indexed on-chain … off-chain indexer / future advisory index (ADR-0050 §4)."*

## 3. Verified v2 current state — what was demoted

The keep/demote line (deterministic-ids §12, ported verbatim to native-kernel §4.4):
- **KEPT on-chain:** path tree, active edges, `referencingByAuthor[targetId][author]`, `containsBy`.
- **DEMOTED to event-derived (off-chain / indexer):** `_sentAttestations`, `_receivedAttestations`, global `_schemaAttestations`, **`_allReferencing`**.

**The regression:** the kept reverse read is `referencingByAuthor[targetId][author]` — **author-scoped**: you must already know *who* the referencing author is. The general "who — anyone — points at X?" (v1's `getAllReferencing`) is **demoted to off-chain.** The v2 forward discovery index `discover(tagId)` is **container-keyed** (what's *in* this container), not target-keyed (what points *at* this object) — a different index. The target-keyed reverse index (`discoverByTarget`, R1) is a **separate, un-ratified surface** (fs-pass-freeze-reservations B3, ⚖ NEEDS-JAMES), framed as new/optional, with the synthesis backlinks row reading *"NATIVE if the target index lands … else indexer-lane."*

**Verdict:** against §0, the general reverse/backlink query is the one core graph capability that, in the current pre-ratification design, sits off-chain. Regression confirmed.

## 4. Required on-chain graph queries (the spec §0 demands)

These MUST be answerable on-chain (single or bounded-paginated read, no indexer), matching or exceeding v1:

1. **Backlinks — "which records point at object X"** (any author, bounded-paginated, revoked-filtered). The core requirement. Restores v1 `getAllReferencing`.
2. **Backlinks by predicate — "which edges of type D target X"** and **"which targets under predicate D"** (v1 `getEdgeDefinitions` / `getTargetsByDefinition`).
3. **Address-target backlinks — "which records name address R"** (v1 `getIncomingAttestations`).
4. **Parent / containment** — already kept.
5. **Forward container enumeration** — `discover(tagId)`, already the primary path (codex-kernel amendment 9).

**Author-scoped fast path retained:** `referencingByAuthor[targetId][author]` stays as the O(1) lens-scoped read; the general index is *added alongside*, not instead.

## 5. Corrected classification (the reclassification §0 forces)

| Item | Old status | **New status** |
|---|---|---|
| **R1 `discoverByTarget` / general backlink index** (fs-pass-freeze-reservations B3) | ⚖ NEEDS-JAMES, "optional, ADD-with-trim" | **REQUIRED (core)** — James rules the *shape/trim*, not *whether* |
| `_allReferencing`-equivalent (cross-author backlink) | demoted to event-derived | **KEPT on-chain (required)** |
| Backlinks in the dispositions table | "NATIVE if the target index lands, else indexer-lane" | **NATIVE (required)** |
| REF-layout target backlinks | (trim option) | **REQUIRED** |
| VAL-layout target backlinks ("who interned this value") | (trim option) | **OPTIONAL** — the one remaining tunable; niche, may stay indexer-lane |
| Address-target backlinks (`_receivedAttestations`) | demoted | **NEEDS-JAMES** — v1 had it on-chain; core or not? (recommend restore) |
| Authorship enumeration (`_sentAttestations`, global `_schemaAttestations`) | demoted | **OK to keep off-chain** — these are enumeration-by-author, *not* graph traversal; genuinely non-core (confirm) |

## 6. Two genuinely-new decisions (off-chain even in v1)

§0 reopens the two reverse queries v1 also punted off-chain. Both are "which records point here" for their kinds:

- **"Which LISTs contain X" (reverse membership).** Requires a new `member → lists[]` (or `target → list_entries[]`) index. *This is freeze-sensitive kernel storage* — now-or-never. Recommend: **required** (LISTs are a core graph primitive; "what collections is this in" is a basic query), REF-targets only.
- **"Cited-by / which REDIRECTs point at X."** Requires REDIRECTs to register into the reverse index (v1's AliasResolver deliberately didn't). If the general backlink index (§4.1) keys on the REDIRECT's *target* field (not just `refUID`/source), cited-by falls out for free. Recommend: **required**, and route REDIRECT targets into the reverse index — the AliasResolver.sol:38 punt is superseded by §0.

## 7. Freeze-sensitivity — why this is urgent, not deferrable

The reverse index is **Etched kernel storage** (one postings word per referencing claim, per codex-kernel's ERC-7201 layout). Its shape must be committed **before the freeze** — it cannot be added to immutable kernel state afterward (the "reserve-selector-as-floor" clause only preserves the *ability* to add a redeployable view, not on-chain kernel state). So §0's requirement lands squarely on the freeze-sensitive surface: **the backlink index must be in the reserved set, as required, before the ceremony.** This also means the LIST-reverse and REDIRECT-cited-by rulings (§6) are now-or-never.

## 8. What changes in the other docs (threaded)

- **fs-pass-freeze-reservations B3:** status ⚖ NEEDS-JAMES → **REQUIRED**; James rules trim (REF-required / VAL-optional / address-target / list-reverse / redirect-cited-by), not whether.
- **deterministic-ids §12 / native-kernel §4.4 keep/demote line:** move the general backlink (`_allReferencing`-equivalent) from *demoted* to *kept*; re-audit `_receivedAttestations`.
- **fs-pass-synthesis dispositions table:** backlinks row → **NATIVE (required)**; the "Multi-tag AND → The Graph" and "subtree accounting → indexer job" rows must be re-checked against §0 (they may still be genuinely non-core — *unbounded/ranked* query is different from *basic reverse lookup* — but the line must be re-drawn deliberately, not inherited).
- **fs-pass-james-decisions #1:** the backlink half of the P1 kernel-state bundle is no longer "do we want it" — it's "required; price the shape."

## 9. Open questions (narrowed by §0)

- [ ] **James — trim shape only** (not whether): REF-target backlinks required ✓; VAL-target backlinks optional?; address-target backlinks restored on-chain?; LIST reverse-membership required?; REDIRECT cited-by via target-keying required?
- [ ] **Re-draw the on-chain/off-chain line for the whole query surface** against §0: which queries are *genuinely* non-core (recommend: unbounded/ranked/NOT-OR multi-predicate = still off-chain; *basic single reverse lookup + bounded intersection* = on-chain). This is the "what stays off-chain" ruling §0 demands be made explicitly.
- [ ] Gas cost of the reverse-index writes (rides the kernel-state gas snapshot) — informs trim, not whether.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] Keep/demote line re-audited against §0 across deterministic-ids / native-kernel / fs-pass docs
- [ ] Reverse-index storage shape in the reserved freeze set as REQUIRED
- [ ] At least one round of `#status/review` with another agent or human comment
