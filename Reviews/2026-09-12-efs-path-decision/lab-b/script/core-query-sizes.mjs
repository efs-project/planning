import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {loadEthers} from './compact-environment.mjs';
const e=await loadEthers(),lab=resolve(new URL('../',import.meta.url).pathname),out=process.env.FOUNDRY_OUT;
assert(out,'explicit assigned artifact directory');
const targets=[['Ledger.sol','Ledger',64],['PublicationSupport.sol','PublicationSupport',0],['IndexModule.sol','IndexModule',32],
  ['ProfiledFilesIndex.sol','ProfiledFilesIndex',608],['FilesLiveIndex.sol','FilesLiveNamesIndex',224],['FilesScopeState.sol','FilesScopeState',32],
  ['LensReader.sol','LensReader',64],['FilesLiveIndex.sol','FilesLiveLens',64],['FilesRetainedLens.sol','FilesRetainedLens',64],
  ['FilesPageReader.sol','FilesPageReader',96],['FilesQueryAccumulator.sol','FilesQueryAccumulator',null]];
const artifacts=[],sources={};
for(const [file,name,args] of targets){
  const a=JSON.parse(await readFile(join(out,file,`${name}.json`))),settings=a.metadata.settings;
  assert.equal(a.metadata.compiler.version,'0.8.30+commit.73712a01');assert(settings.optimizer.enabled);assert.equal(settings.optimizer.runs,200);assert.equal(settings.viaIR,true);assert.equal(settings.evmVersion,'cancun');
  for(const [path,meta] of Object.entries(a.metadata.sources)){
    const contents=await readFile(join(lab,path));assert.equal(e.keccak256(contents),meta.keccak256,`${name} stale compiled source ${path}`);
    sources[path]=createHash('sha256').update(contents).digest('hex');
  }
  const runtimeBytes=e.getBytes(a.deployedBytecode.object).length,creationBytes=e.getBytes(a.bytecode.object).length;
  const initcodeBytes=args===null?null:creationBytes+args;
  assert(runtimeBytes<=24576,`${name} runtime cap`);if(initcodeBytes!==null)assert(initcodeBytes<=49152,`${name} actual initcode cap`);
  artifacts.push({name,runtimeBytes,creationBytes,constructorArgumentBytes:args,initcodeBytes,runtimeMargin:24576-runtimeBytes,initcodeMargin:initcodeBytes===null?null:49152-initcodeBytes,
    creationSha256:createHash('sha256').update(e.getBytes(a.bytecode.object)).digest('hex'),runtimeTemplateSha256:createHash('sha256').update(e.getBytes(a.deployedBytecode.object)).digest('hex'),
    note:args===null?'Dynamic constructor calldata measured exactly in paid deployment receipts; not creation bytecode alone.':undefined});
}
const output=new URL('../core-closeout-query-20260915/',import.meta.url);await mkdir(output,{recursive:true});
await writeFile(new URL('sizes-and-sources.json',output),JSON.stringify({compiler:'0.8.30+commit.73712a01',optimizer:200,viaIR:true,evm:'cancun',artifacts,sources},null,2)+'\n');
console.log(JSON.stringify(artifacts,null,2));
