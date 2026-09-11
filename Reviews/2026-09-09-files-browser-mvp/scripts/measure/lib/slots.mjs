// Storage-slot attribution for the EFS fixture Core, carrier and router.
//
// Method: PREIMAGE DERIVATION (no instrumentation, no semantic change). The
// Core keeps `StateStore.Store` under the ERC-7201 namespace
// `efs.fixture.store`; every bytes32-keyed mapping in the Store is mirrored by
// an ordinal-keyed index mapping (recordIds, envelopeIds, typeIds,
// principalIds, postingKeys, bindingKeys) whose values are exactly the keys
// ever used. Enumerating those indexes at the post-transaction block gives
// the complete key universe, from which every mapping slot, struct member
// slot and dynamic-bytes data slot is recomputed with the Solidity layout
// rules and matched against the written slots. Any written slot with no
// derived preimage is reported as UNATTRIBUTED rather than guessed.
import { AbiCoder, keccak256, toUtf8Bytes, toBeHex, zeroPadValue } from '../../../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';

const abi = AbiCoder.defaultAbiCoder();
const word = v => typeof v === 'bigint' ? zeroPadValue(toBeHex(v), 32) : zeroPadValue(v, 32);
const hex32 = v => '0x' + v.toString(16).padStart(64, '0');
const MASK = (1n << 256n) - 1n;

export function namespaceSlot(id) {
  const h = BigInt(keccak256(toUtf8Bytes(id))) - 1n;
  return BigInt(keccak256(abi.encode(['uint256'], [h]))) & ~0xffn;
}
export const EFS_SLOT = namespaceSlot('efs.fixture.store');
export const CONTROL_SLOT = namespaceSlot('efs.fixture.control');
export const PRESENTATION_SLOT = namespaceSlot('efs.fixture.presentation.v2');
export const AUTHORITY_SLOT = namespaceSlot('efs.fixture.authority.v3');
export const CHUNKS_SLOT = namespaceSlot('efs.fixture.chunks.v3');
export const IMPLEMENTATION_SLOT = BigInt('0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc');
export const ADMIN_SLOT = BigInt('0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103');

// StateStore.Store member offsets (Solidity layout, verified against counts()).
export const STORE = Object.freeze({
  counts0: 0n, counts1: 1n,
  init: { realmId: 2n, initialRevisionId: 3n, intrinsicGroupBytes: 4n, objectGroup1Hash: 5n, kernelGroup2Hash: 6n, metaTypeId: 7n, objectGenesisType: 8n, bindingSetType: 9n, bindingTombstoneType: 10n, withdrawalType: 11n },
  records: 12n, envelopes: 13n, types: 14n, principals: 15n, admissions: 16n, occurrences: 17n, bindings: 18n, postings: 19n, postingWords: 20n, batches: 21n,
  recordIds: 22n, envelopeIds: 23n, typeIds: 24n, principalIds: 25n, postingKeys: 26n, bindingKeys: 27n,
});

export const mapSlot = (base, key) => BigInt(keccak256(abi.encode(['bytes32', 'uint256'], [word(key), base])));
export const dataSlot = headSlot => BigInt(keccak256(abi.encode(['uint256'], [headSlot])));
export const occKey = (envelopeId, leaf) => keccak256(abi.encode(['bytes32', 'bytes32', 'uint256'], [keccak256(toUtf8Bytes('efs2/occurrence/1')), envelopeId, BigInt(leaf)]));

const DOM_PK = keccak256(toUtf8Bytes('efs2/pk/1'));
const DOM_SCALAR = keccak256(toUtf8Bytes('efs2/vk/scalar/1'));
const DOM_OCC = keccak256(toUtf8Bytes('efs2/vk/occ/1'));
const DOM_SCOPE = keccak256(toUtf8Bytes('efs2/vk/binding-scope/1'));
export const posting = (typeId, kind, ordinal, valueKey) => keccak256(abi.encode(['bytes32', 'bytes32', 'uint256', 'uint256', 'bytes32'], [DOM_PK, typeId, BigInt(kind), BigInt(ordinal), valueKey]));
export const scalar = fieldBytes => keccak256(abi.encode(['bytes32', 'bytes32'], [DOM_SCALAR, keccak256(fieldBytes)]));
export const occurrenceTarget = (envelopeId, leaf) => keccak256(abi.encode(['bytes32', 'bytes32', 'uint256'], [DOM_OCC, envelopeId, BigInt(leaf)]));
export const scope = (principal, purpose, subject) => keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [DOM_SCOPE, principal, purpose, subject]));

/** JSON-RPC batch helper with a generous byte budget (the lab's rpc() caps at 256 KiB). */
export async function batchRpc(url, calls, { chunk = 250 } = {}) {
  const out = [];
  for (let at = 0; at < calls.length; at += chunk) {
    const part = calls.slice(at, at + chunk).map((c, i) => ({ jsonrpc: '2.0', id: i, method: c.method, params: c.params }));
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(part) });
    const arr = await res.json();
    if (!Array.isArray(arr)) throw new Error('batch response not an array: ' + JSON.stringify(arr).slice(0, 200));
    arr.sort((a, b) => a.id - b.id);
    for (const r of arr) { if (r.error) throw new Error('rpc ' + JSON.stringify(r.error)); out.push(r.result); }
  }
  return out;
}

/** Read the Store's ordinal indexes at `block` and return every key ever used. */
export async function enumerateStoreKeys(url, core, block) {
  const at = async slots => batchRpc(url, slots.map(s => ({ method: 'eth_getStorageAt', params: [core, hex32(s), block] })));
  const [c0, c1] = await at([EFS_SLOT + STORE.counts0, EFS_SLOT + STORE.counts1]);
  const u64 = (v, k) => (BigInt(v) >> BigInt(64 * k)) & ((1n << 64n) - 1n);
  const counts = { records: u64(c0, 0), envelopes: u64(c0, 1), types: u64(c0, 2), principals: u64(c0, 3), admissions: u64(c1, 0), batches: u64(c1, 1), postingKeys: u64(c1, 2), bindingKeys: u64(c1, 3) };
  const index = async (base, n) => {
    const slots = []; for (let i = 1n; i <= n; i++) slots.push(mapSlot(EFS_SLOT + base, i));
    return at(slots);
  };
  const [recordIds, envelopeIds, typeIds, principalIds, postingKeys, bindingKeys] = await Promise.all([
    index(STORE.recordIds, counts.records), index(STORE.envelopeIds, counts.envelopes), index(STORE.typeIds, counts.types),
    index(STORE.principalIds, counts.principals), index(STORE.postingKeys, counts.postingKeys), index(STORE.bindingKeys, counts.bindingKeys),
  ]);
  // Record heads (typeId + body length) for data-slot sizing and posting-family labelling.
  const heads = await at(recordIds.flatMap(id => { const p = mapSlot(EFS_SLOT + STORE.records, id); return [p, p + 1n]; }));
  const records = recordIds.map((id, i) => ({ id, ordinal: i + 1, typeId: heads[2 * i], bodyHead: heads[2 * i + 1] }));
  return { block, counts: Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, String(v)])), recordIds, envelopeIds, typeIds, principalIds, postingKeys, bindingKeys, records };
}

const bytesWords = head => { const v = BigInt(head); return (v & 1n) ? Number((v - 1n) / 2n + 31n) / 32 | 0 : 0; };

/**
 * Build the slot -> label map for the Core (Store + authority + control),
 * the carrier (chunks) and the router. Labels carry the StateStore.Kind
 * family, the struct member and, where derivable, the key's identity.
 */
export function buildSlotMap({ keys, extra = {} }) {
  const map = new Map(); // 'addr:slot' -> { kind, member, key, index }
  const put = (addr, slot, kind, member, key = null, index = null) => {
    const k = addr.toLowerCase() + ':' + hex32(slot & MASK);
    if (!map.has(k)) map.set(k, { kind, member, key, index });
  };
  const core = extra.core.toLowerCase();
  const E = EFS_SLOT;
  put(core, E + STORE.counts0, 'Counts', 'records|envelopes|types|principals');
  put(core, E + STORE.counts1, 'Counts', 'admissions|batches|postingKeys|bindingKeys');
  for (const [name, off] of Object.entries(STORE.init)) put(core, E + off, 'Bootstrap', name);
  for (let i = 0n; i < 256n; i++) put(core, dataSlot(E + STORE.init.intrinsicGroupBytes) + i, 'Bootstrap', 'intrinsicGroupBytes[data]', null, Number(i));
  for (const r of keys.records) {
    const p = mapSlot(E + STORE.records, r.id);
    put(core, p, 'Record', 'typeId', r.id); put(core, p + 1n, 'Record', 'body(head)', r.id); put(core, p + 2n, 'Record', 'recordOrdinal|firstAdmissionOrdinal', r.id);
    const words = Math.max(bytesWords(r.bodyHead), 0);
    for (let i = 0n; i < BigInt(Math.max(words, 256)); i++) put(core, dataSlot(p + 1n) + i, 'Record', 'body[data]', r.id, Number(i)); // bodies are capped at 8192 bytes = 256 words
  }
  for (const id of keys.envelopeIds) {
    const p = mapSlot(E + STORE.envelopes, id);
    put(core, p, 'Envelope', 'canonicalUnsignedEnvelope(head)', id); put(core, p + 1n, 'Envelope', 'envelopeOrdinal', id);
    for (let i = 0n; i < 256n; i++) put(core, dataSlot(p) + i, 'Envelope', 'canonicalUnsignedEnvelope[data]', id, Number(i));
    for (let leaf = 0; leaf < 64; leaf++) put(core, mapSlot(E + STORE.occurrences, occKey(id, leaf)), 'Lifecycle', 'packed', id, leaf);
  }
  for (const id of keys.typeIds) {
    const p = mapSlot(E + STORE.types, id);
    put(core, p, 'Type', 'groupRecordId', id); put(core, p + 1n, 'Type', 'memberIndex|typeOrdinal|admittedAtOrdinal', id); put(core, p + 2n, 'Type', 'cacheBytes(head)|cacheCode', id);
    for (let i = 0n; i < 256n; i++) put(core, dataSlot(p + 2n) + i, 'Type', 'cacheBytes[data]', id, Number(i));
  }
  for (const id of keys.principalIds) {
    put(core, mapSlot(E + STORE.principals, id), 'Principal', 'principalOrdinal|firstAdmissionOrdinal', id);
    put(core, mapSlot(AUTHORITY_SLOT, id), 'Authority', 'principalAccount', id);
    put(core, mapSlot(AUTHORITY_SLOT + 1n, id), 'Authority', 'principalNonce', id);
  }
  for (const key of keys.bindingKeys) { const p = mapSlot(E + STORE.bindings, key); put(core, p, 'Binding', 'meta', key); put(core, p + 1n, 'Binding', 'target', key); }
  for (const key of keys.postingKeys) {
    put(core, mapSlot(E + STORE.postings, key), 'Posting', 'head', key);
    const inner = mapSlot(E + STORE.postingWords, key);
    for (let w = 0n; w < 256n; w++) put(core, mapSlot(inner, w), 'Word', 'word', key, Number(w)); // five 48-bit ordinals per word: 1,280 postings per key
  }
  const n = k => BigInt(keys.counts[k]);
  for (let i = 1n; i <= n('admissions') + 64n; i++) { const p = mapSlot(E + STORE.admissions, i); put(core, p, 'Admission', 'envelopeId', null, Number(i)); put(core, p + 1n, 'Admission', 'packed', null, Number(i)); }
  for (let i = 1n; i <= n('batches') + 16n; i++) { const p = mapSlot(E + STORE.batches, i); put(core, p, 'Batch', 'meta', null, Number(i)); put(core, p + 1n, 'Batch', 'authorityBasis', null, Number(i)); put(core, p + 2n, 'Batch', 'authorityCodehash', null, Number(i)); }
  const indexes = [['recordIds', 'RecordId', 'records'], ['envelopeIds', 'EnvelopeId', 'envelopes'], ['typeIds', 'TypeId', 'types'], ['principalIds', 'PrincipalId', 'principals'], ['postingKeys', 'PostingKey', 'postingKeys'], ['bindingKeys', 'BindingKey', 'bindingKeys']];
  for (const [field, kind, count] of indexes) for (let i = 1n; i <= n(count) + 64n; i++) put(core, mapSlot(E + STORE[field], i), kind, 'id', null, Number(i));
  // Control / presentation / ERC-1967 (reads only on the measured path).
  for (const [name, off] of [['initialized|controller', 0n], ['peer', 1n], ['expectedAdmin', 2n], ['operator', 3n], ['treeType', 4n]]) put(core, CONTROL_SLOT + off, 'Control', name);
  put(core, PRESENTATION_SLOT, 'Presentation', 'migrated'); put(core, PRESENTATION_SLOT + 1n, 'Presentation', 'label');
  put(core, IMPLEMENTATION_SLOT, 'ERC1967', 'implementation'); put(core, ADMIN_SLOT, 'ERC1967', 'admin');
  // Carrier: chunk store keyed by ChunkTree record ids (any record id is a candidate tree id).
  if (extra.carrier) {
    const carrier = extra.carrier.toLowerCase();
    for (const [name, off] of [['initialized|controller', 0n], ['peer', 1n], ['expectedAdmin', 2n], ['operator', 3n], ['treeType', 4n]]) put(carrier, CONTROL_SLOT + off, 'Control', name);
    put(carrier, IMPLEMENTATION_SLOT, 'ERC1967', 'implementation'); put(carrier, ADMIN_SLOT, 'ERC1967', 'admin');
    for (const r of keys.records) {
      const st = mapSlot(CHUNKS_SLOT, r.id);
      put(carrier, st, 'ChunkStatus', 'chunkSize|chunkCount|totalSize|present', r.id); put(carrier, st + 1n, 'ChunkStatus', 'root', r.id);
      const inner = mapSlot(CHUNKS_SLOT + 1n, r.id);
      for (let idx = 0n; idx < 8n; idx++) {
        const head = mapSlot(inner, idx);
        put(carrier, head, 'Chunk', 'data(head)', r.id, Number(idx));
        for (let i = 0n; i < 129n; i++) put(carrier, dataSlot(head) + i, 'Chunk', 'data[word]', r.id, Number(idx) * 1000 + Number(i));
      }
    }
  }
  for (const admin of extra.proxyAdmins ?? []) put(admin, 0n, 'ProxyAdmin', 'owner');
  if (extra.router) {
    const router = extra.router.toLowerCase();
    const names = ['typeIds.objectGenesis', 'typeIds.bindingSet', 'typeIds.bindingTombstone', 'typeIds.directoryEntry', 'typeIds.directoryWhiteout', 'typeIds.fileRevision', 'typeIds.chunkTree', 'typeIds.removalMarker', 'typeIds.tagAssertion', 'purposes.namePurpose', 'purposes.headPurpose', 'purposes.headRole', 'purposes.charterPurpose', 'purposes.removedPurpose', 'purposes.tagPurpose', 'purposes.fileMeaning', 'purposes.directoryMeaning'];
    names.forEach((nm, i) => put(router, BigInt(i), 'Router', nm));
  }
  return map;
}

/**
 * Label posting keys by IndexKeys family: try every preimage the kernel can
 * produce from the known key universe. Returns Map(postingKey -> label).
 */
export function labelPostingKeys(postingKeys, { typeIds, recordIds, principalIds, bindingKeys, envelopeIds, purposes, scalars = [] }) {
  const want = new Set(postingKeys);
  const found = new Map();
  const test = (k, label) => { if (want.has(k) && !found.has(k)) found.set(k, label); };
  const Z = '0x' + '0'.repeat(64);
  for (const t of typeIds) { test(posting(t, 1, 0, Z), { family: 1, typeId: t, note: 'all records of type' }); test(posting(t, 2, 0, Z), { family: 2, typeId: t, note: 'type unique-per-record' }); }
  for (const r of recordIds) test(posting(Z, 3, 0, r), { family: 3, note: 'occurrences of record', value: r });
  for (const p of principalIds) test(posting(Z, 4, 0, p), { family: 4, note: 'records by principal', value: p });
  const targets = [...recordIds];
  for (const e of envelopeIds) for (let leaf = 0; leaf < 8; leaf++) targets.push(occurrenceTarget(e, leaf));
  for (const t of targets) test(posting(Z, 5, 0, t), { family: 5, note: 'references to target', value: t });
  for (const ty of typeIds) for (let role = 0; role < 8; role++) for (const t of targets) { const k = posting(ty, 6, role, t); if (want.has(k)) test(k, { family: 6, typeId: ty, role, note: 'typed reference role -> target', value: t }); }
  for (const ty of typeIds) for (let i = 0; i < 4; i++) for (const s of scalars) test(posting(ty, 7, i, scalar(s)), { family: 7, typeId: ty, index: i, note: 'scalar field index', value: s });
  for (const b of bindingKeys) test(posting(Z, 8, 0, b), { family: 8, note: 'binding history', value: b });
  for (const p of principalIds) for (const purpose of purposes) for (const subject of recordIds) test(posting(Z, 10, 0, scope(p, purpose, subject)), { family: 10, note: 'binding scope', principal: p, purpose, subject });
  return found;
}
