// Revision-3 authority environment: deploys Core/Carrier U3 (linked against
// the already-deployed admission library), upgrades the populated pair,
// retires the synthetic operator, deploys FilesRouterV2 and binds principals
// to disposable author accounts IN CORE. Provides the one-signature routed
// execute path and permissionless chunk staging used by tests and the env.
import assert from 'node:assert/strict';
import { routerArtifact as artifact } from './router-fixture.mjs';
import { Wallet, AbiCoder, Interface, keccak256, toBeHex } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { word, TX_GAS } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { FIXTURE } from '../../2026-09-09-files-reader/index.mjs';
import {
  EXTENDED_TYPES, planOperation, authorizeIntentV3, encodeExecuteV2, encodeStageChunk,
  decodeAuthorityError, router2Interface, core3Interface, carrier3Interface, contentLeaves, byteCommitmentOf,
} from '../sdk/files-actions.mjs';

const abi = AbiCoder.defaultAbiCoder();
const FACTORY = new Interface(['function upgradePair(address nextCore,address nextCarrier,bytes coreMigration,bytes carrierMigration)', 'function currentRevision() view returns (uint32)']);
const CORE_VIEW = new Interface(['function currentRevision() view returns (uint32)', 'function revisionAt(uint32) view returns ((uint32,uint64,uint64,address,address,address,address,bytes32,bytes32,address,address,address,address,address,bytes32,address,bytes32,bytes32,bytes32,bytes32,bytes32))']);

function linked(artifact, libraries) {
  let code = artifact.bytecode.object.replace(/^0x/, '');
  for (const refs of Object.values(artifact.bytecode.linkReferences ?? {})) {
    for (const [name, positions] of Object.entries(refs)) {
      const address = libraries[name];
      assert(address, 'unknown link ' + name);
      for (const p of positions) {
        const value = address.replace(/^0x/, '').toLowerCase().padStart(p.length * 2, '0');
        code = code.slice(0, p.start * 2) + value + code.slice((p.start + p.length) * 2);
      }
    }
  }
  assert(!code.includes('_'), 'unresolved link references');
  return '0x' + code;
}

export async function authorityFixture(lab) {
  const controller = lab.expected.execution.controller;
  const helper = lab.expected.execution.helper;
  const carrier = lab.expected.execution.carrier;
  const components = lab.expected.components;
  const libraries = {
    UpgradeAdmissionLibrary: lab.expected.execution.admissionLibrary,
    PointReadLibrary: components.PointReadLibrary.address,
    UpgradeQueryReadLibrary: components.UpgradeQueryReadLibrary.address,
  };
  const coreCtor = abi.encode(['address', 'address', 'bytes32', 'bytes32'],
    [controller, helper, keccak256(components.PointReadLibrary.code), keccak256(components.UpgradeQueryReadLibrary.code)]);
  const carrierCtor = abi.encode(['address', 'address'], [controller, helper]);

  async function deploy(name, ctor) {
    const a = artifact(name);
    const creation = linked(a, libraries) + ctor.slice(2);
    const receipt = await lab.receipt(await lab.send(creation), name + ' deployment');
    assert.equal(receipt.status, '0x1', name + ' deployment');
    const code = await lab.rpc('eth_getCode', [receipt.contractAddress, receipt.blockNumber]);
    assert((code.length - 2) / 2 <= 24576, name + ' EIP-170');
    return { address: receipt.contractAddress, codehash: keccak256(code) };
  }

  // Deploy U3 implementations and upgrade the POPULATED pair. The operator
  // remains admin-era genesis authority (same trust class as the upgrade
  // controller); its key is NEVER served to the browser build.
  const core3 = await deploy('AuthorityUpgrade.sol/UpgradeableFixtureCoreU3', coreCtor);
  const carrier3 = await deploy('AuthorityUpgrade.sol/UpgradeableFixtureCarrierU3', carrierCtor);
  const upgraded = await lab.receipt(await lab.send(FACTORY.encodeFunctionData('upgradePair', [core3.address, carrier3.address, '0x', '0x']), controller), 'authority upgrade');
  assert.equal(upgraded.status, '0x1', 'authority upgrade');
  const call = async (to, data) => lab.rpc('eth_call', [{ to, data, gas: toBeHex(TX_GAS) }, 'latest']);

  // Deploy FilesRouterV2 against the same core.
  const routerArtifact = artifact('FilesRouterV2.sol/FilesRouterV2');
  const T = EXTENDED_TYPES, P = FIXTURE;
  const routerCtor = abi.encode(['address', 'tuple(bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32)', 'tuple(bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32,bytes32)'],
    [lab.core,
      [T['ObjectGenesis/1'], T['BindingSet/1'], T['BindingTombstone/1'], T['DirectoryEntry/1'], T['DirectoryWhiteout/1'], T['FileRevision/1'], T['ChunkTree/1'], T['RemovalMarker/1'], T['FileTagAssertion/1']],
      [P.namePurpose, P.headPurpose, P.headRole, P.charterPurpose, P.removedPurpose, P.tagPurpose, P.fileMeaning, P.directoryMeaning]]);
  const routerReceipt = await lab.receipt(await lab.send(routerArtifact.bytecode.object + routerCtor.slice(2)), 'router v2 deployment');
  assert.equal(routerReceipt.status, '0x1');
  const router = routerReceipt.contractAddress;
  const routerCode = await lab.rpc('eth_getCode', [router, routerReceipt.blockNumber]);
  const routerCodehash = keccak256(routerCode);

  // Bind principals to disposable author accounts IN CORE (one-time claims).
  const A = word(0xffffffffffffn), B = word(0xbbbbbbbbbbbbbbbbn);
  const authors = { [A]: new Wallet(word(0xa11cen)), [B]: new Wallet(word(0xb0bn)) };
  for (const [principal, wallet] of Object.entries(authors)) {
    const already = await call(lab.core, core3Interface.encodeFunctionData('principalAccount', [principal]));
    if (BigInt(already) !== 0n) { assert.equal('0x' + already.slice(-40), wallet.address.toLowerCase(), 'principal bound to a different account'); continue; }
    await lab.rpc('anvil_setBalance', [wallet.address, '0x3635c9adc5dea00000']);
    const n = BigInt(await lab.rpc('eth_getTransactionCount', [wallet.address, 'pending']));
    const raw = await wallet.signTransaction({ chainId: 31337, nonce: Number(n), gasLimit: 300000n, gasPrice: 2000000000n, to: lab.core, data: core3Interface.encodeFunctionData('claimPrincipal', [principal]) });
    const hash = await lab.rpc('eth_sendRawTransaction', [raw]);
    let r; for (let i = 0; i < 200 && !r; i++) { r = await lab.rpc('eth_getTransactionReceipt', [hash]); if (!r) await new Promise(ok => setTimeout(ok, 25)); }
    assert.equal(r.status, '0x1', 'claimPrincipal in core');
  }

  let pubNonce = 61000;
  async function execution() {
    const [revision] = CORE_VIEW.decodeFunctionResult('currentRevision', await call(lab.core, CORE_VIEW.encodeFunctionData('currentRevision')));
    const [row] = CORE_VIEW.decodeFunctionResult('revisionAt', await call(lab.core, CORE_VIEW.encodeFunctionData('revisionAt', [revision])));
    return { revision: Number(revision), executionSetId: row[20] };
  }
  async function authorNonceOf(principal) {
    return BigInt(await call(lab.core, core3Interface.encodeFunctionData('principalNonce', [principal])));
  }
  async function deadline() { return BigInt((await lab.rpc('eth_getBlockByNumber', ['latest', false])).timestamp) + 3600n; }

  /** One author signature; routed through FilesRouterV2. expectError checks a
   *  typed preflight revert; mine=true also proves the mined rejection. */
  async function execute(intentSpec, { authorWallet, expectError, mine = false, patchIntent, target } = {}) {
    const plan = planOperation({ ...intentSpec, pubNonce: pubNonce++ });
    assert.equal(plan.status, 'PLANNED', plan.reason);
    const e = await execution();
    const principal = plan.publication.header.principalId;
    const wallet = authorWallet ?? authors[principal];
    const signed = await authorizeIntentV3(plan, {
      authorWallet: wallet, core: lab.core, chainId: 31337,
      executor: router, executorCodehash: routerCodehash,
      executionSetId: e.executionSetId, nonce: await authorNonceOf(principal), deadline: await deadline(),
      byteCommitment: intentSpec.byteCommitment,
    });
    if (patchIntent) patchIntent(signed);
    const to = target ?? router;
    // A direct-Core submission is the BYPASS shape: the same signed intent
    // handed straight to executeAuthorized, stripping the router.
    const data = to === router
      ? encodeExecuteV2(plan, e.revision, signed.intent, signed.signature)
      : core3Interface.encodeFunctionData('executeAuthorized', [plan.publication, e.revision, signed.intent, signed.signature]);
    if (expectError) {
      let error; try { await call(to, data); } catch (err) { error = err; }
      assert(error?.data, 'expected revert ' + expectError);
      const decoded = decodeAuthorityError(error.data);
      assert.equal(decoded?.name, expectError, 'revert ' + (decoded?.name ?? error.data));
      if (mine) {
        const rejected = await lab.receipt(await lab.send(data, to), 'authority rejection');
        assert.equal(rejected.status, '0x0', 'mined rejection');
      }
      return { rejected: decoded, plan, prepared: { e, signed } };
    }
    try { await call(to, data); } catch (err) {
      const decoded = decodeAuthorityError(err.data);
      assert.fail(intentSpec.kind + ' preflight revert: ' + (decoded ? decoded.name + '(' + decoded.args + ')' : err.data ?? err.message));
    }
    const receipt = await lab.receipt(await lab.send(data, to), 'routed v2 operation');
    assert.equal(receipt.status, '0x1', intentSpec.kind + ' failed');
    return { plan, receipt, gasUsed: BigInt(receipt.gasUsed), prepared: { e, signed } };
  }

  /** Permissionless validated chunk staging; returns per-chunk receipts. */
  async function stageChunks(content, { onlyIndexes } = {}) {
    const receipts = [];
    for (let i = 0; i < content.chunkCount; i++) {
      if (onlyIndexes && !onlyIndexes.includes(i)) continue;
      const data = encodeStageChunk({ treeId: content.treeId, body: content.tree.body, index: i, chunkData: content.chunks[i], leaves: content.leaves });
      const receipt = await lab.receipt(await lab.send(data, carrier), 'chunk ' + i);
      assert.equal(receipt.status, '0x1', 'chunk ' + i + ' staging');
      receipts.push(receipt);
    }
    return receipts;
  }

  // The reader validates the FULL revision history, so the qualified manifest
  // must know the new implementations' runtime code.
  const core3Code = await lab.rpc('eth_getCode', [core3.address, 'latest']);
  const carrier3Code = await lab.rpc('eth_getCode', [carrier3.address, 'latest']);
  const expected = {
    ...lab.expected,
    components: {
      ...lab.expected.components,
      UpgradeableFixtureCoreU3: { address: core3.address, code: core3Code },
      UpgradeableFixtureCarrierU3: { address: carrier3.address, code: carrier3Code },
    },
    implementations: {
      ...lab.expected.implementations,
      [core3.address.toLowerCase()]: { code: core3Code },
      [carrier3.address.toLowerCase()]: { code: carrier3Code },
    },
  };
  // Repeat the SAME U3 upgrade in place (revision advances; implementation
  // addresses stay within the served expected manifest, unlike lab.upgrade()
  // which would re-install the U2 pair and drop executeAuthorized).
  async function upgradeAgain() {
    const receipt = await lab.receipt(await lab.send(FACTORY.encodeFunctionData('upgradePair', [core3.address, carrier3.address, '0x', '0x']), controller), 'repeat authority upgrade');
    assert.equal(receipt.status, '0x1', 'repeat authority upgrade');
    return { receipt };
  }
  return { router, routerCodehash, core3, carrier3, carrier, authors, A, B, execute, stageChunks, execution, authorNonceOf, call, deadline, expected, upgradeAgain, pubNonceRef: () => pubNonce++ };
}
