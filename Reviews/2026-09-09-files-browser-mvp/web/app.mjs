// EFS Files browser prototype. Guest reads are wallet-free and pinned; writes
// go through the FilesRouter with simulated, counted approvals from clearly
// labeled disposable local test signers. One shared reader; no browser tree.
import { createFixtureReader, openDirectory, openFile, openHistory, openRevisions, openRemoved, openTags, lookupName, FIXTURE, tagId } from '/Reviews/2026-09-09-files-reader/index.mjs';
import { boundedJSON, createRPCSource, createDirectRPCSource, writePath, directWritePath } from './rpc-source.mjs';
import { presentListing } from './listing-presentation.mjs';
import { assembleExport } from '/Reviews/2026-09-09-files-browser-mvp/sdk/export-bundle.mjs';
import { planOperation, recoveryDescriptor, readBackOperation, contentLeaves, decodeRouterError, decodeAuthorityError, latestBindingState, latestExecution, latestPrincipalNonce, latestPrincipalAccount, latestChunkPresence, authorizeIntentV3, encodeExecuteV2, encodeStageChunk, byteCommitmentOf, core3Interface } from '/Reviews/2026-09-09-files-browser-mvp/sdk/files-actions.mjs';
import { detectProvider, principalFor, connect, signAuthorIntent, isRejection, sendTransaction, sponsorSubmit, sponsorRequestIdentity, sponsorStatus } from './wallet.mjs';
import { Wallet, keccak256 } from '/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js';
import { createActionJournal, assertWalletContext, assertDeploymentContext, withAuthorizationFence } from './action-journal.mjs';
import { createLedger, reduceLedger, exportLedger, restoreLedger, seedCostDefaults } from './cost-ledger.mjs';
import { createEconomicsPanel, normalizeReceipt, sponsorCostEvents, modelWei } from './economics-panel.mjs';
import { encodeFilesRoute, decodeFilesRoute } from './file-routes.mjs';
import { prepareVerifiedDownload } from './verified-download.mjs';

const $ = id => document.getElementById(id), main = document.querySelector('main');
const stringify = x => JSON.stringify(x, (_, v) => typeof v === 'bigint' ? String(v) : v, 2);
const short = x => x ? x.slice(0, 10) + '…' + x.slice(-8) : 'not available';
const text = (tag, value, className) => { const e = document.createElement(tag); e.textContent = value; if (className) e.className = className; return e; };
const toHex = bytes => '0x' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const fromHex = hex => new Uint8Array((hex.length - 2) / 2).map((_, i) => parseInt(hex.slice(2 + 2 * i, 4 + 2 * i), 16));

let config, reader, scope, stream, cancel, generation = 0, current = null, busy = false, opener = null;
let transport = null; // {source, write, mode: 'relay' | 'direct-static'}
let path = [], acquisitions = 1, pubCounter = 0;
let selection = null;
const previewURLs = new Set();
function releasePreviews() { for (const url of previewURLs) URL.revokeObjectURL(url); previewURLs.clear(); }
function directoryRoute() { return { lensId: $('lens').value, pathSegments: path.slice(1).map(p => p.name) }; }
function navigate(route, { samePin = true, replace = false } = {}) {
  if (writing) return;
  const hash = encodeFilesRoute(route);
  if (hash !== location.hash) history[replace ? 'replaceState' : 'pushState'](null, '', hash);
  return refresh({ samePin });
}
function closeFileSelection() {
  const selected = selection;
  selection = null; releasePreviews(); $('file-panel').close();
  // A hash changed during authorization is the user's next navigation, not
  // a new destination for the already-captured write. Do not overwrite it.
  if (!selected || location.hash === encodeFilesRoute(selected.route)) history.replaceState(null, '', encodeFilesRoute(directoryRoute()));
}
// Only qualified lookup results establish ancestry. A route is just a request;
// even a valid File ID cannot bypass its named path under this mount root.
async function resolveRoute(activeScope, route, stillCurrent = () => true) {
  const resolved = [{ name: config.rootLabel ?? 'trip', subject: config.root }];
  const mountId = config.mounts[route.lensId];
  let leaf = null;
  for (let i = 0; i < route.pathSegments.length; i++) {
    const name = route.pathSegments[i];
    const found = await acquire(() => lookupName(activeScope, { mountId, subject: resolved.at(-1).subject, name }));
    if (!stillCurrent()) return null;
    if (found.qualification?.status !== 'QUALIFIED' || found.qualification.coverage !== 'COMPLETE' || found.outcome === 'UNKNOWN' || found.outcome === 'CONFLICT') {
      throw Error('Route unresolved at “' + name + '”: ' + (found.reason ?? found.outcome) + '. No replacement was opened');
    }
    if (found.outcome !== 'FOUND') throw Error('No longer here: “' + name + '” is not selected at this path');
    const fileLeaf = i === route.pathSegments.length - 1 && route.fileId;
    if (fileLeaf) {
      if (found.value.kind !== 'FILE' || found.value.nodeId.toLowerCase() !== route.fileId.toLowerCase()) throw Error('No longer here: this name no longer selects the requested File');
      leaf = found;
    } else {
      if (found.value.kind !== 'DIRECTORY') throw Error('No longer here: “' + name + '” is not a folder');
      resolved.push({ name, subject: found.value.subject });
    }
  }
  return { path: resolved, row: leaf, mountId, route };
}
const session = { signer: 'guest', mode: 'guest', wallet: null, principal: null, account: null, approvals: 0, walletRequests: 0 };
let provider = null; // real EIP-1193 provider, set at boot when present
let journal, ledger, economics, environmentId, storageError = null;
const costKey = 'efs-files-cost-v1';
let selectedModels = [], selectedFx;
let acquireChain = Promise.resolve();
// The scope serializes top-level acquisitions; every reader call goes through here.
function acquire(task) { const run = acquireChain.then(task, task); acquireChain = run.then(() => {}, () => {}); return run; }
function renderEconomics() { if (economics && ledger) economics.render(ledger, journal?.entries() ?? [], transport.source.metrics?.(), { scenarioSnapshotIds: selectedModels, fxSnapshotId: selectedFx }); }
function costEvent(event) {
  const next = reduceLedger(ledger, event);
  try { localStorage.setItem(costKey, exportLedger(next)); } catch { storageError = 'Cost recovery storage failed; submission stopped.'; throw Error(storageError); }
  ledger = next; renderEconomics();
}
function markAction(action, patch) { journal.mark(action.actionId, patch); renderEconomics(); }
function selectCostSnapshots() {
  selectedModels = [...new Map(ledger.feeSnapshots.map(s => [s.chainFamily, s.id])).values()];
  selectedFx = ledger.fxSnapshots.at(-1)?.id;
}
function rereadJournals() {
  journal = createActionJournal(localStorage); const saved = localStorage.getItem(costKey);
  ledger = seedCostDefaults(saved ? restoreLedger(saved) : ledger).ledger;
  selectCostSnapshots();
}
function actionRuntime(context) { return { context: Object.freeze({ ...context }), transport, provider, wallet: session.wallet, mode: session.mode, sponsor: config.write.sponsor ? Object.freeze({ ...config.write.sponsor }) : null, nextAttempt: 0 }; }
function lockControls(locked) { for (const id of ['signer', 'lens', 'refresh', 'new-folder', 'new-note', 'upload', 'more', 'export']) $(id).disabled = locked; }
function attempt(action, phase, payer = 'user') {
  const attemptId = action.actionId + ':' + phase + ':' + action.nextAttempt++;
  costEvent({ type: 'attempt/upsert', actionId: action.actionId, attemptId, phase, status: 'unknown', payer, payerAddress: payer === 'sponsor' ? action.sponsor?.payer : action.context.account });
  return attemptId;
}
function recordAttempt(action, attemptId, patch) { costEvent({ type: 'attempt/upsert', actionId: action.actionId, attemptId, status: 'unknown', payer: 'unknown', ...patch }); }
function recordReceipt(action, attemptId, receipt) { costEvent({ type: 'receipt/record', actionId: action.actionId, attemptId, receipt: normalizeReceipt(receipt) }); }
async function walletSend(action, to, data, gas, phase) {
  await assertDeploymentContext(action.transport.source, action.context);
  await assertWalletContext(action.provider, action.context);
  const attemptId = attempt(action, phase);
  try {
    countWalletRequest();
    const hash = await sendTransaction(action.provider, { from: action.context.account, to, data, gas });
    recordAttempt(action, attemptId, { hash, status: 'submitted' });
    const receipt = await waitReceipt(hash, action.transport); recordReceipt(action, attemptId, receipt); return receipt;
  } catch (e) { if (isRejection(e)) recordAttempt(action, attemptId, { status: 'not-submitted' }); throw e; }
}
async function sponsorSend(action, body) {
  await assertDeploymentContext(action.transport.source, action.context);
  const identity = sponsorRequestIdentity(body);
  markAction(action, { ...identity, sponsorUrl: action.sponsor.url });
  const requestAttempt = attempt(action, 'sponsor request ' + identity.requestId, 'sponsor');
  const ingest = result => {
    for (const event of sponsorCostEvents(action.actionId, result, action.sponsor.payer)) costEvent(event);
    // This row represents the request's unresolved inventory, not a transaction.
    if (result.submitted === false || ['completed', 'failed'].includes(result.status)) recordAttempt(action, requestAttempt, { status: 'not-submitted' });
  };
  try { const result = await sponsorSubmit(action.sponsor.url, body, boundedJSON); ingest(result); return result; }
  catch (e) { ingest(e); throw e; }
}

// ---- session / prompts -----------------------------------------------------
function updateSession() {
  const write = config.write;
  $('signer-label').textContent = session.mode === 'wallet' ? 'Wallet ' + short(session.account) + ' · REAL EIP-1193 signer'
    : session.signer === 'guest' ? 'Guest · no wallet' : write.authors[session.signer].label + ' · simulated local signer';
  $('signer-label').className = session.signer === 'guest' ? 'guest' : 'author';
  $('prompts').textContent = session.mode === 'wallet'
    ? session.walletRequests + ' wallet request' + (session.walletRequests === 1 ? '' : 's')
    : session.approvals + ' approval' + (session.approvals === 1 ? '' : 's');
  $('prompts').setAttribute('aria-label', session.mode === 'wallet'
    ? 'Counted real wallet requests (EIP-1193)'
    : 'Counted simulated approvals with the disposable local test key');
  $('toolbar').hidden = session.signer === 'guest' || current?.qualification?.status !== 'QUALIFIED';
  main.dataset.signer = session.signer;
}
function countApproval() { session.approvals++; updateSession(); }
function countWalletRequest() { session.walletRequests++; updateSession(); }

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
function prompt(title, { withText = false, initial = '', initialText = '', label = 'Name', nameReadOnly = false } = {}) {
  return new Promise(resolve => {
    $('prompt-title').textContent = title;
    $('prompt-label').firstChild.textContent = label;
    $('prompt-input').value = initial; $('prompt-input').readOnly = nameReadOnly;
    $('prompt-text').hidden = !withText; $('prompt-text').value = initialText;
    const dialog = $('prompt-dialog');
    const done = v => { dialog.onclose = null; $('prompt-form').onsubmit = null; $('prompt-cancel').onclick = null; dialog.close(); resolve(v); };
    $('prompt-form').onsubmit = e => { e.preventDefault(); done({ name: $('prompt-input').value, text: $('prompt-text').value }); };
    $('prompt-cancel').onclick = () => done(null);
    dialog.onclose = () => resolve(null);
    dialog.showModal();
    $('prompt-input').focus();
  });
}
function toast(message, isError = false) {
  if (isError) { const op = $('op-status'); op.hidden = false; op.textContent = 'Problem: ' + message; }
  else { $('op-status').hidden = true; $('status').textContent = message; }
}

// ---- the write pipeline ----------------------------------------------------
async function waitReceipt(hash, sourceTransport = transport) {
  for (let i = 0; i < 400; i++) { const r = await sourceTransport.write.receipt(hash); if (r) return r; await new Promise(ok => setTimeout(ok, 25)); }
  throw Error('The network did not confirm in time. Nothing may have changed — read again.');
}
async function submitRaw(to, data, gasLimit, wallet, action, phase) {
  await assertDeploymentContext(action.transport.source, action.context);
  const nonce = BigInt(await action.transport.write.transactionCount(wallet.address));
  const raw = await wallet.signTransaction({ chainId: BigInt(action.context.chainId), nonce: Number(nonce), gasLimit, gasPrice: 2000000000n, to, data });
  const hash = keccak256(raw), attemptId = attempt(action, phase);
  recordAttempt(action, attemptId, { hash }); // locally derived BEFORE publication ambiguity
  const returned = await action.transport.write.publish(raw);
  if (returned.toLowerCase() !== hash) throw Error('Published transaction hash mismatch; reconcile recorded hash.');
  recordAttempt(action, attemptId, { status: 'submitted' });
  const receipt = await waitReceipt(hash, action.transport); recordReceipt(action, attemptId, receipt); return receipt;
}
function friendlyError(e) {
  const decoded = e?.data ? (decodeAuthorityError(e.data) ?? decodeRouterError(e.data)) : null;
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
    ErrUnauthorizedPrincipal: 'This signer is not the claimed account for that author.',
    ErrIntentNonce: 'This exact approval was already used. Start the change again.',
    ErrIntentExpired: 'The approval expired before submission. Start the change again.',
    ErrExecutorBinding: 'This signed approval only works through its named router.',
    ErrOpCommitment: 'The submitted operation does not match what was approved. Refused.',
    ErrByteCommitment: 'The approved content commitment does not match the bytes in this operation. Refused.',
    ErrChunkImmutable: 'Different bytes were already staged at this position; content is write-once.',
    ErrChunkLeafMismatch: 'These bytes do not match the committed content. Refused.',
  };
  return decoded ? (map[decoded.name] ?? 'Refused by the router: ' + decoded.name) : (e.message ?? 'The operation could not finish. Nothing may have changed — read again.');
}
let writing = false;
async function runOperation(kindLabel, intent, facts) {
  if (session.signer === 'guest') { toast('Reading is free for guests; select a local test signer to make changes.', true); return null; }
  if (current?.qualification?.status !== 'QUALIFIED') { toast('Resolve a qualified folder before making changes. No stale destination was used.', true); return null; }
  if (writing) { toast('One change at a time: the previous operation is still in flight.', true); return null; }
  writing = true;
  main.dataset.writing = 'true';
  lockControls(true);
  // Snapshot the signer at flow start: switching mid-flight must not swap keys.
  const signerWallet = session.wallet, signerPrincipal = session.principal, signerKey = session.signer;
  const signerMode = session.mode, signerAccount = session.account;
  const capturedLens = $('lens').value;
  const capturedHash = location.hash;
  const captured = actionRuntime({ environmentId, chainId: '31337', core: config.expected.core, principal: signerPrincipal,
    account: signerAccount ?? signerWallet?.address, mountId: intent.mountId, lensId: capturedLens, sourceId: config.expected.source,
    destinationId: intent.parent ?? intent.fileId ?? intent.object ?? here(), router: config.write.router, carrier: config.write.carrier });
  try { return await withAuthorizationFence(navigator.locks, async () => {
  // Another tab may have signed while this page was idle: reread inside fence.
  if (storageError) throw Error(storageError);
  rereadJournals();
  try {
    const write = config.write;
    await assertDeploymentContext(captured.transport.source, captured.context);
    const execution = await latestExecution(transport.write.callLatest, config.expected.core);
    const plan = planOperation({ ...intent, principal: signerPrincipal, pubNonce: BigInt(Date.now()) * 1000n + BigInt(pubCounter++) });
    if (plan.status !== 'PLANNED') { toast(plan.status === 'UNSUPPORTED' ? 'Unsupported (not invalid): ' + plan.reason : 'Refused: ' + plan.reason, true); return null; }
    const content = plan.predicted.content ?? null;
    const chunkNote = content && content.chunkCount > 0
      ? [['Bytes', String((content.data.length - 2) / 2) + ' bytes in ' + content.chunkCount + ' chunk transaction' + (content.chunkCount === 1 ? '' : 's') + ', staged automatically — THIS single approval covers them']]
      : [];
    const block = await transport.write.latestBlock();
    // A local chain only advances its clock when it mines, so the latest
    // block can sit far behind wall clock: deriving a deadline from it alone
    // can mint an already-expired intent, and can wedge the guard below
    // forever. Take whichever clock is further ahead.
    const wallClock = BigInt(Math.floor(Date.now() / 1000));
    const now = BigInt(block.timestamp) > wallClock ? BigInt(block.timestamp) : wallClock;
    const deadline = now + 300n; // short: a signed intent is live authority until it expires
    const authorNonce = await latestPrincipalNonce(transport.write.callLatest, config.expected.core, signerPrincipal);
    const conflict = journal.conflict(captured.context, String(authorNonce), String(BigInt(block.timestamp)));
    if (conflict) throw Error('An earlier signed approval is still live for this author nonce. Reconcile it or wait for chain-confirmed expiry; no second signature requested.');
    captured.context = Object.freeze({ ...captured.context, executionId: execution.executionSetId });
    captured.actionId = crypto.randomUUID();
    captured.plan = plan;
    journal.begin({ actionId: captured.actionId, label: kindLabel, context: captured.context, nonce: String(authorNonce), deadline: String(deadline), descriptor: recoveryDescriptor(plan),
      requestedFileId: [1, 3, 5].includes(plan.op.kind) ? plan.op.object : undefined,
      content: content ? { treeId: content.treeId, size: String((content.data.length - 2) / 2), chunkCount: content.chunkCount, fileId: plan.op.object } : null });
    costEvent({ type: 'action/start', actionId: captured.actionId, label: kindLabel, createdAt: new Date().toISOString(), context: captured.context });
    const byteCommitment = content ? byteCommitmentOf(content.treeId, content.tree.body) : undefined;
    let receipt, staged = { complete: true, done: 0, failed: 0 };
    if (signerMode === 'wallet') {
      // REAL wallet path: the wallet's OWN prompt is the approval — the app
      // shows facts as context but never renders a simulated dialog here.
      const sponsor = write.sponsor ?? null;
      // The unanimity lens resolves only what A and B agree on. A wallet
      // author is not one of its sources, so a write made here would be
      // admitted on-chain and then selected by nothing — the
      // confirms-but-unreadable shape. Refuse it with the reason.
      if (capturedLens === 'exact') {
        toast('The Both-agree lens only shows what Author A and Author B agree on, and your wallet identity is not one of its sources. A change made here would be committed on-chain and then visible to nobody, so it is refused. Switch to A-first or B-first to write.', true);
        return null;
      }
      // A previously signed intent at this same one-time number may still be
      // live (ambiguous submission): never request a second signature that
      // races it — wait for the nonce to advance or the deadline to pass.
      toast('Wallet approval: ' + kindLabel + ' — ' + (sponsor
        ? 'ONE typed-data signature; the sponsor (' + sponsor.label + ', payer ' + short(sponsor.payer) + ') submits and pays. It cannot alter what you sign. The wallet shows commitment hashes: what they authorize is at most one Files operation for this author at this one-time number, on this chain and Core, before the deadline.'
        : 'DIRECT mode: 1 signature plus ' + (1 + (content?.chunkCount ?? 0)) + ' transaction approval(s), paid by your account.'));
      let signed;
      try {
        await assertWalletContext(captured.provider, captured.context);
        markAction(captured, { authorization: 'unknown' });
        countWalletRequest(); // the prompt is shown whether or not it is approved
        signed = await signAuthorIntent(captured.provider, signerAccount, plan, {
          core: config.expected.core, chainId: 31337,
          executor: write.router, executorCodehash: write.routerCodehash,
          executionSetId: execution.executionSetId, nonce: authorNonce, deadline, byteCommitment,
        });
      } catch (e) { if (isRejection(e)) { markAction(captured, { authorization: 'closed' }); costEvent({ type: 'action/effect', actionId: captured.actionId, status: 'refused' }); toast('Cancelled in the wallet; nothing was sent.'); return 'CANCELLED'; } throw e; }
      // Retain this guard after every signed outcome, including refusal,
      // revert and success. A receipt does not revoke a signature. conflict()
      // checks the current nonce and chain time; retaining the row also guards
      // against nonce/time regression after a reorg.
      // The tree travels ONCE per request, not per chunk.
      const treePayload = content && content.chunkCount > 0
        ? { treeId: content.treeId, body: content.tree.body, leaves: content.leaves } : null;
      const chunksBody = content && content.chunkCount > 0
        ? content.chunks.map((chunkData, index) => ({ index, chunkData })) : [];
      if (sponsor) {
        let result;
        await assertWalletContext(captured.provider, captured.context);
        try {
          result = await sponsorSend(captured, { op: plan.op, publication: plan.publication, expectedRevision: execution.revision, intent: signed.intent, signature: signed.signature, content: treePayload, chunks: chunksBody });
        } catch (e) {
          // A refusal before broadcast still leaves the author signature live.
          if (e.submitted === false) throw e;
          // AMBIGUOUS submission: the sponsor connection failed. The signed
          // intent's one-time number tells us whether it was consumed.
          const nonceNow = await latestPrincipalNonce(transport.write.callLatest, config.expected.core, signerPrincipal).catch(() => null);
          if (nonceNow !== null && nonceNow > authorNonce) { toast('Approval nonce consumed; that is not proof of the requested effect. Reading independently…'); await reconcileAction(captured.actionId); }
          toast('The sponsor could not be reached. Your signed approval may still land until ' + new Date(Number(deadline) * 1000).toLocaleTimeString() + ' — treat this as PENDING, not failed. The app will not ask for a new signature for this slot until then.', true);
          return null;
        }
        receipt = { status: result.execute.status, transactionHash: result.execute.hash, gasUsed: result.execute.gasUsed, sponsored: true, payer: result.payer };
        staged.done = result.chunks.filter(c => c.status === 'staged').length;
        staged.failed = result.chunks.filter(c => c.status !== 'staged').length;
        staged.complete = staged.failed === 0;
      } else {
        // DIRECT mode stages content FIRST: if anything stops midway, nothing
        // was admitted — only harmless content-addressed bytes exist.
        if (chunksBody.length) {
          staged = await stageContent(content, null, false, captured);
          if (!staged.complete) { toast('Staging did not complete (' + staged.failed + ' chunk(s) failed); the admission was NOT submitted. Nothing is half-published — the staged bytes are inert until an admission references them.', true); return null; }
        }
        try {
          receipt = await walletSend(captured, write.router, encodeExecuteV2(plan, execution.revision, signed.intent, signed.signature), '0x1000000', 'execute');
        } catch (e) { if (isRejection(e)) { toast('Transaction declined in the wallet. Your earlier signature is still live; its approval slot remains guarded.'); return 'CANCELLED'; } throw e; }
      }
    } else {
      const ok = await consent('Approve: ' + kindLabel, [...facts, ...chunkNote,
        ['Records written', String(plan.publication.leaves.length) + ' (all at once or not at all)'],
        ['Operation ID', short(plan.predicted.envelopeId)],
        ['Signer', write.authors[signerKey].label + ' (disposable local key, author-signed intent)'],
      ]);
      if (!ok) { markAction(captured, { authorization: 'closed' }); costEvent({ type: 'action/effect', actionId: captured.actionId, status: 'refused' }); toast('Cancelled before submission; nothing was sent.'); return 'CANCELLED'; }
      toast('Submitting… waiting for the network receipt.');
      markAction(captured, { authorization: 'unknown' });
      const { intent: signedIntent, signature } = await authorizeIntentV3(plan, {
        authorWallet: signerWallet, core: config.expected.core, chainId: 31337,
        executor: write.router, executorCodehash: write.routerCodehash,
        executionSetId: execution.executionSetId, nonce: authorNonce, deadline, byteCommitment,
      });
      receipt = await submitRaw(write.router, encodeExecuteV2(plan, execution.revision, signedIntent, signature), 16777216n, signerWallet, captured, 'execute');
      // Content chunks stage AUTOMATICALLY under the same approval: staging is
      // permissionless, content-addressed and write-once — no further consent
      // exists to ask for. Interruption leaves a resumable file.
      if (receipt.status === '0x1' && content && content.chunkCount > 0) staged = await stageContent(content, signerWallet, false, captured);
    }
    if (receipt.status !== '0x1') { costEvent({ type: 'action/effect', actionId: captured.actionId, status: 'refused' }); toast('Not saved here. Transaction reverted; its receipt gas still counts.', true); return null; }
    if (content && content.chunkCount > 0) {
      if (!staged.complete) pendingBytes.set(plan.op.kind === 3 ? plan.op.object : plan.predicted.objectId, { content, label: kindLabel, action: captured });
      else pendingBytes.delete(plan.op.kind === 3 ? plan.op.object : plan.predicted.objectId);
    }
    return { plan, receipt, staged, action: captured };
  } catch (e) { toast(friendlyError(e), true); return null; }
  }); } catch (e) { toast(friendlyError(e), true); return null; }
  finally {
    writing = false; delete main.dataset.writing; $('lens').value = capturedLens; $('signer').value = signerKey; lockControls(false); renderEconomics();
    if (location.hash !== capturedHash) { await refresh({}); captured.navigationRefreshed = true; }
  }
}
async function stageContent(content, wallet, onlyMissing = false, action) {
  if (!action) throw Error('Captured recovery action required for chunk submission.');
  let done = 0, failed = 0;
  let present = [];
  if (onlyMissing) {
    try { present = await latestChunkPresence(action.transport.write.callLatest, action.context.carrier, content.treeId, content.chunkCount); } catch { throw Error('Chunk presence unknown; refusing blind retry.'); }
  }
  const missing = Array.from({ length: content.chunkCount }, (_, i) => i).filter(i => !present[i]);
  done = content.chunkCount - missing.length;
  if (action.mode === 'wallet' && action.sponsor) {
    // Chunks-only sponsor request: staging is permissionless and covered by
    // the already-signed byte commitment — no new wallet prompt exists.
    toast('Staging ' + missing.length + ' chunk(s) via the sponsor…');
    try {
      await assertWalletContext(action.provider, action.context);
      const result = await sponsorSend(action, {
        content: { treeId: content.treeId, body: content.tree.body, leaves: content.leaves },
        chunks: missing.map(i => ({ index: i, chunkData: content.chunks[i] })),
      });
      const staged = result.chunks.filter(c => c.status === 'staged').length;
      return { complete: staged === missing.length, done: done + staged, failed: missing.length - staged };
    } catch { return { complete: false, done, failed: missing.length }; }
  }
  for (const i of missing) {
    toast('Staging bytes: chunk ' + (i + 1) + ' of ' + content.chunkCount + '…');
    const data = encodeStageChunk({ treeId: content.treeId, body: content.tree.body, index: i, chunkData: content.chunks[i], leaves: content.leaves });
    try {
      if (action.mode === 'wallet') {
        // Labeled DIRECT mode: each staging transaction is its own wallet
        // prompt, paid by the wallet account.
        const receipt = await walletSend(action, action.context.carrier, data, '0x400000', 'chunk ' + i);
        if (receipt.status === '0x1') done++; else failed++;
      } else {
        const receipt = await submitRaw(action.context.carrier, data, 4000000n, wallet, action, 'chunk ' + i);
        if (receipt.status === '0x1') done++; else failed++;
      }
    } catch (e) { failed = content.chunkCount - done; toast('Upload incomplete — choose the same file to continue. ' + friendlyError(e), true); break; }
  }
  return { complete: done === content.chunkCount, done, failed: content.chunkCount - done };
}

// ---- real wallet connection ------------------------------------------------
async function walletConnectFlow() {
  try {
    provider = detectProvider(); // the FIRST touch of window.ethereum, on deliberate user action
    if (!provider) throw Error('no EIP-1193 wallet is available in this browser');
    countWalletRequest();
    const { account } = await connect(provider, 31337);
    toast('Wallet connected: ' + short(account) + '. Checking author identity…');
    // Prefer the identity this fixture RESERVED for a wallet: it is a source
    // in the mount's plans, so its writes are actually selected and readable.
    // A derived identity is the fallback, and its writes would be invisible
    // here — so a squatted reserved slot is reported, never silently swapped.
    let principal = null, claimNeeded = false;
    const reserved = config.write.walletPrincipal ?? null;
    if (reserved) {
      const owner = await latestPrincipalAccount(transport.write.callLatest, config.expected.core, reserved);
      if (BigInt(owner) === 0n) { principal = reserved; claimNeeded = true; }
      else if (owner.toLowerCase() === account.toLowerCase()) principal = reserved;
      else throw Error('this fixture\u2019s reserved author identity is already claimed by ' + short(owner) + ', not your account. First-come claiming is a FIXTURE limitation, not production identity — restart the fixture for a fresh world.');
    } else {
      for (let salt = 0; salt < 4 && !principal; salt++) {
        const candidate = principalFor(account, salt);
        const owner = await latestPrincipalAccount(transport.write.callLatest, config.expected.core, candidate);
        if (BigInt(owner) === 0n) { principal = candidate; claimNeeded = true; }
        else if (owner.toLowerCase() === account.toLowerCase()) principal = candidate;
      }
      if (!principal) throw Error('no unclaimed author identity found for this account (first-come claiming is a fixture limitation, not production identity)');
    }
    if (claimNeeded) {
      toast('One-time setup: the wallet will ask to send ONE claim transaction binding this author identity to your account (your account pays it).');
      let receipt;
      try { receipt = await withAuthorizationFence(navigator.locks, async () => {
        if (storageError) throw Error(storageError); rereadJournals();
        const block = await transport.write.latestBlock(), nonce = await latestPrincipalNonce(transport.write.callLatest, config.expected.core, principal);
        const context = { environmentId, chainId: '31337', core: config.expected.core, principal, account, mountId: config.mounts[$('lens').value], lensId: $('lens').value, sourceId: config.expected.source, router: config.write.router, carrier: config.write.carrier };
        if (journal.conflict(context, String(nonce), String(BigInt(block.timestamp)))) throw Error('An earlier claim or signed approval is unresolved; reconcile it before another wallet request.');
        const action = { ...actionRuntime(context), actionId: crypto.randomUUID() };
        journal.begin({ actionId: action.actionId, label: 'Claim author identity', context, nonce: String(nonce), deadline: String(BigInt(Math.floor(Date.now() / 1000)) + 300n) });
        costEvent({ type: 'action/start', actionId: action.actionId, label: 'Claim author identity', createdAt: new Date().toISOString(), context });
        markAction(action, { authorization: 'unknown' });
        try {
          const r = await walletSend(action, config.expected.core, core3Interface.encodeFunctionData('claimPrincipal', [principal]), '0x30000', 'claim');
          markAction(action, { authorization: 'closed' }); return r;
        } catch (e) { if (isRejection(e)) markAction(action, { authorization: 'closed' }); throw e; }
      }); }
      catch (e) { if (isRejection(e)) throw Error('claim declined in the wallet; staying as guest'); throw e; }
      if (receipt.status !== '0x1') throw Error('the claim transaction was rejected on-chain');
    }
    session.signer = 'wallet'; session.mode = 'wallet'; session.wallet = null; session.principal = principal; session.account = account;
    updateSession(); if (current) render(current);
    toast(claimNeeded ? 'Author identity claimed. From here on: one wallet signature request per change' + (config.write.sponsor ? '; the sponsor pays the transactions.' : ' plus per-transaction approvals (no sponsor configured).')
      : 'Wallet author ready: one signature request per change' + (config.write.sponsor ? '; the sponsor pays.' : ' (direct mode).'));
  } catch (e) {
    $('signer').value = 'guest';
    session.signer = 'guest'; session.mode = 'guest'; session.wallet = null; session.principal = null; session.account = null;
    updateSession(); toast(friendlyError(e), true);
  }
}
const nameOf = () => path.at(-1), here = () => nameOf().subject;
async function priorOf(purpose, subject, role) {
  const state = await latestBindingState(transport.write.callLatest, config.expected.core, { principal: session.principal, purpose, subject, fieldRole: role });
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
    else { const b = text('button', p.name || 'trip', 'crumb'); b.type = 'button'; b.addEventListener('click', () => navigate({ lensId: $('lens').value, pathSegments: path.slice(1, i + 1).map(p => p.name) })); nav.append(b); }
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
  const add = (label, fn, title2) => { const b = text('button', label, 'row-button'); b.type = 'button'; if (title2) b.title = title2; b.setAttribute('aria-label', label + ': ' + (row.value?.name ?? row.outcome)); b.addEventListener('click', fn); box.append(b); return b; };
  if (usable && row.value.kind === 'DIRECTORY') add('Open', () => navigate({ ...directoryRoute(), pathSegments: [...directoryRoute().pathSegments, row.value.name] }));
  const safe = fn => () => Promise.resolve(fn()).catch(e => toast(friendlyError(e), true));
  if (usable && row.value.kind === 'FILE') add('Open', safe(() => navigate({ ...directoryRoute(), pathSegments: [...directoryRoute().pathSegments, row.value.name], fileId: row.value.nodeId })));
  if (usable && session.signer !== 'guest') {
    add('Rename', safe(() => renameFlow(row, false)));
    add('Move', safe(() => renameFlow(row, true)));
    if (row.value.kind === 'FILE') {
      add('Make independent copy', safe(() => copyFlow(row)), 'New File identity; edits stay separate');
      add('Add another name', safe(() => placementFlow(row)), 'Same File identity; edits are shared');
    }
    add('Remove', safe(() => removeFlow(row)));
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
    // UNKNOWN is not "does not carry this tag". Collapsing it to false would
    // silently drop an unreadable file out of a filtered view, which is the
    // filter asserting an absence it never established.
    if (result.outcome !== 'FOUND') throw Error('tag state unreadable for ' + row.value.name + ': ' + (result.reason ?? result.outcome));
    byNode.set(row.value.nodeId, result.value.current.some(c => c.active));
  }
  return byNode;
}

let renderToken = 0;
async function render(s) {
  const token = ++renderToken;
  current = s;
  updateSession();
  const presentation = presentListing(s);
  const nameFilter = $('filter').value.trim().toLowerCase();
  let rows = allRows(s);
  let tagMap = null, tagNote = '', tagBroken = false;
  if ($('tag-filter').value.trim()) {
    try { tagMap = await tagsFor(s.rows ?? []); tagNote = ' · tag filter shows only files confirmed to carry this tag (' + s.coverage + ' coverage)'; }
    catch { tagBroken = true; tagNote = ' · the tag filter could not run — showing nothing rather than guessing'; }
  }
  if (token !== renderToken) return; // a newer render superseded this one
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
    if (usable && tagBroken) { filtered++; continue; }
    if (usable && tagMap && !tagMap.get(row.value.nodeId)) { filtered++; continue; }
    const li = document.createElement('li');
    li.dataset.role = row.fieldRole; li.dataset.outcome = row.outcome; li.dataset.result = stringify(row);
    if (!usable) li.className = 'unresolved';
    const title = usable ? row.value.name : row.outcome === 'MASKED' ? 'Removed here (hidden, not erased)' : row.outcome === 'ABSENT' ? 'Nothing agreed at this name' : 'Sources disagree — needs attention';
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
  $('export').hidden = unavailable || !s.rows?.length || s.coverage !== 'COMPLETE';
  $('basis').textContent = `Snapshot ${acquisitions} · pinned block ${s.basis.blockNumber} · host revision ${s.basis.revision} · ${scope.stats().requests} network reads`;
  main.dataset.block = String(s.basis.blockNumber); main.dataset.revision = s.basis.executionSetId;
  await renderTrash();
}
async function renderTrash() {
  const g = generation, activeScope = scope, mountId = config.mounts[$('lens').value], subject = here();
  if (session.signer === 'guest') { $('trash').hidden = true; return; }
  try {
    const removed = await acquire(() => openRemoved(activeScope, { mountId, subject }));
    if (g !== generation) return;
    // UNREADABLE is not EMPTY: an UNKNOWN result must never render as
    // "no removed items" (the silent-absence bug class).
    if (removed.outcome !== 'FOUND') throw Error(removed.reason ?? 'removed items unavailable');
    const items = removed.value.items.filter(i => i.active);
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
      restore.setAttribute('aria-label', 'Restore ' + item.name);
      restore.addEventListener('click', () => restoreFlow(item).catch(e => toast(friendlyError(e), true))); actions.append(restore);
      li.append(info, actions); $('trash-rows').append(li);
    }
  } catch {
    if (g !== generation) return;
    $('trash').hidden = false;
    $('trash-summary').textContent = 'Removed items — currently unreadable (this is not proof of none)';
    $('trash-rows').replaceChildren();
  }
}

// ---- flows -----------------------------------------------------------------
async function afterWrite(result, message, { verifyBytes = null } = {}) {
  if (!result || result === 'CANCELLED') return;
  if (!result.action.navigationRefreshed) await refresh({});
  // Independent SDK verification under the CAPTURED mount/Lens; bytes separate.
  try {
    const checked = await withAuthorizationFence(navigator.locks, async () => { rereadJournals(); return reconcileAction(result.action.actionId); });
    const needsBytes = [1, 3, 5].includes(result.plan.op.kind) || verifyBytes != null;
    if (checked.effect === 'COMMITTED' && (!needsBytes || checked.bytes === 'VERIFIED')) toast(message + ' Committed and read back. Saved — selected effect independently verified.');
    else if (checked.effect === 'COMMITTED') toast('File listed; content incomplete. Upload incomplete — choose the same file to continue.', true);
    else toast(checked.admission === 'ADMITTED' ? 'Admitted, but not saved here under the captured Lens. Selection: ' + checked.selection : 'Sent — checking result. Requested effect is still unknown.', true);
  } catch { toast('Sent — checking result. Read-back unavailable; no success claim.', true); }
  $('status').focus();
}
async function reconcileAction(actionId) {
  const entry = journal.entries().find(a => a.actionId === actionId);
  if (!entry || entry.context.environmentId !== environmentId) throw Error('Recovery belongs to a different deployment/source; switch back to reconcile it.');
  const action = { ...actionRuntime(entry.context), actionId, nextAttempt: Date.now() };
  await assertDeploymentContext(action.transport.source, action.context);
  if (entry.requestId && entry.sponsorUrl && entry.sponsorUrl === config.write?.sponsor?.url) {
    try {
      const evidence = await sponsorStatus(entry.sponsorUrl, { requestId: entry.requestId, requestCommitment: entry.requestCommitment }, boundedJSON);
      for (const event of sponsorCostEvents(actionId, evidence, config.write.sponsor.payer)) costEvent(event);
      if (evidence.submitted === false || ['completed', 'failed'].includes(evidence.status)) {
        for (const prior of ledger.actions.find(a => a.actionId === actionId)?.attempts ?? []) if (prior.phase === 'sponsor request ' + entry.requestId && prior.status === 'unknown') recordAttempt(action, prior.attemptId, { status: 'not-submitted' });
      }
    } catch { /* sponsor unavailable remains unknown; canonical chain read still useful */ }
  }
  for (const prior of ledger.actions.find(a => a.actionId === actionId)?.attempts ?? []) if (prior.hash && !prior.receipt) {
    try { const receipt = await transport.write.receipt(prior.hash); if (receipt) recordReceipt(action, prior.attemptId, receipt); } catch { /* inclusion still unknown */ }
  }
  if (!entry.descriptor) return { admission: 'UNKNOWN', selection: 'UNKNOWN', effect: 'UNKNOWN', bytes: 'NOT_CHECKED' }; // setup receipt is not a Files effect
  const opened = await reader.open({ blockTag: 'latest' });
  if (opened.status !== 'READY') throw Error('Qualified recovery scope unavailable');
  try {
    const verified = await readBackOperation(opened.scope, entry.descriptor);
    let bytes = 'NOT_CHECKED';
    const requestedFileId = entry.requestedFileId ?? entry.content?.fileId;
    if (requestedFileId && verified.effect === 'COMMITTED') {
      const file = await openFile(opened.scope, { mountId: entry.context.mountId, fileId: requestedFileId });
      bytes = file.outcome === 'FOUND' && file.value.integrity === 'VERIFIED' ? 'VERIFIED' : 'UNAVAILABLE';
    }
    const state = { admission: verified.admission, selection: verified.selection, effect: verified.effect, bytes };
    markAction(action, state);
    costEvent({ type: 'action/effect', actionId, status: verified.effect === 'COMMITTED' && (!requestedFileId || bytes === 'VERIFIED') ? 'verified' : 'unknown' });
    return state;
  } finally { opened.scope.close(); }
}
async function reconcileRecorded() {
  if (writing || !journal) return;
  try { await withAuthorizationFence(navigator.locks, async () => {
    rereadJournals();
    for (const entry of journal.entries()) if (entry.context.environmentId === environmentId) await reconcileAction(entry.actionId);
  }); toast('Recorded actions reconciled with fresh qualified reads. Unknown entries are not permission to retry.'); }
  catch (e) { toast(friendlyError(e), true); }
}
async function resumeBytes(entry, file) {
  if (!file) return;
  if (writing || session.signer === 'guest') { toast('Select the original signer before resuming bytes.', true); return; }
  const bytes = toHex(new Uint8Array(await file.arrayBuffer()));
  const content = contentLeaves(bytes);
  if (content.treeId !== entry.content.treeId || String(file.size) !== entry.content.size) { toast('Reselected bytes do not match the original content tree. Nothing sent.', true); return; }
  if (entry.context.environmentId !== environmentId || entry.context.principal !== session.principal || entry.context.account.toLowerCase() !== (session.account ?? session.wallet?.address)?.toLowerCase()) { toast('Return to the original deployment and signer to resume.', true); return; }
  writing = true; main.dataset.writing = 'true'; lockControls(true);
  const action = { ...actionRuntime(entry.context), actionId: entry.actionId, nextAttempt: Date.now() };
  try { await withAuthorizationFence(navigator.locks, async () => {
    rereadJournals();
    await reconcileAction(entry.actionId);
    const unresolved = ledger.actions.find(a => a.actionId === entry.actionId)?.attempts.some(a => a.status !== 'not-submitted' && !a.receipt);
    if (unresolved) throw Error('An earlier transaction is still unknown; refusing a blind chunk retry.');
    const state = journal.entries().find(a => a.actionId === entry.actionId);
    if (state.effect !== 'COMMITTED') throw Error('Original requested metadata effect is not currently verified. Resume is refused; do not blindly reauthorize.');
    const staged = await stageContent(content, action.wallet, true, action);
    const checked = await reconcileAction(entry.actionId);
    toast(staged.complete && checked.bytes === 'VERIFIED' ? 'Original file content independently verified.' : 'Upload incomplete — choose the same file to continue.', !staged.complete);
  }); } catch (e) { toast(friendlyError(e), true); }
  finally { writing = false; delete main.dataset.writing; lockControls(false); }
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
  let draft = { name: '', text: '' };
  while (true) {
    const input = await prompt('New note', { withText: true, initial: draft.name, initialText: draft.text }); if (!input?.name) return;
    draft = input;
    const bytesHex = toHex(new TextEncoder().encode(input.text));
    const intent = { kind: 'createFile', mountId: config.mounts[$('lens').value], parent: here(), name: input.name, bytesHex, mediaType: 'text/plain', charset: 'utf-8', priors: { destination: await priorOfName(input.name) } };
    const result = await runOperation('create note “' + input.name + '”', intent, [['Note', input.name], ['In', crumbText()]]);
    if (result === 'CANCELLED') return; // deliberate stop; nothing sent
    if (!result) continue; // failure: re-open with the draft intact
    await afterWrite(result, result.staged.complete ? 'Note created with verified bytes.' : 'Note created; some bytes are not staged yet — open the file to stage the rest.', { verifyBytes: result.staged.complete ? result.plan.predicted.objectId : null });
    return;
  }
}
// Bytes retained for resume: an interrupted upload keeps its chunk plan so
// the file panel can stage only the missing chunks — no new approval needed.
const pendingBytes = new Map();
async function uploadFlow(file) {
  if (!file) return;
  const bytesHex = toHex(new Uint8Array(await file.arrayBuffer()));
  if ((bytesHex.length - 2) / 2 > 1048576) { toast('This prototype stages at most 1 MiB per file (256 chunks).', true); return; }
  let name = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  if (name !== file.name) {
    const choice = await prompt('This folder accepts a-z 0-9 . _ - only. Upload “' + file.name + '” as', { initial: name });
    if (!choice?.name) return;
    name = choice.name;
  }
  const intent = { kind: 'createFile', mountId: config.mounts[$('lens').value], parent: here(), name, bytesHex, mediaType: file.type || 'application/octet-stream', charset: null, priors: { destination: await priorOfName(name) } };
  const result = await runOperation('upload “' + name + '”', intent, [['File', name], ['In', crumbText()]]);
  if (result && result !== 'CANCELLED') {
    await afterWrite(result, result.staged.complete ? 'File uploaded with verified bytes.' : 'File record created; some bytes are not staged yet — open the file to stage the rest.', { verifyBytes: result.staged.complete ? result.plan.predicted.objectId : null });
  }
}
async function renameFlow(row, move) {
  const input = await prompt(move ? 'Move “' + row.value.name + '” into folder path (blank = here) and name' : 'Rename “' + row.value.name + '”', { initial: row.value.name });
  if (!input?.name) return;
  let destParent = here(), ancestorNames = [], destLabel = crumbText();
  if (move) {
    const target = await prompt('Move “' + row.value.name + '” into', { label: 'Folder path from the top, e.g. photos or photos/docs (blank = this folder)', initial: '' });
    if (target === null) return;
    const segments = target.name.split('/').filter(Boolean);
    if (segments.length) {
      let subject = path[0].subject;
      for (const segment of segments) {
        const found = await acquire(() => lookupName(scope, { mountId: config.mounts[$('lens').value], subject, name: segment }));
        if (found.outcome !== 'FOUND' || found.value.kind !== 'DIRECTORY') { toast('Destination folder not found: ' + segment + '. Nothing was moved.', true); return; }
        subject = found.value.subject;
      }
      destParent = subject; ancestorNames = segments; destLabel = (path[0].name || 'trip') + '/' + segments.join('/') + '/';
    }
  }
  const result = await runOperation(move ? 'move' : 'rename', {
    kind: 'renameMove', mountId: config.mounts[$('lens').value], parent: destParent, name: input.name,
    sourceParent: here(), sourceName: row.value.name, object: row.value.nodeId, ancestorNames,
    priors: { destination: await priorOf(FIXTURE.namePurpose, destParent, (await import('/Reviews/2026-09-09-files-reader/index.mjs')).nameRole(input.name)), source: await priorOfName(row.value.name) },
  }, [['From', crumbText() + row.value.name], ['Into folder', destLabel], ['New name', input.name], ['Identity', 'File Object unchanged: ' + short(row.value.nodeId)]]);
  await afterWrite(result, (move ? 'Moved.' : 'Renamed.') + ' The file identity did not change.');
}
async function copyFlow(row) {
  const input = await prompt('Make independent copy of “' + row.value.name + '” as'); if (!input?.name) return;
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
  const input = await prompt('Add another name for the SAME file (edits shared)'); if (!input?.name) return;
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
async function filePanel(row, selectedRoute, g = generation) {
  const dialog = $('file-panel'), body = $('file-body');
  const activeScope = scope, mountId = config.mounts[selectedRoute.lensId], subject = here();
  const selected = { row, route: selectedRoute, mountId, subject, generation: g };
  selection = selected; releasePreviews();
  $('file-title').textContent = row.value.name;
  body.replaceChildren(text('p', 'Reading verified content…'));
  if (!dialog.open) dialog.showModal();
  try {
    const [content, revisions, history, tags] = [
      await acquire(() => openFile(activeScope, { mountId, fileId: row.value.nodeId })),
      await acquire(() => openRevisions(activeScope, { mountId, fileId: row.value.nodeId })),
      await acquire(() => openHistory(activeScope, { mountId, subject, name: row.value.name })),
      await acquire(() => openTags(activeScope, { mountId, nodeId: row.value.nodeId, tagIds: (config.knownTags ?? []).map(t => tagId(t)) })),
    ];
    const historical = selectedRoute.revisionId ? await acquire(() => openFile(activeScope, { mountId, fileId: row.value.nodeId, revisionId: selectedRoute.revisionId })) : null;
    if (g !== generation || selection !== selected) return;
    body.replaceChildren();
    if (historical) {
      const back = text('button', 'Back to current', 'row-button'); back.type = 'button';
      back.addEventListener('click', () => { const { revisionId, ...route } = selectedRoute; navigate(route); }); body.append(back);
      renderContent(body, row, historical, 'selected historical version');
      if (session.signer !== 'guest') {
        try {
          prepareVerifiedDownload(historical, row.value.name);
          if (historical.value.executableHint) throw Error('unsupported executable metadata');
          const restore = text('button', 'Restore as new current version', 'row-button'); restore.type = 'button';
          restore.addEventListener('click', () => restoreVersion(selected, historical).catch(e => toast(friendlyError(e), true)));
          body.append(restore, text('p', 'Creates a new revision with these verified bytes. Existing versions remain unchanged.', 'row-meta'));
        } catch { body.append(text('p', 'Restore unavailable: requires complete verified bytes and non-executable metadata. This prototype edit API cannot preserve an executable hint.', 'row-meta')); }
      }
    }
    renderContent(body, row, content);
    renderTags(body, row, tags);
    renderRevisions(body, row, revisions, selectedRoute);
    renderHistory(body, history);
  } catch (e) { if (g === generation && selection === selected) body.replaceChildren(text('p', 'Content unavailable: ' + e.message, 'error')); }
}
function renderContent(body, row, content, revisionLabel = 'current') {
  const section = document.createElement('section'); section.className = 'content';
  section.append(text('h3', 'Content (' + revisionLabel + ')'));
  if (content.outcome !== 'FOUND') { section.append(text('p', 'Unresolved content: ' + (content.reason ?? content.outcome))); body.append(section); return; }
  const v = content.value;
  const meta = text('p', v.mediaType + ' · ' + v.totalSize + ' bytes · integrity ' + v.integrity, 'row-meta');
  section.append(meta);
  let attachment = null;
  try { attachment = prepareVerifiedDownload(content, row.value.name); } catch { /* no incomplete or unqualified download/preview */ }
  if (attachment) {
    const download = text('button', 'Download verified file', 'row-button'); download.type = 'button';
    download.addEventListener('click', () => {
      const safe = prepareVerifiedDownload(content, row.value.name), url = URL.createObjectURL(safe.blob), a = document.createElement('a');
      a.href = url; a.download = safe.filename; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    section.append(download);
    // Explicit raster allowlist. SVG, HTML and scripts never render as active
    // documents or carry their media type into a trusted-origin download.
    if (['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif'].includes(v.mediaType) && !v.executableHint) {
      const img = document.createElement('img');
      const blob = new Blob([attachment.bytes], { type: v.mediaType });
      img.src = URL.createObjectURL(blob); img.alt = row.value.name; img.className = 'preview';
      previewURLs.add(img.src);
      section.append(img);
    } else if (v.mediaType === 'text/plain') {
      const pre = document.createElement('pre'); pre.className = 'note-view';
      pre.textContent = new TextDecoder(v.charset ?? 'utf-8', { fatal: false }).decode(attachment.bytes);
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
    const pending = pendingBytes.get(row.value.nodeId);
    if (pending && session.signer !== 'guest') {
      const retry = text('button', 'Stage missing bytes now', 'row-button'); retry.type = 'button';
      retry.addEventListener('click', async () => {
        retry.disabled = true; // staging is in flight: a second click would re-send every chunk
        try {
          const entry = journal.entries().find(a => a.actionId === pending.action.actionId);
          await resumeBytes(entry, new File([fromHex(pending.content.data)], 'original-bytes'));
        } finally { retry.disabled = false; }
      });
      section.append(retry);
    }
  } else {
    section.append(text('p', 'Returned bytes FAILED verification and are not previewed.'));
  }
  body.append(section);
}
async function editNote(row, contentValue, initialText) {
  let draft = initialText;
  while (true) {
    const input = await prompt('Edit “' + row.value.name + '”', { withText: true, initial: row.value.name, initialText: draft, nameReadOnly: true });
    if (!input) return; // deliberate close; the note is unchanged
    draft = input.text;
    const bytesHex = toHex(new TextEncoder().encode(input.text));
    const intent = {
      kind: 'edit', mountId: config.mounts[$('lens').value], fileId: row.value.nodeId, bytesHex,
      mediaType: contentValue.mediaType, charset: contentValue.charset, priorRevisionId: contentValue.revisionId,
      priors: { head: await priorOf(FIXTURE.headPurpose, row.value.nodeId, FIXTURE.headRole) },
    };
    const result = await runOperation('edit note', intent, [['Note', row.value.name], ['Race safety', 'compare-and-swap on the current revision']]);
    if (result === 'CANCELLED') return;
    if (!result) continue; // failure (e.g. stale edit): re-open with the draft intact
    if (!result.action.navigationRefreshed) closeFileSelection();
    await afterWrite(result, result.staged.complete ? 'Edited; new revision verified.' : 'Edited; some bytes are not staged yet — open the file to stage the rest.', { verifyBytes: result.staged.complete ? row.value.nodeId : null });
    return;
  }
}
async function restoreVersion(selected, historical) {
  if (writing || selection !== selected || selected.generation !== generation) return;
  // Re-acquire both ancestry and the CURRENT head. The old revision supplies
  // only bytes/metadata; it can never become the new head by pointing backward.
  const opened = await reader.open({ blockTag: 'latest' });
  if (opened.status !== 'READY') throw Error('Fresh qualified current head unavailable; restore refused');
  let old, currentHead, prior;
  try {
    await resolveRoute(opened.scope, selected.route);
    old = await openFile(opened.scope, { mountId: selected.mountId, fileId: selected.row.value.nodeId, revisionId: historical.value.revisionId });
    prepareVerifiedDownload(old, selected.row.value.name);
    if (old.value.executableHint) throw Error('Restore refused: the current edit API cannot preserve executable metadata');
    currentHead = await openFile(opened.scope, { mountId: selected.mountId, fileId: selected.row.value.nodeId });
    if (currentHead.outcome !== 'FOUND' || currentHead.qualification?.status !== 'QUALIFIED' || currentHead.qualification.coverage !== 'COMPLETE' || !currentHead.value.revisionId) throw Error('Current version unresolved; restore refused');
    prior = await priorOf(FIXTURE.headPurpose, selected.row.value.nodeId, FIXTURE.headRole);
  } finally { opened.scope.close(); }
  if (selection !== selected || generation !== selected.generation) return;
  const result = await runOperation('restore version', {
    kind: 'edit', mountId: selected.mountId, fileId: selected.row.value.nodeId,
    // The existing SDK defaults null to UTF-8; empty string encodes its absent
    // optional charset and therefore preserves historical null exactly.
    bytesHex: old.value.bytes, mediaType: old.value.mediaType, charset: old.value.charset ?? '',
    priorRevisionId: currentHead.value.revisionId, priors: { head: prior },
  }, [['File', selected.row.value.name], ['Historical bytes', short(old.value.revisionId)], ['New revision', 'Uses current head compare-and-swap; no history is overwritten']]);
  if (!result || result === 'CANCELLED') return;
  if (!result.action.navigationRefreshed) closeFileSelection();
  await afterWrite(result, 'Restored as a new current version; earlier versions remain readable.', { verifyBytes: selected.row.value.nodeId });
}
function renderRevisions(body, row, revisions, selectedRoute) {
  const section = document.createElement('section');
  section.append(text('h3', 'Versions'));
  if (revisions.outcome !== 'FOUND') { section.append(text('p', 'Revision history unavailable.')); body.append(section); return; }
  const ul = document.createElement('ul'); ul.className = 'revisions';
  for (const r of revisions.value.revisions) {
    const li = document.createElement('li');
    li.append(text('span', 'Revision ' + r.revision + (r.current ? ' (current)' : '') + ' · ' + (r.mediaType ?? 'retracted') + ' · ' + short(r.revisionId ?? '')));
    if (r.revisionId && !r.current) {
      const openOld = text('button', 'Open this revision', 'row-button'); openOld.type = 'button';
      openOld.addEventListener('click', () => navigate({ ...selectedRoute, revisionId: r.revisionId }));
      li.append(openOld);
    }
    ul.append(li);
  }
  section.append(ul); body.append(section);
}
function renderHistory(body, history) {
  if (history.outcome !== 'FOUND') {
    const section = document.createElement('section');
    section.append(text('h3', 'Name history'));
    section.append(text('p', 'The name history could not be read (' + (history.reason ?? history.outcome) + '). This is NOT the same as having no history.', 'row-meta'));
    body.append(section); return;
  }
  if (!history.value.timeline.length) return;
  const section = document.createElement('section');
  const details = document.createElement('details');
  details.append(text('summary', 'Name history (' + history.value.timeline.length + ' events)'));
  const ul = document.createElement('ul');
  for (const h of history.value.timeline) ul.append(text('li', 'rev ' + h.revision + ' · ' + h.kind + ' · source ' + short(h.principal)));
  details.append(ul); section.append(details); body.append(section);
}
function renderTags(body, row, tags) {
  const section = document.createElement('section');
  section.append(text('h3', 'Tags'));
  const list = document.createElement('div'); list.className = 'tags';
  const label = id => (config.knownTags ?? []).find(t => tagId(t) === id) ?? short(id);
  if (tags.outcome !== 'FOUND') {
    // Unreadable tag state must never render as "no tags".
    list.append(text('span', 'Tags could not be read here (' + (tags.reason ?? tags.outcome) + '). This is NOT the same as having no tags.', 'row-meta'));
    section.append(list); body.append(section); return;
  }
  const active = tags.value.current.filter(t => t.active);
  if (!active.length) list.append(text('span', 'No current tags from the trusted sources.', 'row-meta'));
  for (const t of active) {
    const chip = text('span', label(t.tagId) + ' · by ' + (t.principal === config.authors.A ? 'A' : t.principal === config.authors.B ? 'B' : short(t.principal)), 'tag-chip');
    if (session.signer !== 'guest' && t.principal === session.principal) {
      const un = text('button', '×', 'chip-remove'); un.type = 'button'; un.title = 'Withdraw my tag (other authors keep theirs)';
      un.setAttribute('aria-label', 'Withdraw my tag: ' + label(t.tagId));
      un.addEventListener('click', async () => {
        const result = await runOperation('untag', { kind: 'untag', mountId: config.mounts[$('lens').value], object: row.value.nodeId, label: label(t.tagId), priors: { tag: await priorOf(FIXTURE.tagPurpose, row.value.nodeId, t.tagId) } }, [['Untag', label(t.tagId)], ['Scope', 'withdraws only YOUR assertion']]);
        if (result && result !== 'CANCELLED') { if (!result.action.navigationRefreshed) closeFileSelection(); await afterWrite(result, 'Your tag was withdrawn; other authors keep theirs.'); }
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
      if (result && result !== 'CANCELLED') { if (!config.knownTags.includes(input.name)) config.knownTags.push(input.name); if (!result.action.navigationRefreshed) closeFileSelection(); await afterWrite(result, 'Tagged.'); }
    });
    section.append(add);
  }
  body.append(section);
}
$('close-file').addEventListener('click', () => navigate(directoryRoute()));
$('file-panel').addEventListener('cancel', e => { e.preventDefault(); navigate(directoryRoute()); });

// ---- export ----------------------------------------------------------------
async function exportFolder() {
  try {
    if (current?.coverage !== 'COMPLETE') { toast('Export refused: this listing is ' + (current?.coverage ?? 'unavailable') + ', not COMPLETE — a partial folder must not masquerade as a full copy. Load all rows first.', true); return; }
    toast('Collecting the authenticated export bundle…');
    const mountId = config.mounts[$('lens').value];
    const chainId = parseInt(await transport.source.request('eth_chainId', []), 16);
    const header = await transport.source.request('eth_getBlockByNumber', ['0x' + current.basis.blockNumber.toString(16), false]);
    if (!header || header.hash?.toLowerCase() !== current.basis.blockHash.toLowerCase()) throw Error('the transport returned a different block for the pinned height; export aborted');
    const bundle = await assembleExport({
      acquireRecord: id => acquire(() => scope.call('getRecord', [id])),
      openFileById: id => acquire(() => openFile(scope, { mountId, fileId: id })),
      sealScope: () => acquire(() => scope.seal()),
      resolveEntry: async (parent, name) => {
        const r = await acquire(() => lookupName(scope, { mountId, subject: parent, name }));
        if (r.outcome !== 'FOUND') throw Error('the export path could not be re-authenticated at step ' + name);
        return r.selectedId;
      },
      pathChain: path.slice(1).map(p => ({ name: p.name, subject: p.subject })),
      rows: current.rows, listingCoverage: current.coverage,
      // Positions the lens could not resolve are NOT in rows; carrying the
      // count stops a COMPLETE listing from implying a complete file set.
      unresolvedPositions: (current.unresolved ?? []).length,
      basis: current.basis, header, chainId,
      expected: { core: config.expected.core, carrier: config.expected.execution.carrier, source: config.expected.source },
      mountId, subject: here(), pathLabel: crumbText(), planId: config.plans[$('lens').value],
    });
    bundle.exportedAt = new Date().toISOString();
    const blob = new Blob([JSON.stringify(bundle, (_, v) => typeof v === 'bigint' ? String(v) : v, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'efs-export-' + String(current.basis.blockNumber) + '.json';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Export saved. Verify it in a clean reader with: node scripts/verify-export.mjs <file>');
  } catch (e) { toast('Export failed: ' + e.message, true); }
}

// ---- loading ---------------------------------------------------------------
async function load(g) {
  if (busy || g !== generation) return; busy = true; main.dataset.state = 'loading';
  $('more').setAttribute('aria-disabled', 'true');
  $('coverage').textContent = 'Reading more';
  try {
    let result = await acquire(() => stream.loadMore());
    if (g !== generation) return;
    if (result.rowsEvidence === 'PRIOR_SEALED' && /budget/.test(result.detail ?? '')) {
      // Simple budget policy: transparently begin a fresh acquisition at the
      // SAME pinned block and continue; the acquisition counter stays honest.
      const previous = scope, activeStream = stream;
      const pin = result.basis?.blockNumber ?? current?.basis.blockNumber;
      if (pin == null) throw Error('Continuation has no pinned basis');
      const reopened = await reader.open({ blockTag: '0x' + BigInt(pin).toString(16), signal: cancel.signal });
      if (g !== generation) { reopened.scope?.close(); return; }
      if (reopened.status === 'READY') {
        const handoff = await acquire(() => activeStream.resume(reopened.scope));
        if (g !== generation) { reopened.scope.close(); return; }
        if (handoff.status === 'RESUMED') {
          scope = reopened.scope; acquisitions++; previous.close();
          result = await acquire(() => activeStream.loadMore());
        } else reopened.scope.close();
      }
    }
    if (g !== generation) return;
    await render(result);
  } catch (e) { if (g === generation) { $('coverage').textContent = 'Read unavailable'; toast('The read could not finish: ' + e.message, true); } }
  finally { if (g === generation) { busy = false; main.dataset.state = 'settled'; $('more').setAttribute('aria-disabled', 'false'); renderEconomics(); } }
}
async function refresh({ samePin = false } = {}) {
  const g = ++generation;
  const pin = samePin && current ? '0x' + current.basis.blockNumber.toString(16) : 'latest';
  stream?.close();
  // The abort signal belongs to the scope: navigating within the same pinned
  // observation must NOT abort the live scope it keeps using.
  if (!samePin) { cancel?.abort(); cancel = new AbortController(); scope?.close(); scope = null; }
  else if (!cancel) cancel = new AbortController();
  current = null; busy = false; closeWhy(); selection = null; renderToken++;
  updateSession();
  releasePreviews(); $('file-panel').close();
  for (const id of ['rows', 'attention-rows', 'history-rows', 'trash-rows']) $(id).replaceChildren();
  $('attention').hidden = true; $('history').hidden = true; $('trash').hidden = true;
  $('more').hidden = true; $('export').hidden = true; $('basis').textContent = '';
  main.dataset.state = 'loading'; crumbs();
  $('coverage').textContent = 'Reading observation';
  toast('Checking the pinned source before listing this folder…');
  try {
    const requested = decodeFilesRoute(location.hash) ?? { lensId: $('lens').value, pathSegments: [] };
    $('lens').value = requested.lensId;
    if (!scope) {
      const opened = await reader.open({ blockTag: samePin ? pin : 'latest', signal: cancel.signal });
      if (g !== generation) { opened.scope?.close(); return; }
      if (opened.status !== 'READY') throw Error(opened.reason);
      scope = opened.scope; acquisitions++;
    }
    const resolved = await resolveRoute(scope, requested, () => g === generation);
    if (g !== generation || !resolved) return;
    path = resolved.path; crumbs();
    stream = openDirectory(scope, { mountId: config.mounts[$('lens').value], subject: here(), pageSize: config.directoryPageSize ?? 32 });
    await load(g);
    if (g === generation && resolved.row) await filePanel(resolved.row, requested, g);
  } catch (e) {
    if (g !== generation) return;
    $('coverage').textContent = 'Read unavailable';
    toast('No folder result: ' + e.message + '. This is not an empty-folder claim.', true);
    main.dataset.state = 'settled';
    $('status').focus();
  }
}

// ---- wire up ---------------------------------------------------------------
$('more').addEventListener('click', () => { if (!busy) load(generation); });
$('refresh').addEventListener('click', () => { if (config && !writing) refresh({}); });
$('lens').addEventListener('change', () => { if (config && !writing) navigate({ ...(selection?.route ?? directoryRoute()), lensId: $('lens').value }, { samePin: false }); });
$('filter').addEventListener('input', () => { if (current) render(current); });
$('tag-filter').addEventListener('change', () => { if (current) render(current); });
const guarded = fn => (...args) => Promise.resolve(fn(...args)).catch(e => toast(friendlyError(e), true));
$('export').addEventListener('click', guarded(exportFolder));
$('new-folder').addEventListener('click', guarded(newFolderFlow));
$('new-note').addEventListener('click', guarded(newNoteFlow));
$('upload').addEventListener('change', guarded(e => { const f = e.target.files[0]; e.target.value = ''; return uploadFlow(f); }));
$('signer').addEventListener('change', () => {
  if (writing) return;
  const value = $('signer').value;
  if (value === 'wallet') { walletConnectFlow(); return; }
  if (value === 'guest') { session.signer = 'guest'; session.mode = 'guest'; session.wallet = null; session.principal = null; session.account = null; }
  else { session.signer = value; session.mode = 'simulated'; session.wallet = new Wallet(config.write.authors[value].key); session.principal = config.write.authors[value].principal; session.account = null; }
  updateSession(); if (current) render(current);
});
addEventListener('hashchange', () => { if (reader && !writing) refresh({}); });
addEventListener('pagehide', () => { generation++; releasePreviews(); cancel?.abort(); stream?.close(); scope?.close(); });

try {
  // Relay mode (EFS local server) or standalone static hosting: a static
  // export ships ./config.json with an explicit rpcUrl and talks JSON-RPC
  // directly — no EFS-specific server endpoints involved.
  const relay = await fetch('/config', { credentials: 'omit', cache: 'no-store' }).catch(() => null);
  if (relay?.ok) {
    config = await boundedJSON(relay, 1048576);
    transport = { mode: 'relay', source: createRPCSource({ identity: config.expected.source }), write: writePath };
  } else {
    const staticResponse = await fetch('./config.json', { credentials: 'omit', cache: 'no-store' });
    if (!staticResponse.ok) throw Error('fixture config unavailable');
    config = await boundedJSON(staticResponse, 1048576);
    if (typeof config.rpcUrl !== 'string' || !/^https?:\/\//.test(config.rpcUrl)) throw Error('static config missing an explicit rpcUrl');
    transport = { mode: 'direct-static', source: createDirectRPCSource({ identity: config.expected.source, url: config.rpcUrl }), write: directWritePath(config.rpcUrl) };
  }
  if (config.kind !== 'DISPOSABLE_FILES_BROWSER') throw Error('unsupported fixture');
  if (config.directoryPageSize !== undefined && (!Number.isInteger(config.directoryPageSize) || config.directoryPageSize < 1 || config.directoryPageSize > 32)) throw Error('directoryPageSize must be an integer from 1 to 32');
  const deployment = await transport.source.request('eth_getBlockByNumber', ['0x1', false]);
  if (!deployment?.hash) throw Error('deployment identity unavailable');
  environmentId = config.expected.source + '/' + config.expected.core + '/' + deployment.hash;
  try {
    journal = createActionJournal(localStorage);
    const saved = localStorage.getItem(costKey);
    ledger = saved ? restoreLedger(saved) : createLedger({ sessionId: crypto.randomUUID(), createdAt: new Date().toISOString() });
    const seeded = seedCostDefaults(ledger); ledger = seeded.ledger;
    // Add public defaults without overwriting another tab's newer actions.
    // If a writer holds the lock, guest viewing uses in-memory defaults; the
    // next locked mutation rereads and preserves them with its journal event.
    if (seeded.changed && navigator.locks?.request) await navigator.locks.request('efs-files-authorizing-v1', { mode: 'exclusive', ifAvailable: true }, lock => {
      if (!lock) return;
      const current = localStorage.getItem(costKey);
      const fresh = seedCostDefaults(current ? restoreLedger(current) : ledger);
      if (fresh.changed || !current) localStorage.setItem(costKey, exportLedger(fresh.ledger));
      ledger = fresh.ledger;
    });
  } catch (e) { storageError = e.message; ledger ??= createLedger({ sessionId: crypto.randomUUID(), createdAt: new Date().toISOString() }); }
  ledger = seedCostDefaults(ledger).ledger; selectCostSnapshots();
  $('economics').replaceChildren();
  economics = createEconomicsPanel($('economics'), {
    async onModel(values) { return withAuthorizationFence(navigator.locks, async () => {
      rereadJournals();
      const now = new Date().toISOString(), id = crypto.randomUUID();
      costEvent({ type: 'fee/add', snapshot: { id, capturedAt: now, source: 'User-entered MANUAL MODEL assumptions; not a live quote', chainFamily: values.family,
        executionGasPriceWei: modelWei(values.gasPrice, 9), l1FeeWei: modelWei(values.l1Fee, 18), operatorFeeWei: modelWei(values.operatorFee, 18),
        ...(values.family === 'arbitrum' ? { arbitrumMode: 'separate-execution' } : {}) } });
      selectedModels = selectedModels.filter(s => ledger.feeSnapshots.find(f => f.id === s)?.chainFamily !== values.family).concat(id);
      if (values.fx) { selectedFx = crypto.randomUUID(); costEvent({ type: 'fx/add', snapshot: { id: selectedFx, capturedAt: now, source: 'User-entered manual ETH/USD snapshot', usdPerEth: values.fx } }); }
      renderEconomics();
    }); },
    onExport() { const blob = new Blob([exportLedger(ledger)], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'efs-public-cost-journal.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); },
    onReset() { if (!writing) withAuthorizationFence(navigator.locks, async () => { rereadJournals(); costEvent({ type: 'display/reset' }); journal.resetDisplay(); }).catch(e => toast(friendlyError(e), true)); },
    onReconcile: reconcileRecorded,
    onReselect: (entry, file) => resumeBytes(entry, file).catch(e => toast(friendlyError(e), true)),
  });
  renderEconomics();
  if (storageError) $('economics').append(text('p', storageError + ' Existing cost/recovery history unavailable. Guest reading remains available.', 'error'));
  config.knownTags = config.knownTags ?? ['ocean', 'draft'];
  path = [{ name: config.rootLabel ?? 'trip', subject: config.root }];
  if (config.write) for (const [key, author] of Object.entries(config.write.authors)) {
    if (!author.key) continue; // default static exports never contain local keys
    const option = text('option', author.label + ' (local test signer)'); option.value = key; $('signer').append(option);
  }
  if (config.write) {
    // The option is offered without probing for a provider: reading
    // window.ethereum at boot would be wallet discovery, which guest
    // browsing must never do. Detection happens on deliberate selection.
    const option = text('option', 'Real wallet (EIP-1193, ' + (config.write.sponsor ? 'sponsored' : 'direct') + ')');
    option.value = 'wallet'; $('signer').append(option);
  }
  const query = new URLSearchParams(location.search);
  const lens = query.get('lens');
  $('lens').value = ['aFirst', 'bFirst', 'exact'].includes(lens) ? lens : 'aFirst';
  $('scenario').textContent = config.scenario ?? 'Local upgradeable testnet fixture.';
  $('delay').textContent = transport.mode === 'direct-static' ? 'Standalone static hosting: direct JSON-RPC to ' + config.rpcUrl : config.injectedDelayMs ? `Test transport: ${config.injectedDelayMs} ms injected before each RPC read.` : 'Local transport; no injected RPC delay.';
  updateSession();
  reader = createFixtureReader({ source: transport.source, context: { expected: config.expected, ...(config.readerLimits ? { limits: config.readerLimits } : {}) } });
  await refresh({});
} catch (e) { $('coverage').textContent = 'Read unavailable'; toast('Cannot start this local fixture: ' + e.message, true); main.dataset.state = 'settled'; }
