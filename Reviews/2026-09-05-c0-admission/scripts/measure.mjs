import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { makePublication } from '../codec.mjs';
import { verifySnapshot } from '../reader.mjs';
import { compile,withProbe,submit,collectSnapshot,TX_GAS,SOLC } from './local-chain.mjs';
const bytes=x=>(x.length-2)/2;
const sha=b=>createHash('sha256').update(b).digest('hex');
const serialize=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v));
export async function measure(){
  const sources={};
  for(const path of ['src/AdmissionProbe.sol','src/TypeGroupParser.sol','codec.mjs','reader.mjs','scripts/local-chain.mjs','scripts/measure.mjs','run-codec.md','foundry.toml'])sources[path]=sha(await readFile(new URL('../'+path,import.meta.url)));
  const executableDependencySha256={};
  for(const name of ['parser.mjs','encoder.mjs']){
    const path='../2026-09-05-mvp-build-start/type-inputs/'+name;
    executableDependencySha256[path]=sha(await readFile(new URL('../'+path,import.meta.url)));
  }
  const sourceSpine={};for(const path of ['Designs/efsv2/disposable-mvp-profile.md','Designs/efsv2/mvp-c0-genesis-manifest.md'])sourceSpine[path]=sha(await readFile(new URL('../../../'+path,import.meta.url)));
  return withProbe(async lab=>{
    const transactions=[];
    for(let i=0;i<4;i++){
      const p=makePublication(lab.run,lab.deployment,i),r=await submit(lab,p);
      const tx=await lab.provider.getTransaction(r.hash);
      transactions.push({operation:'fresh Type-group admission',group:i+1,memberCount:lab.run.candidates.groups[i].members.length,groupBytes:lab.run.candidates.groups[i].groupBytes,canonicalBodyBytes:bytes(p.canonicalBody),calldataBytes:bytes(tx.data),recordId:p.recordIds[0],envelopeId:p.envelopeId,occurrenceKey:p.occurrenceKey,publicationDigest:p.publicationDigest,writePlanDigest:p.writePlanDigest,receipt:serialize(r.toJSON())});
    }
    for(const [operation,options]of [['authenticated exact replay',{}],['new envelope same Record',{nonceSeq:5}]]){
      const p=makePublication(lab.run,lab.deployment,0,options),r=await submit(lab,p),tx=await lab.provider.getTransaction(r.hash);
      transactions.push({operation,group:1,calldataBytes:bytes(tx.data),recordId:p.recordIds[0],envelopeId:p.envelopeId,occurrenceKey:p.occurrenceKey,receipt:serialize(r.toJSON())});
    }
    const snapshot=await collectSnapshot(lab),fixedBlockVerification=verifySnapshot(snapshot,{...lab.run,...lab.deployment});
    const deploymentTx=await lab.provider.getTransaction(lab.deploymentReceipt.hash);
    const byteSizes={runtimeBytes:bytes(lab.runtimeCode),initcodeWithConstructorArgsBytes:bytes(deploymentTx.data),artifactCreationBytecodeBytes:bytes(lab.compiled.bytecode.object),intrinsicGroupBytes:bytes(snapshot.intrinsicGroup),declarationInventoryBytes:bytes(snapshot.declarationInventory),uniqueRecordBodyBytes:Object.values(snapshot.records).reduce((n,r)=>n+bytes(r.body),0),parsedCacheBytes:Object.values(snapshot.types).reduce((n,t)=>n+bytes(t.cacheBytes),0),retainedEnvelopeBytes:Object.values(snapshot.envelopes).reduce((n,e)=>n+bytes(e.unsignedStatement)+bytes(e.effects)+bytes(e.plan)+bytes(e.witness),0),retainedPrincipalDescriptorBytes:Object.values(snapshot.principals).reduce((n,p)=>n+bytes(p),0)};
    assert(byteSizes.runtimeBytes<=24576);assert(byteSizes.initcodeWithConstructorArgsBytes<=49152);
    const report={format:'efs-partial-c0-admission-probe-measurements/1',fullC0:false,sourceBaseRevision:'499bfca98e47ad2aa16244045c844a66710a62e4',candidateSourceRevision:lab.run.candidates.sourceRevision,candidateArtifactSha256:sha(await readFile(new URL('../../2026-09-05-mvp-build-start/type-inputs/artifacts.v1.json',import.meta.url))),candidateSourcePins:lab.run.candidates.sources,sourceSha256:sources,sourceSpineSha256:sourceSpine,toolchain:{node:process.version,ethers:'6.15.0',solc:spawnSync(process.env.EFS_C0_SOLC??SOLC,['--version'],{encoding:'utf8'}).stdout.trim(),forge:spawnSync('forge',['--version'],{encoding:'utf8'}).stdout.trim(),anvil:spawnSync('anvil',['--version'],{encoding:'utf8'}).stdout.trim(),optimizerRuns:200,viaIR:true,evm:'cancun'},chainProfile:{chainId:31337,transport:'managed loopback-only Anvil; terminated after measurement',syntheticAccountsOnly:true,maxTransactionGas:TX_GAS.toString(),blockGasLimit:TX_GAS.toString(),timestampMode:'fixed startup timestamp plus local block progression',stateByteStore:'reserved inert address; no deployed byte carrier'},run:{...lab.deployment,config:lab.run.config,intrinsicDescriptor:lab.run.intrinsicDescriptor,intrinsicGroup:lab.run.intrinsicGroup,declarationInventory:lab.run.declarationInventory,documentaryInventory:lab.run.documentaryInventory,probeCommitment:lab.run.probeCommitment,c0ProfileId:lab.run.c0ProfileId,metaTypeId:lab.run.metaTypeId,creationBytecodeKeccak256:keccak256(lab.compiled.bytecode.object)},deploymentReceipt:serialize(lab.deploymentReceipt.toJSON()),byteSizes,transactions,fixedBlockVerification,snapshot,limitations:['Partial finite admission/cache slice only; no full C0 initialization or genesis receipt.','Named probeCommitment substitutes for full C0 post-deployment experimentCommitment; runtime/source hashes reported separately.','Intrinsic metadata and prior candidate metadata/index/seal choices are temporary engineering bytes, not an adopted Codex.','Declaration inventory is documentary, not an executable G3 capability manifest.','ASCII/DIRECT descriptor subset; conservative skip-read upper bounds, no general E1 compiler or Unicode16 STRUCT-FULL.','No arbitrary typed Record-body validation, Binding, Lens, scalar/digest instance lookup, Files operations, session authorization or byte carrier.','Byte sums count exact retained dynamic byte strings, not storage slots or optimized Core cost.','Gas measures this synthetic local Cancun implementation; not full Core estimates, a named L2 forecast or production readiness.','Fixed-block finite inventory reconstruction, not a general COMPLETE QueryProfile; provider failures are UNKNOWN.','JavaScript parser and preimages independent from producer/Solidity, but cryptography uses the same ethers library.']};
    report.executableDependencySha256=executableDependencySha256;
    return report;
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  compile();const report=await measure();
  if(process.argv.includes('--write'))await writeFile(new URL('../measurements.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({fixedBlockVerification:report.fixedBlockVerification,byteSizes:report.byteSizes,deploymentGas:report.deploymentReceipt.gasUsed,transactionGas:report.transactions.map(x=>({operation:x.operation,group:x.group,gasUsed:x.receipt.gasUsed})),written:process.argv.includes('--write')},null,2));
}
