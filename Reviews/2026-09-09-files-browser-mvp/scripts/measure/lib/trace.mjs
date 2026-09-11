// Streaming debug_traceTransaction capture.
//
// A full structLogs trace of one EFS admission is hundreds of thousands of
// steps; with the stack included it is hundreds of megabytes of JSON, which
// neither the lab's 256 KiB-capped rpc() nor a single JSON.parse can carry.
// This module streams the raw JSON-RPC response byte-for-byte into a gzip
// file (the retained artifact) while scanning the `structLogs` array one
// object at a time, so the caller sees every step exactly once without the
// whole trace ever being resident in memory.
//
// Only the fields the analysis needs are kept per step (pc, op, gas, gasCost,
// depth, refund when present) plus the stack items that name storage slots
// and values. The retained .json.gz is the complete, unmodified response.
import { createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { once } from 'node:events';

const OP_INDEX = new Map();
const OP_NAMES = [];
function opId(name) {
  let id = OP_INDEX.get(name);
  if (id === undefined) { id = OP_NAMES.length; OP_NAMES.push(name); OP_INDEX.set(name, id); }
  return id;
}

/** Tracks the byte-exact JSON text and extracts each structLog object. */
class StructLogScanner {
  constructor(onEntry) {
    this.onEntry = onEntry;
    this.buffer = '';
    this.head = null;      // response text before the structLogs array
    this.tail = '';        // response text after the array
    this.phase = 'head';   // head | array | tail
    this.count = 0;
    this.decoder = new TextDecoder('utf-8');
  }
  push(chunk) {
    this.buffer += this.decoder.decode(chunk, { stream: true });
    this.drain();
  }
  end() {
    this.buffer += this.decoder.decode();
    this.drain();
    if (this.phase === 'head') {
      // No structLogs array at all (error response or empty trace).
      this.head = this.buffer; this.tail = ''; this.buffer = '';
    } else if (this.phase === 'array') {
      throw new Error('structLogs array not terminated');
    } else {
      this.tail += this.buffer; this.buffer = '';
    }
  }
  drain() {
    for (;;) {
      if (this.phase === 'head') {
        const marker = '"structLogs":[';
        const at = this.buffer.indexOf(marker);
        if (at < 0) return;
        this.head = this.buffer.slice(0, at + marker.length);
        this.buffer = this.buffer.slice(at + marker.length);
        this.phase = 'array';
      } else if (this.phase === 'array') {
        // Skip separators; detect the closing bracket of the array.
        let i = 0;
        while (i < this.buffer.length && (this.buffer[i] === ',' || this.buffer[i] === ' ' || this.buffer[i] === '\n')) i++;
        if (i >= this.buffer.length) { this.buffer = ''; return; }
        if (this.buffer[i] === ']') { this.phase = 'tail'; this.buffer = this.buffer.slice(i); continue; }
        if (this.buffer[i] !== '{') throw new Error('unexpected structLogs token ' + JSON.stringify(this.buffer.slice(i, i + 20)));
        const end = matchObject(this.buffer, i);
        if (end < 0) { this.buffer = this.buffer.slice(i); return; }
        const text = this.buffer.slice(i, end + 1);
        this.buffer = this.buffer.slice(end + 1);
        this.onEntry(JSON.parse(text), this.count++);
      } else {
        return; // tail accumulates until end()
      }
    }
  }
}

/** Index of the `}` closing the object opening at `start`, or -1 if incomplete. */
function matchObject(s, start) {
  let depth = 0, inString = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

const STORAGE_OPS = new Set(['SSTORE', 'SLOAD']);
const CALL_OPS = new Set(['CALL', 'CALLCODE', 'DELEGATECALL', 'STATICCALL', 'CREATE', 'CREATE2']);

/**
 * Trace one transaction. Writes the raw response to `gzPath` and returns the
 * compact step table plus a storage-operation list.
 *   steps: { n, pc: Uint32Array, op: Uint16Array, gas: Float64Array, gasCost: Float64Array,
 *            depth: Uint8Array, refund: Float64Array|null, opNames }
 *   storageOps: [{ i, op, depth, slot, value }]        (SSTORE value = stack[-2])
 *   callOps:    [{ i, op, depth, target }]
 *   logOps:     [{ i, op, depth, size, topics }]
 */
export async function traceTransaction(url, hash, gzPath, { withStack = true } = {}) {
  const body = JSON.stringify({
    jsonrpc: '2.0', id: 1, method: 'debug_traceTransaction',
    params: [hash, { disableStack: !withStack, disableMemory: true, disableStorage: true, enableMemory: false, enableReturnData: false }],
  });
  const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
  if (!response.ok) throw new Error('trace HTTP ' + response.status);

  const gz = createGzip({ level: 6 });
  const out = createWriteStream(gzPath);
  gz.pipe(out);

  let cap = 1 << 16;
  let pc = new Uint32Array(cap), op = new Uint16Array(cap), gas = new Float64Array(cap), gasCost = new Float64Array(cap), depth = new Uint8Array(cap);
  let refund = null, refundSeen = false;
  const storageOps = [], callOps = [], logOps = [], errors = [];
  let n = 0, rawBytes = 0;
  const grow = () => {
    cap *= 2;
    const g = (arr, T) => { const b = new T(cap); b.set(arr); return b; };
    pc = g(pc, Uint32Array); op = g(op, Uint16Array); gas = g(gas, Float64Array); gasCost = g(gasCost, Float64Array); depth = g(depth, Uint8Array);
    if (refund) refund = g(refund, Float64Array);
  };
  const scanner = new StructLogScanner((e, i) => {
    if (i >= cap) grow();
    pc[i] = e.pc; op[i] = opId(e.op); gas[i] = Number(e.gas); gasCost[i] = Number(e.gasCost); depth[i] = e.depth;
    if (e.refund !== undefined) {
      if (!refundSeen) { refundSeen = true; refund = new Float64Array(cap); }
      refund[i] = Number(e.refund);
    }
    if (e.error) errors.push({ i, error: e.error });
    const st = e.stack;
    if (STORAGE_OPS.has(e.op)) {
      const slot = st ? st[st.length - 1] : null;
      const value = e.op === 'SSTORE' && st ? st[st.length - 2] : null;
      storageOps.push({ i, op: e.op, depth: e.depth, slot: norm(slot), value: norm(value) });
    } else if (CALL_OPS.has(e.op)) {
      const target = st && (e.op === 'CREATE' || e.op === 'CREATE2') ? null : st ? norm(st[st.length - 2]) : null;
      callOps.push({ i, op: e.op, depth: e.depth, target: target ? '0x' + target.slice(-40) : null });
    } else if (/^LOG[0-4]$/.test(e.op)) {
      logOps.push({ i, op: e.op, depth: e.depth, size: st ? Number(BigInt(st[st.length - 2])) : null, topics: Number(e.op[3]) });
    }
    n = i + 1;
  });

  for await (const chunk of response.body) {
    rawBytes += chunk.length;
    if (!gz.write(chunk)) await once(gz, 'drain');
    scanner.push(chunk);
  }
  scanner.end();
  gz.end();
  await once(out, 'finish');

  let envelope;
  // `tail` begins with the `]` that closed the array, so head + tail is the response minus the entries.
  try { envelope = JSON.parse(scanner.head + scanner.tail); } catch (e) { envelope = { parseError: String(e) }; }
  if (envelope.error) throw new Error('trace RPC error: ' + JSON.stringify(envelope.error));
  const result = envelope.result ?? {};
  return {
    steps: { n, pc: pc.subarray(0, n), op: op.subarray(0, n), gas: gas.subarray(0, n), gasCost: gasCost.subarray(0, n), depth: depth.subarray(0, n), refund: refund ? refund.subarray(0, n) : null, opNames: OP_NAMES },
    storageOps, callOps, logOps, errors,
    summary: { gas: result.gas, failed: result.failed, returnValueBytes: typeof result.returnValue === 'string' ? (result.returnValue.replace(/^0x/, '').length / 2) : null, rawBytes, steps: n, hasRefundField: refundSeen },
  };
}

/** Canonical 0x-prefixed 64-hex-digit word. anvil stacks are 0x-prefixed but unpadded. */
export function norm(x) {
  if (x === null || x === undefined) return null;
  const h = String(x).replace(/^0x/, '').toLowerCase();
  return '0x' + h.padStart(64, '0');
}
