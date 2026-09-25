import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createFilesCompactSdk} from './compact-files-sdk.mjs';
import {describe,encryptContent} from './compact-content.mjs';

// A headless consumer of public qualified reads, not a native mount or a copy
// of the joined-page reader's selection algorithm. Names are never cached as
// negative results until traversal from the origin has completed.
function drive(sdk,{root,authors,context}) {
  async function list(folder=root,budget=32) {
    let continuation,answer;
    do {
      answer=await sdk.listFolder({folder,authors,context,budget,...(continuation?{continuation}:{})});
      if(answer.coverage==='UNKNOWN')return {status:'UNKNOWN',reason:answer.reason,entries:answer.value};
      continuation=answer.continuation;
    } while(continuation);
    if(answer.coverage!=='COMPLETE'||answer.nameCoverage!=='COMPLETE'||answer.kindCoverage!=='COMPLETE')
      return {status:'UNKNOWN',reason:'INCOMPLETE_METADATA',entries:answer.value};
    return {status:'COMPLETE',entries:answer.value.map(row=>({name:row.name.value,id:row.file,kind:row.kind,
      position:row.position,author:row.selection.author}))};
  }
  async function lookup(folder,name) {
    const point=await sdk.readPlacement({folder,name,authors,context});
    if(point.knowledge==='ABSENT'||point.knowledge==='MASKED')return {status:'ABSENT_PROVEN',reason:point.knowledge};
    if(point.knowledge!=='PRESENT'||point.value.name?.knowledge!=='PRESENT')
      return {status:'UNKNOWN',reason:point.reason??point.value.name?.reason??point.knowledge};
    return {status:'PRESENT',id:point.value.target,kind:point.value.kind,name:point.value.name.value,
      position:point.value.position,author:point.value.selection.author};
  }
  async function open(folder,name,{offset=0,length=Number.MAX_SAFE_INTEGER}={}) {
    const entry=await lookup(folder,name);
    if(entry.status!=='PRESENT')return entry;
    if(entry.kind!=='file')return {...entry,status:'NOT_A_FILE'};
    const content=await sdk.readContent({file:entry.id,authors,context});
    if(content.state!=='AVAILABLE_VERIFIED')return {...entry,status:'BYTES_UNAVAILABLE',reason:content.reason??content.state,
      carrierState:content.state,revision:content.recordId};
    return {...entry,status:'OPEN_VERIFIED',revision:content.recordId,
      bytes:content.bytes.slice(offset,offset+length)};
  }
  return {list,lookup,open};
}

test('headless drive projection keeps qualified names, IDs, bytes and uncertainty distinct',{timeout:240000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',
    filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2'});
  t.after(()=>env.close());
  const {ethers:e,manifest,wallets,rpc}=env,authors=[wallets.alice.address,wallets.bob.address];
  const journal=await env.createJournal('drive-editor');
  const writer=createFilesCompactSdk({ethers:e,manifest,rpc,journal});
  const run=async(operation,args,who='alice')=>{
    const p=await writer.prepare({operation,author:wallets[who].address,authors:who==='bob'?[wallets.bob.address]:authors,...args});
    await writer.submit(await writer.authorize(p,d=>wallets[who].signingKey.sign(d).serialized),tx=>env.send(`drive/${operation}`,tx,who));
    assert.equal((await writer.reconcile(p.id)).status,'EFFECTS_VERIFIED');return p;
  };
  const alice=await run('create',{name:'shared.bin',salt:e.id('drive/alice'),content:{bytes:Uint8Array.of(0,255,128,65)}});
  const bob=await run('create',{name:'shared.bin',salt:e.id('drive/bob'),document:'lower'},'bob');
  const archive=await run('createDirectory',{name:'archive',salt:e.id('drive/archive')});
  const docs=await run('createDirectory',{name:'docs',salt:e.id('drive/docs')});
  const child=await run('create',{folder:docs.file,name:'note.txt',salt:e.id('drive/note'),document:'nested bytes'});
  await run('move',{file:docs.file,fromFolder:manifest.folder,fromName:'docs',toFolder:archive.file,name:'docs'});
  await run('linkPlacement',{file:docs.file,name:'alias'});
  const lower=await run('create',{name:'hidden.txt',salt:e.id('drive/hidden'),document:'lower visible'},'bob');
  await run('remove',{name:'hidden.txt',file:lower.file});
  const external=await run('create',{name:'external.bin',salt:e.id('drive/external'),
    content:{descriptor:await describe(e.toUtf8Bytes('elsewhere'),{carrier:1})}});
  const sealed=await run('create',{name:'sealed.bin',salt:e.id('drive/sealed'),
    content:await encryptContent(e.toUtf8Bytes('private bytes'),new Uint8Array(32).fill(7))});

  const cold=createFilesCompactSdk({ethers:e,manifest,rpc});
  const context=await cold.pin(),view=drive(cold,{root:manifest.folder,authors,context});
  const partial=await cold.listFolder({folder:manifest.folder,authors,context,budget:1});
  assert.equal(partial.coverage,'PARTIAL');
  assert.notEqual(partial.knowledge,'ABSENT','an incomplete enumeration cannot prove a missing name');
  assert.equal((await view.lookup(manifest.folder,'docs')).status,'ABSENT_PROVEN');
  assert.equal((await view.lookup(manifest.folder,'hidden.txt')).reason,'MASKED');
  assert.equal((await view.lookup(manifest.folder,'never.txt')).status,'ABSENT_PROVEN');
  const root=await view.list(manifest.folder,1);
  assert.equal(root.status,'COMPLETE');
  assert.deepEqual(root.entries.map(x=>x.name).sort(),['alias','archive','external.bin','sealed.bin','shared.bin']);
  const shared=root.entries.find(x=>x.name==='shared.bin');
  assert.equal(shared.id,alice.file,'ordered Lens picks Alice over Bob without merging their IDs');
  assert.notEqual(shared.id,bob.file);
  const alias=await view.lookup(manifest.folder,'alias');
  assert.equal(alias.id,docs.file);
  const moved=await view.lookup(archive.file,'docs');
  assert.equal(moved.id,alias.id,'alias and moved placement share the Directory ID');
  assert.equal((await view.lookup(docs.file,'note.txt')).id,child.file);
  const exact=await view.open(manifest.folder,'shared.bin');
  assert.equal(exact.status,'OPEN_VERIFIED');assert.deepEqual(exact.bytes,Uint8Array.of(0,255,128,65));
  assert.deepEqual((await view.open(manifest.folder,'shared.bin',{offset:1,length:2})).bytes,Uint8Array.of(255,128));
  const copiedPath=join(env.dir,'copied-shared.bin');await writeFile(copiedPath,exact.bytes);
  assert.deepEqual(new Uint8Array(await readFile(copiedPath)),Uint8Array.of(0,255,128,65));
  assert.equal((await view.open(docs.file,'note.txt')).status,'OPEN_VERIFIED');
  assert.equal(e.toUtf8String((await view.open(docs.file,'note.txt')).bytes),'nested bytes');
  assert.equal((await view.open(manifest.folder,'external.bin')).carrierState,'UNAVAILABLE');
  assert.equal((await view.open(manifest.folder,'sealed.bin')).carrierState,'OPAQUE');
  assert.equal((await view.open(manifest.folder,'never.txt')).status,'ABSENT_PROVEN');
  assert.equal((await cold.readFile({file:external.file,authors,context})).knowledge,'PRESENT',
    'external byte unavailability does not erase the File');
  assert.equal((await cold.readFile({file:sealed.file,authors,context})).knowledge,'PRESENT');

  let joined=await cold.listFolderPage({folder:manifest.folder,authors,context,budget:1}),joinedRows=[...joined.pageRows];
  while(joined.continuation){joined=await cold.listFolderPage({folder:manifest.folder,authors,context,budget:1,continuation:joined.continuation});joinedRows.push(...joined.pageRows);}
  assert.equal(joined.queryCoverage,'COMPLETE');assert.equal(joined.completeFromOwnedOrigin,true);
  assert.deepEqual(joinedRows.map(row=>({name:row.name.value,id:row.file,kind:row.kind,position:row.position,author:row.selection.author}))
    .sort((a,b)=>a.name.localeCompare(b.name)),root.entries.sort((a,b)=>a.name.localeCompare(b.name)));

  // A failed joined read is not a negative lookup or an empty directory.
  const selector=new e.Interface(manifest.contracts.joined.abi).getFunction('readPage').selector;
  const unavailable=createFilesCompactSdk({ethers:e,manifest,rpc:(method,params)=>{
    if(method==='eth_call'&&params[0].data.startsWith(selector))throw Error('joined page unavailable');return rpc(method,params);
  }});
  const unavailablePage=await unavailable.listFolderPage({folder:manifest.folder,authors,context:await unavailable.pin(),budget:1});
  assert.equal(unavailablePage.queryCoverage,'UNKNOWN');assert.equal(unavailablePage.queryAbsent,false);
  let failPlacement=false;
  const edgeSdk=createFilesCompactSdk({ethers:e,manifest,rpc:(method,params)=>{
    if(failPlacement&&method==='eth_call'&&params[0].to.toLowerCase()===manifest.contracts.lens.address.toLowerCase())
      throw Error('Lens unavailable');
    return rpc(method,params);
  }});
  const edgeContext=await edgeSdk.pin();failPlacement=true;
  const edgeView=drive(edgeSdk,{root:manifest.folder,authors,context:edgeContext});
  assert.equal((await edgeView.lookup(manifest.folder,'never.txt')).status,'UNKNOWN',
    'unavailable selection cannot become a not-found result');

  // Editor bytes are durable in this local fixture before there is any EFS
  // publication. A crash before submit leaves the old selected revision live.
  const draftPath=join(env.dir,'editor-draft.bin'),draft=Uint8Array.of(9,0,200,10);
  await writeFile(draftPath,draft);
  const before=await writer.readFile({file:alice.file,authors,context:await writer.pin()});
  const edit=await writer.prepare({operation:'edit',author:wallets.alice.address,authors,file:alice.file,
    content:{bytes:new Uint8Array(await readFile(draftPath))}});
  assert.equal((await writer.readFile({file:alice.file,authors,context:await writer.pin()})).value.revision.recordId,before.value.revision.recordId);
  const signed=await writer.authorize(edit,d=>wallets.alice.signingKey.sign(d).serialized);
  await writer.submit(signed,tx=>env.send('drive/editor-save',tx));
  const recovered=createFilesCompactSdk({ethers:e,manifest,rpc,journal});
  assert.equal((await recovered.reconcile(edit.id)).status,'EFFECTS_VERIFIED');
  assert.equal((await recovered.readFile({file:alice.file,authors,context:await recovered.pin()})).value.revision.recordId,edit.newRevision);
  assert.deepEqual((await recovered.readContent({file:alice.file,authors,context:await recovered.pin()})).bytes,draft);
  await writer.submit(signed,tx=>env.send('drive/editor-duplicate',tx));
  assert.equal(env.transactions.filter(x=>x.label==='drive/editor-save').length,1);
  assert.equal(env.transactions.filter(x=>x.label==='drive/editor-duplicate').length,0);
});
