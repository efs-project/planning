import test from 'node:test';
import assert from 'node:assert/strict';
import { startScreenServer } from '../scripts/server.mjs';

test('loopback guest surface serves only fixed assets and bounded same-origin reads',async()=>{
  const calls=[],address='0x'+'11'.repeat(20);
  const server=await startScreenServer({config:{expected:{source:'test'},snapshots:[]},
    addresses:[address],selectors:['0x12345678'],rpc:async(method,params)=>{calls.push({method,params});return '0x7a69';}});
  const post=(body,origin=server.url)=>fetch(server.url+'/rpc',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(body)});
  try{
    assert.equal(new URL(server.url).hostname,'127.0.0.1');
    assert.equal((await fetch(server.url+'/')).status,200);
    assert.equal((await fetch(server.url+'/config')).status,200);
    assert.equal((await fetch(server.url+'/AGENTS.md')).status,404);
    assert.equal((await fetch(server.url+'/%2e%2e/AGENTS.md')).status,404);
    const good=await post({method:'eth_chainId',params:[]});assert.equal(good.status,200);assert.deepEqual(await good.json(),{result:'0x7a69'});
    for(const body of [
      {method:'eth_sendTransaction',params:[]},
      {method:'eth_call',params:[{to:address,data:'0xdeadbeef'},'latest']},
      {method:'eth_call',params:[{to:'0x'+'22'.repeat(20),data:'0x12345678'},{blockHash:'0x'+'33'.repeat(32),requireCanonical:true}]},
      {method:'eth_getBlockByNumber',params:['latest',true]},
      {method:'eth_chainId',params:['unexpected']},
    ])assert.equal((await post(body)).status,400);
    assert.equal((await post({method:'eth_chainId',params:[]},'https://example.org')).status,403);
    assert.equal((await fetch(server.url+'/rpc',{method:'POST',body:'x'.repeat(65537),headers:{origin:server.url,'content-type':'application/json'}})).status,413);
    assert.equal(calls.length,1,'denied requests never reach RPC');
    assert.equal(server.trace.length,1);assert.equal(server.trace[0].bytes,8);
    assert.equal((await fetch(server.url+'/')).headers.get('content-security-policy').includes("connect-src 'self'"),true);
  }finally{await server.close();}
});
