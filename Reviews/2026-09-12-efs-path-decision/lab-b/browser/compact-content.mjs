/** Exact disposable raw-SHA256/AES-GCM profile. No implicit fetching, MIME
 * inference, credentials, or string conversion of payloads. Byte identity is
 * independent of transport and plaintext identity is independent of ciphertext. */
export const MAX_CONTENT_BYTES=1048576;
const zero='0'.repeat(64),nonceZero='0'.repeat(24);
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const unhex=text=>Uint8Array.from(text.match(/../g)??[],b=>parseInt(b,16));
const need=(yes,code)=>{if(!yes)throw Error(`CONTENT_${code}`);};
const bytesOf=bytes=>{need(bytes instanceof Uint8Array,'BYTES_REQUIRED');return bytes;};
export async function digest(bytes) {return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytesOf(bytes))));}
export async function describe(bytes,{carrier=0,media=0,inline=zero}={}) {
  const hash=await digest(bytes);
  return {inline,version:1,carrier,algorithm:1,length:bytes.length,digest:hash,media,encryption:0,nonce:nonceZero,plainLength:bytes.length,plainDigest:hash};
}
function validate(d) {
  need(d.version===1&&[0,1].includes(d.carrier)&&d.algorithm===1&&[0,1,2].includes(d.media)&&[0,1].includes(d.encryption),'UNSUPPORTED');
  need([d.inline,d.digest,d.plainDigest].every(v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v))&&/^[0-9a-f]{24}$/.test(d.nonce),'DESCRIPTOR');
  need([d.length,d.plainLength].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=MAX_CONTENT_BYTES),'DESCRIPTOR_LENGTH');
  need(d.carrier!==0||d.length<=8160,'DESCRIPTOR_LENGTH');
  need(d.encryption===1?d.length===d.plainLength+16:(d.nonce===nonceZero&&d.length===d.plainLength&&d.digest===d.plainDigest),'DESCRIPTOR_ENCRYPTION');
}
export function encodeDescriptor(d) {
  validate(d);const word=n=>n.toString(16).padStart(64,'0');
  return unhex([d.inline,word(d.version),word(d.carrier),word(d.algorithm),word(d.length),d.digest,word(d.media),word(d.encryption),d.nonce+'0'.repeat(40),word(d.plainLength),d.plainDigest].join(''));
}
export function decodeDescriptor(bytes) {
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
  const descriptor={...await describe(ciphertext,{carrier,media}),encryption:1,nonce:hex(nonce),plainLength:bytes.length,plainDigest:await digest(bytes)};
  validate(descriptor);return {bytes:ciphertext,descriptor};
}
export async function openContent(d,{loadCarrier,signal,maxBytes=MAX_CONTENT_BYTES,key}={}) {
  signal?.throwIfAborted();
  try{validate(d);}catch(error){return {state:'UNSUPPORTED',reason:error.message};}
  need(Number.isSafeInteger(maxBytes)&&maxBytes>=0&&maxBytes<=MAX_CONTENT_BYTES,'BYTE_LIMIT');
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
    if(clear.length!==d.plainLength||await digest(clear)!==d.plainDigest)return {state:'CORRUPT',reason:'PLAINTEXT_MISMATCH',ciphertextVerified:true};
    return {state:'AVAILABLE_VERIFIED',bytes:clear,ciphertextVerified:true,plaintextVerified:true};
  }catch(error){signal?.throwIfAborted();return {state:'OPAQUE',reason:'AUTHENTICATION_FAILED',ciphertextVerified:true,plaintextVerified:false};}
}
