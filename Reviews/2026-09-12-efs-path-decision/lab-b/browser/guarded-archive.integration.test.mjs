import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createFilesCompactSdk} from './compact-files-sdk.mjs';
import {verifyGuardedClaim,encodeGuardedRetention,ARCHIVE_ABI} from './guarded-archive.mjs';
import {spawnSync} from 'node:child_process';
import {writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const profile={protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',evidenceMode:'append'};
test('cold guarded export survives source shutdown with distinct domain and no destination authority',{timeout:180000},async t=>{
  const source=await createEnvironment({...profile,chainId:31338});t.after(()=>source.close());
  const {ethers:e,wallets,manifest}=source;
  assert.equal(await source.rpc('eth_chainId'),'0x7a6a','owned source domain differs from default destination');
  const sdk=createFilesCompactSdk({ethers:e,manifest,rpc:source.rpc,journal:await source.createJournal('archive-source')});
  assert.equal(typeof sdk.exportPublication,'function','guarded SDK exposes journal-free source export');
  const authors=Object.values(manifest.authors),publications=[];
  const run=async(operation,args)=>{
    const p=await sdk.prepare({operation,author:wallets.alice.address,authors,...args}),signed=await sdk.authorize(p,d=>wallets.alice.signingKey.sign(d).serialized);
    await sdk.submit(signed,tx=>source.send(operation,tx,'alice'));
    publications.push(String((await source.call('ledger','publicationOf',[p.publicationId]))[0]));return p;
  };
  const directory=await run('createDirectory',{name:'documents',salt:e.id('archive-directory')});
  const file=await run('create',{name:'recover.txt',salt:e.id('archive-file'),content:{bytes:e.toUtf8Bytes('original bytes')},folder:directory.file});
  const edited=await run('edit',{file:file.file,content:{bytes:e.toUtf8Bytes('cold recovered bytes')}});
  await run('addTag',{file:file.file,scope:'revision',conceptLabel:'portable'});
  await run('rename',{file:file.file,fromName:'recover.txt',name:'renamed.txt',folder:directory.file});
  // The exporter is a new process: only live endpoint/profile/publication ordinals,
  // never a journal, expected name map, expected bodies or source transaction input.
  const exportRun=spawnSync(process.execPath,['script/guarded-archive-process.mjs','export'],{
    input:JSON.stringify({rpcUrl:source.rpcUrl,manifest,publications}),encoding:'utf8',maxBuffer:8*1024*1024,
    env:{PATH:process.env.PATH,EFS_ETHERS_PATH:process.env.EFS_ETHERS_PATH},timeout:120000});
  assert.equal(exportRun.status,0,exportRun.stderr);const bundles=JSON.parse(exportRun.stdout);
  assert.equal(bundles.length,publications.length);assert(bundles.every(x=>x.closure.coverage==='COMPLETE'));
  const names=bundles.flatMap(x=>x.closure.records).filter(r=>r.typeId===manifest.types.name).map(r=>e.toUtf8String(r.body));
  assert(names.includes('recover.txt')&&names.includes('renamed.txt'));
  await writeFile(join(source.dir,'guarded-export.json'),JSON.stringify(bundles));
  await source.close();await assert.rejects(source.rpc('eth_chainId'),/fetch failed/);
  const offline=spawnSync(process.execPath,['script/guarded-archive-process.mjs','verify'],{
    input:JSON.stringify(bundles),encoding:'utf8',env:{PATH:process.env.PATH,EFS_ETHERS_PATH:process.env.EFS_ETHERS_PATH},timeout:30000});
  assert.equal(offline.status,0,offline.stderr);assert(JSON.parse(offline.stdout).every(r=>r.proof==='AUTHOR_SIGNATURE_VERIFIED'&&r.sourceAdmission==='NOT_PROVEN'));
  assert(JSON.parse(offline.stdout).some(r=>r.content?.some(c=>c.state==='AVAILABLE_VERIFIED')),'offline content digests checked from copied bytes');
  const dest=await createEnvironment(profile);t.after(()=>dest.close());
  assert.notEqual(dest.manifest.chainId,manifest.chainId);assert.notEqual(dest.manifest.executionFamily.origin,manifest.executionFamily.origin);
  await dest.deploy('archive','SignedClaimArchive.sol','SignedClaimArchiveCodeBlob');
  const abi=new e.Interface(ARCHIVE_ABI),archive=dest.contracts.archive.address;
  const snapshot=async()=>({counts:Array.from(await dest.call('ledger','counts'),String),nonce:String((await dest.call('ledger','nonces',[wallets.alice.address]))[0]),
    sourcePublications:await Promise.all(bundles.map(async x=>String((await dest.call('ledger','publicationOf',[x.publicationId]))[0]))),
    heads:await Promise.all(bundles.flatMap(x=>x.actions.filter(a=>[3,4].includes(Number(a.kind))).map(async a=>{
      const hash=(types,v)=>e.keccak256(e.AbiCoder.defaultAbiCoder().encode(types,v));
      const position=hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),a.purpose,a.subject,a.role]);
      const key=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),e.zeroPadValue(wallets.alice.address,32),position]);
      return Array.from(await dest.call('ledger','head',[key]),String);
    })))});
  const before=await snapshot();
  for(const x of bundles){const partial=structuredClone(x);partial.bodies=partial.bodies.map(({leaf})=>({leaf,present:false}));
    await dest.send('archive/retain',{to:archive,data:encodeGuardedRetention(e,partial)},'bob');
    const bodies=x.bodies.filter(b=>b.present).map(({leaf,body})=>({leaf,body}));
    if(bodies.length)await dest.send('archive/complete',{to:archive,data:abi.encodeFunctionData('attachBodies',[x.claimId,bodies])},'deployer');
  }
  assert.deepEqual(await snapshot(),before,'retention/completion cannot mutate destination Ledger counts, nonce, admission or heads');
  const cold=createFilesCompactSdk({ethers:e,manifest:dest.manifest,rpc:dest.rpc});
  const replay=[];for(const x of bundles){
    const only=await cold.exportArchivedClaim({address:archive,claimId:x.claimId});assert.equal((await verifyGuardedClaim(e,only)).closureCoverage,'PARTIAL');
    const complete=await cold.exportArchivedClaim({address:archive,claimId:x.claimId,closure:x.closure});
    assert.equal((await verifyGuardedClaim(e,complete)).closureCoverage,'COMPLETE');assert.equal(complete.intent.author,x.intent.author);
    assert.deepEqual(complete.actions,x.actions);assert.deepEqual(complete.execution,x.execution);replay.push(complete);
  }
  const secondOffline=spawnSync(process.execPath,['script/guarded-archive-process.mjs','verify'],{input:JSON.stringify(replay),encoding:'utf8',
    env:{PATH:process.env.PATH,EFS_ETHERS_PATH:process.env.EFS_ETHERS_PATH},timeout:30000});assert.equal(secondOffline.status,0,secondOffline.stderr);
  const bytesRecord=bundles.flatMap(x=>x.closure.records).find(r=>r.typeId===manifest.types.bytes);
  assert(bytesRecord,'full typed content closure includes bytes');
  await dest.deploy('reject','LabHarness.sol','MockAcceptor');await dest.transact('reject','set',[1,0]);
  await dest.transact('registry','activate',[bytesRecord.typeId,dest.contracts.reject.address]);
  const publish=new e.Interface(dest.contracts.ledger.abi).encodeFunctionData('publish',[bytesRecord.typeId,bytesRecord.body]);
  const rejected=await dest.observe(await dest.enqueue('destination/policy-rejection',{to:dest.contracts.ledger.address,data:publish},'bob'));
  assert.equal(rejected.status,'REVERTED');assert.deepEqual(await snapshot(),before);
  await dest.transact('registry','activate',[bytesRecord.typeId,e.ZeroAddress]);
  await dest.send('destination/own-authority',{to:dest.contracts.ledger.address,data:publish},'bob');
  const admitted=await dest.call('ledger','evidence',[(await dest.call('ledger','counts'))[3]]);assert.equal(admitted[0],dest.wallets.bob.address);
  assert.equal((await dest.call('index','lastProcessed'))[0],(await dest.call('ledger','counts'))[0]);
  await assert.rejects(cold.exportPublication({publication:String((await dest.call('ledger','counts'))[3])}),/SOURCE_UNSUPPORTED/);
  await dest.writeReport('guarded-archive-portability',{source:{chainId:manifest.chainId,origin:manifest.executionFamily.origin,anvilPid:source.anvilPid,stopped:true,dir:source.dir},
    destination:{chainId:dest.manifest.chainId,origin:dest.manifest.executionFamily.origin,anvilPid:dest.anvilPid},before,afterRetention:before,
    offlineResults:JSON.parse(secondOffline.stdout),sidecarBytes:Buffer.byteLength(JSON.stringify(bundles.map(x=>x.closure))),
    transactions:dest.transactions,claims:bundles.map(x=>({claimId:x.claimId,publicationId:x.publicationId,bodyCoverage:x.bodies.length,closure:x.closure.coverage})),
    authority:'NONE',sourceAdmission:'NOT_PROVEN',native:'UNSUPPORTED_NO_SIGNATURE',file:file.file,selectedRevision:edited.newRevision});
});
