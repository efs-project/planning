// Retained local evidence audit, not consensus verification. No RPC or writes.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadEthers} from '../script/compact-environment.mjs';
import {verifyGuardedClaim} from '../browser/guarded-archive.mjs';
import * as described from '../browser/described-type-archive.mjs';
const e=await loadEthers(),sha=b=>createHash('sha256').update(b).digest('hex'),base=new URL('interpretation-run1/',import.meta.url),root=new URL('../',import.meta.url);
const measured='a72c272a4f3d1d55aec1a0d77a2ee9cc2a351895',lab='Reviews/2026-09-12-efs-path-decision/lab-b/';
const expected={
 'paid.json':['513dc97767d2a76f9a031d25b39487e47cc829d6ece1ab8d8214685d12f9460b','ab5b941cf76eb3aca9a2e85d1388bc1dcc8fae91ef965f0c2650173aa8cecf33'],
 'source-sidecars.json':['ae6140014ac58f42748a1b47f94ff17a6e7380905993073f178818720f3e3eed','a8d4ff9a30740fe8f6b1bcec3cf8c81f98e2f254453df5157f24fae5f1323b2c'],
 'source-off-results.json':['c46bb849c2bd67d7268e87762f45afc3c232bc0803c1118bda2b589813a5d15c','ec1a8c1c20ce5d642d94d5783e2a5d3455c79b61c211a8045677f4104355a0cf'],
};
const documents={},packaging={};
for(const [name,[rawSha,gzipSha]] of Object.entries(expected)){
 const packed=await readFile(new URL(name+'.gz',base)),raw=gunzipSync(packed);assert.equal(sha(packed),gzipSha);assert.equal(sha(raw),rawSha);
 documents[name]=JSON.parse(raw);packaging[name]={rawBytes:raw.length,gzipBytes:packed.length,rawSha256:rawSha,gzipSha256:gzipSha};
}
const packet=documents['paid.json'];assert(!packet.failure);let sourceJoins=0,artifactJoins=0,dependencyJoins=0,transactions=0,deployments=0,refusals=0;const postMeasurementChanges=[];
for(const [path,pin] of Object.entries(packet.sourcePins)){
 const retained=execFileSync('git',['show',measured+':'+lab+path],{maxBuffer:2*1024*1024});assert.equal(sha(retained),pin.sha256);assert.equal(e.keccak256(retained),pin.keccak256);sourceJoins++;
 const current=await readFile(new URL(path,root));if(sha(current)!==pin.sha256){assert.equal(path,'browser/described-type-archive.mjs','unexpected measured source drift');postMeasurementChanges.push({path,measuredSha256:pin.sha256,currentSha256:sha(current),scope:'offline qualification/projection hardening; no decoder or contract change'});}
}
for(const [name,a] of Object.entries(packet.artifacts)){
 const raw=await readFile(`${process.env.FOUNDRY_OUT}/${a.file}/${name}.json`),artifact=JSON.parse(raw);assert.equal(sha(raw),a.artifactSha256);
 assert.equal(artifact.bytecode.object,a.creation);assert.equal(artifact.deployedBytecode.object,a.runtime);assert.deepEqual(artifact.metadata,a.metadata);
 assert.deepEqual(artifact.bytecode.linkReferences,{});assert.deepEqual(artifact.deployedBytecode.linkReferences,{});
 assert.equal(a.metadata.compiler.version,'0.8.30+commit.73712a01');assert.equal(a.metadata.settings.optimizer.runs,200);assert(a.metadata.settings.optimizer.enabled&&a.metadata.settings.viaIR);assert.equal(a.metadata.settings.evmVersion,'cancun');
 for(const [path,pin] of Object.entries(a.metadata.sources)){assert.equal(packet.sourcePins[path].keccak256,pin.keccak256);dependencyJoins++;}artifactJoins++;
}
for(const chain of packet.chains){
 assert.deepEqual(chain.historyPolicy,{states:256,transactionBlocks:512});
 const txs=new Map();for(const row of chain.transactions){
  const t=e.Transaction.from(row.rawTransaction),hash=e.keccak256(row.rawTransaction),r=row.receipt,c=row.chainTx,b=row.block;
  assert.equal(hash,row.transactionHash);assert.equal(hash,r.transactionHash);assert.equal(hash,c.hash);assert.equal(c.input,t.data);assert.equal(c.from.toLowerCase(),t.from.toLowerCase());
  assert.equal((c.to??'').toLowerCase(),(t.to??'').toLowerCase());assert.equal(BigInt(c.nonce),BigInt(t.nonce));assert.equal(t.chainId,BigInt(chain.chainId));assert.equal(BigInt(c.gas),t.gasLimit);
  assert.equal(c.blockHash,r.blockHash);assert.equal(r.blockHash,b.hash);assert.equal(c.transactionIndex,r.transactionIndex);assert.equal(b.transactions[Number(BigInt(r.transactionIndex))],hash);
  assert.equal(BigInt(r.blockNumber),BigInt(b.number));assert.equal(BigInt(b.gasLimit),16_777_216n);assert(t.gasLimit<=15_000_000n);assert(BigInt(r.gasUsed)<=t.gasLimit);
  assert.equal(BigInt(row.gasUsed),BigInt(r.gasUsed));assert.equal(BigInt(r.status)===1n,row.status==='SUCCESS');if(row.status!=='SUCCESS')refusals++;transactions++;txs.set(hash,row);
 }
 for(const d of chain.deployments){
  const row=txs.get(d.transactionHash),a=packet.artifacts[d.name];assert.equal(row.receipt.contractAddress.toLowerCase(),d.address.toLowerCase());
  assert.equal(e.Transaction.from(row.rawTransaction).data,a.creation+d.constructorArguments.slice(2));assert.equal(e.getBytes(d.constructorArguments).length,d.argumentBytes);
  assert.equal(d.initcodeBytes,e.getBytes(a.creation).length+d.argumentBytes);assert(d.initcodeBytes<=49152&&d.runtimeBytes<=24576);
  const actual=e.getBytes(d.runtime),template=e.getBytes(a.runtime),mask=new Set();assert.equal(actual.length,d.runtimeBytes);assert.equal(template.length,actual.length);
  for(const refs of Object.values(a.immutableReferences))for(const ref of refs)for(let i=0;i<ref.length;i++)mask.add(ref.start+i);
  for(let i=0;i<actual.length;i++)if(!mask.has(i))assert.equal(actual[i],template[i]);deployments++;
 }
}
const recovered=[];for(const bundle of documents['source-sidecars.json'])recovered.push(await verifyGuardedClaim(e,bundle,{described}));
assert.deepEqual(recovered,documents['source-off-results.json'],'current offline corrections preserve successful paid packet interpretations');
assert.equal(transactions,80);assert.equal(refusals,8);assert.equal(packet.summary.freeze.sha256,sha(await readFile(new URL('browser/described-type-reader.mjs',root))));
console.log(JSON.stringify({measuredSourceCommit:measured,sourceJoins,artifactJoins,dependencyJoins,transactions,refusals,deployments,offlineBundles:recovered.length,
 interpretation:recovered.map(r=>r.interpretationCoverage),postMeasurementChanges,packaging,limits:'Retained local RPC joins, not authenticated chain-state or historical custom-state proof.'},null,2));
