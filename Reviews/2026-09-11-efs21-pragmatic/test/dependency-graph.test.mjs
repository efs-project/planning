import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '../sdk/client.mjs';
import {E,withWorld,artifact} from '../scripts/world.mjs';

test('new clients cannot silently downgrade missing source-backed graph metadata',()=>{
  const config={rpc:'http://127.0.0.1:1',chainId:'31337',genesisHash:E.ZeroHash,codeHash:E.ZeroHash,deploymentBlockHash:E.ZeroHash,kernel:E.getAddress('0x'+'11'.repeat(20)),abi:[]};
  assert.throws(()=>createClient(E,config),/profile|graph/i);
});

test('split graph qualifies at one basis and rejects tampered code, links, writers and validator bindings',{timeout:180000},async()=>{
  const result=await withWorld(async w=>{
    const c=w.client,basis=await c.observe();
    assert.equal(basis.dependencyProfile,'current');assert(basis.profileId&&basis.graphId);
    for(const role of ['NativeRecordKernel','RecordInventoryIndex','NavigationIndex','DiscoveryIndex','types','BodyWriter','BytesValidator']){
      const address=w.config.graph[role],code=await c.rpc('eth_getCode',[address,'latest']);
      await c.rpc('anvil_setCode',[address,'0x00']);
      await assert.rejects(()=>c.observe(),/identity mismatch/);
      await assert.rejects(()=>c.write('ensureRoot',[]),/identity mismatch/);
      await c.rpc('anvil_setCode',[address,code]);
    }
    for(const role of ['NativeRecordKernel','RecordInventoryIndex','NavigationIndex','BodyWriter','types','BytesValidator']){
      const config=structuredClone(w.config);config.graph[role]=E.getAddress('0x'+'22'.repeat(20));
      await assert.rejects(()=>createClient(E,config).observe(),/identity mismatch|link mismatch/);
    }
    const wrong=structuredClone(w.config);wrong.profileId=E.ZeroHash;
    assert.throws(()=>createClient(E,wrong),/profile|graph/i);
    for(const key of ['chainId','genesisHash','codeHash','deploymentBlockHash']){
      const config={...w.config,[key]:key==='chainId'?'1':E.ZeroHash};
      await assert.rejects(async()=>createClient(E,config).observe());
    }
    await assert.rejects(()=>c.call('rootId',[w.config.namespace],{...basis,graphId:E.ZeroHash}),/identity mismatch/i);
    // Same source runtime, wrong inventory-writer immutable is rejected before any result.
    const address=w.config.graph.RecordInventoryIndex,original=await c.rpc('eth_getCode',[address,'latest']);
    const template=artifact('RecordInventoryIndex').deployedBytecode;
    let poisoned=original;
    for(const refs of Object.values(template.immutableReferences))for(const r of refs){const at=2+r.start*2;poisoned=poisoned.slice(0,at)+E.zeroPadValue(w.config.kernel,32).slice(2)+poisoned.slice(at+64);}
    await c.rpc('anvil_setCode',[address,poisoned]);await assert.rejects(()=>c.observe(),/identity mismatch/);
    await c.rpc('anvil_setCode',[address,original]);
    // Registry state can change while all runtime hashes stay exact: pin the selected validator link too.
    const registry=w.config.graph.types;
    const slot=E.toBeHex(BigInt(E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','uint256'],[w.config.bytesType,0])))+1n,32);
    const word=await c.rpc('eth_getStorageAt',[registry,slot,'latest']);
    await c.rpc('anvil_setStorageAt',[registry,slot,E.zeroPadValue(w.config.graph.Uint256Validator,32)]);
    await assert.rejects(()=>c.observe(),/validator binding mismatch/);
    await c.rpc('anvil_setStorageAt',[registry,slot,word]);
    const downgrade={...w.config,dependencyProfile:'baseline-7db38cd'};
    const {sourceProfile}=await import('../sdk/qualification.mjs');
    downgrade.profileId=sourceProfile(downgrade.dependencyProfile).id;
    await assert.rejects(()=>createClient(E,downgrade).observe(),/graph shape mismatch|identity mismatch/);
    assert((await c.observe()).graphId===basis.graphId);
    return {};
  });
  assert(result.cleanup.stopped&&result.cleanup.cacheRemoved);
});
