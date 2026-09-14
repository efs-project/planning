# One actual Files paid workflow

September14 disposable experiment under James's overnight mandate. Preparation
deadline 12:30 UTC, independent review before 13:00, shutdown/handoff by 14:00.
No production change, architecture selection, fee quote or affordability ruling.

## Why this next

The checked Files profile and unrelated qualified consumer now exist. Quote
receipts cannot price same-File parent validation and selected-revision tag
joins. One fresh B-only run answers that missing question. Do not repeat C,
archive, Quote or completed query measurements.

## Frozen design

Use the existing reviewed Root/Child rules, FilesParentIndex, Ledger, Registry,
Lens and FilesJoinedConsumer. Do not edit them. Deploy a genuine native Bob
Actor and a storage-free paid wrapper which calls the consumer and emits the
hash of its actual full result. It accepts no expected answer hash. Exact
query key commits method, arguments and current basis. No cached/mocked paid
responses. Six separately submitted reads avoid shared warm-storage discounts.

Keep setup separate and itemized; avoid unrelated LabBase deployments. Attach
the Files index before admission1. One stable File F and one hashed folder/name
coordinate, with R0(F,10:00), RA(R0,F,11:00), RB(R0,F,09:00). Alice signs actual
intents; Bob is an actual deployed contract, not an impersonated EOA. This does
not prove cold filename recovery or portable historical native authorship.

| Row | Exact logical boundary |
| --- | --- |
| W1 | Signed CREATE F + PUBLISH R0 + HEAD(F)=R0 + folder placement, no tags |
| W2 | Separate signed project_efs tag on F |
| W3 | Separate signed draft tag on R0 |
| W4 | Signed PUBLISH RA + Alice HEAD CAS expected1 |
| W5 | Outer transaction to Bob Actor: native PUBLISH RB + Bob HEAD expected0 |
| W6 | Separate signed approved tag on RA |
| P-A/P-B | Paid point F/approved under [Alice,Bob] and [Bob,Alice] |
| F-A/F-B | Paid folder/project_efs with explicit File tag scope, both Lenses |
| R-A/R-B | Paid folder/approved with selected-revision scope, both Lenses |

Freeze scan budget for this exact one-placement fixture before execution. Empty
R-B must be COMPLETE and exhausted. All six reads share the sealed post-W6 graph
basis, no intervening graph writes. Charge entire outer transaction and wrapper
event, never subtract required index maintenance or forwarding. Reads are
alternative operations, not a compulsory six-read bill.

## Implementation and verification

1. Source-only worker creates `test/FilesPaidRead.sol`, a focused test and
   `script/measure-files.mjs` in existing lab-b, with a report. Root observes a
   meaningful compiling RED for actual result/hash emission before the wrapper
   implementation, then GREEN. No worker Forge, Anvil, RPC, install or git.
2. Independently prepare a raw-state/event checker from current source and
   frozen actions, not measurement outputs. It must derive exact IDs, retained
   bytes, heads, subjects, tag tiers, parent sets, coverage, and all full result
   structs/cursors. Pin source/complete compiler artifacts and immutable-patched
   deployed runtimes. Check signed transaction/receipt/header/log joins and the
   six actual event payloads; a candidate-generated answer is not an oracle.
3. Root runs normal size/build tests under the existing single-heavy-slot,
   source-snapshot, private-cache and finite lease discipline. Review new runner
   and checker before one fresh private Anvil run; fixed node/block/toolchain
   limits, 50GiB reserve, 15GiB aggregate scratch, absolute 14:00 cutoff.
4. Retain raw transactions/receipts/headers/logs, constructor inputs/runtime,
   independent raw state, compiler input/output and findings. Itemize deployments,
   configuration, writes, reads and calldata byte counts. Missing/failed rows
   stay UNMEASURED/FAILED. One run only, no restart to improve prices.

The independent scope proposal also requested exhaustive storage diffs. Root
narrows this pass to receipt economics: complete storage capture is optional
only if existing bounded tracing supports it safely. Otherwise label persistent
slot growth UNKNOWN and make no state-bloat or repricing claim. This does not
invalidate directly measured transaction gas and avoids turning one missing
measurement into a new tracing framework. Never estimate slots from record or
ABI byte counts. Wrapper storage-freedom is checked structurally and in tests.

Stop preparation if minimal independent expected results or safe bounded
execution cannot be ready by the deadline. Report the limitation rather than
substitute another generic benchmark. No full Files UX, scale, history paging,
protocol freeze, dollar affordability or total lifetime-overhead claim follows.
