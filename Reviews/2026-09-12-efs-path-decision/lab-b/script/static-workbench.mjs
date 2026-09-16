/** Deliberately dumb static host: no Vite, API routes, config generation,
 * signing, RPC proxy, or SPA rewrite. Use to test IPFS-like path prefixes. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const prefix='/ipfs/local-workbench/';
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'};
const server=createServer(async(req,res)=>{
  if(req.method!=='GET'||!/^127\.0\.0\.1:\d+$/.test(req.headers.host??'')){res.writeHead(403).end();return;}
  try{
    const path=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    if(!path.startsWith(prefix)){res.writeHead(404).end();return;}
    const relative=path.slice(prefix.length)||'index.html';
    if(relative.startsWith('/')||relative.split('/').some(part=>part==='..'||part==='.')||relative.includes('\\')){res.writeHead(404).end();return;}
    const bytes=await readFile(resolve(root,relative));
    res.writeHead(200,{'Content-Type':mime[extname(relative)]??'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}).end(bytes);
  }catch{res.writeHead(404).end();}
});
await new Promise((ok,no)=>{server.once('error',no);server.listen(Number(process.env.EFS_STATIC_PORT??4173),'127.0.0.1',ok);});
console.log(`Static-only test: http://127.0.0.1:${server.address().port}${prefix}`);
const stop=()=>{server.closeAllConnections();server.close();};
process.once('SIGINT',stop);process.once('SIGTERM',stop);
