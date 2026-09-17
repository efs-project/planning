import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createGuardedCompactSdk} from './compact-sdk-v2.mjs';
import {createCompactSdk} from './compact-sdk.mjs';

const clone=value=>JSON.parse(JSON.stringify(value));
const plain=value=>JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v));
function client(env,journal,options={}) {
  const {ethers:e,wallets,manifest,rpc}=env;
  const sdk=createGuardedCompactSdk({ethers:e,manifest,rpc,journal,...options});
  const authors=[wallets.bob.address,wallets.alice.address];
  const prepare=(operation,args={},who='alice')=>sdk.prepare({operation,author:wallets[who].address,authors,...args});
  const authorize=(plan,who='alice')=>sdk.authorize(plan,d=>wallets[who].signingKey.sign(d).serialized);
  const run=async(operation,args={},who='alice',payer=who)=>{
    const plan=await prepare(operation,args,who),signed=await authorize(plan,who);
    await sdk.submit(signed,tx=>env.send(operation,tx,payer));
    const outcome=await sdk.reconcile(plan.id);assert.equal(outcome.status,'EFFECTS_VERIFIED',operation);
    assert.equal(outcome.receiptAttribution,'RPC_MATCHED_DIRECT_PLAN');return plan;
  };
  return {sdk,authors,prepare,authorize,run};
}

test('guarded initial-context failure retains only independently refreshed receipt evidence', {timeout:120_000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy'});t.after(()=>env.close());
  const {ethers:e,manifest,rpc}=env,journal=await env.createJournal('recovery-context');
  const originalClient=client(env,journal),seed=await originalClient.run('create',{name:'recovery.txt',salt:e.id('recovery-context'),document:'retained'});
  const original=await journal.get(seed.id),freshReceipt=await rpc('eth_getTransactionReceipt',[original.transactionHash]);
  const exercise=async(failure,receiptMode)=>{
    const cache=clone(original),writes=[],methods=[];
    cache.receipt={...cache.receipt,gasUsed:'0xdeadbeef'};cache.receiptObservation=cache.receipt;
    cache.receiptAttribution='RPC_MATCHED_DIRECT_PLAN';
    const sdk=createGuardedCompactSdk({ethers:e,manifest,
      journal:{get:async()=>clone(cache),put:async entry=>writes.push(clone(entry))},
      rpc:async(method,params)=>{
        methods.push(method);
        if(method==='eth_getTransactionReceipt') {
          if(receiptMode==='missing')return null;
          if(receiptMode==='offline')throw Error('receipt endpoint unavailable');
        }
        if(failure==='unavailable'&&method==='eth_call')throw Error('initial EFS reads unavailable');
        if(failure==='missing-block'&&method==='eth_getBlockByNumber'&&params[0]==='latest')return null;
        return rpc(method,params);
      }});
    const result=await sdk.reconcile(seed.id);
    assert.equal(result.status,failure==='unsupported'?'UNSUPPORTED':'UNKNOWN');
    assert.equal(result.knowledge,'UNKNOWN');assert.equal(result.coverage,'PARTIAL');assert.equal(result.evidence,null);
    assert.equal(result.basis,null,'a failed initial pin has no current semantic basis');
    assert.equal(methods.filter(method=>method==='eth_getTransactionReceipt').length,1,'receipt requested despite initial EFS pin failure');
    assert.equal(writes.length,1);assert.equal(writes[0].status,result.status);
    if(receiptMode==='available') {
      assert.equal(result.receiptAttribution,'RPC_MATCHED_DIRECT_PLAN');
      assert.deepEqual(result.receipt,freshReceipt);assert.deepEqual(result.receiptObservation,freshReceipt);
      assert(methods.includes('eth_getTransactionByHash'));assert(methods.includes('eth_getBlockByNumber'));
    }else {
      assert.equal(result.receiptAttribution,receiptMode==='missing'?'UNAVAILABLE':'UNKNOWN');
      assert.equal(result.receipt,null);assert.equal(result.receiptObservation,null);
    }
  };
  for(const failure of ['unavailable','missing-block'])for(const receiptMode of ['available','missing','offline']) {
    await t.test(`${failure}/${receiptMode}`,()=>exercise(failure,receiptMode));
  }
  // Real compatible activation outside the reviewed implementation allowlist:
  // retained authorization stays reviewed while the new current EFS pin fails.
  const unreviewed=await env.deploy('unreviewed','Ledger.sol','Ledger',[manifest.contracts.registry.address,manifest.executionFamily.realmId]);
  await env.transact('proxy','upgradeTo',[unreviewed],'unreviewed-activation');
  for(const receiptMode of ['available','missing','offline'])await t.test(`unsupported/${receiptMode}`,()=>exercise('unsupported',receiptMode));
});

test('guarded malformed local envelope bytes shapes and ranges reject before RPC or journal mutation', {timeout:120_000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy'});t.after(()=>env.close());
  const {ethers:e,manifest}=env,journal=await env.createJournal('recovery-local');
  const {run}=client(env,journal),seed=await run('create',{name:'local-codec.txt',salt:e.id('local-codec'),document:'retained'});
  const original=await journal.get(seed.id),published=original.plan.actions.findIndex(action=>action.kind===1);
  for(const [label,mutate] of [
    ['body malformed hex',entry=>entry.plan.bodies[published]='0xgg'],
    ['body odd hex',entry=>entry.plan.bodies[published]='0x0'],
    ['body wrong type',entry=>entry.plan.bodies[published]={hex:'0x00'}],
    ['signature malformed hex',entry=>entry.signature='0xgg'],
    ['calldata malformed hex',entry=>entry.transaction.data='0xgg'],
    ['action shape',entry=>delete entry.plan.actions[0].typeId],
    ['action array shape',entry=>entry.plan.actions={}],
    ['action uint32 underflow',entry=>entry.plan.actions[0].expectedRevision=-1],
    ['action uint32 overflow',entry=>entry.plan.actions[0].expectedRevision=4294967296],
    ['intent uint64 overflow',entry=>entry.plan.intent.nonce='18446744073709551616'],
    ['intent shape',entry=>delete entry.plan.intent.executionSet],
    ['read-set array shape',entry=>entry.plan.readSet.principalIds={}],
    ['read-set bytes32 shape',entry=>entry.plan.readSet.expectedHeads[0]='0x00'],
    ['value quantity shape',entry=>entry.transaction.value='not-a-quantity'],
  ])await t.test(label,async()=>{
    const corrupt=clone(original);mutate(corrupt);let requests=0,writes=0;
    const sdk=createGuardedCompactSdk({ethers:e,manifest,
      journal:{get:async()=>clone(corrupt),put:async()=>{++writes;}},
      rpc:async()=>{++requests;throw Error('local validation must not reach RPC');}});
    await assert.rejects(sdk.reconcile(seed.id));
    assert.equal(requests,0);assert.equal(writes,0,'local integrity errors cannot become persisted UNKNOWN');
  });
});

test('guarded environment deploys a reviewed proxy family without changing legacy defaults', {timeout:120_000}, async t => {
  const env = await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy'}); t.after(()=>env.close());
  assert.equal(env.manifest.protocol,'compact-guarded-v2');
  assert.notEqual(env.contracts.ledger.address,env.contracts.implementationV1.address);
  assert.equal(env.manifest.executionFamily.implementations.length,2);
  assert.throws(()=>createCompactSdk({ethers:env.ethers,manifest:env.manifest,rpc:env.rpc}),/PROTOCOL/);
  const sdk=createGuardedCompactSdk({ethers:env.ethers,manifest:env.manifest,rpc:env.rpc});
  const context=await sdk.pin();
  assert.equal(context.executionSet,(await env.call('ledger','executionSet'))[0]);
  assert.equal(context.origin,env.manifest.executionFamily.origin);
  assert(Object.isFrozen(context.execution));
  await assert.rejects(env.enqueue('over-budget',{to:env.wallets.alice.address,data:'0x',gasLimit:16_777_217n}),/transaction gasLimit/);
});

test('mined independent-author competition is rejected after preflight, in both transaction orders', {timeout:120_000}, async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy'});t.after(()=>env.close());
  const {ethers:e,manifest,wallets,rpc}=env,journal=await env.createJournal('ordering');
  const {sdk,prepare,authorize,run}=client(env,journal),iface=new e.Interface(manifest.contracts.ledger.abi),Z=e.ZeroHash;
  const coder=e.AbiCoder.defaultAbiCoder(),hash=(types,values)=>e.keccak256(coder.encode(types,values));
  const empty={principalIds:[],positions:[],expectedHeads:[]},results=[];
  for(const scenario of ['source-edit','higher-absent-live','higher-mask','included-lower','destination-replace','destination-mask','policy','unrelated']) {
    if(process.env.EFS_GUARDED_CASE&&process.env.EFS_GUARDED_CASE!==scenario)continue;
    for(const competitorFirst of [true,false]) {
      await t.test(`${scenario}/${competitorFirst?'competitor-first':'victim-first'}`,async()=>{
        const label=`${scenario}-${competitorFirst}`,name=`${label}.txt`;
        const seed=await run('create',{name,salt:e.id(label),document:'seed'});
        if(scenario==='source-edit')await run('edit',{file:seed.file,document:'selected Bob'},'bob');
        let victim,competitor,competitorTx;
        if(scenario.startsWith('destination')) {
          victim=await prepare('move',{file:seed.file,fromName:name,toFolder:manifest.folders[1],name});
          competitor=await prepare('restorePlacement',{file:seed.file,name,folder:manifest.folders[1]},'bob');
        } else if(scenario==='policy') {
          victim=await prepare('addTag',{file:seed.file,scope:'file',concept:e.id('approved')});
          competitorTx={to:manifest.contracts.registry.address,data:new e.Interface(manifest.contracts.registry.abi).encodeFunctionData('activate',[manifest.types.root,e.ZeroAddress])};
        } else {
          victim=await prepare('edit',{file:seed.file,document:`victim-${label}`,
            ...(scenario==='included-lower'?{authors:[wallets.alice.address,wallets.bob.address]}:{})});
          competitor=await prepare(scenario==='unrelated'?'addTag':'edit',{file:seed.file,scope:'file',concept:e.id(label),document:'competitor'},'bob');
        }
        if(scenario==='higher-mask'||scenario==='destination-mask') {
          const selectedBind=competitor.actions.find(a=>a.kind===3);
          const bind={...selectedBind,target:scenario==='higher-mask'?seed.newRevision:selectedBind.target};
          competitor={...competitor,actions:[bind,{...bind,kind:4,target:Z,expectedRevision:bind.expectedRevision+1}],bodies:['0x','0x']};
        }
        if(competitor)competitorTx={to:manifest.contracts.ledger.address,data:iface.encodeFunctionData('executeGuarded',
          [competitor.actions,competitor.bodies,competitor.intent.nonce,competitor.intent.executionSet,empty])};
        await rpc('eth_call',[{...competitorTx,from:wallets[scenario==='policy'?'deployer':'bob'].address},'latest']);
        const signed=await authorize(victim),countsBefore=await env.call('ledger','counts');
        const victimKeys=victim.startingHeads.map(h=>h.key);
        const indexKeys=[hash(['bytes32','bytes32','uint256','uint256','bytes32'],[e.id('efs2/pk/1'),Z,4,0,e.zeroPadValue(wallets.alice.address,32)]),
          ...victimKeys.map(key=>hash(['bytes32','bytes32','uint256','uint256','bytes32'],[e.id('efs2/pk/1'),Z,8,0,key]))];
        const snapshot=async()=>plain({nonce:await env.call('ledger','nonces',[wallets.alice.address]),
          publication:await env.call('ledger','publicationOf',[victim.publicationId]),
          heads:await Promise.all(victimKeys.map(k=>env.call('ledger','head',[k]))),
          records:await Promise.all(victim.actions.filter(a=>a.kind===1).map(a=>env.call('ledger','record',[
            hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),a.typeId,a.bodyHashOrRecordId])]))),
          index:await Promise.all(indexKeys.map(k=>env.call('index','postingHead',[k]))),
          app:await env.call('application','adoptionCount')});
        const before=await snapshot();
        assert(BigInt(before.index[0][0])>0n,'rollback probe must address a populated author posting');
        let newRecords=0,newBindings=0;const seenRecords=new Set(),seenBindings=new Set();
        if(competitor)for(const a of competitor.actions) {
          if(a.kind===1){const id=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),a.typeId,a.bodyHashOrRecordId]);
            if(!seenRecords.has(id)&&(await env.call('ledger','record',[id]))[1]===0n)++newRecords;seenRecords.add(id);}
          if(a.kind===3||a.kind===4){const position=hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),a.purpose,a.subject,a.role]);
            const key=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),e.zeroPadValue(wallets.bob.address,32),position]);
            if(!seenBindings.has(key)&&(await env.call('ledger','head',[key]))[1]===0n)++newBindings;seenBindings.add(key);}
        }
        let victimHash,competitorHash;
        try {
          await sdk.submit(signed,async tx=>{
            // A mutation here is later than every SDK context/CAS/selection and
            // exact signed eth_call preflight check.
            await rpc('anvil_setAutomine',[false]);
            const victimNonce=Number(BigInt(await rpc('eth_getTransactionCount',[wallets.alice.address,'pending'])));
            const who=scenario==='policy'?'deployer':'bob';
            const competitorNonce=Number(BigInt(await rpc('eth_getTransactionCount',[wallets[who].address,'pending'])));
            const enqueueVictim=async()=>victimHash=await env.enqueue(`order/${label}/victim`,{...tx,nonce:victimNonce},'alice');
            const enqueueCompetitor=async()=>competitorHash=await env.enqueue(`order/${label}/competitor`,{...competitorTx,nonce:competitorNonce},who);
            if(competitorFirst){await enqueueCompetitor();await enqueueVictim();}else{await enqueueVictim();await enqueueCompetitor();}
            return victimHash;
          });
          await rpc('evm_mine');
        }finally{await rpc('anvil_setAutomine',[true]);}
        const v=await env.observe(victimHash),c=await env.observe(competitorHash);
        assert.equal(v.receipt.blockHash,c.receipt.blockHash);assert.equal(Number(BigInt(v.receipt.transactionIndex)),competitorFirst?1:0);
        assert.equal(c.status,'SUCCESS');const rejected=competitorFirst&&scenario!=='unrelated';
        assert.equal(v.status,rejected?'REVERTED':'SUCCESS');
        const outcome=await sdk.reconcile(victim.id);assert.equal(outcome.status,rejected?'REVERTED':'EFFECTS_VERIFIED');
        if(rejected){
          assert.deepEqual(await snapshot(),before,'reject rolls back nonce/publication/records/bytes/heads/history postings/application');
          assert.deepEqual(Array.from(await env.call('ledger','counts')),countsBefore.map((v,i)=>v+BigInt([
            competitor?.actions.length??0,newRecords,newBindings,competitor?1:0][i])),'no hidden rejected admission/record/binding/publication');
          if(competitor)assert.equal((await env.call('ledger','nonces',[wallets.bob.address]))[0],BigInt(competitor.intent.nonce)+1n);
          assert.equal((await env.call('index','lastProcessed'))[0],(await env.call('ledger','counts'))[0]);
        }
        results.push({scenario,competitorFirst,victim:v,competitor:c,effectStatus:outcome.status,rollbackChecked:rejected});
      });
    }
  }
  await env.writeReport('guarded-ordering',{status:results.length===(process.env.EFS_GUARDED_CASE?2:16)?'PASS':'FAIL',results,rpc:env.metrics});
});

test('guarded Files engine binds complete positions and independently verifies untrusted recovery envelopes', {timeout:120_000}, async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy'});t.after(()=>env.close());
  const {ethers:e,wallets,manifest,rpc}=env,journal=await env.createJournal('guards');
  const {sdk,authors,prepare,authorize,run}=client(env,journal),Z=e.ZeroHash,iface=new e.Interface(manifest.contracts.ledger.abi);
  assert.throws(()=>createGuardedCompactSdk({ethers:e,manifest:{...manifest,protocol:undefined},rpc}),/PROTOCOL/);
  await assert.rejects(sdk.prepare({operation:'create',author:wallets.alice.address,name:'x',salt:e.id('x'),document:'x'}),/EXPLICIT_LENS/);
  const a=await run('create',{name:'guarded.txt',salt:e.id('guarded-file'),document:'First'},'alice','deployer');
  const relayed=await journal.get(a.id),relayTx=await rpc('eth_getTransactionByHash',[relayed.transactionHash]);
  assert.equal(relayTx.from.toLowerCase(),wallets.deployer.address.toLowerCase());
  assert.equal(relayed.receiptAttribution,'RPC_MATCHED_DIRECT_PLAN');
  assert.equal((await env.call('ledger','evidence',[relayed.evidence.publication]))[0],wallets.alice.address);
  assert.equal((await env.call('ledger','publicationContext',[relayed.evidence.publication]))[0].principalId,e.zeroPadValue(wallets.alice.address,32));
  assert.equal(a.readSet.positions.length,1);assert.equal(a.readSet.principalIds.length,2);
  assert.deepEqual(a.snapshots.map(s=>s.state),[0,0]);assert.equal(a.guards[0].expectation,'empty');
  const b=await run('edit',{file:a.file,document:'Bob'},'bob');
  const edit=await prepare('edit',{file:a.file,document:'Alice',authors:[wallets.bob.address]});
  assert.equal(edit.readSet.principalIds.length,1);assert.equal(edit.startingHeads.length,1,'writer CAS outside Lens retained separately');
  assert.equal(edit.readSet.principalIds[0],e.zeroPadValue(wallets.bob.address,32));
  assert.equal(edit.snapshots[0].target,b.newRevision);
  const signed=await authorize(edit),decoded=iface.parseTransaction(signed.transaction);
  assert.equal(decoded.name,'executeGuardedSigned');
  assert.deepEqual(Array.from(decoded.args[3].principalIds),edit.readSet.principalIds);
  assert.deepEqual(Array.from(decoded.args[3].expectedHeads),edit.readSet.expectedHeads);
  assert.equal(decoded.args[0].readSetHash,(await env.call('ledger','readSetHash',[decoded.args[3]]))[0]);
  assert.equal((await env.call('ledger','headSnapshot',[edit.readSet.principalIds[0],edit.readSet.positions[0]]))[0],edit.readSet.expectedHeads[0]);
  assert(Object.isFrozen(signed.plan.readSet.expectedHeads));
  const foreign=client(env,journal).sdk;
  await assert.rejects(foreign.readFile({file:a.file,authors,context:await sdk.pin()}),/CONTEXT/);
  await assert.rejects(foreign.authorize(edit,()=>{throw Error('must not sign');}),/PLAN/);
  assert.throws(()=>foreign.submit(signed,()=>{throw Error('must not send');}),/SIGNED_PLAN/);
  let sent=0;
  const lost=await sdk.submit(signed,async tx=>{++sent;await env.send('response-loss',tx,'alice');throw Error('lost send response');});
  assert.equal(lost.status,'BROADCAST_UNKNOWN');
  assert.equal((await foreign.reconcile(edit.id)).status,'EFFECTS_VERIFIED');
  await sdk.submit(signed,()=>{++sent;throw Error('duplicate send');});assert.equal(sent,1);
  const original=await journal.get(edit.id);
  for(const [label,mutate] of [
    ['guard value',x=>x.plan.readSet.expectedHeads[0]=Z],
    ['omitted author',x=>x.plan.readSet.principalIds=[]],
    ['duplicate author',x=>x.plan.readSet.principalIds.push(x.plan.readSet.principalIds[0])],
    ['read-set cap',x=>x.plan.readSet.positions=Array.from({length:5},(_,i)=>e.id(`p${i}`))],
    ['digest',x=>x.plan.digest=e.id('other digest')],['body',x=>x.plan.bodies[0]='0x00'],
    ['calldata',x=>x.transaction.data+='00'],['value',x=>x.transaction.value='0x1'],
    ['destination',x=>x.transaction.to=wallets.bob.address],['publication',x=>x.plan.publicationId=Z],
    ['execution revision',x=>x.plan.authorizationContext.execution.revision='999'],
  ]) {
    const tampered=clone(original);mutate(tampered);await journal.put(tampered);
    await assert.rejects(foreign.reconcile(edit.id),/COMPACT_/,label);
  }
  const metadata=clone(original);metadata.plan.file=e.id('untrusted file');metadata.plan.expectedHeads=[];
  metadata.plan.operation='not-authority';await journal.put(metadata);
  assert.equal((await foreign.reconcile(edit.id)).status,'EFFECTS_VERIFIED','effects come only from signed actions');
  await journal.put(original);
  for(const unavailable of ['readSetBytes','historyStatePrincipalAt']) {
    const missing=client(env,journal,{rpc:async(method,params)=>{
      if(method==='eth_call'&&params[0].to.toLowerCase()===(unavailable==='readSetBytes'?manifest.contracts.ledger.address:manifest.contracts.lens.address).toLowerCase()) {
        const api=new e.Interface(manifest.contracts[unavailable==='readSetBytes'?'ledger':'lens'].abi);
        if(api.parseTransaction(params[0])?.name===unavailable)return api.encodeFunctionResult(unavailable,unavailable==='readSetBytes'?['0x']:[0,0,Z,0,0]);
      }
      return rpc(method,params);
    }}).sdk;
    assert.equal((await missing.reconcile(edit.id)).status,'UNKNOWN',unavailable);await journal.put(original);
  }
  const seedOriginal=await journal.get(a.id);
  const receiptUnavailable=client(env,journal,{rpc:async(method,params)=>{
    if(method==='eth_getTransactionReceipt')return null;
    if(method==='eth_call'&&params[0].to.toLowerCase()===manifest.contracts.ledger.address.toLowerCase()
      &&iface.parseTransaction(params[0])?.name==='readSetBytes')return iface.encodeFunctionResult('readSetBytes',['0x']);
    return rpc(method,params);
  }}).sdk;
  const unavailable=await receiptUnavailable.reconcile(a.id);
  assert.equal(unavailable.status,'UNKNOWN');assert.equal(unavailable.receiptAttribution,'UNAVAILABLE','untrusted prior receipt attribution cannot survive an unavailable fresh observation');
  await journal.put(seedOriginal);
  const moved=await prepare('move',{file:a.file,fromName:'guarded.txt',name:'guarded.txt',toFolder:manifest.folders[1]});
  assert.deepEqual(moved.guards.map(d=>d.meaning),['source','destination']);assert.equal(moved.readSet.positions.length,2);
  const renamed=await prepare('rename',{file:a.file,fromName:'guarded.txt',name:'new.txt'});
  assert.equal(renamed.readSet.positions.length,2);
  const removed=await prepare('remove',{file:a.file,name:'guarded.txt'});assert.equal(removed.guards[0].meaning,'source');
  const restored=await prepare('restorePlacement',{file:a.file,name:'guarded.txt'});assert.equal(restored.guards[0].expectation,'replace-selected');
  const contents=await prepare('restoreContents',{file:a.file,record:a.newRevision});assert.equal(contents.guards[0].meaning,'selected-head');
  for(const operation of ['addTag','removeTag'])for(const scope of ['file','revision']) {
    const tag=await prepare(operation,{file:a.file,scope,concept:e.id('approved')});
    assert.equal(tag.readSet.positions.length,scope==='file'?0:1);
    assert.equal(tag.readSet.principalIds.length,scope==='file'?0:2);
  }
  const tooMany=Array.from({length:65},(_,i)=>e.id(`principal-${i}`));
  await assert.rejects(prepare('restorePlacement',{file:a.file,name:'guarded.txt',authors:undefined,principals:tooMany}),/READSET_SHAPE/);
  let attempted=0;
  const failingJournal=client(env,{get:async()=>null,put:async()=>{throw Error('durability failed');}});
  const unsaved=await failingJournal.prepare('edit',{file:a.file,document:'must not broadcast'});
  await assert.rejects(failingJournal.sdk.submit(await failingJournal.authorize(unsaved),()=>{++attempted;}),/durability failed/);
  assert.equal(attempted,0,'signed inputs are durable before calling the host send boundary');
  const editedGuards=clone(original),readType=iface.getFunction('readSetHash').inputs[0],coder=e.AbiCoder.defaultAbiCoder();
  editedGuards.plan.readSet.expectedHeads[0]=Z;
  editedGuards.plan.intent.readSetHash=e.keccak256(coder.encode(['bytes32',readType],[e.id('efs.lab.read-set/2:ordered-first-binding'),editedGuards.plan.readSet]));
  editedGuards.transaction.data=iface.encodeFunctionData('executeGuardedSigned',[editedGuards.plan.intent,editedGuards.plan.actions,editedGuards.plan.bodies,editedGuards.plan.readSet,editedGuards.signature]);
  await journal.put(editedGuards);await assert.rejects(foreign.reconcile(edit.id),/JOURNAL_DIGEST/);await journal.put(original);
  const ctx=await sdk.pin(),page=await sdk.listFolder({authors,context:ctx,budget:1});
  if(page.continuation)await assert.rejects(foreign.listFolder({authors,context:await foreign.pin(),continuation:page.continuation}),/CONTINUATION/);
  const point=await sdk.readFile({file:a.file,principals:[e.zeroPadValue(wallets.bob.address,32)],context:ctx});
  assert.equal(point.value.revision.recordId,b.newRevision);
  assert.equal(point.value.revision.publicationContext.executionSet,b.intent.executionSet,'publication execution is distinct from the read basis');
  assert.equal((await sdk.readFile({file:a.file,authors,context:ctx,policy:'no-tiebreak'})).knowledge,'CONFLICT');
  const missingContext=client(env,journal,{rpc:async(method,params)=>{
    if(method==='eth_call'&&params[0].to.toLowerCase()===manifest.contracts.ledger.address.toLowerCase()
      &&iface.parseTransaction(params[0])?.name==='publicationContext')return iface.encodeFunctionResult('publicationContext',[[Z,Z,Z,Z,0,0,0]]);
    return rpc(method,params);
  }}).sdk;
  assert.equal((await missingContext.readFile({file:a.file,authors,context:await missingContext.pin()})).knowledge,'UNKNOWN','unavailable publication context is not invalid document bytes');
  await env.writeReport('guarded-engine',{status:'PASS',transactions:env.transactions,rpc:env.metrics,readSet:edit.readSet});
});

test('populated proxy upgrades preserve native application identity and fresh historical reconstruction across same-block schedules', {timeout:120_000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy'});t.after(()=>env.close());
  const {ethers:e,manifest,wallets,rpc}=env,journal=await env.createJournal('upgrades');
  const {sdk,prepare,authorize,run,authors}=client(env,journal),Z=e.ZeroHash,empty={principalIds:[],positions:[],expectedHeads:[]};
  const iface=new e.Interface(manifest.contracts.ledger.abi),proxy=new e.Interface(env.contracts.proxy.abi),schedules=[];
  const seed=await run('create',{name:'upgrade.txt',salt:e.id('upgrade-file'),document:'V1 bytes'});
  const edited=await run('edit',{file:seed.file,document:'V1 child'});
  await run('addTag',{file:seed.file,scope:'file',concept:e.id('approved')});
  await run('addTag',{file:seed.file,scope:'revision',concept:e.id('approved')});
  const adopt=async revision=>{
    const c=await sdk.pin();
    await env.transact('application','adoptApprovedRevisionGuarded',[seed.file,edited.newRevision,revision,
      [c.admission,c.generation,c.epoch,c.executionSet]],`application/guarded-${revision}`,'alice');
    const p=await sdk.readFile({file:seed.file,authors:[env.contracts.application.address],context:await sdk.pin()});
    assert.equal(p.knowledge,'PRESENT');return p;
  };
  const appBefore=await adopt(0);
  assert.equal(appBefore.value.revision.publicationContext.principalKind,'2');
  assert.equal(appBefore.value.revision.publicationContext.authorizationProfile,'1');
  await run('remove',{file:seed.file,name:'upgrade.txt'});
  const stale=await prepare('edit',{file:seed.file,document:'stale V1'}),staleSigned=await authorize(stale);
  const before={counts:plain(await env.call('ledger','counts')),context:plain(await env.call('ledger','publicationContext',[
    (await env.call('ledger','publicationOf',[seed.publicationId]))[0]])),origin:(await env.call('ledger','realmOrigin'))[0]};
  await env.transact('proxy','upgradeTo',[env.contracts.implementationV2.address],'upgrade/V1-to-V2');
  assert.deepEqual(plain(await env.call('ledger','counts')),before.counts);
  assert.equal((await env.call('ledger','realmOrigin'))[0],before.origin);
  assert.deepEqual(plain(await env.call('ledger','publicationContext',[(await env.call('ledger','publicationOf',[seed.publicationId]))[0]])),before.context);
  const appAfter=await adopt(1);
  assert.equal(appAfter.value.selection.author,appBefore.value.selection.author,'same contract principal after implementation activation');
  const c=await sdk.pin(),explicit=await env.call('files','readFilePointPrincipals',[seed.file,[e.zeroPadValue(wallets.alice.address,32)],e.id('approved'),
    [c.admission,c.generation,c.epoch,c.executionSet]]);
  assert.equal(explicit[0].status,1n,'same native Files consumer returns the selected file');
  assert.equal(explicit[0].revision.recordId,edited.newRevision);
  assert(explicit[0].fileTag.present&&explicit[0].revisionTag.present);
  const current=await sdk.readFile({file:seed.file,authors,concept:e.id('approved'),context:c});
  assert.equal(e.toUtf8String(current.value.revision.document),'V1 child');assert(current.value.fileTag.present&&current.value.revisionTag.present);
  assert.equal((await sdk.listFolder({authors,context:c})).knowledge,'ABSENT','mask survives activation');
  const unknownManifest=clone(manifest);unknownManifest.executionFamily.implementations=unknownManifest.executionFamily.implementations.slice(0,1);
  await assert.rejects(client(env,journal,{manifest:unknownManifest}).sdk.pin(),/EXECUTION_UNSUPPORTED/);
  await assert.rejects(sdk.submit(staleSigned,()=>{throw Error('no stale send');}),/EXECUTION_DRIFT/);
  const oldFirst=await env.enqueue('upgrade/stale-V1',{...staleSigned.transaction},'alice');assert.equal((await env.observe(oldFirst)).status,'REVERTED');
  await env.transact('proxy','upgradeTo',[env.contracts.implementationV1.address],'upgrade/rollback-to-V1');
  assert.notEqual((await sdk.pin()).executionSet,stale.intent.executionSet,'A-to-B-to-A increments execution identity');
  const oldAgain=await env.enqueue('upgrade/stale-after-rollback',staleSigned.transaction,'alice');assert.equal((await env.observe(oldAgain)).status,'REVERTED');
  const historyOnlyRpc=async(method,params)=>{
    if(method==='eth_call'&&params[0].to.toLowerCase()===manifest.contracts.ledger.address.toLowerCase()) {
      const fn=iface.parseTransaction(params[0])?.name;
      assert(!['intentDigest','guardedIntentDigest','principalOf'].includes(fn),'recovery never invokes current authorization/identity semantics');
    }
    return rpc(method,params);
  };
  const cold=()=>client(env,journal,{rpc:historyOnlyRpc}).sdk;
  assert.equal((await cold().reconcile(seed.id)).status,'EFFECTS_VERIFIED');
  for(const publicationFirst of [true,false]) {
    const plan=await prepare('edit',{file:seed.file,document:`same block ${publicationFirst}`}),signed=await authorize(plan);
    const next=(await env.call('proxy','implementation'))[0]===env.contracts.implementationV1.address?env.contracts.implementationV2.address:env.contracts.implementationV1.address;
    let publicationHash,upgradeHash;
    try{
      await sdk.submit(signed,async tx=>{
        await rpc('anvil_setAutomine',[false]);
        const an=Number(BigInt(await rpc('eth_getTransactionCount',[wallets.alice.address,'pending']))),dn=Number(BigInt(await rpc('eth_getTransactionCount',[wallets.deployer.address,'pending'])));
        const publication=async()=>publicationHash=await env.enqueue('same-block/publication',{...tx,nonce:an},'alice');
        const upgrade=async()=>upgradeHash=await env.enqueue('same-block/upgrade',{to:env.contracts.proxy.address,data:proxy.encodeFunctionData('upgradeTo',[next]),nonce:dn});
        if(publicationFirst){await publication();await upgrade();}else{await upgrade();await publication();}
        return publicationHash;
      });await rpc('evm_mine');
    }finally{await rpc('anvil_setAutomine',[true]);}
    const p=await env.observe(publicationHash),u=await env.observe(upgradeHash);
    assert.equal(p.receipt.blockHash,u.receipt.blockHash);assert.equal(Number(BigInt(p.receipt.transactionIndex)),publicationFirst?0:1);
    assert.equal(u.status,'SUCCESS');assert.equal(p.status,publicationFirst?'SUCCESS':'REVERTED');
    const outcome=await cold().reconcile(plan.id);assert.equal(outcome.status,publicationFirst?'EFFECTS_VERIFIED':'REVERTED');
    if(publicationFirst){assert.notEqual(outcome.basis.executionSet,plan.intent.executionSet);
      const retained=(await env.call('ledger','publicationContext',[outcome.evidence.publication]))[0];assert.equal(retained.executionSet,plan.intent.executionSet);}
    schedules.push({publicationFirst,publication:p,upgrade:u,status:outcome.status});
  }
  const plan=await prepare('edit',{file:seed.file,document:'first of two'}),signed=await authorize(plan);
  const firstHead=plan.actions.find(a=>a.kind===3),second={...firstHead,target:seed.newRevision,expectedRevision:firstHead.expectedRevision+1};
  let firstHash,secondHash;
  try {
    await sdk.submit(signed,async tx=>{
      await rpc('anvil_setAutomine',[false]);const nonce=Number(BigInt(await rpc('eth_getTransactionCount',[wallets.alice.address,'pending'])));
      firstHash=await env.enqueue('same-block/head-first',{...tx,nonce},'alice');
      secondHash=await env.enqueue('same-block/head-second',{to:tx.to,nonce:nonce+1,data:iface.encodeFunctionData('executeGuarded',
        [[second],['0x'],BigInt(plan.intent.nonce)+1n,plan.intent.executionSet,empty])},'alice');return firstHash;
    });await rpc('evm_mine');
  }finally{await rpc('anvil_setAutomine',[true]);}
  const f=await env.observe(firstHash),s=await env.observe(secondHash);assert.equal(f.status,'SUCCESS');assert.equal(s.status,'SUCCESS');
  assert.equal(f.receipt.blockHash,s.receipt.blockHash);assert.equal(f.receipt.transactionIndex,'0x0');assert.equal(s.receipt.transactionIndex,'0x1');
  const outcome=await cold().reconcile(plan.id);assert.equal(outcome.status,'EFFECTS_VERIFIED');assert.equal(outcome.evidence.supersededAtPublicationBlock,true);
  await env.writeReport('guarded-upgrades',{status:'PASS',schedules,supersession:{first:f,second:s,outcome},transactions:env.transactions,rpc:env.metrics});
});

test('real Prague type-4 install change clear and reverted native delegation preserve the key principal', {timeout:120_000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',hardfork:'prague'});t.after(()=>env.close());
  const {ethers:e,manifest,wallets,rpc}=env,journal=await env.createJournal('prague'),wallet=wallets.alice;
  const {sdk,prepare,authorize,run,authors}=client(env,journal),Z=e.ZeroHash,empty={principalIds:[],positions:[],expectedHeads:[]};
  const delegateA=await env.deploy('delegateA','GuardedDelegate.sol','GuardedDelegate');
  const delegateB=await env.deploy('delegateB','GuardedDelegate.sol','GuardedDelegate');
  const delegate=new e.Interface(env.contracts.delegateA.abi),type4=[];
  const nativeData=plan=>delegate.encodeFunctionData('run',[manifest.contracts.ledger.address,plan.actions,plan.bodies,plan.intent.nonce,plan.intent.executionSet,plan.readSet]);
  const transact4=async(label,target,data='0x')=>{
    const nonce=Number(BigInt(await rpc('eth_getTransactionCount',[wallet.address,'pending'])));
    const authorization=await wallet.authorize({address:target,chainId:31337n,nonce:nonce+1});
    const hash=await env.enqueue(label,{type:4,to:wallet.address,nonce,data,gasLimit:15_000_000n,authorizationList:[authorization]},'alice');
    const row=await env.observe(hash),decoded=e.Transaction.from(row.rawTransaction);
    assert.equal(decoded.type,4);assert.equal(decoded.authorizationList.length,1);
    assert.equal(decoded.authorizationList[0].nonce,BigInt(nonce+1));assert.equal(decoded.authorizationList[0].chainId,31337n);
    assert.equal(decoded.authorizationList[0].address.toLowerCase(),target.toLowerCase());
    assert.equal(e.verifyAuthorization(decoded.authorizationList[0],decoded.authorizationList[0].signature).toLowerCase(),wallet.address.toLowerCase());
    assert.equal(row.receipt.type,'0x4');assert.equal(await rpc('eth_getTransactionCount',[wallet.address,'latest']),e.toQuantity(nonce+2));
    const marker=await rpc('eth_getCode',[wallet.address,'latest']);
    assert.equal(marker.toLowerCase(),target===e.ZeroAddress?'0x':`0xef0100${target.slice(2).toLowerCase()}`);
    assert.equal((await env.call('ledger','principalOf',[wallet.address]))[0],e.zeroPadValue(wallet.address,32));
    type4.push({...row,authorizationNonce:nonce+1,marker});return row;
  };
  const seed=await run('create',{name:'prague.txt',salt:e.id('prague-file'),document:'before delegation'});
  const native=await prepare('edit',{file:seed.file,document:'native delegated publication'});
  const installed=await transact4('7702/install-and-publish',delegateA,nativeData(native));assert.equal(installed.status,'SUCCESS');
  const selected=await sdk.readFile({file:seed.file,authors,context:await sdk.pin()});
  assert.equal(selected.value.revision.recordId,native.newRevision);
  const nativePub=selected.value.revision.publicationContext;
  assert.equal(nativePub.principalKind,'1');assert.equal(nativePub.authorizationProfile,'1');
  assert.equal(nativePub.principalId,e.zeroPadValue(wallet.address,32));
  const signedWhileDelegated=await run('edit',{file:seed.file,document:'signed while delegated'});
  const changed=await transact4('7702/change',delegateB);assert.equal(changed.status,'SUCCESS');
  assert.equal((await client(env,journal).sdk.reconcile(signedWhileDelegated.id)).status,'EFFECTS_VERIFIED');
  const nativeAfterChange=await prepare('edit',{file:seed.file,document:'native after change'});
  const nativeHash=await env.enqueue('7702/native-after-change',{to:wallet.address,data:nativeData(nativeAfterChange)},'alice');
  assert.equal((await env.observe(nativeHash)).status,'SUCCESS');
  const stale=await prepare('edit',{file:seed.file,document:'must roll back'});
  await run('edit',{file:seed.file,document:'Bob intervenes'},'bob');
  const before=plain({counts:await env.call('ledger','counts'),nonce:await env.call('ledger','nonces',[wallet.address]),
    heads:await Promise.all(stale.startingHeads.map(h=>env.call('ledger','head',[h.key]))),
    record:await env.call('ledger','record',[stale.newRevision]),index:await env.call('index','lastProcessed')});
  const reverted=await transact4('7702/revert-but-authorization-persists',delegateA,nativeData(stale));
  assert.equal(reverted.status,'REVERTED');
  assert.deepEqual(plain({counts:await env.call('ledger','counts'),nonce:await env.call('ledger','nonces',[wallet.address]),
    heads:await Promise.all(stale.startingHeads.map(h=>env.call('ledger','head',[h.key]))),
    record:await env.call('ledger','record',[stale.newRevision]),index:await env.call('index','lastProcessed')}),before);
  assert.equal((await env.call('ledger','publicationOf',[stale.publicationId]))[0],0n);
  const clear=await transact4('7702/clear',e.ZeroAddress);assert.equal(clear.status,'SUCCESS');
  const fresh=client(env,journal).sdk;
  assert.equal((await fresh.reconcile(seed.id)).status,'EFFECTS_VERIFIED');
  assert.equal((await fresh.reconcile(signedWhileDelegated.id)).status,'EFFECTS_VERIFIED');
  const afterClear=await run('edit',{file:seed.file,document:'signed after clear'});
  const retained=(await env.call('ledger','publicationContext',[selected.value.revision.publication]))[0];
  assert.equal(retained.principalId,e.zeroPadValue(wallet.address,32));assert.equal(retained.principalKind,1n);
  assert.equal(retained.authorizationProfile,1n,'native evidence never relabeled ECDSA');
  assert.equal((await sdk.readFile({file:seed.file,principals:[retained.principalId],context:await sdk.pin()})).value.revision.recordId,afterClear.newRevision);
  await env.writeReport('guarded-prague',{status:'PASS',hardfork:'prague',realAuthorizationList:true,type4,
    authorizationPersistsDespiteExecutionRevert:true,nativePrincipal:retained.principalId,transactions:env.transactions,rpc:env.metrics});
});

test('whole-transaction guard retention costs remain within the explicit per-transaction cap', {timeout:120_000},async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy'});t.after(()=>env.close());
  const {ethers:e,manifest,wallets}=env,iface=new e.Interface(manifest.contracts.ledger.abi),Z=e.ZeroHash,coder=e.AbiCoder.defaultAbiCoder(),results=[];
  for(const [n,m] of [[0,0],[1,1],[8,2],[64,4]]) {
    const ids=Array.from({length:n},(_,i)=>e.zeroPadValue(e.toBeHex(i+100),32)),positions=Array.from({length:m},(_,i)=>e.id(`cost-pos-${i}`));
    const absent=e.keccak256(coder.encode(['bytes32','uint8','uint32','uint64','bytes32'],[e.id('efs.lab.head-snapshot/2'),0,0,0,Z]));
    const reads={principalIds:ids,positions,expectedHeads:Array(n*m).fill(absent)},readSetHash=(await env.call('ledger','readSetHash',[reads]))[0];
    for(const reuse of [false,true]) {
      const before={...env.metrics},action={kind:5,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:e.id(`cost-${n}-${m}-${reuse}`)};
      const actionsHash=e.keccak256(coder.encode([iface.getFunction('executeGuardedSigned').inputs[1]],[[action]]));
      const intent={realmId:manifest.executionFamily.realmId,realmOrigin:manifest.executionFamily.origin,executionSet:(await env.call('ledger','executionSet'))[0],
        author:wallets.alice.address,nonce:(await env.call('ledger','nonces',[wallets.alice.address]))[0],deadline:4_000_000_000n,
        acceptanceProfile:(await env.call('ledger','acceptanceProfileOf',[[action]]))[0],indexObligations:(await env.call('ledger','indexObligations'))[0],readSetHash};
      const digest=(await env.call('ledger','guardedIntentDigest',[intent,actionsHash]))[0],signature=wallets.alice.signingKey.sign(digest).serialized;
      const data=iface.encodeFunctionData('executeGuardedSigned',[intent,[action],['0x'],reads,signature]);
      const hash=await env.enqueue(`cost/${n}x${m}/${reuse?'retained':'first'}`,{to:manifest.contracts.ledger.address,data,gasLimit:15_000_000n},'alice');
      const row=await env.observe(hash);assert.equal(row.status,'SUCCESS');
      const preimage=(await env.call('ledger','readSetBytes',[readSetHash]))[0];
      assert.equal(e.getBytes(preimage).length,m===0?224:224+32*(n+m+n*m));
      results.push({principals:n,positions:m,reusedReadSet:reuse,readSetBytes:e.getBytes(preimage).length,
        allocatedStorageWords:1+Math.ceil(e.getBytes(preimage).length/32),transaction:row,
        rpc:Object.fromEntries(['calls','requestBytes','responseBytes'].map(k=>[k,env.metrics[k]-before[k]]))});
    }
  }
  // The first guarded empty sample includes first-execution/counter storage;
  // later shapes have that already retained. Do not label all differences as
  // a storage-only premium or a public-chain fee.
  await env.writeReport('guarded-costs',{status:'PASS',results,targetTransactionGasCap:16_777_216,
    blockGasLimit:30_000_000,hardfork:'cancun',gasKind:'WHOLE_LOCAL_TRANSACTION_RECEIPT',rpc:env.metrics});
});
