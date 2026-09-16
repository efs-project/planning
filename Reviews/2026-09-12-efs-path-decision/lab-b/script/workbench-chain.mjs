/** Separate disposable chain lifecycle. Vite restarts never reset this chain. */
import {mkdir,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import {startWorkbench} from './workbench-browser.mjs';

const lab=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
process.env.EFS_ETHERS_PATH??=resolve(require.resolve('ethers'),'../..');
process.env.FOUNDRY_OUT??=resolve(lab,'out');
const runtime=resolve(lab,'.workbench');await mkdir(runtime,{recursive:true});
const wb=await startWorkbench({serve:false,rpcPort:Number(process.env.EFS_RPC_PORT??8545),uiPort:Number(process.env.EFS_UI_PORT??60627)});
try{
  wb.config.demoSigners=true;wb.config.localFaucet=true;
  await writeFile(resolve(runtime,'demo-wallets.json'),JSON.stringify({alice:wb.env.wallets.alice.privateKey,bob:wb.env.wallets.bob.privateKey}),{mode:0o600});
  await writeFile(resolve(runtime,'config.next.json'),JSON.stringify(wb.config,null,2));
  await rename(resolve(runtime,'config.next.json'),resolve(runtime,'config.json'));
  console.log(JSON.stringify({rpc:wb.env.rpcUrl,chainId:wb.env.manifest.chainId,anvilPid:wb.env.anvilPid,
    scratch:wb.env.dir,next:'Run npm run dev separately. UI restarts do not reset this chain.'}));
}catch(error){await wb.close();throw error;}
let closing=false;
const stop=async()=>{if(closing)return;closing=true;await wb.close();};
process.once('SIGINT',stop);process.once('SIGTERM',stop);
