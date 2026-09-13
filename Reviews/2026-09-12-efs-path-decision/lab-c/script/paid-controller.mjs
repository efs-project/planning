#!/usr/bin/env node
// Disposable independent read-only controller for the C paid run. It performs no state-changing RPC.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const ENV_KEYS = ["C_CONTROLLER_PATH", "C_CONTROLLER_SHA256", "C_INPUT_PATH", "C_INPUT_SHA256", "C_RUN_ID", "C_RUN_SOURCE", "C_GATE_DIR"];
const DEPLOYMENTS = ["ImportLib", "IndexModule", "Ledger", "LensReader", "MeasurementConsumer", "PassAcceptor", "Producer", "QuoteAcceptorV1"];
const PAID_ROWS = ["POINT_A_FIRST", "LIST_A_FIRST", "POINT_B_FIRST", "LIST_B_FIRST"];
const READS = new Set(["eth_chainId", "eth_getBlockByNumber", "eth_getCode", "eth_call"]);
const ETHERS_MODULE = "/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js";
const ETHERS_MODULE_SHA256 = "586bc08ce4c6bdb64f2972f9284f9eca568b7211f33c387d5b83f63887ffc468";
const ETHERS_PACKAGE = "/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/package.json";
const ETHERS_PACKAGE_SHA256 = "957d5092241ed59860532077633008c49852b98b384493bb0f04225a414eb601";

const sha = (value) => createHash("sha256").update(value).digest("hex");
const fail = (code, detail = "") => { throw new Error(`${code}${detail ? `:${detail}` : ""}`); };
const check = (condition, code, detail) => { if (!condition) fail(code, detail); };
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const commit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
const address = (value) => typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
const bytes = (value) => typeof value === "string" && /^0x(?:[0-9a-fA-F]{2})*$/.test(value);
const hash32 = (value) => typeof value === "string" && /^0x[0-9a-f]{64}$/.test(value);
const blockTag = (value) => typeof value === "string" && /^0x(?:0|[1-9a-f][0-9a-f]*)$/.test(value);
const clone = (value) => value === undefined ? null : JSON.parse(JSON.stringify(value));

export async function rpcRead(url, method, params, { fetchImpl = fetch, timeoutMs = 10_000 } = {}) {
  check(READS.has(method), "C_CONTROLLER_WRITE_FORBIDDEN", method);
  const request = { jsonrpc: "2.0", id: 1, method, params };
  let response;
  try {
    response = await fetchImpl(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request), signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) { fail("C_CONTROLLER_RPC_TRANSPORT", error.message); }
  check(response?.ok === true, "C_CONTROLLER_RPC_HTTP", String(response?.status));
  let body;
  try { body = await response.json(); } catch (error) { fail("C_CONTROLLER_RPC_JSON", error.message); }
  check(body && typeof body === "object" && !Array.isArray(body) && body.jsonrpc === "2.0" && body.id === 1 && Object.hasOwn(body, "result") && !Object.hasOwn(body, "error"), "C_CONTROLLER_RPC_ENVELOPE");
  return body.result;
}

function exactKeys(value, expected, code, label = "") {
  check(value && typeof value === "object" && !Array.isArray(value), code, label);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  check(JSON.stringify(actual) === JSON.stringify(wanted), code, label || "keys");
}

function pinFile(filePath, expected, label) {
  check(path.isAbsolute(filePath ?? "") && digest(expected), "C_GATE_PIN_MALFORMED", label);
  let raw;
  try { raw = readFileSync(filePath); } catch (error) { fail("C_GATE_PIN_UNREADABLE", `${label}:${error.code ?? error.message}`); }
  check(sha(raw) === expected, "C_GATE_PIN_MISMATCH", label);
  return raw;
}

async function loadPinnedKeccak() {
  pinFile(ETHERS_MODULE, ETHERS_MODULE_SHA256, "ethers.module");
  const packageRaw = pinFile(ETHERS_PACKAGE, ETHERS_PACKAGE_SHA256, "ethers.package");
  let packageJson;
  try { packageJson = JSON.parse(packageRaw); } catch { fail("C_CONTROLLER_DEPENDENCY_MALFORMED", "ethers.package"); }
  check(packageJson.version === "6.15.0", "C_CONTROLLER_DEPENDENCY_MISMATCH", "ethers.version");
  const ethers = await import(pathToFileURL(ETHERS_MODULE).href);
  check(typeof ethers.keccak256 === "function", "C_CONTROLLER_DEPENDENCY_MALFORMED", "ethers.keccak256");
  return ethers.keccak256;
}

function defaultInspectGit(labRoot) {
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: labRoot, encoding: "utf8" }).trim();
  const status = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { cwd: labRoot, encoding: "utf8" });
  return { head, trackedDirty: status.trim().length !== 0 };
}

function inside(root, relative, label) {
  check(typeof relative === "string" && relative && !path.isAbsolute(relative), "C_CONTROLLER_INPUT_MALFORMED", label);
  const result = path.resolve(root, relative);
  check(result.startsWith(`${path.resolve(root)}${path.sep}`), "C_CONTROLLER_INPUT_MALFORMED", label);
  return result;
}

function validateInputs(input, labRoot) {
  check(input && commit(input.sourceRevision) && Number.isSafeInteger(input.chainId) && input.chainId > 0, "C_CONTROLLER_INPUT_MALFORMED");
  check(address(input.accounts?.deployer?.address) && address(input.accounts?.authorA?.address) && address(input.accounts?.paidCaller?.address), "C_CONTROLLER_INPUT_MALFORMED", "accounts");
  pinFile(input.neutralExpectation?.path, input.neutralExpectation?.sha256, "neutralExpectation");
  check(Array.isArray(input.sources) && input.sources.length > 0, "C_CONTROLLER_INPUT_MALFORMED", "sources");
  const sourceNames = new Set();
  for (const row of input.sources) {
    check(!sourceNames.has(row.path) && digest(row.sha256), "C_CONTROLLER_INPUT_MALFORMED", "sources");
    sourceNames.add(row.path);
    pinFile(inside(labRoot, row.path, "source.path"), row.sha256, `source:${row.path}`);
  }
  exactKeys(input.deployment, DEPLOYMENTS, "C_CONTROLLER_INPUT_MALFORMED", "deployment");
  for (const name of DEPLOYMENTS) {
    const row = input.deployment[name];
    check(address(row?.address) && hash32(row.runtimeKeccak), "C_CONTROLLER_INPUT_MALFORMED", `deployment.${name}`);
    pinFile(row.artifactPath, row.artifactSha256, `artifact:${name}`);
  }
  check(new Set(DEPLOYMENTS.map((name) => input.deployment[name].address.toLowerCase())).size === DEPLOYMENTS.length, "C_CONTROLLER_INPUT_MALFORMED", "deployment.addresses");
  exactKeys(input.publications, ["BOOTSTRAP", "A1", "A2", "B1"], "C_CONTROLLER_INPUT_MALFORMED", "publications");
  check(input.publications.BOOTSTRAP.actions?.length === 7, "C_CONTROLLER_INPUT_MALFORMED", "BOOTSTRAP.actions");
  for (const row of Object.values(input.publications)) check(address(row.target) && address(row.caller) && bytes(row.calldata), "C_CONTROLLER_INPUT_MALFORMED", "publication");
  for (const name of ["BOOTSTRAP", "A1", "A2", "B1"]) check(input.publications[name].caller.toLowerCase() === input.accounts.deployer.address.toLowerCase(), "C_CONTROLLER_INPUT_MALFORMED", `publications.${name}.caller`);
  for (const name of ["BOOTSTRAP", "A1", "A2"]) check(input.publications[name].target.toLowerCase() === input.deployment.Ledger.address.toLowerCase(), "C_CONTROLLER_INPUT_MALFORMED", `publications.${name}.target`);
  check(input.publications.B1.target.toLowerCase() === input.deployment.Producer.address.toLowerCase(), "C_CONTROLLER_INPUT_MALFORMED", "publications.B1.target");
  check(Array.isArray(input.paid) && input.paid.length === 4 && new Set(input.paid.map((row) => row.row)).size === 4 && PAID_ROWS.every((name) => input.paid.some((row) => row.row === name)), "C_CONTROLLER_INPUT_MALFORMED", "paid.rows");
  for (const row of input.paid) {
    check(address(row.target) && address(row.caller) && bytes(row.calldata) && bytes(row.expectedReturn) && hash32(row.expectedEvent?.indexedKind) && bytes(row.expectedEvent?.data), "C_CONTROLLER_INPUT_MALFORMED", `paid.${row.row}`);
    check(row.caller.toLowerCase() === input.accounts.paidCaller.address.toLowerCase() && row.target.toLowerCase() === input.deployment.MeasurementConsumer.address.toLowerCase(), "C_CONTROLLER_INPUT_MALFORMED", `paid.${row.row}.route`);
  }
  check(Array.isArray(input.identityReads) && input.identityReads.length === 11 && Array.isArray(input.basisReads) && input.basisReads.length === 2 && Array.isArray(input.rawReadChecks), "C_CONTROLLER_INPUT_MALFORMED", "reads");
  for (const [rows, fields] of [[input.identityReads, ["expected"]], [input.basisReads, ["initialExpected", "postB1Expected"]], [input.rawReadChecks, ["initialExpected", "postB1Expected"]]]) {
    const labels = new Set();
    for (const row of rows) {
      check(typeof row.label === "string" && !labels.has(row.label) && address(row.target) && bytes(row.calldata), "C_CONTROLLER_INPUT_MALFORMED", "read");
      labels.add(row.label);
      for (const field of fields) check(bytes(row[field]), "C_CONTROLLER_INPUT_MALFORMED", `${row.label}.${field}`);
    }
  }
  return input;
}

function compare(checks, label, actual, expected, code) {
  const passed = JSON.stringify(actual) === JSON.stringify(expected);
  checks.push({ label, expected: clone(expected), actual: clone(actual), passed });
  check(passed, code, label);
}

function validateContext(context, env, contextPath) {
  exactKeys(context, ["schema", "stage", "runId", "runSource", "inputsSha256", "rpcUrl", "block", "snapshot", "ackPath"], "C_CONTROLLER_CONTEXT_MALFORMED");
  check(context.schema === "efs-lab-c/controller-context/1" && ["beforeFixture", "afterB1"].includes(context.stage), "C_CONTROLLER_CONTEXT_MALFORMED", "schema-stage");
  check(context.runId === env.C_RUN_ID && context.runSource === env.C_RUN_SOURCE && context.inputsSha256 === env.C_INPUT_SHA256, "C_CONTROLLER_CONTEXT_MALFORMED", "pins");
  check(/^http:\/\/(?:127\.0\.0\.1|localhost):[0-9]+\/?$/.test(context.rpcUrl), "C_CONTROLLER_RPC_URL");
  exactKeys(context.block, ["number", "hash"], "C_CONTROLLER_CONTEXT_MALFORMED", "block");
  check(blockTag(context.block.number) && hash32(context.block.hash) && typeof context.snapshot === "string" && context.snapshot, "C_CONTROLLER_CONTEXT_MALFORMED", "basis");
  const expectedContext = path.join(env.C_GATE_DIR, `context-${context.stage}.json`);
  const expectedAck = path.join(env.C_GATE_DIR, `ack-${context.stage}.json`);
  check(path.resolve(contextPath) === expectedContext && context.ackPath === expectedAck, "C_CONTROLLER_CONTEXT_MALFORMED", "paths");
}

export async function verifyControllerStage({ env = process.env, contextPath, request = rpcRead, labRoot = path.resolve(path.dirname(SELF), ".."), inspectGit = defaultInspectGit, keccak } = {}) {
  const present = ENV_KEYS.filter((key) => env[key] !== undefined && env[key] !== "");
  check(present.length === ENV_KEYS.length, "C_GATE_PINS_INCOMPLETE");
  check(path.isAbsolute(env.C_GATE_DIR) && /^[A-Za-z0-9_-]{1,96}$/.test(env.C_RUN_ID) && commit(env.C_RUN_SOURCE), "C_GATE_PIN_MALFORMED", "run");
  pinFile(env.C_CONTROLLER_PATH, env.C_CONTROLLER_SHA256, "controller");
  check(realpathSync(env.C_CONTROLLER_PATH) === realpathSync(SELF), "C_GATE_PIN_MISMATCH", "controllerPath");
  const inputRaw = pinFile(env.C_INPUT_PATH, env.C_INPUT_SHA256, "input");
  let input;
  try { input = JSON.parse(inputRaw); } catch { fail("C_CONTROLLER_INPUT_MALFORMED", "json"); }
  validateInputs(input, labRoot);
  const git = inspectGit(labRoot);
  check(git.head === env.C_RUN_SOURCE, "C_CONTROLLER_RUN_SOURCE");
  check(git.trackedDirty === false, "C_CONTROLLER_TRACKED_DIRTY");
  const runtimeKeccak = keccak ?? await loadPinnedKeccak();
  const contextRaw = readFileSync(contextPath);
  let context;
  try { context = JSON.parse(contextRaw); } catch { fail("C_CONTROLLER_CONTEXT_MALFORMED", "json"); }
  validateContext(context, env, contextPath);

  const requests = [];
  const checks = [];
  const read = async (method, params, label) => {
    check(READS.has(method), "C_CONTROLLER_WRITE_FORBIDDEN", method);
    const retained = { label, method, params: clone(params) };
    requests.push(retained);
    try { const result = await request(context.rpcUrl, method, params); retained.result = clone(result); return result; }
    catch (error) { retained.error = error.message; throw error; }
  };
  const refusalPath = path.join(env.C_GATE_DIR, `refusal-${context.stage}.json`);
  try {
    const chain = await read("eth_chainId", [], "chainId");
    let chainDecimal;
    try { chainDecimal = BigInt(chain).toString(); } catch { fail("C_CONTROLLER_CHAIN_MISMATCH"); }
    compare(checks, "chainId", chainDecimal, String(input.chainId), "C_CONTROLLER_CHAIN_MISMATCH");
    const header = await read("eth_getBlockByNumber", [context.block.number, false], "block");
    compare(checks, "block.number", header?.number, context.block.number, "C_CONTROLLER_BLOCK_MISMATCH");
    compare(checks, "block.hash", header?.hash, context.block.hash, "C_CONTROLLER_BLOCK_MISMATCH");
    for (const name of DEPLOYMENTS) {
      const spec = input.deployment[name];
      const runtime = await read("eth_getCode", [spec.address, context.block.number], `runtime:${name}`);
      check(bytes(runtime) && runtime !== "0x", "C_CONTROLLER_RUNTIME_MISMATCH", name);
      compare(checks, `runtime:${name}`, runtimeKeccak(runtime), spec.runtimeKeccak, "C_CONTROLLER_RUNTIME_MISMATCH");
    }
    const expectedField = context.stage === "beforeFixture" ? "initialExpected" : "postB1Expected";
    for (const row of input.identityReads) {
      const result = await read("eth_call", [{ to: row.target, data: row.calldata }, context.block.number], row.label);
      compare(checks, row.label, result, row.expected, "C_CONTROLLER_STATE_MISMATCH");
    }
    for (const row of [...input.basisReads, ...input.rawReadChecks]) {
      const result = await read("eth_call", [{ to: row.target, data: row.calldata }, context.block.number], row.label);
      compare(checks, row.label, result, row[expectedField], "C_CONTROLLER_STATE_MISMATCH");
    }
    const after = await read("eth_getBlockByNumber", [context.block.number, false], "block-recheck");
    compare(checks, "block-recheck.number", after?.number, context.block.number, "C_CONTROLLER_BLOCK_MISMATCH");
    compare(checks, "block-recheck.hash", after?.hash, context.block.hash, "C_CONTROLLER_BLOCK_MISMATCH");
    const ack = {
      schema: "efs-lab-c/controller-ack/1", stage: context.stage, runId: context.runId, runSource: context.runSource,
      inputsSha256: context.inputsSha256, contextSha256: sha(contextRaw), block: clone(context.block),
      evidenceGrade: "RPC_OBSERVED", decision: "ACK", checks: clone(checks),
    };
    writeFileSync(path.join(env.C_GATE_DIR, `observations-${context.stage}.json`), `${JSON.stringify({ context: clone(context), inputsSha256: env.C_INPUT_SHA256, requests, checks }, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    writeFileSync(context.ackPath, `${JSON.stringify(ack, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    return ack;
  } catch (error) {
    try { writeFileSync(refusalPath, `${JSON.stringify({ decision: "REFUSE", context: clone(context), inputsSha256: env.C_INPUT_SHA256, requests, checks, error: error.message }, null, 2)}\n`, { flag: "wx", mode: 0o600 }); }
    catch (retentionError) { error.message += `; C_CONTROLLER_REFUSAL_RETENTION:${retentionError.code ?? retentionError.message}`; }
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(SELF)) {
  verifyControllerStage({ contextPath: process.argv[2] })
    .then((ack) => { process.stdout.write(`ACK ${ack.stage} ${ack.contextSha256}\n`); })
    .catch((error) => { process.stderr.write(`${error.stack ?? error.message}\n`); process.exitCode = 1; });
}
