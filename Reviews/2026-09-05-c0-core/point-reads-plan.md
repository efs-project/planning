# C0 exact point reads implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Implement bounded original-byte Type/Record/Envelope projections that the actual Core can reuse, with independent retained-state reconstruction.

**Architecture:** A small storage-bytes utility reads checked words/slices; a view-only library projects the existing StateStore without copying complete Type caches. A separate test host uses the unchanged admission kernel to populate real candidate state. Pure layout/corruption tests and a normally deployed host establish the read boundary, not authentication or complete G3.

**Tech Stack:** Existing Solidity0.8.30/Cancun/optimizer200/via-IR, Forge/Anvil1.7.1, Node26/ethers6.15. No new installation.

**Spec:** [Read overlay](read-overlay.md), restricted to its exact Type and small point-read sections; B0 INDEX §3.1 return shapes. Occurrence/receipt/Principal/page/Binding queries, Codex and initialization remain separate tasks. This plan does not claim to implement the whole read overlay.

## Global Constraints

- Owned planning-mvp-c0 feature branch only. No product repo/main merge/PR/public deployment/durable data/permanent bytes or protocol approval.
- Preserve StateStore, StateKernel, Preparation/Helper, admission library, all existing codecs/candidate Types and test transport. No new write path, owner state, duplicated cache/group store or changed storage layout.
- Add only five named files. Root owns docs/status/review/publication; worker uses apply_patch, exact staging/message file, actual model/role/harness trailers; no push or children.
- Original group≤8190; Record body≤8192; Envelope membership1..64 and exact unsigned bytes256+32N≤2304. Bound before allocation/copy/narrowing. Type/Envelope public ordinals remain u48; admissions remain u64 with physical u48 checks. Known ordinals must be strictly below `(2^48)-1`, the kernel's exhaustion boundary; test acceptance at `(2^48)-2` and refusal at the boundary itself.
- Cache is trusted canonical abi.encode(SchemaCache), at most131072 bytes. Checked header/tail projection is not a general arbitrary-cache validator. Do not copy the full TypeRow/cache to memory, recompile a group, import parser runtime into point-read code or add a helper call.
- Unknown Type uses typeOrdinal0, not admissionOrdinal0. Intrinsic Type has ordinal1/admission0/zero group RecordId/index0. Empty Record body is not absence. Withdrawals do not erase original Type/Record/Envelope bytes.
- Core getter projection is not portable validity/current authority/finality proof. Independent reader verifies original Record/group/member/Envelope identities at one pinned source; synthetic corruption never represents admitted real state.
- Existing managed loopback Anvil only; every transaction≤16777216 gas, runtime≤24576, initcode≤49152. No public RPC, wallet, unlimited-size flags or test-runtime etch for deployment evidence.

---

### Task 1: Checked storage-byte projections and exact point-read host

**Files:**

- Create: `Reviews/2026-09-05-c0-core/src/StorageByteView.sol`
- Create: `Reviews/2026-09-05-c0-core/src/StatePointReads.sol`
- Create: `Reviews/2026-09-05-c0-core/test/PointReadHarness.sol`
- Create: `Reviews/2026-09-05-c0-core/test/PointReads.t.sol`
- Create: `Reviews/2026-09-05-c0-core/test/point-reads.test.mjs`
- Report only: `.superpowers/sdd/point-reads-plan/task-1-report.md`

**Interfaces:**

`StorageByteView` owns the shared error and these internal functions:

```solidity
error ErrReadState(bytes32 subject);
function word(bytes storage value, uint256 offset, bytes32 subject)
  internal view returns (uint256);
function slice(bytes storage value, uint256 start, uint256 length,
  bytes32 subject) internal view returns (bytes memory);
```

`word` accepts only aligned offsets with a complete32-byte word inside the
stored length. It reads long-byte data via the actual bytes variable's slot.
`slice` requires start≤storedLength, length≤storedLength−start and length≤8192;
length0 is legal, including at the end. Support short/long Solidity bytes,
unaligned starts, exact memory bytes and zero final padding. Never copy an
unbounded source to memory before selecting its slice. No hardcoded mapping
or struct-field slot; assembly may use the supplied storage reference `.slot`.

`StatePointReads` consumes the unchanged `StateStore.Store` and defines:

```solidity
function getTypeSchema(StateStore.Store storage s, bytes32 typeId)
  internal view returns (bytes memory canonicalBody, uint48 typeOrd,
    uint64 admitOrdinal, uint8 refRoleCount, uint8 indexSpecCount);
function getTypeOrigin(StateStore.Store storage s, bytes32 typeId)
  internal view returns (bytes32 groupRecordId, uint16 memberIndex, bool intrinsic);
function intrinsicTypeGroupBytes(StateStore.Store storage s)
  internal view returns (bytes memory);
function getRecord(StateStore.Store storage s, bytes32 recordId)
  internal view returns (bytes32 typeSchemaId, bytes memory canonicalBody,
    uint64 firstAdmitOrdinal);
function getEnvelope(StateStore.Store storage s, bytes32 envelopeId)
  internal view returns (bytes memory canonicalUnsignedEnvelope,
    uint48 envelopeOrdinal, uint16 leafCount, bytes32 principalId, uint64 authEpoch);
```

Every entry requires initialized `s.init.realmId`/meta-Type state; reuse
`StateKernel.InvalidInitialization()` for absent initialization. Known malformed
read projection uses `StorageByteView.ErrReadState(subject)`, with requested
Type/Record/Envelope ID (or intrinsic meta-Type ID) as subject. Do not turn a
known bad row into a zero result. No new public/source-defined state mutator.

`PointReadHarness` in test/ extends the unchanged explicitly unauthenticated
StatefulHarness, keeps its constructor signature and forwards the five reads.
It is not the future MvpC0Core. A separate test-only synthetic subclass may
seed/corrupt the owned storage rows/cache words or clear initialization for
adversarial tests; name every such method ForTest. A small bytes-only test
host can expose word/slice and inspect padding. Do not add these ports to src/.

- [x] **Step 1: Compiling stubs and behavioral RED.**

Create the interfaces and minimal test hosts, with valid reads initially
refusing through the named error. Use the existing intrinsic literal in
StateKernel.t.sol and unchanged PreparationHelper/AdmissionLibrary to initialize
the host. The first test asserts original intrinsic bytes, identity/ordinal
and zero role/index counts rather than merely constructor success:

```solidity
(bytes memory blob, uint48 ord, uint64 admitted, uint8 roles, uint8 indexes)
  = h.getTypeSchema(metaId);
require(keccak256(blob) == keccak256(expectedIntrinsicBlob));
require(ord == 1 && admitted == 0 && roles == 0 && indexes == 0);
(bytes32 groupRecordId, uint16 member, bool intrinsic) = h.getTypeOrigin(metaId);
require(groupRecordId == 0 && member == 0 && intrinsic);
```

Run focused `forge test --offline --use "$C0_POINT_SOLC" --match-path test/PointReads.t.sol -vv`
using the existing cached compiler. Record successful compilation then expected
behavioral assertion/error failure. Import/setup failures do not count as RED.

- [x] **Step 2: Implement checked word/slice reading.**

Guard arithmetic before memory allocation and source reads:

```solidity
uint256 n = value.length;
if (start > n || length > n - start || length > 8192)
  revert ErrReadState(subject);
bytes memory result = new bytes(length);
```

For aligned long words, derive keccak256 of the storage-reference slot and
add offset/32. For slice copying, handle short in-slot bytes separately;
long slices may combine adjacent words for an unaligned boundary. Do not read
a second word unless the requested source interval needs it. Zero memory
padding after the last requested byte. Do not include Solidity's short-byte
length marker in data or rely on adjacent storage being zero.

Tests cover source lengths0/1/30/31/32/33/63/64/65/8192, every start alignment
0..31 where valid, zero/end slices, exact/over-limit and subtraction/overflow
attempts. Use nonzero varying bytes, not all-zero fixtures that hide shifts.
Assert complete bytes and final padding; a fuzz test bounded to8192 bytes
compares to a simple independent memory slice. Word tests cover aligned versus
unaligned, short data, last full word and out-of-bounds reads.

- [x] **Step 3: Implement Type origin/blob/cache-count projection.**

Keep storage references. For unknown typeOrdinal0, require consistent zero
origin/index/admission metadata; getTypeSchema also checks empty cache before
returning its five zero values. Do not copy cache bytes for that check.
Known ordinals must fit u48 and the retained type counter. Intrinsic requires
exact meta identity, ordinal1/admission0/origin0/index0. Ordinary Types require
ordinal≥2, positive admission≤currentH, memberIndex<16, and a retained group
Record of the intrinsic meta-Type with matching first-admission ordinal.

For ordinary groups validate the two-byte Record-body BYTES prefix equals
bodyLength−2, then scan the complete raw group at that offset. Intrinsic raw
group starts at0. Bound raw size≤8190, count1..16, every positive member length,
requested member range and exact end-of-group. Slice only the selected blob
after the bounded frame walk. `intrinsicTypeGroupBytes` returns the raw whole
group, not a Record body or a blob; check its one-member framing before copy.

Cache word positions from its first byte are0 tuple32;32 typeId;64 blobHash;
96 maxBodyBytes;128 fieldsOffset;160 rolesOffset;192 indexesOffset;224
constraintsOffset. Require length≤131072 and sufficient header/tails before
reading, tuple32, matching TypeId/blob hash and maxBodyBytes≤8192. All dynamic
offsets are aligned and at least224, relative to tuple start32; use checked
subtraction bounds before adding32. Fields offset224/count1..64; its offset
head must fit before the roles tail. Roles≤16, indexes≤8, constraints≤32.

```text
rolePos = 32 + word(cache,160)
indexPos = 32 + word(cache,192)
constraintPos = 32 + word(cache,224)
indexPos == rolePos + 32 + 96*roleCount
constraintPos == indexPos + 32 + 64*indexCount
cacheLength == constraintPos + 32 + 128*constraintCount
```

This deliberately checks only the projection of trusted canonical helper
output, not every dynamic field descriptor again. Never silently decode the
entire cache instead. Ordinary full-group/Record identity reconstruction is
an independent consumer obligation; the getter checks its bounded source
join and cached selected-blob identity, not a second admission program.

- [x] **Step 4: Implement Record/Envelope projections and negative cases.**

Record absence uses its zero recordOrdinal with consistent zero Type/first
admission/body. Known recordOrdinal fits physical u48/counter; first admission
is positive≤H; Type is known; body length≤8192. Return empty known bodies
faithfully. Do not consult current occurrence liveness to decide body presence.

Envelope absence uses zero envelopeOrdinal and empty bytes. Known ordinal
fits physical u48/counter. Bound bytes before word reads/copy: six header words,
array offset at192 exactly224, count at224 in1..64, length exactly256+32N.
Validate profile1, authorityRef0/authEpoch0 and u64 notAfter from current C0
header grammar before narrowing; return Principal from32 and epoch from96.
Return exact unsigned bytes without allocating a second full membership array.
No signature or current Principal authority claim.

Add concrete synthetic corruption cases: missing/non-meta group Record; wrong
group prefix/count/index/trailing frame; ordinary versus intrinsic zero-origin
confusion; absent/short/oversized cache; wrong tuplebase/TypeId/blobHash; relative
offset interpreted without the32-byte base; unaligned/out-of-range/overlapping
tails; roles17/indexes9/constraints33/fields0 or65; wrong final end; ordinal
overflow/counter inconsistency; Record body8193; Envelope short/trailing/bad
offset/count0 or65/noncanonical header scalar. Assert exact error selector and
subject. Test corrupted initialized state separately from unknown sentinels.

- [x] **Step 5: Independent normal-deployment comparison.**

Use existing managed withStateful/compileStateful exports. Deploy the new
PointReadHarness normally through `lab.send`/receipt/rpc, using the existing
helper/library addresses and compiler link/immutable references; compare actual
runtime to the expected artifact and enforce normal runtime/initcode/tx caps.
No edits to local-stateful.mjs, no personal/public transport. Keep any needed
closed test-only artifact-patching code local to this test.

Admit all four unchanged candidate groups through the new host's inherited
test publication path, one bounded transaction per group. At one pinned block,
compare intrinsic plus all16 Type blobs/origins/counts against the independent
type-inputs/parser.mjs and admission/reader.mjs CACHE/verifyCache reader. Use
returned group Record bytes, extract groupBytes before deriving group/member
IDs, and compare the requested IDs. Verify exact Record/Envelope identities
through reference/state-reader.mjs ordinaryRecord/ordinaryEnvelope, not producer
helper output as its own expected answer. Compare every public return field.

Test unknowns, a sparse full membership vector and retained data after an
ordinary supported withdrawal using actual kernel state. Record helper/core
runtime/initcode/deployment and point-read estimateGas at representative small/
largest admitted groups, plus actual returndata lengths. Keep these read-host
observations separate from full initialized/authenticated Core or Lens fit.
Exercise storage-cache malformed cases in Forge only; do not present synthetic
corruption or the isolated byte host as valid admission evidence.

- [x] **Step 6: Cover, self-review and commit the five owned files.**

Run forced AST/build-info build, full Core Forge and
`node --test test/*.test.mjs ../2026-09-05-c0-admission/integration.test.mjs ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs`.
Check formatting on the four owned Solidity files and git diff --check.
Report RED/GREEN, exact counts/commands/exit statuses, new warnings, receiver
measurements/cleanup, source pins, corruption cases and explicit remaining
G3/initializer/authentication gaps. Stage only the five files and commit via
message file. No push; root owns task/final review and feature publication.

Execution: implementation `09c7bfb`, task-review fix `a9d3890`; current checks
and exact claim boundary are in [point-read verification](point-reads-verification.md).
Historical RED is implementer-observed/report-only, not a preserved independent
transcript. Root reproduced the final covering tests; task review and its
single scoped fix round are closed. Whole-increment review is separate.
