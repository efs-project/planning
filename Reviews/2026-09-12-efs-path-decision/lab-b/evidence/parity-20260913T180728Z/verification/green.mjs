import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { openSync, closeSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const run = '/tmp/efs-b-parity-build-20260913.lcAzU1';
const repo = '/Users/james/Code/EFS/planning-warroom-b-run';
const lab = `${repo}/Reviews/2026-09-12-efs-path-decision/lab-b`;
const solc = '/Users/james/Library/Application Support/svm/0.8.30/solc-0.8.30';
const git = args => execFileSync('git', args, {cwd:repo,encoding:'utf8'});
const sha = value => createHash('sha256').update(value).digest('hex');
const base = 'ac37e91f880e9905713863a568b922a3b73130af';
assert.equal(git(['rev-parse','HEAD']).trim(),base);
assert(Date.now() >= Date.parse('2026-09-13T17:53:00Z') && Date.now() <= Date.parse('2026-09-13T17:59:00Z'),'outside lease start window');
const sourceHashes = () => Object.fromEntries(['src','test','script'].flatMap(d=>readdirSync(`${lab}/${d}`).filter(n=>/\.(sol|mjs)$/.test(n)).map(n=>[`${d}/${n}`,sha(readFileSync(`${lab}/${d}/${n}`))])).concat([['foundry.toml',sha(readFileSync(`${lab}/foundry.toml`))]]));
const result = {phase:'GREEN',baseCommit:base,startedAt:new Date().toISOString(),compilerSha256:sha(readFileSync(solc)),dirtyDiffSha256:sha(git(['diff','HEAD','--binary'])),sourceHashes:sourceHashes(),stages:[],artifactHashes:{}};
assert.equal(result.compilerSha256,'738dcdc6afddeb505ee4e4ef24f1c1fdba2b8c924e614cbbf5801a5b062dd683');
writeFileSync(`${run}/green.diff`,git(['diff','HEAD','--binary']),{flag:'wx'});
const save=()=>writeFileSync(`${run}/green.json`,`${JSON.stringify(result,null,2)}\n`);
const common=['--root',lab,'--offline','--use',solc,'--threads','2','--ast','--out',`${run}/green-out`,'--cache-path',`${run}/green-cache`];
const match=JSON.parse(readFileSync(`${run}/red.json`)).args;
const matchTest=match[match.indexOf('--match-test')+1];
let child;
const timer=setTimeout(()=>{result.timeout=true;save();try{if(child?.pid)process.kill(-child.pid,'SIGKILL');}catch{}},Math.min(15*60*1000,Date.parse('2026-09-13T18:14:00Z')-Date.now()));
async function invoke(name,exe,args){
  const fd=openSync(`${run}/${name}.log`,'wx');
  const stage={name,exe,args,startedAt:new Date().toISOString()};result.stages.push(stage);
  child=spawn(exe,args,{cwd:lab,env:{...process.env,FOUNDRY_OUT:`${run}/green-out`},detached:true,stdio:['ignore',fd,fd]});stage.pid=child.pid;save();
  await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>{stage.exitCode=code;stage.signal=signal;stage.finishedAt=new Date().toISOString();closeSync(fd);save();code===0?resolve():reject(new Error(`${name} exited ${code}/${signal}`));});});
}
try{
  await invoke('green-focused','forge',['test',...common,'--match-contract','JoinedConsumerTest','--match-test',matchTest,'-vvv']);
  await invoke('green-full','forge',['test',...common]);
  await invoke('green-sizes','forge',['build',...common,'--sizes']);
  await invoke('green-node',process.execPath,['--test',...readdirSync(`${lab}/script`).filter(n=>n.endsWith('.test.mjs')).sort().map(n=>`script/${n}`)]);
  function walk(dir,prefix=''){for(const e of readdirSync(dir,{withFileTypes:true})){const p=`${dir}/${e.name}`,rel=prefix+e.name;if(e.isDirectory())walk(p,`${rel}/`);else if(e.name.endsWith('.json'))result.artifactHashes[rel]=sha(readFileSync(p));}}
  walk(`${run}/green-out`);
  result.sourceUnchangedDuringRun=JSON.stringify(sourceHashes())===JSON.stringify(result.sourceHashes);
  result.diffUnchangedDuringRun=sha(git(['diff','HEAD','--binary']))===result.dirtyDiffSha256;
  assert(result.sourceUnchangedDuringRun && result.diffUnchangedDuringRun,'source changed during build/test');
  result.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({finishedAt:result.finishedAt,stages:result.stages,artifactCount:Object.keys(result.artifactHashes).length,sourceUnchangedDuringRun:true}));
}catch(e){result.failure=e.message;save();console.error(e);process.exitCode=1;}finally{clearTimeout(timer);}
