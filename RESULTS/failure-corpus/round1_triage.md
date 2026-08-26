# Round-1 differential mismatches — triage (preserved before any fix)

**DISPOSABLE.** 14 of 119 cases disagreed between the independent Python oracle
and the independent Solidity SUT on the first run. Preserved:
`round1_matrix.json`, `round1_mismatches.json`. Triage:

## Cluster A — all `*_SEMPIN` cases (10 of 14): ORACLE_BUG
`A_SEMPIN.{r_act_transfer,r_act_v11,r_act_overcap,r_act_wrongtarget}` and
`N_SEMPIN.{r_note_ok,r_note_reply,r_note11_mood,r_note11_nomood,r_reply_x,r_hostile_backlink}`.

Oracle rejected every PINNED_VIEW case; SUT accepted/effected the ones with a
genuinely pinned honest binding. Root cause: the oracle's `PINNED_BINDINGS` set
held binding *IDs* (hex) but the membership test compared the binding *name*
(`"a_v1"`), so `name not in {ids}` was always true → universal reject. The SUT
compared the actual 32-byte `bindingId` against the pinned-ID set (correct).

**Verdict: ORACLE_BUG.** The SUT is right: a deploy-pinned honest binding for
the exact presented Type is the safe accept path of PINNED_VIEW. Fix: compare
by binding name/id consistently in the oracle. This does not touch any attack
outcome (forge/twin/stolen cases were already handled by other branches).

## Cluster B — `N_PRED` on 5-field notes (4 of 14): GENUINE_FINDING → spec choice
`N_PRED.{r_note11_mood,r_note11_nomood,r_note12,r_reply_x}` (NOTE_1_1 / NOTE_1_2,
which carry a 5th field). Oracle ACCEPTED (it checked only `shape[:4]` and
ignored the extra field); SUT REJECTED (its frozen decoder sees a 5-field record
as trailing/extra and rejects).

Both are *defensible* readings of "a deploy-frozen straight-line predicate," and
that is exactly the point: **CONSUMER_PREDICATE's behavior on an
unforeseen-but-related record shape is implementation-defined, and two
reasonable generated implementations disagree on acceptance.** That is a
kill-criterion-adjacent property ("different generated implementations disagree
on exact acceptance").

**Verdict: GENUINE_FINDING.** Resolution for a single differential spec: a
frozen predicate pins its *exact* expected shape (fixed field count) and rejects
any record that does not match it byte-for-byte, including extra fields — the
SUT's safer semantics. The oracle is aligned to that. The finding is recorded:
a predicate that instead "ignores trailing fields" silently accepts future
extensions, so predicate acceptance is only well-defined once the exact-shape
(and therefore effectively the exact-Type) is pinned — which collapses
CONSUMER_PREDICATE into EXACT/FINITE_SET with a generated decoder.

No SUT change. Oracle fixed for both clusters; failing round-1 corpus retained.
