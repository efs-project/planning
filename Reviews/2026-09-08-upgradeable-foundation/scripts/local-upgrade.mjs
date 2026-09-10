// Managed disposable node ONLY. No RPC URL input, public network or real keys.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { AbiCoder, Interface, Wallet, keccak256, toBeHex, getCreateAddress } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { fixtureInputs, SOLC, TX_GAS, word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { HISTORY_LIMIT, executionObject } from '../reference/upgrade-reader.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url)), abi = AbiCoder.defaultAbiCoder();
const IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const ADMIN_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
const bytes = x => (x.length - 2) / 2;
const lower = x => x.toLowerCase();
const asAddress = value => { assert(/^0x0{24}[0-9a-f]{40}$/i.test(value), 'canonical address word'); return lower('0x' + value.slice(-40)); };
export function compileUpgrade() {
  const r = spawnSync('forge',['build','--ast','--build-info','--offline','--use',SOLC],{cwd:ROOT,encoding:'utf8',timeout:240000,maxBuffer:4*1024*1024});
  assert.equal(r.status,0,r.stdout+r.stderr);
}
function artifact(name) {
  const file = name === 'UpgradeStaticConsumer' ? 'UpgradeReads.t' : name.endsWith('U2') ? name.slice(0,-2) : name;
  return JSON.parse(readFileSync(join(ROOT,'out',file+'.sol',name+'.json'),'utf8'));
}
function patch(template, refs, values) {
  let code = template.replace(/^0x/,'');
  const windows=[];
  for (const [id,positions] of Object.entries(refs ?? {})) {
    assert(values[id], 'unknown compiler patch ' + id);
    assert(positions.length>0,'nonempty compiler windows');
    for (const p of positions) {
      assert(Number.isInteger(p.start)&&Number.isInteger(p.length)&&p.length>0,'integer patch window');
      assert(windows.every(q=>p.start+p.length<=q.start||q.start+q.length<=p.start),'overlapping/duplicate patch window'); windows.push(p);
      const value = values[id].replace(/^0x/,'').padStart(p.length*2,'0');
      assert.equal(value.length,p.length*2); assert(p.start >= 0 && (p.start+p.length)*2 <= code.length);
      code = code.slice(0,p.start*2)+value+code.slice((p.start+p.length)*2);
    }
  }
  assert(!code.includes('_'),'unresolved links'); return '0x'+code.toLowerCase();
}
const profileMap = Object.freeze({
  base: { core: 'UpgradeableFixtureCore', libraries: ['UpgradeAdmissionLibrary'] },
  reads: { core: 'UpgradeableReadFixtureCore', libraries: ['UpgradeAdmissionLibrary','PointReadLibrary','UpgradeQueryReadLibrary'] }
});
assert.deepEqual(Object.keys(profileMap).sort(), ['base','reads']);
const linkTargets = {
  UpgradeAdmissionLibrary: 'src/UpgradeAdmissionLibrary.sol',
  PointReadLibrary: '../2026-09-05-c0-core/src/PointReadLibrary.sol',
  UpgradeQueryReadLibrary: 'src/UpgradeQueryReadLibrary.sol'
};
function link(bytecode,addresses = {}, expected = []) {
  const refs = {};
  for (const [file,libs] of Object.entries(bytecode.linkReferences ?? {})) for (const [name,positions] of Object.entries(libs)) {
    assert.equal(file,linkTargets[name], 'closed source-target link'); assert(!refs[name], 'duplicate link target'); refs[name]=positions.map(p=>{ assert.equal(p.length,20,'address link width'); return p; });
  }
  assert.deepEqual(Object.keys(refs).sort(), [...expected].sort(), 'exact link inventory');
  return patch(bytecode.object,refs,addresses);
}
function compilerEvidence(profile) {
  const coreName = profileMap[profile].core;
  const a = artifact(coreName);
  const info = readdirSync(join(ROOT,'out/build-info')).map(n => JSON.parse(readFileSync(join(ROOT,'out/build-info',n),'utf8'))).find(j => {
    const compiled = j.output?.contracts?.['src/'+coreName+'.sol']?.[coreName]?.evm;
    return compiled?.bytecode?.object === a.bytecode.object.replace(/^0x/,'')
      && compiled.deployedBytecode.object === a.deployedBytecode.object.replace(/^0x/,'')
      && JSON.stringify(compiled.deployedBytecode.immutableReferences ?? {}) === JSON.stringify(a.deployedBytecode.immutableReferences ?? {});
  });
  assert(info,'matching full compiler output');
  const names = {};
  function visit(node) { if (!node || typeof node !== 'object') return; if(node.mutability === 'immutable') names[node.id]=node.name; for (const v of Object.values(node)) if(typeof v === 'object') Array.isArray(v) ? v.forEach(visit) : visit(v); }
  for (const source of Object.values(info.output.sources)) visit(source.ast);
  const sourcePins = {};
  const metadataSources = {};
  for (const name of [coreName,coreName+'U2',...(profile === 'reads' ? ['UpgradeableFixtureCore','UpgradeableFixtureCoreU2','PointReadLibrary','UpgradeQueryReadLibrary','UpgradeStaticConsumer'] : []),'UpgradeableFixtureCarrier','UpgradeableFixtureCarrierU2','FixtureDeployment','PreparationHelper','UpgradeAdmissionLibrary','TransparentUpgradeableProxy','ProxyAdmin']) {
    const generated=artifact(name), [[path,contract]]=Object.entries(generated.metadata.settings.compilationTarget);
    const compiled=info.output.contracts[path]?.[contract];assert(compiled,'complete compiled artifact '+name);
    assert.deepEqual(generated.abi,compiled.abi,'compiler ABI '+name);
    for(const kind of ['bytecode','deployedBytecode']) {
      assert.equal(generated[kind].object.replace(/^0x/,''),compiled.evm[kind].object,'compiler artifact bytecode '+name);
      assert.deepEqual(generated[kind].linkReferences??{},compiled.evm[kind].linkReferences??{},'compiler link references');
      assert.deepEqual(generated[kind].immutableReferences??{},compiled.evm[kind].immutableReferences??{},'compiler immutable references');
    }
    for (const [path,value] of Object.entries(generated.metadata.sources)) {
      if (metadataSources[path]) assert.equal(metadataSources[path].keccak256,value.keccak256,'consistent artifact source hashes');
      metadataSources[path]=value;
    }
  }
  for (const [name,value] of Object.entries(metadataSources)) {
    const input = (info.input.sources[name] ?? info.input.sources[resolve(ROOT,name)])?.content; assert.equal(typeof input,'string','source content '+name);
    assert.equal(keccak256(Buffer.from(input)),value.keccak256,'compiler source hash');
    assert.equal(keccak256(readFileSync(resolve(ROOT,name))),value.keccak256,'current disk source hash');
    sourcePins[name]=value.keccak256;
  }
  const git = args => { const r=spawnSync('git',args,{cwd:ROOT,encoding:'utf8'}); assert.equal(r.status,0); return r.stdout.trim(); };
  const supportSourcePins=Object.fromEntries([...(profile==='reads'?['test/upgrade-reads.test.mjs','reference/upgrade-lens-resolver.mjs','../2026-09-05-c0-core/reference/lens-resolver.mjs']:[]),'scripts/local-upgrade.mjs','reference/upgrade-reader.mjs','test/upgrade-chain.test.mjs','../2026-09-05-c0-core/reference/state-reader.mjs','../2026-09-05-c0-core/reference/record-body.mjs','../2026-09-05-c0-core/scripts/local-stateful.mjs','../2026-09-05-c0-admission/reader.mjs','../2026-09-05-c0-admission/codec.mjs','../2026-09-05-mvp-build-start/type-inputs/parser.mjs','../2026-09-05-mvp-build-start/type-inputs/encoder.mjs','../../Designs/efsv2/hierarchical-files-and-folders.md','../2026-08-13-efs2-stage-a-corpus/chapters/b0-encoding-and-ids.md'].map(path=>[path,keccak256(readFileSync(resolve(ROOT,path)))]));
  const version=tool=>{const r=spawnSync(tool,['--version'],{encoding:'utf8',timeout:5000});assert.equal(r.status,0);return r.stdout.trim();};
  return { info,names,resources: { sourceCommit:git(['rev-parse','HEAD']),trackedDiffHash:keccak256(Buffer.from(git(['diff','--','../2026-09-05-c0-core','src','test/FixtureDeployment.sol']))),compiler:a.metadata.compiler,compilerBinaryHash:keccak256(readFileSync(SOLC)),versions:{node:process.version,forge:version('forge'),anvil:version('anvil'),ethers:JSON.parse(readFileSync(resolve(ROOT,'../2026-09-04-mvp-rehearsal/node_modules/ethers/package.json'),'utf8')).version},settings:a.metadata.settings,sourcePins,supportSourcePins,compilerInputHash:keccak256(Buffer.from(JSON.stringify(info.input))),compilerOutputHash:keccak256(Buffer.from(JSON.stringify(info.output))),dependencyLockHash:keccak256(readFileSync(join(ROOT,'package-lock.json'))),artifactPins:{} } };
}
export async function withUpgrade(action, { profile = 'base' } = {}) {
  assert(typeof profile === 'string' && Object.hasOwn(profileMap,profile), 'unknown upgrade profile');
  const selected = profileMap[profile];
  const compiler = compilerEvidence(profile);
  const reservation=createServer(); await new Promise((ok,no)=>{reservation.once('error',no);reservation.listen(0,'127.0.0.1',ok);});
  const port=reservation.address().port; await new Promise(ok=>reservation.close(ok));
  const args=['--host','127.0.0.1','--port',String(port),'--chain-id','31337','--hardfork','cancun','--gas-limit',String(TX_GAS*2n),'--accounts','0','--no-cors','--silent'];
  const child=spawn('anvil',args,{stdio:'ignore'}); let spawnError;
  child.on('error',e=>{spawnError=e;});
  const url='http://127.0.0.1:'+port, source='managed-anvil:'+url;
  const kill=()=>{if(child.exitCode===null && child.signalCode===null)child.kill('SIGKILL');};
  const signal=()=>{kill();process.exitCode=130;};
  process.once('exit',kill);process.once('SIGINT',signal);process.once('SIGTERM',signal);
  const watchdog=setTimeout(kill,300000), cleanup={}, transactions=[];
  let automine=true,result;
  async function rpc(method,params=[],{maxBytes=262144}={}) {
    assert(Number.isSafeInteger(maxBytes) && maxBytes>0 && maxBytes<=262144,'RPC response budget');
    const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(8000)});
    const length=response.headers.get('content-length'); if(length && BigInt(length)>BigInt(maxBytes)){await response.body.cancel();throw Error('response byte budget');}
    const chunks=[];let total=0;for await(const chunk of response.body){total+=chunk.length;if(total>maxBytes)throw Error('response byte budget');chunks.push(Buffer.from(chunk));}
    const j=JSON.parse(Buffer.concat(chunks,total).toString());if(j.error){const e=Error(j.error.message);e.data=j.error.data;throw e;}return j.result;
  }
  try {
    let ready=false;for(let i=0;i<100&&!ready;i++){if(spawnError||child.exitCode!==null)throw Error('managed node startup');try{ready=await rpc('eth_chainId')==='0x7a69';}catch{}if(!ready)await delay(50);}assert(ready,'bounded readiness');
    const wallet=new Wallet(word(0xc008)),operator=new Wallet(word(0xc009));await rpc('anvil_setBalance',[wallet.address,'0x3635c9adc5dea00000']);
    async function send(data,to) {
      const n=BigInt(await rpc('eth_getTransactionCount',[wallet.address,'pending']));
      const raw=await wallet.signTransaction({chainId:31337,nonce:Number(n),gasLimit:TX_GAS,gasPrice:2000000000n,data,...(to?{to}:{})});
      return {hash:await rpc('eth_sendRawTransaction',[raw]),data,to:to??null,from:wallet.address};
    }
    async function receipt(tx,label) {
      for(let i=0;i<300;i++){const r=await rpc('eth_getTransactionReceipt',[tx.hash]);if(r){assert(BigInt(r.gasUsed)<=TX_GAS);transactions.push({label,hash:tx.hash,from:tx.from,to:tx.to,calldata:tx.data,calldataHash:keccak256(tx.data),receipt:r,status:r.status,gasUsed:BigInt(r.gasUsed).toString(),blockNumber:BigInt(r.blockNumber).toString(),blockHash:r.blockHash,transactionIndex:BigInt(r.transactionIndex).toString()});return r;}await delay(25);}throw Error('bounded receipt wait');
    }
    const resources={...compiler.resources,txGasCeiling:String(TX_GAS),runtimeCeiling:24576,initcodeCeiling:49152,nodeArgs:args,deployment:{},inputPins:{}};
    const components={},implementations={};
    async function deploy(name,constructorArgs=[],values={},links={}) {
      const a=artifact(name),iface=new Interface(a.abi),nonce=BigInt(await rpc('eth_getTransactionCount',[wallet.address,'pending']));
      const address=lower(getCreateAddress({from:wallet.address,nonce}));
      const immutableValues={};
      for(const id of Object.keys(a.deployedBytecode.immutableReferences??{})) immutableValues[id]=id==='library_deploy_address'?address:compiler.names[id]==='implementationSelf'?address:values[compiler.names[id]];
      const coreHost = name === selected.core || name === selected.core+'U2';
      const endpoint = coreHost || name.startsWith('UpgradeableFixtureCarrier');
      const expectedLinks = endpoint ? (coreHost ? selected.libraries : ['UpgradeAdmissionLibrary']) : [];
      const expectedNames = endpoint ? ['implementationSelf','bootstrapAuthority','preparationHelper','preparationCodehash','admissionLibrary','admissionCodehash',...(coreHost && profile === 'reads' ? ['pointReadLibrary','pointReadCodehash','queryReadLibrary','queryReadCodehash'] : [])] : name === 'FixtureDeployment' ? ['owner'] : name === 'UpgradeAdmissionLibrary' ? ['library_deploy_address'] : [];
      assert.deepEqual(Object.keys(immutableValues).map(id=>compiler.names[id]??id).sort(), expectedNames.sort(), 'exact same-build immutable inventory '+name);
      // Link and immutable windows must be disjoint, not just valid individually.
      const windows = [...Object.values(a.deployedBytecode.linkReferences??{}).flatMap(x=>Object.values(x).flat()), ...Object.values(a.deployedBytecode.immutableReferences??{}).flat()].sort((a,b)=>a.start-b.start);
      for(let i=1;i<windows.length;i++)assert(windows[i-1].start+windows[i-1].length<=windows[i].start,'overlapping compiler windows');
      const runtime=patch(link(a.deployedBytecode,links,coreHost?expectedLinks:[]),a.deployedBytecode.immutableReferences,immutableValues);
      const creation=link(a.bytecode,links,expectedLinks)+iface.encodeDeploy(constructorArgs).slice(2);
      assert(bytes(runtime)<=24576,'runtime ceiling');assert(bytes(creation)<=49152,'initcode ceiling including args');
      const r=await receipt(await send(creation),name);assert.equal(r.status,'0x1',name+' deployment');assert.equal(lower(r.contractAddress),address);
      assert.equal(await rpc('eth_getCode',[address,r.blockNumber]),runtime,'source-derived installed runtime '+name);
      resources.artifactPins[name]=keccak256(Buffer.from(JSON.stringify(a)));
      resources.deployment[name]={address,runtimeBytes:bytes(runtime),initcodeBytes:bytes(creation),gas:BigInt(r.gasUsed).toString(),codehash:keccak256(runtime),immutableNames:Object.fromEntries(Object.keys(immutableValues).map(id=>[id,compiler.names[id]??id]))};
      const deployed={address,code:runtime,codehash:keccak256(runtime),iface,artifact:a};components[name]={address,code:runtime};return deployed;
    }
    const factory=await deploy('FixtureDeployment',[],{owner:wallet.address});
    const helper=await deploy('PreparationHelper');
    const library=await deploy('UpgradeAdmissionLibrary');
    const point=profile==='reads'?await deploy('PointReadLibrary'):null;
    const query=profile==='reads'?await deploy('UpgradeQueryReadLibrary'):null;
    const links={UpgradeAdmissionLibrary:library.address,...(point?{PointReadLibrary:point.address,UpgradeQueryReadLibrary:query.address}:{})};
    const readValues=point?{pointReadLibrary:point.address,pointReadCodehash:point.codehash,queryReadLibrary:query.address,queryReadCodehash:query.codehash}:{};
    const coreArgs=[factory.address,helper.address,...(point?[point.codehash,query.codehash]:[])];
    const values={...readValues,bootstrapAuthority:factory.address,preparationHelper:helper.address,preparationCodehash:helper.codehash,admissionLibrary:library.address,admissionCodehash:library.codehash};
    const core1=await deploy(selected.core,coreArgs,values,links);
    const carrier1=await deploy('UpgradeableFixtureCarrier',[factory.address,helper.address],values,links);
    const core2=await deploy(selected.core+'U2',coreArgs,values,links);
    const carrier2=await deploy('UpgradeableFixtureCarrierU2',[factory.address,helper.address],values,links);
    for(const d of [core1,carrier1,core2,carrier2])implementations[d.address]={code:d.code};
    const inputs=fixtureInputs(),m=Object.fromEntries(inputs.candidates.groups.flatMap(g=>g.members.map(m=>[m.descriptor.name,m.temporaryTypeSchemaId]))),treeType=m['ChunkTree/1'];
    const core=lower(getCreateAddress({from:factory.address,nonce:1})),carrier=lower(getCreateAddress({from:factory.address,nonce:2}));
    const coreAdmin=lower(getCreateAddress({from:core,nonce:1})),carrierAdmin=lower(getCreateAddress({from:carrier,nonce:1}));
    const proxyArtifact=artifact('TransparentUpgradeableProxy'),adminArtifact=artifact('ProxyAdmin');
    resources.artifactPins.TransparentUpgradeableProxy=keccak256(Buffer.from(JSON.stringify(proxyArtifact)));resources.artifactPins.ProxyAdmin=keccak256(Buffer.from(JSON.stringify(adminArtifact)));
    const adminRefs=Object.entries(proxyArtifact.deployedBytecode.immutableReferences);assert.equal(adminRefs.length,1);assert.equal(compiler.names[adminRefs[0][0]],'_admin');
    const adminCode=adminArtifact.deployedBytecode.object;
    for(const [kind,address,admin,impl,endpoint] of [['core',core,coreAdmin,core1.address,core1],['carrier',carrier,carrierAdmin,carrier1.address,carrier1]]) {
      const code=patch(proxyArtifact.deployedBytecode.object,proxyArtifact.deployedBytecode.immutableReferences,{[adminRefs[0][0]]:admin});
      components[kind]={address,code};components[kind+'Admin']={address:admin,code:adminCode};
      const init=endpoint.iface.encodeFunctionData('initialize',kind==='core'?[factory.address,carrier,admin,operator.address,treeType,inputs.init]:[factory.address,core,admin,operator.address,treeType]);
      const initcode=proxyArtifact.bytecode.object+abi.encode(['address','address','bytes'],[impl,factory.address,init]).slice(2);
      assert(bytes(initcode)<=49152 && bytes(code)<=24576);
      resources.deployment[kind+'Proxy']={address,runtimeBytes:bytes(code),initcodeBytes:bytes(initcode),codehash:keccak256(code),immutableAdminRefs:adminRefs[0][1]};
      resources.deployment[kind+'Admin']={address:admin,runtimeBytes:bytes(adminCode),initcodeBytes:bytes(adminArtifact.bytecode.object+abi.encode(['address'],[factory.address]).slice(2)),codehash:keccak256(adminCode)};
    }
    const boot=await receipt(await send(factory.iface.encodeFunctionData('deployPair',[core1.address,carrier1.address,operator.address,treeType,inputs.init]),factory.address),'atomic pair bootstrap');assert.equal(boot.status,'0x1');
    const iface=new Interface(artifact('UpgradeableFixtureCoreU2').abi),readIface=profile==='reads'?core2.iface:undefined,carrierIface=carrier2.iface,adminIface=new Interface(adminArtifact.abi);
    const errorAbi=[core2.artifact,library.artifact,helper.artifact].flatMap(a=>a.abi.filter(f=>f.type==='error'));
    const errorIface=new Interface([...new Map(errorAbi.map(f=>[JSON.stringify(f),f])).values()]);
    const expected={core,chainId:'31337',source,init:inputs.init,components,implementations,getters:{preparationHelper:helper.address,preparationCodehash:helper.codehash,admissionLibrary:library.address,admissionCodehash:library.codehash},execution:{core,carrier,coreAdmin,carrierAdmin,controller:factory.address,operator:operator.address,helper:helper.address,helperCodehash:helper.codehash,admissionLibrary:library.address,admissionCodehash:library.codehash,treeType}};
    resources.inputPins={candidateFile:inputs.candidateFileHash,groups:inputs.candidates.groups.map(g=>keccak256('0x'+g.groupHex)),intrinsic:keccak256(inputs.init.intrinsicGroupBytes)};
    async function call(address,codec,name,args=[],pin='latest',get=rpc) {
      const data=await get('eth_call',[{to:address,data:codec.encodeFunctionData(name,args),gas:toBeHex(TX_GAS)},pin]);
      const decoded=codec.decodeFunctionResult(name,data);assert.equal(codec.encodeFunctionResult(name,decoded),data,'canonical '+name);return decoded[0];
    }
    async function collectExecution(basis) {
      const pin={blockHash:basis.hash,requireCanonical:true};let work=0,total=0;
      const get=async(method,args)=>{assert(++work<=128,'history work budget');const result=await rpc(method,args,{maxBytes:65536});total+=Buffer.byteLength(JSON.stringify(result));assert(total<=1048576,'history byte budget');return result;};
      const current=await call(core,iface,'currentRevision',[],pin,get);if(current>BigInt(HISTORY_LIMIT)||current<1n)throw Error('history revision budget');
      const history=[];for(let i=1;i<=Number(current);i++){
        const row=await call(core,iface,'revisionAt',[i],pin,get);assert.equal(row.length,21,'672-byte history tuple');
        const peer=await call(carrier,carrierIface,'revisionAt',[i],pin,get);assert.equal(JSON.stringify(row,(_,v)=>typeof v==='bigint'?String(v):v),JSON.stringify(peer,(_,v)=>typeof v==='bigint'?String(v):v),'peer history');
        history.push(executionObject(row));
      }
      const endpoints={};
      for(const [kind,address,codec] of [['core',core,iface],['carrier',carrier,carrierIface]]) {
        const code=await get('eth_getCode',[address,pin]);
        const opened=adminRefs[0][1].map(p=>{assert.equal(p.length,32);return asAddress('0x'+code.slice(2+p.start*2,2+(p.start+p.length)*2));});assert(opened.length>0 && opened.every(x=>x===opened[0]),'consistent immutable admin openings');
        const immutableAdmin=opened[0];
        endpoints[kind]={pin:basis.hash,immutableAdmin,adminSlot:asAddress(await get('eth_getStorageAt',[address,ADMIN_SLOT,pin])),implementation:asAddress(await get('eth_getStorageAt',[address,IMPLEMENTATION_SLOT,pin])),owner:await call(immutableAdmin,adminIface,'owner',[],pin,get),configuration:await call(address,codec,'configuration',[],pin,get),currentRevision:String(await call(address,codec,'currentRevision',[],pin,get))};
      }
      const end=await get('eth_getBlockByNumber',[toBeHex(BigInt(basis.number)),false]);assert.equal(end.hash,basis.hash,'history canonical basis');
      return {complete:true,currentRevision:String(current),history,endpoints,collection:{work,bytes:total,revisionLimit:HISTORY_LIMIT,workLimit:128,byteLimit:1048576}};
    }
    let nonce=1n,byteNonce=1n;
    const typedDomain=address=>({name:'EFS Upgrade Foundation',version:'1',chainId:31337,verifyingContract:address});
    async function prepare(publication) {
      const revision=await call(core,iface,'currentRevision'),execution=await call(core,iface,'revisionAt',[revision]);
      const deadline=BigInt((await rpc('eth_getBlockByNumber',['latest',false])).timestamp)+3600n,n=nonce++;
      const publicationHash=keccak256(abi.encode([iface.getFunction('executeFixture').inputs[0]],[publication]));
      const signature=await operator.signTypedData(typedDomain(core),{FixturePlan:[{name:'publicationHash',type:'bytes32'},{name:'executionSetId',type:'bytes32'},{name:'nonce',type:'uint64'},{name:'deadline',type:'uint64'}]},{publicationHash,executionSetId:execution.id,nonce:n,deadline});
      return {publication,revision,nonce:n,deadline,signature};
    }
    const data=p=>iface.encodeFunctionData('executeFixture',[p.publication,p.revision,p.nonce,p.deadline,p.signature]);
    const submit=async p=>{const tx=await send(data(p),core);return {tx,receipt:await receipt(tx,'publication')};};
    const publish=async p=>submit(await prepare(p));
    async function reject(p,cause,args) {
      let error;try{await rpc('eth_call',[{from:wallet.address,to:core,data:data(p),gas:toBeHex(TX_GAS)},'latest']);}catch(e){error=e;}
      assert(error?.data,'exact revert bytes required');const decoded=errorIface.parseError(error.data);assert.equal(decoded?.name,cause,'specific rejection cause');
      assert.equal(errorIface.encodeErrorResult(decoded.fragment,decoded.args),error.data,'canonical rejection bytes');
      if(args)assert.deepEqual([...decoded.args],args,'specific rejection arguments');
      const rejected=await submit(p);assert.equal(rejected.receipt.status,'0x0');transactions.at(-1).rejection={name:decoded.name,data:error.data,args:[...decoded.args].map(String)};return rejected;
    }
    async function stage(treeId,body,data) {
      const revision=await call(carrier,carrierIface,'currentRevision'),e=await call(carrier,carrierIface,'revisionAt',[revision]),n=byteNonce++,deadline=BigInt((await rpc('eth_getBlockByNumber',['latest',false])).timestamp)+3600n;
      const signature=await operator.signTypedData(typedDomain(carrier),{FixtureBytes:[{name:'treeId',type:'bytes32'},{name:'bodyHash',type:'bytes32'},{name:'dataHash',type:'bytes32'},{name:'executionSetId',type:'bytes32'},{name:'nonce',type:'uint64'},{name:'deadline',type:'uint64'}]},{treeId,bodyHash:keccak256(body),dataHash:keccak256(data),executionSetId:e.id,nonce:n,deadline});
      const tx=await send(carrierIface.encodeFunctionData('stageFixtureBytes',[treeId,body,data,revision,n,deadline,signature]),carrier);return{tx,receipt:await receipt(tx,'separate byte staging')};
    }
    async function upgrade({before,migrate=true}={}) {
      assert.equal(typeof migrate,'boolean','migrate must be boolean');
      let beforeTx;
      if(before){await rpc('evm_setAutomine',[false]);automine=false;beforeTx=await send(data(before),core);}
      const tx=await send(factory.iface.encodeFunctionData('upgradePair',[core2.address,carrier2.address,migrate?iface.encodeFunctionData('migratePresentation',['Core U2',false]):'0x',migrate?carrierIface.encodeFunctionData('migratePresentation',['Carrier U2',false]):'0x']),factory.address);
      if(before){await rpc('evm_mine');await rpc('evm_setAutomine',[true]);automine=true;}
      return {tx,...(beforeTx?{beforeReceipt:await receipt(beforeTx,'same-block U1 publication')} : {}),receipt:await receipt(tx,'atomic U1 to U2')};
    }
    const readBytes=(id,basis)=>call(carrier,carrierIface,'readFixtureBytes',[id],{blockHash:basis.hash,requireCanonical:true});
    const mine=async enabled=>{await rpc('evm_setAutomine',[enabled]);automine=enabled;};
    result=await action({rpc,core,carrier,operator:operator.address,iface,readIface,expected,inputs,collectExecution,resources,cleanup,transactions,prepare,publish,submit,reject,stage,readBytes,upgrade,mine,send,receipt,data});
  } finally {
    if(!automine&&child.exitCode===null){try{await rpc('evm_setAutomine',[true]);cleanup.automineRestored=true;}catch{cleanup.automineRestored=false;}}
    clearTimeout(watchdog);
    if(child.exitCode===null){child.kill('SIGTERM');for(let i=0;i<40&&child.exitCode===null&&child.signalCode===null;i++)await delay(25);kill();for(let i=0;i<40&&child.exitCode===null&&child.signalCode===null;i++)await delay(25);}
    Object.assign(cleanup,{pid:child.pid,exitCode:child.exitCode,signal:child.signalCode,stopped:child.exitCode!==null||child.signalCode!==null});
    process.removeListener('exit',kill);process.removeListener('SIGINT',signal);process.removeListener('SIGTERM',signal);
  }
  return result;
}
