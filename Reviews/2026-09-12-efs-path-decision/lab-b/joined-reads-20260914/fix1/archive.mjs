// Archive generated fix evidence without changing historical campaign receipts.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const [scratch,run,reference]=process.argv.slice(2);assert(scratch&&run&&reference);
const here=fileURLToPath(new URL('./',import.meta.url)),lab=resolve(here,'../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),entries=[];
const sources=['browser/app.mjs','browser/compact-sdk.mjs','browser/directory-routing.test.mjs','browser/joined.integration.test.mjs',
  'script/measure-joined.mjs','script/diagnose-joined-read.mjs','script/joined-cleanup.test.mjs','test/FilesPageReader.sol','test/FilesPageReader.t.sol'];
const pins={sources:{},artifacts:{},coreUnchanged:{}};
for(const path of sources)pins.sources[path]=sha(await readFile(join(lab,path)));
for(const [file,name] of [['Ledger.sol','Ledger'],['TypeRegistry.sol','TypeRegistry'],['FilesPageReader.sol','FilesPageReader'],['FilesPageReader.sol','FilesPagePaid']]){
  const path=join(scratch,'out',file,name+'.json'),artifact=JSON.parse(await readFile(path));
  const code=a=>({abi:a.abi,init:a.bytecode.object,runtime:a.deployedBytecode.object});
  pins.artifacts[name]={artifactSha256:sha(await readFile(path)),creationBytes:(artifact.bytecode.object.length-2)/2,runtimeBytes:(artifact.deployedBytecode.object.length-2)/2};
  if(['Ledger','TypeRegistry'].includes(name)){assert.deepEqual(code(artifact),code(JSON.parse(await readFile(join(reference,file,name+'.json')))));pins.coreUnchanged[name]='ABI/init/runtime exact equality';}
}
await writeFile(join(here,'source-artifact-pins.json'),JSON.stringify(pins,null,2)+'\n',{flag:'wx'});
for(const [label,root,files] of [
  ['control',run,['joined-read-diagnostic.json','manifest.json','transactions.jsonl']],
  ['logs',scratch,['red-ui.log','green-ui.log','red-unknown.log','red-parity.log','red-cleanup-entry.log','red-cleanup-green-parity.log','green-cleanup.log','incomplete-artifacts-node.log','green-covering-node.log','green-reader.log','build.log','final-reader-control.log']],
]){
  await mkdir(join(here,label),{recursive:true});
  for(const name of files){const path=join(root,name),bytes=await readFile(path),compressed=gzipSync(bytes),target=join(label,name+'.gz');
    await writeFile(join(here,target),compressed,{flag:'wx'});entries.push({file:target,sourcePath:path,rawBytes:bytes.length,rawSha256:sha(bytes),gzipBytes:compressed.length,gzipSha256:sha(compressed)});}
}
await writeFile(join(here,'evidence-index.json'),JSON.stringify({format:'joined-fix1-evidence-v1',entries},null,2)+'\n',{flag:'wx'});
for(const row of entries)assert.equal(sha(await readFile(join(here,row.file))),row.gzipSha256);
console.log(JSON.stringify({files:entries.length,compressedBytes:entries.reduce((n,e)=>n+e.gzipBytes,0),pins},null,2));
