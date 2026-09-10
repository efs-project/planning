import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { Contract, ContractFactory, JsonRpcProvider, Wallet, ZeroAddress, ZeroHash, id, keccak256, toQuantity } from 'ethers';
import { Outfit } from '../generated/Outfit.ts';
import { OutfitV2 } from '../generated/OutfitV2.ts';
import { Equip } from '../generated/Equip.ts';
import { PaidClaim } from '../generated/PaidClaim.ts';
import { planWrite, authorize, direct, submit, readBack, pinBasis, verifiedBody, exactRead } from '../sdk/adapter.ts';
import { inspect } from '../web/inspector.ts';

test('real Anvil: generated helpers, exact authorization, atomic custom applications and independent pinned reads', {timeout:120000}, async()=>{
 assert.ok(existsSync(new URL('../sdk/applications.ts',import.meta.url)), 'known-artifact registration and named previous-Outfit helper implemented');
 assert.ok(existsSync(new URL('../sdk/example.ts',import.meta.url)), 'ordinary named-field application example implemented');
 const { registerKnownRule, equipPreviousOutfit }=await import('../sdk/applications.ts');
 const { planOutfitAndEquip }=await import('../sdk/example.ts');
 execFileSync('forge',['build'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
 const server=createServer(); await new Promise<void>(r=>server.listen(0,'127.0.0.1',r)); const address=server.address(); assert.ok(address&&typeof address==='object'); const port=address.port; await new Promise<void>(r=>server.close(()=>r()));
 const child=spawn('anvil',['--host','127.0.0.1','--port',String(port),'--chain-id','31337','--silent'],{stdio:'pipe'});
 const url=`http://127.0.0.1:${port}`;
 const provider=new JsonRpcProvider(url,undefined,{cacheTimeout:-1});
 const readProvider=new JsonRpcProvider(url,undefined,{cacheTimeout:-1});
 let requests=0; readProvider.on('debug',e=>{if(e.action==='sendRpcPayload')requests+=Array.isArray(e.payload)?e.payload.length:1;});
 const gas:Record<string,string>={},transactionHashes:Record<string,string>={};
 const capture=(name:string,receipt:any)=>{gas[name]=receipt.gasUsed.toString();transactionHashes[name]=receipt.hash;};
 const art=(file:string,name:string)=>JSON.parse(readFileSync(new URL(`../.forge-out/${file}/${name}.json`,import.meta.url),'utf8'));
 try {
  for(let attempt=0;attempt<100;attempt++) {try {const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]})});if(!response.ok)throw Error('RPC unavailable');break;} catch {if(attempt===99)throw Error('Anvil did not start');await delay(30);}}
  const owner=await provider.getSigner(0),relay=await provider.getSigner(1),treasury=await provider.getSigner(2);
  const author=await owner.getAddress(),treasuryAddress=await treasury.getAddress();
  // Public Anvil test key, not a real account or external signer.
  const signer=new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',provider);
  const deploy=async(file:string,name:string,args:unknown[]=[])=>{const a=art(file,name);const c=await new ContractFactory(a.abi,a.bytecode.object,owner).deploy(...args);await c.waitForDeployment();capture('deploy '+name,await c.deploymentTransaction()!.wait());return new Contract(await c.getAddress(),a.abi,owner);};
  const core=await deploy('AcceptanceCore.sol','AcceptanceCore'),coreAddress=await core.getAddress();
  const outfitRule=await deploy('OutfitRules.sol','OutfitRule',[coreAddress]);
  const context={chainId:31337n,core:coreAddress};
  await assert.rejects(registerKnownRule(provider,core,Outfit,art('OutfitRules.sol','OutfitRule'),{},await outfitRule.getAddress(),{core:treasuryAddress}),/LOCAL_BINDING_MISMATCH/);
  const outfit=await registerKnownRule(provider,core,Outfit,art('OutfitRules.sol','OutfitRule'),{},await outfitRule.getAddress(),{core:coreAddress});
  capture('register Outfit',outfit.registrationReceipt);capture('activate Outfit',outfit.activationReceipt);
  assert.equal((await core.getType(outfit.registration.typeId)).descriptor,Outfit.descriptor);
  await assert.rejects(registerKnownRule(provider,core,Outfit,{...art('OutfitRules.sol','OutfitRule'),deployedBytecode:{object:'0x6000'}},{},await outfitRule.getAddress(),{core:coreAddress}),/ARTIFACT_CODE_MISMATCH/);
  const equipRule=await deploy('OutfitRules.sol','EquipRule',[coreAddress,author,outfit.registration.typeId]);
  const equip=await registerKnownRule(provider,core,Equip,art('OutfitRules.sol','EquipRule'),{outfitType:outfit.registration.typeId},await equipRule.getAddress(),{core:coreAddress,admin:author});
  capture('register Equip',equip.registrationReceipt);capture('activate Equip',equip.activationReceipt);
  const fee=1000n,paidRule=await deploy('PaidClaimRule.sol','PaidClaimRule',[coreAddress,treasuryAddress,fee]);
  const paid=await registerKnownRule(provider,core,PaidClaim,art('PaidClaimRule.sol','PaidClaimRule'),{fee},await paidRule.getAddress(),{core:coreAddress,treasury:treasuryAddress});
  capture('register PaidClaim',paid.registrationReceipt);capture('activate PaidClaim',paid.activationReceipt);
  const revised=await registerKnownRule(provider,core,OutfitV2,art('OutfitRules.sol','OutfitRule'),{},await outfitRule.getAddress(),{core:coreAddress});
  capture('register OutfitV2',revised.registrationReceipt);capture('activate OutfitV2',revised.activationReceipt);
  const harness=await deploy('GeneratedHarness.sol','GeneratedHarness');
  const fields={species:1n,shirt:1n,pants:1n};
  const [solBody,solId]=await harness.outfit(fields,outfit.registration.rule.codeHash);
  assert.equal(solBody,Outfit.encode(fields));assert.equal(solId,outfit.registration.typeId);
  assert.deepEqual(Array.from(await harness.decodeOutfit(solBody)),[1n,1n,1n]);
  await assert.rejects(harness.decodeOutfit(solBody+'00'));
  const revFields={...fields,badge:7n};
  const sr=await harness.revision(revFields,revised.registration.rule.codeHash);assert.equal(sr[0],OutfitV2.encode(revFields));assert.equal(sr[1],revised.registration.typeId);
  const se=await harness.equip({outfitReceipt:ZeroHash},equip.registration.rule.codeHash,outfit.registration.typeId);assert.equal(se[0],Equip.encode({outfitReceipt:ZeroHash}));assert.equal(se[1],equip.registration.typeId);
  const sp=await harness.paid({claimKey:id('claim')},paid.registration.rule.codeHash,fee);assert.equal(sp[0],PaidClaim.encode({claimKey:id('claim')}));assert.equal(sp[1],paid.registration.typeId);
  const make=async(items:any[])=>planWrite(context,{author,executor:ZeroAddress,nonce:await core.nonces(author),deadline:BigInt((await provider.getBlock('latest'))!.timestamp+3600),items},[]);
  const batch=planOutfitAndEquip({context,author,executor:ZeroAddress,nonce:await core.nonces(author),deadline:BigInt((await provider.getBlock('latest'))!.timestamp+3600),outfit,equip,fields,sourceReads:[]});
  assert.equal(batch.digest,await core.hashPlan(batch.plan));
  const prepared=await authorize(batch,signer),sent=await submit(prepared,relay);
  capture('write Outfit+Equip signed relay',sent.evmReceipt);assert.equal(sent.effect,'UNKNOWN');
  const basis=await pinBasis(readProvider,context,sent.evmReceipt.blockNumber),beforeRequests=requests,start=performance.now();
  const verified=await readBack(readProvider,sent,basis);const readMs=performance.now()-start,readRequests=requests-beforeRequests;
  assert.equal(verified.effect,'COMMITTED');assert.equal(verified.reads.length,2);
  const retry=await submit(prepared,relay,{exactRetry:true});capture('exact retry zero value',retry.evmReceipt);assert.equal(await core.nonces(author),1n);
  assert.equal((await readBack(readProvider,retry,await pinBasis(readProvider,context))).effect,'COMMITTED');
  const malformed=await make([{...Outfit.item(outfit.registration,fields,outfit.activationId),body:'0x12'}]);await assert.rejects(submit(direct(malformed),owner));
  const failed=await make([Outfit.item(outfit.registration,{species:1n,shirt:2n,pants:1n},outfit.activationId)]);await assert.rejects(submit(direct(failed),owner));
  const paidPlan=await make([PaidClaim.item(paid.registration,{claimKey:id('claim')},paid.activationId,fee)]);
  const treasuryBefore=await provider.getBalance(treasuryAddress);
  const paidSent=await submit(direct(paidPlan),owner);capture('paid claim direct',paidSent.evmReceipt);assert.equal(await paidRule.count(),1n);assert.equal(await provider.getBalance(treasuryAddress),treasuryBefore+fee);
  const paidRetry=await submit(direct(paidPlan),owner,{exactRetry:true});capture('paid exact retry',paidRetry.evmReceipt);assert.equal(await paidRule.count(),1n);assert.equal(await provider.getBalance(treasuryAddress),treasuryBefore+fee);
  const duplicate=await make([PaidClaim.item(paid.registration,{claimKey:id('claim')},paid.activationId,fee)]);await assert.rejects(submit(direct(duplicate),owner));
  const rollbackKey=id('rollback'),rollback=await make([PaidClaim.item(paid.registration,{claimKey:rollbackKey},paid.activationId,fee),Outfit.item(outfit.registration,{species:1n,shirt:2n,pants:1n},outfit.activationId)]);
  let revertedReceipt:any;
  await assert.rejects(async()=>{try {const tx=await core.execute(rollback.plan,'0x',{value:fee,gasLimit:2000000});await tx.wait();}catch(error:any){revertedReceipt=error.receipt;throw error;}});
  assert.equal(revertedReceipt.status,0);capture('mined paid then invalid Outfit rollback',revertedReceipt);
  assert.equal(await paidRule.used(rollbackKey),false);assert.equal(await paidRule.count(),1n);assert.equal(await provider.getBalance(treasuryAddress),treasuryBefore+fee);
  const oldEdit=()=>Outfit.edit(revised.registration.typeId,outfit.registration,fields,outfit.activationId);assert.throws(oldEdit,/UNKNOWN_EXACT_TYPE/);
  const newPlan=await make([OutfitV2.item(revised.registration,revFields,revised.activationId)]),newSent=await submit(direct(newPlan),owner);capture('write OutfitV2',newSent.evmReceipt);
  assert.equal((await readBack(readProvider,newSent,await pinBasis(readProvider,context))).effect,'COMMITTED');
  await (await equipRule.setAllowed(false)).wait();assert.equal(await equipRule.grandfathered(batch.predictedReceiptIds[1]),true);
  const futureEquip=await make([Equip.item(equip.registration,{outfitReceipt:batch.predictedReceiptIds[0]},equip.activationId)]);await assert.rejects(submit(direct(futureEquip),owner));
  assert.equal((await exactRead(readProvider,await pinBasis(readProvider,context),batch.predictedReceiptIds[1])).outcome,'FOUND');
  assert.equal((await readBack(readProvider,sent,{...basis,blockHash:id('wrong block')})).effect,'UNKNOWN');
  assert.equal((await verifiedBody(readProvider,{...basis,blockNumber:99999999},batch.predictedReceiptIds[0])).availability,'UNKNOWN');
  // Corrupt one transport response, not the contract: SDK must not promote bad RPC bytes.
  const originalSend=readProvider.send.bind(readProvider);
  readProvider.send=async(method:string,params:any)=>{const result=await originalSend(method,params);if(method==='eth_call'&&params[0].data.startsWith(core.interface.getFunction('getBody')!.selector)) return result.slice(0,-2)+'ff';return result;};
  assert.equal((await readBack(readProvider,sent,basis)).effect,'UNKNOWN');readProvider.send=originalSend;
  readProvider.send=async(method:string,params:any)=>{if(method==='eth_call'&&params[0].data.startsWith(core.interface.getFunction('getBody')!.selector)) throw Error('body transport unavailable');return originalSend(method,params);};
  assert.equal((await readBack(readProvider,sent,basis)).effect,'UNKNOWN');readProvider.send=originalSend;
  readProvider.send=async(method:string,params:any)=>{const result=await originalSend(method,params);if(method==='eth_call'&&params[0].data.startsWith(core.interface.getFunction('getReceipt')!.selector)){const decoded=Array.from(core.interface.decodeFunctionResult('getReceipt',result)[0]);decoded[1]=treasuryAddress;return core.interface.encodeFunctionResult('getReceipt',[decoded]);}return result;};
  assert.equal((await readBack(readProvider,sent,basis)).effect,'UNKNOWN');readProvider.send=originalSend;
  const stateTraces:Record<string,unknown>={};
  for(const name of ['register Outfit','activate Outfit','write Outfit+Equip signed relay','exact retry zero value','paid claim direct','paid exact retry','mined paid then invalid Outfit rollback','write OutfitV2']) {
   try {
    const trace=await provider.send('debug_traceTransaction',[transactionHashes[name],{tracer:'prestateTracer',tracerConfig:{diffMode:true}}]);
    if(!trace.pre||!trace.post) throw Error('prestateTracer diff response unavailable');
    const changes=[];
    for(const address of new Set([...Object.keys(trace.pre),...Object.keys(trace.post)])) {
     const pre=trace.pre[address]?.storage??{},post=trace.post[address]?.storage??{};
     for(const slot of new Set([...Object.keys(pre),...Object.keys(post)])) {
      const before=BigInt(pre[slot]??0),after=BigInt(post[slot]??0);
      if(before!==after) changes.push({address,slot,transition:before===0n?'zero-to-nonzero':after===0n?'nonzero-to-zero':'nonzero-to-nonzero'});
     }
    }
    stateTraces[name]={tracer:'prestateTracer diffMode',changedStorageSlots:changes.length,newNonzeroStorageSlots:changes.filter(c=>c.transition==='zero-to-nonzero').length,changes};
   } catch(error) {stateTraces[name]={limitation:String(error)};}
  }
  const evidence={runtime:process.version,standalone:true,gas,transactionHashes,stateTraces,readBack:{milliseconds:readMs,rpcRequests:readRequests,basis},stateAccounting:{kind:'measured address-qualified final slot diffs; excludes trie overhead and transient writes restored in the same transaction',outfitBodyBytes:96,equipBodyBytes:32,receiptFields:13},receipt:verified.reads[0].exact.receipt};
  writeFileSync(new URL('../evidence.local.json',import.meta.url),JSON.stringify(evidence,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
  const descriptors=JSON.parse(readFileSync(new URL('../generated/descriptors.json',import.meta.url),'utf8'));
  const html=inspect({typeId:outfit.registration.typeId,descriptor:descriptors.find((d:any)=>d.name==='Outfit'),body:solBody,receipt:verified.reads[0].exact.receipt,basis,effect:verified.effect});
  writeFileSync(new URL('../web/example.local.html',import.meta.url),html);
  console.log(JSON.stringify({gas,readBack:evidence.readBack,stateTraces:Object.fromEntries(Object.entries(stateTraces).map(([name,value]:[string,any])=>[name,{...value,changes:undefined}]))},(_,v)=>typeof v==='bigint'?v.toString():v));
 } finally {provider.destroy();readProvider.destroy();child.kill('SIGTERM');await new Promise<void>(r=>{if(child.exitCode!==null)r();else child.once('exit',()=>r());});}
});
