// Independent read-back of the type cache and a canonical world dump.
//
//   EFS_TEST_BUILD_ROOT=<isolated> node scripts/measure/typecache-readback.mjs --out <file.json>
//
// Builds the standard environment (the node suites' path), then:
//   1. For every admitted type: the Core's `typeRow` view, the raw cell slots
//      (eth_getStorageAt), `eth_getCode` of the pointer (candidate only) and the
//      pinned helper's own recompilation of the group (`compileGroup` /
//      `compileIntrinsic` eth_call) must all agree byte-for-byte on the cache.
//   2. `getTypeSchema` (the checked reader that walks the cache) for every type.
//   3. A canonical dump — counts, records, envelopes, bindings, type rows by
//      content — that must be identical between the control and the candidate
//      (pointer addresses are reported separately and excluded from the diff key).
//   4. eth_estimateGas of the read views that touch a type row, per type.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Interface, AbiCoder, keccak256, toBeHex } from '../../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const { compileUpgrade, withUpgrade } = await import('../../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs');
const { startEnvironment, compileRouter } = await import('../environment.mjs');
const { encodeGroup } = await import('../../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs');
const { NEW_GROUP_DESCRIPTORS } = await import('../../test/router-fixture.mjs');
const { EFS_SLOT, STORE, mapSlot } = await import('./lib/slots.mjs');

const abi = AbiCoder.defaultAbiCoder();
const MVP = fileURLToPath(new URL('../../', import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const OUT = resolve(MVP, opt('--out', 'evidence/type-cache-2026-09-11/readback.json'));
const helperIface = new Interface([
  'function compileGroup(bytes raw) view returns (tuple(bytes32 groupHash, bytes32 rawHash, tuple(bytes32 typeId, bytes cacheBytes)[] types, bytes32[] dependencies))',
  'function compileIntrinsic(bytes raw) view returns (tuple(bytes32 typeId, bytes cacheBytes))',
]);
const typeRowIface = new Interface(['function typeRow(bytes32) view returns (tuple(bytes32 groupRecordId, uint16 memberIndex, uint64 typeOrdinal, uint64 admittedAtOrdinal, bytes cacheBytes))']);

compileUpgrade(); compileRouter();
await withUpgrade(async lab => {
  const { auth } = await startEnvironment(lab, { write: true, relay: false });
  const core = lab.core; const helper = lab.expected.execution.helper;
  const block = await lab.rpc('eth_blockNumber', []);
  const call = async (iface, to, name, params) => iface.decodeFunctionResult(name, await lab.rpc('eth_call', [{ to, data: iface.encodeFunctionData(name, params) }, block]));
  const estimate = async (iface, to, name, params) => Number(await lab.rpc('eth_estimateGas', [{ to, data: iface.encodeFunctionData(name, params) }]));
  const storage = async (slot) => lab.rpc('eth_getStorageAt', [core, toBeHex(slot, 32), block]);
  // 'counts' is overloaded on the read core; name the nullary signature explicitly.
  const counts = (await call(lab.iface, core, 'counts()', []))[0];
  const n = { records: Number(counts.records ?? counts[0]), envelopes: Number(counts.envelopes ?? counts[1]), types: Number(counts.types ?? counts[2]), bindingKeys: Number(counts.bindingKeys ?? counts[7]) };

  // Expected caches from the pinned helper's own recompilation.
  const expected = new Map();
  const intrinsic = (await call(helperIface, helper, 'compileIntrinsic', [lab.inputs.init.intrinsicGroupBytes]))[0];
  expected.set(intrinsic.typeId.toLowerCase(), { cache: intrinsic.cacheBytes, source: 'compileIntrinsic' });
  const groups = [...lab.inputs.candidates.groups.map((g, i) => ({ raw: '0x' + g.groupHex, source: 'foundation group ' + i })), { raw: '0x' + encodeGroup(NEW_GROUP_DESCRIPTORS).toString('hex'), source: 'router group' }];
  for (const g of groups) {
    const compiled = (await call(helperIface, helper, 'compileGroup', [g.raw]))[0];
    for (const t of compiled.types) expected.set(t.typeId.toLowerCase(), { cache: t.cacheBytes, source: g.source });
  }

  const types = []; const pointers = []; const gas = [];
  for (let i = 1; i <= n.types; i++) {
    const typeId = (await call(lab.iface, core, 'typeIdAt', [i]))[0].toLowerCase();
    const row = (await call(typeRowIface, core, 'typeRow', [typeId]))[0];
    const p = mapSlot(EFS_SLOT + STORE.types, typeId);
    const slots = [await storage(p), await storage(p + 1n), await storage(p + 2n)];
    const cell2 = BigInt(slots[2]);
    // Control: slot p+2 is the Solidity bytes head — 2n+1 for a long bytes value
    // (at most 2*131072+1) or the short-bytes inline word (low byte = 2n, high
    // bytes = data; every real cache is long). Candidate: the 20-byte pointer.
    // A pointer is a 160-bit value; a long-bytes head is tiny.
    const looksLikePointer = cell2 > (1n << 64n) && cell2 < (1n << 160n);
    let code = null;
    if (looksLikePointer) {
      const addr = '0x' + cell2.toString(16).padStart(40, '0');
      code = await lab.rpc('eth_getCode', [addr, block]);
      pointers.push({ typeId, cacheCode: addr, codeBytes: (code.length - 2) / 2, prefix: code.slice(2, 4), codeMatchesView: code.toLowerCase() === ('0x00' + row.cacheBytes.slice(2)).toLowerCase() });
    }
    const exp = expected.get(typeId);
    const schema = await call(lab.readIface, core, 'getTypeSchema', [typeId]);
    types.push({
      ordinal: i, typeId, groupRecordId: row.groupRecordId, memberIndex: Number(row.memberIndex), typeOrdinal: Number(row.typeOrdinal), admittedAtOrdinal: Number(row.admittedAtOrdinal),
      cacheLength: (row.cacheBytes.length - 2) / 2, cacheHash: keccak256(row.cacheBytes),
      matchesHelperRecompile: exp ? exp.cache.toLowerCase() === row.cacheBytes.toLowerCase() : null, expectedFrom: exp?.source ?? null,
      slot0: slots[0], slot1: slots[1], slot2Kind: looksLikePointer ? 'pointer' : 'bytes-head',
      schema: { canonicalBodyHash: keccak256(schema[0]), typeOrd: Number(schema[1]), admitOrdinal: Number(schema[2]), refRoleCount: Number(schema[3]), indexSpecCount: Number(schema[4]) },
    });
    gas.push({ typeId, getTypeSchema: await estimate(lab.readIface, core, 'getTypeSchema', [typeId]), typeRow: await estimate(typeRowIface, core, 'typeRow', [typeId]) });
  }
  const records = [];
  for (let i = 1; i <= n.records; i++) {
    const id = (await call(lab.iface, core, 'recordIdAt', [i]))[0];
    const r = await call(lab.readIface, core, 'getRecord', [id]);
    records.push({ ordinal: i, recordId: id, typeId: r[0], bodyHash: keccak256(r[1]), firstAdmit: Number(r[2]) });
  }
  const envelopes = [];
  for (let i = 1; i <= n.envelopes; i++) envelopes.push((await call(lab.iface, core, 'envelopeIdAt', [i]))[0]);
  const bindings = [];
  for (let i = 1; i <= n.bindingKeys; i++) {
    const key = (await call(lab.iface, core, 'bindingKeyAt', [i]))[0];
    // getBindingHead returns (head, readBasis); the basis commits to the execution
    // set (admission library and helper codehashes) and therefore differs between
    // arms by construction — it is reported, not part of the canonical key.
    const [head, readBasis] = await call(lab.readIface, core, 'getBindingHead', [key]);
    bindings.push({ ordinal: i, key, head: JSON.stringify(head, (_, v) => typeof v === 'bigint' ? v.toString() : v), readBasis });
  }
  const recordGas = records.length ? await estimate(lab.readIface, core, 'getRecord', [records[records.length - 1].recordId]) : null;
  const canonical = { counts: n, types: types.map(({ slot0, slot1, slot2Kind, ...rest }) => rest), records, envelopes, bindings: bindings.map(({ readBasis, ...rest }) => rest) };
  const canonicalHash = keccak256(Buffer.from(JSON.stringify(canonical)));
  const out = { generatedAt: new Date().toISOString(), core, helper, block, kernelPatch: process.env.KERNEL_PATCH_SHA256 ?? null, canonicalHash, readBases: [...new Set(bindings.map(b => b.readBasis))], canonical, raw: types.map(({ typeId, slot0, slot1, slot2Kind }) => ({ typeId, slot0, slot1, slot2Kind })), pointers, gas: { perType: gas, getRecordLast: recordGas } };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  const bad = types.filter(t => t.matchesHelperRecompile === false || (t.expectedFrom === null));
  const badPtr = pointers.filter(p => !p.codeMatchesView || p.prefix !== '00');
  console.log(`types=${n.types} helper-recompile mismatches=${bad.length} pointers=${pointers.length} pointer mismatches=${badPtr.length} canonicalHash=${canonicalHash}`);
  console.log('read gas (first type / last record):', gas[0], recordGas);
  if (bad.length || badPtr.length) { console.error(JSON.stringify({ bad, badPtr }, null, 1)); process.exitCode = 1; }
}, { profile: 'reads', watchdogMs: 1800000 });
