# EFS v2 on-chain-completeness audit — LANE: the corrected keep/demote line (is-it-core, not gas)

**Auditor key:** keep-demote-line
**Date:** 2026-07-10
**Mission constraint (James, 2026-07-10):** ALL CORE FUNCTIONALITY MUST WORK ON-CHAIN. No dependency on The Graph or any trusted off-chain indexer for CORE queries. Every off-chain deferral EXPLICIT + James-signed-off.
**This lane owns:** the definitive corrected keep/demote table — every on-chain index declared in v1 (EFSIndexer.sol + EdgeResolver.sol + ListEntryResolver.sol + AliasResolver.sol) re-audited against *is-it-core* rather than *gas*, with corrected tier and freeze-sensitive storage cost.

---

## 0. The single most important finding of this lane (read first)

The v2 keep/demote line (deterministic-ids §12, ported **verbatim** to native-kernel §4.4, corpus line 251) demotes four v1 on-chain indices to "event-derived, labeled-untrusted discovery": `_sentAttestations`, `_receivedAttestations`, global `_schemaAttestations`, `_allReferencing`.

**The word "event-derived" in that line is misleading and nearly caused a false Tier-3 verdict.** The saving grace is a *different* v2 ruling — **native-kernel line 216**: *"full bodies live in state, not only in events … do not take [body elision] at freeze."* Because every claim's full payload is in Etched state (the claim-store), a **state-walk replay reconstructs any demoted index locally, with no trusted third party, and it survives EIP-4444 pruning.** So the demoted indices are **Tier 2-recoverable-by-unbounded-replay**, NOT Tier 3-event-only.

This splits the demoted set cleanly along the CORE vs ANALYTICS line the mission demands:

- **A demoted index whose query is a BASIC graph op** (single reverse lookup) is still a **regression**, because the *only* on-chain answer is "replay the entire chain" — no bounded contract read, no bounded client read. Basic reverse lookup must be **bounded** (Tier 1/2 with a real index), and unbounded-replay does not satisfy it. → `_allReferencing`, `_receivedAttestations`.
- **A demoted index whose query is ANALYTICS** (unbounded authorship/schema enumeration) is **legitimately Tier 3-as-a-bounded-query**, and because it is *also* Tier-2-recoverable-by-replay the 100-year archive never loses it. → `_sentAttestations`, global `_schemaAttestations`.

**Load-bearing coupling to flag at the ceremony:** the keep/demote line's durability legitimacy is 100% contingent on native-kernel line 216 (full bodies in state, no elision at freeze). If the deferred body-elision perf lever is ever taken, every demoted index becomes truly Tier-3 event-only and the archive silently loses authorship/schema enumeration forever. **"No body elision at freeze" must be an Etched invariant, not a deferred-perf footnote, precisely because it is what keeps the demotions honest.**

---

## 1. Full v1 index enumeration (every declaration, file:line) → corrected tier

All paths: `/Users/james/Code/EFS/contracts/packages/hardhat/contracts/`.
Legend for **v2 fate**: KEPT = named in the deterministic-ids §12 / native-kernel §4.4 keep list · DEMOTED = named in the demote list (event-derived) · REGISTRY = folded into the object registry (deterministic-ids §4) · KERNEL = kept as active-edge/spine kernel state under a renamed shape · NOT-CARRIED = dropped · GAP = never existed on-chain in v1 (reopened by §0).

### 1a. EFSIndexer.sol

| # | v1 index (decl) | Read fn | Query it answers | v1 tier | v2 fate | CORE or ANALYTICS | **Corrected tier (mission)** |
|---|---|---|---|---|---|---|---|
| I1 | `dataByContentKey` :151 | `getDataByContentKey` | "is there a DATA for content-key K" (dedup) | T1/2 | NOT-CARRIED ("stays dead", nk:251) | ANALYTICS (dedup convenience; ADR-0049 already made dedup best-effort client-side) | **T3 legit** — client-side contentHash-PROPERTY query; no regression given ADR-0049 |
| I2 | `_isRevoked` :154 | `isRevoked` | "is claim X revoked" | T1/2 | KEPT (revocation G-set, B2 `revokedAt`) | CORE | **T1** ✓ |
| I3 | `_indexed` :157 | — | internal dedup guard | — | internal | — | n/a |
| I4 | `_nameToAnchor` :164 | `resolveAnchor`/`resolveAnchorBySchema` :524/:528 | "resolve name under parent → anchor" (path resolve) | T1/2 | REGISTRY (`getObject(anchorId)`, O(1); client computes anchorId) | CORE | **T1** ✓ (deterministic-ids §4 — *stronger* than v1) |
| I5 | `_children` :167 | `getChildren` :538 | "list children of folder" (forward containment) | T1/2 | KEPT (path tree; `discover(tagId)` forward index, codex-kernel amend 9) | CORE | **T1/2** ✓ |
| I6 | `_childrenBySchema` :170 | `getChildrenBySchema` :613 | "children of folder of kind S" | T1/2 | KEPT (path tree + kind) | CORE | **T1/2** ✓ |
| I7 | `_parents` :173 | `getParent` :1201 | "X's parent" O(1) (containment up-walk) | T1/2 | KEPT (path tree) | CORE | **T1** ✓ |
| I8 | `_childrenByAttester` :176 | `getChildrenByAttester` :553 | "folder's children in author A's lens" | T1/2 | KEPT (`childrenByAuthor[tagId][author]`, nk:248) | CORE | **T1/2** ✓ |
| I9 | `_childInChildrenByAttester` :184 | — | internal dedup set for I8 | — | internal | — | n/a |
| I10 | `_schemaAttestations` :191 | `getAttestationsBySchema` :708 | "every attestation under schema S" (global) | T1/2 | **DEMOTED** | **ANALYTICS** (unbounded global enumeration) | **T3 legit-defer w/ sign-off** — Tier-2-recoverable by state-walk replay; not graph traversal |
| I11 | `_sentAttestations` :194 | `getOutgoingAttestations` :774 | "author A's attestations of schema S" | T1/2 | **DEMOTED** | **ANALYTICS** (enumeration-by-author, not traversal) | **T3 legit-defer w/ sign-off** — Tier-2-recoverable by replay; see §2 caveat |
| I12 | `_schemaAttesterAttestations` :197 | `getAttestationsBySchemaAndAttester` :715 | "author A's attestations of schema S" (schema+attester) | T1/2 | DEMOTED (rides I11 family; not in keep list) | ANALYTICS | **T3 legit-defer w/ sign-off** |
| I13 | `_receivedAttestations` :200 | `getIncomingAttestations` :762 | **"which records name address R as recipient"** (address-target backlink) | T1/2 | **DEMOTED** | **CORE** (basic single reverse lookup, address-keyed) | **⚠ REGRESSION → must be T1/2.** Falls out of B3 iff address-shaped (`TARGETKIND_ADDRESS`) targets are admitted to the postings |
| I14 | `_referencingAttestations` :203 | `getReferencingAttestations` :740 | "records of schema S pointing at X" (schema-scoped backlink) | T1/2 | DEMOTED (part of `_allReferencing` family; schema filter) | **CORE** (bounded reverse lookup) | **⚠ REGRESSION → T1/2** via B3 + schema filter over postings |
| I15 | `_referencingSchemas` :206 | `getReferencingSchemas` :893 | "which schema types reference X" | T1/2 | NOT explicitly carried | CORE-adjacent (small bounded projection of the backlink set) | **T1/2** — derivable as a projection of the B3 postings (author\|spineIdx→schema); confirm it is exposed |
| I16 | `_hasReferencingSchema` :208 | — | internal dedup for I15 | — | internal | — | n/a |
| I17 | `_allReferencing` :215 | `getAllReferencing` :791, count :899 | **"ALL records pointing at X"** (general backlink, any author/schema) | T1/2 | **DEMOTED** | **CORE** (the canonical basic reverse lookup) | **⚠ REGRESSION (already found by prior audit) → T1/2 REQUIRED.** Restored by B3 `discoverByTarget` (freeze-reservations B3, now REQUIRED) |
| I18 | `_referencingByAttester` :216 | `getReferencingByAttester` :801 | "author A's records pointing at X" (author-scoped backlink) | T1/2 | **KEPT** (`referencingByAuthor[targetId][author]`, nk:248) | CORE | **T1/2** ✓ — but author-scoped: you must already know the author (see §3 note) |
| I19 | `_referencingBySchemaAndAttester` :217 | `getReferencingBySchemaAndAttester` :813 | "author A's records of schema S pointing at X" | T1/2 | KEPT (rides I18) | CORE | **T1/2** ✓ |
| I20 | `_containsAttestations` :226 | `containsAttestations` :915 | "has author A ever contributed under folder X" O(1) | T1/2 | KEPT (`containsBy[tagId][author]`, nk:248) | CORE (lens folder visibility) | **T1** ✓ |
| I21 | `_containsSchemaAttestations` :227 | `containsSchemaAttestations` :919 | schema-scoped variant of I20 | T1/2 | KEPT (rides I20) | CORE | **T1/2** ✓ |
| I22 | `_anchorSchemaOf` :231 | internal | anchor's declaring schema (kind) | T1/2 | REGISTRY (kind derivable from registry entry, det-ids §4) | CORE | **T1** ✓ |

### 1b. EdgeResolver.sol

| # | v1 index (decl) | Read fn | Query it answers | v1 tier | v2 fate | CORE or ANALYTICS | **Corrected tier** |
|---|---|---|---|---|---|---|---|
| E1 | `_activeEdge` :191 | (slot read) | "active PIN target at slot" (file placement) — the single hottest read in EFS | T1 | KEPT (active edges; det slotId) | CORE | **T1** ✓ |
| E2 | `_activeCount` :198 | `hasActiveEdge` :745 | "is anyone actively edging X under D" O(1) | T1 | KEPT (active edges) | CORE | **T1** ✓ |
| E3 | `_edgeDefinitions[targetID]` :202 | `getEdgeDefinitions` :795 | **"which predicates target X"** (reverse-by-predicate) | T1/2 | not explicitly carried | **CORE** (bounded backlink-by-predicate) | **T1/2** — must be a projection of B3 postings, or restored; onchain-graph-queries §4.2 REQUIRES it |
| E4 | `_hasEdgeDef` :203 | — | internal dedup for E3 | — | internal | — | n/a |
| E5 | `_targetsByDef` :206 | `getTargetsByDefinition` :808 | **"which targets under predicate D"** (forward-by-predicate enumeration) | T1/2 | not explicitly carried | **CORE** (bounded graph traversal by predicate) | **T1/2** — onchain-graph-queries §4.2 REQUIRES it; confirm carried |
| E6 | `_hasTargetForDef` :207 | — | internal dedup for E5 | — | internal | — | n/a |
| E7 | `_childrenWithEdge` :211 | `getChildrenWithEdge` :824 | "children of parent P carrying edge-def D" | T1/2 | KEPT-adjacent (path tree ∩ active edges) | CORE (bounded) | **T1/2** ✓ (confirm) |
| E8 | `_isChildWithEdge` :212 | — | internal dedup for E7 | — | internal | — | n/a |
| E9 | `_activeTotalByDefAndAttester` :218 | (contains-clear machinery) | count of active edges by def+attester (drives `_containsAttestations` clearing) | T1 | KEPT (active-edge machinery) | CORE (internal to lens correctness) | **T1** ✓ |
| E10 | `_activeBySlot` :231 | (PIN O(1) singleton) | cardinality-1 PIN slot read | T1 | KEPT (active edges; slotId det-ids §1) | CORE | **T1** ✓ |
| E11 | `_activeByAAS` :246 | (TAG active entries) | cardinality-N TAG entries at (attester,def,target) (folder visibility, labels) | T1/2 | KEPT (active edges) | CORE | **T1/2** ✓ |
| E12 | `_activeByAASIndex` :252 | — | internal swap-and-pop index for E11 | — | internal | — | n/a |

### 1c. ListEntryResolver.sol

| # | v1 index (decl) | Read fn | Query it answers | v1 tier | v2 fate | CORE or ANALYTICS | **Corrected tier** |
|---|---|---|---|---|---|---|---|
| L1 | `_entries[listUID][attester]` :164 | `getEntries` / count :325 | **"what is in list L (author A's lens)"** (forward membership enumeration) | T1/2 | KEPT (LIST is a core graph primitive; per-attester lens) | CORE | **T1/2** ✓ |
| L2 | `[listUID][identityKey][attester]→pos` :167 | `countOf` | **"is member X in list L (author A)"** O(1) membership test | T1 | KEPT | CORE | **T1** ✓ |
| L3 | `_entryPosPlusOne[entryUID]` :171 | — | internal swap-and-pop position | — | internal | — | n/a |
| L4 | `_listAttesters[listUID]` :178 | list-attesters read | "which authors contributed to list L" (bounded enumeration) | T1/2 | KEPT-adjacent | CORE-adjacent | **T1/2** ✓ (confirm carried) |
| L5 | `_isListAttester` :179 | — | internal dedup for L4 | — | internal | — | n/a |

### 1d. AliasResolver.sol (REDIRECT)

| # | v1 state | Query it answers | v1 tier | v2 fate | CORE or ANALYTICS | **Corrected tier** |
|---|---|---|---|---|---|---|
| A1 | **writes ZERO state** (AliasResolver.sol:38: "Reverse fan-in … intentionally NOT indexed on-chain … off-chain indexer / future advisory index") | "which REDIRECTs point at X" (cited-by / version-history back-edge) | **T3 in v1** (off-chain even in v1) | GAP | **CORE** ("what supersedes/points-here" is a basic reverse lookup; also the substrate of version-history enumeration) | **⚠ NOW-OR-NEVER → T1/2 REQUIRED.** Route REDIRECT `targetId` into the B3 postings; the :38 punt is superseded by §0 |

### 1e. The two GAP queries (off-chain even in v1 — reopened by §0, freeze-sensitive)

| # | Query | v1 | v2 required shape | Corrected tier |
|---|---|---|---|---|
| G1 | **"which LISTs contain member X"** (reverse membership) | GAP — only forward `list→members` (L1); LIST_ENTRY forbids refUID so entries never entered `_allReferencing` either | new `member → lists[]` (or `target → list_entries[]`) postings, one word per LIST_ENTRY | **T1/2 REQUIRED (recommend)** — "what collections is this in" is a basic query; **freeze-sensitive kernel storage, now-or-never** |
| G2 | **"cited-by / which REDIRECTs point at X"** | GAP (= A1) | REDIRECT targets routed into B3 postings | **T1/2 REQUIRED** — see A1 |

---

## 2. Caveat on I11/I12/I10 (authorship & schema enumeration) — why Tier-3 here is legitimate, and the one condition

`_sentAttestations` / `_schemaAttesterAttestations` / global `_schemaAttestations` answer *enumeration* ("list everything author A did" / "list everything under schema S"), **not graph traversal**. Enumeration is on the ANALYTICS side of the mission line, so a bounded on-chain index is not required and Tier-3-as-a-bounded-query is a legitimate defer **with James sign-off**.

Two conditions make this defer honest, and both must hold:
1. **native-kernel line 216 holds at freeze** (full claim bodies in state, no body elision). This makes authorship/schema enumeration **Tier-2-recoverable** by state-walk replay — the archive never loses it. If elision is taken, these become truly Tier-3 event-only. → this is the coupling in §0.
2. **The venue spine is on-chain state, not events.** native-kernel line 251 is explicit: the spine is *ordered-by-admission, carries NO per-target/per-author keying, and is never a read index.* So the spine does **not** cheaply serve "author A's claims" — that answer comes from replaying claim-store bodies. This is a **durability-lane cross-check**: confirm the claim-store (bodies-in-state) is the reconstruction spine and that it is complete per-author. If the durability lane finds the per-author reconstruction path is event-only, escalate I11/I12 from "legit T3 defer" to a second regression.

**Recommendation:** these three are the *correct* things to leave off the bounded on-chain surface — but the sign-off entry must name condition (1) as an Etched invariant.

---

## 3. Note on I18 (`referencingByAuthor` KEPT) vs I17 (`_allReferencing` DEMOTED) — why the kept one does not cover the gap

The v2 keep list retained the **author-scoped** reverse read `referencingByAuthor[targetId][author]` (I18) and demoted the **general** `_allReferencing` (I17). These are not substitutes: I18 requires you to *already know the referencing author* before you can ask "does A point at X." The actual core query — "who, anyone, points at X" — is I17, and it is the one that got demoted. Author-scoping is a fast-path lens read to *add alongside* the general index (onchain-graph-queries §4), never a replacement for it. This is the crux of why the kept/demoted split looked reasonable on a gas basis (author-scoped postings are cheaper) but fails on an is-it-core basis.

---

## 4. THE CORRECTED KEEP/DEMOTE LINE (this lane's definitive deliverable)

### 4a. MUST be on-chain STATE (Tier 1/2) — the corrected keep set

**Already kept in v2 (confirm at freeze):** path tree (I4→registry, I5, I6, I7, I8, I22), active edges (E1, E2, E9, E10, E11), author-scoped backlink (I18, I19), contains/lens (I20, I21), revocation (I2), forward list membership + O(1) membership test (L1, L2, L4), children-with-edge (E7).

**Must MOVE from demoted/gap → kept (the corrections):**
- **I17 `_allReferencing` — general backlink** → B3 `discoverByTarget`, REF-targets required. *(Regression already found by prior audit; this lane confirms + extends.)*
- **I13 `_receivedAttestations` — address-target backlink** → B3 must admit `TARGETKIND_ADDRESS` targets. *(New regression confirmed this lane.)*
- **I14 `_referencingAttestations` — schema-scoped backlink** → B3 + schema filter over postings.
- **I15 / E3 — "which schemas / which predicates reference X"** → projection of B3 postings; confirm exposed.
- **E5 `_targetsByDef` — "targets under predicate D"** → confirm carried (bounded forward-by-predicate).
- **A1 / G2 — REDIRECT cited-by** → route REDIRECT `targetId` into B3 postings.
- **G1 — LIST reverse membership** → new `member → lists[]` postings.

### 4b. MAY legitimately be Tier 3 (off-chain / unbounded), each requiring an EXPLICIT James sign-off entry

| Item | Query | Why legitimately T3 | Sign-off condition |
|---|---|---|---|
| I11/I12 `_sentAttestations`, `_schemaAttesterAttestations` | authorship enumeration | enumeration, not traversal; Tier-2-recoverable by replay | **only if** no-body-elision (nk:216) is Etched + spine completeness confirmed (§2) |
| I10 global `_schemaAttestations` | all attestations under schema S (global) | unbounded global enumeration; Tier-2-recoverable | same as above |
| I1 `dataByContentKey` | content-dedup lookup | ADR-0049 already made dedup best-effort client-side (contentHash PROPERTY query); no on-chain identity=content | already ruled off-chain pre-§0; confirm no regression vs v1 intent |
| — | unbounded/ranked/NOT-OR/full-text/multi-tag-AND(>3)/aggregate counts | EFS ships no query language by design; these are analytics | fs-pass-synthesis "Multi-tag AND → The Graph" row — legitimate, but must be an explicit line, not silent inheritance |
| VAL-target backlinks ("who interned this value") | reverse over PROPERTY values | niche; the one remaining trim in freeze-reservations B3 | James rules REF-required / VAL-optional |

---

## 5. Freeze-sensitive storage cost of each correction (the "reserve before ceremony" bill)

All ride the **B3/B4 postings word**: `author(160) | spineIdx(64) | flags(32)` (freeze-reservations B4, ERC-7201). The reservation must be committed pre-freeze — kernel state cannot be added to immutable state after the ceremony (freeze-reservations §7; the reserve-selector-as-floor clause only preserves the *ability* to add a redeployable **view**, never on-chain kernel state).

| Correction | Marginal freeze-sensitive storage | Now-or-never? |
|---|---|---|
| I17 general backlink (REF-targets) | 1 postings word per referencing claim (PIN/TAG/MIRROR) | **YES** — the base reservation |
| I13 address-target backlink | postings for every PIN/TAG whose target is `TARGETKIND_ADDRESS` (extra writes on address-naming claims) | **YES** — must admit address-shaped targets into the same index at freeze |
| I14/I15/E3 schema/predicate projections | zero extra state if `flags`/schema derivable from the postings + claim body (bodies-in-state, nk:216); else a small side map | **YES** if a side map is needed |
| E5 targets-by-predicate | forward postings keyed by definitionId (mirror of B3, target side) | **YES** |
| A1/G2 REDIRECT cited-by | AliasResolver must WRITE postings on REDIRECT (v1 wrote zero state) — new kernel write path + storage | **YES** — new immutable write path |
| G1 LIST reverse membership | 1 postings word per LIST_ENTRY (`member→lists[]`) | **YES** — new immutable index |

**Interaction cost note:** admitting address-targets (I13), REDIRECT-targets (G2), and list-membership (G1) into the postings roughly determines the reverse-index write amplification for the *entire* claim surface — this is the number the gas snapshot (freeze-gates B) must price as ONE bundle before the P1 kernel-state sign-off, per freeze-reservations §G.

---

## 6. Cross-lane checks

- **graph-queries lane:** agrees on I17 (regression, restored by B3). This lane *extends* it: I13 (address-target) is a **second** confirmed regression, and I14/I15/E3/E5 are core backlink-by-predicate/schema projections that must be explicitly confirmed-carried, not silently assumed. graph-queries §5 marked I13 as "NEEDS-JAMES (recommend restore)"; this lane rules it **CORE → required**, because a single reverse lookup on an address target is the same query shape as I17, not analytics.
- **durability lane:** the entire legitimacy of demoting I10/I11/I12 rests on native-kernel line 216 (no body elision) + spine completeness (nk:251). Durability lane must confirm the state-walk replay path is genuinely event-independent. If any demoted index's *reconstruction* (not just its convenience sync) touches the event log, it is Tier-3-event-only and the demotion is a silent off-chain dependency — escalate.
- **Sole disagreement to surface to James:** whether authorship/schema enumeration (I10/I11/I12) is truly "analytics" (this lane's ruling: yes, legit T3 defer) or whether "list everything I ever published" is a core archival read the 100-year mission owes a *bounded* answer to. This lane's position: bounded is not required, but Tier-2-recoverability (no elision) is — and that must be Etched.
