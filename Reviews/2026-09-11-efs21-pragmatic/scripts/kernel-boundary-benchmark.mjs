import assert from 'node:assert/strict';
import {existsSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {E,ROOT,artifact,build,withWorld,observeBody} from './world.mjs';
import {createClient} from '../sdk/client.mjs';
import {failureReceipts} from './discovery-failures.mjs';

const json=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
const start=[E.ZeroHash,0,0];
const abi=E.AbiCoder.defaultAbiCoder();
const diff=(a,b)=>Object.fromEntries(Object.keys(a).map(k=>[k,a[k]-b[k]]));

export async function boundaryWorkload(w,{probe=false}={}) {
  const c=w.client,n=w.config.namespace,k=w.config.kernel;
  const root=(await c.write('ensureRoot',[])).fileId;
  if(probe)return {root,actionCount:w.actions.length};
  const direct=w.config.graph.NativeRecordKernel??k;
  const nav=w.config.graph.NavigationIndex,ni=new E.Interface(artifact('NavigationIndex').abi);
  const ii=new E.Interface(artifact('RecordInventoryIndex').abi);
  const inventory=w.config.graph.RecordInventoryIndex??nav;
  const readerInterface=new E.Interface(artifact('BodyReadConsumer').abi);
  const producer=await w.deploy('RecordProducer'),pi=new E.Interface(artifact('RecordProducer').abi);
  const producerArtifact=artifact('RecordProducer');
  const observations=[],reads=[],semantics=[],events=[],failures=[];
  async function inspectRecord(id,body,label) {
    const before={...c.metrics},basis=await c.observe(),qualificationCost=diff(c.metrics,before);
    const readBefore={...c.metrics};
    const viaFacade=await c.record(id,basis);
    const native=await c.call('readRecord',[id],basis,direct);
    assert.equal(viaFacade.value.body,body);assert.equal(native.value.body,body);
    assert.equal(native.value.typeId,w.config.rawType);assert.equal(c.recordId(native.value.typeId,body),id);
    reads.push({label,basis,qualificationCost,pointReadCost:diff(c.metrics,readBefore),directReturnBytes:native.returnBytes,facadeReturnBytes:viaFacade.returnBytes,bodyHash:E.keccak256(body)});
    observations.push(await observeBody(w,id,body,basis));
  }
  async function contents(label) {
    const basis=await c.observe();
    const source=(await c.call('typeInventory',[w.config.rawType,start,64],basis,inventory,ii)).value;
    const forwarded=(await c.call('typeInventory',[w.config.rawType,start,64],basis,nav,ni)).value;
    assert(source.complete&&forwarded.complete);assert.deepEqual(json(source),json(forwarded));
    return {label,ids:[...source.ids],highWater:String(source.next.revision),scope:source.next.scope};
  }
  const directory=(await c.write('createDirectory',[root,E.toUtf8Bytes('objects')])).fileId;
  const rows=[['tiny','0x01'],['dense-max','0x'+'ef'.repeat(4096)],['sparse-max','0x'+'00'.repeat(4095)+'01']];
  for(const [label,body] of rows){
    const id=c.recordId(w.config.rawType,body);
    const beforeNonce=(await c.call('fileNonce',[n])).value;
    await c.sendData(label+' direct Record admission',c.iface.encodeFunctionData('storeRecord',[w.config.rawType,body]),direct);
    assert.equal((await c.call('fileNonce',[n])).value,beforeNonce);
    await inspectRecord(id,body,label+' direct');
    await c.write('storeRecord',[w.config.rawType,body],label+' facade dedup forwarding');
    await c.sendData(label+' generic contract producer dedup',pi.encodeFunctionData('publish',[direct,w.config.rawType,body]),producer);
    assert.equal((await c.call('lastRecord',[],undefined,producer,pi)).value,id);
    assert.equal((await c.call('fileCount',[producer],undefined,nav,ni)).value,0n);
    const file=(await c.write('createFile',[directory,E.toUtf8Bytes(label),w.config.rawType,body],label+' Files create existing Record')).fileId;
    assert.equal((await c.call('fileInfo',[file])).value.owner,n);
    const updated=body.slice(0,-2)+(label==='dense-max'?'ee':'02'),next=c.recordId(w.config.rawType,updated);
    await c.write('editFile',[file,1,w.config.rawType,updated],label+' Files fresh edit');
    await c.write('editFile',[file,2,w.config.rawType,updated],label+' Files same-content edit');
    await inspectRecord(next,updated,label+' edited');
    for(const count of [1,2])for(const [path,target] of [['direct',direct],['facade',k]]){
      const consumer=await w.deploy('BodyReadConsumer');
      const a=await c.sendData(`${label} paid ${path} ${count} reads`,readerInterface.encodeFunctionData('capture',[target,next,count]),consumer);
      const basis=await c.observe(a.receipt.blockNumber);
      assert.equal((await c.call('lastDigest',[],basis,consumer,readerInterface)).value,E.keccak256(updated));
      assert.equal((await c.call('lastReads',[],basis,consumer,readerInterface)).value,BigInt(count));
      a.independentEffect={bodyHash:E.keccak256(updated),reads:count,basis};
    }
    await c.write('moveFile',[file,3,root,E.toUtf8Bytes(label+'-renamed')],label+' rename');
    await c.write('unlink',[file,4],label+' unlink');
    const reloaded=createClient(E,w.config),basis=await reloaded.observe();
    const info=(await reloaded.call('fileInfo',[file],basis)).value;
    assert.equal(info.live,false);assert.equal(info.revision,5n);
    assert.equal((await reloaded.record(id,basis)).value.body,body);
    assert.equal((await reloaded.record(next,basis)).value.body,updated);
    const history=[];
    for(let revision=1;revision<=5;revision++)history.push(json((await reloaded.call('revisionAt',[file,revision],basis)).value));
    assert.deepEqual(history.map(r=>r[0]),[id,next,next,next,next]);
    semantics.push({label,file,info:json(info),history,inventory:await contents(label)});
  }
  const qi=new E.Interface(artifact('QuoteProducer').abi),qr=new E.Interface(artifact('QuoteReader').abi);
  for(const [value,expected] of [[3000,0],[3100,1]]){
    const a=await c.sendData(`quote ${expected?'update':'first'}`,qi.encodeFunctionData('publish',[value,expected]),w.producer);
    const basis=await c.observe(a.receipt.blockNumber),read=(await c.call('read',[k,w.producer,w.config.quoteType],basis,w.consumer,qr)).value;
    assert.equal(read[0],BigInt(value));assert.equal(read[2],BigInt(expected+1));
    a.independentEffect={quote:json(read),basis};
  }
  await c.sendData('quote independent paid reader',qr.encodeFunctionData('read',[k,w.producer,w.config.quoteType]),w.consumer);
  const kept=(await c.write('createFile',[root,E.toUtf8Bytes('kept'),w.config.rawType,'0x03'])).fileId;
  async function state(id,body){
    const basis=await c.observe(),recordOwner=w.config.graph.NativeRecordKernel??k;
    const slots=[BigInt(E.keccak256(abi.encode(['bytes32','uint256'],[id,w.config.graph.NativeRecordKernel?0:3]))),BigInt(E.keccak256(abi.encode(['bytes32','uint256'],[id,w.config.graph.NativeRecordKernel?1:6])))];
    const helper=w.config.graph.BodyWriter,nonce=await c.rpc('eth_getTransactionCount',[helper,basis.blockNumber]);
    const metadata=await Promise.all([slots[0],slots[0]+1n,...Array.from({length:Math.ceil(E.getBytes(body).length/32)},(_,i)=>slots[1]+BigInt(i))].map(slot=>c.rpc('eth_getStorageAt',[recordOwner,E.toBeHex(slot,32),basis.blockNumber])));
    return {helperNonce:nonce,nextCode:await c.rpc('eth_getCode',[E.getCreateAddress({from:helper,nonce:BigInt(nonce)}),basis.blockNumber]),metadata,fileNonce:String((await c.call('fileNonce',[n],basis)).value),file:json((await c.call('fileInfo',[kept],basis)).value),history:json((await c.call('revisionAt',[kept,1],basis)).value),directory:json((await c.list(n,root,{basis})).value),inventory:await contents('failure')};
  }
  for(const [backend,body] of [['code','0x'+'ab'.repeat(256)],['words','0x'+'00'.repeat(255)+'ab']]){
    const id=c.recordId(w.config.rawType,body);
    for(const fault of ['stale CAS','name conflict','mandatory inventory','late Discovery']){
      const before=await state(id,body);
      const target=fault==='mandatory inventory'?inventory:w.config.graph.DiscoveryIndex;
      const code=await c.rpc('eth_getCode',[target,'latest']);
      const method=fault==='name conflict'?'createFile':'editFile';
      const args=method==='createFile'?[root,E.toUtf8Bytes('kept'),w.config.rawType,body]:[kept,fault==='stale CAS'?0:1,w.config.rawType,body];
      const label=backend+' refusal '+fault;
      if(fault==='mandatory inventory'||fault==='late Discovery'){
        await c.rpc('anvil_setCode',[target,'0x60006000fd']);
        try{await assert.rejects(()=>c.write(method,args),/identity mismatch/);await w.faultWrite(method,args,label);}
        finally{await c.rpc('anvil_setCode',[target,code]);}
      }else await assert.rejects(()=>c.write(method,args,label),/Transaction reverted/);
      assert.deepEqual(await state(id,body),before);
      await assert.rejects(()=>c.record(id));
      await assert.rejects(()=>c.call('revisionAt',[kept,2]));
      failures.push({label,hash:w.actions.at(-1).hash,backend,metadataAndWords:before.metadata,helperNonce:before.helperNonce,rollback:true});
    }
  }
  const discovery=await failureReceipts(w);
  for(const a of [...w.setup,...w.actions]){
    const tx=await c.rpc('eth_getTransactionByHash',[a.hash]),block=await c.rpc('eth_getBlockByNumber',[a.receipt.blockNumber,false]);
    assert.equal(E.keccak256(tx.input),a.calldataHash);assert.equal(tx.hash,a.receipt.transactionHash);assert.equal(block.hash,a.receipt.blockHash);
    assert(BigInt(a.gasUsed)<=16777216n&&BigInt(block.gasUsed)<=16777216n);
    a.calldata=tx.input;a.transaction=tx;a.block={number:block.number,hash:block.hash,gasUsed:block.gasUsed,gasLimit:block.gasLimit};
    const logs=a.receipt.logs.filter(l=>l.topics[0]===E.id('RecordStored(bytes32,bytes32)'));
    for(const log of logs)assert.equal(log.address.toLowerCase(),direct.toLowerCase());
    if(logs.length)events.push({label:a.label,emitter:direct,recordIds:logs.map(l=>l.topics[1])});
  }
  return {selection:w.config.dependencyProfile,config:{...w.config,devPrivateKey:undefined,abi:undefined,consumerAbi:undefined},setup:w.setup,actions:w.actions,provenance:w.provenance,recordProducerArtifact:{sourcePins:producerArtifact.metadata.sources,creationHash:E.keccak256(producerArtifact.bytecode.object)},observations,reads,semantics,events,failures,discovery};
}

export function compareBoundary(arms){
  assert.deepEqual(arms.map(a=>a.selection),['baseline-7db38cd','current']);
  const [control,candidate]=arms;
  assert.equal(candidate.config.kernel,control.config.kernel);assert.equal(candidate.config.producer,control.config.producer);
  for(const key of ['rawType','bytesType','quoteType'])assert.equal(candidate.config[key],control.config[key]);
  assert.equal(candidate.semantics.length,control.semantics.length);
  for(let i=0;i<control.semantics.length;i++){
    const a=control.semantics[i],b=candidate.semantics[i];
    assert.deepEqual({...b,inventory:{...b.inventory,scope:null}},{...a,inventory:{...a.inventory,scope:null}});
    assert.notEqual(a.inventory.scope,b.inventory.scope,'actual inventory source changes cursor identity');
  }
  assert.deepEqual(candidate.observations.map(r=>[r.recordId,r.backend,r.length]),control.observations.map(r=>[r.recordId,r.backend,r.length]));
  assert.deepEqual(candidate.events.map(({label,recordIds})=>({label,recordIds})),control.events.map(({label,recordIds})=>({label,recordIds})));
  assert.equal(candidate.actions.length,control.actions.length);
  const actions=candidate.actions.map((b,i)=>{
    const a=control.actions[i];assert.equal(b.label,a.label);assert.equal(b.status,a.status);
    const logs=row=>row.receipt.logs.map(l=>({topics:l.topics,data:l.data,address:l.topics[0]===E.id('RecordStored(bytes32,bytes32)')?'Record source':l.address}));
    assert.deepEqual(logs(b),logs(a),'only explicit Record event emitter may differ');
    const calldataEqual=a.calldata===b.calldata;
    if(!calldataEqual)assert(/paid direct|generic contract producer/.test(a.label),'only explicit generic target address changes action calldata');
    const intrinsic=data=>21000+E.getBytes(data).reduce((sum,byte)=>sum+(byte===0?4:16),0);
    return {label:a.label,controlGas:a.gasUsed,candidateGas:b.gasUsed,deltaGas:String(BigInt(b.gasUsed)-BigInt(a.gasUsed)),intrinsicDeltaGas:intrinsic(b.calldata)-intrinsic(a.calldata),sameCalldata:calldataEqual,sameTarget:a.transaction.to===b.transaction.to,hashes:[a.hash,b.hash]};
  });
  assert.equal(candidate.setup.length,control.setup.length);
  const setup=candidate.setup.map((b,i)=>{const a=control.setup[i];assert.equal(a.label,b.label);return {label:a.label,controlGas:a.gasUsed,candidateGas:b.gasUsed,deltaGas:String(BigInt(b.gasUsed)-BigInt(a.gasUsed)),sameCalldata:a.calldata===b.calldata};});
  return {actions,setup,differences:['RecordStored emitter moves from facade to Record kernel; no duplicate event','Record metadata/words, mandatory inventory, helper owner/address and internal dependency addresses move','Cursor scope names the actual inventory source; old genesis cursors cannot resume','Direct calls and paid direct-read target calldata name the distinct Record account','Facade and quote producer EOA deployment order, FileIds and exact Type/Record IDs are preserved in this pair']};
}

export async function benchmarkBoundary(){
  const status=spawnSync('git',['status','--porcelain','--','contracts/src','contracts/test','scripts','sdk','web','test'],{cwd:ROOT,encoding:'utf8'});
  assert.equal(status.status,0);assert.equal(status.stdout.trim(),'','final receipts require committed source/support freeze');
  build();const arms=[];
  for(const kernelArtifact of ['baseline-7db38cd','current'])arms.push(await withWorld(boundaryWorkload,{kernelArtifact,buildFirst:false,watchdogMs:300000}));
  return {createdAt:new Date().toISOString(),standing:'Fresh-genesis native generic Record / mandatory inventory / Files extraction. Source-qualified RPC observations, not state proofs or full-v2 parity.',limits:{runtime:24576,initcode:49152,body:4096,transactionAndBlockGas:16777216},arms,comparison:compareBoundary(arms)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.argv.includes('--probe'))console.log(JSON.stringify(await withWorld(w=>boundaryWorkload(w,{probe:true}))));
  else{
    assert(process.argv.includes('--final'),'choose --probe or --final');
    const path=ROOT+'evidence/kernel-boundary.json';assert(!existsSync(path),'exclusive retained evidence already exists');
    const result=await benchmarkBoundary();writeFileSync(path,JSON.stringify(json(result),null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify({actions:result.comparison.actions.length,setup:result.comparison.setup.length,cleanup:result.arms.map(a=>a.cleanup),costs:result.comparison.actions.map(({label,deltaGas})=>({label,deltaGas}))}));
  }
}
