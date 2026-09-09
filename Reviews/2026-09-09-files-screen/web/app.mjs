import { createFixtureReader,openDirectory } from '/Reviews/2026-09-09-files-reader/index.mjs';
import { boundedJSON,createRPCSource } from './rpc-source.mjs';
import { presentListing } from './listing-presentation.mjs';
const $=id=>document.getElementById(id),main=document.querySelector('main'),stringify=x=>JSON.stringify(x,(_,v)=>typeof v==='bigint'?String(v):v,2);
let config,reader,scope,stream,cancel,generation=0,current=null,busy=false,opener=null;
const short=x=>x?x.slice(0,10)+'…'+x.slice(-8):'not available';
const text=(tag,value,className)=>{const e=document.createElement(tag);e.textContent=value;if(className)e.className=className;return e;};
function closeWhy(restore=false){if(!restore)opener=null;$('why').close();}
$('close-why').addEventListener('click',()=>closeWhy(true));
$('why').addEventListener('close',()=>{if(opener?.isConnected)opener.focus();opener=null;});
function allRows(s){return [...(s?.rows??[]),...(s?.unresolved??[]),...(s?.masked??[]),...(s?.absent??[])];}
function explain(row,button){
  if(!current||!button.isConnected)return;
  const observation=current;
  opener=button;const body=$('why-body');body.replaceChildren();
  const messages={FOUND:'This Lens selects an exact Directory Entry. The reader checked its parent, name, File Object and publisher charter. The file content has not been read.',
    CONFLICT:'The required sources disagree. No File Object is selected; there is no valid preview or action target to borrow from a losing claim.',
    UNKNOWN:'The selected evidence cannot be interpreted as a valid file here. The reader does not silently substitute a lower-priority claim.',
    MASKED:'This Lens selects a mask at this position. It hides the placement, not the underlying File Object or its bytes.',
    ABSENT:'No agreed value is selected by this Lens at this observation. This does not prove that the file exists nowhere.'};
  body.append(text('p',messages[row.outcome]??'This position is unresolved.'));
  if(observation.rowsEvidence==='PRIOR_SEALED')body.append(text('p','These are prior sealed rows. The latest attempt failed; they are not a fresh complete result.'));
  function facts(items){const dl=document.createElement('dl');for(const [label,value] of items)dl.append(text('dt',label),text('dd',value));return dl;}
  body.append(facts([
    ['Result',row.outcome],['Lens',$('lens').selectedOptions[0].textContent],['Observation',$('snapshot').selectedOptions[0].textContent],
    ['Pinned block',String(observation.basis.blockNumber)+' · host revision '+observation.basis.revision],
    ['Enumeration',observation.coverage],['Availability',row.qualification?.availability??observation.qualification.availability],['Reason',row.reason??'No row error'],
  ]));
  const identity=document.createElement('details');identity.id='identity-details';identity.append(text('summary','Exact identities and verification details'));
  identity.append(facts([
    ['Namespace Plan',config.plans[$('lens').value]],['Mount',config.mounts[$('lens').value]],
    ['Claim source A',config.authors.A],['Claim source B',config.authors.B],
    ['Block hash',observation.basis.blockHash],['Execution set',observation.basis.executionSetId],
    ['Position role',row.fieldRole],['Selected Entry',row.selectedId??'None'],['File Object',row.value?.nodeId??'None'],
    ['File publisher',row.value?.publisher??'Not selected'],['Publisher charter',row.value?row.value.historicalCharter+' · '+row.value.maintenance:'Not selected'],
  ]));body.append(identity);
  body.append(text('p','A and B are named claim sources. A File publisher is a separate fact; a B-priority claim is not proof that B created or signed the file. Integrity is qualified against the configured local source, not independent consensus.','evidence-note'));
  const details=document.createElement('details');details.id='rpc-details';details.append(text('summary','Inspect '+(observation.evidence?.length??0)+' actual read attempts'));
  details.addEventListener('toggle',()=>{if(details.open&&details.children.length===1)details.append(text('pre',stringify(observation.evidence)));});body.append(details);
  $('why').showModal();
}
function render(s,{focusNewFrom=null}={}){
  const priorFocus=document.activeElement?.dataset.why??opener?.dataset.why;
  if($('why').open)closeWhy();
  current=s;const rows=allRows(s),presentation=presentListing(s);
  for(const id of ['rows','attention-rows','history-rows'])$(id).replaceChildren();
  $('attention').hidden=presentation.attention.length===0;$('attention-title').textContent='Needs attention ('+presentation.attention.length+')';
  const past=presentation.history.length;$('history').hidden=past===0;
  $('history-summary').textContent=past+' past or hidden position'+(past===1?'':'s')+' examined';
  for(const row of rows){
    const li=document.createElement('li');li.dataset.role=row.fieldRole;li.dataset.outcome=row.outcome;li.dataset.result=stringify(row);
    if(row.outcome!=='FOUND')li.className='unresolved';
    const usable=row.outcome==='FOUND';
    const title=usable?row.value.name:row.outcome==='MASKED'?'Masked position':row.outcome==='ABSENT'?'No agreed placement':'Unresolved position';
    const info=document.createElement('div');info.append(text('div',title,'row-title'));
    info.append(text('div',usable?'File · '+short(row.value.nodeId)+' · metadata checked':row.outcome+' · position '+short(row.fieldRole),'row-meta'));
    const button=text('button','Why?','why-button');button.type='button';button.dataset.why=row.fieldRole;button.setAttribute('aria-label','Why this result: '+title);
    button.addEventListener('click',()=>explain(row,button));li.append(info,button);
    $(usable?'rows':['ABSENT','MASKED'].includes(row.outcome)?'history-rows':'attention-rows').append(li);
  }
  const unavailable=s.qualification.status!=='QUALIFIED';
  $('coverage').textContent=unavailable?'Read unavailable':s.coverage==='COMPLETE'?'Listing complete':'Partial listing';
  $('status').textContent=presentation.summary;
  $('more').hidden=unavailable||!s.continuation;$('more').setAttribute('aria-disabled','false');$('more').textContent='Load more';
  $('basis').textContent=`Pinned block ${s.basis.blockNumber} · host revision ${s.basis.revision} · ${scope.stats().requests} RPC reads · ${scope.stats().bytes.toLocaleString()} result bytes`;
  main.dataset.block=String(s.basis.blockNumber);main.dataset.revision=s.basis.executionSetId;
  if(focusNewFrom){const added=presentation.files.find(r=>!focusNewFrom.has(r.fieldRole));if(added)$('rows').querySelector(`[data-why="${added.fieldRole}"]`)?.focus();else if(!$('more').hidden)$('more').focus();else $('status').focus();}
  else if(priorFocus){const prior=main.querySelector(`[data-why="${priorFocus}"]`);if(prior&&(!prior.closest('#history')||$('history').open))prior.focus();else $('status').focus();}
}
async function load(g,{keyboard=false}={}){
  if(busy||g!==generation)return;busy=true;main.dataset.state='loading';$('more').setAttribute('aria-disabled','true');$('more').textContent='Reading…';
  $('coverage').textContent='Reading more';$('status').textContent=current?'Checking the next page. Existing rows belong to the previous sealed page.':'Checking the pinned source, Lens and selected metadata…';
  const previous=keyboard?new Set(allRows(current).filter(r=>r.outcome==='FOUND').map(r=>r.fieldRole)):null;
  try{const result=await stream.loadMore();if(g!==generation)return;render(result,{focusNewFrom:previous});}
  catch(e){if(g!==generation)return;$('coverage').textContent='Read unavailable';$('status').textContent='The read could not finish: '+e.message;$('more').hidden=true;}
  finally{if(g===generation){busy=false;main.dataset.state='settled';}}
}
async function refresh(){
  const g=++generation;cancel?.abort();stream?.close();scope?.close();cancel=new AbortController();stream=null;scope=null;current=null;busy=false;
  closeWhy();for(const id of ['rows','attention-rows','history-rows'])$(id).replaceChildren();
  $('attention').hidden=true;$('history').hidden=true;$('history').open=false;
  $('more').hidden=true;$('basis').textContent='';main.dataset.state='loading';delete main.dataset.block;delete main.dataset.revision;
  $('coverage').textContent='Reading observation';$('status').textContent='Checking the pinned source before listing this folder…';
  const selected=config.snapshots.find(s=>s.id===$('snapshot').value);$('scenario').textContent=selected.description;
  try{
    const opened=await reader.open({blockTag:selected.blockTag,signal:cancel.signal});if(g!==generation){opened.scope?.close();return;}
    if(opened.status!=='READY')throw Error(opened.reason);
    scope=opened.scope;stream=openDirectory(scope,{mountId:config.mounts[$('lens').value],pageSize:4});await load(g);
  }catch(e){if(g!==generation)return;$('coverage').textContent='Read unavailable';$('status').textContent='No folder result: '+e.message+'. This is not an empty-folder claim.';main.dataset.state='settled';}
}
$('more').addEventListener('click',event=>{if(!busy)load(generation,{keyboard:event.detail===0});});
for(const id of ['lens','snapshot'])$(id).addEventListener('change',()=>{if(config)refresh();});
$('refresh').addEventListener('click',()=>{if(config)refresh();});
addEventListener('pagehide',()=>{generation++;cancel?.abort();stream?.close();scope?.close();});
try{
  const response=await fetch('/config',{credentials:'omit',cache:'no-store'});if(!response.ok)throw Error('fixture config unavailable');
  config=await boundedJSON(response,1048576);if(config.kind!=='DISPOSABLE_GUEST_FILES')throw Error('unsupported fixture');
  for(const s of config.snapshots){const option=text('option',s.label);option.value=s.id;$('snapshot').append(option);}
  const query=new URLSearchParams(location.search),snapshot=query.get('snapshot'),lens=query.get('lens');
  $('snapshot').value=config.snapshots.some(s=>s.id===snapshot)?snapshot:config.defaultSnapshot;
  $('lens').value=['aFirst','bFirst','exact'].includes(lens)?lens:'aFirst';
  $('delay').textContent=config.injectedDelayMs?`Test transport: ${config.injectedDelayMs} ms injected before each RPC read.`:'Local transport; no injected RPC delay.';
  reader=createFixtureReader({source:createRPCSource({identity:config.expected.source}),context:{expected:config.expected}});await refresh();
}catch(e){$('coverage').textContent='Read unavailable';$('status').textContent='Cannot start this local fixture: '+e.message;main.dataset.state='settled';}
