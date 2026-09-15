/** Finite local execution evidence, not a public-RPC latency or chain-fee model.
 * Setup uses real signed transactions and records their exact inputs/receipts.
 * Append-only evidence mode avoids quadratic harness I/O; it saves no chain gas.
 */
import assert from 'node:assert/strict';
import {readFile,readdir,stat,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createEnvironment} from './compact-environment.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';

const lab=fileURLToPath(new URL('../',import.meta.url));
const stringify=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v,2);
const cap={live:1000,lifetime:10000,denseAuthors:64,denseNames:4,wallMs:900000,nodeRss:768*1024*1024,anvilRss:1536*1024*1024,outputBytes:256*1024*1024};
const delta=(after,before)=>Object.fromEntries(['calls','httpRequests','httpBatches','requestBytes','responseBytes'].map(k=>[k,after[k]-before[k]]));
async function size(path){let total=0;for(const entry of await readdir(path,{withFileTypes:true})){const child=join(path,entry.name);total+=entry.isDirectory()?await size(child):(await stat(child)).size;}return total;}
export async function seedJoinedScale(env,{live=1000,lifetime=10000,denseAuthors=64,denseNames=4,checkpoint=async()=>{},onSeed=async()=>{}}={}) {
  for(const [k,v] of Object.entries({live,lifetime,denseAuthors,denseNames}))assert(Number.isInteger(v)&&v>=0&&v<=cap[k],`bounded ${k}`);
  assert(lifetime===0||live>0,'churn needs a retained File');
  const {ethers:e,manifest,wallets}=env,Z=e.ZeroHash,coder=e.AbiCoder.defaultAbiCoder(),first=env.transactions.length;
  const hash=(types,values)=>e.keccak256(coder.encode(types,values));
  const subject=(who,salt)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/subject/1'),e.zeroPadValue(wallets[who].address,32),salt]);
  const record=(t,b)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),t,e.keccak256(b)]);
  const purpose=Object.fromEntries(['folder','head','tag'].map(k=>[k,e.id(`efs2/purpose/${k}/1`)]));
  const base={kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z};
  const action=a=>({...base,...a}),body=text=>e.hexlify(e.toUtf8Bytes(text));
  let actions=[],bodies=[];
  const maxActions=Number((await env.call('ledger','MAX_ACTIONS'))[0]);
  const push=(a,b='0x')=>{actions.push(action(a));bodies.push(b);};
  const publish=(t,b)=>{push({kind:1,typeId:t,bodyHashOrRecordId:e.keccak256(b)},b);return record(t,b);};
  const bind=(p,s,r,target,expectedRevision=0)=>push({kind:3,purpose:p,subject:s,role:r,target,expectedRevision});
  const flush=async(label,who='alice')=>{if(!actions.length)return;
    assert(actions.length<=maxActions,'setup batch respects accepted MAX_ACTIONS before broadcast');
    await env.transact('ledger','execute',[actions,bodies,(await env.call('ledger','nonces',[wallets[who].address]))[0]],label,who);
    actions=[];bodies=[];assert(BigInt(env.transactions.at(-1).gasUsed)<=16777216n);};
  const directory=async(label)=>{const salt=e.id('scale-directory/'+label),seed=subject('alice',salt);push({kind:5,salt});
    const id=publish(manifest.types.directory,coder.encode(['bytes32'],[seed]));await flush('setup/directory/'+label);return id;};
  const liveFolder=manifest.folder,churnFolder=await directory('churn'),denseFolder=await directory('dense');
  const conceptBody=e.concat([liveFolder,e.toUtf8Bytes('scale-approved')]),concept=publish(manifest.types.concept,conceptBody);await flush('setup/concept');
  const files=[];
  for(let i=0;i<live;i++){
    const salt=e.id('scale-live/'+i),f=subject('alice',salt);push({kind:5,salt});
    const rev=publish(manifest.types.root,e.concat([f,e.toUtf8Bytes('x'.repeat(41))]));
    const label=`live-${String(i).padStart(4,'0')}.txt`;publish(manifest.types.name,body(label));
    bind(purpose.head,f,Z,rev);bind(purpose.folder,liveFolder,e.id(label),f);
    if(i%2===0)bind(purpose.tag,rev,concept,f);
    files.push({file:f,revision:rev,name:label});
    if((i+1)%4===0||i+1===live)await flush(`setup/live/${i+1}`);
    if((i+1)%100===0||i+1===live)await checkpoint('live',i+1);
  }
  if(live)await onSeed('live',{liveFolder,churnFolder,denseFolder,concept});
  // One File, 10k real positive names over its lifetime, only the last is live.
  // 12 transitions per signed tx is setup batching, never a normal SDK operation.
  for(let i=0;i<lifetime;i++){
    const label=`lifetime-${i}.txt`;publish(manifest.types.name,body(label));
    bind(purpose.folder,churnFolder,e.id(label),files[0].file);
    if(i>0)push({kind:4,purpose:purpose.folder,subject:churnFolder,role:e.id(`lifetime-${i-1}.txt`),expectedRevision:1});
    if((i+1)%12===0||i+1===lifetime)await flush(`setup/lifetime/${i+1}`);
    if((i+1)%1000===0||i+1===lifetime)await checkpoint('lifetime',i+1);
  }
  if(lifetime)await onSeed('lifetime',{liveFolder,churnFolder,denseFolder,concept});
  const denseFiles=[];
  for(let i=0;denseAuthors>0&&i<denseNames;i++){
    const salt=e.id('dense-file/'+i),f=subject('alice',salt);push({kind:5,salt});denseFiles.push(f);
    publish(manifest.types.name,body(`shared-${i}.txt`));
  }
  await flush('setup/dense-files');
  const authors=[];
  for(let i=0;i<denseAuthors;i++){
    const who=`dense-${i}`,wallet=e.HDNodeWallet.fromPhrase('test test test test test test test test test test test junk',undefined,`m/44'/60'/0'/0/${i+3}`);
    wallets[who]=wallet;authors.push(wallet.address);
    await env.send(`setup/fund/${who}`,{to:wallet.address,value:1000000000000000000n,gasLimit:21000n});
    for(let j=0;j<denseNames;j++){
      const f=denseFiles[j],revision=publish(manifest.types.root,e.concat([f,e.toUtf8Bytes(`dense-${i}-${j}`.padEnd(41,'x'))]));
      bind(purpose.head,f,Z,revision);bind(purpose.folder,denseFolder,e.id(`shared-${j}.txt`),f);
      if(j%2===0)bind(purpose.tag,revision,concept,f);
      // A real higher-author placement mask hides shared-0 for all lower authors.
      if(i===0&&j===0)push({kind:4,purpose:purpose.folder,subject:denseFolder,role:e.id('shared-0.txt'),expectedRevision:1});
    }
    await flush(`setup/dense/${i+1}`,who);
    if((i+1)%8===0||i+1===denseAuthors)await checkpoint('dense-authors',i+1);
  }
  const setup=env.transactions.slice(first).filter(row=>row.label.startsWith('setup/')).map(({label,gasUsed,gasLimit,calldataBytes,transactionHash,status})=>({label,gasUsed,gasLimit,calldataBytes,transactionHash,status}));
  return {liveFolder,churnFolder,denseFolder,concept,denseAuthors:authors,files,
    recipe:{live,lifetime,denseAuthors,denseNames,liveBatch:4,lifetimeBatch:12,denseBatch:denseNames,maxActions,
      contents:'41 inline ASCII bytes; distinct stable Files; even selected revisions tagged; dense competing HEADs and one higher-author mask',
      gasLimit:'15000000',blockGasLimit:'30000000',transactionCap:'16777216'},setup};
}

export async function sourcePins(env){
  const e=env.ethers,artifacts=resolve(process.env.FOUNDRY_OUT),files=new Map(),compiler=[];
  for(const [file,name] of [['Ledger.sol','Ledger'],['FilesPageReader.sol','FilesPageReader'],['FilesLiveIndex.sol','FilesLiveLens'],['FilesCarrierProfile.sol','FilesCarrierIndex']]){
    const a=JSON.parse(await readFile(join(artifacts,file,name+'.json'),'utf8')),metadata=typeof a.metadata==='string'?JSON.parse(a.metadata):a.metadata;
    compiler.push({name,compiler:metadata.compiler,settings:metadata.settings});
    for(const [path,pin] of Object.entries(metadata.sources)){const content=await readFile(join(lab,path));assert.equal(e.keccak256(content),pin.keccak256,`artifact/source ${path}`);files.set(path,pin.keccak256);}
  }
  for(const path of ['script/measure-joined.mjs','script/diagnose-joined-read.mjs','script/compact-environment.mjs','browser/compact-sdk.mjs','browser/compact-sdk-v2.mjs','browser/compact-files-sdk.mjs'])files.set(path,e.keccak256(await readFile(join(lab,path))));
  return {gitHead:execFileSync('git',['rev-parse','HEAD'],{cwd:lab,encoding:'utf8'}).trim(),artifacts,files:Object.fromEntries(files),compiler,
    anvil:execFileSync(process.env.ANVIL_BIN??'anvil',['--version'],{encoding:'utf8'}).trim(),node:process.version,hardfork:'cancun',contentProfile:'raw-sha256-aesgcm-v2'};
}
export async function measureCase(caseName,{environment=createEnvironment,pinSource=sourcePins}={}){
  const started=Date.now(),env=await environment({protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',evidenceMode:'append',benchmarkHistory:true});
  try{
  const report={status:'RUNNING',caseName,runDirectory:env.dir,safety:cap,rpcHistory:env.historyPolicy,sourcePins:await pinSource(env),checkpoints:[],reads:[],paid:[],setup:null};
  const write=()=>writeFile(join(env.dir,'joined-measurement.json'),stringify(report));
  const checkpoint=async(phase,n)=>{
    const anvilRss=Number(execFileSync('ps',['-o','rss=','-p',String(env.anvilPid)],{encoding:'utf8'}).trim())*1024;
    const row={phase,n,elapsedMs:Date.now()-started,nodeRss:process.memoryUsage().rss,nodePeakRss:process.resourceUsage().maxRSS*1024,anvilRss,outputBytes:await size(env.dir)};
    report.checkpoints.push(row);await write();console.log(JSON.stringify(row));
    assert(row.elapsedMs<=cap.wallMs&&row.nodeRss<=cap.nodeRss&&row.anvilRss<=cap.anvilRss&&row.outputBytes<=cap.outputBytes,'RUN_SAFETY_STOP');
  };
  try{
    let seed;
    await env.deploy('pagePaid','FilesPageReader.sol','FilesPagePaid');
    const e=env.ethers;
    const sample=async(label,folder,authors,tagScope='none',policy='ordered')=>{
      // Measured paid-read-safe widths; UI's two-author default remains32.
      const budget=Number(process.env.EFS_JOINED_PAGE_BUDGET??(authors.length<=8?32:authors.length<=32?8:4));
      assert(Number.isInteger(budget)&&budget>0&&budget<=64,'explicit bounded measurement budget');
      const failures=[],rpc=async(method,params)=>{try{return await env.rpc(method,params);}catch(error){failures.push({method,params,message:error.message,rpcError:error.rpcError});throw error;}};
      const sdk=createFilesCompactSdk({ethers:e,manifest:env.manifest,rpc});
      const beforePin={...env.metrics},pinStart=performance.now(),context=await sdk.pin(),pin={ms:performance.now()-pinStart,...delta(env.metrics,beforePin)};
      for(const temperature of ['cold','warm']){
        const start=performance.now(),before={...env.metrics};let page,count=0,rows=0,scanned=0,firstPage;
        do{const firstStart=performance.now(),firstMetrics={...env.metrics};page=await sdk.listFolderPage({folder,authors,context,budget,concept:seed.concept,tagScope,policy,continuation:page?.continuation});
          if(count===0)firstPage={ms:performance.now()-firstStart,...delta(env.metrics,firstMetrics),rows:page.pageRows.length,scanned:page.scanned,coverage:page.queryCoverage};
          if(!['PARTIAL','COMPLETE'].includes(page.queryCoverage))report.failedRead={label,width:authors.length,budget,context,coverage:page.queryCoverage,reason:page.reason,failures};
          assert(['PARTIAL','COMPLETE'].includes(page.queryCoverage),`unavailable ${label}`);rows+=page.pageRows.length;scanned+=Number(page.scanned);count++;assert(count<=2048,'finite traversal');
        }while(page.continuation);
        assert.equal(page.queryCoverage,'COMPLETE');assert.equal(scanned,Number(page.rawTotal));
        report.reads.push({label,folder,width:authors.length,tagScope,policy,budget,temperature,pin:temperature==='cold'?pin:undefined,
          ms:performance.now()-start,...delta(env.metrics,before),firstPage,pages:count,rows,candidates:scanned,selected:Number(page.selectedSoFar),bodyBytesFetched:0});
      }
      const args=[env.contracts.joined.address,folder,authors.map(a=>e.zeroPadValue(a,32)),[seed.concept,['none','file','revision','either'].indexOf(tagScope),policy==='no-tiebreak',''],
        [context.admission,context.generation,context.epoch,context.executionSet],'0x',budget];
      const iface=new e.Interface(env.contracts.pagePaid.abi),data=iface.encodeFunctionData('read',args);
      const tx=await env.enqueue('paid/'+label,{to:env.contracts.pagePaid.address,data,gasLimit:16777216n});
      const receipt=await env.observe(tx);report.paid.push(receipt);await write();
      assert.equal(receipt.status,'SUCCESS',`PAID_READ_CLIFF ${label}; retain evidence and request engineering ruling`);
      await checkpoint('read/'+label,authors.length);
    };
    seed=await seedJoinedScale(env,{checkpoint,live:caseName==='live-churn'?1000:0,lifetime:caseName==='live-churn'?10000:0,denseAuthors:caseName==='dense'?64:0,
      onSeed:async(phase,current)=>{seed=current;
        for(const width of [1,8,32,64]){
          const sparse=[...Array.from({length:width-1},(_,i)=>e.getAddress('0x'+e.id('sparse-empty-'+i).slice(-40))),env.wallets.alice.address];
          await sample(phase+'-sparse-'+width,phase==='live'?seed.liveFolder:seed.churnFolder,sparse,phase==='live'?'revision':'none');
        }
        report.completedPhase=phase;await write();
      }});
    report.setup={...seed,files:undefined};await checkpoint('seed-complete',caseName==='dense'?64:10000);
    if(caseName==='dense'){
      for(const width of [1,8,32,64])await sample('dense-overlap-'+width,seed.denseFolder,seed.denseAuthors.slice(0,width),'revision');
      await sample('dense-conflict-64',seed.denseFolder,seed.denseAuthors,'revision','no-tiebreak');
    }
    report.status='PASS';report.elapsedMs=Date.now()-started;report.metrics=env.metrics;
    report.deployments=Object.fromEntries(Object.entries(env.contracts).map(([k,c])=>[k,{address:c.address,runtimeBytes:c.runtimeBytes,initcodeBytes:c.initcodeBytes,codeHash:c.codeHash,transactionHash:c.transactionHash}]));
    report.limits=['Loopback latency only, no public RPC SLA.','No total chain fees or ZKsync gas inference.','Cold pin cost separated from page cost; warm cache remains exact-context and bounded to 32 pages.','Headers never establish full content-body digest verification.','Signed gasLimit cap is an execution constraint, not a Core action-count or product limit.'];
    await checkpoint('complete',report.reads.length);await write();console.log('JOINED_REPORT '+join(env.dir,'joined-measurement.json'));return report;
  }catch(error){report.status='STOPPED';report.error=error.message;report.lastTransaction=env.transactions.at(-1);report.elapsedMs=Date.now()-started;await write();console.error('JOINED_REPORT '+join(env.dir,'joined-measurement.json'));throw error;}
  }finally{await env.close();}
}
export async function measureJoined(){const reports=[];for(const name of ['live-churn','dense'])reports.push(await measureCase(name));return reports;}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await measureJoined();
