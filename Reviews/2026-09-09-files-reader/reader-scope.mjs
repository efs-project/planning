// Disposable fixture configuration, not public discovery or portable author authority.
// This browser path deliberately does not import the Node retained-state oracle.
import { AbiCoder, Interface, keccak256, toUtf8Bytes, ZeroHash } from '../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js';

// Budgets are adjustable experiment settings (2026-09-09 correctness-first
// ruling); raised for churn-heavy enumeration and chunked content. The 512-
// request historical control remains reproducible by passing limits down.
export const DEFAULT_LIMITS = Object.freeze({maxRequests:4096,maxBytes:33554432,responseBytes:262144,maxInFlight:16,deadlineMs:60000});
const EXECUTION_FIELDS = 'uint32 ordinal,uint64 activationBlock,uint64 activationAdmissionHigh,address core,address carrier,address coreImplementation,address carrierImplementation,bytes32 coreCodehash,bytes32 carrierCodehash,address coreAdmin,address carrierAdmin,address controller,address operator,address helper,bytes32 helperCodehash,address admissionLibrary,bytes32 admissionCodehash,bytes32 treeType,bytes32 coreConfiguration,bytes32 carrierConfiguration,bytes32 id';
const EXECUTION = 'tuple('+EXECUTION_FIELDS+')';
const HEAD = '(uint8 state,uint8 targetKind,uint8 tombstoneCause,uint32 revision,uint64 admissionOrdinal,bytes32 targetA,uint16 targetLeaf)';
const APPLICATION = Object.freeze({
  getRecord:'function getRecord(bytes32 recordId) view returns (bytes32,bytes,uint64)',
  getOccurrence:'function getOccurrence(bytes32 envelopeId,uint16 leafIndex) view returns (uint8,uint64,bytes32,bytes32,bytes32,uint64)',
  getOccurrenceByOrdinal:'function getOccurrenceByOrdinal(uint64 ordinal) view returns (bytes32,uint16,bytes32,bytes32,bytes32,uint8,uint64)',
  getBindingHead:'function getBindingHead(bytes32 bindingKey) view returns ('+HEAD+',bytes32,uint64)',
  getBindingAtBasis:'function getBindingAtBasis(bytes32 bindingKey,uint64 basisOrdinal) view returns ('+HEAD+',bytes32,uint64)',
  readHistory:'function readHistory(bytes32 bindingKey,uint32 fromRevision,uint16 limit) view returns ((uint32 revision,uint64 admissionOrdinal,bytes32 envelopeId,uint16 leafIndex,uint8 occurrenceStatus,uint64 revokedAtOrdinal)[],uint32,uint8)',
  pagePostingsHydrated:'function pagePostingsHydrated(bytes32 T,uint8 kind,uint8 indexOrdinal,bytes32 valueKey,(uint256 cursor,uint16 maxItems,uint64 basisOrdinal) req) view returns ((bytes32 realmBasis,uint64 highWaterOrdinal,uint256 cursor,bytes32[] items,uint32 coverage,uint8 completeness),(uint64 ordinal,bytes32 envelopeId,uint16 leafIndex,bytes32 recordId,bytes32 principalId,uint8 occurrenceStatus,uint64 revokedAtOrdinal)[])',
  resolve:'function resolve(bytes32 planRecordId,bytes32 positionKey) view returns ((uint8 presence,uint8 reasonCode,(uint8 targetKind,bytes32 targetA,uint16 targetLeaf) target,uint16 winnerIndex,uint16 winnerTier,uint64 winnerAdmissionOrdinal,uint16 presentCount,uint16 agreeCount,(bytes32 realmRevisionId,uint64 blockNumber,uint64 admissionHigh,uint8 basisKind) basis))',
  validatePlan:'function validatePlan(bytes32 planRecordId) view returns (bool,uint8)',
});
// Carrier byte views share the same pinned budgets/evidence path as Core reads.
const CARRIER_APPLICATION = Object.freeze({
  hasFixtureBytes:'function hasFixtureBytes(bytes32 treeId) view returns (bool)',
  readFixtureBytes:'function readFixtureBytes(bytes32 treeId) view returns (bytes)',
  chunkStatus:'function chunkStatus(bytes32 treeId) view returns (uint32,uint32,uint64,uint32,bytes32)',
  hasChunk:'function hasChunk(bytes32 treeId,uint32 index) view returns (bool)',
  readChunk:'function readChunk(bytes32 treeId,uint32 index) view returns (bytes)',
});
const codec = new Interface([...Object.values(APPLICATION),...Object.values(CARRIER_APPLICATION),
  'function bootstrap() view returns ((bytes32 realmId,bytes32 initialRevisionId,bytes intrinsicGroupBytes,bytes32 objectGroup1Hash,bytes32 kernelGroup2Hash,bytes32 metaTypeId,bytes32 objectGenesisType,bytes32 bindingSetType,bytes32 bindingTombstoneType,bytes32 withdrawalType))',
  'function configuration() view returns (bytes32)',
  'function currentRevision() view returns (uint32)',
  'function revisionAt(uint32 ordinal) view returns ('+EXECUTION+')',
  'function fixtureReadContext() view returns (bytes32 executionSetId,uint32 revision,uint64 blockNumber,uint64 admissionHigh)',
  'function counts() view returns ((uint64 records,uint64 envelopes,uint64 types,uint64 principals,uint64 admissions,uint64 batches,uint64 postingKeys,uint64 bindingKeys))',
  'function preparationHelper() view returns (address)',
  'function preparationCodehash() view returns (bytes32)',
  'function admissionLibrary() view returns (address)',
  'function admissionCodehash() view returns (bytes32)',
  'function owner() view returns (address)',
]);
const abi=AbiCoder.defaultAbiCoder(), utf8=new TextEncoder();
const IMPLEMENTATION_SLOT='0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';
const ADMIN_SLOT='0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
const FIXED=['core','carrier','coreAdmin','carrierAdmin','controller','operator','helper','helperCodehash','admissionLibrary','admissionCodehash','treeType'];
const domain = s => keccak256(toUtf8Bytes(s));
const check = (ok,reason) => {if(!ok)throw Error(reason);};
const equal = (a,b,reason) => check(String(a).toLowerCase()===String(b).toLowerCase(),reason);
const hex = (x,n) => typeof x==='string' && (n ? new RegExp('^0x[0-9a-fA-F]{'+n*2+'}$') : /^0x(?:[0-9a-fA-F]{2})+$/).test(x);
const quantity = x => typeof x==='string' && /^0x(?:0|[1-9a-f][0-9a-f]*)$/.test(x);
const blockTag = x => x==='latest' || quantity(x);
const freeze = x => {if(x && typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};
const clone = x => structuredClone(x);
const executionId = e => keccak256(abi.encode(['bytes32',EXECUTION],[domain('efs.fixture.execution-set/1'),{...e,id:ZeroHash}]));
function configurationId(e,core) {
  const impl=core?e.coreImplementation:e.carrierImplementation;
  return keccak256(abi.encode(['address','address','bytes32','address','address','address','address','address','bytes32','address','address','bytes32','address','bytes32'],
    [core?e.core:e.carrier,impl,core?e.coreCodehash:e.carrierCodehash,impl,core?e.coreAdmin:e.carrierAdmin,e.controller,core?e.carrier:e.core,e.operator,e.treeType,e.controller,e.helper,e.helperCodehash,e.admissionLibrary,e.admissionCodehash]));
}
function groupType(bytes,index) {
  const group=keccak256(abi.encode(['bytes32','bytes32'],[domain('efs2/typeschema-group/1'),keccak256(bytes)]));
  return keccak256(abi.encode(['bytes32','bytes32','uint256'],[domain('efs2/typeschema/1'),group,index]));
}
function manifest(input) {
  check(input && typeof input==='object','manifest missing');
  const e=clone(input);
  check(typeof e.source==='string'&&e.source.length>0&&e.source.length<=2048,'manifest source');
  check(typeof e.chainId==='string'&&/^[1-9][0-9]*$/.test(e.chainId)&&BigInt(e.chainId)<1n<<256n,'manifest chain');
  check(hex(e.core,20)&&e.execution&&e.getters&&e.init,'manifest fields');
  for(const k of FIXED)check(hex(e.execution[k],k.endsWith('Codehash')||k==='treeType'?32:20),'manifest execution '+k);
  equal(e.core,e.execution.core,'manifest Core');
  for(const k of ['realmId','initialRevisionId'])check(hex(e.init[k],32)&&e.init[k]!==ZeroHash,'manifest init '+k);
  for(const k of ['intrinsicGroupBytes','objectGroup1Bytes','kernelGroup2Bytes'])check(hex(e.init[k])&&e.init[k].length<=2+8190*2,'manifest init '+k);
  for(const k of ['components','implementations']) {
    check(e[k]&&typeof e[k]==='object'&&!Array.isArray(e[k]),'manifest '+k);
    const entries=Object.entries(e[k]);check(entries.length>0&&entries.length<=32,'manifest '+k+' inventory');
    for(const [key,c] of entries)check(c&&hex(k==='components'?c.address:key,20)&&hex(c.code)&&c.code.length<=2+262144*2,'manifest '+k+' entry');
  }
  const byAddress=new Map();
  for(const c of Object.values(e.components)) {
    const address=c.address.toLowerCase();
    if(byAddress.has(address))equal(byAddress.get(address),c.code,'manifest conflicting runtime');
    byAddress.set(address,c.code.toLowerCase());
  }
  // Required control/dependency inventories cannot be removed by an incomplete caller manifest.
  for(const [name,field] of [['core','core'],['carrier','carrier'],['coreAdmin','coreAdmin'],['carrierAdmin','carrierAdmin'],['FixtureDeployment','controller'],['PreparationHelper','helper'],['UpgradeAdmissionLibrary','admissionLibrary']]) {
    check(e.components[name],'manifest missing component '+name);
    equal(e.components[name].address,e.execution[field],'manifest component '+name);
  }
  for(const name of ['PointReadLibrary','UpgradeQueryReadLibrary'])check(e.components[name],'manifest missing component '+name);
  for(const [key,value] of Object.entries(e.implementations))equal(byAddress.get(key.toLowerCase()),value.code,'manifest implementation runtime');
  e.implementations=Object.fromEntries(Object.entries(e.implementations).map(([k,v])=>[k.toLowerCase(),v]));
  for(const [getter,field] of [['preparationHelper','helper'],['preparationCodehash','helperCodehash'],['admissionLibrary','admissionLibrary'],['admissionCodehash','admissionCodehash']])equal(e.getters[getter],e.execution[field],'manifest dependency '+getter);
  equal(keccak256(e.components.PreparationHelper.code),e.execution.helperCodehash,'manifest helper hash');
  equal(keccak256(e.components.UpgradeAdmissionLibrary.code),e.execution.admissionCodehash,'manifest admission hash');
  return freeze(e);
}
function limits(input={}) {
  check(input && typeof input==='object'&&!Array.isArray(input),'limits shape');
  for(const [key,value] of Object.entries(input))check(Object.hasOwn(DEFAULT_LIMITS,key)&&Number.isSafeInteger(value)&&value>0&&value<=DEFAULT_LIMITS[key],'limits '+key);
  return Object.freeze({...DEFAULT_LIMITS,...input});
}

export function createFixtureReader({source,context}={}) {
  let expected,caps,configurationError;
  try {expected=manifest(context?.expected);caps=limits(context?.limits);}
  catch(error){configurationError='configuration: '+error.message;}
  return Object.freeze({async open({blockTag:requested='latest',signal}={}) {
    if(configurationError)return {status:'UNAVAILABLE',reason:configurationError,evidence:[]};
    if(!blockTag(requested))return {status:'UNAVAILABLE',reason:'canonical block tag required',evidence:[]};
    if(!source||source.identity!==expected.source||!Number.isSafeInteger(source.epoch)||source.epoch<0||typeof source.request!=='function')return {status:'UNAVAILABLE',reason:'source configuration',evidence:[]};
    const acquisition=createScope(source,expected,caps,signal);
    try {await acquisition.qualify(requested);return {status:'READY',scope:acquisition.scope};}
    catch(error){acquisition.stop(error.message);return {status:'UNAVAILABLE',reason:error.message,evidence:acquisition.scope.evidence()};}
  }});
}

function createScope(source,expected,caps,signal) {
  const identity=source.identity,epoch=source.epoch,request=source.request;
  const controller=new AbortController(),started=performance.now();
  const records=[],queue=[],running=new Set(),cache=new Map(),dataWork=new Set();
  let stopped=null,pin,basis,requests=0,bytes=0,cacheHits=0,peak=0,sealFlight,sealing=false,timer,windowDeadline;
  function beginWindow() {
    live();
    if(windowDeadline!==undefined)return;
    windowDeadline=performance.now()+caps.deadlineMs;
    timer=setTimeout(()=>stop('deadline exceeded'),caps.deadlineMs);
    timer.unref?.();
  }
  function endWindow() {clearTimeout(timer);windowDeadline=undefined;}
  const externalAbort=()=>stop('aborted');
  signal?.addEventListener('abort',externalAbort,{once:true});
  if(signal?.aborted)stop('aborted');
  function stop(reason) {
    if(stopped)return;
    stopped=reason;endWindow();signal?.removeEventListener('abort',externalAbort);controller.abort();
    for(const job of queue.splice(0))job.reject(Error(reason));
    for(const job of running) {
      if(job.record.endedMs===null){job.record.error={message:reason};job.record.endedMs=performance.now()-started;}
      job.reject(Object.assign(Error(reason),{evidenceId:job.record.id}));
    }
    cache.clear();
  }
  function live() {
    if(!stopped&&(source.identity!==identity||source.epoch!==epoch||source.request!==request))stop('source changed');
    if(!stopped&&windowDeadline!==undefined&&performance.now()>=windowDeadline)stop('deadline exceeded');
    if(stopped)throw Error(stopped);
  }
  function pump() {
    try {live();}catch{return;}
    while(queue.length&&running.size<caps.maxInFlight&&!stopped) {
      if(requests>=caps.maxRequests){stop('request budget exceeded');return;}
      const job=queue.shift();requests++;
      const record={id:requests,sequence:requests,method:job.method,params:clone(job.params),purpose:job.purpose,bytes:0,startedMs:performance.now()-started,endedMs:null};
      job.record=record;records.push(record);running.add(job);peak=Math.max(peak,running.size);
      // Invoke at the accounting boundary, not in a later microtask: each record
      // is an actual source attempt, including synchronous transport exceptions.
      let pending;
      try {pending=request.call(source,job.method,clone(job.params),{signal:controller.signal,maxBytes:Math.min(caps.responseBytes,caps.maxBytes-bytes)});}
      catch(error){pending=Promise.reject(error);}
      Promise.resolve(pending).then(result=>{
        live(); // Ignored cancellation must never turn a late reply into scope evidence.
        const serialized=JSON.stringify(result);
        check(typeof serialized==='string','non-JSON RPC result');
        const size=utf8.encode(serialized).length;
        record.result=JSON.parse(serialized);record.bytes=size;bytes+=size;
        record.endedMs=performance.now()-started;
        if(size>caps.responseBytes){stop('response byte budget exceeded');throw Error(stopped);}
        if(bytes>caps.maxBytes){stop('total byte budget exceeded');throw Error(stopped);}
        job.resolve({result:record.result,evidenceId:record.id});
      }).catch(error=>{
        if(!stopped){record.error={name:error.name,message:error.message,...(error.code===undefined?{}:{code:clone(error.code)}),...(error.data===undefined?{}:{data:clone(error.data)})};record.endedMs=performance.now()-started;}
        job.reject(Object.assign(Error(stopped??error.message),{evidenceId:record.id}));
      }).finally(()=>{running.delete(job);pump();});
    }
  }
  async function rpc(method,params,purpose) {
    // Convert immediate stop/budget failures into promises so grouped controls
    // always attach rejection handlers to every acquisition they have started.
    live();
    return new Promise((resolve,reject)=>{queue.push({method,params:clone(params),purpose,resolve,reject});pump();});
  }
  async function call(target,name,args,purpose,fresh=false) {
    live();
    const data=codec.encodeFunctionData(name,args),params=[{to:target,data},pin];
    const key=JSON.stringify(params);
    if(!fresh&&cache.has(key)){cacheHits++;return cache.get(key);}
    const work=(async()=>{
      const response=await rpc('eth_call',params,purpose);
      try {
        check(hex(response.result)||response.result==='0x','ABI '+name+' raw bytes');
        const values=codec.decodeFunctionResult(name,response.result);
        check(codec.encodeFunctionResult(name,values)===response.result,'ABI '+name+' noncanonical');
        return {...response,values};
      } catch(error){throw Object.assign(Error('ABI '+name+': '+error.message),{evidenceId:response.evidenceId});}
    })();
    if(!fresh){cache.set(key,work);work.catch(()=>{if(cache.get(key)===work)cache.delete(key);});}
    return work;
  }
  const read=async(target,name,args=[],purpose='qualification',fresh=false)=>(await call(target,name,args,purpose,fresh)).values;
  function header(raw,number) {
    check(raw&&quantity(raw.number)&&hex(raw.hash,32)&&hex(raw.stateRoot,32),'canonical header shape');
    if(number!==undefined)equal(BigInt(raw.number),BigInt(number),'canonical header number');
    return raw;
  }
  async function context(purpose,fresh=false) {
    const [values,[counts]]=await Promise.all([
      read(expected.core,'fixtureReadContext',[],purpose,fresh),read(expected.core,'counts',[],purpose,fresh),
    ]);
    equal(values[0],basis.executionSetId,'context execution');equal(values[1],basis.revision,'context revision');
    equal(values[2],basis.blockNumber,'context block');equal(values[3],basis.admissionHigh,'context admission');
    equal(counts[4],basis.admissionHigh,'context admission counts');
  }
  async function canonical(purpose) {
    const [headerResult,chainResult]=await Promise.all([
      rpc('eth_getBlockByNumber',['0x'+basis.blockNumber.toString(16),false],purpose),rpc('eth_chainId',[],purpose),
    ]);
    const raw=header(headerResult.result,basis.blockNumber);
    equal(raw.hash,basis.blockHash,'canonical header changed');equal(raw.stateRoot,basis.stateRoot,'canonical header state root');
    const chain=chainResult.result;
    check(quantity(chain),'chain quantity');equal(BigInt(chain),basis.chainId,'chain changed');
  }
  async function qualify(requested) {
    beginWindow();
    const [chainResult,headerResult]=await Promise.all([
      rpc('eth_chainId',[],'qualification'),rpc('eth_getBlockByNumber',[requested,false],'qualification'),
    ]);
    const chain=chainResult.result;
    check(quantity(chain),'chain quantity');equal(BigInt(chain),expected.chainId,'chain mismatch');
    const h=header(headerResult.result,requested==='latest'?undefined:requested);
    pin=freeze({blockHash:h.hash,requireCanonical:true});
    // One fetch per distinct address, even when component and implementation inventories overlap.
    const codeByAddress=new Map();
    for(const c of Object.values(expected.components))codeByAddress.set(c.address.toLowerCase(),c.code);
    await Promise.all([...codeByAddress].map(async([address,code])=>{
      const r=await rpc('eth_getCode',[address,pin],'qualification');equal(r.result,code,'complete runtime '+address);
    }));
    const [[current],guarded,[counts]]=await Promise.all([
      read(expected.core,'currentRevision'),read(expected.core,'fixtureReadContext'),read(expected.core,'counts'),
    ]);
    check(current>=1n&&current<=16n,'history revision budget');
    equal(guarded[3],counts[4],'context admission counts');
    // Acquire bounded independent revisions together, then validate the history in order.
    const revisions=await Promise.all(Array.from({length:Number(current)},(_,i)=>Promise.all([
      read(expected.core,'revisionAt',[i+1]),read(expected.execution.carrier,'revisionAt',[i+1]),
    ])));
    const history=[];
    for(let ordinal=1;ordinal<=Number(current);ordinal++) {
      const [core,carrier]=revisions[ordinal-1];
      equal(abi.encode([EXECUTION],[core[0]]),abi.encode([EXECUTION],[carrier[0]]),'peer history');
      const e=Object.fromEntries(EXECUTION_FIELDS.split(',').map((field,i)=>[field.split(' ')[1],core[0][i]]));
      equal(e.ordinal,ordinal,'origin-contiguous revisions');equal(e.id,executionId(e),'complete execution-set commitment');
      const previous=history.at(-1);
      check(e.activationBlock>=(previous?.activationBlock??0n)&&e.activationBlock<=BigInt(h.number),'activation block order');
      check(e.activationAdmissionHigh>=(previous?.activationAdmissionHigh??0n)&&e.activationAdmissionHigh<=guarded[3],'activation admission order');
      if(!previous)equal(e.activationAdmissionHigh,0n,'initial admission boundary');
      for(const key of FIXED)equal(e[key],expected.execution[key],'fixed execution '+key);
      for(const kind of ['core','carrier']) {
        const implementation=expected.implementations[e[kind+'Implementation'].toLowerCase()];
        check(implementation,'unrecognized historical implementation');
        equal(e[kind+'Codehash'],keccak256(implementation.code),'historical implementation hash');
        equal(e[kind+'Configuration'],configurationId(e,kind==='core'),'configuration commitment');
      }
      history.push(e);
    }
    const active=history.at(-1);
    basis=freeze({source:identity,epoch,chainId:BigInt(chain),core:expected.core,blockNumber:BigInt(h.number),blockHash:h.hash,stateRoot:h.stateRoot,executionSetId:active.id,revision:current,admissionHigh:guarded[3]});
    await Promise.all([
      context('qualification'),
      ...['core','carrier'].map(async kind=>{
        const address=expected.execution[kind];
        const [impl,admin,owner,configuration,revision]=await Promise.all([
          rpc('eth_getStorageAt',[address,IMPLEMENTATION_SLOT,pin],'qualification'),
          rpc('eth_getStorageAt',[address,ADMIN_SLOT,pin],'qualification'),
          read(expected.execution[kind+'Admin'],'owner'),read(address,'configuration'),
          kind==='core'?Promise.resolve([current]):read(address,'currentRevision'),
        ]);
        for(const [r,key] of [[impl,'Implementation'],[admin,'Admin']]) {
          check(typeof r.result==='string'&&/^0x0{24}[0-9a-fA-F]{40}$/.test(r.result),'canonical '+kind+' '+key+' slot');
          equal('0x'+r.result.slice(-40),active[kind+key],'actual '+kind+' '+key+' slot');
        }
        // Exact source-supplied proxy runtime above includes its immutable admin openings.
        equal(owner[0],active.controller,'actual ProxyAdmin owner');
        equal(configuration[0],active[kind+'Configuration'],'installed configuration');
        equal(revision[0],current,'endpoint active revision');
      }),
      ...['preparationHelper','preparationCodehash','admissionLibrary','admissionCodehash'].map(async name=>{
        equal((await read(expected.core,name))[0],expected.getters[name],'dependency '+name);
      }),
      (async()=>{
        const boot=(await read(expected.core,'bootstrap'))[0],init=expected.init;
        const original=[init.realmId,init.initialRevisionId,init.intrinsicGroupBytes,keccak256(init.objectGroup1Bytes),keccak256(init.kernelGroup2Bytes),groupType(init.intrinsicGroupBytes,0)];
        original.forEach((value,i)=>equal(boot[i],value,'bootstrap commitment '+i));
      })(),
    ]);
    await canonical('qualification');live();endWindow();
  }
  const unavailable = error => ({status:'UNAVAILABLE',reason:error.message,evidenceId:error.evidenceId??null});
  const scope=Object.freeze({
    get basis(){return basis;},
    call(name,args=[]) {
      const work=(async()=>{
        try {
          live();check(!sealing,'scope sealing');check(Object.hasOwn(APPLICATION,name),'unsupported application call');beginWindow();
          const r=await call(expected.core,name,args,'data');live();
          return {status:'OK',values:r.values,evidenceId:r.evidenceId};
        }catch(error){return unavailable(error);}
      })();
      dataWork.add(work);work.then(()=>dataWork.delete(work));
      return work;
    },
    carrierCall(name,args=[]) {
      const work=(async()=>{
        try {
          live();check(!sealing,'scope sealing');check(Object.hasOwn(CARRIER_APPLICATION,name),'unsupported carrier call');beginWindow();
          const r=await call(expected.execution.carrier,name,args,'data');live();
          return {status:'OK',values:r.values,evidenceId:r.evidenceId};
        }catch(error){return unavailable(error);}
      })();
      dataWork.add(work);work.then(()=>dataWork.delete(work));
      return work;
    },
    seal() {
      if(sealFlight)return sealFlight;
      sealing=true;
      sealFlight=(async()=>{
        try {
          live();beginWindow();await Promise.all([...dataWork]);live();
          await Promise.all([canonical('seal'),context('seal',true)]);live();endWindow();
          return {status:'SEALED',basis,evidence:scope.evidence()};
        }
        catch(error){stop(error.message);return {status:'UNAVAILABLE',reason:error.message,evidence:scope.evidence()};}
        finally{sealFlight=null;sealing=false;}
      })();
      return sealFlight;
    },
    close(){stop('closed');},
    stats(){return freeze({requests,bytes,cacheHits,inFlight:running.size,maxInFlight:peak,queued:queue.length,elapsedMs:performance.now()-started,limits:caps});},
    evidence(){return freeze(clone(records));},
  });
  return {qualify,scope,stop};
}
