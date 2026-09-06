# C0 WritePlan and batch-evidence codec implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task-by-task. Do not restart completed tasks after continuation.

**Goal:** Provide reusable C0 commitment/retention codecs and an independently
written consumer before the authenticated Core wrapper uses them.

**Architecture:** Pure Solidity codecs consume the existing typed publication
header/CAS structs and new exact C0 Plan/Effects structs. A separate JS reader
decodes the retained packed evidence and independently recomputes commitments.
Test-only wrappers expose these pure functions; this increment has no mutation
entrypoint, authorization verdict, session framework or new Core state store.

**Tech Stack:** Existing Solidity 0.8.30/Cancun/optimizer200/viaIR, Node26,
ethers6.15, Forge/Anvil1.7.1; no new dependency or product repository.

**Spec:** [BatchAuthorityEvidence/1](batch-authority-evidence.md),
[C0 §4.1](../../Designs/efsv2/disposable-mvp-profile.md#41-one-composite-approval-and-publication-identity),
[authority boundary](authority-module-boundary.md). This plan implements the
common encoding/hash prerequisite, not the documents' later verifier,
historical-state authorization, operation, bootstrap or session obligations.

## Global Constraints

- Preserve every existing Record/Envelope/Occurrence identity, candidate Type
  input/artifact byte and historical test behavior. No source pin refresh.
- All integers are unsigned big-endian with the printed width; addresses are
  20 bytes and hashes are 32 bytes. Packed retention has no ABI padding/offsets.
- WritePlan is 220 bytes; effects are 241; evidence fixed framing is 564.
  Composite maximum is 1036 bytes, direct maximum 948; CAS count is at most64.
- Evidence version is 1; branches1 composite and2 direct only. Unknown versions
  or branches reject. No session payload, zero-filled grant or ACTIVE claim.
- Principal descriptor is exactly22 bytes, `01 00 || account20`. Composite
  witness is exactly65 bytes; direct witness and observed code are empty.
  Composite observed code is empty or exact23-byte `ef0100 || delegate20`.
- The public signature has no internal profile-tag byte. Canonical format
  does not prove signature validity, identity equality, permission or effect.
- Hashes use the exact source strings, field order and EIP-712 framing. A
  malformed count/order/width or unused trailing byte never normalizes silently.
- Wire/codec errors are local experiment errors, not silently allocated public
  AUTHORITY/result-registry selectors. Full external C0 request decoding and
  accepted-batch semantic validation remain separate required work.
- No test-only public unauthenticated mutator in src/, no RPC/node dependency
  in either pure codec, no producer encoder/fold import in the independent reader.
- Ordinary deployment/runtime/transaction ceilings remain unchanged. A pure
  codec deployment is not G0, authenticated C0 or a wallet-prompt measurement.
- Exact-path staging and commit-message file with actual model coauthor,
  `Agent: v2-pm`, `Harness: codex`; workers do not push.

Run commands from this review directory. Set `C0_CODEC_SOLC` to the existing
compiler path exported as `SOLC` by `scripts/local-stateful.mjs`; the controller
supplies that resolved local path in the task brief. Do not download or silently
substitute a compiler. Covering commands are:

```sh
forge test --offline --use "$C0_CODEC_SOLC" --match-path test/C0Codec.t.sol
forge test --offline --use "$C0_CODEC_SOLC"
forge test --root ../2026-09-05-c0-admission --offline --use "$C0_CODEC_SOLC"
forge build --offline --use "$C0_CODEC_SOLC" --ast --build-info --force
forge build --offline --use "$C0_CODEC_SOLC" --sizes
node --test test/*.test.mjs ../2026-09-05-c0-admission/integration.test.mjs ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs
```

The explicit fresh AST/build-info build precedes managed Node deployments after
any Solidity source change. A stale artifact/compiler mismatch is not a codec
failure. Keep the failed attempt and correction distinct in the report.

## Task 1: Pure Solidity commitments and bounded retention encoder

**Create:** `src/C0PlanCodec.sol`, `src/C0BatchEvidence.sol`,
`test/C0CodecHarness.sol`, `test/C0Codec.t.sol` in this review directory.
Existing StateKernel and all other producer sources are unchanged dependencies.

**Interfaces:**

```solidity
library C0PlanCodec {
    struct Plan {
        bytes32 c0ProfileId; bytes32 publicationDigest; bytes32 realmId;
        bytes32 realmEffectsDigest; address executor; bytes32 executorCodeHash;
        uint192 nonceKey; uint64 nonceSeq; uint64 notAfter;
    }
    struct Effects {
        bytes32 realmId; address core; bytes32 routeConfigId;
        bytes32 genesisReceiptHash; uint8 operationKind; bytes32 envelopeId;
        uint64 leafMask; bytes32 expectedRevisionsHash;
        address stateByteStore; bytes32 byteCommitment;
    }
    function publicationDigest(StateKernel.EnvelopeHeader memory header,
        bytes32[] memory recordIds) internal pure returns (bytes32);
    function expectedRevisionsHash(StateKernel.ExpectedRevision[] memory rows)
        internal pure returns (bytes32);
    function effectsHash(Effects memory effects) internal pure returns (bytes32);
    function domainSeparator(uint256 chainId, address core)
        internal pure returns (bytes32);
    function planStructHash(Plan memory plan) internal pure returns (bytes32);
    function planDigest(Plan memory plan, uint256 chainId, address core)
        internal pure returns (bytes32);
    function encodePlan(Plan memory plan) internal pure returns (bytes memory);
    function encodeEffects(Effects memory effects) internal pure returns (bytes memory);
}
library C0BatchEvidence {
    struct Evidence {
        uint8 branch; bytes descriptor;
        C0PlanCodec.Plan plan; C0PlanCodec.Effects effects;
        StateKernel.ExpectedRevision[] expectedRevisions; bytes witness;
        address actualSigner; address submittingCaller; address transactionOrigin;
        bytes observedAccountCode; uint64 admittedAtTimestamp; uint64 previousSequence;
    }
    function encode(Evidence memory evidence) internal pure returns (bytes memory);
}
```

Use the existing StateKernel header/ExpectedRevision structs by import, not an
additional independently evolving publication model. Pure tuple use does not
authorize calling its mutating functions. Harness functions mirror the public
names above as external pure functions, and `encodeEvidence(Evidence)` calls
the evidence encoder. Later Task2 consumes those exact ABI names/tuples.

Local Solidity errors are deliberately small and explicit:

- `C0PlanCodec.InvalidPublicationHeader()` for profile/authorityRef/authEpoch;
  `InvalidRecordCount(uint256 count)` for an empty or over64 vector;
  `InvalidExpectedRevisions()` for count/order/index violations.
- `C0BatchEvidence.UnsupportedBranch(uint8 branch)` for a branch other than1/2;
  `InvalidEvidenceFraming()` for descriptor/witness/code framing. CAS violations
  retain the Plan codec's error. The encoder always emits version1 and therefore
  has no caller-supplied version or unreachable unsupported-version error.

For deterministic negative tests, publication checks header before count;
evidence checks branch, descriptor, witness, observed code, then CAS. Solidity
ABI decoding supplies scalar width checks; do not add a second loose integer
representation. These are local experiment interfaces, not Core error adoption.

Source algorithms are direct fixed-field commitments:

```solidity
// TYPEHASH constants are hashes of the exact source strings, not new domains.
bytes32 rowHash = keccak256(abi.encode(EXPECTED_REVISION_TYPEHASH,
    rows[i].leafIndex, rows[i].revision));
bytes32 digest = keccak256(abi.encodePacked(hex"1901",
    domainSeparator(chainId, core), planStructHash(plan)));
bytes memory packedPlan = abi.encodePacked(plan.c0ProfileId,
    plan.publicationDigest, plan.realmId, plan.realmEffectsDigest,
    plan.executor, plan.executorCodeHash, plan.nonceKey,
    plan.nonceSeq, plan.notAfter);
```

Rows are ascending unique leaf indices below64. Hash their32-byte hashes in
order, with `keccak256("")` for empty. Enforce count/order/index bounds before
allocation. `publicationDigest` requires header profile1/zero authorityRef and
authEpoch, plus1–64 RecordIds; it does not parse bodies or authenticate author.
Effects/Plan hashing accepts their exact typed scalar fields without pretending
to verify their relationships against live Core context.

`encode(Evidence)` validates branch, exact descriptor/witness/code framing and
CAS bounds before variable copying. Encode version1, branch, descriptor,
packed plan, packed effects, count, packed revision pairs, branch witness,
three addresses, code length/code bytes, timestamp and previous sequence in
that order. For example, the last fixed fields are:

```solidity
bytes memory tail = abi.encodePacked(evidence.actualSigner,
    evidence.submittingCaller, evidence.transactionOrigin,
    uint8(evidence.observedAccountCode.length), evidence.observedAccountCode,
    evidence.admittedAtTimestamp, evidence.previousSequence);
```

No evidence checksum/ID or duplicate basis word is added. Bounded loops may
use straightforward packed concatenation; avoid an unreviewed generic buffer
framework or raw memory writer. No semantic validity verdict comes from this
encoder: zero sequence, incompatible signer/descriptor or forged signature may
be structurally represented for adversarial tests but must fail the later
authenticated-batch assessment. Return bytes only, not a `Verified` type.

- [ ] Start with a literal `planDigest` test against a failing explicit stub.
  Use the complete fixture below and require the printed digest. Demonstrate
  a behavioral assertion RED, then implement direct source hashing and GREEN.

  ```solidity
  function testLiteralPlanDigest() public {
      C0CodecHarness h = new C0CodecHarness();
      C0PlanCodec.Plan memory p = C0PlanCodec.Plan(
          bytes32(uint256(8)), bytes32(uint256(9)), bytes32(uint256(1)),
          hex"0c405e03b8602dec96cf4574d26783cb75cecdcfb06adb2869fe780df196a59d",
          address(2), bytes32(uint256(10)), 0, 1, 9000
      );
      require(h.planDigest(p, 31337, address(2)) ==
          hex"6fb6e6bbf70cbd51fa95b373752e525e9a79aea40051ba6a36bb5dd370187c4f",
          "literal C0 WritePlan commitment");
  }
  ```

  The test imports the two named files/types; a temporary implementation returning
  zero gives the intended assertion failure, not a missing-import compile failure.
- [ ] Extend to exact publication framing, empty/two/max CAS, reordered/duplicate
  CAS refusal, full uint192/uint64/uint256 boundaries and field-sensitive hashes.
  Use literal/manual ABI preimages in tests, not only encoder roundtrips.
- [ ] Add hand-framed composite/direct evidence examples before encoder code;
  require exact lengths and byte equality. Cover0/64CAS, missing/long descriptor,
  wrong prefix, short/long witness, unknown branch, empty/designator-to-zero code,
  invalid23-byte prefix, code lengths1/22/24 and direct nonempty-code refusal.
- [ ] Run focused Forge C0Codec tests, full Core/admission regressions and
  ordinary sizes. Self-review and commit only four owned files. Report source
  constants/error behavior, RED/GREEN and any ambiguity before Task2 starts.

### Literal hash fixture

`word(n)` is the32-byte big-endian integer; `address(n)` is its20-byte address.
This is deliberately a **codec fixture**, not a semantically valid live write.
CAS rows are `(leaf1,revision7)` and `(leaf63,revision4294967294)`.

Effects fields in source order: `word1,address2,word3,word4,8,word5,
9223372036854775810,casHash,address6,word7`.
Plan fields: `word8,word9,word1,effectsHash,address2,word10,0,1,9000`.
Domain: name `EFS2-MVP-C0-WritePlan`, version `1`, chain31337, Core `address2`.

```text
casHash          4efdbe2f47739ce9c5544159f07e456f85f0bf2ea5b463d244714bedad903d80
effectsHash      0c405e03b8602dec96cf4574d26783cb75cecdcfb06adb2869fe780df196a59d
planStructHash   a4fd0267c4aa60f334a1ae06cd1c03372081ab0a73e38cb0545daddb3cc6f9e0
domainSeparator  42227fe1cacfc7e934646314ed4171975a4f299efb99df14fa119558b2b7df01
planDigest       6fb6e6bbf70cbd51fa95b373752e525e9a79aea40051ba6a36bb5dd370187c4f
```

Root generated these via independent ethers TypedDataEncoder from the printed
source fields, then reproduced all five values with manually assembled ABI
preimages and the exact EIP-712 prefix, without a producer codec. The fixed
564-byte evidence length was independently summed. These remain test vectors,
not evidence that a Solidity codec exists.

## Task 2: Independent reader and deployed codec agreement

**Create:** `reference/c0-authority-codec.mjs`, `test/c0-codec.test.mjs`.
Consume Task1's fixed external-pure `C0CodecHarness` ABI. Do not edit Task1's
source/tests to make agreement pass; report a producer issue to root instead.

**Consumer interfaces (signatures only; these are not implementation stubs):**

```text
decodeBatchEvidence(hex) -> plain DecodedEvidence, no verdict
publicationDigest(header, recordIds) -> 0x bytes32
expectedRevisionsHash(rows) -> 0x bytes32
effectsHash(effects) -> 0x bytes32
domainSeparator(chainId, core) -> 0x bytes32
planStructHash(plan) -> 0x bytes32
planDigest(plan, chainId, core) -> 0x bytes32
```

Decoded object uses the Evidence/Plan/Effects field names above plus
`evidenceVersion:1`. Numeric fields are bigint, except small discriminators
`branch`, `evidenceVersion`, `operationKind`, `leafIndex` which are bounded
numbers. Hex bytes/addresses are lowercase exact-width `0x` strings. No RPC,
wallet, storage access or producer codec import belongs in this module.

Reader takes fixed widths with a checked cursor; validate hex and1036-byte cap
before conversion/allocation. Read branch before choosing signature length;
read bounded CAS count before allocating rows. Reject unknown version/branch,
truncation, invalid descriptor/code framing, CAS order/bounds and trailing data.
For valid but incompatible cross-field statements, return decoded fields;
the later historical-authority assessor owns their truth. Errors distinguish
unsupported version/branch from malformed known framing; neither means absent
Core state or a valid empty result. Export two local error classes:
`UnsupportedCodecError`, with `code` equal to `UNSUPPORTED_VERSION` or
`UNSUPPORTED_BRANCH`, and `InvalidCodecError`, with `code` equal to
`INVALID_FRAMING` (retained bytes) or `INVALID_VALUE` (hash-function inputs).
Names/codes are stable for this experiment's assertions, not a public SDK
result family. Check input hex and global cap first; only a complete version
or branch field can yield its unsupported error. Truncation before that field
is malformed framing. Hash inputs must use the specified bigint/number and
exact-width hex representation; catch ABI-library coercion/errors at this
boundary so they cannot silently accept negative, narrowed or string numbers.
Share crypto/ABI primitives, not the producer's field encoder, preimage helper
or state fold.

- [ ] Build independent literal packed strings using fixed-width field fragments
  before implementation, and assert decoded fields against hand-written objects.
  An explicit throwing/stub decoder must produce behavioral RED; implement
  bounded cursor decode to GREEN. Include designator-to-zero vs no-code.

  ```js
  import test from 'node:test';
  import assert from 'node:assert/strict';
  import { decodeBatchEvidence } from '../reference/c0-authority-codec.mjs';
  test('literal direct frame has no witness or account code', () => {
    const raw = '0x0001020100' + '00'.repeat(20 + 220 + 241)
      + '00' + '00'.repeat(60) + '00' + '00'.repeat(16);
    assert.equal((raw.length - 2) / 2, 564);
    const d = decodeBatchEvidence(raw);
    assert.equal(d.evidenceVersion, 1);
    assert.equal(d.branch, 2);
    assert.equal(d.descriptor, '0x0100' + '00'.repeat(20));
    assert.equal(d.plan.nonceSeq, 0n);
    assert.deepEqual(d.expectedRevisions, []);
    assert.equal(d.witness, '0x');
    assert.equal(d.observedAccountCode, '0x');
  });
  ```

  Run `node --test test/c0-codec.test.mjs` for RED/GREEN. This deliberately
  all-zero semantic fixture proves framing only; later tests compare every
  independently authored nonzero field and reject malformed byte mutations.
- [ ] Assert the printed hash fixture and independent publication preimages;
  mutate every committed field to show it changes the appropriate digest.
  Test hash functions' count/order/width refusals; do not narrow wide numbers.
- [ ] Decode Solidity output and compare every field, not only lengths/hashes.
  Reuse `compileStateful` and managed `withStateful` transport from
  `scripts/local-stateful.mjs` without changing its source. Deploy the compiled
  CodecHarness with `lab.send(artifact.bytecode.object)` and `lab.receipt`,
  require normal code/initcode/transaction ceilings, then use `lab.rpc` for
  exact ABI calls. This is an additional test-only codec deployment, not a
  changed Core/dependency topology or G0 run. No private/public external RPC.
- [ ] Test every truncation of representative valid evidence, extra trailing
  bytes, unknown tags, invalid lengths/prefixes,64CAS/full-width maxima and
  independently malformed-but-self-consistent objects. Assert exact decoded
  field values and typed error classes; do not merely count thrown errors.
- [ ] Run new Node tests, full Core Node/admission/Type-input checks, fresh
  offline Forge/size gate and managed cleanup. Report output/bytes/gas as
  codec-only evidence; self-review and commit only two owned files.

Root owns durable verification/status and one final joined review of this
two-task codec increment. Actual verifier programs, per-batch persistence,
nonce/retry law, session, bootstrap and Files remain subsequent integration,
not silently waived by pure codec agreement.

## Controller self-review

Scope coverage: Task1 implements the common hashes and complete two-branch
retention encoder; Task2 independently decodes every retained field and checks
deployed agreement and malformed input handling. The spec's historical-state
assessment, recovered signer, nonce/permission, storage, operation preflight and
session/bootstrap obligations are explicitly excluded integration work, not
missing codec tasks. No task makes a VERIFIED authorization claim.

Interface review: both tasks use the same Plan/Effects/Evidence and harness
names; header/revision structs come from existing StateKernel. JS is stricter
about input representation than the ABI library, retaining full-width bigint.
Local errors and fixed check order are supplied above. The literal fixture is
independent of the not-yet-written producer. Placeholder scan found no deferred
codec behavior; unsupported session work is intentionally outside this increment.
