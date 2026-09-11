# Retained test-first and verification evidence

Local experiment only. Commands run from this `contracts/` directory with Forge 1.7.1 (`4072e48705af9d93e3c0f6e29e93b5e9a40caed8`), Solidity 0.8.30, Cancun, optimizer 200, via-IR. No external Forge library, Anvil run or heavy traces.

## RED → GREEN stages

Tests preceded behavior implementation. Compilable ABI stubs deliberately reverted `NOT_IMPLEMENTED`; no noncompiling-import result is represented as a behavioral RED.

1. `forge test --match-contract TypesTest -v`: after correcting a test-only deployment/expectRevert ordering issue, **5 failed / 1 passed** against registry/validator stubs. Expected failures: bounded STATICCALL probe, canonical/malformed ABI bytes, changed/missing runtime, permissionless exact registration, uint malformed rejection. The generic rejection-only test already passed against all-reverting stubs; acceptance tests prevented that from being mistaken for a working registry. Implemented the reviewed validator allowlist, canonical ABI checks, exact identity, code hash pin and fixed-output bounded STATICCALL; same command **6 passed / 0 failed**.
2. `forge test --match-contract NativeTest -v`: **15 failed / 0 passed**, each `NOT_IMPLEMENTED`, against kernel/index ABI stubs (including bounded fuzz fixture: first case failed). Implemented kernel, immutable record store, separate-storage index, live and historical cursors, CAS/revisions/path behavior; same command **15 passed / 0 failed**, 128 fuzz runs.
3. `forge test --match-test 'testDescriptor|testHydrated' -v`: **2 failed / 0 passed**, both `NOT_IMPLEMENTED`, for retained descriptor bytes and one-call hydrated directory page. Implemented both; full suite **23 passed / 0 failed**. Removed hash-only registration so meaning bytes cannot be omitted through another overload.
4. `forge test --match-contract ExamplesTest -v`: after correcting a test getter/expectRevert ordering issue, **4 failed / 1 passed**. Producer initial/update authority, reader, and plain mapping control failed `NOT_IMPLEMENTED`; callback protection passed against the previously implemented registry primitive. Implemented the example producer/consumer and mapping; full suite **28 passed / 0 failed**.
5. Added measurement-only single-operation fixtures (no new production functionality), strengthened boundary fixtures and exact error checks, and formatted. Final **47 passed / 0 failed**, including 128 seeded fuzz cases. See `tests.txt`.

## Final reproducible commands

```sh
forge fmt --check
forge test --fuzz-seed 0x21 -v
forge test --match-contract GasOperationsTest --gas-report
forge build --sizes
```

`tests.txt` retains ordinary test output; `gas-report.txt` retains the gas-report run; `sizes.txt` retains build limits. The gas-report engine changes reported execution accounting relative to plain test mode. For example, ordinary test totals for unique edit/mapping-update are 267,517/10,820; gas-report test totals are 290,177/32,548, with function-row accounting different again. These are separate laboratory figures, **not real receipt costs**. Do not compare a plain-mode number to an instrumented-mode number or add nested function rows together. Constructor-created registry/index rows show zero deployment cost because their creation is included in kernel construction, not because they are free. Task 2 must obtain actual receipts, cold/steady distinctions and deployment allocation.

Plain test totals: hydrated page16 364,385; page32 703,155. These include one caller-side public call, ABI work and fixed harness overhead, not content opening. They demonstrate a bounded, one-call contract read; they do not establish production latency or chain-specific fees.

## Self-review

- Live IDs use swap-pop and every immediate child content/placement mutation changes generation; stale cursors reject before empty/end completion. Historical inventories pin append-only highs and make no hydrated-state snapshot claim.
- Namespace authority is only native caller; mandatory index has an immutable kernel owner and no upgrade/disable entry point. Fault-injected index failure reverts kernel record/revision effects atomically.
- Records, Types and names have distinct commitments. Local validator address excluded from TypeId; full descriptor bytes retained. File IDs include chain/kernel/caller/nonce and never derive from names or record bodies.
- Staticcall copies at most 32 return bytes; noncanonical, short, oversized, false, revert, OOG and state-mutating outputs reject. Callback test runs the actual bounded primitive in a test-only subclass; custom runtime registration remains unsupported.
- Unlink removes live navigation, never deletes old bytes/history. Recreate yields a new object. No directory moves, restores or plural views are implied.
- Forge formatting needed a second pass to normalize nested assembly test blocks. The hook installer assumes `.git` is a directory and rejects this worktree; the existing shared `commit-msg` hook was verified, not bypassed.

Independent review and real receipt/browser verification remain controller-owned next tasks.
