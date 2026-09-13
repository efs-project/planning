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

## September 13 follow-through: reviewed B seam and execution traps

**Source preparation only, not a run.** With Claude quota-blocked, Codex owns
the follow-through in its already isolated successors, not Claude's original
worktrees. The following narrows the existing control at B source `c5561e2`
(evidence-only HEAD `cbadc00`). It creates no chain lease or replacement cost
result. An independent reviewer checked the actual dispatch/error paths.

- Change only `IndexModule.onAdmission` visibility to `public virtual` so a
  disposable derived fixture can call `super` internally. Preserve the Ledger
  caller check. After normal maintenance/frontier writes, and only for nonempty
  effects, refuse the final bind when its binding key matches an immutable
  poison key. Zero poison disables the fault. No copied index or Ledger fault
  hook; exercise it through the real Ledger ingress.
- The poison key is A's TAG binding on the stable File for `market`, not the
  Quote's content ID. Deploy and attach the module **before** Items/Pair so
  `attachedFrom=1`. Otherwise a late-attached PARTIAL module can make the test
  look like a successful empty directory while missing its required premise.
- Each control deployment needs a fresh valid A intent: B commits the module's
  address/codehash into index obligations. Re-sign for the deployment and for
  the scale-7 body/record/HEAD target. Require the full 68-byte
  `E_REJECTED(1, quoteType)` or 132-byte nested
  `E_INDEX(abi.encodeWithSelector(E_LATE_INDEX.selector, poisonBindingKey))`.
  Wrong-signature, stale-profile, outer-selector-only and OOG failures do not
  count. Resolve inherited immutable AST declarations when preparing the
  subclass's runtime; the present named-contract helper is insufficient.
  Never introduce runtime masks to bypass that refusal.
- Link the static refusal to the mined attempt using identical sender,
  destination, calldata and adequate explicit gas. Check the **post-receipt**
  block, not a restored snapshot. A correct static error plus an unrelated
  failed transaction is not atomicity evidence.

For B, S0 is counters `(3,3,0,1)`, A protocol nonce 0, frontier 3/publication 1,
generation 0, no gap and five mandatory families `(COMPLETE,1,3)`. Compare all
touched heads **and `postingWord(key,0)` even when count is zero**, evidence and
source-evidence/publication keys, absent admissions 4–8, subject/binding rows,
and unchanged Item/Pair bodies and occurrence counts. This detects orphan
words hidden behind an unchanged list count.

Calibration must establish counters `(8,4,3,2)`, A nonce 1, File admission 4,
Quote admission 5, HEAD/FOLDER/TAG admissions 6/7/8 at revision 1, correct
publication 2, frontier 8/publication 2 and families `(COMPLETE,1,8)`. Check
scope ordinals 1/2/3, histories 6/7/8, Quote backlink 6 and File backlinks 7/8.
A successful receipt alone is not the calibration.

Implementation order remains small: targeted fixture tests and source review;
root-only bounded compile/full suite; separate independent control bytes,
runtime/constructor and raw-state expectations; then one owned fresh control
per row with receipt/pre-post comparison and packet review. Preserve the normal
paid packets and their prices. Do not expand this into an oracle framework or
claim source proofs, portable import or the complete Files lifecycle from it.

## September 13, 20:13: B source/test stage verified

B source `8ddd04cdb12506c663c421c3c588115ca38a93b5` is pushed on the existing
isolated `codex/efs-warroom-b-run` branch. Only production delta is the reviewed
callback visibility seam; `test/MatchedRollback.t.sol` contains the derived
late-refusing fixture and real complete-A1 controls.

Root observed the intended runtime RED (3 passes, 1 missing-refusal failure
after actual normal index maintenance), then **4/4 focused, 63/63 full Forge
and 42/42 Node tests** passing. Both source/spec and full changed-range quality
review passed. Tests check complete error bytes, nonce/counters/coverage,
retained prefix data, absent attempted effects, packed posting word0 and a
positive literal-state calibration. They do not merely assert a reverted call.

The derived fixture's runtime is 4,433 bytes; artifact creation is 5,837 plus
64 constructor bytes. The Foundry test class's 88,185-byte initcode is not a
deployable application. Existing lint/test-harness warnings remain. No compiler
or Anvil process remained after the20:07:39 completion; the lease is released.

Evidence-only `4487d7bdc43be5749e340ccd36cd2d7e70689e4b` retains twelve exact
logs/reviews plus a SHA256 inventory and README (about172KB):
[retained source/test packet](https://github.com/efs-project/planning/tree/4487d7bdc43be5749e340ccd36cd2d7e70689e4b/Reviews/2026-09-12-efs-path-decision/lab-b/evidence/rollback-source-20260913T200713Z).
Two raw whitespace-bearing evidence files are preserved, not reformatted;
the remaining whitespace check passed. No compiled caches were published.

**Still next:** independent inherited-immutable runtime/constructor pins,
static-to-mined input linkage and fixed-block raw pre/post observations, then
the matching C controls. This source/test result is not a mined matched pair,
new transaction-price row, source-state proof or full-Files result. Before
broader fixture reuse, the reviewer suggests one nonblocking calibration with
a nonzero earlier HEAD-key poison to protect future final-key selectivity.

## September 13, 22:05: minimal mined-control inputs sealed

This supplement is a **new control setup**, not a replacement for the normal
paid workload's deployment prices. Root selected three fresh graphs on one
fresh chain (31337, genesis block0/timestamp1800000000): scale7, late-index,
then zero-poison calibration. Deterministic Anvil mnemonic accounts2/3/4 are
their separate deployers; account1 is A and submits its three attempts at
transaction nonces0/1/2. These are local public test keys only.

Each graph uses deployer nonces0–5 for TypeRegistry, QuoteAcceptor,
MinBodyAcceptor(96), Ledger(registry, `keccak256("lab/realm/1")`),
LateRefusingIndexModule(ledger, poison), and Actor(ledger). Transactions6/7/8
register ITEM/PAIR/QUOTE_J; transaction9 attaches the index, and transaction10
calls Actor's one native Items/Pair prefix. Thus independent pre-blocks are
11/23/35, and the attempt/post blocks12/24/36. No prefatory mining or snapshot
restoration is permitted. Any schedule drift requires new inputs, not an
after-the-fact expected block.

The three shapes are `lab/type/item/1` (no rule), `lab/type/pair/1` (two ITEM
references, required MinBody96), and `lab/type/quote-joined/1` (one PAIR
reference, required QuoteAcceptor). There are no additional policies or
binding-reference restrictions. **No FILE/BINARY registration is needed:**
the stable File is the existing untyped CREATE subject. This avoids an unused
control artifact, not a feature sacrifice.

Retain the shared fixture: Item ABI uint2561/2; Pair ABI (Item1ID, Item2ID,
uint2561); A1 mantissa2500000000, scale6 or7, time1800000000, UTF8
`reference quote`; subject salt `keccak256("joined/FILE_QUOTE")`; scope/name/
concept hashes of `/swaps`, `eth-usdc`, `market`; purpose hashes of
`efs2/purpose/head/1`, `efs2/purpose/folder/1`, `efs2/purpose/tag/1`.
Intent deadline2000000000 exceeds every run timestamp. The late-index arm
poisons A's final TAG binding key; other arms use zero poison.

The independent preparer derives exact IDs, source/index obligations,
signatures, constructors/runtime bytes and raw getter answers from these
inputs and pinned production source/artifacts, not candidate runner output.
All-byte comparisons remain mandatory. This is source/input preparation:
no chain lease or successful mined control is yet claimed.

## September 13, 22:39: B mined controls verified

**B supplement complete; matching C controls remain open.** The fresh three-arm
run completed at22:27:46.830–22:27:48.589 UTC. Both static refusals were linked to
separately mined status-0 transactions; the positive calibration mined status1.
Independent packet review found no blocking mismatch.

| B control | Pre/post blocks | Receipt gas | Observed effect |
| --- | --- | ---: | --- |
| Mandatory Quote scale7 | 11 → 12 | 371,952 | Exact 68-byte required-rule error; prescribed S0 unchanged |
| Final market-tag index refusal | 23 → 24 | 1,612,461 | Exact 132-byte nested late-index error; prescribed S0 unchanged |
| Zero-poison calibration | 35 → 36 | 1,614,558 | Exact prepared S1, including required index maintenance |

The independent offline audit checked 781 raw RPC envelopes, 528 literal
fixed-block state replies, 36 signed transaction/receipt/header joins, 18 full
initcode/runtime pins and three static/mined links. All37 contiguous headers
were retained. A separate supplement verified all43 header replies have the
normal30M block gas limit, the exact six-role artifact inventory and all41
unchanged sealed files; missing-role, swapped-role and wrong-gas-limit negative
checks reject. The post-run reviewer independently corroborated these checks.

Compiled Solidity is `8ddd04c`; the actual runner/checkout is `4345992`, and
the inherited-immutable helper is `3dfd975`. The sealed build/source hash joins
are retained; the runner was not present in the earlier Solidity commit.
Evidence-only commit `acbfaf70339b73cd03e937158dd015eb37491b21` is pushed on the
existing B exception branch:
[exact mined-control packet](https://github.com/efs-project/planning/tree/acbfaf70339b73cd03e937158dd015eb37491b21/Reviews/2026-09-12-efs-path-decision/lab-b/evidence/rollback-paid-20260913T222746Z).
Both offline verifier outputs reproduce byte-for-byte from the retained copy;
25 files have a SHA256 inventory, with README/inventory alongside them. Raw
Anvil log whitespace remains unchanged; no compiler cache or chain state is
published. The run's owned processes were stopped and the lease released.

These control prices do **not** replace the normal product rows frozen at19:10.
The result is **RPC_OBSERVED**, not an authenticated source-state proof or a
trace of every internal storage write. No C equivalence, portable import,
historical contract proof, full Files workflow or permanent adoption follows.
The next bounded work is C's same logical controls, then the already specified
required reverse-query cost-reversal experiment.
