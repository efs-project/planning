// Independent source-observed consumer. No producer fold/encoding/root helpers.
import assert from 'node:assert/strict';
import { AbiCoder, TypedDataEncoder, Transaction, keccak256, ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { parseGroup } from '../../2026-09-05-mvp-build-start/type-inputs/parser.mjs';
import { verifyCache } from '../../2026-09-05-c0-admission/reader.mjs';
import { decodeBody } from './record-body.mjs';

const abi = AbiCoder.defaultAbiCoder(), Z = ZeroHash;
const b = x => Buffer.from(x.replace(/^0x/, ''), 'hex');
const h = x => b(keccak256(x));
const w = x => b('0x' + BigInt(x).toString(16).padStart(64, '0'));
const D = s => h(Buffer.from(s));
const hash = (...parts) => keccak256(Buffer.concat(parts));
const M48 = (1n << 48n) - 1n, M64 = (1n << 64n) - 1n;
export const HEADER = 'tuple(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter)';
export const ordinaryRecord = (type, body) => hash(D('efs2/record/1'), b(type), h(b(body)));
export const ordinaryOccurrence = (env, leaf) => hash(D('efs2/occurrence/1'), b(env), w(leaf));
export function ordinaryEnvelope(header, recordIds) {
  const types = { PublicationEnvelope: ['uint16 profile', 'bytes32 principalId', 'bytes32 authorityRef', 'uint64 authEpoch', 'bytes32 pubNonce', 'uint64 notAfter', 'bytes32[] recordIds'].map(x => { const [type, name] = x.split(' '); return { type, name }; }) };
  const value = Object.fromEntries(types.PublicationEnvelope.slice(0, 6).map((f, i) => [f.name, header[f.name] ?? header[i]]));
  return hash(D('efs2/envelope/1'), b(TypedDataEncoder.hash({ name: 'EFS2-Envelope', version: '1' }, types, { ...value, recordIds })));
}
const pk = (type, kind, ordinal, value) => hash(D('efs2/pk/1'), b(type), w(kind), w(ordinal), b(value));
const occValue = (env, leaf) => hash(D('efs2/vk/occ/1'), b(env), w(leaf));
const source = e => e.envelopeId + ':' + e.leaf;
function effect(e, ids) {
  const f = e.fields, option = x => x.startsWith('0x01');
  const ref = x => ({ envelopeId: '0x' + x.slice(0, 64), leaf: Number.parseInt(x.slice(64, 68), 16) });
  if (e.typeId === ids.withdrawal) return { kind: 3, ...ref(f[0].slice(2)) };
  if (e.typeId !== ids.set && e.typeId !== ids.tombstone) return { kind: 0 };
  const set = e.typeId === ids.set;
  const pos = hash(D('efs2/position/1'), ...f.slice(0, 3).map(b));
  const key = hash(D('efs2/binding/1'), b(e.principal), b(pos));
  const scope = hash(D('efs2/vk/binding-scope/1'), b(e.principal), b(f[0]), b(f[1]));
  const pred = f[set ? 5 : 3];
  const out = { kind: set ? 1 : 2, key, scope, predecessor: option(pred) ? ref(pred.slice(4)) : null, targetKind: 0, target: Z, targetLeaf: 0 };
  if (set) {
    assert.notEqual(option(f[3]), option(f[4]), 'exclusive Binding target');
    const record = option(f[3]), field = f[record ? 3 : 4];
    out.targetKind = record ? 1 : 2; out.target = '0x' + field.slice(4, 68); out.targetLeaf = record ? 0 : Number.parseInt(field.slice(68, 72), 16);
  }
  return out;
}
function occurrenceKeys(e) {
  const keys = [pk(Z, 3, 0, e.recordId), pk(e.typeId, 1, 0, Z), pk(Z, 4, 0, e.principal)];
  for (const r of e.references) {
    const role = e.schema.roles[r.roleIndex];
    const key = role.targetClass === 4 ? occValue(r.targetId, r.leafIndex) : r.targetId;
    keys.push(pk(Z, 5, 0, key), pk(e.typeId, 6, r.roleIndex, key));
  }
  e.schema.indexes.forEach((index, i) => {
    const field = e.fields[index.target];
    if (index.kind === 1) keys.push(pk(e.typeId, 7, i, hash(D('efs2/vk/scalar/1'), h(b(field)))));
    if (index.kind === 3) {
      const bytes = b(field), algorithm = bytes.readUInt16BE(0);
      keys.push(pk(Z, 9, 0, hash(D('efs2/vk/digest/1'), w(algorithm), h(bytes.subarray(4)))));
    }
  });
  return [...new Set(keys)];
}

/** Fold checked, origin-contiguous admission rows; not an authority verifier. */
export function foldAdmissions(entries, ids) {
  const bindings = new Map(), histories = new Map(), scopes = new Map(), lifecycle = new Map(), postings = new Map(), bySource = new Map();
  function append(key, ordinal, audit = false) {
    const p = postings.get(key) ?? { ordinals: [], live: 0n, audit };
    assert.equal(p.audit, audit); assert(!p.ordinals.length || p.ordinals.at(-1) < ordinal, 'posting order');
    p.ordinals.push(ordinal); p.live++; postings.set(key, p);
  }
  function delta(key, change) { const p = postings.get(key); assert(p && !p.audit, 'missing live posting'); p.live += change; assert(p.live >= 0n); }
  function occurrence(e, add) {
    const keys = occurrenceKeys(e), before = postings.get(keys[0]), oldLive = before?.live ?? 0n;
    for (const key of keys) add ? append(key, e.ordinal) : delta(key, -1n);
    const unique = pk(e.typeId, 2, 0, Z);
    if (add && oldLive === 0n) {
      if (!before) append(unique, e.ordinal); else delta(unique, 1n);
    } else if (!add && oldLive === 1n) delta(unique, -1n);
  }
  function history(key, ordinal) { const xs = histories.get(key) ?? []; xs.push(ordinal); histories.set(key, xs); append(pk(Z, 8, 0, key), ordinal, true); }
  for (const [i, e] of entries.entries()) {
    assert.equal(e.ordinal, BigInt(i + 1), 'origin-contiguous admission ordinal');
    const src = source(e); assert(!bySource.has(src), 'duplicate source'); bySource.set(src, e);
    lifecycle.set(src, { status: 1, admission: e.ordinal, withdrawal: 0n }); occurrence(e, true);
    const fx = effect(e, ids);
    if (fx.kind === 1 || fx.kind === 2) {
      const old = bindings.get(fx.key);
      assert.equal(fx.predecessor && source(fx.predecessor), old?.source ?? null, 'Binding predecessor');
      if (!old) { const xs = scopes.get(fx.scope) ?? []; xs.push(e.ordinal); scopes.set(fx.scope, xs); append(pk(Z, 10, 0, fx.scope), e.ordinal, true); }
      bindings.set(fx.key, { state: fx.kind === 1 ? 1 : 2, revision: (old?.revision ?? 0n) + 1n, ordinal: e.ordinal, targetKind: fx.targetKind, target: fx.target, targetLeaf: fx.targetLeaf, cause: fx.kind === 2 ? 1 : 0, source: src });
      history(fx.key, e.ordinal);
    } else if (fx.kind === 3) {
      const key = source(fx), target = bySource.get(key), life = lifecycle.get(key);
      assert(target && life && target.ordinal < e.ordinal, 'withdrawal target evidence');
      assert.equal(target.principal, e.principal, 'withdrawal author'); assert.notEqual(target.typeId, ids.withdrawal, 'Withdrawal-of-Withdrawal');
      if (life.status === 2) continue;
      lifecycle.set(key, { status: 2, admission: target.ordinal, withdrawal: e.ordinal }); occurrence(target, false);
      const oldFx = effect(target, ids), old = bindings.get(oldFx.key);
      if (old && old.source === key) {
        bindings.set(oldFx.key, { state: 2, revision: old.revision + 1n, ordinal: e.ordinal, targetKind: 0, target: Z, targetLeaf: 0, cause: 2, source: src });
        history(oldFx.key, e.ordinal);
      }
    }
  }
  return { outcome: 'VERIFIED', bindings, histories, scopes, lifecycle, postings };
}

// Local evidence-collection limits, NOT protocol maxima. No count is converted
// to Number before the finite budget has been checked in bigint arithmetic.
export const COLLECTION_LIMITS = Object.freeze({ rows: 4096n, responseBytes: 262144, totalBytes: 16777216, work: 50000n });
class Incomplete extends Error {}
const incomplete = message => { throw new Incomplete(message); };
const plain = value => typeof value === 'bigint' ? value.toString() : Array.isArray(value) ? value.map(plain) : value;
const countNames = ['records', 'envelopes', 'types', 'principals', 'admissions', 'batches', 'postings', 'bindings'];
export async function collectState({ rpc, iface, expected }, { blockTag = 'latest', limits = {}, onBasis } = {}) {
  const caps = { ...COLLECTION_LIMITS, ...limits }, stats = { work: 0n, bytes: 0, rows: 0n };
  for (const k of ['rows', 'work']) { caps[k] = BigInt(caps[k]); assert(caps[k] > 0n && caps[k] <= COLLECTION_LIMITS[k], 'bounded collection limit'); }
  for (const k of ['responseBytes', 'totalBytes']) assert(Number.isSafeInteger(caps[k]) && caps[k] > 0 && caps[k] <= COLLECTION_LIMITS[k], 'bounded byte limit');
  const spend = (work, rows = 0n) => { if (stats.work + work > caps.work || stats.rows + rows > caps.rows) incomplete('collection work/row budget'); stats.work += work; stats.rows += rows; };
  async function get(method, args) {
    spend(1n);
    const result = await rpc(method, args, { maxBytes: Math.min(caps.responseBytes, caps.totalBytes - stats.bytes) });
    const size = Buffer.byteLength(JSON.stringify(result));
    if (size > caps.responseBytes || size + stats.bytes > caps.totalBytes) incomplete('collection response/total byte budget');
    stats.bytes += size; return result;
  }
  const block = await get('eth_getBlockByNumber', [blockTag, false]);
  if (!block?.hash || !block.number) incomplete('block unavailable');
  const basis = { number: BigInt(block.number).toString(), hash: block.hash, chainId: BigInt(await get('eth_chainId', [])).toString(), core: expected.core, source: expected.source };
  onBasis?.(basis);
  const pin = { blockHash: block.hash, requireCanonical: true };
  const s = { basis, components: {}, getters: {}, counts: [], bootstrap: [], complete: false, stats, limits: caps };
  const call = async (name, ...args) => {
    const data = await get('eth_call', [{ to: expected.core, data: iface.encodeFunctionData(name, args) }, pin]);
    if (typeof data !== 'string' || !/^0x(?:[0-9a-fA-F]{2})*$/.test(data) || data.length < 66) incomplete('truncated ABI response: ' + name);
    let decoded;
    try { decoded = iface.decodeFunctionResult(name, data); } catch { incomplete('truncated/unavailable ABI response: ' + name); }
    assert.equal(iface.encodeFunctionResult(name, decoded).toLowerCase(), data.toLowerCase(), 'noncanonical response ' + name);
    return plain(decoded[0]);
  };
  for (const [name, c] of Object.entries(expected.components)) s.components[name] = { address: c.address, code: await get('eth_getCode', [c.address, pin]), pin: basis.hash };
  for (const name of ['preparationHelper', 'preparationCodehash', 'admissionLibrary', 'admissionCodehash']) s.getters[name] = await call(name);
  s.counts = await call('counts'); assert.equal(s.counts.length, 8);
  const counts = s.counts.map(BigInt), rows = counts.reduce((a, n) => a + n, 0n);
  if (counts.some(n => n > caps.rows) || rows > caps.rows || rows * 2n > caps.work - stats.work) incomplete('inflated inventory/remaining-work budget');
  spend(0n, rows); s.bootstrap = await call('bootstrap');
  const inventory = [['records', 'recordIdAt', 'record'], ['envelopes', 'envelopeIdAt', 'envelope'], ['types', 'typeIdAt', 'typeRow'], ['principals', 'principalIdAt', 'principal'], ['postings', 'postingKeyAt', 'postingHead'], ['bindings', 'bindingKeyAt', 'binding']];
  for (const [name, idFn, rowFn] of inventory) {
    s[name] = [];
    for (let i = 1n; i <= counts[countNames.indexOf(name)]; i++) {
      const id = await call(idFn, i), row = await call(rowFn, id), item = { id, row, pin: basis.hash };
      if (name === 'postings') {
        const count = BigInt(row) & M64, words = (count + 4n) / 5n;
        if (count > counts[4] || words > caps.rows - stats.rows || words > caps.work - stats.work) incomplete('posting word/remaining-work budget');
        spend(0n, words); item.words = [];
        for (let j = 0n; j < words; j++) item.words.push(await call('postingWord', id, j));
      }
      s[name].push(item);
    }
  }
  s.admissions = []; s.batches = []; s.occurrences = [];
  for (let i = 1n; i <= counts[4]; i++) s.admissions.push({ row: await call('admissionAt', i), pin: basis.hash });
  for (let i = 1n; i <= counts[5]; i++) s.batches.push({ row: await call('batchAt', i), pin: basis.hash });
  // Collect local lifecycle for EVERY carried member, including never admitted.
  for (const envelope of s.envelopes) {
    const raw = envelope.row[0];
    if (b(raw).length > 2336) incomplete('Envelope spine bound');
    const [header, vector] = abi.decode([HEADER, 'bytes32[]'], raw);
    assert(vector.length > 0 && vector.length <= 64, 'Envelope member bound');
    assert.equal(abi.encode([HEADER, 'bytes32[]'], [header, vector]), raw, 'canonical Envelope spine');
    const n = BigInt(vector.length); if (n > caps.rows - stats.rows || n > caps.work - stats.work) incomplete('lifecycle remaining-work budget'); spend(0n, n);
    for (let i = 0; i < vector.length; i++) s.occurrences.push({ id: envelope.id + ':' + i, row: await call('occurrence', envelope.id, i), pin: basis.hash });
  }
  const end = await get('eth_getBlockByNumber', [block.number, false]);
  if (end?.hash !== basis.hash || BigInt(await get('eth_chainId', [])).toString() !== basis.chainId) incomplete('mixed/reorganized basis');
  s.complete = true; return s;
}

function groupParts(raw, knownTypes) {
  const bytes = b(raw), parsed = parseGroup(bytes, { knownTypes }), blobs = []; let pos = 2;
  for (let i = 0; i < parsed.ids.length; i++) { const n = bytes.readUInt16BE(pos); pos += 2; blobs.push(bytes.subarray(pos, pos + n)); pos += n; }
  return { ...parsed, blobs };
}
const equal = (a, c, label) => assert.deepEqual(plain(a), plain(c), label);
function reconstruct(s, expected) {
  if (!s?.complete || !s.basis) incomplete('incomplete snapshot');
  const basis = s.basis;
  for (const k of ['source', 'core', 'chainId']) equal(basis[k], expected[k], 'basis ' + k);
  assert(/^0x[0-9a-f]{64}$/i.test(basis.hash) && BigInt(basis.number) >= 0n, 'block pin');
  for (const [name, c] of Object.entries(expected.components)) {
    const observed = s.components?.[name]; if (!observed?.code || observed.code === '0x') incomplete('missing component ' + name);
    if (observed.pin !== basis.hash) incomplete('mixed component basis');
    equal(observed.address.toLowerCase(), c.address.toLowerCase(), 'component address'); equal(observed.code, c.code, 'complete runtime ' + name);
  }
  for (const [name, value] of Object.entries(expected.getters)) { if (!s.getters?.[name]) incomplete('missing dependency getter'); equal(s.getters[name].toLowerCase(), value.toLowerCase(), 'dependency ' + name); }
  assert(Array.isArray(s.counts) && s.counts.length === 8, 'count shape');
  const counts = s.counts.map(BigInt); assert(counts.every(n => n >= 0n && n <= COLLECTION_LIMITS.rows), 'snapshot finite inventory budget');
  for (const [i, name] of countNames.entries()) {
    if (!Array.isArray(s[name])) incomplete('missing inventory ' + name);
    equal(BigInt(s[name].length), counts[i], 'inventory count ' + name);
    for (const row of s[name]) if (row.pin !== basis.hash) incomplete('mixed row basis');
    if (s[name].some(x => x.id !== undefined)) equal(new Set(s[name].map(x => x.id)).size, s[name].length, 'duplicate ' + name);
  }
  if (!Array.isArray(s.occurrences)) incomplete('missing lifecycle inventory');
  assert(s.occurrences.length <= Number(COLLECTION_LIMITS.rows), 'finite lifecycle inventory');
  for (const x of s.occurrences) if (x.pin !== basis.hash) incomplete('mixed lifecycle basis');
  equal(new Set(s.occurrences.map(x => x.id)).size, s.occurrences.length, 'duplicate lifecycle');
  const init = expected.init, boot = s.bootstrap;
  equal(boot.slice(0, 5), [init.realmId, init.initialRevisionId, init.intrinsicGroupBytes, keccak256(init.objectGroup1Bytes), keccak256(init.kernelGroup2Bytes)], 'bootstrap commitments');
  const intrinsic = groupParts(init.intrinsicGroupBytes, []), meta = intrinsic.ids[0];
  equal(intrinsic.members[0].fields, [{ name: 'groupBytes', kind: 'BYTES', max: 8190 }], 'intrinsic shape');
  equal([intrinsic.members[0].roles, intrinsic.members[0].indexes, intrinsic.members[0].constraints, intrinsic.ids.length], [[], [], [], 1], 'intrinsic shape');
  equal(boot[5], meta, 'meta identity');
  const types = new Map(), records = new Map(), envelopes = new Map(), principals = new Map(), typeOrder = [], recordOrder = [], envelopeOrder = [], principalOrder = [], entries = [];
  const actualTypes = new Map(s.types.map(x => [x.id, x.row])), actualRecords = new Map(s.records.map(x => [x.id, x.row]));
  let active = { object: Z, set: Z, tombstone: Z, withdrawal: Z };
  function install(group, provenance, ordinal) {
    group.ids.forEach((id, i) => {
      const old = types.get(id), row = actualTypes.get(id); assert(row, 'missing Type');
      verifyCache({ ordinal: row[2], cacheBytes: row[4] }, group.members[i], id, group.ids, group.blobs[i]);
      if (!old) { typeOrder.push(id); types.set(id, { schema: group.members[i], group: group.ids }); }
      equal(row.slice(0, 4), [provenance, String(i), String(typeOrder.indexOf(id) + 1), old ? row[3] : String(ordinal)], 'Type provenance');
    });
  }
  install(intrinsic, Z, 0n);
  for (const [i, item] of s.envelopes.entries()) {
    const [raw, ordinal] = item.row; assert(b(raw).length <= 2336, 'Envelope byte bound');
    const [header, vector] = abi.decode([HEADER, 'bytes32[]'], raw);
    equal(abi.encode([HEADER, 'bytes32[]'], [header, vector]), raw, 'canonical unsigned Envelope');
    assert(vector.length > 0 && vector.length <= 64); equal(ordinaryEnvelope(header, [...vector]), item.id, 'Envelope identity');
    equal(ordinal, String(i + 1), 'Envelope ordinal'); envelopes.set(item.id, { header, vector });
  }
  // Batch closure is independent of logs: exactly partition [1, high-water].
  const batchByOrdinal = new Map(); let next = 1n, previousBlock = 0n;
  s.batches.forEach((x, i) => {
    if (x.row == null) incomplete('missing batch row');
    assert(Array.isArray(x.row) && x.row.length <= 3, 'batch row shape');
    if (x.row.length < 3 || [0, 1, 2].some(k => x.row[k] == null)) incomplete('missing batch field');
    const authority = expected.syntheticBatchAuthority;
    if (authority?.authorityBasis == null || authority?.authorityCodehash == null) incomplete('missing synthetic batch authority expectation');
    for (const value of [x.row[0], x.row[1], authority.authorityBasis]) {
      assert(typeof value === 'string' && /^(0|[1-9][0-9]{0,77})$/.test(value) && BigInt(value) < (1n << 256n), 'batch uint256 shape');
    }
    for (const value of [x.row[2], authority.authorityCodehash]) assert(typeof value === 'string' && /^0x[0-9a-f]{64}$/.test(value), 'batch codehash shape');
    // Caller-supplied fixture commitments, never inferred from snapshot or logs.
    // Matching these synthetic values is integrity checking, not B0 authentication.
    equal(x.row[1], authority.authorityBasis, 'synthetic batch authority basis');
    equal(x.row[2], authority.authorityCodehash, 'synthetic batch authority codehash');
    const [metaWord] = x.row, meta = BigInt(metaWord), first = meta & M48, count = (meta >> 48n) & 65535n, block = (meta >> 64n) & M48, revision = (meta >> 112n) & 0xffffffffn;
    equal(first, next, 'batch origin closure'); assert(count > 0n && count <= 64n && first + count - 1n <= counts[4]);
    assert(block >= previousBlock && block > 0n && block <= BigInt(basis.number)); equal(revision, 1n, 'synthetic revision'); equal(meta >> 144n, 0n, 'batch reserved bits');
    for (let j = 0n; j < count; j++) batchByOrdinal.set(first + j, { batch: BigInt(i + 1), first, count, block });
    next += count; previousBlock = block;
  });
  equal(next, counts[4] + 1n, 'batch high-water closure');
  const seenSources = new Set(); let previous;
  for (const [i, item] of s.admissions.entries()) {
    const ordinal = BigInt(i + 1), [envelopeId, packedValue] = item.row, packed = BigInt(packedValue), leaf = Number(packed & 65535n), typeOrdinal = (packed >> 16n) & M48, principalOrdinal = (packed >> 64n) & M48;
    equal(packed >> 112n, 0n, 'admission reserved bits');
    const env = envelopes.get(envelopeId); assert(env && leaf < env.vector.length, 'portable membership');
    const recordId = env.vector[leaf], row = actualRecords.get(recordId); assert(row, 'missing retained Record');
    const [typeId, body, recordOrdinal, firstOrdinal] = row;
    equal(ordinaryRecord(typeId, body), recordId, 'ordinary Record identity');
    const type = types.get(typeId); assert(type, 'Type not yet admitted');
    equal(typeOrdinal, BigInt(typeOrder.indexOf(typeId) + 1), 'admission Type ordinal');
    const principal = env.header.principalId;
    if (!principals.has(principal)) { principalOrder.push(principal); principals.set(principal, [String(principalOrder.length), String(ordinal)]); }
    equal(principalOrdinal, BigInt(principalOrder.indexOf(principal) + 1), 'admission Principal ordinal');
    if (!envelopeOrder.includes(envelopeId)) envelopeOrder.push(envelopeId);
    const src = envelopeId + ':' + leaf; assert(!seenSources.has(src), 'duplicate admission source'); seenSources.add(src);
    const batch = batchByOrdinal.get(ordinal);
    if (previous?.batch.batch === batch.batch) { equal(envelopeId, previous.envelopeId, 'selected batch Envelope'); assert(leaf > previous.leaf, 'selected admission ordering'); }
    const decoded = decodeBody(type.schema, body);
    for (const ref of decoded.references) {
      const role = type.schema.roles[ref.roleIndex];
      if (role.targetClass === 4) { assert(ref.targetId !== envelopeId, 'current-envelope OCCREF'); const target = envelopes.get(ref.targetId); assert(target && envelopeOrder.includes(ref.targetId) && ref.leafIndex < target.vector.length, 'retained external membership'); }
      else if ([1, 5].includes(role.targetClass)) {
        const target = records.get(ref.targetId); assert(target, 'earlier Record reference');
        if (role.targetClass === 5) assert(active.object !== Z && target[0] === active.object, 'Object target Type');
        const want = role.expectedType === 'ANY' ? null : role.expectedType === 'SELF' ? typeId : role.expectedType.startsWith('GROUP_REF:') ? type.group[Number(role.expectedType.split(':')[1])] : '0x' + role.expectedType;
        if (want) equal(target[0], want, 'reference expected Type');
      } else incomplete('unsupported runtime reference class');
    }
    if (!records.has(recordId)) { recordOrder.push(recordId); records.set(recordId, row); equal(recordOrdinal, String(recordOrder.length), 'Record ordinal'); equal(firstOrdinal, String(ordinal), 'Record first admission'); }
    if (typeId === meta) {
      const raw = '0x' + body.slice(6), group = groupParts(raw, [...types.keys()]); install(group, recordId, ordinal);
      if (keccak256(raw) === boot[3]) { equal(group.ids.length, 6); active.object = group.ids[0]; }
      if (keccak256(raw) === boot[4]) { equal(group.ids.length, 3); [active.set, active.tombstone, active.withdrawal] = group.ids; }
    }
    entries.push({ ordinal, envelopeId, leaf, occurrenceId: ordinaryOccurrence(envelopeId, leaf), typeId, recordId, principal, ...decoded, schema: type.schema });
    previous = { batch, envelopeId, leaf };
  }
  equal(boot.slice(6), [active.object, active.set, active.tombstone, active.withdrawal], 'activated kernel identities');
  equal(s.types.map(x => x.id), typeOrder, 'complete ordered Type inventory'); equal(s.records.map(x => x.id), recordOrder, 'complete ordered Record inventory');
  equal(s.envelopes.map(x => x.id), envelopeOrder, 'complete ordered Envelope inventory'); equal(s.principals.map(x => x.id), principalOrder, 'complete ordered Principal inventory');
  for (const x of s.principals) equal(x.row, principals.get(x.id), 'Principal first admission');
  const fold = foldAdmissions(entries, active), actualLife = new Map(s.occurrences.map(x => [x.id, x.row]));
  const expectedSources = [];
  for (const [env, value] of envelopes) for (let leaf = 0; leaf < value.vector.length; leaf++) {
    const src = env + ':' + leaf; expectedSources.push(src); const life = fold.lifecycle.get(src);
    const packed = life ? BigInt(life.status) | (life.admission << 8n) | (life.withdrawal << 56n) : 0n;
    equal(actualLife.get(src), [String(packed)], 'sole lifecycle row');
  }
  equal(s.occurrences.map(x => x.id), expectedSources, 'complete member lifecycle inventory');
  equal(s.bindings.map(x => x.id), [...fold.bindings.keys()], 'Binding key inventory');
  for (const x of s.bindings) {
    const head = fold.bindings.get(x.id), packed = BigInt(head.state) | (head.revision << 8n) | (head.ordinal << 40n) | (BigInt(head.targetKind) << 88n) | (BigInt(head.cause) << 96n) | (BigInt(head.targetLeaf) << 104n);
    equal(x.row, [String(packed), head.target], 'current Binding head');
  }
  equal(s.postings.map(x => x.id), [...fold.postings.keys()], 'complete posting key inventory');
  for (const x of s.postings) {
    const p = fold.postings.get(x.id), count = BigInt(p.ordinals.length), packed = count | (p.live << 64n) | (p.ordinals.at(-1) << 128n) | (BigInt(p.audit) << 176n);
    equal(x.row, String(packed), 'posting head/live/high-water/flags');
    const words = [];
    for (let i = 0; i < p.ordinals.length; i += 5) words.push(String(p.ordinals.slice(i, i + 5).reduce((n, ord, j) => n | (ord << BigInt(48 * j)), 0n)));
    equal(x.words, words, 'complete origin-to-high-water packed word chain');
  }
  return { outcome: 'VERIFIED', basis, counts: s.counts, audit: 'COMPLETE', contribution: 'UNKNOWN', entries, fold, batchByOrdinal, snapshot: s, provenance: 'source-observed local reconstruction; not Ethereum consensus/state proof', authority: 'synthetic VerifiedContext; NOT authenticated B0/C0 authority' };
}
export function verifyState(snapshot, expected) {
  try { return reconstruct(snapshot, expected); }
  catch (error) { return { outcome: error instanceof Incomplete ? 'UNKNOWN' : 'INVALID', audit: 'PARTIAL', contribution: 'UNKNOWN', basis: null, attemptedBasis: snapshot?.basis ?? null, reason: error.message, snapshot }; }
}
export async function readState(lab, options = {}) {
  let attemptedBasis = null;
  try { const snapshot = await collectState(lab, { ...options, onBasis: basis => { attemptedBasis = basis; options.onBasis?.(basis); } }); return verifyState(snapshot, lab.expected); }
  catch (error) { return { outcome: error instanceof assert.AssertionError ? 'INVALID' : 'UNKNOWN', audit: 'PARTIAL', contribution: 'UNKNOWN', basis: null, attemptedBasis, reason: error.message }; }
}

export function verifyContribution(evidence, state, submitted, iface, expected) {
  const fail = error => ({ outcome: error instanceof Incomplete ? 'UNKNOWN' : 'INVALID', basis: null, attemptedBasis: state?.basis ?? state?.attemptedBasis ?? null, reason: error.message });
  try {
    const verified = verifyState(state.snapshot, expected); if (verified.outcome !== 'VERIFIED') incomplete('state not independently verified');
    if (!evidence?.block || !Array.isArray(evidence.receipts) || !evidence.transaction) incomplete('missing transaction/receipt source');
    const { block, receipts, transaction } = evidence, basis = verified.basis;
    equal(block.hash, basis.hash, 'transaction block pin'); equal(BigInt(block.number), BigInt(basis.number), 'transaction block number');
    assert(Array.isArray(block.transactions) && block.transactions.length <= 128, 'bounded block transactions');
    equal(receipts.length, block.transactions.length, 'canonical block receipt closure');
    assert(typeof submitted.raw === 'string' && submitted.raw.length <= 98306, 'bounded signed transaction');
    const raw = Transaction.from(submitted.raw); equal(raw.hash, submitted.hash, 'exact submitted transaction hash'); equal(raw.data, submitted.data, 'submitted calldata');
    assert(raw.gasLimit > 0n && raw.gasLimit <= 16777216n, 'submitted transaction gas ceiling');
    equal(raw.to.toLowerCase(), expected.core.toLowerCase(), 'submitted Core'); equal(raw.chainId, BigInt(expected.chainId), 'submitted chain');
    equal(transaction.hash, raw.hash, 'transaction identity'); equal(transaction.input, raw.data, 'transaction calldata');
    equal(transaction.from.toLowerCase(), raw.from.toLowerCase(), 'transaction signer'); equal(transaction.to.toLowerCase(), raw.to.toLowerCase(), 'transaction target');
    equal(BigInt(transaction.nonce), BigInt(raw.nonce), 'transaction nonce'); equal(BigInt(transaction.gas), raw.gasLimit, 'transaction gas');
    equal(transaction.blockHash, block.hash, 'transaction basis'); equal(BigInt(transaction.blockNumber), BigInt(block.number), 'transaction height');
    const index = BigInt(transaction.transactionIndex); assert(index >= 0n && index < BigInt(receipts.length));
    equal(block.transactions[Number(index)], submitted.hash, 'canonical transaction position');
    const eventByBatch = new Map(), decoded = [];
    for (const [i, receipt] of receipts.entries()) {
      equal(receipt.transactionHash, block.transactions[i], 'canonical receipt transaction'); equal(BigInt(receipt.transactionIndex), BigInt(i), 'receipt transaction index');
      equal(receipt.blockHash, basis.hash, 'receipt block hash'); equal(BigInt(receipt.blockNumber), BigInt(basis.number), 'receipt block number');
      assert(Array.isArray(receipt.logs) && receipt.logs.length <= 128, 'bounded receipt logs');
      const logs = receipt.logs.filter(l => l.address.toLowerCase() === expected.core.toLowerCase()); assert(logs.length <= 1, 'duplicate host event');
      if (!logs.length) { decoded.push(null); continue; }
      const log = logs[0]; assert(!log.removed, 'removed event'); equal(log.transactionHash, receipt.transactionHash, 'event transaction'); equal(BigInt(log.transactionIndex), BigInt(i), 'event index'); equal(log.blockHash, basis.hash, 'event block'); equal(BigInt(log.blockNumber), BigInt(basis.number), 'event height');
      const event = iface.parseLog(log); assert(event?.name === 'TrustedHostAdmissionResult', 'unexpected host event');
      const encoded = iface.encodeEventLog(event.fragment, event.args); equal(encoded.data, log.data, 'canonical event data'); equal(encoded.topics, log.topics, 'canonical event topics');
      const batch = event.args.acceptingBatchId;
      if (batch > 0n) { assert(!eventByBatch.has(batch), 'duplicate accepting batch event'); eventByBatch.set(batch, BigInt(i)); }
      decoded.push(event.args);
    }
    const receipt = receipts[Number(index)], event = decoded[Number(index)]; equal(receipt.status, '0x1', 'successful transaction');
    if (!event) incomplete('state-only/no-log contribution');
    const [v, p] = iface.decodeFunctionData('publishTrustedForTest', raw.data);
    equal(iface.encodeFunctionData('publishTrustedForTest', [v, p]), raw.data, 'canonical submitted publication');
    equal(p.envelopeId, ordinaryEnvelope(p.header, [...p.recordIds]), 'submitted Envelope identity'); equal(event.envelopeId, p.envelopeId, 'event exact publication');
    equal(v.authenticatedPrincipal, p.header.principalId, 'synthetic declared Principal');
    const envelope = verified.snapshot.envelopes.find(x => x.id === p.envelopeId); assert(envelope, 'hydrated event Envelope'); equal(event.envelopeOrdinal, BigInt(envelope.row[1]), 'event Envelope ordinal');
    equal(event.leaves.length, p.leaves.length, 'event selected-leaf count');
    const sources = new Map(verified.entries.map(e => [source(e), e])); let mask = 0n, fresh = 0, previousLeaf = -1;
    for (let i = 0; i < p.leaves.length; i++) {
      const leaf = p.leaves[i], result = event.leaves[i], leafIndex = Number(leaf.leafIndex);
      assert(leafIndex > previousLeaf && leafIndex < p.recordIds.length, 'selected leaf order'); previousLeaf = leafIndex; mask |= 1n << leaf.leafIndex;
      equal(result.leafIndex, leaf.leafIndex, 'event selected leaf'); equal(ordinaryRecord(leaf.typeId, leaf.body), p.recordIds[leafIndex], 'submitted Record');
      const entry = sources.get(p.envelopeId + ':' + leafIndex); assert(entry, 'hydrated per-leaf receipt');
      equal(entry.recordId, p.recordIds[leafIndex], 'hydrated Record'); equal(entry.ordinal, result.admissionOrdinal, 'event admission ordinal');
      const batch = verified.batchByOrdinal.get(entry.ordinal); assert(batch, 'hydrated accepting batch');
      if (result.outcome === 1n) {
        fresh++; assert(event.acceptingBatchId > 0n); equal(batch.batch, event.acceptingBatchId, 'fresh exact batch'); equal(batch.block, BigInt(block.number), 'fresh batch block'); equal(eventByBatch.get(batch.batch), index, 'fresh exact transaction');
      } else {
        equal(result.outcome, 2n, 'known leaf outcome'); assert(batch.batch !== event.acceptingBatchId, 'reused cannot belong to fresh batch');
        if (batch.block === BigInt(block.number) && !eventByBatch.has(batch.batch)) incomplete('same-block original acceptance event unavailable');
        assert(batch.block < BigInt(block.number) || (batch.block === BigInt(block.number) && eventByBatch.has(batch.batch) && eventByBatch.get(batch.batch) < index), 'reused source precedes this transaction, not just same block');
      }
    }
    equal(mask, p.leafMask, 'exact selected mask');
    if (fresh) {
      const row = verified.snapshot.batches[Number(event.acceptingBatchId - 1n)]?.row; assert(row, 'event accepting batch');
      equal((BigInt(row[0]) >> 48n) & 65535n, BigInt(fresh), 'fresh count'); equal(row[1], v.authorityBasis.toString(), 'synthetic authority basis'); equal(row[2], v.authorityCodehash, 'synthetic authority codehash');
    } else equal(event.acceptingBatchId, 0n, 'all-reused no batch sentinel');
    return { outcome: fresh === 0 ? 'ALL_REUSED' : fresh === p.leaves.length ? 'ALL_FRESH' : 'MIXED', acceptingBatchId: fresh ? event.acceptingBatchId.toString() : null, leaves: plain(event.leaves), transactionHash: submitted.hash, basis, provenance: verified.provenance, authority: verified.authority };
  } catch (error) { return fail(error); }
}
export async function readContribution(lab, state, submitted) {
  try {
    if (state.outcome !== 'VERIFIED') incomplete('state unavailable');
    let bytes = 0, work = 0;
    const get = async (method, args) => {
      if (++work > 130 || bytes >= COLLECTION_LIMITS.totalBytes) incomplete('contribution total collection budget');
      const result = await lab.rpc(method, args, { maxBytes: Math.min(COLLECTION_LIMITS.responseBytes, COLLECTION_LIMITS.totalBytes - bytes) });
      const size = Buffer.byteLength(JSON.stringify(result)); bytes += size;
      if (size > COLLECTION_LIMITS.responseBytes || bytes > COLLECTION_LIMITS.totalBytes) incomplete('contribution response byte budget');
      return result;
    };
    const transaction = await get('eth_getTransactionByHash', [submitted.hash]); if (!transaction) incomplete('transaction unavailable');
    const block = await get('eth_getBlockByHash', [state.basis.hash, false]); if (!block) incomplete('block unavailable');
    if (block.transactions.length > 128) incomplete('contribution receipt budget');
    const receipts = [];
    for (const hash of block.transactions) { const receipt = await get('eth_getTransactionReceipt', [hash]); if (!receipt) incomplete('receipt unavailable'); receipts.push(receipt); }
    const evidence = { transaction, block, receipts };
    return { ...verifyContribution(evidence, state, submitted, lab.iface, lab.expected), evidence, collection: { bytes, work, receiptLimit: 128, logLimitPerReceipt: 128 } };
  } catch (error) { return { outcome: 'UNKNOWN', basis: null, attemptedBasis: state?.basis ?? null, reason: error.message }; }
}

export function composeMembership(state, evidence, leaf, expected) {
  try {
    const verified = verifyState(state.snapshot, expected);
    if (verified.outcome !== 'VERIFIED' || !evidence?.basis) incomplete('unverified same-pin state');
    if (JSON.stringify(evidence.basis) !== JSON.stringify(verified.basis)) incomplete('mixed portable/local basis');
    assert(Number.isInteger(leaf) && leaf >= 0 && leaf < 64, 'membership leaf bound'); assert(b(evidence.unsigned).length <= 2336, 'membership byte bound');
    const [header, vector] = abi.decode([HEADER, 'bytes32[]'], evidence.unsigned);
    equal(abi.encode([HEADER, 'bytes32[]'], [header, vector]), evidence.unsigned, 'canonical portable Envelope');
    equal(ordinaryEnvelope(header, [...vector]), evidence.envelopeId, 'portable Envelope commitment');
    assert(vector.length <= 64 && leaf < vector.length, 'portable member position');
    const row = verified.snapshot.occurrences.find(x => x.id === evidence.envelopeId + ':' + leaf);
    const lifecycle = row ? ['NEVER_ADMITTED', 'ACTIVE', 'WITHDRAWN', 'PRE_WITHDRAWN'][Number(BigInt(row.row[0]) & 255n)] : 'UNKNOWN';
    return { membership: 'VERIFIED', lifecycle, basis: verified.basis };
  } catch (error) { return { membership: error instanceof Incomplete ? 'UNKNOWN' : 'INVALID', lifecycle: 'UNKNOWN', basis: null, reason: error.message }; }
}
