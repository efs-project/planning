// Fresh, finite final-reader control; not a replay of the historical scale run.
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {createEnvironment} from '../../script/compact-environment.mjs';
import {diagnoseJoinedRead} from '../../script/diagnose-joined-read.mjs';

const caps={wallMs:900000,outputBytes:256*1024*1024,nodeRss:768*1024*1024,anvilRss:1536*1024*1024};
const started=Date.now(),resources=[];
const controlSourceSha256=createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex');
async function size(path){let total=0;for(const entry of await readdir(path,{withFileTypes:true})){const child=join(path,entry.name);total+=entry.isDirectory()?await size(child):(await stat(child)).size;}return total;}
const report=await diagnoseJoinedRead({matrix:[[1,32],[8,32],[32,8],[64,4]],environment:async options=>{
  const env=await createEnvironment(options),write=env.writeReport;
  env.writeReport=async(name,data)=>{
    const row={wallMs:Date.now()-started,outputBytes:await size(env.dir),nodeRss:process.memoryUsage().rss,
      anvilRss:Number(execFileSync('ps',['-o','rss=','-p',String(env.anvilPid)],{encoding:'utf8'}).trim())*1024};
    resources.push(row);for(const [key,limit] of Object.entries(caps))assert(row[key]<=limit,`CONTROL_SAFETY_STOP ${key}`);
    return write(name,{...data,controlSourceSha256,caps,resources});
  };
  return env;
}});
for(const row of report.reads){assert(['PARTIAL','COMPLETE'].includes(row.coverage));assert.equal(row.paid?.status,'SUCCESS');assert.equal(row.failures.length,0);}
assert.equal(report.reads.length,4);
console.log('FINAL_READER_CONTROL_PASS '+JSON.stringify({runDirectory:report.runDirectory,resources}));
