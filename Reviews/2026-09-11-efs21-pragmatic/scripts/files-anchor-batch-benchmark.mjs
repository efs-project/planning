// Exclusive finite-world read acquisition measurement; no paid-gas claims.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,existsSync,statfsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
const ROOT=fileURLToPath(new URL('..',import.meta.url)),VAULT=resolve(ROOT,'../..');
const output=join(ROOT,'evidence/files-anchor-batch.json');
assert(!existsSync(output),'exclusive retained evidence');
assert(!process.env.EFS_TEST_BUILD_ROOT,'runner owns its build');
assert.notEqual(process.env.EFS_LAB_ANVIL_STEPS,'1','no traces');
const free=()=>{const s=statfsSync(VAULT);assert(s.bavail*s.bsize>20*1024**3,'stop below20GiB');};free();
const git=args=>execFileSync('git',args,{cwd:VAULT,encoding:'utf8'}).trim();
assert.equal(git(['status','--porcelain']),'','freeze source before final acquisition evidence');
const sourceCommit=git(['rev-parse','HEAD']);
const build=mkdtempSync(join(tmpdir(),'efs21-files-anchor-build-'));process.env.EFS_TEST_BUILD_ROOT=build;
const {compileUpgrade,withUpgrade,mountedFixture,A,B}=await import('../../2026-09-09-files-reader/test/fixture.mjs');
const {scalar,scalarRevision,scalarSha256,ready,project,selectors}=await import('../../2026-09-09-files-reader/test/anchor-batch-fixture.mjs');
const {openDirectory}=await import('../../2026-09-09-files-reader/files-reader.mjs');
const {DEFAULT_LIMITS}=await import('../../2026-09-09-files-reader/reader-scope.mjs');
const {oracle,comparable}=await import('../../2026-09-09-files-reader/test/oracle.mjs');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const stringify=v=>JSON.stringify(v,(_,x)=>typeof x==='bigint'?String(x):x);
const sha=v=>createHash('sha256').update(v).digest('hex');
const sourcePaths=['Reviews/2026-09-09-files-reader/files-reader.mjs','Reviews/2026-09-09-files-reader/reader-scope.mjs','Reviews/2026-09-09-files-reader/files-profile.mjs','Reviews/2026-09-09-files-reader/index.d.mts','Reviews/2026-09-09-files-reader/test/anchor-batch-fixture.mjs','Reviews/2026-09-09-files-reader/test/fixture.mjs','Reviews/2026-09-09-files-reader/test/oracle.mjs','Reviews/2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs','Reviews/2026-09-09-files-browser-mvp/test/authority-fixture.mjs','Reviews/2026-09-11-efs21-pragmatic/scripts/files-anchor-batch-benchmark.mjs'];
const ordered=rows=>rows.map(comparable).sort((a,b)=>a.fieldRole.localeCompare(b.fieldRole));
const comparisonLimits=DEFAULT_LIMITS;
let cleanup,report;
try{
  compileUpgrade({fullBuild:true});free();
  report=await withUpgrade(async lab=>{
    cleanup=lab.cleanup;
    const report={kind:'DISPOSABLE_FULLC0_FILES_ANCHOR_BATCH_ACQUISITION',createdAt:new Date().toISOString(),sourceCommit,scalarRevision,scalarSha256,
      sourcePins:Object.fromEntries(sourcePaths.map(p=>[p,sha(readFileSync(join(VAULT,p)))])),runtime:{node:process.version,platform:process.platform,arch:process.arch},
      resources:lab.resources,expected:lab.expected,workloads:[],samples:[],
      methodology:'Frozen scalar and candidate Files modules import the same reviewed reader-scope singleton. Fresh scopes, identical manifest and exact block; three alternating paired samples at0/50ms, pages4/8, eight/17 names. Qualification and all real sealed continuation pages retained separately. Same-scope full rebrowse is reuse, never called a continuation. Publication and independent oracle are excluded from read timers. Actual transport/evidence count, bytes and digest equality is asserted.',
      comparisonLimits,limits:'Primary comparison: both arms use actual current DEFAULT_LIMITS (4096 requests,16 concurrent). Frozen Files imports the same current scope; no historical scope compatibility limit is needed. Qualification36 requests and every seal4. Eight-ID acquisition only; occurrence, historical Binding, selected entry, real Lens/charter and final seal still required. No paid gas, onchain listing, public C0, browserUI, protocol promotion or one-call-directory claim.'};
    const setupStarted=performance.now(),f=await mountedFixture(lab),names=['note.txt'];
    await f.claim(B,'note.txt',f.fileA,{target:f.entryA});
    let setupMs=performance.now()-setupStarted;
    for(const count of [8,17]){
      const adding=performance.now();
      while(names.length<count){const i=names.length,name=`n${String(i).padStart(2,'0')}.txt`;const entry=await f.claim(A,name,i%2?f.fileB:f.fileA);await f.claim(B,name,f.fileA,{target:entry});names.push(name);}
      setupMs+=performance.now()-adding;free();
      const oracleStart=performance.now(),truth=await oracle(lab),inventory=truth.inventory(f.mounts.aFirst),oracleMs=performance.now()-oracleStart;
      assert.equal(inventory.roles.length,count);
      const header=await lab.rpc('eth_getBlockByNumber',['latest',false]);
      report.workloads.push({count,names:[...names],authors:[A,B],children:[f.fileA,f.fileB],root:f.root,mountId:f.mounts.aFirst,header,setupMs,oracleMs,oracle:{basis:truth.basis,inventory,snapshot:truth.snapshot},fixtureTransactionHashes:lab.transactions.map(t=>t.hash)});
      for(const pageSize of [4,8])for(const delayMs of [0,50])for(let sample=0;sample<3;sample++){
        const order=sample%2?['candidate','scalar']:['scalar','candidate'],arms={};
        for(const arm of order){
          let scope,active=0,peak=0;const actual=[],phases=[],snapshots=[];
          const request=async(method,params,options)=>{active++;peak=Math.max(peak,active);try{if(delayMs)await pause(delayMs);const raw=await lab.rpc(method,params,options);actual.push({method,params,result:raw,bytes:Buffer.byteLength(JSON.stringify(raw))});return raw;}finally{active--;}};
          async function phase(name,action){
            const before=scope?.stats()??{requests:0,bytes:0,cacheHits:0},offset=actual.length;peak=0;
            const start=performance.now(),result=await action(),elapsedMs=performance.now()-start,after=scope.stats(),attempts=actual.slice(offset),evidence=scope.evidence().slice(before.requests);
            assert.equal(active,0);assert(peak<=comparisonLimits.maxInFlight);assert.equal(after.requests-before.requests,attempts.length);
            assert.equal(after.bytes-before.bytes,attempts.reduce((n,e)=>n+e.bytes,0));assert(evidence.every(e=>e.endedMs!==null&&!e.error));
            const digests=xs=>xs.map(e=>sha(stringify({method:e.method,params:e.params,result:e.result}))).sort();
            assert.deepEqual(digests(evidence),digests(attempts));
            phases.push({name,elapsedMs,requests:attempts.length,jsonResultBytes:after.bytes-before.bytes,
              serializedRequestBytes:attempts.reduce((n,e)=>n+Buffer.byteLength(JSON.stringify({jsonrpc:'2.0',id:1,method:e.method,params:e.params})),0),
              serializedResponseBytes:attempts.reduce((n,e)=>n+Buffer.byteLength(JSON.stringify({jsonrpc:'2.0',id:1,result:e.result})),0),
              cacheHits:after.cacheHits-before.cacheHits,peakConcurrency:peak,
              purposeCounts:Object.fromEntries(['qualification','data','seal'].map(p=>[p,evidence.filter(e=>e.purpose===p).length])),selectors:selectors(lab,evidence),
              evidence:evidence.map(e=>({id:e.id,sequence:e.sequence,method:e.method,purpose:e.purpose,bytes:e.bytes,startedMs:e.startedMs,endedMs:e.endedMs,paramsSha256:sha(stringify(e.params)),resultSha256:sha(stringify(e.result)),...(e.method==='eth_call'?{to:e.params[0].to,selector:e.params[0].data.slice(0,10),blockPin:e.params[1]}:{})})),
              checkedAcquisitions:evidence.filter(e=>e.method==='eth_call'&&e.params[0].data.startsWith(lab.readIface.getFunction('getRecordsChecked').selector)).map(e=>({evidenceId:e.id,params:e.params,result:lab.readIface.decodeFunctionResult('getRecordsChecked',e.result).toArray(true)}))});
            return result;
          }
          try{
            await phase('qualification',async()=>{scope=await ready(lab,{request,blockTag:header.number,limits:comparisonLimits});});
            assert.equal(phases[0].requests,36);
            const open=arm==='scalar'?scalar.openDirectory:openDirectory,stream=open(scope,{mountId:f.mounts.aFirst,pageSize});
            for(let page=0;page<10;page++){
              const result=await phase(page?'continuation-'+page:'first-sealed-page',()=>stream.loadMore());snapshots.push(project(result));
              assert.equal(result.qualification.status,'QUALIFIED',result.detail);
              assert.equal(phases.at(-1).purposeCounts.seal,4);assert.equal(result.basis.blockHash,header.hash);
              for(const row of result.rows)assert.deepEqual(comparable(row),inventory.results.map(comparable).find(r=>r.fieldRole===row.fieldRole));
              if(result.coverage==='COMPLETE')break;
            }
            const last=snapshots.at(-1);assert.equal(last.coverage,'COMPLETE');assert.deepEqual(ordered(last.rows),ordered(inventory.results));
            assert.equal(last.progress.reduce((n,s)=>n+s.scanned,0n),BigInt(count*2));
            if(count===17)assert(snapshots.length>=3,'real continuation pages');
            const reuse=open(scope,{mountId:f.mounts.aFirst,pageSize});
            for(let page=0;page<snapshots.length;page++){
              const result=await phase('same-scope-rebrowse-'+page,()=>reuse.loadMore());assert.deepEqual(project(result),snapshots[page]);
              assert.equal(phases.at(-1).requests,4,'only fresh seal controls on assessed cache reuse');
            }
            arms[arm]={basis:scope.basis,phases,snapshots,stats:scope.stats()};
          }finally{scope?.close();}
        }
        assert.deepEqual(arms.candidate.snapshots,arms.scalar.snapshots);
        const calls=arm=>arm.phases.filter(p=>p.name!=='qualification'&&!p.name.startsWith('same-scope')).reduce((n,p)=>n+p.requests,0);
        const scalarCalls=calls(arms.scalar),candidateCalls=calls(arms.candidate);
        assert(candidateCalls<scalarCalls);
        report.samples.push({count,pageSize,delayMs,sample,order,scalarCalls,candidateCalls,arms});
        console.log('Files',count,'page',pageSize,'delay',delayMs,'sample',sample,'acquisition+seal',scalarCalls,candidateCalls);
      }
      assert.equal((await lab.rpc('eth_getBlockByNumber',[header.number,false])).hash,header.hash);
    }
    return report;
  },{profile:'reads',watchdogMs:300000});
  assert(cleanup.stopped&&cleanup.cacheRemoved);
}finally{if(!cleanup||cleanup.stopped)rmSync(build,{recursive:true,force:true});}
report.cleanup={...cleanup,buildRemoved:!existsSync(build)};assert(report.cleanup.buildRemoved);
writeFileSync(output,stringify(report)+'\n',{flag:'wx'});
console.log('Retained',output,'paired samples',report.samples.length);
