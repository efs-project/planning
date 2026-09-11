import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {E,ROOT,artifact,withWorld} from './world.mjs';
import {createClient,START,ZERO} from '../sdk/client.mjs';
export async function seed(w) {
  const c=w.client,n=w.config.namespace;
  await c.write('ensureRoot',[],'initialize namespace');
  w.actions.at(-1).phase='namespace-setup';
  const root=(await c.call('rootId',[n])).value;
  await c.write('createDirectory',[root,E.toUtf8Bytes('Documents')],'create directory cold');
  const folder=(await c.call('lookup',[n,root,E.toUtf8Bytes('Documents')])).value;
  const a=await c.write('createFile',[folder,E.toUtf8Bytes('Welcome.txt'),w.config.bytesType,c.body(E.toUtf8Bytes('Welcome to a real small filesystem on EFS'))],'create short 41B cold caller/list');
  a.workload={payloadBytes:41,expectedDedup:false,context:'first regular file for this namespace and directory'};
  return {root,folder};
}
export async function exercise(w) {
  const c=w.client,n=w.config.namespace,abi=E.AbiCoder.defaultAbiCoder(),checks={};
  const {root,folder}=await seed(w);
  const bytes=E.toUtf8Bytes('a'.repeat(41)),body=c.body(bytes);
  const lookup=async name=>(await c.call('lookup',[n,folder,E.toUtf8Bytes(name)])).value;
  const created=await c.write('createFile',[folder,E.toUtf8Bytes('short.txt'),w.config.bytesType,body],'create short 41B first unique');created.workload={payloadBytes:41,expectedDedup:false,context:'existing caller/directory; new body'};
  const file=await lookup('short.txt');
  const independentId=E.keccak256(abi.encode(['bytes32','bytes32','bytes'],[E.keccak256(E.toUtf8Bytes('EFS21_RECORD_V1')),w.config.bytesType,body]));
  assert.equal((await c.call('fileInfo',[file])).value.recordId,independentId);
  assert.equal((await c.record(independentId)).value.body,body);
  const duplicate=await c.write('createFile',[folder,E.toUtf8Bytes('duplicate.txt'),w.config.bytesType,body],'create short 41B deduplicated');duplicate.workload={payloadBytes:41,expectedDedup:true};
  assert.notEqual(await lookup('duplicate.txt'),file);
  assert.equal((await c.call('fileInfo',[await lookup('duplicate.txt')])).value.recordId,independentId);
  const page=await c.list(n,folder,{limit:1});
  for (let revision=1;revision<=3;revision++) {
    const payload=E.toUtf8Bytes(String(revision).repeat(41));
    await c.write('editFile',[file,revision,w.config.bytesType,c.body(payload)],`edit ${revision===1?'first':'steady '+revision} 41B`);
    w.actions.at(-1).workload={payloadBytes:41,expectedDedup:false,context:'fresh unique RecordId; ABI bytes, not uint256'};
    const info=(await c.call('fileInfo',[file])).value;
    assert.equal(info.revision,BigInt(revision+1));assert.equal((await c.record(info.recordId)).value.body,c.body(payload));
  }
  await c.write('editFile',[file,4,w.config.bytesType,c.body(E.toUtf8Bytes('3'.repeat(41)))],'same-content edit 41B deduplicated');
  w.actions.at(-1).workload={payloadBytes:41,expectedDedup:true,context:'same content, new retained revision'};
  await assert.rejects(()=>c.list(n,folder,{cursor:page.value.next,limit:1}));checks.staleCursorRejected=true;
  await assert.rejects(()=>c.call('fileInfo',[file],{...page.basis,blockHash:ZERO}),/Stale observation/);checks.staleObservationRejected=true;
  for(const delta of [{codeHash:ZERO},{genesisHash:ZERO},{deploymentBlockHash:ZERO}]) await assert.rejects(()=>createClient(E,{...w.config,...delta}).observe(),/identity mismatch/);
  checks.identityMismatchRejected=true;
  await assert.rejects(()=>c.record('0x1234'),/Malformed/);
  await c.write('moveFile',[file,5,root,E.toUtf8Bytes('renamed%2F.txt')],'move and rename');
  assert.equal(await lookup('short.txt'),ZERO);
  assert.equal((await c.call('lookup',[n,root,E.toUtf8Bytes('renamed%2F.txt')])).value,file);
  const beforeUnlink=(await c.call('fileInfo',[file])).value;
  await c.write('unlink',[file,6],'unlink');assert.equal((await c.call('fileInfo',[file])).value.live,false);
  assert.equal((await c.call('revisionAt',[file,1])).value.recordId,independentId);
  assert.equal((await c.record(independentId)).value.body,body);assert.equal((await c.call('fileInfo',[file])).value.recordId,beforeUnlink.recordId);checks.historyRetained=true;
  // Failed CAS is deliberately sent, so its paid receipt remains visible.
  await assert.rejects(()=>c.write('editFile',[file,1,w.config.bytesType,body],'reverted edit tombstone'));
  const producerI=new E.Interface(artifact('QuoteProducer').abi),readerI=new E.Interface(artifact('QuoteReader').abi),mappingI=new E.Interface(artifact('PlainQuoteMapping').abi);
  for(const [value,revision,label] of [[3000,0,'cold'],[3100,1,'steady']]) {const a=await c.sendData('producer publish '+label,producerI.encodeFunctionData('publish',[value,revision]),w.producer);a.workload={payloadBytes:32,encodedBodyBytes:32,expectedDedup:false,recordId:c.recordId(w.config.quoteType,abi.encode(['uint256'],[value])),exactType:'uint256'};}
  const readArgs=[w.config.kernel,w.producer,w.config.quoteType];
  const quote=await c.call('read',readArgs,undefined,w.consumer,readerI);assert.equal(quote.value[0],3100n);checks.consumerValue=quote.value[0].toString();
  const consumerRead={basis:quote.basis,returnBytes:quote.returnBytes,value:quote.value[0].toString(),executionEstimateGas:BigInt(await c.rpc('eth_estimateGas',[{to:w.consumer,data:readerI.encodeFunctionData('read',readArgs),from:n},quote.basis.blockNumber])).toString(),paidReadFee:false};
  await c.sendData('consumer read transaction',readerI.encodeFunctionData('read',readArgs),w.consumer);
  const key=E.id('eth-usdc');
  for(const [value,label] of [[3000,'cold'],[3100,'steady']]) await c.sendData('plain mapping '+label,mappingI.encodeFunctionData('set',[key,value]),w.mapping);
  assert.equal((await c.call('values',[key],undefined,w.mapping,mappingI)).value,3100n);
  const payloads=[];
  for(const size of [0,32,41,256,4032,4096]) {
    if(size>4032){assert.throws(()=>c.body(new Uint8Array(size)));payloads.push({payloadBytes:size,supported:false,reason:'4096-byte body cap includes ABI framing; payload max 4032'});continue;}
    const exact=c.body(new Uint8Array(size).fill(90));const a=await c.write('createFile',[folder,E.toUtf8Bytes('payload-'+size),w.config.bytesType,exact],'payload '+size+'B');
    const info=(await c.call('fileInfo',[await lookup('payload-'+size)])).value;assert.equal((await c.record(info.recordId)).value.body,exact);
    payloads.push({payloadBytes:size,encodedBodyBytes:(exact.length-2)/2,supported:true,gasUsed:a.gasUsed,hash:a.hash});
  }
  // Populate one directory to exactly 32 live rows; initialization is a separate measured phase.
  let count=(await c.list(n,folder,{limit:64})).value.entries.length;
  while(count<32){await c.write('createFile',[folder,E.toUtf8Bytes('row-'+count),w.config.bytesType,body],'listing fixture '+count);w.actions.at(-1).phase='listing-setup';count++;}
  const basis=await c.observe(),reads=[];
  for(const limit of [1,16,32]) {
    const before={...c.metrics};const result=await c.list(n,folder,{limit,basis});assert.equal(result.value.entries.length,limit);
    const data=c.iface.encodeFunctionData('listDirectory',[n,folder,START,limit]);
    const estimate=await c.rpc('eth_estimateGas',[{to:w.config.kernel,data,from:n},basis.blockNumber]);
    reads.push({limit,entries:result.value.entries.length,basis,hydrationEthCalls:1,httpRequests:c.metrics.httpRequests-before.httpRequests,logicalRpcCalls:c.metrics.logicalRpcCalls-before.logicalRpcCalls,responseBytes:c.metrics.responseBytes-before.responseBytes,returnBytes:result.returnBytes,executionEstimateGas:BigInt(estimate).toString(),paidReadFee:false});
  }
  const first=await c.list(n,folder,{limit:16,basis}),second=await c.list(n,folder,{limit:16,cursor:first.value.next,basis});assert(second.value.complete);assert.equal(new Set([...first.value.entries,...second.value.entries].map(e=>e.id)).size,32);
  return {createdAt:new Date().toISOString(),profile:'Native filesystem candidate; not full-v2 parity',setup:w.setup,actions:w.actions,payloads,reads,consumerRead,checks,provenance:w.provenance,coldMeaning:'First storage initialization vs later independent transactions. Every transaction starts with cold EVM access sets.',limitations:['Plain mapping is a cost floor, not semantic parity','No storage slot counts collected','Consumer eth_call and transaction are separate measurements','No real network fees or L2 DA pricing measured']};
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  for(let run=1;run<=2;run++) {
    const result=await withWorld(exercise);
    writeFileSync(`${ROOT}evidence/benchmark-${run}.json`,JSON.stringify(result,null,2)+'\n');
    console.log(`Run ${run}: ${result.actions.length} receipts; cleanup ${result.cleanup.cacheRemoved}; steady edit ${result.actions.find(a=>a.label==='edit steady 2 41B').gasUsed} gas`);
  }
}
