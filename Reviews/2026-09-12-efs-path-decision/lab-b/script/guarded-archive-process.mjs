/** Clean process transport boundary. Export accepts owned loopback only; verify
 * accepts only bundled bytes and disables fetch. No journal/filename/body maps. */
import {loadEthers} from './compact-environment.mjs';
import {createGuardedArchiveReader,verifyGuardedClaim} from '../browser/guarded-archive.mjs';
let text='';for await(const chunk of process.stdin){text+=chunk;if(text.length>32*1024*1024)throw Error('INPUT_BOUNDS');}
const input=JSON.parse(text),e=await loadEthers();
if(process.argv[2]==='verify'){
  globalThis.fetch=()=>{throw Error('OFFLINE_NETWORK_FORBIDDEN');};
  if(!Array.isArray(input))throw Error('BUNDLES_REQUIRED');
  console.log(JSON.stringify(await Promise.all(input.map(x=>verifyGuardedClaim(e,x)))));
}else if(process.argv[2]==='export'){
  const url=new URL(input.rpcUrl);if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||!url.port)throw Error('OWNED_LOOPBACK_REQUIRED');
  let id=0;const rpc=async(method,params=[])=>{
    const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}),signal:AbortSignal.timeout(20000)});
    const result=await response.json();if(result.error)throw Error(result.error.message);return result.result;
  };
  const reader=createGuardedArchiveReader({ethers:e,rpc,manifest:input.manifest}),bundles=[];
  for(const publication of input.publications)bundles.push(await reader.exportPublication({publication}));
  console.log(JSON.stringify(bundles));
}else throw Error('MODE_REQUIRED');
