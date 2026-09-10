// EFS_FILES_EXPORT_V1 assembly: collects the full record/selection/content
// chain plus the scope's raw RPC transcript into one offline-verifiable
// bundle. Assembly is NOT verification — scripts/verify-export.mjs re-derives
// everything independently; this module only gathers and labels honestly.
import { keccak256 } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js';
import { assessRecord, ordinaryRecord, TYPES, FIXTURE } from '../../2026-09-09-files-reader/files-profile.mjs';

export const EXPORT_KIND = 'EFS_FILES_EXPORT_V1';

// acquireRecord: async id => {status:'OK', values:[typeId, body, ordinal]} —
// the caller decides serialization/budgets (the browser routes through its
// acquire queue; tests call the scope directly).
export async function assembleExport({
  acquireRecord, openFileById, sealScope, resolveEntry = null,
  rows, listingCoverage, unresolvedPositions = 0, basis, header, chainId, expected,
  mountId, subject, pathLabel, planId, pathChain = [],
}) {
  const records = {};
  async function collect(id, expectType) {
    const lower = id.toLowerCase();
    if (!records[lower]) {
      const r = await acquireRecord(id);
      if (r.status !== 'OK' || r.values[2] === 0n) throw Error('record unavailable during export: ' + id);
      const [typeId, body] = r.values;
      if (ordinaryRecord(typeId, body) !== lower) throw Error('transport returned a record that does not hash to its id: ' + id);
      records[lower] = { typeId, body };
    }
    const decoded = assessRecord(lower, records[lower].typeId, records[lower].body);
    if (decoded.status !== 'ACCEPTED') throw Error('record ' + id + ' did not decode: ' + (decoded.reason ?? decoded.status));
    if (expectType && decoded.type !== expectType) throw Error('record ' + id + ' is ' + decoded.type + ', expected ' + expectType);
    return decoded;
  }

  // Mount chain: descriptor -> config -> plans, plus the listed subject node.
  const mount = await collect(mountId, 'MountDescriptor/1');
  const config = await collect(mount.fields.configRef, 'PublicFilesMountConfig/1');
  for (const planRef of [config.fields.namespacePlan, config.fields.contentPlan, config.fields.metadataPlan]) {
    if (planRef) await collect(planRef, 'ResolutionPlan/1');
  }
  await collect(subject, 'ObjectGenesis/1');

  // The declared path as a verifiable DirectoryEntry chain from the mount's
  // root down to the listed subject (empty when the subject IS the root).
  const chainOut = [];
  let at = mount.fields.rootNode;
  for (const step of pathChain) {
    if (!resolveEntry) throw Error('a non-root export needs resolveEntry to authenticate its path');
    const entryId = await resolveEntry(at, step.name);
    const entry = await collect(entryId, 'DirectoryEntry/1');
    if (entry.fields.parent.toLowerCase() !== at.toLowerCase() || entry.fields.name !== step.name) throw Error('path step disagrees with its entry record: ' + step.name);
    chainOut.push({ name: step.name, entryRecordId: entryId.toLowerCase() });
    at = entry.fields.child;
  }
  if (at.toLowerCase() !== subject.toLowerCase()) throw Error('the path chain does not reach the listed subject');

  const selection = [];
  const content = {};
  const contentCoverage = { verified: 0, empty: 0, unavailable: 0, total: 0 };
  for (const row of rows) {
    const entry = await collect(row.selectedId, 'DirectoryEntry/1');
    const genesis = await collect(row.value.nodeId, 'ObjectGenesis/1');
    // Kind is taken from the authenticated genesis record, not the row.
    const kind = genesis.fields.meaning === FIXTURE.fileMeaning ? 'FILE'
      : genesis.fields.meaning === FIXTURE.directoryMeaning ? 'DIRECTORY' : null;
    if (!kind) throw Error('object has no recognised meaning and cannot be exported: ' + row.value.name);
    if (kind !== row.value.kind) throw Error('listing row kind disagrees with the object genesis: ' + row.value.name);
    const item = {
      name: row.value.name, kind, fieldRole: row.fieldRole,
      entryRecordId: row.selectedId.toLowerCase(), objectId: row.value.nodeId.toLowerCase(),
    };
    if (entry.fields.child.toLowerCase() !== item.objectId) throw Error('listing row disagrees with its own entry record: ' + row.value.name);
    // Refuse at EXPORT exactly what the verifier refuses, with a name
    // attached — never hand back a download that cannot verify.
    if (entry.fields.mountOverride) throw Error('mountOverride placements are outside EFS_FILES_EXPORT_V1: ' + row.value.name);
    if (kind === 'FILE') {
      contentCoverage.total++;
      const file = await openFileById(row.value.nodeId);
      if (file.outcome === 'FOUND' && file.value.integrity === 'VERIFIED') {
        item.revisionRecordId = file.value.revisionId.toLowerCase();
        const revision = await collect(file.value.revisionId, 'FileRevision/1');
        item.treeId = revision.fields.content.toLowerCase();
        await collect(revision.fields.content, 'ChunkTree/1');
        content[item.treeId] = file.value.bytes;
        item.integrity = 'VERIFIED';
        item.mediaType = file.value.mediaType; item.charset = file.value.charset;
        item.totalSize = file.value.totalSize;
        if (file.value.bytes === '0x') contentCoverage.empty++; else contentCoverage.verified++;
      } else {
        // Explicit downgrade: listed but bytes not currently obtainable.
        item.integrity = file.outcome === 'FOUND' ? file.value.integrity : 'UNRESOLVED';
        contentCoverage.unavailable++;
      }
    }
    selection.push(item);
  }

  // The FULL transcript, sealed after every export read has landed.
  const seal = await sealScope();
  if (seal.status !== 'SEALED') throw Error('scope could not seal the export transcript: ' + (seal.reason ?? 'unsealed'));

  return {
    kind: EXPORT_KIND,
    exportedAt: null, // caller stamps outside deterministic contexts
    trust: {
      // The DECLARED external anchor. The bundle cannot prove this anchor;
      // a verifier reports everything as conditional on it.
      chainId, blockNumber: String(basis.blockNumber), blockHash: basis.blockHash,
      executionSetId: basis.executionSetId, revision: String(basis.revision),
      header, expected: { core: expected.core, carrier: expected.carrier, source: expected.source },
    },
    scope: { mountId: mountId.toLowerCase(), subject: subject.toLowerCase(), pathLabel, pathChain: chainOut, planId, shallow: true },
    coverage: {
      listing: listingCoverage,
      // Positions that were CONFLICT/UNKNOWN at export: a COMPLETE listing is
      // not the same as a fully resolved one, and dropping them silently
      // would let an export imply those files do not exist.
      unresolvedPositions,
      content: contentCoverage,
      evidence: { entries: seal.evidence.length, sealed: true },
    },
    selection, records, content,
    evidence: seal.evidence,
  };
}

// Profile constants a caller may need without pulling the whole reader.
export { TYPES, ordinaryRecord, keccak256 };
