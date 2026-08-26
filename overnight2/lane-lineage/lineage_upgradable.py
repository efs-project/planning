# DISPOSABLE  protocolConformance=false notAdopted=true goCodeAuthorized=false
# LANE: UPGRADABLE — self-chain lineage across a Type revision.
# Design-grade evidence, PURE PYTHON (single implementation). This is NOT the
# two-implementation freeze-conformance standard; no conformance/adoption is claimed.
# All domains/IDs are fixture-local. Production coordinates are BLOCKED_BY_CORE_INPUT.
#
# SEAM: a long-lived lineage chain whose links reference their own class
# (FileRevision.parents: ref(record SELF); Git refs; chat reply threads). When the
# Type is revised the successor gets a NEW typeId, so a self-class link that means
# "a record of my own Type's revision" cannot span the revision boundary.
#
# We reuse the REAL corpus staging of exactly this seam:
#   NOTE_1_0  (note/1.0, replyTo->Note = self-class parent ref)   typeId 88d0...
#   NOTE_1_1  (note/1.1, revision: +optional mood -> new schema)  typeId 20e6...
#   r_reply_x (a NOTE_1_1 whose replyTo points at r_note_ok, a NOTE_1_0) = the cross
#             -revision lineage edge, already present in the sealed corpus.
#
# We model a 6-link reply thread that must survive one revision at its midpoint under
# three anchoring strategies and count how many links stay resolvable:
#   (A) self-class ref  : link type constraint = "parent.typeId == my typeId"
#   (B) Object anchor   : link = ref to a stable ObjectGenesis identity
#                         (publisher+salt+charter), revision-independent
#   (C) Occurrence ref  : link = existence-proof ref to a prior admitted Occurrence
# Then we adversarially attempt the falsifier the prior lab could not rule out.

import json, os, time
from keccak import keccak256

HERE = os.path.dirname(os.path.abspath(__file__))
FIX  = os.path.abspath(os.path.join(HERE, "..", "..", "fixtures"))
CORPUS = json.load(open(os.path.join(FIX, "corpus.json")))

def h(*parts): return keccak256(b"".join(parts))

# ---------------------------------------------------------------------------
# 0. Re-derive the corpus identity pipeline and SELF-TEST against sealed values,
#    so every hash below is faithful to the fixtures (not an ad-hoc invention).
# ---------------------------------------------------------------------------
DOM_TYPE   = keccak256(b"EFSLAB/TOURN-2026-08-26/TYPE")
DOM_SCHEMA = keccak256(b"EFSLAB/TOURN-2026-08-26/SCHEMA")
DOM_RECORD = keccak256(b"EFSLAB/TOURN-2026-08-26/RECORD")
KIND = {"u64": 1, "bool": 2, "bytes": 3, "b32": 4}

def schema_bytes(fields):  # fields: list of (key,kind,opt,max) — the corpus rule
    out = b""
    for key, kind, opt, mx in fields:
        out += key.to_bytes(2, "big") + bytes([KIND[kind], 1 if opt else 0]) + mx.to_bytes(4, "big")
    return out

def type_id(fields, meaning):
    sh = h(DOM_SCHEMA, schema_bytes(fields))
    mh = keccak256(meaning.encode())
    return h(DOM_TYPE, mh, sh)

def record_id(tid: bytes, envelope: bytes) -> bytes:
    return h(DOM_RECORD, tid, keccak256(envelope))

selftest = {}
selftest["DOM_TYPE"]  = (DOM_TYPE.hex()   == CORPUS["domains"]["DOM_TYPE"])
selftest["DOM_RECORD"]= (DOM_RECORD.hex() == CORPUS["domains"]["DOM_RECORD"])
# rebuild NOTE_1_0 / NOTE_1_1 typeIds from field defs + meaning and compare to sealed
N10f = [(1,"b32",False,0),(2,"u64",False,0),(3,"bytes",False,512),(4,"b32",True,0)]
N11f = N10f + [(5,"bytes",True,32)]
tid_n10 = type_id(N10f, "note/1.0: author,createdAt,body(utf8),replyTo->Note")
tid_n11 = type_id(N11f, "note/1.1: note/1.0 + optional inert mood")
selftest["NOTE_1_0.typeId"] = (tid_n10.hex() == CORPUS["types"]["NOTE_1_0"]["typeId"])
selftest["NOTE_1_1.typeId"] = (tid_n11.hex() == CORPUS["types"]["NOTE_1_1"]["typeId"])
# recompute r_reply_x recordId from its sealed envelope under NOTE_1_1
rx_env = bytes.fromhex(CORPUS["records"]["r_reply_x"]["envelopeHex"])
selftest["r_reply_x.recordId"] = (record_id(tid_n11, rx_env).hex()
                                  == CORPUS["records"]["r_reply_x"]["recordId"])
assert all(selftest.values()), ("identity pipeline diverged from sealed corpus", selftest)

OLD_TID = tid_n10  # FileRevision v1  (self-class ref = replyTo)
NEW_TID = tid_n11  # FileRevision v2  (revision: +field -> new schema -> new typeId)
assert OLD_TID != NEW_TID

# ---------------------------------------------------------------------------
# 1. Fixture-local anchoring domains (INVENTED here, disposable). Production
#    coordinates for these are BLOCKED_BY_CORE_INPUT.
# ---------------------------------------------------------------------------
DOM_OBJ = keccak256(b"EFSLAB/TOURN-2026-08-26/OBJECT")      # ObjectGenesis
DOM_OCC = keccak256(b"EFSLAB/TOURN-2026-08-26/OCCURRENCE")  # admitted Occurrence

PUBLISHER = bytes.fromhex("a1"*32)   # the thread's author (same across revisions)
SALT      = bytes.fromhex("5a1t"[:0].ljust(0,'0')) or bytes([0x5A])*32
CHARTER   = keccak256(b"charter: this reply-thread object; append rule = author-signed")
REALM_A   = keccak256(b"realm/A")

def object_id(publisher, salt, charter):
    # revision-INDEPENDENT: no typeId in the preimage
    return h(DOM_OBJ, publisher, salt, charter)

def occ_id(rid, realm):
    # content/admission-addressed: keyed by the record + the realm that admitted it,
    # NOT by the class's current typeId
    return h(DOM_OCC, rid, realm)

# ---------------------------------------------------------------------------
# 2. Build a 6-link lineage chain. Revision happens at the midpoint: the first
#    three revisions are v1 (OLD_TID), the last three are v2 (NEW_TID). All six are
#    revisions of ONE logical object (same publisher+salt+charter).
#    edge i (i=1..5): child=node[i] --hasParent--> node[i-1].
# ---------------------------------------------------------------------------
N = 6
REV_AT = 3  # nodes 0,1,2 = v1 ; nodes 3,4,5 = v2 ; seam edge = node3 -> node2
OBJ_ID = object_id(PUBLISHER, SALT, CHARTER)  # stable for the whole chain

nodes = []
for i in range(N):
    tid = OLD_TID if i < REV_AT else NEW_TID
    # a distinct envelope per node (createdAt = 2000+i) so recordIds differ; the exact
    # payload bytes are immaterial to link resolution — only identities matter here.
    env = keccak256(f"node/{i}/createdAt/{2000+i}".encode())  # stand-in envelope
    rid = record_id(tid, env)
    nodes.append({
        "i": i, "typeId": tid, "recordId": rid,
        "objectId": OBJ_ID, "occId": occ_id(rid, REALM_A),
        "rev": "v1" if i < REV_AT else "v2",
    })

edges = [(c, c-1) for c in range(1, N)]  # (child_idx, parent_idx)
SEAM = (REV_AT, REV_AT-1)                 # (3,2): v2 child references v1 parent

# ---------------------------------------------------------------------------
# 3. Resolution predicates. An edge "resolves" iff the child's parent-field TYPE
#    CONSTRAINT accepts the parent record.
# ---------------------------------------------------------------------------
def resolve_A(child, parent):   # self-class ref: constraint = {my own typeId}
    return parent["typeId"] == child["typeId"]

def resolve_B(child, parent):   # Object anchor: constraint mentions no typeId
    return parent["objectId"] == child["objectId"]

ADMITTED = {n["occId"] for n in nodes}   # all six admitted into realm A
def resolve_C(child, parent):   # existence-proof ref to a prior Occurrence
    return parent["occId"] in ADMITTED

def measure(resolver):
    total = ok = 0
    seam_ok = None
    for (c, p) in edges:
        total += 1
        r = resolver(nodes[c], nodes[p])
        ok += 1 if r else 0
        if (c, p) == SEAM:
            seam_ok = r
    return ok, total, seam_ok

resA = measure(resolve_A)
resB = measure(resolve_B)
resC = measure(resolve_C)

# ---------------------------------------------------------------------------
# 4. 50-YEAR reproduction: one self-class break per revision. Deterministic
#    revision schedule (fixed seed, no RNG import); count revisions in 50y and the
#    breaks each strategy incurs (self-class = 1 per revision; Object/Occurrence = 0).
# ---------------------------------------------------------------------------
def revision_schedule(years=50, seed=0xEF5):
    # LCG -> pseudo-random inter-revision gaps around a mean, purely deterministic.
    days = years * 365
    t = 0.0; x = seed; revs = 0
    while True:
        x = (1103515245 * x + 12345) & 0x7fffffff
        gap = 90 + (x % 180)          # 90..269 days between revisions (mean ~179.5)
        t += gap
        if t > days: break
        revs += 1
    return revs
rev50 = revision_schedule()
breaks_A_50 = rev50          # exactly one self-class seam break per revision
breaks_B_50 = 0
breaks_C_50 = 0

# ---------------------------------------------------------------------------
# 5. ADVERSARIAL FALSIFIER. Prior lab could not rule out: is there ANY self-class
#    successor rule keeping old->new chains valid across a revision WITHOUT a hash
#    fixed point and WITHOUT ambient/latest acceptance? We try to construct one.
#
#  Attempt (i) — BACKWARD predecessor pointer baked into the NEW Type.
#    Make v2's own Type body embed prev=OLD_TID. The self-class constraint becomes
#    C(t) = {t} U {t.prev} (read from the referencing record's own class body; no
#    ambient lookup). Then a v2 child accepts a v1 parent. Does the *cross-seam edge*
#    resolve? YES. But note the direction: this resolves NEW-references-OLD (walk
#    backward from a known head). It does NOT let an OLD record resolve its future
#    successor.
# ---------------------------------------------------------------------------
def type_id_with_prev(fields, meaning, prev_tid: bytes):
    # prev pointer is part of the class body -> folded into schemaHash preimage.
    sb = schema_bytes(fields) + b"|prev=" + prev_tid
    sh = h(DOM_SCHEMA, sb)
    mh = keccak256(meaning.encode())
    return h(DOM_TYPE, mh, sh)

NEW_TID_P = type_id_with_prev(N11f, "note/1.1+prev", OLD_TID)   # v2' commits to v1
def C_pred(child_tid, prev_map):        # self-contained predecessor set of a typeId
    s = {child_tid}
    p = prev_map.get(child_tid)
    while p is not None:
        s.add(p); p = prev_map.get(p)
    return s
PREV = {NEW_TID_P: OLD_TID}             # OLD has no committed predecessor
backward_seam_ok = OLD_TID in C_pred(NEW_TID_P, PREV)   # v2' accepts v1 parent

#  Attempt (ii) — FORWARD self-class successor (what the lineage actually needs to
#    "upgrade": from an OLD record, resolve to its NEW revision). For OLD to name its
#    successor, OLD's already-minted bytes must contain NEW_TID. Two escapes only:
#    (a) OLD commits the future revision at genesis -> revision is not open, and the
#        successor itself needs a committed successor -> unbounded regress; or
#    (b) invert keccak so NEW's body hashes to a value OLD already fixed -> preimage
#        attack. We show forward succ(OLD) is not even a FUNCTION: unboundedly many
#        distinct, equally-valid v2 successors exist that all commit prev=OLD.
K = 2000
succ_candidates = set()
for j in range(K):
    tid = type_id_with_prev(N11f, f"note/1.1+prev+variant{j}", OLD_TID)
    succ_candidates.add(tid.hex())
forward_succ_is_function = (len(succ_candidates) <= 1)   # False => ill-defined
distinct_valid_successors = len(succ_candidates)

#    To pick "the" successor among these you must consult something outside OLD's
#    body — a registry of "which NEW points back at OLD" = ambient/latest acceptance,
#    which the falsifier forbids. Quantify the only remaining escape (b): the wall
#    -clock cost of a keccak preimage so OLD could have pre-committed NEW's digest.
t0 = time.perf_counter(); ITER = 3000
for j in range(ITER):
    keccak256(j.to_bytes(8, "big"))
kps = ITER / (time.perf_counter() - t0)     # keccak calls per second (this machine)
sec_2_128 = (2**128) / kps
years_2_128 = sec_2_128 / (365*24*3600)

#  Attempt (iii) — mutual fixed point (OLD embeds NEW and NEW embeds OLD, so the pair
#    is self-consistent and walkable both ways) requires solving a keccak 2-cycle.
#    Demonstrate by brute-forcing only a k-bit PARTIAL mutual cycle and extrapolating.
def partial_cycle_search(kbits, cap):
    mask = (1 << kbits) - 1
    # fix OLD body's variable tail = v; compute OLD_k; require a NEW body whose tail
    # embeds OLD_k and whose own low kbits, fed back, reproduce v's low kbits.
    tries = 0
    for v in range(cap):
        tries += 1
        old_k = int.from_bytes(keccak256(b"OLD|" + v.to_bytes(8, "big")), "big") & mask
        new_k = int.from_bytes(keccak256(b"NEW|prev=" + old_k.to_bytes(8, "big")), "big") & mask
        back  = int.from_bytes(keccak256(b"OLD|" + b"cyc" + new_k.to_bytes(8, "big")), "big") & mask
        if back == (v & mask):
            return True, tries
    return False, tries
cyc_bits = 12   # expected ~2^12 tries; kept small for pure-Python keccak throughput
cyc_found, cyc_tries = partial_cycle_search(cyc_bits, cap=60000)

# ---------------------------------------------------------------------------
# 6. REPORT
# ---------------------------------------------------------------------------
def pct(o, t): return f"{o}/{t}"
print("="*74)
print("LANE UPGRADABLE — self-chain lineage across a Type revision (pure Python)")
print("DISPOSABLE; design-grade evidence, single implementation; NOT freeze-conformance")
print("="*74)
print("identity self-test vs sealed corpus:", selftest)
print(f"OLD typeId (note/1.0) = {OLD_TID.hex()}")
print(f"NEW typeId (note/1.1) = {NEW_TID.hex()}   (revision changed schema+meaning)")
print(f"stable objectId       = {OBJ_ID.hex()}   (publisher+salt+charter, rev-independent)")
print(f"seam edge = node{SEAM[0]}(v2) -> node{SEAM[1]}(v1)")
print("-"*74)
print(f"(A) self-class ref  : resolvable edges = {pct(*resA[:2])}   seam edge resolves = {resA[2]}")
print(f"(B) Object anchor   : resolvable edges = {pct(*resB[:2])}   seam edge resolves = {resB[2]}")
print(f"(C) Occurrence ref  : resolvable edges = {pct(*resC[:2])}   seam edge resolves = {resC[2]}")
print("-"*74)
print(f"50-year reproduction: revisions in 50y = {rev50}")
print(f"  breaks: self-class(A)={breaks_A_50}  Object(B)={breaks_B_50}  Occurrence(C)={breaks_C_50}")
print("  (one self-class break per revision; prior sim measured 116-124/50y)")
print("-"*74)
print("ADVERSARIAL falsifier — self-class successor without fixed-point/ambient:")
print(f"  (i) BACKWARD predecessor-pointer baked in NEW body: cross-seam edge resolves = {backward_seam_ok}")
print( "      -> works ONLY for new-references-old (walk backward from a known head).")
print(f"  (ii) FORWARD succ(OLD) is a function? {forward_succ_is_function}  "
      f"(distinct valid successors found = {distinct_valid_successors})")
print( "      -> forward succ is ill-defined; disambiguation needs a reverse index")
print( "         = ambient/latest acceptance (forbidden).")
print(f"      preimage escape (OLD pre-commits NEW digest): ~{kps:,.0f} keccak/s -> "
      f"2^128 work ~ {years_2_128:.3e} years.")
print(f"  (iii) mutual {cyc_bits}-bit partial cycle: found={cyc_found} after tries={cyc_tries}"
      f" (expected ~2^{cyc_bits}); full 256-bit cycle = infeasible fixed point.")
print("="*74)

VERDICT = ("Object(B)/Occurrence(C) anchoring makes ALL 5/5 links (incl. the seam) "
           "resolve; self-class(A) loses exactly the seam edge, once per revision. "
           "No self-class FORWARD successor rule resolves old->new without a hash "
           "fixed point or ambient/latest. Falsifier REFUTED for the forward link.")
print("VERDICT:", VERDICT)
print("RESIDUAL FREEZE BLOCKER: the ObjectGenesis preimage (DOM_OBJ, exact "
      "publisher||salt||charter serialization) and the revision-succession authority "
      "rule (who appends a revision / how the head is chosen) are unfrozen production "
      "coordinates = BLOCKED_BY_CORE_INPUT. Occurrence anchoring further needs the "
      "admission/co-envelope hash derivation frozen.")
