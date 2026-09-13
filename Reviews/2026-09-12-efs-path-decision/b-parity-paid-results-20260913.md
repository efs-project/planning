# Compact EFS: stronger paid reads, still lower measured costs

September 13, 2026, 18:07 UTC · disposable local `RPC_OBSERVED` evidence;
not an architecture selection, authenticated state proof or full-Files price

The compact candidate's cost advantage survives adding the identified missing
paid-consumer checks. The added revision, admission-basis, coordinate and cursor
checks increase its paid reads by about **9%**. The current MUD-backed adapter
still costs **45–51% more** for these four paid-read transactions. That is a
comparison of the measured implementations, not a proved MUD tax or a claim
that all required functionality now matches.

## Actual whole-transaction receipt gas

| Operation | B compact, stronger consumer | C MUD-backed, retained run |
| --- | ---: | ---: |
| A1: signed File create, fresh Quote, head, one placement and tag | 1,614,408 | 2,400,503 |
| A2: signed fresh Quote and head update, preserving A1 | 658,950 | 1,112,430 |
| B1: contract-originated fresh Quote and competing head, no new placement | 796,542 | 1,275,405 |
| Paid selected graph point read, A-first | 167,281 | 252,517 |
| Paid selected graph point read, B-first | 167,513 | 252,457 |
| Paid one-entry listing plus selected graph, A-first | 269,617 | 391,043 |
| Paid one-entry listing plus selected graph, B-first | 277,278 | 405,632 |

Both arms use A's single folder placement while selecting A2 or B1 as content.
The four paid reads are alternate restored branches, not one cumulative bill.
A1 is a combined operation, not a marginal folder-placement price. These are
paid Solidity graph reads, not bare storage getters or browser RPC prices.
C's source and qualifications remain in [[c-gated-paid-results-20260913]].

Compared with previous B, point A/B increase by 13,645/13,629 gas and list A/B
by 23,011/22,995. Those differences include the new checks, interface/calldata
and compiler effects; individual assertions were not separately metered.
Ledger/index storage code is unchanged. A1 moved by -25, A2 by +37, B1 by zero;
the tiny write differences have not been causally isolated.

Separate B costs: native Items/Pair prefix **921,085**; 26 setup transactions
**17,333,852**, including unused diagnostic contracts. This is neither a
minimum production deployment nor the same bootstrap grouping as C's four
Types plus Items/Pair. No live-dollar quote or fuller-v2 saving is inferred.

## What this pass established

- Implemented [[paid-read-parity-next-gate]] using existing getters, not new
  Core storage: expected selected revision; nonzero/bounded record and binding
  admissions; exact HEAD/File and FOLDER/name coordinates; nonwrapping revision
  provenance; local-versus-imported category; matching list cursor context.
- Root first observed seven intentional failing regressions, then corrected
  two test-isolation/precedence issues without relaxing production checks.
  The final build passed **59/59 Forge and 42/42 Node tests**, with independent
  source review. Captured Node tests used v24; root repeated them on v26.
- A separate preparer froze all **17** complete deployment initcodes/runtimes
  and four paid call/return/event vectors before chain execution, without
  reading candidate fixture/result code. Two controller stages checked exact
  runtime bytes plus 18 before-fixture and 79 after-B1 raw-state checks. Three
  publication checks are explicitly partial, not full signature/evidence proof.
- Root and independent packet review checked **34** signed transactions,
  receipt/header joins, all 17 deployments and all four exact paid outputs.
  Each paid transaction is alone in block 31, following the same sealed block 30.
  This closes the old B packet's candidate-only output-comparison gap for this
  new run, not retrospectively for old evidence.
- Review found a small audit linkage omission: decoded transaction bytes were
  compared with RPC fields but not all later-used metadata. Root reproduced
  it, added direct data/destination/nonce equality and a regression refusal.
  `audit2.json` passes four corruption refusals; original audit/result remain.
  The independent reviewer also checked controller seals/runtime observations
  beyond this bounded audit script. No result or gas value changed.

Consumer runtime is **17,781 bytes**. Artifact creation code 18,218 plus 192
constructor bytes gives **18,410-byte complete initcode**. All actual deployed
targets fit normal limits. The 140,072-byte Foundry test-harness initcode is not
a production deployment; its warning and existing compiler lint warnings remain
visible in retained logs.

## What still prevents a feature-equivalent comparison

**Required reverse-reference discovery remains a real gap, not an optional
feature we can silently omit.** [[required-index-gap-20260913]] traces the
requirement: B's binding-target backlinks differ from C's Record-reference
postings, and neither proves complete typed/occurrence/Lens semantics. B would
currently scan unrelated Quote admissions to discover Records referencing one
Pair; C has target-keyed Record postings but still needs role/Type/basis handling.
Conversely, B maintains binding-target live counts that C does not equivalently
demonstrate. Price the required query and maintenance before treating cost
ratios as normalized overhead.

Other differences remain: packed/shared B coordinates versus C's generic action
and evidence rows, canonical framed references, larger observations and explicit
Realm/Core evidence context. The current receipts do not isolate those costs.
Shared mandatory-rule/index rollback, portable evidence retention versus old
command replay, source proofs, full file operations, historical rule/account
changes, large directories and churn remain open. None is waived. The next
discriminating work is the required-index query plus [[paid-rollback-control]]
and [[portable-evidence-next-gate]], not endless micro-optimization.

## Pins and retention

Measured source `c5561e2b27c48ca2938695cce7784f1e78564116`, isolated branch
`codex/efs-warroom-b-run`. Evidence-only commit
`cbadc00e3a96cdcd76a988fbd07f94cce4ad8f85` is pushed; see the
[retained packet](https://github.com/efs-project/planning/tree/cbadc00e3a96cdcd76a988fbd07f94cce4ad8f85/Reviews/2026-09-12-efs-path-decision/lab-b/evidence/parity-20260913T180728Z).
It contains 49 hash-checked copied files plus `SHA256.json`, about 4.3 MB.
Input SHA256 `31dbc9e1ad5580fa5b5b119ffba1d209299529227feb82bfedeedd9e4caca3d0`;
arm SHA256 `b28c779bba360ecae19ba7beb68610cae9ce27ba33245c66d88e3415f023b83f`.

Solc 0.8.30/Cancun/via-IR/200; Node 26.0.0; Anvil 1.7.1; chain 31337, 30M block
gas, prune 256. Run 18:07:28–18:07:30 UTC; owned Anvil PID 76613 stopped. Root
confirmed no Forge/Solc/Anvil process and 274 GiB free afterward. Expired leases
cannot be replayed. Eight exact historical logs/diffs/script snapshots retain
their original whitespace and are excluded from the otherwise passing
whitespace check; no evidence bytes were reformatted. Historical absolute
paths remain for provenance; reproduction needs path remapping and pinned
dependencies/rebuild. Build caches are not committed. No Claude-owned worktree
was changed, and no source-state authentication claim is made.
