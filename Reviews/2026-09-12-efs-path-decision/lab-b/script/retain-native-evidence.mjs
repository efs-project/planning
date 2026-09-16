/** Retain bounded evidence metadata; no RPC, rebuild, or source-chain membership claim. */
import assert from 'node:assert/strict';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {loadEthers} from './compact-environment.mjs';
const dir='core-closeout-native-20260916/final-1',source='86e10eee86bb4ce959c1c99b43d5591e67661825';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(gunzipSync(await readFile(p)));
const e=await loadEthers(),p=await read(`${dir}/paid.json.gz`);
assert.equal(p.sourceCommit,source);assert(p.closed&&p.rpcStopped);
const files=[],sources=new Map(),artifacts={};let joins=0;
for(const name of Object.keys(p.artifacts)){
  const a=await read(`${dir}/artifact-${name}.json.gz`),m=a.metadata;
  for(const [path,pin] of Object.entries(m.sources)){
    const bytes=execFileSync('git',['show',`${source}:Reviews/2026-09-12-efs-path-decision/lab-b/${path}`]);
    assert.equal(e.keccak256(bytes),pin.keccak256);sources.set(path,pin.keccak256);joins++;
  }
  artifacts[name]={creationBytes:(a.bytecode.object.length-2)/2,runtimeTemplateBytes:(a.deployedBytecode.object.length-2)/2,
    creationKeccak:e.keccak256(a.bytecode.object),runtimeTemplateKeccak:e.keccak256(a.deployedBytecode.object),
    remappings:m.settings.remappings,compiler:m.compiler,settings:{optimizer:m.settings.optimizer,viaIR:m.settings.viaIR,evmVersion:m.settings.evmVersion}};
}
const old='core-closeout-authority-20260915',previous=await read(`${old}/paid.json.gz`);
const oldDirect=previous.arms.find(x=>x.deployment==='direct'),remappingComparison={artifacts:{},deployedCodeHashes:{},scope:'Exact retained wallet artifacts/direct run versus final native run; no older receipt relabelled.'};
for(const name of ['Ledger','PublicationSupport','ContractSignatureEvidenceStore']){
  const before=await read(`${old}/artifact-${name}.json.gz`),after=await read(`${dir}/artifact-${name}.json.gz`);
  const row={creationIdentical:before.bytecode.object===after.bytecode.object,runtimeTemplateIdentical:before.deployedBytecode.object===after.deployedBytecode.object,
    oldRemappings:before.metadata.settings.remappings,newRemappings:after.metadata.settings.remappings};
  assert(row.creationIdentical&&row.runtimeTemplateIdentical);remappingComparison.artifacts[name]=row;
}
for(const [name,a] of Object.entries(oldDirect.contracts))if(p.contracts[name]){
  const b=p.contracts[name];remappingComparison.deployedCodeHashes[name]={old:a.codeHash,current:b.codeHash,identical:a.codeHash===b.codeHash};
}
// Layout inspection forced a rebuild. The remapping can change metadata even
// where no upstream import is used; never relabel the paid cached artifact.
const layouts={sourceCommit:source,contracts:{}};
const runtimeCode=hex=>hex.slice(0,hex.length-4-2*Number.parseInt(hex.slice(-4),16));
for(const name of ['Ledger','NativeClaimArchive']){
  const current=JSON.parse(await readFile(`${process.env.FOUNDRY_OUT}/${name}.sol/${name}.json`));
  const retained=await read(`${dir}/artifact-${name}.json.gz`);
  assert.deepEqual(current.metadata.sources,retained.metadata.sources);assert(current.storageLayout);
  assert.equal(e.keccak256(runtimeCode(current.deployedBytecode.object)),e.keccak256(runtimeCode(retained.deployedBytecode.object)));
  layouts.contracts[name]={layout:current.storageLayout,sourceHashes:current.metadata.sources,
    inspectionSettings:current.metadata.settings,paidSettings:retained.metadata.settings,
    creationByteIdentical:current.bytecode.object===retained.bytecode.object,
    runtimeWithoutTrailingMetadataIdentical:true,
    inspectionCreationKeccak:e.keccak256(current.bytecode.object),inspectionRuntimeTemplateKeccak:e.keccak256(current.deployedBytecode.object)};
}
await writeFile(`${dir}/storage-layout.json`,JSON.stringify(layouts,null,2)+'\n',{flag:'wx'});
for(const file of (await readdir(dir)).sort()){
  const bytes=await readFile(`${dir}/${file}`);files.push({file,bytes:bytes.length,sha256:sha(bytes)});
}
const scripts={};for(const path of ['script/measure-native-proof.mjs','script/native-proof-export.mjs','script/native-late-only-export.mjs','script/native-instance-control.mjs','script/retain-native-evidence.mjs','browser/native-proof.mjs'])scripts[path]=sha(await readFile(path));
const receipt=t=>({label:t.label,transactionHash:t.transactionHash,blockHash:t.blockHash,blockNumber:t.blockNumber,status:t.status,gasUsed:t.gasUsed,calldataBytes:t.calldataBytes});
const manifest={sourceCommit:source,base:p.base,files,scripts,artifacts,sourceHashes:Object.fromEntries(sources),sourceMetadataJoins:joins,remappingComparison,
  source:p.source,roots:p.roots,transactions:p.transactions.map(receipt),
  witnesses:p.exports.map(x=>({label:x.label,diagnostics:x.diagnostics,claimId:x.verification.claimId,witnessId:x.verification.witnessId,acceptanceBlock:x.verification.acceptanceBlock,checkpoint:x.verification.checkpoint,observations:x.verification.observations})),
  joint:{diagnostics:p.joint.diagnostics,source:receipt(p.transactions.find(t=>t.transactionHash===p.joint.source.transactionHash)),verification:receipt(p.joint.verification),retention:receipt(p.joint.retention)},
  offline:p.offline.map(x=>({label:x.label,elapsedMs:x.elapsedMs,authority:x.consumer.authority})),closed:p.closed,rpcStopped:p.rpcStopped,
  qualifications:['Hashes and artifact/source joins are consistency checks, not independent source-chain membership or deployed-runtime reconstruction.',
    'The ancillary other-instance and evidence-packaging scripts are pinned by file SHA256 in the evidence commit; paid source remains the stated source commit.',
    'Full proof bytes are retained in paid.json.gz, not in onchain archive storage. Safety ceilings do not imply affordable joint execution.']};
await writeFile(`${dir}/manifest.json`,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({files:files.length,sources:sources.size,joins,remappingComparison}));
