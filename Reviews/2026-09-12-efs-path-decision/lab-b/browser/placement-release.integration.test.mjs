import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createFilesCompactSdk} from './compact-files-sdk.mjs';
import {verifyGuardedClaim} from './guarded-archive.mjs';
import {resolvePath} from './compact-paths.mjs';

test('coordinate release preserves fallback, exact historical state and signed archive',{timeout:240000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',filesProfile:'typed-directory-v1',evidenceMode:'append'});
  t.after(()=>env.close());
  const {ethers:e}=env,authors=[env.wallets.bob.address,env.wallets.alice.address];
  const journal=await env.createJournal('release'),sdk=createFilesCompactSdk({ethers:e,manifest:env.manifest,rpc:env.rpc,journal});
  const selector=e.id('bindingLifecycleProfile()').slice(0,10);
  for(const mode of ['missing','relabeled','provider-failure','malformed-success','declared-revert','lens-mismatch']){
    const manifest=structuredClone(env.manifest);
    if(mode==='missing')for(const impl of manifest.executionFamily.implementations)delete impl.bindingLifecycleProfile;
    if(mode==='relabeled')for(const impl of manifest.executionFamily.implementations)impl.bindingLifecycleProfile=e.ZeroHash;
    const bad=createFilesCompactSdk({ethers:e,manifest,rpc:async(method,params)=>{
      if(method==='eth_call'&&params[0].data===selector){
        if(mode==='provider-failure')throw Error('lifecycle unavailable');
        if(mode==='malformed-success')return '0x';
        if(mode==='declared-revert')throw Object.assign(Error('execution reverted'),{rpcError:{code:3,data:'0x'}});
        if(mode==='lens-mismatch'&&params[0].to===manifest.contracts.lens.address)return e.AbiCoder.defaultAbiCoder().encode(['bytes32'],[e.ZeroHash]);
      }return env.rpc(method,params);
    }});
    await assert.rejects(bad.pin(),undefined,mode+' fails closed');
  }
  async function run(operation,args={},who='bob'){
    const p=await sdk.prepare({operation,author:env.wallets[who].address,authors,...args});
    await sdk.submit(await sdk.authorize(p,d=>env.wallets[who].signingKey.sign(d).serialized),tx=>env.send('release/'+who+'/'+operation,tx,who));
    assert.equal((await sdk.reconcile(p.id)).status,'EFFECTS_VERIFIED');return p;
  }
  const lower=await run('create',{name:'shared.txt',salt:e.id('release/alice'),document:'Alice'},'alice');
  const upper=await run('create',{name:'shared.txt',salt:e.id('release/bob'),document:'Bob',replace:true});
  await run('remove',{name:'shared.txt',file:upper.file});
  const release=await run('releasePlacement',{name:'shared.txt'});
  assert.deepEqual(release.actions.map(a=>a.kind),[7]);assert.equal(release.expectedHeads[0].state,3);
  assert.equal(release.actions[0].expectedRevision,2);assert.equal(release.actions[0].target,e.ZeroHash);
  const rows=await sdk.listFolder({context:await sdk.pin(),authors});
  assert.equal(rows.value.find(r=>r.name.value==='shared.txt').file,lower.file);
  await run('restorePlacement',{name:'shared.txt',file:upper.file,replace:true});
  const cold=createFilesCompactSdk({ethers:e,manifest:env.manifest,rpc:env.rpc,journal});
  assert.equal((await cold.reconcile(release.id)).status,'EFFECTS_VERIFIED');
  const lensApi=new e.Interface(env.manifest.contracts.lens.abi),historySelector=lensApi.getFunction('historyStatePrincipalAt').selector;
  const wrongState=createFilesCompactSdk({ethers:e,manifest:env.manifest,journal,rpc:async(method,params)=>{
    const raw=await env.rpc(method,params);
    if(method==='eth_call'&&params[0].data.startsWith(historySelector)){
      const h=Array.from(lensApi.decodeFunctionResult('historyStatePrincipalAt',raw));
      if(Number(h[1])===3){h[1]=2;return lensApi.encodeFunctionResult('historyStatePrincipalAt',h);}
    }return raw;
  }});
  assert.equal((await wrongState.reconcile(release.id)).status,'EFFECTS_MISMATCH','MASK must never satisfy RELEASE evidence');
  assert.equal((await cold.reconcile(release.id)).status,'EFFECTS_VERIFIED');
  const publication=String((await env.call('ledger','publicationOf',[release.publicationId]))[0]);
  const claim=await sdk.exportPublication({publication});assert.equal(claim.actions[0].kind,7);
  assert.equal((await verifyGuardedClaim(e,claim)).sourceAdmission,'NOT_PROVEN');
  const tampered=structuredClone(claim);tampered.actions[0].kind=4;
  await assert.rejects(verifyGuardedClaim(e,tampered),/ACTIONS_HASH/);
  const stale=await sdk.prepare({operation:'releasePlacement',author:authors[0],authors,name:'shared.txt'});
  const signed=await sdk.authorize(stale,d=>env.wallets.bob.signingKey.sign(d).serialized);
  await run('restorePlacement',{name:'shared.txt',file:lower.file,replace:true},'alice');
  let broadcast=false;
  await assert.rejects(sdk.submit(signed,()=>{broadcast=true;}),/READSET_DRIFT/);assert.equal(broadcast,false);
  const liveRelease=await run('releasePlacement',{name:'shared.txt',file:e.id('irrelevant-descriptive-file')});
  assert.deepEqual(liveRelease.actions.map(a=>a.kind),[7]);
  await assert.rejects(sdk.prepare({operation:'releasePlacement',author:authors[0],authors,name:'shared.txt'}),/PLACEMENT_NOT_RELEASABLE/);
  const directory=await run('createDirectory',{name:'directory',salt:e.id('release/directory')});
  const child=await run('create',{folder:directory.file,name:'child.txt',salt:e.id('release/child'),document:'retained child'});
  await run('restorePlacement',{name:'alias',file:directory.file});
  await run('releasePlacement',{name:'directory'});
  const context=await sdk.pin(),path=await resolvePath({sdk,root:env.manifest.folder,segments:['alias','child.txt'],authors,context});
  assert.equal(path.target,child.file);
  assert.equal((await sdk.readFile({file:path.target,authors,context})).value.revision.document,e.hexlify(e.toUtf8Bytes('retained child')));
  assert.equal((await sdk.readPlacement({name:'directory',authors,context})).knowledge,'ABSENT');
  await env.writeReport('placement-release',{release,transactions:env.transactions});
});
