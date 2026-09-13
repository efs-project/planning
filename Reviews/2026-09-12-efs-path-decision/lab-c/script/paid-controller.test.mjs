import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import test from "node:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { rpcRead, verifyControllerStage } from "./paid-controller.mjs";

const self = fileURLToPath(new URL("./paid-controller.mjs", import.meta.url));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const h32 = (byte) => `0x${byte.repeat(64)}`;
const addr = (n) => `0x${n.toString(16).padStart(40, "0")}`;

function fixture(stage = "beforeFixture") {
  const dir = mkdtempSync(join(tmpdir(), "efs-c-controller-"));
  const labRoot = join(dir, "lab-c");
  const gateDir = join(dir, "gate");
  mkdirSync(labRoot, { recursive: true });
  mkdirSync(gateDir, { recursive: true });
  writeFileSync(join(labRoot, "src.sol"), "source\n");
  const neutralPath = join(dir, "neutral.json");
  writeFileSync(neutralPath, "neutral\n");
  const deployment = {};
  for (const [index, name] of ["ImportLib", "IndexModule", "Ledger", "LensReader", "MeasurementConsumer", "PassAcceptor", "Producer", "QuoteAcceptorV1"].entries()) {
    const artifactPath = join(dir, `${name}.json`);
    writeFileSync(artifactPath, `${name}\n`);
    deployment[name] = { address: addr(index + 1), artifactPath, artifactSha256: sha(readFileSync(artifactPath)), runtimeKeccak: "0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a" };
  }
  const publications = Object.fromEntries(["BOOTSTRAP", "A1", "A2", "B1"].map((key, i) => [key, {
    caller: addr(30), target: i === 3 ? deployment.Producer.address : deployment.Ledger.address,
    calldata: `0x1234567${i}`, actions: new Array(i === 0 ? 7 : 1).fill({}),
  }]));
  const paid = ["POINT_A_FIRST", "LIST_A_FIRST", "POINT_B_FIRST", "LIST_B_FIRST"].map((row, i) => ({
    row, caller: addr(31), target: deployment.MeasurementConsumer.address, calldata: `0x8765432${i}`,
    expectedReturn: "0x", expectedEvent: { indexedKind: h32("a"), data: "0x" },
  }));
  const identityReads = Array.from({ length: 11 }, (_, i) => ({ label: `identity-${i}`, target: deployment.Ledger.address, calldata: `0x1000000${i.toString(16)}`, expected: "0x11" }));
  const basisReads = Array.from({ length: 2 }, (_, i) => ({ label: `basis-${i}`, target: deployment.Ledger.address, calldata: `0x2000000${i}`, initialExpected: "0x22", postB1Expected: "0x33" }));
  const rawReadChecks = Array.from({ length: 2 }, (_, i) => ({ label: `raw-${i}`, target: deployment.Ledger.address, calldata: `0x3000000${i}`, initialExpected: "0x44", postB1Expected: "0x55" }));
  const input = {
    sourceRevision: "2".repeat(40), chainId: 31337,
    accounts: { deployer: { address: addr(30) }, authorA: { address: addr(29) }, paidCaller: { address: addr(31) } },
    neutralExpectation: { path: neutralPath, sha256: sha(readFileSync(neutralPath)) },
    sources: [{ path: "src.sol", sha256: sha(readFileSync(join(labRoot, "src.sol"))) }],
    deployment, publications, paid, identityReads, basisReads, rawReadChecks,
  };
  const inputPath = join(dir, "input.json");
  writeFileSync(inputPath, JSON.stringify(input));
  const env = {
    C_CONTROLLER_PATH: self, C_CONTROLLER_SHA256: sha(readFileSync(self)), C_INPUT_PATH: inputPath,
    C_INPUT_SHA256: sha(readFileSync(inputPath)), C_RUN_ID: "c-unit", C_RUN_SOURCE: "1".repeat(40), C_GATE_DIR: gateDir,
  };
  const context = {
    schema: "efs-lab-c/controller-context/1", stage, runId: env.C_RUN_ID, runSource: env.C_RUN_SOURCE,
    inputsSha256: env.C_INPUT_SHA256, rpcUrl: "http://127.0.0.1:8545",
    block: { number: stage === "beforeFixture" ? "0x1a" : "0x1e", hash: stage === "beforeFixture" ? h32("1") : h32("2") },
    snapshot: stage === "beforeFixture" ? "0x1" : "0x2", ackPath: join(gateDir, `ack-${stage}.json`),
  };
  const contextPath = join(gateDir, `context-${stage}.json`);
  writeFileSync(contextPath, `${JSON.stringify(context, null, 2)}\n`);
  let calls = 0;
  const request = async (_url, method, params) => {
    calls++;
    if (method === "eth_chainId") return "0x7a69";
    if (method === "eth_getBlockByNumber") return { number: context.block.number, hash: context.block.hash };
    if (method === "eth_getCode") return "0x00";
    if (method === "eth_call") {
      const data = params[0].data;
      if (identityReads.some((row) => row.calldata === data)) return "0x11";
      if (basisReads.some((row) => row.calldata === data)) return stage === "beforeFixture" ? "0x22" : "0x33";
      if (rawReadChecks.some((row) => row.calldata === data)) return stage === "beforeFixture" ? "0x44" : "0x55";
    }
    throw new Error(`unexpected ${method}`);
  };
  return { dir, labRoot, gateDir, env, input, inputPath, context, contextPath, request, get calls() { return calls; }, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test("rpcRead permits only reads and validates HTTP and the full JSON-RPC envelope", async () => {
  await assert.rejects(() => rpcRead("http://127.0.0.1:1", "eth_sendRawTransaction", [], { fetchImpl: async () => { throw new Error("called"); } }), /C_CONTROLLER_WRITE_FORBIDDEN/);
  await assert.rejects(() => rpcRead("http://127.0.0.1:1", "eth_chainId", [], { fetchImpl: async () => ({ ok: true, json: async () => ({ jsonrpc: "2.0", id: 2, result: "0x1" }) }) }), /C_CONTROLLER_RPC_ENVELOPE/);
  await assert.rejects(() => rpcRead("http://127.0.0.1:1", "eth_chainId", [], { fetchImpl: async () => ({ ok: true, json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x1", error: null }) }) }), /C_CONTROLLER_RPC_ENVELOPE/);
});

test("controller independently verifies the pinned block, eight runtimes and all stage reads, then rechecks the block", async () => {
  for (const stage of ["beforeFixture", "afterB1"]) {
    const f = fixture(stage);
    try {
      const ack = await verifyControllerStage({ env: f.env, contextPath: f.contextPath, request: f.request, labRoot: f.labRoot, inspectGit: () => ({ head: f.env.C_RUN_SOURCE, trackedDirty: false }) });
      assert.equal(ack.decision, "ACK");
      assert.equal(ack.block.hash, f.context.block.hash);
      assert.equal(ack.contextSha256, sha(readFileSync(f.contextPath)));
      assert.equal(ack.checks.length, 28);
      assert.equal(JSON.parse(readFileSync(f.context.ackPath)).decision, "ACK");
      const observation = JSON.parse(readFileSync(join(f.gateDir, `observations-${stage}.json`)));
      const blockReads = observation.requests.filter((row) => row.method === "eth_getBlockByNumber");
      assert.equal(blockReads.length, 2);
      assert.ok(observation.requests.every((row) => !JSON.stringify(row.params).includes('"latest"')));
    } finally { f.cleanup(); }
  }
});

test("wrong block, changed runtime and changed expected read refuse and retain no ACK", async () => {
  for (const change of ["block", "runtime", "read"]) {
    const f = fixture();
    let request = f.request;
    try {
      if (change === "block") request = async (url, method, params) => method === "eth_getBlockByNumber" ? { number: f.context.block.number, hash: h32("9") } : f.request(url, method, params);
      if (change === "runtime") request = async (url, method, params) => method === "eth_getCode" ? "0x01" : f.request(url, method, params);
      if (change === "read") request = async (url, method, params) => method === "eth_call" ? "0xff" : f.request(url, method, params);
      await assert.rejects(() => verifyControllerStage({ env: f.env, contextPath: f.contextPath, request, labRoot: f.labRoot, inspectGit: () => ({ head: f.env.C_RUN_SOURCE, trackedDirty: false }) }), /C_CONTROLLER_(BLOCK_MISMATCH|RUNTIME_MISMATCH|STATE_MISMATCH)/);
      assert.throws(() => readFileSync(f.context.ackPath), /ENOENT/);
      assert.equal(JSON.parse(readFileSync(join(f.gateDir, "refusal-beforeFixture.json"))).decision, "REFUSE");
    } finally { f.cleanup(); }
  }
});

test("changed pins refuse before the first RPC", async () => {
  const f = fixture();
  try {
    f.env.C_INPUT_SHA256 = "0".repeat(64);
    await assert.rejects(() => verifyControllerStage({ env: f.env, contextPath: f.contextPath, request: f.request, labRoot: f.labRoot }), /C_GATE_PIN_MISMATCH:input/);
    assert.equal(f.calls, 0);
  } finally { f.cleanup(); }
});

test("controller independently refuses a different HEAD or tracked changes before the first RPC", async () => {
  for (const git of [{ head: "9".repeat(40), trackedDirty: false }, { head: "1".repeat(40), trackedDirty: true }]) {
    const f = fixture();
    try {
      await assert.rejects(() => verifyControllerStage({ env: f.env, contextPath: f.contextPath, request: f.request, labRoot: f.labRoot, inspectGit: () => git }), /C_CONTROLLER_(RUN_SOURCE|TRACKED_DIRTY)/);
      assert.equal(f.calls, 0);
    } finally { f.cleanup(); }
  }
});
