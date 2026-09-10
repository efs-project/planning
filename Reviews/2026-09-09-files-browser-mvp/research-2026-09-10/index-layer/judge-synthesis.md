<!-- Index-layer deep dive strand: Judge: kernel facts verified, scores, synthesised design, decisions, pushback -->
<!-- Provenance: produced 2026-09-10 by a research/design agent under the integration-test-lead's
     workflow (harness claude-code, model Claude Fable 5). Figures carry the agent's own
     MEASURED / QUOTED / ESTIMATED labels; nothing here is a ruling. The engineering lead's
     verification and position are in ../../index-layer-2026-09-10.md. -->

# Judge report — EFS v2 index layer (three designs, one synthesis)

`$V` = `/Users/james/Code/EFS/planning-fable-files-browser`, `$C` = `/Users/james/Code/EFS/contracts`. Gas: MEASURED / QUOTED / ESTIMATED; "today / Glam" = 22,100 / 110,020 fresh, 5,000 / 12,100 rewrite, 2,100 cold SLOAD both (QUOTED); EIP-7825 cap 16,777,216 (QUOTED).

## 0. Kernel facts I verified that all three memos got wrong or hand-waved

These change the cost column for every design, so they come first.

1. **Posting words pack five 48-bit ordinals per slot**, not one or four: `wordIndex = count / 5`, `shift = 48 * (count % 5)` (`$V/Reviews/2026-09-05-c0-core/src/StateKernel.sol:569-573`; read side `postingWords[key][position / 5]`, `StateReadPrimitives.sol:61`). A kind-10 scope-list read amortises to ≈420 gas per entry, not 525 or 2,100.
2. **The kind-10 scope posting carries only the admission ordinal of the position's first binding** (`StateKernel.sol:485-491`), and `AdmissionRow.packed` = `leafIndex | typeOrdinal<<16 | principalOrdinal<<64` (`StateKernel.sol:280-283`) — **no binding key**. To get from a scope position to its current binding head, a walker must do kind-10 word → `admissions[ord]` (2 slots) → `envelopes[envelopeId].canonicalUnsignedEnvelope` (dynamic `bytes`, whole-envelope load, `StateKernel.sol:515-516`) → `records[vector[leaf]]` body → decode `purpose/subject/fieldRole` → `positionKey` → `bindingKey` (`BindingFold.sol:95-101`) → `bindings[key]` (2 slots) → target record field. ESTIMATED **≈30–60k per entry under today's layout, envelope-size dependent** — not the 10–20k (hybrid), 4.7–12.6k (lens-scoped) or 11–16k (trustless-recompute) the memos price. At 30–60k, the hybrid's 512-entry chunk (15–31M) breaches EIP-7825 and lens-scoped's "12 words per tx" is off by ~5×. The hybrid's I-8 is the correct instinct but under-specified: a 48-bit posting slot cannot hold a bytes32 key. The concrete fix is to store the **global binding-key ordinal** (`p.count.bindingKeys`, assigned at the same instant as the kind-10 append, `StateKernel.sol:486-489`, hence monotonic and satisfying `append`'s `ord > last` assert) in the kind-10 word; then the walk is `bindingKeys[n]` (1 slot) → `bindings[key]` (2 slots) → target field: ≈9.5–15k per entry. The first admission ordinal, which audit pages hydrate from, stays recoverable from kind-8 word 0 (`saveBinding`, `StateKernel.sol:501`) at +2,100. Etched; must precede `initialize()`.
3. **Type-level family declarations can ride in `TypeRow.cacheBytes`**, which the admission path already loads (`StateKernel.sol:354`, `:524`; `StateStore.sol:33`). Type-level attach therefore costs the write path **zero extra SLOADs** to discover. Scope-level attach does not have that property: a rebind never touches the scope posting head (only `bindings[key]` and kind-8, `StateKernel.sol:492-502`), so "does this scope have attached families?" is +2,100 cold per rebind everywhere unless a flag is cached. None of the three prices this; trustless-recompute's "≤ 8 declIds packed into the scope head the write path already touches" is impossible — the head holds count 64 + live 64 + last 48 + flags 16 = 192 bits (`StateKernel.sol:559-562`), 64 spare, and the write path does not touch it on rebind.
4. **Per-Type enumeration is kind 1** (`IndexKeys.sol:53`), kind 6 is `(typeId, roleIndex, target)` (`:62`). The hybrid's "per-Type families walk kind-6" should read kind-1; D-D's "kind 6 = everything tagged T" is correct because it means TagSet records referencing T.
5. **There is no per-scope mutation counter** (confirmed: only the kind-10 first-binding append and kind-8 per-key history), but `BindingFold.Head.admissionOrdinal` and `revision` exist (`BindingFold.sol:18-26`), so per-position drift ("changed since basis B?") is one head read (4,200), which is what the hybrid uses. Trustless-recompute's proposed `scope.mutationOrdinal` (a rewrite on every rebind, Etched) is not needed for correctness.
6. **The `alive` bitmap does not exist in the MVP** (`$V/Reviews/2026-09-09-files-browser-mvp/tag-system-2026-09-10.md:302-304`). Trustless-recompute's L0.5 "always-on, every scope, every binding write" is an unpriced universal tax (5,000 / 12,100 per tombstone or rebind + one fresh word per 256 positions per scope, 22,100 / 110,020). For predicate families the hook clears the concept bit on tombstone, so `alive` is redundant; it is a *tag-column* need (taggers cannot see placer tombstones), not an index-layer need.

## 1. Scorecard

| Criterion | trustless-recompute (TR) | lens-scoped-views (LSV) | attach-detach-hybrid (H) |
|---|---|---|---|
| (a) contract can rely, no lies | **4** — tri-state + UNSUPPORTED solid; but `pageStrict(..., requireCompleteThrough)` is a loophole (pass 0 → silent absence returns), and it discards the "set bit is authoritative even in the gap" fact | **4** — best correctness insight of the three (a set bit is never a lie, only a clear bit in the gap is uncertain); `pos ≥ scopeCount → revert`; but `enumerate` drops cursor-revision commitment, so multi-tx contract paging can splice | **5** — only bool path reverts; tolerant path has no bool; page cursor commits `revision`; per-position drift check for views via `head.admissionOrdinal` (verified). Wart: maintained-but-uninitialised scopes read `Unsupported()`, a misnomer, not a lie |
| (b) trust added, honestly priced | **5** — none; builder supplies a chunk number only | **3** — L3 "trusted indexer" priced (≈260k/chunk) but has no consumer (the browser sorts locally for free; contracts cannot use an unverified view); Glamsterdam SSTORE2 unknown; each L3 chunk is a record and pays mandatory kind 1/3/4/5/6 postings, unpriced | **5** — none; views stamped with basis, drift verifiable per position at 4,200 |
| (c) on-chain cost | **3** — walk under-priced (no envelope hop, §0.2); probe pays a third SLOAD for the `done` word; "8 declIds in the scope head" impossible (§0.3); Type auto-attach = 27k / 122k per (family, scope) paid by the first placer, unpriced under Glam | **3** — own upper bound breaches: 3.3M/word × 12 words = 39.6M > 16.78M; "sorted run 3× cheaper than an L2 word" is false — the key read is the same walk; kind-10 packing guessed | **4** — best awareness (I-8, init, rebind, both schedules) but 512 cap breaches at the true walk cost; per-(family, scope) Coverage slot = hidden 47k / 135k per scope, admitted only in the P13 row of its example |
| (d) reconciles 07-15 + D-D | **5** — explicit D-D amendment text | **4** — explicit; L3 "orthogonal" is right | **5** — cleanest formulation ("presence total, predicates declared"); keeps kind-8; resolves D-D's stated regret |
| (e) DX, impossible to misread | **4** — `ordinals` unreachable on PARTIAL is the right shape; epoch + `done` + `coveredThrough` is more to explain; parameterised strict twin is a copy-paste footgun | **3** — `probeTolerated → (Tri, bool)` puts a bool beside the enum: exactly the sibling-field misread the branch measured (`$V/Reviews/2026-09-09-files-browser-mvp/report-for-codex-2026-09-10.md:18-24`); three declarer modes | **5** — gap-as-item iterator; no bool on the tolerant path; one-sentence contract rule ("act → `probe`; display → `probeTolerated`") |
| (f) griefing / race / poisoning | **5** — order-independent chunks, no CAS, no locks; loser pays ≈25k | **3** — contiguous CAS serialises builders (all but one revert per block); permissionless attach (flagged) is a write-tax vector with no total cap across generations | **4** — optional guard ⇒ no wasted gas at all (a losing builder just does the *next* chunk); two-step detach; but a Type author can detach and strand pinned contracts (Δ mitigates) |
| (g) covers owner's v1 sort case | **5** — global key-order runs, seen bitmap + pigeonhole completeness, committed vs materialised, LSM increments: the v1 design done right | **4** — verified + trusted runs, LSM merge; trusted-run consumer unclear | **3** — runs are sorted *within fixed position ranges*, so a contract still k-way merges 20 runs for top-N; "post-MVP" |
| **Total** | **31** | **24** | **31** |

**Adversarial notes per design, beyond the table.**

*TR.* (i) The `done` bitmap buys parallelism that H's guard-less contiguous frontier already provides for free — two builders in one block each advance one chunk either way — so TR pays an extra SLOAD per historical probe and an `epoch` mechanism for nothing. (ii) Sparse-by-declaration: a family on Type v2 answers `MISS_COMPLETE` for Type-v1 records in the same scope; TR admits this (#6) but "new Type version, fine" hides that every consumer must AND with `TYPE_IS`. (iii) Rebind hook cost omits the old-target field read needed to clear the old concept bit. (iv) `alive` L0.5 tax, §0.6. (v) The hybrid's `openRun/submitRun` sequential CAS is the *one* place TR keeps a `StaleStartIndex`, and it is correct to keep it (boundary key check needs the predecessor).

*LSV.* (i) Wholesale `=` word writes are equivalent to `|=` given the hook invariant (EVM serialises the scan and the write), so the "idempotence" argument is neutral; `|=` is the safer of the two if the hook ever has a bug. (ii) Its Type-level "never PARTIAL from genesis" hides the per-(scope, family) registry slot allocation on first placement (the same 110k-Glam tax as H's init). (iii) "Trusted runs for 99% of directories" is a solution looking for a consumer. (iv) The trust ladder (bonded / ZK) is the best-priced statement of what trusting an indexer costs, and worth keeping as the reference for anyone who later proposes one.

*H.* (i) `Unsupported()` for a declared, attached, kernel-maintained scope whose Coverage slot nobody initialised — a naming lie in the safe direction, but a contract pinning a Type-level family over a *new* scope needs a 47k / 135k init before it can read positions the kernel has been maintaining since birth. Fixable at zero write cost: a scope whose kind-10 word-0 ordinal is `> declaredAt` is COMPLETE by construction and needs no slot (one SLOAD on the probe). (ii) Kind-6/kind-1 mix-up, §0.4. (iii) Sorted runs are the weakest of the three. (iv) The 512 cap is wrong under today's layout, right after its own I-8.

## 2. Winner and grafts

**Winner: attach-detach-hybrid**, on the two criteria the owner's question is actually about — "can we rely on it" (a) and "hard to use for devs" (e) — plus the honest cost ledger. Tie on points with TR; H wins because its read ABI is the one that makes the dominant bug class structurally unreachable and its build needs the least machinery.

Grafted from **TR**: the L2 sorted-run design (global key order, `seen` bitmap, pigeonhole completeness, committed vs materialised, LSM increments); the D-D amendment wording; the `IndexPage` union with `covered`/`uncovered` slices as the page-level twin of H's gap-as-item. Rejected from TR: `done` bitmap + epoch (H's frontier dominates), `alive` as L0.5, `scope.mutationOrdinal`, the parameterised strict twin.

Grafted from **LSV**: "a set bit is authoritative at any time" (so `probe` returns `true` for a set bit even in the gap and reverts only on clear-in-gap — fewer reverts, no loss); `pos ≥ scopeCount → revert NotAPosition`; `bits[c]` enumeration at one SLOAD per 256 entries per concept; the trust ladder as the standing price list for any future trusted view. Rejected: trusted-indexer L3 as an MVP layer; permissionless attach; `(Tri, bool)`.

My own additions: §0.2 (binding-key ordinal in kind-10), §0.3 (Type-level declarations in `cacheBytes`; a reserved bit in the scope posting head for scope-level attach), the born-after-`d` no-slot rule, and the chunk-cap correction.

---

# Synthesised memo — EFS v2 index layer: presence total, predicates declared, history crowd-built

## 0. The answer in one paragraph

Yes. Indexes are a separate layer that contracts can rely on, declared after the data exists, built in the background by strangers who contribute only gas, and switched off later — under three rules every surviving production system obeys and the v1 sort overlay only half-obeyed: (1) **hook the write path at declaration, backfill only the past** (F1 write-only, DynamoDB backfilling-with-tracking; on an append-only ledger this needs no side-log because admissions are totally ordered); (2) **one coverage frontier per (family, scope) column in the scope's own kind-10 ordinal units**, advanced only by the kernel after it has itself derived every bit below it; (3) **a contract-facing read that cannot return a bare answer outside coverage** — it reverts (Uniswap `'OLD'`, EIP-2935/4788, Maker `Pot/rho-not-updated`), and the tolerant read has no boolean in it. With those, an unsynced index is exactly as trustworthy as a synced one over the range it claims. The 2026-07-15 ruling survives as "presence is total and automatic" (kind 1/3/4/5/6/8/10 from genesis); the *predicate* families are declared by Type authors (D-D) and, new here, attachable later with a specified, bounded, crowd-payable pass whose incompleteness is typed, never silent. What made the v1 sort scheme complex — client hints, `StaleStartIndex`, per-lens filtering of a shared list, `staleness()` split from `read()` — came from live sorted insertion, not from indexing; bitmaps need none of it, and sorted order becomes a verified snapshot run. Cost, ESTIMATED with the kind-10 payload fix: ≈9.5–15k per backfilled entry (read-bound, unchanged under Glamsterdam), ≈2.6–4.1M / 2.9–4.7M per 256-entry word, ≈100–170M for a 10,000-file directory on either schedule; ≈8–13k / 15–21k extra per placement for writers of an attached Type; ≈6,300 per contract probe.

## 1. The layers

| Layer | Content | Maintained by | Complete? | Who decides / pays |
|---|---|---|---|---|
| **L0 presence** (genesis, mandatory) | admission log; kind-1 per-Type, kind-3 per-record, kind-4 per-principal, kind-5 backlink, kind-6 `(type, role, target)`, kind-8 per-binding history, kind-10 per-(principal, purpose, subject) scope list (`IndexKeys.sol:52-79`; `StateKernel.sol:485-502`) | kernel, every admission | always | 2026-07-15 ruling (`$V/Designs/efsv2/owner-rulings.md:59-60`); cannot be added later (`$V/Reviews/2026-09-02-efs2-coherence-review-corpus/findings-ledger.md:325-329`) |
| **L1 declared families** (attached) | bitmap columns `bits[familyId][scopeKey][bucket][word]` over the kind-10 ordinal; predicate from a closed kernel-evaluable menu | kernel write path from declaration ordinal `d`; history `[0, liveFrom)` backfilled by anyone | exact for covered positions; typed UNCOVERED elsewhere | Type author (default, rides `cacheBytes`) or scope principal; writers pay live, anyone pays history |
| **L2 views** (never attached) | sorted runs and other snapshot structures, each chunk stamped with the basis it was computed at | nobody automatically; anyone builds/refreshes | correct *as of each chunk's basis*; per-position drift checkable | anyone; no write-path cost to anyone |
| **L3 off-chain** | ranked, full-text, global aggregates, open attester sets | Graph / clients | — | 07-15 item 15 (`owner-rulings.md:65`) |

**Reconciliation.** The ruling's teeth are "no per-writer opt-out" and "no half-presence" (`owner-rulings.md:59-60`). L0 keeps both literally. Its corollary "kills the 'is X indexed?' conditional" is narrowed exactly as D-D proposes (`$V/Reviews/2026-09-09-files-browser-mvp/tag-system-2026-09-10.md:244,257-276`): for predicate families the conditional returns, as a typed state, never as an empty result. D-D's stated regret — "cannot add it later without a paid pass" (`:272-273`) — becomes §3. The owner must ratify that narrowing (Decision 1); the memo does not assume it.

**Authorship invariant.** "Anyone may pay, nobody else may author" (`tag-system:156-158`) holds because an L1 column is not the principal's assertion; it is the kernel's deterministic function of the principal's own bindings, in the same class as kind-5/6 postings, and the builder submits no facts (§3). This is ADR-0066's line — discovery may never manufacture placement (`$C/docs/adr/0066-index-discovery-only-no-folder-presence.md:28-42`) — applied to v2. The delegated `implied` fold (`…/tags/design-graph-native.md:147-155`) copies *asserted* bits under a vocabulary's signature and stays a separate mechanism. `alive` is likewise a tag-column need, not this layer's (§0.6).

## 2. Declaration

A family is an immutable record `IndexFamily/1` (`familyId` = record id); contracts pin `familyId` (consumer-tournament rule: effectful consumers pin exact identities).

```
IndexFamily/1 {
  source:    SCOPE(purpose) | TYPE(typeId)        // kind-10 columns per (principal, subject) | one kind-1 column
  predicate: FIELD_EQ(fieldRole) | REF_TARGET(fieldRole) | DIGEST | HEAD_LIVE   // closed, kernel-evaluable, bounded gas
  bucketWidth: uint8                               // bounded concept space; open sets hash to 32 bytes
}
```

**Attach.** Two authorities, one mechanism each:
- **Type author**: the family id is written into the Type's `cacheBytes` (a new Type revision, or an `INDEX_ATTACH(typeId → familyId)` binding whose fold updates the cache). The admission path already loads `cacheBytes` (`StateKernel.sol:354`), so discovery is free. Writers accepted the Type's cost profile by choosing it; cap 8 families per Type (V2-E4, `$V/Open-Decisions.md:50`).
- **Scope principal**, for its own scopes: `INDEX_ATTACH(scopeKey → familyId)`. Discovery costs the kernel one bit in the 64 spare bits of the scope posting head (`StateKernel.sol:559-562`) on first-binding writes and +2,100 per rebind (the head is not otherwise read on rebind); cap 4 per scope.
- **Nobody else.** A stranger who wants a predicate over someone else's scope builds an L2 view, which taxes no writer. Permissionless attach-with-cap (LSV option 3) is rejected: it is a per-write tax anyone can impose and re-impose across generations.

**Per-(family, scope) Coverage slot** `{through u64, liveFrom u64, retiredAt u64, revision u32, state u8}`, one packed slot, allocated **only for scopes that predate `d`**, by the first `backfill` call (paid by the builder: ≈12 cold reads for the binary search + 22,100 / 110,020). A scope whose kind-10 word-0 ordinal is `> d` is COMPLETE by construction: no slot, no init, one extra SLOAD on the probe. This removes the hidden 135k-per-scope Glamsterdam tax that all three designs carried for Type-level families.

**Why attach at declaration, not at completion.** If the hook waits for the backfill to finish, a rebind at an already-backfilled position during the build leaves a stale bit under a watermark that now lies. Hooking at `d` fixes the historical target at `[0, liveFrom)` per scope; hot scopes cannot outrun builders; every covered position is exact at the current head, not "as of a basis".

**Hook cost per placement of an attached Type, ESTIMATED:** target-field read 2,700–8,400 + concept word rewrite 5,000 / 12,100 (fresh once per 256 positions per concept: 22,100 / 110,020, amortised 86 / 430) ≈ **8–13k today / 15–21k Glam**; rebind adds the old-target field read and a clear: ≈16–27k / 30–42k. This is the price the 07-15 ruling's "writers cannot opt out" carries; it is why attach authority is limited and why detach exists.

## 3. Build — the chunked backfill

```solidity
function backfill(bytes32 familyId, bytes32 scopeKey, uint64 expectedThrough /* NONE = no guard */, uint16 maxEntries)
    external returns (uint64 through, uint64 liveFrom, uint8 state);
```

Inputs are a scope, an optional guard and a size. **Nothing from calldata becomes state.** Per position `i` in `[through, min(liveFrom, through + maxEntries))`: kind-10 word (420 amortised) → `bindingKeys[n]` (2,100) → `bindings[key]` (4,200) → if tombstoned, no bit; else target record's predicate field (2,700 SSTORE2 / 4,200–8,400 slots) → `bits[F][S][bucket][i/256] |= 1 << (i%256)` (OR, never XOR — Uniswap `flipTick` is the counterexample). Then `through = end; revision++`; `end == liveFrom ⇒ state = COMPLETE`. No aggregates are stored (beacon-deposit frontier rule, `$V/Reviews/2026-09-09-files-browser-mvp/gas-engineering-2026-09-10.md:222-248`, 50,462 vs ~228,000 MEASURED).

The walk *is* the ordinal verification the tag memo makes mandatory (`tag-system:158-161`): the contract chose the ordinal, so there is no claimed bit to verify. This is v1's "fabricated UIDs rejected" (`$C/specs/07-Sort-Overlay-Architecture.md:289`) and TornadoTrees' per-leaf `require` generalised, minus the SNARK because the source is local state.

**Convergence.** Bit = predicate(current head), maintained by the hook from `d+1` at *every* position including unbackfilled ones. Rebind before backfill: hook sets the new bucket, clears the old (no-op); backfill later ORs the same bit (warm 100). Rebind after: hook clears old, sets new. Every interleaving converges; no ordering between hook and backfill matters; ordering within the backfill is contiguous by construction.

**Races.** No guard: two builders in one block both succeed on *consecutive* chunks — zero wasted gas, and the same throughput TR's `done` bitmap buys with an extra SLOAD per probe and an epoch mechanism. With guard: the loser reverts after two SLOADs (≈30k). This is strictly better than v1's `expectedStartIndex` (`$C/packages/hardhat/contracts/EFSSortOverlay.sol:221-227`), which existed only because v1 callers supplied items and hints tied to positions.

**Chunk cap.** With the kind-10 payload fix: 9.5–15k per entry ⇒ **512 entries ≈ 5.0–7.9M today / 5.3–8.5M Glam** incl. up to 6 fresh concept words per 256; cap 512. Under today's layout (§0.2): 30–60k per entry ⇒ cap **256** (7.7–15.4M) and even that is envelope-size dependent — a reason the kind-10 decision precedes `initialize()`. 10,000 files ≈ 20 transactions ≈ 100–170M either schedule (reads dominate ≈95%). Every retroactive family is a multi-transaction crowd job by construction.

## 4. Watermark and trust

Position `i` in scope `S` is **covered** iff `i < through` (backfilled, exact from then on) or `i ≥ liveFrom` (born after `d`, maintained from birth). A **set bit is authoritative at any time** (LSV's contribution): it was written by the hook or the backfill from the current head and every later rebind updates it. Only a *clear* bit in `[through, liveFrom)` is UNKNOWN.

```solidity
// the ONLY function returning a bare bool; the bool is unreachable outside coverage
function probe(familyId, scopeKey, bucket, position) view returns (bool hit);
//   position ≥ scopeCount → revert NotAPosition
//   bit set               → true (any coverage state, unless retired)
//   bit clear, covered    → false
//   bit clear, uncovered  → revert Uncovered(position, through, liveFrom)
//   retired               → revert Frozen(retiredAt)
//   family/scope unknown  → revert Unsupported()

enum Tri { HIT, MISS_COVERED, UNCOVERED, UNSUPPORTED, FROZEN }
function probeTolerated(...) view returns (Tri, Coverage memory);     // no bool anywhere

function page(familyId, scopeKey, bucket, cursor, maxItems, basisOrdinal) view
    returns (PageResult memory, Coverage memory);                     // StateAuditPages.sol:14-34 shape;
    // COMPLETE iff through == liveFrom; else PARTIAL with [through, liveFrom) explicit; cursor commits revision
```

Cost: coverage slot (or kind-10 word 0 for born-after-`d` scopes) 2,100 + scope head 2,100 + bit word 2,100 = **≈6,300**. `Completeness` stays four-valued; Core never emits UNKNOWN (`$V/Reviews/2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md:1321-1366`; `$V/Designs/efsv2/system-constitution.md:207-209`). Under a Lens of *k* principals, *k* columns, composite completeness = minimum (`$V/Designs/efsv2/lens-spec.md:62`); merged `ABSENT_PROVEN` needs every column COMPLETE at one basis (`$V/Designs/efsv2/disposable-mvp-profile.md:626-630`). Watermarks are spine ordinals, never max-seen heads (`$V/Reviews/2026-07-10-fs-pass-corpus/attack-boundary-os.md:74-78`).

**Staleness pinning.** L1 covered bits have no staleness — there is nothing to pin, and no tolerance parameter exists to misuse (the Maker `require(now == rho)` shape, not a caller-supplied `minBasis` that can be zeroed). L2 views: each chunk carries `basisOrdinal`; a contract that must know a snapshot bit is *current* adds one head read, `head(position).admissionOrdinal ≤ chunk.basis` (4,200) — verify-don't-compute at read time, no per-scope counter.

**Read-through.** A contract is never stuck on an uncovered position: it may walk the one position itself at the §3 per-entry cost (ENSRegistryWithFallback shape). The browser does the same over the gap via multicall at a pinned `blockTag`.

## 5. Turn off

`announceDetach(familyId)` at admission ordinal A; effective at A + Δ (Δ ≈ 2^16 admissions) so pinned consumers can migrate; then `Family.retiredAt` = one rewrite (5,000 / 12,100), the hook stops, coverage freezes. `probe` reverts `Frozen`; `probeTolerated`/`page` return FROZEN with the frozen interval so inert readers keep history. **Re-attach is a new `familyId`** (a reused id would put a hole in the middle of "covered"). Bits are **never cleared**: a reader that missed the retirement stamp would read zeroed words as proven absence, and EIP-3529 caps the refund at gas_used/5 anyway (`$V/Reviews/2026-09-09-files-browser-mvp/research-2026-09-10/indexing.md:9`). The v1 defect to design against: `getSortStaleness` returns 0 for an unknown or revoked sort (`EFSSortOverlay.sol:623-624`) while the SDK documents 0 as "fully sorted" (`$V/Designs/sdk-architecture.md:623-624`) — a retired family must read FROZEN, never complete-and-empty. Not scary: reserve `retiredAt` in the slots at genesis (free), ship the operation whenever convenient.

## 6. Sorted views — the owner's v1 crowd-built sort, re-homed (TR's design, H's drift check)

v1's `processItems` was right about verify-don't-compute, kernel-validated membership and a per-list watermark (`spec 07:97-109,169-179`) and wrong about being a *live* linked list: 68–127k per insert (QUOTED in the brief), never shrinks (`sdk-architecture.md:566-568`), caller-supplied comparators that OOG (`$C/docs/FUTURE_WORK.md:552-566`), one node per entry (110k each under Glam). Sorted order is an **L2 snapshot run over a frozen basis**:

```
openRun(scope, sortDecl)                                   // anyone; basis = (scopeCount, admissionOrdinal); epoch++
submitRun(scope, sortDecl, epoch, k, uint32[] ordinals)    // k == nextChunk (CAS — the one place it survives), |ordinals| ≤ 256
```
Per item the kernel reads the key from the current head (the §3 walk), checks `key[j] ≤ key[j+1]` within the chunk and `lastKey[k−1] ≤ key[0]` at the boundary, sets `seen[epoch][o]` (duplicate ⇒ revert; `o ≥ basis` ⇒ revert). When `k·256 ≥ basis`: `basis` items, no duplicates, all `< basis` ⇒ a permutation by pigeonhole — membership proved in O(n) with no sort. No hints: with a frozen basis and sequential output there is nothing to insert into. Two storage forms: **committed** (`keccak(ordinals)` per chunk, 22,100 / 110,020; contracts verify supplied calldata at ≈42/word) — the default — and **materialised** (8 ordinals per word, +707k / +3.52M per chunk) for contracts needing in-tx top-N. Per 256 entries ESTIMATED: committed ≈2.5–3.9M / 2.6–4.0M. Increments = a new run over `[b, b')` (LSM level); readers k-way merge at the pinned basis; a compacted run over `[0, b')` verifies the same way. Rebinds after a run's basis are detectable per position (`head.admissionOrdinal > run.basis`) and excluded at read or fixed by `refreshRun`. Lens-level sorted listings over *k* principals stay a client or small-*k* contract merge ("accelerators, never truth", `$V/Reviews/2026-07-11-efsv2-lens-architecture-and-scale-review.md:1020-1035`; D-9 choice A assumed, unruled, `$V/Designs/efsv2/human-overview.md:453-455`). No trusted-indexer runs at MVP: the browser sorts locally for free and a contract cannot use an unverified run; the shape (a record with a basis) stays so a proof or bond can attach later at the prices in LSV's trust ladder (Groth16 ≈220–250k per proof QUOTED EIP-1108; bonded claim ≈60–150k + window).

## 7. Cost sharing

| Act | Payer | Today / Glam (ESTIMATED unless noted) | Bounded |
|---|---|---|---|
| Declare family | declarer | one record admission | yes |
| Attach (Type revision or binding) | Type author / scope principal | one admission; scope-level +2,100 per rebind thereafter | ≤ 8 per Type, ≤ 4 per scope |
| Coverage slot (pre-`d` scopes only) | first builder | ≈47k / ≈135k | per scope, once |
| Backfill, 512 entries | anyone | ≈5.0–7.9M / 5.3–8.5M (post kind-10 fix); 256 entries ≈7.7–15.4M under today's layout | by `maxEntries` |
| Live maintenance per placement per family | writer | ≈8–13k / 15–21k; rebind ≈16–27k / 30–42k | yes |
| Probe | reader | ≈6,300 | yes |
| Page, 256 positions, one concept | reader | 2,100 per word (+ hydration per hit) | by page |
| Sorted run, 256 entries, committed | anyone | ≈2.5–3.9M / 2.6–4.0M | yes |
| Detach | authority | 5,000 / 12,100 | yes |

**Bounties**: out of the kernel; optional overlay escrow paying `msg.sender` pro rata per entry advanced (Synthetix SIP-11 lesson: permissionless keepers, pay first-lander, no penalties). Default none; the files browser's "build next chunk" button spends the user's gas as `efs.sorts.process` did (`sdk-architecture.md:626-635`).

**Exploits.** *Poisoning* — impossible (no claims in L1; runs verified against keys and position set). *Ordinal mismatch* — n/a, the contract chose the ordinal. *Stalling* — impossible; `liveFrom` fixed at `d`, any advance is permissionless. *Front-running* — the victim does the next chunk (no guard) or reverts at ≈30k (guard); a bounty goes to whoever did the work. *Troll declarations* — cost the declarer; touch no write path unless attached by an authority. *Attach griefing* — authority-gated and capped. *Reader-side* — a contract using `probeTolerated` and treating UNCOVERED as false: no bool exists on that path; the SDK union has no `false` member. *Sentinel collision* (Compound Proposal 62, ~$80–90M) — the coverage slot disambiguates and the reverting probe forces its use. *Thin-basis aggregates* (Inverse, $15.6M) — counts exist only through `page`, which carries coverage; no stored aggregates. *Detach stranding* — Δ window plus read-through fallback.

## 8. DX, and what is not possible

```ts
const fam = await efs.index.declare({ type:'File/1', name:'byMediaType', source:'scope', predicate:{ fieldEq:'mediaType' }, attach:true }); // Type author's key
await efs.index.build(fam.id, scope('alice', DIRECTORY, '/photos'), { maxGasPerTx: 8_000_000, onProgress });   // anyone; absorbs StaleWatermark
const cov = await efs.index.coverage(fam.id, scopeKey);   // { state:'BACKFILLING', through:1536, liveFrom:4000, retiredAt:null, headCount:4012, revision:3 }
const r = await efs.index.probe(fam.id, scopeKey, 'image/png', 77);
// { kind:'hit' } | { kind:'miss' } | { kind:'uncovered', through, liveFrom } | { kind:'unsupported' } | { kind:'frozen', retiredAt }
for await (const item of efs.index.read(fam.id, scopeKey, 'image/png', { basis })) {
  // { kind:'entry', position, recordId } | { kind:'uncovered', from, to }   — the gap is an item, not a skip
}
```
Contract rule, one sentence: *if you act on the result, call `probe`; if you display it, call `probeTolerated` and render the gap.*

**Not possible, plainly.** (1) Crowd-built *and* complete at every block *and* free for writers — pick two; writers pay live from `d`, views lag. (2) Any family over an L0 list not mandatory from genesis — kind 1/3/4/5/6/8/10 and the kind-10 payload must be frozen before `initialize()`. (3) Predicates outside the kernel-evaluable menu (full-text, ranking, closure over unreleased vocabularies, open attester sets) — proofs or off-chain. (4) History: "is it PNG now", never "was it PNG at block B" (`$V/Reviews/2026-09-09-files-browser-mvp/indexing-and-state-2026-09-10.md:180-187`). (5) A sorted view current under rebinds without refresh. (6) Storage reclamation. (7) A Lens over an open placer set: there is no per-directory placer roster among kinds 1–10 (`IndexKeys.sol:52-79`); "all principals who placed into D" has no on-chain answer today. (8) A sparse family answering "applicable but not X" — `MISS_COVERED` means "not X or not of this Type"; AND with a kind-1/`TYPE_IS` check if it matters.

## Worked example — `/photos`, 10,000 files, "by media type" six months later

12 principals placed 10,000 `File/1` records into D (P1 = 4,000 positions … P12 = 50); no media-type family was declared.

| t | Event | Payer | Gas (today / Glam, ESTIMATED) | Readers see |
|---|---|---|---|---|
| t0 | six months of placements | writers | unchanged | `probe → Unsupported()`; browser filters by hydrating (read-through) |
| t1 = `d` | `File/1` author admits `IndexFamily/1{SCOPE(DIRECTORY), FIELD_EQ(mediaType)}` = **F** and revises the Type's `cacheBytes` | author | 1 record + 1 Type revision | family exists; all 12 pre-`d` scopes lack Coverage slots → `probe` reverts `Uncovered(i, 0, ?)` after reading kind-10 word 0 (ord < d) |
| t1+ | every `File/1` placement anywhere sets `bits[F][scope][mediaType]` | writers | +8–13k / +15–21k per placement | positions ≥ `liveFrom` authoritative immediately; set bits anywhere authoritative |
| t2 | A runs `build(F, P1)`: init (binary search → `liveFrom = 4,000`), 8 chunks of 512 | A | ≈47k / ≈135k + 8 × 5–8M ≈ 40–65M | P1 `through` 512 → … → 4,000; `probe(F,P1,png,77)` reverts until chunk 1, then answers |
| t2 | B and C split P2…P12; both send `build(F, P5, expectedThrough=0)` in one block: B lands 0→512, C reverts `StaleWatermark(512)` (≈30k), resends with no guard → 512→1,024 | B, C | 11 inits ≈0.5M / ≈1.5M; ≈12 chunks ≈60–100M | per-scope watermarks advance independently |
| t2 mid | `Gallery.sol` asks "P3 item 77 PNG?" at P3 `through=0`; the bit happens to be set (P3 rebound 77 to a PNG yesterday) | contract | 6,300 | `true` — authoritative (hook wrote it). Same call on a clear bit → `Uncovered` → Gallery reverts or walks position 77 itself (≈10–15k) |
| t2 mid | browser lists PNGs under a 12-principal Lens at pinned `blockTag` | eth_call | 12 coverage reads + words | entries for covered ranges + `{kind:'uncovered', from, to}` items; "index building: 7,168 of 10,000 historical items covered"; never an empty list |
| t2 | P7 rebinds position 12 PNG→JPEG at P7 `through=8` | P7 | +16–27k / +30–42k | hook clears png 12 (no-op), sets jpeg 12; backfill later re-derives JPEG (warm 100) |
| t3 | all scopes reach `through == liveFrom` | — | total ≈100–170M either schedule | COMPLETE; 12-principal Lens probe ≈76k in-tx; `page` COMPLETE at basis H |
| t4 | new principal P13 places 40 files | P13 | bits written on placement | **no init needed**: kind-10 word 0 ord > d ⇒ COMPLETE by construction; `probe` answers at once |
| t5 | author announces detach at A, effective A+Δ | author | 5,000 / 12,100 | after A+Δ writers stop paying; `probe` reverts `Frozen`; Gallery is already on its fallback; frozen column readable as history |
| t6 | "newest first" for a top-N contract | anyone | 40 committed runs ≈2.5–3.9M each | L2 run at basis (10,317, ord); contract verifies a supplied chunk against its hash; drift per position via one head read |

What the strangers could never do: put a bit where the head disagrees, make a MISS look proven, block each other, or make P7's column say something P7 did not bind.

## Decisions for the owner

| # | Decision | Recommendation | Cheapest reversible default | Etched? |
|---|---|---|---|---|
| 1 | Narrow 07-15: presence (L0) total and automatic; predicate families declared (D-D) and attachable later with typed coverage — the "is X indexed?" conditional returns, typed | **Ratify**; amend D-D with the TR wording: "Kinds 1/3/4/5/6/8/10 always on. Other families are declared as records; the Type definition attaches bounded-concept families (writers pay); a principal may attach to its own scopes; anyone may pay to backfill history; the kernel reports the covered interval; strict readers revert outside it." | none — this is the ruling | ruling |
| 2 | Kind-10 payload = binding-key ordinal (not admission ordinal) | **Yes** (§0.2): walk 30–60k → 9.5–15k per entry, on every scope enumeration too | — | **yes, precedes `initialize()`** |
| 3 | Attach at declaration (write-only from `d`), never at completion | **Yes** (rebind-correctness bug otherwise) | — | yes (write-path semantics) |
| 4 | Attach authority: Type author via `cacheBytes` (free discovery) + scope principal via a reserved head bit (+2,100/rebind); no permissionless attach | **Yes** | ship Type-author only; scope-level additive | head bit: yes |
| 5 | Coverage slot only for pre-`d` scopes; born-after-`d` scopes COMPLETE by construction | **Yes** — removes the 135k-per-scope Glam tax | — | probe ABI: yes |
| 6 | Read ABI: reverting `probe` is the only bool; set bit → true regardless of coverage; tolerant path has no bool; `page` commits `revision` | **Yes** — the entire safety argument | — | ABI: yes |
| 7 | Build: contiguous frontier, optional guard, `maxEntries` cap 512 after #2 (256 before) | **Yes**; no `done` bitmap, no epoch | tunable constants | no |
| 8 | Predicate menu | `FIELD_EQ` first; `REF_TARGET`, `DIGEST`, `HEAD_LIVE` additive | `FIELD_EQ` only | additive |
| 9 | Detach: reserve `retiredAt` at genesis; two-step operation later; deletion never | **Reserve now** | reserve only | field: yes |
| 10 | Sorted views: L2 global-order runs (TR), committed by default, materialised on demand; no live sorted structures; confirm D-9 choice A | **Yes**, post-MVP | none for MVP | no |
| 11 | `alive` as a genesis-mandatory kernel family | **No** for the index layer; it is the tag system's `HEAD_LIVE` family, decided there | — | if made mandatory: yes |
| 12 | Per-scope mutation counter | **No**; per-position `head.admissionOrdinal` check suffices | — | would be Etched |
| 13 | Caps: 8 families per Type, 4 per scope | **Yes** | constants | no |
| 14 | Bounties | out of kernel, none at launch | none | no |
| 15 | Per-directory placer roster (so a contract can enumerate a directory's Lens candidates) | **Decide**: it is absent from kinds 1–10 and cannot be added later | — | yes |

## Where I pushed back on the owner's framing

1. **"Add post-definition, populate in the background, then rely on it" — the on-chain order is attach first, backfill second.** All three architects converge on this and it is not a style choice: hooking after the backfill lets a rebind during the build leave a stale bit under a watermark that claims exactness. Epic's order worked because a trusted DBMS reconciled a side-log; here nobody is trusted and the ledger's total order makes reconciliation unnecessary *only* if the hook is live before the first chunk.
2. **"It could also be out of date" — for attached predicate families that state does not exist.** The states are covered / uncovered / frozen. "Out of date" survives only for L2 views, where it must be measurable per position (one head read) and where an effectful contract may never read without a basis gate. Note that Compound-`Stored`-style "stale but correct as of its stamp" does *not* hold for a sorted run under rebinds unless per-position checked — the v1 overlay's "possibly out of date" was the dangerous kind.
3. **"Unsynced indexes are untrustworthy and hard to use" — true in exactly six cases, each with a structural fix, and v1 had two of them.** (i) Any read returning a bare bool or empty list without coverage (v1: `staleness()` split from `read()`). (ii) Aggregates over a partial column (Inverse class). (iii) A Lens over *k* principals with one column behind — merged absence must be UNKNOWN. (iv) A view read for an effectful decision without a basis bound. (v) A detached family read as current (v1: revoked sort reads staleness 0 = "fully sorted", `EFSSortOverlay.sol:623-624`). (vi) A sparse family's MISS read as "not X" when it means "not this Type". The fixes are all in §4–§5; with them the trust argument is the same one PostgreSQL, F1, DynamoDB and Cassandra make.
4. **"Everyone shares the cost" — only the history is shareable.** Live maintenance is the writer's from `d` on, ≈8–13k / 15–21k per placement per family, and a Type author's attach taxes writers who never asked. That is the real price of the 07-15 "no opt-out" rule and it should be said plainly rather than hidden behind "anyone can pay".
5. **"Turn off is scary" — no; deleting is.** `retiredAt` reserved at genesis is free and the operation is one rewrite. Clearing words is the only scary act (a reader that misses the stamp reads zeros as proven absence) and it does not even pay under EIP-3529. Never ship it.
6. **"The v1 sort design was complex" — the complexity was live insertion, not crowd-building.** Hints, `StaleStartIndex`, `InvalidPosition`, comparator OOG and per-lens filtering of one shared list all come from inserting into a linked list on every write. A snapshot run verified in O(n) with a pigeonhole completeness check needs none of them and keeps everything the owner liked: anyone pays, chunk by chunk, a watermark says how far it got.
7. **The Epic analogy has one part that does not transfer: free, trusted, low-priority background CPU.** Blockspace has no priority lane and the builder is untrusted, so the contract must re-derive every entry from kernel state (≈9.5–15k each after Decision 2). That rules out accepting a client-computed index at any price short of a ZK proof (≈220–250k per proof, circuits EFS does not have) — but it also means there is no reconciliation machinery to get wrong, which is where PostgreSQL 14.0–14.3 (index marked valid but incomplete, release notes 2022-06-16) and DynamoDB (ACTIVE index silently missing key-violating items) failed with trusted builders.
8. **"Some design space, possibly vast" — it collapses to two axes.** Who may attach (Type author / scope principal / nobody else) and whether the read reverts outside coverage. Every other choice (chunk size, done-bitmap vs frontier, epoch, bounties, mutation counters) is a constant or an overlay. The one Etched item the owner has not been asked about is the kind-10 payload (Decision 2); it moves every scope walk by 3–4× and is the reason the three memos' cost tables disagree.

## Could not be found / not verified

- No owner ruling on D-9 (sorted pages) or on who pays lens-registration/late-index backfill (`indexing-and-state-2026-09-10.md:445-446`; `…/research-2026-09-10/synthesis.md:214`) — this memo answers both (Decisions 10, 4) but they are unruled.
- No vault design of turning an index off beyond D-D's one line and F4's `retiredAtBasis` (`b0-indexes.md:1925-1931`).
- The envelope-size term in §0.2 (whole-`bytes` load of `canonicalUnsignedEnvelope`) is bounded, not measured; the 30–60k per-entry figure under today's layout is ESTIMATED and envelope-size dependent. Whether the binding admission path already loads the *target* record's body (which would make the hook's field read free) was not traced.
- Glamsterdam pricing for code deposit (affects any SSTORE2 body or committed-run variant), EIP-8037/8038 refund rules, Brevis per-callback gas, Lagrange status, and any Epic/EOS primary source — none found (per the research strands).
- No deployed contract reaches provable completeness for a later-added index without per-chunk verification against the source or a proof (onchain strand §5) — which is why this design walks rather than accepts claims.