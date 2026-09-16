import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironment} from '../script/compact-environment.mjs';
import {createFilesCompactSdk} from './compact-files-sdk.mjs';
const profile={protocol:'compact-guarded-v2',filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2'};
test('requested tag joins stay partial independently of either and none matches',{timeout:120000},async t=>{
  const env=await createEnvironment(profile);t.after(()=>env.close());
  const {ethers:e,manifest,rpc,wallets}=env,authors=Object.values(manifest.authors);
  const sdk=createFilesCompactSdk({ethers:e,manifest,rpc,journal:await env.createJournal('tag-assessment')});
  const run=async(operation,args)=>{
    const plan=await sdk.prepare({operation,author:wallets.alice.address,authors,...args});
    await sdk.submit(await sdk.authorize(plan,d=>wallets.alice.signingKey.sign(d).serialized),tx=>env.send(operation,tx,'alice'));return plan;
  };
  const file=await run('create',{name:'a.txt',salt:e.id('assessment-file'),document:'tagged'});
  const directory=await run('createDirectory',{name:'b-dir',salt:e.id('assessment-directory')});
  const tag=await run('addTag',{file:file.file,scope:'file',conceptLabel:'known'});
  await env.transact('ledger','unbind',[e.id('efs2/purpose/head/1'),file.file,e.ZeroHash,1],'missing-head','alice');
  const context=await sdk.pin();
  for(const tagScope of ['either','none']){
    const args={authors,context,concept:tag.concept,tagScope,budget:1};
    const page=await sdk.listFolderPage(args),row=page.pageRows[0];
    assert.equal(row.match,'MATCH');assert.equal(page.queryKnowledge,'PRESENT');
    assert.equal(page.tagCoverage,'PARTIAL','a known match does not establish every requested join');
    assert.equal(page.tagCoverageScope,'PAGE');
    assert.equal(row.point.value.fileTag.assessment,'PRESENT');assert.equal(row.point.value.fileTag.present,true);
    assert.equal(row.point.value.revisionTag.assessment,'UNKNOWN');assert.equal(row.point.value.revisionTag.present,null);
    const point=await sdk.readFile({file:file.file,authors,context,concept:tag.concept});
    for(const key of ['assessment','present','subject','concept'])assert.equal(row.point.value.revisionTag[key],point.value.revisionTag[key]);
    const suffix=await sdk.listFolderPage({...args,continuation:page.continuation});
    assert.equal(suffix.queryCoverage,'COMPLETE');assert.equal(suffix.tagCoverage,'COMPLETE');assert.equal(suffix.tagCoverageScope,'PAGE','suffix completeness covers only this page');
    if(tagScope==='none'){
      assert.equal(suffix.pageRows[0].file,directory.file);
      assert.equal(suffix.pageRows[0].point.value.revisionTag.assessment,'NOT_APPLICABLE');assert.equal(suffix.pageRows[0].point.value.revisionTag.present,null);
    }
  }
  const noJoins=await sdk.listFolderPage({authors,context,budget:1});
  assert.equal(noJoins.tagCoverage,'COMPLETE');assert.equal(noJoins.tagCoverageScope,'PAGE');
  assert.equal(noJoins.pageRows[0].point.value.fileTag.assessment,'UNKNOWN');assert.equal(noJoins.pageRows[0].point.value.fileTag.evaluated,false);
  const ledger=new e.Interface(manifest.contracts.ledger.abi);
  const broken=createFilesCompactSdk({ethers:e,manifest,rpc:(method,params)=>{
    if(method==='eth_call'&&params[0].to.toLowerCase()===manifest.contracts.ledger.address.toLowerCase()){
      const call=ledger.parseTransaction({data:params[0].data});
      if(call.name==='record'&&call.args[0]===tag.concept)throw Error('label-only RPC failure');
    }
    return rpc(method,params);
  }});
  const labelFailure=await broken.readTag({subject:file.file,target:file.file,concept:tag.concept,authors,context:await broken.pin()});
  assert.equal(labelFailure.value.assessment,'PRESENT');assert.equal(labelFailure.value.present,true);assert.equal(labelFailure.value.label.knowledge,'UNKNOWN');
  const missingLabel=e.id('legacy-key-with-no-Concept');
  await env.transact('ledger','bind',[e.id('efs2/purpose/tag/1'),file.file,missingLabel,file.file,0],'missing-label','alice');
  const missing=await sdk.readTag({subject:file.file,target:file.file,concept:missingLabel,authors,context:await sdk.pin()});
  assert.equal(missing.value.assessment,'PRESENT');assert.equal(missing.value.label.reason,'CONCEPT_MISSING');
});
test('joined pages qualify headers and own exact context Lens query continuations',{timeout:120000},async t=>{
  const env=await createEnvironment(profile);t.after(()=>env.close());
  const {ethers:e,manifest,rpc,wallets}=env,authors=Object.values(manifest.authors);
  const sdk=createFilesCompactSdk({ethers:e,manifest,rpc,journal:await env.createJournal('joined')});
  const run=async(operation,args)=>{
    const p=await sdk.prepare({operation,author:wallets.alice.address,authors,...args});
    const signed=await sdk.authorize(p,d=>wallets.alice.signingKey.sign(d).serialized);
    await sdk.submit(signed,tx=>env.send(operation,tx,'alice'));return p;
  };
  const file=await run('create',{name:'a.txt',salt:e.id('a'),document:'x'.repeat(41)});
  const directory=await run('createDirectory',{name:'b-dir',salt:e.id('b')});
  const concept=await run('addTag',{file:file.file,scope:'revision',conceptLabel:'approved'});
  await run('addTag',{file:directory.file,scope:'directory',concept:concept.concept});
  assert.equal(typeof sdk.listFolderPage,'function','bounded joined page API is present');
  const context=await sdk.pin(),args={context,authors,budget:1,concept:concept.concept,tagScope:'either'};
  const searched=await sdk.listFolderPage({...args,budget:16,search:'A.TXT'});
  assert.equal(searched.pageRows.length,1);assert.equal(searched.pageRows[0].name.value,'a.txt','SDK normalizes search, never changes the accepted lowercase Name grammar');
  const first=await sdk.listFolderPage(args);
  assert.equal(first.queryCoverage,'PARTIAL');assert.equal(first.scanned,'1');assert.equal(first.pageRows.length,1);
  assert.equal(first.pageRows[0].name.value,'a.txt');assert.equal(first.pageRows[0].point.value.revision.document,undefined);
  assert.equal(first.pageRows[0].point.value.revision.assurance,'HEADER_VERIFIED_BODY_NOT_FETCHED');
  assert.equal(first.pageRows[0].point.value.revisionTag.present,true);
  const warmStart=env.metrics.calls;await sdk.listFolderPage(args);
  assert(env.metrics.calls-warmStart<=2,'warm page does not reclassify every author or repeat joins');
  const point=await sdk.readFile({file:file.file,authors,context,concept:concept.concept});
  assert.equal(first.pageRows[0].point.value.revision.recordId,point.value.revision.recordId);
  const next=await sdk.listFolderPage({...args,continuation:first.continuation});
  assert.equal(next.segmentCompleteFromOrigin,false);assert.equal(next.completeFromOwnedOrigin,true);
  assert.equal(next.queryCoverage,'COMPLETE');assert.equal(next.pageRows.length,1,'only new rows, not accumulated old rows');
  assert.equal(next.pageRows[0].file,directory.file);assert.equal(next.pageRows[0].kind,'directory');
  assert.equal(next.pageRows[0].point.value.revision,null);assert.equal(next.pageRows[0].point.value.revisionTag.applicable,false);
  assert.equal(next.pageRows[0].point.value.selection,null,'Directory has no synthetic File HEAD');
  assert.equal(next.pageRows[0].point.value.fileTag.subject,directory.file);assert.equal(next.pageRows[0].point.value.fileTag.present,true);
  const onlyRevision=await sdk.listFolderPage({...args,tagScope:'revision'});
  const emptySuffix=await sdk.listFolderPage({...args,tagScope:'revision',continuation:onlyRevision.continuation});
  assert.equal(emptySuffix.pageRows.length,0);assert.equal(emptySuffix.queryCoverage,'COMPLETE');
  assert.equal(emptySuffix.queryKnowledge,'PRESENT','empty terminal segment must not erase earlier retained matches');
  assert.equal(emptySuffix.retainedSoFar,'1');assert.equal(emptySuffix.queryAbsent,false);
  assert.equal(emptySuffix.kind,'files-joined-page');
  for(const field of ['value','knowledge','coverage'])assert.equal(field in emptySuffix,false,'suffix cannot be a generic full result');
  const negative=await sdk.listFolderPage({...args,search:'no-match'});
  const negativeEnd=await sdk.listFolderPage({...args,search:'no-match',continuation:negative.continuation});
  assert.equal(negativeEnd.retainedSoFar,'0');assert.equal(negativeEnd.queryAbsent,true);assert.equal(negativeEnd.queryKnowledge,'ABSENT');
  const pageSelector=new e.Interface(manifest.contracts.joined.abi).getFunction('readPage').selector;
  let failPage=true;
  const unavailable=createFilesCompactSdk({ethers:e,manifest,rpc:(method,params)=>{if(failPage&&method==='eth_call'&&params[0].data.startsWith(pageSelector))throw Error('joined read unavailable');return rpc(method,params);}});
  const failureContext=await unavailable.pin(),unknown=await unavailable.listFolderPage({authors,context:failureContext});
  assert.equal(unknown.kind,'files-joined-page');assert.equal(unknown.queryCoverage,'UNKNOWN');assert.equal(unknown.queryAbsent,false);
  assert.equal(unknown.tagCoverage,'PARTIAL');assert.equal(unknown.tagCoverageScope,'PAGE');
  assert.equal(unknown.segmentStartsAtOrigin,true);assert.equal(unknown.segmentCompleteFromOrigin,false);
  assert.equal(unknown.scanned,null);assert.equal(unknown.hydrations,null);assert.equal(unknown.rawTotal,null);
  assert.equal(unknown.scannedSoFar,'0');assert.equal(unknown.selectedSoFar,'0');
  for(const field of ['value','knowledge','coverage'])assert.equal(field in unknown,false,'UNKNOWN cannot be a generic empty result');
  failPage=false;const prefix=await unavailable.listFolderPage({authors,context:failureContext,budget:1});failPage=true;
  const failedSuffix=await unavailable.listFolderPage({authors,context:failureContext,budget:1,continuation:prefix.continuation});
  assert.equal(failedSuffix.segmentStartsAtOrigin,false);assert.equal(failedSuffix.segmentCompleteFromOrigin,false);
  assert.equal(failedSuffix.scanned,null);assert.equal(failedSuffix.hydrations,null);
  for(const field of ['scannedSoFar','selectedSoFar','rawTotal','retainedSoFar'])assert.equal(failedSuffix[field],prefix[field],`preserve known ${field}`);
  assert.equal(failedSuffix.completeFromOwnedOrigin,false);assert.equal(failedSuffix.queryAbsent,false);
  assert.equal(failedSuffix.queryKnowledge,'PRESENT','known prefix match survives an unavailable suffix');
  for(const changes of [{authors:[...authors].reverse()},{tagScope:'revision'},{concept:e.id('other')},{search:'a'},{policy:'no-tiebreak'},{context:await sdk.pin()}])
    await assert.rejects(sdk.listFolderPage({...args,continuation:first.continuation,...changes}),/CONTINUATION/);
  const cold=createFilesCompactSdk({ethers:e,manifest,rpc});
  await assert.rejects(cold.listFolderPage({...args,context:await cold.pin(),continuation:first.continuation}),/CONTINUATION/);
  await assert.rejects(sdk.listFolderPage({...args,budget:0}),/BUDGET/);
  await run('edit',{file:file.file,document:'y'.repeat(41)});
  const pinned=await sdk.listFolderPage({...args,continuation:first.continuation});assert.equal(pinned.pageRows[0].file,directory.file);
  const changed=await sdk.listFolderPage({...args,budget:16,context:await sdk.pin(),tagScope:'revision'});
  assert.equal(changed.pageRows.length,0,'selected revision tag does not carry to new HEAD; directory branch is not applicable');
  const folderPurpose=e.id('efs2/purpose/folder/1');
  await env.transact('ledger','bind',[folderPurpose,manifest.folder,e.id('b-dir'),directory.file,0],'lower-directory','bob');
  await env.transact('ledger','unbind',[folderPurpose,manifest.folder,e.id('b-dir'),1],'mask-directory','alice');
  const maskedContext=await sdk.pin(),maskedFirst=await sdk.listFolderPage({authors,context:maskedContext,budget:1});
  const maskedSuffix=await sdk.listFolderPage({authors,context:maskedContext,budget:1,continuation:maskedFirst.continuation});
  assert.equal(maskedSuffix.pageRows.length,0);assert.equal(maskedSuffix.scannedSoFar,'2');assert.equal(maskedSuffix.retainedSoFar,'1');assert.equal(maskedSuffix.queryAbsent,false);
  await env.transact('ledger','bind',[folderPurpose,manifest.folder,e.id('a.txt'),file.file,0],'lower-file','bob');
  await env.transact('ledger','unbind',[folderPurpose,manifest.folder,e.id('a.txt'),1],'mask-file','alice');
  const allMaskedContext=await sdk.pin(),allMasked=await sdk.listFolderPage({authors,context:allMaskedContext,budget:1});
  assert.equal(allMasked.pageRows.length,0);assert.equal(allMasked.queryAbsent,false);
  const allMaskedEnd=await sdk.listFolderPage({authors,context:allMaskedContext,budget:1,continuation:allMasked.continuation});
  assert.equal(allMaskedEnd.retainedSoFar,'0');assert.equal(allMaskedEnd.scannedSoFar,'2');assert.equal(allMaskedEnd.queryAbsent,true);
});
test('failed Name-coordinate read preserves successful placement provenance',{timeout:120000},async t=>{
  const env=await createEnvironment(profile);t.after(()=>env.close());
  const {ethers:e,manifest,rpc,wallets}=env,authors=Object.values(manifest.authors);
  const sdk=createFilesCompactSdk({ethers:e,manifest,rpc,journal:await env.createJournal('partial')});
  const plan=await sdk.prepare({operation:'create',author:wallets.alice.address,authors,name:'known.txt',salt:e.id('known'),document:'known'});
  const signed=await sdk.authorize(plan,d=>wallets.alice.signingKey.sign(d).serialized);await sdk.submit(signed,tx=>env.send('create',tx,'alice'));
  const iface=new e.Interface(manifest.contracts.ledger.abi),selector=iface.getFunction('positionCell').selector;
  const broken=createFilesCompactSdk({ethers:e,manifest,rpc:(m,p)=>{if(m==='eth_call'&&p[0].data.startsWith(selector))throw Error('Name coordinate unavailable');return rpc(m,p);}});
  const partial=await broken.readPlacement({name:'known.txt',authors,context:await broken.pin()});
  assert.equal(partial.coverage,'PARTIAL');assert.equal(partial.knowledge,'UNKNOWN');
  assert.equal(partial.value.target,plan.file,'known selected target survives Name failure');
  assert.equal(partial.value.selection.status,1);assert.equal(partial.value.selection.author,e.zeroPadValue(wallets.alice.address,32));
  assert.equal(partial.value.kind,'file');assert.equal(partial.value.name.knowledge,'UNKNOWN');
});

test('joined rows match independent placement Name File and tag observations across pinned cases',{timeout:120000},async t=>{
  const env=await createEnvironment(profile);t.after(()=>env.close());
  const {ethers:e,manifest,rpc,wallets}=env,authors=[wallets.alice.address,wallets.bob.address];
  const sdk=createFilesCompactSdk({ethers:e,manifest,rpc,journal:await env.createJournal('parity')});
  const run=async(operation,args,who='alice')=>{
    const p=await sdk.prepare({operation,author:wallets[who].address,authors,...args});
    const signed=await sdk.authorize(p,d=>wallets[who].signingKey.sign(d).serialized);
    await sdk.submit(signed,tx=>env.send(operation,tx,who));return p;
  };
  const a=await run('create',{name:'a.txt',salt:e.id('parity-a'),document:'alpha'});
  const dir=await run('createDirectory',{name:'b-dir',salt:e.id('parity-dir')});
  const masked=await run('create',{name:'c.txt',salt:e.id('parity-mask'),document:'masked'});
  const tag=await run('addTag',{file:a.file,scope:'file',conceptLabel:'approved'});
  await run('addTag',{file:a.file,scope:'revision',concept:tag.concept});
  await run('addTag',{file:dir.file,scope:'directory',concept:tag.concept});
  const F=e.id('efs2/purpose/folder/1');
  await env.transact('ledger','bind',[F,manifest.folder,e.id('c.txt'),masked.file,0],'lower-placement','bob');
  await run('remove',{file:masked.file,name:'c.txt'});
  const compareTag=(joined,point)=>{
    for(const key of ['subject','concept','assessment','evaluated','present'])assert.equal(joined[key],point[key],key);
    if(point.selection)assert.deepEqual(joined.selection,point.selection);
  };
  const checkCase=async({label,expected,policy='ordered',tagScope='none',search='',reverse=false,knowledge='PRESENT'})=>t.test(label,async()=>{
    const context=await sdk.pin(),selectedAuthors=reverse?[...authors].reverse():authors;
    const args={authors:selectedAuthors,context,budget:1,concept:tag.concept,policy,tagScope,search};
    let page;const rows=[];
    do{page=await sdk.listFolderPage({...args,continuation:page?.continuation});rows.push(...page.pageRows);}while(page.continuation);
    assert.equal(page.queryCoverage,'COMPLETE');assert.equal(page.queryKnowledge,knowledge);
    assert.equal(page.queryAbsent,expected.length===0);
    assert.deepEqual(rows.map(r=>r.name.value).sort(),expected);
    const mask=await sdk.readPlacement({name:'c.txt',authors:selectedAuthors,context});
    assert.equal(mask.knowledge,reverse?'PRESENT':'MASKED');
    for(const row of rows){
      const placement=await sdk.readPlacement({name:row.name.value,authors:selectedAuthors,context});
      assert.equal(placement.value.target,row.target);assert.equal(placement.value.kind,row.kind);
      assert.equal(placement.value.position,row.position);assert.equal(placement.value.role,row.role);
      assert.deepEqual(placement.value.selection,row.selection);
      const name=await sdk.readName({position:row.position,folder:manifest.folder,role:row.role,context});
      for(const key of ['knowledge','coverage','value','recordId','firstAdmission'])assert.equal(row.name[key],name[key],`Name ${key}`);
      const stable=await sdk.readTag({subject:row.target,target:row.target,concept:tag.concept,authors:selectedAuthors,context});
      compareTag(row.point.value.fileTag,stable.value);
      if(row.kind==='directory'){
        const point=await sdk.readDirectory({directory:row.target,context});assert.equal(point.knowledge,row.point.knowledge);
        assert.equal(row.point.value.selection,null);assert.equal(row.point.value.revision,null);
        assert.equal(row.point.value.revisionTag.knowledge,'NOT_APPLICABLE');assert.equal(row.point.value.revisionTag.applicable,false);
      }else{
        const point=await sdk.readFile({file:row.target,authors:selectedAuthors,context,concept:tag.concept,policy});
        assert.equal(row.point.knowledge,point.knowledge);assert.equal(row.point.value.selection.status,point.value.selection.status);
        compareTag(row.point.value.fileTag,point.value.fileTag);
        if(point.value.revision){
          assert.deepEqual(row.point.value.selection,point.value.selection);
          for(const key of ['recordId','typeId','firstAdmission','parent','file'])assert.equal(row.point.value.revision[key],point.value.revision[key],`revision ${key}`);
          assert.equal(row.point.value.revision.bodyLength,e.getBytes(point.value.revision.document).length+(point.value.revision.parent===e.ZeroHash?32:64));
          assert.equal(row.point.value.revision.assurance,'HEADER_VERIFIED_BODY_NOT_FETCHED');
          compareTag(row.point.value.revisionTag,point.value.revisionTag);
        }else{
          assert.equal(row.point.value.revision,null);assert.equal(row.point.value.revisionTag.evaluated,false);
          assert.equal(row.point.value.revisionTag.knowledge,'UNKNOWN');
        }
      }
    }
  });
  for(const tagScope of ['none','file','revision','either'])await checkCase({label:`mixed masked/${tagScope}`,tagScope,expected:tagScope==='revision'?['a.txt']:['a.txt','b-dir']});
  await run('edit',{file:a.file,document:'alice next'});
  await checkCase({label:'new HEAD drops selected revision tag',tagScope:'revision',expected:[],knowledge:'ABSENT'});
  await checkCase({label:'new HEAD retains stable tag',tagScope:'file',expected:['a.txt','b-dir']});
  await run('edit',{file:a.file,document:'bob competing'},'bob');
  await checkCase({label:'ordered Alice then Bob',expected:['a.txt','b-dir']});
  await checkCase({label:'ordered Bob then Alice',reverse:true,expected:['a.txt','b-dir','c.txt']});
  await checkCase({label:'diagnostic conflict retains independent stable tag',policy:'no-tiebreak',tagScope:'revision',expected:['a.txt'],knowledge:'UNKNOWN'});
  await checkCase({label:'definite Directory match after an uncertain File',policy:'no-tiebreak',tagScope:'file',expected:['a.txt','b-dir']});
  await checkCase({label:'unknown-only predicate is not a known match',policy:'no-tiebreak',search:'no-match',expected:['a.txt'],knowledge:'UNKNOWN'});
});
