import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { AbiCoder, ContractFactory, keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { parseGroup } from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
import { CACHE, verifyCache, verifySnapshot } from '../../2026-09-05-c0-admission/reader.mjs';
import { makePublication, recordId } from '../../2026-09-05-c0-admission/codec.mjs';
import { compile, withProbe, submit, collectSnapshot, TX_GAS, SOLC } from '../../2026-09-05-c0-admission/scripts/local-chain.mjs';
import { decodeBody, InvalidBody } from '../reference/record-body.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const abi = AbiCoder.defaultAbiCoder();
const bytes = hex => Buffer.from(hex.replace(/^0x/, ''), 'hex');
const hash = b => bytes(keccak256(b));
const word = n => BigInt.asUintN(256, BigInt(n)).toString(16).padStart(64, '0');
const u16 = n => n.toString(16).padStart(4, '0');
const A = '11'.repeat(32), B = '22'.repeat(32), C = '33'.repeat(32), Z = '00'.repeat(32);
const ref = (roleIndex, targetId, leafIndex = 0) => ({ roleIndex, targetId: '0x' + targetId, leafIndex });

// Independent ordinary Stage A Record preimage: three fixed 32-byte words.
function independentRecordId(typeId, body) {
  return keccak256(Buffer.concat([hash(Buffer.from('efs2/record/1')), bytes(typeId), hash(bytes(body))]));
}

// Hand-framed all-fourteen-kind schema, not produced by the descriptor encoder.
// Three direct roles bind g=REF, h=OCCREF and n=OPTION(REF).
function literalGroup() {
  const descriptors = [
    '00016101', '0001620202', '0001630301', '0001640403',
    '000165050004', '000166060008', '00016707', '00016808', '00016909', '00016a0a',
    '00016b0b000200000201', '00016c0c00020000060003000001',
    '00016d0d0002000178010001790e0000050002', '00016e0e000007',
  ];
  const roles = '0003' + '0000016701' + Z + '060000' + '0100016804' + Z + '070000' + '0200016e01' + Z + '0d0000';
  const constraints = '0003' + '0102' + word(-2) + word(2) + '0204' + '0305';
  const blob = '00010008416c6c4b696e6473000000' + Z + '000e' + descriptors.join('') + roles + '00000000' + constraints;
  return { blob: bytes(blob), group: bytes('0001' + u16(blob.length / 2) + blob) };
}

const fixtures = [
  { name: 'ObjectGenesis/1', fields: [Z, A, '01' + B], refs: [], bad: [[2, '02' + B, 6]] },
  { name: 'BindingSet/1', fields: [A, B, C, '01' + A, '00', '01' + B + 'fedc'], refs: [ref(0, A), ref(2, B, 65244)], bad: [[3, '02' + A, 6], [3, '01' + Z, 8]] },
  { name: 'DirectoryEntry/1', fields: [A, '0002c3a9', B, '01' + C], refs: [ref(0, A), ref(1, B), ref(2, C)], bad: [[1, '0003eda080', 4], [1, '0100', 3]] },
  { name: 'FileRevision/1', fields: [A, B, '000a746578742f706c61696e', '0100057574662d38', '01', '0002' + B + C], refs: [ref(0, A), ref(1, B), ref(2, B), ref(2, C)], bad: [[4, '02', 7], [5, '0009', 12], [5, '0001' + Z, 8]] },
  { name: 'ChunkTree/1', fields: ['00001000', '00000001', '0000000000000001', A], refs: [], bad: [[0, '00000fff', 14], [1, '01000001', 14]] },
];

test('independent bodies match Solidity over four real admitted groups and separate literal schemas', { timeout: 240000 }, async t => {
  compile();
  const build = spawnSync('forge', ['build', '--use', process.env.EFS_C0_SOLC ?? SOLC, '--offline'], { cwd: root, encoding: 'utf8' });
  assert.equal(build.status, 0, build.stdout + build.stderr);
  await withProbe(async lab => {
    for (let i = 0; i < 4; i++) await submit(lab, makePublication(lab.run, lab.deployment, i));
    const snapshot = await collectSnapshot(lab);
    assert.equal(verifySnapshot(snapshot, { ...lab.run, ...lab.deployment }).typeCount, 17);
    const members = new Map(), knownTypes = [snapshot.metaTypeId];
    for (const group of lab.run.candidates.groups) {
      const raw = bytes(group.recordBodyHex).subarray(2);
      const parsed = parseGroup(raw, { knownTypes, expectedIds: group.members.map(m => m.temporaryTypeSchemaId) });
      let cursor = 2;
      for (let i = 0; i < parsed.members.length; i++) {
        const length = raw.readUInt16BE(cursor); cursor += 2;
        const blob = raw.subarray(cursor, cursor + length); cursor += length;
        const id = parsed.ids[i], member = parsed.members[i];
        // Fresh fixed-basis getTypeCache rows, checked independently before use.
        const row = await lab.core.getTypeCache(id, { blockTag: snapshot.basis.number });
        verifyCache(row, member, id, parsed.ids, blob);
        members.set(member.name, { member, id, cache: abi.decode([CACHE], row.cacheBytes)[0].toArray(true) });
      }
      knownTypes.push(...parsed.ids);
    }
    assert.equal(members.size, 16);

    async function deploy(name) {
      const artifact = JSON.parse(readFileSync(new URL(`../out/BodyHarness.sol/${name}.json`, import.meta.url), 'utf8'));
      const runtimeBytes = (artifact.deployedBytecode.object.length - 2) / 2;
      assert(runtimeBytes <= 24576, `${name} EIP170 runtime ceiling`);
      const instance = await new ContractFactory(artifact.abi, artifact.bytecode.object, lab.payer).deploy({ gasLimit: TX_GAS });
      const receipt = await instance.deploymentTransaction().wait(1, 15000);
      assert.equal(receipt.status, 1);
      assert.equal((await lab.provider.getCode(await instance.getAddress())).length, runtimeBytes * 2 + 2);
      t.diagnostic(`${name}: runtime=${runtimeBytes} bytes; deploymentGas=${receipt.gasUsed}; component only, not full-Core fit`);
      return instance;
    }
    const harness = await deploy('BodyHarness');
    const gas = [], seenIds = new Set();
    async function compare(entry, fields, expectedRefs, errorCode) {
      const body = '0x' + fields.join('');
      const id = independentRecordId(entry.id, body);
      assert.equal(recordId(entry.id, body), id, 'ordinary Record preimage disagreement');
      assert(!seenIds.has(id), 'mutation must have a fresh body-bound identity'); seenIds.add(id);
      if (errorCode !== undefined) {
        assert.throws(() => decodeBody(entry.member, body), e => e instanceof InvalidBody && e.code === errorCode);
        await assert.rejects(harness.validate(entry.cache, body, { gasLimit: TX_GAS }), e => {
          const parsed = harness.interface.parseError(e.data);
          return parsed?.name === 'InvalidBody' && Number(parsed.args[0]) === errorCode;
        });
      } else {
        const expected = { fields: fields.map(x => '0x' + x), references: expectedRefs };
        assert.deepEqual(decodeBody(entry.member, body), expected);
        const result = await harness.validate(entry.cache, body, { gasLimit: TX_GAS });
        assert.deepEqual({ fields: [...result.fields], references: result.references.map(r => ({ roleIndex: Number(r.roleIndex), targetId: r.targetId, leafIndex: Number(r.leafIndex) })) }, expected);
        gas.push(Number(await harness.validate.estimateGas(entry.cache, body, { gasLimit: TX_GAS })));
      }
    }

    for (const fixture of fixtures) await t.test(fixture.name, async () => {
      const entry = members.get(fixture.name); assert(entry);
      await compare(entry, fixture.fields, fixture.refs);
      await compare(entry, [fixture.fields.join('') + '00'], [], 1);
      await compare(entry, [fixture.fields.join('').slice(0, -2)], [], 2);
      for (const [index, replacement, code] of fixture.bad) {
        const changed = [...fixture.fields]; changed[index] = replacement;
        await compare(entry, changed, [], code);
      }
    });

    await t.test('all-kind hand-framed literal (parsed, not admitted)', async () => {
      const literal = literalGroup(), parsed = parseGroup(literal.group);
      const parser = await deploy('LiteralSchemaHarness');
      const cache = await parser.parseLiteral('0x' + literal.group.toString('hex'), { gasLimit: TX_GAS });
      // No fake ordinal/admission wrapper for this deliberately non-admitted fixture.
      assert.equal(cache.typeId, parsed.ids[0]); assert.equal(cache.blobHash, keccak256(literal.blob));
      const entry = { member: parsed.members[0], id: parsed.ids[0], cache: cache.toArray(true) };
      const fields = ['01', 'abcd', 'fe', 'aabbcc', '0002ff00', '0002c3a9', A, B + 'fedc', Z, '00120020' + C, '00020102', '000200017a010002616100', '01010002abcd', '01' + C];
      const refs = [ref(0, A), ref(1, B, 65244), ref(2, C)];
      await compare(entry, fields, refs);
      const invalids = [[0, '02', 7], [2, 'fd', 14], [4, '0000', 14], [5, '0002c280', 14], [5, '0004f4908080', 4], [6, Z, 8], [9, 'ffff0000', 9], [10, '0003', 12], [11, '0002000261610000017a01', 5], [12, '0102', 6], [13, '02', 6]];
      for (const [index, replacement, code] of invalids) { const changed = [...fields]; changed[index] = replacement; await compare(entry, changed, [], code); }
      await compare(entry, [fields.join('') + '00'], [], 1);
      await compare(entry, [fields.join('').slice(0, -2)], [], 2);
    });
    t.diagnostic(`BodyHarness valid-call gas: min=${Math.min(...gas)}, max=${Math.max(...gas)}; ${seenIds.size} distinct valid/malformed Record preimages checked`);
  });
});
