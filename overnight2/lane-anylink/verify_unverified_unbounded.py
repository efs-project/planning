#!/usr/bin/env python3
# DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
# ADVERSARY vs LANE HYPER / lane-anylink.
#
# EVIDENCE CLASS: design-grade pure-Python adversarial check (single implementation).
# This is NOT the two-implementation freeze-conformance standard. No protocol bytes/IDs/caps
# are selected here; all IDs are fixture-local. Production coordinates are BLOCKED_BY_CORE_INPUT.
#
# CLAIM UNDER ATTACK (builder): "existence-proof + bounded-backlink + no-authority ANY class
#   safely delivers hyperstructure links against the kill criterion (... attacker-shaped open
#   graph traversal / UNBOUNDED WORK), where the naive bytes32-shadow does not."
#   Sub-claims: (a) admission existence proof, (b) BOUNDED backlink indexing, (c) UNVERIFIED
#   variant for late/cross-Realm targets, (d) no-authority.
#
# STRATEGY: I attack the builder's OWN code (import its SafeStore), driving the REAL
# admit_publication() path -- not the direct _index_backlink() shortcut that Attack 4 used.
# Hypothesis: the CAP (b) and the existence proof (a) both key on declared==VERIFIED. The
# UNVERIFIED escape hatch (c) that the model needs for hyperstructure late-binding is admitted
# with NO existence proof AND NO cap, into an unbounded self.unverified_edges list. So an
# attacker who simply LABELS every hostile link UNVERIFIED reopens the exact "unbounded work"
# hole the kill criterion forbids -- inside the SAFE model itself.

import sys, os, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("any_link_model", os.path.join(HERE, "any_link_model.py"))
M = importlib.util.module_from_spec(spec)
spec.loader.exec_module(M)   # module-level loads corpus; main() is gated by __main__, so safe

VERIFIED, UNVERIFIED = M.VERIFIED, M.UNVERIFIED
BACKLINK_CAP = M.BACKLINK_CAP
MAX_NODES, MAX_DEPTH = M.MAX_NODES, M.MAX_DEPTH
keccak256 = M.keccak256

def line(c="-"): print(c * 88)

print("ADVERSARY vs lane-anylink -- attacking BOUNDED-WORK via the UNVERIFIED escape hatch")
print("evidence: design-grade single-impl; NOT two-impl freeze-conformance; IDs fixture-local")
line("=")

# ==========================================================================================
# ATTACK U1 -- index griefing through the REAL admit path using declared=UNVERIFIED.
#   Builder Attack 4 called safe4._index_backlink(victim, ...) directly (the CAP'd path).
#   A real attacker never calls that; they publish records with links. Do that, and choose
#   the label the model itself hands them for "late/cross-Realm" targets: UNVERIFIED.
# ==========================================================================================
print("ATTACK U1 -- inbound fan-in griefing via admit_publication(declared=UNVERIFIED)")
line()
N = 100_000
victim = keccak256(b"victim")   # a bare 32B id (need not be an admitted record for UNVERIFIED)

safe = M.SafeStore()
# Attacker publishes N records, each carrying ONE UNVERIFIED link at the victim.
# Every record name is attacker-chosen (not in RECORDS) => rid = keccak256(name); all admit.
pub = [(f"atk{i}", [("target", victim, UNVERIFIED)]) for i in range(N)]
verdicts = safe.admit_publication(pub)

admitted_ct = sum(1 for _, v, _ in verdicts if v == "ADMITTED")
denied_ct   = sum(1 for _, v, _ in verdicts if v == "DENIED")
# how many hostile inbound edges are now stored, and where?
verified_backlinks = len(safe.backlinks.get(victim, []))          # the CAP'd structure
overflow_counted   = safe.backlink_overflow.get(victim, 0)
unverified_total   = len(safe.unverified_edges)                    # the UNCAPPED structure
unverified_at_victim = sum(1 for (_s, _f, t) in safe.unverified_edges if t == victim)

print(f"  attacker records admitted (no existence proof run)     : {admitted_ct} / {N}")
print(f"  records DENIED                                          : {denied_ct}")
print(f"  VERIFIED backlink index for victim (the CAP'd struct)   : {verified_backlinks}  (CAP={BACKLINK_CAP})")
print(f"  backlink_overflow counter for victim                   : {overflow_counted}")
print(f"  self.unverified_edges TOTAL stored (UNCAPPED)          : {unverified_total:,}")
print(f"  UNVERIFIED inbound edges pointing at victim (fan-in)    : {unverified_at_victim:,}")
# Is inbound fan-in on the victim bounded? Count victim's TOTAL inbound across BOTH structures.
total_inbound_on_victim = verified_backlinks + unverified_at_victim
print(f"  TOTAL attacker-controlled inbound edges on victim       : {total_inbound_on_victim:,}")
u1_broke = (unverified_at_victim > BACKLINK_CAP)   # fan-in exceeded the declared bound
print(f"  >>> fan-in on victim exceeds declared BACKLINK_CAP?     : {u1_broke}  "
      f"({unverified_at_victim:,} > {BACKLINK_CAP})")
line("=")

# ==========================================================================================
# ATTACK U2 -- existence-proof bypass: UNVERIFIED admits with NO proof at all.
#   Kill criterion cares about admitting attacker-shaped edges. Show that under UNVERIFIED,
#   admission does zero existence checking: every dangling/hostile edge is accepted.
# ==========================================================================================
print("ATTACK U2 -- UNVERIFIED admission performs NO existence proof (dangling admitted en masse)")
line()
safe2 = M.SafeStore()
# 50k links each pointing at a DISTINCT never-admitted bare id, all UNVERIFIED.
K = 50_000
pub2 = [(f"g{i}", [("t", keccak256(f"ghost{i}".encode()), UNVERIFIED)]) for i in range(K)]
v2 = safe2.admit_publication(pub2)
adm2 = sum(1 for _, s, _ in v2 if s == "ADMITTED")
edges2 = len(safe2.unverified_edges)
# every one of these targets is provably-absent, yet all edges were stored without rejection
print(f"  links at distinct NEVER-admitted targets, all UNVERIFIED : {K:,}")
print(f"  admitted (no existence proof)                            : {adm2:,}")
print(f"  unverified_edges stored (all dangling)                   : {edges2:,}")
u2_broke = (adm2 == K and edges2 == K)
print(f"  >>> attacker wrote {edges2:,} dangling edges into the store unbounded? : {u2_broke}")
line("=")

# ==========================================================================================
# ATTACK U3 -- traversal PEAK FRONTIER memory is O(out-degree), attacker-controlled.
#   Builder Attack 4 reported visited==MAX_NODES and called work "bounded". But MAX_NODES caps
#   the VISITED SET, not the stack. Instrument a subclass to record peak stack length under a
#   single high-out-degree root. If peak stack ~ N, the "bounded work" claim is only bounded in
#   node-count, not memory/frontier.
# ==========================================================================================
print("ATTACK U3 -- traversal peak frontier (stack) memory under high out-degree")
line()

class InstrumentedSafe(M.SafeStore):
    def traverse_peak(self, root_id, edges):
        visited = set(); stack = [(root_id, 0)]; hit = None; peak = 0
        while stack:
            peak = max(peak, len(stack))
            nid, depth = stack.pop()
            if nid in visited: continue
            if len(visited) >= MAX_NODES: hit = "MAX_NODES"; break
            if depth >= MAX_DEPTH: hit = "MAX_DEPTH"; continue
            visited.add(nid)
            for nxt in edges.get(nid, []):
                if nxt not in visited:
                    stack.append((nxt, depth + 1))
        return visited, hit, peak

root = keccak256(b"root")
fan_edges = {root: [keccak256(f"leaf{i}".encode()) for i in range(N)]}
ins = InstrumentedSafe()
visited4, hit4, peak_stack = ins.traverse_peak(root, fan_edges)
print(f"  fan-out out-degree of root      : {N:,}")
print(f"  SAFE visited (builder's number)  : {len(visited4)}  hit_bound={hit4}  (<= MAX_NODES {MAX_NODES})")
print(f"  PEAK stack/frontier size         : {peak_stack:,}  <-- attacker-controlled O(out-degree)")
u3_broke = (peak_stack > MAX_NODES)   # frontier memory blew past the declared node bound
print(f"  >>> peak frontier memory exceeds MAX_NODES bound? : {u3_broke}  ({peak_stack:,} > {MAX_NODES})")
line("=")

# ==========================================================================================
# ATTACK U4 -- 'existence proof' proves ADMISSION, not a valid record: attacker self-grants
#   VERIFIED status by co-enveloping a junk decoy in the same publication.
# ==========================================================================================
print("ATTACK U4 -- attacker manufactures a passing VERIFIED existence proof with a junk decoy")
line()
safe5 = M.SafeStore()
decoy = "attacker_decoy_no_bytes_no_type"     # not in RECORDS; admits with zero validation
decoy_id = keccak256(decoy.encode())
# publication: decoy first (empty links -> admits), then a record with a VERIFIED link to decoy
pub5 = [
    (decoy, []),                                    # junk: no envelope, no type, no validation
    ("posing_as_real", [("ref", decoy_id, VERIFIED)]),
]
v5 = safe5.admit_publication(pub5)
posing_status = [s for (n, s, _) in v5 if n == "posing_as_real"][0]
resolve_decoy = safe5.resolve(decoy_id, VERIFIED)
print(f"  decoy admitted with zero byte/type validation          : {v5[0][1]}")
print(f"  VERIFIED link -> decoy admission status                 : {posing_status}")
print(f"  resolve(decoy, VERIFIED)                                : {resolve_decoy}")
u4_broke = (posing_status == "ADMITTED" and resolve_decoy == "PRESENT")
print(f"  >>> attacker got VERIFIED/PRESENT for a junk target?    : {u4_broke}")
line("=")

# ==========================================================================================
# ROLL-UP
# ==========================================================================================
print("ADVERSARY SUMMARY")
print(f"  U1 fan-in exceeds BACKLINK_CAP via UNVERIFIED admit : {u1_broke}")
print(f"  U2 UNVERIFIED admits dangling with no proof, unbounded: {u2_broke}")
print(f"  U3 traversal peak frontier O(out-degree) > MAX_NODES : {u3_broke}")
print(f"  U4 VERIFIED existence proof self-granted via decoy   : {u4_broke}")
broke_any = u1_broke or u2_broke or u3_broke or u4_broke
print()
print(f"CLAIM 'bounded work / bounded backlink' BROKEN by an in-model attack: {broke_any}")
sys.exit(0)
