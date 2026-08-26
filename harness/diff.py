# DISPOSABLE protocolConformance=false notAdopted=true goCodeAuthorized=false
# Differential comparison: independent Python oracle vs independent Solidity SUT.
import json, os, sys
base = os.path.dirname(__file__)
root = os.path.join(base, "..")
orc = {r["id"]: r for r in json.load(open(os.path.join(root, "oracle", "oracle_results.json")))}
sut = {r["id"]: r for r in json.load(open(os.path.join(root, "sut", "sut_results.json")))}

# collapse oracle detail-bearing outcomes to the shared vocabulary
def norm(o):
    return o

allids = sorted(set(orc) | set(sut))
mism = []
matrix = []
for i in allids:
    o = orc.get(i, {}).get("outcome", "MISSING")
    s = sut.get(i, {}).get("outcome", "MISSING")
    agree = (o == s)
    matrix.append({"id": i, "consumer": orc.get(i, sut.get(i, {})).get("consumer", "?"),
                   "oracle": o, "sut": s, "agree": agree})
    if not agree:
        mism.append((i, o, s))

os.makedirs(os.path.join(root, "RESULTS"), exist_ok=True)
json.dump(matrix, open(os.path.join(root, "RESULTS", "result_matrix.json"), "w"), indent=1)
print(f"cases {len(allids)}  agree {sum(1 for m in matrix if m['agree'])}  mismatch {len(mism)}")
for i, o, s in mism:
    print(f"  MISMATCH {i}: oracle={o} sut={s}")
if mism:
    sys.exit(1)
