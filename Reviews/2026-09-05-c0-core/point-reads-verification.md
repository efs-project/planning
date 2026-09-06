# Exact point reads — verification and next integration

**Status:** implemented through `154fcbe`, task and whole-increment reviews
closed after their scoped fixes; independently rerun. Feature-branch evidence
only, not a main merge or integrated-MVP completion.

This executes the [point-read plan](point-reads-plan.md), not the whole
[read overlay](read-overlay.md) or C0 profile. The [implementation](src/StatePointReads.sol)
uses [bounded storage-byte views](src/StorageByteView.sol) and the unchanged
StateStore/kernel/helper. Test mutation ports remain solely in test hosts.

## Evidence on the exact committed implementation

Root independently ran the following from this Core experiment directory
after the worker's final task-review fix commit `a9d3890`:

```text
forge build --force --ast --build-info --offline --use <cached solc0.8.30>
forge test --offline --use <cached solc0.8.30>
node --test test/*.test.mjs ../2026-09-05-c0-admission/integration.test.mjs ../2026-09-05-mvp-build-start/type-inputs/*.test.mjs
forge fmt --check src/StorageByteView.sol src/StatePointReads.sol test/PointReadHarness.sol test/PointReads.t.sol
git diff --check
```

All exit0: 32 compiled Solidity files; **151 Forge tests across11 suites**,
including20 point tests and128 storage-slice fuzz runs; **92 Node tests**, with
no failures/skips/cancellations/todo. Existing compiler/lint warnings remain
in unchanged files; none names one of the five new source/test files.
The actual compiler is `0.8.30+commit.73712a01`, Cancun/optimizer200/viaIR.
Root compared all five working-file SHA-256 values to the worker's final
report and exact five-file commit; no kernel/cache/parser/carrier bytes changed.

After final-review test-only fix `154fcbe`, root repeated the full expanded
Node command: **92/92**, exit0, no failures/skips/cancellations/todo, in15.87s.
Solidity source, Forge tests and deployment host are byte-for-byte unchanged
from the151-test run at `a9d3890`; that is the retained Solidity evidence,
not a claim that an unnecessary second Solidity run occurred.

The independent managed-node test normally deploys the test host, compares
actual runtime with compiler links/immutables, admits all four candidate
groups, then reconstructs the intrinsic plus all16 ordinary Type projections
at one pinned source. It extracts original group bytes from the returned
Record body before deriving group/member IDs. Record and full Envelope IDs
are independently recomputed. A sparse64-member Envelope and an actual
supported withdrawal exercise retained bytes rather than synthetic liveness.

Synthetic tests separately refuse corrupted initialization, group framing,
cache offsets/tails/counts, unknown-row inconsistencies, over-limit bodies,
bad Envelope header/membership, and exact ordinal exhaustion. Those tests are
not evidence that the corrupted states could be admitted. The storage utility
checks subtraction bounds before allocation and covers short/long bytes,
every start alignment, exact-end/zero slices and zero memory padding.

## Fresh measured resources

| Component/read | Runtime bytes | Initcode bytes | Deployment/read gas | Returndata bytes |
|---|---:|---:|---:|---:|
| Preparation helper | 18,805 | 18,831 | 4,120,023 | — |
| Admission library | 24,179 | 24,211 | 5,281,973 | — |
| Point-read test host | 12,997 | 18,621 | 3,716,664 | — |
| Selected Type from860-byte group | — | — | 166,810 | 1,056 |
| Selected Type from2,345-byte group | — | — | 143,660 | 608 |
| Representative Record | — | — | — | 2,496 |
| Sparse64-member Envelope | — | — | — | 2,496 |

The two Type measurements select a member from the smallest/largest retained
**group**, not the smallest/largest possible Type or a monotonic-cost claim.
Actual member length/cache shape also matters. These are representative point
reads, not maximum page/contract-consumer gas evidence. Normal24,576 runtime,
49,152 initcode and16,777,216 transaction gas caps remain unchanged. The managed
node stopped normally, exit0/no signal. No public RPC or personal wallet.

## What changed in the design

- Original raw Type/group provenance is now executable read evidence. It is
  not another shape-only decoder or a duplicate stored cache.
- Physical ordinals reject the existing kernel's exhaustion sentinel itself,
  not just wider values. The last admissible value is explicitly tested.
- [Codex materialization](codex-materialization.md) now specifies25 exact domain
  rows, six raw strings with a414-byte frame, the existing85-byte intrinsic
  opening and four independently derived Type-ID rows. The [INDEX sheet](index-materialization.md)
  supplies exact selected framing and retires B0's understated aggregate44
  estimate while retaining precise occurrence-key bounds.
- Optional head-batch/position convenience ABIs are not needed to implement
  the eighteen required capabilities; keep measured consumer demand as the
  reason to reconsider them, rather than adding them by inheritance.

## Retrospective and followups

The independent task review found three explicitly promised negative cases
missing despite their production guards, plus duplicated intrinsic framing
validation. Original-worker fix `a9d3890` adds targeted zero/truncated-member
and known-Record/unknown-Type assertions and shares one private frame validator.
Scoped re-review marks both findings addressed with no new breakage. Root's
fresh covering checks above reproduce the fixed code. Runtime fell162 bytes.
The report now corrects its earlier coverage overstatement. Nonblocking test
organization remains a maintenance followup: split the large combined test
contract if further growth makes fixture/failure navigation difficult.

Whole-increment review of `ca1c15a..f50e9ee` found one further evidence gap:
sparse and post-withdrawal Envelope tests derived IDs from publication inputs,
not the getter's returned bytes. The single final fix `154fcbe` compares all
returned fields and exact unsigned bytes, decodes returned header/membership,
and independently derives the requested ID from those returned values. Its
sparse vector now has64 distinct IDs, exposing order/substitution errors.
Scoped final re-review approved the fix, with no new breakage; the remaining
test-organization note is nonblocking. No production getter defect was found
in that final pass. Lesson: every independent-read claim must trace back to
the returned evidence; hashing a correct fixture proves the fixture instead.

Worker self-review exposed the sentinel and malformed-global-meta cases before
task review; the worker reports dedicated failing tests before their fixes.
That historical RED is implementer-observed, not independently rerun here.
An initial root build overlapped those edits, so it was explicitly discarded as
final evidence.
The authoritative root build/tests above ran after the final commit. Next time,
wait for the immutable commit before starting artifact-producing validation.

Source inventory initially confused the old Probe meta-Type with the existing
Core candidate. Root checked the actual fixture/literal and the advisor corrected
the report. Pinning that existing opening avoids another unnecessary descriptor
design loop. Row/count/link diagnostics and independent Type parsing support the
new written inputs, not an encoded full Codex or executed initialization.

Next: occurrence/receipt/Principal hydration and bounded page/Binding reads,
complete owner-module/Codex materialization and authenticated initialization,
then actual Files/Lens operations through SDK/static SPA. These point getters
have no separate write path and do not authorize the trusted test host for
production use. Full G0–G12, session, all eighteen enabled endpoints, joined
Files mutations and the nine browser journeys remain required.

No immediate owner answer is needed. Later request actual-wallet participation,
product-repository/public-deployment authority and permanent release choices
only at their real gates. No main merge, public deployment, permanent Type/ABI
freeze or full-MVP completion is implied by this checkpoint.
