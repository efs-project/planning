import * as E from '/ethers.js';
import {createClient,validateName,ZERO,START} from '/client.mjs';
import {COST_PRESET} from '/cost-ledger.mjs';
const $=id=>document.getElementById(id);
const text=(id,value)=>{$(id).textContent=value;};
let client,config,path=[],parent=null,selected,opened,busy=false,writable=null,navEpoch=0,readHash=null,routePending=false,journalKey;
const journal=[];
const mutations=['create-text','create-folder','upload-button','save','rename-button','unlink'];
function invalidate(){parent=null;writable=null;selected=null;$('file-controls').hidden=true;}
function canWrite(){return !!writable&&writable.hash===location.hash&&!client?.unresolved().length;}
function requireWritable(){if(!canWrite())throw Error('No qualified writable folder. Resolve navigation or reconcile, then explicitly reload.');}
function controls(){document.querySelectorAll('button,input,textarea').forEach(b=>b.disabled=busy);for(const id of mutations)$(id).disabled=busy||!canWrite();document.querySelectorAll('[data-mutation]').forEach(b=>b.disabled=busy||!canWrite());$('reconcile').disabled=busy||!client?.unresolved().length;}
function updateJournal(a){const i=journal.findIndex(x=>x.hash===a.hash);if(i<0)journal.push(a);else journal[i]=a;localStorage.setItem(journalKey,JSON.stringify(journal));paintGas();}
function button(label,action){const b=document.createElement('button');b.textContent=label;b.disabled=busy;b.onclick=()=>run(action);return b;}
function paintGas(){
  const known=journal.reduce((n,a)=>n+(a.gasUsed==null?0n:BigInt(a.gasUsed)),0n),unknown=journal.filter(a=>a.gasUsed==null).length,unresolved=client?.unresolved().length??journal.filter(a=>['SUBMITTING','SUBMISSION_UNKNOWN','VERIFICATION_UNKNOWN'].includes(a.status)).length;
  const models=gas=>COST_PRESET.feeSnapshots.map(p=>`${p.chainFamily}: $${(Number(gas)*Number(p.executionGasPriceWei)/1e18*Number(COST_PRESET.fxSnapshot.usdPerEth)).toFixed(6)}`).join(' · ');
  text('gas-summary',`Known receipt gas: ${known} · ${unresolved} unresolved · ${unknown} unknown gas amounts. ${models(known)} (known-receipt execution MODEL totals; unknown costs excluded, not zero)`);
  text('gas-toggle',`Gas ${known}${unknown?' + ?':''} · ${models(known).split(' · ')[0].replace('ethereum: ','')} MODEL · ${unresolved} unresolved`);
  $('gas-journal').replaceChildren();
  for(const a of journal.slice().reverse()){
    const div=document.createElement('div');div.className='gas-entry';const title=document.createElement('strong');title.textContent=`${a.label} · ${a.gasUsed==null?'unknown gas':a.gasUsed+' gas'} · ${a.status}`;div.append(title);
    const prices=a.gasUsed==null?'Unknown cost — receipt unresolved':models(a.gasUsed);
    const p=document.createElement('p');p.textContent=prices+' (execution MODEL only)';div.append(p);const hash=document.createElement('small');hash.textContent=a.hash;div.append(hash);$('gas-journal').append(div);
  }
}
async function run(action){
  if(busy)return;busy=true;text('error','');document.querySelectorAll('button,input,textarea').forEach(b=>b.disabled=true);
  try{await action();}catch(e){text('error',e.message);}
  finally{busy=false;controls();paintGas();if(routePending){routePending=false;await run(reload);}}
}
function decodePath(){return location.hash.slice(1).split('/').filter(Boolean).map(x=>validateName(decodeURIComponent(x)));}
async function browse(next){const hash=next.map(encodeURIComponent).join('/');invalidate();text('file-title','Open a file');if(location.hash.slice(1)===hash)await reload();else{location.hash=hash;routePending=true;}}
async function reload(){
  const epoch=++navEpoch,hash=location.hash;readHash=hash;routePending=false;invalidate();path=decodePath();
  $('files').replaceChildren();text('listing-state','Reading canonical state…');
  try{
    const basis=await client.observe();
    const resolvedParent=(await client.call('resolve',[config.namespace,path.map(n=>E.toUtf8Bytes(n))],basis)).value;
    if(resolvedParent===ZERO)throw Error('Folder absent or namespace uninitialized; this seeded demo expects an initialized root');
    const rows=[];let cursor=START,complete=false,generation;
    for(let page=0;page<128;page++){
      const result=await client.list(config.namespace,resolvedParent,{cursor,limit:32,basis});rows.push(...result.value.entries);generation=result.value.generation;
      if(result.value.complete){complete=true;break;}cursor=result.value.next;
    }
    if(!complete)throw Error('Listing exceeds client 4096-row bound; incomplete, not empty');
    if(epoch!==navEpoch||hash!==location.hash)throw Error('Navigation changed during read; writable context discarded');
    parent=resolvedParent;writable={parent,hash,basis};
    rows.sort((a,b)=>Number(b.directory)-Number(a.directory)||a.name.localeCompare(b.name));
    $('breadcrumbs').replaceChildren(button('Files',()=>browse([])));
    path.forEach((part,i)=>$('breadcrumbs').append(button(part,()=>browse(path.slice(0,i+1)))));
    for(const row of rows){const tr=document.createElement('tr');const name=document.createElement('td');name.append(button(row.name,()=>row.directory?browse([...path,row.name]):open(row.id,row.name)));tr.append(name);for(const value of [row.directory?'Folder':'File',String(row.revision)]){const td=document.createElement('td');td.textContent=value;tr.append(td);}const td=document.createElement('td');if(row.directory){const remove=button('Remove empty folder',async()=>{requireWritable();if(confirm('Permanently unlink this empty folder?')){await client.write('unlink',[row.id,row.revision]);await reload();}});remove.dataset.mutation='true';td.append(remove);}tr.append(td);$('files').append(tr);}
    text('listing-state',rows.length?`${rows.length} entries · checked index generation ${generation}`:'Empty directory · successful canonical read');
    text('basis',JSON.stringify({...basis,namespace:config.namespace},null,2));
  }catch(error){text('listing-state','Read failed — no empty-state claim');throw error;}
}
async function open(id,name){
  const hash=location.hash,epoch=navEpoch;
  const basis=await client.observe(),info=(await client.call('fileInfo',[id],basis)).value;
  if(!info.live||info.directory)throw Error('Not a live regular file');
  const record=await client.record(info.recordId,basis);
  if(record.value.typeId!==config.bytesType)throw Error('File has another exact Type; this editor supports the registered bytes profile only');
  const bytes=E.getBytes(E.AbiCoder.defaultAbiCoder().decode(['bytes'],record.value.body)[0]);
  const placement=(await client.call('revisionAt',[id,info.revision],basis)).value;
  if(epoch!==navEpoch||hash!==location.hash||!writable||placement.parent!==writable.parent)throw Error('File observation no longer belongs to the current folder');
  selected={id,name,revision:info.revision,recordId:info.recordId};opened=bytes;
  let decoded;try{decoded=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{decoded=null;}
  text('file-title',name);text('file-state',`Revision ${info.revision} · Verified ${bytes.length} bytes${decoded===null?' · not UTF-8; download exact bytes':''}`);
  $('file-text').value=decoded??'';$('file-text').readOnly=decoded===null;$('save').hidden=decoded===null;$('rename').value=name;$('file-controls').hidden=false;$('history').replaceChildren();text('history-bytes','');
}
async function createFile(name,bytes){requireWritable();validateName(name);const exact=client.body(bytes),target=parent;const action=await client.write('createFile',[target,E.toUtf8Bytes(name),config.bytesType,exact],'Create '+name);await reload();if(parent!==target)return;await open(action.fileId,name);if(selected.recordId!==client.recordId(config.bytesType,exact))throw Error('Committed file does not match requested bytes');}
$('reload').onclick=()=>run(reload);
$('create-text').onclick=()=>run(()=>createFile($('new-name').value,E.toUtf8Bytes($('new-text').value)));
$('create-folder').onclick=()=>run(async()=>{requireWritable();const name=validateName($('new-name').value);await client.write('createDirectory',[parent,E.toUtf8Bytes(name)],'Create folder '+name);await reload();});
$('upload-button').onclick=()=>run(async()=>{const f=$('upload').files[0];if(!f)throw Error('Choose a file');if(f.size>4032)throw Error('Upload exceeds 4032 bytes');await createFile(f.name,new Uint8Array(await f.arrayBuffer()));});
$('save').onclick=()=>run(async()=>{requireWritable();const s=selected,exact=client.body(E.toUtf8Bytes($('file-text').value));await client.write('editFile',[s.id,s.revision,config.bytesType,exact],'Edit '+s.name);await reload();await open(s.id,s.name);if(selected.revision!==s.revision+1n||selected.recordId!==client.recordId(config.bytesType,exact))throw Error('Edit canonical verification failed');});
$('rename-button').onclick=()=>run(async()=>{requireWritable();const s=selected,name=validateName($('rename').value);await client.write('moveFile',[s.id,s.revision,parent,E.toUtf8Bytes(name)],'Rename '+s.name);await reload();if((await client.call('lookup',[config.namespace,parent,E.toUtf8Bytes(name)])).value!==s.id)throw Error('Rename canonical verification failed');await open(s.id,name);});
$('unlink').onclick=()=>run(async()=>{requireWritable();const s=selected;if(!confirm('Unlink permanently? Historical public bytes remain; restore is not supported.'))return;await client.write('unlink',[s.id,s.revision],'Unlink '+s.name);if((await client.call('fileInfo',[s.id])).value.live)throw Error('Unlink canonical verification failed');selected=null;$('file-controls').hidden=true;text('file-title','File unlinked');await reload();});
$('download').onclick=()=>{const url=URL.createObjectURL(new Blob([opened],{type:'application/octet-stream'}));const a=document.createElement('a');a.href=url;a.download=selected.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('history-button').onclick=()=>run(async()=>{
  const s=selected,basis=await client.observe();$('history').replaceChildren();
  if(s.revision>128n)throw Error('History exceeds 128-revision client bound');
  for(let rev=1n;rev<=s.revision;rev++){
    const r=(await client.call('revisionAt',[s.id,rev],basis)).value;const li=document.createElement('li');li.append(button(`Open revision ${rev}`,async()=>{const record=await client.record(r.recordId,basis);if(record.value.typeId!==config.bytesType)throw Error('Historical Type unsupported by text viewer');const bytes=E.getBytes(E.AbiCoder.defaultAbiCoder().decode(['bytes'],record.value.body)[0]);let display;try{display=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{display=E.hexlify(bytes);}text('history-bytes',`Verified revision ${rev} · ${bytes.length} bytes\n${display}`);}));const note=document.createElement('small');note.textContent=` ${E.toUtf8String(r.name)} · ${r.live?'live':'unlinked'}`;li.append(note);$('history').append(li);
  }
});
$('gas-toggle').onclick=()=>{$('gas-drawer').hidden=!$('gas-drawer').hidden;};
$('reconcile').onclick=()=>run(async()=>{const result=await client.reconcile();if(client.unresolved().length)throw Error(`${result.status}: no final receipt/effect yet. No transaction was resent.`);await reload();});
$('read-quote').onclick=()=>run(async()=>{const i=new E.Interface(config.consumerAbi),r=await client.call('read',[config.kernel,config.producer,config.quoteType],undefined,config.consumer,i);text('quote-state',`Consumer observed ${r.value[0]} at revision ${r.value[2]} · ${r.basis.blockHash}`);});
window.addEventListener('hashchange',()=>{if(readHash===location.hash&&(busy||writable?.hash===location.hash))return;navEpoch++;invalidate();controls();routePending=true;if(!busy){routePending=false;void run(reload);}});
await run(async()=>{config=await(await fetch('/config.json')).json();journalKey=`efs21-journal:${config.chainId}:${config.genesisHash}:${config.kernel}:${config.deploymentBlockHash}`;const saved=JSON.parse(localStorage.getItem(journalKey)??'[]');if(!Array.isArray(saved))throw Error('Saved journal malformed; cannot safely determine unresolved actions');journal.push(...saved);client=createClient(E,config,{initialActions:journal,onAction:updateJournal});await reload();});
