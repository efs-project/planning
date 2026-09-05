import { taggedJson } from './model.mjs';

const lower = value => String(value ?? '').toLowerCase();
const kinds = { 1: 'u64', 2: 'bool', 3: 'bytes32', 4: 'ASCII', 5: 'Record reference' };
const sameBasis = (a, b) => Boolean(a?.blockHash && b?.blockHash) &&
  ['chainId', 'blockNumber', 'blockHash', 'timestamp'].every(key => lower(a[key]) === lower(b[key]));
const sameDomain = (a, b) => ['realmId', 'core', 'profile'].every(key => Boolean(a?.[key]) && lower(a[key]) === lower(b?.[key]));
const validResult = result => result?.outcome === 'FOUND' && result?.qualification?.coverage === 'COMPLETE' &&
  result.qualification.support === 'SUPPORTED' && result.qualification.validation === 'VALID' && result.qualification.availability === 'AVAILABLE';
const fail = code => { throw new Error(code); };
const rawError = error => ({ name: error?.name ?? 'Error', message: error?.message ?? String(error), ...(error?.code != null ? { code: error.code } : {}), ...(error?.data != null ? { data: error.data } : {}) });

function requireContext(result, basis, domain, subject) {
  if (!sameBasis(result?.basis, basis)) fail('MIXED_READ_BASIS');
  if (!sameDomain(result?.domain, domain)) fail('MIXED_READ_DOMAIN');
  if (subject != null && lower(result?.domain?.subject) !== lower(subject)) fail('EXACT_SUBJECT_MISMATCH');
}

function failedStatus(result, error) {
  const q = result?.qualification ?? {};
  if (q.support === 'UNSUPPORTED' || /UNSUPPORTED/.test(error ?? '')) return 'UNSUPPORTED';
  if (q.integrity === 'FAILED' || q.validation === 'INVALID' || /MISMATCH|MIXED_|INVALID_|NON_CANONICAL/.test(error ?? '')) return 'FAILED';
  if (q.availability === 'UNAVAILABLE' || result?.outcome === 'ABSENT_PROVEN') return 'UNAVAILABLE';
  return 'UNKNOWN';
}

function fieldDto(field, value, index) {
  let text;
  if (field.tag === 1) {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) fail('INVALID_U64_PRECISION');
    if (!/^[0-9]+$/.test(String(value))) fail('INVALID_U64_VALUE');
    const number = BigInt(value);
    if (number > 18446744073709551615n) fail('INVALID_U64_VALUE');
    text = number.toString();
  } else if (field.tag === 2) {
    if (typeof value !== 'boolean') fail('INVALID_BOOL_VALUE');
    text = String(value);
  } else text = String(value);
  return { index, path: [index], tag: field.tag, kind: kinds[field.tag], state: 'VALID', value: text, ...(field.schemaId ? { schemaId: field.schemaId } : {}) };
}

// Each row retains every observed hop, even when a later hop cannot be admitted.
export async function readDataRow({ sdk, utilities, id, basis, domain, isCurrent = () => true }) {
  const row = { id, schemaId: null, status: 'UNKNOWN', reasonCode: null, fields: [], columns: [], evidence: { basis, recordId: id } };
  let latest;
  try {
    latest = row.evidence.record = await sdk.readExact({ kind: 'record', id, blockTag: basis });
    if (!isCurrent()) return null;
    requireContext(latest, basis, domain, id);
    if (!validResult(latest) || latest.qualification.currentness !== 'CURRENT_AT_BASIS') fail(latest.reasonCode ?? 'RECORD_NOT_QUALIFIED');
    const record = latest.value;
    if (!record?.schemaId || !record?.contentId) fail('INVALID_RECORD_IDENTITY');
    row.schemaId = lower(record.schemaId);
    latest = row.evidence.schema = await sdk.readExact({ kind: 'schema', id: row.schemaId, blockTag: basis });
    if (!isCurrent()) return null;
    requireContext(latest, basis, domain, row.schemaId);
    if (!validResult(latest) || latest.qualification.integrity !== 'VERIFIED' || latest.qualification.currentness !== 'CURRENT_AT_BASIS') fail(latest.reasonCode ?? 'SCHEMA_NOT_QUALIFIED');
    if (typeof utilities?.deriveSchemaId !== 'function' || typeof utilities?.parseSchema !== 'function') fail('UNSUPPORTED_SCHEMA_UTILITIES');
    const descriptor = latest.value;
    if (lower(utilities.deriveSchemaId(descriptor)) !== row.schemaId) fail('SCHEMA_ID_MISMATCH');
    row.columns = utilities.parseSchema(descriptor).map((field, index) => ({ ...field, index, kind: kinds[field.tag], name: `Field ${index + 1} · ${kinds[field.tag]} (tag ${field.tag})` }));
    latest = row.evidence.payload = await sdk.readVerifiedBytes({ contentId: record.contentId, blockTag: basis });
    if (!isCurrent()) return null;
    requireContext(latest, basis, domain, record.contentId);
    if (!validResult(latest) || latest.qualification.integrity !== 'VERIFIED' || latest.qualification.bytes !== 'RETURNED' || latest.qualification.currentness !== 'CURRENT_AT_BASIS' || latest.value?.bytes == null) fail(latest.reasonCode ?? 'TYPED_PAYLOAD_BYTES_UNVERIFIED');
    if (typeof utilities?.deriveRecordId !== 'function') fail('UNSUPPORTED_RECORD_IDENTITY_UTILITY');
    row.evidence.computedRecordId = utilities.deriveRecordId({ schemaId: row.schemaId, data: latest.value.bytes });
    if (lower(row.evidence.computedRecordId) !== lower(id)) fail('RECORD_ID_MISMATCH');
    latest = row.evidence.decoded = await sdk.validateTypedPayloadAtBasis({ schemaId: row.schemaId, data: latest.value.bytes, blockTag: basis });
    if (!isCurrent()) return null;
    requireContext(latest, basis, domain, row.schemaId);
    // Typed validation is a pure check at its returned basis; SDK currentness is
    // deliberately UNKNOWN here, so retain it instead of upgrading that axis.
    if (!validResult(latest) || latest.valid !== true || latest.qualification.integrity !== 'VERIFIED') fail(latest.reasonCode ?? 'TYPED_VALIDATION_UNESTABLISHED');
    if (lower(latest.descriptor) !== lower(descriptor) || lower(latest.computedSchemaId) !== row.schemaId) fail('SCHEMA_ID_MISMATCH');
    if (!Array.isArray(latest.fields) || latest.fields.length !== row.columns.length) fail('INVALID_FIELD_COUNT');
    row.fields = row.columns.map((field, index) => fieldDto(field, latest.fields[index], index));
    row.status = 'VALIDATED';
  } catch (error) {
    if (!isCurrent()) return null;
    row.reasonCode = error?.message ?? String(error);
    row.evidence.error = rawError(error);
    row.status = failedStatus(latest, row.reasonCode);
  }
  return row;
}

export function groupDataRows(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = row.schemaId ?? null;
    if (!groups.has(key)) groups.set(key, { schemaId: key, rows: [], columns: [] });
    const group = groups.get(key);
    group.rows.push(row);
    if (!group.columns.length && row.columns.length) group.columns = row.columns;
  }
  return [...groups.values()];
}

export function selectDataRows(rows, { schemaId = null, filter = '', sort = 'record', direction = 'asc' } = {}) {
  const needle = String(filter).toLowerCase();
  const selected = rows.filter(row => row.schemaId === schemaId && (!needle || [row.id, row.status, row.reasonCode, ...row.fields.map(field => field.value)].join(' ').toLowerCase().includes(needle)));
  const fieldIndex = sort.startsWith('field:') ? Number(sort.slice(6)) : null;
  return selected.sort((a, b) => {
    const af = fieldIndex == null ? null : a.fields[fieldIndex];
    const bf = fieldIndex == null ? null : b.fields[fieldIndex];
    // Unavailable values remain last in both directions; they are not zero.
    if (fieldIndex != null && (!af || !bf)) return af ? -1 : bf ? 1 : String(a.id).localeCompare(String(b.id));
    const av = af?.value ?? (sort === 'status' ? a.status : String(a.id));
    const bv = bf?.value ?? (sort === 'status' ? b.status : String(b.id));
    const compared = af?.tag === 1 && bf?.tag === 1 ? (BigInt(av) < BigInt(bv) ? -1 : BigInt(av) > BigInt(bv) ? 1 : 0) : av.localeCompare(bv);
    return (direction === 'desc' ? -compared : compared) || String(a.id).localeCompare(String(b.id));
  });
}

export function createDataInventory({ sdk, utilities, onChange = () => {}, onBasis = () => {} }) {
  let generation = 0;
  let active = false;
  let state = empty();
  function empty() { return { rows: [], pages: [], basis: null, domain: null, next: 0n, total: null, coverage: 'UNKNOWN', loading: false, pageError: null, generation }; }
  function emit(patch) { state = { ...state, ...patch }; onChange(state); }
  const current = token => active && token === generation;

  async function loadMore() {
    if (!active || state.loading || state.coverage === 'COMPLETE') return;
    const token = generation;
    const before = state;
    emit({ loading: true, pageError: null });
    let result;
    try {
      result = await sdk.readPage({ kind: 'records', cursor: before.next, limit: 4, blockTag: before.basis ?? 'latest' });
      if (!current(token)) return;
      const q = result?.qualification ?? {};
      if (!['FOUND', 'ABSENT_PROVEN'].includes(result?.outcome) || q.support !== 'SUPPORTED' || q.validation !== 'VALID' || q.currentness !== 'CURRENT_AT_BASIS' || q.availability !== 'AVAILABLE' || !['COMPLETE', 'PARTIAL'].includes(q.coverage) || !result.basis?.blockHash) fail(result?.reasonCode ?? 'PAGE_NOT_QUALIFIED');
      if (before.basis) requireContext(result, before.basis, before.domain);
      if (!sameDomain(result.domain, result.domain)) fail('INVALID_PAGE_DOMAIN');
      const items = result.items;
      const next = BigInt(result.next);
      const total = BigInt(result.total);
      if (!Array.isArray(items) || items.length > 4 || BigInt(result.cursor) !== before.next || next !== before.next + BigInt(items.length) || next > total || total < 0n || (before.total != null && total !== before.total) || (next < total && !items.length)) fail('INVALID_PAGE_CONTINUATION');
      if (new Set([...before.rows.map(row => lower(row.id)), ...items.map(lower)]).size !== before.rows.length + items.length) fail('DUPLICATE_PAGE_RECORD');
      if (next < total && (BigInt(result.continuation?.cursor ?? -1) !== next || BigInt(result.continuation?.total ?? -1) !== total || !sameBasis(result.continuation?.basis, result.basis) || !sameDomain(result.continuation?.domain, result.domain))) fail('INVALID_PAGE_CONTINUATION');
      if (next === total && result.continuation != null) fail('INVALID_PAGE_CONTINUATION');
      if (result.pageCoverage !== (next === total ? 'PAGE_COMPLETE' : 'PAGE_PARTIAL')) fail('INVALID_PAGE_COVERAGE');
      const rows = await Promise.all(items.map(id => readDataRow({ sdk, utilities, id, basis: result.basis, domain: result.domain, isCurrent: () => current(token) })));
      if (!current(token)) return;
      emit({ rows: [...before.rows, ...rows], pages: [...before.pages, result], basis: result.basis, domain: result.domain, next, total, coverage: next === total ? 'COMPLETE' : 'PARTIAL', loading: false, pageError: null });
      if (current(token)) onBasis(result.basis);
    } catch (error) {
      if (!current(token)) return;
      emit({ loading: false, coverage: before.rows.length ? 'PARTIAL' : 'UNKNOWN', pageError: { reasonCode: error?.message ?? String(error), result, error: rawError(error) } });
    }
  }
  return {
    snapshot: () => state,
    async refresh() { generation += 1; active = true; state = empty(); onChange(state); await loadMore(); },
    loadMore,
    deactivate() { active = false; generation += 1; },
  };
}

export function createDataView({ root, sdk, config = {}, utilities, onEvidence = () => {}, onStatus = () => {}, onBasis = () => {}, navigate }) {
  const doc = root.ownerDocument;
  let active = false;
  let selection = null;
  let selectedSchema;
  let filter = '';
  let sort = 'record';
  let direction = 'asc';
  let generation = 0;
  let snapshot;
  const el = (tag, text, props = {}) => Object.assign(doc.createElement(tag), text == null ? props : { textContent: text, ...props });
  const notice = el('div', 'Select Data to read the typed inventory.', { id: 'data-notice', className: 'notice quiet' }); notice.setAttribute('role', 'status');
  const title = el('div'); title.append(el('p', 'Read-only · one exact-schema table', { className: 'eyebrow' }), el('h1', 'Data inspector', { id: 'data-title' }), el('p', 'Loaded inventory only. Schema identity, coverage, and raw evidence stay explicit.'));
  const refreshButton = el('button', 'Refresh basis', { id: 'refresh-data' });
  const head = el('div', null, { className: 'view-head' }); head.append(title, refreshButton);
  const toolbar = el('div', null, { className: 'actions data-toolbar' }); toolbar.style.flexWrap = 'wrap';
  const schemaSelect = el('select', null, { id: 'data-schema-select' }); schemaSelect.style.maxWidth = '100%';
  const schemaLabel = el('label', 'Exact schema '); schemaLabel.append(schemaSelect);
  const filterInput = el('input', null, { id: 'data-filter', placeholder: 'Filter loaded rows', type: 'search' });
  const filterLabel = el('label', 'Loaded filter '); filterLabel.append(filterInput);
  const sortSelect = el('select', null, { id: 'data-sort' });
  const sortLabel = el('label', 'Sort loaded rows '); sortLabel.append(sortSelect);
  const directionButton = el('button', 'Ascending', { id: 'data-sort-direction' });
  const copyButton = el('button', 'Copy loaded rows', { id: 'copy-data-rows' });
  toolbar.append(schemaLabel, filterLabel, sortLabel, directionButton, copyButton);
  const counts = el('p', '', { id: 'data-counts' });
  const pinned = el('p', '', { id: 'data-basis' }); pinned.style.overflowWrap = 'anywhere';
  const table = el('table', null, { className: 'file-table data-table', id: 'data-table' });
  const tableHead = el('thead'); const body = el('tbody', null, { id: 'record-list' }); table.append(tableHead, body);
  const wrap = el('div', null, { className: 'file-table-wrap' }); wrap.append(table);
  const moreButton = el('button', 'Load more records', { id: 'load-more-data' });
  const card = el('div', 'No record selected.', { className: 'schema-card', id: 'schema-card' });
  const inspector = el('article', null, { className: 'preview' }); inspector.append(el('h2', 'Selected record'), card);
  root.replaceChildren(head, notice, toolbar, counts, pinned, wrap, moreButton, inspector);

  function inventoryEvidence() {
    return { basis: snapshot.basis, qualification: { coverage: snapshot.coverage }, loadedCount: snapshot.rows.length, total: snapshot.total, pages: snapshot.pages, pageError: snapshot.pageError };
  }

  function select(row) {
    if (!active || !snapshot.rows.includes(row)) return;
    selection = row;
    card.replaceChildren();
    card.append(el('p', `${row.status}${row.reasonCode ? ` · ${row.reasonCode}` : ''}`), el('code', row.id), el('p', `Exact schema: ${row.schemaId ?? 'not established'}`));
    if (row.fields.length) {
      const fields = el('table', null, { className: 'field-table' });
      for (const field of row.fields) {
        const tr = el('tr'); tr.append(el('th', `Field ${field.index + 1} · ${field.kind} (tag ${field.tag})`), el('td', field.value)); fields.append(tr);
      }
      card.append(fields);
    } else card.append(el('p', 'Decoded fields unavailable. Failed or unsupported reads remain in the inventory.'));
    const raw = el('details'); raw.append(el('summary', 'Raw record, schema, payload & validation evidence'), el('pre', taggedJson(row.evidence))); card.append(raw);
    for (const item of body.children) item.setAttribute('aria-selected', String(item.dataset.id === row.id));
    onEvidence('Exact-schema record composite', { ...row.evidence, status: row.status, reasonCode: row.reasonCode, fields: row.fields, inventory: inventoryEvidence() });
    onStatus(`Record ${row.status.toLowerCase()} · evidence retained`);
  }

  function renderRows() {
    const group = groupDataRows(snapshot.rows).find(item => item.schemaId === selectedSchema);
    const columns = group?.columns ?? [];
    const rows = selectDataRows(snapshot.rows, { schemaId: selectedSchema, filter, sort, direction });
    const tr = el('tr');
    for (const text of ['Record', ...columns.map(column => column.name), 'Status']) tr.append(el('th', text));
    tableHead.replaceChildren(tr); body.replaceChildren();
    for (const row of rows) {
      const item = el('tr', null, { tabIndex: 0 }); item.dataset.id = row.id; item.setAttribute('aria-selected', String(selection === row));
      const record = el('td'); const button = el('button', row.id, { className: 'record', title: row.id }); button.style.overflowWrap = 'anywhere'; button.style.textAlign = 'left'; record.append(button); item.append(record);
      for (const column of columns) {
        const cell = el('td', row.fields[column.index]?.value ?? '—');
        cell.dataset.tag = String(column.tag); item.append(cell);
      }
      item.append(el('td', `${row.status}${row.reasonCode ? ` · ${row.reasonCode}` : ''}`));
      item.addEventListener('click', () => select(row));
      item.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(row); }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); const index = rows.indexOf(row) + (event.key === 'ArrowDown' ? 1 : -1);
          if (rows[index]) { select(rows[index]); body.children[index].focus(); }
        }
      });
      body.append(item);
    }
    if (!rows.length) { const item = el('tr'); const cell = el('td', snapshot.loading ? 'Loading bounded inventory…' : filter ? 'No loaded rows match this filter. This is not a global absence claim.' : 'No rows loaded for this exact schema.'); cell.colSpan = columns.length + 2; item.append(cell); body.append(item); }
    const statuses = ['VALIDATED', 'FAILED', 'UNSUPPORTED', 'UNAVAILABLE', 'UNKNOWN'].map(status => `${snapshot.rows.filter(row => row.status === status).length} ${status.toLowerCase()}`).join(' · ');
    counts.textContent = `${rows.length} shown / ${group?.rows.length ?? 0} loaded in this schema · ${snapshot.rows.length - (group?.rows.length ?? 0)} other-schema or unassigned rows · all loaded rows: ${statuses}. Sort, filter and copy apply only to loaded rows.`;
    copyButton.disabled = !rows.length;
  }

  function render(state) {
    if (!active) return;
    snapshot = state;
    const groups = groupDataRows(state.rows);
    if (!groups.some(group => group.schemaId === selectedSchema)) selectedSchema = groups[0]?.schemaId;
    schemaSelect.replaceChildren();
    for (const [index, group] of groups.entries()) {
      const option = el('option', `${group.schemaId ?? 'Schema not established'} · ${group.rows.length} loaded`, { value: String(index) });
      option.selected = group.schemaId === selectedSchema; schemaSelect.append(option);
    }
    schemaSelect.disabled = !groups.length;
    const columns = groups.find(group => group.schemaId === selectedSchema)?.columns ?? [];
    sortSelect.replaceChildren(el('option', 'Record ID', { value: 'record' }), el('option', 'Status', { value: 'status' }), ...columns.map(column => el('option', column.name, { value: `field:${column.index}` })));
    if (![...sortSelect.options].some(option => option.value === sort)) sort = 'record';
    sortSelect.value = sort;
    notice.className = `notice ${state.coverage === 'COMPLETE' && !state.pageError ? 'good' : 'warning'}`;
    notice.textContent = state.loading ? `Loading next page (at most 4 records) · ${state.rows.length} retained · ${state.coverage}` : `${state.coverage} inventory · ${state.rows.length} loaded${state.total != null ? ` / ${state.total.toString()} total` : ' / total unknown'} at pinned basis${state.pageError ? ` · ${state.pageError.reasonCode}; existing rows retained` : ''}. Row validation is separate from inventory coverage.`;
    pinned.textContent = state.basis ? `Pinned chain ${state.basis.chainId} · block ${state.basis.blockNumber} · ${state.basis.blockHash}` : 'Basis not yet established.';
    moreButton.hidden = state.coverage === 'COMPLETE'; moreButton.disabled = state.loading; moreButton.textContent = state.pageError ? 'Retry inventory page' : 'Load more records';
    renderRows();
    if (!selection) onEvidence('Typed record inventory', inventoryEvidence());
  }

  const inventory = createDataInventory({ sdk, utilities, onChange: render, onBasis: basis => { if (active) onBasis(basis); } });
  async function refresh() {
    active = true; generation += 1; selection = null; selectedSchema = undefined; filter = ''; sort = 'record'; direction = 'asc'; filterInput.value = ''; directionButton.textContent = 'Ascending';
    card.textContent = 'No record selected. Refresh cleared the previous selection and basis.';
    await inventory.refresh();
  }
  refreshButton.addEventListener('click', refresh);
  moreButton.addEventListener('click', () => inventory.loadMore());
  schemaSelect.addEventListener('change', () => {
    selectedSchema = groupDataRows(snapshot.rows)[Number(schemaSelect.value)]?.schemaId;
    selection = null; card.textContent = 'No record selected.'; sort = 'record'; render(snapshot);
  });
  filterInput.addEventListener('input', () => { filter = filterInput.value; renderRows(); });
  sortSelect.addEventListener('change', () => { sort = sortSelect.value; renderRows(); });
  directionButton.addEventListener('click', () => { direction = direction === 'asc' ? 'desc' : 'asc'; directionButton.textContent = direction === 'asc' ? 'Ascending' : 'Descending'; renderRows(); });
  copyButton.addEventListener('click', async () => {
    const token = generation;
    const rows = selectDataRows(snapshot.rows, { schemaId: selectedSchema, filter, sort, direction });
    const copied = { scope: 'LOADED_FILTERED_ROWS_ONLY', schemaId: selectedSchema, basis: snapshot.basis, inventoryCoverage: snapshot.coverage, loadedInventoryCount: snapshot.rows.length, totalInventoryCount: snapshot.total, rows: rows.map(({ id, status, reasonCode, fields }) => ({ id, status, reasonCode, fields })) };
    try {
      await doc.defaultView.navigator.clipboard.writeText(taggedJson(copied));
      if (active && token === generation) onStatus(`Copied ${rows.length} loaded rows with exact decimal values and pinned basis`);
    } catch (error) { if (active && token === generation) { onEvidence('Loaded-row copy unavailable', { copied, error: rawError(error) }); onStatus('Clipboard unavailable; copy payload is retained in Evidence'); } }
  });
  return { open: async () => refresh(), refresh, deactivate() { active = false; generation += 1; inventory.deactivate(); selection = null; card.textContent = 'No record selected.'; } };
}
