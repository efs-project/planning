# EFS v2 on-chain-completeness audit — LANE: DURABILITY (spine / event-derived / state-walk survival)

**Auditor key:** durability-spine
**Date:** 2026-07-10
**Question:** On a 100-year archive, "event-derived" = TIER 3 (EIP-4444 prunes logs ~1yr). Does v2's state-reconstruction actually survive log pruning? For every index the design calls "event-derived"/"log-only-sync," is it *spine-recoverable* (Tier 2, acceptable) or *event-only* (Tier 3, must-fix)?

**The whole-lane answer in one sentence:** *Under the FULL-BODY spine, every "event-derived" index in the demote list is a pure function of the admitted-claim set and is therefore reconstructable by an O(n) scan of on-chain STATE with zero log dependence → they are all TIER 2, and the design's own headline label "demoted to event-derived" is DURABILITY-WRONG (it silently reads as Tier 3). BUT this entire Tier-2 status hinges on one unratified James decision — the full-body spine vs the "objects-only" graded fallback. If the fallback is taken, the whole claim/graph layer collapses to Tier 3.*

---

## PART 1 — THE SPINE: does it hold FULL RECORD BODIES in on-chain STATE? (VERIFIED)

**Claim under test (codex-kernel adopted-core, line 23):** *"Enumeration spine (`allClaims` append-only array, ~22–27k gas/record): the only way the from-state-alone reconstruction pledge is implementable … full record bodies in state (EIP-4444; the infra apps' bodies-in-state demand)."*

### Verified TRUE — the spine is a two-part on-chain STATE structure:

1. **The enumeration array** — `native-kernel.md §4.2`:
   ```solidity
   bytes32[] allClaims;   // append-only; every admitted record incl. REVOKEs, evidence, genesis
   ```
   Holds claimIds in admission order. This is the enumeration handle a raw state dump can iterate (hash-keyed mappings cannot be inverted from a dump — the spine is what makes enumeration-from-state possible at all).

2. **The full body store** — `native-kernel.md §4.1`:
   ```solidity
   mapping(bytes32 claimId => ClaimMeta) claims;   // author, envelopeDigest, seq, idx, kindCode, flags
   mapping(bytes32 claimId => bytes)     bodies;    // FULL record body — state, not events
   mapping(bytes32 claimId => bytes32)   revokedBy; // 0 = unrevoked
   ```
   **Storage-depth ruling (native-kernel §4.1, verbatim):** *"full bodies live in state, not only in events. Three independent reasons: (a) the state-walk doctrine — EIP-4444 history expiry makes any event-dependent reconstruction a broken 100-year promise; (b) on-chain composability; (c) the read views need payloads without an external store."*

**Conclusion:** iterate `allClaims[i]` → for each claimId read `claims[id]`+`bodies[id]`+`revokedBy[id]` (all key-derivable because the claimIds came from the spine) → you have every admitted record's full signed body in on-chain state, **including REVOKEs** (§4.2: "incl. REVOKEs"). The entire record set is present in a state snapshot with zero event dependence. **The spine claim is verified: this IS the Tier-2 foundation for the whole archive.**

### The self-red-team confirms this was a REAL bug the spine fixes (native-kernel §14.3):
> *"The state-walk pledge was unimplementable on both EAS and arch-B designs (hash-keyed mappings aren't enumerable from a state dump) → fixed: enumeration spine … **This one is freeze-blocking if rejected — the 100-year claim silently becomes 'trust an indexer's event archive.'**"*

The design authors already identified the exact durability failure this lane is chartered to find, and their fix (full-body spine) is correct. The remaining risk is not conceptual — it is that the fix is **not yet paid for** (Part 4).

---

## PART 2 — EACH "EVENT-DERIVED" INDEX: spine-recoverable (Tier 2) or event-only (Tier 3)?

**The discriminating test:** an index that is a *pure function of the admitted-claim set* can be rebuilt by a full-spine scan (bodies are in state) → **Tier 2** (client reconstructs locally, verifiably, no trusted third party). An index that needs the event log *specifically* (data present only in logs, not derivable from claim bodies) → **Tier 3**.

**Every demoted index below is a pure function of the admitted set.** Each record body carries `targetId`, `author`, `kindTag` — the exact keys these indices sort on. Nothing in any of them exists only in a log. Therefore **none is event-only; all four are spine-recoverable = Tier 2 archivally.**

### v1 baseline (VERIFIED, file:line) — all four were persistent on-chain STATE arrays, NOT events:
`EFSIndexer.sol` (measured):
- `_schemaAttestations` decl :191, populated :1121 (`.push(uid)`), read `getSchemaAttestations` :708 / count :712
- `_sentAttestations` decl :194, populated :1123, read :782
- `_receivedAttestations` decl :200, populated :1126, read :771
- `_allReferencing` decl :215, populated :1133, read `getAllReferencing` :798 / count :900

All are `mapping(... => bytes32[])` **persistent state** written in the index hot path (:1121–1133), with **paginated, revoked-filtered, contract-answerable** read functions. In v1 these were **Tier 1/2** (contract reads the array in bounded pages). The `STORAGE: LENSES (APPEND-ONLY HISTORY)` comment at :213 confirms they are state arrays, not log-derived.

### v2 demote list (deterministic-ids §12; native-kernel §4.3/§4.4 "ports unchanged"):

| Index | v1 status (file:line) | v2 label | **Durability truth under full spine** | Live on-chain (Tier 1)? |
|---|---|---|---|---|
| **`_allReferencing`** — general backlink "which records point at X" | Tier 1/2 state array, EFSIndexer.sol:215/:798 | "demoted to event-derived" | **Tier 2** — scan spine, filter body.targetId==X. Pure f(admitted set). NOT event-only | **NO** unless B3 `discoverByTarget` Etched (NEEDS-JAMES, now REQUIRED) |
| **`_receivedAttestations`** — address-target backlink "which records name address R" | Tier 1/2 state array, :200/:771 | "demoted to event-derived" | **Tier 2** — scan spine, filter body.targetId==addr-word. Pure f(set) | **NO** unless B3 covers address-target postings (NEEDS-JAMES) |
| **`_sentAttestations`** — authorship enum "all claims by author A" | Tier 1/2 state array, :194/:782 | "demoted to event-derived" | **Tier 2** — scan spine, filter claims[id].author==A. Pure f(set) | **NO** (no per-author claim index kept; `authorHead` gives only highest seq, not enumeration) |
| **`_schemaAttestations`** — global "all claims of kind S" | Tier 1/2 state array, :191/:708 | "demoted to event-derived" | **Tier 2** — scan spine, filter kindCode==S. Pure f(set) | **NO** (unbounded global enumeration — legitimately non-Tier-1) |
| **read-lens §7.3 `DISCOVERY(INDEXED)`** — forward discovery when kernel index absent | (new) | "enumeration completeness = indexer trust" | **Tier 2** if `discover(tagId)` Etched (P12); **the §7.3 fallback path is Tier 3** by construction (off-chain indexer over events) | P12 index NEEDS-JAMES |

### The design PARTIALLY admits this — but the headline framing does not:
- **native-kernel §4.3 (honest half):** *"reads that would need demoted indices answer from events **OR from a state-walk replay**, both labeled untrusted-discovery."* — the state-walk-replay path IS the Tier-2 path. Good that it's named.
- **native-kernel §4.4 table (mixed):** demoted reads answered by *"event scan or state-walk replay, labeled as of this chain's admitted set."* — again names the Tier-2 path.
- **BUT deterministic-ids §12 (headline):** *"demoted to event-derived: `_sentAttestations`, `_receivedAttestations`, global `_schemaAttestations`, `_allReferencing`"* — reads as pure Tier 3, no mention of spine-recoverability.
- **AND read-lens §7.3:** `DISCOVERY(INDEXED)` → *"enumeration completeness = indexer trust, and clients MUST say so."* — this frames the fallback as fundamentally indexer-trust, omitting that a full-spine scan is a trustless (if expensive) alternative.

**FINDING D-1 (labeling defect, durability-material):** the phrase "demoted to event-derived" is durability-wrong for all four indices. None is event-*only*; each is a pure function of the admitted set and therefore **spine-recoverable = Tier 2**. The label mis-signals Tier 3 and, worse, invites the reader to believe log pruning destroys the capability — it does not (the spine survives pruning). **Fix: relabel every one from "event-derived" to "Tier-2 spine-recoverable; not persisted as a keyed kernel index; live contract-answerability requires B3/P12."** The distinction the audit charter names — "derived from events" (Tier 3) vs "also rebuildable by scanning the spine's on-chain state" (Tier 2) — lands decisively on Tier 2 for every item, *conditional on Part 4*.

---

## PART 3 — the "from state alone" pledge: full graph incl. reverse, or only forward?

**Pledge (deterministic-ids §4):** *"Registry state is first-writer-wins, state-based, and reconstructible from a documented state-walk — never dependent on event logs."*
**Executable form (native-kernel §8):** iterate `allClaims` → read `claims`/`bodies`/`revokedBy` → **replay admission in spine order** through a reference state-transition function → rebuild registry/slots/N-sets/tree → cross-check against snapshot mappings.

### What §8 replay directly rebuilds (the KEPT indices) → Tier 2, mostly Tier 1 point reads:
- object registry (`getObject` — Tier 1), slots/supersession (`getSlot` — Tier 1), N-sets (TAG/MIRROR/entry actives), tag tree (`getTagParent`, path walk), and the **kept per-author indices** (`containsBy`, `childrenByAuthor`, `referencingByAuthor[target][author]`). Revocation state (`revokedBy`) rebuilds because REVOKEs are on the spine. **Forward graph + author-scoped reverse: fully state-recoverable.**

### Reverse / cross-author backlinks — the nuance the pledge doesn't spell out:
`native-kernel §4.3`: *"the spine … carries no per-target/per-author keying, and is never a read index."* So §8's replay rebuilds only the indices the kernel *persists* — which excludes the demoted cross-author reverse index. **HOWEVER:** because the scan visits every claim body (which contains `targetId`), a reconstructor can build the reverse index **in local memory during the same single pass** — the data is 100% present in state. So:

**The "from state alone" pledge HOLDS for the full graph including reverse queries** — but reverse queries are recovered by *local client reconstruction over the full-body spine* (Tier 2), **not** by a kernel-persisted index and **not** by the §8 procedure as literally written (which only rebuilds kept indices). This is a Tier-2-vs-Tier-1 gap, not a Tier-3 hole: no event log or trusted party is ever required. **Forward = Tier 1/2 (persisted). Reverse = Tier 2 (client-reconstructed from state). Neither = Tier 3, under the full spine.**

**FINDING D-2:** §8's acceptance test as written ("rebuilds the registry, resolves a path to content bytes") exercises only the *forward* reconstruction. It does **not** assert that reverse/backlink queries are reconstructable from the state dump. Since reverse-query durability is exactly the capability the parent audit flagged as regressed, the §8 acceptance test should be extended with a **reverse-query reconstruction assertion** ("from the state dump alone, enumerate all records pointing at object X and match the pre-kill answer") — otherwise the one durability property most at risk is the one property the fire drill doesn't test.

---

## PART 4 — THE DEAD-CHAIN FIRE DRILL & the single load-bearing decision

### What the fire drill would recover (native-kernel §8 acceptance test):
> *"kill the devnet; from the Codex + `debug_dumpStorage` output alone (zero logs, zero live RPC), a fresh implementation recomputes all golden-vector IDs, rebuilds the registry, resolves `/<path>` to content bytes, and verifies them against the contentHash claim."*

Under the **full-body spine**, this recovers: the full namespace, all object identities, all current placements/slots (incl. supersession + tombstones), all N-set actives, the tree, all kept per-author indices, all revocation state, and — via a client-side full-scan — **any reverse/backlink/authorship/schema enumeration**. That is the entire graph. **This is a genuine Tier-2 archive.**

### CRITICAL CAVEAT #1 — the fire drill has NEVER been run:
native-kernel §8: *"This is the dead-chain fire drill made a CI-able procedure — **it has never actually been run in any prior phase** (false-confidence register item #1) and MUST run before Etch."* The pledge is **unverified**. A freeze-blocking, never-executed reconstruction test is a durability liability until it passes.

### CRITICAL CAVEAT #2 — the "objects-only spine" fallback would collapse EVERYTHING to Tier 3:
This is the sharpest durability finding in the lane. The full-body spine is **not yet ratified** — it is an open James cost decision:
- native-kernel §4.2: *"Cheaper graded fallback if James rejects the cost: spine for **objects only** + envelope archives for claims — this downgrades 'state alone rebuilds reads' to **'state alone rebuilds the namespace; claims need archived envelopes'** … must be labeled as such in the Codex."*
- codex-kernel adopted-core (line 23): *"graded fallback (objects-only spine + envelope archives) documented in base §4.2. James cost sign-off tracked in freeze-gates."*
- native-kernel §15.6 (open fork routed upward): *"Spine cost acceptance (§4.2 full vs objects-only) — James call; changes the strength of the 100-year state-walk claim."*

**Under the objects-only fallback, claims (every PIN, TAG, MIRROR, LIST_ENTRY, REDIRECT, and REVOKE) are NOT in on-chain state — their only on-chain trace is the event log** (prunable, EIP-4444). That means the ENTIRE claim/graph/edge layer — placements, supersession, mirrors, backlinks, revocation — becomes **envelope-archive-dependent = TIER 3**. Forward *and* reverse. The archive would rebuild the folder tree (objects) but not a single edge or placement without a trusted off-chain envelope archive.

**FINDING D-3 (the load-bearing durability decision):** whether EFS is a Tier-2 archive or a Tier-3 archive for its entire graph layer is decided by ONE unratified line item — full-body spine vs objects-only spine (freeze-gates A2 gas bundle; native-kernel §4.2/§15.6). This is **freeze-sensitive** (the spine shape is Etched — cannot be added to immutable kernel state post-freeze) and **must be an EXPLICIT James sign-off**, not a silent cost-driven default. Per James's ruling (every off-chain deferral EXPLICIT + signed off), the objects-only fallback is a Tier-3 demotion of core functionality and **must not be taken by budget-silence**. Recommend: **pay the full spine** (native-kernel's own recommendation: "pay full spine; it is the archival property the whole carrier decision is priced on").

### Events are correctly doctrined as Tier-3 convenience (not the archival path):
deterministic-ids §10: *"Events remain conveniences; the archival reconstruction path is the state-walk (§4)."* native-kernel §7: *"Doctrine unchanged: events are conveniences. The archival reconstruction path is the state-walk (§8)."* This is the CORRECT durability posture — the "log-only-sync" acceptance test (a subgraph rebuilds from logs, zero eth_calls) is offered as a *convenience for indexers*, explicitly alongside (not instead of) the state-walk. **No finding against the events doctrine itself** — the finding (D-1) is only where a *specific capability* is labeled event-derived without noting it is also spine-recoverable.

---

## SUMMARY TABLE — durability classification of every demoted item

| Capability | v1 | v2 label | Under FULL spine | Under OBJECTS-ONLY spine | Ruling |
|---|---|---|---|---|---|
| General backlink `_allReferencing` | T1/2 (state array :215/:798) | "event-derived" | **T2** (spine scan); T1 iff B3 Etched | **T3** (event-only) | CORE — must be T1/2; fix = full spine + B3 |
| Address-target backlink `_receivedAttestations` | T1/2 (:200/:771) | "event-derived" | **T2**; T1 iff B3 addr-postings | **T3** | CORE (recommend restore); full spine floors it at T2 |
| Authorship enum `_sentAttestations` | T1/2 (:194/:782) | "event-derived" | **T2** (spine scan) | **T3** | Non-core enum; but full spine keeps it T2, not T3 |
| Global schema enum `_schemaAttestations` | T1/2 (:191/:708) | "event-derived" | **T2** (spine scan) | **T3** | Non-core global analytics; full spine keeps it T2 |
| Forward discovery `discover(tagId)` / §7.3 fallback | (new) | "indexer trust" | **T2** iff P12 Etched; else §7.3 = **T3** | **T3** | CORE forward enum; P12 NEEDS-JAMES |
| Reverse-query reconstruction (§8 fire drill) | — | not tested | **T2** (client full-scan); untested | **T3** | Extend §8 acceptance test (D-2) |
| Kept forward set (registry/slots/tree/per-author) | T1/2 | kept | **T1/2** | T2 (objects on spine) | OK |
| Revocation state (`revokedBy` + REVOKEs on spine) | T1/2 | kept | **T1/2** | **T3** (REVOKEs are claims → off spine) | full spine floors it at T2 |

---

## VERDICT (durability lane)

The v2 spine design, **as recommended (full bodies in state)**, is a genuine Tier-2 archive: every "event-derived" index is a pure function of the admitted set and is spine-recoverable with zero log dependence, so the "event-derived" label (deterministic-ids §12, read-lens §7.3) is durability-wrong and must be relabeled "Tier-2 spine-recoverable" (D-1). The "from state alone" pledge holds for the full graph including reverse queries — but reverse recovery is client-side over the full-body spine, and the §8 fire drill doesn't test it (D-2). The one thing that turns this entire analysis from Tier 2 to Tier 3 is the **unratified full-vs-objects-only spine decision** (D-3): objects-only demotes the whole claim/edge/revocation layer to event-only Tier 3, and that must be an EXPLICIT signed James decision, never a silent budget default. Plus the fire drill has never been run — a freeze-blocking, unverified pledge.
