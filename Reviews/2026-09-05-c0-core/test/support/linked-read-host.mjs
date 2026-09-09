import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  AbiCoder,
  Interface,
  keccak256,
} from "../../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js";
import {
  ROOT,
  TX_GAS,
  compileStateful,
  withStateful,
} from "../../scripts/local-stateful.mjs";

const abi = AbiCoder.defaultAbiCoder();
const bytes = (value) => (value.length - 2) / 2;
const artifact = (name) =>
  JSON.parse(
    readFileSync(join(ROOT, "out", name + ".sol", name + ".json"), "utf8"),
  );
const targets = ["AdmissionLibrary", "PointReadLibrary", "QueryReadLibrary"];
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
function provenance(a, hostName) {
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
      info.output?.contracts?.["test/" + hostName + ".sol"]
        ?.[hostName];
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

export async function withLinkedReadHost(hostName, action) {
  assert(["BindingReadHarness","AuditPageReadHarness"].includes(hostName),"closed read hosts");
  compileStateful();
  const a=artifact(hostName), names=provenance(a,hostName), iface=new Interface(a.abi);
  const report={compiler:a.metadata.compiler,settings:a.metadata.settings,sourcePins:a.metadata.sources,measurements:[]};
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
        // The unchanged retained-state reader uses only the original raw ports.
        // Keep its counts() lookup unambiguous alongside query counts(...).
        iface: new Interface(artifact("StatefulHarness").abi),
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

    await action({lab,reader,iface,host,call,raw,publish,getters,report,components,addresses,a,names,creation,runtime});
  });
  assert(report.cleanup.stopped,"managed loopback cleanup");
  return report;
}
export { artifact, bytes, patch, links };
