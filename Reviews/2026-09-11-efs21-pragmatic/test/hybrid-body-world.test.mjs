import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {E,ROOT,withWorld} from '../scripts/world.mjs';
import {observeBody} from '../scripts/hybrid-body-benchmark.mjs';
import {compareBodyStorage} from '../scripts/body-storage-benchmark.mjs';
import {comparePackedPresence} from '../scripts/packed-presence-benchmark.mjs';

test('legacy default runners refuse hybrid before creating a world or building',async()=>{
  await assert.rejects(()=>compareBodyStorage(),/explicit frozenReplay/);
  await assert.rejects(()=>comparePackedPresence(),/explicit frozenReplay/);
});

test('real benchmark CLI finishes the shared workload namespace seam without top-level-await deadlock',{timeout:60000},()=>{
  const r=spawnSync(process.execPath,['scripts/hybrid-body-benchmark.mjs','--probe'],{cwd:ROOT,encoding:'utf8',timeout:55000});
  assert.equal(r.status,0,r.stderr||r.error?.message);
  const probe=JSON.parse(r.stdout);assert.equal(probe.actionCount,1);assert.notEqual(probe.root,E.ZeroHash);
  assert(probe.cleanup.stopped&&probe.cleanup.cacheRemoved);
});

test('actual Record owner packs metadata and bounds the fixed word array',()=>{
  const r=spawnSync('forge',['inspect','--force','NativeRecordKernel','storage-layout','--json'],{cwd:ROOT+'contracts',encoding:'utf8',timeout:180000});
  assert.equal(r.status,0,r.stderr);
  const layout=JSON.parse(r.stdout),slots=Object.fromEntries(layout.storage.map(x=>[x.label,x]));
  assert.equal(slots.records.slot,'0');assert.equal(slots.sparseBodyWords.slot,'1');
  assert.equal(slots.locations,undefined);assert.equal(slots.reservedLegacyPresence,undefined);
  const record=layout.types[layout.types[slots.records.type].value];
  assert.equal(record.numberOfBytes,'64');
  assert.deepEqual(record.members.map(({label,slot,offset})=>({label,slot,offset})),[
    {label:'typeId',slot:'0',offset:0},{label:'pointer',slot:'1',offset:0},{label:'bodyLength',slot:'1',offset:20},{label:'present',slot:'1',offset:22},{label:'backend',slot:'1',offset:23},
  ]);
  const words=layout.types[layout.types[slots.sparseBodyWords.type].value];assert.equal(words.label,'bytes32[128]');assert.equal(words.numberOfBytes,'4096');
});

test('fresh hybrid and both forced paths keep exact bytes and helper outage behavior',{timeout:180000},async()=>{
  for(const selection of ['forced-code','forced-words','current']){
    const result=await withWorld(async w=>{
      const c=w.client,helper=w.provenance.runtimes.BodyWriter.address;
      const body='0x01',id=E.keccak256(E.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes'],[E.id('EFS21_RECORD_V1'),w.config.rawType,body]));
      await c.write('storeRecord',[w.config.rawType,body]);
      const observation=await observeBody(w,id,body,await c.observe());
      assert.equal(observation.backend,selection==='forced-code'?0:1);
      const original=await c.rpc('eth_getCode',[helper,'latest']);
      await c.rpc('anvil_setCode',[helper,'0x00']);
      try{
        await assert.rejects(()=>c.write('storeRecord',[w.config.rawType,body]),/identity mismatch/i);
        await w.faultWrite('storeRecord',[w.config.rawType,body],'direct dedup during helper outage',{expectedStatus:'0x1'});
        await w.faultWrite('storeRecord',[w.config.rawType,'0x02'],'new admission during helper outage');
        const raw=await c.rpc('eth_call',[{to:w.config.kernel,data:c.iface.encodeFunctionData('readRecord',[id])},'latest']);
        assert.equal(c.iface.decodeFunctionResult('readRecord',raw)[0].body,body,'unqualified point bytes remain independently readable');
      }finally{await c.rpc('anvil_setCode',[helper,original]);}
      return {};
    },{kernelArtifact:selection});
    assert(result.cleanup.stopped&&result.cleanup.cacheRemoved);
  }
});
