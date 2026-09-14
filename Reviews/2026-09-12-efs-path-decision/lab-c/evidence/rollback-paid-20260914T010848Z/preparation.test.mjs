import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {derive,readTables,constants,enc,word,pack,lengths,chunks,slot,Z,ART,ethers} from './prepare.mjs';
import {instantiate} from './runtime.mjs';
import {assertObservation,assertMapInventory,verifySigned,audit} from './audit.mjs';
const e=derive(true),a=e.arms.calibration,pre=a.pre,post=a.post,abi=ethers.AbiCoder.defaultAbiCoder();
const raw=(call,answer,block)=>({request:{method:call.method,params:[...call.params,'0x'+BigInt(block).toString(16)]},response:{result:answer}});
const expectReject=(fn)=>assert.throws(fn);
test('sealed schedules, six roles, exact126 reads261 slots59 rows each',()=>{
 for(const [i,n]of ['scale7','lateIndex','calibration'].entries()){const x=e.arms[n];assert.equal(x.pre.blockNumber,String(i*9+8));assert.equal(x.post.blockNumber,String(i*9+9));assert.deepEqual(x.deployment.map(d=>[d.role,d.nonce]),[['ImportLib',0],['IndexModule',1],['Ledger',2],['PassAcceptor',4],['QuoteAcceptorV1',5],['Producer',6]]);assert.equal(Object.keys(x.readCalls).length,126);assert.equal(Object.keys(x.storageCalls).length,261);assert.equal(Object.keys(x.rowManifest).length,59);assertMapInventory(x.readCalls,x.pre.reads);assertMapInventory(x.storageCalls,x.pre.storage);}
});
test('Evidence is325static bytes, 11 words, no dynamic fields',()=>{
 const t=readTables().Evidence;assert.equal(t.staticBytes,325);assert.equal(t.dynamicFields,0);assert.equal(Object.keys(post.storage).filter(k=>k.startsWith('Evidence.a1.static.')).length,11);assert(!Object.keys(post.storage).some(k=>k.startsWith('Evidence.a1.dynamic.')));
 const decoded=abi.decode(['bytes','bytes32','bytes'],post.reads['row.Evidence.a1']);assert.equal((decoded[0].length-2)/2,325);assert.equal(decoded[1],Z);assert.equal(decoded[2],'0x');
});
test('hand literal left-aligned highWater6/11, not B right-aligned integer',()=>{
 const expected='0x000000000000000b'+'00'.repeat(24);assert.equal(post.storage['Counter.admissions.static.0'],expected);assert.equal(pre.storage['Counter.admissions.static.0'],'0x0000000000000006'+'00'.repeat(24));
 const c=a.storageCalls['Counter.admissions.static.0'];expectReject(()=>assertObservation(raw(c,word(11),27),c,expected,27));
});
test('hand literal uint64 author posting uses eight-byte big endian and two words',()=>{
 const w0='0x000000000000000700000000000000080000000000000009000000000000000a',w1='0x000000000000000b'+'00'.repeat(24);
 assert.equal(post.storage['ByAuthor.author.dynamic.0'],w0);assert.equal(post.storage['ByAuthor.author.dynamic.1'],w1);
 const wrong=word(7n+(8n<<48n)+(9n<<96n)+(10n<<144n)+(11n<<192n)),c=a.storageCalls['ByAuthor.author.dynamic.0'];expectReject(()=>assertObservation(raw(c,wrong,27),c,w0,27));
});
test('length accumulator and first field length both retained',()=>{
 const expected='0x'+'00'.repeat(24)+'2800000000000028';assert.equal(lengths(40),expected);assert.equal(post.storage['ByAuthor.author.length'],expected);
 const c=a.storageCalls['ByAuthor.author.length'];expectReject(()=>assertObservation(raw(c,word(40),27),c,expected,27));
});
test('zero-length hidden backing slots stay in mandatory inventory',()=>{
 const missing={...pre.storage};delete missing['ByAuthor.author.dynamic.1'];expectReject(()=>assertMapInventory(a.storageCalls,missing));
 for(const n of ['ByAuthor.author.dynamic.0','ByAuthor.author.dynamic.1','Scope.head.dynamic.2','Record.Quote.dynamic.8'])assert.equal(pre.storage[n],Z);
});
test('framed Quote exact288bytes occupies all9dynamic words',()=>{
 assert.equal((a.fixture.quote.body.length-2)/2,288);assert.equal(Object.keys(post.storage).filter(k=>/^Record\.Quote\.dynamic\./.test(k)).length,9);assert.deepEqual(chunks(a.fixture.quote.body),Array.from({length:9},(_,i)=>post.storage['Record.Quote.dynamic.'+i]));
 const missing={...post.storage};delete missing['Record.Quote.dynamic.8'];expectReject(()=>assertMapInventory(a.storageCalls,missing));
});
test('TAG scope uses concept and File as second triple member, not role',()=>{
 assert.equal(post.storage['Scope.tag.dynamic.0'],a.fixture.author);assert.equal(post.storage['Scope.tag.dynamic.1'],a.fixture.fileId);assert.equal(post.storage['Scope.tag.dynamic.2'],a.fixture.bindingKeys.TAG);
 const c=a.storageCalls['Scope.tag.dynamic.1'];expectReject(()=>assertObservation(raw(c,a.fixture.concept,27),c,a.fixture.fileId,27));
 const role=a.a1.intent.actions[4].role;assert.equal(role,a.fixture.concept);assert.equal(a.a1.intent.actions[4].target,word(1));
});
test('Store length and data namespace slots independently recomputed',()=>{
 const table=e.tables.ByAuthor.id,key=a.fixture.author,h=ethers.keccak256(ethers.concat([table,key]));
 assert.equal(a.storageCalls['ByAuthor.author.length'].params[1],word(BigInt(ethers.id('mud.store.dynamicDataLength'))^BigInt(h)));
 assert.equal(a.storageCalls['ByAuthor.author.dynamic.0'].params[1],word(BigInt(ethers.id('mud.store.dynamicData'))^BigInt(h)));
 assert.notEqual(slot('mud.store',table,key),slot('mud.store.dynamicData',table,key));
});
test('C S0/S1 admission basis is0/6, not execution block26/27',()=>{
 for(const [label,basis,first,count]of [['prefix',0,1,6],['a1',6,7,5]]){const [s]=abi.decode(['bytes','bytes32','bytes'],post.reads['row.Evidence.'+label]);assert.equal(BigInt('0x'+s.slice(2+220*2,2+228*2)),BigInt(basis));assert.equal(BigInt('0x'+s.slice(2+210*2,2+218*2)),BigInt(first));assert.equal(BigInt('0x'+s.slice(2+218*2,2+220*2)),BigInt(count));}
});
test('no Type/Record occurrence key collision; all seven are checked',()=>{
 assert.equal(Object.keys(a.rowManifest).filter(k=>k.startsWith('Occurrences.')).length,7);assert.notEqual(a.rowManifest['Occurrences.Type.Pair'].key,a.rowManifest['Occurrences.Record.Pair'].key);assert.equal(pre.storage['Occurrences.Record.Quote.static.0'],Z);
});
test('full native and signed intent numericfields are decimalstrings',()=>{
 for(const p of [a.fixture.prefix,a.a1]){assert.equal(p.intent.nonce,'1');assert.match(p.intent.deadline,/^[0-9]+$/);for(const act of p.intent.actions)for(const k of ['kind','digestKind','expectedRevision'])assert.match(act[k],/^[0-9]+$/);}
 assert.equal(typeof a.a1.signature.v,'number');
});
test('independently recomputed EIP712 signature and bad signature refusal',()=>{
 const p=a.a1,types={PublicationIntent:[['realmId','bytes32'],['coreCodeCommitment','bytes32'],['author','bytes32'],['nonce','uint64'],['deadline','uint64'],['acceptanceProfile','bytes32'],['indexObligations','bytes32'],['actionsHash','bytes32']].map(([name,type])=>({name,type}))};
 const message={realmId:a.fixture.realmId,coreCodeCommitment:a.deployment.find(d=>d.role==='Ledger').runtimeCodehash,author:p.intent.author,nonce:p.intent.nonce,deadline:p.intent.deadline,acceptanceProfile:p.intent.acceptanceProfile,indexObligations:p.intent.indexObligations,actionsHash:p.actionsHash};
 const digest=ethers.TypedDataEncoder.hash({name:'EFS Lab C',version:'1'},types,message);assert.equal(digest,p.digest);assert.equal(ethers.recoverAddress(digest,p.signature).toLowerCase(),a.attempt.from);
 const bad={...p.signature,r:word(BigInt(p.signature.r)^1n)};expectReject(()=>assert.equal(ethers.recoverAddress(digest,bad).toLowerCase(),a.attempt.from));
});
test('changed TAG role changes signed action hash and fails literal call comparison',()=>{
 const p=a.a1,artifact=JSON.parse(fs.readFileSync(`${ART}/Ledger.sol/Ledger.json`)),iface=new ethers.Interface(artifact.abi),intent=structuredClone(p.intent);intent.actions[4].role=Z;
 const modified=iface.encodeFunctionData('publishSigned',[intent,p.bodies,p.signature]);assert.notEqual(modified,p.calldata);
 const desired={method:'eth_call',params:[{to:a.attempt.to,data:p.calldata}]};expectReject(()=>assertObservation(raw({...desired,params:[{to:a.attempt.to,data:modified}]},'0x',26),desired,'0x',26));
});
test('exact mandatory and late-index errors have independently literal selectors/lengths',()=>{
 const scale=e.arms.scale7.attempt.errorData,late=e.arms.lateIndex.attempt.errorData;assert.equal((scale.length-2)/2,100);assert.equal(scale.slice(0,10),'0x08c379a0');assert.equal((late.length-2)/2,36);assert.equal(late,'0x12f1a6c4'+ethers.id('market').slice(2));assert.equal(abi.decode(['string'],'0x'+scale.slice(10))[0],'quote: scale must be 6');
});
test('local signed tx independently recovers signer and rejects nonce/data/gas drift',async()=>{
 const w=ethers.HDNodeWallet.fromPhrase('test test test test test test test test test test test junk',undefined,"m/44'/60'/0'/0/1");
 const rawTx=await w.signTransaction({type:0,chainId:31337,nonce:2,to:a.attempt.to,data:a.attempt.data,gasLimit:5000000,gasPrice:1,value:0});
 const wanted={...a.attempt,gas:5000000};verifySigned(rawTx,wanted);for(const mutant of [{...wanted,nonce:1},{...wanted,data:'0x'},{...wanted,gas:3000000}])expectReject(()=>verifySigned(rawTx,mutant));
});
test('runtime adapter rejects wrong link name/placeholder/missing immutable/overlap',()=>{
 const artifact=JSON.parse(fs.readFileSync(`${ART}/Ledger.sol/Ledger.json`)),p=a.runtimePreparation.Ledger,common={artifact,sourceName:'src/Ledger.sol',contractName:'Ledger',libraryAddress:a.deployment[0].address,constructorTypes:['address'],constructorArgs:[a.deployment[1].address],immutableValues:{index:enc(['address'],[a.deployment[1].address]),indexCodehash:a.deployment[1].runtimeCodehash,realmId:a.fixture.realmId}};
 assert.equal(instantiate(common).runtimeCodehash,p.runtimeCodehash);
 const missing={...common,immutableValues:{...common.immutableValues}};delete missing.immutableValues.realmId;expectReject(()=>instantiate(missing));
 const wrong=structuredClone(artifact),span=wrong.bytecode.linkReferences['src/ImportLib.sol'].ImportLib[0];wrong.bytecode.object=wrong.bytecode.object.slice(0,2+span.start*2)+'__$'+'0'.repeat(34)+'$__'+wrong.bytecode.object.slice(2+(span.start+20)*2);expectReject(()=>instantiate({...common,artifact:wrong}));
 const overlap=structuredClone(artifact);const rs=Object.values(overlap.deployedBytecode.immutableReferences);rs[1][0]={...rs[0][0]};expectReject(()=>instantiate({...common,artifact:overlap}));
 const renamed=structuredClone(artifact);renamed.bytecode.linkReferences['src/ImportLib.sol'].Other=renamed.bytecode.linkReferences['src/ImportLib.sol'].ImportLib;delete renamed.bytecode.linkReferences['src/ImportLib.sol'].ImportLib;expectReject(()=>instantiate({...common,artifact:renamed}));
});
test('absent packet never defaults to passing audit',()=>{expectReject(()=>audit([],{schema:'efs-lab-c/rollback-report/1',failure:null},e));});
