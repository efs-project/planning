// Disposable fixed-workload audit. RPC observations are not authenticated proofs.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { buildRunPlan } from './required-query.mjs';
const require=createRequire(import.meta.url);
const { Transaction }=require(process.env.EFS_ETHERS_PATH??'ethers');
export const LIMITS=Object.freeze({maxRequests:8192,maxRawBytes:67108864,maxResponseBytes:2097152,requestTimeoutMs:30000,maxReceiptPolls:12});
export const INPUT_SHA256='077f59b735d2ddb3fbd9c3d432f306b0f919929b20e9a6d5402459790e96788c';
export const quantity=v=>{assert.equal(typeof v,'string','quantity string');assert.match(v,/^0x(?:0|[1-9a-f][0-9a-f]*)$/,'canonical quantity');return BigInt(v);};
const bytes=(v,n)=>{assert.equal(typeof v,'string','bytes string');assert.match(v,/^0x(?:[0-9a-fA-F]{2})*$/,'hex bytes');if(n!==undefined)assert.equal(v.length,2+n*2,'byte width');return v.toLowerCase();};
const sameBytes=(a,b,n)=>assert.equal(bytes(a,n),bytes(b,n));
const address=(a,b)=>{if(b===null)assert.equal(a,null);else sameBytes(a,b,20);};
const qeq=(a,b)=>assert.equal(quantity(a),BigInt(b));
export function normalizeRpcUrl(value){
  const url=new URL(value);
  assert.equal(url.protocol,'http:','loopback HTTP only');
  assert(['127.0.0.1','[::1]'].includes(url.hostname),'literal loopback only');
  assert(!url.username&&!url.password&&!url.hash&&!url.search&&url.pathname==='/','plain loopback endpoint');
  return url.href;
}
export function assertPermit(permit,inputSha256,sourceHashes,rpcUrl,nowMs){
  assert(permit&&typeof permit==='object','explicit permit required');
  const fixed={schema:'efs-required-query/local-permit/1',inputSha256,sourceSha256:sourceHashes,rpcUrl:normalizeRpcUrl(rpcUrl),chainId:'31337',genesisTimestamp:'1800000000',blockGasLimit:'30000000',...LIMITS};
  assert.match(inputSha256,/^[a-f0-9]{64}$/);
  assert(Object.keys(sourceHashes).length>0,'source inventory required');
  for(const [path,hash]of Object.entries(sourceHashes)){assert(path.startsWith('/'));assert.match(hash,/^[a-f0-9]{64}$/);}
  assert(Number.isSafeInteger(nowMs));
  assert(Number.isSafeInteger(permit.notBeforeMs)&&Number.isSafeInteger(permit.notAfterMs));
  assert(permit.notBeforeMs>=0&&permit.notAfterMs>permit.notBeforeMs&&permit.notAfterMs-permit.notBeforeMs<=1800000,'finite permit window');
  assert(permit.notBeforeMs<=nowMs&&nowMs<permit.notAfterMs,'permit outside time window');
  assert.deepEqual(permit,{...fixed,notBeforeMs:permit.notBeforeMs,notAfterMs:permit.notAfterMs},'exact permit inventory/settings');
  return true;
}
export function assertRpcReply(request,response){
  assert(response&&typeof response==='object'&&!Array.isArray(response),'RPC object');
  assert.equal(response.jsonrpc,'2.0');assert.equal(response.id,request.id,'RPC ID');
  const result=Object.hasOwn(response,'result'),error=Object.hasOwn(response,'error');
  assert(result!==error,'exactly one result/error');assert(!error,'RPC error');
  const value=response.result;
  if(value===null){assert.equal(request.method,'eth_getTransactionReceipt','required result is null');return null;}
  assert(value!==undefined,'missing result');
  if(['eth_chainId','eth_blockNumber','eth_getBalance','eth_getTransactionCount'].includes(request.method))quantity(value);
  else if(['eth_call','eth_getCode'].includes(request.method))bytes(value);
  else if(request.method==='eth_sendRawTransaction')bytes(value,32);
  else {assert(['eth_getBlockByNumber','eth_getTransactionByHash','eth_getTransactionReceipt'].includes(request.method),'unsupported RPC');assert(value&&typeof value==='object'&&!Array.isArray(value),'required RPC object');}
  return value;
}
export function assertHeader(header,block,parent,tx){
  qeq(header.number,block);bytes(header.hash,32);bytes(header.parentHash,32);
  qeq(header.gasLimit,30000000n);assert(quantity(header.gasUsed)<=30000000n);
  const timestamp=quantity(header.timestamp);assert(timestamp>=1800000000n&&timestamp<2000000000n,'timestamp range');
  if(block===0){qeq(header.timestamp,1800000000n);sameBytes(header.parentHash,'0x'+'00'.repeat(32),32);qeq(header.gasUsed,0);assert.deepEqual(header.transactions,[]);}
  else {assert(parent,'missing parent');qeq(parent.number,BigInt(block)-1n);sameBytes(header.parentHash,parent.hash,32);assert(timestamp>=quantity(parent.timestamp),'monotonic timestamp');assert.deepEqual(header.transactions,[tx.transactionHash],'one scheduled transaction per block');}
}
function joined(value,tx,header){
  sameBytes(value.transactionHash??value.hash,tx.transactionHash,32);qeq(value.blockNumber,tx.block);qeq(value.transactionIndex,0);bytes(value.blockHash,32);
  if(header)sameBytes(value.blockHash,header.hash,32);
  address(value.from,tx.from);address(value.to,tx.to);
}
export function assertTransaction(value,tx,header){
  joined(value,tx,header);sameBytes(value.input,tx.data);qeq(value.value,tx.value);qeq(value.type,0);qeq(value.nonce,tx.nonce);qeq(value.gas,tx.gas);qeq(value.gasPrice,tx.gasPrice);qeq(value.chainId,tx.chainId);
  const signed=Transaction.from(tx.signedRaw);
  sameBytes(value.r,signed.signature.r,32);sameBytes(value.s,signed.signature.s,32);qeq(value.v,signed.signature.networkV);
}
export function assertReceipt(value,tx,header,page){
  joined(value,tx,header);qeq(value.status,1);qeq(value.type,0);address(value.contractAddress,tx.deploymentAddress??null);
  const gas=quantity(value.gasUsed);assert(gas>0n&&gas<=BigInt(tx.gas),'receipt gas bound');qeq(value.cumulativeGasUsed,gas);qeq(value.effectiveGasPrice,tx.gasPrice);
  if(header)qeq(header.gasUsed,gas);
  assert(Array.isArray(value.logs),'receipt logs');
  value.logs.forEach((log,index)=>{
    sameBytes(log.transactionHash,tx.transactionHash,32);sameBytes(log.blockHash,value.blockHash,32);qeq(log.blockNumber,tx.block);qeq(log.transactionIndex,0);qeq(log.logIndex,index);assert.equal(log.removed,false);
    bytes(log.address,20);bytes(log.data);assert(Array.isArray(log.topics));log.topics.forEach(topic=>bytes(topic,32));
  });
  if(page){
    assert.equal(value.logs.length,1,'exact PageRead log inventory');
    const log=value.logs[0];address(log.address,tx.to);assert.deepEqual(log.topics,[page.expectedEvent.topic0]);sameBytes(log.data,page.expectedEvent.data);
  }
  return gas;
}
export function assertObservation(step,entry,id){
  assert(entry&&typeof entry==='object','missing observation');assert.equal(entry.id,id);assert.equal(entry.label,step.label,'observation label/order');
  const request={jsonrpc:'2.0',id,method:step.method,params:step.params};assert.deepEqual(entry.request,request,'exact request/basis');
  assert.equal(typeof entry.responseText,'string');assert.equal(entry.responseBytes,Buffer.byteLength(entry.responseText),'raw response byte count');
  assert(entry.responseBytes<=LIMITS.maxResponseBytes);assert.equal(entry.status,200,'HTTP status');assert(!entry.failure,'failed transport');
  const value=assertRpcReply(request,JSON.parse(entry.responseText));
  if(Object.hasOwn(step,'expected'))assert.deepEqual(value,step.expected,`literal mismatch ${step.label}`);
  return value;
}
export function createReplay(input,plan){
  // Never accept a supplied truncated/modified plan, even from the runner.
  assert.deepEqual(plan,buildRunPlan(input),'independent required inventory');
  let position=0,attempt=1,count=0,rawBytes=0;
  const headers=new Map(),receipts=new Map(),costs={};
  for(const arm of ['bScan','bSelective','c'])costs[arm]=Object.fromEntries(['deployment','setup','typePublication','commonWrite','oldPage','currentPage'].map(k=>[k,{transactions:0,gas:0n,wei:0n,signedBytes:0n,calldataBytes:0n,returnedPageBytes:0n,logicalHeaderReads:0n,logicalBodyReads:0n}]));
  function next(){const s=plan.steps[position];return !s?null:s.kind==='receipt'?{...s,label:`${s.label}/poll/${attempt}`} : s;}
  function consume(entry){
    const step=next();assert(step,'extra observation');
    const value=assertObservation(step,entry,++count);
    rawBytes+=Buffer.byteLength(JSON.stringify(entry.request))+entry.responseBytes;
    assert(count<=LIMITS.maxRequests&&rawBytes<=LIMITS.maxRawBytes,'raw transcript cap');
    const tx=step.tx===undefined?null:input.transactions[step.tx];
    if(step.kind==='balance')assert(quantity(value)>=BigInt(step.minimum),'insufficient signed-envelope balance');
    if(step.kind==='receipt'){
      if(value===null){assert(attempt<LIMITS.maxReceiptPolls,'receipt polls exhausted');attempt++;return;}
      assertReceipt(value,tx,undefined,step.page);receipts.set(tx.block,value);attempt=1;
    }
    if(step.kind==='header'){
      assertHeader(value,step.block,headers.get(step.block-1),tx);headers.set(step.block,value);
      if(tx){const receipt=receipts.get(tx.block);const page=tx.kind==='page'?input.arms[tx.arm].pages[tx.basisLabel][tx.pageIndex-1]:undefined;const gas=assertReceipt(receipt,tx,value,page);
        const category=tx.kind==='publication'?(tx.publication==='types'?'typePublication':'commonWrite'):tx.kind==='page'?(tx.basisLabel==='old'?'oldPage':'currentPage'):tx.kind;
        const c=costs[tx.arm][category];c.transactions++;c.gas+=gas;c.wei+=gas*BigInt(tx.gasPrice);c.signedBytes+=BigInt((tx.signedRaw.length-2)/2);c.calldataBytes+=BigInt((tx.data.length-2)/2);
        if(page){c.returnedPageBytes+=BigInt(page.encodedPageBytes);c.logicalHeaderReads+=BigInt(page.page.headerReads);c.logicalBodyReads+=BigInt(page.page.bodyReads);}
      }
    }
    if(step.kind==='transaction')assertTransaction(value,tx,headers.get(tx.block));
    position++;
  }
  function finish(){assert.equal(position,plan.steps.length,'missing observations');assert.equal(receipts.size,82);assert.equal(headers.size,83);
    return JSON.parse(JSON.stringify({checkedTransactions:82,checkedPages:25,headers:83,requests:count,rawBytes,auditCheckpointCalls:4100,pageValidationCalls:50,costs,evidenceGrade:'RPC_OBSERVED_NOT_AUTHENTICATED_STATE_PROOF',internalCallCounts:'UNMEASURED_NO_TRACE'},(_k,v)=>typeof v==='bigint'?v.toString():v));}
  return {next,consume,finish};
}
export function auditTranscript(input,runPlan,transcript){assert(Array.isArray(transcript));const replay=createReplay(input,runPlan);for(const entry of transcript)replay.consume(entry);return replay.finish();}
