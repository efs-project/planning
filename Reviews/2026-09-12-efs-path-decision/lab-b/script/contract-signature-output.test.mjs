import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const digest=x=>createHash('sha256').update(x).digest('hex');
for(const [runner,output] of [['measure-contract-signatures.mjs','paid.json.gz'],['measure-contract-signature-upgrade.mjs','exact-base-upgrade.json.gz']]){
  test(`${runner} refuses retained output before ethers/artifacts/chain resources`,async()=>{
    const path=new URL(`../core-closeout-authority-20260915/${output}`,import.meta.url),before=digest(await readFile(path));
    const env={...process.env,EFS_ETHERS_PATH:'',FOUNDRY_OUT:'/not-an-artifact-directory',ANVIL_BIN:'/not-an-anvil-binary'};
    const result=spawnSync(process.execPath,[new URL(runner,import.meta.url).pathname],{cwd:new URL('../',import.meta.url),env,encoding:'utf8',timeout:5000});
    assert.equal(result.status,1);assert.match(result.stderr,/EVIDENCE_OUTPUT_EXISTS/);
    assert.equal(digest(await readFile(path)),before,'retained evidence changed');
  });
}
