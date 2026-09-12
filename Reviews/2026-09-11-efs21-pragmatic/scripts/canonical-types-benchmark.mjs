// One finite runner, explicit source-backed arms. No persistent demo or raised EVM caps.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,statfsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {withWorld,E,ROOT,observeBody} from './world.mjs';
import {sourceProfile} from '../sdk/qualification.mjs';
import {largeInputs,payloadCases} from './canonical-economics-inputs.mjs';
import {failureReceipts} from './discovery-failures.mjs';
const abi=E.AbiCoder.defaultAbiCoder(),vault=resolve(ROOT,'../..');
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
const git=args=>{const r=spawnSync('git',args,{cwd:vault,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const calldataGas=hex=>E.getBytes(hex).reduce((n,b)=>n+(b?16:4),0);
const recordId=(canonical,type,body)=>E.keccak256(abi.encode(canonical?['bytes32','bytes32','bytes32']:['bytes32','bytes32','bytes'],[E.id(canonical?'efs2/record/1':'EFS21_RECORD_V1'),type,canonical?E.keccak256(body):body]));
function sourceGate(source){assert.equal(git(['rev-parse','HEAD']),source);assert.equal(git(['status','--porcelain','--untracked-files=all']),'','final requires clean frozen source/support');}
const diskGate=()=>{const s=statfsSync(ROOT);assert(s.bavail*s.bsize>20*1024**3,'20GiB free floor');};
export const primaryLabels=['namespace root','directory setup','quote create3000','quote edit3100','quote same3100','quote stale refusal',...payloadCases().flatMap(([n])=>[n+' create',n+' fresh edit',n+' same edit']),'direct new Record','direct dedup','facade new Record','facade dedup','permissionless contract Record','permissionless contract dedup','quote contract publish','quote contract update','paid unrelated quote path Type value','paid unrelated payload capture','paid direct Record 1','paid direct Record 2','paid facade Record 1','paid facade Record 2','paid File metadata','paid history metadata','paid directory page','Discovery attach required','Discovery backfill required','paid Discovery query','attached required quote edit','Discovery detach','Discovery attach tolerated','Discovery backfill tolerated','attached tolerated quote edit','rename','unlink'];
export function comparePrimaryRows(old,candidate){
 for(const rows of [old,candidate]){
  assert.equal(new Set(rows.map(r=>r.label)).size,rows.length,'unique operation labels');
  assert.deepEqual(rows.filter(r=>!r.referenceOnly&&!r.capabilityOnly).map(r=>r.label).sort(),[...primaryLabels].sort(),'exact expected shared primary labels');
 }
 return primaryLabels.map(label=>{const a=old.find(r=>r.label===label),b=candidate.find(r=>r.label===label);return {label,oldGas:a.gasUsed,canonicalGas:b.gasUsed,deltaGas:String(BigInt(b.gasUsed)-BigInt(a.gasUsed)),oldCalldataGas:a.calldataGas,canonicalCalldataGas:b.calldataGas,oldBodyBytes:a.bodyBytes,canonicalBodyBytes:b.bodyBytes};});
}

export async function measure({mode='probe',output}={}){
 assert(['probe','old-old','final'].includes(mode));diskGate();
 if(output){assert(!existsSync(output)&&!existsSync(output+'.code.json.gz'),'exclusive evidence paths');}
 const source=git(['rev-parse','HEAD']);if(mode==='final')sourceGate(source);
 const report={format:'efs21-canonical-types-economics/1',mode,status:'INCOMPLETE',sourceCommit:source,sourceStatus:git(['status','--porcelain']),limits:{transactionGas:16777216,blockGas:16777216,runtime:24576,initcode:49152,body:4096,payload:4094,cache:24575,groupResponse:131072,preparedResponse:8192,input:163840,groupGas:15000000,prepareGas:5000000},arms:[],unsupportedCapabilities:[],comparison:null};
 const inventory={format:'efs21-canonical-types-inventory/1',sourceCommit:source,code:{},profiles:{},artifacts:{}};
 const addCode=code=>{const hash=E.keccak256(code);inventory.code[hash]??=code;return hash;};
 const profiles=mode==='probe'?['canonical-ref-free-v1']:mode==='old-old'?['baseline-4cb0042','baseline-4cb0042']:['baseline-4cb0042','canonical-ref-free-v1'];
 // Assert the exact legal fixture arithmetic before any finite world.
 const large=largeInputs();
 try{
 for(const selection of profiles){
  diskGate();
  const result=await withWorld(async w=>{
   const c=w.client,canonical=selection==='canonical-ref-free-v1',type=canonical?w.config.bytesType:w.config.rawType;
   const arm={selection,config:w.config,provenance:w.provenance,rows:[],transactions:[],bodies:[],registrations:[],groups:[],readEffects:[],checks:{},cleanup:w.node.cleanup};report.arms.push(arm);
   inventory.profiles[selection]=sourceProfile(selection);
   const operation=async(label,action,extra={})=>{
    const count=w.actions.length,before={...c.metrics};let value,error;
    try{value=await action();}catch(e){error=e;}
    const a=w.actions.at(-1);assert(w.actions.length>count,'actual paid operation '+label);
    const row={label,hash:a.hash,status:a.status,gasUsed:a.gasUsed,calldataBytes:a.calldataBytes,calldataGas:calldataGas(a.calldata),calldataHash:a.calldataHash,receiptStatus:a.receipt.status,context:'new transaction; same ordered workload; prior consumer/storage state retained',qualificationRpc:Object.fromEntries(Object.keys(before).map(k=>[k,c.metrics[k]-before[k]])),...extra};
    arm.rows.push(row);if(error&&!extra.expectedRefusal)throw error;if(extra.expectedRefusal)assert(error,'expected reached refusal '+label);return value??a;
   };
   const write=(label,method,args,extra)=>operation(label,()=>c.write(method,args,label),extra);
   const paid=(label,target,iface,method,args=[],extra)=>operation(label,()=>c.sendData(label,iface.encodeFunctionData(method,args),target),extra);
   const call=async(target,iface,method,args=[],basis)=> (await c.call(method,args,basis,target,iface)).value;
   const k=new E.Interface(w.config.abi),ri=new E.Interface(w.artifact(canonical?'CanonicalTypeRegistry':'ExpandedTypeRegistry').abi),di=new E.Interface(w.artifact('DiscoveryIndex').abi);
   const helper=canonical?w.config.graph.PreparationHelper:null,registry=w.config.graph.types;
   try{
    const basis=await c.observe();arm.initialQualification={basis,metrics:{...c.metrics}};
    if(mode==='probe'){
     const body=abi.encode(['uint256'],[3000]);await paid('probe record',w.config.kernel,k,'storeRecord',[w.config.quoteType,body]);assert.equal((await c.record(recordId(true,w.config.quoteType,body))).value.body,body);arm.checks.probe=true;
    }else{
     await write('namespace root','ensureRoot',[]);const root=(await c.call('rootId',[w.config.namespace])).value;
     await write('directory setup','createDirectory',[root,E.toUtf8Bytes('measure')]);const folder=(await c.call('lookup',[w.config.namespace,root,E.toUtf8Bytes('measure')])).value;
     const files={};let expectedFileNonce=1n;
     const create=async(label,name,t,body,extra={})=>{
      const a=await write(label,'createFile',[folder,E.toUtf8Bytes(name),t,body],extra);const expected=E.keccak256(abi.encode(['bytes32','uint256','address','address','uint256'],[E.id('EFS21_FILE_V1'),31337,w.config.kernel,w.config.namespace,++expectedFileNonce]));assert.equal(a.fileId,expected,'independent deployment-and-owner File ID');files[name]=a.fileId;return a.fileId;
     };
     const quote0=abi.encode(['uint256'],[3000]),quote1=abi.encode(['uint256'],[3100]);
     const quote=await create('quote create3000','quote',w.config.quoteType,quote0,{appValue:'3000'});
     await write('quote edit3100','editFile',[quote,1,w.config.quoteType,quote1],{appValue:'3100'});
     await write('quote same3100','editFile',[quote,2,w.config.quoteType,quote1],{appValue:'3100'});
     const before=(await c.call('fileInfo',[quote])).value;
     await write('quote stale refusal','editFile',[quote,1,w.config.quoteType,quote0],{expectedRefusal:true});assert.deepEqual([...(await c.call('fileInfo',[quote])).value],[...before]);
     for(const [name,payload]of payloadCases()){
      const body=c.encodePayload(type,payload),expectedRecord=recordId(canonical,type,body),meta={payloadHash:E.keccak256(payload),payloadBytes:E.getBytes(payload).length,bodyBytes:E.getBytes(body).length,typeId:type,recordId:expectedRecord};
      const f=await create(name+' create',name,type,body,meta);assert.equal((await c.call('fileInfo',[f])).value.recordId,expectedRecord);
      assert.equal((await c.record(expectedRecord)).value.body,body);
      const storage=await observeBody(w,expectedRecord,body,await c.observe());if(storage.code){storage.codeHash=addCode(storage.code);delete storage.code;}arm.bodies.push({...meta,name,storage});
      const next=E.getBytes(payload);if(next.length)next[next.length-1]^=1;const fresh=next.length?E.hexlify(next):'0x01';const nextBody=c.encodePayload(type,fresh),nextId=recordId(canonical,type,nextBody);
      await write(name+' fresh edit','editFile',[f,1,type,nextBody],{payloadHash:E.keccak256(fresh),payloadBytes:E.getBytes(fresh).length,bodyBytes:E.getBytes(nextBody).length,recordId:nextId});
      await write(name+' same edit','editFile',[f,2,type,nextBody],{payloadHash:E.keccak256(fresh),payloadBytes:E.getBytes(fresh).length,bodyBytes:E.getBytes(nextBody).length,recordId:nextId});
      assert.equal((await c.call('revisionAt',[f,1])).value.recordId,expectedRecord);assert.equal((await c.call('revisionAt',[f,2])).value.recordId,nextId);assert.equal((await c.call('fileInfo',[f])).value.revision,3n);
     }
     const recordKernel=w.config.graph.NativeRecordKernel,rki=new E.Interface(w.artifact('NativeRecordKernel').abi);
     const directBody=abi.encode(['uint256'],[7777]),directId=recordId(canonical,w.config.quoteType,directBody);
     await paid('direct new Record',recordKernel,rki,'storeRecord',[w.config.quoteType,directBody]);await paid('direct dedup',recordKernel,rki,'storeRecord',[w.config.quoteType,directBody]);
     const facadeBody=abi.encode(['uint256'],[8888]);await paid('facade new Record',w.config.kernel,k,'storeRecord',[w.config.quoteType,facadeBody]);await paid('facade dedup',w.config.kernel,k,'storeRecord',[w.config.quoteType,facadeBody]);
     const producer=await w.deploy('RecordProducer'),pi=new E.Interface(w.artifact('RecordProducer').abi),producerBody=abi.encode(['uint256'],[9999]);
     await paid('permissionless contract Record',producer,pi,'publish',[recordKernel,w.config.quoteType,producerBody]);await paid('permissionless contract dedup',producer,pi,'publish',[recordKernel,w.config.quoteType,producerBody]);assert.equal((await c.call('fileNonce',[producer])).value,0n);
     const qp=new E.Interface(w.artifact('QuoteProducer').abi),qr=new E.Interface(w.artifact('QuoteReader').abi);
     await paid('quote contract publish',w.producer,qp,'publish',[3000,0]);await paid('quote contract update',w.producer,qp,'publish',[3100,1]);await paid('paid unrelated quote path Type value',w.consumer,qr,'read',[w.config.kernel,w.producer,w.config.quoteType]);assert.equal((await call(w.consumer,qr,'read',[w.config.kernel,w.producer,w.config.quoteType]))[0],3100n);
     const payloadName=canonical?'CanonicalPayloadConsumer':'PayloadConsumer',payloadConsumer=await w.deploy(payloadName,canonical?[type]:[w.config.bytesType,type]),pci=new E.Interface(w.artifact(payloadName).abi);
     await paid('paid unrelated payload capture',payloadConsumer,pci,'capture',[w.config.kernel,w.config.namespace,['measure','tiny'].map(s=>E.toUtf8Bytes(s))]);assert.equal(await call(payloadConsumer,pci,'lastDigest'),E.keccak256('0xef008001'));
     const bodyConsumer=await w.deploy('BodyReadConsumer'),bci=new E.Interface(w.artifact('BodyReadConsumer').abi);
     for(const [path,target]of [['direct',recordKernel],['facade',w.config.kernel]])for(const count of [1,2]){await paid(`paid ${path} Record ${count}`,bodyConsumer,bci,'capture',[target,directId,count],{readContext:count===2?'two reads in one transaction; second account/slots warm':'one read in new transaction'});assert.equal(await call(bodyConsumer,bci,'lastDigest'),E.keccak256(directBody));assert.equal(await call(bodyConsumer,bci,'lastReads'),BigInt(count));}
     const readProbe=await w.deploy('PaidReadProbe'),readInterface=new E.Interface(w.artifact('PaidReadProbe').abi);let readCount=0;
     const unrelated=async(label,target,iface,method,args)=>{
      const input=iface.encodeFunctionData(method,args),expected=(await c.call(method,args,undefined,target,iface)).value;
      if(method==='fileInfo')assert.deepEqual([...expected],[w.config.namespace,false,true,3n,recordId(canonical,w.config.quoteType,quote1)]);
      if(method==='revisionAt')assert.deepEqual([...expected],[recordId(canonical,w.config.quoteType,quote0),folder,E.hexlify(E.toUtf8Bytes('quote')),true]);
      if(method==='listDirectory'){
       assert(expected.complete);assert.deepEqual(expected[0].map(x=>x.id),Object.values(files));
       for(const entry of expected[0]){const name=E.toUtf8String(entry.name);assert.equal(files[name],entry.id);assert.equal(entry.file.owner,w.config.namespace);assert.equal(entry.file.revision,3n);assert(entry.file.live&&!entry.file.directory);if(name==='quote')assert.equal(entry.file.recordId,recordId(canonical,w.config.quoteType,quote1));else{const original=payloadCases().find(([n])=>n===name)[1],next=E.getBytes(original);if(next.length)next[next.length-1]^=1;assert.equal(entry.file.recordId,recordId(canonical,type,c.encodePayload(type,next.length?E.hexlify(next):'0x01')));}}
      }
      if(method==='page'){assert(expected.complete);assert.deepEqual([...expected.ids],[quote]);}
      const outputs=iface.getFunction(method).outputs,encoded=iface.encodeFunctionResult(method,outputs.length===1?[expected]:[...expected]);
      await paid(label,readProbe,readInterface,'capture',[target,input],{readContext:'unrelated benchmark STATICCALL; 8192-byte returndata bound before copy; new transaction, prior probe storage retained'});
      const digest=await call(readProbe,readInterface,'lastDigest'),length=await call(readProbe,readInterface,'lastLength'),count=await call(readProbe,readInterface,'lastReads');
      assert.equal(digest,E.keccak256(encoded));assert.equal(length,BigInt(E.getBytes(encoded).length));assert.equal(count,BigInt(++readCount));
      arm.readEffects.push({label,probe:readProbe,target,input,expectedReturn:encoded,digest,length,count,basis:await c.observe()});
     };
     for(const [label,method,args]of [['paid File metadata','fileInfo',[quote]],['paid history metadata','revisionAt',[quote,1]],['paid directory page','listDirectory',[w.config.namespace,folder,[E.ZeroHash,0,0],32]]]){
      await paid('direct reference '+label,w.config.kernel,k,method,args,{referenceOnly:true,readContext:'direct paid view transaction'});
      await unrelated(label,w.config.kernel,k,method,args);
     }
     const discovery=w.config.graph.DiscoveryIndex;await paid('Discovery attach required',discovery,di,'attach',[w.config.quoteType,true]);let status=await call(discovery,di,'status',[w.config.namespace]);await paid('Discovery backfill required',discovery,di,'backfill',[w.config.namespace,status.epoch,0,64]);
     await paid('direct reference paid Discovery query',discovery,di,'page',[w.config.namespace,status.epoch,3100,[E.ZeroHash,0,0],64],{referenceOnly:true});await unrelated('paid Discovery query',discovery,di,'page',[w.config.namespace,status.epoch,3100,[E.ZeroHash,0,0],64]);assert((await call(discovery,di,'page',[w.config.namespace,status.epoch,3100,[E.ZeroHash,0,0],64])).complete);
     await write('attached required quote edit','editFile',[quote,3,w.config.quoteType,abi.encode(['uint256'],[3200])]);
     await paid('Discovery detach','' + discovery,di,'detach');await paid('Discovery attach tolerated',discovery,di,'attach',[w.config.quoteType,false]);status=await call(discovery,di,'status',[w.config.namespace]);await paid('Discovery backfill tolerated',discovery,di,'backfill',[w.config.namespace,status.epoch,0,64]);await write('attached tolerated quote edit','editFile',[quote,4,w.config.quoteType,abi.encode(['uint256'],[3300])]);
     await write('rename','moveFile',[files.tiny,3,folder,E.toUtf8Bytes('renamed')]);await write('unlink','unlink',[files.tiny,4]);assert.equal((await c.call('revisionAt',[files.tiny,1])).value.recordId,recordId(canonical,type,c.encodePayload(type,'0xef008000')));assert.equal((await c.call('fileInfo',[files.tiny])).value.live,false);
     // Legacy ABI framing is an additional named reference, not a primary normalization.
     if(!canonical)for(const [name,payload]of payloadCases().filter(([n])=>['empty','tiny','payload4032'].includes(n)))await create('legacy ABI '+name,'abi-'+name,w.config.bytesType,c.encodePayload(w.config.bytesType,payload),{referenceOnly:true,payloadBytes:E.getBytes(payload).length,bodyBytes:E.getBytes(c.encodePayload(w.config.bytesType,payload)).length});
     const boundaryPayload=E.hexlify(new Uint8Array(canonical?4094:4096).fill(0x41)),boundaryBody=c.encodePayload(type,boundaryPayload);
     await paid(canonical?'canonical payload4094 boundary':'raw payload4096 boundary',w.config.kernel,k,'storeRecord',[type,boundaryBody],{referenceOnly:true,payloadBytes:E.getBytes(boundaryPayload).length,bodyBytes:E.getBytes(boundaryBody).length});
     const rejectedBody=canonical?'0x0fff'+'41'.repeat(4095):'0x'+'41'.repeat(4097);
     const nonceBefore=await c.rpc('eth_getTransactionCount',[w.config.graph.BodyWriter,'latest']);
     await paid(canonical?'canonical payload4095 refusal':'raw payload4097 refusal',w.config.kernel,k,'storeRecord',[type,rejectedBody],{referenceOnly:true,expectedRefusal:true});assert.equal(await c.rpc('eth_getTransactionCount',[w.config.graph.BodyWriter,'latest']),nonceBefore);
     arm.checks={sameAppValue:true,independentFileIds:true,quoteValue:3300,historyRetained:true,payloadCases:payloadCases().map(([name,p])=>({name,hash:E.keccak256(p),length:E.getBytes(p).length}))};
     arm.reachedFailures=await failureReceipts(w);
     // All admitted Record postings remain unique, independent of live Files.
     const ii=new E.Interface(w.artifact('RecordInventoryIndex').abi);for(const t of [type,w.config.quoteType]){const inv=await call(w.config.graph.RecordInventoryIndex,ii,'typeInventory',[t,[E.ZeroHash,0,0],64]);assert.equal(new Set(inv.ids).size,inv.ids.length);assert(inv.complete);}
    }
    if(canonical){
     const d=sourceProfile(selection).canonical.defaultGroup,hi=new E.Interface(w.artifact('PreparationHelper').abi);
     const retainGroup=async g=>{assert.equal(await call(registry,ri,'groupBytes',[g.groupHash]),g.raw);const members=[];for(const id of g.ids){const info=await call(registry,ri,'typeInfo',[id]),cache=await call(registry,ri,'cacheBytes',[id]);assert.equal(E.keccak256(cache),info.cacheHash);assert.equal(E.getBytes(cache).length,Number(info.cacheLength));members.push({typeId:id,info:[...info],cache});}arm.groups.push({groupId:g.groupHash,raw:g.raw,members});};
     await retainGroup(d);
     const helperNonce=await c.rpc('eth_getTransactionCount',[helper,'latest']);await paid('register exact repeat',registry,ri,'registerGroup',[d.raw],{capabilityOnly:true});assert.equal(await c.rpc('eth_getTransactionCount',[helper,'latest']),helperNonce);
     if(mode!=='probe'){
      const g=JSON.parse(readFileSync(ROOT+'contracts/test/fixtures/canonical-types-golden.json')).groups.bool;
      await paid('register independent second group',registry,ri,'registerGroup',[g.raw],{capabilityOnly:true});await retainGroup(g);
      const quoteBody=abi.encode(['uint256'],[3000]),prepareArgs=[arm.groups[0].members[0].cache,d.ids[0],quoteBody,recordId(true,d.ids[0],quoteBody),E.ZeroHash,[E.ZeroHash,E.ZeroHash,E.ZeroHash],true];
      const prepared=await call(helper,hi,'prepareRecord',prepareArgs);assert.equal(prepared.references.length,0);assert.equal(prepared.occurrenceKeys.length,0);assert.equal(prepared.effect.kind,0n);arm.helperPrepared={bodyOnly:true,typeId:d.ids[0],body:quoteBody,result:prepared};
      await paid('paid helper bodyOnly prepare',helper,hi,'prepareRecord',prepareArgs,{capabilityOnly:true});
      for(const [label,method,args]of [['paid group bytes','groupBytes',[d.groupHash]],['paid selected Type','typeInfo',[d.ids[0]]],['paid selected cache','cacheBytes',[d.ids[0]]]])await paid(label,registry,ri,method,args,{capabilityOnly:true});
      for(const input of large){
       const before=await c.rpc('eth_getTransactionCount',[helper,'latest']),next=E.getCreateAddress({from:helper,nonce:BigInt(before)}),beforeCode=await c.rpc('eth_getCode',[next,'latest']);
       const item={name:input.name,groupId:input.groupHash,groupBytes:input.groupBytes,cacheBytes:input.cacheBytes,aggregateCacheBytes:input.aggregateCacheBytes,completeResponseBytes:input.completeResponseBytes,helperNonceBefore:before};
       let helperError=null,compiled;
       try{compiled=hi.decodeFunctionResult('compileGroup',await c.rpc('eth_call',[{to:helper,data:hi.encodeFunctionData('compileGroup',[input.raw]),gas:E.toBeHex(16777216)},'latest']))[0];assert.deepEqual(compiled.types.map(t=>t.cacheBytes),input.caches);}catch(e){helperError={message:e.message,data:e.data};}
       item.helperRead={supported:!helperError,error:helperError};
       await paid('large helper '+input.name,helper,hi,'compileGroup',[input.raw],{expectedRefusal:!!helperError,capabilityOnly:true});
       let refusal;try{await c.rpc('eth_call',[{to:registry,data:ri.encodeFunctionData('registerGroup',[input.raw]),gas:E.toBeHex(16777216)},'latest']);}catch(e){refusal={message:e.message,data:e.data};}assert(refusal,'named legal unsupported bridge case');
       await paid('large registration '+input.name,registry,ri,'registerGroup',[input.raw],{expectedRefusal:true,capabilityOnly:true});
       assert.equal(await c.rpc('eth_getTransactionCount',[helper,'latest']),before);assert.equal(await c.rpc('eth_getCode',[next,'latest']),beforeCode);await assert.rejects(()=>call(registry,ri,'groupBytes',[input.groupHash]));for(const id of input.ids)await assert.rejects(()=>call(registry,ri,'typeInfo',[id]));
       const errorInterface=new E.Interface(w.config.errorAbi);try{const parsed=errorInterface.parseError(refusal.data);item.decodedRefusal={name:parsed.name,args:[...parsed.args]};}catch{}
       item.helperPaidGas=arm.rows.find(r=>r.label==='large helper '+input.name).gasUsed;
       item.registrationPaidGas=arm.rows.find(r=>r.label==='large registration '+input.name).gasUsed;
       item.registrationRefusal=refusal;item.rollback='helper nonce, next cache code, group and all Type absences checked';item.classification=input.name==='boundary'?'legal Type exceeds one cache-code representation':item.decodedRefusal?.name==='HelperOutput'?'legal aggregate exceeds bounded helper response; not invalid schema or outer OOG':'legal aggregate refused by bounded helper execution; exact RPC error and paid gas distinguish from output refusal';arm.registrations.push(item);report.unsupportedCapabilities.push({selection,...item});
      }
     }
    }
    return {};
   }finally{
    arm.finalQualification=await c.observe();arm.totalRpc={...c.metrics};
    const transactions=[...w.setup,...w.actions];const unique=[...new Map(transactions.map(t=>[t.hash,t])).values()];
    for(const t of unique){
     const tx=await c.rpc('eth_getTransactionByHash',[t.hash]),signed=await c.rpc('eth_getRawTransactionByHash',[t.hash]);assert.equal(E.keccak256(signed),t.hash);
     const block=await c.rpc('eth_getBlockByHash',[t.receipt.blockHash,false]);assert.equal(block.hash,t.receipt.blockHash);
     arm.transactions.push({label:t.label,phase:t.phase,signed,transaction:tx,receipt:t.receipt,block,gasUsed:t.gasUsed,calldataBytes:E.getBytes(tx.input).length,calldataGas:calldataGas(tx.input)});
    }
    arm.deployments=[];
    for(const [name,runtime]of Object.entries(w.provenance.runtimes)){const code=await c.rpc('eth_getCode',[runtime.address,arm.finalQualification.blockNumber]);assert.equal(E.keccak256(code),runtime.codeHash);arm.deployments.push({...runtime,name,codeInventoryHash:addCode(code)});inventory.artifacts[selection+':'+name]=w.artifact(name);}
    for(const type of arm.finalQualification.selectedTypes??[]){const code=await c.rpc('eth_getCode',[type.cacheCode,arm.finalQualification.blockNumber]);arm.deployments.push({name:'cache '+type.typeId,address:type.cacheCode,runtimeBytes:E.getBytes(code).length,codeInventoryHash:addCode(code)});}
    for(const group of arm.groups)for(const member of group.members){const address=member.info[3],code=await c.rpc('eth_getCode',[address,arm.finalQualification.blockNumber]);assert.equal(code,'0x00'+member.cache.slice(2));member.cacheCodeHash=addCode(code);arm.deployments.push({name:'group cache '+member.typeId,address,runtimeBytes:E.getBytes(code).length,codeInventoryHash:member.cacheCodeHash});}
    // Failure driver code is test-only and separately identified, never a product coordinator.
    for(const item of arm.reachedFailures?.cases??[])for(const [name,address]of [['faultDriver',item.driver],['faultIndex',item.index]]){const code=await c.rpc('eth_getCode',[address,arm.finalQualification.blockNumber]);arm.deployments.push({name,address,runtimeBytes:E.getBytes(code).length,codeInventoryHash:addCode(code)});}
    if(arm.reachedFailures){arm.reachedFailures={standing:arm.reachedFailures.standing,testFixture:arm.reachedFailures.testFixture,limitations:arm.reachedFailures.limitations,cases:arm.reachedFailures.cases.map(({actions,...rest})=>({...rest,actions:actions.map(a=>({hash:a.hash,label:a.label,status:a.status,gasUsed:a.gasUsed,benchmarkCanonicalCheck:a.benchmarkCanonicalCheck}))}))};}
   }
  },{kernelArtifact:selection,buildFirst:mode!=='final',watchdogMs:240000});
  report.arms.at(-1).cleanup=result.cleanup;assert(result.cleanup.stopped&&result.cleanup.cacheRemoved);
  console.log(selection+': '+report.arms.at(-1).transactions.length+' paid transactions, owned cleanup confirmed');
 }
 if(mode==='old-old'){
  const signature=a=>({transactions:a.transactions.map(t=>({label:t.label,gas:t.gasUsed,input:t.transaction.input,to:t.transaction.to,status:t.receipt.status,calldataGas:t.calldataGas})),checks:a.checks,rows:a.rows.map(({hash,qualificationRpc,...r})=>r)});
  assert.deepEqual(signature(report.arms[0]),signature(report.arms[1]),'old-old comparator requires identical setup/calldata/gas/logical outcomes');report.comparison={oldOldExact:true,sameAppValue:true};
 }else if(mode==='final'){
  const [old,candidate]=report.arms;assert.deepEqual(old.checks,candidate.checks);report.comparison={sameAppValue:true,rows:comparePrimaryRows(old.rows,candidate.rows),nonprimary:{old:old.rows.filter(r=>r.referenceOnly||r.capabilityOnly).map(r=>({label:r.label,referenceOnly:!!r.referenceOnly,capabilityOnly:!!r.capabilityOnly})),canonical:candidate.rows.filter(r=>r.referenceOnly||r.capabilityOnly).map(r=>({label:r.label,referenceOnly:!!r.referenceOnly,capabilityOnly:!!r.capabilityOnly}))},limitations:['Canonical Type/Record identity only; native File identity and caller authority unchanged','Metadata/history/directory/Discovery use identical benchmark-only bounded STATICCALL probe; direct paid views retained as named references','Required/tolerated reached failures use separately deployed actual test-only driver/index; not production-hook failure gas','No full-C0 portable authorship, effects, plural Lens, restore or upgrade parity','Legal large Types remain unsupported; no universal lower bound or savings threshold']};
 }
 if(mode==='final')sourceGate(source);report.status='MEASURED';
 }catch(e){report.failure={message:e.message,stack:e.stack};}
 const expanded=Buffer.from(JSON.stringify(plain(inventory))),compressed=gzipSync(expanded);assert(expanded.length<=64*1024**2&&compressed.length<=16*1024**2,'bounded code inventory');report.codeInventory={expandedBytes:expanded.length,gzipBytes:compressed.length,gzipHash:E.keccak256(compressed),file:output?output+'.code.json.gz':null};
 const json=JSON.stringify(plain(report),null,2)+'\n';assert(Buffer.byteLength(json)<=8*1024**2,'bounded summary');
 if(output){writeFileSync(output+'.code.json.gz',compressed,{flag:'wx'});writeFileSync(output,json,{flag:'wx'});}
 return plain(report);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const flags=process.argv.slice(2),mode=flags.includes('--final')?'final':flags.includes('--old-old')?'old-old':'probe';
 const output=flags.includes('--output')?resolve(flags[flags.indexOf('--output')+1]):null;
 if(mode==='final')assert(output,'final requires an exclusive output path');
 const report=await measure({mode,output});console.log(JSON.stringify({mode,status:report.status,failure:report.failure,comparison:report.comparison,unsupported:report.unsupportedCapabilities.map(x=>({name:x.name,helperRead:x.helperRead,registrationRefusal:x.registrationRefusal})),output}));if(report.status!=='MEASURED')process.exitCode=1;
}
