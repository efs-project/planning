# Files first; diagnostics still inspectable

**Status:** next bounded presentation experiment, based on the read-only Data
Explorer review of `b623b42` recorded in
[consumer follow-ups](../2026-09-09-files-reader-scale/next-experiments.md).
No reader, cursor, traversal, budget, Core, content or write behavior changes.

Replace the mixed Folder positions list with primary current Files, a visible
Needs attention section, and a collapsed past/hidden-position disclosure.
Keep every actual returned result and its explanation. Zero current files is
not an empty-folder claim until terminal coverage without unresolved positions.
Progress reports checked positions separately from found files; no guessed
total. Keep the existing explicit source/observation and diagnostic evidence.

1. Test a pure presentation classifier/copy function with synthetic mixed
   4 FOUND + 60 ABSENT + 1 MASKED + 1 CONFLICT + 1 UNKNOWN, plus partial zero,
   terminal zero, unresolved terminal and stopped-prefix cases. These are UI
   fixtures only, not newly verified onchain workloads.
2. Use that presentation in the same live SPA. Only FOUND rows are primary
   Files; unknown outcomes go to neutral attention, never a file action target.
   Preserve all 67 synthetic positions across lanes. Keyboard continuation
   focuses a new usable File, otherwise status/continuation, not a diagnostic.
3. Strengthen the actual seven-observation browser regression to check lane
   counts and exact results; inspect masks/retractions through the disclosure;
   retain mobile/200% text/cancellation/failed-prefix checks. Capture fresh
   screenshots in a new exclusive evidence directory, not over old evidence.
4. Independent scoped review, then exact experiment-branch checkpoint.

Yield-oriented multi-page scans and the live 64/60 browser acceptance remain
follow-ups. Restructuring presentation does not fix slow discovery, enlarge
the verified workload or provide same-basis cross-scope continuation. No fake
open/edit/delete buttons or “normal browser ready” claim.
