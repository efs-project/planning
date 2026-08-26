#!/usr/bin/env python3
"""
ADVERSARY check against LANE SOLID's honest-completeness claim.

DISPOSABLE design-grade evidence (pure Python model), NOT the two-implementation
freeze-conformance standard. All IDs are fixture-local. No conformance / freeze /
adoption is claimed.

CLAIM UNDER ATTACK (builder's words):
  "proves_absence() is true ONLY when grade==COMPLETE ... never coerces
   partial/unknown/... into ... absent ... an empty PARTIAL page resolves to
   NOT_YET_KNOWN, never to absence."

The builder's 5 attacks pass, BUT they never exercise merge_results() through its
SINGLE-BASIS branch, and the basis()/keccak commitment OMIT domain_closed (and the
whole domain declaration). basis() = (generation, cursor, len(log), commitment);
close_domain() bumps neither generation nor the commitment. So two shards with
identical admission+backfill history but DIFFERING declaration-completeness
(one closed -> COMPLETE, one open -> UNKNOWN) collide on basis(). merge_results
then treats them as ONE basis, skips the REFUSED_MIXED_BASIS guard, and in its
single-basis branch propagates results[0].outcome when the merged page is empty --
manufacturing OUT_ABSENT with grade PARTIAL.

We import the builder's engine UNMODIFIED and drive it.
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import completeness_engine as CE  # unmodified builder artifact


def build_pair():
    """Two shards, byte-identical admission + full backfill, differing ONLY in
    whether close_domain() was called."""
    # X: domain CLOSED  -> COMPLETE
    engX, _ = CE.build_note_shard(supported_only=True, close=True)
    engX.step_backfill(len(engX.log))
    # Y: domain OPEN (not fully declared) -> UNKNOWN, but same gen/cursor/len/cmt
    engY, _ = CE.build_note_shard(supported_only=True, close=False)
    engY.step_backfill(len(engY.log))
    return engX, engY


def main():
    print("=" * 78)
    print("ADVERSARY: merge_results single-basis / domain-blind commitment attack")
    print("DISPOSABLE design-grade evidence (pure Python). NOT freeze-conformance.")
    print("=" * 78)

    engX, engY = build_pair()

    gX, whyX = engX._grade()
    gY, whyY = engY._grade()
    bX, bY = engX.basis(), engY.basis()

    print(f"\n[basis] shardX(closed) grade={gX} ({whyX})")
    print(f"        shardY(open)   grade={gY} ({whyY})")
    print(f"[basis] engX.basis() == engY.basis() ? {bX == bY}")
    print(f"        engX.basis()=(gen={bX[0]},cursor={bX[1]},len={bX[2]},cmt={bX[3][:12]})")
    print(f"        engY.basis()=(gen={bY[0]},cursor={bY[1]},len={bY[2]},cmt={bY[3][:12]})")

    # Query a key that has NO postings on either shard -> empty page on both.
    EMPTY_KEY = "note:NONEXISTENT_KEY"
    resX = engX.query(EMPTY_KEY)   # COMPLETE -> OUT_ABSENT
    resY = engY.query(EMPTY_KEY)   # UNKNOWN  -> OUT_NOT_YET_KNOWN
    print(f"\n[single-shard] shardX.query(empty) = {resX}")
    print(f"               proves_absence()={resX.proves_absence()}  outcome={resX.outcome}")
    print(f"[single-shard] shardY.query(empty) = {resY}")
    print(f"               proves_absence()={resY.proves_absence()}  outcome={resY.outcome}")

    # THE MERGE. Distinct bases should be 1 (collision) -> NOT refused.
    merged_XY = CE.merge_results([resX, resY])   # r0 = COMPLETE/ABSENT shard
    merged_YX = CE.merge_results([resY, resX])   # r0 = UNKNOWN/NOT_YET_KNOWN shard

    print(f"\n[merge XY] {merged_XY}")
    print(f"           distinct_bases={len(merged_XY.bases)} grade={merged_XY.grade} "
          f"outcome={merged_XY.outcome} proves_absence()={merged_XY.proves_absence()}")
    print(f"           note: {merged_XY.note}")
    print(f"[merge YX] {merged_YX}")
    print(f"           distinct_bases={len(merged_YX.bases)} grade={merged_YX.grade} "
          f"outcome={merged_YX.outcome} proves_absence()={merged_YX.proves_absence()}")

    # ---- verdict logic ------------------------------------------------------
    basis_collides = (bX == bY)
    # The builder's explicit invariant: proves_absence() => grade == COMPLETE.
    # Break it if any merged result proves absence while grade != COMPLETE.
    broke_invariant = (
        merged_XY.proves_absence() and merged_XY.grade != CE.COMPLETE
    )
    # Kill criterion: an empty (live=0) result read as absence while grade==PARTIAL.
    empty_partial_reads_absence = (
        len(merged_XY.live_ids) == 0
        and merged_XY.grade == CE.PARTIAL
        and merged_XY.proves_absence()
    )
    # Order-dependence: same two inputs, opposite absence verdicts.
    order_dependent = (merged_XY.proves_absence() != merged_YX.proves_absence())

    print("\n" + "=" * 78)
    print(f"basis_collision (domain_closed omitted from commitment): {basis_collides}")
    print(f"merge NOT refused despite one shard non-COMPLETE:        {len(merged_XY.bases) == 1}")
    print(f"proves_absence()==True while grade != COMPLETE:          {broke_invariant}")
    print(f"empty + grade==PARTIAL + proves_absence():               {empty_partial_reads_absence}")
    print(f"order-dependent absence verdict (XY vs YX):              {order_dependent}")

    broke_it = broke_invariant and empty_partial_reads_absence and basis_collides
    print(f"\nADVERSARY VERDICT: {'FALSIFIED (claim broken)' if broke_it else 'claim held'}")
    print("=" * 78)
    return 0 if broke_it else 2


if __name__ == "__main__":
    sys.exit(main())
