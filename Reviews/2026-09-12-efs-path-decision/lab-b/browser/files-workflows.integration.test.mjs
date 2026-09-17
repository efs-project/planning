import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createFilesCompactSdk} from './compact-files-sdk.mjs';
import {describe,encryptContent} from './compact-content.mjs';
import {startWorkbench} from '../script/workbench-browser.mjs';

test('Files links, independent copies and cold successor history preserve identity and collision guards',{timeout:240000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',evidenceMode:'append'});
  t.after(()=>env.close());
  const {ethers:e}=env,authors=[env.wallets.bob.address,env.wallets.alice.address];
  const sdk=createFilesCompactSdk({ethers:e,manifest:env.manifest,rpc:env.rpc,journal:await env.createJournal('workflows')});
  const run=async(operation,args={},who='bob')=>{
    const plan=await sdk.prepare({operation,author:env.wallets[who].address,authors,...args});
    await sdk.submit(await sdk.authorize(plan,d=>env.wallets[who].signingKey.sign(d).serialized),tx=>env.send('workflows/'+operation,tx,who));
    assert.equal((await sdk.reconcile(plan.id)).status,'EFFECTS_VERIFIED');return plan;
  };
  const file=await run('create',{name:'original.txt',salt:e.id('workflow/original'),document:'one'});
  const tagged=await run('addTag',{file:file.file,scope:'file',conceptLabel:'original-only',conceptNamespace:env.manifest.folder});
  const link=await run('linkPlacement',{file:file.file,name:'linked.txt'});
  assert.equal(link.file,file.file);assert.equal(link.actions.some(a=>a.typeId===env.manifest.types.root),false);
  await assert.rejects(sdk.prepare({operation:'linkPlacement',author:authors[0],authors,file:file.file,name:'linked.txt'}),/DESTINATION_OCCUPIED/);
  const copy=await run('copyFile',{file:file.file,name:'copy.txt',salt:e.id('workflow/copy')});
  assert.notEqual(copy.file,file.file);
  assert.equal((await sdk.readTag({subject:copy.file,target:copy.file,concept:tagged.concept,authors,context:await sdk.pin()})).value.assessment,'NOT_PRESENT');
  const ignoringOverride=await run('copyFile',{file:file.file,name:'exact.txt',salt:e.id('workflow/exact'),content:{bytes:e.toUtf8Bytes('must not override selected bytes')}});
  assert.equal((await sdk.readFile({file:ignoringOverride.file,authors,context:await sdk.pin()})).value.revision.document,e.hexlify(e.toUtf8Bytes('one')));
  await run('edit',{file:file.file,document:'two'});
  const cold=createFilesCompactSdk({ethers:e,manifest:env.manifest,rpc:env.rpc});
  const context=await cold.pin();
  let history=await cold.readRevisionHistory({file:file.file,authors,context,budget:1});
  assert.equal(history.coverage,'PARTIAL');assert.equal(history.value.length,1);
  const fresh=await cold.pin();
  for(const change of [{policy:'no-tiebreak'},{authors:[...authors].reverse()},{context:fresh}]){
    await assert.rejects(cold.readRevisionHistory({file:file.file,authors,context,budget:1,continuation:history.continuation,...change}),/CONTINUATION/);
  }
  history=await cold.readRevisionHistory({file:file.file,authors,context,budget:1,continuation:history.continuation});
  assert.equal(history.coverage,'COMPLETE');assert.deepEqual(history.value.map(r=>e.toUtf8String(r.document)),['two','one']);
  const restored=await run('restoreContents',{file:file.file,record:file.newRevision});
  assert.equal((await cold.readFile({file:copy.file,authors,context:await cold.pin()})).value.revision.document,e.hexlify(e.toUtf8Bytes('one')));
  const restoredHistory=await cold.readRevisionHistory({file:file.file,authors,context:await cold.pin()});
  assert.equal(restoredHistory.value.length,3);assert.equal(restoredHistory.value[0].recordId,restored.newRevision);
  await run('linkPlacement',{file:copy.file,name:'linked.txt',replace:true});
  assert.equal((await cold.readPlacement({name:'linked.txt',authors,context:await cold.pin()})).value.target,copy.file);
  const directory=await run('createDirectory',{name:'tree',salt:e.id('workflow/tree')});
  await assert.rejects(sdk.prepare({operation:'linkPlacement',author:authors[0],authors,file:directory.file,folder:directory.file,name:'self'}),/DIRECTORY_SELF_LINK/);
  const lower=await run('create',{folder:directory.file,name:'child.txt',salt:e.id('workflow/lower'),document:'lower'},'alice');
  await run('linkPlacement',{folder:directory.file,name:'child.txt',file:file.file,replace:true});
  await run('linkPlacement',{name:'outside-alias',file:directory.file});
  await run('linkPlacement',{folder:directory.file,name:'hidden',file:file.file});
  await run('remove',{folder:directory.file,name:'hidden',file:file.file});
  const branch=await run('createDirectory',{folder:directory.file,name:'branch',salt:e.id('workflow/branch')});
  await run('linkPlacement',{folder:branch.file,name:'back',file:directory.file});
  const {previewOwnPlacementRelease,executeOwnPlacementRelease}=await import('./files-workflows.mjs');
  const preview=await previewOwnPlacementRelease({sdk,author:authors[0],folder:env.manifest.folder,name:'tree'});
  assert.equal(preview.coverage,'COMPLETE');assert.equal(preview.rows.at(-1).name,'tree');
  const result=await executeOwnPlacementRelease({sdk,preview,signDigest:d=>env.wallets.bob.signingKey.sign(d).serialized,sendTransaction:tx=>env.send('workflows/recursive-release',tx,'bob')});
  assert.equal(result.status,'COMPLETE');assert.equal(result.completed.length,5);
  assert.equal(new Set(result.completed.map(c=>c.row.position)).size,5,'cycle traversal releases each coordinate once');
  const after=await cold.pin();
  assert.equal((await cold.readPlacement({folder:directory.file,name:'child.txt',authors,context:after})).value.target,lower.file);
  assert.equal((await cold.readPlacement({name:'outside-alias',authors,context:after})).value.target,directory.file);
  assert.equal((await cold.readFile({file:file.file,authors,context:after})).knowledge,'PRESENT');
  assert.equal((await cold.readTag({subject:file.file,target:file.file,concept:tagged.concept,authors,context:after})).value.assessment,'PRESENT','recursive release retains File tags');
  for(const [label,content] of [['cipher',await encryptContent(e.toUtf8Bytes('private'),new Uint8Array(32).fill(7))],['external',{descriptor:await describe(e.toUtf8Bytes('external'),{carrier:1})}]]){
    const original=await run('create',{name:label,salt:e.id('workflow/'+label),content});
    const duplicate=await run('copyFile',{name:label+'-copy',file:original.file,salt:e.id('workflow/'+label+'/copy')});
    const context=await cold.pin(),a=await cold.readFile({file:original.file,authors,context}),b=await cold.readFile({file:duplicate.file,authors,context});
    assert.equal(a.value.revision.descriptorRecord,b.value.revision.descriptorRecord);
    assert.equal(b.value.revision.parent,e.ZeroHash);
    assert.equal(duplicate.actions.some(a=>a.typeId===env.manifest.types.content||a.typeId===env.manifest.types.bytes),false);
  }
  await run('linkPlacement',{file:directory.file,name:'tree-again'});
  await run('linkPlacement',{file:file.file,folder:directory.file,name:'a'});
  await run('linkPlacement',{file:file.file,folder:directory.file,name:'b'});
  const bounded=await previewOwnPlacementRelease({sdk,author:authors[0],folder:env.manifest.folder,name:'tree-again',maxPlacements:1});
  assert.equal(bounded.coverage,'PARTIAL');
  await assert.rejects(executeOwnPlacementRelease({sdk,preview:bounded}),/RELEASE_PREVIEW_REQUIRED/);
  const interrupted=await previewOwnPlacementRelease({sdk,author:authors[0],folder:env.manifest.folder,name:'tree-again'});
  const stopped=await executeOwnPlacementRelease({sdk,preview:interrupted,signDigest:d=>env.wallets.bob.signingKey.sign(d).serialized,sendTransaction:tx=>env.send('workflows/partial-release',tx,'bob'),onProgress:async({completed})=>{
    if(completed.length===1)await run('linkPlacement',{folder:directory.file,name:'new-child',file:copy.file});
  }});
  assert.equal(stopped.status,'PARTIAL');assert.equal(stopped.reason,'RELEASE_DIRECTORY_CHANGED');assert.equal(stopped.completed.length,1);assert.equal(stopped.pending.at(-1).name,'tree-again');
  assert.equal((await cold.readPlacement({name:'tree-again',authors,context:await cold.pin()})).knowledge,'PRESENT');
  await env.writeReport('files-workflows',{transactions:env.transactions,result});
  console.log('WORKFLOW_EVIDENCE',env.dir,JSON.stringify(env.transactions.filter(r=>r.label.startsWith('workflows/')).map(({label,gasUsed})=>({label,gasUsed}))));
});

test('matched workbench copies exact external locators while live providers remain link-only',{timeout:240000},async t=>{
  const workbench=await startWorkbench({serve:false,uiPort:60628});t.after(()=>workbench.close());
  const {sdk,env,seed,run}=workbench,{ethers:e}=env,authors=Object.values(env.manifest.authors);
  for(const [i,source] of seed.externalSamples.entries()){
    const copy=await run('copyFile',{file:source.file,name:'external-copy-'+i,salt:e.id('workflow/external-copy/'+i)});
    const context=await sdk.pin(),original=await sdk.readFile({file:source.file,authors,context}),duplicate=await sdk.readFile({file:copy.file,authors,context});
    assert.equal(duplicate.value.revision.descriptorRecord,original.value.revision.descriptorRecord);
    assert.equal(duplicate.value.revision.content.locator,original.value.revision.content.locator);
  }
  const context=await sdk.pin(),live=await sdk.readPlacement({folder:seed.docs.file,name:'live-quote',authors,context});
  await assert.rejects(sdk.prepare({operation:'copyFile',author:authors[0],authors,file:live.value.target,name:'live-copy',salt:e.id('workflow/live-copy')}),/LIVE_COPY_REQUIRES_EXPLICIT_SNAPSHOT/);
  const link=await run('linkPlacement',{file:live.value.target,name:'live-link'});assert.equal(link.file,live.value.target);
  await env.writeReport('files-workbench-workflows',{transactions:env.transactions.filter(r=>['workbench/copyFile','workbench/linkPlacement'].includes(r.label))});
});
