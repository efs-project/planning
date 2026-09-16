/** Exact disposable raw-SHA256/AES-GCM v2 profile. No implicit fetching, MIME
 * inference, credentials, or string conversion of payloads. Encrypted public
 * descriptors commit ciphertext only; plaintext digests are local read results. */
export const MAX_CONTENT_BYTES=1048576;
export const MAX_EXTERNAL_BYTES=16*1024*1024;
const zero='0'.repeat(64),nonceZero='0'.repeat(24);
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const unhex=text=>Uint8Array.from(text.match(/../g)??[],b=>parseInt(b,16));
const need=(yes,code)=>{if(!yes)throw Error(`CONTENT_${code}`);};
const bytesOf=bytes=>{need(bytes instanceof Uint8Array,'BYTES_REQUIRED');return bytes;};
const externalNeed=(yes,code)=>{if(!yes)throw Error(`EXTERNAL_${code}`);};
export function parseExternalLocator(locator){
  externalNeed(typeof locator==='string'&&locator.length<=512,'LOCATOR');
  if(/^ar:\/\/[A-Za-z0-9_-]{43}$/.test(locator))return {scheme:'ar',carrier:2,path:locator.slice(5)};
  const match=/^ipfs:\/\/((?:Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,120}))((?:\/[A-Za-z0-9._~-]+)*)$/.exec(locator);
  externalNeed(match&&!match[2].split('/').some(p=>p==='.'||p==='..'),'LOCATOR');
  return {scheme:'ipfs',carrier:3,path:locator.slice(7)};
}
export function validateExternalDescriptor(d){
  const parsed=parseExternalLocator(d.locator);
  externalNeed(d.version===2&&d.carrier===parsed.carrier&&d.algorithm===1&&[0,1,2].includes(d.media)&&d.encryption===0,'DESCRIPTOR');
  externalNeed([d.inline,d.digest].every(v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v))&&d.plainDigest===d.digest&&d.nonce===nonceZero,'DESCRIPTOR');
  externalNeed(Number.isSafeInteger(d.length)&&d.length>=0&&d.length<=MAX_EXTERNAL_BYTES&&d.plainLength===d.length,'DESCRIPTOR_LENGTH');return d;
}
export async function describeExternal(bytes,{locator,media=0}={}){
  externalNeed(bytes instanceof Uint8Array&&bytes.length<=MAX_EXTERNAL_BYTES,'BYTES_LENGTH');
  const parsed=parseExternalLocator(locator),hash=await digest(bytes);
  return validateExternalDescriptor({inline:zero,version:2,carrier:parsed.carrier,algorithm:1,length:bytes.length,digest:hash,media,encryption:0,nonce:nonceZero,plainLength:bytes.length,plainDigest:hash,locator});
}
export function encodeExternalDescriptor(d){
  // Keep word3 algorithm, word4 length and word5 digest for the immutable
  // generic field-index profile; the old eleven-word descriptor is unchanged.
  validateExternalDescriptor(d);const uri=new TextEncoder().encode(d.locator),bytes=new Uint8Array(192+uri.length);
  bytes.set(unhex(d.inline));bytes.set([2,d.carrier,d.media],32);bytes[127]=1;new DataView(bytes.buffer).setUint32(156,d.length,false);
  bytes.set(unhex(d.digest),160);bytes.set(uri,192);return bytes;
}
export function decodeExternalDescriptor(bytes){
  externalNeed(bytes instanceof Uint8Array&&bytes.length>192&&bytes.length<=704&&bytes[32]===2,'DESCRIPTOR');
  externalNeed(bytes.slice(35,127).every(b=>b===0)&&bytes[127]===1&&bytes.slice(128,156).every(b=>b===0),'DESCRIPTOR');
  const length=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(156,false),hash=hex(bytes.slice(160,192));
  return validateExternalDescriptor({inline:hex(bytes.slice(0,32)),version:2,carrier:bytes[33],media:bytes[34],length,digest:hash,algorithm:1,encryption:0,nonce:nonceZero,plainLength:length,plainDigest:hash,locator:new TextDecoder('utf-8',{fatal:true}).decode(bytes.slice(192))});
}
export async function digest(bytes) {return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytesOf(bytes))));}
export async function describe(bytes,{carrier=0,media=0,inline=zero}={}) {
  const hash=await digest(bytes);
  return {inline,version:1,carrier,algorithm:1,length:bytes.length,digest:hash,media,encryption:0,nonce:nonceZero,plainLength:bytes.length,plainDigest:hash};
}
function validate(d) {
  if(d.version===2){validateExternalDescriptor(d);return;}
  need(d.version===1&&[0,1].includes(d.carrier)&&d.algorithm===1&&[0,1,2].includes(d.media)&&[0,1].includes(d.encryption),'UNSUPPORTED');
  need([d.inline,d.digest,d.plainDigest].every(v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v))&&/^[0-9a-f]{24}$/.test(d.nonce),'DESCRIPTOR');
  need([d.length,d.plainLength].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=MAX_CONTENT_BYTES),'DESCRIPTOR_LENGTH');
  need(d.carrier!==0||d.length<=8160,'DESCRIPTOR_LENGTH');
  need(d.encryption===1?(d.length===d.plainLength+16&&d.plainDigest===zero):(d.nonce===nonceZero&&d.length===d.plainLength&&d.digest===d.plainDigest),'DESCRIPTOR_ENCRYPTION');
}
export function encodeDescriptor(d) {
  if(d.version===2)return encodeExternalDescriptor(d);
  validate(d);const word=n=>n.toString(16).padStart(64,'0');
  return unhex([d.inline,word(d.version),word(d.carrier),word(d.algorithm),word(d.length),d.digest,word(d.media),word(d.encryption),d.nonce+'0'.repeat(40),word(d.plainLength),d.plainDigest].join(''));
}
export function decodeDescriptor(bytes) {
  if(bytesOf(bytes)[32]===2)return decodeExternalDescriptor(bytes);
  need(bytesOf(bytes).length===352,'DESCRIPTOR_LENGTH');
  const words=Array.from({length:11},(_,i)=>hex(bytes.slice(i*32,(i+1)*32))),n=i=>Number(BigInt('0x'+words[i]));
  need(words[8].slice(24)==='0'.repeat(40),'DESCRIPTOR_NONCE');
  const d={inline:words[0],version:n(1),carrier:n(2),algorithm:n(3),length:n(4),digest:words[5],media:n(6),encryption:n(7),nonce:words[8].slice(0,24),plainLength:n(9),plainDigest:words[10]};
  validate(d);return d;
}
export function rawId(d) {need(d.algorithm===1&&/^[0-9a-f]{64}$/.test(d.digest),'RAW_ID');return `efs-raw-sha256:${d.digest}`;}
export function parseRawId(id) {need(/^efs-raw-sha256:[0-9a-f]{64}$/.test(id),'RAW_ID');return id.slice(15);}
export async function encryptContent(bytes,key,{carrier=0,media=0}={}) {
  bytesOf(bytes);need(bytesOf(key).length===32,'KEY_LENGTH');
  const nonce=crypto.getRandomValues(new Uint8Array(12)),k=await crypto.subtle.importKey('raw',key,'AES-GCM',false,['encrypt']);
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,tagLength:128},k,bytes));
  const descriptor={...await describe(ciphertext,{carrier,media}),encryption:1,nonce:hex(nonce),plainLength:bytes.length,plainDigest:zero};
  validate(descriptor);return {bytes:ciphertext,descriptor};
}
export async function openContent(d,{loadCarrier,signal,maxBytes=d.version===2?MAX_EXTERNAL_BYTES:MAX_CONTENT_BYTES,key}={}) {
  signal?.throwIfAborted();
  try{validate(d);}catch(error){return {state:'UNSUPPORTED',reason:error.message};}
  need(Number.isSafeInteger(maxBytes)&&maxBytes>=0&&maxBytes<=MAX_EXTERNAL_BYTES,'BYTE_LIMIT');
  if(d.length>maxBytes)return {state:'UNAVAILABLE',reason:'BYTE_LIMIT'};
  let bytes;
  try{bytes=bytesOf(await loadCarrier(d,{signal,maxBytes})).slice();signal?.throwIfAborted();}
  catch(error){signal?.throwIfAborted();return {state:'UNAVAILABLE',reason:'TRANSPORT_UNAVAILABLE'};}
  if(bytes.length!==d.length)return {state:'CORRUPT',reason:'LENGTH_MISMATCH'};
  if(await digest(bytes)!==d.digest)return {state:'CORRUPT',reason:'DIGEST_MISMATCH'};
  signal?.throwIfAborted();
  if(!d.encryption)return {state:'AVAILABLE_VERIFIED',bytes,ciphertextVerified:false,plaintextVerified:true};
  if(!key)return {state:'OPAQUE',reason:'KEY_NEEDED',ciphertextVerified:true,plaintextVerified:false};
  try {
    need(bytesOf(key).length===32,'KEY_LENGTH');
    const k=await crypto.subtle.importKey('raw',key,'AES-GCM',false,['decrypt']);
    const clear=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:unhex(d.nonce),tagLength:128},k,bytes));
    signal?.throwIfAborted();
    if(clear.length!==d.plainLength)return {state:'CORRUPT',reason:'PLAINTEXT_MISMATCH',ciphertextVerified:true};
    const plainDigest=await digest(clear);signal?.throwIfAborted();
    return {state:'AVAILABLE_VERIFIED',bytes:clear,ciphertextVerified:true,plaintextVerified:true,plainDigest};
  }catch(error){signal?.throwIfAborted();return {state:'OPAQUE',reason:'AUTHENTICATION_FAILED',ciphertextVerified:true,plaintextVerified:false};}
}
