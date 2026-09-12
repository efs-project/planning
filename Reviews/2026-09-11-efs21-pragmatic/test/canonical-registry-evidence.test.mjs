// Offline replay only; no compiler, RPC, world, or writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {parseGroup} from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
import {verifyCache} from '../../2026-09-05-c0-admission/reader.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const evidencePath=process.env.EFS21_CANONICAL_EVIDENCE??root+'evidence/canonical-registry-task1.json';
const r=JSON.parse(readFileSync(evidencePath));
const packed=readFileSync(resolve(dirname(evidencePath),r.codeInventory.file));
const c=JSON.parse(gunzipSync(packed));
const golden=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-types-golden.json'));
const supplement=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-types-supplement.json'));
const helper=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-preparation-helper.json'));
const ri=new E.Interface(c.registryArtifact.abi);
test('frozen direct-registry evidence pins exact sources and actual helper/registry runtime, with bounded code inventory',()=>{
 assert.match(r.sourceCommit,/^[0-9a-f]{40}$/);
 const approved='a5937cf172439a596eb677e541bc230ae92942ad';
 assert.equal(spawnSync('git',['merge-base','--is-ancestor',approved,r.sourceCommit],{cwd:root}).status,0);
 const unchanged=spawnSync('git',['diff','--exit-code',approved,r.sourceCommit,'--','contracts/src','../2026-09-05-c0-core/src','../2026-09-05-c0-admission/src'],{cwd:root});
 assert.equal(unchanged.status,0,'support-only follow-up to reviewed registry/helper executables');
 assert.equal(r.sourceStatus,'');assert.equal(r.evidenceClass,'frozen-direct-registry');assert.equal(c.sourceCommit,r.sourceCommit);
 assert.equal(E.keccak256(packed),r.codeInventory.keccak256);
 assert.equal(packed.length,r.codeInventory.compressedBytes);assert.equal(gunzipSync(packed).length,r.codeInventory.uncompressedBytes);
 assert(packed.length<4*1024*1024);assert(r.codeInventory.uncompressedBytes<16*1024*1024);
 for(const [path,pin]of Object.entries(r.sourceManifest)){
  const result=spawnSync('git',['show',r.sourceCommit+':'+path],{cwd:root,maxBuffer:2*1024*1024});assert.equal(result.status,0);
  assert.equal(E.keccak256(result.stdout),pin.keccak256,path);
 }
 assert.equal(r.helperArtifactHash,E.keccak256(readFileSync(root+'contracts/test/fixtures/canonical-preparation-helper.json')));
 assert.deepEqual(r.compilerOutput,helper.compilerOutput);
 const complete=readFileSync(root+'contracts/test/fixtures/'+helper.compilerOutput.file);
 assert.equal(E.keccak256(complete),helper.compilerOutput.keccak256);
 assert.equal(Object.keys(JSON.parse(gunzipSync(complete)).sources).length,6);
 assert.equal(c.deployments[0].code,helper.deployedBytecode.object);
 let expected=c.registryArtifact.deployedBytecode.object;
 for(const refs of Object.values(c.registryArtifact.deployedBytecode.immutableReferences))for(const p of refs){assert.equal(p.length,32);const at=2+2*p.start;expected=expected.slice(0,at)+E.zeroPadValue(c.deployments[0].address,32).slice(2)+expected.slice(at+64);}
 assert.equal(c.deployments[1].code,expected);
 for(const d of c.deployments){assert.equal(E.keccak256(d.code),d.codehash);assert.equal(E.getBytes(d.code).length,d.runtimeBytes);assert(d.runtimeBytes<=24576&&d.initcodeBytes<=49152);}
 assert(r.cleanup.stopped&&r.cleanup.cacheRemoved&&r.cleanup.exitCode===0);
});
test('every direct signed transaction and receipt preserves ordinary caps and named success/refusal',()=>{
 assert.equal(r.transactions.length,90);
 for(const [i,row]of r.transactions.entries()){
  const tx=E.Transaction.from(row.signed);assert.equal(tx.hash,row.hash);assert.equal(tx.nonce,i);assert.equal(tx.chainId,31337n);
  assert.equal(tx.gasLimit,16777216n);assert.equal(tx.data,row.transaction.input);assert.equal(tx.from.toLowerCase(),row.transaction.from.toLowerCase());
  assert.equal(row.receipt.transactionHash,row.hash);assert.equal(row.receipt.blockHash,row.block.hash);
  assert.equal(row.block.number,row.receipt.blockNumber);assert.equal(BigInt(row.block.gasLimit),16777216n);assert(BigInt(row.receipt.gasUsed)<=16777216n);
  if(i<2){assert.equal(row.receipt.status,'0x1');assert.equal(E.getCreateAddress({from:tx.from,nonce:tx.nonce}).toLowerCase(),row.receipt.contractAddress);assert.equal(E.keccak256(tx.data),r.deployments[i].creationHash);continue;}
  assert.equal(tx.to.toLowerCase(),r.deployments[1].address);const parsed=ri.parseTransaction({data:tx.data});assert(parsed);
  let success=true;
  if(row.label.startsWith('validate-')){const item=r.validations.find(v=>'validate-'+v.name===row.label);assert(item);assert.equal(parsed.args[0],item.typeId);assert.equal(parsed.args[1],item.body);success=item.valid;}
  if(row.label.startsWith('supplement-validate-')){const item=r.supplement.validations.find(v=>'supplement-validate-'+v.name===row.label);assert(item);assert.equal(parsed.args[0],item.typeId);assert.equal(parsed.args[1],item.body);success=item.valid;}
  if(row.label.startsWith('refuse-')||row.label.startsWith('supplement-refuse-')||row.label==='second-create-collision')success=false;
  assert.equal(row.receipt.status,success?'0x1':'0x0',row.label);
 }
 const p=r.rollback;assert.equal(p.first,E.getCreateAddress({from:r.deployments[0].address,nonce:BigInt(p.helperNonce)}));
 assert.equal(p.second,E.getCreateAddress({from:r.deployments[0].address,nonce:BigInt(p.helperNonce)+1n}));
 assert.equal(p.firstCodeAfter,'0x');assert.equal(p.secondCodeAfter,p.injectedCode);assert(p.registryGroupAndTypesAbsent);
});
test('retained actual caches match independent declaration oracle and exact canonical identities; refusals remain qualified',()=>{
 assert.equal(c.groups.length,10);assert.equal(r.validations.length,30);
 for(const g of c.groups){
  const expected=golden.groups[g.name];assert.equal(g.raw,expected.raw);assert.deepEqual(g.ids,expected.ids);assert.equal(g.groupId,expected.groupHash);
  const parsed=parseGroup(E.getBytes(g.raw));
  for(let i=0;i<g.ids.length;i++){
   const bytes=g.compiled[2][i][1];verifyCache({ordinal:1,cacheBytes:bytes},parsed.members[i],g.ids[i],g.ids,Buffer.from(expected.blobs[i].slice(2),'hex'));
   const info=g.infos[i];assert.equal(info[0],g.groupId);assert.equal(Number(info[1]),i);assert.equal(info[2],E.keccak256(expected.blobs[i]));
   assert.equal(Number(info[4]),E.getBytes(bytes).length);assert.equal(info[5],E.keccak256(bytes));assert.equal(g.codes[i].code,'0x00'+bytes.slice(2));
  }
 }
 for(const v of r.validations){const expected=golden.outcomes.find(x=>x.name===v.name);assert(expected);assert.equal(v.body,expected.body);assert.equal(v.valid,expected.valid);if(!v.valid)assert.equal(v.actualError,E.concat([E.id('InvalidBody(uint16)').slice(0,10),E.zeroPadValue(E.toBeHex(expected.error),32)]));}
 assert.equal(r.groups.filter(x=>x.refused).length,12);
 assert.equal(r.groups.find(x=>x.name==='boundary').error,E.id('HelperDeploy()').slice(0,10));
 assert.equal(r.groups.find(x=>x.name==='aggregate').error,'0x','ordinary helper resource refusal, not observed oversized return');
});
test('supplemental actual compiler/cache/body paths retain exact parser errors and atomic refusal observations',()=>{
 assert.equal(c.supplement.groups.length,16);assert.equal(r.supplement.validations.length,15);
 for(const g of c.supplement.groups){
  const expected=supplement.groups.find(x=>x.name===g.name);assert(expected);assert.equal(g.raw,expected.raw);assert.deepEqual(g.ids,expected.ids);assert.equal(g.valid,expected.valid);
  if(!g.valid){
   assert.equal(g.helperError,E.id('InvalidSchema()').slice(0,10));assert.equal(g.registryError,g.helperError);
   assert.equal(g.helperNonceBefore,g.helperNonceAfter);assert.equal(g.codeBefore,g.codeAfter);assert(g.groupAndTypesAbsent);continue;
  }
  const cache=g.compiled[2][0][1];verifyCache({ordinal:1,cacheBytes:cache},parseGroup(E.getBytes(g.raw)).members[0],g.ids[0],g.ids,Buffer.from(g.blobs[0].slice(2),'hex'));
  assert.equal(g.codes[0].code,'0x00'+cache.slice(2));assert.equal(g.infos[0][5],E.keccak256(cache));
 }
 for(const v of r.supplement.validations){
  const expected=supplement.outcomes.find(x=>x.name===v.name);assert(expected);assert.equal(v.body,expected.body);assert.equal(v.valid,expected.valid);assert.equal(v.recordId,expected.recordId);
  const error=expected.valid?null:E.concat([E.id('InvalidBody(uint16)').slice(0,10),E.zeroPadValue(E.toBeHex(expected.error),32)]);
  assert.equal(v.helperError,error);assert.equal(v.registryError,error);
 }
});
