import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixtureReader,openDirectory,lookupName } from '../2026-09-09-files-reader/index.mjs';
import { withUpgrade,mountedFixture,A,B,role } from '../2026-09-09-files-reader/test/fixture.mjs';
import { fromSnapshot,comparable } from '../2026-09-09-files-reader/test/oracle.mjs';
import { readUpgradeState } from '../2026-09-08-upgradeable-foundation/reference/upgrade-reader.mjs';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v);
const all=s=>[...s.rows,...s.unresolved,...s.masked,...s.absent];
const ordered=rs=>rs.map(comparable).sort((a,b)=>a.fieldRole.localeCompare(b.fieldRole));
const report={kind:'HISTORICAL_NAME_CHURN_NOT_VISIBLE_FOLDER_PARITY',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),arms:[]};
for(const namesCount of [64,96,128])test(`${namesCount} lifetime names, only last four still asserted: page-size control`,{timeout:300000},async()=>{
  await withUpgrade(async lab=>{
    const f=await mountedFixture(lab),names=['note.txt',...Array.from({length:namesCount-1},(_,i)=>'n'+i+'.txt')];
    for(const [i,name] of names.entries()){
      const entry=i===0?f.entryA:await f.claim(A,name,i%2?f.fileB:f.fileA);await f.claim(B,name,f.fileA,{target:entry});
    }
    for(const name of names.slice(0,-4)){await f.claim(A,name,f.fileA,{tombstone:true});await f.claim(B,name,f.fileA,{tombstone:true});}
    const reconstructed=await readUpgradeState(lab);
    if(reconstructed.outcome!=='VERIFIED'){
      assert([96,128].includes(namesCount),'the 64-name measured control requires a verified comparator');
      assert.equal(reconstructed.outcome,'UNKNOWN');assert.match(reconstructed.reason,/budget/);
      const arm={namesCount,retiredByBoth:namesCount-4,status:'ORACLE_LIMIT_NOT_A_READER_MEASUREMENT',resources:lab.resources,
        oracleFailure:{outcome:reconstructed.outcome,reason:reconstructed.reason,attemptedBasis:reconstructed.attemptedBasis},samples:[]};
      report.arms.push(arm);console.log(json({namesCount,status:arm.status,oracleFailure:arm.oracleFailure}));return;
    }
    const truth=fromSnapshot(reconstructed.snapshot,lab.expected),expected=truth.inventory(f.mounts.aFirst);assert.equal(expected.roles.length,namesCount);assert.equal(expected.results.filter(r=>r.outcome==='FOUND').length,4);
    const arm={namesCount,retiredByBoth:namesCount-4,visiblePlacements:4,distinctVisibleFiles:2,basis:truth.basis,blockHash:truth.snapshot.basis.hash,resources:lab.resources,oracle:expected.results,samples:[]};
    for(const pageSize of [4,8])for(const delayMs of [0,50]){
      let active=0,peak=0;
      const source={identity:lab.expected.source,epoch:1,async request(method,params,options){active++;peak=Math.max(peak,active);try{if(delayMs)await new Promise(r=>setTimeout(r,delayMs));return await lab.rpc(method,params,options);}finally{active--;}}};
      const reader=createFixtureReader({source,context:{expected:lab.expected}}),start=performance.now();
      const opened=await reader.open({blockTag:'0x'+truth.basis.blockNumber.toString(16)});assert.equal(opened.status,'READY',opened.reason);
      const scope=opened.scope,coldMs=performance.now()-start,stream=openDirectory(scope,{mountId:f.mounts.aFirst,pageSize}),pages=[];
      let result,terminal,previous=[],firstVisibleMs=null,measuredMs=coldMs;
      try{
        for(let i=0;i<64;i++){
          const before=scope.stats(),t=performance.now();result=await stream.loadMore();const elapsedMs=performance.now()-t,stats=scope.stats();measuredMs+=elapsedMs;
          const returned=all(result);for(const row of returned)assert.deepEqual(comparable(row),comparable(truth.lookup(f.mounts.aFirst,row.fieldRole,row.value?.name)));
          if(result.rows.length&&firstVisibleMs===null)firstVisibleMs=measuredMs;
          pages.push({index:i,elapsedMs,requests:stats.requests-before.requests,acceptedJSONResultBytes:stats.bytes-before.bytes,positions:returned.length,visible:result.rows.length,coverage:result.coverage,status:result.qualification.status,reason:result.reason??null,detail:result.detail??null,rowsEvidence:result.rowsEvidence});
          assert(stats.requests<=512);assert(stats.bytes<=4194304);assert(stats.maxInFlight<=4);
          if(result.qualification.status!=='QUALIFIED'){
            assert.equal(result.rowsEvidence,'PRIOR_SEALED');assert.notEqual(result.coverage,'COMPLETE');assert.deepEqual(ordered(returned),previous);assert.match(result.detail??'',/request budget exceeded/);terminal='SCOPE_REQUEST_LIMIT';break;
          }
          previous=ordered(returned);if(result.coverage==='COMPLETE'){assert.deepEqual(previous,ordered(expected.results));terminal='COMPLETE';break;}
        }
        assert(terminal);const final=JSON.stringify(scope.evidence()),stats=scope.stats();stream.close();scope.close();
        const drainEnd=performance.now()+10000;while(active&&performance.now()<drainEnd)await new Promise(r=>setTimeout(r,5));assert.equal(active,0);assert.equal(JSON.stringify(scope.evidence()),final,'late ignored results do not improve stopped scope');
        // Known exact name can still resolve at the SAME block through a fresh
        // scope; failure to discover it is not evidence that its data vanished.
        const p0=performance.now(),pointOpen=await reader.open({blockTag:'0x'+truth.basis.blockNumber.toString(16)});assert.equal(pointOpen.status,'READY',pointOpen.reason);
        let point;
        try{const value=await lookupName(pointOpen.scope,{mountId:f.mounts.aFirst,name:names.at(-1)});const elapsedMs=performance.now()-p0;assert.equal(value.outcome,'FOUND');assert.deepEqual(comparable(value),comparable(truth.lookup(f.mounts.aFirst,role(names.at(-1)),names.at(-1))));point={outcome:value.outcome,elapsedMs,stats:pointOpen.scope.stats(),name:names.at(-1)};}finally{pointOpen.scope.close();}
        arm.samples.push({pageSize,delayMs,coldMs,pages,terminal,measuredMs,firstVisibleMs,positions:all(result).length,visible:result.rows.length,stats,maxTransportInFlight:peak,point});
      }finally{stream.close();scope.close();}
    }
    report.arms.push(arm);console.log(json({namesCount,samples:arm.samples.map(({pages,...s})=>s)}));
  },{profile:'reads'});
});
test('retain churn evidence separately from the initial scale report',async()=>{
  assert.equal(report.arms.length,3);report.sourcePins={};
  for(const p of ['churn.test.mjs','../2026-09-09-files-reader/reader-scope.mjs','../2026-09-09-files-reader/files-reader.mjs','../2026-09-09-files-reader/files-profile.mjs','../2026-09-09-files-reader/test/fixture.mjs','../2026-09-09-files-reader/test/oracle.mjs'])report.sourcePins[p]=createHash('sha256').update(await readFile(new URL(p,import.meta.url))).digest('hex');
  if(process.env.EFS_FILES_CHURN_EVIDENCE==='1')await writeFile(new URL('churn-evidence.json',import.meta.url),json(report)+'\n',{flag:'wx'});
});
