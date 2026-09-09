// Regression for the earlier review's remaining ABI-width followup.
// Test-only export of the actual private codec; no public reader API is added.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
  const functions=testCodec.fragments.filter(f=>f.type==='function');assert.equal(functions.length,20,'closed current scope surface');
  async function artifact(path){return new Interface(JSON.parse(await readFile(new URL('../../2026-09-08-upgradeable-foundation/out/'+path,import.meta.url),'utf8')).abi);}
  const admin=await artifact('ProxyAdmin.sol/ProxyAdmin.json');
  for(const version of ['UpgradeableReadFixtureCore','UpgradeableReadFixtureCoreU2']){
    const core=await artifact('UpgradeableReadFixtureCore.sol/'+version+'.json');
    for(const fragment of functions){
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
