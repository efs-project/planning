import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {fixtures} from '../scripts/canonical-types-fixtures.mjs';
import {probe} from '../scripts/canonical-registry-probe.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
test('frozen canonical declarations and body outcomes remain independent of registry implementation',()=>{
 const golden=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-types-golden.json'));
 assert.deepEqual(fixtures(),golden);assert.equal(golden.groups.defaults.ids.length,2);
 assert.equal(golden.outcomes.length,30);assert.equal(golden.outcomes.filter(x=>x.valid).length,16);
});
test('standalone artifact source closure and expected runtime identity reproduce without native metadata substitution', {timeout:120000},()=>{
 const r=spawnSync(process.execPath,['scripts/compile-canonical-helper.mjs','--check'],{cwd:root,encoding:'utf8',timeout:110000});assert.equal(r.status,0,r.stdout+r.stderr);
 const artifact=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-preparation-helper.json'));
 assert.equal(artifact.runtimeHash,E.keccak256(artifact.deployedBytecode.object));
 assert.equal(Object.keys(artifact.input.sources).length,6);assert(!Object.keys(artifact.input.sources).some(s=>s.includes('Canonical')));
 const reference=spawnSync(process.execPath,['scripts/freeze-canonical-reference.mjs','--check'],{cwd:root,encoding:'utf8',timeout:10000});assert.equal(reference.status,0,reference.stdout+reference.stderr);
});
test('actual standalone helper and direct registry deploy and validate under ordinary caps with cache oracle', {timeout:240000},async()=>{
 const report=await probe();
 assert.equal(report.transactions.length,59);assert.equal(report.validations.length,30);
 assert(report.rollback.registryGroupAndTypesAbsent);
 assert(report.cleanup.stopped&&report.cleanup.cacheRemoved);
 assert(report.deployments.every(x=>x.runtimeBytes<=24576&&x.initcodeBytes<=49152));
 assert(report.transactions.every(x=>BigInt(x.receipt.gasUsed)<=16777216n));
 assert.equal(report.groups.filter(x=>x.refused).length,12);
});
