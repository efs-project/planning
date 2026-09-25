import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createGuardedCompactSdk} from './compact-sdk-v2.mjs';

test('one staged five-operation save is guarded, signed once, and atomic on late failure', {timeout:120_000}, async t => {
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',filesProfile:'typed-directory-v1'});
  t.after(()=>env.close());
  const {ethers:e,wallets,manifest}=env,author=wallets.alice.address,authors=[author],folder=manifest.folder;
  const sdk=createGuardedCompactSdk({ethers:e,manifest,rpc:env.rpc,journal:await env.createJournal('staged-batch')});
  const coder=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
  const hash=(types,values)=>e.keccak256(coder.encode(types,values));
  const position=(purpose,subject,role)=>hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),purpose,subject,role]);
  const HEAD=e.id('efs2/purpose/head/1'),TAG=e.id('efs2/purpose/tag/1'),FOLDER=e.id('efs2/purpose/folder/1');
  const concept=e.id('staged-batch/concept');
  const recipe=(label,a,b)=>({operation:'stagedBatch',author,authors,steps:[
    {operation:'create',name:a,salt:e.id(`staged-batch/${label}`),document:'draft'},
    {operation:'edit',document:'final content'},
    {operation:'addTag',scope:'file',concept},
    {operation:'rename',fromName:a,name:b},
    {operation:'linkPlacement',name:a},
  ]});
  const sign=async plan=>sdk.authorize(plan,d=>wallets.alice.signingKey.sign(d).serialized);
  const run=async(operation,args)=>{
    const plan=await sdk.prepare({operation,author,authors,...args}),signed=await sign(plan);
    await sdk.submit(signed,tx=>env.send(operation,tx,'alice'));
    assert.equal((await sdk.reconcile(plan.id)).status,'EFFECTS_VERIFIED');return plan;
  };

  const plan=await sdk.prepare(recipe('success','a.txt','b.txt'));
  await assert.rejects(sdk.prepare({...recipe('two-authors','other-a.txt','other-b.txt'),
    authors:[author,wallets.bob.address]}),/STAGED_BATCH_LENS/);
  assert.equal(plan.operation,'stagedBatch');
  assert.equal(plan.readSet.principalIds.length,1);
  assert.deepEqual(plan.readSet.positions,[position(HEAD,plan.file,Z),position(TAG,plan.file,concept),
    position(FOLDER,folder,e.id('a.txt')),position(FOLDER,folder,e.id('b.txt'))]);
  assert.equal(plan.actions.filter(a=>a.kind===5).length,1,'one File creation');
  assert.equal(plan.actions.filter(a=>a.kind===3&&a.purpose===HEAD).length,2,'root then child HEAD');
  assert.deepEqual(plan.actions.filter(a=>a.purpose===FOLDER&&a.role===e.id('a.txt')&&[3,4].includes(a.kind))
    .map(a=>[a.kind,Number(a.expectedRevision)]),[[3,0],[4,1],[3,2]]);
  let prompts=0,sends=0;
  const signed=await sdk.authorize(plan,d=>{prompts++;return wallets.alice.signingKey.sign(d).serialized;});
  assert.equal(new e.Interface(manifest.contracts.ledger.abi).parseTransaction(signed.transaction).name,'executeGuardedSigned');
  await sdk.submit(signed,tx=>{sends++;return env.send('staged/success',tx,'alice');});
  const outcome=await sdk.reconcile(plan.id);
  assert.equal(outcome.status,'EFFECTS_VERIFIED');assert.equal(prompts,1);assert.equal(sends,1);
  const successfulReceipt=env.transactions.find(x=>x.transactionHash===outcome.transactionHash);
  assert.equal(successfulReceipt?.status,'SUCCESS');
  const context=await sdk.pin();
  for(const name of ['a.txt','b.txt']){
    const placement=await sdk.readPlacement({folder,name,authors,context});
    assert.equal(placement.knowledge,'PRESENT');assert.equal(placement.value.target,plan.file);
  }
  const file=await sdk.readFile({file:plan.file,authors,context});
  assert.equal(e.toUtf8String(file.value.revision.document),'final content');
  assert.equal(file.value.revision.recordId,plan.newRevision);
  assert.equal((await sdk.readTag({subject:plan.file,target:plan.file,concept,authors,context})).value.assessment,'PRESENT');

  const stale=await sdk.prepare(recipe('before-sign','stale-a.txt','stale-b.txt'));
  await run('create',{name:'stale-a.txt',salt:e.id('staged-batch/competitor-1'),document:'competitor'});
  let stalePrompt=false;
  await assert.rejects(sdk.authorize(stale,()=>{stalePrompt=true;}),/DRIFT/);
  assert.equal(stalePrompt,false,'stale plan never asks for a signature');

  const onchain=await sdk.prepare(recipe('onchain','onchain-a.txt','onchain-b.txt'));
  const onchainSigned=await sign(onchain);
  await run('create',{name:'onchain-a.txt',salt:e.id('staged-batch/competitor-2'),document:'competitor'});
  const iface=new e.Interface(manifest.contracts.ledger.abi);
  await assert.rejects(env.rpc('eth_call',[onchainSigned.transaction,'latest']),error=>
    iface.parseError(error.rpcError?.data)?.name==='E_READSET_STALE');
  const beforeOnchain=Array.from(await env.call('ledger','counts')).map(String);
  const onchainTx=await env.enqueue('staged/onchain-stale',onchainSigned.transaction,'alice');
  assert.equal((await env.observe(onchainTx)).status,'REVERTED');
  assert.deepEqual(Array.from(await env.call('ledger','counts')).map(String),beforeOnchain);
  assert.equal((await env.call('ledger','subjectCreatedAt',[onchain.file]))[0],0n);

  const late=await sdk.prepare(recipe('late','late-a.txt','late-b.txt'));
  const actions=late.actions.map((a,i)=>i===late.actions.length-1?{...a,expectedRevision:Number(a.expectedRevision)+1}:a);
  const actionsHash=hash([iface.getFunction('execute').inputs[0]],[actions]);
  const intent={...late.intent,acceptanceProfile:(await env.call('ledger','acceptanceProfileOf',[actions]))[0]};
  const fields=['realmId:bytes32','realmOrigin:bytes32','executionSet:bytes32','author:address','nonce:uint64',
    'deadline:uint64','acceptanceProfile:bytes32','indexObligations:bytes32','readSetHash:bytes32','actionsHash:bytes32']
    .map(x=>{const [name,type]=x.split(':');return {name,type};});
  const digest=e.TypedDataEncoder.hash({name:'EFS2-RoadB-Lab',version:'2'},{IntentV2:fields},{...intent,actionsHash});
  const signature=wallets.alice.signingKey.sign(digest).serialized;
  const bad={to:manifest.contracts.ledger.address,data:iface.encodeFunctionData('executeGuardedSigned',
    [intent,actions,late.bodies,late.readSet,signature]),value:'0x0'};
  await assert.rejects(env.rpc('eth_call',[bad,'latest']),error=>iface.parseError(error.rpcError?.data)?.name==='E_CAS');
  const beforeLate=Array.from(await env.call('ledger','counts')).map(String);
  const beforeNonce=(await env.call('ledger','nonces',[author]))[0];
  const failed=await env.enqueue('staged/late-cas-failure',bad,'alice');
  assert.equal((await env.observe(failed)).status,'REVERTED');
  assert.deepEqual(Array.from(await env.call('ledger','counts')).map(String),beforeLate);
  assert.equal((await env.call('ledger','nonces',[author]))[0],beforeNonce);
  assert.equal((await env.call('ledger','subjectCreatedAt',[late.file]))[0],0n);
  assert.equal((await env.call('ledger','record',[late.newRevision]))[1],0n);
  assert.equal((await sdk.readPlacement({folder,name:'late-a.txt',authors,context:await sdk.pin()})).knowledge,'ABSENT');
  assert.equal((await sdk.readPlacement({folder,name:'late-b.txt',authors,context:await sdk.pin()})).knowledge,'ABSENT');
  console.log(JSON.stringify({receipt:{status:successfulReceipt.status,gasUsed:successfulReceipt.gasUsed,
    calldataBytes:successfulReceipt.calldataBytes,transactionHash:successfulReceipt.transactionHash},prompts,sends,
    negativeReceipts:env.transactions.filter(x=>x.label.startsWith('staged/')&&x.status==='REVERTED').map(x=>({label:x.label,gasUsed:x.gasUsed}))}));
});
