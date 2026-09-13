import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import test from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  assertManifestCall, assertPaidManifestOutcome, createControllerGate, sha256,
} from "./controller-gate.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const h32 = (byte) => `0x${byte.repeat(64)}`;
const addr = (byte) => `0x${byte.repeat(40)}`;

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "efs-c-gate-"));
  const labRoot = join(dir, "lab-c");
  const sourcePath = join(labRoot, "src.sol");
  const controllerPath = join(labRoot, "controller.mjs");
  const inputPath = join(dir, "inputs.json");
  const neutralPath = join(dir, "neutral.json");
  const gateDir = join(dir, "gate");
  mkdirSync(labRoot, { recursive: true });
  writeFileSync(sourcePath, "source\n");
  writeFileSync(controllerPath, "controller\n");
  writeFileSync(neutralPath, "neutral\n");
  const deployment = {};
  for (const [i, name] of ["ImportLib", "IndexModule", "Ledger", "LensReader", "MeasurementConsumer", "PassAcceptor", "Producer", "QuoteAcceptorV1"].entries()) {
    const artifactPath = join(dir, `${name}.json`);
    writeFileSync(artifactPath, `${name}\n`);
    deployment[name] = { address: addr(String(i + 1)), artifactPath, artifactSha256: hash(readFileSync(artifactPath)), runtimeKeccak: h32("a") };
  }
  const publications = Object.fromEntries(["BOOTSTRAP", "A1", "A2", "B1"].map((key, i) => [key, {
    target: i === 3 ? deployment.Producer.address : deployment.Ledger.address,
    caller: addr("f"), calldata: `0x1234567${i}`, actions: new Array(i === 0 ? 7 : 1).fill({}),
  }]));
  const paid = ["POINT_A_FIRST", "LIST_A_FIRST", "POINT_B_FIRST", "LIST_B_FIRST"].map((row, i) => ({
    row, caller: addr("e"), target: deployment.MeasurementConsumer.address, calldata: `0x8765432${i}`,
    expectedReturn: h32("b"), expectedEvent: { indexedKind: h32("c"), data: h32("d") },
  }));
  const read = (label) => ({ label, target: deployment.Ledger.address, calldata: "0x12345678", expected: "0x", initialExpected: "0x", postB1Expected: "0x" });
  const input = {
    sourceRevision: "2".repeat(40), chainId: 31337,
    accounts: { deployer: { address: addr("f") }, authorA: { address: addr("d") }, paidCaller: { address: addr("e") } },
    neutralExpectation: { path: neutralPath, sha256: hash(readFileSync(neutralPath)) },
    sources: [{ path: "src.sol", sha256: hash(readFileSync(sourcePath)) }], deployment, publications, paid,
    identityReads: Array.from({ length: 11 }, (_, i) => { const { initialExpected, postB1Expected, ...row } = read(`identity-${i}`); return row; }),
    basisReads: Array.from({ length: 2 }, (_, i) => { const { expected, ...row } = read(`basis-${i}`); return row; }),
    rawReadChecks: [],
  };
  writeFileSync(inputPath, JSON.stringify(input));
  const env = {
    C_CONTROLLER_PATH: controllerPath, C_CONTROLLER_SHA256: hash(readFileSync(controllerPath)),
    C_INPUT_PATH: inputPath, C_INPUT_SHA256: hash(readFileSync(inputPath)),
    C_RUN_ID: "c-unit", C_RUN_SOURCE: "1".repeat(40), C_GATE_DIR: gateDir,
  };
  const contextBasis = { rpcUrl: "http://127.0.0.1:8545", block: { number: "0x1a", hash: h32("1") }, snapshot: "0x1" };
  return { dir, labRoot, controllerPath, inputPath, gateDir, env, input, contextBasis, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function ackFor(context, input) {
  return {
    schema: "efs-lab-c/controller-ack/1", stage: context.stage, runId: context.runId,
    runSource: context.runSource, inputsSha256: context.inputsSha256,
    contextSha256: sha256(readFileSync(context.__path)), block: JSON.parse(JSON.stringify(context.block)),
    evidenceGrade: "RPC_OBSERVED", decision: "ACK", checks: [{ label: "unit", passed: true }],
  };
}

async function openGate(f, runChild, overrides = {}) {
  return createControllerGate({
    env: f.env, selectedCells: ["typed-joined"], anvil: true, labRoot: f.labRoot,
    inspectGit: () => ({ head: f.env.C_RUN_SOURCE, trackedDirty: false }), runChild, timeoutMs: 20,
    ...overrides,
  });
}

test("no C gate variables leaves an explicit diagnostic gate", async () => {
  const gate = await createControllerGate({ env: {}, selectedCells: ["typed-joined"], anvil: true });
  assert.equal(gate.enabled, false);
  assert.equal(gate.gating, "diagnostic-ungated");
});

test("partial and malformed pins, wrong selection, source mismatch and dirty tracked state refuse before controller or RPC", async () => {
  const f = fixture();
  let children = 0;
  const never = async () => { children++; };
  try {
    await assert.rejects(() => createControllerGate({ env: { C_INPUT_PATH: f.inputPath }, selectedCells: ["typed-joined"], anvil: true }), /C_GATE_PINS_INCOMPLETE/);
    for (const key of Object.keys(f.env)) {
      const partial = { ...f.env };
      delete partial[key];
      await assert.rejects(() => createControllerGate({ env: partial, selectedCells: ["typed-joined"], anvil: true }), /C_GATE_PINS_INCOMPLETE/);
    }
    await assert.rejects(() => openGate(f, never, { selectedCells: ["typed-joined", "record-fresh-isolated"] }), /C_GATE_SELECTION/);
    await assert.rejects(() => openGate(f, never, { inspectGit: () => ({ head: "9".repeat(40), trackedDirty: false }) }), /C_GATE_RUN_SOURCE/);
    await assert.rejects(() => openGate(f, never, { inspectGit: () => ({ head: f.env.C_RUN_SOURCE, trackedDirty: true }) }), /C_GATE_TRACKED_DIRTY/);
    const changed = { ...f.env, C_INPUT_SHA256: "0".repeat(64) };
    await assert.rejects(() => createControllerGate({ env: changed, selectedCells: ["typed-joined"], anvil: true, labRoot: f.labRoot, inspectGit: () => ({ head: changed.C_RUN_SOURCE, trackedDirty: false }), runChild: never }), /C_GATE_PIN_MISMATCH:input/);
    assert.equal(children, 0);
  } finally { f.cleanup(); }
});

test("controller exit, timeout, refusal and stale or wrong acknowledgements fail closed", async () => {
  const f = fixture();
  try {
    let gate = await openGate(f, async () => ({ code: 7, stdout: "out", stderr: "boom", timedOut: false }));
    await assert.rejects(() => gate.invoke("beforeFixture", f.contextBasis), /C_CONTROLLER_EXIT:7/);

    rmSync(f.gateDir, { recursive: true, force: true });
    gate = await openGate(f, async () => ({ code: null, stdout: "", stderr: "", timedOut: true }));
    await assert.rejects(() => gate.invoke("beforeFixture", f.contextBasis), /C_CONTROLLER_TIMEOUT/);

    for (const mutate of [
      (ack) => { ack.decision = "REFUSE"; },
      (ack) => { ack.runId = "stale-run"; },
      (ack) => { ack.runSource = "9".repeat(40); },
      (ack) => { ack.inputsSha256 = "8".repeat(64); },
      (ack) => { ack.contextSha256 = "0".repeat(64); },
      (ack) => { ack.block.hash = h32("9"); },
      (ack) => { ack.extra = true; },
    ]) {
      rmSync(f.gateDir, { recursive: true, force: true });
      gate = await openGate(f, async ({ context, contextPath }) => {
        const supplied = { ...context, __path: contextPath };
        const ack = ackFor(supplied, f.input);
        mutate(ack);
        writeFileSync(context.ackPath, JSON.stringify(ack), { flag: "wx" });
        return { code: 0, stdout: "ok", stderr: "", timedOut: false };
      });
      await assert.rejects(() => gate.invoke("beforeFixture", f.contextBasis), /C_CONTROLLER_(REFUSED|ACK_MISMATCH|ACK_MALFORMED)/);
    }
  } finally { f.cleanup(); }
});

test("the real child-process watchdog kills a controller that exceeds its bound", async () => {
  const f = fixture();
  try {
    writeFileSync(f.controllerPath, "setTimeout(() => {}, 1000);\n");
    f.env.C_CONTROLLER_SHA256 = hash(readFileSync(f.controllerPath));
    const gate = await createControllerGate({
      env: f.env, selectedCells: ["typed-joined"], anvil: true, labRoot: f.labRoot,
      inspectGit: () => ({ head: f.env.C_RUN_SOURCE, trackedDirty: false }), timeoutMs: 10,
    });
    await assert.rejects(() => gate.invoke("beforeFixture", f.contextBasis), /C_CONTROLLER_TIMEOUT/);
    assert.equal(readFileSync(join(f.gateDir, "stderr-beforeFixture.log"), "utf8"), "");
  } finally { f.cleanup(); }
});

test("exclusive two-stage guard orders ACKs before fixture and post-B1 consumers", async () => {
  const f = fixture();
  const events = [];
  try {
    const gate = await openGate(f, async ({ context, contextPath }) => {
      events.push(`controller:${context.stage}`);
      writeFileSync(context.ackPath, JSON.stringify(ackFor({ ...context, __path: contextPath }, f.input)), { flag: "wx" });
      return { code: 0, stdout: "ok", stderr: "", timedOut: false };
    });
    await assert.rejects(() => gate.invoke("afterB1", f.contextBasis), /C_GATE_STAGE_ORDER/);
    await gate.guard("beforeFixture", f.contextBasis, async () => { events.push("seven-action-publication"); });
    await gate.guard("afterB1", { ...f.contextBasis, block: { number: "0x1b", hash: h32("2") }, snapshot: "0x2" }, async () => { events.push("placement-and-paid"); });
    assert.deepEqual(events, ["controller:beforeFixture", "seven-action-publication", "controller:afterB1", "placement-and-paid"]);
    await assert.rejects(() => gate.invoke("afterB1", f.contextBasis), /C_GATE_STAGE_ORDER/);
  } finally { f.cleanup(); }
});

test("manifest call and paid outcome comparisons refuse modified bytes, caller, return and event", () => {
  const publication = { target: addr("1"), caller: addr("2"), calldata: "0xaabb" };
  assert.doesNotThrow(() => assertManifestCall("A1", publication, { ...publication }));
  assert.throws(() => assertManifestCall("A1", { ...publication, calldata: "0xaabc" }, publication), /C_MANIFEST_CALL_MISMATCH:A1.calldata/);
  assert.throws(() => assertManifestCall("POINT_A_FIRST", { ...publication, calldata: "0xaabc" }, publication), /C_MANIFEST_CALL_MISMATCH:POINT_A_FIRST.calldata/);
  assert.throws(() => assertManifestCall("A1", { ...publication, caller: addr("3") }, publication), /C_MANIFEST_CALL_MISMATCH:A1.caller/);

  const expected = { expectedReturn: "0xaabb", expectedEvent: { indexedKind: h32("a"), data: "0xccdd" } };
  const expectedWithTarget = { ...expected, target: addr("9") };
  const actual = { returnData: "0xaabb", logs: [{ address: addr("9"), topics: [h32("f"), h32("a")], data: "0xccdd" }] };
  assert.doesNotThrow(() => assertPaidManifestOutcome("POINT_A_FIRST", actual, expectedWithTarget));
  assert.throws(() => assertPaidManifestOutcome("POINT_A_FIRST", { ...actual, returnData: "0xaabc" }, expectedWithTarget), /expectedReturn/);
  assert.throws(() => assertPaidManifestOutcome("POINT_A_FIRST", { ...actual, logs: [{ address: addr("9"), topics: [h32("f"), h32("b")], data: "0xccdd" }] }, expectedWithTarget), /expectedEvent.indexedKind/);
});
