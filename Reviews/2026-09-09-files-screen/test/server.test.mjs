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

test('optional gzip preserves decoded GET bytes and leaves RPC and refusal controls unchanged',async()=>{
  const config={payload:'qualified bytes;'.repeat(5000)};
  const server=await startScreenServer({config,addresses:[],selectors:[],delivery:'gzip',rpc:async()=> '0x7a69'});
  try{
    const identity=await fetch(server.url+'/config',{headers:{'accept-encoding':'identity'}});
    const bytes=Buffer.from(await identity.arrayBuffer());assert.equal(identity.headers.get('content-encoding'),null);
    const compressed=await fetch(server.url+'/config',{headers:{'accept-encoding':'gzip'}});
    assert.equal(compressed.headers.get('content-encoding'),'gzip');
    assert.equal(compressed.headers.get('vary'),'Accept-Encoding');
    assert(Number(compressed.headers.get('content-length'))<bytes.length/2);
    assert.deepEqual(Buffer.from(await compressed.arrayBuffer()),bytes,'exact decoded configuration');
    assert.equal(compressed.headers.get('cache-control'),'no-store');
    assert.match(compressed.headers.get('content-security-policy'),/connect-src 'self'/);
    for(const encoding of ['', 'br','gzip;q=0','gzip;q=0, *;q=1','gzip;q=bogus','gzip;q=0.1, identity;q=1']){
      const r=await fetch(server.url+'/config',{headers:{'accept-encoding':encoding}});
      assert.equal(r.headers.get('content-encoding'),null,encoding);assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);
    }
    for(const encoding of ['gzip;q=0.5, identity;q=0.1','GZIP','*;q=1']){
      const r=await fetch(server.url+'/config',{headers:{'accept-encoding':encoding}});
      assert.equal(r.headers.get('content-encoding'),'gzip',encoding);assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);
    }
    const rpc=await fetch(server.url+'/rpc',{method:'POST',headers:{origin:server.url,'content-type':'application/json','accept-encoding':'gzip'},body:JSON.stringify({method:'eth_chainId',params:[]})});
    assert.equal(rpc.headers.get('content-encoding'),null);assert.deepEqual(await rpc.json(),{result:'0x7a69'});
    for(const encoding of ['gzip;q=0, identity;q=0','*;q=0']){
      const r=await fetch(server.url+'/config',{headers:{'accept-encoding':encoding}});
      assert.equal(r.status,406);assert.equal((await r.arrayBuffer()).byteLength,0);
    }
    const small=await fetch(server.url+'/Reviews/2026-09-09-files-reader/index.mjs',{headers:{'accept-encoding':'gzip, identity;q=0'}});
    assert.equal(small.status,406,'below-threshold assets do not offer gzip or ignore forbidden identity');
    server.setDelivery('identity');const plain=await fetch(server.url+'/config',{headers:{'accept-encoding':'gzip'}});
    assert.equal(plain.headers.get('content-encoding'),null);assert.deepEqual(Buffer.from(await plain.arrayBuffer()),bytes);
    const refused=await fetch(server.url+'/config',{headers:{'accept-encoding':'gzip, identity;q=0'}});
    assert.equal(refused.status,406,'identity control does not send an explicitly excluded representation');
    assert.throws(()=>server.setDelivery('br'),/fixture delivery/);
  }finally{await server.close();}
});
