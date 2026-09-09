// Local fixture relay only: no wallet, write RPC, directory crawl or hosted service.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { gzip as gzipCallback } from 'node:zlib';
import { promisify } from 'node:util';
const gzip=promisify(gzipCallback);
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v);
const files=new Map([
  ['/','../web/index.html'],['/screen/app.mjs','../web/app.mjs'],
  ['/screen/files.css','../web/files.css'],['/screen/rpc-source.mjs','../web/rpc-source.mjs'],
  ...['index.mjs','reader-scope.mjs','files-reader.mjs','files-profile.mjs'].map(p=>['/Reviews/2026-09-09-files-reader/'+p,'../../2026-09-09-files-reader/'+p]),
  ['/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js','../../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js'],
]);
const quantity=x=>typeof x==='string'&&/^0x(?:0|[1-9a-f][0-9a-f]*)$/.test(x);
const hex=(x,n)=>typeof x==='string'&&new RegExp('^0x[0-9a-fA-F]{'+n+'}$').test(x);
const block=x=>x&&Object.keys(x).length===2&&hex(x.blockHash,64)&&x.requireCanonical===true;
function deliveryChoice(header='',allowGzip=false){
  const entries=header.toLowerCase().split(',').map(item=>{
    const [name,...params]=item.trim().split(';');
    const quality=params.length===0?1:params.length===1&&/^q=(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(params[0].trim())?Number(params[0].trim().slice(2)):0;
    return {name:name.trim(),quality};
  });
  const quality=name=>{const matches=entries.filter(e=>e.name===name);return matches.length?Math.min(...matches.map(e=>e.quality)):undefined;};
  const wildcard=quality('*'),identity=quality('identity')??(wildcard===0?0:1);
  const zipped=allowGzip?(quality('gzip')??wildcard??0):0;
  return zipped>0&&zipped>=identity?'gzip':identity>0?'identity':null;
}
export async function startScreenServer({config,rpc,addresses,selectors,delivery='identity'}){
  if(!['identity','gzip'].includes(delivery))throw Error('fixture delivery');
  const targets=new Set(addresses.map(a=>a.toLowerCase())),methods=new Set(selectors),trace=[];
  let url,delayMs=0,closed=false;
  function valid({method,params:p}){
    if(!Array.isArray(p))return false;
    if(method==='eth_chainId')return p.length===0;
    if(method==='eth_getBlockByNumber')return p.length===2&&(p[0]==='latest'||quantity(p[0]))&&p[1]===false;
    if(method==='eth_getCode')return p.length===2&&targets.has(p[0]?.toLowerCase?.())&&block(p[1]);
    if(method==='eth_getStorageAt')return p.length===3&&targets.has(p[0]?.toLowerCase?.())&&hex(p[1],64)&&block(p[2]);
    if(method==='eth_call')return p.length===2&&p[0]&&Object.keys(p[0]).length===2&&targets.has(p[0].to?.toLowerCase?.())&&
      typeof p[0].data==='string'&&/^0x(?:[0-9a-fA-F]{2}){4,16384}$/.test(p[0].data)&&methods.has(p[0].data.slice(0,10))&&block(p[1]);
    return false;
  }
  const server=http.createServer(async(req,res)=>{
    const send=async(status,body,type='application/json')=>{
      if(res.destroyed)return;
      const raw=Buffer.isBuffer(body)?body:Buffer.from(body),eligible=req.method==='GET'&&status===200;
      const selected=eligible?deliveryChoice(req.headers['accept-encoding'],raw.length>=1024&&delivery==='gzip'):'identity';
      if(selected===null){res.writeHead(406,{'content-length':0,'cache-control':'no-store','vary':'Accept-Encoding'});res.end();return;}
      const compressed=selected==='gzip';
      const payload=compressed?await gzip(raw,{level:6}):raw;
      if(res.destroyed)return;
      res.writeHead(status,{'content-type':type,'cache-control':'no-store','content-length':payload.length,
      ...(eligible?{'vary':'Accept-Encoding'}:{}),...(compressed?{'content-encoding':'gzip'}:{}),
      'x-content-type-options':'nosniff','referrer-policy':'no-referrer',
      'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"});res.end(payload);};
    try{
      if(closed||req.headers.host!==new URL(url).host)return send(403,json({error:'host refused'}));
      const path=new URL(req.url,url).pathname;
      if(req.method==='GET'&&path==='/config')return send(200,json({...config,injectedDelayMs:delayMs}));
      if(req.method==='GET'&&files.has(path)){
        const body=await readFile(new URL(files.get(path),import.meta.url));
        return send(200,body,path==='/'?'text/html; charset=utf-8':path.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8');
      }
      if(req.method!=='POST'||path!=='/rpc')return send(404,json({error:'not found'}));
      if(req.headers.origin!==url||req.headers['content-type']!=='application/json')return send(403,json({error:'same-origin JSON required'}));
      let size=0;const chunks=[];
      for await(const chunk of req){size+=chunk.length;if(size>65536){send(413,json({error:'request too large'}));req.resume();return;}chunks.push(chunk);}
      let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));}catch{return send(400,json({error:'malformed JSON'}));}
      if(!body||Object.keys(body).sort().join(',')!=='method,params'||!valid(body))return send(400,json({error:'read request refused'}));
      if(trace.length>=8192)return send(429,json({error:'fixture session request limit'}));
      const attempt={method:body.method,params:body.params,bytes:0,startedMs:performance.now(),endedMs:null};trace.push(attempt);
      try{
        if(delayMs)await new Promise(resolve=>setTimeout(resolve,delayMs));
        if(closed||res.destroyed)throw Error('request cancelled before forwarding');
        const result=await rpc(body.method,body.params);attempt.bytes=Buffer.byteLength(json(result));
        if(attempt.bytes>262144)throw Error('response limit');
        attempt.endedMs=performance.now();return send(200,json({result}));
      }catch(e){attempt.error=e.message;attempt.endedMs=performance.now();return send(502,json({error:e.message}));}
    }catch(e){send(500,json({error:'fixture unavailable'}));}
  });
  server.requestTimeout=10000;server.headersTimeout=10000;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  url='http://127.0.0.1:'+server.address().port;
  return {url,trace,setDelay(ms){if(ms!==0&&ms!==50)throw Error('fixture delay');delayMs=ms;},
    setDelivery(value){if(!['identity','gzip'].includes(value))throw Error('fixture delivery');delivery=value;},
    async close(){closed=true;server.closeAllConnections();await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}};
}
