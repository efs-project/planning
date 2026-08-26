#!/usr/bin/env python3
"""
LANE SOLID - honest completeness / query state machine.

DISPOSABLE design-grade evidence (pure Python model), NOT the two-implementation
freeze-conformance standard. All IDs are fixture-local. This artifact makes NO
claim of protocol conformance, freeze-readiness, or adoption. It models the
honest-completeness SEAM and attacks the KILL CRITERION:

    A query that reports ABSENCE or CURRENCY without a fully-declared domain and
    an exact basis, OR that converts unavailable / unsupported / partial / unknown
    into invalid / absent / empty / success. An empty PARTIAL page must NEVER be
    read as absence.

We build a pure-Python QueryProfile coverage engine over admitted records drawn
from fixtures/corpus.json (real EFS2 Types + typeIds + recordIds), with a backfill
cursor, a coverage high-water mark, a generation counter, and a keccak postings
commitment. Then we run five falsification attacks and record pass/fail for each.

The honest engine's contract (the thing under test):
  * grade in {COMPLETE, PARTIAL, UNKNOWN}, plus a machine "outcome" that a consumer
    may safely read.
  * COMPLETE requires ALL of: domain fully declared (closed), cursor == len(log)
    (backfill finished), the built-prefix commitment still matches the live prefix
    (cursor not invalidated), basis_generation == generation (no newer in-scope
    admission), and a SINGLE state basis.
  * ABSENCE may be asserted ONLY under COMPLETE. Under PARTIAL/UNKNOWN an empty page
    is "not-yet-known", never absent.
  * UNSUPPORTED (unknown codec / undeclared domain) never collapses to absent/empty.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from keccak import keccak256  # local read-only copy of the fixture

CORPUS_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "fixtures", "corpus.json",
)

# ------------------------------------------------------------------ corpus load
with open(CORPUS_PATH) as fh:
    CORPUS = json.load(fh)

TYPES = CORPUS["types"]
RECORDS = CORPUS["records"]

# real typeId per type-name, harvested from admitted records
TYPEID = {}
for _rname, _rv in RECORDS.items():
    if "type" in _rv and "typeId" in _rv:
        TYPEID.setdefault(_rv["type"], _rv["typeId"])

# Note family "implements" the same query semantic (note/1.x readable body).
# NOTE_FUTURE_CODEC is in-family-by-meaning but UNSUPPORTED (unknown codec).
NOTE_FAMILY_SUPPORTED = ["NOTE_1_0", "NOTE_1_1", "NOTE_1_2"]
NOTE_FAMILY_UNSUPPORTED = ["NOTE_FUTURE_CODEC"]


def canon_commitment(pairs, generation, cursor_lo, cursor_hi):
    """Deterministic keccak commitment over a live postings prefix + basis coords.
    pairs: iterable of (key, recordId) for LIVE indexed records only."""
    body = b"|".join(
        (f"{k}:{r}".encode()) for (k, r) in sorted(pairs)
    )
    header = f"gen={generation};lo={cursor_lo};hi={cursor_hi};".encode()
    return keccak256(header + b"##" + body).hex()


# ------------------------------------------------------------------ the engine
class Posting:
    __slots__ = ("seq", "record_id", "type_id", "key", "tombstoned")

    def __init__(self, seq, record_id, type_id, key):
        self.seq = seq
        self.record_id = record_id
        self.type_id = type_id
        self.key = key          # query key this record posts under
        self.tombstoned = False


UNKNOWN = "UNKNOWN"
PARTIAL = "PARTIAL"
COMPLETE = "COMPLETE"

# consumer-safe machine outcomes
OUT_LIVE = "LIVE_HITS"                 # returned live records (may be COMPLETE/PARTIAL)
OUT_ABSENT = "ABSENT"                  # provable absence (COMPLETE only)
OUT_NOT_YET_KNOWN = "NOT_YET_KNOWN"    # empty page but not complete -> NOT absence
OUT_UNSUPPORTED = "UNSUPPORTED"        # unknown codec / undeclared domain
OUT_REFUSED = "REFUSED_MIXED_BASIS"    # cannot merge two bases into one answer


class QueryResult:
    def __init__(self, grade, outcome, interval, generation, bases,
                 commitment, live_ids, note=""):
        self.grade = grade
        self.outcome = outcome
        self.interval = interval          # (lo, hi, total)  indexed-live coverage
        self.generation = generation
        self.bases = bases                # list of basis tuples (>1 => mixed)
        self.commitment = commitment
        self.live_ids = live_ids
        self.note = note

    # THE consumer-facing safety gate. A well-behaved reader calls this.
    def proves_absence(self):
        return self.outcome == OUT_ABSENT

    # what a NAIVE/dishonest reader does: "page empty => nothing there".
    def naive_reads_absence(self):
        return len(self.live_ids) == 0 and self.outcome != OUT_REFUSED

    def __repr__(self):
        lo, hi, tot = self.interval
        return (f"<{self.grade}/{self.outcome} cov=[{lo},{hi})/{tot} "
                f"gen={self.generation} bases={len(self.bases)} "
                f"live={len(self.live_ids)} cmt={self.commitment[:12]}>")


class CoverageEngine:
    """One shard. Append-only admission log + backfill cursor + hwm + generation."""

    def __init__(self, profile_domain_closed=True):
        self.log = []                      # list[Posting], admission order
        self.domain_types = {}             # type_id -> generation-admitted
        self.domain_closed = profile_domain_closed  # is the domain fully declared?
        self.unsupported_types = set()     # type_ids present-but-uninterpretable
        self.generation = 0
        self.cursor = 0                    # backfill high-water (log prefix indexed)
        self.postings = {}                 # key -> list[Posting]  (indexed prefix)
        self.built_commitment = canon_commitment([], 0, 0, 0)
        self.built_gen = 0                 # generation at which prefix was built

    # ---- domain declaration -------------------------------------------------
    def declare_type(self, type_id, supported=True):
        self.generation += 1
        self.domain_types[type_id] = self.generation
        if not supported:
            self.unsupported_types.add(type_id)

    def close_domain(self):
        self.domain_closed = True

    def open_domain(self):
        self.domain_closed = False

    # ---- admission ----------------------------------------------------------
    def admit(self, record_id, type_id, key):
        self.generation += 1
        self.log.append(Posting(len(self.log), record_id, type_id, key))

    def tombstone(self, record_id):
        """Mutate a record's liveness. If it lies inside the indexed prefix,
        this changes the posting set UNDER the cursor."""
        self.generation += 1
        for p in self.log:
            if p.record_id == record_id:
                p.tombstoned = True
                return True
        return False

    # ---- backfill -----------------------------------------------------------
    def step_backfill(self, n=1):
        """Advance the cursor over n admitted records, indexing LIVE ones."""
        end = min(self.cursor + n, len(self.log))
        for i in range(self.cursor, end):
            p = self.log[i]
            if not p.tombstoned:
                self.postings.setdefault(p.key, []).append(p)
        self.cursor = end
        self._recommit()

    def _live_prefix_pairs(self):
        pairs = []
        for i in range(self.cursor):
            p = self.log[i]
            if not p.tombstoned:
                pairs.append((p.key, p.record_id))
        return pairs

    def _recommit(self):
        self.built_commitment = canon_commitment(
            self._live_prefix_pairs(), self.generation, 0, self.cursor
        )
        self.built_gen = self.generation

    # ---- verification: has the indexed prefix mutated under us? -------------
    def cursor_valid(self):
        live_now = canon_commitment(
            self._live_prefix_pairs(), self.built_gen, 0, self.cursor
        )
        return live_now == self.built_commitment

    # ---- grade --------------------------------------------------------------
    def _grade(self):
        if not self.domain_closed:
            return UNKNOWN, "domain not fully declared"
        if not self.cursor_valid():
            return UNKNOWN, "indexed prefix mutated under cursor (cursor invalid)"
        if self.cursor < len(self.log):
            return PARTIAL, "backfill in progress"
        # cursor == len(log): finished. But did an in-scope admission arrive
        # after the prefix was built?
        if self.built_gen != self.generation:
            return PARTIAL, "generation advanced after build (newer in-scope data)"
        return COMPLETE, "backfill finished, prefix verified, generation stable"

    def basis(self):
        return (self.generation, self.cursor, len(self.log), self.built_commitment)

    # ---- query --------------------------------------------------------------
    def query(self, key, key_type_id=None):
        grade, why = self._grade()

        # UNSUPPORTED short-circuit: the query targets a declared-but-unsupported
        # codec. Never collapse to absent/empty.
        if key_type_id is not None and key_type_id in self.unsupported_types:
            return QueryResult(
                grade if grade != COMPLETE else UNKNOWN, OUT_UNSUPPORTED,
                (0, self.cursor, len(self.log)), self.generation,
                [self.basis()], self.built_commitment, [],
                note=f"type_id {key_type_id[:8]} unsupported codec; {why}",
            )

        # gather LIVE hits from the indexed prefix, bounded point read
        live_ids, iters, dead_seen = self._point_read(key)

        interval = (0, self.cursor, len(self.log))
        if live_ids:
            return QueryResult(grade, OUT_LIVE, interval, self.generation,
                               [self.basis()], self.built_commitment, live_ids,
                               note=f"{why}; scanned {iters} postings "
                                    f"({dead_seen} tombstoned)")

        # empty page. The crux of the kill criterion.
        if grade == COMPLETE:
            # honest absence, but tagged with the tombstone basis it rests on
            note = (f"provable absence at gen={self.generation}; "
                    f"scanned {iters} postings, {dead_seen} tombstoned")
            return QueryResult(COMPLETE, OUT_ABSENT, interval, self.generation,
                               [self.basis()], self.built_commitment, [], note=note)
        # PARTIAL / UNKNOWN empty page -> NOT absence
        return QueryResult(grade, OUT_NOT_YET_KNOWN, interval, self.generation,
                           [self.basis()], self.built_commitment, [],
                           note=f"empty page but {why}; NOT absence")

    def _point_read(self, key):
        """Bounded scan of the posting list for `key`. Returns (live_ids, iters,
        dead_seen). Terminates in len(posting_list) steps regardless of tombstone
        density."""
        plist = self.postings.get(key, [])
        live_ids, iters, dead = [], 0, 0
        for p in plist:
            iters += 1
            if p.tombstoned:
                dead += 1
                continue
            live_ids.append(p.record_id)
        return live_ids, iters, dead


def merge_results(results):
    """Attack-5 merge: combine per-shard results. MUST refuse to synthesize one
    COMPLETE across distinct bases."""
    bases = []
    for r in results:
        bases.extend(r.bases)
    distinct = set(bases)
    all_ids = [i for r in results for i in r.live_ids]
    if len(distinct) > 1:
        # different state bases -> cannot be one COMPLETE answer
        return QueryResult(
            PARTIAL, OUT_REFUSED, (0, 0, 0),
            max(r.generation for r in results),
            list(distinct), "<multiple>", all_ids,
            note=f"refused: {len(distinct)} distinct bases cannot merge to COMPLETE",
        )
    # single basis -> may keep the (already computed) worst grade
    grade = COMPLETE if all(r.grade == COMPLETE for r in results) else PARTIAL
    r0 = results[0]
    return QueryResult(grade, OUT_LIVE if all_ids else r0.outcome,
                       r0.interval, r0.generation, list(distinct),
                       r0.commitment, all_ids, note="single basis merge")


# ================================================================== ATTACKS
def line(s=""):
    print(s)


def build_note_shard(supported_only=True, close=True):
    """Admit the Note family + records, leave backfill NOT started."""
    eng = CoverageEngine(profile_domain_closed=False)
    for tname in NOTE_FAMILY_SUPPORTED:
        eng.declare_type(TYPEID[tname], supported=True)
    if not supported_only:
        for tname in NOTE_FAMILY_UNSUPPORTED:
            eng.declare_type(TYPEID[tname], supported=False)
    # admit real corpus note records
    admitted = []
    for rname, rv in RECORDS.items():
        if rv.get("type") in NOTE_FAMILY_SUPPORTED:
            # key = author field is opaque; use a stable synthetic key per type
            eng.admit(rv["recordId"], rv["typeId"], key=f"note:{rv['type']}")
            admitted.append(rname)
    if close:
        eng.close_domain()
    return eng, admitted


def attack1():
    line("ATTACK 1 - empty PARTIAL page must not prove absence")
    eng, admitted = build_note_shard()
    total = len(eng.log)
    eng.step_backfill(1)  # index only 1 of many
    # query a key that has NO live posting in the tiny indexed prefix
    res = eng.query("note:NOTE_1_2")  # NOTE_1_2 record is later in the log
    line(f"  admitted={total} indexed={eng.cursor} result={res}")
    line(f"  note: {res.note}")
    honest_absence = res.proves_absence()
    naive_absence = res.naive_reads_absence()
    line(f"  engine.proves_absence()={honest_absence}  "
         f"naive 'empty=>absent'={naive_absence}")
    # PASS iff honest engine refuses absence AND labels PARTIAL/NOT_YET_KNOWN,
    # while the naive reading WOULD have wrongly concluded absence (attack has teeth)
    ok = (res.grade == PARTIAL and res.outcome == OUT_NOT_YET_KNOWN
          and not honest_absence and naive_absence)
    line(f"  => {'PASS' if ok else 'FAIL'} "
         f"(honest refuses absence; naive reader would have lied)")
    return ok, res


def attack2():
    line("ATTACK 2 - new implementing Type admitted mid-backfill excluded from "
         "COMPLETE on older generation")
    eng, admitted = build_note_shard()
    # finish backfill fully -> would be COMPLETE at gen G
    eng.step_backfill(len(eng.log))
    g0 = eng.generation
    grade0, why0 = eng._grade()
    line(f"  after full backfill: grade={grade0} gen={g0} ({why0})")
    assert grade0 == COMPLETE, "precondition: should be COMPLETE before injection"
    complete_cmt = eng.built_commitment
    # now a NEW implementing Type + record arrives mid-life (generation bumps)
    eng.declare_type("aa" * 32, supported=True)          # new NOTE_1_2-like type
    eng.admit("f00d" * 16, "aa" * 32, key="note:NOTE_1_2")
    g1 = eng.generation
    # a consumer holding the old COMPLETE basis re-queries
    res = eng.query("note:NOTE_1_2")
    grade1, why1 = eng._grade()
    line(f"  after new-type admission: gen {g0}->{g1} grade={grade1} ({why1})")
    line(f"  re-query result={res}")
    line(f"  old COMPLETE commitment {complete_cmt[:16]} "
         f"now cursor<log? {eng.cursor < len(eng.log)}")
    # PASS iff coverage relabeled off COMPLETE and the new record is NOT inside a
    # COMPLETE claim on the old generation
    ok = (grade1 != COMPLETE and res.grade != COMPLETE
          and not res.proves_absence() and g1 > g0)
    line(f"  => {'PASS' if ok else 'FAIL'} "
         f"(COMPLETE@gen{g0} invalidated; new type excluded from stale COMPLETE)")
    return ok, res


def attack3():
    line("ATTACK 3 - cursor invalidation when the posting set changes under it")
    eng, admitted = build_note_shard()
    eng.step_backfill(len(eng.log))
    assert eng._grade()[0] == COMPLETE
    cmt_before = eng.built_commitment
    valid_before = eng.cursor_valid()
    # mutate a record that lies INSIDE the already-indexed prefix
    victim = eng.log[0].record_id
    eng.tombstone(victim)
    valid_after = eng.cursor_valid()
    grade, why = eng._grade()
    res = eng.query(eng.log[0].key)
    line(f"  indexed prefix commitment before={cmt_before[:16]} valid={valid_before}")
    line(f"  tombstoned in-prefix record {victim[:12]}")
    line(f"  cursor_valid now={valid_after} grade={grade} ({why})")
    line(f"  re-query result={res}")
    # PASS iff the cursor is detected invalid and grade drops to UNKNOWN, and no
    # COMPLETE/absence is emitted over the mutated prefix
    ok = (valid_before and not valid_after and grade == UNKNOWN
          and res.grade == UNKNOWN and not res.proves_absence())
    line(f"  => {'PASS' if ok else 'FAIL'} "
         f"(prefix mutation detected via commitment mismatch; cursor invalidated)")
    return ok, res


def attack4():
    line("ATTACK 4 - dead-posting dilution (99-100% tombstoned); point read must "
         "terminate and report honestly")
    eng = CoverageEngine(profile_domain_closed=True)
    tid = TYPEID["NOTE_1_0"]
    eng.declare_type(tid, supported=True)
    N = 10000
    # key ALL_DEAD: 10000 postings, 100% tombstoned
    for i in range(N):
        rid = keccak256(f"dead-{i}".encode()).hex()
        eng.admit(rid, tid, key="ALL_DEAD")
    # key ONE_LIVE: 9999 tombstoned + 1 live needle
    live_needle = keccak256(b"needle").hex()
    for i in range(N - 1):
        eng.admit(keccak256(f"chaff-{i}".encode()).hex(), tid, key="ONE_LIVE")
    eng.admit(live_needle, tid, key="ONE_LIVE")
    eng.step_backfill(len(eng.log))
    # tombstone everything under ALL_DEAD, and all chaff under ONE_LIVE
    for p in eng.log:
        if p.key == "ALL_DEAD":
            p.tombstoned = True
        elif p.key == "ONE_LIVE" and p.record_id != live_needle:
            p.tombstoned = True
    eng._recommit()  # honest engine re-indexes after mutation (fresh basis)

    dead_ids, dead_iters, dead_dead = eng._point_read("ALL_DEAD")
    live_ids, live_iters, live_dead = eng._point_read("ONE_LIVE")
    res_dead = eng.query("ALL_DEAD")
    res_live = eng.query("ONE_LIVE")
    density_dead = dead_dead / max(dead_iters, 1) * 100
    density_live = live_dead / max(live_iters, 1) * 100
    line(f"  ALL_DEAD: iters={dead_iters} tombstoned={dead_dead} "
         f"({density_dead:.1f}%) live={len(dead_ids)} result={res_dead}")
    line(f"  ONE_LIVE: iters={live_iters} tombstoned={live_dead} "
         f"({density_live:.2f}%) live={len(live_ids)} needle_found="
         f"{live_needle in live_ids}")
    line(f"  ALL_DEAD note: {res_dead.note}")
    # PASS iff: bounded termination (iters == posting-list length, finite),
    # ALL_DEAD reports honest COMPLETE-absence (not 'never existed' silently -
    # the note carries the tombstone basis), and the live needle is still found
    # among 99.99% dead.
    ok = (dead_iters == N and density_dead == 100.0
          and res_dead.outcome == OUT_ABSENT
          and "tombstoned" in res_dead.note
          and live_needle in live_ids and len(live_ids) == 1
          and live_iters == N)
    line(f"  => {'PASS' if ok else 'FAIL'} "
         f"(point read O(list) bounded; live needle survives dilution; "
         f"absence carries tombstone basis)")
    return ok, (res_dead, res_live)


def attack5():
    line("ATTACK 5 - mixed-basis query must refuse to merge into one COMPLETE")
    # two shards, each COMPLETE on its OWN basis, but bases differ
    engA, _ = build_note_shard()
    engA.step_backfill(len(engA.log))
    # shard B: admit a different subset -> different generation + commitment
    engB = CoverageEngine(profile_domain_closed=True)
    for tname in NOTE_FAMILY_SUPPORTED:
        engB.declare_type(TYPEID[tname], supported=True)
    for rname, rv in RECORDS.items():
        if rv.get("type") == "NOTE_1_1":
            engB.admit(rv["recordId"], rv["typeId"], key=f"note:{rv['type']}")
    engB.step_backfill(len(engB.log))

    gA, gB = engA._grade(), engB._grade()
    resA = engA.query("note:NOTE_1_1")
    resB = engB.query("note:NOTE_1_1")
    line(f"  shardA grade={gA[0]} basis={engA.basis()[0], engA.basis()[3][:12]}")
    line(f"  shardB grade={gB[0]} basis={engB.basis()[0], engB.basis()[3][:12]}")
    merged = merge_results([resA, resB])
    line(f"  merged result={merged}")
    line(f"  distinct bases in merge={len(merged.bases)}  note: {merged.note}")
    # PASS iff both shards were individually COMPLETE, bases differ, and the merge
    # REFUSES a single COMPLETE (outcome REFUSED, grade != COMPLETE)
    ok = (gA[0] == COMPLETE and gB[0] == COMPLETE
          and engA.basis() != engB.basis()
          and merged.grade != COMPLETE
          and merged.outcome == OUT_REFUSED
          and not merged.proves_absence())
    line(f"  => {'PASS' if ok else 'FAIL'} "
         f"(two COMPLETE bases refuse to collapse into one COMPLETE)")
    return ok, merged


def main():
    line("=" * 78)
    line("LANE SOLID - honest-completeness / query state machine")
    line("DISPOSABLE design-grade evidence (pure Python). NOT freeze-conformance.")
    line(f"corpus: {os.path.relpath(CORPUS_PATH)}  types={len(TYPES)} "
         f"records={len(RECORDS)}  keccak=local fixture")
    line(f"note-family typeIds: " + ", ".join(
        f"{t}={TYPEID[t][:8]}" for t in NOTE_FAMILY_SUPPORTED))
    line("=" * 78)
    results = {}
    for fn in (attack1, attack2, attack3, attack4, attack5):
        line("")
        ok, _ = fn()
        results[fn.__name__] = ok
    line("")
    line("=" * 78)
    passed = sum(1 for v in results.values() if v)
    for k, v in results.items():
        line(f"  {k}: {'PASS' if v else 'FAIL'}")
    line(f"  TOTAL: {passed}/{len(results)} attacks survived")
    verdict = ("SUPPORTED_FOR_NEXT_EXPERIMENT" if passed == len(results)
               else "FALSIFIED")
    line(f"  MODEL VERDICT: {verdict}")
    line("=" * 78)
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
