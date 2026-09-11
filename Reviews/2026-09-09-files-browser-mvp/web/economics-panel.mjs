import { selectSessionCosts, selectActionCosts } from './cost-ledger.mjs';
export function modelWei(value, precision) {
  if (value === '') return null;
  if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(value)) throw Error('Enter a nonnegative decimal amount');
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > precision) throw Error('Amount exceeds supported precision');
  return String(BigInt(whole) * 10n ** BigInt(precision) + BigInt(fraction.padEnd(precision, '0')));
}
export function normalizeReceipt(r) {
  if (!['0x0', '0x1', 'success', 'reverted'].includes(r.status)) throw Error('Unknown receipt status');
  return { hash: r.transactionHash ?? r.hash, status: r.status === '0x1' || r.status === 'success' ? 'success' : 'reverted', gasUsed: r.gasUsed == null ? null : String(BigInt(r.gasUsed)), effectiveGasPrice: r.effectiveGasPrice == null ? null : String(BigInt(r.effectiveGasPrice)), chainFamily: 'ethereum' };
}
export function sponsorCostEvents(actionId, result, payerAddress) {
  const events = [];
  for (const [position, tx] of (result.transactions ?? []).entries()) {
    const attemptId = `${result.requestId}:${tx.phase}:${tx.index ?? position}`;
    events.push({ type: 'attempt/upsert', actionId, attemptId, phase: tx.phase, hash: tx.hash ?? undefined, status: tx.hash ? 'submitted' : tx.status === 'not-submitted' ? 'not-submitted' : 'unknown', payer: 'sponsor', payerAddress });
    if (tx.receipt) events.push({ type: 'receipt/record', actionId, attemptId, receipt: normalizeReceipt(tx.receipt) });
  }
  return events;
}
const costText = x => `${x.knownEth} ETH known${x.totalUsd === null ? ' · USD unavailable' : ` · $${x.totalUsd}`}${x.totalWei === null ? ' · incomplete' : ''}`;
export function panelView(ledger, options = {}) {
  const totals = selectSessionCosts(ledger, options);
  const selected = totals.scenarios.at(-1);
  return { ...totals, summary: `Gas & cost · ${totals.actual.executionGasUsed} known receipt gas · ${costText(totals.actual)}${selected ? ` · ${selected.chainFamily} MODEL ${costText(selected)}` : ' · models unavailable until pinned'}`,
    actions: ledger.actions.filter(a => !ledger.hiddenActionIds.includes(a.actionId)).map(a => ({ ...a, costs: selectActionCosts(ledger, a.actionId, options) })) };
}
const el = (tag, value, cls) => { const node = document.createElement(tag); if (value != null) node.textContent = value; if (cls) node.className = cls; return node; };
const families = [['ethereum', 'Ethereum'], ['optimism', 'OP'], ['base', 'Base'], ['arbitrum', 'Arbitrum']];
const grouped = value => BigInt(value).toLocaleString('en-US');
const compactGas = value => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(BigInt(value));
export function formatUsd(value) {
  if (value == null) return 'Unavailable';
  const [whole, fraction = ''] = value.split('.');
  if (BigInt(whole) === 0n && !/[1-9]/.test(fraction.slice(0, 2)) && /[1-9]/.test(fraction)) return '<$0.01';
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(3, '0').slice(0, 2)) + (Number(fraction[2] ?? '0') >= 5 ? 1n : 0n);
  return '$' + grouped(cents / 100n) + '.' + String(cents % 100n).padStart(2, '0');
}
const estimate = costs => !costs ? 'Unavailable' : costs.totalUsd != null ? '≈ ' + formatUsd(costs.totalUsd)
  : costs.knownUsd != null ? formatUsd(costs.knownUsd) + ' known · pending' : 'Unavailable';
const units = (value, decimals) => value == null || value === 'not-applicable' ? ''
  : (BigInt(value) / 10n ** BigInt(decimals)).toString() + (BigInt(value) % 10n ** BigInt(decimals) ? '.' + (BigInt(value) % 10n ** BigInt(decimals)).toString().padStart(decimals, '0').replace(/0+$/, '') : '');
const stamp = value => value.slice(0, 16).replace('T', ' ') + ' UTC';
export function createEconomicsPanel(host, { onModel, onExport, onReset, onReconcile, onReselect }) {
  let last, activeFamily = 'base', showAll = false, fieldsInitialized = false;
  const summary = el('summary', 'Gas & cost'), popover = el('section', null, 'cost-popover');
  popover.setAttribute('aria-label', 'Gas and cost estimates');
  const header = el('div', null, 'cost-header'), title = el('h2', 'Gas & cost'), close = el('button', '×', 'cost-close');
  close.type = 'button'; close.setAttribute('aria-label', 'Close costs');
  const collapse = () => { host.open = false; summary.focus({ preventScroll: true }); };
  close.onclick = collapse; header.append(title, close);
  host.addEventListener('toggle', () => { if (host.open && getComputedStyle(summary).visibility === 'hidden') close.focus({ preventScroll: true }); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && host.open && !document.querySelector('dialog[open]')) { event.preventDefault(); collapse(); } });
  document.addEventListener('pointerdown', event => { if (host.open && !host.contains(event.target)) host.open = false; });
  const session = el('p', '', 'cost-session'), models = el('div', null, 'cost-chains');
  const note = el('p', 'Estimated with sampled rates + assumed network overhead. Alternatives, not additional spending.', 'cost-note');
  const date = el('p', '', 'cost-date'), actions = el('div', null, 'cost-actions');
  const recent = el('h3', 'Recent actions'), more = el('button', '', 'cost-more'); more.type = 'button';
  more.onclick = () => { showAll = !showAll; render(...last); };
  const settings = el('details', null, 'cost-settings'); settings.append(el('summary', 'Details & assumptions'));
  const form = el('form'), diagnostics = el('p', '', 'cost-diagnostics'), actual = el('p', '', 'cost-actual');
  const sourceDetails = el('details', null, 'cost-sources'); sourceDetails.append(el('summary', 'Rate sources & timestamps'));
  const sources = el('div'); sourceDetails.append(sources);
  form.className = 'cost-model';
  const fields = {};
  for (const [name, label, initial] of [['family', 'Network', ''], ['gasPrice', 'Gas price · gwei', ''], ['l1Fee', 'Data allowance · ETH / transaction', ''], ['operatorFee', 'Operator allowance · ETH / transaction', ''], ['fx', 'ETH price · USD', '']]) {
    const labelNode = el('label', label), input = el(name === 'family' ? 'select' : 'input'); input.name = name; input.value = initial;
    if (name === 'family') for (const [value, label] of families) { const option = el('option', label); option.value = value; input.append(option); }
    else { input.type = 'text'; input.inputMode = 'decimal'; }
    labelNode.append(input); fields[name] = input; form.append(labelNode);
  }
  const fillFields = () => {
    if (!last) return;
    const [ledger, , , options] = last, modelId = options.scenarioSnapshotIds?.find(id => ledger.feeSnapshots.find(s => s.id === id)?.chainFamily === fields.family.value);
    const model = ledger.feeSnapshots.find(s => s.id === modelId), fx = ledger.fxSnapshots.find(s => s.id === options.fxSnapshotId);
    for (const [field, key, decimals] of [['gasPrice', 'executionGasPriceWei', 9], ['l1Fee', 'l1FeeWei', 18], ['operatorFee', 'operatorFeeWei', 18]]) fields[field].value = units(model?.[key], decimals);
    fields.fx.value = fx?.usdPerEth ?? '';
  };
  fields.family.addEventListener('change', fillFields);
  const pin = el('button', 'Apply estimates'); pin.type = 'submit'; form.append(pin);
  const error = el('p'); error.setAttribute('role', 'alert'); form.append(error);
  form.addEventListener('submit', async e => { e.preventDefault(); try { await onModel(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.value]))); error.textContent = ''; } catch (e) { error.textContent = e.message; } });
  const controls = el('div', null, 'cost-tools');
  for (const [label, callback] of [['Export public cost journal', onExport], ['Hide resolved costs', onReset], ['Reconcile recorded actions (read only)', onReconcile]]) { const b = el('button', label); b.type = 'button'; b.onclick = callback; controls.append(b); }
  settings.append(el('p', 'These estimates reuse local measured execution gas. Data/operator allowances are flat assumptions, not transaction-specific quotes. Zero excludes that component; blank means unknown. Changing rates never changes receipts.', 'cost-note'), form, sourceDetails, actual, diagnostics, controls);
  popover.append(header, session, models, date, note, recent, actions, more, settings);
  host.append(summary, popover);
  function render(ledger, recovery, metrics, options = {}) {
    last = [ledger, recovery, metrics, options];
    const view = panelView(ledger, options), selected = view.scenarios.find(s => s.chainFamily === activeFamily);
    summary.replaceChildren(el('span', 'Gas ' + compactGas(view.actual.executionGasUsed), 'cost-toggle-gas'), el('span', families.find(([f]) => f === activeFamily)[1] + ' ' + estimate(selected), 'cost-toggle-price'));
    summary.title = grouped(view.actual.executionGasUsed) + ' measured gas · open four-network cost comparison';
    summary.dataset.gasUsed = view.actual.executionGasUsed;
    summary.setAttribute('aria-label', 'Gas and cost: ' + summary.title + '. ' + estimate(selected));
    session.textContent = `${view.actions.length} action${view.actions.length === 1 ? '' : 's'} · ${grouped(view.actual.executionGasUsed)} measured gas${view.actual.unresolvedAttemptCount ? ' · receipts pending' : ''}`;
    diagnostics.textContent = metrics ? `Reads: ${grouped(metrics.logicalCalls)} RPC calls · ${grouped(metrics.httpBatches)} HTTP requests · ${grouped(metrics.responseBytes)} response bytes. Not paid gas.` : 'Read measurements unavailable.';
    actual.textContent = `Local test chain only: ${costText(view.actual)} · ${view.actual.transactionCount} receipts (${view.actual.revertedTransactionCount} reverted). This is not money spent on the four networks above.`;
    const fx = ledger.fxSnapshots.find(s => s.id === options.fxSnapshotId);
    const times = view.scenarios.map(s => s.snapshot.capturedAt).concat(fx ? [fx.capturedAt] : []);
    date.textContent = times.length ? 'Snapshot ' + stamp([...times].sort()[0]) + ' · not a live quote' : 'No rates selected';
    const focusedFamily = document.activeElement?.closest('.cost-chain')?.dataset.family;
    models.replaceChildren();
    for (const [family, label] of families) {
      const model = view.scenarios.find(s => s.chainFamily === family);
      const card = el('button', null, 'cost-chain'); card.type = 'button'; card.dataset.family = family;
      card.setAttribute('aria-pressed', String(family === activeFamily));
      card.append(el('span', label), el('strong', estimate(model)));
      card.onclick = () => { activeFamily = family; fields.family.value = family; fillFields(); render(...last); };
      models.append(card);
    }
    if (focusedFamily) models.querySelector(`[data-family="${focusedFamily}"]`)?.focus({ preventScroll: true });
    sources.replaceChildren();
    for (const model of view.scenarios) sources.append(el('p', `${families.find(([f]) => f === model.chainFamily)[1]} · ${stamp(model.snapshot.capturedAt)}\n${model.snapshot.source}`));
    if (fx) sources.append(el('p', `ETH/USD · ${fx.usdPerEth} · ${stamp(fx.capturedAt)}\n${fx.source}`));
    if (!fieldsInitialized) { fields.family.value = activeFamily; fillFields(); fieldsInitialized = true; }
    const focusedAction = document.activeElement?.closest('.cost-actions > details')?.dataset.actionId;
    const focusSelector = document.activeElement?.matches('.cost-evidence > summary') ? '.cost-evidence > summary'
      : document.activeElement?.matches('input[type=file]') ? 'input[type=file]' : ':scope > summary';
    const openIds = new Set([...actions.querySelectorAll(':scope > details[open]')].map(n => n.dataset.actionId));
    const evidenceIds = new Set([...actions.querySelectorAll('.cost-evidence[open]')].map(n => n.parentElement.dataset.actionId));
    actions.replaceChildren();
    const ordered = [...view.actions].reverse(), visible = showAll ? ordered : ordered.slice(0, 5);
    more.hidden = ordered.length <= 5; more.textContent = showAll ? 'Show recent actions' : `Show all ${ordered.length} actions`;
    if (!visible.length) actions.append(el('p', 'Your next file action will appear here.', 'cost-empty'));
    for (const action of visible) {
      const row = el('details'); row.dataset.actionId = action.actionId; row.open = openIds.has(action.actionId);
      const actionSummary = el('summary');
      const name = el('span', action.label, 'cost-action-name');
      name.append(el('small', compactGas(action.costs.actual.executionGasUsed) + ' gas', 'cost-action-gas-preview'));
      actionSummary.append(name, el('span', estimate(action.costs.scenarios.find(s => s.chainFamily === activeFamily)), 'cost-action-price'));
      row.append(actionSummary, el('p', grouped(action.costs.actual.executionGasUsed) + ' gas · ' + action.costs.actual.transactionCount + ' receipts' + (action.costs.actual.unresolvedAttemptCount ? ' · receipts pending' : ''), 'cost-action-gas'));
      const hint = recovery.find(r => r.actionId === action.actionId);
      row.append(el('p', `Effect: ${hint?.effect ?? 'UNKNOWN'} · content: ${hint?.bytes ?? 'NOT_CHECKED'}`, 'cost-effect'));
      const comparison = el('div', null, 'cost-action-models');
      for (const [family, label] of families) comparison.append(el('p', label + ' ' + estimate(action.costs.scenarios.find(s => s.chainFamily === family))));
      row.append(comparison);
      const evidence = el('details', null, 'cost-evidence'); evidence.append(el('summary', 'Receipts & verification'));
      evidence.open = evidenceIds.has(action.actionId);
      evidence.append(el('p', `Receipt inclusion: ${action.costs.actual.transactionCount} known (${action.costs.actual.revertedTransactionCount} reverted); ${action.costs.actual.unresolvedAttemptCount} unknown. Admission: ${hint?.admission ?? 'UNKNOWN'} · selected effect: ${hint?.selection ?? 'UNKNOWN'} · effect: ${hint?.effect ?? 'UNKNOWN'} · bytes: ${hint?.bytes ?? 'NOT_CHECKED'}.`));
      evidence.append(el('p', `Environment ${action.context.environmentId} · principal ${action.context.principal ?? 'unknown'} · Lens ${action.context.lensId ?? 'unknown'}`));
      const list = el('ul');
      for (const attempt of action.attempts) list.append(el('li', `${attempt.phase ?? 'transaction'} · payer ${attempt.payer}${attempt.payerAddress ? ' ' + attempt.payerAddress : ''} · ${attempt.receipt?.status ?? attempt.status} · ${attempt.receipt?.gasUsed ?? 'unavailable'} gas · ${attempt.hash ?? 'hash unknown'}`));
      evidence.append(list); row.append(evidence);
      if (hint?.content && hint.bytes !== 'VERIFIED') { const label = el('label', 'Reselect original bytes to resume (tree must match)'); const input = el('input'); input.type = 'file'; input.onchange = () => onReselect(hint, input.files[0]); label.append(input); row.append(label); }
      actions.append(row);
    }
    if (focusedAction) [...actions.children].find(row => row.dataset.actionId === focusedAction)?.querySelector(focusSelector)?.focus({ preventScroll: true });
  }
  return { render };
}
