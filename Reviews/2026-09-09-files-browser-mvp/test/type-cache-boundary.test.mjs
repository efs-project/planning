// Disposable candidate falsifier, not an adopted schema/cache limit.
// Default: pure fixture checks only. Run the actual fresh-world RED target with:
// EFS_TYPE_CACHE_CHAIN=1 EFS_TEST_BUILD_ROOT=<isolated candidate build> \
//   node --test test/type-cache-boundary.test.mjs
// Emits one bounded TYPE_CACHE_DECLARATIONS JSON diagnostic, no traces/files.
// The chain target intentionally remains RED while a parser-valid Type cannot
// be admitted solely because its compiled cache exceeds one code contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import { AbiCoder, Interface, ZeroHash, getCreateAddress, keccak256, toBeHex, toUtf8Bytes } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { encodeBlob, encodeGroup, derive } from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';

const abi = AbiCoder.defaultAbiCoder();
const FIELD = 'tuple(uint8 kind,uint8 innerKind,uint16 widthOrMax,uint32 maxBodyBytes,uint32 references,uint32 skipReads,bytes descriptor)';
const SCHEMA = `tuple(bytes32 typeId,bytes32 blobHash,uint32 maxBodyBytes,${FIELD}[] fields,tuple(uint8 targetClass,bytes32 expectedType,uint8 fieldIdx)[] roles,tuple(uint8 kind,uint8 target)[] indexes,tuple(uint8 kind,uint8 fieldIdx,int256 min,int256 max)[] constraints)`;
const helperInterface = new Interface([
  'function compileGroup(bytes) view returns (tuple(bytes32 groupHash,bytes32 rawHash,tuple(bytes32 typeId,bytes cacheBytes)[] types,bytes32[] dependencies))',
  'error HelperDeploy()',
  'error InvalidSchema()',
]);
const bytes = hex => (hex.length - 2) / 2;
const json = value => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v);
const descriptor = (name, fields) => ({ name, meaning: '', specDigest: null, qualifier: '00'.repeat(32), fields, roles: [], indexes: [], constraints: [] });
const small = name => descriptor(name, [{ name: 'flag', kind: 'BOOL' }]);
const boundary = descriptor('CacheBoundary/1', Array.from({ length: 64 }, (_, i) => ({ name: `flag${String(i).padStart(2, '0')}${'a'.repeat(58)}`, kind: 'BOOL' })));

// Independent reference for this BOOL-only fixture, not another generic parser.
// Each field is seven ABI head words + bytes length + descriptor padding, plus
// one array offset. The schema's outer tuple and four array lengths use 384 B.
function expectedBooleanCache(schema, typeId) {
  const fields = schema.fields.map(field => {
    const name = Buffer.from(field.name, 'ascii');
    const raw = Buffer.concat([Buffer.from([0, name.length]), name, Buffer.from([1])]);
    return [1, 0, 0, 1, 0, 0, '0x' + raw.toString('hex')];
  });
  return abi.encode([SCHEMA], [[typeId, keccak256(encodeBlob(schema)), schema.fields.length, fields, [], [], []]]);
}

test('pure: compact legal BOOL data expands past one code cache without changing its canonical Type identity', () => {
  const raw = encodeGroup([boundary]);
  assert.equal(raw.length, 4356, 'hand-counted canonical group length');
  assert.equal(boundary.fields.length, 64);
  assert(boundary.fields.every(field => Buffer.byteLength(field.name, 'ascii') === 64));
  assert.equal(new Set(boundary.fields.map(field => field.name)).size, 64);
  const ids = derive(raw);
  const independentGroupHash = keccak256(abi.encode(['bytes32', 'bytes32'], [keccak256(toUtf8Bytes('efs2/typeschema-group/1')), keccak256(raw)]));
  const independentTypeId = keccak256(abi.encode(['bytes32', 'bytes32', 'uint256'], [keccak256(toUtf8Bytes('efs2/typeschema/1')), independentGroupHash, 0]));
  assert.equal(ids.groupHash, independentGroupHash);
  assert.equal(ids.ids[0], independentTypeId);
  assert.equal(bytes(expectedBooleanCache(boundary, independentTypeId)), 24960, '384 + 64 * (32 + 224 + 32 + 96)');
  assert.equal(bytes(expectedBooleanCache(small('Small/1'), ZeroHash)), 704);
});

test('chain RED target: parser-valid 64-field Type remains admissible despite compiled representation size', { skip: process.env.EFS_TYPE_CACHE_CHAIN !== '1', timeout: 240000 }, async t => {
  // Lazy imports and compilation guarantee the default pure check cannot launch
  // a node or create a compiler cache. Root grants the explicit chain-run slot.
  const { compileUpgrade, withUpgrade } = await import('../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs');
  const { publication, groupLeaf, TX_GAS } = await import('../../2026-09-05-c0-core/scripts/local-stateful.mjs');
  compileUpgrade();
  const report = { scope: 'DISPOSABLE_FRESH_CANDIDATE', target: 'PARSER_VALID_TYPE_ADMISSION', receipts: [], cases: [], cleanup: null };
  let targetRefusals = 0;
  try {
    await withUpgrade(async lab => {
      report.core = lab.core;
      report.helper = lab.expected.execution.helper;
      report.compiler = lab.resources.compiler;
      report.sourceCommit = lab.resources.sourceCommit;
      report.trackedDiffHash = lab.resources.trackedDiffHash;
      report.sourcePins = lab.resources.sourcePins;
      report.helperCodehash = lab.expected.execution.helperCodehash;
      report.admissionCodehash = lab.expected.execution.admissionCodehash;
      report.transactionGasCeiling = String(TX_GAS);
      report.cleanup = lab.cleanup;
      const call = async (iface, address, name, args = [], block = 'latest') => iface.decodeFunctionResult(name, await lab.rpc('eth_call', [{ to: address, data: iface.encodeFunctionData(name, args), gas: toBeHex(TX_GAS) }, block]));
      const coreCall = async (name, args = []) => (await call(lab.iface, lab.core, name, args))[0];
      report.executionSetId = (await coreCall('revisionAt', [await coreCall('currentRevision')])).id;
      const counts = async () => [...await coreCall('counts()')].map(String);
      const rawTypeRow = async id => lab.rpc('eth_call', [{ to: lab.core, data: lab.iface.encodeFunctionData('typeRow', [id]) }, 'latest']);
      const compile = async members => {
        const raw = encodeGroup(members), expectedIds = derive(raw);
        const out = (await call(helperInterface, report.helper, 'compileGroup', ['0x' + raw.toString('hex')]))[0];
        assert.equal(out.groupHash, expectedIds.groupHash);
        assert.equal(out.rawHash, keccak256(raw));
        assert.deepEqual([...out.dependencies], []);
        assert.equal(out.types.length, members.length);
        for (let i = 0; i < members.length; i++) {
          assert.equal(out.types[i].typeId, expectedIds.ids[i]);
          assert.equal(out.types[i].cacheBytes, expectedBooleanCache(members[i], expectedIds.ids[i]), 'actual helper preserves canonical cache bytes');
        }
        return { members, raw, ids: expectedIds.ids, out };
      };
      const snapshot = async (c, prepared) => ({
        counts: await counts(),
        rows: await Promise.all(c.ids.map(rawTypeRow)),
        record: await coreCall('record', [prepared.publication.recordIds[0]]).then(row => json([...row])),
        envelope: await coreCall('envelope', [prepared.publication.envelopeId]).then(row => json([...row])),
        nonceUsed: await coreCall('nonceUsed', [prepared.nonce]),
        helperNonce: await lab.rpc('eth_getTransactionCount', [report.helper, 'latest']),
      });
      let nonce = 97000;
      const declare = async (label, c, { shouldFit = false } = {}) => {
        const p = publication([groupLeaf(lab.inputs.meta, '0x' + c.raw.toString('hex'))], nonce++);
        const prepared = await lab.prepare(p);
        const before = await snapshot(c, prepared);
        const firstPointer = getCreateAddress({ from: report.helper, nonce: BigInt(before.helperNonce) });
        const firstPointerBefore = await lab.rpc('eth_getCode', [firstPointer, 'latest']);
        let preflightError = null;
        try { await lab.rpc('eth_call', [{ to: lab.core, data: lab.data(prepared), gas: toBeHex(TX_GAS) }, 'latest']); }
        catch (error) {
          assert.equal(typeof error.data, 'string', 'exact preflight rejection data required');
          preflightError = { data: error.data, name: helperInterface.parseError(error.data)?.name ?? null };
        }
        const submitted = await lab.submit(prepared);
        const { receipt, tx } = submitted;
        report.receipts.push({ label, hash: tx.hash, status: receipt.status, gasUsed: BigInt(receipt.gasUsed).toString(), effectiveGasPrice: BigInt(receipt.effectiveGasPrice).toString(), blockHash: receipt.blockHash, blockNumber: BigInt(receipt.blockNumber).toString(), calldataBytes: bytes(tx.data), calldataHash: keccak256(tx.data) });
        const after = await snapshot(c, prepared);
        const item = { label, groupBytes: c.raw.length, canonicalGroup: '0x' + c.raw.toString('hex'), groupHash: c.out.groupHash, typeIds: c.ids, cacheBytes: c.out.types.map(type => bytes(type.cacheBytes)), preflightError, before, after, status: receipt.status };
        report.cases.push(item);
        if (shouldFit) assert.equal(receipt.status, '0x1', `${label} declaration must succeed`);
        if (receipt.status === '0x0') {
          assert.equal(preflightError?.name, 'HelperDeploy', 'representation refusal must not be reported as invalid schema or out of gas');
          assert.equal(preflightError.data, helperInterface.encodeErrorResult('HelperDeploy', []));
          assert.deepEqual(after, before, 'late cache deployment failure must roll back counts, Type rows, record, envelope, authorization nonce, and helper CREATE nonce');
          assert.equal(await lab.rpc('eth_getCode', [firstPointer, 'latest']), firstPointerBefore, 'failed publication leaves no created cache');
          item.rollback = 'VERIFIED';
          targetRefusals++;
        } else {
          assert.equal(preflightError, null);
          assert.equal(BigInt(after.counts[2]) - BigInt(before.counts[2]), BigInt(c.members.length));
          assert.equal(after.nonceUsed, true);
          for (let i = 0; i < c.ids.length; i++) {
            const row = await coreCall('typeRow', [c.ids[i]]);
            assert.equal(row.groupRecordId, p.recordIds[0]);
            assert.equal(row.memberIndex, BigInt(i));
            assert.equal(row.cacheBytes, c.out.types[i].cacheBytes);
          }
          item.admissionReadback = 'VERIFIED';
        }
      };

      await declare('small-single', await compile([small('CacheSmallSingle/1')]), { shouldFit: true });
      await declare('small-two-member-group', await compile([small('CacheSmallPairA/1'), small('CacheSmallPairB/1')]), { shouldFit: true });

      // A neighboring schema-invalid fixture must fail during parsing, unlike
      // the actual 64-field fixture, whose full compiled cache was obtained above.
      const invalid = descriptor('Invalid65/1', Array.from({ length: 65 }, (_, i) => ({ name: `f${i}`, kind: 'BOOL' })));
      let parserError;
      try { await call(helperInterface, report.helper, 'compileGroup', ['0x' + encodeGroup([invalid]).toString('hex')]); }
      catch (error) { parserError = error; }
      assert.equal(typeof parserError?.data, 'string', 'invalid neighboring schema must return exact parser error');
      assert.equal(helperInterface.parseError(parserError?.data)?.name, 'InvalidSchema');
      report.invalidNeighbor = { fieldCount: 65, rejection: 'InvalidSchema', stage: 'COMPILE' };

      await declare('boundary-single', await compile([boundary]));
      // First Type would CREATE successfully; second exceeds one code blob.
      // This distinguishes early-only refusal from mutation-phase rollback.
      await declare('small-then-boundary-group', await compile([small('CacheLateSmall/1'), boundary]));
      report.target = targetRefusals === 0 ? 'SUPPORTED' : 'REPRESENTATION_CEILING_BLOCKS_VALID_TYPE';
    }, { profile: 'base', watchdogMs: 180000 });
  } finally {
    t.diagnostic('TYPE_CACHE_DECLARATIONS ' + json(report));
  }
  assert.equal(targetRefusals, 0, 'Parser-valid Type(s) were refused only by the code-cache representation ceiling; preserve the schema language using a bounded representation, not a lower implicit Type limit.');
});
