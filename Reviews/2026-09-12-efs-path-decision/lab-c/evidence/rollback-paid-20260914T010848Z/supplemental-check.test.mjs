// Synthetic tests exercise summary rejection, not candidate observations.
// After the run: EFS_C_CONTROL_PACKET=... EFS_C_CONTROL_PINS=... node --test this-file
// The optional real-packet case first runs checkPacket (pins + frozen auditor).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {checkPacket,reconcileSummaries,reconcileGas,reconcileRaw,reconcileChain} from './supplemental-check.mjs';
const PREP='/tmp/efs-c-control-independent-prep-20260913.MkbdXi';
const RUNNER='/Users/james/Code/EFS/planning-warroom-c-run/Reviews/2026-09-12-efs-path-decision/lab-c/script/rollback-control.mjs';
const expected=JSON.parse(fs.readFileSync(PREP+'/expectations.json'));
const arms=['scale7','lateIndex','calibration'];
const clone=x=>structuredClone(x);
const quantity=x=>'0x'+BigInt(x).toString(16);
const hash=x=>'0x'+BigInt(x).toString(16).padStart(64,'0');

function synthetic(){
  const pins={source:'5dcf7ff'+'0'.repeat(33),preparation:'2e3c9887a3ed933fccfa2cf4854775b029d045c376628a1cacad68463d70931e',artifacts:'/tmp/efs-c-readiness-build-20260913.NoPDle/out',expectations:PREP+'/expectations.json'};
  const raw=[], gas={deployment:{},setup:{},control:{}};
  const add=(method,params,result)=>raw.push({label:'synthetic 🧪',httpStatus:200,request:{jsonrpc:'2.0',id:raw.length+1,method,params},response:{jsonrpc:'2.0',id:raw.length+1,result}});
  add('eth_chainId',[],quantity(31337));add('eth_blockNumber',[],'0x0');
  add('eth_getBlockByNumber',['0x0',false],{number:'0x0',hash:hash(999),timestamp:quantity(1800000000)});
  const addresses=[expected.arms.scale7.attempt.from,...arms.map(a=>expected.arms[a].setupTransactions[0].from)];
  add('eth_accounts',[],addresses);for(const a of addresses)add('eth_getTransactionCount',[a,'latest'],'0x0');add('eth_gasPrice',[],quantity(7));
  let serial=0;
  const receipt=(t,address)=>{
    const h=hash(++serial),g=100000+serial;
    add('eth_getTransactionByHash',[h],{hash:h,from:t.from,to:t.to,nonce:quantity(t.nonce),input:t.data});
    add('eth_getTransactionReceipt',[h],{transactionHash:h,contractAddress:address,gasUsed:quantity(g)});return String(g);
  };
  for(const name of arms){const e=expected.arms[name];gas.deployment[name]={};gas.setup[name]={};
    for(const d of e.deployment)gas.deployment[name][d.role]=receipt({from:e.setupTransactions[0].from,to:null,nonce:d.nonce,data:'0x'},d.address);
    for(const t of e.setupTransactions)gas.setup[name][t.label]=receipt(t,null);
    gas.control[name]=receipt(e.attempt,null);
  }
  const report={schema:'efs-lab-c/rollback-report/1',failure:null,source:{expectedCommit:expected.source.commit,runner:pathToFileURL(RUNNER).href,artifactRoot:pins.artifacts,expectationsPath:pins.expectations,expectationsSha256:pins.preparation},chain:{chainId:'31337',genesisBlock:'0',genesisHash:hash(999),genesisTimestamp:'1800000000',gasPrice:'15',author:expected.arms.scale7.attempt.from.toLowerCase()},gas,gates:{independentExpectations:true,exactRawReplies:true,staticMinedLinked:true,fullSuite:'UNVERIFIED by this runner',bParity:'NOT CLAIMED',stateProof:'NOT PROVIDED'},raw:{envelopes:raw.length,bytes:raw.reduce((n,r)=>n+Buffer.byteLength(JSON.stringify(r)),0),maxEnvelopes:4096,maxBytes:16*1024*1024}};
  return {raw,report,pins,expected};
}

export function summaryMutants(report){
  const mutations=[];
  const add=(name,change)=>mutations.push({name,change});
  for(const arm of arms){
    for(const role of Object.keys(report.gas.deployment[arm]))add('gas deployment '+arm+'/'+role,r=>r.gas.deployment[arm][role]=String(BigInt(r.gas.deployment[arm][role])+1n));
    for(const label of ['attach','prefix'])add('gas setup '+arm+'/'+label,r=>r.gas.setup[arm][label]=String(BigInt(r.gas.setup[arm][label])+1n));
    add('gas control '+arm,r=>r.gas.control[arm]=String(BigInt(r.gas.control[arm])+1n));
  }
  for(const field of ['expectedCommit','runner','artifactRoot','expectationsPath','expectationsSha256'])add('source '+field,r=>r.source[field]+='-wrong');
  for(const field of Object.keys(report.chain))add('chain '+field,r=>r.chain[field]+='-wrong');
  for(const field of Object.keys(report.raw))add('raw '+field,r=>r.raw[field]++);
  for(const field of ['independentExpectations','exactRawReplies','staticMinedLinked'])add('gate '+field,r=>r.gates[field]=false);
  for(const field of ['fullSuite','bParity','stateProof'])add('overclaimed '+field,r=>r.gates[field]='PASS');
  add('extra gas entry',r=>r.gas.setup.scale7.other='1');
  add('gas number instead of decimal string',r=>r.gas.control.scale7=Number(r.gas.control.scale7));
  add('failure retained',r=>r.failure='run failed');
  return mutations;
}

export function assertSummaryMutants(raw,report,expected,pins){
  reconcileSummaries(raw,report,expected,pins);
  const mutants=summaryMutants(report);
  for(const {name,change} of mutants){const changed=clone(report);change(changed);assert.throws(()=>reconcileSummaries(raw,changed,expected,pins),undefined,name);}
  return {rejected:mutants.length,names:mutants.map(x=>x.name)};
}

test('synthetic complete summary maps 27 receipts; does not claim observation PASS',()=>{
  const f=synthetic(),out=reconcileSummaries(f.raw,f.report,f.expected,f.pins);assert.equal(out.gas.receipts,27);assert(!Object.hasOwn(out,'status'));
});
for(const {name,change} of summaryMutants(synthetic().report))test('reject '+name,()=>{
  const f=synthetic();change(f.report);assert.throws(()=>reconcileSummaries(f.raw,f.report,f.expected,f.pins));
});
test('raw bytes exclude JSONL separators and count UTF-8 bytes',()=>{
  const f=synthetic(),jsonl=f.raw.map(x=>JSON.stringify(x)).join('\n')+'\n';assert.equal(Buffer.byteLength(jsonl)-f.raw.length,f.report.raw.bytes);
  f.report.raw.bytes=Buffer.byteLength(jsonl);assert.throws(()=>reconcileRaw(f.raw,f.report));
});
test('reject missing receipt',()=>{const f=synthetic();f.raw.splice(f.raw.findIndex(x=>x.request.method==='eth_getTransactionReceipt'),1);assert.throws(()=>reconcileGas(f.raw,f.report,f.expected));});
test('reject misassigned deployment address',()=>{const f=synthetic();f.raw.find(x=>x.request.method==='eth_getTransactionReceipt').response.result.contractAddress='0x'+'00'.repeat(20);assert.throws(()=>reconcileGas(f.raw,f.report,f.expected));});
test('reject setup calldata mismatch',()=>{const f=synthetic();f.raw.find(x=>x.request.method==='eth_getTransactionByHash'&&x.response.result.to!==null).response.result.input='0x';assert.throws(()=>reconcileGas(f.raw,f.report,f.expected));});
test('exported batch rejects every synthetic mutant',()=>{const f=synthetic();assert.equal(assertSummaryMutants(f.raw,f.report,f.expected,f.pins).rejected,summaryMutants(f.report).length);});
test('startup boundary ignores later pre-block and send nonce reads without trusting labels',()=>{
  const f=synthetic();
  const add=(method,params,result)=>{const id=f.raw.length+1;f.raw.push({label:'initial block',httpStatus:200,request:{jsonrpc:'2.0',id,method,params},response:{jsonrpc:'2.0',id,result}});};
  for(const block of [8,17,26])add('eth_blockNumber',[],quantity(block));
  for(const name of arms){
    const e=f.expected.arms[name];
    for(let nonce=0;nonce<8;nonce++)add('eth_getTransactionCount',[e.setupTransactions[0].from,'latest'],quantity(nonce));
    add('eth_getTransactionCount',[e.attempt.from,'latest'],quantity(e.attempt.nonce));
  }
  assert.deepEqual(reconcileChain(f.raw,f.report,f.expected),f.report.chain);
});
test('startup boundary rejects a nonce available only after the gas-price query',()=>{
  const f=synthetic(),i=f.raw.findIndex(r=>r.request.method==='eth_getTransactionCount'),[nonce]=f.raw.splice(i,1);
  f.raw.push(nonce);f.raw.forEach((r,i)=>{r.request.id=i+1;r.response.id=i+1;});
  assert.throws(()=>reconcileChain(f.raw,f.report,f.expected));
});
test('startup boundary rejects a send before the gas-price query',()=>{
  const f=synthetic();f.raw.unshift({request:{method:'eth_sendRawTransaction',params:['0x']},response:{result:'0x'}});
  f.raw.forEach((r,i)=>{r.request.id=i+1;r.response.id=i+1;});
  assert.throws(()=>reconcileChain(f.raw,f.report,f.expected));
});
const packet=process.env.EFS_C_CONTROL_PACKET,pinsPath=process.env.EFS_C_CONTROL_PINS;
test('optional actual packet audit and summary mutants',{skip:!packet&&!pinsPath},async()=>{
  assert(packet&&pinsPath,'both EFS_C_CONTROL_PACKET and EFS_C_CONTROL_PINS required');
  const checked=await checkPacket(packet,pinsPath);assert.equal(checked.status,'PASS_RPC_OBSERVED_SUMMARIES');
  const pins=JSON.parse(fs.readFileSync(pinsPath)),exp=JSON.parse(fs.readFileSync(pins.expectations));
  const raw=fs.readFileSync(packet+'/raw.jsonl','utf8').trimEnd().split('\n').map(x=>JSON.parse(x)),report=JSON.parse(fs.readFileSync(packet+'/report.json'));
  assert.equal(assertSummaryMutants(raw,report,exp,pins).rejected,summaryMutants(report).length);
});
