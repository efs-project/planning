// Evidence audit only: hashes, receipts, gas/caps and exact byte density.
// Not a generic described decoder or Task2's independent reader.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {loadEthers} from '../script/compact-environment.mjs';
const e=await loadEthers(),root=new URL('../',import.meta.url);
const report=JSON.parse(gunzipSync(await readFile(new URL('paid-run2/paid.json.gz',import.meta.url))));
const vectors=JSON.parse(await readFile(new URL('vectors.json',import.meta.url)));
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n';
for(const [path,pin] of Object.entries(report.sourcePins)){
 const bytes=await readFile(new URL(path,root));assert.equal(e.keccak256(bytes),pin.keccak256,path);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),pin.sha256,path);
}
assert.equal(vectors.wrapperSourceKeccak,report.sourcePins['src/DescribedTypeProfile.sol'].keccak256);
const artifact=JSON.parse(await readFile(process.env.FOUNDRY_OUT+'/DescribedTypeProfile.sol/DescribedTypeRule.json'));
assert.equal(e.keccak256(artifact.deployedBytecode.object),vectors.wrapperRuntimeHash);
assert.equal(e.keccak256(artifact.bytecode.object),vectors.wrapperInitcodeHash);
assert.equal(report.deployments.find(x=>x.label==='standalone-wrapper-cost').codeHash,vectors.wrapperRuntimeHash);
const ledgerAbi=new e.Interface(report.artifacts.Ledger.metadata.output.abi),density=[];
for(const row of report.transactions){
 assert.equal(row.hash,e.keccak256(row.rawTransaction));const signed=e.Transaction.from(row.rawTransaction);
 assert.equal(signed.data,row.chainTx.input);assert.equal(signed.from.toLowerCase(),row.chainTx.from.toLowerCase());
 assert.equal(signed.gasLimit,15_000_000n);assert(signed.gasLimit<=16_777_216n);
 assert.equal(BigInt(row.gasUsed),BigInt(row.receipt.gasUsed));assert.equal(row.status,BigInt(row.receipt.status)===1n);
 let parsed;try{parsed=ledgerAbi.parseTransaction({data:signed.data});}catch{}
 if(parsed?.name==='publish'){
  const bytes=e.getBytes(parsed.args[1]);let nonzeroWords=0;
  for(let i=0;i<bytes.length;i+=32)if(bytes.slice(i,i+32).some(x=>x!==0))nonzeroWords++;
  density.push({label:row.label,status:row.status,totalBytes:bytes.length,nonzeroBytes:bytes.filter(x=>x!==0).length,
   zeroBytes:bytes.filter(x=>x===0).length,nonzeroWords,totalWords:Math.ceil(bytes.length/32),gasUsed:row.gasUsed});
 }
}
const wrapperCosts=report.traces.map(t=>({label:t.label,calls:t.calls,...t.wrapperCalls.map(c=>({allowance:BigInt(c.gas),consumed:BigInt(c.gasUsed),error:c.error}))[0]}));
for(const t of wrapperCosts){assert.equal(t.allowance,300_000n);assert(t.consumed<=300_000n);assert(t.calls<=512);}
for(const d of report.deployments){assert(d.runtime<=24576);assert(d.initcode<=49152);assert.equal(e.getBytes(d.code).length,d.runtime);assert.equal(e.keccak256(d.code),d.codeHash);}
assert.equal(report.failure,undefined);assert.equal(report.anvil.exitCode,0);
const result={verifiedSourceFiles:Object.keys(report.sourcePins).length,transactions:report.transactions.length,intendedRefusals:report.transactions.filter(x=>!x.status).length,
 wrapperRuntimeHash:vectors.wrapperRuntimeHash,wrapperInitcodeHash:vectors.wrapperInitcodeHash,wrapperSourceKeccak:vectors.wrapperSourceKeccak,wrapperCosts,density,
 deploymentSizes:report.deployments.map(({name,label,runtime,initcode,argumentBytes,gasUsed})=>({name,label,runtime,initcode,argumentBytes,gasUsed})),
 qualifications:['Joint maximum payload is7927zero bytes, not worst-case nonzero storage writes.','Eight checked-reference slots repeat ONE existing target; not eight cold distinct records.','Cold means separate transaction boundary; all retained target storage naturally warms within one transaction.','Full8190text is structurally legal but cannot be admitted by this300k profile.','Raw ECDSA signing is not evidence of ordinary wallet UI support.']};
await writeFile(new URL('audit.json',import.meta.url),json(result));console.log(json(result));
