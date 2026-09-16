import test from 'node:test';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {verifyContractSignatureBundle,BUNDLE} from './contract-signature-evidence.mjs';
import {ACTION,INTENT,READ_SET,EXECUTION,archiveProfile} from './guarded-archive.mjs';
const e=await import(pathToFileURL(`${process.env.EFS_ETHERS_PATH}/lib.esm/index.js`)),coder=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
const hash=(t,v)=>e.keccak256(coder.encode(t,v)),addr=n=>e.getAddress(e.toBeHex(n,20));
function fixture(){
  const origin=hash(['bytes32','uint256','address'],[e.id('efs.lab.realm-origin/2'),31337,addr(1)]);
  const execution={origin,revision:1,shellCodeHash:e.id('shell'),implementation:addr(3),implementationCodeHash:e.id('implementation'),registryAddress:addr(4),registryCodeHash:e.id('registry'),indexAddress:addr(5),indexCodeHash:e.id('index'),indexGeneration:1};
  const p=archiveProfile(e),set=hash(['bytes32','bytes32','bytes32','bytes32',EXECUTION],[e.id('efs.lab.execution-set/2'),p.layoutId,p.legacyDomain,p.guardedDomain,execution]);
  const rs={principalIds:[],positions:[],expectedHeads:[]},actions=[{kind:5,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:e.id('file')}];
  const intent={realmId:e.id('realm'),realmOrigin:origin,executionSet:set,author:addr(2),nonce:0,deadline:100,acceptanceProfile:e.id('acceptance'),indexObligations:e.id('index'),readSetHash:hash(['bytes32',READ_SET],[e.id('efs.lab.read-set/2:ordered-first-binding'),rs])};
  const encoded=coder.encode([ACTION+'[]'],[actions]);
  const digest=e.keccak256(e.concat(['0x1901',p.guardedDomain,hash(['bytes32',INTENT,'bytes32'],[e.id('IntentV2(bytes32 realmId,bytes32 realmOrigin,bytes32 executionSet,address author,uint64 nonce,uint64 deadline,bytes32 acceptanceProfile,bytes32 indexObligations,bytes32 readSetHash,bytes32 actionsHash)'),intent,e.keccak256(encoded)])]));
  const profile=e.id('efs.lab.erc1271/1:ordinary-deployed:4096:300000:static:exact32:pre-publication'),walletCodehash=e.id('wallet');
  const evidenceHash=hash(['bytes32','address','address','uint64','bytes32','bytes32','bytes32','bytes32'],[e.id('efs.lab.contract-signature-evidence/1'),addr(6),addr(1),1,digest,profile,walletCodehash,e.keccak256('0x')]);
  return {context:{chainId:31337,ledger:addr(1),publication:1,firstAdmission:1,basis:10,intent,execution,store:addr(6),walletCodehash,evidenceHash},actions:encoded,reads:coder.encode([READ_SET],[rs]),signature:'0x'};
}
// Break caught: opaque bytes are forced through ECDSA or packet assertions gain trust.
test('authentic empty bytes retain unverified grade without independent acceptance anchor',()=>{
  const b=fixture(),r=verifyContractSignatureBundle(e,b);
  assert.equal(r.grade,'RETAINED_UNVERIFIED_SOURCE');assert.equal(r.authority,'NONE');
  assert.equal(r.packetHash,hash([BUNDLE],[b]));assert.equal(r.signatureBytes,0);
});
test('packet self-asserted grades are ignored and independently selected anchor binds exact packet',()=>{
  const b=fixture();b.grade='PINNED_LOCAL_LEDGER_ACCEPTED';b.acceptanceAnchor={trusted:true};
  assert.equal(verifyContractSignatureBundle(e,b).grade,'RETAINED_UNVERIFIED_SOURCE');
  const c=b.context,anchor={profile:'efs.lab.local-1271-acceptance/1',packetHash:hash([BUNDLE],[b]),ledger:c.ledger,chainId:c.chainId,
    executionSet:c.intent.executionSet,implementation:c.execution.implementation,implementationCodeHash:c.execution.implementationCodeHash,
    store:c.store,storeCodeHash:e.id('reviewed store'),archive:addr(7),archiveCodeHash:e.id('reviewed archive')};
  assert.equal(verifyContractSignatureBundle(e,b,{acceptanceAnchor:anchor}).grade,'PINNED_LOCAL_LEDGER_ACCEPTED');
  for(const [key,value] of [['packetHash',Z],['ledger',addr(88)],['executionSet',Z],['implementation',addr(88)],['implementationCodeHash',Z],['store',addr(88)]])
    assert.throws(()=>verifyContractSignatureBundle(e,b,{acceptanceAnchor:{...anchor,[key]:value}}),/ACCEPTANCE_ANCHOR/);
});
test('mutated signature, missing bytes, context, action, read and execution joins refuse',()=>{
  for(let i=0;i<8;i++){
    const b=fixture();
    if(i===0)b.signature='0x01';if(i===1)delete b.signature;if(i===2)b.context.walletCodehash=Z;
    if(i===3)b.context.store=addr(9);if(i===4)b.context.ledger=addr(9);if(i===5)b.context.execution.implementation=addr(9);
    if(i===6)b.actions=b.actions.slice(0,-2)+'ff';if(i===7)b.reads='0x';
    assert.throws(()=>verifyContractSignatureBundle(e,b),/ERC1271_/);
  }
});
