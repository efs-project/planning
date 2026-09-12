// Full-C0 RecordBody.slice MCOPY versus the frozen byte loop; shared byte storage in BOTH arms.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, mkdtempSync, rmSync, statfsSync, existsSync, cpSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { gzipSync, gunzipSync } from 'node:zlib';

assert.notEqual(process.env.EFS_LAB_ANVIL_STEPS, '1', 'steps tracing forbidden');
assert(!process.env.EFS_TEST_BUILD_ROOT, 'runner owns its isolated build directory');
const arm = process.argv[2];
assert(['control', 'candidate'].includes(arm), 'usage: node scripts/body-copy-benchmark.mjs control|candidate');
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const VAULT = resolve(ROOT, '../..');
const preliminary=process.argv.includes('--preflight');
const output = preliminary ? join(VAULT,'.superpowers/sdd/2026-09-12-efs21-body-copy-plan/preflight-'+arm+'.json.gz') : join(ROOT, 'evidence/body-copy-' + arm + '.json.gz');
const manifestOutput=output.replace(/\.json\.gz$/,'.manifest.json');
assert(!existsSync(output), 'do not overwrite retained receipt evidence');
assert(!existsSync(manifestOutput),'do not overwrite retained evidence manifest');
const free = statfsSync(VAULT); assert(free.bavail * free.bsize > 20 * 1024 ** 3, 'stop heavy work below 20 GiB');
const started = Date.now();
let managedCleanup;
const build = mkdtempSync(join(tmpdir(), 'efs21-body-copy-build-'));
process.env.EFS_TEST_BUILD_ROOT = build;
const CONTROL_COMMIT = '24d74076d38d7b7758fc1eb222c8d7183da85c02';
let solidityRoot = VAULT;
if (arm === 'control') {
  solidityRoot = join(build, 'control-source'); mkdirSync(solidityRoot);
  const scopes = ['2026-09-05-c0-core','2026-09-05-c0-admission','2026-09-04-mvp-c0-foundation','2026-09-08-upgradeable-foundation','2026-09-09-files-browser-mvp/contracts'].map(p=>'Reviews/'+p);
  const listed = spawnSync('git',['ls-tree','-r','--name-only',CONTROL_COMMIT,'--',...scopes],{cwd:VAULT,encoding:'utf8'});
  assert.equal(listed.status,0);
  const paths=listed.stdout.trim().split('\n').filter(p=>/\.(sol|toml)$/.test(p));
  const archive=spawnSync('git',['archive',CONTROL_COMMIT,...paths],{cwd:VAULT,maxBuffer:64*1024*1024});assert.equal(archive.status,0);
  const extracted=spawnSync('tar',['-x','-C',solidityRoot],{input:archive.stdout});assert.equal(extracted.status,0);
  // Copy the exact installed Solidity dependency tree: an external symlink
  // escapes solc's unchanged allowed source directories for the router build.
  cpSync(resolve(VAULT,'Reviews/2026-09-08-upgradeable-foundation/node_modules/@openzeppelin/contracts'),join(solidityRoot,'Reviews/2026-09-08-upgradeable-foundation/node_modules/@openzeppelin/contracts'),{recursive:true});
}
process.env.EFS_TEST_SOLIDITY_ROOT = solidityRoot;
const { compileUpgrade, withUpgrade } = await import('../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs');
const { startEnvironment, compileRouter } = await import('../../2026-09-09-files-browser-mvp/scripts/environment.mjs');
const { planOperation, authorizeIntentV3, encodeExecuteV2, core3Interface, carrier3Interface,
  EXTENDED_TYPES, contentLeaves, byteCommitmentOf, latestBindingState, decodeAuthorityError } = await import('../../2026-09-09-files-browser-mvp/sdk/files-actions.mjs');
const { FIXTURE, bindingKey, positionKey, nameRole, tagId } = await import('../../2026-09-09-files-reader/index.mjs');
const { ordinaryRecord, ordinaryEnvelope } = await import('../../2026-09-05-c0-core/reference/state-reader.mjs');
const { AbiCoder, Interface, getCreateAddress, keccak256, ZeroAddress, ZeroHash, toBeHex } = await import('../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js');
const { TX_GAS, publication, groupLeaf } = await import('../../2026-09-05-c0-core/scripts/local-stateful.mjs');
const { encodeGroup, derive } = await import('../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs');
const { createFixtureReader } = await import('../../2026-09-09-files-reader/reader-scope.mjs');
const { openDirectory } = await import('../../2026-09-09-files-reader/files-reader.mjs');
const abi = AbiCoder.defaultAbiCoder();
const prepIface = new Interface(['function compileGroup(bytes) view returns (tuple(bytes32 groupHash,bytes32 rawHash,tuple(bytes32 typeId,bytes cacheBytes)[] types,bytes32[] dependencies))', 'error HelperDeploy()', 'error ReferenceUnproved(uint16,uint8)', 'error ErrCasRevision(bytes32,uint32,uint32)']);
const EFS_SLOT = BigInt(keccak256(abi.encode(['uint256'], [BigInt(keccak256(Buffer.from('efs.fixture.store'))) - 1n]))) & ~255n;
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
if(!preliminary) {
  const remaining=git(['status','--porcelain']).split('\n').filter(Boolean).filter(line=>!/^\?\? Reviews\/2026-09-11-efs21-pragmatic\/evidence\/body-copy-(control|candidate)\.(json\.gz|manifest\.json)$/.test(line));
  assert.deepEqual(remaining,[],'commit/freeze all source before final paired receipts');
}
const hashFile = path => keccak256(readFileSync(path));
const supportPaths = ['scripts/body-copy-benchmark.mjs', 'evidence/body-copy-control-helper.json', '../2026-09-09-files-browser-mvp/scripts/environment.mjs',
  '../2026-09-09-files-browser-mvp/test/authority-fixture.mjs', '../2026-09-09-files-browser-mvp/test/router-fixture.mjs',
  '../2026-09-09-files-browser-mvp/test/nested-fixture.mjs', '../2026-09-09-files-browser-mvp/sdk/files-actions.mjs'];
const supportPins = Object.fromEntries(supportPaths.map(p => [p, hashFile(resolve(ROOT, p))]));
function routerPins() {
  const pins = {};
  for (const [folder, name] of [['AuthorityUpgrade.sol','UpgradeableFixtureCoreU3'], ['AuthorityUpgrade.sol','UpgradeableFixtureCarrierU3'], ['FilesRouterV2.sol','FilesRouterV2']]) {
    const path = join(build, 'router/out', folder, name + '.json');
    const a = JSON.parse(readFileSync(path));
    for (const [source, meta] of Object.entries(a.metadata.sources)) {
      assert.equal(hashFile(resolve(solidityRoot, 'Reviews/2026-09-09-files-browser-mvp/contracts', source)), meta.keccak256, 'router artifact source pin');
    }
    const runtimeTemplateBytes=(a.deployedBytecode.object.length-2)/2,initcodeTemplateBytes=(a.bytecode.object.length-2)/2;
    assert(runtimeTemplateBytes<=24576,name+' EIP-170 before deployment');
    assert(initcodeTemplateBytes+128<=49152,name+' EIP-3860 including largest constructor');
    pins[name] = { artifactHash: hashFile(path), compiler: a.metadata.compiler, settings: a.metadata.settings,
      sourcePins: a.metadata.sources, runtimeTemplateBytes,initcodeTemplateBytes };
  }
  return pins;
}
function contractSurfaces() {
  const surfaces={};
  for(const [folder,name] of [
    ['UpgradeableFixtureCore.sol','UpgradeableFixtureCore'],['UpgradeableReadFixtureCore.sol','UpgradeableReadFixtureCore'],
    ['AuthorityUpgrade.sol','UpgradeableFixtureCoreU3'],['AuthorityUpgrade.sol','UpgradeableFixtureCarrierU3'],
    ['UpgradeAdmissionLibrary.sol','UpgradeAdmissionLibrary'],['PointReadLibrary.sol','PointReadLibrary'],
    ['FilesRouterV2.sol','FilesRouterV2']
  ]) {
    const a=JSON.parse(readFileSync(join(build,'router/out',folder,name+'.json')));
    surfaces[name]={abi:a.abi,selectors:a.methodIdentifiers};
  }
  const store=JSON.parse(readFileSync(join(build,'router/out/StateStore.sol/StateStore.json')));
  const structs=store.ast.nodes.find(n=>n.nodeType==='ContractDefinition'&&n.name==='StateStore').nodes.filter(n=>n.nodeType==='StructDefinition');
  const storageDeclarations=Object.fromEntries(structs.map(s=>[s.name,s.members.map(m=>({name:m.name,type:m.typeDescriptions.typeString}))]));
  return {surfaces,storageDeclarations};
}
try {
  console.log('Compiling isolated body-copy foundation and Files router:', arm);
  compileUpgrade({ fullBuild: true });
  compileRouter();
  const artifacts = routerPins();
  const contractSurface=contractSurfaces();
  const report = await withUpgrade(async lab => {
    assert(!lab.resources.nodeArgs.includes('--steps-tracing'));
    managedCleanup = lab.cleanup;
    const bootstrapTx=lab.transactions.find(t=>t.label==='atomic pair bootstrap');
    const bootstrapRead=async(name,args=[])=>lab.iface.decodeFunctionResult(name,await lab.rpc('eth_call',[{to:lab.core,data:lab.iface.encodeFunctionData(name,args)},bootstrapTx.receipt.blockNumber]))[0];
    const bootstrapHelper=lab.expected.execution.helper;
    const bootstrapChild=getCreateAddress({from:bootstrapHelper,nonce:1n});
    const bootstrapSnapshot=plain({receipt:bootstrapTx.receipt,bootstrap:await bootstrapRead('bootstrap'),counts:await bootstrapRead('counts'),intrinsic:await bootstrapRead('typeRow',[lab.inputs.meta]),helper:bootstrapHelper,helperNonce:await lab.rpc('eth_getTransactionCount',[bootstrapHelper,bootstrapTx.receipt.blockNumber]),helperChild:bootstrapChild,helperChildCode:await lab.rpc('eth_getCode',[bootstrapChild,bootstrapTx.receipt.blockNumber]),execution:await lab.collectExecution({number:bootstrapTx.receipt.blockNumber,hash:bootstrapTx.receipt.blockHash})});
    const { f, auth } = await startEnvironment(lab, { write: true, relay: false, sponsor: false });
    const mountId = f.mounts.aFirst, principal = auth.A, operations = [], cacheCases = [];
    const helper = lab.expected.execution.helper;
    // The public helper nonce is not reserved: both arms include an unrelated child.
    const externalHelperIface=new Interface(['function deployCache(bytes) returns(address)']);
    const externalHelperReceipt=await lab.receipt(await lab.send(externalHelperIface.encodeFunctionData('deployCache',['0x65787465726e616c']),helper),'external public helper CREATE');
    assert.equal(externalHelperReceipt.status,'0x1');
    const receiptCall = async (receipt, iface, name, args = [], to = lab.core) => {
      const before = await lab.rpc('eth_getBlockByNumber', [receipt.blockNumber, false]);
      assert.equal(before.hash, receipt.blockHash, 'receipt basis hash before read');
      const result = iface.decodeFunctionResult(name, await lab.rpc('eth_call', [{ to, data: iface.encodeFunctionData(name, args), gas: toBeHex(TX_GAS) }, receipt.blockNumber]));
      assert.equal((await lab.rpc('eth_getBlockByNumber', [receipt.blockNumber, false])).hash, receipt.blockHash, 'receipt basis hash after read');
      return result;
    };
    async function cacheInventory(receipt) {
      const count = (await receiptCall(receipt, lab.iface, 'counts'))[0][2], caches = [];
      for (let i = 1; i <= Number(count); i++) {
        const id = (await receiptCall(receipt, lab.iface, 'typeIdAt', [i]))[0];
        const row = (await receiptCall(receipt, lab.iface, 'typeRow', [id]))[0];
        // Pinned Store layout: Counts=2 slots, Bootstrap=10, then records/envelopes/types.
        const slot = BigInt(keccak256(abi.encode(['bytes32','uint256'], [id,EFS_SLOT+14n]))) + 2n;
        const word = await lab.rpc('eth_getStorageAt', [lab.core,toBeHex(slot,32),receipt.blockNumber]);
        const address = '0x' + word.slice(-40);
        const code = await lab.rpc('eth_getCode', [address,receipt.blockNumber]);
        assert.equal(code, '0x00' + row.cacheBytes.slice(2), 'stored pointer opens exact Type cache');
        assert.notEqual(address, ZeroAddress, 'actual Type pointer');
        caches.push({id,address,code,cacheBytes:row.cacheBytes});
      }
      assert.equal((await lab.rpc('eth_getBlockByNumber',[receipt.blockNumber,false])).hash,receipt.blockHash);
      const helperNonce = await lab.rpc('eth_getTransactionCount',[helper,receipt.blockNumber]);
      const allCounts=(await receiptCall(receipt,lab.iface,'counts'))[0];
      const envelopeCount=Number(allCounts[1]),envelopes=[],records=[];
      for(let i=1;i<=envelopeCount;i++) {
        const id=(await receiptCall(receipt,lab.iface,'envelopeIdAt',[i]))[0];
        const row=(await receiptCall(receipt,lab.iface,'envelope',[id]))[0];
        {
          const slot=keccak256(abi.encode(['bytes32','uint256'],[id,EFS_SLOT+13n]));
          const packed=BigInt(await lab.rpc('eth_getStorageAt',[lab.core,slot,receipt.blockNumber]));
          const address=toBeHex(packed & ((1n<<160n)-1n),20),offset=Number((packed>>160n)&65535n),length=Number((packed>>176n)&65535n);
          const extent=Number((packed>>192n)&65535n),ordinal=packed>>208n;
          assert.equal(offset,0);assert.equal(length,(row.canonicalUnsignedEnvelope.length-2)/2);assert.equal(ordinal,row.envelopeOrdinal);
          const code=await lab.rpc('eth_getCode',[address,receipt.blockNumber]);
          assert.equal((code.length-2)/2,extent+1);assert.equal(code.slice(0,4),'0x00');
          assert.equal('0x'+code.slice(4,4+length*2),row.canonicalUnsignedEnvelope);
          // Exact code is retained once in children, addressed by this pointer.
          envelopes.push({id,address,offset,length,extent,ordinal:String(ordinal)});
        }
      }
      for(let i=1;i<=Number(allCounts[0]);i++) {
        const id=(await receiptCall(receipt,lab.iface,'recordIdAt',[i]))[0];
        const row=(await receiptCall(receipt,lab.iface,'record',[id]))[0];
        const cell=BigInt(keccak256(abi.encode(['bytes32','uint256'],[id,EFS_SLOT+12n])));
        const words=await Promise.all([0n,1n,2n].map(j=>lab.rpc('eth_getStorageAt',[lab.core,toBeHex(cell+j,32),receipt.blockNumber])));
        assert.equal(words[0],row.typeId);assert.equal(BigInt(words[2])&((1n<<64n)-1n),row.recordOrdinal);
        assert.equal(BigInt(words[2])>>64n,row.firstAdmissionOrdinal);
        const packed=BigInt(words[1]),address=toBeHex(packed&((1n<<160n)-1n),20),offset=Number((packed>>160n)&65535n),length=Number((packed>>176n)&65535n),extent=Number((packed>>192n)&65535n);
        assert.equal(packed>>208n,0n);assert(length<=8192&&extent<=10496&&offset+length<=extent);
        const code=await lab.rpc('eth_getCode',[address,receipt.blockNumber]);
        assert.equal(code.slice(0,4),'0x00');assert.equal((code.length-2)/2,extent+1);
        assert.equal('0x'+code.slice(4+offset*2,4+(offset+length)*2),row.body,'exact logical shared Record slice');
        const oldPayloadSlot=keccak256(abi.encode(['uint256'],[cell+1n]));
        assert.equal(BigInt(await lab.rpc('eth_getStorageAt',[lab.core,oldPayloadSlot,receipt.blockNumber])),0n,'no dynamic Record payload');
        records.push({id,words,address,offset,length,extent});
      }
      const byAddress=new Map(caches.map(x=>[x.address,{kind:'Type',id:x.id}]));
      for(const [kind,rows]of [['Envelope',envelopes],['Record',records.filter(x=>x.address)]]) for(const x of rows) {
        const value=byAddress.get(x.address)??{kind:'shared-block',slices:[]};
        assert(Array.isArray(value.slices),'Type cache and byte block accounts must be distinct');
        value.slices.push({kind,id:x.id,offset:x.offset,length:x.length,extent:x.extent});byAddress.set(x.address,value);
      }
      for(const value of byAddress.values()) if(value.slices) {
        const slices=[...value.slices].sort((a,b)=>a.offset-b.offset);let at=0;
        for(const slice of slices){assert.equal(slice.offset,at,'complete gap-free first-seen allocation');at+=slice.length;assert.equal(slice.extent,slices[0].extent);}
        assert.equal(at,slices[0].extent,'every allocated byte belongs to a retained slice');
      }
      const children=[];
      for(let nonce=1n;nonce<BigInt(helperNonce);nonce++) {
        const address=getCreateAddress({from:helper,nonce}).toLowerCase(),code=await lab.rpc('eth_getCode',[address,receipt.blockNumber]);
        assert.notEqual(code,'0x','actual helper child present');
        children.push({nonce:String(nonce),address,code,...(byAddress.get(address)??{kind:'external-unowned'})});
      }
      assert.equal(children.filter(x=>x.kind==='Type').length,Number(count));
      assert(children.filter(x=>x.kind==='shared-block').length<=envelopeCount+records.length);
      return {helper,helperNonce,caches,envelopes,records,children};
    }
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
      return plain({ counts, records, occurrences, bindings: heads, cacheState: await cacheInventory(receipt), principalNonce: (await receiptCall(receipt, core3Interface, 'principalNonce', [principal]))[0] });
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
    const emptyContent=contentLeaves('0x');
    for(const [i,receipt]of(await auth.stageChunks(emptyContent)).entries())await retained('empty-chunk-'+i,{receipt},[],'chunk-staging');
    const emptyFile=await auth.execute({kind:'createFile',mountId,parent:f.root,name:'empty-shared.txt',principal,bytesHex:'0x',byteCommitment:byteCommitmentOf(emptyContent.treeId,emptyContent.tree.body)});
    assert.equal(emptyFile.plan.publication.leaves.length,7);
    await retained('create-7-leaf-empty-file',emptyFile);
    // An ordinary binding rewrite is fresh; this separate publication exercises
    // true ACTIVE reuse with NEW Core authorization, never signature replay.
    const full = planOperation({ kind: 'tag', mountId, object: f.fileA, label: 'journal-mixed', principal, pubNonce: auth.pubNonceRef() });
    const partial = { ...full, publication: { ...full.publication, leafMask: 1n, leaves: [full.publication.leaves[0]], expectedRevisions: [] } };
    async function submitPlan(plan, direct = false, expectedError) {
      const e = await auth.execution(), wallet = auth.authors[principal];
      const signed = await authorizeIntentV3(plan, { authorWallet: wallet, core: lab.core, chainId: 31337,
        executor: direct ? ZeroAddress : auth.router, executorCodehash: direct ? ZeroHash : auth.routerCodehash,
        executionSetId: e.executionSetId, nonce: await auth.authorNonceOf(principal), deadline: await auth.deadline() });
      const data = direct ? core3Interface.encodeFunctionData('executeAuthorized', [plan.publication, e.revision, signed.intent, signed.signature]) : encodeExecuteV2(plan, e.revision, signed.intent, signed.signature);
      const to = direct ? lab.core : auth.router;
      let error;
      if (expectedError) {
        try { await lab.rpc('eth_call', [{from:wallet.address,to,data,gas:toBeHex(TX_GAS)},'latest']); }
        catch (e) { error = e.data; }
        assert.equal(error, expectedError, 'allowlisted exact compound-fault bytes');
      }
      let tx;
      if (direct) {
        const raw = await wallet.signTransaction({ chainId: 31337, nonce: Number(await lab.rpc('eth_getTransactionCount', [wallet.address, 'pending'])), gasLimit: TX_GAS, gasPrice: 2000000000n, to, data });
        tx = { hash: await lab.rpc('eth_sendRawTransaction', [raw]), data, to, from: wallet.address };
      } else tx = await lab.send(data, to);
      const receipt=await lab.receipt(tx, direct ? 'direct author partial setup' : 'fresh-authorized routed retry');
      let failedReplay;
      if(receipt.status==='0x0') {
        try { await lab.rpc('eth_call',[{from:wallet.address,to,data,gas:toBeHex(TX_GAS)},receipt.blockNumber]); }
        catch(fault) { failedReplay={data:fault.data??null,message:fault.message}; }
        assert(failedReplay,'failed receipt remains a refusal at its exact committed basis');
      }
      return { plan, receipt, prepared: { e, signed }, error, failedReplay };
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
    let rejected = await lab.receipt(await lab.send(staleData, auth.router), 'intended old-signature rejection');
    assert.equal(rejected.status, '0x0');
    const rejectedRead = await observe(rejected, full, [tagBinding('journal-mixed', full.predicted.assertionId)]);
    assert.deepEqual(stateOnly(rejectedRead), stateOnly(retryRead));
    operations.push({ name: 'old-signature-rejected', category: 'intended-rejection', hash: rejected.transactionHash, error: 'ErrIntentNonce', observed: rejectedRead });
    // Paid consumers use real transactions, not estimates. Pin actual artifacts;
    // imported source metadata can differ even when executable instructions do not.
    const consumerArtifact=JSON.parse(readFileSync(join(build,'foundation/out/UpgradeReads.t.sol/UpgradeStaticConsumer.json')));
    const consumerReceipt=await lab.receipt(await lab.send(consumerArtifact.bytecode.object),'paid read consumer');
    assert.equal(consumerReceipt.status,'0x1');
    const consumerAddress=consumerReceipt.contractAddress,consumerIface=new Interface(consumerArtifact.abi),paidReads=[];
    assert.equal(await lab.rpc('eth_getCode',[consumerAddress,consumerReceipt.blockNumber]),consumerArtifact.deployedBytecode.object);
    const paidConsumer={address:consumerAddress,creation:consumerArtifact.bytecode.object,runtime:consumerArtifact.deployedBytecode.object,
      compiler:consumerArtifact.metadata.compiler,settings:consumerArtifact.metadata.settings,sourcePins:consumerArtifact.metadata.sources,
      artifactHash:hashFile(join(build,'foundation/out/UpgradeReads.t.sol/UpgradeStaticConsumer.json'))};
    const paidCases=[
      ['Envelope-create','getEnvelope',[create.plan.publication.envelopeId]],
      ['Occurrence-create','getOccurrence',[create.plan.publication.envelopeId,0]],
      ['Record-create','getRecord',[create.plan.publication.recordIds[0]]],
      ['Type-Object','getTypeSchema',[EXTENDED_TYPES['ObjectGenesis/1']]],
      ['Binding-create','getBindingHead',[bindingKey(principal,FIXTURE.headPurpose,file,FIXTURE.headRole)]],
      ['Record-current-eight','getRecordsCurrent',[[...create.plan.publication.recordIds,create.plan.publication.recordIds[0]]]],
    ];
    for(const [name,method,args] of paidCases) {
      if(!lab.readIface.hasFunction(method)) throw new Error('required paid consumer method missing: '+method);
      const data=lab.readIface.encodeFunctionData(method,args);
      const tx=await lab.receipt(await lab.send(consumerIface.encodeFunctionData('read',[lab.core,data]),consumerAddress),'paid '+name);
      assert.equal(tx.status,'0x1');
      const observed=await receiptCall(tx,consumerIface,'read',[lab.core,data],consumerAddress);
      assert.equal(observed[0],await receiptCallRaw(tx,lab.core,data));
      paidReads.push({name,method,args,hash:tx.transactionHash,gasUsed:String(BigInt(tx.gasUsed)),returnBytes:(observed[0].length-2)/2,raw:observed[0],work:String(observed[1])});
      rejected=tx;
    }
    async function receiptCallRaw(receipt,to,data) {return lab.rpc('eth_call',[{to,data,gas:toBeHex(TX_GAS)},receipt.blockNumber]);}
    // New full-C0 cache cases use the pinned helper, not native-profile substitutions.
    const descriptor = (name, fields) => ({name,meaning:'',specDigest:null,qualifier:'00'.repeat(32),fields,roles:[],indexes:[],constraints:[]});
    const small = name => descriptor(name,[{name:'flag',kind:'BOOL'}]);
    const boundary = descriptor('DirectBoundary/1',Array.from({length:64},(_,i)=>({name:'flag'+String(i).padStart(2,'0')+'a'.repeat(58),kind:'BOOL'})));
    async function compiled(members) {
      const raw = '0x'+encodeGroup(members).toString('hex'), ids = derive(Buffer.from(raw.slice(2),'hex'));
      const value = prepIface.decodeFunctionResult('compileGroup',await auth.call(helper,prepIface.encodeFunctionData('compileGroup',[raw])))[0];
      assert.equal(value.groupHash,ids.groupHash); assert.equal(value.rawHash,keccak256(raw));
      assert.deepEqual(value.types.map(t=>t.typeId),ids.ids);
      return {raw,ids:ids.ids,caches:value.types.map(t=>t.cacheBytes)};
    }
    const groupA = await compiled([small('DirectA/1'),small('DirectB/1')]), groupB = await compiled([small('DirectC/1')]);
    let salt = 98100;
    const groupPlan = {publication:publication([groupLeaf(lab.inputs.meta,groupA.raw),groupLeaf(lab.inputs.meta,groupB.raw)],salt++,{principal})};
    const multi = await retained('multiple-Type-groups',await submitPlan(groupPlan,true));
    rejected = multi.receipt;
    for (const c of [groupA,groupB]) for (let i=0;i<c.ids.length;i++) assert.equal((await receiptCall(rejected,lab.iface,'typeRow',[c.ids[i]]))[0].cacheBytes,c.caches[i]);
    const reuse = await retained('existing-Types-fresh-envelope',await submitPlan({publication:publication([groupLeaf(lab.inputs.meta,groupA.raw)],salt++,{principal})},true));
    rejected = reuse.receipt;
    assert.equal((await receiptCall(rejected,lab.readIface,'getEnvelope',[reuse.plan.publication.envelopeId]))[0].length,578,'288-byte minimum Envelope');
    const maximum=publication([groupLeaf(lab.inputs.meta,groupA.raw)],salt++,{principal});
    maximum.recordIds=Array(64).fill(maximum.recordIds[0]);
    maximum.envelopeId=ordinaryEnvelope(maximum.header,maximum.recordIds);
    const maxResult=await retained('maximum-Envelope-one-selected-existing-Record',await submitPlan({publication:maximum},true));
    rejected=maxResult.receipt;
    assert.equal((await receiptCall(rejected,lab.readIface,'getEnvelope',[maximum.envelopeId]))[0].length,4610,'2304-byte maximum Envelope');
    const maxData=lab.readIface.encodeFunctionData('getEnvelope',[maximum.envelopeId]);
    const maxRead=await lab.receipt(await lab.send(consumerIface.encodeFunctionData('read',[lab.core,maxData]),consumerAddress),'paid maximum Envelope');
    assert.equal(maxRead.status,'0x1');
    paidReads.push({name:'Envelope-maximum',method:'getEnvelope',args:[maximum.envelopeId],hash:maxRead.transactionHash,gasUsed:String(BigInt(maxRead.gasUsed)),raw:await receiptCallRaw(maxRead,lab.core,maxData)});
    rejected=maxRead;
    const scalarGroup=await compiled([descriptor('SharedScalar/1',[{name:'value',kind:'BYTES_FIXED',width:2}])]);
    rejected=(await retained('shared-scalar-Type-setup',await submitPlan({publication:publication([groupLeaf(lab.inputs.meta,scalarGroup.raw)],salt++,{principal})},true))).receipt;
    const scalar=n=>({typeId:scalarGroup.ids[0],body:toBeHex(n,2)});
    for(const [name,leaves]of [
      ['64-unique-ascending-RecordIds',Array.from({length:64},(_,i)=>scalar(i+1)).sort((a,b)=>ordinaryRecord(a.typeId,a.body)<ordinaryRecord(b.typeId,b.body)?-1:1)],
      ['64-unique-reverse-RecordIds',Array.from({length:64},(_,i)=>scalar(i+1)).sort((a,b)=>ordinaryRecord(a.typeId,a.body)>ordinaryRecord(b.typeId,b.body)?-1:1)],
      ['64-duplicate-selected',Array.from({length:64},()=>scalar(777))],
    ]) {
      const p=publication(leaves,salt++,{principal});
      assert.equal(p.leaves.length,64);
      const before=await observe(rejected),result=await submitPlan({publication:p},true);
      rejected=result.receipt;
      if(rejected.status==='0x1')await retained(name,result);
      else {
        const after=await observe(rejected);assert.deepEqual(after,before,'bounded maximum refusal rolls back every observed row, helper child and nonce');
        operations.push(plain({name,category:'bounded-cap-rejection',hash:rejected.transactionHash,plan:result.plan,prepared:result.prepared,failedReplay:result.failedReplay,observed:after}));
        console.log(name,'REJECTED',String(BigInt(rejected.gasUsed)));
      }
    }
    // Legal parser Types, not standalone codec synthetic maxima. All target
    // publications use the full author-intent/Core path and retain full state.
    const byteGroup=await compiled([descriptor('MetadataBytes/1',[{name:'data',kind:'BYTES',max:8190}])]);
    await retained('metadata-bytes-Type-setup',await submitPlan({publication:publication([groupLeaf(lab.inputs.meta,byteGroup.raw)],salt++,{principal})},true));
    const byteType=byteGroup.ids[0],byteLeaf=n=>({typeId:byteType,body:toBeHex(n,2)+'61'.repeat(n)});
    const targets={};
    for(const [name,n] of [['tiny',0],['near8192',8190]]) {
      const plan={publication:publication([byteLeaf(n)],salt++,{principal})};
      const fresh=await retained('fresh-Record-'+name,await submitPlan(plan,true));
      targets[name]=plan.publication.recordIds[0];
      rejected=fresh.receipt;
      await retained('existing-Record-new-occurrence-'+name,await submitPlan({publication:publication([byteLeaf(n)],salt++,{principal})},true));
    }
    rejected=(await retained('fresh-Record-zero-near8192',await submitPlan({publication:publication([{typeId:byteType,body:'0x1ffe'+'00'.repeat(8190)}],salt++,{principal})},true))).receipt;
    for(const name of ['tiny','near8192']) {
      const data=lab.readIface.encodeFunctionData('getRecord',[targets[name]]);
      const tx=await lab.receipt(await lab.send(consumerIface.encodeFunctionData('read',[lab.core,data]),consumerAddress),'paid Record-'+name);
      assert.equal(tx.status,'0x1');
      const observed=await receiptCall(tx,consumerIface,'read',[lab.core,data],consumerAddress);
      assert.equal(observed[0],await receiptCallRaw(tx,lab.core,data));
      paidReads.push({name:'Record-'+name,method:'getRecord',args:[targets[name]],hash:tx.transactionHash,gasUsed:String(BigInt(tx.gasUsed)),returnBytes:(observed[0].length-2)/2,raw:observed[0],work:String(observed[1])});
      rejected=tx;
    }
    const refDescriptor=(name,targetClass=1,expectedType='ANY',count=1)=>({
      ...descriptor(name,Array.from({length:count},(_,i)=>({name:'target'+i,kind:'REF'}))),
      roles:Array.from({length:count},(_,i)=>({name:'reference'+i,targetClass,expectedType,fieldIdx:i}))
    });
    const refGroup=await compiled([refDescriptor('MetadataReference/1'),refDescriptor('MetadataRepeated/1',1,'ANY',2),refDescriptor('MetadataObject/1',5)]);
    await retained('metadata-reference-Types-setup',await submitPlan({publication:publication([groupLeaf(lab.inputs.meta,refGroup.raw)],salt++,{principal})},true));
    for(const name of ['tiny','near8192']) {
      await retained('reference-existing-'+name,await submitPlan({publication:publication([{typeId:refGroup.ids[0],body:targets[name]}],salt++,{principal})},true));
    }
    await retained('reference-repeated-near8192',await submitPlan({publication:publication([{typeId:refGroup.ids[1],body:targets.near8192+targets.near8192.slice(2)}],salt++,{principal})},true));
    await retained('reference-valid-Object',await submitPlan({publication:publication([{typeId:refGroup.ids[2],body:f.fileA}],salt++,{principal})},true));
    const sameLeaf={typeId:byteType,body:'0x000162'},sameId=ordinaryRecord(sameLeaf.typeId,sameLeaf.body);
    await retained('same-carriage-Record-reference',await submitPlan({publication:publication([sameLeaf,{typeId:refGroup.ids[0],body:sameId}],salt++,{principal})},true));
    // 60 maximal-name BOOL fields produce a supported large real cache. The
    // pre-existing 64-field unsupported helper-size falsifier remains below.
    const supported=await compiled([descriptor('MetadataLargeDependency/1',Array.from({length:60},(_,i)=>({name:'flag'+String(i).padStart(2,'0')+'a'.repeat(58),kind:'BOOL'})))]);
    assert((supported.caches[0].length-2)/2<=24575);
    await retained('large-supported-Type-setup',await submitPlan({publication:publication([groupLeaf(lab.inputs.meta,supported.raw)],salt++,{principal})},true));
    for(const [name,id] of [['small',groupA.ids[0]],['large',supported.ids[0]]]) {
      const dep=await compiled([refDescriptor('MetadataDependency-'+name+'/1',1,id.slice(2))]);
      const r=await retained('Type-dependency-'+name,await submitPlan({publication:publication([groupLeaf(lab.inputs.meta,dep.raw)],salt++,{principal})},true));
      rejected=r.receipt;
    }
    const early=await compiled([small('MetadataEarlierType/1')]);
    const late=await compiled([refDescriptor('MetadataLaterType/1',1,early.ids[0].slice(2))]);
    rejected=(await retained('same-carriage-Type-dependency',await submitPlan({publication:publication([groupLeaf(lab.inputs.meta,early.raw),groupLeaf(lab.inputs.meta,late.raw)],salt++,{principal})},true))).receipt;
    // Withdrawal re-prepares the retained target body through the actual helper.
    // These are direct-author Core operations, not a new Files-router method.
    const withdrawalType=(await receiptCall(rejected,lab.iface,'bootstrap'))[0].withdrawalType;
    for(const [name,targetName,leafIndex]of [['tiny','fresh-Record-tiny',0],['near8192','fresh-Record-near8192',0],['current-Binding','binding-rebind',1]]) {
      const target=operations.find(x=>x.name===targetName).plan.publication;
      const beforeOccurrence=await receiptCall(rejected,lab.readIface,'getOccurrence',[target.envelopeId,leafIndex]);
      const beforeRecord=await receiptCall(rejected,lab.readIface,'getRecord',[target.recordIds[leafIndex]]);
      assert.equal(beforeOccurrence[0],1n);
      const key=name==='current-Binding'?bindingKey(principal,FIXTURE.tagPurpose,f.fileA,tagId('journal-first')):null;
      const beforeBinding=key?(await receiptCall(rejected,lab.readIface,'getBindingHead',[key]))[0]:null;
      const p=publication([{typeId:withdrawalType,body:target.envelopeId+toBeHex(leafIndex,2).slice(2)}],salt++,{principal});
      rejected=(await retained('withdraw-'+name,await submitPlan({publication:p},true),[],'direct-author-withdrawal')).receipt;
      const afterOccurrence=await receiptCall(rejected,lab.readIface,'getOccurrence',[target.envelopeId,leafIndex]);
      const afterRecord=await receiptCall(rejected,lab.readIface,'getRecord',[target.recordIds[leafIndex]]);
      assert.equal(afterOccurrence[0],2n);assert.deepEqual(plain(afterRecord),plain(beforeRecord),'withdrawal retains immutable Record');
      const afterBinding=key?(await receiptCall(rejected,lab.readIface,'getBindingHead',[key]))[0]:null;
      if(key){assert.equal(afterBinding[0],2n);assert.equal(afterBinding[3],beforeBinding[3]+1n);assert.equal(afterBinding[5],ZeroHash);}
      operations.at(-1).withdrawal=plain({targetEnvelope:target.envelopeId,leafIndex,beforeOccurrence,afterOccurrence,beforeRecord,afterRecord,beforeBinding,afterBinding});
    }
    const beforeCache = await cacheInventory(rejected);
    const beforeState = await observe(rejected);
    for (const fault of ['late-reference','late-CAS','cache-then-reference','cache-then-CAS']) {
      const c = await compiled(fault.startsWith('late-') ? [small('DirectRollback/'+fault)] : [small('DirectPrefix/'+fault),boundary]);
      const cacheStart = BigInt(beforeCache.helperNonce);
      const predicted = Array.from({length:c.ids.length+1},(_,i)=>getCreateAddress({from:helper,nonce:cacheStart+BigInt(i)}));
      const codeBefore = await Promise.all(predicted.map(address=>lab.rpc('eth_getCode',[address,rejected.blockNumber])));
      assert(codeBefore.every(code=>code==='0x'));
      const isCas=fault.endsWith('CAS');
      const target = isCas ? f.fileA : toBeHex(0xd1ec7,32);
      const body = '0x'+[FIXTURE.tagPurpose,f.fileA,tagId('direct-fault'), '0x01', target,'0x0000'].map(x=>x.slice(2)).join('');
      const p = publication([groupLeaf(lab.inputs.meta,c.raw),{typeId:EXTENDED_TYPES['BindingSet/1'],body}],salt++,{principal,revisions:[[1,isCas?99:0]]});
      const laterError = isCas
        ? prepIface.encodeErrorResult('ErrCasRevision',[bindingKey(principal,FIXTURE.tagPurpose,f.fileA,tagId('direct-fault')),99,0])
        : prepIface.encodeErrorResult('ReferenceUnproved',[1,0]);
      const expected = fault.startsWith('cache-') ? prepIface.encodeErrorResult('HelperDeploy',[]) : laterError;
      const result = await submitPlan({publication:p},true,expected);
      assert.equal(result.receipt.status,'0x0'); rejected = result.receipt;
      const after = await observe(rejected);
      assert.deepEqual(after,beforeState,'failure rolls back counts, nonce and all existing caches');
      for (const id of c.ids) assert.equal((await receiptCall(rejected,lab.iface,'typeRow',[id]))[0].typeOrdinal,0n);
      for (const id of p.recordIds) assert.equal((await receiptCall(rejected,lab.iface,'record',[id]))[0].recordOrdinal,0n);
      assert.equal((await receiptCall(rejected,lab.iface,'envelope',[p.envelopeId]))[0].envelopeOrdinal,0n);
      for (let i=0;i<p.leaves.length;i++) assert.equal((await receiptCall(rejected,lab.iface,'occurrence',[p.envelopeId,i]))[0].packed,0n);
      const codeAfter = await Promise.all(predicted.map(address=>lab.rpc('eth_getCode',[address,rejected.blockNumber])));
      assert.deepEqual(codeAfter,codeBefore,'all tentative helper cache code rolled back');
      cacheCases.push(plain({fault,compiled:c,predicted,codeBefore,codeAfter,error:result.error,failedReplay:result.failedReplay,expectedLaterError:laterError,before:beforeState,after}));
      operations.push(plain({name:fault,category:'compound-rejection',hash:rejected.transactionHash,plan:result.plan,prepared:result.prepared,error:result.error,observed:after}));
    }
    // Actual checked/batched Files anchor consumer and final sealing.
    const opened=await createFixtureReader({source:{identity:auth.expected.source,epoch:1,request:lab.rpc},context:{expected:auth.expected}}).open({blockTag:rejected.blockNumber});
    assert.equal(opened.status,'READY');
    const directory=openDirectory(opened.scope,{mountId:f.mounts.aFirst,subject:f.root,pageSize:8}),filesPages=[];
    for(let i=0;i<32;i++) {
      const page=await directory.loadMore();filesPages.push(page);
      assert.equal(page.qualification.status,'QUALIFIED',page.detail);
      if(!page.continuation)break;
    }
    assert.equal(filesPages.at(-1).coverage,'COMPLETE');
    assert(filesPages.at(-1).rows.some(row=>row.value.name==='journal.txt'),'created file in qualified actual directory');
    const filesRead={pages:filesPages,stats:opened.scope.stats(),evidence:opened.scope.evidence()};
    directory.close();opened.scope.close();
    let historicalReaderRefusal=null;
    if(arm==='candidate') {
      const frozen=JSON.parse(readFileSync(join(ROOT,'evidence/body-copy-control-helper.json')));
      assert.equal(frozen.commit,CONTROL_COMMIT);
      const oldCode=frozen.runtime;
      const expected=structuredClone(auth.expected);expected.components.PreparationHelper.code=oldCode;
      // Keep the old-helper expectation internally coherent: otherwise the
      // manifest validator rejects before observing any deployed runtime.
      expected.execution.helperCodehash=keccak256(oldCode);expected.getters.preparationCodehash=keccak256(oldCode);
      const denied=await createFixtureReader({source:{identity:auth.expected.source,epoch:1,request:lab.rpc},context:{expected}}).open({blockTag:rejected.blockNumber});
      assert.equal(denied.status,'UNAVAILABLE');assert.match(denied.reason,/runtime/);
      historicalReaderRefusal={controlCommit:CONTROL_COMMIT,oldHelperRuntimeHash:keccak256(oldCode),status:denied.status,reason:denied.reason,evidence:denied.evidence};
    }
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
    return plain({ arm, preliminary, generatedAt: new Date().toISOString(), sourceCommit: git(['rev-parse','HEAD']),
      sourceDiff: git(['diff','--','Reviews/2026-09-05-c0-core/src','Reviews/2026-09-08-upgradeable-foundation/src']), supportPins, artifacts, contractSurface,
      resources: lab.resources, identity: { genesis: await lab.rpc('eth_getBlockByNumber',['0x0',false]), core: lab.core, router: auth.router, execution: await auth.execution() },
      storageProfile:'shared-record-envelope-block-v1',soliditySourceCommit:arm==='control'?CONTROL_COMMIT:git(['rev-parse','HEAD']),
      bootstrapSnapshot, runtimes, operations, paidReads, paidConsumer, filesRead, historicalReaderRefusal, externalHelperReceipt, cacheCases, inventory, inventoryBasis: { number: rejected.blockNumber, hash: rejected.blockHash }, transactions, cleanup: lab.cleanup });
  }, { profile: 'reads', watchdogMs: 900000 });
  // withUpgrade returns only after its owned Anvil and cache have closed.
  report.cleanup = plain(managedCleanup);
  assert(report.cleanup.stopped && report.cleanup.cacheRemoved, 'managed world teardown confirmed');
  report.elapsedMs = Date.now()-started;
  rmSync(build, {recursive:true,force:true});
  report.buildCleanup = {path:build,removed:!existsSync(build)};
  const canonical=Buffer.from(JSON.stringify(report)+'\n'),compressed=gzipSync(canonical,{mtime:0});
  assert(canonical.length<=32*1024**2&&compressed.length<=8*1024**2,'bounded evidence extent: canonical '+canonical.length+', gzip '+compressed.length);
  assert.equal(compressed[3],0,'gzip has no filename/comment');assert.equal(compressed.readUInt32LE(4),0,'deterministic no-time gzip header');
  const manifest={format:'EFS21_BODY_COPY_RECEIPTS_GZIP_JSON_V1',canonical:{bytes:canonical.length,keccak256:keccak256(canonical)},compressed:{bytes:compressed.length,keccak256:keccak256(compressed)}};
  mkdirSync(dirname(output), { recursive: true }); writeFileSync(output,compressed,{flag:'wx'});
  writeFileSync(manifestOutput,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  console.log(relative(VAULT, output));
} finally {
  if(preliminary && existsSync(build)) console.log('Preflight build retained:',build);
  else rmSync(build, { recursive: true, force: true });
}
