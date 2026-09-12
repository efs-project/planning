import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {E,ROOT,artifact,withWorld} from './world.mjs';
import {seed} from './benchmark.mjs';

// Same SDK, exact workload and fresh genesis for each arm. Never two managed worlds at once.
export async function historyWorkload(w) {
  const c=w.client,n=w.config.namespace,{root,folder}=await seed(w);
  const known=new Map([[root.toLowerCase(),'root'],[folder.toLowerCase(),'folder']]);
  const logical=id=>id===E.ZeroHash?'zero':known.get(id.toLowerCase())??assert.fail('unmapped FileId');
  const states=[],reads=[];
  async function snapshot(label,file) {
    const basis=await c.observe(),info=(await c.call('fileInfo',[file],basis)).value,history=[];
    for(let revision=1n;revision<=info.revision;revision++) {
      const h=(await c.call('revisionAt',[file,revision],basis)).value;
      const record=(await c.record(h.recordId,basis)).value;
      history.push({recordId:h.recordId,parent:logical(h.parent),name:h.name,live:h.live,typeId:record.typeId,body:record.body});
    }
    const pages=[];
    for(const parent of [root,folder]) {
      const p=(await c.list(n,parent,{basis,limit:64})).value;
      pages.push({parent:logical(parent),generation:p.generation,complete:p.complete,entries:p.entries.map(e=>({...e,id:logical(e.id)}))});
    }
    states.push({label,file:logical(file),info:[...info],history,pages});
  }
  // seed's welcome file is also a deployment-qualified identity, not a portable RecordId.
  known.set((await c.call('lookup',[n,folder,E.toUtf8Bytes('Welcome.txt')])).value.toLowerCase(),'welcome');
  for(const length of [1,31,32,33,64]) {
    const name='x'.repeat(length),tag=`name-${length}`;
    const bodyFor=i=>c.body(E.toUtf8Bytes(`${length}:${i}:`.padEnd(41,'z')));
    await c.write('createFile',[folder,E.toUtf8Bytes(name),w.config.bytesType,bodyFor(0)],`${tag} create 41B`);
    const file=(await c.call('lookup',[n,folder,E.toUtf8Bytes(name)])).value;
    known.set(file.toLowerCase(),tag);
    await snapshot(`${tag} create`,file);
    for(let revision=1;revision<=3;revision++) {
      await c.write('editFile',[file,revision,w.config.bytesType,bodyFor(revision)],`${tag} edit ${revision} fresh 41B`);
      await snapshot(`${tag} edit ${revision}`,file);
    }
    await c.write('editFile',[file,4,w.config.bytesType,bodyFor(3)],`${tag} same-content edit`);
    await snapshot(`${tag} same-content`,file);
    await c.write('moveFile',[file,5,folder,E.toUtf8Bytes(name)],`${tag} same-place move`);
    await snapshot(`${tag} same-place`,file);
    await c.write('moveFile',[file,6,root,E.toUtf8Bytes('y'.repeat(length))],`${tag} move rename`);
    await snapshot(`${tag} move rename`,file);
    await c.write('editFile',[file,7,w.config.bytesType,bodyFor(4)],`${tag} post-move edit fresh 41B`);
    await snapshot(`${tag} post-move edit`,file);
    await c.write('unlink',[file,8],`${tag} unlink`);
    await snapshot(`${tag} unlink`,file);
    await assert.rejects(()=>c.write('editFile',[file,9,w.config.bytesType,bodyFor(5)],`${tag} tombstone failure`));
    await snapshot(`${tag} tombstone failure`,file);
    const basis=await c.observe();
    for(const revision of [1,5,7,9]) {
      const before={...c.metrics};
      const result=await c.call('revisionAt',[file,revision],basis);
      const data=c.iface.encodeFunctionData('revisionAt',[file,revision]);
      const executionEstimateGas=BigInt(await c.rpc('eth_estimateGas',[{to:w.config.kernel,data,from:n},basis.blockNumber])).toString();
      reads.push({label:`${tag} revision ${revision}`,basis,returnBytes:result.returnBytes,executionEstimateGas,paidReadFee:false,ethCalls:1,httpRequests:c.metrics.httpRequests-before.httpRequests});
    }
  }
  const producerInterface=new E.Interface(artifact('QuoteProducer').abi),consumerInterface=new E.Interface(artifact('QuoteReader').abi);
  const contractInterop={publications:[]};
  const readArgs=[w.config.kernel,w.producer,w.config.quoteType];
  let publishedFile;
  for(const [value,expected,label] of [[3000,0,'initial'],[3100,1,'update']]) {
    const action=await c.sendData(`producer uint256 ${label}`,producerInterface.encodeFunctionData('publish',[value,expected]),w.producer);
    const basis=await c.observe();
    assert.equal(basis.blockNumber,action.receipt.blockNumber);assert.equal(basis.blockHash,action.receipt.blockHash);
    const result=(await c.call('read',readArgs,basis,w.consumer,consumerInterface)).value;
    assert.equal(result[0],BigInt(value));assert.equal(result[2],BigInt(expected+1));
    if(publishedFile) assert.equal(result[1],publishedFile);
    publishedFile=result[1];
    const info=(await c.call('fileInfo',[result[1]],basis)).value;
    assert.equal(info.owner.toLowerCase(),w.producer.toLowerCase());assert.equal(info.live,true);assert.equal(info.directory,false);
    const body=E.AbiCoder.defaultAbiCoder().encode(['uint256'],[value]);
    const record=(await c.record(info.recordId,basis)).value;
    assert.equal(record.typeId,w.config.quoteType);assert.equal(record.body,body);
    assert.equal(info.recordId,c.recordId(w.config.quoteType,body));
    action.benchmarkCanonicalCheck={basis,value,revision:expected+1,fileId:result[1],recordId:info.recordId,typeId:record.typeId,body};
    contractInterop.publications.push({label,value,revision:expected+1,recordId:info.recordId,typeId:record.typeId,body});
  }
  const basis=await c.observe();
  const quote=await c.call('read',readArgs,basis,w.consumer,consumerInterface);
  const data=consumerInterface.encodeFunctionData('read',readArgs);
  contractInterop.consumerRead={basis,value:quote.value[0].toString(),revision:quote.value[2].toString(),returnBytes:quote.returnBytes,
    executionEstimateGas:BigInt(await c.rpc('eth_estimateGas',[{to:w.consumer,from:n,data},basis.blockNumber])).toString(),paidReadFee:false};
  const consumerAction=await c.sendData('consumer uint256 read transaction',data,w.consumer);
  const after=await c.call('read',readArgs,undefined,w.consumer,consumerInterface);
  assert.equal(after.basis.blockNumber,consumerAction.receipt.blockNumber);assert.equal(after.basis.blockHash,consumerAction.receipt.blockHash);
  assert.equal(after.value[0],3100n);assert.equal(after.value[2],2n);
  consumerAction.benchmarkCanonicalCheck={basis:after.basis,value:3100,revision:2};
  for(const action of w.actions) assert(['COMMITTED','REVERTED'].includes(action.status)||(action.status==='MINED_UNVERIFIED'&&action.benchmarkCanonicalCheck));
  return {createdAt:new Date().toISOString(),profile:'SAME-PROFILE history indirection; disposable fresh-genesis experiment, not production/freeze',
    setup:w.setup,actions:w.actions,states,reads,contractInterop,provenance:w.provenance,
    limitations:['Receipt gas is actual local EVM gas, not a network fee quote','Every transaction has cold access sets; steady means initialized persistent state','Read execution estimates are eth_estimateGas on pinned eth_call input, not paid receipts','Fresh storage-word assertions are separate Forge instrumentation, not receipt-gas estimates','Baseline kernel provenance is kernelArtifact, not the current working sourcePins','No generic full-v2 semantic parity claim']};
}

export async function pairedHistory() {
  const baseline=await withWorld(historyWorkload,{kernelArtifact:'baseline-aa6b1b6'});
  const current=await withWorld(historyWorkload,{kernelArtifact:'current'});
  assert.equal(baseline.cleanup.cacheRemoved,true);assert.equal(current.cleanup.cacheRemoved,true);
  assert.deepEqual(current.states,baseline.states,'SDK state/history after every action; only FileIds normalized');
  assert.deepEqual(current.contractInterop.publications,baseline.contractInterop.publications,'canonical contract-produced uint256 records');
  assert.equal(current.actions.length,baseline.actions.length);
  const comparison=current.actions.map((a,i)=>{
    const b=baseline.actions[i];assert.equal(a.label,b.label);
    return {label:a.label,baselineGas:b.gasUsed,currentGas:a.gasUsed,savedGas:(BigInt(b.gasUsed)-BigInt(a.gasUsed)).toString()};
  });
  return {baseline,current,comparison};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const result=await pairedHistory();
  writeFileSync(`${ROOT}evidence/history-comparison.json`,JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
  console.log(JSON.stringify({receiptsPerArm:result.current.actions.length,afterOperationSnapshots:result.current.states.length,cleanup:[result.baseline.cleanup.cacheRemoved,result.current.cleanup.cacheRemoved],comparison:result.comparison}));
}
