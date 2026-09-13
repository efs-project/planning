import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { openSync, closeSync, writeFileSync, readFileSync, readdirSync, statfsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const run = '/tmp/efs-b-rollback-build-20260913.Ps480X';
const repo = '/Users/james/Code/EFS/planning-warroom-b-run';
const prefix = 'Reviews/2026-09-12-efs-path-decision/lab-b';
const lab = `${repo}/${prefix}`;
const solc = '/Users/james/Library/Application Support/svm/0.8.30/solc-0.8.30';
const base = 'cbadc00e3a96cdcd76a988fbd07f94cce4ad8f85';
const phase = process.argv[2];
assert(['red', 'green'].includes(phase));
const deadline = Date.parse('2026-09-13T20:25:00Z');
assert(Date.now() >= Date.parse('2026-09-13T20:05:00Z') && Date.now() <= Date.parse('2026-09-13T20:12:00Z'), 'outside latest-start window');
const git = args => execFileSync('git', args, { cwd: repo, encoding: 'utf8' });
const sha = x => createHash('sha256').update(x).digest('hex');
assert.equal(git(['rev-parse', 'HEAD']).trim(), base);
assert.deepEqual(git(['diff', 'HEAD', '--name-only']).trim().split('\n'), [`${prefix}/src/IndexModule.sol`]);
assert.equal(sha(readFileSync(solc)), '738dcdc6afddeb505ee4e4ef24f1c1fdba2b8c924e614cbbf5801a5b062dd683');
const processRows = execFileSync('ps', ['-axo', 'pid,comm'], { encoding: 'utf8' });
assert(!/(?:^|\/)(?:anvil|forge|solc)(?:$|[- ])/.test(processRows.split('\n').filter(l => /(?:anvil|forge|solc)/.test(l)).join('\n')), 'competing heavy process');
const owned = [run, '/tmp/efs-b-parity-build-20260913.lcAzU1', '/tmp/efs-b-parity-paid-20260913.KJ23qU', '/tmp/efs-c-readiness-build-20260913.NoPDle', '/tmp/efs-paid-c-run-20260913.YxKavf', '/tmp/efs-b-parity-inputs-20260913.AHqH23'];
const guard = () => {
  const s = statfsSync(run);
  assert(s.bavail * s.bsize >= 50 * 1024 ** 3, 'free disk reserve');
  const usage = execFileSync('du', ['-sk', ...owned], { encoding: 'utf8' }).trim().split('\n').reduce((n,l) => n + Number(l.split(/\s+/)[0]) * 1024, 0);
  assert(usage < 15 * 1024 ** 3, 'total owned scratch budget');
  assert(Date.now() < deadline, 'absolute deadline');
  return { freeBytes: s.bavail * s.bsize, scratchBytes: usage };
};
function sourceHashes() {
  const out = {};
  for (const d of ['src','test','script']) for (const n of readdirSync(`${lab}/${d}`).sort()) {
    if (/\.(sol|mjs)$/.test(n)) out[`${d}/${n}`] = sha(readFileSync(`${lab}/${d}/${n}`));
  }
  out['foundry.toml'] = sha(readFileSync(`${lab}/foundry.toml`));
  return out;
}
const result = { phase, base, startedAt: new Date().toISOString(), compilerSha256: sha(readFileSync(solc)), resources: guard(), sourceHashes: sourceHashes(), stages: [] };
writeFileSync(`${run}/${phase}-tracked.diff`, git(['diff','HEAD','--binary']), {flag:'wx'});
writeFileSync(`${run}/${phase}-MatchedRollback.t.sol`, readFileSync(`${lab}/test/MatchedRollback.t.sol`), {flag:'wx'});
writeFileSync(`${run}/${phase}-IndexModule.sol`, readFileSync(`${lab}/src/IndexModule.sol`), {flag:'wx'});
const save = () => writeFileSync(`${run}/${phase}.json`, JSON.stringify(result,null,2)+'\n');
const outDir = `${run}/${phase}-out`;
const common = ['--root',lab,'--offline','--use',solc,'--threads','2','--ast','--out',outDir,'--cache-path',`${run}/${phase}-cache`];
let child;
function kill(reason) { result.failure = reason; save(); if (child?.pid) { try { process.kill(-child.pid,'SIGKILL'); } catch {} } }
const timer = setTimeout(()=>kill('watchdog deadline'), Math.min(15*60*1000,deadline-Date.now()));
const diskTimer = setInterval(()=>{try { guard(); } catch(e) { kill(e.message); }},15000);
async function invoke(name, exe, args, allowFailure = false) {
  guard();
  const fd = openSync(`${run}/${phase}-${name}.log`,'wx');
  const stage = {name,exe,args,startedAt:new Date().toISOString()}; result.stages.push(stage);
  child = spawn(exe,args,{cwd:lab,env:{...process.env,FOUNDRY_OUT:outDir},detached:true,stdio:['ignore',fd,fd]}); stage.pid=child.pid; save();
  try { await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>{stage.exitCode=code;stage.signal=signal;stage.finishedAt=new Date().toISOString();save();resolve();});}); }
  finally { closeSync(fd); child=undefined; }
  assert(!result.failure, result.failure);
  if (!allowFailure) assert.equal(stage.exitCode,0,`${name} failed`);
}
try {
  await invoke('focused','forge',['test',...common,'--match-path','test/MatchedRollback.t.sol','-vvv'],phase==='red');
  if (phase==='green') {
    await invoke('full','forge',['test',...common]);
    await invoke('sizes','forge',['build',...common,'--sizes']);
    await invoke('node',process.execPath,['--test',...readdirSync(`${lab}/script`).filter(n=>n.endsWith('.test.mjs')).sort().map(n=>`script/${n}`)]);
  }
  assert.deepEqual(sourceHashes(),result.sourceHashes,'source changed during execution');
  result.sourceUnchangedDuringRun=true;
  result.finishedAt=new Date().toISOString(); result.resourcesAfter=guard(); save();
  console.log(JSON.stringify(result,null,2));
} catch(e) { result.failure=e.message;save();console.error(e);process.exitCode=1; }
finally { clearTimeout(timer);clearInterval(diskTimer); }
