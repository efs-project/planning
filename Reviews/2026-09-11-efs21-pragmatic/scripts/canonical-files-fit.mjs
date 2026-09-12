// Early actual nested Files graph gate. Exploratory receipts, not final economics.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,statfsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createServer} from 'node:net';
import {resolve,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {withManagedAnvil} from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),vault=resolve(root,'../..');
const output=resolve(process.argv[2]??root+'evidence/canonical-files-fit.json');
assert(!existsSync(output),'exclusive probe output');
const disk=statfsSync(root);assert(disk.bavail*disk.bsize>20*1024**3,'20GiB free floor');
const gas=16777216n,abi=E.AbiCoder.defaultAbiCoder();
const artifact=name=>JSON.parse(readFileSync(root+`contracts/out/${name}.sol/${name}.json`));
const helperArtifact=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-preparation-helper.json'));
const golden=JSON.parse(readFileSync(root+'contracts/test/fixtures/canonical-types-golden.json'));
const names=['NativeKernel','NativeRecordKernel','CanonicalTypeRegistry','NavigationIndex','DiscoveryIndex','RecordInventoryIndex','BodyWriter'];
const artifacts=Object.fromEntries(names.map(name=>[name,artifact(name)]));
const sourceManifest={};
for(const a of Object.values(artifacts))for(const [key,pin]of Object.entries(a.metadata.sources)){
 const path=resolve(root,'contracts',key);assert.equal(E.keccak256(readFileSync(path)),pin.keccak256,key);sourceManifest[relative(vault,path)]=pin.keccak256;
}
for(const pin of Object.values(helperArtifact.sourceManifest)){assert.equal(E.keccak256(readFileSync(resolve(vault,pin.path))),pin.keccak256);sourceManifest[pin.path]=pin.keccak256;}
assert.equal(E.keccak256(readFileSync(root+'contracts/test/fixtures/'+helperArtifact.compilerOutput.file)),helperArtifact.compilerOutput.keccak256);
const git=args=>{const r=spawnSync('git',args,{cwd:vault,encoding:'utf8'});assert.equal(r.status,0);return r.stdout.trim();};
const report={format:'efs21-canonical-files-fit/1',evidenceClass:'exploratory-working-tree',sourceCommit:git(['rev-parse','HEAD']),sourceStatus:git(['status','--porcelain']),sourceManifest,limits:{gas:String(gas),runtime:24576,initcode:49152},transactions:[],modules:[],outcome:'NOT_RUN'};
const server=createServer();await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const port=server.address().port;await new Promise(ok=>server.close(ok));
try{
await withManagedAnvil(['--host','127.0.0.1','--port',String(port),'--chain-id','31337','--hardfork','cancun','--gas-limit',String(gas),'--accounts','0','--silent'],async node=>{
 report.cleanup=node.cleanup;
 const rpc=async(method,params=[])=>{const r=await fetch(`http://127.0.0.1:${port}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(10000)});const j=await r.json();if(j.error)throw Object.assign(Error(j.error.message),{data:j.error.data});return j.result;};
 let ready=false;for(let i=0;i<100&&!ready;i++){try{ready=await rpc('eth_chainId')==='0x7a69';}catch{}if(!ready)await new Promise(ok=>setTimeout(ok,50));}assert(ready);
 const wallet=new E.Wallet(E.toBeHex(0xef521,32));await rpc('anvil_setBalance',[wallet.address,E.toBeHex(10n**22n)]);
 let nonce=0;
 async function send(label,to,data,expected='0x1'){
  const signed=await wallet.signTransaction({chainId:31337,nonce:nonce++,gasLimit:gas,gasPrice:2000000000n,data,...(to?{to}:{})});
  const row={label,signed,calldataBytes:E.getBytes(data).length};report.transactions.push(row);
  try{row.hash=await rpc('eth_sendRawTransaction',[signed]);}catch(e){row.submissionError={message:e.message,data:e.data};throw e;}
  for(let i=0;i<200;i++){row.receipt=await rpc('eth_getTransactionReceipt',[row.hash]);if(row.receipt)break;await new Promise(ok=>setTimeout(ok,25));}
  assert(row.receipt);row.transaction=await rpc('eth_getTransactionByHash',[row.hash]);row.block=await rpc('eth_getBlockByHash',[row.receipt.blockHash,false]);row.gasUsed=String(BigInt(row.receipt.gasUsed));assert.equal(row.receipt.status,expected,label);return row.receipt;
 }
 const call=async(name,target,method,args=[])=>{const i=new E.Interface(artifacts[name].abi);return i.decodeFunctionResult(method,await rpc('eth_call',[{to:target,data:i.encodeFunctionData(method,args),gas:E.toBeHex(gas)},'latest']));};
 const sendCall=async(label,name,target,method,args=[],expected)=>send(label,target,new E.Interface(artifacts[name].abi).encodeFunctionData(method,args),expected);
 const deploy=async(name,a,args=[])=>{const data=a.bytecode.object+new E.Interface(a.abi).encodeDeploy(args).slice(2);assert(E.getBytes(data).length<=49152,name+' initcode bound');const r=await send('deploy '+name,null,data);return r.contractAddress;};
 const helper=await deploy('PreparationHelper',helperArtifact);assert.equal(E.keccak256(await rpc('eth_getCode',[helper,'latest'])),helperArtifact.runtimeHash);
 const kernel=await deploy('NativeKernel',artifacts.NativeKernel,[helper]);
 report.deploymentAnchor=report.transactions[1].receipt;
 const graph={NativeKernel:kernel,PreparationHelper:helper};
 for(const [name,getter]of [['NativeRecordKernel','recordKernel'],['CanonicalTypeRegistry','types'],['NavigationIndex','navigation'],['DiscoveryIndex','discovery'],['RecordInventoryIndex','recordInventory']])graph[name]=(await call('NativeKernel',kernel,getter))[0];
 graph.BodyWriter=(await call('NativeRecordKernel',graph.NativeRecordKernel,'bodyWriter'))[0];
 assert.equal((await call('CanonicalTypeRegistry',graph.CanonicalTypeRegistry,'helper'))[0].toLowerCase(),helper.toLowerCase());
 for(const [name,address]of Object.entries(graph)){const code=await rpc('eth_getCode',[address,'latest']);assert(E.getBytes(code).length>0&&E.getBytes(code).length<=24576);report.modules.push({name,address,code,codehash:E.keccak256(code),runtimeBytes:E.getBytes(code).length,creationBytes:E.getBytes((name==='PreparationHelper'?helperArtifact:artifacts[name]).bytecode.object).length});}
 report.graph=graph;report.outcome='DEPLOYED_WITHIN_CAPS';
 console.log('Actual complete graph deployed within caps:',JSON.stringify(report.modules.map(({name,runtimeBytes,creationBytes})=>({name,runtimeBytes,creationBytes}))));
 const d=golden.groups.defaults;
 await sendCall('register defaults','CanonicalTypeRegistry',graph.CanonicalTypeRegistry,'registerGroup',[d.raw]);
 const derivedGroup=E.keccak256(abi.encode(['bytes32','bytes32'],[E.id('efs2/typeschema-group/1'),E.keccak256(d.raw)]));assert.equal(derivedGroup,d.groupHash);
 for(let i=0;i<2;i++)assert.equal(d.ids[i],E.keccak256(abi.encode(['bytes32','bytes32','uint256'],[E.id('efs2/typeschema/1'),derivedGroup,i])));
 const body=abi.encode(['uint256'],[3000]);
 const recordId=E.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[E.id('efs2/record/1'),d.ids[0],E.keccak256(body)]));
 await sendCall('direct Record','NativeRecordKernel',graph.NativeRecordKernel,'storeRecord',[d.ids[0],body]);
 await sendCall('facade dedup','NativeKernel',kernel,'storeRecord',[d.ids[0],body]);
 await sendCall('root','NativeKernel',kernel,'ensureRoot');
 const rootId=(await call('NativeKernel',kernel,'rootId',[wallet.address]))[0];
 await sendCall('File quote','NativeKernel',kernel,'createFile',[rootId,E.toUtf8Bytes('quote'),d.ids[0],body]);
 const id=(await call('NativeKernel',kernel,'lookup',[wallet.address,rootId,E.toUtf8Bytes('quote')]))[0];
 assert.equal((await call('NativeKernel',kernel,'fileInfo',[id]))[0].recordId,recordId);
 const read=(await call('NativeKernel',kernel,'readRecord',[recordId]))[0];assert.equal(read.typeId,d.ids[0]);assert.equal(read.body,body);
 const inventory=(await call('RecordInventoryIndex',graph.RecordInventoryIndex,'typeInventory',[d.ids[0],[E.ZeroHash,0,0],64]))[0];assert.deepEqual([...inventory.ids],[recordId]);
 await sendCall('Discovery attach','DiscoveryIndex',graph.DiscoveryIndex,'attach',[d.ids[0],true]);
 const status=(await call('DiscoveryIndex',graph.DiscoveryIndex,'status',[wallet.address]))[0];
 await sendCall('Discovery backfill','DiscoveryIndex',graph.DiscoveryIndex,'backfill',[wallet.address,status.epoch,0,64]);
 const page=(await call('DiscoveryIndex',graph.DiscoveryIndex,'page',[wallet.address,status.epoch,3000,[E.ZeroHash,0,0],64]))[0];assert(page.complete);assert.deepEqual([...page.ids],[id]);
 report.checks={canonicalRecordId:recordId,defaultGroup:d.groupHash,defaultTypes:d.ids,actualFile:id,mandatoryInventoryUnique:true,discoveryReady:true};report.outcome='FIT_AND_MINIMAL_FILES_GREEN';
},{watchdogMs:120000});
}catch(error){report.failure={message:error.message,data:error.data,stack:error.stack};process.exitCode=1;}
const encoded=JSON.stringify(report,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n';assert(Buffer.byteLength(encoded)<8*1024**2);writeFileSync(output,encoded,{flag:'wx'});console.log(JSON.stringify({outcome:report.outcome,failure:report.failure,transactions:report.transactions.map(({label,gasUsed})=>({label,gasUsed})),cleanup:report.cleanup,output}));
