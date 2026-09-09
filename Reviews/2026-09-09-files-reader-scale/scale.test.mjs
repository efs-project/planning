import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureReader,openDirectory } from '../2026-09-09-files-reader/index.mjs';
import { withUpgrade,mountedFixture,A,B } from '../2026-09-09-files-reader/test/fixture.mjs';
import { oracle,comparable } from '../2026-09-09-files-reader/test/oracle.mjs';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const stringify=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v);
const rows=s=>[...s.rows,...s.unresolved,...s.masked,...s.absent];
const ordered=rs=>rs.map(comparable).sort((a,b)=>a.fieldRole.localeCompare(b.fieldRole));
const shapes=[{names:8,unique:false},{names:8,unique:true},{names:32,unique:false},{names:32,unique:true},{names:33,unique:true},{names:64,unique:false}];
const report={kind:'FIXTURE_FOLDER_SIZE_PRESSURE_NOT_PARITY',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),arms:[]};
for(const shape of shapes)test(`${shape.names} names / ${shape.unique?'unique Files':'two shared Files'}: bounded pages never invent completion`,{timeout:300000},async()=>{
  await withUpgrade(async lab=>{
    const f=await mountedFixture(lab),names=['note.txt',...Array.from({length:shape.names-1},(_,i)=>'n'+i+'.txt')];
    for(const [i,name] of names.entries()){
      const child=i===0?f.fileA:shape.unique?await f.object('scale-'+i):i%2?f.fileB:f.fileA;
      const entry=i===0?f.entryA:await f.claim(A,name,child);await f.claim(B,name,f.fileA,{target:entry});
    }
    const truth=await oracle(lab),inventory=truth.inventory(f.mounts.aFirst);assert.equal(inventory.roles.length,shape.names);
    const arm={shape,resources:lab.resources,basis:truth.basis,blockHash:truth.snapshot.basis.hash,oracle:inventory.results,samples:[]};
    for(const delayMs of [0,50]){
      let active=0,peak=0;const attempts=[];
      const request=async(method,params,options)=>{
        const r={method,params,startedMs:performance.now(),endedMs:null,bytes:0};attempts.push(r);active++;peak=Math.max(peak,active);
        try{if(delayMs)await new Promise(resolve=>setTimeout(resolve,delayMs));const result=await lab.rpc(method,params,options);r.bytes=Buffer.byteLength(stringify(result));return result;}
        catch(e){r.error=e.message;throw e;}finally{active--;r.endedMs=performance.now();}
      };
      const started=performance.now(),reader=createFixtureReader({source:{identity:lab.expected.source,epoch:1,request},context:{expected:lab.expected}});
      const opened=await reader.open({blockTag:'0x'+truth.basis.blockNumber.toString(16)});assert.equal(opened.status,'READY',opened.reason);
      const scope=opened.scope,pages=[],cold={elapsedMs:performance.now()-started,...scope.stats()},stream=openDirectory(scope,{mountId:f.mounts.aFirst,pageSize:4});
      let terminal,previous=[],result;
      try{
        for(let i=0;i<32;i++){
          const before=scope.stats(),t=performance.now();result=await stream.loadMore();const elapsedMs=performance.now()-t,stats=scope.stats();
          for(const row of rows(result))assert.deepEqual(comparable(row),comparable(truth.lookup(f.mounts.aFirst,row.fieldRole,row.value?.name)));
          assert(stats.requests<=512);assert(stats.bytes<=4194304);assert(stats.maxInFlight<=4);
          const page={index:i,elapsedMs,requests:stats.requests-before.requests,jsonResultBytes:stats.bytes-before.bytes,cumulativeRequests:stats.requests,
            returnedRows:rows(result).length,coverage:result.coverage,status:result.qualification.status,reason:result.reason??null,detail:result.detail??null,rowsEvidence:result.rowsEvidence,progress:result.progress};pages.push(page);
          if(result.qualification.status!=='QUALIFIED'){
            assert.equal(result.rowsEvidence,'PRIOR_SEALED');assert.notEqual(result.coverage,'COMPLETE');assert.deepEqual(ordered(rows(result)),previous);
            assert.match(result.detail??'',/request budget exceeded/);terminal='SCOPE_REQUEST_LIMIT';break;
          }
          previous=ordered(rows(result));
          if(result.coverage==='COMPLETE'){assert.deepEqual(previous,ordered(inventory.results));terminal='COMPLETE';break;}
        }
        assert(terminal,'bounded fixture must terminate');if(shape.names===8)assert.equal(terminal,'COMPLETE');
        const stats=scope.stats(),wallMsIncludingComparisons=performance.now()-started,elapsedMs=cold.elapsedMs+pages.reduce((s,p)=>s+p.elapsedMs,0);
        const evidence=scope.evidence();assert.equal(evidence.length,stats.requests);assert.equal(attempts.length,stats.requests);
        assert(evidence.every(e=>e.endedMs!==null));
        arm.samples.push({delayMs,cold,pages,terminal,elapsedMs,wallMsIncludingComparisons,stats,returnedRows:rows(result).length,finalRows:ordered(rows(result)),maxTransportInFlight:peak,
          evidenceSummary:{count:evidence.length,completed:evidence.filter(e=>!e.error&&Object.hasOwn(e,'result')).length,errors:evidence.filter(e=>e.error).map(e=>({id:e.id,error:e.error})),jsonResultBytes:evidence.reduce((s,e)=>s+e.bytes,0)}});
        assert.equal(stats.bytes,evidence.reduce((s,e)=>s+e.bytes,0));
      }finally{
        stream.close();scope.close();
        // Local transport ignores AbortSignal; wait only for this fixture's bounded
        // in-flight reads before tearing down its chain. These cannot alter scope.
        const limit=performance.now()+10000;while(active&&performance.now()<limit)await new Promise(resolve=>setTimeout(resolve,5));assert.equal(active,0);
      }
    }
    assert.deepEqual(arm.samples[0].finalRows,arm.samples[1].finalRows);assert.equal(arm.samples[0].terminal,arm.samples[1].terminal);
    report.arms.push(arm);console.log(stringify({shape,samples:arm.samples.map(({pages,finalRows,evidenceSummary,...s})=>({...s,pages:pages.map(({progress,...p})=>p)}))}));
  },{profile:'reads'});
});
test('retain complete scale measurement with exact source pins',async()=>{
  assert.equal(report.arms.length,shapes.length);report.sourcePins={};
  for(const p of ['scale.test.mjs','../2026-09-09-files-reader/reader-scope.mjs','../2026-09-09-files-reader/files-reader.mjs','../2026-09-09-files-reader/files-profile.mjs','../2026-09-09-files-reader/test/fixture.mjs','../2026-09-09-files-reader/test/oracle.mjs'])report.sourcePins[p]=createHash('sha256').update(await readFile(new URL(p,import.meta.url))).digest('hex');
  if(process.env.EFS_FILES_SCALE_EVIDENCE==='1')await writeFile(new URL('scale-evidence.json',import.meta.url),stringify(report)+'\n');
});
