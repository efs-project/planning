// EFS Files browser prototype. Guest reads are wallet-free and pinned; writes
// go through the FilesRouter with simulated, counted approvals from clearly
// labeled disposable local test signers. One shared reader; no browser tree.
import { createFixtureReader, openDirectory, openFile, openHistory, openRevisions, openRemoved, openTags, lookupName, FIXTURE, tagId } from '/Reviews/2026-09-09-files-reader/index.mjs';
import { boundedJSON, createRPCSource, writePath } from './rpc-source.mjs';
import { presentListing } from './listing-presentation.mjs';
import { planOperation, authorizeAuthor, authorizeOperation, encodeExecute, decodeRouterError, latestBindingState, latestExecution, latestAuthorNonce, authorizeStage, encodeStage, contentLeaves, routerInterface, publicationHash } from '/Reviews/2026-09-09-files-browser-mvp/sdk/files-actions.mjs';
import { Wallet } from '/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js';

const $ = id => document.getElementById(id), main = document.querySelector('main');
const stringify = x => JSON.stringify(x, (_, v) => typeof v === 'bigint' ? String(v) : v, 2);
const short = x => x ? x.slice(0, 10) + '…' + x.slice(-8) : 'not available';
const text = (tag, value, className) => { const e = document.createElement(tag); e.textContent = value; if (className) e.className = className; return e; };
const toHex = bytes => '0x' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const fromHex = hex => new Uint8Array((hex.length - 2) / 2).map((_, i) => parseInt(hex.slice(2 + 2 * i, 4 + 2 * i), 16));

let config, reader, scope, stream, cancel, generation = 0, current = null, busy = false, opener = null;
let path = [], acquisitions = 1, pubCounter = 0;
const session = { signer: 'guest', wallet: null, principal: null, approvals: 0 };
let acquireChain = Promise.resolve();
// The scope serializes top-level acquisitions; every reader call goes through here.
function acquire(task) { const run = acquireChain.then(task, task); acquireChain = run.then(() => {}, () => {}); return run; }

// ---- session / prompts -----------------------------------------------------
function updateSession() {
  const write = config.write;
  $('signer-label').textContent = session.signer === 'guest' ? 'Guest · no wallet' : write.authors[session.signer].label + ' · simulated local signer';
  $('signer-label').className = session.signer === 'guest' ? 'guest' : 'author';
  $('prompts').textContent = session.approvals + ' approval' + (session.approvals === 1 ? '' : 's');
  $('toolbar').hidden = session.signer === 'guest';
  main.dataset.signer = session.signer;
}
function countApproval() { session.approvals++; updateSession(); }

// ---- consent dialog (the simulated wallet prompt) --------------------------
function consent(title, facts) {
  return new Promise(resolve => {
    $('consent-title').textContent = title;
    const body = $('consent-body'); body.replaceChildren();
    const dl = document.createElement('dl');
    for (const [k, v] of facts) dl.append(text('dt', k), text('dd', v));
    body.append(dl);
    const dialog = $('consent');
    const done = value => { dialog.close(); $('consent-approve').onclick = $('consent-cancel').onclick = null; dialog.onclose = null; resolve(value); };
    $('consent-approve').onclick = () => { countApproval(); done(true); };
    $('consent-cancel').onclick = () => done(false);
    dialog.onclose = () => resolve(false);
    dialog.showModal();
  });
}
function prompt(title, { withText = false, initial = '', initialText = '' } = {}) {
  return new Promise(resolve => {
    $('prompt-title').textContent = title;
    $('prompt-input').value = initial; $('prompt-text').hidden = !withText; $('prompt-text').value = initialText;
    const dialog = $('prompt-dialog');
    const done = v => { dialog.onclose = null; $('prompt-form').onsubmit = null; $('prompt-cancel').onclick = null; dialog.close(); resolve(v); };
    $('prompt-form').onsubmit = e => { e.preventDefault(); done({ name: $('prompt-input').value, text: $('prompt-text').value }); };
    $('prompt-cancel').onclick = () => done(null);
    dialog.onclose = () => resolve(null);
    dialog.showModal();
    $('prompt-input').focus();
  });
}
function toast(message, isError = false) { $('status').textContent = message; $('status').classList.toggle('error', isError); }

// ---- the write pipeline ----------------------------------------------------
async function submitRaw(to, data, gasLimit) {
  const nonce = BigInt(await writePath.transactionCount(session.wallet.address));
  const raw = await session.wallet.signTransaction({ chainId: 31337, nonce: Number(nonce), gasLimit, gasPrice: 2000000000n, to, data });
  const hash = await writePath.publish(raw);
  for (let i = 0; i < 400; i++) { const r = await writePath.receipt(hash); if (r) return r; await new Promise(ok => setTimeout(ok, 25)); }
  throw Error('no receipt within the bounded wait');
}
function friendlyError(e) {
  const decoded = e?.data ? decodeRouterError(e.data) : null;
  const map = {
    ErrDestinationOccupied: 'That name is already taken here. Nothing was changed.',
    ErrDestinationConflict: 'Sources disagree about that name. Nothing was changed.',
    ErrStaleEdit: 'Not saved; this note changed since you opened it. Your draft is intact.',
    ErrCasRevision: 'Someone changed this first. Nothing was overwritten; read again and retry.',
    ErrNameUnsupported: 'That name is valid but not supported by this ASCII router arm (it was not rewritten).',
    ErrNameMalformed: 'That name cannot be a file name here.',
    ErrCycle: 'That would move a folder into itself. Refused.',
    ErrRestoreCollision: 'The original spot is occupied. Restore under a different name, or free the spot first.',
    ErrMarkerInactive: 'This removed item was already restored.',
    ErrUnauthorizedAuthor: 'This signer is not authorized for that author.',
    ErrSourceMismatch: 'The source placement changed. Read again and retry.',
  };
  return decoded ? (map[decoded.name] ?? 'Refused by the router: ' + decoded.name) : (e.message ?? 'The operation failed before submission.');
}
let writing = false;
async function runOperation(kindLabel, intent, facts) {
  if (session.signer === 'guest') { toast('Reading is free for guests; select a local test signer to make changes.', true); return null; }
  if (writing) { toast('One change at a time: the previous operation is still in flight.', true); return null; }
  writing = true;
  main.dataset.writing = 'true';
  try {
    const write = config.write;
    const execution = await latestExecution(writePath.callLatest, config.expected.core);
    const plan = planOperation({ ...intent, principal: session.principal, pubNonce: BigInt(Date.now()) * 1000n + BigInt(pubCounter++) });
    if (plan.status !== 'PLANNED') { toast(plan.status === 'UNSUPPORTED' ? 'Unsupported (not invalid): ' + plan.reason : 'Refused: ' + plan.reason, true); return null; }
    const ok = await consent('Approve: ' + kindLabel, [...facts,
      ['Operation leaves', String(plan.publication.leaves.length) + ' record' + (plan.publication.leaves.length === 1 ? '' : 's') + ', atomic'],
      ['Envelope', short(plan.predicted.envelopeId)],
      ['Signer', write.authors[session.signer].label + ' (disposable local key)'],
    ]);
    if (!ok) { toast('Cancelled before submission; nothing was sent.'); return null; }
    const block = await writePath.latestBlock();
    const deadline = BigInt(block.timestamp) + 3600n;
    const coreNonce = BigInt(Date.now()) * 4096n + BigInt(pubCounter++);
    const authorNonce = await latestAuthorNonce(writePath.callLatest, write.router, session.principal);
    const operatorWallet = new Wallet(write.operatorKey);
    const prepared = await authorizeOperation(plan, {
      authorWallet: session.wallet, operatorWallet, router: write.router, core: config.expected.core,
      chainId: 31337, executionSetId: execution.executionSetId, coreRevision: execution.revision,
      coreNonce, authorNonce, deadline,
    });
    const receipt = await submitRaw(write.router, encodeExecute(prepared), 16777216n);
    if (receipt.status !== '0x1') { toast('The transaction was mined but rejected; nothing was changed.', true); return null; }
    return { plan, receipt };
  } catch (e) { toast(friendlyError(e), true); return null; }
  finally { writing = false; delete main.dataset.writing; }
}
async function stageBytes(treeId, treeBody, dataHex, label) {
  const write = config.write;
  const ok = await consent('Approve: stage file bytes', [['What', label], ['Bytes', String((dataHex.length - 2) / 2)], ['Byte staging', 'separate carrier approval, counted']]);
  if (!ok) return false;
  const execution = await latestExecution(writePath.callLatest, config.expected.core);
  const block = await writePath.latestBlock();
  const deadline = BigInt(block.timestamp) + 3600n;
  const nonce = BigInt(Date.now()) * 4096n + BigInt(pubCounter++);
  const signature = await authorizeStage({ operatorWallet: new Wallet(write.operatorKey), carrier: write.carrier, chainId: 31337, treeId, body: treeBody, data: dataHex, executionSetId: execution.executionSetId, nonce, deadline });
  const receipt = await submitRaw(write.carrier, encodeStage({ treeId, body: treeBody, data: dataHex, revision: execution.revision, nonce, deadline, signature }), 4000000n);
  return receipt.status === '0x1';
}
const nameOf = () => path.at(-1), here = () => nameOf().subject;
async function priorOf(purpose, subject, role) {
  const state = await latestBindingState(writePath.callLatest, config.expected.core, { principal: session.principal, purpose, subject, fieldRole: role });
  return state.prior;
}

// ---- rendering -------------------------------------------------------------
function closeWhy(restore = false) { if (!restore) opener = null; $('why').close(); }
$('close-why').addEventListener('click', () => closeWhy(true));
$('why').addEventListener('close', () => { if (opener?.isConnected) opener.focus(); opener = null; });
function allRows(s) { return [...(s?.rows ?? []), ...(s?.unresolved ?? []), ...(s?.masked ?? []), ...(s?.absent ?? [])]; }
function crumbs() {
  const nav = $('crumbs'); nav.replaceChildren();
  path.forEach((p, i) => {
    if (i) nav.append(text('span', ' / ', 'slash'));
    if (i === path.length - 1) nav.append(text('strong', p.name || 'trip'));
    else { const b = text('button', p.name || 'trip', 'crumb'); b.type = 'button'; b.addEventListener('click', () => { path = path.slice(0, i + 1); refresh({ samePin: true }); }); nav.append(b); }
  });
}
function explain(row, button) {
  if (!current || !button.isConnected) return;
  const observation = current;
  opener = button; const body = $('why-body'); body.replaceChildren();
  const messages = {
    FOUND: 'This Lens selects an exact Directory Entry. The reader checked its parent, name, File Object and publisher charter before showing it.',
    CONFLICT: 'The required sources disagree. No File Object is selected; no title, preview or action is borrowed from a losing claim.',
    UNKNOWN: 'The selected evidence cannot be interpreted as a valid file here. Nothing lower-priority is silently substituted.',
    MASKED: 'This Lens selects a mask here. It hides the placement, not the underlying File Object or its bytes.',
    ABSENT: 'No agreed value is selected by this Lens at this observation. This does not prove the file exists nowhere.',
  };
  body.append(text('p', messages[row.outcome] ?? 'This position is unresolved.'));
  if (observation.rowsEvidence === 'PRIOR_SEALED') body.append(text('p', 'These are prior sealed rows. The latest attempt failed; they are not a fresh complete result.'));
  const facts = items => { const dl = document.createElement('dl'); for (const [l, v] of items) dl.append(text('dt', l), text('dd', v)); return dl; };
  body.append(facts([
    ['Result', row.outcome], ['Lens', $('lens').selectedOptions[0].textContent],
    ['Pinned block', String(observation.basis.blockNumber) + ' · host revision ' + observation.basis.revision],
    ['Enumeration', observation.coverage], ['Read acquisitions this session', String(acquisitions)],
    ['Reason', row.reason ?? 'No row error'],
  ]));
  const identity = document.createElement('details'); identity.id = 'identity-details';
  identity.append(text('summary', 'Exact identities and verification details'));
  identity.append(facts([
    ['Namespace Plan', config.plans[$('lens').value]], ['Mount', config.mounts[$('lens').value]],
    ['Directory subject', here()], ['Block hash', observation.basis.blockHash],
    ['Execution set', observation.basis.executionSetId],
    ['Position role', row.fieldRole ?? 'aggregate'], ['Selected Entry', row.selectedId ?? 'None'],
    ['File Object', row.value?.nodeId ?? 'None'], ['File publisher', row.value?.publisher ?? 'Not selected'],
  ]));
  body.append(identity);
  const details = document.createElement('details'); details.id = 'rpc-details';
  details.append(text('summary', 'Inspect ' + (observation.evidence?.length ?? 0) + ' actual read attempts'));
  details.addEventListener('toggle', () => { if (details.open && details.children.length === 1) details.append(text('pre', stringify(observation.evidence))); });
  body.append(details);
  $('why').showModal();
}

function rowActions(row) {
  const usable = row.outcome === 'FOUND';
  const box = document.createElement('span'); box.className = 'row-actions';
  const add = (label, fn, title2) => { const b = text('button', label, 'row-button'); b.type = 'button'; if (title2) b.title = title2; b.addEventListener('click', fn); box.append(b); return b; };
  if (usable && row.value.kind === 'DIRECTORY') add('Open', () => { path = [...path, { name: row.value.name, subject: row.value.subject }]; refresh({ samePin: true }); });
  if (usable && row.value.kind === 'FILE') add('Open', () => filePanel(row));
  if (usable && session.signer !== 'guest') {
    add('Rename', () => renameFlow(row, false));
    add('Move', () => renameFlow(row, true));
    if (row.value.kind === 'FILE') {
      add('Copy', () => copyFlow(row));
      add('Link', () => placementFlow(row), 'Add another placement of the SAME file');
    }
    add('Remove', () => removeFlow(row));
  }
  const why = text('button', 'Why?', 'why-button'); why.type = 'button'; why.dataset.why = row.fieldRole;
  why.setAttribute('aria-label', 'Why this result: ' + (row.value?.name ?? row.outcome));
  why.addEventListener('click', () => explain(row, why)); box.append(why);
  return box;
}

async function tagsFor(rows) {
  const wanted = $('tag-filter').value.trim();
  if (!wanted || !rows.length) return null;
  const t = tagId(wanted);
  const byNode = new Map();
  for (const row of rows) {
    const result = await acquire(() => openTags(scope, { mountId: config.mounts[$('lens').value], nodeId: row.value.nodeId, tagIds: [t] }));
    byNode.set(row.value.nodeId, result.outcome === 'FOUND' && result.value.current.some(c => c.active));
  }
  return byNode;
}

async function render(s) {
  current = s;
  const presentation = presentListing(s);
  const nameFilter = $('filter').value.trim().toLowerCase();
  let rows = allRows(s);
  let tagMap = null, tagNote = '';
  if ($('tag-filter').value.trim()) {
    try { tagMap = await tagsFor(s.rows ?? []); tagNote = ' · tag filter is positive-only over the loaded rows (' + s.coverage + ' coverage)'; }
    catch { tagNote = ' · tag filter unavailable'; }
  }
  for (const id of ['rows', 'attention-rows', 'history-rows']) $(id).replaceChildren();
  $('attention').hidden = presentation.attention.length === 0;
  $('attention-title').textContent = 'Needs attention (' + presentation.attention.length + ')';
  const past = presentation.history.length;
  $('history').hidden = past === 0;
  $('history-summary').textContent = past + ' past or hidden position' + (past === 1 ? '' : 's') + ' examined';
  let shown = 0, filtered = 0;
  for (const row of rows) {
    const usable = row.outcome === 'FOUND';
    if (usable && nameFilter && !row.value.name.toLowerCase().includes(nameFilter)) { filtered++; continue; }
    if (usable && tagMap && !tagMap.get(row.value.nodeId)) { filtered++; continue; }
    const li = document.createElement('li');
    li.dataset.role = row.fieldRole; li.dataset.outcome = row.outcome; li.dataset.result = stringify(row);
    if (!usable) li.className = 'unresolved';
    const title = usable ? row.value.name : row.outcome === 'MASKED' ? 'Masked position' : row.outcome === 'ABSENT' ? 'No agreed placement' : 'Unresolved position';
    const info = document.createElement('div');
    info.append(text('div', title + (usable && row.value.kind === 'DIRECTORY' ? '/' : ''), 'row-title'));
    info.append(text('div', usable ? (row.value.kind === 'DIRECTORY' ? 'Folder' : 'File') + ' · ' + short(row.value.nodeId) : row.outcome + ' · position ' + short(row.fieldRole), 'row-meta'));
    li.append(info, rowActions(row));
    if (usable) shown++;
    $(usable ? 'rows' : ['ABSENT', 'MASKED'].includes(row.outcome) ? 'history-rows' : 'attention-rows').append(li);
  }
  const unavailable = s.qualification.status !== 'QUALIFIED';
  $('coverage').textContent = unavailable ? 'Read unavailable' : s.coverage === 'COMPLETE' ? 'Listing complete' : 'Partial listing';
  const filterNote = (nameFilter || tagMap) ? ' · ' + filtered + ' loaded row' + (filtered === 1 ? '' : 's') + ' hidden by filters (zero matches is not proof of zero total)' : '';
  toast(presentation.summary + filterNote + tagNote);
  $('more').hidden = unavailable || !s.continuation;
  $('export').hidden = unavailable || !s.rows?.length;
  $('basis').textContent = `Pinned block ${s.basis.blockNumber} · host revision ${s.basis.revision} · ${scope.stats().requests} RPC reads this acquisition · acquisition ${acquisitions}`;
  main.dataset.block = String(s.basis.blockNumber); main.dataset.revision = s.basis.executionSetId;
  await renderTrash();
}
async function renderTrash() {
  if (session.signer === 'guest') { $('trash').hidden = true; return; }
  try {
    const removed = await acquire(() => openRemoved(scope, { mountId: config.mounts[$('lens').value], subject: here() }));
    const items = removed.outcome === 'FOUND' ? removed.value.items.filter(i => i.active) : [];
    $('trash').hidden = items.length === 0;
    $('trash-summary').textContent = 'Removed items (' + items.length + ')';
    $('trash-rows').replaceChildren();
    for (const item of items) {
      const li = document.createElement('li'); li.dataset.marker = item.markerId;
      const info = document.createElement('div');
      info.append(text('div', item.name, 'row-title'));
      info.append(text('div', 'removed placement · File ' + short(item.object) + ' · not erased', 'row-meta'));
      const actions = document.createElement('span'); actions.className = 'row-actions';
      const restore = text('button', 'Restore', 'row-button'); restore.type = 'button';
      restore.addEventListener('click', () => restoreFlow(item)); actions.append(restore);
      li.append(info, actions); $('trash-rows').append(li);
    }
  } catch { $('trash').hidden = true; }
}

// ---- flows -----------------------------------------------------------------
async function afterWrite(result, message) {
  if (!result) return;
  await refresh({});
  // canonical read-back: all predicted records present at the fresh basis
  try {
    const missing = [];
    for (const id of result.plan.publication.recordIds) {
      const r = await acquire(() => scope.call('getRecord', [id]));
      if (r.status !== 'OK' || r.values[2] === 0n) missing.push(id);
    }
    toast(missing.length ? 'Submitted, but read-back could not verify every effect yet.' : message + ' Committed and read back at block ' + current.basis.blockNumber + '.');
  } catch { toast(message + ' Submitted; read-back unavailable.', true); }
}
async function newFolderFlow() {
  const input = await prompt('New folder name'); if (!input?.name) return;
  const result = await runOperation('create folder “' + input.name + '”', {
    kind: 'createDir', mountId: config.mounts[$('lens').value], parent: here(), name: input.name,
    priors: { destination: await priorOfName(input.name) },
  }, [['Folder', input.name], ['In', crumbText()]]);
  await afterWrite(result, 'Folder created.');
}
const crumbText = () => path.map(p => p.name || 'trip').join('/') + '/';
async function priorOfName(name) { const { nameRole } = await import('/Reviews/2026-09-09-files-reader/index.mjs'); return priorOf(FIXTURE.namePurpose, here(), nameRole(name)); }
async function newNoteFlow() {
  const input = await prompt('New note', { withText: true, initialText: 'Write your note…' }); if (!input?.name) return;
  const bytesHex = toHex(new TextEncoder().encode(input.text));
  const intent = { kind: 'createFile', mountId: config.mounts[$('lens').value], parent: here(), name: input.name, bytesHex, mediaType: 'text/plain', charset: 'utf-8', priors: { destination: await priorOfName(input.name) } };
  const result = await runOperation('create note “' + input.name + '”', intent, [['Note', input.name], ['In', crumbText()], ['Bytes', String((bytesHex.length - 2) / 2)]]);
  if (result) {
    const staged = await stageBytes(result.plan.predicted.treeId, result.plan.publication.leaves[2].body, bytesHex, input.name);
    await afterWrite(result, staged ? 'Note created with verified bytes.' : 'Note created; bytes not staged yet.');
  }
}
async function uploadFlow(file) {
  if (!file) return;
  const bytesHex = toHex(new Uint8Array(await file.arrayBuffer()));
  if ((bytesHex.length - 2) / 2 > 16384) { toast('This prototype stages at most 16 KiB per file.', true); return; }
  const name = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  const intent = { kind: 'createFile', mountId: config.mounts[$('lens').value], parent: here(), name, bytesHex, mediaType: file.type || 'application/octet-stream', charset: null, priors: { destination: await priorOfName(name) } };
  const result = await runOperation('upload “' + name + '”', intent, [['Image', name + (name === file.name ? '' : ' (renamed to fit the ASCII arm; original: ' + file.name + ')')], ['In', crumbText()], ['Bytes', String((bytesHex.length - 2) / 2)]]);
  if (result) {
    const staged = await stageBytes(result.plan.predicted.treeId, result.plan.publication.leaves[2].body, bytesHex, name);
    await afterWrite(result, staged ? 'Image uploaded with verified bytes.' : 'Image record created; bytes not staged.');
  }
}
async function renameFlow(row, move) {
  const input = await prompt(move ? 'Move “' + row.value.name + '” into folder path (blank = here) and name' : 'Rename “' + row.value.name + '”', { initial: row.value.name });
  if (!input?.name) return;
  let destParent = here(), ancestorNames = [];
  if (move) {
    const target = await prompt('Destination folder path from root, e.g. photos or photos/docs (blank = root)');
    if (target === null) return;
    const segments = target.name.split('/').filter(Boolean);
    let subject = path[0].subject;
    for (const segment of segments) {
      const found = await acquire(() => lookupName(scope, { mountId: config.mounts[$('lens').value], subject, name: segment }));
      if (found.outcome !== 'FOUND' || found.value.kind !== 'DIRECTORY') { toast('Destination folder not found: ' + segment, true); return; }
      subject = found.value.subject;
    }
    destParent = subject; ancestorNames = segments;
  }
  const result = await runOperation(move ? 'move' : 'rename', {
    kind: 'renameMove', mountId: config.mounts[$('lens').value], parent: destParent, name: input.name,
    sourceParent: here(), sourceName: row.value.name, object: row.value.nodeId, ancestorNames,
    priors: { destination: await priorOf(FIXTURE.namePurpose, destParent, (await import('/Reviews/2026-09-09-files-reader/index.mjs')).nameRole(input.name)), source: await priorOfName(row.value.name) },
  }, [['From', crumbText() + row.value.name], ['To', input.name], ['Identity', 'File Object unchanged: ' + short(row.value.nodeId)]]);
  await afterWrite(result, (move ? 'Moved.' : 'Renamed.') + ' The file identity did not change.');
}
async function copyFlow(row) {
  const input = await prompt('Copy “' + row.value.name + '” as'); if (!input?.name) return;
  const content = await acquire(() => openFile(scope, { mountId: config.mounts[$('lens').value], fileId: row.value.nodeId }));
  if (content.outcome !== 'FOUND' || !content.value.revisionId) { toast('Cannot copy: current content is unresolved.', true); return; }
  const treeRecord = await acquire(() => scope.call('getRecord', [content.value.revisionId]));
  if (treeRecord.status !== 'OK') { toast('Cannot copy: revision unavailable.', true); return; }
  // The copy shares the exact admitted ChunkTree; a NEW File identity is minted.
  const revBody = treeRecord.values[1];
  const treeId = '0x' + revBody.slice(2 + 64, 2 + 128);
  const result = await runOperation('copy', {
    kind: 'copy', mountId: config.mounts[$('lens').value], parent: here(), name: input.name,
    treeId, mediaType: content.value.mediaType, charset: content.value.charset,
    priors: { destination: await priorOfName(input.name) },
  }, [['Copy of', row.value.name], ['New name', input.name], ['Result', 'a NEW file sharing the same exact bytes']]);
  await afterWrite(result, 'Copied as a new file; edits to the copy will not change the original.');
}
async function placementFlow(row) {
  const input = await prompt('Second placement name for the SAME file'); if (!input?.name) return;
  const result = await runOperation('link placement', {
    kind: 'placement', mountId: config.mounts[$('lens').value], parent: here(), name: input.name,
    object: row.value.nodeId, priors: { destination: await priorOfName(input.name) },
  }, [['Same file', short(row.value.nodeId)], ['New placement', crumbText() + input.name], ['Result', 'one file, two names; removing one placement keeps the other']]);
  await afterWrite(result, 'Placement added: the same file now has another name.');
}
async function removeFlow(row) {
  const result = await runOperation('remove “' + row.value.name + '”', {
    kind: 'remove', mountId: config.mounts[$('lens').value], parent: here(), name: row.value.name,
    object: row.value.nodeId, selectedEntry: row.selectedId, priors: { source: await priorOfName(row.value.name) },
  }, [['Remove', crumbText() + row.value.name], ['Effect', 'masks this placement and records a Removed item'], ['Not erased', 'bytes and history remain; other placements stay']]);
  await afterWrite(result, 'Removed from this folder (not erased).');
}
async function restoreFlow(item) {
  let name = item.name;
  let destinationPrior = await priorOfName(name);
  const occupied = await acquire(() => lookupName(scope, { mountId: config.mounts[$('lens').value], subject: here(), name }));
  if (occupied.outcome === 'FOUND') {
    const input = await prompt('“' + name + '” is occupied. Restore as', { initial: name + '-restored' });
    if (!input?.name) return;
    name = input.name; destinationPrior = await priorOfName(name);
  }
  const result = await runOperation('restore “' + item.name + '”', {
    kind: 'restore', mountId: config.mounts[$('lens').value], parent: here(), name,
    object: item.object, markerId: item.markerId,
    priors: { destination: destinationPrior, marker: await priorOf(FIXTURE.removedPurpose, here(), item.markerId) },
  }, [['Restore', item.name + (name === item.name ? '' : ' as ' + name)], ['Same file', short(item.object)]]);
  await afterWrite(result, 'Restored.');
}

// ---- file panel ------------------------------------------------------------
async function filePanel(row) {
  const dialog = $('file-panel'), body = $('file-body');
  $('file-title').textContent = row.value.name;
  body.replaceChildren(text('p', 'Reading verified content…'));
  dialog.showModal();
  const mountId = config.mounts[$('lens').value];
  try {
    const [content, revisions, history, tags] = [
      await acquire(() => openFile(scope, { mountId, fileId: row.value.nodeId })),
      await acquire(() => openRevisions(scope, { mountId, fileId: row.value.nodeId })),
      await acquire(() => openHistory(scope, { mountId, subject: here(), name: row.value.name })),
      await acquire(() => openTags(scope, { mountId, nodeId: row.value.nodeId, tagIds: (config.knownTags ?? []).map(t => tagId(t)) })),
    ];
    body.replaceChildren();
    renderContent(body, row, content);
    renderTags(body, row, tags);
    renderRevisions(body, row, revisions);
    renderHistory(body, history);
  } catch (e) { body.replaceChildren(text('p', 'Content unavailable: ' + e.message, 'error')); }
}
function renderContent(body, row, content, revisionLabel = 'current') {
  const section = document.createElement('section'); section.className = 'content';
  section.append(text('h3', 'Content (' + revisionLabel + ')'));
  if (content.outcome !== 'FOUND') { section.append(text('p', 'Unresolved content: ' + (content.reason ?? content.outcome))); body.append(section); return; }
  const v = content.value;
  const meta = text('p', v.mediaType + ' · ' + v.totalSize + ' bytes · integrity ' + v.integrity, 'row-meta');
  section.append(meta);
  if (v.integrity === 'VERIFIED' && v.bytes) {
    if (v.mediaType.startsWith('image/') && !v.executableHint) {
      const img = document.createElement('img');
      const blob = new Blob([fromHex(v.bytes)], { type: v.mediaType });
      img.src = URL.createObjectURL(blob); img.alt = row.value.name; img.className = 'preview';
      section.append(img);
    } else if (v.mediaType === 'text/plain') {
      const pre = document.createElement('pre'); pre.className = 'note-view';
      pre.textContent = new TextDecoder(v.charset ?? 'utf-8', { fatal: false }).decode(fromHex(v.bytes));
      section.append(pre);
      if (session.signer !== 'guest' && revisionLabel === 'current') {
        const edit = text('button', 'Edit note', 'row-button'); edit.type = 'button';
        edit.addEventListener('click', () => editNote(row, v, pre.textContent));
        section.append(edit);
      }
    } else {
      section.append(text('p', 'Verified bytes retained. This media type is not previewed in the trusted origin.'));
    }
  } else if (v.integrity === 'BYTES_UNAVAILABLE') {
    section.append(text('p', 'Bytes are not currently available from the configured carrier. The file is not absent; its identity and metadata are verified.'));
  } else {
    section.append(text('p', 'Returned bytes FAILED verification and are not previewed.'));
  }
  body.append(section);
}
async function editNote(row, contentValue, initialText) {
  const input = await prompt('Edit “' + row.value.name + '”', { withText: true, initial: row.value.name, initialText });
  if (!input) return;
  const bytesHex = toHex(new TextEncoder().encode(input.text));
  const intent = {
    kind: 'edit', mountId: config.mounts[$('lens').value], fileId: row.value.nodeId, bytesHex,
    mediaType: contentValue.mediaType, charset: contentValue.charset, priorRevisionId: contentValue.revisionId,
    priors: { head: await priorOf(FIXTURE.headPurpose, row.value.nodeId, FIXTURE.headRole) },
  };
  const result = await runOperation('edit note', intent, [['Note', row.value.name], ['New bytes', String((bytesHex.length - 2) / 2)], ['Race safety', 'compare-and-swap on the current revision']]);
  if (result) {
    const staged = await stageBytes(result.plan.predicted.treeId, result.plan.publication.leaves[0].body, bytesHex, row.value.name);
    $('file-panel').close();
    await afterWrite(result, staged ? 'Edited; new revision verified.' : 'Edited; bytes not staged.');
  }
}
function renderRevisions(body, row, revisions) {
  const section = document.createElement('section');
  section.append(text('h3', 'History'));
  if (revisions.outcome !== 'FOUND') { section.append(text('p', 'Revision history unavailable.')); body.append(section); return; }
  const ul = document.createElement('ul'); ul.className = 'revisions';
  for (const r of revisions.value.revisions) {
    const li = document.createElement('li');
    li.append(text('span', 'Revision ' + r.revision + (r.current ? ' (current)' : '') + ' · ' + (r.mediaType ?? 'retracted') + ' · ' + short(r.revisionId ?? '')));
    if (r.revisionId && !r.current) {
      const openOld = text('button', 'Open this revision', 'row-button'); openOld.type = 'button';
      openOld.addEventListener('click', async () => {
        const old = await acquire(() => openFile(scope, { mountId: config.mounts[$('lens').value], fileId: row.value.nodeId, revisionId: r.revisionId }));
        const container = document.createElement('div'); li.append(container);
        renderContent(container, row, old, 'revision ' + r.revision);
      });
      li.append(openOld);
    }
    ul.append(li);
  }
  section.append(ul); body.append(section);
}
function renderHistory(body, history) {
  if (history.outcome !== 'FOUND' || !history.value.timeline.length) return;
  const section = document.createElement('section');
  const details = document.createElement('details');
  details.append(text('summary', 'Name timeline (' + history.value.timeline.length + ' events)'));
  const ul = document.createElement('ul');
  for (const h of history.value.timeline) ul.append(text('li', 'rev ' + h.revision + ' · ' + h.kind + ' · source ' + short(h.principal)));
  details.append(ul); section.append(details); body.append(section);
}
function renderTags(body, row, tags) {
  const section = document.createElement('section');
  section.append(text('h3', 'Tags'));
  const list = document.createElement('div'); list.className = 'tags';
  const active = tags.outcome === 'FOUND' ? tags.value.current.filter(t => t.active) : [];
  const label = id => (config.knownTags ?? []).find(t => tagId(t) === id) ?? short(id);
  if (!active.length) list.append(text('span', 'No current tags from the trusted sources.', 'row-meta'));
  for (const t of active) {
    const chip = text('span', label(t.tagId) + ' · by ' + (t.principal === config.authors.A ? 'A' : t.principal === config.authors.B ? 'B' : short(t.principal)), 'tag-chip');
    if (session.signer !== 'guest' && t.principal === session.principal) {
      const un = text('button', '×', 'chip-remove'); un.type = 'button'; un.title = 'Withdraw my tag (other authors keep theirs)';
      un.addEventListener('click', async () => {
        const result = await runOperation('untag', { kind: 'untag', mountId: config.mounts[$('lens').value], object: row.value.nodeId, label: label(t.tagId), priors: { tag: await priorOf(FIXTURE.tagPurpose, row.value.nodeId, t.tagId) } }, [['Untag', label(t.tagId)], ['Scope', 'withdraws only YOUR assertion']]);
        if (result) { $('file-panel').close(); await afterWrite(result, 'Your tag was withdrawn; other authors keep theirs.'); }
      });
      chip.append(un);
    }
    list.append(chip);
  }
  section.append(list);
  if (session.signer !== 'guest') {
    const add = text('button', 'Add tag', 'row-button'); add.type = 'button';
    add.addEventListener('click', async () => {
      const input = await prompt('Tag “' + row.value.name + '” with'); if (!input?.name) return;
      const result = await runOperation('tag', { kind: 'tag', mountId: config.mounts[$('lens').value], object: row.value.nodeId, label: input.name, priors: { tag: await priorOf(FIXTURE.tagPurpose, row.value.nodeId, tagId(input.name)) } }, [['Tag', input.name], ['On', row.value.name], ['Attribution', 'asserted by ' + config.write.authors[session.signer].label]]);
      if (result) { if (!config.knownTags.includes(input.name)) config.knownTags.push(input.name); $('file-panel').close(); await afterWrite(result, 'Tagged.'); }
    });
    section.append(add);
  }
  body.append(section);
}
$('close-file').addEventListener('click', () => $('file-panel').close());

// ---- export ----------------------------------------------------------------
async function exportFolder() {
  try {
    toast('Collecting the export bundle…');
    const bundle = { kind: 'EFS_FILES_EXPORT_V0', exportedAt: new Date().toISOString(), basis: current.basis, mountId: config.mounts[$('lens').value], subject: here(), pathLabel: crumbText(), coverage: current.coverage, rows: [], files: {}, evidence: current.evidence };
    for (const row of current.rows) {
      bundle.rows.push({ name: row.value.name, kind: row.value.kind, nodeId: row.value.nodeId, selectedId: row.selectedId, fieldRole: row.fieldRole });
      if (row.value.kind === 'FILE') {
        const content = await acquire(() => openFile(scope, { mountId: config.mounts[$('lens').value], fileId: row.value.nodeId }));
        if (content.outcome === 'FOUND') bundle.files[row.value.nodeId] = { name: row.value.name, revisionId: content.value.revisionId, mediaType: content.value.mediaType, charset: content.value.charset, totalSize: content.value.totalSize, integrity: content.value.integrity, bytes: content.value.bytes };
        else bundle.files[row.value.nodeId] = { name: row.value.name, integrity: 'UNRESOLVED', partial: true };
      }
    }
    const blob = new Blob([JSON.stringify(bundle, (_, v) => typeof v === 'bigint' ? String(v) : v, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'efs-export-' + String(current.basis.blockNumber) + '.json';
    document.body.append(a); a.click(); a.remove();
    toast('Export saved. Verify it in a clean reader with: node scripts/verify-export.mjs <file>');
  } catch (e) { toast('Export failed: ' + e.message, true); }
}

// ---- loading ---------------------------------------------------------------
async function load(g) {
  if (busy || g !== generation) return; busy = true; main.dataset.state = 'loading';
  $('coverage').textContent = 'Reading more';
  try {
    const result = await acquire(() => stream.loadMore());
    if (g !== generation) return;
    if (result.rowsEvidence === 'PRIOR_SEALED' && /budget/.test(result.detail ?? '')) {
      // Simple budget policy: transparently begin a fresh acquisition at the
      // SAME pinned block and continue; the acquisition counter stays honest.
      const reopened = await reader.open({ blockTag: '0x' + current?.basis.blockNumber?.toString(16) ?? 'latest', signal: cancel.signal });
      if (reopened.status === 'READY') { scope?.close(); scope = reopened.scope; acquisitions++; stream = openDirectory(scope, { mountId: config.mounts[$('lens').value], subject: here(), pageSize: 8 }); return load(g); }
    }
    await render(result);
  } catch (e) { if (g === generation) { $('coverage').textContent = 'Read unavailable'; toast('The read could not finish: ' + e.message, true); } }
  finally { if (g === generation) { busy = false; main.dataset.state = 'settled'; } }
}
async function refresh({ samePin = false } = {}) {
  const g = ++generation;
  const pin = samePin && current ? '0x' + current.basis.blockNumber.toString(16) : 'latest';
  stream?.close();
  // The abort signal belongs to the scope: navigating within the same pinned
  // observation must NOT abort the live scope it keeps using.
  if (!samePin) { cancel?.abort(); cancel = new AbortController(); scope?.close(); scope = null; }
  else if (!cancel) cancel = new AbortController();
  current = null; busy = false; closeWhy();
  for (const id of ['rows', 'attention-rows', 'history-rows', 'trash-rows']) $(id).replaceChildren();
  $('attention').hidden = true; $('history').hidden = true; $('trash').hidden = true;
  $('more').hidden = true; $('export').hidden = true; $('basis').textContent = '';
  main.dataset.state = 'loading'; crumbs();
  $('coverage').textContent = 'Reading observation';
  toast('Checking the pinned source before listing this folder…');
  try {
    if (!scope) {
      const opened = await reader.open({ blockTag: samePin ? pin : 'latest', signal: cancel.signal });
      if (g !== generation) { opened.scope?.close(); return; }
      if (opened.status !== 'READY') throw Error(opened.reason);
      scope = opened.scope; acquisitions++;
    }
    stream = openDirectory(scope, { mountId: config.mounts[$('lens').value], subject: here(), pageSize: 8 });
    await load(g);
  } catch (e) {
    if (g !== generation) return;
    $('coverage').textContent = 'Read unavailable';
    toast('No folder result: ' + e.message + '. This is not an empty-folder claim.', true);
    main.dataset.state = 'settled';
  }
}

// ---- wire up ---------------------------------------------------------------
$('more').addEventListener('click', () => { if (!busy) load(generation); });
$('refresh').addEventListener('click', () => { if (config) refresh({}); });
$('lens').addEventListener('change', () => { if (config) refresh({}); });
$('filter').addEventListener('input', () => { if (current) render(current); });
$('tag-filter').addEventListener('change', () => { if (current) render(current); });
$('export').addEventListener('click', exportFolder);
$('new-folder').addEventListener('click', newFolderFlow);
$('new-note').addEventListener('click', newNoteFlow);
$('upload').addEventListener('change', e => { uploadFlow(e.target.files[0]); e.target.value = ''; });
$('signer').addEventListener('change', () => {
  const value = $('signer').value;
  if (value === 'guest') { session.signer = 'guest'; session.wallet = null; session.principal = null; }
  else { session.signer = value; session.wallet = new Wallet(config.write.authors[value].key); session.principal = config.write.authors[value].principal; }
  updateSession(); if (current) render(current);
});
addEventListener('pagehide', () => { generation++; cancel?.abort(); stream?.close(); scope?.close(); });

try {
  const response = await fetch('/config', { credentials: 'omit', cache: 'no-store' });
  if (!response.ok) throw Error('fixture config unavailable');
  config = await boundedJSON(response, 1048576);
  if (config.kind !== 'DISPOSABLE_FILES_BROWSER') throw Error('unsupported fixture');
  config.knownTags = config.knownTags ?? ['ocean', 'draft'];
  path = [{ name: config.rootLabel ?? 'trip', subject: config.root }];
  if (config.write) for (const [key, author] of Object.entries(config.write.authors)) {
    const option = text('option', author.label + ' (local test signer)'); option.value = key; $('signer').append(option);
  }
  const query = new URLSearchParams(location.search);
  const lens = query.get('lens');
  $('lens').value = ['aFirst', 'bFirst', 'exact'].includes(lens) ? lens : 'aFirst';
  $('scenario').textContent = config.scenario ?? 'Local upgradeable testnet fixture.';
  $('delay').textContent = config.injectedDelayMs ? `Test transport: ${config.injectedDelayMs} ms injected before each RPC read.` : 'Local transport; no injected RPC delay.';
  updateSession();
  reader = createFixtureReader({ source: createRPCSource({ identity: config.expected.source }), context: { expected: config.expected } });
  await refresh({});
} catch (e) { $('coverage').textContent = 'Read unavailable'; toast('Cannot start this local fixture: ' + e.message, true); main.dataset.state = 'settled'; }
