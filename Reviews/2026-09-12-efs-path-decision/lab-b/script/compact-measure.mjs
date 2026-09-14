/** One bounded real-chain measurement pass. Gas rows are actual local receipts;
 * RPC/simulation costs remain a separate dimension. No storage traces. */
import assert from 'node:assert/strict';
import {connectFixture,economics} from './compact-browser.mjs';

export async function measure(env){
  const {ethers:e,manifest,rpc,wallets}=env,{sdk,run,authors}=await connectFixture(env,'measure');
  const checkpoints=[],reads=[],start=env.transactions.length;
  const basis=async()=>{const c=await sdk.pin();return[c.admission,c.generation,c.epoch,c.core];};
  const record=async(label,operation,args,who='alice')=>{
    const before=env.transactions.length,plan=await run(operation,args,who);
    assert.equal(env.transactions.length,before+1);env.transactions.at(-1).label=label;return plan;
  };
  const file=await record('named-create-41B','create',{name:'gas-note.txt',document:'x'.repeat(41),salt:e.id('measurement-primary')});
  await record('edit-41B','edit',{file:file.file,document:'y'.repeat(41)});
  await record('file-tag','addTag',{file:file.file,scope:'file',concept:e.id('efs')});
  await record('revision-tag','addTag',{file:file.file,scope:'revision',concept:e.id('approved')});
  const selected=await sdk.readFile({file:file.file,authors,concept:e.id('approved'),context:await sdk.pin()});
  await env.transact('application','adoptApprovedRevision',[file.file,selected.value.revision.recordId,0,await basis()],
    'application-read-approve-publish','alice');
  assert.equal((await env.call('application','adoptionCount'))[0],1n);
  const output=await sdk.readFile({file:file.file,authors:[env.contracts.application.address],context:await sdk.pin()});
  assert.equal(output.value.revision.parent,selected.value.revision.recordId);
  const outputPublication=(await env.call('ledger','admission',[output.value.selection.admission]))[2];
  assert.equal((await env.call('ledger','evidence',[outputPublication]))[1],1n,'native application evidence');
  const applicationEvidence={sourceSelection:selected.value.selection,reviewerAssertion:selected.value.revisionTag,
    outputSelection:output.value.selection,nativeProofKind:'PROOF_NATIVE',publication:outputPublication.toString()};
  await record('rename-fresh-name','rename',{file:file.file,fromName:'gas-note.txt',name:'renamed.txt'});
  await record('move-reused-name','move',{file:file.file,fromFolder:manifest.folder,toFolder:manifest.folders[1],fromName:'renamed.txt',name:'renamed.txt'});
  await record('remove-placement','remove',{file:file.file,folder:manifest.folders[1],name:'renamed.txt'});
  await record('restore-placement','restorePlacement',{file:file.file,folder:manifest.folders[1],name:'renamed.txt'});
  await record('restore-content','restoreContents',{file:file.file,record:file.newRevision});
  await record('remove-file-tag','removeTag',{file:file.file,scope:'file',concept:e.id('efs')});
  for(const bytes of [0,1024,4096,8160]){
    await record(`named-create-${bytes}B`,'create',{name:`size-${bytes}.txt`,salt:e.id(`size-${bytes}`),document:'x'.repeat(bytes)});
  }
  await assert.rejects(sdk.prepare({operation:'create',author:wallets.alice.address,name:'oversized.txt',salt:e.id('oversized'),document:'x'.repeat(8161)}),/BODY_LIMIT/);
  await env.deploy('paid','FilesPaidRead.sol','FilesPaidRead',[env.contracts.files.address]);
  for(const width of [1,8,32,64]){
    const lane=[...Array.from({length:width-1},(_,i)=>e.getAddress('0x'+e.id(`unbound-author-${i}`).slice(-40))),wallets.alice.address];
    await env.transact('paid','point',[file.file,lane,e.id('approved'),await basis()],`paid-file-point-authors-${width}`);
  }
  const churn=await record('churn/create','create',{name:'churn-0.txt',salt:e.id('churn'),document:'still one live file'});
  let name='churn-0.txt';
  const folderSnapshot=async(label,width=1)=>{
    const lane=[...Array.from({length:width-1},(_,i)=>e.getAddress('0x'+e.id(`unbound-author-${i}`).slice(-40))),wallets.alice.address];
    const before={...env.metrics},context=await sdk.pin();let result,pages=0;
    do{result=await sdk.listFolder({folder:manifest.folder,authors:lane,context,budget:32,continuation:result?.continuation});++pages;assert(pages<=16,'bounded listing did not terminate');}
    while(result.continuation);
    assert.equal(result.coverage,'COMPLETE');assert.equal(result.nameCoverage,'COMPLETE');
    assert.equal(result.value.filter(x=>x.file===churn.file).length,1,'one live churn file');
    const row={label,width,pages,live:result.value.length,rawCandidates:result.rawTotal,scanned:result.scanned,
      rpcCalls:env.metrics.calls-before.calls,requestBytes:env.metrics.requestBytes-before.requestBytes,responseBytes:env.metrics.responseBytes-before.responseBytes};
    reads.push(row);return row;
  };
  checkpoints.push(await folderSnapshot('before-churn'));
  for(let i=1;i<=128;i++){
    const next=`churn-${i}.txt`;await record(`churn/rename-${i}`,'rename',{file:churn.file,fromName:name,name:next});name=next;
    if(i===32||i===128)checkpoints.push(await folderSnapshot(`after-${i}-renames`));
  }
  for(const width of [8,32,64])await folderSnapshot('after-128-renames',width);
  const rows=env.transactions.slice(start).filter(t=>!t.label.startsWith('churn/')).map(t=>({label:t.label,gasUsed:t.gasUsed,
    calldataBytes:t.calldataBytes,transactionHash:t.transactionHash,status:t.status,
    executionOnlyUsd:Object.fromEntries(economics.networks.map(n=>[n.id,Number(t.gasUsed)*n.gasGwei*1e-9*economics.ethUsd]))}));
  const report={status:'PASS',listing:manifest.listing,profile:'compact B + retained ASCII Names + inline bytes; Cancun 30M block',rows,reads,checkpoints,applicationEvidence,
    economics,deployments:Object.fromEntries(Object.entries(env.contracts).map(([k,v])=>[k,{runtimeBytes:v.runtimeBytes,initcodeBytes:v.initcodeBytes}])),
    caveats:['USD columns are execution-only snapshot models, not total L2 transaction quotes.',
      'Point reads decode entire inline document; price is this fixture, not a universal minimum.',
      manifest.listing==='live-positive'?'Live-positive inventory retains masks/history separately; it is not globally sorted or a change feed.':'Audit-scope enumeration scans lifetime names.',
      '128 rename test is bounded engineering evidence, not worldwide scale.'],rpc:env.metrics};
  await env.writeReport('measurement',report);
  console.log(JSON.stringify({rows,checkpoints,reads}));return report;
}
