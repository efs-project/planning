// Standalone acyclic six-source compiler closure, not the native Foundry artifact.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const ref='ebc7d540570827c5f5052af83d2cbd80f54092a7';
const names=['PreparationHelper','Preparation','RecordBody','BindingFold','IndexKeys'];
const paths=Object.fromEntries(names.map(n=>['C0Core/'+n+'.sol','Reviews/2026-09-05-c0-core/src/'+n+'.sol']));
paths['C0Admission/TypeGroupParser.sol']='Reviews/2026-09-05-c0-admission/src/TypeGroupParser.sol';
const sources={},sourceManifest={};
for(const [key,path]of Object.entries(paths)){
 const local=readFileSync(root+'../../'+path,'utf8');
 const git=spawnSync('git',['show',ref+':'+path],{cwd:root,encoding:'utf8'});
 assert.equal(git.status,0);assert.equal(local,git.stdout,'exact reviewed helper source '+path);
 sources[key]={content:local};sourceManifest[key]={path,reference:ref,keccak256:E.keccak256(E.toUtf8Bytes(local))};
}
const settings={optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'cancun',remappings:[],metadata:{bytecodeHash:'ipfs',appendCBOR:true,useLiteralContent:false},outputSelection:{'*':{'*':['abi','metadata','evm.bytecode','evm.deployedBytecode','evm.methodIdentifiers'],'':['ast']}}};
const input={language:'Solidity',sources,settings};
const solc=process.env.EFS21_SOLC??`${process.env.HOME}/Library/Application Support/svm/0.8.30/solc-0.8.30`;
const version=spawnSync(solc,['--version'],{encoding:'utf8'});assert.equal(version.status,0);assert.match(version.stdout,/0\.8\.30\+commit\.73712a01/);
const r=spawnSync(solc,['--standard-json'],{input:JSON.stringify(input),encoding:'utf8',timeout:120000,maxBuffer:32*1024*1024});assert.equal(r.status,0,r.stderr);
const out=JSON.parse(r.stdout);assert(!(out.errors??[]).some(e=>e.severity==='error'),JSON.stringify(out.errors));
const a=out.contracts['C0Core/PreparationHelper.sol'].PreparationHelper;
const bytecode={...a.evm.bytecode,object:'0x'+a.evm.bytecode.object},deployedBytecode={...a.evm.deployedBytecode,object:'0x'+a.evm.deployedBytecode.object};
const runtimeHash=E.keccak256(deployedBytecode.object);
const outputText=JSON.stringify(out);assert(Buffer.byteLength(outputText)<16*1024*1024,'bounded complete compiler output');
const outputGzip=gzipSync(outputText);assert(outputGzip.length<4*1024*1024);
const compilerOutput={file:'canonical-preparation-output.json.gz',keccak256:E.keccak256(outputGzip),uncompressedBytes:Buffer.byteLength(outputText),compressedBytes:outputGzip.length};
const artifact={format:'efs21-canonical-preparation-helper/1',sourceManifest,compiler:'0.8.30+commit.73712a01',input,compilerOutput,abi:a.abi,metadata:JSON.parse(a.metadata),bytecode,deployedBytecode,methodIdentifiers:a.evm.methodIdentifiers,creationHash:E.keccak256(bytecode.object),runtimeHash};
const files={
 [root+'contracts/test/fixtures/canonical-preparation-helper.json']:JSON.stringify(artifact,null,2)+'\n',
 [root+'contracts/src/CanonicalHelperIdentity.sol']:'// SPDX-License-Identifier: MIT\npragma solidity 0.8.30;\n// Generated from the exact standalone six-file compiler input; no helper code embedded.\nlibrary CanonicalHelperIdentity {\n    bytes32 internal constant EXPECTED_RUNTIME_HASH = '+runtimeHash+';\n}\n'
};
for(const [p,value]of Object.entries(files)){if(process.argv.includes('--check'))assert.equal(readFileSync(p,'utf8'),value,p);else writeFileSync(p,value);}
const outputPath=root+'contracts/test/fixtures/'+compilerOutput.file;
if(process.argv.includes('--check'))assert.deepEqual(readFileSync(outputPath),outputGzip);else writeFileSync(outputPath,outputGzip);
console.log(JSON.stringify({runtimeHash,creationHash:artifact.creationHash,runtimeBytes:E.getBytes(deployedBytecode.object).length,initcodeBytes:E.getBytes(bytecode.object).length,inputHash:E.keccak256(E.toUtf8Bytes(JSON.stringify(input)))}));
