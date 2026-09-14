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
  rpc:{calls:0,bytes:0,ms:0,errors:0},operation:null,prefix:null,storageIssue:null};

function notice(message,kind='') {
  $('notice').textContent=message; $('notice').className=`notice ${kind}`; $('notice').hidden=!message;
}
function authors() {
  const {alice,bob}=state.config.manifest.authors;
  return $('lens').value === 'bob' ? [bob,alice] : [alice,bob];
}
function authorName(address) {
  return Object.entries(state.config.manifest.authors).find(([,v])=>v.toLowerCase()===address?.toLowerCase())?.[0] ?? short(address);
}
function selectedRow() { return state.rows.find(row=>row.position===state.selected); }
function writesAllowed() { return !!state.wallet && !state.busy && $('lens').value!=='conflict'; }
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
  state.busy=true; controls();
  try { await task(); }
  catch(error) { notice(error.message ?? String(error),'error'); }
  finally { state.busy=false; render(); }
}
function controls() {
  document.querySelectorAll('[data-action]').forEach(button=>{ button.disabled=state.busy || !state.sdk || button.dataset.blocked==='true'; });
  $('create').disabled=!writesAllowed(); $('restore').disabled=!writesAllowed() || !state.removed;
  $('signer').disabled=!state.keys || state.busy; $('lens').disabled=state.busy || !state.sdk;
  $('connect').hidden=!!state.wallet; $('disconnect').hidden=!state.wallet;
  $('signer-status').textContent=state.wallet ? `${$('signer').value} · disposable test signer` : 'Guest · read only';
  $('editor-submit').disabled=state.busy || !!state.operation?.pending;
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
  notice(continuing?'Continuing the same pinned folder traversal…':'Reading a fresh pinned observation…');
  if(!continuing) { state.context=null; state.page=null; state.rows=[]; renderRows(); state.context=await state.sdk.pin(); }
  let continuation=continuing ? state.page?.continuation : undefined;
  // Finite traversal; any retained continuation remains visibly partial.
  for(let pages=0;pages<32;pages++) {
    state.page=await state.sdk.listFolder({folder:state.folder,authors:authors(),budget:64,context:state.context,continuation});
    continuation=state.page.continuation;
    if(!continuation) break;
  }
  const concept=state.filterConcept ? ethers.id(state.filterConcept) : ethers.ZeroHash;
  const rows=[];
  for(const row of state.page.value) {
    let point;
    try { point=await state.sdk.readFile({file:row.file,authors:authors(),concept,context:state.context,
      policy:$('lens').value==='conflict'?'no-tiebreak':'ordered'}); remember(point); }
    catch(error) { point={knowledge:'UNKNOWN',coverage:'PARTIAL',reason:error.message,value:{file:row.file}}; }
    rows.push({...row,point});
  }
  state.rows=rows;
  if(!selectedRow()) state.selected=null;
  notice('');
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
    return `<button class="file-row ${state.selected===row.position?'active':''}" data-action="select" data-position="${escape(row.position)}" aria-pressed="${state.selected===row.position}"><span class="file-icon" aria-hidden="true">▤</span><span class="row-main"><span class="filename">${escape(name)}</span><span class="row-subtitle">File ${escape(short(row.file))}</span></span><span class="row-state">${revision?escape(authorName(point.value.selection.author)):`<span class="badge warning">${escape(point?.knowledge??'UNKNOWN')}</span>`}<span class="row-subtitle">${revision?`${pretty(ethers.getBytes(revision.document).length)} bytes · #${revision.firstAdmission}`:escape(point?.reason??'No selected bytes')}</span></span></button>`;
  }).join('') || `<div class="empty-list">${state.busy&&!state.page?'Reading from the Ledger…':escape(view.kind==='empty'?view.label:state.page?.coverage==='COMPLETE' && view.kind==='complete' ? 'No matches in this complete observed folder.': 'No rows to show yet. This is not evidence of an empty folder.')}</div>`;
  $('continue').hidden=!state.page?.continuation;
  $('basis').textContent=state.page ? `RPC-observed · block ${state.page.basis.blockNumber} · admission ${state.page.basis.admission} · ${short(state.page.basis.blockHash)}` : 'No qualified observation yet';
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
  if(!state.config) { controls(); return; }
  $('mounts').innerHTML=state.config.mounts.map(mount=>`<button class="${state.folder===mount.id?'active':''}" data-action="mount" data-folder="${escape(mount.id)}" aria-pressed="${state.folder===mount.id}" title="Explicit mount ${escape(mount.id)}"><span class="mount-icon" aria-hidden="true">▱</span>${escape(mount.label)}</button>`).join('');
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
async function sendTransaction(transaction) {
  if(BigInt(await rpc('eth_chainId'))!==31337n) throw new Error('Chain changed; no transaction signed.');
  const from=state.wallet.address;
  const [nonce,price,estimate]=await Promise.all([rpc('eth_getTransactionCount',[from,'pending']),rpc('eth_gasPrice'),rpc('eth_estimateGas',[{...transaction,from}])]);
  const measured=BigInt(estimate), cap=30000000n;
  if(measured>cap) throw new Error(`Estimated gas ${measured} exceeds this local prototype's 30M cap. No broadcast.`);
  const padded=(measured*120n+99n)/100n;
  const raw=await state.wallet.signTransaction({...transaction,chainId:31337,type:0,nonce:Number(BigInt(nonce)),gasPrice:BigInt(price),gasLimit:padded>cap?cap:padded});
  return rpc('eth_sendRawTransaction',[raw]);
}
async function write(operation,args) {
  if(!state.wallet||$('lens').value==='conflict') throw new Error('Choose an ordered Lens and explicitly enable a disposable signer first.');
  notice(`Preparing exact ${operation} action…`);
  const plan=await state.sdk.prepare({operation,author:state.wallet.address,authors:authors(),...args});
  const signed=await state.sdk.authorize(plan,digest=>state.wallet.signingKey.sign(digest).serialized);
  // submit can throw AFTER the external broadcast (for example quota/storage
  // failure saving its response). Keep the exact plan latched before crossing it.
  if($('editor').open && state.operation) {state.operation.pending=true;state.operation.planId=plan.id;}
  const submission=await state.sdk.submit(signed,sendTransaction);
  const outcome=await state.sdk.reconcile(submission.id);
  if(outcome.status==='EFFECTS_VERIFIED') {
    if(operation==='remove') {state.removed={file:args.file,name:args.name,folder:args.folder};store('removed',state.removed);}
    if(operation==='restorePlacement') {state.removed=null;store('removed',null);}
    await refresh();
    notice(`${operation}: EFFECTS_VERIFIED — canonical effect read-back matched. RPC-observed, not a state proof.`);
  } else notice(`${operation}: ${outcome.status}. No success is claimed. Reconcile the saved plan in Local activity; do not sign a replacement blindly.${outcome.error?` ${outcome.error}`:''}`,'warning');
  return outcome;
}
function field(label,name,value='',type='input') {
  return `<label class="field-label" for="field-${name}">${label}</label>${type==='textarea'?`<textarea id="field-${name}" name="${name}">${escape(value)}</textarea>`:`<input id="field-${name}" name="${name}" value="${escape(value)}" required ${name==='name'?'pattern="[a-z0-9._-]+" maxlength="255"':''}>`}`;
}
function openEditor(operation,record) {
  const row=selectedRow(), name=row?.name?.value??'';
  state.operation={operation,row,record}; $('editor-error').textContent='';
  const titles={create:'New file',edit:'Edit contents',rename:'Rename placement',move:'Move to another mount',remove:'Remove this placement',restorePlacement:'Restore last placement',restoreContents:'Restore historical contents'};
  $('editor-title').textContent=titles[operation];
  $('editor-help').textContent=`Signed by ${$('signer').value}, using ${$('lens').selectedOptions[0].textContent}. One atomic local-test action batch; no real funds.`;
  let fields='';
  if(['create','rename','move'].includes(operation)) fields+=field('Filename · lowercase ASCII','name',operation==='create'?'':name);
  if(operation==='create'||operation==='edit') fields+=field('Plain-text contents','document',operation==='edit'?textPreview(row.point.value.revision.document).text:'','textarea');
  if(operation==='move') fields+=`<label class="field-label" for="field-folder">Destination explicit mount</label><select name="toFolder" id="field-folder">${state.config.mounts.filter(mount=>mount.id!==state.folder).map(mount=>`<option value="${escape(mount.id)}">${escape(mount.label)}</option>`).join('')}</select>`;
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

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-action]'); if(!button||button.disabled)return;
  const action=button.dataset.action;
  if(action==='close') { $('editor').close(); return; }
  if(action==='select') {state.selected=button.dataset.position;renderDetail();renderRows();controls();return;}
  if(['create','edit','rename','move','remove','restorePlacement','restoreContents'].includes(action)) {openEditor(action,button.dataset.record);return;}
  run(async()=>{
    if(action==='connect') await connect();
    if(action==='disconnect') {state.keys=null;state.wallet=null;notice('Guest mode. Demo keys removed from this screen’s active state.');}
    if(action==='mount') {state.folder=button.dataset.folder;state.selected=null;await refresh();}
    if(action==='refresh') await refresh();
    if(action==='continue') await refresh(true);
    if(action==='filter') {state.filterConcept=$('filter-concept').value.trim();await refresh();}
    if(action==='download') download();
    if(action==='reconcile') {const outcome=await state.sdk.reconcile(button.dataset.id);await refresh();notice(`Saved plan: ${outcome.status}. ${outcome.status==='EFFECTS_VERIFIED'?'Canonical effects matched.':'No success claimed; no replacement signature was made.'}`,outcome.status==='EFFECTS_VERIFIED'?'':'warning');}
    if(action==='addTag'||action==='removeTag') {
      const concept=$('tag-concept').value.trim(),scope=$('tag-scope').value;
      if(!concept) throw new Error('Enter the exact tag concept text first.');
      const outcome=await write(action,{file:selectedRow().file,scope,concept:ethers.id(concept)});
      if(outcome.status==='EFFECTS_VERIFIED') {
        state.filterConcept=concept; $('filter-concept').value=concept;await refresh();
      }
    }
  });
});
$('editor-form').addEventListener('submit',event=>{
  event.preventDefault(); if(state.busy)return;
  const values=Object.fromEntries(new FormData(event.target)),{operation,row}=state.operation;
  run(async()=>{
    try {
      let args={...values,file:row?.file,folder:state.folder};
      if(operation==='create') args.salt=ethers.hexlify(ethers.randomBytes(32));
      if(operation==='rename'||operation==='move') args={...args,fromName:row.name.value,fromFolder:row.folder};
      if(operation==='remove') args.name=row.name.value;
      if(operation==='restorePlacement') args={...state.removed};
      const outcome=await write(operation,args);
      if(outcome.status==='EFFECTS_VERIFIED') $('editor').close();
      else {state.operation.pending=true;$('editor-error').textContent=`${outcome.status}. Close this dialog and reconcile the saved plan. This dialog cannot re-sign the uncertain action.`;}
    } catch(error) { $('editor-error').textContent=error.message; throw error; }
  });
});
$('search').addEventListener('input',()=>{renderRows();controls();});
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
  state.prefix=`efs-compact:${state.config.manifest.chainId}:${state.config.manifest.contracts.ledger.address}:`;
  state.economics=state.config.economics ? structuredClone(state.config.economics):null;
  try {state.history=readStored('witnessed',{})??{};state.removed=readStored('removed',null);}
  catch {state.storageIssue='Local navigation hints could not be read. They are not used as file evidence.';}
  const journal={get:async id=>readStored(`journal:${id}`,null),put:async entry=>{
    const previous=readStored(`journal:${entry.id}`,null);
    store(`journal:${entry.id}`,{...entry,localCreatedAt:previous?.localCreatedAt??Date.now()});
  }};
  state.sdk=createCompactSdk({ethers,rpc,manifest:state.config.manifest,journal});
  await refresh();
});
