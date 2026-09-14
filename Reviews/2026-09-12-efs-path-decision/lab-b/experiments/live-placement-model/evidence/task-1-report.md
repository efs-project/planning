# Task 1 — live-placement algorithm model

Current standing: **CLOSED — actual GREEN 13/13, independent SpecCompliant / QualityApproved.** Earlier phase entries below are preserved chronology, not current pending work. Final evidence and preconditions appear in Phase 3.

## Phase 1: REDREADY

Read the complete main plan. Added only `lab-b/experiments/live-placement-model/` and this report. No source execution, compiler, Forge, Anvil, RPC, git operation, install, web request, or subagent. The candidate remains a deliberately callable empty-result stub; root owns syntax/import validation and genuine behavioral RED before candidate implementation.

`reference.mjs` independently replays lifetime events into raw authored heads and first-binding order. It imports no candidate code, takes no candidate membership as input, and provides lifetime enumeration and post-selection File HEAD/tag composition. `fixtures.mjs` pins the six-name three-author snapshot and its complete authored tuples: A note→G, A alias→G, C later→H. Hand-derived counters are H9/L6/U4/S3, lifetime 9 candidate scans plus 14 head probes, union 6 raw memberships plus 6 head probes, and stream 6 candidate visits plus 11 head probes. These are distinct logical operations, never interchangeable gas units.

`model.test.mjs` contains explicit reference and candidate assertions for the pinned snapshot; all 27 absent/live/masked assignments; live replacement/reuse; moves out/back; higher masks; two-name churn; ordered same-key effects within one publication; duplicate File targets at different positions; File/revision tags and a File HEAD whiteout; full author/first-binding order; candidate budgets 0/1/2/full; complete-empty versus empty-PARTIAL; missing later-author coverage; stale basis/move/Lens/scope/generation/configuration cursors; and named faulty behaviors/index memberships. The 2→4 audit scan fixture has unchanged live-candidate count 1. The optional 10,000-name case is deliberately omitted: no additional semantic result is needed to justify a scale run.

Index preparation counters are separate from read counters. Tests require one-shot union materialization to account for all six memberships, and prohibit query-time union/dedup/sort prework in bounded streaming. Reads must not rebuild/sort the prepared index. Candidate fault injection is a test-only future implementation surface, not a production API. Extra-index corruption is tested by independent membership comparison because an extra absent position need not corrupt selected output; a coverage claim alone is not mathematical proof of correctness.

## RED gate commands (root only)

Working directory: `Reviews/2026-09-12-efs-path-decision/lab-b/experiments/live-placement-model/`.

```
node --check reference.mjs
node --check fixtures.mjs
node --check candidate.mjs
node --check model.test.mjs
node --test --test-reporter=tap model.test.mjs
```

Expected RED: the independent hand-pinned reference test passes, while the complete-union candidate assertion sees `[]` instead of the three explicit authored tuples. Other unimplemented candidate behaviors also fail. Syntax/import failure is not behavioral RED. No execution result is claimed here. Preserve reference, fixtures and assertions for GREEN; implement only the candidate after explicit root authority.

## SHA-256 source freeze

- `README.md`: `644bb992362448207a6dc98de9ef1a371eb2b90fd9aec9f4343bc75371e9fb90`
- `candidate.mjs`: `8e76ac7675cdaf3322b5cfd97b3f03a24c087641aadbcc9c65a9fbaab0efb8d6`
- `fixtures.mjs`: `f003a31b1cd770d5e39d20fd966005bd36582a5cb1519691b0c5fc019f619288`
- `model.test.mjs`: `210e6226c43b8fc10b3cd82565eac2588c40b77862a42bdfeef4ce6dddc7c344`
- `reference.mjs`: `407af262140a32aa1ac068353fea4c61620ce013e5f60b50fed0add1c0d4eaa5`

## Self-review / limits

Checked event admissions and first-binding ordinals against the literal expected tuples; separate tags/HEAD scopes do not enter folder candidate counts. Reference head replay preserves Map insertion order on replacement, so retained first-binding order is not derived from candidate order. Every modeled mask follows a live bind. Full placement identity, selected HEAD provenance, and both evaluated tag results are compared, not merely File targets. The source-only whitespace scan found no trailing whitespace. Node syntax and test execution remain root-owned and pending.

This is a disposable finite current-query model, not a Core/index/Lens/Files change, adopted API, historical read proof, paid benchmark, storage/gas improvement, or large-directory readiness claim. All audit/history data remain conceptually retained. No candidate implementation has yet been made.

## Phase 2: GREENREADY after root-observed RED

Read root's retained `/tmp/efs-b-archive-task1.OXPOfb/live-placement-red.json`: all four syntax checks exited 0; Node v26.0.0 ran the 13 cases with `--max-old-space-size=128 --test --test-isolation=none --test-reporter=tap`. The independent pinned reference passed; the candidate's first failure was an empty array against the three exact authored tuples. Aggregate outcome was 4 passed / 9 failed, exit 1, no signal. Root then explicitly authorized candidate implementation only, plus status documentation.

Implemented `candidate.mjs` without reference/fixture imports or expected-answer literals. It independently applies ordered effects to retained raw heads and dense live membership arrays with slot maps. Live replacement keeps membership; bind after a mask reinserts; UNBIND swap-deletes live membership while retaining the raw mask. Current membership is copied/sorted into first-binding order during explicit preparation. Separate counters report effects, membership updates, copied entries, sort comparisons and snapshot packet bytes. Neither complete-union reads nor pages reconstruct membership from raw heads.

One-shot union charges every membership visit/materialized entry and deduplication check, then resolves each unique position through higher heads including masks. Iteration through prepared author/ordinal order preserves existing output order without a read-time sort. Ordered streaming uses the same prepared membership but independently visits each candidate, loading its head and higher heads without materializing a union or maintaining a global deduplication set. Each page bounds candidate visits, separately counts scope/coverage/head work, and remains PARTIAL until all live candidates are exhausted. Missing required author coverage is UNKNOWN. Current-event/configuration/coverage snapshot identity, admission, generation, scope and ordered Lens qualify every continuation; stale context rejects.

Tag joins use selected placement first, then authored File HEAD and File/revision tag assessments. Named negative modes genuinely alter head reduction, coverage checking, File deduplication, tag-before-placement reduction, live membership, or dense-order/stale-cursor handling. Extra/missing membership mutations leave raw heads and claimed coverage unchanged. The stale-cursor mode deliberately uses the dense swap-delete order and bypasses snapshot-context rejection, rather than returning a canned mismatch.

Source self-review rechecked the expected H9/L6/U4/S3 and 9/14 versus 6/6 versus 6/11 operation counts, retained binding ordinals on name reuse, same-key sequential effects, complete-empty after HEAD whiteout, and cursor exhaustion at exact budget. No test, fixture, or reference assertion changed after RED. No candidate code was executed by this worker, so syntax/GREEN claims remain root-owned and pending. Preparation is a whole finite snapshot operation, not evidence of cheap incremental ordered indexing. No new cost, storage or production-readiness claim.

GREENREADY SHA-256:

- `candidate.mjs`: `452703b70608ef53294a9f1ad4172b299f2798c71996b73d1bbbbeaecc77605e`
- `README.md`: `6738e4244bb60a257a361423c11d2e02200c110e2880dc62f3489f81a66d904c`
- `reference.mjs` unchanged: `407af262140a32aa1ac068353fea4c61620ce013e5f60b50fed0add1c0d4eaa5`
- `fixtures.mjs` unchanged: `f003a31b1cd770d5e39d20fd966005bd36582a5cb1519691b0c5fc019f619288`
- `model.test.mjs` unchanged: `210e6226c43b8fc10b3cd82565eac2588c40b77862a42bdfeef4ce6dddc7c344`

Root may use the same bounded Node command as RED, with `--test-isolation=none`, then commission independent review. Work is frozen at GREENREADY pending those gates.

## Phase 3: CLOSED — actual GREEN and independent approval

Read the complete actual GREEN JSON and full independent review. Root's frozen Node v26.0.0 gate ran 2026-09-14 12:43:46.164–12:43:46.436 UTC: all four syntax checks exit 0; 13 tests pass, 0 fail, 0 skip; test exit 0, signal null. The bounded helper used a 128 MiB heap, 20-second test timeout, and 2 MiB captured-output limit. No new model execution was performed for retention.

Independent review by `/root/files_paid_runner` is **SpecCompliant; QualityApproved for the bounded representation experiment**, with no scoped Critical/Important finding. Full review SHA-256: `1999b72fe6ba4bfe15d38376b865f9e573bf52a38ddaafdb1e353651781aad61`. It independently checked source bytes and complete RED/GREEN outputs; only candidate source differs between the frozen runs. Its housekeeping request is addressed in the README and this closure.

Publication preconditions are explicit: an honestly maintained frozen snapshot and API-issued continuations are assumed. Context matching/numeric bounds do not authenticate traversal history or prevent a caller from forging an end offset. Exported model maps and coverage flags do not prove arbitrary correct maintenance. Hostile queries/duplicate-author normalization, authenticated public cursors, historical live sets, cold browser/name reconstruction and production readiness remain outside this result.

The retained `experiments/live-placement-model/evidence/` packet contains 18 files: four RED source files, four GREEN source files, the two complete root JSON reports, original bounded run helper, source/design review, full independent review, main plan, this report, packet ledger, mechanical retention generator, and SHA-256 manifest. Original report/helper bytes are preserved, including their original temporary-path provenance; the helper is evidence, not a newly authorized replay. The generator prechecks pinned input bytes, writes new exact copies only, records lengths/digests, and verifies copied bytes; it neither imports the model nor spawns a process. Root owns any publication operation.

Exact outcome evidence pins:

- RED JSON: `bd2fb1d074963f87594b60032883be7b1c3e6580c5dead059bbbe0f0374d6a59`
- GREEN JSON: `def1cd59523d4c48c5a8f7eecdfc3e87844e1d7d12358e5ff82442e2d48d56d7`
- Original bounded run helper: `9198c7dfed69e2107e9058590dd7b0bb33791d35710b2a843bccfeb3a10c7bb5`
- Source/design review: `baddbc836b2d7e5778323283c2cf5a934ac3c954694048b75c7a7324f0c1ff64`
- Independent review: `1999b72fe6ba4bfe15d38376b865f9e573bf52a38ddaafdb1e353651781aad61`

Candidate/reference/fixture/test pins remain those in Phase 2. The ledger/manifest provide the exact final retained inventory. The useful result remains only that this finite current-query model avoids some lifetime-only scans while preserving the tested selection/order/tag semantics. It does not price onchain updates, storage, stable-order traversal, callback budgets, or total query economics; no large-directory/history/cold-browser claim follows.
