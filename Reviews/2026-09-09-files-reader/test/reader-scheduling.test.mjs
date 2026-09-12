import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureReader, DEFAULT_LIMITS } from '../reader-scope.mjs';
import { withUpgrade, mountedFixture, A, B, role } from './fixture.mjs';
import { oracle, comparable } from './oracle.mjs';
import { openDirectory, lookupName } from '../files-reader.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const make=(lab,request,limits)=>createFixtureReader({source:{identity:lab.expected.source,epoch:1,request},context:{expected:lab.expected,limits}});
const ready=async reader=>{const opened=await reader.open();assert.equal(opened.status,'READY',opened.reason);return opened.scope;};

// Break: sequential seal controls cannot overlap, or sealing returns before all four replies.
test('four real pinned seal controls overlap and every reply gates SEALED',{timeout:300000},async()=>{
  await withUpgrade(async lab=>{
    let holding=false,active=0,sealPeak=0,settled=false,timer,scope,sealed;
    const calls=[],four=deferred();
    const request=async(method,params,options)=>{
      if(!holding)return lab.rpc(method,params,options);
      const gate=deferred(),completed=deferred();calls.push({method,params,gate,completed});
      active++;sealPeak=Math.max(sealPeak,active);if(calls.length===4)four.resolve();
      try {const raw=await lab.rpc(method,params,options);await gate.promise;return raw;}
      finally {active--;completed.resolve();}
    };
    try {
      scope=await ready(make(lab,request,{maxInFlight:4}));holding=true;
      sealed=scope.seal();sealed.then(()=>{settled=true;});
      // The baseline is released on a bounded test-only timer, then fails 1 !== 4.
      await Promise.race([four.promise,new Promise(resolve=>{timer=setTimeout(()=>{calls[0]?.gate.resolve();resolve();},200);})]);
      clearTimeout(timer);assert.equal(sealPeak,4);assert.equal(settled,false);
      assert.deepEqual(calls.map(c=>c.method).sort(),['eth_call','eth_call','eth_chainId','eth_getBlockByNumber']);
      assert.deepEqual(calls.filter(c=>c.method==='eth_call').map(c=>c.params[0].data).sort(),
        ['fixtureReadContext','counts()'].map(name=>lab.readIface.encodeFunctionData(name,[])).sort());
      for(const c of calls){
        if(c.method==='eth_call')assert.deepEqual(c.params[1],{blockHash:scope.basis.blockHash,requireCanonical:true});
        if(c.method==='eth_getBlockByNumber')assert.deepEqual(c.params,['0x'+scope.basis.blockNumber.toString(16),false]);
        if(c.method==='eth_chainId')assert.deepEqual(c.params,[]);
      }
      for(const c of calls.slice(0,3)){c.gate.resolve();await c.completed.promise;await pause(0);assert.equal(settled,false);}
      calls[3].gate.resolve();assert.equal((await sealed).status,'SEALED');
      assert.equal(scope.stats().maxInFlight,4);assert(scope.evidence().every(e=>e.endedMs!==null));
    } finally {
      clearTimeout(timer);holding=false;for(const c of calls)c.gate.resolve();
      if(sealed)await sealed;scope?.close();
    }
  },{profile:'reads'});
});

// Break: one rejected final control can be followed by late success or cached data.
test('failed concurrent final control settles evidence and ignored-signal late replies stay inert',{timeout:300000},async()=>{
  await withUpgrade(async lab=>{
    const four=deferred(),gates=[];let holding=false,active=0,peak=0,scope,sealed;
    const request=async(method,params,options)=>{
      if(!holding)return lab.rpc(method,params,options);
      const gate=deferred(),done=deferred();gates.push({method,gate,done});active++;peak=Math.max(peak,active);
      if(gates.length===4)four.resolve();
      try {const raw=await lab.rpc(method,params,options);await gate.promise;return method==='eth_chainId'?'0x1':raw;}
      finally {active--;done.resolve();}
    };
    try {
      scope=await ready(make(lab,request));assert(scope.evidence().every(e=>e.purpose==='qualification'));
      const before=scope.stats();holding=true;sealed=scope.seal();await four.promise;
      // Header must arrive with the faulty chain for the canonical pair to validate.
      for(const c of gates.filter(c=>c.method!=='eth_call'))c.gate.resolve();
      const failed=await sealed;assert.equal(failed.status,'UNAVAILABLE');assert.match(failed.reason,/chain changed/);
      assert.equal(peak,4);assert.equal(scope.stats().requests-before.requests,4);
      assert.equal(scope.stats().requests,failed.evidence.length);assert(failed.evidence.every(e=>e.endedMs!==null));
      const terminal=JSON.stringify(failed.evidence),stats=scope.stats();
      assert.equal(stats.bytes,failed.evidence.reduce((sum,e)=>sum+e.bytes,0));
      assert(stats.bytes<=DEFAULT_LIMITS.maxBytes);assert(stats.requests<=DEFAULT_LIMITS.maxRequests);
      for(const c of gates)c.gate.resolve();await Promise.all(gates.map(c=>c.done.promise));await pause(0);
      assert.equal(JSON.stringify(scope.evidence()),terminal);assert.equal(scope.stats().bytes,stats.bytes);
      assert.equal((await scope.call('getRecord',['0x'+'00'.repeat(32)])).status,'UNAVAILABLE');
      assert.equal((await scope.seal()).status,'UNAVAILABLE');assert.equal(scope.stats().requests,stats.requests);
      assert.equal(scope.stats().cacheHits,stats.cacheHits);assert.equal(scope.stats().inFlight,0);
    } finally {holding=false;for(const c of gates)c.gate.resolve();if(sealed)await sealed;scope?.close();}
  },{profile:'reads'});
});

// Break: abort starts queued controls or mutates terminal evidence after ignored cancellation.
test('abort refuses queued opening and seal controls without application work',{timeout:300000},async()=>{
  await withUpgrade(async lab=>{
    for(const phase of ['opening','seal']) {
      let holding=phase==='opening',attempts=0,scope,pending;
      const entered=deferred(),release=deferred(),done=deferred(),cancel=new AbortController();
      const request=async(method,params,options)=>{
        attempts++;if(!holding)return lab.rpc(method,params,options);
        entered.resolve();try {const raw=await lab.rpc(method,params,options);await release.promise;return raw;}
        finally {done.resolve();}
      };
      try {
        const reader=make(lab,request,{maxInFlight:1});
        if(phase==='opening')pending=reader.open({signal:cancel.signal});
        else {
          const opened=await reader.open({signal:cancel.signal});assert.equal(opened.status,'READY',opened.reason);scope=opened.scope;
          holding=true;pending=scope.seal();
        }
        await entered.promise;if(scope)assert.equal(scope.stats().queued,3);
        const atAbort=attempts;cancel.abort();const failed=await pending;
        assert.equal(failed.status,'UNAVAILABLE');assert.equal(failed.reason,'aborted');
        assert.equal(failed.evidence.length,atAbort);assert(failed.evidence.every(e=>e.endedMs!==null&&e.purpose!=='data'));
        const terminal=JSON.stringify(failed.evidence);
        release.resolve();await done.promise;await pause(0);assert.equal(attempts,atAbort);
        assert.equal(JSON.stringify(failed.evidence),terminal);
        if(scope){
          assert.equal(JSON.stringify(scope.evidence()),terminal);assert.equal(scope.stats().maxInFlight,1);
          assert.equal(scope.stats().queued,0);assert.equal(scope.stats().inFlight,0);
          assert.equal(scope.stats().bytes,failed.evidence.reduce((sum,e)=>sum+e.bytes,0));
          assert.equal((await scope.call('getRecord',['0x'+'00'.repeat(32)])).status,'UNAVAILABLE');
          assert.equal((await scope.seal()).status,'UNAVAILABLE');assert.equal(attempts,atAbort);
        }
      } finally {holding=false;release.resolve();cancel.abort();if(pending)await pending;scope?.close();}
    }
  },{profile:'reads'});
});

const stringify=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v);
const sha256=value=>createHash('sha256').update(value).digest('hex');
const normalized=value=>JSON.parse(JSON.stringify(value,(key,v)=>['evidence','evidenceId'].includes(key)?undefined:typeof v==='bigint'?String(v):v));
const multiset=attempts=>attempts.map(({method,params,raw})=>JSON.stringify({method,params,raw})).sort();
const ordered=rows=>rows.map(comparable).sort((a,b)=>a.fieldRole.localeCompare(b.fieldRole));

// Break: speedup drops a request/check, changes selected rows/qualification, or exceeds the pool.
test('legacy scalar scheduling: exact eb14059 baseline and candidate preserve every live Files phase request and outcome',{timeout:300000},async t=>{
  const baselineCommit='eb14059fbd7fa105d80979a30a806b5660ddabd9';
  const sourcePath='Reviews/2026-09-09-files-reader/reader-scope.mjs';
  const baselineSource=execFileSync('git',['show',baselineCommit+':'+sourcePath],{cwd:fileURLToPath(new URL('../../../',import.meta.url)),encoding:'utf8'});
  const bundleRelative="'../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js'";
  assert.equal(baselineSource.split(bundleRelative).length,2,'only the installed browser bundle import is replaced');
  const bundleURL=new URL('../../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js',import.meta.url);
  const importedSource=baselineSource.replace(bundleRelative,JSON.stringify(bundleURL.href));
  const baseline=await import('data:text/javascript;base64,'+Buffer.from(importedSource).toString('base64'));
  await withUpgrade(async lab=>{
    const setupStarted=performance.now(),f=await mountedFixture(lab),names=['note.txt',...Array.from({length:7},(_,i)=>'n'+i+'.txt')];
    for(const [i,name] of names.entries()){
      const entry=i===0?f.entryA:await f.claim(A,name,i%2?f.fileB:f.fileA);await f.claim(B,name,f.fileA,{target:entry});
    }
    const setupMs=performance.now()-setupStarted,oracleStarted=performance.now(),truth=await oracle(lab),inventory=truth.inventory(f.mounts.aFirst),oracleMs=performance.now()-oracleStarted;
    assert.equal(inventory.roles.length,8);
    // This historical experiment isolates scope scheduling, not anchor batching.
    // Both arms consume the same explicit legacy manifest; do not mutate the lab.
    const expected=structuredClone(lab.expected);
    for(const implementation of Object.values(expected.implementations))delete implementation.readCapabilities;
    const report={kind:'MATCHED_FIXTURE_FILES_SCHEDULING_NOT_PUBLIC_C0',baselineCommit,
      sourcePins:{algorithm:'sha256',baseline:sha256(baselineSource),baselineImported:sha256(importedSource),
        ...Object.fromEntries(['reader-scope.mjs','files-reader.mjs','files-profile.mjs','test/fixture.mjs','test/oracle.mjs','test/reader-scheduling.test.mjs'].map(p=>[p,sha256(readFileSync(new URL('../'+p,import.meta.url)))])),
        ethersBundle:sha256(readFileSync(bundleURL))},source:lab.resources,expected,
      workload:{capability:'legacy scalar scheduling; checkedRecords metadata absent for both arms',names,authors:[A,B],childNodes:[f.fileA,f.fileB],charters:'two maintained File nodes shared across placements',root:f.root,mountId:f.mounts.aFirst,planId:f.plans.aFirst,pageSize:4,requestedBlock:'latest'},
      exclusions:{setup:{elapsedMs:setupMs,includes:'mounted fixture publications; managed deployment also outside all phase timers'},oracle:{elapsedMs:oracleMs,includes:'one full retained-state acquisition and verification'},ui:'not implemented or measured',bytes:'FileRevision and content retrieval excluded; JSON RPC result bytes measured, not wire framing or module download bytes'},
      oracle:{snapshot:truth.snapshot,inventory,basis:truth.basis},samples:[]};
    for(const delayMs of [0,50])for(let sample=0;sample<3;sample++) {
      const order=sample%2?['candidate','baseline']:['baseline','candidate'],arms={};
      for(const arm of order) {
        let active=0,peak=0,scope;const attempts=[],phases=[];
        const request=async(method,params,options)=>{
          assert(['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_getStorageAt','eth_call'].includes(method),'read-only surface');
          active++;peak=Math.max(peak,active);
          try {if(delayMs)await pause(delayMs);const raw=await lab.rpc(method,params,options);attempts.push({method,params,raw,bytes:Buffer.byteLength(JSON.stringify(raw))});return raw;}
          finally {active--;}
        };
        async function phase(name,action){
          const before=scope?.stats()??{requests:0,bytes:0,cacheHits:0},offset=attempts.length;peak=0;
          const started=performance.now(),result=await action(),elapsedMs=performance.now()-started,after=scope.stats(),actual=attempts.slice(offset);
          const evidence=scope.evidence().slice(before.requests);
          assert.equal(active,0,'successful phase leaves no pending transport');assert(after.maxInFlight<=4);assert(peak<=4);
          assert.equal(after.requests-before.requests,actual.length);assert.equal(after.bytes-before.bytes,actual.reduce((sum,e)=>sum+e.bytes,0));
          assert(evidence.every(e=>e.endedMs!==null&&!e.error));
          assert.deepEqual(multiset(evidence.map(e=>({...e,raw:e.result}))),multiset(actual),'evidence is actual successful transport');
          phases.push({name,elapsedMs,requests:actual.length,jsonResultBytes:after.bytes-before.bytes,cacheHits:after.cacheHits-before.cacheHits,maxInFlight:peak,
            methods:Object.fromEntries([...new Set(actual.map(e=>e.method))].map(m=>[m,actual.filter(e=>e.method===m).length])),attempts:actual,result:normalized(result)});
          return result;
        }
        try {
          await phase('cold-open',async()=>{
            const factory=arm==='baseline'?baseline.createFixtureReader:createFixtureReader;
            scope=await ready(factory({source:{identity:expected.source,epoch:1,request},context:{expected,limits:{maxInFlight:4}}}));return {status:'READY',basis:scope.basis};
          });
          assert(scope.evidence().every(e=>e.purpose==='qualification'));
          assert.deepEqual({realmRevisionId:scope.basis.executionSetId,blockNumber:scope.basis.blockNumber,admissionHigh:scope.basis.admissionHigh,basisKind:0},truth.basis);
          assert.equal(scope.basis.blockHash,truth.snapshot.basis.hash);
          const stream=openDirectory(scope,{mountId:f.mounts.aFirst,pageSize:4});
          const first=await phase('first-sealed-page',()=>stream.loadMore());assert.equal(first.rows.length,4);assert.equal(first.coverage,'PARTIAL');
          for(const row of first.rows)assert.deepEqual(comparable(row),comparable(truth.lookup(f.mounts.aFirst,row.fieldRole,row.value.name)));
          const final=await phase('continuation',()=>stream.loadMore());assert.equal(final.coverage,'COMPLETE');assert.equal(final.rows.length,8);
          assert.deepEqual(ordered([...final.rows,...final.masked,...final.absent,...final.unresolved]),ordered(inventory.results));
          assert.deepEqual(final.progress.map(p=>[p.principal,p.scanned]),inventory.sources.map(p=>[p.principal,BigInt(p.ordinals.length)]));
          const reuse=await phase('same-scope-point-reuse',()=>lookupName(scope,{mountId:f.mounts.aFirst,name:'note.txt'}));
          assert.deepEqual(comparable(reuse),comparable(truth.lookup(f.mounts.aFirst,role('note.txt'),'note.txt')));assert.equal(phases.at(-1).requests,4);
          for(const result of [first,final,reuse,...first.rows,...final.rows]){
            assert.equal(result.qualification.status,'QUALIFIED');assert.equal(result.qualification.integrity,'SOURCE_PINNED_EXACT_ABI');
            assert.equal(result.qualification.authority,'SYNTHETIC_OPERATOR_ONLY');assert.equal(result.qualification.finality,'PROVISIONAL');
          }
          for(const result of [first,final,reuse])assert.deepEqual(result.basis,scope.basis);
          for(const e of scope.evidence())if(['eth_call','eth_getCode','eth_getStorageAt'].includes(e.method))assert.deepEqual(e.params.at(-1),{blockHash:scope.basis.blockHash,requireCanonical:true});
          arms[arm]={basis:scope.basis,phases,evidence:scope.evidence(),stats:scope.stats()};
          assert(!scope.evidence().some(e=>e.method==='eth_call'&&e.params[0].data.startsWith(lab.readIface.getFunction('getRecordsChecked').selector)),'legacy scheduling makes no batch probe');
        } finally {scope?.close();}
      }
      assert.deepEqual(arms.baseline.basis,arms.candidate.basis);
      for(let i=0;i<4;i++){
        const a=arms.baseline.phases[i],b=arms.candidate.phases[i];assert.equal(a.name,b.name);
        assert.deepEqual(a.result,b.result,a.name+' qualified outcome');assert.deepEqual(multiset(a.attempts),multiset(b.attempts),a.name+' exact successful requests/results');
        assert.equal(a.requests,b.requests);assert.equal(a.jsonResultBytes,b.jsonResultBytes);assert.equal(a.cacheHits,b.cacheHits);
      }
      report.samples.push({delayMs,sample,order,arms});
    }
    t.diagnostic(stringify({sourcePins:report.sourcePins,samples:report.samples.map(({delayMs,sample,order,arms})=>({delayMs,sample,order,arms:Object.fromEntries(Object.entries(arms).map(([arm,{phases}])=>[arm,phases.map(({attempts,result,...summary})=>summary)]))}))}));
    if(process.env.EFS_FILES_SCHEDULING_EVIDENCE==='1')writeFileSync(new URL('../../../.superpowers/sdd/files-reader-plan/files-scheduling-evidence.json',import.meta.url),stringify(report)+'\n');
  },{profile:'reads'});
});
