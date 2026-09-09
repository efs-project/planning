// Browser-only bounded JSON transport. Same-origin relay, no wallet discovery.
export async function boundedJSON(response,maxBytes,signal){
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>1048576)throw Error('response bound');
  signal?.throwIfAborted();const reader=response.body?.getReader();if(!reader)throw Error('response body missing');
  const chunks=[];let size=0;
  const abort=()=>{reader.cancel(signal.reason).catch(()=>{});};signal?.addEventListener('abort',abort,{once:true});
  try{
    while(true){signal?.throwIfAborted();const {done,value}=await reader.read();signal?.throwIfAborted();if(done)break;size+=value.byteLength;if(size>maxBytes)throw Error('response limit');chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  }finally{signal?.removeEventListener('abort',abort);await reader.cancel().catch(()=>{});reader.releaseLock();}
}
export function createRPCSource({identity,fetcher=fetch}){
  return Object.freeze({identity,epoch:1,async request(method,params,{signal,maxBytes=262144}={}){
    if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>262144)throw Error('result bound');
    const response=await fetcher('/rpc',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({method,params}),signal,credentials:'omit',cache:'no-store'});
    const body=await boundedJSON(response,maxBytes+128,signal);
    if(!response.ok||!body||Object.keys(body).join(',')!=='result')throw Error(body?.error??'RPC envelope refused');
    if(new TextEncoder().encode(JSON.stringify(body.result)).byteLength>maxBytes)throw Error('result limit');
    return body.result;
  }});
}
