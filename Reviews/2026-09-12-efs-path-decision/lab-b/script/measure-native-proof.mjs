/** Finite paid local native proof journey. No owner UI, public chain, installs,
 * traces, cap overrides, early-day dependency, or arbitrary-root checkpoint. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {createEnvironment,loadEthers} from './compact-environment.mjs';
import {exportNative} from './native-proof-export.mjs';
import {verifyNativePacket,consumeNativeClaim,anchorHash,PROFILE,WITNESS} from '../browser/native-proof.mjs';
import {counterfeitRows} from './native-proof-fixtures.mjs';
const out=process.argv[2];
assert(/^core-closeout-native-20260916\/(?:attempt|final)-[1-9][0-9]*$/.test(out??''),'explicit fresh finite output');
assert(!(await lstat(out).then(()=>true,e=>{if(e.code==='ENOENT')return false;throw e;})),'EVIDENCE_OUTPUT_EXISTS');
await mkdir(out,{recursive:true});
const e=await loadEthers(),coder=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
const hash=(t,v)=>e.keccak256(coder.encode(t,v)),sha=b=>createHash('sha256').update(b).digest('hex');
const report={base:'a3ec1f011630ae901c6fd80d5c895be07cc7632a',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  limits:{runtime:24576,initcode:49152,ordinaryGas:15000000,hardGas:16777216,blockGas:15000000},artifacts:{},exports:[],roots:[],negative:[],offline:[]};
const targets=[['Ledger','Ledger'],['PublicationSupport','PublicationSupport'],['ContractSignatureEvidenceStore','ContractSignatureEvidenceStore'],
  ['NativePublicationProof','NativePublicationProof'],['RecentStateRootCheckpoint','RecentStateRootCheckpoint'],['NativeClaimArchive','NativeClaimArchive'],
  ['NativeClaimApplication','NativeClaimApplication'],['NativeClaimApplication','NativeRetainedConsumer']];
for(const [file,name] of targets){
  const bytes=await readFile(join(process.env.FOUNDRY_OUT,`${file}.sol`,`${name}.json`)),a=JSON.parse(bytes),m=typeof a.metadata==='string'?JSON.parse(a.metadata):a.metadata;
  assert.equal(m.compiler.version,'0.8.30+commit.73712a01');assert.equal(m.settings.optimizer.runs,200);assert(m.settings.viaIR);assert.equal(m.settings.evmVersion,'cancun');
  for(const [path,pin] of Object.entries(m.sources))assert.equal(e.keccak256(await readFile(path)),pin.keccak256,`artifact/source ${path}`);
  report.artifacts[name]={sha256:sha(bytes),runtime:(a.deployedBytecode.object.length-2)/2,creation:(a.bytecode.object.length-2)/2,metadata:m};
  await writeFile(join(out,`artifact-${name}.json.gz`),gzipSync(bytes));
}
const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'direct',blockGasLimit:15000000});
report.chain={port:env.port,pid:env.anvilPid,history:env.historyPolicy};
const blank={kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z};
const empty={principalIds:[],positions:[],expectedHeads:[]};
let source;
try{
  const core=env.contracts.ledger.address;
  assert.equal((await env.call('index','generation'))[0],0n,'default zero generation is outside positive profile');
  await env.transact('index','bumpGeneration',[],'setup/positive-index-generation');
  assert.equal((await env.call('index','generation'))[0],1n);
  const app=await env.deploy('nativeApp','NativeClaimApplication.sol','NativeClaimApplication',[core]);
  const shape=e.id('native-proof/retained-bytes/1');await env.transact('registry','register',[shape,e.ZeroAddress,[]]);
  const type=(await env.call('registry','typeIdOf',[shape,e.ZeroAddress,[]]))[0];
  const genesis=await env.rpc('eth_getBlockByNumber',['0x0',false]),family=env.manifest.executionFamily.implementations[0];
  const deployment=env.transactions.find(x=>x.transactionHash===env.contracts.ledger.transactionHash);
  const helperIdentity=hash(['address','bytes32','address','bytes32'],[family.publicationSupport.address,family.publicationSupport.codeHash,family.signatureStore.address,family.signatureStore.codeHash]);
  source={chainId:env.manifest.chainId,instanceId:genesis.hash,ledger:core,codeHash:env.contracts.ledger.codeHash,realmId:env.manifest.executionFamily.realmId,
    deploymentId:hash(['bytes32','bytes32','bytes32','bytes32'],[deployment.transactionHash,deployment.blockHash,e.keccak256(e.Transaction.from(deployment.rawTransaction).data),helperIdentity]),helperIdentity};
  report.source=source;report.deploymentAnchor={kind:'TRUSTED_DIRECT_DEPLOYMENT',...source};report.deployment={transaction:deployment,family,genesis};
  const cp=await env.deploy('checkpoint','RecentStateRootCheckpoint.sol','RecentStateRootCheckpoint');
  const verifier=await env.deploy('nativeVerifier','NativePublicationProof.sol','NativePublicationProof',[cp,source]);
  const archive=await env.deploy('nativeArchive','NativeClaimArchive.sol','NativeClaimArchive',[verifier]);
  await env.deploy('nativeConsumer','NativeClaimApplication.sol','NativeRetainedConsumer',[archive,env.contracts.nativeArchive.codeHash,verifier,anchorHash(e,source)]);
  assert.equal((await env.call('nativeVerifier','anchorHash'))[0],anchorHash(e,source));
  async function run(label,actions,bodies,reads=empty,{fail=false,appFail=false,who='deployer'}={}){
    const before=plain(await env.call('ledger','counts')),nonce=(await env.call('ledger','nonces',[app]))[0],writes=(await env.call('nativeApp','writes'))[0];
    const data=new e.Interface(env.contracts.nativeApp.abi).encodeFunctionData('run',[actions,bodies,reads,appFail]);
    const row=await env.observe(await env.enqueue(label,{to:app,data},who));assert.equal(row.status,fail?'REVERTED':'SUCCESS');
    if(fail){assert.deepEqual(plain(await env.call('ledger','counts')),before);assert.equal((await env.call('ledger','nonces',[app]))[0],nonce);assert.equal((await env.call('nativeApp','writes'))[0],writes);
      assert.equal((await env.call('ledger','publicationContext',[BigInt(before[3])+1n]))[0].principalId,Z);assert.equal((await env.call('ledger','evidence',[BigInt(before[3])+1n]))[1],0n);return;}
    return {publication:String((await env.call('ledger','counts'))[3]),first:String(BigInt(before[0])+1n),block:row.blockNumber,transactionHash:row.transactionHash};
  }
  const publish=body=>({...blank,kind:1,typeId:type,bodyHashOrRecordId:e.keccak256(body)});
  const body=e.hexlify(e.toUtf8Bytes('retained native claim after withdrawal and source shutdown'));
  const first=await run('source/empty-readset',[publish(body)],[body]);report.first=first;
  async function retain(label,item){
    const packet=item.packet,v=verifyNativePacket(e,packet),w=packet.witness;
    await env.transact('checkpoint','checkpoint',[packet.header],`${label}/checkpoint`,'bob');
    const roots=await env.call('checkpoint','roots',[w.checkpoint]);assert.equal(roots[0],v.blockHash);assert.equal(roots[1],v.stateRoot);
    const rootAnchor={kind:'LOCAL_CHECKPOINT',chainId:source.chainId,instanceId:source.instanceId,number:w.checkpoint,blockHash:roots[0],stateRoot:roots[1],checkpoint:cp,checkpointCodeHash:env.contracts.checkpoint.codeHash};
    const anchors={rootAnchor,sourceAnchor:report.deploymentAnchor};
    const onchain=(await env.call('nativeVerifier','verify',[w]))[0];
    assert.equal(onchain.claimId,v.claimId);assert.equal(onchain.witnessId,v.witnessId);assert.equal(onchain.occurrences,BigInt(v.observations.occurrences));
    await env.transact('nativeConsumer','verifyOnly',[verifier,w],`${label}/verification-only`,'bob');
    await env.transact('nativeArchive','retain',[w],`${label}/retention`,'bob');
    const receipt=(await env.call('nativeArchive','claim',[v.witnessId]))[0];assert.equal(receipt.importer,env.wallets.bob.address);assert.equal(receipt.body,w.body);assert.equal(receipt.claimId,v.claimId);
    await env.transact('nativeConsumer','consume',[archive,v.witnessId],`${label}/onchain-consumer`,'alice');
    assert.equal((await env.call('nativeConsumer','observed'))[0],e.keccak256(w.body));
    report.exports.push({label,...item,verification:plain(verifyNativePacket(e,packet,anchors)),anchors,retained:plain(receipt)});report.roots.push(rootAnchor);
    await writeFile(join(out,'progress.json.gz'),gzipSync(JSON.stringify(plain(report),null,2)));
    console.log(JSON.stringify({label,...item.diagnostics,claimId:v.claimId,occurrences:String(v.observations.occurrences),withdrawn:v.observations.withdrawn}));
    return v;
  }
  const early=await retain('early',await exportNative({ethers:e,rpc:env.rpc,source,ledgerAbi:env.contracts.ledger.abi,publication:first.publication}));
  if(process.env.NATIVE_COST_DIAGNOSTIC==='1'){
    report.diagnosticOnly=true;await env.close();report.closed=true;report.transactions=env.transactions;report.contracts=env.contracts;
    await writeFile(join(out,'cost-diagnostic.json.gz'),gzipSync(JSON.stringify(plain(report),null,2)));
    console.log(JSON.stringify({costs:env.transactions.filter(x=>x.label.startsWith('early/')).map(x=>({label:x.label,gas:x.gasUsed}))}));
    process.exitCode=0;
  }else{
  const principal=(await env.call('ledger','principalOf',[app]))[0],position=e.id('native-proof/read-coordinate');
  const reads={principalIds:[principal],positions:[position],expectedHeads:[(await env.call('ledger','headSnapshot',[principal,position]))[0]]};
  const nonemptyBody='0x112233445566778899';
  const nonempty=await run('source/nonempty-readset',[publish(nonemptyBody)],[nonemptyBody],reads);
  await retain('nonempty',await exportNative({ethers:e,rpc:env.rpc,source,ledgerAbi:env.contracts.ledger.abi,publication:nonempty.publication}));
  const lateOnly=await run('source/late-only-no-early-packet',[publish('0xf00df00d')],['0xf00df00d'],reads);report.lateOnly=lateOnly;
  const reused=await run('source/reuse',[{...blank,kind:2,typeId:type,bodyHashOrRecordId:early.recordId}],['0x']);
  await run('source/withdraw-every-occurrence',[{...blank,kind:6,target:e.toBeHex(BigInt(first.first),32)},{...blank,kind:6,target:e.toBeHex(BigInt(reused.first),32)}],['0x','0x']);
  const zero=await retain('zero-occurrences',await exportNative({ethers:e,rpc:env.rpc,source,ledgerAbi:env.contracts.ledger.abi,publication:first.publication}));
  assert.equal(zero.claimId,early.claimId);assert.equal(zero.observations.occurrences,0n);assert(zero.observations.withdrawn);
  await run('source/reuse-again',[{...blank,kind:2,typeId:type,bodyHashOrRecordId:early.recordId}],['0x']);
  // Preserve exact historical execution tuple through a real index replacement.
  const replacement=await env.deploy('replacementIndex','IndexModule.sol','IndexModule',[core]);
  const pubs=(await env.call('ledger','counts'))[3];for(let p=0n;p<pubs;p++)await env.transact('replacementIndex','replayNextPublication',[],`index/replay/${p+1n}`);
  await env.transact('ledger','setIndexModule',[replacement],'source/index-replacement');
  const policy=await env.deploy('laterPolicy','LabAcceptors.sol','MinBodyAcceptor',[100]);
  await env.transact('registry','activate',[type,policy],'source/policy-change');
  await run('source/rule-refusal',[publish('0xab')],['0xab'],empty,{fail:true});
  await env.transact('registry','activate',[type,e.ZeroAddress],'source/policy-reset');
  const badFinal=[{...blank,kind:5,salt:e.id('native-proof/rolled-prefix')},{...blank,kind:3,purpose:e.id('efs2/purpose/folder/1'),subject:e.id('folder'),role:e.id('missing-name'),target:e.id('missing-target')}];
  await run('source/prefix-final-rollback',badFinal,['0x','0x'],empty,{fail:true});
  await run('source/app-rollback',[publish('0xbb')],['0xbb'],empty,{fail:true,appFail:true});
  const failingIndex=await env.deploy('failingIndex','LabHarness.sol','FailingIndexModule');
  await env.transact('ledger','setIndexModule',[failingIndex],'source/final-index-failure-setup');
  await run('source/final-index-rollback',[publish('0xcc')],['0xcc'],empty,{fail:true});
  await env.transact('ledger','setIndexModule',[replacement],'source/restore-selected-index');
  await env.transact('nativeApp','rotate',[env.wallets.alice.address],'source/controller-change');
  // Advance both BLOCKHASH acquisition and bounded historical-state windows.
  await env.rpc('anvil_mine',['0x12c']);
  const now=BigInt(await env.rpc('eth_blockNumber',[]));assert(now-BigInt(lateOnly.block)>256n);
  try{await env.rpc('eth_getProof',[core,[e.toBeHex(1,32)],e.toQuantity(BigInt(lateOnly.block))]);throw Error('OLD_STATE_STILL_AVAILABLE');}
  catch(error){if(error.message==='OLD_STATE_STILL_AVAILABLE')throw error;report.oldStateUnavailable={block:lateOnly.block,error:error.rpcError??String(error)};}
  const late=await retain('late-after-changes',await exportNative({ethers:e,rpc:env.rpc,source,ledgerAbi:env.contracts.ledger.abi,publication:first.publication}));
  assert.equal(late.claimId,early.claimId);assert.notEqual(late.witnessId,early.witnessId);assert.equal(late.observations.occurrences,1n);assert(late.observations.revision>early.observations.revision);
  // Separate process with only fresh-C RPC and source/P; no B packet/checkpoint.
  const input=join(out,'late-only-input.json');await writeFile(input,JSON.stringify({rpcUrl:env.rpcUrl,source,ledgerAbi:env.contracts.ledger.abi,publication:lateOnly.publication}));
  const lateResult=JSON.parse(execFileSync(process.execPath,['script/native-late-only-export.mjs',input],{env:process.env,encoding:'utf8',maxBuffer:2*1024*1024,timeout:30000}));
  await retain('late-only-fresh-process',lateResult);
  // Identical old checkpoint retry succeeds after its acquisition window.
  await env.transact('checkpoint','checkpoint',[report.exports[0].packet.header],'early/checkpoint-retry-after-256');
  // Actual malformed packet refusals on the deployed verifier; no packet flag,
  // supplied convenient RPC value, or mixed root can bypass proof validation.
  const template=report.exports[0].packet;
  const negatives=[['missing-key',w=>w.slots.pop()],['duplicate-key',w=>w.slots[1]=w.slots[0]],['trailing-node',w=>w.slots[0].nodes.push(w.slots[0].nodes[0])],
    ['missing-node',w=>w.slots[0].nodes.pop()],['tampered-node',w=>w.slots[0].nodes[0]='0x01'],['wrong-hash-key',w=>w.slots[0].key=e.toBeHex(17,32)],
    ['body',w=>w.body='0x00'],['read-set',w=>w.reads=report.exports[1].packet.witness.reads],['mixed-root',w=>w.checkpoint=report.exports.at(-1).packet.witness.checkpoint],
    ['unsupported-era',w=>w.checkpoint=String(1n<<40n)]];
  for(const [label,change] of negatives){const w=structuredClone(template.witness);change(w);await assert.rejects(env.call('nativeVerifier','verify',[w]));report.negative.push({label,result:'REFUSED_ONCHAIN_CALL'});}
  const fakeArchive=await env.deploy('fakeArchive','NativeClaimApplication.sol','NativeFakeArchive');
  await assert.rejects(env.call('nativeConsumer','consume',[fakeArchive,early.witnessId]));report.negative.push({label:'fake-same-ABI-archive',result:'ARCHIVE_PIN_REFUSAL'});
  // Same exact Ledger runtime, fraudulent constructor/preloaded history. No
  // selected direct-deployment anchor is granted to this deployment.
  const runtime=await env.rpc('eth_getCode',[core,'latest']);
  const predicted=e.getCreateAddress({from:env.wallets.deployer.address,nonce:Number(BigInt(await env.rpc('eth_getTransactionCount',[env.wallets.deployer.address,'pending'])))});
  const fakeSource={...source,ledger:predicted};const forged=counterfeitRows(e,report.exports[0],fakeSource);
  const ca=JSON.parse(await readFile(join(process.env.FOUNDRY_OUT,'NativeCounterfeit.sol','NativeCounterfeitConstructor.json')));
  const init=ca.bytecode.object+new e.Interface(ca.abi).encodeDeploy([runtime,forged.keys,forged.values]).slice(2);assert(e.getBytes(init).length<=49152);
  const fakeTx=await env.send('negative/counterfeit-preloaded-constructor',{data:init});
  const fakeReceipt=await env.rpc('eth_getTransactionReceipt',[fakeTx]);assert.equal(fakeReceipt.contractAddress.toLowerCase(),predicted.toLowerCase());
  assert.equal(e.keccak256(await env.rpc('eth_getCode',[predicted,'latest'])),source.codeHash);
  const counterfeit=await exportNative({ethers:e,rpc:env.rpc,source:fakeSource,ledgerAbi:env.contracts.ledger.abi,publication:first.publication});
  const cv=verifyNativePacket(e,counterfeit.packet);assert.equal(cv.sourceExecution,'UNVERIFIED');assert.equal(counterfeit.packet.witness.reads,template.witness.reads);
  await env.transact('checkpoint','checkpoint',[counterfeit.packet.header],'negative/counterfeit-checkpoint');
  const fakeRoot={...report.roots[0],number:counterfeit.packet.witness.checkpoint,blockHash:cv.blockHash,stateRoot:cv.stateRoot};
  assert.throws(()=>verifyNativePacket(e,counterfeit.packet,{rootAnchor:fakeRoot,sourceAnchor:report.deploymentAnchor}),/SOURCE_ANCHOR/);
  await assert.rejects(env.call('nativeVerifier','verify',[counterfeit.packet.witness]));
  report.counterfeit={...counterfeit,transaction:fakeTx,initcodeBytes:e.getBytes(init).length,sameRuntime:true,legacyReadSetSnapshot:true,trust:'REFUSED_SOURCE_EXECUTION_ANCHOR'};
  const writer=await env.deploy('maliciousWriter','NativeCounterfeit.sol','NativeMaliciousWriter');
  const proxy=await env.deploy('maliciousProxy','NativeCounterfeit.sol','NativeRestorableProxy',[writer]);
  const proxySource={...source,ledger:proxy,codeHash:env.contracts.maliciousProxy.codeHash};
  const proxyRows=counterfeitRows(e,report.exports[0],proxySource,{implementation:core,implementationCodeHash:source.codeHash});
  const writerApi=new e.Interface(env.contracts.maliciousWriter.abi);
  await env.send('negative/proxy-fabricate-history',{to:proxy,data:writerApi.encodeFunctionData('preload',[proxyRows.keys,proxyRows.values])});
  await env.transact('maliciousProxy','restore',[core],'negative/proxy-restore-genuine-implementation');
  try{await exportNative({ethers:e,rpc:env.rpc,source:proxySource,ledgerAbi:env.contracts.ledger.abi,publication:first.publication});assert.fail('proxy was trusted');}
  catch(error){assert.match(error.message,/DIRECT_PROFILE/);report.maliciousProxy={packet:error.packet,restoredImplementation:core,implementationCodeHash:source.codeHash,refusal:error.message};}
  // One fixed joint profile-ceiling probe, not a search for a winning budget.
  await env.transact('replacementIndex','bumpGeneration',[],'joint/positive-generation');
  const maxReads={principalIds:Array.from({length:64},(_,i)=>e.toBeHex(i+1,32)),positions:Array.from({length:4},(_,i)=>e.id(`native-joint/${i}`)),expectedHeads:[]};
  const absent=hash(['bytes32','uint8','uint32','uint64','bytes32'],[e.id('efs.lab.head-snapshot/2'),0,0,0,Z]);maxReads.expectedHeads=Array(256).fill(absent);
  const maxBody='0x'+'ab'.repeat(8192),maxSource=await run('joint/source-8192-body-10592-reads',[publish(maxBody)],[maxBody],maxReads,{who:'alice'});
  const maxPacket=await exportNative({ethers:e,rpc:env.rpc,source,ledgerAbi:env.contracts.ledger.abi,publication:maxSource.publication});
  await env.transact('checkpoint','checkpoint',[maxPacket.packet.header],'joint/checkpoint');
  const paid=async(name,fn,args,label)=>env.observe(await env.enqueue(label,{to:env.contracts[name].address,data:new e.Interface(env.contracts[name].abi).encodeFunctionData(fn,args)},'bob'));
  const maxVerify=await paid('nativeConsumer','verifyOnly',[verifier,maxPacket.packet.witness],'joint/verification-only');
  const maxRetain=await paid('nativeArchive','retain',[maxPacket.packet.witness],'joint/retention');
  report.joint={...maxPacket,source:maxSource,verification:maxVerify,retention:maxRetain,cap:15000000};
  report.rpc=plain(env.metrics);report.transactions=env.transactions;report.contracts=env.contracts;
  }
}catch(error){report.failure=String(error.stack??error);report.failedPacket=error.packet;report.failedRpcProof=error.rpcProof;throw error;}
finally{
  report.transactions=env.transactions;report.contracts=env.contracts;await env.close();report.closed=true;
  await writeFile(join(out,'progress.json.gz'),gzipSync(JSON.stringify(plain(report),null,2)));
}
// RPC is stopped before independent verification and the concrete offline consumer.
await assert.rejects(fetch(env.rpcUrl,{signal:AbortSignal.timeout(1000)}));report.rpcStopped=true;
for(const item of report.exports){
  const started=performance.now(),v=verifyNativePacket(e,item.packet,item.anchors),consumed=consumeNativeClaim(e,item.packet,item.anchors);
  assert.equal(consumed.bodyHash,e.keccak256(item.packet.witness.body));assert.equal(v.authority,'NONE');
  assert.equal(verifyNativePacket(e,item.packet).rootAuthentication,'UNVERIFIED');
  const trusted=verifyNativePacket(e,item.packet,{...item.anchors,rootAnchor:{...item.anchors.rootAnchor,kind:'TRUSTED_FOREIGN_ROOT'}});assert.equal(trusted.rootAuthentication,'TRUSTED');assert.equal(trusted.foreignConsensus,'NOT_PROVEN');
  report.offline.push({label:item.label,elapsedMs:performance.now()-started,verification:plain(v),consumer:consumed});
}
await writeFile(join(out,'paid.json.gz'),gzipSync(JSON.stringify(plain(report),null,2)));
console.log(JSON.stringify({sourceCommit:report.sourceCommit,exports:report.exports.length,offline:report.offline.length,transactions:report.transactions.map(t=>({label:t.label,status:t.status,gas:t.gasUsed,calldata:t.calldataBytes}))}));
