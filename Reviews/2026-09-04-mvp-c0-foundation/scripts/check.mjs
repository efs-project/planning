import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const cwd=fileURLToPath(new URL('..',import.meta.url));
function run(command,args, capture=false) {
  const r=spawnSync(command,args,{cwd,encoding:'utf8',stdio:capture?'pipe':'inherit'});
  if(r.error) throw r.error;
  assert.equal(r.status,0,`${command} failed: ${r.stderr??''}`); return r.stdout;
}
assert.equal(process.version,'v26.0.0','Node must be exactly 26.0.0');
for(const tool of ['forge','cast','anvil']) {
  const v=run(tool,['--version'],true);
  assert.match(v,/Version: 1\.7\.1(?:\s|$)/);
  assert.match(v,/4072e48705af9d93e3c0f6e29e93b5e9a40caed8/);
  console.log(v.trim());
}
const solc=process.env.EFS_C0_SOLC||'solc';
const compiler=run(solc,['--version'],true);
assert.match(compiler,/Version: 0\.8\.30\+commit\.73712a01(?:\.|\s|$)/);
const installed=JSON.parse(readFileSync(new URL('../node_modules/ethers/package.json',import.meta.url)));
assert.equal(installed.version,'6.15.0');
const lock=JSON.parse(readFileSync(new URL('../package-lock.json',import.meta.url)));
assert.equal(lock.packages['node_modules/ethers'].version,'6.15.0');
const config=JSON.parse(run('forge',['config','--json'],true));
assert.equal(config.evm_version,'cancun'); assert.equal(config.optimizer,true);
assert.equal(config.optimizer_runs,200); assert.equal(config.via_ir,true);
console.log(`Node ${process.version}; ethers ${installed.version}; ${compiler.trim()}`);
run('forge',['test','--use',solc,'--offline','-v']);
// Live Node integration consumes freshly compiled out/ ABIs and bytecode.
run(process.execPath,['--test','test/*.test.mjs']);
