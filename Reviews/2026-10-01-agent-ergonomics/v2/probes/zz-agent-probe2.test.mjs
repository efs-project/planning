import test from 'node:test';
import {writeFile} from 'node:fs/promises';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createFilesCompactSdk} from './compact-files-sdk.mjs';
const report={};
test('never-broadcast recovery', {timeout:300_000}, async t => {
  const env = await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2'});
  t.after(()=>env.close());
  const {ethers:e,manifest,wallets,rpc}=env, authors=[wallets.alice.address];
  const journal=await env.createJournal('j'), sdk=createFilesCompactSdk({ethers:e,manifest,rpc,journal});
  const sign=d=>wallets.alice.signingKey.sign(d).serialized;
  // 1. wallet rejects before broadcasting
  const p1=await sdk.prepare({operation:'create',author:wallets.alice.address,authors,name:'a.txt',salt:e.id('a'),document:'one'});
  const s1=await sdk.authorize(p1,sign);
  const r1=await sdk.submit(s1,()=>{throw Object.assign(new Error('User rejected the request.'),{code:4001});});
  report.rejectedSubmit={status:r1.status,error:r1.error};
  report.rejectedReconcile=(await sdk.reconcile(p1.id)).status;
  // 2. agent retries the same signed plan (user now approves)
  let sent=0; const r1b=await sdk.submit(s1,tx=>{sent++;return env.send('retry',tx,'alice');});
  report.retrySameSigned={status:r1b.status, actuallySent:sent};
  // 3. agent gives up and prepares a fresh plan instead
  const p2=await sdk.prepare({operation:'create',author:wallets.alice.address,authors,name:'a.txt',salt:e.id('a2'),document:'two'});
  report.samePublicationNonce = p1.intent?.nonce===p2.intent?.nonce;
  const s2=await sdk.authorize(p2,sign); await sdk.submit(s2,tx=>env.send('fresh',tx,'alice'));
  report.freshReconcile=(await sdk.reconcile(p2.id)).status;
  // 4. what does the abandoned plan say now?
  const old=await sdk.reconcile(p1.id); report.abandonedAfterFresh={status:old.status,knowledge:old.knowledge,reason:old.reason};
  // 5. and if the stale signed plan is broadcast anyway?
  try{ await env.send('stale',s1.transaction,'alice'); report.staleBroadcast='landed'; }catch(err){ report.staleBroadcast=String(err.message).slice(0,160); }
  await writeFile(process.env.PROBE_OUT, JSON.stringify(report,null,2));
});
