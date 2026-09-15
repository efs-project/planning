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

export function filterRows(rows, {search='',tag=false,scope='either'}={}) {
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
        ? [point?.value?.revisionTag] : [point?.value?.fileTag,point?.value?.revisionTag];
      if (point?.coverage !== 'COMPLETE' || point?.knowledge !== 'PRESENT' || tags.some(t => !t?.evaluated)) unknown = true;
      else if (!tags.some(t => t.present)) return false;
    }
    if (unknown) uncertain++;
    return true;
  });
  return {rows:visible,uncertain};
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
    } catch {gas=null;}
    const prior=byHash.get(hash);
    if(byHash.has(hash)) {
      if(gas===null || prior.gas!==gas) prior.gas=null;
    } else {const row={entry,gas};byHash.set(hash,row);observations.push(row);}
  }
  const known=observations.filter(row=>row.gas!==null);
  return {gas:known.length?known.reduce((sum,row)=>sum+row.gas,0n):null,
    transactions:known.map(row=>row.entry),unknown:observations.length-known.length,observations};
}

const costEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => value === null ? 'Unknown' : value > 0 && value < 0.0001 ? '< $0.0001' : `$${value.toFixed(4)}`;

// Browser-only projection of the existing timestamped config. Preserve source
// indices so edits affect the intended network even with the old four-chain config.
export function costPresentation(entries, economics) {
  const totals=receiptTotals(entries);
  const configured=Array.isArray(economics?.networks)?economics.networks:[];
  const networks=['ethereum','base'].flatMap(id=>{
    const index=configured.findIndex(network=>network.id===id);
    return index<0?[]:[{...configured[index],index,label:id==='ethereum'?'Ethereum L1':'Base'}];
  });
  const costs=(gas,transactions=1)=>Object.fromEntries(['ethereum','base'].map(id=>[
    id,estimateUsd(gas,networks.find(network=>network.id===id),economics?.ethUsd,transactions),
  ]));
  const rows=totals.observations.slice(0,5).map(({entry,gas})=>({
    label:entry.plan?.operation??'Unknown action',status:entry.status??'Unknown status',
    gas,...costs(gas),zksync:null,
  }));
  const total={label:totals.unknown?'Known subtotal':'Recorded total',gas:totals.gas,
    ...costs(totals.gas,totals.transactions.length),zksync:null};
  const headline=total.base===null
    ? `Base estimate unavailable${entries.length?'':' · no receipts'}${totals.unknown?` · ${totals.unknown} unknown`:''}`
    : `Base ≈ ${money(total.base)} ${totals.unknown?`known subtotal · ${totals.unknown} unknown`:'estimated'}`;
  const receiptSummary=`${totals.gas===null?'No recorded':totals.gas.toLocaleString('en-US')} local gas · ${totals.transactions.length} receipts${totals.unknown?` · ${totals.unknown} unknown`:''}`;
  return {columns:['Action','Gas','Ethereum L1','Base','ZKsync'],networks,rows,total,headline,receiptSummary,totals};
}

export function renderCostTable(view) {
  const cells=row=>`<th scope="row">${costEscape(row.label)}${row.status?`<small>${costEscape(row.status)}</small>`:''}</th><td>${row.gas===null?'Unknown':row.gas.toLocaleString('en-US')}</td><td>${costEscape(money(row.ethereum))}</td><td class="base-estimate">${costEscape(money(row.base))}</td><td>Not measured</td>`;
  return `<div class="cost-table-scroll" role="region" aria-label="Recent action costs" tabindex="0"><table class="cost-grid"><caption>Recent actions (up to 5); total includes all journal receipts</caption><thead><tr>${view.columns.map(label=>`<th scope="col">${costEscape(label)}</th>`).join('')}</tr></thead><tbody>${view.rows.map(row=>`<tr>${cells(row)}</tr>`).join('')||'<tr><td colspan="5">No local actions recorded yet.</td></tr>'}</tbody><tfoot><tr>${cells(view.total)}</tr></tfoot></table></div>`;
}
