import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const [label]=process.argv.slice(2);
assert(/^[a-z0-9-]+$/.test(label??''));
assert.equal(process.version,'v26.0.0');
const run='/tmp/efs-b-archive-task1.OXPOfb';
const source='/Users/james/Code/EFS/planning-warroom-b-run/Reviews/2026-09-12-efs-path-decision/lab-b/experiments/live-placement-model';
const dest=run+'/'+label+'.source';
const sha=b=>createHash('sha256').update(b).digest('hex');
const expected={'reference.mjs':'407af262140a32aa1ac068353fea4c61620ce013e5f60b50fed0add1c0d4eaa5','fixtures.mjs':'f003a31b1cd770d5e39d20fd966005bd36582a5cb1519691b0c5fc019f619288','model.test.mjs':'210e6226c43b8fc10b3cd82565eac2588c40b77862a42bdfeef4ce6dddc7c344'};
assert(Date.now()<Date.parse('2026-09-14T14:00:00Z'));
assert(!fs.existsSync(dest));fs.mkdirSync(dest);
const record={label,startedAt:new Date().toISOString(),source:{},checks:[],tool:process.version};
for(const name of ['reference.mjs','fixtures.mjs','candidate.mjs','model.test.mjs']) {
 const body=fs.readFileSync(source+'/'+name);assert(body.length<256*1024);
 const digest=sha(body);if(expected[name])assert.equal(digest,expected[name]);
 record.source[name]={sha256:digest,bytes:body.length};fs.writeFileSync(dest+'/'+name,body,{flag:'wx'});
}
function execute(args,timeout=5000){const r=spawnSync(process.execPath,args,{cwd:dest,encoding:'utf8',timeout,maxBuffer:2*1024*1024,env:{PATH:'/usr/bin:/bin'}});return {args,status:r.status,signal:r.signal,error:r.error?.message,stdout:r.stdout??'',stderr:r.stderr??''};}
for(const name of Object.keys(record.source)){const r=execute(['--check',name]);record.checks.push(r);assert.equal(r.status,0,'syntax must pass before behavioral test');}
record.test=execute(['--max-old-space-size=128','--test','--test-isolation=none','--test-reporter=tap','model.test.mjs'],20000);
record.finishedAt=new Date().toISOString();record.sourceSnapshot=dest;
fs.writeFileSync(run+'/'+label+'.json',JSON.stringify(record,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({label,status:record.test.status,signal:record.test.signal,error:record.test.error,report:run+'/'+label+'.json',tail:record.test.stdout.slice(-1800)}));
process.exitCode=record.test.status??1;
