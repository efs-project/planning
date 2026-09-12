import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {ROOT} from './world.mjs';
// Closed static route table: no proxy, database, signing endpoint or filesystem traversal.
const routes={
  '/':['web/index.html','text/html'],
  '/app.mjs':['web/app.mjs','text/javascript'],
  '/style.css':['web/style.css','text/css'],
  '/client.mjs':['sdk/client.mjs','text/javascript'],
  '/qualification.mjs':['sdk/qualification.mjs','text/javascript'],
  '/source-graphs.mjs':['sdk/source-graphs.mjs','text/javascript'],
  '/ethers.js':['../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.min.js','text/javascript'],
  '/cost-ledger.mjs':['../2026-09-09-files-browser-mvp/web/cost-ledger.mjs','text/javascript'],
};
export async function withServer(config,action,{port=0,loadAsset=path=>readFile(ROOT+path)}={}) {
  // Freeze this world's closed assets and serialized config before opening a socket.
  // Copy loader buffers too: later source/config mutations cannot alter a live demo.
  const configSnapshot=JSON.stringify(config);
  const assets=new Map(await Promise.all(Object.entries(routes).map(async([url,[path,type]])=>[url,{type,body:Buffer.from(await loadAsset(path))}])));
  const server=createServer((req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    if(req.headers.host!==`127.0.0.1:${server.address().port}`){res.writeHead(403);res.end('Loopback host required');return;}
    if(req.method!=='GET'){res.writeHead(405);res.end('Static GET only');return;}
    if(req.url==='/config.json'){res.setHeader('Content-Type','application/json');res.end(configSnapshot);return;}
    const asset=assets.get(req.url);if(!asset){res.writeHead(404);res.end('Not found');return;}
    res.setHeader('Content-Type',asset.type);res.end(asset.body);
  });
  await new Promise((ok,no)=>{server.once('error',no);server.listen(port,'127.0.0.1',ok);});
  try{return await action(`http://127.0.0.1:${server.address().port}`);}finally{server.closeAllConnections();await new Promise(ok=>server.close(ok));}
}
