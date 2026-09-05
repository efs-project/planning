import { classifyRead, humanKind, rowEvidence, operationPresentation, promptPolicy, verifiedSessionGrant } from './model.mjs';

const ID = /^0x[0-9a-f]{64}$/i;
const U64_MAX = 18446744073709551615n;
export const FILES_PAGE_SIZE = 8;
export const FILES_MAX_BYTES = 16384;
const normalized = value => String(value ?? '').toLowerCase();
const basisHash = basis => normalized(basis?.blockHash);
const sameBasis = (left, right) => ID.test(basisHash(left)) && basisHash(left) === basisHash(right) &&
  ['chainId', 'blockNumber', 'timestamp'].every(key => normalized(left?.[key]) === normalized(right?.[key]));
const sameDomain = (left, right) => Boolean(left && right) && [...new Set([...Object.keys(left), ...Object.keys(right)])].every(key => normalized(left[key]) === normalized(right[key]));
const qualified = result => result?.outcome === 'FOUND' && result.qualification?.coverage === 'COMPLETE' &&
  result.qualification?.support === 'SUPPORTED' && result.qualification?.validation === 'VALID' &&
  result.qualification?.currentness === 'CURRENT_AT_BASIS' && result.qualification?.availability === 'AVAILABLE' && ID.test(basisHash(result.basis));

export function parseFilesRoute(hash) {
  if (hash === '#files') return { kind: 'directory', id: null };
  const match = /^#files\/(dir|file)\/(0x[0-9a-fA-F]{64})(?:\?revision=([1-9][0-9]*))?$/.exec(hash);
  if (!match || (match[1] === 'dir' && match[3] != null)) throw new Error('Invalid Files route; use #files, an exact directory, or an exact file/revision link');
  const revision = match[3] == null ? null : BigInt(match[3]);
  if (revision != null && revision > U64_MAX) throw new RangeError('Files revision must fit uint64');
  return match[1] === 'dir' ? { kind: 'directory', id: match[2].toLowerCase() } : { kind: 'file', id: match[2].toLowerCase(), revision };
}

export function validateFileInput({ name, action = 'file', text = '', bytes }) {
  if (typeof name !== 'string' || !/^[A-Za-z0-9._-]{1,64}$/.test(name) || name === '.' || name === '..') {
    throw new Error('Lab name must be 1–64 ASCII letters, numbers, dots, underscores or hyphens, excluding . and ..');
  }
  if (bytes != null && !(bytes instanceof Uint8Array)) throw new TypeError('Upload bytes must be a Uint8Array');
  const data = action === 'folder' ? new Uint8Array() : bytes != null ? bytes.slice() : new TextEncoder().encode(text);
  if (data.byteLength > FILES_MAX_BYTES) throw new RangeError('Content exceeds the 16 KiB lab limit; no approval was requested');
  return { name, data };
}

export function revisionWindow(start) {
  const revision = BigInt(start);
  if (revision < 0n || revision > U64_MAX) throw new RangeError('History revision must fit uint64');
  return Array.from({ length: Number(revision < 8n ? revision : 8n) }, (_, index) => revision - BigInt(index));
}

function byteArray(value) {
  if (value instanceof Uint8Array) return value.slice();
  if (typeof value === 'string' && /^0x(?:[0-9a-fA-F]{2})*$/.test(value)) {
    return Uint8Array.from(value.slice(2).match(/../g) ?? [], byte => Number.parseInt(byte, 16));
  }
  throw new Error('Verified bytes were not returned as canonical byte data');
}

export function verifiedFileBytes({ revision, result }) {
  if (!qualified(revision) || !ID.test(revision.value?.contentId ?? '')) throw new Error('File revision is not a qualified exact selection');
  if (!qualified(result) || result.qualification.integrity !== 'VERIFIED' || result.qualification.bytes !== 'RETURNED') {
    throw new Error('File bytes are not a qualified verified return');
  }
  if (!sameBasis(revision.basis, result.basis)) throw new Error('Revision and bytes must share one fixed basis');
  if (normalized(result.domain?.subject) !== normalized(revision.value.contentId)) throw new Error('Verified byte content does not match the selected revision');
  const bytes = byteArray(result.value?.bytes);
  if (bytes.byteLength > FILES_MAX_BYTES) throw new Error('Verified bytes exceed the 16 KiB lab limit');
  return bytes;
}

export function createDirectoryPager({ sdk, directory, basis }) {
  let items = [], pages = [], cursor = 0n, total, fixedBasis = basis, domain, complete = false, lastResult, loading;
  const snapshot = () => ({ items: [...items], pages: [...pages], cursor, total, basis: fixedBasis, complete, lastResult,
    qualification: { ...(lastResult?.qualification ?? {}), coverage: complete ? 'COMPLETE' : pages.length ? 'PARTIAL' : 'UNKNOWN' } });
  async function load() {
    const result = await sdk.readPage({ kind: 'children', directory, blockTag: fixedBasis, cursor, limit: FILES_PAGE_SIZE });
    lastResult = result;
    if (!['FOUND', 'ABSENT_PROVEN'].includes(result?.outcome) || result.qualification?.support !== 'SUPPORTED' ||
      result.qualification?.validation !== 'VALID' || result.qualification?.currentness !== 'CURRENT_AT_BASIS' ||
      result.qualification?.availability !== 'AVAILABLE') return snapshot();
    if (!ID.test(basisHash(result.basis)) || (fixedBasis && !sameBasis(fixedBasis, result.basis))) throw new Error('Directory page basis changed');
    if (normalized(result.domain?.subject) !== normalized(directory) || result.domain?.operation !== 'page:children' || (domain && !sameDomain(domain, result.domain))) throw new Error('Directory page domain changed');
    const received = result.items;
    if (!Array.isArray(received) || received.length > FILES_PAGE_SIZE) throw new Error('Directory page exceeds the bounded row limit');
    if (BigInt(result.cursor) !== cursor) throw new Error('Directory page cursor changed');
    const next = BigInt(result.next), receivedTotal = BigInt(result.total);
    if (receivedTotal < 0n || receivedTotal > 256n || (total != null && receivedTotal !== total)) throw new Error('Directory page total changed or exceeds lab bounds');
    if (next !== cursor + BigInt(received.length) || next > receivedTotal || (next === cursor && next < receivedTotal)) throw new Error('Directory page made invalid progress');
    const allIds = [...items, ...received].map(entry => normalized(typeof entry === 'string' ? entry : entry?.id));
    if (allIds.some(entry => !ID.test(entry)) || new Set(allIds).size !== allIds.length) throw new Error('Directory page contains invalid or duplicate identifiers');
    if (next < receivedTotal) {
      const continuation = result.continuation;
      if (!continuation || BigInt(continuation.cursor) !== next || BigInt(continuation.total) !== receivedTotal || !sameBasis(continuation.basis, result.basis) || !sameDomain(continuation.domain, result.domain)) throw new Error('Directory continuation does not retain its cursor, basis, domain and total');
    } else if (result.continuation != null) throw new Error('Completed directory has a conflicting continuation');
    fixedBasis = result.basis; domain = result.domain; total = receivedTotal; cursor = next;
    items = [...items, ...received]; pages = [...pages, result]; complete = next === total;
    return snapshot();
  }
  return { snapshot, loadMore() {
    if (complete) return Promise.resolve(snapshot());
    if (!loading) loading = load().finally(() => { loading = undefined; });
    return loading;
  } };
}

/** Disposable Files projection. All durable reads/writes stay on the shared SDK. */
export function createFilesView({ root, sdk, config = {}, utilities = {}, onEvidence = () => {}, onStatus = () => {}, onBasis = () => {}, navigate }) {
  const document = root.ownerDocument;
  const $ = selector => document.querySelector(selector);
  const element = (tag, text, attributes = {}) => {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    return node;
  };
  const button = (text, id, action) => {
    const node = element('button', text, { type: 'button', ...(id ? { id } : {}) });
    if (action) node.dataset.action = action;
    return node;
  };
  const short = value => { const text = String(value ?? '—'); return text.length > 24 ? `${text.slice(0, 14)}…${text.slice(-6)}` : text; };
  const state = { active: false, generation: 0, basis: null, hash: '#files', directoryId: sdk.deployment?.rootId ?? config.deployment?.rootId,
    directoryQualified: false, pager: null, selected: null, selectionEvidence: null, rows: new Map(), action: null, writing: false, writeGeneration: 0,
    sessionReady: false, promptCount: 0, historyNext: 0n, historyBusy: false };
  const live = token => state.active && state.generation === token;
  const say = text => { if (state.active) onStatus(`${text} · ${state.promptCount} simulated wallet confirmation${state.promptCount === 1 ? '' : 's'}`); };
  const inspect = (label, evidence, token = state.generation) => { if (live(token)) onEvidence(label, evidence); };
  const adopt = (basis, token) => { if (live(token) && basis) { state.basis = basis; onBasis(basis); } };
  const routeTo = hash => navigate ? navigate(hash) : open(hash);
  const exactLink = (fileId, revision) => `#files/file/${fileId}?revision=${revision}`;
  const directoryLink = id => normalized(id) === normalized(sdk.deployment?.rootId ?? config.deployment?.rootId) ? '#files' : `#files/dir/${id}`;

  const header = element('div', null, { class: 'view-head' });
  const heading = element('div'); heading.append(element('p', 'Exact directory · fixed basis', { class: 'eyebrow' }), element('h1', 'Lab root', { id: 'files-title' }), element('p', '/', { id: 'pathline' }));
  const actions = element('div', null, { class: 'actions' });
  const refreshButton = button('Refresh basis', 'refresh-files');
  const folderButton = button('New folder', null, 'folder'), fileButton = button('New text file', null, 'file'); fileButton.className = 'primary';
  actions.append(refreshButton, folderButton, fileButton); header.append(heading, actions);
  const notice = element('div', 'Loading qualified directory evidence…', { id: 'files-notice', class: 'notice quiet', role: 'status' });
  const tableWrap = element('div', null, { class: 'file-table-wrap' }), table = element('table', null, { class: 'file-table' });
  const headRow = table.createTHead().insertRow(); for (const label of ['Name', 'Kind', 'Revision', 'Evidence']) headRow.append(element('th', label));
  const body = table.createTBody(); body.id = 'file-list'; tableWrap.append(table);
  const paging = element('div', null, { class: 'files-paging actions' });
  const loadMore = button('Load more', 'files-load-more'), pageSummary = element('p', 'No page loaded', { id: 'files-page-summary' }); paging.append(loadMore, pageSummary);
  const preview = element('article', null, { id: 'file-preview', class: 'preview' }); preview.hidden = true;
  const previewHead = element('div', null, { class: 'preview-head' }), previewHeading = element('div');
  previewHeading.append(element('p', 'Exact revision · verified read', { class: 'eyebrow' }), element('h2', 'File', { id: 'preview-name' }));
  const previewActions = element('div', null, { class: 'actions' }); const revise = button('Publish revision', null, 'revision');
  const download = button('Download verified bytes', 'download-file'); download.disabled = true; previewActions.append(download, revise); previewHead.append(previewHeading, previewActions);
  const exact = element('a', 'Exact revision link', { id: 'exact-file-link' });
  const metadata = element('p', '', { id: 'file-selection-summary' });
  const content = element('pre', '', { id: 'preview-body' });
  const history = element('div', null, { id: 'file-history', class: 'file-history' }), historyMore = button('Load 8 older revisions', 'history-load-more');
  preview.append(previewHead, exact, metadata, content, element('h3', 'Revision history'), history, historyMore);
  root.replaceChildren(header, notice, tableWrap, paging, preview);

  const form = $('#write-form'), writeDialog = $('#write-dialog'), confirmDialog = $('#confirm-dialog');
  const inputModeLabel = element('label', 'Content source', { id: 'write-source-label' });
  const inputMode = element('select', null, { id: 'write-input-mode' });
  inputMode.append(element('option', 'Text', { value: 'text' }), element('option', 'Upload binary or text file (16 KiB max)', { value: 'upload' })); inputModeLabel.append(inputMode);
  const uploadLabel = element('label', 'Local upload · inert bytes only', { id: 'write-upload-label' });
  const upload = element('input', null, { type: 'file', id: 'write-upload' }); uploadLabel.append(upload);
  const bounds = element('p', 'Lab names: 1–64 ASCII letters, digits, dots, underscores or hyphens. Content: at most 16 KiB. Selected bytes are never executed.', { class: 'warning-copy' });
  form?.insertBefore(inputModeLabel, $('#content-label')); form?.insertBefore(uploadLabel, $('#content-label')); form?.insertBefore(bounds, $('#plan-preview'));
  // Preserve invalid input for an explicit rejection; maxlength silently truncates pasted names.
  $('#write-name')?.removeAttribute('maxlength');
  function updateInputMode() {
    const folder = state.action === 'folder'; inputModeLabel.hidden = folder; uploadLabel.hidden = folder;
    $('#content-label').hidden = folder || inputMode.value === 'upload';
    uploadLabel.dataset.selected = String(inputMode.value === 'upload');
  }
  inputMode.addEventListener('change', updateInputMode);
  upload.addEventListener('change', () => { if (upload.files?.length) { inputMode.value = 'upload'; updateInputMode(); if (!$('#write-name').value && state.action !== 'revision') $('#write-name').value = upload.files[0].name; } });

  function noticeResult(result) { const display = classifyRead(result); notice.className = `notice ${display.tone}`; notice.textContent = `${display.title} — ${display.detail}`; }
  function failed(error, token, label = 'Files read') {
    if (!live(token)) return;
    notice.className = 'notice warning'; notice.textContent = `Cannot establish ${label.toLowerCase()} — ${error.message}`;
    inspect(label, { outcome: 'UNKNOWN', reasonCode: error.message, basis: state.basis, qualification: { coverage: 'UNKNOWN', availability: 'UNKNOWN' } }, token);
    say('Read remains unavailable or incomplete; no absence inferred');
  }
  function exactNode(result, id, token) {
    if (!live(token)) return false;
    if (!qualified(result) || normalized(result.domain?.subject) !== normalized(id) || (state.basis && !sameBasis(state.basis, result.basis))) {
      inspect('Node read not established', result, token); noticeResult(result); return false;
    }
    adopt(result.basis, token); return true;
  }

  async function renderPage(token) {
    if (!live(token) || !state.pager) return;
    const pager = state.pager;
    loadMore.disabled = true;
    try {
      const listing = await pager.loadMore(); if (!live(token)) return;
      adopt(listing.basis, token);
      noticeResult(listing.lastResult);
      inspect('Retained directory pages', { ...listing.lastResult, items: listing.items, pages: listing.pages, qualification: listing.qualification }, token);
      for (const entry of listing.items) {
        const id = typeof entry === 'string' ? entry : entry.id;
        if (state.rows.has(id)) continue;
        const node = await sdk.readExact({ kind: 'node', id, blockTag: listing.basis }); if (!live(token)) return;
        state.rows.set(id, node);
      }
      body.replaceChildren();
      for (const [id, result] of state.rows) {
        const valid = qualified(result) && sameBasis(result.basis, listing.basis) && normalized(result.domain?.subject) === normalized(id);
        const item = valid ? result.value : null;
        const row = body.insertRow(); row.dataset.id = id; row.tabIndex = 0;
        const values = [item?.name ?? `Unavailable ${short(id)}`, item ? humanKind(item.kind) : 'Unknown', item?.revision ?? '—', valid ? rowEvidence(result.qualification) : result.reasonCode ?? result.outcome ?? 'UNKNOWN'];
        values.forEach((value, index) => { const cell = row.insertCell(); cell.textContent = String(value); if (index === 1) cell.className = 'kind'; });
        const select = () => {
          if (!live(token)) return;
          inspect(item?.name ?? 'Unavailable directory entry', result, token);
          if (!item) return;
          if (humanKind(item.kind) === 'Folder') routeTo(directoryLink(id));
          else if (humanKind(item.kind) === 'File') routeTo(exactLink(id, item.revision));
        };
        row.addEventListener('click', select); row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } });
      }
      if (!listing.items.length) { const cell = body.insertRow().insertCell(); cell.colSpan = 4; cell.textContent = listing.complete ? 'Directory is empty at this fixed basis.' : 'No entries observed; listing remains incomplete.'; }
      pageSummary.textContent = `${listing.items.length} loaded${listing.total == null ? '' : ` of ${listing.total}`} · ${listing.complete ? 'complete at this basis' : 'incomplete; continuation retained'}`;
      loadMore.hidden = listing.complete; loadMore.textContent = listing.lastResult?.outcome === 'UNKNOWN' ? 'Retry page' : 'Load more';
      if (listing.complete) { notice.className = 'notice good'; notice.textContent = `COMPLETE · ${listing.items.length} entries enumerated at one fixed basis. Individual row qualifications remain inspectable.`; }
    } catch (error) { failed(error, token, 'directory continuation'); }
    finally { if (live(token)) loadMore.disabled = false; }
  }

  async function loadDirectory(id, node, token) {
    if (!live(token)) return;
    state.directoryId = id; state.directoryQualified = true;
    $('#files-title').textContent = node.value?.name || 'Lab root';
    const rootId = sdk.deployment?.rootId ?? config.deployment?.rootId;
    const crumb = element('a', 'Lab root', { href: '#files' }); crumb.addEventListener('click', event => { event.preventDefault(); routeTo('#files'); });
    $('#pathline').replaceChildren(crumb, document.createTextNode(normalized(id) === normalized(rootId) ? ' /' : ` / ${node.value?.name ?? short(id)} · ${short(id)}`));
    if (node.value?.parent && normalized(id) !== normalized(rootId) && ID.test(node.value.parent)) {
      const up = element('a', ' · Parent directory', { href: directoryLink(node.value.parent) }); up.addEventListener('click', event => { event.preventDefault(); routeTo(up.getAttribute('href')); }); $('#pathline').append(up);
    }
    folderButton.disabled = false; fileButton.disabled = false;
    state.pager = createDirectoryPager({ sdk, directory: id, basis: state.basis });
    await renderPage(token);
  }

  async function loadHistory(token) {
    if (!live(token) || !state.selected || state.historyBusy) return;
    state.historyBusy = true; historyMore.disabled = true;
    try {
      for (const revision of revisionWindow(state.historyNext)) {
        const result = await sdk.readExact({ kind: 'revision', file: state.selected.id, revision, blockTag: state.basis }); if (!live(token)) return;
        const row = element('div', null, { class: 'history-row' });
        const valid = qualified(result) && sameBasis(result.basis, state.basis) && normalized(result.domain?.subject) === normalized(state.selected.id);
        const link = element('a', `Revision ${revision}`, { href: exactLink(state.selected.id, revision) }); link.addEventListener('click', event => { event.preventDefault(); routeTo(link.getAttribute('href')); });
        row.append(link, document.createTextNode(` · ${valid ? short(result.value?.contentId) : result.reasonCode ?? result.outcome ?? 'UNKNOWN'}`));
        const evidence = button('Evidence'); evidence.addEventListener('click', () => inspect(`Revision ${revision}`, result, token)); row.append(evidence); history.append(row);
        state.historyNext = revision - 1n;
      }
      historyMore.hidden = state.historyNext === 0n;
    } catch (error) { failed(error, token, 'revision history'); }
    finally { if (live(token)) { state.historyBusy = false; historyMore.disabled = false; } }
  }

  async function loadFile(route, node, token) {
    if (!live(token)) return;
    const number = route.revision ?? BigInt(node.value.revision);
    state.selected = { ...node.value, id: route.id, revision: number, headRevision: BigInt(node.value.revision), bytes: null };
    preview.hidden = false; $('#preview-name').textContent = node.value.name;
    content.textContent = 'Verifying exact selected revision…'; metadata.textContent = `Revision ${number} selected; latest observed is ${node.value.revision}.`;
    exact.href = exactLink(route.id, number); exact.textContent = `Exact link · revision ${number}`;
    const revision = await sdk.readExact({ kind: 'revision', file: route.id, revision: number, blockTag: state.basis }); if (!live(token)) return;
    if (!qualified(revision) || !sameBasis(revision.basis, state.basis) || normalized(revision.domain?.subject) !== normalized(route.id)) {
      content.textContent = `Exact revision could not be established: ${revision.reasonCode ?? revision.outcome}.`; inspect('Selected revision not established', revision, token); return;
    }
    const bytesResult = await sdk.readVerifiedBytes({ contentId: revision.value.contentId, blockTag: state.basis }); if (!live(token)) return;
    state.selectionEvidence = { node, revision, bytes: bytesResult, qualification: bytesResult.qualification, basis: bytesResult.basis };
    inspect(node.value.name, state.selectionEvidence, token);
    try {
      const bytes = verifiedFileBytes({ revision, result: bytesResult }); state.selected.bytes = bytes;
      download.disabled = false;
      let text;
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) text = undefined; } catch { /* Binary content stays inert. */ }
      state.selected.text = text;
      content.textContent = text ?? `${bytes.length} verified binary bytes. Download preserves the exact byte sequence.\n${Array.from(bytes.slice(0, 128), byte => byte.toString(16).padStart(2, '0')).join(' ')}${bytes.length > 128 ? '\n… Preview limited to 128 bytes.' : ''}`;
      metadata.textContent = `Revision ${number} · ${bytes.length} verified bytes · content ${short(revision.value.contentId)}${number !== state.selected.headRevision ? ` · historical; head is ${state.selected.headRevision}` : ' · latest observed at this basis'}`;
      if (typeof utilities.deriveRevisionId === 'function') state.selected.revisionId = utilities.deriveRevisionId({ fileId: route.id, revision: number, contentId: revision.value.contentId, previous: revision.value.previous });
      revise.disabled = number !== state.selected.headRevision || !state.selected.revisionId;
      revise.title = number !== state.selected.headRevision ? 'Open the latest observed revision to publish a successor; old bytes are preserved.' : '';
    } catch (error) { content.textContent = `Content is unavailable or failed verification. ${error.message}. Inspect evidence for attempts.`; }
    state.historyNext = BigInt(node.value.revision); await loadHistory(token);
  }

  async function open(hash = '#files') {
    state.active = true; const token = ++state.generation; state.hash = hash;
    state.selected = null; state.selectionEvidence = null; state.rows = new Map(); state.directoryQualified = false; state.historyBusy = false;
    preview.hidden = true; download.disabled = true; revise.disabled = true; folderButton.disabled = true; fileButton.disabled = true;
    history.replaceChildren(); body.replaceChildren(); loadMore.hidden = false; loadMore.disabled = true; historyMore.hidden = false;
    notice.className = 'notice quiet'; notice.textContent = 'Loading exact Files selection…'; pageSummary.textContent = 'No page loaded';
    try {
      const route = parseFilesRoute(hash), id = route.id ?? sdk.deployment?.rootId ?? config.deployment?.rootId;
      if (!ID.test(id ?? '')) throw new Error('Explicit lab root identity is unavailable');
      const node = await sdk.readExact({ kind: 'node', id, blockTag: state.basis ?? 'latest' }); if (!exactNode(node, id, token)) return;
      const expectedKind = route.kind === 'directory' ? 'Folder' : 'File';
      if (humanKind(node.value?.kind) !== expectedKind) throw new Error(`Route requires a ${expectedKind.toLowerCase()}, but the exact node has a different kind`);
      if (route.kind === 'directory') await loadDirectory(id, node, token);
      else {
        const parent = await sdk.readExact({ kind: 'node', id: node.value.parent, blockTag: state.basis }); if (!live(token)) return;
        if (exactNode(parent, node.value.parent, token) && humanKind(parent.value?.kind) === 'Folder') await loadDirectory(node.value.parent, parent, token);
        await loadFile(route, node, token);
      }
    } catch (error) { failed(error, token); }
  }

  function openWrite(action) {
    if (!state.active || !state.directoryQualified || state.writing) return;
    if (action === 'revision' && (!state.selected?.revisionId || state.selected.revision !== state.selected.headRevision)) return;
    state.action = action; const revision = action === 'revision';
    $('#write-title').textContent = revision ? 'Publish a new immutable revision' : action === 'folder' ? 'Create folder' : 'Create small file';
    $('#write-name').value = revision ? state.selected.name : ''; $('#write-name').disabled = revision;
    $('#write-content').value = revision ? state.selected.text ?? '' : '';
    inputMode.value = 'text'; upload.value = ''; updateInputMode();
    $('#plan-preview').textContent = 'Planning is wallet-free. Name and byte limits are checked before any approval. Existing revisions remain unchanged.';
    writeDialog.returnValue = 'pending'; writeDialog.showModal(); $('#write-name').focus();
  }

  async function confirmOnce(mode, digest, setup, token, writeToken) {
    const current = () => live(token) && state.writeGeneration === writeToken;
    const policy = promptPolicy(mode, state.sessionReady);
    if ((!setup && policy.routine === 0) || (setup && policy.setup === 0)) return current();
    if (!current()) return false;
    $('#confirm-copy').textContent = setup ? 'Approve one bounded local session grant setup.' : mode === 'DIRECT_EOA' ? 'Approve one local transaction request.' : 'Approve one EIP-712 message for this exact plan.';
    $('#confirm-digest').textContent = digest; confirmDialog.returnValue = 'cancel'; confirmDialog.showModal();
    return new Promise(resolve => confirmDialog.addEventListener('close', () => {
      const approved = current() && confirmDialog.returnValue === 'approve'; if (approved) state.promptCount += 1; resolve(approved);
    }, { once: true }));
  }

  async function executeWrite(event) {
    event.preventDefault(); if (!state.active || state.writing) return;
    const token = state.generation, action = state.action, selected = state.selected, directoryId = state.directoryId;
    const writeToken = ++state.writeGeneration;
    const assertCurrent = () => { if (!live(token) || state.writeGeneration !== writeToken) throw new Error('Write cancelled locally or because the Files selection changed'); };
    state.writing = true; $('#plan-submit').disabled = true;
    try {
      const name = $('#write-name').value;
      // The file size check precedes arrayBuffer, provider access and every approval.
      let bytes;
      if (action !== 'folder' && inputMode.value === 'upload') {
        const file = upload.files?.[0]; if (!file) throw new Error('Select a local file before planning');
        if (file.size > FILES_MAX_BYTES) throw new Error('Upload exceeds the 16 KiB lab limit; no approval was requested');
        bytes = new Uint8Array(await file.arrayBuffer()); assertCurrent();
      }
      const input = validateFileInput({ name, action, text: $('#write-content').value, bytes });
      const mode = new document.defaultView.FormData(form).get('mode'); promptPolicy(mode, state.sessionReady);
      const selectedMode = mode === 'RELAYED_EOA' ? 'RELAYED' : mode === 'DIRECT_EOA' ? 'DIRECT' : 'SESSION';
      let grant = config.sessionGrant?.grant ?? config.sessionGrant, grantId = config.sessionGrant?.grantId ?? config.grantId;
      say(operationPresentation({ stage: 'WORKING' }).title);
      if (selectedMode === 'SESSION' && !state.sessionReady) {
        if (!grant) throw new Error('Session grant setup inputs unavailable');
        if (!await confirmOnce(mode, 'Exact bounded grant inputs', true, token, writeToken)) throw new Error('Session grant setup rejected locally'); assertCurrent();
        const registered = await sdk.registerGrant({ grant, owner: config.accounts?.owner, from: config.accounts?.relayer }); assertCurrent();
        config.sessionGrant = { ...registered, grant }; grantId = registered.grantId;
        const observed = await sdk.readExact({ kind: 'grant', id: grantId, blockTag: 'latest' }); assertCurrent();
        verifiedSessionGrant({ observed, expectedGrant: registered.grant ?? grant, expectedGrantId: grantId }); state.sessionReady = true;
      }
      const ownerNonce = await sdk.readExact({ kind: 'ownerNonce', blockTag: 'latest' }); assertCurrent();
      if (!qualified(ownerNonce)) throw new Error('Owner nonce was not independently established');
      let nonce = BigInt(ownerNonce.value), deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      grant = config.sessionGrant?.grant ?? grant;
      if (selectedMode === 'SESSION') {
        const observed = await sdk.readExact({ kind: 'grant', id: grantId, blockTag: 'latest' }); assertCurrent();
        verifiedSessionGrant({ observed, expectedGrant: grant, expectedGrantId: grantId }); nonce = BigInt(observed.value.writes);
        deadline = deadline < BigInt(grant.expiry) ? deadline : BigInt(grant.expiry);
      }
      const salt = `0x${Array.from(document.defaultView.crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('')}`;
      const payload = { ...input, target: action === 'revision' ? selected.id : directoryId, salt,
        expectedRevision: action === 'revision' ? selected.revision : 0n, nonce, deadline, grantId: selectedMode === 'SESSION' ? grantId : undefined };
      const builder = action === 'folder' ? 'mkdir' : action === 'revision' ? 'reviseFile' : 'createFile';
      if (typeof sdk.operations?.[builder] !== 'function') throw new Error(`SDK builder ${builder} unavailable`);
      const plan = sdk.planWrite({ operation: sdk.operations[builder](payload), previousRevisionId: action === 'revision' ? selected.revisionId : undefined });
      $('#plan-preview').textContent = `Plan ${plan.digest ?? plan.planDigest} · ${input.data.length} bytes · no wallet touched by planning.`;
      if (!await confirmOnce(mode, plan.digest ?? plan.planDigest, false, token, writeToken)) throw new Error('Approval rejected locally'); assertCurrent();
      writeDialog.close('approved'); say('Preparing exact approved plan');
      const account = selectedMode === 'SESSION' ? config.accounts?.session : config.accounts?.owner;
      const prepared = await sdk.prepareWrite(plan, { mode: selectedMode, account, grant: selectedMode === 'SESSION' ? grant : undefined }); assertCurrent(); inspect('Prepared write', prepared, token);
      const submitted = await sdk.submitWrite(prepared, { from: config.accounts?.relayer });
      if (live(token)) { say(operationPresentation({ stage: submitted.stage, effect: submitted.effect ?? submitted.qualification?.effect }).title); inspect('Submitted write', submitted, token); }
      // Submission cannot be undone by navigation. Independent read-back still establishes its effect.
      const readBack = await sdk.readBack(submitted, { blockTag: 'latest' }); if (!live(token)) return;
      adopt(readBack.basis, token); const outcome = operationPresentation({ stage: readBack.stage, effect: readBack.effect ?? readBack.qualification?.effect });
      inspect('Canonical read-back', readBack, token);
      if (outcome.success) {
        const nextHash = action === 'revision' ? exactLink(selected.id, plan.predicted.revision) : state.hash;
        await routeTo(nextHash);
        if (state.active) { inspect('Canonical read-back', readBack); say(outcome.title); }
      } else say(outcome.title);
    } catch (error) { if (live(token)) { say(`Write not completed: ${error.message}`); $('#plan-preview').textContent = `Not completed — ${error.message}`; } }
    finally { state.writing = false; $('#plan-submit').disabled = false; }
  }

  folderButton.addEventListener('click', () => openWrite('folder')); fileButton.addEventListener('click', () => openWrite('file')); revise.addEventListener('click', () => openWrite('revision'));
  loadMore.addEventListener('click', () => renderPage(state.generation)); historyMore.addEventListener('click', () => loadHistory(state.generation)); refreshButton.addEventListener('click', refresh);
  form?.addEventListener('submit', executeWrite);
  function cancelWrite() {
    state.writeGeneration += 1;
    if (state.writing) say('Write cancelled locally; pending preparation will not request approval or submit');
  }
  writeDialog?.addEventListener('cancel', cancelWrite);
  writeDialog?.addEventListener('close', () => { if (writeDialog.returnValue === 'cancel') cancelWrite(); });
  $('#close-write')?.addEventListener('click', () => { cancelWrite(); writeDialog.close('cancel'); });
  $('#cancel-write')?.addEventListener('click', () => { cancelWrite(); writeDialog.close('cancel'); });
  $('#root-node')?.addEventListener('click', () => routeTo('#files'));
  exact.addEventListener('click', event => { event.preventDefault(); if (exact.getAttribute('href')) routeTo(exact.getAttribute('href')); });
  download.addEventListener('click', () => {
    if (!state.active || !state.selected?.bytes || !state.selectionEvidence) return;
    try {
      const bytes = verifiedFileBytes({ revision: state.selectionEvidence.revision, result: state.selectionEvidence.bytes });
      const url = document.defaultView.URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
      const anchor = element('a', null, { href: url, download: `${state.selected.name}.revision-${state.selected.revision}` }); document.body.append(anchor); anchor.click(); anchor.remove();
      document.defaultView.setTimeout(() => document.defaultView.URL.revokeObjectURL(url), 1000);
      say(`Downloaded ${bytes.length} verified bytes from exact revision ${state.selected.revision}`);
    } catch (error) { download.disabled = true; failed(error, state.generation, 'binary download'); }
  });
  function refresh() { state.basis = null; return open(state.hash); }
  function deactivate() {
    state.active = false; state.generation += 1; download.disabled = true;
    if (confirmDialog?.open) confirmDialog.close('cancel'); if (writeDialog?.open) writeDialog.close('cancel');
  }
  return { open, refresh, deactivate };
}
