import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {withManagedAnvil} from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import {createClient,GAS_LIMIT} from '../sdk/client.mjs';
export {E};
export const ROOT = fileURLToPath(new URL('../',import.meta.url));
export function artifact(name) {
  const source = ['QuoteProducer','QuoteReader','PlainQuoteMapping'].includes(name)?'Examples':['BytesValidator','Uint256Validator'].includes(name)?'ExactTypeRegistry':name;
  return JSON.parse(readFileSync(`${ROOT}contracts/out/${source}.sol/${name}.json`));
}
export function build() {
  const r = spawnSync('forge',['build','--sizes'],{cwd:`${ROOT}contracts`,encoding:'utf8',timeout:180000});
  assert.equal(r.status,0,r.stdout+r.stderr);
}
export async function freePort() {
  const s=createServer(); await new Promise((ok,no)=>{s.once('error',no);s.listen(0,'127.0.0.1',ok);});
  const port=s.address().port; await new Promise(ok=>s.close(ok)); return port;
}
export async function withWorld(action,{watchdogMs=300000,buildFirst=true,kernelArtifact='current'}={}) {
  if (buildFirst) build();
  assert(['current','baseline-aa6b1b6','baseline-bf566dc'].includes(kernelArtifact),'explicit supported kernel artifact');
  const fixturePath=`contracts/test/fixtures/native-kernel-${kernelArtifact==='baseline-bf566dc'?'bf566dc':'aa6b1b6'}.json`;
  const selectedKernel=kernelArtifact==='current'?artifact('NativeKernel'):JSON.parse(readFileSync(ROOT+fixturePath));
  for(const fragment of selectedKernel.abi) assert(artifact('NativeKernel').abi.some(current=>JSON.stringify(current)===JSON.stringify(fragment)),'historical ABI fragment preserved exactly');
  const kernelPin={selection:kernelArtifact,creationBytecodeHash:E.keccak256(selectedKernel.bytecode.object),sourcePins:selectedKernel.metadata.sources};
  if(kernelArtifact!=='current') {
    assert.equal(kernelPin.creationBytecodeHash,selectedKernel.creationBytecodeHash,'pinned baseline bytecode');
    kernelPin.sourceCommit=selectedKernel.sourceCommit;kernelPin.fixturePath=fixturePath;kernelPin.fixtureHash=E.keccak256(readFileSync(ROOT+fixturePath));
    for(const [path,pin] of Object.entries(selectedKernel.metadata.sources)) {
      const source=spawnSync('git',['show',`${selectedKernel.sourceCommit}:Reviews/2026-09-11-efs21-pragmatic/contracts/${path}`],{cwd:ROOT});
      assert.equal(source.status,0,'baseline source remains Git-readable');
      assert.equal(E.keccak256(source.stdout),pin.keccak256,'baseline artifact matches pinned historical source '+path);
    }
  }
  const port=await freePort();
  return withManagedAnvil(['--host','127.0.0.1','--port',String(port),'--chain-id','31337','--hardfork','cancun','--gas-limit',String(GAS_LIMIT),'--accounts','0','--silent'],async node=>{
    const rpcURL=`http://127.0.0.1:${port}`;
    async function rpc(method,params=[]) {const r=await fetch(rpcURL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(10000)});const j=await r.json();if(j.error)throw Error(j.error.message);return j.result;}
    let ready=false; for(let i=0;i<100;i++){try{ready=await rpc('eth_chainId')==='0x7a69';}catch{}if(ready)break;await new Promise(r=>setTimeout(r,50));} assert(ready,'managed node ready');
    const key=E.toBeHex(0xef521,32),wallet=new E.Wallet(key);
    await rpc('anvil_setBalance',[wallet.address,'0x3635c9adc5dea00000']);
    const setup=[]; const runtimes={};
    async function rawSend(label,data,to) {
      const nonce=Number(BigInt(await rpc('eth_getTransactionCount',[wallet.address,'pending'])));
      const hash=await rpc('eth_sendRawTransaction',[await wallet.signTransaction({chainId:31337,nonce,gasLimit:GAS_LIMIT,gasPrice:2000000000n,data,...(to?{to}:{})})]);
      let receipt;for(let i=0;i<200;i++){receipt=await rpc('eth_getTransactionReceipt',[hash]);if(receipt)break;await new Promise(r=>setTimeout(r,25));}assert(receipt,'bounded deployment receipt');assert.equal(receipt.status,'0x1',label);
      setup.push({label,phase:'setup',hash,gasUsed:BigInt(receipt.gasUsed).toString(),calldataBytes:(data.length-2)/2,calldataHash:E.keccak256(data),receipt});return receipt;
    }
    async function pin(name,address) {const code=await rpc('eth_getCode',[address,'latest']);assert((code.length-2)/2<=24576,'ordinary runtime ceiling');runtimes[name]={address,codeHash:E.keccak256(code),runtimeBytes:(code.length-2)/2};return address;}
    async function deploy(name,args=[]) {const a=name==='NativeKernel'?selectedKernel:artifact(name),i=new E.Interface(a.abi),data=a.bytecode.object+i.encodeDeploy(args).slice(2);assert((data.length-2)/2<=49152);return pin(name,(await rawSend('deploy '+name,data)).contractAddress);}
    const kernel=await deploy('NativeKernel'),ki=new E.Interface(artifact('NativeKernel').abi);
    const point=async (method)=>ki.decodeFunctionResult(method,await rpc('eth_call',[{to:kernel,data:ki.encodeFunctionData(method)},'latest']))[0];
    const registry=await pin(kernelArtifact==='current'?'ExpandedTypeRegistry':'ExactTypeRegistry',await point('types'));await pin('NavigationIndex',await point('navigation'));
    if(kernelArtifact==='current') await pin('DiscoveryIndex',await point('discovery'));
    const bytesValidator=await deploy('BytesValidator'),uintValidator=await deploy('Uint256Validator');
    const ti=new E.Interface(artifact('ExactTypeRegistry').abi),abi=E.AbiCoder.defaultAbiCoder();
    async function register(label,validator) {const descriptor=E.toUtf8Bytes(label),codeHash=E.keccak256(await rpc('eth_getCode',[validator,'latest']));await rawSend('register '+label,ti.encodeFunctionData('register',[descriptor,validator]),registry);return E.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[E.id('EFS21_TYPE_V1'),E.keccak256(descriptor),codeHash]));}
    const bytesType=await register('EFS21 canonical ABI bytes v1',bytesValidator),quoteType=await register('EFS21 exact ABI uint256 v1',uintValidator);
    const producer=await deploy('QuoteProducer',[kernel,quoteType]),consumer=await deploy('QuoteReader'),mapping=await deploy('PlainQuoteMapping');
    // Append new setup after old deployments so historical producer identities remain comparable.
    const rawType=kernelArtifact==='current'?await register('EFS21 exact raw bytes v1',await deploy('RawBytesValidator')):undefined;
    const config={rpc:rpcURL,chainId:'31337',genesisHash:(await rpc('eth_getBlockByNumber',['0x0',false])).hash,kernel,codeHash:runtimes.NativeKernel.codeHash,devPrivateKey:key,namespace:wallet.address,bytesType,quoteType,producer,consumer,abi:artifact('NativeKernel').abi,consumerAbi:artifact('QuoteReader').abi};
    if(rawType)config.rawType=rawType;
    config.deploymentBlockNumber=setup[0].receipt.blockNumber;config.deploymentBlockHash=setup[0].receipt.blockHash;
    const actions=[],client=createClient(E,config,{onAction:a=>{const i=actions.findIndex(x=>x.hash===a.hash);if(i<0)actions.push(a);else actions[i]=a;}});
    const git=spawnSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).stdout.trim();
    const sourcePins=Object.fromEntries(readdirSync(`${ROOT}contracts/src`).filter(p=>p.endsWith('.sol')).map(p=>[p,E.keccak256(readFileSync(`${ROOT}contracts/src/${p}`))]));
    for(const name of ['NativeKernel','NavigationIndex','DiscoveryIndex','ExactTypeRegistry','ExpandedTypeRegistry','RawBytesValidator','PayloadConsumer','BytesValidator','Uint256Validator','QuoteProducer','QuoteReader','PlainQuoteMapping']){
      for(const [path,pin] of Object.entries(artifact(name).metadata.sources))assert.equal(E.keccak256(readFileSync(`${ROOT}contracts/${path}`)),pin.keccak256,'artifact matches source '+path);
    }
    const supportPins=Object.fromEntries(['scripts','sdk','web','test'].flatMap(dir=>readdirSync(ROOT+dir).map(p=>[dir+'/'+p,E.keccak256(readFileSync(ROOT+dir+'/'+p))])));
    const provenance={sourceCommit:git,sourcePins,runtimes,compiler:artifact('NativeKernel').metadata.compiler,settings:artifact('NativeKernel').metadata.settings,node:process.version,ethers:E.version,anvil:spawnSync('anvil',['--version'],{encoding:'utf8'}).stdout.trim(),gasLimit:String(GAS_LIMIT),hardfork:'cancun',dependencyLockHash:E.keccak256(readFileSync(`${ROOT}../2026-09-04-mvp-rehearsal/package-lock.json`))};
    provenance.kernelArtifact={...kernelPin,sourceCommit:kernelPin.sourceCommit??git};
    provenance.supportPins=supportPins;
    provenance.sharedSupportPins=Object.fromEntries(['../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs','../2026-09-09-files-browser-mvp/web/cost-ledger.mjs','../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.min.js'].map(p=>[p,E.keccak256(readFileSync(ROOT+p))]));
    const result=await action({client,config,setup,actions,provenance,producer,consumer,mapping,deploy,rawSend,node});
    await node.stop(); return {...result,cleanup:node.cleanup};
  },{watchdogMs});
}
