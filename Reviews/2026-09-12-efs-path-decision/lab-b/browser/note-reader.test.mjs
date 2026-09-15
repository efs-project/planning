import test from 'node:test';
import assert from 'node:assert/strict';
import {loadEthers} from '../script/compact-environment.mjs';

const api=await import('./note-reader.mjs').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return {};throw error;});
const e=await loadEthers();
const profiles=Object.fromEntries(['v1','v11','v2'].map(k=>[k,{typeId:e.id(k),ruleHash:e.id('rule/'+k)}]));
const source=(key,body)=>({knowledge:'PRESENT',coverage:'COMPLETE',basis:{grade:'RPC_OBSERVED',blockHash:e.id('block')},
  value:{recordId:e.id('record'),typeId:profiles[key].typeId,body,descriptor:{shape:e.id(api.NOTE_SHAPES?.[key]??key),ruleId:profiles[key].ruleHash},
    provenance:{firstAdmission:'7',author:'retained-author'}}});

test('explicit compatible projections reuse text logic without erasing original bytes or title',async()=>{
  assert.equal(typeof api.createNoteReader,'function','missing exact-Type Note reader');
  const cases=[['v1','0x4e545631000568656c6c6f'],['v11','0x4e543131000568656c6c6f010154']];
  const oldView=v=>v.text;
  for(const [key,body] of cases){const raw=source(key,body),reader=api.createNoteReader({ethers:e,profiles,sdk:{readTypedRecord:async()=>raw}});
    const result=await reader.readNote({record:e.id('record')});
    assert.equal(oldView(result.value),'hello');assert.equal(result.source,raw);assert.equal(result.source.value.body,body);
    assert.deepEqual(result.projection.omittedFields,key==='v11'?['title']:[]);assert.equal(result.projection.loss,'NONE');
  }
});

test('exact allowlist, malformed bytes, rich adapter and upstream qualification cannot silently become text',async()=>{
  assert.equal(typeof api.createNoteReader,'function','missing exact-Type Note reader');
  const read=async(raw,args={},pins=profiles)=>api.createNoteReader({ethers:e,profiles:pins,sdk:{readTypedRecord:async()=>raw}}).readNote(args);
  assert.equal((await read(source('v11','0x4e543131000568656c6c6f00'),{claimedVersion:'v1.1'},{v1:profiles.v1})).knowledge,'UNSUPPORTED');
  for(const body of ['0x','0x4e5456310000','0x4e54563100056869','0x4e54563100016800','0x4e5456310001ff',
    '0x4e5431310001680200','0x4e5431310001680100']){
    assert.equal((await read(source(body.startsWith('0x4e543131')?'v11':'v1',body))).knowledge,'INVALID',body);
  }
  const wrongRule=source('v1','0x4e545631000168');wrongRule.value.descriptor.ruleId=e.id('wrong');
  assert.equal((await read(wrongRule)).knowledge,'INVALID');
  const rich=source('v2','0x4e54563202000568656c6c6f');
  assert.equal((await read(rich)).knowledge,'UNSUPPORTED');
  assert.equal((await read(rich,{adapter:api.V2_ADAPTER})).knowledge,'UNSUPPORTED');
  const lossy=await read(rich,{adapter:api.V2_ADAPTER,allowLoss:true});
  assert.equal(lossy.value.text,'hello');assert.deepEqual(lossy.projection.losses,['emphasis']);assert.equal(lossy.projection.loss,'LOSSY');
  const plain=await read(source('v2','0x4e54563201000568656c6c6f'),{adapter:api.V2_ADAPTER});
  assert.equal(plain.value.text,'hello');assert.equal(plain.projection.loss,'NONE');
  for(const knowledge of ['UNKNOWN','CONFLICT','INVALID','ABSENT']){
    const raw={...source('v1','0x4e545631000168'),knowledge,coverage:'PARTIAL'};
    const result=await read(raw);assert.equal(result.knowledge,knowledge);assert.equal(result.value,null);assert.equal(result.source,raw);
  }
  const partial={...source('v1','0x4e545631000168'),coverage:'PARTIAL'};
  assert.equal((await read(partial)).knowledge,'UNKNOWN');
});
