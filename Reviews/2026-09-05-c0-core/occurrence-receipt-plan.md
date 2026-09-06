# Occurrence and indexed-receipt implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute the three retained occurrence/receipt ABIs using existing
admission state, with bounded hydration and accepting-batch lookup.

**Architecture:** Extend `StatePointReads` with one fixed-metadata hydration
routine and separate bounded batch search. Reuse Envelope framing without
copying its vector for hydration. A new test host exposes the reads without
changing the previously verified point host or the production write layout.

**Tech Stack:** Existing Solidity0.8.30/Cancun/optimizer200/viaIR,
Forge/managed Anvil1.7.1, Node26 and local ethers6.15; no new dependency.

**Spec:** [occurrence-receipt-design.md](occurrence-receipt-design.md), implementing
rows4–5 of [read-overlay.md](read-overlay.md) on actual `StateKernel`/`StateStore`.

## Global Constraints

- No store, admission, authority, identity, or portable encoding changes.
- These are current-state getters; the caller pins one source block for a multi-read operation.
- Missing initialization uses `InvalidInitialization()`; contradictory retained state uses `ErrReadState(bytes32 subject)`.
- Relevant retained counters must be below `(2^48)-1`, the kernel's exhaustion sentinel.
- It never copies a Record body or Type cache, recompiles a Type, or calls the preparation helper.
- Count **all** boundary probes, including candidate, neighbors and endpoints, against 64.
- No unbounded fallback scan.
- Keep 24,576 runtime bytes, 49,152 initcode bytes, and 16,777,216 transaction gas; no unlimited-size flags, public RPC, or personal wallet.
- Owned worktree `codex/mvp-c0-coherence`; no new repo, main merge, push by worker, deployment outside managed loopback, durable data or protocol freeze. No worker subagents.

---

### Task 1: Current occurrence hydration and original receipt projection

**Files:**

- Modify: `Reviews/2026-09-05-c0-core/src/StatePointReads.sol`
- Create: `Reviews/2026-09-05-c0-core/test/OccurrenceReadHarness.sol`
- Create: `Reviews/2026-09-05-c0-core/test/OccurrenceReads.t.sol`
- Create: `Reviews/2026-09-05-c0-core/test/occurrence-reads.test.mjs`
- Report: `.superpowers/sdd/occurrence-receipt-plan/task-1-report.md`

Root owns design/index/README/status/plan changes. Do not change StateStore,
StateKernel, Preparation/helper/library, request/bootstrap codecs, existing
reference reader, candidate Types, or managed transport. Reuse existing
fixture functions where practical; do not inherit an existing test contract
and thereby silently rerun its entire suite as new coverage.

**Interfaces:** Consume `StateStore.Store`, `StorageByteView.word/slice`,
`StateKernel.occKey`, and existing private initialization/ordinal validation.
Produce these internal library functions, with the spec's exact twelve-field
`StatePointReads.IndexedReceiptView` (`authorityBasis` remains uint256):

```solidity
error ErrReadOrdinal(uint64 ordinal);
function getOccurrence(StateStore.Store storage s, bytes32 envelopeId,
  uint16 leafIndex) internal view returns (uint8 status, uint64 ordinal,
    bytes32 recordId, bytes32 typeSchemaId, bytes32 principalId,
    uint64 revokedAtOrdinal);
function getOccurrenceByOrdinal(StateStore.Store storage s, uint64 ordinal)
  internal view returns (bytes32 envelopeId, uint16 leafIndex, bytes32 recordId,
    bytes32 typeSchemaId, bytes32 principalId, uint8 status,
    uint64 revokedAtOrdinal);
function getReceipt(StateStore.Store storage s, uint64 ordinal)
  internal view returns (IndexedReceiptView memory);
```

The new `OccurrenceReadHarness` extends unchanged `PointReadHarness`, retaining
its constructor and inherited test-only publication path, and forwards these
three public reads. A separate synthetic subclass exposes only named `ForTest`
methods for the fixed rows/dictionaries/counts used below. No such setter in
src/. Keep probe accounting private; tests may trace storage access but do not
add an unnecessary public probe-count ABI to the normal host.

- [ ] **Step 1: Compile the interfaces and capture behavioral RED.**

Start with compiling refusal stubs and an actual normal admission fixture.
Use the unchanged helper/library and a valid group Record admission from
existing Core fixtures, then assert exact known identity and ACTIVE status:

```solidity
(uint8 status, uint64 ordinal, bytes32 r, bytes32 t, bytes32 p, uint64 revoked)
  = h.getOccurrence(publication.envelopeId, publication.leaves[0].leafIndex);
require(status == 1 && ordinal == expectedAdmission && revoked == 0);
require(r == publication.recordIds[publication.leaves[0].leafIndex]);
require(t == publication.leaves[0].typeId && p == publication.header.principalId);
StatePointReads.IndexedReceiptView memory receipt = h.getReceipt(ordinal);
require(receipt.acceptedStatus == 1 && receipt.occurrenceStatus == 1);
require(receipt.admissionOrdinal == ordinal && receipt.realmId == realmId);
```

Run focused `forge test --offline --use <cached solc0.8.30> --match-path test/OccurrenceReads.t.sol -vv`.
Preserve successful compilation and the expected behavioral failing output in
the report/ignored log. Import/compiler failure is not behavioral RED.

- [ ] **Step 2: Implement shared no-copy Envelope metadata and hydration.**

Extract current `getEnvelope` framing checks without weakening any guard or
changing its absence/return ABI. Return its ordinal/count/Principal/epoch as
private metadata; only original getEnvelope slices all bytes. Hydration reads
exactly the selected membership word after range validation.

```solidity
uint256 leaf = packed & 0xffff;
uint256 typeOrdinal = (packed >> 16) & ((uint256(1) << 48) - 1);
uint256 principalOrdinal = (packed >> 64) & ((uint256(1) << 48) - 1);
if (packed >> 112 != 0) revert StorageByteView.ErrReadState(subject);
bytes32 recordId = bytes32(StorageByteView.word(
  s.envelopes[envelopeId].canonicalUnsignedEnvelope, 256 + 32 * leaf, subject));
```

Before returning, execute every spec join: valid nonzero admission and E/log;
Envelope framing/leaf range; valid Record ordinal and first admission;
Type dictionary/Record Type/forward ordinal/first admission, with intrinsic
admission0 exception only for the actual meta-Type; Principal dictionary/
Envelope Principal/forward ordinal/first admission. Relevant counters and
retained first admissions are bounded before narrowing.

Decode lifecycle's8/48/48 bits and zero high bits; require ACTIVE with rev0
or WITHDRAWN with `ordinal < rev <= H`, and exact admission/log agreement.
Pair lookup with whole lifecycle0 returns all zero, including an unselected
member of a known Envelope. A status0 word with other bits set fails.
Ordinal inputs0/at-sentinel/over-H use ErrReadOrdinal after retained-H checks;
known corrupted joins use ErrReadState with the spec's pair/ordinal subject.
Do not infer authority, revalidate content bytes, or enable PRE_WITHDRAWN.

- [ ] **Step 3: Implement bounded accepting-batch lookup and receipt.**

Decode/validate every batch probe's48/16/48/32 metadata and zero high bits.
Use positive batchCount≤H and the greatest first boundary≤ordinal, e.g.:

```text
lo=1; hi=batchCount
while lo<hi:
  mid=lo+(hi-lo+1)/2
  row=boundedValidatedProbe(mid)
  if row.first<=ordinal: lo=mid
  else: hi=mid-1
candidate=boundedValidatedProbe(lo)
require candidate.first<=ordinal<candidate.first+candidate.count
```

Validate immediate neighbor adjacency and global first/last endpoints as in
the spec. Include every probe in the64 bound, even repeated reads; cache a
row already at hand rather than rereading where straightforward. Use widened
arithmetic and checked ranges. No full state/history scan. Return original
basis/codehash/block/revision, joined epoch and exact ordinal, accepted1 and
current lifecycle. Receipt search is not performed for ordinary hydration.

- [ ] **Step 4: Validate real transitions and targeted corrupted-state refusal.**

Real admission cases: fresh; sparse leaf63; two calls selecting different
leaves of the same Envelope; same Record in different Envelopes; all-reused
call creates no batch; mixed old/fresh preserves old receipts and gives only
fresh admissions the new batch; first/last ordinal of each batch; actual
supported withdrawal preserves every immutable receipt field but updates the
current status/rev. Distinct test context basis/codehash words must round-trip
exactly; these are explicitly synthetic verified contexts, not real authority.
Check initialized-empty/unknown pair/known unselected leaf and invalid ordinal.

Synthetic cases each target one guard with an otherwise valid fixture and
assert exact selector **and subject/argument**, not any revert: malformed
initialization/H/counters; log reserved bits or missing E; lifecycle reserved,
status0-nonzero, PRE_WITHDRAWN/unknown status, mismatched ordinal or invalid rev;
leaf outside membership, missing Envelope/Record, wrong Type/Principal reverse
or forward ordinal, future/zero first admissions and false intrinsic exception;
batch reserved/revision/missing row/count0/count65/gap/overlap/candidate miss/
first-not1/last-end-notH+1, batchCount0/over-H/exhaustion. Ensure each fixture
actually reaches the advertised guard rather than failing an earlier setup.

For bounded-search evidence, seed a synthetic inventory with `B=H=2^40`,
one-element ranges `[i,i+1)`, valid boundary rows only along the binary search
path plus endpoints/neighbors, and query its valid last ordinal. Observe the
actual read path or include a derivation tied to the implemented loop plus
a successful fixture; at most48 search and five extra probes≤64. Do not claim
those synthetic rows were admitted. Compare otherwise-identical hydration
with small and maximum stored body/cache lengths, confirming no byte-length
proportional read/copy. Rerun old `PointReads.t.sol` after metadata extraction.

- [ ] **Step 5: Independently reconstruct normal-deployment results.**

Use unchanged `compileStateful`/`withStateful` and normal host deployment,
artifact links/immutables and resource caps as in point-reads.test.mjs. Keep
closed host-specific artifact patching local to the new test. Reuse the
independent `collectState`/`readState` source reader for expected admission
joins/lifecycle and decode actual accepting-batch rows for expected receipts.
At each fixed block hash compare every returned field for every accepted
ordinal in a small mixed/sparse/retry fixture; compare both pair and ordinal
APIs. After a real withdrawal pin the new block and compare retained original
receipt values with changed current lifecycle. Never compute expected values
only from submitted fixtures or use production getters as their own oracle.

```javascript
assert.deepEqual([...actualOccurrence], expectedFromSnapshot);
assert.deepEqual([...actualReceipt[0]], expectedReceiptFromRetainedBatch);
assert.equal((rawOccurrence.length - 2) / 2, 192);
assert.equal((rawByOrdinal.length - 2) / 2, 224);
assert.equal((rawReceipt.length - 2) / 2, 384);
```

Report actual runtime/initcode/deploy gas, representative occurrence/receipt
gas and exact returndata; enforce normal caps and managed cleanup. Results
remain test-host/component evidence, not authenticated full initialized C0.

- [ ] **Step 6: Cover, self-review, and commit exact files.**

Run `forge build --force --ast --build-info --offline --use <cached solc0.8.30>`;
full Core `forge test --offline --use <cached solc0.8.30>` once; expanded Node
`node --test test/*.test.mjs ../2026-09-05-c0-admission/integration.test.mjs ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs`;
`forge fmt --check` on owned Solidity files and `git diff --check`. Preserve
commands/output, compiler settings, source hashes and honest resource failures.
Read the diff for duplicate logic, overclaims and unintended changes; fix
within scope or report a concrete concern. Exact-path staging, commit message
file with actual model/role/harness trailers, no push. Return commit, concise
test summary and report path. Parent owns independent review and integration.
