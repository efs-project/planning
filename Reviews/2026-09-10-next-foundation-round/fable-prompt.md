# Fable prompt — useful, hard-to-misuse Files and bounded current browsing

**Status:** superseded launch prompt; never sent or executed

#status/superseded #kind/prompt #repo/planning #topic/efsv2

> Do not run unchanged. The replacement split and retained requirements are in
> [[Reviews/2026-09-10-foundation-reply-after-economics]]. Original text follows
> for comparison, not as an active assignment.

Work with Codex to turn the new EFS v2 design requirements into a more useful,
less brittle prototype. Use your engineering judgment, independent reviewers
and throwaway comparisons. Do not stop at a report if safe local implementation
and validation can answer the next question. Finish coherent checkpoints before
expanding scope; if a mechanism fails, change it and document why.

## Start and coordinate

Read your repo AGENTS/profile, then your latest
`Reviews/2026-09-09-files-browser-mvp/report-for-codex-2026-09-10.md` at
`0132e3561570fff710625216a4e99303dce0faae` or its verified successor. Also read
the current PM branch `codex/mvp-c0-coherence` foundation review, readiness map,
this round's README, and `Designs/sdkv2/mvp-interface.md`. Locate worktrees via
Git rather than assuming paths or resetting any checkout.

Use your existing `fable/2026-09-09-files-browser` branch. You are this round's
sole writer/integrator for shared Files browser/reader and associated Core
changes. Codex owns current-spine reconciliation and separate storage,
acceptance/evolution and identity/privacy experiments. Do not edit Codex's
worktree or those labs. Exchange exact-commit patches/fixtures; do not consume
another worker's changing source directory at runtime. Neither side should
bulk-merge the other's long-lived branch.

## First checkpoint: make the ordinary reader path difficult to misuse

Implement and measure your aggregate-level proposal in the existing reader,
declarations and actual browser. Start with `files-reader.mjs`, `index.d.mts`
and the existing consumers; preserve the five SDK seams. Do not re-propose a
sixth seam, a universal wire enum, signed diagnostics or a wrapper-only fix.
The current architecture already owns the four C0 point outcomes. Send any
remaining vocabulary mismatch to Codex; don't wait on a new registry to proceed.

Compare state-specific collections for complete/current, partial, prior/stale
and unavailable observations. A single discriminated position collection per
state may keep FOUND, UNKNOWN, CONFLICT, masks and absence evidence together.
Use different collection names where that blocks the measured unsafe access;
do not accidentally reintroduce the same detached happy-path field everywhere.
Choose the simplest working shape, not necessarily the spelling in your report.

Complete enumeration does not mean every position resolved. Preserve meaningful
partial Files results, Needs attention and explicit continuation; do not fix
honesty by withholding all useful data until a full scan finishes. Show confirmed
filter matches with honest coverage where useful. Negative filters and exact
counts need adequate closed-domain and predicate evidence.

Expose previewable bytes only in a verified branch. Keep mismatching raw bytes
available for diagnostics/export without treating them as verified content.
Carry domain, basis, source, coverage and prior sealed evidence through cache,
worker, serialization, filtering and export boundaries. Validate decoded inputs;
an object saying COMPLETE is not its own credential.

Turn type checking on for the real consumer code, using checked JS or a focused
TS conversion as appropriate. Keep declaration/runtime behavior aligned. Test
with retained old-shape and candidate controls, a positive type-checker control,
and the exact unsafe expressions whose behavior changed. Exercise
the known misuses plus defaults, destructured results, helper calls, forged
serialized states and stale observations. Retain the scanner as scoped defence
in depth with false-positive controls, not a soundness proof. Ensure deliberately
broken consumers fail and valid partial workflows still work. Types and absent
fields cannot force a third-party app to display unresolved results; say exactly
what the experiment prevents.

## Second checkpoint: browse current data without paying for all retired names

Reuse the churn fixtures and independent resolver. Compare the current control,
bounded aggregate reads, and a maintained per-Principal current-candidate index.
Aggregation alone reduces round trips, not necessarily lifetime work. Preserve
whiteouts, unresolved candidates, attribution, Lens order, history and restoration;
never replace these with a global list of visible filenames.

Keep the live set fixed while growing retired distinct names. Measure inspected
entries, calls, response bytes, cold/warm gas, write amplification, first useful
Files, completion and continuation cost. Exercise provider switches, writes
during pagination, generation/backfill gaps and reorg/rebuild. Bound work by
what was inspected, not by how many happy rows were returned. Retain a simple
baseline and reject any faster path that changes qualified results.

Codex measures body-storage/cost alternatives. Send the new index's costs and
read dependencies to that lane; do not independently move bodies offchain or
weaken arbitrary future contract reads to win a benchmark.

## Then take the next useful independent checkpoint

Prefer selected-state export verification: one small nested folder, independently
trusted anchor, authenticated required state/code, and a deterministic interpreter
of the selected revisions, Lens and complete scope. Attack a genuine header with
fake answers, coherent omission, stale heads and missing dependencies. A coherent
bundle may pass integrity while chain claims remain unverified; never relabel
transcript consistency as proof. If a proof backend is unavailable, retain an
explicitly narrower trusted-RPC semantic comparison and name the missing evidence.

Coordinate a private/locked subtree with Codex's real encrypted fixture when
available. Preserve locked/unsupported/missing/corrupt versus verified empty.
Keep the SPA static and direct-read capable, with no mandatory backend. Preserve
the everyday create/edit/rename/move/remove/restore/tag/Lens/export/upgrade loop.
Separate real-wallet testing from the EIP-1193 harness and report setup versus
routine prompts; do not use real funds or personal keys.

## Finish and report

After each checkpoint: test, independent review, repair, commit and push your
owned branch, then continue with the next tractable priority. Retain commands,
source/tool/fork pins and raw measurements. Don't sum nested test totals or call
separate branches integrated. End with what James can try, what became simpler,
before/after performance, exact limitations, and any genuine owner tradeoff.
No product-repo creation, public deployment, permanent IDs, main merge or freeze.
