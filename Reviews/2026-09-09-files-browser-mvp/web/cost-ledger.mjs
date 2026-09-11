/**
 * Pure public cost journal, version 1. All quantities are decimal strings;
 * callers normalize RPC hex values before ingestion. No clock, I/O or authority.
 *
 * createLedger({sessionId, createdAt}) -> JSON-safe state. reduceLedger returns a
 * new state; caller supplies stable IDs/timestamps and persists before broadcast.
 * Event contract:
 * - action/start: actionId, label, createdAt, context {environmentId, chainId,
 *   core?, executionId?, principal?, account?, mountId?, lensId?, sourceId?,
 *   destinationId?}. environmentId must distinguish independent Anvil runs,
 *   even when chainId/Core addresses match. Context is immutable.
 * - attempt/upsert: actionId, attemptId, phase?, status (unknown | submitted |
 *   not-submitted), hash?, payer (user | sponsor | other | unknown), payerAddress?
 *   Stable attempt IDs represent broadcasts, not polls. Unknown means unresolved;
 *   not-submitted is caller-proven prebroadcast refusal, never inferred.
 * - receipt/record: actionId, attemptId, receipt {hash, status: success | reverted,
 *   chainFamily: ethereum | optimism | base | arbitrum, gasUsed?,
 *   effectiveGasPrice?, l1FeeWei?, operatorFeeWei?, arbitrumMode?}, fxSnapshotId?
 *   Missing numeric values mean unknown. Fee components also accept the explicit
 *   string 'not-applicable'; '0' is known zero. Arbitrum requires included-l1
 *   (gasUsed * effectiveGasPrice already includes posting) or separate-execution
 *   (execution-only gas + l1FeeWei). No implicit rollup operator/L1 zeroes.
 *   Known facts cannot be overwritten; later polls can fill unknown fields.
 * - action/effect: actionId, status: unknown | verified | refused | partial.
 *   Receipt success never asserts effect success. Consumer independently verifies.
 * - fx/add: snapshot {id, capturedAt, source, usdPerEth} (decimal USD/ETH).
 * - fee/add: snapshot {id, capturedAt, source, chainFamily,
 *   executionGasPriceWei?, l1FeeWei?, operatorFeeWei?, arbitrumMode?}.
 *   Snapshots immutable. Fee snapshots are MANUAL MODEL assumptions: observed
 *   receipt gas reused as a proxy, flat L1/operator wei per transaction. They are
 *   alternatives, NOT additive actual spending or exact foreign-chain quotes.
 * - display/reset: hides only fully resolved actions, never deletes any journal.
 *
 * Selectors take {scenarioSnapshotIds?: [], fxSnapshotId?, includeHidden?: false}.
 * Return {actual, scenarios}; scenario rows include immutable provenance/model
 * labels. Costs include knownTotalWei, totalWei (null if incomplete), knownEth,
 * totalUsd, knownUsd, missingFxCount, missingComponentCount,
 * unresolvedAttemptCount, transactionCount, revertedTransactionCount,
 * executionGasUsed (known gas subtotal; may include L1 on Arbitrum),
 * executionFeeWei (known gas-price product subtotal), and payer subtotals.
 * Session selection deduplicates by environmentId + hash across action IDs.
 * exportLedger -> sanitized JSON string; restoreLedger(string | object) validates
 * and strips unrecognized fields. Never store content, keys, or signatures here.
 * This journal is untrusted display/recovery evidence, never authorization proof.
 */

const FAMILIES = ['ethereum', 'optimism', 'base', 'arbitrum'];
const PAYERS = ['user', 'sponsor', 'other', 'unknown'];
const EFFECTS = ['unknown', 'verified', 'refused', 'partial'];
const MODES = ['included-l1', 'separate-execution'];
const CONTEXT_FIELDS = ['core', 'executionId', 'principal', 'account', 'mountId', 'lensId', 'sourceId', 'destinationId'];
const clone = value => JSON.parse(JSON.stringify(value));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function object(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`Invalid ${name}`);
  return value;
}
function string(value, name) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048) throw new Error(`Invalid ${name}`);
  return value;
}
function choice(value, values, name) {
  if (!values.includes(value)) throw new Error(`Invalid ${name}`);
  return value;
}
function date(value) {
  string(value, 'timestamp');
  if (!/^\d{4}-\d\d-\d\dT/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error('Invalid timestamp');
  return value;
}
function decimal(value, name, fractional = false) {
  const pattern = fractional ? /^(0|[1-9]\d*)(\.\d+)?$/ : /^(0|[1-9]\d*)$/;
  if (typeof value !== 'string' || value.length > 100 || !pattern.test(value)) throw new Error(`Invalid decimal ${name}`);
  return value;
}
function quantity(value, name) { return value == null ? null : decimal(value, name); }
function component(value, name) { return value === 'not-applicable' ? value : quantity(value, name); }
function txHash(value) {
  if (typeof value !== 'string' || !/^0x[\da-f]{64}$/i.test(value)) throw new Error('Invalid transaction hash');
  return value.toLowerCase();
}
function address(value) {
  if (typeof value !== 'string' || !/^0x[\da-f]{40}$/i.test(value)) throw new Error('Invalid payer address');
  return value.toLowerCase();
}
function context(value) {
  object(value, 'context');
  const result = { environmentId: string(value.environmentId, 'environmentId'), chainId: decimal(value.chainId, 'chainId') };
  for (const field of CONTEXT_FIELDS) if (value[field] != null) result[field] = string(value[field], field);
  return result;
}
function fees(value) {
  return {
    chainFamily: choice(value.chainFamily, FAMILIES, 'chainFamily'),
    l1FeeWei: component(value.l1FeeWei, 'l1FeeWei'),
    operatorFeeWei: component(value.operatorFeeWei, 'operatorFeeWei'),
    arbitrumMode: value.arbitrumMode == null ? null : choice(value.arbitrumMode, MODES, 'arbitrumMode'),
  };
}
function receipt(value) {
  object(value, 'receipt');
  return { hash: txHash(value.hash), status: choice(value.status, ['success', 'reverted'], 'receipt status'),
    gasUsed: quantity(value.gasUsed, 'gasUsed'), effectiveGasPrice: quantity(value.effectiveGasPrice, 'effectiveGasPrice'), ...fees(value) };
}
function snapshot(value, kind) {
  object(value, 'snapshot');
  const result = { id: string(value.id, 'snapshot ID'), capturedAt: date(value.capturedAt), source: string(value.source, 'snapshot source') };
  if (kind === 'fx') result.usdPerEth = decimal(value.usdPerEth, 'usdPerEth', true);
  else Object.assign(result, { executionGasPriceWei: quantity(value.executionGasPriceWei, 'executionGasPriceWei'), ...fees(value) });
  return result;
}
function mergeFacts(old, next) {
  const merged = { ...old };
  for (const [key, value] of Object.entries(next)) {
    if (value == null) continue;
    if (old[key] != null && old[key] !== value) throw new Error(`Conflicting receipt ${key}`);
    merged[key] = value;
  }
  return merged;
}
const receiptKey = (action, hash) => JSON.stringify([action.context.environmentId, hash]);
function checkPayer(ledger, action, candidate) {
  if (!candidate.hash) return;
  const key = receiptKey(action, candidate.hash);
  for (const other of ledger.actions) for (const prior of other.attempts) {
    if (!prior.hash || receiptKey(other, prior.hash) !== key) continue;
    if (candidate.payer !== 'unknown' && prior.payer !== 'unknown' && candidate.payer !== prior.payer) throw new Error('Conflicting transaction payer');
    if (candidate.payerAddress && prior.payerAddress && candidate.payerAddress !== prior.payerAddress) throw new Error('Conflicting transaction payer address');
  }
}

export function createLedger({ sessionId, createdAt }) {
  return { version: 1, sessionId: string(sessionId, 'sessionId'), createdAt: date(createdAt), actions: [], feeSnapshots: [], fxSnapshots: [], hiddenActionIds: [] };
}

export function reduceLedger(ledger, event) {
  if (ledger?.version !== 1) throw new Error('Unsupported ledger version');
  object(event, 'event');
  const next = clone(ledger);
  if (event.type === 'fee/add' || event.type === 'fx/add') {
    const kind = event.type === 'fx/add' ? 'fx' : 'fee';
    const value = snapshot(event.snapshot, kind);
    const list = next[`${kind}Snapshots`];
    const prior = list.find(item => item.id === value.id);
    if (prior && !same(prior, value)) throw new Error('Snapshot is immutable');
    if (!prior) list.push(value);
    return next;
  }
  if (event.type === 'display/reset') {
    next.hiddenActionIds = next.actions.filter(action => {
      const costs = selectActionCosts(next, action.actionId).actual;
      return ['verified', 'refused'].includes(action.effectStatus) && costs.unresolvedAttemptCount === 0 && costs.missingComponentCount === 0;
    }).map(action => action.actionId);
    return next;
  }
  const actionId = string(event.actionId, 'actionId');
  let action = next.actions.find(item => item.actionId === actionId);
  if (event.type === 'action/start') {
    const identity = { actionId, label: string(event.label, 'label'), createdAt: date(event.createdAt), context: context(event.context) };
    if (action && Object.keys(identity).some(key => !same(action[key], identity[key]))) throw new Error('Action identity is immutable');
    if (!action) next.actions.push({ ...identity, effectStatus: 'unknown', attempts: [] });
    return next;
  }
  if (!action) throw new Error('Unknown actionId');
  // Reopened uncertainty must be visible even after a prior display reset.
  next.hiddenActionIds = next.hiddenActionIds.filter(id => id !== actionId);
  if (event.type === 'action/effect') {
    action.effectStatus = choice(event.status, EFFECTS, 'effect status');
    return next;
  }
  if (!['attempt/upsert', 'receipt/record'].includes(event.type)) throw new Error('Unknown event type');
  const attemptId = string(event.attemptId, 'attemptId');
  let attempt = action.attempts.find(item => item.attemptId === attemptId);
  if (event.type === 'attempt/upsert') {
    const value = { attemptId, phase: event.phase == null ? null : string(event.phase, 'phase'),
      status: choice(event.status, ['unknown', 'submitted', 'not-submitted'], 'attempt status'),
      hash: event.hash == null ? null : txHash(event.hash), payer: choice(event.payer ?? 'unknown', PAYERS, 'payer'),
      payerAddress: event.payerAddress == null ? null : address(event.payerAddress) };
    if (value.status === 'not-submitted' && (value.hash || attempt?.hash)) throw new Error('Broadcast hash conflicts with not-submitted');
    if (attempt) {
      for (const field of ['hash', 'phase', 'payerAddress']) {
        if (attempt[field] != null && value[field] != null && attempt[field] !== value[field]) throw new Error(`Attempt ${field} is immutable`);
        value[field] ??= attempt[field];
      }
      if (attempt.payer !== 'unknown' && value.payer !== 'unknown' && attempt.payer !== value.payer) throw new Error('Attempt payer is immutable');
      if (value.payer === 'unknown') value.payer = attempt.payer;
      if (attempt.status === 'not-submitted' && value.status !== 'not-submitted') throw new Error('Refused attempt is immutable; use a new attemptId');
      if (attempt.status === 'submitted' && value.status === 'unknown') value.status = 'submitted';
      checkPayer(next, action, value);
      Object.assign(attempt, value);
    } else {
      checkPayer(next, action, value);
      action.attempts.push({ ...value, receipt: null, fxSnapshotId: null });
    }
    return next;
  }
  if (!attempt) throw new Error('Unknown attemptId');
  if (attempt.status === 'not-submitted') throw new Error('Receipt conflicts with not-submitted');
  let value = receipt(event.receipt);
  if (attempt.hash && attempt.hash !== value.hash) throw new Error('Attempt hash is immutable');
  checkPayer(next, action, { ...attempt, hash: value.hash });
  const key = receiptKey(action, value.hash);
  for (const other of next.actions) for (const prior of other.attempts) {
    if (prior.receipt && receiptKey(other, prior.receipt.hash) === key) value = mergeFacts(prior.receipt, value);
  }
  let fxId = event.fxSnapshotId ?? attempt.fxSnapshotId;
  if (fxId != null && !next.fxSnapshots.some(item => item.id === fxId)) throw new Error('Unknown FX snapshot');
  if (attempt.fxSnapshotId && attempt.fxSnapshotId !== fxId) throw new Error('Receipt FX snapshot is immutable');
  for (const other of next.actions) for (const prior of other.attempts) {
    if (prior.receipt && receiptKey(other, prior.receipt.hash) === key && prior.fxSnapshotId) {
      if (fxId != null && fxId !== prior.fxSnapshotId) throw new Error('Transaction FX snapshot is immutable');
      fxId = prior.fxSnapshotId;
    }
  }
  for (const other of next.actions) for (const prior of other.attempts) {
    if (prior.receipt && receiptKey(other, prior.receipt.hash) === key) {
      prior.receipt = { ...value };
      prior.fxSnapshotId = fxId ?? null;
    }
  }
  Object.assign(attempt, { hash: value.hash, status: 'submitted', receipt: value, fxSnapshotId: fxId ?? null });
  return next;
}

function scaled(value, places) {
  const padded = value.toString().padStart(places + 1, '0');
  if (!places) return padded;
  return `${padded.slice(0, -places)}.${padded.slice(-places)}`.replace(/\.?0+$/, '');
}
function usd(wei, rate) {
  const [whole, fraction = ''] = rate.split('.');
  return { units: wei * BigInt(whole + fraction), places: 18 + fraction.length };
}
function addDecimal(a, b) {
  const places = Math.max(a.places, b.places);
  return { units: a.units * 10n ** BigInt(places - a.places) + b.units * 10n ** BigInt(places - b.places), places };
}
function transactionCosts(value, model) {
  const schedule = model ?? value;
  const price = model ? model.executionGasPriceWei : value.effectiveGasPrice;
  const execution = value.gasUsed == null || price == null ? null : BigInt(value.gasUsed) * BigInt(price);
  const parts = [execution];
  const fee = v => v === 'not-applicable' ? 0n : v == null ? null : BigInt(v);
  if (['optimism', 'base'].includes(schedule.chainFamily)) parts.push(fee(schedule.l1FeeWei), fee(schedule.operatorFeeWei));
  if (schedule.chainFamily === 'arbitrum') {
    if (schedule.arbitrumMode === 'separate-execution') parts.push(fee(schedule.l1FeeWei));
    else if (schedule.arbitrumMode !== 'included-l1') parts.push(null);
  }
  return { known: parts.reduce((sum, part) => sum + (part ?? 0n), 0n), missing: parts.filter(part => part == null).length, execution: execution ?? 0n };
}

function collect(ledger, actions) {
  const allReceipts = new Map();
  const allPayers = new Map();
  const allFx = new Map();
  for (const action of ledger.actions) for (const attempt of action.attempts) {
    if (attempt.receipt) allReceipts.set(receiptKey(action, attempt.receipt.hash), attempt.receipt);
    if (attempt.hash && attempt.payer !== 'unknown') allPayers.set(receiptKey(action, attempt.hash), attempt.payer);
    if (attempt.hash && attempt.fxSnapshotId) allFx.set(receiptKey(action, attempt.hash), attempt.fxSnapshotId);
  }
  const transactions = new Map();
  const unknown = new Map();
  for (const action of actions) for (const attempt of action.attempts) {
    if (attempt.status === 'not-submitted') continue;
    const key = attempt.hash ? receiptKey(action, attempt.hash) : JSON.stringify(['attempt', action.actionId, attempt.attemptId]);
    const value = allReceipts.get(key);
    const payer = allPayers.get(key) ?? attempt.payer;
    if (!value) { unknown.set(key, payer); continue; }
    if (!transactions.has(key)) transactions.set(key, { receipt: value, payer, fxSnapshotId: allFx.get(key) ?? null });
  }
  return { transactions: [...transactions.values()], unresolved: unknown.size, unresolvedPayers: [...unknown.values()] };
}
function aggregate(ledger, collected, options, model) {
  let known = 0n, gas = 0n, execution = 0n, missing = 0, missingFx = 0, reverted = 0;
  let dollars = { units: 0n, places: 0 };
  const payerValues = Object.fromEntries(PAYERS.map(payer => [payer, { known: 0n, missing: 0, transactionCount: 0 }]));
  for (const transaction of collected.transactions) {
    const costs = transactionCosts(transaction.receipt, model);
    known += costs.known; missing += costs.missing; execution += costs.execution;
    gas += BigInt(transaction.receipt.gasUsed ?? '0');
    if (transaction.receipt.status === 'reverted') reverted++;
    const payer = payerValues[transaction.payer];
    payer.known += costs.known; payer.missing += costs.missing; payer.transactionCount++;
    const fxId = options.fxSnapshotId ?? transaction.fxSnapshotId;
    const fx = ledger.fxSnapshots.find(item => item.id === fxId);
    if (fx) dollars = addDecimal(dollars, usd(costs.known, fx.usdPerEth));
    else missingFx++;
  }
  const complete = missing === 0 && collected.unresolved === 0;
  return {
    knownTotalWei: known.toString(), totalWei: complete ? known.toString() : null,
    knownEth: scaled(known, 18), knownUsd: missingFx ? null : scaled(dollars.units, dollars.places),
    totalUsd: complete && !missingFx ? scaled(dollars.units, dollars.places) : null,
    missingFxCount: missingFx, missingComponentCount: missing, unresolvedAttemptCount: collected.unresolved,
    transactionCount: collected.transactions.length, revertedTransactionCount: reverted,
    executionGasUsed: gas.toString(), executionFeeWei: execution.toString(),
    payers: Object.fromEntries(PAYERS.map(name => [name, { knownTotalWei: payerValues[name].known.toString(), missingComponentCount: payerValues[name].missing, transactionCount: payerValues[name].transactionCount, unresolvedAttemptCount: collected.unresolvedPayers.filter(payer => payer === name).length }])),
  };
}
function select(ledger, actions, options) {
  if (options.fxSnapshotId != null && !ledger.fxSnapshots.some(item => item.id === options.fxSnapshotId)) throw new Error('Unknown FX snapshot');
  const collected = collect(ledger, actions);
  return { actual: aggregate(ledger, collected, options, null), scenarios: (options.scenarioSnapshotIds ?? []).map(id => {
    const model = ledger.feeSnapshots.find(item => item.id === id);
    if (!model) throw new Error('Unknown fee snapshot');
    return { ...aggregate(ledger, collected, options, model), snapshotId: id, chainFamily: model.chainFamily,
      label: 'MANUAL MODEL', assumptions: 'Observed gas proxy; flat L1/operator fee per transaction; alternative, not an exact chain quote.',
      snapshot: clone(model) };
  }) };
}
export function selectActionCosts(ledger, actionId, options = {}) {
  const action = ledger.actions.find(item => item.actionId === actionId);
  if (!action) throw new Error('Unknown actionId');
  return select(ledger, [action], options);
}
export function selectSessionCosts(ledger, options = {}) {
  return select(ledger, ledger.actions.filter(action => options.includeHidden || !ledger.hiddenActionIds.includes(action.actionId)), options);
}

export function restoreLedger(serialized) {
  const input = typeof serialized === 'string' ? JSON.parse(serialized) : object(serialized, 'ledger');
  if (input.version !== 1) throw new Error('Unsupported ledger version');
  let result = createLedger(input);
  for (const name of ['feeSnapshots', 'fxSnapshots', 'actions', 'hiddenActionIds']) if (!Array.isArray(input[name])) throw new Error(`Invalid ${name}`);
  for (const value of input.feeSnapshots) result = reduceLedger(result, { type: 'fee/add', snapshot: value });
  for (const value of input.fxSnapshots) result = reduceLedger(result, { type: 'fx/add', snapshot: value });
  const seen = new Set();
  for (const action of input.actions) {
    object(action, 'action');
    if (seen.has(action.actionId)) throw new Error('Duplicate actionId');
    seen.add(action.actionId);
    result = reduceLedger(result, { ...action, type: 'action/start' });
    if (!Array.isArray(action.attempts)) throw new Error('Invalid attempts');
    const attempts = new Set();
    for (const attempt of action.attempts) {
      object(attempt, 'attempt');
      if (attempts.has(attempt.attemptId)) throw new Error('Duplicate attemptId');
      attempts.add(attempt.attemptId);
      result = reduceLedger(result, { ...attempt, actionId: action.actionId, type: 'attempt/upsert' });
      if (attempt.receipt != null) result = reduceLedger(result, { ...attempt, actionId: action.actionId, type: 'receipt/record' });
      else if (attempt.fxSnapshotId != null) throw new Error('FX snapshot without receipt');
    }
    result = reduceLedger(result, { type: 'action/effect', actionId: action.actionId, status: action.effectStatus });
  }
  for (const id of input.hiddenActionIds) {
    if (!seen.has(id) || result.hiddenActionIds.includes(id)) throw new Error('Invalid hidden actionId');
    const action = result.actions.find(item => item.actionId === id);
    const cost = selectActionCosts(result, id).actual;
    if (!['verified', 'refused'].includes(action.effectStatus) || cost.unresolvedAttemptCount || cost.missingComponentCount) throw new Error('Cannot hide unresolved action');
    result.hiddenActionIds.push(id);
  }
  return result;
}
export function exportLedger(ledger) { return JSON.stringify(restoreLedger(ledger)); }

/**
 * Dated, editable scenario defaults, not current quotes or actual spending.
 * Kept in this already-served module so the local prototype needs no server or
 * chain restart. Provenance lives in schema-v1 source strings and survives export.
 * The sampled gas price and the illustrative posting/operator assumptions are
 * different evidence classes; neither establishes a foreign-chain EFS receipt.
 */
const PRESET_ASSUMPTIONS = 'Anvil receipt gas is an execution-only proxy. Rollup L1 posting: ILLUSTRATIVE, uncalibrated flat 0.000001 ETH per transaction, not an observed, conservative or exact fee. Operator fees: excluded (model input 0), not observed free. Alternatives, not additive spending or live quotes.';

export const COST_PRESET = Object.freeze({
  id: 'cost-preset-2026-09-11',
  label: 'Dated estimates · 11 Sep 2026',
  capturedAt: '2026-09-11T21:15:55.303Z',
  assumptions: PRESET_ASSUMPTIONS,
  fxSnapshot: Object.freeze({
    id: 'cost-preset-2026-09-11:eth-usd',
    capturedAt: '2026-09-11T21:14:11Z',
    source: 'Web finance tool ETH/USD market observation at 2026-09-11T21:14:11Z; upstream vendor/public quote URL not supplied',
    usdPerEth: '2537.34',
  }),
  feeSnapshots: Object.freeze([
    Object.freeze({
      id: 'cost-preset-2026-09-11:ethereum',
      capturedAt: '2026-09-11T21:15:55.303Z',
      chainFamily: 'ethereum',
      executionGasPriceWei: '55176333',
      l1FeeWei: 'not-applicable',
      operatorFeeWei: 'not-applicable',
      source: 'eth_gasPrice: 55176333 wei/gas (0.055176333 gwei), sampled 2026-09-11T21:15:55.303Z from https://ethereum-rpc.publicnode.com; chainId 1; accompanying latest block 25956788, block time 2026-09-11T21:15:47Z. Sample is not a block-pinned quote. Execution price applied to Anvil receipt gas as a model, not measured Ethereum EFS cost.',
    }),
    Object.freeze({
      id: 'cost-preset-2026-09-11:optimism',
      capturedAt: '2026-09-11T21:15:23.450Z',
      chainFamily: 'optimism',
      executionGasPriceWei: '1000499',
      l1FeeWei: '1000000000000',
      operatorFeeWei: '0',
      source: `eth_gasPrice: 1000499 wei/gas (0.001000499 gwei), sampled 2026-09-11T21:15:23.450Z from https://mainnet.optimism.io; chainId 10; accompanying latest block 156781273, block time 2026-09-11T21:15:23Z. Sample is not a block-pinned quote. ${PRESET_ASSUMPTIONS}`,
    }),
    Object.freeze({
      id: 'cost-preset-2026-09-11:base',
      capturedAt: '2026-09-11T21:15:23.465Z',
      chainFamily: 'base',
      executionGasPriceWei: '6000000',
      l1FeeWei: '1000000000000',
      operatorFeeWei: '0',
      source: `eth_gasPrice: 6000000 wei/gas (0.006 gwei), sampled 2026-09-11T21:15:23.465Z from https://mainnet.base.org; chainId 8453; accompanying latest block 51185988, block time 2026-09-11T21:15:23Z. Sample is not a block-pinned quote. ${PRESET_ASSUMPTIONS}`,
    }),
    Object.freeze({
      id: 'cost-preset-2026-09-11:arbitrum',
      capturedAt: '2026-09-11T21:15:37.814Z',
      chainFamily: 'arbitrum',
      executionGasPriceWei: '20020000',
      l1FeeWei: '1000000000000',
      operatorFeeWei: '0',
      arbitrumMode: 'separate-execution',
      source: `eth_gasPrice: 20020000 wei/gas (0.02002 gwei), sampled 2026-09-11T21:15:37.814Z from https://arb1.arbitrum.io/rpc; chainId 42161; accompanying latest block 504176093, block time 2026-09-11T21:15:37Z. Sample is not a block-pinned quote. Arbitrum separate-execution mode: Anvil gas excludes the posting component, so add the illustrative posting amount once. ${PRESET_ASSUMPTIONS}`,
    }),
  ]),
});

/**
 * Add defaults only for absent fee families and an absent FX collection.
 * Accepts a valid createLedger/restoreLedger state; never replaces snapshots,
 * reattributes historical receipt FX, or discards hidden or visible history.
 * Caller persists the returned ledger only when changed is true.
 */
export function seedCostDefaults(ledger) {
  let next = ledger;
  for (const snapshot of COST_PRESET.feeSnapshots) {
    if (!next.feeSnapshots.some(existing => existing.chainFamily === snapshot.chainFamily)) {
      next = reduceLedger(next, { type: 'fee/add', snapshot });
    }
  }
  if (next.fxSnapshots.length === 0) next = reduceLedger(next, { type: 'fx/add', snapshot: COST_PRESET.fxSnapshot });
  return { ledger: next, changed: next !== ledger };
}
