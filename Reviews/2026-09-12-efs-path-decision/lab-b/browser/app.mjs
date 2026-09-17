import * as ethers from '/vendor/ethers.mjs';
import {createCompactSdk,normalizeTagAssessment} from './compact-sdk.mjs';
import {folderState,filterRows,canOpen,costPresentation,renderCostTable,tagLabel} from './files-view.mjs';
import {resolveEconomics} from './fee-model.mjs';
import {journalPrefix} from './wallet-session.mjs';
import {hydrateExactStances} from './compact-stance.mjs';

const $ = id => document.getElementById(id);
$('filter-scope').insertAdjacentHTML('beforebegin','<select id="filter-mode" aria-label="Tag filter mode"><option value="include">With tag</option><option value="exclude">Without tag</option></select>');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short = value => value ? `${String(value).slice(0,8)}…${String(value).slice(-5)}` : '—';
const json = value => JSON.stringify(value,null,2);
const pretty = value => Number(value).toLocaleString('en-US');
const state = {config:null,sdk:null,folder:null,context:null,page:null,rows:[],selected:null,busy:false,
  keys:null,wallet:null,filterConcept:'',history:{},removed:null,entries:[],economics:null,editedEconomics:false,
  rpc:{calls:0,bytes:0,ms:0,errors:0},operation:null,prefix:null,storageIssue:null,paths:null,segments:[],route:null,
  navigation:null,readGeneration:0,routeLoading:false,contentRequest:null,contentResult:null,previewUrl:null};
const hasCarriers=()=>!!state.config?.manifest.contentProfile;
const hasJoined=()=>!!state.config?.manifest.contracts.joined;
const hasStances=()=>state.sdk?.exactStances===true;
let readTransport;
// The already-running older demo only serves its original asset allowlist.
// Keep it usable without restarting its chain when this shared UI is refreshed.
function legacyReadTransport(url){
  let id=0;const metrics={httpRequests:0,httpBatches:0,responseBytes:0};
  const rpc=async(method,params=[])=>{
    const requestId=++id;metrics.httpRequests++;
    const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:requestId,method,params}),signal:AbortSignal.timeout(20000)});
    const raw=await response.text();metrics.responseBytes+=new TextEncoder().encode(raw).length;
    if(!response.ok)throw Error(`RPC HTTP ${response.status}`);
    const reply=JSON.parse(raw);if(reply.id!==requestId)throw Error('RPC response ID mismatch');
    if(reply.error)throw Object.assign(Error(reply.error.message),{rpcError:reply.error});
    if(!Object.hasOwn(reply,'result'))throw Error('RPC response has no result');return reply.result;
  };
  rpc.read=rpc;rpc.metrics=metrics;return rpc;
}
const actionLabel=operation=>({createDirectory:'create directory',remove:'hide placement',releasePlacement:'release my placement',restorePlacement:'restore placement',restoreContents:'restore contents',addTag:'add legacy tag',removeTag:'remove legacy tag',assertStance:'assert tag',denyStance:'deny tag',retractToSilent:'retract to silence'}[operation]??operation);
function clearContent(){state.contentRequest?.abort.abort();state.contentRequest=null;state.contentResult=null;state.previewSize=null;if(state.previewUrl)URL.revokeObjectURL(state.previewUrl);state.previewUrl=null;}
function conceptFor(label){return /^0x[0-9a-f]{64}$/i.test(label)?label:hasCarriers()?state.sdk.conceptId({namespace:state.config.manifest.folder,label}):ethers.id(label);}
function verifiedBytes(row=selectedRow()){
  if(!row)return null;
  if(row.point?.value?.revision?.profile==='live-quote-v1')return null;
  if(row.point?.value?.revision?.profile==='carrier-v1')return state.contentResult?.state==='AVAILABLE_VERIFIED'&&state.contentResult.recordId===row.point.value.revision.recordId?state.contentResult.bytes:null;
  return canOpen(row.point)?ethers.getBytes(row.point.value.revision.document):null;
}
function contentMessage(result){return result?.reason==='KEY_FORMAT'?'Key must be 64 hexadecimal digits':result?.reason==='AUTHENTICATION_FAILED'?'The key could not authenticate this file':({AVAILABLE_VERIFIED:'Verified file bytes',UNAVAILABLE:'File bytes are unavailable',CORRUPT:'File integrity check failed',OPAQUE:'Encrypted file — key needed',UNSUPPORTED:'This content format is not supported'}[result?.state]??'File bytes have not been opened');}
async function openContent(){
  clearContent();const row=selectedRow(),navigation=state.navigation,generation=state.readGeneration,position=state.selected,record=row?.point?.value?.revision?.recordId;
  if(!record)return;
  const request={abort:new AbortController()};state.contentRequest=request;
  const current=()=>routeCurrent(navigation)&&generation===state.readGeneration&&position===state.selected&&request===state.contentRequest;
  const keyText=$('content-key')?.value.trim();
  const useExternal=$('allow-carrier')?.checked===true;
  if(row.point.value.revision.content?.carrier>0&&!useExternal){
    state.contentRequest=null;state.contentResult={state:'FETCH_PERMISSION_REQUIRED'};renderDetail();controls();return;
  }
  renderDetail();controls();
  try {
    if(keyText&&!/^(?:0x)?[0-9a-f]{64}$/i.test(keyText))throw Error('KEY_FORMAT');
    const key=keyText?ethers.getBytes('0x'+keyText.replace(/^0x/i,'')):undefined;
    const external=row.point.value.revision.content?.carrier>=2;
    const loader=useExternal?(external&&state.externalContent
      ?state.externalContent.createExternalLoader({gateways:state.config.manifest.externalGateways})
      :state.config.carrierOrigin?state.paths.content.createRawTransport({origin:state.config.carrierOrigin,maxBytes:1048576,timeoutMs:5000}):undefined):undefined;
    const result=await state.sdk.readContent({file:row.file,record,authors:authors(),context:state.context,key,signal:request.abort.signal,
      ...(loader?{loadCarrier:loader}:{}),...(external?{maxBytes:state.externalContent?.MAX_EXTERNAL_BYTES??1048576}:{})});
    if(!current())return;state.contentResult=result;
    if(result.state==='AVAILABLE_VERIFIED'){
      try{const preview=await state.paths.content.verifyRaster(result.bytes,{signal:request.abort.signal});if(!current())return;state.previewUrl=URL.createObjectURL(preview.blob);state.previewSize={width:preview.width,height:preview.height};}
      catch{if(!current())return;} // Unsupported/decode-failed images remain exact inert downloads.
    }
  }catch(error){if(current())state.contentResult={state:'UNAVAILABLE',reason:error.message};}
  finally{if(current()){state.contentRequest=null;renderDetail();controls();}}
}

function notice(message,kind='') {
  $('notice').textContent=message; $('notice').className=`notice ${kind}`; $('notice').hidden=!message;
}
function authors() {
  if($('lens').value==='custom')return state.customAuthors??[];
  const {alice,bob}=state.config.manifest.authors;
  return $('lens').value === 'bob' ? [bob,alice] : [alice,bob];
}
function authorName(address) {
  return Object.entries(state.config.manifest.authors).find(([,v])=>v.toLowerCase()===address?.toLowerCase()
    ||(state.paths&&ethers.zeroPadValue(v,32).toLowerCase()===address?.toLowerCase()))?.[0] ?? short(address);
}
function selectedRow() { return state.rows.find(row=>row.position===state.selected)??(state.detachedRow?.position===state.selected?state.detachedRow:null); }
function routeCurrent(navigation) { return !state.paths || (navigation===state.navigation && navigation?.hash===location.hash); }
function checkRoute(navigation) {
  if(!routeCurrent(navigation)) throw Object.assign(new Error('Route changed; obsolete work cancelled.'),{code:'ROUTE_CHANGED'});
}
function writesAllowed() { return !!state.wallet && !state.busy && $('lens').value!=='conflict' && (!state.paths||(routeCurrent(state.navigation)&&state.navigation.ready&&!!state.folder)); }
function readStored(key,fallback) {
  const raw=localStorage.getItem(state.prefix+key);
  return raw === null ? fallback : JSON.parse(raw);
}
function store(key,value) { localStorage.setItem(state.prefix+key,JSON.stringify(value)); }
function journalEntries() {
  try {
    return Object.keys(localStorage).filter(key=>key.startsWith(state.prefix+'journal:'))
      .flatMap(key=>{try {const entry=JSON.parse(localStorage.getItem(key));if(entry?.plan&&entry.id)return [entry];throw new Error('Invalid journal shape');} catch {state.storageIssue='A local journal entry could not be parsed; it has not been deleted or re-signed.';return [];}})
      .sort((a,b)=>(b.localCreatedAt??0)-(a.localCreatedAt??0));
  } catch {state.storageIssue='Local storage is unavailable. Guest reads still work; writes require a durable journal.';return [];}
}
async function rpc(method,params=[]) {
  const start=performance.now();state.rpc.calls++;
  try {
    const pinned=['eth_call','eth_getCode'].includes(method)&&params[1]?.requireCanonical===true&&params[1]?.blockHash;
    return await (pinned?readTransport.read(method,params):readTransport(method,params));
  } catch(error) { state.rpc.errors++; throw error; }
  finally { state.rpc.ms+=performance.now()-start;state.rpc.bytes=readTransport.metrics.responseBytes; }
}
rpc.read=rpc;
async function run(task) {
  if(state.busy) return;
  const navigation=state.navigation;
  state.busy=true; controls();
  try { await task(navigation); }
  catch(error) { if(error.code!=='ROUTE_CHANGED'&&(routeCurrent(navigation)||(!navigation&&!state.navigation))) notice(error.message ?? String(error),'error'); }
  finally { state.busy=false; render();flushJoinedQuery(); }
}
const joinedQueryKey=()=>JSON.stringify([$('search').value,$('filter-scope').value,$('filter-mode').value,state.filterConcept,$('lens').value]);
function flushJoinedQuery(){
  if(!state.queryRefreshPending||state.busy)return;
  state.queryRefreshPending=false;run(()=>refresh());
}
function refreshJoinedQuery(){
  state.queryRefreshPending=true;++state.readGeneration;flushJoinedQuery();
}
function controls() {
  document.querySelectorAll('[data-action]').forEach(button=>{ button.disabled=state.busy || state.routeLoading || !state.sdk || button.dataset.blocked==='true'; });
  $('create').disabled=!writesAllowed(); $('restore').disabled=!writesAllowed() || !state.removed;
  if($('release-placement')){
    $('release-placement').hidden=!state.context?.bindingLifecycleProfile;
    $('release-placement').disabled=!writesAllowed()||!state.context?.bindingLifecycleProfile;
  }
  $('signer').disabled=!state.keys || state.busy; $('lens').disabled=state.busy || !state.sdk;
  $('connect').hidden=!!state.wallet||state.config?.demoSigners===false; $('disconnect').hidden=!state.wallet;
  $('signer').hidden=state.config?.demoSigners===false;
  $('connect-wallet').hidden=!!state.wallet;
  if($('test-funds')){$('test-funds').disabled=!state.wallet?.external||state.busy;$('test-funds').hidden=state.config?.localFaucet===false;}
  if($('add-network'))$('add-network').disabled=state.busy;
  $('signer-status').textContent=state.wallet ? state.wallet.external?`${short(state.wallet.address)} · wallet`:`${$('signer').value} · disposable test signer` : 'Guest · read only';
  $('editor-submit').disabled=state.busy || state.routeLoading || !!state.operation?.pending;
  document.querySelectorAll('[data-write]').forEach(button=>{button.disabled=!writesAllowed() || button.dataset.blocked==='true';});
}
function remember(point) {
  const revisions=point?.value?.revision ? [point.value.revision] : [];
  for(const candidate of point?.value?.candidates??[]) if(candidate.revision) revisions.push(candidate.revision);
  for(const revision of revisions) {
    const list=state.history[revision.file] ?? [];
    if(!list.some(item=>item.recordId===revision.recordId)) {
      state.history[revision.file]=[{recordId:revision.recordId,firstAdmission:revision.firstAdmission},...list].slice(0,40);
    }
  }
  // These are optional local navigation hints, never the source of names or bytes.
  try { store('witnessed',state.history); } catch { /* Reads still work without local history storage. */ }
}
async function refresh(continuing=false) {
  if(state.paths&&!routeCurrent(state.navigation)) return handleRoute();
  if(state.navigation?.invalid)throw state.navigation.invalid;
  const navigation=state.navigation,generation=++state.readGeneration,queryKey=hasJoined()?joinedQueryKey():null;
  clearContent();
  const check=()=>{checkRoute(navigation);if(generation!==state.readGeneration||(queryKey!==null&&queryKey!==joinedQueryKey()))throw Object.assign(new Error('Observation superseded.'),{code:'ROUTE_CHANGED'});};
  const lens=authors(),policy=$('lens').value==='conflict'?'no-tiebreak':'ordered';
  let context=state.context,page=state.page,folder=state.folder,route=state.route;
  if(state.paths){state.routeLoading=true;navigation.ready=false;}
  notice(continuing?'Continuing the same pinned folder traversal…':'Reading a fresh pinned observation…');
  try {
    if(!continuing) {
      state.context=null; state.page=null; state.rows=[]; render(); context=await state.sdk.pin();check();
      if(state.paths){
        const fullSegments=state.paths.decodePath(navigation.hash?navigation.hash.slice(1):'/');
        route=await state.paths.resolvePath({sdk:state.sdk,root:state.config.manifest.folder,segments:fullSegments,authors:lens,context,budget:64});check();
        state.segments=fullSegments;state.detachedRow=null;
        if(route.status!=='PRESENT'){
          state.folder=null;state.selected=null;state.route=route;state.context=context;
          state.page={basis:context,knowledge:route.status==='PRESENT'?'INVALID':route.status,coverage:'PARTIAL',value:[],nameCoverage:'PARTIAL'};
          notice(`Path ${state.paths.encodePath(state.segments)}: ${route.status}. Use a breadcrumb to return; no empty folder is inferred.`,'warning');return;
        }
        if(route.kind==='file'){
          state.fileRoute={file:route.target,name:state.segments.at(-1),edge:route.trail.at(-1)};
          folder=route.trail.at(-1).from;state.segments=state.segments.slice(0,-1);
        }else{state.fileRoute=null;folder=route.target;}
      }
    }
    let continuation=continuing ? page?.continuation : undefined;
    if(hasJoined()){
      const concept=state.filterConcept?conceptFor(state.filterConcept):ethers.ZeroHash;
      const joinedPage=await state.sdk.listFolderPage({folder,authors:lens,budget:32,context,continuation,concept:hasStances()?ethers.ZeroHash:concept,policy,
        tagScope:!hasStances()&&state.filterConcept&&$('filter-mode').value!=='exclude'?$('filter-scope').value:'none',search:$('search').value});check();
      const fresh=[];
      for(const row of joinedPage.pageRows){fresh.push(hasStances()&&state.filterConcept?await hydrateExactStances({sdk:state.sdk,row,concept,authors:lens,context}):{...row});check();}
      const rows=continuing?[...state.rows,...fresh]:fresh;
      page={...joinedPage,value:rows,coverage:joinedPage.queryCoverage,knowledge:joinedPage.queryKnowledge,tagCoverageScope:'ACCUMULATED_PAGES',
        ...Object.fromEntries(['nameCoverage','kindCoverage','headerCoverage','tagCoverage'].map(key=>[key,continuing&&state.page?.[key]==='PARTIAL'?'PARTIAL':joinedPage[key]]))};
      if(hasStances()&&state.filterConcept){page.tagCoverage=rows.every(r=>[r.point?.value?.fileTag,r.point?.value?.revisionTag].every(t=>t?.assessment&&t.assessment!=='UNKNOWN'))?'COMPLETE':'PARTIAL';page.exactStanceScope='ENUMERATED_FOLDER_ROWS_ONLY';}
      Object.assign(state,{rows,context,page,folder,route});if(state.paths)navigation.ready=true;
      if(state.fileRoute){
        const edge=state.fileRoute.edge;
        state.detachedRow={...edge,file:state.fileRoute.file,folder:edge.from,kind:'file'};
        state.selected=edge.position;
      }
      if(!selectedRow())state.selected=null;notice('');
      if(selectedRow()?.kind==='file')await openSelected();
      return;
    }
    // Finite traversal; any retained continuation remains visibly partial.
    for(let pages=0;pages<32;pages++) {
      page=await state.sdk.listFolder({folder,authors:lens,budget:64,context,continuation});check();
      continuation=page.continuation;
      if(!continuation) break;
    }
    const concept=state.filterConcept ? conceptFor(state.filterConcept) : ethers.ZeroHash;
    const rows=[];
    for(const row of page.value) {
      let point;
      if(state.paths&&row.kind!=='file'){
      const tag=hasCarriers()&&row.kind==='directory'&&state.filterConcept?await state.sdk[hasStances()?'readStance':'readTag']({subject:row.file,scope:'directory',target:row.file,concept,authors:lens,context}):null;check();
        rows.push({...row,point:{knowledge:row.knowledge,coverage:row.knowledge==='PRESENT'?(tag?.coverage??'COMPLETE'):'PARTIAL',value:{fileTag:tag?.value??normalizeTagAssessment({subject:row.file,concept}),revisionTag:normalizeTagAssessment({concept,assessment:row.kind==='directory'?'NOT_APPLICABLE':'UNKNOWN'})},reason:row.kind==='directory'?'Directory · no File HEAD required':'Target kind unavailable'}});continue;}
      try { point=await state.sdk.readFile({file:row.file,authors:lens,concept:hasStances()?ethers.ZeroHash:concept,context,policy});check(); remember(point); }
      catch(error) { check();point={knowledge:'UNKNOWN',coverage:'PARTIAL',reason:error.message,value:{file:row.file}}; }
      rows.push(hasStances()&&state.filterConcept?await hydrateExactStances({sdk:state.sdk,row:{...row,point},concept,authors:lens,context}):{...row,point});check();
    }
    check();Object.assign(state,{rows,context,page,folder,route});
    if(state.paths)navigation.ready=true;
    if(state.fileRoute){state.selected=state.rows.find(row=>row.file===state.fileRoute.file&&row.name?.value===state.fileRoute.name)?.position??null;}
    if(!selectedRow()) state.selected=null;
    notice('');
  } catch(error) {
    // Rejected awaits must cross the same generation gate as successful reads
    // before run/handleRoute can publish their error into the current view.
    check();throw error;
  } finally { if(routeCurrent(navigation)&&generation===state.readGeneration){state.routeLoading=false;render();} }
}

// URL changes bypass the action lock: old bounded RPCs may finish, but their
// generation and exact hash can no longer render or authorize this route.
function handleRoute() {
  if(!state.paths||!state.sdk)return;
  if(routeCurrent(state.navigation))return state.navigation.pending;
  const navigation={hash:location.hash,ready:false};state.navigation=navigation;
  clearContent();
  Object.assign(state,{folder:null,context:null,page:null,rows:[],selected:null,detachedRow:null,fileRoute:null,route:null,segments:[],operation:null,routeLoading:false});
  $('editor').close();
  const refuse=error=>{
    if(!routeCurrent(navigation)||error.code==='ROUTE_CHANGED')return;
    state.page={knowledge:error.code==='INVALID_PATH'?'INVALID':'UNKNOWN',coverage:'PARTIAL',value:[],nameCoverage:'PARTIAL'};
    notice(`Path ${state.page.knowledge}: ${error.message}. No qualified directory or empty folder is inferred.`,'warning');render();
  };
  try { state.segments=state.paths.decodePath(navigation.hash?navigation.hash.slice(1):'/'); }
  catch(error){error.code='INVALID_PATH';navigation.invalid=error;refuse(error);return;}
  navigation.pending=refresh().catch(refuse);return navigation.pending;
}
function renderRows() {
  const view=folderState(state.page);
  const exclude=$('filter-mode').value==='exclude';
  const filtered=hasJoined()&&!hasStances()&&!exclude?{rows:state.rows,uncertain:state.rows.filter(row=>row.match==='UNKNOWN').length}
    :filterRows(state.rows,{search:$('search').value,tag:!!state.filterConcept,scope:$('filter-scope').value,exclude});
  $('coverage').className=`coverage ${view.kind!=='complete' && view.kind!=='empty' ? 'warning':''}`;
  $('coverage').textContent=state.busy && !state.page ? 'Reading qualified folder membership…'
    : `${view.label}${state.page ? ` · ${filtered.rows.length} shown / ${state.rows.length} observed rows`:''}${filtered.uncertain ? ` · ${filtered.uncertain} uncertain matches retained`:''}${state.filterConcept ? ` · ${exclude?'without':'with'} tag “${state.filterConcept}” (${ $('filter-scope').selectedOptions[0].textContent})`:''}${$('lens').value==='conflict'?' · HEAD conflict review; Alice-first placements':''}`;
  $('rows').innerHTML=filtered.rows.map(row=>{
    const point=row.point, revision=point?.value?.revision;
    const name=row.name?.knowledge==='PRESENT'?row.name.value:`Name ${row.name?.knowledge?.toLowerCase()??'unavailable'} · ${short(row.file)}`;
    const summary=row.kind==='directory'?'Double-click to open':revision?.assurance?'Open to read':revision?.profile==='live-quote-v1'?'Live contract value':revision?`${pretty(revision.content?.length??ethers.getBytes(revision.document??'0x').length)} bytes`:point?.reason??'No selected bytes';
    return `<button class="file-row ${state.selected===row.position?'active':''}" data-action="select" data-position="${escape(row.position)}" aria-pressed="${state.selected===row.position}"><span class="file-icon" aria-hidden="true">${row.kind==='directory'?'▱':'▤'}</span><span class="row-main"><span class="filename">${escape(name)}</span><span class="row-subtitle">${row.kind==='directory'?'Directory':row.kind==='unknown'?'Unknown kind':'File'} ${escape(short(row.file))}</span></span><span class="row-state">${revision?escape(authorName(point.value.selection.author)):''}<span class="row-subtitle">${escape(summary)}</span></span></button>`;
  }).join('') || `<div class="empty-list">${state.busy&&!state.page?'Reading from the Ledger…':escape(view.kind==='empty'?view.label:state.page?.coverage==='COMPLETE' && view.kind==='complete' ? 'No matches in this complete observed folder.': 'No rows to show yet. This is not evidence of an empty folder.')}</div>`;
  $('continue').hidden=!state.page?.continuation;
  $('basis').textContent=state.page?.basis ? `RPC-observed · block ${state.page.basis.blockNumber} · admission ${state.page.basis.admission} · ${short(state.page.basis.blockHash)}` : 'No qualified observation yet';
}
function textPreview(documentBytes) {
  try { return {text:ethers.toUtf8String(documentBytes),utf8:true}; }
  catch { return {text:'These verified bytes are not valid UTF-8. Download preserves the exact bytes; no media type is asserted.',utf8:false}; }
}
function renderDetailBase() {
  const row=selectedRow();
  if(!row) { $('detail').innerHTML='<div class="welcome"><span class="empty-icon">▤</span><h2>Open a file</h2><p>Choose a row to inspect its selected contents, revisions, and exact tag subjects.</p></div>'; return; }
  const point=row.point, revision=point?.value?.revision, open=canOpen(point);
  const name=row.name?.knowledge==='PRESENT'?row.name.value:'Name unavailable';
  const preview=open&&revision?.profile!=='carrier-v1'&&revision?.profile!=='live-quote-v1'?textPreview(revision.document):null;
  const knownName=row.name?.knowledge==='PRESENT';
  const action=(id,label,blocked=false,extra='')=>`<button data-action="${id}" data-write data-blocked="${blocked}" ${blocked?'disabled':''} ${extra}>${id==='remove'?'Hide placement':label}</button>`;
  if(state.paths&&row.kind!=='file'){
    $('detail').innerHTML=`<h2>${escape(name)}</h2><p>${row.kind==='directory'?'Typed Directory · stable descriptor identity. No File HEAD is required.':'Target kind is unavailable or invalid. Membership has not been discarded.'}</p>
      <div class="file-actions">${row.kind==='directory'&&knownName?'<button data-action="enter">Open directory →</button>':''}${action('rename','Rename',!knownName||row.kind!=='directory')}${action('move','Move',!knownName||row.kind!=='directory')}${action('remove','Remove placement',!knownName||row.kind!=='directory')}</div>
      <p>Placements are links, not ownership. Moving or removing one never rewrites or destroys descendants. A Lens may contain aliases or cycles.</p>${hasCarriers()&&row.kind==='directory'?tagControls(point,true):''}<details><summary>Descriptor and selected edge</summary><pre>${escape(json(row))}</pre></details>`;return;
  }
  if(revision?.assurance){$('detail').innerHTML=`<h2>${escape(name)}</h2><p>Selected revision header · content bytes not fetched. ${escape(revision.knowledge??'PRESENT')}.</p><button data-action="openSelected">Open selected file</button><details><summary>Header and basis details</summary><pre>${escape(json(point))}</pre></details>`;return;}
  if(revision?.profile==='live-quote-v1'){
    const value=state.contentResult;
    $('detail').innerHTML=`<h2>${escape(name)}</h2><p>Live contract-backed file</p>${value?.state==='LIVE_SHAPE_OBSERVED'?`<pre class="document">Value: ${escape(value.value)}\nFlag: ${escape(value.flag)}\nObserved at block ${escape(value.providerObservation.blockNumber)}</pre>`:`<p>${escape(value?.reason??'Opening live value…')}</p>`}<p>This reads the provider’s state; it is not a saved file revision.</p><div class="file-actions"><button data-action="openContent">Read at this block</button><button data-action="refresh">Refresh to latest block</button>${action('rename','Rename',!knownName)}${action('remove','Remove placement',!knownName)}</div><details><summary>Source contract and observation</summary><pre>${escape(json({descriptor:revision.content,observation:value}))}</pre></details>`;return;
  }
  if(revision?.profile==='carrier-v1'){
    const bytes=verifiedBytes(row),text=bytes?textPreview(bytes):null,d=revision.content,content=state.contentResult;
    $('detail').innerHTML=`<h2>${escape(name)}</h2><p>${escape(content?.state==='FETCH_PERMISSION_REQUIRED'?'Not downloaded yet — allow a gateway fetch below.':contentMessage(content))}${state.contentRequest?' · opening…':''}</p>
      <div class="file-actions"><button data-action="openContent">Open verified bytes</button><button data-action="download" data-blocked="${!bytes}" ${bytes?'':'disabled'}>↓ Download bytes</button>${action('edit','Edit / replace contents',d.encryption===1)}${action('rename','Rename',!knownName)}${action('move','Move',!knownName)}${action('remove','Remove placement',!knownName)}</div>
      ${d.encryption?'<label>Supplied key (64 hexadecimal digits)<input id="content-key" type="password" autocomplete="off"></label><p>Key stays in this open operation; it is not saved to the journal. Encrypted files are read-only in this text editor; opening or downloading does not publish plaintext.</p>':''}
      ${d.carrier===1?`<label><input id="allow-carrier" type="checkbox"> Allow this open to fetch from ${escape(state.config.carrierOrigin??'no configured transport')}</label><p>Explicit raw SHA-256 transport; no credentials or redirects, 1 MiB / 5-second cap.</p>`:''}
      ${d.carrier>=2?`<p><strong>${d.carrier===2?'Arweave':'IPFS'}</strong> · ${pretty(d.length)} bytes</p><code style="overflow-wrap:anywhere">${escape(d.locator)}</code><p><label><input id="allow-carrier" type="checkbox"> Allow this open to fetch through ${escape((state.config.manifest.externalGateways?.[d.carrier===2?'ar':'ipfs']??[]).join(', ')||'no configured gateway')}</label></p><p>Downloads are checked against the EFS publisher’s saved fingerprint. This is not an independent proof of Arweave inclusion or the IPFS DAG, or permanent availability. These replaceable HTTPS providers (including their content-isolation subdomains) can see which content you request. No credentials or redirects; 16 MiB output cap and 15-second timeout per configured gateway.</p>`:''}
      ${state.previewUrl?`<figure style="margin:12px 0"><div style="min-height:160px;max-height:420px;width:100%;display:grid;place-items:center;background:repeating-conic-gradient(var(--preview-a) 0% 25%,var(--preview-b) 0% 50%) 50% / 20px 20px;border:1px solid var(--line);overflow:hidden"><img class="verified-image" src="${escape(state.previewUrl)}" alt="Verified static PNG preview" style="width:${Math.max(64,Math.min(640,state.previewSize.width))}px;max-width:100%;max-height:420px;object-fit:contain;image-rendering:pixelated"></div><figcaption>${state.previewSize.width} × ${state.previewSize.height} intrinsic pixels · bounded inert preview</figcaption></figure>`:''}
      ${bytes?`<p>${pretty(bytes.length)} verified bytes. ${text.utf8?'UTF-8 interpretation below.':'Binary bytes; download preserves them exactly.'}</p>${text.utf8?`<pre class="document">${escape(text.text)}</pre>`:''}`:''}
      ${tagControls(point)}<p>Verified PNG/JPEG can be previewed. Other bytes can be downloaded; HTML and SVG are never executed.</p>
      <details><summary>Content, revision and verification details</summary><pre>${escape(json({revision,content:content?{...content,bytes:undefined}:null}))}</pre></details>
      <details><summary>Locally witnessed revisions</summary>${(state.history[row.file]??[]).map(item=>`<p>${escape(short(item.recordId))} ${action('restoreContents','Restore these contents',false,`data-record="${escape(item.recordId)}"`)}</p>`).join('')}${action('restoreContents','Use a historical Record ID…')}</details>`;return;
  }
  const candidates=(point?.value?.candidates??[]).map(candidate=>`<div class="conflict-card"><strong>${escape(authorName(candidate.selection.author))}</strong> · ${escape(short(candidate.revision?.recordId??candidate.selection.target))}<pre>${escape(candidate.revision?.profile==='carrier-v1'?'Carrier revision known; choose an ordered Lens to open and verify its bytes.':candidate.revision?textPreview(candidate.revision.document).text:`${candidate.knowledge??'UNKNOWN'} — candidate bytes unavailable; conflict retained.`)}</pre></div>`).join('');
  const history=state.history[row.file]??[];
  $('detail').innerHTML=`<h2 class="file-title">${escape(name)}</h2><div class="meta-line"><span class="badge ${open?'':'warning'}">${escape(point?.knowledge??'UNKNOWN')}</span><span>${open?`${escape(authorName(point.value.selection.author))} selected · revision ${escape(short(revision.recordId))}`:escape(point?.reason??'No single selected revision')}</span></div>
    <div class="file-actions">${action('edit','Edit contents',!open||!preview.utf8)}${action('rename','Rename',!knownName)}${action('move','Move',!knownName)}<button data-action="download" data-blocked="${!open}" ${open?'':'disabled'}>↓ Download bytes</button>${action('remove','Remove placement',!knownName,'class="danger"')}</div>
    ${open?`<div class="content-label"><span>${preview.utf8?'Plain-text preview · UTF-8 interpretation':'Verified bytes · no MIME asserted'}</span><span>${pretty(ethers.getBytes(revision.document).length)} bytes</span></div><pre class="document">${escape(preview.text)}</pre>`:`<p class="conflict-note">${point?.knowledge==='CONFLICT'?'Multiple authors have live HEADs. Choose an ordered Lens to select one before editing.':'Membership is retained here. Unavailable or invalid selected bytes are not opened or downloaded.'}</p>${candidates}`}
    ${hasStances()?tagControls(point):`<section class="file-tags"><strong>Legacy tags have a subject</strong><div class="tag-editor"><input id="tag-concept" aria-label="Tag concept" placeholder="Concept, e.g. important" value="${escape(state.filterConcept)}"><select id="tag-scope" aria-label="Tag subject"><option value="file">File identity</option><option value="revision">Selected revision</option></select>${action('addTag','Add',false)}${action('removeTag','Remove',false)}</div><p class="tag-state">${state.filterConcept?`Observed “${escape(state.filterConcept)}”: File ${tagLabel(point?.value?.fileTag)} · selected revision ${tagLabel(point?.value?.revisionTag)}`:'Enter a legacy concept to add or remove. Apply the same concept above to inspect its presence.'}</p></section>`}
    <details class="revision-history"><summary>Locally witnessed revisions (${history.length})</summary><p>Not a complete history. Restoring contents publishes a fresh child revision; it does not rewind HEAD.</p>${history.map(item=>`<div class="history-row"><code title="${escape(item.recordId)}">${escape(short(item.recordId))} · admission ${escape(item.firstAdmission)}</code>${action('restoreContents','Restore these contents',!open,`data-record="${escape(item.recordId)}"`)}</div>`).join('')}${action('restoreContents','Use a historical Record ID…',!open)}</details>
    <details class="technical"><summary>Record & observation details</summary><pre>${escape(json({file:row.file,placement:{folder:row.folder,position:row.position,role:row.role,name:row.name},point}))}</pre></details>`;
}
function renderDetail(){
  renderDetailBase();const row=selectedRow();if(!state.paths||!row||!['file','directory'].includes(row.kind))return;
  const tagSection=$('detail').querySelector('.file-tags');
  if(tagSection)tagSection.insertAdjacentHTML('beforeend',hasStances()?'<p>Exact stance filtering covers observed folder rows only. Legacy seeded labels are separate, not migrated.</p>':'<p class="warning">Legacy generic tag bindings only. This deployment does not authenticate an exact stance profile.</p>');
  const revision=row.point?.value?.revision,history=state.chainHistory?.file===row.file?state.chainHistory:null;
  $('detail').insertAdjacentHTML('beforeend',`<section class="file-actions"><button data-action="linkPlacement" data-write>Link another name</button>${row.kind==='file'&&revision?.profile!=='live-quote-v1'?'<button data-action="copyFile" data-write>Copy to new File</button>':''}${row.kind==='directory'?'<button data-action="previewRelease" data-write>Preview recursive release of my placements</button>':''}</section>
    ${row.kind==='file'?`<section class="revision-history"><h3>Chain-derived selected ancestry</h3><button data-action="chainHistory">Read history at a fresh basis</button>${history?`<p>${escape(history.result.knowledge)} / ${escape(history.result.coverage)} · pinned block ${escape(history.context.blockNumber)}. Selected parent chain only, not all branches. Restore creates a new successor.</p>${history.result.value.map(r=>`<p><code>${escape(short(r.recordId))}</code> · admission ${escape(r.firstAdmission)} <button data-action="restoreContents" data-record="${escape(r.recordId)}" data-write>Restore as new revision</button></p>`).join('')}${history.result.continuation?'<button data-action="continueHistory">Continue pinned history</button>':''}`:''}</section>`:''}`);
}
function renderRelease(){
  const box=$('workflow-release'),preview=state.releasePreview,result=state.releaseResult;
  if(!preview){box.hidden=true;return;}box.hidden=false;
  const pending=result?.pending??preview.rows;
  box.innerHTML=`<h3>Release my reachable placements · ${escape(result?.status??preview.coverage)}</h3><p>${escape(preview.retained)}</p><p>Sequential guarded transactions, not one atomic deletion. Root placement is last. ${escape(result?.reason??preview.reason??'')}</p><p>${result?.completed.length??0} completed · ${pending.length} pending</p><ol>${pending.map(r=>`<li>${escape(r.name)} · ${escape(r.kind)} · folder ${escape(short(r.folder))}</li>`).join('')}</ol>${!result&&preview.coverage==='COMPLETE'?'<button data-action="executeRelease" data-write>Confirm and release these placements</button>':''}${result?`<details><summary>Per-transaction results and unprocessed rows</summary><pre>${escape(json(result))}</pre></details>`:''}`;
}
function tagControls(point,directory=false){
  const label=point?.value?.fileTag?.label??point?.value?.revisionTag?.label;
  const exact=hasStances(),describe=tag=>tag?.exactStance?`${tag.assessment} · ${tag.stance??'no winning stance'}${tag.author?` by ${authorName(tag.author)}`:''}; ${tag.observations?.map(o=>`${authorName(o.author)}: ${o.kind}`).join(' → ')??tag.reason??''}`:tagLabel(tag);
  return `<section class="file-tags"><strong>${exact?'Exact tag stances':directory?'Legacy Directory identity tag':'Legacy tags have a subject'}</strong><div class="tag-editor"><input id="tag-concept" aria-label="Tag concept" placeholder="Label or exact Concept Record ID" value="${escape(state.filterConcept)}"><select id="tag-scope"><option value="${directory?'directory':'file'}">${directory?'Directory':'File'} identity</option>${directory?'':`<option value="${exact?'selectedRevision':'revision'}">Selected revision</option>`}</select>${exact?'<button data-action="assertStance" data-write>Assert</button><button data-action="denyStance" data-write>Deny</button><button data-action="retractToSilent" data-write>Retract to silence</button>':'<button data-action="addTag" data-write>Add legacy tag</button><button data-action="removeTag" data-write>Remove legacy tag</button>'}</div>
    <p>${label?.knowledge==='PRESENT'?`Verified label: “${escape(label.value.label)}”`:'Label not yet verified'} · ${escape(describe(point?.value?.fileTag))}${directory?'':` / selected revision ${escape(describe(point?.value?.revisionTag))}`}. Labels are scoped to this root namespace, not global authority.${directory?' This tag does not apply to descendants.':''}</p>${exact?'<p>First ASSERT or DENY in Lens order wins; silence falls through. Legacy seed labels (efs, photos) are not exact stances. Filtering is bounded to enumerated folder rows, not global inventory.</p>':''}</section>`;
}
function renderActivity() {
  state.entries=journalEntries(); $('activity-count').textContent=state.entries.length?`(${state.entries.length})`:'';
  $('activity').innerHTML=(state.storageIssue?`<p class="error">${escape(state.storageIssue)}</p>`:'')+(state.entries.slice(0,20).map(entry=>`<div class="activity-item"><strong>${escape(actionLabel(entry.plan.operation))} · ${escape(entry.status)}</strong><code>${escape(short(entry.id))}</code>${entry.error?`<p>${escape(entry.error)}</p>`:''}<br><button data-action="reconcile" data-id="${escape(entry.id)}">Reconcile without re-signing</button><details><summary>Exact signed plan & read-back</summary><pre class="document">${escape(json(entry))}</pre></details></div>`).join('') || '<p>No local signed plans yet.</p>');
}
function renderCosts() {
  const economics=state.economics;
  const view=costPresentation(state.entries,economics,ethers), {totals,networks}=view;
  $('cost-summary').textContent=view.headline;
  $('cost-receipts').textContent=view.receiptSummary;
  const assumptionsOpen=$('cost-body').querySelector('.assumptions')?.open??false;
  const source=economics?.source;
  const sourceUrl=typeof source==='string'&&/^https?:\/\//.test(source)?`<a href="${escape(source)}" target="_blank" rel="noreferrer">snapshot source</a>`:escape(typeof source==='object'?json(source):source??'Not provided');
  $('cost-body').innerHTML=`<div class="gas-number">${totals.gas!==null?pretty(totals.gas):'—'} <small>recorded local receipt gas${totals.unknown?' · known subtotal':''}</small></div><p class="cost-caption">${totals.transactions.length} unique recorded receipts${totals.unknown?` · ${totals.unknown} costs unknown`:''}. This browser's journal only; deployments and other users' actions are excluded.<br>Reverted included transactions still cost gas; only EFFECTS_VERIFIED means effect success.</p>
    ${renderCostTable(view)}
    <p class="cost-caption">Dated counterfactual network costs, not live quotes or deployed-chain benchmarks. Assumes the same contract state, VM rules and execution path as local receipt gas. No public calldata requests. Storage payments, wallet/provider charges and other users' actions are excluded; local subsidy is not free mainnet execution.<br>Ethereum intrinsic calldata gas is already included. Base adds a Fjord size-only practical data bound (not a guarantee) and the captured zero operator fee. Arbitrum adds an uncompressed calldata + 140-byte posting scenario, not an upper bound. Unknown components keep totals unknown.<br><strong>ZKsync: Not measured.</strong> EraVM pricing is not local EVM gas multiplied by a fee.<br>Fee snapshot: ${escape(economics.asOf)} · FX: ${escape(economics.fxAsOf)} · ${sourceUrl}${state.editedEconomics?' · locally edited assumptions (this page session)':''}</p>
    <details><summary>Model inputs and source bounds</summary><p>Gas prices are nearby RPC recommendations, not historically pinned quotes. Base unsigned type-2 envelope: nonce 0, chain 8453, local gas used as gas limit, assumed 0.001 gwei tip, empty access list; signature overhead is modeled by the formula. Compression depends on actual bytes; this offline bound is a practical model. Base operator evidence: getOperatorFee(3126115)=0 at the captured Jovian snapshot. Arbitrum L1 estimate: 2,240,062 wei × 16 per byte; compression, envelope and fee changes may differ.</p><p><a href="https://docs.base.org/specifications/transactions/network-fees" target="_blank" rel="noreferrer">Base fees</a> · <a href="https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/GasPriceOracle.sol" target="_blank" rel="noreferrer">Fjord formula</a> · <a href="https://docs.arbitrum.io/arbitrum-essentials/how-to-estimate-gas" target="_blank" rel="noreferrer">Arbitrum estimation</a></p><pre class="document">${escape(json({base:economics.baseInputs,arbitrum:economics.arbitrumInputs,networks:economics.networks}))}</pre></details>
    ${economics?`<details class="assumptions"${assumptionsOpen?' open':''}><summary>Advanced assumptions</summary><label>ETH / USD <input type="number" min="0" step="any" data-economic="ethUsd" value="${escape(economics.ethUsd)}"></label>${networks.map(network=>`<label>${escape(network.label)} · gas gwei <input type="number" min="0" step="any" data-network="${network.index}" data-economic="gasGwei" value="${escape(network.gasGwei)}"></label><label>${escape(network.label)} · extra USD / tx <input type="number" min="0" step="any" data-network="${network.index}" data-economic="extraUsd" value="${escape(network.extraUsd)}"></label>`).join('')}<p class="cost-caption">ZKsync has no editable numeric model in this EVM experiment.</p></details>`:''}
    <div class="rpc-line">RPC work, not gas · ${pretty(state.rpc.calls)} logical calls · ${pretty(readTransport?.metrics.httpRequests??0)} HTTP requests (${pretty(readTransport?.metrics.httpBatches??0)} batches) · ${(state.rpc.bytes/1024).toFixed(1)} KiB responses · ${state.rpc.errors} errors<br>Page session only. Reads do not spend transaction gas.</div>`;
}
function render() {
  if(state.paths&&state.sdk&&!routeCurrent(state.navigation)){handleRoute();return;}
  if(!state.config) { controls(); return; }
  $('mounts').innerHTML=state.paths?
    [{label:'Files',segments:[]},...state.segments.map((label,i)=>({label,segments:state.segments.slice(0,i+1)}))].map(item=>`<button data-action="path" data-path="${escape(state.paths.encodePath(item.segments))}" title="Lens-relative navigation route">${escape(item.label)} /</button>`).join(''):
    state.config.mounts.map(mount=>`<button class="${state.folder===mount.id?'active':''}" data-action="mount" data-folder="${escape(mount.id)}" aria-pressed="${state.folder===mount.id}" title="Explicit mount ${escape(mount.id)}"><span class="mount-icon" aria-hidden="true">▱</span>${escape(mount.label)}</button>`).join('');
  renderRows(); renderDetail(); renderActivity(); renderCosts(); controls();
  if(state.paths&&$('path-input')&&document.activeElement!==$('path-input'))$('path-input').value=state.paths.encodePath(state.segments);
}

async function connect() {
  const loopback=hostname=>['localhost','127.0.0.1','[::1]','::1'].includes(hostname);
  if(!loopback(location.hostname)||!loopback(new URL(state.config.rpcUrl,location.href).hostname)) throw new Error('Disposable signers are restricted to loopback page and RPC hosts.');
  if(String(state.config.manifest.chainId)!=='31337'||BigInt(await rpc('eth_chainId'))!==31337n) throw new Error('Disposable signer requires local chain 31337.');
  if(state.config.demoSigners===false)throw Error('Demo signing is development-only. Connect your own wallet.');
  const response=await fetch(new URL('./demo-wallets.json',document.baseURI),{cache:'no-store'});
  if(!response.ok) throw new Error('This static artifact has no demo signer route. Guest reads remain available.');
  const keys=await response.json();
  const wallet=new ethers.Wallet(keys[$('signer').value]);
  if(wallet.address.toLowerCase()!==state.config.manifest.authors[$('signer').value].toLowerCase()) throw new Error('Demo signer does not match this manifest.');
  state.keys=keys; state.wallet=wallet;
  notice('Disposable local-test signer enabled. No real wallet was connected.');
}
function walletProvider(){
  const ethereum=state.walletOptions?.find(w=>w.id===$('wallet-provider')?.value)?.provider??window.ethereum;
  if(!ethereum)throw Error('No wallet extension found. Open this exact URL in Chrome, Brave or Firefox with MetaMask installed. The Codex in-app browser does not supply MetaMask.');
  return ethereum;
}
async function connectWallet(){
  if(!state.paths)throw Error('Wallet signing is supported in the guarded v2 workbench, not the old compact demo.');
  const ethereum=walletProvider();
  await ethereum.request({method:'eth_requestAccounts'});
  if(state.walletTools){
    await state.walletTools.requestLocalNetwork({ethereum,config:state.config,pageUrl:location.href});
    await state.walletTools.verifyWalletEnvironment({ethereum,config:state.config,rpc,keccak256:ethers.keccak256});
  }
  const provider=new ethers.BrowserProvider(ethereum);
  if(BigInt(await provider.send('eth_chainId',[]))!==BigInt(state.config.manifest.chainId))throw Error(`Select local chain ${state.config.manifest.chainId} in your wallet. RPC: ${state.config.rpcUrl}. No real funds needed.`);
  const signer=await provider.getSigner(),address=await signer.getAddress();
  state.walletUnsubscribe?.();state.keys=null;state.wallet={external:true,address,signer,provider,ethereum};
  const changed=()=>{state.walletUnsubscribe?.();state.walletUnsubscribe=null;state.wallet=null;state.keys=null;notice('Wallet account or chain changed. Reconnect before writing.','warning');controls();};
  ethereum.on?.('accountsChanged',changed);ethereum.on?.('chainChanged',changed);
  state.walletUnsubscribe=()=>{ethereum.removeListener?.('accountsChanged',changed);ethereum.removeListener?.('chainChanged',changed);};
  const wallet=state.wallet,autoFund=state.config.localFaucet===true&&!!state.walletTools;
  if(autoFund){
    try{
      await checkWallet(wallet);
      await state.walletTools.fundLocalWallet({config:state.config,pageUrl:location.href,address,rpc});
      await checkWallet(wallet);
    }catch(error){
      if(state.wallet===wallet){state.walletUnsubscribe?.();state.walletUnsubscribe=null;state.wallet=null;}
      throw error;
    }
  }
  applyCustomLens([address,...Object.values(state.config.manifest.authors).filter(a=>a.toLowerCase()!==address.toLowerCase())]);
  await refresh();if($('wallet-setup'))$('wallet-setup').open=true;
  notice(`Wallet connected. ${autoFund?'At least 1 local test ETH is ready for gas.':'Use local test ETH for unsponsored transactions.'} ${localSponsorEnabled()?'Local development subsidy enabled: sign the authored intent; unlocked Anvil pays its transaction.':'Each write asks for an author signature and a payer transaction.'} No real funds needed.`);
}
async function checkWallet(wallet){
  if(wallet!==state.wallet)throw Error('Writer changed; no further signature or transaction requested.');
  if(wallet.external){
    if(state.walletTools)await state.walletTools.verifyWalletEnvironment({ethereum:wallet.ethereum,config:state.config,rpc,keccak256:ethers.keccak256});
    const [chain,accounts]=await Promise.all([wallet.provider.send('eth_chainId',[]),wallet.provider.send('eth_accounts',[])]);
    if(BigInt(chain)!==BigInt(state.config.manifest.chainId)||accounts[0]?.toLowerCase()!==wallet.address.toLowerCase())throw Error('Wallet account or network changed.');
  }
  if(wallet!==state.wallet)throw Error('Wallet changed during validation. Reconnect before continuing.');
}
async function signIntent(wallet,digest,plan){
  await checkWallet(wallet);
  if(!wallet.external)return wallet.signingKey.sign(digest).serialized;
  if(state.walletTools)return state.walletTools.signPlanIntent({signer:wallet.signer,plan,digest,ethers});
  const domain={name:'EFS2-RoadB-Lab',version:'2'},types={IntentV2:[
    'realmId:bytes32','realmOrigin:bytes32','executionSet:bytes32','author:address','nonce:uint64','deadline:uint64',
    'acceptanceProfile:bytes32','indexObligations:bytes32','readSetHash:bytes32','actionsHash:bytes32'
  ].map(v=>{const [name,type]=v.split(':');return {name,type};})};
  const value={...plan.intent,actionsHash:plan.actionsHash};
  if(ethers.TypedDataEncoder.hash(domain,types,value)!==digest)throw Error('Typed wallet message does not match the SDK plan.');
  return wallet.signer.signTypedData(domain,types,value);
}
async function sendTransaction(transaction,navigation,wallet=state.wallet) {
  checkRoute(navigation);
  await checkWallet(wallet);
  if(wallet.external){
    if(localSponsorEnabled())return state.walletTools.sendLocalSponsoredTransaction({development:import.meta.env?.DEV===true,
      config:state.config,pageUrl:location.href,rpc,ethers,keccak256:ethers.keccak256,genesisHash:state.genesisHash,transaction,
      beforeSend:async()=>{checkRoute(navigation);await checkWallet(wallet);checkRoute(navigation);}});
    const estimate=BigInt(await rpc('eth_estimateGas',[{...transaction,from:wallet.address}]));
    if(estimate>16777216n)throw Error('Transaction exceeds this prototype’s gas cap.');
    checkRoute(navigation);await checkWallet(wallet);
    return wallet.signer.sendTransaction({...transaction,chainId:BigInt(state.config.manifest.chainId),gasLimit:estimate*120n/100n>16777216n?16777216n:estimate*120n/100n});
  }
  if(BigInt(await rpc('eth_chainId'))!==31337n) throw new Error('Chain changed; no transaction signed.');
  checkRoute(navigation);const from=wallet.address;
  const [nonce,price,estimate]=await Promise.all([rpc('eth_getTransactionCount',[from,'pending']),rpc('eth_gasPrice'),rpc('eth_estimateGas',[{...transaction,from}])]);
  checkRoute(navigation);
  const measured=BigInt(estimate), cap=state.paths?16777216n:30000000n;
  if(measured>cap) throw new Error(`Estimated gas ${measured} exceeds this execution profile's ${cap} transaction cap. No broadcast.`);
  const padded=(measured*120n+99n)/100n;
  const raw=await wallet.signTransaction({...transaction,chainId:31337,type:0,nonce:Number(BigInt(nonce)),gasPrice:BigInt(price),gasLimit:padded>cap?cap:padded});
  checkRoute(navigation);
  return rpc('eth_sendRawTransaction',[raw]);
}
function localSponsorEnabled(){return import.meta.env?.DEV===true&&state.config?.localSponsor!==false&&$('local-sponsor')?.checked===true;}
async function write(operation,args,navigation=state.navigation) {
  checkRoute(navigation);
  if(!state.wallet||$('lens').value==='conflict') throw new Error('Connect your wallet or enable a demo signer, and choose an ordered Lens first.');
  if(state.paths&&!navigation?.ready)throw Error('A qualified directory observation is required before signing.');
  const wallet=state.wallet,lens=authors();
  notice(`Preparing exact ${actionLabel(operation)} action…`);
  if(state.paths){
    const context=await state.sdk.pin();checkRoute(navigation);args={...args,context};
    if(['move','linkPlacement','copyFile'].includes(operation)&&args.destinationPath){const {route}=await destinationRoute(args.destinationPath,context,navigation);if(operation==='move')args.toFolder=route.target;else args.folder=route.target;}
    if(['create','createDirectory','rename','move','restorePlacement','linkPlacement','copyFile'].includes(operation)){
      const destination=await state.sdk.readPlacement({folder:args.toFolder??args.folder,name:args.name,authors:lens,context});checkRoute(navigation);
      if(!['PRESENT','MASKED','ABSENT'].includes(destination.knowledge))throw Error(`Destination is ${destination.knowledge}; refusing to sign.`);
      if(destination.knowledge!=='ABSENT'){
        const s=destination.value.selection;
        const updating=operation==='create'&&destination.knowledge==='PRESENT'&&destination.value.kind==='file';
        const message=updating?`Update the existing file “${args.name}”? This keeps its identity and adds a new revision.`:`Destination “${args.name}” is ${destination.knowledge} (${authorName(s.author)}, revision ${s.revision}, target ${s.target}). Replace this selected placement or mask? Retained data is not erased.`;
        const inspected=JSON.stringify({operation,folder:args.toFolder??args.folder,name:args.name,knowledge:destination.knowledge,target:destination.value.target,selection:s});
        if(!state.operation||state.operation.replacementInspection!==inspected||$('replacement-consent')?.checked!==true){
          if(state.operation)state.operation.replacementInspection=inspected;
          const box=$('replacement-consent');if(box)box.checked=false;
          const prior=$('replacement-choice');if(prior)prior.remove();
          $('editor-fields').insertAdjacentHTML('beforeend',`<section id="replacement-choice" class="warning"><p>${escape(message)}</p><label><input type="checkbox" id="replacement-consent"> I approve this inspected destination. Submit again to continue.</label></section>`);
          throw Error('Explicit in-page replacement confirmation required. Nothing signed.');
        }
        state.operation.replacementInspection=null;$('replacement-consent').checked=false;
        if(operation==='create'&&destination.knowledge==='PRESENT'&&destination.value.kind==='file'){
          args.replacementPlacement={folder:args.toFolder??args.folder,name:args.name,target:destination.value.target};
          operation='edit';args.file=destination.value.target;
        }else{
        args.replace=true;
        }
      }
    }
  }
  const plan=await state.sdk.prepare({operation,author:wallet.address,authors:lens,...args});checkRoute(navigation);
  const signed=await state.sdk.authorize(plan,(digest,p)=>{checkRoute(navigation);return signIntent(wallet,digest,p);});checkRoute(navigation);
  // submit can throw AFTER the external broadcast (for example quota/storage
  // failure saving its response). Keep the exact plan latched before crossing it.
  if($('editor').open && state.operation) {state.operation.pending=true;state.operation.planId=plan.id;}
  const submission=await state.sdk.submit(signed,transaction=>sendTransaction(transaction,navigation,wallet));
  const outcome=await state.sdk.reconcile(submission.id);
  if(!routeCurrent(navigation))return outcome;
  if(outcome.status==='EFFECTS_VERIFIED') {
    if(operation==='remove') {state.removed={file:args.file,name:args.name,folder:args.folder};store('removed',state.removed);}
    if(operation==='restorePlacement') {state.removed=null;store('removed',null);}
    if(state.fileRoute&&['remove','rename','move'].includes(operation)){
      $('editor').close();await navigate(state.segments);
      notice(`${actionLabel(operation)} complete. File history and bytes are retained.`);return outcome;
    }
    await refresh();
    checkRoute(navigation);
    notice(`${actionLabel(operation)} complete — saved and checked onchain.`);
  } else notice(`${actionLabel(operation)}: ${outcome.status}. No success is claimed. Reconcile the saved plan in Local activity; do not sign a replacement blindly.${outcome.error?` ${outcome.error}`:''}`,'warning');
  return outcome;
}
function field(label,name,value='',type='input') {
  return `<label class="field-label" for="field-${name}">${label}</label>${type==='textarea'?`<textarea id="field-${name}" name="${name}">${escape(value)}</textarea>`:`<input id="field-${name}" name="${name}" value="${escape(value)}" required ${name==='name'?'pattern="[a-z0-9._-]+" maxlength="255"':''}>`}`;
}
function openEditor(operation,record) {
  if(state.paths&&(!routeCurrent(state.navigation)||!state.navigation?.ready))return;
  const row=selectedRow(), name=row?.name?.value??'';
  if(operation==='edit'&&row?.point?.value?.revision?.content?.encryption===1){notice('Encrypted files are read-only in this text editor.','warning');return;}
  state.operation={operation,row,record,navigation:state.navigation,folder:state.folder}; $('editor-error').textContent='';
  const titles={create:'New file',createDirectory:'New directory',edit:'Edit contents',rename:'Rename placement',move:state.paths?'Move to a verified directory':'Move to another mount',remove:'Hide placement',releasePlacement:'Release my placement',restorePlacement:'Restore last placement',restoreContents:'Restore historical contents',linkPlacement:'Link another name to this identity',copyFile:'Copy selected contents to a new File'};
  $('editor-title').textContent=titles[operation];
  $('editor-help').textContent=`Signed by ${state.wallet?.external?short(state.wallet.address):$('signer').value}, using ${$('lens').selectedOptions[0].textContent}. Local test chain; no real funds.`;
  let fields='';
  if(['create','createDirectory','rename','move','releasePlacement','linkPlacement','copyFile'].includes(operation)) fields+=field('Exact name · lowercase ASCII','name',['create','createDirectory','releasePlacement','linkPlacement','copyFile'].includes(operation)?'':name);
  if(['linkPlacement','copyFile'].includes(operation))fields+=field('Destination directory path','destinationPath',state.paths.encodePath(state.segments))+'<p>Link shares the same identity. Copy creates a new identity with selected immutable contents, without tags or old history. External locators and ciphertext stay unchanged; no gateway fetch or decryption. Occupied names require explicit replacement confirmation.</p>';
  const previous=operation==='edit'&&verifiedBytes(row)?textPreview(verifiedBytes(row)):null;
  state.operation.replacementRequired=operation==='edit'&&!previous?.utf8;
  if(state.operation.replacementRequired)fields+='<p class="warning">The current contents are not loaded as text. Choose a replacement file, or deliberately type replacement text before saving.</p>';
  if(operation==='create'||operation==='edit') fields+=field('Text contents (or choose a file below)','document',previous?.utf8?previous.text:'','textarea');
  if(state.paths&&['create','edit'].includes(operation))fields+=`<label class="field-label" for="field-upload">Upload exact bytes (${hasCarriers()?'up to 8160 onchain or 1 MiB external':'up to 8160 bytes'}; replaces text)</label><input type="file" id="field-upload">`;
  if(hasCarriers()&&['create','edit'].includes(operation))fields+=`<label>Byte storage<select name="carriage"><option value="inline">Onchain · small files</option>${state.config.carrierOrigin?`<option value="external">Local byte store · up to 1 MiB</option>`:''}</select></label><p>The local byte store is temporary. Metadata and content hashes stay onchain; its bytes disappear when this demo stops.</p><label>Optional encryption key (64 hexadecimal digits; not saved)<input type="password" name="encryptionKey" autocomplete="off"></label>`;
  if(state.externalContent&&['create','edit'].includes(operation))fields+=`<label>Arweave / IPFS file address<input name="externalUri" placeholder="ar://transaction-id or ipfs://CID/path" autocomplete="off"></label><p>If supplied, this links an existing public file instead of uploading the text or chosen file above. Submitting permits retrieval through the matching configured HTTPS providers: Arweave — ${escape((state.config.manifest.externalGateways?.ar??[]).join(', ')||'none')}; IPFS — ${escape((state.config.manifest.externalGateways?.ipfs??[]).join(', ')||'none')}. They and their content-isolation subdomains can see the request. It downloads up to 16 MiB and saves its fingerprint onchain. No pinning account or storage payment; this does not upload new files to Arweave. Do not paste private links.</p>`;
  if(operation==='move') fields+=state.paths?field('Destination directory path · verified before signing','destinationPath','/')+'<button type="button" data-action="destination">Browse / verify this path</button><div id="destination-children"></div>':`<label class="field-label" for="field-folder">Destination explicit mount</label><select name="toFolder" id="field-folder">${state.config.mounts.filter(mount=>mount.id!==state.folder).map(mount=>`<option value="${escape(mount.id)}">${escape(mount.label)}</option>`).join('')}</select>`;
  if(operation==='remove') fields+=`<p>Hide <strong>${escape(name)}</strong> from this Lens? This adds a placement mask; retained records and other authors' views are not erased.</p>`;
  if(operation==='releasePlacement') fields+='<p>Release your live placement or mask at this exact name in the current folder. Another author’s entry may become visible. Contents and directory children are retained. No selected row is needed.</p>';
  if(operation==='restorePlacement') fields+=`<p>Restore the locally remembered placement <strong>${escape(state.removed.name)}</strong> in ${escape(state.config.mounts.find(m=>m.id===state.removed.folder)?.label??short(state.removed.folder))}? The SDK will revalidate the retained File and Name.</p>`;
  if(operation==='restoreContents') fields+=field('Historical Record ID · verified against this File before signing','record',record??'');
  $('editor-fields').innerHTML=fields; $('editor-submit').textContent=state.wallet?.external?'Continue in MetaMask / wallet':`Sign ${actionLabel(operation)} locally`;
  $('field-upload')?.addEventListener('change',()=>{
    const file=$('field-upload').files[0];if(!file)return;
    if($('field-name')&&!$('field-name').value)$('field-name').value=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-').slice(0,255);
    if(file.size>8160&&state.config.carrierOrigin)$('editor-fields').querySelector('[name="carriage"]').value='external';
  });
  controls(); // A completed prior dialog must not leave the new operation disabled.
  // An in-page nonmodal editor must not grab focus from another application.
  $('editor').setAttribute('open','');
}
function download() {
  const row=selectedRow(),bytes=verifiedBytes(row); if(!bytes) throw new Error('No qualified selected bytes to download.');
  const url=URL.createObjectURL(new Blob([bytes],{type:'application/octet-stream'}));
  const link=document.createElement('a'); link.href=url; link.download=row.name?.knowledge==='PRESENT'?row.name.value:`${row.file}.bin`;
  link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function navigate(segments){history.pushState(null,'','#'+state.paths.encodePath(segments));await handleRoute();}
async function openSelected(){
  const row=selectedRow(),navigation=state.navigation,generation=state.readGeneration,context=state.context,position=state.selected;
  if(!row||row.kind!=='file')return;
  try{const point=await state.sdk.readFile({file:row.file,authors:authors(),context,concept:!hasStances()&&state.filterConcept?conceptFor(state.filterConcept):ethers.ZeroHash,
    policy:$('lens').value==='conflict'?'no-tiebreak':'ordered'});
    if(!routeCurrent(navigation)||generation!==state.readGeneration||position!==state.selected)return;
    row.point=hasStances()&&state.filterConcept?(await hydrateExactStances({sdk:state.sdk,row:{...row,point},concept:conceptFor(state.filterConcept),authors:authors(),context})).point:point;
    if(!routeCurrent(navigation)||generation!==state.readGeneration||position!==state.selected)return;
    remember(row.point);renderDetail();renderRows();controls();
    if(['carrier-v1','live-quote-v1'].includes(point?.value?.revision?.profile)&&point.value.revision.content?.carrier!==1)await openContent();
  }catch(error){if(routeCurrent(navigation)&&generation===state.readGeneration&&position===state.selected)notice(error.message,'error');}
}
async function destinationRoute(path,pinned,navigation=state.navigation){
  const context=pinned??await state.sdk.pin(),route=await state.paths.resolvePath({sdk:state.sdk,root:state.config.manifest.folder,segments:state.paths.decodePath(path),authors:authors(),context,budget:64});
  checkRoute(navigation);
  if(route.status!=='PRESENT'||route.kind!=='directory')throw Error(`Destination ${route.status} (${route.kind}); a verified Directory is required.`);
  return {context,route};
}
async function browseDestination(path,navigation){
  $('field-destinationPath').value=path;const {context,route}=await destinationRoute(path,undefined,navigation);
  const observed=await state.sdk[hasJoined()?'listFolderPage':'listFolder']({folder:route.target,authors:authors(),context,budget:32});
  const page=hasJoined()?{value:observed.pageRows,coverage:observed.queryCoverage}:observed;
  checkRoute(navigation);
  $('destination-children').innerHTML=`<p>Verified ${escape(path)} · ${escape(short(route.target))}. ${page.coverage==='COMPLETE'?'Complete observed page.':'Partial children; enter an exact path to resolve it.'}</p><button type="button" data-action="destination" data-path="/">Files /</button>`+
    page.value.filter(r=>r.kind==='directory'&&r.name.knowledge==='PRESENT').map(r=>`<button type="button" data-action="destination" data-path="${escape(state.paths.encodePath([...route.segments,r.name.value]))}">▱ ${escape(r.name.value)}</button>`).join('');
}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]'); if(!button||button.disabled)return;
  if(state.paths&&!routeCurrent(state.navigation)){handleRoute();return;}
  const action=button.dataset.action;
  if(action==='close') { $('editor').close(); return; }
  if(action==='select') {
    const position=button.dataset.position,row=state.rows.find(r=>r.position===position),now=Date.now();
    // Rendering selection replaces the DOM button, so native dblclick alone
    // can disappear between clicks. Track the stable placement instead.
    const twice=state.lastClick?.position===position&&now-state.lastClick.at<450;
    state.lastClick={position,at:now};
    if(twice&&state.paths&&row?.kind==='directory'&&row.name?.knowledge==='PRESENT'){state.lastClick=null;run(()=>navigate([...state.segments,row.name.value]));return;}
    if(state.paths&&row?.name?.knowledge==='PRESENT'){
      const file=row.kind==='file',path=state.paths.encodePath(file?[...state.segments,row.name.value]:state.segments);
      history.replaceState(null,'','#'+path);
      state.navigation={hash:location.hash,ready:true};++state.readGeneration;
      state.fileRoute=file?{file:row.file,name:row.name.value,edge:{...row,from:row.folder}}:null;
      state.detachedRow=null;
    }
    clearContent();state.selected=position;renderDetail();renderRows();controls();if(hasJoined())openSelected();return;
  }
  if(action==='openSelected'){openSelected();return;}
  if(action==='openContent'){openContent().catch(error=>notice(error.message,'error'));return;}
  if(['create','createDirectory','edit','rename','move','remove','releasePlacement','restorePlacement','restoreContents','linkPlacement','copyFile'].includes(action)) {openEditor(action,button.dataset.record);return;}
  run(async navigation=>{
    if(action==='chainHistory'||action==='continueHistory'){
      const row=selectedRow(),saved=state.chainHistory,continuing=action==='continueHistory';
      if(continuing&&(!saved||saved.file!==row.file))throw Error('Read this File history first.');
      const context=continuing?saved.context:await state.sdk.pin(),lens=continuing?saved.authors:authors();
      const result=await state.sdk.readRevisionHistory({file:row.file,authors:lens,context,budget:8,...(continuing?{continuation:saved.result.continuation}:{})});checkRoute(navigation);
      state.chainHistory={file:row.file,context,authors:lens,result};renderDetail();
    }
    if(action==='previewRelease'){
      if(!state.wallet)throw Error('Connect a signer first.');
      const {previewOwnPlacementRelease}=await import('./files-workflows.mjs'),row=selectedRow();
      const preview=await previewOwnPlacementRelease({sdk:state.sdk,author:state.wallet.address,folder:row.folder,name:row.name.value});checkRoute(navigation);
      state.releasePreview=preview;state.releaseResult=null;renderRelease();
    }
    if(action==='executeRelease'){
      const preview=state.releasePreview,wallet=state.wallet;
      if(!wallet||wallet.address.toLowerCase()!==preview?.author.toLowerCase())throw Error('Preview again for the current signer.');
      const {executeOwnPlacementRelease}=await import('./files-workflows.mjs');
      state.releaseResult={status:'RUNNING',completed:[],pending:preview.rows};renderRelease();
      state.releaseResult=await executeOwnPlacementRelease({sdk:state.sdk,preview,signDigest:(d,p)=>{checkRoute(navigation);if(state.wallet!==wallet)throw Error('Signer changed');return signIntent(wallet,d,p);},sendTransaction:tx=>sendTransaction(tx,navigation,wallet),onProgress:progress=>{state.releaseResult={status:'RUNNING',...progress};renderRelease();}});
      renderRelease();await refresh();notice(`Recursive own-placement release: ${state.releaseResult.status}. See completed transactions and pending rows below.`,state.releaseResult.status==='COMPLETE'?'':'warning');
    }
    if(action==='connect') await connect();
    if(action==='connectWallet')await connectWallet();
    if(action==='addNetwork'){
      if(!state.walletTools)throw Error('Use the current workbench for network setup.');
      $('wallet-setup').open=true;
      const ethereum=walletProvider();
      await state.walletTools.requestLocalNetwork({ethereum,config:state.config,pageUrl:location.href,add:true});
      await state.walletTools.verifyWalletEnvironment({ethereum,config:state.config,rpc,keccak256:ethers.keccak256});
      notice(`EFS local network verified. Click Connect wallet.${state.config.localFaucet===true?' Local test gas is added automatically.':''}`);
    }
    if(action==='copyRpc'){
      try{await navigator.clipboard.writeText(state.config.rpcUrl);notice('Local RPC URL copied.');}
      catch{notice('Clipboard unavailable. Select the visible RPC URL and copy it manually.');}
    }
    if(action==='testFunds'){
      if(state.config.localFaucet===false)throw Error('Local test faucet is development-only.');
      if(!state.wallet?.external||!state.walletTools)throw Error('Connect a wallet on this local demo first.');
      const wallet=state.wallet;await checkWallet(wallet);
      await state.walletTools.fundLocalWallet({config:state.config,pageUrl:location.href,address:wallet.address,rpc});
      await checkWallet(wallet);
      notice('Your wallet now has at least 1 local test ETH. It has no real-world value. You can create files and folders.');
    }
    if(action==='disconnect') {state.walletUnsubscribe?.();state.keys=null;state.wallet=null;notice('Guest mode. No wallet remains active in this screen.');}
    if(action==='mount') {state.folder=button.dataset.folder;state.selected=null;await refresh();}
    if(action==='path')await navigate(state.paths.decodePath(button.dataset.path));
    if(action==='up'&&state.paths)await navigate(state.segments.slice(0,-1));
    if(action==='enter')await navigate([...state.segments,selectedRow().name.value]);
    if(action==='destination')await browseDestination(button.dataset.path??$('field-destinationPath').value,navigation);
    if(action==='refresh') await refresh();
    if(action==='continue') await refresh(true);
    if(action==='filter') {state.filterConcept=$('filter-concept').value.trim();await refresh();}
    if(action==='download') download();
    if(action==='reconcile') {const outcome=await state.sdk.reconcile(button.dataset.id);checkRoute(navigation);await refresh();checkRoute(navigation);notice(`Saved plan: ${outcome.status}. ${outcome.status==='EFFECTS_VERIFIED'?'Canonical effects matched.':'No success claimed; no replacement signature was made.'}`,outcome.status==='EFFECTS_VERIFIED'?'':'warning');}
    if(['addTag','removeTag','assertStance','denyStance','retractToSilent'].includes(action)) {
      const concept=$('tag-concept').value.trim(),scope=$('tag-scope').value;
      if(!concept) throw new Error('Enter the exact tag concept text first.');
      const tag=hasCarriers()?(/^0x[0-9a-f]{64}$/i.test(concept)?{concept}:{conceptLabel:concept,conceptNamespace:state.config.manifest.folder}):{concept:ethers.id(concept)};
      const outcome=await write(action,{file:selectedRow().file,scope,...tag});
      checkRoute(navigation);
      if(outcome.status==='EFFECTS_VERIFIED') {
        state.filterConcept=concept; $('filter-concept').value=concept;await refresh();
      }
    }
  });
});
$('editor-form').addEventListener('submit',event=>{
  event.preventDefault(); if(state.busy)return;
  if(!state.operation)return;
  const job=state.operation,values=Object.fromEntries(new FormData(event.target)),{operation,row,navigation}=job;
  run(async()=>{
    try {
      checkRoute(navigation);let args={...values,file:row?.file,folder:job.folder};
      if(operation==='create'||operation==='createDirectory'||operation==='copyFile') args.salt=ethers.hexlify(ethers.randomBytes(32));
      if(state.paths&&['create','edit'].includes(operation)){
        const externalUri=values.externalUri?.trim();
        if(externalUri){
          if(!state.externalContent)throw Error('External file references are not supported by this deployment.');
          if(values.encryptionKey||$('field-upload')?.files?.length)throw Error('For a file link, clear the upload and encryption fields.');
          notice('Fetching the external file to compute its saved fingerprint…');
          const observed=await state.externalContent.inspectExternal(externalUri,{gateways:state.config.manifest.externalGateways});
          checkRoute(navigation);args.content={descriptor:observed.descriptor};delete args.document;delete args.encryptionKey;
        }else{
        const upload=$('field-upload')?.files?.[0],external=hasCarriers()&&values.carriage==='external',encrypted=!!values.encryptionKey;
        if(job.replacementRequired&&!upload&&!job.replacementTyped)throw Error('Choose replacement bytes or enter replacement text. Existing contents have not been loaded; a blank editor is not an empty file.');
        const limit=(external?1048576:8160)-(encrypted?16:0);
        if(upload){if(upload.size>limit)throw Error(`This storage choice supports at most ${limit} file bytes.`);args.document=new Uint8Array(await upload.arrayBuffer());checkRoute(navigation);}
        if(hasCarriers()){
          const bytes=upload?args.document:ethers.toUtf8Bytes(args.document);if(bytes.length>limit)throw Error(`This storage choice supports at most ${limit} file bytes.`);
          const carrier=external?1:0,media=upload?upload.type==='image/png'?2:upload.type.startsWith('text/')?1:0:1;
          const payload=encrypted?await state.paths.content.encryptContent(bytes,ethers.getBytes(values.encryptionKey.startsWith('0x')?values.encryptionKey:'0x'+values.encryptionKey),{carrier,media}):{bytes,descriptor:await state.paths.content.describe(bytes,{carrier,media})};
          checkRoute(navigation);delete args.encryptionKey;
          if(external){await state.paths.content.storeRawBytes(payload.bytes,{origin:state.config.carrierOrigin,maxBytes:1048576,timeoutMs:5000});checkRoute(navigation);}
          // Ordinary typed text needs no separate media/carrier descriptor.
          // Keep that cheaper v2 path; uploads/encryption/external storage use
          // the full descriptor profile and its independently verified bytes.
          if(upload||encrypted||external)args.content=external?{descriptor:payload.descriptor}:payload;
        }
        }
      }
      if(state.paths&&operation==='move'){const {route}=await destinationRoute(values.destinationPath,undefined,navigation);args.toFolder=route.target;}
      if(operation==='rename'||operation==='move') args={...args,fromName:row.name.value,fromFolder:row.folder};
      if(operation==='remove') args.name=row.name.value;
      if(operation==='releasePlacement')delete args.file;
      if(operation==='restorePlacement') args={...state.removed};
      const outcome=await write(operation,args,navigation);checkRoute(navigation);
      if(state.operation!==job)return;
      if(outcome.status==='EFFECTS_VERIFIED') $('editor').close();
      else {state.operation.pending=true;$('editor-error').textContent=`${outcome.status}. Close this dialog and reconcile the saved plan. This dialog cannot re-sign the uncertain action.`;}
    } catch(error) { if(state.operation===job&&routeCurrent(navigation))$('editor-error').textContent=error.message; throw error; }
  });
});
$('search').addEventListener('input',()=>{if(hasJoined())refreshJoinedQuery();else{renderRows();controls();}});
$('editor-fields').addEventListener('input',event=>{if(event.target.name==='document'&&state.operation)state.operation.replacementTyped=true;});
$('path-form').addEventListener('submit',event=>{event.preventDefault();run(()=>navigate(state.paths.decodePath($('path-input').value.trim())));});
function applyCustomLens(addresses){
  if(!Array.isArray(addresses)||addresses.length<1||addresses.length>8)throw Error('Enter 1–8 wallet addresses.');
  const parsed=addresses.map(a=>ethers.getAddress(a.trim()));
  if(new Set(parsed.map(a=>a.toLowerCase())).size!==parsed.length)throw Error('Each Lens address should appear once.');
  state.customAuthors=parsed;
  if(!$('lens').querySelector('[value="custom"]'))$('lens').add(new Option('Custom ordered Lens','custom'));
  $('lens').value='custom';$('lens-addresses').value=parsed.join(', ');
  const url=new URL(location.href);url.searchParams.set('lens',parsed.join(','));history.replaceState(null,'',url);
}
$('lens-form').addEventListener('submit',event=>{event.preventDefault();run(async()=>{applyCustomLens($('lens-addresses').value.split(','));await refresh();});});
document.addEventListener('dblclick',event=>{
  const button=event.target.closest('.file-row');if(!button||state.busy||state.routeLoading)return;
  const row=state.rows.find(row=>row.position===button.dataset.position);
  if(state.paths&&row?.kind==='directory'&&row.name?.knowledge==='PRESENT')run(()=>navigate([...state.segments,row.name.value]));
});
addEventListener('hashchange',handleRoute);
addEventListener('popstate',handleRoute);
$('lens').addEventListener('change',()=>run(()=>{const url=new URL(location.href);url.searchParams.set('lens',$('lens').value==='custom'?state.customAuthors.join(','):$('lens').value);history.replaceState(null,'',url);return refresh();}));
$('filter-scope').addEventListener('change',()=>{if(hasJoined())refreshJoinedQuery();else{renderRows();controls();}});
$('filter-mode').addEventListener('change',()=>{if(hasJoined())refreshJoinedQuery();else{renderRows();controls();}});
$('signer').addEventListener('change',()=>run(async()=>{
  const wallet=new ethers.Wallet(state.keys[$('signer').value]);
  if(wallet.address.toLowerCase()!==state.config.manifest.authors[$('signer').value].toLowerCase()) throw new Error('Signer mismatch.');
  state.wallet=wallet; notice(`${$('signer').value} disposable signer selected. Lens order is unchanged.`);
}));
$('cost-body').addEventListener('change',event=>{
  const {economic,network}=event.target.dataset; if(!economic)return;
  const value=Number(event.target.value); if(event.target.value===''||!Number.isFinite(value)||value<0) {renderCosts();return;}
  if(network===undefined) state.economics[economic]=value;
  else state.economics.networks[Number(network)][economic]=value;
  state.editedEconomics=true;renderCosts();
});

await run(async()=>{
  const response=await fetch(new URL('./config.json',document.baseURI),{cache:'no-store'});
  if(!response.ok) throw new Error(`Configuration unavailable (${response.status}).`);
  state.config=await response.json(); state.folder=state.config.manifest.folder;
  if(import.meta.env?.PROD===true){state.config.demoSigners=false;state.config.localFaucet=false;state.config.localSponsor=false;delete state.config.carrierOrigin;}
  if(state.config.manifest.externalContentProfile==='ar-ipfs-locator-v2')state.externalContent=await import('./external-content.mjs');
  if(state.config.localWallet){
    state.walletTools=await import('./wallet-session.mjs');
    $('wallet-setup').hidden=false;
    $('add-network').hidden=false;
    $('wallet-rpc').value=state.config.rpcUrl;
    $('wallet-network').textContent=`RPC: ${state.config.rpcUrl} · chain ID ${state.config.manifest.chainId}. If you already have another Anvil network, update its RPC to this one.`;
    if(import.meta.env?.DEV===true&&state.config.localSponsor!==false)$('wallet-setup').insertAdjacentHTML('beforeend','<label><input id="local-sponsor" type="checkbox" checked> Development subsidy: unlocked local Anvil pays Ledger transactions</label><p>One portable author-signature prompt per write; the payer is separate and uses no wallet transaction approval. Checked against loopback, chain genesis, Anvil identity and Ledger bytecode, capped at 16,777,216 gas with zero ETH value. Uncheck for normal wallet payment. Never available in a static/public build.</p>');
    state.walletTools.discoverWallets(window,options=>{
      state.walletOptions=options;const select=$('wallet-provider'),previous=select.value;
      select.replaceChildren(...options.map(w=>new Option(w.name,w.id)));
      select.value=options.some(w=>w.id===previous)?previous:(options.find(w=>w.rdns==='io.metamask')?.id??options[0]?.id??'');
    });
  }
  readTransport=state.config.manifest.workbench
    ?(await import('./compact-read-transport.mjs')).createReadTransport({url:state.config.rpcUrl,batch:true})
    :legacyReadTransport(state.config.rpcUrl);
  const savedLens=new URL(location.href).searchParams.get('lens');
  if(savedLens){if(['alice','bob','conflict'].includes(savedLens))$('lens').value=savedLens;else applyCustomLens(savedLens.split(','));}
  if(state.config.manifest.filesProfile==='typed-directory-v1'){
    state.paths=globalThis.efsCompactDirectoryEntry;if(!state.paths)throw Error('Typed profile requires the separately served guarded entrypoint.');
    $('create').insertAdjacentHTML('beforebegin','<button id="create-directory" data-action="createDirectory" data-write>＋ New directory</button>');
    document.querySelector('.lab-pill').textContent='GUARDED DIRECTORY LAB · LOCAL';
    document.querySelector('.about').innerHTML='<summary>About this experiment</summary><p>Private local-test typed Directory graph, not a globally acyclic tree. Exact lowercase ASCII paths are Lens-relative routes; aliases and mixed-author cycles are possible. Breadcrumbs are not universal parent ownership. Source/destination guards freeze known positions, not unseen names. Required profile administration remains trusted.</p><p>Inline file bytes only: new files up to 8160 bytes, edits up to 8128. Downloads are inert and exact. No carrier, encryption, production wallet, portable state proof, public deployment, or all-in chain-fee claim.</p>';
    if(hasCarriers())document.querySelector('.about').innerHTML='<summary>About this experiment</summary><p>Guarded Directory graph with exact byte carriers and retained Concept labels. New inline carriers: 8160 stored bytes, with a checked digest header. External raw SHA-256: up to 1 MiB, explicit origin permission per open, no credentials or redirects. Only decoded bounded static PNG previews. Existing legacy inline revisions keep their original meanings.</p><p>Encryption uses AES-GCM; public names, metadata and plaintext commitments still leak information. No private directory enumeration, key distribution/recovery, production wallet, global tree, portable source-state proof, public deployment or all-in fee guarantee.</p>';
  }
  state.genesisHash=(await rpc('eth_getBlockByNumber',['0x0',false]))?.hash;
  state.prefix=journalPrefix(state.config.manifest,state.genesisHash);
  state.economics=resolveEconomics(state.config.economics);
  // Unqualified legacy namespaces are preserved, never imported as current costs.
  $('activity').previousElementSibling.textContent='Signed plans are saved before broadcast. Reconcile checks canonical effects without signing again. Journal and history are scoped to this genesis + chain ID + Ledger. Older unqualified storage is retained, not counted here.';
  try {state.history=readStored('witnessed',{})??{};state.removed=readStored('removed',null);}
  catch {state.storageIssue='Local navigation hints could not be read. They are not used as file evidence.';}
  const journal={get:async id=>readStored(`journal:${id}`,null),put:async entry=>{
    const previous=readStored(`journal:${entry.id}`,null);
    store(`journal:${entry.id}`,{...entry,localCreatedAt:previous?.localCreatedAt??Date.now()});
  }};
  state.sdk=(state.paths?.createSdk??createCompactSdk)({ethers,rpc,manifest:state.config.manifest,journal});
  $('path-form').hidden=!state.paths;
  if(state.config.manifest.workbench){
    document.title='EFS v2 · Files workbench';document.querySelector('.lab-pill').textContent='V2 WORKBENCH · LOCAL';
    document.querySelector('h1').textContent='Files, folders, and shared views.';
    document.querySelector('.below-workspace .about').innerHTML='<summary>About this prototype</summary><p>This is v2 end to end: typed records, the required index, ordered Lenses and guarded atomic writes. No v1 code or contracts. All metadata reads go directly to the local chain; the web server only serves static files and configuration.</p><p>Try docs/meeting.txt with either Lens order, photos/red.png, and create/upload/edit/rename/move/link/copy/hide/restore. Chain history follows selected revision ancestry at one pinned basis. Recursive release previews only your reachable placements and masks, then sends separate guarded transactions; it never erases Records, tags, other authors or outside aliases. Small files fit onchain; larger uploads use a temporary byte store (1 MiB demo cap). Encrypted sample key: 11 repeated 32 times.</p><p>Exact ASSERT / DENY / SILENT controls use the authenticated stance profile. Legacy seeded labels are separate. Tag filtering covers enumerated folder rows, not global inventory/history. Rough edges: lowercase ASCII names and no persistent IPFS/Arweave upload driver. Live providers can be linked, not implicitly copied. Wallet mode needs local test ETH. This is not a production deployment.</p>';
  }
  if(state.externalContent)document.querySelector('.below-workspace .about').lastElementChild.textContent='Arweave/IPFS links and copies retain the exact address and fingerprint. Public gateways retrieve bytes only with open permission. New paid Arweave uploads and IPFS pinning are not wired. For a paid Arweave upload: explicitly choose a funded Base-mainnet wallet and a maximum Turbo credit top-up, consent to public irreversible storage, upload through the user-operated Turbo service, then register its ar:// ID here after independent byte verification. Funding, upload acceptance, retrieval and Arweave settlement are separate evidence. No paid upload was tested; temporary local bytes are not durable. Recursive release affects only your previewed placements, never global deletion. Exact stance controls and bounded folder filtering do not migrate legacy seeded labels or provide global inventory/history. Development subsidy uses one author-signature prompt; otherwise wallet writes require two approvals. Not a production deployment.';
  await refresh();
});
