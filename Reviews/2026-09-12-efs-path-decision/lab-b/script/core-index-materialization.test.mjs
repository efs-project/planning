// CLI provenance controls only: replace the chain boundary, never start a node.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const runner=fileURLToPath(new URL('./core-index-materialization.mjs',import.meta.url));
const boundary=new URL('./compact-environment.mjs',import.meta.url).href;
const archive=new URL('../core-closeout-index-20260915/old350k-paid.json.gz',import.meta.url);
const original=readFileSync(archive);
// createEnvironment loads ethers, creates a temp directory/port, starts Anvil,
// and deploys artifacts. Replace precisely that external-resource boundary.
const hook=`import {registerHooks} from 'node:module';
registerHooks({load(url,context,next){
  if(url!==${JSON.stringify(boundary)})return next(url,context);
  return {format:'module',shortCircuit:true,source:
    'console.error("RESOURCE_MODULE_IMPORTED"); export async function createEnvironment(options){throw new Error("RESOURCE_BOUNDARY:"+JSON.stringify(options));}'};
}});`;
function run(args){
  const result=spawnSync(process.execPath,['--import',`data:text/javascript,${encodeURIComponent(hook)}`,runner,...args],{
    encoding:'utf8',timeout:5000,
    env:{...process.env,EFS_ETHERS_PATH:'',FOUNDRY_OUT:'/nonexistent-index-test-artifacts',ANVIL_BIN:'/nonexistent-index-test-anvil'},
  });
  assert.ifError(result.error);
  assert.deepEqual(readFileSync(archive),original,'historical archive must remain byte-for-byte unchanged');
  return result;
}
for(const args of [[],['finite']])test(`${args.length?'explicit finite':'default'} selects the finite fixture before resources`,()=>{
  const result=run(args);
  assert.equal(result.status,1,'test stops at the resource boundary');
  const match=result.stderr.match(/Error: RESOURCE_BOUNDARY:(\{[^\n]*\})/);
  assert.ok(match,result.stderr);
  assert.deepEqual(JSON.parse(match[1]),{
    protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',indexFields:true,
  });
});
for(const stage of ['old350k','unknown'])test(`${stage} fails before resource module import`,()=>{
  const result=run([stage]);
  assert.equal(result.status,1);
  assert.match(result.stderr,/Only finite mode is supported/);
  assert.doesNotMatch(result.stderr,/RESOURCE_MODULE_IMPORTED|RESOURCE_BOUNDARY/);
});
