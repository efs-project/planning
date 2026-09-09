// Read-only source diagnostic; all writes target a managed disposable Anvil.
// No new runtime implementation or performance-pass threshold is introduced.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  compileUpgrade,
  withUpgrade,
} from "../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs";
import { readUpgradeState } from "../2026-09-08-upgradeable-foundation/reference/upgrade-reader.mjs";
import {
  publication,
  groupLeaf,
  word,
  TX_GAS,
} from "../2026-09-05-c0-core/scripts/local-stateful.mjs";
import { ordinaryRecord } from "../2026-09-05-c0-core/reference/state-reader.mjs";
import {
  AbiCoder,
  keccak256,
} from "../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js";

const abi = AbiCoder.defaultAbiCoder();
const hash = (x) => keccak256(Buffer.from(x));
const cat = (...xs) => "0x" + xs.map((x) => x.replace(/^0x/, "")).join("");
const text = (x) =>
  cat(
    Buffer.byteLength(x).toString(16).padStart(4, "0"),
    Buffer.from(x).toString("hex"),
  );
const purpose = (x) =>
  keccak256(
    abi.encode(["bytes32", "bytes32"], [hash("efs2/purpose/1"), hash(x)]),
  );
const role = (x) =>
  keccak256(
    abi.encode(["bytes32", "bytes32"], [hash("efs2/fieldrole/1"), hash(x)]),
  );
const rawState = (s) =>
  Object.fromEntries(
    [
      "bootstrap",
      "counts",
      "records",
      "types",
      "envelopes",
      "principals",
      "admissions",
      "batches",
      "bindings",
      "postings",
      "occurrences",
    ].map((k) => [
      k,
      Array.isArray(s[k])
        ? s[k].map((x) =>
            typeof x === "object" ? { ...x, pin: undefined } : x,
          )
        : s[k],
    ]),
  );
const retainedFile = JSON.parse(
  readFileSync(
    new URL(
      "../2026-09-08-upgradeable-foundation/fixtures/managed-upgrade.json",
      import.meta.url,
    ),
  ),
);
const result = {
  standing: "SYNTHETIC_OPERATOR_RAW_CORE_BULK_ADMISSION_NOT_ROUTER_OR_WALLET",
  probeSourceHash: keccak256(readFileSync(new URL(import.meta.url))),
  byteStaging: "EXCLUDED",
  arms: [],
};

compileUpgrade();
await withUpgrade(async (lab) => {
  result.resources = lab.resources;
  result.cleanup = lab.cleanup;
  const types = Object.fromEntries(
    lab.inputs.candidates.groups.flatMap((g) =>
      g.members.map((m) => [m.name, m.temporaryTypeSchemaId]),
    ),
  );
  const A = retainedFile.filePublication.header.principalId;
  const leaf = (name, body) => ({ typeId: types[name], body });
  const id = (l) => ordinaryRecord(l.typeId, l.body);
  const set = (p, s, r, target) =>
    leaf("BindingSet/1", cat(p, s, r, "01", target, "0000"));
  let nonce = 70000;
  for (const g of lab.inputs.candidates.groups) {
    const r = await lab.publish(
      publication([groupLeaf(lab.inputs.meta, "0x" + g.groupHex)], nonce++),
    );
    assert.equal(r.receipt.status, "0x1");
  }
  assert.equal(
    (await lab.publish(retainedFile.rootPublication)).receipt.status,
    "0x1",
  );
  const before = await readUpgradeState(lab);
  assert.equal(before.outcome, "VERIFIED", before.reason);
  result.prestate = { basis: before.basis, counts: before.counts };

  for (const width of [1, 2, 3]) {
    const checkpoint = await lab.rpc("evm_snapshot", []);
    const leaves = [],
      revisions = [],
      wanted = [];
    for (let i = 0; i < width; i++) {
      const f = leaf(
        "ObjectGenesis/1",
        cat(
          A,
          hash("bulk-create-probe/" + i),
          "01",
          hash("efs2/files/meaning/file/1"),
        ),
      );
      const file = id(f),
        name = "bulk-" + i + ".txt",
        data = cat(Buffer.from("bulk file " + i + "\n").toString("hex"));
      const tree = leaf(
        "ChunkTree/1",
        cat(
          "0000100000000001",
          BigInt((data.length - 2) / 2)
            .toString(16)
            .padStart(16, "0"),
          keccak256(cat("00", data)),
        ),
      );
      const revision = leaf(
        "FileRevision/1",
        cat(
          file,
          id(tree),
          text("text/plain"),
          "01",
          text("utf-8"),
          "00",
          "0000",
        ),
      );
      const entry = leaf(
        "DirectoryEntry/1",
        cat(retainedFile.rootId, text(name), file, "00"),
      );
      const base = leaves.length;
      leaves.push(
        f,
        set(purpose("objects/publisher-charter/1"), file, word(1), file),
        tree,
        revision,
        set(
          purpose("files/revision-head/1"),
          file,
          role("files/current-revision/1"),
          id(revision),
        ),
        entry,
        set(
          purpose("files/name-slot/1"),
          retainedFile.rootId,
          role(name),
          id(entry),
        ),
      );
      revisions.push([base + 1, 0], [base + 4, 0], [base + 6, 0]);
      wanted.push({
        file,
        revision: id(revision),
        entry: id(entry),
        tree: id(tree),
      });
    }
    const p = publication(leaves, nonce++, { principal: A, revisions });
    const prepared = await lab.prepare(p);
    let estimate;
    try {
      estimate = {
        gas: String(
          BigInt(
            await lab.rpc("eth_estimateGas", [
              { to: lab.core, data: lab.data(prepared), gas: "0x1000000" },
            ]),
          ),
        ),
      };
    } catch (e) {
      estimate = { error: e.message, data: e.data ?? null };
    }
    const written = await lab.submit(prepared);
    assert(BigInt(written.receipt.gasUsed) <= TX_GAS);
    const after = await readUpgradeState(lab);
    assert.equal(after.outcome, "VERIFIED", after.reason);
    const present = after.entries.filter((e) =>
      p.recordIds.includes(e.recordId),
    );
    if (written.receipt.status === "0x1") {
      assert.equal(
        present.length,
        7 * width,
        "all fresh leaves independently retained",
      );
      assert(
        wanted.every((x) =>
          Object.values(x).every((v) =>
            after.entries.some((e) => e.recordId === v),
          ),
        ),
      );
    } else {
      assert.equal(
        present.length,
        0,
        "failed bulk operation retains no partial file",
      );
      assert.deepEqual(
        rawState(after.snapshot),
        rawState(before.snapshot),
        "atomic rollback of retained inventory",
      );
    }
    const trace = await lab.rpc("debug_traceTransaction", [
      written.tx.hash,
      { tracer: "callTracer" },
    ]);
    const errorFrames = [];
    function failures(frame, path = "root") {
      if (frame.error)
        errorFrames.push({
          path,
          type: frame.type,
          error: frame.error,
          gas: frame.gas,
          gasUsed: frame.gasUsed,
          selector: frame.input?.slice(0, 10),
          output: frame.output ?? null,
        });
      for (const [i, child] of (frame.calls ?? []).entries())
        failures(child, path + "/" + i);
    }
    failures(trace);
    const arm = {
      width,
      leaves: leaves.length,
      calldataBytes: (written.tx.data.length - 2) / 2,
      status: written.receipt.status,
      gas: String(BigInt(written.receipt.gasUsed)),
      estimate,
      readback: after.outcome,
      retainedNewLeaves: present.length,
      errorFrames,
      before: before.basis,
      after: after.basis,
    };
    if (width === 2 && written.receipt.status === "0x0") {
      arm.separateControls = [];
      for (let i = 0; i < 2; i++) {
        const one = publication(leaves.slice(i * 7, (i + 1) * 7), nonce++, {
          principal: A,
          revisions: [
            [1, 0],
            [4, 0],
            [6, 0],
          ],
        });
        const tx = await lab.publish(one);
        assert.equal(
          tx.receipt.status,
          "0x1",
          "same exact file leaves fit separately",
        );
        const state = await readUpgradeState(lab);
        assert.equal(state.outcome, "VERIFIED", state.reason);
        assert(
          one.recordIds.every((id) =>
            state.entries.some((e) => e.recordId === id),
          ),
        );
        arm.separateControls.push({
          file: i + 1,
          gas: String(BigInt(tx.receipt.gasUsed)),
          status: tx.receipt.status,
          readback: state.outcome,
          basis: state.basis,
        });
      }
    }
    result.arms.push(arm);
    assert.equal(await lab.rpc("evm_revert", [checkpoint]), true);
  }
});
assert(result.cleanup.stopped);
console.log(
  JSON.stringify(result, (_, v) => (typeof v === "bigint" ? String(v) : v)),
);
