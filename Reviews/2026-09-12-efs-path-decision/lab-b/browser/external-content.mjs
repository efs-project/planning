/** Disposable external-locator/2 profile. Gateways are replaceable transport,
 * never identity or availability authority. SHA256 authenticates EFS-authored
 * payload bytes, NOT an Arweave transaction or an IPFS UnixFS DAG proof. */
import {MAX_EXTERNAL_BYTES,parseExternalLocator,describeExternal,digest} from './compact-content.mjs';
export {MAX_EXTERNAL_BYTES,parseExternalLocator,describeExternal} from './compact-content.mjs';
const need=(yes,code)=>{if(!yes)throw Error(`EXTERNAL_${code}`);};
const base32=bytes=>{let bits=0,value=0,result='';for(const byte of bytes){value=(value<<8)|byte;bits+=8;while(bits>=5){result+='abcdefghijklmnopqrstuvwxyz234567'[(value>>>(bits-5))&31];bits-=5;}}if(bits)result+='abcdefghijklmnopqrstuvwxyz234567'[(value<<(5-bits))&31];return result;};
function gatewayURL(base,scheme,path){
  const url=new URL(base);
  // arweave.net otherwise redirects; derive its isolation subdomain locally.
  if(scheme==='ar'&&url.hostname==='arweave.net'&&url.pathname==='/'){
    const bytes=Uint8Array.from(atob(path.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
    url.hostname=base32(bytes)+'.arweave.net';return url.href+path;
  }
  if(scheme==='ipfs'&&url.hostname==='dweb.link'&&url.pathname==='/ipfs/'){
    const [cid,...segments]=path.split('/');let normalized=cid;
    if(cid.startsWith('Qm')){
      let value=0n;for(const c of cid)value=value*58n+BigInt('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.indexOf(c));
      const raw=[];while(value){raw.unshift(Number(value&255n));value>>=8n;}normalized='b'+base32(Uint8Array.of(1,112,...raw));
    }
    url.hostname=normalized+'.ipfs.dweb.link';url.pathname='/'+segments.join('/');return url.href;
  }
  return base+path;
}
function gatewayBases(gateways){
  return Object.fromEntries(['ar','ipfs'].map(scheme=>[scheme,(gateways?.[scheme]??[]).map(base=>{
    const url=new URL(base);need(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash,'GATEWAY');
    need(url.pathname.endsWith('/'),'GATEWAY');return url.href;
  })]));
}
export function createExternalLoader({gateways={},fetch:fetcher=globalThis.fetch,timeoutMs=15000}={}){
  const bases=gatewayBases(gateways);need(Number.isSafeInteger(timeoutMs)&&timeoutMs>0&&timeoutMs<=60000,'TIMEOUT');
  return async function loadExternal(descriptor,{signal,maxBytes=MAX_EXTERNAL_BYTES}={}){
    signal?.throwIfAborted();const {scheme,path}=parseExternalLocator(descriptor.locator);
    need(Number.isSafeInteger(maxBytes)&&maxBytes>=0&&maxBytes<=MAX_EXTERNAL_BYTES,'BYTE_LIMIT');
    let last,corrupt;
    for(const base of bases[scheme]){
      const controller=new AbortController(),abort=()=>controller.abort(signal.reason);
      signal?.addEventListener('abort',abort,{once:true});const timer=setTimeout(()=>controller.abort(),timeoutMs);
      let reader;
      try{
        const response=await fetcher(gatewayURL(base,scheme,path),{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',cache:'no-store'});
        need(response.ok,'HTTP');const declared=response.headers.get('content-length');
        need(declared===null||(/^\d+$/.test(declared)&&Number(declared)<=maxBytes),'BYTE_LIMIT');
        need(response.body&&typeof response.body.getReader==='function','STREAM_REQUIRED');reader=response.body.getReader();
        const chunks=[];let size=0;
        for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;need(size<=maxBytes,'BYTE_LIMIT');chunks.push(value);}
        signal?.throwIfAborted();const bytes=new Uint8Array(size);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
        if(typeof descriptor.digest==='string'&&(bytes.length!==descriptor.length||await digest(bytes)!==descriptor.digest)){corrupt=bytes;continue;}
        signal?.throwIfAborted();return bytes;
      }catch(error){signal?.throwIfAborted();last=error;}
      finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);await reader?.cancel().catch(()=>{});controller.abort();}
    }
    if(corrupt)return corrupt; // Core content opener preserves CORRUPT, never availability.
    throw last??Error('EXTERNAL_GATEWAY_UNAVAILABLE');
  };
}
export async function inspectExternal(locator,{gateways,signal,maxBytes=MAX_EXTERNAL_BYTES,media=0,fetch,timeoutMs}={}){
  parseExternalLocator(locator);const bytes=await createExternalLoader({gateways,fetch,timeoutMs})({locator},{signal,maxBytes});
  signal?.throwIfAborted();return {bytes,descriptor:await describeExternal(bytes,{locator,media})};
}
