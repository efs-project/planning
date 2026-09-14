import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createCompactSdk} from './compact-sdk.mjs';

test('fresh compact chain: retained names, revisions, author selection and placement lifecycle', {timeout:240_000}, async t => {
  const env = await createEnvironment(); t.after(() => env.close());
  const {ethers:e, manifest, rpc, wallets} = env;
  const journal = await env.createJournal('journey');
  let sdk = createCompactSdk({ethers:e,manifest,rpc,journal});
  const authors = [wallets.alice.address,wallets.bob.address];
  const run = async (operation,args={},who='alice') => {
    const plan = await sdk.prepare({operation,author:wallets[who].address,authors,...args});
    const signed = await sdk.authorize(plan,digest => wallets[who].signingKey.sign(digest).serialized);
    await sdk.submit(signed,tx => env.send(operation,tx,who));
    const outcome = await sdk.reconcile(plan.id);
    assert.equal(outcome.status,'EFFECTS_VERIFIED',operation);
    assert.equal(outcome.receiptAttribution,'RPC_MATCHED_DIRECT_PLAN',operation);
    return plan;
  };
  const a = await run('create',{name:'meeting.txt',document:'Meeting at 10:00.',salt:e.id('cold-files-1')});
  const list = async (folder=manifest.folder) => {
    const context = await sdk.pin(); let answer;
    do {answer = await sdk.listFolder({folder,authors,context,budget:1,continuation:answer?.continuation});}
    while (answer.continuation);
    assert.equal(answer.coverage,'COMPLETE'); assert.equal(answer.nameCoverage,'COMPLETE');
    return answer;
  };
  assert.equal((await list()).value[0].name.value,'meeting.txt');
  const original = await sdk.pin();
  await run('edit',{file:a.file,document:'Meeting at 11:00.'});
  await run('edit',{file:a.file,document:'Meeting at 09:00.'},'bob');
  const fresh = await sdk.pin();
  const alice = await sdk.readFile({file:a.file,authors,context:fresh});
  const bob = await sdk.readFile({file:a.file,authors:[...authors].reverse(),context:fresh});
  assert.equal(e.toUtf8String(alice.value.revision.document),'Meeting at 11:00.');
  assert.equal(e.toUtf8String(bob.value.revision.document),'Meeting at 09:00.');
  assert.equal((await sdk.readFile({file:a.file,authors,context:fresh,policy:'no-tiebreak'})).knowledge,'CONFLICT');
  assert.equal(e.toUtf8String((await sdk.readFile({file:a.file,authors,context:original})).value.revision.document),'Meeting at 10:00.');
  const tag = e.id('approved');
  await run('addTag',{file:a.file,scope:'file',concept:tag});
  let tagged = await sdk.readFile({file:a.file,authors,concept:tag,context:await sdk.pin()});
  assert.equal(tagged.value.fileTag.present,true); assert.equal(tagged.value.revisionTag.present,false);
  await run('addTag',{file:a.file,scope:'revision',concept:tag});
  tagged = await sdk.readFile({file:a.file,authors,concept:tag,context:await sdk.pin()});
  assert.equal(tagged.value.revisionTag.present,true);
  const appBasis=await sdk.pin();
  await env.transact('application','adoptApprovedRevision',[a.file,tagged.value.revision.recordId,0,
    [appBasis.admission,appBasis.generation,appBasis.epoch,appBasis.core]],'third-party/read-approve-publish','alice');
  assert.equal((await env.call('application','adoptionCount'))[0],1n);
  const adopted=await sdk.readFile({file:a.file,authors:[env.contracts.application.address],context:await sdk.pin()});
  assert.equal(adopted.knowledge,'PRESENT');
  assert.equal(adopted.value.revision.parent,tagged.value.revision.recordId);
  assert.equal(adopted.value.selection.author.toLowerCase(),env.contracts.application.address.toLowerCase());
  const publication=(await env.call('ledger','admission',[adopted.value.selection.admission]))[2];
  assert.equal((await env.call('ledger','evidence',[publication]))[1],1n,'contract output is native evidence');
  await run('rename',{file:a.file,fromName:'meeting.txt',name:'agenda.txt'});
  assert.equal((await list()).value[0].name.value,'agenda.txt');
  await run('move',{file:a.file,fromFolder:manifest.folder,toFolder:manifest.folders[1],fromName:'agenda.txt',name:'agenda.txt'});
  assert.equal((await list()).knowledge,'ABSENT');
  assert.equal((await list(manifest.folders[1])).value[0].file,a.file);
  await run('remove',{file:a.file,folder:manifest.folders[1],name:'agenda.txt'});
  assert.equal((await list(manifest.folders[1])).knowledge,'ABSENT');
  await run('restorePlacement',{file:a.file,folder:manifest.folders[1],name:'agenda.txt'});
  await run('restoreContents',{file:a.file,record:a.newRevision});
  const restored = await sdk.readFile({file:a.file,authors,context:await sdk.pin()});
  assert.equal(e.toUtf8String(restored.value.revision.document),'Meeting at 10:00.');
  assert.notEqual(restored.value.revision.recordId,a.newRevision,'restoration is a fresh child');
  const replacement = await run('create',{name:'meeting.txt',document:'A different file.',salt:e.id('cold-files-2')});
  assert.notEqual(a.file,replacement.file);
  // No original context/name dictionary is passed into the reloaded adapter.
  sdk = createCompactSdk({ethers:e,manifest:JSON.parse(JSON.stringify(manifest)),rpc,journal});
  assert.equal((await list()).value[0].name.value,'meeting.txt');
  assert.equal((await list(manifest.folders[1])).value[0].name.value,'agenda.txt');
  await env.writeReport('integration', {status:'PASS',application:{sourceSelection:tagged.value.selection,
    reviewerAssertion:tagged.value.revisionTag,outputSelection:adopted.value.selection,nativeProofKind:'PROOF_NATIVE'},
    transactions:env.transactions,rpc:env.metrics});
});

test('two valid HEAD updates in one block retain success of the superseded first publication', {timeout:120_000}, async t=>{
  const env=await createEnvironment();t.after(()=>env.close());
  const {ethers:e,wallets,manifest,rpc}=env, wallet=wallets.alice;
  const journal=await env.createJournal('same-block'),sdk=createCompactSdk({ethers:e,manifest,rpc,journal});
  const initial=await sdk.prepare({operation:'create',author:wallet.address,name:'same-block.txt',document:'Original',salt:e.id('same-block')});
  const signedInitial=await sdk.authorize(initial,d=>wallet.signingKey.sign(d).serialized);
  await sdk.submit(signedInitial,tx=>env.send('same-block/seed',tx,'alice'));
  const edit=await sdk.prepare({operation:'edit',author:wallet.address,file:initial.file,document:'Updated'});
  const signed=await sdk.authorize(edit,d=>wallet.signingKey.sign(d).serialized);
  const iface=new e.Interface(manifest.contracts.ledger.abi);
  const later={...edit.actions[1],target:initial.newRevision,expectedRevision:edit.actions[1].expectedRevision+1};
  let firstHash,secondHash;
  try{
    await sdk.submit(signed,async tx=>{
      await rpc('anvil_setAutomine',[false]);
      const nonce=Number(BigInt(await rpc('eth_getTransactionCount',[wallet.address,'pending'])));
      const signedTx=data=>wallet.signTransaction({to:tx.to,data,nonce,chainId:31337,type:0,gasPrice:2_000_000_000n,gasLimit:8_000_000n});
      firstHash=await rpc('eth_sendRawTransaction',[await signedTx(tx.data)]);
      const secondData=iface.encodeFunctionData('execute',[[later],['0x'],BigInt(edit.intent.nonce)+1n]);
      secondHash=await rpc('eth_sendRawTransaction',[await wallet.signTransaction({to:tx.to,data:secondData,nonce:nonce+1,
        chainId:31337,type:0,gasPrice:2_000_000_000n,gasLimit:8_000_000n})]);
      return firstHash;
    });
    await rpc('evm_mine');
  }finally{await rpc('anvil_setAutomine',[true]);}
  const first=await rpc('eth_getTransactionReceipt',[firstHash]),second=await rpc('eth_getTransactionReceipt',[secondHash]);
  assert.equal(first.status,'0x1');assert.equal(second.status,'0x1');assert.equal(first.blockHash,second.blockHash);
  const reconciled=await sdk.reconcile(edit.id);
  assert.equal(reconciled.status,'EFFECTS_VERIFIED');
  assert.equal(reconciled.evidence.supersededAtPublicationBlock,true);
});
