import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {E,ROOT,artifact,withWorld} from './world.mjs';
export {E};

const abi=E.AbiCoder.defaultAbiCoder();
const composition=data=>{const bytes=E.getBytes(data),zero=bytes.filter(b=>b===0).length;return {calldataZeroBytes:zero,calldataNonzeroBytes:bytes.length-zero};};
const payload=(size,pattern)=>Uint8Array.from({length:size},(_,i)=>pattern==='zero'?0:pattern==='nonzero'?239:i%256);

async function workload(w,representation){
  const c=w.client,typeId=representation==='raw'?w.config.rawType:w.config.bytesType;
  const index=(await c.call('discovery')).value,di=new E.Interface(artifact('DiscoveryIndex').abi);
  assert.equal((await c.call('status',[w.config.namespace],undefined,index,di)).value.health,0n);
  const consumer=await w.deploy('PayloadConsumer',[w.config.bytesType,w.config.rawType]),pi=new E.Interface(artifact('PayloadConsumer').abi);
  const seen=new Set(),reads=[],capacity=[];
  const recordId=body=>E.keccak256(abi.encode(['bytes32','bytes32','bytes'],[E.id('EFS21_RECORD_V1'),typeId,body]));
  async function verifyRecord(body,basis){const id=recordId(body),r=await c.record(id,basis);assert.equal(r.value.typeId,typeId);assert.equal(r.value.body,body);assert.equal(E.hexlify(c.decodePayload(typeId,body)),representation==='raw'?body:abi.decode(['bytes'],body)[0]);return id;}
  async function send(method,args,label,bytes,extra={}){
    const exact=bytes===undefined?undefined:c.encodePayload(typeId,bytes);
    const a=await c.write(method,args(exact),label);
    a.workload={payloadBytes:bytes?.length??0,...extra};
    if(exact!==undefined){
      const id=recordId(exact);a.workload={...a.workload,typeId,recordId:id,payloadHash:E.keccak256(bytes),bodyHash:E.keccak256(exact),bodyBytes:E.getBytes(exact).length,expectedDedup:seen.has(id)};
      const basis=await c.observe(a.receipt.blockNumber);assert.equal(basis.blockHash,a.receipt.blockHash);await verifyRecord(exact,basis);
      if(method==='storeRecord'){
        const stored=a.receipt.logs.filter(log=>log.topics[0]===E.id('RecordStored(bytes32,bytes32)'));
        assert.equal(stored.length,seen.has(id)?0:1,'duplicate admissions emit no inventory event');
        a.status='COMMITTED_RECORD';a.basis=basis;
      }
      seen.add(id);
    }
    return a;
  }
  await c.write('ensureRoot',[],'namespace setup');w.actions.at(-1).phase='namespace-setup';
  const root=(await c.call('rootId',[w.config.namespace])).value;
  const standalone=new Uint8Array(41).fill(49),first=new Uint8Array(41).fill(65),second=new Uint8Array(41).fill(66);
  for(const occurrence of ['unique','duplicate'])await send('storeRecord',b=>[typeId,b],'standalone '+occurrence,standalone);
  const created=await send('createFile',b=>[root,E.toUtf8Bytes('payload'),typeId,b],'file create fresh',first);
  const file=created.fileId,firstRecord=(await c.call('fileInfo',[file])).value.recordId;
  await send('createFile',b=>[root,E.toUtf8Bytes('duplicate'),typeId,b],'file create dedup',first);
  await send('editFile',b=>[file,1,typeId,b],'file edit fresh',second);
  await send('editFile',b=>[file,2,typeId,b],'file edit same',second);
  assert.equal((await c.call('fileInfo',[file])).value.revision,3n);
  const basis=await c.observe();
  async function read(method,args,target=w.config.kernel,iface=c.iface){
    const result=await c.call(method,args,basis,target,iface),data=iface.encodeFunctionData(method,args);
    reads.push({method,basis,returnBytes:result.returnBytes,executionEstimateGas:BigInt(await c.rpc('eth_estimateGas',[{to:target,from:w.config.namespace,data},basis.blockNumber])).toString(),paidReadFee:false,...composition(data)});return result;
  }
  const current=(await read('fileInfo',[file])).value;
  await read('readRecord',[current.recordId]);
  assert.equal((await read('revisionAt',[file,1])).value.recordId,firstRecord);
  const historical=(await read('readRecord',[firstRecord])).value;
  assert.equal(E.hexlify(c.decodePayload(historical.typeId,historical.body)),E.hexlify(first));
  const args=[w.config.kernel,w.config.namespace,[E.toUtf8Bytes('payload')]];
  const observed=await read('read',args,consumer,pi);assert.equal(observed.value.digest,E.keccak256(second));assert.equal(observed.value[1],41n);
  const captured=await c.sendData('consumer capture',pi.encodeFunctionData('capture',args),consumer);
  const receiptBasis=await c.observe(captured.receipt.blockNumber);
  const consumerState={digest:(await c.call('lastDigest',[],receiptBasis,consumer,pi)).value,length:Number((await c.call('lastLength',[],receiptBasis,consumer,pi)).value),revision:Number((await c.call('lastRevision',[],receiptBasis,consumer,pi)).value),recordId:(await c.call('lastRecordId',[],receiptBasis,consumer,pi)).value,basis:receiptBasis};
  assert.equal(consumerState.digest,E.keccak256(second));assert.equal(consumerState.length,41);assert.equal(consumerState.revision,3);assert.equal(consumerState.recordId,current.recordId);
  captured.independentEffect={status:'VERIFIED_CONSUMER_STATE',...consumerState};captured.workload={payloadBytes:41};
  await send('moveFile',()=>[file,3,root,E.toUtf8Bytes('renamed')],'file rename');
  await send('unlink',()=>[file,4],'file unlink');
  assert.equal((await c.call('fileInfo',[file])).value.live,false);
  assert.equal((await c.call('revisionAt',[file,1])).value.recordId,firstRecord);await verifyRecord(c.encodePayload(typeId,first));
  // Same unchanged uint256 producer/reader path in both expanded-registry worlds.
  const qi=new E.Interface(artifact('QuoteProducer').abi),ri=new E.Interface(artifact('QuoteReader').abi);
  for(const [value,revision,label] of [[3000,0,'uint publish first'],[3100,1,'uint publish update']]){
    const a=await c.sendData(label,qi.encodeFunctionData('publish',[value,revision]),w.producer);
    const rb=await c.observe(a.receipt.blockNumber),q=(await c.call('read',[w.config.kernel,w.producer,w.config.quoteType],rb,w.consumer,ri)).value;
    assert.equal(q[0],BigInt(value));assert.equal(q[2],BigInt(revision+1));a.independentEffect={status:'VERIFIED_QUOTE',value,revision:revision+1,basis:rb};a.workload={payloadBytes:32,bodyBytes:32};
  }
  const quoteArgs=[w.config.kernel,w.producer,w.config.quoteType];
  const qa=await c.sendData('uint consumer transaction',ri.encodeFunctionData('read',quoteArgs),w.consumer);
  const qb=await c.observe(qa.receipt.blockNumber);assert.equal((await c.call('read',quoteArgs,qb,w.consumer,ri)).value[0],3100n);qa.independentEffect={status:'VERIFIED_QUOTE_READ',value:3100,basis:qb};qa.workload={payloadBytes:32,bodyBytes:32};
  for(const size of [0,1,31,32,33,41,256,4032])for(const pattern of ['zero','nonzero','mixed']){
    const bytes=payload(size,pattern);
    for(const label of ['first','duplicate'])await send('storeRecord',b=>[typeId,b],`matrix ${pattern} ${size} ${label}`,bytes,{pattern});
  }
  // Capacity is not a paired saving: bypass the SDK only to observe contract rejection receipts.
  for(const size of [4033,4096,4097]){
    const bytes=payload(size,'nonzero'),body=representation==='raw'?E.hexlify(bytes):abi.encode(['bytes'],[bytes]);
    let a;
    if(size>(representation==='raw'?4096:4032)){
      await assert.rejects(()=>c.write('storeRecord',[typeId,body],`capacity ${size}`),/Transaction reverted/);a=w.actions.at(-1);
      await assert.rejects(()=>c.record(recordId(body)));assert.equal(a.status,'REVERTED');
    }else a=await send('storeRecord',b=>[typeId,b],`capacity ${size}`,bytes);
    a.phase='capacity-not-paired';capacity.push({payloadBytes:size,bodyBytes:E.getBytes(body).length,status:a.status,hash:a.hash,gasUsed:a.gasUsed});
  }
  // Read back unique Type inventory independently; empty raw is present exactly once.
  const nav=(await c.call('navigation')).value,ni=new E.Interface(artifact('NavigationIndex').abi);
  const inventory=(await c.call('typeInventory',[typeId,['0x'+'0'.repeat(64),0,0],64],undefined,nav,ni)).value;
  assert.equal(inventory.ids.length,seen.size);assert.equal(new Set(inventory.ids).size,seen.size);
  const legacy=JSON.parse(readFileSync(ROOT+'evidence/benchmark-2.json')).provenance;
  for(const name of ['BytesValidator','Uint256Validator'])assert.equal(w.provenance.runtimes[name].codeHash,legacy.runtimes[name].codeHash);
  assert.equal(w.provenance.sourcePins['ExactTypeRegistry.sol'],legacy.sourcePins['ExactTypeRegistry.sol']);
  for(const a of w.actions)Object.assign(a,composition(a.calldata));
  // Setup receipts' input is recovered from their actual transaction, not regenerated calldata.
  for(const a of w.setup){const tx=await c.rpc('eth_getTransactionByHash',[a.hash]);assert.equal(E.keccak256(tx.input),a.calldataHash);Object.assign(a,composition(tx.input));}
  return {representation,typeId,discoveryMode:'UNSUPPORTED / no attached profile',setup:w.setup,actions:w.actions,reads,capacity,consumer:consumerState,uniqueRecords:seen.size,legacyIdentity:{reference:'evidence/benchmark-2.json',sourceHash:legacy.sourcePins['ExactTypeRegistry.sol'],validators:Object.fromEntries(['BytesValidator','Uint256Validator'].map(name=>[name,w.provenance.runtimes[name].codeHash]))},provenance:w.provenance};
}

export async function pairedRaw(){
  const canonical=await withWorld(w=>workload(w,'canonical'));
  const raw=await withWorld(w=>workload(w,'raw'));
  assert.deepEqual(canonical.provenance.sourcePins,raw.provenance.sourcePins);
  assert.deepEqual(canonical.provenance.supportPins,raw.provenance.supportPins);
  assert.equal(canonical.provenance.kernelArtifact.creationBytecodeHash,raw.provenance.kernelArtifact.creationBytecodeHash);
  assert.deepEqual(canonical.provenance.runtimes,raw.provenance.runtimes);
  const comparison=canonical.actions.filter(a=>a.phase==='action').map(a=>{
    const b=raw.actions.find(x=>x.label===a.label);assert(b);assert.equal(a.workload.payloadBytes,b.workload.payloadBytes);
    if(a.workload.payloadHash)assert.equal(a.workload.payloadHash,b.workload.payloadHash);
    return {label:a.label,payloadBytes:a.workload.payloadBytes,pattern:a.workload.pattern,canonicalBodyBytes:a.workload.bodyBytes,rawBodyBytes:b.workload.bodyBytes,canonicalGas:a.gasUsed,rawGas:b.gasUsed,savedGas:(BigInt(a.gasUsed)-BigInt(b.gasUsed)).toString(),canonicalHash:a.hash,rawHash:b.hash,expectedDedup:a.workload.expectedDedup};
  });
  return {createdAt:new Date().toISOString(),standing:'Fresh-world representation ablation; not production, full-C0 parity or a storage-backend change',canonical,raw,comparison,limitations:['Canonical 4096 rejection versus raw success is capacity, not paired savings','No attached discovery profile in either world','Every transaction has cold access sets; shared persistent initialization is stated by workload order','No state-slot counts or traces collected','Reads are RPC observations, not state proofs; estimates are not paid receipt gas','Raw changes exact Type and Record identity; original canonical/uint validator runtimes and domains remain fixed']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const result=await pairedRaw();
  // New evidence only; historical benchmark files are never opened for writing.
  writeFileSync(ROOT+'evidence/raw-representation.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(result.comparison.filter(x=>!x.label.startsWith('matrix')),null,2));
}
