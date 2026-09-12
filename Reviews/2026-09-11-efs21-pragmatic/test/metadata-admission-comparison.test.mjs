// Offline checks only: final paired receipts, or explicitly labelled scratch rehearsal.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { keccak256, Transaction, getCreateAddress, Interface, ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const read=arm=>{
  const base=process.env.EFS_METADATA_PREFLIGHT_ROOT
    ? resolve(process.env.EFS_METADATA_PREFLIGHT_ROOT,`preflight-${arm}`)
    : new URL(`../evidence/metadata-admission-${arm}`,import.meta.url).pathname;
  const manifest=JSON.parse(readFileSync(base+'.manifest.json')),compressed=readFileSync(base+'.json.gz');
  assert.equal(manifest.format,'EFS21_METADATA_RECEIPTS_GZIP_JSON_V1');
  assert(compressed.length<=8*1024**2&&manifest.canonical.bytes<=32*1024**2,'bounded offline decode');
  assert.equal(compressed.length,manifest.compressed.bytes);assert.equal(keccak256(compressed),manifest.compressed.keccak256);
  assert.equal(compressed[3],0);assert.equal(compressed.readUInt32LE(4),0);
  const canonical=gunzipSync(compressed,{maxOutputLength:32*1024**2});
  assert.equal(canonical.length,manifest.canonical.bytes);assert.equal(keccak256(canonical),manifest.canonical.keccak256);
  return JSON.parse(canonical);
};
const control=read('control'),candidate=read('candidate'),reports=[control,candidate];
const txFor=(r,op)=>r.transactions.find(t=>t.hash===op.hash);
function normalizedPaidBinding(report,raw) {
  const iface=new Interface(report.contractSurface.surfaces.UpgradeableFixtureCoreU3.abi);
  const decoded=iface.decodeFunctionResult('getBindingHead',raw);
  assert.equal(iface.encodeFunctionResult('getBindingHead',decoded),raw,'canonical paid Binding tuple');
  assert.equal(decoded[1],report.identity.execution.executionSetId,'paid Binding execution field');
  return [Array.from(decoded[0]),'VERIFIED_EXECUTION_SET',decoded[2]];
}

test('paid Binding identity cannot be supplied in the wrong return field',()=>{
  for(const report of reports) {
    const iface=new Interface(report.contractSurface.surfaces.UpgradeableFixtureCoreU3.abi);
    const actual=report.paidReads.find(x=>x.method==='getBindingHead');
    const decoded=iface.decodeFunctionResult('getBindingHead',actual.raw),head=Array.from(decoded[0]);
    head[5]=report.identity.execution.executionSetId;
    const forged=iface.encodeFunctionResult('getBindingHead',[head,ZeroHash,decoded[2]]);
    assert.throws(()=>normalizedPaidBinding(report,forged),/paid Binding execution field/);
    const matchingTarget=iface.encodeFunctionResult('getBindingHead',[head,decoded[1],decoded[2]]);
    const normalized=normalizedPaidBinding(report,matchingTarget);
    assert.equal(normalized[0][5],report.identity.execution.executionSetId,'target bytes remain untouched');
    assert.equal(normalized[1],'VERIFIED_EXECUTION_SET');
  }
});
function executable(hex){
  const metadataBytes=parseInt(hex.slice(-4),16);
  assert.equal(metadataBytes,51,'known Solidity0.8.30 IPFS+solc CBOR extent');
  const metadata=hex.slice(-(metadataBytes+2)*2);
  assert.match(metadata,/^a2646970667358221220[0-9a-f]{64}64736f6c634300081e0033$/);
  return hex.slice(0,-(metadataBytes+2)*2);
}

test('exact source selection, same support/compiler and unchanged helper runtime',()=>{
  assert.equal(control.soliditySourceCommit,'ed49a6c1c5bc70ffac392c7767c560d26c726c10');
  assert.equal(control.storageProfile,'envelope-code-ed49-full-row');assert.equal(candidate.storageProfile,'envelope-code-admission-meta-v1');
  assert.equal(candidate.sourceCommit,control.sourceCommit);
  assert.deepEqual(candidate.supportPins,control.supportPins);
  assert.deepEqual(candidate.resources.supportSourcePins,control.resources.supportSourcePins);
  assert.deepEqual(candidate.resources.compiler,control.resources.compiler);
  assert.deepEqual(candidate.resources.settings,control.resources.settings);
  assert.equal(candidate.resources.compilerBinaryHash,control.resources.compilerBinaryHash);
  const changed=Object.keys(control.resources.sourcePins).filter(p=>candidate.resources.sourcePins[p]!==control.resources.sourcePins[p]);
  assert.deepEqual(changed.sort(),['../2026-09-05-c0-core/src/StateKernel.sol','../2026-09-05-c0-core/src/StateStore.sol'].sort());
  assert.deepEqual(candidate.runtimes.PreparationHelper,control.runtimes.PreparationHelper);
  const helperCreation=r=>r.transactions.find(t=>t.receipt.contractAddress===r.runtimes.PreparationHelper.address).transaction.input;
  assert.equal(helperCreation(candidate),helperCreation(control),'helper creation bytes unchanged, including metadata');
  for(const [path,hash] of Object.entries(candidate.supportPins))assert.equal(keccak256(readFileSync(new URL('../'+path,import.meta.url))),hash,path);
  if(!process.env.EFS_METADATA_PREFLIGHT_ROOT)for(const r of reports){assert.equal(r.preliminary,false);assert.equal(r.sourceDiff,'');}
  assert.deepEqual(candidate.operations.map(x=>[x.name,x.category,x.plan]),control.operations.map(x=>[x.name,x.category,x.plan]));
});

test('existing public function/event ABI and all stored struct declarations are exact',()=>{
  for(const [name,old] of Object.entries(control.contractSurface.surfaces)) {
    const fresh=candidate.contractSurface.surfaces[name];
    assert.deepEqual(fresh.selectors,old.selectors,name+' selectors');
    const callable=abi=>abi.filter(x=>x.type!=='error');
    assert.deepEqual(callable(fresh.abi),callable(old.abi),name+' callable/event tuples');
    const errors=abi=>abi.filter(x=>x.type==='error').map(x=>JSON.stringify(x));
    assert(errors(old.abi).every(x=>errors(fresh.abi).includes(x)),name+' no removed errors');
    const added=errors(fresh.abi).filter(x=>!errors(old.abi).includes(x));
    assert(added.every(x=>JSON.parse(x).name==='ErrReadState'),name+' only allowed bounded-error addition');
  }
  const declarations=structuredClone(candidate.contractSurface.storageDeclarations);
  assert.deepEqual(declarations.RecordAdmissionMeta,[{name:'typeId',type:'bytes32'},{name:'recordOrdinal',type:'uint64'}]);
  delete declarations.RecordAdmissionMeta;
  assert.deepEqual(declarations,control.contractSurface.storageDeclarations,'all stored member types/order unchanged');
});

function normalizedInventory(report){
  const value=structuredClone(report.inventory);
  const byRevision=new Map([[1n,report.runtimes.UpgradeableReadFixtureCore.hash],[2n,report.runtimes.UpgradeableFixtureCoreU3.hash]]);
  for(const batch of value.batches){
    const revision=(BigInt(batch[0])>>112n)&0xffffffffn;
    assert(byRevision.has(revision));assert.equal(batch[2],byRevision.get(revision),'Batch authorityCodehash must match revision Core');
    batch[2]='VERIFIED_REVISION_CORE';
  }
  return value;
}
test('complete logical inventory agrees; normalization first authenticates each authority hash',()=>{
  assert.deepEqual(normalizedInventory(candidate),normalizedInventory(control));
  for(const report of reports){
    const forged=structuredClone(report);forged.inventory.batches[0][2]=report.runtimes.PreparationHelper.hash;
    assert.throws(()=>normalizedInventory(forged),/Batch authorityCodehash/);
  }
});
function logicalObserved(report,op){
  const result=structuredClone(op.observed);
  // Physical pointers and helper nonce intentionally differ; compare exact logical caches.
  result.cacheState=result.cacheState.caches.map(({id,cacheBytes})=>({id,cacheBytes}));
  for(const b of result.bindings){
    assert.equal(b.head[1],report.identity.execution.executionSetId);
    assert.equal(b.lens[0][8][0],report.identity.execution.executionSetId);
    assert.equal(BigInt(b.lens[0][8][1]),BigInt(txFor(report,op).receipt.blockNumber));
    b.head[1]='VERIFIED_EXECUTION_SET';b.lens[0][8][0]='VERIFIED_EXECUTION_SET';
  }
  return result;
}
test('per-receipt logical records, occurrences, counts, bindings, history and Lens agree',()=>{
  for(let i=0;i<control.operations.length;i++) {
    assert.deepEqual(logicalObserved(candidate,candidate.operations[i]),logicalObserved(control,control.operations[i]),control.operations[i].name);
    assert.deepEqual(candidate.operations[i].observed.cacheState,control.operations[i].observed.cacheState,'same physical byte inventory at '+control.operations[i].name);
  }
});
test('actual pointer/code inventory is chronological, with an explicitly unowned public helper child',()=>{
  for(const report of reports)for(const op of report.operations){
    const c=op.observed.cacheState;
    assert.equal(c.children.length,Number(BigInt(c.helperNonce)-1n));
    assert.equal(c.children.filter(x=>x.kind==='external-unowned').length,1);
    for(const child of c.children){assert.equal(child.address,getCreateAddress({from:c.helper,nonce:BigInt(child.nonce)}).toLowerCase());assert.notEqual(child.code,'0x');}
    for(const row of c.caches){const child=c.children.find(x=>x.address===row.address);assert.equal(child.kind,'Type');assert.equal(child.id,row.id);assert.equal(child.code,'0x00'+row.cacheBytes.slice(2));}
    for(const row of c.envelopes){const child=c.children.find(x=>x.address===row.address);assert.equal(child.kind,'Envelope');assert.equal(child.id,row.id);assert.equal(row.offset,0);assert(row.length>=288&&row.length<=2304);assert.equal((child.code.length-2)/2,row.length+1);assert(child.code.startsWith('0x00'));}
    assert.equal(c.envelopes.length,Number(op.observed.counts[1]));
  }
});
test('partial reuse and ACTIVE retry allocate no Envelope; fresh existing-Records publication allocates exactly one',()=>{
  for(const report of reports){
    const get=name=>report.operations.find(x=>x.name===name).observed;
    const partial=get('partial-direct-author'),mixed=get('mixed-ACTIVE-fresh'),retry=get('exact-ACTIVE-retry');
    assert.equal(partial.cacheState.helperNonce,mixed.cacheState.helperNonce);
    assert.deepEqual(mixed.cacheState,retry.cacheState);assert.deepEqual(mixed.counts,retry.counts);
    assert.equal(BigInt(retry.principalNonce),BigInt(mixed.principalNonce)+1n);
    const a=get('multiple-Type-groups'),b=get('existing-Types-fresh-envelope');
    assert.equal(BigInt(b.cacheState.helperNonce)-BigInt(a.cacheState.helperNonce),1n);
    assert.equal(b.counts[0],a.counts[0]);assert.equal(b.counts[2],a.counts[2]);
    for(const fault of report.cacheCases){assert.deepEqual(fault.before,fault.after);assert.deepEqual(fault.codeBefore,fault.codeAfter);assert(fault.codeAfter.every(x=>x==='0x'));}
    assert(report.cacheCases.some(x=>x.fault==='late-reference'&&x.error!==report.cacheCases.find(x=>x.fault==='cache-then-reference').error));
  }
});
test('actual paid Core reads agree; maximum Envelope is64-vector with only one selected existing Record',()=>{
  if(!process.env.EFS_METADATA_PREFLIGHT_ROOT){
    for(const r of reports){
      const tx=r.transactions.find(t=>t.label==='paid read consumer');
      assert.equal(tx.transaction.input,r.paidConsumer.creation);
      assert.equal(tx.receipt.contractAddress,r.paidConsumer.address);
    }
    for(const part of ['creation','runtime']){
      assert.equal(candidate.paidConsumer[part].length,control.paidConsumer[part].length,'paid consumer same '+part+' extent');
      assert.equal(executable(candidate.paidConsumer[part]),executable(control.paidConsumer[part]),'paid consumer identical executable '+part+'; actual metadata retained');
    }
    assert.deepEqual(candidate.paidConsumer.compiler,control.paidConsumer.compiler);
    assert.deepEqual(candidate.paidConsumer.settings,control.paidConsumer.settings);
  }
  const logicalReads=report=>report.paidReads.map(x=>{
    let raw=x.raw;
    if(x.method==='getBindingHead'){
      raw=normalizedPaidBinding(report,raw);
    }
    if(x.method==='getRecordsCurrent'){
      // Its checked-current ABI starts with the authenticated execution-set ID.
      assert.equal(raw.slice(0,66),report.identity.execution.executionSetId);
      raw='VERIFIED_EXECUTION_SET'+raw.slice(66);
    }
    return[x.name,x.method,x.args,raw];
  });
  assert.deepEqual(logicalReads(candidate),logicalReads(control));
  for(const report of reports){
    assert.deepEqual(report.paidReads.map(x=>x.method),['getEnvelope','getOccurrence','getRecord','getBindingHead','getRecordsCurrent','getEnvelope']);
    for(const read of report.paidReads){const tx=txFor(report,read);assert.equal(tx.receipt.status,'0x1');assert.equal(BigInt(read.gasUsed),BigInt(tx.receipt.gasUsed));}
    const max=report.operations.find(x=>x.name==='maximum-Envelope-one-selected-existing-Record');
    assert.equal(max.plan.publication.recordIds.length,64);assert.equal(max.plan.publication.leaves.length,1);assert.equal(max.plan.publication.leafMask,'1');
    assert.equal(report.filesRead.pages.at(-1).coverage,'COMPLETE');
    for(const page of report.filesRead.pages)assert.equal(page.qualification.status,'QUALIFIED');
  }
});
test('raw mined receipt pins, ordinary ceilings and owned cleanup are retained',()=>{
  for(const report of reports){
    assert(!report.resources.nodeArgs.includes('--steps-tracing'));assert(!report.resources.nodeArgs.includes('--disable-code-size-limit'));
    for(const [name,r]of Object.entries(report.runtimes))assert(r.bytes<=24576,name);
    assert.equal(report.cleanup.stopped,true);assert.equal(report.cleanup.cacheRemoved,true);assert(!existsSync(report.cleanup.cachePath));
    assert.equal(report.buildCleanup.removed,true);assert(!existsSync(report.buildCleanup.path));
    for(const tx of report.transactions){
      assert.equal(keccak256(tx.raw),tx.hash);const parsed=Transaction.from(tx.raw);
      assert.equal(parsed.data,tx.transaction.input);assert.equal(parsed.from.toLowerCase(),tx.transaction.from.toLowerCase());
      assert.equal(tx.receipt.transactionHash,tx.hash);assert.equal(tx.transaction.blockHash,tx.receipt.blockHash);
      assert.equal(tx.transaction.blockNumber,tx.receipt.blockNumber);assert.equal(tx.transaction.transactionIndex,tx.receipt.transactionIndex);
      assert.equal(parsed.gasLimit,BigInt(tx.transaction.gas));assert(BigInt(tx.receipt.gasUsed)<=16777216n);
      assert.equal(tx.calldata.bytes,tx.calldata.zeroBytes+tx.calldata.nonzeroBytes);
    }
  }
});
