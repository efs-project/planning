# DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
# Independent pure expected-state oracle. Shares ONLY sealed corpus bytes and the
# HYPOTHESES prose with the Solidity SUT. Its decoder is written from scratch here.
import json, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "fixtures"))
from keccak import keccak256
from abi_min import encode_tuple  # canonical re-encoder (cross-checked vs `cast`)

CORPUS = json.load(open(os.path.join(os.path.dirname(__file__), "..", "fixtures", "corpus.json")))
TYPES, RECORDS, BINDS, SEMS = CORPUS["types"], CORPUS["records"], CORPUS["bindings"], CORPUS["semanticSpecs"]
CAP = CORPUS["constants"]["TRANSFER_CAP"]
RECIP = bytes.fromhex(CORPUS["constants"]["RECIPIENT"])

KIND = {"u64": 1, "bool": 2, "bytes": 3, "b32": 4}


class Bad(Exception):
    def __init__(self, sym): self.sym = sym


# ---- independent canonical decoder --------------------------------------
def _rd_word(b, i):
    if i + 32 > len(b): raise Bad("E_TRUNC_HEAD")
    return int.from_bytes(b[i:i + 32], "big"), b[i:i + 32]


def decode_envelope(env):
    # abi.encode(uint16 codec, bytes payload): head = [codecWord, offsetWord]
    if len(env) < 64: raise Bad("E_ENV_SHORT")
    codec, _ = _rd_word(env, 0)
    if codec >> 16: raise Bad("E_CODEC_RANGE")
    off, _ = _rd_word(env, 32)
    if off != 64: raise Bad("E_ENV_OFFSET")
    n, _ = _rd_word(env, 64)
    body = env[96:]
    if len(body) < n: raise Bad("E_ENV_LEN_LIE")
    pad = (32 - n % 32) % 32
    if len(body) != n + pad: raise Bad("E_ENV_TRAILING")
    if body[n:] != b"\x00" * pad: raise Bad("E_ENV_PAD_DIRTY")
    return codec, body[:n]


def decode_tuple(payload, fields):
    """fields: list of dicts {key,kind,opt,max}. Returns {key:value}. Canonical-checked."""
    head_specs = []
    for f in fields:
        dyn = (f["kind"] == "bytes")
        head_specs.append((f, dyn, 32))  # optional bytes head is also 32 (offset); static-opt handled below
    # compute head length: static opt (bool,u64/b32) inline 64; dynamic (opt or plain bytes) => 32 offset
    head_len = 0
    for f in fields:
        if f["kind"] == "bytes":
            head_len += 32
        elif f["opt"]:
            head_len += 64
        else:
            head_len += 32
    if len(payload) < head_len: raise Bad("E_HEAD_SHORT")
    vals, pos, expect_off = {}, 0, head_len
    tails = []
    for f in fields:
        k = f["key"]
        if f["kind"] == "bytes":
            off, _ = _rd_word(payload, pos); pos += 32
            if off != expect_off: raise Bad("E_NONCANON_OFFSET")
            if f["opt"]:
                # dynamic tuple (bool present, bytes value): payload at off = [presentWord, innerOff=64, len,data]
                present, _ = _rd_word(payload, off)
                innoff, _ = _rd_word(payload, off + 32)
                if innoff != 64: raise Bad("E_OPT_INNER_OFF")
                n, _ = _rd_word(payload, off + 64)
                data = payload[off + 96: off + 96 + n]
                if len(data) != n: raise Bad("E_TRUNC_BYTES")
                pad = (32 - n % 32) % 32
                if payload[off + 96 + n: off + 96 + n + pad] != b"\x00" * pad: raise Bad("E_PAD_DIRTY")
                if present not in (0, 1): raise Bad("E_BOOL_RANGE")
                if not present and (n != 0): raise Bad("E_ABSENT_NONZERO")
                consumed = 96 + n + pad
                vals[k] = (bool(present), data)
                if f["max"] and n > f["max"]: raise Bad("E_OVER_MAX")
                tails.append((expect_off, consumed)); expect_off += consumed
            else:
                n, _ = _rd_word(payload, off)
                data = payload[off + 32: off + 32 + n]
                if len(data) != n: raise Bad("E_TRUNC_BYTES")
                pad = (32 - n % 32) % 32
                if payload[off + 32 + n: off + 32 + n + pad] != b"\x00" * pad: raise Bad("E_PAD_DIRTY")
                if f["max"] and n > f["max"]: raise Bad("E_OVER_MAX")
                vals[k] = data
                consumed = 32 + n + pad
                tails.append((expect_off, consumed)); expect_off += consumed
        elif f["opt"]:
            present, _ = _rd_word(payload, pos)
            w, raw = _rd_word(payload, pos + 32); pos += 64
            if present not in (0, 1): raise Bad("E_BOOL_RANGE")
            if not present and w != 0: raise Bad("E_ABSENT_NONZERO")
            if f["kind"] == "u64":
                if w >> 64: raise Bad("E_U64_RANGE")
                vals[k] = (bool(present), w)
            else:  # b32
                vals[k] = (bool(present), raw)
        else:
            w, raw = _rd_word(payload, pos); pos += 32
            if f["kind"] == "u64":
                if w >> 64: raise Bad("E_U64_RANGE")
                vals[k] = w
            elif f["kind"] == "bool":
                if w >> 1: raise Bad("E_BOOL_RANGE")
                vals[k] = bool(w)
            else:  # b32
                vals[k] = raw
    if expect_off != len(payload): raise Bad("E_PAYLOAD_TRAILING")
    return vals


def canonical_or_raise(env, tname):
    codec, payload = decode_envelope(env)
    if codec != 0:
        raise Bad("E_UNSUPPORTED_CODEC")  # decodable envelope, but unknown codec => not structurally interpretable
    fields = TYPES[tname]["fields"]
    vals = decode_tuple(payload, fields)
    # byte-identical re-encode check (the canonical law)
    comps = []
    for f in fields:
        t = ("opt", f["kind"]) if f["opt"] else f["kind"]
        comps.append((t, vals[f["key"]]))
    if encode_tuple(comps) != payload:
        raise Bad("E_NONCANON")
    return vals


def structural_grade(recname):
    r = RECORDS[recname]
    env = bytes.fromhex(r["envelopeHex"])
    try:
        codec, payload = decode_envelope(env)
    except Bad as e:
        return ("STRUCTURAL_INVALID", e.sym, None)
    if codec != 0:
        return ("UNSUPPORTED", "E_UNSUPPORTED_CODEC", None)  # raw retained, not invalid, not valid
    try:
        vals = canonical_or_raise(env, r["type"])
    except Bad as e:
        return ("STRUCTURAL_INVALID", e.sym, None)
    return ("STRUCTURAL_VALID", None, vals)


# ---- portable validity / realm / current-effect (H4 four results) -------
def portable_type_validity(recname):
    g, sym, _ = structural_grade(recname)
    return g if g != "STRUCTURAL_VALID" else "VALID"


# ---- consumer arms ------------------------------------------------------
PIN_NOTE = TYPES["NOTE_1_0"]["typeId"]
PIN_ACT = TYPES["ACT_V1"]["typeId"]
FIN_NOTE = {TYPES["NOTE_1_0"]["typeId"], TYPES["NOTE_1_1"]["typeId"]}
FIN_ACT = {TYPES["ACT_V1"]["typeId"], TYPES["ACT_V1_1"]["typeId"]}
# deploy-pinned binding NAMES (the consumer froze these bindingIds at deploy)
PINNED_BINDINGS = {"v_note10", "v_note11", "a_v1", "a_v11"}
# A binding "verifies under the pinned issuer key" if it was signed by that key —
# whether by the legitimate issuer OR by an attacker who stole the key. The
# consumer cannot distinguish the two; that indistinguishability IS the risk.
ISSUER_SIGNED = {name for name, b in BINDS.items() if b["auth"] in ("issuer", "issuer-stolen")}
ISSUER_STOLEN = {name for name, b in BINDS.items() if b["auth"] == "issuer-stolen"}


def _decoded(recname):
    g, sym, vals = structural_grade(recname)
    return g, sym, vals


def project_semantic(recname, binding_name):
    """Closed verifier: binding must commit pinned SemanticSpec + presented typeId;
    mapping is field-extraction/exactConstant only. Returns projected note dict or Bad."""
    b = BINDS[binding_name]
    if b["type"] != RECORDS[recname]["type"]:
        raise Bad("E_BIND_TYPE_MISMATCH")
    if b["sem"] not in ("SEM_NOTE", "SEM_ACT"):
        raise Bad("E_BIND_SEM_UNKNOWN")
    g, sym, vals = _decoded(recname)
    if g != "STRUCTURAL_VALID":
        raise Bad(sym or "E_UNREADABLE")
    return vals  # projection succeeds structurally; meaning still governed by which SemanticSpec is pinned


def note_semantic_checks(vals):
    # a base note reader needs author,createdAt,body; replyTo optional
    return {"author": vals[1].hex(), "createdAt": vals[2], "bodyLen": len(vals[3]),
            "replyTo": vals[4][1].hex() if vals[4][0] else None}


def accept_note_read(arm, recname, binding_name):
    r = RECORDS[recname]; tid = r["typeId"]
    g, sym, vals = _decoded(recname)
    if arm == "N_EXACT":
        if tid != PIN_NOTE: return ("REJECT", "not-pinned-type" if g != "UNSUPPORTED" else "unsupported-codec")
        if g != "STRUCTURAL_VALID": return ("REJECT", sym)
        return ("ACCEPT", note_semantic_checks(vals))
    if arm == "N_FIN":
        if tid not in FIN_NOTE: return ("REJECT", "not-in-finite-set")
        if g != "STRUCTURAL_VALID": return ("REJECT", sym)
        return ("ACCEPT", note_semantic_checks(vals))
    if arm in ("N_SEMPIN", "N_SEMISS", "N_SEMOPEN"):
        b = BINDS.get(binding_name)
        if b is None: return ("REJECT", "no-binding")
        # authorization gate first (before trusting the mapping's meaning)
        if arm == "N_SEMPIN":
            if binding_name not in PINNED_BINDINGS: return ("REJECT", "binding-not-pinned")
        elif arm == "N_SEMISS":
            if binding_name not in ISSUER_SIGNED: return ("REJECT", "binding-not-issuer-signed")
        elif arm == "N_SEMOPEN":
            pass  # caller-supplied binding trusted (unsafe arm)
        # binding must bind THIS consumer's pinned SemanticSpec (SEM_NOTE)
        if b["sem"] != "SEM_NOTE": return ("REJECT", "wrong-semantic-spec")
        try:
            vals = project_semantic(recname, binding_name)
        except Bad as e:
            return ("REJECT", e.sym)
        # exactConstant forge: mapping row kind 3 injects a constant author
        mb = bytes.fromhex(b["mappingHex"])
        nrows = int.from_bytes(mb[:32], "big")
        proj = dict(note_semantic_checks(vals))
        for i in range(nrows):
            kind = int.from_bytes(mb[32 + i * 96:64 + i * 96], "big")
            const = mb[64 + i * 96:96 + i * 96]
            if kind == 3 and i == 0:
                proj["author"] = const.hex()  # forged/constant author projects, but see caveat
                proj["_forgedAuthor"] = True
        return ("ACCEPT", proj)
    if arm == "N_PRED":
        # deploy-frozen straight-line predicate: structurally a note-shape (b32,u64,bytes,opt b32),
        # createdAt<2^40, body<=512. NO typeId pin.
        if g != "STRUCTURAL_VALID":
            return ("REJECT", sym)
        f = TYPES[r["type"]]["fields"]
        shape = [(x["key"], x["kind"], x["opt"]) for x in f]
        want = [(1, "b32", False), (2, "u64", False), (3, "bytes", False), (4, "b32", True)]
        # FINDING (round1 cluster B): a frozen predicate pins the EXACT shape.
        # Extra fields => reject (a real straight-line decoder sees trailing bytes).
        if shape != want: return ("REJECT", "shape-mismatch")
        if vals[2] >= (1 << 40): return ("REJECT", "createdAt-oob")
        if len(vals[3]) > 512: return ("REJECT", "body-oob")
        return ("ACCEPT", note_semantic_checks(vals))
    if arm == "ARCH":
        # archive/router: preserve raw bytes always; never authorize an effect
        env = bytes.fromhex(r["envelopeHex"])
        return ("STORE_RAW", {"bytesLen": len(env), "recordId": r["recordId"],
                              "grade": g, "authorizesEffect": False})
    return ("REJECT", "unknown-arm")


def action_semantic(vals):
    return {"actor": vals[1].hex(), "verb": vals[2], "target": vals[3].hex(),
            "amount": vals[4], "basis": vals[5].hex()}


def accept_action(arm, recname, binding_name):
    r = RECORDS[recname]; tid = r["typeId"]
    g, sym, vals = _decoded(recname)

    def effect_guard(a):
        # the effect itself: TRANSFER must be to RECIP and amount<=CAP; verb known
        if a["verb"] not in (1, 2): return ("DECODE_ONLY", "unknown-verb-no-effect")
        if a["verb"] == 2:
            if bytes.fromhex(a["target"]) != RECIP: return ("DECODE_ONLY", "wrong-recipient")
            if a["amount"] > CAP: return ("DECODE_ONLY", "over-cap")
        return ("EFFECT", a)

    if arm == "A_EXACT":
        if tid != PIN_ACT: return ("REJECT", "not-pinned-type")
        if g != "STRUCTURAL_VALID": return ("REJECT", sym)
        return effect_guard(action_semantic(vals))
    if arm == "A_FIN":
        if tid not in FIN_ACT: return ("REJECT", "not-in-finite-set")
        if g != "STRUCTURAL_VALID": return ("REJECT", sym)
        a = action_semantic(vals)  # v1.1 memo ignored for effect
        return effect_guard(a)
    if arm in ("A_SEMPIN", "A_SEMISS"):
        b = BINDS.get(binding_name)
        if b is None: return ("REJECT", "no-binding")
        if arm == "A_SEMPIN" and binding_name not in PINNED_BINDINGS: return ("REJECT", "binding-not-pinned")
        if arm == "A_SEMISS" and binding_name not in ISSUER_SIGNED: return ("REJECT", "binding-not-issuer-signed")
        if b["sem"] != "SEM_ACT": return ("REJECT", "wrong-semantic-spec")
        if g != "STRUCTURAL_VALID": return ("REJECT", sym)
        a = action_semantic(vals)
        res, why = effect_guard(a)
        # KEY SAFETY POINT: even if the SemanticSpec projection succeeds, an effectful
        # consumer must NOT let a future variant carry hidden effect-relevant semantics.
        # ACT_V2 adds a DELEGATE (field 7) the SEM_ACT projection cannot see.
        if RECORDS[recname]["type"] == "ACT_V2":
            return ("DECODE_ONLY", "future-variant-has-unprojected-effect-field(delegate)")
        return (res, why)
    if arm == "A_PRED":
        if g != "STRUCTURAL_VALID": return ("REJECT", sym)
        f = TYPES[r["type"]]["fields"]
        shape = [(x["key"], x["kind"], x["opt"]) for x in f]
        want = [(1, "b32", False), (2, "u64", False), (3, "b32", False), (4, "u64", False), (5, "b32", False)]
        if shape[:5] != want: return ("REJECT", "shape-mismatch")
        a = action_semantic(vals)
        return effect_guard(a)
    return ("REJECT", "unknown-arm")


# ---- run ----------------------------------------------------------------
def run():
    results = []
    for c in CORPUS["cases"]:
        arm = c["consumer"]
        if arm.startswith("N_") or arm == "ARCH":
            out, detail = accept_note_read(arm, c["record"], c["binding"])
        elif arm.startswith("A_"):
            out, detail = accept_action(arm, c["record"], c["binding"])
        else:
            out, detail = ("REJECT", "unknown-arm")
        results.append({"id": c["id"], "consumer": arm, "record": c["record"],
                        "binding": c["binding"], "outcome": out,
                        "detail": detail if isinstance(detail, str) else "ok",
                        "note": c.get("note", "")})
    return results


if __name__ == "__main__":
    res = run()
    json.dump(res, open(os.path.join(os.path.dirname(__file__), "oracle_results.json"), "w"), indent=1)
    from collections import Counter
    print("oracle cases:", len(res))
    print(Counter((r["consumer"], r["outcome"]) for r in res).most_common(40))
