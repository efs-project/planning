# Files shortlist review — 2026-09-13

**Standing.** Advisory source review only. Planning is pinned to `786849d`; B to measured source `c5561e2`; C to Solidity `2ca7349`. No build, RPC, Anvil, worktree, or protocol-byte claim was made. The observed paid slice proves two-author Quote selection, not this Files journey.

**Coordinator integration:** the original advisory report was verified at SHA-256 `5db15fc16c7c9ddddeb1f732e4542440ea232c4bc87fc88dfa933be700462345`. This main copy clarifies fixed-block browser reads versus later-state contract pagination after a second source review; it is not an executed validation.

## Finding

Both candidates can represent all four discriminators. The smallest next gate is a matched disposable Files fixture plus a qualified consumer and independent raw-state oracle. No Core/storage redesign is yet justified for this microcase, and no action/record count is required.

Source anchors: B `Keys.sol:82–95`, `Ledger.sol:594–670`, `LensReader.sol:90–274`, `IndexModule.sol:95–140`, and `LedgerEvidence.t.sol:140–200`; C `EfsTypes.sol:188–205`, `ActionLib.sol:354–379`, `LensReader.sol:139–348`, `IndexModule.sol:101–141`, and `Selection.t.sol:37–150`.

| Discriminator | Already expressible | Small addition owed |
|---|---|---|
| Stable `F`, competing revisions | B and C separate stable Subject identity from immutable content-derived Records; each author has an independent CAS `HEAD`; ordered A/B Lenses and no-tiebreak conflict retain both candidates and binding history. | Replace Quote payloads with a candidate-native revision representation for exact `R0`, `RA(parent R0)`, and `RB(parent R0)` bytes. The adapter verifies File linkage, parentage, authorship, Record identity, and body commitment. |
| Move and reuse old path | Both have `(author,FOLDER,folder,name)->File`, tombstone/zero target, rebinding, scope listing, and placement history. B already source-tests `F -> mask -> G`; C source-tests move/replacement/removal. | Compose the exact two-folder fixture, Bob’s lower-priority placement at the moved name, and point/list/history agreement with no ghost or duplicate. |
| File versus revision tags | Both TAG coordinates can name either the stable Subject or an immutable Record. | Current joined reads prove only a File tag. Add `selected File -> HEAD at basis -> TAG(selected revision, concept)`, carrying explicit `FILE`/`REVISION` subject kind and ID. `project_efs(F)` must hit under both Lenses; `approved(RA)` must hit only after L-A selects `RA`. |
| Correct masks | Both ordered reducers stop at the first principal’s tombstone; a higher Alice mask blocks lower Bob while B-first can still select Bob. | Exercise the exact new-path mask and report `MASKED` separately from never-bound, `UNKNOWN`, and `PARTIAL` in point, folder, and tag results. |

## Three blockers before calling it passed

1. **Matched Files evidence is absent.** The current paid packet has no exact File bytes/parents, revision tag, full move/reuse/mask sequence, or independent oracle.
2. **The qualified Files adapter is absent.** It must pin one basis across point/list/head/tag/history, recompute body identity, retain losing candidates, and require scope/history coverage through that basis. C can compose `resolveAt` plus existing history/coverage. B’s current `list` reads current heads in the queried EVM state (`LensReader.sol:134–203`). Browser calls explicitly pinned to the same available block hash/state can be coherent without a new historical reducer. A paid contract paging across later states needs historical reduction or a strict frontier/context check and restart; the cursor and `mutated` flag alone are insufficient. Historical reduction appears reader-only for this microcase, not Core storage work.
3. **Broader Core gates remain separate.** Typed reverse-reference completeness and contract-visible portable evidence still need finalist work; neither should be pulled into or silently waived by this four-step run.

## Smallest executable action sequence

1. Freeze only the semantic matrix: `F`, `G`, two folders/names, exact `R0/RA/RB` bytes and parents, File/revision tag subjects, L-A/L-B/L-EQ, and expected masks. Candidate encodings and record count remain outputs.
2. Admit `F/R0`; tag `F` and `R0`; Alice admits/binds `RA`; genuine Bob contract admits/binds `RB`; Alice tags `RA`. Seal `B1`. Through an unrelated paid consumer and independent raw reader, require L-A=`F@RA`, L-B=`F@RB`, L-EQ=`CONFLICT`; exact bytes/digests, parents, authorship, losing candidates, bounded history, and COMPLETE required coverage; File tag under both, selected-revision tag only under L-A.
3. Alice masks the old name and places `F` at the new name; Bob adds lower-priority `F` there; Alice creates `G` and reuses the old name. Seal `B2`. Require `G` only at the old path, one selected `F` at the new path, unchanged File identity/heads, no tag leakage, and retained name history.
4. Alice masks the new name. Seal `B3`. Require L-A=`MASKED`/omitted without fallthrough, L-B=`F`, with Records, tags, and history still reachable.

Stop at the first identity change, tag leakage, filter-before-selection, lower-source fallthrough, mixed basis, unverifiable bytes, or incomplete coverage mislabeled complete. Do not proceed to scale, restore, browser, portability, or the reverse-reference gate merely to accumulate evidence.

## Coordinator clarification: two ways to keep a coherent basis

For a browser, all point/list/head/tag/history calls can execute against the same explicitly pinned block hash and state, provided that state is available and block identity/reorg handling is checked. This remains RPC-observed unless independently authenticated. A block-number label alone is not sufficient reorg protection.

For paid calls executed in later transactions, carrying an old admission cursor does not restore earlier EVM state. Either compose historical per-author selection/masking from retained scope/history, ignoring coordinates first bound after the basis, or reject whenever the actual frontier/Core/rules/index context differs, discard the traversal and restart. Restart does not promise progress under continuous writes.

In B, `_masked` reads higher-principal current heads without comparing their admission to the cursor (`LensReader.sol:208–217`). A post-page higher-principal change can affect a later lower-source result while raw `mutated` stays false. Do not expose that flag as a complete coherence guarantee. The existing paid consumer checks the exact frontier in `_pinBasis` (`JoinedConsumer.sol:455–461`); the previously reviewed fixed-state paid packet is not invalidated by this caveat.

Retained scope coordinates and the existing `_history` bisection (`LensReader.sol:249–274`) appear sufficient for the bounded historical Files reader under pinned code/rule/index and coverage assumptions. That remains an implementation hypothesis, not arbitrary historical-policy support or a new COMPLETE claim. Wider reverse-reference and portable-evidence gates remain separate.
