/** Owned local feasibility samples. Full receipts/raw signed transactions remain
 * in the environment's append-only sidecar. No trace or cap increase. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createEnvironment} from './compact-environment.mjs';
import {archiveProfile,ACTION,INTENT,READ_SET,EXECUTION,ARCHIVE_ABI,encodeGuardedRetention} from '../browser/guarded-archive.mjs';
const cap=16_777_216n,env=await createEnvironment({protocol:'compact-guarded-v2',evidenceMode:'append',benchmarkHistory:true});
try{
  const e=env.ethers,coder=e.AbiCoder.defaultAbiCoder(),hash=(t,v)=>e.keccak256(coder.encode(t,v)),Z=e.ZeroHash;
  const profile=archiveProfile(e),author=env.wallets.alice,consumer=await env.deploy('paid','ArchiveReadConsumer.sol','ArchiveReadConsumer');
  const paid=new e.Interface(env.contracts.paid.abi),archiveAbi=new e.Interface(ARCHIVE_ABI),rows=[];
  const execution={origin:e.id('signed-unadmitted-origin'),revision:'7',shellCodeHash:e.id('shell'),implementation:author.address,
    implementationCodeHash:e.id('historical-implementation'),registryAddress:env.contracts.registry.address,registryCodeHash:env.contracts.registry.codeHash,
    indexAddress:env.contracts.index.address,indexCodeHash:env.contracts.index.codeHash,indexGeneration:'1'};
  const signed=(n,max,bodyMode)=>{
    const readSet={principalIds:max?Array.from({length:64},(_,i)=>e.toBeHex(i+1,32)):[],positions:max?Array.from({length:4},(_,i)=>e.toBeHex(i+100,32)):[],expectedHeads:max?Array.from({length:256},(_,i)=>e.id(`head-${i}`)):[]};
    const bodies=Array.from({length:n},(_,leaf)=>({leaf,present:bodyMode,body:leaf?e.toBeHex(leaf,1):'0x'+'f1'.repeat(n===64?8129:8192)}));
    const actions=bodies.map(b=>({kind:1,typeId:e.id('cost-only-signed-Type'),bodyHashOrRecordId:e.keccak256(b.body),purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z}));
    const intent={realmId:e.id('cost-only-signed-Realm'),realmOrigin:execution.origin,executionSet:hash(['bytes32','bytes32','bytes32','bytes32',EXECUTION],
      [e.id('efs.lab.execution-set/2'),profile.layoutId,profile.legacyDomain,profile.guardedDomain,execution]),author:author.address,nonce:'0',deadline:'1',
      acceptanceProfile:e.id('signed-not-current-policy'),indexObligations:e.id('signed-not-current-index'),readSetHash:hash(['bytes32',READ_SET],[e.id('efs.lab.read-set/2:ordered-first-binding'),readSet])};
    const actionsHash=hash([ACTION+'[]'],[actions]),typeHash=e.id('IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)');
    const claimId=e.keccak256(e.concat(['0x1901',profile.guardedDomain,hash(['bytes32',INTENT,'bytes32'],[typeHash,intent,actionsHash])]));
    return {intent,execution,actions,readSetBytes:coder.encode([READ_SET],[readSet]),signature:author.signingKey.sign(claimId).serialized,claimId,bodies};
  };
  const tx=async(label,to,data)=>env.observe(await env.enqueue(label,{to,data,gasLimit:cap},'bob'));
  for(const n of [1,64])for(const max of [false,true]){
    const key=`a${n}-r${max?'64x4':'empty'}`,address=await env.deploy('archive-'+key,'SignedClaimArchive.sol','SignedClaimArchiveCodeBlob');
    const x=signed(n,max,false),data=encodeGuardedRetention(e,x),first=await tx(key+'/first-no-bodies',address,data);
    assert.equal(first.status,'SUCCESS');
    const carriers=[];
    for(const [nonce,bytes] of [[1,coder.encode([ACTION+'[]'],[x.actions])],[2,x.readSetBytes]]){
      const blob=e.getCreateAddress({from:address,nonce}),runtime=await env.rpc('eth_getCode',[blob,{blockHash:first.blockHash,requireCanonical:true}]);
      assert.equal(runtime,e.concat(['0x00',bytes]),'exact separate STOP-prefixed carrier');assert(e.getBytes(runtime).length<=24576);
      carriers.push({address:blob,runtimeBytes:e.getBytes(runtime).length,codeHash:e.keccak256(runtime)});
    }
    const repeat=await tx(key+'/repeat-no-bodies',address,data);assert.equal(repeat.status,'SUCCESS');
    for(const leaf of [0,n-1]){const result=await tx(key+'/paid-action-'+leaf,consumer,paid.encodeFunctionData('readAction',[address,x.claimId,leaf]));assert.equal(result.status,'SUCCESS');}
    const preimages=await tx(key+'/paid-preimages',consumer,paid.encodeFunctionData('readPreimages',[address,x.intent.readSetHash,x.intent.executionSet]));assert.equal(preimages.status,'SUCCESS');
    const complete=await tx(key+'/complete-8192',address,archiveAbi.encodeFunctionData('attachBodies',[x.claimId,x.bodies.map(({leaf,body})=>({leaf,body}))]));assert.equal(complete.status,'SUCCESS');
    const covered=await env.rpc('eth_call',[{to:address,data:archiveAbi.encodeFunctionData('guardedClaim',[x.claimId])},'latest']);
    assert.equal(archiveAbi.decodeFunctionResult('guardedClaim',covered).bodyCoverage,(1n<<BigInt(n))-1n);
    rows.push({key,first:first.gasUsed,repeat:repeat.gasUsed,complete:complete.gasUsed,preimages:preimages.gasUsed,readSetBytes:e.getBytes(x.readSetBytes).length,
      firstCalldata:first.calldataBytes,completeCalldata:complete.calldataBytes,carriers});
  }
  // Exact ABI maximum with maximal per-body padding, on a fresh archive. If the
  // signed cap cannot contain it, retain no bodies first and complete separately.
  const address=await env.deploy('archive-max','SignedClaimArchive.sol','SignedClaimArchiveCodeBlob'),x=signed(64,true,true),data=encodeGuardedRetention(e,x);
  assert.equal(e.getBytes(data).length,48292);
  const finalAbi=new e.Interface(env.contracts['archive-max'].abi),bodyInputs=x.bodies.map(({leaf,body})=>({leaf,body}));
  const finalArgs=[x.intent,x.actions,coder.decode([READ_SET],x.readSetBytes)[0],x.execution,x.signature,bodyInputs];
  assert.equal(finalAbi.encodeFunctionData('retainGuardedSignedClaim',finalArgs),data,'independent final artifact ABI encoding');
  bodyInputs[0].body+='01';
  await assert.rejects(env.rpc('eth_call',[{to:address,data:finalAbi.encodeFunctionData('retainGuardedSignedClaim',finalArgs)},'latest']),
    error=>error.rpcError?.data?.startsWith(finalAbi.getError('E_BOUNDS').selector),'one-byte-over predeployment refusal');
  bodyInputs[0].body=bodyInputs[0].body.slice(0,-2);
  const full=await tx('max/full-48292',address,data);
  const after=archiveAbi.decodeFunctionResult('claimFormat',await env.rpc('eth_call',[{to:address,data:archiveAbi.encodeFunctionData('claimFormat',[x.claimId])},'latest']))[0];
  if(full.status==='REVERTED'){
    assert.equal(after,0n,'failed max call has no partial archive entry');
    const partial={...x,bodies:x.bodies.map(({leaf})=>({leaf,present:false}))};
    assert.equal((await tx('max/staged-initial',address,encodeGuardedRetention(e,partial))).status,'SUCCESS');
    assert.equal((await tx('max/staged-completion',address,archiveAbi.encodeFunctionData('attachBodies',[x.claimId,x.bodies.map(({leaf,body})=>({leaf,body}))]))).status,'SUCCESS');
  }else assert.equal(after,2n);
  const final=archiveAbi.decodeFunctionResult('guardedClaim',await env.rpc('eth_call',[{to:address,data:archiveAbi.encodeFunctionData('guardedClaim',[x.claimId])},'latest']));
  assert.equal(final.bodyCoverage,2n**64n-1n);
  const sourcePins={};for(const path of ['src/SignedClaimArchive.sol','src/Ledger.sol','src/Keys.sol','test/ArchiveReadConsumer.sol','script/measure-guarded-archive.mjs','script/compact-environment.mjs','browser/guarded-archive.mjs']){
    const bytes=await readFile(path);sourcePins[path]={sha256:createHash('sha256').update(bytes).digest('hex'),keccak256:e.keccak256(bytes)};
  }
  const report={base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourcePins,rows,
    environment:{anvilPid:env.anvilPid,port:env.port,chainId:env.manifest.chainId,historyPolicy:env.historyPolicy},fullMaximum:{status:full.status,gas:full.gasUsed,calldata:full.calldataBytes},
    limits:{signedGasLimit:String(cap),blockGasLimit:'30000000',runtime:24576,initcode:49152,bodyBytesPerCall:8192,readSetBytes:10592},
    scope:'Claim evidence only; no Type/rule/semantic sidecar storage or source-state proof. All costs include carrier deployment and ordinary runtime checks.',transactions:env.transactions};
  await env.writeReport('guarded-archive-cost',report);console.log(JSON.stringify({dir:env.dir,rows,fullMaximum:report.fullMaximum}));
}finally{await env.close();}
