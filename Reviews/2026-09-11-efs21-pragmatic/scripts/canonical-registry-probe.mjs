// Task1: direct registry/helper only. No Files/world/SDK identity claims.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:net';
import {gzipSync} from 'node:zlib';
import {basename,relative,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {withManagedAnvil} from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import {verifyCache} from '../../2026-09-05-c0-admission/reader.mjs';
import {parseGroup} from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const vault=resolve(root,'../..');
const abi=E.AbiCoder.defaultAbiCoder(),GAS=16777216n;
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?v.toString():v));
async function port(){const s=createServer();await new Promise(ok=>s.listen(0,'127.0.0.1',ok));const p=s.address().port;await new Promise(ok=>s.close(ok));return p;}
function git(args){const r=spawnSync('git',args,{cwd:vault,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
export function assertFinalSource(expected){
 assert.match(expected,/^[0-9a-f]{40}$/,'full source freeze required');
 assert.equal(git(['rev-parse','HEAD']),expected,'source freeze must be current HEAD');
 // Whole tracked and untracked vault scope, including upstream helper inputs.
 assert.equal(git(['status','--porcelain','--untracked-files=all']),'','final evidence requires clean source/support');
}
export async function probe({small=false,finalSource=null}={}){
 if(finalSource)assertFinalSource(finalSource);
 const helperArtifact=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-preparation-helper.json'));
 const registryArtifact=JSON.parse(readFileSync(root+'contracts/out/CanonicalTypeRegistry.sol/CanonicalTypeRegistry.json'));
 const golden=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-types-golden.json'));
 const source=git(['rev-parse','HEAD']);
 const sourceStatus=git(['status','--porcelain','--untracked-files=all']);
 const sourceManifest={};
 for(const [key,value]of Object.entries(registryArtifact.metadata.sources)){
  const path=resolve(root,'contracts',key),hash=E.keccak256(readFileSync(path));
  assert.equal(hash,value.keccak256,'registry artifact source freshness '+key);
  sourceManifest[relative(vault,path)]={keccak256:hash};
 }
 for(const value of Object.values(helperArtifact.sourceManifest)){
  assert.equal(E.keccak256(readFileSync(resolve(vault,value.path))),value.keccak256,'standalone source freshness '+value.path);
  sourceManifest[value.path]={keccak256:value.keccak256};
 }
 assert.equal(helperArtifact.runtimeHash,E.keccak256(helperArtifact.deployedBytecode.object));
 const p=await port();
 return withManagedAnvil(['--host','127.0.0.1','--port',String(p),'--chain-id','31337','--hardfork','cancun','--gas-limit',String(GAS),'--accounts','0','--silent'],async node=>{
  const endpoint=`http://127.0.0.1:${p}`;
  async function rpc(method,params=[]){const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(10000)});const j=await response.json();if(j.error){const e=Error(j.error.message);e.data=j.error.data;throw e;}return j.result;}
  let ready=false;for(let i=0;i<100&&!ready;i++){try{ready=await rpc('eth_chainId')==='0x7a69';}catch{}if(!ready)await new Promise(ok=>setTimeout(ok,50));}assert(ready);
  // Public synthetic local-only account; never supplied to a public RPC.
  const wallet=new E.Wallet(E.toBeHex(0xc001,32));await rpc('anvil_setBalance',[wallet.address,E.toBeHex(10n**22n)]);
  const report={format:'efs21-canonical-registry-task1/1',evidenceClass:finalSource?'frozen-direct-registry':'exploratory-direct-registry',sourceCommit:source,sourceStatus,sourceManifest,limits:{transactionGas:String(GAS),blockGas:String(GAS),runtime:24576,initcode:49152},transactions:[],groups:[],validations:[],deployments:[],cleanup:node.cleanup};
  const hi=new E.Interface(helperArtifact.abi),ri=new E.Interface(registryArtifact.abi);
  let nonce=0;
  async function send(label,to,data,status='0x1'){
   const tx={type:2,chainId:31337,nonce:nonce++,gasLimit:GAS,maxFeePerGas:2_000_000_000n,maxPriorityFeePerGas:1_000_000_000n,data,...(to?{to}:{})};
   const signed=await wallet.signTransaction(tx);const hash=await rpc('eth_sendRawTransaction',[signed]);
   let receipt;for(let i=0;i<200;i++){receipt=await rpc('eth_getTransactionReceipt',[hash]);if(receipt)break;await new Promise(ok=>setTimeout(ok,25));}
   assert(receipt,'bounded receipt '+label);assert.equal(receipt.status,status,label);
   const block=await rpc('eth_getBlockByHash',[receipt.blockHash,false]);
   report.transactions.push({label,signed,hash,transaction:await rpc('eth_getTransactionByHash',[hash]),receipt,block});
   return receipt;
  }
  async function call(iface,target,name,args,block='latest'){
   return iface.decodeFunctionResult(name,await rpc('eth_call',[{to:target,data:iface.encodeFunctionData(name,args),gas:E.toBeHex(GAS)},block]));
  }
  async function deploy(label,a,args=[]){
   const i=new E.Interface(a.abi),data=a.bytecode.object+i.encodeDeploy(args).slice(2);
   assert(E.getBytes(data).length<=49152,label+' initcode limit');
   const receipt=await send(label,null,data),address=receipt.contractAddress,code=await rpc('eth_getCode',[address,receipt.blockNumber]);
   assert(E.getBytes(code).length<=24576,label+' runtime limit');
   report.deployments.push({label,address,runtimeBytes:E.getBytes(code).length,initcodeBytes:E.getBytes(data).length,code,codehash:E.keccak256(code),creationHash:E.keccak256(data),gasUsed:receipt.gasUsed});
   return address;
  }
  const helper=await deploy('standalone-helper',helperArtifact);assert.equal(report.deployments[0].codehash,helperArtifact.runtimeHash);
  const registry=await deploy('canonical-registry',registryArtifact,[helper]);
  assert.equal((await call(ri,registry,'helper',[]))[0],E.getAddress(helper));
  // Authenticate actual compiler-emitted registry runtime including helper immutable.
  let expected=registryArtifact.deployedBytecode.object;
  for(const refs of Object.values(registryArtifact.deployedBytecode.immutableReferences??{}))for(const r of refs){assert.equal(r.length,32);const at=2+r.start*2;expected=expected.slice(0,at)+E.zeroPadValue(helper,32).slice(2)+expected.slice(at+64);}
  assert.equal(report.deployments[1].code,expected);
  if(!small){
   // Test-only local state fault: the actual pinned helper's second CREATE collides.
   const before=await rpc('eth_getTransactionCount',[helper,'latest']);
   const first=E.getCreateAddress({from:helper,nonce:BigInt(before)}),second=E.getCreateAddress({from:helper,nonce:BigInt(before)+1n});
   assert.equal(await rpc('eth_getCode',[first,'latest']),'0x');assert.equal(await rpc('eth_getCode',[second,'latest']),'0x');
   await rpc('anvil_setCode',[second,'0x00']);
   const receipt=await send('second-create-collision',registry,ri.encodeFunctionData('registerGroup',[golden.groups.defaults.raw]),'0x0');
   assert.equal(await rpc('eth_getTransactionCount',[helper,'latest']),before);
   assert.equal(await rpc('eth_getCode',[first,'latest']),'0x');assert.equal(await rpc('eth_getCode',[second,'latest']),'0x00');
   await assert.rejects(call(ri,registry,'groupBytes',[golden.groups.defaults.groupHash]));
   for(const id of golden.groups.defaults.ids)await assert.rejects(call(ri,registry,'typeInfo',[id]));
   report.rollback={helperNonce:before,first,second,injectedCode:'0x00',firstCodeAfter:'0x',secondCodeAfter:'0x00',blockNumber:receipt.blockNumber,registryGroupAndTypesAbsent:true};
   await rpc('anvil_setCode',[second,'0x']);
   assert.equal(await rpc('eth_getCode',[second,'latest']),'0x');
  }
  const supported=['defaults','bool','constrained','option','array','map','text','digest','principal','struct'];
  for(const name of small?['defaults']:supported){
   const g=golden.groups[name];
   const compiled=(await call(hi,helper,'compileGroup',[g.raw]))[0];
   assert.equal(compiled.groupHash,g.groupHash);assert.equal(compiled.rawHash,E.keccak256(g.raw));
   const parsed=parseGroup(E.getBytes(g.raw));
   for(let k=0;k<g.ids.length;k++)verifyCache({ordinal:1,cacheBytes:compiled.types[k].cacheBytes},parsed.members[k],g.ids[k],g.ids,Buffer.from(g.blobs[k].slice(2),'hex'));
   const before=await rpc('eth_getTransactionCount',[helper,'latest']);
   const receipt=await send('register-'+name,registry,ri.encodeFunctionData('registerGroup',[g.raw]));
   assert.equal(BigInt(await rpc('eth_getTransactionCount',[helper,'latest']))-BigInt(before),BigInt(g.ids.length));
   assert.equal((await call(ri,registry,'groupBytes',[g.groupHash]))[0],g.raw);
   const infos=[],codes=[];
   for(let k=0;k<g.ids.length;k++){
    const info=(await call(ri,registry,'typeInfo',[g.ids[k]]))[0],cache=(await call(ri,registry,'cacheBytes',[g.ids[k]]))[0];
    assert.equal(cache,compiled.types[k].cacheBytes);assert.equal(info.groupId,g.groupHash);assert.equal(info.memberIndex,BigInt(k));
    const code=await rpc('eth_getCode',[info.cacheCode,receipt.blockNumber]);assert.equal(code,'0x00'+cache.slice(2));
    infos.push(info);codes.push({address:info.cacheCode,code,codehash:E.keccak256(code)});
   }
   report.groups.push(plain({name,raw:g.raw,groupId:g.groupHash,ids:g.ids,compiled,infos,codes,blockNumber:receipt.blockNumber}));
  }
  const helperNonce=await rpc('eth_getTransactionCount',[helper,'latest']);
  await send('register-exact-repeat',registry,ri.encodeFunctionData('registerGroup',[golden.groups.defaults.raw]));
  assert.equal(await rpc('eth_getTransactionCount',[helper,'latest']),helperNonce);
  for(const outcome of small?golden.outcomes.slice(0,1):golden.outcomes){
   const id=golden.groups[outcome.group].ids[outcome.member],data=ri.encodeFunctionData('validate',[id,outcome.body]);
   let accepted=true,error=null;try{await call(ri,registry,'validate',[id,outcome.body]);}catch(e){accepted=false;error=e.data;}
   assert.equal(accepted,outcome.valid,outcome.name);
   if(!accepted)assert.equal(error,E.concat([E.id('InvalidBody(uint16)').slice(0,10),E.zeroPadValue(E.toBeHex(outcome.error),32)]),'exact oracle error '+outcome.name);
   await send('validate-'+outcome.name,registry,data,outcome.valid?'0x1':'0x0');
   report.validations.push({...outcome,typeId:id,actualError:error});
  }
  if(!small){
   for(const name of ['ref','self','external','occref','optionalRef','zeroArrayRef','sibling','secondUnsupported','index','digestIndex','boundary','aggregate']){
    const g=golden.groups[name],before=await rpc('eth_getTransactionCount',[helper,'latest']);
    let error;try{await call(ri,registry,'registerGroup',[g.raw]);assert.fail('must refuse '+name);}catch(e){error=e.data;assert(error,'actual EVM refusal '+name);}
    await send('refuse-'+name,registry,ri.encodeFunctionData('registerGroup',[g.raw]),'0x0');
    assert.equal(await rpc('eth_getTransactionCount',[helper,'latest']),before);
    let missing=false;try{await call(ri,registry,'groupBytes',[g.groupHash]);}catch{missing=true;}assert(missing);
    report.groups.push({name,raw:g.raw,ids:g.ids,refused:true,error});
   }
   const g=golden.groups.defaults;
   await send('paid-cache-read',registry,ri.encodeFunctionData('cacheBytes',[g.ids[0]]));
   await send('paid-type-read',registry,ri.encodeFunctionData('typeInfo',[g.ids[0]]));
   await send('paid-group-read',registry,ri.encodeFunctionData('groupBytes',[g.groupHash]));
  }
  report.helperArtifactHash=E.keccak256(readFileSync(root+'contracts/test/fixtures/canonical-preparation-helper.json'));
  report.helperInputHash=E.keccak256(E.toUtf8Bytes(JSON.stringify(helperArtifact.input)));
  report.registryArtifact={abi:registryArtifact.abi,metadata:registryArtifact.metadata,bytecode:registryArtifact.bytecode,deployedBytecode:registryArtifact.deployedBytecode};
  if(finalSource)assertFinalSource(finalSource);
  await node.stop();return plain(report);
 },{watchdogMs:240000});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const small=process.argv.includes('--probe');const dest=process.argv[process.argv.indexOf('--output')+1];
 if(!small){assert(process.argv.includes('--output')&&dest,'exclusive output required');assert(!existsSync(dest));}
 const finalSource=process.argv.includes('--final')?process.argv[process.argv.indexOf('--final')+1]:null;
 const codePath=dest+'.code.json.gz';if(!small)assert(!existsSync(codePath));
 const report=await probe({small,finalSource});
 if(!small){
  const codes={format:'efs21-canonical-registry-code/1',sourceCommit:report.sourceCommit,deployments:report.deployments,registryArtifact:report.registryArtifact,groups:report.groups.filter(g=>!g.refused)};
  const payload=JSON.stringify(codes);assert(Buffer.byteLength(payload)<16*1024*1024);
  const compressed=gzipSync(payload);assert(compressed.length<4*1024*1024);
  report.codeInventory={file:basename(codePath),keccak256:E.keccak256(compressed),uncompressedBytes:Buffer.byteLength(payload),compressedBytes:compressed.length};
  report.deployments=report.deployments.map(({code,...row})=>row);delete report.registryArtifact;
  report.groups=report.groups.map(({compiled,codes,...row})=>({...row,...(codes?{codes:codes.map(({code,...c})=>c)}:{})}));
  const encoded=JSON.stringify(report,null,2)+'\n';assert(Buffer.byteLength(encoded)<8*1024*1024);
  writeFileSync(codePath,compressed,{flag:'wx'});writeFileSync(dest,encoded,{flag:'wx'});
 }
 console.log(JSON.stringify({source:report.sourceCommit,deployments:report.deployments.map(({label,runtimeBytes,initcodeBytes,gasUsed})=>({label,runtimeBytes,initcodeBytes,gasUsed})),transactions:report.transactions.length,groups:report.groups.length,validations:report.validations.length,cleanup:report.cleanup}));
}
