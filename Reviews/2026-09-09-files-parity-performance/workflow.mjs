// Disposable raw Core lifecycle/resource evidence. NOT FilesRouter certification,
// portable author authentication, a Lens, a complete Files listing, or an SDK.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { keccak256 } from '../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { publication, groupLeaf, word, TX_GAS } from '../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { ordinaryRecord } from '../2026-09-05-c0-core/reference/state-reader.mjs';
import { readUpgradeState, verifyUpgradeState } from '../2026-09-08-upgradeable-foundation/reference/upgrade-reader.mjs';
import { encodeGroup, derive } from '../2026-09-05-mvp-build-start/type-inputs/encoder.mjs';

const cat = (...parts) => '0x'+parts.map(p=>p.replace(/^0x/,'')).join('');
const hash = s => keccak256(Buffer.from(s));
const tag = (domain,value) => keccak256(cat(hash('efs2/'+domain+'/1'),hash(value)));
const bytes = hex => (hex.length-2)/2;
const plain = value => JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='bigint'?String(v):v));
const recordId = leaf => ordinaryRecord(leaf.typeId,leaf.body);
const occurrence = (p,index) => cat(p.envelopeId,index.toString(16).padStart(4,'0'));
const string = value => cat(Buffer.byteLength(value).toString(16).padStart(4,'0'),Buffer.from(value).toString('hex'));
const A = word(0xffffffffffffn), B = word(0xbbbbbbbbbbbbbbbbn);
// Exact Files specification §3.1 and §4.1 domains, not a fixture namespace.
const CHARTER = tag('purpose','objects/publisher-charter/1');
const NAME = tag('purpose','files/name-slot/1');
const HEAD = tag('purpose','files/revision-head/1');
const HEAD_ROLE = tag('fieldrole','files/current-revision/1');
const bindingKey = (author,purpose,subject,role) => keccak256(cat(hash('efs2/binding/1'),author,keccak256(cat(hash('efs2/position/1'),purpose,subject,role))));
const retained = s => Object.fromEntries(['bootstrap','counts','records','types','envelopes','principals','admissions','batches','bindings','postings','occurrences'].map(k=>[k,Array.isArray(s[k])?s[k].map(x=>typeof x==='object'?{...x,pin:undefined}:x):s[k]]));
const phases = ['U1','U2'];
const semanticNames = ['directories','staged-create','created','staged-edit','edited','renamed','before-stale','after-stale','moved','name-retracted','tagged-a','tagged-both','untagged-a','retagged-a','scale-1','scale-2','scale-4','scale-8'];
const checkpointNames = ['types',...semanticNames.map(n=>'U1/'+n),'before-upgrade','after-upgrade',...semanticNames.map(n=>'U2/'+n),'terminal'];

export async function runFileLifecycle(lab) {
  const report = {
    evidenceKind:'RAW_CORE_LIFECYCLE_NOT_FILES_ROUTER',
    limitations:['Synthetic operator authorization is not portable author proof.','Generic structural admission is not Files profile/router validation or NOREPLACE authorization.','No contract Lens, complete Files listing, SDK/browser join or real-wallet journey.','Name tombstone retracts a claim; no Trash remove/restore support without a removal marker profile.','FrontierTagAssertion/1 and efs.fixture.tag-current/1 are disposable tag conventions, not adopted schema/purpose.'],
    operations:[],checkpoints:[],ids:{},resources:lab.resources,cleanup:lab.cleanup,
    workflowSourcePins:Object.fromEntries(['workflow.mjs','workflow.test.mjs','../2026-09-08-upgradeable-foundation/test/tag-current.test.mjs'].map(p=>[p,keccak256(readFileSync(new URL(p,import.meta.url)))])),
  };
  const types=Object.fromEntries(lab.inputs.candidates.groups.flatMap(g=>g.members.map(m=>[m.descriptor.name,m.temporaryTypeSchemaId])));
  const leaf=(name,body)=>({typeId:types[name],body});
  const object=(salt,meaning)=>leaf('ObjectGenesis/1',cat(A,hash('files lifecycle disposable salt/'+salt),meaning?cat('01',hash('efs2/files/meaning/'+meaning+'/1')):'00'));
  const set=(purpose,subject,role,target,prev)=>leaf('BindingSet/1',cat(purpose,subject,role,'01',target,'00',prev?cat('01',prev):'00'));
  const tombstone=(purpose,subject,role,prev)=>leaf('BindingTombstone/1',cat(purpose,subject,role,'01',prev));
  const entry=(parent,name,child)=>leaf('DirectoryEntry/1',cat(parent,string(name),child,'00'));
  const whiteout=(parent,name)=>leaf('DirectoryWhiteout/1',cat(parent,string(name)));
  let nonce=10000;
  const pub=(leaves,revisions=[],principal=A)=>publication(leaves,nonce++,{principal,revisions});
  const operation=(name,category,result,leafCount=0)=>{
    const op={name,category,gasUsed:String(BigInt(result.receipt.gasUsed)),calldataBytes:bytes(result.tx.data),calldataHash:keccak256(result.tx.data),transactionHash:result.tx.hash,receiptStatus:result.receipt.status,status:result.receipt.status==='0x1'?'SUCCESS':'REJECTED',leafCount};
    assert(BigInt(op.gasUsed)<=TX_GAS,'actual transaction gas bound');report.operations.push(op);return op;
  };
  // Include deployment/bootstrap transactions already performed by the one shared runner.
  for(const tx of lab.transactions) operation('setup/'+tx.label,'setup',{tx:{hash:tx.hash,data:tx.calldata},receipt:tx.receipt});
  async function commit(name,request,category='metadata') {
    const result=await lab.publish(request);const op=operation(name,category,result,request.leaves.length);
    assert.equal(result.receipt.status,'0x1',name+' failed at '+op.gasUsed+' gas (limit '+TX_GAS+'); do not split or loosen caps');
    return request;
  }
  async function checkpoint(name) {
    const state=await readUpgradeState(lab);
    assert.equal(state.outcome,'VERIFIED',name+': '+state.reason);
    // Schemas/group bytes remain in the raw terminal snapshot. Checkpoints carry
    // only decoded application admission evidence needed by the independent oracle.
    const entries=state.entries.filter(e=>e.typeId!==lab.inputs.meta).map(({occurrenceId,typeId,recordId,principal,fields})=>({occurrenceId,typeId,recordId,principal,fields}));
    report.checkpoints.push({name,outcome:state.outcome,basis:state.basis,revision:state.snapshot.execution.currentRevision,counts:state.counts,retainedDigest:keccak256(Buffer.from(JSON.stringify(retained(state.snapshot)))),entries:plain(entries),heads:plain(Object.fromEntries(state.fold.bindings)),histories:plain(Object.fromEntries(state.fold.histories))});
    return state;
  }
  const content=text=>{
    const data=cat(Buffer.from(text).toString('hex'));
    const tree=leaf('ChunkTree/1',cat('00001000','00000001',BigInt(bytes(data)).toString(16).padStart(16,'0'),keccak256(cat('00',data))));
    return {data,tree,id:recordId(tree)};
  };
  async function stage(name,c) {
    const result=await lab.stage(c.id,c.tree.body,c.data);operation(name,'content-staging',result);
    assert.equal(result.receipt.status,'0x1',name+' byte staging');
  }
  const revision=(file,c,parent)=>leaf('FileRevision/1',cat(file,c.id,string('text/plain'),'01',string('utf-8'),'00',parent?cat('0001',parent):'0000'));
  try {
    for(const [i,g] of lab.inputs.candidates.groups.entries()) await commit('setup/type-group-'+i,pub([groupLeaf(lab.inputs.meta,'0x'+g.groupHex)]),'setup');
    // Reuse the existing authored-current tag fixture verbatim in meaning/shape.
    const tagSchema={name:'FrontierTagAssertion/1',meaning:'Disposable authored-current tag fixture; not a public tag profile.',specDigest:null,qualifier:'00'.repeat(32),fields:[{name:'tagId',kind:'BYTES_FIXED',width:32},{name:'target',kind:'REF'}],roles:[{name:'target',fieldIdx:1,targetClass:5,expectedType:types['ObjectGenesis/1'].slice(2)}],indexes:[{kind:1,target:0},{kind:2,target:0}],constraints:[]};
    const raw=encodeGroup([tagSchema]),tagType=derive(raw).ids[0];
    await commit('setup/tag-type',pub([groupLeaf(lab.inputs.meta,cat(raw.toString('hex')))]),'setup');
    report.tagFixture={typeId:tagType,descriptor:tagSchema,groupHash:keccak256(raw)};
    await checkpoint('types');
    async function lifecycle(phase) {
      const cp=name=>checkpoint(phase+'/'+name);
      const write=(name,p)=>commit(phase+'/'+name,p);
      const root=object(phase+'/root','directory'),destination=object(phase+'/destination','directory'),file=object(phase+'/file','file');
      const ids={root:recordId(root),destination:recordId(destination),file:recordId(file)};report.ids[phase]=ids;
      await write('create-root-directory',pub([root,set(CHARTER,ids.root,word(1),ids.root)],[[1,0]]));
      await write('create-destination-directory',pub([destination,set(CHARTER,ids.destination,word(1),ids.destination)],[[1,0]]));
      await cp('directories');
      const c1=content(phase+' original file bytes\n'),c2=content(phase+' edited file bytes\n');
      ids.tree1=c1.id;ids.tree2=c2.id;
      await stage(phase+'/stage-create',c1);
      const staged=await cp('staged-create');assert(!staged.snapshot.records.some(r=>r.id===c1.id),'staging is not metadata admission');
      const rev1=revision(ids.file,c1),rev2=revision(ids.file,c2,recordId(rev1));ids.revision1=recordId(rev1);ids.revision2=recordId(rev2);
      const originalEntry=entry(ids.root,'note.txt',ids.file);ids.originalEntry=recordId(originalEntry);
      const created=await write('create-file-seven-leaf',pub([file,set(CHARTER,ids.file,word(1),ids.file),c1.tree,rev1,set(HEAD,ids.file,HEAD_ROLE,ids.revision1),originalEntry,set(NAME,ids.root,tag('fieldrole','note.txt'),ids.originalEntry)],[[1,0],[4,0],[6,0]]));
      await cp('created');
      await stage(phase+'/stage-edit',c2);const stagedEdit=await cp('staged-edit');assert(!stagedEdit.snapshot.records.some(r=>r.id===c2.id));
      await write('edit-file',pub([c2.tree,rev2,set(HEAD,ids.file,HEAD_ROLE,ids.revision2,occurrence(created,4))],[[2,1]]));
      const edited=await cp('edited');assert.equal(await lab.readBytes(c1.id,edited.basis),c1.data);assert.equal(await lab.readBytes(c2.id,edited.basis),c2.data);
      const renamedEntry=entry(ids.root,'field-notes.txt',ids.file),renameMask=whiteout(ids.root,'note.txt');ids.renamedEntry=recordId(renamedEntry);ids.renameWhiteout=recordId(renameMask);
      const renamed=await write('rename',pub([renamedEntry,set(NAME,ids.root,tag('fieldrole','field-notes.txt'),ids.renamedEntry),renameMask,set(NAME,ids.root,tag('fieldrole','note.txt'),ids.renameWhiteout,occurrence(created,6))],[[1,0],[3,1]]));
      await cp('renamed');
      const staleEntry=entry(ids.destination,'stale.txt',ids.file);
      // Destination is a fresh write earlier in the SAME atomic publication;
      // source CAS later fails. This is Core atomicity, not router NOREPLACE.
      const stale=pub([staleEntry,set(NAME,ids.destination,tag('fieldrole','stale.txt'),recordId(staleEntry)),renameMask,set(NAME,ids.root,tag('fieldrole','note.txt'),ids.renameWhiteout,occurrence(renamed,3))],[[1,0],[3,1]]);
      const before=await cp('before-stale');
      const k=bindingKey(A,NAME,ids.root,tag('fieldrole','note.txt'));
      const result=await lab.reject(await lab.prepare(stale),'ErrCasRevision',[k,1n,2n]);
      const op=operation(phase+'/stale-rename','rejected-write',result,4);
      const rejection=lab.transactions.at(-1).rejection;
      const trace=await lab.rpc('debug_traceTransaction',[result.tx.hash,{tracer:'callTracer',tracerConfig:{onlyTopCall:true}}]);
      assert.equal(trace.output,rejection.data,'mined exact CAS rejection matches preflight');
      op.rejection={name:rejection.name,args:rejection.args,preflight:rejection.data,mined:trace.output};
      const after=await cp('after-stale');assert.deepEqual(retained(after.snapshot),retained(before.snapshot),'rejected full inventory unchanged except observation pins');
      assert(!after.snapshot.records.some(r=>r.id===recordId(staleEntry)),'no partial destination Record');
      const movedEntry=entry(ids.destination,'field-notes.txt',ids.file),moveMask=whiteout(ids.root,'field-notes.txt');ids.movedEntry=recordId(movedEntry);ids.moveWhiteout=recordId(moveMask);
      await write('move',pub([movedEntry,set(NAME,ids.destination,tag('fieldrole','field-notes.txt'),ids.movedEntry),moveMask,set(NAME,ids.root,tag('fieldrole','field-notes.txt'),ids.moveWhiteout,occurrence(renamed,1))],[[1,0],[3,1]]));
      const moved=await cp('moved');
      ids.movedFile=moved.entries.find(e=>e.recordId===ids.movedEntry).fields[2];assert.equal(ids.file,ids.movedFile);
      await write('retract-name-claim',pub([tombstone(NAME,ids.root,tag('fieldrole','note.txt'),occurrence(renamed,3))],[[0,2]]));await cp('name-retracted');
      const tagId=hash('efs.fixture.tag/ocean'),tagPurpose=hash('efs.fixture.tag-current/1');
      const assertion={typeId:tagType,body:cat(tagId,ids.file)};ids.tagAssertion=recordId(assertion);
      const tagSet=prev=>set(tagPurpose,ids.file,tagId,ids.tagAssertion,prev);
      const taggedA=await write('tag-a',pub([assertion,tagSet()],[[1,0]],A));await cp('tagged-a');
      await write('tag-b',pub([assertion,tagSet()],[[1,0]],B));await cp('tagged-both');
      const untagged=await write('untag-a',pub([tombstone(tagPurpose,ids.file,tagId,occurrence(taggedA,1))],[[0,1]],A));await cp('untagged-a');
      await write('retag-a',pub([assertion,tagSet(occurrence(untagged,0))],[[1,2]],A));await cp('retagged-a');
      for(const n of [1,2,4,8]) {
        const objects=Array.from({length:n},(_,i)=>object(phase+'/scale/'+n+'/'+i));
        await write('scale-'+n,pub(objects));const scaled=await cp('scale-'+n);
        assert(objects.every(o=>scaled.entries.some(e=>e.recordId===recordId(o))),'all fresh scaling objects retained');
      }
      return [c1,c2];
    }
    const oldContent=await lifecycle('U1');
    const before=await checkpoint('before-upgrade');
    const upgrade=await lab.upgrade();operation('upgrade','setup',upgrade);assert.equal(upgrade.receipt.status,'0x1');
    const after=await checkpoint('after-upgrade');assert.deepEqual(retained(after.snapshot),retained(before.snapshot),'existing retained data and heads survive upgrade');
    for(const c of oldContent) assert.equal(await lab.readBytes(c.id,after.basis),c.data);
    await lifecycle('U2');
    const terminal=await checkpoint('terminal');
    for(const c of oldContent) assert.equal(await lab.readBytes(c.id,terminal.basis),c.data);
    // Reader-supplied counts measure serialized JSON result bytes, not wire bytes.
    const stats=terminal.snapshot.stats,history=terminal.snapshot.execution.collection;
    report.reads=stats&&history?{availability:'MEASURED',scope:'terminal full retained Core reconstruction plus execution history; JSON result bytes, not transport bytes',rpcCalls:Number(stats.work)+history.work,jsonResultBytes:stats.bytes+history.bytes,core:plain(stats),execution:history}:{availability:'UNAVAILABLE',reason:'reader supplied no complete counters'};
    report.ids.createdFile=report.ids.U1.file;report.ids.movedFile=report.ids.U1.movedFile;
    report.terminalSnapshot=terminal.snapshot;report.expected=lab.expected;
    report.complete=true;return plain(report);
  } catch(error) {
    error.evidence=plain(report);throw error;
  }
}

// Non-timing comparison deliberately excludes block hashes, fixture signatures,
// transaction hashes, source/runtime pins, RPC byte counts and receipt gas.
export function nonTimingOutcomes(report) {
  return {ids:report.ids,operations:report.operations.map(({name,category,status,leafCount,rejection})=>({name,category,status,leafCount,rejection})),checkpoints:report.checkpoints.map(({name,outcome,revision,counts,entries,heads,histories})=>({name,outcome,revision,counts,entries,heads,histories}))};
}

export function encodeReport(report) {
  assert(report?.complete,'complete lifecycle evidence required');
  assert.deepEqual(report.checkpoints.map(c=>c.name),checkpointNames,'all semantic checkpoints required');
  assert(report.checkpoints.every(c=>c.outcome==='VERIFIED'),'verified checkpoints required');
  assert(report.checkpoints.every(c=>Array.isArray(c.entries)&&c.heads&&c.histories&&c.basis?.hash),'checkpoint reconstruction evidence required');
  assert(report.resources?.sourcePins && Object.keys(report.resources.sourcePins).length>0 && report.resources.compilerInputHash && report.resources.inputPins?.candidateFile,'source/compiler/input pins required');
  assert(report.terminalSnapshot?.complete,'terminal retained evidence required');
  const verified=verifyUpgradeState(report.terminalSnapshot,report.expected);
  assert.equal(verified.outcome,'VERIFIED','terminal reconstruction: '+verified.reason);
  const required=['create-root-directory','create-destination-directory','stage-create','create-file-seven-leaf','stage-edit','edit-file','rename','stale-rename','move','retract-name-claim','tag-a','tag-b','untag-a','retag-a','scale-1','scale-2','scale-4','scale-8'];
  for(const phase of phases) for(const name of required) assert.equal(report.operations.filter(o=>o.name===phase+'/'+name).length,1,'required operation '+phase+'/'+name);
  for(const op of report.operations) {
    assert(/^\d+$/.test(op.gasUsed),'receipt gas required');assert(BigInt(op.gasUsed)>0n && BigInt(op.gasUsed)<=TX_GAS,'receipt gas bound');
    assert(Number.isSafeInteger(op.calldataBytes)&&op.calldataBytes>0,'calldata measurement required');
    assert(op.receiptStatus===(op.name.endsWith('/stale-rename')?'0x0':'0x1'),'expected mined status');
    if(op.name.endsWith('/stale-rename')) assert(op.rejection?.name==='ErrCasRevision'&&op.rejection.preflight===op.rejection.mined,'exact preflight and mined rejection required');
  }
  const encoded=JSON.stringify(report)+'\n';assert(Buffer.byteLength(encoded)<=2*1024*1024,'bounded evidence export');return encoded;
}

export function exportBaseline(report,env=process.env) {
  if(env.EFS_FILES_PERF_EVIDENCE!=='1') return false;
  writeFileSync(new URL('./baseline.json',import.meta.url),encodeReport(report));return true;
}
