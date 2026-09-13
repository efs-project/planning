import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { readLeftUint, verifyPatchedRuntime } from "./measure-helpers.mjs";

const artifact = `0x60${"00".repeat(32)}6001`;
const refs = { alpha: [{ start: 1, length: 32 }] };
const value = `0x${"11".repeat(32)}`;
const patched = `0x60${"11".repeat(32)}6001`;

test("accepts exactly the whitelisted immutable value and preserves every other byte", () => {
  const result = verifyPatchedRuntime({ artifactRuntime: artifact, actualRuntime: patched, immutableReferences: refs, expected: { alpha: { name: "owner", value } } });
  assert.equal(result.patchedRuntime, patched);
  assert.deepEqual(result.ranges, [{ id: "alpha", name: "owner", start: 1, length: 32, value }]);
});

test("rejects a wrong immutable value", () => {
  assert.throws(() => verifyPatchedRuntime({ artifactRuntime: artifact, actualRuntime: `0x60${"22".repeat(32)}6001`, immutableReferences: refs, expected: { alpha: { name: "owner", value } } }), /immutable owner mismatch/);
});

test("rejects any difference outside immutable ranges", () => {
  assert.throws(() => verifyPatchedRuntime({ artifactRuntime: artifact, actualRuntime: `${patched.slice(0, -2)}02`, immutableReferences: refs, expected: { alpha: { name: "owner", value } } }), /non-immutable runtime byte mismatch/);
});

test("rejects missing, unexpected, overlapping, or non-32-byte references", () => {
  assert.throws(() => verifyPatchedRuntime({ artifactRuntime: artifact, actualRuntime: patched, immutableReferences: refs, expected: {} }), /immutable id set mismatch/);
  assert.throws(() => verifyPatchedRuntime({ artifactRuntime: artifact, actualRuntime: patched, immutableReferences: refs, expected: { alpha: { name: "owner", value }, beta: { name: "extra", value } } }), /immutable id set mismatch/);
  assert.throws(() => verifyPatchedRuntime({ artifactRuntime: artifact, actualRuntime: patched, immutableReferences: { alpha: [{ start: 1, length: 31 }] }, expected: { alpha: { name: "owner", value } } }), /must be 32 bytes/);
  assert.throws(() => verifyPatchedRuntime({ artifactRuntime: artifact, actualRuntime: patched, immutableReferences: { alpha: [{ start: 1, length: 32 }], beta: [{ start: 2, length: 32 }] }, expected: { alpha: { name: "owner", value }, beta: { name: "other", value } } }), /overlapping immutable ranges/);
});

test("decodes MUD left-aligned uint64 and uint32 fields", () => {
  assert.equal(readLeftUint(`0x${"0000000000000001"}${"00".repeat(24)}`, 8), 1n);
  assert.equal(readLeftUint(`0x${"00000002"}${"00".repeat(28)}`, 4), 2n);
  assert.throws(() => readLeftUint("0x01", 8), /expected 32-byte field/);
  assert.throws(() => readLeftUint(`0x${"00".repeat(32)}`, 0), /unsupported uint width/);
});

test("pinned Forge artifacts expose only the reviewed immutable ranges", () => {
  const artifactRoot = path.resolve(process.env.OUT_DIR ?? process.env.FOUNDRY_OUT ?? fileURLToPath(new URL("../out/", import.meta.url)));
  const expected = {
    "ImportLib.sol/ImportLib.json": { library_deploy_address: [{ start: 39, length: 32 }] },
    "IndexModule.sol/IndexModule.json": { "3835": [{ start: 2097, length: 32 }, { start: 3414, length: 32 }], "3837": [{ start: 3593, length: 32 }, { start: 4865, length: 32 }] },
    "Ledger.sol/Ledger.json": { "4429": [{ start: 945, length: 32 }, { start: 6539, length: 32 }], "4431": [{ start: 3682, length: 32 }, { start: 6586, length: 32 }], "4433": [{ start: 1235, length: 32 }, { start: 1295, length: 32 }, { start: 2865, length: 32 }, { start: 6504, length: 32 }] },
    "LensReader.sol/LensReader.json": { "5090": [{ start: 2445, length: 32 }, { start: 3147, length: 32 }, { start: 4844, length: 32 }, { start: 6288, length: 32 }, { start: 6426, length: 32 }, { start: 6754, length: 32 }, { start: 7784, length: 32 }], "5093": [{ start: 1294, length: 32 }, { start: 1960, length: 32 }, { start: 3056, length: 32 }, { start: 4157, length: 32 }, { start: 6094, length: 32 }, { start: 6666, length: 32 }, { start: 7268, length: 32 }, { start: 7881, length: 32 }] },
  };
  for (const [relative, ranges] of Object.entries(expected)) {
    const artifact = JSON.parse(readFileSync(path.join(artifactRoot, relative)));
    assert.deepEqual(artifact.deployedBytecode.immutableReferences, ranges, relative);
  }
});
