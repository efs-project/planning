import {resolveEconomics,modelAction,toUsd} from './fee-model.mjs';
// Presentation qualification is independent of the DOM and never upgrades evidence.
export function folderState(result) {
  if (!result) return {kind:'unknown',label:'Folder not yet read'};
  if (result.knowledge === 'CONFLICT') return {kind:'conflict',label:'Conflicting observations'};
  if (result.knowledge === 'INVALID') return {kind:'invalid',label:'Integrity check failed'};
  if (result.coverage !== 'COMPLETE' || result.nameCoverage === 'PARTIAL' || result.kindCoverage === 'PARTIAL') {
    return {kind:'partial',label:'Partial observation — absence is not established'};
  }
  if (result.knowledge === 'ABSENT' && result.value.length === 0) return {kind:'empty',label:result.filtered?'No matches in this complete observed query':'This mounted folder is empty in this Lens'};
  if (result.knowledge !== 'PRESENT') return {kind:'unknown',label:'Folder unavailable — not empty'};
  return {kind:'complete',label:'Complete folder traversal'};
}

// Fallback filtering uses valid AND inference: a known nonmatch can exclude a
// row despite another unknown predicate. The joined matcher conservatively
// retains some such rows for diagnostics; this is not a false-absence repair.
export function filterRows(rows, {search='',tag=false,scope='either',exclude=false}={}) {
  let uncertain = 0;
  const visible = rows.filter(row => {
    let unknown = false;
    if (search) {
      if (row.name?.knowledge !== 'PRESENT') unknown = true;
      else if (!row.name.value.toLowerCase().includes(search.toLowerCase())) return false;
    }
    if (tag) {
      const point = row.point;
      const tags = scope === 'file' ? [point?.value?.fileTag] : scope === 'revision'
        ? [point?.value?.revisionTag] : scope === 'placement' ? [point?.value?.locationTag]
        : [point?.value?.fileTag,point?.value?.revisionTag];
      if (point?.coverage !== 'COMPLETE' || point?.knowledge !== 'PRESENT') unknown = true;
      else if (tags.some(t => t?.assessment === 'PRESENT')) { if(exclude)return false; }
      else if (tags.every(t => ['NOT_PRESENT','NOT_APPLICABLE'].includes(t?.assessment))) { if(!exclude)return false; }
      else unknown = true;
    }
    if (unknown) uncertain++;
    return true;
  });
  return {rows:visible,uncertain};
}

export function tagLabel(tag) {
  switch(tag?.assessment){
    case 'PRESENT':return 'present';
    case 'NOT_PRESENT':return tag.selection?.status===2?'masked':'absent';
    case 'NOT_APPLICABLE':return 'not applicable';
    default:return 'unknown';
  }
}

export function canOpen(point) {
  return point?.knowledge === 'PRESENT' && point.coverage === 'COMPLETE'
    && typeof point.value?.revision?.document === 'string';
}

export function estimateUsd(gas, network, ethUsd, transactions=1) {
  // EraVM pricing cannot be inferred from this local EVM receipt.
  if (network?.id === 'zksync') return null;
  const raw = [gas,network?.gasGwei,network?.extraUsd,ethUsd,transactions];
  if (raw.some(v => v === null || v === undefined || v === '')) return null;
  const values = raw.map(Number);
  if (values.some(v => !Number.isFinite(v) || v < 0)) return null;
  const estimate=values[0]*values[1]*1e-9*values[3]+values[2]*values[4];
  return Number.isFinite(estimate)?estimate:null;
}

// Journal receipts are RPC observations, not state proofs. Never count one
// transaction twice or turn missing/contradictory observations into zero cost.
export function receiptTotals(entries) {
  const byHash=new Map(), observations=[];
  for(const entry of entries) {
    const hash=typeof entry.transactionHash==='string'?entry.transactionHash.toLowerCase():null;
    if(!/^0x[0-9a-f]{64}$/.test(hash??'')) {observations.push({entry,gas:null});continue;}
    let gas=null;
    try {
      const raw=entry.receipt?.gasUsed;
      if(typeof raw==='string' && /^(?:0x[0-9a-f]+|[0-9]+)$/i.test(raw)) gas=BigInt(raw);
      const receiptHash=entry.receipt?.transactionHash;
      if(receiptHash!==undefined && (typeof receiptHash!=='string' || receiptHash.toLowerCase()!==hash)) gas=null;
      if(entry.receiptAttribution!==undefined&&entry.receiptAttribution!=='RPC_MATCHED_DIRECT_PLAN')gas=null;
    } catch {gas=null;}
    const prior=byHash.get(hash);
    if(byHash.has(hash)) {
      if(gas===null || prior.gas!==gas || ['to','data','value'].some(key=>entry.transaction?.[key]!==prior.entry.transaction?.[key])) prior.gas=null;
    } else {const row={entry,gas};byHash.set(hash,row);observations.push(row);}
  }
  const known=observations.filter(row=>row.gas!==null);
  return {gas:known.length?known.reduce((sum,row)=>sum+row.gas,0n):null,
    transactions:known.map(row=>row.entry),unknown:observations.length-known.length,observations};
}

const costEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => value === null ? 'Unknown' : value > 0 && value < 0.0001 ? '< $0.0001' : `$${value.toFixed(4)}`;

export function costPresentation(entries, config, ethers) {
  const economics=resolveEconomics(config);
  const totals=receiptTotals(entries);
  const networks=economics.networks.map((n,index)=>({...n,index}));
  const qualify=(model,network,count=1)=>({...model,
    usd:toUsd(model.scenarioWei,economics,network,count),
    executionUsd:toUsd(model.executionWei,economics,{...network,extraUsd:0}),
    dataUsd:toUsd(model.dataWei,economics,{...network,extraUsd:0}),
    operatorUsd:toUsd(model.operatorWei,economics,{...network,extraUsd:0})});
  const all=totals.observations.map(({entry,gas})=>{
    const models=modelAction(entry,gas,economics,ethers);
    for(const network of networks)models[network.id]=qualify(models[network.id],network);
    return {label:entry.plan?.operation??'Unknown action',status:entry.status??'Unknown status',gas,models,
      ...Object.fromEntries(networks.map(n=>[n.id,models[n.id].usd])),zksync:null};
  });
  const total={label:totals.unknown?'Known subtotal':'Recorded total',gas:totals.gas,models:{},zksync:null};
  for(const network of networks){
    const models=all.map(row=>row.models[network.id]);
    const sum=key=>{const values=models.map(m=>m[key]).filter(v=>v!==null);return values.length?values.reduce((a,b)=>a+b,0n):null;};
    const incomplete=models.some(m=>m.scenarioWei===null);
    const model=qualify({executionWei:sum('executionWei'),dataWei:sum('dataWei'),operatorWei:sum('operatorWei'),scenarioWei:incomplete?null:sum('scenarioWei')},network,all.length);
    model.knownScenarioUsd=toUsd(sum('scenarioWei'),economics,network,models.filter(m=>m.scenarioWei!==null).length);
    model.incomplete=incomplete;total.models[network.id]=model;total[network.id]=model.usd;
    if(incomplete)total.label='Known subtotal';
  }
  const headline=total.base===null
    ? `Base estimate unavailable${entries.length?'':' · no receipts'}${totals.unknown?` · ${totals.unknown} unknown`:''}`
    : `Base ≲ ${money(total.base)} practical data-bound scenario`;
  const receiptSummary=`${totals.gas===null?'No recorded':totals.gas.toLocaleString('en-US')} local gas · ${totals.transactions.length} receipts${totals.unknown?` · ${totals.unknown} unknown`:''}`;
  return {columns:['Action','Gas','Ethereum L1','Base','Arbitrum','ZKsync'],networks,rows:all.slice(0,5),total,headline,receiptSummary,totals};
}

export function renderCostTable(view) {
  const fee=(row,id)=>{const m=row.models[id];return `<td${id==='base'?' class="base-estimate"':''}>${costEscape(money(row[id]))}<small>${id==='ethereum'?'execution model':id==='base'?'practical bound, not guarantee':'uncompressed-data scenario'}</small><small>execution ${costEscape(money(m.executionUsd))}${id!=='ethereum'?` · data ${costEscape(money(m.dataUsd))} · operator ${costEscape(money(m.operatorUsd))}`:''}${m.unsignedBytes?` · ${m.unsignedBytes} unsigned bytes`:''}${m.incomplete?' · known components only':''}</small>${m.incomplete&&m.knownScenarioUsd!==null?`<small>complete-action subtotal ${costEscape(money(m.knownScenarioUsd))}; remaining unknown</small>`:''}</td>`;};
  const cells=row=>`<th scope="row">${costEscape(row.label)}${row.status?`<small>${costEscape(row.status)}</small>`:''}</th><td>${row.gas===null?'Unknown':row.gas.toLocaleString('en-US')}</td>${['ethereum','base','arbitrum'].map(id=>fee(row,id)).join('')}<td>Not measured</td>`;
  return `<div class="cost-table-scroll" role="region" aria-label="Recent action costs" tabindex="0"><table class="cost-grid"><caption>Recent actions (up to 5); total includes all journal receipts</caption><thead><tr>${view.columns.map(label=>`<th scope="col">${costEscape(label)}</th>`).join('')}</tr></thead><tbody>${view.rows.map(row=>`<tr>${cells(row)}</tr>`).join('')||'<tr><td colspan="6">No local actions recorded yet.</td></tr>'}</tbody><tfoot><tr>${cells(view.total)}</tr></tfoot></table></div>`;
}
