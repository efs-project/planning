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
export function createEconomicsPanel(host, { onModel, onExport, onReset, onReconcile, onReselect }) {
  const summary = el('summary', 'Gas & cost'), note = el('p', 'Actual local-chain receipt costs below. Alternatives are MANUAL MODELS, not live quotes or additive spending. Reads use RPC work, not paid gas.');
  const diagnostics = el('p', '', 'basis'), actions = el('div'), models = el('div'), form = el('form');
  form.className = 'cost-model';
  const fields = {};
  for (const [name, label, initial] of [['family', 'Scenario', ''], ['gasPrice', 'Gas price (gwei)', ''], ['l1Fee', 'Flat DA ETH / transaction (blank = unavailable)', ''], ['operatorFee', 'Flat operator ETH / transaction (blank = unavailable)', ''], ['fx', 'Manual USD / ETH (blank = unavailable)', '']]) {
    const labelNode = el('label', label), input = el(name === 'family' ? 'select' : 'input'); input.name = name; input.value = initial;
    if (name === 'family') for (const [value, label] of [['ethereum', 'Ethereum'], ['optimism', 'OP'], ['base', 'Base'], ['arbitrum', 'Arbitrum (separate execution + DA)']]) { const option = el('option', label); option.value = value; input.append(option); }
    else { input.type = 'text'; input.inputMode = 'decimal'; }
    labelNode.append(input); fields[name] = input; form.append(labelNode);
  }
  const pin = el('button', 'Pin manual model snapshot'); pin.type = 'submit'; form.append(pin);
  const error = el('p'); error.setAttribute('role', 'alert'); form.append(error);
  form.addEventListener('submit', async e => { e.preventDefault(); try { await onModel(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.value]))); error.textContent = ''; } catch (e) { error.textContent = e.message; } });
  const controls = el('div');
  for (const [label, callback] of [['Export public cost journal', onExport], ['Hide resolved costs', onReset], ['Reconcile recorded actions (read only)', onReconcile]]) { const b = el('button', label); b.type = 'button'; b.onclick = callback; controls.append(b); }
  host.append(summary, note, form, models, diagnostics, controls, actions);
  return { render(ledger, recovery, metrics, options = {}) {
    const view = panelView(ledger, options); summary.textContent = view.summary;
    diagnostics.textContent = metrics ? `Read transport: ${metrics.logicalCalls} logical RPC calls · ${metrics.httpBatches} HTTP batches · ${metrics.requestBytes} request bytes · ${metrics.responseBytes} response bytes (measured transport bytes, not gas).` : 'Read transport measurements unavailable.';
    models.replaceChildren();
    for (const family of ['ethereum', 'optimism', 'base', 'arbitrum']) {
      const model = view.scenarios.find(s => s.chainFamily === family);
      models.append(el('p', model ? `${family} MANUAL MODEL · ${costText(model)} · ${model.snapshot.capturedAt} · ${model.assumptions}` : `${family} MANUAL MODEL · unavailable — pin assumptions above.`));
    }
    const openIds = new Set([...actions.querySelectorAll('details[open]')].map(n => n.dataset.actionId)); actions.replaceChildren();
    for (const action of view.actions) {
      const row = el('details'); row.dataset.actionId = action.actionId; row.open = openIds.has(action.actionId);
      row.append(el('summary', `${action.label} · ${action.costs.actual.executionGasUsed} gas · ${costText(action.costs.actual)}`));
      const hint = recovery.find(r => r.actionId === action.actionId);
      row.append(el('p', `Receipt inclusion: ${action.costs.actual.transactionCount} known (${action.costs.actual.revertedTransactionCount} reverted); ${action.costs.actual.unresolvedAttemptCount} unknown. Admission: ${hint?.admission ?? 'UNKNOWN'} · selected effect: ${hint?.selection ?? 'UNKNOWN'} · effect: ${hint?.effect ?? 'UNKNOWN'} · bytes: ${hint?.bytes ?? 'NOT_CHECKED'}.`));
      row.append(el('p', `Environment ${action.context.environmentId} · principal ${action.context.principal ?? 'unknown'} · Lens ${action.context.lensId ?? 'unknown'}`, 'basis'));
      for (const model of action.costs.scenarios) row.append(el('p', `${model.chainFamily} MANUAL MODEL · ${costText(model)} · ${model.snapshot.capturedAt}`));
      const list = el('ul');
      for (const attempt of action.attempts) list.append(el('li', `${attempt.phase ?? 'transaction'} · payer ${attempt.payer}${attempt.payerAddress ? ' ' + attempt.payerAddress : ''} · ${attempt.receipt?.status ?? attempt.status} · ${attempt.receipt?.gasUsed ?? 'unavailable'} gas · ${attempt.hash ?? 'hash unknown'}`));
      row.append(list);
      if (hint?.content && hint.bytes !== 'VERIFIED') { const label = el('label', 'Reselect original bytes to resume (tree must match)'); const input = el('input'); input.type = 'file'; input.onchange = () => onReselect(hint, input.files[0]); label.append(input); row.append(label); }
      actions.append(row);
    }
  } };
}
