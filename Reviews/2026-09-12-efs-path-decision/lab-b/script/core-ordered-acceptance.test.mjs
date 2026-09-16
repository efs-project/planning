/** Task1 paid LOCAL_RPC evidence only: owned bounded Anvil via the existing
 * compact environment, normal raw artifact deployment, no UI/public network. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createEnvironment} from './compact-environment.mjs';

test('ordered acceptance deploys normally and commits or rolls back real application transactions', {timeout:180_000}, async t=>{
  const env=await createEnvironment({protocol:'compact-guarded-v2',deployment:'proxy',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2'});
  t.after(()=>env.close());
  const {ethers:e,contracts:c,manifest:m}=env;
  const abi=e.AbiCoder.defaultAbiCoder();
  const hash=(types,values)=>e.keccak256(abi.encode(types,values));
  const record=(type,body)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),type,e.keccak256(body)]);
  const subject=(principal,salt)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),principal,salt]);
  const base={kind:0,typeId:e.ZeroHash,bodyHashOrRecordId:e.ZeroHash,purpose:e.ZeroHash,subject:e.ZeroHash,role:e.ZeroHash,target:e.ZeroHash,expectedRevision:0,salt:e.ZeroHash};
  const publish=(typeId,body)=>({...base,kind:1,typeId,bodyHashOrRecordId:e.keccak256(body)});
  const reuse=(typeId,id)=>({...base,kind:2,typeId,bodyHashOrRecordId:id});
  const withdraw=admission=>({...base,kind:6,target:e.toBeHex(admission,32)});
  const latest=()=>env.transactions.at(-1);
  const expectStatus=status=>assert.equal(latest().status,status,latest().label);
  const rejected=async(name,fn,args,label)=>{
    const hash=await env.enqueue(label,{to:c[name].address,data:new e.Interface(c[name].abi).encodeFunctionData(fn,args)});
    await env.observe(hash);expectStatus('REVERTED');
  };
  const dependencies=[];
  const helperArtifact=JSON.parse(await readFile(join(process.env.FOUNDRY_OUT,'PublicationSupport.sol','PublicationSupport.json'),'utf8'));
  for(const name of ['implementationV1','implementationV2']){
    const [address,expectedCodehash]=await env.call(name,'publicationSupportIdentity');
    const code=await env.rpc('eth_getCode',[address,'latest']);
    assert.equal(e.keccak256(code),expectedCodehash);assert(e.getBytes(code).length<=24576);
    assert.equal(code,helperArtifact.deployedBytecode.object,'constructor-created dependency equals independently built runtime');
    dependencies.push({implementation:c[name].address,address,expectedCodehash,runtimeBytes:e.getBytes(code).length});
  }
  await env.deploy('eligibility','CoreOrderedAcceptance.t.sol','EquipmentEligibility');
  await env.deploy('equipmentRule','CoreOrderedAcceptance.t.sol','EquipmentRule',[c.eligibility.address]);
  await env.deploy('equipmentApp','CoreOrderedAcceptance.t.sol','EquipmentApplication');
  const register=async(label,rule,refs)=>{
    const shape=e.id(label),[id]=await env.call('registry','typeIdOf',[shape,rule,refs]);
    await env.transact('registry','register',[shape,rule,refs],`register/${label}`);expectStatus('SUCCESS');return id;
  };
  const character=await register('paid/character',e.ZeroAddress,[]);
  const item=await register('paid/item',e.ZeroAddress,[]);
  const types=[character,...Array(7).fill(item)],ids=[],bodies=[],actions=[];
  for(let i=0;i<8;i++){
    const body=abi.encode(['uint256'],[i+1]);bodies.push(body);ids.push(record(types[i],body));actions.push(publish(types[i],body));
  }
  const equipment=await register('paid/equipment',c.equipmentRule.address,types);
  const body=abi.encode(['bytes32[8]','uint256'],[ids,1]),id=record(equipment,body);
  actions.push(publish(equipment,body));bodies.push(body);
  const rs={principalIds:[e.toBeHex(11,32),e.toBeHex(22,32)],positions:[e.toBeHex(33,32)],expectedHeads:[e.toBeHex(44,32),e.toBeHex(55,32)]};
  const expectedReadSet=hash(['bytes32','tuple(bytes32[] principalIds,bytes32[] positions,bytes32[] expectedHeads)'],
    [e.id('efs.lab.read-set/2:ordered-first-binding'),rs]);
  assert.equal((await env.call('ledger','readSetHash',[rs]))[0],expectedReadSet,'independent read-set hash/order vector');
  await env.transact('ledger','readSetHash',[rs],'codec/read-set-2x1-cold-transaction');expectStatus('SUCCESS');
  const profileEpoch=(await env.call('registry','epoch'))[0];
  const profileFor=order=>order.reduce((h,t)=>hash(['bytes32','bytes32','address','bytes32','address','bytes32','uint16'],
    [h,t,e.ZeroAddress,e.ZeroHash,e.ZeroAddress,e.ZeroHash,1]),
    hash(['bytes32','address','uint64'],[e.id('efs.lab.acceptance-profile/2'),c.registry.address,profileEpoch]));
  const expectedProfile=profileFor([character,item]),reversedProfile=profileFor([item,character]);
  assert.notEqual(expectedProfile,reversedProfile,'profile preserves action order');
  assert.equal((await env.call('ledger','acceptanceProfileOf',[actions.slice(0,2)]))[0],expectedProfile,'independent profile hash vector');
  await env.transact('ledger','acceptanceProfileOf',[actions.slice(0,2)],'codec/two-action-profile-cold-transaction');expectStatus('SUCCESS');
  const before=(await env.call('ledger','counts'))[0];
  await env.transact('equipmentApp','equip',[c.ledger.address,actions,bodies],'acceptance/8-earlier-ref-guarded-app');expectStatus('SUCCESS');
  assert.equal((await env.call('equipmentApp','operations'))[0],1n);
  assert.equal((await env.call('ledger','counts'))[0],before+9n);
  const first=(await env.call('ledger','record',[id]))[1];
  const equipmentKey=hash(['bytes32','bytes32','uint256','uint256','bytes32'],[e.id('efs2/pk/1'),equipment,1,0,e.ZeroHash]);
  assert.deepEqual(Array.from(await env.call('index','postingHead',[equipmentKey])).slice(0,3),[1n,1n,first]);
  const context=await env.call('ledger','publicationContext',[(await env.call('ledger','counts'))[3]]);
  const snapshot=async()=>JSON.stringify({counts:await env.call('ledger','counts'),record:await env.call('ledger','record',[id]),
    operations:await env.call('equipmentApp','operations'),nonce:await env.call('ledger','nonces',[c.equipmentApp.address]),
    head:await env.call('index','postingHead',[equipmentKey])},(_,v)=>typeof v==='bigint'?String(v):v);
  const retained=await snapshot();
  await rejected('equipmentApp','equip',[c.ledger.address,[withdraw(first),reuse(equipment,id),reuse(equipment,id)],['0x','0x','0x']],
    'acceptance/same-batch-quota-refusal');assert.equal(await snapshot(),retained);
  await env.transact('eligibility','set',[false],'acceptance/dependency-off');expectStatus('SUCCESS');
  await rejected('equipmentApp','equip',[c.ledger.address,[withdraw(first),reuse(equipment,id)],['0x','0x']],
    'acceptance/mutable-dependency-refusal');assert.equal(await snapshot(),retained);
  assert.equal((await env.call('ledger','record',[id]))[2],1n,'history remains admitted');
  const contextBytes=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v);
  assert.equal(contextBytes(await env.call('ledger','publicationContext',[(await env.call('ledger','counts'))[3]])),contextBytes(context));
  await env.transact('eligibility','set',[true],'acceptance/dependency-on');
  await env.transact('equipmentApp','equip',[c.ledger.address,[withdraw(first),reuse(equipment,id)],['0x','0x']],
    'acceptance/withdraw-before-reuse');expectStatus('SUCCESS');assert.equal((await env.call('equipmentApp','operations'))[0],2n);
  assert.deepEqual(Array.from(await env.call('index','postingHead',[equipmentKey])).slice(0,2),[2n,1n],'retained versus live quota');
  // Native single-action Name255 retention and binding retain their original allowance.
  const salt=e.id('paid/name255'),principal=(await env.call('ledger','principalOf',[env.wallets.alice.address]))[0],file=subject(principal,salt);
  await env.transact('ledger','create',[salt],'acceptance/file-seed','alice');expectStatus('SUCCESS');
  const label=e.hexlify(e.toUtf8Bytes('a'.repeat(255)));
  await env.transact('ledger','publish',[m.types.name,label],'acceptance/name255-retention','alice');expectStatus('SUCCESS');
  const nameBind=[e.id('efs2/purpose/folder/1'),m.folder,e.keccak256(label),file,0];
  try {
    await env.transact('ledger','bind',nameBind,'acceptance/name255-native-single-bind','alice');expectStatus('SUCCESS');
  }catch(error){
    try{await env.rpc('eth_call',[{from:env.wallets.alice.address,to:c.ledger.address,
      data:new e.Interface(c.ledger.abi).encodeFunctionData('bind',nameBind),gas:e.toQuantity(15_000_000)},'latest']);}
    catch(reason){console.log('Name255 cold diagnostic',JSON.stringify({gasUsed:latest().gasUsed,error:reason.rpcError}));}
    // One bounded transaction call tree, never an opcode/stack/storage trace.
    const tree=await env.rpc('debug_traceTransaction',[latest().transactionHash,{tracer:'callTracer'}]);
    let nodes=0;const compact=call=>{assert(++nodes<=256,'diagnostic call-tree bound');return {type:call.type,to:call.to,
      selector:call.input?.slice(0,10),gasUsed:call.gasUsed,error:call.error,calls:call.calls?.map(compact)};};
    console.log('Name255 bounded call tree',JSON.stringify(compact(tree)));
    throw error;
  }
  const nameRecord=await env.call('ledger','record',[record(m.types.name,label)]);assert.equal(nameRecord[3],label);
  for(const [kind,value] of [['punctuation','-'.repeat(255)],['mixed','abcdefghijklmnopqrstuvwxyz0123456789._-'.repeat(7).slice(0,255)]]){
    const bytes=e.hexlify(e.toUtf8Bytes(value));assert.equal(e.getBytes(bytes).length,255);
    await env.transact('ledger','publish',[m.types.name,bytes],`acceptance/name255-${kind}-retention`,'alice');
    await env.transact('ledger','bind',[e.id('efs2/purpose/folder/1'),m.folder,e.keccak256(bytes),file,0],
      `acceptance/name255-${kind}-single-bind`,'alice');
    assert.equal((await env.call('ledger','record',[record(m.types.name,bytes)]))[3],bytes);
  }
  const later=e.hexlify(e.toUtf8Bytes('later-name'));
  const placement={...base,kind:3,purpose:e.id('efs2/purpose/folder/1'),subject:m.folder,role:e.keccak256(later),target:file};
  await env.transact('ledger','execute',[[placement,publish(m.types.name,later)],['0x',later],(await env.call('ledger','nonces',[env.wallets.alice.address]))[0]],
    'acceptance/name-after-bind','alice');expectStatus('SUCCESS');
  // Low-work batch must not reserve the unused joint allowance again at its end.
  const creates=Array.from({length:55},(_,i)=>({...base,kind:5,salt:e.id(`paid/bulk/${i}`)}));
  await env.transact('ledger','execute',[creates,Array(55).fill('0x'),(await env.call('ledger','nonces',[env.wallets.alice.address]))[0]],
    'acceptance/55-create-native','alice');expectStatus('SUCCESS');
  // Real signed matched rollback transactions; each arm attaches its index before
  // admission one. These are receipt costs, unlike whole Foundry fixture costs.
  await env.deploy('matchedPairRule','LabAcceptors.sol','MinBodyAcceptor',[96]);
  await env.deploy('matchedQuoteRule','LabAcceptors.sol','QuoteAcceptor');
  const pair=await register('paid/matched-pair',c.matchedPairRule.address,[item,item]);
  const quote=await register('paid/matched-quote',c.matchedQuoteRule.address,[pair]);
  const pairBody=abi.encode(['bytes32','bytes32','uint256'],[ids[1],ids[2],1]),pairId=record(pair,pairBody);
  const matchedSalt=e.toBeHex(1,32),matchedFile=subject(e.zeroPadValue(env.wallets.alice.address,32),matchedSalt);
  const purpose={head:e.id('efs2/purpose/head/1'),folder:e.id('efs2/purpose/folder/1'),tag:e.id('efs2/purpose/tag/1')};
  const tagPosition=hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),purpose.tag,matchedFile,e.id('market')]);
  const tagKey=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),e.zeroPadValue(env.wallets.alice.address,32),tagPosition]);
  const actionType='tuple(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)[]';
  for(const poison of [false,true]){
    const name=poison?'matchedPoison':'matchedGood',indexName=name+'Index';
    await env.deploy(name,'Ledger.sol','Ledger',[c.registry.address,e.id(`paid/${name}`)]);
    await env.deploy(indexName,'MatchedRollback.t.sol','LateRefusingIndexModule',[c[name].address,poison?tagKey:e.ZeroHash]);
    await env.transact(name,'setIndexModule',[c[indexName].address]);
    await env.transact(name,'execute',[[publish(item,bodies[1]),publish(item,bodies[2]),publish(pair,pairBody)],
      [bodies[1],bodies[2],pairBody],0],`matched/${name}/prefix`);
    for(const scale of poison?[6]:[7,6]){
      const qb=abi.encode(['bytes32','uint256','uint8','uint64','bytes32'],[pairId,2_500_000_000n,scale,1_800_000_000,e.keccak256(e.toUtf8Bytes('reference quote'))]);
      const qid=record(quote,qb),bind=(purpose,subject,role,target)=>({...base,kind:3,purpose,subject,role,target});
      const a=[{...base,kind:5,salt:matchedSalt},publish(quote,qb),bind(purpose.head,matchedFile,e.ZeroHash,qid),
        bind(purpose.folder,e.id('/swaps'),e.id('eth-usdc'),matchedFile),bind(purpose.tag,matchedFile,e.id('market'),matchedFile)];
      const intent={realmId:(await env.call(name,'realmId'))[0],coreCodeCommitment:(await env.call(name,'coreCodeCommitment'))[0],
        author:env.wallets.alice.address,nonce:0,deadline:18_446_744_073_709_551_615n,acceptanceProfile:(await env.call(name,'acceptanceProfileOf',[a]))[0],
        indexObligations:(await env.call(name,'indexObligations'))[0]};
      const ah=hash([actionType],[a]),digest=(await env.call(name,'intentDigest',[intent,ah]))[0];
      const signature=env.wallets.alice.signingKey.sign(digest).serialized;
      const args=[intent,a,['0x',qb,'0x','0x','0x'],signature];
      const beforeState=JSON.stringify(await env.call(name,'counts'),(_,v)=>typeof v==='bigint'?String(v):v);
      if(scale===7||poison){
        const iface=new e.Interface(c[name].abi);
        const expected=scale===7?iface.encodeErrorResult('E_REJECTED',[1,quote]):iface.encodeErrorResult('E_INDEX',[
          new e.Interface(c[indexName].abi).encodeErrorResult('E_LATE_INDEX',[tagKey])]);
        await assert.rejects(env.call(name,'executeSigned',args),error=>error.rpcError?.data===expected,'exact matched refusal bytes');
        await rejected(name,'executeSigned',args,`matched/scale${scale}-${poison?'final-refusal':'rule-refusal'}`);
        assert.equal(JSON.stringify(await env.call(name,'counts'),(_,v)=>typeof v==='bigint'?String(v):v),beforeState);
        assert.equal((await env.call(name,'nonces',[env.wallets.alice.address]))[0],0n);
        assert.equal((await env.call(name,'subjectCreatedAt',[matchedFile]))[0],0n);
        assert.equal((await env.call(name,'record',[qid]))[1],0n);
        assert.equal((await env.call(indexName,'lastProcessed'))[0],3n);
      }else{
        await env.transact(name,'executeSigned',args,'matched/scale6-success');
        assert.deepEqual(Array.from(await env.call(name,'counts')),[8n,4n,3n,2n]);
      }
    }
  }
  assert(env.transactions.every(row=>BigInt(row.gasLimit)<=15_000_000n));
  const report={classification:'LOCAL_RPC_OBSERVED_NOT_STATE_PROOF',dependencies,
    vectors:{readSet:{input:rs,expectedHash:expectedReadSet},profile:{registry:c.registry.address,epoch:String(profileEpoch),
      orderedTypes:[character,item],activation:1,expectedHash:expectedProfile,reversedHash:reversedProfile}},
    transactions:env.transactions.map(({label,gasUsed,gasLimit,status,transactionHash,blockHash})=>({label,gasUsed,gasLimit,status,transactionHash,blockHash})),
    totalTransactions:env.transactions.length,chain:{port:env.port,historyPolicy:env.historyPolicy}};
  await env.writeReport('core-ordered-acceptance',report);
  console.log(JSON.stringify(report));
});
