/** Fresh private loopback guarded graph demo. Never reuses the owner demo chain. */
import assert from 'node:assert/strict';
import {createEnvironment} from './compact-environment.mjs';
import {startBrowser} from './compact-browser.mjs';
import {createGuardedCompactSdk} from '../browser/compact-sdk-v2.mjs';
const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',filesProfile:'typed-directory-v1'});
try{
  const {ethers:e,wallets,manifest}=env;
  const sdk=createGuardedCompactSdk({ethers:e,manifest,rpc:env.rpc,journal:await env.createJournal('directory-seed')});
  const run=async(operation,args)=>{
    const p=await sdk.prepare({operation,author:wallets.alice.address,authors:Object.values(manifest.authors),...args});
    const signed=await sdk.authorize(p,d=>wallets.alice.signingKey.sign(d).serialized);
    await sdk.submit(signed,tx=>env.send(operation,tx,'alice'));assert.equal((await sdk.reconcile(p.id)).status,'EFFECTS_VERIFIED');return p;
  };
  const photos=await run('createDirectory',{name:'photos',salt:e.id('demo-photos')});
  const nested=await run('createDirectory',{name:'nested',folder:photos.file,salt:e.id('demo-nested')});
  await run('createDirectory',{name:'archive',salt:e.id('demo-archive')});
  await run('create',{name:'welcome.txt',salt:e.id('demo-welcome'),document:'A real typed Directory graph. Open photos, then nested. Names, membership, kinds and bytes come from chain state.'});
  await run('create',{name:'image.bin',folder:nested.file,salt:e.id('demo-binary'),document:new Uint8Array([0,255,128,65])});
  const browser=await startBrowser(env,{seed:false,directory:true});
  let stopping=false;const stop=async()=>{if(stopping)return;stopping=true;await browser.close();};
  process.once('SIGINT',stop);process.once('SIGTERM',stop);
}catch(error){await env.close();throw error;}
