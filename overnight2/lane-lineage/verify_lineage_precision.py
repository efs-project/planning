# DISPOSABLE  protocolConformance=false notAdopted=true goCodeAuthorized=false
# ADVERSARY check for LANE UPGRADABLE's claim that Object(B)/Occurrence(C)
# anchoring "makes ALL 5/5 links resolve => solves upgradability".
# Design-grade evidence, PURE PYTHON, single implementation. NOT the
# two-implementation freeze-conformance standard. IDs fixture-local; production
# coordinates BLOCKED_BY_CORE_INPUT.
#
# The builder measured RECALL only: of the 5 INTENDED edges, how many does each
# resolver accept. A resolver that accepts EVERYTHING scores 5/5. So I measure the
# other half the builder omitted:
#   ATTACK 1 (precision): over ALL ordered node pairs, how many NON-edges does each
#            resolver also accept? If B/C accept the complete directed graph, then
#            "seam resolves" is vacuous -- the seam resolves because everything does.
#   ATTACK 2 (impostor injection): an outside record NOT in the chain that self-
#            declares the same publisher+salt+charter (=> same objectId) and is
#            admitted to realm A. Does resolve_B / resolve_C accept it as a parent of
#            a legit child? If yes, lineage is forgeable: the anchor authenticates
#            class membership, not the edge.
#   ATTACK 3 (charter fragility): the builder's charter is class-AGNOSTIC by fiat. If
#            the Object charter must pin its class (to stop cross-class object
#            confusion), objectId becomes revision-dependent and B reacquires the
#            exact seam break. Show it.
#   ATTACK 4 (sanity): reproduce OLD/NEW/OBJ ids and the A/B/C recall counts so the
#            precision numbers sit on the same identities the builder used.

import json, os
from keccak import keccak256

HERE = os.path.dirname(os.path.abspath(__file__))
FIX  = os.path.abspath(os.path.join(HERE, "..", "..", "fixtures"))
CORPUS = json.load(open(os.path.join(FIX, "corpus.json")))

def h(*parts): return keccak256(b"".join(parts))

DOM_TYPE   = keccak256(b"EFSLAB/TOURN-2026-08-26/TYPE")
DOM_SCHEMA = keccak256(b"EFSLAB/TOURN-2026-08-26/SCHEMA")
DOM_RECORD = keccak256(b"EFSLAB/TOURN-2026-08-26/RECORD")
DOM_OBJ    = keccak256(b"EFSLAB/TOURN-2026-08-26/OBJECT")
DOM_OCC    = keccak256(b"EFSLAB/TOURN-2026-08-26/OCCURRENCE")
KIND = {"u64": 1, "bool": 2, "bytes": 3, "b32": 4}

def schema_bytes(fields):
    out = b""
    for key, kind, opt, mx in fields:
        out += key.to_bytes(2, "big") + bytes([KIND[kind], 1 if opt else 0]) + mx.to_bytes(4, "big")
    return out

def type_id(fields, meaning):
    sh = h(DOM_SCHEMA, schema_bytes(fields))
    mh = keccak256(meaning.encode())
    return h(DOM_TYPE, mh, sh)

def record_id(tid, envelope): return h(DOM_RECORD, tid, keccak256(envelope))
def object_id(publisher, salt, charter): return h(DOM_OBJ, publisher, salt, charter)
def occ_id(rid, realm): return h(DOM_OCC, rid, realm)

# --- ATTACK 4: reproduce identities & self-test (faithful to sealed corpus) ------
N10f = [(1,"b32",False,0),(2,"u64",False,0),(3,"bytes",False,512),(4,"b32",True,0)]
N11f = N10f + [(5,"bytes",True,32)]
OLD_TID = type_id(N10f, "note/1.0: author,createdAt,body(utf8),replyTo->Note")
NEW_TID = type_id(N11f, "note/1.1: note/1.0 + optional inert mood")
selftest = {
    "DOM_TYPE":       DOM_TYPE.hex()   == CORPUS["domains"]["DOM_TYPE"],
    "DOM_RECORD":     DOM_RECORD.hex() == CORPUS["domains"]["DOM_RECORD"],
    "NOTE_1_0.typeId":OLD_TID.hex()    == CORPUS["types"]["NOTE_1_0"]["typeId"],
    "NOTE_1_1.typeId":NEW_TID.hex()    == CORPUS["types"]["NOTE_1_1"]["typeId"],
}
assert all(selftest.values()), ("identity diverged", selftest)
assert OLD_TID != NEW_TID

PUBLISHER = bytes.fromhex("a1"*32)
SALT      = bytes([0x5A])*32
CHARTER   = keccak256(b"charter: this reply-thread object; append rule = author-signed")
REALM_A   = keccak256(b"realm/A")
OBJ_ID    = object_id(PUBLISHER, SALT, CHARTER)

# --- rebuild the 6-node chain EXACTLY as the builder does ------------------------
N, REV_AT = 6, 3
nodes = []
for i in range(N):
    tid = OLD_TID if i < REV_AT else NEW_TID
    env = keccak256(f"node/{i}/createdAt/{2000+i}".encode())
    rid = record_id(tid, env)
    nodes.append({"i": i, "typeId": tid, "recordId": rid,
                  "objectId": OBJ_ID, "occId": occ_id(rid, REALM_A),
                  "rev": "v1" if i < REV_AT else "v2"})
edges = [(c, c-1) for c in range(1, N)]
SEAM  = (REV_AT, REV_AT-1)
ADMITTED = {n["occId"] for n in nodes}

def resolve_A(child, parent): return parent["typeId"]  == child["typeId"]
def resolve_B(child, parent): return parent["objectId"] == child["objectId"]
def resolve_C(child, parent): return parent["occId"] in ADMITTED

RES = {"A": resolve_A, "B": resolve_B, "C": resolve_C}

def recall(resolver):
    ok = sum(1 for (c,p) in edges if resolver(nodes[c], nodes[p]))
    seam_ok = resolver(nodes[SEAM[0]], nodes[SEAM[1]])
    return ok, len(edges), seam_ok

print("="*78)
print("ADVERSARY: precision / injection / charter-fragility attack on B & C")
print("DISPOSABLE; design-grade single-impl; NOT freeze-conformance")
print("="*78)
print("self-test vs sealed corpus:", selftest)
print(f"OLD={OLD_TID.hex()[:12]}..  NEW={NEW_TID.hex()[:12]}..  OBJ={OBJ_ID.hex()[:12]}..")
print("-"*78)
print("ATTACK 4 (recall reproduction — matches builder):")
for k in "ABC":
    ok, tot, seam = recall(RES[k])
    print(f"  ({k}) recall = {ok}/{tot}   seam resolves = {seam}")

# --- ATTACK 1: PRECISION over the full ordered pair space ------------------------
# A resolver "solves lineage" only if it accepts the true edges and REJECTS non-edges.
all_pairs = [(c, p) for c in range(N) for p in range(N) if c != p]  # 30 ordered pairs
edge_set  = set(edges)
print("-"*78)
print(f"ATTACK 1 (precision): {len(all_pairs)} ordered non-self pairs, {len(edge_set)} are true edges")
for k in "ABC":
    r = RES[k]
    resolved = [(c,p) for (c,p) in all_pairs if r(nodes[c], nodes[p])]
    true_hit = [e for e in resolved if e in edge_set]
    false_acc = [e for e in resolved if e not in edge_set]
    prec = len(true_hit)/len(resolved) if resolved else float("nan")
    # a screaming example of a nonsense edge each strategy accepts (future as parent of past)
    reversed_hits = [(c,p) for (c,p) in false_acc if c < p]  # child older than parent = time-reversed
    print(f"  ({k}) resolves {len(resolved):2d}/{len(all_pairs)} pairs | true-edges {len(true_hit)} | "
          f"FALSE-ACCEPTS {len(false_acc):2d} | precision {prec:.3f} | "
          f"time-reversed accepts {len(reversed_hits)}")
complete = [k for k in "ABC"
            if len([1 for (c,p) in all_pairs if RES[k](nodes[c],nodes[p])]) == len(all_pairs)]
print(f"  strategies that resolve the COMPLETE directed graph (every node parent of every node): {complete}")

# --- ATTACK 2: IMPOSTOR injection (record NOT in the chain) ----------------------
# A hostile record authored under a DIFFERENT class and DIFFERENT content, but its
# envelope SELF-DECLARES the victim's publisher+salt+charter, so objectId collides.
# resolve_B checks no signature and no chain membership => it is accepted as a parent.
IMP_TID = type_id([(9,"bytes",False,64)], "hostile/forged: not a Note at all")
imp_env = keccak256(b"attacker payload; claims publisher=a1.. to hijack the thread")
imp_rid = record_id(IMP_TID, imp_env)
impostor = {"i": "IMP", "typeId": IMP_TID, "recordId": imp_rid,
            "objectId": object_id(PUBLISHER, SALT, CHARTER),   # SAME object id, self-declared
            "occId": occ_id(imp_rid, REALM_A), "rev": "hostile"}
ADMITTED.add(impostor["occId"])   # attacker gets one record admitted into the realm
victim_child = nodes[3]           # a legit v2 head
inj_B = resolve_B(victim_child, impostor)
inj_C = resolve_C(victim_child, impostor)
inj_A = resolve_A(victim_child, impostor)
print("-"*78)
print("ATTACK 2 (impostor injection): outside hostile record, different class+content,")
print(f"          self-declared same objectId; impostor.objectId==OBJ_ID: "
      f"{impostor['objectId']==OBJ_ID}")
print(f"  legit v2 child accepts impostor as PARENT:  A={inj_A}  B={inj_B}  C={inj_C}")

# --- ATTACK 3: class-pinned charter => B reacquires the seam break ----------------
# If the charter must name its class (a natural anti-confusion rule), it is revision-
# dependent, so v1 nodes and v2 nodes get DIFFERENT objectIds and the seam breaks.
def charter_pinned(tid): return keccak256(b"charter: reply-thread of class " + tid)
OBJ_V1 = object_id(PUBLISHER, SALT, charter_pinned(OLD_TID))
OBJ_V2 = object_id(PUBLISHER, SALT, charter_pinned(NEW_TID))
nodes_pin = []
for i in range(N):
    tid = OLD_TID if i < REV_AT else NEW_TID
    oid = OBJ_V1 if i < REV_AT else OBJ_V2
    nodes_pin.append({"objectId": oid})
def resolve_B_pin(child, parent): return parent["objectId"] == child["objectId"]
ok_pin = sum(1 for (c,p) in edges if resolve_B_pin(nodes_pin[c], nodes_pin[p]))
seam_pin = resolve_B_pin(nodes_pin[SEAM[0]], nodes_pin[SEAM[1]])
print("-"*78)
print("ATTACK 3 (class-pinned charter): objectId now depends on the class it pins")
print(f"  OBJ_V1={OBJ_V1.hex()[:12]}..  OBJ_V2={OBJ_V2.hex()[:12]}..  differ={OBJ_V1!=OBJ_V2}")
print(f"  (B) with class-pinned charter: recall = {ok_pin}/{len(edges)}   seam resolves = {seam_pin}")

# --- verdict summary -------------------------------------------------------------
print("="*78)
print("FINDINGS:")
print("  * Recall counts (A 4/5, B 5/5, C 5/5) reproduce exactly — CONFIRMED.")
print("  * But B and C resolve the COMPLETE directed graph: precision ~0.17, they")
print("    accept every node as parent of every node incl. time-reversed edges.")
print("    'seam resolves = True' is therefore VACUOUS (everything resolves).")
print("  * An outside HOSTILE record injects as a valid parent under B and C")
print("    (no signature / no edge binding checked) -> lineage is forgeable.")
print("  * B's 5/5 is contingent on a class-AGNOSTIC charter; a class-pinned charter")
print("    reintroduces the exact seam break B claimed to fix.")
print("  => 'Object/Occurrence anchoring solves upgradability' is OVERCLAIMED: the")
print("     seam is not authenticated, only the class-membership predicate is widened.")
print("     The real fix (author/succession authority + charter serialization) is the")
print("     builder's own RESIDUAL = BLOCKED_BY_CORE_INPUT.")
print("="*78)
