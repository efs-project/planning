/** Fresh explicit local carrier demo. Byte-only fixture and chain close together. */
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createEnvironment} from './compact-environment.mjs';
import {startBrowser} from './compact-browser.mjs';
import {startRawCarrier} from './raw-carrier-fixture.mjs';
import {samplePng} from './carrier-fixtures.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';
import {describe,encryptContent} from '../browser/compact-content.mjs';
export async function startCarrierDemo(){
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2'});
  let fixture;
  try{
    const {ethers:e,wallets,manifest}=env,png=samplePng();fixture=await startRawCarrier([png]);
    const sdk=createFilesCompactSdk({ethers:e,manifest,rpc:env.rpc,journal:await env.createJournal('carrier-seed')});
    const run=async(operation,args)=>{
      const p=await sdk.prepare({operation,author:wallets.alice.address,authors:Object.values(manifest.authors),...args});
      const signed=await sdk.authorize(p,d=>wallets.alice.signingKey.sign(d).serialized);
      await sdk.submit(signed,tx=>env.send(operation,tx,'alice'));assert.equal((await sdk.reconcile(p.id)).status,'EFFECTS_VERIFIED');return p;
    };
    const photos=await run('createDirectory',{name:'photos',salt:e.id('demo-photos')});
    await run('createDirectory',{name:'archive',salt:e.id('demo-archive')});
    await run('create',{name:'welcome.txt',salt:e.id('welcome'),content:{bytes:e.toUtf8Bytes('Exact byte files. Choose Open verified bytes; external objects require explicit permission. Upload inline or to this run-only raw carrier fixture.')}});
    await run('create',{name:'binary.bin',salt:e.id('binary'),content:{bytes:Uint8Array.of(0,255,128,65)}});
    const image=await run('create',{name:'red.png',folder:photos.file,salt:e.id('png'),content:{bytes:png,media:2}});
    await run('create',{name:'external.png',folder:photos.file,salt:e.id('external'),content:{descriptor:await describe(png,{carrier:1,media:2})}});
    await run('create',{name:'unavailable.bin',salt:e.id('unavailable'),content:{descriptor:await describe(Uint8Array.of(99),{carrier:1})}});
    const demoKey=new Uint8Array(32).fill(17),sealed=await encryptContent(e.toUtf8Bytes('Authenticated plaintext, not a fake encrypted flag.'),demoKey);
    await run('create',{name:'encrypted.bin',salt:e.id('encrypted'),content:sealed});
    const tag=await run('addTag',{file:image.file,scope:'file',conceptLabel:'photos',conceptNamespace:manifest.folder});
    await run('addTag',{file:photos.file,scope:'directory',concept:tag.concept});
    const browser=await startBrowser(env,{seed:false,directory:true,carrierFixture:fixture});
    console.log('Public disposable sample AES-GCM key for encrypted.bin: '+'11'.repeat(32));
    return {...browser,env};
  }catch(error){await fixture?.close();await env.close();throw error;}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const browser=await startCarrierDemo();let stopping=false;
  const stop=async()=>{if(stopping)return;stopping=true;await browser.close();};process.once('SIGINT',stop);process.once('SIGTERM',stop);
}
