# Occurrence and original-receipt checkpoint

**Status:** implementation at `08c2a16` independently tested and task-reviewed;
final whole-increment review approved `c23dff0..50268e3`. Disposable local
component, not initialized or
authenticated full C0, a browser pass, or real-wallet evidence.

The [design](occurrence-receipt-design.md) and
[one-task plan](occurrence-receipt-plan.md) use existing retained state.
The implementation adds the three exact getters in `StatePointReads`, one
normal forwarding host and separate synthetic refusal setup. It changes no
store, admission path, identity, authority program or portable encoding.

## Fresh controller validation

At immutable `08c2a16442732fc0fa6395a1d97c805902b6cae1`, 2026-09-06:

- Forced build: 34 files, solc `0.8.30+commit.73712a01`, successful in 32.08s.
- Full Core Forge suite: **160 passed, 0 failed**, 12 suites; includes nine
  new occurrence/receipt tests and twenty existing point-read tests.
- Expanded Node suite: **93 passed, 0 failed**, 16.04s, including actual
  normal deployment, all-field receipt/occurrence comparisons against the
  independent source reader, historical replay, parser and Type-input tests.
- Owned Solidity formatting and Git whitespace checks passed. Compiler SHA256
  remains `738dcdc6afddeb505ee4e4ef24f1c1fdba2b8c924e614cbbf5801a5b062dd683`.

Run from this directory, with the existing cached compiler assigned to the
task-specific `C0_SOLC` variable:

```sh
forge build --force --ast --build-info --offline --use "$C0_SOLC"
forge test --offline --use "$C0_SOLC"
node --test test/*.test.mjs ../2026-09-05-c0-admission/integration.test.mjs ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs
forge fmt --check src/StatePointReads.sol test/OccurrenceReadHarness.sol test/OccurrenceReads.t.sol
```

Node26, Forge/Anvil1.7.1, Cancun, optimizer200 and viaIR remain selected.
Build output is not warning-free: existing mutability/cast/rounding lint
warnings occur in unchanged request/kernel/body/index/Binding/test files.
Controller enumerated the warning locations; none is in the owned changed
Solidity paths. Do not suppress or relabel them as pristine output.
Full controller logs remain in the ignored per-plan workspace; tests and this
source-pinned checkpoint are the tracked reproduction route.

Task review approved spec compliance and quality with no Critical/Important
findings. Its unverified cross-file deployment/transport/resource requirements
were resolved by the controller's fresh runs and inspection of the unchanged
`scripts/local-stateful.mjs`: fixed loopback URL, bounded transaction sender,
normal linked deployment/runtime matching, and managed cleanup. The review's
minor request for exact warning diagnostics is satisfied by the retained full
`root-build.log`, not a second suite run or warning suppression.

The independent final review read the complete three-commit increment through
`50268e3`, including the occurrence specification/code/tests, outer Codex
inventory and SDK/static handoff. It found no Critical, Important or new Minor
issues and approved feature-branch checkpoint publication. No final fix wave
or new design ruling was required. Subsequent closure edits only record that
verdict; no tested source changed. The worktree and ignored diagnostic evidence
are retained for the continuous MVP goal, not removed at this component gate.

## What these checks establish

Actual admissions cover fresh and sparse leaf63 selection, separately selected
leaves of one Envelope, the same Record in different Envelopes, all-reused and
mixed retries, and withdrawal. The accepting batch belongs to the original
admission: later requests and current withdrawal cannot rewrite its basis,
codehash, block or accepted status. Current lifecycle remains separately visible.

The Node test fixes an EIP-1898 block hash before each coherent comparison.
It substitutes the normally deployed host/interface/runtime expectations while
retaining independent helper/library verification, then reconstructs state
through the existing source reader. It compares every field for five accepted
pre-withdrawal and six post-withdrawal ordinals. Returned receipt evidence is
not accepted merely because it matches a producer-supplied context object.
The trusted host still does not prove that context was authenticated.

Separate synthetic refusal fixtures check exact error selectors and subjects
for invalid callers, malformed counters/joins/lifecycles and batch partitions.
The actual intrinsic meta-Type alone may have admission ordinal zero. A large
synthetic `B=H=2^40` inventory seeds the bounded search path/endpoints, not a
trillion accepted transactions. Its last-ordinal search uses 42 actual batch
probes including required neighbors/endpoints, within64. The algorithm checks
the path/local partition; it does not claim a global audit of unvisited rows.

Hydration cost stays equal for otherwise-identical short versus 8,192-byte
Record bodies and 131,072-byte Type caches. It reads selected fixed metadata
and one Envelope membership word rather than copying/revalidating whole data.
The existing full Envelope getter remains separately regression-tested.

## Measured normal deployment and reads

| Artifact | Runtime bytes | Initcode bytes | Deployment gas |
|---|---:|---:|---:|
| Occurrence test host | 18,664 | 24,288 | 4,942,627 |
| PreparationHelper | 18,805 | 18,831 | 4,120,023 |
| AdmissionLibrary | 24,179 | 24,211 | 5,281,973 |

Representative pair lookup:89,522 gas; receipt:135,226 gas. Pair/ordinal/receipt
returndata are exactly192/224/384 bytes. The separately rebuilt original point
host is now13,180 runtime/18,804 initcode/3,756,212 deployment gas after shared
metadata extraction; older point measurements are historical, not current.

All normally deployed components remain below24,576 runtime,49,152 initcode
and16,777,216 transaction gas. Forge test-function gas includes multi-deployment
setup/corruption loops and is not a claim that those whole fixtures fit one
production transaction. The Node deployments/calls provide the normal-cap
evidence. Managed test chains exited cleanly; no public RPC or personal wallet.

## Retrospective and followups

The implementer reported behavioral RED after compiling refusal stubs and
performing a real admission; controller did not independently rerun that
historical RED. A later negative test caught a non-meta Type borrowing the
intrinsic admission-zero exception; the implementation now checks the actual
meta identity and ordinal dictionary. This repaired a missing guard without
changing the selected design or granting a new exception.

One shared Envelope metadata path and one occurrence hydration path are simpler
than separate per-getter joins or a second receipt store. Preserve them for
historical page hydration, with an explicit H-aware lifecycle projection;
current-only reads must not silently hydrate older-H pages.

Next: shared bounded pages and Binding/Scope/H reads, then actual
Codex/authority/initialization and Files operations. The
[SDK/static handoff](browser-integration-handoff.md) names the integrated
acceptance trace. Normal host size is not final Core headroom: it still
contains raw test-oracle ports, while the actual authenticated host adds
different behavior. Measure the joined public surface before choosing a new
contract topology or claiming it fits. No immediate owner decision is needed.
