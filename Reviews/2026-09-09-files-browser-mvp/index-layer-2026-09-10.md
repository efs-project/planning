# Index layer — can indexes be declared later, crowd-built, and still relied on?

**Status:** experiment document on the files-browser branch; not a design and
not a ruling. Written 2026-09-10 by the integration-test-lead in answer to the
owner's question: *"could we have indexes be a separate layer while still
possibly being able to rely on them? … we also found we needed new indexes
later so had to add them post-definition and then populate them in the
background … For v1 I did some design work on sorting which allows someone to
add a new sort for a list / directory and anyone could pay the gas to do a
chunk of computation to build the sort until its complete … Maybe we could do
something similar for indexes? … please push back if you want to."* Companion
to [indexing-and-state-2026-09-10.md](indexing-and-state-2026-09-10.md) and
[tag-system-2026-09-10.md](tag-system-2026-09-10.md); it resolves that
document's pending D-D into one question (§11). Every figure carries
**MEASURED**, **QUOTED** or **ESTIMATED**.

**Provenance.** Three research strands (vault survey of the v1 sort overlay
and the Stage-A F4 coverage machine; database prior art; on-chain prior art),
three architect memos (trustless recompute, lens-scoped views, attach/detach
hybrid) and an adversarial judge, all verbatim in
[research-2026-09-10/index-layer/](research-2026-09-10/index-layer/). The
judge opened by correcting six kernel facts that all three architects had
wrong; **I verified all six at the cited lines** before writing this:

1. Posting words pack **five 48-bit ordinals per slot** (`wordIndex = count/5`,
   `shift = 48·(count%5)`, [StateKernel.sol:569-573](../2026-09-05-c0-core/src/StateKernel.sol);
   read side [StateReadPrimitives.sol:61](../2026-09-05-c0-core/src/StateReadPrimitives.sol)).
   A scope-list read amortises to ≈420 gas per entry.
2. The kind-10 scope entry carries **only the admission ordinal** of the
   position's first binding, not a binding key ([StateKernel.sol:485-491](../2026-09-05-c0-core/src/StateKernel.sol)),
   and the global binding-key ordinal (`p.count.bindingKeys`) is assigned at
   the same instant, so it is monotonic and could ride in that word instead.
3. `TypeRow.cacheBytes` is loaded on every admission
   ([StateKernel.sol:354](../2026-09-05-c0-core/src/StateKernel.sol), `:524`),
   so a Type-level family declaration is discoverable by the write path for
   zero extra reads.
4. The posting head is `count 64 | live 64 | last 48 | flags 16` = 192 bits; 64
   spare; a rebind does not touch the scope head.
5. Per-Type enumeration is kind 1; kind 6 is `(type, role, target)`
   ([IndexKeys.sol:53,62](../2026-09-05-c0-core/src/IndexKeys.sol)).
6. `BindingFold.Head` carries `admissionOrdinal` and `revision`
   ([BindingFold.sol:18-26](../2026-09-05-c0-core/src/BindingFold.sol)), so
   "changed since basis B?" is one head read; no per-scope mutation counter is
   needed.

---

## 0. The answer in one paragraph

Yes. Indexes can be a separate layer, declared after the data exists, built in
the background by strangers who contribute only gas, switched off later, and
still relied on by contracts — under three rules that every surviving
production system obeys and that the v1 sort overlay half-obeyed: **(1) hook
the write path at declaration and backfill only the past** (PostgreSQL's
`indisready`, F1's write-only state, DynamoDB's backfill tracking; on an
append-only ledger this needs no side-log, because admissions are totally
ordered); **(2) one coverage frontier per (family, scope) column, in the
scope's own ordinal units, advanced only by the kernel after it has itself
derived every bit below it**; **(3) a contract-facing read that cannot return
a bare answer outside coverage** — it reverts, like Uniswap's `'OLD'` and
EIP-2935's miss — while the tolerant read has no boolean in it at all. Under
those rules an unsynced index is exactly as trustworthy as a synced one over
the range it claims. What made the v1 sort scheme complex — client hints,
`StaleStartIndex`, per-lens filtering of a shared list, `staleness()` split
from `read()` — came from *live sorted insertion*, not from crowd-building;
bitmap families need none of it, and sorted order becomes a verified snapshot
run.

---

## 1. Corrections to what I said in chat earlier today

- **"When the backfill reaches the head, the family attaches to the write
  path."** Wrong order. Attach at *declaration*: the hook is live from the
  declaration ordinal `d`, and the backfill covers only `[0, liveFrom)`. If the
  hook waited for completion, a rebind at an already-backfilled position
  during the build would leave a stale bit under a watermark that claims
  exactness. All three architects and every database converge on hook-first;
  Epic's populate-then-rely order worked because a trusted DBMS reconciled a
  side-log, and here nobody is trusted.
- **"≈10–15k per backfilled record."** Under today's kernel layout it is
  **≈30–60k** (ESTIMATED, envelope-size dependent): the kind-10 entry holds only
  an admission ordinal, so reaching a position's current binding walks
  admission row → whole envelope bytes → record body → position key → binding
  key → binding. The 9.5–15k figure holds only after the kind-10 payload
  change in §11 (Etched, must precede `initialize()`). This is why the three
  memos' cost tables disagreed.
- **"It could also be out of date."** For attached predicate families that
  state does not exist; the states are *covered / uncovered / frozen*. "Out of
  date" survives only for snapshot views (sorts), where it is measurable per
  position with one head read.
- **"Everyone shares the cost."** Only the *history* is shareable. Live
  maintenance from `d` on is the writer's, ≈8–13k today / 15–21k Glamsterdam
  per placement per family (ESTIMATED), and a Type author's attach taxes
  writers who never asked. That is the real price of the July "no opt-out"
  rule and should be said plainly.

---

## 2. The layers

| Layer | Content | Maintained by | Complete? | Who decides / pays |
| --- | --- | --- | --- | --- |
| **L0 presence** (genesis, mandatory) | admission log; kinds 1, 3, 4, 5, 6, 8, 10 | kernel, every admission | always | 2026-07-15 ruling; **cannot be added later** |
| **L1 declared families** (attachable) | bitmap columns `bits[family][scope][bucket][word]` over the kind-10 ordinal; predicate from a closed kernel-evaluable menu (`FIELD_EQ` first; `REF_TARGET`, `DIGEST`, `HEAD_LIVE` additive) | kernel write path from `d`; history backfilled by anyone | exact for covered positions; typed UNCOVERED elsewhere | Type author (rides `cacheBytes`) or scope principal; writers pay live, anyone pays history |
| **L2 views** (never attached) | sorted runs and other snapshot structures, each chunk stamped with its basis | nobody automatically; anyone builds or refreshes | correct as of each chunk's basis; drift checkable per position | anyone; no write-path cost |
| **L3 off-chain** | ranked, full-text, global aggregates, open attester sets | Graph / clients | — | 2026-07-15 item 15 |

**Reconciliation with 2026-07-15.** The ruling's teeth are "no per-writer
opt-out" and "no half-presence". L0 keeps both literally. Its corollary — "the
'is X indexed?' conditional is killed" — is narrowed exactly as D-D proposed:
for *predicate* families the conditional returns as a typed state, never as an
empty result. D-D's stated regret ("cannot add it later without a paid pass")
becomes §4. The owner ratifies the narrowing in §11; nothing here assumes it.

**Authorship invariant.** "Anyone may pay, nobody else may author" holds
because an L1 column is not the principal's assertion; it is the kernel's
deterministic function of the principal's own bindings, in the same class as
the kind-5/6 postings, and the builder submits no facts (§4). This is
ADR-0066's line — discovery may never manufacture placement — applied to v2.

---

## 3. Declaration and attach

A family is an immutable record `IndexFamily/1 {source: SCOPE(purpose) |
TYPE(typeId); predicate; bucketWidth}`; contracts pin its record id
(consumer-tournament rule: effectful consumers pin exact identities).

Two attach authorities, one mechanism each, and nobody else:

- **Type author**: the family id is written into the Type's `cacheBytes` (a
  Type revision, or an `INDEX_ATTACH(type → family)` binding whose fold
  updates the cache). Discovery is free because the admission path already
  loads it (fact 3). Writers accepted the Type's cost profile by choosing it.
  Cap 8 per Type.
- **Scope principal**, for its own scopes: `INDEX_ATTACH(scope → family)`,
  discovered through one reserved bit in the 64 spare bits of the scope
  posting head; +2,100 per rebind (the head is not otherwise read on rebind).
  Cap 4 per scope.
- **Nobody else.** A stranger who wants a predicate over someone else's scope
  builds an L2 view, which taxes no writer. Permissionless attach is rejected:
  it is a per-write tax anyone could impose and re-impose.

**Coverage slot** `{through, liveFrom, retiredAt, revision, state}` — one
packed slot per (family, scope), allocated **only for scopes that predate
`d`**, by the first backfill call (≈47k today / ≈135k Glamsterdam, paid by
the builder). A scope born after `d` is COMPLETE by construction: its kind-10
word 0 carries an ordinal `> d`, so no slot, no init, one extra SLOAD on the
probe. This removes a hidden per-scope tax all three architects carried.

**Hook cost per placement of an attached Type** (ESTIMATED): target-field read
2,700–8,400 + concept word rewrite 5,000 / 12,100 (fresh once per 256
positions per concept, amortised 86 / 430) ≈ **8–13k today / 15–21k
Glamsterdam**; a rebind adds the old-target read and a clear, ≈16–27k /
30–42k.

---

## 4. Build — the chunked backfill

```solidity
function backfill(bytes32 familyId, bytes32 scopeKey,
                  uint64 expectedThrough /* NONE = no guard */, uint16 maxEntries)
    external returns (uint64 through, uint64 liveFrom, uint8 state);
```

Inputs are a scope, an optional guard and a size. **Nothing from calldata
becomes state.** For each position in `[through, min(liveFrom, through +
maxEntries))` the contract reads the scope word (≈420 amortised), the binding
key and head, and — if not tombstoned — the target record's predicate field,
then ORs one bit (never XOR: Uniswap's `flipTick` is the counterexample). It
then advances `through` and bumps `revision`; `through == liveFrom` sets
COMPLETE. No aggregates are stored (the beacon-deposit frontier rule,
50,462 vs ~228,000 MEASURED). The walk *is* the ordinal verification the tag
document makes mandatory: the contract chose the ordinal, so there is no
claimed bit to verify — v1's "fabricated UIDs rejected" generalised.

**Convergence.** A bit equals `predicate(current head)`, maintained by the hook
from `d` at every position including unbackfilled ones. Rebind before
backfill: hook sets the new bucket, clears the old (no-op); backfill later ORs
the same bit (warm, 100). Rebind after: hook clears old, sets new. Every
interleaving converges.

**Races.** Without a guard, two builders in one block succeed on
*consecutive* chunks — no wasted gas. With a guard the loser reverts after
two SLOADs (≈30k). Strictly better than v1's `expectedStartIndex`, which
existed only because v1 callers supplied items and hints tied to positions.

**Chunk cap.** After the kind-10 payload change: 9.5–15k per entry ⇒ **512
entries ≈ 5.0–7.9M today / 5.3–8.5M Glamsterdam**. Under today's layout: cap
256 at 7.7–15.4M, envelope-size dependent. A 10,000-file directory is ≈20
transactions, ≈100–170M gas on either schedule (reads dominate ≈95%). Every
retroactive family is a multi-transaction crowd job by construction.

---

## 5. Watermark and trust

Position `i` in scope `S` is **covered** iff `i < through` (backfilled) or
`i ≥ liveFrom` (born after `d`). **A set bit is authoritative at any time**
(the lens-scoped memo's contribution): it was written by the hook or the
backfill from the current head, and every later rebind updates it. Only a
*clear* bit in `[through, liveFrom)` is unknown.

```solidity
// the ONLY function returning a bare bool; the bool is unreachable outside coverage
function probe(familyId, scopeKey, bucket, position) view returns (bool hit);
//   position ≥ scopeCount → revert NotAPosition
//   bit set               → true (any coverage state, unless retired)
//   bit clear, covered    → false
//   bit clear, uncovered  → revert Uncovered(position, through, liveFrom)
//   retired               → revert Frozen(retiredAt)
//   unknown family/scope  → revert Unsupported()

enum Tri { HIT, MISS_COVERED, UNCOVERED, UNSUPPORTED, FROZEN }
function probeTolerated(...) view returns (Tri, Coverage memory);   // no bool anywhere
function page(familyId, scopeKey, bucket, cursor, maxItems, basisOrdinal) view
    returns (PageResult memory, Coverage memory);   // COMPLETE iff through == liveFrom; cursor commits revision
```

Probe cost ≈ **6,300** (coverage slot or kind-10 word 0, scope head, bit
word). The existing four-valued `Completeness` is unchanged and Core still
never emits UNKNOWN; under a Lens of *k* principals the composite is the
minimum over *k* columns, and merged `ABSENT_PROVEN` needs every column
COMPLETE at one basis. There is no staleness parameter for L1 to misuse (the
Maker `require(now == rho)` shape, not a caller-supplied `minBasis` that can be
zeroed). A contract is never stuck on an uncovered position: it may walk that
one position itself at the §4 per-entry cost (the `ENSRegistryWithFallback`
shape); the browser does the same over the gap by multicall at a pinned block.

Contract rule, one sentence: *if you act on the result, call `probe`; if you
display it, call `probeTolerated` and render the gap.*

---

## 6. Turn off

`announceDetach(familyId)` at admission ordinal A, effective at A + Δ
(Δ ≈ 2^16 admissions) so pinned consumers can migrate; then `retiredAt` is one
rewrite (5,000 / 12,100), the hook stops, coverage freezes. `probe` reverts
`Frozen`; tolerant reads return FROZEN with the frozen interval so inert
readers keep history. Re-attach is a *new* family id. **Bits are never
cleared**: a reader that missed the retirement stamp would read zeroed words as
proven absence, and EIP-3529 caps the refund anyway. The v1 defect to design
against: `getSortStaleness` returns 0 for an unknown or revoked sort while the
SDK documents 0 as "fully sorted" — a retired family must read FROZEN, never
complete-and-empty. Not scary: reserve `retiredAt` in the slot at genesis
(free) and ship the operation whenever convenient.

---

## 7. Sorted views — the v1 crowd-built sort, re-homed

v1's `processItems` was right about verify-don't-compute, kernel-validated
membership and a per-list watermark, and wrong about being a *live* linked
list (68–127k per insert QUOTED, never shrinks, caller-supplied comparators
that can run out of gas, one node per entry ≈110k each under Glamsterdam).
Sorted order becomes an **L2 snapshot run over a frozen basis**:
`openRun(scope, sortDecl)` fixes the basis; `submitRun(…, k, ordinals[≤256])`
has the kernel read each key from the current head, check order within the
chunk and at the boundary, and set `seen[o]` (duplicate or `o ≥ basis` ⇒
revert). When `k·256 ≥ basis`, pigeonhole proves a permutation in O(n) with no
sort. Two storage forms: **committed** (one hash per chunk, 22,100 / 110,020;
contracts verify supplied calldata at ≈42 per word) — the default — and
**materialised** (8 ordinals per word, +707k / +3.52M per chunk) for
contracts needing in-transaction top-N. Increments are new runs over `[b, b′)`
merged at read; rebinds after a run's basis are detectable per position
(`head.admissionOrdinal > run.basis`). No trusted-indexer runs at MVP: the
browser sorts locally for free, and a contract cannot use an unverified run;
the shape stays so a proof or bond can attach later.

---

## 8. Cost sharing and exploits

| Act | Payer | Today / Glamsterdam (ESTIMATED) | Bounded |
| --- | --- | --- | --- |
| Declare family | declarer | one record admission | yes |
| Attach | Type author / scope principal | one admission; scope-level +2,100 per rebind | ≤ 8 per Type, ≤ 4 per scope |
| Coverage slot (pre-`d` scopes only) | first builder | ≈47k / ≈135k | once per scope |
| Backfill, 512 entries | anyone | ≈5.0–7.9M / 5.3–8.5M (after kind-10 fix) | by `maxEntries` |
| Live maintenance per placement per family | writer | ≈8–13k / 15–21k; rebind ≈16–27k / 30–42k | yes |
| Probe | reader | ≈6,300 | yes |
| Sorted run, 256 entries, committed | anyone | ≈2.5–3.9M / 2.6–4.0M | yes |
| Detach | authority | 5,000 / 12,100 | yes |

Bounties stay out of the kernel (an optional escrow paying `msg.sender` per
entry advanced — the Synthetix SIP-11 lesson: permissionless keepers, pay the
first lander, no penalties). *Poisoning* is impossible (no claims in L1; runs
verified against keys and the position set). *Stalling* is impossible
(`liveFrom` is fixed at `d`; any advance is permissionless). *Front-running* a
chunk costs the victim nothing without a guard. *Troll declarations* cost the
declarer and touch no write path unless an authority attaches them.
*Sentinel collision* (Compound Proposal 62, ~$80–90M) is prevented by the
coverage slot plus the reverting probe. *Thin-basis aggregates* (Inverse,
$15.6M) cannot occur because counts exist only through `page`, which carries
coverage.

---

## 9. What the prior art says, in three lines each

**Databases.** Every production system separates the index physically but
couples it through the write path from declaration (Postgres `indisready`, F1
write-only, DynamoDB backfill tracking, Cassandra, MongoDB side-writes, InnoDB
online log), backfills history in the background, and never lets a reader see
a partial index as whole: the planner ignores it, the query errors
(DynamoDB `CREATING`, Cassandra `IndexBuildInProgressException`), or staleness
is labelled and the reader opts in (Oracle `stale_tolerated`, Materialize
frontiers). Even trusted builders got it wrong — PostgreSQL 14.0–14.3 marked
incomplete indexes valid; DynamoDB `ACTIVE` indexes silently omit
key-violating items. The systems that made indexing a separate optional layer
run by someone else (EAS `Indexer.sol`, MUD modules, Elasticsearch reindex)
all lost the ability to prove absence.

**On-chain.** No deployed contract reaches provable completeness for a
later-added index without per-chunk verification against the source
(TornadoTrees' cursor-ordered fold; EFS v1 `processItems`) or a proof. The
patterns that survive expose a basis stamp and a consumer-side choice —
pay to catch up (Compound `accrueInterest`), extrapolate (Aave
project-on-read), or revert (Maker `Pot/rho-not-updated`, Uniswap `'OLD'`,
EIP-2935). Uniswap's `Oracle.grow()` is the exact "anyone pays gas, writes
nothing semantic" shape. A ZK proof (≈220–250k per Groth16 verification,
QUOTED EIP-1108) beats recompute above ~20 entries but needs keccak-MPT
circuits EFS does not have; Axiom is gone, Brevis is a service.

**The Epic analogy.** One part does not transfer: free, trusted, low-priority
background CPU. Blockspace has no priority lane and the builder is untrusted,
so the contract must re-derive every entry — which also means there is no
reconciliation machinery to get wrong, which is exactly where PostgreSQL and
DynamoDB failed with trusted builders.

---

## 10. Where the research pushed back on the framing

1. Attach first, backfill second (§1) — a correctness requirement, not style.
2. "Out of date" is not a state of an attached family; it is a property of
   snapshot views, and the v1 overlay's "possibly out of date" was the
   dangerous kind (a live list under rebinds without per-position checks).
3. "Unsynced indexes are untrustworthy" is true in exactly six cases, each
   with a structural fix, and v1 had two: a bare bool or empty list without
   coverage; aggregates over a partial column; a Lens with one column behind
   merged as absence; a view read for an effectful decision without a basis
   gate; a detached family read as current (v1's revoked sort = staleness 0);
   a sparse family's MISS read as "not X" when it means "not this Type".
4. Only history is crowd-shareable; live maintenance is the writer's.
5. Turning off is not scary; *deleting* is. Never clear words.
6. The v1 complexity was live insertion, not crowd-building.
7. The design space collapses to two axes: who may attach, and whether the
   read reverts outside coverage. Everything else is a constant or an
   overlay.

---

## 11. Decisions for the owner

| # | Decision | Recommendation | Etched? |
| --- | --- | --- | --- |
| **D-D (final form)** | Narrow 2026-07-15: presence (L0: kinds 1/3/4/5/6/8/10) total and automatic for every record; predicate families declared as records, attached by the Type author (writers pay) or by a principal to its own scopes, backfillable by anyone; the kernel reports the covered interval; strict readers revert outside it | **Ratify** — this is the ruling; it keeps "no per-writer opt-out" literally | ruling |
| **K10** | Kind-10 scope entry carries the **binding-key ordinal** instead of the admission ordinal | **Yes** — every scope walk goes from ≈30–60k to ≈9.5–15k per entry, backfill included; the first admission ordinal stays recoverable from kind-8 word 0 | **yes; precedes `initialize()`** |
| **ROSTER** | A per-directory placer roster ("who has ever placed into D"), so a contract can enumerate a directory's Lens candidates | **Decide now**: it is absent from kinds 1–10 and cannot be added later; without it "all principals who placed into D" has no on-chain answer | **yes** |
| **D-9** | Sorted pages: choice A (bounded candidates + client materialisation; L2 snapshot runs) vs B (mandatory contract sorted pages) | **A**, assumed downstream since July but never ruled | no |

Delegated engineering defaults I will take: attach at declaration; Type-author
attach via `cacheBytes` first, scope-level additive; coverage slot only for
pre-`d` scopes; the reverting `probe` / bool-free `probeTolerated` / revision-
committing `page` ABI; contiguous frontier with optional guard, cap 512 after
K10; `FIELD_EQ` first; `retiredAt` reserved at genesis, detach two-step, no
deletion ever; no `alive` at the index layer (it is the tag system's
`HEAD_LIVE` family); no per-scope mutation counter; caps 8 per Type, 4 per
scope; no bounties in the kernel.

---

## 11a. Corrections after the PM's review (2026-09-10 evening)

Codex's reply (`planning-mvp-c0/Reviews/2026-09-10-foundation-reply-after-economics.md`,
`832c7ae` on `codex/mvp-c0-coherence`) supports the shape and corrects the
following; each is accepted and carried into the prototype tests:

- **ROSTER is not "now or never."** A per-directory placer roster can be
  rebuilt later from the global inventories (kind-4 per-principal postings,
  the binding-key inventory, the admission log) by the same bounded, verified
  backfill this document describes — at a global-scan cost rather than a
  per-scope one — provided a live hook can be installed at that time. The
  decision is therefore "pay one slot per (principal, directory) now" versus
  "pay a global backfill later", not permanence. The §11 row is withdrawn as
  worded. Discovery of placers never grants authority or Lens membership.
- **D-D must reconcile the 2026-08-12 ruling as well as 2026-07-15.**
  August already says "Type creators choose the bounded fields and supported
  index modes for their Types … every admitted item is indexed automatically
  according to that declaration; an individual writer cannot opt out"
  (`owner-rulings.md`, 2026-08-12). So "declared by the Type author" is not
  new. What D-D actually adds is: later attachment, historical coverage,
  attachment authority and cost ceilings, and retirement. Its ratification
  is narrowed to those.
- **Three ordinal domains, not one.** Admission ordinal, global binding-key
  ordinal and zero-based position within a scope are different numbers; the
  born-after-`d` test in §3 must not compare a binding-key ordinal with an
  admission ordinal. K10 changes readers (historical prefix filtering,
  hydration, posting-head checks) as well as storage; Codex owns that patch
  with its readers.
- **The reverse locator is missing.** K10 makes scope-position → binding-key
  cheap; a rebind still needs binding-key → scope-position to update the
  right bit. Options to price: a reverse map slot, or a caller-supplied
  position verified against the scope list. No hidden linear walk.
- **Type attachment is not a free cache write.** Type identity/cache
  validation rejects altered cache data for the same Type, and Type records
  are not owned by whoever registered them. Attachment needs an explicit
  authority, an identified profile, an effective epoch and writer cost
  ceilings; the already-loaded cache on a BindingSet leaf is not the target
  File Type's cache, so cross-Type rebinds need old and new dependency
  handling.
- **A directory is not the whole universe.** Unbound Records and Occurrences
  have no directory position; each family must name its universe (kind-1 for
  Type-sourced families, kind-10 for scope-sourced), and directory bitmaps do
  not replace the presence families.
- **Coverage and cursors.** A set bit proves a current positive only if every
  dependency maintains it; a clear bit needs coverage to prove a miss; page
  COMPLETE also requires exhaustion of the selected universe. Scope count
  does not change on a rebind, so a cursor must pin an authenticated block
  basis, not `revision` alone.
- **512 is a benchmark candidate.** `FIELD_EQ` over high-cardinality values
  can allocate a fresh bucket word per item; bound inspected work and writes,
  and measure sparse, hot and maximal-body cases.
- **Sorted runs.** `openRun` at basis B followed by `submitRun` reading
  *current* heads does not prove a snapshot at B; use history-at-B reads or
  abort on drift. Materialised runs pack five u48 ordinals per word, not
  eight u32; the +707k figure is understated.
- **Attachment cannot silently tax unbounded future work**; admission-count
  delay is not wall-clock; old snapshots stay qualified after retirement.

## 12. Verified, unverified, and next

Verified today: the six kernel facts above; the v1 sort overlay's mechanics
(`processItems`, `StaleStartIndex`, `getSortStaleness`) as the vault strand
cites them from `contracts/specs/07` and `EFSSortOverlay.sol`. Not verified by
me: the web sources (they carry the strands' own citations and dates);
whether the binding admission path already loads the target record's body
(which would make the hook's field read free); the envelope-size term in the
30–60k walk estimate. Could not be found by the strands: any Epic engineering
source; Brevis per-callback gas; Lagrange's 2026 status; a deployed contract
accepting unproven third-party index claims that reaches completeness.

Next steps, folded into the sequence in indexing-and-state §9: prototype
`backfill` + `probe` + `page` on the c0-core lab against a 10,000-entry
scope; measure per-entry walk cost with and without K10; measure the hook per
placement; then the sorted-run `submitRun` with the pigeonhole check.

**Round-2 measurement (2026-09-11):** K10 on the lab — backfill walk 56,425 →
31,384 gas per entry (−25,041, −44 %; MEASURED, N = 1,000, same chunks),
largest chunk 273 → 491; every lane-to-admission derivation (coverage init,
born-after-`d` probe, the hook's reverse locator) costs 3 reads instead of 1
(locator ≈23k → ≈69k at N = 1,000). See
[prototype-round-2-2026-09-11.md](prototype-round-2-2026-09-11.md).
