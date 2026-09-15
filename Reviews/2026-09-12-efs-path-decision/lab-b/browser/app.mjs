import * as ethers from '/vendor/ethers.mjs';
import {createCompactSdk} from './compact-sdk.mjs';
import {folderState,filterRows,canOpen,costPresentation,renderCostTable} from './files-view.mjs';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short = value => value ? `${String(value).slice(0,8)}…${String(value).slice(-5)}` : '—';
const json = value => JSON.stringify(value,null,2);
const pretty = value => Number(value).toLocaleString('en-US');
const state = {config:null,sdk:null,folder:null,context:null,page:null,rows:[],selected:null,busy:false,
  keys:null,wallet:null,filterConcept:'',history:{},removed:null,entries:[],economics:null,editedEconomics:false,
  rpc:{calls:0,bytes:0,ms:0,errors:0},operation:null,prefix:null,storageIssue:null,paths:null,segments:[],route:null,
  navigation:null,readGeneration:0,routeLoading:false};

function notice(message,kind='') {
  $('notice').textContent=message; $('notice').className=`notice ${kind}`; $('notice').hidden=!message;
}
function authors() {
  const {alice,bob}=state.config.manifest.authors;
  return $('lens').value === 'bob' ? [bob,alice] : [alice,bob];
}
function authorName(address) {
  return Object.entries(state.config.manifest.authors).find(([,v])=>v.toLowerCase()===address?.toLowerCase()
    ||(state.paths&&ethers.zeroPadValue(v,32).toLowerCase()===address?.toLowerCase()))?.[0] ?? short(address);
}
function selectedRow() { return state.rows.find(row=>row.position===state.selected); }
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
  const start=performance.now(),id=++state.rpc.calls;
  try {
    const response=await fetch(state.config.rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id,method,params}),signal:AbortSignal.timeout(20000)});
    const raw=await response.text(); state.rpc.bytes+=new TextEncoder().encode(raw).length;
    if(!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    const payload=JSON.parse(raw);
    if(payload.id!==id) throw new Error('RPC response ID mismatch');
    if(payload.error) throw new Error(payload.error.message ?? `RPC ${payload.error.code}`);
    if(!Object.hasOwn(payload,'result')) throw new Error('RPC response has no result');
    return payload.result;
  } catch(error) { state.rpc.errors++; throw error; }
  finally { state.rpc.ms+=performance.now()-start; }
}
async function run(task) {
  if(state.busy) return;
  const navigation=state.navigation;
  state.busy=true; controls();
  try { await task(navigation); }
  catch(error) { if(error.code!=='ROUTE_CHANGED'&&(routeCurrent(navigation)||(!navigation&&!state.navigation))) notice(error.message ?? String(error),'error'); }
  finally { state.busy=false; render(); }
}
function controls() {
  document.querySelectorAll('[data-action]').forEach(button=>{ button.disabled=state.busy || state.routeLoading || !state.sdk || button.dataset.blocked==='true'; });
  $('create').disabled=!writesAllowed(); $('restore').disabled=!writesAllowed() || !state.removed;
  $('signer').disabled=!state.keys || state.busy; $('lens').disabled=state.busy || !state.sdk;
  $('connect').hidden=!!state.wallet; $('disconnect').hidden=!state.wallet;
  $('signer-status').textContent=state.wallet ? `${$('signer').value} · disposable test signer` : 'Guest · read only';
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
  const navigation=state.navigation,generation=++state.readGeneration;
  const check=()=>{checkRoute(navigation);if(generation!==state.readGeneration)throw Object.assign(new Error('Observation superseded.'),{code:'ROUTE_CHANGED'});};
  const lens=authors(),policy=$('lens').value==='conflict'?'no-tiebreak':'ordered';
  let context=state.context,page=state.page,folder=state.folder,route=state.route;
  if(state.paths){state.routeLoading=true;navigation.ready=false;}
  notice(continuing?'Continuing the same pinned folder traversal…':'Reading a fresh pinned observation…');
  try {
    if(!continuing) {
      state.context=null; state.page=null; state.rows=[]; render(); context=await state.sdk.pin();check();
      if(state.paths){
        route=await state.paths.resolvePath({sdk:state.sdk,root:state.config.manifest.folder,segments:state.segments,authors:lens,context,budget:64});check();
        if(route.status!=='PRESENT'||route.kind!=='directory'){
          state.folder=null;state.selected=null;state.route=route;state.context=context;
          state.page={basis:context,knowledge:route.status==='PRESENT'?'INVALID':route.status,coverage:'PARTIAL',value:[],nameCoverage:'PARTIAL'};
          notice(`Path ${state.paths.encodePath(state.segments)}: ${route.status}. Use a breadcrumb to return; no empty folder is inferred.`,'warning');return;
        }
        folder=route.target;
      }
    }
    let continuation=continuing ? page?.continuation : undefined;
    // Finite traversal; any retained continuation remains visibly partial.
    for(let pages=0;pages<32;pages++) {
      page=await state.sdk.listFolder({folder,authors:lens,budget:64,context,continuation});check();
      continuation=page.continuation;
      if(!continuation) break;
    }
    const concept=state.filterConcept ? ethers.id(state.filterConcept) : ethers.ZeroHash;
    const rows=[];
    for(const row of page.value) {
      let point;
      if(state.paths&&row.kind!=='file'){rows.push({...row,point:{knowledge:row.knowledge,coverage:row.knowledge==='PRESENT'?'COMPLETE':'PARTIAL',reason:row.kind==='directory'?'Directory · no File HEAD required':'Target kind unavailable'}});continue;}
      try { point=await state.sdk.readFile({file:row.file,authors:lens,concept,context,policy});check(); remember(point); }
      catch(error) { check();point={knowledge:'UNKNOWN',coverage:'PARTIAL',reason:error.message,value:{file:row.file}}; }
      rows.push({...row,point});
    }
    check();Object.assign(state,{rows,context,page,folder,route});
    if(state.paths)navigation.ready=true;
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
  Object.assign(state,{folder:null,context:null,page:null,rows:[],selected:null,route:null,segments:[],operation:null,routeLoading:false});
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
  const filtered=filterRows(state.rows,{search:$('search').value,tag:!!state.filterConcept,scope:$('filter-scope').value});
  $('coverage').className=`coverage ${view.kind!=='complete' && view.kind!=='empty' ? 'warning':''}`;
  $('coverage').textContent=state.busy && !state.page ? 'Reading qualified folder membership…'
    : `${view.label}${state.page ? ` · ${filtered.rows.length} shown / ${state.rows.length} observed placements`:''}${filtered.uncertain ? ` · ${filtered.uncertain} uncertain matches retained`:''}${state.filterConcept ? ` · tag “${state.filterConcept}” (${ $('filter-scope').selectedOptions[0].textContent})`:''}${$('lens').value==='conflict'?' · HEAD conflict review; Alice-first placements':''}`;
  $('rows').innerHTML=filtered.rows.map(row=>{
    const point=row.point, revision=point?.value?.revision;
    const name=row.name?.knowledge==='PRESENT'?row.name.value:`Name ${row.name?.knowledge?.toLowerCase()??'unavailable'} · ${short(row.file)}`;
    return `<button class="file-row ${state.selected===row.position?'active':''}" data-action="select" data-position="${escape(row.position)}" aria-pressed="${state.selected===row.position}"><span class="file-icon" aria-hidden="true">${row.kind==='directory'?'▱':'▤'}</span><span class="row-main"><span class="filename">${escape(name)}</span><span class="row-subtitle">${row.kind==='directory'?'Directory':row.kind==='unknown'?'Unknown kind':'File'} ${escape(short(row.file))}</span></span><span class="row-state">${revision?escape(authorName(point.value.selection.author)):`<span class="badge warning">${escape(point?.knowledge??'UNKNOWN')}</span>`}<span class="row-subtitle">${revision?`${pretty(ethers.getBytes(revision.document).length)} bytes · #${revision.firstAdmission}`:escape(point?.reason??'No selected bytes')}</span></span></button>`;
  }).join('') || `<div class="empty-list">${state.busy&&!state.page?'Reading from the Ledger…':escape(view.kind==='empty'?view.label:state.page?.coverage==='COMPLETE' && view.kind==='complete' ? 'No matches in this complete observed folder.': 'No rows to show yet. This is not evidence of an empty folder.')}</div>`;
  $('continue').hidden=!state.page?.continuation;
  $('basis').textContent=state.page?.basis ? `RPC-observed · block ${state.page.basis.blockNumber} · admission ${state.page.basis.admission} · ${short(state.page.basis.blockHash)}` : 'No qualified observation yet';
}
function textPreview(documentBytes) {
  try { return {text:ethers.toUtf8String(documentBytes),utf8:true}; }
  catch { return {text:'These verified bytes are not valid UTF-8. Download preserves the exact bytes; no media type is asserted.',utf8:false}; }
}
function renderDetail() {
  const row=selectedRow();
  if(!row) { $('detail').innerHTML='<div class="welcome"><span class="empty-icon">▤</span><h2>Open a file</h2><p>Choose a row to inspect its selected contents, revisions, and exact tag subjects.</p></div>'; return; }
  const point=row.point, revision=point?.value?.revision, open=canOpen(point);
  const name=row.name?.knowledge==='PRESENT'?row.name.value:'Name unavailable';
  const preview=open?textPreview(revision.document):null;
  const knownName=row.name?.knowledge==='PRESENT';
  const action=(id,label,blocked=false,extra='')=>`<button data-action="${id}" data-write data-blocked="${blocked}" ${blocked?'disabled':''} ${extra}>${label}</button>`;
  if(state.paths&&row.kind!=='file'){
    $('detail').innerHTML=`<h2>${escape(name)}</h2><p>${row.kind==='directory'?'Typed Directory · stable descriptor identity. No File HEAD is required.':'Target kind is unavailable or invalid. Membership has not been discarded.'}</p>
      <div class="file-actions">${row.kind==='directory'&&knownName?'<button data-action="enter">Open directory →</button>':''}${action('rename','Rename',!knownName||row.kind!=='directory')}${action('move','Move',!knownName||row.kind!=='directory')}${action('remove','Remove placement',!knownName||row.kind!=='directory')}</div>
      <p>Placements are links, not ownership. Moving or removing one never rewrites or destroys descendants. A Lens may contain aliases or cycles.</p><details><summary>Descriptor and selected edge</summary><pre>${escape(json(row))}</pre></details>`;return;
  }
  const candidates=(point?.value?.candidates??[]).map(candidate=>`<div class="conflict-card"><strong>${escape(authorName(candidate.selection.author))}</strong> · ${escape(short(candidate.revision?.recordId??candidate.selection.target))}<pre>${escape(candidate.revision?textPreview(candidate.revision.document).text:`${candidate.knowledge??'UNKNOWN'} — candidate bytes unavailable; conflict retained.`)}</pre></div>`).join('');
  const history=state.history[row.file]??[];
  $('detail').innerHTML=`<h2 class="file-title">${escape(name)}</h2><div class="meta-line"><span class="badge ${open?'':'warning'}">${escape(point?.knowledge??'UNKNOWN')}</span><span>${open?`${escape(authorName(point.value.selection.author))} selected · revision ${escape(short(revision.recordId))}`:escape(point?.reason??'No single selected revision')}</span></div>
    <div class="file-actions">${action('edit','Edit contents',!open||!preview.utf8)}${action('rename','Rename',!knownName)}${action('move','Move',!knownName)}<button data-action="download" data-blocked="${!open}" ${open?'':'disabled'}>↓ Download bytes</button>${action('remove','Remove placement',!knownName,'class="danger"')}</div>
    ${open?`<div class="content-label"><span>${preview.utf8?'Plain-text preview · UTF-8 interpretation':'Verified bytes · no MIME asserted'}</span><span>${pretty(ethers.getBytes(revision.document).length)} bytes</span></div><pre class="document">${escape(preview.text)}</pre>`:`<p class="conflict-note">${point?.knowledge==='CONFLICT'?'Multiple authors have live HEADs. Choose an ordered Lens to select one before editing.':'Membership is retained here. Unavailable or invalid selected bytes are not opened or downloaded.'}</p>${candidates}`}
    <section class="file-tags"><strong>Tags have a subject</strong><div class="tag-editor"><input id="tag-concept" aria-label="Tag concept" placeholder="Concept, e.g. important" value="${escape(state.filterConcept)}"><select id="tag-scope" aria-label="Tag subject"><option value="file">File identity</option><option value="revision">Selected revision</option></select>${action('addTag','Add',false)}${action('removeTag','Remove',false)}</div><p class="tag-state">${state.filterConcept?`Observed “${escape(state.filterConcept)}”: File ${tagLabel(point?.value?.fileTag)} · selected revision ${tagLabel(point?.value?.revisionTag)}`:'Enter a concept to add or remove. Apply the same concept above to inspect its presence.'}</p></section>
    <details class="revision-history"><summary>Locally witnessed revisions (${history.length})</summary><p>Not a complete history. Restoring contents publishes a fresh child revision; it does not rewind HEAD.</p>${history.map(item=>`<div class="history-row"><code title="${escape(item.recordId)}">${escape(short(item.recordId))} · admission ${escape(item.firstAdmission)}</code>${action('restoreContents','Restore these contents',!open,`data-record="${escape(item.recordId)}"`)}</div>`).join('')}${action('restoreContents','Use a historical Record ID…',!open)}</details>
    <details class="technical"><summary>Record & observation details</summary><pre>${escape(json({file:row.file,placement:{folder:row.folder,position:row.position,role:row.role,name:row.name},point}))}</pre></details>`;
}
function tagLabel(tag) { return !tag?.evaluated?'not evaluated':tag.present?'present':tag.selection?.status===2?'masked':'absent'; }
function renderActivity() {
  state.entries=journalEntries(); $('activity-count').textContent=state.entries.length?`(${state.entries.length})`:'';
  $('activity').innerHTML=(state.storageIssue?`<p class="error">${escape(state.storageIssue)}</p>`:'')+(state.entries.slice(0,20).map(entry=>`<div class="activity-item"><strong>${escape(entry.plan.operation)} · ${escape(entry.status)}</strong><code>${escape(short(entry.id))}</code>${entry.error?`<p>${escape(entry.error)}</p>`:''}<br><button data-action="reconcile" data-id="${escape(entry.id)}">Reconcile without re-signing</button><details><summary>Exact signed plan & read-back</summary><pre class="document">${escape(json(entry))}</pre></details></div>`).join('') || '<p>No local signed plans yet.</p>');
}
function renderCosts() {
  const economics=state.economics;
  const view=costPresentation(state.entries,economics), {totals,networks}=view;
  $('cost-summary').textContent=view.headline;
  $('cost-receipts').textContent=view.receiptSummary;
  const assumptionsOpen=$('cost-body').querySelector('.assumptions')?.open??false;
  const source=economics?.source;
  const sourceUrl=typeof source==='string'&&/^https?:\/\//.test(source)?`<a href="${escape(source)}" target="_blank" rel="noreferrer">snapshot source</a>`:escape(typeof source==='object'?json(source):source??'Not provided');
  $('cost-body').innerHTML=`<div class="gas-number">${totals.gas!==null?pretty(totals.gas):'—'} <small>recorded local receipt gas${totals.unknown?' · known subtotal':''}</small></div><p class="cost-caption">${totals.transactions.length} unique recorded receipts${totals.unknown?` · ${totals.unknown} costs unknown`:''}. This browser's journal only; deployments and other users' actions are excluded.<br>Reverted included transactions still cost gas; only EFFECTS_VERIFIED means effect success.</p>
    ${renderCostTable(view)}
    <p class="cost-caption">Execution-only estimates, not live quotes or deployed-chain benchmarks. Local EVM gas × snapshot gwei × ETH/USD + any manually entered extra USD. L2 data/operator fees are excluded unless manually entered; zero extra does not mean zero real fees.<br><strong>ZKsync: Not measured.</strong> EraVM pricing is not local EVM gas multiplied by a fee.${economics?`<br>Snapshot: ${escape(economics.asOf??'undated')} · ${sourceUrl}${state.editedEconomics?' · locally edited assumptions (this page session)':''}`:''}</p>
    ${economics?`<details class="assumptions"${assumptionsOpen?' open':''}><summary>Advanced assumptions</summary><label>ETH / USD <input type="number" min="0" step="any" data-economic="ethUsd" value="${escape(economics.ethUsd)}"></label>${networks.map(network=>`<label>${escape(network.label)} · gas gwei <input type="number" min="0" step="any" data-network="${network.index}" data-economic="gasGwei" value="${escape(network.gasGwei)}"></label><label>${escape(network.label)} · extra USD / tx <input type="number" min="0" step="any" data-network="${network.index}" data-economic="extraUsd" value="${escape(network.extraUsd)}"></label>`).join('')}<p class="cost-caption">ZKsync has no editable numeric model in this EVM experiment.</p></details>`:''}
    <div class="rpc-line">RPC work, not gas · ${pretty(state.rpc.calls)} calls · ${(state.rpc.bytes/1024).toFixed(1)} KiB response bodies · ${(state.rpc.ms/1000).toFixed(2)}s summed request time · ${state.rpc.errors} errors<br>Page session only. These reads do not spend transaction gas.</div>`;
}
function render() {
  if(state.paths&&state.sdk&&!routeCurrent(state.navigation)){handleRoute();return;}
  if(!state.config) { controls(); return; }
  $('mounts').innerHTML=state.paths?
    [{label:'Files',segments:[]},...state.segments.map((label,i)=>({label,segments:state.segments.slice(0,i+1)}))].map(item=>`<button data-action="path" data-path="${escape(state.paths.encodePath(item.segments))}" title="Lens-relative navigation route">${escape(item.label)} /</button>`).join(''):
    state.config.mounts.map(mount=>`<button class="${state.folder===mount.id?'active':''}" data-action="mount" data-folder="${escape(mount.id)}" aria-pressed="${state.folder===mount.id}" title="Explicit mount ${escape(mount.id)}"><span class="mount-icon" aria-hidden="true">▱</span>${escape(mount.label)}</button>`).join('');
  renderRows(); renderDetail(); renderActivity(); renderCosts(); controls();
}

async function connect() {
  const loopback=hostname=>['localhost','127.0.0.1','[::1]','::1'].includes(hostname);
  if(!loopback(location.hostname)||!loopback(new URL(state.config.rpcUrl,location.href).hostname)) throw new Error('Disposable signers are restricted to loopback page and RPC hosts.');
  if(String(state.config.manifest.chainId)!=='31337'||BigInt(await rpc('eth_chainId'))!==31337n) throw new Error('Disposable signer requires local chain 31337.');
  const response=await fetch('/demo-wallets.json',{cache:'no-store'});
  if(!response.ok) throw new Error('This static artifact has no demo signer route. Guest reads remain available.');
  const keys=await response.json();
  const wallet=new ethers.Wallet(keys[$('signer').value]);
  if(wallet.address.toLowerCase()!==state.config.manifest.authors[$('signer').value].toLowerCase()) throw new Error('Demo signer does not match this manifest.');
  state.keys=keys; state.wallet=wallet;
  notice('Disposable local-test signer enabled. No real wallet was connected.');
}
async function sendTransaction(transaction,navigation,wallet=state.wallet) {
  checkRoute(navigation);
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
async function write(operation,args,navigation=state.navigation) {
  checkRoute(navigation);
  if(!state.wallet||$('lens').value==='conflict') throw new Error('Choose an ordered Lens and explicitly enable a disposable signer first.');
  if(state.paths&&!navigation?.ready)throw Error('A qualified directory observation is required before signing.');
  const wallet=state.wallet,lens=authors();
  notice(`Preparing exact ${operation} action…`);
  if(state.paths){
    const context=await state.sdk.pin();checkRoute(navigation);args={...args,context};
    if(operation==='move'&&args.destinationPath){const {route}=await destinationRoute(args.destinationPath,context,navigation);args.toFolder=route.target;}
    if(['create','createDirectory','rename','move','restorePlacement'].includes(operation)){
      const destination=await state.sdk.readPlacement({folder:args.toFolder??args.folder,name:args.name,authors:lens,context});checkRoute(navigation);
      if(!['PRESENT','MASKED','ABSENT'].includes(destination.knowledge))throw Error(`Destination is ${destination.knowledge}; refusing to sign.`);
      if(destination.knowledge!=='ABSENT'){
        const s=destination.value.selection;
        if(!confirm(`Destination “${args.name}” is ${destination.knowledge} (${authorName(s.author)}, revision ${s.revision}, target ${s.target}). Replace this selected placement or mask? Retained data is not erased.`))throw Error('Replacement cancelled. Nothing signed.');
        args.replace=true;
      }
    }
  }
  const plan=await state.sdk.prepare({operation,author:wallet.address,authors:lens,...args});checkRoute(navigation);
  const signed=await state.sdk.authorize(plan,digest=>{checkRoute(navigation);return wallet.signingKey.sign(digest).serialized;});checkRoute(navigation);
  // submit can throw AFTER the external broadcast (for example quota/storage
  // failure saving its response). Keep the exact plan latched before crossing it.
  if($('editor').open && state.operation) {state.operation.pending=true;state.operation.planId=plan.id;}
  const submission=await state.sdk.submit(signed,transaction=>sendTransaction(transaction,navigation,wallet));
  const outcome=await state.sdk.reconcile(submission.id);
  if(!routeCurrent(navigation))return outcome;
  if(outcome.status==='EFFECTS_VERIFIED') {
    if(operation==='remove') {state.removed={file:args.file,name:args.name,folder:args.folder};store('removed',state.removed);}
    if(operation==='restorePlacement') {state.removed=null;store('removed',null);}
    await refresh();
    checkRoute(navigation);
    notice(`${operation}: EFFECTS_VERIFIED — canonical effect read-back matched. RPC-observed, not a state proof.`);
  } else notice(`${operation}: ${outcome.status}. No success is claimed. Reconcile the saved plan in Local activity; do not sign a replacement blindly.${outcome.error?` ${outcome.error}`:''}`,'warning');
  return outcome;
}
function field(label,name,value='',type='input') {
  return `<label class="field-label" for="field-${name}">${label}</label>${type==='textarea'?`<textarea id="field-${name}" name="${name}">${escape(value)}</textarea>`:`<input id="field-${name}" name="${name}" value="${escape(value)}" required ${name==='name'?'pattern="[a-z0-9._-]+" maxlength="255"':''}>`}`;
}
function openEditor(operation,record) {
  if(state.paths&&(!routeCurrent(state.navigation)||!state.navigation?.ready))return;
  const row=selectedRow(), name=row?.name?.value??'';
  state.operation={operation,row,record,navigation:state.navigation,folder:state.folder}; $('editor-error').textContent='';
  const titles={create:'New file',createDirectory:'New directory',edit:'Edit contents',rename:'Rename placement',move:state.paths?'Move to a verified directory':'Move to another mount',remove:'Remove this placement',restorePlacement:'Restore last placement',restoreContents:'Restore historical contents'};
  $('editor-title').textContent=titles[operation];
  $('editor-help').textContent=`Signed by ${$('signer').value}, using ${$('lens').selectedOptions[0].textContent}. One atomic local-test action batch; no real funds.`;
  let fields='';
  if(['create','createDirectory','rename','move'].includes(operation)) fields+=field('Exact name · lowercase ASCII','name',['create','createDirectory'].includes(operation)?'':name);
  if(operation==='create'||operation==='edit') fields+=field('Plain-text contents','document',operation==='edit'?textPreview(row.point.value.revision.document).text:'','textarea');
  if(state.paths&&operation==='create')fields+='<label class="field-label" for="field-upload">Or upload exact bytes (up to 8160 bytes; overrides text)</label><input type="file" id="field-upload">';
  if(operation==='move') fields+=state.paths?field('Destination directory path · verified before signing','destinationPath','/')+'<button type="button" data-action="destination">Browse / verify this path</button><div id="destination-children"></div>':`<label class="field-label" for="field-folder">Destination explicit mount</label><select name="toFolder" id="field-folder">${state.config.mounts.filter(mount=>mount.id!==state.folder).map(mount=>`<option value="${escape(mount.id)}">${escape(mount.label)}</option>`).join('')}</select>`;
  if(operation==='remove') fields+=`<p>Remove <strong>${escape(name)}</strong> from this Lens? This adds a placement mask; retained records and other authors' views are not erased.</p>`;
  if(operation==='restorePlacement') fields+=`<p>Restore the locally remembered placement <strong>${escape(state.removed.name)}</strong> in ${escape(state.config.mounts.find(m=>m.id===state.removed.folder)?.label??short(state.removed.folder))}? The SDK will revalidate the retained File and Name.</p>`;
  if(operation==='restoreContents') fields+=field('Historical Record ID · verified against this File before signing','record',record??'');
  $('editor-fields').innerHTML=fields; $('editor-submit').textContent=`Sign ${operation} locally`;
  controls(); // A completed prior dialog must not leave the new operation disabled.
  $('editor').showModal(); $('editor-fields').querySelector('input,textarea,select')?.focus();
}
function download() {
  const row=selectedRow(); if(!canOpen(row?.point)) throw new Error('No qualified selected bytes to download.');
  const url=URL.createObjectURL(new Blob([ethers.getBytes(row.point.value.revision.document)],{type:'application/octet-stream'}));
  const link=document.createElement('a'); link.href=url; link.download=row.name?.knowledge==='PRESENT'?row.name.value:`${row.file}.bin`;
  link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function navigate(segments){history.pushState(null,'','#'+state.paths.encodePath(segments));await handleRoute();}
async function destinationRoute(path,pinned,navigation=state.navigation){
  const context=pinned??await state.sdk.pin(),route=await state.paths.resolvePath({sdk:state.sdk,root:state.config.manifest.folder,segments:state.paths.decodePath(path),authors:authors(),context,budget:64});
  checkRoute(navigation);
  if(route.status!=='PRESENT'||route.kind!=='directory')throw Error(`Destination ${route.status} (${route.kind}); a verified Directory is required.`);
  return {context,route};
}
async function browseDestination(path,navigation){
  $('field-destinationPath').value=path;const {context,route}=await destinationRoute(path,undefined,navigation);
  const page=await state.sdk.listFolder({folder:route.target,authors:authors(),context,budget:64});
  checkRoute(navigation);
  $('destination-children').innerHTML=`<p>Verified ${escape(path)} · ${escape(short(route.target))}. ${page.coverage==='COMPLETE'?'Complete observed page.':'Partial children; enter an exact path to resolve it.'}</p><button type="button" data-action="destination" data-path="/">Files /</button>`+
    page.value.filter(r=>r.kind==='directory'&&r.name.knowledge==='PRESENT').map(r=>`<button type="button" data-action="destination" data-path="${escape(state.paths.encodePath([...route.segments,r.name.value]))}">▱ ${escape(r.name.value)}</button>`).join('');
}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]'); if(!button||button.disabled)return;
  if(state.paths&&!routeCurrent(state.navigation)){handleRoute();return;}
  const action=button.dataset.action;
  if(action==='close') { $('editor').close(); return; }
  if(action==='select') {state.selected=button.dataset.position;renderDetail();renderRows();controls();return;}
  if(['create','createDirectory','edit','rename','move','remove','restorePlacement','restoreContents'].includes(action)) {openEditor(action,button.dataset.record);return;}
  run(async navigation=>{
    if(action==='connect') await connect();
    if(action==='disconnect') {state.keys=null;state.wallet=null;notice('Guest mode. Demo keys removed from this screen’s active state.');}
    if(action==='mount') {state.folder=button.dataset.folder;state.selected=null;await refresh();}
    if(action==='path')await navigate(state.paths.decodePath(button.dataset.path));
    if(action==='enter')await navigate([...state.segments,selectedRow().name.value]);
    if(action==='destination')await browseDestination(button.dataset.path??$('field-destinationPath').value,navigation);
    if(action==='refresh') await refresh();
    if(action==='continue') await refresh(true);
    if(action==='filter') {state.filterConcept=$('filter-concept').value.trim();await refresh();}
    if(action==='download') download();
    if(action==='reconcile') {const outcome=await state.sdk.reconcile(button.dataset.id);checkRoute(navigation);await refresh();checkRoute(navigation);notice(`Saved plan: ${outcome.status}. ${outcome.status==='EFFECTS_VERIFIED'?'Canonical effects matched.':'No success claimed; no replacement signature was made.'}`,outcome.status==='EFFECTS_VERIFIED'?'':'warning');}
    if(action==='addTag'||action==='removeTag') {
      const concept=$('tag-concept').value.trim(),scope=$('tag-scope').value;
      if(!concept) throw new Error('Enter the exact tag concept text first.');
      const outcome=await write(action,{file:selectedRow().file,scope,concept:ethers.id(concept)});
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
      if(operation==='create'||operation==='createDirectory') args.salt=ethers.hexlify(ethers.randomBytes(32));
      if(state.paths&&operation==='create'){
        const upload=$('field-upload')?.files?.[0];if(upload){if(upload.size>8160)throw Error('Inline prototype upload limit is 8160 bytes.');args.document=new Uint8Array(await upload.arrayBuffer());}
      }
      if(state.paths&&operation==='move'){const {route}=await destinationRoute(values.destinationPath,undefined,navigation);args.toFolder=route.target;}
      if(operation==='rename'||operation==='move') args={...args,fromName:row.name.value,fromFolder:row.folder};
      if(operation==='remove') args.name=row.name.value;
      if(operation==='restorePlacement') args={...state.removed};
      const outcome=await write(operation,args,navigation);checkRoute(navigation);
      if(state.operation!==job)return;
      if(outcome.status==='EFFECTS_VERIFIED') $('editor').close();
      else {state.operation.pending=true;$('editor-error').textContent=`${outcome.status}. Close this dialog and reconcile the saved plan. This dialog cannot re-sign the uncertain action.`;}
    } catch(error) { if(state.operation===job&&routeCurrent(navigation))$('editor-error').textContent=error.message; throw error; }
  });
});
$('search').addEventListener('input',()=>{renderRows();controls();});
addEventListener('hashchange',handleRoute);
addEventListener('popstate',handleRoute);
$('lens').addEventListener('change',()=>run(()=>refresh()));
$('filter-scope').addEventListener('change',()=>{renderRows();controls();});
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
  const response=await fetch('/config.json',{cache:'no-store'});
  if(!response.ok) throw new Error(`Configuration unavailable (${response.status}).`);
  state.config=await response.json(); state.folder=state.config.manifest.folder;
  if(state.config.manifest.filesProfile==='typed-directory-v1'){
    state.paths=globalThis.efsCompactDirectoryEntry;if(!state.paths)throw Error('Typed profile requires the separately served guarded entrypoint.');
    $('create').insertAdjacentHTML('beforebegin','<button id="create-directory" data-action="createDirectory" data-write>＋ New directory</button>');
    document.querySelector('.lab-pill').textContent='GUARDED DIRECTORY LAB · LOCAL';
    document.querySelector('.about').innerHTML='<summary>About this experiment</summary><p>Private local-test typed Directory graph, not a globally acyclic tree. Exact lowercase ASCII paths are Lens-relative routes; aliases and mixed-author cycles are possible. Breadcrumbs are not universal parent ownership. Source/destination guards freeze known positions, not unseen names. Required profile administration remains trusted.</p><p>Inline file bytes only: new files up to 8160 bytes, edits up to 8128. Downloads are inert and exact. No carrier, encryption, production wallet, portable state proof, public deployment, or all-in chain-fee claim.</p>';
  }
  state.prefix=`efs-compact:${state.config.manifest.chainId}:${state.config.manifest.contracts.ledger.address}:`;
  state.economics=state.config.economics ? structuredClone(state.config.economics):null;
  try {state.history=readStored('witnessed',{})??{};state.removed=readStored('removed',null);}
  catch {state.storageIssue='Local navigation hints could not be read. They are not used as file evidence.';}
  const journal={get:async id=>readStored(`journal:${id}`,null),put:async entry=>{
    const previous=readStored(`journal:${entry.id}`,null);
    store(`journal:${entry.id}`,{...entry,localCreatedAt:previous?.localCreatedAt??Date.now()});
  }};
  state.sdk=(state.paths?.createSdk??createCompactSdk)({ethers,rpc,manifest:state.config.manifest,journal});
  await refresh();
});
