import test from 'node:test';
import assert from 'node:assert/strict';
import * as content from './compact-content.mjs';
const binary=Uint8Array.of(0,255,128,65);
const emptyHash='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
test('binary and empty bytes retain their identity without UTF-8 conversion',async()=>{
  assert.equal(await content.digest(new Uint8Array()),emptyHash);
  const d=await content.describe(binary);assert.equal(d.length,4);
  const opened=await content.openContent(d,{loadCarrier:async()=>binary});
  assert.equal(opened.state,'AVAILABLE_VERIFIED');assert.deepEqual(opened.bytes,binary);
  assert.equal((await content.openContent(await content.describe(new Uint8Array()),{loadCarrier:async()=>new Uint8Array()})).state,'AVAILABLE_VERIFIED');
});
test('descriptor fixed codec rejects malformed lengths, unsupported algorithms and noncanonical raw identities',async()=>{
  const d=await content.describe(binary,{carrier:1}),encoded=content.encodeDescriptor(d);
  assert.equal(encoded.length,352);assert.deepEqual(content.decodeDescriptor(encoded),d);
  assert.throws(()=>content.decodeDescriptor(encoded.slice(1)),/DESCRIPTOR/);
  const forged=encoded.slice();forged[127]=2;assert.throws(()=>content.decodeDescriptor(forged),/UNSUPPORTED/);
  assert.equal(content.rawId({...d,digest:emptyHash}),`efs-raw-sha256:${emptyHash}`);
  assert.throws(()=>content.parseRawId(`ipfs://${emptyHash}`),/RAW_ID/);
});
test('transport failure, corruption, truncation, oversize and unsupported carriage are distinct',async()=>{
  const d=await content.describe(binary,{carrier:1});
  assert.equal((await content.openContent(d,{loadCarrier:async()=>{throw Error('offline');}})).state,'UNAVAILABLE');
  for(const bytes of [Uint8Array.of(1,255,128,65),binary.slice(1),new Uint8Array(5)])
    assert.equal((await content.openContent(d,{loadCarrier:async()=>bytes})).state,'CORRUPT');
  let calls=0;assert.equal((await content.openContent({...d,carrier:9},{loadCarrier:async()=>{calls++;return binary;}})).state,'UNSUPPORTED');assert.equal(calls,0);
  assert.equal((await content.openContent(d,{maxBytes:3,loadCarrier:async()=>{calls++;return binary;}})).reason,'BYTE_LIMIT');assert.equal(calls,0);
});
test('AES-GCM verifies ciphertext before key use and authenticates plaintext with supplied key',async()=>{
  const key=crypto.getRandomValues(new Uint8Array(32)),sealed=await content.encryptContent(binary,key);
  const loadCarrier=async()=>sealed.bytes;
  assert.equal((await content.openContent(sealed.descriptor,{loadCarrier})).state,'OPAQUE');
  assert.equal((await content.openContent(sealed.descriptor,{loadCarrier,key:new Uint8Array(32)})).reason,'AUTHENTICATION_FAILED');
  const clear=await content.openContent(sealed.descriptor,{loadCarrier,key});assert.deepEqual(clear.bytes,binary);assert.equal(clear.state,'AVAILABLE_VERIFIED');
  const corrupt=sealed.bytes.slice();corrupt[0]^=1;
  assert.equal((await content.openContent(sealed.descriptor,{loadCarrier:async()=>corrupt,key})).reason,'DIGEST_MISMATCH');
});
test('aborted opens never resolve as available',async()=>{
  const abort=new AbortController(),d=await content.describe(binary);abort.abort();
  await assert.rejects(content.openContent(d,{signal:abort.signal,loadCarrier:async()=>binary}),/abort/i);
});
