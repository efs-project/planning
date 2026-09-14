import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { createCompactSdk } from './compact-sdk.mjs';

// External boundary only: independent ABI-encoded provider observations. Task 2
// also runs these public APIs against a real deployment, not this fixture.
const ethers = await import(pathToFileURL(`${process.env.EFS_ETHERS_PATH}/lib.esm/index.js`));
// Conspicuously disposable test-only signing key; never used by the adapter.
const testKey = new ethers.SigningKey(`0x${'11'.repeat(32)}`);
const sign = async digest => testKey.sign(digest).serialized;
const Z = ethers.ZeroHash, A = ethers.computeAddress(testKey.publicKey);
const B = '0x00000000000000000000000000000000000000b2';
const H = ethers.id, coder = ethers.AbiCoder.defaultAbiCoder();
const hash = (types, values) => ethers.keccak256(coder.encode(types, values));
const recordId = (type, data) => hash(['bytes32','bytes32','bytes32'], [H('efs2/record/1'),type,ethers.keccak256(data)]);
const pos = (purpose, subject, role) => hash(['bytes32','bytes32','bytes32','bytes32'], [H('efs2/position/1'),purpose,subject,role]);
const bindKey = (author, position) => hash(['bytes32','bytes32','bytes32'], [H('efs2/binding/1'),ethers.zeroPadValue(author,32),position]);
const HEAD = H('efs2/purpose/head/1'), FOLDER = H('efs2/purpose/folder/1'), TAG = H('efs2/purpose/tag/1');
const folder = H('mount'), file = H('file'), concept = H('approved'), name = 'alpha.txt';
const role = H(name), position = pos(FOLDER, folder, role);
const blockHash = H('block 42');
const abis = {};
for (const [key, artifact] of Object.entries({ledger:'ledger',index:'index',lens:'lens',registry:'registry',files:'consumer'})) {
  abis[key] = JSON.parse(gunzipSync(await readFile(new URL(`../files-paid-20260914/artifact-${artifact}.json.gz`, import.meta.url)))).abi;
}
abis.index = [...abis.index, 'function nameType() view returns(bytes32)', 'function expectedNameRuleHash() view returns(bytes32)'];
abis.names = [
  'function ledger() view returns(address)', 'function source() view returns(address)',
  'function coreCodehash() view returns(bytes32)', 'function nameType() view returns(bytes32)',
  'function expectedNameRuleHash() view returns(bytes32)',
  'function readName(bytes32 position,bytes32 folder,bytes32 role,(uint64 admission,uint64 epoch,bytes32 core) basis) view returns((uint8 status,bytes32 recordId,uint64 firstAdmission,bytes value))',
];
const contracts = Object.fromEntries(Object.keys(abis).map((key,i) => [key, {
  address: ethers.getAddress(`0x${(i + 10).toString(16).padStart(40,'0')}`),
  abi:abis[key], codeHash:ethers.keccak256(`0x60${(i + 1).toString(16).padStart(2,'0')}`),
}]));
const rules = Object.fromEntries(['root','child','name'].map((key,i) => [key, {
  address:`0x${(i + 30).toString(16).padStart(40,'0')}`, code:`0x61${(i + 1).toString(16).padStart(4,'0')}`,
  shape:H(`lab/type/files-${key === 'name' ? 'name-raw-ascii' : `joined-${key}`}/1`),
}]));
const types = Object.fromEntries(Object.entries(rules).map(([key,r]) => [key,
  hash(['bytes32','bytes32','bytes32','bytes32'], [H('efs2/type/1'),r.shape,hash(['bytes32[]'],[key === 'child' ? [Z] : []]),ethers.keccak256(r.code)]),
]));
const bodyA = ethers.concat([file,ethers.toUtf8Bytes('alice document')]);
const bodyB = ethers.concat([file,ethers.toUtf8Bytes('bob document')]);
const ra = recordId(types.root,bodyA), rb = recordId(types.root,bodyB);
const nameRecord = recordId(types.name,ethers.hexlify(ethers.toUtf8Bytes(name)));
const manifest = {chainId:'31337', folder, authors:{alice:A,bob:B}, contracts, types,
  ruleHashes:Object.fromEntries(Object.entries(rules).map(([k,r]) => [k,ethers.keccak256(r.code)])),
};

test('legacy factory refuses a guarded manifest instead of silently signing the legacy format', () => {
  assert.throws(() => createCompactSdk({ethers,manifest:{...manifest,protocol:'compact-guarded-v2'}}),/PROTOCOL/);
});
test('legacy create retains its own-CAS overwrite semantics without adding a selected-destination read',async()=>{
  const {sdk}=fixture({respond:({fn})=>{if(fn==='resolve')throw Error('legacy destination selection unavailable');}});
  const plan=await sdk.prepare({operation:'create',author:A,name,salt:H('legacy-create'),document:'bytes'});
  assert.equal(plan.actions.filter(a=>a.kind===3).length,2);
});

function fixture(overrides = {}) {
  const journal = new Map(), calls = [], ownHeads = new Map();
  const state = {generation:7n, admission:20n, epoch:3n, nonce:0n, publication:0n, ...overrides};
  const ifaces = Object.fromEntries(Object.entries(abis).map(([k,abi]) => [k,new ethers.Interface(abi)]));
  const selected = (authors,purpose,subject) => {
    if (purpose === HEAD) return state.mask ? [2,Z,4,A,19] : [1,authors[0].toLowerCase() === A.toLowerCase() ? ra : rb,2,authors[0],12];
    if (purpose === TAG && subject === file && authors.some(a => a.toLowerCase() === A.toLowerCase())) return [1,file,3,A,13];
    if (purpose === TAG && subject === ra && authors.some(a => a.toLowerCase() === A.toLowerCase())) return [1,file,1,A,14];
    if (purpose === FOLDER) return [1,file,1,A,8];
    return [0,Z,0,ethers.ZeroAddress,0];
  };
  const rpc = async (method,params) => {
    calls.push({method,params});
    if (method === 'eth_chainId') return '0x7a69';
    if (method === 'eth_getBlockByNumber' || method === 'eth_getBlockByHash') return {hash:blockHash,number:'0x2a',timestamp:'0x3e8',transactions:state.blockTransactions??[]};
    if (method === 'eth_getTransactionReceipt') return state.receipt ?? null;
    if (method === 'eth_getTransactionByHash') return state.transaction ?? null;
    const ctx = params[1];
    assert.deepEqual(ctx,{blockHash,requireCanonical:true},'all contract/code reads must use the exact EIP-1898 block hash');
    if (method === 'eth_getCode') {
      const entry = Object.entries(contracts).find(([,c]) => c.address.toLowerCase() === params[0].toLowerCase());
      if (entry) return `0x60${(Object.keys(contracts).indexOf(entry[0])+1).toString(16).padStart(2,'0')}`;
      return Object.values(rules).find(r => r.address.toLowerCase() === params[0].toLowerCase())?.code ?? '0x';
    }
    assert.equal(method,'eth_call');
    const key = Object.keys(contracts).find(k => contracts[k].address.toLowerCase() === params[0].to.toLowerCase());
    if (!key) {
      assert.equal(params[0].to.toLowerCase(),rules.child.address.toLowerCase());
      return coder.encode(['bytes32'],[types.root]);
    }
    const iface = ifaces[key], decoded = iface.parseTransaction({data:params[0].data});
    const fn = decoded.name, args = decoded.args;
    let out;
    if (state.respond) out = await state.respond({key,fn,args,state});
    if (out === undefined) {
      if (fn === 'ledger') out = [contracts.ledger.address];
      else if (fn === 'registry') out = [contracts.registry.address];
      else if (fn === 'indexModule' || fn === 'index' || fn === 'filesIndex') out = [contracts.index.address];
      else if (fn === 'lensReader') out = [contracts.lens.address];
      else if (fn === 'source') out = [contracts.ledger.address];
      else if (fn === 'coreCodeCommitment' || fn === 'coreCodehash') out = [contracts.ledger.codeHash];
      else if (fn === 'counts') out = [state.admission,3,3,1];
      else if (fn === 'generation') out = [state.generation];
      else if (fn === 'epoch') out = [state.epoch];
      else if (fn === 'attachedFrom') out = [1];
      else if (fn === 'FAMILY_SCOPE') out = [H('efs2/family/scope/1')];
      else if (fn === 'coverage') out = [2,1,state.admission];
      else if (fn === 'rootType') out = [types.root];
      else if (fn === 'childType') out = [types.child];
      else if (fn === 'nameType') out = [types.name];
      else if (fn.startsWith('expected') && fn.endsWith('RuleHash')) out = [manifest.ruleHashes[fn.slice(8,-8).toLowerCase()]];
      else if (fn === 'descriptor') {
        const type = Object.keys(types).find(k => types[k] === args[0]), r = rules[type];
        out = [r.shape,manifest.ruleHashes[type],r.address,type === 'child' ? 1 : 0,1,1];
      } else if (fn === 'refTypes') out = [args[0] === types.child ? [Z] : []];
      else if (fn === 'typeInfo') out = [true,rules.root.address,manifest.ruleHashes.root,ethers.ZeroAddress,Z,0,1];
      else if (fn === 'positionCell') out = [FOLDER,folder,role];
      else if (fn === 'subjectCreatedAt') out = [args[0] === file ? 2 : 0];
      else if (fn === 'resolve') out = selected(args[0],args[1],args[2]);
      else if (fn === 'resolveNoTiebreak') out = [3,[[pos(HEAD,file,Z),A,ra,2,12],[pos(HEAD,file,Z),B,rb,2,12]]];
      else if (fn === 'readName') out = [[state.nameStatus ?? 1,nameRecord,4,ethers.toUtf8Bytes(name)]];
      else if (fn === 'record') {
        out = args[0] === ra ? [types.root,5,0,bodyA] : args[0] === rb ? [types.root,6,1,bodyB]
          : args[0] === nameRecord ? [types.name,4,1,ethers.toUtf8Bytes(name)] : [Z,0,0,'0x'];
      } else if (fn === 'admission') out = [1,0,1,0,0,false,ethers.keccak256(args[0] === 6n ? bodyB : bodyA),types.root];
      else if (fn === 'head') out = ownHeads.get(args[0]) ?? [0,0,0,0,0,Z];
      else if (fn === 'nonces') out = [state.nonce];
      else if (fn === 'realmId') out = [H('realm')];
      else if (fn === 'acceptanceProfileOf') out = [H('acceptance')];
      else if (fn === 'indexObligations') out = [H('obligations')];
      else if (fn === 'intentDigest') out = [H('digest')];
      else if (fn === 'publicationOf') out = [state.publication];
      else if (fn === 'executeSigned') out = [2,21];
      else if (fn === 'list') {
        const continuation = args[3].basisAdmission !== 0n;
        const cursor = [state.admission,state.generation,state.epoch,contracts.ledger.codeHash,
          hash(['bytes32','bytes32'],[FOLDER,folder]),ethers.keccak256(ethers.concat(args[0].map(a => ethers.zeroPadValue(a,32)))),position,
          continuation ? args[0].length : 0,continuation ? 0 : 1,1];
        out = [[continuation ? [] : [[position,A,file,1,8]],1,1,2,1,continuation ? 2 : 1,false,cursor]];
      } else throw new Error(`unhandled fixture ${key}.${fn}`);
    }
    return iface.encodeFunctionResult(fn,out);
  };
  const sdk = createCompactSdk({ethers,rpc,manifest,journal:{
    async put(entry) { journal.set(entry.id,JSON.parse(JSON.stringify(entry))); },
    async get(id) { return journal.get(id); },
  }});
  return {sdk,state,journal,calls,ownHeads,rpc};
}

test('a missing Name preserves the positive member and resumable PARTIAL coverage', async () => {
  const {sdk} = fixture({nameStatus:2}), context = await sdk.pin();
  const result = await sdk.listFolder({folder,budget:1,context});
  assert.equal(result.coverage,'PARTIAL');
  assert.equal(result.value[0].file,file);
  assert.equal(result.value[0].name.knowledge,'UNKNOWN');
  assert.ok(result.continuation);
  const done = await sdk.listFolder({folder,budget:1,context,continuation:result.continuation});
  assert.equal(done.coverage,'COMPLETE');
  assert.equal(done.nameCoverage,'PARTIAL');
  assert.equal(done.value.length,1);
});
test('corrupt names are integrity failures, never fixture labels or omitted members', async () => {
  const {sdk} = fixture({nameStatus:3});
  const result = await sdk.listFolder({budget:1,context:await sdk.pin()});
  assert.equal(result.value[0].name.knowledge,'INVALID');
  assert.equal(result.value[0].name.value,null);
});
test('a terminal caller cursor cannot certify that the folder is empty', async () => {
  const {sdk} = fixture(), context = await sdk.pin();
  await assert.rejects(sdk.listFolder({context,cursor:{lensIndex:2,rawIndex:0}}), /CURSOR/);
  await assert.rejects(sdk.listFolder({context,continuation:{lensIndex:2}}), /CONTINUATION/);
});
test('mixed block/index contexts and forged context copies fail closed', async () => {
  const {sdk,state} = fixture(), context = await sdk.pin();
  await assert.rejects(sdk.readFile({file,context:{...context}}),/CONTEXT/);
  state.generation++;
  await assert.rejects(sdk.readFile({file,context}),/BASIS/);
});
test('a higher author mask never falls through to a lower live HEAD', async () => {
  const {sdk} = fixture({mask:true});
  const result = await sdk.readFile({file,context:await sdk.pin()});
  assert.equal(result.knowledge,'MASKED');
  assert.equal(result.value.revision,null);
  assert.equal(result.value.selection.author.toLowerCase(),A.toLowerCase());
  assert.equal(result.value.revisionTag.evaluated,false);
});
test('File and selected revision tags retain their subjects and independent provenance', async () => {
  const {sdk} = fixture(), context = await sdk.pin();
  const alice = await sdk.readFile({file,concept,authors:[A,B],context});
  const bob = await sdk.readFile({file,concept,authors:[B,A],context});
  assert.equal(alice.value.revision.recordId,ra);
  assert.equal(alice.value.revision.occurrences,'0'); // withdrawal is not validity
  assert.equal(alice.value.selection.author.toLowerCase(),A.toLowerCase());
  assert.equal(alice.value.fileTag.subject,file);
  assert.equal(alice.value.fileTag.selection.author.toLowerCase(),A.toLowerCase());
  assert.equal(alice.value.revisionTag.subject,ra);
  assert.equal(alice.value.revisionTag.present,true);
  assert.equal(bob.value.revision.recordId,rb);
  assert.equal(bob.value.fileTag.present,true);
  assert.equal(bob.value.revisionTag.subject,rb);
  assert.equal(bob.value.revisionTag.present,false);
});
test('no-tiebreak conflicts expose candidates without an overall selected revision', async () => {
  const {sdk} = fixture();
  const result = await sdk.readFile({file,concept,context:await sdk.pin(),policy:'no-tiebreak'});
  assert.equal(result.knowledge,'CONFLICT');
  assert.equal(result.value.revision,null);
  assert.deepEqual(result.value.candidates.map(c => c.revision.recordId),[ra,rb]);
  assert.equal(result.value.revisionTag.evaluated,false);
});
test('oversized bodies are rejected before authorization', async () => {
  const {sdk} = fixture();
  await assert.rejects(sdk.prepare({operation:'create',author:A,name,salt:H('salt'),document:new Uint8Array(8161)}),/BODY_LIMIT/);
});
test('create encodes File then document, retains Name reuse, and publishes atomically', async () => {
  const {sdk} = fixture();
  const plan = await sdk.prepare({operation:'create',author:A,name,salt:H('salt'),document:'new doc'});
  assert.deepEqual(plan.actions.map(a => a.kind),[5,1,3,3]);
  const expected = hash(['bytes32','bytes32','bytes32'],[H('efs2/subject/1'),ethers.zeroPadValue(A,32),H('salt')]);
  assert.equal(plan.file,expected);
  assert.equal(plan.bodies[1],ethers.concat([expected,ethers.toUtf8Bytes('new doc')]));
  assert.equal(plan.actions[2].subject,expected);
  assert.equal(plan.actions[3].role,role);
  assert.equal(plan.actions[3].target,expected);
});
test('a new higher-author removal mask binds then unbinds using own CAS zero', async () => {
  const {sdk} = fixture();
  const plan = await sdk.prepare({operation:'remove',author:A,file,name});
  assert.deepEqual(plan.actions.map(a => [a.kind,a.expectedRevision]),[[3,0],[4,1]]);
});
test('historical restore creates a child of current selection from historical bytes', async () => {
  const {sdk} = fixture();
  const plan = await sdk.prepare({operation:'restoreContents',author:B,file,record:ra,authors:[B,A]});
  assert.deepEqual(plan.actions.map(a => a.kind),[1,3]);
  assert.equal(plan.actions[0].typeId,types.child);
  assert.equal(plan.bodies[0],ethers.concat([rb,file,ethers.toUtf8Bytes('alice document')]));
  assert.notEqual(plan.actions[1].target,ra);
  assert.equal(plan.actions[1].expectedRevision,0);
});
test('a stale own CAS is refused before send without automatic resigning', async () => {
  const {sdk,ownHeads} = fixture();
  const plan = await sdk.prepare({operation:'edit',author:A,file,document:'changed'});
  const signed = await sdk.authorize(plan,sign);
  ownHeads.set(bindKey(A,pos(HEAD,file,Z)),[1,3,19,12,1,ra]);
  let sent = false;
  await assert.rejects(sdk.submit(signed,async () => {sent=true;return H('tx');}),/CAS/);
  assert.equal(sent,false);
});
test('response loss retains the exact pre-send journal and stays BROADCAST_UNKNOWN', async () => {
  const {sdk,journal} = fixture();
  const plan = await sdk.prepare({operation:'edit',author:A,file,document:'changed'});
  const signed = await sdk.authorize(plan,sign);
  const submitted = await sdk.submit(signed,async (tx,p) => {
    const retained = journal.get(p.id);
    assert.equal(retained.status,'BROADCAST_UNKNOWN');
    assert.equal(retained.transaction.data,tx.data);
    assert.equal(retained.plan.actionsHash,plan.actionsHash);
    throw new Error('response lost');
  });
  assert.equal(submitted.status,'BROADCAST_UNKNOWN');
  assert.equal((await sdk.reconcile(submitted.id)).status,'BROADCAST_UNKNOWN');
});
test('a successful receipt without canonical effects is not semantic success', async () => {
  const {sdk,state} = fixture();
  const plan = await sdk.prepare({operation:'edit',author:A,file,document:'changed'});
  const signed = await sdk.authorize(plan,sign);
  const sent = await sdk.submit(signed,async () => H('tx'));
  state.receipt = {status:'0x1',blockHash,blockNumber:'0x2a',transactionHash:H('tx'),transactionIndex:'0x0',gasUsed:'0x5208'};
  state.transaction={hash:H('tx'),blockHash,to:signed.transaction.to,input:signed.transaction.data,value:'0x0'};
  state.blockTransactions=[H('tx')];
  const result = await sdk.reconcile(sent.id);
  assert.equal(result.status,'EFFECTS_MISMATCH');
  assert.notEqual(result.knowledge,'VERIFIED');
});

test('legacy recovery observes the receipt before preserving its existing context-failure rejection', async () => {
  const {sdk,state,journal,calls} = fixture();
  const plan=await sdk.prepare({operation:'edit',author:A,file,document:'changed'});
  const signed=await sdk.authorize(plan,sign),sent=await sdk.submit(signed,async()=>H('receipt-before-pin'));
  state.receipt={status:'0x1',blockHash,blockNumber:'0x2a',transactionHash:H('receipt-before-pin'),transactionIndex:'0x0',gasUsed:'0x5208'};
  state.transaction={hash:H('receipt-before-pin'),blockHash,to:signed.transaction.to,input:signed.transaction.data,value:'0x0'};
  state.blockTransactions=[H('receipt-before-pin')];
  const prior=JSON.stringify(journal.get(sent.id)),start=calls.length;
  state.respond=()=>{throw Error('initial EFS reads unavailable');};
  await assert.rejects(sdk.reconcile(sent.id),/initial EFS reads unavailable/);
  assert.equal(calls.slice(start).filter(c=>c.method==='eth_getTransactionReceipt').length,1);
  assert.equal(JSON.stringify(journal.get(sent.id)),prior,'legacy failure must not mutate the retained envelope');
});

test('legacy local malformed envelope codecs reject before any RPC or journal write', async () => {
  const {sdk,journal,calls}=fixture();
  const plan=await sdk.prepare({operation:'edit',author:A,file,document:'changed'});
  const signed=await sdk.authorize(plan,sign),sent=await sdk.submit(signed,async()=>H('malformed-legacy'));
  const original=JSON.stringify(journal.get(sent.id));
  for(const mutate of [entry=>entry.plan.bodies[0]='0xgg',entry=>entry.plan.actions[0].expectedRevision=-1,
    entry=>delete entry.plan.actions[0].typeId,entry=>entry.plan.intent.nonce='18446744073709551616']) {
    const corrupt=JSON.parse(original);mutate(corrupt);journal.set(sent.id,corrupt);
    const serialized=JSON.stringify(corrupt),start=calls.length;
    await assert.rejects(sdk.reconcile(sent.id));
    assert.equal(calls.length,start,'local malformed authorization cannot reach the provider');
    assert.equal(JSON.stringify(journal.get(sent.id)),serialized,'local failure cannot persist an availability outcome');
  }
});

test('an unrelated receipt is not attributed to the authorized action or its cost', async () => {
  for(const fault of ['missing transaction','wrong recipient','wrong input','noncanonical block','wrong inclusion','null status','null gas','boolean status','boolean gas']) {
    const {sdk,state}=fixture();
    const plan=await sdk.prepare({operation:'edit',author:A,file,document:'changed'});
    const signed=await sdk.authorize(plan,sign);
    await sdk.submit(signed,async()=>H('tx'));
    state.receipt={status:'0x1',blockHash,blockNumber:'0x2a',transactionHash:H('tx'),transactionIndex:'0x0',gasUsed:'0x5208'};
    state.transaction={hash:H('tx'),blockHash,to:signed.transaction.to,input:signed.transaction.data,value:'0x0'};
    state.blockTransactions=[H('tx')];
    if(fault==='missing transaction')state.transaction=null;
    if(fault==='wrong recipient')state.transaction.to=B;
    if(fault==='wrong input')state.transaction.input='0x';
    if(fault==='noncanonical block')state.receipt.blockHash=H('orphan');
    if(fault==='wrong inclusion')state.blockTransactions=[H('unrelated')];
    if(fault==='null status')state.receipt.status=null;
    if(fault==='null gas')state.receipt.gasUsed=null;
    if(fault==='boolean status')state.receipt.status=true;
    if(fault==='boolean gas')state.receipt.gasUsed=false;
    const result=await sdk.reconcile(plan.id);
    assert.equal(result.receipt,null,fault);
    assert.equal(result.status,'BROADCAST_UNKNOWN',fault);
    assert.notEqual(result.receiptAttribution,'RPC_MATCHED_DIRECT_PLAN',fault);
  }
});

test('edit uses the explicit manifest Lens, not merely the writing author', async () => {
  const {sdk} = fixture();
  const plan = await sdk.prepare({operation:'edit',author:B,file,document:'new'});
  assert.equal(plan.bodies[0],ethers.concat([ra,file,ethers.toUtf8Bytes('new')]));
});
test('selected HEAD drift requires fresh authorization even when own CAS stays zero', async () => {
  const {sdk,state} = fixture();
  const plan = await sdk.prepare({operation:'edit',author:A,file,document:'new'});
  const signed = await sdk.authorize(plan,sign);
  state.respond = ({fn,args}) => fn === 'resolve' && args[1] === HEAD ? [1,rb,3,A,19] : undefined;
  let sent = false;
  await assert.rejects(sdk.submit(signed,async () => {sent=true;return H('tx');}),/SELECTION_DRIFT/);
  assert.equal(sent,false);
});
test('lower-author source placement drift is checked before removal broadcast', async () => {
  const f=fixture({respond:({fn,args}) => fn==='resolve' && args[1]===FOLDER ? [1,file,1,B,8] : undefined});
  const plan=await f.sdk.prepare({operation:'remove',author:A,file,name});
  const signed=await f.sdk.authorize(plan,sign);
  f.state.respond=({fn,args}) => fn==='resolve' && args[1]===FOLDER ? [1,H('replacement-file'),2,B,19] : undefined;
  let sent=false;
  await assert.rejects(f.sdk.submit(signed,async()=>{sent=true;return H('tx');}),/SELECTION_DRIFT/);
  assert.equal(sent,false);
});
test('concurrent submit calls share one broadcast within the SDK instance', async () => {
  const {sdk}=fixture();let sends=0;
  const plan=await sdk.prepare({operation:'edit',author:A,file,document:'changed'});
  const signed=await sdk.authorize(plan,sign);
  const send=async()=>{++sends;return H('tx');};
  await Promise.all([sdk.submit(signed,send),sdk.submit(signed,send)]);
  assert.equal(sends,1);
});
test('unavailable no-tiebreak body preserves the known conflict and both authors', async () => {
  const {sdk}=fixture({respond:({fn,args})=>{if(fn==='record' && args[0]===rb)throw new Error('provider unavailable');}});
  const result=await sdk.readFile({file,context:await sdk.pin(),policy:'no-tiebreak'});
  assert.equal(result.knowledge,'CONFLICT');assert.equal(result.coverage,'PARTIAL');
  assert.equal(result.value.candidates.length,2);assert.equal(result.value.candidates[1].selection.author.toLowerCase(),B.toLowerCase());
  assert.equal(result.value.candidates[1].knowledge,'UNKNOWN');assert.equal(result.value.candidates[1].revision,null);
});
test('an unavailable content response retains selected HEAD as UNKNOWN, never ABSENT', async () => {
  const {sdk} = fixture({respond:({fn,args}) => {if (fn === 'record' && args[0] === ra) throw new Error('provider unavailable');}});
  const result = await sdk.readFile({file,context:await sdk.pin()});
  assert.equal(result.knowledge,'UNKNOWN');
  assert.equal(result.reason,'BYTES_UNAVAILABLE');
  assert.equal(result.value.selection.target,ra);
});
test('a corrupt selected body is INVALID, not a verified document or absence', async () => {
  const {sdk} = fixture({respond:({fn,args}) => fn === 'record' && args[0] === ra ? [types.root,5,1,bodyB] : undefined});
  const result = await sdk.readFile({file,context:await sdk.pin()});
  assert.equal(result.knowledge,'INVALID');
  assert.equal(result.value.selection.target,ra);
  assert.equal(result.value.revision,null);
});
test('durable journal failure prevents the external send', async () => {
  const f = fixture();
  const sdk = createCompactSdk({ethers,rpc:async (...args) => f.rpc(...args),manifest,
    journal:{async get(){return null;},async put(){throw new Error('disk full');}}});
  const plan = await sdk.prepare({operation:'edit',author:A,file,document:'new'});
  const signed = await sdk.authorize(plan,sign);
  let sent = false;
  await assert.rejects(sdk.submit(signed,async () => {sent=true;}),/disk full/);
  assert.equal(sent,false);
});
test('response loss reconciles exact canonical admissions and heads after reload', async () => {
  const f = fixture(), {sdk,state,journal} = f;
  const plan = await sdk.prepare({operation:'edit',author:A,file,document:'changed'});
  const signed = await sdk.authorize(plan,sign);
  await sdk.submit(signed,async () => {throw new Error('response lost');});
  const body = ethers.concat([ra,file,ethers.toUtf8Bytes('changed')]);
  const revised = recordId(types.child,body), signature = ethers.Signature.from(signed.signature);
  state.publication = 2n; state.admission = 22n;
  state.respond = ({fn,args}) => {
    if (fn === 'evidence') return [A,2,signature.v,2,21,signature.r,signature.s,0,4600,42,H('acceptance'),H('obligations'),plan.actionsHash];
    if (fn === 'admission' && args[0] === 21n) return [1,0,2,0,0,false,ethers.keccak256(body),types.child];
    if (fn === 'admission' && args[0] === 22n) return [3,1,2,4,0,false,revised,Z];
    if (fn === 'record' && args[0] === revised) return [types.child,21,1,body];
    if (fn === 'head') return [1,1,22,0,4,revised];
    if (fn === 'history') return [2,true,revised,1,22];
    if (fn === 'bindingPosition') return [pos(HEAD,file,Z)];
  };
  const reloaded = createCompactSdk({ethers,rpc:f.rpc,manifest,journal:{async get(id){return journal.get(id);},async put(entry){journal.set(entry.id,entry);}}});
  const verified = await reloaded.reconcile(plan.id);
  assert.equal(verified.status,'EFFECTS_VERIFIED');
  assert.equal(verified.knowledge,'VERIFIED');
  assert.equal(verified.basis.grade,'RPC_OBSERVED');
  assert.equal(verified.evidence.firstAdmission,'21');
  assert.equal(verified.receipt,null);
  state.respond = ((original) => input => input.fn === 'history' ? [2,true,rb,1,22] : original(input))(state.respond);
  journal.get(plan.id).plan.expectedHeads = []; // unsigned local hints cannot waive read-back
  assert.equal((await reloaded.reconcile(plan.id)).status,'EFFECTS_MISMATCH');
});
test('journal tampering cannot redirect reconciliation to a different publication', async () => {
  const {sdk,journal} = fixture();
  const plan = await sdk.prepare({operation:'edit',author:A,file,document:'changed'});
  const signed = await sdk.authorize(plan,sign);
  await sdk.submit(signed,async () => H('tx'));
  journal.get(plan.id).plan.publicationId = H('other publication');
  await assert.rejects(sdk.reconcile(plan.id),/JOURNAL_INTEGRITY/);
});
test('first use publishes the exact Name bytes in the same atomic create batch', async () => {
  const {sdk} = fixture();
  const plan = await sdk.prepare({operation:'create',author:A,salt:H('fresh salt'),name:'new.txt',document:'payload'});
  assert.deepEqual(plan.actions.map(a => a.kind),[5,1,1,3,3]);
  assert.equal(plan.actions[2].typeId,types.name);
  assert.equal(plan.bodies[2],ethers.hexlify(ethers.toUtf8Bytes('new.txt')));
  assert.equal(plan.actions[4].role,H('new.txt'));
});
test('move removes only the requested source and binds the named destination in one batch', async () => {
  const {sdk,ownHeads} = fixture();
  ownHeads.set(bindKey(A,position),[1,1,8,0,1,file]);
  const plan = await sdk.prepare({operation:'move',author:A,file,fromName:name,name:'moved.txt'});
  assert.deepEqual(plan.actions.map(a => a.kind),[1,4,3]);
  assert.equal(plan.actions[1].role,role);
  assert.equal(plan.actions[1].expectedRevision,1);
  assert.equal(plan.actions[2].role,H('moved.txt'));
  assert.equal(plan.actions[2].target,file);
});
test('restoring placement binds the retained File without republishing its history or Name', async () => {
  const {sdk,ownHeads} = fixture();
  ownHeads.set(bindKey(A,position),[2,2,9,8,1,Z]);
  const plan = await sdk.prepare({operation:'restorePlacement',author:A,file,name});
  assert.deepEqual(plan.actions.map(a => [a.kind,a.expectedRevision]),[[3,2]]);
  assert.equal(plan.actions[0].target,file);
});
test('tag writes bind the exact File or selected revision subject', async () => {
  const {sdk} = fixture();
  const persistent = await sdk.prepare({operation:'addTag',author:A,file,scope:'file',concept});
  const revision = await sdk.prepare({operation:'addTag',author:A,file,scope:'revision',concept});
  assert.equal(persistent.actions[0].subject,file);
  assert.equal(revision.actions[0].subject,ra);
  assert.equal(revision.actions[0].target,file);
  const removed = await sdk.prepare({operation:'removeTag',author:A,file,scope:'revision',concept});
  assert.deepEqual(removed.actions.map(a => [a.kind,a.subject,a.expectedRevision]),[[3,ra,0],[4,ra,1]]);
});
test('a public direct Name read verifies a preimage without claiming membership', async () => {
  const {sdk} = fixture();
  const result = await sdk.readName({position,folder,role,context:await sdk.pin()});
  assert.equal(result.value,'alpha.txt');
  assert.equal(result.knowledge,'PRESENT');
  assert.equal(result.recordId,nameRecord);
  assert.equal(result.basis.grade,'RPC_OBSERVED');
});
test('code/index/profile mismatch fails closed instead of producing an empty read', async () => {
  const wrongIndex = fixture({respond:({fn}) => fn === 'indexModule' ? [B] : undefined});
  await assert.rejects(wrongIndex.sdk.pin(),/BINDING/);
  const wrongType = fixture({respond:({fn}) => fn === 'nameType' ? [types.root] : undefined});
  await assert.rejects(wrongType.sdk.pin(),/PROFILE/);
  const f = fixture();
  const bad = createCompactSdk({ethers,rpc:f.rpc,manifest:{...manifest,contracts:{...contracts,ledger:{...contracts.ledger,codeHash:H('wrong')}}}});
  await assert.rejects(bad.pin(),/CODE/);
});
