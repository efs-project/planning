# Can live folder listings avoid lifetime-name scans?

September14. A small **algorithm model**, not a contract index, gas measurement,
production API, deletion of history or replacement of the frozen paid packet.

The current scope audit inventory retains every first-seen author/name key.
The Files churn test proves one live file can require four scans. Investigation
suggests this is a representation cost, not a necessary property of Lenses:
every selected live placement belongs to some author's live set; retained higher
heads, including masks, still decide whether each candidate is visible.

### Task 1: Independent replay versus live candidates

Own only new `lab-b/experiments/live-placement-model/` and the assigned report.
No changes to Core, Index, Lens, Files tests, paid evidence or production repos.
Use dependency-free Node and bounded deterministic inputs. Root executes tests;
worker writes source only. Stop after this model, not a new benchmark campaign.

Build an independent lifetime-event replay reference and a separately maintained
live candidate model. The reference never derives expected membership from the
candidate index. Tests pin full authored placement tuples, not File-only sets.
Use the three-author/six-name snapshot from the source review: H9 lifetime
memberships, L6 live memberships, U4 unique positions, S3 selected placements.
Expected winners are A:note→G, A:alias→G and C:later→H; B:brief→F is masked.
Preserve current author-priority/first-binding-ordinal order or explicitly test
set equivalence and count a separate sorting step. No free unbounded sort/union
may be hidden inside a bounded-page claim.

Required cases: live replacement, same-name reuse, move out/back, higher masks,
two churned names, multiple same-key effects in one publication, different names
for one File, selected-File/revision tags and a File HEAD whiteout. At each
snapshot compare the independently replayed result. Exhaust all27 absent/live/
masked assignments for one position across three authors. Also use one bounded
10,000-old-name churn fixture if it materially illustrates operation counts.

Distinguish two experiments if needed: a one-shot complete union (charge all
membership reads/materialization), and ordered per-author live enumeration
with higher-head masking (no global union needed, but duplicate candidates
still cost work). The latter may test paging at budgets0/1/2/full. Account for
coverage checks, candidate reads, head probes, deduplication and sorting/index
preparation separately; these operations are not equal units of gas.

All authors must have complete candidate coverage at one exact snapshot. A
missing later author is UNKNOWN, never complete-empty. Empty pre-exhaustion
pages remain PARTIAL. Bind continuation to scope, ordered Lens, basis,
generation and configuration. Actual mutation, move, reversed Lens or generation
change must reject a stale cursor. Historical queries are not promised by a
current live set.

Negative controls must catch ignored higher masks, omitted later-author
coverage, File-target deduplication, filtering lower tags before selection and
continuation through swap-delete with an old cursor. Faulty extra/missing index
membership must disagree with the independent replay; do not treat a claimed
coverage flag as mathematical proof that an arbitrary index is correct.

Use real TDD for the new model: compiling simple candidate stub plus explicit
expected assertions; root observes behavior RED before candidate implementation.
No import/syntax failure counts as RED. Keep expected fixtures unchanged for
GREEN, review independently, and retain compact deterministic outputs. A model
counterexample is useful; do not repair it by silently changing Lens semantics.

## What success would mean

Only that this current-query algorithm can preserve selection and completeness
while avoiding *some* lifetime-only scans. Its bound is all authors' live
placements, **not visible file count**: a heavily masked lower author may still
cost substantial work. Onchain membership updates, ordered traversal, storage,
callback budgets and total economics remain unimplemented/unpriced. Preserve
audit/history data. The model can motivate a later real index experiment, not
claim the existing prototype already has fast large directories.
