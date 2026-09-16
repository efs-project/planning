/** Actual bounded local receipts. No public RPC, install, fork or raised caps. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {createEnvironment,loadEthers} from './compact-environment.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';

const e=await loadEthers(),out=process.env.FOUNDRY_OUT,coder=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
assert(out,'explicit artifact directory');
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
const size=x=>e.getBytes(x).length,sha=x=>createHash('sha256').update(x).digest('hex');
const hash=(types,args)=>e.keccak256(coder.encode(types,args));
const record=(t,b)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),t,e.keccak256(b)]);
const profile='tuple(uint256 version,uint256 chainId,bytes32 venue,address provider,bytes32 providerHash,bytes4 selector,bytes32 key,bytes32 outputType,uint256 representation,uint256 callGas,uint256 maxReturn,address caller)';
const report={base:'7e2b5bfda859ca8994c95c5102a920d871d59f6c',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  limits:{runtime:24576,initcode:49152,normalGas:15000000,hardGas:16777216},artifacts:{},sources:{},controls:[]};
async function pin(file,name){
  const bytes=await readFile(join(out,file,`${name}.json`)),a=JSON.parse(bytes),m=typeof a.metadata==='string'?JSON.parse(a.metadata):a.metadata;
  assert.equal(m.compiler.version,'0.8.30+commit.73712a01');assert.equal(m.settings.optimizer.runs,200);assert(m.settings.viaIR);assert.equal(m.settings.evmVersion,'cancun');
  for(const [path,p] of Object.entries(m.sources)){const b=await readFile(path);assert.equal(e.keccak256(b),p.keccak256,`artifact/source ${path}`);report.sources[path]={sha256:sha(b),keccak256:e.keccak256(b)};}
  report.artifacts[name]={sha256:sha(bytes),compiler:m.compiler,settings:m.settings,sources:m.sources,runtime:size(a.deployedBytecode.object),creation:size(a.bytecode.object),
    abi:a.abi,creationBytecode:a.bytecode,deployedBytecode:a.deployedBytecode};return a;
}
for(const [file,names] of [['LiveFilesProfile.sol',['LiveFilesIndex','LiveFilesDescriptorRule','LiveFilesRootRule','LiveFilesChildRule']],
  ['FilesFinalValidator.sol',['FilesFinalValidator']],['LiveFilesAdapter.sol',['LiveFilesAdapter','LiveQuoteRule','LiveQuoteProvider']],
  ['LiveFilesReader.sol',['LiveFilesPageReader','LiveFilesMountedReader','LiveFilesPaid']],
  ['LiveFiles.t.sol',['LiveProxyControl','LiveFitProvider']]])for(const name of names)await pin(file,name);
for(const [label,path,args] of [['inline','index-inline-artifact.json.gz',800],['nestedHelper','index-nested-helper-artifact.json.gz',800]]){
  const a=JSON.parse(gunzipSync(await readFile('core-closeout-live-files-20260915/'+path)));
  report[label]={runtime:size(a.deployedBytecode.object),creation:size(a.bytecode.object),constructorBytes:args,actualInitcode:size(a.bytecode.object)+args,
    actualNodeAttempt:false,artifact:path};
}
let env,error;
try{
  env=await createEnvironment({protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',indexFields:true,evidenceMode:'append'});
  report.baselineSetup=plain({contracts:env.contracts,transactions:env.transactions});
  const reg=async(key,file,name,shape,args=[],refs=[])=>{
    const address=await env.deploy(key,file,name,args),id=(await env.call('registry','typeIdOf',[e.id(shape),address,refs]))[0];
    await env.transact('registry','register',[e.id(shape),address,refs],`live/register/${key}`);return id;
  };
  const output=await reg('quoteRule','LiveFilesAdapter.sol','LiveQuoteRule','lab/type/live-quote-u128-bool-max100/1');
  // Independent selection from the reviewed direct-provider artifact, never
  // supplied by the provider or inferred from a potentially delegating getter.
  const providerHash=e.keccak256(report.artifacts.LiveQuoteProvider.deployedBytecode.object);
  const adapter=await env.deploy('liveAdapter','LiveFilesAdapter.sol','LiveFilesAdapter',[env.contracts.ledger.address,output,providerHash]);
  const drule=(await env.call('liveAdapter','descriptorRule'))[0],druntime=await env.rpc('eth_getCode',[drule,'latest']),dhash=e.keccak256(druntime);
  const descriptor=(await env.call('liveAdapter','descriptorType'))[0];
  await env.transact('registry','register',[e.id('lab/type/files-live-descriptor/1'),drule,[]],'live/register/descriptor');
  assert.equal((await env.call('registry','typeIdOf',[e.id('lab/type/files-live-descriptor/1'),drule,[]]))[0],descriptor);
  const dinput=report.artifacts.LiveFilesDescriptorRule.creationBytecode.object+new e.Interface(report.artifacts.LiveFilesDescriptorRule.abi).encodeDeploy([adapter,output,providerHash]).slice(2);
  report.nestedDescriptorRule={address:drule,runtime:size(druntime),codeHash:dhash,runtimeCode:druntime,constructorArgs:[adapter,output,providerHash],actualInitcode:size(dinput),actualInitcodeHash:e.keccak256(dinput),paidIn:'deploy/liveAdapter'};
  const t=env.manifest.types,h=env.manifest.ruleHashes;
  const root=await reg('liveRootRule','LiveFilesProfile.sol','LiveFilesRootRule','lab/type/files-live-root/1',[],[descriptor]);
  const child=await reg('liveChildRule','LiveFilesProfile.sol','LiveFilesChildRule','lab/type/files-live-child/1',[[t.root,t.child,t.carrierRoot,t.carrierChild,root]],[Z,descriptor]);
  const legacy=[t.root,t.child,h.root,h.child,t.name,h.name,t.directory,h.directory];
  const helper=await env.deploy('finalValidator','FilesFinalValidator.sol','FilesFinalValidator',[env.contracts.ledger.address,t.name,h.name,t.directory,h.directory]);
  const keys=['bytes','content','carrierRoot','carrierChild','concept'];
  const args=[env.contracts.ledger.address,legacy,keys.map(k=>t[k]),keys.map(k=>h[k]),[descriptor,root,child],[dhash,env.contracts.liveRootRule.codeHash,env.contracts.liveChildRule.codeHash],helper,env.contracts.finalValidator.codeHash];
  await env.deploy('index','LiveFilesProfile.sol','LiveFilesIndex',args);
  report.indexDependencies=[];
  for(const [fn,file,name,constructorArgs] of [['replayDecoder','IndexReplaySource.sol','IndexReplayDecoder',[env.contracts.ledger.address]],
    ['scopeState','FilesScopeState.sol','FilesScopeState',[env.contracts.ledger.address]],
    ['fieldProfile','IndexFieldProfile.sol','IndexFieldProfile',[[{typeId:t.content,scalars:[{kind:2,word:4}],digest:{enabled:true,word:5,algorithmWord:3,algorithm:e.toBeHex(1,32)}}]]]]){
    const a=await pin(file,name),address=(await env.call('index',fn))[0],runtime=await env.rpc('eth_getCode',[address,'latest']);
    const input=a.bytecode.object+new e.Interface(a.abi).encodeDeploy(constructorArgs).slice(2);
    assert(size(runtime)<=24576&&size(input)<=49152);
    report.indexDependencies.push({function:fn,address,codeHash:e.keccak256(runtime),runtime:size(runtime),runtimeCode:runtime,constructorArgs,actualInitcode:size(input),actualInitcodeHash:e.keccak256(input),paidIn:'deploy/index'});
  }
  const publications=(await env.call('ledger','counts'))[3];
  for(let i=0n;i<publications;i++)await env.transact('index','replayNextPublication',[],`live/replay-bootstrap/${i}`);
  await env.transact('ledger','setIndexModule',[env.contracts.index.address],'live/explicit-profile-activation');
  await env.deploy('lens','FilesLiveIndex.sol','FilesLiveLens',[env.contracts.ledger.address,env.contracts.index.address]);
  await env.deploy('files','FilesJoinedConsumer.sol','FilesJoinedConsumer',[env.contracts.ledger.address,env.contracts.lens.address,env.contracts.index.address,t.root,t.child,h.root,h.child]);
  await env.deploy('joined','LiveFilesReader.sol','LiveFilesPageReader',[env.contracts.ledger.address,env.contracts.lens.address,env.contracts.index.address]);
  const mounted=await env.deploy('mounted','LiveFilesReader.sol','LiveFilesMountedReader',[env.contracts.joined.address,adapter]);
  const paid=await env.deploy('livePaid','LiveFilesReader.sol','LiveFilesPaid');
  const provider=await env.deploy('provider','LiveFilesAdapter.sol','LiveQuoteProvider');
  assert.equal(env.contracts.provider.codeHash,providerHash,'selected direct-provider runtime');
  Object.assign(t,{liveDescriptor:descriptor,liveRoot:root,liveChild:child});Object.assign(h,{liveDescriptor:dhash,liveRoot:env.contracts.liveRootRule.codeHash,liveChild:env.contracts.liveChildRule.codeHash});
  env.manifest.liveProfile='quote-u128-bool-v1';env.manifest.liveOutputType=output;env.manifest.liveProviderRuntimeHash=providerHash;
  for(const k of ['index','lens','files','joined','liveAdapter','finalValidator'])env.manifest.contracts[k]=env.contracts[k];
  const principals=[(await env.call('ledger','principalOf',[env.wallets.deployer.address]))[0],(await env.call('ledger','principalOf',[env.wallets.alice.address]))[0]];
  const publish=async(type,body,label)=>{await env.transact('ledger','publish',[type,body],label);return record(type,body);};
  const create=async(label)=>{const salt=e.id('live/'+label);await env.transact('ledger','create',[salt],`live/create/${label}`);return hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),principals[0],salt]);};
  const head=e.id('efs2/purpose/head/1'),folderPurpose=e.id('efs2/purpose/folder/1');
  const bind=async(f,revision,label)=>{
    await env.transact('ledger','bind',[head,f,Z,revision,0],`live/head/${label}`);
    await publish(t.name,e.hexlify(e.toUtf8Bytes(label)),`live/name/${label}`);
    await env.transact('ledger','bind',[folderPurpose,env.manifest.folder,e.id(label),f,0],`live/mount/${label}`);
  };
  const recipe={version:1,chainId:31337,venue:e.id('evm/cancun/staticcall/1'),provider,providerHash:env.contracts.provider.codeHash,
    selector:e.id('quote(bytes32)').slice(0,10),key:e.toBeHex(7,32),outputType:output,representation:1,callGas:50000,maxReturn:64,caller:adapter};
  const descriptorBody=coder.encode([profile],[recipe]),d=await publish(descriptor,descriptorBody,'live/descriptor');
  const fitProvider=await env.deploy('proxyImplementation','LiveFiles.t.sol','LiveFitProvider');
  const proxy=await env.deploy('proxyControl','LiveFiles.t.sol','LiveProxyControl',[fitProvider]);
  const proxyValue=await env.rpc('eth_call',[{to:proxy,data:recipe.selector+coder.encode(['bytes32'],[recipe.key]).slice(2)},'latest']);
  assert.equal(proxyValue,coder.encode(['uint128','bool'],[42,true]),'callable delegating negative control');
  const proxyBody=coder.encode([profile],[{...recipe,provider:proxy,providerHash:env.contracts.proxyControl.codeHash}]);
  const proxyReject=await env.observe(await env.enqueue('descriptor/reject-unselected-proxy-runtime',{to:env.contracts.ledger.address,data:new e.Interface(env.contracts.ledger.abi).encodeFunctionData('publish',[descriptor,proxyBody])}));
  assert.equal(proxyReject.status,'REVERTED');report.controls.push({boundary:'unselected-mutable-proxy-runtime',receipt:proxyReject,selectedProviderRuntimeHash:providerHash,proxyRuntimeHash:env.contracts.proxyControl.codeHash});
  const f=await create('live'),rootRevision=await publish(root,coder.encode(['bytes32','bytes32'],[d,f]),'live/root');
  const childBody=coder.encode(['bytes32','bytes32','bytes32'],[rootRevision,d,f]),revision=await publish(child,childBody,'live/child');
  await publish(child,childBody,'live/reuse-child');await bind(f,revision,'live');
  const stored=await create('stored'),raw42=coder.encode(['uint128','bool'],[42,true]);
  const storedRevision=await publish(t.root,e.concat([stored,raw42]),'stored/root');await bind(stored,storedRevision,'stored');
  await env.transact('ledger','bind',[folderPurpose,env.manifest.folder,e.id('live'),stored,0],'live/lower-priority-placement','alice');
  const empty=await publish(t.bytes,e.sha256('0x'),'external/empty-sentinel'),externalFiles=[];
  for(const encrypted of [false,true]){
    const file=await create(encrypted?'opaque':'external');
    const body=coder.encode(['bytes32','uint256','uint256','uint256','uint256','bytes32','uint256','uint256','bytes32','uint256','bytes32'],
      [empty,1,1,1,encrypted?17:1,e.sha256(encrypted?'0x'+'ab'.repeat(17):'0xab'),0,encrypted?1:0,Z,1,encrypted?Z:e.sha256('0xab')]);
    const desc=await publish(t.content,body,encrypted?'opaque/descriptor':'external/descriptor');
    const rev=await publish(t.carrierRoot,coder.encode(['bytes32','bytes32'],[desc,file]),encrypted?'opaque/root':'external/root');
    await bind(file,rev,encrypted?'opaque':'external');externalFiles.push({file,encrypted,descriptor:desc});
  }
  // Finite call-tree traces, never storage/opcode tracing or an unbounded scan.
  report.admissionCalls=[];
  for(const label of ['live/descriptor','live/root','live/child','live/reuse-child','live/mount/live']){
    const tx=env.transactions.find(x=>x.label===label);assert(tx&&BigInt(tx.gasUsed)<3000000n);
    const trace=await env.rpc('debug_traceTransaction',[tx.transactionHash,{tracer:'callTracer'}]);
    assert(JSON.stringify(trace).length<1000000,'bounded admission call tree');
    const calls=[];const visit=x=>{calls.push({to:x.to,type:x.type,input:x.input?.slice(0,10)});for(const c of x.calls??[])visit(c);};visit(trace);
    assert(!calls.some(x=>x.to?.toLowerCase()===provider.toLowerCase()),'provider invoked while admitting/indexing/final-validating');
    report.admissionCalls.push({label,transactionHash:tx.transactionHash,calls,totalCalls:calls.length,providerCalls:0});
  }
  const sdk=createFilesCompactSdk({ethers:e,rpc:env.rpc,manifest:env.manifest,journal:await env.createJournal('live')});
  const old=await sdk.pin();
  const point=await sdk.readFile({file:f,principals,context:old});
  assert.equal(point.value.revision?.profile,'live-quote-v1','SDK must recognize exact live revision');
  const oldValue=await sdk.readContent({file:f,principals,context:old});
  assert.equal(oldValue.state,'LIVE_SHAPE_OBSERVED');assert.equal(oldValue.value,'42');
  await assert.rejects(sdk.prepare({operation:'edit',author:env.wallets.deployer.address,principals,file:f,document:'not an in-place snapshot'}),/LIVE_CROSS_FAMILY_SNAPSHOT_NEW_FILE_REQUIRED/);
  for(const row of externalFiles){
    const value=await sdk.readContent({file:row.file,principals,context:old});assert.equal(value.state,'UNAVAILABLE');assert.equal(value.bytes,undefined);
    const read=(await env.call('mounted','read',[env.manifest.folder,principals,e.id(row.encrypted?'opaque':'external'),[old.admission,old.generation,old.epoch,old.executionSet],'0x',256]))[0];
    assert.equal(Number(read.status),row.encrypted?3:4);assert.equal(read.raw,'0x');report.controls.push({boundary:row.encrypted?'encrypted-unavailable':'HTTP-IPFS-unavailable',sdk:value,onchain:plain(read),plaintextShape:'NOT_CLAIMED'});
  }
  const counts=plain(await env.call('ledger','counts'));
  const binding=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),principals[0],hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),head,f,Z])]);
  const headBefore=plain(await env.call('ledger','head',[binding]));
  await env.transact('provider','update',[75,true,0,adapter],'provider/update-only');
  const fresh=await sdk.pin(),freshValue=await sdk.readContent({file:f,principals,context:fresh}),oldAgain=await sdk.readContent({file:f,principals,context:old});
  assert.equal(freshValue.value,'75');assert.equal(oldAgain.value,'42');assert.notEqual(fresh.blockHash,old.blockHash);assert.equal(fresh.admission,old.admission);
  assert.deepEqual(plain(await env.call('ledger','counts')),counts);assert.deepEqual(plain(await env.call('ledger','head',[binding])),headBefore);
  const basis=[fresh.admission,fresh.generation,fresh.epoch,fresh.executionSet];
  await env.transact('livePaid','read',[mounted,env.manifest.folder,principals,e.id('live'),basis],'paid/live');
  await env.transact('livePaid','read',[mounted,env.manifest.folder,principals,e.id('stored'),basis],'paid/stored');
  await env.transact('livePaid','updateAndRead',[provider,87,false,mounted,env.manifest.folder,principals,e.id('live'),basis],'provider/update-and-paid-read');
  const observed=(await env.call('mounted','read',[env.manifest.folder,principals,e.id('live'),basis,'0x',256]))[0];
  assert.equal(observed.live.value,87n);assert.equal(observed.live.flag,false);assert.deepEqual(plain(await env.call('ledger','counts')),counts);
  report.coherence={old,fresh,oldValue,oldAgain,freshValue,counts,headBefore,providerObservation:plain(observed),queryOriginIsNotHistoricalProviderSnapshot:true};
  await env.transact('livePaid','updateAndStore',[provider,90,false,adapter,env.contracts.ledger.address,output],'provider/update-and-duplicate-EFS-store');
  assert.equal((await env.call('ledger','counts'))[0],BigInt(counts[0])+1n);
  // Continue the remaining current-started reads at the new Ledger frontier.
  const duplicateContext=await sdk.pin();basis[0]=duplicateContext.admission;
  for(const [mode,want] of [[1,5],[2,6],[3,7],[4,5],[5,7],[6,7]]){
    await env.transact('provider','update',[87,false,mode,adapter],`provider/failure/${mode}`);
    const context=await sdk.pin(),value=await sdk.readContent({file:f,principals,context});
    const onchain=(await env.call('mounted','read',[env.manifest.folder,principals,e.id('live'),basis,'0x',256]))[0];
    assert.equal(Number(onchain.live.status),want);assert.equal(onchain.file,f);assert.equal(Number(onchain.status),5);assert.equal(onchain.raw,'0x');
    assert.equal(value.state,'LIVE_UNAVAILABLE');assert.equal(value.bytes,undefined);
    report.controls.push({mode,status:want,selectedFile:onchain.file,lowerFile:stored,sdk:value});
  }
  await env.transact('provider','update',[87,false,0,env.wallets.alice.address],'provider/caller-mismatch');
  assert.equal((await env.call('liveAdapter','observe',[d,basis[0]]))[0].status,5n);
  for(const [label,changed] of [['unsupported-chain',{chainId:31338}],['caller-mismatch',{caller:env.wallets.alice.address}]]){
    const body=coder.encode([profile],[{...recipe,...changed}]);
    const receipt=await env.observe(await env.enqueue('descriptor/reject-'+label,{to:env.contracts.ledger.address,data:new e.Interface(env.contracts.ledger.abi).encodeFunctionData('publish',[descriptor,body])}));
    assert.equal(receipt.status,'REVERTED');report.controls.push({boundary:label,receipt});
  }
  await env.transact('provider','update',[150,true,0,adapter],'provider/shape-not-admission');
  const shape=(await env.call('liveAdapter','observe',[d,basis[0]]))[0];assert.equal(shape.status,1n);assert.equal(shape.value,150n);
  const reject=await env.observe(await env.enqueue('snapshot/mandatory-predicate-reject',{to:env.contracts.ledger.address,data:new e.Interface(env.contracts.ledger.abi).encodeFunctionData('publish',[output,shape.raw])}));
  assert.equal(reject.status,'REVERTED');report.shapeNotAdmission={observation:plain(shape),receipt:reject};
  await env.transact('provider','update',[88,false,0,adapter],'provider/snapshot-source');
  const context=await sdk.pin(),value=await sdk.readContent({file:f,principals,context});assert.equal(value.value,'88');
  await publish(output,e.hexlify(value.bytes),'snapshot/real-output-admission');
  const saved=await create('snapshot'),savedRaw=e.hexlify(value.bytes),savedRevision=await publish(t.root,e.concat([saved,savedRaw]),'snapshot/stored-independent-file');await bind(saved,savedRevision,'snapshot');
  const retained=[{id:d,type:descriptor,body:descriptorBody},{id:savedRevision,type:t.root,body:e.concat([saved,savedRaw])}];
  const snapshot={format:'LiveFilesSnapshot/1',file:saved,revision:savedRevision,observedBytes:savedRaw,sourceFile:f,sourceRevision:revision,descriptor:d,recipe,
    descriptorSelectionOrigin:context.admission,observation:{blockHash:context.blockHash,blockNumber:context.blockNumber,chainId:context.chainId,caller:adapter,qualification:'SHAPE_ONLY_NOT_ADMITTED'},
    sourceProof:'RPC_OBSERVED_NOT_SOURCE_CHAIN_PROOF',sourceOff:'SNAPSHOT_BYTES_RETAINED_DESCRIPTOR_NOT_EXECUTABLE',retained};
  const metadata=e.toUtf8Bytes(JSON.stringify(snapshot)),metadataBody=e.concat([e.sha256(metadata),metadata]);
  snapshot.provenanceRecord=await publish(t.bytes,metadataBody,'snapshot/recipe-and-qualification-retention');snapshot.provenanceBody=metadataBody;
  for(const row of retained){const got=await env.call('ledger','record',[row.id]);assert.equal(got[3],row.body);assert.equal(got[0],row.type);}
  report.snapshot=snapshot;
  // A retained query origin selects EFS facts at A, but provider state is now.
  await publish(t.name,e.hexlify(e.toUtf8Bytes('zlive')),'origin/name');
  await env.transact('ledger','bind',[folderPurpose,env.manifest.folder,e.id('zlive'),f,0],'origin/alias');
  const origin=await sdk.pin(),originBasis=[origin.admission,origin.generation,origin.epoch,origin.executionSet];
  const first=(await env.call('mounted','read',[env.manifest.folder,principals,e.id('zlive'),originBasis,'0x',1]))[0];
  assert.notEqual(first.continuation,'0x');
  await publish(output,coder.encode(['uint128','bool'],[91,true]),'origin/unrelated-EFS-publication');
  await env.transact('provider','update',[99,false,0,adapter],'origin/provider-update');
  const native=(await env.call('mounted','read',[env.manifest.folder,principals,e.id('zlive'),originBasis,first.continuation,256]))[0];
  assert.equal(native.live.value,99n);assert.equal(native.selectionOrigin,BigInt(origin.admission));assert(BigInt(native.observationBlock)>BigInt(origin.blockNumber));
  await env.transact('livePaid','readOrigin',[mounted,env.manifest.folder,principals,e.id('zlive'),originBasis,first.continuation,256],'paid/retained-origin-current-provider');
  report.retainedOrigin={origin,native:plain(native),notHistoricalProviderProof:true};
  const descriptorCoverage=await env.call('index','coverage',[(await env.call('index','FAMILY_BY_TYPE'))[0],descriptor]);
  assert.equal(descriptorCoverage[0],2n);report.liveFiltering={descriptorMembership:plain(descriptorCoverage),providerValueFilter:'UNKNOWN_NOT_INDEXED',providerUpdatesAdvanceEFSFeed:false};
  // Actual maximum existing bytes/checked-ref envelope and longest valid Name,
  // not a claim that every 64-action batch fits the independent gas venue.
  const maximal=e.hexlify(new Uint8Array(8160).fill(17));
  const maxBytes=await publish(t.bytes,e.concat([e.sha256(maximal),maximal]),'limits/max-bytes-8192');
  const refs=Array(8).fill(t.bytes),maxType=(await env.call('registry','typeIdOf',[e.id('lab/live/max-eight-refs'),e.ZeroAddress,refs]))[0];
  await env.transact('registry','register',[e.id('lab/live/max-eight-refs'),e.ZeroAddress,refs],'limits/register-max-refs');
  await publish(maxType,e.concat([...Array(8).fill(maxBytes),e.hexlify(new Uint8Array(7936).fill(34))]),'limits/eight-refs-8192-body');
  const longName='a'.repeat(255),action={kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z};
  const a=[{...action,kind:3,purpose:folderPurpose,subject:env.manifest.folder,role:e.id(longName),target:f},
    {...action,kind:3,purpose:folderPurpose,subject:env.manifest.folder,role:e.id('multibind'),target:f},
    {...action,kind:1,typeId:t.name,bodyHashOrRecordId:e.keccak256(e.toUtf8Bytes(longName))},
    {...action,kind:1,typeId:t.name,bodyHashOrRecordId:e.keccak256(e.toUtf8Bytes('multibind'))}];
  await env.transact('ledger','execute',[a,['0x','0x',e.hexlify(e.toUtf8Bytes(longName)),e.hexlify(e.toUtf8Bytes('multibind'))],(await env.call('ledger','nonces',[env.wallets.deployer.address]))[0]],'limits/max-name-and-multi-bind');
  const one=label=>{const row=env.transactions.findLast(x=>x.label===label);assert(row,label);return {gas:row.gasUsed,transactionHash:row.transactionHash};};
  report.costs=Object.fromEntries(['deploy/index','deploy/finalValidator','deploy/liveAdapter','deploy/mounted','deploy/joined','deploy/livePaid','provider/update-only','provider/update-and-duplicate-EFS-store','provider/update-and-paid-read','paid/live','paid/stored','paid/retained-origin-current-provider','snapshot/stored-independent-file','snapshot/recipe-and-qualification-retention','limits/eight-refs-8192-body','limits/max-name-and-multi-bind'].map(k=>[k,one(k)]));
  const sum=rows=>rows.reduce((n,r)=>n+BigInt(r.gasUsed),0n).toString();
  report.costTotals={entireFixture:sum(env.transactions),allDeployment:sum(env.transactions.filter(r=>r.label.startsWith('deploy/'))),
    helperPlusIndex:sum(env.transactions.filter(r=>['deploy/index','deploy/finalValidator'].includes(r.label)).slice(-2)),
    liveProviderAndProfileSetup:sum(env.transactions.filter(r=>['deploy/quoteRule','deploy/liveAdapter','deploy/liveRootRule','deploy/liveChildRule','deploy/provider'].includes(r.label)||r.label.startsWith('live/register/'))),
    liveRegistrationWithChildAndReuse:sum(env.transactions.filter(r=>['live/descriptor','live/create/live','live/root','live/child','live/reuse-child','live/head/live','live/name/live','live/mount/live'].includes(r.label))),
    snapshotRecordsOnly:sum(env.transactions.filter(r=>r.label.startsWith('snapshot/')&&r.status==='SUCCESS')),
    snapshotAllIncludingFileAndPlacement:sum(env.transactions.filter(r=>(r.label.startsWith('snapshot/')||['live/create/snapshot','live/head/snapshot','live/name/snapshot','live/mount/snapshot'].includes(r.label))&&r.status==='SUCCESS'))};
  report.manifest=env.manifest;report.metrics=env.metrics;report.status='PASS';
}catch(cause){error=cause;report.status='FAIL';report.error={message:cause.message,stack:cause.stack};}
finally{
  if(env){
    report.environment={port:env.port,pid:env.anvilPid,history:env.historyPolicy};report.contracts=env.contracts;report.transactions=env.transactions;
    try{
      const journal=await readFile(join(env.dir,'transactions.jsonl'));assert(journal.length<16000000,'bounded exact transaction evidence');
      report.exactTransactions=journal.toString().trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));
      report.deploymentRuntime={};
      for(const [key,c] of Object.entries(env.contracts))if(['index','liveAdapter','finalValidator','liveRootRule','liveChildRule','joined','mounted','livePaid','provider','quoteRule'].includes(key)){
        const runtime=await env.rpc('eth_getCode',[c.address,'latest']);assert.equal(e.keccak256(runtime),c.codeHash);report.deploymentRuntime[key]=runtime;
      }
    }finally{await env.close();report.cleanup={childClosed:true,ownerUntouched:true};}
  }
  for(const path of ['script/measure-live-files.mjs','browser/compact-sdk.mjs']){const b=await readFile(path);report.sources[path]={sha256:sha(b),keccak256:e.keccak256(b)};}
  if(report.snapshot){
    for(const row of report.snapshot.retained)assert.equal(record(row.type,row.body),row.id);
    assert.equal(e.dataSlice(report.snapshot.retained[1].body,32),report.snapshot.observedBytes);
    const meta=e.getBytes(report.snapshot.provenanceBody);assert.equal(e.hexlify(meta.slice(0,32)),e.sha256(meta.slice(32)));
    report.offline={sourceProcessClosed:true,exactBytesAndRecipeRetained:true,sourceProof:'NOT_PROVEN',providerExecutableFromDescriptor:false};
  }
  const tag=process.env.EFS_LIVE_EVIDENCE??'paid';assert(/^[a-z-]+$/.test(tag));const path=`core-closeout-live-files-20260915/${tag}.json.gz`;
  await writeFile(path,gzipSync(JSON.stringify(plain(report),null,2)));
  console.log(JSON.stringify({path,status:report.status,error:report.error,contracts:Object.fromEntries(Object.entries(report.contracts??{}).map(([k,v])=>[k,{runtime:v.runtimeBytes,initcode:v.initcodeBytes}])),cleanup:report.cleanup}));
}
if(error)throw error;
