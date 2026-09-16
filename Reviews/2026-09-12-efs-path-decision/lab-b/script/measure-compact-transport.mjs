/** Matched finite SDK transport experiment; no public endpoints or UI changes. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {createEnvironment} from './compact-environment.mjs';
import {createCompactEngine} from '../browser/compact-sdk.mjs';
import {guardedProtocol} from '../browser/compact-sdk-v2.mjs';
import * as contentCodec from '../browser/compact-content.mjs';
const lab=fileURLToPath(new URL('../',import.meta.url));
const numeric=['calls','wireCalls','httpRequests','httpBatches','requestBytes','responseBytes','fallbacks'];
const work=['attempts','hits','misses','inflightHits','evictions','oversize','contextHits','contextMisses'];
const diff=(a,b,keys)=>Object.fromEntries(keys.map(k=>[k,(a[k]??0)-(b[k]??0)]));
const methodDiff=(a,b)=>Object.fromEntries(Object.entries(diff(a,b,Object.keys({...a,...b}).sort())).filter(([,count])=>count));
const reports=[],sourceHead=execFileSync('git',['rev-parse','HEAD'],{cwd:lab,encoding:'utf8'}).trim();
const files=['browser/compact-sdk.mjs','browser/compact-sdk-v2.mjs','browser/compact-content.mjs',
  'script/compact-environment.mjs','script/compact-read-transport.mjs','script/measure-compact-transport.mjs'];
for(const profile of ['guarded-inline','directory-carrier'])for(const mode of ['uncached','cache-only','batch-only','combined']){
  const rich=profile==='directory-carrier',cached=['cache-only','combined'].includes(mode),batch=['batch-only','combined'].includes(mode);
  const env=await createEnvironment({protocol:'compact-guarded-v2',evidenceMode:'append',transportOptions:{batch},
    ...(rich?{filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2'}:{})});
  try {
    const {ethers:e,rpc,manifest,wallets}=env,pins={};for(const path of files)pins[path]=e.keccak256(await readFile(join(lab,path)));
    const artifactPins={};for(const [file,name] of [['Ledger.sol','Ledger'],['TypeRegistry.sol','TypeRegistry'],['FilesPageReader.sol','FilesPageReader']]){
      const path=join(process.env.FOUNDRY_OUT,file,name+'.json'),raw=await readFile(path),artifact=JSON.parse(raw),metadata=typeof artifact.metadata==='string'?JSON.parse(artifact.metadata):artifact.metadata;
      assert.equal(metadata.compiler.version,'0.8.30+commit.73712a01');assert.equal(metadata.settings.evmVersion,'cancun');assert.equal(metadata.settings.optimizer.runs,200);assert.equal(metadata.settings.viaIR,true);
      for(const [source,pin] of Object.entries(metadata.sources))assert.equal(e.keccak256(await readFile(join(lab,source))),pin.keccak256,'artifact exact source');
      artifactPins[`${file}/${name}`]={keccak256:e.keccak256(raw),sourcePins:metadata.sources};
    }
    let protocol,sdk,phase='unscoped',phaseStart={},cachePhases={};
    const mark=next=>{if(sdk){const current=sdk.readMetrics(),old=cachePhases[phase]??Object.fromEntries(work.map(k=>[k,0]));
      const changes=diff(current,phaseStart,work);cachePhases[phase]=Object.fromEntries(work.map(k=>[k,old[k]+changes[k]]));phaseStart=current;}
      phase=next;rpc.phase(next);};
    sdk=createCompactEngine({ethers:e,rpc,manifest,contentCodec,journal:await env.createJournal('transport'),readCache:{enabled:cached},onPhase:mark},scope=>protocol=guardedProtocol(scope));
    const observations=[];
    const measured=async(label,fn)=>{
      mark(label);const before=rpc.snapshot(),beforeCache=sdk.readMetrics(),beforePhases=structuredClone(cachePhases),start=performance.now();
      const value=await fn();mark('between');const after=rpc.snapshot();
      observations.push({label,ms:performance.now()-start,...diff(after,before,numeric),cache:diff(sdk.readMetrics(),beforeCache,work),
        byMethod:methodDiff(after.byMethod,before.byMethod),
        phases:Object.fromEntries(Object.entries(after.phases).map(([p,row])=>[p,diff(row,before.phases[p]??{},numeric)]).filter(([,r])=>r.calls)),
        cachePhases:Object.fromEntries(Object.entries(cachePhases).map(([p,row])=>[p,diff(row,beforePhases[p]??{},work)]).filter(([,r])=>r.attempts)),
        cacheState:sdk.readMetrics()});return value;
    };
    const authors=[wallets.alice.address,wallets.bob.address],signedPayloads=[];
    const run=async(operation,args)=>{
      const plan=await sdk.prepare({operation,author:wallets.alice.address,authors,deadline:'2000000000',...args});
      const signed=await sdk.authorize(plan,d=>wallets.alice.signingKey.sign(d).serialized);
      signedPayloads.push({operation,calldataHash:e.keccak256(signed.transaction.data),actionsHash:plan.actionsHash,readSetHash:plan.intent.readSetHash});
      await sdk.submit(signed,tx=>env.send(operation,tx,'alice'));assert.equal((await sdk.reconcile(plan.id)).status,'EFFECTS_VERIFIED');return plan;
    };
    const created=await measured('first-cold-create',()=>run('create',{name:'transport.txt',salt:e.id('transport-matched-primary'),
      ...(rich?{content:{bytes:new TextEncoder().encode('x'.repeat(41)),media:0}}:{document:'x'.repeat(41)})}));
    const read=async(expected,client=sdk)=>{
      const context=await client.pin(),result=await client.readFile({file:created.file,authors,context});assert.equal(result.knowledge,'PRESENT');
      if(rich){const content=await client.readContent({file:created.file,authors,context});assert.equal(e.toUtf8String(content.bytes),expected);}
      else assert.equal(e.toUtf8String(result.value.revision.document),expected);
      return result;
    };
    await measured('same-block-first-read',()=>read('x'.repeat(41)));await measured('same-block-repeat-read',()=>read('x'.repeat(41)));
    await measured('edit-write-new-block',()=>run('edit',{file:created.file,...(rich?{content:{bytes:new TextEncoder().encode('y'.repeat(41)),media:0}}:{document:'y'.repeat(41)})}));
    await measured('new-block-read',()=>read('y'.repeat(41)));
    // The ordinary post-write read can be warmed by reconciliation. This
    // separate fresh engine makes the cold-instance/new-block cost explicit.
    const cold=createCompactEngine({ethers:e,rpc,manifest,contentCodec,readCache:{enabled:cached}},guardedProtocol);
    mark('new-block-cold-instance');const coldBefore=rpc.snapshot(),coldWork=cold.readMetrics(),coldStart=performance.now();
    await read('y'.repeat(41),cold);
    observations.push({label:'new-block-cold-instance',ms:performance.now()-coldStart,...diff(rpc.snapshot(),coldBefore,numeric),
      byMethod:methodDiff(rpc.snapshot().byMethod,coldBefore.byMethod),
      cache:diff(cold.readMetrics(),coldWork,work),cacheState:cold.readMetrics()});
    // Fresh SDK for each named lower-level workload. The factory seam keeps
    // actual protocol authorization/preflight code under test, not a replica.
    const readSets=[];
    for(const [n,m] of [[1,1],[8,4],[64,4]]){
      let p;const client=createCompactEngine({ethers:e,rpc,manifest,contentCodec,readCache:{enabled:cached}},scope=>p=guardedProtocol(scope));
      rpc.phase('readset-pin');const context=await client.pin();
      const ids=Array.from({length:n},(_,i)=>e.zeroPadValue(e.toBeHex(i+100),32));ids[Math.min(17,n-1)]=e.zeroPadValue(wallets.alice.address,32);
      const head=e.keccak256(e.AbiCoder.defaultAbiCoder().encode(['bytes32','bytes32','bytes32','bytes32'],[e.id('efs2/position/1'),e.id('efs2/purpose/head/1'),created.file,e.ZeroHash]));
      const positions=Array.from({length:m},(_,i)=>i===0?head:e.id(`transport-readset-position-${i}`));
      const spec={intent:{...created.intent,coreCodeCommitment:context.core},actionsHash:created.actionsHash,authors:ids,principalId:e.zeroPadValue(wallets.alice.address,32),context,
        guardPositions:positions.map(position=>({position,meaning:'selected-head'}))};
      let first;
      for(const repeat of [false,true]){
        rpc.phase('readset-snapshots');const before=rpc.snapshot(),beforeCache=client.readMetrics(),start=performance.now();
        const authorization=await p.authorization(spec);await p.preflight(authorization,context);
        assert.equal(authorization.readSet.expectedHeads.length,n*m);
        if(first)assert.deepEqual(authorization.readSet,first.readSet);else first=authorization;
        readSets.push({principals:n,positions:m,repeat,scope:'INTERNAL_AUTHORIZATION_AND_PREFLIGHT_ONLY',
          excluded:'Initial pin, fresh chain identity, public entry/final canonicality, signing, exact signed RPC preflight, sends, journals and reconciliation.',
          ms:performance.now()-start,...diff(rpc.snapshot(),before,numeric),byMethod:methodDiff(rpc.snapshot().byMethod,before.byMethod),cache:diff(client.readMetrics(),beforeCache,work)});
      }
      const bad=structuredClone(first);bad.readSet.expectedHeads[Math.min(17,n-1)]=e.ZeroHash;
      await assert.rejects(p.preflight(bad,context),/READSET_DRIFT/,'ordered snapshot comparison includes later bounded chunks');
    }
    const transactions=env.transactions.filter(row=>['create','edit'].includes(row.label)).map(({label,transactionHash,blockHash,blockNumber,gasUsed,gasLimit,calldataBytes,status})=>
      ({label,transactionHash,blockHash,blockNumber,gasUsed,gasLimit,calldataBytes,status}));
    assert(transactions.length===2);assert.equal(env.historyPolicy.states,256);assert.equal(env.historyPolicy.transactionBlocks,512);
    reports.push({profile,mode,sourceHead,pins,artifactPins,manifest,limits:rpc.limits,historyPolicy:env.historyPolicy,observations,readSets,transactions,signedPayloads,
      metrics:rpc.snapshot(),evidence:'LOCAL_RPC_OBSERVED_NOT_STATE_PROOF',recipe:rich?'Typed Directory;41-byte SHA-256 descriptor-backed inline-carrier create/edit;Alice/Bob ordered Lens;transport.txt;fixed salt transport-matched-primary.'
        :'Guarded inline41-byte create/edit;Alice/Bob ordered Lens;transport.txt;fixed salt transport-matched-primary.'});
    console.log(JSON.stringify({profile,mode,status:'PASS',rows:observations.map(({label,calls,httpRequests,requestBytes,responseBytes,ms,byMethod})=>({label,calls,httpRequests,requestBytes,responseBytes,ms,byMethod})),readSets}));
  }finally{await env.close();}
}
// Cross-mode semantic/call controls: batching changes envelopes, not logical
// EVM work; caching modes share identical read work and plan shape. Receipt
// polling is scheduling-dependent, but remains in all actual traffic totals.
const output=join(lab,'core-closeout-sdk-20260915/transport-measurements.json.gz');
const packet={status:'PENDING_COMPARISON',sourceHead,sharedGrouping:true,serialLatencyComparison:false,limitsAreExperimental:true,
  qualifications:{postWriteRead:'same-block-first-read and new-block-read may reuse evidence warmed by preceding reconciliation; new-block-cold-instance cannot.',
    zeroNetworkReadSets:'Only internal protocol subphases. Public current operations always acquire fresh headers/chain identity and independently recheck canonicality.',
    receiptPolling:'Only eth_getTransactionReceipt may differ in the fixed-work comparison; full actual logical/HTTP/bytes/latency totals are never normalized.'},
  comparisons:[],reports};
const save=()=>writeFile(output,gzipSync(JSON.stringify(packet,null,2)+'\n'));
// Retain the observations even if a subsequent comparison fails.
await save();
try {
for(const profile of ['guarded-inline','directory-carrier']){
  const rows=reports.filter(r=>r.profile===profile);
  for(const [a,b] of [[rows[0],rows[2]],[rows[1],rows[3]]]){
    for(let i=0;i<a.observations.length;i++){
      const left=a.observations[i],right=b.observations[i];assert.equal(left.label,right.label);
      for(const row of [left,right])assert.equal(Object.values(row.byMethod).reduce((sum,n)=>sum+n,0),row.calls,'method counts cover all actual calls');
      const differingMethods=methodDiff(left.byMethod,right.byMethod);
      packet.comparisons.push({profile,modes:[a.mode,b.mode],operation:left.label,differingMethods,
        receiptPolls:[left.byMethod.eth_getTransactionReceipt??0,right.byMethod.eth_getTransactionReceipt??0],actualCalls:[left.calls,right.calls]});
      const fixed=row=>Object.fromEntries(Object.entries(row.byMethod).filter(([method])=>method!=='eth_getTransactionReceipt'));
      assert.deepEqual(fixed(left),fixed(right),'all non-receipt RPC method counts must match');
    }
    assert.deepEqual(a.readSets.map(r=>r.calls),b.readSets.map(r=>r.calls));
  }
  for(const row of rows){assert.deepEqual(row.signedPayloads,rows[0].signedPayloads,'byte-identical signed calldata across matched modes');
    assert.deepEqual(row.transactions.map(r=>[r.calldataBytes,r.gasUsed]),rows[0].transactions.map(r=>[r.calldataBytes,r.gasUsed]),'unchanged onchain work');}
}
packet.status='PASS';await save();
}catch(error){packet.status='FAILED';packet.comparisonFailure=error.message;await save();throw error;}
console.log(`Evidence: ${output}`);
