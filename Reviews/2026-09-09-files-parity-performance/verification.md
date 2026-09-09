# September 9 controller verification

**Status:** fresh local execution reproduced; task reviews approved, final integrated review pending.
**Increment:** `03825f1` onward on `codex/mvp-c0-coherence`, not the older
branch history or the preserved unfinished Binding/read-library changes.

## Execution evidence

The controller independently ran the following against journal implementation
`c96c4ea`. No export flags were enabled and no source files changed during the
runs:

```sh
EFS_FILES_PERF_EVIDENCE=0 EFS_FILES_PERF_OPTIMIZED=0 EFS_UPGRADE_EVIDENCE=0 \
node --test --test-concurrency=1 \
  Reviews/2026-09-05-c0-core/test/*.test.mjs \
  Reviews/2026-09-08-upgradeable-foundation/test/*.test.mjs \
  Reviews/2026-09-09-files-parity-performance/*.test.mjs

node --test Reviews/2026-09-05-mvp-build-start/type-inputs/*.test.mjs
```

**143/143 + 17/17 = 160 passing Node checks**, zero failures/skips; the first
run took 48.47 seconds. The two test selections are disjoint. They include
actual linked-contract reads/writes, retry/resource sweeps, malformed data,
independent Type inputs, authored tags, managed upgrades and both lifecycle
runs. The worker independently reports the same 160 checks in one run.

The controller then ran `forge test --offline --use <the existing runner's
Solidity 0.8.30 binary>` in each Solidity experiment:

- `Reviews/2026-09-05-c0-core`: **169/169 pass**, 14 suites.
- `Reviews/2026-09-08-upgradeable-foundation`: **14/14 pass**, 2 suites.

Both final Forge runs reported no source changes and skipped compilation.
The seven new journal tests include 128 full-tuple fuzz runs, collision chains,
storage fallback, zero-fresh allocation, every capacity from 0–64 fresh leaves,
sequential prestate/replay and exact full-table refusal. Aggregate Forge test
gas is not transaction gas; the capacity harness deliberately runs many
allocations and its aggregate cost is not an admission receipt.

The final fresh lifecycle run measured U1 creation **8,683,464**, rename
**5,009,592** and move **4,985,819 gas**. These differ slightly from the saved
comparison because signatures/calldata vary. The comparison's 1% regression
threshold is well above that noise. All 50 actual transactions and 40 verified
checkpoints retain normal limits, and each rejected stale rename leaves the
complete retained inventory unchanged.

The separate [v1 reference run](v1-baseline.md) passed 259 selected tests with
v1 source unchanged. It is not a whole-v1-suite or matched v1/v2 gas claim.

## Review record and bounded refinement

Task 1 (`aa052ef..f130ef0`) received one Important finding: incomplete resource
and provenance fields could be exported. Fix `41276dc` adds mandatory fields
and mutation tests; scoped re-review approved it. The controller reproduced
74 covering Node checks at that checkpoint. The pre-optimization baseline
was regenerated once to pin the changed report code, then frozen. The earlier
baseline remains in Git history.

Task 2 (`41276dc..c96c4ea`) received separate code/spec approval with no
Critical/Important findings. The 43-byte runtime margin is retained as an
integration constraint requiring remeasurement on future changes. The
controller allowed one bounded same-architecture size refinement after the
first candidate exceeded the runtime cap. It did not authorize another
dependency, storage redesign, relaxed validation or a larger cap. The cost
of this choice was extra experiment time; the same acceptance bar remained.

No independent approval of the whole historical branch, dirty Binding work,
production security, portable authorship, real-wallet behavior or complete
Files/browser parity follows from these tests.

## Reproduction caveats and remaining work

- Use complete matching AST/build-info as explained in [comparison.md](comparison.md).
  Incremental build evidence mismatches failed before admission; none counted
  as semantic passes and no runner checks were weakened.
- The linked-worktree hook installer assumes `.git` is a directory and fails
  here. No hook or Git configuration was changed. Exact-path staging, physical
  commit trailers, whitespace, tri-sync and generated decision checks are used.
- Runtime margin is only 43 bytes. Worst-case collision costs and large fresh
  batches remain limits; this is not a worst-case constant-time guarantee.
- Full retained-state reconstruction remains 1,337 RPC calls, not the browser
  listing path. The next checkpoint is bounded reads plus actual Lens/Files
  checks through the shared SDK into the static SPA, with remove/restore and
  real-wallet acceptance still explicit.
