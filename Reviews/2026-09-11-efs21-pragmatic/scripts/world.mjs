import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync,readdirSync} from 'node:fs';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import * as E from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import {withManagedAnvil} from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import {createClient,GAS_LIMIT} from '../sdk/client.mjs';
import {sourceProfile} from '../sdk/qualification.mjs';
export {E};
export async function observeBody(w,id,body,basis){
  const c=w.client,split=w.provenance.kernelArtifact.capabilities.split,kernel=split?w.config.graph.NativeRecordKernel:w.config.kernel,abi=E.AbiCoder.defaultAbiCoder();
  const read=async slot=>E.toBeHex(BigInt(await c.rpc('eth_getStorageAt',[kernel,E.toBeHex(slot,32),basis.blockNumber])),32);
  const root=BigInt(E.keccak256(abi.encode(['bytes32','uint256'],[id,split?0:3]))),metadata=await read(root+1n),value=BigInt(metadata);
  const backend=Number(value>>184n&255n),length=Number(value>>160n&65535n),present=Number(value>>176n&255n),pointer=E.getAddress(E.toBeHex(value&((1n<<160n)-1n),20));
  assert.equal(present,1);assert.equal(length,E.getBytes(body).length);assert([0,1].includes(backend));
  if(!split)assert.equal(await read(BigInt(E.keccak256(abi.encode(['bytes32','uint256'],[id,4])))),E.ZeroHash,'reserved presence root');
  const words=[];let code;
  if(backend===0){code=await c.rpc('eth_getCode',[pointer,basis.blockNumber]);assert.equal(code,'0x00'+body.slice(2));}
  else{
    assert.equal(pointer,E.ZeroAddress);
    const base=BigInt(E.keccak256(abi.encode(['bytes32','uint256'],[id,split?1:6])));
    for(let i=0;i<Math.ceil(length/32);i++){
      const actual=await read(base+BigInt(i));
      assert.equal(actual,'0x'+body.slice(2+i*64,2+(i+1)*64).padEnd(64,'0'));
      words.push({slot:E.toBeHex(base+BigInt(i),32),value:actual});
    }
  }
  return {recordId:id,typeWord:await read(root),metadata,backend,length,present,pointer,words,...(code?{code}:{}),basis};
}
export const ROOT = fileURLToPath(new URL('../',import.meta.url));
export const KERNEL_PROFILES=Object.freeze({
  current:{fixture:'4cb0042',registry:'ExpandedTypeRegistry',raw:true,discovery:true,bodyWriter:true,bodyBackend:'hybrid',split:true},
  'baseline-4cb0042':{fixture:'4cb0042',registry:'ExpandedTypeRegistry',raw:true,discovery:true,bodyWriter:true,bodyBackend:'hybrid',split:true},
  'canonical-ref-free-v1':{registry:'CanonicalTypeRegistry',canonical:true,raw:false,discovery:true,bodyWriter:true,bodyBackend:'hybrid',split:true},
  'baseline-7db38cd':{fixture:'7db38cd',registry:'ExpandedTypeRegistry',raw:true,discovery:true,bodyWriter:true,bodyBackend:'hybrid'},
  'forced-code':{fixture:'7db38cd-forced-code',registry:'ExpandedTypeRegistry',raw:true,discovery:true,bodyWriter:true,bodyBackend:'code'},
  'forced-words':{fixture:'7db38cd-forced-words',registry:'ExpandedTypeRegistry',raw:true,discovery:true,bodyWriter:true,bodyBackend:'words'},
  'baseline-f43501a':{fixture:'f43501a',registry:'ExpandedTypeRegistry',raw:true,discovery:true,bodyWriter:true,bodyBackend:'code'},
  'baseline-58e61c4':{fixture:'58e61c4',registry:'ExpandedTypeRegistry',raw:true,discovery:true,bodyWriter:true,bodyBackend:'code'},
  'baseline-aa6b1b6':{fixture:'aa6b1b6',registry:'ExactTypeRegistry',raw:false,discovery:false,bodyWriter:false},
  'baseline-bf566dc':{fixture:'bf566dc',registry:'ExactTypeRegistry',raw:false,discovery:false,bodyWriter:false},
  'baseline-c088363':{fixture:'c088363',registry:'ExpandedTypeRegistry',raw:true,discovery:true,bodyWriter:false,bodyBackend:'dynamic'},
  'integrity-c088363':{fixture:'c088363-read-integrity',registry:'ExpandedTypeRegistry',raw:true,discovery:true,bodyWriter:false,bodyBackend:'dynamic'},
});
export function artifactFor(profile,name) {
  if(name==='PaidReadProbe'){
    const a=JSON.parse(readFileSync(ROOT+'contracts/out/PaidReadProbe.sol/PaidReadProbe.json'));
    for(const [path,pin]of Object.entries(a.metadata.sources))assert.equal(E.keccak256(readFileSync(ROOT+'contracts/'+path)),pin.keccak256,'identical benchmark-only probe source');
    return a;
  }
  if(profile!=='canonical-ref-free-v1'){
    const bytes=readFileSync(ROOT+'contracts/test/fixtures/native-replay-4cb0042.json');
    assert.equal(E.keccak256(bytes),'0xee1642da4c16b7afb8104967c6eb86075d8f83654bc66d78bb1e9f9ac227a5e0','frozen complete replay artifact');
    const frozen=JSON.parse(bytes);
    assert.equal(frozen.sourceCommit,'4cb004273982411d4699fa15d388750638cd1358');
    const a=frozen.artifacts[name];assert(a,'complete frozen artifact '+name);return a;
  }
  if(name==='PreparationHelper'){
    const a=JSON.parse(readFileSync(ROOT+'contracts/test/fixtures/canonical-preparation-helper.json'));
    assert.equal(E.keccak256(a.deployedBytecode.object),sourceProfile(profile).helper.runtimeHash);
    assert.equal(E.keccak256(readFileSync(ROOT+'contracts/test/fixtures/'+a.compilerOutput.file)),a.compilerOutput.keccak256);
    for(const pin of Object.values(a.sourceManifest))assert.equal(E.keccak256(readFileSync(resolve(ROOT,'../..',pin.path))),pin.keccak256,'standalone helper source '+pin.path);
    return a;
  }
  const source = ['ForcedCodeKernel','ForcedWordsKernel'].includes(name)?'ForcedBodyKernel':['QuoteProducer','QuoteReader','PlainQuoteMapping'].includes(name)?'Examples':['BytesValidator','Uint256Validator'].includes(name)?'ExactTypeRegistry':name;
  return JSON.parse(readFileSync(`${ROOT}contracts/out/${source}.sol/${name}.json`));
}
// Explicitly historical convenience API. Candidate callers must select their profile.
export const artifact=name=>artifactFor('baseline-4cb0042',name);
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
  assert(Object.hasOwn(KERNEL_PROFILES,kernelArtifact),'explicit supported kernel artifact');
  const capabilities=KERNEL_PROFILES[kernelArtifact];
  const getArtifact=name=>artifactFor(kernelArtifact,name);
  const fixturePath=capabilities.fixture&&`contracts/test/fixtures/native-kernel-${capabilities.fixture}.json`;
  const selectedKernel=fixturePath?JSON.parse(readFileSync(ROOT+fixturePath)):getArtifact(capabilities.artifact??'NativeKernel');
  for(const fragment of artifact('NativeKernel').abi.filter(f=>(f.type==='function'||f.type==='event')&&f.name!=='types')) assert(selectedKernel.abi.some(current=>isDeepStrictEqual(current,fragment))||!capabilities.split,'Files function/tuple/event surface preserved exactly');
  const kernelPin={selection:kernelArtifact,capabilities,creationBytecodeHash:E.keccak256(selectedKernel.bytecode.object),sourcePins:selectedKernel.metadata.sources,compiler:selectedKernel.metadata.compiler,settings:selectedKernel.metadata.settings};
  if(fixturePath) {
    assert.equal(kernelPin.creationBytecodeHash,selectedKernel.creationBytecodeHash,'pinned baseline bytecode');
    kernelPin.sourceCommit=selectedKernel.sourceCommit;kernelPin.fixturePath=fixturePath;kernelPin.fixtureHash=E.keccak256(readFileSync(ROOT+fixturePath));
    for(const [path,pin] of Object.entries(selectedKernel.metadata.sources)) {
      const source=spawnSync('git',['show',`${selectedKernel.sourceCommit}:Reviews/2026-09-11-efs21-pragmatic/contracts/${path}`],{cwd:ROOT});
      assert.equal(source.status,0,'baseline source remains Git-readable');
      let exactSource=source.stdout.toString();
      for(const delta of selectedKernel.sourceDelta??[]){
        if(delta.path!==path)continue;
        assert.equal(exactSource.split(delta.before).length,2,'exact unique frozen delta target');
        exactSource=exactSource.replace(delta.before,delta.after);
      }
      assert.equal(E.keccak256(E.toUtf8Bytes(exactSource)),pin.keccak256,'baseline artifact matches pinned historical source plus exact delta '+path);
    }
    if(selectedKernel.sourceDelta)kernelPin.sourceDelta=selectedKernel.sourceDelta;
  }
  else for(const [path,pin] of Object.entries(selectedKernel.metadata.sources))assert.equal(E.keccak256(readFileSync(`${ROOT}contracts/${path}`)),pin.keccak256,'selected artifact matches current source '+path);
  const port=await freePort();
  return withManagedAnvil(['--host','127.0.0.1','--port',String(port),'--chain-id','31337','--hardfork','cancun','--gas-limit',String(GAS_LIMIT),'--accounts','0','--silent'],async node=>{
    const rpcURL=`http://127.0.0.1:${port}`;
    async function rpc(method,params=[]) {const r=await fetch(rpcURL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(10000)});const j=await r.json();if(j.error)throw Error(j.error.message);return j.result;}
    let ready=false; for(let i=0;i<100;i++){try{ready=await rpc('eth_chainId')==='0x7a69';}catch{}if(ready)break;await new Promise(r=>setTimeout(r,50));} assert(ready,'managed node ready');
    const key=E.toBeHex(0xef521,32),wallet=new E.Wallet(key);
    await rpc('anvil_setBalance',[wallet.address,'0x3635c9adc5dea00000']);
    const setup=[],actions=[]; const runtimes={};
    async function rawSend(label,data,to,{phase='setup',expectedStatus='0x1'}={}) {
      const nonce=Number(BigInt(await rpc('eth_getTransactionCount',[wallet.address,'pending'])));
      const rawTransaction=await wallet.signTransaction({chainId:31337,nonce,gasLimit:GAS_LIMIT,gasPrice:2000000000n,data,...(to?{to}:{})});
      const hash=await rpc('eth_sendRawTransaction',[rawTransaction]);
      let receipt;for(let i=0;i<200;i++){receipt=await rpc('eth_getTransactionReceipt',[hash]);if(receipt)break;await new Promise(r=>setTimeout(r,25));}assert(receipt,'bounded deployment receipt');assert.equal(receipt.status,expectedStatus,label);
      const row={label,phase,hash,rawTransaction,gasUsed:BigInt(receipt.gasUsed).toString(),calldataBytes:(data.length-2)/2,calldataHash:E.keccak256(data),receipt};
      if(phase==='setup')setup.push(row);
      else actions.push({...row,to,calldata:data,verifyEffect:false,status:receipt.status==='0x1'?'MINED_UNVERIFIED':'REVERTED',qualification:'Test-only injected-fault transaction bypasses SDK preflight; effects require restored-graph readback'});
      return receipt;
    }
    async function pin(name,address) {const code=await rpc('eth_getCode',[address,'latest']);assert((code.length-2)/2<=24576,'ordinary runtime ceiling');runtimes[name]={address,codeHash:E.keccak256(code),runtimeBytes:(code.length-2)/2};return address;}
    async function deploy(name,args=[]) {const a=name==='NativeKernel'?selectedKernel:getArtifact(name),i=new E.Interface(a.abi),data=a.bytecode.object+i.encodeDeploy(args).slice(2);assert((data.length-2)/2<=49152);return pin(name,(await rawSend('deploy '+name,data)).contractAddress);}
    const preparationHelper=capabilities.canonical?await deploy('PreparationHelper'):undefined;
    const kernel=await deploy('NativeKernel',preparationHelper?[preparationHelper]:[]),ki=new E.Interface(selectedKernel.abi);
    const kernelDeployment=setup.at(-1).receipt;
    const point=async (method)=>ki.decodeFunctionResult(method,await rpc('eth_call',[{to:kernel,data:ki.encodeFunctionData(method)},'latest']))[0];
    const registry=await pin(capabilities.registry,await point('types'));await pin('NavigationIndex',await point('navigation'));
    if(capabilities.discovery) await pin('DiscoveryIndex',await point('discovery'));
    let recordKernel;
    if(capabilities.split){
      recordKernel=await pin('NativeRecordKernel',await point('recordKernel'));
      await pin('RecordInventoryIndex',await point('recordInventory'));
    }
    if(capabilities.bodyWriter){
      const ri=new E.Interface(['function bodyWriter() view returns(address)']);
      const helper=capabilities.split?ri.decodeFunctionResult('bodyWriter',await rpc('eth_call',[{to:recordKernel,data:ri.encodeFunctionData('bodyWriter')},'latest']))[0]:E.getCreateAddress({from:kernel,nonce:4});
      const deployed=getArtifact('BodyWriter').deployedBytecode;
      let expected=deployed.object;
      for(const refs of Object.values(deployed.immutableReferences))for(const ref of refs){
        assert.equal(ref.length,32);const start=2+ref.start*2;
        expected=expected.slice(0,start)+E.zeroPadValue(recordKernel??kernel,32).slice(2)+expected.slice(start+64);
      }
      assert.equal(await rpc('eth_getCode',[helper,'latest']),expected,'derived helper must match actual compiler runtime plus kernel immutable');
      await pin('BodyWriter',helper);
    }
    const bytesValidator=capabilities.canonical?undefined:await deploy('BytesValidator'),uintValidator=capabilities.canonical?undefined:await deploy('Uint256Validator');
    const ti=new E.Interface(getArtifact(capabilities.registry).abi),abi=E.AbiCoder.defaultAbiCoder();
    async function register(label,validator) {const descriptor=E.toUtf8Bytes(label),codeHash=E.keccak256(await rpc('eth_getCode',[validator,'latest']));await rawSend('register '+label,ti.encodeFunctionData('register',[descriptor,validator]),registry);return E.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[E.id('EFS21_TYPE_V1'),E.keccak256(descriptor),codeHash]));}
    let bytesType,quoteType;
    if(capabilities.canonical){
      const defaults=JSON.parse(readFileSync(ROOT+'contracts/test/fixtures/canonical-types-golden.json')).groups.defaults;
      assert.deepEqual(defaults.ids,sourceProfile(kernelArtifact).canonical.defaultGroup.ids);
      await rawSend('register canonical defaults',ti.encodeFunctionData('registerGroup',[defaults.raw]),registry);
      const groupId=E.keccak256(abi.encode(['bytes32','bytes32'],[E.id('efs2/typeschema-group/1'),E.keccak256(defaults.raw)]));
      assert.equal(groupId,defaults.groupHash);
      const ids=[0,1].map(i=>E.keccak256(abi.encode(['bytes32','bytes32','uint256'],[E.id('efs2/typeschema/1'),groupId,i])));assert.deepEqual(ids,defaults.ids);
      [quoteType,bytesType]=ids;
    }else{bytesType=await register('EFS21 canonical ABI bytes v1',bytesValidator);quoteType=await register('EFS21 exact ABI uint256 v1',uintValidator);}
    const producer=await deploy('QuoteProducer',[kernel,quoteType]),consumer=await deploy('QuoteReader'),mapping=await deploy('PlainQuoteMapping');
    // Append new setup after old deployments so historical producer identities remain comparable.
    const rawType=capabilities.raw?await register('EFS21 exact raw bytes v1',await deploy('RawBytesValidator')):undefined;
    const config={rpc:rpcURL,chainId:'31337',genesisHash:(await rpc('eth_getBlockByNumber',['0x0',false])).hash,kernel,codeHash:runtimes.NativeKernel.codeHash,devPrivateKey:key,namespace:wallet.address,bytesType,quoteType,producer,consumer,abi:selectedKernel.abi,consumerAbi:getArtifact('QuoteReader').abi};
    if(capabilities.canonical){const p=sourceProfile(kernelArtifact);config.representation=p.canonical.representation;config.defaultGroupId=p.canonical.defaultGroup.groupHash;config.registryAbi=p.canonical.registryAbi;config.errorAbi=p.errorAbi;}
    if(rawType)config.rawType=rawType;
    config.dependencyProfile=kernelArtifact;
    config.profileId=sourceProfile(kernelArtifact).id;
    const graphRoles=['NativeKernel','NavigationIndex',...(capabilities.canonical?['PreparationHelper']:['BytesValidator','Uint256Validator']),...(capabilities.discovery?['DiscoveryIndex']:[]),...(capabilities.bodyWriter?['BodyWriter']:[]),...(rawType?['RawBytesValidator']:[]),...(capabilities.split?['NativeRecordKernel','RecordInventoryIndex']:[])];
    config.graph={...Object.fromEntries(graphRoles.map(role=>[role,runtimes[role].address])),types:registry};
    config.deploymentBlockNumber=kernelDeployment.blockNumber;config.deploymentBlockHash=kernelDeployment.blockHash;
    const client=createClient(E,config,{onAction:a=>{const i=actions.findIndex(x=>x.hash===a.hash);if(i<0)actions.push(a);else actions[i]=a;}});
    async function faultWrite(method,args,label,{expectedStatus='0x0'}={}){
      await rawSend(label,ki.encodeFunctionData(method,args),kernel,{phase:'injected-fault',expectedStatus});
      return actions.at(-1);
    }
    const git=spawnSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).stdout.trim();
    const sourcePins=Object.fromEntries(readdirSync(`${ROOT}contracts/src`).filter(p=>p.endsWith('.sol')).map(p=>[p,E.keccak256(readFileSync(`${ROOT}contracts/src/${p}`))]));
    if(capabilities.canonical)for(const name of ['NativeKernel','NativeRecordKernel','CanonicalTypeRegistry','NavigationIndex','DiscoveryIndex','CanonicalPayloadConsumer','QuoteProducer','QuoteReader','PlainQuoteMapping','BodyWriter','BodyReadConsumer']){
      for(const [path,pin] of Object.entries(getArtifact(name).metadata.sources))assert.equal(E.keccak256(readFileSync(`${ROOT}contracts/${path}`)),pin.keccak256,'artifact matches source '+path);
    }
    const supportPins=Object.fromEntries(['scripts','sdk','web','test'].flatMap(dir=>readdirSync(ROOT+dir).map(p=>[dir+'/'+p,E.keccak256(readFileSync(ROOT+dir+'/'+p))])));
    const provenance={sourceCommit:git,sourcePins,runtimes,compiler:selectedKernel.metadata.compiler,settings:selectedKernel.metadata.settings,node:process.version,ethers:E.version,anvil:spawnSync('anvil',['--version'],{encoding:'utf8'}).stdout.trim(),gasLimit:String(GAS_LIMIT),hardfork:'cancun',dependencyLockHash:E.keccak256(readFileSync(`${ROOT}../2026-09-04-mvp-rehearsal/package-lock.json`))};
    provenance.kernelArtifact={...kernelPin,sourceCommit:kernelPin.sourceCommit??git};
    provenance.sourceProfile={selection:kernelArtifact,id:config.profileId,graph:config.graph};
    provenance.supportPins=supportPins;
    provenance.sharedSupportPins=Object.fromEntries(['../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs','../2026-09-09-files-browser-mvp/web/cost-ledger.mjs','../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.min.js'].map(p=>[p,E.keccak256(readFileSync(ROOT+p))]));
    const result=await action({client,config,setup,actions,provenance,producer,consumer,mapping,deploy,rawSend,faultWrite,node,artifact:getArtifact});
    await node.stop(); return {...result,cleanup:node.cleanup};
  },{watchdogMs});
}
