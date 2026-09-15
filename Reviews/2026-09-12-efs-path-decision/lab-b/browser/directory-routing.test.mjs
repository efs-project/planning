import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {loadEthers} from '../script/compact-environment.mjs';
import * as paths from './compact-paths.mjs';
import * as view from './files-view.mjs';

// Execute the actual app body/event wiring in a small browser-boundary host.
// Only native module import lines are replaced by injected module bindings.
// DOM layout is parent CUA's gate; these assertions observe app-rendered output,
// location/history events and signer/broadcast boundaries, not source strings.
const source=(await readFile(new URL('./app.mjs',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'');
const ethers=await loadEthers(),key='0x'+'11'.repeat(32),wallet=new ethers.Wallet(key);
const tick=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return {promise,resolve,reject};};
async function app({holdList,holdRead,holdPrepare,holdSubmit,holdContent,initial='#/',typed=true,carriers=false,image=false,encrypted=false,joined=false}={}){
  const listeners=new Map(),elements=new Map();
  const element=id=>{
    if(!elements.has(id))elements.set(id,{id,value:'',textContent:'',innerHTML:'',dataset:{},disabled:false,hidden:false,open:false,
      selectedOptions:[{textContent:'Alice first'}],listeners:new Map(),className:'',
      addEventListener(type,fn){this.listeners.set(type,fn);},querySelector(){return null;},focus(){},
      insertAdjacentHTML(){},showModal(){this.open=true;},close(){this.open=false;}});
    return elements.get(id);
  };
  for(const [id,value] of Object.entries({lens:'alice',signer:'alice','filter-scope':'either'}))element(id).value=value;
  const document={getElementById:element,querySelector:element,querySelectorAll:()=>[],createElement:()=>({click(){},remove(){}}),body:{append(){}},
    addEventListener(type,fn){listeners.set('document:'+type,fn);}};
  const location={hostname:'127.0.0.1',href:'http://127.0.0.1:12345/',hash:initial};
  const events=new Map(),dispatch=type=>{for(const fn of events.get(type)??[])fn({type});};
  const hashes=[initial];let index=0;
  const history={replaceState(_a,_b,url){location.hash=url;hashes[index]=url;},
    pushState(_a,_b,url){location.hash=url;hashes.splice(++index);hashes.push(url);},
    back(){if(index>0){location.hash=hashes[--index];dispatch('popstate');dispatch('hashchange');}},
    forward(){if(index+1<hashes.length){location.hash=hashes[++index];dispatch('popstate');dispatch('hashchange');}}};
  const stats={pin:0,authorize:0,submit:0,prepare:0,broadcast:0,content:0,point:0,joined:0,blobs:[],revoked:[],uploads:[],prepared:[]},context={blockNumber:'7',admission:'9',blockHash:ethers.id('route-basis')};
  const child=(folder,name)=>folder==='root'&&name==='archive'?'archive':folder==='archive'&&name==='qa-renamed'?'renamed':folder==='root'&&name==='slow'?'slow':null;
  const row=(folder,name,kind='file')=>({file:`${folder}-${name}`,folder,kind,knowledge:'PRESENT',name:{knowledge:'PRESENT',value:name},position:`${folder}/${name}`,selection:{author:wallet.address,revision:1,admission:'9'}});
  const sdk={async pin(){stats.pin++;return {...context,blockNumber:String(6+stats.pin),admission:String(8+stats.pin)};},
    async readDirectory(){return {knowledge:'PRESENT',coverage:'COMPLETE'};},
    async readPlacement({folder,name}){const target=child(folder,name);return target?{knowledge:'PRESENT',coverage:'COMPLETE',value:{target,kind:'directory',selection:{author:wallet.address,revision:1,admission:'9'}}}:{knowledge:'ABSENT',coverage:'COMPLETE',value:{}};},
    async listFolder({folder,authors,context}){if(holdList&&folder==='slow'&&authors[0]===wallet.address)await holdList.promise;return {knowledge:'PRESENT',coverage:'COMPLETE',basis:context,value:[row(folder,authors[0]!==wallet.address?'bob.txt':folder==='root'?'root.txt':folder==='renamed'?'child.txt':'slow.txt'),...(carriers?[row(folder,'second.txt')]:[])]};},
    async readFile({file}){stats.point++;if(holdRead&&file.startsWith('slow-'))await holdRead.promise;return {knowledge:'PRESENT',coverage:'COMPLETE',value:{file,selection:{author:wallet.address},revision:{file,recordId:'record',document:carriers?null:'0x61',profile:carriers?'carrier-v1':'legacy-inline',content:carriers?{length:4,media:0,encryption:encrypted?1:0}:undefined,firstAdmission:'9'},fileTag:{evaluated:true},revisionTag:{evaluated:true}}};},
    async readContent({file}){stats.content++;if(holdContent)await holdContent.promise;return {state:'AVAILABLE_VERIFIED',bytes:encrypted?new TextEncoder().encode('private note'):Uint8Array.of(0,255,128,65),file,recordId:'record'};},
    async prepare(args){stats.prepare++;stats.prepared.push(args);if(holdPrepare)await holdPrepare.promise;return {id:'plan',digest:ethers.id('intent')};},
    async authorize(plan,sign){stats.authorize++;await sign(plan.digest);return {id:'plan',transaction:{}};},
    async submit(_signed,send){stats.submit++;if(holdSubmit)await holdSubmit.promise;await send({to:wallet.address,data:'0x',value:0});return {id:'plan'};},
    async reconcile(){return {status:'EFFECTS_VERIFIED'};}};
  const config={rpcUrl:'http://127.0.0.1:12346',manifest:{chainId:'31337',folder:'root',filesProfile:'typed-directory-v1',authors:{alice:wallet.address,bob:'0x00000000000000000000000000000000000000b2'},contracts:{ledger:{address:wallet.address}}},mounts:[{id:'root',label:'Files'}]};
  if(!typed)delete config.manifest.filesProfile;
  if(carriers){config.manifest.contentProfile='raw-sha256-aesgcm-v2';config.carrierOrigin='http://127.0.0.1:12347';}
  if(joined){config.manifest.contracts.joined={address:wallet.address};sdk.listFolderPage=async args=>{stats.joined++;const {value,coverage,knowledge,...page}=await sdk.listFolder(args);return {...page,kind:'files-joined-page',queryKnowledge:knowledge,queryCoverage:coverage,pageRows:value.map(r=>Object.freeze({...r,match:args.search?'UNKNOWN':'MATCH',point:{knowledge:'PRESENT',coverage:'COMPLETE',value:{selection:{author:wallet.address},revision:{recordId:'record',firstAdmission:'9',profile:'carrier-v1',bodyLength:64,assurance:'HEADER_VERIFIED_BODY_NOT_FETCHED'}}}}))};};}
  const stored=new Map();const localStorage={getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)};
  const fetch=async(url,options)=>({ok:true,async json(){return url==='/config.json'?config:{alice:key};},async text(){const req=JSON.parse(options.body);
    if(req.method==='eth_sendRawTransaction')stats.broadcast++;
    return JSON.stringify({id:req.id,result:req.method==='eth_chainId'?'0x7a69':req.method==='eth_estimateGas'?'0x5208':'0x1'});}});
  class TestURL extends URL {static createObjectURL(blob){stats.blobs.push(blob);return 'blob:test';}static revokeObjectURL(url){stats.revoked.push(url);}}
  const scope=vm.createContext({document,location,history,localStorage,fetch,performance,AbortSignal,AbortController,TextEncoder,Uint8Array,URL:TestURL,Blob,structuredClone,setTimeout,
    confirm:()=>true,FormData:class{constructor(form){return Object.entries(form.values??{});}},
    addEventListener(type,fn){events.set(type,[...(events.get(type)??[]),fn]);},
    efsCompactDirectoryEntry:{...paths,createSdk:()=>sdk,content:{verifyPng:async()=>{if(image)return {blob:new Blob(['test']),width:1,height:1};throw Error('not PNG');},
      describe:async(bytes,{carrier})=>({carrier,length:bytes.length}),storeRawBytes:async bytes=>{stats.uploads.push(bytes);}}}});
  const execute=vm.compileFunction(`return (async()=>{${source}\n})();`,['ethers','createCompactSdk','folderState','filterRows','canOpen','costPresentation','renderCostTable'],{parsingContext:scope});
  await execute(ethers,()=>sdk,...['folderState','filterRows','canOpen','costPresentation','renderCostTable'].map(k=>view[k]));
  const click=async(action,data={})=>{listeners.get('document:click')({target:{closest:()=>({disabled:false,dataset:{action,...data}})}});await tick();};
  return {element,stats,location,history,async hash(value,event='hashchange'){history.pushState(null,'',value);dispatch(event);await tick();},
    dispatch,click,async submit(values={}){element('editor-form').values={name:'new.txt',document:'contents',...values};element('editor-form').listeners.get('submit')({preventDefault(){},target:element('editor-form')});await tick();}};
}

test('joined app lists headers without point bodies and hydrates only the selected file',async()=>{
  const a=await app({carriers:true,joined:true});assert.equal(a.stats.joined,1);assert.equal(a.stats.point,0);assert.equal(a.stats.content,0);
  assert.match(a.element('rows').innerHTML,/root\.txt/);await a.click('select',{position:'root/root.txt'});
  assert.equal(a.stats.point,1);assert.equal(a.stats.content,0);assert.match(a.element('detail').innerHTML,/Open verified bytes/);
});
test('joined app retains query-qualified uncertain rows without a second local filter',async()=>{
  const a=await app({carriers:true,joined:true});a.element('search').value='no-match';
  a.element('search').listeners.get('input')();await tick();
  assert.match(a.element('rows').innerHTML,/root\.txt/,'server-retained uncertain row must not be filtered again');
});
test('verified tiny PNG has a visible bounded frame and intrinsic dimensions',async()=>{
  const a=await app({carriers:true,image:true});await a.click('select',{position:'root/root.txt'});await a.click('openContent');
  assert.match(a.element('detail').innerHTML,/1 × 1/);assert.match(a.element('detail').innerHTML,/min-height:160px/);
});

test('direct hash edits and browser back/forward re-resolve actual app rows and breadcrumbs',async()=>{
  const a=await app();assert.match(a.element('rows').innerHTML,/root\.txt/);
  await a.hash('#/archive/qa-renamed');assert.match(a.element('rows').innerHTML,/child\.txt/);assert.match(a.element('mounts').innerHTML,/qa-renamed/);
  await a.click('path',{path:'/'});assert.match(a.element('rows').innerHTML,/root\.txt/);
  const pins=a.stats.pin;a.history.back();await tick();assert.match(a.element('rows').innerHTML,/child\.txt/);assert.equal(a.stats.pin,pins+1,'paired popstate/hashchange uses one observation');
  a.history.forward();await tick();assert.match(a.element('rows').innerHTML,/root\.txt/);
});
test('malformed and unavailable routes clear old actionable rows and can recover without reload',async()=>{
  const a=await app();await a.click('connect');assert.equal(a.element('create').disabled,false);
  await a.hash('#/%2f');assert.doesNotMatch(a.element('rows').innerHTML,/root\.txt/);assert.equal(a.element('create').disabled,true);assert.match(a.element('notice').textContent,/INVALID|GRAMMAR/);
  await a.hash('#/missing');assert.doesNotMatch(a.element('rows').innerHTML,/root\.txt/);assert.equal(a.element('create').disabled,true);assert.match(a.element('notice').textContent,/ABSENT/);
  await a.hash('#/');assert.match(a.element('rows').innerHTML,/root\.txt/);assert.equal(a.element('create').disabled,false);
});
test('superseded folder reads cannot render after a newer URL has resolved',async()=>{
  const hold=deferred(),a=await app({holdList:hold});await a.hash('#/slow');
  assert.doesNotMatch(a.element('rows').innerHTML,/root\.txt/);
  await a.hash('#/archive/qa-renamed');assert.match(a.element('rows').innerHTML,/child\.txt/);
  hold.resolve();await tick();assert.match(a.element('rows').innerHTML,/child\.txt/);assert.doesNotMatch(a.element('mounts').innerHTML,/slow/);
});
test('route change during preparation cancels the obsolete dialog before intent authorization',async()=>{
  const hold=deferred(),a=await app({holdPrepare:hold});await a.click('connect');await a.click('create');await a.submit();assert.equal(a.stats.prepare,1);
  await a.hash('#/archive/qa-renamed');hold.resolve();await tick();
  assert.equal(a.stats.authorize,0);assert.equal(a.stats.submit,0);assert.equal(a.element('editor').open,false);assert.match(a.element('rows').innerHTML,/child\.txt/);
});
test('route change after intent authorization still blocks the obsolete outer broadcast',async()=>{
  const hold=deferred(),a=await app({holdSubmit:hold});await a.click('connect');await a.click('create');await a.submit();assert.equal(a.stats.authorize,1);
  await a.hash('#/archive/qa-renamed');hold.resolve();await tick();
  assert.equal(a.stats.broadcast,0);assert.match(a.element('rows').innerHTML,/child\.txt/);
});
test('a cold malformed route refuses and refresh cannot silently select root',async()=>{
  const a=await app({initial:'#/%61rchive'});assert.match(a.element('coverage').textContent,/Integrity/);assert.doesNotMatch(a.element('rows').innerHTML,/root\.txt/);
  await a.click('refresh');assert.doesNotMatch(a.element('rows').innerHTML,/root\.txt/);assert.equal(a.stats.pin,0);
  await a.hash('#/archive/qa-renamed');assert.match(a.element('rows').innerHTML,/child\.txt/);
});
test('late content hydration cannot replace the current route observation',async()=>{
  const hold=deferred(),a=await app({holdRead:hold});await a.hash('#/slow');await a.hash('#/archive/qa-renamed');
  hold.resolve();await tick();assert.match(a.element('rows').innerHTML,/child\.txt/);assert.doesNotMatch(a.element('rows').innerHTML,/slow\.txt/);
});
test('the exact hash guard cancels authorization before the browser delivers hashchange',async()=>{
  const hold=deferred(),a=await app({holdPrepare:hold});await a.click('connect');await a.click('create');await a.submit();
  a.location.hash='#/archive/qa-renamed';hold.resolve();await tick();assert.equal(a.stats.authorize,0);assert.equal(a.stats.broadcast,0);
  assert.match(a.element('rows').innerHTML,/child\.txt/);
});
test('current-route writes still authorize, broadcast and reconcile normally',async()=>{
  const a=await app();await a.click('connect');await a.click('create');await a.submit();
  assert.equal(a.stats.authorize,1);assert.equal(a.stats.broadcast,1);assert.equal(a.element('editor').open,false);assert.match(a.element('notice').textContent,/EFFECTS_VERIFIED/);
});
test('legacy explicit-mount app ignores Directory URL routing without new dependencies',async()=>{
  const a=await app({typed:false}),pins=a.stats.pin;await a.hash('#/archive/qa-renamed');
  assert.equal(a.stats.pin,pins);assert.match(a.element('rows').innerHTML,/root\.txt/);assert.doesNotMatch(a.element('mounts').innerHTML,/qa-renamed/);
  await a.click('connect');await a.click('create');await a.submit();assert.equal(a.stats.broadcast,1);
});
test('rejected superseded same-URL Lens read cannot overwrite newer qualification',async()=>{
  const hold=deferred(),a=await app({holdList:hold});await a.click('connect');await a.hash('#/slow');
  assert.equal(a.element('lens').disabled,false,'Lens is available during external route loading');
  a.element('lens').value='bob';a.element('lens').listeners.get('change')();await tick();
  assert.equal(a.location.hash,'#/slow');assert.match(a.element('rows').innerHTML,/bob\.txt/);
  assert.match(a.element('basis').textContent,/block 9 · admission 11/);assert.match(a.element('coverage').textContent,/Complete folder traversal/);
  assert.equal(a.element('notice').textContent,'');assert.equal(a.element('create').disabled,false);
  const frame=()=>({rows:a.element('rows').innerHTML,basis:a.element('basis').textContent,coverage:a.element('coverage').textContent,
    notice:a.element('notice').textContent,noticeHidden:a.element('notice').hidden,createDisabled:a.element('create').disabled});
  const current=frame();hold.reject(new Error('Old Alice folder RPC failed'));await tick();
  assert.deepEqual(frame(),current,'all visible qualification and controls stay with the newer Bob observation');
});
test('current-generation rejected route read remains visibly unqualified and non-actionable',async()=>{
  const hold=deferred(),a=await app({holdList:hold});await a.click('connect');await a.hash('#/slow');
  hold.reject(new Error('Current folder RPC failed'));await tick();
  assert.match(a.element('notice').textContent,/Path UNKNOWN: Current folder RPC failed/);assert.equal(a.element('notice').hidden,false);
  assert.match(a.element('coverage').textContent,/Partial observation/);assert.equal(a.element('basis').textContent,'No qualified observation yet');
  assert.doesNotMatch(a.element('rows').innerHTML,/root\.txt|slow\.txt/);assert.equal(a.element('create').disabled,true);
  await a.click('create');assert.equal(a.element('editor').open,false);
});
test('carrier list never fetches payload and explicit open downloads exact invalid UTF-8 bytes',async()=>{
  const a=await app({carriers:true});assert.equal(a.stats.content,0);await a.click('select',{position:'root/root.txt'});
  assert.equal(a.stats.content,0);assert.match(a.element('detail').innerHTML,/Open verified bytes/);
  await a.click('openContent');assert.equal(a.stats.content,1);assert.match(a.element('detail').innerHTML,/Verified/);
  await a.click('download');assert.deepEqual(new Uint8Array(await a.stats.blobs.at(-1).arrayBuffer()),Uint8Array.of(0,255,128,65));
});
test('opened encrypted UTF-8 keeps the actual app ordinary editor disabled',async()=>{
  const a=await app({carriers:true,encrypted:true});await a.click('connect');await a.click('select',{position:'root/root.txt'});
  a.element('content-key').value=key;await a.click('openContent');assert.match(a.element('detail').innerHTML,/private note/);
  assert.match(a.element('detail').innerHTML,/data-action="edit"[^>]*data-blocked="true"[^>]*disabled/);
  await a.click('edit');assert.equal(a.element('editor').open,false,'event handler also refuses a bypassed disabled control');
  assert.equal(a.stats.prepare,0);assert.equal(a.stats.authorize,0);assert.equal(a.stats.broadcast,0);
  await a.click('download');assert.equal(await a.stats.blobs.at(-1).text(),'private note','explicit download remains available');
  await a.click('restoreContents',{record:'historical-ciphertext'});assert.equal(a.element('editor').open,true,'ciphertext restore dialog remains available');
});
test('malformed supplied key clears the open lifecycle and a corrected key can retry',async()=>{
  const a=await app({carriers:true,encrypted:true});await a.click('select',{position:'root/root.txt'});
  a.element('content-key').value=key;await a.click('openContent');assert.match(a.element('detail').innerHTML,/private note/);
  a.element('content-key').value='not-hex';await a.click('openContent');
  assert.match(a.element('detail').innerHTML,/Key must be 64 hexadecimal digits/);
  assert.doesNotMatch(a.element('detail').innerHTML,/private note|opening…/);assert.equal(a.stats.content,1);
  assert.match(a.element('detail').innerHTML,/data-action="download"[^>]*data-blocked="true"/);
  a.element('content-key').value=key;await a.click('openContent');assert.equal(a.stats.content,2);assert.match(a.element('detail').innerHTML,/private note/);
});
test('late carrier success or rejection cannot overwrite a new route or selection',async()=>{
  for(const reject of [false,true]){
    const hold=deferred(),a=await app({carriers:true,holdContent:hold});await a.click('select',{position:'root/root.txt'});await a.click('openContent');assert.equal(a.stats.content,1);
    await a.hash('#/archive/qa-renamed');await a.click('select',{position:'renamed/child.txt'});
    const frame=a.element('detail').innerHTML;if(reject)hold.reject(Error('old content failed'));else hold.resolve();await tick();
    assert.equal(a.element('detail').innerHTML,frame);assert.doesNotMatch(a.element('notice').textContent,/old content failed/);assert.equal(a.stats.blobs.length,0);
  }
});
test('explicit external upload carries more than Core inline limit without lossy text conversion',async()=>{
  const a=await app({carriers:true});await a.click('connect');await a.click('create');
  const bytes=new Uint8Array(9000);bytes[8193]=255;a.element('field-upload').files=[{size:bytes.length,arrayBuffer:async()=>bytes.buffer}];
  await a.submit({carriage:'external'});assert.equal(a.stats.uploads.length,1);assert.deepEqual(a.stats.uploads[0],bytes);
  assert.equal(a.stats.prepared[0].content.descriptor.carrier,1);assert.equal(a.stats.prepared[0].content.descriptor.length,9000);assert.equal(a.stats.broadcast,1);
});
test('same-route selection or Lens change cancels late carrier results and releases an old preview URL',async()=>{
  for(const change of ['selection','lens']){
    const hold=deferred(),a=await app({carriers:true,holdContent:hold});await a.click('select',{position:'root/root.txt'});await a.click('openContent');
    if(change==='selection')await a.click('select',{position:'root/second.txt'});
    else{a.element('lens').value='bob';a.element('lens').listeners.get('change')();await tick();}
    const frame=a.element('detail').innerHTML;hold.resolve();await tick();assert.equal(a.element('detail').innerHTML,frame);assert.equal(a.stats.blobs.length,0);
  }
  const a=await app({carriers:true,image:true});await a.click('select',{position:'root/root.txt'});await a.click('openContent');assert.equal(a.stats.blobs.length,1);
  await a.click('select',{position:'root/second.txt'});assert.deepEqual(a.stats.revoked,['blob:test']);assert.doesNotMatch(a.element('detail').innerHTML,/src="blob:test"/);
});
