// One bounded paid-resource run. Ordinary Node factories; local Anvil only;
// <=15M transaction limits, no opcode traces, no owner-demo resources.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {spawn,execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {e,abi,Z,field,descriptor,text,shape,typeId,record,declarationDigest,uint} from './fixture-encoding.mjs';

const root=new URL('../',import.meta.url),out=process.env.FOUNDRY_OUT;
assert(out,'FOUNDRY_OUT required');assert(process.env.EFS_TYPES_OUTPUT,'new EFS_TYPES_OUTPUT directory required');
const output=resolve(process.env.EFS_TYPES_OUTPUT);await mkdir(output); // refusal on EEXIST
const vectors=JSON.parse(await readFile(new URL('vectors.json',import.meta.url)));
const json=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v,2)+'\n';
const sha=x=>createHash('sha256').update(x).digest('hex');
const run=await mkdtemp(join(tmpdir(),'efs-described-types-'));
const server=createServer();await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const port=server.address().port;await new Promise(ok=>server.close(ok));
const chainId=31337,txs=[],deployments=[],artifacts={},sourcePins={},checks=[],traces=[];
for(const [file,name] of [['TypeRegistry.sol','TypeRegistry'],['Ledger.sol','Ledger'],['IndexModule.sol','IndexModule'],
 ['PublicationSupport.sol','PublicationSupport'],['DescribedTypeProfile.sol','DescribedTypeRule'],['DescribedTypeProfile.sol','DescriptorCode'],
 ['DescribedFixtures.sol','DescribedPredicateFixture'],['DescribedFixtures.sol','DescribedPaidConsumer'],['NoteProfile.sol','NoteV1Rule']]){
 const raw=await readFile(join(out,file,name+'.json')),a=JSON.parse(raw),m=a.metadata;
 assert.equal(m.compiler.version,'0.8.30+commit.73712a01');assert(m.settings.optimizer.enabled&&m.settings.viaIR);
 assert.equal(m.settings.optimizer.runs,200);assert.equal(m.settings.evmVersion,'cancun');
 assert.deepEqual(a.bytecode.linkReferences,{});assert.deepEqual(a.deployedBytecode.linkReferences,{});
 for(const [path,pin] of Object.entries(m.sources)){const bytes=await readFile(new URL(path,root));assert.equal(e.keccak256(bytes),pin.keccak256,'stale '+name+': '+path);sourcePins[path]={sha256:sha(bytes),keccak256:pin.keccak256};}
 const runtime=e.getBytes(a.deployedBytecode.object).length;assert(runtime<=24576,name+' runtime');
 artifacts[name]={...a,file,artifactSha256:sha(raw),runtime,creation:e.getBytes(a.bytecode.object).length};
}
assert.equal(e.keccak256(artifacts.DescribedTypeRule.deployedBytecode.object),vectors.wrapperRuntimeHash,'stale vector wrapper');
for(const path of ['core-closeout-types-20260915/WIRE.md','core-closeout-types-20260915/vectors.json','core-closeout-types-20260915/fixture-encoding.mjs','core-closeout-types-20260915/paid.mjs','foundry.toml']){
 const b=await readFile(new URL(path,root));sourcePins[path]={sha256:sha(b),keccak256:e.keccak256(b)};
}
const args=['--host','127.0.0.1','--port',String(port),'--chain-id',String(chainId),'--hardfork','cancun','--gas-limit','16777216',
 '--gas-price','2000000000','--prune-history','256','--transaction-block-keeper','512','--cache-path',join(run,'anvil-cache'),'--quiet'];
const child=spawn(process.env.ANVIL_BIN??'anvil',args,{stdio:['ignore','ignore','pipe']});let stderr='',rpcId=0;
child.stderr.on('data',b=>{stderr=(stderr+b).slice(-8000);});
const rpc=async(method,params=[])=>{
 const response=await fetch(`http://127.0.0.1:${port}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++rpcId,method,params}),signal:AbortSignal.timeout(20_000)});
 const result=await response.json();if(result.error)throw new Error(method+': '+JSON.stringify(result.error));return result.result;
};
const admin=e.HDNodeWallet.fromPhrase('test test test test test test test test test test test junk');
const relayer=e.HDNodeWallet.fromPhrase('test test test test test test test test test test test junk',undefined,"m/44'/60'/0'/0/1");
const creator=new e.Wallet(e.toBeHex(0xA11CEn,32));assert.equal(creator.address,vectors.creator);
const contracts={};
async function send(label,tx,signer=admin,want=true){
 const nonce=Number(BigInt(await rpc('eth_getTransactionCount',[signer.address,'pending'])));
 const gasLimit=15_000_000n,raw=await signer.signTransaction({type:0,chainId,nonce,gasLimit,gasPrice:2_000_000_000n,to:tx.to??null,data:tx.data??'0x'});
 const hash=await rpc('eth_sendRawTransaction',[raw]);assert.equal(hash,e.keccak256(raw));
 let receipt;for(let i=0;i<100;i++){receipt=await rpc('eth_getTransactionReceipt',[hash]);if(receipt)break;await delay(20);}assert(receipt,'receipt timeout');
 const chainTx=await rpc('eth_getTransactionByHash',[hash]);assert.equal(chainTx.input,tx.data??'0x');
 const block=await rpc('eth_getBlockByHash',[receipt.blockHash,false]);assert.equal(block.transactions[Number(BigInt(receipt.transactionIndex))],hash);
 const row={label,hash,rawTransaction:raw,chainTx,receipt,gasUsed:BigInt(receipt.gasUsed),status:BigInt(receipt.status)===1n,calldataBytes:e.getBytes(tx.data??'0x').length};txs.push(row);
 assert.equal(row.status,want,label+' status');console.log(label,row.status?'SUCCESS':'REFUSED',String(row.gasUsed));return row;
}
async function deploy(name,args=[],label=name){
 const a=artifacts[name],factory=new e.ContractFactory(a.abi,a.bytecode.object),tx=await factory.getDeployTransaction(...args);
 const initcode=e.getBytes(tx.data).length,argumentBytes=initcode-a.creation;assert(initcode<=49152,name+' initcode');
 const row=await send('deploy/'+label,tx);const address=row.receipt.contractAddress,code=await rpc('eth_getCode',[address,'latest']);
 assert(e.getBytes(code).length<=24576);const c={address,interface:new e.Interface(a.abi),name};contracts[label]=c;
 deployments.push({label,name,address,argumentBytes,initcode,runtime:e.getBytes(code).length,codeHash:e.keccak256(code),code,gasUsed:row.gasUsed});return c;
}
const call=async(c,method,args=[])=>c.interface.decodeFunctionResult(method,await rpc('eth_call',[{to:c.address,data:c.interface.encodeFunctionData(method,args)},'latest']));
const tx=async(c,method,args,label,signer=admin,want=true)=>send(label,{to:c.address,data:c.interface.encodeFunctionData(method,args)},signer,want);
const sig=d=>creator.signingKey.sign(d).serialized;
async function install(r,d,refs=[],custom=e.ZeroAddress,allowed=e.ZeroAddress,label='register',localSig){
 const t=typeId(d,refs,vectors.wrapperRuntimeHash);assert.equal((await call(r,'describedTypeId',[d]))[0],t);
 const bind=custom===e.ZeroAddress?'0x':localSig??sig(e.keccak256((await call(r,'bindingPreimage',[d,custom,allowed]))[0]));
 const row=await tx(r,'registerDescribed',[d,sig(declarationDigest(t)),custom,allowed,bind],label,relayer);
 assert.equal((await call(r,'describedStatus',[t]))[0],2n);return {t,d,row,bindingSignature:bind};
}
async function trace(row,wrapper){
 // Finite call tracer only, never step/opcode logs. Refuse unexpected expansion.
 const tree=await rpc('debug_traceTransaction',[row.hash,{tracer:'callTracer'}]);let count=0;const selected=[];
 function visit(n){assert(++count<=512,'call trace bound');if(n.to?.toLowerCase()===wrapper.toLowerCase())selected.push({to:n.to,gas:n.gas,gasUsed:n.gasUsed,error:n.error??null});for(const c of n.calls??[])visit(c);}
 visit(tree);assert(selected.length,'wrapper call absent');traces.push({label:row.label,transactionHash:row.hash,calls:count,wrapperCalls:selected});
}
let failure,summary;
try{
 for(let i=0;;i++){try{assert.equal(await rpc('eth_chainId'),e.toQuantity(chainId));break;}catch(error){if(i>=100||child.exitCode!==null)throw error;await delay(50);}}
 const registry=await deploy('TypeRegistry'),ledger=await deploy('Ledger',[registry.address,e.id('described-paid-source')]),index=await deploy('IndexModule',[ledger.address]);
 await tx(ledger,'setIndexModule',[index.address],'setup/index');
 const wrapper=(await call(registry,'describedRule'))[0];assert.equal(e.keccak256(await rpc('eth_getCode',[wrapper,'latest'])),vectors.wrapperRuntimeHash);
 await deploy('DescribedTypeRule',[],'standalone-wrapper-cost');
 await deploy('DescriptorCode',[vectors.vectors[1].descriptor],'standalone-descriptor-cost');
 const paid=await deploy('DescribedPaidConsumer');
 const ref=vectors.referenceFixture;await tx(registry,'register',[ref.shape,e.ZeroAddress,[]],'legacy/reference-type');await tx(ledger,'publish',[ref.typeId,ref.body],'legacy/reference-publish');
 for(const v of vectors.vectors){
  assert.equal((await call(registry,'describedTypeId',[v.descriptor]))[0],v.typeId);assert.equal(shape(v.descriptor),v.shape);assert.equal(declarationDigest(v.typeId),v.declarationDigest);
  await tx(registry,'registerDescribed',[v.descriptor,v.declarationSignature,e.ZeroAddress,e.ZeroAddress,'0x'],'vector/register/'+v.name,relayer);
  assert.equal((await call(registry,'descriptorBytes',[v.typeId]))[0],v.descriptor);
  for(let i=0;i<v.bodies.length;i++){
   const b=v.bodies[i];assert.equal(record(v.typeId,b.body),b.recordId);await tx(ledger,'publish',[v.typeId,b.body],'vector/publish/'+v.name+'/'+i,relayer);
   const stored=await call(ledger,'record',[b.recordId]);assert.equal(stored[0],v.typeId);assert.equal(stored[3],b.body);
  }
 }
 for(const v of vectors.invalidBodies){const t=vectors.vectors.find(x=>x.name===v.vector).typeId;await tx(ledger,'publish',[t,v.body],'vector/refuse/'+v.reason,relayer,false);}
 for(const v of vectors.invalidDescriptors){let refused=false;try{await call(registry,'describedTypeId',[v.descriptor]);}catch{refused=true;}assert(refused);checks.push({label:v.name,refused});}
 const note=vectors.vectors.find(x=>x.name==='note-v1'),body=note.bodies[0].body,id=note.bodies[0].recordId;
 await tx(registry,'registerDescribed',[note.descriptor,note.declarationSignature,e.ZeroAddress,e.ZeroAddress,'0x'],'register/identical-relay',relayer);
 await tx(ledger,'publish',[note.typeId,body],'recurring/duplicate-note',relayer);
 const action=(kind,t,b)=>({kind,typeId:t,bodyHashOrRecordId:kind===1?e.keccak256(b):b,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z});
 let a=[action(2,note.typeId,id)];await tx(ledger,'execute',[a,['0x'],(await call(ledger,'nonces',[relayer.address]))[0]],'recurring/reuse-note',relayer);
 const signedBody=text('signed'),actions=[action(1,note.typeId,signedBody)],block=await rpc('eth_getBlockByNumber',['latest',false]);
 const intent=[e.id('described-paid-source'),e.keccak256(await rpc('eth_getCode',[ledger.address,'latest'])),creator.address,0,BigInt(block.timestamp)+3600n,(await call(ledger,'acceptanceProfileOf',[actions]))[0],(await call(ledger,'indexObligations'))[0]];
 const actionHash=e.keccak256(abi.encode(['tuple(uint8 kind,bytes32 typeId,bytes32 bodyHashOrRecordId,bytes32 purpose,bytes32 subject,bytes32 role,bytes32 target,uint32 expectedRevision,bytes32 salt)[]'],[actions]));
 const signed=sig((await call(ledger,'intentDigest',[intent,actionHash]))[0]);await tx(ledger,'executeSigned',[intent,actions,[signedBody],signed],'recurring/signed-note',relayer);
 await tx(paid,'consume',[registry.address,ledger.address,note.typeId,id],'read/cold-note');await tx(paid,'consume',[registry.address,ledger.address,note.typeId,id],'read/repeated-note');
 const custom=await deploy('DescribedPredicateFixture',[vectors.wrapperRuntimeHash,ledger.address]);const customHash=e.keccak256(await rpc('eth_getCode',[custom.address,'latest']));
 const cd=descriptor(creator.address,e.id('paid/custom-note'),'Note text. Additional exact-instance predicate is mandatory.',[field(1,7,{lower:1,upper:1024})],customHash);
 const installed=await install(registry,cd,[],custom.address,ledger.address,'register/custom-with-wrapper');
 const info=(await call(registry,'describedInfo',[installed.t]))[0];assert.equal((await call(registry,'bindingAddress',[info.bindingId]))[0],info.mandatory);
 assert.equal(e.keccak256(await rpc('eth_getCode',[info.mandatory,'latest'])),vectors.wrapperRuntimeHash);
 const customRow=await tx(ledger,'publish',[installed.t,body],'recurring/custom-note',relayer);await trace(customRow,info.mandatory);
 await tx(registry,'registerDescribed',[cd,sig(declarationDigest(installed.t)),custom.address,ledger.address,installed.bindingSignature],'register/custom-identical-relay',relayer);
 await tx(custom,'setMode',[1],'custom/reject-mode');await tx(ledger,'publish',[installed.t,body],'custom/reject-valid-dedup',relayer,false);await tx(custom,'setMode',[0],'custom/accept-mode');
 const maxD=descriptor(creator.address,e.id('paid/note-max'),'Note text1..1024 ASCII/LF and title1..64 printable.',[field(1,7,{lower:1,upper:1024}),field(2,8,{optional:1,lower:1,upper:64})]);
 const max=await install(registry,maxD,[],e.ZeroAddress,e.ZeroAddress,'register/note-max');const maxBody=e.concat([text('a'.repeat(1024)),'0x01',text('b'.repeat(64))]);
 const maxRow=await tx(ledger,'publish',[max.t,maxBody],'maximum/note1024-title64',relayer);await trace(maxRow,wrapper);
 // Joint maximum uses bounded bytes, not expensive text classification.
 const maxFields=[...Array.from({length:8},(_,i)=>field(i+1,1,{width:32,ref:ref.typeId})),...Array.from({length:7},(_,i)=>field(i+9,3,{width:1,upper:255})),field(16,6,{upper:8192})];
 const jointD=descriptor(creator.address,e.id('paid/joint-max'),'d'.repeat(1382),maxFields);assert.equal(e.getBytes(jointD).length,4096);
 const joint=await install(registry,jointD,Array(8).fill(ref.typeId),e.ZeroAddress,e.ZeroAddress,'register/joint-max');
 const jointBody=e.concat([...Array(8).fill(ref.recordId),'0x01010101010101',uint(7927,2),'0x'+'00'.repeat(7927)]);assert.equal(e.getBytes(jointBody).length,8192);
 const jointRow=await tx(ledger,'publish',[joint.t,jointBody],'maximum/descriptor4096-fields16-refs8-body8192-bytes',relayer);await trace(jointRow,wrapper);
 const textD=descriptor(creator.address,e.id('paid/max-text'),'Full body text classification pressure.',[field(1,7,{upper:8190})]);const textMax=await install(registry,textD,[],e.ZeroAddress,e.ZeroAddress,'register/text8190');
 const refused=await tx(ledger,'publish',[textMax.t,text('a'.repeat(8190))],'maximum/text8190-shared300k-refusal',relayer,false);await trace(refused,wrapper);
 const destination=await deploy('TypeRegistry',[],'destination-registry'),destLedger=await deploy('Ledger',[destination.address,e.id('described-paid-destination')],'destination-ledger');
 await tx(destination,'registerDescribed',[note.descriptor,note.declarationSignature,e.ZeroAddress,e.ZeroAddress,'0x'],'destination/original-portable-declaration',relayer);
 await tx(destLedger,'publish',[note.typeId,body],'destination/same-record',relayer);assert.equal((await call(destLedger,'record',[id]))[3],body);
 await tx(destination,'retainDeclaration',[cd,sig(declarationDigest(installed.t))],'destination/custom-retain-only',relayer);
 assert.equal((await call(destination,'describedStatus',[installed.t]))[0],1n);assert.equal((await call(destination,'typeInfo',[installed.t]))[0],false);
 const legacy=await deploy('NoteV1Rule'),legacyShape=e.id('lab/type/note-ascii/v1');await tx(registry,'register',[legacyShape,legacy.address,[]],'legacy/note-register');
 const legacyT=(await call(registry,'typeIdOf',[legacyShape,legacy.address,[]]))[0];await tx(ledger,'publish',[legacyT,e.concat([e.toUtf8Bytes('NTV1'),text('a'.repeat(1024))])],'legacy/note1024',relayer);
 summary={checks:checks.length,transactions:txs.length,refusals:txs.filter(x=>!x.status).length,wrapperRuntimeHash:vectors.wrapperRuntimeHash,
  identity:{type:note.typeId,record:id,sourceRegistry:registry.address,destinationRegistry:destination.address},
  setupAmortization:[1,10,100,1000].map(admissions=>({admissions,customRegistrationPerAdmission:installed.row.gasUsed/BigInt(admissions)})),
  limits:'local paid receipts; no consensus proof, wallet UI, stateful custom migration or universal maxima claim'};
}catch(error){failure={message:error.message,stack:error.stack};console.error(error);}
finally{
 child.kill('SIGTERM');if(child.exitCode===null&&child.signalCode===null)await Promise.race([new Promise(ok=>child.once('exit',ok)),delay(3000)]);
 if(child.exitCode===null&&child.signalCode===null){child.kill('SIGKILL');await new Promise(ok=>child.once('exit',ok));}
 const retained={base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourcePins,artifacts:Object.fromEntries(Object.entries(artifacts).map(([name,a])=>[name,{file:a.file,artifactSha256:a.artifactSha256,runtime:a.runtime,creation:a.creation,metadata:a.metadata}])),
  anvil:{pid:child.pid,args,exitCode:child.exitCode,signalCode:child.signalCode,runDirectory:run,stderr},node:process.version,
  deployments,transactions:txs,checks,traces,summary,failure};
 await writeFile(join(output,'paid.json'),json(retained),{flag:'wx'});
 console.log(json({output,summary,failure,closed:child.exitCode!==null||child.signalCode!==null}));
}
if(failure)process.exitCode=1;
