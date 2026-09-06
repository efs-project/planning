# Binding heads and retained history at one basis

**Status:** selected reversible specification; partial implementation at `ae9367d`
exceeds the normal host runtime cap. See [measured constraint](binding-reads-verification.md).
Not a completed C0 capability; continues the published occurrence checkpoint.

Implement the existing [B0 Binding reads](../2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md)
and [INDEX Binding-at-basis law](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md)
on the current Store. The [read overlay](read-overlay.md) remains authoritative
for qualification and the later shared pages/Scope engine. This component
provides the head/history foundation that engine and Files need; it does not
substitute a head-only definition for the full MVP.

## Choice and interfaces

Reuse the packed current head and RAW_AUDIT history postings. A second head
store would duplicate writes; replaying all history for an onchain read would
lose the bound. Use a current projection or a bounded boundary search followed
by decoding one selected mutation. Factor only the storage/basis/hydration
helpers already required here and by the next page increment.

```solidity
getBindingHead(bytes32 bindingKey)
  returns (BindingFold.Head head, bytes32 realmBasis, uint64 highWaterOrdinal);
getBindingAtBasis(bytes32 bindingKey, uint64 basisOrdinal)
  returns (BindingFold.Head head, bytes32 realmBasis, uint64 highWaterOrdinal);
readHistory(bytes32 bindingKey, uint32 fromRevision, uint16 limit)
  returns (BindingHistoryEntry[] entries, uint32 nextRevision, uint8 completeness);

struct BindingHistoryEntry {
  uint32 revision;
  uint64 admissionOrdinal;
  bytes32 envelopeId;
  uint16 leafIndex;
  uint8 occurrenceStatus;
  uint64 revokedAtOrdinal;
}
```

`BindingFold.Head` remains the exact seven-field B0 order: state, targetKind,
tombstoneCause, revision, admissionOrdinal, targetA, targetLeaf. No new public
Scope, batch, position-convenience or alternate receipt API.

## Shared state and basis guards

Reuse occurrence initialization/counter checks without weakening the existing
point getters. Require nonzero initialRevisionId for these basis-bearing reads;
an otherwise initialized store missing that revision is `ErrReadState(subject)`.
The current kernel admits only revision ordinal1, so every valid H maps to that
initial revision. This is not a general revision-history implementation.

After initialized-state guards, basis0 selects current H. Explicit H above
current or outside the physical u48 range uses `ErrPageBasis(uint64,uint64)`.
Relevant retained counters remain strictly below `(2^48)-1`; malformed retained
H fails as state, before caller-basis classification. For these Binding APIs,
state-error subject is the requested BindingKey throughout dependent joins.

Expose narrow **internal** `requireState` and `hydrateOrdinal` helpers from
StatePointReads. Hydration keeps its exact current-state checks and fixed
metadata; existing public getters keep their caller/absence/error behavior.
Internal stored-ordinal misuse is ErrReadState, not ErrReadOrdinal. A later
H projection may report ACTIVE/revoked0 when current withdrawal is after H;
do not modify current occurrence/receipt results to implement that projection.

## Checked packed reads

Current Binding metadata has zero bits120..255; unpacking alone is not
validation. Factor the existing `BindingFold` validity predicate for read/write
reuse: writes retain `InvalidHead`, reads map false to ErrReadState. Preserve
every accepted/refused head value and write transition. A current UNSET head
must be wholly zero including target; known heads have valid revision/ordinal,
target/cause combinations and admissionOrdinal≤current H. Return current heads
without decoding a body or scanning history.

The actual posting head is count:u64 at0, live:u64 at64, last:u48 at128,
flags:u16 at176; bits192..255 are zero. Zero count requires the entire head0.
Known count/live are below the u48 sentinel, live≤count, count≤last≤current H.
RAW_AUDIT uses flag1 and live=count; other families use flag0. This task consumes
only kind8 but the checked primitive accepts an explicit expected mode.

Each posting word has five u48 ordinals and zero high16 bits. Check selected
position<count, nonzero/bounded selected ordinal≤last, correct last value when
that position is examined, and zero unused tail lanes in the final word. Check
strict ordering for adjacent entries actually examined. These are checked
projections of mandatory state, not an audit of every unvisited posting.

## Historical head reconstruction

If the checked current head is UNSET or its ordinal≤H, return it directly.
Otherwise read kind8's head using the existing key preimage and require count
equals current head.revision and last equals current head.admissionOrdinal.
Binding revisions are strictly below `uint32.max`; no count narrowing first.

Find the first posting ordinal>H; the preceding physical position, if any,
is the selected revision minus one. Check the searched boundary and candidate
against H and immediate ordering, counting every boundary posting probe against
48, including repeated/end/neighbor probes. Binding count is below2^32, leaving
room for these checks after the binary search. No unbounded fallback or full
history fold. No predecessor means an all-zero UNSET at the requested H.

Hydrate the selected ordinal through the shared checked occurrence join.
Decode only the exact retained kernel SET/TOMBSTONE/WITHDRAWAL Type identities,
never an arbitrary structurally similar Type. The fixed candidate bodies are:

- SET: purpose32, subject32, fieldRole32, OPTION(REF), OPTION(OCCREF),
  OPTION(OCCREF predecessor), with exactly one target. Length131/133/165/167.
- TOMBSTONE: the three position words plus OPTION(OCCREF predecessor),
  length97/131; cause1, cleared target.
- WITHDRAWAL: OCCREF34; cause2, cleared target.

Bound length **before** copying this at-most167-byte body. Recompute its RecordId
from exact Type/body and the existing Record domain; validate option flags,
reference sentinel/leaf bounds and exact consumption. This narrow kernel
decoder is not a general parser or validation of all application Types.
Do not copy a Type cache or call Preparation.

For SET/TOMBSTONE, derive the BindingKey from the producing full Principal and
position tuple and require equality. Revision1 requires absent predecessor;
later revisions require the predecessor's exact Envelope/leaf to match the
previous history ordinal's checked log. Do not recursively decode that body.
For WITHDRAWAL, its target must be the immediately previous history ordinal,
same Principal, and a SET/TOMBSTONE for this exact key; its retained lifecycle
must name this withdrawal ordinal. Decode that one target, without recursive
withdrawal or history replay. A stale-source withdrawal cannot become this
Binding's revision. Return the selected physical revision and ordinal even if
its producer was withdrawn later; never liveness-filter Binding history.

## Revision-number history completion

This ABI has no H parameter: it returns current lifecycle at one pinned source
block. Historical-H audit enumeration remains the later kind8 page endpoint.
Check initialized state first, then choose the previously unspecified input
rule: `fromRevision=0` or limit outside1..64 reverts
`ErrReadHistory(uint32 fromRevision,uint16 limit)` (INDEX signature row8).
This is not generic PageRequest clamping.

Read ascending physical positions r−1, at most limit. Check current head/history
count/last agreement, hydrate each producing occurrence and its kernel/key
association using the same bounded mutation decoder above. Include withdrawn
producers with status2 and their withdrawal ordinal. COMPLETE=1 and nextRevision0
when exhausted, including a valid start beyond the last revision or unknown
key. Otherwise PARTIAL=2 and nextRevision is the first unreturned revision.
UNSUPPORTED/UNKNOWN are not successful results of this authoritative API.
No overflow at the maximum retained revision; never return `uint32.max` as a
retained revision. Current head absence with a nonzero history head is corruption.

## Implementation and evidence boundaries

No storage, admission, authority, identity, candidate Type or portable encoding
change. Normal caps remain24,576 runtime bytes,49,152 initcode bytes and
16,777,216 transaction gas. One linked-admission path and managed loopback only.
No public RPC, personal wallet, new product repo, main merge or durable release.

Test real SET→SET→TOMBSTONE→withdraw-current, withdraw-stale, first tombstone,
historical cuts and complete/paged history; compare every field to independent
retained-state reconstruction. Separately label synthetic packed corruption,
large-history boundary and sentinel evidence. Include full-width Principals,
Record and Occurrence targets, malformed body/key/predecessor/withdrawal joins,
and the new history input/terminal rules. Rerun existing point, occurrence and
write regressions after internal factoring. Measure original dependencies and
the integrated normal host; no giant Forge test deployment is normal-cap proof.

If the inherited test-oracle host exceeds normal limits, report the actual
artifact and stop the task for a measured layout decision. Do not raise limits,
omit required reads or introduce a new deployment topology silently. The host
contains raw oracle/trusted ports and is not the final authenticated Core budget.

Next is the shared classifier/cursor/page engine (including Scope), using the
existing read overlay; then authenticated Core/Files/SDK/static integration.
No owner decision is required for this reversible component selection.
