// Regression for the earlier review's remaining ABI-width followup.
// Test-only export of the actual private codec; no public reader API is added.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { Interface } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { compileUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
const shape=f=>({name:f.name,mutability:f.stateMutability,inputs:f.inputs.map(p=>p.format('sighash')),outputs:f.outputs.map(p=>p.format('sighash'))});
test('all actual reader ABI input/output shapes match compiled U1/U2 and Admin, including wide outputs',async()=>{
  compileUpgrade();
  const source=await readFile(new URL('../reader-scope.mjs',import.meta.url),'utf8');
  const relative="'../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js'";
  assert.equal(source.split(relative).length,2,'exactly one dependency rebased for the data-URL test import');
  const bundle=new URL('../../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js',import.meta.url).href;
  const imported=source.replace(relative,JSON.stringify(bundle))+'\nexport {codec as testCodec};\n';
  const {testCodec}=await import('data:text/javascript;base64,'+Buffer.from(imported).toString('base64'));
  // 20 baseline Core/Admin fragments, one experimental batch, and five carrier views.
  const functions=testCodec.fragments.filter(f=>f.type==='function');assert.equal(functions.length,26,'closed current scope surface');
  const CARRIER_NAMES=['hasFixtureBytes','readFixtureBytes','chunkStatus','hasChunk','readChunk'];
  async function artifact(path){return new Interface(JSON.parse(await readFile(new URL('../../2026-09-08-upgradeable-foundation/out/'+path,import.meta.url),'utf8')).abi);}
  const admin=await artifact('ProxyAdmin.sol/ProxyAdmin.json');
  for(const carrierVersion of ['UpgradeableFixtureCarrier','UpgradeableFixtureCarrierU2']){
    const carrier=await artifact('UpgradeableFixtureCarrier.sol/'+carrierVersion+'.json');
    for(const fragment of functions.filter(f=>CARRIER_NAMES.slice(0,2).includes(f.name))){
      const signature=fragment.format('sighash'),compiled=carrier.getFunction(signature);
      assert(compiled,carrierVersion+' missing '+signature);assert.deepEqual(shape(fragment),shape(compiled),carrierVersion+' / '+signature);
    }
  }
  // The three chunk views are U3 additions, not invented U1/U2 capabilities.
  // Reuse the real builder in a child with an isolated output root, never the tracked router artifacts.
  const build=await mkdtemp(join(tmpdir(),'efs-record-batch-abi-'));
  try {
    const module=new URL('../../2026-09-09-files-browser-mvp/test/router-fixture.mjs',import.meta.url).href;
    const result=spawnSync(process.execPath,['--input-type=module','-e',`import {compileRouter} from ${JSON.stringify(module)};compileRouter();`],{env:{...process.env,EFS_TEST_BUILD_ROOT:build},encoding:'utf8',timeout:240000});
    assert.equal(result.status,0,result.stdout+result.stderr);
    const carrier=new Interface(JSON.parse(await readFile(join(build,'router/out/AuthorityUpgrade.sol/UpgradeableFixtureCarrierU3.json'),'utf8')).abi);
    for(const fragment of functions.filter(f=>CARRIER_NAMES.includes(f.name))) {
      const compiled=carrier.getFunction(fragment.format('sighash'));
      assert(compiled,'U3 carrier missing '+fragment.name);assert.deepEqual(shape(fragment),shape(compiled),'U3 / '+fragment.name);
    }
  } finally {await rm(build,{recursive:true,force:true});}
  for(const version of ['UpgradeableReadFixtureCore','UpgradeableReadFixtureCoreU2']){
    const core=await artifact('UpgradeableReadFixtureCore.sol/'+version+'.json');
    for(const fragment of functions.filter(f=>!CARRIER_NAMES.includes(f.name))){
      const signature=fragment.format('sighash'),compiled=core.getFunction(signature)??admin.getFunction(signature);
      assert(compiled,version+' missing '+signature);assert.deepEqual(shape(fragment),shape(compiled),version+' / '+signature);
    }
    // Small numeric roundtrips could miss this output-width error; shape
    // comparison must catch it even though the function selector is unchanged.
    const wrong=new Interface(['function getRecord(bytes32 recordId) view returns (bytes32,bytes,uint32)']).getFunction('getRecord');
    const actual=core.getFunction('getRecord');assert.equal(wrong.selector,actual.selector);
    assert.notDeepEqual(shape(wrong),shape(actual),'uint32 is not the compiled uint64 output');
  }
});
