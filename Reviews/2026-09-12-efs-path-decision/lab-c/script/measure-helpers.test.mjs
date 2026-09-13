import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  ABSTRACT_FIELDS,
  ANVIL_ONLY_CELLS,
  DEFAULT_CELLS,
  OPTIONAL_CELLS,
  PLACEMENT_FIELDS,
  SELECTION_FIELDS,
  abstractRow,
  assertAnvilClient,
  assertAnvilOnlyCells,
  assertUnrelatedCaller,
  checkAgreement,
  checkPaidRowOrdering,
  compareObservation,
  decodeAdmissionStatic,
  decodeBindingStatic,
  decodeEvidenceStatic,
  decodeRecordStatic,
  deriveAbstractResult,
  evidenceCategoryOf,
  paidObservationMatch,
  parseRunArgs,
  readLeftUint,
  selectCells,
  uintAt,
  verifyPatchedRuntime,
  wordAt,
} from "./measure-helpers.mjs";

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

// ---------------------------------------------------------------- sealed paid point/list slice helpers (pure)

const hexOf = (byteValues) => `0x${byteValues.map((b) => b.toString(16).padStart(2, "0")).join("")}`;
const word = (fill) => Array(32).fill(fill);
const be = (n, width) => Array.from({ length: width }, (_, i) => Number((BigInt(n) >> BigInt(8 * (width - 1 - i))) & 0xffn));

test("wordAt / uintAt read MUD packed static regions at arbitrary byte offsets and refuse short replies", () => {
  const blob = hexOf([...word(0xaa), 0x04, ...be(0x1234, 4), ...be(7, 8)]);
  assert.equal(wordAt(blob, 0), `0x${"aa".repeat(32)}`);
  assert.equal(uintAt(blob, 32, 1), 4n);
  assert.equal(uintAt(blob, 33, 4), 0x1234n);
  assert.equal(uintAt(blob, 37, 8), 7n);
  assert.throws(() => wordAt(blob, 14), /short reply/);
  assert.throws(() => uintAt(blob, 44, 2), /short reply/);
  assert.throws(() => uintAt("0xzz", 0, 1), /even-length hex/);
});

test("decodeRecordStatic / decodeBindingStatic / decodeAdmissionStatic / decodeEvidenceStatic decode exact-length rows and refuse any other length", () => {
  const T = `0x${"01".repeat(32)}`, P = `0x${"02".repeat(32)}`, S = `0x${"03".repeat(32)}`, R = `0x${"04".repeat(32)}`, G = `0x${"05".repeat(32)}`;
  const rec = decodeRecordStatic(hexOf([...word(0x01), ...be(9, 8)]));
  assert.deepEqual(rec, { typeId: T, firstAdmission: 9n });
  assert.throws(() => decodeRecordStatic(hexOf(word(0x01))), /Records static region must be 40 bytes/);
  const bind = decodeBindingStatic(hexOf([...word(0x02), ...be(3, 4), ...be(11, 8)]));
  assert.deepEqual(bind, { target: P, revision: 3n, admission: 11n });
  assert.throws(() => decodeBindingStatic(hexOf(word(0x02))), /Bindings static region must be 44 bytes/);
  const adm = decodeAdmissionStatic(hexOf([...word(0x02), 4, ...word(0x01), 1, ...word(0x04), ...word(0x03), ...word(0x05), ...word(0x06), ...word(0x07), ...be(1, 4), ...word(0x08)]));
  assert.equal(adm.publicationId, P);
  assert.equal(adm.kind, 4n);
  assert.equal(adm.typeId, T);
  assert.equal(adm.digestKind, 1n);
  assert.equal(adm.digest, R);
  assert.equal(adm.purpose, S);
  assert.equal(adm.subject, G);
  assert.equal(adm.role, `0x${"06".repeat(32)}`);
  assert.equal(adm.target, `0x${"07".repeat(32)}`);
  assert.equal(adm.expectedRevision, 1n);
  assert.equal(adm.salt, `0x${"08".repeat(32)}`);
  assert.throws(() => decodeAdmissionStatic(hexOf(word(0x02))), /Admissions static region must be 262 bytes/);
  const ev = decodeEvidenceStatic(hexOf([...word(0x0a), 2, ...word(0x0b), ...word(0x0c), 27, ...be(2, 8), ...be(0, 8), ...word(0x0d), ...word(0x0e), ...word(0x0f), ...be(6, 8), ...be(2, 2), ...be(5, 8), ...word(0x10), ...word(0x11), ...word(0x00), 0]));
  assert.equal(ev.author, `0x${"0a".repeat(32)}`);
  assert.equal(ev.proofKind, 2n);
  assert.equal(ev.r, `0x${"0b".repeat(32)}`);
  assert.equal(ev.s, `0x${"0c".repeat(32)}`);
  assert.equal(ev.v, 27n);
  assert.equal(ev.nonce, 2n);
  assert.equal(ev.deadline, 0n);
  assert.equal(ev.acceptanceProfile, `0x${"0d".repeat(32)}`);
  assert.equal(ev.indexObligations, `0x${"0e".repeat(32)}`);
  assert.equal(ev.actionsHash, `0x${"0f".repeat(32)}`);
  assert.equal(ev.firstAdmission, 6n);
  assert.equal(ev.leafCount, 2n);
  assert.equal(ev.basis, 5n);
  assert.equal(ev.realmId, `0x${"10".repeat(32)}`);
  assert.equal(ev.coreCodeCommitment, `0x${"11".repeat(32)}`);
  assert.equal(ev.importOf, `0x${"00".repeat(32)}`);
  assert.equal(ev.sourceGrade, 0n);
  assert.throws(() => decodeEvidenceStatic(hexOf(word(0x0a))), /Evidence static region must be 325 bytes/);
});

test("evidenceCategoryOf maps C proof kinds to the experiment-local categories and refuses an unknown kind", () => {
  assert.equal(evidenceCategoryOf(1), "CONTRACT_ORIGINATED_PUBLICATION");
  assert.equal(evidenceCategoryOf("2"), "EOA_SIGNED_PUBLICATION");
  assert.equal(evidenceCategoryOf(2n, true), "EOA_SIGNED_PUBLICATION_EFFECT");
  assert.throws(() => evidenceCategoryOf(0), /unknown proof kind 0/);
  assert.throws(() => evidenceCategoryOf(3), /unknown proof kind 3/);
});

test("parseRunArgs reads --anvil and an exact --cells list and refuses unknown flags", () => {
  assert.deepEqual(parseRunArgs([]), { anvil: false, cells: null });
  assert.deepEqual(parseRunArgs(["--anvil"]), { anvil: true, cells: null });
  assert.deepEqual(parseRunArgs(["--cells", "typed-joined,c32-signed-framed", "--anvil"]), { anvil: true, cells: ["typed-joined", "c32-signed-framed"] });
  assert.deepEqual(parseRunArgs(["--cells=typed-joined/a1-without-placement"]), { anvil: false, cells: ["typed-joined/a1-without-placement"] });
  assert.throws(() => parseRunArgs(["--trace"]), /unknown argument --trace/);
  assert.throws(() => parseRunArgs(["--cells"]), /--cells requires a comma-separated list/);
  assert.throws(() => parseRunArgs(["--cells", ""]), /--cells requires a comma-separated list/);
});

test("selectCells keeps the optional paired control out of the default run and admits it only by its exact name", () => {
  assert.deepEqual(selectCells(null, { defaults: DEFAULT_CELLS, optional: OPTIONAL_CELLS }), DEFAULT_CELLS);
  assert.deepEqual(selectCells(["c32-signed-framed", "typed-joined"], { defaults: DEFAULT_CELLS, optional: OPTIONAL_CELLS }), ["typed-joined", "c32-signed-framed"]);
  assert.deepEqual(selectCells(["typed-joined/a1-without-placement"], { defaults: DEFAULT_CELLS, optional: OPTIONAL_CELLS }), ["typed-joined/a1-without-placement"]);
  assert.deepEqual(selectCells(["typed-joined/a1-without-placement", "typed-joined"], { defaults: DEFAULT_CELLS, optional: OPTIONAL_CELLS }), ["typed-joined", "typed-joined/a1-without-placement"]);
  assert.throws(() => selectCells(["typed-joined/a1"], { defaults: DEFAULT_CELLS, optional: OPTIONAL_CELLS }), /unknown cell typed-joined\/a1/);
  assert.throws(() => selectCells(["typed"], { defaults: DEFAULT_CELLS, optional: OPTIONAL_CELLS }), /unknown cell typed/);
  assert.throws(() => selectCells([], { defaults: DEFAULT_CELLS, optional: OPTIONAL_CELLS }), /no cell selected/);
  assert.throws(() => selectCells(["typed-joined", "typed-joined"], { defaults: DEFAULT_CELLS, optional: OPTIONAL_CELLS }), /duplicate cell typed-joined/);
  assert.ok(!DEFAULT_CELLS.includes("typed-joined/a1-without-placement"));
});

test("assertAnvilOnlyCells refuses the sealing cells without --anvil and leaves the other cells alone", () => {
  assert.deepEqual(assertAnvilOnlyCells(["c32-signed-framed", "record-fresh-isolated"], false), []);
  assert.deepEqual(assertAnvilOnlyCells(["typed-joined", "c32-signed-framed"], true), ["typed-joined"]);
  assert.throws(() => assertAnvilOnlyCells(["typed-joined"], false), /typed-joined run only on an owned --anvil chain/);
  assert.throws(() => assertAnvilOnlyCells(["c32-signed-framed", "typed-joined/a1-without-placement"], false), /typed-joined\/a1-without-placement run only/);
  assert.deepEqual(ANVIL_ONLY_CELLS, ["typed-joined", "typed-joined/a1-without-placement"]);
});

test("assertAnvilClient requires an anvil/ client version whenever a sealing cell is selected, before any state call", () => {
  assert.equal(assertAnvilClient("anvil/v1.7.1", ["typed-joined"]), "anvil/v1.7.1");
  assert.equal(assertAnvilClient("Geth/v1.14.0", []), "Geth/v1.14.0");
  assert.throws(() => assertAnvilClient("Geth/v1.14.0", ["typed-joined"]), /typed-joined require an owned Anvil chain; web3_clientVersion is Geth\/v1.14.0/);
  assert.throws(() => assertAnvilClient(undefined, ["typed-joined/a1-without-placement"]), /web3_clientVersion is undefined/);
});

test("assertUnrelatedCaller catches the deployer, an author, the producer or any lab contract (case-insensitive) and a non-address", () => {
  const caller = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
  const related = { deployer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "AUTHOR_A wallet": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "contract producer": "0x5FbDB2315678afecb367f032d93F642f64180aa3" };
  assert.equal(assertUnrelatedCaller(caller, related), true);
  assert.throws(() => assertUnrelatedCaller("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", related), /is not unrelated: it is the deployer/);
  assert.throws(() => assertUnrelatedCaller("0x5FbDB2315678afecb367f032d93F642f64180aa3", related), /it is the contract producer/);
  assert.throws(() => assertUnrelatedCaller("nope", related), /is not an address/);
  assert.throws(() => assertUnrelatedCaller(undefined, related), /is not an address/);
});

test("compareObservation compares every expected field after normalisation and reports each mismatch", () => {
  const observed = { a: "0xAB", b: 5n, c: true, d: "x" };
  assert.deepEqual(compareObservation(observed, { a: "0xab", b: "5", c: "true" }), { ok: true, fields: { a: { expected: "0xab", actual: "0xab", equal: true }, b: { expected: "5", actual: "5", equal: true }, c: { expected: "true", actual: "true", equal: true } } });
  const bad = compareObservation(observed, { a: "0xab", b: 6 });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.fields.b, { expected: "6", actual: "5", equal: false });
  assert.deepEqual(compareObservation(null, { a: 1 }), { ok: false, fields: { a: { expected: "1", actual: null, equal: false } } });
});

const SEAL = { kind: "seal", block: 40, hash: "0xseal", timestamp: 1000 };
const revertOk = { kind: "revert", block: 40, hash: "0xseal", nextTimestamp: 1001, pool: { pending: 0, queued: 0 } };
const txAt = (label, o = {}) => ({ kind: "tx", label, block: 41, parentHash: "0xseal", timestamp: 1001, txIndex: 0, txCount: 1, onlyTx: true, ...o });
const retained = (label) => ({ kind: "retained", label });

test("checkPaidRowOrdering accepts seal -> (revert -> first tx -> retained) x 4 and returns the rows in order", () => {
  const events = [SEAL];
  for (const label of ["paid-point-A", "paid-list-A", "paid-point-B", "paid-list-B"]) events.push(revertOk, txAt(label), retained(label));
  const rows = checkPaidRowOrdering(events);
  assert.deepEqual(rows.map((r) => [r.label, r.block, r.timestamp, r.retained]), [["paid-point-A", 41, 1001, true], ["paid-list-A", 41, 1001, true], ["paid-point-B", 41, 1001, true], ["paid-list-B", 41, 1001, true]]);
});

test("checkPaidRowOrdering catches every ordering violation", () => {
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt("a"), retained("a"), txAt("b"), retained("b")]), /row b is not the first transaction after a revert/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt("a"), revertOk, retained("a")]), /revert before row a was retained/);
  assert.throws(() => checkPaidRowOrdering([SEAL, { ...revertOk, hash: "0xother" }, txAt("a"), retained("a")]), /not the seal/);
  assert.throws(() => checkPaidRowOrdering([SEAL, { ...revertOk, nextTimestamp: 1005 }, txAt("a"), retained("a")]), /next block timestamp set to 1005/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt("a", { block: 42 }), retained("a")]), /mined at 42/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt("a", { parentHash: "0xstale" }), retained("a")]), /on 0xstale/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt("a", { timestamp: 1002 }), retained("a")]), /executed at timestamp 1002, expected 1001/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt("a", { txIndex: 1 }), retained("a")]), /transactionIndex 1, not 0/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt("a", { txCount: 2 }), retained("a")]), /not the only transaction in its block \(2 transactions\)/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt("a", { onlyTx: false }), retained("a")]), /not the only transaction/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, txAt("a")]), /row a was never retained/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, retained("a")]), /retained a without that row open/);
  assert.throws(() => checkPaidRowOrdering([revertOk, txAt("a"), retained("a")]), /first event must be the seal/);
  assert.throws(() => checkPaidRowOrdering([SEAL, SEAL, revertOk, txAt("a"), retained("a")]), /second seal/);
  assert.throws(() => checkPaidRowOrdering([{ kind: "seal", block: 40, hash: "0xseal" }, revertOk, txAt("a"), retained("a")]), /carries no timestamp/);
  assert.throws(() => checkPaidRowOrdering([SEAL]), /no paid row/);
  assert.throws(() => checkPaidRowOrdering([SEAL, revertOk, { kind: "what", label: "a" }]), /unknown event kind what/);
  assert.throws(() => checkPaidRowOrdering([SEAL, { ...revertOk, pool: { pending: 1, queued: 0 } }, txAt("a"), retained("a")]), /transaction pool is not empty after the revert \(pending 1, queued 0\)/);
  assert.throws(() => checkPaidRowOrdering([SEAL, { ...revertOk, pool: { pending: 0, queued: 2 } }, txAt("a"), retained("a")]), /pending 0, queued 2/);
  assert.throws(() => checkPaidRowOrdering([SEAL, { kind: "revert", block: 40, hash: "0xseal", nextTimestamp: 1001 }, txAt("a"), retained("a")]), /carries no txpool_status proof/);
});

const ZERO32 = `0x${"00".repeat(32)}`;
const A = `0x${"a1".repeat(32)}`, B = `0x${"b1".repeat(32)}`, A2 = `0x${"a2".repeat(32)}`, B1 = `0x${"b0".repeat(32)}`, FILE = `0x${"f1".repeat(32)}`, PAIR = `0x${"9a".repeat(32)}`, ETH = `0x${"e1".repeat(32)}`, USDC = `0x${"e2".repeat(32)}`;
const selectionA = { basisAdmission: "16", indexGeneration: "1", rulesEpoch: "1", coreCodeCommitment: `0x${"cc".repeat(32)}`, realmId: `0x${"11".repeat(32)}`, lensHash: `0x${"ab".repeat(32)}`, subject: FILE, selectedHead: A2, selectedRevision: "2", selectedAdmission: "14", selectedBindingKey: `0x${"bb".repeat(32)}`, selectedPublication: `0x${"70".repeat(32)}`, selectedAuthor: A, selectedProofKind: "2", selectedSourceGrade: "0", quoteFirstAdmission: "13", pairId: PAIR, itemA: ETH, itemB: USDC, mantissa: "2502000000", scale: "6", observedAt: "1800000000", note: `0x${"77".repeat(32)}` };
const placementOne = { folder: `0x${"5a".repeat(32)}`, name: `0x${"4e".repeat(32)}`, target: FILE, actor: A, revision: "1", admission: "11", bindingKey: `0x${"b2".repeat(32)}`, publicationId: `0x${"71".repeat(32)}`, proofKind: "2", sourceGrade: "0", basisAdmission: "16", pageStatus: "1", rawTotal: "1", scanned: "1", hydrated: "4", selected: "1", endPosition: "1", ended: "true", coverageStatus: "1", coverageThrough: "16" };
const placementNone = Object.fromEntries(PLACEMENT_FIELDS.map((k) => [k, k === "ended" ? "false" : /^(folder|name|target|actor|bindingKey|publicationId)$/.test(k) ? ZERO32 : "0"]));
const REPLAY = { rpcId: 77, from: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", blockTag: "0x29", returnData: "0xdeadbeef", error: null };
function goodCheck(o = {}) {
  return { label: "typed-joined:paid-list-A/paid-observed", logCount: 1, fromLog: { kind: "0xkind", commitment: "0xc0", selection: selectionA, placement: placementOne }, fromReplay: { commitment: "0xc0", selection: selectionA, placement: placementOne }, commitmentsAgree: true, replayOk: true, match: true, ...o };
}
function evidenceFixture(o = {}) {
  return {
    operation: "PAID_LIST", lens: "LENS_A_FIRST", lensArr: [A, B], label: "typed-joined:paid-list-A", budget: 10,
    row: { operation: "paid-list-A", hash: "0xtx", block: 41, blockHash: "0xblk", status: 1, gas: "238579" },
    executed: { txIndex: 0, txCount: 1, txHashes: ["0xtx"], onlyTx: true, timestamp: 1001, parentHash: "0xseal", hash: "0xblk" },
    seal: { number: 40, hash: "0xseal", timestamp: 1000, snapshot: "0x3" },
    sealBasis: { admissionFrontier: "16", indexGeneration: "1", rulesEpoch: "1", coreCodeCommitment: `0x${"cc".repeat(32)}`, realmId: `0x${"11".repeat(32)}`, realmOrigin: `0x${"12".repeat(32)}` },
    chainId: "31337", addrs: { ledger: "0xL", reader: "0xR", index: "0xI", importLib: "0xM", consumer: "0xC" }, consumerCodehash: "0xch", ledgerCodehash: `0x${"cc".repeat(32)}`,
    coordinates: { subject: FILE, folder: `0x${"5a".repeat(32)}`, name: `0x${"4e".repeat(32)}`, placementBindingKey: `0x${"b2".repeat(32)}` },
    placementAtSeal: { status: "1", target: FILE, revision: "1", author: A, admission: "11", bindingKey: `0x${"b2".repeat(32)}`, publicationId: `0x${"71".repeat(32)}`, proofKind: "2", firstAdmission: "8", leafCount: "5", scopeEntries: "1", byLens: { LENS_A_FIRST: { status: "1", target: FILE, revision: "1", author: A, admission: "11" }, LENS_B_FIRST: { status: "1", target: FILE, revision: "1", author: A, admission: "11" } } },
    types: { QUOTE_T: `0x${"51".repeat(32)}`, PAIR_T: `0x${"52".repeat(32)}`, ITEM_T: `0x${"53".repeat(32)}` },
    headLabels: { [A2]: ["QUOTE_A2", "A2"], [B1]: ["QUOTE_B1", "B1"] },
    authorLabels: { [A]: ["AUTHOR_A", "EOA principal (mnemonic index 1)"], [B]: ["AUTHOR_B", "contract principal (Producer)"] },
    publicationLabels: { [`0x${"71".repeat(32)}`]: "A1", [`0x${"70".repeat(32)}`]: "A2", [`0x${"72".repeat(32)}`]: "B1" },
    caller: { address: REPLAY.from, derivationPath: "m/44'/60'/0'/0/3", index: 3 },
    profile: "road-c-lab Store-only MUD probe",
    ...o,
  };
}

test("abstractRow builds the arm-neutral comparison row with the RPC_OBSERVED grade and every required field", () => {
  const row = deriveAbstractResult({ check: goodCheck(), replay: REPLAY, evidenceFor: evidenceFixture() });
  assert.equal(row.inputEvidenceGrade, "RPC_OBSERVED");
  assert.match(row.standing, /never expected answers/);
  for (const k of ABSTRACT_FIELDS) assert.notEqual(row[k], undefined, `${k} present`);
  assert.equal(ABSTRACT_FIELDS.length, 27);
  assert.equal(SELECTION_FIELDS.length, 23);
  assert.equal(PLACEMENT_FIELDS.length, 20);
});

test("abstractRow catches a missing, unknown, ordinal-labelled, point-charged-lookup or partial-page row instead of defaulting it", () => {
  const valid = deriveAbstractResult({ check: goodCheck(), replay: REPLAY, evidenceFor: evidenceFixture() });
  const strip = (o, k) => { const c = { ...o }; delete c[k]; delete c.inputEvidenceGrade; delete c.standing; return c; };
  const bare = strip(valid, "nothing");
  assert.throws(() => abstractRow(strip(valid, "pageCoverage")), /missing field\(s\) pageCoverage/);
  assert.throws(() => abstractRow({ ...bare, placementProvenance: null }), /missing field\(s\) placementProvenance/);
  assert.throws(() => abstractRow({ ...bare, extraneous: 1 }), /unknown field\(s\) extraneous/);
  assert.throws(() => abstractRow({ ...bare, selectedRevision: "2" }), /fixture label/);
  assert.throws(() => abstractRow({ ...bare, selectedRevision: 2 }), /fixture label/);
  assert.throws(() => abstractRow({ ...bare, operation: "PAID_POINT", placementCoordinate: { ...bare.placementCoordinate, lookedUpByThisRow: true } }), /must not charge a directory lookup/);
  assert.throws(() => abstractRow({ ...bare, pageCoverage: { status: "PARTIAL" } }), /pageCoverage PARTIAL is not a pass/);
  assert.throws(() => abstractRow({ ...bare, lens: "LENS_NO_TIEBREAK" }), /lens LENS_NO_TIEBREAK/);
  assert.throws(() => abstractRow({ ...bare, operation: "READ" }), /operation READ/);
  assert.throws(() => abstractRow({ ...bare, rawEvidence: { ...bare.rawEvidence, selfCheck: { match: "yes" } } }), /selfCheck.match \(boolean\) is required/);
  assert.throws(() => abstractRow({ ...bare, presence: { outcome: "UNKNOWN" } }), /passing self-check must carry the established outcomes/);
  assert.throws(() => abstractRow({ ...bare, rawEvidence: { ...bare.rawEvidence, selfCheck: { match: false } } }), /failed self-check may not carry a derived success claim/);
  assert.doesNotThrow(() => abstractRow({ ...bare, operation: "PAID_POINT", placementCoordinate: { ...bare.placementCoordinate, lookedUpByThisRow: false }, pageCoverage: { status: "NOT_APPLICABLE" } }));
});

test("deriveAbstractResult keeps the labels and outcomes only for a fully passing self-check (list row)", () => {
  const row = deriveAbstractResult({ check: goodCheck(), replay: REPLAY, evidenceFor: evidenceFixture() });
  assert.equal(row.operation, "PAID_LIST");
  assert.equal(row.selectedFile, "FILE_QUOTE");
  assert.equal(row.selectedHead, "QUOTE_A2");
  assert.equal(row.selectedRevision, "A2");
  assert.equal(row.selectedPhysical.revisionOrdinal, "2");
  assert.equal(row.selectedPhysical.head, A2);
  assert.deepEqual(row.selectedAuthor, { label: "AUTHOR_A", principal: A, principalKind: "EOA principal (mnemonic index 1)" });
  assert.equal(row.selectedAuthorEvidenceCategory, "EOA_SIGNED_PUBLICATION");
  for (const k of ["presence", "support", "admission", "selection"]) assert.notEqual(row[k].outcome, "UNKNOWN", k);
  assert.equal(row.placementCoordinate.lookedUpByThisRow, true);
  assert.equal(row.placementProvenance.sourceStep, "A1");
  assert.equal(row.placementProvenance.actor, "AUTHOR_A");
  assert.equal(row.placementProvenance.evidenceCategory, "EOA_SIGNED_PUBLICATION_EFFECT");
  assert.equal(row.placementProvenance.independentOfContentSelection, true);
  assert.equal(row.pageCoverage.status, "COMPLETE");
  assert.equal(row.pageCoverage.ended, "true");
  assert.equal(row.candidateCoverage.status, "COMPLETE");
  assert.equal(row.executionBasis.txIndex, 0);
  assert.equal(row.executionBasis.txCount, 1);
  assert.equal(row.executionBasis.parentHash, "0xseal");
  assert.equal(row.observationBasis.admissionFrontier, "16");
  assert.deepEqual(row.pairCheck.orderedRefs, [ETH, USDC]);
  assert.equal(row.itemChecks[0].label, "ITEM_ETH");
  assert.equal(row.rawEvidence.selfCheck.match, true);
  assert.equal(row.paidExecution.gasUsed, "238579");
  assert.equal(row.paidExecution.caller, REPLAY.from);
});

test("deriveAbstractResult keeps B-first selection separate from the unchanged A placement provenance (point row: no directory lookup charged)", () => {
  const selB = { ...selectionA, selectedHead: B1, selectedRevision: "1", selectedAdmission: "16", selectedAuthor: B, selectedProofKind: "1", mantissa: "2501000000", quoteFirstAdmission: "15" };
  const check = goodCheck({ fromLog: { kind: "0xk", commitment: "0xc1", selection: selB, placement: placementNone }, fromReplay: { commitment: "0xc1", selection: selB, placement: placementNone } });
  const row = deriveAbstractResult({ check, replay: REPLAY, evidenceFor: evidenceFixture({ operation: "PAID_POINT", lens: "LENS_B_FIRST", lensArr: [B, A] }) });
  assert.equal(row.selectedHead, "QUOTE_B1");
  assert.equal(row.selectedRevision, "B1");
  assert.equal(row.selectedAuthor.label, "AUTHOR_B");
  assert.equal(row.selectedAuthorEvidenceCategory, "CONTRACT_ORIGINATED_PUBLICATION");
  assert.equal(row.placementCoordinate.lookedUpByThisRow, false);
  assert.equal(row.placementProvenance.actor, "AUTHOR_A");
  assert.equal(row.placementProvenance.sourceStep, "A1");
  assert.match(row.placementProvenance.establishedBy, /LENS_B_FIRST/);
  assert.equal(row.pageCoverage.status, "NOT_APPLICABLE");
});

test("deriveAbstractResult collapses every derived field to UNKNOWN with the reason when the self-check fails, keeping the raw observations", () => {
  const mismatch = deriveAbstractResult({ check: goodCheck({ replayOk: false, match: false }), replay: REPLAY, evidenceFor: evidenceFixture() });
  for (const k of ["presence", "support", "admission", "selection"]) assert.equal(mismatch[k].outcome, "UNKNOWN", k);
  assert.match(mismatch.presence.reason, /replay observation differs from the runner expectation/);
  assert.equal(mismatch.selectedHead, "UNKNOWN");
  assert.equal(mismatch.selectedRevision, "UNKNOWN");
  assert.equal(mismatch.selectedFile, "UNKNOWN");
  assert.equal(mismatch.selectedAuthorEvidenceCategory, "UNKNOWN");
  assert.equal(mismatch.candidateCoverage.status, "UNKNOWN");
  assert.equal(mismatch.pageCoverage.status, "UNKNOWN");
  assert.equal(mismatch.quoteCheck.outcome, "UNKNOWN");
  assert.equal(mismatch.placementProvenance.actor, "AUTHOR_A");
  assert.match(mismatch.placementProvenance.establishedBy, /SEPARATE seal raw replies/);
  assert.equal(mismatch.rawEvidence.selfCheck.match, false);
  assert.equal(mismatch.rawEvidence.paidObservedLog.commitment, "0xc0");
  assert.equal(mismatch.rawEvidence.replay.returnData, "0xdeadbeef");
  assert.equal(mismatch.paidExecution.gasUsed, "238579");
  const noLog = deriveAbstractResult({ check: goodCheck({ logCount: 0, fromLog: null, commitmentsAgree: false, match: false }), replay: REPLAY, evidenceFor: evidenceFixture() });
  assert.match(noLog.selection.reason, /no single PaidObserved log/);
  assert.equal(noLog.rawEvidence.paidObservedLog, null);
  const undecodable = deriveAbstractResult({ check: goodCheck({ fromReplay: { error: "could not decode" }, commitmentsAgree: false, replayOk: false, match: false }), replay: { ...REPLAY, error: "revert" }, evidenceFor: evidenceFixture() });
  assert.match(undecodable.admission.reason, /replay at the receipt block did not decode/);
  assert.equal(undecodable.paidExecution.revertData, "revert");
  const disagree = deriveAbstractResult({ check: goodCheck({ commitmentsAgree: false, match: false }), replay: REPLAY, evidenceFor: evidenceFixture() });
  assert.match(disagree.support.reason, /replay commitment differs from the log commitment/);
  const fieldMismatch = deriveAbstractResult({ check: goodCheck({ match: false }), replay: REPLAY, evidenceFor: evidenceFixture() });
  assert.match(fieldMismatch.selection.reason, /log observation differs from the runner expectation/);
});

test("deriveAbstractResult derives the placement provenance labels from the observed actor and publication, never from constants", () => {
  const row = deriveAbstractResult({ check: goodCheck(), replay: REPLAY, evidenceFor: evidenceFixture() });
  assert.equal(row.placementProvenance.sourceStep, "A1");
  assert.equal(row.placementProvenance.actor, "AUTHOR_A");
  assert.match(row.placementProvenance.labelledBy, /publicationLabels/);
  const strayPub = { ...placementOne, publicationId: `0x${"ee".repeat(32)}` };
  assert.throws(() => deriveAbstractResult({ check: goodCheck({ fromLog: { kind: "0xk", commitment: "0xc0", selection: selectionA, placement: strayPub }, fromReplay: { commitment: "0xc0", selection: selectionA, placement: strayPub } }), replay: REPLAY, evidenceFor: evidenceFixture() }), /no fixture label for placement publication/);
  const strayActor = { ...placementOne, actor: `0x${"ee".repeat(32)}` };
  assert.throws(() => deriveAbstractResult({ check: goodCheck({ fromLog: { kind: "0xk", commitment: "0xc0", selection: selectionA, placement: strayActor }, fromReplay: { commitment: "0xc0", selection: selectionA, placement: strayActor } }), replay: REPLAY, evidenceFor: evidenceFixture() }), /no fixture label for placement actor/);
  const sealFromB = evidenceFixture({ operation: "PAID_POINT", placementAtSeal: { ...evidenceFixture().placementAtSeal, publicationId: `0x${"72".repeat(32)}`, author: B } });
  const pointRow = deriveAbstractResult({ check: goodCheck({ fromLog: { kind: "0xk", commitment: "0xc0", selection: selectionA, placement: placementNone }, fromReplay: { commitment: "0xc0", selection: selectionA, placement: placementNone } }), replay: REPLAY, evidenceFor: sealFromB });
  assert.equal(pointRow.placementProvenance.sourceStep, "B1");
  assert.equal(pointRow.placementProvenance.actor, "AUTHOR_B");
  assert.throws(() => deriveAbstractResult({ check: goodCheck({ fromLog: { kind: "0xk", commitment: "0xc0", selection: selectionA, placement: placementNone }, fromReplay: { commitment: "0xc0", selection: selectionA, placement: placementNone } }), replay: REPLAY, evidenceFor: evidenceFixture({ operation: "PAID_POINT", placementAtSeal: { ...evidenceFixture().placementAtSeal, publicationId: `0x${"ee".repeat(32)}` } }) }), /no fixture label for placement publication/);
  const withReason = deriveAbstractResult({ check: goodCheck({ match: false, reason: "log kind 0xbad != expected 0xgood for PAID_LIST" }), replay: REPLAY, evidenceFor: evidenceFixture() });
  assert.equal(withReason.selection.reason, "log kind 0xbad != expected 0xgood for PAID_LIST");
});

test("paidObservationMatch requires the expected kind, a recomputed commitment equal to the logged one, log == replay == expectation, and reports each failure", () => {
  const KIND = `0x${"ab".repeat(32)}`;
  const recompute = (kind, selection, placement) => `0x${kind.slice(2, 6)}${selection.selectedHead.slice(2, 6)}${placement.ended === "true" ? "01" : "00"}`;
  const logged = recompute(KIND, selectionA, placementOne);
  const base = { logCount: 1, fromLog: { kind: KIND, commitment: logged, selection: selectionA, placement: placementOne }, fromReplay: { commitment: logged, selection: selectionA, placement: placementOne }, operation: "PAID_LIST", expectedKind: KIND, expectedSelection: selectionA, expectedPlacement: placementOne, recompute };
  const good = paidObservationMatch(base);
  assert.equal(good.match, true);
  assert.equal(good.kindOk, true);
  assert.equal(good.commitmentRecomputedOk, true);
  assert.equal(good.recomputedCommitment, logged);
  assert.equal(good.reason, null);
  const wrongKind = paidObservationMatch({ ...base, expectedKind: `0x${"cd".repeat(32)}` });
  assert.equal(wrongKind.match, false);
  assert.match(wrongKind.reason, /log kind .* != expected .* for PAID_LIST/);
  const forged = paidObservationMatch({ ...base, fromLog: { ...base.fromLog, commitment: "0x1234" }, fromReplay: { ...base.fromReplay, commitment: "0x1234" } });
  assert.equal(forged.match, false);
  assert.equal(forged.commitmentRecomputedOk, false);
  assert.match(forged.reason, /recomputed commitment .* != logged 0x1234/);
  const replayDiffers = paidObservationMatch({ ...base, fromReplay: { ...base.fromReplay, selection: { ...selectionA, mantissa: "1" } } });
  assert.equal(replayDiffers.match, false);
  assert.match(replayDiffers.reason, /replay observation differs from the runner expectation/);
  const replayCommitment = paidObservationMatch({ ...base, fromReplay: { ...base.fromReplay, commitment: "0x9999" } });
  assert.match(replayCommitment.reason, /replay commitment differs from the log commitment/);
  const logDiffers = paidObservationMatch({ ...base, expectedSelection: { ...selectionA, scale: "7" }, fromReplay: { ...base.fromReplay, selection: { ...selectionA, scale: "7" } } });
  assert.match(logDiffers.reason, /log observation differs from the runner expectation/);
  const noLog = paidObservationMatch({ ...base, logCount: 0, fromLog: null });
  assert.match(noLog.reason, /no single PaidObserved log \(logCount 0\)/);
  const undecodable = paidObservationMatch({ ...base, fromReplay: { error: "could not decode" } });
  assert.match(undecodable.reason, /replay did not decode/);
  const pointCommitment = recompute(KIND, selectionA, placementNone);
  const pointNoPlacement = paidObservationMatch({ ...base, operation: "PAID_POINT", expectedPlacement: placementNone, fromLog: { ...base.fromLog, commitment: pointCommitment, placement: placementNone }, fromReplay: { commitment: pointCommitment, selection: selectionA, placement: null } });
  assert.equal(pointNoPlacement.match, true);
  const listNoPlacement = paidObservationMatch({ ...base, fromReplay: { commitment: logged, selection: selectionA, placement: null } });
  assert.equal(listNoPlacement.match, false);
  const throwing = paidObservationMatch({ ...base, recompute: () => { throw new Error("bad tuple"); } });
  assert.equal(throwing.commitmentRecomputedOk, false);
  assert.match(throwing.reason, /bad tuple/);
});

// Like the actual runner, the expectation omits hydrated; the observed tuple does not.
// This deterministic encoder covers every tuple field without adding an ABI/keccak dependency to these pure tests.
const encodeObservation = (kind, selection, placement) => JSON.stringify([
  kind, SELECTION_FIELDS.map((k) => String(selection[k]).toLowerCase()),
  PLACEMENT_FIELDS.map((k) => String(placement[k]).toLowerCase()),
]);
function completeObservationCheck() {
  const { hydrated, ...expectedPlacement } = placementOne;
  const kind = `0x${"ab".repeat(32)}`;
  const commitment = encodeObservation(kind, selectionA, placementOne);
  return {
    logCount: 1, operation: "PAID_LIST", expectedKind: kind,
    expectedSelection: { ...selectionA }, expectedPlacement,
    fromLog: { kind, commitment, selection: { ...selectionA }, placement: { ...placementOne } },
    fromReplay: { commitment, selection: { ...selectionA }, placement: { ...placementOne } },
    recompute: encodeObservation,
  };
}

test("paidObservationMatch accepts complete log/replay tuples when the runner does not pin hydrated", () => {
  const result = paidObservationMatch(completeObservationCheck());
  assert.equal(result.match, true);
  assert.equal(result.replayCommitmentRecomputedOk, true);
});

for (const [tuple, fields] of [["selection", SELECTION_FIELDS], ["placement", PLACEMENT_FIELDS]]) {
  for (const field of fields) {
    test(`paidObservationMatch rejects replay-only ${tuple}.${field} mutation with unchanged commitment`, () => {
      const input = completeObservationCheck();
      // Omit the mutated field from the candidate expectation to exercise full observation agreement.
      delete input[tuple === "selection" ? "expectedSelection" : "expectedPlacement"][field];
      input.fromReplay[tuple][field] = field === "ended" ? "false" : "999";
      const result = paidObservationMatch(input);
      assert.equal(result.match, false);
      assert.equal(result.replayCommitmentRecomputedOk, false);
      assert.equal(result[tuple === "selection" ? "selectionLogReplay" : "placementLogReplay"].fields[field].equal, false);
    });
  }
}

test("paidObservationMatch refuses missing hydrated even when both tuples and the expectation omit it", () => {
  const input = completeObservationCheck();
  delete input.fromLog.placement.hydrated;
  delete input.fromReplay.placement.hydrated;
  input.fromLog.commitment = input.fromReplay.commitment = encodeObservation(input.expectedKind, input.fromLog.selection, input.fromLog.placement);
  const result = paidObservationMatch(input);
  assert.equal(result.match, false);
  assert.equal(result.placementLogReplay.fields.hydrated.equal, false);
});

test("paidObservationMatch recomputes point replay with canonical zero Placement, never the log placement", () => {
  const input = completeObservationCheck();
  input.operation = "PAID_POINT";
  input.expectedPlacement = {};
  input.fromReplay.placement = null;
  const result = paidObservationMatch(input);
  assert.equal(result.match, false, "a nonzero point log placement cannot supply the replay tuple");
  assert.equal(result.replayCommitmentRecomputedOk, false);
});

test("deriveAbstractResult refuses an unlabelled selected head or author rather than guessing a label", () => {
  const stray = { ...selectionA, selectedHead: `0x${"ee".repeat(32)}` };
  assert.throws(() => deriveAbstractResult({ check: goodCheck({ fromLog: { kind: "0xk", commitment: "0xc0", selection: stray, placement: placementOne }, fromReplay: { commitment: "0xc0", selection: stray, placement: placementOne } }), replay: REPLAY, evidenceFor: evidenceFixture() }), /no fixture label for selected head/);
});

test("checkAgreement reports identical point/list selections and names every differing field, never claiming agreement without both logs", () => {
  assert.deepEqual(checkAgreement(selectionA, { ...selectionA, lensHash: "0xother" }), { identicalSelection: true, differingFields: [], selectedHead: A2, selectedAuthor: A });
  const different = checkAgreement(selectionA, { ...selectionA, selectedHead: B1, selectedAuthor: B });
  assert.equal(different.identicalSelection, false);
  assert.deepEqual(different.differingFields, ["selectedHead", "selectedAuthor"]);
  assert.deepEqual(checkAgreement(null, selectionA), { unknown: "a PaidObserved selection is missing or its self-check failed", consequence: "no agreement claim" });
});
