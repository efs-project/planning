// One finite selection-only experiment. No tracing, shared-transaction warming,
// public RPC, cap tuning or historical-evidence overwrite. Default output is temp.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {createEnvironment,loadEthers} from './compact-environment.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';

const output=process.env.EFS_SELECTION_HEAD_OUTPUT
  ?resolve(process.env.EFS_SELECTION_HEAD_OUTPUT):await mkdtemp(join(tmpdir(),'efs-selection-head-'));
if(process.env.EFS_SELECTION_HEAD_OUTPUT)await mkdir(output); // EEXIST refuses before any chain starts.
const lab=new URL('../',import.meta.url),out=process.env.FOUNDRY_OUT;
assert(out,'explicit assigned artifact directory');
const e=await loadEthers(),abi=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
const json=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v,2);
const hash=(types,values)=>e.keccak256(abi.encode(types,values));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const targets=[['Ledger.sol','Ledger',64],['LensReader.sol','LensReader',64],['FilesLiveIndex.sol','FilesLiveLens',64],
  ['SelectionHeadControl.sol','RawHeadFilesLiveLens',64],['FilesPageReader.sol','FilesPageReader',96],
  ['FilesQueryAccumulator.sol','FilesQueryAccumulator',null],['ProfiledFilesIndex.sol','ProfiledFilesIndex',608]];
const pins={base:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources:{},artifacts:[],node:process.version,
  anvil:execFileSync(process.env.ANVIL_BIN??'anvil',['--version'],{encoding:'utf8'}).trim()};
for(const [file,name,args] of targets){
  const bytes=await readFile(join(out,file,name+'.json')),a=JSON.parse(bytes),m=a.metadata;
  assert.equal(m.compiler.version,'0.8.30+commit.73712a01');assert.equal(m.settings.optimizer.runs,200);
  assert.equal(m.settings.optimizer.enabled,true);assert.equal(m.settings.viaIR,true);assert.equal(m.settings.evmVersion,'cancun');
  for(const [path,pin] of Object.entries(m.sources)){
    const source=await readFile(new URL(path,lab));assert.equal(e.keccak256(source),pin.keccak256,`${name} stale source: ${path}`);
    pins.sources[path]={sha256:sha(source),keccak256:pin.keccak256};
  }
  const runtime=e.getBytes(a.deployedBytecode.object).length,creation=e.getBytes(a.bytecode.object).length;
  const initcode=args===null?null:creation+args;
  assert(runtime<=24576,`${name} runtime cap`);assert(initcode===null||initcode<=49152,`${name} initcode cap`);
  pins.artifacts.push({file,name,artifactSha256:sha(bytes),compiler:m.compiler,settings:m.settings,runtime,creation,
    constructorArgumentBytes:args,initcode,creationSha256:sha(e.getBytes(a.bytecode.object)),runtimeTemplateSha256:sha(e.getBytes(a.deployedBytecode.object))});
}
for(const path of ['script/core-selection-head-cost.mjs','script/compact-environment.mjs','script/compact-read-transport.mjs',
  'browser/compact-sdk.mjs','browser/compact-sdk-v2.mjs','browser/compact-files-sdk.mjs','browser/compact-content.mjs','foundry.toml']){
  const bytes=await readFile(new URL(path,lab));pins.sources[path]={sha256:sha(bytes),keccak256:e.keccak256(bytes)};
}
await writeFile(join(output,'pins.json'),json(pins)+'\n',{flag:'wx'});
const env=await createEnvironment({protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',indexFields:true});
const c=env.contracts,t=env.manifest.types,folder=env.manifest.folder;
const F=e.id('efs2/purpose/folder/1'),H=e.id('efs2/purpose/head/1'),T=e.id('efs2/purpose/tag/1');
const record=(type,body)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),type,e.keccak256(body)]);
const position=(p,s,r)=>hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),p,s,r]);
const base={kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z};
const bind=(purpose,subject,role,target,expectedRevision)=>({...base,kind:3,purpose,subject,role,target,expectedRevision});
const pub=(typeId,body)=>({...base,kind:1,typeId,bodyHashOrRecordId:e.keccak256(body)});
const execute=async(actions,bodies,label,who='deployer')=>env.transact('ledger','execute',[actions,bodies,(await env.call('ledger','nonces',[env.wallets[who].address]))[0]],label,who);
const basis=async()=>[(await env.call('ledger','counts'))[0],(await env.call('index','generation'))[0],(await env.call('registry','epoch'))[0],(await env.call('ledger','executionSet'))[0]];
const facts=[],contexts=new Map(),cells=new Map(),records=new Map(),rawEvidence=[],findings=[],runs=[],rowControls=[];
let failure,decision,sdkControl;
const getRecord=async id=>{
  if(!records.has(id)){
    const row=await env.call('ledger','record',[id]),[type,first,,body]=row;assert.equal(record(type,body),id);
    records.set(id,{type,first,body});rawEvidence.push({method:'record',key:id,row:Array.from(row)});
  }
  return records.get(id);
};
// Independent reducer reads canonical admissions/context/position preimages and
// full retained record bytes. Never Lens output, index postings or current heads.
async function rawOracle(A,principals,query){
  for(let at=BigInt(facts.length)+1n;at<=A;at++){
    const a=await env.call('ledger','admission',[at]),publication=a[2];rawEvidence.push({method:'admission',key:at,row:Array.from(a)});
    if(!contexts.has(publication)){
      const context=(await env.call('ledger','publicationContext',[publication]))[0];contexts.set(publication,context.principalId);
      rawEvidence.push({method:'publicationContext',key:publication,row:Array.from(context)});
    }
    const f={at,kind:Number(a[0]),ordinal:a[3],revision:a[4]+1n,target:a[6],author:contexts.get(publication)};
    if(f.kind===3||f.kind===4){
      if(!cells.has(f.ordinal)){
        const [pos]=await env.call('ledger','bindingPosition',[f.ordinal]),cell=Array.from(await env.call('ledger','positionCell',[pos]));
        assert.equal(position(...cell),pos);cells.set(f.ordinal,{pos,p:cell[0],s:cell[1],r:cell[2]});
        rawEvidence.push({method:'position',ordinal:f.ordinal,pos,cell});
      }
      Object.assign(f,cells.get(f.ordinal));
    }
    facts.push(f);
  }
  const heads=new Map(),dense=new Map(),scope=(author,p,s)=>`${author}/${p}/${s}`;
  for(const f of facts){
    if(f.at>A)break;if(f.kind!==3&&f.kind!==4)continue;heads.set(`${f.author}/${f.pos}`,f);
    if(f.p!==F)continue;const key=scope(f.author,F,f.s),list=dense.get(key)??[];dense.set(key,list);
    const i=list.indexOf(f.ordinal);if(f.kind===3&&i<0)list.push(f.ordinal);else if(f.kind===4&&i>=0){list[i]=list.at(-1);list.pop();}
  }
  const zero=()=>({status:0,target:Z,revision:0,principalId:Z,admission:0});
  const select=(p,s,r)=>{const pos=position(p,s,r);for(const author of principals){const f=heads.get(`${author}/${pos}`);
    if(f)return {status:f.kind===3?1:2,target:f.kind===3?f.target:Z,revision:f.revision,principalId:author,admission:f.at};}return zero();};
  const tag=(s,target)=>{const selection=select(T,s,query.concept);return {qualification:1,subject:s,selection,present:selection.status===1&&selection.target===target};};
  const rows=[];let rawTotal=0;
  for(let k=0;k<principals.length;k++){
    const list=dense.get(scope(principals[k],F,folder))??[];rawTotal+=list.length;
    for(const ordinal of list){
      const cell=cells.get(ordinal),f=heads.get(`${principals[k]}/${cell.pos}`);
      if(f.kind!==3||principals.slice(0,k).some(p=>heads.has(`${p}/${cell.pos}`)))continue;
      const nameId=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),t.name,cell.r]),name=await getRecord(nameId);
      assert(name.first<=A);const head=select(H,f.target,Z);assert.equal(head.status,1,'finite fixture has a live origin HEAD');
      const r=await getRecord(head.target);assert.equal(r.type,t.root);assert(r.first<=A);assert.equal(e.hexlify(e.getBytes(r.body).slice(0,32)),f.target);
      const row={placement:{position:cell.pos,principalId:principals[k],target:f.target,revision:f.revision,admission:f.at},role:cell.r,
        name:{qualification:1,recordId:nameId,firstAdmission:name.first,value:name.body},kind:1,head,
        header:{qualification:1,recordId:head.target,typeId:r.type,firstAdmission:r.first,bodyLength:e.getBytes(r.body).length,parent:Z,descriptor:Z},
        stableTag:tag(f.target,f.target),revisionTag:tag(head.target,f.target),matchStatus:1};
      const match=query.tagScope===0||(query.tagScope===1?row.stableTag.present:query.tagScope===2?row.revisionTag.present:row.stableTag.present||row.revisionTag.present);
      if(match&&e.toUtf8String(name.body).includes(query.search))rows.push(row);
    }
  }
  return {rows,rawTotal};
}
const rowArrayType=new e.Interface(c.joined.abi).getFunction('readPage').outputs[0].components.find(x=>x.name==='rows'),rowType=rowArrayType.arrayChildren;
const encodeRows=rows=>abi.encode([rowArrayType],[rows]);
async function start(key,readerKey,principals,query,b){
  const oracle=await rawOracle(b[0],principals,query),session=e.id(key);
  await env.deploy(key,'FilesQueryAccumulator.sol','FilesQueryAccumulator',[c[readerKey].address,folder,principals,query,b,session]);
  const queryType='tuple(bytes32 concept,uint8 tagScope,bool diagnosticHead,string search)',basisType='tuple(uint64 admission,uint64 generation,uint64 epoch,bytes32 executionSet)';
  const commitment=hash(['string','address','address','bytes32','address','bytes32','bytes32[]',queryType,basisType],
    ['efs.files-owned-origin/1',c[key].address,env.wallets.deployer.address,session,c[readerKey].address,folder,principals,query,b]);
  assert.equal((await env.call(key,'queryCommitment'))[0],commitment,'recompute reader/session-specific domain');
  return {key,readerKey,principals,query,b,session,oracle,rows:[],commitment,steps:0,gas:[],started:false};
}
async function step(run,{refuse=false}={}){
  const before=(await env.call(run.key,'scanned'))[0],oldCommitment=(await env.call(run.key,'resultCommitment'))[0];
  const tx=await env.enqueue(`${run.key}/step-${++run.steps}`,{to:c[run.key].address,data:new e.Interface(c[run.key].abi).encodeFunctionData('step',[run.session,1]),gasLimit:15_000_000});
  const receipt=await env.observe(tx),after=(await env.call(run.key,'scanned'))[0],C=(await basis())[0];
  findings.push({key:run.key,step:run.steps,status:receipt.status,gasUsed:receipt.gasUsed,A:run.b[0],C,scannedBefore:before,scannedAfter:after,transactionHash:tx});
  if(refuse){assert.equal(receipt.status,'REVERTED');assert.equal(after,before);assert.equal((await env.call(run.key,'resultCommitment'))[0],oldCommitment);return;}
  assert.equal(receipt.status,'SUCCESS',run.key);run.gas.push(Number(receipt.gasUsed));
  const iface=new e.Interface(c[run.key].abi),events=receipt.receipt.logs.map(l=>{try{return iface.parseLog(l);}catch{return null;}});
  const rows=abi.decode([rowArrayType],events.find(l=>l?.name==='Rows').args.encodedRows)[0];
  if(!run.started){run.commitment=hash(['bytes32','bytes32','uint64'],[run.commitment,Z,run.oracle.rawTotal]);run.started=true;}
  for(const row of rows){run.rows.push(row);run.commitment=hash(['bytes32','bytes32'],[run.commitment,e.keccak256(abi.encode([rowType],[row]))]);}
  assert.equal((await env.call(run.key,'resultCommitment'))[0],run.commitment);assert.equal((await env.call(run.key,'inventoryPin'))[0],Z);
  assert.equal((await env.call(run.key,'originAdmission'))[0],run.b[0]);assert.equal((await env.call(run.key,'rawTotal'))[0],2n);
  assert.equal((await env.call(run.key,'unknownCount'))[0],0n);assert.equal((await env.call(run.key,'observedCurrent'))[0],C);
  assert.equal(after,BigInt(run.steps));assert.equal((await env.call(run.key,'selectedSoFar'))[0],after);
  assert.equal((await env.call(run.key,'complete'))[0],run.steps===2);
  if(run.steps===2){
    assert.equal(encodeRows(run.rows),encodeRows(run.oracle.rows));assert.equal((await env.call(run.key,'rowCount'))[0],BigInt(run.oracle.rows.length));
    assert.equal((await env.call(run.key,'originAbsent'))[0],run.oracle.rows.length===0);
    const deployment=env.transactions.find(x=>x.label===`deploy/${run.key}`);
    runs.push({key:run.key,readerKey:run.readerKey,P:run.principals.length,A:run.b[0],C,query:run.query,principals:run.principals,
      gas:run.gas,total:run.gas.reduce((a,b)=>a+b,0),deploymentGas:Number(deployment.gasUsed),initcodeBytes:c[run.key].initcodeBytes,
      rawTotal:run.oracle.rawTotal,rows:run.oracle.rows,encodedRows:encodeRows(run.rows),unknowns:0,absent:run.rows.length===0,commitment:run.commitment});
  }
}
// Negative filtered output alone cannot show row parity. Independently run an
// unfiltered two-page eth_call walk under the same A/C schedule in each reader.
async function probeStart(principals,query,b){
  const q={...query,tagScope:0},oracle=await rawOracle(b[0],principals,q),pages=[];
  for(const reader of ['raw-reader','joined']){
    const page=(await env.call(reader,'readPage',[folder,principals,q,b,'0x',1]))[0];assert.equal(encodeRows(page.rows),encodeRows(oracle.rows.slice(0,1)));
    pages.push({reader,cursor:page.continuation});
  }
  return {principals,q,b,oracle,pages};
}
async function probeFinish(probe,label){
  const results=[];
  for(const p of probe.pages){
    const page=(await env.call(p.reader,'readPage',[folder,probe.principals,probe.q,probe.b,p.cursor,1]))[0];
    assert.equal(encodeRows(page.rows),encodeRows(probe.oracle.rows.slice(1)));assert.equal(page.scanStatus,2n);assert.equal(page.rawTotal,2n);assert.equal(page.selectedSoFar,2n);
    results.push(encodeRows(page.rows));
  }
  assert.equal(results[0],results[1]);rowControls.push({label,A:probe.b[0],C:(await basis())[0],rows:probe.oracle.rows,encodedRows:encodeRows(probe.oracle.rows)});
}
try{
  await env.deploy('raw-lens','SelectionHeadControl.sol','RawHeadFilesLiveLens',[c.ledger.address,c.index.address]);
  await env.deploy('raw-reader','FilesPageReader.sol','FilesPageReader',[c.ledger.address,c['raw-lens'].address,c.index.address]);
  const principal=(await env.call('ledger','principalOf',[env.wallets.deployer.address]))[0],files=[];
  for(let i=0;i<2;i++){
    const salt=e.id(`selection/file/${i}`),file=hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),principal,salt]);
    const name=e.hexlify(e.toUtf8Bytes(`selection-${i}`)),body=e.concat([file,e.toUtf8Bytes(`origin-${i}`)]),revision=record(t.root,body);
    await execute([{...base,kind:5,salt},pub(t.root,body),bind(H,file,Z,revision,0),pub(t.name,name),bind(F,folder,e.keccak256(name),file,0)],['0x',body,'0x',name,'0x'],`fixture/file-${i}`);
    files.push({file,revision,name,headRevision:1});
  }
  for(const P of [1,8,64]){
    const principals=[...Array.from({length:P-1},(_,i)=>e.toBeHex(i+1,32)),principal];
    for(const mode of ['ordinary','historical']){
      const q={concept:e.id(`selection/${mode}/${P}`),tagScope:3,diagnosticHead:false,search:''},b=await basis();
      const raw=await start(`P${P}-${mode}-raw`,'raw-reader',principals,q,b),selected=await start(`P${P}-${mode}-selection`,'joined',principals,q,b);
      const probe=await probeStart(principals,q,b);await step(raw);await step(selected);
      if(mode==='historical'){
        const f=files[1];
        for(let block=0;block<8;block++){
          const actions=[];for(let i=0;i<8;i++){const n=block*8+i;actions.push(bind(H,f.file,Z,f.revision,f.headRevision++),bind(T,f.file,q.concept,f.file,n),bind(T,f.revision,q.concept,f.file,n));}
          await execute(actions,actions.map(()=> '0x'),`churn/P${P}/${block}`);
        }
      }
      await step(raw);await step(selected);await probeFinish(probe,`P${P}-${mode}`);
      assert.equal(encodeRows(raw.rows),encodeRows(selected.rows));
    }
  }
  const positive=e.id('selection/positive');
  for(const f of files)await execute([bind(T,f.file,positive,f.file,0),bind(T,f.revision,positive,f.file,0)],['0x','0x'],'fixture/positive-tags');
  const principals=[...Array.from({length:63},(_,i)=>e.toBeHex(i+1,32)),principal],q={concept:positive,tagScope:3,diagnosticHead:false,search:''},b=await basis();
  const positiveRaw=await start('P64-positive-raw','raw-reader',principals,q,b),positiveSelected=await start('P64-positive-selection','joined',principals,q,b);
  await step(positiveRaw);await step(positiveSelected);
  await execute([bind(F,folder,e.keccak256(files[0].name),files[0].file,0)],['0x'],'control/unselected-scope','bob');
  await step(positiveRaw);await step(positiveSelected);assert.equal(encodeRows(positiveRaw.rows),encodeRows(positiveSelected.rows));
  // One actual fixed-block SDK joined read over the new execution identity.
  const sdk=createFilesCompactSdk({ethers:e,manifest:env.manifest,rpc:env.rpc}),context=await sdk.pin();
  const sdkPage=await sdk.listFolderPage({folder,principals:[principal],concept:positive,tagScope:'either',context,budget:2});
  assert.equal(sdkPage.pageRows.length,2);assert.equal(sdkPage.queryCoverage,'COMPLETE');assert.equal(sdkPage.queryKnowledge,'PRESENT');
  sdkControl={context,page:sdkPage};
  // Paid refusal receipts stay in the packet; neither arm gains stale progress.
  const rb=await basis(),rq={...q,concept:e.id('selection/refusal')};
  const refusedRaw=await start('selected-scope-refusal-raw','raw-reader',[principal],rq,rb),refusedSelection=await start('selected-scope-refusal-selection','joined',[principal],rq,rb);
  await step(refusedRaw);await step(refusedSelection);
  await execute([bind(F,folder,e.keccak256(files[0].name),files[0].file,1)],['0x'],'control/selected-consumed-scope');
  await step(refusedRaw,{refuse:true});await step(refusedSelection,{refuse:true});
  const comparisons=[];
  for(const P of [1,8,64])for(const mode of ['ordinary','historical']){
    const raw=runs.find(x=>x.key===`P${P}-${mode}-raw`),selected=runs.find(x=>x.key===`P${P}-${mode}-selection`);
    const reduction=(a,b)=>(a-b)/a;
    comparisons.push({P,mode,raw:raw.gas,selection:selected.gas,firstReduction:reduction(raw.gas[0],selected.gas[0]),
      continuationReduction:reduction(raw.gas[1],selected.gas[1]),rawTotal:raw.total,selectionTotal:selected.total,totalReduction:reduction(raw.total,selected.total),
      rawSessionDeployment:raw.deploymentGas,selectionSessionDeployment:selected.deploymentGas});
  }
  const retained=comparisons.every(x=>x.P===64?x.continuationReduction>=0.10&&x.totalReduction>=0.10:x.firstReduction>=-0.05&&x.continuationReduction>=-0.05);
  decision={retained,criterion:'P64 ordinary and historical continuation and complete two-page totals >=10% lower; P1/P8 each whole step <=5% regression; identical qualified outcomes; ordinary caps',comparisons,
    operationModel:'P64 negative live-row topology calls up to256 head getters: placement64 + HEAD64 + stableTAG64 + revisionTAG64. Metadata still read on every call; target load avoided only for state !=1, plus previous/bindingOrdinal projection and ABI words. No component gas allocation or claim that head reads disappear.',
    deployment:'Actual matched Lens/page/session deployment receipts retained; Ledger +121 runtime/initcode bytes against exact BASE. Control/selection share the new Ledger, so no fictitious matched old-Ledger deployment receipt.'};
}catch(error){failure={message:error.message,stack:error.stack};process.exitCode=1;}
finally{
  try{
    const report={status:failure?'FAILED':'COMPLETE',failure,decision,findings,runs,rowControls,sdkControl,pins,rawEvidence,contracts:c,transactions:env.transactions,
      limits:{ordinary:15000000,hard:16777216,runtime:24576,initcode:49152},historyPolicy:env.historyPolicy,port:env.port,anvilPid:env.anvilPid,
      evidence:'LOCAL_RPC_OBSERVED_NOT_STATE_PROOF',execution:(await env.call('ledger','executionSet'))[0]};
    await writeFile(join(output,'paid.json.gz'),gzipSync(json(report)),{flag:'wx'});
    await writeFile(join(output,'summary.json'),json({status:report.status,failure,decision,findings,contracts:Object.fromEntries(Object.entries(c).map(([k,v])=>[k,{...v,abi:undefined}]))})+'\n',{flag:'wx'});
    console.log(json({output,status:report.status,failure,decision,transactions:env.transactions.length}));
  }finally{await env.close();}
}
