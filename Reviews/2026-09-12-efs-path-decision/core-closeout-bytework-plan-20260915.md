# Core closeout: bounded name and filter work implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox syntax for tracking.

**Goal:** Repair the two demonstrated byte-work cost cliffs without shrinking the supported Name domain or increasing gas caps.

**Architecture:** Keep the compact Ledger and separate mandatory index intact. Use bounded bulk memory copying for verified Name ABI data and a linear-time substring predicate in the existing joined reader. Preserve all qualification, masking and continuation semantics.

**Tech Stack:** Solidity0.8.30, Cancun, optimizer200, via-IR, Foundry; existing Node26 integration tools when needed.

**Spec:** [[core-design-audit-20260915]], findings A2/A3. James authorized finishing the prototype against that audit. This is the first bounded implementation packet, not the whole six-packet completion claim.

## Global Constraints

- Existing prototype worktree `planning-warroom-b-run`, branch `codex/efs-warroom-b-run`; canonical designs/reports on planning/main. No migration of prototype code into main.
- No owner-demo mutation, public deployment, production repository, dependency installation, unbounded traces or new recurring run.
- Keep runtime limit24,576; initcode49,152; paid transaction cap16,777,216; normal test transaction allowance15M. Do not increase `ACCEPT_GAS`, callback allowance, Name255-byte limit or page selector limits to make the check pass.
- Required index failure still rolls back the whole publication. Missing/unavailable/unsupported reads never become verified absence.
- Only one implementation/build/chain worker; read-only preflights can run alongside it. All artifacts/caches run-specific and Anvil history bounded if any chain is needed. No other workers or subagents spawned by implementer.
- Focused red/green and covering tests, not a full historical test campaign. Existing audit traces are historical evidence, never edited to pretend an earlier success.

### Task 1: Remove redundant Name copying and quadratic substring work

**Files (relative to compact lab):**
- Modify `test/FilesNamesProfile.sol` (`FilesNameLayout.load`).
- Modify `test/FilesPageReader.sol` (`_match` and a small pure search helper if useful).
- Modify `test/CoreReadCostAudit.t.sol` to assert fixed A2/A3 behavior while preserving the A4 reproduction until its separate repair.
- Add one focused substring/name boundary test file if necessary; avoid a broad generic utility framework.
- Retain fresh bounded evidence in `core-closeout-bytework-20260915/`.

**Interfaces:** Public reader/index ABI, Name Type meaning and Ledger callbacks remain unchanged. The reader's boolean substring result must exactly match byte substring semantics for empty, equal, absent, overlapping and near-match inputs; all existing row qualification checks remain outside it.

- [ ] Turn A2/A3 diagnostic expectations into required behavior. A255-byte Name must retain and bind natively as one action with the existing callback cap; all four difficult-search budgets1/4/8/32 must return the correct negative answer under the existing15M warm diagnostic allowance. Keep observed gas as output, not a new protocol constant. Run focused checks and retain expected RED output.
- [ ] Replace byte-at-a-time copying only after strict existing ABI validation. The current `output` buffer has data bytes beginning at memory address `add(output,192)`; destination begins `add(value,32)`. Copy exactly decoded `n`, using memory-safe Cancun `mcopy`, with existing length/padding/bounds qualification preserved. Avoid copying unbounded returndata or changing valid bytes.
- [ ] Replace nested substring comparison with a linear algorithm such as KMP. Build a bounded prefix table for at most255 bytes and scan the at-most255-byte Name once; do not use hashing without exact collision-safe equality. One pattern-preparation per page is preferred if clean, but public ABI stays unchanged. Empty needle matches, longer needle does not, overlapping prefixes must work.
- [ ] Exercise true/false examples independently: `aaaaab` contains `aaab`; `aaaaa` does not contain `aaab`; equal pattern matches; empty pattern matches; longer pattern does not; final-position match succeeds. Preserve a real unknown-name/tag/header negative-control check so optimization cannot filter unknown rows away.
- [ ] Run the changed audit tests and existing `FilesPageReaderTest`, `FilesNames` and mandatory Name/carrier covering tests, selecting explicit paths/contracts. Log actual commands, outcomes, diagnostic gas and code sizes. If a valid case still fails, trace its specific cause; do not pad operation batches or silently reduce required work.
- [ ] Self-review and commit exact task files with vault trailers, then return the source range and concise report for independent task review. Do not push; parent coordinates publication and canonical results. Main audit and owner requirements are not worker-owned files.

## Follow-on sequence

The parent keeps all six audit packets active. Read-only preflights resolve the
acceptance/index transaction API and query-local dependency semantics while this
bounded repair runs. Their implementations receive separate precise briefs and
review gates. No completion of Task1 marks the whole prototype complete.
