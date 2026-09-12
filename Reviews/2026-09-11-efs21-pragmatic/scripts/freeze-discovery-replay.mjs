import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const replay=JSON.parse(readFileSync(root+'contracts/test/fixtures/native-replay-4cb0042.json'));
const sources=structuredClone(replay.sources);
for(const path of ['test/TestBase.sol','test/Discovery.t.sol']){
 const r=spawnSync('git',['show',replay.sourceCommit+':Reviews/2026-09-11-efs21-pragmatic/contracts/'+path],{cwd:root,encoding:'utf8'});assert.equal(r.status,0);sources[path]={content:r.stdout};
}
const {compilationTarget,...settings}=replay.artifacts.NativeKernel.metadata.settings;settings.outputSelection={'*':{'*':['abi','evm.bytecode','evm.deployedBytecode','metadata']}};
const r=spawnSync(process.env.EFS21_SOLC??`${process.env.HOME}/Library/Application Support/svm/0.8.30/solc-0.8.30`,['--standard-json'],{input:JSON.stringify({language:'Solidity',sources,settings}),encoding:'utf8',timeout:120000,maxBuffer:32*1024**2});assert.equal(r.status,0,r.stderr);const out=JSON.parse(r.stdout);assert(!(out.errors??[]).some(e=>e.severity==='error'),JSON.stringify(out.errors));
assert.equal('0x'+out.contracts['src/NativeKernel.sol'].NativeKernel.evm.bytecode.object,replay.artifacts.NativeKernel.bytecode.object);
const artifacts=Object.fromEntries(['DiscoveryFaultDriver','FaultDiscovery'].map(name=>{const a=out.contracts['test/Discovery.t.sol'][name];return[name,{abi:a.abi,bytecode:{...a.evm.bytecode,object:'0x'+a.evm.bytecode.object},deployedBytecode:{...a.evm.deployedBytecode,object:'0x'+a.evm.deployedBytecode.object},metadata:JSON.parse(a.metadata)}];}));
const destination=root+'contracts/test/fixtures/discovery-replay-4cb0042.json';assert(!existsSync(destination));writeFileSync(destination,JSON.stringify({sourceCommit:replay.sourceCommit,artifacts},null,2)+'\n',{flag:'wx'});console.log(E.keccak256(readFileSync(destination)));
