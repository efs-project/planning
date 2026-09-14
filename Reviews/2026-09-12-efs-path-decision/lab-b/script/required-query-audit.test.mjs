import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertRpcReply, assertPermit, assertHeader, assertTransaction, assertReceipt, assertObservation, auditTranscript, createReplay } from './required-query-audit.mjs';
import {createRequire} from 'node:module';
const {Transaction}=createRequire(import.meta.url)(process.env.EFS_ETHERS_PATH??'ethers');
import { buildRunPlan } from './required-query.mjs';

const input = JSON.parse(readFileSync(process.env.EFS_QUERY_INPUT));
const req = {jsonrpc:'2.0', id:7, method:'eth_call', params:[]};
test('RPC IDs, ambiguous envelopes, absent results, malformed bytes and quantities fail closed', () => {
  for (const reply of [null, {}, {jsonrpc:'2.0',id:8,result:'0x'}, {jsonrpc:'2.0',id:7,result:'0x',error:{}}, {jsonrpc:'2.0',id:7}, {jsonrpc:'2.0',id:7,result:null}, {jsonrpc:'2.0',id:7,result:'0x1'}, {jsonrpc:'2.0',id:7,error:{code:-1,message:'bad'}}]) assert.throws(()=>assertRpcReply(req,reply));
  assert.equal(assertRpcReply(req,{jsonrpc:'2.0',id:7,result:'0x1234'}),'0x1234');
  for(const value of ['0x00','0x','12','0x-1']) assert.throws(()=>assertRpcReply({...req,method:'eth_chainId'},{jsonrpc:'2.0',id:7,result:value}));
  assert.equal(assertRpcReply({...req,method:'eth_getTransactionReceipt'},{jsonrpc:'2.0',id:7,result:null}),null);
});
const hash='a'.repeat(64), hashes={'/p/oracle.mjs':'b'.repeat(64)};
const permit={schema:'efs-required-query/local-permit/1',inputSha256:hash,sourceSha256:hashes,rpcUrl:'http://127.0.0.1:1234/',notBeforeMs:100,notAfterMs:200,chainId:'31337',genesisTimestamp:'1800000000',blockGasLimit:'30000000',maxRequests:8192,maxRawBytes:67108864,maxResponseBytes:2097152,requestTimeoutMs:30000,maxReceiptPolls:12};
test('complete inputs do not confer RPC authority; every permit bound and pin is enforced',()=>{
  assert.throws(()=>assertPermit(null,hash,hashes,permit.rpcUrl,150));
  assert.doesNotThrow(()=>assertPermit(permit,hash,hashes,permit.rpcUrl,150));
  for(const change of [{notBeforeMs:151},{notAfterMs:150},{notAfterMs:1800101},{notAfterMs:Infinity},{maxRequests:8193},{chainId:31337},{extra:true},{sourceSha256:{}},{inputSha256:'c'.repeat(64)},{rpcUrl:'http://example.com/'}]) assert.throws(()=>assertPermit({...permit,...change},hash,hashes,permit.rpcUrl,150));
  for(const url of ['http://example.com','http://127.0.0.1.evil','http://user@127.0.0.1:1234/','http://127.0.0.1:1234/#x']) assert.throws(()=>assertPermit({...permit,rpcUrl:url},hash,hashes,url,150));
});
const H='0x'+'11'.repeat(32), P='0x'+'22'.repeat(32);
const header={number:'0x1',hash:H,parentHash:P,timestamp:'0x6b49d201',gasLimit:'0x1c9c380',gasUsed:'0x5208',transactions:[input.transactions[0].transactionHash]};
const parent={number:'0x0',hash:P,timestamp:'0x6b49d200'};
test('headers require exact one-tx numbered basis, gas and parent joins',()=>{
  assert.doesNotThrow(()=>assertHeader(header,1,parent,input.transactions[0]));
  for(const change of [{number:'0x2'},{parentHash:H},{timestamp:'0x0'},{gasLimit:'0x1'},{transactions:[]},{transactions:[...header.transactions,...header.transactions]}]) assert.throws(()=>assertHeader({...header,...change},1,parent,input.transactions[0]));
});
const tx=input.transactions[0];
const mined={hash:tx.transactionHash,from:tx.from,to:null,input:tx.data,value:'0x0',type:'0x0',nonce:'0x0',gas:'0xe4e1c0',gasPrice:'0x77359400',chainId:'0x7a69',blockNumber:'0x1',blockHash:H,transactionIndex:'0x0'};
const receipt={transactionHash:tx.transactionHash,from:tx.from,to:null,contractAddress:tx.deploymentAddress,blockNumber:'0x1',blockHash:H,transactionIndex:'0x0',status:'0x1',type:'0x0',gasUsed:'0x5208',cumulativeGasUsed:'0x5208',effectiveGasPrice:'0x77359400',logs:[]};
test('receipt and transaction joins reject sender, calldata, gas, status and signature corruption',()=>{
  // Signed r/s/v are derived from the sealed transport only, never candidate data.
  assert.throws(()=>assertTransaction(mined,tx,header));
  const signature=Transaction.from(tx.signedRaw).signature;
  const complete={...mined,r:signature.r,s:signature.s,v:'0x'+signature.networkV.toString(16)};
  assert.doesNotThrow(()=>assertTransaction(complete,tx,header));
  for(const change of [{from:input.accounts[3].address},{input:'0x'},{nonce:'0x1'},{r:H},{chainId:'0x1'},{blockHash:P},{transactionIndex:'0x1'},{gasPrice:'0x1'}])assert.throws(()=>assertTransaction({...complete,...change},tx,header));
  assert.doesNotThrow(()=>assertReceipt(receipt,tx,header));
  for(const change of [{from:input.accounts[3].address},{status:'0x0'},{gasUsed:'0xffffff'},{blockHash:P},{contractAddress:null},{cumulativeGasUsed:'0x1'}]) assert.throws(()=>assertReceipt({...receipt,...change},tx,header));
});
test('PageRead has exactly the consumer, topic, full commitment and receipt joins',()=>{
  const tx=input.transactions[20],page=input.arms.bScan.pages.old[0];
  const log={address:tx.to,topics:[page.expectedEvent.topic0],data:page.expectedEvent.data,transactionHash:tx.transactionHash,blockHash:H,blockNumber:'0x15',transactionIndex:'0x0',logIndex:'0x0',removed:false};
  const r={...receipt,transactionHash:tx.transactionHash,from:tx.from,to:tx.to,contractAddress:null,blockNumber:'0x15',logs:[log]};
  assert.doesNotThrow(()=>assertReceipt(r,tx,undefined,page));
  for(const change of [{address:input.accounts[0].address},{topics:[H]},{data:H},{blockNumber:'0x14'},{removed:true},{logIndex:'0x1'}])assert.throws(()=>assertReceipt({...r,logs:[{...log,...change}]},tx,undefined,page));
  assert.throws(()=>assertReceipt({...r,logs:[]},tx,undefined,page));
  assert.throws(()=>assertReceipt({...r,logs:[log,log]},tx,undefined,page));
});
test('full literal observations reject changed bytes and wrong historical block',()=>{
  const step={label:'state/nonce',method:'eth_call',params:[{to:tx.from,data:'0x1234'},'0x14'],expected:'0x'+'00'.repeat(32)};
  const request={jsonrpc:'2.0',id:1,method:step.method,params:step.params};
  const responseText=JSON.stringify({jsonrpc:'2.0',id:1,result:step.expected});
  const entry={id:1,label:step.label,request,responseText,responseBytes:Buffer.byteLength(responseText),status:200};
  assert.equal(assertObservation(step,entry,1),step.expected);
  for(const changed of [{...entry,label:'other'},{...entry,request:{...request,params:[step.params[0],'0x15']}},{...entry,responseText:responseText.replace('0x0000','0x1000')},{...entry,responseBytes:0},{...entry,status:500},{...entry,responseText:'{'}]) assert.throws(()=>assertObservation(step,changed,1));
});
test('replay rejects missing, duplicated and extra observations without trusting PASS flags',()=>{
  const plan=buildRunPlan(input);
  assert.throws(()=>auditTranscript(input,plan,[]));
  const s=plan.steps[0],request={jsonrpc:'2.0',id:1,method:s.method,params:s.params};
  const responseText=JSON.stringify({jsonrpc:'2.0',id:1,result:'0x7a69'});
  const e={id:1,label:s.label,request,responseText,responseBytes:Buffer.byteLength(responseText),status:200,PASS:true};
  assert.throws(()=>auditTranscript(input,plan,[e,e]));
  assert.throws(()=>auditTranscript(input,{...plan,steps:[]},[e]));
});
// Only the preflight and first transaction's pending-receipt boundary are
// synthetic here. A successful 82-transaction replay is deliberately not made.
function entryFor(step,id,result){const request={jsonrpc:'2.0',id,method:step.method,params:step.params};const responseText=JSON.stringify({jsonrpc:'2.0',id,result});return {id,label:step.label,request,responseText,responseBytes:Buffer.byteLength(responseText),status:200};}
function firstReceiptReplay(){
  const replay=createReplay(input,buildRunPlan(input));let id=0;
  while(replay.next().kind!=='receipt'){
    const s=replay.next();
    const value=s.kind==='header'?{...header,number:'0x0',hash:P,parentHash:'0x'+'00'.repeat(32),timestamp:'0x6b49d200',gasUsed:'0x0',transactions:[]}:s.kind==='balance'?'0x3635c9adc5dea00000':s.expected;
    replay.consume(entryFor(s,++id,value));
  }
  return {replay,next:result=>entryFor(replay.next(),++id,result)};
}
test('receipt polling allows eleven pending then terminal, forbids skipped/duplicate/post-terminal polls',()=>{
  const {replay,next}=firstReceiptReplay();
  for(let n=1;n<=11;n++){assert.match(replay.next().label,new RegExp(`/poll/${n}$`));replay.consume(next(null));}
  const terminal=next(receipt);assert.match(terminal.label,/poll\/12$/);replay.consume(terminal);
  assert.equal(replay.next().kind,'header');
  assert.throws(()=>replay.consume({...terminal,id:terminal.id+1}));
  const b=firstReceiptReplay();const skipped=b.next(null);skipped.label=skipped.label.replace('/poll/1','/poll/2');assert.throws(()=>b.replay.consume(skipped));
  const c=firstReceiptReplay();const first=c.next(null);c.replay.consume(first);assert.throws(()=>c.replay.consume({...first,id:first.id+1}));
});
test('twelve null receipt replies are exhaustion, never completion',()=>{
  const {replay,next}=firstReceiptReplay();for(let n=0;n<11;n++)replay.consume(next(null));
  assert.throws(()=>replay.consume(next(null)),/exhausted/);assert.throws(()=>replay.finish(),/missing/);
});
test('every post-page literal inventory is guarded, including nonce Record head list coverage and cursor',()=>{
  const plan=buildRunPlan(input);
  const selected=plan.steps.filter(s=>s.kind==='checkpoint'&&s.label.startsWith('bScan/21/')&&/nonce|record|head|posting|coverage/i.test(s.label));
  assert(selected.length>10);
  for(const s of selected){const e=entryFor(s,1,s.expected);assert.doesNotThrow(()=>assertObservation(s,e,1));
    const changed=entryFor(s,1,s.expected.slice(0,-1)+(s.expected.endsWith('0')?'1':'0'));assert.throws(()=>assertObservation(s,changed,1));}
  const page=plan.steps.find(s=>s.kind==='pageCall');assert.throws(()=>assertObservation(page,entryFor(page,1,page.expected.slice(0,-64)+'0'.repeat(64)),1));
});
