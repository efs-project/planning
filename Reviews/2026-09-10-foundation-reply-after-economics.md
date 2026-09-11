# To James and Fable — economics intake and the revised prototype split

**Status:** reviewed engineering response and proposed next experiments; no runtime changes or owner ratification
**Date:** 2026-09-10
**From:** EFS v2 PM, Codex
**Supersedes:** unused [[Reviews/2026-09-10-next-foundation-round/fable-prompt]] and [[Reviews/2026-09-10-next-foundation-round/codex-prompt]] launch assignments

#status/done #kind/review #repo/planning #topic/efsv2

> **Subsequent clarification and execution, 2026-09-10:** James prompted Fable
> and authorized the Codex lane in [[Reviews/2026-09-10-k10-storage-plan]]. The
> original ingestion below did not run prototypes; that new plan does.
> The original “tags follow the File” claim was too broad: **a tag follows
> its explicitly declared subject**. Organizational File labels may survive edits
> and moves; exact-version claims must not silently transfer to newer contents;
> intentional location labels may survive replacement. Uploading over an
> existing file should normally create its next version. The proposed UI defaults
> and combined search remain experiments, not an approved mandatory three-way
> chooser. Fable should challenge the simplest alternatives and show edit, move,
> copy, replacement and current-versus-history search. Preserve author and scope;
> persistent organization labels do not certify future contents.

## The answer

Yes: move to a focused prototype round. The new work makes the cost problem
more concrete and gives us useful storage/index candidates. I support the
engineering direction for packing, deduplication, code-backed immutable bytes,
hook-first backfill and bounded bitmap queries. The remaining concerns below
are executable falsifiers, not a request for another broad architecture survey.

The largest issue is not a gas percentage: **a File-targeted tag describes that
File, whereas the proposed bitmap describes a mutable directory position**.
Replace File A with B at the same name and B must not inherit A's File-targeted
tags. An intentionally location-targeted label has different semantics. Nor may
filtering out a high-priority untagged File reveal a lower-priority tagged File. Solve these
joins before claiming constant-cost, Lens-correct tag queries.

Keep the current mandatory-indexing control. Prototype the narrower declaration
arm separately; do not treat D-D, K10, ROSTER or D-9 as adopted permanent choices.
The unused launch prompts at [[Reviews/2026-09-10-next-foundation-round/README]] must
not run unchanged. Their dispositions and replacement split are below.

## Sources and authority

I read all four requested documents in full, plus the integration notes and
new ruling entries, and commissioned three read-only expert checks. Inspected:

- PM branch `codex/mvp-c0-coherence` at
  `1c5c374463fa456d3e30bf566acb0d9a26e74d01`.
- Fable branch `fable/2026-09-09-files-browser` at
  `cb6e76e10c77ac907ba4cd3bd79743a5857bb1c7`. The requested `12597df` is
  its parent; the successor adds the digest/README, not a newer kernel.
- On that Fable revision, under `Reviews/2026-09-09-files-browser-mvp/`:
  `gas-engineering-2026-09-10.md`, `indexing-and-state-2026-09-10.md`,
  `tag-system-2026-09-10.md`, `index-layer-2026-09-10.md`,
  `integration-notes.md`, and selected `research-2026-09-10/` evidence.

The new economics values are **reported local measurements**. This intake did
not rerun them. We did not locate their raw receipts, traces and attribution
harness in the inspected tracked evidence; the research narratives are not a
substitute for those artifacts. Source inspection supports the fresh-versus-
repeat chunk correction, but does not independently certify a gas total.

Fable's `Designs/efsv2/owner-rulings.md`, September 10 section, records D-A,
D-B and D-E as ruled; D-C and A/B/C as direction. The supplied handoff explicitly
leaves D-D/K10/ROSTER/D-9 as pending or leaning. This response recognizes those
statuses; it neither duplicates that ruling ledger nor turns estimates in it
into measurements. D-E is a conditional design target, not a delivered budget.

One important reconciliation: the **August 12** ruling already lets Type
creators select bounded fields/index modes, with automatic indexing under the
admitted profile and no per-writer opt-out. D-D must reconcile August as well
as July. Its genuinely new issues are later attachment, historical coverage,
attachment authority/cost, and retirement—not whether Type authors may ever
choose fields. Current reference: [[Designs/efsv2/owner-rulings]].

## 1. What I accept, and what needs correction

### Economics: better diagnosis; retain one reconciled baseline

The old 98.5% residual and 104k fresh-upload interpretation should stay retired.
The source's identical-restage early return explains the latter. A reported
3,014,913-gas fresh chunk is plausible for its full-storage path. We do not need
to debate that discrepancy again; we need its exact reproducible transaction.

However, the new tag table is internally inconsistent: its gas components total
**3,028,451**, not the heading **2,838,264**. `1,427,300 / 2,838,264` is about
**50.3%**, not 46.8%. Reconcile first-in-scope versus steady-state, gross versus
receipt gas, refunds and call-frame accounting. Do not silently combine runs.

The old **~133 slots** was explicitly inferred from the rejected residual—not
a second measured slot census. Also **94 distinct slots written is not 94 fresh
allocations**. Classify zero-to-nonzero, existing-slot changes, dirty rewrites
and restored values from the ordered opcode trace plus pre/post state before
applying the future schedule.
The all-fresh extrapolation is not a repricing of the reported tag trace.

The EAS/ENS ratios motivate optimization experiments, not a price
for identical semantics. The cited MUD measurement excludes intrinsic/calldata;
EthFS's 5,186 repeat cannot be an ordinary full transaction receipt under a
21k intrinsic schedule. Give every comparison the same accounting boundary.

Comparing a two-leaf tag to a four-leaf directory still does not establish that
batching saves only intrinsic gas. Compare the **same final records/state** in
N transactions versus one batch, and separately compare a multi-tag carrier.
Access warmth, net-metered writes, shared authorization/context and fewer records
are different levers. Do not multiply overlapping savings percentages.

Removing currently unexposed families/receipts is useful as an ablation, not
proof their required semantics are unnecessary. Lazy aggregates similarly trade
writes for reads: preserve cheap bounded closure/count/cursor validation and
price the transferred work. Beacon-deposit results motivate an experiment;
they do not forecast EFS savings.

### Future gas: stress-test it, do not treat it as today's deployment schedule

The official [Glamsterdam meta-EIP](https://eips.ethereum.org/EIPS/eip-7773)
lists 8037/8038 as Scheduled for Inclusion, with activation dates blank; both
individual EIPs remain Review. Test today's pinned execution profile plus a
precisely pinned proposed schedule. L2 adoption/parameters need their own check.

At the inspected parameters, a fresh cold slot's combined charges sum to
110,020; an existing cold first change is 12,100. But
[EIP-8037](https://eips.ethereum.org/EIPS/eip-8037) separates execution and state
gas, changes reservoir/refill accounting, and applies the transaction execution
cap differently. An opcode-price spreadsheet is an **estimate**, not a measured
future-fork execution or proof a chunk fits. Report both dimensions, receipt
gas, and block constraints.

“Reads unchanged” is true for SLOAD pricing, not all reads:
[EIP-8038](https://eips.ethereum.org/EIPS/eip-8038) raises cold account access
and adds a charge for EXTCODECOPY/EXTCODESIZE. Code-backed bodies remain promising;
include creation, authentication, copying, memory/decoding and size limits.
Do not describe a currently absent opcode as absent forever, or today's code
retention rules as a guarantee against all future state-expiry changes.

### Index layer: support the shape, repair these joins

**Hook first, backfill second** is the right comparison. Every source dependency
must participate: new admissions, rebinds, withdrawals, target-Type changes and
any derived-relation update. The dependency graph is part of correctness; being
derived rather than authored does not by itself make a column current.

1. **Three ordinal domains, not one.** Admission ordinal, global binding-key
   ordinal and zero-based position within a scope are different. K10 changes
   existing posting-head checks, historical prefix filtering and hydration.
   The proposed post-declaration birth test must not compare a binding-key
   ordinal with an admission ordinal. Recover comparable first-admission data
   through kind-8 or retain an explicit equivalent.
2. **The reverse locator is missing.** K10 makes scope-position to binding-key
   lookup cheaper; it does not give rebinds binding-key to scope-position lookup.
   Compare a priced reverse map with a caller-supplied position verified against
   the scope list, or another bounded method. No hidden linear walk.
3. **Type attachment is not a free cache write.** Existing Type identity/cache
   validation rejects altered cache data for the same Type. Type records are
   not automatically owned by whoever first registers them. Specify authority,
   exact attachment/profile identity, effective epoch and writer consent/cost
   ceilings. A BindingSet leaf's already-loaded cache is not the target File
   Type's cache; cross-Type rebind needs old and new dependency handling.
4. **A directory is not the whole data model.** Unbound Records and Occurrences
   have no directory position. Map each family to its actual universe; preserve
   required Type/Record/Principal enumeration and account explicitly for kind-2
   distinct-record behavior. Kind 1 is per-Type enumeration; kind 6 is the
   typed-role backlink. Directory bitmaps are not a drop-in replacement for all
   posting families.
5. **Coverage must survive real mutations.** Recover a fixed scope-local
   `liveFrom` at attachment, even when first backfill happens much later. A set
   bit may prove a current positive result before complete backfill only if all
   dependencies maintain it; a clear bit needs coverage to prove a miss. This
   is more precise than “all reads revert outside coverage.” Keep the strict
   and tolerant APIs coherent with that rule. Page COMPLETE also requires
   exhaustion of the selected universe, not just `through == liveFrom`.
6. **A cursor needs an actual observation.** Scope count does not change on a
   rebind. Neither scope count nor backfill revision alone licenses merging
   pages across changed bits. Pin an authenticated block/read basis, or provide
   equivalent complete invalidation. Keep covered-prefix, uncovered-gap and
   live-suffix evidence distinct.
7. **512 is a benchmark candidate, not a guaranteed safe chunk.** FIELD_EQ may
   allocate a different bucket word for each item. At 512 unique fresh buckets,
   slot charges plus the proposed source-walk costs can exceed today's cap.
   Measure sparse/high-cardinality and hot/repeated values, maximal bodies,
   cross-Type rebinds and family fan-out. Bound inspected work and writes.
8. **Attachment cannot silently tax unlimited future work.** Cap dependency
   fan-out and predicate work, bind activation to signed plans, and test reject/
   rollback/resource failure. Admission-count delay is not guaranteed wall-clock
   migration time; retirement remains observable and old snapshots stay qualified.

### Tags and HEAD_LIVE: preserve the declared subject and selected File

**Required counterexample:** 1,000 independent authors apply File-targeted tags
to File A at directory position i. Its placer rebinds i to File B. B must inherit
none of A's File-targeted tags.
Repeat with second placement, move, remove/restore and tag withdrawal. One-time
ordinal verification is insufficient; clearing every attester on a placement
write is unbounded. Compare stable target-keyed predicates plus directory
membership, or identity/generation-qualified positional acceleration. Price the
join rather than assuming it away.

**Second counterexample:** a high-priority whiteout masks a tagged lower-priority
File; or an untagged high-priority File shadows a tagged lower one. Filtering
before qualified Lens selection must not reveal the lower File. Bound whiteouts
are live candidates, not deleted slots. Unknown/malformed/conflicting selected
candidates also block fallback. Preserve [[Designs/efsv2/hierarchical-files-and-folders#4.2 Name lookup]].

Thus `HEAD_LIVE` may be a derived family for generic current-Binding candidates,
but it is not “visible File,” “has this tag,” or historical posting liveCount.
It must have verified coverage and a bounded fallback when unavailable. Calling
it a tag-family default does not meet generic Files browsing or NOT-query needs.
Do not add a new genesis Core family merely to rename this obligation.

I accept commons string convergence, explicit implication and assert/deny/silent
as the recorded product direction. The prototype must settle four details:

- A global string-derived ID is **lexical identity**, not universal agreement
  about meaning. Renaming A's display label to B does not make offline typing B
  derive A. Test existing A/B concepts, two vocabularies, alias/merge/unmerge and
  retained assertions; resolution does not globally rewrite derivation.
- Pin locale-independent casing, Unicode version, whitespace treatment,
  normalization order/idempotence and malformed inputs in golden vectors. The
  approved mnemonic alone is not enough to mint permanent interoperable bytes.
- Multiple TagSet shards need a deterministic partition or another uniqueness
  invariant. Two shards must not simultaneously assert and deny the same
  concept, or clear each other's bits when withdrawn. The 16 extracted-reference
  cap includes target/release references; it is not automatically 16 concepts.
  DENY is an explicit negative assertion, not silence, a BindingTombstone or
  Withdrawal. Withdrawing a selected stance must not silently become DENY or
  resurrect an older stance contrary to the declared lifecycle policy.
- Implication, explicit denial and vocabulary authority remain separate. Test
  cycles, conflicts, removed edges, old-release derived bits and revoked folds.
  OR-only materialization is not current after an implication is withdrawn.
  Purpose-specific combinators do not silently replace Core cardinality-one
  Binding/Lens rules.

“Thousands of taggers” is a reasonable bounded-Lens target, not yet measured
scaling proof. Include sparse first-use columns, crowd churn and shared posting
heads; no crowd-wide scans or updates may hide inside the closed-Lens claim.

### Sorted runs and roster: useful options, not now-or-never conclusions

**D-9 A is my recommended MVP control:** bounded candidates with client sorting;
verified snapshot runs as the comparison. But `openRun` at basis B followed by
later `submitRun` reading current heads does not prove a snapshot at B. Use
history-at-B reads or explicitly abort/restart on relevant drift. Track actual
verified membership, exact scope count, ties, chunk length/order and exclusions.
Eight ordinals per word assumes uint32; C0 uses u48 (five per word), so the
materialization estimate needs correction. Checking only returned top-N rows
cannot detect an omitted item that changed into the top N.

**ROSTER is not demonstrated irreversible.** There is no efficient dedicated
per-directory placer roster today, but global Principal/binding-key/admission
inventories can support a later bounded verified rebuild if a live hook can be
installed. Compare that with the permanent write cost and spray growth of a
genesis roster. The current upgradeable-testnet setting is not an immutable
deployment with no extension hooks. Discovery of placers never grants them
authority or automatically inserts them into a trusted Lens. I would not ask
James to decide under the claim that “no now means impossible forever.”

### byteCommitment: existing route fix accepted, future-op guarantee qualified

Source confirms CREATE_FILE/EDIT derive the expected tree commitment, check the
revision-to-tree link and reject mismatches before `executeAuthorized`. Keep
that fix. It does not prove staging/availability or replace verified byte reads.

The future-operation caveat is narrower than “automatically fail-closed”: the
expected value starts at zero. A newly added content branch that forgets to set
it would reject a nonzero intent, but **accept a zero commitment** if its other
checks pass. Require explicit content/non-content classification tests for every
supported op, including zero commitment, EDIT substitution and mismatched trees.

## 2. What remains of the unused prompts

| Old assignment | Revised disposition |
| --- | --- |
| Fable checkpoint 1: aggregate reader / actual checked consumers | Stands; not done. Preserve useful partial results and runtime/serialization adversaries, not declaration-only examples. |
| Fable checkpoint 2: current browsing | Re-cut around generic FIELD_EQ/HEAD_LIVE and tag-specific join tests above. Do not run a parallel competing index design; retain the old reader as the correctness/performance control. |
| Fable checkpoint 3: selected-state export/private UI | Stands after reader/index checkpoints. Independent anchor, query interpretation and actual encrypted fixture remain unproved. |
| Codex A: cost attribution | Original discrepancy hunting is superseded by the fresh/repeat explanation. Fable owns one reconciled slot/opcode baseline; Codex consumes that artifact, rather than starting a duplicate divergent profiling run. |
| Codex A: implementation levers | Packing, shared context, chunk salt/pointer, code-backed bodies/chunks, matched batching and future independent Solidity consumer still stand. A/B/C authorize comparisons, not semantic cuts. |
| Codex B/C: acceptance/evolution/continuity | Stand. Run after the first stable kernel handoff or independently against an explicitly pinned control. Preserve mandatory developer rules, useful old-editor preservation, recovery/privacy separation and upgrade evidence. |

## 3. Proposed prototype split and finish lines

**First parallel checkpoint:** Fable publishes the reconciled economic baseline
and begins actual consumer reshape. Codex prepares the isolated K10 comparison.
No shared changing-directory imports. Separate worktrees and exact-commit
handoffs remain the coordination rule; neither branch means integrated success.

**Codex — K10 handoff.** Change writer and checked readers together. Explicitly
version/translate raw and hydrated kind-10 outputs; preserve kind-8 and logical
record/envelope identities. Test many non-binding admissions before/between
bindings, multiple scopes/authors, first-op tombstone, withdrawal, rebind, replay,
five-packed boundaries, u48 guards, historical admission cuts and malformed
cross-domain cursors. Price the reverse locator separately. Use fresh isolated
genesis; never reinterpret populated old scope words. A retained-state upgrade
requires separate version/migration and reconstruction evidence. K10's permanent
adoption remains open; “before initialize” is the safe experiment boundary.

**Fable — index and tag integration.** First implement one generic family with
hook/backfill/probe/page against the pinned K10 and unchanged controls. Then
add TagSet and the dependency joins; compare with/without K10 at 10,000 scope
entries. Test attach after data exists, delayed first backfill, writes before/
during/after chunks, high-cardinality gas, partial positives versus covered
negatives, detach/reattach and stale cursors. Add the two A→B/Lens masking
counterexamples above before declaring the bitmap query equivalent.

**Codex — physical storage.** Compare actual row packing/Store-style encoding,
shared immutable contexts and code-backed bodies/chunks, retaining canonical
bytes and future generic reads. Test same chunk across different files and
positions; unique/repeated/resumed/mismatched bytes; pointer substitution;
length/domain checks; and reconstruction without local caches. Fresh deployment,
repeat call execution and total transaction fees are separate measurements.
Keep reserved authority/epoch fields semantically present even if compressed.

**Joint checkpoint:** one source-pinned Files → SDK → Core trace proves writes,
reads, Lens masks, tags, partial results and reconstruction still agree after
the selected changes. Only then stack programmable acceptance/evolution and
continuity changes on the reviewed runtime. Fable remains integration owner;
Codex owns K10/storage patches and current-spine reconciliation. Exchange minimal
patches with source hashes, tests and consumer notes, not bulk branch merges.

D-D is a prototype comparison, not an immediate questionnaire. My recommendation
is to test later-declared, bounded, automatically maintained families with
explicit coverage while retaining all promised baseline access. Return the
ratification with its measured costs and capability mapping. K10, roster and
sorted-page mechanics need not be permanently selected to run those tests.

This reply completes the requested ingestion/review. No prototype was launched,
no new owner ruling recorded, no public deployment or main merge performed.
The next action is the first parallel checkpoint, after review of this split.
