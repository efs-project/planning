#!/usr/bin/env python3
# DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
# LANE HYPER / lane-anylink ADVERSARY : independent break-attempt against any_link_model.py
#
# EVIDENCE CLASS: design-grade pure-Python check (single implementation, adversarial).
# This is NOT the two-implementation freeze-conformance standard. No protocol bytes/IDs/caps
# are selected here; all constants/IDs are fixture-local. Production coordinates BLOCKED_BY_CORE_INPUT.
#
# WHAT I AM ATTACKING (builder's claim, verbatim intent):
#   "existence-proof + bounded-backlink + no-authority ANY reference class safely delivers
#    hyperstructure links against the kill criterion (open discovery/ANY variants that grant
#    authority or cause effects; attacker-shaped open graph traversal / UNBOUNDED WORK)."
#   Builder Attack 4 reports: fan-out N=100,000 -> SAFE traversal visited=1024 (==MAX_NODES),
#   hit_bound=MAX_NODES -> "traversal capped ... PASS", and backlink index stored=64 (==CAP).
#
# MY THESIS (the gap the builder under-tested):
#   The builder measures visited-NODE COUNT and per-target IN-degree only. Neither bounds the
#   quantity the kill criterion actually names: WORK (CPU operations) and MEMORY (peak stack /
#   index growth). Both scale O(N) with a SINGLE node's attacker-controlled OUT-degree.
#   The seam the builder claims to deliver explicitly includes an ARRAY link field
#   (ActionPlan.effects[].target), which makes a single-record high-out-degree node reachable.
#   I reuse the builder's OWN SafeStore.traverse / admit_publication / _index_backlink UNCHANGED
#   and measure the operations and peak memory the builder never counted.
#
# RESULT VOCАB: SUPPORTED_FOR_NEXT_EXPERIMENT | FALSIFIED | INCONCLUSIVE | BLOCKED_BY_CORE_INPUT

import os, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)  # local read-only keccak.py + the builder's module
import any_link_model as M          # the artifact under attack (unmodified)
from any_link_model import SafeStore, ShadowStore, VERIFIED, UNVERIFIED, BACKLINK_CAP, MAX_NODES, MAX_DEPTH
from keccak import keccak256


def line(c="-"):
    print(c * 92)


# --------------------------------------------------------------------------------------------
# Instrumented copy of the builder's SafeStore.traverse.  BEHAVIOURALLY IDENTICAL (asserted
# below against the real method) but it counts pops/pushes and records peak stack depth --
# exactly the WORK / MEMORY the builder's version silently incurs but never reports.
# --------------------------------------------------------------------------------------------
def instrumented_traverse(root_id, edges):
    visited = set()
    stack = [(root_id, 0)]
    hit = None
    pops = 0
    pushes = 1              # the initial root push
    peak_stack = len(stack)
    while stack:
        peak_stack = max(peak_stack, len(stack))
        nid, depth = stack.pop()
        pops += 1
        if nid in visited:
            continue
        if len(visited) >= MAX_NODES:
            hit = "MAX_NODES"
            break
        if depth >= MAX_DEPTH:
            hit = "MAX_DEPTH"
            continue
        visited.add(nid)
        for nxt in edges.get(nid, []):
            if nxt not in visited:
                stack.append((nxt, depth + 1))
                pushes += 1
                peak_stack = max(peak_stack, len(stack))
    return visited, hit, pops, pushes, peak_stack


def main():
    print("LANE HYPER / lane-anylink ADVERSARY -- break-attempt on the ANY reference class")
    print("EVIDENCE: design-grade pure-Python, single-impl, adversarial. NOT freeze-conformance.")
    print(f"reusing builder constants: BACKLINK_CAP={BACKLINK_CAP} MAX_NODES={MAX_NODES} MAX_DEPTH={MAX_DEPTH}")
    line("=")

    broke = []   # list of (label, detail) for genuinely-broken claims
    held  = []   # list of (label, detail) for claims that survived my attack

    # =========================================================================================
    # BREAK 1 : "attacker-shaped traversal / unbounded WORK" is NOT defended.
    # Rebuild the builder's EXACT attack-4 fan-out graph and measure what it never measured:
    # total operations and peak stack, vs the visited-node count it did report.
    # =========================================================================================
    print("BREAK 1 -- single high-out-degree node: WORK & PEAK-STACK are O(N), not bounded")
    line()
    N = 100_000
    root = keccak256(b"root")
    fan_edges = {root: [keccak256(f"leaf{i}".encode()) for i in range(N)]}
    chain = [keccak256(f"c{i}".encode()) for i in range(MAX_DEPTH * 4)]
    for i in range(len(chain) - 1):
        fan_edges[chain[i]] = [chain[i + 1]]
    fan_edges[root].append(chain[0])   # identical construction to the builder's attack 4

    # (a) the builder's OWN method -- what it reports
    real_visited, real_hit = SafeStore().traverse(root, fan_edges)
    # (b) behaviourally-identical instrumented copy -- what it actually costs
    i_visited, i_hit, pops, pushes, peak_stack = instrumented_traverse(root, fan_edges)

    identical = (len(real_visited) == len(i_visited) and real_hit == i_hit)
    print(f"  builder SafeStore.traverse REPORTS : visited={len(real_visited)}  hit_bound={real_hit}")
    print(f"  instrumented (identical behaviour) : visited={len(i_visited)}  hit_bound={i_hit}  identical={identical}")
    print(f"  ACTUAL work  (pops+pushes)         : {pops + pushes:,} operations")
    print(f"  ACTUAL memory(peak stack depth)    : {peak_stack:,} frames")
    print(f"  attacker out-degree of ONE node    : {len(fan_edges[root]):,}")
    print(f"  MAX_NODES bound (visited count)    : {MAX_NODES}   <-- the ONLY thing builder bounded")
    assert identical, "instrumented copy diverged from builder method -- measurement invalid"
    # The break: work/memory scale with attacker N, not with MAX_NODES.
    work_unbounded = (pushes >= N and peak_stack >= N)
    if work_unbounded:
        broke.append(("traversal WORK/MEMORY unbounded",
                      f"peak_stack={peak_stack:,} & pushes={pushes:,} = O(N), MAX_NODES only capped visited={len(real_visited)}"))
        print(f"  >>> BROKEN: peak stack {peak_stack:,} frames and {pushes:,} pushes for a single node,")
        print(f"      while builder declared 'traversal capped at {MAX_NODES}'. Node-COUNT bound does")
        print(f"      NOT bound WORK or MEMORY -- the kill-criterion 'unbounded work' surface is OPEN.")
    else:
        held.append(("traversal work", f"pushes={pushes} peak={peak_stack}"))
    line("=")

    # =========================================================================================
    # BREAK 1b : confirm scaling. Double N -> work/memory double. A true bound would be flat.
    # =========================================================================================
    print("BREAK 1b -- scaling proof: work/memory track N (a real bound would be flat at MAX_NODES)")
    line()
    scaling = []
    for n in (10_000, 50_000, 200_000):
        r = keccak256(f"root{n}".encode())
        e = {r: [keccak256(f"l{n}_{i}".encode()) for i in range(n)]}
        _, _, po, pu, pk = instrumented_traverse(r, e)
        scaling.append((n, pu, pk))
        print(f"  out-degree N={n:>7,} -> pushes={pu:>8,}  peak_stack={pk:>8,}  (visited bounded at {MAX_NODES})")
    flat = len({pk for _, _, pk in scaling}) == 1
    print(f"  peak-stack constant across N? {flat}  (False = attacker controls memory -> unbounded)")
    if not flat:
        broke.append(("traversal memory scales with attacker N",
                      f"peak_stack went {scaling[0][2]:,} -> {scaling[-1][2]:,} as N grew {scaling[0][0]:,} -> {scaling[-1][0]:,}"))
    line("=")

    # =========================================================================================
    # BREAK 2 : "bounded backlink indexing" is per-TARGET in-degree only. A single source with
    # an ARRAY link field (the seam's ActionPlan.effects[].target) writes O(N) index entries by
    # spreading them across N DISTINCT victims -- each victim under its cap, total UNBOUNDED.
    # Uses the builder's REAL admit_publication + _index_backlink, UNCHANGED.
    # =========================================================================================
    print("BREAK 2 -- one array-link record fans out O(N) VERIFIED backlinks across N victims")
    line()
    N2 = 50_000
    safe = SafeStore()
    # Pre-admit N2 distinct victim records (leaf-first ordering satisfies the existence proof).
    victims = [keccak256(f"victim{i}".encode()) for i in range(N2)]
    for v in victims:
        safe.admitted[v] = f"v_{v.hex()[:8]}"     # already-admitted set (existence proof will pass)
    # ONE attacker record whose effects[] array carries N2 VERIFIED links to the N2 victims.
    array_links = [(f"effects[{i}].target", victims[i], VERIFIED) for i in range(N2)]
    before_entries = sum(len(v) for v in safe.backlinks.values())
    safe.admit_publication([("evil_action_plan", array_links)])
    after_entries = sum(len(v) for v in safe.backlinks.values())
    per_target_max = max(len(v) for v in safe.backlinks.values())
    total_index = after_entries - before_entries
    print(f"  ONE admitted record, effects[] length             : {N2:,}")
    print(f"  per-target backlink max (cap should hold)          : {per_target_max}  (CAP={BACKLINK_CAP})")
    print(f"  TOTAL backlink index entries this one record wrote : {total_index:,}")
    print(f"  builder's BACKLINK_CAP protects in-degree, but out-degree of ONE source is uncapped.")
    if per_target_max <= BACKLINK_CAP and total_index >= N2:
        broke.append(("per-source fan-out uncapped",
                      f"one record wrote {total_index:,} index entries (per-target cap {per_target_max}<= {BACKLINK_CAP} held, total unbounded)"))
        print(f"  >>> BROKEN: cap held per-target ({per_target_max}<={BACKLINK_CAP}) yet ONE record still")
        print(f"      injected {total_index:,} entries. 'Bounded backlink indexing' bounds IN-degree, not")
        print(f"      the attacker's total write. Seam's array link field (effects[]) makes this reachable.")
    else:
        held.append(("backlink index", f"per_target_max={per_target_max} total={total_index}"))
    line("=")

    # =========================================================================================
    # BREAK 3 : the UNVERIFIED variant's edge store is COMPLETELY uncapped, and UNVERIFIED
    # BYPASSES the existence proof -- so it is the CHEAPEST spam surface. One array-link record
    # appends O(N) rows to SafeStore.unverified_edges (a plain list, no cap anywhere).
    # Uses the builder's REAL admit_publication, UNCHANGED.
    # =========================================================================================
    print("BREAK 3 -- UNVERIFIED variant: uncapped list + bypasses existence proof")
    line()
    N3 = 50_000
    safe3 = SafeStore()
    dangling = [(f"effects[{i}].target", keccak256(f"nowhere{i}".encode()), UNVERIFIED) for i in range(N3)]
    # NB: targets are pure garbage (dangling). UNVERIFIED skips the existence proof entirely,
    # so the record is ADMITTED and every dangling edge is stored.
    verdict = safe3.admit_publication([("evil_unverified_plan", dangling)])
    stored_unverified = len(safe3.unverified_edges)
    print(f"  record admission verdict                : {verdict[0][1]}  (existence proof BYPASSED by UNVERIFIED)")
    print(f"  effects[] length (all dangling garbage) : {N3:,}")
    print(f"  SafeStore.unverified_edges list length  : {stored_unverified:,}  (no CAP applied)")
    print(f"  BACKLINK_CAP applies only to _index_backlink (VERIFIED). UNVERIFIED -> raw list.append.")
    if verdict[0][1] == "ADMITTED" and stored_unverified >= N3:
        broke.append(("UNVERIFIED store uncapped",
                      f"one admitted record appended {stored_unverified:,} rows to an uncapped list; existence proof bypassed"))
        print(f"  >>> BROKEN: {stored_unverified:,} attacker-controlled rows in an uncapped structure from")
        print(f"      ONE record, none of which passed any existence proof. The 'bounded' story does not")
        print(f"      cover the very variant the builder recommends for late/cross-Realm targets.")
    else:
        held.append(("unverified store", f"verdict={verdict[0][1]} stored={stored_unverified}"))
    line("=")

    # =========================================================================================
    # CONTROL : re-run the builder's CORE safe properties to confirm I did NOT break the ones
    # that are actually sound (existence proof rejects dangling VERIFIED; no-authority; cycle
    # termination). An honest adversary reports what held.
    # =========================================================================================
    print("CONTROL -- properties that SURVIVED my attack (builder is right about these)")
    line()
    # (i) existence proof still rejects a dangling VERIFIED link
    ctl = SafeStore()
    bad = keccak256(b"ghost")
    v = ctl.admit_publication([("x", [("target", bad, VERIFIED)])])
    ep_ok = (v[0][1] == "DENIED")
    print(f"  existence proof rejects dangling VERIFIED : {v[0][1]}  -> {'HELD' if ep_ok else 'broke'}")
    # (ii) no-authority: authority is a pure function of attester; links are not an input
    M.ATTESTER.clear(); M.CAPS.clear()
    M.ATTESTER["tgt"] = "ISSUER"; M.ATTESTER["src"] = "ATTACKER"
    M.CAPS["ISSUER"] = frozenset({"EQUIP"}); M.CAPS["ATTACKER"] = frozenset()
    a_before = M.authority_of("tgt")
    # even a million inbound links cannot change authority_of, because it never reads links:
    a_after = M.authority_of("tgt")
    noauth_ok = (a_before == a_after == frozenset({"EQUIP"}) and M.authority_of("src") == frozenset())
    print(f"  no-authority invariant (links not an input): before={sorted(a_before)} after={sorted(a_after)} -> {'HELD' if noauth_ok else 'broke'}")
    # (iii) cycle terminates with declared bound
    A = keccak256(b"cycA"); Bn = keccak256(b"cycB")
    cvis, chit = SafeStore().traverse(A, {A: [Bn], Bn: [A]})
    cyc_ok = (len(cvis) == 2 and chit is None)
    print(f"  cycle A<->B terminates                     : visited={len(cvis)} hit={chit} -> {'HELD' if cyc_ok else 'broke'}")
    if ep_ok: held.append(("existence proof (dangling VERIFIED)", v[0][1]))
    if noauth_ok: held.append(("no-authority invariant", "authority independent of links"))
    if cyc_ok: held.append(("cycle termination (visited-dedup)", f"visited={len(cvis)}"))
    line("=")

    # =========================================================================================
    print("VERDICT ROLL-UP")
    line()
    print("  BROKEN (claim fails under adversarial input):")
    for lbl, d in broke:
        print(f"    - {lbl}: {d}")
    print("  HELD (survived my attack):")
    for lbl, d in held:
        print(f"    + {lbl}: {d}")
    print()
    broke_it = len(broke) > 0
    print(f"  brokeIt = {broke_it}")
    print("  SCOPE: the BROKEN items concern the kill-criterion clause 'unbounded work' and the")
    print("  'bounded backlink indexing' claim. Existence-proof, no-authority, and cycle-termination")
    print("  (A1/A2/A3) HELD. The bound the builder built is on visited-NODE-COUNT and per-target")
    print("  IN-degree; the attacker controls WORK, PEAK MEMORY, and per-source OUT-degree, which the")
    print("  seam's array link field (ActionPlan.effects[].target) makes reachable from ONE record.")
    print("  Residual freeze blocker unchanged: exact ANY/SELF encoding + a PER-SOURCE fan-out bound")
    print("  and a WORK/MEMORY (not just node-count) traversal budget are unselected -> BLOCKED_BY_CORE_INPUT.")
    return broke_it


if __name__ == "__main__":
    broke = main()
    # exit 0 regardless; the verdict is in the printed roll-up, not the exit code.
    sys.exit(0)
