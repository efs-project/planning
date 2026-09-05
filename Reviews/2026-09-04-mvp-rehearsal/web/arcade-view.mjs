import { createGameLease, createLaunchCoordinator, taggedJson } from './model.mjs';

const lower = value => String(value ?? '').toLowerCase();
const bytes32 = (value, label) => {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value)) throw new Error(`${label} must be one exact bytes32 identity`);
  return value.toLowerCase();
};
const byteArray = value => {
  if (value instanceof Uint8Array) return value;
  if (typeof value !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) throw new Error('Verified bytes are not an exact byte array');
  return Uint8Array.from(value.slice(2).match(/../g) ?? [], byte => Number.parseInt(byte, 16));
};
const hexBytes = value => `0x${Array.from(byteArray(value), byte => byte.toString(16).padStart(2, '0')).join('')}`;
const basisHash = value => lower(value?.basis?.blockHash ?? value?.blockHash);

function qualified(result, label, { verified = false, current = true } = {}) {
  const q = result?.qualification ?? {};
  if (result?.outcome !== 'FOUND' || q.coverage !== 'COMPLETE' || q.support !== 'SUPPORTED' || q.validation !== 'VALID' || q.availability !== 'AVAILABLE' || !/^0x[0-9a-f]{64}$/.test(basisHash(result)) || (current && q.currentness !== 'CURRENT_AT_BASIS') || (verified && (q.integrity !== 'VERIFIED' || q.bytes !== 'RETURNED'))) {
    throw new Error(`${label} is not a qualified ${verified ? 'verified byte' : 'exact'} result (${result?.reasonCode ?? result?.outcome ?? 'unavailable'})`);
  }
}

function sameSubject(result, subject, label) {
  if (lower(result?.domain?.subject) !== lower(subject)) throw new Error(`${label} exact identity binding failed`);
}

export function parseArcadeRoute(hash, defaultChallengeId) {
  if (hash === '#arcade') return bytes32(defaultChallengeId, 'Default challenge');
  const match = /^#arcade\?challenge=(0x[0-9a-fA-F]{64})$/.exec(hash);
  if (!match) throw new Error('Arcade route requires exactly one challenge bytes32 Record ID');
  return match[1].toLowerCase();
}

export function arcadeReleaseLock(config) {
  const source = config?.game;
  if (!source || Number(source.revision) !== 2) throw new Error('Lab release lock requires exact revision 2');
  if (source.runnerProfile !== 'opaque-scripts/1') throw new Error('Unsupported release runner profile');
  if (!Array.isArray(source.capabilityCeiling) || source.capabilityCeiling.length !== 0) throw new Error('Release capability ceiling must deny every capability');
  if (source.closure != null && source.closure !== 'single-artifact') throw new Error('Release closure must be single-artifact');
  return Object.freeze({
    kind: 'efs-lab/signal-drift-exact-release/1',
    fileId: bytes32(source.fileId, 'Release File'), revision: 2,
    contentId: bytes32(source.contentId, 'Release content'),
    challengeSchemaId: bytes32(source.challengeSchemaId, 'Challenge schema'),
    closure: 'single-artifact', runnerProfile: source.runnerProfile,
    capabilityCeiling: Object.freeze([]),
  });
}

export function verifyChallengeLaunch(input, utilities) {
  const releaseLock = arcadeReleaseLock({ game: input.releaseLock });
  const { challengeId, selection, gamePayload, record, schema, payload, validation } = input;
  bytes32(challengeId, 'Challenge');
  for (const name of ['deriveContentId', 'deriveSchemaId', 'deriveRecordId']) if (typeof utilities?.[name] !== 'function') throw new Error(`Required SDK identity utility ${name} is unavailable`);
  const results = { selection, gamePayload, record, schema, payload, validation };
  for (const [name, result] of Object.entries(results)) {
    qualified(result, name, { verified: ['gamePayload', 'schema', 'payload', 'validation'].includes(name), current: name !== 'validation' });
    // The lab validator's normal currentness is UNKNOWN; preserve that evidence,
    // but never accept an explicitly contradictory/stale qualifier.
    if (name === 'validation' && !['UNKNOWN', 'CURRENT_AT_BASIS'].includes(result.qualification.currentness)) throw new Error('Typed validation has conflicting currentness');
    if (!['chainId', 'blockNumber', 'blockHash', 'timestamp'].every(field =>
      selection.basis?.[field] != null && lower(result.basis?.[field]) === lower(selection.basis[field]))) throw new Error(`${name} does not share the fixed game basis`);
    for (const field of ['realmId', 'core', 'profile']) {
      if (!selection.domain?.[field] || lower(result.domain?.[field]) !== lower(selection.domain[field])) throw new Error(`${name} does not share the release evidence domain`);
    }
  }
  sameSubject(selection, releaseLock.fileId, 'Game File/revision');
  if (lower(selection.value?.contentId) !== releaseLock.contentId) throw new Error('Exact game revision does not match release content');
  sameSubject(gamePayload, releaseLock.contentId, 'Game byte');
  sameSubject(record, challengeId, 'Challenge Record');
  if (lower(record.value?.schemaId) !== releaseLock.challengeSchemaId) throw new Error('Challenge schema does not match release lock');
  sameSubject(schema, releaseLock.challengeSchemaId, 'Schema');
  sameSubject(payload, record.value?.contentId, 'Challenge byte');
  sameSubject(validation, releaseLock.challengeSchemaId, 'Typed validation');
  if (hexBytes(schema.value) !== '0x03' || lower(validation.descriptor) !== '0x03' || lower(utilities.deriveSchemaId(schema.value)) !== releaseLock.challengeSchemaId || lower(validation.computedSchemaId) !== releaseLock.challengeSchemaId) throw new Error('Exact bytes32 schema descriptor binding failed');
  const bytes = byteArray(gamePayload.bytes ?? gamePayload.value?.bytes);
  const seedBytes = byteArray(payload.bytes ?? payload.value?.bytes);
  if (lower(utilities.deriveContentId(bytes)) !== releaseLock.contentId || lower(utilities.deriveContentId(seedBytes)) !== lower(record.value?.contentId)) throw new Error('Verified content commitment binding failed');
  if (validation.valid !== true || !Array.isArray(validation.fields) || validation.fields.length !== 1) throw new Error('SDK did not validate one exact seed field');
  const seed = bytes32(validation.fields[0], 'Validated seed');
  if (seedBytes.length !== 32 || hexBytes(seedBytes) !== seed) throw new Error('Validated seed does not match exact challenge bytes');
  if (lower(utilities.deriveRecordId({ schemaId: releaseLock.challengeSchemaId, data: seedBytes })) !== lower(challengeId)) throw new Error('Challenge Record identity does not bind the validated seed');
  return { bytes, seed, basis: selection.basis, releaseLock };
}

export async function inspectExactChallenge({ sdk, config, challengeId, utilities, blockTag = 'latest', isCurrent = () => true }) {
  const evidence = { releaseLock: arcadeReleaseLock(config), challengeId: bytes32(challengeId, 'Challenge') };
  const current = () => { if (!isCurrent()) throw new Error('Challenge inspection cancelled'); };
  try {
    current();
    evidence.selection = await sdk.readExact({ kind: 'revision', file: evidence.releaseLock.fileId, revision: evidence.releaseLock.revision, blockTag });
    current();
    qualified(evidence.selection, 'Game selection');
    const fixed = evidence.selection.basis;
    evidence.record = await sdk.readExact({ kind: 'record', id: evidence.challengeId, blockTag: fixed });
    current();
    qualified(evidence.record, 'Challenge Record');
    if (lower(evidence.record.value?.schemaId) !== evidence.releaseLock.challengeSchemaId) throw new Error('Challenge schema does not match release lock');
    evidence.schema = await sdk.readExact({ kind: 'schema', id: evidence.releaseLock.challengeSchemaId, blockTag: fixed });
    current();
    qualified(evidence.schema, 'Schema', { verified: true });
    evidence.payload = await sdk.readVerifiedBytes({ contentId: evidence.record.value.contentId, blockTag: fixed });
    current();
    qualified(evidence.payload, 'Challenge bytes', { verified: true });
    evidence.validation = await sdk.validateTypedPayloadAtBasis({ schemaId: evidence.releaseLock.challengeSchemaId, data: evidence.payload.bytes ?? evidence.payload.value?.bytes, blockTag: fixed });
    current();
    evidence.gamePayload = await sdk.readVerifiedBytes({ contentId: evidence.releaseLock.contentId, blockTag: fixed });
    current();
    const admitted = verifyChallengeLaunch(evidence, utilities);
    return { ...admitted, evidence: { ...evidence, basis: fixed, qualification: evidence.gamePayload.qualification, configuration: { seed: admitted.seed }, teardown: { state: 'NOT_LAUNCHED', frameRemoved: true, blobRevoked: true }, scoreAuthority: 'NONE' } };
  } catch (error) {
    error.arcadeEvidence = { ...evidence, basis: evidence.selection?.basis, launch: 'BLOCKED', reason: error.message, teardown: { state: 'NOT_LAUNCHED', frameRemoved: true, blobRevoked: true } };
    throw error;
  }
}

export function createArcadeView({ root, sdk, config, utilities, onEvidence = () => {}, onStatus = () => {}, onBasis = () => {}, navigate = () => {} }) {
  const document = root.ownerDocument;
  const window = document.defaultView;
  const $ = selector => root.querySelector(selector);
  const state = { active: false, generation: 0, challengeId: null, basis: null, checked: null, evidence: null, running: false, hash: '#arcade' };
  // Static presentation only. Record IDs and any configured labels use textContent.
  root.innerHTML = `<div class="view-head"><div><p class="eyebrow">Guest inspection · explicit isolated execution</p><h1 id="arcade-title">Signal Drift: Exact Challenge</h1><p>An ordinary typed seed Record changes the game. No wallet or score publishing.</p></div><button id="refresh-arcade">Refresh basis</button></div>
    <div class="notice quiet" id="challenge-state" role="status">Select a challenge to inspect its exact backing.</div>
    <div class="game-card"><div class="game-copy"><div class="game-art" aria-hidden="true"><i></i><i></i><i></i><strong>◇</strong></div><div><span class="tag">Disposable lab release · revision 2</span><h2>Carry the signal</h2><p>Arrow keys, WASD, or pointer. The same seed and release repeat the same 128-obstacle sequence. A local trace is diagnostic, not verified fair play.</p><dl><div><dt>Runner</dt><dd>Opaque · scripts only</dd></div><div><dt>Capabilities</dt><dd>None</dd></div><div><dt>Bytes</dt><dd id="game-byte-state">Not requested</dd></div></dl><div class="actions"><button class="primary" id="play-game" disabled>Verify &amp; Play</button><button id="stop-game" disabled>Stop</button></div></div></div>
    <div class="game-stage" id="game-stage" aria-live="polite"><p>Game not running. Browsing has executed no content.</p></div>
    <article class="preview"><p class="eyebrow">Exact typed challenge</p><h2 id="challenge-label">Challenge Record</h2><div class="actions" id="challenge-list"></div><dl><div><dt>Record ID</dt><dd><code id="arcade-challenge-id" style="overflow-wrap:anywhere">—</code></dd></div><div><dt>Validated bytes32 seed</dt><dd><code id="challenge-seed" style="overflow-wrap:anywhere">Not validated</code></dd></div></dl><p id="release-links"></p><details><summary>Lab-only release lock</summary><pre id="release-lock"></pre></details><details><summary>Challenge, schema, bytes, basis and teardown evidence</summary><pre id="arcade-evidence">No exact evidence yet.</pre></details></article></div>`;

  const publishEvidence = evidence => {
    state.evidence = evidence;
    $('#arcade-evidence').textContent = taggedJson(evidence);
    onEvidence('Signal Drift: Exact Challenge', evidence);
  };
  const stageMessage = message => $('#game-stage').replaceChildren(Object.assign(document.createElement('p'), { textContent: message }));
  const lease = createGameLease({
    createUrl({ bytes, seed }) { return `${window.URL.createObjectURL(new window.Blob([bytes], { type: 'text/html' }))}#seed=${seed}`; },
    revokeUrl(url) { window.URL.revokeObjectURL(url.split('#')[0]); },
    mount({ src, sandbox }) {
      const frame = document.createElement('iframe');
      frame.title = 'Signal Drift game'; frame.src = src; frame.setAttribute('sandbox', sandbox); frame.referrerPolicy = 'no-referrer';
      $('#game-stage').replaceChildren(frame); state.running = true;
    },
    unmount() { state.running = false; stageMessage('Game stopped. Frame removed and content URL revoked.'); },
  });
  const coordinator = createLaunchCoordinator({
    select: context => inspectExactChallenge({ sdk, config, challengeId: context.challengeId, utilities, blockTag: context.basis, isCurrent: context.isCurrent }),
    load: async (_context, selected) => selected,
    admit: ({ loaded }) => loaded,
    launch: checked => lease.launch(checked),
  });

  function stop(reason = 'STOP', notify = false) {
    state.generation += 1; coordinator.cancel(); lease.stop();
    $('#stop-game').disabled = true;
    $('#game-byte-state').textContent = 'Not running';
    if (state.evidence) publishEvidence({ ...state.evidence, teardown: { state: 'STOPPED', reason, frameRemoved: true, blobRevoked: true, pendingLaunchCancelled: true } });
    if (notify) onStatus('Game stopped · pending launch cancelled · isolated resources released');
  }

  function blocked(error) {
    state.checked = null; $('#play-game').disabled = true; $('#stop-game').disabled = true;
    $('#challenge-state').className = 'notice warning'; $('#challenge-state').textContent = `Play blocked — ${error.message}`;
    $('#game-byte-state').textContent = 'Not launched'; $('#challenge-seed').textContent = 'Not validated';
    stageMessage('Game not running. Invalid or unavailable inputs never select a fallback seed.');
    publishEvidence(error.arcadeEvidence ?? { launch: 'BLOCKED', challengeId: state.challengeId, reason: error.message, teardown: { state: 'NOT_LAUNCHED', frameRemoved: true, blobRevoked: true } });
    onStatus('Challenge unavailable · Play blocked · no fallback');
  }

  function releaseLinks(lock) {
    $('#release-lock').textContent = taggedJson(lock);
    const links = $('#release-links'); links.replaceChildren();
    for (const revision of [lock.revision, config.game?.legacy?.revision].filter(value => value != null)) {
      const link = document.createElement('a'); link.href = `#files/file/${lock.fileId}?revision=${revision}`;
      link.textContent = revision === lock.revision ? 'Inspect pinned game revision 2' : 'Inspect preserved legacy revision 1';
      link.addEventListener('click', event => { event.preventDefault(); navigate(link.href.slice(link.href.indexOf('#'))); });
      links.append(link, document.createTextNode(' · '));
    }
  }

  async function inspect(hash) {
    stop('NEW_INSPECTION'); state.hash = hash; state.checked = null; state.basis = null; state.challengeId = null;
    $('#arcade-challenge-id').textContent = 'No exact challenge selected';
    $('#play-game').disabled = true; $('#game-byte-state').textContent = 'Verifying…'; $('#challenge-seed').textContent = 'Not validated';
    const token = state.generation;
    try {
      state.challengeId = parseArcadeRoute(hash, config.game?.challengeIds?.[0]);
      $('#arcade-challenge-id').textContent = state.challengeId;
      $('#challenge-label').textContent = config.labels?.[state.challengeId] ?? 'Challenge Record';
      const lock = arcadeReleaseLock(config); releaseLinks(lock);
      const choices = $('#challenge-list'); choices.replaceChildren();
      for (const [index, id] of (config.game?.challengeIds ?? []).entries()) {
        const link = document.createElement('a'); link.href = `#arcade?challenge=${bytes32(id, 'Configured challenge')}`;
        link.textContent = config.labels?.[id] ?? `Challenge ${index + 1}`;
        link.addEventListener('click', event => { event.preventDefault(); navigate(`#arcade?challenge=${id}`); });
        choices.append(link, document.createTextNode(' · '));
      }
      $('#challenge-state').className = 'notice quiet'; $('#challenge-state').textContent = 'Inspecting exact challenge and game at one fixed basis…';
      const result = await inspectExactChallenge({ sdk, config, challengeId: state.challengeId, utilities, isCurrent: () => state.active && token === state.generation });
      if (!state.active || token !== state.generation) return;
      state.checked = result; state.basis = result.basis; onBasis(result.basis);
      $('#play-game').disabled = false; $('#game-byte-state').textContent = `${result.bytes.byteLength} verified bytes · not running`;
      $('#challenge-seed').textContent = result.seed; $('#challenge-state').className = 'notice good';
      $('#challenge-state').textContent = 'Exact challenge verified · game and seed share one fixed basis · Play remains explicit';
      publishEvidence(result.evidence); onStatus('Challenge inspected in guest mode · no game execution');
    } catch (error) { if (state.active && token === state.generation) blocked(error); }
  }

  async function play() {
    if (!state.active || !state.checked) return;
    stop('RESTART'); const token = state.generation;
    $('#stop-game').disabled = false; $('#play-game').disabled = true; $('#game-byte-state').textContent = 'Verifying…';
    try {
      const outcome = await coordinator.play({ challengeId: state.challengeId, basis: state.basis, isCurrent: () => state.active && token === state.generation });
      if (outcome.cancelled || !state.active || token !== state.generation) return;
      const checked = outcome.loaded;
      state.checked = checked; onBasis(checked.basis); $('#stop-game').disabled = false; $('#play-game').disabled = false;
      $('#game-byte-state').textContent = `${checked.bytes.byteLength} verified bytes · running`;
      publishEvidence({ ...checked.evidence, launch: 'RUNNING', teardown: { state: 'RUNNING', frameRemoved: false, blobRevoked: false } });
      onStatus('Exact challenge launched · scripts-only sandbox · no wallet or host bridge');
    } catch (error) { if (state.active && token === state.generation) { lease.stop(); blocked(error); } }
  }

  $('#play-game').addEventListener('click', play);
  $('#stop-game').addEventListener('click', () => { stop('USER_STOP', true); $('#play-game').disabled = !state.checked; });
  $('#refresh-arcade').addEventListener('click', () => { if (state.active) return inspect(state.hash); });
  const deactivate = () => { state.active = false; stop('NAVIGATION_OR_PAGEHIDE'); };
  window.addEventListener('pagehide', deactivate);
  return { async open(hash = '#arcade') { state.active = true; return inspect(hash); }, async refresh() { if (state.active) return inspect(state.hash); }, deactivate };
}
