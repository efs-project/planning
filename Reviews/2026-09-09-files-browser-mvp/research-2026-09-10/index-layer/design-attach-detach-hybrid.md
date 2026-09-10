<!-- Index-layer deep dive strand: Architect memo: attach/detach hybrid (judged winner) -->
<!-- Provenance: produced 2026-09-10 by a research/design agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering lead's
     verification and position are in ../../index-layer-2026-09-10.md. -->

# EFS v2 index layer — attach/detach with crowd-paid backfill

**Design memo · 2026-09-10 · answers the owner's 2026-09-10 question · gas labelled MEASURED / QUOTED / ESTIMATED; "today" = 22,100 fresh / 5,000 rewrite / 2,100 cold, "Glam" = 110,020 / 12,100 / 2,100 (QUOTED, EIP-8037/8038 Scheduled); EIP-7825 cap 16,777,216 (QUOTED).**

## 0. The answer in six sentences

Yes: indexes should be a separate layer, and a separate layer can be relied on by contracts — every production database does exactly this (Postgres `indisvalid`, F1 write-only → public, DynamoDB `CREATING` → `ACTIVE`, Cassandra `is_queryable`), and the thing that makes their layer trustworthy is not that it is always complete but that **its coverage is a scalar the reader must compare before using a result**. EFS v2 is in a *better* position than any of them because the ledger is already the change log: admissions are totally ordered, each (principal, directory) has a dense kind-10 ordinal (`Reviews/2026-09-09-files-browser-mvp/indexing-and-state-2026-09-10.md:94-120`; `Reviews/2026-09-05-c0-core/src/StateKernel.sol:485-491`), so a later-declared family needs no side-log, no snapshot reconciliation and no trusted builder — the contract derives every bit from kernel state and the volunteer only pays. The owner's v1 sort scheme (`../contracts/specs/07-Sort-Overlay-Architecture.md:5,11,99,169-179`; `Designs/sdk-architecture.md:583-641`) was the right shape; what made it complex — client hints, `StaleStartIndex` races, per-lens filtering of one shared list, `staleness()` split from `read()` — came from *sorting* and from v1 having no per-principal ordinal, and all four disappear for bitmap families. The pushback the owner invited is on one point only: an unsynced index is untrustworthy **only if the reader can see the bits without seeing the watermark**; make the watermark live in the same slot the probe must read, make the contract-facing probe revert outside coverage (Uniswap `'OLD'`, EIP-2935/4788, Maker `Pot/rho-not-updated`), and a half-built index is exactly as safe as a complete one over the range it claims. The mandatory-indexing ruling of 2026-07-15 (`Designs/efsv2/owner-rulings.md:59-60`) survives intact as "presence is total and automatic"; the declared layer is *predicates*, not presence, and pending D-D (`Reviews/2026-09-09-files-browser-mvp/tag-system-2026-09-10.md:244,257-276`) is resolved with its one stated downside ("cannot add later without a paid pass") turned into a specified, crowd-payable, safe pass. "Turn off" is not scary provided the retire field is reserved at genesis; the *operation* can ship later.

---

## 1. The layers

| Layer | Families | Maintained by | Complete? | Who decides | Why it is where it is |
|---|---|---|---|---|---|
| **L0 — kernel presence (mandatory, genesis)** | admission log; kind-10 scope list per (principal, purpose, subject) (`StateKernel.sol:488-490`); kind-8 binding history per position (`:501`); kind-5 target backlinks; kind-6 per-Type/definition enumeration | kernel, on every admission | always — never partial, no opt-out | ruled 2026-07-15 (`owner-rulings.md:59-60`); D-D keeps 5/6 automatic (`tag-system:244`) | **These are the scan sources.** A family declared later is buildable only because L0 is total from genesis: per-Type families walk kind-6, per-directory families walk kind-10. The coherence review's warning that BindingScope "must exist at Realm genesis" (`Designs/efsv2/hierarchical-files-and-folders.md:696-699`; `Reviews/2026-09-02-efs2-coherence-review-corpus/findings-ledger.md:325-329`) is exactly this: L0 cannot itself be added later. |
| **L1 — declared families (attached)** | bitmap columns `bits[familyId][scopeKey][bucket][word]` over the L0 ordinal, predicate from a closed kernel-verifiable menu (§2) | kernel write path from the declaration ordinal `d` onward; history `[0, liveFrom)` backfilled by anyone (§3) | exact for every covered position; explicitly UNCOVERED elsewhere (§4) | Type author (at Type creation, or later by an `INDEX_ATTACH` binding); a principal for its own scope | Epic's pattern: developers declare indexes on the items they own, add more later, backfill in the background. |
| **L2 — views (never attached)** | same column shape, or packed sorted runs (§6); each chunk stamped with the admission basis it was computed at | nobody automatically; anyone may build, extend or refresh a chunk | correct *as of each chunk's basis*; contracts verify a bit's currency with one head read | anyone, for anything, over any scope — no write-path cost to anyone | v1 sorts generalised; the crowd-built accelerator that is "never truth" (`Reviews/2026-07-11-efsv2-lens-architecture-and-scale-review.md:1020-1035`). |

**Reconciliation with 2026-07-15.** The ruling's operative sentences are "the moment it goes on-chain via EFS, indexing is mandatory" and "Kills the 'is X indexed?' conditional — everything on-chain is queryable" (`owner-rulings.md:59-60`). L0 delivers that literally: every record is reachable by Type, by target and by scope from the block it lands, and no writer can withhold it. What the ruling never specified is *which predicate families* exist; reading it as "every conceivable family from genesis" is what produced the 20%-of-every-write cost D-D reacts to (`tag-system:264-266`). L1 keeps the ruling's two teeth — no per-writer opt-out (once a family is attached to a Type every writer of that Type pays, `tag-system:271`) and no half-presence (L0) — and moves only the predicate choice to the Type author, which is D-D's proposal. **This memo therefore answers D-D "yes", with one amendment to D-D itself**: its stated regret, "a Type author who leaves a list out cannot add it later without a paid pass over existing records" (`tag-system:272-273`), becomes a specified operation (§3) whose pass anyone may pay, chunk by chunk, and whose incompleteness cannot be misread (§4).

**Who may declare.** Declaring is a record admission — anyone. *Attaching* (making other principals' write paths pay) is the only privileged act, and it rides authority the payer already accepted: the Type author, via an `INDEX_ATTACH(typeId → familyId)` binding under the author's principal (writers chose the Type; the author already set its cost profile), or a principal for its own scopes via `INDEX_ATTACH(scopeKey → familyId)`. Anyone else's declaration is an L2 view. Cap attached families per Type (V2-E4 "Type and index budget", `Open-Decisions.md:50`; F4's "at most one pending per Type", `Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:1918-1921`) — recommend 8.

**Authorship invariant.** "A principal's columns are written only by an op signed by that principal or by a fold signed by a vocabulary it delegated to; anyone may pay, nobody else may author" (`tag-system:156-158`). An L1 column is not P's *assertion*; it is the kernel's deterministic function of P's own admitted bindings, exactly as kind-5/6 postings already are. The builder submits no facts (§3), so it authors nothing — the same line ADR-0066 drew for v1 (`../contracts/docs/adr/0066-index-discovery-only-no-folder-presence.md:28-42`: a permissionless call may make things discoverable, never manufacture what a principal is on record as asserting). The delegated-vocabulary `implied` fold (`Reviews/2026-09-09-files-browser-mvp/tags/design-graph-native.md:147-155`) is a different animal — it copies *asserted* bits under a vocabulary's signature — and stays as designed, separate from this layer.

---

## 2. Declaration

A family is an **immutable record** of Type `IndexFamily/1`, admitted by the declarer; `familyId` = its record id. Contracts pin `familyId` (consumer-tournament verdict: effectful consumers pin exact identities; `Designs/efsv2/layered-type-system-and-data-abi.md:400-402`) — a later family is a new identity, never a mutable "latest".

```
IndexFamily/1 {
  source:        SCOPE(purpose)            // walk kind-10 lists: per-(principal, directory) columns
               | TYPE(typeId)              // walk kind-6: one column per Type, Type-local ordinal
  predicate:     FIELD_EQ(fieldRole)       // bucket = field value (mediaType, kind, …)
               | REF_TARGET(fieldRole)     // bucket = referenced record/address
               | DIGEST                    // bucket = contentHash
               | ALIVE                     // bucket = {live}
               // closed menu: only predicates the kernel can evaluate from state-readable facts
               // in bounded gas (constitution reconstruction promise, Designs/efsv2/system-constitution.md:210-216)
  subjectFilter: optional directory        // restrict to one directory's scopes
  bucketWidth:   uint8                     // bits per bucket key (open sets hash to 32 bytes)
}
```

**Key space.** `bits[familyId][scopeKey][bucketKey][wordIndex]` where `scopeKey = scope(principal, purpose, subject)` for SCOPE families and `typeId` for TYPE families; the bit index is the L0 ordinal (kind-10 position, or kind-6 position). One packed **Coverage slot** per `(familyId, scopeKey)`, allocated lazily:

```
Coverage { uint64 through; uint64 liveFrom; uint64 retiredAt; uint32 revision; uint8 state }
// state ∈ {UNINIT, BACKFILLING, COMPLETE, RETIRED}   — one 32-byte slot
```

and one **family slot** `Family { uint64 declaredAt=d; uint64 retiredAt; uint8 mode; uint8 attachedCount }`.

**Attach vs snapshot** is a property of the family: `mode = ATTACHED` (L1) or `VIEW` (L2). ATTACHED means the kernel write path evaluates the predicate for every admission of an attached Type/scope from `d+1` on; the family is "write-only" in F1's sense from declaration, readable per position as coverage is proved. VIEW means no write-path hook ever; each built chunk carries its own basis.

**Why attach at declaration, not at completion.** The owner's framing ("backfilled … and then ATTACHED") is the intuitive order, and it has a real bug. If the write path is not hooked until the backfill finishes, a rebind of an already-backfilled position `i` during the build changes its bucket, nothing clears the stale bit, and the watermark now lies about `i`. Hooking at `d` (F1 write-only, CockroachDB `DELETE_AND_WRITE_ONLY`, DynamoDB "tracks the items being added, deleted, or updated" — DB strand §2.1) fixes the historical target at `[0, liveFrom)` per scope, so completion is guaranteed given finite gas, hot scopes cannot outrun builders, and every covered position is *exact*, not "as of a basis". The price is that writers of an attached Type pay during the build even if nobody ever finishes it — which is why attach authority is limited (§1) and why detach exists (§5).

---

## 3. Build — the chunked backfill

```solidity
function backfill(bytes32 familyId, bytes32 scopeKey, uint64 expectedThrough, uint16 maxEntries)
    external returns (uint64 through, uint64 liveFrom, uint8 state);
```

**Inputs.** `scopeKey`; `maxEntries ≤ 512` (§3 cap); `expectedThrough` optional (0xFFFF…FF = "no guard").

**Step 0 — init (first call for the scope).** If `Coverage.state == UNINIT`: binary-search the kind-10 list for the first entry whose stored admission ordinal `> d` (the list stores `ord`, `StateKernel.sol:489`) → `liveFrom`; write the Coverage slot. ≈12 cold reads (25k) + fresh slot: **≈47k today / ≈135k Glam** (ESTIMATED). A scope created after `d` gets `liveFrom = 0` and is COMPLETE on init — one call.

**Step 1 — guard.** `if (expectedThrough != NONE && cov.through != expectedThrough) revert StaleWatermark(cov.through)` — cheap (~30k spent). Without the guard there is no CAS at all: the contract advances from *its own* watermark, so two builders on one scope both succeed on consecutive chunks. This is strictly better than v1's `expectedStartIndex` (`../contracts/packages/hardhat/contracts/EFSSortOverlay.sol:221-227`), which existed only because v1 callers supplied items and hints tied to positions.

**Step 2 — walk.** For `i` in `[through, min(liveFrom, through + maxEntries))`: kind-10 entry → admission row → occurrence → binding key → current head (`BindingFold.Head`) → if tombstoned, no bit; else read the bound record's predicate field → `bits[F][S][bucket][i/256] |= 1 << (i%256)`. Nothing is taken from calldata. Per entry, ESTIMATED reads: kind-10 word 525–2,100 (packing-dependent) + admission row 2,100–4,200 + occurrence 0–3,000 + head 4,200 + record field 2,700 (SSTORE2) – 8,400 (2–4 slots) ≈ **10–20k**, identical on both schedules; writes amortise to **86 today / 430 Glam** per entry (one fresh word per 256) or 20 / 47 for rewrites. *Design note for genesis:* storing the binding/position key in the kind-10 entry instead of (or packed with) the admission ordinal removes the admission-row and occurrence hops (−2k to −7k per entry) for backfill and for every scope enumeration; it is an Etched posting shape, so it must be decided before `initialize()`.

**Step 3 — advance.** `cov.through = end; cov.revision++`; if `end == liveFrom` → `state = COMPLETE`, emit `FamilyComplete`. No aggregate counts are maintained — the Coverage slot is a frontier in the beacon-deposit sense (`Reviews/2026-09-09-files-browser-mvp/gas-engineering-2026-09-10.md:222-248`, 50,462 vs ~228,000 MEASURED): one slot per chunk, popcounts computed in views.

**Idempotence and order.** Bits are set with OR from the *current* head, never toggled (Uniswap `flipTick`'s XOR is the anti-pattern — onchain strand §5). The live path from `d+1` sets/clears bits for any position on any rebind. A rebind at an unbackfilled position sets the correct bit and clears an unset old bucket (no-op); the backfill later rewrites the same value (warm 100). A rebind after backfill clears old, sets new. Every interleaving converges to "bit = predicate(current head)" — so ordering between the live path and the backfill does not matter, and ordering *within* the backfill is enforced by construction (contiguous from `through`).

**Per-chunk gas and the cap.** 512 entries × 10–20k ≈ **5–10M** today and Glam (+2 fresh words: +44k / +220k) — comfortably under 16,777,216 with the widest estimate; 1,024 entries would breach the cap at the upper bound. 10,000 files ≈ 20 transactions ≈ **100–200M** total, the same on both schedules (reads dominate ≈99%). This is the "~1,500–2,500 entries per transaction" of the DB strand principle 7 with the wider read estimate applied.

**Trusted or untrusted builder.** Untrusted, in the strongest sense: the builder cannot be wrong about anything except the chunk size. Path A (recompute) and Path B (verify a claim) cost the same SLOADs (onchain strand §6), so claims buy nothing here; ZK claims (≈220–250k per proof, QUOTED EIP-1108) would beat recompute above ~20 entries but need keccak-MPT circuits EFS does not have — post-v2 option, not a dependency.

**"Nobody writes into another principal's column."** Preserved (§1): the builder pays for kernel code to derive P's column from P's own list and heads. The tag design's mandatory ≈8,400-gas ordinal verification (`tag-system:158-161`) is for *claimed* bits arriving in a principal's op; a walk needs none because the contract is the one that chose the ordinal.

---

## 4. Watermark and trust

**What a reader sees, in one slot.** `Coverage{through, liveFrom, retiredAt, state}` plus `Family{declaredAt, retiredAt}`. Position `i` in scope `S` is **covered** iff `i < through` (backfilled history, exact from then on because the live path has maintained it since `d`) or `i ≥ liveFrom` (born after `d`, kernel-maintained from birth). Covered bits in an ATTACHED family are exact at the current head — there is no "staleness" to tolerate once a position is covered; the only third state is *uncovered*.

**The tri-state read.**

```solidity
// contract-facing: the ONLY function returning a bare bool
function probe(bytes32 familyId, bytes32 scopeKey, bytes32 bucket, uint64 position) view returns (bool hit);
//   reverts Unsupported()                          — unknown family / scope UNINIT
//   reverts Uncovered(position, through, liveFrom) — through ≤ position < liveFrom
//   reverts Frozen(retiredAt)                      — family retired (see §5)

// tolerant: no bool anywhere in the result
enum Tri { HIT, MISS_COVERED, UNCOVERED, UNSUPPORTED, FROZEN }
function probeTolerated(...) view returns (Tri, Coverage memory);

// enumeration: PageResult (Reviews/2026-09-05-c0-core/src/StateAuditPages.sol:14-34) + Coverage
function page(familyId, scopeKey, bucket, cursor, maxItems, basisOrdinal) view
    returns (PageResult memory, Coverage memory);   // completeness = COMPLETE iff through == liveFrom;
                                                    // PARTIAL otherwise with [through, liveFrom) reported;
                                                    // cursor commits revision (F4 rule, b0-indexes.md:1958-1960)
```

Cost of `probe`: family slot + Coverage slot + one bit word ≈ **6,500** (ESTIMATED, both schedules). This is F4's coverage machine (`b0-indexes.md:1918-1984`) specialised to per-scope columns, with the trustless walk in place of F4's unstated payer, and with the four-valued `Completeness` kept (UNKNOWN is never emitted by Core — `b0-indexes.md:1321-1366`; `Designs/efsv2/system-constitution.md:207-209`). Silent absence is impossible by shape: a MISS is only reportable as MISS_COVERED, and the reverting path is the only bool. The measured fix ordering — runtime absence > type unions > lint > docs (memory `efs-silent-absence-is-a-shape-problem.md`; `Reviews/2026-09-09-files-browser-mvp/report-for-codex-2026-09-10.md:18-24`) — says the watermark cannot be a sibling field the caller may ignore; here it is not a field at all on the contract path, it is a revert.

**Pinning staleness.** ATTACHED families: a contract pins `familyId` and needs no basis — covered means exact. VIEW families (§6): each chunk stores `basisOrdinal`; `probe(viewId, …, minBasis)` reverts if `chunk.basis < minBasis` (Pyth `getPriceNoOlderThan`, Semaphore root expiry); a contract that must know a snapshot bit is *current* adds one head read, `head(position).admissionOrdinal ≤ chunk.basis ⇒ unchanged since` (≈4,200) — verify-don't-compute at read time.

**Catching up to the head.** There is no "attach on catch-up" transition because attachment happened at `d`; catch-up only flips `state = COMPLETE`. Scopes born after `d` are complete on init (one slot).

**Races.** Two builders, no guard: both succeed on consecutive chunks. With guard: loser reverts at ~30k after the two slot reads. Bounty front-running (§7): the front-runner did the work. A rebind landing between two chunks: handled by the live path, converges (§3). A page cursor spanning a backfill step: `revision` drift → revert and restart (F4), never a spliced page. Watermarks are spine ordinals, never max-seen heads (W1, `Reviews/2026-07-10-fs-pass-corpus/attack-boundary-os.md:74-78`).

---

## 5. Turn off

`detach(familyId)` by the attach authority: `Family.retiredAt = currentAdmissionOrdinal` (one rewrite, **5,000 / 12,100**), write path stops evaluating the family from the next admission, coverage freezes. Readers: `probe` reverts `Frozen(retiredAt)` for any basis after retirement; `probeTolerated`/`page` return FROZEN with the frozen interval so an inert reader can still use it as history. **Re-attach is a new `familyId`** (new backfill); reusing an id would put a hole in the middle of its coverage and turn "covered" back into a range list. Optional `sweep(familyId, scopeKey, wordRange)` after retirement clears words for the refund — economically dead (EIP-3529 refund ≤ gas_used/5; clearing refunds 4,800 today, QUOTED) so nobody will run it; storage stays, as it does everywhere on-chain.

**Is it scary?** Not the mechanism: the retire field lives in the same slots every probe already reads, the reverting probe makes a retired family unreadable-as-current by construction, and the two costs Postgres shows for an un-retirable invalid index ("still consume update overhead", DB strand §1.1) are exactly what a missing `retiredAt` would impose on every writer forever. What *is* sharp is the consumer side: a deployed contract that pinned `familyId` and has no fallback bricks at `retiredAt` — the same class as any Etched dependency. Two mitigations, both cheap: detach is two-step (`announceDetach` at ordinal A, effective at A + Δ admissions, Δ a constant like 2^16) so consumers can migrate, and contracts are told to route through `probeTolerated` with a bounded read-through fallback (walk the scope list for the one position) if they want to survive detachment. **Recommendation:** reserve `retiredAt` in both slots at genesis (free), ship `detach` as an operation whenever convenient; do not ship `sweep`.

---

## 6. Sorted views — the v1 crowd-built sort, re-homed

The v1 machinery (anyone pays to fold a chunk, contract checks each item against the kernel, watermark per list, `spec 07:97-109,169-179`) maps onto L2 with three simplifications: no hints (the contract reads the keys anyway), no linked list (packed runs), no per-lens filter of a shared list (runs are over scope snapshots, lens filtering is by scope selection).

```solidity
function buildSortedRun(bytes32 viewId, bytes32 scopeKey, uint64 fromPos, uint32[] calldata positionsInKeyOrder)
    external;   // requires: positions are exactly {fromPos .. fromPos+len-1} as a set (bitmap check in memory),
                // each adjacent pair satisfies key(a) ≤ key(b) read from the current heads (O(n) SLOADs),
                // stores packed uint32 positions (8/word) + Run{basis = current admission ordinal, fromPos, len}
```

Verification is O(n) in key reads (head 4,200 + field 2,700–8,400 ≈ 6.9–12.6k per entry) plus packed storage (22,100/8 = 2,760 today / 13,750 Glam) ⇒ **≈10–15k / ≈21–26k per entry**; 10,000 entries ≈ 100–150M / 210–260M, 20 runs of 512. Be honest about where the saving is: the contract could sort 512 keys in memory for ~10⁵ gas, so verify-don't-compute saves almost nothing on arithmetic — it saves the *live structure*. Rebalancing sorted structures at 68–127k per insert (QUOTED in the brief; ESTIMATED ×2.4–5 under Glam) would tax every writer forever for an ordering most readers recompute client-side anyway (D-9 choice A, assumed downstream, unruled — `Designs/efsv2/human-overview.md:453-455`; `Reviews/2026-07-25-joined-fs-pass-corpus/filesystem-core.md:67`). Keep them out of the kernel and out of L1.

**Basis and increments.** A sorted view is a list of runs, each `(basis, fromPos, len)`; a reader k-way-merges runs (view function, memory only) and reports the view's basis as the *range* `[min basis, max basis]` and coverage as the union of run position ranges. Increments = a new run over positions `[n_B, n_B')`. Rebinds after a run's basis are detectable per position (`head.ord > run.basis`) and are either excluded at read (point) or fixed by `refreshRun` (re-verify and re-store, same cost as build). Contract top-N over a large cold scope is the only case where this beats client-side sorting; for the browser, enumerate + sort locally at the pinned basis.

---

## 7. Cost sharing

| Act | Payer | Cost today / Glam | Bounded? |
|---|---|---|---|
| Declare family (record) | declarer | one record admission | yes |
| Attach binding | Type author / scope principal | one binding | yes; ≤ 8 per Type |
| Init a scope's Coverage | whoever wants that scope readable (reader, builder, browser) | ≈47k / ≈135k | yes |
| Backfill chunk (512) | anyone | ≈5–10M both | yes, by `maxEntries` |
| Live maintenance per attached family, new placement | the writer, from `d+1` | ≈7.2k / ≈14.6k typical; fresh word 22,100 / 110,020 once per 256 | yes |
| … per rebind | the writer | ≈15–21k / ≈30–35k (old-field read + clear + set) | yes |
| Probe | reader | ≈6.5k | yes |
| Page (256-position word, h hits) | reader | 2,100 + ≈2,600·h dereference | by page |
| Sorted run (512) | anyone | ≈5–8M / ≈11–13M | yes |
| Detach | authority | 5,000 / 12,100 | yes |

**Bounties.** Out of the kernel. An optional overlay `Bounty{familyId, scopeKey} → balance`; `backfill` via the overlay pays the caller `balance × advanced / remaining` — one extra transfer. Default: none; the declarer or the reader who wants the scope funds it. The SDK's `build()` simply spends the caller's gas, exactly as `efs.sorts.process` did (`sdk-architecture.md:626-635`).

**Exploits, one by one.** *Poisoning* — impossible in L1 and L2 columns (no claims), impossible in sorted runs (order verified against keys; membership verified against the position set). *Ordinal mismatch* — not applicable (the contract chose the ordinal). *Stalling* — nobody can block a permissionless advance; `liveFrom` is fixed at `d`, so writers cannot make a scope unfinishable (they could under attach-at-completion — another reason against it). *Front-running a chunk* — the victim's tx either advances the next chunk (no guard) or reverts at ~30k (guard); a bounty goes to whoever did the work. *Griefing writers with troll declarations* — only L2 views are permissionless, and they touch no write path; attached families are capped and authority-gated. *Reader-side exploit* — a contract using `probeTolerated` and treating UNCOVERED as false: the API has no bool on that path, and the SDK types the result as a union with no `false` member; that is the whole defence, and it is the one the "confirms-but-unreadable" class demands (memory `efs-confirms-but-unreadable-class.md`). *Sentinel collision* (Compound Proposal 62, ~$80–90M, onchain strand §7): a 0 bit means both "not in bucket" and "not yet folded" — the Coverage slot is the disambiguator and the reverting probe forces its use. *Thin-basis aggregates* (Inverse, $15.6M): counts over a PARTIAL column are computed only by `page`, which carries coverage; no stored aggregates exist.

---

## 8. What a developer sees

```ts
// Type author, once, any time after the Type exists
const family = await efs.index.declare({
  type: 'File/1', name: 'byMediaType',
  source: 'scope', predicate: { fieldEq: 'mediaType' }, attach: true,   // attach:true needs the Type author's key
});

// Anyone — cost is the caller's gas; runs until the scope is COMPLETE or the budget is spent
await efs.index.build(family.id, scope('alice', DIRECTORY, '/photos'), {
  maxGasPerTx: 8_000_000, onProgress: (through, liveFrom) => …,
});

// Any reader
const cov = await efs.index.coverage(family.id, scopeKey);
// { state:'BACKFILLING', through: 1536, liveFrom: 4000, retiredAt: null, headCount: 4012, revision: 3 }

// Point read: a discriminated union, never a bare boolean
const r = await efs.index.probe(family.id, scopeKey, 'image/png', 77);
// { kind:'hit' } | { kind:'miss' } | { kind:'uncovered', through, liveFrom } | { kind:'unsupported' } | { kind:'frozen', retiredAt }

// Enumeration: items are unreachable without acknowledging coverage
for await (const item of efs.index.read(family.id, scopeKey, 'image/png', { basis })) {
  // item: { kind:'entry', position, recordId } | { kind:'uncovered', from, to }   ← the gap is an item, not a skip
}
```

Solidity consumers get `IEfsIndex.probe` (reverts) and `probeTolerated` (tri-state + Coverage). Contract advice is one sentence: *if you act on the result, call `probe`; if you display it, call `probeTolerated` and render the gap.*

**What is not possible, stated plainly.**
1. An index that is crowd-built *and* complete at every block *and* free for writers. Attached families cost writers from `d`; views lag by construction. Pick two.
2. Any family over an L0 list that was not mandatory from genesis — hence the kind-10/kind-6/kind-8 set must be frozen before `initialize()` and cannot be added later.
3. Predicates outside the kernel-verifiable menu — full-text, ranking, numeric ranges over opaque strings, folds over open attester sets, anything needing off-chain input — need proofs (ZK ≈220–250k per proof, optimistic claims with a window) or stay off-chain (`indexing-and-state-2026-09-10.md:171-178`).
4. History: L1 answers "is it PNG now", never "was it PNG at block B" (`:180-187`). History stays exportable and verifiable, not indexed.
5. A sorted view that stays current under rebinds without a refresh.
6. Storage reclamation.
7. A Lens over an open attester set: a lens of *k* principals reads *k* Coverage slots and *k* words (composite completeness = minimum, `Designs/efsv2/lens-spec.md:63`).

---

## 9. Decisions for the owner

| # | Decision | Recommendation | Cheapest reversible default | Etched? |
|---|---|---|---|---|
| I-1 | L0 set: admission log, kind-10 scope, kind-6 per-Type, kind-5 backlinks, kind-8 history — mandatory from genesis | **Yes**; this is the 07-15 ruling made precise and the precondition for everything below | none — must be at genesis | yes |
| I-2 | Resolve D-D as: predicate families are declared (Type author at creation or later), attached, crowd-backfilled | **Yes**; removes D-D's stated regret | declared-at-creation only first; attach-later is additive | attach binding shape: yes |
| I-3 | Attach at declaration (write-only from `d`) vs at completion | **At declaration** (rebind-correctness bug in the other order) | — | yes (write-path semantics) |
| I-4 | Attach authority: Type author via binding; principal for own scope; everyone else = views | **Yes**, cap 8 per Type | ship Type-author only; scope-principal attach additive later | cap constant: no |
| I-5 | Predicate menu: closed (`FIELD_EQ`, `REF_TARGET`, `DIGEST`, `ALIVE`) | **Yes**, additive later | start with `FIELD_EQ` only | additive |
| I-6 | Contract probe reverts outside coverage; tolerant API has no bool | **Yes**; the whole safety argument rests on it | — | ABI: yes |
| I-7 | Reserve `retiredAt` in Family and Coverage slots; ship `detach` later, two-step | **Reserve now** (free); operation later | reserve only | field: yes |
| I-8 | Kind-10 entry carries the position/binding key (not only `ord`) | **Yes** if the shape is still open; −2k…−7k per entry on every scope walk | — | yes |
| I-9 | Backfill chunk cap 512 entries | **Yes**, as a max the caller may lower | tunable constant | no |
| I-10 | Sorted views: overlay only, snapshot runs, verify-don't-compute; confirm D-9 choice A | **Yes**; post-MVP | none needed for MVP | no |
| I-11 | Bounty escrow | **Out of kernel**, optional overlay | none | no |
| I-12 | Per-scope Coverage slot cost under Glam (≈135k per scope, lazily) accepted | **Accept**; only scopes someone reads get initialised | — | — |

---

## Worked example — `/photos`, 10,000 files, "by media type" six months later

Setup: directory `/photos` (D); 12 principals placed 10,000 `File/1` records over six months (largest scope P1 = 4,000 positions, smallest P12 = 50); the Type author of `File/1` declared no media-type family. L0 exists: 12 kind-10 lists `scope(Pk, DIRECTORY, D)`, kind-6 for `File/1`, kind-5 backlinks.

| t | Event | Who pays | Gas (today / Glam, ESTIMATED unless noted) | What readers see |
|---|---|---|---|---|
| t0 | Six months of placements | writers | unchanged from today | no media-type index; `probe` → `Unsupported()`; browser filters by hydrating each file (read-through) |
| t1, ordinal *d* | `File/1` author admits `IndexFamily/1{source:SCOPE(DIRECTORY), predicate:FIELD_EQ(mediaType), attach}` = **F**; binds `INDEX_ATTACH(File/1 → F)` | author | 1 record + 1 binding | Family slot: `declaredAt=d`; every scope UNINIT → `Unsupported()` |
| t1+ | Every `File/1` placement anywhere now sets `bits[F][scope][mediaType][…]` | writers | +≈7.2k / +≈14.6k per placement; rebind +≈15–21k / +≈30–35k | live positions correct from birth, but unreadable until the scope is initialised |
| t2 | Stranger **A** runs `build(F, scope(P1))`: init (liveFrom=4,000) then 8 chunks of 512 | A | init ≈47k / ≈135k; 8 × 5–10M = 40–80M | P1: BACKFILLING, `through` 512 → … → 4,000; `probe(F,P1,png,77)` reverts `Uncovered(77, 512, 4000)` until chunk 1 lands, then answers |
| t2 | **B** and **C** split P2…P12; both hit P5 in one block. B: `expectedThrough=0` lands first (0→512). C sent `expectedThrough=0` too → `StaleWatermark(512)`, ~30k lost. C resends with no guard → 512→1,024 | B, C | 12 inits ≈0.6M / ≈1.6M; 12 more chunks ≈60–120M | per-scope watermarks advance independently |
| t2 (mid-build) | `Gallery.sol` asks "is P3's item 77 a PNG" while P3 is at `through=0` | contract | 6.5k then revert | `Uncovered` → Gallery's own tx reverts or takes its fallback (walk P3's list for position 77: ≈10–20k) — it never acts on a false MISS |
| t2 (mid-build) | Browser lists PNGs in `/photos` under a 12-principal Lens | reader (eth_call) | 12 Coverage + 12×(words) | `read()` yields entries for covered ranges and `{kind:'uncovered', from, to}` items for the rest; UI shows "index building: 7,168 of 10,000 historical items covered", renders the gap via read-through and marks it; no empty list is ever produced |
| t2 | P7 rebinds position 12 from PNG to JPEG while P7 is at `through=8` | P7 | +≈15–21k / +≈30–35k | live path clears png bit 12 (unset → no-op), sets jpeg bit 12; when the backfill reaches 12 it re-derives JPEG (warm 100). Converges regardless of order |
| t3 | All 12 scopes reach `through == liveFrom` | — | total build ≈100–200M, same both schedules | every scope COMPLETE; `probe` returns bool; browser reports COMPLETE at basis H with no gaps; a Lens over 12 principals costs 12 probes ≈78k in-tx |
| t4 | New principal P13 places 40 files | P13, then whoever inits | writes carry bits; init ≈47k / ≈135k finds `liveFrom=0` → COMPLETE immediately | before init: `Unsupported()` for P13's scope; the browser may run init itself ("reader brings it current", the v1 rule at `sdk-architecture.md:583`) |
| t5 (optional) | Author announces detach at A, effective A+Δ | author | 5,000 / 12,100 | after A+Δ: writers stop paying; `probe` reverts `Frozen(retiredAt)`; `Gallery.sol` must already be on its fallback; the frozen column remains readable as history via `probeTolerated` |

What the three strangers could not do at any point: put a bit where the head disagrees, make a MISS look proven, block each other, or make P7's column say something P7 did not bind.

---

## Could not be found / not verified

- No owner ruling on D-9 (sorted pages) or on who pays lens-registration backfill (`indexing-and-state-2026-09-10.md:445-446`; `research-2026-09-10/synthesis.md:214`); this memo assumes D-9 choice A and answers the payer question by I-4/§7.
- The kind-10 posting's packing (ordinals per word) and the `AdmissionRow`/occurrence slot count were not read line-by-line beyond `StateKernel.sol:470-502`; the per-entry read range (10–20k) is ESTIMATED with that uncertainty and narrows if I-8 is adopted.
- The 68–127k/insert figure for live sorted structures is taken from the brief as QUOTED; no vault line was located for it.
- No public source for Epic's internal index practice (DB strand §1.10); the Epic pattern is taken from the owner's description.
- No deployed contract was found that reaches provable completeness for a later-added index without per-chunk verification against the source (onchain strand §5) — which is why the design walks rather than accepts claims.