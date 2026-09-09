# Bulk file creation: a real transaction-size limit

**Status:** measured local diagnostic on the unchanged optimized upgrade
fixture. One fresh seven-leaf file metadata publication fits; two and three
fresh files in one publication do not fit the 16,777,216 gas ceiling. Failed
batches leave no partial admitted file state. This is useful design pressure,
not a full FilesRouter, upload or wallet test.

## Experiment

The [reproducible probe](bulk-create-probe.mjs) deploys the normal source-pinned
upgrade fixture, admits its four existing Type groups and root, then tests
1/2/3 files from the same prestate using separate EVM snapshots. Each fresh file
has an Object, publisher charter, ChunkTree, FileRevision, revision-head
Binding, DirectoryEntry and name Binding. File identities, names and declared
content commitments are distinct. There is no replay/reused-Record shortcut.
**Byte staging is excluded**; these failures occur for metadata alone.

| Fresh files | Leaves | Calldata bytes | Receipt gas | Outcome | Independent new leaves |
| --- | ---: | ---: | ---: | --- | ---: |
| 1 | 7 | 3,140 | 8,665,111 | committed | 7 |
| 2 | 14 | 5,540 | 16,261,750 | reverted | 0 |
| 3 | 21 | 7,940 | 16,262,652 | reverted | 0 |

The two-file case then submits the **same exact file leaves** in two independent
transactions: 8,666,023 and 8,220,147 gas, both committed and independently
reconstructed. The control distinguishes a resource problem from invalid
schema/reference/CAS composition. It does **not** make the two transactions
atomic as a pair.

The full call trace places both failures in the admission-library delegatecall,
selector `0xb565fb09`, which consumes all forwarded gas. Anvil labels the
two-file failure `out of gas: not enough gas for reentrancy sentry` and the
three-file failure `out of gas: out of memory`. These describe EVM execution
failure, not a new EFS reentrancy bug or exhausted laptop RAM. Outer frames
revert with no payload; receipt gas need not equal the top-level limit when a
delegatecall exhausts its forwarded allotment. No limit was raised to find a
successful total, so the exact gas needed by the failed batches is unknown.

Each attempted operation is followed by the unchanged independent
`readUpgradeState`. Success requires all expected new exact Records; failure
requires zero new Records and byte-equivalent retained inventories except
observation pins. All readbacks returned VERIFIED. A preliminary run and the
repeated traced run found the same outcome; tiny single-file gas differences
come from calldata/signature variation. This is not a percentile benchmark.

## Consequence for the MVP

Bulk import needs an explicit **job** above atomic operations. The SDK should
preflight a bounded packing strategy and show per-file committed/pending/failed
progress, resumability and cancel-unsent behavior. Never silently split an
operation promised atomic, such as one rename's source mask plus destination
placement. A 64-leaf format ceiling is not a promise that every 64-leaf request
can execute.

One user approval and one transaction are separate promises. The existing
single-publication authorization does not by itself prove that a relay can
submit an arbitrary multi-transaction upload under one approval. The actual
grant/intent mechanism must bind each authorized action or a bounded job,
with expiry, replay limits and exact scope. A delegated session may offer
zero routine prompts after setup; this diagnostic contains no session or
real-wallet evidence. Do not create a new batch-authorization protocol merely
to make this graph look finished.

Next: measure two-file packing after the real router/authorization join and
prototype resumable multi-file progress through the SDK's existing intents.
Further write-cost optimization remains valuable, but correctly chunked
non-atomic imports are necessary even if the next optimization fits two files.
There is no immediate owner ruling required for that reversible prototype.

### SDK owner review: the smallest resumable job

The EFS v2 SDK PM reviewed this evidence on September 9. Its recommendation
keeps the job local and exportable, above the existing Actions/read-back
families; it is not a Core object, publication or new signed message. The
manifest retains exact user intents. Each attempt separately retains its
execution/source pins, prepared plan, authority, submission identifiers and
read-back evidence, because remaining intents may need replanning.

Project item states as pending, cancelled-unsent, submission-ambiguous,
committed or failed. A submission call that may have reached the node is
ambiguous until exact recovery resolves it: never automatically resend it or
turn missing read-back into failure. This metadata-only probe can establish
only raw-Core metadata commitment, not uploaded/certified file completion.
Permit at most one unresolved submission per chain/Core/Principal/nonce lane;
planning and reads may be parallel. Resume reconciles old attempts first,
then repins and replans unsent intents. A changed exact plan needs new
authorization. Cancellation before submit means zero submitter calls, not
revocation of an already exported signature; cancellation afterward promises
no rollback.

The already designed [bounded same-Principal session](../../Designs/efsv2/disposable-mvp-profile.md)
is the candidate multi-action consent seam. It still authorizes separate exact
plans and transactions within scope, expiry, nonce and budget limits. Neither
this diagnostic nor the advisory proves its implementation or setup-prompt
count. Existing relayed EOA C0 authorizes one exact publication per signature.

Next orchestration experiment: commit file A; forward B but drop its submit
response; persist/restart and reconcile B without resubmission; cancel C before
submit and prove zero calls. Also drop B before forwarding, withhold a required
recovery read, and upgrade between A and the still-unsent B. Preserve A's
historical result, require a new B plan, and never claim atomic job success.
This tests the [existing interface families](../../Designs/sdkv2/mvp-interface.md)
and [ambiguity rules](../2026-09-05-c0-core/authority-order-and-evidence.md), not
bytes, Router certification, sessions or real wallet UX. Rename/move remains
one unsplittable item.

## Reproduction and provenance

Run from the planning worktree:

```sh
node Reviews/2026-09-09-files-parity-performance/bulk-create-probe.mjs
```

The script writes JSON to stdout only and closes its managed loopback node in
the existing runner's `finally`. It installs no dependencies, writes no source
or historical fixture, and touches no external network or account. The normal
runner verifies compiler inputs/current source hashes and full deployed code.
Its output is saved separately in [the diagnostic report](bulk-create-evidence-20260909.json).
That report is an observation record, not an embedded full-state snapshot.

Observed branch HEAD was `219bf614c0ad426075e100fcc9fce8b44972ba39` with the new
probe and concurrent Lens work uncommitted. The actual compiled upgrade
source set is explicitly pinned in the report; it does not include the new
Lens code. StateKernel hash remains
`09964761aa0fed1f2ba5ca673b2d6ffad41c8e92cc4bb513783e539415dc215a`.
Probe source hash is
`74be3b7d38427b0fab03edcace0721959bae1cb1e0fe9f267b7d2f3fb9b6f09b`.
Solidity 0.8.30/Cancun/optimizer 200/viaIR, normal runtime/initcode/transaction
caps, exact dependency lock and source/tool pins are retained. Existing
baseline/optimized/upgrade evidence files remain unchanged.
