# MVP-C0 executable foundation implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: use superpowers:subagent-driven-development task-by-task; keep all implementation explicitly disposable.

**Goal:** execute exact manifest/deployment codecs and bounded byte storage in Solidity with independent JavaScript verification.
**Architecture:** isolated private test package in this planning worktree; no new repository. Exact source-pinned run formats feed a separately testable carrier; a test-only host supplies the missing Core boundary, visibly not Core conformance.
**Tech Stack:** Solidity 0.8.30, Foundry 1.7.1, Cancun, optimizer 200/via-IR; Node 26.0.0 and locked ethers 6.15.0.
**Spec:** [[run-codec]], read alongside the pinned September profile and manifest.

## Global Constraints

- Namespace: `efs2/mvp-c0/2026-09-03`; random nonzero run IDs for component tests.
- No production implementation, public deployment, durable data, main merge or semantic freeze.
- No sibling v1 implementation dependencies, shared helpers as both sides of a parity assertion, or secrets/machine paths in published artifacts.
- Tests target real codec/carrier behavior; host-only phase simulation is labeled and never counted as actual Core, grant, SR-17, Files or G0–G12 execution.
- Every altered behavior has an observed failing test before its implementation and focused passing checks after it.
- Only the controller commits shared planning/status files. Implementers own their assigned package paths and do not spawn reviewers.

## Task 1: Strict run codecs and an isolated build

**Files:** create `package.json`, `package-lock.json`, `foundry.toml`, `.gitignore`,
`src/C0RunCodec.sol`, `reference/run-codec.mjs`, `test/run-codec.test.mjs`,
`test-sol/RunCodec.t.sol`, `test-sol/CodecHarness.sol`, `scripts/check.mjs`
under this review directory. Do not modify the specification or plan.

**Interfaces:** Solidity pure library `C0RunCodec` with SeedInputs and Deployment
structs and encode/decode/hash functions; Node exports `encodeSeed`,
`decodeSeed`, `experimentSeed`, `encodeDeployment`, `decodeDeployment`,
`experimentCommitment`, `c0ProfileId`. Node values use BigInt or canonical
decimal strings, never lossy Numbers. Test harness exposes ABI-callable codec
functions for later independent integration; it contains no admission state.

- [ ] Add private package/config and exact lockfile; use `npm install --ignore-scripts` and no sibling modules. `scripts/check.mjs` verifies tool/compiler versions, then runs Node and Foundry checks. `EFS_C0_SOLC` may point at the already installed matching compiler.
- [ ] Write tests first for valid fixture round-trip plus truncation/trailing, wrong namespace, width overflow, duplicate/reordered commitment labels, zero required fields, and max u64 preservation. Example behavior:

  ```js
  assert.throws(() => decodeDeployment(valid264Bytes + '00'));
  assert.equal(decodeSeed(encodeSeed({ ...sample, transactionGasMargin: (1n<<64n)-1n })).transactionGasMargin, (1n<<64n)-1n);
  ```

- [ ] Run red tests against deliberately incomplete codec methods, then implement exact spec encoding/decoding and original seed/deployment/profile domain formulas. Keep both languages' encoders independent.
- [ ] Verify Node tests and Solidity tests; include mutation of each deployment field and different sources/toolchains changing commitments. Publish no synthetic vector as a valid genesis manifest.
- [ ] Commit exact task paths and record commands, versions, RED/GREEN outputs, API signatures and remaining scope in the task report.

## Task 2: Real bounded byte-carrier contract

**Files:** create `src/C0ChunkTree.sol`, `src/MvpC0StateByteStore.sol`,
`test-sol/CarrierHost.sol`, `test-sol/StateByteStore.t.sol`; consume Task 1's
`src/C0RunCodec.sol`. Add test harness ABI artifacts only under generated out.

**Interfaces:** carrier constructor and Core-context interface exactly as spec;
`sealFromCore(bytes)`, `putFromCore(bytes32,bytes,bytes)`,
`metadata(bytes32) -> (bool,bytes)`, `read(bytes32)->bytes`,
`readRange(bytes32,uint64,uint32)->bytes`,
`entries(uint256,uint32)->(bytes32[],uint256)` plus public facts/counts.
Inventory limit is 1..64, cursor<=count; next cursor equals count at end.
Use the source-pinned ChunkTree tree and B0 Record formula.
Consume controller-provided `fixtures/chunk-tree-known.json` as independently
derived expected values. Five-chunk coverage needs a test cap above 16384 or a
pure tree test; it does not change Task 3's disclosed measurement cap.

- [ ] Write failing tests for unsealed/unauthorized/repeated/mismatched seals, wrong runtime hashes, wrong context and enclosing rollback.
- [ ] Implement seal and frozen-context checks; make enclosing initialization revert leave carrier unsealed.
- [ ] Write failing storage tests: missing vs canonical empty, cap/cap+1, mutated data/geometry/body padding/RecordId, duplicate noninflation, receipt-pending writes, EOF/overflow/zero range, pagination and reverted enclosing put.
- [ ] Implement immutable complete-file storage and verification. Check 1/2/3/5 chunk trees and short final chunks; add fuzzed range and byte-mutation cases without unbounded test allocation.
- [ ] Run complete Foundry package checks and self-review; commit task-owned paths and record RED/GREEN evidence. Explicitly identify the host as a test double, not real C0.

## Task 3: Independent local-EVM recovery and measurement inputs

**Files:** create `reference/chunk-tree.mjs`, `test/local-carrier.test.mjs`,
`scripts/measure-carrier.mjs`, `scripts/local-carrier.mjs`, `README.md`; update `scripts/check.mjs` to include
integration. Write a generated non-secret `artifacts/carrier-measurements.json`
only if the report contains genuine observed values and explicit coverage.

**Interfaces:** consume compiled codec and carrier/host ABIs from Tasks 1–2.
Node starts one loopback Anvil instance with no persistent chain state, cleans
it up even on failure, deploys these experimental components and uses independent
reference encoding/tree computation, not the Solidity helper as expected output.
The shared `local-carrier.mjs` owns only local process lifecycle, ABI deployment,
serialized transaction helpers and observed context. Keep independent content
verification in `reference/chunk-tree.mjs`; setup reuse is not a parity oracle.
Check the JavaScript tree against `fixtures/chunk-tree-known.json`, which was
derived separately using `cast`, including the two wrong three-chunk roots.

- [ ] Write red parity and recovery tests: Node seed/deployment bytes and hashes equal independently executing Solidity; recovered complete file verifies after discarding local data; mutated recovered bytes fail; missing/empty differ; multiple chunks and partial final chunk verify.
- [ ] Independently implement tree/body/RecordId and range verification. Use serialized transaction/state reads, not events as the reconstruction source. No claims of account/storage proof verification.
- [ ] Exercise the real carrier on loopback EVM; test atomic rollback, phase gate, and changed deployment/context. Validate runtime code against observed hashes.
- [ ] Measure candidate sizes `[0,1,4096,8192,12289]` under a disclosed test cap of 16384 bytes; report actual write/full-read/range-read gas, stored-byte counts and response sizes. Mark proof, full-Core overhead and formal cap selection unmeasured. Do not derive a valid experimentSeed from this partial report.
  Use receipt `gasUsed` for the carrier/host write and deliberately sent local
  read-method transactions, or identify a different observed execution metric
  precisely; never call `eth_estimateGas` an actual receipt measurement.
  Ordinary product reads remain RPC calls, not wallet transactions. Pin Anvil
  to Cancun and report its effective block gas limit without disabling bounds.
- [ ] Run the single check command, regenerate measurement output and review the complete increment. README states precisely what ran, what remains NOT_RUN and next complete-Type/Core input task. Commit exact paths and hand off without reopening permanent design choices.
