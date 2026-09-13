// Compile only ABI/method identifiers for the exact baseline, with the known
// invalid numeric NatSpec tags normalized in comments. No baseline bytecode claim.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
const run='/tmp/efs-c-readiness-build-20260913.NoPDle';
const repo='/Users/james/Code/EFS/planning-warroom-c-run';
const base='9a4e7667e285f1da865da559bf767ce664ec0fda';
const prefix='Reviews/2026-09-12-efs-path-decision/lab-c/';
const file='test/MeasurementConsumer.sol', contract='MeasurementConsumer';
const solc='/Users/james/Library/Application Support/svm/0.8.30/solc-0.8.30';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8',maxBuffer:8e6});
const paths=git(['ls-tree','-r','--name-only',base,'--',prefix]).trim().split('\n').filter(p=>p.endsWith('.sol'));
const sources={}; let normalized;
for(const p of paths){const key=p.slice(prefix.length),raw=git(['show',`${base}:${p}`]);let content=raw;
  if(key===file){content=raw.split('\n').map(line=>line.trimStart().startsWith('///')?line.replace(/@(\d+)/g,'offset $1'):line).join('\n');assert.notEqual(content,raw); normalized={beforeSha256:sha(raw),afterSha256:sha(content)};}
  sources[key]={content};
}
const input={language:'Solidity',sources,settings:{remappings:['@latticexyz/=vendor/@latticexyz/'],optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'cancun',metadata:{bytecodeHash:'none',appendCBOR:false},outputSelection:{[file]:{[contract]:['abi','evm.methodIdentifiers']}}}};
const reuse=process.argv.includes('--reuse-retained-compile');
if(reuse) assert.deepEqual(JSON.parse(readFileSync(`${run}/baseline-abi-input.json`)),input);
else writeFileSync(`${run}/baseline-abi-input.json`,JSON.stringify(input),{flag:'wx'});
const stdout=reuse?readFileSync(`${run}/baseline-abi-output.json`,'utf8'):execFileSync(solc,['--standard-json'],{input:JSON.stringify(input),encoding:'utf8',timeout:90000,maxBuffer:8e6});
if(!reuse) writeFileSync(`${run}/baseline-abi-output.json`,stdout,{flag:'wx'});
const output=JSON.parse(stdout);assert.equal((output.errors??[]).filter(e=>e.severity==='error').length,0,JSON.stringify(output.errors));
const prior=output.contracts[file][contract],current=JSON.parse(readFileSync(`${run}/out/MeasurementConsumer.sol/MeasurementConsumer.json`));
// Forge groups ABI entries differently from raw solc. Top-level entry order is
// not an ABI contract; all nested inputs/outputs/tuple arrays retain their order.
const entryKey=x=>`${x.type}:${x.name}:${JSON.stringify(x.inputs?.map(y=>y.type))}`;
const ordered=abi=>[...abi].sort((a,b)=>entryKey(a).localeCompare(entryKey(b)));
assert.equal(isDeepStrictEqual(ordered(current.abi),ordered(prior.abi)),true,'compiled public ABI changed');
assert.deepEqual(current.methodIdentifiers,prior.evm.methodIdentifiers,'compiled method identifiers changed');
const result={base,normalization:'numeric NatSpec tags in comments only; ABI top-level entry ordering only',normalized,sources:paths.length,abiEntries:prior.abi.length,methods:Object.keys(prior.evm.methodIdentifiers).length,compiledAbiEqual:true,compiledMethodIdentifiersEqual:true,baselineBytecodeBuilt:false,warnings:(output.errors??[]).map(e=>({code:e.errorCode,severity:e.severity,message:e.message}))};
writeFileSync(`${run}/baseline-abi-check.json`,`${JSON.stringify(result,null,2)}\n`,{flag:'wx'});console.log(JSON.stringify(result,null,2));
