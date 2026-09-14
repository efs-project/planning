import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { buildRunPlan, run, createTransport, runtimeSourceHashes, verifyInputSources, persistJournalEntry } from './required-query.mjs';

const input=JSON.parse(readFileSync(process.env.EFS_QUERY_INPUT));
test('finite schedule prices all 82 signed transactions and 25 pages with complete audit overhead',()=>{
  const plan=buildRunPlan(input);
  assert.equal(plan.expectedTransactions,82); assert.equal(plan.expectedPages,25);
  assert.equal(plan.maximumRequests,5412);
  assert.equal(plan.minimumRequests,4510);
  assert.equal(plan.steps.filter(s=>s.kind==='checkpoint').length,4100);
  assert.equal(plan.steps.filter(s=>s.kind==='runtime').length,21);
  assert.equal(plan.steps.filter(s=>s.kind==='pageCall').length,50);
  assert.equal(plan.steps.filter(s=>s.kind==='header').length,83);
  assert.equal(plan.steps.filter(s=>s.kind==='receipt').length,82);
  assert.equal(new Set(plan.steps.map(s=>s.label)).size,plan.steps.length);
  assert.equal(plan.steps.filter(s=>s.method==='eth_sendRawTransaction').length,82);
  assert.equal(input.launchReady,false);
});
test('plan rejects a changed signature, schedule nonce, gas, page calldata or omitted transaction',()=>{
  for(const change of [i=>i.transactions.pop(),i=>i.transactions[0].gas='1',i=>i.transactions[1].nonce=0,i=>i.transactions[20].data='0x',i=>i.transactions[0].signedRaw+='00']) {
    const i=structuredClone(input);change(i);assert.throws(()=>buildRunPlan(i));
  }
});
test('missing or expired permit refuses before output writes or network',async()=>{
  const out=mkdtempSync(join(tmpdir(),'efs-required-query-refusal-'));
  await assert.rejects(run({inputPath:process.env.EFS_QUERY_INPUT,permit:null,rpcUrl:'http://127.0.0.1:1',out}));
  assert.deepEqual(readdirSync(out),[]);
  await assert.rejects(run({inputPath:process.env.EFS_QUERY_INPUT,permit:{notBeforeMs:1,notAfterMs:2},rpcUrl:'http://127.0.0.1:1',out}));assert.deepEqual(readdirSync(out),[]);
});
async function server(t,handler){const s=createServer(handler);await new Promise(r=>s.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{s.closeAllConnections();s.close(r);}));return `http://127.0.0.1:${s.address().port}/`;}
test('ambiguous send retains the raw failure and latches transport against a second send',async t=>{
  const url=await server(t,(_req,res)=>res.end('{'));
  const retained=[]; const transport=createTransport({rpcUrl:url,authorize:()=>{},persist:e=>retained.push(e)});
  const step={label:'send/1',method:'eth_sendRawTransaction',params:['0x1234'],expected:'0x'+'00'.repeat(32)};
  await assert.rejects(transport.request(step));
  assert.equal(retained.length,1);assert.equal(retained[0].responseText,'{');
  await assert.rejects(transport.request(step));assert.equal(retained.length,1);
});
test('streaming body limit retains only a bounded prefix and rejects HTTP errors',async t=>{
  const url=await server(t,(_req,res)=>{res.writeHead(200);res.end('x'.repeat(2097153));});
  const retained=[];const transport=createTransport({rpcUrl:url,authorize:()=>{},persist:e=>retained.push(e)});
  await assert.rejects(transport.request({label:'large',method:'eth_chainId',params:[]}));
  assert.equal(retained.length,1);assert(retained[0].responseBytes<=2097152);assert.match(retained[0].failure,/response.*cap/i);
});
test('HTTP error and bounded timeout retain failed requests before stopping',async t=>{
  for(const handler of [(_q,r)=>{r.writeHead(503);r.end('unavailable');},()=>{}]){
    const url=await server(t,handler),retained=[];
    const transport=createTransport({rpcUrl:url,authorize:()=>{},persist:e=>retained.push(e),limits:{requestTimeoutMs:25}});
    await assert.rejects(transport.request({label:'failure',method:'eth_chainId',params:[]}));assert.equal(retained.length,1);
    await assert.rejects(transport.request({label:'second',method:'eth_chainId',params:[]}));assert.equal(retained.length,1);
  }
});
test('request count and aggregate raw bytes are hard caps, never increased by test options',async t=>{
  const url=await server(t,(q,r)=>{let data='';q.on('data',c=>data+=c);q.on('end',()=>r.end(JSON.stringify({jsonrpc:'2.0',id:JSON.parse(data).id,result:'0x7a69'})));});
  const retained=[],step={label:'chain',method:'eth_chainId',params:[],expected:'0x7a69'};
  const one=createTransport({rpcUrl:url,authorize:()=>{},persist:e=>retained.push(e),limits:{maxRequests:1}});await one.request(step);await assert.rejects(one.request(step));assert.equal(retained.length,1);
  const tiny=[];const capped=createTransport({rpcUrl:url,authorize:()=>{},persist:e=>tiny.push(e),limits:{maxRawBytes:80}});await assert.rejects(capped.request(step));assert.equal(tiny.length,1);assert(Buffer.byteLength(JSON.stringify(tiny[0].request))+tiny[0].responseBytes<=80);
  assert.throws(()=>createTransport({rpcUrl:url,authorize:()=>{},persist:()=>{},limits:{maxResponseBytes:2097153}}));
});
test('source inventory includes actual executable and ethers dependencies; pinned source changes fail before network',()=>{
  const hashes=runtimeSourceHashes();assert(Object.keys(hashes).some(p=>p.endsWith('/required-query-state.mjs')));assert(Object.keys(hashes).some(p=>p.includes('/ethers/')));
  for(const h of Object.values(hashes))assert.match(h,/^[a-f0-9]{64}$/);
  const changed=structuredClone(input),file=Object.keys(changed.source.inputFileSha256)[0];changed.source.inputFileSha256[file]='0'.repeat(64);assert.throws(()=>verifyInputSources(changed),/pin/);
});
test('authorization is renewed before every request and expiration causes no second transport',async t=>{
  const url=await server(t,(q,r)=>{let body='';q.on('data',c=>body+=c);q.on('end',()=>r.end(JSON.stringify({jsonrpc:'2.0',id:JSON.parse(body).id,result:'0x7a69'})));});
  let allowed=true;const retained=[];
  const transport=createTransport({rpcUrl:url,authorize:()=>assert(allowed,'expired'),persist:e=>retained.push(e)});
  const step={label:'chain',method:'eth_chainId',params:[],expected:'0x7a69'};
  await transport.request(step);allowed=false;await assert.rejects(transport.request(step),/expired/);assert.equal(retained.length,1);
});
test('invalid UTF-8 is rejected while preserving the exact bounded raw bytes',async t=>{
  const url=await server(t,(_q,r)=>r.end(Buffer.from([255]))),retained=[];
  const transport=createTransport({rpcUrl:url,authorize:()=>{},persist:e=>retained.push(e)});
  await assert.rejects(transport.request({label:'bad-utf8',method:'eth_chainId',params:[]}));
  assert.equal(retained.length,1);assert.equal(retained[0].responseBytes,1);assert.equal(retained[0].responseBase64,'/w==');assert.match(retained[0].failure,/UTF-8/);
});
test('journal short write stops before fsync, retention, validation or any subsequent send',async t=>{
  let sends=0,writes=0,syncs=0;const transcript=[];
  const expected='0x'+'11'.repeat(32);
  t.mock.method(globalThis,'fetch',async(_url,options)=>{
    sends++;const request=JSON.parse(options.body);
    return new Response(JSON.stringify({jsonrpc:'2.0',id:request.id,result:expected}));
  });
  const io={write:()=>{writes++;return 1;},sync:()=>{syncs++;}};
  const transport=createTransport({rpcUrl:'http://127.0.0.1:1/',authorize:()=>{},persist:entry=>persistJournalEntry(7,entry,transcript,io)});
  const step={label:'signed-send',method:'eth_sendRawTransaction',params:['0x1234'],expected};
  await assert.rejects(transport.request(step),/short journal write/);
  assert.equal(writes,1,'failed persistence is not retried');assert.equal(syncs,0);assert.deepEqual(transcript,[]);
  await assert.rejects(transport.request(step),/stopped/);assert.equal(sends,1,'no second signed submission');
});
test('journal full UTF-8 byte write is fsynced before retention; fsync failure retains no entry',()=>{
  const entry={responseText:'é'},transcript=[],events=[];
  persistJournalEntry(7,entry,transcript,{write:(fd,bytes)=>{assert.equal(fd,7);events.push('write');assert.equal(Buffer.from(bytes).toString('utf8'),'{"responseText":"é"}\n');return Buffer.byteLength(bytes);},sync:fd=>{assert.equal(fd,7);assert.deepEqual(transcript,[]);events.push('sync');}});
  assert.deepEqual(events,['write','sync']);assert.deepEqual(transcript,[entry]);
  const failed=[];assert.throws(()=>persistJournalEntry(7,entry,failed,{write:(_fd,bytes)=>Buffer.byteLength(bytes),sync:()=>{throw new Error('fsync failed');}}),/fsync failed/);assert.deepEqual(failed,[]);
});
