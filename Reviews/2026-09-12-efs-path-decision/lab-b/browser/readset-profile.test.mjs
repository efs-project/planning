import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createGuardedCompactSdk} from './compact-sdk-v2.mjs';

test('new read-set profile must be explicit and a failed exact probe cannot downgrade to legacy',{timeout:120000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2'});t.after(()=>env.close());
  const {ethers:e,manifest,rpc,wallets}=env,copy=()=>JSON.parse(JSON.stringify(manifest));
  const options=m=>({ethers:e,manifest:m,rpc,journal:{get:async()=>null,put:async()=>{}}});
  const bad=copy();bad.executionFamily.implementations[0].readSetStorage={profile:e.id('unsupported'),namespace:e.ZeroHash};
  assert.throws(()=>createGuardedCompactSdk(options(bad)),/READSET_PROFILE/);
  const missing=copy();delete missing.executionFamily.implementations[0].readSetStorage;
  assert.throws(()=>createGuardedCompactSdk(options(missing)),/READSET_PROFILE/);
  const wrongRoot=copy();wrongRoot.executionFamily.implementations[0].readSetStorage.namespace=e.id('wrong-root');
  assert.throws(()=>createGuardedCompactSdk(options(wrongRoot)),/READSET_PROFILE/);
  const wrongSupport=copy();wrongSupport.executionFamily.implementations[0].publicationSupport.codeHash=e.id('wrong-support');
  await assert.rejects(createGuardedCompactSdk(options(wrongSupport)).prepare({operation:'create',author:wallets.alice.address,
    authors:[wallets.alice.address],name:'support',salt:e.id('support'),document:'support'}),/READSET_SUPPORT_UNSUPPORTED/);
  const selector=e.id('readSetStorageProfile()').slice(0,10);let probes=0;
  const sdk=createGuardedCompactSdk({...options(manifest),rpc:async(method,params)=>{
    if(method==='eth_call'&&params[0].data.startsWith(selector)){probes++;throw Error('physical profile unavailable');}
    return rpc(method,params);
  }});
  await assert.rejects(sdk.prepare({operation:'create',author:wallets.alice.address,authors:[wallets.alice.address],name:'a',salt:e.id('a'),document:'a'}));
  assert.equal(probes,1,'must not skip the declared new-codec probe');
});
