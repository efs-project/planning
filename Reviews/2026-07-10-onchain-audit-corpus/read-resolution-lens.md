# EFS v2 on-chain-completeness audit — LANE: Read resolution, lenses, grades, currency, delegation

**Auditor key:** read-resolution-lens
**Date:** 2026-07-10
**Constraint (James, 2026-07-10):** ALL CORE FUNCTIONALITY MUST WORK ON-CHAIN. No dependence on The Graph or any trusted off-chain indexer for core queries. Every off-chain deferral must be EXPLICIT and James-signed-off. "event-derived / log-only" = TIER 3 for a 100-year archive.

## The central tension, ruled first

**read-lens-spec is DURABLE (a client/SDK/gateway/view-contract spec), not an Etched contract. Is that a §0 violation?**

**Ruling: NO — it is legitimate Tier 2, PROVIDED three conditions hold, and they DO for the core reads (with named exceptions below).** The lens/grade/currency layer is *client-side computation over on-chain STATE*, which is exactly the verify-don't-trust posture Tier 2 sanctions. It is not a violation to compute grades client-side *iff*:

1. Every input the computation consumes is on-chain STATE (persistent storage), not a prunable event log. (Mostly TRUE — the Read ABI in [[codex-kernel]] §"Read ABI ownership" is state-backed via ERC-7201 + the `allClaims` spine; `eth_getProof` point reads are the documented trustless path.)
2. The computation is *deterministic and reproducible* from that state by any reader (TRUE — read-lens-spec §3.1 pseudocode is a pure function; RR1/test-16 require byte-identical cross-implementation results).
3. Where a **contract** (not just a client) needs the answer for composability/gating, the Read ABI exposes enough for a redeployable **view contract** to compute it in bounded gas. This is the load-bearing test, and it is where the exceptions live (EQUIVOCAL, currency-age, enumeration).

read-lens-spec itself confirms a **view contract is a first-class conforming reader** (§ tier note line 12: "every conforming EFS reader (SDK, gateway, client, view contract, indexer front-end)"). So "Durable spec, not Etched contract" does NOT mean "off-chain" — it means the *resolver code* is redeployable (like v1's `EFSFileView`/`EFSRouter`, which are already redeployable view contracts, per `specs/overview.md` core-contracts table). The Etched surface it depends on is the kernel Read ABI + storage layout, which IS frozen. **This is the correct architecture and NOT a regression** — v1 lens resolution also lived in redeployable view contracts (`EFSFileView`, `EFSRouter`), never in the kernel/`EFSIndexer` append-only core.

The honest line: **basic read resolution is Tier 1/2 and on-chain-complete; the exceptions are (a) EQUIVOCAL/duplicity, (b) on-chain currency-age, (c) enumeration-backed completeness.** Detail per capability below.

---

## Capability × tier × verification × ruling

### (1) Lens resolution — first-attester-wins over an ordered trusted-author list

| | |
|---|---|
| **v1 baseline (on-chain?)** | YES. `EFSRouter` walks `?lenses=` in order, first attester with an active placement PIN wins (ADR-0031; `specs/overview.md` read-flow step 4). `EFSFileView.IEFSIndexer.getChildrenByAddressList` / `getAnchorsBySchemaAndAddressList` (EFSFileView.sol:66/:74) do lens-filtered directory reads on-chain. Per-position primitive = `EdgeResolver.isActivePinEdge(attester, targetID, definition)` O(1) point read (EFSFileView.sol:43). **These are redeployable VIEW contracts, not kernel.** |
| **v2 mechanism** | read-lens-spec §3.1 `resolve()`; per-position `positionState()` → `deriveSlot()` (offline keccak, P10) → `slotRead()` = kernel `getSlot(slotId)` point read (P8 / codex-kernel Read ABI). |
| **Tier** | **Tier 2 (client) and Tier 1-capable (view contract)** for a *bounded* lens on a *single chain*. Each position is one `getSlot` (Tier 1 point read). A bounded first-attester-wins walk is expressible in Solidity over `getSlot` — same shape as v1's `EFSFileView`. On the home chain, an empty slot == total-state PROVEN-ABSENT, so the anti-fallthrough UNKNOWN/PROVEN-ABSENT distinction (read-lens §2.1) *collapses to decidable* for a same-chain contract. |
| **Contract composability forces Tier 1?** | NO — deliberately. read-lens §3.3/§4.4/RR8: "Contracts never run lens fallback… on-chain consumers gate on *closed author sets* and point reads; a lens-walking contract is an anti-pattern." A contract that wants a specific author's value does a direct `getSlot`. This is a sound ruling: cross-venue currency (UNKNOWN vs PROVEN-ABSENT) genuinely can't be decided on-chain, so gating contracts are steered to closed author sets where it needn't be. |
| **Does the Read ABI expose what a view needs?** | YES. `getSlot` returns claimId + seq + recordDigest + revoked/empty disposition + expiresAt + supersessionCount + priorClaimId (P8); `deriveSlot` is offline. A lens-resolving view contract is fully constructible. |
| **Ruling** | **CORE, on-chain, Tier 1/2. NOT a regression.** The Durable-spec framing is legitimate. |

### (2) Grade computation — LIVE / REVOKED / STALE / SUPERSEDED / EQUIVOCAL / CONTESTED

| Grade | Input | Tier | Contract-answerable? |
|---|---|---|---|
| **REVOKED** | `isRevoked(claimId)` (kernel Read ABI) / empty-on-revoke slot (P2/P3) | **Tier 1** | YES — direct kernel call. v1 parity: `EFSIndexer.isRevoked` (EFSFileView.sol:87, used at :351/:580/:991). |
| **SUPERSEDED** | slot compare: `getSlot` returns winner + `supersessionCount` + `priorClaimId` (P8) | **Tier 1** | YES — O(1) words. v1 parity: ADR-0051 reads-exclude-superseded-by-default (view layer). |
| **STALE** | `expiresAt != 0 && readClock > expiresAt`; `getSlot` exposes `expiresAt` (P5/P8); on-chain `readClock = block.timestamp` | **Tier 1** | YES — a contract compares `getSlot().expiresAt` to `block.timestamp`. NEW in v2 (v1 *forbade* expiry — see regression note R2). |
| **LIVE** | all above pass + currency bound | **Tier 1 for the disposition; Tier 2/partial for the currency qualifier** — see (3) | Partial — see (3). |
| **EQUIVOCAL / CONTESTED** | duplicity evidence: two signed records at same `(author, seq)`, different digest (P6) | **Tier 2 (client, spine scan) / TIER 3 (event-only for the convenient path); NOT Tier 1** | **NO — the one grade a contract cannot compute.** See finding F1. |

**Ruling:** LIVE/REVOKED/STALE/SUPERSEDED grade computation is Tier 1/2 client-verifiable over on-chain state and contract-answerable. **EQUIVOCAL is the exception (F1).**

### (3) Currency / expiry evaluation — freshness-aware reads (HOME-LIVE / AS-OF(N) / UNKNOWN-CURRENCY)

| | |
|---|---|
| **v1 baseline** | NONE. v1 had no currency/checkpoint concept; freshness == `isRevoked` only. NOT a regression (net-new v2 surface). |
| **v2 mechanism** | `expiresAt` word (Tier 1, above) PLUS checkpoint-bounded staleness: read author's `checkpoint` reserved-KEY slot (P7), `age = block.timestamp − tidTime(N)`, gate `require(age ≤ H)` (read-lens §5.4/§9.C the on-chain Microsoft walkthrough). |
| **Tier** | **expiresAt → Tier 1.** **Checkpoint-age currency → Tier 1-capable BUT resting on two pre-freeze-open reservations:** (a) **P7 checkpoint reserved-key is PENDING JAMES** (read-lens §0, codex-kernel amendment 10 "activation pending [[freeze-gates]] A1"). If refused, read-lens §5's copied-chain column and §9.C on-chain currency gate **do not exist**. (b) The age math needs a trustworthy admission time. fs-pass-synthesis correction **C1** rules `admittedAt` is *existence-since only, never a freshness anchor*, and the checkpoint TID is **author-asserted / backdatable** (read-lens §5.2; fs-pass-synthesis #3 `claimedAt` forward-only check). The genuine freshness anchor is the "recency beacon" checkpoint-body word (fs-pass-synthesis C1/D5) — a convention, and `admittedAt` on-chain exposure is an **OPEN pre-freeze question** (codex-kernel Open-Q "admission-event time exposure"; client-OS P1). |
| **Contract composability forces Tier 1?** | YES for safety-class GATE reads. read-lens §5.4: on-chain gates "substitute a checkpoint-age policy (`require age(N) ≤ H`, else revert)." This is the *only* freshness defense a contract has (it can't MUST-pull home). So the contract **must** be able to read a checkpoint slot AND compute a trustworthy age. |
| **Read ABI exposure** | `getSlot` on the checkpoint slot → Tier 1 IF P7 activates. `authorHead(author)` (Read ABI, venue-local hint) supports the client MUST-pull (§5.4) but is explicitly "never currency." Trustworthy on-chain age needs `admittedAt` exposure — **not currently in the frozen Read ABI.** |
| **Ruling** | **CORE, Tier 1-capable, but FREEZE-SENSITIVE and currently blocked on two James items (P7 + admittedAt).** If either is refused, on-chain freshness gating (a core composability read for safety-class config) silently degrades — expiry (Tier 1, always works) remains the backstop, but the checkpoint-age seatbelt is gone. Flag: must be resolved before freeze. |

### (4) Revocation status — "is claim R revoked"

| | |
|---|---|
| **v1 baseline** | YES on-chain. `EFSIndexer.isRevoked(uid)` (EFSFileView.sol:87); resolvers mirror EAS revocations into the indexer (EdgeResolver.sol:510, EFSSortOverlay.sol:180) so `isRevoked` stays authoritative. |
| **v2 mechanism** | `isRevoked(claimId)` in the frozen kernel Read ABI (codex-kernel §"Read ABI ownership", P8); revocation G-set = `(revoker, claimId)` monotone state (P3); empty-on-revoke slot (P2). |
| **Tier** | **Tier 1.** Direct bounded kernel call over persistent state. |
| **Ruling** | **CORE, on-chain, Tier 1. CONFIRMED. NOT a regression — kept.** |

### (5) Deny-set composition — advisory subtraction ("does author d advise against X")

| | |
|---|---|
| **v1 baseline** | None (net-new; v1 had no deny/advisory model). Not a regression. |
| **v2 mechanism** | read-lens §3.4: advisories are ordinary TAG claims; slot key `(author=d, definitionId=advisoryDef, targetId=X)`. "does advisory author d advise against X is a **derivable point read**… O(\|D\| × \|matchKeys\|) `getSlot`s, no enumeration." |
| **Tier** | **Tier 1 for a KNOWN, BOUNDED deny set D** (each check is a `getSlot` point read; a contract can loop a small closed D — same posture as closed-author-set gating). **Tier 2/3 for deny-set DISCOVERY** ("who — anyone — advises against X?") — that is a reverse/backlink enumeration keyed on the advisory *target*, which is the [[onchain-graph-queries]] `discoverByTarget` question (P12, pending James). |
| **Contract composability** | The subtract-after-resolve check with a *declared* deny set is Tier 1. Enumerating *all* advisories against a target is not (and read-lens §3.4 correctly frames D as *subscribed/declared*, not discovered). |
| **Ruling** | **CORE deny-check: Tier 1 (bounded declared D). Deny DISCOVERY: Tier 2 iff the target index ships, else Tier 3 — inherits the [[onchain-graph-queries]] backlink finding; do not re-litigate, but note deny-by-target is a consumer of that index.** |

### (6) Delegated-authorship (`act`) resolution — "does A act for team T"

| | |
|---|---|
| **v1 baseline** | NONE. v1 has no `act`/on-behalf-of/delegation primitive (grep: only EAS-native `attestByDelegation` rails, unused for authorship). fable-fs-kickoff explicitly: "no `act`/on-behalf credential today." **Not a regression — net-new.** |
| **v2 mechanism** | `act` = a TAG claim: ADDRESS-parent, target = delegate address word, VAL = frozen canonical scope grammar, `expiresAt` = window, weight = precedence (fs-pass-freeze-reservations D1, ADOPTED). "All resolution semantics **Durable** (delegate-set completeness rule = checkpoint-bounded, fail-closed to team-authored-only)." fs-pass-synthesis line 39: RE-HOMED read-side; "**kernel verifies nothing, ever**; GATE never expands implicitly." |
| **Tier** | **The single delegation check "does T grant an active act-scope to A" is Tier 1**: slot key `(author=T, definitionId=actDef, targetId=A)` → one `getSlot` point read; scope-grammar bytes are in `getValue`/claim body (state), expiry via `expiresAt` (Tier 1). A gating contract asking "may A act for T under scope S right now" resolves it on-chain in bounded gas. **The "delegate-SET completeness" ("enumerate ALL of T's delegates") is checkpoint-bounded → Tier 2 (client, needs discovery enumeration) / Tier 3 without the index.** |
| **Contract composability forces Tier 1?** | For a read-side gate "does A act for T": YES, and it IS Tier-1-achievable via the point read. Correctly, the KERNEL never enforces delegation at admission (that would be a forbidden write-gate) — read-side gating only. |
| **Read ABI exposure** | `getSlot` (act TAG slot) + `getValue`/`getClaim` (scope bytes) + `expiresAt`. Fully exposed. One caveat: the **scope grammar VAL is frozen with vectors (D1)** — a contract parsing scope must have the canonical grammar; ensure it's Codex-frozen (D1 says it is). |
| **Ruling** | **CORE single-delegation check: Tier 1, contract-answerable. CONFIRMED. Delegate-set completeness (enumeration): Tier 2/3, inherits the discovery-index finding.** The "Durable resolution semantics" framing is fine — a contract does its own point read; it doesn't need the Durable resolver. |

### (7) Discovery index reads — enumerating candidates under a container / by target

| | |
|---|---|
| **v1 baseline** | Container enumeration on-chain YES (`EFSIndexer.getChildren*`, EFSFileView.sol:57-82, paginated, revoked-filtered — Tier 1/2). Target-keyed reverse enumeration: partial in v1 (`getAllReferencing` etc. — the [[onchain-graph-queries]] backlink finding owns this). |
| **v2 mechanism** | `discover(tagId, cursor, limit≤256)` (read-lens §7.1) — container-scoped, bounded, paginated, per-entry DISCOVERY-flagged. Backed by P12 (container-scoped discovery index, codex-kernel amendment 9, **recommended ADD, PENDING JAMES**). §7.3 = degraded indexer-lane fallback = `DISCOVERY(INDEXED)`. |
| **Tier** | **Tier 2 (on-chain bounded index, client-verifiable per-item) IF P12 ships. TIER 3 (indexer-lane, event-derived) if it does not** — read-lens §7.3 states plainly: enumeration completeness = indexer trust. |
| **Ruling** | **CORE for the read layer's enumerations (comment lists, deny-by-target, delegate-set completeness, lens-LIST reverse membership all ride discovery). Tier 2 iff P12 + the [[onchain-graph-queries]] target index land; Tier 3 otherwise. FREEZE-SENSITIVE (Etched index shape). Inherits — do not duplicate — the onchain-graph-queries ruling; my lane adds that grade/currency consumers (deny discovery, delegate completeness) are additional required consumers of that same index.** |

---

## Regressions (v1-had-it-on-chain → v2-risk)

My lane is largely *net-new* v2 surface (grades, currency, deny, act had no v1 equivalent), so there are **no hard drops of a v1 on-chain read** here — the [[onchain-graph-queries]] doc already owns the one true backlink regression. Two items worth flagging as *near-regressions / watch*:

- **R-watch-1 (lens resolution re-homing):** v1 resolved lenses in on-chain view contracts (`EFSRouter`, `EFSFileView.getChildrenByAddressList`, EFSFileView.sol:66). v2 re-homes lens resolution to the Durable read-lens-spec. **Verified NOT a regression** — v2 view contracts remain conforming readers and `getSlot` point reads make a lens-resolving view contract fully constructible (same tier as v1). Flag only so the freeze reserves nothing less than v1's `getSlot`/`isRevoked`/`getValue` read surface. (v1: EFSFileView.sol:43 `isActivePinEdge`, :87 `isRevoked`; v2: codex-kernel Read ABI — parity holds.)

- **R-watch-2 (expiry direction flip):** v1 *forbade* `expirationTime` on every edge/mirror/alias/list schema (EdgeResolver.sol:337 `HasExpiration`, AliasResolver.sol:173, MirrorResolver.sol, ListResolver.sol:71). v2 *introduces* `expiresAt` as a first-class currency fuse (read-lens §2.2 STALE, codex-kernel amendment 5). This is an intentional gain, not a regression — noted so no one "restores v1 parity" by deleting expiry.

## Freeze-sensitive on-chain state that MUST be reserved before freeze (my lane)

1. **P7 checkpoint reserved-KEY row** — without it, on-chain currency/AS-OF gating (read-lens §5, §9.C) has no state to read. PENDING JAMES (codex-kernel amendment 10 / freeze-gates A1). Core for safety-class contract freshness gating.
2. **`admittedAt` (admission-time) on-chain exposure** — required for a *trustworthy* on-chain checkpoint-age (the TID is author-backdatable per fs-pass-synthesis C1/#3). OPEN pre-freeze (codex-kernel Open-Q; client-OS P1; fs-pass-freeze-reservations B1). Without it, `require(age ≤ H)` gates on an author-forgeable clock. Core.
3. **A contract-visible duplicity / `(author,seq)`-collision read surface** — for EQUIVOCAL fail-closed gating (F1). codex-kernel adopted-core explicitly keeps "No `(author,seq)` uniqueness or duplicity state"; only `SeqCollision` events + the full-spine scan reconstruct it. read-lens §9.C.5 flags this exact G5 open question ("an on-chain gate consumes duplicity only if the evidence surface is exposed to contracts"). Decide: expose a duplicity read, or accept that contracts cannot fail-closed on equivocation.
4. **P12 container discovery index + the [[onchain-graph-queries]] `discoverByTarget` target index** — required to make deny-by-target discovery and delegate-set completeness Tier 2 rather than Tier 3. PENDING JAMES. (Shared with the backlink lane — reserve the selector + storage namespace as the floor even if trimmed.)

## Tier-3 defers in my lane (must be EXPLICIT + James-signed-off)

- **EQUIVOCAL detection for CONTRACTS (F1):** Tier 3 as currently specced (SeqCollision events; no on-chain duplicity index). Client-side it is Tier 2 (full `allClaims` spine scan groups by `(author,seq)`) but that is an O(n) scan, not a point read, so **not contract-answerable**. **CORE-must-fix IF** contracts are required to fail-closed on equivocation for safety gating (read-lens RR3 says never serve EQUIVOCAL as LIVE — a gate that can't detect it can't honor RR3). **Legitimately-deferrable IF** James rules that on-chain gates rely on closed author sets + the off-chain resolver surfaces duplicity, and contracts simply never gate on potentially-equivocal authors. Needs an explicit ruling either way.
- **Deny-set discovery + delegate-set completeness (enumeration half):** Tier 3 without P12/target-index; Tier 2 with. Deferrable *only as enumeration* — the point-read half (bounded declared D, single act-check) stays Tier 1 and is the load-bearing path. Inherits the onchain-graph-queries sign-off.
- **On-chain currency AS-OF gating:** Tier 3 (non-functional) if P7 refused. Deferrable only with the explicit acceptance that on-chain freshness rests on `expiresAt` alone (author's fuse), with no reader-side checkpoint seatbelt — read-lens §9.C stops working. Needs James on P7 + admittedAt.

## Verdict

The read/lens/grade/currency/delegation layer being **Durable (client + redeployable view contract), not Etched kernel, is architecturally correct and NOT a §0 violation** — it is Tier-2 verify-don't-trust computation over frozen on-chain state, and the core reads (single lens position, LIVE/REVOKED/STALE/SUPERSEDED grades, revocation status, single `act`-delegation check, bounded declared deny-check) are all Tier 1-capable via `getSlot`/`isRevoked`/`getValue` point reads, matching or exceeding v1's on-chain view contracts. **Three exceptions break the "all core on-chain" line and are freeze-sensitive:** (F1) EQUIVOCAL is not contract-answerable — no on-chain duplicity index; (F2) on-chain currency/freshness gating is non-functional unless P7 (checkpoint) AND admittedAt are reserved before freeze — both PENDING JAMES; (F3) the enumeration half of deny-discovery and delegate-set-completeness inherits the P12/target-index sign-off. None is a *drop of a v1 on-chain read* (these are net-new v2 capabilities), but F1/F2 are core composability reads that a contract will want and currently cannot get on-chain.
