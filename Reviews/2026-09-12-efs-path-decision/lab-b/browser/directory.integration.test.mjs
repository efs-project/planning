import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createGuardedCompactSdk} from './compact-sdk-v2.mjs';
import {resolvePath} from './compact-paths.mjs';
import {startBrowser} from '../script/compact-browser.mjs';

test('separate guarded browser entrypoint serves its profile modules and root-only configuration',{timeout:120000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',filesProfile:'typed-directory-v1'});t.after(()=>env.close());
  const browser=await startBrowser(env,{seed:false,directory:true});t.after(()=>browser.close());
  const html=await (await fetch(browser.url)).text();assert.match(html,/src="\.\/directory-entry\.mjs"/);
  const config=await (await fetch(new URL('/config.json',browser.url))).json();assert.equal(config.mounts.length,1);
  for(const name of ['directory-entry.mjs','compact-sdk-v2.mjs','compact-paths.mjs'])assert.equal((await fetch(new URL(name,browser.url))).status,200);
  assert.equal((await fetch(new URL('directory.integration.test.mjs',browser.url))).status,404);
});

test('typed Directory fixture bootstraps before admission one and cold opens nested placements', {timeout:120000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',filesProfile:'typed-directory-v1'});t.after(()=>env.close());
  assert.equal(env.manifest.filesProfile,'typed-directory-v1','fresh fixture must select typed profile');
  const {ethers:e,wallets,manifest,rpc}=env,authors=[wallets.alice.address,wallets.bob.address];
  const sdk=createGuardedCompactSdk({ethers:e,manifest,rpc,journal:await env.createJournal('directory')});
  assert.equal((await sdk.readDirectory({directory:manifest.folder,context:await sdk.pin()})).knowledge,'PRESENT');
  const run=async(operation,args,who='alice')=>{
    const p=await sdk.prepare({operation,author:wallets[who].address,authors,...args});
    const s=await sdk.authorize(p,d=>wallets[who].signingKey.sign(d).serialized);
    await sdk.submit(s,tx=>env.send(operation,tx,who));
    assert.equal((await sdk.reconcile(p.id)).status,'EFFECTS_VERIFIED');return p;
  };
  const dir=await run('createDirectory',{name:'photos',folder:manifest.folder,salt:e.id('photos')});
  const nested=await run('createDirectory',{name:'nested',folder:dir.file,salt:e.id('nested')});
  const file=await run('create',{name:'image.bin',folder:nested.file,salt:e.id('image'),document:new Uint8Array([0,255,128,65])});
  const cold=createGuardedCompactSdk({ethers:e,manifest,rpc,journal:await env.createJournal('cold')});
  const context=await cold.pin();const listing=await cold.listFolder({folder:dir.file,authors,context});
  assert.equal(listing.value[0].kind,'directory');assert.equal(listing.value[0].file,nested.file);
  assert.equal((await cold.readFile({file:file.file,authors,context})).value.revision.document,'0x00ff8041');
  const path=async(segments,options={})=>resolvePath({sdk:cold,root:manifest.folder,segments,authors,context:await cold.pin(),...options});
  assert.equal((await path(['photos','nested','image.bin'])).target,file.file);
  await run('rename',{file:dir.file,fromName:'photos',name:'pictures',folder:manifest.folder});
  assert.equal((await path(['photos'])).status,'MASKED');
  await assert.rejects(()=>run('createDirectory',{name:'photos',salt:e.id('reuse-name')}),/DESTINATION_OCCUPIED/);
  const reused=await run('createDirectory',{name:'photos',salt:e.id('reuse-name'),replace:true});
  assert.notEqual(reused.file,dir.file);assert.equal((await path(['photos'])).target,reused.file);
  const archive=await run('createDirectory',{name:'archive',salt:e.id('archive')});
  await run('move',{file:dir.file,fromFolder:manifest.folder,fromName:'pictures',toFolder:archive.file,name:'pictures'});
  assert.equal((await path(['archive','pictures','nested','image.bin'])).target,file.file);
  await run('remove',{file:dir.file,folder:archive.file,name:'pictures'});
  assert.equal((await path(['archive','pictures'])).status,'MASKED');
  await run('restorePlacement',{file:dir.file,folder:archive.file,name:'pictures',replace:true});
  assert.equal((await path(['archive','pictures','nested','image.bin'])).target,file.file);
  await run('restorePlacement',{file:dir.file,folder:manifest.folder,name:'alias'});
  assert.equal((await path(['alias','nested','image.bin'])).target,file.file);
  await assert.rejects(()=>run('move',{file:dir.file,fromFolder:manifest.folder,fromName:'alias',toFolder:dir.file,name:'self'}),/DIRECTORY_SELF_LINK/);
  await run('remove',{file:dir.file,folder:manifest.folder,name:'alias'},'bob');
  assert.equal((await path(['alias'],{authors:[wallets.bob.address,wallets.alice.address]})).status,'MASKED');
  assert.equal((await path(['alias'])).status,'PRESENT');
  assert.equal((await path(['alias','nested','image.bin'],{budget:2})).status,'PARTIAL');
  const pageContext=await cold.pin();const firstPage=await cold.listFolder({folder:manifest.folder,authors,context:pageContext,budget:1});
  assert.equal(firstPage.coverage,'PARTIAL');assert(firstPage.continuation);
  const continued=await cold.listFolder({folder:manifest.folder,authors,context:pageContext,budget:256,continuation:firstPage.continuation});
  assert.equal(continued.coverage,'COMPLETE');assert(continued.value.some(r=>r.file===archive.file));
  const iface=new e.Interface(manifest.contracts.ledger.abi),badCall=iface.encodeFunctionData('record',[dir.file]);
  const unavailable=createGuardedCompactSdk({ethers:e,manifest,journal:await env.createJournal('unavailable'),rpc:(method,params)=>{
    if(method==='eth_call'&&params[0].data===badCall)throw Error('descriptor bytes unavailable');return rpc(method,params);
  }});
  const unavailableContext=await unavailable.pin();
  const unknown=await unavailable.listFolder({folder:manifest.folder,authors,context:unavailableContext});
  assert.equal(unknown.value.find(r=>r.file===dir.file).kind,'unknown');assert.equal(unknown.kindCoverage,'PARTIAL');
  assert.equal((await resolvePath({sdk:unavailable,root:manifest.folder,segments:['alias'],authors,context:unavailableContext})).status,'UNKNOWN');
  // pin also calls Lens getters: activate the failure only after pinning.
  let failEdge=false;
  const edgeSdk=createGuardedCompactSdk({ethers:e,manifest,journal:await env.createJournal('edge'),rpc:(method,params)=>{
    if(failEdge&&method==='eth_call'&&params[0].to===manifest.contracts.lens.address)throw Error('edge unavailable');return rpc(method,params);
  }});
  const edgeContext=await edgeSdk.pin();failEdge=true;
  assert.equal((await edgeSdk.readPlacement({folder:manifest.folder,name:'alias',authors,context:edgeContext})).knowledge,'UNKNOWN');
  const sixtyFour=Array.from({length:64},(_,i)=>e.zeroPadValue(e.toBeHex(i+100),32));
  const bounded=await sdk.prepare({operation:'restorePlacement',file:dir.file,folder:manifest.folder,name:'bounded',author:wallets.alice.address,principals:sixtyFour});
  assert.equal(bounded.readSet.principalIds.length,64);assert.equal(bounded.startingHeads.length,1);
  assert(!bounded.readSet.principalIds.includes(e.zeroPadValue(wallets.alice.address,32)),'writer CAS must not become a 65th Lens principal');
  await assert.rejects(()=>sdk.prepare({operation:'restorePlacement',file:dir.file,name:'overflow',author:wallets.alice.address,principals:[...sixtyFour,e.zeroPadValue(wallets.alice.address,32)]}),/READSET_SHAPE/);
  // Honest new-name phantom: new A/new -> D changes neither asserted position
  // root/a nor D/a. The guarded move succeeds and a mixed-author cycle exists.
  const a=await run('createDirectory',{name:'a',salt:e.id('phantom-a')});
  const d=await run('createDirectory',{name:'d',salt:e.id('phantom-d')});
  const before=await sdk.pin();assert.equal((await sdk.listFolder({folder:a.file,authors,context:before})).knowledge,'ABSENT');
  const moving=await sdk.prepare({operation:'move',file:a.file,fromFolder:manifest.folder,fromName:'a',toFolder:d.file,name:'a',author:wallets.alice.address,authors,context:before});
  const signed=await sdk.authorize(moving,digest=>wallets.alice.signingKey.sign(digest).serialized);
  await run('restorePlacement',{file:d.file,folder:a.file,name:'new'},'bob');
  await sdk.submit(signed,tx=>env.send('phantom-move',tx,'alice'));
  assert.equal((await sdk.reconcile(moving.id)).status,'EFFECTS_VERIFIED');
  const cycle=await path(['d','a','new']);assert.equal(cycle.status,'CYCLE');assert.equal(cycle.trail.length,3);
  assert.equal(cycle.trail[2].selection.author.toLowerCase(),e.zeroPadValue(wallets.bob.address,32).toLowerCase());
  await env.writeReport('directory',{transactions:env.transactions,metrics:env.metrics});
});

test('typed Directory source destination and mask races mine both orders without partial stale effects',{timeout:120000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',filesProfile:'typed-directory-v1'});t.after(()=>env.close());
  const {ethers:e,wallets,manifest}=env,authors=[wallets.bob.address,wallets.alice.address];
  const sdk=createGuardedCompactSdk({ethers:e,manifest,rpc:env.rpc,journal:await env.createJournal('races')});
  const run=async(operation,args)=>{
    const p=await sdk.prepare({operation,author:wallets.alice.address,authors,...args});
    const signed=await sdk.authorize(p,d=>wallets.alice.signingKey.sign(d).serialized);
    await sdk.submit(signed,tx=>env.send(operation,tx,'alice'));assert.equal((await sdk.reconcile(p.id)).status,'EFFECTS_VERIFIED');return p;
  };
  const destination=await run('createDirectory',{name:'destination',salt:e.id('race-destination')});
  const other=await run('createDirectory',{name:'other',salt:e.id('race-other')});
  const ledger=new e.Interface(manifest.contracts.ledger.abi),Z=e.ZeroHash,F=e.id('efs2/purpose/folder/1');
  const action=fields=>({kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z,...fields});
  for(const race of ['source','destination','mask'])for(const order of ['move-first','competitor-first'])await t.test(`${race}/${order}`,async()=>{
    const name=`${race}-${order}`,arrived=`arrived-${name}`;
    const dir=await run('createDirectory',{name,salt:e.id(name)});
    const plan=await sdk.prepare({operation:'move',file:dir.file,fromFolder:manifest.folder,fromName:name,toFolder:destination.file,name:arrived,author:wallets.alice.address,authors});
    const signed=await sdk.authorize(plan,d=>wallets.alice.signingKey.sign(d).serialized);
    assert.equal(plan.readSet.positions.length,2);assert.equal(plan.readSet.principalIds.length,2);
    const folder=race==='source'?manifest.folder:destination.file,label=race==='source'?name:arrived,role=e.id(label),body=e.toUtf8Bytes(label);
    const actions=[action({kind:1,typeId:manifest.types.name,bodyHashOrRecordId:role}),action({kind:3,purpose:F,subject:folder,role,target:other.file})];
    const bodies=[body,'0x'];if(race==='mask'){actions.push(action({kind:4,purpose:F,subject:folder,role,expectedRevision:1}));bodies.push('0x');}
    const nonce=(await env.call('ledger','nonces',[wallets.bob.address]))[0];
    const competitor={to:manifest.contracts.ledger.address,data:ledger.encodeFunctionData('execute',[actions,bodies,nonce])};
    const before=(await env.call('ledger','counts'))[0];
    await env.rpc('evm_setAutomine',[false]);let moveHash,competingHash;
    try{
      if(order==='move-first'){moveHash=await env.enqueue(`${name}/move`,signed.transaction,'alice');competingHash=await env.enqueue(`${name}/compete`,competitor,'bob');}
      else {competingHash=await env.enqueue(`${name}/compete`,competitor,'bob');moveHash=await env.enqueue(`${name}/move`,signed.transaction,'alice');}
      await env.rpc('evm_mine',[]);
    }finally{await env.rpc('evm_setAutomine',[true]);}
    const move=await env.observe(moveHash),compete=await env.observe(competingHash);assert.equal(compete.status,'SUCCESS');
    assert.equal(move.status,order==='move-first'?'SUCCESS':'REVERTED');
    assert.equal((await env.call('ledger','counts'))[0]-before,BigInt(actions.length+(order==='move-first'?plan.actions.length:0)));
    for(const expected of plan.expectedHeads){const h=await env.call('ledger','head',[expected.key]);
      const initial=plan.startingHeads.find(x=>x.key===expected.key),want=order==='move-first'?expected:initial;
      assert.equal(Number(h[0]),want.state);assert.equal(Number(h[1]),want.revision);assert.equal(h[5],want.target);
    }
  });
  await env.writeReport('directory-races',{transactions:env.transactions,metrics:env.metrics});
});
