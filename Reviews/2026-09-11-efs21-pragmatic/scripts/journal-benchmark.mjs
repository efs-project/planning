// Full-C0 allocation experiment. No native-profile imports, tracing or server.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';

assert.notEqual(process.env.EFS_LAB_ANVIL_STEPS, '1', 'steps tracing forbidden');
assert(!process.env.EFS_TEST_BUILD_ROOT, 'runner owns its isolated build directory');
const arm = process.argv[2];
assert(['control', 'candidate'].includes(arm), 'usage: node scripts/journal-benchmark.mjs control|candidate');
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const VAULT = resolve(ROOT, '../..');
const output = join(ROOT, 'evidence/journal-' + arm + '.json');
assert(!readdirSync(join(ROOT, 'evidence')).includes('journal-' + arm + '.json'), 'do not overwrite retained receipt evidence');
const build = mkdtempSync(join(tmpdir(), 'efs21-journal-build-'));
process.env.EFS_TEST_BUILD_ROOT = build;
const { compileUpgrade, withUpgrade } = await import('../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs');
const { startEnvironment, compileRouter } = await import('../../2026-09-09-files-browser-mvp/scripts/environment.mjs');
const { planOperation, authorizeIntentV3, encodeExecuteV2, core3Interface, carrier3Interface,
  contentLeaves, byteCommitmentOf, latestBindingState, decodeAuthorityError } = await import('../../2026-09-09-files-browser-mvp/sdk/files-actions.mjs');
const { FIXTURE, bindingKey, positionKey, nameRole, tagId } = await import('../../2026-09-09-files-reader/index.mjs');
const { ordinaryRecord, ordinaryEnvelope } = await import('../../2026-09-05-c0-core/reference/state-reader.mjs');
const { keccak256, ZeroAddress, ZeroHash, toBeHex } = await import('../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js');
const { TX_GAS } = await import('../../2026-09-05-c0-core/scripts/local-stateful.mjs');
const plain = value => JSON.parse(JSON.stringify(value, (_, v) => typeof v === 'bigint' ? v.toString() : v));
// A Lens BasisReport reports the OBSERVATION block as well as admission H.
// Across successive receipts only that block marker is ignored here; all
// target/status/revision/history/H values and execution-set IDs remain exact.
function stateOnly(observed, { ignoreNonce = false } = {}) {
  const result = structuredClone(observed);
  for (const b of result.bindings) b.lens[0][8][1] = 'OBSERVATION_BLOCK';
  if (ignoreNonce) delete result.principalNonce;
  return result;
}
const git = args => { const r = spawnSync('git', args, { cwd: VAULT, encoding: 'utf8' }); assert.equal(r.status, 0); return r.stdout.trim(); };
const hashFile = path => keccak256(readFileSync(path));
const supportPaths = ['scripts/journal-benchmark.mjs', '../2026-09-09-files-browser-mvp/scripts/environment.mjs',
  '../2026-09-09-files-browser-mvp/test/authority-fixture.mjs', '../2026-09-09-files-browser-mvp/test/router-fixture.mjs',
  '../2026-09-09-files-browser-mvp/test/nested-fixture.mjs', '../2026-09-09-files-browser-mvp/sdk/files-actions.mjs'];
const supportPins = Object.fromEntries(supportPaths.map(p => [p, hashFile(resolve(ROOT, p))]));
function routerPins() {
  const pins = {};
  for (const [folder, name] of [['AuthorityUpgrade.sol','UpgradeableFixtureCoreU3'], ['AuthorityUpgrade.sol','UpgradeableFixtureCarrierU3'], ['FilesRouterV2.sol','FilesRouterV2']]) {
    const path = join(build, 'router/out', folder, name + '.json');
    const a = JSON.parse(readFileSync(path));
    for (const [source, meta] of Object.entries(a.metadata.sources)) {
      assert.equal(hashFile(resolve(ROOT, '../2026-09-09-files-browser-mvp/contracts', source)), meta.keccak256, 'router artifact source pin');
    }
    pins[name] = { artifactHash: hashFile(path), compiler: a.metadata.compiler, settings: a.metadata.settings,
      sourcePins: a.metadata.sources, runtimeTemplateBytes: (a.deployedBytecode.object.length - 2) / 2 };
  }
  return pins;
}
try {
  console.log('Compiling isolated full-C0 foundation and Files router:', arm);
  compileUpgrade({ fullBuild: true });
  compileRouter();
  const artifacts = routerPins();
  const report = await withUpgrade(async lab => {
    assert(!lab.resources.nodeArgs.includes('--steps-tracing'));
    const { f, auth } = await startEnvironment(lab, { write: true, relay: false, sponsor: false });
    const mountId = f.mounts.aFirst, principal = auth.A, operations = [];
    const receiptCall = async (receipt, iface, name, args = [], to = lab.core) => {
      const before = await lab.rpc('eth_getBlockByNumber', [receipt.blockNumber, false]);
      assert.equal(before.hash, receipt.blockHash, 'receipt basis hash before read');
      const result = iface.decodeFunctionResult(name, await lab.rpc('eth_call', [{ to, data: iface.encodeFunctionData(name, args), gas: toBeHex(TX_GAS) }, receipt.blockNumber]));
      assert.equal((await lab.rpc('eth_getBlockByNumber', [receipt.blockNumber, false])).hash, receipt.blockHash, 'receipt basis hash after read');
      return result;
    };
    async function observe(receipt, plan, bindings = []) {
      const counts = (await receiptCall(receipt, lab.iface, 'counts'))[0];
      const records = [], occurrences = [], heads = [];
      if (plan) {
        assert.equal(ordinaryEnvelope(plan.publication.header, plan.publication.recordIds), plan.publication.envelopeId, 'independent EnvelopeId');
        for (const leaf of plan.publication.leaves) {
          const id = plan.publication.recordIds[leaf.leafIndex];
          assert.equal(ordinaryRecord(leaf.typeId, leaf.body), id, 'independent RecordId');
          const record = await receiptCall(receipt, lab.readIface, 'getRecord', [id]);
          assert.equal(record[0], leaf.typeId); assert.equal(record[1], leaf.body); assert(record[2] > 0n);
          const occurrence = await receiptCall(receipt, lab.readIface, 'getOccurrence', [plan.publication.envelopeId, leaf.leafIndex]);
          assert.equal(occurrence[0], 1n, 'ACTIVE occurrence'); assert.equal(occurrence[2], id);
          records.push({ id, value: record }); occurrences.push({ leafIndex: leaf.leafIndex, value: occurrence });
        }
      }
      for (const binding of bindings) {
        const key = bindingKey(principal, binding.purpose, binding.subject, binding.role);
        const head = await receiptCall(receipt, lab.readIface, 'getBindingHead', [key]);
        assert.equal(head[0][3], BigInt(binding.revision), 'exact binding revision');
        assert.equal(head[0][5], binding.target, 'exact binding target');
        const history = await receiptCall(receipt, lab.readIface, 'readHistory', [key, 1, 64]);
        assert.equal(history[0].length, binding.revision, 'retained binding history length');
        const lens = await receiptCall(receipt, lab.readIface, 'resolve', [f.plans.aFirst, positionKey(binding.purpose, binding.subject, binding.role)]);
        assert.equal(lens[0][2][1], binding.target, 'Lens selected target');
        assert.equal(lens[0][8][1], BigInt(receipt.blockNumber), 'Lens observation block');
        heads.push({ key, head, history, lens });
      }
      return plain({ counts, records, occurrences, bindings: heads, principalNonce: (await receiptCall(receipt, core3Interface, 'principalNonce', [principal]))[0] });
    }
    async function retained(name, result, bindings = [], category = 'operation') {
      const r = result.receipt;
      assert.equal(r.status, '0x1');
      const observed = await observe(r, result.plan, bindings);
      const item = { name, category, hash: r.transactionHash, plan: result.plan, prepared: result.prepared, observed };
      operations.push(plain(item)); console.log(name, BigInt(r.gasUsed).toString()); return result;
    }
    const tagBinding = (label, target, revision = 1) => ({ purpose: FIXTURE.tagPurpose, subject: f.fileA, role: tagId(label), target, revision });
    for (const [name, label] of [['tag-first','journal-first'], ['tag-steady','journal-next']]) {
      const r = await auth.execute({ kind: 'tag', mountId, object: f.fileA, label, principal });
      await retained(name, r, [tagBinding(label, r.plan.predicted.assertionId)]);
    }
    const first = operations[0];
    const priorTag = await latestBindingState(auth.call, lab.core, { principal, purpose: FIXTURE.tagPurpose, subject: f.fileA, fieldRole: tagId('journal-first') });
    const rebound = await auth.execute({ kind: 'tag', mountId, object: f.fileA, label: 'journal-first', principal, priors: { tag: priorTag.prior } });
    await retained('binding-rebind', rebound, [tagBinding('journal-first', first.plan.predicted.assertionId, 2)]);
    const bytesHex = '0x' + '61'.repeat(41), content = contentLeaves(bytesHex);
    for (const [i, receipt] of (await auth.stageChunks(content)).entries()) {
      assert.equal((await receiptCall(receipt, carrier3Interface, 'readChunk', [content.treeId, i], auth.carrier))[0], content.chunks[i]);
      await retained('create-chunk-' + i, { receipt }, [], 'chunk-staging');
    }
    const create = await auth.execute({ kind: 'createFile', mountId, parent: f.root, name: 'journal.txt', principal, bytesHex, byteCommitment: byteCommitmentOf(content.treeId, content.tree.body) });
    assert.equal(create.plan.publication.leaves.length, 7);
    const file = create.plan.predicted.objectId;
    const headBinding = (target, revision) => ({ purpose: FIXTURE.headPurpose, subject: file, role: FIXTURE.headRole, target, revision });
    await retained('create-7-leaf-41B', create, [headBinding(create.plan.predicted.revisionId, 1), { purpose: FIXTURE.namePurpose, subject: f.root, role: nameRole('journal.txt'), target: create.plan.predicted.entryId, revision: 1 }]);
    const editBytes = '0x' + '62'.repeat(41), editContent = contentLeaves(editBytes);
    for (const [i, receipt] of (await auth.stageChunks(editContent)).entries()) {
      assert.equal((await receiptCall(receipt, carrier3Interface, 'readChunk', [editContent.treeId, i], auth.carrier))[0], editContent.chunks[i]);
      await retained('edit-chunk-' + i, { receipt }, [], 'chunk-staging');
    }
    const priorHead = await latestBindingState(auth.call, lab.core, { principal, purpose: FIXTURE.headPurpose, subject: file, fieldRole: FIXTURE.headRole });
    const edit = await auth.execute({ kind: 'edit', mountId, fileId: file, principal, bytesHex: editBytes,
      priorRevisionId: create.plan.predicted.revisionId, priors: { head: priorHead.prior }, byteCommitment: byteCommitmentOf(editContent.treeId, editContent.tree.body) });
    assert.equal(edit.plan.publication.leaves.length, 3);
    await retained('edit-3-leaf-41B', edit, [headBinding(edit.plan.predicted.revisionId, 2)]);
    // An ordinary binding rewrite is fresh; this separate publication exercises
    // true ACTIVE reuse with NEW Core authorization, never signature replay.
    const full = planOperation({ kind: 'tag', mountId, object: f.fileA, label: 'journal-mixed', principal, pubNonce: auth.pubNonceRef() });
    const partial = { ...full, publication: { ...full.publication, leafMask: 1n, leaves: [full.publication.leaves[0]], expectedRevisions: [] } };
    async function submitPlan(plan, direct = false) {
      const e = await auth.execution(), wallet = auth.authors[principal];
      const signed = await authorizeIntentV3(plan, { authorWallet: wallet, core: lab.core, chainId: 31337,
        executor: direct ? ZeroAddress : auth.router, executorCodehash: direct ? ZeroHash : auth.routerCodehash,
        executionSetId: e.executionSetId, nonce: await auth.authorNonceOf(principal), deadline: await auth.deadline() });
      const data = direct ? core3Interface.encodeFunctionData('executeAuthorized', [plan.publication, e.revision, signed.intent, signed.signature]) : encodeExecuteV2(plan, e.revision, signed.intent, signed.signature);
      const to = direct ? lab.core : auth.router;
      let tx;
      if (direct) {
        const raw = await wallet.signTransaction({ chainId: 31337, nonce: Number(await lab.rpc('eth_getTransactionCount', [wallet.address, 'pending'])), gasLimit: TX_GAS, gasPrice: 2000000000n, to, data });
        tx = { hash: await lab.rpc('eth_sendRawTransaction', [raw]), data, to, from: wallet.address };
      } else tx = await lab.send(data, to);
      return { plan, receipt: await lab.receipt(tx, direct ? 'direct author partial setup' : 'fresh-authorized routed retry'), prepared: { e, signed } };
    }
    await retained('partial-direct-author', await submitPlan(partial, true), [], 'direct-author-setup');
    const mixed = await retained('mixed-ACTIVE-fresh', await submitPlan(full), [tagBinding('journal-mixed', full.predicted.assertionId)]);
    const retry = await retained('exact-ACTIVE-retry', await submitPlan(full), [tagBinding('journal-mixed', full.predicted.assertionId)]);
    const mixedRead = operations.at(-2).observed, retryRead = operations.at(-1).observed;
    assert.deepEqual(stateOnly(retryRead, { ignoreNonce: true }), stateOnly(mixedRead, { ignoreNonce: true }), 'exact retry kernel rows/counts/history/Lens unchanged');
    assert.equal(BigInt(retryRead.principalNonce), BigInt(mixedRead.principalNonce) + 1n, 'fresh authorization nonce consumed');
    // Keep a mined, intended old-signature rejection and its actual gas too.
    const staleData = encodeExecuteV2(full, retry.prepared.e.revision, retry.prepared.signed.intent, retry.prepared.signed.signature);
    await assert.rejects(auth.call(auth.router, staleData), e => decodeAuthorityError(e.data)?.name === 'ErrIntentNonce');
    const rejected = await lab.receipt(await lab.send(staleData, auth.router), 'intended old-signature rejection');
    assert.equal(rejected.status, '0x0');
    const rejectedRead = await observe(rejected, full, [tagBinding('journal-mixed', full.predicted.assertionId)]);
    assert.deepEqual(stateOnly(rejectedRead), stateOnly(retryRead));
    operations.push({ name: 'old-signature-rejected', category: 'intended-rejection', hash: rejected.transactionHash, error: 'ErrIntentNonce', observed: rejectedRead });
    // Full canonical kernel inventory, including all postings, at final receipt.
    const call = (name, args = []) => receiptCall(rejected, lab.iface, name, args);
    const counts = (await call('counts'))[0], inventory = { counts, bootstrap: (await call('bootstrap'))[0] };
    for (const [label, countIndex, idAt, row] of [['records',0,'recordIdAt','record'], ['envelopes',1,'envelopeIdAt','envelope'], ['types',2,'typeIdAt','typeRow'], ['principals',3,'principalIdAt','principal'], ['bindings',7,'bindingKeyAt','binding']]) {
      inventory[label] = [];
      for (let i = 1; i <= Number(counts[countIndex]); i++) { const id = (await call(idAt,[i]))[0]; inventory[label].push({ id, row: (await call(row,[id]))[0] }); }
    }
    inventory.admissions = []; inventory.occurrences = []; inventory.batches = []; inventory.postings = [];
    for (let i = 1; i <= Number(counts[4]); i++) {
      inventory.admissions.push((await call('admissionAt',[i]))[0]);
      inventory.occurrences.push(await receiptCall(rejected, lab.readIface, 'getOccurrenceByOrdinal', [i]));
    }
    for (let i = 1; i <= Number(counts[5]); i++) inventory.batches.push((await call('batchAt',[i]))[0]);
    for (let i = 1; i <= Number(counts[6]); i++) {
      const key = (await call('postingKeyAt',[i]))[0], head = (await call('postingHead',[key]))[0], words = [];
      for (let j = 0; j < Number(((head & ((1n << 64n) - 1n)) + 4n) / 5n); j++) words.push((await call('postingWord',[key,j]))[0]);
      inventory.postings.push({ key, head, words });
    }
    // Capture ALL transactions, including fixture claims sent outside lab.send.
    const transactions = [], labels = new Map(lab.transactions.map(t => [t.hash, t.label]));
    for (let i = 1; i <= Number(BigInt(rejected.blockNumber)); i++) {
      const block = await lab.rpc('eth_getBlockByNumber', [toBeHex(i), false]);
      for (const hash of block.transactions) {
        const tx = await lab.rpc('eth_getTransactionByHash', [hash]), receipt = await lab.rpc('eth_getTransactionReceipt', [hash]);
        const raw = await lab.rpc('eth_getRawTransactionByHash', [hash]);
        const calldata = Buffer.from(tx.input.slice(2), 'hex'), zeros = calldata.filter(x => x === 0).length;
        transactions.push({ hash, label: labels.get(hash) ?? 'fixture principal claim', transaction: tx, raw, receipt,
          calldata: { bytes: calldata.length, zeroBytes: zeros, nonzeroBytes: calldata.length - zeros, intrinsicGas: 21000 + (tx.to === null ? 32000 : 0) + 4 * zeros + 16 * (calldata.length - zeros) + (tx.to === null ? 2 * Math.ceil(calldata.length / 32) : 0) } });
      }
    }
    const runtimes = {};
    for (const [name, value] of Object.entries({ ...auth.expected.components, FilesRouterV2: { address: auth.router } })) {
      const code = await lab.rpc('eth_getCode', [value.address, rejected.blockNumber]);
      assert((code.length - 2) / 2 <= 24576, name + ' EIP-170');
      runtimes[name] = { address: value.address, bytes: (code.length - 2) / 2, hash: keccak256(code) };
    }
    return plain({ arm, generatedAt: new Date().toISOString(), sourceCommit: git(['rev-parse','HEAD']),
      sourceDiff: git(['diff','--','Reviews/2026-09-05-c0-core/src/StateKernel.sol']), supportPins, artifacts,
      resources: lab.resources, identity: { genesis: await lab.rpc('eth_getBlockByNumber',['0x0',false]), core: lab.core, router: auth.router, execution: await auth.execution() },
      runtimes, operations, inventory, inventoryBasis: { number: rejected.blockNumber, hash: rejected.blockHash }, transactions, cleanup: lab.cleanup });
  }, { profile: 'reads', watchdogMs: 900000 });
  // withUpgrade returns only after its owned Anvil and cache have closed.
  mkdirSync(dirname(output), { recursive: true }); writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(relative(VAULT, output));
} finally { rmSync(build, { recursive: true, force: true }); }
