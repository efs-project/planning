// Presentation qualification is independent of the DOM and never upgrades evidence.
export function folderState(result) {
  if (!result) return {kind:'unknown',label:'Folder not yet read'};
  if (result.knowledge === 'CONFLICT') return {kind:'conflict',label:'Conflicting observations'};
  if (result.knowledge === 'INVALID') return {kind:'invalid',label:'Integrity check failed'};
  if (result.coverage !== 'COMPLETE' || result.nameCoverage === 'PARTIAL') {
    return {kind:'partial',label:'Partial observation — absence is not established'};
  }
  if (result.knowledge === 'ABSENT' && result.value.length === 0) return {kind:'empty',label:'This mounted folder is empty in this Lens'};
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
  if (gas === null || gas === undefined) return null;
  const values = [Number(gas),Number(network.gasGwei),Number(network.extraUsd),Number(ethUsd),Number(transactions)];
  if (values.some(v => !Number.isFinite(v) || v < 0)) return null;
  return values[0]*values[1]*1e-9*values[3]+values[2]*values[4];
}

// Journal receipts are RPC observations, not state proofs. Never count one
// transaction twice or turn missing/contradictory observations into zero cost.
export function receiptTotals(entries) {
  const byHash=new Map(); let unidentified=0;
  for(const entry of entries) {
    const hash=typeof entry.transactionHash==='string'?entry.transactionHash.toLowerCase():null;
    if(!/^0x[0-9a-f]{64}$/.test(hash??'')) {unidentified++;continue;}
    let gas=null;
    try {
      const raw=entry.receipt?.gasUsed;
      if(typeof raw==='string' && /^(?:0x[0-9a-f]+|[0-9]+)$/i.test(raw)) gas=BigInt(raw);
      const receiptHash=entry.receipt?.transactionHash;
      if(receiptHash!==undefined && (typeof receiptHash!=='string' || receiptHash.toLowerCase()!==hash)) gas=null;
    } catch {gas=null;}
    const prior=byHash.get(hash);
    if(byHash.has(hash)) {
      if(!prior || gas===null || prior.gas!==gas) byHash.set(hash,null);
    } else byHash.set(hash,gas===null?null:{entry,gas});
  }
  const known=[...byHash.values()].filter(Boolean);
  return {gas:known.length?known.reduce((sum,row)=>sum+row.gas,0n):null,
    transactions:known.map(row=>row.entry),unknown:unidentified+byHash.size-known.length};
}
