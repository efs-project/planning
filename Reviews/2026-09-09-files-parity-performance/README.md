# Files lifecycle and performance checkpoint

**Status:** disposable local experiment; lifecycle and performance task reviews approved, integrated review pending.
**Scope:** continue the real v2 Store prototype toward v1 capabilities. No
product repository, public deployment, main merge or permanent protocol choice.

## What the prototype now does

It creates actual typed directories and a file, stores small content bytes,
edits the file, renames it, moves it and retains its history. It exercises
two authors tagging the same file, one author removing their tag without
removing the other's, and a fresh re-tag. All of this runs before and after
an upgrade of the populated Core/carrier pair.

The file keeps its identity when renamed or moved. A stale rename deliberately
tries a destination write before its source check fails: the whole transaction
rolls back, and independent reconstruction confirms no partial destination
survives. A name-claim retraction is tested separately from a rename mask.

This is **real local contract state**, not a parallel JavaScript filesystem.
It is still a raw Core lifecycle, not a complete Files router or browser:
Files-specific authority, Lens selection, removal markers/Trash, complete
listing and real-wallet UX are separate joins.

## Evidence and reproduction

- [Workflow](workflow.mjs) and [independent assertions](workflow.test.mjs):
  50 receipt-backed transactions, 40 independently verified checkpoints,
  and fresh-object scaling at 1, 2, 4 and 8 leaves.
- [Baseline](baseline.json): exact source/compiler/input/resource pins and
  complete terminal retained state. The report exporter rejects missing
  provenance, size evidence and read-measurement status. It is capped at 2 MiB.
- [Admission profile](admission-profile.md): call-frame diagnostic explaining
  why an unchanged-semantics journal optimization is worth testing.
- [Matched performance comparison](comparison.md): frozen baseline versus
  separately retained optimized evidence, including costs and regressions.
- [V1 baseline](v1-baseline.md): 259 freshly passing selected v1 tests,
  method-level gas and comparison limits. No v1 source was changed.
- [Feature parity inventory](parity.md): all observed v1 capabilities stay
  visible, including chunks, mirrors, collections, redirects and sorting.
- [Verification record](verification.md): controller-reproduced tests, review
  findings, the bounded refinement and explicit remaining integration work.

From this planning worktree, use the installed Node/Foundry/compiler
dependencies already required by the September 8 managed runner:

```sh
node --test --test-concurrency=1 \
  Reviews/2026-09-09-files-parity-performance/workflow.test.mjs \
  Reviews/2026-09-08-upgradeable-foundation/test/upgrade-chain.test.mjs \
  Reviews/2026-09-08-upgradeable-foundation/test/tag-current.test.mjs \
  Reviews/2026-09-08-upgradeable-foundation/test/validation-frontier.test.mjs
```

Tests use a managed loopback EVM and shut it down. Do not set
`EFS_FILES_PERF_EVIDENCE=1` when testing a changed kernel: that flag overwrites
the control baseline. Source variants require separately named evidence.

**Build-cache prerequisite:** the existing source-evidence runners need
complete matching AST/build-info, not only bytecode. If earlier incremental
Forge runs left partial or conflicting build-info, rebuild both the Core and
upgrade experiment with `forge build --ast --build-info --force --offline
--use <the recorded Solidity 0.8.30 compiler>` in each experiment directory.
Stale conflicting generated output may first require `forge clean` in that
specific experiment directory. Do not erase source or evidence files. The
runners refuse mismatched artifacts rather than treating them as a test pass.

## What these measurements do not say

The baseline's roughly 14-million-gas file creation is a seven-leaf metadata
publication; content staging is separate. The memory-only journal candidate
reduces this to about 8.68 million gas (about 39% less), with the same
non-timing lifecycle outcomes reproduced by the controller and a separate
task review approved. The raw operation fits the normal 16,777,216 transaction cap,
but a future Files router must also fit. A passing gas cap is not a claim
that the operation is cheap enough for users.

The tradeoff is code-size headroom: the candidate admission library is
24,533 bytes, only 43 below the cap. This is not space for Files-specific
features. The first high-level candidate exceeded the cap; one bounded
same-architecture refinement fit without changing storage or deployment limits.

Terminal verification reconstructs the full retained inventory in about 1,300
RPC calls. It is deliberately a diagnostic reader, **not a folder listing**.
A browser must consume bounded, scoped reads rather than rebuild the whole
database on each action. Serialized JSON-result bytes are not wire bytes or
remote-provider latency.

These results do not establish a v1/v2 cost multiplier. V1's mixed EAS method
statistics and v2's complete metadata publication do not perform identical work.
Wallet approvals are also a different metric from transaction count or gas.

## Next useful join

Continue [the existing one-screen consumer checkpoint](../2026-09-08-upgradeable-foundation/consumer-checkpoint.md)
over this same Store: bounded directory reads, actual contract Lens/Files
checks, and the SDK Reader/Actions split feeding a static SPA. Then exercise
remove/restore, stale edits and upgrade recovery through that interface.
The owner's [Files walkthrough](../../Designs/efsv2/testnet-files-mvp-plan.md)
remains the visible acceptance test. Passing this experiment alone is not
full v1 parity or a finished MVP.
