# Binding Heads and History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make current and historical Binding heads and retained revision pages
readable through the existing public shapes at a qualified Realm basis.

**Architecture:** One checked current head; otherwise a bounded search over
mandatory RAW_AUDIT postings and one exact kernel-mutation decoder. Reuse
occurrence joins, factor storage/basis primitives and preserve the write path.

**Tech Stack:** Existing Solidity0.8.30/Cancun/optimizer200/viaIR,
Forge/Anvil1.7.1, Node26 and local ethers6.15; no new dependency.

**Spec:** [binding-reads-design.md](binding-reads-design.md), implementing the
Binding portion of [read-overlay.md](read-overlay.md).

## Global Constraints

- No storage, admission, authority, identity, candidate Type or portable encoding change.
- Relevant retained counters remain strictly below `(2^48)-1`.
- For these Binding APIs, state-error subject is the requested BindingKey throughout dependent joins.
- Existing public point/occurrence/receipt getters keep their caller, absence, error and current-lifecycle behavior.
- Count every historical boundary posting probe against 48, including repeated/end/neighbor probes; no unbounded fallback or history fold.
- Bound a kernel body to at most167 bytes before copying; do not copy a Type cache or call Preparation for reads.
- Normal caps remain24,576 runtime bytes,49,152 initcode bytes and16,777,216 transaction gas.
- One linked-admission path and managed loopback only; no public RPC, personal wallet, new product repo, main merge, durable release or worker push.
- No worker subagents. Parent owns documentation and independent review.

---

### Task 1: Checked Binding projections with independent retained-state evidence

**Files:**

- Modify: `Reviews/2026-09-05-c0-core/src/StatePointReads.sol`
- Modify: `Reviews/2026-09-05-c0-core/src/BindingFold.sol`
- Create: `Reviews/2026-09-05-c0-core/src/StateReadPrimitives.sol`
- Create: `Reviews/2026-09-05-c0-core/src/StateBindingReads.sol`
- Create: `Reviews/2026-09-05-c0-core/test/BindingReadHarness.sol`
- Create: `Reviews/2026-09-05-c0-core/test/BindingReads.t.sol`
- Create: `Reviews/2026-09-05-c0-core/test/binding-reads.test.mjs`
- Report only, untracked: `.superpowers/sdd/binding-reads-plan/task-1-report.md`

Do not change StateStore/StateKernel, Preparation/helper, AdmissionLibrary,
IndexKeys, managed transport, existing reference readers, candidate artifacts,
request/bootstrap codecs or earlier test hosts. The BindingFold change is
predicate factoring only; do not alter any write rule or error.

**Interfaces produced:**

```solidity
// StatePointReads: internal reuse, no new external ABI.
function requireState(StateStore.Store storage s, bytes32 subject)
  internal view returns (uint64 currentH);
function hydrateOrdinal(StateStore.Store storage s, uint64 ordinal, bytes32 subject)
  internal view returns (HydratedOccurrence memory);

// BindingFold: exact existing validation predicate, now reusable.
function validHead(Head memory head) internal pure returns (bool);

// StateReadPrimitives: reads actual Store packing, never B0's illustrative slots.
struct PostingHead { uint64 count; uint64 live; uint64 last; }
error ErrPageBasis(uint64 requestedBasis, uint64 currentHighWater);
function basis(StateStore.Store storage s, uint64 requested, bytes32 subject)
  internal view returns (bytes32 realmBasis, uint64 selectedH, uint64 currentH);
function postingHead(StateStore.Store storage s, bytes32 key, bool audit,
  uint64 currentH, bytes32 subject) internal view returns (PostingHead memory);
function postingAt(StateStore.Store storage s, bytes32 key,
  PostingHead memory head, uint64 position, bytes32 subject)
  internal view returns (uint64 ordinal);

// StateBindingReads: exact external shapes forwarded by normal host.
error ErrReadHistory(uint32 fromRevision, uint16 limit);
struct BindingHistoryEntry {
  uint32 revision; uint64 admissionOrdinal; bytes32 envelopeId;
  uint16 leafIndex; uint8 occurrenceStatus; uint64 revokedAtOrdinal;
}
function getBindingHead(StateStore.Store storage s, bytes32 bindingKey)
  internal view returns (BindingFold.Head memory, bytes32, uint64);
function getBindingAtBasis(StateStore.Store storage s, bytes32 bindingKey, uint64 basisOrdinal)
  internal view returns (BindingFold.Head memory, bytes32, uint64);
function readHistory(StateStore.Store storage s, bytes32 bindingKey, uint32 fromRevision, uint16 limit)
  internal view returns (BindingHistoryEntry[] memory, uint32 nextRevision, uint8 completeness);
```

`hydrateOrdinal` validates stored-ordinal misuse as ErrReadState(subject) and
returns the existing fixed-size current occurrence structure. Factor the old
ordinal getter through the same implementation after its existing caller-input
check; preserve pair and receipt behavior. `requireState` reuses the existing
occurrence initialized/counter checks. No duplicate body/cache or Envelope
framing validator. The basis primitive additionally rejects zero retained
initialRevisionId as ErrReadState, after existing initialization checks.

The normal BindingReadHarness extends unchanged OccurrenceReadHarness with
the same constructor and only the three new forwards. A separate synthetic
subclass may add narrowly named ForTest setters needed by corruption fixtures;
no mutation or probe-count API in src/ or the normal host. Do not inherit an
existing test suite, which would silently count its tests twice.

- [ ] **Step 1: Capture an actual-admission behavioral RED.**

Compile refusal stubs and a fixture that uses the existing candidate groups,
ObjectGenesis and real BindingSet admission through the normal trusted test
host. Reuse input helpers, not a second mutation path. Example assertions:

```solidity
(BindingFold.Head memory head, bytes32 revision, uint64 h) = host.getBindingHead(key);
require(head.state == 1 && head.revision == 1 && head.admissionOrdinal == setOrdinal);
require(head.targetKind == 1 && head.targetA == targetRecordId && head.targetLeaf == 0);
require(revision == init.initialRevisionId && h == expectedH);
(StateBindingReads.BindingHistoryEntry[] memory entries, uint32 next, uint8 c) =
  host.readHistory(key, 1, 1);
require(entries.length == 1 && entries[0].envelopeId == setEnvelopeId);
require(entries[0].revision == 1 && entries[0].admissionOrdinal == setOrdinal);
require(entries[0].occurrenceStatus == 1 && entries[0].revokedAtOrdinal == 0);
require(next == 0 && c == 1);
```

Run focused `forge test --offline --use <cached solc0.8.30> --match-path test/BindingReads.t.sol -vv`.
Preserve successful compilation and the expected behavior failure. Missing
imports, artifact failures or syntax errors are not behavioral RED.

- [ ] **Step 2: Factor common validity and checked storage/basis reads.**

Move BindingFold's exact private validation conditions into `validHead`.
Its existing private throwing wrapper becomes:

```solidity
function validateHead(Head memory head) private pure {
  if (!validHead(head)) revert InvalidHead();
}
```

No accepted or refused value changes. Read-side metadata first checks
`meta >> 120 == 0`, then unpacks and maps false/current-ordinal-over-H to
ErrReadState(bindingKey). Preserve target clearing and all seven fields.

Extract current ordinal hydration without relaxing any existing check.
Use it as the only source of checked occurrence identity/lifecycle for these
reads. Basis implementation follows this order:

```text
currentH = StatePointReads.requireState(s, subject)
if s.init.initialRevisionId == 0: ErrReadState(subject)
if requested > currentH or requested >= u48 sentinel: ErrPageBasis(requested,currentH)
selectedH = requested == 0 ? currentH : requested
realmBasis = s.init.initialRevisionId
```

Posting head masks and shifts are64/64/48/16 at0/64/128/176. Validate high192
zero, wholly-zero absence, live≤count, count≤last≤currentH, strict sentinel
and exact audit flag/live law. For `postingAt`, select word `position/5`,
shift `48*(position%5)`. Require high16 zero and exact unused final tail,
nonzero/bounded ordinal≤head.last and final-position equality to head.last.
Errors carry the caller's subject. No hardcoded Store slot constants.

- [ ] **Step 3: Build bounded historical selection and exact mutation decoding.**

Current points return the checked head directly. Historical requests return
it when already at/before H; otherwise verify kind8 head count/revision and
last/current-ordinal agreement before searching. Keep search local to the
Binding reader until the page engine needs its exact shared shape.

```text
lo = 0; hi = history.count
while lo < hi:
  mid = lo + (hi-lo)/2
  value = countedPostingAt(mid)
  if value <= H: lo = mid+1
  else: hi = mid
end = lo
check selected/next boundary against H and adjacent ordering via counted reads
if end == 0: return UNSET with selected realmBasis/H
revision = end
ordinal = posting[end-1]
return reconstructSelectedMutation(revision,ordinal,key)
```

Count every actual boundary posting call against48; cache already-read values
where simple. Search count is below2^32 because history count equals valid
current revision; widening precedes additions/narrowings. Do not use an
unbounded fold to derive a head.

Decode retained bodies only after checking exact kernel Type and maximum167
length. Copy with StorageByteView.slice, then recompute:

```solidity
bytes32 actual = keccak256(abi.encode(
  keccak256("efs2/record/1"), occurrence.typeSchemaId, keccak256(body)));
if (actual != occurrence.recordId) revert StorageByteView.ErrReadState(key);
```

Use a small memory cursor with checked fixed-word/u16/OPTION reads, exact end,
reference words≥65536 and occurrence leaves<64. SET options are exclusive;
the three position words are values, not references. Reuse BindingFold's key
preimages and validate the derived key/full Principal. Preserve original target
and tombstone causes. For predecessor/Withdrawal association follow the
design's exact previous history/log rule, at most one target kernel-body
decode and no recursive replay. Selected producers may currently be withdrawn.

- [ ] **Step 4: Implement exact revision history and named refusal cases.**

Initialization guard precedes invalid from/limit. Reject from0 and limits0/65
or larger with exact ErrReadHistory arguments. Read at most64 ascending physical
entries, keeping withdrawn producers; use the shared mutation/key association
path. Return COMPLETE/next0 when exhausted or a valid start is beyond last;
otherwise PARTIAL/next-first-unreturned. Never manufacture UNKNOWN or overflow
the revision counter. Whole-zero head with nonzero history is ErrReadState.

Real matrix: SET→SET→explicit TOMBSTONE→withdraw current TOMBSTONE; separate
withdraw current SET; withdraw stale SET without a new Binding revision;
first TOMBSTONE; rebind after tombstone; full-width second Principal isolation;
RECORD and OCCURRENCE targets; H before first/at/after each transition; later
withdrawal preserving old historical head; all-reused publication no new history.
Assert every head/history field, current returned H and initial revision.

Input matrix: from1/last/last+1/uint32max; limits1/64 and invalid0/65; initialized
empty key, explicit future/at-sentinel basis, missing revision and malformed H.
Synthetic exact-error cases: head reserved/invalid target/cause/revision/ordinal;
history count/live/mode/last mismatch; posting high/tail/zero/over-H/order;
wrong key/Principal/Record bytes/Type, invalid OPTION/sentinel/leaf/trailing,
predecessor mismatch, selected non-kernel mutation, Withdrawal of a stale or
wrong-key/wrong-author/non-SET-or-TOMBSTONE target and lifecycle mismatch.
Keep each fixture otherwise valid so it reaches its advertised guard.

Include an explicitly synthetic history with at least2^31 boundaries, seeding
only the actual search path and required target/neighbor joins. A successful
historical answer plus counted-loop derivation must stay below48 probes; do
not claim billions of real admissions. For small actual histories, compare
all H cuts against a simple independent linear fold in the test oracle.

- [ ] **Step 5: Verify the normally deployed host against an independent reader.**

Use unchanged scripts/local-stateful.mjs compile/managed deployment utilities.
Patch only the new host's compiler links/immutables in the new Node test;
preserve independently checked helper/library runtime expectations. Use the
existing source reader for retained state; its `foldAdmissions` supports an
origin-contiguous admission prefix. Never use the new getters or only submitted
intent as the expected result. With `state = await readState(lab)` checked
VERIFIED and `H` a valid nonzero historical ordinal:

```javascript
const ids = {
  set: state.snapshot.bootstrap[7],
  tombstone: state.snapshot.bootstrap[8],
  withdrawal: state.snapshot.bootstrap[9],
};
const atH = foldAdmissions(state.entries.filter(e => e.ordinal <= H), ids);
assert.equal(atH.outcome, 'VERIFIED');
const head = atH.bindings.get(key);
const zero = '0x' + '00'.repeat(32);
const expectedHead = head
  ? [BigInt(head.state), BigInt(head.targetKind), BigInt(head.cause),
    head.revision, head.ordinal, head.target, BigInt(head.targetLeaf)]
  : [0n, 0n, 0n, 0n, 0n, zero, 0n];
assert.deepEqual([...actualHead[0]], expectedHead);
assert.equal(actualHead[1], state.snapshot.bootstrap[1]);
assert.equal(actualHead[2], H);

const byOrdinal = new Map(state.entries.map(e => [e.ordinal, e]));
const history = state.fold.histories.get(key) ?? [];
const expectedHistory = history.map((ordinal, index) => {
  const entry = byOrdinal.get(ordinal);
  assert.ok(entry);
  const life = state.fold.lifecycle.get(entry.envelopeId + ':' + entry.leaf);
  assert.ok(life);
  return [BigInt(index + 1), ordinal, entry.envelopeId, BigInt(entry.leaf),
    BigInt(life.status), life.withdrawal];
});
const start = Number(fromRevision - 1n); // small real fixture; input is uint32
const expectedPage = expectedHistory.slice(start, start + Number(limit));
const complete = start + expectedPage.length >= history.length;
assert.deepEqual(actualHistory[0].map(row => [...row]), expectedPage);
assert.equal(actualHistory[1], complete ? 0n : fromRevision + BigInt(expectedPage.length));
assert.equal(actualHistory[2], complete ? 1n : 2n);
```

`actualHead`/`actualHistory` are decoded calls pinned to `state.basis.hash` with
`requireCanonical:true`; import the unchanged `readState`/`foldAdmissions`.
For basis0, compare the returned H with `BigInt(state.counts[4])` and fold that
complete prefix. Compare all seven head fields and all six history fields,
including a new source pin after withdrawal. Measure runtime/initcode/deployment
gas and representative current,
historical and complete/paged history gas/returndata. Head ABI is288 bytes;
history ABI is128+192N bytes (12,416 at64). Independently encode/check formulas.
Assert normal24,576/49,152/16,777,216 limits and managed cleanup.

If the inherited host fails deployment size/gas, return NEEDS_CONTEXT with
exact artifact sizes and failure evidence. Do not weaken tests/limits or
implement an unauthorized layout workaround. That is a controller layout
decision, not a reason to claim the read component finished.

- [ ] **Step 6: Regress, self-review and commit exact owned paths.**

Run pinned forced build with `--ast --build-info --force --offline --use`;
full Core Forge suite and expanded Node suite:

```sh
node --test test/*.test.mjs ../2026-09-05-c0-admission/integration.test.mjs ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs
forge fmt --check src/StatePointReads.sol src/BindingFold.sol src/StateReadPrimitives.sol src/StateBindingReads.sol test/BindingReadHarness.sol test/BindingReads.t.sol
git diff --check
```

Report compiler/runtime/settings/source pins, exact commands, behavioral
RED/GREEN, resource failures and warnings honestly. Reread the owned diff for
write-predicate drift, doubled hydration/parser logic and unrelated changes.
Stage exactly the seven code/test paths; keep the report/logs ignored. Use
commit-message file and actual model/role/harness trailers, no push. Return
DONE/NEEDS_CONTEXT status, immutable commit, one-line tests and report path.
Parent performs independent tests/task review and integration review.
