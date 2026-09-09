import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedJSON,createRPCSource } from '../web/rpc-source.mjs';
test('stream bounds, malformed UTF-8 and abort fail closed before a result is used',async()=>{
  assert.deepEqual(await boundedJSON(new Response('{"ok":true}'),64),{ok:true});
  await assert.rejects(()=>boundedJSON(new Response('x'.repeat(65)),64),/response limit/);
  await assert.rejects(()=>boundedJSON(new Response(new Uint8Array([255])),64));
  await assert.rejects(()=>boundedJSON(new Response('{'),64));
  const cancel=new AbortController();cancel.abort();
  await assert.rejects(()=>boundedJSON(new Response('{}'),64,cancel.signal));
});
test('read source sends exact params and rejects error, excessive result and malformed envelope',async()=>{
  const seen=[],request=async(url,options)=>{seen.push({url,options});return new Response('{"result":"0x7a69"}');};
  const source=createRPCSource({identity:'test',fetcher:request});
  assert.equal(await source.request('eth_chainId',[],{maxBytes:8}),'0x7a69');
  assert.deepEqual(JSON.parse(seen[0].options.body),{method:'eth_chainId',params:[]});
  assert.equal(source.epoch,1);
  await assert.rejects(()=>source.request('eth_chainId',[],{maxBytes:7}),/result limit/);
  for(const response of [new Response('{"error":"missing"}',{status:502}),new Response('{"result":0,"extra":1}')]){
    const bad=createRPCSource({identity:'test',fetcher:async()=>response});await assert.rejects(()=>bad.request('eth_chainId',[],{maxBytes:64}));
  }
});
