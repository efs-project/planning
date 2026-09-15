/** Starts a static compact Files demo against its owned disposable Anvil.
 * No /api/files, directory cache, authoritative filename fixture, or production wallet.
 * Run with existing ethers/artifacts environment; --measure runs bounded economics. */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createEnvironment} from './compact-environment.mjs';
import {createCompactSdk} from '../browser/compact-sdk.mjs';

const root=fileURLToPath(new URL('../browser/',import.meta.url));
const json=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v,2);
export const economics={ethUsd:2544.385,asOf:'2026-09-14T19:45:15Z',
  source:'https://api.coinbase.com/v2/prices/ETH-USD/spot',
  note:'Local EVM gas multiplied by an observed gas-price snapshot. L2 L1-data/operator costs excluded; not a live transaction quote.',
  networks:[
    {id:'ethereum',label:'Ethereum',gasGwei:0.0953168,extraUsd:0,kind:'execution-only estimate',source:'https://ethereum-rpc.publicnode.com'},
    {id:'optimism',label:'Optimism',gasGwei:0.001000442,extraUsd:0,kind:'execution-only estimate; excludes L1 data/operator fees',source:'https://mainnet.optimism.io'},
    {id:'base',label:'Base',gasGwei:0.006,extraUsd:0,kind:'execution-only estimate; excludes L1 data/operator fees',source:'https://mainnet.base.org'},
    {id:'arbitrum',label:'Arbitrum',gasGwei:0.020146,extraUsd:0,kind:'execution-only estimate; excludes L1 data fees',source:'https://arb1.arbitrum.io/rpc'},
  ]};
export async function connectFixture(env,journalName='seed') {
  const {ethers:e,manifest,rpc,wallets}=env;
  const journal=await env.createJournal(journalName), sdk=createCompactSdk({ethers:e,manifest,rpc,journal});
  const authors=Object.values(manifest.authors);
  const run=async(operation,args={},who='alice')=>{
    const plan=await sdk.prepare({operation,authors,author:wallets[who].address,...args});
    const signed=await sdk.authorize(plan,digest=>wallets[who].signingKey.sign(digest).serialized);
    await sdk.submit(signed,tx=>env.send(operation,tx,who));
    const outcome=await sdk.reconcile(plan.id);assert.equal(outcome.status,'EFFECTS_VERIFIED');
    assert.equal(outcome.receiptAttribution,'RPC_MATCHED_DIRECT_PLAN');
    return plan;
  };
  return {sdk,run,authors};
}
export async function startBrowser(env,{seed=true,directory=false,carrierFixture}={}) {
  assert(!directory||env.manifest.filesProfile==='typed-directory-v1','directory entrypoint requires reviewed typed profile');
  assert(!directory||!seed,'directory runner supplies its own guarded seed journey');
  if(seed){
    const {run}=await connectFixture(env);
    await run('create',{name:'welcome.txt',salt:env.ethers.id('welcome-file'),
      document:'Welcome to compact EFS. This text and its filename were recovered from real contract state. Edit, rename, tag, move, delete and restore it.'});
    const shared=await run('create',{name:'meeting.txt',salt:env.ethers.id('meeting-file'),document:'Alice: meeting at 10:00.'});
    await run('edit',{file:shared.file,document:'Bob: meeting at 11:00.'},'bob');
    await run('addTag',{file:shared.file,scope:'file',concept:env.ethers.id('efs')});
  }
  const config={manifest:env.manifest,rpcUrl:env.rpcUrl,
    mounts:[{id:env.manifest.folder,label:'Files'},...(directory?[]:[{id:env.manifest.folders[1],label:'Archive'}])],economics};
  if(carrierFixture)config.carrierOrigin=carrierFixture.origin;
  const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css'};
  const allowed=new Set(['index.html','app.mjs','files.css','compact-sdk.mjs','files-view.mjs']);
  if(directory)for(const asset of ['directory-entry.mjs','compact-sdk-v2.mjs','compact-paths.mjs','guarded-archive.mjs','compact-content.mjs'])allowed.add(asset);
  const carriers=!!env.manifest.contentProfile;assert(!carriers||directory,'carrier profile requires guarded entrypoint');
  if(carriers)for(const asset of ['carrier-entry.mjs','compact-files-sdk.mjs','compact-content.mjs','compact-carrier-host.mjs'])allowed.add(asset);
  const server=createServer(async(req,res)=>{
    try{
      if(req.method!=='GET' || !/^127\.0\.0\.1:\d+$/.test(req.headers.host??'')){res.writeHead(403).end('Loopback GET only');return;}
      const path=new URL(req.url,'http://127.0.0.1').pathname;
      res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
      res.setHeader('Cross-Origin-Resource-Policy','same-origin');
      if(path==='/config.json'){res.setHeader('Content-Type','application/json');res.end(json(config));return;}
      if(path==='/demo-wallets.json'){res.setHeader('Content-Type','application/json');res.end(json({alice:env.wallets.alice.privateKey,bob:env.wallets.bob.privateKey}));return;}
      if(path==='/vendor/ethers.mjs'){res.setHeader('Content-Type','text/javascript');res.end(await readFile(join(resolve(process.env.EFS_ETHERS_PATH),'dist/ethers.min.js')));return;}
      const name=path==='/'?'index.html':path.slice(1);
      if(!allowed.has(name)){res.writeHead(404).end('Not found');return;}
      res.setHeader('Content-Type',mime[name.slice(name.lastIndexOf('.'))]??'application/octet-stream');
      const content=await readFile(join(root,name));
      res.end(directory&&name==='index.html'?content.toString().replace('src="./app.mjs"',`src="./${carriers?'carrier':'directory'}-entry.mjs"`):content);
    }catch(error){res.writeHead(500).end('Static resource unavailable');}
  });
  await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});
  const url=`http://127.0.0.1:${server.address().port}/`;
  carrierFixture?.allowUploadOrigin(new URL(url).origin);
  const close=async()=>{await new Promise(ok=>{server.closeAllConnections();server.close(ok);});await carrierFixture?.close();await env.close();};
  console.log(json({url,rpc:env.rpcUrl,scratch:env.dir,warning:directory?'DISPOSABLE LOCAL KEYS. GUARDED TYPED DIRECTORY GRAPH; NO GLOBAL TREE GUARANTEE.':'DISPOSABLE LOCAL KEYS. NO REAL FUNDS. Explicit folders, not a nested directory profile.'}));
  return {url,close};
}
async function main(){
  const env=await createEnvironment();
  try{
    if(process.argv.includes('--measure')){
      const {measure}=await import('./compact-measure.mjs');await measure(env);await env.close();
    }else{
      const browser=await startBrowser(env);
      let stopping=false;const stop=async()=>{if(stopping)return;stopping=true;await browser.close();};
      process.once('SIGINT',stop);process.once('SIGTERM',stop);
    }
  }catch(error){await env.close();throw error;}
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error);process.exitCode=1;});
