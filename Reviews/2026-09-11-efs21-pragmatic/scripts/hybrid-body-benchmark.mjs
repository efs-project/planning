import assert from 'node:assert/strict';
import {existsSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {E,ROOT,artifact,build,withWorld,observeBody} from './world.mjs';
export {observeBody} from './world.mjs';
import {workload} from './body-storage-benchmark.mjs';

const abi=E.AbiCoder.defaultAbiCoder();
const json=v=>JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='bigint'?String(x):x));
export function matrix({final=false}={}){
  const rows=[];
  function add(length,occupied,placement='first',style='dispersed'){
    const body=new Uint8Array(length),count=Math.ceil(length/32);
    assert(occupied<=count);
    for(let n=0;n<occupied;n++){
      const word=placement==='last'?count-1-n:n;
      if(style==='dense')body.fill(0xef,word*32,Math.min(length,(word+1)*32));
      else body[word*32]=0xef;
    }
    rows.push({label:`raw ${length} ${occupied} ${placement} ${style}`,type:'raw',body:E.hexlify(body),length,occupied,placement,style});
  }
  for(const length of [0,1,20,31,32,33,41,63,64,65,256,4032,4096]){
    add(length,0);if(length)add(length,Math.ceil(length/32),'first','dense');
  }
  for(const length of [256,4032,4096])for(const occupied of [...new Set([1,2,3,4,Math.ceil(length/32/4),Math.ceil(length/32/2)])])add(length,occupied);
  for(const length of [33,65,256,4096])add(length,1,'last');
  // Equal byte count, unequal occupied-word count; neither byte density nor length suffices.
  rows.push({label:'raw 256 concentrated four bytes',type:'raw',body:'0xefefefef'+'00'.repeat(252),length:256,occupied:1});
  rows.push({label:'canonical empty headers',type:'canonical',body:abi.encode(['bytes'],['0x']),length:64,occupied:1});
  rows.push({label:'canonical 41 zero headers',type:'canonical',body:abi.encode(['bytes'],[new Uint8Array(41)]),length:128,occupied:2});
  if(final)for(const length of [636,637,638])add(length,7);
  return rows;
}


async function receipts(w){
  for(const a of [...w.setup,...w.actions]){
    const tx=await w.client.rpc('eth_getTransactionByHash',[a.hash]);a.transaction=tx;a.calldata=tx.input;
    assert.equal(E.keccak256(tx.input),a.calldataHash);
    const bytes=E.getBytes(tx.input),zero=bytes.filter(b=>b===0).length;
    a.intrinsicGas=String(21000+4*zero+16*(bytes.length-zero)+(tx.to?0:32000+2*Math.ceil(bytes.length/32)));
    const block=await w.client.rpc('eth_getBlockByNumber',[a.receipt.blockNumber,false]);
    assert.equal(block.hash,a.receipt.blockHash);assert(BigInt(block.gasUsed)<=16777216n);
    a.block={number:block.number,hash:block.hash,gasUsed:block.gasUsed,gasLimit:block.gasLimit};
  }
}

export async function matrixWorkload(w,{final=false}={}){
  const seen=new Set(),observations=[],c=w.client,helper=w.provenance.runtimes.BodyWriter.address;
  for(const row of matrix({final})){
    const type=row.type==='raw'?w.config.rawType:w.config.bytesType;
    const id=E.keccak256(abi.encode(['bytes32','bytes32','bytes'],[E.id('EFS21_RECORD_V1'),type,row.body]));
    const before=BigInt(await c.rpc('eth_getTransactionCount',[helper,'latest']));
    const a=await c.write('storeRecord',[type,row.body],row.label);
    const basis=await c.observe(a.receipt.blockNumber),observation=await observeBody(w,id,row.body,basis),dedup=seen.has(id);
    const after=BigInt(await c.rpc('eth_getTransactionCount',[helper,basis.blockNumber]));
    assert.equal(after-before,dedup||observation.backend===1?0n:1n);
    const record=await c.record(id,basis);assert.equal(record.value.body,row.body);assert.equal(record.value.typeId,type);
    a.workload={...row,id,typeId:type,dedup};a.observation={...observation,helperNonceBefore:String(before),helperNonceAfter:String(after)};
    a.independentEffect={typeId:type,body:record.value.body,returnBytes:record.returnBytes,basis};
    observations.push(a.observation);seen.add(id);
    if(final&&['raw 0 0 first dispersed','raw 1 1 first dense','raw 41 0 first dispersed','raw 256 3 first dispersed','raw 256 4 first dispersed','raw 4096 0 first dispersed','raw 4096 128 first dense','raw 637 7 first dispersed'].includes(row.label)){
      const iface=new E.Interface(artifact('BodyReadConsumer').abi);
      for(const count of [1,2]){
        const consumer=await w.deploy('BodyReadConsumer');
        const paid=await c.sendData(`matrix paid read ${row.label} ${count}`,iface.encodeFunctionData('capture',[w.config.kernel,id,count]),consumer);
        const rb=await c.observe(paid.receipt.blockNumber);
        assert.equal((await c.call('lastDigest',[],rb,consumer,iface)).value,E.keccak256(row.body));
        assert.equal((await c.call('lastReads',[],rb,consumer,iface)).value,BigInt(count));
        paid.workload={...row,id,typeId:type,readCount:count};paid.independentEffect={digest:E.keccak256(row.body),count,basis:rb};
      }
    }
  }
  await receipts(w);
  return {selection:w.provenance.kernelArtifact.selection,setup:w.setup,actions:w.actions,observations,provenance:w.provenance};
}

async function lateFailures(w){
  const c=w.client,root=(await c.call('rootId',[w.config.namespace])).value;
  const file=(await c.call('lookup',[w.config.namespace,root,E.toUtf8Bytes('raw-41-duplicate')])).value;
  for(const [pattern,body] of [['dense','0x'+'cc'.repeat(256)],['sparse','0x'+'00'.repeat(255)+'cc']])for(const fault of ['name','discovery']){
    const id=E.keccak256(abi.encode(['bytes32','bytes32','bytes'],[E.id('EFS21_RECORD_V1'),w.config.rawType,body]));
    async function state(){
      const basis=await c.observe(),helper=w.provenance.runtimes.BodyWriter.address,nonce=await c.rpc('eth_getTransactionCount',[helper,basis.blockNumber]);
      const words=BigInt(E.keccak256(abi.encode(['bytes32','uint256'],[id,6]))),metadata=BigInt(E.keccak256(abi.encode(['bytes32','uint256'],[id,3])));
      const slots=[];for(const slot of [metadata,metadata+1n,...Array.from({length:8},(_,i)=>words+BigInt(i))])slots.push(await c.rpc('eth_getStorageAt',[w.config.kernel,E.toBeHex(slot,32),basis.blockNumber]));
      return {nonce,slots,nextChild:await c.rpc('eth_getCode',[E.getCreateAddress({from:helper,nonce:BigInt(nonce)}),basis.blockNumber]),file:json((await c.call('fileInfo',[file],basis)).value),history:json((await c.call('revisionAt',[file,1],basis)).value),directory:json((await c.call('listDirectory',[w.config.namespace,root,[E.ZeroHash,0,0],64],basis)).value)};
    }
    const before=await state(),discovery=w.provenance.runtimes.DiscoveryIndex.address,original=await c.rpc('eth_getCode',[discovery,'latest']);
    if(fault==='discovery')await c.rpc('anvil_setCode',[discovery,'0x00']);
    try{
      await assert.rejects(()=>fault==='name'?c.write('createFile',[root,E.toUtf8Bytes('raw-41-duplicate'),w.config.rawType,body],`hybrid refuse ${pattern} ${fault}`):c.write('editFile',[file,1,w.config.rawType,body],`hybrid refuse ${pattern} ${fault}`),/reverted/i);
    }finally{if(fault==='discovery')await c.rpc('anvil_setCode',[discovery,original]);}
    const a=w.actions.at(-1),after=await state();assert.deepEqual(after,before);await assert.rejects(()=>c.record(id));
    a.workload={body,pattern,fault,id};a.independentEffect={status:'VERIFIED_LATE_ROLLBACK',before,after};
  }
}

export async function finalWorkload(w){
  const whole=await workload(w,{allowHybrid:true,sweep:false});
  const matrixResult=await matrixWorkload(w,{final:true});
  await lateFailures(w);await receipts(w);
  return {...whole,matrixObservations:matrixResult.observations};
}

export function compareFinalArms(arms){
  assert.deepEqual(arms.map(a=>a.selection),['baseline-f43501a','forced-code','forced-words','current']);
  for(const arm of arms)assert.equal(arm.actions.length,arms[0].actions.length,'same finite action count');
  const comparison=arms[0].actions.map((a,i)=>{
    const rows=arms.map(arm=>arm.actions[i]);
    for(const b of rows.slice(1)){assert.equal(b.label,a.label);assert.equal(b.calldata,a.calldata);assert.equal(b.status,a.status);assert.deepEqual(b.workload,a.workload);assert.equal(b.intrinsicGas,a.intrinsicGas);}
    const costs=rows.map((r,j)=>({arm:arms[j].selection,gas:r.gasUsed,intrinsicGas:r.intrinsicGas,hash:r.hash,blockNumber:r.receipt.blockNumber,blockHash:r.receipt.blockHash,backend:r.observation?.backend}));
    const backend=rows[3].observation?.backend;
    return {...a.workload,label:a.label,status:a.status,costs,savedVsFrozen:String(BigInt(costs[0].gas)-BigInt(costs[3].gas)),regretVsBestForced:String(BigInt(costs[3].gas)-(BigInt(costs[1].gas)<BigInt(costs[2].gas)?BigInt(costs[1].gas):BigInt(costs[2].gas))),...(backend===undefined?{}:{selectedBackend:backend,selectedPhysicalMisselection:BigInt(costs[backend===0?1:2].gas)>BigInt(costs[backend===0?2:1].gas)})};
  });
  for(const arm of arms.slice(1)){
    assert.deepEqual(arm.types,arms[0].types);assert.deepEqual(arm.memberships,arms[0].memberships);
    assert.deepEqual(arm.reads.map(r=>[r.label,r.returnValue,r.returnBytes]),arms[0].reads.map(r=>[r.label,r.returnValue,r.returnBytes]));
    for(const name of ['RawBytesValidator','BytesValidator','Uint256Validator','ExpandedTypeRegistry','DiscoveryIndex','NavigationIndex','BodyWriter'])assert.deepEqual(arm.provenance.runtimes[name],arms[0].provenance.runtimes[name]);
    assert.deepEqual(arm.setup.map(r=>r.label),arms[0].setup.map(r=>r.label));
    for(let i=1;i<arm.setup.length;i++)assert.equal(arm.setup[i].calldata,arms[0].setup[i].calldata);
  }
  return comparison;
}

export async function benchmarkHybrid(){
  const status=spawnSync('git',['status','--porcelain','--','contracts/src','contracts/test','scripts','sdk','web','test'],{cwd:ROOT,encoding:'utf8'});
  assert.equal(status.status,0);assert.equal(status.stdout.trim(),'','final receipts require committed source/support freeze');
  const inspection=spawnSync('forge',['inspect','--force','NativeKernel','storage-layout','--json'],{cwd:ROOT+'contracts',encoding:'utf8',timeout:180000});
  assert.equal(inspection.status,0,inspection.stderr);
  const storageLayout=JSON.parse(inspection.stdout);
  assert.equal(storageLayout.storage.find(s=>s.label==='sparseBodyWords').slot,'6');
  build();const arms=[];
  for(const kernelArtifact of ['baseline-f43501a','forced-code','forced-words','current'])arms.push(await withWorld(finalWorkload,{kernelArtifact,buildFirst:false,watchdogMs:300000}));
  return {createdAt:new Date().toISOString(),standing:'Fresh-genesis four-arm native hybrid experiment; no adoption or lifetime optimum',storageLayout,policy:{wordsNonzero:22300,wordsLoop:240,codeFixed:33500,codeByte:200,tie:'code',scan:'full masked word scan on new records only; forced overrides keep the loop in observed compiled receipts, not an isolated selector-cost control'},limits:{runtime:24576,initcode:49152,body:4096,transactionAndBlockGas:16777216},arms,comparison:compareFinalArms(arms)};
}

export async function calibrate(){
  build();const arms=[];
  for(const kernelArtifact of ['baseline-f43501a','forced-code','forced-words'])arms.push(await withWorld(matrixWorkload,{kernelArtifact,buildFirst:false,watchdogMs:300000}));
  const comparison=arms[0].actions.map((a,i)=>{
    for(const arm of arms.slice(1)){assert.equal(arm.actions[i].calldata,a.calldata);assert.deepEqual(arm.actions[i].workload,a.workload);}
    return {label:a.label,...a.workload,costs:arms.map(arm=>({arm:arm.selection,gas:arm.actions[i].gasUsed,intrinsicGas:arm.actions[i].intrinsicGas,backend:arm.actions[i].observation.backend}))};
  });
  return {createdAt:new Date().toISOString(),standing:'Finite calibration only; dirty source hashes and artifact pins retained, not final-source receipts or a selected policy',arms,comparison};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.argv.includes('--probe')){
    // Real CLI/TLA regression, one namespace action only, no evidence output.
    console.log(JSON.stringify(await withWorld(w=>workload(w,{allowHybrid:true,namespaceOnly:true}))));
  }else{
  const calibration=process.argv.includes('--calibrate');
  assert(calibration||process.argv.includes('--final'),'choose explicit --calibrate or --final');
  assert(!existsSync(ROOT+`evidence/${calibration?'hybrid-calibration':'hybrid-body-final'}.json`),'exclusive evidence path already exists; refuse before building/worlds');
  const result=await (calibration?calibrate():benchmarkHybrid());
  writeFileSync(ROOT+`evidence/${calibration?'hybrid-calibration':'hybrid-body-final'}.json`,JSON.stringify(json(result),null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({rows:result.comparison.length,cleanup:result.arms.map(a=>a.cleanup),comparison:result.comparison.filter(r=>calibration||/quote |file raw-(41|4032) edit fresh|matrix paid read raw 4096|raw 63[678] /.test(r.label)).map(({label,costs})=>({label,gas:costs.map(c=>c.gas)}))},null,2));
  }
}
