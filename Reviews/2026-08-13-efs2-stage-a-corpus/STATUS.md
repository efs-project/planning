# EFS 2.0 Stage A corpus — STATUS (read this first)

**Status:** reference — work-in-progress corpus, **NOT a completed Stage A deliverable**
**Audience:** the Codex PM first; Fable's successor session second
**Last touched:** 2026-08-13

#status/reference #kind/note #repo/planning #topic/efsv2

> **This corpus is preserved mid-flight.** The Stage A design and red-team
> rounds completed; the **repair round was cut off partway** when the session
> hit a spend limit. Six of eight repair agents died after applying an unknown
> fraction of their edits, and the residue-verification sweep never ran.
> **No file here is review-ready.** Nothing in this corpus was landed into the
> EFS 2.0 spine, and no shared design file was edited.

## What ran, in order

| Round | Result |
|---|---|
| Intake audit (6 lanes, read-only) | Complete — delivered to James/PM as the kickoff reply memo; evidence preserved in `corpus/` |
| Stage A design (14 lanes) | Complete — 8 B0 chapters + 3 assembly chapters + 4 corpus files |
| Synthesis: seam pins SR-1..SR-12 | Complete — `chapters/b0-overview.md` |
| Red team (7 adversarial lanes) | Complete — 8 BLOCKING, 27 SERIOUS, 21 NOTE; `corpus/redteam-findings.md` |
| Adjudication: pins revised to SR-1..SR-18 | Complete — `chapters/b0-overview.md` §2 (two pins repaired, five amended, six added) |
| **Repair round (8 agents + verifier)** | **INCOMPLETE — 2 of 8 agents finished; 6 died partway; verifier never ran** |

## Exact per-file state

**Do not read any chapter below as internally consistent until the repair round
is completed and the residue sweep passes.**

| File | Repair state |
|---|---|
| `chapters/b0-overview.md` | **Current.** Authority for the set: SR-1..SR-18 pins, post-adjudication. Chapters are repaired *to it*, not the reverse. |
| `chapters/b0-principal-authority.md` | **Repaired, agent completed** (SR-13/SR-14/SR-7). |
| `chapters/b0-content-locators.md` | **Repaired, agent completed** (scheme-gate relabel, SR-18a/18c, SR-5 re-derivation, CREATE2 note). |
| `chapters/b0-encoding-and-ids.md` | **Partially repaired** — agent killed mid-run; depth unknown. |
| `chapters/b0-authorship-envelope.md` | **Partially repaired** — agent killed mid-run; carries the SR-13/SR-10 BLOCKING repairs only in part. |
| `chapters/b0-realm-admission.md` | **Partially repaired** — agent killed mid-run. |
| `chapters/b0-indexes.md` | **Partially repaired** — agent killed mid-run; the THE-LINE `selectBestLocator` fix is not confirmed. |
| `chapters/b0-binding.md`, `chapters/b0-lens.md` | **Partially repaired** — shared agent killed mid-run. |
| `chapters/vectors-and-falsifiers.md` | **Partially repaired** — agent killed mid-run. |
| `chapters/bakeoff-spec.md`, `chapters/harness-and-fixtures.md`, `chapters/traceability.md` | **Unrepaired** — pre-red-team drafts. |
| `corpus/standards-audit.md`, `carry-in-register.md`, `intake-findings.md`, `proposed-spine-edits.md` | **Unrepaired** — pre-red-team drafts. Known corrections listed below. |
| `corpus/redteam-findings.md` | **Current** — transcribed mechanically from the red-team run. |

## Known-outstanding corrections (from the red team, not yet applied)

Carried here so they survive even if a chapter's half-applied edits are
discarded and the repair is re-run from the drafts:

1. **`traceability.md`** — row C-PS-8 is a false GAP (the client-edge hazard
   rule does exist in `b0-content-locators`); OR-F and C-HR-2/OR-17 citations
   point at the wrong sections; §8 counts need re-tallying after any edit.
2. **`intake-findings.md`** — IF-15's disposition is wrong (the 50/100/256
   lens-scale benchmark is *not* in the harness chapter; it must be added
   there first); IF-02 misroutes the callback-abuse attack to `b0-lens`
   (it lives in `vectors-and-falsifiers` CF-8 + AA-2); IF-21 (D-2/D-5
   disposition) still needs its answer recorded against the 2026-08-12 ruling.
3. **`harness-and-fixtures.md`** — S1–S8 need marking RESOLVED with their SR
   numbers; needs the 50/100/256 client-tier scale benchmark, a
   pre-withdrawal-evidence workload, and a spray-of-dead-postings adversarial
   workload.
4. **`bakeoff-spec.md`** — its cross-chapter conflict inventory is superseded
   by SR-1..SR-18; cell deltas referencing the `base + k` ordinal law need
   regenerating.
5. **`carry-in-register.md`** — DI-13's two client-conformance rules land in
   `b0-lens` once that repair completes.
6. **`proposed-spine-edits.md`** — count is 16 items (the overview said 14;
   the overview is now correct); A2's framing should match the single
   set-wide chains-don't-die disposition (overview §5.1).

## What Stage A does *not* contain, by design

No byte vectors, no measurements, no prototype code, no deployed contracts.
Every gas figure in every chapter is schedule-derived arithmetic labeled
`[HYPOTHESIS]`; the Stage B harness replaces them. V2-E6 and V2-E7 are out of
scope. Nothing here asks James for a protocol mechanism decision.

## To resume

1. Re-run the repair round from `chapters/b0-overview.md` SR-1..SR-18 against
   the eight chapter files + three assembly files + four corpus files, using
   `corpus/redteam-findings.md` as the finding list. Half-applied files are
   safe to repair forward (the pins are idempotent targets), but each must be
   swept for contradictions with its own earlier text.
2. Run the residue verification sweep (retired spellings; SR-13/SR-10/SR-8/
   SR-15/SR-18 uniformity; constant consistency; three spot-reads).
3. Then, and only then, produce the Stage A report for the PM.
