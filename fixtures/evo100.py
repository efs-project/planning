# DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
# EVO-100 stretch: heterogeneous 100-Type closure. 16 meaningful Types come from
# the sealed corpus; 84 are explicitly scale-only. Members exercise required,
# optional, lazy(ref), corrupt, unavailable, and unsupported states.
import json, os, hashlib
from keccak import keccak256

CORPUS = json.load(open(os.path.join(os.path.dirname(__file__), "corpus.json")))
DOM_TYPE = bytes.fromhex(CORPUS["domains"]["DOM_TYPE"])
DOM_SCHEMA = bytes.fromhex(CORPUS["domains"]["DOM_SCHEMA"])
KIND = {"u64": 1, "bool": 2, "bytes": 3, "b32": 4}


def schema_bytes(fields):
    out = b""
    for key, kind, opt, mx in fields:
        out += key.to_bytes(2, "big") + bytes([KIND[kind], 1 if opt else 0]) + mx.to_bytes(4, "big")
    return out


def type_id(meaning, fields):
    sh = keccak256(DOM_SCHEMA + schema_bytes(fields))
    mh = keccak256(meaning.encode())
    return keccak256(DOM_TYPE + mh + sh), mh, sh


types = []
# 16 meaningful, carried from the corpus (recompute from their fields)
for name, t in CORPUS["types"].items():
    fields = [(f["key"], f["kind"], f["opt"], f["max"]) for f in t["fields"]]
    tid, mh, sh = type_id(t["meaning"], fields)
    assert tid.hex() == t["typeId"], f"meaningful recompute mismatch {name}"
    types.append({"name": name, "status": "MEANINGFUL", "meaning": t["meaning"],
                  "fields": fields, "typeId": tid.hex()})

# 84 scale-only, deterministic. member states cycle through the required matrix.
STATES = ["REQUIRED", "OPTIONAL", "LAZY_REF", "CORRUPT", "UNAVAILABLE", "UNSUPPORTED"]
kinds = ["u64", "bool", "bytes", "b32"]
for i in range(84):
    n = 2 + (i % 4)  # 2..5 fields
    fields = []
    for j in range(n):
        kind = kinds[(i + j) % 4]
        opt = (j % 3 == 1)
        mx = 128 if kind == "bytes" else 0
        fields.append((j + 1, kind, opt, mx))
    meaning = f"scale-only/{i}: synthetic closure member, state={STATES[i % len(STATES)]}"
    tid, _, _ = type_id(meaning, fields)
    types.append({"name": f"SCALE_{i:03d}", "status": "SCALE_ONLY",
                  "state": STATES[i % len(STATES)], "meaning": meaning,
                  "fields": fields, "typeId": tid.hex()})

closure = {"disclaimer": "DISPOSABLE scale-only stretch; not production-scale evidence",
           "count": len(types), "meaningful": sum(1 for t in types if t["status"] == "MEANINGFUL"),
           "types": types}
out = json.dumps(closure, indent=1, sort_keys=True)
open(os.path.join(os.path.dirname(__file__), "evo100_closure.json"), "w").write(out + "\n")
sha = hashlib.sha256(out.encode() + b"\n").hexdigest()
print(f"evo100_closure sealed sha256={sha} count={closure['count']} meaningful={closure['meaningful']}")

# parallel-array field file for the Solidity reader (t0..t99)
fields_flat = {}
for i, t in enumerate(types):
    fields_flat[f"t{i}"] = {
        "keys": [f[0] for f in t["fields"]],
        "kinds": [KIND[f[1]] for f in t["fields"]],
        "opts": [1 if f[2] else 0 for f in t["fields"]],
        "maxes": [f[3] for f in t["fields"]],
    }
open(os.path.join(os.path.dirname(__file__), "evo100_fields.json"), "w").write(
    json.dumps(fields_flat, indent=1) + "\n")

# ---- Python cold reconstructor: 3 network-free runs ----
rollup = None
for run in range(3):
    acc = b"\x00" * 32  # seed matches Solidity bytes32(0) so the receipt is common
    match = 0
    for t in types:
        tid, _, _ = type_id(t["meaning"], t["fields"])
        if tid.hex() == t["typeId"]:
            match += 1
        acc = keccak256(acc + tid)
    if rollup is None:
        rollup = acc
    else:
        assert acc == rollup, "python cold run nondeterministic"
receipt = {"reconstructor": "python", "count": len(types), "match": match,
           "rollup": "0x" + rollup.hex(), "coldRuns": 3, "networkReads": 0}
open(os.path.join(os.path.dirname(__file__), "evo100_receipt_py.json"), "w").write(
    json.dumps(receipt, indent=1) + "\n")
print(f"python cold reconstruct: {match}/{len(types)} match, rollup=0x{rollup.hex()[:16]}...")
