import {MAX_CONTENT_BYTES,rawId,parseRawId,digest} from './compact-content.mjs';
/** Explicit disposable local driver upload; never a general authenticated store. */
export async function storeRawBytes(bytes,{origin,signal,maxBytes=MAX_CONTENT_BYTES,timeoutMs=5000}={}) {
  createRawTransport({origin,maxBytes,timeoutMs});const base=new URL(origin);
  need(base.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(base.hostname),'LOCAL_UPLOAD_ONLY');
  need(bytes instanceof Uint8Array&&bytes.length<=maxBytes,'BYTE_LIMIT');
  const hash=await digest(bytes),combined=AbortSignal.any([AbortSignal.timeout(timeoutMs),...(signal?[signal]:[])]);combined.throwIfAborted();
  const response=await fetch(new URL(`/raw/sha256/${hash}`,base),{method:'PUT',body:bytes,credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:combined});
  need(response.ok&&!response.redirected,'UPLOAD_UNAVAILABLE');return hash;
}
const need=(yes,code)=>{if(!yes)throw Error(`CONTENT_${code}`);};
/** Caller explicitly grants one origin. Credentials and redirects never flow.
 * Streaming limit/time/cancellation bound the host; SDK verifies identity. */
export function createRawTransport({origin,maxBytes=MAX_CONTENT_BYTES,timeoutMs=5000,fetchImpl=fetch}) {
  const base=new URL(origin);
  need(!base.username&&!base.password&&base.pathname==='/'&&!base.search&&!base.hash
    &&(base.protocol==='https:'||(base.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(base.hostname))),'ORIGIN');
  need(Number.isSafeInteger(maxBytes)&&maxBytes>=0&&maxBytes<=MAX_CONTENT_BYTES&&Number.isInteger(timeoutMs)&&timeoutMs>0&&timeoutMs<=20000,'HOST_LIMIT');
  return async(descriptor,{signal,maxBytes:requestMax=maxBytes}={})=>{
    need(descriptor.carrier===1,'UNSUPPORTED');
    const digest=parseRawId(rawId(descriptor)),limit=Math.min(maxBytes,requestMax);
    need(descriptor.length<=limit,'BYTE_LIMIT');
    const combined=AbortSignal.any([AbortSignal.timeout(timeoutMs),...(signal?[signal]:[])]);combined.throwIfAborted();
    const response=await fetchImpl(new URL(`/raw/sha256/${digest}`,base),{credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',signal:combined});
    need(response.ok&&!response.redirected,'TRANSPORT_UNAVAILABLE');
    const declared=response.headers.get('content-length');if(declared!==null)need(/^\d+$/.test(declared)&&Number(declared)<=limit,'BYTE_LIMIT');
    need(response.body,'TRANSPORT_UNAVAILABLE');const reader=response.body.getReader(),parts=[];let length=0;
    try {while(true){combined.throwIfAborted();const {value,done}=await reader.read();if(done)break;length+=value.length;need(length<=limit,'BYTE_LIMIT');parts.push(value);}}
    finally {await reader.cancel().catch(()=>{});reader.releaseLock();}
    const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}combined.throwIfAborted();return bytes;
  };
}
function crc(bytes){let value=0xffffffff;for(const b of bytes){value^=b;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0);}return (value^0xffffffff)>>>0;}
/** Narrow static RGBA8 PNG only. Check dimensions BEFORE decoding. Decoder
 * success is still required; authored media metadata is not syntax evidence. */
export function pngHeader(bytes) {
  need(bytes instanceof Uint8Array&&bytes.length>=57&&bytes.length<=MAX_CONTENT_BYTES,'PNG');
  need([137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b),'PNG');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);let offset=8,width,height,sawData=false,ended=false;
  while(offset+12<=bytes.length){
    const length=view.getUint32(offset),end=offset+12+length;need(end<=bytes.length,'PNG');
    const kind=String.fromCharCode(...bytes.slice(offset+4,offset+8));need(crc(bytes.slice(offset+4,end-4))===view.getUint32(end-4),'PNG_CRC');
    if(offset===8){need(kind==='IHDR'&&length===13,'PNG');width=view.getUint32(offset+8);height=view.getUint32(offset+12);
      need(width>0&&height>0&&width<=2048&&height<=2048&&width*height<=1048576,'PIXEL_LIMIT');
      need(bytes[offset+16]===8&&bytes[offset+17]===6&&bytes[offset+18]===0&&bytes[offset+19]===0&&bytes[offset+20]===0,'PNG_UNSUPPORTED');
    }else if(kind==='IDAT'){need(!ended&&length>0,'PNG');sawData=true;}
    else if(kind==='IEND'){need(length===0&&sawData&&end===bytes.length,'PNG');ended=true;}
    else need(false,'PNG_UNSUPPORTED');
    offset=end;
  }
  need(ended&&offset===bytes.length,'PNG');return {width,height};
}
export async function verifyPng(bytes,{signal,decode=createImageBitmap}={}) {
  const header=pngHeader(bytes);signal?.throwIfAborted();const blob=new Blob([bytes],{type:'image/png'}),bitmap=await decode(blob);
  try{signal?.throwIfAborted();need(bitmap.width===header.width&&bitmap.height===header.height,'PNG_DECODE');return {blob,...header};}
  finally{bitmap.close();}
}

/** Normal raster uploads, not executable document rendering. Dimensions are
 * bounded before invoking the browser decoder; exact bytes were checked by SDK. */
export async function verifyRaster(bytes,{signal,decode=createImageBitmap}={}){
  need(bytes instanceof Uint8Array&&bytes.length>=24&&bytes.length<=MAX_CONTENT_BYTES,'IMAGE');
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  let width,height,type;
  if([137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b)){
    need(view.getUint32(8)===13&&view.getUint32(12)===0x49484452,'PNG');
    width=view.getUint32(16);height=view.getUint32(20);type='image/png';
  }else if(bytes[0]===255&&bytes[1]===216){
    let at=2;
    while(at+4<=bytes.length){
      need(bytes[at++]===255,'JPEG');while(bytes[at]===255)at++;
      const marker=bytes[at++];if(marker===0xda||marker===0xd9)break;
      const length=view.getUint16(at);need(length>=2&&at+length<=bytes.length,'JPEG');
      if([0xc0,0xc1,0xc2].includes(marker)){need(length>=8,'JPEG');height=view.getUint16(at+3);width=view.getUint16(at+5);break;}
      at+=length;
    }
    type='image/jpeg';
  }else need(false,'IMAGE_UNSUPPORTED');
  need(width>0&&height>0&&width<=8192&&height<=8192&&width*height<=16777216,'PIXEL_LIMIT');
  signal?.throwIfAborted();const blob=new Blob([bytes],{type}),bitmap=await decode(blob);
  try{signal?.throwIfAborted();need(bitmap.width===width&&bitmap.height===height,'IMAGE_DECODE');return {blob,width,height};}
  finally{bitmap.close();}
}
