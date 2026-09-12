import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {E,ROOT,artifact,build,withWorld,KERNEL_PROFILES} from './world.mjs';

const abi=E.AbiCoder.defaultAbiCoder();
const payload=(size,pattern)=>Uint8Array.from({length:size},(_,i)=>pattern==='zero'?0:pattern==='nonzero'?239:i%256);
const recordId=(typeId,body)=>E.keccak256(abi.encode(['bytes32','bytes32','bytes'],[E.id('EFS21_RECORD_V1'),typeId,body]));
const composition=data=>{const bytes=E.getBytes(data),zero=bytes.filter(b=>b===0).length;return {zeroBytes:zero,nonzeroBytes:bytes.length-zero};};
const json=value=>JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v));

export async function workload(w,{allowHybrid=false,sweep=true}={}){
  const capabilities=w.provenance.kernelArtifact.capabilities;
  assert(allowHybrid||['code','dynamic'].includes(capabilities.bodyBackend),'code-only workload requires explicit frozen replay; current is hybrid');
  const observeBody=allowHybrid?(await import('./hybrid-body-benchmark.mjs')).observeBody:null;
  const c=w.client,seen=new Set(),children=[],reads=[],retention=[],bodyObservations=[];
  const ni=new E.Interface(artifact('NavigationIndex').abi),nav=w.provenance.runtimes.NavigationIndex.address;
  const helper=w.provenance.runtimes.BodyWriter?.address;
  const kernelNonce=await c.rpc('eth_getTransactionCount',[w.config.kernel,'latest']);
  const types={raw:w.config.rawType,canonical:w.config.bytesType,uint256:w.config.quoteType};
  const bodyOf=(representation,bytes)=>representation==='uint256'?E.hexlify(bytes):c.encodePayload(types[representation],bytes);
  async function captureBody(d,basis,before){
    const observation=observeBody?await observeBody(w,d.recordId,d.body,basis):null;
    if(observation)bodyObservations.push(observation);
    const codeBacked=observation?observation.backend===0:!!helper;
    if(helper){
      const after=BigInt(await c.rpc('eth_getTransactionCount',[helper,basis.blockNumber]));
      assert.equal(after,before+(!d.dedup&&codeBacked?1n:0n));
      if(!d.dedup&&codeBacked){
        const pointer=E.getCreateAddress({from:helper,nonce:before}),code=await c.rpc('eth_getCode',[pointer,basis.blockNumber]);
        assert.equal(code,'0x00'+d.body.slice(2));
        const child={recordId:d.recordId,pointer,helper,creationNonce:before.toString(),code,codeHash:E.keccak256(code),runtimeBytes:E.getBytes(code).length,basis};
        children.push(child);return child;
      }
    }
  }
  function details(representation,bytes,pattern){
    const typeId=types[representation],body=bodyOf(representation,bytes),id=recordId(typeId,body);
    return {representation,typeId,body,payloadBytes:bytes.length,bodyBytes:E.getBytes(body).length,payloadHash:E.keccak256(bytes),bodyHash:E.keccak256(body),pattern,bodyComposition:composition(body),recordId:id,dedup:seen.has(id)};
  }
  async function exact(d,basis){
    const r=await c.record(d.recordId,basis);assert.equal(r.value.typeId,d.typeId);assert.equal(r.value.body,d.body);
    return {recordId:d.recordId,typeId:r.value.typeId,body:r.value.body,basis};
  }
  async function send(method,args,label,d){
    const before=helper?BigInt(await c.rpc('eth_getTransactionCount',[helper,'latest'])):null;
    const a=await c.write(method,args,label);a.workload=d??{};
    if(d){
      const basis=await c.observe(a.receipt.blockNumber);assert.equal(basis.blockHash,a.receipt.blockHash);
      a.independentEffect=await exact(d,basis);
      const events=a.receipt.logs.filter(log=>log.topics[0]===E.id('RecordStored(bytes32,bytes32)'));
      assert.equal(events.length,d.dedup?0:1,'exact membership determines admission, never workload name');
      a.bodyObject=await captureBody(d,basis,before);
      seen.add(d.recordId);
      if(method==='storeRecord')a.status='COMMITTED_RECORD';
    }
    assert.equal(await c.rpc('eth_getTransactionCount',[w.config.kernel,'latest']),kernelNonce,'writes never consume kernel CREATE nonce');
    return a;
  }
  await c.write('ensureRoot',[],'namespace setup');w.actions.at(-1).phase='namespace-setup';
  const root=(await c.call('rootId',[w.config.namespace])).value;
  const files=[];
  // Complete Files precede admission sweeps: all labeled fresh creates/edits are genuinely new.
  for(const representation of ['raw','canonical'])for(const size of representation==='raw'?[41,256,4032,4096]:[41,256,4032]){
    const name=`${representation}-${size}`,first=details(representation,new Uint8Array(size).fill(81),'nonzero-0x51');
    assert(!first.dedup);
    const made=await send('createFile',[root,E.toUtf8Bytes(name),first.typeId,first.body],`file ${name} create fresh`,first);
    const file=made.fileId;
    await send('createFile',[root,E.toUtf8Bytes(name+'-duplicate'),first.typeId,first.body],`file ${name} create existing`,details(representation,new Uint8Array(size).fill(81),'nonzero-0x51'));
    const second=details(representation,new Uint8Array(size).fill(82),'nonzero-0x52');assert(!second.dedup);
    await send('editFile',[file,1,second.typeId,second.body],`file ${name} edit fresh`,second);
    await send('editFile',[file,2,second.typeId,second.body],`file ${name} edit same`,details(representation,new Uint8Array(size).fill(82),'nonzero-0x52'));
    files.push({file,name,first,second});
  }
  const pi=new E.Interface(artifact('PayloadConsumer').abi),bi=new E.Interface(artifact('BodyReadConsumer').abi);
  const payloadConsumer=await w.deploy('PayloadConsumer',[types.canonical,types.raw]);
  async function estimate(label,method,args,basis,target=w.config.kernel,iface=c.iface,d={}){
    const result=await c.call(method,args,basis,target,iface),data=iface.encodeFunctionData(method,args);
    const gas=await c.rpc('eth_estimateGas',[{to:target,from:w.config.namespace,data},basis.blockNumber]);
    reads.push({label,method,...d,basis,returnBytes:result.returnBytes,returnValue:json(result.value),executionEstimateGas:BigInt(gas).toString(),paidReceipt:false});
    return result;
  }
  for(const f of files){
    const basis=await c.observe();
    await estimate(`read ${f.name} current`,'readRecord',[f.second.recordId],basis,undefined,undefined,f.second);
    await estimate(`read ${f.name} historical`,'readRecord',[f.first.recordId],basis,undefined,undefined,f.first);
    const pArgs=[w.config.kernel,w.config.namespace,[E.toUtf8Bytes(f.name)]];
    const captured=await c.sendData(`payload consumer ${f.name}`,pi.encodeFunctionData('capture',pArgs),payloadConsumer);
    const rb=await c.observe(captured.receipt.blockNumber);
    const state={digest:(await c.call('lastDigest',[],rb,payloadConsumer,pi)).value,length:(await c.call('lastLength',[],rb,payloadConsumer,pi)).value,revision:(await c.call('lastRevision',[],rb,payloadConsumer,pi)).value,recordId:(await c.call('lastRecordId',[],rb,payloadConsumer,pi)).value};
    assert.equal(state.digest,f.second.payloadHash);assert.equal(state.length,BigInt(f.second.payloadBytes));assert.equal(state.revision,3n);assert.equal(state.recordId,f.second.recordId);
    captured.workload={...f.second,dedup:undefined};captured.independentEffect={status:'VERIFIED_PAYLOAD_CAPTURE',...json(state),basis:rb};
    // Each count starts with a fresh consumer: equal empty effect slots, no cross-tx warm state.
    for(const count of [1,2]){
      const consumer=await w.deploy('BodyReadConsumer');
      const args=[w.config.kernel,f.second.recordId,count];
      await estimate(`paid probe estimate ${f.name} ${count}`,'capture',args,await c.observe(),consumer,bi,f.second);
      const a=await c.sendData(`paid read ${f.name} ${count}`,bi.encodeFunctionData('capture',args),consumer);
      const b=await c.observe(a.receipt.blockNumber),digest=(await c.call('lastDigest',[],b,consumer,bi)).value,n=(await c.call('lastReads',[],b,consumer,bi)).value;
      assert.equal(digest,f.second.bodyHash);assert.equal(n,BigInt(count));
      a.workload={...f.second,dedup:undefined,readCount:count};a.independentEffect={status:'VERIFIED_PAID_READ',digest,reads:Number(n),basis:b};
    }
    const before={basis,first:await exact(f.first,basis),current:await exact(f.second,basis),revision:json((await c.call('revisionAt',[f.file,1],basis)).value)};
    const renamed=await send('moveFile',[f.file,3,root,E.toUtf8Bytes(f.name+'-renamed')],`rename ${f.name}`);
    const unlinked=await send('unlink',[f.file,4],`unlink ${f.name}`);
    for(const a of [renamed,unlinked])a.workload={...f.second,dedup:null,admission:'not-applicable: retained existing record'};
    const afterBasis=await c.observe(),info=(await c.call('fileInfo',[f.file],afterBasis)).value;
    assert.equal(info.live,false);assert.equal(info.revision,5n);
    const revisions=[];for(let rev=1;rev<=5;rev++)revisions.push(json((await c.call('revisionAt',[f.file,rev],afterBasis)).value));
    assert.equal(revisions[0][0],f.first.recordId);assert.equal(revisions[4][0],f.second.recordId);
    retention.push({file:f.file,before,after:{basis:afterBasis,first:await exact(f.first,afterBasis),current:await exact(f.second,afterBasis),fileInfo:json(info),revisions}});
  }
  await estimate('directory hydration','listDirectory',[w.config.namespace,root,[E.ZeroHash,0,0],64],await c.observe());
  const qi=new E.Interface(artifact('QuoteProducer').abi),ri=new E.Interface(artifact('QuoteReader').abi);
  for(const [value,expected] of [[3000,0],[3100,1]]){
    const d=details('uint256',E.getBytes(abi.encode(['uint256'],[value])),'scalar');
    const before=helper?BigInt(await c.rpc('eth_getTransactionCount',[helper,'latest'])):null;
    const a=await c.sendData(`quote ${expected===0?'first publish':'fresh update'}`,qi.encodeFunctionData('publish',[value,expected]),w.producer);
    const basis=await c.observe(a.receipt.blockNumber),q=(await c.call('read',[w.config.kernel,w.producer,types.uint256],basis,w.consumer,ri)).value;
    assert.equal(q[0],BigInt(value));assert.equal(q[2],BigInt(expected+1));
    a.workload=d;a.independentEffect={status:'VERIFIED_QUOTE',value,revision:expected+1,record:await exact(d,basis)};seen.add(d.recordId);
    a.bodyObject=await captureBody(d,basis,before);
  }
  const quoteArgs=[w.config.kernel,w.producer,types.uint256];
  const qa=await c.sendData('quote independent reader paid',ri.encodeFunctionData('read',quoteArgs),w.consumer);
  const qb=await c.observe(qa.receipt.blockNumber),q=(await c.call('read',quoteArgs,qb,w.consumer,ri)).value;
  assert.equal(q[0],3100n);qa.independentEffect={status:'VERIFIED_QUOTE_READ',value:'3100',revision:String(q[2]),basis:qb};
  qa.workload={...details('uint256',E.getBytes(abi.encode(['uint256'],[3100])),'scalar'),dedup:null,admission:'not-applicable: read'};
  // Caller-independent admission sweeps retain empty/zero collisions honestly.
  for(const representation of sweep?['raw','canonical']:[])for(const size of [0,1,31,32,33,41,256,4032])for(const pattern of ['zero','nonzero','mixed'])for(const occurrence of ['first','duplicate']){
    const d=details(representation,payload(size,pattern),pattern);
    await send('storeRecord',[d.typeId,d.body],`admit ${representation} ${size} ${pattern} ${occurrence}`,d);
  }
  for(const pattern of sweep?['zero','nonzero']:[])for(const occurrence of ['first','duplicate']){
    const d=details('raw',payload(4096,pattern),pattern);
    await send('storeRecord',[d.typeId,d.body],`boundary raw4096 ${pattern} ${occurrence}`,d);
  }
  async function state(file){
    const basis=await c.observe(),nonces={kernel:await c.rpc('eth_getTransactionCount',[w.config.kernel,basis.blockNumber]),helper:helper?await c.rpc('eth_getTransactionCount',[helper,basis.blockNumber]):null};
    const next=helper?E.getCreateAddress({from:helper,nonce:BigInt(nonces.helper)}):null;
    return {nonces,next,nextCode:next?await c.rpc('eth_getCode',[next,basis.blockNumber]):null,fileNonce:String((await c.call('fileNonce',[w.config.namespace],basis)).value),file:json((await c.call('fileInfo',[file],basis)).value),revision:json((await c.call('revisionAt',[file,1],basis)).value),location:json((await c.call('location',[file],basis,nav,ni)).value),directory:json((await c.call('listDirectory',[w.config.namespace,root,[E.ZeroHash,0,0],64],basis)).value),fileInventory:json((await c.call('fileInventory',[w.config.namespace,[E.ZeroHash,0,0],64],basis,nav,ni)).value),rawInventory:json((await c.call('typeInventory',[types.raw,[E.ZeroHash,0,0],64],basis,nav,ni)).value)};
  }
  const live=(await c.call('lookup',[w.config.namespace,root,E.toUtf8Bytes(files[0].name+'-duplicate')])).value;
  for(const [representation,size] of [['canonical',4096],['raw',4097]]){
    const bytes=payload(size,'nonzero'),body=representation==='raw'?E.hexlify(bytes):abi.encode(['bytes'],[bytes]);
    const before=await state(live);
    await assert.rejects(()=>c.write('storeRecord',[types[representation],body],`refuse ${representation}${size}`),/Transaction reverted/);
    const a=w.actions.at(-1);a.workload={representation,typeId:types[representation],payloadBytes:size,bodyBytes:E.getBytes(body).length,body,bodyComposition:composition(body),pattern:'nonzero'};
    assert.deepEqual(await state(live),before);await assert.rejects(()=>c.record(recordId(types[representation],body)));
    a.independentEffect={status:'VERIFIED_REFUSAL_NO_STATE_CHANGE',before,after:await state(live)};
  }
  for(const mode of ['duplicate name','stale CAS','mandatory discovery unavailable']){
    const d=details('raw',E.toUtf8Bytes('never admitted '+mode),'text'),before=await state(live);
    const discovery=w.provenance.runtimes.DiscoveryIndex.address,original=await c.rpc('eth_getCode',[discovery,'latest']);
    if(mode==='mandatory discovery unavailable')await c.rpc('anvil_setCode',[discovery,'0x60006000fd']);
    const run=mode==='duplicate name'?()=>c.write('createFile',[root,E.toUtf8Bytes(files[0].name+'-duplicate'),d.typeId,d.body],'refuse '+mode):()=>c.write('editFile',[live,mode==='stale CAS'?0:1,d.typeId,d.body],'refuse '+mode);
    try {await assert.rejects(run,/Transaction reverted/);} finally {if(mode==='mandatory discovery unavailable')await c.rpc('anvil_setCode',[discovery,original]);}
    const a=w.actions.at(-1);a.workload=d;
    const after=await state(live);assert.deepEqual(after,before);await assert.rejects(()=>c.record(d.recordId));
    a.independentEffect={status:'VERIFIED_ATOMIC_ROLLBACK',before,after,fault:mode==='mandatory discovery unavailable'?{method:'anvil_setCode',target:discovery,originalCodeHash:E.keccak256(original),faultCode:'0x60006000fd',restoredCodeHash:E.keccak256(await c.rpc('eth_getCode',[discovery,'latest']))}:undefined};
  }
  const memberships={};
  for(const [name,typeId] of Object.entries(types)){
    const page=(await c.call('typeInventory',[typeId,[E.ZeroHash,0,0],64],undefined,nav,ni)).value;
    assert(page.complete);memberships[name]=[...page.ids];
    for(const id of page.ids)assert(seen.has(id));
  }
  assert.equal(Object.values(memberships).flat().length,seen.size);
  if(helper&&capabilities.bodyBackend==='code')assert.equal(children.length,seen.size,'one retained object per exact RecordId for explicit always-code');
  if(observeBody)assert.equal(new Set(bodyObservations.filter(r=>r.backend===0).map(r=>r.recordId)).size,children.length,'one child per distinct code-backed Record, not per Record');
  for(const a of [...w.setup,...w.actions]){
    const tx=await c.rpc('eth_getTransactionByHash',[a.hash]);
    assert.equal(E.keccak256(tx.input),a.calldataHash);a.transaction=tx;a.calldata=tx.input;
    a.calldataComposition=composition(tx.input);
    a.intrinsicGas=String(21000+4*a.calldataComposition.zeroBytes+16*a.calldataComposition.nonzeroBytes+(tx.to?0:32000+2*Math.ceil(E.getBytes(tx.input).length/32)));
    const block=await c.rpc('eth_getBlockByNumber',[a.receipt.blockNumber,false]);
    assert.equal(block.hash,a.receipt.blockHash);assert(BigInt(block.gasUsed)<=16777216n);a.block={number:block.number,hash:block.hash,gasUsed:block.gasUsed,gasLimit:block.gasLimit};
  }
  const old=JSON.parse(readFileSync(ROOT+'evidence/raw-representation.json')).raw;
  for(const name of ['RawBytesValidator','BytesValidator','Uint256Validator'])assert.equal(w.provenance.runtimes[name].codeHash,old.provenance.runtimes[name].codeHash);
  return {selection:w.provenance.kernelArtifact.selection,types,setup:w.setup,actions:w.actions,reads,retention,memberships,children,bodyObservations,provenance:w.provenance};
}

export async function compareBodyStorage({frozenReplay=false}={}){
  const candidate=frozenReplay?'baseline-58e61c4':'current';
  assert.equal(KERNEL_PROFILES[candidate].bodyBackend,'code','current is hybrid; use explicit frozenReplay / --frozen-replay for exact 58e61c4 body candidate');
  build();const arms=[];
  for(const kernelArtifact of ['baseline-c088363','integrity-c088363',candidate])arms.push(await withWorld(workload,{kernelArtifact,buildFirst:false}));
  for(const arm of arms.slice(1)){
    assert.deepEqual(arm.types,arms[0].types);assert.deepEqual(arm.memberships,arms[0].memberships);
    for(const name of ['RawBytesValidator','BytesValidator','Uint256Validator','ExpandedTypeRegistry','DiscoveryIndex','NavigationIndex'])assert.deepEqual(arm.provenance.runtimes[name],arms[0].provenance.runtimes[name]);
    assert.deepEqual(arm.actions.map(a=>a.label),arms[0].actions.map(a=>a.label));
  }
  const comparison=arms[0].actions.map((a,i)=>{
    const rows=arms.map(arm=>arm.actions[i]);
    for(const b of rows.slice(1)){assert.equal(b.calldata,a.calldata);assert.deepEqual(b.workload,a.workload);assert.equal(b.status,a.status);}
    const gas=rows.map(r=>BigInt(r.gasUsed));
    const workload=a.workload??{};
    const admission=a.status==='REVERTED'?'refused':typeof workload.dedup==='boolean'?(workload.dedup?'dedup':'fresh'):'not-applicable';
    return {label:a.label,typeId:workload.typeId??null,payloadBytes:workload.payloadBytes??null,bodyBytes:workload.bodyBytes??null,bodyComposition:workload.bodyComposition??null,...workload,dedup:workload.dedup??null,admission,status:a.status,costs:rows.map((r,j)=>({arm:arms[j].selection,gas:r.gasUsed,intrinsicGas:r.intrinsicGas,hash:r.hash,blockNumber:r.receipt.blockNumber,blockHash:r.receipt.blockHash})),primarySavedGas:String(gas[1]-gas[2]),readDefenseCostGas:String(gas[1]-gas[0]),totalSavedGas:String(gas[0]-gas[2])};
  });
  const readComparison=arms[0].reads.map((row,i)=>{
    const readings=arms.map(a=>a.reads[i]);
    for(const other of readings.slice(1)){assert.equal(other.label,row.label);assert.deepEqual(other.returnValue,row.returnValue);assert.equal(other.returnBytes,row.returnBytes);}
    return {label:row.label,typeId:row.typeId??null,bodyBytes:row.bodyBytes??null,returnBytes:row.returnBytes,estimates:readings.map((r,j)=>({arm:arms[j].selection,gas:r.executionEstimateGas,basis:r.basis})),primarySavedEstimateGas:String(BigInt(readings[1].executionEstimateGas)-BigInt(readings[2].executionEstimateGas)),paidReceipt:false};
  });
  return {createdAt:new Date().toISOString(),standing:'Fresh-genesis native body experiment; storage plus integrity versus code plus identical RecordId integrity is the primary comparison',arms,comparison,readComparison,limits:{runtime:24576,initcode:49152,body:4096,transactionAndBlockGas:16777216},limitations:['No full-C0 parity, adoption, migration, production deployment, hybrid or cross-Type sharing','Exact selected artifacts differ in kernel body storage/read defense only; current support consumers are common to all arms','Read estimates are separate from paid receipts; all paid counts start with fresh empty consumer effect slots','Mandatory discovery outage uses local anvil_setCode fault injection and restoration; not an optional attached scalar-profile failure','No traces or inferred slot-count savings; cold access sets reset every transaction','Setup includes helper creation inside kernel receipt; helper-specific deployment gas is not separately observable as a receipt','Matched action calldata is identical, so action intrinsic-calldata deltas are zero; deployment calldata/setup differ','Bodies are public permanent code objects; STOP prefix plus exact-size and RecordId read defenses are priced']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const result=await compareBodyStorage({frozenReplay:process.argv.includes('--frozen-replay')});
  writeFileSync(ROOT+'evidence/body-storage-frozen-replay.json',JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(result.comparison.filter(r=>/file .* (create fresh|edit fresh)|quote |refuse/.test(r.label)).map(({label,costs,primarySavedGas})=>({label,gas:costs.map(c=>c.gas),primarySavedGas})),null,2));
}
