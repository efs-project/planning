import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createGuardedCompactSdk} from './compact-sdk-v2.mjs';

test('exact-hash caches refresh unchanged-admission blocks, epoch, account code, index and reorgs',{timeout:120000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',transportOptions:{batch:true}});t.after(()=>env.close());
  const {ethers:e,rpc,manifest,wallets}=env,sdk=createGuardedCompactSdk({ethers:e,rpc,manifest});
  const first=await sdk.pin(),before=sdk.readMetrics();await rpc('evm_mine',[]);const second=await sdk.pin();
  assert.notEqual(first.blockHash,second.blockHash);assert.equal(first.admission,second.admission);assert(sdk.readMetrics().misses>before.misses);
  await env.transact('registry','setBindingRefType',[e.id('transport-purpose'),e.id('transport-role'),e.ZeroHash]);
  const epoch=await sdk.pin();assert.equal(epoch.admission,first.admission);assert(BigInt(epoch.epoch)>BigInt(second.epoch));
  const snap=await rpc('evm_snapshot',[]);
  const planArgs={operation:'create',author:wallets.alice.address,authors:[wallets.alice.address],name:'code.txt',document:'code',salt:e.id('code')};
  await sdk.prepare(planArgs);
  await rpc('anvil_setCode',[wallets.alice.address,'0x60006000f3']);await rpc('evm_mine',[]);
  await assert.rejects(sdk.prepare(planArgs),/SIGNED_KEY_ONLY/,'new-block account classification is not reused');
  await rpc('evm_revert',[snap]);
  const indexSnap=await rpc('evm_snapshot',[]);await env.transact('ledger','setIndexModule',[e.ZeroAddress]);
  await assert.rejects(sdk.pin(),/BINDING|EXECUTION|decode|BAD_DATA/);await rpc('evm_revert',[indexSnap]);
  const codeSnap=await rpc('evm_snapshot',[]);await rpc('anvil_setCode',[manifest.contracts.names.address,'0x00']);await rpc('evm_mine',[]);
  await assert.rejects(sdk.pin(),/CODE_names/);await rpc('evm_revert',[codeSnap]);
  await rpc('evm_mine',[]);const orphan=await sdk.pin();await sdk.readTag({context:orphan,authors:[wallets.alice.address],subject:e.id('s'),concept:e.id('c')});
  // A same-height branch with a different header must never serve warmed bytes.
  const parent=await rpc('evm_snapshot',[]);await rpc('evm_mine',[]);const warmed=await sdk.pin();
  await sdk.readTag({context:warmed,authors:[wallets.alice.address],subject:e.id('s'),concept:e.id('c')});
  await rpc('evm_revert',[parent]);await rpc('evm_setNextBlockTimestamp',[Number(BigInt(warmed.timestamp))+10]);await rpc('evm_mine',[]);
  await assert.rejects(sdk.readTag({context:warmed,authors:[wallets.alice.address],subject:e.id('s'),concept:e.id('c')}),/BLOCK_REORG/);
});

test('failed pin is retryable and final reconciliation canonicality failure cannot persist success',{timeout:120000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',transportOptions:{batch:true}});t.after(()=>env.close());
  const {ethers:e,rpc,manifest,wallets}=env,ledger=new e.Interface(manifest.contracts.ledger.abi);
  let failPin=true,phase='',finalChecks=0,failFinal=false;
  const wrapped=async(method,params)=>{
    if(failPin&&method==='eth_call'&&params[0].to===manifest.contracts.ledger.address&&ledger.parseTransaction(params[0])?.name==='realmId')throw Error('pin provider failure');
    if(failFinal&&phase==='reconcile-committed'&&method==='eth_getBlockByNumber'&&params[0]!=='latest'&&++finalChecks===2)throw Error('final provider failure');
    return rpc(method,params);
  };
  const journal=await env.createJournal('final-canonical'),sdk=createGuardedCompactSdk({ethers:e,rpc:wrapped,manifest,journal,onPhase:value=>{phase=value;}});
  await assert.rejects(sdk.pin(),/pin provider failure/);assert.equal(sdk.readMetrics().contexts,0);failPin=false;await sdk.pin();
  const plan=await sdk.prepare({operation:'create',author:wallets.alice.address,authors:[wallets.alice.address],name:'final.txt',salt:e.id('final'),document:'verified'});
  await sdk.submit(await sdk.authorize(plan,d=>wallets.alice.signingKey.sign(d).serialized),tx=>env.send('final-create',tx,'alice'));
  assert.equal((await sdk.reconcile(plan.id)).status,'EFFECTS_VERIFIED');
  failFinal=true;const result=await sdk.reconcile(plan.id);assert.equal(result.status,'UNKNOWN');assert.equal(result.knowledge,'UNKNOWN');
  assert.equal((await journal.get(plan.id)).status,'UNKNOWN');assert.equal(result.evidence,null);
});
