# Lossless cache codec scalar-write experiment

> **For agentic workers:** use `superpowers:subagent-driven-development` for one bounded task, independent review and root verification. **Staged, not dispatched.** Complete the active full-C0 gate first; no parallel implementation/build/world owner.

**Goal:** measure whether replacing byte-at-a-time scalar writes makes the existing lossless cache codec materially cheaper without changing a single packed byte or its validation.

**Architecture:** replace only the codec's scalar writer with a backward-anchored masked memory store. Preserve the exact format, canonical ABI check, parsing, descriptors, count/bounds checks and all external methods. This is a standalone codec experiment, not Core integration.

**Tech Stack:** existing Solidity 0.8.30, optimizer 200, via IR, Cancun, Foundry, ethers and the lab's independent JS encoder/retained helper corpus.

**Spec:** [[2026-09-11-efs21-full-model-storage-preflight#Large Types: compact before transport and storage]]. Initial read-only preflight used the unchanged codec at full-prototype `1cb402a`. Its measured 64-field pack receipt is 756,051 gas including calldata and other work; none is yet attributed to the writer. Pin the then-current reviewed code before dispatch.

Independent read-only plan review approved the backward-anchored memory bounds, internal non-virtual test seam, old/old performance RED and paired evidence gates. No implementation or saving is established by that approval.

## Global constraints

- Disposable `planning-efs21-direct` / `codex/efs21-direct-apply` only; plans/results summaries on main. No Core/helper/Type/profile/SDK/browser change, public chain/funds, migration or adopted protocol.
- Preserve every logical field, descriptor, TypeId, schema hash, ordering, signed int256 bound, canonical ABI equality and malformed-frame rejection. No new compact format, weakened assertion, compiler-setting change or smaller Type language.
- Runtime 24,576, initcode 49,152 and transaction 16,777,216 remain. One finite managed world/build at a time; no traces or broad test globs; stop heavy work below 20 GiB. Preserve native49966/RPC49941, old54154/RPC54148, Fable60731/RPC60726 and all Fable work.
- Preserve historical lab evidence and source pins. New exclusive evidence names only, source/support committed before final paid results. Root owns review, reproduction and push; no children.

## Task 1: Bounded masked writer with actual codec receipts

**Files:** `Reviews/2026-09-11-type-cache-codec-lab/src/CompactCacheCodec.sol`; focused `solidity-test/ScalarWriter.t.sol` (the existing configured Foundry test directory) and test-only reference writer; a bounded differential/paid script and exclusive evidence under the same lab. Its public `pack(bytes)`, `unpack(bytes)`, `readHeader(bytes)` ABI remains unchanged. No changes to the encoder/oracle to accommodate a candidate output.

### 1. Pin the control and establish RED

- [ ] Retain exact old codec source/artifacts/settings and the lab's real-helper versus synthetic corpus classifications. Add byte-for-byte oracle comparison for all existing cases and the writer boundary cases below.
- [ ] Predeclare that the actual 64-field `pack` receipt must be strictly cheaper. Run the identical old/old codec pair first, with the same canonical calldata, per-transaction cold state and no access list; require its equality to fail that assertion. This is the performance RED. Do not substitute a missing method or functional tests that already pass for evidence of an optimization.

### 2. Replace the one scalar writer

Use this exact logic, with the existing range assertion first:

```solidity
function _write(bytes memory b, uint256 p, uint256 v, uint256 n)
    internal pure
{
    assert(n > 0 && n <= 32 && p + n <= b.length);
    if (n == 32) {
        assembly ("memory-safe") {
            mstore(add(add(b, 32), p), v)
        }
        return;
    }
    uint256 mask = (uint256(1) << (8 * n)) - 1;
    assert((v & ~mask) == 0);
    assembly ("memory-safe") {
        let at := add(b, add(p, n))
        mstore(at, or(and(mload(at), not(mask)), v))
    }
}
```

`internal` instead of the existing `private` is solely a test seam: a derived test harness can call the **actual production function body** at all widths. It adds no public method to the deployed codec. Do not make it virtual or introduce a new production library. Keep the old writer as a plainly labelled test-only oracle, with its original post-loop value-fit assertion.

For `n<32`, the word begins at `b+p+n` and ends at `b+32+p+n`, at or before the logical array end. The low `n` bytes are exactly the requested payload position; preceding bytes, including any overlapped length-word bytes, remain unchanged. This avoids relying on spare tail padding. The `n==32` branch permits the full uint256 domain. Value-fit refusal moves before memory mutation, but the transaction still reverts with the same panic; no externally visible partial write exists.

- [ ] Change no other pack/unpack/header logic. First run focused tests and inspect actual runtime/initcode sizes. If the proposed writer changes bytes, length, adjacent memory or refusal behavior, stop and diagnose rather than deleting a check to force a saving.

### 3. Test the real writer and full codec

- [ ] A derived harness calls the internal production writer, returns its output and asserts canaries. Compare against an independent byte-overwrite oracle for widths 1…32, zero and maximum-fitting values; lengths 1/31/32/33 and actual cache lengths; first/last positions, unaligned and crossed-word writes. Lengths smaller than a width are refusal cases, not padded valid inputs.
- [ ] Prefill output and allocations immediately before/after it, including a following allocation made **before** writing the output. Check all untouched payload bytes, array length, permitted padding, the free-memory pointer and zero slot. Exercise last-byte/last-two-byte writes and reserved-header regions; retain nonzero canaries instead of testing only zero-filled memory.
- [ ] Both writer harnesses reject width0/33, out-of-range position, overflowing `p+n`, and one-bit-too-wide values with the original exact panic behavior. The overflowing range expression must still fail before the writer, not silently wrap. Full-width uint256 is valid.
- [ ] Run the unchanged independent JS/Solidity corpus: actual-helper Types, nested descriptors, role/index/constraint cases, signed extrema and classified synthetic envelopes. Packed bytes, unpacked canonical ABI and headers must match exactly. Retain all malformed logical/physical framing tests, including unknown/reserved format, count overflow, crossed sections, trailing data and descriptor bounds.

### 4. Paid comparison and release gate

- [ ] Freeze candidate source and one explicit runner/support revision before final evidence. Compare exact old/candidate artifacts in serial finite worlds with identical corpus and operation calldata; retain all deployment/setup/success/failure receipts and actual runtime/initcode hashes/sizes. No historical evidence overwrite. A source-bound same-world pair is also acceptable if every paid call is a separate transaction with matched cold state and deployment/setup cost is kept separate; state the choice explicitly.
- [ ] Measure small and 64-field pack, unpack and header calls, plus the distributed-descriptor synthetic case. Show regressions as well as savings. Pack's calldata and ABI overhead are part of the receipt; do not label its entire reduction a gas estimate for future Core admission. A lower microbenchmark cannot prove a sixteen-Type group fits the unchanged helper/transaction caps.
- [ ] Focused Foundry plus the full codec differential/malformed suite, formatting, source/ABI pins, exclusive offline replay, independent review and root reproduction. Confirm owned worlds exited and only preserved demos remain. Report this as `PASS_CODEC_ONLY` still; integrated helper transport/storage and qualified Type reads remain a separate task.

## Ruling and limits

The reversible test-only visibility widening is preferred over testing a second handwritten copy of the candidate writer. Cost if wrong: source/API-of-inheritance churn within this disposable codec, not a new callable protocol method. Root records this decision before dispatch; a reviewer must still check compiled behavior and memory safety.

The real integration could still fail because of parser cost, total code deposit, nested-call gas, module sizes or read regressions. This task neither removes those gates nor assumes the future repricing proposals preserve today's cost ratio.
