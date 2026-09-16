// Lossless bounded evidence packaging; does not modify source or remove raw logs.
import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const dir=new URL('../core-closeout-index-20260915/',import.meta.url).pathname;
const logs=['red','manifest-red','fields-red','green1','green2','green3','finite-green','covering','unknown-red','final-focused','global-red','global-green','header-final','paid-old','paid-finite','final-size-build'];
const sha=b=>createHash('sha256').update(b).digest('hex'),manifest=[];
for(const label of logs){
  const raw=await readFile(`/tmp/core-index-${label}.log`),packed=gzipSync(raw);
  const name=`${label}.log.gz`;await writeFile(join(dir,name),packed);
  manifest.push({name,rawBytes:raw.length,gzipBytes:packed.length,rawSha256:sha(raw),gzipSha256:sha(packed)});
}
for(const name of ['old350k-paid.json.gz','finite-paid.json.gz']){
  const packed=await readFile(join(dir,name)),raw=gunzipSync(packed),report=JSON.parse(raw);
  for(const tx of report.transactions){
    if(BigInt(tx.gasLimit)>15_000_000n||BigInt(tx.gasUsed)>BigInt(tx.gasLimit))throw new Error(`gas bound: ${tx.label}`);
    if(BigInt(tx.receipt.gasUsed)!==BigInt(tx.gasUsed))throw new Error(`receipt mismatch: ${tx.label}`);
    if((BigInt(tx.receipt.status)===1n)!==(tx.status==='SUCCESS'))throw new Error(`status mismatch: ${tx.label}`);
  }
  manifest.push({name,rawBytes:raw.length,gzipBytes:packed.length,rawSha256:sha(raw),gzipSha256:sha(packed),receipts:report.transactions.length});
}
const names=['Ledger','PublicationSupport','IndexModule','IndexFieldProfile','ProfiledIndexModule','SelectiveReferenceIndexModule','ProfiledFilesIndex'];
const sizes=[];
for(const name of names){
  const raw=await readFile(join(process.env.FOUNDRY_OUT,`${name}.sol`,`${name}.json`)),a=JSON.parse(raw);
  const runtime=(a.deployedBytecode.object.length-2)/2,initcode=(a.bytecode.object.length-2)/2;
  if(runtime>24576||initcode>49152)throw new Error(`code ceiling: ${name}`);
  const metadata=typeof a.metadata==='string'?JSON.parse(a.metadata):a.metadata;
  sizes.push({name,runtimeBytes:runtime,baseInitcodeBytes:initcode,artifactSha256:sha(raw),compilerSources:metadata.sources});
}
await writeFile(join(dir,'artifact-sizes.json'),JSON.stringify(sizes,null,2)+'\n');
await writeFile(join(dir,'evidence-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({logs:logs.length,receipts:manifest.filter(x=>x.receipts).map(x=>({file:x.name,count:x.receipts})),sizes},null,2));
