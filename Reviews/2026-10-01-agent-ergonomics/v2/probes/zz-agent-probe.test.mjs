// Disposable agent-ergonomics probe (scratch copy only, not the shared worktree).
// Question: what does an agent *see* in common situations, and what does it cost?
import test from 'node:test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createFilesCompactSdk} from './compact-files-sdk.mjs';

const out = process.env.PROBE_OUT ?? 'probe.json';
const plain = v => JSON.parse(JSON.stringify(v,(_,x)=>typeof x==='bigint'?String(x):x));
const report = {};

test('agent probe', {timeout:600_000}, async t => {
  const env = await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',
    filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2'});
  t.after(()=>env.close());
  const {ethers:e,manifest,wallets,rpc} = env;
  // Count every RPC an SDK instance makes.
  const counted = () => { const c={n:0,methods:{}}; const f=async(m,p)=>{c.n++;c.methods[m]=(c.methods[m]??0)+1;return rpc(m,p);}; return [f,c]; };
  const mk = async (label) => { const [r,c]=counted(); const journal=await env.createJournal(label);
    return {sdk:createFilesCompactSdk({ethers:e,manifest,rpc:r,journal}),c,journal}; };
  const sign = who => d => wallets[who].signingKey.sign(d).serialized;
  const authors = [wallets.alice.address,wallets.bob.address];

  // --- 1. Discovery from nothing but the manifest -------------------------------
  const A = await mk('agent-a');
  report.capabilities = plain(A.sdk.capabilities());
  report.manifestTypeNames = Object.keys(manifest.types);
  const ctx0 = await A.sdk.pin(); report.pinCost = {...A.c, methods:{...A.c.methods}};
  try { report.typeDescriptorSample = plain(await A.sdk.readTypeDescriptor({typeId:manifest.types.content,context:ctx0})); }
  catch (err) { report.typeDescriptorSample = {error:String(err.message)}; }
  const root0 = await A.sdk.listFolder({authors,context:ctx0});
  report.emptyRootShape = {keys:Object.keys(root0), knowledge:root0.knowledge, coverage:root0.coverage, reason:root0.reason};

  // --- 2. Alice creates a file through the four-phase lifecycle ------------------
  A.c.n=0;
  const run = async (S, who, operation, args) => {
    const plan = await S.sdk.prepare({operation,author:wallets[who].address,authors,...args});
    const signed = await S.sdk.authorize(plan,sign(who));
    const sub = await S.sdk.submit(signed,tx=>env.send(operation,tx,who));
    const rec = await S.sdk.reconcile(plan.id);
    return {plan,sub,rec};
  };
  const created = await run(A,'alice','create',{name:'notes.txt',salt:e.id('probe/notes'),document:'v1 from alice'});
  report.createLifecycle = {submitStatus:created.sub.status, reconcileStatus:created.rec.status,
    knowledge:created.rec.knowledge, rpcCalls:A.c.n, planKeys:Object.keys(created.plan)};
  const file = created.plan.file;

  // --- 3. Two agents race to edit the same file from the same basis --------------
  const B = await mk('agent-b');
  const ctx = await A.sdk.pin(), ctxB = await B.sdk.pin();
  const pa = await A.sdk.prepare({operation:'edit',author:wallets.alice.address,authors,file,document:'edit by agent A',context:ctx});
  const pb = await B.sdk.prepare({operation:'edit',author:wallets.alice.address,authors,file,document:'edit by agent B',context:ctxB});
  const sa = await A.sdk.authorize(pa,sign('alice')), sb = await B.sdk.authorize(pb,sign('alice'));
  await A.sdk.submit(sa,tx=>env.send('race-a',tx,'alice'));
  report.raceWinner = (await A.sdk.reconcile(pa.id)).status;
  try { const r = await B.sdk.submit(sb,tx=>env.send('race-b',tx,'alice')); report.raceLoser = {returned:plain(r).status, error:plain(r).error}; }
  catch (err) { report.raceLoser = {thrown:String(err.message), ownKeys:Object.keys(err), hasCause:!!err.cause}; }

  // --- 3b. Same race but bypass SDK preflight: what does the chain say? ----------
  try { await rpc('eth_call',[sb.transaction,'latest']); report.rawRevert = 'no revert'; }
  catch (err) {
    const data = err?.rpcError?.data ?? err?.data;
    let decoded = null;
    try { const p = new e.Interface(manifest.contracts.ledger.abi).parseError(data); decoded = p && {name:p.name,args:plain([...p.args])}; } catch {}
    report.rawRevert = {message:String(err.message).slice(0,200), data, decodedWithLedgerAbi:decoded};
  }

  // --- 4. Invalid name: where is it caught, with what message? -------------------
  for (const name of ['Notes.TXT','../escape','a'.repeat(256),'café.txt']) {
    try { await A.sdk.prepare({operation:'create',author:wallets.alice.address,authors,name,salt:e.id('probe/'+name),document:'x'}); (report.badNames ??= {})[name.slice(0,20)]='accepted by prepare'; }
    catch (err) { (report.badNames ??= {})[name.slice(0,20)] = String(err.message); }
  }

  // --- 5. Read a file the simple way: cost and result shape ----------------------
  const R = await mk('reader');
  const rc = await R.sdk.pin(); const afterPin = R.c.n;
  const place = await R.sdk.readPlacement({folder:manifest.folder,name:'notes.txt',authors,context:rc});
  const afterPlacement = R.c.n;
  const content = await R.sdk.readContent({file,authors,context:rc});
  report.readPath = {pinCalls:afterPin, placementCalls:afterPlacement-afterPin, contentCalls:R.c.n-afterPlacement,
    placementKnowledge:place.knowledge, placementKeys:Object.keys(place), contentState:content.state,
    text: content.bytes ? new TextDecoder().decode(content.bytes) : null, contentKeys:Object.keys(content)};
  // Read a name that does not exist
  const missing = await R.sdk.readPlacement({folder:manifest.folder,name:'nope.txt',authors,context:rc});
  report.missingName = {knowledge:missing.knowledge, coverage:missing.coverage, reason:missing.reason};

  // --- 6. Restart: does a context / continuation survive into a new instance? ----
  const R2 = await mk('reader-2');
  try { await R2.sdk.readFile({file,authors,context:rc}); report.contextPortable = true; }
  catch (err) { report.contextPortable = String(err.message); }
  try { const ser = JSON.parse(JSON.stringify(plain(rc))); await R.sdk.readFile({file,authors,context:ser}); report.serializedContextAccepted = true; }
  catch (err) { report.serializedContextAccepted = String(err.message); }

  // --- 7. History: can the agent see who changed what? --------------------------
  try { const h = await R.sdk.readRevisionHistory({file,authors,context:await R.sdk.pin()});
    report.history = {knowledge:h.knowledge, coverage:h.coverage, n:h.value?.length, sample:plain(h.value?.[0])}; }
  catch (err) { report.history = String(err.message); }

  await writeFile(out, JSON.stringify(report,null,2));
});
