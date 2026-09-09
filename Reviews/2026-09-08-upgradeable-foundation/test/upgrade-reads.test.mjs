import test from 'node:test';
import assert from 'node:assert/strict';
import { compileUpgrade, withUpgrade } from '../scripts/local-upgrade.mjs';
import { readUpgradeState, verifyUpgradeState } from '../reference/upgrade-reader.mjs';
import { resolveUpgradeLens } from '../reference/upgrade-lens-resolver.mjs';
import { PLAN_TYPE, PROFILE } from '../../2026-09-05-c0-core/reference/lens-resolver.mjs';
import { publication, groupLeaf, word, domain } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { HEADER, ordinaryRecord, foldAdmissions } from '../../2026-09-05-c0-core/reference/state-reader.mjs';
import { AbiCoder, Interface, ZeroHash, keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseGroup } from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';

const abi = AbiCoder.defaultAbiCoder();
const concat = (...xs) => '0x' + xs.map(x => x.replace(/^0x/, '')).join('');
const pin = state => ({blockHash:state.basis.hash,requireCanonical:true});
const plain = x => x?.toArray ? x.toArray(true) : x;
const checked = async lab => {const s=await readUpgradeState(lab);assert.equal(s.outcome,'VERIFIED',s.reason);return s;};
const retained = s => Object.fromEntries(['bootstrap','counts','records','types','envelopes','principals','admissions','batches','bindings','postings','occurrences'].map(k=>[k,s.snapshot[k].map(x=>x && typeof x==='object'?{...x,pin:undefined}:x)]));
const tuple = r => [BigInt(r.presence),BigInt(r.reasonCode),[BigInt(r.target.targetKind),r.target.targetA,BigInt(r.target.targetLeaf)],BigInt(r.winnerIndex),BigInt(r.winnerTier),r.winnerAdmissionOrdinal,BigInt(r.presentCount),BigInt(r.agreeCount),[r.basis.realmRevisionId,r.basis.blockNumber,r.basis.admissionHigh,BigInt(r.basis.basisKind)]];
const headTuple = h => h?[BigInt(h.state),BigInt(h.targetKind),BigInt(h.cause),h.revision,h.ordinal,h.target,BigInt(h.targetLeaf)]:[0n,0n,0n,0n,0n,ZeroHash,0n];

// Independent canonical input encoder; does not call the model/parser or host.
function planBody(entries,{combiner=0,k=0,profile=PROFILE}={}) {
  const b=Buffer.alloc(98+64*entries.length);b.writeUInt16BE(b.length-2);b[2]=1;b[3]=combiner;
  b.writeUInt16BE(k,6);b.writeUInt16BE(entries.length,8);Buffer.from(profile.slice(2),'hex').copy(b,66);
  entries.forEach((e,i)=>{Buffer.from(e.principal.slice(2),'hex').copy(b,98+64*i);b.writeUInt16BE(e.tier??0,130+64*i);});
  return '0x'+b.toString('hex');
}
const artifact = (file,name=file) => JSON.parse(readFileSync(new URL('../out/'+file+'.sol/'+name+'.json',import.meta.url)));
function blobs(hex) {
  const b=Buffer.from(hex.slice(2),'hex'),out=[];let at=2;
  for(let i=0;i<b.readUInt16BE(0);i++){const n=b.readUInt16BE(at);at+=2;out.push('0x'+b.subarray(at,at+n).toString('hex'));at+=n;}
  assert.equal(at,b.length);return out;
}

// Break: selecting reads silently deploys the raw base host.
test('reads profile exposes guarded current execution context', {timeout:300000}, async () => {
  compileUpgrade();
  await withUpgrade(async lab => {
    assert(lab.readIface, 'new read profile ABI');
    const raw = await lab.rpc('eth_call', [{to:lab.core,
      data:lab.readIface.encodeFunctionData('fixtureReadContext',[])}, 'latest']);
    assert.equal(lab.readIface.decodeFunctionResult('fixtureReadContext',raw)[1], 1n);
  }, {profile:'reads'});
});

test('profile selection is closed before deployment', async () => {
  for(const profile of ['read','',null,'toString',new String('reads')])await assert.rejects(withUpgrade(()=>assert.fail('must not deploy'),{profile}),/unknown upgrade profile/);
});

test('reads profile stops its chain when the consumer fails', async () => {
  let cleanup;
  await assert.rejects(withUpgrade(async lab=>{cleanup=lab.cleanup;throw Error('intentional consumer failure');},{profile:'reads'}),/intentional consumer failure/);
  assert(cleanup.stopped,'exception cleanup is observable');
});

// Breaks: stale current basis, trusted forged fold, incomplete linkage, inherited
// raw counts overload ambiguity, or rewriting old acceptance into the observer.
test('populated U1/U2/U3 full reads, adversarial observations, and normal resources', {timeout:300000}, async t => {
  const report={measurements:[],admissions:[]};
  await withUpgrade(async lab => {
    report.resources=lab.resources;report.cleanup=lab.cleanup;report.expected=lab.expected;
    const raw=async(name,args=[],at='latest')=>lab.rpc('eth_call',[{to:lab.core,data:lab.readIface.encodeFunctionData(name,args)},at]);
    const call=async(name,args=[],at='latest')=>plain(lab.readIface.decodeFunctionResult(name,await raw(name,args,at)));
    assert.equal(lab.readIface.getFunction('getReceipt'),null,'no false historical receipt facade');
    assert.equal(lab.iface.getFunction('counts').inputs.length,0,'collector raw ABI remains unambiguous');
    for(const [getter,value] of Object.entries({pointReadLibrary:lab.expected.components.PointReadLibrary.address,pointReadCodehash:keccak256(lab.expected.components.PointReadLibrary.code),queryReadLibrary:lab.expected.components.UpgradeQueryReadLibrary.address,queryReadCodehash:keccak256(lab.expected.components.UpgradeQueryReadLibrary.code)}))assert.equal((await call(getter))[0].toLowerCase(),value.toLowerCase());
    const old=new Interface(JSON.parse(readFileSync(new URL('../../2026-09-05-c0-core/out/LensReadHarness.sol/LensReadHarness.json',import.meta.url))).abi);
    for(const name of ['getTypeSchema','getTypeOrigin','intrinsicTypeGroupBytes','getRecord','getEnvelope','getOccurrence','getOccurrenceByOrdinal','getBindingHead','getBindingAtBasis','readHistory','pagePostings','pagePostingsHydrated','counts(bytes32,uint8,uint8,bytes32)','resolve','resolveStrict','validatePlan','deriveBindingKey']) {
      const shape=f=>[f.selector,f.inputs.map(p=>p.format('sighash')),f.outputs.map(p=>p.format('sighash')),f.stateMutability];
      assert.deepEqual(shape(lab.readIface.getFunction(name)),shape(old.getFunction(name)),name+' preserved tuple ABI');
    }
    let nonce=1000;
    const admit=async(leaves,options={})=>{const p=publication(leaves,nonce++,options);const r=await lab.publish(p);assert.equal(r.receipt.status,'0x1');report.admissions.push({envelope:p.envelopeId,gas:BigInt(r.receipt.gasUsed).toString()});return p;};
    const types=Object.fromEntries(lab.inputs.candidates.groups.flatMap(g=>g.members.map(m=>[m.descriptor.name,m.temporaryTypeSchemaId])));
    const groupPublications=[];
    for(const g of lab.inputs.candidates.groups)groupPublications.push(await admit([groupLeaf(lab.inputs.meta,'0x'+g.groupHex)]));
    const author=word(1),other=word((1n<<200n)+1n);
    assert.equal(author.slice(-40),other.slice(-40));
    const objects=await admit([100,101].map(n=>({typeId:types['ObjectGenesis/1'],body:concat(author,word(n),'00')})));
    // Real root/file facts, not a seeded Store or directory interpretation claim.
    const rootBody=concat(author,word(102),'01',domain('efs2/files/meaning/directory/1'));
    const fileBody=concat(author,word(103),'01',domain('efs2/files/meaning/file/1'));
    const rootId=ordinaryRecord(types['ObjectGenesis/1'],rootBody),fileId=ordinaryRecord(types['ObjectGenesis/1'],fileBody);
    await admit([{typeId:types['ObjectGenesis/1'],body:rootBody},{typeId:types['ObjectGenesis/1'],body:fileBody},{typeId:types['DirectoryEntry/1'],body:concat(rootId,'00086e6f74652e747874',fileId,'00')}]);
    const purpose=word(201),subject=objects.recordIds[0],role=word(202);
    const position=keccak256(concat(domain('efs2/position/1'),purpose,subject,role));
    const key=a=>keccak256(concat(domain('efs2/binding/1'),a,position));
    assert.notEqual(key(author),key(other));
    const set=async(a,target,leaf=null,previous=null,revision=0)=>admit([{typeId:types['BindingSet/1'],body:concat(purpose,subject,role,leaf===null?concat('01',target,'00'):concat('0001',target,leaf.toString(16).padStart(4,'0')),previous?concat('01',previous.envelopeId,'0000'):'00')}],{principal:a,revisions:[[0,revision]]});
    const makePlan=async(entries,options)=>{const p=await admit([{typeId:PLAN_TYPE,body:planBody(entries,options)}]);return p.recordIds[0];};
    let first=await set(author,objects.recordIds[0]);
    let second=await set(other,objects.recordIds[1]);
    const controls=[
      ['A-first',await makePlan([{principal:author,tier:0},{principal:other,tier:1}],{combiner:1}),1,objects.recordIds[0]],
      ['B-first',await makePlan([{principal:other,tier:0},{principal:author,tier:1}],{combiner:1}),1,objects.recordIds[1]],
      ['EXACT',await makePlan([{principal:author},{principal:other}]),3,null],
      ['THRESHOLD',await makePlan([{principal:author},{principal:other}],{combiner:2,k:2}),2,null]
    ];
    async function compare(state,id,label) {
      const model=resolveUpgradeLens(state,lab.expected,id,position);
      assert.equal(model.outcome,'VERIFIED',model.reason);
      const actual=(await call('resolve',[id,position],pin(state)))[0];
      assert.deepEqual(actual,tuple(model.value),label+' exact independent full B0');return model.value;
    }
    let state=await checked(lab);
    for(const [label,id,presence,target] of controls){const r=await compare(state,id,label);assert.equal(r.presence,presence);if(target)assert.equal(r.target.targetA,target);}
    // Kind/A/leaf agreement must use all fields, including two leaves of one Envelope.
    first=await set(author,objects.envelopeId,0,first,1);second=await set(other,objects.envelopeId,1,second,1);
    state=await checked(lab);assert.equal((await compare(state,controls[2][1],'distinct leaf conflict')).presence,3);
    const occurrencePlan=await makePlan([{principal:author}]);state=await checked(lab);
    const occurrence=await compare(state,occurrencePlan,'exact occurrence');assert.deepEqual(occurrence.target,{targetKind:2,targetA:objects.envelopeId,targetLeaf:0});
    const strict=await call('resolveStrict',[occurrencePlan,position,2],pin(state));assert.deepEqual(strict,[tuple(occurrence)[2],tuple(occurrence)]);
    await assert.rejects(call('resolveStrict',[occurrencePlan,position,4],pin(state)));
    const unsupported=await makePlan([{principal:author}],{profile:domain('unknown/profile')});
    const malformed=Buffer.from(planBody([{principal:author}]).slice(2),'hex');malformed[2]=2;
    const malformedId=(await admit([{typeId:PLAN_TYPE,body:'0x'+malformed.toString('hex')}])).recordIds[0];
    state=await checked(lab);assert.equal((await compare(state,unsupported,'unknown profile')).presence,4);
    assert.deepEqual(await call('validatePlan',[malformedId],pin(state)),[false,3n]);
    await assert.rejects(call('resolve',[malformedId,position],pin(state)));
    assert.equal(resolveUpgradeLens(state,lab.expected,malformedId,position).value.rejectCode,3);
    assert.equal(resolveUpgradeLens(state,lab.expected,ZeroHash,position).value.reasonCode,5);
    assert.equal(resolveUpgradeLens(null,lab.expected,ZeroHash,position).outcome,'UNKNOWN');
    // 64 real distinct authors agree; Plans of 1/8/32/64 are ordinary admissions.
    const authors=Array.from({length:64},(_,i)=>word(1000+i));
    for(const a of authors)await set(a,objects.recordIds[0]);
    const plans=[];for(const n of [1,8,32,64])plans.push([n,await makePlan(authors.slice(0,n).map(principal=>({principal})))]);
    const consumerArtifact=artifact('UpgradeReads.t','UpgradeStaticConsumer');
    assert.deepEqual(consumerArtifact.bytecode.linkReferences,{});assert.deepEqual(consumerArtifact.deployedBytecode.linkReferences,{});
    const deployed=await lab.receipt(await lab.send(consumerArtifact.bytecode.object), 'STATICCALL consumer');assert.equal(deployed.status,'0x1');
    const consumer=deployed.contractAddress,consumerIface=new Interface(consumerArtifact.abi);
    assert.equal(await lab.rpc('eth_getCode',[consumer,deployed.blockNumber]),consumerArtifact.deployedBytecode.object);
    report.consumer={address:consumer,runtimeBytes:(consumerArtifact.deployedBytecode.object.length-2)/2,initcodeBytes:(consumerArtifact.bytecode.object.length-2)/2,deploymentGas:BigInt(deployed.gasUsed),codehash:keccak256(consumerArtifact.deployedBytecode.object)};
    async function measure(label,name,args,state) {
      const data=lab.readIface.encodeFunctionData(name,args),out=await raw(name,args,pin(state));
      const wrapped=consumerIface.encodeFunctionData('read',[lab.core,data]);
      const answer=consumerIface.decodeFunctionResult('read',await lab.rpc('eth_call',[{to:consumer,data:wrapped},pin(state)]));
      assert.equal(answer[0],out,'real STATICCALL exact returndata');
      const tx=await lab.receipt(await lab.send(data,lab.core),'read '+label);assert.equal(tx.status,'0x1');
      const staticTx=await lab.receipt(await lab.send(wrapped,consumer),'STATICCALL '+label);assert.equal(staticTx.status,'0x1');
      report.measurements.push({label,name,basis:state.basis,execution:state.execution.history.at(-1).id,calldataBytes:(data.length-2)/2,returndataBytes:(out.length-2)/2,transactionGas:BigInt(tx.gasUsed),staticcallWork:answer[1],staticTransactionGas:BigInt(staticTx.gasUsed)});
    }
    async function fullReads(s) {
      const at=pin(s),e=s.execution.history.at(-1),H=BigInt(s.counts[4]);
      assert.deepEqual(await call('fixtureReadContext',[],at),[e.id,BigInt(e.ordinal),BigInt(s.basis.number),H]);
      assert.deepEqual(await call('intrinsicTypeGroupBytes',[],at),[lab.inputs.init.intrinsicGroupBytes]);
      assert.deepEqual(await call('getTypeOrigin',[lab.inputs.meta],at),[ZeroHash,0n,true]);
      assert.deepEqual(await call('getTypeSchema',[lab.inputs.meta],at),[blobs(lab.inputs.init.intrinsicGroupBytes)[0],1n,0n,0n,0n]);
      const knownTypes=[lab.inputs.meta];let typeOrdinal=2n;
      for(const [i,g] of lab.inputs.candidates.groups.entries()) {
        const rawGroup='0x'+g.groupHex,parsed=parseGroup(Buffer.from(g.groupHex,'hex'),{knownTypes}),schemaBlobs=blobs(rawGroup);
        for(const [j,id] of parsed.ids.entries()) {
          assert.deepEqual(await call('getTypeSchema',[id],at),[schemaBlobs[j],typeOrdinal++,BigInt(i+1),BigInt(parsed.members[j].roles.length),BigInt(parsed.members[j].indexes.length)]);
          assert.deepEqual(await call('getTypeOrigin',[id],at),[groupPublications[i].recordIds[0],BigInt(j),false]);knownTypes.push(id);
        }
      }
      assert.deepEqual(await call('getTypeSchema',[ZeroHash],at),['0x',0n,0n,0n,0n]);
      for(const row of s.snapshot.records)assert.deepEqual(await call('getRecord',[row.id],at),[row.row[0],row.row[1],BigInt(row.row[3])]);
      for(const entry of s.entries) {
        const life=s.fold.lifecycle.get(entry.envelopeId+':'+entry.leaf);
        assert.deepEqual(await call('getOccurrence',[entry.envelopeId,entry.leaf],at),[BigInt(life.status),entry.ordinal,entry.recordId,entry.typeId,entry.principal,life.withdrawal]);
        assert.deepEqual(await call('getOccurrenceByOrdinal',[entry.ordinal],at),[entry.envelopeId,BigInt(entry.leaf),entry.recordId,entry.typeId,entry.principal,BigInt(life.status),life.withdrawal]);
        assert(s.batchByOrdinal.get(entry.ordinal.toString())??s.batchByOrdinal.get(entry.ordinal),'independent historical acceptance remains available');
      }
      for(const row of s.snapshot.envelopes) {
        const [header,ids]=abi.decode([HEADER,'bytes32[]'],row.row[0]);
        assert.deepEqual(await call('getEnvelope',[row.id],at),[row.row[0],BigInt(row.row[1]),BigInt(ids.length),header.principalId,header.notAfter]);
      }
      for(const [k,h] of s.fold.bindings) {
        assert.deepEqual(await call('getBindingHead',[k],at),[headTuple(h),e.id,H]);
        assert.deepEqual(await call('getBindingAtBasis',[k,H],at),[headTuple(h),e.id,H]);
      }
      const h=s.fold.bindings.get(key(author));
      const history=await call('readHistory',[key(author),1,64],at);
      const source=s.entries.find(x=>x.envelopeId===first.envelopeId);
      assert.deepEqual(history[0].at(-1),[h.revision,h.ordinal,source.envelopeId,BigInt(source.leaf),1n,0n]);assert.equal(history[1],0n);assert.equal(history[2],1n);
      const ordinals=s.fold.histories.get(key(author));
      assert.deepEqual(history[0],ordinals.map((ordinal,i)=>{const entry=s.entries[Number(ordinal)-1],life=s.fold.lifecycle.get(entry.envelopeId+':'+entry.leaf);return[BigInt(i+1),ordinal,entry.envelopeId,BigInt(entry.leaf),BigInt(life.status),life.withdrawal];}));
      const firstH=ordinals[0],historical=foldAdmissions(s.entries.filter(x=>x.ordinal<=firstH),{set:types['BindingSet/1'],tombstone:types['BindingTombstone/1'],withdrawal:types['Withdrawal/1']});
      assert.deepEqual(await call('getBindingAtBasis',[key(author),firstH],at),[headTuple(historical.bindings.get(key(author))),e.id,firstH]);
      const expectedItems=ordinals.map(word),hydrated=ordinals.map(ordinal=>{const x=s.entries[Number(ordinal)-1],life=s.fold.lifecycle.get(x.envelopeId+':'+x.leaf);return[ordinal,x.envelopeId,BigInt(x.leaf),x.recordId,x.principal,BigInt(life.status),life.withdrawal];});
      const end=(1n<<256n)-1n;
      assert.deepEqual(await call('pagePostings',[ZeroHash,8,0,key(author),[0,8,0]],at),[[e.id,H,end,expectedItems,2n,1n]]);
      assert.deepEqual(await call('pagePostingsHydrated',[ZeroHash,8,0,key(author),[0,8,0]],at),[[e.id,H,end,expectedItems,2n,1n],hydrated]);
      assert.deepEqual(await call('pagePostingsHydrated',[ZeroHash,8,0,key(author),[0,8,firstH]],at),[[e.id,firstH,end,[expectedItems[0]],1n,1n],[hydrated[0]]]);
      assert.deepEqual(await call('counts(bytes32,uint8,uint8,bytes32)',[ZeroHash,8,0,key(author)],at),[2n,2n,h.ordinal,e.id,H]);
      const unsupportedPage=(await call('pagePostings',[ZeroHash,9,0,ZeroHash,[0,1,0]],at))[0];assert.deepEqual(unsupportedPage,[e.id,H,0n,[],0n,3n]);
      for(const [n,id] of plans){const result=await compare(s,id,'agreement '+n);assert.equal(result.agreeCount,n);assert.equal(result.target.targetA,objects.recordIds[0]);}
    }
    const u1=await checked(lab);report.snapshots={u1:u1.snapshot};await fullReads(u1);
    const pageArgs=[ZeroHash,8,0,key(author),[0,1,0]];
    const oldRaw=(await call('pagePostings',pageArgs,pin(u1)))[0];
    const oldHyd=(await call('pagePostingsHydrated',pageArgs,pin(u1)))[0];
    const continuation=(page)=>[ZeroHash,8,0,key(author),[page[2],1,page[1]]];
    const rawContinuation=await raw('pagePostings',continuation(oldRaw),pin(u1));
    const hydContinuation=await raw('pagePostingsHydrated',continuation(oldHyd),pin(u1));
    assert.equal(oldRaw[5],2n);assert.equal(oldHyd[5],2n);assert.notEqual(oldRaw[2],oldHyd[2]);
    for(const [n,id] of plans)await measure('U1 agreement '+n,'resolve',[id,position],u1);
    for(const name of ['pagePostings','pagePostingsHydrated'])await measure('U1 '+name,name,pageArgs,u1);
    assert.deepEqual(retained(await checked(lab)),retained(u1),'ordinary and static read transactions write no retained state');
    assert.equal((await lab.upgrade()).receipt.status,'0x1');const u2=await checked(lab);report.snapshots.u2=u2.snapshot;
    assert.deepEqual(retained(u2),retained(u1));assert.equal(u2.counts[4],u1.counts[4]);assert.notEqual(u2.execution.history.at(-1).id,u1.execution.history.at(-1).id);
    await fullReads(u2);
    for(const [name,page] of [['pagePostings',oldRaw],['pagePostingsHydrated',oldHyd]])await assert.rejects(call(name,continuation(page)),e=>e.data===lab.readIface.encodeErrorResult('ErrPageCursor',[page[2]]));
    assert.equal(await raw('pagePostings',continuation(oldRaw),pin(u1)),rawContinuation);assert.equal(await raw('pagePostingsHydrated',continuation(oldHyd),pin(u1)),hydContinuation);
    for(const [n,id] of plans)await measure('U2 agreement '+n,'resolve',[id,position],u2);
    for(const name of ['pagePostings','pagePostingsHydrated'])await measure('U2 '+name,name,pageArgs,u2);
    assert.deepEqual(retained(await checked(lab)),retained(u2));
    await admit([{typeId:types['ObjectGenesis/1'],body:concat(author,word(9998),'00')}]);
    const u2Accepted=await checked(lab);report.snapshots.u2Accepted=u2Accepted.snapshot;
    assert.equal((BigInt(u2Accepted.snapshot.batches.at(-1).row[0])>>112n)&0xffffffffn,2n,'new U2 acceptance retains revision 2');
    await assert.rejects(lab.upgrade({migrate:0}),/migrate must be boolean/);
    const u2page=(await call('pagePostings',pageArgs))[0];
    assert.equal((await lab.upgrade({migrate:false})).receipt.status,'0x1');const u3=await checked(lab);report.snapshots.u3=u3.snapshot;
    assert.equal(u3.counts[4],u2Accepted.counts[4]);assert.notEqual(u3.execution.history.at(-1).id,u2Accepted.execution.history.at(-1).id);
    await assert.rejects(call('pagePostings',continuation(u2page)));await fullReads(u3);
    // U2 implementation after repeated activation accepts new facts at revision 3.
    await admit([{typeId:types['ObjectGenesis/1'],body:concat(author,word(9999),'00')}]);
    const final=await checked(lab);report.snapshots.final=final.snapshot;
    assert.deepEqual(final.snapshot.batches.slice(0,u1.snapshot.batches.length).map(x=>x.row),u1.snapshot.batches.map(x=>x.row));
    assert.equal((BigInt(final.snapshot.batches.at(-1).row[0])>>112n)&0xffffffffn,3n);
    assert.equal(verifyUpgradeState(final.snapshot,lab.expected).outcome,'VERIFIED');
    const id=plans[0][1];
    assert.deepEqual(resolveUpgradeLens({...final,fold:{bindings:new Map()}},lab.expected,id,position).value,resolveUpgradeLens(final,lab.expected,id,position).value,'forged fold ignored');
    for(const mutate of [s=>delete s.execution,s=>s.execution.history.pop(),s=>s.execution.endpoints.core.pin=ZeroHash,s=>s.records[0].row[1]='0x',s=>s.components.PointReadLibrary.code='0x']) {
      const forged=structuredClone(final);mutate(forged.snapshot);assert.notEqual(resolveUpgradeLens(forged,lab.expected,id,position).outcome,'VERIFIED');
    }
    const wrong=structuredClone(lab.expected);wrong.components.UpgradeQueryReadLibrary.code='0x';assert.notEqual(resolveUpgradeLens(final,wrong,id,position).outcome,'VERIFIED');
    // Seeded environment corruption, separately labeled; never measured as normal reads.
    const pureExpected=key(author);
    for(const [component,roleNumber] of [['PointReadLibrary',1],['UpgradeQueryReadLibrary',2],['PreparationHelper',null]])for(const code of ['0x','0x60006000fd']) {
      const saved=await lab.rpc('evm_snapshot');
      try {
        await lab.rpc('anvil_setCode',[lab.expected.components[component].address,code]);
        for(const [name,args] of [['getRecord',[ZeroHash]],['resolve',[ZeroHash,position]],['pagePostings',[ZeroHash,9,0,ZeroHash,[1,0,0]]],['fixtureReadContext',[]]])await assert.rejects(call(name,args),e=>roleNumber===null || e.data===lab.readIface.encodeErrorResult('ReadCodeMismatch',[roleNumber]));
        assert.deepEqual(await call('deriveBindingKey',[author,position]),[pureExpected]);
      } finally {assert(await lab.rpc('evm_revert',[saved]));}
    }
    const implementationSlot='0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc',adminSlot='0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
    const controlSlot=BigInt(keccak256(word(BigInt(domain('efs.fixture.control'))-1n)))&~255n;
    for(const [address,slot,value] of [[lab.core,adminSlot,word(1)],[lab.carrier,implementationSlot,word(BigInt(u1.execution.history[0].carrierImplementation))],[lab.core,word(controlSlot),word(1)],[lab.core,word(controlSlot+1n),word(1)]]) {
      const saved=await lab.rpc('evm_snapshot');try {await lab.rpc('anvil_setStorageAt',[address,slot,value]);await assert.rejects(call('fixtureReadContext'));} finally {assert(await lab.rpc('evm_revert',[saved]));}
    }
    report.transactions=lab.transactions;report.collection={state:final.snapshot.stats,execution:final.snapshot.execution.collection};
  },{profile:'reads'});
  assert(report.cleanup.stopped,'managed chain stopped');
  if(process.env.EFS_UPGRADE_READ_REPORT)writeFileSync(process.env.EFS_UPGRADE_READ_REPORT,JSON.stringify(report,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n');
  t.diagnostic(JSON.stringify({measurements:report.measurements,cleanup:report.cleanup},(_,v)=>typeof v==='bigint'?String(v):v));
});
