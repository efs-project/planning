/** Bounded independent/source-off run. Input fixtures are already signed;
 * no creator key for the unfamiliar Types, producer encoder, or parser import. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {createEnvironment,loadEthers} from '../script/compact-environment.mjs';
import {createGuardedCompactSdk} from '../browser/compact-sdk-v2.mjs';
import {createGuardedArchiveReader,verifyGuardedClaim,ACTION,encodeGuardedRetention,ARCHIVE_ABI} from '../browser/guarded-archive.mjs';
import * as described from '../browser/described-type-archive.mjs';
import {decodeDescribedType,decodeDescribedBody} from '../browser/described-type-reader.mjs';
const e=await loadEthers(),Z=e.ZeroHash,abi=e.AbiCoder.defaultAbiCoder(),root=new URL('../',import.meta.url);
const out=process.env.FOUNDRY_OUT,output=resolve(process.env.EFS_TYPES_OUTPUT??'');assert(out&&process.env.EFS_TYPES_OUTPUT,'explicit new output and artifact directory required');await mkdir(output);
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n',sha=b=>createHash('sha256').update(b).digest('hex');
const load=async f=>JSON.parse(await readFile(new URL(f,import.meta.url)));
const vectors=await load('vectors.json'),weather=await load('controller-unseen-fixture.json'),linked=await load('controller-unseen-referenced-fixture.json');
assert.equal(sha(await readFile(new URL('../browser/described-type-reader.mjs',import.meta.url))),weather.frozenDecoderSha256,'decoder changed after freeze');
const files={TypeRegistry:'TypeRegistry.sol',Ledger:'Ledger.sol',FilesRootRule:'FilesJoinedProfile.sol',FilesChildRule:'FilesJoinedProfile.sol',FilesNameRule:'FilesNamesProfile.sol',
 FilesLiveNamesIndex:'FilesLiveIndex.sol',FilesLiveLens:'FilesLiveIndex.sol',FilesJoinedConsumer:'FilesJoinedConsumer.sol',FilesNameReader:'FilesNamesProfile.sol',FilesApplication:'FilesApplication.sol',
 DescribedTypeRule:'DescribedTypeProfile.sol',DescribedPredicateFixture:'DescribedFixtures.sol',DescribedPaidConsumer:'DescribedFixtures.sol',SignedClaimArchiveCodeBlob:'SignedClaimArchive.sol'};
const artifacts={},sourcePins={};
for(const [name,file] of Object.entries(files)){
 const raw=await readFile(join(out,file,name+'.json')),a=JSON.parse(raw),m=a.metadata;
 assert.equal(m.compiler.version,'0.8.30+commit.73712a01');assert.equal(m.settings.optimizer.runs,200);assert(m.settings.optimizer.enabled&&m.settings.viaIR);assert.equal(m.settings.evmVersion,'cancun');
 assert.deepEqual(a.bytecode.linkReferences,{});assert.deepEqual(a.deployedBytecode.linkReferences,{});
 assert(e.getBytes(a.deployedBytecode.object).length<=24576);assert(e.getBytes(a.bytecode.object).length<=49152);
 for(const [path,pin] of Object.entries(m.sources)){const b=await readFile(new URL(path,root));assert.equal(e.keccak256(b),pin.keccak256,'stale artifact '+name+' '+path);sourcePins[path]={sha256:sha(b),keccak256:pin.keccak256};}
 artifacts[name]={file,artifactSha256:sha(raw),metadata:m,creation:a.bytecode.object,runtime:a.deployedBytecode.object,immutableReferences:a.deployedBytecode.immutableReferences??{}};
}
for(const path of ['browser/described-type-reader.mjs','browser/described-type-archive.mjs','browser/guarded-archive.mjs','browser/compact-sdk.mjs','browser/compact-sdk-v2.mjs',
 'script/compact-environment.mjs','script/compact-read-transport.mjs','core-closeout-types-20260915/interpretation-paid.mjs','core-closeout-types-20260915/offline.mjs',
 'core-closeout-types-20260915/controller-unseen-fixture.json','core-closeout-types-20260915/controller-unseen-referenced-fixture.json','core-closeout-types-20260915/vectors.json','core-closeout-types-20260915/WIRE.md','foundry.toml']){
 const b=await readFile(new URL(path,root));sourcePins[path]={sha256:sha(b),keccak256:e.keccak256(b)};
}
const extension=described.createDescribedArchiveExtension(e,{wrapperInitcode:artifacts.DescribedTypeRule.creation}),environments=[],observations=[],bundles=[],joined=[];
let failure,summary,source,destination;
const action=(kind,type,body)=>({kind,typeId:type,bodyHashOrRecordId:kind===1?e.keccak256(body):body,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z});
const env=async chainId=>{const x=await createEnvironment({protocol:'compact-guarded-v2',chainId,blockGasLimit:16_777_216});environments.push(x);return x;};
const tx=async(x,key,fn,args,label,who='bob',success=true)=>{
 const data=new e.Interface(x.contracts[key].abi).encodeFunctionData(fn,args),row=await x.observe(await x.enqueue(label,{to:x.contracts[key].address,data},who));
 assert.equal(row.status,success?'SUCCESS':'REVERTED',label);console.log(label,row.status,row.gasUsed);return row;
};
async function register(x,v,label){
 assert.equal((await x.call('registry','describedTypeId',[v.descriptor]))[0],v.typeId);
 return tx(x,'registry','registerDescribed',[v.descriptor,v.declarationSignature,e.ZeroAddress,e.ZeroAddress,'0x'],label);
}
async function signed(x,v,body,label,{reuse=false}={}){
 const actions=[action(reuse?2:1,v.typeId,body)],reads=[[],[],[]],block=await x.rpc('eth_getBlockByNumber',['latest',false]),author=x.wallets.alice;
 const intent=[(await x.call('ledger','realmId'))[0],(await x.call('ledger','realmOrigin'))[0],(await x.call('ledger','executionSet'))[0],author.address,
  (await x.call('ledger','nonces',[author.address]))[0],BigInt(block.timestamp)+3600n,(await x.call('ledger','acceptanceProfileOf',[actions]))[0],(await x.call('ledger','indexObligations'))[0],(await x.call('ledger','readSetHash',[reads]))[0]];
 const digest=(await x.call('ledger','guardedIntentDigest',[intent,e.keccak256(abi.encode([ACTION+'[]'],[actions]))]))[0];
 await tx(x,'ledger','executeGuardedSigned',[intent,actions,[reuse?'0x':body],reads,author.signingKey.sign(digest).serialized],label);
 return String((await x.call('ledger','counts'))[3]);
}
async function capture(x){
 const transactions=[];
 for(const row of x.transactions){
  const raw=e.Transaction.from(row.rawTransaction),chainTx=await x.rpc('eth_getTransactionByHash',[row.transactionHash]),block=await x.rpc('eth_getBlockByHash',[row.receipt.blockHash,false]);
  assert.equal(e.keccak256(row.rawTransaction),row.transactionHash);assert.equal(raw.data,chainTx.input);assert.equal(raw.from.toLowerCase(),chainTx.from.toLowerCase());
  assert.equal(block.transactions[Number(BigInt(row.receipt.transactionIndex))],row.transactionHash);assert.equal(BigInt(block.gasLimit),16_777_216n);
  assert(raw.gasLimit<=15_000_000n);transactions.push({...row,chainTx,block:{hash:block.hash,number:block.number,gasLimit:block.gasLimit,transactions:block.transactions}});
 }
 const deployments=[];
 for(const [key,c] of Object.entries(x.contracts)){
  const row=transactions.find(t=>t.transactionHash===c.transactionHash);if(!row)continue;
  const raw=e.Transaction.from(row.rawTransaction),matches=Object.entries(artifacts).filter(([,a])=>raw.data.startsWith(a.creation));assert.equal(matches.length,1,key+' artifact');
  const [name,a]=matches[0],code=await x.rpc('eth_getCode',[c.address,'latest']),actual=e.getBytes(code),template=e.getBytes(a.runtime),patch=new Set();
  assert.equal(actual.length,template.length);for(const refs of Object.values(a.immutableReferences))for(const ref of refs)for(let i=0;i<ref.length;i++)patch.add(ref.start+i);
  for(let i=0;i<actual.length;i++)if(!patch.has(i))assert.equal(actual[i],template[i],name+' runtime byte '+i);
  const args=raw.data.slice(a.creation.length);assert.equal(e.getBytes(raw.data).length,e.getBytes(a.creation).length+args.length/2);
  deployments.push({key,name,address:c.address,constructorArguments:'0x'+args,argumentBytes:args.length/2,initcodeBytes:e.getBytes(raw.data).length,runtimeBytes:actual.length,runtime:code,transactionHash:row.transactionHash});
 }
 joined.push({chainId:x.manifest.chainId,manifest:x.manifest,pid:x.anvilPid,port:x.port,dir:x.dir,historyPolicy:x.historyPolicy,transactions,deployments});
}
try{
 source=await env(31338);
 const sdk=createGuardedCompactSdk({ethers:e,manifest:source.manifest,rpc:source.rpc,described:extension});
 for(const v of [weather,linked,...vectors.vectors.slice(0,5)])await register(source,v,'source/register/'+v.name);
 await tx(source,'ledger','publish',[vectors.vectors[0].typeId,'0x'],'source/unit');
 for(const b of weather.bodies)await tx(source,'ledger','publish',[weather.typeId,b.body],'source/native/'+b.name);
 for(const b of weather.invalidBodies)await tx(source,'ledger','publish',[weather.typeId,b.body],'source/refuse/'+b.reason,'bob',false);
 for(const b of linked.invalidAdmissions)await tx(source,'ledger','publish',[linked.typeId,b.body],'source/refuse/'+b.reason,'bob',false);
 const linkedPublication=await signed(source,linked,linked.bodies[0].body,'source/signed-linked');
 const native=await tx(source,'ledger','publish',[linked.typeId,linked.bodies[0].body],'source/native-linked-duplicate');
 const reused=await tx(source,'ledger','execute',[[action(2,linked.typeId,linked.bodies[0].recordId)],['0x'],(await source.call('ledger','nonces',[source.wallets.bob.address]))[0]],'source/native-linked-reuse');
 const signedReuse=await signed(source,linked,linked.bodies[0].recordId,'source/signed-linked-reuse',{reuse:true});
 const context=await sdk.pin();
 for(const v of [weather,linked,vectors.vectors[0]]){
  const raw=await sdk.readTypeDescriptor({typeId:v.typeId,context});assert.equal(raw.knowledge,'PRESENT');assert.equal(raw.value.descriptor,v.descriptor);assert.equal(raw.value.declaration,v.declarationSignature);
  const record=await sdk.readTypedRecord({record:v.bodies[0].recordId,context});assert.equal(record.knowledge,'PRESENT');assert.equal(record.value.body,v.bodies[0].body);
  const d=decodeDescribedType(e,raw.value.descriptor,raw.value.local.ruleId),decoded=decodeDescribedBody(e,d,record.value.body);assert.equal(decoded.recordId,v.bodies[0].recordId);
  observations.push({kind:'sdk-contract-state',typeId:v.typeId,descriptor:raw,record,decoded});
 }
 const unitPub=await signed(source,vectors.vectors[0],'0x','source/signed-unit');
 for(const publication of [linkedPublication,signedReuse,unitPub])bundles.push(await sdk.exportPublication({publication}));
 const view=e.id('task2/old-text-view'),rules=[];
 const oldDisplay=({text})=>'display: '+text;
 for(const v of vectors.vectors.slice(1,5)){
  const publication=await signed(source,v,v.bodies.at(-1).body,'source/note/'+v.name),bundle=await sdk.exportPublication({publication});bundles.push(bundle);
  const verified=await verifyGuardedClaim(e,bundle,{described:extension}),decoded=verified.interpretation.records[0].decoded;
  const rule={sourceType:v.typeId,targetView:view,projectionId:e.id('task2/'+v.name),textField:e.toBeHex(1,32)};
  if(v.name==='note-v1'||v.name==='note-v11'){rules.push(rule);const p=described.projectDescribedText(e,decoded,{targetView:view,approved:rules});assert.equal(oldDisplay(p.value),'display: hi');observations.push({kind:'approved-projection',projection:p});}
  else if(v.name==='note-rich-v2'){
   const adapter={...rule,adapter:'drop-emphasis',loss:'Rendering emphasis is discarded; original bytes retained.'};
   assert.throws(()=>described.projectDescribedText(e,decoded,{targetView:view,approved:[adapter]}),/LOSS/);
   observations.push({kind:'explicit-loss',projection:described.projectDescribedText(e,decoded,{targetView:view,approved:[adapter],adapter:'drop-emphasis',acceptLoss:true})});
  }else assert.throws(()=>described.projectDescribedText(e,decoded,{targetView:view,approved:rules,compatibleWith:vectors.vectors[1].typeId}),/UNAPPROVED/);
  if(v.name!=='note-v1')assert.throws(()=>described.assertExactWriter(v.typeId,[vectors.vectors[1].typeId]),/WRITER/);
 }
 // Archive the exact custom-instance authorization, without claiming state portability.
 await source.deploy('custom','DescribedFixtures.sol','DescribedPredicateFixture',[vectors.wrapperRuntimeHash,source.contracts.ledger.address]);
 await tx(source,'custom','setMode',[5],'source/custom-ref-sensitive');
 const customBytes=e.getBytes(vectors.vectors.at(-1).descriptor);customBytes[2]=1;customBytes.set(e.getBytes(source.contracts.custom.codeHash),56);
 const customD=e.hexlify(customBytes),decodedCustom=decodeDescribedType(e,customD,vectors.wrapperRuntimeHash),creator=new e.Wallet(e.toBeHex(0xA11CE,32));
 const customV={typeId:decodedCustom.typeId,descriptor:customD,declarationSignature:creator.signingKey.sign(decodedCustom.declarationDigest).serialized};
 const bindingPreimage=(await source.call('registry','bindingPreimage',[customD,source.contracts.custom.address,source.contracts.ledger.address]))[0];
 await tx(source,'registry','registerDescribed',[customD,customV.declarationSignature,source.contracts.custom.address,source.contracts.ledger.address,creator.signingKey.sign(e.keccak256(bindingPreimage)).serialized],'source/register/custom');
 const ref=vectors.referenceFixture;await tx(source,'registry','register',[ref.shape,e.ZeroAddress,[]],'source/register/opaque-reference','deployer');await tx(source,'ledger','publish',[ref.typeId,ref.body],'source/opaque-reference');
 const customBody=vectors.vectors.at(-1).bodies[0].body,customPub=await signed(source,customV,customBody,'source/signed-custom');
 await tx(source,'ledger','publish',[customV.typeId,customBody.slice(0,-2)+'01000121'],'source/refuse/custom-application-value','bob',false);
 const customBundle=await sdk.exportPublication({publication:customPub});bundles.push(customBundle);
 const cv=await verifyGuardedClaim(e,customBundle,{described:extension});assert.equal(cv.closureCoverage,'COMPLETE');assert.equal(cv.interpretationCoverage,'OPAQUE_LEGACY');
 const customType=customBundle.closure.types.find(t=>t.typeId===customV.typeId);
 for(const edit of [t=>t.described.wrapperAddress=e.ZeroAddress,t=>t.described.bindingPreimage='0x',t=>t.described.bindingSignature='0x',t=>t.described.customCode='0x',t=>t.described.allowedLedger=source.contracts.registry.address]){
  const changed=structuredClone(customType);edit(changed);assert.throws(()=>described.verifyDescribedSidecar(e,changed));
 }
 await source.deploy('paid','DescribedFixtures.sol','DescribedPaidConsumer');
 for(const suffix of ['cold','separate-repeat']){
  const row=await tx(source,'paid','consume',[source.contracts.registry.address,source.contracts.ledger.address,linked.typeId,linked.bodies[0].recordId],'source/paid-read/'+suffix);
  const logs=row.receipt.logs.map(l=>{try{return new e.Interface(source.contracts.paid.abi).parseLog(l);}catch{return null;}}).filter(Boolean);
  assert(logs.some(l=>l.args[0]===linked.typeId&&l.args[1]===e.keccak256(linked.descriptor)&&l.args[2]===linked.bodies[0].recordId&&l.args[3]===e.keccak256(linked.bodies[0].body)));
 }
 const missing=structuredClone(bundles[0]);delete missing.closure.types[0].described;assert.equal((await verifyGuardedClaim(e,missing,{described:extension})).interpretationCoverage,'PARTIAL');
 const missingRef=structuredClone(bundles[0]);const rr=missingRef.closure.records.find(r=>r.typeId===weather.typeId);rr.present=false;delete rr.body;missingRef.closure.coverage='PARTIAL';
 assert.equal((await verifyGuardedClaim(e,missingRef,{described:extension})).interpretationCoverage,'PARTIAL');
 const wrongRef=structuredClone(bundles[0]);wrongRef.closure.records.find(r=>r.typeId===weather.typeId).typeId=vectors.vectors[0].typeId;await assert.rejects(verifyGuardedClaim(e,wrongRef,{described:extension}));
 const bundleRaw=json(bundles);await writeFile(join(output,'source-sidecars.json'),bundleRaw,{flag:'wx'});
 await capture(source);await source.close();await assert.rejects(source.rpc('eth_chainId'));
 // Child verifier has no source endpoint, manifest, wallet, fixture encoder or publisher.
 const offline=spawnSync(process.execPath,[new URL('offline.mjs',import.meta.url).pathname],{input:bundleRaw,encoding:'utf8',maxBuffer:8*1024*1024,timeout:30000,env:{EFS_ETHERS_PATH:process.env.EFS_ETHERS_PATH}});
 assert.equal(offline.status,0,offline.stderr);const interpreted=JSON.parse(offline.stdout);assert(interpreted.every(r=>r.proof==='AUTHOR_SIGNATURE_VERIFIED'));
 assert.equal(interpreted[0].interpretationCoverage,'COMPLETE');assert.equal(interpreted.at(-1).interpretationCoverage,'OPAQUE_LEGACY');
 await writeFile(join(output,'source-off-results.json'),json(interpreted),{flag:'wx'});
 destination=await env(31337);
 // Shift destination registry address while preserving independent Realm setup:
 // environment deploys at equal addresses, so another registry/ledger is used for relay.
 await destination.deploy('relayRegistry','TypeRegistry.sol','TypeRegistry');
 await destination.deploy('relayLedger','Ledger.sol','Ledger',[destination.contracts.relayRegistry.address,e.id('task2/independent-relay')]);
 const originalAuthor=source.wallets.alice.address,countsBefore=Array.from(await destination.call('relayLedger','counts'),String),nonceBefore=String((await destination.call('relayLedger','nonces',[originalAuthor]))[0]);
 await destination.deploy('archive','SignedClaimArchive.sol','SignedClaimArchiveCodeBlob');
 for(const x of bundles)await destination.send('destination/retain-claim',{to:destination.contracts.archive.address,data:encodeGuardedRetention(e,x)},'bob');
 assert.deepEqual(Array.from(await destination.call('relayLedger','counts'),String),countsBefore);assert.equal(String((await destination.call('relayLedger','nonces',[originalAuthor]))[0]),nonceBefore);
 const archiveReader=createGuardedArchiveReader({ethers:e,rpc:destination.rpc,manifest:destination.manifest,described:extension});
 const without=await archiveReader.exportArchivedClaim({address:destination.contracts.archive.address,claimId:bundles[0].claimId});assert.equal((await verifyGuardedClaim(e,without,{described:extension})).interpretationCoverage,'PARTIAL');
 const withSidecars=await archiveReader.exportArchivedClaim({address:destination.contracts.archive.address,claimId:bundles[0].claimId,closure:bundles[0].closure});assert.equal((await verifyGuardedClaim(e,withSidecars,{described:extension})).interpretationCoverage,'COMPLETE');
 for(const v of [weather,linked]){
  const retained=bundles[0].closure.types.find(t=>t.typeId===v.typeId).described;
  assert.equal(retained.declaration,v.declarationSignature);
  await tx(destination,'relayRegistry','registerDescribed',[retained.descriptor,retained.declaration,e.ZeroAddress,e.ZeroAddress,'0x'],'destination/relay/'+v.name);
  assert.equal((await destination.call('relayRegistry','describedTypeId',[retained.descriptor]))[0],v.typeId);
  const r=bundles[0].closure.records.find(r=>r.typeId===v.typeId);
  await tx(destination,'relayLedger','publish',[r.typeId,r.body],'destination/own-admission/'+v.name);
  const recovered=await destination.call('relayLedger','record',[r.recordId]);assert.equal(recovered[3],r.body);
  const publication=(await destination.call('relayLedger','counts'))[3];assert.equal((await destination.call('relayLedger','evidence',[publication]))[0],destination.wallets.bob.address);
 }
 const destInfo=(await destination.call('relayRegistry','describedInfo',[linked.typeId]))[0],sourceInfo=bundles[0].closure.types.find(t=>t.typeId===linked.typeId).described;
 assert.notEqual(destInfo.mandatory.toLowerCase(),sourceInfo.wrapperAddress.toLowerCase());
 await tx(destination,'relayRegistry','retainDeclaration',[customV.descriptor,customV.declarationSignature],'destination/custom-retain-not-install');
 assert.equal((await destination.call('relayRegistry','describedStatus',[customV.typeId]))[0],1n);
 await tx(destination,'relayRegistry','registerDescribed',[customV.descriptor,customV.declarationSignature,source.contracts.custom.address,destination.contracts.relayLedger.address,customType.described.bindingSignature],'destination/refuse-old-custom-auth','bob',false);
 const sourceRegister=source.transactions.find(x=>x.label==='source/register/'+linked.name),signedRow=source.transactions.find(x=>x.label==='source/signed-linked');
 summary={freeze:{commit:'ffa9bbe0ec43e77bc248922ff89c0192e31deca7',sha256:weather.frozenDecoderSha256,unchanged:true},
  sourceStopped:true,offlineProcess:true,unfamiliarTypes:[weather.typeId,linked.typeId],exactRecord:linked.bodies[0].recordId,
  source:{chainId:source.manifest.chainId,ledger:source.contracts.ledger.address,wrapper:sourceInfo.wrapperAddress},destination:{chainId:destination.manifest.chainId,ledger:destination.contracts.relayLedger.address,wrapper:destInfo.mandatory},
  archiveBytes:Buffer.byteLength(bundleRaw),oneLinkedClaimBytes:Buffer.byteLength(json(bundles[0])),interpretation:interpreted.map(r=>r.interpretationCoverage),
  normalGas:{register:sourceRegister.gasUsed,nativeDuplicate:native.gasUsed,nativeReuse:reused.gasUsed,signedPublish:signedRow.gasUsed},
  amortization:[1,10,100,1000].map(n=>({admissions:n,registrationPerAdmission:BigInt(sourceRegister.gasUsed)/BigInt(n)})),
  limits:'Local raw RPC receipts, no consensus proof; raw ECDSA not wallet UX; original author has no new assertion; custom state/governance/universal schema compatibility not proven. Task1 cold8190text remains a shared300k falsifier, not rerun or shortened.'};
 await capture(destination);
}catch(error){failure={message:error.message,stack:error.stack};console.error(error);}
finally{
 for(const x of environments){if(!joined.some(j=>j.pid===x.anvilPid)){try{await capture(x);}catch(error){observations.push({captureFailure:error.message});}}await x.close();}
 const packet={base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,sourcePins,artifacts,chains:joined,observations,summary,failure};
 await writeFile(join(output,'paid.json'),json(packet),{flag:'wx'});
 console.log(json({summary,failure,closedPids:environments.map(x=>x.anvilPid),output}));
}
if(failure)process.exitCode=1;
