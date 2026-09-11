// Browser-portable Files actions SDK for the local prototype router path.
// Five-seam discipline: planning is deterministic and wallet-free; authorize
// signs the exact plan; submit sends the unchanged plan; only canonical
// read-back may claim a committed effect. No unqualified valid/success flags.
// The synthetic operator plan remains bearer Core evidence (not portable
// authorship); the author signature is the router-checked authority.
import { AbiCoder, Interface, keccak256, toUtf8Bytes, ZeroHash } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js';
import { FIXTURE, TYPES, nameRole, positionKey, bindingKey, ordinaryRecord, contentDigest, byteLength, nameAssessment, tagId, assessRecord, lookupName, openTags } from '../../2026-09-09-files-reader/index.mjs';
import { isQualifiedScope } from '../../2026-09-09-files-reader/reader-scope.mjs';

const abi = AbiCoder.defaultAbiCoder();
export const EXTENDED_TYPES = TYPES;
export const KINDS = Object.freeze({ createFile: 1, createDir: 2, edit: 3, renameMove: 4, copy: 5, placement: 6, remove: 7, restore: 8, tag: 9, untag: 10 });

const cat = (...parts) => '0x' + parts.map(p => String(p).replace(/^0x/, '')).join('');
const hash = s => keccak256(toUtf8Bytes(s));
const utf8hex = s => cat(Array.from(new TextEncoder().encode(s), b => b.toString(16).padStart(2, '0')).join(''));
const str = s => { const h = utf8hex(s); return cat(((h.length - 2) / 2).toString(16).padStart(4, '0'), h); };
const option = v => (v ? cat('01', v) : '0x00');
const u16 = n => n.toString(16).padStart(4, '0');
const word = v => typeof v === 'bigint' ? '0x' + v.toString(16).padStart(64, '0') : v;

export const PUBLICATION_TUPLE = 'tuple(bytes32 envelopeId,tuple(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter) header,bytes32[] recordIds,uint64 leafMask,tuple(uint16 leafIndex,bytes32 typeId,bytes body)[] leaves,tuple(uint16 leafIndex,uint32 revision)[] expectedRevisions)';
export const ROUTER_ABI = [
  'function execute(tuple(uint8 kind,bytes32 mountId,bytes32 parent,bytes name,bytes32 sourceParent,bytes sourceName,bytes32 object,bytes32 aux,bytes[] ancestorNames) op,' + PUBLICATION_TUPLE + ' publication,uint32 expectedRevision,uint64 coreNonce,uint64 coreDeadline,bytes operatorSig,uint64 authorNonce,uint64 authorDeadline,bytes authorSig) returns (tuple(bytes32 envelopeId,uint64 envelopeOrdinal,uint64 acceptingBatchId,tuple(uint16 leafIndex,uint8 outcome,uint64 admissionOrdinal)[] leaves))',
  'function claimPrincipal(bytes32 principal)',
  'function authorAccount(bytes32 principal) view returns (address)',
  'function authorNonce(bytes32 principal) view returns (uint64)',
  'error ErrUnauthorizedAuthor(bytes32 principal,address recovered)',
  'error ErrAuthorNonce(bytes32 principal,uint64 expected,uint64 got)',
  'error ErrExpired(uint64 deadline)',
  'error ErrNameMalformed(uint8 code)',
  'error ErrNameUnsupported()',
  'error ErrParentNotDirectory(bytes32 node)',
  'error ErrObjectKind(bytes32 node)',
  'error ErrDestinationOccupied(bytes32 selected)',
  'error ErrDestinationConflict()',
  'error ErrDestinationUnknown(uint8 presence)',
  'error ErrSourceMismatch(uint8 presence,bytes32 selected)',
  'error ErrStaleEdit(bytes32 currentRevision,bytes32 expected)',
  'error ErrTemplate(uint8 leafIndex,uint8 code)',
  'error ErrCycle(bytes32 node)',
  'error ErrWitness(uint8 hop)',
  'error ErrRestoreCollision(bytes32 selected)',
  'error ErrMarkerInactive(bytes32 markerId)',
  'error ErrPrincipalClaimed(bytes32 principal)',
  'error ErrUnknownKind(uint8 kind)',
  'error ErrMountShape()',
];
export const routerInterface = new Interface(ROUTER_ABI);

// ---- publication identity (byte-identical to the admission codec) ----------
export function publicationIds(header, recordIds) {
  const ds = keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32'], [hash('EIP712Domain(string name,string version)'), hash('EFS2-Envelope'), hash('1')]));
  const HEADER = 'tuple(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter)';
  const sh = keccak256(abi.encode(['bytes32', HEADER, 'bytes32'], [hash('PublicationEnvelope(uint16 profile,bytes32 principalId,bytes32 authorityRef,uint64 authEpoch,bytes32 pubNonce,uint64 notAfter,bytes32[] recordIds)'), header, keccak256(cat(...recordIds))]));
  const digest = keccak256(cat('1901', ds, sh));
  return { publicationDigest: digest, envelopeId: keccak256(abi.encode(['bytes32', 'bytes32'], [hash('efs2/envelope/1'), digest])) };
}

function publication(leaves, pubNonce, principal, revisions) {
  const header = { profile: 1, principalId: principal, authorityRef: ZeroHash, authEpoch: 0, pubNonce: word(BigInt(pubNonce)), notAfter: 0 };
  const recordIds = leaves.map(x => ordinaryRecord(x.typeId, x.body));
  const { envelopeId } = publicationIds(header, recordIds);
  return {
    envelopeId, header, recordIds,
    leafMask: leaves.reduce((n, _, i) => n | (1n << BigInt(i)), 0n),
    leaves: leaves.map((l, i) => ({ leafIndex: i, typeId: l.typeId, body: l.body })),
    expectedRevisions: revisions.map(([leafIndex, revision]) => ({ leafIndex, revision })),
  };
}

const leafId = l => ordinaryRecord(l.typeId, l.body);
const occRef = o => (o ? cat(o.envelopeId, u16(o.leafIndex)) : null);

// Binding leaf with CAS row. prior = {revision, occurrence:{envelopeId,leafIndex}}|null
const bind = (purpose, subject, role, target, prior) => ({
  leaf: { typeId: EXTENDED_TYPES['BindingSet/1'], body: cat(purpose, subject, role, '01', target, '00', option(occRef(prior?.occurrence))) },
  revision: prior?.revision ?? 0,
});
const tomb = (purpose, subject, role, prior) => ({
  leaf: { typeId: EXTENDED_TYPES['BindingTombstone/1'], body: cat(purpose, subject, role, '01', occRef(prior.occurrence)) },
  revision: prior.revision,
});

export const CHUNK_SIZE = 4096;
export const MAX_CHUNK_COUNT = 256; // 1 MiB cap at the fixture chunk size
const EMPTY_ROOT = keccak256('0x02');
/** Law-correct ChunkTree builder (C0ChunkTree): 4 KiB chunks, 0x00-prefixed
 *  leaves, 0x01-prefixed pairs, odd node promoted, keccak(0x02) empty. */
export function contentLeaves(bytesHex) {
  const size = byteLength(bytesHex);
  let chunkSize = CHUNK_SIZE, count, root, chunks = [], leaves = [];
  if (size === 0n) {
    chunkSize = 262144; count = 0; root = EMPTY_ROOT;
  } else {
    count = Number((size - 1n) / BigInt(CHUNK_SIZE)) + 1;
    if (count > MAX_CHUNK_COUNT) throw Error('file exceeds the ' + MAX_CHUNK_COUNT + '-chunk prototype cap');
    const raw = bytesHex.slice(2);
    for (let i = 0; i < count; i++) {
      const chunk = '0x' + raw.slice(i * CHUNK_SIZE * 2, (i + 1) * CHUNK_SIZE * 2);
      chunks.push(chunk);
      leaves.push(keccak256(cat('00', chunk)));
    }
    let nodes = [...leaves];
    while (nodes.length > 1) {
      const next = [];
      for (let i = 0; i < nodes.length; i += 2) {
        next.push(i + 1 < nodes.length ? keccak256(cat('01', nodes[i], nodes[i + 1])) : nodes[i]);
      }
      nodes = next;
    }
    root = nodes[0];
  }
  const tree = { typeId: EXTENDED_TYPES['ChunkTree/1'], body: cat(chunkSize.toString(16).padStart(8, '0'), count.toString(16).padStart(8, '0'), size.toString(16).padStart(16, '0'), root) };
  return { tree, treeId: leafId(tree), data: bytesHex, size, chunkCount: count, chunks, leaves, root };
}
export const revisionLeaf = (fileId, treeId, mediaType, charset, parents = []) => ({
  typeId: EXTENDED_TYPES['FileRevision/1'],
  body: cat(fileId, treeId, str(mediaType), charset ? cat('01', str(charset)) : '00', '00', u16(parents.length), ...parents),
});
const objectLeaf = (principal, salt, meaning) => ({ typeId: EXTENDED_TYPES['ObjectGenesis/1'], body: cat(principal, salt, '01', hash('efs2/files/meaning/' + meaning + '/1')) });
const entryLeaf = (parent, name, child) => ({ typeId: EXTENDED_TYPES['DirectoryEntry/1'], body: cat(parent, str(name), child, '00') });
const whiteoutLeaf = (parent, name) => ({ typeId: EXTENDED_TYPES['DirectoryWhiteout/1'], body: cat(parent, str(name)) });

/**
 * Deterministic wallet-free planning. intent.priors carries the current CAS
 * revision + predecessor occurrence for every Binding the operation touches
 * (from readBindingState); absent priors mean fresh (revision 0).
 * Returns {op, publication, predicted} — apps never build masks or CAS rows.
 */
export function planOperation(intent) {
  const { kind, mountId, parent, name, principal, pubNonce, priors = {} } = intent;
  const P = FIXTURE;
  // unsafeSkipNameGate exists ONLY so adversarial tests can prove the router
  // enforces the name profile without the SDK's client-side gate.
  const named = name === undefined || intent.unsafeSkipNameGate ? undefined : nameAssessment(name);
  if (named && named.status !== 'ACCEPTED') return { status: named.status, reason: named.reason };
  const salt = keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32', 'bytes32'], [hash('files-browser/salt/1'), principal, parent ?? ZeroHash, word(BigInt(pubNonce))]));
  const zero = ZeroHash;
  let leaves = [], revisions = [], op = { kind: KINDS[kind], mountId, parent: parent ?? zero, name: name ? utf8hex(name) : '0x', sourceParent: zero, sourceName: '0x', object: zero, aux: zero, ancestorNames: [] };
  const predicted = {};

  if (kind === 'createFile' || kind === 'createDir' || kind === 'copy') {
    const object = objectLeaf(principal, salt, kind === 'createDir' ? 'directory' : 'file');
    const objectId = leafId(object);
    op.object = objectId; predicted.objectId = objectId;
    const charter = bind(P.charterPurpose, objectId, word(1n), objectId);
    leaves = [object, charter.leaf];
    if (kind !== 'createDir') {
      let treeId = intent.treeId, treeLeafIncluded = false;
      if (kind === 'createFile') { const c = contentLeaves(intent.bytesHex); treeId = c.treeId; leaves.push(c.tree); treeLeafIncluded = true; predicted.treeId = treeId; predicted.data = c.data; predicted.content = c; }
      const rev = revisionLeaf(objectId, treeId, intent.mediaType ?? 'text/plain', intent.charset ?? 'utf-8');
      predicted.revisionId = leafId(rev);
      const head = bind(P.headPurpose, objectId, P.headRole, predicted.revisionId);
      leaves.push(rev, head.leaf);
      revisions.push([treeLeafIncluded ? 4 : 3, 0]);
    }
    const entry = entryLeaf(parent, name, objectId);
    predicted.entryId = leafId(entry);
    const nameBind = bind(P.namePurpose, parent, nameRole(name), predicted.entryId, priors.destination);
    leaves.push(entry, nameBind.leaf);
    revisions.unshift([1, 0]);
    revisions.push([leaves.length - 1, nameBind.revision]);
  } else if (kind === 'edit') {
    const c = contentLeaves(intent.bytesHex);
    const rev = revisionLeaf(intent.fileId, c.treeId, intent.mediaType ?? 'text/plain', intent.charset ?? 'utf-8', [intent.priorRevisionId]);
    predicted.treeId = c.treeId; predicted.revisionId = leafId(rev); predicted.data = c.data; predicted.content = c;
    const head = bind(P.headPurpose, intent.fileId, P.headRole, predicted.revisionId, priors.head);
    leaves = [c.tree, rev, head.leaf];
    revisions = [[2, head.revision]];
    op.object = intent.fileId; op.aux = intent.priorRevisionId;
  } else if (kind === 'renameMove') {
    op.object = intent.object; op.sourceParent = intent.sourceParent; op.sourceName = utf8hex(intent.sourceName);
    op.ancestorNames = (intent.ancestorNames ?? []).map(utf8hex);
    const entry = entryLeaf(parent, name, intent.object);
    predicted.entryId = leafId(entry);
    const destBind = bind(P.namePurpose, parent, nameRole(name), predicted.entryId, priors.destination);
    const mask = whiteoutLeaf(intent.sourceParent, intent.sourceName);
    predicted.maskId = leafId(mask);
    const srcBind = bind(P.namePurpose, intent.sourceParent, nameRole(intent.sourceName), predicted.maskId, priors.source);
    leaves = [entry, destBind.leaf, mask, srcBind.leaf];
    revisions = [[1, destBind.revision], [3, srcBind.revision]];
  } else if (kind === 'placement') {
    op.object = intent.object;
    const entry = entryLeaf(parent, name, intent.object);
    predicted.entryId = leafId(entry);
    const nameBind = bind(P.namePurpose, parent, nameRole(name), predicted.entryId, priors.destination);
    leaves = [entry, nameBind.leaf];
    revisions = [[1, nameBind.revision]];
  } else if (kind === 'remove') {
    op.object = intent.object;
    const marker = { typeId: EXTENDED_TYPES['RemovalMarker/1'], body: intent.selectedEntry };
    predicted.markerId = leafId(marker);
    const markerBind = bind(P.removedPurpose, parent, predicted.markerId, predicted.markerId);
    const mask = whiteoutLeaf(parent, name);
    predicted.maskId = leafId(mask);
    const nameBind = bind(P.namePurpose, parent, nameRole(name), predicted.maskId, priors.source);
    leaves = [marker, markerBind.leaf, mask, nameBind.leaf];
    revisions = [[1, 0], [3, nameBind.revision]];
  } else if (kind === 'restore') {
    op.object = intent.object; op.aux = intent.markerId;
    const entry = entryLeaf(parent, name, intent.object);
    predicted.entryId = leafId(entry);
    const nameBind = bind(P.namePurpose, parent, nameRole(name), predicted.entryId, priors.destination);
    const retire = tomb(P.removedPurpose, parent, intent.markerId, priors.marker);
    leaves = [entry, nameBind.leaf, retire.leaf];
    revisions = [[1, nameBind.revision], [2, retire.revision]];
  } else if (kind === 'tag') {
    op.object = intent.object; op.aux = tagId(intent.label);
    const assertion = { typeId: EXTENDED_TYPES['FileTagAssertion/1'], body: cat(op.aux, intent.object) };
    predicted.assertionId = leafId(assertion);
    const tagBind = bind(P.tagPurpose, intent.object, op.aux, predicted.assertionId, priors.tag);
    leaves = [assertion, tagBind.leaf];
    revisions = [[1, tagBind.revision]];
  } else if (kind === 'untag') {
    op.object = intent.object; op.aux = tagId(intent.label);
    const retire = tomb(P.tagPurpose, intent.object, op.aux, priors.tag);
    leaves = [retire.leaf];
    revisions = [[0, retire.revision]];
  } else {
    return { status: 'UNSUPPORTED', reason: 'UNKNOWN_INTENT_KIND' };
  }

  const pub = publication(leaves, pubNonce, principal, revisions);
  return { status: 'PLANNED', op, publication: pub, predicted: { ...predicted, envelopeId: pub.envelopeId, recordIds: pub.recordIds } };
}

export function publicationHash(pub) {
  return keccak256(abi.encode([PUBLICATION_TUPLE], [pub]));
}

// ---- authorization (explicit local test signers; prompts counted by caller)
export async function authorizeAuthor(plan, { authorWallet, router, chainId, authorNonce, deadline }) {
  const pubHash = publicationHash(plan.publication);
  return authorWallet.signTypedData(
    { name: 'EFS Files Router', version: '1', chainId, verifyingContract: router },
    { FilesAction: [
      { name: 'kind', type: 'uint8' }, { name: 'mountId', type: 'bytes32' }, { name: 'parent', type: 'bytes32' },
      { name: 'nameHash', type: 'bytes32' }, { name: 'sourceParent', type: 'bytes32' }, { name: 'sourceNameHash', type: 'bytes32' },
      { name: 'object', type: 'bytes32' }, { name: 'aux', type: 'bytes32' }, { name: 'publicationHash', type: 'bytes32' },
      { name: 'nonce', type: 'uint64' }, { name: 'deadline', type: 'uint64' },
    ] },
    { kind: plan.op.kind, mountId: plan.op.mountId, parent: plan.op.parent, nameHash: keccak256(plan.op.name), sourceParent: plan.op.sourceParent, sourceNameHash: keccak256(plan.op.sourceName), object: plan.op.object, aux: plan.op.aux, publicationHash: pubHash, nonce: authorNonce, deadline },
  );
}
export async function authorizeOperation(plan, ctx) {
  const { authorWallet, operatorWallet, router, core, chainId, executionSetId, coreRevision, coreNonce, authorNonce, deadline } = ctx;
  const pubHash = publicationHash(plan.publication);
  const authorSig = await authorWallet.signTypedData(
    { name: 'EFS Files Router', version: '1', chainId, verifyingContract: router },
    { FilesAction: [
      { name: 'kind', type: 'uint8' }, { name: 'mountId', type: 'bytes32' }, { name: 'parent', type: 'bytes32' },
      { name: 'nameHash', type: 'bytes32' }, { name: 'sourceParent', type: 'bytes32' }, { name: 'sourceNameHash', type: 'bytes32' },
      { name: 'object', type: 'bytes32' }, { name: 'aux', type: 'bytes32' }, { name: 'publicationHash', type: 'bytes32' },
      { name: 'nonce', type: 'uint64' }, { name: 'deadline', type: 'uint64' },
    ] },
    { kind: plan.op.kind, mountId: plan.op.mountId, parent: plan.op.parent, nameHash: keccak256(plan.op.name), sourceParent: plan.op.sourceParent, sourceNameHash: keccak256(plan.op.sourceName), object: plan.op.object, aux: plan.op.aux, publicationHash: pubHash, nonce: authorNonce, deadline },
  );
  const operatorSig = await operatorWallet.signTypedData(
    { name: 'EFS Upgrade Foundation', version: '1', chainId, verifyingContract: core },
    { FixturePlan: [{ name: 'publicationHash', type: 'bytes32' }, { name: 'executionSetId', type: 'bytes32' }, { name: 'nonce', type: 'uint64' }, { name: 'deadline', type: 'uint64' }] },
    { publicationHash: pubHash, executionSetId, nonce: coreNonce, deadline },
  );
  return { ...plan, stage: 'PREPARED', authorSig, operatorSig, coreRevision, coreNonce, authorNonce, deadline, publicationHash: pubHash };
}

export function encodeExecute(prepared) {
  return routerInterface.encodeFunctionData('execute', [
    prepared.op, prepared.publication, prepared.coreRevision, prepared.coreNonce, prepared.deadline,
    prepared.operatorSig, prepared.authorNonce, prepared.deadline, prepared.authorSig,
  ]);
}

export function decodeRouterError(data) {
  try { const e = routerInterface.parseError(data); return e ? { name: e.name, args: [...e.args].map(String) } : null; } catch { return null; }
}

// ---- revision-3 authority: author-signed intents, Core-verified ------------
export const OP_TUPLE = 'tuple(uint8 kind,bytes32 mountId,bytes32 parent,bytes name,bytes32 sourceParent,bytes sourceName,bytes32 object,bytes32 aux,bytes[] ancestorNames)';
export const INTENT_TUPLE = 'tuple(bytes32 opCommitment,bytes32 byteCommitment,address executor,bytes32 executorCodehash,uint64 nonce,uint64 deadline)';
export const ROUTER2_ABI = [
  'function execute(' + OP_TUPLE + ' op,' + PUBLICATION_TUPLE + ' publication,uint32 expectedRevision,' + INTENT_TUPLE + ' intent,bytes authorSig) returns (tuple(bytes32 envelopeId,uint64 envelopeOrdinal,uint64 acceptingBatchId,tuple(uint16 leafIndex,uint8 outcome,uint64 admissionOrdinal)[] leaves))',
  'error ErrRoutedExecutor(address expected)',
  'error ErrOpCommitment(bytes32 expected,bytes32 got)',
  'error ErrByteCommitment(bytes32 expected,bytes32 got)',
  ...ROUTER_ABI.filter(f => f.startsWith('error') && !/ErrUnauthorizedAuthor|ErrAuthorNonce|ErrExpired|ErrPrincipalClaimed/.test(f)),
];
export const router2Interface = new Interface(ROUTER2_ABI);
export const CORE3_ABI = [
  'function claimPrincipal(bytes32 principal)',
  'function principalAccount(bytes32 principal) view returns (address)',
  'function principalNonce(bytes32 principal) view returns (uint64)',
  'function executeAuthorized(' + PUBLICATION_TUPLE + ' publication,uint32 expectedRevision,' + INTENT_TUPLE + ' intent,bytes authorSignature) returns (tuple(bytes32 envelopeId,uint64 envelopeOrdinal,uint64 acceptingBatchId,tuple(uint16 leafIndex,uint8 outcome,uint64 admissionOrdinal)[] leaves))',
  'error ErrPrincipalClaimed(bytes32 principal)',
  'error ErrUnauthorizedPrincipal(bytes32 principal,address recovered)',
  'error ErrIntentNonce(bytes32 principal,uint64 expected,uint64 got)',
  'error ErrIntentExpired(uint64 deadline)',
  'error ErrExecutorBinding(address expected,address sender)',
  'error FixtureAuthorization()',
  'error FixtureRevision()',
];
export const core3Interface = new Interface(CORE3_ABI);
export const CARRIER3_ABI = [
  'function stageChunk(bytes32 treeId,bytes body,uint32 index,bytes chunkData,bytes32[] leaves)',
  'function chunkStatus(bytes32 treeId) view returns (uint32 chunkSize,uint32 chunkCount,uint64 totalSize,uint32 present,bytes32 root)',
  'function hasChunk(bytes32 treeId,uint32 index) view returns (bool)',
  'function readChunk(bytes32 treeId,uint32 index) view returns (bytes)',
  'error ErrChunkTreeShape()',
  'error ErrChunkIndex(uint32 index)',
  'error ErrChunkLeafMismatch(uint32 index)',
  'error ErrChunkImmutable(uint32 index)',
  'error ErrChunkMissing(uint32 index)',
];
export const carrier3Interface = new Interface(CARRIER3_ABI);

export const opCommitmentOf = op => keccak256(abi.encode([OP_TUPLE], [op]));
export const byteCommitmentOf = (treeId, body) => keccak256(abi.encode(['bytes32', 'bytes32'], [treeId, keccak256(body)]));

/** One author signature authorizes the whole operation: publication, exact
 *  op, execution set, byte commitment and — when routed — the executor. */
export async function authorizeIntentV3(plan, { authorWallet, core, chainId, executor, executorCodehash, executionSetId, nonce, deadline, byteCommitment }) {
  const intent = {
    opCommitment: plan.op ? opCommitmentOf(plan.op) : ZeroHash,
    byteCommitment: byteCommitment ?? ZeroHash,
    executor, executorCodehash, nonce, deadline,
  };
  const signature = await authorWallet.signTypedData(
    { name: 'EFS Files Authority', version: '3', chainId, verifyingContract: core },
    { AuthorIntent: [
      { name: 'publicationHash', type: 'bytes32' }, { name: 'executionSetId', type: 'bytes32' },
      { name: 'opCommitment', type: 'bytes32' }, { name: 'byteCommitment', type: 'bytes32' },
      { name: 'executor', type: 'address' }, { name: 'executorCodehash', type: 'bytes32' },
      { name: 'nonce', type: 'uint64' }, { name: 'deadline', type: 'uint64' },
    ] },
    { publicationHash: publicationHash(plan.publication), executionSetId, ...intent },
  );
  return { intent, signature };
}
export function encodeExecuteV2(plan, expectedRevision, intent, signature) {
  return router2Interface.encodeFunctionData('execute', [plan.op, plan.publication, expectedRevision, intent, signature]);
}
export function encodeStageChunk({ treeId, body, index, chunkData, leaves }) {
  return carrier3Interface.encodeFunctionData('stageChunk', [treeId, body, index, chunkData, leaves]);
}
export function decodeAuthorityError(data) {
  for (const iface of [router2Interface, core3Interface, carrier3Interface, routerInterface]) {
    try { const e = iface.parseError(data); if (e) return { name: e.name, args: [...e.args].map(String) }; } catch {}
  }
  return null;
}

// ---- write-support reads at LATEST state (planning needs current heads) ----
// callLatest(to, data) -> result hex, relayed through the labeled write path.
const READ_FRAGMENTS = new Interface([
  'function getBindingHead(bytes32 bindingKey) view returns ((uint8,uint8,uint8,uint32,uint64,bytes32,uint16),bytes32,uint64)',
  'function getOccurrenceByOrdinal(uint64 ordinal) view returns (bytes32,uint16,bytes32,bytes32,bytes32,uint8,uint64)',
  'function currentRevision() view returns (uint32)',
  'function revisionAt(uint32 ordinal) view returns ((uint32,uint64,uint64,address,address,address,address,bytes32,bytes32,address,address,address,address,address,bytes32,address,bytes32,bytes32,bytes32,bytes32,bytes32))',
  'function resolve(bytes32 planRecordId,bytes32 positionKey) view returns ((uint8,uint8,(uint8,bytes32,uint16),uint16,uint16,uint64,uint16,uint16,(bytes32,uint64,uint64,uint8)))',
  'function getRecord(bytes32 recordId) view returns (bytes32,bytes,uint64)',
]);
export const WRITE_SUPPORT_SELECTORS = Object.freeze([
  ...['getBindingHead', 'getOccurrenceByOrdinal', 'currentRevision', 'revisionAt', 'resolve', 'getRecord'].map(n => READ_FRAGMENTS.getFunction(n).selector),
  routerInterface.getFunction('execute').selector,
  routerInterface.getFunction('authorNonce').selector,
  routerInterface.getFunction('authorAccount').selector,
]);
export async function latestBindingState(callLatest, core, { principal, purpose, subject, fieldRole }) {
  const key = bindingKey(principal, purpose, subject, fieldRole);
  const [h] = READ_FRAGMENTS.decodeFunctionResult('getBindingHead', await callLatest(core, READ_FRAGMENTS.encodeFunctionData('getBindingHead', [key])));
  if (h[3] === 0n) return { state: 'UNSET', prior: null, targetA: null };
  const occ = READ_FRAGMENTS.decodeFunctionResult('getOccurrenceByOrdinal', await callLatest(core, READ_FRAGMENTS.encodeFunctionData('getOccurrenceByOrdinal', [h[4]])));
  return { state: h[0] === 1n ? 'ACTIVE' : 'TOMBSTONE', targetA: h[5], prior: { revision: Number(h[3]), occurrence: { envelopeId: occ[0], leafIndex: Number(occ[1]) } } };
}
export async function latestExecution(callLatest, core) {
  const [revision] = READ_FRAGMENTS.decodeFunctionResult('currentRevision', await callLatest(core, READ_FRAGMENTS.encodeFunctionData('currentRevision', [])));
  const [row] = READ_FRAGMENTS.decodeFunctionResult('revisionAt', await callLatest(core, READ_FRAGMENTS.encodeFunctionData('revisionAt', [revision])));
  return { revision: Number(revision), executionSetId: row[20] };
}
export async function latestAuthorNonce(callLatest, router, principal) {
  return BigInt(await callLatest(router, routerInterface.encodeFunctionData('authorNonce', [principal])));
}
export async function latestPrincipalNonce(callLatest, core, principal) {
  return BigInt(await callLatest(core, core3Interface.encodeFunctionData('principalNonce', [principal])));
}
export async function latestPrincipalAccount(callLatest, core, principal) {
  const result = await callLatest(core, core3Interface.encodeFunctionData('principalAccount', [principal]));
  return '0x' + result.slice(26);
}
export async function latestChunkPresence(callLatest, carrier, treeId, chunkCount) {
  const present = [];
  for (let i = 0; i < chunkCount; i++) {
    present.push(BigInt(await callLatest(carrier, carrier3Interface.encodeFunctionData('hasChunk', [treeId, i]))) === 1n);
  }
  return present;
}
// ---- carrier byte staging (separate labeled approval) ----------------------
const CARRIER_FRAGMENTS = new Interface([
  'function stageFixtureBytes(bytes32 treeId,bytes body,bytes data,uint32 expectedRevision,uint64 nonce,uint64 deadline,bytes signature)',
]);
export async function authorizeStage({ operatorWallet, carrier, chainId, treeId, body, data, executionSetId, nonce, deadline }) {
  return operatorWallet.signTypedData(
    { name: 'EFS Upgrade Foundation', version: '1', chainId, verifyingContract: carrier },
    { FixtureBytes: [{ name: 'treeId', type: 'bytes32' }, { name: 'bodyHash', type: 'bytes32' }, { name: 'dataHash', type: 'bytes32' }, { name: 'executionSetId', type: 'bytes32' }, { name: 'nonce', type: 'uint64' }, { name: 'deadline', type: 'uint64' }] },
    { treeId, bodyHash: keccak256(body), dataHash: keccak256(data), executionSetId, nonce, deadline },
  );
}
export function encodeStage({ treeId, body, data, revision, nonce, deadline, signature }) {
  return CARRIER_FRAGMENTS.encodeFunctionData('stageFixtureBytes', [treeId, body, data, revision, nonce, deadline, signature]);
}

// ---- read helpers for priors (through the qualified scope) -----------------
export async function readBindingState(scope, { principal, purpose, subject, fieldRole }) {
  const key = bindingKey(principal, purpose, subject, fieldRole);
  const head = await scope.call('getBindingHead', [key]);
  if (head.status !== 'OK') return { status: 'UNAVAILABLE', reason: head.reason };
  const [h] = head.values;
  if (h[3] === 0n) return { status: 'OK', prior: null, state: 'UNSET' };
  const occ = await scope.call('getOccurrenceByOrdinal', [h[4]]);
  if (occ.status !== 'OK') return { status: 'UNAVAILABLE', reason: occ.reason };
  return {
    status: 'OK', state: h[0] === 1n ? 'ACTIVE' : 'TOMBSTONE', targetA: h[5],
    prior: { revision: Number(h[3]), occurrence: { envelopeId: occ.values[0], leafIndex: Number(occ.values[1]) } },
  };
}

const EFFECT_VERSION = 'EFS_FILES_EFFECT_V1';
const insist = (ok, reason) => { if (!ok) throw Error(reason); };
// JSON object member order is not semantic. Preserve exact own field sets,
// array positions/lengths and value types; never coerce or rewrite the input.
const same = (a, b) => {
  if (Object.is(a, b)) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b) || (Array.isArray(a) && a.length !== b.length)) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => Object.hasOwn(b, key) && same(a[key], b[key]));
};
const exactHex = (v, bytes) => typeof v === 'string' && (bytes ? new RegExp('^0x[0-9a-f]{' + bytes * 2 + '}$') : /^0x(?:[0-9a-f]{2})*$/).test(v);
const uint = (v, bits) => { insist((typeof v === 'number' && Number.isSafeInteger(v)) || typeof v === 'bigint' || (typeof v === 'string' && /^(0|[1-9][0-9]*)$/.test(v)), 'MALFORMED_RECOVERY'); const n = BigInt(v); insist(n >= 0n && n < 1n << BigInt(bits), 'MALFORMED_RECOVERY'); return n; };
const textName = hex => new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(hex.slice(2).match(/../g) ?? [], b => parseInt(b, 16)));

function publicOperation(op) {
  insist(op && Object.values(KINDS).includes(op.kind), 'UNSUPPORTED_OPERATION');
  const out = { kind: op.kind };
  for (const key of ['mountId', 'parent', 'sourceParent', 'object', 'aux']) { insist(exactHex(op[key], 32), 'MALFORMED_RECOVERY'); out[key] = op[key]; }
  for (const key of ['name', 'sourceName']) { insist(exactHex(op[key]) && op[key].length <= 512, 'MALFORMED_RECOVERY'); out[key] = op[key]; }
  insist(Array.isArray(op.ancestorNames) && op.ancestorNames.length <= 64 && op.ancestorNames.every(n => exactHex(n) && n.length <= 512), 'MALFORMED_RECOVERY');
  out.ancestorNames = [...op.ancestorNames];
  return out;
}
function publicPublication(pub) {
  insist(pub && pub.header && Array.isArray(pub.recordIds) && pub.recordIds.length > 0 && pub.recordIds.length <= 7 && pub.recordIds.every(id => exactHex(id, 32)), 'MALFORMED_RECOVERY');
  const h = pub.header;
  insist(h.profile === 1 && exactHex(h.principalId, 32) && exactHex(h.pubNonce, 32) && h.authorityRef === ZeroHash && uint(h.authEpoch, 64) === 0n && uint(h.notAfter, 64) === 0n, 'UNSUPPORTED_PUBLICATION');
  const header = { profile: 1, principalId: h.principalId, authorityRef: h.authorityRef, authEpoch: '0', pubNonce: h.pubNonce, notAfter: '0' };
  const leafMask = uint(pub.leafMask, 64);
  insist(leafMask === (1n << BigInt(pub.recordIds.length)) - 1n, 'PARTIAL_PUBLICATION');
  insist(pub.envelopeId === publicationIds(header, pub.recordIds).envelopeId, 'ENVELOPE_ID_MISMATCH');
  insist(Array.isArray(pub.expectedRevisions) && pub.expectedRevisions.length > 0 && pub.expectedRevisions.length <= pub.recordIds.length, 'MALFORMED_RECOVERY');
  const expectedRevisions = pub.expectedRevisions.map(r => ({ leafIndex: Number(uint(r.leafIndex, 16)), revision: Number(uint(r.revision, 32)) }));
  insist(expectedRevisions.every((r, i) => r.leafIndex < pub.recordIds.length && (!i || r.leafIndex > expectedRevisions[i - 1].leafIndex)), 'MALFORMED_RECOVERY');
  return { envelopeId: pub.envelopeId, header, recordIds: [...pub.recordIds], leafMask: String(leafMask), expectedRevisions };
}
function bindingExpectations(pub, records) {
  const result = [];
  records.forEach((r, leafIndex) => {
    if (!['BindingSet/1', 'BindingTombstone/1'].includes(r.type)) return;
    const row = pub.expectedRevisions.find(row => row.leafIndex === leafIndex);
    insist(row, 'BINDING_REVISION_MISMATCH');
    const f = r.fields;
    insist((row.revision === 0) === (f.predecessor === null), 'BINDING_PREDECESSOR_MISMATCH');
    insist(row.revision < 0xffffffff, 'BINDING_REVISION_MISMATCH');
    result.push({ leafIndex, recordId: pub.recordIds[leafIndex], typeId: r.raw.typeId, purpose: f.purpose, subject: f.subject, fieldRole: f.fieldRole, targetRecord: f.targetRecord ?? null, targetOccurrence: f.targetOccurrence ?? null, predecessor: f.predecessor, revision: row.revision + 1 });
  });
  insist(result.length === pub.expectedRevisions.length, 'BINDING_REVISION_MISMATCH');
  return result;
}

/** Exact public recovery material. No content bytes, credentials, signatures,
 * receipts, claimed basis, or submission authority. It is a request, not proof. */
export function recoveryDescriptor(prepared) {
  const op = publicOperation(prepared?.op), publication = publicPublication(prepared?.publication);
  insist(Array.isArray(prepared.publication.leaves) && prepared.publication.leaves.length === publication.recordIds.length, 'PARTIAL_PUBLICATION');
  const records = prepared.publication.leaves.map((leaf, i) => {
    insist(leaf.leafIndex === i, 'LEAF_INDEX_MISMATCH');
    const r = assessRecord(publication.recordIds[i], leaf.typeId, leaf.body);
    insist(r.status === 'ACCEPTED', 'RECORD_ID_OR_BODY_MISMATCH'); return r;
  });
  const expectedBindings = bindingExpectations(publication, records);
  operationTemplate(op, publication, records);
  const predicted = prepared.predicted;
  if (predicted) {
    const known = { envelopeId: publication.envelopeId, recordIds: publication.recordIds };
    for (const [key, type] of Object.entries({ objectId: 'ObjectGenesis/1', revisionId: 'FileRevision/1', entryId: 'DirectoryEntry/1', treeId: 'ChunkTree/1', maskId: 'DirectoryWhiteout/1', markerId: 'RemovalMarker/1', assertionId: 'FileTagAssertion/1' })) {
      const index = records.findIndex(r => r.type === type);
      if (index >= 0) known[key] = publication.recordIds[index];
    }
    for (const [key, value] of Object.entries(known)) if (Object.hasOwn(predicted, key)) insist(same(predicted[key], value), 'PREDICTION_MISMATCH');
  }
  return { version: EFFECT_VERSION, op, publication, expectedBindings };
}

// Validate semantic correspondence, not merely predicted IDs. Every authored
// Binding and every record in the exact supported template is accounted for.
function operationTemplate(op, pub, records) {
  const P = FIXTURE, ids = pub.recordIds, effects = [];
  const r = (i, type) => { insist(records[i]?.type === type, 'OPERATION_TEMPLATE_MISMATCH'); return records[i].fields; };
  const count = n => insist(records.length === n, 'OPERATION_TEMPLATE_MISMATCH');
  const name = textName(op.name), sourceName = textName(op.sourceName);
  const bindAt = (i, purpose, subject, fieldRole, target, tombstone = false) => {
    const f = r(i, tombstone ? 'BindingTombstone/1' : 'BindingSet/1');
    insist(f.purpose === purpose && f.subject === subject && f.fieldRole === fieldRole && (tombstone || (f.targetRecord === target && f.targetOccurrence === null)), 'BINDING_TARGET_MISMATCH');
  };
  const entry = i => {
    insist(nameAssessment(name).status === 'ACCEPTED', 'UNSUPPORTED_NAME');
    const f = r(i, 'DirectoryEntry/1');
    insist(f.parent === op.parent && f.name === name && f.child === op.object && f.mountOverride === null, 'ENTRY_TARGET_MISMATCH');
    bindAt(i + 1, P.namePurpose, op.parent, nameRole(name), ids[i]);
    effects.push({ kind: 'NAME', parent: op.parent, name, target: ids[i], masked: false });
  };
  const mask = (i, parent, name) => {
    const f = r(i, 'DirectoryWhiteout/1');
    insist(f.parent === parent && f.name === name && nameAssessment(name).status === 'ACCEPTED', 'MASK_TARGET_MISMATCH');
    bindAt(i + 1, P.namePurpose, parent, nameRole(name), ids[i]);
    effects.push({ kind: 'NAME', parent, name, target: ids[i], masked: true });
  };
  const revision = (i, treeIndex, edit = false) => {
    const f = r(i, 'FileRevision/1');
    insist(f.node === op.object && (treeIndex === null || f.content === ids[treeIndex]) && same(f.parents, edit ? [op.aux] : []), 'REVISION_TARGET_MISMATCH');
    if (treeIndex !== null) r(treeIndex, 'ChunkTree/1');
    bindAt(i + 1, P.headPurpose, op.object, P.headRole, ids[i]);
    effects.push({ kind: 'HEAD', target: ids[i], fileId: op.object, treeId: f.content });
  };
  if ([KINDS.createDir, KINDS.createFile, KINDS.copy].includes(op.kind)) {
    count(op.kind === KINDS.createDir ? 4 : op.kind === KINDS.createFile ? 7 : 6);
    const f = r(0, 'ObjectGenesis/1');
    insist(ids[0] === op.object && f.publisher === pub.header.principalId && f.meaning === (op.kind === KINDS.createDir ? P.directoryMeaning : P.fileMeaning), 'OBJECT_TARGET_MISMATCH');
    bindAt(1, P.charterPurpose, op.object, P.charterRole, op.object);
    if (op.kind === KINDS.createDir) entry(2);
    else if (op.kind === KINDS.createFile) { revision(3, 2); entry(5); }
    else { revision(2, null); entry(4); }
  } else if (op.kind === KINDS.edit) { count(3); revision(1, 0, true); }
  else if (op.kind === KINDS.renameMove) { count(4); entry(0); mask(2, op.sourceParent, sourceName); }
  else if (op.kind === KINDS.placement) { count(2); entry(0); }
  else if (op.kind === KINDS.remove) {
    count(4); r(0, 'RemovalMarker/1'); bindAt(1, P.removedPurpose, op.parent, ids[0], ids[0]); mask(2, op.parent, name);
    effects.push({ kind: 'MARKER', markerId: ids[0], parent: op.parent, name });
  } else if (op.kind === KINDS.restore) {
    count(3); entry(0); bindAt(2, P.removedPurpose, op.parent, op.aux, null, true);
    effects.push({ kind: 'MARKER', markerId: op.aux, parent: op.parent });
  } else if (op.kind === KINDS.tag) {
    count(2); const f = r(0, 'FileTagAssertion/1'); insist(f.target === op.object && f.tagId === op.aux, 'TAG_TARGET_MISMATCH');
    bindAt(1, P.tagPurpose, op.object, op.aux, ids[0]);
  } else { count(1); bindAt(0, P.tagPurpose, op.object, op.aux, null, true); }
  return effects;
}

/** Admission is historical; selection is current under the immutable mount.
 * Supersession is NOT rejection. COMMITTED requires both at one sealed basis.
 * Content availability/integrity is deliberately left to the content reader. */
export async function readBackOperation(scope, prepared) {
  const checks = [];
  const unknown = reason => ({ stage: 'READ_BACK', effect: 'UNKNOWN', admission: 'UNKNOWN', selection: 'UNKNOWN', contentAvailability: 'NOT_CHECKED', reason, checks });
  if (!isQualifiedScope(scope)) return unknown('UNQUALIFIED_SCOPE');
  let admission = 'UNKNOWN', selection = 'UNKNOWN', reason, descriptor;
  const call = async (name, args) => { const r = await scope.call(name, args); insist(r.status === 'OK', r.reason ?? 'EVIDENCE_UNAVAILABLE'); return r.values; };
  const basis = (id, H) => insist(id === scope.basis.executionSetId && H === scope.basis.admissionHigh, 'BASIS_MISMATCH');
  const records = new Map();
  const record = async (id, type) => {
    if (!records.has(id)) {
      const [T, body, ordinal] = await call('getRecord', [id]);
      insist(ordinal > 0n && ordinal <= scope.basis.admissionHigh, 'RECORD_UNAVAILABLE');
      const r = assessRecord(id, T, body); insist(r.status === 'ACCEPTED', 'RECORD_ID_OR_BODY_MISMATCH'); records.set(id, r);
    }
    const r = records.get(id); insist(!type || r.type === type, 'RECORD_TYPE_MISMATCH'); return r;
  };
  try {
    if (prepared?.version !== undefined) {
      insist(prepared.version === EFFECT_VERSION && Array.isArray(prepared.expectedBindings), 'MALFORMED_RECOVERY');
      descriptor = { version: EFFECT_VERSION, op: publicOperation(prepared.op), publication: publicPublication(prepared.publication), expectedBindings: structuredClone(prepared.expectedBindings) };
    } else descriptor = recoveryDescriptor(prepared);
    const { op, publication: pub } = descriptor;
    const rs = [];
    for (const id of pub.recordIds) rs.push(await record(id));
    const expected = bindingExpectations(pub, rs);
    insist(same(expected, descriptor.expectedBindings), 'BINDING_EXPECTATION_MISMATCH');
    const effects = operationTemplate(op, pub, rs);
    const occurrences = [];
    for (let i = 0; i < pub.recordIds.length; i++) {
      const o = await call('getOccurrence', [pub.envelopeId, i]);
      insist((o[0] === 1n || o[0] === 2n) && o[1] > 0n && o[1] <= scope.basis.admissionHigh, 'OCCURRENCE_UNAVAILABLE');
      insist(o[2] === pub.recordIds[i] && o[3] === rs[i].raw.typeId && o[4] === pub.header.principalId && (o[0] === 1n ? o[5] === 0n : o[5] > o[1] && o[5] <= scope.basis.admissionHigh), 'OCCURRENCE_IDENTITY_MISMATCH');
      const inverse = await call('getOccurrenceByOrdinal', [o[1]]);
      insist(inverse[0] === pub.envelopeId && inverse[1] === BigInt(i) && inverse[2] === o[2] && inverse[3] === o[3] && inverse[4] === o[4] && inverse[5] === o[0] && inverse[6] === o[5], 'OCCURRENCE_IDENTITY_MISMATCH');
      occurrences.push(o);
    }
    for (const b of expected) {
      const o = occurrences[b.leafIndex], key = bindingKey(pub.header.principalId, b.purpose, b.subject, b.fieldRole);
      const [at, atBasis, atH] = await call('getBindingAtBasis', [key, o[1]]);
      insist(atBasis === scope.basis.executionSetId && atH === o[1], 'BASIS_MISMATCH');
      const matches = h => h[3] === BigInt(b.revision) && h[4] === o[1] && h[6] === 0n && (b.targetRecord ? h[0] === 1n && h[1] === 1n && h[2] === 0n && h[5] === b.targetRecord : h[0] === 2n && h[1] === 0n && h[2] === 1n && h[5] === ZeroHash);
      insist(matches(at), 'BINDING_ADMISSION_MISMATCH');
      const [before, beforeBasis, beforeH] = await call('getBindingAtBasis', [key, o[1] - 1n]);
      insist(beforeBasis === scope.basis.executionSetId && beforeH === o[1] - 1n && before[3] === BigInt(b.revision - 1), 'BINDING_PREDECESSOR_MISMATCH');
      if (b.predecessor) {
        const prev = await call('getOccurrenceByOrdinal', [before[4]]);
        insist(prev[0] === b.predecessor.envelopeId && prev[1] === BigInt(b.predecessor.leafIndex) && prev[4] === pub.header.principalId, 'BINDING_PREDECESSOR_MISMATCH');
      } else insist(before[3] === 0n && before[4] === 0n, 'BINDING_PREDECESSOR_MISMATCH');
      const [head, headBasis, H] = await call('getBindingHead', [key]); basis(headBasis, H);
      insist(head[4] <= H && head[3] >= at[3], 'BINDING_HEAD_MISMATCH');
      const selected = matches(head) && o[0] === 1n;
      checks.push({ label: 'binding', leafIndex: b.leafIndex, recordId: b.recordId, admissionOrdinal: String(o[1]), admission: 'ADMITTED', selection: selected ? 'SELECTED' : 'NOT_SELECTED', ...(selected ? {} : { reason: o[0] === 2n ? 'REVOKED' : 'SUPERSEDED' }) });
    }
    admission = 'ADMITTED';
    // Reuse the reader's mount + historical charter qualification without
    // fetching file content or requiring the author to appear in the Lens.
    const qualified = await openTags(scope, { mountId: op.mountId, nodeId: op.object, tagIds: [] });
    insist(qualified.qualification?.status === 'QUALIFIED' && qualified.outcome === 'FOUND', qualified.reason ?? 'MOUNT_OR_NODE_UNAVAILABLE');
    const mount = (await record(op.mountId, 'MountDescriptor/1')).fields;
    const config = (await record(mount.configRef, 'PublicFilesMountConfig/1')).fields;
    for (const effect of effects) {
      if (effect.kind === 'NAME') {
        const r = await lookupName(scope, { mountId: op.mountId, subject: effect.parent, name: effect.name });
        insist(r.qualification?.status === 'QUALIFIED' && r.outcome !== 'UNKNOWN', r.reason ?? 'LENS_UNKNOWN');
        const selected = r.selectedId === effect.target && r.outcome === (effect.masked ? 'MASKED' : 'FOUND');
        checks.push({ label: 'name', target: effect.target, selection: selected ? 'SELECTED' : 'NOT_SELECTED', ...(selected ? {} : { reason: r.outcome === 'CONFLICT' ? 'CONFLICT' : r.outcome === 'ABSENT' ? 'ABSENT' : 'LENS_NOT_SELECTED' }) });
      } else if (effect.kind === 'HEAD') {
        const [r] = await call('resolve', [config.contentPlan, positionKey(FIXTURE.headPurpose, effect.fileId, FIXTURE.headRole)]);
        basis(r[8][0], r[8][2]); insist(r[8][1] === scope.basis.blockNumber && r[8][3] === 0n, 'BASIS_MISMATCH');
        insist([1n, 2n, 3n].includes(r[0]), 'LENS_UNKNOWN');
        if (r[0] === 1n) {
          insist(r[2][0] === 1n && r[2][2] === 0n, 'HEAD_TARGET_MISMATCH');
          const rev = (await record(r[2][1], 'FileRevision/1')).fields;
          insist(rev.node === effect.fileId, 'REVISION_TARGET_MISMATCH');
        }
        await record(effect.treeId, 'ChunkTree/1');
        const selected = r[0] === 1n && r[2][1] === effect.target;
        checks.push({ label: 'revision', target: effect.target, selection: selected ? 'SELECTED' : 'NOT_SELECTED', ...(selected ? {} : { reason: r[0] === 3n ? 'CONFLICT' : r[0] === 2n ? 'ABSENT' : 'LENS_NOT_SELECTED' }) });
      } else {
        const marker = (await record(effect.markerId, 'RemovalMarker/1')).fields;
        const entry = (await record(marker.entry, 'DirectoryEntry/1')).fields;
        insist(entry.child === op.object && entry.parent === effect.parent && (effect.name === undefined || entry.name === effect.name), 'MARKER_TARGET_MISMATCH');
      }
    }
    selection = checks.every(c => c.selection === 'SELECTED') ? 'SELECTED' : 'NOT_SELECTED';
    reason = checks.find(c => c.reason)?.reason;
  } catch (e) { reason = e.message; selection = 'UNKNOWN'; }
  const seal = await scope.seal();
  if (seal.status !== 'SEALED') { admission = 'UNKNOWN'; selection = 'UNKNOWN'; reason = 'SEAL_FAILED'; }
  return { stage: 'READ_BACK', effect: admission === 'ADMITTED' && selection === 'SELECTED' ? 'COMMITTED' : 'UNKNOWN', admission, selection, contentAvailability: 'NOT_CHECKED', ...(reason ? { reason } : {}), checks, basis: scope.basis, evidence: seal.evidence };
}
