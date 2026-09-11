import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {ROOT} from './world.mjs';
// Closed static route table: no proxy, database, signing endpoint or filesystem traversal.
const routes={
  '/':['web/index.html','text/html'],
  '/app.mjs':['web/app.mjs','text/javascript'],
  '/style.css':['web/style.css','text/css'],
  '/client.mjs':['sdk/client.mjs','text/javascript'],
  '/ethers.js':['../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.min.js','text/javascript'],
  '/cost-ledger.mjs':['../2026-09-09-files-browser-mvp/web/cost-ledger.mjs','text/javascript'],
};
export async function withServer(config,action,{port=0}={}) {
  const server=createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
    if(req.headers.host!==`127.0.0.1:${server.address().port}`){res.writeHead(403);res.end('Loopback host required');return;}
    if(req.method!=='GET'){res.writeHead(405);res.end('Static GET only');return;}
    if(req.url==='/config.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(config));return;}
    const route=routes[req.url];if(!route){res.writeHead(404);res.end('Not found');return;}
    try{res.setHeader('Content-Type',route[1]);res.end(await readFile(ROOT+route[0]));}catch{res.writeHead(500);res.end('Static asset unavailable');}
  });
  await new Promise((ok,no)=>{server.once('error',no);server.listen(port,'127.0.0.1',ok);});
  try{return await action(`http://127.0.0.1:${server.address().port}`);}finally{server.closeAllConnections();await new Promise(ok=>server.close(ok));}
}
