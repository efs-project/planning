// Generate source-backed runtime templates, never from caller-supplied deployment code.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {SOURCE_GRAPHS as PREVIOUS_GRAPHS} from '../sdk/source-graphs.mjs';
import {CACHE,verifyCache} from '../../2026-09-05-c0-admission/reader.mjs';
import {parseGroup} from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const solc=process.env.EFS21_SOLC??`${process.env.HOME}/Library/Application Support/svm/0.8.30/solc-0.8.30`;
const choices={current:null,'baseline-7db38cd':'7db38cd','forced-code':'7db38cd-forced-code','forced-words':'7db38cd-forced-words','baseline-f43501a':'f43501a','baseline-58e61c4':'58e61c4','baseline-aa6b1b6':'aa6b1b6','baseline-bf566dc':'bf566dc','baseline-c088363':'c088363','integrity-c088363':'c088363-read-integrity'};
const catalogs={};
choices.current='retained-current';
choices['baseline-4cb0042']='4cb0042';
choices['canonical-ref-free-v1']=null;
for(const [selection,fixture] of Object.entries(choices)){
  if(selection==='current'){catalogs.current=PREVIOUS_GRAPHS.current;continue;}
  const frozenPath=root+`contracts/test/fixtures/source-graph-${fixture}.json`;
  if(fixture&&existsSync(frozenPath)){catalogs[selection]=JSON.parse(readFileSync(frozenPath));continue;}
  const kernel=JSON.parse(readFileSync(root+(fixture?`contracts/test/fixtures/native-kernel-${fixture}.json`:'contracts/out/NativeKernel.sol/NativeKernel.json')));
  const sources={};
  const pins={...kernel.metadata.sources};
  if(selection==='canonical-ref-free-v1')for(const [file,name]of [['Examples','QuoteProducer'],['Examples','QuoteReader'],['Examples','PlainQuoteMapping'],['CanonicalPayloadConsumer','CanonicalPayloadConsumer'],['BodyReadConsumer','BodyReadConsumer']])Object.assign(pins,JSON.parse(readFileSync(root+`contracts/out/${file}.sol/${name}.json`)).metadata.sources);
  for(const [path,pin] of Object.entries(pins)){
    let content;
    if(fixture){
      const r=spawnSync('git',['show',`${kernel.sourceCommit}:Reviews/2026-09-11-efs21-pragmatic/contracts/${path}`],{cwd:root,encoding:'utf8'});
      assert.equal(r.status,0,r.stderr);content=r.stdout;
      for(const d of kernel.sourceDelta??[])if(d.path===path){assert.equal(content.split(d.before).length,2);content=content.replace(d.before,d.after);}
    }else content=readFileSync(root+'contracts/'+path,'utf8');
    assert.equal(E.keccak256(E.toUtf8Bytes(content)),pin.keccak256,path);
    sources[path]={content};
  }
  const {compilationTarget,...settings}=kernel.metadata.settings;
  settings.outputSelection={'*':{'*':['abi','evm.deployedBytecode','evm.bytecode','metadata'],'':['ast']}};
  const r=spawnSync(solc,['--standard-json'],{input:JSON.stringify({language:'Solidity',sources,settings}),encoding:'utf8',timeout:120000,maxBuffer:32*1024*1024});
  assert.equal(r.status,0,r.stderr);const output=JSON.parse(r.stdout);
  assert(!(output.errors??[]).some(e=>e.severity==='error'),JSON.stringify(output.errors));
  const [targetPath,targetName]=Object.entries(compilationTarget)[0];
  assert.equal('0x'+output.contracts[targetPath][targetName].evm.bytecode.object,kernel.bytecode.object,'exact selected constructor reproduced');
  const immutableNames={};
  for(const source of Object.values(output.sources))for(const c of source.ast.nodes.filter(n=>n.nodeType==='ContractDefinition'))for(const n of c.nodes)if(n.mutability==='immutable')immutableNames[n.id]=n.name;
  const templates={};
  for(const [path,contracts] of Object.entries(output.contracts))for(const [name,a] of Object.entries(contracts)){
    if(!a.evm.deployedBytecode.object)continue;
    const refs=a.evm.deployedBytecode.immutableReferences??{};
    templates[name]={runtime:'0x'+a.evm.deployedBytecode.object,immutables:Object.fromEntries(Object.entries(refs).map(([id,locations])=>{assert(immutableNames[id],id);return [immutableNames[id],locations]}))};
  }
  const profile={selection,split:selection==='canonical-ref-free-v1'||selection==='baseline-4cb0042',targetName,compiler:kernel.metadata.compiler,settings:kernel.metadata.settings,sources:pins,...(fixture?{sourceCommit:kernel.sourceCommit,sourceDelta:kernel.sourceDelta??[]}:{}),templates};
  if(selection==='canonical-ref-free-v1'){
    const helper=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-preparation-helper.json'));
    for(const pin of Object.values(helper.sourceManifest))assert.equal(E.keccak256(readFileSync(resolve(root,'../..',pin.path))),pin.keccak256);
    assert.equal(E.keccak256(readFileSync(root+'contracts/test/fixtures/'+helper.compilerOutput.file)),helper.compilerOutput.keccak256);
    assert.equal(E.keccak256(helper.deployedBytecode.object),helper.runtimeHash);
    templates.PreparationHelper={runtime:helper.deployedBytecode.object,immutables:{}};
    profile.helper={compiler:helper.compiler,metadata:helper.metadata,input:helper.input,sourceManifest:helper.sourceManifest,compilerOutput:helper.compilerOutput,runtimeHash:helper.runtimeHash};
    const d=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-types-golden.json')).groups.defaults;
    const parsed=parseGroup(E.getBytes(d.raw));
    const cacheFields=[[2,0,32,32,0,0,'0x000576616c75650220'],[5,0,4094,4096,0,1,'0x00077061796c6f6164050ffe']];
    const caches=d.ids.map((id,i)=>{
      const bytes=E.AbiCoder.defaultAbiCoder().encode([CACHE],[[id,E.keccak256(d.blobs[i]),i===0?32:4096,[cacheFields[i]],[],[],[]]]);
      verifyCache({ordinal:1,cacheBytes:bytes},parsed.members[i],id,d.ids,Buffer.from(d.blobs[i].slice(2),'hex'));
      return {typeId:id,blobHash:E.keccak256(d.blobs[i]),bytes,hash:E.keccak256(bytes),length:E.getBytes(bytes).length};
    });
    profile.canonical={representation:'canonical-u16-bytes',payloadLimit:4094,bodyLimit:4096,recordDomain:'efs2/record/1',referenceFree:true,declaredIndexes:false,defaultGroup:{...d,caches},registryAbi:output.contracts['src/CanonicalTypeRegistry.sol'].CanonicalTypeRegistry.abi};
    profile.filesAbi=kernel.abi;
    profile.errorAbi=[...new Map(Object.values(output.contracts).flatMap(cs=>Object.values(cs).flatMap(a=>a.abi.filter(f=>f.type==='error'))).concat(helper.abi.filter(f=>f.type==='error')).map(f=>[JSON.stringify(f),f])).values()];
  }
  profile.id=E.keccak256(E.toUtf8Bytes(JSON.stringify(profile)));
  if(fixture)writeFileSync(frozenPath,JSON.stringify(profile,null,2)+'\n');
  catalogs[selection]=profile;
  console.log(`${selection}: exact constructor and ${Object.keys(templates).length} source-backed templates`);
}
writeFileSync(root+'sdk/source-graphs.mjs','// Generated by scripts/compile-graphs.mjs from exact source/compiler pins.\nexport const SOURCE_GRAPHS = '+JSON.stringify(catalogs)+';\n');
