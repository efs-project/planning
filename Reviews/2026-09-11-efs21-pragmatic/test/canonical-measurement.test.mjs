import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {largeInputs,payloadCases} from '../scripts/canonical-economics-inputs.mjs';
import {comparePrimaryRows,primaryLabels} from '../scripts/canonical-types-benchmark.mjs';
test('economic comparator refuses a missing shared primary row',()=>{
 assert.throws(()=>comparePrimaryRows([{label:'quote create3000',gasUsed:'1'}],[]),/primary labels/);
});
test('economic comparator requires complete unique sets and tolerates only explicit nonprimary rows',()=>{
 const rows=primaryLabels.map(label=>({label,gasUsed:'100',calldataGas:20}));assert.equal(comparePrimaryRows(rows,rows).length,primaryLabels.length);
 assert.throws(()=>comparePrimaryRows(rows,[...rows,rows[0]]),/unique operation/);
 assert.throws(()=>comparePrimaryRows(rows,[...rows,{label:'unclassified extra',gasUsed:'1'}]),/primary labels/);
 assert.equal(comparePrimaryRows([...rows,{label:'old boundary',referenceOnly:true}],rows).length,rows.length);
});
test('economic boundary inputs match retained exact declarations and independent cache counts',()=>{
 const [b,a]=largeInputs();assert.equal(b.groupBytes,4356);assert.deepEqual(b.cacheBytes,[24960]);assert.equal(a.groupBytes,7010);assert.equal(a.aggregateCacheBytes,333824);assert.equal(a.completeResponseBytes,336096);assert.equal(payloadCases().length,7);
});
test('retained final economics must be complete and source frozen',{skip:!existsSync(new URL('../evidence/canonical-types.json',import.meta.url))&&!process.env.EFS21_REQUIRE_FINAL_EVIDENCE},()=>{
 const path=new URL('../evidence/canonical-types.json',import.meta.url);assert(existsSync(path),'final evidence is required');
 const r=JSON.parse(readFileSync(path));assert.equal(r.status,'MEASURED');assert.equal(r.mode,'final');assert.match(r.sourceCommit,/^[a-f0-9]{40}$/);assert.equal(r.arms.length,2);assert(r.arms.every(a=>a.cleanup.stopped&&a.cleanup.cacheRemoved));assert(r.arms.every(a=>a.transactions.length>30));assert(r.comparison.sameAppValue);assert(r.unsupportedCapabilities.length>=2);
});
