# EFS v2 on-chain-completeness audit — CONSOLIDATED CRITIC + SYNTHESIS

**Auditor key:** critic
**Date:** 2026-07-10
**Role:** Completeness critic + synthesizer over eight lane files (durability-spine, filesystem-ops, graph-queries, identity-content, keep-demote-line, read-resolution-lens, attack-onchain, attack-offchain) and the seed doc onchain-graph-queries.md.
**Mission constraint (James, 2026-07-10):** ALL CORE FUNCTIONALITY MUST WORK ON-CHAIN. No dependence on The Graph or any trusted off-chain indexer for core queries. Every off-chain deferral EXPLICIT + James-signed-off. "event-derived / log-only" = TIER 3 on a 100-year archive.

---

## 0. THE ONE STRUCTURAL CORRECTION THE WHOLE AUDIT TURNS ON (read first)

Both red teams independently hit the same wall, and it is the finding that reorganizes every lane's grades. **The word "Tier 2" was used across the six constructive lanes to mean three different things that must be split into three axes:**

- **AXIS A — DURABILITY:** do the bytes survive EIP-4444 log pruning (are they in on-chain STATE, not only event logs)? The full-body spine (`allClaims` array + `bodies` mapping, native-kernel §4.1/§4.2) makes the answer YES for the entire admitted-claim set. The durability lane proved this rigorously.
- **AXIS B — QUERYABILITY:** can a **bounded reader** (client doing a keyed lookup, not a full-history replay) get the answer without trusting a third party? This requires a **keyed on-chain index**, not just durable bytes. Spine-recoverability is *necessary but not sufficient* — reconstructing an answer by scanning every claim ever admitted (O(100-year global history)) is durability-safe but query-Tier-3: "run your own full-history scan" and "trust The Graph" differ only in trust, not in cost.
- **AXIS C — COMPOSABILITY:** can a **smart contract** compute the answer in bounded gas (Tier 1)? This is the mission's headline reason for on-chain data.

**The defect:** the durability lane's D-1 relabel ("all four demoted indices are Tier-2 spine-recoverable") is CORRECT on Axis A and was silently read as a pass on Axes B/C. The keep-demote lane's §0 ("unbounded-replay does NOT satisfy a basic reverse lookup — still a regression") is CORRECT on Axes B/C. **They do not actually conflict once the axes are split, and the resolution is: keep-demote §0 governs whether a capability is on-chain-COMPLETE; durability D-1 governs only whether the archive can eventually recover it.** For a core capability, Axis-A durability is table stakes and Axis-B queryability is the bar.

**The mechanical root cause (attack-onchain A1, verified):** the single index every "kept/restored" reverse query rides — the B4 postings word `author(160) | spineIdx(64) | flags(32)` (fs-pass-freeze-reservations B4, ADOPTED) — is **keyed by target but carries neither `definitionId` (the predicate) nor a live-revocation bit** (B5 revoke-echo was REJECTED, fs-pass-freeze-reservations:34). Consequences:

1. **Predicate-filtered reverse** ("which `supersededBy`/`mirrors`/`act` edges point at X") requires iterating EVERY posting at X and doing one `getClaim` body-SLOAD per posting to recover the predicate (native-kernel:206/:212) → **O(total-postings-at-X), independent of match count.** Blows block gas on any hot target. Composability-Tier-3 wearing a Tier-2 badge.
2. **Counts** are raw `.length` (v1 `getAllReferencingCount` EFSIndexer.sol:899 never revoked-filtered; v2 append-only, never decremented) → **attacker-inflatable** by spray-then-self-revoke; live count needs the unbounded scan.

**So "restore B3 / discoverByTarget" as currently specced does NOT by itself make the reverse graph composable.** The B4 word must be redesigned to carry `definitionId` (or a per-`(target, definitionId)` sub-index must be reserved), and the revocation-staleness of postings must be resolved, or the reverse index is Tier-2-durable-but-Tier-3-composable for exactly the predicate/count queries contracts most want. **This is the critic's central value-add and it is freeze-sensitive.**

---

## 1. THE CONSOLIDATED ON-CHAIN COMPLETENESS MATRIX

Tiers use the three-axis model: **T1** = contract-answerable bounded gas; **T2** = bounded keyed client read over state, no trusted party; **T2-replay** = recoverable ONLY by unbounded full-spine scan (durable but query-Tier-3); **T3** = trusted indexer / prunable-event-only. "✓" = on-chain-complete and confirmed; "⚠" = regression or freeze-blocked.

### 1a. Filesystem / content / identity (point reads — the strong core)

| # | Capability | v1 on-chain? (file:line) | v2 tier | Status | Ruling |
|---|---|---|---|---|---|
| P1 | Path/name resolve → anchor | YES (EFSIndexer `resolveAnchor` :524) | **T1** | ✓ stronger (registry `getObject`, det-ids §4) | KEEP |
| P2 | List children of folder (forward containment) | YES (`getChildren` :538) | **T1/2** | ✓ (`discover(tagId)` P12) | KEEP — but P12 PENDING JAMES (§ freeze) |
| P3 | Parent of X (O(1) up-walk) | YES (`getParent` :1201) | **T1** | ✓ | KEEP |
| P4 | Active PIN placement at slot (hottest read) | YES (`_activeEdge` EdgeResolver:191) | **T1** | ✓ | KEEP |
| P5 | `hasActiveEdge(X,D)` O(1) boolean | YES (`_activeCount` :198) | **T1** | ✓ | KEEP (the ONLY genuinely-T1 predicate-reverse) |
| P6 | web3:// byte serving + chunk store | YES (weaker) | **T1** | ✓ STRONGER (kernel-verifies chunks vs signed chunksRoot) | KEEP |
| P7 | contentHash/size/contentType/name reads | YES | **T1/2** | ✓ point reads, virtual reserved-key anchors | KEEP |
| P8 | is-claim-revoked | YES (`isRevoked` EFSFileView:87) | **T1** | ✓ | KEEP |
| P9 | Grade LIVE/REVOKED/STALE/SUPERSEDED | net-new | **T1** | ✓ (getSlot + expiresAt + supersessionCount) | KEEP |
| P10 | Current signing key gate, bare-EOA identity | YES | **T1** | ✓ ecrecover on identity word | KEEP |
| P11 | "is B a persona of A" (forward) | net-new | **T1/2** | ✓ read B's primary PIN slot | KEEP |
| P12 | encryptionKey publish for recipient | net-new | **T1/2** | ✓ PIN VAL point read | KEEP |
| P13 | Single deny-check "does d advise against X" (declared D) | net-new | **T1** | ✓ getSlot point read, no enum | KEEP |
| P14 | Single act-delegation "may A act for T, scope S" | net-new | **T1** | ✓ getSlot(T,actDef,A)+expiresAt | KEEP |
| P15 | Forward list membership + O(1) membership test | YES (ListEntryResolver :164/:167) | **T1/2** | ✓ | KEEP |
| P16 | Primary mirror for DATA X | YES | **T1/2** | ✓ O(1) PIN point read | KEEP |
| P17 | KEL "was key K valid at position P" (reserved/future) | net-new | **T1/2** designed | reserved read shape | KEEP the reservation |

**This block is the honest heart of the mission: every basic FS/identity/currency operation a contract is handed a key for is genuinely Tier 1.** The strength is real and matches or exceeds v1.

### 1b. Reverse / enumeration / count (the contested core — where the line is drawn)

| # | Capability | v1 on-chain? (file:line) | As-specced v2 | Correct tier | Status |
|---|---|---|---|---|---|
| R1 | **General backlink "who points at X"** (any author) | YES paginated revoked-filtered (`getAllReferencing` EFSIndexer:791, count :899) | event-derived / T2-replay | **must be T1/2** (bounded, keyed) | ⚠ REGRESSION → restore via B3, REQUIRED |
| R2 | **Predicate-filtered reverse "which D-edges point at X"** | YES (`getEdgeDefinitions` EdgeResolver:795; `getReferencingAttestations` :740) | T2-replay AND composability-T3 even with B3 | **must be T1/2** | ⚠ REGRESSION + B4-word-lacks-definitionId (A1) → needs postings redesign |
| R3 | **Address-target backlink "who names address R"** | YES (`getIncomingAttestations` :762) | event-derived | **must be T1/2** (same shape as R1) | ⚠ REGRESSION (keep-demote I13) → B3 must admit ADDRESS targets |
| R4 | **"targets under predicate D"** (forward-by-predicate) | YES (`getTargetsByDefinition` :808) | not explicitly carried | **must be T1/2** | ⚠ confirm carried (onchain-graph-queries §4.2) |
| R5 | **Which LISTs contain member X** (reverse membership) | GAP (off-chain even v1; LIST_ENTRY forbids refUID) | GAP | **T1/2 REQUIRED** | ⚠ NOW-OR-NEVER new index (G1) |
| R6 | **Cited-by / which REDIRECTs point at X** | GAP (AliasResolver:38 writes zero reverse state) | GAP | **T1/2 REQUIRED** | ⚠ NOW-OR-NEVER new immutable write path (G2) |
| R7 | **Best-of-N multi-transport mirror ranking** | YES on-chain in the contract serving ERC-5219 (`EFSRouter._getBestMirrorURI` :1065, transport priority :1106) | off-chain "enumerate TAGs or fail" (read-lens:261) | **must be T1/2** — the mirror-TAGs are ALREADY kept (referencingByAuthor) so a view can rank at ZERO new state cost | ⚠ REGRESSION → restore on-chain best-mirror view |
| R8 | **Enumerate my own claims "ls ~" / self-restore** | YES paginated bounded (`getOutgoingAttestations` EFSIndexer:774) | DEMOTED, filed as "analytics" | **T2 author-keyed REQUIRED, or explicit signed defer** | ⚠ MIS-FILED — this is account-recovery, not analytics (see §5 disagreement) |
| R9 | Author-scoped backlink "does A point at X" | YES (`getReferencingByAttester` :801) | KEPT (`referencingByAuthor`) | **T1/2** ✓ | KEEP — but does NOT substitute for R1 (needs known author) |
| R10 | Live semantic count "≥N live citations/mirrors/holders" | v1 raw only (:899, not revoked-filtered) | raw `.length`, append-only | **raw=T1-but-non-semantic; live=unbounded** | ⚠ attacker-inflatable; not a v1 regression but a live overclaim (A2) |
| R11 | Deny-set discovery "who advises against X" | net-new | rides discover-by-target | **T2 iff index ships, else T3** | inherits R1/P12 sign-off |
| R12 | Delegate-set completeness "all of T's delegates" | net-new | authorship-enum, event-derived | **T2 iff author/target index, else T3** | CORE-fix IF act gates on discovery (A3.2) |

### 1c. Analytics (legitimately off-chain — but each needs a signed row)

| # | Capability | Correct tier | Ruling |
|---|---|---|---|
| N1 | Global schema enumeration "all claims of kind S" | **T3 (T2-replay recoverable)** | legit defer + sign-off |
| N2 | Content-hash dedup reverse "which DATA has hash H" | **T3** | legit defer (ADR-0049 already off-chain; getCanonicalData→0) + sign-off |
| N3 | keyWrap recipient-set membership "is Bob a recipient of F" | **T3 by design** | legit defer (privacy oracle-avoidance; trial-decrypt) + sign-off |
| N4 | Unbounded-∩-unbounded intersection, ranked/trending, NOT/OR, full-text, global aggregate counts | **T3** | legit defer (EFS ships no query language) + sign-off |
| N5 | Selectivity-bounded k-tag AND (rarest conjunct page-bounded) | **T2 DISCOVERY-flagged** | can be pulled ON-chain (attack-offchain §2) — more generous than "container-only"; contingent P12 + O(1) (author,definitionId,targetId) membership slot |
| N6 | tier-2 calldata file bytes (ride history) | **T3 EIP-4444-prunable** | legit defer, graded @EPHEMERAL honestly; contractReadable floor forces state tier when a contract must read |

---

## 2. THE EXPLICIT JAMES SIGN-OFF LIST (nothing may be Tier 3 without a line here)

Each line: capability — deferred because — **CORE-FIX-REQUIRED** or **LEGITIMATELY-DEFERRABLE**.

**Must-fix (Tier-3 today that the mission requires on-chain):**
1. **General backlink (R1)** — "who points at X" is event-derived/replay-only as specced; **CORE-FIX** → B3 discoverByTarget REQUIRED, REF-targets.
2. **Predicate-filtered reverse (R2)** — B4 postings word lacks `definitionId`, so even with B3 it is O(total-postings-at-X) not O(matches); **CORE-FIX** → redesign postings word to carry predicate, or reserve per-`(target,definitionId)` sub-index.
3. **Address-target backlink (R3)** — B3 does not admit ADDRESS targets as specced; **CORE-FIX** → admit TARGETKIND_ADDRESS into postings.
4. **LIST reverse-membership (R5)** — no `member→lists[]` index; **CORE-FIX** → new postings, now-or-never.
5. **REDIRECT cited-by (R6)** — AliasResolver writes zero reverse state; **CORE-FIX** → route REDIRECT targetId into postings, new immutable write path, now-or-never.
6. **Best-of-N mirror ranking (R7)** — off-chain routing is STRICTER than the kept state requires; **CORE-FIX** → restore on-chain best-mirror view over PIN ∪ mirror-TAGs (zero new Etched cost).
7. **Enumerate-my-own-claims / self-restore (R8)** — mis-filed as analytics; it is `ls ~` and account-recovery, a v1 on-chain read (getOutgoingAttestations); **CORE-FIX** → author-keyed `discover(author)` index at T2 — OR James signs the un-euphemized row "users cannot enumerate their own claims on-chain without an indexer."
8. **Live semantic count (R10)** — raw `.length` is attacker-inflatable (spray+self-revoke), no revocation-aware counter; **CORE-FIX IF** any contract gates on a threshold count → needs a revocation-reconciled counter or an explicit "counts are advisory only, never gate on them" ruling.
9. **EQUIVOCAL / (author,seq)-duplicity detection for contracts (F1/A4)** — no on-chain duplicity state (codex-kernel keeps "No (author,seq) duplicity state"); only SeqCollision events (prunable) + full-spine scan; a gate obeying RR3 "never serve EQUIVOCAL as LIVE" cannot detect it and will serve a double-signed value as LIVE; **CORE-FIX IF** contracts must fail-closed on equivocation → expose an on-chain collision bit; **LEGITIMATELY-DEFERRABLE ONLY IF** James signs "on-chain gates consume closed-author-set point reads only and cannot fail-closed on equivocation" (G5 open question).
10. **On-chain AS-OF currency/freshness gating (F2)** — non-functional unless P7 checkpoint reserved-key ships AND `admittedAt` is exposed (the checkpoint TID is author-backdatable); **CORE-FIX** for safety-class freshness gating → reserve P7 + admittedAt; **LEGITIMATELY-DEFERRABLE ONLY IF** James signs "on-chain freshness rests on expiresAt (author's fuse) alone, no checkpoint-age seatbelt."
11. **Delegate-set completeness for act-gates (R12)** — event-derived authorship enumeration; **CORE-FIX IF** act carries gate/authorization semantics (a permissionless DAO gate must discover the grant, not be handed the claimId); **LEGITIMATELY-DEFERRABLE IF** act stays a pure client-render hint — James signs which.

**Legitimately deferrable (Tier-3 that is genuinely non-core — sign to confirm, do not fix):**
12. **Global schema enumeration (N1)** — unbounded global; T2-replay recoverable; **LEGIT-DEFER** iff no-body-elision is Etched (else truly event-only forever).
13. **Content-hash dedup reverse (N2)** — already off-chain in v1 (ADR-0049); **LEGIT-DEFER** — but James must sign knowing the sentence is "EFS has no on-chain content dedup."
14. **keyWrap recipient-set membership (N3)** — an addressable form IS the recipient-confirmation oracle the privacy design refuses; **LEGIT-DEFER** by design.
15. **Unbounded/ranked/NOT-OR/full-text/global-aggregate (N4)** — EFS ships no query language; **LEGIT-DEFER**.
16. **tier-2 calldata file bytes (N6)** — EIP-4444-prunable ride history, graded @EPHEMERAL honestly; **LEGIT-DEFER**.

**Meta sign-off (the two gates that silently demote everything above):**
17. **Full-body spine vs objects-only spine** — un-ratified (native-kernel §15.6); objects-only makes the ENTIRE claim/edge/revocation layer event-only Tier 3; **MUST be an explicit James signature, never a budget-silence default.** Recommend: pay the full spine.
18. **No-body-elision as an Etched invariant** — the deferred body-elision perf lever (native-kernel:216), if ever taken post-freeze, makes every demoted index truly event-only forever; **must be Etched, not a perf footnote.**

---

## 3. THE CORRECTED KEEP/DEMOTE LINE (what moves demoted→kept, with freeze cost)

All ride the B4 postings word (ERC-7201, committed pre-freeze — kernel state cannot be added post-ceremony; the reserve-selector-as-floor clause preserves only the ability to add a redeployable VIEW, never kernel state).

| Move | From → To | Freeze-sensitive storage | Now-or-never? |
|---|---|---|---|
| R1 general backlink | demoted → **KEPT** | 1 postings word / referencing claim | YES — base reservation |
| **R2 predicate dimension** | (not in word) → **ADD to word** | postings word must carry `definitionId`, OR a per-`(target,definitionId)` sub-index | **YES — CRITIC'S KEY ADD; without it R2 stays composability-T3** |
| R3 address-target | demoted → **KEPT** | postings for every ADDRESS-target PIN/TAG | YES |
| R4 targets-by-predicate | unconfirmed → **KEPT** | forward postings keyed by definitionId | YES |
| R5 LIST reverse-membership | GAP → **KEPT** | 1 word / LIST_ENTRY, new index | YES — new immutable index |
| R6 REDIRECT cited-by | GAP → **KEPT** | AliasResolver WRITES postings (was zero) | YES — new immutable write path |
| R7 best-mirror view | off-chain → **KEPT (view)** | ZERO new state (mirror-TAGs already kept) — redeployable view only | reserve read surface |
| R8 author-enumeration | demoted-as-analytics → **KEPT (author-keyed) or signed defer** | 1 word / claim author-keyed (same cheap shape as B3) | YES if kept |
| revocation-aware count / posting-staleness | B5 rejected → **reopen or sign "counts advisory"** | either revoke-echo decrement OR an isRevokedBatch reconciliation view | decide pre-freeze |

**Interaction cost:** admitting ADDRESS-targets (R3), REDIRECT-targets (R6), LIST-membership (R5), the predicate dimension (R2), and author-keying (R8) together determine reverse-index write amplification for the ENTIRE claim surface. **Price this as ONE gas bundle** (freeze-gates A2 / B) so James signs the aggregate commitment once — see the contingency cascade (§5).

**Confirmed legitimately-off the keep set:** N1–N6 above.

---

## 4. REGRESSIONS CONFIRMED (v1 had it on-chain → v2 dropped it)

1. **R1 general backlink** — v1 `getAllReferencing` (EFSIndexer.sol:791, paginated, revoked-filtered) → v2 event-derived. The original prior-audit finding; confirmed across 4 lanes.
2. **R2 predicate-filtered reverse** — v1 `getEdgeDefinitions`/`getReferencingAttestations` (EdgeResolver:795 / EFSIndexer:740) → v2 not contract-answerable even under B3 (postings word lacks definitionId). **Deepest regression; under-priced by the constructive lanes.**
3. **R3 address-target backlink** — v1 `getIncomingAttestations` (EFSIndexer:762) → v2 demoted (keep-demote I13).
4. **R7 best-of-N mirror ranking** — v1 `EFSRouter._getBestMirrorURI` (EFSRouter.sol:1065), ranked all transports on-chain in the ERC-5219-serving contract → v2 additional mirrors "enumerate off-chain or fail" (read-lens:261). Aggravating: kept state already supports on-chain ranking. Direct hit on the no-infra web3:// pitch.
5. **R8 self-enumeration** — v1 `getOutgoingAttestations` (EFSIndexer:774, paginated, bounded-by-author) → v2 demoted and mis-labeled "analytics." Regression from account-recovery/self-restore.

**Watch (not regressions, verified):** lens resolution re-homed to Durable read-lens-spec is legitimate Tier 2 (v1's EFSFileView/EFSRouter were also redeployable views, never kernel); expiry direction-flip (v1 forbade expiry, v2 adds expiresAt) is an intentional gain; the R10 count was raw in v1 too (not a v1→v2 loss, but a live overclaim).

---

## 5. FATAL TRIAGE OF THE TWO RED TEAMS

**attack-onchain — the strongest lane; most findings survive:**
- **A1 (predicate-filtered reverse not contract-answerable — postings word lacks definitionId): CONFIRMED FATAL.** Verified against native-kernel:206/:212 and B4 spec. This is the mechanical root of §0. Elevated to keep/demote R2 + freeze cost.
- **A5 (two un-ratified gates + papered-over lane disagreement): CONFIRMED FATAL as a process finding.** Resolved via the three-axis split (§0): durability D-1 and keep-demote §0 do not conflict once axes are separated; both un-ratified gates (B3-as-REQUIRED, full-body-spine) are demotable by James-silence.
- **A2 (inflatable count): CONFIRMED SERIOUS.** Downgrade "count=T1" to "raw=T1-non-semantic; live=unbounded, attacker-inflatable." Sign-off #8.
- **A4 (EQUIVOCAL undetectable on-chain): CONFIRMED SERIOUS→FATAL for gating contracts.** Promotes read-lens F1 from conditional to a live soundness hole. Sign-off #9.
- **A3 (four contracts that can't read EFS): VALID as illustration**, not an independent finding — each instance maps to A1/A2/A4/R7.
- **A6/A7: confirmatory, accepted.**

**attack-offchain — over-reaches in one place, otherwise sharp:**
- **§0 SPINE≠QUERYABILITY: CONFIRMED FATAL** — same core as A1 at the axis level; adopted as §0 of this synthesis.
- **Authorship-enum mis-filed (§1): CONFIRMED — I ADJUDICATE FOR attack-offchain OVER keep-demote.** keep-demote filed R8 as "legit T3 analytics"; attack-offchain is right that "enumerate your own data / self-restore / `ls ~`" is core self-sovereignty and a v1 on-chain read (EFSIndexer:774), bounded-by-author (cheap, same postings shape). Ruling: author-keyed index REQUIRED at T2, OR an explicit un-euphemized signed defer. (keep-demote itself flagged this as "the sole disagreement to surface to James" line 165 — resolved here toward on-chain.)
- **Contingency cascade — default is a Tier-3 EFS (§4): CONFIRMED FATAL, and no lane summed it.** Every open freeze item (full-spine, B3, P12, author-index, P7, duplicity-read) floors a CORE capability, and on every one the gas-cheapest do-nothing is the Tier-3 outcome. Under budget-silence EFS ships needing The Graph for backlinks, directory-listing, self-restore, list-membership, cited-by, currency-gating. Adopted as sign-off #17 + the one-gas-bundle recommendation.
- **EQUIVOCAL soundness (§6): CONFIRMED**, converges with A4.
- **Multi-tag-AND over-concede (§2): ACCEPTED AS REFINEMENT (N5)** — selectivity, not container-membership, is the correct predicate; k-tag AND is T2 when the rarest conjunct is page-bounded. DISCOVERY-flagged, never GATE-consumable. Contingent on P12 + O(1) membership slot.
- **which-lists / cited-by default-T3-by-silence (§3): CONFIRMED**, converges with R5/R6.
- **Mirror best-of-N (§7): CONFIRMED REGRESSION** (R7).
- **Spine-contingent grants unverified (§5): CONFIRMED** — full-spine unratified, body-elision must be Etched invariant (#18), fire drill never run (extend §8 test with a reverse-query assertion, durability D-2).
- **CAS/dedup anonymized (§8): CONFIRMED CONCESSION** — v1 already removed it (ADR-0049), NOT a v2 regression; do not demand restore, but James signs the named sentence (N2).

**Net:** no red-team finding is dismissed as invalid. The only correction is scoping — A3 is illustrative not independent, and multi-tag-AND is a refinement (a place EFS can do MORE on-chain), not a hole.

---

## 6. THE LINE (the crisp rule James's constraint demands be stated once)

> **On-chain (Tier 1/2, REQUIRED):** every basic FS/identity/currency operation a contract is handed a key for (path resolve, getSlot, isRevoked, getValue, parent/containment, membership test, single deny-check, single act-check, single mirror PIN, hasActiveEdge, web3:// byte serving); PLUS every bounded reverse/enumeration/traversal/intersection whose cost scales with the ANSWER (match count or one page), not with global history — general backlink, predicate-filtered reverse, address-target backlink, targets-by-predicate, LIST reverse-membership, REDIRECT cited-by, best-mirror ranking, self-enumeration, and selectivity-bounded k-tag AND.
>
> **Off-chain (Tier 3, each with an explicit James-signed row):** only queries whose cost is intrinsically unbounded — unbounded-∩-unbounded intersection, ranked/scored/trending, NOT/OR multi-predicate, full-text, global aggregate counts — plus the two by-design privacy/dedup oracle-avoidances (keyWrap membership, content-hash dedup).
>
> **The non-negotiable qualifier:** durable on-chain STATE is NECESSARY BUT NOT SUFFICIENT. A capability is on-chain-COMPLETE only if a bounded reader answers it from a KEYED index — never by scanning an unbounded, dead-entry-polluted, predicate-blind postings array or replaying 100 years of global history. "Spine-recoverable" satisfies durability, not the line. And the index must carry the predicate (definitionId) and a live-revocation story, or predicate-filtered and count queries fall back across the line into Tier 3.

---

## 7. DOC-SET SHAPE + WHAT NEEDS JAMES

**Docs to update (threaded):**
- **fs-pass-freeze-reservations B3/B4:** status → REQUIRED; **redesign the B4 postings word to carry `definitionId`** (or reserve a per-(target,definitionId) sub-index) — the single most important freeze change; reopen B5 (revoke-echo) or ratify an isRevokedBatch reconciliation view; admit ADDRESS/LIST/REDIRECT targets + author-keying.
- **deterministic-ids §12 / native-kernel §4.4 keep/demote line:** move R1–R8 from demoted → kept per §3; relabel "event-derived" → "Tier-2 spine-recoverable (durability) BUT requires keyed index for queryability."
- **native-kernel §4.2/§15.6:** ratify full-body spine (not objects-only); make no-body-elision an Etched invariant; extend §8 fire drill with a reverse-query reconstruction assertion (and actually RUN it — never executed).
- **read-lens-spec §5/§7/§9.C:** P7 checkpoint + admittedAt reservation; §7.3 relabel; best-mirror view restored (§7 line 261).
- **fs-pass-synthesis dispositions:** backlinks → NATIVE REQUIRED; multi-tag-AND → redraw to selectivity (N5), not "→ The Graph."

**What needs James (the ticks):** sign-off list items 1–18. **The single most important ask: price the entire reverse/enumeration/predicate/author-index bundle as ONE gas snapshot** (freeze-gates A2) and sign the full-body-spine cost, because every one of these defaults to Tier-3 under budget-silence and that aggregate default is a Tier-3 EFS — the exact mission failure this audit exists to prevent.

**Verdict:** the point-read core is genuinely, strongly on-chain (§1a). The reverse/enumeration/count/duplicity/currency layer is on-chain-DURABLE but, as specced, NOT on-chain-QUERYABLE — five confirmed regressions, one deep structural defect (predicate-blind postings word), and eleven Tier-3 items that default to off-chain under freeze-silence. None is unfixable, all are freeze-sensitive, and the corrections are dominated by ONE decision bundle (full-body spine + a predicate-carrying, address/list/redirect/author-keyed, revocation-aware reverse index) that must be signed before the ceremony.
