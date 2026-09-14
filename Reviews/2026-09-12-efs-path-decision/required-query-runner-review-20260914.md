# Required-query runner: source and replay readiness

September14 · disposable experiment; **source-tested, not a chain result**

The shared runner is published on the preserved B successor at
`7b0471342a99d69c1d423e7e64822ccc0b309f23`, above the reviewed raw-state oracle
`7bd787bbf506981cfa164c7a3874ef80ac8717d6`. C remains
`3f5702f1d7acc39c1d62a5b1a0795f3fe579ebce`. No Solidity, frozen inputs,
normal-price tables, original Claude worktrees or production repositories changed.

The [[required-query-paid-plan-20260914|two-task implementation]] now supplies
one finite signed transport and a raw-transcript replay, alongside the literal
state oracle. Root independently ran the complete22 focused Node tests with
the input-pinned Node26.0.0 executable:22passed,0failed,0skipped,17.77seconds.
An earlier root run used the login shell's Node24.11.0 and also passed; it is
not evidence of the pinned runtime. No old compiler or chain suite was repeated.

Independent task review found one actual fault: an unchecked short filesystem
write could advance the transaction schedule without retaining complete raw
evidence. The production journal now refuses a short UTF-8 byte write before
fsync/retention, never retries a partial entry, and prevents another send. Injected
I/O reproduced the failure before the fix; both added cases and the full suite
pass. Scoped re-review marks it addressed, with no remaining task finding.

## What the run will establish

- Exactly82 pre-signed transactions,25 paid pages and21 full-runtime deployment
  checks across three fresh graphs: B scan, B selective, and C.
- 4510 requests if receipts are immediate;5412 maximum with12 polls each.
  The4100 initialization/state/admission probes are **audit overhead**, not the
  browser's query workload. Paid-page gas and returned bytes stay separate.
- Complete literal state/Page comparisons and parent-joined receipts, rather
  than a candidate PASS flag. Missing, changed or extra observations fail.
- Exact BigInt gas/wei partitions for deployments, setup, C Type publication,
  common writes and every old/current page. Physical internal calls remain
  unmeasured; no trace is claimed.

Root inspected the actual173-path runtime inventory (three production scripts,
real Node binary, ethers and loaded dependencies). Its equality is enforced by
the separate root sealer. The offline input remains `launchReady=false`; source
readiness does not grant a chain permit.

## Remaining boundary

Fresh whole-plan review of all six source/test files, both operational scripts
and the complete runtime inventory passed with no blockers or parked findings.
The root seal covers286 files; its runtime map must equal the reviewed173-path
inventory. An exact time-limited loopback permit, one bounded execution
and independent raw-output inspection remain separate gates. Successful local RPC
observations would not constitute authenticated source-state proofs, full Files
integration, native-contract portability, universal query coverage or a permanent
architecture selection. The existing [[provisional-recommendation]] remains
conditional; the original cost snapshot stays unchanged.

Retained local evidence: the B successor's plan-owned SDD directory contains the
task reports,22-test Node26 log, initial review and P2 closeout. Root launch scratch
is `efs-required-query-paid-20260914.wdaBsu` under the system temporary directory.
