// Gas attribution from a structLogs step table.
//
// Rules this module enforces (each learned the hard way):
//  * The `gasCost` of a CALL-family step is the gas FORWARDED to the callee,
//    not consumed. Consumption is derived from `gas` deltas between steps of
//    the SAME frame; a call step's own overhead is that delta minus the gas
//    its child frame consumed.
//  * SSTORE cost is checked against the EIP-2200 + EIP-2929 model using the
//    slot's original (pre-transaction) value, its current value at the time
//    of the write, and whether the slot had already been touched.
//  * Refunds are recomputed from the SSTORE sequence (EIP-3529) and compared
//    with the node's own cumulative `refund` field.
//  * Intrinsic gas is computed from the transaction input bytes; the EIP-7623
//    floor is reported but is only applied when the hardfork is Prague+.

export const CALL_OPS = new Set(['CALL', 'CALLCODE', 'DELEGATECALL', 'STATICCALL', 'CREATE', 'CREATE2']);
const PRECOMPILE_MAX = 0x0an;

export const CATEGORY_ORDER = ['SSTORE', 'SLOAD', 'KECCAK256', 'LOG', 'CALLDATA', 'CALL_OVERHEAD', 'PRECOMPILE', 'MEMORY', 'STACK', 'CONTROL', 'ARITH', 'CODE', 'ENV', 'OTHER'];

export function categoryOf(op) {
  if (op === 'SSTORE') return 'SSTORE';
  if (op === 'SLOAD') return 'SLOAD';
  if (op === 'KECCAK256' || op === 'SHA3') return 'KECCAK256';
  if (/^LOG[0-4]$/.test(op)) return 'LOG';
  if (/^(CALLDATALOAD|CALLDATACOPY|CALLDATASIZE)$/.test(op)) return 'CALLDATA';
  if (/^(MLOAD|MSTORE|MSTORE8|MCOPY|MSIZE|RETURNDATACOPY|RETURNDATASIZE)$/.test(op)) return 'MEMORY';
  if (/^(PUSH|DUP|SWAP|POP)/.test(op)) return 'STACK';
  if (/^(JUMP|JUMPI|JUMPDEST|PC|STOP|RETURN|REVERT|INVALID)$/.test(op)) return 'CONTROL';
  if (/^(ADD|SUB|MUL|DIV|SDIV|MOD|SMOD|EXP|LT|GT|SLT|SGT|EQ|ISZERO|AND|OR|XOR|NOT|BYTE|SHL|SHR|SAR|SIGNEXTEND|ADDMOD|MULMOD)$/.test(op)) return 'ARITH';
  if (/^(CODECOPY|CODESIZE|EXTCODESIZE|EXTCODECOPY|EXTCODEHASH)$/.test(op)) return 'CODE';
  if (/^(ADDRESS|BALANCE|ORIGIN|CALLER|CALLVALUE|GASPRICE|CHAINID|SELFBALANCE|BASEFEE|BLOCKHASH|COINBASE|TIMESTAMP|NUMBER|PREVRANDAO|DIFFICULTY|GASLIMIT|GAS|BLOBHASH|BLOBBASEFEE|TLOAD|TSTORE)$/.test(op)) return 'ENV';
  return 'OTHER';
}

/** Intrinsic gas of a transaction from its input bytes. */
export function intrinsicGas(inputHex, { hardfork = 'cancun', isCreate = false, accessList = [] } = {}) {
  const hex = inputHex.replace(/^0x/, '');
  let zero = 0, nonzero = 0;
  for (let i = 0; i < hex.length; i += 2) { if (hex.slice(i, i + 2) === '00') zero++; else nonzero++; }
  const tokens = zero + 4 * nonzero;
  const accessListGas = accessList.reduce((a, e) => a + 2400 + 1900 * (e.storageKeys?.length ?? 0), 0);
  const standard = 21000 + (isCreate ? 32000 : 0) + 4 * tokens + accessListGas; // 4*zero + 16*nonzero
  const floor7623 = 21000 + 10 * tokens;
  const prague = ['prague', 'osaka'].includes(hardfork);
  return { bytes: zero + nonzero, zeroBytes: zero, nonzeroBytes: nonzero, tokens, calldataGas: 4 * tokens, standard, floor7623, floorApplies: prague, hardfork };
}

/**
 * Per-step consumption and per-frame storage context.
 * steps: compact table from trace.mjs. callTargets: Map(stepIndex -> {op, target}).
 * txTo: the transaction's `to` (storage context of depth 1).
 */
export function attributeSteps(steps, callTargets, txTo) {
  const { n, gas, gasCost, depth, op, opNames } = steps;
  const consumed = new Float64Array(n);
  const overhead = new Float64Array(n);          // call steps only
  const ctxIndex = new Uint16Array(n);           // storage-context id per step
  const contexts = [txTo.toLowerCase()];
  const ctxId = a => { const i = contexts.indexOf(a); if (i >= 0) return i; contexts.push(a); return contexts.length - 1; };
  const lastAt = [];                              // depth -> pending step index
  const ctxStack = [ctxId(txTo.toLowerCase())];  // frame stack of storage contexts
  const codeStack = [txTo.toLowerCase()];        // frame stack of code addresses
  const codeIndex = new Uint16Array(n);
  const codes = [];
  const codeId = a => { const i = codes.indexOf(a); if (i >= 0) return i; codes.push(a); return codes.length - 1; };
  codes.push(txTo.toLowerCase());
  let prevDepth = 0;
  for (let i = 0; i < n; i++) {
    const d = depth[i];
    if (i > 0 && d > prevDepth) {
      // entering a child frame created by step i-1 (step 0 is the initial frame, already on the stacks)
      const c = callTargets.get(i - 1);
      const parentCtx = ctxStack[ctxStack.length - 1];
      const target = c?.target ?? null;
      const childCtx = c && (c.op === 'DELEGATECALL' || c.op === 'CALLCODE') ? parentCtx : ctxId(target ?? 'unknown');
      ctxStack.push(childCtx);
      codeStack.push(target ?? 'unknown');
    } else if (d < prevDepth) {
      // frames at depths (d, prevDepth] have ended; their last step consumed = its own gasCost
      for (let k = prevDepth; k > d; k--) {
        if (lastAt[k] !== undefined) { consumed[lastAt[k]] = gasCost[lastAt[k]]; lastAt[k] = undefined; }
        ctxStack.pop(); codeStack.pop();
      }
    }
    if (lastAt[d] !== undefined) consumed[lastAt[d]] = gas[lastAt[d]] - gas[i];
    lastAt[d] = i;
    ctxIndex[i] = ctxStack[ctxStack.length - 1];
    codeIndex[i] = codeId(codeStack[codeStack.length - 1]);
    prevDepth = d;
  }
  for (let k = prevDepth; k >= 1; k--) if (lastAt[k] !== undefined) { consumed[lastAt[k]] = gasCost[lastAt[k]]; lastAt[k] = undefined; }
  // Call overhead = consumed at the call step minus its immediate child frame's consumption.
  for (const [i, c] of callTargets) {
    let subtree = 0;
    const d = depth[i];
    for (let j = i + 1; j < n && depth[j] > d; j++) if (depth[j] === d + 1) subtree += consumed[j];
    overhead[i] = consumed[i] - subtree;
    c.subtree = subtree; c.overhead = overhead[i];
  }
  return { consumed, overhead, ctxIndex, contexts, codeIndex, codes };
}

/** Category sums; call steps contribute their overhead only. */
export function categorize(steps, attribution, callTargets) {
  const { n, op, opNames } = steps;
  const { consumed, overhead } = attribution;
  const sums = Object.fromEntries(CATEGORY_ORDER.map(c => [c, 0]));
  const counts = Object.fromEntries(CATEGORY_ORDER.map(c => [c, 0]));
  const byOp = new Map();
  const byCode = new Map();
  for (let i = 0; i < n; i++) {
    const name = opNames[op[i]];
    const code = attribution.codes[attribution.codeIndex[i]];
    let g, cat;
    if (CALL_OPS.has(name)) {
      g = overhead[i];
      const t = callTargets.get(i)?.target;
      cat = t && BigInt(t) <= PRECOMPILE_MAX && BigInt(t) > 0n ? 'PRECOMPILE' : 'CALL_OVERHEAD';
    } else { g = consumed[i]; cat = categoryOf(name); }
    sums[cat] += g; counts[cat]++;
    const o = byOp.get(name) ?? { gas: 0, n: 0 }; o.gas += g; o.n++; byOp.set(name, o);
    const c = byCode.get(code) ?? { gas: 0, n: 0 }; c.gas += g; c.n++; byCode.set(code, c);
  }
  return { sums, counts, byOp: Object.fromEntries([...byOp.entries()].sort((a, b) => b[1].gas - a[1].gas)), byCode: Object.fromEntries([...byCode.entries()].sort((a, b) => b[1].gas - a[1].gas)) };
}

const ZERO = '0x' + '0'.repeat(64);
const isZero = v => v === ZERO || v === null || v === undefined;

/**
 * Walk SSTORE/SLOAD ops in order. originals: Map('addr:slot' -> pre-tx value).
 * Returns per-write records with the EIP-2200/2929 model cost and refund delta,
 * warm/cold access flag, and a class label; plus per-slot census.
 */
export function classifyStorage(storageOps, attribution, steps, originals) {
  const { consumed, ctxIndex, contexts } = attribution;
  const warm = new Set();
  const current = new Map();
  const writes = [];
  const reads = { total: 0, cold: 0, warmCount: 0, gas: 0, distinct: new Set() };
  let refund = 0;
  const key = o => contexts[ctxIndex[o.i]] + ':' + o.slot;
  const getCurrent = k => current.has(k) ? current.get(k) : (originals.get(k) ?? ZERO);
  for (const o of storageOps) {
    const k = key(o);
    const wasWarm = warm.has(k);
    warm.add(k);
    if (o.op === 'SLOAD') {
      reads.total++; reads.gas += consumed[o.i]; reads.distinct.add(k);
      if (wasWarm) reads.warmCount++; else reads.cold++;
      continue;
    }
    if (!originals.has(k)) throw new Error('no original value for ' + k);
    const original = originals.get(k), cur = getCurrent(k), value = o.value;
    // EIP-2200 + 2929 cost model
    let model = wasWarm ? 0 : 2100;
    if (value === cur) model += 100;
    else if (cur === original) model += isZero(original) ? 20000 : 2900;
    else model += 100;
    // EIP-3529 refund model
    let delta = 0;
    if (value !== cur) {
      if (cur === original) {
        if (!isZero(original) && isZero(value)) delta += 4800;
      } else {
        if (!isZero(original)) { if (isZero(cur)) delta -= 4800; else if (isZero(value)) delta += 4800; }
        if (original === value) delta += isZero(original) ? 19900 : 2800;
      }
    }
    refund += delta;
    let cls;
    if (value === cur) cls = 'NOOP';
    else if (isZero(value)) cls = 'CLEAR';
    else if (value === original) cls = 'RESTORE';
    else if (cur === original) cls = isZero(original) ? 'FRESH' : 'COLD_REWRITE';
    else cls = 'WARM_REWRITE';
    writes.push({ i: o.i, depth: o.depth, address: contexts[ctxIndex[o.i]], slot: o.slot, original, before: cur, value, warmAtWrite: wasWarm, gas: consumed[o.i], model, modelMatch: consumed[o.i] === model, refundDelta: delta, class: cls });
    current.set(k, value);
  }
  // Per-slot census
  const slots = new Map();
  for (const w of writes) {
    const k = w.address + ':' + w.slot;
    const s = slots.get(k) ?? { address: w.address, slot: w.slot, original: w.original, final: null, writes: 0, gas: 0, classes: [] };
    s.final = w.value; s.writes++; s.gas += w.gas; s.classes.push(w.class); slots.set(k, s);
  }
  for (const s of slots.values()) {
    s.finalClass = isZero(s.original) ? (isZero(s.final) ? 'UNCHANGED_ZERO' : 'FRESH') : isZero(s.final) ? 'CLEARED' : s.final === s.original ? 'UNCHANGED' : 'REWRITE';
  }
  const byClass = {};
  for (const w of writes) byClass[w.class] = (byClass[w.class] ?? 0) + 1;
  const bySlotClass = {};
  for (const s of slots.values()) bySlotClass[s.finalClass] = (bySlotClass[s.finalClass] ?? 0) + 1;
  const gasByClass = {};
  for (const w of writes) gasByClass[w.class] = (gasByClass[w.class] ?? 0) + w.gas;
  return {
    writes, slots: [...slots.values()], refundModel: refund,
    reads: { ops: reads.total, coldOps: reads.cold, warmOps: reads.warmCount, distinctSlots: reads.distinct.size, gas: reads.gas },
    summary: { sstoreOps: writes.length, distinctSlotsWritten: slots.size, writesByClass: byClass, gasByClass, slotsByFinalClass: bySlotClass, modelMismatches: writes.filter(w => !w.modelMatch).length },
  };
}
