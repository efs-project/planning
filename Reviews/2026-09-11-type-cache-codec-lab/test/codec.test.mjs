import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { encodeGroup } from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
import { parseGroup } from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
import { verifyCache } from '../../2026-09-05-c0-admission/reader.mjs';
import { abi, CACHE, raw, hex, smallCache, boundaryCache, smallDescriptor, boundaryDescriptor, nestedDescriptor, syntheticCaches, referencePack, referenceUnpack, malformedPhysical } from './reference.mjs';

const bytes = x => raw(x).length;
const root = fileURLToPath(new URL('../', import.meta.url));
const candidates = JSON.parse(readFileSync(new URL('../../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json', import.meta.url)));
const groups = [
  ...candidates.groups.map(g => ({ name: 'retained-' + g.members[0].descriptor.name, raw: '0x' + g.groupHex })),
  { name: 'small', raw: hex(encodeGroup([smallDescriptor])) },
  { name: 'boundary', raw: hex(encodeGroup([boundaryDescriptor])) },
  { name: 'nested', raw: hex(encodeGroup([nestedDescriptor])) },
];
const knownTypes = candidates.groups.flatMap(g => g.members.map(m => m.temporaryTypeSchemaId));
const canonicalRows = [];
for (const group of groups) {
  const b = raw(group.raw), parsed = parseGroup(b, { knownTypes }); let pos = 2;
  const blobs = parsed.members.map(() => { const n = b.readUInt16BE(pos); pos += 2; const x = b.subarray(pos, pos + n); pos += n; return x; });
  canonicalRows.push({ ...group, parsed, blobs });
}

test('pure oracle retains exact ABI and descriptor bytes with literal sizes and framing', () => {
  assert.equal(bytes(smallCache), 704); assert.equal(bytes(referencePack(smallCache)), 121);
  assert.equal(bytes(boundaryCache), 24960); assert.equal(bytes(referencePack(boundaryCache)), 5536);
  const compact = raw(referencePack(smallCache));
  assert.equal(compact.subarray(0, 14).toString('hex'), '4543303101000000000000010019');
  assert.equal(compact.subarray(96).toString('hex'), '0100000000000001000000000000000000070004666c616701');
  assert.equal(bytes(referencePack(syntheticCaches()[1].cache)), 12110, 'loose representation envelope, not a parser-valid Type');
  for (const c of [smallCache, boundaryCache, ...syntheticCaches().map(c => c.cache)]) assert.equal(referenceUnpack(referencePack(c)), c);
  for (const v of malformedPhysical(referencePack(smallCache))) assert.throws(() => referenceUnpack(v.bytes), undefined, v.label);
  assert.throws(() => referencePack(smallCache + '00'));
});

test('Solidity codec matches independent bytes across real helper corpus and rejects malformed representations', { skip: process.env.EFS_CACHE_CODEC_CHAIN !== '1', timeout: 300000 }, async t => {
  const { compile, withCodecLab } = await import('../scripts/lab.mjs');
  const report = { scope: 'STANDALONE_CODEC_ONLY_NOT_CORE_ADMISSION', status: 'RUNNING', deployments: {}, sources: {}, cases: [], malformed: [], gasReceipts: [], cleanup: null };
  report.inputPins = Object.fromEntries([
    'test/codec.test.mjs', 'test/reference.mjs', 'scripts/lab.mjs', 'foundry.toml',
    '../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json',
    '../2026-09-05-mvp-build-start/type-inputs/encoder.mjs',
    '../2026-09-05-mvp-build-start/type-inputs/parser.mjs',
    '../2026-09-05-c0-admission/reader.mjs',
  ].map(path => [path, keccak256(readFileSync(resolve(root, path)))]));
  try {
    const artifacts = compile();
    await withCodecLab(artifacts, async ({ codec, helper }) => {
      const real = [];
      for (const row of canonicalRows) {
        const out = (await helper.call('compileGroup', [row.raw]))[0];
        assert.equal(out.groupHash, row.parsed.groupHash);
        assert.equal(out.rawHash, keccak256(row.raw));
        assert.equal(out.types.length, row.parsed.members.length);
        for (let i = 0; i < out.types.length; i++) {
          const cache = out.types[i].cacheBytes, id = row.parsed.ids[i];
          assert.equal(out.types[i].typeId, id);
          verifyCache({ ordinal: 1, cacheBytes: cache }, row.parsed.members[i], id, row.parsed.ids, row.blobs[i]);
          real.push({ name: row.parsed.members[i].name, cache, classification: 'ACTUAL_HELPER_PARSER_VALID', groupHash: row.parsed.groupHash, typeId: id });
        }
      }
      assert.equal(real.find(c => c.name === 'CacheBoundary/1').cache, boundaryCache);
      assert.equal(real.find(c => c.name === 'CodecSmall/1').cache, smallCache);
      const samples = [...real, ...syntheticCaches()];
      for (const c of samples) {
        const expected = referencePack(c.cache), compact = (await codec.call('pack', [c.cache]))[0];
        assert.equal(compact, expected, c.name + ' independent packed bytes');
        assert.equal((await codec.call('unpack', [compact]))[0], c.cache, c.name + ' exact logical ABI round-trip');
        assert.equal(referenceUnpack(compact), c.cache);
        const s = abi.decode([CACHE], c.cache)[0], h = (await codec.call('readHeader', [compact]))[0];
        assert.deepEqual([...h], [s.typeId, s.blobHash, s.maxBodyBytes, BigInt(s.fields.length), BigInt(s.roles.length), BigInt(s.indexes.length), BigInt(s.constraints.length), BigInt(raw(compact).readUInt16BE(12))]);
        report.cases.push({ name: c.name, classification: c.classification, typeId: s.typeId, logicalHash: keccak256(c.cache), packedHash: keccak256(compact), logicalBytes: bytes(c.cache), packedBytes: bytes(compact) });
      }
      for (const bad of malformedPhysical(referencePack(smallCache))) {
        for (const method of ['unpack', 'readHeader']) await assert.rejects(codec.call(method, [bad.bytes]), e => typeof e.data === 'string', method + ': ' + bad.label);
        report.malformed.push(bad.label);
      }
      const empty = abi.decode([CACHE], smallCache)[0].toArray(true); empty[3] = [];
      const tooMany = abi.decode([CACHE], boundaryCache)[0].toArray(true); tooMany[3].push(tooMany[3][0]);
      const tooLong = abi.decode([CACHE], smallCache)[0].toArray(true); tooLong[3][0][6] = '0x' + '00'.repeat(8191);
      for (const [name, value] of [['trailing logical bytes', smallCache + '00'], ['zero fields', abi.encode([CACHE], [empty])], ['65 fields', abi.encode([CACHE], [tooMany])], ['descriptor envelope overflow', abi.encode([CACHE], [tooLong])], ['truncated logical ABI', smallCache.slice(0, -2)]]) {
        await assert.rejects(codec.call('pack', [value]), e => typeof e.data === 'string', name);
        report.malformed.push(name);
      }
      // Pure methods executed as real transactions: receipts include intrinsic
      // and calldata gas, not just codec-internal execution. No elapsed-time claim.
      for (const [name, cache] of [['small', smallCache], ['boundary', boundaryCache]]) {
        const packed = referencePack(cache);
        for (const [method, input] of [['pack', cache], ['unpack', packed], ['readHeader', packed]]) report.gasReceipts.push({ sample: name, method, ...await codec.measure(method, [input]) });
      }
      report.status = 'PASS_CODEC_ONLY';
    }, report);
  } catch (error) {
    report.status = 'FAIL'; report.failure = { message: error.message, data: error.data ?? null }; throw error;
  } finally {
    if (process.env.EFS_CACHE_CODEC_REPORT) {
      const target = resolve(root, 'evidence', process.env.EFS_CACHE_CODEC_REPORT);
      assert(target.startsWith(resolve(root, 'evidence') + '/'), 'report must stay in new lab evidence');
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    }
    t.diagnostic(JSON.stringify({ scope: report.scope, status: report.status, cases: report.cases.length, malformed: report.malformed.length, deployments: report.deployments, gasReceipts: report.gasReceipts, cleanup: report.cleanup, failure: report.failure }));
  }
});
