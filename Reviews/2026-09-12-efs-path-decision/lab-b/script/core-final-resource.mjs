// Finite final-profile receipt campaign. No owner UI imports, public writes,
// optimization search, opcode traces, raised caps, or background chains.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {join} from 'node:path';
import {createTagEnvironment} from '../core-closeout-tags-20260915/fixture.mjs';
import {loadEthers} from './compact-environment.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';
import {createTagStancePlanner} from '../browser/tag-stance-profile.mjs';

const e=await loadEthers(),abi=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash,out=process.env.FOUNDRY_OUT;
assert(out,'explicit coherent artifact directory');
const plain=x=>JSON.parse(JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v));
const sha=x=>createHash('sha256').update(x).digest('hex'),bytes=x=>e.getBytes(x).length;
const hash=(t,v)=>e.keccak256(abi.encode(t,v));
const record=(t,b)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),t,e.keccak256(b)]);
const position=(p,s,r)=>hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),p,s,r]);
const binding=(p,pos)=>hash(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),p,pos]);
const posting=(t,k,o,v)=>hash(['bytes32','bytes32','uint256','uint256','bytes32'],[e.id('efs2/pk/1'),t,k,o,v]);
const base={kind:0,typeId:Z,bodyHashOrRecordId:Z,purpose:Z,subject:Z,role:Z,target:Z,expectedRevision:0,salt:Z};
const pub=(t,b)=>({...base,kind:1,typeId:t,bodyHashOrRecordId:e.keccak256(b)});
const H=e.id('efs2/purpose/head/1'),F=e.id('efs2/purpose/folder/1'),T=e.id('efs2/purpose/tag/1');
const readType='tuple(bytes32[] principalIds,bytes32[] positions,bytes32[] expectedHeads)';
const dir='core-closeout-resource-20260915',run=process.env.EFS_RESOURCE_RUN??'final-1';
assert(/^[a-z0-9-]+$/.test(run));await mkdir(dir,{recursive:true});
const report={base:'86c364910994d343b1d8707a39a8d1c21695d9c6',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  classification:'LOCAL_RPC_OBSERVED_NOT_STATE_PROOF',limits:{gas:15000000,hard:16777216,runtime:24576,initcode:49152,traceWire:524288,traceNodes:256,knownSlots:2048},
  artifacts:{},sources:{},operations:[],attribution:[],queries:[],replays:[],warnings:[]};
let env,error,sdk;
async function checkpoint(){await writeFile(`${dir}/${run}.json.gz`,gzipSync(JSON.stringify(plain(report),null,2)));}
async function pin(file,name){
  if(report.artifacts[name])return report.artifacts[name];
  const raw=await readFile(join(out,file,`${name}.json`)),a=JSON.parse(raw),m=typeof a.metadata==='string'?JSON.parse(a.metadata):a.metadata;
  assert.equal(m.compiler.version,'0.8.30+commit.73712a01');assert(m.settings.viaIR);assert.equal(m.settings.optimizer.runs,200);assert.equal(m.settings.evmVersion,'cancun');
  const settings=JSON.stringify(m.settings.remappings);assert.equal(settings,JSON.stringify(['src/libraries/=src/vendor/optimism/']),'coherent remapping');
  for(const [path,p] of Object.entries(m.sources)){const b=await readFile(path);assert.equal(e.keccak256(b),p.keccak256,path);report.sources[path]={sha256:sha(b),keccak256:p.keccak256};}
  report.artifacts[name]={sha256:sha(raw),...a};return a;
}
async function state(core='ledger'){return {block:await env.rpc('eth_getBlockByNumber',['latest',false]),counts:plain(await env.call(core,'counts')),
  execution:(await env.call(core,'executionSet'))[0],index:(await env.call(core,'indexModule'))[0]};}
async function paid(key,fn,args,label,{who='deployer',refuse=false,core='ledger'}={}){
  const before=await state(core),c=env.contracts[key];
  const receipt=await env.observe(await env.enqueue(label,{to:c.address,data:new e.Interface(c.abi).encodeFunctionData(fn,args)},who));
  const after=await state(core);assert.equal(receipt.status,refuse?'REVERTED':'SUCCESS',label);
  const row={label,receipt,before,after,call:{key,fn,args},scope:core};report.operations.push(row);await checkpoint();return row;
}
// A streaming wire cap applies before JSON parsing. No opcode fallback.
async function boundedTrace(tx){
  try{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    let response;try{response=await fetch(env.rpcUrl,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,
      body:JSON.stringify({jsonrpc:'2.0',id:1,method:'debug_traceTransaction',params:[tx,{tracer:'callTracer',timeout:'5s'}]})});
      const reader=response.body.getReader(),chunks=[];let size=0;
      while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>524288){await reader.cancel();throw Error('TRACE_WIRE_CAP');}chunks.push(Buffer.from(value));}
      const parsed=JSON.parse(Buffer.concat(chunks).toString());if(parsed.error)throw Error(JSON.stringify(parsed.error));
      let nodes=0;const visit=n=>{assert(++nodes<=256,'TRACE_NODE_CAP');for(const child of n.calls??[])visit(child);};visit(parsed.result);
      return {status:'AVAILABLE',wireBytes:size,nodes,tree:parsed.result};
    }finally{clearTimeout(timer);}
  }catch(cause){return {status:'TRACE_UNAVAILABLE',reason:cause.message};}
}
// Compiler-root/action-derived, explicitly partial inventory; <=2048 candidates.
async function inventory(plan,before){
  const core=env.contracts.ledger.address,index=env.contracts.index.address,slots=new Map();
  const layout=report.artifacts.Ledger.storageLayout,il=report.artifacts.TagStanceIndex.storageLayout;
  const add=(address,slot,group,label)=>{slot=e.toBeHex(BigInt(slot),32);slots.set(address+slot,{address,slot,group,label});};
  const map=(key,slot)=>BigInt(hash(['bytes32','uint256'],[e.zeroPadValue(key,32),slot]));
  const root=(l,name)=>BigInt(l.storage.find(r=>r.label===name).slot);
  const row=(l,name,key,group,address=core)=>{const r=l.storage.find(r=>r.label===name),v=l.types[l.types[r.type].value];
    const start=map(key,BigInt(r.slot));for(let n=0;n<Math.ceil(Number(v.numberOfBytes)/32);n++)add(address,start+BigInt(n),group,name);return start;};
  add(core,1,'current','counters');row(layout,'nonces',plan.intent.author,'current');
  row(layout,'_evidence',e.toBeHex(BigInt(before.counts[3])+1n,32),'authority-history');
  row(layout,'_context',e.toBeHex(BigInt(before.counts[3])+1n,32),'authority-history');
  row(layout,'_execution',plan.intent.executionSet,'authority-history');
  row(layout,'_publicationOrdinal',plan.publicationId,'authority-history');
  add(core,hash(['bytes32','bytes32'],[plan.intent.readSetHash,e.id('efs.lab.ledger.read-set-carriers/1')]),'guard','carrier-pointer');
  const pk=new Set([posting(Z,4,0,plan.principalId)]);
  for(let n=0;n<plan.actions.length;n++){
    const a=plan.actions[n];row(layout,'_admission',e.toBeHex(BigInt(before.counts[0])+BigInt(n)+1n,32),'authority-history');
    if(a.kind===1){const id=record(a.typeId,plan.bodies[n]);row(layout,'_record',id,'Record/body');
      const r=map(id,root(layout,'_bodyWord'));for(let j=0;j<Math.ceil(bytes(plan.bodies[n])/32);j++)add(core,map(e.toBeHex(j,32),r),'Record/body','bodyWord');
      pk.add(posting(a.typeId,1,0,Z));pk.add(posting(a.typeId,13,0,Z));pk.add(posting(Z,12,0,id));
    }else if(a.kind===5)row(layout,'_subject',plan.file,'Record/body');
    else if(a.kind===3||a.kind===4){const pos=position(a.purpose,a.subject,a.role),key=binding(plan.principalId,pos);
      row(layout,'_head',key,'current');row(layout,'_position',pos,'authority-history');
      const scope=hash(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/vk/binding-scope/1'),plan.principalId,a.purpose,a.subject]);
      pk.add(posting(Z,8,0,key));pk.add(posting(Z,10,0,scope));if(a.target!==Z)pk.add(posting(Z,5,0,a.target));
    }
  }
  for(let i=1;i<=plan.actions.length;i++)row(layout,'_bindingPosition',e.toBeHex(BigInt(before.counts[2])+BigInt(i),32),'authority-history');
  for(const key of pk){row(il,'_postingHead',key,'index-buckets',index);const r=map(key,root(il,'_postingWord'));
    for(let j=0;j<4;j++)add(index,map(e.toBeHex(j,32),r),'index-buckets','first-four-posting-words');}
  for(const r of il.storage.filter(r=>!il.types[r.type].encoding.includes('mapping')))add(index,r.slot,'index-current',r.label);
  assert(slots.size<=2048);return [...slots.values()];
}
async function readSlots(slots,block){
  const values=[];for(let i=0;i<slots.length;i+=16)values.push(...await Promise.all(slots.slice(i,i+16).map(s=>env.rpc('eth_getStorageAt',[s.address,s.slot,{blockHash:block.hash,requireCanonical:true}]))));return values;
}
async function operation(label,operation,args,{attribute=false}={}){
  const before=await state(),metrics={...env.metrics},start=performance.now(),txCount=env.transactions.length;
  const plan=await sdk.prepare({operation,authors:Object.values(env.manifest.authors),author:env.wallets.alice.address,...args});
  const attributionBefore={...env.metrics};
  const slots=attribute?await inventory(plan,before):[],pre=attribute?await readSlots(slots,before.block):[];
  const attributionAfter={...env.metrics};
  let signatures=0;const signed=await sdk.authorize(plan,d=>{signatures++;return env.wallets.alice.signingKey.sign(d).serialized;});
  await sdk.submit(signed,tx=>env.send(label,tx,'alice'));
  const effect=await sdk.reconcile(plan.id);assert.equal(effect.status,'EFFECTS_VERIFIED');
  const sdkEnd={...env.metrics},after=await state(),receipts=env.transactions.slice(txCount),row={label,operation,plan,signed,effect,before,after,receipts,transactions:receipts.length,signatures,
    bodyBytes:plan.bodies.map(bytes),readSetBytes:bytes(abi.encode([readType],[plan.readSet])),readSetDimensions:[plan.readSet.principalIds.length,plan.readSet.positions.length],
    coldWork:{elapsedIncludingAttributionMs:performance.now()-start,...Object.fromEntries(['calls','httpRequests','requestBytes','responseBytes'].map(k=>[k,sdkEnd[k]-metrics[k]-(attributionAfter[k]-attributionBefore[k])]))}};
  assert.equal(receipts.length,1,'actual SDK whole publication');report.operations.push(row);
  if(attribute){const post=await readSlots(slots,after.block),categories={};
    for(let i=0;i<slots.length;i++){slots[i].before=pre[i];slots[i].after=post[i];const kind=pre[i]===post[i]?'unchanged':BigInt(pre[i])===0n?'new':BigInt(post[i])===0n?'cleared':'changed';slots[i].change=kind;
      (categories[slots[i].group]??={new:0,changed:0,cleared:0,unchanged:0})[kind]++;}
    report.attribution.push({label,receiptGas:receipts[0].gasUsed,trace:await boundedTrace(receipts[0].transactionHash),knownSlots:slots,categories,
      limit:'Exact net change ONLY over enumerated compiler-root/action/posting keys. Omits live/scope companions, refs/field postings and transient/reverted writes; no SSTORE gas pie chart.'});
  }
  console.log(label,receipts.map(r=>r.gasUsed).join('+'));await checkpoint();return plan;
}

// Offline evidence audit/attribution. This mode never creates a chain or fetches.
if(process.env.EFS_RESOURCE_AUDIT==='1'){
  const path=`${dir}/attempt-4.json.gz`,raw=await readFile(path),r=JSON.parse(gunzipSync(raw));assert.equal(r.status,'PASS');assert(r.cleanup.closed);
  const runner=gunzipSync(await readFile(`${dir}/attempt-4-runner.mjs.gz`));assert.equal(sha(runner),r.sources['script/core-final-resource.mjs'].sha256);
  const audit={packet:{path,sha256:sha(raw),paidRunnerSha256:sha(runner)},transactions:0,queryChains:[],attribution:[],historical:[],setup:{},artifacts:{},scope:'offline raw-input/receipt/source joins and finite fixture semantics, not consensus proofs'};
  globalThis.fetch=()=>{throw Error('offline audit attempted network');};
  for(const [path,pin] of Object.entries(r.sources))if(path!=='script/core-final-resource.mjs')assert.equal(sha(await readFile(path)),pin.sha256,path);
  for(const row of r.exactTransactions){const tx=e.Transaction.from(row.rawTransaction);assert.equal(tx.hash,row.transactionHash);assert.equal(row.receipt.transactionHash,tx.hash);
    assert.equal(BigInt(row.receipt.gasUsed).toString(),row.gasUsed);assert.equal(BigInt(row.receipt.status)===1n,row.status==='SUCCESS');assert.equal(bytes(tx.data),row.calldataBytes);
    assert.equal(row.receipt.blockHash,row.blockHash);assert.equal(BigInt(row.receipt.blockNumber).toString(),row.blockNumber);assert(tx.gasLimit<=15000000n);
    assert.equal(e.getAddress(row.receipt.from),tx.from);if(tx.to)assert.equal(e.getAddress(row.receipt.to),tx.to);
    for(const log of row.receipt.logs){assert.equal(log.blockHash,row.blockHash);assert.equal(log.transactionHash,tx.hash);}if(row.status==='REVERTED')assert.equal(row.receipt.logs.length,0);audit.transactions++;
  }
  const allArtifacts=Object.entries(r.artifacts);
  for(const [key,c] of Object.entries(r.contracts)){
    assert.equal(e.keccak256(c.runtime),c.codeHash,key);assert(bytes(c.runtime)<=24576);assert(c.initcodeBytes<=49152);
    const tx=e.Transaction.from(r.exactTransactions.find(t=>t.transactionHash===c.transactionHash).rawTransaction),matches=[];
    for(const [name,a] of allArtifacts){const iface=new e.Interface(a.abi);try{const input=a.bytecode.object+iface.encodeDeploy(c.constructorArgs).slice(2);if(input===tx.data)matches.push([name,a]);}catch{}}
    assert(matches.length>0,`creation+constructor match ${key}`);const [name,a]=matches[0],template=e.getBytes(a.deployedBytecode.object),actual=e.getBytes(c.runtime),immutable=new Set();
    for(const refs of Object.values(a.deployedBytecode.immutableReferences??{}))for(const ref of refs)for(let i=0;i<ref.length;i++)immutable.add(ref.start+i);
    assert.equal(actual.length,template.length);for(let i=0;i<actual.length;i++)if(!immutable.has(i))assert.equal(actual[i],template[i]);
    audit.artifacts[key]={artifact:name,codeHash:c.codeHash,runtime:c.runtimeBytes,initcode:c.initcodeBytes,transaction:c.transactionHash};
  }
  const tiny=r.traceConvention;assert.equal(BigInt(tiny.trace.tree.gasUsed).toString(),tiny.receiptGas);
  const tinyTx=e.Transaction.from(r.exactTransactions.find(t=>t.label==='trace-convention-control').rawTransaction),intrinsic=21000+e.getBytes(tinyTx.data).reduce((n,b)=>n+(b===0?4:16),0);
  audit.traceConvention={rootIncludesIntrinsic:true,receipt:tiny.receiptGas,intrinsic,nonIntrinsic:BigInt(tiny.receiptGas)-BigInt(intrinsic),rule:'Child frames inclusive; selected subtrees disjoint; residual includes intrinsic, Ledger own work and unselected calls.'};
  const idx=new e.Interface(r.contracts.index.abi),on=idx.getFunction('onAdmission').selector,after=idx.getFunction('afterPublication').selector;
  const support=r.finalProfile.manifest.executionFamily.implementations[0].publicationSupport.address.toLowerCase();
  const accept=e.id('accept(bytes32,bytes,bytes32[])').slice(0,10);
  for(const row of r.attribution){
    assert(row.knownSlots.length<=2048);const seen=new Set();for(const s of row.knownSlots){assert(!seen.has(s.address+s.slot));seen.add(s.address+s.slot);
      assert.equal(s.change,s.before===s.after?'unchanged':BigInt(s.before)===0n?'new':BigInt(s.after)===0n?'cleared':'changed');}
    const result={label:row.label,receiptGas:row.receiptGas,knownSlots:row.knownSlots.length,categories:row.categories,status:row.trace.status};
    if(row.trace.status==='AVAILABLE'){
      const frames={support:0n,acceptor:0n,indexPrefix:0n,indexFinal:0n},inclusiveFrames={...frames},selected=[];let nodes=0;const nested=[];
      function visit(n,path,covered=false){assert(++nodes<=256);const to=n.to?.toLowerCase(),sel=n.input?.slice(0,10);let category;
        if(path.length){if(to===support)category='support';else if(sel===accept)category='acceptor';else if(to===r.contracts.index.address.toLowerCase()&&sel===on)category='indexPrefix';else if(to===r.contracts.index.address.toLowerCase()&&sel===after)category='indexFinal';}
        if(to===r.contracts.finalValidator.address.toLowerCase()||to===r.contracts.stanceValidator.address.toLowerCase())nested.push({path,to,inclusiveGas:BigInt(n.gasUsed),overlapsSelectedAncestor:covered});
        if(category)inclusiveFrames[category]+=BigInt(n.gasUsed);
        if(category&&!covered){frames[category]+=BigInt(n.gasUsed);selected.push({path,category,to,inclusiveGas:BigInt(n.gasUsed)});covered=true;}
        for(const [i,child] of (n.calls??[]).entries())visit(child,[...path,i],covered);
      }visit(row.trace.tree,[]);const allocated=Object.values(frames).reduce((n,v)=>n+v,0n),residual=BigInt(row.receiptGas)-allocated;assert(residual>=0n);
      Object.assign(result,{inclusiveFrames,disjointSelectedFrames:frames,selected,nestedValidatorFramesNonadditive:nested,unallocatedResidual:residual,nodes,storageGasEstimate:null,
        overlap:'Index prefix/final callbacks are nested inside support fallback frames. Inclusive columns overlap; only disjointSelectedFrames may be summed.'});
    }
    audit.attribution.push(result);
  }
  const created=r.operations.find(x=>x.label==='Files/create-inline-41').plan,edited=r.operations.find(x=>x.label==='Files/edit-before-stale-guard').plan;
  for(const q of r.queries){
    const c=r.contracts[q.key],ci=new e.Interface(c.abi),reader=new e.Interface(r.artifacts[q.kind==='folder'?'LiveFilesPageReader':'TagStanceReader'].abi);
    const rt=reader.getFunction('readPage').outputs[0].components.find(v=>v.name==='rows'),rows=[];let scanned=0n,gas=0n,lastCommitment;
    for(const step of q.steps){const tx=e.Transaction.from(r.exactTransactions.find(t=>t.transactionHash===step.receipt.transactionHash).rawTransaction),decoded=ci.parseTransaction(tx);
      assert.equal(decoded.name,'step');assert.equal(decoded.args[0],e.id(q.key));assert.equal(decoded.args[1],BigInt(q.budget));gas+=BigInt(step.receipt.gasUsed);
      const events=step.receipt.receipt.logs.filter(l=>l.address.toLowerCase()===c.address.toLowerCase()).map(l=>ci.parseLog(l));
      if(step.receipt.status==='REVERTED'){assert.equal(events.length,0);continue;}
      const event=events.find(x=>x.name==='Rows'),progress=events.find(x=>x.name==='Progress');assert(event&&progress);
      rows.push(...abi.decode([rt],event.args.encodedRows)[0]);scanned=progress.args.scanned;lastCommitment=progress.args.commitment;
      assert.equal(scanned,BigInt(step.scannedAfter));
    }
    assert.equal(scanned,BigInt(q.readback.scanned));assert.equal(lastCommitment,q.readback.commitment);assert.equal(rows.length,Number(q.readback.rows));
    assert.equal(rows.length,1);const row=rows[0];
    if(q.kind==='folder'){assert.equal(row.placement.target,created.file);assert.equal(e.toUtf8String(row.name.value),'renamed-final.txt');assert.equal(row.name.qualification,1n);
      assert.equal(row.head.target,edited.newRevision);assert.equal(row.header.recordId,edited.newRevision);assert.equal(row.header.parent,edited.bodies[0].slice(0,66));
      assert.equal(row.stableTag.present,true);assert.equal(row.revisionTag.present,false);assert.equal(row.matchStatus,1n);
    }else{assert.equal(row.subject,created.file);assert.equal(row.intrinsicFile,created.file);assert.equal(row.concept,q.query.exact);assert.equal(row.assessment,2n);assert.equal(q.readback.absent,true);}
    audit.queryChains.push({key:q.key,totalGas:gas,complete:!!q.complete,refused:!!q.refused,pages:q.steps.length,scanned,rows:rows.length,commitment:lastCommitment});
  }
  for(const path of ['core-closeout-tags-20260915/query-paid-final2.json.gz','core-closeout-tags-20260915/query-fix1-diagnostic.json.gz','core-closeout-sdk-20260915/readset-carrier-paid.json.gz']){
    const raw=await readFile(path),p=JSON.parse(gunzipSync(raw)),comparisons=[];
    for(const [source,pin] of Object.entries(p.sources??p.sourcePins??{})){
      const current=r.sources[source];if(current)comparisons.push({source,sourceEqual:typeof pin==='string'?[current.sha256,current.keccak256].includes(pin):pin.sha256?pin.sha256===current.sha256:pin.keccak256===current.keccak256});
    }
    const artifacts=[];for(const [name,a] of Object.entries(p.artifacts??{})){const current=r.artifacts[name];if(current&&a.bytecode&&a.deployedBytecode)artifacts.push({name,creationEqual:a.bytecode.object===current.bytecode.object,runtimeTemplateEqual:a.deployedBytecode.object===current.deployedBytecode.object});}
    audit.historical.push({path,sha256:sha(raw),sourceComparisons:comparisons,artifactComparisons:artifacts,controls:p.controls?.map(c=>({arm:c.arm,rows:c.rows.map(v=>({shape:v.shape,first:v.first.gas,repeat:v.repeat.gas,changed:v.changed?.gas,read:v.paidRead.gas,exactRepeat:v.exactRepeat.gas,
      calldataBytes:bytes(v.first.data),nonzeroBytes:e.getBytes(v.first.data).filter(v=>v!==0).length,carrierRuntimeBytes:v.first.carrierRuntimeBytes,carrierInitcodeBytes:v.first.carrierInitcodeBytes}))})),
      upgrade:p.upgrade,offline:p.offline,scope:'Historical exact receipts; logical old-mapping/additive-carrier guarantees and calldata density, not final-build transaction identity.'});
  }
  const labels=new Set(r.operations.map(x=>x.label)),replays=new Set(r.replays.map(x=>x.receipt.label)),queries=new Set(r.queries.flatMap(q=>q.steps.map(x=>x.receipt.label))),groups=new Map();
  const exactByHash=new Map(r.exactTransactions.map(tx=>[tx.transactionHash,tx])),registry=new e.Interface(r.contracts.registry.abi);
  for(const tx of r.transactions){
    const retained=exactByHash.get(tx.transactionHash);assert(retained,'accounted transaction has retained signed input');assert.equal(tx.gasUsed,retained.gasUsed);
    const signed=e.Transaction.from(retained.rawTransaction),registration=signed.to?.toLowerCase()===r.contracts.registry.address.toLowerCase()&&['register','registerDescribed'].includes(registry.parseTransaction(signed)?.name);
    const group=tx.label.startsWith('deploy/')?'deployment':registration?'type-registration':replays.has(tx.label)?'replay':queries.has(tx.label)?'query':labels.has(tx.label)?'operation':'other-setup-and-interleaving';
    groups.set(tx.label,group);
    (audit.setup[group]??={transactions:0,gas:0n}).transactions++;audit.setup[group].gas+=BigInt(tx.gasUsed);}
  // Regression: Note registry calls have no "register" or "setup/type" label.
  for(const name of ['NoteV1Rule','NoteV11Rule','NoteV2Rule'])assert.equal(groups.get(`setup/note/${name}`),'type-registration',`Note Type registration classification: ${name}`);
  assert.deepEqual(audit.setup['type-registration'],{transactions:22,gas:3710146n});
  assert.deepEqual(audit.setup['other-setup-and-interleaving'],{transactions:34,gas:20979989n});
  assert.equal(Object.values(audit.setup).reduce((n,v)=>n+v.transactions,0),r.transactions.length);
  assert.equal(r.transactions.length,214);
  assert.equal(Object.values(audit.setup).reduce((n,v)=>n+v.gas,0n),268576960n);
  const sum=rows=>rows.reduce((n,v)=>n+BigInt(v.gasUsed),0n);
  audit.bootstrap={transactions:r.finalProfile.setupThrough,gas:sum(r.transactions.slice(0,r.finalProfile.setupThrough)),qualification:'Contains detached bootstrap readers/profile and seeded sample records; not minimal deployment quote.'};
  await writeFile(`${dir}/final-audit.json`,JSON.stringify(plain(audit),null,2));console.log(JSON.stringify({status:'PASS',transactions:audit.transactions,artifacts:Object.keys(audit.artifacts).length,queries:audit.queryChains.length,attribution:audit.attribution.length}));
  process.exit(0);
}

try{
  for(const [file,names] of [['Ledger.sol',['Ledger']],['TypeRegistry.sol',['TypeRegistry']],['PublicationSupport.sol',['PublicationSupport']],
    ['ContractSignatureEvidenceStore.sol',['ContractSignatureEvidenceStore']],['FilesJoinedProfile.sol',['FilesRootRule','FilesChildRule']],
    ['FilesNamesProfile.sol',['FilesNameRule','FilesNameReader']],['FilesLiveIndex.sol',['FilesLiveNamesIndex','FilesLiveLens']],
    ['FilesJoinedConsumer.sol',['FilesJoinedConsumer']],['FilesApplication.sol',['FilesApplication']],['FilesDirectoryProfile.sol',['FilesDirectoryRule']],
    ['FilesCarrierProfile.sol',['FilesBytesRule','FilesContentRule','FilesCarrierRootRule','FilesCarrierChildRule','FilesConceptRule']],
    ['LiveFilesAdapter.sol',['LiveFilesAdapter','LiveQuoteRule','LiveQuoteProvider']],['LiveFilesProfile.sol',['LiveFilesRootRule','LiveFilesChildRule','LiveFilesDescriptorRule']],
    ['FilesFinalValidator.sol',['FilesFinalValidator']],['TagStanceProfile.sol',['TagStanceIndex','TagStanceValidator']],
    ['LiveFilesReader.sol',['LiveFilesPageReader','LiveFilesMountedReader','LiveFilesPaid']],['FilesQueryAccumulator.sol',['FilesQueryAccumulator']],
    ['TagStanceReader.sol',['TagStanceReader','TagStanceLens']],['TagStanceQueryAccumulator.sol',['TagStanceQueryAccumulator']],
    ['CoreOrderedAcceptance.t.sol',['EquipmentEligibility','EquipmentRule','EquipmentApplication']],['NoteProfile.sol',['NoteV1Rule','NoteV11Rule','NoteV2Rule','NotePointReader']],
    ['ProfiledIndexModule.sol',['ProfiledIndexModule']],['IndexReplaySource.sol',['IndexReplayDecoder']],['IndexFieldProfile.sol',['IndexFieldProfile']],['FilesScopeState.sol',['FilesScopeState']]])for(const name of names)await pin(file,name);
  env=await createTagEnvironment();const c=env.contracts,t=env.manifest.types,h=env.manifest.ruleHashes;
  report.bootstrap={manifest:plain(env.manifest),contracts:plain(c),transactions:plain(env.transactions)};
  c.index=c.tagIndex;env.manifest.folder=env.tags.directoryD;env.manifest.folders=[env.tags.directoryD];
  await env.deploy('lens','FilesLiveIndex.sol','FilesLiveLens',[c.ledger.address,c.index.address]);
  await env.deploy('files','FilesJoinedConsumer.sol','FilesJoinedConsumer',[c.ledger.address,c.lens.address,c.index.address,t.root,t.child,h.root,h.child]);
  await env.deploy('joined','LiveFilesReader.sol','LiveFilesPageReader',[c.ledger.address,c.lens.address,c.index.address]);
  await env.deploy('mounted','LiveFilesReader.sol','LiveFilesMountedReader',[c.joined.address,c.liveAdapter.address]);
  await env.deploy('livePaid','LiveFilesReader.sol','LiveFilesPaid');
  Object.assign(env.manifest,{filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2',liveProfile:'quote-u128-bool-v1',liveOutputType:t.quote,liveProviderRuntimeHash:env.tags.selectedProviderHash});
  for(const key of ['index','lens','files','joined','liveAdapter','finalValidator'])env.manifest.contracts[key]=c[key];
  assert.equal(e.getAddress((await env.call('ledger','indexModule'))[0]),e.getAddress(c.index.address));assert.equal(e.getAddress((await env.call('joined','index'))[0]),e.getAddress(c.index.address));
  report.finalProfile={manifest:plain(env.manifest),manifestHash:e.keccak256(e.toUtf8Bytes(JSON.stringify(plain(env.manifest)))),indexManifest:(await env.call('index','manifestHash'))[0],tagProfile:(await env.call('index','tagProfileHash'))[0],setupThrough:env.transactions.length};
  sdk=createFilesCompactSdk({ethers:e,manifest:env.manifest,rpc:env.rpc,journal:await env.createJournal('final-resource')});
  const tiny=await paid('ledger','readSetHash',[{principalIds:[],positions:[],expectedHeads:[]}],'trace-convention-control');
  report.traceConvention={receiptGas:tiny.receipt.gasUsed,trace:await boundedTrace(tiny.receipt.transactionHash),rule:'Root inclusive gas convention calibrated against receipt and intrinsic gas; never sum parent and descendant frames.'};
  const created=await operation('Files/create-inline-41','create',{name:'final-note.txt',document:'x'.repeat(41),salt:e.id('resource/final-note')},{attribute:true});
  await operation('Files/edit-inline-41','edit',{file:created.file,document:'y'.repeat(41)},{attribute:true});
  const ft=await operation('Files/tag-file-fresh-Concept','addTag',{file:created.file,scope:'file',conceptLabel:'final-file-tag'},{attribute:true});
  const rt=await operation('Files/tag-revision-fresh-Concept','addTag',{file:created.file,scope:'revision',conceptLabel:'approved'},{attribute:true});
  await operation('Files/tag-file-existing-Concept','addTag',{file:created.file,scope:'file',concept:env.tags.conceptC},{attribute:true});
  await operation('Files/tag-revision-existing-Concept','addTag',{file:created.file,scope:'revision',concept:env.tags.conceptC});
  await operation('Files/rename-fresh','rename',{file:created.file,fromName:'final-note.txt',name:'renamed-final.txt'});
  await operation('Files/remove','remove',{file:created.file,name:'renamed-final.txt'});
  await operation('Files/restore-explicit-replace','restorePlacement',{file:created.file,name:'renamed-final.txt',replace:true});
  await operation('Files/legacy-mask-remove-tag','removeTag',{file:created.file,scope:'file',concept:ft.concept});
  const descriptor=await operation('Files/create-descriptor-41','create',{name:'descriptor.bin',salt:e.id('resource/descriptor'),content:{bytes:new Uint8Array(41).fill(123),media:0}});
  const long=await operation('Files/create-Name255','create',{name:'a'.repeat(255),salt:e.id('resource/long-name'),document:'z'.repeat(41)});
  const coldSdk=createFilesCompactSdk({ethers:e,manifest:env.manifest,rpc:env.rpc,journal:await env.createJournal('cold-final-resource')});
  const coldBefore={...env.metrics},context=await coldSdk.pin(),inline=await coldSdk.readContent({file:created.file,authors:Object.values(env.manifest.authors),context}),content=await coldSdk.readContent({file:descriptor.file,authors:Object.values(env.manifest.authors),context});
  assert.equal(e.toUtf8String(inline.bytes),'y'.repeat(41));assert.deepEqual(Array.from(content.bytes),Array(41).fill(123));
  report.coldJourney={context,inline,content,metrics:Object.fromEntries(['calls','httpRequests','requestBytes','responseBytes'].map(k=>[k,env.metrics[k]-coldBefore[k]])),qualification:'fresh SDK instance and journal; loopback provider; descriptor bytes fetched and digest checked, not only index membership'};
  const basis=async()=>[(await env.call('ledger','counts'))[0],(await env.call('index','generation'))[0],(await env.call('registry','epoch'))[0],(await env.call('ledger','executionSet'))[0]];
  const alice=env.tags.principals.alice;
  await paid('livePaid','read',[c.mounted.address,env.manifest.folder,[alice],e.id('renamed-final.txt'),await basis()],'read/mounted-inline');
  await paid('livePaid','read',[c.mounted.address,env.manifest.folder,[alice],e.id('descriptor.bin'),await basis()],'read/mounted-descriptor');
  // Existing consumer checks selected HEAD and revision tag before native execute.
  await env.deploy('finalApplication','FilesApplication.sol','FilesApplication',[c.ledger.address,c.files.address,env.wallets.alice.address,env.wallets.alice.address,env.wallets.alice.address,rt.concept]);
  await paid('finalApplication','adoptApprovedRevisionGuarded',[created.file,rt.actions.find(a=>a.purpose===T).subject,0,await basis()],'native/Files-application-adoption',{who:'alice'});
  assert.equal((await env.call('finalApplication','adoptionCount'))[0],1n);
  // Small exact Record control: separate identity/admission projection, no selection.
  const noteTypes=[],noteHashes=[];
  for(const [name,shape] of [['NoteV1Rule','lab/type/note-ascii/v1'],['NoteV11Rule','lab/type/note-ascii/v1.1'],['NoteV2Rule','lab/type/note-ascii/v2']]){
    const rule=await env.deploy(name,'NoteProfile.sol',name),type=(await env.call('registry','typeIdOf',[e.id(shape),rule,[]]))[0];
    await env.transact('registry','register',[e.id(shape),rule,[]],`setup/note/${name}`);noteTypes.push(type);noteHashes.push(c[name].codeHash);
  }
  await env.deploy('note','NoteProfile.sol','NotePointReader',[c.ledger.address,noteTypes,noteHashes]);
  const noteBody=e.hexlify(Buffer.concat([Buffer.from('NTV1'),Buffer.from([0,5]),Buffer.from('hello')]));
  await env.transact('ledger','publish',[noteTypes[0],noteBody],'setup/note-record');
  await paid('note','consume',[record(noteTypes[0],noteBody),false,false],'read/exact-Note-v1');
  await env.deploy('eligibility','CoreOrderedAcceptance.t.sol','EquipmentEligibility');
  await env.deploy('equipmentRule','CoreOrderedAcceptance.t.sol','EquipmentRule',[c.eligibility.address]);
  await env.deploy('equipmentApp','CoreOrderedAcceptance.t.sol','EquipmentApplication');
  const register=async(label,rule=e.ZeroAddress,refs=[])=>{const shape=e.id('resource/'+label),type=(await env.call('registry','typeIdOf',[shape,rule,refs]))[0];
    await env.transact('registry','register',[shape,rule,refs],`setup/type/${label}`);return type;};
  const character=await register('Character'),item=await register('Item'),refTypes=[character,...Array(7).fill(item)];
  const equipment=await register('Equipment',c.equipmentRule.address,refTypes),eb=refTypes.map((_,i)=>abi.encode(['uint256'],[i+1])),ids=eb.map((b,i)=>record(refTypes[i],b));
  const equipmentBody=abi.encode(['bytes32[8]','uint256'],[ids,1]),equipmentId=record(equipment,equipmentBody),ea=eb.map((b,i)=>pub(refTypes[i],b));ea.push(pub(equipment,equipmentBody));eb.push(equipmentBody);
  const nine=await paid('equipmentApp','equip',[c.ledger.address,ea,eb],'native/Character-seven-Items-Equipment-nine-leaf');
  const first=(await env.call('ledger','record',[equipmentId]))[1],withdraw={...base,kind:6,target:e.toBeHex(first,32)};
  const updated=abi.encode(['bytes32[8]','uint256'],[ids,2]);
  await paid('equipmentApp','equip',[c.ledger.address,[withdraw,pub(equipment,updated)],['0x',updated]],'native/Equipment-small-update');
  const snap=async()=>plain({counts:await env.call('ledger','counts'),ops:await env.call('equipmentApp','operations'),nonce:await env.call('ledger','nonces',[c.equipmentApp.address]),
    record:await env.call('ledger','record',[record(equipment,updated)]),postings:await env.call('index','postingHead',[posting(equipment,1,0,Z)])});
  const retained=await snap();await env.transact('eligibility','set',[false],'setup/later-rule-refusal');
  const updatedFirst=(await env.call('ledger','record',[record(equipment,updated)]))[1];
  await paid('equipmentApp','equip',[c.ledger.address,[{...withdraw,target:e.toBeHex(updatedFirst,32)},pub(item,abi.encode(['uint256'],[99])),pub(equipment,equipmentBody)],['0x',abi.encode(['uint256'],[99]),equipmentBody]],'native/later-rule-and-app-rollback',{refuse:true});
  assert.deepEqual(await snap(),retained);report.nativeRollback={before:retained,after:await snap(),prefixItemAbsent:(await env.call('ledger','record',[record(item,abi.encode(['uint256'],[99]))]))[1]===0n};
  assert(report.nativeRollback.prefixItemAbsent);await env.transact('eligibility','set',[true],'setup/eligibility-restore');
  // Actual final-profile 64-principal x 4-coordinate guard; first coordinate populated.
  const principals=[...Array.from({length:63},(_,i)=>e.toBeHex(i+1,32)),alice];
  const positions=[position(H,created.file,Z),...Array.from({length:3},(_,i)=>position(e.id('resource/guard-purpose'),e.id(`resource/guard-subject/${i}`),Z))];
  const makeReads=async(core,ps=positions)=>{const expectedHeads=[];for(const p of ps)for(const principal of principals)expectedHeads.push((await env.call(core,'headSnapshot',[principal,p]))[0]);return {principalIds:principals,positions:ps,expectedHeads};};
  const reads=await makeReads('ledger'),readsHash=(await env.call('ledger','readSetHash',[reads]))[0];
  async function guard(core,actions,bodies,readSet,label,expected='SUCCESS'){
    const before=await state(core),rh=(await env.call(core,'readSetHash',[readSet]))[0],old=(await env.call(core,'readSetBytes',[rh]))[0];
    const nonce=(await env.call(core,'nonces',[env.wallets.deployer.address]))[0],execution=(await env.call(core,'executionSet'))[0];
    const args=[actions,bodies,nonce,execution,readSet],receipt=await env.observe(await env.enqueue(label,{to:c[core].address,data:new e.Interface(c[core].abi).encodeFunctionData('executeGuarded',args)}));
    const after=await state(core),retained=(await env.call(core,'readSetBytes',[rh]))[0];if(expected!==null)assert.equal(receipt.status,expected,label);
    if(receipt.status==='SUCCESS'){assert.equal(retained,abi.encode([readType],[readSet]));for(let i=0;i<actions.length;i++)if(actions[i].kind===1)assert.equal((await env.call(core,'record',[record(actions[i].typeId,bodies[i])]))[3],bodies[i]);}
    else{assert.deepEqual(after.counts,before.counts);assert.equal(retained,old);assert.equal((await env.call(core,'nonces',[env.wallets.deployer.address]))[0],nonce);}
    const row={label,receipt,before,after,args,readSetHash:rh,readSetBytesBefore:bytes(old),readSetBytesAfter:bytes(retained),preimage:abi.encode([readType],[readSet]),scope:core,
      bodies:bodies.map(b=>({bytes:bytes(b),nonzero:e.getBytes(b).filter(x=>x!==0).length}))};report.operations.push(row);await checkpoint();return row;
  }
  const small=abi.encode(['uint256'],[1234]);
  await guard('ledger',[pub(item,small)],[small],reads,'guard/final-index-64x4-first');
  await guard('ledger',[pub(item,abi.encode(['uint256'],[1235]))],[abi.encode(['uint256'],[1235])],reads,'guard/final-index-64x4-same-preimage-dedup');
  assert.equal(bytes((await env.call('ledger','readSetBytes',[readsHash]))[0]),10592);
  await operation('Files/edit-before-stale-guard','edit',{file:created.file,document:'q'.repeat(41)});
  await guard('ledger',[pub(item,abi.encode(['uint256'],[1236]))],[abi.encode(['uint256'],[1236])],reads,'guard/final-index-populated-changed-head-miss','REVERTED');
  // Distinct configured index: maximum body with 8 checked refs, 4 scalars, digest.
  const target=await register('stress-target'),source=await register('stress-source',e.ZeroAddress,Array(8).fill(target));
  const specs=[{typeId:source,scalars:[{kind:2,word:8},{kind:1,word:11},{kind:2,word:12},{kind:1,word:13}],digest:{enabled:true,word:10,algorithmWord:9,algorithm:e.toBeHex(1,32)}}];
  await env.deploy('stressCore','Ledger.sol','Ledger',[c.registry.address,e.id('resource/separate-field-profile')]);
  await env.deploy('stressIndex','ProfiledIndexModule.sol','ProfiledIndexModule',[c.stressCore.address,specs]);
  await env.transact('stressCore','setIndexModule',[c.stressIndex.address],'setup/stress-attach');
  const targets=[];for(let i=0;i<8;i++){const b=abi.encode(['uint256'],[i+1]);await env.transact('stressCore','publish',[target,b],`setup/stress-target/${i}`);targets.push(record(target,b));}
  const fields=abi.encode(['bytes32[8]','uint256','uint256','bytes32','bytes32','uint256','bytes32'],[targets,1,1,e.toBeHex(101,32),e.toBeHex(201,32),301,e.toBeHex(401,32)]);
  const maxBody=i=>e.concat([fields,new Uint8Array(8192-bytes(fields)-1).fill(34),Uint8Array.of(i)]);
  report.customProfile={specs,indexManifest:(await env.call('stressIndex','manifestHash'))[0],separateFromOrdinaryFiles:true};
  for(let i=1;i<=3;i++){
    const b=maxBody(i),r=await paid('stressCore','publish',[source,b],`Record/8192-8refs-4scalar-digest-shared-${i}`,{core:'stressCore'});
    r.body={bytes:bytes(b),nonzero:e.getBytes(b).filter(x=>x!==0).length,refs:8,scalars:4,digest:1};assert.equal((await env.call('stressCore','record',[record(source,b)]))[3],b);
  }
  const oneReads={principalIds:[principals.at(-1)],positions:[positions[0]],expectedHeads:[(await env.call('stressCore','headSnapshot',[principals.at(-1),positions[0]]))[0]]};
  await guard('stressCore',[pub(source,fields)],[fields],oneReads,'Record/small-8refs-4scalar-digest-guarded');
  const jointReads=await makeReads('stressCore',positions.map((_,i)=>e.id(`resource/joint-fresh/${i}`)));
  await guard('stressCore',[pub(source,maxBody(4))],[maxBody(4)],jointReads,'joint/8192-8refs-4scalar-digest-fresh64x4',null);
  // New-purpose stance actions are not legacy mask removal. Representative refresh.
  const planner=createTagStancePlanner({ethers:e,call:env.call,ledgerAbi:c.ledger.abi,profileHash:report.finalProfile.tagProfile});
  for(const [label,method,extra] of [['ASSERT-existing','assertStance',{}],['DENY','denyStance',{}],['SILENT','retractToSilent',{}],
    ['selected-revision-new-Concept','assertStance',{scope:'selectedRevision',concept:undefined,conceptNamespace:e.id('resource/stance'),conceptLabel:'selected'}]]){
    const p=await planner[method]({author:env.wallets.alice.address,principals:[alice],subject:created.file,scope:'file',concept:env.tags.conceptC,...extra});
    const signed=await planner.sign(p,d=>env.wallets.alice.signingKey.sign(d).serialized),before=await state();
    const receipt=await env.observe(await env.enqueue(`stance/${label}`,{to:c.ledger.address,data:signed.data},'bob'));assert.equal(receipt.status,'SUCCESS');
    const a=p.actions.at(-1),head=await env.call('ledger','head',[binding(alice,position(a.purpose,a.subject,a.role))]);assert.equal(head[5],a.target);
    report.operations.push({label:`stance/${label}`,plan:p,signed,receipt,before,after:await state(),readback:plain(head),signatures:1,transactions:1});
  }
  await env.deploy('tagLens','TagStanceReader.sol','TagStanceLens',[c.ledger.address,c.index.address]);
  await env.deploy('tagReader','TagStanceReader.sol','TagStanceReader',[c.ledger.address,c.index.address,c.tagLens.address,c.tagLens.codeHash]);
  // Each accumulator owns the prefix. Every page, including refusals, retained.
  async function scan(P,budget,kind,{mutate=false}={}){
    const ps=P===1?[alice]:principals,key=`scan-${kind}-${P}-${budget}${mutate?'-mutate':''}`,session=e.id(key),b=await basis();
    const query=kind==='folder'?{concept:env.tags.conceptC,tagScope:3,diagnosticHead:false,search:'renamed'}:{direction:2,mode:1,exact:env.tags.conceptC,diagnosticHead:false};
    if(kind==='folder')await env.deploy(key,'FilesQueryAccumulator.sol','FilesQueryAccumulator',[c.joined.address,env.manifest.folder,ps,query,b,session]);
    else await env.deploy(key,'TagStanceQueryAccumulator.sol','TagStanceQueryAccumulator',[c.tagReader.address,c.tagReader.codeHash,ps,query,[...b,(await env.call('ledger','realmId'))[0],report.finalProfile.tagProfile],session]);
    const q={key,P,budget,kind,query,basis:b,principals:ps,steps:[]};report.queries.push(q);
    for(let i=0;i<16;i++){
      const before=(await env.call(key,'scanned'))[0],receipt=await env.observe(await env.enqueue(`${key}/page${i+1}`,{to:c[key].address,data:new e.Interface(c[key].abi).encodeFunctionData('step',[session,budget])}));
      q.steps.push({receipt,scannedBefore:before,scannedAfter:(await env.call(key,'scanned'))[0]});
      if(receipt.status==='REVERTED'){assert.equal((await env.call(key,'scanned'))[0],before);q.refused=true;break;}
      if((await env.call(key,'complete'))[0]){q.complete=true;break;}
      if(mutate&&i===0)await operation('query/relevant-folder-change','rename',{file:long.file,fromName:'a'.repeat(255),name:'long-renamed.txt'});
      else await env.transact('ledger','publish',[item,abi.encode(['uint256'],[9000+report.queries.length*20+i])],`${key}/unrelated-between-pages`);
    }
    q.readback={scanned:(await env.call(key,'scanned'))[0],total:(await env.call(key,'rawTotal'))[0],rows:(await env.call(key,'rowCount'))[0],unknown:(await env.call(key,'unknownCount'))[0],commitment:(await env.call(key,'resultCommitment'))[0],absent:(await env.call(key,'originAbsent'))[0]};
    assert(q.complete||q.refused,'finite page bound');if(q.complete){assert.equal(q.readback.scanned,q.readback.total);assert.equal(q.readback.unknown,0n);}
    if(mutate)assert(q.refused,'relevant folder mutation must refuse');await checkpoint();
  }
  for(const P of [1,64])for(const budget of [1,4]){await scan(P,budget,'folder');await scan(P,budget,'stance');}
  await scan(1,1,'folder',{mutate:true});
  // Largest admitted leaf control on the actual final index, not archive retention.
  const creates=Array.from({length:55},(_,i)=>({...base,kind:5,salt:e.id(`resource/bulk/${i}`)}));
  const largest=await paid('ledger','execute',[creates,Array(55).fill('0x'),(await env.call('ledger','nonces',[env.wallets.deployer.address]))[0]],'publication/55-CREATE-final-index');
  async function replay(core,indexName,file,name,args){
    await env.deploy(indexName,file,name,args);const end=(await env.call(core,'counts'))[3];
    for(let p=1n;p<=end;p++){
      const before=plain(await env.call(indexName,'replayReadiness')),receipt=await env.observe(await env.enqueue(`replay/${indexName}/${p}`,{to:c[indexName].address,data:new e.Interface(c[indexName].abi).encodeFunctionData('replayNextPublication')}));
      const after=plain(await env.call(indexName,'replayReadiness'));report.replays.push({core,index:indexName,publication:p,receipt,before,after});
      if(receipt.status==='REVERTED'){assert.deepEqual(after,before);break;}assert.equal((await env.call(indexName,'lastPublication'))[0],p);
    }
  }
  await replay('stressCore','stressReplay','ProfiledIndexModule.sol','ProfiledIndexModule',[c.stressCore.address,specs]);
  await replay('ledger','finalReplay','TagStanceProfile.sol','TagStanceIndex',env.tags.indexArgs);
  report.replayTargets={nineLeafPublication:nine.after.counts[3],largestLeafPublication:largest.after.counts[3],largestLeafCount:55,
    semantics:'Paid detached whole-publication replay. Historical write, replay and setup kept separate. No cutover if any predecessor refuses.'};
  // Exact historical artifacts are not relabelled as these fresh-build identities.
  report.historical=[];
  for(const path of ['core-closeout-tags-20260915/query-paid-final2.json.gz','core-closeout-tags-20260915/query-fix1-diagnostic.json.gz','core-closeout-sdk-20260915/readset-carrier-paid.json.gz']){
    const raw=await readFile(path),p=JSON.parse(gunzipSync(raw));const pins=Object.entries(p.sources??{}).map(([k,v])=>({path:k,then:typeof v==='string'?v:v.sha256??v.keccak256,now:report.sources[k]??null}));
    report.historical.push({path,sha256:sha(raw),source:p.sourceCommit??p.sourceHead??p.base,profile:p.profileHash,sourceComparisons:pins,
      prices:p.actions??p.findings??p.variants??null,queries:p.queries??null,
      boundary:'Retained historical source/artifacts and logical guarantees only. New clean-build metadata/codehash/Type/execution identities differ; no byte-identical transaction claim.'});
  }
  // Fresh readonly public fee oracle/provider controls; no public send methods.
  report.publicInputs=[];
  async function publicBatch(url,calls){
    const started=Date.now(),payload=calls.map(([method,params],i)=>({jsonrpc:'2.0',id:i+1,method,params}));
    const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
    const reader=response.body.getReader(),chunks=[];let length=0;while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>1048576){await reader.cancel();throw Error('public response cap');}chunks.push(Buffer.from(part.value));}
    const body=Buffer.concat(chunks).toString(),result=JSON.parse(body);report.publicInputs.push({url,at:new Date().toISOString(),request:payload,httpStatus:response.status,responseBytes:length,ms:Date.now()-started,response:result});
    return payload.map(p=>result.find(r=>r.id===p.id));
  }
  try{
    const baseUrl='https://mainnet.base.org',[chain,header,gas]=await publicBatch(baseUrl,[['eth_chainId',[]],['eth_getBlockByNumber',['latest',false]],['eth_gasPrice',[]]]);
    assert.equal(chain.result,'0x2105');const block={blockHash:header.result.hash,requireCanonical:true},oracle='0x420000000000000000000000000000000000000F';
    const oi=new e.Interface(['function getL1Fee(bytes) view returns(uint256)','function getOperatorFee(uint256) view returns(uint256)']);
    const raw=(await readFile(join(env.dir,'transactions.jsonl'),'utf8')).trim().split('\n').map(JSON.parse);report.baseModels=[];
    for(const label of ['Files/create-inline-41','Files/create-descriptor-41','Files/tag-file-existing-Concept','native/Character-seven-Items-Equipment-nine-leaf','Record/8192-8refs-4scalar-digest-shared-1']){
      const r=raw.find(v=>v.label===label),tx=e.Transaction.from(r.rawTransaction),unsigned=tx.unsignedSerialized;
      const fees=await publicBatch(baseUrl,[['eth_call',[{to:oracle,data:oi.encodeFunctionData('getL1Fee',[unsigned])},block]],['eth_call',[{to:oracle,data:oi.encodeFunctionData('getOperatorFee',[r.gasUsed])},block]]]);
      const values=fees.map((v,i)=>v.result?oi.decodeFunctionResult(i?'getOperatorFee':'getL1Fee',v.result)[0]:null),execution=BigInt(r.gasUsed)*BigInt(gas.result);
      report.baseModels.push({label,unsigned,localGas:r.gasUsed,executionPrice:BigInt(gas.result),execution,l1:values[0],operator:values[1],total:values.some(v=>v===null)?null:execution+values[0]+values[1],block,
        qualification:'Cross-venue local-gas plus observed Base oracle model. Not a Base receipt or deployment proof.'});
    }
    for(const [url,expected] of [[baseUrl,'0x2105'],['https://mainnet.era.zksync.io','0x144']]){
      const [id,head]=await publicBatch(url,[['eth_chainId',[]],['eth_getBlockByNumber',['latest',false]]]);assert.equal(id.result,expected);
      const pinned={blockHash:head.result.hash,requireCanonical:true},bad={blockHash:'0x'+'11'.repeat(32),requireCanonical:true};
      await publicBatch(url,[['eth_getCode',[e.ZeroAddress,pinned]],['eth_getStorageAt',[e.ZeroAddress,Z,pinned]],['eth_call',[{to:'0x0000000000000000000000000000000000000004',data:'0x1234'},pinned]],
        ['eth_getCode',[e.ZeroAddress,bad]],['eth_getStorageAt',[e.ZeroAddress,Z,bad]],['eth_call',[{to:'0x0000000000000000000000000000000000000004',data:'0x1234'},bad]]]);
    }
    report.era='Execution/ergs/pubdata/deployment UNMEASURED; no Anvil gas x Era price model.';
  }catch(cause){report.warnings.push({publicInputsUnavailable:cause.message});}
  report.status='PASS';await checkpoint();
}catch(cause){error=cause;report.status='FAIL';report.error={message:cause.message,stack:cause.stack};}
finally{
  if(env){try{
    report.contracts=env.contracts;report.transactions=env.transactions;report.metrics=env.metrics;report.environment={dir:env.dir,pid:env.anvilPid,port:env.port,history:env.historyPolicy};
    const raw=await readFile(join(env.dir,'transactions.jsonl'));assert(raw.length<32000000);report.exactTransactions=raw.toString().trim().split('\n').map(JSON.parse);
    for(const contract of Object.values(env.contracts)){contract.runtime=await env.rpc('eth_getCode',[contract.address,'latest']);assert.equal(e.keccak256(contract.runtime),contract.codeHash);}
  }catch(cause){report.captureError={message:cause.message,stack:cause.stack};if(!error){error=cause;report.status='FAIL';}}
  finally{await env.close();report.cleanup={closed:true,ownerUntouched:true};}}
  for(const path of ['script/core-final-resource.mjs','script/compact-environment.mjs','browser/compact-sdk.mjs','browser/compact-sdk-v2.mjs','browser/compact-files-sdk.mjs','browser/tag-stance-profile.mjs']){const b=await readFile(path);report.sources[path]={sha256:sha(b),keccak256:e.keccak256(b)};}
  await checkpoint();console.log(JSON.stringify({status:report.status,error:report.error,cleanup:report.cleanup,path:`${dir}/${run}.json.gz`}));
}
if(error)throw error;
