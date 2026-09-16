import test from 'node:test';
import assert from 'node:assert/strict';
import {loadEthers} from '../script/compact-environment.mjs';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {fabricatedRootPacket,packetValues} from '../script/native-proof-fixtures.mjs';
const e=await loadEthers();
const m=await import('./native-proof.mjs').catch(err=>{if(err.code==='ERR_MODULE_NOT_FOUND')return {};throw err;});
// A missing inclusion check, raw rather than secure hashing, accepted surplus
// proof, or noncanonical RLP must each make these behavioral tests fail.
test('positive secure inclusion consumes the exact leaf and refuses wrong keys and trailing nodes',()=>{
  assert.equal(typeof m.positiveStorage,'function','native positive verifier is missing');
  const key=e.toBeHex(17,32),path=e.concat(['0x20',e.keccak256(key)]);
  const leaf=e.encodeRlp([path,e.encodeRlp('0x01')]),root=e.keccak256(leaf);
  assert.equal(m.positiveStorage(e,root,key,[leaf]),1n);
  assert.throws(()=>m.positiveStorage(e,root,e.toBeHex(18,32),[leaf]));
  assert.throws(()=>m.positiveStorage(e,root,key,[leaf,leaf]));
  assert.throws(()=>m.positiveStorage(e,root,key,[]));
  const zero=e.encodeRlp([path,e.encodeRlp('0x')]);
  assert.throws(()=>m.positiveStorage(e,e.keccak256(zero),key,[zero]));
});
test('embedded nodes are canonical lists, not short byte-string references',()=>{
  const key=e.toBeHex(17,32),path=e.keccak256(key).slice(2);
  const leaf=['0x3'+path[63],'0x01'],branch=Array(17).fill('0x');branch[Number.parseInt(path[62],16)]=leaf;
  const root=['0x00'+path.slice(0,62),branch],nodes=[root,branch,leaf].map(e.encodeRlp);
  assert.equal(m.positiveStorage(e,e.keccak256(nodes[0]),key,nodes),1n);
  const malformed=['0x00'+path.slice(0,62),e.encodeRlp(branch)];
  assert.throws(()=>m.positiveStorage(e,e.keccak256(e.encodeRlp(malformed)),key,[e.encodeRlp(malformed),...nodes.slice(1)]));
  const wrongPadding=['0x01'+path.slice(0,62),branch];
  assert.throws(()=>m.positiveStorage(e,e.keccak256(e.encodeRlp(wrongPadding)),key,[e.encodeRlp(wrongPadding),...nodes.slice(1)]));
});
const retained=JSON.parse(gunzipSync(await readFile(new URL('../core-closeout-native-20260916/attempt-2/paid.json.gz',import.meta.url))));
test('real retained packets preserve claim identity across zero occurrences and later state',()=>{
  const selected=retained.exports.filter(x=>['early','zero-occurrences','late-after-changes'].includes(x.label));
  const verified=selected.map(x=>m.verifyNativePacket(e,x.packet,x.anchors));
  assert.equal(new Set(verified.map(x=>x.claimId)).size,1);
  assert.equal(new Set(verified.map(x=>x.witnessId)).size,3);
  assert.deepEqual(verified.map(x=>x.observations.occurrences),[1n,0n,1n]);
  assert.deepEqual(verified.map(x=>x.observations.withdrawn),[false,true,true]);
});
test('real proof fails closed for missing, duplicate, trailing, tampered, mixed roots and preimages',()=>{
  const {packet,anchors}=retained.exports[0];
  const changes=[p=>p.witness.slots.pop(),p=>p.witness.slots[1]=p.witness.slots[0],p=>p.witness.accountProof.push(p.witness.accountProof[0]),
    p=>p.witness.slots[0].nodes.pop(),p=>p.witness.slots[0].nodes[0]='0x01',p=>p.witness.slots[0].key=e.toBeHex(99,32),
    p=>p.witness.body='0x01',p=>p.witness.reads=e.AbiCoder.defaultAbiCoder().encode(['tuple(bytes32[] principalIds,bytes32[] positions,bytes32[] expectedHeads)'],[[[e.id('x')],[e.id('y')],[e.id('z')]]]),
    p=>p.source.realmId=e.id('false-realm'),p=>p.source.ledger=e.ZeroAddress,p=>p.witness.slots[0].nodes=retained.exports[1].packet.witness.slots[0].nodes,
    p=>p.witness.accountProof=Array(66).fill(p.witness.accountProof[0]),p=>p.header+='00'];
  for(const change of changes){const p=structuredClone(packet);change(p);assert.throws(()=>m.verifyNativePacket(e,p,anchors));}
});
test('authenticated-value semantic controls reject impossible eras, immutable mutation and reduced counters',()=>{
  const packet=retained.exports[0].packet,initial=packetValues(e,packet);
  const changes=[v=>v[0]^=1n,v=>v[0]|=1n<<237n,v=>v[1]|=1n<<168n,v=>v[5]^=1n,v=>v[6]^=1n,
    v=>v[10]^=1n,v=>v[11]=0n,v=>v[12]^=1n,v=>v[13]|=1n<<160n,v=>v[20]^=1n<<149n,
    v=>v[20]^=1n<<152n,v=>v[21]^=1n,v=>v[22]^=1n,v=>v[23]++,v=>v[25]|=1n<<112n,
    v=>v[26]=1n,v=>v[27]++,v=>v[28]=1n,v=>v[29]=0n];
  for(const change of changes){const v=[...initial];change(v);assert.throws(()=>m.decodeNativeValues(e,packet.source,packet.witness,v));}
  assert.throws(()=>m.decodeNativeValues(e,packet.source,{...packet.witness,checkpoint:'1'},initial));
  assert.throws(()=>m.decodeNativeValues(e,packet.source,{...packet.witness,checkpoint:String(1n<<40n)},initial));
});
test('fabricated state roots and packet trust flags never authenticate root or source execution',()=>{
  const {packet,anchors}=retained.exports[0],fake=fabricatedRootPacket(e,packet);
  fake.verified=true;fake.sourceAnchor=anchors.sourceAnchor;fake.rootAnchor=anchors.rootAnchor;
  const v=m.verifyNativePacket(e,fake);assert.equal(v.integrity,'VERIFIED_POSITIVE_INCLUSION');assert.equal(v.rootAuthentication,'UNVERIFIED');assert.equal(v.sourceExecution,'UNVERIFIED');
  assert.throws(()=>m.verifyNativePacket(e,fake,anchors),/ROOT_ANCHOR/);
  assert.throws(()=>m.consumeNativeClaim(e,fake),/CONSUMER_TRUST/);
  assert.equal(m.verifyNativePacket(e,packet,{rootAnchor:anchors.rootAnchor}).sourceExecution,'UNVERIFIED');
  assert.throws(()=>m.verifyNativePacket(e,packet,{...anchors,sourceAnchor:{...anchors.sourceAnchor,deploymentId:e.id('counterfeit-constructor')}}),/SOURCE_ANCHOR/);
  assert.throws(()=>m.verifyNativePacket(e,packet,{...anchors,rootAnchor:{...anchors.rootAnchor,instanceId:e.id('same-chain-id-another-instance')}}),/ROOT_ANCHOR/);
  const foreign=m.verifyNativePacket(e,packet,{...anchors,rootAnchor:{...anchors.rootAnchor,kind:'TRUSTED_FOREIGN_ROOT'}});
  assert.equal(foreign.rootAuthentication,'TRUSTED');assert.equal(foreign.foreignConsensus,'NOT_PROVEN');assert.equal(foreign.authority,'NONE');
});
test('canonical RLP and bounded positive-only paths reject nonminimal integers and valid absence',()=>{
  assert.equal(typeof m.positiveStorage,'function');
  const key=e.toBeHex(17,32),path=e.concat(['0x20',e.keccak256(key)]);
  for(const value of ['0x8101','0x820001','0x00']){
    const leaf=e.encodeRlp([path,value]);
    assert.throws(()=>m.positiveStorage(e,e.keccak256(leaf),key,[leaf]));
  }
  const branch=e.encodeRlp(Array(17).fill('0x'));
  assert.throws(()=>m.positiveStorage(e,e.keccak256(branch),key,[branch]));
  assert.throws(()=>m.positiveStorage(e,e.keccak256(branch),key,Array(66).fill(branch)));
});
