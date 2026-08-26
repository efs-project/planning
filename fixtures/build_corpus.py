# DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
# Builds the sealed integrated fixture corpus (types, records, bindings, cases).
# Deterministic: fixed constants only. Emits fixtures/corpus.json + SHA256SUMS.
import json, hashlib, sys, os
from keccak import keccak256
from abi_min import encode_tuple, encode_envelope, _word

DOM_TYPE = keccak256(b"EFSLAB/TOURN-2026-08-26/TYPE")
DOM_SCHEMA = keccak256(b"EFSLAB/TOURN-2026-08-26/SCHEMA")
DOM_RECORD = keccak256(b"EFSLAB/TOURN-2026-08-26/RECORD")
DOM_SEM = keccak256(b"EFSLAB/TOURN-2026-08-26/SEMSPEC")
DOM_BIND = keccak256(b"EFSLAB/TOURN-2026-08-26/VIEWBIND")

KIND = {"u64": 1, "bool": 2, "bytes": 3, "b32": 4}


def h(*parts):  # keccak over concatenated 32-byte words / raw bytes
    return keccak256(b"".join(parts))


def schema_bytes(fields):
    out = b""
    for key, kind, opt, mx in fields:
        out += key.to_bytes(2, "big") + bytes([KIND[kind], 1 if opt else 0]) + mx.to_bytes(4, "big")
    return out


def abi2(a: bytes, b: bytes) -> bytes:  # abi.encode(bytes32,bytes32)
    return a + b


def abi3(a: bytes, b: bytes, c: bytes) -> bytes:
    return a + b + c


TYPES = {}


def mk_type(name, fields, meaning):
    sb = schema_bytes(fields)
    sh = h(DOM_SCHEMA, sb)
    mh = keccak256(meaning.encode())
    tid = h(abi3(DOM_TYPE, mh, sh))
    TYPES[name] = {
        "fields": [{"key": k, "kind": kd, "opt": o, "max": m} for k, kd, o, m in fields],
        "meaning": meaning, "meaningHash": mh.hex(), "schemaHash": sh.hex(),
        "typeId": tid.hex(),
    }
    return tid


def components(fields, values):
    comps = []
    for (key, kind, opt, mx) in fields:
        v = values[key]
        t = ("opt", kind) if opt else kind
        comps.append((t, v))
    return comps


B = lambda i: bytes([i]) * 32  # deterministic bytes32 constants

# ---- Types --------------------------------------------------------------
N10f = [(1, "b32", False, 0), (2, "u64", False, 0), (3, "bytes", False, 512), (4, "b32", True, 0)]
mk_type("NOTE_1_0", N10f, "note/1.0: author,createdAt,body(utf8),replyTo->Note")
mk_type("NOTE_1_1", N10f + [(5, "bytes", True, 32)], "note/1.1: note/1.0 + optional inert mood")
mk_type("NOTE_1_2", N10f + [(5, "bytes", False, 32)], "note/1.2: body is ciphertext under required scheme (key 5 COLLIDES with 1.1 mood)")
mk_type("NOTE_2_0", [(1, "b32", False, 0), (2, "u64", False, 0), (3, "bytes", False, 2048), (4, "b32", True, 0)], "note/2.0: blocks(rich opaque list), breaking successor of note/1.x")
mk_type("NOTE_TWIN", N10f, "command/1.0: body is a shell command the reader must execute")  # same shape as NOTE_1_0
mk_type("SCI_DIST", [(1, "u64", False, 0), (2, "b32", False, 0)], "sci/length-meters: value in meters under frame")
mk_type("SCI_DUR", [(1, "u64", False, 0), (2, "b32", False, 0)], "sci/time-seconds: value in seconds under calibration")
AV1f = [(1, "b32", False, 0), (2, "u64", False, 0), (3, "b32", False, 0), (4, "u64", False, 0), (5, "b32", False, 0)]
mk_type("ACT_V1", AV1f, "action/1.0: actor,verb(1=EQUIP,2=TRANSFER),target,amountOrSlot(wei),basis")
mk_type("ACT_V1_1", AV1f + [(6, "bytes", True, 64)], "action/1.1: action/1.0 + optional inert memo")
mk_type("ACT_V2", AV1f + [(6, "bytes", True, 64), (7, "b32", True, 0)], "action/2.0: + optional DELEGATE who may also act (authority widening)")
mk_type("ACT_TWIN", AV1f, "action-gwei/1.0: identical shape, amountOrSlot in GWEI not wei")
mk_type("ITEMDEF", [(1, "bytes", False, 64), (2, "u64", False, 0), (3, "u64", False, 0), (4, "b32", False, 0)], "rpg/itemdef/1.0: name,slot,tagsBitfield,ruleset")
mk_type("ITEMINST", [(1, "b32", False, 0), (2, "b32", False, 0)], "rpg/iteminstance/1.0: def,owner")
mk_type("RULESET", [(1, "u64", False, 0), (2, "b32", False, 0)], "rpg/ruleset/1.0: version,rulesHash")
mk_type("CHAR", [(1, "b32", False, 0), (2, "u64", False, 0)], "rpg/character/1.0: owner,race(1=human,2=goblin)")

# tag bits / slots / verbs
ICE, SHIRT, PANTS = 1, 2, 4
TORSO, LEGS = 2, 3
EQUIP, TRANSFER = 1, 2

RECORDS = {}


def mk_record(name, tname, values, codec=0, raw_payload=None):
    t = TYPES[tname]
    fields = [(f["key"], f["kind"], f["opt"], f["max"]) for f in t["fields"]]
    payload = raw_payload if raw_payload is not None else encode_tuple(components(fields, values))
    env = encode_envelope(codec, payload)
    tid = bytes.fromhex(t["typeId"])
    rid = h(abi3(DOM_RECORD, tid, keccak256(env)))
    RECORDS[name] = {"type": tname, "typeId": t["typeId"], "envelopeHex": env.hex(), "recordId": rid.hex()}
    return rid, env


A1, P1, RECIP = B(0xA1), B(0x51), B(0xC1)
r_ruleset1, _ = mk_record("r_ruleset1", "RULESET", {1: 1, 2: B(0xE1)})
r_ruleset2, _ = mk_record("r_ruleset2", "RULESET", {1: 2, 2: B(0xE2)})
r_char_gob, _ = mk_record("r_char_gob", "CHAR", {1: P1, 2: 2})
r_item_ice, _ = mk_record("r_item_iceshirt", "ITEMDEF", {1: b"ice shirt", 2: TORSO, 3: ICE | SHIRT, 4: r_ruleset1})
r_item_pants, _ = mk_record("r_item_pants", "ITEMDEF", {1: b"wool pants", 2: LEGS, 3: PANTS, 4: r_ruleset1})
r_inst_ice, _ = mk_record("r_inst_ice", "ITEMINST", {1: r_item_ice, 2: r_char_gob})
r_inst_ice2, _ = mk_record("r_inst_ice2", "ITEMINST", {1: r_item_ice, 2: r_char_gob})
r_inst_pants, _ = mk_record("r_inst_pants", "ITEMINST", {1: r_item_pants, 2: r_char_gob})

r_note_ok, env_note_ok = mk_record("r_note_ok", "NOTE_1_0", {1: A1, 2: 1000, 3: b"hello world", 4: (False, b"\x00" * 32)})
mk_record("r_note_reply", "NOTE_1_0", {1: A1, 2: 1001, 3: b"re: hello", 4: (True, r_note_ok)})
mk_record("r_note11_mood", "NOTE_1_1", {1: A1, 2: 1002, 3: b"sunny post", 4: (False, b"\x00" * 32), 5: (True, b"sunny")})
mk_record("r_note11_nomood", "NOTE_1_1", {1: A1, 2: 1003, 3: b"plain post", 4: (False, b"\x00" * 32), 5: (False, b"")})
mk_record("r_note12", "NOTE_1_2", {1: A1, 2: 1004, 3: bytes.fromhex("f00dfeedc0ffee"), 4: (False, b"\x00" * 32), 5: b"aes-256-gcm"})
mk_record("r_note20", "NOTE_2_0", {1: A1, 2: 1005, 3: b"\x82\xa1blocks-opaque", 4: (False, b"\x00" * 32)})
# twin: byte-identical PAYLOAD to r_note_ok under a different-meaning Type
_p_note_ok = encode_tuple(components(N10f, {1: A1, 2: 1000, 3: b"hello world", 4: (False, b"\x00" * 32)}))
mk_record("r_twin", "NOTE_TWIN", {}, raw_payload=_p_note_ok)
mk_record("r_reply_x", "NOTE_1_1", {1: A1, 2: 1006, 3: b"cross-version reply", 4: (True, r_note_ok), 5: (False, b"")})
r_act_equip, _ = mk_record("r_act_equip", "ACT_V1", {1: r_char_gob, 2: EQUIP, 3: r_inst_ice, 4: TORSO, 5: B(0xB0)})
mk_record("r_hostile_backlink", "NOTE_1_0", {1: A1, 2: 1007, 3: b"see attached", 4: (True, r_act_equip)})
mk_record("r_sci_dist", "SCI_DIST", {1: 42, 2: B(0xF1)})
_p_sci = encode_tuple(components([(1, "u64", False, 0), (2, "b32", False, 0)], {1: 42, 2: B(0xF1)}))
mk_record("r_sci_dur", "SCI_DUR", {}, raw_payload=_p_sci)  # byte-identical payload, different meaning
r_act_transfer, _ = mk_record("r_act_transfer", "ACT_V1", {1: r_char_gob, 2: TRANSFER, 3: RECIP, 4: 500, 5: B(0xB1)})
mk_record("r_act_overcap", "ACT_V1", {1: r_char_gob, 2: TRANSFER, 3: RECIP, 4: 5000, 5: B(0xB1)})
mk_record("r_act_v11", "ACT_V1_1", {1: r_char_gob, 2: TRANSFER, 3: RECIP, 4: 500, 5: B(0xB1), 6: (True, b"gm")})
mk_record("r_act_v2_deleg", "ACT_V2", {1: r_char_gob, 2: TRANSFER, 3: RECIP, 4: 500, 5: B(0xB1), 6: (False, b""), 7: (True, B(0xDD))})
_p_transfer = encode_tuple(components(AV1f, {1: r_char_gob, 2: TRANSFER, 3: RECIP, 4: 500, 5: B(0xB1)}))
mk_record("r_act_twin", "ACT_TWIN", {}, raw_payload=_p_transfer)
mk_record("r_act_wrongtarget", "ACT_V1", {1: r_char_gob, 2: TRANSFER, 3: r_note_ok, 4: 500, 5: B(0xB1)})
mk_record("r_act_equip2", "ACT_V1", {1: r_char_gob, 2: EQUIP, 3: r_inst_ice2, 4: TORSO, 5: B(0xB2)})
mk_record("r_act_equip_pants", "ACT_V1", {1: r_char_gob, 2: EQUIP, 3: r_inst_pants, 4: LEGS, 5: B(0xB3)})
# unknown canonical codec (codec=1), unknown Type
mk_type("NOTE_FUTURE_CODEC", N10f, "note/9.9: future representation")
mk_record("r_unknown_codec", "NOTE_FUTURE_CODEC", {}, codec=1, raw_payload=b"\x9f\x01\x02\x03opaque-future")

# ---- malformed / noncanonical mutations of r_note_ok --------------------
MUT = {}
env = env_note_ok
MUT["m_trailing"] = env + b"\xde\xad\xbe"
# payload-level: rebuild envelope around a mutated payload
def reenv(payload):
    return encode_envelope(0, payload)
p = _p_note_ok
# noncanonical: body offset +32 with a zero gap word inserted before tail
head = p[:5 * 32]
body_tail = p[5 * 32:]
off = int.from_bytes(p[2 * 32:3 * 32], "big")
head2 = p[:2 * 32] + _word(off + 32) + p[3 * 32:5 * 32]
MUT["m_noncanon_offset"] = reenv(head2 + b"\x00" * 32 + body_tail)
# hidden nonzero in absent optional replyTo (present=false, value!=0)
vals = {1: A1, 2: 1000, 3: b"hello world", 4: (False, B(0x66))}
MUT["m_absent_nonzero"] = reenv(encode_tuple(components(N10f, vals)))
# swapped author/createdAt words (u64 gets dirty high bits)
MUT["m_swapped"] = reenv(_word(1000) + A1 + p[2 * 32:])
# body length lie (length > available)
lenpos = 5 * 32  # tail: len word then data
plie = p[:lenpos] + _word(4096) + p[lenpos + 32:]
MUT["m_len_lie"] = reenv(plie)
MUT["m_inner_short"] = reenv(p[:-16])
# dirty padding after body data
pd = bytearray(p)
pd[-1] = 0x99  # 'hello world' = 11 bytes, padded to 32; last byte is padding
MUT["m_pad_dirty"] = reenv(bytes(pd))
for k, v in MUT.items():
    RECORDS[k] = {"type": "NOTE_1_0", "typeId": TYPES["NOTE_1_0"]["typeId"], "envelopeHex": v.hex(), "recordId": h(abi3(DOM_RECORD, bytes.fromhex(TYPES["NOTE_1_0"]["typeId"]), keccak256(v))).hex()}

# ---- semantic specs and view bindings -----------------------------------
# mapping row: (uint8 srcKind 1=WORD,2=BYTES,3=CONST, uint16 headSlot, bytes32 const)
SEMS, BINDS = {}, {}


def mk_sem(name, meaning):
    mh = keccak256(meaning.encode())
    sid = h(abi2(DOM_SEM, mh))
    SEMS[name] = {"meaning": meaning, "semanticSpecId": sid.hex()}
    return sid


def mapping_bytes(rows):
    out = _word(len(rows))
    for kind, slot, const in rows:
        out += _word(kind) + _word(slot) + (const if const else b"\x00" * 32)
    return out


def mk_bind(name, sem, tname, rows, auth):
    sid = bytes.fromhex(SEMS[sem]["semanticSpecId"])
    tid = bytes.fromhex(TYPES[tname]["typeId"])
    mb = mapping_bytes(rows)
    bid = h(abi3(DOM_BIND, sid, tid) + keccak256(mb))
    BINDS[name] = {"sem": sem, "type": tname, "mappingHex": mb.hex(), "bindingId": bid.hex(), "auth": auth}


mk_sem("SEM_NOTE", "sem/note: author(b32), createdAt(u64), body(bytes utf8), replyTo(opt b32)")
mk_sem("SEM_ACT", "sem/action: actor,verb,target,amountWei,basis")
W, BY, C = 1, 2, 3
# NOTE_1_0 head slots: 0=author 1=createdAt 2=body(off) 3=replyTo.present 4=replyTo.value
note10_rows = [(W, 0, None), (W, 1, None), (BY, 2, None), (W, 4, None)]
mk_bind("v_note10", "SEM_NOTE", "NOTE_1_0", note10_rows, "deploy-pinned")
mk_bind("v_note11", "SEM_NOTE", "NOTE_1_1", note10_rows, "issuer")  # same slots; mood ignored
mk_bind("v_note12_att", "SEM_NOTE", "NOTE_1_2", note10_rows, "none")  # attacker-supplied, unregistered
mk_bind("v_note20_lossy", "SEM_NOTE", "NOTE_2_0", note10_rows, "issuer")  # blocks presented as utf8 body: LOSSY/dishonest-ish
mk_bind("v_twin_stolen", "SEM_NOTE", "NOTE_TWIN", note10_rows, "issuer-stolen")  # compromised issuer key
mk_bind("v_exactconst_forge", "SEM_NOTE", "NOTE_TWIN", [(C, 0, B(0xA1)), (W, 1, None), (BY, 2, None), (W, 4, None)], "none")
act_rows = [(W, 0, None), (W, 1, None), (W, 2, None), (W, 3, None), (W, 4, None)]
mk_bind("a_v1", "SEM_ACT", "ACT_V1", act_rows, "deploy-pinned")
mk_bind("a_v11", "SEM_ACT", "ACT_V1_1", act_rows, "issuer")
mk_bind("a_v2_drop", "SEM_ACT", "ACT_V2", act_rows, "issuer")  # drops delegate: hidden effect-relevant loss
mk_bind("a_twin_stolen", "SEM_ACT", "ACT_TWIN", act_rows, "issuer-stolen")

# ---- cases --------------------------------------------------------------
# Read arms: N_EXACT N_FIN N_SEMPIN N_SEMISS N_SEMOPEN N_PRED  (+ARCH once per record)
# Effect arms: A_EXACT A_FIN A_SEMPIN A_SEMISS A_PRED  (+callback suite separate)
cases = []


def case(cid, consumer, record, binding=None, note=""):
    cases.append({"id": cid, "consumer": consumer, "record": record, "binding": binding, "note": note})


NREAD = ["N_EXACT", "N_FIN", "N_SEMPIN", "N_SEMISS", "N_PRED"]
AEFF = ["A_EXACT", "A_FIN", "A_SEMPIN", "A_SEMISS", "A_PRED"]
BIND_FOR = {"NOTE_1_0": "v_note10", "NOTE_1_1": "v_note11", "NOTE_1_2": "v_note12_att",
            "NOTE_2_0": "v_note20_lossy", "NOTE_TWIN": "v_twin_stolen",
            "ACT_V1": "a_v1", "ACT_V1_1": "a_v11", "ACT_V2": "a_v2_drop", "ACT_TWIN": "a_twin_stolen"}
note_bodies = ["r_note_ok", "r_note_reply", "r_note11_mood", "r_note11_nomood", "r_note12",
               "r_note20", "r_twin", "r_reply_x", "r_hostile_backlink", "r_unknown_codec"]
for r in note_bodies:
    t = RECORDS[r]["type"]
    for arm in NREAD:
        b = BIND_FOR.get(t) if arm in ("N_SEMPIN", "N_SEMISS") else None
        case(f"{arm}.{r}", arm, r, b)
    case(f"ARCH.{r}", "ARCH", r)
case("N_SEMOPEN.r_twin.forge", "N_SEMOPEN", "r_twin", "v_exactconst_forge", "caller-supplied exactConstant forge; no gate")
case("N_SEMOPEN.r_note11", "N_SEMOPEN", "r_note11_mood", "v_note11", "caller-supplied honest binding; no gate")
case("N_SEMPIN.r_twin.forge", "N_SEMPIN", "r_twin", "v_exactconst_forge", "forge vs pin gate")
case("N_SEMISS.r_twin.forge", "N_SEMISS", "r_twin", "v_exactconst_forge", "forge vs issuer gate (unsigned)")
for m in MUT:
    case(f"N_EXACT.{m}", "N_EXACT", m)
    case(f"N_PRED.{m}", "N_PRED", m)
    case(f"ARCH.{m}", "ARCH", m)
case("N_EXACT.r_sci_dist", "N_EXACT", "r_sci_dist"); case("N_PRED.r_sci_dist", "N_PRED", "r_sci_dist")
case("N_EXACT.r_sci_dur", "N_EXACT", "r_sci_dur"); case("N_PRED.r_sci_dur", "N_PRED", "r_sci_dur")
act_bodies = ["r_act_transfer", "r_act_overcap", "r_act_v11", "r_act_v2_deleg", "r_act_twin", "r_act_wrongtarget"]
for r in act_bodies:
    t = RECORDS[r]["type"]
    for arm in AEFF:
        b = BIND_FOR.get(t) if arm in ("A_SEMPIN", "A_SEMISS") else None
        case(f"{arm}.{r}", arm, r, b)

state_script = [
    {"op": "admit", "realm": "A", "rev": 1, "record": "r_act_equip", "expect": "ADMITTED"},
    {"op": "admit", "realm": "B", "rev": 1, "record": "r_act_equip", "expect": "DENIED"},
    {"op": "equip", "record": "r_act_equip", "expectedRev": 0, "leavesOk": True, "expect": "EFFECT"},
    {"op": "policyRev", "realm": "A", "rev": 2, "note": "forbid NEW goblin+ICE equips; grandfather existing"},
    {"op": "equip", "record": "r_act_equip2", "expectedRev": 1, "leavesOk": True, "expect": "POLICY_DENIED"},
    {"op": "equip", "record": "r_act_equip_pants", "expectedRev": 1, "leavesOk": False, "expect": "REVERT_NO_PARTIAL"},
    {"op": "equip", "record": "r_act_equip_pants", "expectedRev": 7, "leavesOk": True, "expect": "CAS_CONFLICT"},
    {"op": "equip", "record": "r_act_equip_pants", "expectedRev": 1, "leavesOk": True, "expect": "EFFECT"},
    {"op": "equipReplay", "record": "r_act_equip_pants", "expectedRev": 1, "expect": "IDEMPOTENT_RECEIPT"},
    {"op": "withdraw", "record": "r_note_ok", "expect": "WITHDRAWN"},
    {"op": "checkCurrent", "record": "r_note_ok", "expect": "NOT_CURRENT"},
    {"op": "readHistorical", "record": "r_note_ok", "consumer": "N_EXACT", "expect": "OK"},
    {"op": "uniqueQuery", "grade": "PARTIAL", "count": 0, "expect": "PARTIAL_STOP"},
    {"op": "uniqueQuery", "grade": "COMPLETE", "count": 0, "expect": "PROCEED"},
    {"op": "lens", "inputs": ["UNKNOWN", "FOUND"], "expect": "UNKNOWN_STOP"},
    {"op": "lens", "inputs": ["ABSENT_PROVED", "FOUND"], "expect": "FOUND_FALLBACK"},
]
callback_cases = [
    {"id": "CB.ok", "validator": "honest", "record": "r_note_ok", "guarded": False},
    {"id": "CB.revert", "validator": "revert", "record": "r_note_ok", "guarded": False},
    {"id": "CB.gasgrief.naive", "validator": "gasgrief", "record": "r_note_ok", "guarded": False},
    {"id": "CB.gasgrief.guarded", "validator": "gasgrief", "record": "r_note_ok", "guarded": True},
    {"id": "CB.bomb.naive", "validator": "bomb", "record": "r_note_ok", "guarded": False},
    {"id": "CB.bomb.guarded", "validator": "bomb", "record": "r_note_ok", "guarded": True},
    {"id": "CB.reenter", "validator": "reenter", "record": "r_note_ok", "guarded": True},
    {"id": "CB.mutate", "validator": "mutable", "record": "r_note_ok", "guarded": True},
    {"id": "CB.addrmeaning", "validator": "addr", "record": "r_note_ok", "guarded": True},
]

corpus = {
    "disclaimer": "DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false; all IDs fixture-local; production coordinates BLOCKED_BY_CORE_INPUT",
    "domains": {k: v.hex() for k, v in
                [("DOM_TYPE", DOM_TYPE), ("DOM_SCHEMA", DOM_SCHEMA), ("DOM_RECORD", DOM_RECORD),
                 ("DOM_SEM", DOM_SEM), ("DOM_BIND", DOM_BIND)]},
    "constants": {"TRANSFER_CAP": 1000, "RECIPIENT": RECIP.hex(), "ISSUER": "0x" + "11" * 20,
                  "ATTACKER": "0x" + "22" * 20},
    "types": TYPES, "semanticSpecs": SEMS, "bindings": BINDS, "records": RECORDS,
    "cases": cases, "stateScript": state_script, "callbackCases": callback_cases,
}
out = json.dumps(corpus, indent=1, sort_keys=True)
open(os.path.join(os.path.dirname(__file__), "corpus.json"), "w").write(out + "\n")
sha = hashlib.sha256(out.encode() + b"\n").hexdigest()
open(os.path.join(os.path.dirname(__file__), "SHA256SUMS"), "w").write(f"{sha}  corpus.json\n")
print(f"corpus.json sealed sha256={sha} types={len(TYPES)} records={len(RECORDS)} cases={len(cases)} state={len(state_script)} cb={len(callback_cases)}")
