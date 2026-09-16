/** Finite, paid old-storage/new-code comparison; disposable loopback only.
 * Baseline artifacts must be built from BASE, not a test-only storage mock. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {join} from 'node:path';
import {createEnvironment,loadEthers} from './compact-environment.mjs';
import {createGuardedCompactSdk} from '../browser/compact-sdk-v2.mjs';
import {createGuardedArchiveReader,encodeGuardedRetention,verifyGuardedClaim,READ_SET} from '../browser/guarded-archive.mjs';

const BASE='6869e2680d75521de851eaa67631cc05a1eb35a9';
const baseline=process.env.EFS_READSET_BASELINE_OUT,current=process.env.FOUNDRY_OUT;
assert(baseline&&current,'explicit old and current artifact directories required');
const e=await loadEthers(),coder=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
const hash=(types,values)=>e.keccak256(coder.encode(types,values));
const root=e.id('efs.lab.ledger.read-set-carriers/1');
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
const blank={kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z};
const report={base:BASE,candidateParent:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  limits:{runtime:24576,initcode:49152,normalGas:15000000,hardGas:16777216},controls:[],bundles:[],upgrade:null};
const artifacts={};
async function artifact(dir,file,name){return JSON.parse(await readFile(join(dir,file,`${name}.json`),'utf8'));}
async function pin(dir,label){
  const a=await artifact(dir,'Ledger.sol','Ledger'),metadata=typeof a.metadata==='string'?JSON.parse(a.metadata):a.metadata;
  assert.equal(metadata.compiler.version,'0.8.30+commit.73712a01');assert.equal(metadata.settings.optimizer.runs,200);
  assert.equal(metadata.settings.viaIR,true);assert.equal(metadata.settings.evmVersion,'cancun');
  for(const [path,source] of Object.entries(metadata.sources)){
    const bytes=label==='old'?execFileSync('git',['show',`${BASE}:Reviews/2026-09-12-efs-path-decision/lab-b/${path}`]):await readFile(path);
    assert.equal(e.keccak256(bytes),source.keccak256,`${label} artifact/source ${path}`);
  }
  artifacts[label]={sha256:createHash('sha256').update(JSON.stringify(a)).digest('hex'),compiler:metadata.compiler,
    settings:metadata.settings,sources:metadata.sources,creationBytes:e.getBytes(a.bytecode.object).length,runtimeBytes:e.getBytes(a.deployedBytecode.object).length};
}
await pin(baseline,'old');await pin(current,'new');
const carrierArtifact=await artifact(current,'ReadSetStorage.sol','ReadSetCode');
const carrierApi=new e.Interface(carrierArtifact.abi);
async function deployFrom(env,key,file,name,args=[]){
  const a=await artifact(current,file,name),api=new e.Interface(a.abi),data=a.bytecode.object+api.encodeDeploy(args).slice(2);
  assert(e.getBytes(data).length<=49152);const tx=await env.send(`deploy/${key}`,{data});
  const receipt=await env.rpc('eth_getTransactionReceipt',[tx]),address=receipt.contractAddress;
  const runtime=await env.rpc('eth_getCode',[address,{blockHash:receipt.blockHash,requireCanonical:true}]);
  assert.equal(e.getBytes(runtime).length,e.getBytes(a.deployedBytecode.object).length);assert(e.getBytes(runtime).length<=24576);
  const expected=e.getBytes(a.deployedBytecode.object),actual=e.getBytes(runtime),patches=new Set();
  for(const refs of Object.values(a.deployedBytecode.immutableReferences??{}))for(const r of refs)for(let j=r.start;j<r.start+r.length;j++)patches.add(j);
  for(let j=0;j<expected.length;j++)if(!patches.has(j))assert.equal(actual[j],expected[j]);
  env.contracts[key]={address,abi:a.abi,codeHash:e.keccak256(runtime),runtimeBytes:actual.length,initcodeBytes:e.getBytes(data).length,constructorArgs:args,transactionHash:tx};
  return address;
}
async function toolsFor(env){
  const address=env.contracts.ledger.address,api=new e.Interface(env.contracts.ledger.abi),author=env.wallets.alice;
  const slot=(key,n)=>hash(['bytes32','bytes32'],[key,n]);
  const storage=(key,n)=>env.call('ledger','extsload',[slot(key,n)]).then(x=>x[0]);
  const nonce=()=>env.rpc('eth_getTransactionCount',[address,'latest']).then(BigInt);
  const reads=async(n,m,tag)=>{
    const principals=Array.from({length:n},(_,i)=>i===0?e.zeroPadValue(author.address,32):e.toBeHex(i,32));
    const coords=Array.from({length:m},(_,j)=>({purpose:e.id('carrier-measure/purpose'),subject:e.id(`carrier-measure/${tag}`),role:e.toBeHex(j,32)}));
    const positions=coords.map(c=>hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),c.purpose,c.subject,c.role]));
    const rs={principalIds:principals,positions,expectedHeads:[]};
    for(const p of positions)for(const id of principals)rs.expectedHeads.push((await env.call('ledger','headSnapshot',[id,p]))[0]);
    return {rs,coords};
  };
  const publish=async(label,rs,actions=[{...blank,kind:5,salt:e.id(`carrier-action/${label}`)}],success=true)=>{
    const intent={realmId:env.manifest.executionFamily.realmId,realmOrigin:(await env.call('ledger','realmOrigin'))[0],
      executionSet:(await env.call('ledger','executionSet'))[0],author:author.address,nonce:(await env.call('ledger','nonces',[author.address]))[0],
      deadline:2000000000n,acceptanceProfile:(await env.call('ledger','acceptanceProfileOf',[actions]))[0],indexObligations:(await env.call('ledger','indexObligations'))[0],
      readSetHash:(await env.call('ledger','readSetHash',[rs]))[0]};
    const digest=(await env.call('ledger','guardedIntentDigest',[intent,e.keccak256(coder.encode([api.getFunction('executeGuardedSigned').inputs[1]],[actions]))]))[0];
    const data=api.encodeFunctionData('executeGuardedSigned',[intent,actions,actions.map(()=> '0x'),rs,author.signingKey.sign(digest).serialized]);
    const beforeNonce=await nonce(),expectedCarrier=e.getCreateAddress({from:address,nonce:beforeNonce});
    const row=await env.observe(await env.enqueue(label,{to:address,data},'bob'));
    assert.equal(row.status,success?'SUCCESS':'REVERTED',label);
    const afterNonce=await nonce(),pointer=await storage(intent.readSetHash,root),legacy=await storage(intent.readSetHash,e.toBeHex(15,32));
    const raw=(await env.call('ledger','readSetBytes',[intent.readSetHash]))[0];
    const carrier=e.getAddress(e.dataSlice(pointer,12)),runtime=carrier===e.ZeroAddress?'0x':await env.rpc('eth_getCode',[carrier,'latest']);
    if(success){assert.equal(raw,coder.encode([READ_SET],[rs]));if(runtime!=='0x')assert.equal(runtime,e.concat(['0x00',raw]));}
    const initcode=runtime==='0x'?null:carrierArtifact.bytecode.object+carrierApi.encodeDeploy([raw]).slice(2);
    const publication=success?String((await env.call('ledger','counts'))[3]):null;
    return {label,gas:row.gasUsed,data,readSetHash:intent.readSetHash,readBytes:e.getBytes(raw).length,legacy,pointer,carrier,
      carrierRuntimeBytes:e.getBytes(runtime).length,carrierCodeHash:e.keccak256(runtime),created:Number(afterNonce-beforeNonce),expectedCarrier,publication,
      carrierInitcodeBytes:initcode?e.getBytes(initcode).length:null,carrierInitcodeHash:initcode?e.keccak256(initcode):null,
      transactionHash:row.transactionHash,executionSet:intent.executionSet};
  };
  return {reads,publish,nonce,storage,api};
}
let historical=[];
for(const arm of ['old','new']){
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',artifactDirectory:arm==='old'?baseline:current,evidenceMode:'append'});
  try{
    const measurementManifest=structuredClone(env.manifest);
    const t=await toolsFor(env),rows=[],paid=await deployFrom(env,'paidRead','ReadSetCarrier.t.sol','ReadSetPaidRead');
    const paidApi=new e.Interface(env.contracts.paidRead.abi),archives=createGuardedArchiveReader({ethers:e,rpc:env.rpc,manifest:env.manifest});
    const selected=[];
    for(const [n,m] of [[0,0],[1,1],[8,4],[64,4]]){
      const tag=`${n}x${m}`,{rs,coords}=await t.reads(n,m,tag);
      const first=await t.publish(`${tag}/first`,rs);assert.equal(first.created,arm==='new'?1:0);selected.push(first.publication);
      const repeat=await t.publish(`${tag}/same-readset`,rs);assert.equal(repeat.created,0);
      const exactNonce=await t.nonce();
      const exact=await env.observe(await env.enqueue(`${tag}/exact-publication-repeat`,{to:env.contracts.ledger.address,data:first.data},'bob'));
      assert.equal(exact.status,'REVERTED');assert.equal(await t.nonce(),exactNonce,'exact repeat CREATE');
      const read=await env.observe(await env.enqueue(`${tag}/paid-full-read`,{to:paid,data:paidApi.encodeFunctionData('read',[env.contracts.ledger.address,first.readSetHash])}));
      assert.equal(read.status,'SUCCESS');assert.equal((await env.call('paidRead','digest'))[0],e.keccak256(coder.encode([READ_SET],[rs])));
      assert.equal((await env.call('paidRead','length'))[0],BigInt(first.readBytes));
      let changed;
      if(n){
        const target=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),e.zeroPadValue(env.wallets.alice.address,32),e.id(`carrier-action/${tag}/first`)]);
        await t.publish(`${tag}/change-head`,rs,[{...blank,kind:3,...coords[0],target}]);
        changed=await t.publish(`${tag}/changed-head-miss`,(await t.reads(n,m,tag)).rs);
        assert.equal(changed.created,arm==='new'?1:0);assert.notEqual(changed.readSetHash,first.readSetHash);
      }
      rows.push({shape:tag,first,repeat,exactRepeat:{gas:exact.gasUsed,status:exact.status,transactionHash:exact.transactionHash},paidRead:{gas:read.gasUsed,transactionHash:read.transactionHash},changed});
    }
    if(arm==='old'){
      // Old saved adapter still works before upgrading a genuinely populated old proxy.
      const sdk=createGuardedCompactSdk({ethers:e,manifest:env.manifest,rpc:env.rpc,journal:await env.createJournal('old-profile')});
      await sdk.prepare({operation:'create',author:env.wallets.alice.address,authors:[env.wallets.alice.address],name:'legacy.txt',salt:e.id('legacy-probe'),document:'old'});
      const oldExecution=(await env.call('ledger','executionSet'))[0],legacyBefore=[],legacyBytes=[];
      for(const row of rows){
        legacyBefore.push(await t.storage(row.first.readSetHash,e.toBeHex(15,32)));
        legacyBytes.push((await env.call('ledger','readSetBytes',[row.first.readSetHash]))[0]);
      }
      const next=await deployFrom(env,'carrierImplementation','Ledger.sol','Ledger',[env.contracts.registry.address,env.manifest.executionFamily.realmId]);
      await env.transact('proxy','upgradeTo',[next],'populated-upgrade');
      env.contracts.ledger.abi=env.contracts.carrierImplementation.abi;
      env.manifest.contracts.ledger.abi=env.contracts.carrierImplementation.abi;
      const profile=await env.call('ledger','readSetStorageProfile'),support=await env.call('ledger','publicationSupportIdentity');
      env.manifest.executionFamily.implementations.push({address:next,codeHash:env.contracts.carrierImplementation.codeHash,
        readSetStorage:{profile:profile[0],namespace:profile[1]},publicationSupport:{address:support[0],codeHash:support[1]}});
      const upgraded=await toolsFor(env),beforeNonce=await upgraded.nonce();
      for(let j=0;j<rows.length;j++){
        const row=rows[j],rs=coder.decode([READ_SET],(await env.call('ledger','readSetBytes',[row.first.readSetHash]))[0])[0];
        assert.equal((await env.call('ledger','readSetBytes',[row.first.readSetHash]))[0],legacyBytes[j],'every old ABI byte preserved');
        // The changed-head fixture means its original guard is stale; old retention
        // is proven by the empty key and raw preservation of every old entry.
        assert.equal(await upgraded.storage(row.first.readSetHash,e.toBeHex(15,32)),legacyBefore[j]);
        assert.equal(await upgraded.storage(row.first.readSetHash,root),Z);
        if(j===0)await upgraded.publish('upgrade/legacy-dedup',rs);
      }
      assert.equal(await upgraded.nonce(),beforeNonce,'legacy dedup deployed a carrier');
      const fresh=await upgraded.publish('upgrade/new-carrier',(await upgraded.reads(8,4,'upgrade')).rs);
      assert.equal(fresh.created,1);assert.equal(fresh.legacy,Z);assert.notEqual(fresh.executionSet,oldExecution);
      historical=await Promise.all([selected[0],selected.at(-1),fresh.publication].map(publication=>archives.exportPublication({publication})));
      const newSdk=createGuardedCompactSdk({ethers:e,manifest:env.manifest,rpc:env.rpc,journal:await env.createJournal('new-profile')});
      await newSdk.prepare({operation:'create',author:env.wallets.alice.address,authors:[env.wallets.alice.address],name:'new.txt',salt:e.id('new-probe'),document:'new'});
      const beforeDowngrade=(await env.call('ledger','readSetBytes',[fresh.readSetHash]))[0];
      await env.transact('proxy','upgradeTo',[env.contracts.implementationV1.address],'trusted-downgrade');
      const downgradeExecution=(await newSdk.pin()).executionSet;
      assert.equal((await env.call('ledger','readSetBytes',[fresh.readSetHash]))[0],'0x','old getter cannot decode future carriers');
      assert.equal(e.getBytes((await env.call('ledger','readSetBytes',[rows[0].first.readSetHash]))[0]).length,224,'legacy bytes survive downgrade');
      await assert.rejects(newSdk.exportPublication({publication:fresh.publication}),/ARCHIVE_READSET_MISSING/);
      await env.transact('proxy','upgradeTo',[next],'restore-carrier-aware');
      const restoredExecution=(await newSdk.pin()).executionSet;
      assert.notEqual(downgradeExecution,fresh.executionSet);assert.notEqual(restoredExecution,downgradeExecution);assert.notEqual(restoredExecution,fresh.executionSet);
      assert.equal((await env.call('ledger','readSetBytes',[fresh.readSetHash]))[0],beforeDowngrade,'restore exact carrier bytes without migration');
      // Real post-CREATE action refusal. Entire publication, contract nonce and
      // counter must revert; the predicted child must have no code afterwards.
      const failReads=(await upgraded.reads(8,4,'rollback')).rs,beforeCounts=plain(await env.call('ledger','counts'));
      const authorNonce=(await env.call('ledger','nonces',[env.wallets.alice.address]))[0];
      const failed=await upgraded.publish('upgrade/rejected',failReads,[{...blank,kind:1,typeId:e.id('unknown-type'),bodyHashOrRecordId:e.keccak256('0x')}],false);
      assert.equal(failed.created,0);assert.equal(failed.pointer,Z);assert.equal(failed.legacy,Z);
      assert.equal(await env.rpc('eth_getCode',[failed.expectedCarrier,'latest']),'0x');
      assert.deepEqual(plain(await env.call('ledger','counts')),beforeCounts);assert.equal((await env.call('ledger','nonces',[env.wallets.alice.address]))[0],authorNonce);
      report.upgrade={oldExecution,newExecution:fresh.executionSet,oldRoot15Headers:legacyBefore,oldABIHashes:legacyBytes.map(e.keccak256),legacyDedupCreated:0,newCarrier:fresh,failed,
        downgrade:{downgradeExecution,restoredExecution,legacyBytes:224,newReadSetBytes:'0x',sdkArchiveExport:'ARCHIVE_READSET_MISSING',meaning:'UNKNOWN_NOT_ABSENT',restoredExactBytes:true},
        sameOldProxy:true,oldAdapterPrepare:true,newAdapterPrepare:true,oldReadbacksPreserved:true,rollbackCountsNonceAndCode:true};
    }else{
      // The source process is already closed. Import exact signed bundles into
      // a different archive, export from it, then later verify fully source-off.
      const archive=await env.deploy('archive','SignedClaimArchive.sol','SignedClaimArchiveCodeBlob');
      for(const bundle of historical){
        await verifyGuardedClaim(e,bundle);
        await env.send('source-off/import/'+bundle.claimId,{to:archive,data:encodeGuardedRetention(e,bundle)});
        const reexport=await archives.exportArchivedClaim({address:archive,claimId:bundle.claimId,closure:bundle.closure});
        assert.equal(reexport.readSetBytes,bundle.readSetBytes);assert.equal(reexport.claimId,bundle.claimId);
        report.bundles.push(reexport);
      }
    }
    const implementationNames=arm==='old'?['implementationV1','implementationV2','carrierImplementation']:['implementationV1','implementationV2'];
    const supports=[];
    for(const name of implementationNames){
      const [address,codeHash]=await env.call(name,'publicationSupportIdentity'),runtime=await env.rpc('eth_getCode',[address,'latest']);
      const supportArtifact=await artifact(arm==='old'&&name!=='carrierImplementation'?baseline:current,'PublicationSupport.sol','PublicationSupport');
      assert.equal(e.keccak256(runtime),codeHash);supports.push({implementation:env.contracts[name].address,address,codeHash,runtimeBytes:e.getBytes(runtime).length,
        initcodeBytes:e.getBytes(supportArtifact.bytecode.object).length,constructorArguments:[],creationPaidInLedgerReceipt:true});
    }
    report.controls.push({arm,rows,environment:{port:env.port,pid:env.anvilPid,history:env.historyPolicy},contracts:env.contracts,measurementManifest,finalManifest:env.manifest,supports,transactions:env.transactions});
  }finally{await env.close();}
}
report.offline=JSON.parse(execFileSync(process.execPath,['script/guarded-archive-process.mjs','verify'],{input:JSON.stringify([...historical,...report.bundles]),encoding:'utf8',maxBuffer:32*1024*1024}));
assert.equal(report.offline.length,6);assert(report.offline.every(x=>x.proof==='AUTHOR_SIGNATURE_VERIFIED'&&x.sourceAdmission==='NOT_PROVEN'));
report.artifacts=artifacts;report.sourcePins={};
for(const path of ['src/Ledger.sol','src/ReadSetStorage.sol','src/PublicationSupport.sol','test/ReadSetCarrier.t.sol','browser/compact-sdk-v2.mjs','browser/guarded-archive.mjs','script/compact-environment.mjs','script/measure-readset-carrier.mjs']){
  const bytes=await readFile(path);report.sourcePins[path]={sha256:createHash('sha256').update(bytes).digest('hex'),keccak256:e.keccak256(bytes)};
}
const output='core-closeout-sdk-20260915/readset-carrier-paid.json.gz';await writeFile(output,gzipSync(JSON.stringify(plain(report),null,2)));
console.log(JSON.stringify({output,rows:report.controls.map(c=>({arm:c.arm,rows:c.rows.map(r=>({shape:r.shape,first:r.first.gas,repeat:r.repeat.gas,changed:r.changed?.gas,paidRead:r.paidRead.gas,bytes:r.first.readBytes}))})),offline:report.offline.length,upgrade:true}));
