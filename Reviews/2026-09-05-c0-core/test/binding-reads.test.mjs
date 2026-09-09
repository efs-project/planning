import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  AbiCoder,
  Interface,
  ZeroHash,
  keccak256,
} from "../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js";
import { readState, foldAdmissions } from "../reference/state-reader.mjs";
import {
  ROOT,
  TX_GAS,
  compileStateful,
  groupLeaf,
  publication,
  withStateful,
  word,
  domain,
} from "../scripts/local-stateful.mjs";

const abi = AbiCoder.defaultAbiCoder();
const bytes = (value) => (value.length - 2) / 2;
const concat = (...values) =>
  "0x" + values.map((value) => value.replace(/^0x/, "")).join("");
const artifact = (name) =>
  JSON.parse(
    readFileSync(join(ROOT, "out", name + ".sol", name + ".json"), "utf8"),
  );
const targets = ["AdmissionLibrary", "PointReadLibrary", "QueryReadLibrary"];
const queryABI = new Interface([
  "function getBindingHead(bytes32) view returns (tuple(uint8 state,uint8 targetKind,uint8 tombstoneCause,uint32 revision,uint64 admissionOrdinal,bytes32 targetA,uint16 targetLeaf),bytes32,uint64)",
  "function getBindingAtBasis(bytes32,uint64) view returns (tuple(uint8 state,uint8 targetKind,uint8 tombstoneCause,uint32 revision,uint64 admissionOrdinal,bytes32 targetA,uint16 targetLeaf),bytes32,uint64)",
  "function readHistory(bytes32,uint32,uint16) view returns (tuple(uint32 revision,uint64 admissionOrdinal,bytes32 envelopeId,uint16 leafIndex,uint8 occurrenceStatus,uint64 revokedAtOrdinal)[],uint32,uint8)",
]);

// Exact compiler windows only; unknown/missing/overlapping/unresolved patches fail closed.
function patch(template, references, values) {
  let code = template.replace(/^0x/, "");
  assert.deepEqual(
    Object.keys(references).sort(),
    Object.keys(values).sort(),
    "complete patch inventory",
  );
  const used = new Set();
  for (const [id, positions] of Object.entries(references)) {
    assert(positions.length, "nonempty patch windows");
    for (const { start, length } of positions) {
      const value = values[id].replace(/^0x/, "").padStart(length * 2, "0");
      assert.equal(value.length, length * 2);
      assert(start >= 0 && (start + length) * 2 <= code.length);
      for (let i = start; i < start + length; i++) {
        assert(!used.has(i), "nonoverlapping windows");
        used.add(i);
      }
      code =
        code.slice(0, start * 2) + value + code.slice((start + length) * 2);
    }
  }
  assert.match(code, /^[0-9a-f]*$/, "all compiler placeholders resolved");
  return "0x" + code;
}
function links(bytecode, addresses) {
  const refs = {};
  for (const [file, libs] of Object.entries(bytecode.linkReferences))
    for (const [name, positions] of Object.entries(libs)) {
      assert(targets.includes(name), "closed link targets");
      assert.equal(file, "src/" + name + ".sol", "exact source/target pair");
      assert(!refs[name], "unique target");
      assert(positions.every((p) => p.length === 20));
      refs[name] = positions;
    }
  return patch(bytecode.object, refs, addresses);
}
function provenance(a) {
  for (const [file, pin] of Object.entries(a.metadata.sources))
    assert.equal(
      keccak256(readFileSync(join(ROOT, file))),
      pin.keccak256,
      "current source " + file,
    );
  for (const filename of readdirSync(join(ROOT, "out/build-info"))) {
    const info = JSON.parse(
      readFileSync(join(ROOT, "out/build-info", filename)),
    );
    const compiled =
      info.output?.contracts?.["test/BindingReadHarness.sol"]
        ?.BindingReadHarness;
    if (compiled?.evm?.bytecode?.object !== a.bytecode.object.slice(2))
      continue;
    if (
      compiled.evm.deployedBytecode.object !==
      a.deployedBytecode.object.slice(2)
    )
      continue;
    if (
      JSON.stringify(compiled.evm.deployedBytecode.immutableReferences) !==
      JSON.stringify(a.deployedBytecode.immutableReferences)
    )
      continue;
    const names = {};
    for (const file of [
      "test/StatefulHarness.sol",
      "test/BindingReadHarness.sol",
    ]) {
      const ast = info.output.sources[file]?.ast;
      assert(ast, "same-build AST");
      for (const contract of ast.nodes.filter((n) =>
        ["StatefulHarness", "BindingReadHarness"].includes(n.name),
      )) {
        for (const n of contract.nodes.filter(
          (n) => n.mutability === "immutable",
        ))
          names[n.id] = n.name;
      }
    }
    assert.deepEqual(
      Object.keys(names).sort(),
      Object.keys(a.deployedBytecode.immutableReferences).sort(),
    );
    return names;
  }
  assert.fail(
    "no exact same-build immutable AST provenance; force --ast --build-info build",
  );
}
function expectedHead(fold, key) {
  const h = fold.bindings.get(key);
  return h
    ? [
        BigInt(h.state),
        BigInt(h.targetKind),
        BigInt(h.cause),
        h.revision,
        h.ordinal,
        h.target,
        BigInt(h.targetLeaf),
      ]
    : [0n, 0n, 0n, 0n, 0n, ZeroHash, 0n];
}

test(
  "normally deployed linked Binding readers match independent canonical retained-state folds",
  { timeout: 600000 },
  async (t) => {
    compileStateful();
    const a = artifact("BindingReadHarness"),
      names = provenance(a),
      iface = new Interface(a.abi),
      old = new Interface(artifact("OccurrenceReadHarness").abi);
    const pointNames = [
      "getTypeSchema",
      "getTypeOrigin",
      "intrinsicTypeGroupBytes",
      "getRecord",
      "getEnvelope",
      "getOccurrence",
      "getOccurrenceByOrdinal",
      "getReceipt",
    ];
    const shape = (f) => ({
      inputs: f.inputs.map((p) => p.format("sighash")),
      outputs: f.outputs.map((p) => p.format("full")),
      mutability: f.stateMutability,
    });
    for (const name of [
      ...pointNames,
      "getBindingHead",
      "getBindingAtBasis",
      "readHistory",
    ])
      assert.deepEqual(
        shape(iface.getFunction(name)),
        shape((pointNames.includes(name) ? old : queryABI).getFunction(name)),
        "preserved ABI " + name,
      );
    const report = {
      compiler: a.metadata.compiler,
      settings: a.metadata.settings,
      sourcePins: a.metadata.sources,
      measurements: [],
    };
    await withStateful(async (lab) => {
      report.managed = lab.resources;
      report.cleanup = lab.cleanup;
      const components = { ...lab.expected.components },
        addresses = { AdmissionLibrary: components.library.address },
        getters = { ...lab.expected.getters };
      report.readLibraries = {};
      for (const [name, prefix] of [
        ["PointReadLibrary", "pointRead"],
        ["QueryReadLibrary", "queryRead"],
      ]) {
        const lib = artifact(name);
        for (const [file, pin] of Object.entries(lib.metadata.sources))
          assert.equal(
            keccak256(readFileSync(join(ROOT, file))),
            pin.keccak256,
          );
        assert.deepEqual(lib.bytecode.linkReferences, {});
        assert.deepEqual(lib.deployedBytecode.linkReferences, {});
        assert(
          bytes(lib.bytecode.object) <= 49152 &&
            bytes(lib.deployedBytecode.object) <= 24576,
        );
        const receipt = await lab.receipt(await lab.send(lib.bytecode.object));
        assert.equal(receipt.status, "0x1", name + " normal deployment");
        assert(BigInt(receipt.gasUsed) <= TX_GAS);
        const address = receipt.contractAddress,
          refs = lib.deployedBytecode.immutableReferences ?? {},
          code = patch(
            lib.deployedBytecode.object,
            refs,
            Object.keys(refs).length ? { library_deploy_address: address } : {},
          );
        assert.equal(
          await lab.rpc("eth_getCode", [address, receipt.blockNumber]),
          code,
          "full independent library runtime",
        );
        addresses[name] = address;
        getters[prefix + "Library"] = address;
        getters[prefix + "Codehash"] = keccak256(code);
        components[prefix] = { address, code };
        report.readLibraries[name] = {
          runtimeBytes: bytes(code),
          initcodeBytes: bytes(lib.bytecode.object),
          deploymentGas: BigInt(receipt.gasUsed).toString(),
          codehash: keccak256(code),
          ownAddressPatches: lib.deployedBytecode.immutableReferences,
        };
      }
      const ctor = abi.encode(
        [
          "tuple(bytes32 realmId,bytes32 initialRevisionId,bytes intrinsicGroupBytes,bytes objectGroup1Bytes,bytes kernelGroup2Bytes)",
          "address",
          "bytes32",
          "bytes32",
          "bytes32",
          "bytes32",
        ],
        [
          lab.inputs.init,
          getters.preparationHelper,
          getters.preparationCodehash,
          getters.admissionCodehash,
          getters.pointReadCodehash,
          getters.queryReadCodehash,
        ],
      );
      const creation = links(a.bytecode, addresses) + ctor.slice(2),
        runtime = patch(
          links(a.deployedBytecode, addresses),
          a.deployedBytecode.immutableReferences,
          Object.fromEntries(
            Object.entries(names).map(([id, name]) => [id, getters[name]]),
          ),
        );
      assert(bytes(creation) <= 49152, "normal full initcode cap");
      assert(bytes(runtime) <= 24576, "normal host runtime cap");
      const deployed = await lab.receipt(await lab.send(creation));
      assert.equal(deployed.status, "0x1", "normal joined host deployment");
      assert(BigInt(deployed.gasUsed) <= TX_GAS);
      const host = deployed.contractAddress;
      assert.equal(
        await lab.rpc("eth_getCode", [host, deployed.blockNumber]),
        runtime,
        "full independent host runtime",
      );
      components.core = { address: host, code: runtime };
      const reader = {
        ...lab,
        core: host,
        iface,
        expected: {
          ...lab.expected,
          core: host,
          components,
          getters: lab.expected.getters,
        },
      };
      report.host = {
        runtimeBytes: bytes(runtime),
        initcodeBytes: bytes(creation),
        constructorBytes: bytes(ctor),
        deploymentGas: BigInt(deployed.gasUsed).toString(),
        codehash: keccak256(runtime),
        links: a.bytecode.linkReferences,
        runtimeLinks: a.deployedBytecode.linkReferences,
        immutables: names,
      };
      const raw = (name, args, pin) =>
        lab.rpc("eth_call", [
          {
            to: host,
            data: iface.encodeFunctionData(name, args),
            gas: "0x1000000",
          },
          pin,
        ]);
      const call = async (name, args, pin) =>
        iface.decodeFunctionResult(name, await raw(name, args, pin));
      const publish = async (p) => {
        const receipt = await lab.receipt(
          await lab.send(
            iface.encodeFunctionData("publishTrustedForTest", [
              lab.context(p.header.principalId),
              p,
            ]),
            host,
          ),
        );
        assert.equal(receipt.status, "0x1", "actual Binding admission");
        assert(BigInt(receipt.gasUsed) <= TX_GAS);
        return receipt;
      };
      const principal = word((1n << 256n) - 1n),
        second = word((1n << 255n) + ((1n << 160n) - 1n)),
        groups = lab.inputs.candidates.groups;
      const type = (name) =>
        groups.flatMap((g) => g.members).find((m) => m.descriptor.name === name)
          .temporaryTypeSchemaId;
      await publish(
        publication(
          [groupLeaf(lab.inputs.meta, "0x" + groups[0].groupHex)],
          800,
        ),
      );
      await publish(
        publication(
          [groupLeaf(lab.inputs.meta, "0x" + groups[1].groupHex)],
          801,
        ),
      );
      const object = publication(
        [
          {
            typeId: type("ObjectGenesis/1"),
            body: concat(principal, word(99), "00"),
          },
        ],
        802,
        { principal },
      );
      await publish(object);
      const target = object.recordIds[0],
        purpose = word(1),
        role = word(2);
      const keyFor = (author, field) =>
        keccak256(
          abi.encode(
            ["bytes32", "bytes32", "bytes32"],
            [
              domain("efs2/binding/1"),
              author,
              keccak256(
                abi.encode(
                  ["bytes32", "bytes32", "bytes32", "bytes32"],
                  [domain("efs2/position/1"), purpose, target, field],
                ),
              ),
            ],
          ),
        );
      const key = keyFor(principal, role),
        keys = [
          key,
          keyFor(second, role),
          keyFor(principal, word(3)),
          keyFor(principal, word(4)),
          domain("empty-key"),
        ];
      let nonce = 803;
      const predecessor = (p) =>
        p ? concat("01", p.envelopeId, "0000") : "0x00";
      const mutation = (
        kind,
        author,
        field,
        previous,
        revision,
        occurrence = false,
      ) =>
        publication(
          [
            {
              typeId: type(
                kind === "set" ? "BindingSet/1" : "BindingTombstone/1",
              ),
              body: concat(
                purpose,
                target,
                field,
                kind === "set"
                  ? occurrence
                    ? concat("0001", object.envelopeId, "0000")
                    : concat("01", target, "00")
                  : "0x",
                predecessor(previous),
              ),
            },
          ],
          nonce++,
          { principal: author, revisions: [[0, revision]] },
        );
      const withdraw = (p) =>
        publication(
          [
            {
              typeId: type("Withdrawal/1"),
              body: concat(p.envelopeId, "0000"),
            },
          ],
          nonce++,
          { principal: p.header.principalId },
        );
      const first = mutation("set", principal, role, null, 0);
      await publish(first);
      const check = async (label) => {
        const state = await readState(reader);
        assert.equal(state.outcome, "VERIFIED", label + ": " + state.reason);
        const pin = { blockHash: state.basis.hash, requireCanonical: true },
          ids = {
            set: state.snapshot.bootstrap[7],
            tombstone: state.snapshot.bootstrap[8],
            withdrawal: state.snapshot.bootstrap[9],
          };
        for (const getter of [
          "pointReadLibrary",
          "pointReadCodehash",
          "queryReadLibrary",
          "queryReadCodehash",
        ])
          assert.equal(
            (await call(getter, [], pin))[0].toLowerCase(),
            getters[getter].toLowerCase(),
          );
        for (const k of keys) {
          for (let h = 0n; h <= BigInt(state.counts[4]); h++) {
            const selected = h || BigInt(state.counts[4]),
              fold = foldAdmissions(
                state.entries.filter((e) => e.ordinal <= selected),
                ids,
              );
            assert.equal(fold.outcome, "VERIFIED");
            const actual = await call("getBindingAtBasis", [k, h], pin);
            assert.deepEqual(
              [...actual[0]],
              expectedHead(fold, k),
              label + " all historical fields",
            );
            assert.equal(actual[1], state.snapshot.bootstrap[1]);
            assert.equal(actual[2], selected);
          }
          const current = await call("getBindingHead", [k], pin);
          assert.deepEqual([...current[0]], expectedHead(state.fold, k));
          assert.equal(current[1], state.snapshot.bootstrap[1]);
          assert.equal(current[2], BigInt(state.counts[4]));
          const history = state.fold.histories.get(k) ?? [],
            byOrdinal = new Map(state.entries.map((e) => [e.ordinal, e]));
          const expected = history.map((ordinal, i) => {
            const e = byOrdinal.get(ordinal);
            assert(e);
            const life = state.fold.lifecycle.get(e.envelopeId + ":" + e.leaf);
            assert(life);
            return [
              BigInt(i + 1),
              ordinal,
              e.envelopeId,
              BigInt(e.leaf),
              BigInt(life.status),
              life.withdrawal,
            ];
          });
          for (const from of new Set([
            1n,
            BigInt(history.length || 1),
            BigInt(history.length + 1),
            0xffffffffn,
          ]))
            for (const limit of [1n, 64n]) {
              const actual = await call("readHistory", [k, from, limit], pin),
                start = Number(from - 1n),
                page = expected.slice(start, start + Number(limit)),
                complete = start + page.length >= history.length;
              assert.deepEqual(
                actual[0].map((e) => [...e]),
                page,
                "all six history fields",
              );
              assert.equal(
                actual[1],
                complete ? 0n : from + BigInt(page.length),
              );
              assert.equal(actual[2], complete ? 1n : 2n);
              assert.equal(
                bytes(await raw("readHistory", [k, from, limit], pin)),
                128 + 192 * page.length,
              );
            }
        }
        report.sourceBlocks ??= {};
        report.sourceBlocks[label] = state.basis;
        return state;
      };
      await check("first-set");
      t.diagnostic(
        "CHECKPOINT: normal linked host deployed; first SET and all H cuts match independent canonical retained-state fold.",
      );
      const next = mutation("set", principal, role, first, 1, true);
      await publish(next);
      await publish(withdraw(first));
      await check("withdraw-stale");
      const tomb = mutation("tomb", principal, role, next, 2);
      await publish(tomb);
      const wd = withdraw(tomb);
      await publish(wd);
      await check("withdraw-current-tombstone");
      const rebound = mutation("set", principal, role, wd, 4);
      await publish(rebound);
      await publish(rebound);
      await publish(mutation("set", second, role, null, 0));
      const lone = mutation("set", principal, word(3), null, 0);
      await publish(lone);
      await publish(withdraw(lone));
      const firstTomb = mutation("tomb", principal, word(4), null, 0);
      await publish(firstTomb);
      await publish(mutation("set", principal, word(4), firstTomb, 1));
      await check("all-transitions");
      const pageKey = keyFor(principal, word(5));
      keys.push(pageKey);
      let previous = null;
      for (let revision = 0; revision < 65; revision++) {
        const p = mutation("set", principal, word(5), previous, revision);
        await publish(p);
        previous = p;
      }
      const before = await check("65-real-revisions");
      const ca = JSON.parse(
          readFileSync(
            join(
              ROOT,
              "out",
              "BindingReads.t.sol",
              "StaticBindingConsumer.json",
            ),
          ),
        ),
        cr = await lab.receipt(await lab.send(ca.bytecode.object));
      assert.equal(cr.status, "0x1");
      const consumer = new Interface(ca.abi);
      for (const [name, args] of [
        ["getBindingHead", [key]],
        ["getBindingAtBasis", [key, 4]],
        ["readHistory", [key, 1, 64]],
        ["readHistory", [key, 1, 1]],
        ["readHistory", [pageKey, 1, 64]],
      ]) {
        const data = iface.encodeFunctionData(name, args),
          pin = { blockHash: before.basis.hash, requireCanonical: true },
          result = await raw(name, args, pin),
          gas = BigInt(await lab.rpc("eth_estimateGas", [{ to: host, data }]));
        assert(gas <= TX_GAS);
        assert.equal(
          bytes(result),
          name === "readHistory"
            ? 128 + 192 * iface.decodeFunctionResult(name, result)[0].length
            : 288,
        );
        const receipt = await lab.receipt(await lab.send(data, host));
        assert.equal(receipt.status, "0x1");
        const cn = name === "readHistory" ? "history" : "head",
          args2 =
            name === "readHistory"
              ? [host, ...args]
              : [host, key, name === "getBindingHead" ? 0 : 4],
          sd = consumer.encodeFunctionData(cn, args2);
        assert.equal(
          await lab.rpc("eth_call", [
            { to: cr.contractAddress, data: sd },
            "latest",
          ]),
          result,
        );
        assert.equal(
          (await lab.receipt(await lab.send(sd, cr.contractAddress))).status,
          "0x1",
        );
        report.measurements.push({
          name,
          args: args.map(String),
          estimatedGas: gas.toString(),
          transactionGas: BigInt(receipt.gasUsed).toString(),
          returndataBytes: bytes(result),
        });
      }
      const after = await readState(reader);
      assert.equal(after.outcome, "VERIFIED", after.reason);
      const retained = (state) =>
        JSON.parse(
          JSON.stringify(state.snapshot, (key, value) =>
            ["basis", "pin", "stats"].includes(key)
              ? undefined
              : typeof value === "bigint"
                ? String(value)
                : value,
          ),
        );
      assert.deepEqual(
        retained(after),
        retained(before),
        "ordinary/static reads preserve collected retained state",
      );
      await lab.rpc("anvil_setCode", [getters.preparationHelper, "0x"]);
      await call("getBindingAtBasis", [key, 4], "latest");
      await call("readHistory", [key, 1, 64], "latest");
      await lab.rpc("anvil_setCode", [
        getters.preparationHelper,
        components.helper.code,
      ]);
      // Separately synthetic code substitution on the normally deployed host, exact error bytes.
      for (const [role, prefix, name, args] of [
        [1, "pointRead", "getOccurrenceByOrdinal", [0]],
        [2, "queryRead", "readHistory", [key, 0, 0]],
      ]) {
        for (const replacement of ["0x", "0x60006000fd"]) {
          await lab.rpc("anvil_setCode", [
            getters[prefix + "Library"],
            replacement,
          ]);
          await assert.rejects(
            () => call(name, args, "latest"),
            (error) =>
              JSON.parse(error.message).data ===
              iface.encodeErrorResult("ReadCodeMismatch", [role]),
          );
        }
        await lab.rpc("anvil_setCode", [
          getters[prefix + "Library"],
          components[prefix].code,
        ]);
      }
      assert.equal(
        bytes(
          abi.encode(
            [
              "tuple(uint32,uint64,bytes32,uint16,uint8,uint64)[]",
              "uint32",
              "uint8",
            ],
            [Array.from({ length: 64 }, () => [1, 1, ZeroHash, 0, 1, 0]), 0, 1],
          ),
        ),
        12416,
        "independent max-page ABI formula",
      );
      report.boundary =
        "synthetic revision-one trusted-admission host; not authenticated C0, V3 bootstrap, authority or page/Scope completion";
    });
    assert(report.cleanup.stopped, "managed loopback cleanup");
    t.diagnostic(JSON.stringify(report));
  },
);
