# C0 Calldata Preparation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the bounded calldata-to-kernel-publication component for the next authenticated Core wrapper, without caller-supplied EnvelopeId/mask or pre-bound body allocation.

**Architecture:** One internal library consumes the existing exact tuples, checks logical and actual resource limits, and constructs the existing kernel memory value. A test-only receiver uses the full proposed C0 argument layout so size and malformed-offset tests exercise a real compiler-generated decoder. Authority, Files and storage remain the next join, not hidden test-host capabilities.

**Tech Stack:** Existing Solidity 0.8.30, Cancun, optimizer200/viaIR, Forge/Anvil1.7.1, Node26 and existing ethers6.15. No installations.

**Spec:** [Outer request boundary](outer-request-boundary.md), especially “Two different byte budgets” and “First implementation boundary: publication preparation only”. Principal/witness/operation rules in the rest of that note constrain the subsequent wrapper; this task must not execute them early.

## Global Constraints

- Work only in the owned `planning-mvp-c0` / `codex/mvp-c0-coherence` feature worktree. The shared codec is closed/published at `e1b0484`; do not reopen that final gate.
- This plan implements only the explicitly scoped first component, not the whole future publish function. No new product repo, main merge, PR, public deployment, user data, protocol adoption or permanent bytes.
- Preserve every candidate Type blob, source pin, existing identity/domain and existing stateful/helper/library source. No schema refresh, generic parser framework, planner split or new production dependency.
- `MAX_ENVELOPE_LEAVES=64`, `MAX_BODY_BYTES=8192`, aggregate body budget8192, logical publication-wire budget16384; at most64 CAS rows. `W=544+32*N+160*K+sum(ceil32(bodyLength))`; actual call cap=`21412+ceil32(uint256(F))`, where F is the trusted uint64 run file cap.
- Count and length passes precede all body hashing/copying. Account/witness fields stay untouched here so the subsequent AUTHORITY error order is not changed. No success/permission/readiness flag is returned.
- No relaxed EVM size/gas limits. Local managed Anvil only, normal16777216 transaction ceiling; no personal wallet or public RPC.
- Use apply_patch and behavioral TDD; initial missing-import/compiler failures are tooling/setup, not behavioral RED. One implementer, no children. Root owns design/status/docs/publication.
- Stage exactly owned paths and commit via message file with `design:` plus actual model, `Agent: v2-pm`, `Harness: codex`; no push. Preserve scratch/evidence.

---

### Task 1: Bounded publication preparation on the actual parameter layout

**Files:**
- Create: `Reviews/2026-09-05-c0-core/src/C0Request.sol`
- Create: `Reviews/2026-09-05-c0-core/test/C0RequestHarness.sol`
- Create: `Reviews/2026-09-05-c0-core/test/C0Request.t.sol`
- Create: `Reviews/2026-09-05-c0-core/test/c0-request.test.mjs`
- Report only: ignored `.superpowers/sdd/request-bounds-plan/task-1-report.md`

**Interfaces:**
- Consume unchanged `StateKernel.EnvelopeHeader`, `SelectedLeaf`, `ExpectedRevision`, `Publication`; inspect their declarations in `src/StateKernel.sol`, not copied guessed tuples.
- Consume unchanged `C0PlanCodec.publicationDigest(header,recordIds)` and `InvalidExpectedRevisions()`; Record identity is `keccak256(abi.encode(keccak256("efs2/record/1"),typeId,keccak256(body)))`, Envelope identity is `keccak256(abi.encode(keccak256("efs2/envelope/1"),publicationDigest))`.
- Produce these **internal** library interfaces:

```solidity
struct Prepared {
    StateKernel.Publication publication;
    bytes32 publicationDigest;
    uint256 equivalentWireBytes;
}

function maxCallBytes(uint64 fileCap) internal pure returns (uint256);
function prepare(
    StateKernel.EnvelopeHeader calldata header,
    bytes32[] calldata recordIds,
    StateKernel.SelectedLeaf[] calldata leaves,
    StateKernel.ExpectedRevision[] calldata expectedRevisions,
    uint256 payloadLength,
    uint64 fileCap
) internal view returns (Prepared memory);
```

- The test harness constructor takes `uint64 fileCap` as an immutable. Its external `inspectBoundsForTest` has **exactly the ten parameter types/order** of the spec's proposed publish function and returns `C0Request.Prepared`. Define the existing `AccountPrincipal` tuple locally for this test transport. Pass `payload.length` and the immutable cap to `prepare`; never expose a caller-adjustable cap on that entrypoint. Effects/Plan/branch/Principal/witness are deliberately not authenticated or consumed by this component. Document that fact on the harness and in tests.
- `limitForTest(uint64 fileCap) external pure returns(uint256)` may expose only the internal size arithmetic for the u64 maximum case. No test mutation surface or trusted admission is added.
- JS uses existing `compileStateful`, `withStateful`, `TX_GAS` from `scripts/local-stateful.mjs` for bounded test-artifact deployment and cleanup. Do not alter that transport/helper or import a producer encoder to define expected identities.

- [ ] **Step 1: Add a compiling interface stub and behavioral failing tests.**

Start the helper with its signatures and named errors, ending `prepare` with
`revert E_EMPTY_ENVELOPE();`. The first green-path assertion must then fail
because real bounded preparation is missing, not because a file/export cannot
be imported. Build the matching full-layout test receiver in the same step.
Use a literal one-byte body for this component (opaque framing, not valid typed
application data) and independent preimages:

```solidity
bytes memory body = hex"42";
bytes32 typeId = bytes32(uint256(7));
bytes32 recordId = keccak256(abi.encode(
    keccak256("efs2/record/1"), typeId, keccak256(body)
));
// Header=(1,word11,0,0,word12,0), RecordIds=[recordId], leaf=(0,typeId,body).
// CAS=[], Principal=(1,empty,address20), composite witness=65 nonzero bytes,
// payload empty; the receiver does not authenticate these values.
assertEq(result.equivalentWireBytes, 768);
assertEq(result.publication.leafMask, 1);
assertEq(result.publication.recordIds[0], recordId);
```

Add exact-signature rejection assertions for each ordered guard in the spec.
Do not let an earlier unrelated error accidentally satisfy the intended test.
The F=8192 synthetic cap lets a 64×128-body request enter the application and
reach `E_WIRE_LIMIT(21024)` instead of failing the smaller whole-call cap first.
For exact W=16384, use N=K=M=64 and body lengths `[1505,1,...,1]`; CAS indexes
0..63 are syntactic carriage only, not a claim those dummy Types are Bindings.
At F=0 the composite call is exactly21412 bytes; at F=32 a W=16416 sample can
reach the logical-wire refusal without first exceeding actual call size.

- [ ] **Step 2: Run the focused RED and retain the precise failure.**

From the Core review directory, resolve the existing pinned SOLC path with
`scripts/local-stateful.mjs`'s exported `SOLC`; put any shell assignment on its
own line before use. Run `forge test --offline --use "$C0_REQUEST_SOLC" --match-path test/C0Request.t.sol -vv`.
Record actual command, source state, assertion failure and exit; compile/setup
errors must be corrected before claiming behavioral RED.

- [ ] **Step 3: Implement the ordered bounded scan, then materialize.**

Implement the spec's eight guard stages and exact signatures. `E_BOUNDS(1)`
uses `uint16`; all existing B0 error widths remain exact. The two new C0
resource errors each carry `(uint256 got,uint256 maximum)`. The arithmetic is
bounded after count checks, with uint64 F widened **before** adding31:

```solidity
function maxCallBytes(uint64 fileCap) internal pure returns (uint256) {
    return 21412 + ((uint256(fileCap) + 31) / 32) * 32;
}
// After actual-call, payload, header and count guards:
uint256 wire = 544 + 32 * recordIds.length + 160 * leaves.length;
uint256 total;
uint64 mask;
for (uint256 i; i < leaves.length; ++i) {
    uint16 index = leaves[i].leafIndex;
    if (index >= recordIds.length || (i != 0 && index <= leaves[i-1].leafIndex))
        revert E_LEAF_RANGE(index);
    uint256 length = leaves[i].body.length;
    if (length > 8192) revert E_BODY_LIMIT(length);
    total += length;
    if (total > 8192) revert E_BODY_LIMIT(total);
    wire += ((length + 31) / 32) * 32;
    mask |= uint64(1) << index;
}
if (wire > 16384) revert E_WIRE_LIMIT(wire);
// Validate all CAS indexes/order next, without a Type/state lookup.
// Only after both passes, hash bodies and compare positional RecordIds.
```

Then compute the unsigned digest through `C0PlanCodec`, derive EnvelopeId and
construct `Publication(envelopeId,header,recordIds,mask,leaves,expectedRevisions)`
as bounded memory. Return it with digest and W. A second independent caller
EnvelopeId/mask is not part of this interface. Do not refactor the closed codec
to optimize bounded copies speculatively.

- [ ] **Step 4: Challenge bounds, precedence and ABI aliasing.**

Cover at least:

- Every count zero/max/max+1 rule, ascending indexes including bit63, duplicate
  RecordIds remaining legal, duplicate/descending/out-of-range selected or CAS
  indexes, individual/aggregate body boundary, header profile/reserved fields.
- A mismatched first RecordId plus a later oversize body must hit the body
  bound first, proving the whole length pass precedes any body hashing.
- Whole-call cap exact/+1 using a suffix, and payload F/+1 in a small request
  that does not hit the call cap first; F=`type(uint64).max` arithmetic does
  not narrow/overflow. Non-byte operation semantics are not tested as present.
- An alias-amplified body vector: start from two ascending selected tuples
  with bodies `[empty,8192bytes]`, then change only the first tuple's relative
  body offset to address the second body's existing tail. The actual request
  remains small but logical body total is16384 and must refuse with
  `E_BODY_LIMIT(16384)`. Do not alias the whole tuple, which would merely test
  duplicate selected indexes and miss the body-budget requirement.
- Ordinary decoder-accepted semantic-equivalent gaps/aliases/suffixes within
  cap produce the same digest/EnvelopeId/mask; exact byte bodies/order remain
  unchanged. Inaccessible live body offsets and inflated live lengths refuse.
  Do not claim every truncated padding byte or unused field fails eagerly.

Use read-only inspection of the pinned compiler's IR/assembly or a bounded
focused trace to confirm the publication length scan precedes body copies.
Report the specific inspected path, not a global decoder or memory-safety
proof. There are no kernel writes in this receiver.

- [ ] **Step 5: Independently encode/deploy/compare from JS.**

Use the exact tuple types in the spec and manually counted W/call formulas.
Construct the four printed arithmetic rows and independently hash each Record,
unsigned statement and Envelope preimage; do not invoke the new Solidity
helper or producer field encoder for expected values. A full standard ABI
encoder is transport, not authority evidence.

Deploy the real test receiver under normal limits using the existing managed
runner, call it, compare every returned Publication field and both IDs/digest,
check the refusal cases that can be distinguished through exact revert data,
and record actual runtime/initcode/deploy gas. No assertion that component fit
establishes future Core fit. Close the runner even when a check fails.

- [ ] **Step 6: Covering checks, self-review and exact commit.**

From Core, build fresh AST/build-info because a new Solidity source was added:

```sh
forge build --offline --use "$C0_REQUEST_SOLC" --ast --build-info --force
forge test --offline --use "$C0_REQUEST_SOLC"
node --test test/*.test.mjs ../2026-09-05-c0-admission/integration.test.mjs ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs
git diff --check
```

Focused iteration first, full covering commands once on final source. Existing
compiler warnings are disclosed, not silently suppressed or fixed outside
ownership. If adding sources changes artifact metadata references, diagnose
that exact issue; never rewrite candidate/history pins to make tests green.

Self-review against each spec guard/interface. Stage exactly the four owned
files. Commit via a message file and verify paths/trailers; no push. Write the
ignored report with behavioral RED/GREEN provenance, final source SHA, exact
tests/output/counts, arithmetic/ABI/trace observations and resource results.
Keep unavailable evidence explicit rather than claiming it was observed.

## Controller completion and next join

Root independently checks the component, obtains the normal task/final gate,
updates the existing status/card and publishes only the authorized feature
branch. The next increment consumes this component in the compiled C0
authority/write path with one kernel planner and fresh-only evidence/nonce
persistence. Complete bootstrap/Files/session/SDK/static-SPA remain the native
goal; this preparation component alone closes none of those acceptance rows.
