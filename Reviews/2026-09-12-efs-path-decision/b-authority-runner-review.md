# B authority-repair runner review

September 13, 2026 · independent read-only review of `3c6947d` (Core `aaecfed`) · disposable diagnostic, not a protocol verdict

**Standing: NO-GO for a receipt run as written.** Root freshly ran the 11 existing Node helper tests and the syntax check successfully; those tests do not cover the new cases below. No new compiler/chain evidence was produced by this review. Fable owns the source repair.

Source root for the cited lines: `3c6947d:Reviews/2026-09-12-efs-path-decision/lab-b/`. Line numbers are at that pin, not a later dirty worktree.

1. **Wrong caller in the negative probe.** `script/measure.mjs:301-304,619-638` retains `eth_call` with `{to,data}` but no `from`. Refused re-registration therefore reaches `TypeRegistry.register` as the zero address: `E_ADMIN` precedes `E_TYPE_EXISTS` (`src/TypeRegistry.sol:73-77`). The unsupported-native caller-author path is likewise not the claimed caller. Pass the actual transaction sender in the simulated call and retain it; add a caller-sensitive regression.
2. **Assert the intended error, not just its family.** Stale-policy evidence must decode/assert `E_INTENT(3)`, not another `E_INTENT` field. Assert `E_TYPE_EXISTS(derivedTypeId)` as well. Retain the raw revert data alongside decoded self-checks.
3. **Close the rule-identity joins.** `resolveType` must assert active codehash equals the derivation codehash and initial activation is 1. The policy cell must join active `typeInfo`, activation row 2 and the new admission's `acceptanceBasis` by Type, codehash and epoch; compare the complete immutable descriptor if claiming it unchanged. Adapt these checks to the forthcoming mandatory-rule/additional-policy split, rather than freezing the superseded repair ABI.
4. **Make bounded selection literal and fail closed.** The existing substring filter can select policy and failures only in separate executions. An unmatched filter can skip every cell and still exit successfully. Accept a small exact cell list (or equivalent explicit selected set), reject unknown/zero matches before starting a chain, and report planned versus executed cells. This needs no new benchmark framework.
5. **Correct the manifest.** The policy description says `3_000_000_000`, whereas the supplemental quote body is literal `3000`. State the actual fixture and what it proves, or deliberately choose the intended above-cap fixture before running. The full inventory lists 21 cells, not the old 18; a bounded run must identify its actual subset.

Static positives: derived-ID dependency order and formula, registration log/view/local-ID comparisons, StrictQuoteAcceptor artifact discovery and post-registration JoinedConsumer deployment were coherent at the reviewed pin. These comparisons remain candidate self-checks; none independently authenticates chain state or qualifies an architecture winner.

Separately, the source review found that a replaceable policy could bypass the Type's declared rule, and that `MockAcceptor` has mutable state behind one codehash. Those are tracked in the [[README#Coordinator checkpoint|current handoff]], not repaired by improving the runner. A changed source/profile needs new explicit pins; earlier retained packets remain interpreted under their original profiles.
