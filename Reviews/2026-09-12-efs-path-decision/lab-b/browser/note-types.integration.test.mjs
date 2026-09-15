import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createGuardedCompactSdk} from './compact-sdk-v2.mjs';
import {createNoteReader,NOTE_SHAPES,V2_ADAPTER} from './note-reader.mjs';

test('distinct Note Types: mandatory refusal, qualified exact projections and paid reads',{timeout:180000},async t=>{
  assert(await access(join(process.env.FOUNDRY_OUT,'NoteProfile.sol/NoteV1Rule.json')).then(()=>true,()=>false),'missing compiled Note mandatory rules');
  const env=await createEnvironment({protocol:'compact-guarded-v2',evidenceMode:'append'});t.after(()=>env.close());
  const {ethers:e}=env,coder=e.AbiCoder.defaultAbiCoder(),profiles={},rows=[];
  const hash=(types,values)=>e.keccak256(coder.encode(types,values));
  const recordOf=(type,body)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),type,e.keccak256(body)]);
  for(const [key,contract] of [['v1','NoteV1Rule'],['v11','NoteV11Rule'],['v2','NoteV2Rule']]){
    const address=await env.deploy(key+'Rule','NoteProfile.sol',contract),ruleHash=env.contracts[key+'Rule'].codeHash,shape=e.id(NOTE_SHAPES[key]);
    const typeId=hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/type/1'),shape,hash(['bytes32[]'],[[]]),ruleHash]);
    assert.equal((await env.call('registry','typeIdOf',[shape,address,[]]))[0],typeId);
    await env.transact('registry','register',[shape,address,[]]);profiles[key]={typeId,ruleHash};
  }
  assert.equal(new Set(Object.values(profiles).map(x=>x.typeId)).size,3);
  const publish=async(label,type,body,ok=true)=>{
    const before=Array.from(await env.call('ledger','counts'),String),data=new e.Interface(env.contracts.ledger.abi).encodeFunctionData('publish',[type,body]);
    const tx=await env.observe(await env.enqueue(label,{to:env.contracts.ledger.address,data},'alice'));
    assert.equal(tx.status,ok?'SUCCESS':'REVERTED',label);
    const record=recordOf(type,body),retained=await env.call('ledger','record',[record]);
    if(ok){assert.equal(retained[0],type);assert.equal(retained[3],body);assert(retained[1]>0n);}
    else {assert.deepEqual(Array.from(await env.call('ledger','counts'),String),before);assert.equal(retained[1],0n);}
    rows.push({label,record,typeId:type,body,bodyBytes:e.getBytes(body).length,gasUsed:tx.gasUsed,calldataBytes:tx.calldataBytes,status:tx.status,transactionHash:tx.transactionHash});
    return record;
  };
  const bodies={v1:'0x4e545631000568656c6c6f',v11:'0x4e543131000568656c6c6f010154',v2:'0x4e54563201000568656c6c6f'};
  const records={};for(const key of Object.keys(bodies))records[key]=await publish('publish/'+key,profiles[key].typeId,bodies[key]);
  const rich=await publish('publish/v2-emphasis',profiles.v2.typeId,'0x4e54563202000568656c6c6f');
  for(const [label,key,body] of [
    ['required','v1','0x4e5456310000'],['wrong-type-body','v11',bodies.v1],['truncated','v1','0x4e54563100056869'],
    ['noncanonical','v1',bodies.v1+'00'],['text-domain','v1','0x4e5456310001ff'],['title-flag','v11','0x4e5431310001680200'],
    ['empty-title','v11','0x4e5431310001680100'],['rich-feature','v2','0x4e54563203000168'],
    ['oversize','v1','0x4e5456310401'+'61'.repeat(1025)]])await publish('refuse/'+label,profiles[key].typeId,body,false);
  const maximumBody='0x4e5456310400'+'61'.repeat(1024);
  const maximumRuleCall=new e.Interface(env.contracts.v1Rule.abi).encodeFunctionData('accept',[profiles.v1.typeId,maximumBody,[]]);
  const maximumRuleGas=String(BigInt(await env.rpc('eth_estimateGas',[{to:env.contracts.v1Rule.address,data:maximumRuleCall}])));
  console.log('Maximum Note rule direct-call gas estimate (including intrinsic):',maximumRuleGas);
  const max=await publish('publish/v1-max',profiles.v1.typeId,maximumBody);
  await publish('publish/v11-max',profiles.v11.typeId,'0x4e5431310400'+'61'.repeat(1024)+'0140'+'54'.repeat(64));
  await publish('publish/v2-max',profiles.v2.typeId,'0x4e545632010400'+'61'.repeat(1024));
  // Same friendly shape + a different rule creates a different exact identity;
  // the Registry cannot know that an opaque shape name deserves a certain rule.
  const forgedShape=e.id(NOTE_SHAPES.v11),wrongRule=env.contracts.v1Rule.address;
  const forged=(await env.call('registry','typeIdOf',[forgedShape,wrongRule,[]]))[0];
  await env.transact('registry','register',[forgedShape,wrongRule,[]]);
  const forgedRecord=await publish('publish/forged-v1.1-label',forged,bodies.v1);
  await publish('refuse/unregistered-type',e.id('future unknown Type'),bodies.v11,false);
  const sdk=createGuardedCompactSdk({ethers:e,manifest:env.manifest,rpc:env.rpc}),reader=createNoteReader({ethers:e,sdk,profiles}),context=await sdk.pin();
  const oldView=value=>value.text;
  const reads=[];
  for(const key of ['v1','v11']){
    const before={...env.metrics},r=await reader.readNote({record:records[key],context});
    assert.equal(r.knowledge,'PRESENT');assert.equal(oldView(r.value),'hello');assert.equal(r.source.value.body,bodies[key]);
    assert.equal(r.source.value.typeId,profiles[key].typeId);assert.equal(r.source.value.provenance.author,env.wallets.alice.address);
    assert.equal(r.basis.blockHash,context.blockHash);assert.equal(r.source.value.validity,'NOT_ASSESSED');
    reads.push({key,rpcCalls:env.metrics.calls-before.calls,requestBytes:env.metrics.requestBytes-before.requestBytes,responseBytes:env.metrics.responseBytes-before.responseBytes,result:r});
  }
  const oldReader=createNoteReader({ethers:e,sdk,profiles:{v1:profiles.v1}});
  assert.equal((await oldReader.readNote({record:records.v11,context,claimedVersion:'v1.1'})).knowledge,'UNSUPPORTED');
  assert.equal((await reader.readNote({record:forgedRecord,context,claimedVersion:'v1.1'})).knowledge,'UNSUPPORTED');
  assert.equal((await reader.readNote({record:records.v2,context})).knowledge,'UNSUPPORTED');
  assert.equal((await reader.readNote({record:records.v2,context,adapter:V2_ADAPTER})).value.text,'hello');
  assert.equal((await reader.readNote({record:rich,context,adapter:V2_ADAPTER})).knowledge,'UNSUPPORTED');
  assert.equal((await reader.readNote({record:rich,context,adapter:V2_ADAPTER,allowLoss:true})).projection.loss,'LOSSY');
  assert.equal((await reader.readNote({record:max,context})).value.text.length,1024);
  assert.equal((await reader.readNote({record:e.id('absent'),context})).knowledge,'ABSENT');
  // Malicious/unavailable RPC beneath the real qualified read seam. Pin against
  // the real chain, then mutate one observed response; do not mock SDK decisions.
  for(const fault of ['unavailable','body','descriptor','code','admission']){
    let active=false;
    const rpc=async(method,args)=>{
      const out=await env.rpc(method,args);if(!active)return out;
      if(fault==='code'&&method==='eth_getCode'&&args[0].toLowerCase()===env.contracts.v1Rule.address.toLowerCase())return '0x6000';
      if(method!=='eth_call')return out;
      const ledger=args[0].to.toLowerCase()===env.contracts.ledger.address.toLowerCase(),registry=args[0].to.toLowerCase()===env.contracts.registry.address.toLowerCase();
      if(!ledger&&!registry)return out;
      const iface=new e.Interface((ledger?env.contracts.ledger:env.contracts.registry).abi),fn=iface.parseTransaction({data:args[0].data}).name;
      if(fault==='unavailable'&&fn==='record')throw Error('controlled transport unavailable');
      if((fault==='body'&&fn==='record')||(fault==='descriptor'&&fn==='descriptor')||(fault==='admission'&&fn==='admission')){
        const values=Array.from(iface.decodeFunctionResult(fn,out));
        if(fn==='record')values[3]=bodies.v1+'00';if(fn==='descriptor')values[0]=e.id('wrong shape');if(fn==='admission')values[6]=e.id('wrong body');
        return iface.encodeFunctionResult(fn,values);
      }return out;
    };
    const badSdk=createGuardedCompactSdk({ethers:e,manifest:env.manifest,rpc}),c=await badSdk.pin();active=true;
    const r=await createNoteReader({ethers:e,sdk:badSdk,profiles}).readNote({record:records.v1,context:c});
    assert.equal(r.knowledge,fault==='unavailable'?'UNKNOWN':'INVALID',fault);assert.equal(r.value,null);assert.equal(r.coverage,'PARTIAL');
  }
  // Missing historical evidence and an orphaned pinned basis are uncertainty,
  // not a verdict that the retained Record or its Note bytes are invalid.
  for(const fault of ['missing-publication-context','reorged-context'])await t.test(fault,async()=>{
    let active=false;
    const ledgerAbi=new e.Interface(env.contracts.ledger.abi);
    const rpc=async(method,args)=>{
      const out=await env.rpc(method,args);if(!active)return out;
      if(fault==='reorged-context'&&method==='eth_getBlockByNumber')return {...out,hash:e.id('controlled orphaned Note basis')};
      if(fault==='missing-publication-context'&&method==='eth_call'&&args[0].to.toLowerCase()===env.contracts.ledger.address.toLowerCase()
        &&ledgerAbi.parseTransaction({data:args[0].data}).name==='publicationContext'){
        const retained=Array.from(ledgerAbi.decodeFunctionResult('publicationContext',out)[0]);retained[0]=e.ZeroHash;
        return ledgerAbi.encodeFunctionResult('publicationContext',[retained]);
      }return out;
    };
    const badSdk=createGuardedCompactSdk({ethers:e,manifest:env.manifest,rpc}),c=await badSdk.pin();active=true;
    const r=await createNoteReader({ethers:e,sdk:badSdk,profiles}).readNote({record:records.v1,context:c});
    assert.equal(r.knowledge,'UNKNOWN');assert.equal(r.coverage,'PARTIAL');assert.equal(r.value,null);
    assert.equal(r.source.knowledge,'UNKNOWN');assert.equal(r.source.coverage,'PARTIAL');assert.equal(r.source.value,null);
    assert.equal(r.reason,fault==='missing-publication-context'?'COMPACT_HISTORY_UNAVAILABLE':'COMPACT_BLOCK_REORG');
    assert.equal(r.basis,c);assert.equal(r.source.basis,c);
  });
  // Contract consumer has its own reviewed pins and real normal-limit deployment.
  const ts=Object.values(profiles).map(p=>p.typeId),hs=Object.values(profiles).map(p=>p.ruleHash);
  const point=await env.deploy('notePoint','NoteProfile.sol','NotePointReader',[env.contracts.ledger.address,ts,hs]);
  const badArgs=[env.contracts.ledger.address,[ts[0],forged,ts[2]],hs];
  const artifact=JSON.parse(await readFile(join(process.env.FOUNDRY_OUT,'NoteProfile.sol/NotePointReader.json'),'utf8'));
  const badDeploy=artifact.bytecode.object+new e.Interface(artifact.abi).encodeDeploy(badArgs).slice(2);
  assert.equal((await env.observe(await env.enqueue('refuse/reader-wrong-rule-descriptor',{data:badDeploy}))).status,'REVERTED');
  // This tiny contract reader pins a direct Ledger runtime, not a proxy shell.
  const proxy=await env.deploy('unsupportedNoteProxy','UpgradeProxy.sol','UpgradeProxy',[env.contracts.ledger.address]);
  const proxyDeploy=artifact.bytecode.object+new e.Interface(artifact.abi).encodeDeploy([proxy,ts,hs]).slice(2);
  assert.equal((await env.observe(await env.enqueue('refuse/reader-proxy-shell',{data:proxyDeploy}))).status,'REVERTED');
  for(const [label,record,adapter,loss] of [['v1',records.v1,false,false],['v11',records.v11,false,false],['v2-adapted',records.v2,true,false],['v2-lossy',rich,true,true],['v1-max',max,false,false]]){
    const value=(await env.call('notePoint','read',[record,adapter,loss]))[0];assert.equal(value.text,label==='v1-max'?'a'.repeat(1024):'hello');assert.equal(value.lossy,loss);
    const data=new e.Interface(env.contracts.notePoint.abi).encodeFunctionData('consume',[record,adapter,loss]);
    const tx=await env.observe(await env.enqueue('paid-read/'+label,{to:point,data},'bob'));assert.equal(tx.status,'SUCCESS');
    rows.push({label:'paid-read/'+label,gasUsed:tx.gasUsed,calldataBytes:tx.calldataBytes,status:tx.status,transactionHash:tx.transactionHash});
  }
  for(const [record,adapter,loss] of [[records.v2,false,false],[rich,true,false],[forgedRecord,true,true]])await assert.rejects(env.call('notePoint','read',[record,adapter,loss]));
  const sourcePins={};for(const path of ['test/NoteProfile.sol','browser/note-reader.mjs','browser/note-reader.test.mjs','browser/note-types.integration.test.mjs','browser/compact-sdk.mjs','browser/compact-sdk-v2.mjs','src/Ledger.sol','src/TypeRegistry.sol','src/Keys.sol','script/compact-environment.mjs']){
    sourcePins[path]=createHash('sha256').update(await readFile(path)).digest('hex');
  }
  const report={base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourcePins,profiles,rows,reads,maximumRuleGas,
    environment:{port:env.port,anvilPid:env.anvilPid,history:env.historyPolicy},limits:{signedGasLimit:16777216,runtime:24576,initcode:49152},
    scope:'Raw typed-Record publish/read recipe; not a named File, revision, binding, name, content carrier or whole Files cost. RPC_OBSERVED, not source-state proof.'};
  await env.writeReport('note-types',report);await env.close();
});
