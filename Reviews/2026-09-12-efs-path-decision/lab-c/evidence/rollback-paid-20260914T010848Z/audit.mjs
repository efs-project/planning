// Offline raw transport audit: no runner imports, RPC or filesystem mutations.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {Transaction,recoverAddress,getCreateAddress,keccak256}=require('/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers');
export const EXPECTATION_SHA='2e3c9887a3ed933fccfa2cf4854775b029d045c376628a1cacad68463d70931e';
const sha=x=>createHash('sha256').update(x).digest('hex');
const eq=(a,b,label)=>assert.deepEqual(a,b,label),own=(o,k)=>Object.hasOwn(o,k);
export const hex=(x,n)=>{assert.equal(typeof x,'string');assert.match(x,/^0x(?:[0-9a-fA-F]{2})*$/);if(n!==undefined)eq(x.length,2+n*2);return x.toLowerCase();};
const address=x=>hex(x,20),hash=x=>hex(x,32);
export const quantity=x=>{assert.equal(typeof x,'string');assert.match(x,/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/);return BigInt(x);};
const canonical=x=>typeof x==='string'&&/^0x[0-9a-fA-F]*$/.test(x)?x.toLowerCase():Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const same=(a,b,label)=>eq(canonical(a),canonical(b),label);
const one=(xs,label)=>{eq(xs.length,1,label+' unique raw observation');return xs[0];};
const good=row=>{assert(!own(row.response,'error'),'unexpected raw error');assert(own(row.response,'result'));return row.response.result;};
export function assertObservation(row,call,answer,block){
 eq(row.request.method,call.method);eq(row.request.params.length,call.params.length+1);same(row.request.params.slice(0,-1),call.params,'exact observation request');eq(quantity(row.request.params.at(-1)),BigInt(block),'observation block');eq(hex(good(row)),hex(answer),'literal observation return');
}
export function assertMapInventory(calls,answers){assert(Object.keys(calls).length>0);eq(Object.keys(calls).sort(),Object.keys(answers).sort(),'complete observation inventory');}
export function verifySigned(bytes,want){
 bytes=hex(bytes);const tx=Transaction.from(bytes);assert(tx.isSigned());assert([0,2].includes(tx.type),'unsupported signed transport type');eq(tx.chainId,31337n);eq(tx.value,0n);eq(hex(tx.serialized),bytes);eq(hash(tx.hash),hash(keccak256(bytes)));eq(address(tx.from),address(recoverAddress(tx.unsignedHash,tx.signature)));
 eq(address(tx.from),address(want.from));eq(tx.to===null?null:address(tx.to),want.to===null?null:address(want.to));eq(tx.nonce,want.nonce);eq(tx.gasLimit,BigInt(want.gas));
 if(want.data!==undefined)eq(hex(tx.data),hex(want.data),'signed calldata');
 if(want.initcodeHash){eq(hash(keccak256(tx.data)),hash(want.initcodeHash));eq((tx.data.length-2)/2,want.initcodeBytes);}
 return tx;
}
export function audit(raw,report,expected){
 eq(expected.schema,'efs-lab-c/rollback-expectations/1');eq(report.schema,'efs-lab-c/rollback-report/1');eq(report.failure,null,'completed report');
 assert(raw.length>0&&raw.length<=4096);const allowed=new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getBlockByHash','eth_accounts','eth_getTransactionCount','eth_gasPrice','eth_maxPriorityFeePerGas','eth_sendRawTransaction','eth_getTransactionByHash','eth_getTransactionReceipt','eth_getCode','eth_call','eth_getStorageAt']);
 const ids=new Map();for(const [i,row]of raw.entries()){
  const {request:q,response:r}=row;eq(row.httpStatus,200);eq(q.jsonrpc,'2.0');eq(r.jsonrpc,'2.0');eq(q.id,i+1);eq(r.id,q.id);assert(!ids.has(q.id));ids.set(q.id,row);assert(allowed.has(q.method),'unsupported raw method '+q.method);assert(Array.isArray(q.params));assert(own(r,'result')!==own(r,'error'),'exclusive RPC outcome');if(own(r,'error')){eq(q.method,'eth_call');assert(Number.isInteger(r.error.code));assert.equal(typeof r.error.message,'string');}
 }
 const rows=method=>raw.filter(x=>x.request.method===method);
 const counts={rawEnvelopes:raw.length,logicalReads:0,storageReads:0,signedTransactions:0,deployments:0,staticMinedLinks:0,headers:0};
 eq(quantity(good(one(rows('eth_chainId'),'chain ID'))),31337n);eq(expected.chain.blockGasLimit,'30000000');
 const headers=new Map();for(const row of [...rows('eth_getBlockByHash'),...rows('eth_getBlockByNumber')]){
  const b=good(row);assert(b&&typeof b==='object');const number=quantity(b.number);hash(b.hash);hash(b.parentHash);eq(quantity(b.gasLimit),30000000n,'every header block gas limit');eq(row.request.params[1],false);
  if(row.request.method==='eth_getBlockByHash')eq(hash(row.request.params[0]),hash(b.hash));else eq(quantity(row.request.params[0]),number);
  assert(Array.isArray(b.transactions));b.transactions.forEach(hash);
  if(headers.has(number.toString()))same(b,headers.get(number.toString()),'consistent retained header');else headers.set(number.toString(),b);
 }
 eq(headers.size,28,'all 28 headers');for(let n=0;n<=27;n++){
  const b=headers.get(String(n));assert(b,'missing header '+n);assert(quantity(b.timestamp)<2000000000n);if(n===0){eq(quantity(b.timestamp),1800000000n);eq(b.transactions,[]);}else {const prior=headers.get(String(n-1));eq(hash(b.parentHash),hash(prior.hash));assert(quantity(b.timestamp)>=quantity(prior.timestamp));eq(b.transactions.length,1,'one transaction per sealed block');}
 }counts.headers=28;
 const sends=rows('eth_sendRawTransaction');eq(sends.length,27);
 const inventory=['ImportLib','IndexModule','Ledger','PassAcceptor','QuoteAcceptorV1','Producer'];
 const wants=[];for(const [i,name]of ['scale7','lateIndex','calibration'].entries()){
  const e=expected.arms[name];eq(e.deployerIndex,i+2);eq(e.authorIndex,1);eq(e.pre.blockNumber,String(i*9+8));eq(e.post.blockNumber,String(i*9+9));eq(e.deployment.map(d=>d.role),inventory);eq(e.deployment.map(d=>d.nonce),[0,1,2,4,5,6]);eq(e.setupTransactions.map(t=>t.label),['attach','prefix']);
  const from=e.setupTransactions[0].from;
  for(const d of e.deployment)wants.push({...d,from,to:null,gas:15000000,status:1,block:i*9+d.nonce+1,arm:name,kind:'deployment'});
  for(const t of e.setupTransactions)wants.push({...t,gas:8000000,status:1,block:i*9+t.nonce+1,arm:name,kind:'setup'});
  wants.push({...e.attempt,gas:5000000,status:e.attempt.expectedStatus,block:i*9+9,arm:name,kind:'attempt'});
 }
 wants.sort((a,b)=>a.block-b.block);const txResults=new Map();let previousReceiptId=0;
 for(const want of wants){
  const selected=one(sends.filter(s=>{const tx=Transaction.from(s.request.params[0]);return address(tx.from)===address(want.from)&&tx.nonce===want.nonce;}),'sender+nonce'),tx=verifySigned(selected.request.params[0],want);eq(hash(good(selected)),hash(tx.hash));assert(selected.request.id>previousReceiptId,'sequential sending');
  const receipts=rows('eth_getTransactionReceipt').filter(row=>hash(row.request.params[0])===hash(tx.hash));const receiptRow=one(receipts.filter(r=>good(r)!==null),'mined receipt'),receipt=good(receiptRow);assert(receiptRow.request.id>selected.request.id);previousReceiptId=receiptRow.request.id;
  const txRow=one(rows('eth_getTransactionByHash').filter(row=>hash(row.request.params[0])===hash(tx.hash)),'mined transaction'),mined=good(txRow);assert(mined&&txRow.request.id>receiptRow.request.id);
  const header=headers.get(String(want.block));eq(hash(mined.hash),hash(tx.hash));eq(hash(receipt.transactionHash),hash(tx.hash));eq(hash(header.transactions[0]),hash(tx.hash));
  for(const item of [receipt,mined]){eq(address(item.from),address(tx.from));eq(item.to===null?null:address(item.to),tx.to===null?null:address(tx.to));eq(quantity(item.blockNumber),BigInt(want.block));eq(hash(item.blockHash),hash(header.hash));eq(quantity(item.transactionIndex),0n);}
  eq(hex(mined.input),hex(tx.data));eq(quantity(mined.nonce),BigInt(tx.nonce));eq(quantity(mined.gas),tx.gasLimit);eq(quantity(mined.value),0n);eq(quantity(mined.type),BigInt(tx.type));eq(quantity(mined.chainId),31337n);eq(BigInt(mined.r),BigInt(tx.signature.r));eq(BigInt(mined.s),BigInt(tx.signature.s));
  if(tx.type===0){eq(BigInt(mined.v),tx.signature.networkV);eq(quantity(mined.gasPrice),tx.gasPrice);}else {eq(BigInt(mined.v),BigInt(tx.signature.yParity));eq(quantity(mined.maxFeePerGas),tx.maxFeePerGas);eq(quantity(mined.maxPriorityFeePerGas),tx.maxPriorityFeePerGas);same(mined.accessList,tx.accessList);}
  eq(quantity(receipt.status),BigInt(want.status));const gasUsed=quantity(receipt.gasUsed);assert(gasUsed>0n&&gasUsed<=tx.gasLimit);eq(quantity(receipt.cumulativeGasUsed),gasUsed);eq(quantity(header.gasUsed),gasUsed);if(want.status===0)eq(receipt.logs,[]);
  if(want.kind==='deployment'){
   eq(address(getCreateAddress({from:tx.from,nonce:tx.nonce})),address(want.address));eq(address(receipt.contractAddress),address(want.address));
   const codeRow=one(rows('eth_getCode').filter(row=>address(row.request.params[0])===address(want.address)&&quantity(row.request.params[1])===BigInt(want.block)),'runtime at deployment block');assert(codeRow.request.id>receiptRow.request.id);const code=hex(good(codeRow));eq(hash(keccak256(code)),hash(want.runtimeCodehash));eq((code.length-2)/2,want.runtimeBytes);counts.deployments++;
  }else eq(receipt.contractAddress,null);
  txResults.set(want.arm+':'+(want.kind==='deployment'?want.role:want.kind==='setup'?want.label:'attempt'),{want,tx,selected,receiptRow,receipt,header,gasUsed:gasUsed.toString()});counts.signedTransactions++;
 }
 const usedObservations=new Set(),staticIds=new Set();
 for(const name of ['scale7','lateIndex','calibration']){
  const e=expected.arms[name],r=report.arms[name];assert(r);for(const field of ['deployment','setupTransactions','types','fixture','a1'])same(r[field],e[field],'report metadata '+name+'.'+field);
  const attempt=txResults.get(name+':attempt'),prefix=txResults.get(name+':prefix');
  const staticRow=ids.get(r.static.rpcId);assert(staticRow,'static raw ID');eq(staticRow.request.method,'eth_call');eq(staticRow.request.params.length,2);const c=staticRow.request.params[0];same(Object.keys(c).sort(),['data','from','gas','to']);
  eq(address(c.from),address(attempt.tx.from));eq(address(c.to),address(attempt.tx.to));eq(hex(c.data),hex(attempt.tx.data));eq(quantity(c.gas),5000000n);eq(quantity(staticRow.request.params[1]),BigInt(e.pre.blockNumber));assert(staticRow.request.id>prefix.receiptRow.request.id&&staticRow.request.id<attempt.selected.request.id);staticIds.add(staticRow.request.id);
  if(e.attempt.errorData===null){eq(hex(good(staticRow)),hex(e.attempt.returnData));eq(r.static.errorData,null);eq(hex(r.static.returnData),hex(e.attempt.returnData));}else {assert(own(staticRow.response,'error'));assert.equal(typeof staticRow.response.error.data,'string','GAP: literal error.data missing');eq(hex(staticRow.response.error.data),hex(e.attempt.errorData));eq(hex(r.static.errorData),hex(e.attempt.errorData));eq(r.static.returnData,null);}
  eq(hash(r.mined.transactionHash),hash(attempt.tx.hash));eq(r.mined.receiptId,attempt.receiptRow.request.id);eq(Number(r.mined.status),e.attempt.expectedStatus);eq(BigInt(r.mined.gasUsed),BigInt(attempt.gasUsed));eq(hash(r.mined.blockHash),hash(attempt.header.hash));counts.staticMinedLinks++;
  for(const stage of ['pre','post']){
   const block=e[stage].blockNumber;eq(r[stage].blockNumber,block);eq(hash(r[stage].blockHash),hash(headers.get(block).hash));
   for(const [callsField,answersField,counter]of [['readCalls','reads','logicalReads'],['storageCalls','storage','storageReads']]){
    const calls=e[callsField],answers=e[stage][answersField];assertMapInventory(calls,answers);same(r[stage][answersField],answers,'reported observation map');
    for(const [label,want]of Object.entries(calls)){
     const observation=one(rows(want.method).filter(row=>row.request.params.length===want.params.length+1&&JSON.stringify(canonical(row.request.params.slice(0,-1)))===JSON.stringify(canonical(want.params))&&quantity(row.request.params.at(-1))===BigInt(block)),name+'/'+stage+'/'+label);
     assertObservation(observation,want,answers[label],block);assert(!usedObservations.has(observation.request.id),'raw observation reused');usedObservations.add(observation.request.id);
     if(stage==='pre')assert(observation.request.id>prefix.receiptRow.request.id&&observation.request.id<staticRow.request.id);else assert(observation.request.id>attempt.receiptRow.request.id);counts[counter]++;
    }
   }
  }
  if(e.attempt.expectedStatus===0){same(e.pre.reads,e.post.reads);same(e.pre.storage,e.post.storage);}
 }
 eq(rows('eth_getStorageAt').length,counts.storageReads,'all physical observations prescribed');eq(rows('eth_getCode').length,18);eq(raw.filter(row=>own(row.response,'error')).length,2);for(const row of raw.filter(row=>own(row.response,'error')))assert(staticIds.has(row.request.id),'unrelated failed RPC');
 eq(counts.logicalReads,756);eq(counts.storageReads,1566);eq(counts.signedTransactions,27);eq(counts.deployments,18);eq(counts.staticMinedLinks,3);eq(new Set([...txResults.values()].map(t=>t.tx.hash)).size,27);same(Object.keys(report.arms).sort(),['calibration','lateIndex','scale7']);
 return {schema:'efs-lab-c/independent-rollback-audit/1',status:'PASS_RPC_OBSERVED',counts,transactions:[...txResults.values()].map(t=>({arm:t.want.arm,kind:t.want.kind,block:t.want.block,hash:t.tx.hash,gasUsed:t.gasUsed})),limitations:['Number-qualified RPC observations joined to retained headers, not authenticated state proof or EIP-1898 requireCanonical calls.','Compiler/source provenance and reviewed fault semantics are prior sealed inputs; literal code observations do not prove source compilation.','No C/B feature parity, full Files, portability, adoption or normal product-price conclusion.']};
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){
 let output;try{const [packet,expectationPath]=process.argv.slice(2);assert(packet&&expectationPath,'usage audit.mjs RESULT_DIRECTORY EXPECTATIONS_JSON');const expBytes=fs.readFileSync(expectationPath);eq(sha(expBytes),EXPECTATION_SHA,'pre-run frozen expectation hash');const rawBytes=fs.readFileSync(packet+'/raw.jsonl'),reportBytes=fs.readFileSync(packet+'/report.json');assert(rawBytes.length<=16*1024*1024,'raw file bound');const raw=rawBytes.toString().trimEnd().split('\n').map(line=>JSON.parse(line));output=audit(raw,JSON.parse(reportBytes),JSON.parse(expBytes));output.inputSha256={expectations:sha(expBytes),raw:sha(rawBytes),report:sha(reportBytes),audit:sha(fs.readFileSync(new URL(import.meta.url)))};}catch(error){output={schema:'efs-lab-c/independent-rollback-audit/1',status:'FAIL_OR_GAP',failure:error.stack};process.exitCode=1;}process.stdout.write(JSON.stringify(output,null,2)+'\n');
}
