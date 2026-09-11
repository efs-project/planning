// Lean storage-slot attribution for the lab runs: the MVP harness's preimage
// derivation (slots.mjs) sized from ACTUAL heads (record body words, envelope
// words, posting word counts) instead of 256-slot allowances, so a world with
// thousands of records stays in memory; plus the lab's own namespace
// (`efs.lab.index-layer.v1`) and the authority namespace.
import { AbiCoder, keccak256, toUtf8Bytes } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { namespaceSlot, EFS_SLOT, CONTROL_SLOT, PRESENTATION_SLOT, AUTHORITY_SLOT, IMPLEMENTATION_SLOT, ADMIN_SLOT, STORE, mapSlot, dataSlot, occKey, batchRpc, enumerateStoreKeys } from '../../2026-09-09-files-browser-mvp/scripts/measure/lib/slots.mjs';

const abi = AbiCoder.defaultAbiCoder();
const hex32 = v => '0x' + v.toString(16).padStart(64, '0');
const MASK = (1n << 256n) - 1n;
export const LAB_SLOT = namespaceSlot('efs.lab.index-layer.v1');
const bytesWords = head => { const v = BigInt(head); return (v & 1n) ? Number(((v - 1n) / 2n + 31n) / 32n) : 0; };
export const wordKey = (ordinal, scope, bucket) => keccak256(abi.encode(['uint64', 'bytes32', 'bytes32'], [ordinal, scope, bucket]));
export const coverageKey = (ordinal, scope) => keccak256(abi.encode(['uint64', 'bytes32'], [ordinal, scope]));

/**
 * Build 'addr:slot' -> { kind, member, key, index } for the Core (Store, authority,
 * control, lab index layer), the router and proxy admins.
 * lab: { familyOrdinals: [1..k], familyIds: [...], scopes: [...], buckets: [...], typeIds: [...] }
 */
export async function buildLeanSlotMap(url, core, block, { router, carrier, proxyAdmins = [], lab = {}, typeNames = new Map() }) {
  const keys = await enumerateStoreKeys(url, core, block);
  const at = async slots => batchRpc(url, slots.map(s => ({ method: 'eth_getStorageAt', params: [core, hex32(s & MASK), block] })), { chunk: 400 });
  const map = new Map();
  const put = (addr, slot, kind, member, key = null, index = null) => { const k = addr.toLowerCase() + ':' + hex32(slot & MASK); if (!map.has(k)) map.set(k, { kind, member, key, index }); };
  const c = core.toLowerCase();
  const E = EFS_SLOT;
  put(c, E + STORE.counts0, 'Counts', 'records|envelopes|types|principals');
  put(c, E + STORE.counts1, 'Counts', 'admissions|batches|postingKeys|bindingKeys');
  for (const [name, off] of Object.entries(STORE.init)) put(c, E + off, 'Bootstrap', name);
  for (let i = 0n; i < 64n; i++) put(c, dataSlot(E + STORE.init.intrinsicGroupBytes) + i, 'Bootstrap', 'intrinsicGroupBytes[data]', null, Number(i));
  // Records: actual body words, labelled by Type name.
  for (const r of keys.records) {
    const p = mapSlot(E + STORE.records, r.id);
    const tn = typeNames.get(r.typeId) ?? r.typeId.slice(0, 10);
    put(c, p, 'Record:' + tn, 'typeId', r.id); put(c, p + 1n, 'Record:' + tn, 'body(head)', r.id); put(c, p + 2n, 'Record:' + tn, 'recordOrdinal|firstAdmissionOrdinal', r.id);
    const words = bytesWords(r.bodyHead);
    for (let i = 0n; i < BigInt(words); i++) put(c, dataSlot(p + 1n) + i, 'Record:' + tn, 'body[data]', r.id, Number(i));
  }
  // Envelopes: actual canonical bytes words + 8 occurrence leaves.
  const envHeads = await at(keys.envelopeIds.map(id => mapSlot(E + STORE.envelopes, id)));
  keys.envelopeIds.forEach((id, i) => {
    const p = mapSlot(E + STORE.envelopes, id);
    put(c, p, 'Envelope', 'canonicalUnsignedEnvelope(head)', id); put(c, p + 1n, 'Envelope', 'envelopeOrdinal', id);
    const words = bytesWords(envHeads[i]);
    for (let w = 0n; w < BigInt(words); w++) put(c, dataSlot(p) + w, 'Envelope', 'canonicalUnsignedEnvelope[data]', id, Number(w));
    for (let leaf = 0; leaf < 8; leaf++) put(c, mapSlot(E + STORE.occurrences, occKey(id, leaf)), 'Lifecycle', 'packed', id, leaf);
  });
  const typeHeads = await at(keys.typeIds.map(id => mapSlot(E + STORE.types, id) + 2n));
  keys.typeIds.forEach((id, i) => {
    const p = mapSlot(E + STORE.types, id);
    put(c, p, 'Type', 'groupRecordId', id); put(c, p + 1n, 'Type', 'memberIndex|typeOrdinal|admittedAtOrdinal', id); put(c, p + 2n, 'Type', 'cacheBytes(head)', id);
    for (let w = 0n; w < BigInt(bytesWords(typeHeads[i])); w++) put(c, dataSlot(p + 2n) + w, 'Type', 'cacheBytes[data]', id, Number(w));
  });
  for (const id of keys.principalIds) {
    put(c, mapSlot(E + STORE.principals, id), 'Principal', 'principalOrdinal|firstAdmissionOrdinal', id);
    put(c, mapSlot(AUTHORITY_SLOT, id), 'Authority', 'principalAccount', id);
    put(c, mapSlot(AUTHORITY_SLOT + 1n, id), 'Authority', 'principalNonce', id);
  }
  for (const key of keys.bindingKeys) { const p = mapSlot(E + STORE.bindings, key); put(c, p, 'Binding', 'meta', key); put(c, p + 1n, 'Binding', 'target', key); }
  const postingHeads = await at(keys.postingKeys.map(key => mapSlot(E + STORE.postings, key)));
  const familyOf = lab.postingFamilies ?? new Map();
  keys.postingKeys.forEach((key, i) => {
    const fam = familyOf.get(key); const kind = fam ? 'Posting:k' + fam : 'Posting';
    put(c, mapSlot(E + STORE.postings, key), kind, 'head', key);
    const count = Number(BigInt(postingHeads[i]) & ((1n << 64n) - 1n));
    const inner = mapSlot(E + STORE.postingWords, key);
    for (let w = 0n; w < BigInt(Math.floor((count + 4) / 5) + 1); w++) put(c, mapSlot(inner, w), fam ? 'Word:k' + fam : 'Word', 'word', key, Number(w));
  });
  const n = k => BigInt(keys.counts[k]);
  for (let i = 1n; i <= n('admissions') + 64n; i++) { const p = mapSlot(E + STORE.admissions, i); put(c, p, 'Admission', 'envelopeId', null, Number(i)); put(c, p + 1n, 'Admission', 'packed', null, Number(i)); }
  for (let i = 1n; i <= n('batches') + 16n; i++) { const p = mapSlot(E + STORE.batches, i); put(c, p, 'Batch', 'meta', null, Number(i)); put(c, p + 1n, 'Batch', 'authorityBasis', null, Number(i)); put(c, p + 2n, 'Batch', 'authorityCodehash', null, Number(i)); }
  for (const [field, kind, count] of [['recordIds', 'RecordId', 'records'], ['envelopeIds', 'EnvelopeId', 'envelopes'], ['typeIds', 'TypeId', 'types'], ['principalIds', 'PrincipalId', 'principals'], ['postingKeys', 'PostingKey', 'postingKeys'], ['bindingKeys', 'BindingKey', 'bindingKeys']]) {
    for (let i = 1n; i <= n(count) + 64n; i++) put(c, mapSlot(E + STORE[field], i), kind, 'id', null, Number(i));
  }
  for (const [name, off] of [['initialized|controller', 0n], ['peer', 1n], ['expectedAdmin', 2n], ['operator', 3n], ['treeType', 4n]]) put(c, CONTROL_SLOT + off, 'Control', name);
  put(c, PRESENTATION_SLOT, 'Presentation', 'migrated'); put(c, PRESENTATION_SLOT + 1n, 'Presentation', 'label');
  put(c, IMPLEMENTATION_SLOT, 'ERC1967', 'implementation'); put(c, ADMIN_SLOT, 'ERC1967', 'admin');
  // Lab index layer.
  put(c, LAB_SLOT, 'IndexLayer', 'familyCount|detachDelay');
  for (const ord of lab.familyOrdinals ?? []) {
    const p = mapSlot(LAB_SLOT + 1n, BigInt(ord));
    put(c, p, 'IndexFamily', 'id', null, ord); put(c, p + 1n, 'IndexFamily', 'typeId', null, ord); put(c, p + 2n, 'IndexFamily', 'program', null, ord); put(c, p + 3n, 'IndexFamily', 'packed', null, ord);
  }
  for (const id of lab.familyIds ?? []) put(c, mapSlot(LAB_SLOT + 2n, id), 'IndexFamilyOrdinal', 'ordinal', id);
  for (const t of keys.typeIds) put(c, mapSlot(LAB_SLOT + 3n, t), 'IndexTypeFamilies', 'packed', t);
  for (const ord of lab.familyOrdinals ?? []) for (const scope of lab.scopes ?? []) {
    put(c, mapSlot(LAB_SLOT + 4n, coverageKey(ord, scope)), 'IndexCoverage', 'slot', scope, ord);
    for (const bucket of lab.buckets ?? []) {
      const inner = mapSlot(LAB_SLOT + 5n, wordKey(ord, scope, bucket));
      for (let w = 0n; w < BigInt(lab.maxWords ?? 48); w++) put(c, mapSlot(inner, w), 'IndexWord', 'bits', bucket, Number(w));
    }
  }
  if (carrier) { const ca = carrier.toLowerCase(); for (const [name, off] of [['initialized|controller', 0n], ['peer', 1n], ['expectedAdmin', 2n], ['operator', 3n], ['treeType', 4n]]) put(ca, CONTROL_SLOT + off, 'Carrier:Control', name); put(ca, IMPLEMENTATION_SLOT, 'Carrier:ERC1967', 'implementation'); put(ca, ADMIN_SLOT, 'Carrier:ERC1967', 'admin'); }
  for (const admin of proxyAdmins) put(admin, 0n, 'ProxyAdmin', 'owner');
  if (router) {
    const names = ['typeIds.objectGenesis', 'typeIds.bindingSet', 'typeIds.bindingTombstone', 'typeIds.directoryEntry', 'typeIds.directoryWhiteout', 'typeIds.fileRevision', 'typeIds.chunkTree', 'typeIds.removalMarker', 'typeIds.tagAssertion', 'purposes.namePurpose', 'purposes.headPurpose', 'purposes.headRole', 'purposes.charterPurpose', 'purposes.removedPurpose', 'purposes.tagPurpose', 'purposes.fileMeaning', 'purposes.directoryMeaning'];
    names.forEach((nm, i) => put(router.toLowerCase(), BigInt(i), 'Router', nm));
  }
  return { map, keys };
}
