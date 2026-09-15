import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {describe,openContent} from './compact-content.mjs';
import {createRawTransport,pngHeader,storeRawBytes,verifyPng} from './compact-carrier-host.mjs';
import {startRawCarrier} from '../script/raw-carrier-fixture.mjs';
import {samplePng} from '../script/carrier-fixtures.mjs';
test('explicit raw transport roundtrip verifies a real PNG independently of filename',async t=>{
  const png=samplePng(),server=await startRawCarrier([png]);t.after(()=>server.close());
  const loadCarrier=createRawTransport({origin:server.origin,maxBytes:1024,timeoutMs:1000});assert.equal(typeof loadCarrier,'function');
  const result=await openContent(await describe(png,{carrier:1,media:2}),{loadCarrier});assert.equal(result.state,'AVAILABLE_VERIFIED');assert.deepEqual(result.bytes,png);
  assert.deepEqual(pngHeader(png),{width:1,height:1});
  assert.throws(()=>pngHeader(samplePng(100000,100000)),/PIXEL_LIMIT/);
  assert.throws(()=>pngHeader(new TextEncoder().encode('<svg onload="alert(1)"/>')),/PNG/);
  const corrupt=png.slice();corrupt[corrupt.length-1]^=1;assert.throws(()=>pngHeader(corrupt),/PNG/);
});
test('raw transport refuses credentials, redirects, excess streaming bytes and times out',async t=>{
  assert.throws(()=>createRawTransport({origin:'http://user:pass@127.0.0.1'}),/ORIGIN/);
  let mode='redirect';const server=createServer((req,res)=>{if(mode==='redirect'){res.writeHead(302,{location:'https://example.invalid'}).end();}else if(mode==='big'){res.writeHead(200);res.write(new Uint8Array(10));res.end();}else res.writeHead(200);});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));
  const load=createRawTransport({origin:`http://127.0.0.1:${server.address().port}`,maxBytes:4,timeoutMs:50}),d=await describe(new Uint8Array(4),{carrier:1});
  assert.equal(typeof load,'function');await assert.rejects(load(d));mode='big';await assert.rejects(load(d),/BYTE_LIMIT/);mode='hang';await assert.rejects(load(d),/timeout|abort/i);
});
test('explicit byte-only local upload accepts a larger object by digest and refuses forged identity',async t=>{
  const fixture=await startRawCarrier();t.after(()=>fixture.close());const bytes=new Uint8Array(9000);bytes[8193]=255;
  const descriptor=await describe(bytes,{carrier:1});
  const upload=await storeRawBytes(bytes,{origin:fixture.origin});assert.equal(upload,descriptor.digest);
  const loaded=await openContent(descriptor,{loadCarrier:createRawTransport({origin:fixture.origin})});assert.deepEqual(loaded.bytes,bytes);
  const bad=await fetch(`${fixture.origin}/raw/sha256/${'0'.repeat(64)}`,{method:'PUT',body:bytes});assert.equal(bad.status,422);
  fixture.allowUploadOrigin('http://127.0.0.1:12345');
  const crossOrigin=await fetch(`${fixture.origin}/raw/sha256/${descriptor.digest}`,{method:'PUT',body:bytes,headers:{Origin:'https://unrelated.invalid'}});assert.equal(crossOrigin.status,403);
});
test('image decode is bounded first and every decoded bitmap is closed',async()=>{
  let decoded=0,closed=0;const decode=async()=>{decoded++;return {width:1,height:1,close(){closed++;}};};
  await assert.rejects(verifyPng(samplePng(50000,50000),{decode}),/PIXEL_LIMIT/);assert.equal(decoded,0);
  const preview=await verifyPng(samplePng(),{decode});assert.equal(preview.blob.type,'image/png');assert.equal(closed,1);
  await assert.rejects(verifyPng(samplePng(),{decode:async()=>({width:2,height:1,close(){closed++;}})}),/PNG_DECODE/);assert.equal(closed,2);
});
