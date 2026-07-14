# EFS v2 on-chain-completeness audit — RED TEAM: attacking the "it works on-chain" claims

**Auditor key:** attack-onchain
**Date:** 2026-07-10
**Role:** Adversary. Read all six lane files (`durability-spine`, `filesystem-ops`, `graph-queries`, `identity-content`, `keep-demote-line`, `read-resolution-lens`). Attack every capability the lanes marked **Tier 1/2** that secretly needs a trusted indexer or prunable events (i.e. is really Tier 3); find composability gaps where a realistic contract must read EFS and *cannot*; find "reconstructable from state" claims that fail under EIP-4444 log pruning.

**Verdict in one sentence:** the six lanes are largely correct on *durability* (state survives) but systematically **over-grade composability** — they stamp "Tier 2, acceptable core" on a family of reverse/count/duplicity queries that **no smart contract can ever answer in bounded gas**, because the one shared index they all ride (B3 postings) is *keyed by target but stores neither the predicate nor a live-revocation bit*, so every predicate-filtered or count-based read collapses to an unbounded per-target scan — which is exactly the workload the mission forbids depending on an indexer for. Five concrete attacks below; the load-bearing one is **A1** (predicate-filtered reverse is not contract-answerable) feeding **A3** (four real contracts that can't read EFS).

---

## The one structural fact the lanes under-weighted (read first)

The entire "Tier 2 with B3" story rests on **one postings word** (fs-pass-freeze-reservations **B4**, ADOPTED):

```
posting = author(160) | spineIdx(64) | flags(32)     // per referencing claim, keyed by targetId
```

Two things this word does **not** carry, and the consequences neither the graph-queries nor identity-content nor read-lens lanes fully priced:

1. **No `definitionId` / predicate.** A `bytes32` predicate cannot fit in `flags(32)`. Predicate recovery is `spineIdx → allClaims → getClaim(claimId) → body.definitionId` — **one full claim-body SLOAD per posting** (native-kernel:212 `bodies` mapping). graph-queries.md:18 states this plainly ("one spine read per posting… never Tier 1 for the filtered enumeration") and then *still grades the capability Tier 2 and calls it acceptable core.* That is the sleight of hand this red-team targets.
2. **No live-revocation bit.** Postings are **append-only**: **B5 (revoke-echo) was REJECTED** (fs-pass-freeze-reservations:34 — "state the O(container) reconciliation cost; add a Durable `isRevokedBatch` view"). A posting written at claim-time is never updated when its claim is later revoked or superseded. So the postings array at X monotonically accumulates dead entries forever.

Storage shape is a **per-target dynamic array** (`discover(tagId)` returns `(entries, nextCursor)`, read-lens-spec:442; `discoverByTarget` is the same shape keyed on target). **The array length is unbounded** — a popular file, a hot address, or a widely-cited DATA has arbitrarily many postings. "Bounded by #edges-at-X" (graph-queries.md:18/:28) is **not a bound** — #edges-at-X *is the unbounded quantity*. This is the crux every attack below exploits.

---

## A1 — Predicate-filtered reverse queries are NOT contract-answerable. "Tier 2 bounded by #edges-at-X" is a mislabel. → really composability-Tier-3.

**Claim under attack:** graph-queries items 2b/5/6/7 ("which predicates target X", "which lists contain X", "cited-by", "who mirrored/tagged X"), identity-content #4/#6/#9, filesystem-ops 7b, read-lens §3.4 deny-discovery — all graded **Tier 2, core, acceptable** "with B3."

**The attack.** To answer *any* predicate-scoped reverse question ("which `supersededBy` edges point at X", "which `mirrors` TAGs target DATA X", "which `act` grants name address R", "which LISTs contain X") a reader must, for the postings array at X:
- iterate **every** posting (array is unbounded), and
- for each, do `getClaim(spineIdx)` to recover `definitionId`/kind (one body SLOAD, native-kernel:212), then filter.

Cost = **O(total-postings-at-X)**, *independent of how many match the predicate*. If X has 200k backlinks and 3 are the predicate you want, you pay 200k body SLOADs to find 3. For a contract this **blows the block gas limit** on any non-trivial target. For a client it is a multi-second-to-minutes scan that grows forever (append-only, dead entries never pruned).

**Why the lanes' "Tier 2" is a category error for these:** the audit's own three-tier model says Tier 1 (*contract-answerable in bounded gas*) is "needed for composability… Best," and Tier 2 is "client reconstructs." By silently accepting Tier 2 for predicate-filtered reverse, the lanes concede these are **not composable** — no contract can consume them — while presenting them as "core works on-chain." **A basic reverse lookup that only a full-array-scanning off-chain client can run is operationally Tier 3 for every on-chain consumer.** The only predicate-reverse that is genuinely Tier 1 is `hasActiveEdge(X, D)` (E2 `_activeCount`, revoked-accurate via swap-and-pop) — but that requires you to *already name the exact predicate D and get a boolean*, not enumerate or count. graph-queries.md:30 correctly keeps `hasActiveEdge` as T1 and then wrongly lets the *enumeration* ride the same "T2 acceptable" badge.

**Verdict:** REGRESSION-in-disguise. Mark every predicate-filtered reverse enumeration/count **Tier 1 = NO (composability gap)**; Tier 2 only for a client willing to scan an unbounded, dead-entry-polluted array. This is not "acceptable core" — it is the exact indexer-shaped workload §0 forbids as a *dependency*, merely relocated from The Graph to a client that must scan chain state.

---

## A2 — The on-chain backlink COUNT is a raw, revoke-polluted, attacker-inflatable number. "existence/count = Tier 1" is an overclaim (both v1 and v2).

**Claim under attack:** graph-queries.md:18/:28 ("existence/count stays Tier 1", "count T1"); read-lens §7 counts; any lane leaning on an O(1) backlink count.

**The attack — verified against v1 source.** v1 `getAllReferencingCount(X)` returns **`_allReferencing[X].length`** (EFSIndexer.sol:899) — the **raw array length**, *not* revoked-filtered. (v1's *enumeration* `getAllReferencing` filters revoked per-page via `_sliceUIDsFiltered(..., showRevoked)` at :798, but the **count does not**.) v2 inherits this exactly and makes it worse: with **B5 revoke-echo rejected**, the v2 postings array is append-only with **no decrement path at all**. So the "O(1) count" both lanes cite is a **raw count including every revoked, superseded, and expired posting**.

The **live** count — the number a curation gate or renderer actually wants — requires iterating all postings and checking `revokedBy`/supersession per entry (A1's unbounded scan). So:
- **raw count** = Tier 1 but *semantically wrong* (monotonically inflated, never shrinks),
- **live count** = Tier 2 / unbounded / not contract-answerable.

**Concrete exploit.** An attacker inflates any target's on-chain citation/mirror/holder count arbitrarily by spraying postings and immediately self-revoking them — the revoked postings **still count in `.length`**. Any contract gating on "X has ≥ N citations" (reputation/curation gate), "≥ N mirrors" (health gate), or rendering "trending / most-cited" reads a number the attacker controls upward at the cost of gas only. There is no bounded on-chain correction.

**Verdict:** downgrade "count = Tier 1" to "**raw count = Tier 1 but non-semantic; live count = Tier 2/unbounded, not contract-answerable, attacker-inflatable.**" Not a v1→v2 regression (v1 was equally raw) but a **live audit overclaim** that must not stand, because multiple downstream rulings ("existence/count T1") inherit it.

---

## A3 — Composability walkthrough: four realistic contracts that must read EFS and CANNOT.

The mission's whole point of Tier 1 is contracts reading EFS. Here are four ordinary contracts, each defeated by A1/A2 or an already-found demotion:

1. **Royalty router / derivative-tracker.** Wants: "who are the `supersededBy` / `basedOn` / `relatedVersion` parents of this work?" → predicate-filtered reverse over REDIRECT-class edges → **A1, dead** (must scan the target's entire unbounded backlink array recovering each predicate via a body SLOAD). identity-content §6 + keep-demote A1/G2 already flag cited-by as demoted; this instantiates *why a contract can't route royalties on it*.

2. **DAO / token-gate on delegated authority.** Wants: "does address R currently hold an active `act`-grant for org T?" **without** being handed the exact grant claimId. → delegate-set completeness = enumerate T's outbound `act` claims = authorship enumeration (`_sentAttestations`-class) which is **demoted to event-derived** (keep-demote I11; read-lens F/§(6); identity-content #3). Tier 1 **only** if the gate is pre-told the exact claimId (a point read). A permissionless gate that must *discover* the grant is **Tier 3** (event log, prunable) — a contract cannot enumerate an author's claims from state in bounded gas. This is a real gate a DAO would write and it does not work on-chain.

3. **NFT renderer needing transport-fallback (`web3://` → `ipfs://` → `https://`).** Wants: rank the best available mirror for DATA X. identity-content §6 **already found** v1's on-chain `EFSRouter._getBestMirrorURI` ranked selection (EFSRouter.sol:1065) was **demoted** — v2 makes only the single primary `mirrors` PIN Tier 1; the additional-mirror TAG set is "enumerate off-chain or fail" (read-lens-spec:261). A renderer that wants on-chain transport-preference fallback across N mirrors **cannot** — it gets one primary or nothing. Confirmed regression; I add: even a redeployable view can't fix it cheaply because the additional mirrors are predicate-filtered reverse postings (A1).

4. **Curation / "trending" / quorum gate.** Wants: "does this object have ≥ N live citations/holders?" → **A2, dead** (raw count is attacker-inflatable; live count is unbounded). Any threshold-on-count contract reads a forgeable number.

**Verdict:** the "core works on-chain" claim holds for *point reads a contract is handed the exact key for* (path resolve, `getSlot`, `isRevoked`, single `act`-check, single mirror PIN, `hasActiveEdge(X,D)`). It **fails for every contract that must discover, enumerate, filter-by-predicate, or count** — which is most non-trivial composability. The lanes' Tier-1 wins are real but narrow; the Tier-2 grades hide the composability cliff.

---

## A4 — EQUIVOCAL is Tier-3 *both* ways (prunable events OR unbounded scan); a safety gate can be fed a provably double-signed value as LIVE.

**Claim under attack:** read-lens F1 grades EQUIVOCAL "Tier 2 (client spine scan) / Tier 3 (event path); core-must-fix **IF** contracts gate on equivocation." I argue it is a **live on-chain security hole**, not a conditional.

**The attack — verified in corpus.** attack-kernel §3.3 / D3: same-`(author,seq)`-different-digest → **both claims admissible, ZERO on-chain uniqueness/duplicity state** (codex-kernel adopted-core keeps "No `(author,seq)` uniqueness or duplicity state"). The only trace of the equivocation is the **`SeqCollision` event** (fs-pass-freeze-reservations E9) — **prunable under EIP-4444** — or a **full-spine O(n) scan** grouping every claim by `(author,seq)`.

Consequence for a contract obeying RR3 ("never serve EQUIVOCAL as LIVE"): a contract **cannot detect equivocation at all** — no point read exposes it. So a cheating author who double-signs `(author, seq=N)` with two different config values gets **one of them served as LIVE by any on-chain gate**. A safety-class gate (access config, a "canonical settings" read, a version pin) can be handed a forked value it believes is authoritative. This is composability-**Tier 3 masquerading as Tier 1** for the gate.

**The durability twist (this is the "state claim that fails under pruning"):** the two colliding bodies are both on the full spine, so a *full-history replay* recovers the duplicity fact — durability-Tier-2. But (a) no bounded reader and no contract can ever run it, and (b) if the objects-only spine fallback is taken (durability D-3), the claim bodies aren't in state at all and the **only** duplicity evidence is the prunable `SeqCollision` event → **hard Tier 3, unrecoverable on a 100-year archive.** read-lens F1's "IF" is answered: contracts DO need equivocation-safety for any authoritative single-valued read, and they cannot get it.

**Verdict:** promote read-lens F1 from conditional to **confirmed composability hole**: expose an on-chain duplicity read (a `(author,seq)`-collision bit) or accept — explicitly, James-signed — that **no contract can fail-closed on equivocation** and RR3 is unenforceable on-chain.

---

## A5 — The whole "Tier 2" edifice rests on TWO un-ratified James decisions; a lane disagreement is being papered over.

**The attack.** Every "Tier 2, acceptable" grade across all six lanes silently assumes **both**:
- **(a) B3 `discoverByTarget` ships** — but it is **⚖ NEEDS-JAMES** (fs-pass-freeze-reservations B3), and the *current* corpus design **does not have it**: native-kernel:251 states `_allReferencing` "is **not** kernel state (event-derived, labeled-untrusted discovery)" and "the spine… is **never a read index**." So **as the design stands today, cross-author backlinks are Tier 3 (event-derived), full stop** — the Tier-2 grades are grading a *proposed* surface, not the ratified one.
- **(b) full-body spine, not objects-only** (native-kernel:226, un-ratified). Under objects-only, the entire claim/edge/revocation layer is event-only Tier 3 (durability D-3).

**The papered-over disagreement.** The **durability lane** says the demoted indices are "Tier 2 spine-recoverable, acceptable" (its whole thesis). The **keep-demote lane** says (its §0) "unbounded-replay does **not** satisfy a basic reverse lookup… still a regression." **These conflict**, and the resolution matters. Red-team ruling: **keep-demote is right for composability; durability is right only for archival survival.** A query whose *only* on-chain answer is a full-history scan is:
- **durability-Tier-2** (a client CAN reconstruct it, no trusted party), AND simultaneously
- **composability-Tier-3** (no contract can ever run it) AND
- **operationally indistinguishable from running the very indexer §0 forbids depending on** (the client is doing The Graph's full-scan job; only the trust assumption differs).

The audit must **not let "Tier 2" imply "usable / bounded / composable."** For this capability class, "Tier 2" means "durable but only an archival-replay client can serve it." That is a materially weaker claim than the lanes' "acceptable core," and it becomes **outright Tier 3** the moment either (a) B3 is trimmed to exclude a target class (address/LIST/REDIRECT/VAL) or (b) the objects-only spine is chosen — **both by James-silence, exactly the failure mode the mission forbids.**

**Verdict:** flag the two un-ratified gates as **freeze-blocking for the entire Tier-2 graph-query story**, and add to every lane's "Tier 2" a mandatory qualifier: *Tier-2-durable but composability-Tier-3 (client-full-scan only) until B3 ships as REQUIRED with REF+address+LIST+REDIRECT targets, over a full-body spine.*

---

## Secondary / confirmatory

- **A6 — G1/G2 (LIST-reverse, REDIRECT cited-by) are new immutable WRITE paths, not just reads.** keep-demote §5 prices these; I add the composability angle: even *with* B3 routing, these are predicate-filtered reverse (A1), so a contract still can't enumerate them in bounded gas. Reserving the write path (now-or-never) is necessary but **not sufficient** for composability — it only makes them client-reconstructable, never contract-answerable. Don't let "route it into B3" read as "contracts can now use it."
- **A7 — E9's full-body events are load-bearing for the *indexer* path, which is Tier 3 by construction.** fs-pass-freeze-reservations E9 ("ceremony-blocking, verified mandatory — the drafted set falsifies log-only-sync") means the subgraph rebuild needs full bodies in events. Fine while bodies are *also* in state (full spine). But this is a tell: the design ships a **log-only-sync convenience** that is pure Tier 3, and its correctness is being made ceremony-blocking. Confirm (durability D-3) that log-only-sync is *never* the archival path, only the convenience — and that no core read silently prefers it.

---

## Bottom line (red team)

The lanes correctly establish that **state survives pruning under the full-body spine** — the durability floor is real. But they **over-grade composability**: a whole class of core-sounding reads (predicate-filtered reverse enumeration, live backlink/mirror/holder counts, delegate-set discovery, equivocation-safety, best-mirror ranking) are stamped "Tier 2 acceptable core" when **no smart contract can answer them in bounded gas** and, for a client, the answer requires scanning an unbounded, dead-entry-polluted, predicate-blind postings array — the exact indexer-shaped workload the mission forbids as a dependency. The three sharpest, most actionable findings:

1. **A1** — predicate-filtered reverse is not contract-answerable (postings store no `definitionId`; array is unbounded). Composability-Tier-3 wearing a Tier-2 badge.
2. **A2 + A4** — the two reads a *gate* most wants (a **live count** and an **equivocation-safety bit**) are respectively attacker-inflatable and undetectable on-chain. Both are security holes, not conveniences.
3. **A5** — "Tier 2" is being used to mean two different things (durable vs composable), and the whole graph-query Tier-2 story is un-ratified (B3 + full-spine), demotable to Tier 3 by James-silence — the precise failure the audit exists to prevent.
