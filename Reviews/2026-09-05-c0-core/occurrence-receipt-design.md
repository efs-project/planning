# Current occurrence and indexed-receipt reads

**Status:** implemented at `08c2a16`, independently tested and task-reviewed;
final increment review pending. Not full C0. See the
[verification checkpoint](occurrence-receipt-verification.md).

This makes rows 4 and 5 of the [read overlay](read-overlay.md) executable on
the existing [StateStore](src/StateStore.sol). It preserves the three exact
ABIs in [B0 INDEX §3.1](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md).
No store, admission, authority, identity, or portable encoding changes.

## Why this shape

Derive the answer from the mandatory admission log, retained Envelope,
ordinal dictionaries, lifecycle, and accepting-batch metadata. Adding a
second receipt/occurrence store would duplicate facts and change writes;
scanning history offchain would make an onchain consumer depend on another
service. Selected: bounded storage projections in `StatePointReads`, with
one shared hydration routine and a separate batch lookup paid only by receipts.

An occurrence says **this Envelope member was admitted here**. A receipt
preserves **how and when that admission was accepted**. Withdrawal changes
current lifecycle, not those original facts. These are current-state getters;
the caller pins one source block for a multi-read operation. They neither
claim portable proof nor authenticate the trusted test host's context.

## Interfaces and absence

```solidity
getOccurrence(bytes32 envelopeId, uint16 leafIndex)
  returns (uint8 status, uint64 ordinal, bytes32 recordId,
    bytes32 typeSchemaId, bytes32 principalId, uint64 revokedAtOrdinal);
getOccurrenceByOrdinal(uint64 ordinal)
  returns (bytes32 envelopeId, uint16 leafIndex, bytes32 recordId,
    bytes32 typeSchemaId, bytes32 principalId, uint8 status,
    uint64 revokedAtOrdinal);
getReceipt(uint64 ordinal) returns (IndexedReceiptView memory);

struct IndexedReceiptView {
  bytes32 envelopeId;
  uint16 leafIndex;
  bytes32 realmId;
  bytes32 realmRevisionId;
  uint256 authorityBasis;
  bytes32 authorityCodehash;
  uint64 authEpoch;
  uint64 admissionOrdinal;
  uint48 admittedAtBlock;
  uint8 acceptedStatus;
  uint8 occurrenceStatus;
  uint64 revokedAtOrdinal;
}
```

All reads first require initialized meta-Type/Realm state using the existing
guards. Relevant retained counters must be below `(2^48)-1`, the kernel's
exhaustion sentinel. Missing initialization uses `InvalidInitialization()`;
contradictory retained state uses `ErrReadState(bytes32 subject)`.

`getOccurrence(E,leaf)` is total after those guards: a wholly zero lifecycle
word returns six zero values, even if E is known and that leaf was not selected
or is outside its membership. Never infer admission from carried membership.
A nonzero lifecycle word must pass the complete relevant join below.

For ordinal-requested reads, select `ErrReadOrdinal(uint64 ordinal)` for zero,
the exhaustion sentinel or larger, or a value above the current admission
high-water H. Check malformed retained H before rejecting a caller's ordinal.
This is INDEX signature row 7, not a structural MC/1 error or a permanent ABI
freeze. State errors use E for pair requests and `bytes32(uint256(ordinal))`
for ordinal requests; a valid caller request is not reclassified as bad input
when one of its retained rows is missing.

## One bounded hydration routine

Extract existing Envelope framing validation into a no-copy metadata helper.
The original `getEnvelope` still returns identical bytes and fields; only that
getter copies the full unsigned bytes. Occurrence hydration reads the selected
RecordId word at `256 + 32*leafIndex`. It never copies a Record body or Type
cache, recompiles a Type, or calls the preparation helper.

Decode admission packing as leaf bits 0–15, Type ordinal bits 16–63,
Principal ordinal bits 64–111; all higher bits are zero. Check the log's E,
canonical retained Envelope header, leaf range, and selected membership word.
The Type ordinal dictionary must name the Record's Type and the Type row must
point back to that ordinal. The Principal ordinal dictionary must name the
Envelope Principal and the Principal row must point back to that ordinal.
Record and Envelope ordinals must be valid within their current counters.
Record/Principal first admissions are positive and no later than the requested
admission. Type admission is no later either; only the actual intrinsic
meta-Type may use admission zero, with its existing exact metadata guards.
These checks concern fixed metadata; they are not a second content validator.

Lifecycle packing: status bits 0–7, admission bits 8–55, withdrawal bits 56–103;
all higher bits are zero. ACTIVE=1 requires the joined admission ordinal and
withdrawal zero. WITHDRAWN=2 requires the same admission and
`admission < withdrawal <= H`. Status zero with nonzero other bits, reserved
bits, PRE_WITHDRAWN=3, or another code is inconsistent with the current C0
kernel and fails. This does not expand C0 to never-admitted pre-withdrawal.

Keep the shared hydrated value internal and fixed-size, with the seven public
occurrence fields plus its admission ordinal. It can later supply page rows;
do not add page/historical-H behavior in this task.

## Accepting batch, not latest batch

The existing kernel writes batches covering contiguous fresh-admission ranges.
Retries of already-active leaves create no batch, and a partially retried
publication's older occurrences keep their older receipts.

Batch metadata packs first admission in bits 0–47, count in 48–63, block in
64–111, revision in 112–143, and zero reserved high bits. Require positive
first, count 1–64, end `first + count <= H + 1`, revision exactly 1 (the
unchanged kernel's only accepted revision), and nonzero initialRevisionId.
Retain the exact basis word, codehash, and block; do not reinterpret them
using today's authority or label a synthetic basis as authenticated.

For an accepted receipt, require `0 < batchCount <= H < (2^48)-1`. Binary
search for the greatest first-admission boundary not exceeding the requested
ordinal. Validate every probed row, require the candidate interval to cover
the ordinal, its immediate neighbors to be contiguous, the first batch to
start at 1, and the last batch to end at H+1. Count **all** boundary probes,
including candidate, neighbors and endpoints, against 64. A u48 search needs
at most 48 search probes plus at most five such extra reads, leaving headroom.
No unbounded fallback scan. These checks validate the search path and local
partition, not every unvisited historical row.

Return Realm/initial revision from retained initialization, epoch from the
joined Envelope, acceptedStatus=1, and current lifecycle separately. The
distinct `receiptOf` API and [batch authority extension](batch-authority-evidence.md)
are not aliases for this projection. Full Principal descriptor/authority
reconstruction waits for the real Core to retain that extension.

## Evidence and followups

Use normal local deployments and actual admissions for fresh/sparse/mixed
retry/withdrawal behavior. Compare every returned field at a pinned source
against an independent state snapshot and decoded retained bytes, not the
producer's expected context alone. Synthetic row corruption is separate
refusal evidence, with exact error and subject checks.

Exercise a large synthetic batch inventory with only its bounded search path
seeded, and compare against the 64-probe bound; it is not a deployment-scale
throughput claim. Compare hydration cost with short/large stored bodies and
caches while the relevant fixed metadata is identical. Measure the normally
deployed host's runtime/initcode, actual getter returndata and gas. Keep
24,576 runtime bytes, 49,152 initcode bytes, and 16,777,216 transaction gas;
no unlimited-size flags, public RPC, or personal wallet.

Follow next with bounded pages and Binding reads, retained batch evidence,
actual Codex/authentication/initialization, then SDK/Files/static-SPA journeys.
No owner decision is required for this reversible component. Resource failure
or contradictory owner/source semantics is a reason to revise this design,
not silently weaken guards or claim the integrated MVP is ready.
