# Stateful admission and Binding implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task-by-task. Preserve unfinished tasks across continuation; do not restart reviewed work.

**Goal:** Give the continuous Core track one reusable stateful admission kernel with atomic Record/Type/Occurrence/Binding/posting effects and independently reconstructable state.

**Architecture:** Pure key/effect helpers consume the existing checked bodies. One internal kernel plans an ascending-leaf, write-free shadow and commits its recorded effects into one store. A test-only trusted-context host exercises that kernel; it is not the authenticated C0 entrypoint and never substitutes for the eventual real authority/genesis integration.

**Tech Stack:** Existing Solidity 0.8.30/Cancun/optimizer 200/via IR and Node 26/ethers 6.15. No new dependencies.

**Spec:** [State owners and twelve acceptance cases](stateful-integration.md), [C0 support/evidence qualifications](codex-integration-notes.md), B0 [Binding](../2026-08-13-efs2-stage-a-corpus/chapters/b0-binding.md), [admission §5](../2026-08-13-efs2-stage-a-corpus/chapters/b0-realm-admission.md), [indexes §§2–4/6](../2026-08-13-efs2-stage-a-corpus/chapters/b0-indexes.md), and C0 [BindingScope](../../Designs/efsv2/hierarchical-files-and-folders.md#5-complete-directory-enumeration-bindingscope).

## Global Constraints

- Continue from `824d856`. Prior experiments, candidate descriptor bytes, source commitments and historical measurement artifacts remain unchanged.
- Disposable local work only. No new product repository, main merge, public deployment, permanent IDs, release or protocol freeze. Root publishes the owned feature branch.
- `MAX_ENVELOPE_LEAVES=64`, `MAX_BODY_BYTES=8192`, `REF_INSTANCES_MAX=16`, `MAX_INDEX_SPECS=8`; at most 43 distinct occurrence-level posting keys. Binding history/Scope and unique-Type transitions are outside that occurrence-key list and must be budgeted separately.
- All Principal IDs are bytes32. All ordinal ABIs are uint64; successful physical ordinals are positive and strictly below `2^48-1`. Successful Binding revisions are positive and strictly below `2^32-1`.
- Preserve ordinary Record/Envelope/Occurrence/key identities. The three kernel effect IDs come from actual admitted G4 group-2 bytes/member order, not names, shape, independent singleton blobs or test-supplied effect flags.
- STRUCT-EVM body validity is not target validity, authority, Files semantics, currentness, NFC or full Unicode conformance. Do not broaden the existing ASCII/DIRECT descriptor on-ramp in this task.
- Record references see persisted Records or earlier selected Records. Never expose the staged current Envelope to occurrence resolution; every selected current-envelope OCCREF rejects before effects, including retries.
- External OCCREF checks retained Envelope membership (`leafIndex < count`), not target admission/liveness. NEVER_ADMITTED and WITHDRAWN leaves remain referenceable when membership is checkable. Missing envelope evidence is `REFERENCE_UNPROVED`, not structural invalidity or absence. TYPESCHEMA/PRINCIPAL runtime resolution is explicitly unsupported in this bounded resolver until their existence rule is supplied; these remain valid grammar classes and none of the sixteen candidates needs them. The later capability overlay must report this limitation honestly.
- One lifecycle store, one Binding head store, one RAW_AUDIT Binding history. No second revision history or historical-value rollback. Scope anchors first bind and first tombstone exactly once.
- Fresh leaves receive contiguous prospective ordinals; ACTIVE duplicate sources receive their old receipt and no effects; terminal sources reject. Mixed retries still require structurally exact selected CAS carriage, but do not compare/replay the old leaf's CAS.
- All fallible decisions precede writes. Commit replays the exact plan against asserted prestates; it does not redo reference, author, CAS, index-key or lifecycle choices.
- Never-admitted target withdrawal is explicitly unsupported until the C0 evidence overlay exists. Already-admitted targets use retained author metadata; Withdrawal-of-Withdrawal rejects. This exclusion does not complete pre-withdrawal support.
- Internal host evidence is not authenticated publication or complete G0–G12/M0 evidence. Keep wallet, full bootstrap, canonical public page/cursor ABI and complete physical Core fit as explicit remaining integration obligations.
- Tests use hand-derived values and invalid-but-self-consistent inputs. Test-only setup/inspection ports stay in `test/`; no public unauthenticated mutation port enters `src/`.
- Exact-path staging; commit-message file with actual model coauthor, `Agent: v2-pm` and `Harness: codex`. Workers do not push.

## Task 1: Canonical effect and posting-key helpers

**Files:** create `src/BindingFold.sol`, `src/IndexKeys.sol`, `test/KernelValues.t.sol` here. Existing `RecordBody.sol` and `TypeGroupParser` are unchanged dependencies.

**Interfaces:** implement these internal library interfaces; the next task consumes them verbatim.

```solidity
library BindingFold {
    struct OccurrenceRef { bytes32 envelopeId; uint16 leafIndex; }
    struct KernelIds { bytes32 setType; bytes32 tombstoneType; bytes32 withdrawalType; }
    struct Head {
        uint8 state; uint8 targetKind; uint8 tombstoneCause;
        uint32 revision; uint64 admissionOrdinal;
        bytes32 targetA; uint16 targetLeaf;
    }
    struct Effect {
        uint8 kind; // 0 NONE, 1 SET, 2 TOMBSTONE, 3 WITHDRAWAL
        bytes32 purpose; bytes32 subject; bytes32 fieldRole;
        uint8 targetKind; bytes32 targetA; uint16 targetLeaf;
        bool predecessorPresent; OccurrenceRef predecessor;
    }
    function decode(KernelIds memory ids, bytes32 typeId,
        RecordBody.CheckedBody memory body) internal pure returns (Effect memory);
    function positionKey(Effect memory e) internal pure returns (bytes32);
    function bindingKey(bytes32 principalId, bytes32 position) internal pure returns (bytes32);
    function advance(bytes32 key, Head memory beforeHead, OccurrenceRef memory beforeSource,
        Effect memory e, uint32 expectedRevision, uint64 newOrdinal)
        internal pure returns (Head memory);
    function withdrawHead(bytes32 key, Head memory beforeHead, uint64 newOrdinal)
        internal pure returns (Head memory);
    function pack(Head memory head) internal pure returns (uint256 meta, bytes32 target);
    function unpack(uint256 meta, bytes32 target) internal pure returns (Head memory);
}
library IndexKeys {
    function posting(bytes32 typeId, uint8 kind, uint8 ordinal, bytes32 valueKey)
        internal pure returns (bytes32);
    function scalar(bytes memory fieldBytes) internal pure returns (bytes32);
    function occurrenceTarget(bytes32 envelopeId, uint16 leafIndex) internal pure returns (bytes32);
    function digest(uint16 algorithm, bytes memory digestBytes) internal pure returns (bytes32);
    function scope(bytes32 principalId, bytes32 purpose, bytes32 subject)
        internal pure returns (bytes32);
    function occurrenceKeys(TypeGroupParser.SchemaCache memory schema,
        RecordBody.CheckedBody memory body, bytes32 recordId, bytes32 principalId)
        internal pure returns (bytes32[] memory);
}
```

`decode` consumes already structurally checked fields. Non-kernel Type IDs return
NONE regardless of body shape. BindingSet extracts fields 0–2 as exact 32-byte
words, exclusive target options 3/4 and predecessor option 5; Tombstone uses
fields 0–2 and predecessor 3; Withdrawal is one OCCREF field. Both/none Set
targets raise `RecordBody.InvalidBody(17)`. `advance` only handles SET/TOMBSTONE,
checks exact predecessor and revision, guards ordinal/revision overflow, and
returns T1–T6. `withdrawHead` handles the T7/T9 head change **after** the kernel
has proved the author, active target and exact current-source match. Neither
helper changes lifecycle, appends history, authenticates a Principal or accesses
storage. Returned source is always resolved from `newOrdinal` by the log owner.

Use the exact source errors `ErrCasPredecessor`, `ErrCasRevision`,
`ErrRevisionGuard` with the source field shapes; internal misuse/invariant
errors may be library-specific and must not masquerade as caller authority
errors. `pack` uses Binding §2.1's two-word bit layout; `unpack` ignores reserved
read bits as specified. Invalid write states/target combinations and overflows
reject before packing.

Posting formulas use `keccak256` of the printed UTF-8 domain string, then
`abi.encode` of fixed-width words; uint8/uint16 parameters widen to uint256 in
preimages. Domains are `efs2/pk/1`, `efs2/vk/scalar/1`, `efs2/vk/occ/1`,
`efs2/vk/digest/1`, `efs2/vk/binding-scope/1`, `efs2/position/1`, and
`efs2/binding/1`. Candidate order is byRecord(kind3), byType(kind1),
byPrincipal(kind4), then each extracted reference's general target(kind5) and
predicate role(kind6), then declared SCALAR_EQ(kind7/spec ordinal) and
DIGEST_EQ(kind9/global) in declaration order. REF_BACKLINK adds no duplicate
family. Preserve first occurrence while deduplicating the entire list.
`occurrenceKeys` returns neither unique-Type(kind2) nor history(kind8) nor
Scope(kind10). Those are separate state transitions, never decremented as
occurrence keys. `digest` rejects unknown algorithms or wrong lengths according
to the existing MC/1 table. Canonical field slices include full prefixes.

- [ ] Write a literal FIRST_BIND test against an explicit failing stub. Use
  first predecessor NONE, expected revision 0 and new ordinal 7; require
  `(state=1,revision=1,ordinal=7,targetKind=1,targetA=literal,targetLeaf=0)`.
  Run the focused test and capture the expected assertion/revert failure.
- [ ] Implement minimal decode/advance; extend RED/GREEN through T1–T6,
  withdraw-current bound/tombstone, stale predecessor/revision, ordinal and
  revision guards, exclusive target options and target clearing. Load actual
  group-2 caches through the existing real parser and RecordBody for canonical
  effect tests; same-shaped non-kernel Type must return NONE.
  Fresh head-producing ordinals must strictly exceed the previous head's
  producing ordinal, in addition to the physical exhaustion guard.
- [ ] Add independent literal preimage tests before implementing IndexKeys.
  Example expected base key is computed directly as
  `keccak256(abi.encode(keccak256("efs2/pk/1"), bytes32(0), uint256(3), uint256(0), recordId))`,
  without using any IndexKeys helper. Test full-width Principal separation,
  scalar prefix/hash framing, full occurrence leaf, all digest rows and errors.
- [ ] Test repeated equal refs across two roles: one general key, one key for
  each distinct predicate, and no additional REF_BACKLINK key. Test separate
  SCALAR_EQ declarations, equal DIGEST values deduping globally, zero/present
  options, actual sixteen candidate caches, and the 43-key bound. Keep the
  traversal order supplied by `RecordBody` and dense role indexes intact.
- [ ] Test head pack/unpack with literal expected bit words, zero/first/last
  legal states and bounds. Fuzz lawful heads and same-key CAS transitions;
  success must have exact fields, not only pack/unpack self-agreement.
- [ ] Run the full new Solidity suite, whitespace checks, self-review and
  commit the three owned files. Report literal RED/GREEN evidence and any
  source ambiguity. Root reviews this task before the kernel consumes it.

## Task 2: One store and atomic shadow/replay admission

**Files:** create `src/StateStore.sol`, `src/StateKernel.sol`,
`test/StatefulHarness.sol` and `test/StateKernel.t.sol`. Any necessary small
shared data structs live with their owning library, not a generic catch-all.

**Input boundary:** the internal `StateKernel.admit` receives a verified-context
publication containing exact EnvelopeId, authenticated bytes32 Principal,
canonical unsigned envelope, retained accepting-batch evidence, full ordered
RecordIds, selected `(leafIndex,typeId,body)` rows, a nonzero uint64 mask, exact
ordered `(leafIndex,uint32 revision)` CAS items and a batch identifier. The
real authority layer will be its only product caller; the named test host
`publishTrustedForTest` exposes this boundary solely for kernel tests. The
kernel always recomputes selected ordinary Record IDs itself. The input
context and all exported row/result tuple definitions must be written in
StateKernel/StateStore and reported before a separate reader consumes them.

**Store:** one mapping each for immutable Record rows, Envelope spines,
Type-cache provenance, occurrence lifecycle and two-word Binding heads, plus
enumerable record/envelope/type/principal/admission ordinals and accepting
batches. One postings store holds exact head words and five-u48 packed lanes;
Binding history is only its RAW_AUDIT posting family. Canonical bytes and
authority evidence are state-readable, not event-only. Keep all state in the
eventual Core's storage via internal libraries. No external mutable registry
or helper contract owns part of the atomic state.

**Plan/replay algorithm:**

```text
validate bounded carriage and selected Record identity commitments
read selected lifecycle; reject any terminal source
if all ACTIVE: check selected body/self-OCCREF only; return old receipts, no writes
validate exact ordered CAS coverage for mixed/fresh selected leaves
initialize bounded touched-row shadow from persisted state
for selected leaf ascending:
  resolve persisted/earlier-staged cache; validate body once; reject self-OCCREF
  classify exact kernel effect; associate CAS item even for ACTIVE duplicate
  if ACTIVE: return old receipt for this leaf; do not replay its effects
  validate references against persisted/earlier-selected availability
  plan intrinsic Type caches if this is a TypeSchemaGroup
  assign prospective ordinal and activate the source in shadow
  derive/deduplicate posting keys; fold Record/unique live counts
  apply CAS or admitted-target withdrawal using point-in-order shadow
  append planned history/first-scope anchors, keeping RAW_AUDIT separate
assert every counter/cursor/bound and the entire plan valid; storage unchanged
commit recorded after-values in the same order, asserting each before-value
return per-selected-leaf ADMITTED/ALREADY_ADMITTED and exact ordinal
```

The store owns metadata identity/provenance; the planner owns semantic choices;
replay owns writes only. Persistent group caches come from ordinary meta-Type
Record admission and real `TypeGroupParser` output, including a group earlier
in the same selected call. Intrinsic bootstrap setup is internal and one-time.
Kernel IDs are bound to exact group members; do not accept caller-provided
cache bytes. Withdrawal decrements the original target's re-derived distinct
key set once, not the Withdrawal source's keys; then zero-crosses unique-Type
liveness. Two sibling Withdrawals see the first planned terminal target.

- [ ] Write failing tests for Object + charter Binding in one call, whole-call
  rollback on invalid last leaf, and early-selected group → typed instance.
  Require exact row/counter/key/head outputs; stub must fail behavior, not compile.
- [ ] Implement store/read primitives and shadow/replay using Task 1 helpers.
  Test all twelve cases in the controlling stateful specification, with exact
  source-level typed rejections and full observable-state comparison after
  failure. No test-only seed port enters src/.
- [ ] Add test-host-only setup for exhaustion/PRE_WITHDRAWN source guards;
  label it unauthenticated setup, not proof of a working pre-withdrawal path.
  Exercise real kernel state for admitted-target withdrawal, retries and counts.
- [ ] Provide bounded raw state-read accessors in the test host for independent
  enumeration. They are not the final public PageCursor/query ABI and must not
  invent COMPLETE at an unverified basis. Preserve raw history/Scope flags.
- [ ] Run full Solidity regression, normal runtime build-size checks and
  self-review; report the exact exported tuples, managed-host deployment size
  status, RED/GREEN and unresolved source questions before committing.

## Task 3: Independent state reconstruction and local-chain pressure

**Files:** create `reference/state-reader.mjs`, `test/stateful-chain.test.mjs`
and `scripts/local-stateful.mjs`. Root owns the durable stateful verification,
README, card/status, followups and final review/publication.

The local runner must use managed loopback Anvil, disposable synthetic keys,
the existing gas/runtime ceilings and guaranteed child cleanup. No configurable
external RPC or unlimited code-size switch. If the stateful host exceeds the
real deployment limit, return the measured size and narrow the physical
topology problem explicitly; do not call an undeployable component ready.

The reader consumes a pinned-block snapshot through Task 2's actual read ABI.
It independently recomputes ordinary IDs, descriptor-derived caches, selected
admission ordering, lifecycle, Binding transitions, counts and all posting
keys. It may share cryptographic primitives/ABI decoding but not the producer
state fold or expected-root helper. Its reconstructed result must match every
enumerated actual row/head/posting and reject missing, duplicated, substituted
or reordered evidence. Incomplete transport yields basis-qualified UNKNOWN,
not a valid empty state. Retain originals for audit; no browser state is truth.

- [ ] Write literal reader tests before implementation for one Record/first
  Binding, withdrawn old producer, current-source tombstone and duplicate
  evidence. Establish failing RED against an explicit reader stub.
- [ ] Admit the exact four candidate groups into the new kernel through the
  trusted test host, then the Object/charter batch, rebind/lifecycle and mixed
  retry scenarios. Independently reconstruct every required posting family,
  immutable byte record, scope/history anchor and head at a pinned block.
- [ ] Run actual transactions for invalid-final-leaf rollback, race and retry;
  hash full enumerated state before/after (excluding chain transaction count)
  and verify no kernel mutation. Test tampered/missing reader evidence.
- [ ] Run full new Node/Solidity suites; record runtime/deployment and ordinary
  batch costs as internal-kernel evidence only. Do not regenerate old snapshots.
- [ ] Report all required stateful acceptance outcomes and remaining public
  authority/bootstrap/page/Lens/Files integration. Root performs independent
  task/joined review, updates durable handoff and continues toward full C0.
