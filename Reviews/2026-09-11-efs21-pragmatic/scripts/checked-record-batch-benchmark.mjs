// Disposable FullC0 Record hydration only. Own finite node/build; no public RPC or traces.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, statfsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT=fileURLToPath(new URL('..',import.meta.url)),VAULT=resolve(ROOT,'../..');
const output=join(ROOT,'evidence/checked-record-batch.json');
assert(!existsSync(output),'exclusive evidence: never overwrite a retained run');
assert(!process.env.EFS_TEST_BUILD_ROOT,'runner owns the build');
assert.notEqual(process.env.EFS_LAB_ANVIL_STEPS,'1','no traces');
const free=()=>{const s=statfsSync(VAULT);assert(s.bavail*s.bsize>20*1024**3,'stop heavy work below20GiB');};free();
const build=mkdtempSync(join(tmpdir(),'efs21-record-batch-build-'));
process.env.EFS_TEST_BUILD_ROOT=build;
const {compileUpgrade,withUpgrade}=await import('../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs');
const {publication,groupLeaf,TX_GAS}=await import('../../2026-09-05-c0-core/scripts/local-stateful.mjs');
const {ordinaryRecord}=await import('../../2026-09-05-c0-core/reference/state-reader.mjs');
const {encodeGroup,derive}=await import('../../2026-09-05-mvp-build-start/type-inputs/encoder.mjs');
const {createFixtureReader}=await import('../../2026-09-09-files-reader/reader-scope.mjs');
const {AbiCoder,Interface,keccak256,toBeHex}=await import('../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js');
const abi=AbiCoder.defaultAbiCoder(), rowType='tuple(bytes32 recordId,bytes32 typeSchemaId,bytes canonicalBody,uint64 firstAdmitOrdinal)[]';
const plain=value=>JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v));
const git=args=>{const r=spawnSync('git',args,{cwd:VAULT,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
const sourcePaths=['scripts/checked-record-batch-benchmark.mjs','../2026-09-08-upgradeable-foundation/test/RecordBatchConsumer.sol','../2026-09-09-files-reader/reader-scope.mjs'];
let cleanup,report;
try {
  console.log('Compiling one isolated full-C0 read profile');compileUpgrade({fullBuild:true});free();
  report=await withUpgrade(async lab=>{
    cleanup=lab.cleanup;
    const report={kind:'DISPOSABLE_FULLC0_RECORD_BATCH_NOT_DIRECTORY_INTEGRATION',sourceCommit:git(['rev-parse','HEAD']),
      dirtyStatus:git(['status','--short']),sourcePins:Object.fromEntries(sourcePaths.map(p=>[p,keccak256(readFileSync(resolve(ROOT,p)))])),
      resources:lab.resources,expected:lab.expected,limits:{ids:8,bodyBytes:8192,bodySumBytes:65536,abiBytes:67264,jsonRpcResponseBytes:134566,txGas:String(TX_GAS)},
      scope:'Records only; unchanged StatePointReads, writes, Lens and history. Returned data remains a source observation; assess bodies independently and seal.',
      methodology:'Raw scalar RPC intentionally repeats duplicate calls; SDK scalar uses its existing cache. All mined arms hash identical ordered rows; the scalar consumer includes realistic same-transaction warm access. Current consumer has no context preflight. Setup receipts are excluded from read gas; checked calls are pinned eth_call, not mined block predictions.',
      fixtures:[],consumerArtifacts:{},samples:[],failures:[],transactions:lab.transactions};
    async function deploy(name) {
      const path=join(build,'foundation/out/RecordBatchConsumer.sol',name+'.json'),a=JSON.parse(readFileSync(path));
      assert.equal(Object.keys(a.bytecode.linkReferences??{}).length,0);
      assert((a.bytecode.object.length-2)/2<=49152 && (a.deployedBytecode.object.length-2)/2<=24576);
      for(const [p,meta] of Object.entries(a.metadata.sources))assert.equal(keccak256(readFileSync(resolve(ROOT,'../2026-09-08-upgradeable-foundation',p))),meta.keccak256);
      const receipt=await lab.receipt(await lab.send(a.bytecode.object),name+' test fixture setup');assert.equal(receipt.status,'0x1');
      const address=receipt.contractAddress,code=await lab.rpc('eth_getCode',[address,receipt.blockNumber]);assert.equal(code,a.deployedBytecode.object);
      report.consumerArtifacts[name]={address,code,codehash:keccak256(code),compiler:a.metadata.compiler,settings:a.metadata.settings,sourcePins:a.metadata.sources,artifactHash:keccak256(readFileSync(path)),receiptHash:receipt.transactionHash};
      return {address,iface:new Interface(a.abi)};
    }
    const consumer=await deploy('RecordBatchConsumer'),multicall=await deploy('RecordExternalMulticall');
    // One legal Bytes field fills the existing8192-byte body cap (two-byte length +8190 payload).
    const descriptor={name:'RecordBatchBytes/1',meaning:'',specDigest:null,qualifier:'00'.repeat(32),fields:[{name:'payload',kind:'BYTES',max:8190}],roles:[],indexes:[],constraints:[]};
    const group=encodeGroup([descriptor]),typeId=derive(group).ids[0];
    const groupPublication=publication([groupLeaf(lab.inputs.meta,'0x'+group.toString('hex'))],51000);
    assert.equal((await lab.publish(groupPublication)).receipt.status,'0x1','legal byte type admission');
    const short=[],maximum=[];
    for(const size of [1,8190])for(let i=0;i<8;i++) {
      free();const payload=Buffer.alloc(size,0x42);payload[0]=i+1;
      const body='0x'+size.toString(16).padStart(4,'0')+payload.toString('hex');
      const p=publication([{typeId,body}],52000+size*10+i),admitted=await lab.publish(p);
      assert.equal(admitted.receipt.status,'0x1','legal body admission');
      assert.equal(ordinaryRecord(typeId,body),p.recordIds[0]);
      (size===1?short:maximum).push(p.recordIds[0]);
      report.fixtures.push({kind:size===1?'short-legal':'maximum-legal',recordId:p.recordIds[0],typeId,body,bodyBytes:(body.length-2)/2,receiptHash:admitted.receipt.transactionHash});
    }
    report.setupTransactionHashes=lab.transactions.map(t=>t.hash);
    const missing=Array.from({length:8},(_,i)=>keccak256(Buffer.from('unadmitted-record-'+i)));
    async function rawCall(to,iface,name,args,pin) {
      const params=[{to,data:iface.encodeFunctionData(name,args),gas:toBeHex(TX_GAS)},pin];
      const start=performance.now(),raw=await lab.rpc('eth_call',params),elapsedMs=performance.now()-start;
      const values=iface.decodeFunctionResult(name,raw);assert.equal(iface.encodeFunctionResult(name,values),raw);
      const estimate=await lab.rpc('eth_estimateGas',[params[0],pin]);
      return {method:'eth_call',params,raw,values:values.toArray(true),elapsedMs,estimateGas:BigInt(estimate).toString(),jsonResultBytes:Buffer.byteLength(JSON.stringify(raw)),jsonRpcBytes:Buffer.byteLength(JSON.stringify({jsonrpc:'2.0',id:1,result:raw}))};
    }
    const workloads={distinct:short,duplicate:Array(8).fill(short[0]),missing,maximum};
    for(const [kind,all] of Object.entries(workloads))for(const count of [1,2,4,8]) {
      free();const ids=all.slice(0,count),h=await lab.rpc('eth_getBlockByNumber',['latest',false]),pin={blockHash:h.hash,requireCanonical:true};
      const scalar=[];
      for(const id of ids)scalar.push(await rawCall(lab.core,lab.readIface,'getRecord',[id],pin));
      const rows=scalar.map((r,i)=>[ids[i],...r.values]);
      for(const row of rows) {
        if(kind==='missing')assert.deepEqual(row.slice(1),[toBeHex(0,32),'0x',0n]);
        else {assert.equal(ordinaryRecord(row[1],row[2]),row[0]);assert(row[3]>0n);}
      }
      const batch=await rawCall(lab.core,lab.readIface,'getRecordsCurrent',[ids],pin);
      assert.deepEqual(batch.values[1],rows);
      const basis=batch.values[0];assert.equal(basis[2],BigInt(h.number));
      const checked=await rawCall(lab.core,lab.readIface,'getRecordsChecked',[basis,ids],pin);assert.equal(batch.raw,checked.raw);
      const calls=ids.map(id=>lab.readIface.encodeFunctionData('getRecord',[id]));
      const external=await rawCall(multicall.address,multicall.iface,'aggregate',[lab.core,calls],pin);
      assert.deepEqual(external.values[0],scalar.map(r=>r.raw));
      const digest=keccak256(abi.encode([rowType],[rows])),mined=[];
      for(const mode of ['scalar','multicall','current']) {
        const args=mode==='multicall'?[multicall.address,lab.core,ids]:[lab.core,ids];
        const data=consumer.iface.encodeFunctionData(mode,args);
        const r=await lab.receipt(await lab.send(data,consumer.address),kind+'/'+count+'/'+mode+' consumer');assert.equal(r.status,'0x1');
        const at={blockHash:r.blockHash,requireCanonical:true};
        const observed=await rawCall(consumer.address,consumer.iface,mode,args,at);assert.equal(observed.values[0],digest);
        mined.push({mode,hash:r.transactionHash,gasUsed:BigInt(r.gasUsed).toString(),basisBlockHash:r.blockHash,observedDigest:observed.values[0]});
      }
      const sdk=[];
      for(const mode of ['scalar','checked']) {
        const reader=createFixtureReader({source:{identity:lab.expected.source,epoch:1,request:lab.rpc},context:{expected:lab.expected}});
        const phases=[];let scope;
        async function phase(name,action) {
          const before=scope?.stats()??{requests:0,bytes:0,cacheHits:0},start=performance.now();const result=await action();const after=scope.stats();
          phases.push({name,elapsedMs:performance.now()-start,requests:after.requests-before.requests,jsonResultBytes:after.bytes-before.bytes,cacheHits:after.cacheHits-before.cacheHits});return result;
        }
        try {
          await phase('qualification',async()=>{const r=await reader.open({blockTag:h.number});assert.equal(r.status,'READY',r.reason);scope=r.scope;return r.status;});
          const observed=await phase('data',async()=>{
            if(mode==='checked'){const r=await scope.getRecords(ids);assert.equal(r.status,'OK',r.reason);assert.deepEqual(r.records.map(x=>[x.recordId,x.typeSchemaId,x.canonicalBody,x.firstAdmitOrdinal]),rows);return r;}
            const results=await Promise.all(ids.map(id=>scope.call('getRecord',[id])));results.forEach((r,i)=>{assert.equal(r.status,'OK',r.reason);assert.deepEqual(r.values.toArray(true),rows[i].slice(1));});return results;
          });
          const sealed=await phase('seal',()=>scope.seal());assert.equal(sealed.status,'SEALED',sealed.reason);
          sdk.push({mode,logicalCalls:mode==='scalar'?count:1,phases,basis:scope.basis,observed,evidence:sealed.evidence,stats:scope.stats()});
        } finally {scope?.close();}
      }
      assert.equal((await lab.rpc('eth_getBlockByNumber',[h.number,false])).hash,h.hash);
      report.samples.push({kind,count,ids,basis,canonicalHeader:h,scalar,external,batch,checked,mined,sdk,digest});
      console.log(kind,count,'gas',mined.map(r=>r.mode+':'+r.gasUsed).join(' '),'RPC scalar/typed',count,1);
    }
    // Actual failed receipts are separate from successful consumer costs.
    for(const count of [0,9]) {
      const data=consumer.iface.encodeFunctionData('current',[lab.core,Array(count).fill(short[0])]);
      const receipt=await lab.receipt(await lab.send(data,consumer.address),'batch count '+count+' intended failure');assert.equal(receipt.status,'0x0');
      let refusal;
      try {await lab.rpc('eth_call',[{to:consumer.address,data,gas:toBeHex(TX_GAS)},{blockHash:receipt.blockHash,requireCanonical:true}]);assert.fail('count must refuse');}
      catch(error) {refusal={message:error.message,data:error.data};}
      const decoded=lab.readIface.parseError(refusal.data);assert.equal(decoded.name,'ErrRecordBatchSize');assert.equal(decoded.args[0],BigInt(count));
      report.failures.push({count,hash:receipt.transactionHash,gasUsed:BigInt(receipt.gasUsed).toString(),refusal});
    }
    for(const tx of lab.transactions) {
      tx.actualTransaction=await lab.rpc('eth_getTransactionByHash',[tx.hash]);
      assert.equal(tx.actualTransaction.input,tx.calldata);assert.equal(tx.actualTransaction.blockHash,tx.receipt.blockHash);
      assert.equal(tx.actualTransaction.hash,tx.hash);assert.equal(tx.actualTransaction.from.toLowerCase(),tx.from.toLowerCase());
      assert(BigInt(tx.actualTransaction.gas)<=TX_GAS);
    }
    return report;
  },{profile:'reads',watchdogMs:300000});
  assert(cleanup.stopped && cleanup.cacheRemoved,'owned finite node cleanup');
} finally {
  if(!cleanup||cleanup.stopped)rmSync(build,{recursive:true,force:true});
}
report.cleanup={...cleanup,buildRemoved:!existsSync(build)};
assert(report.cleanup.buildRemoved);
writeFileSync(output,JSON.stringify(plain(report),null,2)+'\n',{flag:'wx'});
console.log('Retained',output,'samples',report.samples.length,'transactions',report.transactions.length);
