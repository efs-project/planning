// Authenticate retained full-C0 helper artifact against its reviewed signed deployment.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const target=root+'contracts/test/fixtures/canonical-reference-helper.json';
const ref='ebc7d540570827c5f5052af83d2cbd80f54092a7';
const evidencePath='Reviews/2026-09-11-efs21-pragmatic/evidence/body-copy-candidate.json.gz';
const r=spawnSync('git',['show',ref+':'+evidencePath],{cwd:root,maxBuffer:16*1024*1024});assert.equal(r.status,0);
const evidence=JSON.parse(gunzipSync(r.stdout));
const old=process.argv.includes('--check')?JSON.parse(readFileSync(target)).artifact:JSON.parse(readFileSync(process.argv[2]));
const current=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-preparation-helper.json'));
const tx=evidence.transactions.find(t=>t.label==='PreparationHelper');assert(tx);
assert.equal(old.bytecode.object,tx.transaction.input);
assert.equal(E.keccak256(old.deployedBytecode.object),evidence.runtimes.PreparationHelper.hash);
const signed=E.Transaction.from(tx.raw);assert.equal(signed.hash,tx.hash);assert.equal(signed.data,old.bytecode.object);
assert.deepEqual(Object.values(old.metadata.sources).map(x=>x.keccak256).sort(),Object.values(current.metadata.sources).map(x=>x.keccak256).sort());
assert.equal(old.metadata.compiler.version,current.metadata.compiler.version);
assert.deepEqual(old.metadata.settings.optimizer,current.metadata.settings.optimizer);
assert.equal(old.metadata.settings.evmVersion,current.metadata.settings.evmVersion);
assert.equal(old.metadata.settings.viaIR,current.metadata.settings.viaIR);
function prefix(code){const b=E.getBytes(code),n=b[b.length-2]*256+b[b.length-1];assert(n>0&&n+2<b.length);return {bytes:b.length,cborBytes:n,prefix:E.hexlify(b.slice(0,b.length-n-2))};}
for(const key of ['bytecode','deployedBytecode'])assert.deepEqual(prefix(old[key].object),prefix(current[key].object),'exact executable/constructor prefix, lengths and encoded CBOR boundaries');
const output={format:'efs21-canonical-helper-reference/1',referenceCommit:ref,evidencePath,evidenceHash:E.keccak256(r.stdout),transaction:tx,artifact:old,comparison:{sourceContentsEqual:true,creationAndRuntimePrefixesEqual:true,metadataDifference:'Standalone virtual source keys and empty remappings replace full foundation source keys/remappings; compiler settings and six source contents match.',standaloneRuntimeHash:current.runtimeHash,referenceRuntimeHash:evidence.runtimes.PreparationHelper.hash}};
const encoded=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(readFileSync(target,'utf8'),encoded);else{assert(!existsSync(target));writeFileSync(target,encoded,{flag:'wx'});}
console.log(JSON.stringify(output.comparison));
