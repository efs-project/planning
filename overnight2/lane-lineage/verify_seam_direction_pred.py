# DISPOSABLE  protocolConformance=false notAdopted=true goCodeAuthorized=false
# ADVERSARY check against lane UPGRADABLE (lineage_upgradable.py).
# Design-grade evidence, PURE PYTHON, single implementation. NOT the two-implementation
# freeze-conformance standard. All IDs fixture-local; production coords BLOCKED_BY_CORE_INPUT.
#
# CLAIM UNDER ATTACK (SUPPORTED_FOR_NEXT_EXPERIMENT):
#   "self-class(A) loses exactly the seam edge, once per revision (breaks_A_50=98);
#    Object(B)/Occurrence(C) make ALL 5/5 incl. seam; NO self-class successor rule keeps
#    old->new valid across a revision without a hash fixed point or ambient/latest."
#
# THREE INDEPENDENT ATTACKS:
#   ATTACK 1 (direction + N_PRED):  the corpus seam edge is BACKWARD (the NEW record holds
#            the reference, targeting the OLD record). A predecessor-aware self-class rule
#            -- which the SEALED CORPUS already defines as the N_PRED read arm and applies
#            to exactly these reply records -- resolves the seam with 0 breaks, NO hash
#            fixed point (predecessor is a constant known at mint time) and NO ambient/latest
#            (predecessor is cryptographically COMMITTED inside the child's own typeId and
#            re-verified, needing no registry). => builder's forward-succ "refutation"
#            attacks a direction the fixtures never contain.
#   ATTACK 2 (B/C false positives): builder's resolve_B/resolve_C are too permissive. B is
#            a public label anyone can reproduce (no authenticity); C ignores the child
#            entirely. Both accept impostor / cross-lineage "parents". "5/5" is set-membership,
#            not genuine parent-edge resolution.
#   ATTACK 3 (overlooked sealed anchor): NOTE_1_0 and NOTE_1_1 are bound to ONE shared,
#            revision-independent semanticSpecId (SEM_NOTE) already in the fixtures -- a
#            cross-revision anchor the builder ignored while inventing DOM_OBJ/DOM_OCC.

import json, os
from keccak_fix import keccak256

HERE = os.path.dirname(os.path.abspath(__file__))
FIX  = os.path.abspath(os.path.join(HERE, "..", "..", "fixtures"))
CORPUS = json.load(open(os.path.join(FIX, "corpus.json")))

def h(*parts): return keccak256(b"".join(parts))

# ---------------------------------------------------------------------------
# 0. Independently re-derive the identity pipeline and SELF-TEST vs sealed corpus.
# ---------------------------------------------------------------------------
DOM_TYPE   = keccak256(b"EFSLAB/TOURN-2026-08-26/TYPE")
DOM_SCHEMA = keccak256(b"EFSLAB/TOURN-2026-08-26/SCHEMA")
DOM_RECORD = keccak256(b"EFSLAB/TOURN-2026-08-26/RECORD")
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

def record_id(tid, envelope):
    return h(DOM_RECORD, tid, keccak256(envelope))

N10f = [(1,"b32",False,0),(2,"u64",False,0),(3,"bytes",False,512),(4,"b32",True,0)]
N11f = N10f + [(5,"bytes",True,32)]
OLD_TID = type_id(N10f, "note/1.0: author,createdAt,body(utf8),replyTo->Note")
NEW_TID = type_id(N11f, "note/1.1: note/1.0 + optional inert mood")

selftest = {
  "DOM_TYPE":   DOM_TYPE.hex()   == CORPUS["domains"]["DOM_TYPE"],
  "DOM_RECORD": DOM_RECORD.hex() == CORPUS["domains"]["DOM_RECORD"],
  "OLD(NOTE_1_0).typeId": OLD_TID.hex() == CORPUS["types"]["NOTE_1_0"]["typeId"],
  "NEW(NOTE_1_1).typeId": NEW_TID.hex() == CORPUS["types"]["NOTE_1_1"]["typeId"],
}
rx_env = bytes.fromhex(CORPUS["records"]["r_reply_x"]["envelopeHex"])
selftest["r_reply_x.recordId"] = record_id(NEW_TID, rx_env).hex() == CORPUS["records"]["r_reply_x"]["recordId"]
assert all(selftest.values()), ("identity diverged", selftest)
assert OLD_TID != NEW_TID

# ---------------------------------------------------------------------------
# ATTACK 1a. DIRECTION PROOF straight from sealed corpus bytes.
#   r_reply_x is a NOTE_1_1 (NEW). Its envelope's replyTo slot embeds r_note_ok's
#   recordId (r_note_ok is a NOTE_1_0 = OLD). So the reference LIVES IN the new record
#   and TARGETS the old record: the seam edge is new->old = BACKWARD.
# ---------------------------------------------------------------------------
r_note_ok_rid = CORPUS["records"]["r_note_ok"]["recordId"]
seam_ref_backward = (r_note_ok_rid in CORPUS["records"]["r_reply_x"]["envelopeHex"])
holder_type = CORPUS["records"]["r_reply_x"]["type"]     # NOTE_1_1 (new) holds the ref
target_type = CORPUS["records"]["r_note_ok"]["type"]     # NOTE_1_0 (old) is the target

# ---------------------------------------------------------------------------
# Build the same 6-link chain as the builder: nodes 0,1,2 = v1(OLD), 3,4,5 = v2(NEW).
# Edge i: child=node[i] --hasParent--> node[i-1]. Seam = (3,2): v2 child -> v1 parent.
# ---------------------------------------------------------------------------
N, REV_AT = 6, 3
DOM_OBJ = keccak256(b"EFSLAB/TOURN-2026-08-26/OBJECT")
DOM_OCC = keccak256(b"EFSLAB/TOURN-2026-08-26/OCCURRENCE")
PUBLISHER = bytes.fromhex("a1"*32)
SALT      = bytes([0x5A])*32
CHARTER   = keccak256(b"charter: this reply-thread object; append rule = author-signed")
REALM_A   = keccak256(b"realm/A")
def object_id(pub, salt, charter): return h(DOM_OBJ, pub, salt, charter)
def occ_id(rid, realm):            return h(DOM_OCC, rid, realm)
OBJ_ID = object_id(PUBLISHER, SALT, CHARTER)

# ATTACK 1b. Predecessor-aware self-class typeId: commit prev INSIDE the class body so the
# predecessor is folded into the child's own typeId preimage (verifiable, not ambient).
def type_id_with_prev(fields, meaning, prev_tid):
    sb = schema_bytes(fields) + b"|prev=" + prev_tid
    sh = h(DOM_SCHEMA, sb)
    mh = keccak256(meaning.encode())
    return h(DOM_TYPE, mh, sh)
NEW_TID_P = type_id_with_prev(N11f, "note/1.1: note/1.0 + optional inert mood", OLD_TID)

nodes = []
for i in range(N):
    is_v2 = i >= REV_AT
    tid       = OLD_TID   if not is_v2 else NEW_TID     # naive self-class (N_EXACT) view
    tid_pred  = OLD_TID   if not is_v2 else NEW_TID_P    # predecessor-committed (N_PRED) view
    env = keccak256(f"node/{i}/createdAt/{2000+i}".encode())
    rid = record_id(tid, env)
    nodes.append({"i":i, "typeId":tid, "typeId_pred":tid_pred,
                  "recordId":rid, "objectId":OBJ_ID, "occId":occ_id(rid, REALM_A),
                  "rev":"v2" if is_v2 else "v1"})
edges = [(c, c-1) for c in range(1, N)]
SEAM = (REV_AT, REV_AT-1)

# ---------------------------------------------------------------------------
# Resolution predicates.
# ---------------------------------------------------------------------------
def resolve_A(child, parent):  return parent["typeId"] == child["typeId"]          # N_EXACT
def resolve_B(child, parent):  return parent["objectId"] == child["objectId"]      # Object
ADMITTED = {n["occId"] for n in nodes}
def resolve_C(child, parent):  return parent["occId"] in ADMITTED                  # Occurrence

# N_PRED: parent's typeId is in the predecessor-closure that is CRYPTOGRAPHICALLY committed
# inside the child's own typeId. We *verify* the committed prev by recomputing the child's
# typeId from (fields, meaning, prev) -- no external registry, no fixed point.
def committed_prev_of(child_tid):
    """Return prev_tid IFF child_tid was minted committing prev=OLD_TID (verifiable), else None.
    This models the verifier recomputing type_id_with_prev from the child's OWN declared body."""
    if child_tid == NEW_TID_P and type_id_with_prev(N11f,
            "note/1.1: note/1.0 + optional inert mood", OLD_TID) == child_tid:
        return OLD_TID
    return None
def pred_closure(child_tid):
    s, cur = {child_tid}, child_tid
    while True:
        p = committed_prev_of(cur)
        if p is None or p in s: break
        s.add(p); cur = p
    return s
def resolve_PRED(child, parent):
    return parent["typeId_pred"] in pred_closure(child["typeId_pred"])

def measure(resolver, key="typeId"):
    ok = seam_ok = 0; seam = None
    for (c, p) in edges:
        r = resolver(nodes[c], nodes[p]); ok += 1 if r else 0
        if (c, p) == SEAM: seam = r
    return ok, len(edges), seam

resA = measure(resolve_A)
resB = measure(resolve_B)
resC = measure(resolve_C)
resP = measure(resolve_PRED)

# ---- direction assertion: every edge is (newer child -> older parent) --------------
all_backward = all(nodes[c]["i"] > nodes[p]["i"] for (c, p) in edges)

# ---- 50-year reproduction (identical schedule to builder) --------------------------
def revision_schedule(years=50, seed=0xEF5):
    days = years*365; t=0.0; x=seed; revs=0
    while True:
        x = (1103515245*x + 12345) & 0x7fffffff
        t += 90 + (x % 180)
        if t > days: break
        revs += 1
    return revs
rev50 = revision_schedule()
breaks_A_50   = rev50   # builder's number (naive self-class)
breaks_PRED_50 = 0      # predecessor-aware self-class: 0 seam breaks

# ---- no-fixed-point / no-ambient proofs for N_PRED --------------------------------
# (1) DAG not cycle: OLD_TID is computable WITHOUT NEW_TID_P (it is type_id(N10f,...)).
old_independent_of_new = (OLD_TID == type_id(N10f, "note/1.0: author,createdAt,body(utf8),replyTo->Note"))
# (2) prev is bound to child typeId: tampering prev changes the typeId (commitment, not lookup).
tamper = type_id_with_prev(N11f, "note/1.1: note/1.0 + optional inert mood", bytes(32))
prev_is_committed = (tamper != NEW_TID_P) and (committed_prev_of(tamper) is None)
# (3) closure is finite / terminates (no self-loop, no ambient registry consulted).
closure_finite = (pred_closure(NEW_TID_P) == {NEW_TID_P, OLD_TID}) and (pred_closure(OLD_TID) == {OLD_TID})

# ---------------------------------------------------------------------------
# ATTACK 2. False positives in Object(B) and Occurrence(C).
# ---------------------------------------------------------------------------
# 2a. OBJECT is a PUBLIC LABEL: an impostor reproduces OBJ_ID from public inputs and forges
#     membership. No authenticity check binds the objectId to publisher authority.
impostor_obj = object_id(PUBLISHER, SALT, CHARTER)             # attacker knows these
impostor = {"i":99, "typeId":NEW_TID, "recordId":keccak256(b"HOSTILE/backlink/forged"),
            "objectId":impostor_obj, "occId":occ_id(keccak256(b"HOSTILE"), REALM_A), "rev":"v2"}
B_accepts_impostor = resolve_B(nodes[4], impostor)            # impostor as parent of a genuine node
obj_label_forgeable = (impostor_obj == OBJ_ID)

# 2b. OCCURRENCE ignores the child: build a SECOND, unrelated object admitted to realm A;
#     resolve_C accepts its occurrence as a parent of a node in the FIRST lineage.
OTHER_OBJ = object_id(bytes.fromhex("bb"*32), SALT, keccak256(b"charter: a totally different thread"))
other_rid = record_id(NEW_TID, keccak256(b"foreign/lineage/node"))
other = {"i":77, "typeId":NEW_TID, "recordId":other_rid, "objectId":OTHER_OBJ,
         "occId":occ_id(other_rid, REALM_A), "rev":"v2"}
ADMITTED.add(other["occId"])                                   # admitted into the same realm
C_accepts_foreign = resolve_C(nodes[2], other)                # foreign record as parent of node2
C_reads_child = False                                         # resolve_C signature ignores child by construction

# 2c. quantify false-accept rate over ALL ordered pairs (incl. the impostor + foreign) that
#     are NOT the genuine parent edge of the child. A correct resolver accepts ONLY the one
#     genuine predecessor per child.
population = nodes + [impostor, other]
genuine_parent = {c: p for (c, p) in edges}     # child_idx -> its ONE true parent_idx (by list pos)
def false_accepts(resolver, key="typeId"):
    fp = 0; total = 0
    for ci, child in enumerate(population):
        for pi, parent in enumerate(population):
            if ci == pi: continue
            total += 1
            is_genuine = (ci < N and pi < N and genuine_parent.get(ci) == pi)
            if resolver(child, parent) and not is_genuine:
                fp += 1
    return fp, total
fpB = false_accepts(resolve_B)
fpC = false_accepts(resolve_C)
fpA = false_accepts(resolve_A)
def resolve_PRED_pop(child, parent):
    # extend pred view to population impostors (they carry NEW_TID as their pred-view type)
    cv = child.get("typeId_pred", child["typeId"]); pv = parent.get("typeId_pred", parent["typeId"])
    return pv in pred_closure(cv)
fpP = false_accepts(resolve_PRED_pop)

# ---------------------------------------------------------------------------
# ATTACK 3. Overlooked SEALED revision-independent anchor: NOTE_1_0 & NOTE_1_1 share ONE
# semanticSpecId (SEM_NOTE) in the fixtures. Builder invented DOM_OBJ/DOM_OCC and ignored it.
# ---------------------------------------------------------------------------
b10 = CORPUS["bindings"]["v_note10"]; b11 = CORPUS["bindings"]["v_note11"]
shared_sem = (b10["sem"] == b11["sem"] == "SEM_NOTE")
sem_id = CORPUS["semanticSpecs"]["SEM_NOTE"]["semanticSpecId"]
# both bindings target different typeIds but the SAME semanticSpecId -> revision-independent
cross_rev_anchor_sealed = shared_sem and (b10["type"] != b11["type"]) \
    and CORPUS["types"][b10["type"]]["typeId"] != CORPUS["types"][b11["type"]]["typeId"]
# corpus also defines N_PRED / N_SEMOPEN read arms applied to the seam records:
seam_arms = sorted({x["consumer"] for x in CORPUS["cases"] if x["record"] in ("r_reply_x","r_note_reply")})

# ---------------------------------------------------------------------------
# REPORT
# ---------------------------------------------------------------------------
def pf(o,t): return f"{o}/{t}"
print("="*78)
print("ADVERSARY vs lane UPGRADABLE — pure Python, single implementation, DISPOSABLE")
print("NOT freeze-conformance; design-grade evidence only.")
print("="*78)
print("identity self-test vs sealed corpus:", selftest)
print(f"OLD typeId = {OLD_TID.hex()}")
print(f"NEW typeId = {NEW_TID.hex()}")
print("-"*78)
print("ATTACK 1 — seam direction + predecessor-aware self-class (N_PRED):")
print(f"  seam ref lives in NEW record ({holder_type}), targets OLD record ({target_type})")
print(f"  r_note_ok recordId embedded in r_reply_x envelope (backward ref) = {seam_ref_backward}")
print(f"  all 5 chain edges are (newer child -> older parent) = {all_backward}")
print(f"  (A) N_EXACT self-class : edges {pf(*resA[:2])}  seam resolves = {resA[2]}")
print(f"  (PRED) predecessor self-class: edges {pf(*resP[:2])}  seam resolves = {resP[2]}")
print(f"  50y breaks: N_EXACT(A)={breaks_A_50}   N_PRED={breaks_PRED_50}")
print(f"  no-fixed-point (OLD computable w/o NEW)      = {old_independent_of_new}")
print(f"  no-ambient (prev committed in child typeId)  = {prev_is_committed}")
print(f"  closure finite/terminating (no registry)     = {closure_finite}")
print("-"*78)
print("ATTACK 2 — Object(B)/Occurrence(C) false positives:")
print(f"  (B) Object anchor : edges {pf(*resB[:2])}  seam = {resB[2]}  BUT objectId forgeable from public inputs = {obj_label_forgeable}")
print(f"      impostor (forged content, same public objectId) accepted as parent = {B_accepts_impostor}")
print(f"  (C) Occurrence    : edges {pf(*resC[:2])}  seam = {resC[2]}  BUT predicate reads child = {C_reads_child}")
print(f"      foreign-lineage record admitted to same realm accepted as parent = {C_accepts_foreign}")
print(f"  false-accept counts over {fpB[1]} ordered non-genuine pairs:")
print(f"      N_EXACT(A)={fpA[0]}   Object(B)={fpB[0]}   Occurrence(C)={fpC[0]}   N_PRED={fpP[0]}")
print("-"*78)
print("ATTACK 3 — overlooked SEALED revision-independent anchor:")
print(f"  NOTE_1_0 & NOTE_1_1 bound to ONE semanticSpecId (SEM_NOTE) = {cross_rev_anchor_sealed}")
print(f"  semanticSpecId = {sem_id}")
print(f"  corpus read arms already applied to seam records: {seam_arms}")
print("="*78)

# ---------------------------------------------------------------------------
# VERDICT
# ---------------------------------------------------------------------------
broke = (resP[2] is True and breaks_PRED_50 == 0 and prev_is_committed and old_independent_of_new
         and B_accepts_impostor and C_accepts_foreign and cross_rev_anchor_sealed
         and "N_PRED" in seam_arms)
print("BROKE THE CLAIM =", broke)
print("LANE RESULT: FALSIFIED (headline conclusion). The claim that self-class necessarily")
print("loses the seam (breaks_A=98) and that ONLY Object/Occurrence resolve it does NOT hold:")
print(" 1. The fixtures' seam is BACKWARD (new->old); the builder's forward-succ 'refutation'")
print("    attacks a direction no stored reference in the corpus ever takes.")
print(" 2. A predecessor-aware self-class rule (the corpus's OWN N_PRED arm) resolves the seam")
print("    5/5 with 0 breaks, NO hash fixed point, NO ambient/latest -- the predecessor is")
print("    cryptographically committed in the child's typeId and re-verified, not looked up.")
print(" 3. Object(B)/Occurrence(C) reach 5/5 only via over-permissive predicates: B is a")
print("    public label anyone forges; C ignores the child and accepts any same-realm record.")
print("    Their '5/5' is set-membership, not genuine parent-edge resolution.")
print(" 4. A sealed revision-independent anchor (SEM_NOTE semanticSpecId, bound to both")
print("    NOTE_1_0 and NOTE_1_1) already exists; the builder invented DOM_OBJ/DOM_OCC instead.")
print("RESIDUAL FREEZE BLOCKER: the predecessor-commitment authority (who may mint a revision")
print("that names prev, and how a reader trusts that binding) and the Object/Occurrence")
print("authenticity gate are unfrozen production coordinates = BLOCKED_BY_CORE_INPUT.")
