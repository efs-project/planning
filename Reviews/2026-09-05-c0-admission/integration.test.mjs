import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { AbiCoder, Wallet, TypedDataEncoder, keccak256, toUtf8Bytes, ZeroHash } from '../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import * as codec from './codec.mjs';
import { verifySnapshot, readCold, verifyCache, CACHE } from './reader.mjs';
import { parseGroup } from '../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
import * as local from './scripts/local-chain.mjs';

test('producer Record preimage is author-neutral and publication binds ordered leaves', async () => {
  assert.equal(typeof codec.recordId, 'function', 'Record identity producer missing');
  const abi = AbiCoder.defaultAbiCoder();
  const typeId = '0x' + '11'.repeat(32), body = '0x0003616263';
  const expected = keccak256(abi.encode(['bytes32','bytes32','bytes32'], [keccak256(toUtf8Bytes('efs2/record/1')),typeId,keccak256(body)]));
  assert.equal(codec.recordId(typeId, body), expected);
  const header = { profile:1,principalId:'0x'+'22'.repeat(32),authorityRef:ZeroHash,authEpoch:0,pubNonce:ZeroHash,notAfter:0 };
  const types = { PublicationEnvelope: [{name:'profile',type:'uint16'},{name:'principalId',type:'bytes32'},{name:'authorityRef',type:'bytes32'},{name:'authEpoch',type:'uint64'},{name:'pubNonce',type:'bytes32'},{name:'notAfter',type:'uint64'},{name:'recordIds',type:'bytes32[]'}] };
  const other = '0x'+'33'.repeat(32);
  assert.equal(codec.publicationIds(header,[expected,other]).publicationDigest,TypedDataEncoder.hash({name:'EFS2-Envelope',version:'1'},types,{...header,recordIds:[expected,other]}));
  assert.notEqual(codec.publicationIds(header,[expected,other]).envelopeId,codec.publicationIds(header,[other,expected]).envelopeId);
});

test('cold reader refuses missing retained state rather than treating it as a valid inventory', async () => {
  assert.throws(() => verifySnapshot({records:{}},{}), /missing|basis/);
  const r = await readCold({ collect: async () => { throw Error('provider unavailable'); } }, {});
  assert.equal(r.outcome,'UNKNOWN');
  assert.match(r.reason,/provider unavailable/);
});

test('unavailable-before-basis retains expected source pins and explicitly unknown basis', async()=>{
  const expected={chainId:31337,core:'0x'+'11'.repeat(20),c0ProfileId:'0x'+'22'.repeat(32),runtimeCodeHash:'0x'+'33'.repeat(32)};
  const r=await readCold({source:'managed-local-anvil',collect:async()=>{throw Error('unavailable before basis');}},expected);
  assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.source,{id:'managed-local-anvil',...expected});
  assert.equal(r.requestedBasis,null);assert.equal(r.attemptedBasis,null);assert.equal(r.basis,null);
});

test('unavailable-after-basis retains attempted block but never reports it as verified', async()=>{
  const requestedBasis={number:7},acquiredBasis={number:7,hash:'0x'+'44'.repeat(32),timestamp:1788645600};
  const r=await readCold({source:'managed-local-anvil',requestedBasis,collect:async({onBasis}={})=>{onBasis?.(acquiredBasis);throw Error('row unavailable after basis');}},{});
  assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.requestedBasis,requestedBasis);assert.deepEqual(r.attemptedBasis,acquiredBasis);assert.equal(r.basis,null);assert.match(r.reason,/row unavailable/);
});

for (const reason of [null, undefined]) {
  test(`collection rejection ${String(reason)} stays source-qualified UNKNOWN`, async()=>{
    const expected={chainId:31337,core:'0x'+'11'.repeat(20),c0ProfileId:'0x'+'22'.repeat(32),runtimeCodeHash:'0x'+'33'.repeat(32)};
    const requestedBasis={number:7};
    const r=await readCold({source:'managed-local-anvil',requestedBasis,collect:async()=>{throw reason;}},expected);
    assert.equal(r.outcome,'UNKNOWN');assert.deepEqual(r.source,{id:'managed-local-anvil',...expected});
    assert.deepEqual(r.requestedBasis,requestedBasis);assert.deepEqual(r.attemptedBasis,requestedBasis);
    assert.equal(r.basis,null);assert.equal(r.reason,String(reason));
  });
}

test('malformed returned evidence is INVALID rather than unavailable and never gains a verified basis',async()=>{
  const purportedBasis={number:7,hash:'0x'+'44'.repeat(32),timestamp:1788645600};
  const r=await readCold({source:'managed-local-anvil',collect:async()=>({basis:purportedBasis,records:{}})},{});
  assert.equal(r.outcome,'INVALID');assert.equal(r.source?.id,'managed-local-anvil');assert.deepEqual(r.attemptedBasis,purportedBasis);assert.equal(r.basis,null);assert.match(r.reason,/missing/);
});

test('independent cache reader checks MAP key innerKind and preserved nested descriptor',()=>{
  // Hand-framed MAP(max=2,key=UINT1,value=BOOL); max body 2+2*(1+1)=6.
  const descriptor='0x00016d0c000200000201000001';
  const blob=Buffer.from('0001000178000000'+'00'.repeat(32)+'0001'+descriptor.slice(2)+'0000000000000000','hex');
  const prefix=Buffer.alloc(4);prefix.writeUInt16BE(1);prefix.writeUInt16BE(blob.length,2);
  const parsed=parseGroup(Buffer.concat([prefix,blob]));
  const cache={typeId:parsed.ids[0],blobHash:keccak256(blob),maxBodyBytes:6,fields:[{kind:12,innerKind:2,widthOrMax:2,maxBodyBytes:6,references:0,skipReads:1,descriptor}],roles:[],indexes:[],constraints:[]};
  const row={ordinal:1,cacheBytes:AbiCoder.defaultAbiCoder().encode([CACHE],[cache])};
  assert.doesNotThrow(()=>verifyCache(row,parsed.members[0],parsed.ids[0],parsed.ids,blob));
  cache.fields[0].innerKind=0;row.cacheBytes=AbiCoder.defaultAbiCoder().encode([CACHE],[cache]);assert.throws(()=>verifyCache(row,parsed.members[0],parsed.ids[0],parsed.ids,blob),/inner kind/);
});

test('real admission transactions are atomic and independently reconstructible at a pinned block', {timeout:240000}, async t => {
  assert.equal(typeof local.withProbe,'function','managed loopback deployment missing');
  local.compile();
  await local.withProbe(async lab => {
    const run = lab.run, pub = (i,opts) => codec.makePublication(run,lab.deployment,i,opts);
    const send = p => local.submit(lab,p);
    const snapshot = () => local.collectSnapshot(lab);
    const expect = { ...run,...lab.deployment };
    const counters = async () => [await lab.core.admittedGroupCount(),await lab.core.admissionCount(),await lab.core.recordCount(),await lab.core.envelopeCount(),await lab.core.lastSequence(codec.principal(run.config.schemaAuthor).id,0),await lab.core.indexLength(1,ZeroHash),await lab.core.indexLength(7,ZeroHash)];
    const unchangedFailure = async (p,gasLimit) => { const before=await counters(); await assert.rejects(local.submit(lab,p,{gasLimit})); assert.deepEqual(await counters(),before); };
    await t.test('reordered or missing predecessor group rolls back all counters', async () => {
      await unchangedFailure(pub(1,{nonceSeq:1}));
      await unchangedFailure(pub(2,{nonceSeq:1}));
    });
    await t.test('signer nonce expiry executor chain profile and effects are authenticated', async () => {
      const cases = [
        {signer:new Wallet(codec.SYNTHETIC_KEYS.stranger)},
        {nonceSeq:2}, {notAfter:1}, {chainId:31338},
        {headerPatch:{profile:2}}, {headerPatch:{authorityRef:'0x'+'01'.repeat(32)}},
        {planPatch:{executor:run.config.schemaAuthor}}, {planPatch:{executorCodeHash:ZeroHash}},
        {planPatch:{c0ProfileId:ZeroHash}}, {planPatch:{notAfter:1}},
        {effectsPatch:{realmId:ZeroHash}}, {effectsPatch:{core:run.config.schemaAuthor}},
        {effectsPatch:{leafMask:2}}, {effectsPatch:{operationKind:8}},
        {effectsPatch:{expectedRevisionsHash:ZeroHash}}, {effectsPatch:{byteCommitment:'0x'+'01'.repeat(32)}}
      ];
      for(const opts of cases)await unchangedFailure(pub(0,opts));
      const unsigned=pub(0);unsigned.witness='0x';await unchangedFailure(unsigned);
      const highS=pub(0);const order=0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
      const signature=Buffer.from(highS.witness.slice(2),'hex');const oldS=BigInt('0x'+signature.subarray(32,64).toString('hex'));Buffer.from((order-oldS).toString(16).padStart(64,'0'),'hex').copy(signature,32);signature[64]=signature[64]===27?28:27;highS.witness='0x'+signature.toString('hex');await unchangedFailure(highS);
      const badV=pub(0);badV.witness=badV.witness.slice(0,-2)+'00';await unchangedFailure(badV);
      const substituted=pub(0);substituted.canonicalBody='0x'+run.candidates.groups[1].recordBodyHex;await unchangedFailure(substituted);
      const malformed=pub(0);malformed.recordIds=[];await unchangedFailure(malformed);
    });
    const receipts=[];
    await t.test('four exact candidate groups are admitted through the sole write path',async()=>{
      for(let i=0;i<4;i++)receipts.push(await send(pub(i)));
      assert.deepEqual((await counters()).map(Number),[4,4,4,4,4,17,4]);
    });
    const original=await snapshot();
    await t.test('cold reader verifies all retained identities signatures caches and indexes',async()=>{
      const checked=verifySnapshot(original,expect);
      assert.equal(checked.outcome,'VERIFIED');assert.equal(checked.typeCount,17);assert.equal(checked.recordCount,4);assert.equal(checked.admissionCount,4);
      assert.equal(checked.basis.hash,original.basis.hash);
      for(const r of receipts)assert(r.gasUsed<=16777216n);
    });
    await t.test('intrinsic singleton member index substitution cannot verify',()=>{
      const altered=structuredClone(original);altered.types[altered.metaTypeId].memberIndex='65535';
      assert.throws(()=>verifySnapshot(altered,expect),/intrinsic member index/);
    });
    await t.test('retained body witness cache and index substitution or removal cannot verify',async()=>{
      const rid=Object.keys(original.records)[0], eid=Object.keys(original.envelopes)[0], tid=original.indexes['1:'+ZeroHash][1];
      const mutations=[s=>s.records[rid].body='0x0000',s=>delete s.records[rid],s=>s.envelopes[eid].witness='0x'+'00'.repeat(65),s=>s.types[tid].cacheBytes='0x',s=>s.indexes['7:'+ZeroHash].reverse(),s=>s.indexes['1:'+ZeroHash].pop(),s=>delete s.envelopes[eid]];
      for(const mutate of mutations){const altered=structuredClone(original);mutate(altered);assert.throws(()=>verifySnapshot(altered,expect));}
      const missing=structuredClone(original);missing.admittedGroupCount=3;assert.throws(()=>verifySnapshot(missing,expect),/group|inventory/);
    });
    await t.test('authenticated exact replay is no-op but same Record new Envelope creates distinct admission',async()=>{
      const before=await counters();const replay=pub(0);assert.equal((await lab.core.publishWithPlanC0.staticCall(...codec.callArgs(replay)))[0],2n);await send(replay);assert.deepEqual(await counters(),before);
      const fresh=pub(0,{nonceSeq:5});await send(fresh);assert.deepEqual((await counters()).map(Number),[4,5,4,5,5,17,5]);
      assert.equal(verifySnapshot(await snapshot(),expect).admissionCount,5);
      assert.equal(verifySnapshot(original,expect).admissionCount,4,'old fixed-block snapshot stays independent of newer chain state');
      const badReplay=pub(0,{signer:new Wallet(codec.SYNTHETIC_KEYS.stranger)});await unchangedFailure(badReplay);
    });
    await t.test('expired exact authenticated occurrence replays before deadline and nonce checks',async()=>{
      const now=(await lab.provider.getBlock('latest')).timestamp;
      const p=pub(0,{nonceSeq:6,notAfter:now+100});await send(p);
      await lab.provider.send('evm_increaseTime',[101]);await lab.provider.send('evm_mine',[]);
      const before=await counters();assert.equal((await lab.core.publishWithPlanC0.staticCall(...codec.callArgs(p)))[0],2n);await send(p);assert.deepEqual(await counters(),before);
      assert.equal(verifySnapshot(await snapshot(),expect).admissionCount,6);
    });
  });
});

test('out-of-gas after substantial fresh admission work rolls back rows caches indexes and nonce', {timeout:90000}, async()=>{
  await local.withProbe(async lab=>{
    const before=await local.collectSnapshot(lab);
    const p=codec.makePublication(lab.run,lab.deployment,0);
    let failure;try{await local.submit(lab,p,{gasLimit:6000000n});}catch(error){failure=error;}
    assert(failure?.receipt,'expected a mined reverted transaction');assert.equal(failure.receipt.status,0);assert.equal(failure.receipt.gasUsed,6000000n);
    const after=await local.collectSnapshot(lab);delete before.basis;delete after.basis;assert.deepEqual(after,before,'all retained admission state must roll back');
  });
});

test('measurement runner retains receipts and fixed-block verification without claiming full C0', {timeout:90000}, async()=>{
  const module=await import('./scripts/measure.mjs');
  assert.equal(typeof module.measure,'function','resource evidence runner missing');
  const report=await module.measure();
  assert.equal(report.fullC0,false);assert.equal(report.fixedBlockVerification.outcome,'VERIFIED');
  assert.equal(report.fixedBlockVerification.typeCount,17);assert.equal(report.transactions.length,6);
  for(const tx of report.transactions){assert.equal(tx.receipt.status,1);assert(BigInt(tx.receipt.gasUsed)<=16777216n);assert(tx.receipt.blockHash&&tx.receipt.hash);}
  assert(report.byteSizes.parsedCacheBytes>0&&report.byteSizes.runtimeBytes<=24576);
  for(const name of ['parser.mjs','encoder.mjs']){
    const path='../2026-09-05-mvp-build-start/type-inputs/'+name;
    assert.equal(report.executableDependencySha256?.[path],createHash('sha256').update(readFileSync(new URL(path,import.meta.url))).digest('hex'));
  }
});
