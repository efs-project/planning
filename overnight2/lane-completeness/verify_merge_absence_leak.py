#!/usr/bin/env python3
"""
ADVERSARY probe against LANE SOLID's completeness_engine.py.

DISPOSABLE design-grade evidence (pure Python model). NOT the two-implementation
freeze-conformance standard. All IDs are fixture-local. No conformance /
freeze-readiness / adoption is claimed.

CLAIM UNDER ATTACK (verbatim from builder):
  "The engine never asserts ABSENCE ... never coerces partial/unknown/unsupported
   into invalid/absent/empty/success ... proves_absence() is true ONLY when
   grade==COMPLETE."

I attack the actual artifact's own surface (import its CoverageEngine +
merge_results, do NOT reimplement it). Two attacks the builder's five under-tested:

  A) MERGE-LEAK: merge_results()'s single-basis path computes `grade` and
     `outcome` from DIFFERENT sources. `basis()` omits `domain_closed` (and grade),
     so a COMPLETE/ABSENT shard and a same-basis UNKNOWN shard land in the
     "single basis" branch. Result: outcome=OUT_ABSENT rides on grade=PARTIAL,
     so proves_absence()==True while grade!=COMPLETE. If this fires, the stated
     invariant is FALSE and absence leaks off a non-COMPLETE, partially-declared
     domain.

  B) NON-INJECTIVE COMMITMENT: canon_commitment flattens (key,record_id) pairs
     with ':' and '|' delimiters and no escaping. Two DIFFERENT live posting sets
     can produce the SAME commitment -> the "exact single verified basis" is not
     injective, so cursor_valid() cannot be a sound verifier in general.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from completeness_engine import (  # the artifact under attack
    CoverageEngine, merge_results, build_note_shard,
    canon_commitment,
    COMPLETE, PARTIAL, UNKNOWN,
    OUT_ABSENT, OUT_NOT_YET_KNOWN,
)


def hr(s=""):
    print(s)


def attack_merge_leak():
    hr("=" * 74)
    hr("ATTACK A - MERGE-LEAK: proves_absence() True while grade != COMPLETE")
    hr("=" * 74)

    # Shard A: identical admissions, domain CLOSED -> COMPLETE
    engA, admittedA = build_note_shard(close=True)
    engA.step_backfill(len(engA.log))
    gA, whyA = engA._grade()

    # Shard B: EXACT same declare/admit/backfill sequence, domain NOT closed.
    # close_domain() does not bump generation, so A and B share an identical
    # basis() tuple (generation, cursor, len, built_commitment) -- domain_closed
    # is NOT part of basis(). B grades UNKNOWN purely on the open-domain flag.
    engB, admittedB = build_note_shard(close=False)
    engB.step_backfill(len(engB.log))
    gB, whyB = engB._grade()

    hr(f"  shardA: grade={gA} ({whyA})  basis={engA.basis()[:3]} cmt={engA.basis()[3][:12]}")
    hr(f"  shardB: grade={gB} ({whyB})  basis={engB.basis()[:3]} cmt={engB.basis()[3][:12]}")
    hr(f"  basis(A) == basis(B) ? {engA.basis() == engB.basis()}")

    # Query a key with NO live postings -> A gives provable ABSENCE, B gives
    # NOT_YET_KNOWN (honest, because B's domain is not fully declared).
    EMPTY_KEY = "note:NOTE_DOES_NOT_EXIST"
    resA = engA.query(EMPTY_KEY)
    resB = engB.query(EMPTY_KEY)
    hr(f"  resA = {resA}   proves_absence={resA.proves_absence()}")
    hr(f"  resB = {resB}   proves_absence={resB.proves_absence()}")
    assert gA == COMPLETE and resA.outcome == OUT_ABSENT, "precondition A"
    assert gB == UNKNOWN and resB.outcome == OUT_NOT_YET_KNOWN, "precondition B"

    # The engine's OWN merge, absent shard FIRST (results[0] drives outcome).
    merged = merge_results([resA, resB])
    hr(f"  merge_results([A_absent, B_unknown]) = {merged}")
    hr(f"    merged.grade          = {merged.grade}")
    hr(f"    merged.outcome        = {merged.outcome}")
    hr(f"    merged.proves_absence = {merged.proves_absence()}")
    hr(f"    distinct bases        = {len(merged.bases)}  (single-basis path taken)")

    leaked = (merged.proves_absence() is True and merged.grade != COMPLETE)

    # Control: swap order -> results[0] is the UNKNOWN shard -> no absence leaks.
    merged_swap = merge_results([resB, resA])
    hr(f"  control merge([B_unknown, A_absent]) = {merged_swap}  "
       f"proves_absence={merged_swap.proves_absence()}")

    hr("")
    hr(f"  >>> FALSIFIER: merged.proves_absence()={merged.proves_absence()} "
       f"with grade={merged.grade} (claim requires grade==COMPLETE) <<<")
    hr(f"  >>> ordering-dependent: swapped merge proves_absence="
       f"{merged_swap.proves_absence()} (same two shards) <<<")
    hr(f"  ATTACK A verdict: {'BROKE THE CLAIM' if leaked else 'claim held'}")
    return leaked


def attack_noninjective_commitment():
    hr("")
    hr("=" * 74)
    hr("ATTACK B - canon_commitment is NOT injective (basis not 'exact')")
    hr("=" * 74)
    # Same generation/cursor header on both sides; only the pair-set differs.
    gen, lo, hi = 17, 0, 14
    # Set 1: one posting whose record_id embeds the delimiters.
    set1 = [("note", "A|note:B")]
    # Set 2: two DIFFERENT postings; different membership, same flat bytes.
    set2 = [("note", "A"), ("note", "B")]
    c1 = canon_commitment(set1, gen, lo, hi)
    c2 = canon_commitment(set2, gen, lo, hi)
    hr(f"  set1={set1} -> {c1[:20]}")
    hr(f"  set2={set2} -> {c2[:20]}")
    collision = (c1 == c2 and set1 != set2)
    hr(f"  DIFFERENT posting sets, EQUAL commitment ? {collision}")
    hr(f"  ATTACK B verdict: {'commitment non-injective (basis not exact)' if collision else 'no collision'}")
    return collision


def main():
    hr("ADVERSARY probe vs lane-completeness/completeness_engine.py")
    hr("DISPOSABLE design-grade evidence (pure Python). NOT freeze-conformance.")
    a = attack_merge_leak()
    b = attack_noninjective_commitment()
    hr("")
    hr("=" * 74)
    hr(f"  ATTACK A (merge absence leak)      : {'BROKE' if a else 'held'}")
    hr(f"  ATTACK B (non-injective commitment): {'BROKE' if b else 'held'}")
    hr(f"  OVERALL: claim {'FALSIFIED' if (a or b) else 'survived my attacks'}")
    hr("=" * 74)
    return 0 if (a or b) else 1


if __name__ == "__main__":
    sys.exit(main())
