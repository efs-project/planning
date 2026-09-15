# Task 1: bounded Name-copy and substring repair

2026-09-15; base `09e022f`, branch `codex/efs-warroom-b-run`. Disposable prototype evidence, not deployment or full Core closeout. Session: `bytework-task1-20260915`; parent owns independent review and shared status.

## Result

Native single-action retention and a native single-action bind now accept the same valid 255-byte Name without changing the existing callback allowance. `FilesNameLayout.load` copies exactly the decoded length with memory-safe Cancun `mcopy`, after the unchanged fixed-return-buffer ABI checks. Search uses an exact KMP prefix table prepared once per page; query/Name length limits and all row qualification checks are unchanged.

| Warm diagnostic candidate budget | Short negative gas | Difficult negative gas | Correct negative |
| --- | ---: | ---: | --- |
| 1 | 295,840 | 559,725 | yes |
| 4 | 920,431 | 1,702,298 | yes |
| 8 | 1,760,343 | 3,227,519 | yes |
| 32 | 6,844,113 | 12,423,050 | yes |

Every diagnostic read has the existing 15M call fence. Native single-bind whole-call warm gas is 742,700; that is not the callback-only gas. The unchanged Ledger callback cap supplies the actual index bound. Setup is an unconstrained, already-warm Foundry fixture; these numbers are neither cold transactions nor protocol constants. The 32-row fixture preserves its original legitimate two-action Name+placement setup; the separate native Name255 test uses no action padding.

## Verification

- [Expected RED](red-audit.txt): both new A2/A3 requirements failed before repair; A4 reproduced. A3 stopped at budget 4 after budget 1 succeeded.
- [Initial GREEN](green-initial.txt): 7 tests passed after the repair.
- [Final GREEN](green-final.txt): 7 tests passed, including maximum 255-byte equal search, byte-copy lengths 0/1/31/32/33/254/255, malformed ABI bounds and padding length, literal overlapping/equal/empty/longer/final-position search cases, and unknown Name/header/tag negative controls against the actual page and paid consumer.
- [Covering checks](covering-final.txt): 58 tests passed: `FilesPageReaderTest` 24, `FilesNamesTest` 8, `FilesCarrierProfileTest` 13, `FilesCarrierIndexTest` 13. Inherited mandatory-index rollback, native/signed Name ingress rejection, carrier validation and unknown-read tests remain green. These are selected families, not the full historical suite.
- [Artifact sizes and ABI hashes](artifact-sizes.md): all five deployable affected helpers remain below unchanged runtime/initcode limits. Existing compiler shadowing/mutability and oversized Foundry-test-harness warnings are retained in the logs.
- `git diff --check` passed. Source self-review found no public ABI, registry, Core, authority, Name grammar, selector limit or callback changes. A4's unrelated-admission/continuation reproduction is unchanged and still passes as an OPEN limitation.

## Scope and review

Implementation anchors: `test/FilesNamesProfile.sol:53-58`; `test/FilesPageReader.sol:65-66,86,131-167`; regressions in `test/CoreReadCostAudit.t.sol` and `test/FilesBytework.t.sol`.

Only the previously verified `/tmp/efs-recovery-build-wPDyNv` output/cache was reused, with no concurrent Forge builder. No Anvil, full traces, dependency install, public deployment, owner-demo mutation, production repository change, prototype migration or push. Historical audit logs were preserved. Required-index transaction redesign and query-local continuation are separate work; this packet does not close the six-packet audit.

Source SHA-256 (lab-relative):

```text
6ec065478b4f9bba86635dcde3d87d0aba6b8fbb23c8f0f7637645f5e05bbf6b  test/FilesNamesProfile.sol
4d955091e3920bb6983eec7063709ce61fbdb2f27ee8dcc1c89937d77429e0af  test/FilesPageReader.sol
8c3ebd4ae806104a8c7779fcc0ffbc6c9fe15a9904c186ed01d33405a3527a6f  test/CoreReadCostAudit.t.sol
81633f0a59b47786b8ac9dbee29d6f602db31514acc4e8086d161611fb21192f  test/FilesBytework.t.sol
```
