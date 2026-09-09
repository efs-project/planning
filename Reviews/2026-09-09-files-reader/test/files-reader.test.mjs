import test from 'node:test';
import assert from 'node:assert/strict';
import { compileUpgrade,withUpgrade,mountedFixture,A,B,C,role,key,hash,cat,option,string,planBody,purposeScope } from './fixture.mjs';
import { createFixtureReader } from '../reader-scope.mjs';
import { oracle,fromSnapshot,comparable } from './oracle.mjs';
import { word } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { readFileSync,writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lookupName,openDirectory } from '../files-reader.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const stringify=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v);
async function ready(lab,{request=lab.rpc,limits,blockTag='latest',signal,source}={}){const r=createFixtureReader({source:source??{identity:lab.expected.source,epoch:1,request},context:{expected:lab.expected,limits}});const o=await r.open({blockTag,signal});assert.equal(o.status,'READY',o.reason);return o.scope;}
async function complete(scope,mountId,pageSize=1){const stream=openDirectory(scope,{mountId,pageSize});let s;do{s=await stream.loadMore();assert.equal(s.qualification.status,'QUALIFIED',s.reason+': '+s.detail);}while(s.continuation);return s;}
function compareList(s,truth,mountId){const want=truth.inventory(mountId),all=[...s.rows,...s.unresolved,...s.masked,...s.absent];assert.equal(s.coverage,'COMPLETE');assert.deepEqual(all.map(comparable).sort((a,b)=>a.fieldRole.localeCompare(b.fieldRole)),want.results.map(comparable).sort((a,b)=>a.fieldRole.localeCompare(b.fieldRole)));assert.deepEqual(s.progress.map(p=>[p.principal,p.scanned]),want.sources.map(p=>[p.principal,BigInt(p.ordinals.length)]));}
test('actual mounted Files point and bounded stream select usable nodes',{timeout:300000},async()=>{
  compileUpgrade();await withUpgrade(async lab=>{
    const fixture=await mountedFixture(lab);
    const opened=await createFixtureReader({source:{identity:lab.expected.source,epoch:1,request:lab.rpc},context:{expected:lab.expected}}).open();assert.equal(opened.status,'READY',opened.reason);
    const {lookupName,openDirectory}=await import('../files-reader.mjs');
    const got=await lookupName(opened.scope,{mountId:fixture.mounts.aFirst,name:'note.txt'});assert.equal(got.outcome,'FOUND',got.reason+': '+got.detail);assert.equal(got.value.nodeId,fixture.fileA);
    const list=openDirectory(opened.scope,{mountId:fixture.mounts.aFirst,pageSize:1});const final=await list.loadMore();assert.equal(final.coverage,'COMPLETE');assert.equal(final.rows[0].value.nodeId,fixture.fileA);opened.scope.close();
  },{profile:'reads'});
});

// Breaks: lower-author fallback, false EXACT agreement, anchors as current values,
// false historical nonexistence, or reused/malformed root-scoped mount configs.
test('three real views, retained oracle, rename masks, charter history and U2',{timeout:300000},async()=>{
  await withUpgrade(async lab=>{
    const f=await mountedFixture(lab);let old;
    async function checkpoint(name,wants){const truth=await oracle(lab);for(const [v,want] of Object.entries(wants)){
      const s=await ready(lab),got=await lookupName(s,{mountId:f.mounts[v],name:'note.txt'});assert.equal(got.outcome,want,name+'/'+v+': '+got.detail);assert.deepEqual(comparable(got),comparable(truth.lookup(f.mounts[v],role('note.txt'),'note.txt')));compareList(await complete(s,f.mounts[v]),truth,f.mounts[v]);s.close();}return truth;}
    await checkpoint('only A',{aFirst:'FOUND',bFirst:'FOUND',exact:'ABSENT'});
    const entryB=await f.claim(B,'note.txt',f.fileB);await checkpoint('disagreement',{aFirst:'FOUND',bFirst:'FOUND',exact:'CONFLICT'});
    await f.claim(A,'field-notes.txt',f.fileA);await f.claim(A,'note.txt',f.fileA,{whiteout:true});await checkpoint('rename and mask',{aFirst:'MASKED',bFirst:'FOUND',exact:'CONFLICT'});
    await f.claim(A,'note.txt',null,{tombstone:true});await checkpoint('retract',{aFirst:'FOUND',bFirst:'FOUND',exact:'ABSENT'});
    await f.claim(A,'copy.txt',f.fileA);await f.claim(A,'note.txt',f.fileB,{target:entryB});await checkpoint('exact identical Entry',{aFirst:'FOUND',bFirst:'FOUND',exact:'FOUND'});
    await f.claim(A,'note.txt',f.fileA,{encodedName:'other.txt'});await checkpoint('malformed selected name',{aFirst:'UNKNOWN',bFirst:'FOUND',exact:'CONFLICT'});
    for(const [label,opts] of [['empty',{encodedName:''}],['slash',{encodedName:'a/b'}],['occurrence',{occurrence:true}],['bare node',{target:f.fileA}]]){
      await f.claim(A,'note.txt',f.fileA,opts);const s=await ready(lab),got=await lookupName(s,{mountId:f.mounts.aFirst,name:'note.txt'});assert.equal(got.outcome,'UNKNOWN',label);assert.equal(got.reason,'MALFORMED_SELECTED',label);assert.equal(got.value,undefined);s.close();}
    await f.claim(A,'note.txt',f.fileA);
    // Wrong-parent Entry is structurally admitted but not a valid selected slot.
    const otherRoot=await f.object('different-parent','directory'),wrong=f.leaf('DirectoryEntry/1',cat(otherRoot,string('note.txt'),f.fileA,'00'));await f.admit([wrong]);await f.claim(A,'note.txt',f.fileA,{target:f.id(wrong)});let wrongScope=await ready(lab);assert.equal((await lookupName(wrongScope,{mountId:f.mounts.aFirst,name:'note.txt'})).reason,'MALFORMED_SELECTED');wrongScope.close();await f.claim(A,'note.txt',f.fileA);
    // Admitted target has unsupported richer name under its actual exact role.
    await f.claim(A,'Trip',f.fileA);let truth=await oracle(lab),s=await ready(lab);compareList(await complete(s,f.mounts.aFirst),truth,f.mounts.aFirst);s.close();
    // Withdrawal of the charter source is a real kernel publication.
    const charterKey=key(A,C.charter,f.fileA,word(1)),prior=f.heads.get(charterKey);
    const withdrawal=await f.admit([f.leaf('Withdrawal/1',cat(prior.p.envelopeId,'0000'))]);f.heads.set(charterKey,{p:withdrawal,revision:prior.revision+1});
    await checkpoint('withdrawn charter',{aFirst:'FOUND'});s=await ready(lab);let got=await lookupName(s,{mountId:f.mounts.aFirst,name:'note.txt'});assert.equal(got.value.historicalCharter,'VALID');assert.equal(got.value.maintenance,'NOT_MAINTAINED');s.close();
    await f.mutate(A,C.charter,f.fileA,word(1),f.fileB);await checkpoint('rebound charter',{aFirst:'FOUND'});
    const unchartered=await f.object('first-tombstone','file',{charter:false,firstTombstone:true});await f.claim(A,'first.txt',unchartered);s=await ready(lab);got=await lookupName(s,{mountId:f.mounts.aFirst,name:'first.txt'});assert.equal(got.reason,'NO_HISTORICAL_CHARTER');s.close();
    await f.mutate(A,C.charter,unchartered,word(1),unchartered);s=await ready(lab);got=await lookupName(s,{mountId:f.mounts.aFirst,name:'first.txt'});assert.equal(got.outcome,'FOUND');s.close();
    const fileMount=await f.mount(f.fileB,'aFirst',{file:true});await f.claim(A,'foreign.txt',f.fileB,{override:fileMount.id});
    for(const [label,opts] of [['wrong root',{contentPurpose:purposeScope('content',f.root)}],['File namespace',{namespacePresent:true}],['unknown profile',{profile:hash('unsupported')}],['mismatched optional',{metadata:f.plans.aFirst}],['paired optional',{metadata:f.plans.aFirst,property:f.fileA}]]){
      const m=await f.mount(f.fileB,'aFirst',{file:true,...opts});await f.claim(A,'bad-mount.txt',f.fileB,{override:m.id});s=await ready(lab);got=await lookupName(s,{mountId:f.mounts.aFirst,name:'bad-mount.txt'});assert.equal(got.outcome,'UNKNOWN',label);assert.equal(got.value,undefined);s.close();}
    await f.claim(A,'bad-root.txt',f.fileA,{override:fileMount.id});s=await ready(lab);got=await lookupName(s,{mountId:f.mounts.aFirst,name:'bad-root.txt'});assert.equal(got.reason,'MALFORMED_SELECTED');s.close();
    const missingNamespace=await f.mount(f.root,'aFirst',{namespacePresent:false});s=await ready(lab);got=await lookupName(s,{mountId:missingNamespace.id,name:'note.txt'});assert.equal(got.reason,'MALFORMED_SELECTED');s.close();
    s=await ready(lab);got=await lookupName(s,{mountId:fileMount.id,name:'note.txt'});assert.equal(got.reason,'NOT_A_DIRECTORY');s.close();
    // Noncanonical B0 Plan bytes are structurally admissible BYTES, not usable Plans.
    for(const [body,code] of [[planBody([{principal:A},{principal:A,tier:1}]),9],[planBody([{principal:A},{principal:B,tier:1}],{combiner:0}),11]]){const p=f.leaf('ResolutionPlan/1',body);await f.admit([p]);s=await ready(lab);const result=await s.call('validatePlan',[f.id(p)]);assert.deepEqual([...result.values],[false,BigInt(code)]);s.close();}
    // All supported published fixture bodies compare to independent descriptor slices.
    const {assessRecord,TYPES,parsePlan}=await import('../files-profile.mjs');truth=await oracle(lab);
    for(const e of truth.verified.entries)if(Object.values(TYPES).includes(e.typeId)){const row=truth.snapshot.records.find(r=>r.id===e.recordId);assert.deepEqual(assessRecord(e.recordId,e.typeId,row.row[1]).raw.fields,e.fields);if(e.typeId===TYPES['ResolutionPlan/1']){const sc=await ready(lab),v=await sc.call('validatePlan',[e.recordId]);assert.equal(Number(v.values[1]),parsePlan(e.typeId,row.row[1]).code);sc.close();}}
    old=await ready(lab);const pinned=old.basis;truth=await oracle(lab);await lab.upgrade();compareList(await complete(old,f.mounts.aFirst,8),truth,f.mounts.aFirst);old.close();
    s=await ready(lab);assert.equal(s.basis.revision,2n);assert.notEqual(s.basis.executionSetId,pinned.executionSetId);compareList(await complete(s,f.mounts.aFirst,8),await oracle(lab),f.mounts.aFirst);s.close();
    const badSnapshot=structuredClone(truth.snapshot);badSnapshot.records[0].row[1]='0x';assert.throws(()=>fromSnapshot(badSnapshot,lab.expected));
  },{profile:'reads'});
});

test('stream prefixes, single flight, unavailable out-of-order sibling, corruption and latest failure snapshot',{timeout:300000},async()=>{
  await withUpgrade(async lab=>{
    const f=await mountedFixture(lab);await f.claim(A,'z-last.txt',f.fileB);await f.claim(B,'note.txt',f.fileB);await f.claim(B,'z-last.txt',f.fileA);
    const truth=await oracle(lab);let s=await ready(lab),stream=openDirectory(s,{mountId:f.mounts.aFirst,pageSize:1});assert.equal(stream.snapshot(),null);const one=stream.loadMore(),two=stream.loadMore();assert.equal(one,two);let first=await one;assert.equal(first.coverage,'PARTIAL');assert.equal(first.rows.length,1);compareList(await stream.loadMore(),truth,f.mounts.aFirst);s.close();
    let fail=false;
    const request=async(m,p,o)=>{
      if(m==='eth_call'){const q=lab.readIface.parseTransaction({data:p[0].data});if(q?.name==='getRecord'&&q.args[0]===f.fileB){await pause(2);if(fail)throw Error('test selected node bytes unavailable');}else await pause(8);}
      return lab.rpc(m,p,o);
    };
    s=await ready(lab,{request});fail=true;stream=openDirectory(s,{mountId:f.mounts.aFirst,pageSize:8});const partial=await stream.loadMore();assert.equal(partial.coverage,'COMPLETE');assert.equal(partial.rows.length,1);assert.equal(partial.unresolved.length,1);assert.equal(partial.unresolved[0].value,undefined);assert.equal(partial.unresolved[0].reason,'EVIDENCE_UNAVAILABLE');assert.equal(partial.qualification.availability,'PARTIAL');assert.equal(partial.unresolved[0].qualification.availability,'UNAVAILABLE');assert.equal(partial.unresolved[0].qualification.coverage,'UNKNOWN');fail=false;compareList(await stream.loadMore(),truth,f.mounts.aFirst);s.close();
    // A later acquisition failure exposes the old prefix as prior, never COMPLETE.
    s=await ready(lab);stream=openDirectory(s,{mountId:f.mounts.aFirst,pageSize:1});first=await stream.loadMore();s.close();const failed=await stream.loadMore();assert.notEqual(failed.coverage,'COMPLETE');assert.equal(failed.qualification.status,'UNAVAILABLE');assert.deepEqual(failed.rows,first.rows);assert.equal(stream.snapshot(),failed);assert.equal(failed.rowsEvidence,'PRIOR_SEALED');
    // Corruption here is transport injection, not admitted Files evidence.
    for(const mutate of [v=>{v[0][1]++;},v=>{v[0][4]++;},v=>{v[1][0][0]++;},v=>{v[0][2]=(1n<<256n)-1n;},v=>{v[0][2]++;},v=>{v[1][0][4]=B;},v=>{v[1][0][1]=hash('substituted-envelope');},v=>{v[1][0][3]=f.entryA;}]){
      const corrupt=async(m,p,o)=>{const raw=await lab.rpc(m,p,o);if(m==='eth_call'){const q=lab.readIface.parseTransaction({data:p[0].data});if(q?.name==='pagePostingsHydrated'){const v=lab.readIface.decodeFunctionResult(q.name,raw).toArray(true);if(v[1].length){mutate(v);return lab.readIface.encodeFunctionResult(q.name,v);}}}return raw;};
      s=await ready(lab,{request:corrupt});const bad=await openDirectory(s,{mountId:f.mounts.aFirst,pageSize:1}).loadMore();assert.notEqual(bad.coverage,'COMPLETE');assert.equal(bad.rows.length,0);assert.equal(bad.qualification.status,'UNAVAILABLE');s.close();
    }
    // Transport missing continuation can recover from the same sealed prefix.
    let miss=true;const intermittent=async(m,p,o)=>{if(m==='eth_call'){const q=lab.readIface.parseTransaction({data:p[0].data});if(miss&&q?.name==='pagePostingsHydrated'&&q.args[4][0]!==0n)throw Error('missing continuation');}return lab.rpc(m,p,o);};
    s=await ready(lab,{request:intermittent});stream=openDirectory(s,{mountId:f.mounts.aFirst,pageSize:1});first=await stream.loadMore();const gap=await stream.loadMore();assert.equal(gap.qualification.status,'UNAVAILABLE');assert.deepEqual(gap.progress,first.progress);miss=false;compareList(await stream.loadMore(),truth,f.mounts.aFirst);s.close();
    // A terminal suffix cannot stand in for the omitted last anchor.
    const suffix=async(m,p,o)=>{const raw=await lab.rpc(m,p,o);if(m==='eth_call'){const q=lab.readIface.parseTransaction({data:p[0].data});if(q?.name==='pagePostingsHydrated'&&q.args[4][0]!==0n){const v=lab.readIface.decodeFunctionResult(q.name,raw).toArray(true);v[0][3]=[];v[0][4]=0n;v[1]=[];return lab.readIface.encodeFunctionResult(q.name,v);}}return raw;};
    s=await ready(lab,{request:suffix});stream=openDirectory(s,{mountId:f.mounts.aFirst,pageSize:1});await stream.loadMore();const omitted=await stream.loadMore();assert.equal(omitted.reason,'PAGE_PREFIX_GAP');assert.equal(omitted.rows.length,1);s.close();
    // Record-ID substitution retains structurally plausible bytes but is rejected.
    const substitute=async(m,p,o)=>{if(m==='eth_call'){const q=lab.readIface.parseTransaction({data:p[0].data});if(q?.name==='getRecord'&&q.args[0]===f.fileA)return lab.rpc(m,[{...p[0],data:lab.readIface.encodeFunctionData('getRecord',[f.fileB])},p[1]],o);}return lab.rpc(m,p,o);};
    s=await ready(lab,{request:substitute});const replaced=await lookupName(s,{mountId:f.mounts.aFirst,name:'note.txt'});assert.equal(replaced.reason,'MALFORMED_SELECTED');assert.equal(replaced.value,undefined);s.close();
    // Reorg control changes only the final canonical header observation.
    let reorg=false;const canonical=async(m,p,o)=>{const raw=await lab.rpc(m,p,o);return reorg&&m==='eth_getBlockByNumber'?{...raw,hash:hash('noncanonical')}:raw;};
    s=await ready(lab,{request:canonical});reorg=true;const unsealed=await lookupName(s,{mountId:f.mounts.aFirst,name:'note.txt'});assert.equal(unsealed.reason,'SEAL_FAILED');assert.equal(unsealed.value,undefined);
    const source={identity:lab.expected.source,epoch:1,request:lab.rpc};s=await ready(lab,{source});source.epoch++;assert.equal((await lookupName(s,{mountId:f.mounts.aFirst,name:'note.txt'})).qualification.status,'UNAVAILABLE');
    const controller=new AbortController();s=await ready(lab,{signal:controller.signal});controller.abort();assert.equal((await openDirectory(s,{mountId:f.mounts.aFirst}).loadMore()).qualification.status,'UNAVAILABLE');
    s=await ready(lab);stream=openDirectory(s,{mountId:f.mounts.aFirst});stream.close();assert.equal((await stream.loadMore()).reason,'STREAM_CLOSED');assert.equal((await s.call('getRecord',[f.fileA])).status,'OK','stream.close must not close caller scope');s.close();
    for(const n of [0,9,1.5,NaN])assert.throws(()=>openDirectory(s,{mountId:f.mounts.aFirst,pageSize:n}));
  },{profile:'reads'});
});

test('failed mount dependency drains internal sibling work before seal',{timeout:300000},async()=>{
  await withUpgrade(async lab=>{
    const f=await mountedFixture(lab);let denied=0;
    const request=async(m,p,o)=>{if(m==='eth_call'){const q=lab.readIface.parseTransaction({data:p[0].data});if(q?.name==='getRecord'&&q.args[0]===f.root)await pause(10);if(q?.name==='getRecord'&&q.args[0]!==f.root){const raw=await lab.rpc(m,p,o),v=lab.readIface.decodeFunctionResult(q.name,raw);if(v[0]===f.types['PublicFilesMountConfig/1'])throw Error('config unavailable');return raw;}}return lab.rpc(m,p,o);};
    const s=await ready(lab,{request}),wrapped={...s,call:async(...args)=>{const r=await s.call(...args);if(r.reason==='scope sealing')denied++;return r;}};
    const result=await lookupName(wrapped,{mountId:f.mounts.aFirst,name:'note.txt'});assert.equal(result.outcome,'UNKNOWN');assert.equal(result.reason,'EVIDENCE_UNAVAILABLE');assert.equal(denied,0,'internal sibling chains must settle before aggregate seal');s.close();
  },{profile:'reads'});
});

test('empty scopes, empty partial churn windows and bounded historical exhaustion',{timeout:300000},async()=>{
  await withUpgrade(async lab=>{
    const f=await mountedFixture(lab),root=await f.object('empty','directory'),m=await f.mount(root);
    let s=await ready(lab);const empty=await complete(s,m.id);assert.equal(empty.rows.length,0);assert.equal(empty.coverage,'COMPLETE');s.close();
    // FIRST_TOMBSTONE is a discovery anchor without any prior name preimage.
    await f.claim(A,'initial.txt',null,{tombstone:true});s=await ready(lab);let anchored=await complete(s,f.mounts.aFirst);assert(anchored.absent.some(r=>r.fieldRole===role('initial.txt')));assert(!anchored.rows.some(r=>r.value.name==='initial.txt'));s.close();
    await f.claim(A,'initial.txt',f.fileB);s=await ready(lab);anchored=await complete(s,f.mounts.aFirst);assert.equal(anchored.rows.find(r=>r.fieldRole===role('initial.txt')).value.nodeId,f.fileB);compareList(anchored,await oracle(lab),f.mounts.aFirst);s.close();
    for(let i=0;i<4;i++){await f.claim(A,'dead-'+i,f.fileA,{parent:root});await f.claim(A,'dead-'+i,null,{parent:root,tombstone:true});}
    for(let i=0;i<4;i++)await f.claim(A,'live',i%2?f.fileA:f.fileB,{parent:root});
    const truth=await oracle(lab);assert.equal(truth.inventory(m.id).roles.length,5);s=await ready(lab);const stream=openDirectory(s,{mountId:m.id,pageSize:1});for(let i=0;i<4;i++){const p=await stream.loadMore();assert.equal(p.coverage,'PARTIAL');assert.equal(p.rows.length,0);assert.equal(p.continuation,true);}compareList(await stream.loadMore(),truth,m.id);s.close();
    const node=await f.object('charter-limit','file',{charter:false,firstTombstone:true});
    for(let i=0;i<64;i++)await f.mutate(A,C.charter,node,word(1),i%2?f.fileA:f.fileB);
    await f.claim(A,'capped.txt',node);s=await ready(lab);const got=await lookupName(s,{mountId:f.mounts.aFirst,name:'capped.txt'});assert.equal(got.reason,'CHARTER_HISTORY_LIMIT',got.detail);assert.equal(got.value,undefined);const history=s.evidence().filter(e=>e.purpose==='data'&&e.method==='eth_call'&&e.params[0].data.startsWith(lab.readIface.getFunction('readHistory').selector));assert.equal(history.length,1);assert(s.stats().requests<512);s.close();
  },{profile:'reads'});
});

test('actual executable export and strict TypeScript result narrowing',async()=>{
  const api=await import('../index.mjs');assert.deepEqual(Object.keys(api).sort(),['DEFAULT_LIMITS','FIXTURE','TYPES','assessRecord','bindingKey','bindingScopeKey','createFixtureReader','lookupName','nameAssessment','nameRole','openDirectory','ordinaryRecord','parsePlan','positionKey','purposeAndScope'].sort());
  assert.equal(api.lookupName,lookupName);assert.equal(api.openDirectory,openDirectory);assert.equal(api.createFixtureReader,createFixtureReader);
  const check=spawnSync(process.execPath,[fileURLToPath(new URL('../../2026-09-04-mvp-rehearsal/node_modules/typescript/bin/tsc',import.meta.url)),'--strict','--noEmit','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022',fileURLToPath(new URL('./sample.ts',import.meta.url))],{encoding:'utf8'});assert.equal(check.status,0,String(check.stdout)+String(check.stderr));
});

test('complete Files entrypoint loads without Node APIs in a browser-like realm',()=>{
  const script=`import {readFileSync} from 'node:fs';import vm from 'node:vm';
    const context=vm.createContext({TextEncoder,TextDecoder,AbortController,setTimeout,clearTimeout,performance,structuredClone});context.self=context;
    const modules=new Map();const load=url=>{if(!modules.has(url))modules.set(url,new vm.SourceTextModule(readFileSync(new URL(url),'utf8'),{context,identifier:url}));return modules.get(url);};
    const runtime=load(${JSON.stringify(new URL('../index.mjs',import.meta.url).href)});await runtime.link((specifier,from)=>{if(!specifier.startsWith('.'))throw Error('non-browser import '+specifier);return load(new URL(specifier,from.identifier).href);});await runtime.evaluate();
    if(runtime.namespace.nameAssessment('note.txt').status!=='ACCEPTED')throw Error('ASCII profile unavailable');
    if(runtime.namespace.assessRecord('bad','bad','bad').status!=='MALFORMED')throw Error('decoder unavailable');`;
  const r=spawnSync(process.execPath,['--experimental-vm-modules','--disable-warning=ExperimentalWarning','--input-type=module','-e',script],{encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);
});

test('eight-name two-node live read phases at identical 0 and 50 ms delays',{timeout:300000},async t=>{
  await withUpgrade(async lab=>{
    const f=await mountedFixture(lab),names=['note.txt',...Array.from({length:7},(_,i)=>'n'+i+'.txt')];
    for(const [i,n] of names.entries()){const e=i===0?f.entryA:await f.claim(A,n,i%2?f.fileB:f.fileA);await f.claim(B,n,f.fileA,{target:e});}
    // Setup and complete retained-state acquisition are never inside phase timers.
    const truth=await oracle(lab),inventory=truth.inventory(f.mounts.aFirst);assert.equal(inventory.roles.length,8);
    const {keccak256}=await import('../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js');
    const report={kind:'FIXTURE_ROOT_FILES_READER_NOT_PUBLIC_C0',source:lab.resources,readerSourcePins:Object.fromEntries(['reader-scope.mjs','files-profile.mjs','files-reader.mjs','index.mjs','index.d.mts','test/fixture.mjs','test/oracle.mjs','test/files-profile.test.mjs','test/files-reader.test.mjs','test/sample.ts'].map(p=>[p,keccak256(readFileSync(new URL('../'+p,import.meta.url)))])),expected:lab.expected,workload:{source:lab.expected.source,names,authors:[A,B],childNodes:[f.fileA,f.fileB],charters:'two distinct File nodes, both currently MAINTAINED; shared across eight placements',root:f.root,mountId:f.mounts.aFirst,planId:f.plans.aFirst,pageSize:4,requestedBlock:'latest',excluded:'deployment/publications, independent oracle collection, UI, FileRevision and byte retrieval'},oracle:{snapshot:truth.snapshot,inventory},samples:[]};
    for(const delay of [0,50])for(let sample=0;sample<3;sample++){
      let active=0,peak=0;const attempts=[];
      const request=async(method,params,options)=>{assert(['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_getStorageAt','eth_call'].includes(method),'no wallet/write RPC');active++;peak=Math.max(peak,active);try{if(delay)await pause(delay);const raw=await lab.rpc(method,params,options);attempts.push({method,bytes:Buffer.byteLength(JSON.stringify(raw))});return raw;}finally{active--;}};
      const phases=[];let scope;
      async function phase(name,action){const before=scope?.stats()??{requests:0,bytes:0,cacheHits:0},n=attempts.length;peak=0;const started=performance.now();const result=await action();const elapsedMs=performance.now()-started,after=scope.stats(),delta=attempts.slice(n);phases.push({name,elapsedMs,requests:after.requests-before.requests,jsonResultBytes:after.bytes-before.bytes,cacheHits:after.cacheHits-before.cacheHits,maxInFlight:peak,methods:Object.fromEntries([...new Set(delta.map(r=>r.method))].map(m=>[m,delta.filter(r=>r.method===m).length]))});assert.equal(phases.at(-1).requests,delta.length);assert.equal(phases.at(-1).jsonResultBytes,delta.reduce((n,r)=>n+r.bytes,0));return result;}
      await phase('cold-open',async()=>{scope=await ready(lab,{request});});
      const stream=openDirectory(scope,{mountId:f.mounts.aFirst,pageSize:4});const first=await phase('first-sealed-page',()=>stream.loadMore());assert.equal(first.rows.length,4);assert.equal(first.coverage,'PARTIAL');
      const final=await phase('continuation',()=>stream.loadMore());compareList(final,truth,f.mounts.aFirst);
      const reuse=await phase('same-scope-point-reuse',()=>lookupName(scope,{mountId:f.mounts.aFirst,name:'note.txt'}));assert.equal(reuse.outcome,'FOUND');assert.equal(phases.at(-1).requests,4,'reuse still pays the complete seal');
      assert(scope.stats().maxInFlight<=4);report.samples.push({delayMs:delay,sample,basis:scope.basis,phases,evidence:scope.evidence(),stats:scope.stats()});scope.close();
    }
    t.diagnostic(stringify({workload:report.workload,samples:report.samples.map(({delayMs,sample,basis,phases})=>({delayMs,sample,basis,phases}))}));
    if(process.env.EFS_FILES_READER_EVIDENCE==='1')writeFileSync(new URL('../../../.superpowers/sdd/files-reader-plan/files-reader-evidence.json',import.meta.url),stringify(report)+'\n');
  },{profile:'reads'});
});
