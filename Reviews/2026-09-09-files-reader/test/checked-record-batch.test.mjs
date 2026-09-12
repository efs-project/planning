import test from 'node:test';
import assert from 'node:assert/strict';
import { compileUpgrade, withUpgrade } from './fixture.mjs';
import { publication, groupLeaf } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { createFixtureReader, DEFAULT_LIMITS } from '../reader-scope.mjs';
import { Interface, ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';

const codec = new Interface(['function getRecordsChecked((bytes32 executionSetId,uint32 revision,uint64 blockNumber,uint64 admissionHigh),bytes32[]) view returns ((bytes32 executionSetId,uint32 revision,uint64 blockNumber,uint64 admissionHigh),(bytes32 recordId,bytes32 typeSchemaId,bytes canonicalBody,uint64 firstAdmitOrdinal)[])']);
const selector = codec.getFunction('getRecordsChecked').selector;
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return {promise,resolve}; };
const plain = value => value.toArray(true);

// Break: dropping context/count/order/canonical checks, budgets or the shared seal lifecycle.
test('explicit Record acquisition qualifies all rows together and fails closed', {timeout:300000}, async t => {
  compileUpgrade();
  await withUpgrade(async lab => {
    const p = publication([groupLeaf(lab.inputs.meta,'0x'+lab.inputs.candidates.groups[0].groupHex)],41000);
    assert.equal((await lab.publish(p)).receipt.status,'0x1');
    const ids = [p.recordIds[0],ZeroHash,p.recordIds[0]];
    const open = async ({transform,limits,signal}={}) => {
      const source = {identity:lab.expected.source,epoch:1,request:async(m,p,o)=>{
        const raw = await lab.rpc(m,p,o);
        return transform ? transform(m,p,raw) : raw;
      }};
      const opened = await createFixtureReader({source,context:{expected:lab.expected,limits}}).open({signal});
      assert.equal(opened.status,'READY',opened.reason); return {scope:opened.scope,source};
    };
    await t.test('single real evidence ID, exact checked calldata and aligned scalar values',async()=>{
      const {scope} = await open();
      try {
        assert.equal(typeof scope.getRecords,'function','explicit getRecords API');
        const before = scope.stats().requests, result = await scope.getRecords(ids);
        assert.equal(result.status,'OK',result.reason); assert.deepEqual(result.basis,scope.basis);
        assert.equal(scope.stats().requests-before,1);
        assert.equal(result.records.length,3);
        const evidence = scope.evidence().find(e=>e.id===result.evidenceId);
        assert.equal(evidence.purpose,'data');
        const decoded = codec.decodeFunctionData('getRecordsChecked',evidence.params[0].data);
        assert.deepEqual(plain(decoded[0]),['executionSetId','revision','blockNumber','admissionHigh'].map(k=>scope.basis[k]));
        assert.deepEqual(plain(decoded[1]),ids);
        for (const [i,row] of result.records.entries()) {
          assert.equal(row.recordId,ids[i]); assert.equal(row.evidenceIndex,i);
          const scalar = await scope.call('getRecord',[ids[i]]);
          assert.equal(scalar.status,'OK');
          assert.deepEqual([row.typeSchemaId,row.canonicalBody,row.firstAdmitOrdinal],plain(scalar.values));
        }
        assert.equal((await scope.seal()).status,'SEALED');
        const count=scope.stats().requests;
        for (const bad of [[],Array(9).fill(ZeroHash),[123],null]) {
          const refused=await scope.getRecords(bad);assert.equal(refused.status,'UNAVAILABLE');assert(!('records' in refused));
        }
        assert.equal(scope.stats().requests,count,'bad requests never reach transport');
      } finally {scope.close();}
    });
    const defects = {
      execution: r=>{r[0][0]=ZeroHash;return r;}, revision:r=>{r[0][1]++;return r;},
      block:r=>{r[0][2]++;return r;}, admission:r=>{r[0][3]++;return r;},
      reordered:r=>{[r[1][0],r[1][1]]=[r[1][1],r[1][0]];return r;},
      truncated:r=>{r[1].pop();return r;}, extra:r=>{r[1].push(r[1][0]);return r;},
    };
    for (const [name,mutate] of Object.entries(defects)) await t.test('refuses '+name+' with acquisition evidence and no prefix',async()=>{
      const {scope}=await open({transform:(m,p,raw)=>m==='eth_call'&&p[0].data.startsWith(selector)?codec.encodeFunctionResult('getRecordsChecked',mutate(plain(codec.decodeFunctionResult('getRecordsChecked',raw)))):raw});
      try {const r=await scope.getRecords(ids);assert.equal(r.status,'UNAVAILABLE');assert(!('records'in r));assert(Number.isInteger(r.evidenceId));}
      finally {scope.close();}
    });
    await t.test('explicit identical retry acquires fresh evidence after a semantically bad response',async()=>{
      for(const mutate of Object.values(defects)) {
        let faulty=true;
        const {scope}=await open({transform:(m,p,raw)=>faulty&&m==='eth_call'&&p[0].data.startsWith(selector)?codec.encodeFunctionResult('getRecordsChecked',mutate(plain(codec.decodeFunctionResult('getRecordsChecked',raw)))):raw});
        try {
          const first=await scope.getRecords(ids);assert.equal(first.status,'UNAVAILABLE');assert(!('records'in first));
          const before=scope.stats().requests;faulty=false;
          const recovered=await scope.getRecords(ids);assert.equal(recovered.status,'OK',recovered.reason);
          assert.equal(scope.stats().requests,before+1);assert.notEqual(recovered.evidenceId,first.evidenceId);
          assert.deepEqual(recovered.records.map(row=>row.recordId),ids);assert.equal((await scope.seal()).status,'SEALED');
        } finally {scope.close();}
      }
    });
    for (const name of ['noncanonical','over-budget','old deployment']) await t.test('refuses '+name,async()=>{
      const {scope}=await open({transform:(m,p,raw)=>{
        if(m!=='eth_call'||!p[0].data.startsWith(selector))return raw;
        if(name==='old deployment')throw Error('execution reverted: absent experimental selector');
        return name==='noncanonical'?raw+'00'.repeat(32):'0x'+'00'.repeat(DEFAULT_LIMITS.responseBytes);
      }});
      try {const r=await scope.getRecords(ids);assert.equal(r.status,'UNAVAILABLE');assert(!('records'in r));assert(Number.isInteger(r.evidenceId));}
      finally {scope.close();}
    });
    await t.test('seal waits for pending data; abort and source replacement cannot publish late rows',async()=>{
      for (const fault of ['none','abort','source']) {
        const entered=deferred(),release=deferred(),cancel=new AbortController();
        const {scope,source}=await open({signal:cancel.signal,transform:async(m,p,raw)=>{
          if(m==='eth_call'&&p[0].data.startsWith(selector)){entered.resolve();await release.promise;}return raw;
        }});
        try {
          const pending=scope.getRecords(ids);await entered.promise;
          let sealed=false;const seal=scope.seal().then(r=>{sealed=true;return r;});
          await new Promise(r=>setTimeout(r,10));assert.equal(sealed,false);
          if(fault==='abort')cancel.abort();if(fault==='source')source.epoch++;
          release.resolve();const result=await pending, end=await seal;
          assert.equal(result.status,fault==='none'?'OK':'UNAVAILABLE');
          assert.equal(end.status,fault==='none'?'SEALED':'UNAVAILABLE');
          if(fault!=='none')assert(!('records'in result));
        } finally {release.resolve();scope.close();}
      }
    });
    await t.test('reorg before sealing refuses completed observation',async()=>{
      let reorg=false;
      const {scope}=await open({transform:(m,p,raw)=>reorg&&m==='eth_getBlockByNumber'?{...raw,hash:ZeroHash}:raw});
      try {assert.equal((await scope.getRecords(ids)).status,'OK');reorg=true;assert.equal((await scope.seal()).status,'UNAVAILABLE');}
      finally {scope.close();}
    });
  },{profile:'reads'});
});

// Break: mistaking ABI body bytes for JSON-RPC transport bytes under the fixed cap.
test('eight maximal results fit the existing response budget including JSON framing',()=>{
  const body='0x'+'00'.repeat(8192),rows=Array.from({length:8},()=>[ZeroHash,ZeroHash,body,1]);
  const result=codec.encodeFunctionResult('getRecordsChecked',[[ZeroHash,1,1,1],rows]);
  assert.equal((result.length-2)/2,67264);
  assert.equal(Buffer.byteLength(JSON.stringify({jsonrpc:'2.0',id:1,result})),134566);
  assert(Buffer.byteLength(JSON.stringify({jsonrpc:'2.0',id:1,result}))<DEFAULT_LIMITS.responseBytes);
});
