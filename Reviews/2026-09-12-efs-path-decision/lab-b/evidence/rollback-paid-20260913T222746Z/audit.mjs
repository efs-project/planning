// Offline only. Expected answers come exclusively from the pre-run reviewed JSON.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {Transaction,recoverAddress,getCreateAddress,keccak256,AbiCoder}=require('/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers');
const EXPECTATION_SHA='0b26e6d2a0037de6f89089eece41cbb1174a76eb87e8de945d9c599bf8b28622';
const sha=b=>createHash('sha256').update(b).digest('hex');
const hex=(x,n)=>{assert.equal(typeof x,'string');assert.match(x,/^0x(?:[0-9a-fA-F]{2})*$/);if(n!==undefined)assert.equal(x.length,2+2*n);return x.toLowerCase();};
const address=x=>hex(x,20),hash=x=>hex(x,32);
const qty=x=>{assert.equal(typeof x,'string');assert.match(x,/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/);return BigInt(x);};
const eq=(x,y,label)=>assert.deepEqual(x,y,label);
const canonical=x=>typeof x==='string'&&x.startsWith('0x')?x.toLowerCase():Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const same=(x,y,label)=>eq(canonical(x),canonical(y),label);
const own=(o,k)=>Object.hasOwn(o,k);
const exactlyOne=(xs,label)=>{eq(xs.length,1,label+' unique observation');return xs[0];};
const packet=process.argv[2]??'/tmp/efs-b-controls-paid-20260913.00DzB4/result';
const expectationPath=process.argv[3]??'/tmp/efs-b-controls-paid-20260913.00DzB4/expectations-node26.json';
const result={schema:'efs-lab-b/independent-rollback-audit/1',standing:'RPC_OBSERVED; not authenticated state proof',checks:{rawEnvelopes:0,readReplies:0,signedTransactions:0,deployments:0,staticMinedLinks:0,headers:0},limitations:[
 'Raw reads use block numbers, not EIP-1898 requireCanonical block hashes. This audit joins their fixed numbers to mutually consistent retained headers and mined receipt hashes; it cannot supply an authenticated state proof or exclude a dishonest RPC.',
 'Artifact hashes/runtime observations are checked against frozen preparation. Compiler/source provenance and correctness of the reviewed late-refusal fixture remain prior review inputs, not established by RPC or this audit.',
 'Static refusal plus mined status 0 and identical signed transaction envelope establishes the scoped RPC-observed linkage; it is not an execution trace of internal writes.'
]};
try{
 const expectationBytes=fs.readFileSync(expectationPath);eq(sha(expectationBytes),EXPECTATION_SHA,'frozen expectation SHA256');
 const expected=JSON.parse(expectationBytes),rawBytes=fs.readFileSync(packet+'/raw.jsonl'),reportBytes=fs.readFileSync(packet+'/report.json');
 const raw=rawBytes.toString().trimEnd().split('\n').map(line=>JSON.parse(line)),report=JSON.parse(reportBytes);
 eq(expected.schema,'efs-lab-b/rollback-expectations/1');eq(report.schema,'efs-lab-b/rollback-report/1');eq(report.failure,null,'runner has no incomplete/failure record');
 eq(raw.length,report.raw.envelopes,'retained raw count');assert(raw.length>0&&raw.length<=2048);assert(rawBytes.length<=8*1024*1024+raw.length,'raw bound');
 eq(raw.reduce((n,r)=>n+Buffer.byteLength(JSON.stringify(r)),0),report.raw.bytes,'raw byte count');
 const allowed=new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_accounts','eth_getTransactionCount','eth_gasPrice','eth_sendRawTransaction','eth_getTransactionReceipt','eth_getTransactionByHash','eth_getBlockByHash','eth_getCode','eth_call']);
 const byId=new Map();
 for(const [i,row]of raw.entries()){
  const {request:q,response:r}=row;eq(row.httpStatus,200,'HTTP success');eq(q.jsonrpc,'2.0');eq(r.jsonrpc,'2.0');eq(q.id,i+1,'strict raw ID sequence');eq(r.id,q.id,'response ID');assert(!byId.has(q.id));byId.set(q.id,row);
  assert(allowed.has(q.method),'unexpected RPC method '+q.method);assert(Array.isArray(q.params));assert(own(r,'result')!==own(r,'error'),'exactly one RPC result/error');
  if(own(r,'error'))assert(q.method==='eth_call'&&['scale7:static','lateIndex:static'].includes(row.label),'unexpected RPC error');
 }
 result.checks.rawEnvelopes=raw.length;
 const rows=method=>raw.filter(r=>r.request.method===method);
 const good=row=>{assert(!own(row.response,'error'),'unexpected error for '+row.label);return row.response.result;};
 eq(qty(good(exactlyOne(rows('eth_chainId'),'chain id'))),31337n);
 eq(qty(good(exactlyOne(raw.filter(r=>r.label==='initial block'),'initial block'))),0n);
 const gasQuote=qty(good(exactlyOne(rows('eth_gasPrice'),'gas quote'))),gasPrice=gasQuote*2n+1n;
 eq(report.chain.chainId,'31337');eq(BigInt(report.chain.gasPrice),gasPrice);
 // Both header methods must agree for every observed block; all 0..36 must be retained.
 const headers=new Map();
 for(const row of [...rows('eth_getBlockByHash'),...rows('eth_getBlockByNumber')]){
  const b=good(row);assert(b&&typeof b==='object','header missing');const n=qty(b.number);hash(b.hash);hash(b.parentHash);
  eq(row.request.params[1],false,'hash-only transaction listing requested');
  if(row.request.method==='eth_getBlockByHash')eq(hash(row.request.params[0]),hash(b.hash),'requested header hash');else eq(qty(row.request.params[0]),n,'requested header number');
  assert(Array.isArray(b.transactions));b.transactions.forEach(hash);
  if(headers.has(n.toString()))same(b,headers.get(n.toString()),'inconsistent header at '+n);else headers.set(n.toString(),b);
 }
 eq(headers.size,37,'complete 0..36 observed header sequence');
 for(let n=0;n<=36;n++){
  const b=headers.get(String(n));assert(b,'missing header '+n);assert(qty(b.timestamp)<2000000000n,'header deadline');
  if(n===0){eq(qty(b.timestamp),1800000000n);eq(b.transactions.length,0);eq(hash(report.chain.genesisHash),hash(b.hash));}
  else {const previous=headers.get(String(n-1));eq(hash(b.parentHash),hash(previous.hash),'parent chain '+n);assert(qty(b.timestamp)>=qty(previous.timestamp),'monotone timestamps');eq(b.transactions.length,1,'one mined transaction per sealed block');}
 }
 result.checks.headers=headers.size;
 const sends=rows('eth_sendRawTransaction');eq(sends.length,36,'exact sealed transaction count');
 const signed=sends.map(send=>{eq(send.request.params.length,1);const bytes=hex(send.request.params[0]),tx=Transaction.from(bytes);assert(tx.isSigned(),'signed transaction');eq(tx.type,0,'sealed legacy transaction type');eq(tx.chainId,31337n);eq(tx.value,0n);eq(tx.gasPrice,gasPrice);eq(hex(tx.serialized),bytes,'canonical signed encoding');eq(address(recoverAddress(tx.unsignedHash,tx.signature)),address(tx.from),'recovered sender');eq(hash(tx.hash),hash(keccak256(bytes)),'signed bytes hash');eq(hash(good(send)),hash(tx.hash),'send response hash');return {send,tx};});
 const transactionChecks=[];
 const verifyTransaction=(want,block,gas)=>{
  const entry=exactlyOne(signed.filter(({tx})=>address(tx.from)===address(want.from)&&tx.nonce===Number(want.nonce)),`sender nonce ${want.from}/${want.nonce}`),{tx,send}=entry;
  eq(tx.to===null?null:address(tx.to),want.to===null?null:address(want.to),'signed destination');eq(tx.gasLimit,BigInt(gas),'explicit gas limit');
  if(want.data!==undefined)eq(hex(tx.data),hex(want.data),'signed calldata');
  if(want.initcodeHash!==undefined){eq(hash(keccak256(tx.data)),hash(want.initcodeHash),'initcode hash');eq((tx.data.length-2)/2,want.initcodeBytes,'initcode bytes');}
  const txRows=rows('eth_getTransactionByHash').filter(r=>hash(r.request.params[0])===hash(tx.hash));const txRow=exactlyOne(txRows,'mined tx '+block),mined=good(txRow);assert(mined,'mined tx missing');
  eq(hash(mined.hash),hash(tx.hash));eq(address(mined.from),address(tx.from));eq(mined.to===null?null:address(mined.to),tx.to===null?null:address(tx.to));eq(hex(mined.input),hex(tx.data));
  eq(qty(mined.nonce),BigInt(tx.nonce));eq(qty(mined.gas),tx.gasLimit);eq(qty(mined.gasPrice),tx.gasPrice);eq(qty(mined.value),0n);eq(qty(mined.type),0n);eq(qty(mined.chainId),31337n);
  eq(BigInt(mined.r),BigInt(tx.signature.r));eq(BigInt(mined.s),BigInt(tx.signature.s));eq(BigInt(mined.v),tx.signature.networkV,'transaction signature v');
  const receiptRows=rows('eth_getTransactionReceipt').filter(r=>hash(r.request.params[0])===hash(tx.hash));assert(receiptRows.length>0,'receipt requests missing');
  const finalReceipt=exactlyOne(receiptRows.filter(r=>good(r)!==null),'non-null receipt '+block),receipt=good(finalReceipt),header=headers.get(String(block));
  assert(send.request.id<finalReceipt.request.id,'send precedes receipt');assert(txRow.request.id>finalReceipt.request.id,'mined transaction read after receipt');eq(hash(receipt.transactionHash),hash(tx.hash));eq(address(receipt.from),address(tx.from));eq(receipt.to===null?null:address(receipt.to),tx.to===null?null:address(tx.to));
  eq(qty(receipt.status),BigInt(want.status));eq(qty(receipt.blockNumber),BigInt(block));eq(hash(receipt.blockHash),hash(header.hash));eq(qty(receipt.transactionIndex),0n);eq(qty(mined.transactionIndex),0n);
  eq(qty(mined.blockNumber),BigInt(block));eq(hash(mined.blockHash),hash(header.hash));eq(hash(header.transactions[0]),hash(tx.hash));
  const gasUsed=qty(receipt.gasUsed);assert(gasUsed>0n&&gasUsed<=tx.gasLimit);eq(qty(receipt.cumulativeGasUsed),gasUsed);eq(qty(header.gasUsed),gasUsed);
  if(want.status===0)eq(receipt.logs,[],'reverted transaction leaves no logs');
  const nonceRows=rows('eth_getTransactionCount').filter(r=>address(r.request.params[0])===address(tx.from)&&r.label===send.label+':nonce');
  const nonceRow=exactlyOne(nonceRows.filter(r=>r.request.id<send.request.id&&qty(good(r))===BigInt(tx.nonce)),'pre-send nonce '+block);eq(nonceRow.request.params[1],'latest');
  transactionChecks.push({block,hash:tx.hash,gasUsed:gasUsed.toString(),sendId:send.request.id,receiptId:finalReceipt.request.id});result.checks.signedTransactions++;
  return {tx,send,receipt,header,receiptId:finalReceipt.request.id,gasUsed};
 };
 for(const [armIndex,name]of ['scale7','lateIndex','calibration'].entries()){
  const e=expected.arms[name],r=report.arms[name];assert(r,'report arm missing '+name);eq(Number(e.pre.blockNumber),armIndex*12+11);eq(Number(e.post.blockNumber),armIndex*12+12);
  same(r.deployment,e.deployment,'reported deployment pins '+name);same(r.setupTransactions,e.setupTransactions,'reported setup inputs '+name);same(r.types,e.types);same(r.fixture,e.fixture);same(r.a1,e.a1);
  eq(r.deployerIndex,e.deployerIndex);eq(r.authorIndex,e.authorIndex);
  const deployer=e.setupTransactions[0].from;
  for(const d of e.deployment){
   const block=armIndex*12+d.nonce+1,checked=verifyTransaction({from:deployer,to:null,nonce:d.nonce,initcodeHash:d.initcodeHash,initcodeBytes:d.initcodeBytes,status:1},block,15000000);
   eq(address(getCreateAddress({from:deployer,nonce:d.nonce})),address(d.address),'CREATE derivation');eq(address(checked.receipt.contractAddress),address(d.address));
   const codeRow=exactlyOne(rows('eth_getCode').filter(row=>address(row.request.params[0])===address(d.address)&&qty(row.request.params[1])===BigInt(block)),'runtime '+name+'/'+d.role);
   assert(codeRow.request.id>checked.receiptId,'runtime after deployment');const code=hex(good(codeRow));eq(hash(keccak256(code)),hash(d.runtimeCodehash));eq((code.length-2)/2,d.runtimeBytes);eq(BigInt(report.gas.deployment[name][d.role]),checked.gasUsed);
   result.checks.deployments++;
  }
  let prefixReceiptId;
  for(const s of e.setupTransactions){const checked=verifyTransaction({...s,status:1},armIndex*12+s.nonce+1,8000000);eq(checked.receipt.contractAddress,null);eq(BigInt(report.gas.setup[name][s.label]),checked.gasUsed);if(s.label==='prefix')prefixReceiptId=checked.receiptId;}
  assert(Number.isSafeInteger(prefixReceiptId),'prefix receipt linkage');
  const attempt=verifyTransaction({...e.attempt,status:e.attempt.expectedStatus},Number(e.post.blockNumber),3000000);
  eq(attempt.receipt.contractAddress,null);eq(hash(r.mined.transactionHash),hash(attempt.tx.hash));eq(r.mined.classification.status,e.attempt.expectedStatus);eq(BigInt(r.mined.classification.gasUsed),attempt.gasUsed);eq(hash(r.mined.classification.blockHash),hash(attempt.header.hash));eq(BigInt(report.gas.control[name]),attempt.gasUsed);
  const staticRow=exactlyOne(raw.filter(row=>row.label===name+':static'),'static '+name);eq(staticRow.request.method,'eth_call');eq(staticRow.request.params.length,2);
  const call=staticRow.request.params[0];same(Object.keys(call).sort(),['data','from','gas','to']);eq(address(call.from),address(attempt.tx.from));eq(address(call.to),address(attempt.tx.to));eq(hex(call.data),hex(attempt.tx.data));eq(qty(call.gas),attempt.tx.gasLimit);eq(qty(staticRow.request.params[1]),BigInt(e.pre.blockNumber));assert(staticRow.request.id<attempt.send.request.id,'static precedes send');
  eq(r.static.rpcId,staticRow.request.id);eq(address(r.mined.link.from),address(call.from));eq(address(r.mined.link.to),address(call.to));eq(hex(r.mined.link.data),hex(call.data));eq(hash(r.mined.link.transactionHash),hash(attempt.tx.hash));
  if(e.attempt.errorData!==null){
   assert(own(staticRow.response,'error'),'required static refusal');const err=staticRow.response.error;assert(Number.isInteger(err.code));assert(typeof err.message==='string');
   // Anvil's literal error.data is expected. A different transport shape is a gap, never inferred from text.
   assert.equal(typeof err.data,'string','GAP: literal error.data unavailable');eq(hex(err.data),hex(e.attempt.errorData),'exact refusal bytes');eq(hex(r.static.errorData),hex(e.attempt.errorData));
  }else{
   const success=AbiCoder.defaultAbiCoder().encode(['uint64','uint64'],[2,4]);eq(hex(good(staticRow)),success,'calibration publication2/first4 return');eq(hex(r.static.returnData),success);
  }
  result.checks.staticMinedLinks++;
  for(const stage of ['pre','post']){
   const block=BigInt(e[stage].blockNumber),header=headers.get(block.toString());eq(r[stage].blockNumber,e[stage].blockNumber);eq(hash(r[stage].blockHash),hash(header.hash));
   for(const [callsField,returnsField,count]of [['readCalls','reads',69],['auxiliaryReadCalls','auxiliaryReads',19]]){
    const calls=e[callsField],answers=e[stage][returnsField];eq(Object.keys(calls).length,count);eq(Object.keys(answers).sort(),Object.keys(calls).sort());same(r[stage][returnsField],answers,'report read map '+name+'/'+stage+'/'+returnsField);
    for(const [label,want]of Object.entries(calls)){
     const row=exactlyOne(rows('eth_call').filter(x=>x.label==='read:'+label&&x.request.params.length===2&&qty(x.request.params[1])===block&&address(x.request.params[0].to)===address(want.to)&&hex(x.request.params[0].data)===hex(want.data)),name+'/'+stage+'/'+label);
     same(Object.keys(row.request.params[0]).sort(),['data','to']);eq(hex(good(row)),hex(answers[label]),'literal reply '+name+'/'+stage+'/'+label);
     if(stage==='pre'){assert(row.request.id>prefixReceiptId,'pre-read after native prefix receipt');assert(row.request.id<staticRow.request.id,'pre-read before static');}else assert(row.request.id>attempt.receiptId,'post-read after mined receipt');
     result.checks.readReplies++;
    }
   }
  }
  if(e.attempt.expectedStatus===0){same(e.pre.reads,e.post.reads,'frozen rollback expectations');same(e.pre.auxiliaryReads,e.post.auxiliaryReads,'frozen auxiliary rollback');}
 }
 eq(result.checks.readReplies,528);eq(result.checks.signedTransactions,36);eq(result.checks.deployments,18);eq(result.checks.staticMinedLinks,3);
 eq(rows('eth_getCode').length,18,'no unexplained code observation');eq(raw.filter(r=>r.label.startsWith('read:')).length,528,'no extra/missing prescribed read');
 eq(new Set(transactionChecks.map(x=>x.hash)).size,36,'no signed transaction reused');
 for(let i=1;i<transactionChecks.length;i++)assert(transactionChecks[i-1].receiptId<transactionChecks[i].sendId,'sealed sequential send/receipt order');
 same(Object.keys(report.arms).sort(),['calibration','lateIndex','scale7']);eq(report.source.expectedCommit,expected.source.commit);
 for(const entry of Object.values(report.artifactInputs)){assert(own(expected.source.artifactSha256,entry.path),'unsealed artifact path');eq(entry.sha256,expected.source.artifactSha256[entry.path]);}
 result.status='PASS_RPC_OBSERVED';result.inputSha256={expectations:sha(expectationBytes),raw:sha(rawBytes),report:sha(reportBytes),audit:sha(fs.readFileSync(new URL(import.meta.url)))};result.transactions=transactionChecks;
}catch(error){result.status='FAIL_OR_GAP';result.failure=error.stack;process.exitCode=1;}
process.stdout.write(JSON.stringify(result,null,2)+'\n');
