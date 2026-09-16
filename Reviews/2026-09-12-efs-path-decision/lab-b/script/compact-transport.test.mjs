import test from 'node:test';
import assert from 'node:assert/strict';
import * as environment from './compact-environment.mjs';
const pin={blockHash:'0x'+'11'.repeat(32),requireCanonical:true};
const args=n=>[{to:'0x'+'22'.repeat(20),data:'0x12345678'+n.toString(16).padStart(2,'0')},pin];
function setup(reply,limits={}) {
  assert.equal(typeof environment.createReadTransport,'function','bounded read transport exists');
  const requests=[];
  const rpc=environment.createReadTransport({url:'http://127.0.0.1:1',batch:true,limits,fetchImpl:async(_,options)=>{
    const request=JSON.parse(options.body);requests.push(request);
    return new Response(JSON.stringify(await reply(request)),{status:200});
  }});return {rpc,requests};
}
const ok=r=>({jsonrpc:'2.0',id:r.id,result:r.params[0].data});
test('read batching correlates shuffled IDs, preserves options, and separates writes/preflight',async()=>{
  const {rpc,requests}=setup(r=>Array.isArray(r)?r.map(ok).reverse():ok(r));
  assert.deepEqual(await Promise.all([rpc.read('eth_call',args(1)),rpc.read('eth_call',args(2))]),['0x1234567801','0x1234567802']);
  assert.equal(requests.length,1);assert.deepEqual(requests[0].map(r=>r.params),[args(1),args(2)]);
  await rpc('eth_call',args(3));assert(!Array.isArray(requests[1]));
  await assert.rejects(rpc.read('eth_sendRawTransaction',['SECRET']),/READ_ONLY/);
  const report=rpc.snapshot();assert.equal(report.httpBatches,1);assert.equal(report.calls,3);assert(report.requestBytes>0&&report.responseBytes>0);
  assert(!JSON.stringify(report).includes('0x1234567801'),'diagnostics do not retain calldata');
});
test('missing duplicate unknown or malformed batch IDs reject whole batch; item errors remain item-local',async()=>{
  for(const mutate of [rows=>rows.slice(1),rows=>[rows[0],rows[0]],rows=>[rows[0],{...rows[1],id:999}],rows=>[rows[0],{...rows[1],jsonrpc:'1.0'}]]){
    const {rpc}=setup(r=>mutate(r.map(ok)));const results=await Promise.allSettled([rpc.read('eth_call',args(1)),rpc.read('eth_call',args(2))]);
    assert(results.every(r=>r.status==='rejected'),'no partial success for malformed batch');
  }
  const {rpc}=setup(r=>[ok(r[1]),{jsonrpc:'2.0',id:r[0].id,error:{code:-32000,message:'unavailable'}}]);
  const results=await Promise.allSettled([rpc.read('eth_call',args(1)),rpc.read('eth_call',args(2))]);
  assert.equal(results[0].status,'rejected');assert.equal(results[0].reason.rpcError.code,-32000);assert.equal(results[1].value,'0x1234567802');
});
test('explicit unsupported batch falls back with identical request IDs and parameters',async()=>{
  const {rpc,requests}=setup(r=>Array.isArray(r)?{jsonrpc:'2.0',id:null,error:{code:-32600,message:'batch unsupported'}}:ok(r));
  assert.deepEqual(await Promise.all([rpc.read('eth_call',args(1)),rpc.read('eth_call',args(2))]),['0x1234567801','0x1234567802']);
  assert.deepEqual(requests.slice(1),requests[0]);assert.equal(rpc.snapshot().fallbacks,1);
});
test('finite batch chunks, byte caps, queue caps and timeouts cannot return partial success',async()=>{
  const {rpc,requests}=setup(r=>Array.isArray(r)?r.map(ok):ok(r),{batchItems:2});
  await Promise.all(Array.from({length:5},(_,i)=>rpc.read('eth_call',args(i))));
  assert(requests.every(r=>!Array.isArray(r)||r.length<=2));
  const small=setup(r=>Array.isArray(r)?r.map(ok):ok(r),{responseBytes:20});await assert.rejects(small.rpc.read('eth_call',args(0)),/RESPONSE_LIMIT/);
  const request=setup(ok,{requestBytes:20});await assert.rejects(request.rpc.read('eth_call',args(0)),/REQUEST_LIMIT/);assert.equal(request.requests.length,0);
  const queued=setup(ok,{maxPending:1});const first=queued.rpc.read('eth_call',args(0));await assert.rejects(queued.rpc.read('eth_call',args(1)),/QUEUE_LIMIT/);await first;
  const slow=setup(async r=>{await new Promise(r=>setTimeout(r,30));return ok(r);},{timeoutMs:5});await assert.rejects(slow.rpc.read('eth_call',args(1)),/TIMEOUT/);
});
test('HTTP concurrency remains bounded while queued independent read groups drain',async()=>{
  let active=0,peak=0;
  const {rpc}=setup(async r=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,5));active--;return ok(r);},{batchItems:1,concurrency:2});
  await Promise.all(Array.from({length:8},(_,i)=>rpc.read('eth_call',args(i))));
  assert.equal(peak,2);assert.equal(active,0);assert.equal(rpc.snapshot().calls,8);
});
