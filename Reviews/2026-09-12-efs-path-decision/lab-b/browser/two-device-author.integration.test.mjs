import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createGuardedCompactSdk} from './compact-sdk-v2.mjs';

test('two scoped 7702 device keys continue one EOA File without changing its Principal', {timeout:120_000}, async t => {
  const env = await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',hardfork:'prague'});
  t.after(() => env.close());
  const {ethers:e,wallets,manifest,rpc} = env;
  const owner=wallets.alice, payer=wallets.bob, deviceA=e.Wallet.createRandom(), deviceB=e.Wallet.createRandom();
  const ownerPrincipal=e.zeroPadValue(owner.address,32), authors=[owner.address];
  const journal=await env.createJournal('two-device-author');
  const sdk=createGuardedCompactSdk({ethers:e,manifest,rpc,journal});
  const ledger=manifest.contracts.ledger.address, ledgerApi=new e.Interface(manifest.contracts.ledger.abi);
  const delegateAddress=await env.deploy('scopedDelegate','Scoped7702Delegate.sol','Scoped7702Delegate',
    [ledger,manifest.types.child,e.id('efs2/purpose/head/1')]);
  const delegate=new e.Interface(env.contracts.scopedDelegate.abi);
  const counters={ownerPublicationSignatures:0,authorizationSignatures:0,ownerTransactionSignatures:0,
    childMessageSignatures:0,payerTransactionSignatures:0,observedUiPrompts:null};
  const initial=async(name,salt,document)=>{
    const plan=await sdk.prepare({operation:'create',author:owner.address,authors,name,salt,document});
    const signed=await sdk.authorize(plan,d=>{counters.ownerPublicationSignatures++;return owner.signingKey.sign(d).serialized;});
    counters.ownerTransactionSignatures++;
    await sdk.submit(signed,tx=>env.send(`seed/${name}`,tx,'alice'));
    assert.equal((await sdk.reconcile(plan.id)).status,'EFFECTS_VERIFIED');
    return plan;
  };
  const seed=await initial('devices.txt',e.id('two-device-file'),'EOA original');
  const other=await initial('other.txt',e.id('other-device-file'),'out of scope');
  const original=(await sdk.readFile({file:seed.file,principals:[ownerPrincipal],context:await sdk.pin()})).value.revision;
  assert.equal(original.recordId,seed.newRevision);
  assert.equal(original.publicationContext.principalId,ownerPrincipal);
  assert.equal((await env.call('ledger','principalOf',[owner.address]))[0],ownerPrincipal);

  // One real Prague type-4 owner transaction installs code and grants both keys.
  const txNonce=Number(BigInt(await rpc('eth_getTransactionCount',[owner.address,'pending'])));
  const authorization=await owner.authorize({address:delegateAddress,chainId:31337n,nonce:txNonce+1});
  counters.authorizationSignatures++;
  const expires=BigInt((await rpc('eth_getBlockByNumber',['latest',false])).timestamp)+3600n;
  const grantData=delegate.encodeFunctionData('grantPair',[deviceA.address,deviceB.address,seed.file,expires,3]);
  counters.ownerTransactionSignatures++;
  const installHash=await env.enqueue('7702/install-and-grant-pair',
    {type:4,to:owner.address,nonce:txNonce,data:grantData,gasLimit:15_000_000n,authorizationList:[authorization]},'alice');
  const install=await env.observe(installHash);
  assert.equal(install.status,'SUCCESS');
  assert.equal(install.receipt.type,'0x4');
  const type4=e.Transaction.from(install.rawTransaction);
  assert.equal(type4.authorizationList.length,1);
  assert.equal(e.verifyAuthorization(type4.authorizationList[0],type4.authorizationList[0].signature).toLowerCase(),owner.address.toLowerCase());
  assert.equal((await rpc('eth_getCode',[owner.address,'latest'])).toLowerCase(),`0xef0100${delegateAddress.slice(2).toLowerCase()}`);
  assert.equal((await env.call('ledger','principalOf',[owner.address]))[0],ownerPrincipal);
  assert.equal(BigInt(await rpc('eth_getBalance',[deviceA.address,'latest'])),0n);
  assert.equal(BigInt(await rpc('eth_getBalance',[deviceB.address,'latest'])),0n);
  const accountCall=async(fn,args=[])=>delegate.decodeFunctionResult(fn,await rpc('eth_call',[
    {to:owner.address,data:delegate.encodeFunctionData(fn,args)},'latest']));
  assert.equal((await accountCall('grants',[deviceA.address]))[5],3n,'A has a finite edit-use cap');
  assert.equal((await accountCall('grants',[deviceB.address]))[5],3n,'B has a finite edit-use cap');
  const domain={name:'EFS Scoped 7702 Lab',version:'1',chainId:31337,verifyingContract:owner.address};
  const types={SessionEdit:[
    {name:'child',type:'address'},{name:'file',type:'bytes32'},{name:'ledger',type:'address'},
    {name:'executionSet',type:'bytes32'},{name:'grantEpoch',type:'uint64'},
    {name:'childNonce',type:'uint64'},{name:'ledgerNonce',type:'uint64'},
    {name:'actionsHash',type:'bytes32'},{name:'readSetHash',type:'bytes32'},
    {name:'deadline',type:'uint64'}]};
  const prepareEdit=async(file,document)=>sdk.prepare({operation:'edit',author:owner.address,authors,file,document});
  const signEdit=async(device,plan)=>{
    const grant=await accountCall('grants',[device.address]);
    const childNonce=grant[2], deadline=expires;
    const actionsHash=e.keccak256(e.AbiCoder.defaultAbiCoder().encode(
      [ledgerApi.getFunction('executeGuarded').inputs[0]],[plan.actions]));
    assert.equal(actionsHash,plan.actionsHash);
    const readSetHash=(await env.call('ledger','readSetHash',[plan.readSet]))[0];
    assert.equal(readSetHash,plan.intent.readSetHash);
    const fields={child:device.address,file:grant[0],ledger,executionSet:plan.intent.executionSet,
      grantEpoch:grant[1],childNonce,ledgerNonce:BigInt(plan.intent.nonce),actionsHash,readSetHash,deadline};
    const expected=e.TypedDataEncoder.hash(domain,types,fields);
    const digest=(await accountCall('sessionDigest',[device.address,actionsHash,readSetHash,
      BigInt(plan.intent.nonce),plan.intent.executionSet,childNonce,deadline]))[0];
    assert.equal(digest,expected,'session digest uses EIP-712 account/chain domain');
    counters.childMessageSignatures++;
    const signature=device.signingKey.sign(digest).serialized;
    const data=delegate.encodeFunctionData('run',[ledger,plan.actions,plan.bodies,BigInt(plan.intent.nonce),
      plan.intent.executionSet,plan.readSet,device.address,childNonce,deadline,signature]);
    return {plan,data,signature,device:device.address};
  };
  const relay=async(label,signed,expected='SUCCESS')=>{
    counters.payerTransactionSignatures++;
    const hash=await env.enqueue(label,{to:owner.address,data:signed.data,gasLimit:15_000_000n},'bob');
    const row=await env.observe(hash);
    assert.equal(row.status,expected,label);
    assert.equal(row.signer,'bob');
    return row;
  };
  const expectDenied=async(signed,errorName)=>{
    let denial;
    try { await rpc('eth_call',[{from:payer.address,to:owner.address,data:signed.data},'latest']); }
    catch(error) { denial=error; }
    assert(denial,`${errorName} must revert before broadcast`);
    const returned=denial.rpcError?.data;
    assert.equal(typeof returned,'string');
    assert.equal(returned.slice(0,10),delegate.getError(errorName).selector);
  };

  await expectDenied({data:delegate.encodeFunctionData('revoke',[deviceB.address])},'E_OWNER');
  const wrongFile=await signEdit(deviceA,await prepareEdit(other.file,'not allowed'));
  await expectDenied(wrongFile,'E_SCOPE');
  const wrongFileReceipt=await relay('device-A/wrong-file',wrongFile,'REVERTED');
  const aPlan=await prepareEdit(seed.file,'device A edit');
  const a=await signEdit(deviceA,aPlan);
  const aReceipt=await relay('device-A/edit',a);
  assert.equal((await accountCall('grants',[deviceA.address]))[5],2n);
  const selectedA=(await sdk.readFile({file:seed.file,principals:[ownerPrincipal],context:await sdk.pin()})).value.revision;
  assert.equal(selectedA.recordId,aPlan.newRevision);
  assert.equal(selectedA.publicationContext.principalId,ownerPrincipal);
  assert.equal(selectedA.publicationContext.authorizationProfile,'1');
  await expectDenied(a,'E_NONCE');
  const replayReceipt=await relay('device-A/replay',a,'REVERTED');
  const bPlan=await prepareEdit(seed.file,'device B edit');
  const bReceipt=await relay('device-B/edit',await signEdit(deviceB,bPlan));
  const selectedB=(await sdk.readFile({file:seed.file,principals:[ownerPrincipal],context:await sdk.pin()})).value.revision;
  assert.equal(selectedB.recordId,bPlan.newRevision);
  assert.equal(selectedB.publicationContext.principalId,ownerPrincipal);
  assert.equal(selectedB.publicationContext.authorizationProfile,'1');
  const stalePlan=await prepareEdit(seed.file,'revoked A must not publish');
  const staleA=await signEdit(deviceA,stalePlan);
  counters.ownerTransactionSignatures++;
  const revokeHash=await env.enqueue('7702/revoke-A',
    {to:owner.address,data:delegate.encodeFunctionData('revoke',[deviceA.address])},'alice');
  const revoke=await env.observe(revokeHash);
  assert.equal(revoke.status,'SUCCESS');
  const nonceBefore=await env.call('ledger','nonces',[owner.address]);
  await expectDenied(staleA,'E_GRANT');
  const staleReceipt=await relay('device-A/stale-after-revoke',staleA,'REVERTED');
  assert.equal((await env.call('ledger','nonces',[owner.address]))[0],nonceBefore[0]);
  const finalPlan=await prepareEdit(seed.file,'device B still active');
  const finalReceipt=await relay('device-B/after-A-revoke',await signEdit(deviceB,finalPlan));
  assert.equal((await accountCall('grants',[deviceB.address]))[5],1n);
  const final=(await sdk.readFile({file:seed.file,principals:[ownerPrincipal],context:await sdk.pin()})).value.revision;
  assert.equal(final.recordId,finalPlan.newRevision);
  assert.equal(final.publicationContext.principalId,ownerPrincipal);
  assert.equal(final.publicationContext.principalKind,'1');
  assert.equal(final.publicationContext.authorizationProfile,'1','Core retains native EOA call, not child signer');
  assert.equal((await sdk.readFile({file:seed.file,authors,context:await sdk.pin()})).value.revision.recordId,finalPlan.newRevision,
    'address convenience Lens still groups the delegated EOA');
  assert.equal((await env.call('ledger','principalOf',[owner.address]))[0],ownerPrincipal);
  for(const [id,parent] of [[aPlan.newRevision,seed.newRevision],[bPlan.newRevision,aPlan.newRevision],
    [finalPlan.newRevision,bPlan.newRevision]]){
    const [type,first,,body]=await env.call('ledger','record',[id]);
    assert.equal(type,manifest.types.child);
    assert(first>0n);
    assert.equal(e.dataSlice(body,0,32),parent,'each successor retains its parent');
    assert.equal(e.dataSlice(body,32,64),seed.file);
  }
  assert((await env.call('ledger','record',[seed.newRevision]))[1]>0n,'original EOA record remains');
  const retainedOriginal=(await env.call('ledger','publicationContext',[original.publication]))[0];
  assert.equal(retainedOriginal.principalId,ownerPrincipal,'original publication attribution remains');
  const rows=[install,wrongFileReceipt,aReceipt,replayReceipt,bReceipt,revoke,staleReceipt,finalReceipt];
  const receiptRow=r=>({label:r.label,payer:r.signer,status:r.status,gasUsed:r.gasUsed,
    gasPriceWei:r.effectiveGasPriceWei,transaction:r.transactionHash});
  const setup=env.transactions.filter(r=>r.label==='deploy/scopedDelegate'||r.label.startsWith('seed/'));
  await env.writeReport('two-device-author',{status:'PASS',hardfork:'prague',realAuthorizationList:true,
    owner:owner.address,principal:ownerPrincipal,file:seed.file,deviceKeys:[deviceA.address,deviceB.address],
    scope:'one File HEAD; child revision PUBLISH plus matching HEAD BIND; one hour; at most three edits per device',
    counters,setupTransactions:setup.map(receiptRow),workflowTransactions:rows.map(receiptRow),
    caveat:'No wallet UI was driven; cryptographic signature operations are counted, observed UI prompts are unknown. Ledger records native EOA authority, not the child key.'});
});
