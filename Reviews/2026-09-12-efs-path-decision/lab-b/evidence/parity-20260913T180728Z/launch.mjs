// Root-owned finite launcher; the candidate alone starts one loopback Anvil.
import assert from 'node:assert/strict';
import { spawn,execFileSync } from 'node:child_process';
import { readFileSync,writeFileSync,openSync,closeSync,statfsSync,readdirSync,statSync } from 'node:fs';
import { createHash } from 'node:crypto';
const run='/tmp/efs-b-parity-paid-20260913.KJ23qU';
const repo='/Users/james/Code/EFS/planning-warroom-b-run';
const lab=`${repo}/Reviews/2026-09-12-efs-path-decision/lab-b`;
const pins=JSON.parse(readFileSync(`${run}/pins.json`));
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
const start=Date.parse(process.env.B_LEASE_START??''),latest=Date.parse(process.env.B_LATEST_START??''),end=Date.parse(process.env.B_LEASE_END??'');
assert(Number.isFinite(start)&&Number.isFinite(latest)&&Number.isFinite(end)&&start<=Date.now()&&Date.now()<=latest&&latest<end&&end-start<=30*60_000,'explicit current finite lease required');
assert.equal(process.version,'v26.0.0');
assert.equal(git(['rev-parse','HEAD']),pins.source);assert.equal(git(['status','--porcelain','--untracked-files=no']),'');
for(const [p,h]of [[pins.armInput,pins.armSha256],[pins.controller,pins.controllerSha256],[pins.neutral,pins.neutralSha256],[pins.independentInputs,pins.independentInputSha256]])assert.equal(sha(readFileSync(p)),h);
const prepared=JSON.parse(readFileSync(pins.independentInputs));
for(const p of Object.values(prepared.artifactPins))assert.equal(sha(readFileSync(p.path)),p.sha256);
const env={...process.env,FOUNDRY_OUT:pins.artifacts,EFS_LAB_SCRATCH:run,EFS_ETHERS_PATH:'/Users/james/Code/EFS/planning-efs21/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers'};
for(const key of ['PRIVATE_KEY','PK_A','RUN_MNEMONIC'])delete env[key];
const args=[`${lab}/script/measure.mjs`,'--anvil','--cells','joined/paid-slice','--out',`${run}/measure.json`,'--controller',`${pins.controller}:${pins.controllerSha256}`,'--expectations',`${pins.neutral}:${pins.neutralSha256}`,'--arm-input',`${pins.armInput}:${pins.armSha256}`,'--run-id',pins.runId];
const bytes=dir=>readdirSync(dir,{withFileTypes:true}).reduce((n,e)=>n+(e.isDirectory()?bytes(`${dir}/${e.name}`):e.isFile()?statSync(`${dir}/${e.name}`).size:0),0);
const checkDisk=()=>{const d=statfsSync(run);assert(d.bavail*d.bsize>=50*1024**3,'free disk reserve');assert(bytes(run)<14*1024**3,'run budget');};
checkDisk();
const record={startedAt:new Date().toISOString(),runId:pins.runId,source:pins.source,node:process.version,anvilVersion:execFileSync('anvil',['--version'],{encoding:'utf8'}).trim(),lease:{start,latest,end},pins,args};
const save=()=>writeFileSync(`${run}/launch-record.json`,`${JSON.stringify(record,null,2)}\n`);
const fd=openSync(`${run}/launch.log`,'wx');
const child=spawn(process.execPath,args,{cwd:lab,env,detached:true,stdio:['ignore',fd,fd]});closeSync(fd);record.pid=child.pid;save();
let stopped=false;
const stop=reason=>{if(stopped)return;stopped=true;record.stopReason=reason;save();try{process.kill(-child.pid,'SIGTERM');}catch{}setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL');}catch{}},3000).unref();};
const timer=setTimeout(()=>stop('lease/watchdog'),Math.max(0,Math.min(20*60_000,end-Date.now()-4000)));
const budget=setInterval(()=>{try{checkDisk();}catch(e){stop(e.message);}},5000);
process.once('SIGTERM',()=>stop('SIGTERM'));process.once('SIGINT',()=>stop('SIGINT'));
try{await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>{record.exitCode=code;record.signal=signal;resolve();});});}
finally{clearTimeout(timer);clearInterval(budget);record.finishedAt=new Date().toISOString();save();}
assert.equal(record.exitCode,0,'runner failed');assert(!stopped,'run stopped');
const packet=JSON.parse(readFileSync(`${run}/measure.json`));
assert.equal(packet.failure,null);assert(packet.anvil.stoppedAt,'owned Anvil stop not recorded');
try{process.kill(packet.anvil.pid,0);throw new Error('owned Anvil still alive');}catch(e){if(e.code!=='ESRCH')throw e;}
record.success=true;record.anvil=packet.anvil;save();console.log(JSON.stringify({success:true,runId:pins.runId,scratch:run,anvil:packet.anvil.pid,startedAt:record.startedAt,finishedAt:record.finishedAt}));
