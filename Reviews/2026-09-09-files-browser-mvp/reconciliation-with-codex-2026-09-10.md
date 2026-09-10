# Reconciliation with the PM's 2026-09-10 reply, and the prototype round

**Status:** working note on the files-browser branch; not a ruling. Written
2026-09-10 (evening) by the integration-test-lead after James relayed Codex's
reply (`planning-mvp-c0/Reviews/2026-09-10-foundation-reply-after-economics.md`,
`832c7ae` on `codex/mvp-c0-coherence`) and the follow-up discussion on tag
subjects. Read-only access to that worktree; nothing there was edited.

## 1. Accepted, and where each correction landed

| Codex's point | Disposition | Where |
| --- | --- | --- |
| Tag table mixes runs (components sum 3,028,451 vs headline 2,838,264); 94 touched slots ≠ 94 fresh; ~133 slots was inferred, not measured | Accepted. The decomposition was of the first-tag run (3,046,997). A reconciled, retained-trace baseline with a fresh/rewrite census per Kind is being produced now | gas-engineering §2 correction; `gas-baseline-2026-09-10.md` (in progress) |
| Comparison boundaries (MUD excludes intrinsic; EthFS 5,186 is not a receipt) | Accepted; labels changed to QUOTED with the boundary named | gas-engineering §5 row 8 |
| 2-leaf vs 4-leaf does not prove batching saves only intrinsic | Accepted; reworded; same-final-state N-vs-1 comparison is Codex's storage lane | gas-engineering §2 |
| "Reads unchanged" under 8038 is SLOAD only; cold account and EXTCODECOPY change | Accepted | indexing-and-state §0 |
| Tags describe a File, bitmap describes a position; A→B replacement; unbounded clear; lens masking | **Accepted — the largest hole.** Position bits demoted to a positive accelerator with per-hit verification; truth is the target-keyed `TagSet` plus a membership join; NOT over third-party tags is O(n) or lens-materialised | tag-system §5b |
| Three tag subjects (revision / file / location) | Accepted from the owner's own examples; `TagSet` gains a subject kind; "a tag follows its declared subject" | tag-system §5b |
| D-D must reconcile 2026-08-12 (Type creators already choose index modes) | Accepted; D-D narrowed to later attachment, coverage, authority/cost, retirement | index-layer §11a |
| ROSTER not now-or-never (global rebuild possible if a hook can be installed) | Accepted; §11 row withdrawn as worded | index-layer §11a |
| Three ordinal domains; K10 changes readers; reverse locator missing; Type attach is not a free cache write; universe per family; cursor needs a block basis; 512 not guaranteed; sorted-run snapshot flaw; u48 five per word | Accepted, each | index-layer §11a |
| byteCommitment: a future content branch that forgets to set it accepts a zero commitment | Accepted; add a per-op classification test matrix (content vs non-content, zero commitment, EDIT substitution, mismatched trees) | prototype list below |
| Keep the mandatory-indexing control; D-D/K10/ROSTER/D-9 are comparisons, not adopted | Already the recorded status (leaning / pending); agreed | owner-rulings 2026-09-10 |

Nothing in Codex's reply is disputed. One nuance kept: hook-first backfill
and the reverting strict read are the comparison's *hypothesis*, and Codex's
item 5 ("a set bit may prove a positive before backfill only if all
dependencies maintain it") is the more precise statement of it.

## 2. The split (Codex's, accepted)

- **Fable** — reconcile measurements (one retained-trace baseline; running);
  the actual reader/consumer reshape (checkpoint 1 of the unused prompt);
  one generic `FIELD_EQ` family with hook/backfill/probe/page against a
  pinned K10 and unchanged controls, then `TagSet` with the joins; the
  adversarial cases below; integration owner.
- **Codex** — K10 with its readers (writer and checked readers together,
  versioned raw/hydrated outputs, fresh isolated genesis, reverse locator
  priced separately); physical storage comparisons (row packing / Store-style
  encoding, shared immutable contexts, code-backed bodies and chunks, chunk
  salt + pointer) preserving canonical bytes and future generic reads.
- **Joint** — one source-pinned Files → SDK → Core trace proving writes,
  reads, Lens masks, tags, partial results and reconstruction still agree;
  then acceptance / evolution / continuity on the reviewed runtime.
- Rules unchanged: separate worktrees, exact-commit patches with source
  hashes and tests, no runtime consumption of another worker's changing
  directory, no main merge, no public deployment, no real funds, no protocol
  freeze.

## 3. Prototype test matrix (Fable's lane)

1. **Baseline** (running): receipt = components; fresh / cold-rewrite / warm /
   clear / restore per Kind; steady-state vs first-in-scope; retained traces
   and harness; determinism across two runs.
2. **Generic family** (`FIELD_EQ` on media type): attach after data exists;
   delayed first backfill; writes before / during / after chunks; rebind
   during build; high-cardinality and hot values; partial positives vs
   covered negatives; detach and re-attach; stale cursor with a block basis;
   with and without K10 at 10,000 entries; both gas schedules (the future
   one as a pinned estimate, never as today's fork).
3. **Tag joins**: 1,000 attesters tag File A at position i; placer rebinds i
   to B — B inherits nothing; repeat for second placement, move, remove and
   restore, tag withdrawal; the lens-masking pair (whiteout above a tagged
   file; untagged higher-priority file above a tagged one); the three tag
   subjects (edit / rename-move / replace / location); price each arm:
   target-keyed join vs positional accelerator with per-hit verification.
4. **Tag details**: canonicalisation golden vectors; shard uniqueness; DENY vs
   withdrawal lifecycle; implication withdrawal with OR-only materialisation.
5. **byteCommitment matrix**: every supported op kind classified content /
   non-content; zero commitment on a content op refused; nonzero on a
   non-content op refused; EDIT substitution; mismatched trees.
6. **Reader reshape** (checkpoint 1): state-specific collections in the real
   reader and consumers, type-checked, with runtime/serialisation adversaries.

D-D returns to the owner *with* these measurements and a capability map,
as Codex asked, rather than as a questionnaire.
