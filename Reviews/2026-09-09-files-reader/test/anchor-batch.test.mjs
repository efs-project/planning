import test from 'node:test';
import assert from 'node:assert/strict';
import {compileUpgrade,withUpgrade,mountedFixture,A,B} from './fixture.mjs';
import {openDirectory} from '../files-reader.mjs';
import {createFixtureReader} from '../reader-scope.mjs';
import {groupLeaf} from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import {scalar,ready,project,selectors,capabilityManifest} from './anchor-batch-fixture.mjs';

// Break: candidate still acquires each source-checked anchor separately.
test('real Files anchors batch while the frozen scalar consumer gives identical qualified rows', {timeout:300000},async t=>{
  compileUpgrade();
  await withUpgrade(async lab=>{
    const f=await mountedFixture(lab);
    for(let i=0;i<8;i++){
      const name=i?`name-${i}.txt`:'note.txt',entry=i?await f.claim(A,name,i%2?f.fileB:f.fileA):f.entryA;
      await f.claim(B,name,f.fileA,{target:entry});
    }
    const expected=capabilityManifest(lab),blockTag=await lab.rpc('eth_blockNumber');
    const observe=async(open,manifest)=>{const scope=await ready(lab,{expected:manifest,blockTag});try {const stream=open(scope,{mountId:f.mounts.aFirst});const snapshot=await stream.loadMore();return {snapshot,counts:selectors(lab,scope.evidence())};}finally{scope.close();}};
    const before=await observe(scalar.openDirectory,expected),after=await observe(openDirectory,expected);
    assert.deepEqual(project(after.snapshot),project(before.snapshot));
    assert.equal(after.snapshot.rows.length,8);assert.equal(after.snapshot.coverage,'COMPLETE');
    assert((after.counts.getRecordsChecked??0)>0,'real checked anchor acquisition');
    assert(after.counts.getRecord<before.counts.getRecord,'fewer real scalar acquisitions');
    await t.test('legacy source never probes a batch selector',async()=>{
      const legacy=structuredClone(expected);for(const value of Object.values(legacy.implementations))delete value.readCapabilities;
      const result=await observe(openDirectory,legacy);
      assert.equal(result.counts.getRecordsChecked??0,0);assert.deepEqual(project(result.snapshot),project(before.snapshot));
    });
    await t.test('unique shared anchor IDs and successful same-scope reuse make no duplicate batch',async()=>{
      const scope=await ready(lab,{expected,blockTag});
      try{
        const stream=openDirectory(scope,{mountId:f.mounts.aFirst});const first=await stream.loadMore();
        const batches=scope.evidence().filter(e=>e.method==='eth_call'&&e.params[0].data.startsWith(lab.readIface.getFunction('getRecordsChecked').selector));
        assert.equal(batches.length,1,'two principals share eight identical Record IDs');
        const decoded=lab.readIface.decodeFunctionData('getRecordsChecked',batches[0].params[0].data);
        assert.equal(decoded[1].length,8);assert.equal(new Set(decoded[1]).size,8);
        const before=scope.stats().requests;const again=await openDirectory(scope,{mountId:f.mounts.aFirst}).loadMore();
        assert.deepEqual(project(again),project(first));assert.equal(scope.stats().requests-before,4,'only fresh aggregate seal controls');
      }finally{scope.close();}
    });
    await t.test('malformed capability refuses configuration and active source capability is immutable',async()=>{
      for(const bad of ['v2',false,null,8]){
        const manifest=capabilityManifest(lab,bad);
        const refused=await createFixtureReader({source:{identity:manifest.source,epoch:1,request:lab.rpc},context:{expected:manifest}}).open();
        assert.equal(refused.status,'UNAVAILABLE');assert.match(refused.reason,/manifest read capabilities/);assert.deepEqual(refused.evidence,[]);
      }
      const scope=await ready(lab,{expected,blockTag});
      try{assert.deepEqual(scope.capabilities,{checkedRecords:true});assert.throws(()=>{scope.capabilities.checkedRecords=false;},TypeError);}
      finally{scope.close();}
    });
    const faults={
      'false capability':()=>{throw Error('checked selector unavailable');},
      'malformed eighth':r=>{r[1][7][2]='0x';},
      'absent eighth':r=>{r[1][7][3]=0n;},
      'future eighth':r=>{r[1][7][3]=r[0][3]+1n;},
      'altered Type with wrong content ID':r=>{r[1][7][1]='0x'+'f'.repeat(64);},
      'wrong basis':r=>{r[0][3]++;},
      'wrong order':r=>{[r[1][0],r[1][1]]=[r[1][1],r[1][0]];},
    };
    for(const [name,mutate] of Object.entries(faults))await t.test(name+' cannot fall back and an explicit retry recovers',async()=>{
      let faulty=true;const batchIds=[];
      const request=async(m,p,o)=>{
        const raw=await lab.rpc(m,p,o);if(m!=='eth_call')return raw;
        const q=lab.readIface.parseTransaction({data:p[0].data});if(q?.name!=='getRecordsChecked')return raw;
        batchIds.push([...q.args[1]]);if(!faulty)return raw;
        const values=lab.readIface.decodeFunctionResult(q.name,raw).toArray(true);mutate(values);return lab.readIface.encodeFunctionResult(q.name,values);
      };
      const scope=await ready(lab,{expected,blockTag,request});
      try{
        const stream=openDirectory(scope,{mountId:f.mounts.aFirst});const failed=await stream.loadMore();
        assert.equal(failed.qualification.status,'UNAVAILABLE');assert.equal(failed.rowsEvidence,'PRIOR_SEALED');assert.equal(failed.rows.length,0);
        const data=scope.evidence().filter(e=>e.purpose==='data'),batch=data.findIndex(e=>e.method==='eth_call'&&e.params[0].data.startsWith(lab.readIface.getFunction('getRecordsChecked').selector));
        assert(batch>=0);assert.equal(data.slice(batch+1).length,0,'no new data solely after failed prefetch');
        faulty=false;const recovered=await stream.loadMore();
        assert.equal(recovered.qualification.status,'QUALIFIED',recovered.detail);assert.equal(recovered.rows.length,8);
        assert.equal(batchIds.length,2);
        if(['false capability','wrong basis','wrong order'].includes(name))assert.deepEqual(batchIds[1],batchIds[0],'same ordered IDs reacquired after whole-batch failure');
        else assert.equal(batchIds[1].length,1,'valid siblings stay cached, failed assessment is not poison');
      }finally{scope.close();}
    });
    await t.test('occurrence disagreement prevents any batch of the untrusted posting ID',async()=>{
      const request=async(m,p,o)=>{const raw=await lab.rpc(m,p,o);if(m!=='eth_call')return raw;const q=lab.readIface.parseTransaction({data:p[0].data});if(q?.name!=='getOccurrenceByOrdinal')return raw;const v=lab.readIface.decodeFunctionResult(q.name,raw).toArray(true);if(v[3]===f.types['BindingSet/1'])v[2]='0x'+'f'.repeat(64);return lab.readIface.encodeFunctionResult(q.name,v);};
      const scope=await ready(lab,{expected,blockTag,request});try{const r=await openDirectory(scope,{mountId:f.mounts.aFirst}).loadMore();assert.equal(r.qualification.status,'UNAVAILABLE');assert.equal(selectors(lab,scope.evidence()).getRecordsChecked??0,0);}finally{scope.close();}
    });
    await t.test('a content-addressed Record outside the Files Type profile remains UNSUPPORTED',async()=>{
      const group=groupLeaf(lab.inputs.meta,'0x'+lab.inputs.candidates.groups[0].groupHex),id=f.id(group),ordinals=new Set();
      const request=async(m,p,o)=>{
        const raw=await lab.rpc(m,p,o);if(m!=='eth_call')return raw;const q=lab.readIface.parseTransaction({data:p[0].data});
        if(q?.name==='pagePostingsHydrated'){const v=lab.readIface.decodeFunctionResult(q.name,raw).toArray(true);if(v[1].length){ordinals.add(String(v[1][0][0]));v[1][0][3]=id;}return lab.readIface.encodeFunctionResult(q.name,v);}
        if(q?.name==='getOccurrenceByOrdinal'&&ordinals.has(String(q.args[0]))){const v=lab.readIface.decodeFunctionResult(q.name,raw).toArray(true);v[2]=id;v[3]=group.typeId;return lab.readIface.encodeFunctionResult(q.name,v);}
        return raw;
      };
      const scope=await ready(lab,{expected,blockTag,request});try{const result=await openDirectory(scope,{mountId:f.mounts.aFirst}).loadMore();assert.equal(result.reason,'UNSUPPORTED_TYPE');assert.equal(result.qualification.status,'UNAVAILABLE');assert.equal(result.rows.length,0);}finally{scope.close();}
    });
    for(const mode of ['close','abort','source switch','seal reorg'])await t.test(mode+' at first group prevents a new sealed frontier',async()=>{
      let stream,source,triggered=false;const cancel=new AbortController();
      const request=async(m,p,o)=>{const raw=await lab.rpc(m,p,o);if(m==='eth_call'&&p[0].data.startsWith(lab.readIface.getFunction('getRecordsChecked').selector)){triggered=true;if(mode==='close')stream.close();if(mode==='abort')cancel.abort();if(mode==='source switch')source.epoch++;}if(mode==='seal reorg'&&triggered&&m==='eth_getBlockByNumber')return {...raw,hash:'0x'+'f'.repeat(64)};return raw;};
      source={identity:expected.source,epoch:1,request};const scope=await ready(lab,{expected,blockTag,source,signal:cancel.signal});
      try{stream=openDirectory(scope,{mountId:f.mounts.aFirst});const result=await stream.loadMore();assert(triggered);assert.equal(result.qualification.status,'UNAVAILABLE');assert.equal(result.rows.length,0);assert.equal(result.rowsEvidence,'PRIOR_SEALED');assert.equal(selectors(lab,scope.evidence()).getRecordsChecked,1);if(mode==='close'){const data=scope.evidence().filter(e=>e.purpose==='data');assert(data.at(-1).params[0].data.startsWith(lab.readIface.getFunction('getRecordsChecked').selector),'closure stops all new data after current batch');assert.equal((await scope.call('getRecord',[f.fileA])).status,'OK','stream never closes caller scope');}}finally{scope.close();}
    });
    await t.test('request and byte exhaustion retain prior sealed rows and terminal scope requires a fresh acquisition',async()=>{
      for(const limits of [{maxRequests:100},{maxBytes:after.snapshot.evidence.reduce((n,e)=>n+e.bytes,0)-100}]){
        const source={identity:expected.source,epoch:1,request:lab.rpc};let scope=await ready(lab,{expected,blockTag,source,limits});
        const stream=openDirectory(scope,{mountId:f.mounts.aFirst,pageSize:1});let prior=null,result;
        try{
          for(let i=0;i<10;i++){result=await stream.loadMore();if(result.qualification.status==='UNAVAILABLE')break;prior=result;}
          assert.equal(result.qualification.status,'UNAVAILABLE');if(prior){assert.deepEqual(result.rows,prior.rows);assert.deepEqual(result.progress,prior.progress);}
          const count=scope.stats().requests;await stream.loadMore();assert.equal(scope.stats().requests,count,'terminal scope cannot issue an implicit retry');
          if(prior){const next=await ready(lab,{expected,blockTag,source});assert.equal((await stream.resume(next)).status,'RESUMED');scope.close();scope=next;for(let i=0;i<10;i++){result=await stream.loadMore();if(result.coverage==='COMPLETE')break;}assert.equal(result.coverage,'COMPLETE');assert.equal(result.rows.length,8);}
        }finally{scope.close();}
      }
    });
    // Larger pages exercise chunk boundaries, without changing any ceiling.
    for(let i=8;i<32;i++)await f.claim(A,`name-${i}.txt`,i%2?f.fileB:f.fileA);
    await t.test('close mid-group does not dispatch the remaining groups of a 32-row page',async()=>{
      let stream,batches=0;const request=async(m,p,o)=>{const raw=await lab.rpc(m,p,o);if(m==='eth_call'&&p[0].data.startsWith(lab.readIface.getFunction('getRecordsChecked').selector)){batches++;stream.close();}return raw;};
      const scope=await ready(lab,{expected,request});try{stream=openDirectory(scope,{mountId:f.mounts.aFirst,pageSize:32});const result=await stream.loadMore();assert.equal(result.reason,'STREAM_CLOSED');assert.equal(batches,1);assert.equal(result.rows.length,0);assert.equal((await scope.call('getRecord',[f.fileA])).status,'OK');}finally{scope.close();}
    });
    await t.test('failed second page retains its sealed frontier, retries identical IDs, and capability drift refuses resume',async()=>{
      let faulty=false;const attempts=[];
      const request=async(m,p,o)=>{const raw=await lab.rpc(m,p,o);if(m==='eth_call'&&p[0].data.startsWith(lab.readIface.getFunction('getRecordsChecked').selector)){attempts.push([...lab.readIface.decodeFunctionData('getRecordsChecked',p[0].data)[1]]);if(faulty)throw Error('temporary batch unavailable');}return raw;};
      const source={identity:expected.source,epoch:1,request},scope=await ready(lab,{expected,source});
      try{
        const stream=openDirectory(scope,{mountId:f.mounts.aFirst,pageSize:8}),prior=await stream.loadMore();assert.equal(prior.coverage,'PARTIAL');
        faulty=true;const failed=await stream.loadMore();assert.equal(failed.rowsEvidence,'PRIOR_SEALED');assert.deepEqual(failed.rows,prior.rows);assert.deepEqual(failed.progress,prior.progress);
        faulty=false;const recovered=await stream.loadMore();assert.equal(recovered.qualification.status,'QUALIFIED');assert.equal(recovered.rows.length,16);assert.deepEqual(attempts[2],attempts[1]);
        const legacy=structuredClone(expected);for(const value of Object.values(legacy.implementations))delete value.readCapabilities;
        const next=await ready(lab,{expected:legacy,source,blockTag:'0x'+scope.basis.blockNumber.toString(16)});
        try{assert.equal((await stream.resume(next)).reason,'BASIS_MISMATCH');assert.equal(stream.snapshot(),recovered);}finally{next.close();}
      }finally{scope.close();}
    });
    for(const size of [1,8,9,32])await t.test('page size '+size+' preserves frozen scalar outcome and groups at eight',async()=>{
      const tag=await lab.rpc('eth_blockNumber');const a=await ready(lab,{expected,blockTag:tag}),b=await ready(lab,{expected,blockTag:tag});
      try{const scalarResult=await scalar.openDirectory(a,{mountId:f.mounts.aFirst,pageSize:size}).loadMore(),candidate=await openDirectory(b,{mountId:f.mounts.aFirst,pageSize:size}).loadMore();assert.deepEqual(project(candidate),project(scalarResult));const calls=b.evidence().filter(e=>e.method==='eth_call'&&e.params[0].data.startsWith(lab.readIface.getFunction('getRecordsChecked').selector));assert.equal(calls.length,Math.ceil(size/8));for(const e of calls){const ids=lab.readIface.decodeFunctionData('getRecordsChecked',e.params[0].data)[1];assert(ids.length>=1&&ids.length<=8);}assert.equal(candidate.rows.length,size);}finally{a.close();b.close();}
    });
    await t.test('an empty source-checked directory makes no batch acquisition',async()=>{
      const root=await f.object('empty-anchor-directory','directory'),mount=await f.mount(root),scope=await ready(lab,{expected});
      try{const result=await openDirectory(scope,{mountId:mount.id}).loadMore();assert.equal(result.coverage,'COMPLETE');assert.equal(result.rows.length,0);assert.equal(selectors(lab,scope.evidence()).getRecordsChecked??0,0);}finally{scope.close();}
    });
    await t.test('capability belongs to the active implementation at the pinned historical block',async()=>{
      const manifest=structuredClone(expected);delete manifest.implementations[manifest.components.UpgradeableReadFixtureCore.address].readCapabilities;
      const old=await lab.rpc('eth_blockNumber');await lab.upgrade();
      const historical=await ready(lab,{expected:manifest,blockTag:old}),current=await ready(lab,{expected:manifest});
      try{assert.equal(historical.basis.revision,1n);assert.equal(historical.capabilities.checkedRecords,false);assert.equal(current.basis.revision,2n);assert.equal(current.capabilities.checkedRecords,true);}finally{historical.close();current.close();}
    });
  },{profile:'reads'});
});
