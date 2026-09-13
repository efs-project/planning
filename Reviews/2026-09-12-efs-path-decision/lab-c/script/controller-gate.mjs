import { createHash } from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ENV_KEYS = ["C_CONTROLLER_PATH", "C_CONTROLLER_SHA256", "C_INPUT_PATH", "C_INPUT_SHA256", "C_RUN_ID", "C_RUN_SOURCE", "C_GATE_DIR"];
const STAGES = ["beforeFixture", "afterB1"];
const DEPLOYMENTS = ["ImportLib", "IndexModule", "Ledger", "LensReader", "MeasurementConsumer", "PassAcceptor", "Producer", "QuoteAcceptorV1"];
const PUBLICATIONS = ["BOOTSTRAP", "A1", "A2", "B1"];
const PAID_ROWS = ["POINT_A_FIRST", "LIST_A_FIRST", "POINT_B_FIRST", "LIST_B_FIRST"];
const CONTEXT_KEYS = ["schema", "stage", "runId", "runSource", "inputsSha256", "rpcUrl", "block", "snapshot", "ackPath"];
const ACK_KEYS = ["schema", "stage", "runId", "runSource", "inputsSha256", "contextSha256", "block", "evidenceGrade", "decision", "checks"];

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const digest = (value) => typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
const commit = (value) => typeof value === "string" && /^[0-9a-f]{40}$/.test(value);
const address = (value) => typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value);
const bytes = (value) => typeof value === "string" && /^0x(?:[0-9a-fA-F]{2})*$/.test(value);
const blockHash = (value) => typeof value === "string" && /^0x[0-9a-f]{64}$/.test(value);
const blockTag = (value) => typeof value === "string" && /^0x(?:0|[1-9a-f][0-9a-f]*)$/.test(value);
const fail = (code, detail = "") => { throw new Error(`${code}${detail ? `:${detail}` : ""}`); };
const check = (condition, code, detail) => { if (!condition) fail(code, detail); };
const lower = (value) => String(value).toLowerCase();
const clone = (value) => JSON.parse(JSON.stringify(value));

function exactKeys(value, expected, code) {
  check(value && typeof value === "object" && !Array.isArray(value), code);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  check(JSON.stringify(actual) === JSON.stringify(wanted), code, actual.find((key) => !wanted.includes(key)) ?? wanted.find((key) => !actual.includes(key)) ?? "keys");
}

function pinnedFile(filePath, expectedHash, label) {
  check(path.isAbsolute(filePath ?? "") && digest(expectedHash), "C_GATE_PIN_MALFORMED", label);
  let raw;
  try { raw = readFileSync(filePath); } catch (error) { fail("C_GATE_PIN_UNREADABLE", `${label}:${error.code ?? error.message}`); }
  check(sha256(raw) === expectedHash, "C_GATE_PIN_MISMATCH", label);
  return raw;
}

function within(root, relative, label) {
  check(typeof relative === "string" && relative.length > 0 && !path.isAbsolute(relative), "C_INPUT_MALFORMED", label);
  const resolved = path.resolve(root, relative);
  check(resolved.startsWith(`${path.resolve(root)}${path.sep}`), "C_INPUT_MALFORMED", label);
  return resolved;
}

function exactNamedObject(value, names, label) {
  exactKeys(value, names, "C_INPUT_MALFORMED");
  for (const name of names) check(value[name] && typeof value[name] === "object", "C_INPUT_MALFORMED", `${label}.${name}`);
}

export function validatePinnedInputs(input, { labRoot }) {
  check(input && typeof input === "object" && !Array.isArray(input), "C_INPUT_MALFORMED");
  check(commit(input.sourceRevision), "C_INPUT_MALFORMED", "sourceRevision");
  check(Number.isSafeInteger(input.chainId) && input.chainId > 0, "C_INPUT_MALFORMED", "chainId");
  check(address(input.accounts?.deployer?.address) && address(input.accounts?.authorA?.address) && address(input.accounts?.paidCaller?.address), "C_INPUT_MALFORMED", "accounts");
  const neutral = input.neutralExpectation;
  check(neutral && path.isAbsolute(neutral.path ?? "") && digest(neutral.sha256), "C_INPUT_MALFORMED", "neutralExpectation");
  pinnedFile(neutral.path, neutral.sha256, "neutralExpectation");

  check(Array.isArray(input.sources) && input.sources.length > 0, "C_INPUT_MALFORMED", "sources");
  const sourcePaths = new Set();
  for (const [index, row] of input.sources.entries()) {
    exactKeys(row, ["path", "sha256"], "C_INPUT_MALFORMED");
    check(!sourcePaths.has(row.path) && digest(row.sha256), "C_INPUT_MALFORMED", `sources.${index}`);
    sourcePaths.add(row.path);
    pinnedFile(within(labRoot, row.path, `sources.${index}.path`), row.sha256, `source:${row.path}`);
  }

  exactNamedObject(input.deployment, DEPLOYMENTS, "deployment");
  for (const name of DEPLOYMENTS) {
    const row = input.deployment[name];
    check(address(row.address) && path.isAbsolute(row.artifactPath ?? "") && digest(row.artifactSha256) && blockHash(row.runtimeKeccak), "C_INPUT_MALFORMED", `deployment.${name}`);
    pinnedFile(row.artifactPath, row.artifactSha256, `artifact:${name}`);
  }
  check(new Set(DEPLOYMENTS.map((name) => lower(input.deployment[name].address))).size === DEPLOYMENTS.length, "C_INPUT_MALFORMED", "deployment.addresses");
  exactNamedObject(input.publications, PUBLICATIONS, "publications");
  for (const name of PUBLICATIONS) {
    const row = input.publications[name];
    check(address(row.target) && address(row.caller) && bytes(row.calldata) && row.calldata.length >= 10, "C_INPUT_MALFORMED", `publications.${name}`);
  }
  check(input.publications.BOOTSTRAP.actions?.length === 7, "C_INPUT_MALFORMED", "publications.BOOTSTRAP.actions");
  for (const name of PUBLICATIONS) check(lower(input.publications[name].caller) === lower(input.accounts.deployer.address), "C_INPUT_MALFORMED", `publications.${name}.caller`);
  for (const name of ["BOOTSTRAP", "A1", "A2"]) check(lower(input.publications[name].target) === lower(input.deployment.Ledger.address), "C_INPUT_MALFORMED", `publications.${name}.target`);
  check(lower(input.publications.B1.target) === lower(input.deployment.Producer.address), "C_INPUT_MALFORMED", "publications.B1.target");

  check(Array.isArray(input.paid) && input.paid.length === 4, "C_INPUT_MALFORMED", "paid");
  const rows = input.paid.map((row) => row?.row);
  check(new Set(rows).size === 4 && PAID_ROWS.every((row) => rows.includes(row)), "C_INPUT_MALFORMED", "paid.rows");
  for (const [index, row] of input.paid.entries()) {
    check(address(row.target) && address(row.caller) && bytes(row.calldata) && row.calldata.length >= 10 && bytes(row.expectedReturn), "C_INPUT_MALFORMED", `paid.${index}`);
    check(blockHash(row.expectedEvent?.indexedKind) && bytes(row.expectedEvent?.data), "C_INPUT_MALFORMED", `paid.${index}.expectedEvent`);
    check(lower(row.caller) === lower(input.accounts.paidCaller.address) && lower(row.target) === lower(input.deployment.MeasurementConsumer.address), "C_INPUT_MALFORMED", `paid.${index}.route`);
  }
  check(Array.isArray(input.identityReads) && input.identityReads.length === 11, "C_INPUT_MALFORMED", "identityReads");
  check(Array.isArray(input.basisReads) && input.basisReads.length === 2, "C_INPUT_MALFORMED", "basisReads");
  check(Array.isArray(input.rawReadChecks), "C_INPUT_MALFORMED", "rawReadChecks");
  for (const [group, expected] of [[input.identityReads, ["expected"]], [input.basisReads, ["initialExpected", "postB1Expected"]], [input.rawReadChecks, ["initialExpected", "postB1Expected"]]]) {
    for (const row of group) {
      check(typeof row.label === "string" && address(row.target) && bytes(row.calldata), "C_INPUT_MALFORMED", "read");
      for (const key of expected) check(bytes(row[key]), "C_INPUT_MALFORMED", `${row.label}.${key}`);
    }
  }
  return input;
}

function defaultInspectGit(labRoot) {
  const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: labRoot, encoding: "utf8" }).trim();
  const status = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { cwd: labRoot, encoding: "utf8" });
  return { head, trackedDirty: status.trim().length !== 0 };
}

function defaultRunChild({ controllerPath, contextPath, env, timeoutMs }) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [controllerPath, contextPath], { env, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeoutMs);
    child.on("error", (error) => { clearTimeout(timer); resolve({ code: null, stdout, stderr: `${stderr}${error.message}`, timedOut }); });
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, stdout, stderr, timedOut }); });
  });
}

function writeExclusive(filePath, value) {
  writeFileSync(filePath, value, { flag: "wx", mode: 0o600 });
}

function validateBasis(basis) {
  exactKeys(basis, ["rpcUrl", "block", "snapshot"], "C_GATE_CONTEXT_MALFORMED");
  check(typeof basis.rpcUrl === "string" && blockTag(basis.block?.number) && blockHash(basis.block?.hash), "C_GATE_CONTEXT_MALFORMED", "block");
  exactKeys(basis.block, ["number", "hash"], "C_GATE_CONTEXT_MALFORMED");
  check(typeof basis.snapshot === "string" && basis.snapshot.length > 0, "C_GATE_CONTEXT_MALFORMED", "snapshot");
}

function validateAck(ack, context, contextRawHash) {
  exactKeys(ack, ACK_KEYS, "C_CONTROLLER_ACK_MALFORMED");
  check(ack.schema === "efs-lab-c/controller-ack/1", "C_CONTROLLER_ACK_MALFORMED", "schema");
  for (const key of ["stage", "runId", "runSource", "inputsSha256"]) check(ack[key] === context[key], "C_CONTROLLER_ACK_MISMATCH", key);
  check(ack.contextSha256 === contextRawHash, "C_CONTROLLER_ACK_MISMATCH", "contextSha256");
  check(JSON.stringify(ack.block) === JSON.stringify(context.block), "C_CONTROLLER_ACK_MISMATCH", "block");
  check(ack.evidenceGrade === "RPC_OBSERVED", "C_CONTROLLER_ACK_MISMATCH", "evidenceGrade");
  check(ack.decision === "ACK", "C_CONTROLLER_REFUSED");
  check(Array.isArray(ack.checks) && ack.checks.length > 0 && ack.checks.every((row) => row?.passed === true), "C_CONTROLLER_ACK_MALFORMED", "checks");
  return ack;
}

export async function createControllerGate({
  env = process.env, selectedCells = [], anvil = false,
  labRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  inspectGit = defaultInspectGit, runChild = defaultRunChild, timeoutMs = 120_000,
} = {}) {
  const present = ENV_KEYS.filter((key) => env[key] !== undefined && env[key] !== "");
  if (present.length === 0) {
    return { enabled: false, gating: "diagnostic-ungated", report: { gating: "diagnostic-ungated" }, invoke: async () => null, guard: async (_stage, _basis, continuation) => continuation() };
  }
  check(present.length === ENV_KEYS.length, "C_GATE_PINS_INCOMPLETE", ENV_KEYS.filter((key) => !present.includes(key)).join(","));
  check(anvil === true && selectedCells.length === 1 && selectedCells[0] === "typed-joined", "C_GATE_SELECTION");
  check(path.isAbsolute(env.C_GATE_DIR) && /^[A-Za-z0-9_-]{1,96}$/.test(env.C_RUN_ID) && commit(env.C_RUN_SOURCE), "C_GATE_PIN_MALFORMED", "run");
  pinnedFile(env.C_CONTROLLER_PATH, env.C_CONTROLLER_SHA256, "controller");
  const inputRaw = pinnedFile(env.C_INPUT_PATH, env.C_INPUT_SHA256, "input");
  let input;
  try { input = JSON.parse(inputRaw); } catch { fail("C_INPUT_MALFORMED", "json"); }
  validatePinnedInputs(input, { labRoot });
  const git = inspectGit(labRoot);
  check(git.head === env.C_RUN_SOURCE, "C_GATE_RUN_SOURCE");
  check(git.trackedDirty === false, "C_GATE_TRACKED_DIRTY");
  mkdirSync(env.C_GATE_DIR, { recursive: true, mode: 0o700 });
  const completed = new Set();
  const report = { gating: "controller-gated", runId: env.C_RUN_ID, runSource: env.C_RUN_SOURCE, inputsSha256: env.C_INPUT_SHA256, stages: {} };

  async function invoke(stage, basis) {
    check(STAGES.includes(stage), "C_GATE_STAGE_ORDER", stage);
    check(stage === "beforeFixture" ? completed.size === 0 : completed.has("beforeFixture") && !completed.has("afterB1"), "C_GATE_STAGE_ORDER", stage);
    validateBasis(basis);
    const contextPath = path.join(env.C_GATE_DIR, `context-${stage}.json`);
    const ackPath = path.join(env.C_GATE_DIR, `ack-${stage}.json`);
    check(!existsSync(contextPath) && !existsSync(ackPath), "C_GATE_EXCLUSIVE", stage);
    const context = {
      schema: "efs-lab-c/controller-context/1", stage, runId: env.C_RUN_ID, runSource: env.C_RUN_SOURCE,
      inputsSha256: env.C_INPUT_SHA256, rpcUrl: basis.rpcUrl, block: clone(basis.block), snapshot: basis.snapshot, ackPath,
    };
    exactKeys(context, CONTEXT_KEYS, "C_GATE_CONTEXT_MALFORMED");
    const contextRaw = Buffer.from(`${JSON.stringify(context, null, 2)}\n`);
    writeExclusive(contextPath, contextRaw);
    const result = await runChild({ controllerPath: env.C_CONTROLLER_PATH, contextPath, context: clone(context), env: { ...process.env, ...env }, timeoutMs });
    writeExclusive(path.join(env.C_GATE_DIR, `stdout-${stage}.log`), result.stdout ?? "");
    writeExclusive(path.join(env.C_GATE_DIR, `stderr-${stage}.log`), result.stderr ?? "");
    report.stages[stage] = { contextPath, contextSha256: sha256(contextRaw), ackPath, exitCode: result.code, timedOut: result.timedOut === true };
    check(sha256(readFileSync(contextPath)) === sha256(contextRaw), "C_CONTROLLER_CONTEXT_CHANGED", stage);
    check(result.timedOut !== true, "C_CONTROLLER_TIMEOUT");
    check(result.code === 0, "C_CONTROLLER_EXIT", String(result.code));
    let ackRaw;
    try { ackRaw = readFileSync(ackPath); } catch (error) { fail("C_CONTROLLER_ACK_MISSING", error.code ?? error.message); }
    let ack;
    try { ack = JSON.parse(ackRaw); } catch { fail("C_CONTROLLER_ACK_MALFORMED", "json"); }
    validateAck(ack, context, sha256(contextRaw));
    completed.add(stage);
    report.stages[stage].ackSha256 = sha256(ackRaw);
    report.stages[stage].checks = ack.checks.length;
    return clone(ack);
  }

  return { enabled: true, gating: "controller-gated", input: clone(input), report, invoke, guard: async (stage, basis, continuation) => { const ack = await invoke(stage, basis); return continuation(clone(ack)); } };
}

export function assertManifestCall(label, actual, expected) {
  for (const key of ["target", "caller"]) check(address(actual?.[key]) && lower(actual[key]) === lower(expected?.[key]), "C_MANIFEST_CALL_MISMATCH", `${label}.${key}`);
  check(bytes(actual?.calldata) && lower(actual.calldata) === lower(expected?.calldata), "C_MANIFEST_CALL_MISMATCH", `${label}.calldata`);
  return true;
}

export function assertPaidManifestOutcome(label, actual, expected) {
  check(bytes(actual?.returnData) && lower(actual.returnData) === lower(expected?.expectedReturn), "C_PAID_MANIFEST_MISMATCH", `${label}.expectedReturn`);
  const matches = (actual.logs ?? []).filter((log) => lower(log?.address) === lower(expected?.target) && lower(log?.topics?.[1]) === lower(expected?.expectedEvent?.indexedKind));
  check(matches.length === 1, "C_PAID_MANIFEST_MISMATCH", `${label}.expectedEvent.indexedKind`);
  check(lower(matches[0].data) === lower(expected.expectedEvent.data), "C_PAID_MANIFEST_MISMATCH", `${label}.expectedEvent.data`);
  return true;
}
