// Managed ephemeral Anvil only: no configurable RPC URL, no real keys.
import assert from 'node:assert/strict';
import { spawn,spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { ContractFactory,FetchRequest,JsonRpcProvider,Wallet,NonceManager,keccak256,ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { makeRunInputs,SYNTHETIC_KEYS,callArgs } from '../codec.mjs';
export const root=fileURLToPath(new URL('..',import.meta.url));
export const TX_GAS=16777216n;
export const SOLC=process.platform==='darwin'?join(homedir(),'Library/Caches/hardhat-nodejs/compilers-v2/macosx-amd64/solc-macosx-amd64-v0.8.30+commit.73712a01'):'solc';
export function compile(){const compiler=process.env.EFS_C0_SOLC??SOLC;const result=spawnSync('forge',['build','--use',compiler,'--offline'],{cwd:root,encoding:'utf8'});assert.equal(result.status,0,'Solidity build failed: '+result.stdout+result.stderr);}
export async function artifact(){return JSON.parse(await readFile(new URL('../out/AdmissionProbe.sol/AdmissionProbe.json',import.meta.url),'utf8'));}
async function port(){const server=createServer();await new Promise((ok,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',ok);});const n=server.address().port;await new Promise((ok,no)=>server.close(e=>e?no(e):ok()));return n;}
export async function withProbe(action){
  const n=await port();const child=spawn('anvil',['--host','127.0.0.1','--port',String(n),'--chain-id','31337','--hardfork','cancun','--gas-limit',String(TX_GAS),'--timestamp','1788645600','--accounts','0','--no-cors','--quiet'],{stdio:'ignore'});
  let spawnError,provider;child.on('error',e=>{spawnError=e;});const kill=()=>{if(child.exitCode===null)child.kill('SIGKILL');};const stopSignal=()=>{kill();process.exitCode=130;};
  const watchdog=setTimeout(kill,600000);process.once('exit',kill);process.once('SIGINT',stopSignal);process.once('SIGTERM',stopSignal);
  try{
    const url=`http://127.0.0.1:${n}`;let ready=false;
    for(let i=0;i<100&&!ready;i++){if(spawnError||child.exitCode!==null)throw Error('managed Anvil startup failed');try{const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_chainId',params:[]}),signal:AbortSignal.timeout(500)});ready=(await r.json()).result==='0x7a69';}catch{}if(!ready)await delay(50);}
    assert(ready,'managed Anvil readiness timeout');const request=new FetchRequest(url);request.timeout=8000;provider=new JsonRpcProvider(request,31337,{staticNetwork:true,cacheTimeout:-1});provider.pollingInterval=25;
    const run=makeRunInputs(),wallets=Object.fromEntries(Object.entries(SYNTHETIC_KEYS).map(([k,v])=>[k,new Wallet(v,provider)]));
    // Only synthetic payer is funded, exclusively through loopback test-node control.
    await provider.send('anvil_setBalance',[wallets.payer.address,'0x3635c9adc5dea00000']);
    const payer=new NonceManager(wallets.payer),compiled=await artifact();
    const factory=new ContractFactory(compiled.abi,compiled.bytecode.object,payer);
    const core=await factory.deploy(run.config,run.intrinsicGroup,run.declarationInventory,{gasLimit:TX_GAS});
    const deploymentReceipt=await core.deploymentTransaction().wait(1,15000);assert.equal(deploymentReceipt.status,1);
    const address=await core.getAddress(),runtimeCode=await provider.getCode(address);assert((runtimeCode.length-2)/2<=24576,'EIP170 runtime ceiling');
    const deployment={core:address,chainId:31337,runtimeCodeHash:keccak256(runtimeCode)};
    return await action({provider,core,payer,wallets,run,deployment,deploymentReceipt,runtimeCode,compiled});
  }finally{
    clearTimeout(watchdog);provider?.destroy();if(child.exitCode===null){child.kill('SIGTERM');for(let i=0;i<20&&child.exitCode===null;i++)await delay(25);kill();}
    process.removeListener('exit',kill);process.removeListener('SIGINT',stopSignal);process.removeListener('SIGTERM',stopSignal);
  }
}
export async function submit(lab,p,{gasLimit=TX_GAS}={}){
  assert(BigInt(gasLimit)<=TX_GAS&&BigInt(gasLimit)>0n,'bounded transaction gas');
  const tx=await lab.core.publishWithPlanC0(...callArgs(p),{gasLimit});
  const receipt=await tx.wait(1,15000);assert.equal(receipt.status,1);return receipt;
}
const plain = row => Object.fromEntries(Object.entries(row.toObject()).map(([k,v])=>[k,typeof v==='bigint'?v.toString():v]));
export async function collectSnapshot(lab,{blockNumber,onBasis}={}){
  const {provider,core,deployment}=lab;
  const block=await provider.getBlock(blockNumber??await provider.getBlockNumber());assert(block,'basis unavailable');
  onBasis?.({number:block.number,hash:block.hash,timestamp:block.timestamp});
  const opts={blockTag:block.number};const call=(name,...args)=>core[name](...args,opts);
  const readIndex=async(kind,key)=>{const length=Number(await call('indexLength',kind,key));assert(Number.isSafeInteger(length)&&length<=128,'bounded index cap');const rows=[];for(let i=0;i<length;i++)rows.push(await call('indexAt',kind,key,i));return rows;};
  const s={basis:{number:block.number,hash:block.hash,timestamp:block.timestamp},core:deployment.core,chainId:Number(BigInt(await provider.send('eth_chainId',[]))),runtimeCode:await provider.getCode(deployment.core,block.number),config:{},indexes:{},types:{},records:{},admissions:{},envelopes:{},principals:{},sequences:{}};
  for(const k of ['realmId','stateByteStore','schemaAuthor','bootstrapAuthor'])s.config[k]=await call(k);
  for(const k of ['metaTypeId','probeCommitment','c0ProfileId'])s[k]=await call(k);
  for(const k of ['admittedGroupCount','admissionCount','recordCount','envelopeCount'])s[k]=Number(await call(k));
  s.intrinsicGroup=await call('intrinsicGroupBytes');s.declarationInventory=await call('declarationInventoryBytes');s.inventory=[];for(let i=0;i<4;i++)s.inventory.push(await call('inventory',i));
  const index=async(kind,key)=>s.indexes[kind+':'+key]=await readIndex(kind,key);
  for(const id of await index(1,ZeroHash))s.types[id]=plain(await call('getTypeCache',id));
  for(const id of await index(2,ZeroHash))s.principals[id]=await call('principalDescriptor',id);
  for(const id of await index(3,s.metaTypeId)){s.records[id]=plain(await call('getRecord',id));await index(5,id);}
  await index(4,s.metaTypeId);
  for(const pid of Object.keys(s.principals))await index(6,pid);
  for(const key of await index(7,ZeroHash)){
    const a=s.admissions[key]=plain(await call('getAdmission',key));s.envelopes[a.envelopeId]=plain(await call('getEnvelope',a.envelopeId));
    const lane=a.principalId+':'+a.nonceKey;s.sequences[lane]=(await call('lastSequence',a.principalId,a.nonceKey)).toString();
  }
  const readbackBlock=await provider.getBlock(block.number);assert.equal(readbackBlock?.hash,block.hash,'basis changed during read');
  return s;
}
