# Freeze-seam tournament — 3 builders vs 6 adversaries (2026-08-26 night 2)

**DISPOSABLE** · `protocolConformance=false` · `notAdopted=true` · `goCodeAuthorized=false`
Design-grade pure-Python evidence (single author, multi-agent adversarial), NOT
the two-implementation freeze-conformance standard. All IDs fixture-local;
production coordinates `BLOCKED_BY_CORE_INPUT`. Workflow `wf_3151a28d-4e2`:
9 agents, 3 build lanes × 2 independent adversaries each; every claim below is
backed by a script in this directory that was actually executed.

## One-screen outcome

| Seam (James's adjective) | Builder claim | Adversaries | Net verdict |
|---|---|---|---|
| Honest completeness / query (SOLID) | single-engine law held 5/5 attacks | **2× REFUTED — real break in cross-shard merge** | mechanism right, **composition law missing** |
| Self-chain lineage (UPGRADABLE) | Object/Occurrence anchoring 5/5 vs self-class 4/5 | 2× PARTIAL — recall right, **precision/direction wrong** | anchoring alone insufficient; needs the pair rule |
| Generic ANY link (HYPERSTRUCTURES) | verified/unverified split + bounds held 4 attacks | 2× PARTIAL — **UNVERIFIED unbounded; work≠nodes** | class is right; two bounds must move into the law |

No seam falsified the architecture. All five breaks are **law-completion
requirements** — things the freeze text must say that current prose does not.

## The five breaks (each observed, each with a scoped fix)

1. **Merged absence leak** (`verify_merge_absence_leak.py`, `verify_merge_basis_collision.py`):
   the builder's single engine never emits ABSENT off a non-COMPLETE grade, but
   `merge_results` emitted `PARTIAL/ABSENT` with `proves_absence()=True` on
   empty pages — the exact forbidden "empty PARTIAL read as absence," and it
   was order-dependent on identical inputs.
   **Law: a merged result may prove absence only if every input was COMPLETE
   on the same basis.**
2. **Domain-blind basis** (same scripts): two shards differing only in whether
   the query domain was closed collided on identical basis tuples
   (`gen=17, cmt=81bfec37…`), bypassing the mixed-basis refusal.
   **Law: the basis commitment must bind the declared Type set and the
   domain-closure flag** (a `domainCommitment` inside the postings basis).
3. **Lineage precision** (`verify_lineage_precision.py`): Object anchoring
   fixes seam *continuity* (5/5 recall) but resolves 30/30 ordered pairs —
   precision 0.167, time-reversed edges accepted — because everything under
   one Object becomes mutually "linked."
   **Law: a lineage link = stable Object anchor (continuity) + exact parent
   recordId (precision/direction). A pair, not a substitution.**
4. **UNVERIFIED flood** (`verify_unverified_unbounded.py`): 100,000 attacker
   UNVERIFIED links admitted against one victim; the BACKLINK_CAP=64 protected
   only the *verified* index.
   **Law: the UNVERIFIED escape hatch needs its own admission bound/pricing
   and a capped, evictable unverified fan-in index.**
5. **Work ≠ nodes** (`verify_traversal_work_and_fanout.py`): traversal
   reported `visited=1024 (MAX_NODES)` while actually performing 101,059
   operations with a 100,001-frame stack on one node of out-degree 100,001.
   **Law: traversal bounds must cap edges examined and stack depth, not
   visited nodes.**

## What held (also load-bearing)

- Empty PARTIAL page never proved absence in the single engine; a new
  implementing Type mid-backfill relabeled COMPLETE→PARTIAL via generation
  bump; in-prefix tombstoning flipped COMPLETE→UNKNOWN via commitment
  mismatch; 100% dead-posting dilution stayed bounded and honest;
  mixed-basis merge refused (when the bases actually differed).
- Self-class lineage breaks at the revision seam exactly as the 50-year sim
  predicted (4/5); both anchoring strategies restore continuity (5/5).
- **The prior lab's open falsifier is now closed executably**: no self-class
  forward successor rule can resolve old→new without a hash fixed point or
  ambient/latest acceptance — a 12-bit scale model found a partial cycle only
  after ~2^12 tries, making the full 256-bit fixed point infeasible. Anchoring
  is the only path, with one sharpened caveat from the verifier: anchoring
  widens the membership predicate but does not *authenticate* succession —
  the revision-succession authority rule (who may append, how the head is
  chosen) is the real remaining input, already `BLOCKED_BY_CORE_INPUT`.
- Dangling VERIFIED links denied at admission; cycles terminate; links never
  conferred authority in any lane (consistent with the consumer tournament).

## Verdicts in mission vocabulary

- Completeness single-engine law: SUPPORTED_FOR_NEXT_EXPERIMENT.
  Completeness composition (merge): **FALSIFIED as modeled** — fix is scoped
  (breaks 1–2), retest in the T4 Solidity SUT.
- Lineage upgradability via anchor+parent pair: SUPPORTED_FOR_NEXT_EXPERIMENT
  (the pair rule is the surviving design; anchor-only is FALSIFIED for
  precision).
- ANY link class: SUPPORTED_FOR_NEXT_EXPERIMENT with breaks 4–5 folded into
  the bound constants that were already `BLOCKED_BY_CORE_INPUT`.

## What this means for the 100-year freeze

The freeze text must contain, in normative language: the all-COMPLETE-same-
basis merge rule; the domain-commitment inside the basis; the lineage pair
rule; the unverified-link bound; and work-based traversal caps. None of these
existed in prose before tonight; all five came out of adversaries breaking
working code rather than reviewing documents. The recommended next experiment
is unchanged — the T4/G2 Solidity mutation+query state machine — now with
breaks 1–2 as its two named acceptance tests
(`testMergeRefusesAbsenceUnlessAllComplete`, `testBasisBindsDomainClosure`).
