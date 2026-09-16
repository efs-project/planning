import test from 'node:test';
import assert from 'node:assert/strict';
import {loadEthers} from '../script/compact-environment.mjs';
const e=await loadEthers(),coder=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
let archive;try{archive=await import('./guarded-archive.mjs');}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
const actionType='tuple(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)';
const intentType='tuple(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash)';
const readType='tuple(bytes32[] principalIds,bytes32[] positions,bytes32[] expectedHeads)';
const executionType='tuple(bytes32 origin,uint256 revision,bytes32 shellCodeHash,address implementation,bytes32 implementationCodeHash,address registryAddress,bytes32 registryCodeHash,address indexAddress,bytes32 indexCodeHash,uint64 indexGeneration)';
const hash=(types,values)=>e.keccak256(coder.encode(types,values));
export function fixture({refTypes=[],body='0x0102'}={}){
  const author=new e.Wallet(e.toBeHex(0xA11CE,32));
  const profile={layoutId:e.id('efs.lab.ledger-layout/2:roots-0-12-preserved:context-13:execution-14:readsets-15'),
    legacyDomain:e.TypedDataEncoder.hashDomain({name:'EFS2-RoadB-Lab',version:'1'}),guardedDomain:e.TypedDataEncoder.hashDomain({name:'EFS2-RoadB-Lab',version:'2'})};
  const execution={origin:e.id('origin'),revision:'7',shellCodeHash:e.id('shell'),implementation:author.address,implementationCodeHash:e.id('implementation'),
    registryAddress:author.address,registryCodeHash:e.id('registry'),indexAddress:author.address,indexCodeHash:e.id('index'),indexGeneration:'3'};
  const reads={principalIds:[e.zeroPadValue(author.address,32),e.toBeHex(7,32)],positions:[e.id('position')],expectedHeads:[e.id('head-a'),e.id('head-b')]};
  const type={shape:e.id('shape'),ruleId:Z,refTypes,ruleCode:'0x'};
  type.typeId=hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/type/1'),type.shape,hash(['bytes32[]'],[refTypes]),Z]);
  const recordId=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),type.typeId,e.keccak256(body)]);
  const actions=[{kind:1,typeId:type.typeId,bodyHashOrRecordId:e.keccak256(body),purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z}];
  const actionsHash=hash([actionType+'[]'],[actions]);
  const intent={realmId:e.id('realm'),realmOrigin:execution.origin,executionSet:hash(['bytes32','bytes32','bytes32','bytes32',executionType],
    [e.id('efs.lab.execution-set/2'),profile.layoutId,profile.legacyDomain,profile.guardedDomain,execution]),author:author.address,nonce:'0',deadline:'1',
    acceptanceProfile:e.id('policy'),indexObligations:e.id('index'),readSetHash:hash(['bytes32',readType],[e.id('efs.lab.read-set/2:ordered-first-binding'),reads])};
  const typeHash=e.id('IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)');
  const claimId=e.keccak256(e.concat(['0x1901',profile.guardedDomain,hash(['bytes32',intentType,'bytes32'],[typeHash,intent,actionsHash])]));
  const principalId=e.zeroPadValue(author.address,32),publicationId=hash(['bytes32','bytes32','bytes32'],[e.id('efs.lab.publication/2'),principalId,claimId]);
  return {format:'efs.lab.guarded-signed-claim/2',proof:'AUTHOR_SIGNATURE_VERIFIED',profile,intent,actions,actionsHash,readSetBytes:coder.encode([readType],[reads]),
    execution,signature:author.signingKey.sign(claimId).serialized,claimId,principalId,publicationId,leafCount:1,
    bodies:[{leaf:0,present:true,body}],closure:{roots:[recordId],records:[{recordId,typeId:type.typeId,present:true,body}],types:[type],coverage:'COMPLETE'}};
}
test('offline guarded verifier derives exact signature evidence without RPC and rejects independent tamper classes',async()=>{
  assert.equal(typeof archive?.verifyGuardedClaim,'function','guarded offline verification is available');
  const x=fixture(),verify=v=>archive.verifyGuardedClaim(e,v);
  assert.equal((await verify(x)).proof,'AUTHOR_SIGNATURE_VERIFIED');
  for(const change of [v=>v.intent.author=e.ZeroAddress,v=>v.intent.realmId=e.id('other'),v=>v.actions[0].salt=e.id('changed'),
    v=>v.actions.push(v.actions[0]),v=>v.actions=[],v=>v.execution.implementation=e.ZeroAddress,v=>v.execution.implementationCodeHash=Z,
    v=>v.execution.revision='8',v=>v.profile.guardedDomain=v.profile.legacyDomain,v=>v.signature='0x',v=>v.proof='NATIVE_STATE_PROOF',
    v=>v.format='efs.lab.native-proof/2',v=>v.bodies[0].body='0x02',v=>delete v.bodies[0].body,v=>v.bodies.push(v.bodies[0]),
    v=>v.bodies=[],v=>v.closure.records[0].typeId=Z,v=>v.closure.types[0].shape=Z,v=>v.closure.records=[],
    v=>{const r=coder.decode([readType],v.readSetBytes)[0];v.readSetBytes=coder.encode([readType],[[[...r[0]].reverse(),r[1],r[2]]]);}]){
    const changed=structuredClone(x);change(changed);await assert.rejects(verify(changed));
  }
  const missing=fixture();missing.bodies[0]={leaf:0,present:false};missing.closure.records[0].present=false;delete missing.closure.records[0].body;missing.closure.coverage='PARTIAL';
  assert.equal((await verify(missing)).bodyCoverage,'PARTIAL');
  missing.closure.coverage='COMPLETE';await assert.rejects(verify(missing),/COVERAGE/);
});
test('final six argument guarded ABI admits exactly bounded maximal padding and refuses one byte over',async()=>{
  assert.equal(typeof archive?.encodeGuardedRetention,'function');
  const x=fixture(),r={principalIds:Array.from({length:64},(_,i)=>e.toBeHex(i+1,32)),positions:Array.from({length:4},(_,i)=>e.toBeHex(i+100,32)),expectedHeads:Array(256).fill(Z)};
  x.readSetBytes=coder.encode([readType],[r]);x.actions=Array(64).fill(x.actions[0]);
  x.bodies=Array.from({length:64},(_,leaf)=>({leaf,present:true,body:leaf?'0x01':'0x'+'01'.repeat(8129)}));
  const iface=new e.Interface([`function retainGuardedSignedClaim(${intentType},${actionType}[],${readType},${executionType},bytes,tuple(uint16 leaf,bytes body)[])`]);
  const expected=iface.encodeFunctionData('retainGuardedSignedClaim',[x.intent,x.actions,r,x.execution,x.signature,x.bodies.map(({leaf,body})=>({leaf,body}))]);
  assert.equal(e.getBytes(expected).length,48292);assert.equal(e.getBytes(x.readSetBytes).length,10592);
  assert.equal(archive.encodeGuardedRetention(e,x),expected);
  x.bodies[0].body+='01';assert.throws(()=>archive.encodeGuardedRetention(e,x),/BODY_BOUNDS/);
});
test('guarded source and archive cold readers are distinct from journal recovery',()=>{
  assert.equal(typeof archive?.createGuardedArchiveReader,'function','cold retained-state reader exists');
});
test('a signed never-admitted claim cannot omit a zero-valued declared Record reference',async()=>{
  const x=fixture({refTypes:[Z],body:Z});
  assert.equal(e.recoverAddress(x.claimId,x.signature),x.intent.author,'real signature over the exact malformed reference claim');
  await assert.rejects(archive.verifyGuardedClaim(e,x),/ARCHIVE_REFERENCE_MISSING/);
  x.closure.records.push({recordId:Z,typeId:Z,present:false,reason:'RECORD_UNAVAILABLE'});
  x.closure.coverage='PARTIAL';
  const result=await archive.verifyGuardedClaim(e,x);
  assert.equal(result.proof,'AUTHOR_SIGNATURE_VERIFIED');
  assert.equal(result.sourceAdmission,'NOT_PROVEN');
  assert.equal(result.closureCoverage,'PARTIAL');
  assert.deepEqual(result.missingMeaning,[`record:${Z}`]);
});
test('absent-Type partial claim verification enforces supplied code bounds without requiring missing preimages',async()=>{
  const x=fixture();x.closure.types[0].present=false;delete x.closure.types[0].ruleCode;x.closure.coverage='PARTIAL';
  assert.equal((await archive.verifyGuardedClaim(e,x)).closureCoverage,'PARTIAL','an absent unsupplied rule preimage remains valid partial evidence');
  const oversized=structuredClone(x);oversized.closure.types[0].ruleCode='0x'+'00'.repeat(4_194_305);
  await assert.rejects(archive.verifyGuardedClaim(e,oversized),/TYPE_SIDECAR_BOUNDS/);
  const aggregate=structuredClone(x);
  aggregate.closure.types.push(...Array.from({length:171},(_,i)=>({typeId:e.toBeHex(i+1,32),present:false,ruleCode:'0x'+'00'.repeat(24576)})));
  await assert.rejects(archive.verifyGuardedClaim(e,aggregate),/TYPE_SIDECAR_AGGREGATE_BOUNDS/);
  const present=fixture();delete present.closure.types[0].ruleCode;
  await assert.rejects(archive.verifyGuardedClaim(e,present),/TYPE_SIDECAR_BOUNDS/,'present Types must still supply their rule-code preimage');
});
