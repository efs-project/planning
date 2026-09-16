// Task2 only: managed loopback, ordinary15M transactions, bounded canonical
// history reads. Never run against the owner demo. Evidence survives failures.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {createEnvironment} from './compact-environment.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';

const env=await createEnvironment({protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',indexFields:true});
const {ethers:e,contracts:c}=env,abi=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
const h=(types,values)=>e.keccak256(abi.encode(types,values));
const posting=(t,k,o,v)=>h(['bytes32','bytes32','uint256','uint256','bytes32'],[e.id('efs2/pk/1'),t,k,o,v]);
const record=(t,b)=>h(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),t,e.keccak256(b)]);
const pos=(p,s,r)=>h(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),p,s,r]);
const binding=(a,p)=>h(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),a,p]);
const scope=(a,p,s)=>h(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/vk/binding-scope/1'),a,p,s]);
const base={kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z};
const pub=(typeId,b)=>({...base,kind:1,typeId,bodyHashOrRecordId:e.keccak256(b)});
const findings=[],oracles=[];let failure;
const observed=async(key,fn,args,label)=>{
  const before=Array.from(await env.call(key,'counts')).map(String);
  const tx=await env.enqueue(label,{to:c[key].address,data:new e.Interface(c[key].abi).encodeFunctionData(fn,args),gasLimit:15_000_000});
  const receipt=await env.observe(tx),after=Array.from(await env.call(key,'counts')).map(String);
  findings.push({label,status:receipt.status,gasUsed:receipt.gasUsed,before,after});
  if(receipt.status==='REVERTED')assert.deepEqual(after,before,'refused source mutation');
  return receipt;
};
const execute=async(key,actions,bodies,label)=>observed(key,'execute',[actions,bodies,(await env.call(key,'nonces',[env.wallets.deployer.address]))[0]],label);
const replay=async(key,label)=>{
  const before=(await env.call(key,'lastProcessed'))[0],beforePub=(await env.call(key,'lastPublication'))[0];
  const tx=await env.enqueue(label,{to:c[key].address,data:new e.Interface(c[key].abi).encodeFunctionData('replayNextPublication'),gasLimit:15_000_000});
  const receipt=await env.observe(tx),after=(await env.call(key,'lastProcessed'))[0];
  findings.push({label,status:receipt.status,gasUsed:receipt.gasUsed,before:String(before),after:String(after)});
  if(receipt.status==='REVERTED'){assert.equal(after,before);assert.equal((await env.call(key,'lastPublication'))[0],beforePub);}
  return receipt;
};
const catchUp=async(key,core,label)=>{
  const through=(await env.call(core,'counts'))[3];
  while((await env.call(key,'lastPublication'))[0]<through)assert.equal((await replay(key,`${label}/${(await env.call(key,'lastPublication'))[0]+1n}`)).status,'SUCCESS');
};
const request=async(key,core)=>{
  const counts=await env.call(core,'counts');
  return [c[key].address,(await env.call(core,'indexModule'))[0],counts[0],counts[3],(await env.call(key,'manifestHash'))[0],c[key].codeHash,(await env.call(key,'generation'))[0]];
};
const register=async(label,refs=[])=>{
  const shape=e.id(label),[id]=await env.call('registry','typeIdOf',[shape,e.ZeroAddress,refs]);
  await env.transact('registry','register',[shape,e.ZeroAddress,refs],`type/${label}`);return id;
};

// Independently implemented public-getter history fold. No replay decoder,
// Index-produced effects, posting keys, coverage or current head/withdrawal bits
// are used to build expectations. Field specs are explicit fixture inputs.
async function canonical(core,specs,{files=false}={}){
  const maps=new Map(),heads=new Map(),occurrences=new Map(),retained=new Map(),liveScopes=new Map();
  const add=(key,ordinal,audit)=>{let row=maps.get(key);if(!row)maps.set(key,row={ordinals:[],live:0n,flags:audit?1n:0n});assert(!row.ordinals.length||row.ordinals.at(-1)<ordinal);row.ordinals.push(ordinal);row.live++;};
  const release=key=>{const row=maps.get(key);assert(row&&row.live>0n);row.live--;};
  const records=new Map(),refs=new Map();
  const getRecord=async id=>{if(!records.has(id)){const [t,first,,body]=await env.call(core,'record',[id]);assert.equal(record(t,body),id);records.set(id,{t,first,body});}return records.get(id);};
  const [through,,,pubs]=await env.call(core,'counts');let next=1n;
  for(let publication=1n;publication<=pubs;publication++){
    const ev=await env.call(core,'evidence',[publication]),ctx=(await env.call(core,'publicationContext',[publication]))[0];
    assert.equal(ev[4],next);assert(ev[3]>0n&&ev[3]<=64n);
    for(let leaf=0n;leaf<ev[3];leaf++,next++){
      const [kind,storedLeaf,p,bOrd,revision,,a,b]=await env.call(core,'admission',[next]);
      assert.equal(storedLeaf,leaf);assert.equal(p,publication);const author=ctx.principalId;
      if(kind===1n||kind===2n){
        const id=kind===1n?h(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),b,a]):a;
        const r=await getRecord(id);occurrences.set(next,{id,t:r.t,author,withdrawn:false});
        add(posting(r.t,1,0,Z),next,false);add(posting(Z,4,0,author),next,false);add(posting(Z,12,0,id),next,false);
        if(!retained.has(id)){
          assert.equal(r.first,next);retained.set(id,r);add(posting(r.t,13,0,Z),next,true);
          if(!refs.has(r.t))refs.set(r.t,(await env.call('registry','refTypes',[r.t]))[0]);
          const words=e.getBytes(r.body);const word=i=>e.hexlify(words.slice(i*32,i*32+32));
          for(let i=0;i<refs.get(r.t).length;i++)add(posting(r.t,11,i,word(i)),next,true);
          const spec=specs.find(s=>s.typeId===r.t);
          if(spec){
            for(let i=0;i<spec.scalars.length;i++){const s=spec.scalars[i];add(posting(r.t,14,i,h(['uint8','bytes32'],[s.kind,word(s.word)])),next,true);}
            if(spec.digest.enabled){const d=spec.digest;assert.equal(word(d.algorithmWord),d.algorithm);add(posting(Z,15,0,h(['bytes32','bytes32'],[d.algorithm,word(d.word)])),next,true);}
          }
        }
      }else if(kind===3n||kind===4n){
        const position=(await env.call(core,'bindingPosition',[bOrd]))[0],cell=await env.call(core,'positionCell',[position]);
        assert.equal(pos(...Array.from(cell)),position);const key=binding(author,position),s=scope(author,cell[0],cell[1]);
        const old=heads.get(key);assert.equal(old?.revision??0n,revision);if(old)assert.equal(old.ordinal,bOrd);
        if(kind===3n){if(!old)add(posting(Z,10,0,s),bOrd,true);if(old?.live)release(posting(Z,5,0,old.target));add(posting(Z,5,0,a),next,false);}
        else{assert(old?.live);release(posting(Z,5,0,old.target));}
        add(posting(Z,8,0,key),next,true);heads.set(key,{revision:revision+1n,ordinal:bOrd,target:kind===3n?a:Z,live:kind===3n});
        if(files&&cell[0]===e.id('efs2/purpose/folder/1')){
          let list=liveScopes.get(s);if(!list)liveScopes.set(s,list=[]);const at=list.indexOf(bOrd);
          if(kind===3n&&at<0)list.push(bOrd);
          if(kind===4n&&at>=0){list[at]=list.at(-1);list.pop();}
        }
      }else if(kind===6n){
        const target=BigInt(a),o=occurrences.get(target);assert(o&&!o.withdrawn&&o.author===author);o.withdrawn=true;
        release(posting(o.t,1,0,Z));release(posting(Z,4,0,o.author));release(posting(Z,12,0,o.id));
      }else if(kind===5n){
        const imported=(await env.call(core,'isImported',[publication]))[0];
        const creator=imported?(await env.call(core,'sourceEvidence',[publication]))[0].sourcePrincipal:author;
        assert.equal((await env.call(core,'subjectCreatedAt',[h(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),creator,a])]))[0],next);
      }else assert.fail(`unknown action ${kind}`);
    }
  }
  assert.equal(next-1n,through);return {maps,liveScopes,through,pubs};
}
async function compare(key,oracle,label){
  for(const [postingKey,want] of oracle.maps){
    const actual=Array.from(await env.call(key,'postingHead',[postingKey]));
    assert.deepEqual(actual,[BigInt(want.ordinals.length),want.live,want.ordinals.at(-1),want.flags],`${label} ${postingKey}`);
    for(let i=0;i<want.ordinals.length;i++)assert.equal((await env.call(key,'postingAt',[postingKey,i]))[0],want.ordinals[i]);
  }
  for(const [s,list] of oracle.liveScopes){
    const key_=posting(Z,10,0,s);assert.equal((await env.call(key,'liveCount',[key_]))[0],BigInt(list.length));
    for(let i=0;i<list.length;i++)assert.equal((await env.call(key,'liveAt',[key_,i]))[0],list[i]);
  }
  oracles.push({label,index:c[key].address,through:String(oracle.through),publications:String(oracle.pubs),postings:[...oracle.maps],liveScopes:[...oracle.liveScopes]});
}

try{
  const target=await register('replay/target'),source=await register('replay/eight',Array(8).fill(target));
  const specs=[{typeId:source,scalars:[{kind:2,word:8},{kind:1,word:11},{kind:2,word:12},{kind:1,word:13}],digest:{enabled:true,word:10,algorithmWord:9,algorithm:e.toBeHex(1,32)}}];
  await env.deploy('core','Ledger.sol','Ledger',[c.registry.address,e.id('replay/main')]);
  await env.deploy('active','ProfiledIndexModule.sol','ProfiledIndexModule',[c.core.address,specs]);
  await env.transact('core','setIndexModule',[c.active.address]);
  const targets=[];for(let i=0;i<8;i++){const b=abi.encode(['uint256'],[i+1]);targets.push(record(target,b));await env.transact('core','publish',[target,b],`seed/${i}`);}
  const body=n=>abi.encode(['bytes32[8]','uint256','uint256','bytes32','bytes32','uint256','bytes32'],[targets,n,1,e.toBeHex(n+100,32),e.toBeHex(n+200,32),n+300,e.toBeHex(n+400,32)]);
  const firstBody=body(1),id=record(source,firstBody);await env.transact('core','publish',[source,firstBody],'full-eight-four-fields');
  await execute('core',[{...base,kind:2,typeId:source,bodyHashOrRecordId:id}],['0x'],'reuse');
  await env.transact('core','publish',[source,firstBody],'republish');
  const p=e.id('efs2/purpose/head/1'),s=e.id('replay/file');
  await env.transact('core','bind',[p,s,Z,id,0],'bind');await env.transact('core','bind',[p,s,Z,targets[0],1],'overwrite');
  await env.transact('core','unbind',[p,s,Z,2],'unbind');await env.transact('core','bind',[p,s,Z,id,3],'rebind');
  await execute('core',[{...base,kind:6,target:e.toBeHex(9,32)}],['0x'],'withdraw-first');
  await env.deploy('replacement','ProfiledIndexModule.sol','ProfiledIndexModule',[c.core.address,specs]);
  const manifest=(await env.call('replacement','manifestHash'))[0];
  await replay('replacement','replay-prefix/1');
  await env.transact('core','publish',[source,body(2)],'old-active-keeps-writing');
  assert.equal((await env.call('core','indexModule'))[0].toLowerCase(),c.active.address.toLowerCase());
  assert.equal((await env.call('replacement','coverage',[e.id('efs2/family/by-type/1'),source]))[0],1n);
  await catchUp('replacement','core','replay-main');
  await compare('active',await canonical('core',specs),'old-active-all-families');
  await compare('replacement',await canonical('core',specs),'detached-replay-all-families');
  const stale=await request('replacement','core');await env.transact('core','publish',[source,body(3)],'concurrent-after-observed-readiness');
  assert.equal((await observed('core','replaceIndexWhenReady',[stale],'stale-cutover')).status,'REVERTED');
  await catchUp('replacement','core','replay-suffix');
  const oldFrontier=(await env.call('active','lastProcessed'))[0];
  assert.equal((await observed('core','replaceIndexWhenReady',[await request('replacement','core')],'checked-cutover')).status,'SUCCESS');
  assert.equal((await env.call('replacement','manifestHash'))[0],manifest);
  await env.transact('core','publish',[source,body(4)],'first-write-after-cutover');
  assert.equal((await env.call('active','lastProcessed'))[0],oldFrontier);assert.equal((await env.call('replacement','lastProcessed'))[0],oldFrontier+1n);
  await compare('replacement',await canonical('core',specs),'post-cutover-exactly-once');

  const guard=async(n,m,t,b,label)=>{
    const principals=Array.from({length:n},(_,i)=>e.toBeHex(i+1,32)),positions=Array.from({length:m},(_,i)=>e.id(`guard-position/${i}`));
    const heads=[];for(const position of positions)for(const principal of principals)heads.push((await env.call('core','headSnapshot',[principal,position]))[0]);
    const rs={principalIds:principals,positions,expectedHeads:heads};
    const [nonce]=await env.call('core','nonces',[env.wallets.deployer.address]),[execution]=await env.call('core','executionSet');
    assert.equal((await observed('core','executeGuarded',[[pub(t,b)],[b],nonce,execution,rs],label)).status,'SUCCESS');
  };
  await guard(1,1,target,abi.encode(['uint256'],[901]),'guard-ordinary-1x1-plain');
  await guard(64,4,target,abi.encode(['uint256'],[902]),'guard-wide-64x4-plain');
  await guard(1,1,source,body(5),'guard-ordinary-1x1-full-eight-fields');
  await guard(64,4,source,body(6),'guard-joint-64x4-full-eight-fields');

  // Largest attempted count, accurately labelled current unprofiled active
  // source, not an archival Task1 artifact. Expanded replay extracts real fields.
  const largeType=await register('replay/largest-field-record');
  await env.deploy('largeCore','Ledger.sol','Ledger',[c.registry.address,e.id('replay/largest')]);
  await env.deploy('largeActive','IndexModule.sol','IndexModule',[c.largeCore.address]);
  await env.transact('largeCore','setIndexModule',[c.largeActive.address]);
  for(const n of [55,64]){
    const actions=Array.from({length:n},(_,i)=>({...base,kind:5,salt:e.id(`large-create/${n}/${i}`)}));
    const receipt=await execute('largeCore',actions,actions.map(()=> '0x'),`largest-create-attempt/${n}`);
    if(n===55)assert.equal(receipt.status,'SUCCESS');
  }
  const largeBodies=Array.from({length:64},(_,i)=>abi.encode(['uint256','uint256'],[i+5000,1]));
  const largeReceipt=await execute('largeCore',largeBodies.map(b=>pub(largeType,b)),largeBodies,'largest-64-field-record-publication');
  if(largeReceipt.status==='REVERTED'){
    const n=32;assert.equal((await execute('largeCore',largeBodies.slice(0,n).map(b=>pub(largeType,b)),largeBodies.slice(0,n),'bounded-32-field-record-publication')).status,'SUCCESS');
  }
  const expanded=[{typeId:largeType,scalars:[0,1,2,3].map(()=>({kind:2,word:0})),digest:{enabled:true,word:0,algorithmWord:1,algorithm:e.toBeHex(1,32)}}];
  await env.deploy('largeReplay','ProfiledIndexModule.sol','ProfiledIndexModule',[c.largeCore.address,expanded]);
  await catchUp('largeReplay','largeCore','largest-publication-expanded-replay');
  await compare('largeReplay',await canonical('largeCore',expanded),'expanded-obligations-largest-admitted');
  assert.equal((await observed('largeCore','replaceIndexWhenReady',[await request('largeReplay','largeCore')],'largest-populated-cutover')).status,'SUCCESS');

  // Real Files history includes final Name-after-BIND, dense removal/rebind,
  // ciphertext field extraction and withdrawal; SDK reads a new pinned manifest.
  const t=env.manifest.types,folder=env.manifest.folder;
  const filesSpec=[{typeId:t.content,scalars:[{kind:2,word:4}],digest:{enabled:true,word:5,algorithmWord:3,algorithm:e.toBeHex(1,32)}}];
  const salt=e.id('replay/files'),principal=(await env.call('ledger','principalOf',[env.wallets.deployer.address]))[0];
  const file=h(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),principal,salt]);
  await env.transact('ledger','create',[salt]);const bytesBody=abi.encode(['bytes32'],[e.sha256('0x')]),bytesId=record(t.bytes,bytesBody);
  await env.transact('ledger','publish',[t.bytes,bytesBody]);
  const desc=abi.encode(['bytes32','uint256','uint256','uint256','uint256','bytes32','uint256','uint256','bytes32','uint256','bytes32'],[bytesId,1,1,1,17,e.sha256(e.toUtf8Bytes('ciphertext')),0,1,Z,1,Z]);
  const descId=record(t.content,desc);await env.transact('ledger','publish',[t.content,desc]);
  const revisionBody=abi.encode(['bytes32','bytes32'],[descId,file]),revision=record(t.carrierRoot,revisionBody);await env.transact('ledger','publish',[t.carrierRoot,revisionBody]);
  const label='a'.repeat(255),nameBody=e.hexlify(e.toUtf8Bytes(label)),role=e.keccak256(nameBody),F=e.id('efs2/purpose/folder/1');
  const fileActions=[{...base,kind:3,purpose:p,subject:file,target:revision},{...base,kind:3,purpose:F,subject:folder,role,target:file},pub(t.name,nameBody)];
  assert.equal((await execute('ledger',fileActions,['0x','0x',nameBody],'files-name-after-bind-255')).status,'SUCCESS');
  await env.transact('ledger','unbind',[F,folder,role,1],'files-remove');await env.transact('ledger','bind',[F,folder,role,file,2],'files-rebind');
  const descFirst=(await env.call('ledger','record',[descId]))[1];await execute('ledger',[{...base,kind:6,target:e.toBeHex(descFirst,32)}],['0x'],'files-withdraw-descriptor-occurrence');
  await env.deploy('filesReplay','ProfiledFilesIndex.sol','ProfiledFilesIndex',c.index.constructorArgs);
  await catchUp('filesReplay','ledger','files-replay');
  await compare('filesReplay',await canonical('ledger',filesSpec,{files:true}),'files-canonical-all-touched-families');
  assert.equal((await observed('ledger','replaceIndexWhenReady',[await request('filesReplay','ledger')],'files-populated-cutover')).status,'SUCCESS');
  await env.deploy('replayLens','FilesLiveIndex.sol','FilesLiveLens',[c.ledger.address,c.filesReplay.address]);
  await env.deploy('replayFiles','FilesJoinedConsumer.sol','FilesJoinedConsumer',[c.ledger.address,c.replayLens.address,c.filesReplay.address,t.root,t.child,env.manifest.ruleHashes.root,env.manifest.ruleHashes.child]);
  await env.deploy('replayJoined','FilesPageReader.sol','FilesPageReader',[c.ledger.address,c.replayLens.address,c.filesReplay.address]);
  const manifestNew={...env.manifest,contracts:{...env.manifest.contracts,index:c.filesReplay,lens:c.replayLens,files:c.replayFiles,joined:c.replayJoined}};
  const sdk=createFilesCompactSdk({ethers:e,rpc:env.rpc,manifest:manifestNew,journal:await env.createJournal('replayed-files')});
  const context=await sdk.pin(),listed=await sdk.listFolder({folder,authors:[env.wallets.deployer.address],context,budget:64});
  assert.equal(listed.coverage,'COMPLETE');assert.equal(listed.value.length,1);assert.equal(listed.value[0].file,file);assert.equal(listed.value[0].name.value,label);
  const page=await sdk.listFolderPage({folder,authors:[env.wallets.deployer.address],context,budget:64});
  assert.equal(page.queryCoverage,'COMPLETE');assert.equal(page.pageRows.length,1);
  findings.push({label:'actual-replacement-Files-SDK',attachment:String((await env.call('filesReplay','attachedFrom'))[0]),provenFrom:String((await env.call('filesReplay','provenFrom'))[0]),file,name:label,listCoverage:listed.coverage,joinedCoverage:page.queryCoverage});
}catch(error){failure={message:error.message,stack:error.stack};throw error;}
finally{
  try{
    const sources={};for(const path of ['src/IndexModule.sol','src/IndexReplaySource.sol','src/Interfaces.sol','src/Ledger.sol','src/PublicationSupport.sol','src/IndexSource.sol','src/IndexFieldProfile.sol','src/ProfiledIndexModule.sol','src/Keys.sol','src/ExecutionSlots.sol','src/IndexWork.sol','test/ProfiledFilesIndex.sol','test/FilesCarrierProfile.sol','test/FilesDirectoryProfile.sol','test/FilesLiveIndex.sol','test/FilesNamesProfile.sol','test/FilesJoinedProfile.sol','test/FilesJoinedConsumer.sol','test/FilesPageReader.sol','browser/compact-sdk.mjs','browser/compact-sdk-v2.mjs','browser/compact-files-sdk.mjs','script/compact-environment.mjs','script/core-index-replay.mjs'])sources[path]=createHash('sha256').update(await readFile(new URL('../'+path,import.meta.url))).digest('hex');
    const helpers=[];for(const key of ['active','replacement','largeActive','largeReplay','index','filesReplay'])if(c[key]){
      const [address]=await env.call(key,'replayDecoder'),code=await env.rpc('eth_getCode',[address,'latest']);helpers.push({parent:key,address,codehash:e.keccak256(code),runtimeBytes:e.getBytes(code).length});
    }
    const report={status:failure?'FAILED':'COMPLETE',failure,findings,oracles,sources,contracts:c,helpers,transactions:env.transactions,historyPolicy:env.historyPolicy,runDirectory:env.dir,evidence:'LOCAL_RPC_OBSERVED_NOT_STATE_PROOF'};
    const output=new URL('../core-closeout-index-replay-20260915/',import.meta.url);await mkdir(output,{recursive:true});
    await writeFile(new URL(failure?`failed-${env.port}-paid.json.gz`:'paid.json.gz',output),gzipSync(JSON.stringify(report,(_,v)=>typeof v==='bigint'?String(v):v,2)));
    console.log(JSON.stringify({status:report.status,failure,findings,contracts:Object.fromEntries(Object.entries(c).map(([k,v])=>[k,{runtime:v.runtimeBytes,initcode:v.initcodeBytes}]))},(_,v)=>typeof v==='bigint'?String(v):v,2));
  }finally{await env.close();}
}
