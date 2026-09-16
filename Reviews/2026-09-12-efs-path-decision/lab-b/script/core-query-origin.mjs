// Finite paid origin-query evidence. Fresh managed loopback only, ordinary15M,
// history256/cache512, no tracing or owner-demo access. Canonical raw-history
// oracle never uses Lens results, index postings, current heads or stored flags.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {createEnvironment} from './compact-environment.mjs';

const env=await createEnvironment({protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',indexFields:true});
const {ethers:e,contracts:c}=env,abi=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash,t=env.manifest.types,folder=env.manifest.folder;
const F=e.id('efs2/purpose/folder/1'),H=e.id('efs2/purpose/head/1'),T=e.id('efs2/purpose/tag/1');
const hash=(types,values)=>e.keccak256(abi.encode(types,values));
const record=(type,body)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),type,e.keccak256(body)]);
const position=(p,s,r)=>hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),p,s,r]);
const base={kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z};
const bind=(purpose,subject,role,target,expectedRevision)=>({...base,kind:3,purpose,subject,role,target,expectedRevision});
const pub=(typeId,b)=>({...base,kind:1,typeId,bodyHashOrRecordId:e.keccak256(b)});
const execute=async(actions,bodies,label,who='deployer')=>env.transact('ledger','execute',[actions,bodies,(await env.call('ledger','nonces',[env.wallets[who].address]))[0]],label,who);
const basis=async()=>[(await env.call('ledger','counts'))[0],(await env.call('index','generation'))[0],(await env.call('registry','epoch'))[0],(await env.call('ledger','executionSet'))[0]];
const facts=[],contexts=new Map(),cells=new Map(),records=new Map(),findings=[],oracles=[];
let failure,companion,retainedInventoryGap;
const getRecord=async id=>{
  if(!records.has(id)){
    const [type,first,,body]=await env.call('ledger','record',[id]);assert.equal(record(type,body),id);
    records.set(id,{type,first,body});
  }
  return records.get(id);
};
async function rawOracle(A,principals,query,retained=false){
  for(let at=BigInt(facts.length)+1n;at<=A;at++){
    const a=await env.call('ledger','admission',[at]),publication=a[2];
    if(!contexts.has(publication))contexts.set(publication,(await env.call('ledger','publicationContext',[publication]))[0].principalId);
    const f={at,kind:Number(a[0]),ordinal:a[3],revision:a[4]+1n,target:a[6],author:contexts.get(publication)};
    if(f.kind===3||f.kind===4){
      if(!cells.has(f.ordinal)){
        const [pos]=await env.call('ledger','bindingPosition',[f.ordinal]),cell=Array.from(await env.call('ledger','positionCell',[pos]));
        assert.equal(position(...cell),pos);cells.set(f.ordinal,{pos,p:cell[0],s:cell[1],r:cell[2]});
      }
      Object.assign(f,cells.get(f.ordinal));
    }
    facts.push(f);
  }
  const heads=new Map(),dense=new Map(),audit=new Map(),scope=(author,p,s)=>`${author}/${p}/${s}`;
  for(const f of facts){
    if(f.at>A)break;if(f.kind!==3&&f.kind!==4)continue;
    heads.set(`${f.author}/${f.pos}`,f);
    if(f.p!==F)continue;
    const key=scope(f.author,f.p,f.s),list=dense.get(key)??[];dense.set(key,list);
    const history=audit.get(key)??[];audit.set(key,history);if(!history.includes(f.ordinal))history.push(f.ordinal);
    const i=list.indexOf(f.ordinal);
    if(f.kind===3&&i<0)list.push(f.ordinal);
    else if(f.kind===4&&i>=0){list[i]=list.at(-1);list.pop();}
  }
  const zeroSelected=()=>({status:0,target:Z,revision:0,principalId:Z,admission:0});
  const select=(p,s,r)=>{
    const pos=position(p,s,r);
    for(const author of principals){const f=heads.get(`${author}/${pos}`);if(f)return {status:f.kind===3?1:2,target:f.kind===3?f.target:Z,revision:f.revision,principalId:author,admission:f.at};}
    return zeroSelected();
  };
  const tag=(s,target)=>{const selection=select(T,s,query.concept);return {qualification:1,subject:s,selection,present:selection.status===1&&selection.target===target};};
  const rows=[];let rawTotal=0;
  for(let k=0;k<principals.length;k++){
    const list=(retained?audit:dense).get(scope(principals[k],F,folder))??[];rawTotal+=list.length;
    for(const ordinal of list){
      const cell=cells.get(ordinal),f=heads.get(`${principals[k]}/${cell.pos}`);
      if(f.kind!==3)continue;
      if(principals.slice(0,k).some(p=>heads.has(`${p}/${cell.pos}`)))continue;
      assert.equal(f.kind,3);const nameId=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),t.name,cell.r]),name=await getRecord(nameId);
      assert(name.first<=A);const head=select(H,f.target,Z);
      let header={qualification:0,recordId:Z,typeId:Z,firstAdmission:0,bodyLength:0,parent:Z,descriptor:Z};
      if(head.status===1){const r=await getRecord(head.target);assert.equal(r.type,t.root);assert(r.first<=A);assert.equal(e.hexlify(e.getBytes(r.body).slice(0,32)),f.target);
        header={qualification:1,recordId:head.target,typeId:r.type,firstAdmission:r.first,bodyLength:e.getBytes(r.body).length,parent:Z,descriptor:Z};}
      const stableTag=tag(f.target,f.target),revisionTag=head.status===1?tag(head.target,f.target):{qualification:0,subject:Z,selection:zeroSelected(),present:false};
      const row={placement:{position:cell.pos,principalId:principals[k],target:f.target,revision:f.revision,admission:f.at},role:cell.r,
        name:{qualification:1,recordId:nameId,firstAdmission:name.first,value:name.body},kind:1,head,header,stableTag,revisionTag,matchStatus:1};
      const tagMatch=query.tagScope===0||(query.tagScope===1?stableTag.present:query.tagScope===2?revisionTag.present:stableTag.present||revisionTag.present);
      if(tagMatch&&e.toUtf8String(name.body).includes(query.search))rows.push(row);
    }
  }
  return {rows,rawTotal,originScopeCounts:principals.map(p=>(audit.get(scope(p,F,folder))??[]).length)};
}

const rowArrayType=new e.Interface(c.joined.abi).getFunction('readPage').outputs[0].components.find(x=>x.name==='rows');
const rowType=rowArrayType.arrayChildren;
async function start(key,principals,query,readerKey='joined'){
  const b=await basis(),session=e.id(key),oracle=await rawOracle(b[0],principals,query,readerKey==='retained-reader');
  await env.deploy(key,'FilesQueryAccumulator.sol','FilesQueryAccumulator',[c[readerKey].address,folder,principals,query,b,session]);
  const commitment=(await env.call(key,'queryCommitment'))[0];
  const inventoryPin=readerKey==='retained-reader'?hash(['string','uint64','bytes32[]','bytes32','uint64[]'],['efs.files-retained-prefix/1',b[0],principals,folder,oracle.originScopeCounts]):Z;
  return {key,principals,query,b,session,oracle,rows:[],commitment,steps:0,readerKey,inventoryPin,started:false};
}
async function step(run,budget,label=run.key,allowRevert=false){
  const before=(await env.call(run.key,'scanned'))[0];
  const tx=await env.enqueue(`${label}/step-${++run.steps}`,{to:c[run.key].address,data:new e.Interface(c[run.key].abi).encodeFunctionData('step',[run.session,budget]),gasLimit:15_000_000});
  const receipt=await env.observe(tx),after=(await env.call(run.key,'scanned'))[0];
  const finding={label:receipt.label,status:receipt.status,gasUsed:receipt.gasUsed,principals:run.principals.length,budget,origin:String(run.b[0]),observedCurrent:String((await env.call('ledger','counts'))[0]),scannedBefore:String(before),scannedAfter:String(after)};findings.push(finding);
  if(receipt.status!=='SUCCESS'){assert(allowRevert);assert.equal(after,before);return false;}
  const iface=new e.Interface(c[run.key].abi),events=receipt.receipt.logs.map(l=>{try{return iface.parseLog(l);}catch{return null;}}),rowsEvent=events.find(l=>l?.name==='Rows');assert(rowsEvent);
  const prefix=events.find(l=>l?.name==='PrefixWork');assert(prefix);finding.prefixComparisons=String(prefix.args.comparisons);finding.prefixGasDiagnostic=String(prefix.args.gasDiagnostic);
  if(!run.started){run.commitment=hash(['bytes32','bytes32','uint64'],[run.commitment,run.inventoryPin,run.oracle.rawTotal]);run.started=true;}
  assert.equal((await env.call(run.key,'inventoryPin'))[0],run.inventoryPin,'origin lengths differ from independent raw admissions');
  const rows=abi.decode([rowArrayType],rowsEvent.args.encodedRows)[0];
  for(const row of rows){run.rows.push(row);run.commitment=hash(['bytes32','bytes32'],[run.commitment,e.keccak256(abi.encode([rowType],[row]))]);}
  assert.equal((await env.call(run.key,'resultCommitment'))[0],run.commitment);
  assert.equal((await env.call(run.key,'originAdmission'))[0],run.b[0]);
  assert.equal((await env.call(run.key,'rawTotal'))[0],BigInt(run.oracle.rawTotal));
  return true;
}
async function finish(run,budget,between){
  for(let page=0;page<16;page++){
    await step(run,budget);
    if((await env.call(run.key,'complete'))[0]){
      assert.equal(abi.encode([rowArrayType],[run.rows]),abi.encode([rowArrayType],[run.oracle.rows]),'paid exact rows differ from independent raw-history origin reducer');
      assert.equal((await env.call(run.key,'rowCount'))[0],BigInt(run.oracle.rows.length));
      assert.equal((await env.call(run.key,'originAbsent'))[0],run.oracle.rows.length===0);
      oracles.push({key:run.key,origin:String(run.b[0]),rawTotal:run.oracle.rawTotal,rows:run.oracle.rows,commitment:run.commitment});return;
    }
    if(between)await between(page);
  }
  assert.fail('finite 16-page bound exceeded');
}

try{
  const principal=(await env.call('ledger','principalOf',[env.wallets.deployer.address]))[0],alice=(await env.call('ledger','principalOf',[env.wallets.alice.address]))[0];
  const files=[];
  for(let i=0;i<8;i++){
    const salt=e.id(`query/file/${i}`),file=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),principal,salt]);
    const name=e.hexlify(e.toUtf8Bytes(`q${i}`)),body=e.concat([abi.encode(['bytes32'],[file]),e.toUtf8Bytes(`origin-${i}`)]),revision=record(t.root,body);
    await execute([{...base,kind:5,salt},pub(t.root,body),bind(H,file,Z,revision,0),pub(t.name,name),bind(F,folder,e.keccak256(name),file,0)],['0x',body,'0x',name,'0x'],`fixture/file-${i}`);
    files.push({file,revision,name,headRevision:1,stableRevisions:new Map(),revisionRevisions:new Map()});
  }
  const query={concept:e.id('query/concept'),tagScope:0,diagnosticHead:false,search:''};
  const run=await start('unrelated',[principal,alice],query);
  await finish(run,1,async page=>{
    await env.transact('ledger','publish',[t.name,e.hexlify(e.toUtf8Bytes(`noise-${page}`))],`unrelated-between-${page}`);
    if(page===0){
      for(const i of [0,7]){
        const f=files[i],body=e.concat([abi.encode(['bytes32'],[f.file]),e.toUtf8Bytes(`later-${i}`)]),revision=record(t.root,body);
        await execute([pub(t.root,body),bind(H,f.file,Z,revision,f.headRevision++),bind(T,f.file,query.concept,f.file,0),bind(T,revision,query.concept,f.file,0)],[body,'0x','0x','0x'],`selected-post-origin-joins-${i}`);f.revision=revision;
      }
    }
  });
  const run2=await start('unselected',[principal,alice],query);
  await finish(run2,1,async page=>{
    const f=files[0];await execute([bind(F,folder,e.keccak256(f.name),f.file,page),bind(H,f.file,Z,f.revision,page),bind(T,f.file,query.concept,f.file,page)],['0x','0x','0x'],`unselected-same-folder-head-tag-${page}`,'bob');
  });
  // Explicit measured combinations, not an assertion that P64 x B256 x
  // arbitrary history depth composes under15M. Each depth run changes all
  // three joins on one later candidate64 times after the origin start.
  for(const P of [1,8,64]){
    const principals=[...Array.from({length:P-1},(_,i)=>e.toBeHex(i+1,32)),principal];
    const q={...query,concept:e.id(`deep/${P}`),tagScope:3,search:''};
    const deep=await start(`deep-${P}`,principals,q);await step(deep,1);
    let stress;if(P===64){stress=await start('stress-64',principals,q);await step(stress,1);}
    const f=files[7];
    for(let block=0;block<8;block++){
      const actions=[];
      for(let i=0;i<8;i++){const n=block*8+i;actions.push(bind(H,f.file,Z,f.revision,f.headRevision++),bind(T,f.file,q.concept,f.file,n),bind(T,f.revision,q.concept,f.file,n));}
      await execute(actions,actions.map(()=> '0x'),`deepen-${P}-${block}`);
    }
    await finish(deep,P===1?7:P===8?4:1);
    if(stress){
      const fits=await step(stress,7,'joint-P64-B7-deep64',true);
      if(!fits)await finish(stress,1);else{
        assert((await env.call(stress.key,'complete'))[0]);assert.equal((await env.call(stress.key,'rowCount'))[0],0n);assert.equal((await env.call(stress.key,'originAbsent'))[0],true);
      }
    }
  }
  const [state]=await env.call('index','scopeState'),[pin]=await env.call('index','scopeStateCodehash');
  const code=await env.rpc('eth_getCode',[state,'latest']);
  const helper=new e.Interface(['function ledger() view returns(address)','function writer() view returns(address)']);
  const helperCall=async fn=>helper.decodeFunctionResult(fn,await env.rpc('eth_call',[{to:state,data:helper.encodeFunctionData(fn)},'latest']))[0];
  companion={address:state,codehash:e.keccak256(code),pin,runtimeBytes:e.getBytes(code).length,ledger:await helperCall('ledger'),writer:await helperCall('writer')};
  assert.equal(companion.codehash,pin);assert.equal(companion.ledger.toLowerCase(),c.ledger.address.toLowerCase());assert.equal(companion.writer.toLowerCase(),c.index.address.toLowerCase());
  assert.equal((await env.call('index','PHYSICAL_PROFILE'))[0],(await env.call('index','replayReadiness'))[0].physicalProfile);
  await env.deploy('retained-lens','FilesRetainedLens.sol','FilesRetainedLens',[c.ledger.address,c.index.address]);
  await env.deploy('retained-reader','FilesPageReader.sol','FilesPageReader',[c.ledger.address,c['retained-lens'].address,c.index.address]);
  const retained=await start('retained-churn',[principal],query,'retained-reader');
  await finish(retained,1,async page=>{
    const f=files[7],name=e.hexlify(e.toUtf8Bytes(`retained-rename-${page}`));
    await execute([pub(t.name,name),{...base,kind:4,purpose:F,subject:folder,role:e.keccak256(f.name),expectedRevision:1},bind(F,folder,e.keccak256(name),f.file,0)],[name,'0x','0x'],`retained-selected-churn-${page}`);f.name=name;
  });
  assert.notEqual((await env.call(retained.key,'inventoryPin'))[0],Z);
  const churn=await start('selected-churn',[principal],query);await step(churn,1);
  let oldRole=e.keccak256(files[7].name);
  for(let i=0;i<16;i++){
    const name=e.hexlify(e.toUtf8Bytes(`renamed-${i}`)),role=e.keccak256(name);
    await execute([pub(t.name,name),{...base,kind:4,purpose:F,subject:folder,role:oldRole,expectedRevision:1},bind(F,folder,role,files[7].file,0)],[name,'0x','0x'],`selected-churn-${i}`);oldRole=role;
  }
  assert.equal(await step(churn,1,'selected-churn-refuses',true),false);
  assert.equal((await env.call(churn.key,'complete'))[0],false);
  // Quantify the stronger alternative's later-origin inventory amplification.
  // The completed churn scan pinned eight origin candidates, not these31.
  const scopeHash=hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/vk/binding-scope/1'),principal,F,folder]);
  const key=hash(['bytes32','bytes32','uint256','uint256','bytes32'],[e.id('efs2/pk/1'),Z,10,0,scopeHash]);
  const lifetime=(await env.call('index','postingHead',[key]))[0],live=(await env.call('index','liveCount',[key]))[0];
  assert.equal(lifetime,31n);assert.equal(live,8n);
  retainedInventoryGap={implemented:true,measuredProfile:'P1, candidate budget1, origin length8;7 selected-folder renames between8 paid pages',originLengthPin:(await env.call(retained.key,'inventoryPin'))[0],selectedRenames:23,fixtureLifetimeCandidates:String(lifetime),fixtureDenseCandidates:String(live),candidateAmplificationAtNewOrigin:31/8,remainingGap:'P64/deep-inventory prefix discovery and joint maxima not measured; no fixed lifetime-inventory work bound',costModel:'every page rediscovers origin prefix lengths by bisection, separately counted; a new retained-inventory query here scans31 candidates rather than8; placement and masks also use retained history; fast profile still refuses selected-folder churn'};
}catch(error){failure={message:error.message,stack:error.stack};throw error;}
finally{
  try{
    const sources={};for(const path of ['src/LensReader.sol','src/IndexModule.sol','src/Interfaces.sol','src/PublicationSupport.sol','test/FilesScopeState.sol','test/FilesLiveIndex.sol','test/FilesRetainedLens.sol','test/FilesPageReader.sol','test/FilesQueryAccumulator.sol','script/core-query-origin.mjs'])sources[path]=createHash('sha256').update(await readFile(new URL('../'+path,import.meta.url))).digest('hex');
    const report={status:failure?'FAILED':'COMPLETE',failure,findings,oracles,companion,retainedInventoryGap,sources,contracts:c,transactions:env.transactions,historyPolicy:env.historyPolicy,port:env.port,anvilPid:env.anvilPid,evidence:'LOCAL_RPC_OBSERVED_NOT_STATE_PROOF',limits:{ordinary:15000000,hard:16777216,runtime:24576,initcode:49152}};
    const output=new URL('../core-closeout-query-20260915/',import.meta.url);await mkdir(output,{recursive:true});
    await writeFile(new URL(failure?`failed-${env.port}-paid.json.gz`:'paid.json.gz',output),gzipSync(JSON.stringify(report,(_,v)=>typeof v==='bigint'?String(v):v,2)));
    console.log(JSON.stringify({status:report.status,failure,findings,companion,retainedInventoryGap},null,2));
  }finally{await env.close();}
}
