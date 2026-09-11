import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {AbiCoder,Interface,keccak256,ZeroHash} from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {withStateful,compileStateful,ROOT,publication,groupLeaf,word,domain} from '../scripts/local-stateful.mjs';
import {artifact,patch,links,bytes} from './support/linked-read-host.mjs';
import {readState,verifyState,foldAdmissions} from '../reference/state-reader.mjs';
const abi=AbiCoder.defaultAbiCoder();
const concat=(...xs)=>'0x'+xs.map(x=>x.replace(/^0x/,'')).join('');
const hash=(types,values)=>keccak256(abi.encode(types,values));
test('explicit independent fold does not treat admission four as global key four',()=>{
  const ids={set:word(10),tombstone:word(11),withdrawal:word(12)};
  const entries=Array.from({length:4},(_,i)=>({
    ordinal:BigInt(i+1),envelopeId:word(100+i),leaf:0,recordId:word(200+i),principal:word(1),
    typeId:i===3?ids.tombstone:word(9),fields:i===3?[word(1),word(2),word(3),'0x00']:[],
    references:[],schema:{roles:[],indexes:[]}
  }));
  assert.deepEqual([...foldAdmissions(entries,ids,0).scopes.values()],[[4n]]);
  assert.deepEqual([...foldAdmissions(entries,ids,1).scopes.values()],[[1n]]);
  assert.throws(()=>foldAdmissions(entries,ids,2));
});
function immutableNames(a) {
  for(const filename of readdirSync(join(ROOT,'out/build-info'))) {
    const info=JSON.parse(readFileSync(join(ROOT,'out/build-info',filename)));
    const compiled=info.output?.contracts?.['test/K10ScopeHarness.sol']?.K10ScopeHarness;
    if(compiled?.evm?.bytecode?.object!==a.bytecode.object.slice(2)) continue;
    if(compiled.evm.deployedBytecode.object!==a.deployedBytecode.object.slice(2)) continue;
    if(JSON.stringify(compiled.evm.deployedBytecode.immutableReferences)!==JSON.stringify(a.deployedBytecode.immutableReferences)) continue;
    const ast=info.output.sources['test/K10ScopeHarness.sol'].ast;
    const names=Object.fromEntries(ast.nodes.find(x=>x.name==='K10ScopeHarness').nodes
      .filter(x=>x.mutability==='immutable').map(x=>[x.id,x.name]));
    assert.deepEqual(Object.keys(names).sort(),Object.keys(a.deployedBytecode.immutableReferences).sort());
    return names;
  }
  assert.fail('same-build K10 immutable provenance missing');
}
test('real admitted snapshots require explicit layout and independently reconstruct both domains',{timeout:1200000},async()=>{
  compileStateful();
  await withStateful(async lab=>{
    const historical=await readState(lab); assert.equal(historical.outcome,'VERIFIED',historical.reason);
    const retainedLegacy=structuredClone(historical.snapshot); delete retainedLegacy.scopeLayout;
    assert.equal(verifyState(retainedLegacy,lab.expected).outcome,'VERIFIED','explicit trusted fixed-legacy profile retains old snapshots');
    const noSourceProfile={...lab.expected}; delete noSourceProfile.scopeLayoutProfile;
    assert.notEqual(verifyState(retainedLegacy,noSourceProfile).outcome,'VERIFIED','missing legacy source policy cannot infer mode');
    for(const profile of [null,'legacy','',2]) {
      assert.equal(verifyState(historical.snapshot,{...lab.expected,scopeLayoutProfile:profile}).outcome,'INVALID','closed source profiles');
    }
    assert.equal(verifyState(historical.snapshot,{...lab.expected,scopeLayout:1}).outcome,'INVALID','fixed legacy profile rejects K10');
    const q=artifact('QueryReadLibrary');
    assert(bytes(q.deployedBytecode.object)<=24576);
    const qr=await lab.receipt(await lab.send(q.bytecode.object));
    assert.equal(qr.status,'0x1');
    const qrefs=q.deployedBytecode.immutableReferences??{};
    const qcode=patch(q.deployedBytecode.object,qrefs,
      Object.keys(qrefs).length?{library_deploy_address:qr.contractAddress}:{});
    assert.equal(await lab.rpc('eth_getCode',[qr.contractAddress,qr.blockNumber]),qcode);
    const a=artifact('K10ScopeHarness'), names=immutableNames(a), iface=new Interface(a.abi);
    for(const [file,pin] of Object.entries(a.metadata.sources)) assert.equal(keccak256(readFileSync(join(ROOT,file))),pin.keccak256);
    const addresses={AdmissionLibrary:lab.expected.components.library.address,QueryReadLibrary:qr.contractAddress};
    const getters=lab.expected.getters, states=[];
    for(const mode of [0,1]) {
      const ctor=abi.encode(['tuple(bytes32 realmId,bytes32 initialRevisionId,bytes intrinsicGroupBytes,bytes objectGroup1Bytes,bytes kernelGroup2Bytes)','address','bytes32','bytes32','uint256'],
        [lab.inputs.init,getters.preparationHelper,getters.preparationCodehash,getters.admissionCodehash,mode]);
      const creation=links(a.bytecode,addresses)+ctor.slice(2);
      const runtime=patch(links(a.deployedBytecode,addresses),a.deployedBytecode.immutableReferences,
        Object.fromEntries(Object.entries(names).map(([id,name])=>[id,getters[name]])));
      assert(bytes(creation)<=49152 && bytes(runtime)<=24576);
      const receipt=await lab.receipt(await lab.send(creation)); assert.equal(receipt.status,'0x1');
      const host=receipt.contractAddress; assert.equal(await lab.rpc('eth_getCode',[host,receipt.blockNumber]),runtime);
      const reader={...lab,iface,expected:{...lab.expected,core:host,scopeLayout:mode,scopeLayoutProfile:'comparison-v1',
        components:{...lab.expected.components,core:{address:host,code:runtime},query:{address:qr.contractAddress,code:qcode}}}};
      const empty=await readState(reader); assert.equal(empty.outcome,'VERIFIED',empty.reason);
      assert.equal(verifyState(empty.snapshot,{...reader.expected,scopeLayout:1-mode}).outcome,'INVALID','zero-entry layout mismatch');
      const unselected={...reader.expected}; delete unselected.scopeLayout;
      const unobserved=structuredClone(empty.snapshot); delete unobserved.scopeLayout;
      assert.notEqual(verifyState(empty.snapshot,unselected).outcome,'VERIFIED','offline missing expected mode refuses');
      assert.notEqual(verifyState(unobserved,reader.expected).outcome,'VERIFIED','offline missing observed mode refuses');
      assert.notEqual(verifyState(unobserved,unselected).outcome,'VERIFIED','offline both missing modes refuse');
      assert.notEqual(verifyState({...unobserved,scopeLayoutProfile:'legacy-fixed-v0'},reader.expected).outcome,'VERIFIED','snapshot cannot grant legacy qualification');
      for(const invalid of [null,'0','1',2,256]) {
        assert.notEqual(verifyState({...empty.snapshot,scopeLayout:invalid},reader.expected).outcome,'VERIFIED','malformed observed mode refuses');
        assert.notEqual(verifyState(empty.snapshot,{...reader.expected,scopeLayout:invalid}).outcome,'VERIFIED','malformed expected mode refuses');
      }
      const strippedIface=new Interface(a.abi.filter(f=>f.name!=='scopeLayout'));
      assert.notEqual((await readState({...reader,iface:strippedIface})).outcome,'VERIFIED','stripped ABI cannot supply observed mode');
      assert.notEqual((await readState({...reader,iface:strippedIface,expected:unselected})).outcome,'VERIFIED','stripped ABI cannot select legacy');
      assert.equal((await readState({...reader,expected:unselected})).outcome,'UNKNOWN','comparison host requires explicit selection');
      const publish=async p=>{const r=await lab.receipt(await lab.send(iface.encodeFunctionData('publishTrustedForTest',[lab.context(p.header.principalId),p]),host));assert.equal(r.status,'0x1');};
      const groups=lab.inputs.candidates.groups, type=name=>groups.flatMap(g=>g.members).find(m=>m.descriptor.name===name).temporaryTypeSchemaId;
      const principal=word((1n<<256n)-1n),purpose=word(1);
      await publish(publication([groupLeaf(lab.inputs.meta,'0x'+groups[0].groupHex)],1));
      await publish(publication([groupLeaf(lab.inputs.meta,'0x'+groups[1].groupHex)],2));
      const object=publication([{typeId:type('ObjectGenesis/1'),body:concat(principal,word(99),'00')}],3,{principal});
      await publish(object);
      const subject=object.recordIds[0], scope=hash(['bytes32','bytes32','bytes32','bytes32'],[domain('efs2/vk/binding-scope/1'),principal,purpose,subject]);
      for(let i=0;i<7;i++) {
        await publish(publication([{typeId:type('BindingTombstone/1'),body:concat(purpose,subject,word(i+1),'00')}],10+i*2,{principal,revisions:[[0,0]]}));
        await publish(publication([{typeId:type('ObjectGenesis/1'),body:concat(principal,word(100+i),'00')}],11+i*2,{principal}));
      }
      const state=await readState(reader); assert.equal(state.outcome,'VERIFIED',state.reason);
      const expected=mode===0?[4n,6n,8n,10n,12n,14n,16n]:[1n,2n,3n,4n,5n,6n,7n];
      assert.deepEqual(state.fold.scopes.get(scope),expected);
      const pin={blockHash:state.basis.hash,requireCanonical:true};
      const call=async(name,args)=>iface.decodeFunctionResult(name,await lab.rpc('eth_call',[{to:host,data:iface.encodeFunctionData(name,args)},pin]));
      const [raw]=await call('pagePostings',[ZeroHash,10,0,scope,[0,100,10]]);
      assert.deepEqual([...raw.items],expected.slice(0,4).map(word));
      const [,rows]=await call('pagePostingsHydrated',[ZeroHash,10,0,scope,[0,100,10]]);
      assert.deepEqual([...rows].map(x=>x.ordinal),[4n,6n,8n,10n]);
      assert.equal(verifyState(state.snapshot,{...reader.expected,scopeLayout:1-mode}).outcome,'INVALID');
      const mislabeled=structuredClone(state.snapshot); mislabeled.scopeLayout=1-mode;
      assert.equal(verifyState(mislabeled,{...reader.expected,scopeLayout:1-mode}).outcome,'INVALID');
      assert.throws(()=>foldAdmissions(state.entries,{set:type('BindingSet/1'),tombstone:type('BindingTombstone/1'),withdrawal:type('Withdrawal/1')},2));
      states.push(state);
      const unknown=1n<<200n;
      assert.equal((await lab.receipt(await lab.send(iface.encodeFunctionData('corruptMode',[unknown]),host))).status,'0x1');
      const modeBytes=await lab.rpc('eth_call',[{to:host,data:iface.encodeFunctionData('scopeLayout',[])},'latest']);
      assert.equal(iface.decodeFunctionResult('scopeLayout',modeBytes)[0],unknown,'full-width discriminator');
      assert.equal((await readState(reader)).outcome,'INVALID','out-of-byte mode refuses before narrowing');
    }
    assert.deepEqual(states[0].entries,states[1].entries,'same portable events and occurrence identities');
    assert.deepEqual([...states[0].fold.histories],[...states[1].fold.histories],'unchanged kind8');
  });
});
