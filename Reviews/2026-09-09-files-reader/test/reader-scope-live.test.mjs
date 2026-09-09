import test from 'node:test';
import assert from 'node:assert/strict';
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { Interface, ZeroHash, toBeHex } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { createFixtureReader, DEFAULT_LIMITS } from '../reader-scope.mjs';
import { publication, groupLeaf } from '../../2026-09-05-c0-core/scripts/local-stateful.mjs';
import { PROFILE } from '../../2026-09-05-c0-core/reference/lens-resolver.mjs';
import { executionObject, executionId } from '../../2026-09-08-upgradeable-foundation/reference/upgrade-reader.mjs';

const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
const methods = new Set(['eth_chainId','eth_getBlockByNumber','eth_getCode','eth_getStorageAt','eth_call']);
const slot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const adminSlot = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
const plain = x => x?.toArray ? x.toArray(true) : x;

test('real read-profile scopes qualify, pin, share, seal and fail closed', {timeout:300000}, async t => {
  compileUpgrade();
  await withUpgrade(async lab => {
    for(const [i,g] of lab.inputs.candidates.groups.entries())assert.equal((await lab.publish(publication([groupLeaf(lab.inputs.meta,'0x'+g.groupHex)],100+i))).receipt.status,'0x1');
    const planType=lab.inputs.candidates.groups.flatMap(g=>g.members).find(m=>m.descriptor.name==='ResolutionPlan/1').temporaryTypeSchemaId;
    const body=Buffer.alloc(162);body.writeUInt16BE(160);body[2]=1;body.writeUInt16BE(1,8);Buffer.from(PROFILE.slice(2),'hex').copy(body,66);body[129]=1;
    const plan=publication([{typeId:planType,body:'0x'+body.toString('hex')}],200);
    assert.equal((await lab.publish(plan)).receipt.status,'0x1');
    const attempts=[];
    let active=0, maximum=0;
    const measured = async(method,params=[],options={}) => {
      assert(methods.has(method),'read-only RPC surface');
      active++;maximum=Math.max(maximum,active);
      try {
        const raw=await lab.rpc(method,params,options);
        attempts.push({method,params,raw,bytes:Buffer.byteLength(JSON.stringify(raw))});
        return raw;
      } finally {active--;}
    };
    const source={identity:lab.expected.source,epoch:1,request:measured};
    const reader=createFixtureReader({source,context:{expected:lab.expected}});
    const ready=async(r=reader,options={blockTag:'latest'})=>{
      const o=await r.open(options);assert.equal(o.status,'READY',o.reason);return o.scope;
    };
    const make=(request,expected=lab.expected,limits)=>createFixtureReader({source:{identity:lab.expected.source,epoch:1,request},context:{expected,limits}});
    const denied=async(request,pattern,expected=lab.expected,limits)=>{
      let dataCalls=0;
      const tracked=async(m,p,o)=>{if(m==='eth_call'&&p[0].data.startsWith(lab.readIface.getFunction('getRecord').selector))dataCalls++;return request(m,p,o);};
      const opened=await make(tracked,expected,limits).open({blockTag:'latest'});
      assert.equal(opened.status,'UNAVAILABLE');assert.match(opened.reason,pattern);
      assert.equal(dataCalls,0);return opened;
    };

    // Break: READY skips source controls, or duplicate calls spend two RPC attempts.
    const scope=await ready();
    t.diagnostic('U1 cold-open '+JSON.stringify(scope.stats()));
    assert(Object.isFrozen(scope.basis));assert.equal(scope.basis.revision,1n);
    const before=scope.stats().requests, priorHits=scope.stats().cacheHits;
    const [a,b]=await Promise.all([scope.call('getRecord',[ZeroHash]),scope.call('getRecord',[ZeroHash])]);
    assert.equal(a.status,'OK');assert.deepEqual(plain(a.values),[ZeroHash,'0x',0n]);
    assert.equal(a.evidenceId,b.evidenceId);assert.equal(scope.stats().requests,before+1);
    assert.equal(scope.stats().cacheHits-priorHits,1);
    assert.equal((await scope.seal()).status,'SEALED');
    const count=scope.stats().requests;
    for(const n of ['executeFixture','getReceipt','record','eth_sendTransaction','toString','getRecord(bytes32)'])assert.equal((await scope.call(n,[])).status,'UNAVAILABLE');
    assert.equal(scope.stats().requests,count);
    assert.equal(scope.stats().bytes,scope.evidence().reduce((n,e)=>n+e.bytes,0));
    assert.equal(maximum<=DEFAULT_LIMITS.maxInFlight,true);
    for(const e of scope.evidence())if(['eth_call','eth_getCode','eth_getStorageAt'].includes(e.method))assert.deepEqual(e.params.at(-1),{blockHash:scope.basis.blockHash,requireCanonical:true});
    const codeCalls=scope.evidence().filter(e=>e.method==='eth_getCode');
    assert.equal(new Set(codeCalls.map(e=>e.params[0].toLowerCase())).size,codeCalls.length);
    const exported=scope.evidence();assert.throws(()=>{exported[0].result='forged';},TypeError);
    assert.equal(scope.stats().requests,attempts.length,'every scope RPC is a measured transport attempt');
    assert.equal(scope.stats().bytes,attempts.reduce((n,e)=>n+e.bytes,0));
    t.diagnostic('U1 '+JSON.stringify(scope.stats()));

    // Break: literals drift from artifact input/output shapes (exercise every allowed codec).
    const calls=[['getOccurrence',[ZeroHash,0]],['getOccurrenceByOrdinal',[1]],['getBindingHead',[ZeroHash]],['getBindingAtBasis',[ZeroHash,scope.basis.admissionHigh]],['readHistory',[ZeroHash,1,1]],['pagePostingsHydrated',[ZeroHash,9,0,ZeroHash,[0,1,0]]],['resolve',[plan.recordIds[0],ZeroHash]],['validatePlan',[plan.recordIds[0]]]];
    for(const [name,args] of calls){
      const raw=await measured('eth_call',[{to:lab.core,data:lab.readIface.encodeFunctionData(name,args)}, {blockHash:scope.basis.blockHash,requireCanonical:true}]);
      const result=await scope.call(name,args);assert.equal(result.status,'OK',result.reason);
      assert.deepEqual(plain(result.values),plain(lab.readIface.decodeFunctionResult(name,raw)),name);
    }

    // Break: comparing a pinned U1 read to latest U2 wrongly invalidates honest history.
    await lab.upgrade();
    assert.equal((await scope.seal()).status,'SEALED');
    const fresh=await ready();assert.equal(fresh.basis.revision,2n);
    assert.equal(fresh.basis.admissionHigh,scope.basis.admissionHigh);
    assert.notEqual(fresh.basis.executionSetId,scope.basis.executionSetId);
    assert.equal((await fresh.seal()).status,'SEALED');t.diagnostic('U2 '+JSON.stringify(fresh.stats()));
    fresh.close();
    const [oldOpen,newOpen]=await Promise.all([reader.open({blockTag:'0x'+scope.basis.blockNumber.toString(16)}),reader.open({blockTag:'latest'})]);
    assert.equal(oldOpen.status,'READY',oldOpen.reason);assert.equal(newOpen.status,'READY',newOpen.reason);
    assert.equal(oldOpen.scope.basis.revision,1n);assert.equal(newOpen.scope.basis.revision,2n);
    oldOpen.scope.close();newOpen.scope.close();
    const mixed=make((m,p,o)=>measured(m,['eth_call','eth_getCode','eth_getStorageAt'].includes(m)?[...p.slice(0,-1),'latest']:p,o));
    const mixedOpen=await mixed.open({blockTag:'0x'+scope.basis.blockNumber.toString(16)});
    assert.equal(mixedOpen.status,'UNAVAILABLE');assert.match(mixedOpen.reason,/activation block order|context block/);
    const latency=await ready(make(async(m,p,o)=>{await pause(50);return measured(m,p,o);}));
    t.diagnostic('U2 50ms cold-open '+JSON.stringify(latency.stats()));
    await Promise.all([latency.call('getRecord',[ZeroHash]),latency.call('getRecord',[ZeroHash])]);
    assert.equal((await latency.seal()).status,'SEALED');
    t.diagnostic('U2 50ms open/shared-read/seal '+JSON.stringify({...latency.stats(),methods:Object.fromEntries([...methods].map(method=>[method,latency.evidence().filter(e=>e.method===method).length]))}));
    latency.close();

    // Break: mutable caller objects retroactively alter accepted configuration.
    const supplied=structuredClone(lab.expected), copied=make(measured,supplied);
    supplied.execution.operator='0x'+'11'.repeat(20);supplied.components.core.code='0x';
    const copiedScope=await ready(copied);copiedScope.close();
    source.epoch++;
    assert.equal((await scope.seal()).reason,'source changed');
    const replacement=await ready();source.request=async(...args)=>measured(...args);
    assert.equal((await replacement.call('getRecord',[ZeroHash])).reason,'source changed');

    // Break: missing/wrong fixed controls are treated as absent data.
    for(const name of ['PointReadLibrary','UpgradeQueryReadLibrary','PreparationHelper','core']) {
      await denied(async(m,p,o)=>m==='eth_getCode'&&p[0].toLowerCase()===lab.expected.components[name].address.toLowerCase()?'0x6000':measured(m,p,o),/runtime/);
    }
    // Real disposable-chain corruption controls; observations here are not mocked contract state.
    for(const mutation of [
      ()=>lab.rpc('anvil_setCode',[lab.expected.components.PointReadLibrary.address,'0x6000']),
      ()=>lab.rpc('anvil_setStorageAt',[lab.core,adminSlot,toBeHex(1,32)]),
      ()=>lab.rpc('anvil_setStorageAt',[lab.carrier,slot,toBeHex(1,32)]),
      ()=>lab.rpc('anvil_setStorageAt',[lab.expected.execution.coreAdmin,ZeroHash,toBeHex(1,32)]),
    ]) {
      const snapshot=await lab.rpc('evm_snapshot',[]);
      try {await mutation();await denied(measured,/runtime|execution reverted/);}
      finally {assert(await lab.rpc('evm_revert',[snapshot]));}
    }
    const wrong=structuredClone(lab.expected);wrong.components.PointReadLibrary.code='0x6000';
    await denied(measured,/runtime/,wrong);
    for(const [target,storage,value] of [[lab.core,slot,ZeroHash],[lab.carrier,slot,ZeroHash],[lab.core,adminSlot,ZeroHash]]) {
      await denied(async(m,p,o)=>m==='eth_getStorageAt'&&p[0]===target&&p[1]===storage?value:measured(m,p,o),/slot/);
    }
    const replaceCall=(name,edit)=>async(m,p,o)=>{
      const raw=await measured(m,p,o);
      if(m!=='eth_call'||!p[0].data.startsWith(lab.readIface.getFunction(name).selector))return raw;
      return edit(raw,p);
    };
    for(const name of ['bootstrap','configuration','revisionAt','fixtureReadContext'])await denied(replaceCall(name,()=> '0x'),/ABI/);
    await denied(replaceCall('currentRevision',()=>lab.readIface.encodeFunctionResult('currentRevision',[17])),/history revision budget/);
    await denied(replaceCall('configuration',()=>lab.readIface.encodeFunctionResult('configuration',[ZeroHash])),/configuration/);
    await denied(replaceCall('fixtureReadContext',raw=>{const x=plain(lab.readIface.decodeFunctionResult('fixtureReadContext',raw));x[2]++;return lab.readIface.encodeFunctionResult('fixtureReadContext',x);}),/context block/);
    await denied(replaceCall('fixtureReadContext',raw=>{const x=plain(lab.readIface.decodeFunctionResult('fixtureReadContext',raw));x[3]++;return lab.readIface.encodeFunctionResult('fixtureReadContext',x);}),/context admission/);
    await denied(replaceCall('bootstrap',raw=>{const x=plain(lab.readIface.decodeFunctionResult('bootstrap',raw));x[0][0]=ZeroHash;return lab.readIface.encodeFunctionResult('bootstrap',x);}),/bootstrap/);
    await denied(replaceCall('revisionAt',raw=>{const x=plain(lab.readIface.decodeFunctionResult('revisionAt',raw));x[0][20]=ZeroHash;return lab.readIface.encodeFunctionResult('revisionAt',x);}),/execution-set/);
    const historyMutation=edit=>replaceCall('revisionAt',(raw,p)=>{
      const e=executionObject(lab.readIface.decodeFunctionResult('revisionAt',raw)[0]);edit(e,p);
      e.id=executionId(e);return lab.readIface.encodeFunctionResult('revisionAt',[e]);
    });
    for(const [edit,reason] of [
      [e=>{if(e.ordinal==='1')e.activationAdmissionHigh='1';},/initial admission boundary/],
      [e=>{if(e.ordinal==='2')e.activationBlock='0';},/activation block order/],
      [e=>{e.activationAdmissionHigh='999999';},/activation admission order/],
      [e=>{e.coreImplementation='0x'+'12'.repeat(20);},/unrecognized historical implementation/],
      [e=>{e.coreCodehash=ZeroHash;},/historical implementation hash/],
      [e=>{e.coreConfiguration=ZeroHash;},/configuration commitment/],
      [e=>{e.operator='0x'+'12'.repeat(20);},/fixed execution operator/],
      [(e,p)=>{if(p[0].to===lab.carrier)e.activationBlock='0';},/peer history/],
    ])await denied(historyMutation(edit),reason);
    const ownerCodec=new Interface(['function owner() view returns(address)']);
    await denied(async(m,p,o)=>m==='eth_call'&&p[0].data===ownerCodec.encodeFunctionData('owner',[])?ownerCodec.encodeFunctionResult('owner',['0x'+'12'.repeat(20)]):measured(m,p,o),/ProxyAdmin owner/);
    for(const bad of [
      {...structuredClone(lab.expected),chainId:'031337'},
      {...structuredClone(lab.expected),components:Object.fromEntries(Array.from({length:33},(_,i)=>['c'+i,lab.expected.components.core]))},
      {...structuredClone(lab.expected),implementations:Object.fromEntries(Array.from({length:33},(_,i)=>[toBeHex(i+1,20),{code:'0x60'}]))},
    ]){const before=attempts.length;await denied(measured,/manifest/,bad);assert.equal(attempts.length,before);}

    // Break: data ABI junk succeeds, failed single-flight is retained, or errors lose raw evidence.
    let bad=true;
    const flaky=await ready(make(replaceCall('getRecord',raw=>bad?raw+'00':raw)));
    const fail=await flaky.call('getRecord',[ZeroHash]);assert.equal(fail.status,'UNAVAILABLE');assert.match(fail.reason,/ABI/);
    assert(flaky.evidence().find(e=>e.id===fail.evidenceId).result.endsWith('00'));
    bad=false;assert.equal((await flaky.call('getRecord',[ZeroHash])).status,'OK');flaky.close();
    for(const transform of [()=> '0x',raw=>raw.slice(0,-2),()=>({type:'not raw ABI'})]) {
      const s=await ready(make(replaceCall('getRecord',transform)));
      const result=await s.call('getRecord',[ZeroHash]);assert.equal(result.status,'UNAVAILABLE');assert.match(result.reason,/ABI/);s.close();
    }
    const oversized=await ready(make(replaceCall('getRecord',()=> '0x'+'00'.repeat(DEFAULT_LIMITS.responseBytes))));
    const large=await oversized.call('getRecord',[ZeroHash]);assert.match(large.reason,/response byte budget/);
    assert(oversized.evidence().find(e=>e.id===large.evidenceId).bytes>DEFAULT_LIMITS.responseBytes);
    const errors=await denied(async(m,p,o)=>{if(m==='eth_getCode')throw Object.assign(Error('transport fixture failure'),{code:-32000,data:'0x1234'});return measured(m,p,o);},/transport fixture failure/);
    assert(errors.evidence.some(e=>e.error?.data==='0x1234'&&e.error.code===-32000));
    for(const [limits,pattern] of [[{maxRequests:1},/request budget/],[{responseBytes:32},/response byte budget/],[{maxBytes:100},/total byte budget/]])await denied((m,p)=>measured(m,p),pattern,lab.expected,limits);
    for(const limits of [{maxInFlight:5},{maxRequests:Infinity},{deadlineMs:0},{unknown:1}])await denied(measured,/limits/,lab.expected,limits);
    let broken=true;
    const retryReader=make(async(m,p,o)=>{if(broken&&m==='eth_getCode')throw Error('temporary acquisition');return measured(m,p,o);});
    assert.equal((await retryReader.open({blockTag:'latest'})).reason,'temporary acquisition');broken=false;
    const recovered=await ready(retryReader);recovered.close();
    for(const tag of ['pending','0x00','0X1','01',-1])assert.equal((await reader.open({blockTag:tag})).reason,'canonical block tag required');

    // Break: header drift can seal; source pin is mixed during revalidation.
    let reorg=false;
    const reorgScope=await ready(make(async(m,p,o)=>{const raw=await measured(m,p,o);return reorg&&m==='eth_getBlockByNumber'?{...raw,hash:ZeroHash}:raw;}));
    reorg=true;assert.match((await reorgScope.seal()).reason,/canonical header/);
    let changeH=false;
    const admissionScope=await ready(make(replaceCall('counts()',raw=>{
      if(!changeH)return raw;const row=plain(lab.readIface.decodeFunctionResult('counts()',raw));row[0][4]++;return lab.readIface.encodeFunctionResult('counts()',row);
    })));
    changeH=true;assert.match((await admissionScope.seal()).reason,/context admission counts/);

    // Break: independent opens share cancellation or a failed open poisons the next.
    const cancel=new AbortController();
    const delayed=make(async(...args)=>{await pause(5);return measured(...args);});
    const one=delayed.open({blockTag:'latest',signal:cancel.signal}),two=delayed.open({blockTag:'latest'});cancel.abort();
    assert.equal((await one).reason,'aborted');const second=await two;assert.equal(second.status,'READY',second.reason);second.scope.close();
    const third=await ready(delayed);third.close();

    // Break: close permits ignored-signal replies to enter evidence or queued RPCs to start.
    let release, hold=false, starts=0;
    const gate=new Promise(r=>release=r);
    const cancellable=await ready(make(async(m,p,o)=>{if(hold){starts++;await gate;}return measured(m,p,o);},lab.expected,{maxInFlight:1}));
    hold=true;
    const pending=[1,2,3].map(i=>cancellable.call('getRecord',[toBeHex(i,32)]));
    await pause(5);cancellable.close();const terminal=JSON.stringify(cancellable.evidence());
    assert((await Promise.all(pending)).every(r=>r.status==='UNAVAILABLE'));
    release();await pause(10);assert.equal(starts,1);assert.equal(JSON.stringify(cancellable.evidence()),terminal);
    scope.close();replacement.close();reorgScope.close();
  },{profile:'reads'});
});

// Break: reading a page slowly consumes acquisition time, or seal races queued data.
test('active windows exclude idle time and sealing is a shared data barrier', {timeout:300000}, async () => {
  await withUpgrade(async lab => {
    let hold=false,release,notify;
    const gate=new Promise(r=>release=r),entered=new Promise(r=>notify=r);
    const source={identity:lab.expected.source,epoch:1,request:async(m,p,o)=>{
      if(hold&&m==='eth_call'&&p[0].data.startsWith(lab.readIface.getFunction('getRecord').selector)){notify();await gate;}
      return lab.rpc(m,p,o);
    }};
    const reader=createFixtureReader({source,context:{expected:lab.expected,limits:{deadlineMs:150,maxInFlight:1}}});
    const opened=await reader.open({blockTag:'latest'});assert.equal(opened.status,'READY',opened.reason);
    const scope=opened.scope,initial=scope.stats();
    await pause(180);
    assert.equal((await scope.call('getRecord',[ZeroHash])).status,'OK','idle after READY is outside deadline');
    assert.equal((await scope.seal()).status,'SEALED');const first=scope.stats();
    assert(first.requests>initial.requests);assert(first.bytes>initial.bytes);
    await pause(180);hold=true;
    const reads=[1,2,3].map(i=>scope.call('getRecord',[toBeHex(i,32)]));await entered;
    const seal1=scope.seal(),seal2=scope.seal();
    assert.equal(seal1,seal2,'concurrent seals share a barrier');
    const blocked=await scope.call('getRecord',[toBeHex(4,32)]);assert.equal(blocked.reason,'scope sealing');
    release();assert((await Promise.all(reads)).every(r=>r.status==='OK'));
    assert.equal((await seal1).status,'SEALED');
    const last=scope.stats();assert.equal(last.requests-first.requests,7,'three data calls plus four fresh seal checks');
    assert(last.bytes>first.bytes);assert.equal(last.cacheHits,first.cacheHits);
    const evidence=scope.evidence(),lastData=Math.max(...evidence.filter(e=>e.purpose==='data').map(e=>e.sequence));
    assert(evidence.filter(e=>e.sequence>lastData).every(e=>e.purpose==='seal'));
    scope.close();
    const bounded=createFixtureReader({source,context:{expected:lab.expected,limits:{maxRequests:initial.requests+5}}});
    const next=await bounded.open({blockTag:'latest'});assert.equal(next.status,'READY',next.reason);
    const s=next.scope;assert.equal((await s.call('getRecord',[ZeroHash])).status,'OK');
    assert.equal((await s.seal()).status,'SEALED');const atLimit=s.stats();
    assert.equal((await s.call('getRecord',[toBeHex(99,32)])).reason,'request budget exceeded');
    assert.equal(s.stats().requests,atLimit.requests);assert.equal(s.stats().bytes,atLimit.bytes);
  },{profile:'reads'});
});

test('stalled active window expires and every recorded attempt actually reached transport', {timeout:300000}, async () => {
  await withUpgrade(async lab => {
    let hold=false,release,starts=0;
    const gate=new Promise(r=>release=r);
    const source={identity:lab.expected.source,epoch:1,request:async(m,p,o)=>{starts++;if(hold)await gate;return lab.rpc(m,p,o);}};
    const reader=createFixtureReader({source,context:{expected:lab.expected,limits:{deadlineMs:100,maxInFlight:1}}});
    const cancelled=new AbortController();const pending=reader.open({blockTag:'latest',signal:cancelled.signal});cancelled.abort();
    const failure=await pending;assert.equal(failure.reason,'aborted');assert.equal(failure.evidence.length,starts,'evidence counts source attempts, not unsent microtasks');
    const opened=await reader.open({blockTag:'latest'});assert.equal(opened.status,'READY',opened.reason);
    hold=true;const scope=opened.scope,reads=[1,2].map(i=>scope.call('getRecord',[toBeHex(i,32)]));
    assert((await Promise.all(reads)).every(r=>r.reason==='deadline exceeded'));
    const evidence=JSON.stringify(scope.evidence());release();await pause(20);
    assert.equal(JSON.stringify(scope.evidence()),evidence);assert.equal((await scope.seal()).reason,'deadline exceeded');
  },{profile:'reads'});
});
