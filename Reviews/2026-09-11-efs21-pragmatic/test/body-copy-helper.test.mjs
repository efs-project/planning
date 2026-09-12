import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Interface,keccak256,Transaction} from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const read=name=>JSON.parse(readFileSync(new URL('../evidence/body-copy-'+name+'.json',import.meta.url)));
const red=read('helper-red'),green=read('helper-candidate'),frozen=read('control-helper'),diff=read('helper-differential');
test('actual old-helper paid RED precedes candidate strict reduction with identical input/output',()=>{
 assert.equal(red.strictReduction,false);assert.equal(green.strictReduction,true);
 assert.equal(red.data,green.data);assert.equal(red.cacheBytes,green.cacheBytes);assert.equal(red.helperCode,frozen.runtime);
 assert.equal(green.helperCode,diff.newRuntime);assert.notEqual(green.helperCode,red.helperCode);
 for(const r of [red,green])for(const call of r.calls){
  assert.equal(call.receipt.status,'0x1');assert.equal(call.returned,red.calls[0].returned);
  assert.equal(keccak256(call.rawTransaction),call.receipt.transactionHash);
  assert.equal(Transaction.from(call.rawTransaction).data,r.data);
  assert.equal(call.transaction.blockHash,call.receipt.blockHash);
 }
 assert.equal(red.calls[0].receipt.gasUsed,red.calls[1].receipt.gasUsed);
 assert(BigInt(green.calls[0].receipt.gasUsed)<BigInt(red.calls[0].receipt.gasUsed));
 for(const r of [red,green,diff]){assert(r.cleanup.stopped&&r.cleanup.cacheRemoved);assert(!r.resources.nodeArgs.includes('--steps-tracing'));}
});
test('frozen public helper caches and both modes cover retained Types, refs, nested/map/range refusals',()=>{
 assert.equal(diff.oldRuntime,frozen.runtime);assert.equal(diff.groups.length,5);assert.equal(diff.cases.length,102);
 const iface=new Interface(frozen.abi);
 assert.equal(diff.cases.filter(c=>c.result.ok).length,44);
 for(let i=0;i<diff.cases.length;i+=2){const a=diff.cases[i],b=diff.cases[i+1];assert.equal(a.bodyOnly,false);assert.equal(b.bodyOnly,true);assert.equal(a.name,b.name);if(a.result.ok){const full=iface.decodeFunctionResult('prepareRecord',a.result.bytes)[0],only=iface.decodeFunctionResult('prepareRecord',b.result.bytes)[0];assert.deepEqual(only.references.toArray(true),full.references.toArray(true));assert.equal(only.occurrenceKeys.length,0);assert.equal(only.effect.kind,0n);}else assert.equal(a.result.bytes,b.result.bytes);}
 assert(diff.cases.some(c=>c.name==='private-forged-descriptor'&&!c.result.ok));
 assert(diff.cases.some(c=>c.result.ok&&iface.decodeFunctionResult('prepareRecord',c.result.bytes)[0].references.length>0));
});
