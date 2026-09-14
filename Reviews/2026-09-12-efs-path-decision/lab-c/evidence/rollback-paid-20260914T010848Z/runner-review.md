# Independent C control-runner source review — 2026-09-13

Scope: complete `c6fce9d..5dcf7ff` two-file delta (679-line runner, 86-line focused tests), Task 1 brief/shared constraints/report, physical preparation map, and named primary C constructor/identity/signature dependencies. No compiler, Anvil, RPC, source edit, full test rerun or subagents. Manifest compatibility and independent preparation/auditing remain additional root gates.

**Spec verdict: one narrow pre-run correction required. Task-quality verdict: otherwise sound; conditional PASS after the transaction/header validation gap closes.** No honest-run fixture encoding or wire-interface bug was found.

## Important — incomplete mined-location and block-envelope validation

`Reviews/2026-09-12-efs-path-decision/lab-c/script/rollback-control.mjs:404–410` checks the locally signed transaction's sender/destination/nonce/input/gas/hash, the receipt's transaction hash and block number, and the containing header's hash/number/parent/single transaction. It never checks the returned mined transaction's `blockHash` or `blockNumber` against that receipt/header. Contradictory mined-location fields therefore do not fail the claimed full transaction/receipt/header join. Transaction and receipt indices are also not checked despite the one-transaction schedule.

No path checks `header.gasLimit == 30_000_000`, although the shared control explicitly requires 30M blocks. The fixed 15M/8M/5M transaction limits do not establish that block condition.

Smallest correction: add direct mined block hash/number equality, require mined/receipt transactionIndex 0, and verify the observed block gas limit (including genesis). Add hand-authored negative tests for a contradictory mined location and wrong block ceiling. The separate auditor may refuse these inconsistencies, but its later refusal should not substitute for the runner's advertised fail-closed joins.

## Confirmed source/spec behavior

Six CREATEs per arm use nonces 0/1/2/4/5/6, with reciprocal attach at 3 and genuine Producer prefix at 7. Across three fresh graphs, account 1's attempt nonces are 0/1/2 and blocks remain 8/9, 17/18, 26/27. The prefix and A protocol intents correctly use nonce 1. Candidate deployment/setup/fixture inputs are compared before sending; A1 is independently compared before its attempt.

C-specific principals, deployment-qualified realm/origin, fixed profile/obligations, framed Type/Record bodies, six-action prefix and five-action A1 agree with primary source. Mandatory rules remain code-pinned; no unused Bytes declaration is added. The signed digest uses the observed full Ledger runtime, already checked against preparation, including deployment-specific Index/link identity. TAG targets bytes32(1), and only lateIndex poisons market. Scale 7 regenerates the Quote body/ID and dependent HEAD/action/signature. Full 100-byte scale error, 36-byte IndexPoisoned error and `(publicationId,7)` success are checked exactly.

All nonempty logical and storage maps require exact label parity, execute actual calls at fixed pre/post blocks, and compare literal results. Storage replies must be complete 32-byte words regardless of logical length. Failed arms additionally compare S1 with S0; no expected value substitutes for observation.

Artifact path/SHA inventory is exact. Linking changes only the identified ImportLib initcode placeholder; observed complete runtime hash/length must match independent pins, without masks. Strict HTTP/JSON-RPC envelopes, full-byte errors, explicit equal 5M static/mined gas, exclusive new output directory, 4096-envelope/16MiB retention bounds and 30s RPC timeouts are present. Evaluated gates start false and become true only after all arms complete; ordinary caught failures retain false gates and accumulated raw data.

Seven focused tests exercise actual validators rather than source-text claims. Root reports 90/90 artifact-enabled Node tests passing with no skips; this review did not rerun them. No other blocking whole-delta quality issue was found. Source acceptance will not establish mined rollback, normal-price equivalence, full Files, portable proof or permanent adoption.

## Scoped follow-up — mined-location and block-envelope finding closed

Reviewed the entire two-file dirty correction against `5dcf7ff`, plus its actual call sites. `assertMinedTransaction` now directly joins mined block hash and number to receipt/header and the expected schedule, requires both transaction indices to be zero, and requires a 30M header gas limit. `sendTransaction` supplies the actual receipt/header and expected block for every deployment, setup and attempt. Existing parent-hash, exact transaction-hash and single-transaction checks remain in place. `ctx.header` additionally enforces 30M for all fixed-number header reads, including genesis. These checks reject the previously accepted contradictory location/envelope, without substituting prepared answers for state observations.

New hand-authored negatives cover mined hash/number disagreement, header hash disagreement, each nonzero transaction index and the wrong gas ceiling; the existing positive fixture and calldata/nonce negatives were updated to the expanded validator signature. No unrelated behavior or new breakage was found in this scoped correction. Root separately reports intended RED (7 pass/3 fail), focused 10/10 and freshly verified full 93/93 with no skips; I did not rerun tests.

**Final spec verdict: PASS. Final task-quality verdict: PASS for the complete `c6fce9d..reviewed dirty state` two-file range**, carrying forward the whole-range initial review and this narrow closure. No remaining source blocker; manifest compatibility, final commit/seal and independent observed-packet validation remain separate gates.

Reviewed SHA-256: `rollback-control.mjs` = `44f8f1186fccf595039b3cab1b63b83023ab97f6256dc48c3399de76cbc07854`; `rollback-control.test.mjs` = `bcc0c5e4b9b4d20a5ec586435eb687d8b8a79a33891b57268978b11283ea4804`. No compiler, RPC, chain, test run or repository mutation was performed.
