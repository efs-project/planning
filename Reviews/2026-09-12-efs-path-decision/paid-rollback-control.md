# Matched paid-slice rollback control

**Standing:** coordinator-selected disposable control supplement, September 13,
2026. Independently source-reviewed; not implemented or executed as a matched
pair. It supplements the seven-row [[paid-neutral-expectations]] without
changing that file's seal, any old report, or a permanent EFS requirement.

The existing rows are not equivalents: B's failure cell rejects an additional
policy and a standalone Quote's index callback; C's measured cell rejects an
exact retry, with mandatory-index rollback tested only in Forge. Keep those
results, but do not relabel them as the controls below.

## One shared logical pre-state

Start from the normal Items/Pair prefix. Both Items and their checked Pair
exist. No A1 Quote, stable File, HEAD, folder placement, or market tag exists.
Use each arm's real counters, source/configuration and physical encoding; do
not force B and C to have equal admission ordinals or bytes. Seal raw pre-state,
author nonce, mandatory rules, required index and coverage before each attempt.

The intended operation is the complete, correctly signed A1 batch: create the
stable File, admit its Quote, set HEAD, place it once at `/swaps/eth-usdc`, and
apply `market` to the stable File. A2 and B1 are unnecessary for this control.

## Two refusal rows and a positive calibration

| Row | Input or fault | Required observation |
| --- | --- | --- |
| Mandatory acceptance | Change only the Quote's scale from 6 to 7; recompute its exact record identity, dependent targets and signature. Keep mantissa, time, note and Pair/Items unchanged. | The exact mandatory Quote rule refuses. B expects `E_REJECTED(1, quoteType)`, not the additional-policy error; C's current rule bubbles `Error("quote: scale must be 6")`. Pin actual ABI error bytes before the run. |
| Required index | Submit otherwise-valid A1 with scale 6; a narrowly reviewed fault fixture refuses maintenance of the final market-tag effect, after earlier Core and index effects were attempted. | Required-index failure, with its exact known cause; neither OOG nor an unrelated authorization failure is a substitute. |
| Calibration | Same otherwise-valid A1 without the injected index refusal. | Successful intended effects and required query maintenance. Report this control deployment separately from normal paid-slice product-cost rows. |

C already has an immutable `poisonConcept` in its Index fixture. A separate
control deployment using `keccak256("market")` can reach the late tag failure;
the ordinary measured deployment's zero poison cannot. B needs a test-only
selectively late-refusing index that performs the normal prefix maintenance,
not its current always-refusing module. Reuse normal code where practical;
do not change ledger semantics to introduce a test fault. Return the proposed
small source delta for review before compiling.

Fault configuration changes code identity. In C, Index runtime changes also
change Ledger's immutable index-code commitment; recompute dependent identities
and signatures. Both control arms need their own fresh source/artifact/runtime,
constructor and configuration pins. Instrumentation and its deployment/gas
are not an unavoidable product floor. Normal paid measurements stay on their
ordinary pinned, unpoisoned deployments.

## What rollback must establish

Independently compare fixed-block pre/post raw observations, not just a failed
receipt: the EFS author nonce, admission/publication counters and evidence,
record occurrence counts, heads/revisions/history, folder/tag membership and
required index frontier are unchanged; the attempted File, Quote and new
admissions are absent at that qualified basis. Existing Items/Pair remain
unchanged. Missing coverage must not become an empty COMPLETE result.

Physical block number, transaction-sender nonce and paid gas may change.
Retain the exact static revert bytes, separately mined status-0 receipt and
post-observation block hash. This is **RPC_OBSERVED** rollback evidence, not an
authenticated state proof or independent signature recovery.

## Small implementation handoff

Claude owns one isolated control cell per candidate: two signed-A1 variants,
fault-fixture selection, positive calibration and retained raw pre/post reads.
Root supplies/reviews the separate physical control inputs before execution.
No paid cost comparison, full finalist gate or production claim is authorized
by this specification alone. Do not expand it into the rest of the finalist
journey or retrofit completed diagnostic packets.

Source review: B `7c292e0`, C `9a4e766`; Quote rules, Index mutation order,
existing failure rows and the shared SDK paid appendix were inspected. The
exact run-local control manifests and the B fault fixture remain next work.
