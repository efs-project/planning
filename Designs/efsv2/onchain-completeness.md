# EFS v2 — On-chain completeness audit: the matrix, the sign-off list, the line

**Status:** draft — **the authoritative on-chain/off-chain ruling.** Verified against v1 code (file:line) and v2 design (§).
**Target repos:** contracts, planning
**Depends on:** [[onchain-graph-queries]] (the seed backlink finding — this doc subsumes and generalizes it), [[codex-kernel]], [[fs-pass-freeze-reservations]], [[read-lens-spec]]
**Base corpus:** [2026-07-10-onchain-audit-corpus/](../../Reviews/2026-07-10-onchain-audit-corpus/) — 6 domain audits + 2 red teams + critic.
**Last touched:** 2026-07-10

#status/draft #kind/design #repo/contracts #repo/planning #topic/onchain-completeness

## 0. The constraint (James, 2026-07-10)

> **All core functionality must work on-chain. EFS must not depend on The Graph or any trusted off-chain indexer for core queries. Every off-chain deferral must be explicit and signed off by James. "Event-derived / log-only" = off-chain, because a 100-year archive's event logs get pruned (EIP-4444).**

## 1. The finding that reorganizes everything: three axes, not one tier

The audit's central result is that "works on-chain" was one word hiding **three independent questions**, and conflating them is what let the keep/demote line demote core features by accident:

[[solana]] treats these three axes as substrate-neutral capability requirements. EVM mappings/arrays and Solana account pages are venue layouts; both must still provide state-resident bodies, bounded keyed queries, and honestly graded native-program composability.

- **Durability** — do the bytes survive log pruning? (In on-chain *state*, not just events.) The full-body **spine** makes this YES for the whole admitted set.
- **Queryability** — can a *bounded reader* get the answer from a **keyed index**, without a trusted party and without replaying 100 years of global history? Durable-but-unindexed = "run your own full scan," which differs from "trust The Graph" only in *who* you trust, not in *cost*. **Durable is necessary but not sufficient.**
- **Composability** — can a *smart contract* compute it in bounded gas?

**The mistake we made:** the keep/demote line marked demoted indices "recoverable from the spine" and treated that as on-chain-complete. It's only *durability*-complete. A core query must clear the *queryability* bar — a keyed index — or it's off-chain in every way that matters.

**The deeper defect (the headline freeze change).** The one index every restored reverse query rides — the B4 postings word `author(160) | spineIdx(64) | flags(32)` — is **keyed by target but carries no `definitionId` (predicate) and no live-revocation bit.** So even after we "restore backlinks," the queries a contract actually wants still fail:
- **"Which `mirrors`/`supersededBy`/`act` edges point at X"** (predicate-filtered) = iterate *every* posting at X + one body-load each → O(all postings at X), not O(matches). Gas-blows on any hot target.
- **Live counts** = raw `.length`, never revocation-decremented → attacker-inflatable by spray-then-self-revoke.

**So restoring the backlink index as currently specced is not enough. The postings word must carry the predicate, and the revocation-staleness of postings must be resolved — before the freeze.** This is the single most important correction in the audit.

## 2. The completeness matrix

### 2a. The strong core — genuinely on-chain, matches or exceeds v1 (Tier 1/2, KEEP)

Path/name resolve (T1) · list folder children (T1/2) · parent/containment (T1) · active PIN placement — the hottest read (T1) · `hasActiveEdge(X,D)` O(1) (T1) · web3:// byte serving + chunk store (T1, **stronger** than v1 — kernel verifies chunks) · contentHash/size/type/name (T1/2) · is-revoked (T1) · grade LIVE/REVOKED/STALE/SUPERSEDED (T1) · bare-EOA key gate (T1) · persona forward check (T1/2) · encryptionKey publish (T1/2) · single deny-check (T1) · single act-check (T1) · forward list membership + O(1) test (T1/2) · primary mirror for DATA (T1/2) · KEL read shape (reserved). **Every basic operation a contract is handed a key for is genuinely Tier 1. This half of the mission is delivered.**

### 2b. The contested reverse/enumeration layer — durable but NOT queryable as specced

| # | Capability | v1 (file:line) | v2 as-specced | Ruling |
|---|---|---|---|---|
| R1 | **General backlink "who points at X"** | on-chain (`getAllReferencing` EFSIndexer:791) | event-derived | ⚠ **REGRESSION → REQUIRED** |
| R2 | **Predicate-filtered reverse "which D-edges point at X"** | on-chain (`getEdgeDefinitions` EdgeResolver:795) | not contract-answerable even under B3 (postings word lacks `definitionId`) | ⚠ **DEEPEST REGRESSION → postings redesign** |
| R3 | **Address-target backlink "who names R"** | on-chain (`getIncomingAttestations` :762) | demoted | ⚠ REGRESSION → admit ADDRESS targets |
| R4 | targets-under-predicate | on-chain (`getTargetsByDefinition` :808) | unconfirmed | ⚠ confirm carried |
| R5 | **Which LISTs contain X** (reverse membership) | GAP (off-chain even v1) | GAP | ⚠ **REQUIRED, now-or-never** |
| R6 | **Cited-by / which REDIRECTs point at X** | GAP (`AliasResolver.sol:38` writes nothing) | GAP | ⚠ **REQUIRED, now-or-never** |
| R7 | **Best-of-N mirror ranking** | on-chain in the ERC-5219 contract (`EFSRouter._getBestMirrorURI` :1065) | "enumerate off-chain or fail" | ⚠ REGRESSION → restore (**zero new state** — mirror-TAGs already kept) |
| R8 | **Enumerate my own claims / `ls ~` / self-restore** | on-chain (`getOutgoingAttestations` :774) | demoted, mis-filed "analytics" | ⚠ REGRESSION → author-keyed index, or signed defer |
| R9 | author-scoped backlink "does A point at X" | on-chain (:801) | KEPT (`referencingByAuthor`) | ✓ but needs known author — not a substitute for R1 |
| R10 | Live semantic count ("≥N citations") | raw only in v1 too | raw `.length`, append-only | ⚠ attacker-inflatable; needs revocation-aware counter or "advisory only" ruling |
| R11/R12 | deny-set / delegate-set discovery | net-new | rides the index | T2 iff index ships, else T3 |

### 2c. Legitimately off-chain (analytics) — but each still needs a signed row

Global schema enumeration · content-hash dedup reverse (already off-chain in v1, ADR-0049) · keyWrap recipient-set membership (a privacy oracle we *refuse* by design) · unbounded-∩/ranked/NOT-OR/full-text/global-aggregate (EFS ships no query language) · tier-2 calldata file bytes (EIP-4444-prunable, graded @EPHEMERAL). **One refinement:** *selectivity-bounded* k-tag AND (rarest conjunct page-bounded) can actually be pulled **on-chain** (T2, DISCOVERY-flagged) — more generous than "container-only."

## 3. THE EXPLICIT SIGN-OFF LIST (nothing is off-chain without a tick here)

**Must-fix — Tier-3 today that the mission requires on-chain:**
1. **General backlink (R1)** — CORE-FIX → `discoverByTarget` REQUIRED.
2. **Predicate-filtered reverse (R2)** — CORE-FIX → **postings word must carry `definitionId`** (or a per-`(target,definitionId)` sub-index). *The headline freeze change.*
3. **Address-target backlink (R3)** — CORE-FIX → admit `TARGETKIND_ADDRESS` into postings.
4. **LIST reverse-membership (R5)** — CORE-FIX, now-or-never new index.
5. **REDIRECT cited-by (R6)** — CORE-FIX, now-or-never (AliasResolver must write postings).
6. **Best-of-N mirror ranking (R7)** — CORE-FIX → restore on-chain best-mirror view (zero new state).
7. **Self-enumeration / `ls ~` (R8)** — CORE-FIX → author-keyed `discover(author)` index, OR sign the un-euphemised row: *"users cannot enumerate their own claims on-chain without an indexer."*
8. **Live semantic count (R10)** — CORE-FIX IF any contract gates on a threshold → revocation-aware counter, OR sign *"counts are advisory, never gate on them."*
9. **EQUIVOCAL detection for contracts (F1)** — a gate told "never serve EQUIVOCAL as LIVE" cannot detect a double-signed value on-chain (no duplicity state). CORE-FIX IF contracts must fail-closed on equivocation → expose an on-chain collision bit; else sign *"on-chain gates use closed author sets and cannot fail-closed on equivocation."*
10. **On-chain freshness gating (F2)** — non-functional unless the checkpoint reserved-key ships AND `admittedAt` is exposed. CORE-FIX for safety-class gating, else sign *"on-chain freshness rests on `expiresAt` alone, no checkpoint-age seatbelt."*
11. **Delegation completeness (R12), resolved by [[kel]]** — `act` is provenance/client rendering only. Permissionless authorization reads the bounded KEL grant/epoch/receipt ABI; it must never infer authority by discovering graph labels.

**Legitimately deferrable — sign to confirm, do not fix:**
12. Global schema enumeration (unbounded) · 13. Content-hash dedup reverse (off-chain since ADR-0049 — the sentence is *"EFS has no on-chain content dedup"*) · 14. keyWrap recipient membership (privacy-by-design) · 15. Unbounded/ranked/NOT-OR/full-text/aggregate (no query language) · 16. calldata file bytes (@EPHEMERAL, honestly graded).

**Meta-gates — the two silent defaults that demote everything above:**
17. **Full-body spine vs objects-only spine** — un-ratified. Objects-only makes the *entire* claim/edge/revocation layer event-only Tier 3. **Must be an explicit signature, never a budget default.** Recommend: pay the full spine.
18. **No-body-elision as an Etched invariant** — if the body-elision perf lever is ever taken post-freeze, every demoted index becomes event-only *forever*. Must be Etched, not a footnote.

## 4. The corrected keep/demote line + the one gas bundle

All ride the B4 postings word, which is **Etched kernel state — committable only before the ceremony** (the "reserve-selector-as-floor" clause preserves only the ability to add a redeployable *view*, never kernel state).

| Move | From → To | Freeze cost | Now-or-never |
|---|---|---|---|
| R1 general backlink | demoted → **KEPT** | 1 word / referencing claim | YES |
| **R2 predicate dimension** | absent → **ADD to the word** | word carries `definitionId` (or sub-index) | **YES — the key add** |
| R3 address-target | demoted → **KEPT** | postings for ADDRESS-target edges | YES |
| R4 targets-by-predicate | unconfirmed → **KEPT** | forward postings by definitionId | YES |
| R5 LIST reverse-membership | GAP → **KEPT** | 1 word / LIST_ENTRY, new index | YES |
| R6 REDIRECT cited-by | GAP → **KEPT** | AliasResolver writes postings | YES |
| R7 best-mirror view | off-chain → **KEPT (view)** | **zero new state** | reserve read surface |
| R8 author-enumeration | demoted → **KEPT (author-keyed)** or signed defer | 1 word / claim | YES if kept |
| revocation-aware count | B5 rejected → reopen or sign "advisory" | revoke-echo decrement OR reconciliation view | decide pre-freeze |

**The single most important ask: price this whole bundle — full-body spine + a predicate-carrying, address/list/redirect/author-keyed, revocation-aware reverse index — as ONE gas snapshot (freeze-gates A2), and sign the aggregate once.** Because on every one of these, the gas-cheapest do-nothing is the Tier-3 outcome, and the aggregate default under budget-silence is **an EFS that needs The Graph for backlinks, directory listing, self-restore, list-membership, cited-by, and currency gating** — the exact failure this audit exists to prevent.

## 5. Regressions confirmed (v1 on-chain → v2 dropped)

R1 general backlink · R2 predicate-filtered reverse (deepest; was under-priced) · R3 address-target backlink · R7 best-of-N mirror ranking (a direct hit on the no-infra web3:// pitch — and the state to fix it is *already kept*) · R8 self-enumeration (mis-labeled analytics; it's account-recovery). **Not regressions:** lens resolution being client-side is legitimate Tier 2 (v1's views were redeployable too); `expiresAt` is an intentional gain; the inflatable count was raw in v1 as well.

## 6. THE LINE (state it once)

> **On-chain (Tier 1/2, required):** every basic FS/identity/currency op a contract is handed a key for; PLUS every bounded reverse/enumeration/traversal/intersection whose cost scales with the **answer** (match count or one page), not with global history — general + predicate-filtered + address-target backlinks, targets-by-predicate, LIST reverse-membership, REDIRECT cited-by, best-mirror ranking, self-enumeration, selectivity-bounded k-tag AND.
>
> **Off-chain (Tier 3, each an explicit signed row):** only queries whose cost is intrinsically unbounded — unbounded intersection, ranked/trending, NOT/OR, full-text, global aggregates — plus the two by-design privacy/dedup oracle-avoidances.
>
> **The qualifier that does the work:** durable on-chain *state* is necessary but **not sufficient**. A capability is on-chain-complete only if a bounded reader answers it from a **keyed index carrying the predicate and a live-revocation story** — never by scanning a predicate-blind, dead-entry-polluted postings array or replaying 100 years of history.

## 7. Docs to thread (pending)

- **fs-pass-freeze-reservations B3/B4:** B3 → REQUIRED (done); **redesign B4 to carry `definitionId`** (or reserve the sub-index) — top priority; reopen B5 (revoke-echo) or ratify an `isRevokedBatch` reconciliation view; admit ADDRESS/LIST/REDIRECT + author-keying.
- **deterministic-ids §12 / native-kernel §4.4:** move R1–R8 demoted→kept; relabel "event-derived" → "durable but requires a keyed index for queryability."
- **native-kernel §4.2/§15.6:** ratify full-body spine; Etch no-body-elision; extend the dead-chain fire drill with a reverse-query reconstruction assertion **and actually run it**.
- **read-lens-spec §5/§7/§9.C:** checkpoint + admittedAt reservation; restore the best-mirror view; §7.3 relabel.
- **fs-pass-synthesis dispositions:** backlinks → NATIVE REQUIRED (done); multi-tag-AND → redraw to *selectivity*, not "→ The Graph."

## Open questions

- [ ] **James — the 18-item sign-off list (§3)**, delivered as the ONE gas bundle (§4). This is the deliverable.
- [ ] The `definitionId`-in-postings redesign (§1/§3.2) — confirm the shape (word field vs sub-index) once the gas snapshot prices it.
- [ ] Full-body spine ratification (§3.17) — the meta-gate under everything.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] B4 postings-word redesign threaded into fs-pass-freeze-reservations
- [ ] Keep/demote line re-audited across deterministic-ids / native-kernel
- [ ] Dead-chain fire drill run with a reverse-query assertion
- [ ] At least one round of `#status/review` with another agent or human comment
