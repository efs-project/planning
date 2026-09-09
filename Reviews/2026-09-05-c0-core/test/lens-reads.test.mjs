import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parsePlan, resolveLens, PLAN_TYPE, PROFILE } from "../reference/lens-resolver.mjs";
import { AbiCoder, Interface, ZeroHash, keccak256 } from "../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js";
import { withLinkedReadHost, artifact, bytes, patch } from "./support/linked-read-host.mjs";
import { readState } from "../reference/state-reader.mjs";
import { fixtureInputs, word, domain, publication, groupLeaf, TX_GAS, ROOT } from "../scripts/local-stateful.mjs";
import { derive, encodeGroup } from "../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs";

const abi = AbiCoder.defaultAbiCoder();
const concat = (...parts) => "0x" + parts.map((x) => x.replace(/^0x/, "")).join("");
const principal = (i) => word(BigInt(i) + 1n);

// Independent canonical frame encoder, never the Solidity parser or oracle parser.
function encodePlan(entries, { combiner = 0, k = 0, flags = 0, purpose = ZeroHash, profile = PROFILE } = {}) {
  const frame = Buffer.alloc(96 + entries.length * 64);
  frame[0] = 1;
  frame[1] = combiner;
  frame[2] = flags;
  frame.writeUInt16BE(k, 4);
  frame.writeUInt16BE(entries.length, 6);
  Buffer.from(purpose.slice(2), "hex").copy(frame, 32);
  Buffer.from(profile.slice(2), "hex").copy(frame, 64);
  for (const [i, entry] of entries.entries()) {
    Buffer.from(entry.principal.slice(2), "hex").copy(frame, 96 + 64 * i);
    frame.writeUInt16BE(entry.tier ?? 0, 128 + 64 * i);
  }
  const prefix = Buffer.alloc(2);
  prefix.writeUInt16BE(frame.length);
  return "0x" + Buffer.concat([prefix, frame]).toString("hex");
}

test("independent frame parser binds candidate Type and structural-code ordering", () => {
  const groups = fixtureInputs().candidates.groups;
  const g = groups.find((x) => x.members.some((m) => m.descriptor.name === "ResolutionPlan/1"));
  const i = g.members.findIndex((m) => m.descriptor.name === "ResolutionPlan/1");
  assert.equal(encodeGroup(g.members.map((m) => m.descriptor)).toString("hex"), g.groupHex);
  assert.equal(derive(Buffer.from(g.groupHex, "hex")).ids[i], PLAN_TYPE);
  for (const n of [1, 8, 32, 64]) {
    const body = encodePlan(Array.from({ length: n }, (_, j) => ({ principal: principal(j) })));
    assert.equal(parsePlan(PLAN_TYPE, body).code, 0);
    assert.equal(bytes(body), 98 + 64 * n);
  }
  assert.equal(parsePlan(PLAN_TYPE, encodePlan(Array.from({ length: 65 }, (_, j) => ({ principal: principal(j) })))).code, 7);
  const b = Buffer.from(encodePlan([{ principal: principal(0) }, { principal: principal(1) }]).slice(2), "hex");
  const mutation = (offsets, code) => {
    const m = Buffer.from(b);
    for (const [offset, value] of offsets) m[offset] = value;
    assert.equal(parsePlan(PLAN_TYPE, "0x" + m.toString("hex")).code, code);
  };
  assert.equal(parsePlan(ZeroHash, "0x").code, 1);
  assert.equal(parsePlan(PLAN_TYPE, "0x00").code, 2);
  mutation([[0, 255]], 2);
  mutation([[2, 2], [3, 255]], 3);
  mutation([[3, 255], [4, 128]], 4);
  mutation([[5, 1], [196, 1]], 5);
  mutation([[7, 1]], 6);
  mutation([[193, 1]], 8);
  mutation([[3, 1], [193, 1], [195, 1]], 9);
  mutation([[5, 1]], 10);
  mutation([[195, 1]], 11);
  mutation([[4, 1]], 12);
  mutation([[141, 1]], 13);
  mutation([[66, 255]], 0);
});

test("unverified or missing basis cannot produce absence", () => {
  const result = resolveLens(null, {}, ZeroHash, ZeroHash);
  assert.equal(result.presence, 0);
  assert.equal(result.reasonCode, 4);
  assert.equal(result.winnerIndex, 65535);
});

function resultTuple(r) {
  return [BigInt(r.presence), BigInt(r.reasonCode), [BigInt(r.target.targetKind), r.target.targetA, BigInt(r.target.targetLeaf)],
    BigInt(r.winnerIndex), BigInt(r.winnerTier), r.winnerAdmissionOrdinal, BigInt(r.presentCount), BigInt(r.agreeCount),
    [r.basis.realmRevisionId, r.basis.blockNumber, r.basis.admissionHigh, BigInt(r.basis.basisKind)]];
}

function retained(state) {
  const { snapshot } = state;
  return Object.fromEntries(["counts", "bootstrap", "records", "types", "principals", "envelopes", "admissions",
    "batches", "occurrences", "bindings", "postings"].map((name) => [name, snapshot[name].map((item) => {
      if (!item || typeof item !== "object") return item;
      const { pin, ...data } = item;
      return data;
    })]));
}

function consumerArtifact(name) {
  return JSON.parse(readFileSync(join(ROOT, "out/LensReads.t.sol", name + ".json"), "utf8"));
}

async function deployConsumer(lab, name, constructor, values = {}) {
  const a = consumerArtifact(name);
  for (const [file, pin] of Object.entries(a.metadata.sources)) {
    assert.equal(keccak256(readFileSync(join(ROOT, file))), pin.keccak256, "consumer source " + file);
  }
  assert.deepEqual(a.bytecode.linkReferences, {});
  assert.deepEqual(a.deployedBytecode.linkReferences, {});
  let names;
  for (const file of readdirSync(join(ROOT, "out/build-info"))) {
    const info = JSON.parse(readFileSync(join(ROOT, "out/build-info", file)));
    const compiled = info.output?.contracts?.["test/LensReads.t.sol"]?.[name];
    if (compiled?.evm.bytecode.object !== a.bytecode.object.slice(2)) continue;
    assert.equal(compiled.evm.deployedBytecode.object, a.deployedBytecode.object.slice(2));
    assert.deepEqual(compiled.evm.deployedBytecode.immutableReferences ?? {}, a.deployedBytecode.immutableReferences ?? {});
    const contract = info.output.sources["test/LensReads.t.sol"].ast.nodes.find((node) => node.name === name);
    names = Object.fromEntries(contract.nodes.filter((node) => node.mutability === "immutable").map((node) => [node.id, node.name]));
    break;
  }
  assert(names, "consumer same-build AST");
  assert.deepEqual(Object.values(names).sort(), Object.keys(values).sort());
  const creation = a.bytecode.object + constructor.slice(2);
  assert(bytes(creation) <= 49152, "consumer full initcode cap");
  assert(bytes(a.deployedBytecode.object) <= 24576, "consumer runtime cap");
  const receipt = await lab.receipt(await lab.send(creation));
  assert.equal(receipt.status, "0x1", "normal consumer deployment");
  assert(BigInt(receipt.gasUsed) <= TX_GAS);
  const runtime = patch(a.deployedBytecode.object, a.deployedBytecode.immutableReferences ?? {},
    Object.fromEntries(Object.entries(names).map(([id, key]) => [id, values[key]])));
  assert.equal(await lab.rpc("eth_getCode", [receipt.contractAddress, receipt.blockNumber]), runtime);
  return { address: receipt.contractAddress, iface: new Interface(a.abi), runtime,
    metrics: { runtimeBytes: bytes(runtime), initcodeBytes: bytes(creation), deploymentGas: BigInt(receipt.gasUsed).toString(),
      codehash: keccak256(runtime) } };
}

function assertABI(iface) {
  const target = "tuple(uint8 targetKind,bytes32 targetA,uint16 targetLeaf)";
  const basis = "tuple(bytes32 realmRevisionId,uint64 blockNumber,uint64 admissionHigh,uint8 basisKind)";
  const result = `tuple(uint8 presence,uint8 reasonCode,${target} target,uint16 winnerIndex,uint16 winnerTier,uint64 winnerAdmissionOrdinal,uint16 presentCount,uint16 agreeCount,${basis} basis)`;
  const expected = new Interface([
    `function resolve(bytes32,bytes32) view returns (${result})`,
    `function resolveStrict(bytes32,bytes32,uint8) view returns (${target},${result})`,
    "function validatePlan(bytes32) view returns (bool,uint8)",
    "function deriveBindingKey(bytes32,bytes32) pure returns (bytes32)",
    "error PlanUnavailable(bytes32)", "error PlanMalformed(bytes32,uint8)", "error ResolveNotAccepted(uint8,uint8)",
  ]);
  for (const name of ["resolve", "resolveStrict", "validatePlan", "deriveBindingKey"]) {
    const shape = (f) => [f.selector, f.inputs.map((p) => p.format("sighash")), f.outputs.map((p) => p.format("sighash")), f.stateMutability];
    assert.deepEqual(shape(iface.getFunction(name)), shape(expected.getFunction(name)), "exact B0 ABI " + name);
  }
  for (const name of ["PlanUnavailable", "PlanMalformed", "ResolveNotAccepted"]) {
    assert.equal(iface.getError(name).selector, expected.getError(name).selector);
  }
  const old = new Interface(artifact("AuditPageReadHarness").abi);
  old.forEachFunction((f) => assert.equal(iface.getFunction(f.format("sighash")).format("full"), f.format("full"), "preserved old ABI"));
}

async function setup(ctx) {
  const { lab, publish } = ctx;
  const groups = lab.inputs.candidates.groups;
  const type = (name) => groups.flatMap((g) => g.members).find((m) => m.descriptor.name === name).temporaryTypeSchemaId;
  let nonce = 9000;
  let sender;
  const setupGas = [];
  const admit = async (p) => {
    const receipt = await publish(p);
    sender ??= receipt.from;
    assert.equal(receipt.from, sender, "same managed payer");
    setupGas.push(BigInt(receipt.gasUsed).toString());
    return p;
  };
  for (const index of [0, 1]) await admit(publication([groupLeaf(lab.inputs.meta, "0x" + groups[index].groupHex)], nonce++));
  const objects = [];
  for (const number of [700, 701]) {
    objects.push(await admit(publication([{ typeId: type("ObjectGenesis/1"), body: concat(principal(0), word(number), "00") }], nonce++)));
  }
  const purpose = word(201), role = word(202), subject = objects[0].recordIds[0];
  const position = keccak256(abi.encode(["bytes32", "bytes32", "bytes32", "bytes32"], [domain("efs2/position/1"), purpose, subject, role]));
  const bindingKey = (author) => keccak256(abi.encode(["bytes32", "bytes32", "bytes32"], [domain("efs2/binding/1"), author, position]));
  const plan = async (entries, options) => admit(publication([{ typeId: PLAN_TYPE, body: encodePlan(entries, options) }], nonce++));
  const predecessor = (p) => p ? concat("01", p.envelopeId, "0000") : "0x00";
  const set = async (author, target, previous = null, revision = 0, occurrenceLeaf = null) => {
    const targetBytes = occurrenceLeaf === null ? concat("01", target, "00") : concat("0001", target, occurrenceLeaf.toString(16).padStart(4, "0"));
    return admit(publication([{ typeId: type("BindingSet/1"), body: concat(purpose, subject, role, targetBytes, predecessor(previous)) }], nonce++, { principal: author, revisions: [[0, revision]] }));
  };
  const tombstone = (author, previous, revision) => admit(publication([{ typeId: type("BindingTombstone/1"), body: concat(purpose, subject, role, predecessor(previous)) }], nonce++, { principal: author, revisions: [[0, revision]] }));
  const withdraw = (p) => admit(publication([{ typeId: type("Withdrawal/1"), body: concat(p.envelopeId, "0000") }], nonce++, { principal: p.header.principalId }));
  const ordinary = (typeId, body) => admit(publication([{ typeId, body }], nonce++));
  return { ...ctx, setupGas, objects, position, bindingKey, plan, set, tombstone, withdraw, ordinary, type, admit, sender };
}

test("real Lens transitions, full-width Principals and admin-pinned consumer trust boundary", { timeout: 600000 }, async (t) => {
  const report = await withLinkedReadHost("LensReadHarness", async (context) => {
    const ctx = await setup(context);
    const scope = domain("gate/install/example-scope");
    const good = principal(0);
    const attacker = word((1n << 200n) + 1n);
    assert.equal(good.slice(-40), attacker.slice(-40));
    assert.notEqual(ctx.bindingKey(good), ctx.bindingKey(attacker));
    assert.equal((await ctx.call("deriveBindingKey", [attacker, ctx.position], "latest"))[0], ctx.bindingKey(attacker));
    const approved = await ctx.plan([{ principal: good }], { purpose: scope });
    const malicious = await ctx.plan([{ principal: attacker }], { purpose: scope });
    const first = await ctx.set(good, ctx.objects[0].recordIds[0]);
    const attackerFirst = await ctx.set(attacker, ctx.objects[1].recordIds[0]);
    const both = await ctx.plan([{ principal: good }, { principal: attacker }]);
    assert.equal((await compare(ctx, both.recordIds[0], "full-width-distinct")).expected.presence, 3);

    const gate = await deployConsumer(ctx.lab, "AdminPinnedLensGate", abi.encode(["address", "bytes32"], [ctx.host, scope]),
      { admin: ctx.sender, core: ctx.host, expectedPurposeAndScope: scope });
    context.report.gate = gate.metrics;
    const gateCall = async (name, args, from = ctx.sender) => {
      const raw = await ctx.lab.rpc("eth_call", [{ from, to: gate.address, data: gate.iface.encodeFunctionData(name, args) }, "latest"]);
      return gate.iface.decodeFunctionResult(name, raw);
    };
    const gateTx = async (name, args, succeeds = true) => {
      const receipt = await ctx.lab.receipt(await ctx.lab.send(gate.iface.encodeFunctionData(name, args), gate.address));
      assert.equal(receipt.status, succeeds ? "0x1" : "0x0", name + " gate transaction");
      return receipt;
    };
    await gateTx("setApprovedPlan", [approved.recordIds[0]]);
    await assert.rejects(gateCall("setApprovedPlan", [malicious.recordIds[0]], "0x000000000000000000000000000000000000bEEF"), /only admin/);
    const attackerResolution = await compare(ctx, malicious.recordIds[0], "attacker direct resolution is neutral");
    assert.equal(attackerResolution.expected.presence, 1);
    assert.equal((await gateCall("actions", []))[0], 0n, "direct resolve grants no gate action");
    await gateTx("act", [ctx.position]);
    assert.equal((await gateCall("acceptedTarget", []))[0], ctx.objects[0].recordIds[0], "gate uses only admin-selected plan");
    assert.equal((await gateCall("actions", []))[0], 1n);

    const wrongPurpose = await ctx.plan([{ principal: good }], { purpose: domain("display/wrong-scope") });
    await gateTx("setApprovedPlan", [wrongPurpose.recordIds[0]], false);
    assert.equal((await gateCall("approvedPlanRecordId", []))[0], approved.recordIds[0]);
    const beforeRebind = await compare(ctx, approved.recordIds[0], "before rebind");
    const next = await ctx.set(good, ctx.objects[1].recordIds[0], first, 1);
    const afterRebind = await compare(ctx, approved.recordIds[0], "after rebind");
    assert.notEqual(beforeRebind.expected.winnerAdmissionOrdinal, afterRebind.expected.winnerAdmissionOrdinal);
    await ctx.withdraw(first);
    const staleWithdrawal = await compare(ctx, approved.recordIds[0], "stale withdrawal");
    assert.equal(staleWithdrawal.expected.winnerAdmissionOrdinal, afterRebind.expected.winnerAdmissionOrdinal);
    const withdrawal = await ctx.withdraw(next);
    assert.equal((await compare(ctx, approved.recordIds[0], "current withdrawal")).expected.presence, 2);
    await gateTx("act", [ctx.position], false);
    assert.equal((await gateCall("actions", []))[0], 1n);
    const rebound = await ctx.set(good, ctx.objects[0].envelopeId, withdrawal, 3, 0);
    assert.equal((await compare(ctx, approved.recordIds[0], "occurrence target")).expected.target.targetKind, 2);
    await gateTx("act", [ctx.position], false);
    assert.equal((await gateCall("actions", []))[0], 1n);
    const tomb = await ctx.tombstone(good, rebound, 4);
    assert.equal((await compare(ctx, approved.recordIds[0], "explicit tombstone")).expected.presence, 2);
    const tombWithdrawal = await ctx.withdraw(tomb);
    assert.equal((await compare(ctx, approved.recordIds[0], "withdrawn tombstone never resurrects")).expected.presence, 2);
    const restored = await ctx.set(good, ctx.objects[0].recordIds[0], tombWithdrawal, 6);
    const restoredState = await compare(ctx, approved.recordIds[0], "same-target rebinding changes decision ordinal");
    assert.equal(restoredState.expected.target.targetA, beforeRebind.expected.target.targetA);
    assert.notEqual(restoredState.expected.winnerAdmissionOrdinal, beforeRebind.expected.winnerAdmissionOrdinal);
    await gateTx("act", [ctx.position]);

    const twoLeaves = await ctx.admit(publication([801, 802].map((v) => ({ typeId: ctx.type("ObjectGenesis/1"), body: concat(good, word(v), "00") })), 900000, { principal: good }));
    const nextOccurrence = await ctx.set(good, twoLeaves.envelopeId, restored, 7, 0);
    await ctx.set(attacker, twoLeaves.envelopeId, attackerFirst, 1, 1);
    assert.equal((await compare(ctx, both.recordIds[0], "same-envelope different leaves")).expected.presence, 3);
    assert(nextOccurrence.envelopeId);

    const unknown = await ctx.plan([{ principal: good }], { profile: domain("unknown/profile") });
    assert.equal((await compare(ctx, unknown.recordIds[0], "unknown profile")).expected.presence, 4);
    const malformed = Buffer.from(encodePlan([{ principal: good }]).slice(2), "hex");
    malformed[2] = 2;
    const invalid = await ctx.ordinary(PLAN_TYPE, "0x" + malformed.toString("hex"));
    assert.deepEqual((await ctx.call("validatePlan", [invalid.recordIds[0]], "latest")).toArray(), [false, 3n]);
    await assert.rejects(ctx.call("resolve", [invalid.recordIds[0], ctx.position], "latest"));
    assert.deepEqual((await ctx.call("validatePlan", [ctx.objects[0].recordIds[0]], "latest")).toArray(), [false, 1n]);
    await assert.rejects(ctx.call("resolve", [ZeroHash, ctx.position], "latest"));
    await assert.rejects(ctx.call("validatePlan", [ZeroHash], "latest"));
    const verified = await readState(ctx.reader);
    assert.equal(verified.outcome, "VERIFIED", verified.reason);
    assert.equal(resolveLens(verified, ctx.reader.expected, ZeroHash, ctx.position).reasonCode, 5);
    assert.equal(resolveLens(verified, ctx.reader.expected, invalid.recordIds[0], ctx.position).reasonCode, 7);
    const corrupted = structuredClone(verified);
    corrupted.snapshot.records[0].row[1] = "0x";
    assert.equal(resolveLens(corrupted, ctx.reader.expected, approved.recordIds[0], ctx.position).presence, 0, "forged VERIFIED label is rechecked");
    context.report.sourceBasis = verified.basis;
    context.report.setupTransactionGas = ctx.setupGas;
    const pristine = await ctx.lab.rpc("evm_snapshot");
    try {
      await ctx.lab.rpc("anvil_setCode", [ctx.getters.preparationHelper, "0x60006000fd"]);
      assert.equal((await ctx.call("resolve", [approved.recordIds[0], ctx.position], "latest"))[0].presence, 1n);
      assert.equal((await ctx.call("validatePlan", [approved.recordIds[0]], "latest"))[0], true);
      await ctx.call("resolveStrict", [approved.recordIds[0], ctx.position, 2], "latest");
      for (const substitute of ["0x60006000fd", "0x"]) {
        await ctx.lab.rpc("anvil_setCode", [ctx.addresses.QueryReadLibrary, substitute]);
        const mismatch = new RegExp(ctx.iface.getError("ReadCodeMismatch").selector);
        await assert.rejects(ctx.call("resolve", [ZeroHash, ctx.position], "latest"), mismatch);
        await assert.rejects(ctx.call("resolveStrict", [ZeroHash, ctx.position, 2], "latest"), mismatch);
        await assert.rejects(ctx.call("validatePlan", [ZeroHash], "latest"), mismatch);
        assert.equal((await ctx.call("deriveBindingKey", [good, ctx.position], "latest"))[0], ctx.bindingKey(good));
      }
    } finally {
      assert(await ctx.lab.rpc("evm_revert", [pristine]));
    }
    const restoredEvidence = await readState(ctx.reader);
    assert.equal(restoredEvidence.outcome, "VERIFIED", restoredEvidence.reason);
    assert.deepEqual(retained(restoredEvidence), retained(verified));
  });
  t.diagnostic(JSON.stringify({ gate: report.gate, basis: report.sourceBasis, setupTransactionGas: report.setupTransactionGas, cleanup: report.cleanup }));
});

async function compare(ctx, planId, label) {
  const state = await readState(ctx.reader);
  assert.equal(state.outcome, "VERIFIED", label + ": " + state.reason);
  const pin = { blockHash: state.basis.hash, requireCanonical: true };
  const expected = resolveLens(state, ctx.reader.expected, planId, ctx.position);
  const actual = (await ctx.call("resolve", [planId, ctx.position], pin))[0];
  assert.deepEqual(actual.toArray(true), resultTuple(expected), label + " complete B0 tuple");
  return { state, pin, expected, actual };
}

for (const n of [1, 8, 32, 64]) {
  test(`normally deployed real-admission Lens/consumer matrix N=${n}`, { timeout: 600000 }, async (t) => {
    const report = await withLinkedReadHost("LensReadHarness", async (context) => {
      assertABI(context.iface);
      const ctx = await setup(context);
      context.report.initialSetupTransactionGas = [...ctx.setupGas];
      const consumer = await deployConsumer(ctx.lab, "StaticLensConsumer", "0x");
      context.report.consumer = consumer.metrics;
      let clean = await ctx.lab.rpc("evm_snapshot");
      for (const scenario of ["exact-all", "priority-first", "priority-last", "priority-absent", "threshold-disagreement", "threshold-winner"]) {
        assert(await ctx.lab.rpc("evm_revert", [clean]));
        clean = await ctx.lab.rpc("evm_snapshot");
        const setupStart = ctx.setupGas.length;
        const priority = scenario.startsWith("priority");
        const threshold = scenario.startsWith("threshold");
        const entries = Array.from({ length: n }, (_, i) => ({ principal: principal(i), tier: priority ? i : 0 }));
        const k = scenario === "threshold-winner" ? Math.floor(n / 2) + 1 : threshold ? Math.max(1, Math.floor(n / 2)) : 0;
        const p = await ctx.plan(entries, { combiner: priority ? 1 : threshold ? 2 : 0, k });
        for (let i = 0; i < n; ++i) {
          if (scenario === "priority-absent" || (scenario === "priority-first" && i !== 0) || (scenario === "priority-last" && i !== n - 1)) continue;
          const split = scenario === "threshold-winner" ? k : Math.ceil(n / 2);
          const target = threshold && i >= split ? ctx.objects[1].recordIds[0] : ctx.objects[0].recordIds[0];
          await ctx.set(principal(i), target);
        }
        const id = p.recordIds[0];
        const { state, pin, expected } = await compare(ctx, id, scenario);
        const intended = scenario === "priority-absent" ? 2 : scenario === "threshold-disagreement" && n > 1 ? 3 : 1;
        assert.equal(expected.presence, intended, "independent hand-checked scenario outcome");
        assert.equal(expected.presentCount, scenario === "priority-absent" ? 0 : priority ? 1 : n);
        const unavailable = resolveLens(state, ctx.reader.expected, id, ctx.position, { unavailableKeys: new Set([ctx.bindingKey(principal(0))]) });
        assert.equal(unavailable.presence, 0, "missing required/high-priority coverage never falls through");
        assert.equal(unavailable.reasonCode, 6);
        if (scenario === "priority-first" && n > 1) {
          const unconsulted = resolveLens(state, ctx.reader.expected, id, ctx.position,
            { unavailableKeys: new Set([ctx.bindingKey(principal(n - 1))]) });
          assert.equal(unconsulted.presence, 1, "unconsulted lower-priority coverage does not change result");
        }
        const sizes = {};
        const gas = {};
        for (const [name, args, wantedBytes] of [["resolve", [id, ctx.position], 448],
          ["resolveStrict", [id, ctx.position, 1 << expected.presence], 544], ["validatePlan", [id], 64]]) {
          const raw = await ctx.raw(name, args, pin);
          sizes[name] = bytes(raw);
          assert.equal(bytes(raw), wantedBytes, "fixed returndata " + name);
          const result = ctx.iface.decodeFunctionResult(name, raw);
          if (name === "resolveStrict") {
            assert.deepEqual(result[1].toArray(true), resultTuple(expected));
            assert.deepEqual(result[0].toArray(), resultTuple(expected)[2]);
          }
          if (name === "validatePlan") assert.deepEqual(result.toArray(), [true, 0n]);
          const receipt = await ctx.lab.receipt(await ctx.lab.send(ctx.iface.encodeFunctionData(name, args), ctx.host));
          assert.equal(receipt.status, "0x1", name + " actual single-call transaction");
          gas[name] = BigInt(receipt.gasUsed).toString();
          assert(BigInt(receipt.gasUsed) <= TX_GAS);
        }
        const consumerCalls = {};
        for (const name of ["once", "twice"]) {
          const receipt = await ctx.lab.receipt(await ctx.lab.send(consumer.iface.encodeFunctionData(name, [ctx.host, id, ctx.position]), consumer.address));
          assert.equal(receipt.status, "0x1", "static consumer tx");
          const event = consumer.iface.parseLog(receipt.logs[0]);
          const atCallBlock = resultTuple(expected);
          atCallBlock[8][1] = BigInt(receipt.blockNumber);
          const expectedHash = keccak256(ctx.iface.encodeFunctionResult("resolve", [atCallBlock]));
          assert.equal(event.args.firstResult, expectedHash, "actual consumer result at its executing block");
          if (name === "twice") assert.equal(event.args.firstResult, event.args.secondResult, "one-transaction same basis");
          consumerCalls[name] = { transactionGas: BigInt(receipt.gasUsed).toString(), marginalFirst: event.args.first.toString(), marginalSecond: event.args.second.toString() };
        }
        const after = await readState(ctx.reader);
        assert.equal(after.outcome, "VERIFIED", after.reason);
        assert.deepEqual(retained(after), retained(state), "all retained Store observations unchanged by read/consumer transactions");
        const measurement = { n, scenario, basis: state.basis, presence: expected.presence,
          setupTransactionGas: ctx.setupGas.slice(setupStart), returndataBytes: sizes, singleCallTransactionGas: gas, consumerCalls };
        context.report.measurements.push(measurement);
        t.diagnostic(JSON.stringify(measurement));
      }
    });
    t.diagnostic(JSON.stringify({ n, baseComponents: report.managed.deployment, inputPins: report.managed.inputPins,
      initialSetupTransactionGas: report.initialSetupTransactionGas, components: report.readLibraries,
      host: report.host, consumer: report.consumer, cleanup: report.cleanup }));
    assert(report.cleanup.stopped);
  });
}
