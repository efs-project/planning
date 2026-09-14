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

export function estimateUsd(gas, network, ethUsd) {
  if (gas === null || gas === undefined) return null;
  const values = [Number(gas),Number(network.gasGwei),Number(network.extraUsd),Number(ethUsd)];
  if (values.some(v => !Number.isFinite(v) || v < 0)) return null;
  return values[0]*values[1]*1e-9*values[3]+values[2];
}
