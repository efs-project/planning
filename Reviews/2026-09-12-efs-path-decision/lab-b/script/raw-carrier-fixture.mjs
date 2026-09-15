/** Optional run-owned static RAW transport, not an EFS service or index. */
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
export async function startRawCarrier(objects=[]) {
  const files=new Map(objects.map(bytes=>[createHash('sha256').update(bytes).digest('hex'),Buffer.from(bytes)]));
  let uploadOrigin=null,total=Array.from(files.values()).reduce((n,b)=>n+b.length,0);
  if(files.size>32||total>8388608||objects.some(b=>b.length>1048576))throw Error('Fixture byte quota exceeded');
  const server=createServer(async(req,res)=>{
    res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    if(!/^127\.0\.0\.1:\d+$/.test(req.headers.host??'')){res.writeHead(403).end();return;}
    if(req.method==='PUT'||req.method==='OPTIONS'){
      if(req.headers.origin&&req.headers.origin!==uploadOrigin){res.writeHead(403).end();return;}
      res.setHeader('Access-Control-Allow-Origin',uploadOrigin??'*');res.setHeader('Access-Control-Allow-Methods','GET, PUT, OPTIONS');
      if(req.method==='OPTIONS'){res.writeHead(204).end();return;}
      const match=/^\/raw\/sha256\/([0-9a-f]{64})$/.exec(req.url);if(!match){res.writeHead(404).end();return;}
      if(Number(req.headers['content-length']??0)>1048576){res.writeHead(413).end();return;}
      req.setTimeout(5000,()=>req.destroy());const chunks=[];let size=0;
      try{for await(const chunk of req){size+=chunk.length;if(size>1048576){res.writeHead(413).end();return;}chunks.push(chunk);}}
      catch{if(!res.headersSent)res.writeHead(408).end();return;}
      const bytes=Buffer.concat(chunks);if(createHash('sha256').update(bytes).digest('hex')!==match[1]){res.writeHead(422).end();return;}
      if(!files.has(match[1])){if(files.size>=32||total+size>8388608){res.writeHead(507).end();return;}files.set(match[1],bytes);total+=size;}
      res.writeHead(201).end();return;
    }
    const match=/^\/raw\/sha256\/([0-9a-f]{64})$/.exec(req.url),bytes=match&&files.get(match[1]);
    if(req.method!=='GET'||!bytes){res.writeHead(404).end();return;}
    res.setHeader('Content-Type','application/octet-stream');res.setHeader('Content-Length',bytes.length);res.end(bytes);
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  return {origin:`http://127.0.0.1:${server.address().port}`,allowUploadOrigin(origin){const parsed=new URL(origin);if(parsed.origin!==origin||parsed.hostname!=='127.0.0.1')throw Error('Loopback origin required');uploadOrigin=origin;},
    close:()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);})};
}
