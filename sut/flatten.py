# DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
# Flattens the sealed corpus into parallel arrays the Solidity test can parse.
import json, os
base = os.path.join(os.path.dirname(__file__), "..", "fixtures", "corpus.json")
C = json.load(open(base))
R, T, B = C["records"], C["types"], C["bindings"]

ids, arms, envs, tids, recTypes = [], [], [], [], []
bindIds, bindSems, bindTypes, bindAuth, mappings = [], [], [], [], []

for c in C["cases"]:
    ids.append(c["id"]); arms.append(c["consumer"])
    r = R[c["record"]]
    envs.append("0x" + r["envelopeHex"]); tids.append(r["typeId"] if r["typeId"].startswith("0x") else "0x" + r["typeId"])
    recTypes.append(r["type"])
    b = B.get(c["binding"]) if c["binding"] else None
    if b:
        bindIds.append("0x" + b["bindingId"]); bindSems.append(b["sem"])
        bindTypes.append(b["type"]); bindAuth.append(b["auth"]); mappings.append("0x" + b["mappingHex"])
    else:
        bindIds.append("0x" + "00" * 32); bindSems.append(""); bindTypes.append("")
        bindAuth.append(""); mappings.append("0x")

out = {
    "PIN_NOTE": "0x" + T["NOTE_1_0"]["typeId"] if not T["NOTE_1_0"]["typeId"].startswith("0x") else T["NOTE_1_0"]["typeId"],
    "PIN_ACT": "0x" + T["ACT_V1"]["typeId"],
    "FIN_NOTE": ["0x" + T["NOTE_1_0"]["typeId"], "0x" + T["NOTE_1_1"]["typeId"]],
    "FIN_ACT": ["0x" + T["ACT_V1"]["typeId"], "0x" + T["ACT_V1_1"]["typeId"]],
    "PINNED_BINDINGS": ["0x" + B[n]["bindingId"] for n in ["v_note10", "v_note11", "a_v1", "a_v11"]],
    "ISSUER_BINDINGS": ["0x" + B[n]["bindingId"] for n, b in B.items() if b["auth"] in ("issuer", "issuer-stolen")],
    "RECIP": "0x" + C["constants"]["RECIPIENT"],
    "CAP": C["constants"]["TRANSFER_CAP"],
    "ids": ids, "arms": arms, "envs": envs, "tids": tids, "recTypes": recTypes,
    "bindIds": bindIds, "bindSems": bindSems, "bindTypes": bindTypes,
    "bindAuth": bindAuth, "mappings": mappings,
}
open(os.path.join(os.path.dirname(__file__), "sut_cases.json"), "w").write(json.dumps(out, indent=1) + "\n")
print("flattened", len(ids), "cases; ISSUER_BINDINGS", len(out["ISSUER_BINDINGS"]))
