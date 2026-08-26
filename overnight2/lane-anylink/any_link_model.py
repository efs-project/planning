#!/usr/bin/env python3
# DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
# LANE HYPER / lane-anylink : generic ANY reference class for EFS 2.0 hyperstructure links.
#
# EVIDENCE CLASS: design-grade pure-Python model (single implementation). This is NOT the
# two-implementation freeze-conformance standard. No protocol bytes/IDs/caps are selected here;
# all constants and IDs are fixture-local. Production coordinates are BLOCKED_BY_CORE_INPUT.
#
# SEAM under test: a generic link role ref(record ANY). We model an ANY-reference class with
#   (a) admission-time existence proof (target already-admitted OR earlier co-enveloped in the
#       same publication),
#   (b) bounded backlink indexing (per-target fan-in cap),
#   (c) an explicitly-labeled UNVERIFIED variant for late / cross-Realm targets,
#   (d) NO-AUTHORITY invariant: resolving/traversing a link is decode/traverse only and can
#       never confer issuer/authority or cause an effect on the target.
# We compare against a naive bytes32-shadow ANY (no existence proof, unbounded index/traversal,
# and a resolver free to treat a link as conferring authority).
#
# KILL CRITERION being attacked: open Type discovery / ANY / unknown variants that grant
# authority or cause effects; attacker-shaped open graph traversal / unbounded work.

import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
FIX = os.path.abspath(os.path.join(HERE, "..", "..", "fixtures"))
sys.path.insert(0, HERE)  # local read-only copy of keccak.py
from keccak import keccak256  # noqa: E402

# ---- declared, fixture-local safety bounds (NOT protocol constants) ----------------------
BACKLINK_CAP = 64      # max stored inbound edges per target (index fan-in bound)
MAX_NODES    = 1024    # max distinct nodes a single traversal may visit
MAX_DEPTH    = 32      # max traversal depth

# ---- load corpus -------------------------------------------------------------------------
CORPUS = json.load(open(os.path.join(FIX, "corpus.json")))
RECORDS = CORPUS["records"]
TYPES = CORPUS["types"]

# Field layout per Type: which head-word index (in the ABI payload) holds each b32 reference
# candidate. Derived from fixtures/build_corpus.py Type definitions. Only b32 / opt-b32 fields
# can hold a recordId; u64/bytes fields cannot be links.
#   ACT_V1(.*): actor(w0,b32) verb(w1,u64) target(w2,b32=ANY) amount(w3,u64) basis(w4,b32)
#   NOTE_1_0/1_1/TWIN/FUTURE: author(w0,b32) createdAt(w1,u64) body(w2,bytes-off)
#                             replyTo(opt-b32: present=w3, value=w4)
#   ITEMINST: def(w0,b32) owner(w1,b32)
#   ITEMDEF: name(w0,bytes-off) slot(w1,u64) tags(w2,u64) ruleset(w3,b32)
#   CHAR: owner(w0,b32) race(w1,u64)   RULESET/SCI_*: (u64,b32) -- b32 is bare frame, not a link
ANY_LINK_FIELDS = {  # type -> list of (field_name, head_word_index, is_opt_present_pair)
    "ACT_V1":   [("target", 2, None)],
    "ACT_V1_1": [("target", 2, None)],
    "ACT_V2":   [("target", 2, None)],
    "ACT_TWIN": [("target", 2, None)],
    "NOTE_1_0": [("replyTo", 4, 3)],
    "NOTE_1_1": [("replyTo", 4, 3)],
    "NOTE_TWIN": [("replyTo", 4, 3)],
    "NOTE_FUTURE_CODEC": [("replyTo", 4, 3)],
    "ITEMINST": [("def", 0, None), ("owner", 1, None)],
    "ITEMDEF":  [("ruleset", 3, None)],
}

def payload_of(envhex):
    e = bytes.fromhex(envhex)
    ln = int.from_bytes(e[64:96], "big")   # env = abi.encode(uint16 codec, bytes payload)
    return e[96:96 + ln]

def head_word(p, i):
    return p[i * 32:(i + 1) * 32]

RID_TO_NAME = {}
for n, r in RECORDS.items():
    if "recordId" in r:
        RID_TO_NAME.setdefault(bytes.fromhex(r["recordId"]), n)

def all_record_ids():
    return set(RID_TO_NAME.keys())

def extract_links(name):
    """Return list of (field, target_id_bytes) ANY links physically present in a record's bytes."""
    r = RECORDS.get(name)
    if not r or "type" not in r or "envelopeHex" not in r:
        return []
    spec = ANY_LINK_FIELDS.get(r["type"])
    if not spec:
        return []
    p = payload_of(r["envelopeHex"])
    out = []
    for fname, wi, present_wi in spec:
        if wi * 32 + 32 > len(p):
            continue
        if present_wi is not None:
            present = int.from_bytes(head_word(p, present_wi), "big")
            if not present:
                continue
        out.append((fname, head_word(p, wi)))
    return out

# ==========================================================================================
#  SAFE MODEL : existence-proof + bounded-backlink + no-authority ANY reference class
# ==========================================================================================

VERIFIED, UNVERIFIED = "VERIFIED", "UNVERIFIED"
PRESENT, ABSENT_PROVED, UNVERIFIED_R = "PRESENT", "ABSENT_PROVED", "UNVERIFIED"

# Authority is a pure function of a record's own attester. Inbound/outbound links are NEVER
# an input. This is the structural no-authority guarantee.
ATTESTER = {}    # record name -> attester id
CAPS = {}        # attester id -> frozenset of caps
def authority_of(name):
    return CAPS.get(ATTESTER.get(name), frozenset())

class SafeStore:
    def __init__(self):
        self.admitted = {}                 # target_id(bytes) -> record name (global admitted set)
        self.realm = {}                    # record name -> realm
        self.backlinks = {}                # target_id -> list of source names (bounded to CAP)
        self.backlink_overflow = {}        # target_id -> count dropped past CAP
        self.unverified_edges = []         # (src, field, target_id) labelled links
        self.effects_on = {}               # record name -> count of effects (must stay 0 from links)

    def _index_backlink(self, target_id, src):
        lst = self.backlinks.setdefault(target_id, [])
        if len(lst) < BACKLINK_CAP:
            lst.append(src)
        else:
            self.backlink_overflow[target_id] = self.backlink_overflow.get(target_id, 0) + 1

    def admit_publication(self, pub, realm="A"):
        """pub: ordered list of (name, [(field, target_id, declared)]). Returns per-record verdict."""
        seen_in_pub = set()
        verdicts = []
        for name, links in pub:
            rejected = False
            reason = None
            for field, tgt, declared in links:
                if declared == VERIFIED:
                    exists = (tgt in self.admitted) or (tgt in seen_in_pub)
                    if not exists:
                        rejected = True
                        reason = f"existence-proof FAILED for VERIFIED {field}->{tgt.hex()[:12]}"
                        break
            if rejected:
                verdicts.append((name, "DENIED", reason))
                continue
            # admit
            rid = bytes.fromhex(RECORDS[name]["recordId"]) if name in RECORDS and "recordId" in RECORDS[name] else keccak256(name.encode())
            self.admitted[rid] = name
            self.realm[name] = realm
            seen_in_pub.add(rid)
            self.effects_on.setdefault(name, 0)
            for field, tgt, declared in links:
                # DECODE/TRAVERSE ONLY: indexing a backlink is data bookkeeping. It never calls
                # any effect handler and never touches authority of src or tgt.
                if declared == VERIFIED:
                    self._index_backlink(tgt, name)
                else:
                    self.unverified_edges.append((name, field, tgt))
            verdicts.append((name, "ADMITTED", None))
        return verdicts

    def resolve(self, target_id, declared=VERIFIED):
        """Decode-only resolution. Returns a status, never authority."""
        if declared == UNVERIFIED:
            # An UNVERIFIED link is NEVER treated as present unless the target is independently
            # admitted; even then we surface the label so consumers can gate on it.
            return UNVERIFIED_R
        if target_id in self.admitted:
            return PRESENT
        return ABSENT_PROVED   # existence proof guarantees this is a real "proved absent", not "unknown"

    def traverse(self, root_id, edges):
        """Bounded forward traversal. edges: dict[id -> list[id]]. Returns (visited, hit_bound)."""
        visited = set()
        stack = [(root_id, 0)]
        hit = None
        while stack:
            nid, depth = stack.pop()
            if nid in visited:
                continue
            if len(visited) >= MAX_NODES:
                hit = "MAX_NODES"
                break
            if depth >= MAX_DEPTH:
                hit = "MAX_DEPTH"
                # do not descend past depth cap; keep draining other branches
                continue
            visited.add(nid)
            for nxt in edges.get(nid, []):
                if nxt not in visited:
                    stack.append((nxt, depth + 1))
        return visited, hit

# ==========================================================================================
#  NAIVE bytes32-SHADOW : no existence proof, unbounded index, unbounded traversal,
#  and a resolver that a consumer is free to let confer authority.
# ==========================================================================================

class ShadowStore:
    def __init__(self):
        self.admitted = {}
        self.backlinks = {}    # UNBOUNDED

    def admit_publication(self, pub, realm="A"):
        verdicts = []
        for name, links in pub:
            rid = bytes.fromhex(RECORDS[name]["recordId"]) if name in RECORDS and "recordId" in RECORDS[name] else keccak256(name.encode())
            self.admitted[rid] = name            # accepts ANY bytes32, no existence proof
            for field, tgt, declared in links:
                self.backlinks.setdefault(tgt, []).append(name)   # unbounded fan-in
            verdicts.append((name, "ADMITTED", None))
        return verdicts

    def resolve(self, target_id, declared=None):
        # No existence proof: a miss is indistinguishable "unknown", easily mistaken for present.
        return "PRESENT" if target_id in self.admitted else "UNKNOWN"

    def resolve_confers_authority(self, target_id):
        """The dangerous reading the kill-criterion warns about: a shadow consumer treats a
        resolved/backlinked target as related and merges its authority. Modeled to show the loss."""
        name = self.admitted.get(target_id)
        return authority_of(name) if name else frozenset()

    def naive_traverse(self, root_id, edges, safety=5_000_000):
        """No visited-set dedup by design of the naive walker; only a huge safety valve so this
        script itself terminates. Returns (steps, terminated_naturally)."""
        stack = [root_id]
        steps = 0
        while stack:
            nid = stack.pop()
            steps += 1
            if steps >= safety:
                return steps, False   # would not have terminated on its own
            for nxt in edges.get(nid, []):
                stack.append(nxt)
        return steps, True

# ==========================================================================================
#  DRIVER : ground the model in the real corpus, then run the four attacks.
# ==========================================================================================

def line(c="-"):
    print(c * 88)

def main():
    print("LANE HYPER / lane-anylink -- generic ANY reference class (design-grade, single-impl)")
    print(CORPUS.get("disclaimer", ""))
    line("=")

    # ---- Grounding: enumerate the real ANY links physically present in the fixture -----
    ids = all_record_ids()
    edges_real = []     # (src_name, field, target_id, target_name_or_None)
    dangling = []       # links whose target is not any record id (points at nothing)
    for name in sorted(RECORDS):
        for field, tgt in extract_links(name):
            tname = RID_TO_NAME.get(tgt)
            edges_real.append((name, field, tgt, tname))
            if tname is None:
                dangling.append((name, field, tgt))
    linkbearing_types = sorted(ANY_LINK_FIELDS.keys())
    print(f"[GROUND] records in corpus                : {len([r for r in RECORDS.values() if 'recordId' in r])}")
    print(f"[GROUND] distinct recordIds               : {len(ids)}")
    print(f"[GROUND] Types that carry an ANY link     : {len(linkbearing_types)}  {linkbearing_types}")
    print(f"[GROUND] ANY link edges physically present: {len(edges_real)}")
    print(f"[GROUND] edges whose target IS a record   : {len(edges_real)-len(dangling)}")
    print(f"[GROUND] edges whose target is NOT a record (dangling ANY): {len(dangling)}")
    for s, f, t in dangling:
        print(f"           dangling: {s}.{f} -> 0x{t.hex()[:16]}..  (bare 32B, no record)")
    print("[GROUND] sample resolvable ANY links (the class 34 real Types need):")
    for s, f, t, tn in edges_real:
        if tn is not None and s in ("r_act_equip", "r_act_wrongtarget", "r_hostile_backlink", "r_inst_ice", "r_note_reply"):
            print(f"           {s}.{f} -> {tn}")
    line("=")

    # ---- Authority fixture (fixture-local attesters/caps) --------------------------------
    ISSUER, ATTACKER = "ISSUER", "ATTACKER"
    for n in RECORDS:
        ATTESTER[n] = ISSUER
    ATTESTER["r_hostile_backlink"] = ATTACKER    # the hostile link record is issued by attacker
    CAPS[ISSUER] = frozenset({"EQUIP", "TRANSFER"})
    CAPS[ATTACKER] = frozenset()                 # attacker holds no caps

    # Build the VERIFIED publication from the real, resolvable edges, in admission order.
    # (content-hash refs are acyclic: a record's id depends on its bytes which include the ref,
    #  so targets are always admitted-before-source; we order leaves first.)
    order = ["r_ruleset1", "r_item_iceshirt", "r_char_gob", "r_inst_ice", "r_note_ok",
             "r_note_reply", "r_act_equip", "r_hostile_backlink", "r_act_wrongtarget"]
    def links_for(name, declared=VERIFIED):
        out = []
        for field, tgt in extract_links(name):
            # a bare (non-record) target cannot be a VERIFIED link; declare it UNVERIFIED
            d = declared if tgt in ids else UNVERIFIED
            out.append((field, tgt, d))
        return out

    # =====================================================================================
    print("ATTACK 1 -- dangling target (link points at nothing)")
    line()
    # r_act_transfer.target = 0xC1..C1 is a bare address, not a record. Declare it VERIFIED and
    # watch the existence proof reject it; then declare it UNVERIFIED and watch it be labelled.
    tgt_bare = None
    for f, t in extract_links("r_act_transfer"):
        if f == "target":
            tgt_bare = t
    assert tgt_bare is not None and tgt_bare not in ids, "expected r_act_transfer.target to be dangling"
    safe = SafeStore()
    # seed prerequisites so the ONLY failure is the dangling link
    safe.admit_publication([(n, links_for(n)) for n in ["r_char_gob"]])
    v_verified = safe.admit_publication([("r_act_transfer", [("target", tgt_bare, VERIFIED)])])
    v_unver    = safe.admit_publication([("r_act_transfer", [("target", tgt_bare, UNVERIFIED)])])
    r_present  = safe.resolve(tgt_bare, VERIFIED)
    r_unver    = safe.resolve(tgt_bare, UNVERIFIED)
    shadow = ShadowStore()
    s_verdict = shadow.admit_publication([("r_act_transfer", [("target", tgt_bare, VERIFIED)])])
    s_res = shadow.resolve(tgt_bare)
    print(f"  target bytes             : 0x{tgt_bare.hex()[:16]}.. (not any recordId)")
    print(f"  SAFE  VERIFIED admission  : {v_verified[0][1]}  ({v_verified[0][2]})")
    print(f"  SAFE  UNVERIFIED admission: {v_unver[0][1]}  -> resolve(UNVERIFIED)={r_unver} (never PRESENT)")
    print(f"  SAFE  resolve(VERIFIED)   : {r_present}  (proved-absent, not 'unknown')")
    print(f"  SHADOW admission          : {s_verdict[0][1]}   resolve()={s_res}  <-- admits dangling silently")
    a1_pass = (v_verified[0][1] == "DENIED" and r_unver == UNVERIFIED_R and r_present == ABSENT_PROVED
               and s_verdict[0][1] == "ADMITTED")
    print(f"  RESULT: existence-proof rejects dangling VERIFIED, labels UNVERIFIED; shadow admits blind -> {'PASS' if a1_pass else 'FAIL'}")
    line("=")

    # =====================================================================================
    print("ATTACK 2 -- link that tries to confer issuer/authority on its target")
    line()
    # r_hostile_backlink (attester=ATTACKER, 0 caps) has replyTo -> r_act_equip (attester=ISSUER,
    # {EQUIP,TRANSFER}). Prove target authority is invariant under the inbound hostile link, and
    # that the attacker gains nothing. Admitting the link fires zero effects on the target.
    safe2 = SafeStore()
    pub2 = [(n, links_for(n)) for n in order if n != "r_hostile_backlink"]
    safe2.admit_publication(pub2)
    tgt_equip = bytes.fromhex(RECORDS["r_act_equip"]["recordId"])
    auth_before = authority_of("r_act_equip")
    eff_before = safe2.effects_on.get("r_act_equip", 0)
    safe2.admit_publication([("r_hostile_backlink", links_for("r_hostile_backlink"))])
    auth_after = authority_of("r_act_equip")
    eff_after = safe2.effects_on.get("r_act_equip", 0)
    attacker_auth = authority_of("r_hostile_backlink")           # source's own authority
    # what a SHADOW consumer that lets links confer authority would hand the attacker:
    shadow2 = ShadowStore()
    shadow2.admit_publication([(n, links_for(n)) for n in order])
    shadow_attacker_gain = shadow2.resolve_confers_authority(tgt_equip)
    print(f"  target r_act_equip authority  before inbound hostile link : {sorted(auth_before)}")
    print(f"  target r_act_equip authority  after  inbound hostile link : {sorted(auth_after)}")
    print(f"  effects fired on target by admitting the link             : {eff_after - eff_before}")
    print(f"  attacker record's own authority (decode/traverse only)    : {sorted(attacker_auth)}")
    print(f"  SHADOW authority-conferring resolver would hand attacker  : {sorted(shadow_attacker_gain)}  <-- escalation")
    a2_pass = (auth_before == auth_after and (eff_after - eff_before) == 0 and attacker_auth == frozenset()
               and shadow_attacker_gain == frozenset({"EQUIP", "TRANSFER"}))
    print(f"  RESULT: authority invariant, 0 effects, attacker gains 0; shadow-reading leaks {sorted(shadow_attacker_gain)} -> {'PASS' if a2_pass else 'FAIL'}")
    line("=")

    # =====================================================================================
    print("ATTACK 3 -- cycle A -> B -> A (traversal must terminate with a declared bound)")
    line()
    # FINDING: exact content-hash ANY refs are acyclic by construction (a recordId is the hash of
    # bytes that already contain the ref, so you cannot embed the hash of a record that embeds
    # yours). A true cycle can therefore ONLY exist in the UNVERIFIED / late-bound / alias layer.
    # We build the cycle THERE and show the bounded traversal handles it.
    A = keccak256(b"alias:A"); B = keccak256(b"alias:B")
    cyc_edges = {A: [B], B: [A]}
    safe3 = SafeStore()
    visited, hit = safe3.traverse(A, cyc_edges)
    shadow3 = ShadowStore()
    steps, terminated = shadow3.naive_traverse(A, cyc_edges, safety=2_000_000)
    print(f"  SAFE   traversal visited nodes : {len(visited)}  hit_bound={hit}  (visited-set dedup; A,B only)")
    print(f"  SHADOW naive walk steps        : {steps}  terminated_naturally={terminated}  <-- non-terminating without a bound")
    a3_pass = (len(visited) == 2 and hit is None and terminated is False and steps >= 2_000_000)
    print(f"  RESULT: safe terminates at 2 nodes; naive walk hits {steps:,}-step safety valve unterminated -> {'PASS' if a3_pass else 'FAIL'}")
    line("=")

    # =====================================================================================
    print("ATTACK 4 -- adversarial fan-out graph (work must be bounded and declared)")
    line()
    N = 100_000
    victim = keccak256(b"victim")
    # (i) index griefing: N attacker records each backlink the victim.
    safe4 = SafeStore()
    safe4.admitted[victim] = "victim"
    for i in range(N):
        safe4._index_backlink(victim, f"atk{i}")
    stored = len(safe4.backlinks[victim]); overflow = safe4.backlink_overflow.get(victim, 0)
    shadow4 = ShadowStore()
    for i in range(N):
        shadow4.backlinks.setdefault(victim, []).append(f"atk{i}")
    shadow_stored = len(shadow4.backlinks[victim])
    # (ii) traversal fan-out: one root with N out-edges + a deep chain, bound must cap visits.
    root = keccak256(b"root")
    fan_edges = {root: [keccak256(f"leaf{i}".encode()) for i in range(N)]}
    # also a long chain to exercise depth cap
    chain = [keccak256(f"c{i}".encode()) for i in range(MAX_DEPTH * 4)]
    for i in range(len(chain) - 1):
        fan_edges[chain[i]] = [chain[i + 1]]
    fan_edges[root].append(chain[0])
    visited4, hit4 = safe4.traverse(root, fan_edges)
    print(f"  fan-out N                         : {N:,}")
    print(f"  SAFE   backlink index stored      : {stored}  (== CAP {BACKLINK_CAP})  overflow_counted={overflow:,}")
    print(f"  SHADOW backlink index stored      : {shadow_stored:,}  <-- O(N) attacker-controlled memory")
    print(f"  SAFE   traversal visited          : {len(visited4)}  hit_bound={hit4}  (<= MAX_NODES {MAX_NODES})")
    print(f"  declared bounds                   : BACKLINK_CAP={BACKLINK_CAP} MAX_NODES={MAX_NODES} MAX_DEPTH={MAX_DEPTH}")
    a4_pass = (stored == BACKLINK_CAP and overflow == N - BACKLINK_CAP and shadow_stored == N
               and len(visited4) <= MAX_NODES and hit4 == "MAX_NODES")
    print(f"  RESULT: index capped at {BACKLINK_CAP}, traversal capped at {MAX_NODES}; shadow stores {N:,} -> {'PASS' if a4_pass else 'FAIL'}")
    line("=")

    # ---- verdict roll-up -----------------------------------------------------------------
    results = {"A1_dangling": a1_pass, "A2_no_authority": a2_pass,
               "A3_cycle_bound": a3_pass, "A4_fanout_bound": a4_pass}
    print("SUMMARY")
    for k, v in results.items():
        print(f"  {k:20s}: {'PASS' if v else 'FAIL'}")
    allpass = all(results.values())
    print()
    print(f"ALL ATTACKS DEFENDED BY SAFE MODEL: {allpass}")
    print("WHAT THE NAIVE bytes32-SHADOW LOSES:")
    print("  - admits dangling ANY targets blind (no proved-absent vs unknown distinction)")
    print("  - a shadow consumer can let an inbound link confer target authority (issuer escalation)")
    print("  - traversal has no visited-set/bound: cycles never terminate; fan-out is O(attacker N)")
    print(f"  - backlink index is unbounded: attacker writes O(N)={N:,} entries into a victim's index")
    print("RESIDUAL FREEZE BLOCKER: exact ANY/SELF wire encoding + the existence-proof admission")
    print("  rule + the bound constants (BACKLINK_CAP/MAX_NODES/MAX_DEPTH) are unselected protocol")
    print("  bytes -> BLOCKED_BY_CORE_INPUT.")
    return allpass

if __name__ == "__main__":
    ok = main()
    sys.exit(0 if ok else 1)
