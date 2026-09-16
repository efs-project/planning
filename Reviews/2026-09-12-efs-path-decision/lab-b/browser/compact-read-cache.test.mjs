import test from 'node:test';
import assert from 'node:assert/strict';
import * as compact from './compact-sdk.mjs';
const params=[{to:'0x01',data:'0x12345678'}, {blockHash:'0xabc',requireCanonical:true}];
function cache(options={}) {
  assert.equal(typeof compact.createExactReadCache,'function','bounded exact-read cache exists');
  return compact.createExactReadCache({identity:'chain/realm/profile',...options});
}
test('raw successful reads deduplicate in-flight, stay immutable, and isolate instances/options',async()=>{
  const a=cache(),b=cache();let calls=0,release;
  const work=()=>{calls++;return new Promise(r=>{release=r;});};
  const x=a.read('eth_call',params,work),y=a.read('eth_call',params,work);
  await Promise.resolve();release('0x1234');assert.deepEqual(await Promise.all([x,y]),['0x1234','0x1234']);
  assert.equal(calls,1);assert.equal(await a.read('eth_call',params,()=>{throw Error('hit');}),'0x1234');
  await b.read('eth_call',params,async()=>{calls++;return '0x00';});
  for(const option of [{from:'0x02'},{value:'0x1'},{gas:'0x999'},{data:'0x87654321'}])
    await a.read('eth_call',[{...params[0],...option},params[1]],async()=>{calls++;return '0x00';});
  await a.read('eth_call',[...params,{balance:'0x1'}],async()=>{calls++;return '0x00';});
  assert.equal(calls,7);assert.equal(a.stats().inflightHits,1);assert.equal(a.stats().hits,1);
});
test('failed validation/rejection is retried and finite entry/byte/inflight budgets are enforced',async()=>{
  const c=cache({maxEntries:1,maxBytes:1024,maxInflight:1});
  await assert.rejects(c.read('eth_call',params,async()=>{throw Error('offline');}),/offline/);
  await assert.rejects(c.read('eth_call',params,async()=>'invalid',()=>{throw Error('ABI');}),/ABI/);
  assert.equal(await c.read('eth_call',params,async()=>'0x01'),'0x01');
  await c.read('eth_call',[params[0],{...params[1],blockHash:'0xdef'}],async()=>'0x02');
  let reads=0;await c.read('eth_call',params,async()=>{reads++;return '0x03';});assert.equal(reads,1);
  await c.read('eth_call',params,async()=>'0x04');assert(c.stats().evictions>=1);
  const small=cache({maxBytes:10});await small.read('eth_call',params,async()=>'0x00');assert.equal(small.stats().entries,0);
  const byteBound=cache({maxEntries:10,maxBytes:600});
  await byteBound.read('eth_call',params,async()=>'0x'+'11'.repeat(180));
  await byteBound.read('eth_call',[{...params[0],data:'0x87654321'},params[1]],async()=>'0x'+'22'.repeat(180));
  assert.equal(byteBound.stats().entries,1,'byte budget evicts before entry count');assert.equal(byteBound.stats().evictions,1);
  let release;const pending=c.read('eth_call',[{},params[1]],()=>new Promise(r=>{release=r;}));await Promise.resolve();
  await assert.rejects(c.read('eth_call',[{other:true},params[1]],async()=>'0x00'),/INFLIGHT_LIMIT/);release('0x00');await pending;
  assert(c.stats().bytes<=1024);
});
