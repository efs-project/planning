// Clean-reader OFFLINE verification of an EFS_FILES_EXPORT_V1 bundle.
// Re-derives every commitment independently — no RPC, no cache, no index —
// and labels every claim with what actually establishes it:
//
//   SELF-CONSISTENT      recomputed purely from bytes in THIS bundle (record
//                        ids, chunk trees, the selection graph). This proves
//                        internal integrity only — a fabricated but coherent
//                        bundle also achieves it. The words "exists" or
//                        "on-chain" are deliberately never used at this tier.
//   TRANSCRIPT-ATTESTED  matched against the retained RPC transcript whose
//                        reads are pinned to the declared block. A transcript
//                        is exporter-supplied evidence, not proof: without
//                        state proofs it could be fabricated wholesale, even
//                        around a REAL block hash.
//   ANCHOR-DECLARED      the trust anchor tuple itself (chain id, block,
//                        Core address, mount/subject). This bundle CANNOT
//                        prove its own anchor. The emitted recheck manifest
//                        lets any RPC endpoint you trust replay the consumed
//                        reads — that replay, not this program, is what
//                        upgrades transcript claims to verified ones.
//   NOT-PROVABLE-OFFLINE authorship/admission provenance: author signatures
//                        were checked (if at all) at admission time on-chain
//                        and are not exportable; operator-era admissions are
//                        indistinguishable from author-intent admissions in
//                        record content.
//
// Tampered bytes, substituted ids, missing dependencies, in-bundle
// contradictions (a hidden successor revision, a removal marker over a "live"
// row), unpinned or contradictory evidence and header/hash mismatches FAIL.
// Usage: node scripts/verify-export.mjs <efs-export-*.json> [--recheck-manifest <out.json>]
import { readFileSync, writeFileSync } from 'node:fs';
import { keccak256, AbiCoder, toUtf8Bytes, concat, getBytes, encodeRlp } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';
import { assessRecord, ordinaryRecord, FIXTURE } from '../../2026-09-09-files-reader/files-profile.mjs';

const abi = AbiCoder.defaultAbiCoder();
const file = process.argv[2];
const manifestOut = process.argv.includes('--recheck-manifest') ? process.argv[process.argv.indexOf('--recheck-manifest') + 1] : null;
if (!file) { console.error('usage: node scripts/verify-export.mjs <efs-export.json> [--recheck-manifest <out.json>]'); process.exit(2); }
const bundle = JSON.parse(readFileSync(file, 'utf8'));
if (bundle.kind !== 'EFS_FILES_EXPORT_V1') {
  console.error('not an authenticated EFS export (kind ' + JSON.stringify(bundle.kind) + '); V0 bundles predate the authenticated format and are unverifiable');
  process.exit(1);
}

let pass = 0; const failures = []; let partial = 0; const downgrades = [];
const ok = label => { pass++; console.log('  ok   ' + label); };
const fail = label => { failures.push(label); console.log('  FAIL ' + label); };
const check = (cond, label) => { cond ? ok(label) : fail(label); return cond; };
const hex32 = x => typeof x === 'string' && /^0x[0-9a-f]{64}$/i.test(x);
const bytesOf = x => { try { return typeof x === 'string' ? getBytes(x) : null; } catch { return null; } };

// ---- load-time hygiene: normalize ids, refuse case-duplicate keys ---------
const records = {};
for (const [id, r] of Object.entries(bundle.records ?? {})) {
  const lower = String(id).toLowerCase();
  if (!hex32(lower)) { fail('record key ' + String(id).slice(0, 20) + ': not a 32-byte id'); continue; }
  if (records[lower]) { fail('record ' + lower.slice(0, 14) + '…: duplicate key after case normalization'); continue; }
  records[lower] = r;
}
const content = {};
for (const [id, b] of Object.entries(bundle.content ?? {})) {
  const lower = String(id).toLowerCase();
  if (content[lower] !== undefined) { fail('content ' + lower.slice(0, 14) + '…: duplicate key after case normalization'); continue; }
  if (bytesOf(b) === null) { fail('content ' + lower.slice(0, 14) + '…: malformed bytes'); continue; }
  content[lower] = b;
}

// ---- independent chunk-tree math (re-implemented here on purpose) ----------
const EMPTY_ROOT = keccak256('0x02');
const EMPTY_TREE_BODY = '0x' + '00040000' + '00000000' + '0'.repeat(16) + EMPTY_ROOT.slice(2);
function foldChunks(data, chunkSize) {
  const leaves = [];
  for (let at = 0; at < data.length; at += chunkSize) leaves.push(keccak256(concat(['0x00', data.slice(at, at + chunkSize)])));
  let nodes = leaves;
  while (nodes.length > 1) {
    const next = [];
    for (let i = 0; i < nodes.length; i += 2) next.push(i + 1 < nodes.length ? keccak256(concat(['0x01', nodes[i], nodes[i + 1]])) : nodes[i]);
    nodes = next;
  }
  return { root: nodes[0], count: leaves.length };
}

// ---- SELF-CONSISTENT · records are content-addressed ----------------------
const scopeInfo = bundle.scope ?? {};
console.log('Export of ' + scopeInfo.pathLabel + ' — SHALLOW: subdirectory contents are NOT covered by this bundle');
const decoded = {};
for (const [id, r] of Object.entries(records)) {
  if (!r || !hex32(r.typeId) || bytesOf(r.body) === null) { fail('record ' + id.slice(0, 14) + '…: malformed entry'); continue; }
  if (ordinaryRecord(r.typeId, r.body) !== id) { fail('record ' + id.slice(0, 14) + '…: body does not hash to its id (substituted or tampered)'); continue; }
  const d = assessRecord(id, r.typeId, r.body);
  if (d.status !== 'ACCEPTED') { fail('record ' + id.slice(0, 14) + '…: ' + d.status + ' (' + (d.reason ?? 'not an exact profile record') + ')'); continue; }
  decoded[id] = d;
}
check(Object.keys(decoded).length === Object.keys(records).length && Object.keys(records).length > 0,
  'records: ' + Object.keys(decoded).length + '/' + Object.keys(records).length + ' re-derive their content-addressed ids [SELF-CONSISTENT: coherence, not existence]');
const need = (id, type, label) => {
  const d = id && decoded[String(id).toLowerCase()];
  if (!d) { fail(label + ': required record missing from bundle (' + String(id).slice(0, 14) + '…)'); return null; }
  if (type && d.type !== type) { fail(label + ': record is ' + d.type + ', expected ' + type); return null; }
  return d;
};

// ---- SELF-CONSISTENT · mount chain and the PATH from mount root -----------
const mount = need(scopeInfo.mountId, 'MountDescriptor/1', 'scope mount');
if (mount) {
  const cfg = need(mount.fields.configRef, 'PublicFilesMountConfig/1', 'mount config');
  if (cfg) for (const [label, ref] of [['namespace plan', cfg.fields.namespacePlan], ['content plan', cfg.fields.contentPlan]]) {
    if (ref) need(ref, 'ResolutionPlan/1', label);
  }
  need(scopeInfo.subject, 'ObjectGenesis/1', 'listed subject');
  // The declared path must be a real DirectoryEntry chain from the mount's
  // own root down to the listed subject — otherwise a bundle about one
  // folder could masquerade as another (pathLabel alone proves nothing).
  const chain = Array.isArray(bundle.scope?.pathChain) ? bundle.scope.pathChain : [];
  if (chain.length === 0) {
    if (scopeInfo.subject?.toLowerCase() === mount.fields.rootNode.toLowerCase()) ok('scope: the listed subject IS the mount root (no path chain needed)');
    else { downgrades.push('path identity'); console.log('  --   scope: no path chain included — pathLabel "' + scopeInfo.pathLabel + '" is COSMETIC, the subject\'s location is not established'); }
  } else {
    let at = mount.fields.rootNode.toLowerCase(), okChain = true;
    for (const step of chain) {
      const entry = need(step.entryRecordId, 'DirectoryEntry/1', 'path step ' + step.name);
      if (!entry || entry.fields.parent.toLowerCase() !== at || entry.fields.name !== step.name) { okChain = false; break; }
      at = entry.fields.child.toLowerCase();
    }
    check(okChain && at === scopeInfo.subject?.toLowerCase(),
      'scope: DirectoryEntry chain runs mount root → ' + chain.map(s => s.name).join('/') + ' → listed subject [SELF-CONSISTENT]');
  }
}

// ---- SELF-CONSISTENT · selection graph, content, in-bundle contradictions -
const seenNames = new Set();
const tally = { verified: 0, empty: 0, unavailable: 0, total: 0 };
const liveObjects = new Map(); // objectId -> row name (for contradiction sweep)
const liveRevisions = new Map(); // revisionRecordId -> row name
const liveEntries = new Map(); // entryRecordId -> row name
for (const item of bundle.selection ?? []) {
  const label = item.name + ' (' + item.kind + ')';
  const entry = need(item.entryRecordId, 'DirectoryEntry/1', label);
  const genesis = need(item.objectId, 'ObjectGenesis/1', label);
  if (!entry || !genesis) continue;
  if (!check(entry.fields.parent.toLowerCase() === scopeInfo.subject?.toLowerCase()
    && entry.fields.name === item.name
    && entry.fields.child.toLowerCase() === String(item.objectId).toLowerCase(),
    label + ': entry record binds this subject, name and object [SELF-CONSISTENT]')) continue;
  if (entry.fields.mountOverride) { fail(label + ': mountOverride entries are outside EFS_FILES_EXPORT_V1 scope'); continue; }
  if (seenNames.has(item.name)) { fail(label + ': two live rows claim the same name in one directory'); continue; }
  seenNames.add(item.name);
  // The declared kind is exporter narrative. The ObjectGenesis meaning the
  // bundle already carries is what actually settles file vs directory — and
  // without this, a file could be relabelled a folder to drop its bytes.
  if (!check(genesis.fields.meaning === (item.kind === 'FILE' ? FIXTURE.fileMeaning : FIXTURE.directoryMeaning),
    label + ': ObjectGenesis meaning matches the declared kind [SELF-CONSISTENT]')) continue;
  liveObjects.set(String(item.objectId).toLowerCase(), item.name);
  liveEntries.set(String(item.entryRecordId).toLowerCase(), item.name);
  if (item.kind !== 'FILE') { console.log('  --   ' + item.name + '/: folder — coverage NOT-COVERED (children absent from this shallow bundle)'); continue; }
  tally.total++;
  if (item.integrity !== 'VERIFIED') { partial++; tally.unavailable++; console.log('  --   ' + item.name + ': ' + item.integrity + ' (content explicitly NOT included/verified)'); continue; }
  const revision = need(item.revisionRecordId, 'FileRevision/1', label);
  if (!revision) continue;
  liveRevisions.set(String(item.revisionRecordId).toLowerCase(), item.name);
  // The tree id comes SOLELY from the revision record — never from the
  // selection row (which is exporter narrative).
  const treeId = revision.fields.content.toLowerCase();
  const tree = need(treeId, 'ChunkTree/1', label);
  const bytes = content[treeId];
  if (!tree) continue;
  if (!check(revision.fields.node.toLowerCase() === String(item.objectId).toLowerCase(),
    label + ': revision record binds this object [SELF-CONSISTENT]')) continue;
  if (!check(typeof bytes === 'string', label + ': content bytes present for tree ' + treeId.slice(0, 14) + '…')) continue;
  const { chunkSize, chunkCount, totalSize, merkleRoot } = tree.fields;
  const data = bytesOf(bytes);
  if (totalSize === 0n) {
    // Empty content first: exact canonical tuple, exact canonical body.
    const canonical = chunkSize === 262144 && chunkCount === 0 && merkleRoot === EMPTY_ROOT
      && records[treeId].body.toLowerCase() === EMPTY_TREE_BODY;
    if (!check(canonical, label + ': empty-content record is the exact canonical tuple')) continue;
    if (!check(data.length === 0, label + ': declared empty and the included bytes are empty [SELF-CONSISTENT]')) continue;
    tally.empty++;
  } else {
    const lawful = chunkSize >= 4096 && chunkSize % 4096 === 0 && chunkCount <= 256
      && BigInt(chunkCount) === (totalSize - 1n) / BigInt(chunkSize) + 1n;
    if (!check(lawful, label + ': ChunkTree geometry follows the carrier law (size ' + totalSize + ', ' + chunkCount + ' × ' + chunkSize + ')')) continue;
    if (BigInt(data.length) !== totalSize) { fail(label + ': included bytes are ' + data.length + ', record commits to ' + totalSize); continue; }
    const computed = foldChunks(data, chunkSize);
    // A failed fold must stop this row: nothing below may describe these
    // bytes as proven, and nothing may decode them for display.
    if (!check(computed.count === chunkCount && computed.root === merkleRoot,
      label + ': ' + totalSize + ' bytes re-chunk (by the record\'s own geometry) and fold to the committed root ' + merkleRoot.slice(0, 14) + '… [SELF-CONSISTENT]')) continue;
    if (!check(String(item.totalSize ?? totalSize) === String(totalSize), label + ': declared size matches the ChunkTree commitment')) continue;
    tally.verified++;
  }
  console.log('        currency: bytes proven for revision ' + item.revisionRecordId.slice(0, 14) + '…; that this revision is CURRENT is transcript-attested only');
  // Media type and charset come from the authenticated revision record, not
  // from the exporter's row.
  if ((revision.fields.mediaType ?? '').startsWith('text/') && bytes !== '0x') {
    try { console.log('        text: ' + JSON.stringify(new TextDecoder(revision.fields.charset ?? 'utf-8', { fatal: true }).decode(data)).slice(0, 80)); } catch {}
  }
}
for (const treeId of Object.keys(content)) {
  const used = Object.entries(decoded).some(([rid, d]) => d.type === 'FileRevision/1' && liveRevisions.has(rid) && d.fields.content.toLowerCase() === treeId);
  if (!used) fail('content ' + treeId.slice(0, 14) + '…: bytes present but referenced by no selected revision (orphan content)');
}
// In-bundle contradictions: the bundle's own records must not disprove its
// "current state" story.
for (const [id, d] of Object.entries(decoded)) {
  if (d.type === 'FileRevision/1' && !liveRevisions.has(id)) {
    for (const parent of d.fields.parents ?? []) {
      const name = liveRevisions.get(parent.toLowerCase());
      if (name) fail(name + ': the bundle itself contains a SUCCESSOR revision (' + id.slice(0, 14) + '…) of the revision presented as current');
    }
  }
  if (d.type === 'RemovalMarker/1') {
    const target = d.fields.entry.toLowerCase();
    const name = liveEntries.get(target);
    if (name) fail(name + ': the bundle itself contains a RemovalMarker over the entry presented as live');
  }
  if (d.type === 'DirectoryWhiteout/1') {
    const name = [...liveEntries.entries()].find(([eid]) => decoded[eid]?.fields.name === d.fields.name && decoded[eid]?.fields.parent === d.fields.parent)?.[1];
    if (name) fail(name + ': the bundle itself contains a whiteout over this name');
  }
}

// ---- ANCHOR-DECLARED · the header must at least cohere ---------------------
const trust = bundle.trust ?? {};
let headerVerified = false, headerTimestamp = null;
{
  const h = trust.header;
  const quantity = v => { const b = BigInt(v); if (b === 0n) return '0x'; let x = b.toString(16); if (x.length % 2) x = '0' + x; if (x.startsWith('00')) throw Error('non-minimal quantity'); return '0x' + x; };
  if (!h || !hex32(trust.blockHash)) fail('trust: block header and declared hash present');
  else {
    try {
      const fields = [
        h.parentHash, h.sha3Uncles, h.miner, h.stateRoot, h.transactionsRoot, h.receiptsRoot, h.logsBloom,
        quantity(h.difficulty), quantity(h.number), quantity(h.gasLimit), quantity(h.gasUsed), quantity(h.timestamp),
        h.extraData === '0x' ? '0x' : h.extraData, h.mixHash, h.nonce,
      ];
      for (const key of ['baseFeePerGas', 'withdrawalsRoot', 'blobGasUsed', 'excessBlobGas', 'parentBeaconBlockRoot', 'requestsHash']) {
        if (h[key] !== undefined && h[key] !== null) fields.push(['blobGasUsed', 'excessBlobGas', 'baseFeePerGas'].includes(key) ? quantity(h[key]) : h[key]);
      }
      const computed = keccak256(encodeRlp(fields));
      headerVerified = check(computed === trust.blockHash.toLowerCase() && BigInt(h.number) === BigInt(trust.blockNumber),
        'trust: header re-hashes to the declared block hash at height ' + BigInt(trust.blockNumber) + ' [anti-tamper only: a fully invented-but-coherent header also passes]');
      if (headerVerified) headerTimestamp = Number(BigInt(h.timestamp));
    } catch (e) { fail('trust: UNSUPPORTED_HEADER_SHAPE — header does not RLP-encode cleanly (' + e.message + '); the basis is DECLARED-UNVERIFIED'); }
  }
}

// ---- TRANSCRIPT-ATTESTED · pinned evidence, per-claim matched -------------
const evidence = Array.isArray(bundle.evidence) ? bundle.evidence : [];
const GET_RECORD = keccak256(toUtf8Bytes('getRecord(bytes32)')).slice(0, 10);
let pinned = 0, unpinned = 0, contradictions = 0;
const witnessed = new Set();
const recheck = [];
for (const entry of evidence) {
  if (!entry || typeof entry.method !== 'string' || !Array.isArray(entry.params)) { unpinned++; continue; }
  const blockArg = entry.params.find(p => p && typeof p === 'object' && 'blockHash' in p);
  const isPinned = !!blockArg && blockArg.blockHash?.toLowerCase() === trust.blockHash?.toLowerCase() && blockArg.requireCanonical === true;
  // A STATEFUL read with no canonical pin is not evidence about the declared
  // block at all: it must never witness a record, and must never enter the
  // recheck manifest (replaying it would hit the endpoint's current head).
  if (['eth_call', 'eth_getCode', 'eth_getStorageAt'].includes(entry.method)) {
    if (!isPinned) { unpinned++; continue; }
    pinned++;
  } else if (blockArg) {
    if (isPinned) pinned++; else { unpinned++; continue; }
  }
  if (entry.method === 'eth_call' && typeof entry.params[0]?.data === 'string') recheck.push({ method: entry.method, params: entry.params });
  if (entry.method === 'eth_call' && entry.params[0]?.data?.startsWith(GET_RECORD) && typeof entry.result === 'string') {
    if (entry.params[0].to?.toLowerCase() !== trust.expected?.core?.toLowerCase()) { contradictions++; continue; }
    const id = ('0x' + entry.params[0].data.slice(10, 74)).toLowerCase();
    try {
      const [typeId, body] = abi.decode(['bytes32', 'bytes', 'uint64'], entry.result);
      const held = records[id];
      if (held) {
        if (held.typeId.toLowerCase() !== typeId.toLowerCase() || held.body.toLowerCase() !== body.toLowerCase()) contradictions++;
        else witnessed.add(id);
      }
    } catch { contradictions++; }
  }
}
check(contradictions === 0, 'transcript: no evidence entry contradicts the bundle (' + contradictions + ' contradictions)');
check(unpinned === 0, 'transcript: every stateful read is pinned to the declared block (' + pinned + ' pinned, ' + unpinned + ' not)');
const unbacked = Object.keys(records).filter(id => !witnessed.has(id));
check(unbacked.length === 0 && pinned > 0,
  'transcript: all ' + Object.keys(records).length + ' bundle records are witnessed by pinned reads of the declared Core' + (unbacked.length ? ' — UNBACKED: ' + unbacked.map(u => u.slice(0, 14) + '…').join(', ') : ''));

// ---- coverage axes, each with its true tier -------------------------------
const cov = bundle.coverage ?? {};
if (cov.listing !== 'COMPLETE') { partial++; console.log('  --   listing coverage ' + cov.listing + ' (exporter-reported): the row set is NOT known complete; absence of a name proves nothing'); }
else console.log('  --   listing coverage COMPLETE — EXPORTER-REPORTED. This program cross-checks record existence against the transcript, and nothing else: the reads that would establish listing completeness and revision currency (resolve / getBindingHead / pagePostingsHydrated) are NOT matched here. Replay the recheck manifest to test them.');
if (cov.unresolvedPositions) { partial++; console.log('  --   ' + cov.unresolvedPositions + ' position(s) in this folder were CONFLICT/UNKNOWN at export and are absent from the selection: a complete listing is not a complete set of resolved files'); }
// Coverage counters are recomputed here, never echoed.
check(tally.verified === (cov.content?.verified ?? -1) && tally.empty === (cov.content?.empty ?? -1)
  && tally.unavailable === (cov.content?.unavailable ?? -1) && tally.total === (cov.content?.total ?? -1),
  'content coverage: recomputed ' + tally.verified + ' verified / ' + tally.empty + ' empty / ' + tally.unavailable + ' unavailable of ' + tally.total + ' files matches the bundle\'s own counters');
console.log('  --   authority: NOT-PROVABLE-OFFLINE — principal attribution is transcript-attested; author signatures were checked (if at all) at admission time on-chain and are not exportable; operator-era admissions are indistinguishable from author-intent admissions in record content');

// ---- recheck manifest ------------------------------------------------------
if (manifestOut) {
  writeFileSync(manifestOut, JSON.stringify({
    kind: 'EFS_EXPORT_RECHECK_V1',
    instructions: 'Replay each request against an RPC endpoint YOU trust for the declared chain. Byte-equal results upgrade this bundle\'s TRANSCRIPT-ATTESTED claims to verified-at-that-endpoint. Any difference means the bundle\'s transcript lied.',
    anchor: { chainId: trust.chainId, blockNumber: trust.blockNumber, blockHash: trust.blockHash, core: trust.expected?.core, mountId: scopeInfo.mountId, subject: scopeInfo.subject },
    requests: recheck,
  }, null, 1));
  console.log('  --   recheck manifest written: ' + manifestOut + ' (' + recheck.length + ' replayable reads)');
}

// ---- verdict ---------------------------------------------------------------
console.log('\nWhat each passed check actually establishes:');
console.log('  SELF-CONSISTENT      record ids, chunk trees, path and selection graph cohere INSIDE this bundle (a fabricated coherent bundle also passes this tier)');
console.log('  TRANSCRIPT-ATTESTED  which entries/revisions are current, and record existence — supported by the exporter\'s pinned transcript; NOT proof');
console.log('  ANCHOR-DECLARED      chain ' + trust.chainId + ' · block #' + trust.blockNumber + ' ' + (trust.blockHash ?? '?').slice(0, 18) + '…'
  + (headerTimestamp ? ' (timestamp ' + new Date(headerTimestamp * 1000).toISOString() + ')' : '') + ' · Core ' + (trust.expected?.core ?? '?') + ' · mount ' + (scopeInfo.mountId ?? '?').slice(0, 14) + '…');
console.log('                       chainId has NO in-header representation and is entirely declared. Confirm this block hash, Core address and mount against sources you trust,');
console.log('                       then replay the recheck manifest against your own RPC — that replay, not this program, verifies existence and currency.');
if (downgrades.length) console.log('  DOWNGRADED           ' + downgrades.join('; '));
if (failures.length) {
  console.log('\n' + pass + ' checks passed, ' + failures.length + ' FAILED, ' + partial + ' explicitly partial. NOT verified — do not rely on this bundle.');
  process.exit(1);
}
console.log('\n' + pass + ' checks passed, 0 failed, ' + partial + ' explicitly partial. OFFLINE verification complete relative to the DECLARED anchor above'
  + (partial ? ' (with ' + partial + ' explicitly partial items)' : '') + '. Internal integrity is proven; existence and currency remain transcript-attested until you replay the recheck manifest.');
process.exit(0);
