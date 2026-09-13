# B compact EFS — first independently gated paid slice

**Date:** 2026-09-13, 14:26 UTC. **Standing:** disposable, local
`RPC_OBSERVED` measurements; not a state proof, a matched full-Files price,
an architecture selection or a protocol adoption.

## What changed

We now have an actual paid contract-to-contract run, not just a runner that
tests itself. Independently prepared inputs and exact deployment expectations
were pinned before genesis. An external read-only controller checked the
deployed contracts and state before fixture writes, then checked the populated
graph before any paid read. Both stages acknowledged; the candidate runner
used the acknowledged inputs in its actual transaction calldata.

The small graph contains two Items, their Pair and three competing Quote
revisions. Author A signs a File create with one folder placement and one tag,
then edits its head. A genuine producer contract B publishes a competing head
without creating a second folder placement. An unrelated account then pays a
stateless Solidity consumer to read the graph through both author orderings.
The consumer reports A2 under A-first and B1 under B-first; the folder placement
remains A's in either case. These output interpretations are still candidate
self-checks, not an independent semantic oracle verdict.

## Measured transaction gas

| Operation | Gas |
| --- | ---: |
| Shared fixture setup: publish two Items and their Pair | 921,085 |
| A1: signed File create + fresh Quote + head + one placement + tag | 1,614,433 |
| A2: signed fresh Quote + update A's head, preserving A1 | 658,913 |
| B1: contract-originated fresh Quote + competing B head | 796,542 |
| Paid point read, A-first | 153,636 |
| Paid one-entry folder listing and selected graph read, A-first | 246,606 |
| Paid point read, B-first | 153,884 |
| Paid one-entry folder listing and selected graph read, B-first | 254,283 |

All rows succeeded. Each paid read was the first and only transaction after
restoring the same post-B1 snapshot, at the same block timestamp. Prices include
transaction and measurement-consumer overhead; the consumer logs its result
but does not store it. A one-entry query is not a large-directory benchmark.
The point operation is a joined typed/reference/provenance read, not a bare
storage getter. These are not current mainnet or L2 dollar quotes.

The 26 deployment/attachment/Type/policy setup transactions total **16,486,632
gas**, separately from the eight rows above. That lab setup includes unused
diagnostic actors/consumers and fault-injection contracts; it is not the minimum
production deployment bill. The selected consumer runtime is 13,852 bytes;
Ledger is 17,280 bytes. No code-size or block-limit override was used.

This is useful evidence that a smaller joined EFS path can run within normal
limits. It is still expensive for frequent writes. It does **not** establish a
percentage saving over fuller v2, whose File representation and remaining
guarantees differ, or a winner over MUD, whose matched run is not ready yet.

## What was checked, and what was not

- Two independent controller ACKs: 18 initial and 79 populated-state checks,
  plus all 17 full deployed runtimes at each stage. The populated checks are
  76 full-return comparisons and three partial publication-word checks.
- Source, compiler/artifact, full constructor initcode, runtime, input and
  checkpoint pins agree. Independently retained ACKs match runner copies.
- Root independently checked all 34 raw transactions against receipt gas,
  signed transaction hashes, recovered transaction senders and retained calldata.
  The paid reads share the accepted parent block and sole-transaction ordering.
- A separate source/packet reviewer verified the two gate boundaries, actual
  paid calldata, runtime/initcode pins and raw log/replay consistency. The external
  controller itself does not independently interpret paid output semantics.
- Missing: matched mandatory-rule/index rollback controls and positive
  calibration; marginal placement control; independent recovery of A's embedded
  publication signature; unasserted publication fields and bootstrap
  publication-1 author evidence; portable contract-origin
  proof/import; authenticated state proofs; scale/churn; complete Files/browser
  workflow and finalist qualification. None is waived.

## Reproduction and retention

Candidate source: `4b6154695c89976a7325cd0c51dc9591dee387c1` on
`codex/efs-warroom-b-run`. It incorporates B's `7c292e0` source, reviewed runner
hooks and one report-wording correction. Claude's B/C checkouts were untouched.
Oracle source: `600b1e8ab97e9cffac086e3f3199c45869c86071` on
`codex/efs-warroom-oracle`. Both are prototype branches, not planning adoption.

Evidence-only commit `ac37e91` on the candidate branch retains the generated packet at
`Reviews/2026-09-12-efs-path-decision/lab-b/evidence/paid-20260913T142621Z/`:
raw `measure.json`, pinned arm, launch log, seven runner gate files, two separate
controller observation files, receipt-check summary and byte-for-byte SHA256
inventory. The source pin predates this evidence-only addition. The older
06:11 diagnostic report remains unchanged.
The raw launch log intentionally retains its original trailing spaces; the
whitespace check excludes only that log to preserve the evidence hash.

Arm SHA256: `05cace851314a817e12c70af943fe45f86d6eaf1beec31a191a8309886b35e7b`.
Neutral expectations SHA256:
`ff7c4fc735504c9871e8241c7cc461293b7ffc37f3d5e9dd50840e005cc37795`.
Run ID: `b-paid-20260913-Kf4SOz`.

Solc 0.8.30, via-IR, optimizer 200, Cancun; independently reproduced artifacts
from unchanged Solidity at `2859147`. The source integration passed **41/41
Node tests**; its unchanged Solidity previously passed **52/52 Forge tests** in
that retained fresh build. This run did not compile again. Anvil ran for about
two seconds with a 30M block limit, prune-history 256 and a run-owned cache;
PID 37752 was stopped and the heavy slot released. Run scratch was 3 MB.

Next: one bounded C readiness/repair attempt, then the same paid slice when its
independent input mapping is ready; keep the separately specified rollback
and wider finalist gates visible. No further generic gate expansion unless an
observed defect would invalidate the comparison.
