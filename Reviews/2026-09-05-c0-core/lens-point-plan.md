# Real-store Lens point resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Resolve ordinary admitted ResolutionPlan Records against the existing checked Binding Store, with independent consumer equivalence and actual 1/8/32/64-source measurements.

**Architecture:** Add the selected B0 Lens walk as internal code behind the existing fixed QueryReadLibrary. A derived test host exposes the four B0 methods and keeps the same Store, writer and constructor. This is an executable revision-one experiment, not authenticated C0, a new deployment grammar, or a production SDK.

**Tech Stack:** Solidity 0.8.30, Cancun, optimizer200, viaIR, Foundry/Anvil, existing Node/ethers harness. No dependency installation.

**Spec:** [B0 Lens](../2026-08-13-efs2-stage-a-corpus/chapters/b0-lens.md), [fixed read libraries](read-library-layout.md), [consumer handoff](../2026-09-09-v1-parity-overnight/directory-read-next.md).

## Global Constraints

- Existing isolated experiment worktree/branch only; no main merge, public deployment, funds, product-repo edits or protocol promotion.
- Same StateStore and sole admission writer; no second plan store, Lens registration state, mutable resolver routing or additional linked dependency.
- Preserve all existing checks, caps, sources of expected truth and saved benchmark controls. QueryReadLibrary remains link-free; full host runtime24,576 bytes, full initcode49,152 bytes and transaction gas16,777,216 are hard gates.
- Use full bytes32 Principals. Exact target equality includes kind, targetA and targetLeaf. A plan author does not choose a risk-bearing consumer's policy.
- Ordinary plan RecordId, canonical MC/1 u16 frame prefix and fixed-offset frame. No parallel PlanId hash and no caller-selected expected Type.
- Temporary ResolutionPlan Type is exactly `0x05cc2a7f4eec5faff7e64f2f8374aca5f980d390fd4eee3b46c2f5c53853e61e` from the existing [candidate artifact](../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json). A named experiment constant may pin it; test recomputation must bind it to that existing artifact. It is not a permanent Type decision. Do not change Store initialization or descriptor bytes to add the resolver.
- This host has one retained revision. B0 resolve observes current executing state, not arbitrary H. RPC clients pin one block/hash; revision-aware upgrade reads remain explicitly outside this checkpoint.
- Synthetic trusted publication establishes mechanics, not EOA/1271/session authentication. B0's intrinsic authority assumption may be exercised only under that explicit limitation.
- Raw Scope anchors are discovery evidence, not resolved current Files rows. This increment supplies the missing point engine, not a full browser or all v1 parity.

## Task 1: Deployed B0 resolver, independent oracle and measured consumer

**Files (relative to this review directory):**

- Create `src/LensPlan.sol`: bounded pure parsing/validation and shared exact result/plan shapes.
- Create `src/StateLensReads.sol`: plan loading through checked StatePointReads, current Binding probing through checked StateBindingReads, deterministic combination.
- Modify `src/QueryReadLibrary.sol`: only append four Lens forwards/imports; keep existing six forwards unchanged.
- Create `test/LensReadHarness.sol`: derive AuditPageReadHarness; guarded B0 ABI and separately labeled corruption fixture if necessary.
- Create `test/LensReads.t.sol`: pure grammar/matrix/corruption/dependency/state-preservation cases plus a small statically calling consumer and admin-pinned gate.
- Create `reference/lens-resolver.mjs`: independent fixed-frame parser and declarative combiner over a supplied verified retained-state snapshot, never calling the getter under test for expectations.
- Create `test/lens-reads.test.mjs`: real admissions, oracle comparisons, exact ABI/runtime provenance, sizes/bytes/gas, cleanup and honest boundaries.
- Modify `test/support/linked-read-host.mjs`: only extend the closed accepted host inventory to LensReadHarness; preserve exact source/link/immutable inventory verification and old host behavior. If an additional narrow helper is necessary, explain it before expanding.

All other runtime/reference/control paths are protected, especially StateStore, StateKernel, AdmissionLibrary, StatePointReads, StateBindingReads, StateReadPrimitives, old browser code, upgrade source and original state-reader.

**Interfaces:**

Consume `StatePointReads.getRecord(s,recordId) -> (typeId,body,firstOrdinal)` and `StateBindingReads.getBindingHead(s,bindingKey) -> (BindingFold.Head,realmBasis,H)`. Share the current basis through StateReadPrimitives/checked initialized state without weakening it. A body under the wrong exact Type is BAD_TYPE; unknown Record is unavailable. Corrupt retained state still reverts ErrReadState, not a manufactured ABSENT.

Produce the B0 chapter's exact four methods, errors, enum numbers and tuple order:

```solidity
function resolve(bytes32 planRecordId, bytes32 positionKey)
    external view returns (ResolveResult memory);
function resolveStrict(bytes32 planRecordId, bytes32 positionKey, uint8 acceptMask)
    external view returns (ResolvedTarget memory, ResolveResult memory);
function validatePlan(bytes32 planRecordId)
    external view returns (bool ok, uint8 rejectCode);
function deriveBindingKey(bytes32 principalId, bytes32 positionKey)
    external pure returns (bytes32);
// Errors: PlanUnavailable(bytes32), PlanMalformed(bytes32,uint8),
// ResolveNotAccepted(uint8,uint8). ReadCodeMismatch still precedes read work.
```

Structs are defined once in LensPlan or StateLensReads and consumed by forwards/tests, not separately redeclared under inconsistent ABI layouts. `deriveBindingKey` is pure and needs no runtime dependency call/guard; the other three test-host forwards guard Query code before any state access. `resolveStrict` follows the specified mask machinery; gate conformance separately pins FOUND-only, purpose/scope and the admin-approved PlanId.

- [ ] **Step 1: Write red grammar and semantic tests.** Read the complete B0 chapter, including all T1–T10 transitions. Start with a missing `LensPlan` import or missing deployed method and run a targeted test to establish red. Encode the canonical body independently, for example:

```js
const frame = Buffer.alloc(96 + 64 * entries.length);
frame[0] = 1;
frame[1] = combiner;
frame[2] = flags;
frame.writeUInt16BE(k, 4);
frame.writeUInt16BE(entries.length, 6);
Buffer.from(purposeScope.slice(2), 'hex').copy(frame, 32);
Buffer.from(profile.slice(2), 'hex').copy(frame, 64);
for (const [i, e] of entries.entries()) {
  Buffer.from(e.principal.slice(2), 'hex').copy(frame, 96 + 64 * i);
  frame.writeUInt16BE(e.tier, 128 + 64 * i);
}
const prefix = Buffer.alloc(2);
prefix.writeUInt16BE(frame.length);
const body = '0x' + Buffer.concat([prefix, frame]).toString('hex');
```

Vectors cover N1/8/32/64 and65 refusal; all13 structural reject codes; short/long/noncanonical prefix; all reserved bytes; unsupported profile distinct from malformed plan; same principal across different tiers; ties/ascending order; false singleton assertion; nonzero authority floor. Multi-fault vectors verify the chapter's validation order, not whichever parser branch is easiest.

- [ ] **Step 2: Implement bounded parser and current-state walk.** Load only via getRecord; validate Type and structural body before probing. Recheck the exact Record identity if the existing getter's evidence contract requires it for hostile body substitution; do not accept altered bytes under a retained id. Parse fixed offsets only after length guards. Use the B0 basis tuple `(revision,block.number,H,AUTHORITATIVE_LOCAL)`, guarded uint64 block narrowing. Initialize non-found targets to zero and winnerIndex to0xffff.

```text
EXACT: consult all N; >=2 distinct present targets => CONFLICT;
       else present<N => ABSENT; else FOUND(common).
PRIORITY: consult a complete ascending tier; disagree => CONFLICT;
          any present and agree => FOUND; none => next tier;
          no present in any tier => ABSENT.
THRESHOLD: consult all N; count equal full targets;
           >=2 groups reach k => CONFLICT;
           exactly one reaches k => FOUND; none => ABSENT.
```

PresentCount counts consulted BOUND entries only. AgreeCount is zero without a winner; FOUND chooses the lowest stored index carrying the winning target. Tombstones and UNSET are absent *for generic Lens combination*, whereas Files whiteouts are selected target Records interpreted by the later Files consumer. Do not conflate those two layers.

- [ ] **Step 3: Exercise adversarial semantic/state boundaries.** Implement each T1–T10 test; partial EXACT disagreement outranks silence; priority lower tiers are unconsulted after a winner but same-tier disagreements cannot hide; threshold two qualifying groups conflict; RECORD vs OCCURRENCE and same-envelope/different-leaf differ; two Principals sharing low160bits remain distinct. Exercise stale/current withdrawal and rebinding from real publications, invalid plan Type/body, missing plan and unknown profile. With a corrupt consulted head, revert rather than fall through; corruption in an unconsulted lower tier must not perturb a valid priority result. No false claim of managed-Principal UNKNOWN coverage.

- [ ] **Step 4: Add independent retained-state comparison.** Use the unchanged `readState(reader)` and a pinned canonical block. The JS oracle parses admitted body bytes itself, derives full Binding keys and reads the verified fold, not resolve/getBindingHead results. Missing/unverified snapshot/plan yields explicit UNKNOWN; unknown semantic profile UNSUPPORTED. Compare every on-chain field, including counts, winner ordinal, basis and exact target. Tests inject missing high-priority coverage and prove no lower-source fallback. Keep oracle functions small and named; no broad copied Solidity walk or compact multi-statement test blocks.

- [ ] **Step 5: Deploy the actual consumer and measure 1/8/32/64.** Reuse the exact five-component host deployment/provenance checker; no extra linked library. Admit the existing Type groups, ordinary plan bodies and Binding facts normally. Use fresh scoped snapshots/managed chains to keep the fixed diagnostic collector within its existing limits. At each N, measure all-present EXACT, priority first/last/absent, and threshold disagreement/winner. Record full host/library runtime and initcode, setup transaction gas, exact resolve/strict/validate returndata bytes and actual single-call gas. Measure first/second internal static calls in one deployed consumer transaction with `gasleft` deltas as explicitly marginal cold/warm observations, separate from transaction gas. Do not label estimates or synthetic seeded heads real admission measurements. Preserve all observed retained state before/after reads and consumer calls.

- [ ] **Step 6: Prove the consumer trust boundary.** A gate stores an admin-selected PlanId and expected purpose/scope, and only acts on FOUND of the expected target class. Direct resolve of an attacker's self-approving plan may return FOUND but must not change gate state. Unauthorized plan replacement fails. Wrong purpose/scope, target class and a non-FOUND resolution fail. Use a normally deployed consumer under the unchanged caps, not just an oversized Forge harness. Test Query-library missing/substituted code refusal and that read methods do not call Preparation.

- [ ] **Step 7: Run full regression, self-review and commit exact source paths.** Use the local compiler path already configured by the runner; a forced `forge build --ast --build-info --force --offline --use <compiler>` is required when build-info is stale. Run Core Forge plus all Core Node tests serially. Preserve saved evidence exports. A normal cap failure must be reported with actual measurements; do not remove validation to fit. Record all warnings distinctly. Read your diff, run whitespace checks, commit using `git commit -F` and Agent:v2-pm/Harness:codex/Astra co-author trailers. Never push. Return a bounded report with source commit, exact commands/results, scope deviations, diagnostics and remaining limits for parent task/final review.

## Parent integration and handoff

Parent independently reviews source, reruns full Core/upgrade/Files/SDK regressions with historical JSON exports disabled, records fresh evidence and explicitly compares measured costs with B0's old two-slot arithmetic. Then independent task and whole-increment reviewers gate experiment-branch publication. If the Query library overflows, retain the evidence and propose a bounded factoring decision; it is not authorization to add an uncommitted deployment dependency.

The next Files consumer must union complete Scope anchor chains across selected Principals, recover roles, resolve positions at one basis, then validate Files entry/name/whiteout/target semantics. It must retain unknown/conflict rows, dedupe by position rather than claimant label, preserve partial coverage and provide a focus-safe usable result. That integration and revision-aware upgrade qualification are not silently included in this point checkpoint.
