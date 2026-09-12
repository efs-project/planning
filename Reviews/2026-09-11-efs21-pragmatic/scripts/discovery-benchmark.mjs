import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {E,ROOT,artifact,withWorld} from './world.mjs';

const zero=[E.ZeroHash,0,0],abi=E.AbiCoder.defaultAbiCoder();
const body=v=>abi.encode(['uint256'],[v]);

export async function discoveryWorkload(w,policy) {
  const c=w.client,n=w.config.namespace,attached=policy==='required'||policy==='tolerated';
  const address=w.provenance.runtimes.DiscoveryIndex?.address,di=new E.Interface(artifact('DiscoveryIndex').abi);
  const reads=[],qualifiedActions=[];
  const point=(method,args,basis)=>c.call(method,args,basis,address,di);
  async function indexWrite(label,method,args,verify) {
    const action=await c.sendData(label,di.encodeFunctionData(method,args),address);
    const basis=await c.observe(); assert.equal(basis.blockHash,action.receipt.blockHash);
    const status=(await point('status',[n],basis)).value;
    verify(status);
    action.benchmarkCanonicalCheck={basis,status:[...status]}; qualifiedActions.push(action.hash);
    return status;
  }
  await c.write('ensureRoot',[],'root');
  const root=(await c.call('rootId',[n])).value;
  const files=[];
  async function create(name,value,label) {
    await c.write('createFile',[root,E.toUtf8Bytes(name),w.config.quoteType,body(value)],label);
    const id=(await c.call('lookup',[n,root,E.toUtf8Bytes(name)])).value; files.push(id); return id;
  }
  for(let i=0;i<4;i++) await create('old-'+i,i%2,'old create '+i);
  if(attached) await indexWrite('attach '+policy,'attach',[w.config.quoteType,policy==='required'],s=>{assert.equal(s.highWater,5n);assert.equal(s.health,1n);});
  await c.write('editFile',[files[0],1,w.config.quoteType,body(9)],'pre-backfill change bucket');
  await c.write('unlink',[files[1],1],'pre-backfill unlink');
  for(let i=0;i<32;i++) await create('new-'+i,i%4,'attached create '+i);
  if(attached) {
    for(const through of [0,2,4]) await indexWrite('backfill from '+through,'backfill',[n,1,through,2],s=>assert.equal(s.through,BigInt(Math.min(through+2,5))));
  }
  await c.write('editFile',[files[4],1,w.config.quoteType,body(0)],'same bucket same record edit');
  await c.write('editFile',[files[4],2,w.config.quoteType,body(7)],'change bucket fresh record edit');
  await c.write('editFile',[files[4],3,w.config.quoteType,body(2)],'change bucket deduplicated record edit');
  await c.write('moveFile',[files[4],4,root,E.toUtf8Bytes('renamed')],'move same membership');
  await c.write('editFile',[files[5],1,w.config.bytesType,c.body(E.toUtf8Bytes('different type'))],'cross Type removal');
  await c.write('unlink',[files[6],1],'post-backfill unlink');

  const basis=await c.observe(),scan=[];
  const ni=new E.Interface(artifact('NavigationIndex').abi),nav=w.provenance.runtimes.NavigationIndex.address;
  const before={...c.metrics};
  const inventory=await c.call('fileInventory',[n,zero,64],basis,nav,ni);
  assert.equal(inventory.value.complete,true,'source inventory page is incomplete; cannot label this a complete source scan');
  let scanCalls=1,scanBytes=inventory.returnBytes,scanEstimate=BigInt(await c.rpc('eth_estimateGas',[{from:n,to:nav,data:ni.encodeFunctionData('fileInventory',[n,zero,64])},basis.blockNumber]));
  for(const id of inventory.value.ids) {
    const file=await c.call('fileInfo',[id],basis); scanBytes+=file.returnBytes; ++scanCalls;
    scanEstimate+=BigInt(await c.rpc('eth_estimateGas',[{from:n,to:w.config.kernel,data:c.iface.encodeFunctionData('fileInfo',[id])},basis.blockNumber]));
    if(file.value.live&&!file.value.directory) {
      const record=await c.record(file.value.recordId,basis); scanBytes+=record.returnBytes; ++scanCalls;
      scanEstimate+=BigInt(await c.rpc('eth_estimateGas',[{from:n,to:w.config.kernel,data:c.iface.encodeFunctionData('readRecord',[file.value.recordId])},basis.blockNumber]));
      if(record.value.typeId===w.config.quoteType) scan.push({id,value:abi.decode(['uint256'],record.value.body)[0]});
    }
  }
  reads.push({label:'complete all-created source scan',basis,sourceCount:inventory.value.ids.length,members:scan.length,returnBytes:scanBytes,
    ethCalls:scanCalls,httpRequests:c.metrics.httpRequests-before.httpRequests,executionEstimateGas:scanEstimate.toString(),paidReadFee:false,
    estimateQualification:'Sum of independent eth_estimateGas calls, each with intrinsic gas and cold starts; NOT a single onchain scan transaction'});
  if(attached) for(const value of [0,1,2,9,999]) {
    const metrics={...c.metrics},args=[n,1,value,zero,64];
    const result=await point('page',args,basis);
    assert.equal(result.value.complete,true);
    assert.deepEqual([...result.value.ids].sort(),scan.filter(row=>row.value===BigInt(value)).map(row=>row.id).sort(),'independent source scan exact membership');
    const executionEstimateGas=BigInt(await c.rpc('eth_estimateGas',[{from:n,to:address,data:di.encodeFunctionData('page',args)},basis.blockNumber])).toString();
    reads.push({label:'UINT256_EQ '+value,basis,memberCount:result.value.ids.length,returnBytes:result.returnBytes,ethCalls:1,
      httpRequests:c.metrics.httpRequests-metrics.httpRequests,executionEstimateGas,paidReadFee:false,complete:true,ids:[...result.value.ids]});
  }
  // Preserve the exact existing contract-to-contract scalar example, with no profile for that producer.
  const pi=new E.Interface(artifact('QuoteProducer').abi),ci=new E.Interface(artifact('QuoteReader').abi);
  for(const [value,expected,label] of [[3000,0,'initial'],[3100,1,'update']]) {
    const a=await c.sendData('producer uint256 '+label,pi.encodeFunctionData('publish',[value,expected]),w.producer);
    const observed=await c.observe(),read=await c.call('read',[w.config.kernel,w.producer,w.config.quoteType],observed,w.consumer,ci);
    assert.equal(read.value[0],BigInt(value)); assert.equal(read.value[2],BigInt(expected+1)); assert.equal(observed.blockHash,a.receipt.blockHash);
    a.benchmarkCanonicalCheck={basis:observed,value,revision:expected+1};
  }
  for(const action of w.actions) assert(action.status==='COMMITTED'||action.benchmarkCanonicalCheck,'canonical effect check for every success');
  return {policy,createdAt:new Date().toISOString(),universe:'Current linked non-directory files of one exact Type in one native namespace; all-created ordinals used only as backfill source',
    setup:w.setup,actions:w.actions,reads,sourceOracle:{basis,scan},provenance:w.provenance,
    profile:attached?[...(await point('status',[n],basis)).value]:null};
}

export async function pairedDiscovery() {
  const arms={};
  arms.historyBaseline=await withWorld(w=>discoveryWorkload(w,'no-profile'),{kernelArtifact:'baseline-bf566dc'});
  for(const policy of ['no-profile','required','tolerated']) arms[policy]=await withWorld(w=>discoveryWorkload(w,policy));
  const comparison=arms.historyBaseline.actions.map(base=>{
    const gas={historyBaseline:base.gasUsed};
    for(const policy of ['no-profile','required','tolerated']) gas[policy]=arms[policy].actions.find(a=>a.label===base.label).gasUsed;
    return {label:base.label,gas,noProfilePremium:(BigInt(gas['no-profile'])-BigInt(base.gasUsed)).toString(),requiredPremium:(BigInt(gas.required)-BigInt(gas['no-profile'])).toString(),toleratedPremium:(BigInt(gas.tolerated)-BigInt(gas['no-profile'])).toString()};
  });
  for(const arm of Object.values(arms)) assert.equal(arm.cleanup.cacheRemoved,true);
  return {standing:'Disposable scalar discovery experiment; not C0 occurrence coverage or protocol adoption',arms,comparison};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  const result=await pairedDiscovery();
  writeFileSync(ROOT+'evidence/discovery-comparison.json',JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n');
  console.log(JSON.stringify({comparison:result.comparison,reads:result.arms.required.reads}));
}
