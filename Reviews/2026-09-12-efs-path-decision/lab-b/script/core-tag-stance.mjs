// Finite paid Task2 campaign. Separate setup, whole actions and owned queries;
// loopback history256/cache512, ordinary15M, no traces or owner host access.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createTagEnvironment} from '../core-closeout-tags-20260915/fixture.mjs';
import {createTagStancePlanner} from '../browser/tag-stance-profile.mjs';
import {rebuildArchive} from '../core-closeout-tags-20260915/query-archive.mjs';

const report={base:'12efe4b52c9ebbb637407c02cb25b633d576fb65',limits:{runtime:24576,initcode:49152,gas:15000000,hardGas:16777216},sources:{},artifacts:{},queries:[],actions:[],refusals:[]};
let env,error;
async function captureGraph(en){
  for(const c of Object.values(en.contracts)){c.runtimeCode=await en.rpc('eth_getCode',[c.address,'latest']);assert.equal(en.ethers.keccak256(c.runtimeCode),c.codeHash);}
  const dependencies=[];
  for(const key of ['replayDecoder','scopeState','fieldProfile']){const address=(await en.call('tagIndex',key))[0],code=await en.rpc('eth_getCode',[address,'latest']);dependencies.push({key,address,code,hash:en.ethers.keccak256(code)});}
  // Include nested execution support and described rule runtimes too.
  const addresses=new Set([...(en.manifest.executionFamily?.implementations??[]).flatMap(v=>[v.publicationSupport?.address,v.signatureStore?.address]),(await en.call('registry','describedRule'))[0]].filter(Boolean));
  for(const address of addresses){const code=await en.rpc('eth_getCode',[address,'latest']);dependencies.push({key:'execution-dependency',address,code,hash:en.ethers.keccak256(code)});}
  return dependencies;
}
async function archive(en){
  const e=en.ethers,abi=e.AbiCoder.defaultAbiCoder(),a={admissions:[],contexts:{},evidence:{},cells:{},records:{},types:{},readSets:{}};
  a.realm=(await en.call('ledger','realmId'))[0];a.origin=(await en.call('ledger','realmOrigin'))[0];
  a.profileBytes=(await en.call('stanceValidator','profileBytes'))[0];a.profileHash=(await en.call('tagIndex','tagProfileHash'))[0];a.manifest=(await en.call('tagIndex','manifestHash'))[0];
  const counts=await en.call('ledger','counts');a.counts=Array.from(counts);
  for(const id of Object.values(en.manifest.types)){
    const d=await en.call('registry','descriptor',[id]),refs=(await en.call('registry','refTypes',[id]))[0];
    a.types[id]={shape:d[0],ruleHash:d[1],ruleAddress:d[2],refs:Array.from(refs)};
  }
  for(let at=1n;at<=counts[0];at++){
    const v=await en.call('ledger','admission',[at]),f={at,kind:Number(v[0]),leaf:Number(v[1]),publication:String(v[2]),ordinal:String(v[3]),expected:v[4],withdrawn:v[5],target:v[6],b:v[7]};a.admissions.push(f);
    if(!a.contexts[f.publication]){
      const c=(await en.call('ledger','publicationContext',[v[2]]))[0];a.contexts[f.publication]=Object.fromEntries(['principalId','executionSet','readSetHash','intentDigest','principalKind','authorizationProfile','intentFormat'].map((k,i)=>[k,c[i]]));
      a.evidence[f.publication]=Array.from(await en.call('ledger','evidence',[v[2]]));
      if(c[2]!==e.ZeroHash&&!a.readSets[c[2]]){
        const raw=(await en.call('ledger','readSetBytes',[c[2]]))[0],slot=e.keccak256(abi.encode(['bytes32','bytes32'],[c[2],e.id('efs.lab.ledger.read-set-carriers/1')]));
        const word=(await en.call('ledger','extsload',[slot]))[0],address=e.getAddress('0x'+word.slice(-40)),code=await en.rpc('eth_getCode',[address,'latest']);
        assert.equal(code,'0x00'+raw.slice(2));a.readSets[c[2]]={raw,address,code,codeHash:e.keccak256(code)};
      }
    }
    if(f.kind===3||f.kind===4){
      const position=(await en.call('ledger','bindingPosition',[v[3]]))[0],cell=await en.call('ledger','positionCell',[position]);a.cells[f.ordinal]={position,p:cell[0],s:cell[1],c:cell[2]};
    }
    if(f.kind===1||f.kind===2){
      const id=f.kind===1?e.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/record/1'),f.b,f.target])):f.target;
      if(!a.records[id]){const r=await en.call('ledger','record',[id]);a.records[id]={type:r[0],first:r[1],occurrences:r[2],body:r[3]};}
    }
  }
  return a;
}
try{
  env=await createTagEnvironment();const e=env.ethers,s=env.tags,abi=e.AbiCoder.defaultAbiCoder(),Z=e.ZeroHash;
  report.profileHash=(await env.call('tagIndex','tagProfileHash'))[0];
  report.profileBytes=(await env.call('stanceValidator','profileBytes'))[0];
  report.fixture=Object.fromEntries(Object.entries(s).filter(([,v])=>typeof v!=='function'));
  const files=[['TagStanceReader.sol',['TagStanceLens','TagStanceReader']],['TagStanceQueryAccumulator.sol',['TagStanceQueryAccumulator']],['TagStanceProfile.sol',['TagStanceIndex','TagStanceValidator']],['FilesFinalValidator.sol',['FilesFinalValidator']]];
  for(const [file,names] of files)for(const name of names){
    const a=JSON.parse(await readFile(join(process.env.FOUNDRY_OUT,file,`${name}.json`)));report.artifacts[name]=a;
    const m=typeof a.metadata==='string'?JSON.parse(a.metadata):a.metadata;
    assert.equal(m.compiler.version,'0.8.30+commit.73712a01');assert.equal(m.settings.optimizer.runs,200);assert(m.settings.viaIR);assert.equal(m.settings.evmVersion,'cancun');
    for(const [path,pin] of Object.entries(m.sources)){const bytes=await readFile(path);assert.equal(e.keccak256(bytes),pin.keccak256);report.sources[path]={sha256:createHash('sha256').update(bytes).digest('hex'),keccak256:pin.keccak256};}
  }
  for(const path of ['browser/tag-stance-profile.mjs','script/core-tag-stance.mjs','core-closeout-tags-20260915/query-archive.mjs']){const bytes=await readFile(path);report.sources[path]={sha256:createHash('sha256').update(bytes).digest('hex'),keccak256:e.keccak256(bytes)};}
  const planner=createTagStancePlanner({ethers:e,call:env.call,ledgerAbi:env.contracts.ledger.abi,profileHash:report.profileHash});
  const args=(subject=s.fileF,extra={})=>({author:env.wallets.alice.address,principals:[s.principals.alice],subject,scope:'file',concept:s.conceptC,...extra});
  async function action(label,fn,args_,signed=false){
    const p=await planner[fn](args_),payload=signed?await planner.sign(p,d=>env.wallets.alice.signingKey.sign(d).serialized):{data:p.nativeData};
    const tx=await env.observe(await env.enqueue(label,{to:env.contracts.ledger.address,data:payload.data},signed?'bob':'alice'));assert.equal(tx.status,'SUCCESS');
    const last=p.actions.at(-1),position=(await env.call('lens','positionKey',[s.purpose,last.subject,last.role]))[0];
    const key=e.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),s.principals.alice,position]));
    const h=await env.call('ledger','head',[key]);assert.equal(h[0],1n);assert.equal(h[5],last.target);assert.equal(h[1],last.expectedRevision+1n);
    report.actions.push({label,gas:tx.gasUsed,hash:tx.transactionHash,profileHash:report.profileHash,plan:p,readback:Array.from(h)});return p;
  }
  // Two independent identical genesis fixtures, not an evm_revert receipt that
  // disappeared from the final branch. Native/signature differ only in ingress.
  await action('action/matched-native-first','assertStance',args());
  let twin;
  try{
    twin=await createTagEnvironment();const tp=createTagStancePlanner({ethers:twin.ethers,call:twin.call,ledgerAbi:twin.contracts.ledger.abi,profileHash:(await twin.call('tagIndex','tagProfileHash'))[0]});
    const p=await tp.assertStance({author:twin.wallets.alice.address,principals:[twin.tags.principals.alice],subject:twin.tags.fileF,scope:'file',concept:twin.tags.conceptC});
    assert.deepEqual(p.actions,report.actions[0].plan.actions);assert.deepEqual(p.readSet,report.actions[0].plan.readSet);
    const signed=await tp.sign(p,d=>twin.wallets.alice.signingKey.sign(d).serialized),tx=await twin.observe(await twin.enqueue('action/matched-signed-first',{to:twin.contracts.ledger.address,data:signed.data},'bob'));
    assert.equal(tx.status,'SUCCESS');report.actions.push({label:tx.label,gas:tx.gasUsed,hash:tx.transactionHash,profileHash:report.profileHash,plan:p});
    report.matchedSigned={archive:await archive(twin),dependencies:await captureGraph(twin),contracts:twin.contracts,transactions:twin.transactions,rawTransactions:await readFile(join(twin.dir,'transactions.jsonl'),'utf8'),chain:{port:twin.port,pid:twin.anvilPid,history:twin.historyPolicy}};
  }finally{if(twin){await twin.close();if(report.matchedSigned)report.matchedSigned.chain.closed=true;}}
  await env.deploy('tagLens','TagStanceReader.sol','TagStanceLens',[env.contracts.ledger.address,env.contracts.tagIndex.address]);
  await env.deploy('tagReader','TagStanceReader.sol','TagStanceReader',[env.contracts.ledger.address,env.contracts.tagIndex.address,env.contracts.tagLens.address,env.contracts.tagLens.codeHash]);
  const readerIface=new e.Interface(env.contracts.tagReader.abi),rowArray=readerIface.getFunction('readPage').outputs[0].components.find(v=>v.name==='rows'),rowType=rowArray.arrayChildren;
  report.rowAbi=rowArray.format('full');
  const b=async()=>[(await env.call('ledger','counts'))[0],(await env.call('tagIndex','generation'))[0],(await env.call('registry','epoch'))[0],(await env.call('ledger','executionSet'))[0],(await env.call('ledger','realmId'))[0],report.profileHash];
  let serial=0;
  async function start(label,principals,q){
    const basis=await b(),session=e.id(label),key=`query${++serial}`,oracle=rebuildArchive(await archive(env),e).query(principals,q,basis[0]);
    await env.deploy(key,'TagStanceQueryAccumulator.sol','TagStanceQueryAccumulator',[env.contracts.tagReader.address,env.contracts.tagReader.codeHash,principals,q,basis,session]);
    const run={key,label,principals,query:q,basis,session,oracle,rows:[],steps:[],commitment:(await env.call(key,'queryCommitment'))[0],initialized:false};report.queries.push(run);return run;
  }
  async function step(run,budget,label=run.label,refuse=false){
    const data=new e.Interface(env.contracts[run.key].abi).encodeFunctionData('step',[run.session,budget]);
    const before=(await env.call(run.key,'scanned'))[0],tx=await env.observe(await env.enqueue(`${label}/step${run.steps.length+1}`,{to:env.contracts[run.key].address,data}));
    const item={label:tx.label,hash:tx.transactionHash,status:tx.status,gas:tx.gasUsed,budget,profileHash:report.profileHash,readerHash:env.contracts.tagReader.codeHash,lensHash:env.contracts.tagLens.codeHash};run.steps.push(item);
    if(tx.status!=='SUCCESS'){assert(refuse);assert.equal((await env.call(run.key,'scanned'))[0],before);report.refusals.push(item);return false;}
    const iface=new e.Interface(env.contracts[run.key].abi),logs=tx.receipt.logs.map(l=>{try{return iface.parseLog(l);}catch{return null;}}),rows=abi.decode([rowArray],logs.find(x=>x?.name==='Rows').args.encodedRows)[0],work=logs.find(x=>x?.name==='Work').args;
    Object.assign(item,{scannedBefore:String(before),scannedAfter:String((await env.call(run.key,'scanned'))[0]),prefixProbes:String(work[0]),historyProbes:String(work[1]),joins:String(work[2]),observedCurrent:String(work[3])});
    if(!run.initialized){run.commitment=e.keccak256(abi.encode(['bytes32','bytes32','uint64'],[run.commitment,run.oracle.pin,run.oracle.rawTotal]));run.initialized=true;}
    for(const r of rows){const named=Object.fromEntries(rowType.components.map((c,i)=>[c.name,r[i]]));run.rows.push(named);run.commitment=e.keccak256(abi.encode(['bytes32','bytes32'],[run.commitment,e.keccak256(abi.encode([rowType],[r]))]));}
    assert.equal((await env.call(run.key,'resultCommitment'))[0],run.commitment);assert.equal((await env.call(run.key,'inventoryPin'))[0],run.oracle.pin);
    if((await env.call(run.key,'complete'))[0]){
      assert.equal(abi.encode([rowArray],[run.rows]),abi.encode([rowArray],[run.oracle.rows]));assert.equal((await env.call(run.key,'rawTotal'))[0],BigInt(run.oracle.rawTotal));
      run.absent=(await env.call(run.key,'originAbsent'))[0];assert.equal(run.absent,run.oracle.rows.every(r=>r.assessment!==0&&r.assessment!==1));run.complete=true;
    }
    return true;
  }
  async function finish(run,budget){for(let i=0;i<16&&!run.complete;i++)await step(run,budget);assert(run.complete,'finite page bound');}
  const q=(direction=2,mode=1,exact=s.conceptC)=>({direction,mode,exact,diagnosticHead:false});
  await finish(await start('query/inverse-count1',[s.principals.alice],q()),8);
  await action('action/DENY','denyStance',args());await action('action/SILENT','retractToSilent',args());await action('action/ASSERT-again','assertStance',args());
  await env.transact('ledger','unbind',[s.purpose,s.fileF,s.conceptC,4],'action/UNBIND','alice');
  const unbindTx=env.transactions.at(-1),unbindPosition=(await env.call('lens','positionKey',[s.purpose,s.fileF,s.conceptC]))[0];
  const unbindHead=await env.call('ledger','head',[e.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),s.principals.alice,unbindPosition]))]);
  assert.equal(unbindHead[0],2n);assert.equal(unbindHead[1],5n);assert.equal(unbindHead[5],Z);
  report.actions.push({label:unbindTx.label,hash:unbindTx.transactionHash,gas:unbindTx.gasUsed,profileHash:report.profileHash,readback:Array.from(unbindHead),semantics:'generic UNBIND with ordinary coordinate CAS; retained tombstone means silence only in this purpose'});
  await action('action/ASSERT-after-UNBIND','assertStance',args());
  await action('action/inverse-count2','assertStance',args(s.fileG));await finish(await start('query/inverse-count2',[s.principals.alice],q()),8);
  await action('action/orphan-H','assertStance',args(s.orphanH));await action('action/older-revision','assertSuppliedRevision',args(s.revision1,{claimedFile:s.fileF}));
  await action('action/inverse-count5-directory','assertStance',args(s.directoryD,{scope:'directory'}));await finish(await start('query/inverse-count5',[s.principals.alice],q()),8);
  await action('action/inverse-count6','assertSuppliedRevision',args(s.revision2,{claimedFile:s.fileF}));await finish(await start('query/inverse-count6',[s.principals.alice],q()),8);
  await action('action/same-label-C2','assertStance',args(s.fileF,{concept:s.conceptC2}));
  await action('action/new-Concept-plus-ASSERT','assertStance',args(s.orphanH,{concept:undefined,conceptNamespace:e.id('whole-new'),conceptLabel:'new'}),true);
  await env.transact('ledger','bind',[e.id('efs2/purpose/head/1'),s.fileF,Z,s.revision1,0],'setup/HEAD','alice');
  await action('action/guarded-selected-revision','denyStance',args(s.fileF,{scope:'selectedRevision'}),true);
  const selected=await start('query/selected-origin',[s.principals.alice],q(2,3));await step(selected,1);
  const stale=await planner.assertStance(args(s.fileF,{scope:'selectedRevision'}));
  await env.transact('ledger','bind',[e.id('efs2/purpose/head/1'),s.fileF,Z,s.revision2,1],'setup/HEAD-between-pages','alice');
  const staleTx=await env.observe(await env.enqueue('refusal/stale-selected-HEAD',{to:env.contracts.ledger.address,data:stale.nativeData},'alice'));assert.equal(staleTx.status,'REVERTED');report.refusals.push({label:staleTx.label,hash:staleTx.transactionHash,gas:staleTx.gasUsed,plan:stale});
  await finish(selected,1);
  // Changes outside the Lens and same-label C2 do not enlarge C inventory.
  await env.transact('ledger','bind',[s.purpose,s.fileG,s.conceptC,s.tokens[0],0],'setup/unrelated-author','bob');
  for(const P of [1,8,64]){
    const principals=[...Array.from({length:P-1},(_,i)=>e.toBeHex(i+1,32)),s.principals.alice];
    await finish(await start(`query/tags-P${P}`,principals,q(1,1,s.fileF)),2);
    const run=await start(`query/subjects-P${P}`,principals,q(2,3));await step(run,1);
    if(P===64){
      // Relevant retained history grows; candidate inventory stays6.
      let rev=(await env.call('ledger','head',[e.keccak256(abi.encode(['bytes32','bytes32','bytes32'],[e.id('efs2/binding/1'),s.principals.alice,(await env.call('lens','positionKey',[s.purpose,s.revision2,s.conceptC]))[0]]))]))[1];
      for(let i=0;i<64;i++)await env.transact('ledger','bind',[s.purpose,s.revision2,s.conceptC,s.tokens[i%3],rev++],`setup/relevant-history-${i}`,'alice');
      await step(run,257,'refusal/budget257',true);
    }
    await finish(run,6);
  }
  report.archive=await archive(env);report.dependencies=await captureGraph(env);
  report.coverage={};for(const [key,family] of [['scope',(await env.call('tagIndex','FAMILY_SCOPE'))[0]],['history',(await env.call('tagIndex','FAMILY_HISTORY'))[0]],['inverse',s.family]])report.coverage[key]=Array.from(await env.call('tagIndex','coverage',[family,Z]));
  report.complete=true;
}catch(e){error=e;report.error=String(e.stack??e);}
finally{
  if(env){report.contracts=env.contracts;report.transactions=env.transactions;report.rawTransactions=await readFile(join(env.dir,'transactions.jsonl'),'utf8');report.chain={port:env.port,pid:env.anvilPid,dir:env.dir,history:env.historyPolicy};await env.close();report.chain.closed=true;}
  const label=process.env.EFS_TAG_QUERY_EVIDENCE??'query-paid-final2';assert(/^[a-z0-9-]+$/.test(label));
  await writeFile(new URL(`../core-closeout-tags-20260915/${label}.json.gz`,import.meta.url),gzipSync(JSON.stringify(report,(_,v)=>typeof v==='bigint'?String(v):v,2)));
}
if(error)throw error;
console.log(JSON.stringify({complete:report.complete,actions:report.actions.map(a=>({label:a.label,gas:a.gas})),queries:report.queries.map(q=>({label:q.label,steps:q.steps.length,total:q.oracle.rawTotal,gas:q.steps.map(s=>s.gas)})),refusals:report.refusals.map(r=>({label:r.label,gas:r.gas})),closed:report.chain.closed},null,2));
