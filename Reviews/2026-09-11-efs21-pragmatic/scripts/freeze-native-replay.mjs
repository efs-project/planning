// Generated historical artifacts retain original source keys and exact compiler settings.
// Renamed Solidity fixtures are only historical assertion replay, never runtime evidence.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const commit='4cb004273982411d4699fa15d388750638cd1358';
const git=args=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout;};
const prefix='Reviews/2026-09-11-efs21-pragmatic/contracts/';
const paths=git(['ls-tree','-r','--full-tree','--name-only',commit,'--',prefix+'src',prefix+'test/fixtures/RecordProducer.sol']).trim().split('\n');
assert(paths.length>1&&paths.every(p=>p.startsWith(prefix)&&p.endsWith('.sol')),'full source tree resolved');
const sources=Object.fromEntries(paths.map(p=>[p.slice(prefix.length),{content:git(['show',commit+':'+p])}]));
const frozen=JSON.parse(readFileSync(root+'contracts/test/fixtures/native-kernel-4cb0042.json'));
const {compilationTarget,...settings}=frozen.metadata.settings;
settings.outputSelection={'*':{'*':['abi','evm.bytecode','evm.deployedBytecode','metadata'],'':['ast']}};
const compiler=process.env.EFS21_SOLC??`${process.env.HOME}/Library/Application Support/svm/0.8.30/solc-0.8.30`;
const r=spawnSync(compiler,['--standard-json'],{input:JSON.stringify({language:'Solidity',sources,settings}),encoding:'utf8',timeout:120000,maxBuffer:32*1024**2});
assert.equal(r.status,0,r.stderr);const out=JSON.parse(r.stdout);assert(!(out.errors??[]).some(e=>e.severity==='error'),JSON.stringify(out.errors));
const symbols=new Set(),names={};
for(const s of Object.values(out.sources))for(const c of s.ast.nodes.filter(n=>n.nodeType==='ContractDefinition')){symbols.add(c.name);for(const n of c.nodes)if(n.mutability==='immutable')names[n.id]=n.name;}
const artifacts={};
for(const [path,contracts]of Object.entries(out.contracts))for(const [name,a]of Object.entries(contracts))if(a.evm.bytecode.object){
 artifacts[name]={abi:a.abi,bytecode:{...a.evm.bytecode,object:'0x'+a.evm.bytecode.object},deployedBytecode:{...a.evm.deployedBytecode,object:'0x'+a.evm.deployedBytecode.object},metadata:JSON.parse(a.metadata),sourceCommit:commit,sourcePath:path,immutableNames:Object.fromEntries(Object.entries(a.evm.deployedBytecode.immutableReferences??{}).map(([id,refs])=>[names[id],refs]))};
}
assert.equal(artifacts.NativeKernel.bytecode.object,frozen.bytecode.object,'exact frozen kernel constructor');
const destination=root+'contracts/test/fixtures/native-replay-4cb0042.json';assert(!existsSync(destination),'exclusive frozen artifacts');
writeFileSync(destination,JSON.stringify({sourceCommit:commit,artifacts,sources},null,2)+'\n',{flag:'wx'});
const dir=root+'contracts/test/fixtures/legacy4cb/';mkdirSync(dir,{recursive:true});
const pattern=new RegExp('\\b('+[...symbols].sort((a,b)=>b.length-a.length).join('|')+')\\b','g');
for(const [path,{content}]of Object.entries(sources))if(path.startsWith('src/')){
 const name=path.slice(4);const transformed=content.replace(pattern,s=>'Legacy'+s).replace(/"\.\/([^"/]+)\.sol"/g,(_,n)=>'"./'+(n.startsWith('Legacy')?n:'Legacy'+n)+'.sol"');
 writeFileSync(dir+'Legacy'+name,transformed,{flag:'wx'});
}
console.log(JSON.stringify({sourceCommit:commit,contracts:Object.keys(artifacts),artifactHash:E.keccak256(readFileSync(destination)),legacyFixtures:'renamed historical assertion replay only'}));
