/** Finite paid ERC1271 matrix. Run from lab-b; no public RPC, fork, install,
 * trace opcode stream, relaxed size cap or owner-demo process access. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {createEnvironment,loadEthers} from './compact-environment.mjs';
import {createGuardedArchiveReader} from '../browser/guarded-archive.mjs';
import {createContractSignatureCompanion,verifyContractSignatureBundle,encodeContractSignaturePublication,
  encodeContractSignatureRetention,ARCHIVE_ABI,BUNDLE,STORE_ABI} from '../browser/contract-signature-evidence.mjs';
const out='core-closeout-authority-20260915';
const targets=[['Ledger.sol','Ledger'],['PublicationSupport.sol','PublicationSupport'],['ContractSignatureEvidenceStore.sol','ContractSignatureEvidenceStore'],
  ['ContractSignatureEvidenceStore.sol','ContractSignatureCode'],['ContractSignatureEvidenceArchive.sol','ContractSignatureEvidenceArchive'],
  ['ContractSignatureWallet.sol','ContractSignatureWallet'],['SignaturePaidRead.sol','SignaturePaidRead']];
// Refuse before ethers/artifact loading, writes, or chain launch. A new run needs
// an explicitly reviewed fresh destination; the retained packet is never reused.
for(const name of ['paid.json.gz','paid-progress.json.gz',...targets.map(([,name])=>`artifact-${name}.json.gz`)]){
  const exists=await lstat(join(out,name)).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;});
  if(exists)throw Error(`EVIDENCE_OUTPUT_EXISTS: ${join(out,name)}`);
}
const BASE='ab55ca65bfc5ee983c829e42d421f6382ad66fa1',e=await loadEthers(),coder=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
const hash=(t,v)=>e.keccak256(coder.encode(t,v)),sha=x=>createHash('sha256').update(x).digest('hex');
await mkdir(out,{recursive:true});
const report={base:BASE,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),limits:{runtime:24576,initcode:49152,ordinaryGas:15000000,hardGas:16777216},arms:[],artifacts:{},offline:[]};
for(const [file,name] of targets){
  const raw=await readFile(join(process.env.FOUNDRY_OUT,file,`${name}.json`)),a=JSON.parse(raw);
  const m=typeof a.metadata==='string'?JSON.parse(a.metadata):a.metadata;
  assert.equal(m.compiler.version,'0.8.30+commit.73712a01');assert.equal(m.settings.optimizer.runs,200);assert(m.settings.viaIR);assert.equal(m.settings.evmVersion,'cancun');
  for(const [path,pin] of Object.entries(m.sources))assert.equal(e.keccak256(await readFile(path)),pin.keccak256,`artifact/source ${path}`);
  assert.equal(Object.keys(a.bytecode.linkReferences??{}).length,0);
  report.artifacts[name]={sha256:sha(raw),creationBytes:e.getBytes(a.bytecode.object).length,runtimeBytes:e.getBytes(a.deployedBytecode.object).length,metadata:m};
  await writeFile(join(out,`artifact-${name}.json.gz`),gzipSync(raw));
}
const blank={kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z};
const emptyReads={principalIds:[],positions:[],expectedHeads:[]};
for(const deployment of ['direct','proxy']){
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment,evidenceMode:'snapshot'});
  const arm={deployment,anvil:{pid:env.anvilPid,port:env.port,history:env.historyPolicy},rows:[],bundles:[],anchors:[],traces:[]};report.arms.push(arm);
  try{
    const core=env.contracts.ledger.address,api=new e.Interface(env.contracts.ledger.abi);
    const wallet=await env.deploy('wallet','ContractSignatureWallet.sol','ContractSignatureWallet',[core]);
    const walletApi=new e.Interface(env.contracts.wallet.abi);
    const profile={ledger:core,ledgerCodeHash:env.contracts.ledger.codeHash,chainId:env.manifest.chainId,
      implementations:env.manifest.executionFamily.implementations.map(x=>({...x,support:x.publicationSupport}))};
    const companion=createContractSignatureCompanion({ethers:e,rpc:env.rpc,ledger:core,ledgerAbi:env.contracts.ledger.abi,profile});
    const principal=(await env.call('ledger','principalOf',[wallet]))[0];
    const actionsHash=a=>e.keccak256(coder.encode([api.getFunction('executeGuarded1271').inputs[1]],[a]));
    async function intentFor(author,actions,reads=emptyReads){return {realmId:env.manifest.executionFamily.realmId,realmOrigin:(await env.call('ledger','realmOrigin'))[0],executionSet:(await env.call('ledger','executionSet'))[0],author,
      nonce:(await env.call('ledger','nonces',[author]))[0],deadline:2000000000,acceptanceProfile:(await env.call('ledger','acceptanceProfileOf',[actions]))[0],
      indexObligations:(await env.call('ledger','indexObligations'))[0],readSetHash:(await env.call('ledger','readSetHash',[reads]))[0]};}
    const makeCreate=label=>[{...blank,kind:5,salt:e.id(`wallet/${deployment}/${label}`)}];
    async function publish(label,signature,actions=makeCreate(label),reads=emptyReads,bodies=actions.map(()=> '0x'),success=true){
      const intent=await intentFor(wallet,actions,reads),digest=(await env.call('ledger','guardedIntentDigest',[intent,actionsHash(actions)]))[0];
      await env.transact('wallet','approve',[digest,signature],`${label}/approve`);
      const data=encodeContractSignaturePublication(e,{intent,actions,bodies,reads,signature});
      const before=plain(await env.call('ledger','counts')),nonce=(await env.call('ledger','nonces',[wallet]))[0];
      const row=await env.observe(await env.enqueue(label,{to:core,data},'bob'));
      assert.equal(row.status,success?'SUCCESS':'REVERTED',label);
      const publication=success?String((await env.call('ledger','counts'))[3]):null;
      let bundle;
      if(success){bundle=await companion.exportPublication(publication);assert.equal(bundle.signature,signature);arm.bundles.push(bundle);}
      else{assert.deepEqual(plain(await env.call('ledger','counts')),before);assert.equal((await env.call('ledger','nonces',[wallet]))[0],nonce);}
      const result={label,signatureBytes:e.getBytes(signature).length,gas:row.gasUsed,status:row.status,publication,transactionHash:row.transactionHash,actions:actions.length,heads:reads.expectedHeads.length};arm.rows.push(result);
      return {result,bundle,data,intent};
    }
    // Matched native and EOA whole publications; no attempt to call contract bytes EOA proof.
    await env.transact('wallet','nativeCreate',[e.id(`native/${deployment}`)],'matched/native');
    const nativePub=String((await env.call('ledger','counts'))[3]);
    const ea=makeCreate('eoa'),ei=await intentFor(env.wallets.alice.address,ea),ed=(await env.call('ledger','guardedIntentDigest',[ei,actionsHash(ea)]))[0];
    await env.transact('ledger','executeGuardedSigned',[ei,ea,['0x'],emptyReads,env.wallets.alice.signingKey.sign(ed).serialized],'matched/eoa','bob');
    const eoaPub=String((await env.call('ledger','counts'))[3]);
    const first=await publish('wallet/first','0x010203040506070809'),repeated=await publish('wallet/repeated','0x010203040506070809');
    const empty=await publish('wallet/empty','0x'),large=await publish('wallet/max4096','0x'+'a5'.repeat(4096));
    const reader=await env.deploy('paidReader','SignaturePaidRead.sol','SignaturePaidRead');
    for(const item of [first,empty,large]){
      await env.transact('paidReader','read',[item.bundle.context.store,core,item.result.publication],`${item.result.label}/paid-read`);
      assert.equal((await env.call('paidReader','hash'))[0],e.keccak256(item.bundle.signature));assert.equal((await env.call('paidReader','length'))[0],BigInt(item.result.signatureBytes));
    }
    // Exactly four bounded call-tree traces, never opcode traces. The calldata
    // max here is4096 and each traced publication has a single CREATE action.
    for(const item of [first,repeated,empty,large]){
      const trace=await env.rpc('debug_traceTransaction',[item.result.transactionHash,{tracer:'callTracer'}]);
      let count=0;const regions=[];
      const visit=t=>{assert(++count<=128,'bounded trace node count');if([wallet,item.bundle.context.store].some(a=>a.toLowerCase()===t.to?.toLowerCase()))regions.push({type:t.type,to:t.to,gas:t.gas,gasUsed:t.gasUsed,inputBytes:e.getBytes(t.input??'0x').length,error:t.error});for(const c of t.calls??[])visit(c);};visit(trace);
      arm.traces.push({label:item.result.label,nodes:count,regions,trace});
    }
    // Real Files create: same-publication File, root Record, raw Name and two
    // bindings. Independent canonical HEAD/placement read-back proves effects.
    const salt=e.id(`wallet/file/${deployment}`),file=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),principal,salt]);
    const content=e.concat([file,e.toUtf8Bytes('wallet authored file')]),name=e.hexlify(e.toUtf8Bytes(`wallet-${deployment}.txt`)),role=e.keccak256(name);
    const record=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),env.manifest.types.root,e.keccak256(content)]);
    const head=e.id('efs2/purpose/head/1'),folder=e.id('efs2/purpose/folder/1');
    const fa=[{...blank,kind:5,salt},{...blank,kind:1,typeId:env.manifest.types.root,bodyHashOrRecordId:e.keccak256(content)},
      {...blank,kind:1,typeId:env.manifest.types.name,bodyHashOrRecordId:role},{...blank,kind:3,purpose:head,subject:file,target:record},
      {...blank,kind:3,purpose:folder,subject:env.manifest.folder,role,target:file}];
    const fr={principalIds:[principal],positions:[hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),head,file,Z]),hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),folder,env.manifest.folder,role])],expectedHeads:[]};
    for(const p of fr.positions)fr.expectedHeads.push((await env.call('ledger','headSnapshot',[principal,p]))[0]);
    const files=await publish('wallet/files','0x998877',fa,fr,['0x',content,name,'0x','0x']);
    for(const [i,target] of [record,file].entries())assert.equal((await env.call('ledger','head',[hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),principal,fr.positions[i]])]))[5],target);
    const bad=makeCreate('final-rollback');bad.push({...blank,kind:3,purpose:folder,subject:env.manifest.folder,role:e.id('missing-name'),target:file});
    await publish('wallet/final-name-rollback','0x6677',bad,emptyReads,['0x','0x'],false);
    // One fixed joint maximum probe, preserving actual failures if it cannot fit.
    const maxReads={principalIds:Array.from({length:64},(_,i)=>e.toBeHex(i+1,32)),positions:Array.from({length:4},(_,i)=>e.id(`joint/${deployment}/${i}`)),expectedHeads:[]};
    const absent=hash(['bytes32','uint8','uint32','uint64','bytes32'],[e.id('efs.lab.head-snapshot/2'),0,0,0,Z]);maxReads.expectedHeads=Array(256).fill(absent);
    const maxActions=Array.from({length:64},(_,i)=>({...blank,kind:5,salt:e.id(`joint/${deployment}/${i}`)}));
    const ji=await intentFor(wallet,maxActions,maxReads),jd=(await env.call('ledger','guardedIntentDigest',[ji,actionsHash(maxActions)]))[0],jsig='0x'+'5a'.repeat(4096);
    await env.transact('wallet','approve',[jd,jsig],'joint/approve');
    const jointData=encodeContractSignaturePublication(e,{intent:ji,actions:maxActions,bodies:maxActions.map(()=> '0x'),reads:maxReads,signature:jsig});
    const joint=await env.observe(await env.enqueue('joint/64-actions-256-heads-4096-signature',{to:core,data:jointData},'bob'));arm.joint=joint;
    if(joint.status==='SUCCESS')arm.bundles.push(await companion.exportPublication(String((await env.call('ledger','counts'))[3])));
    // Third party retains after controller rotation, without calling wallet now.
    const archive=await env.deploy('signatureArchive','ContractSignatureEvidenceArchive.sol','ContractSignatureEvidenceArchive',[core]);
    await env.transact('wallet','rotate',[env.wallets.alice.address],'wallet/rotate');
    assert.deepEqual(await companion.exportPublication(first.result.publication),first.bundle);
    for(const item of [first,empty,large,files]){
      const packetHash=verifyContractSignatureBundle(e,item.bundle).packetHash;
      await env.send(`${item.result.label}/archive-unverified`,{to:archive,data:encodeContractSignatureRetention(e,item.bundle)},'bob');
      assert.equal((await env.call('signatureArchive','receipts',[packetHash]))[0],1n);
      await env.send(`${item.result.label}/archive-local`,{to:archive,data:encodeContractSignatureRetention(e,item.bundle,true)},'bob');
      const anchor=await companion.acceptanceAnchor({archive,archiveCodeHash:env.contracts.signatureArchive.codeHash,packetHash});
      assert.equal(verifyContractSignatureBundle(e,item.bundle,{acceptanceAnchor:anchor}).grade,'PINNED_LOCAL_LEDGER_ACCEPTED');arm.anchors.push({bundle:item.bundle,anchor});
    }
    const eoaReader=createGuardedArchiveReader({ethers:e,rpc:env.rpc,manifest:env.manifest});
    await assert.rejects(eoaReader.exportPublication({publication:first.result.publication}),/SOURCE_UNSUPPORTED/);
    const eoaExport=await eoaReader.exportPublication({publication:eoaPub});assert.equal(eoaExport.proof,'AUTHOR_SIGNATURE_VERIFIED');
    const wrong=createContractSignatureCompanion({ethers:e,rpc:env.rpc,ledger:core,ledgerAbi:env.contracts.ledger.abi,profile:{...profile,ledger:wallet}});
    await assert.rejects(wrong.exportPublication(first.result.publication),/SOURCE_PIN/);
    if(deployment==='proxy'){
      const before=await Promise.all([nativePub,eoaPub,first.result.publication].map(async p=>({p,evidence:plain(await env.call('ledger','evidence',[p])),context:plain(await env.call('ledger','publicationContext',[p]))})));
      await env.transact('proxy','upgradeTo',[env.contracts.implementationV2.address],'populated-native-eoa-wallet-upgrade');
      for(const b of before){assert.deepEqual(plain(await env.call('ledger','evidence',[b.p])),b.evidence);assert.deepEqual(plain(await env.call('ledger','publicationContext',[b.p])),b.context);}
      assert.deepEqual(await companion.exportPublication(first.result.publication),first.bundle);
      arm.upgrade={nativePub,eoaPub,walletPub:first.result.publication,evidencePreserved:true,originalStorePreserved:true};
    }
    arm.profile=profile;arm.contracts=env.contracts;arm.manifest=env.manifest;arm.transactions=env.transactions;
    arm.summary={transactions:env.transactions.length,reverts:env.transactions.filter(x=>x.status==='REVERTED').map(x=>x.label),wholeCosts:env.transactions.filter(x=>!x.label.startsWith('deploy/')&&!x.label.endsWith('/approve')).map(x=>({label:x.label,gas:x.gasUsed,status:x.status}))};
  }catch(error){arm.failure=String(error.stack??error);arm.transactions=env.transactions;arm.contracts=env.contracts;throw error;
  }finally{await env.close();arm.closed=true;await writeFile(join(out,'paid-progress.json.gz'),gzipSync(JSON.stringify(plain(report),null,2)));}
}
// Source chains have both stopped. Pure offline verification keeps trust input
// separate and refuses an altered selected receipt without any RPC fallback.
for(const arm of report.arms)for(const {bundle,anchor} of arm.anchors){
  const v=verifyContractSignatureBundle(e,bundle,{acceptanceAnchor:anchor});assert.equal(v.grade,'PINNED_LOCAL_LEDGER_ACCEPTED');
  assert.equal(verifyContractSignatureBundle(e,bundle).grade,'RETAINED_UNVERIFIED_SOURCE');
  assert.throws(()=>verifyContractSignatureBundle(e,bundle,{acceptanceAnchor:{...anchor,packetHash:Z}}),/ACCEPTANCE_ANCHOR/);report.offline.push(v);
}
await writeFile(join(out,'paid.json.gz'),gzipSync(JSON.stringify(plain(report),null,2)));
console.log(JSON.stringify({sourceCommit:report.sourceCommit,arms:report.arms.map(x=>({deployment:x.deployment,...x.summary,joint:{gas:x.joint.gasUsed,status:x.joint.status}})),offline:report.offline.length}));
