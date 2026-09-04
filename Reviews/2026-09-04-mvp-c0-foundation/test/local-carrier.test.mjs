import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hexlify, keccak256 } from 'ethers';
import { chunkTree, verifyFile, verifiedRange, recoverFile } from '../reference/chunk-tree.mjs';
import { encodeSeed, decodeSeed, experimentSeed, encodeDeployment, experimentCommitment, c0ProfileId } from '../reference/run-codec.mjs';
import { withLocalCarrier, transact, syntheticSeed, syntheticType } from '../scripts/local-carrier.mjs';
import { measureCarrier } from '../scripts/measure-carrier.mjs';

const fixture=JSON.parse(readFileSync(new URL('../fixtures/chunk-tree-known.json',import.meta.url)));
const payload=v=>v.payload==='utf8:hello'?Buffer.from('hello'):Buffer.from(Array.from({length:v.totalSize},(_,i)=>i%251));

// Catches wrong leaf prefixes, sorted pairs, duplicate-last padding, or body/ID packing.
test('independent tree matches every cast-derived literal including odd-tail roots',()=>{
  for(const v of fixture.vectors) {
    const tree=chunkTree(payload(v),fixture.typeId,v.chunkSize);
    assert.equal(tree.root,v.root,v.name);
    assert.equal(tree.body,v.body,v.name);
    assert.equal(tree.recordId,v.recordId,v.name);
    assert.equal(verifyFile(fixture.typeId,v.recordId,v.body,payload(v)),true);
  }
  const v=fixture.vectors.find(v=>v.chunkCount===3);
  for(const wrong of Object.values(fixture.invalidThreeChunkRoots)) {
    assert.notEqual(chunkTree(payload(v),fixture.typeId,v.chunkSize).root,wrong);
    assert.throws(()=>verifyFile(fixture.typeId,v.recordId,v.body.slice(0,34)+wrong.slice(2),payload(v)));
  }
});

test('live component parity, retained-state recovery, rollback and context gates',{timeout:80000},async t=>{
  await withLocalCarrier(async env=>{
    const {provider,carrier,host,codec,deployment,deploymentBytes,commitment}=env;
    const address=await carrier.getAddress();
    const h=n=>'0x'+n.toString(16).padStart(64,'0');
    await t.test('measurement observes receipt gas, exact candidate payload counts and ABI result sizes',async()=>{
      const snapshot=await provider.send('evm_snapshot',[]);
      try {
        const report=await measureCarrier(env);
        assert.deepEqual(report.samples?.map(s=>s.inputBytes),[0,1,4096,8192,12289]);
        assert.equal(report.scope,'COMPONENT_ONLY_NOT_VALID_GENESIS_OR_CAP_SELECTION');
        assert.equal(report.blockGasLimit,'30000000');
        assert.equal(report.totals.uniqueEntries,'5');
        assert.equal(report.totals.storedPayloadBytes,'24578');
        for(const sample of report.samples) {
          for(const gas of [sample.writeGasUsed,sample.fullReadGasUsed,sample.rangeReadGasUsed]) assert(BigInt(gas)>21000n&&BigInt(gas)<29000000n);
          assert.equal(sample.fullReadPayloadBytes,sample.inputBytes);
          assert.equal(sample.fullReadAbiResultBytes,64+32*Math.ceil(sample.inputBytes/32));
          assert.equal(sample.rangeReadPayloadBytes,sample.rangeLength);
          assert.equal(sample.rangeReadAbiResultBytes,64+32*Math.ceil(sample.rangeLength/32));
          assert.equal(sample.recoveryVerified,true);
        }
      } finally { assert.equal(await provider.send('evm_revert',[snapshot]),true); }
    });
    await t.test('Node packed manifest bytes and domain hashes equal independently executing Solidity',async()=>{
      const seed={namespace:'efs2/mvp-c0/2026-09-03',runId:fixture.runId,sourceCommitments:[{label:'synthetic/source',digest:h(1)}],toolchainCommitments:[{label:'synthetic/toolchain',digest:h(2)}],chainConfigCommitment:h(3),deploymentFactoryAddress:deployment.coreAddress,coreCreate2Salt:h(0),byteStoreCreate2Salt:h(0),coreCreationCodeTemplateHash:h(4),byteStoreCreationCodeTemplateHash:h(5),codexConstantsHash:h(6),indexCapabilityRoot:h(7),orderedTypeGroupRoot:h(8),schemaAuthorAddress:deployment.coreAddress,bootstrapAuthorAddress:address,byteMeasurementReportHash:h(9),maxStateFileBytes:16384n,maxReadRangeBytes:4096n,transactionGasMargin:0n,stateGrowthMargin:0n,destructionPolicyHash:h(10)};
      const encoded=encodeSeed(seed);
      assert.equal(await codec.encodeSeed(seed),encoded);
      assert.equal(await codec.seedInputsHash(seed),keccak256(encoded));
      assert.equal(await codec.experimentSeed(seed),experimentSeed(seed));
      assert.equal(await codec.encodeSeed((await codec.decodeSeed(encoded)).toArray(true)),encoded);
      assert.deepEqual(decodeSeed(encoded),{...seed,deploymentFactoryAddress:seed.deploymentFactoryAddress.toLowerCase(),schemaAuthorAddress:seed.schemaAuthorAddress.toLowerCase(),bootstrapAuthorAddress:seed.bootstrapAuthorAddress.toLowerCase()});
      assert.equal(await codec.encodeDeployment(deployment),deploymentBytes);
      assert.equal(await codec.deploymentHash(deployment),keccak256(deploymentBytes));
      assert.equal(await codec.experimentCommitment(deployment),experimentCommitment(deployment));
      assert.equal(await codec.c0ProfileId(commitment),c0ProfileId(commitment));
      for(const field of ['coreRuntimeCodeHash','byteStoreRuntimeCodeHash']) {
        const changed={...deployment,[field]:h(99)};
        assert.notEqual(experimentCommitment(changed),commitment);
        await assert.rejects(transact(host.initialize,address,encodeDeployment(changed),syntheticType,false));
        assert.equal(await carrier.isSealed(),false);
      }
      assert.equal(keccak256(await provider.getCode(deployment.coreAddress)),deployment.coreRuntimeCodeHash);
      assert.equal(keccak256(await provider.getCode(address)),deployment.byteStoreRuntimeCodeHash);
    });
    await t.test('enclosing initialization rolls back both host context and carrier seal',async()=>{
      await assert.rejects(transact(host.initialize,address,deploymentBytes,syntheticType,true));
      assert.equal(await carrier.isSealed(),false);
      assert.equal((await host.c0CarrierContext())[3],0n);
      await transact(host.initialize,address,deploymentBytes,syntheticType,false);
      assert.equal(await carrier.deploymentBytes(),deploymentBytes);
      assert.equal(await carrier.experimentCommitment(),commitment);
      assert.equal((await host.c0CarrierContext())[3],1n);
      await transact(host.setContext,syntheticSeed,commitment,syntheticType,3);
    });
    await t.test('complete retained state recovers after original buffers are overwritten and dropped',async()=>{
      // Only independent public fixture identity/size survive. No events reconstruct data.
      for(const v of fixture.vectors.filter(v=>v.totalSize<=16384)) {
        let original=payload(v);
        const expectedDigest=keccak256(original);
        await transact(host.put,address,v.recordId,v.body,original);
        original.fill(0); original=null;
        const blockTag=await provider.getBlockNumber();
        const recovered=await recoverFile(carrier,syntheticType,v.recordId,{blockTag,maxBytes:16384});
        assert.equal(recovered?.verified,true,'retained-state recovery must verify');
        assert.equal(keccak256(recovered.data),expectedDigest);
        assert.equal(recovered.body,v.body);
        assert.equal(recovered.data.length,v.totalSize);
        if(v.totalSize) {
          recovered.data[recovered.data.length-1]^=1;
          assert.throws(()=>verifyFile(syntheticType,v.recordId,recovered.body,recovered.data));
        }
      }
      assert.equal(await carrier.entryCount(),4n);
      assert.equal(await carrier.totalStoredBytes(),12295n);
      const [ids,next]=await carrier.entries(0,64);
      assert.deepEqual([...ids],fixture.vectors.slice(0,4).map(v=>v.recordId)); assert.equal(next,4n);
    });
    await t.test('missing is not empty; raw and independently verified ranges agree across chunks',async()=>{
      const blockTag=await provider.getBlockNumber();
      await assert.rejects(recoverFile(carrier,syntheticType,h(999),{blockTag,maxBytes:16384}),/missing/);
      await assert.rejects(carrier.read(h(999)));
      assert.equal((await carrier.metadata(h(999)))[0],false);
      const empty=await recoverFile(carrier,syntheticType,fixture.vectors[0].recordId,{blockTag,maxBytes:16384});
      assert.equal(empty.data.length,0);
      const v=fixture.vectors[2], recovered=await recoverFile(carrier,syntheticType,v.recordId,{blockTag,maxBytes:16384});
      const range=verifiedRange(syntheticType,v.recordId,recovered.body,recovered.data,4094,3);
      assert.deepEqual(range,Buffer.from([78,79,80]));
      assert.equal(await carrier.readRange(v.recordId,4094,3),hexlify(range));
      assert.equal(await carrier.readRange(v.recordId,4097,0),'0x');
      await assert.rejects(carrier.readRange(v.recordId,4097,1));
      await assert.rejects(recoverFile(carrier,syntheticType,v.recordId,{blockTag,maxBytes:4096}),/cap/);
    });
    await t.test('phase/context changes and enclosing put rollback leave inventory unchanged',async()=>{
      const data=Buffer.from([42]), tree=chunkTree(data,syntheticType);
      for(const phase of [0,1,2]) {
        await transact(host.setContext,syntheticSeed,commitment,syntheticType,phase);
        await assert.rejects(transact(host.put,address,tree.recordId,tree.body,data));
      }
      for(const context of [[h(98),commitment,syntheticType],[syntheticSeed,h(98),syntheticType],[syntheticSeed,commitment,h(98)]]) {
        await transact(host.setContext,...context,3);
        await assert.rejects(transact(host.put,address,tree.recordId,tree.body,data));
      }
      await transact(host.setContext,syntheticSeed,commitment,syntheticType,3);
      await assert.rejects(transact(host.putAndRevert,address,tree.recordId,tree.body,data));
      assert.equal((await carrier.metadata(tree.recordId))[0],false);
      assert.equal(await carrier.entryCount(),4n); assert.equal(await carrier.totalStoredBytes(),12295n);
      await transact(host.put,address,tree.recordId,tree.body,data);
      await transact(host.put,address,tree.recordId,tree.body,data);
      assert.equal(await carrier.entryCount(),5n); assert.equal(await carrier.totalStoredBytes(),12296n);
    });
  });
});

// Catches verification which trusts a supplied ID/body without checking recovered bytes.
test('verification rejects mutated bytes/body/identity and invalid geometry',()=>{
  const v=fixture.vectors[3], data=payload(v);
  data[data.length-1]^=1;
  assert.throws(()=>verifyFile(fixture.typeId,v.recordId,v.body,data));
  assert.throws(()=>verifyFile('0x'+'22'.repeat(32),v.recordId,v.body,payload(v)));
  for(const body of [v.body+'00',v.body.slice(0,-2),'0x'+'00'.repeat(48)])
    assert.throws(()=>verifyFile(fixture.typeId,v.recordId,body,payload(v)));
  for(const size of [0,1,4095,4097,8388609]) assert.throws(()=>chunkTree(payload(v),fixture.typeId,size));
  assert.throws(()=>chunkTree(Buffer.alloc(0),fixture.typeId,4096));
});

// Catches slicing raw unverified bytes or accepting out-of-file/invalid ranges.
test('range verification checks the complete file then handles cross-chunk and EOF bounds',()=>{
  const v=fixture.vectors[2];
  const range=verifiedRange(fixture.typeId,v.recordId,v.body,payload(v),4094,3);
  assert.deepEqual(range,Buffer.from([78,79,80]));
  assert.deepEqual(verifiedRange(fixture.typeId,v.recordId,v.body,payload(v),4097,0),Buffer.alloc(0));
  for(const [offset,length] of [[4098,0],[4097,1],[-1,1],[0,-1],[0,0.5],[Number.MAX_SAFE_INTEGER+1,0]])
    assert.throws(()=>verifiedRange(fixture.typeId,v.recordId,v.body,payload(v),offset,length));
  const bad=payload(v); bad[0]^=1;
  assert.throws(()=>verifiedRange(fixture.typeId,v.recordId,v.body,bad,4094,3));
});
