import test from 'node:test';
import assert from 'node:assert/strict';
import * as external from './external-content.mjs';
import * as content from './compact-content.mjs';
import {externalGateways} from '../script/external-content-fixtures.mjs';
const raw=new TextEncoder().encode('hello');
const ar='ar://'+'A'.repeat(43),ipfs='ipfs://QmYwAPJzv5CZsnAzt8auVZRnGi2C2ZWfQ7eFMbB7xq4GoH/hello.txt';
test('fixture transport can retrieve through the replacement gateway without credentials or redirects',async()=>{
  const d=await external.describeExternal(raw,{locator:ipfs});
  const loader=external.createExternalLoader({gateways:externalGateways,fetch:async(url,options)=>{
    assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');
    assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(url==='https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnAzt8auVZRnGi2C2ZWfQ7eFMbB7xq4GoH/hello.txt'?raw:null,{status:url.startsWith('https://gateway.pinata.cloud/')?200:429});
  }});
  const result=await content.openContent(d,{loadCarrier:loader});
  assert.equal(result.state,'AVAILABLE_VERIFIED');assert.deepEqual(result.bytes,raw);
});

test('stream overflow, deadline and caller abort retain unavailable bytes and stop fallback',async()=>{
  const d=await external.describeExternal(raw,{locator:ipfs}),gateways={ipfs:['https://first.example/ipfs/']};
  let cancelled=false;
  const overflow=external.createExternalLoader({gateways,fetch:async()=>new Response(new ReadableStream({
    start(controller){controller.enqueue(new Uint8Array(6));},cancel(){cancelled=true;}
  }))});
  assert.equal((await content.openContent(d,{loadCarrier:overflow,maxBytes:5})).state,'UNAVAILABLE');assert.equal(cancelled,true);
  const stalled=({signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));
  const timeout=external.createExternalLoader({gateways,timeoutMs:10,fetch:async(_url,options)=>stalled(options)});
  assert.equal((await content.openContent(d,{loadCarrier:timeout})).state,'UNAVAILABLE');
  const controller=new AbortController();let requests=0;
  const abort=external.createExternalLoader({gateways:{ipfs:[...gateways.ipfs,'https://second.example/ipfs/']},fetch:async(_url,options)=>{
    requests++;const pending=stalled(options);controller.abort(Error('user cancelled'));return pending;
  }});
  await assert.rejects(()=>abort(d,{signal:controller.signal}),/user cancelled/);assert.equal(requests,1);
});
test('portable external locators survive compact encoding with a separate payload fingerprint',async()=>{
  for(const locator of [ar,ipfs]){
    const d=await external.describeExternal(raw,{locator,media:1});
    assert.equal(d.digest,'2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
    const encoded=content.encodeDescriptor(d);
    assert.equal(encoded.length,192+locator.length);assert.deepEqual(content.decodeDescriptor(encoded),d);
    assert.equal(new TextDecoder().decode(encoded.slice(192)),locator);
    assert.equal(encoded[127],1);assert.equal(encoded[159],5);
  }
});
test('gateway bytes are bounded and corruption never becomes available',async()=>{
  const d=await external.describeExternal(raw,{locator:ipfs});
  let url;
  const loader=external.createExternalLoader({gateways:{ipfs:['https://gateway.example/ipfs/']},fetch:async(u)=>{url=u;return new Response(raw);}});
  assert.equal((await content.openContent(d,{loadCarrier:loader})).state,'AVAILABLE_VERIFIED');
  assert.equal(url,'https://gateway.example/ipfs/QmYwAPJzv5CZsnAzt8auVZRnGi2C2ZWfQ7eFMbB7xq4GoH/hello.txt');
  const bad=external.createExternalLoader({gateways:{ipfs:['https://gateway.example/ipfs/']},fetch:async()=>new Response('jello')});
  assert.equal((await content.openContent(d,{loadCarrier:bad})).state,'CORRUPT');
  const large=external.createExternalLoader({gateways:{ipfs:['https://gateway.example/ipfs/']},fetch:async()=>new Response(new Uint8Array(9))});
  assert.equal((await content.openContent(d,{loadCarrier:large,maxBytes:5})).state,'UNAVAILABLE');
  assert.equal((await content.openContent(d,{loadCarrier:external.createExternalLoader({gateways:{}})})).state,'UNAVAILABLE');
});
test('external locator parsing rejects traversal, URL authorities, queries and malformed ids',()=>{
  for(const locator of ['https://example.com/file','ar://short',ipfs+'/../secret',ipfs+'?secret=1',ipfs+'#x',ipfs+'/%2e%2e/x',ipfs+'//x','ipfs://bad'])
    assert.throws(()=>external.parseExternalLocator(locator),/EXTERNAL_LOCATOR/);
  assert.throws(()=>external.createExternalLoader({gateways:{ar:['http://example.com/']}}),/GATEWAY/);
});
test('arweave gateway uses content isolation directly without following redirects',async()=>{
  let url;const locator='ar://hKMMPNh_emBf8v_at1tFzNYACisyMQNcKzeeE1QE9p8';
  const result=await external.inspectExternal(locator,{gateways:{ar:['https://arweave.net/']},fetch:async(u)=>{url=u;return new Response(raw);}});
  assert.equal(url,'https://qsrqypgyp55gax7s77nlow2fztlaacrlgiyqgxblg6pbgvae62pq.arweave.net/hKMMPNh_emBf8v_at1tFzNYACisyMQNcKzeeE1QE9p8');
  assert.equal(result.descriptor.locator,locator);assert.deepEqual(result.bytes,raw);
});
test('v1 exact descriptors remain 352 bytes; external 16MiB cap is separate',async()=>{
  const old=await content.describe(raw,{carrier:1});assert.equal(content.encodeDescriptor(old).length,352);
  const d=await external.describeExternal(new Uint8Array(1048577),{locator:ar});
  assert.equal((await content.openContent(d,{loadCarrier:async()=>new Uint8Array(1048577)})).state,'AVAILABLE_VERIFIED');
  assert.throws(()=>content.encodeDescriptor({...d,length:16777217,plainLength:16777217}),/LENGTH/);
});
test('known fingerprint permits a second gateway after corruption and retains corrupt verdict if all fail',async()=>{
  const d=await external.describeExternal(raw,{locator:ar});
  const gateways={ar:['https://first.example/','https://second.example/']};
  const loader=external.createExternalLoader({gateways,fetch:async url=>new Response(url.startsWith('https://first')?'jello':raw)});
  assert.equal((await content.openContent(d,{loadCarrier:loader})).state,'AVAILABLE_VERIFIED');
  const bad=external.createExternalLoader({gateways,fetch:async()=>new Response('jello')});
  assert.equal((await content.openContent(d,{loadCarrier:bad})).state,'CORRUPT');
});
test('dweb CIDv0 is addressed at its CIDv1 isolated origin without rewriting the authored locator',async()=>{
  let url;const d=await external.inspectExternal(ipfs,{gateways:{ipfs:['https://dweb.link/ipfs/']},fetch:async u=>{url=u;return new Response(raw);}});
  assert.equal(url,'https://bafybeie5nqv6kd3qnfjuprw2scvucpip3oc325kuej7x5rdkujaxkmfo6a.ipfs.dweb.link/hello.txt');
  assert.equal(d.descriptor.locator,ipfs);
});
