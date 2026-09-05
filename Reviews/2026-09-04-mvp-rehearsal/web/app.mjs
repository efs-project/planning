import {
  classifyRead, promptPolicy, operationPresentation,
  createGameLease, taggedJson, humanKind, rowEvidence, formatBasisSummary,
  decodedFieldRows, verifiedLaunchSelection, createLaunchCoordinator,
  verifiedSessionGrant,
} from './model.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state = { sdk: null, utilities: window.EFS_LAB_UTILS ?? null, labStatus: null, basis: null, directoryId: 'root', selected: null, evidence: null, action: null, sessionReady: false, promptCount: 0 };

const gameLease = createGameLease({
  createUrl(bytes) { return URL.createObjectURL(new Blob([bytes], { type: 'text/html' })); },
  revokeUrl(url) { URL.revokeObjectURL(url); },
  mount({ src, sandbox }) {
    const frame = document.createElement('iframe');
    frame.title = 'Signal Drift game'; frame.src = src; frame.setAttribute('sandbox', sandbox);
    const stage = $('#game-stage'); stage.replaceChildren(frame);
  },
  unmount() { $('#game-stage').replaceChildren(Object.assign(document.createElement('p'), { textContent: 'Game stopped. Frame removed and content URL revoked.' })); },
});

const launchCoordinator = createLaunchCoordinator({
  select: ({ fileId, revision, basis }) => state.sdk.readExact({ kind: 'revision', file: fileId, revision, blockTag: basis }),
  load: ({ contentId, expectedBytes }, selection) => state.sdk.readVerifiedBytes({ contentId, expectedBytes, blockTag: selection.basis }),
  admit: ({ context, selection, loaded }) => {
    loaded.bytes = toBytes(loaded.bytes ?? loaded.value?.bytes);
    return verifiedLaunchSelection({ selection, bytes: loaded, expectedContentId: context.contentId });
  },
  launch: bytes => gameLease.launch(bytes),
});

function say(message) { $('#live-status').textContent = `${message} · ${state.promptCount} simulated wallet confirmation${state.promptCount === 1 ? '' : 's'}`; }
function short(value, size = 10) { const text = String(value ?? '—'); return text.length > size * 2 ? `${text.slice(0, size)}…${text.slice(-6)}` : text; }
function asItems(result) { return result?.items ?? result?.value?.items ?? result?.value ?? []; }
function qualification(result) { return result?.qualification ?? {}; }
function updateBasisSummary() { $('#basis-summary').textContent = formatBasisSummary(state.labStatus ?? {}, state.basis); }
function adoptBasis(result) { if (result?.basis) state.basis = result.basis; updateBasisSummary(); }
function toBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (typeof value === 'string' && value.startsWith('0x')) return Uint8Array.from(value.slice(2).match(/.{1,2}/g) ?? [], b => Number.parseInt(b, 16));
  if (typeof value === 'string') return new TextEncoder().encode(value);
  return value;
}

function showNotice(target, result) {
  const view = classifyRead(result);
  target.className = `notice ${view.tone}`;
  target.textContent = `${view.title} — ${view.detail}`;
}

function inspect(label, evidence) {
  state.evidence = evidence;
  const q = qualification(evidence);
  const facts = [
    ['Selection', label], ['Outcome', evidence?.outcome], ['Basis', evidence?.basis?.blockHash ?? evidence?.basis?.blockNumber],
    ['Coverage', q.coverage], ['Support / validation', `${q.support ?? '—'} / ${q.validation ?? '—'}`],
    ['Authority', q.authority], ['Currentness / finality', `${q.currentness ?? '—'} / ${q.finality ?? '—'}`],
    ['Integrity', q.integrity], ['Availability / bytes', `${q.availability ?? '—'} / ${q.bytes ?? '—'}`], ['Effect', q.effect ?? evidence?.effect],
  ];
  const box = $('#evidence-summary'); box.replaceChildren();
  for (const [name, value] of facts) { if (value == null) continue; const node = document.createElement('div'); node.className = 'fact'; const key = document.createElement('b'); key.textContent = name; node.append(key, document.createTextNode(String(value))); box.append(node); }
  $('#raw-evidence').textContent = taggedJson(evidence);
}

function renderTypedData(schema, payload, decoded) {
  const card = $('#schema-card'); card.replaceChildren();
  const summary = document.createElement('div'); summary.className = 'typed-summary';
  const outcome = document.createElement('span'); outcome.className = decoded.valid ? 'typed-valid' : 'typed-unknown';
  outcome.textContent = decoded.valid ? 'Validated at fixed basis' : `Not validated · ${decoded.reasonCode ?? decoded.outcome ?? 'unknown'}`;
  const schemaId = document.createElement('code'); schemaId.textContent = short(schema.domain?.subject ?? schema.value?.schemaId ?? 'Schema evidence retained', 14);
  summary.append(outcome, schemaId); card.append(summary);

  const rows = decodedFieldRows(decoded);
  if (rows.length) {
    const table = document.createElement('table'); table.className = 'field-table';
    const body = table.createTBody();
    for (const field of rows) { const row = body.insertRow(); const name = row.insertCell(); name.textContent = field.name; const value = row.insertCell(); value.textContent = field.value; }
    card.append(table);
  } else {
    const unavailable = document.createElement('p'); unavailable.className = 'typed-empty'; unavailable.textContent = 'Decoded fields are unavailable. Raw attempts remain inspectable.'; card.append(unavailable);
  }

  const raw = document.createElement('details'); const label = document.createElement('summary'); label.textContent = 'Raw schema, payload & validation evidence';
  const pre = document.createElement('pre'); pre.textContent = taggedJson({ schema, payload, decoded }); raw.append(label, pre); card.append(raw);
}

async function loadSdk() {
  if (window.EfsLabSdk) return await window.EfsLabSdk;
  const source = window.EFS_LAB_SDK_URL || '/sdk/index.js';
  const module = await import(source);
  state.utilities = module;
  const bootstrap = window.EFS_LAB_BOOTSTRAP;
  if (!bootstrap || typeof module.createLabSdk !== 'function') throw new Error('Explicit EFS_LAB_BOOTSTRAP and createLabSdk are required');
  return module.createLabSdk(bootstrap);
}

async function initialize() {
  try {
    state.sdk = await loadSdk();
    const status = typeof state.sdk.getLabStatus === 'function' ? await state.sdk.getLabStatus() : window.EFS_LAB_BOOTSTRAP?.deployment;
    state.labStatus = status ?? {}; state.basis = status?.basis; state.directoryId = state.sdk.deployment?.rootId ?? status?.rootId ?? state.directoryId;
    updateBasisSummary();
    await loadDirectory();
    say('Lab SDK connected · guest mode');
  } catch (error) {
    showUnavailable(error);
  }
}

function showUnavailable(error) {
  const message = `Lab unavailable — ${error.message}`;
  for (const target of [$('#files-notice'), $('#data-notice')]) { target.className = 'notice warning'; target.textContent = message; }
  $('#basis-summary').textContent = 'No explicit lab SDK/configuration';
  say('Unavailable; no chain success inferred');
}

async function loadDirectory() {
  if (!state.sdk) return;
  try {
    const result = await state.sdk.readPage({ kind: 'children', directory: state.directoryId, blockTag: state.basis, limit: 50 });
    adoptBasis(result); showNotice($('#files-notice'), result); inspect('Directory page', result);
    const body = $('#file-list'); body.replaceChildren(); const items = asItems(result);
    if (!items.length) { const row = body.insertRow(); const cell = row.insertCell(); cell.colSpan = 4; cell.textContent = qualification(result).coverage === 'COMPLETE' ? 'Directory is empty at this fixed basis.' : 'No entries observed in the incomplete page.'; }
    for (const entry of items) {
      const itemResult = typeof entry === 'string' ? await state.sdk.readExact({ kind: 'node', id: entry, blockTag: state.basis }) : null;
      const item = itemResult ? { ...itemResult.value, id: entry, qualification: itemResult.qualification, evidence: itemResult.evidence } : entry;
      const row = body.insertRow(); row.tabIndex = 0; row.dataset.id = item.id ?? item.objectId ?? item.fileId;
      const values = [item.name ?? '(unnamed)', humanKind(item.kind ?? item.type), item.revision ?? item.revisionId ?? '—', rowEvidence(item.qualification ?? { integrity: item.integrity })];
      values.forEach((value, index) => { const cell = row.insertCell(); cell.textContent = String(value); if (index === 1) cell.className = 'kind'; });
      const open = () => openItem(item); row.addEventListener('click', open); row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    }
  } catch (error) { showUnavailable(error); }
}

async function openItem(item) {
  inspect(item.name ?? 'Entry', item);
  const kind = String(item.kind ?? item.type ?? '').toLowerCase();
  if (kind === '1' || kind.includes('directory') || kind.includes('folder')) { state.directoryId = item.id ?? item.objectId; $('#files-title').textContent = item.name; $('#pathline').textContent = `Pinned directory · ${short(state.directoryId)}`; await loadDirectory(); return; }
  state.selected = item;
  try {
    const node = await state.sdk.readExact({ kind: 'node', id: item.fileId ?? item.id ?? item.objectId, blockTag: state.basis });
    const revision = await state.sdk.readExact({ kind: 'revision', file: item.fileId ?? item.id, revision: node.value?.revision ?? item.revision, blockTag: state.basis });
    const result = await state.sdk.readVerifiedBytes({ contentId: revision.value?.contentId, blockTag: state.basis }); inspect(item.name ?? 'File', { node, revision, bytes: result, qualification: result.qualification, basis: result.basis });
    const preview = $('#file-preview'); preview.hidden = false; $('#preview-name').textContent = item.name ?? 'Selected file';
    const value = result.qualification?.integrity === 'VERIFIED' ? new TextDecoder().decode(toBytes(result.value?.bytes)) : null;
    if (typeof state.utilities?.deriveRevisionId === 'function') state.selected.revisionId = state.utilities.deriveRevisionId({ fileId: item.fileId ?? item.id, revision: node.value.revision, contentId: revision.value.contentId, previous: revision.value.previous });
    $('#preview-body').textContent = value ?? 'Content is unavailable or failed verification. Inspect evidence for attempts.';
  } catch (error) { $('#preview-body').textContent = `Cannot establish file read: ${error.message}`; }
}

async function loadData() {
  if (!state.sdk) return;
  try {
    const result = await state.sdk.readPage({ kind: 'records', blockTag: state.basis, limit: 40 });
    adoptBasis(result); showNotice($('#data-notice'), result); inspect('Typed record inventory', result); const list = $('#record-list'); list.replaceChildren();
    for (const entry of asItems(result)) {
      const recordResult = typeof entry === 'string' ? await state.sdk.readExact({ kind: 'record', id: entry, blockTag: state.basis }) : null;
      const record = recordResult ? { ...recordResult.value, id: entry, qualification: recordResult.qualification, evidence: recordResult.evidence } : entry;
      const button = document.createElement('button'); button.className = 'record';
      const title = document.createElement('b'); title.textContent = record.typeName ?? (record.schemaId ? `Schema ${short(record.schemaId, 8)}` : 'Unknown Type');
      const id = document.createElement('small'); id.textContent = short(record.id ?? record.recordId ?? record.typeId, 14); button.append(title, id);
      button.addEventListener('click', async () => {
        inspect(title.textContent, recordResult ?? record);
        try {
          const schema = await state.sdk.readExact({ kind: 'schema', id: record.schemaId ?? record.typeId, blockTag: state.basis });
          const payload = await state.sdk.readVerifiedBytes({ contentId: record.contentId, blockTag: state.basis });
          const decoded = payload.qualification?.integrity === 'VERIFIED' ? await state.sdk.validateTypedPayloadAtBasis({ schemaId: record.schemaId ?? record.typeId, data: payload.value.bytes, blockTag: state.basis }) : { outcome: 'UNKNOWN', reasonCode: 'TYPED_PAYLOAD_BYTES_UNVERIFIED', qualification: payload.qualification, evidence: payload.evidence };
          renderTypedData(schema, payload, decoded); inspect('Selected schema and payload', decoded);
        } catch (error) {
          renderTypedData({}, {}, { outcome: 'UNKNOWN', reasonCode: error.message });
          say('Typed record could not be established');
        }
      }); list.append(button);
    }
  } catch (error) { showUnavailable(error); }
}

function openWrite(action) {
  if (!state.sdk) { say('Write unavailable without explicit SDK'); return; }
  state.action = action; const revision = action === 'revision';
  $('#write-title').textContent = revision ? 'Publish text revision' : action === 'folder' ? 'Create folder' : 'Create text file';
  $('#content-label').hidden = action === 'folder'; $('#write-name').value = revision ? (state.selected?.name ?? '') : ''; $('#write-name').disabled = revision;
  $('#write-content').value = revision ? $('#preview-body').textContent : ''; $('#plan-preview').textContent = 'Planning is wallet-free. Review the exact digest before approval.'; $('#write-dialog').showModal(); $('#write-name').focus();
}

function confirmOnce(mode, digest, setup = false) {
  const policy = promptPolicy(mode, state.sessionReady);
  if ((!setup && policy.routine === 0) || (setup && policy.setup === 0)) return Promise.resolve(true);
  $('#confirm-copy').textContent = setup ? 'Approve one bounded local session grant setup.' : mode === 'DIRECT_EOA' ? 'Approve one local transaction request.' : 'Approve one EIP-712 message for this exact plan.';
  $('#confirm-digest').textContent = digest ?? 'Digest supplied by SDK'; $('#confirm-dialog').showModal();
  return new Promise(resolve => $('#confirm-dialog').addEventListener('close', () => { const approved = $('#confirm-dialog').returnValue === 'approve'; if (approved) state.promptCount += 1; resolve(approved); }, { once: true }));
}

async function executeWrite(event) {
  event.preventDefault(); const action = state.action; const name = $('#write-name').value.trim(); const content = $('#write-content').value; const mode = new FormData($('#write-form')).get('mode');
  if (!name) { $('#plan-preview').textContent = 'A name is required; empty text content is allowed.'; return; }
  say(operationPresentation({ stage: 'WORKING' }).title);
  $('#plan-submit').disabled = true;
  try {
    const bootstrap = window.EFS_LAB_BOOTSTRAP ?? {};
    const selectedMode = mode === 'RELAYED_EOA' ? 'RELAYED' : mode === 'DIRECT_EOA' ? 'DIRECT' : 'SESSION'; let grant = bootstrap.sessionGrant?.grant ?? bootstrap.sessionGrant; let grantId = bootstrap.sessionGrant?.grantId ?? bootstrap.grantId;
    if (selectedMode === 'SESSION' && !state.sessionReady) {
      if (!grant) throw new Error('Session grant setup inputs unavailable');
      if (!await confirmOnce(mode, 'Exact bounded grant inputs', true)) throw new Error('Session grant setup rejected locally');
      const registered = await state.sdk.registerGrant({ grant, owner: bootstrap.accounts?.owner, from: bootstrap.accounts?.relayer });
      bootstrap.sessionGrant = { ...registered, grant }; grantId = registered.grantId; const observed = await state.sdk.readExact({ kind: 'grant', id: grantId, blockTag: 'latest' });
      verifiedSessionGrant({ observed, expectedGrant: registered.grant ?? grant, expectedGrantId: grantId }); state.sessionReady = true;
    }
    const ownerNonce = await state.sdk.readExact({ kind: 'ownerNonce', blockTag: 'latest' });
    let nonce = BigInt(ownerNonce.value ?? 0n); let deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
    grant = bootstrap.sessionGrant?.grant ?? grant;
    if (selectedMode === 'SESSION') { const grantInfo = await state.sdk.readExact({ kind: 'grant', id: grantId, blockTag: 'latest' }); verifiedSessionGrant({ observed: grantInfo, expectedGrant: grant, expectedGrantId: grantId }); nonce = BigInt(grantInfo.value?.writes ?? 0n); deadline = deadline < BigInt(grant.expiry) ? deadline : BigInt(grant.expiry); }
    const saltBytes = crypto.getRandomValues(new Uint8Array(32)); const salt = `0x${[...saltBytes].map(b => b.toString(16).padStart(2, '0')).join('')}`;
    const payload = { target: action === 'revision' ? (state.selected?.fileId ?? state.selected?.id) : state.directoryId, name, data: new TextEncoder().encode(content), salt, expectedRevision: BigInt(state.selected?.revision ?? 0n), nonce, deadline, grantId: selectedMode === 'SESSION' ? grantId : undefined };
    const builderName = action === 'folder' ? 'mkdir' : action === 'revision' ? 'reviseFile' : 'createFile';
    const operationBuilder = state.sdk.operations?.[builderName]; if (typeof operationBuilder !== 'function') throw new Error(`SDK builder ${builderName} unavailable`);
    const operation = operationBuilder(payload); const previousRevisionId = state.selected?.revisionId ?? state.selected?.previousRevisionId;
    const plan = state.sdk.planWrite({ operation, previousRevisionId }); $('#plan-preview').textContent = `Plan ${short(plan.digest ?? plan.planDigest, 18)} · no wallet touched by planning.`;
    if (!await confirmOnce(mode, plan.digest ?? plan.planDigest)) throw new Error('Approval rejected locally');
    $('#write-dialog').close(); say('Preparing exact approved plan');
    const account = selectedMode === 'SESSION' ? bootstrap.accounts?.session : bootstrap.accounts?.owner;
    const prepared = await state.sdk.prepareWrite(plan, { mode: selectedMode, account, grant: selectedMode === 'SESSION' ? bootstrap.sessionGrant?.grant : undefined }); inspect('Prepared write', prepared);
    const submitted = await state.sdk.submitWrite(prepared, { from: bootstrap.accounts?.relayer });
    const progress = operationPresentation({ stage: submitted.stage, effect: submitted.effect ?? qualification(submitted).effect }); say(progress.title); inspect('Submitted write', submitted);
    const readBack = await state.sdk.readBack(submitted, { blockTag: 'latest' }); adoptBasis(readBack); const finalState = operationPresentation({ stage: readBack.stage, effect: readBack.effect ?? qualification(readBack).effect }); say(finalState.title); inspect('Canonical read-back', readBack);
    if (finalState.success) { if (action === 'revision') state.selected = { ...state.selected, revision: readBack.prior?.predicted?.revision ?? plan.predicted?.revision, revisionId: readBack.prior?.predicted?.revisionId ?? plan.predicted?.revisionId }; await loadDirectory(); }
  } catch (error) { say(`Write not completed: ${error.message}`); $('#plan-preview').textContent = `Not completed — ${error.message}`; }
  finally { $('#plan-submit').disabled = false; }
}

async function play() {
  if (!state.sdk) return say('Play unavailable without explicit SDK');
  launchCoordinator.cancel(); gameLease.stop(); $('#stop-game').disabled = true; $('#game-byte-state').textContent = 'Verifying…';
  try {
    const config = window.EFS_LAB_BOOTSTRAP ?? {}; const fileId = config.gameFileId ?? config.game?.fileId; const revisionNumber = config.gameRevision ?? config.game?.revision; const contentId = config.gameContentId ?? config.game?.contentId; if (!fileId || revisionNumber == null || !contentId) throw new Error('Pinned game File/revision/content identity is unavailable');
    const outcome = await launchCoordinator.play({ fileId, revision: revisionNumber, contentId, expectedBytes: config.gameExpectedBytes ?? config.game?.expectedBytes, basis: state.basis });
    if (outcome.cancelled) return;
    adoptBasis(outcome.loaded); inspect('Signal Drift selected revision and verified bytes', { selected: outcome.selection, bytes: outcome.loaded, basis: outcome.loaded.basis, qualification: outcome.loaded.qualification }); $('#game-byte-state').textContent = `${outcome.bytes.byteLength} verified bytes`; $('#stop-game').disabled = false; say('Verified game launched in scripts-only sandbox');
  } catch (error) { $('#game-byte-state').textContent = 'Not launched'; $('#game-stage').replaceChildren(Object.assign(document.createElement('p'), { textContent: `Cannot launch: ${error.message}` })); say('Game remained stopped; bytes were not verified'); }
}

function stopGame(message) {
  launchCoordinator.cancel(); gameLease.stop(); $('#stop-game').disabled = true; $('#game-byte-state').textContent = 'Not running';
  if (message) say(message);
}

$$('[data-tab]').forEach(button => button.addEventListener('click', async () => {
  stopGame(); $$('[data-tab]').forEach(item => { item.classList.toggle('active', item === button); item.toggleAttribute('aria-current', item === button); });
  $$('.view').forEach(view => view.classList.toggle('active', view.dataset.view === button.dataset.tab));
  if (button.dataset.tab === 'data') await loadData();
}));
$$('[data-action]').forEach(button => button.addEventListener('click', () => openWrite(button.dataset.action)));
$('#write-form').addEventListener('submit', executeWrite); $('#refresh-data').addEventListener('click', async () => { state.basis = null; updateBasisSummary(); await loadData(); }); $('#play-game').addEventListener('click', play);
$('#close-write').addEventListener('click', () => $('#write-dialog').close('cancel')); $('#cancel-write').addEventListener('click', () => $('#write-dialog').close('cancel'));
$('#root-node').addEventListener('click', async () => { state.directoryId = state.sdk?.deployment?.rootId ?? state.directoryId; state.basis = null; updateBasisSummary(); $('#files-title').textContent = 'Lab root'; $('#pathline').textContent = '/'; await loadDirectory(); });
$('#stop-game').addEventListener('click', () => stopGame('Game stopped and isolated resources released'));
$('#copy-evidence').addEventListener('click', async () => { if (!state.evidence) return; await navigator.clipboard.writeText(taggedJson(state.evidence)); say('Evidence export copied'); });
addEventListener('pagehide', () => stopGame(), { once: true });

initialize();
