// Deploys FilesRouterV1 against the live foundation lab, publishes the new
// application Type group, claims principals for disposable author wallets and
// provides the routed execute path shared by tests, server and walkthrough.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { Wallet, AbiCoder, Interface, keccak256, toBeHex } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { encodeGroup, derive } from '../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';
import { publication, groupLeaf, word, SOLC, TX_GAS } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { FIXTURE } from '../../2026-09-09-files-reader/index.mjs';
import { EXTENDED_TYPES, planOperation, authorizeAuthor, routerInterface, decodeRouterError, publicationHash } from '../sdk/files-actions.mjs';

const abi = AbiCoder.defaultAbiCoder();
const ROOT = fileURLToPath(new URL('../contracts', import.meta.url));
const BUILD_ROOT = process.env.EFS_TEST_BUILD_ROOT ? resolve(process.env.EFS_TEST_BUILD_ROOT, 'router') : ROOT;
const OUT = join(BUILD_ROOT, 'out');
export const routerArtifact = name => JSON.parse(readFileSync(join(OUT, name + '.json'), 'utf8'));

const DE = EXTENDED_TYPES['DirectoryEntry/1'].slice(2);
const OG = EXTENDED_TYPES['ObjectGenesis/1'].slice(2);
export const NEW_GROUP_DESCRIPTORS = [
  { name: 'RemovalMarker/1', meaning: 'Disposable Files removed-item marker; names the masked placement entry.', specDigest: null, qualifier: '00'.repeat(32), fields: [{ name: 'entry', kind: 'REF' }], roles: [{ name: 'entry', fieldIdx: 0, targetClass: 1, expectedType: DE }], indexes: [], constraints: [] },
  { name: 'FileTagAssertion/1', meaning: 'Disposable authored Files tag assertion; author-neutral tagId+target.', specDigest: null, qualifier: '00'.repeat(32), fields: [{ name: 'tagId', kind: 'BYTES_FIXED', width: 32 }, { name: 'target', kind: 'REF' }], roles: [{ name: 'target', fieldIdx: 1, targetClass: 5, expectedType: OG }], indexes: [{ kind: 1, target: 0 }, { kind: 2, target: 0 }], constraints: [] },
];

export function compileRouter() {
  const isolated = process.env.EFS_TEST_BUILD_ROOT ? ['--out', OUT, '--cache-path', join(BUILD_ROOT, 'cache'), '--build-info', '--build-info-path', join(OUT, 'build-info')] : [];
  const r = spawnSync('forge', ['build', '--offline', '--use', SOLC, ...isolated], { cwd: ROOT, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024, timeout: 240000 });
  assert.equal(r.status, 0, r.stdout + r.stderr);
}

export const CORE_ERRORS = new Interface(['error ErrCasRevision(bytes32 bindingKey,uint32 expected,uint32 have)']);

export async function routerFixture(lab, { nonceBase = 41000 } = {}) {
  // 1. Publish the RemovalMarker/FileTagAssertion group and confirm the
  //    precomputed ids in EXTENDED_TYPES are the derived ids.
  const raw = encodeGroup(NEW_GROUP_DESCRIPTORS);
  const derived = derive(raw);
  assert.equal(derived.ids[0], EXTENDED_TYPES['RemovalMarker/1'], 'RemovalMarker id drift');
  assert.equal(derived.ids[1], EXTENDED_TYPES['FileTagAssertion/1'], 'FileTagAssertion id drift');
  assert.equal((await lab.publish(publication([groupLeaf(lab.inputs.meta, '0x' + raw.toString('hex'))], nonceBase))).receipt.status, '0x1');

  // 2. Deploy the router.
  const artifact = routerArtifact('FilesRouterV1.sol/FilesRouterV1');
  const typeIds = {
    objectGenesis: EXTENDED_TYPES['ObjectGenesis/1'], bindingSet: EXTENDED_TYPES['BindingSet/1'],
    bindingTombstone: EXTENDED_TYPES['BindingTombstone/1'], directoryEntry: EXTENDED_TYPES['DirectoryEntry/1'],
    directoryWhiteout: EXTENDED_TYPES['DirectoryWhiteout/1'], fileRevision: EXTENDED_TYPES['FileRevision/1'],
    chunkTree: EXTENDED_TYPES['ChunkTree/1'], removalMarker: EXTENDED_TYPES['RemovalMarker/1'],
    tagAssertion: EXTENDED_TYPES['FileTagAssertion/1'],
  };
  const purposes = {
    namePurpose: FIXTURE.namePurpose, headPurpose: FIXTURE.headPurpose, headRole: FIXTURE.headRole,
    charterPurpose: FIXTURE.charterPurpose, removedPurpose: FIXTURE.removedPurpose, tagPurpose: FIXTURE.tagPurpose,
    fileMeaning: FIXTURE.fileMeaning, directoryMeaning: FIXTURE.directoryMeaning,
  };
  const TYPES_TUPLE = 'tuple(bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32)';
  const PURPOSES_TUPLE = 'tuple(bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32)';
  const ctor = abi.encode(['address', TYPES_TUPLE, PURPOSES_TUPLE], [lab.core,
    [typeIds.objectGenesis, typeIds.bindingSet, typeIds.bindingTombstone, typeIds.directoryEntry, typeIds.directoryWhiteout, typeIds.fileRevision, typeIds.chunkTree, typeIds.removalMarker, typeIds.tagAssertion],
    [purposes.namePurpose, purposes.headPurpose, purposes.headRole, purposes.charterPurpose, purposes.removedPurpose, purposes.tagPurpose, purposes.fileMeaning, purposes.directoryMeaning]]);
  const creation = artifact.bytecode.object + ctor.slice(2);
  const tx = await lab.send(creation);
  const receipt = await lab.receipt(tx, 'router deployment');
  assert.equal(receipt.status, '0x1', 'router deployment');
  const router = receipt.contractAddress;
  const runtime = await lab.rpc('eth_getCode', [router, receipt.blockNumber]);
  assert((runtime.length - 2) / 2 <= 24576, 'router EIP-170');

  // 3. Disposable author wallets claim their principals (guest never signs).
  const A = word(0xffffffffffffn), B = word(0xbbbbbbbbbbbbbbbbn);
  const authors = { [A]: new Wallet(word(0xa11cen)), [B]: new Wallet(word(0xb0bn)) };
  for (const [principal, wallet] of Object.entries(authors)) {
    await lab.rpc('anvil_setBalance', [wallet.address, '0x3635c9adc5dea00000']);
    const n = BigInt(await lab.rpc('eth_getTransactionCount', [wallet.address, 'pending']));
    const raw2 = await wallet.signTransaction({ chainId: 31337, nonce: Number(n), gasLimit: 300000n, gasPrice: 2000000000n, to: router, data: routerInterface.encodeFunctionData('claimPrincipal', [principal]) });
    const hash2 = await lab.rpc('eth_sendRawTransaction', [raw2]);
    let r; for (let i = 0; i < 200 && !r; i++) { r = await lab.rpc('eth_getTransactionReceipt', [hash2]); if (!r) await new Promise(ok => setTimeout(ok, 25)); }
    assert.equal(r.status, '0x1', 'claimPrincipal');
  }

  let pubNonce = nonceBase + 1;
  async function call(data) { return lab.rpc('eth_call', [{ to: router, data, gas: toBeHex(TX_GAS) }, 'latest']); }
  async function authorNonceOf(principal) {
    return BigInt(await call(routerInterface.encodeFunctionData('authorNonce', [principal])));
  }

  /** Routed execution. On expectError: preflight must revert with that named
   *  error and the transaction is NOT mined (the contract path proved the
   *  refusal); otherwise the mined admission must succeed. */
  async function execute(intent, { authorWallet, expectError, mine = false } = {}) {
    const plan = planOperation({ ...intent, pubNonce: pubNonce++ });
    assert.equal(plan.status, 'PLANNED', plan.reason);
    const prepared = await lab.prepare(plan.publication);
    const nonce = await authorNonceOf(plan.publication.header.principalId);
    const deadline = prepared.deadline;
    const wallet = authorWallet ?? authors[plan.publication.header.principalId];
    const authorSig = await authorizeAuthor(plan, { authorWallet: wallet, router, chainId: 31337, authorNonce: nonce, deadline });
    const data = routerInterface.encodeFunctionData('execute', [plan.op, plan.publication, prepared.revision, prepared.nonce, deadline, prepared.signature, nonce, deadline, authorSig]);
    if (expectError) {
      let error;
      try { await call(data); } catch (e) { error = e; }
      assert(error?.data, 'expected routed revert for ' + expectError);
      const decoded = decodeRouterError(error.data) ?? (() => { try { const e = CORE_ERRORS.parseError(error.data); return e && { name: e.name, args: [...e.args].map(String) }; } catch { return null; } })();
      assert.equal(decoded?.name, expectError, 'revert ' + (decoded?.name ?? error.data));
      if (mine) {
        const rejected = await lab.receipt(await lab.send(data, router), 'routed rejection');
        assert.equal(rejected.status, '0x0', 'mined rejection');
      }
      return { rejected: decoded, plan };
    }
    try { await call(data); } catch (e) {
      const decoded = decodeRouterError(e.data) ?? (() => { try { const c = CORE_ERRORS.parseError(e.data); return c && { name: c.name, args: [...c.args].map(String) }; } catch { return null; } })();
      assert.fail(intent.kind + ' preflight revert: ' + (decoded ? decoded.name + '(' + decoded.args + ')' : (e.data ?? e.message)));
    }
    const tx2 = await lab.send(data, router);
    const receipt2 = await lab.receipt(tx2, 'routed operation');
    assert.equal(receipt2.status, '0x1', intent.kind + ' routed execution failed');
    return { plan, receipt: receipt2, gasUsed: BigInt(receipt2.gasUsed) };
  }

  return { router, authors, A, B, execute, authorNonceOf, typeIds, purposes };
}
