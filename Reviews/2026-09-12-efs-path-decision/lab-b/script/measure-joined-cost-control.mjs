/** Narrow real-receipt cost control. Old contracts use only their own artifact
 * ABIs and the explicit legacy SDK/environment branch; no new ABI is spliced in.
 * Final proxy Directory/Concept costs use INLINE revisions, a separate recipe.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createEnvironment,loadEthers} from './compact-environment.mjs';
import {createCompactSdk} from '../browser/compact-sdk.mjs';
import {createGuardedCompactSdk} from '../browser/compact-sdk-v2.mjs';
import {createFilesCompactSdk} from '../browser/compact-files-sdk.mjs';
const lab=fileURLToPath(new URL('../',import.meta.url)),prefix='Reviews/2026-09-12-efs-path-decision/lab-b/';
const baseline='67f92c5b000e63569eb0011a3688eb59ccb51893',oldOut=process.env.EFS_BASELINE_FOUNDRY_OUT;
assert(oldOut,'EFS_BASELINE_FOUNDRY_OUT must name the separately pinned legacy artifact directory');
const artifacts=[['Ledger.sol','Ledger'],['TypeRegistry.sol','TypeRegistry'],['FilesJoinedProfile.sol','FilesRootRule'],['FilesJoinedProfile.sol','FilesChildRule'],
  ['FilesNamesProfile.sol','FilesNameRule'],['FilesLiveIndex.sol','FilesLiveNamesIndex'],['FilesLiveIndex.sol','FilesLiveLens'],['FilesJoinedConsumer.sol','FilesJoinedConsumer'],
  ['FilesNamesProfile.sol','FilesNameReader'],['FilesApplication.sol','FilesApplication'],['FilesPaidRead.sol','FilesPaidRead']];
const e=await loadEthers(),pins={},runnerPins={};
for(const path of ['script/measure-joined-cost-control.mjs','script/compact-environment.mjs','browser/compact-sdk.mjs','browser/compact-sdk-v2.mjs','browser/compact-files-sdk.mjs'])runnerPins[path]=e.keccak256(await readFile(join(lab,path)));
for(const [file,name] of artifacts){
  const artifact=JSON.parse(await readFile(join(oldOut,file,name+'.json'),'utf8')),metadata=typeof artifact.metadata==='string'?JSON.parse(artifact.metadata):artifact.metadata;
  assert.equal(metadata.compiler.version,'0.8.30+commit.73712a01');assert.equal(metadata.settings.evmVersion,'cancun');assert.equal(metadata.settings.viaIR,true);assert.equal(metadata.settings.optimizer.runs,200);
  for(const [path,pin] of Object.entries(metadata.sources)){
    const source=execFileSync('git',['show',baseline+':'+prefix+path],{cwd:lab});assert.equal(e.keccak256(source),pin.keccak256);pins[path]=pin.keccak256;
  }
}
const reports=[];
for(const variant of ['legacy-baseline','guarded-inline-control','proxy-directory-concept-inline']){
  const old=variant==='legacy-baseline',features=variant==='proxy-directory-concept-inline';
  const env=await createEnvironment({artifactDirectory:old?oldOut:process.env.FOUNDRY_OUT,protocol:old?'compact-legacy-v1':'compact-guarded-v2',deployment:features?'proxy':'direct',evidenceMode:'append',
    ...(features?{filesProfile:'typed-directory-v1',contentProfile:'raw-sha256-aesgcm-v2'}:{})});
  try{
    const authors=Object.values(env.manifest.authors),factory=old?createCompactSdk:features?createFilesCompactSdk:createGuardedCompactSdk;
    const sdk=factory({ethers:e,manifest:env.manifest,rpc:env.rpc,journal:await env.createJournal('cost')});
    const observations=[];
    const run=async(label,operation,args)=>{
      const start=performance.now(),before={...env.metrics};
      const plan=await sdk.prepare({operation,authors,author:env.wallets.alice.address,...args});
      const signed=await sdk.authorize(plan,d=>env.wallets.alice.signingKey.sign(d).serialized);await sdk.submit(signed,tx=>env.send(label,tx,'alice'));
      assert.equal((await sdk.reconcile(plan.id)).status,'EFFECTS_VERIFIED');const receipt=env.transactions.at(-1);
      observations.push({label,operation,gasUsed:receipt.gasUsed,gasLimit:receipt.gasLimit,calldataBytes:receipt.calldataBytes,transactionHash:receipt.transactionHash,
        ms:performance.now()-start,rpcCalls:env.metrics.calls-before.calls,httpRequests:env.metrics.httpRequests-before.httpRequests,requestBytes:env.metrics.requestBytes-before.requestBytes,responseBytes:env.metrics.responseBytes-before.responseBytes,
        actions:plan.actions.map(a=>a.kind),bodyLengths:plan.bodies.map(b=>e.getBytes(b).length)});return plan;
    };
    const created=await run('named-create-41B','create',{name:'gas-note.txt',document:'x'.repeat(41),salt:e.id('measurement-primary')});
    await run('edit-41B','edit',{file:created.file,document:'y'.repeat(41)});
    await run('file-tag','addTag',{file:created.file,scope:'file',...(features?{conceptLabel:'efs'}:{concept:e.id('efs')})});
    const tagged=await run('revision-tag','addTag',{file:created.file,scope:'revision',...(features?{conceptLabel:'approved'}:{concept:e.id('approved')})});
    if(!features){
      const context=await sdk.pin(),point=await sdk.readFile({file:created.file,authors,concept:e.id('approved'),context});
      assert.equal(e.toUtf8String(point.value.revision.document),'y'.repeat(41));assert.equal(point.value.revisionTag.present,true);
      const start=env.transactions.length;
      await env.transact('application',old?'adoptApprovedRevision':'adoptApprovedRevisionGuarded',[created.file,point.value.revision.recordId,0,
        [context.admission,context.generation,context.epoch,old?context.core:context.executionSet]],'application-adoption-between-tags-and-rename','alice');
      assert.equal(env.transactions.length,start+1);assert.equal((await env.call('application','adoptionCount'))[0],1n);
    }else{
      const opened=await sdk.readContent({file:created.file,authors,context:await sdk.pin()});assert.equal(e.toUtf8String(opened.bytes),'y'.repeat(41));assert(tagged.concept);
    }
    await run('rename-fresh-name','rename',{file:created.file,fromName:'gas-note.txt',name:'renamed.txt'});
    const folder=await sdk.listFolder({authors,context:await sdk.pin(),budget:32});assert.equal(folder.value[0].name.value,'renamed.txt');
    const report={variant,matched:!features,baseline:old?baseline:undefined,baselineSourcePins:old?pins:undefined,runnerPins,
      sourceHead:execFileSync('git',['rev-parse','HEAD'],{cwd:lab,encoding:'utf8'}).trim(),
      sharedRunnerCompatibility:'Uses only ABI functions loaded from this variant artifacts and its explicit legacy or guarded SDK mode; every deployed runtime checked against artifact bytes with immutables patched.',
      recipe:features?'41-byte INLINE create/edit (73/105-byte revision bodies), retained Concept File/revision tags, rename; proxy typed Directory setup and carrier-capable profile, but NO Content descriptor or descriptor-backed upload. No old inline-only application adoption. NONMATCHED inline-only feature recipe.'
        :'Alice then Bob ordered Lens; gas-note.txt, salt measurement-primary,41 x bytes; edit41 y bytes; File tag id(efs), revision tag id(approved); application adoption; rename renamed.txt.',
      observations,transactions:env.transactions,metrics:env.metrics,manifest:env.manifest};
    reports.push({variant,path:await env.writeReport('joined-cost-control',report),observations});
  }finally{await env.close();}
}
const baselineRows=reports[0].observations,guardedRows=reports[1].observations;
for(let i=0;i<baselineRows.length;i++){assert.deepEqual(guardedRows[i].actions,baselineRows[i].actions);assert.deepEqual(guardedRows[i].bodyLengths,baselineRows[i].bodyLengths);}
console.log(JSON.stringify({status:'PASS',reports},null,2));
