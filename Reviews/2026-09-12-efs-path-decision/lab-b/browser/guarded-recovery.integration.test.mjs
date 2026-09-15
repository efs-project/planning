import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createFilesCompactSdk} from './compact-files-sdk.mjs';
import {ACTION,READ_SET,verifyGuardedClaim,encodeGuardedRetention} from './guarded-archive.mjs';

const profile={protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',evidenceMode:'append'};
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
const blank=e=>({kind:0,typeId:e.ZeroHash,bodyHashOrRecordId:e.ZeroHash,purpose:e.ZeroHash,subject:e.ZeroHash,role:e.ZeroHash,target:e.ZeroHash,expectedRevision:0,salt:e.ZeroHash});
const reads={principalIds:[],positions:[],expectedHeads:[]};
async function authorization(env,who,actions,readSet=reads,nonce){
  const {ethers:e}=env,actionsHash=e.keccak256(e.AbiCoder.defaultAbiCoder().encode([ACTION+'[]'],[actions]));
  const block=await env.rpc('eth_getBlockByNumber',['latest',false]);
  const intent={realmId:(await env.call('ledger','realmId'))[0],realmOrigin:(await env.call('ledger','realmOrigin'))[0],
    executionSet:(await env.call('ledger','executionSet'))[0],author:env.wallets[who].address,
    nonce:nonce??String((await env.call('ledger','nonces',[env.wallets[who].address]))[0]),deadline:String(BigInt(block.timestamp)+3600n),
    acceptanceProfile:(await env.call('ledger','acceptanceProfileOf',[actions]))[0],indexObligations:(await env.call('ledger','indexObligations'))[0],
    readSetHash:(await env.call('ledger','readSetHash',[readSet]))[0]};
  const digest=(await env.call('ledger','guardedIntentDigest',[intent,actionsHash]))[0],signature=env.wallets[who].signingKey.sign(digest).serialized;
  const publicationId=(await env.call('ledger','guardedPublicationId',[e.zeroPadValue(intent.author,32),digest]))[0];
  return {intent,actions,readSet,signature,publicationId,digest};
}
async function direct(env,label,auth,bodies,who='deployer'){
  await env.transact('ledger','executeGuardedSigned',[auth.intent,auth.actions,bodies,auth.readSet,auth.signature],label,who);
  return String((await env.call('ledger','publicationOf',[auth.publicationId]))[0]);
}
function processBoundary(mode,input){
  const r=spawnSync(process.execPath,['script/guarded-archive-process.mjs',mode],{input:JSON.stringify(input),encoding:'utf8',maxBuffer:16*1024*1024,
    env:{PATH:process.env.PATH,EFS_ETHERS_PATH:process.env.EFS_ETHERS_PATH},timeout:120000});
  assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);
}
test('cold signed Files prefix reconstructs with fresh EOA authority and native carrier use',{timeout:240000},async t=>{
  const source=await createEnvironment({...profile,chainId:31338});t.after(()=>source.close());
  const {ethers:e}=source,coder=e.AbiCoder.defaultAbiCoder(),hash=(types,values)=>e.keccak256(coder.encode(types,values));
  const authors=[source.wallets.alice.address,source.wallets.bob.address],publications=[];
  assert.notEqual(source.wallets.deployer.address,authors[0]);assert.notEqual(source.wallets.deployer.address,authors[1]);
  assert.equal((await source.call('ledger','nonces',[authors[0]]))[0],0n,'Alice namespace truly unused');
  const salt=e.id('recovery/standalone-root'),seed=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),e.zeroPadValue(authors[0],32),salt]);
  const rootBody=coder.encode(['bytes32'],[seed]),root=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),source.manifest.types.directory,e.keccak256(rootBody)]);
  const rootActions=[{...blank(e),kind:5,salt},{...blank(e),kind:1,typeId:source.manifest.types.directory,bodyHashOrRecordId:e.keccak256(rootBody)}];
  publications.push(await direct(source,'source/standalone-root',await authorization(source,'alice',rootActions),['0x',rootBody]));
  const manifest={...source.manifest,folder:root,folders:[root]};
  const sdk=createFilesCompactSdk({ethers:e,manifest,rpc:source.rpc,journal:await source.createJournal('recovery-source')});
  async function run(env,s,operation,args,who='alice'){
    const p=await s.prepare({operation,author:env.wallets[who].address,authors,...args});
    await s.submit(await s.authorize(p,d=>env.wallets[who].signingKey.sign(d).serialized),tx=>env.send('source/'+operation,tx,who));
    return p;
  }
  async function sourceRun(operation,args,who='alice'){
    const p=await run(source,sdk,operation,args,who);publications.push(String((await source.call('ledger','publicationOf',[p.publicationId]))[0]));return p;
  }
  const file=await sourceRun('create',{name:'recover.txt',salt:e.id('recovery/file'),content:{bytes:e.toUtf8Bytes('original bytes')}});
  const edited=await sourceRun('edit',{file:file.file,content:{bytes:e.toUtf8Bytes('cold recovered bytes')}});
  const fileTag=await sourceRun('addTag',{file:file.file,scope:'file',conceptLabel:'portable-file'});
  const revisionTag=await sourceRun('addTag',{file:file.file,scope:'revision',conceptLabel:'portable-revision'});
  const bob=await sourceRun('create',{name:'shared.txt',salt:e.id('recovery/bob-file'),content:{bytes:e.toUtf8Bytes('Bob fallback')}},'bob');
  await sourceRun('remove',{file:bob.file,name:'shared.txt'});
  await sourceRun('rename',{file:file.file,fromName:'recover.txt',name:'renamed.txt'});
  const nameRecord=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),manifest.types.name,e.keccak256(e.toUtf8Bytes('renamed.txt'))]);
  const reuse=[{...blank(e),kind:2,typeId:manifest.types.name,bodyHashOrRecordId:nameRecord}];
  publications.push(await direct(source,'source/reuse-name',await authorization(source,'alice',reuse),['0x']));
  const bundles=processBoundary('export',{rpcUrl:source.rpcUrl,manifest,publications});
  assert(bundles.every(x=>x.closure.coverage==='COMPLETE'));assert.equal(bundles[0].intent.nonce,'0');
  await assert.rejects(sdk.exportPublication({publication:'1'}),/SOURCE_UNSUPPORTED/,'native bootstrap is not a signed source claim');
  const sourceDir=source.dir,sourceOrigin=manifest.executionFamily.origin;
  await writeFile(join(sourceDir,'recovery-bundles.json'),JSON.stringify(bundles));
  await source.close();await assert.rejects(source.rpc('eth_chainId'),/fetch failed/);
  const offline=processBoundary('verify',bundles);
  assert(offline.every(x=>x.proof==='AUTHOR_SIGNATURE_VERIFIED'&&x.sourceAdmission==='NOT_PROVEN'));
  const missing=structuredClone(bundles[1]);
  const absent=missing.closure.records.find(r=>r.typeId===manifest.types.bytes);
  absent.present=false;delete absent.body;missing.closure.coverage='PARTIAL';
  for(const b of missing.bodies)if(Number(missing.actions[Number(b.leaf)].kind)===1&&missing.actions[Number(b.leaf)].typeId===manifest.types.bytes){b.present=false;delete b.body;}
  const missingResult=await verifyGuardedClaim(e,missing);assert.equal(missingResult.closureCoverage,'PARTIAL');assert(missingResult.missingMeaning.length>0);
  // Isolated, fresh local ordinary-write control: same author, exact original
  // actions/body bytes and order, same reviewed profile, no lineage/helper.
  const control=await createEnvironment(profile);t.after(()=>control.close());
  await control.transact('ledger','publish',[control.manifest.types.name,e.toUtf8Bytes('destination-only')],'control/independent-author');
  for(let j=0;j<bundles.length;j++){
    const x=bundles[j],who=x.intent.author.toLowerCase()===authors[0].toLowerCase()?'alice':'bob';
    const b=x.actions.map((a,k)=>Number(a.kind)===1?x.bodies.find(v=>Number(v.leaf)===k&&v.present).body:'0x');
    await direct(control,'control/original-actions/'+j,await authorization(control,who,x.actions,reads,x.intent.nonce),b);
  }
  await control.close();
  const dest=await createEnvironment(profile);t.after(()=>dest.close());
  assert.notEqual(dest.manifest.chainId,manifest.chainId);assert.notEqual(dest.manifest.executionFamily.origin,sourceOrigin);
  assert.deepEqual(dest.manifest.types,manifest.types,'source and destination share exact ordinary Type IDs');
  // A local native-only publication ensures admission/publication coordinates differ.
  await dest.transact('ledger','publish',[dest.manifest.types.name,e.toUtf8Bytes('destination-only')],'destination/independent-author');
  const archive=await dest.deploy('archive','SignedClaimArchive.sol','SignedClaimArchiveCodeBlob');
  const rule=await dest.deploy('recoveryRule','GuardedRecovery.sol','RecoveryStatementRule');
  const statementShape=e.id('lab/type/recovery-statement/1'),statementType=(await dest.call('registry','typeIdOf',[statementShape,rule,[]]))[0];
  await dest.transact('registry','register',[statementShape,rule,[]]);
  const recovery=await dest.deploy('recovery','GuardedRecovery.sol','GuardedRecovery',[dest.contracts.ledger.address,archive,statementType]);
  const state=async()=>({counts:plain(await dest.call('ledger','counts')),alice:String((await dest.call('ledger','nonces',[authors[0]]))[0]),
    bob:String((await dest.call('ledger','nonces',[authors[1]]))[0]),index:String((await dest.call('index','lastProcessed'))[0])});
  const before=await state();
  for(const x of bundles)await dest.send('archive/retain/'+x.intent.author+'/'+x.intent.nonce,{to:archive,data:encodeGuardedRetention(e,x)},'bob');
  assert.deepEqual(await state(),before,'possession/retention does not authorize destination effects');
  const coldArchive=createFilesCompactSdk({ethers:e,manifest:dest.manifest,rpc:dest.rpc}),recovered=[],coldBundles=[];
  for(const x of bundles){
    const cold=await coldArchive.exportArchivedClaim({address:archive,claimId:x.claimId,closure:x.closure});
    assert.deepEqual(cold.actions,x.actions);assert.equal((await verifyGuardedClaim(e,cold)).closureCoverage,'COMPLETE');coldBundles.push(cold);
  }
  assert(processBoundary('verify',coldBundles).every(x=>x.closureCoverage==='COMPLETE'));
  for(let n=0;n<coldBundles.length;n++){
    const x=coldBundles[n],who=x.intent.author.toLowerCase()===authors[0].toLowerCase()?'alice':'bob';
    const statement=coder.encode(['bytes32','address','address','bytes32','bytes32','bytes32','bytes32'],
      [e.id('efs.lab.recovery-lineage/1'),archive,recovery,x.claimId,x.intent.realmOrigin,x.intent.executionSet,x.actionsHash]);
    const actions=[...x.actions,{...blank(e),kind:1,typeId:statementType,bodyHashOrRecordId:e.keccak256(statement)}];
    const bodies=x.actions.map((a,j)=>Number(a.kind)===1?x.bodies.find(b=>Number(b.leaf)===j&&b.present).body:'0x');bodies.push(statement);
    const auth=await authorization(dest,who,actions,reads,x.intent.nonce);
    const args=[x.claimId,auth.intent,actions,bodies,reads,auth.signature];
    if(n===0){
      // Exact signed publication can be submitted directly first. Linking later
      // is reconciliation, never an assertion that linkage existed atomically.
      await direct(dest,'destination/direct-front-run',auth,bodies,'bob');
      const afterDirect=await state();await dest.transact('recovery','recover',args,'recovery/reconcile-front-run','bob');
      assert.deepEqual(await state(),afterDirect);
    }else await dest.transact('recovery','recover',args,'recovery/publication/'+n,'deployer');
    const [linkedId,pub]=await dest.call('recovery','links',[x.claimId]);assert.equal(linkedId,auth.publicationId);
    assert.notEqual(String(pub),publications[n],'destination publication ordinal differs');assert.equal((await dest.call('ledger','isImported',[pub]))[0],false);
    const evidence=await dest.call('ledger','evidence',[pub]);assert.equal(evidence[0],x.intent.author);assert.equal(evidence[1],2n);
    const sourceFirst=bundles[n].observations.firstAdmission;assert.match(sourceFirst,/^[1-9][0-9]*$/);
    assert.notEqual(String(evidence[4]),sourceFirst,'destination admission coordinate differs');
    const published=await coldArchive.exportPublication({publication:String(pub)});
    assert.deepEqual(published.actions.slice(0,-1),x.actions,'independent cold destination export preserves exact source action prefix');
    assert.equal(published.actions.length,x.actions.length+1);assert.equal(published.intent.author,x.intent.author);
    const snapshot=await state();await dest.transact('recovery','recover',args,'recovery/duplicate/'+n,'bob');assert.deepEqual(await state(),snapshot);
    recovered.push({claimId:x.claimId,sourcePublication:publications[n],destinationPublication:String(pub),publicationId:linkedId,
      sourceNonce:x.intent.nonce,sourceActions:x.actions.length,sourceFirstAdmission:sourceFirst,args:plain(args),destinationEvidence:plain(evidence)});
  }
  const destinationManifest={...dest.manifest,folder:root,folders:[root]};
  const reader=createFilesCompactSdk({ethers:e,manifest:destinationManifest,rpc:dest.rpc});
  const readBefore=structuredClone(dest.metrics),context=await reader.pin();
  const list=await reader.listFolder({context,authors,folder:root});
  assert.equal(list.coverage,'COMPLETE');assert.equal(list.nameCoverage,'COMPLETE');assert.equal(list.value.length,1);assert.equal(list.value[0].file,file.file);
  assert.equal(list.value[0].name.value,'renamed.txt');
  const opposite=await reader.listFolder({context,authors:[authors[1],authors[0]],folder:root});assert.equal(opposite.value.length,2,'Bob-first unmasks own shared entry');
  const current=await reader.readContent({context,authors,file:file.file});assert.equal(current.state,'AVAILABLE_VERIFIED');assert.equal(e.toUtf8String(current.bytes),'cold recovered bytes');
  const old=await reader.readContent({context,authors,file:file.file,record:file.newRevision});assert.equal(e.toUtf8String(old.bytes),'original bytes');
  const ft=await reader.readTag({context,authors,subject:file.file,concept:fileTag.concept,target:file.file});assert.equal(ft.value.present,true);
  const rt=await reader.readTag({context,authors,subject:edited.newRevision,concept:revisionTag.concept,target:file.file});assert.equal(rt.value.present,true);
  const wrongTag=await reader.readTag({context,authors,subject:file.newRevision,concept:revisionTag.concept,target:file.file});assert.equal(wrongTag.value.present,false);
  // Follow exact previous pointers; expected logical history is hand specified.
  const headPosition=hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),e.id('efs2/purpose/head/1'),file.file,e.ZeroHash]);
  const headKey=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),e.zeroPadValue(authors[0],32),headPosition]);
  const h=await dest.call('ledger','head',[headKey]);assert.equal(h[1],2n);assert.equal(h[5],edited.newRevision);
  const previous=await dest.call('ledger','admission',[h[3]]);assert.equal(previous[0],3n);assert.equal(previous[6],file.newRevision);
  const coldRead={calls:dest.metrics.calls-readBefore.calls,requestBytes:dest.metrics.requestBytes-readBefore.requestBytes,responseBytes:dest.metrics.responseBytes-readBefore.responseBytes};
  const owner=createFilesCompactSdk({ethers:e,manifest:destinationManifest,rpc:dest.rpc,journal:await dest.createJournal('recovery-owner')});
  const continued=await run(dest,owner,'edit',{file:file.file,content:{bytes:e.toUtf8Bytes('owner continued after recovery')}});
  const continuedPoint=await reader.readContent({context:await reader.pin(),authors,file:file.file});assert.equal(e.toUtf8String(continuedPoint.bytes),'owner continued after recovery');
  const oldTag=await reader.readTag({context:await reader.pin(),authors,subject:edited.newRevision,concept:revisionTag.concept,target:file.file});assert.equal(oldTag.value.present,true);
  const newTag=await reader.readTag({context:await reader.pin(),authors,subject:continued.newRevision,concept:revisionTag.concept,target:file.file});assert.equal(newTag.value.present,false);
  const continuedFileTag=await reader.readTag({context:await reader.pin(),authors,subject:file.file,concept:fileTag.concept,target:file.file});assert.equal(continuedFileTag.value.present,true);
  const app=await dest.deploy('recoveryApp','RecoveryCarrierApplication.sol','RecoveryCarrierApplication',
    [dest.contracts.ledger.address,dest.contracts.lens.address,dest.contracts.index.address,authors[0],authors[0]]);
  const aliceBefore=(await dest.call('ledger','nonces',[authors[0]]))[0],countBefore=(await dest.call('ledger','counts'))[3];
  const appArgs=[file.file,continued.newRevision,e.sha256(e.toUtf8Bytes('owner continued after recovery')),(await dest.call('ledger','executionSet'))[0]];
  const appData=new e.Interface(dest.contracts.recoveryApp.abi).encodeFunctionData('adopt',appArgs);
  const rejectedNative=await dest.observe(await dest.enqueue('native/wrong-operator',{to:app,data:appData},'bob'));
  assert.equal(rejectedNative.status,'REVERTED');assert.equal((await dest.call('ledger','counts'))[3],countBefore);
  const wrongBytes=[...appArgs];wrongBytes[2]=e.id('not-the-bytes');
  const rejectedBytes=await dest.observe(await dest.enqueue('native/wrong-byte-check',{to:app,data:new e.Interface(dest.contracts.recoveryApp.abi).encodeFunctionData('adopt',wrongBytes)},'alice'));
  assert.equal(rejectedBytes.status,'REVERTED');assert.equal((await dest.call('ledger','counts'))[3],countBefore);
  // The real operator transaction must execute the contract's read/check/write.
  await dest.transact('recoveryApp','adopt',[file.file,continued.newRevision,e.sha256(e.toUtf8Bytes('owner continued after recovery')),(await dest.call('ledger','executionSet'))[0]],'native/carrier-adopt','alice');
  assert.equal((await dest.call('ledger','nonces',[authors[0]]))[0],aliceBefore,'application did not impersonate Alice');
  const appEvidence=await dest.call('ledger','evidence',[countBefore+1n]);assert.equal(appEvidence[0],e.getAddress(app));assert.equal(appEvidence[1],1n);
  const appPoint=await reader.readContent({context:await reader.pin(),authors:[app,authors[0]],file:file.file});assert.equal(e.toUtf8String(appPoint.bytes),'owner continued after recovery');
  assert.notEqual(appPoint.recordId,continued.newRevision);
  const last=recovered.at(-1),afterOrdinary=await state();
  await dest.transact('recovery','recover',last.args,'recovery/linked-duplicate-after-ordinary-write','bob');
  assert.deepEqual(await state(),afterOrdinary,'linked duplicates remain idempotent after ordinary writes resume');
  const result={source:{dir:sourceDir,origin:sourceOrigin,chainId:manifest.chainId,stopped:true},destination:{dir:dest.dir,origin:dest.manifest.executionFamily.origin,chainId:dest.manifest.chainId},
    root,file:file.file,oldRevision:file.newRevision,recoveredRevision:edited.newRevision,continuedRevision:continued.newRevision,appRevision:appPoint.recordId,
    closureBytes:Buffer.byteLength(JSON.stringify(bundles.map(x=>x.closure))),offline,missingResult,before,after:await state(),recovered,coldRead,
    names:plain(list),reverseLens:plain(opposite),sourceTransactions:source.transactions,destinationTransactions:dest.transactions,
    control:{dir:control.dir,transactions:control.transactions,method:'Isolated local control, same original actions/author/body bytes/order and profile; no provenance statement/helper. Later rows include cumulative extra-statement state differences in recovery.'},
    authorizationCount:{sourceClaims:bundles.length,freshDestinationSignatures:recovered.length,ownerContinuation:1,nativeOperatorTransactions:1,wholeMigrationSingleSignature:false},
    limitations:['Source admission and source guard truth NOT_PROVEN','Contiguous source EOA nonce prefix only; no interleaved same-author destination writes',
      'Source native and legacy claims and WITHDRAW unsupported','Inline raw-sha256 carrier bytes only in this run; encrypted/external transport untested',
      'Extra lineage statement is an author assertion; archive + helper + exact destination evidence needed for correspondence','RPC observations, not authenticated state proofs']};
  await writeFile(join(dest.dir,'recovery-destination-manifest.json'),JSON.stringify(destinationManifest));
  await dest.writeReport('guarded-recovery',result);
});
