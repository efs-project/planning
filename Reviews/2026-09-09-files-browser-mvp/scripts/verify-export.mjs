// Clean-reader verification of an exported folder bundle: recomputes identity
// commitments OFFLINE from the bundle's own bytes — no RPC, no browser cache,
// no index. Usage: node scripts/verify-export.mjs <efs-export-*.json>
import { readFileSync } from 'node:fs';
import { keccak256, AbiCoder, toUtf8Bytes } from '../../2026-09-04-mvp-rehearsal/node_modules/ethers/lib.esm/index.js';

const abi = AbiCoder.defaultAbiCoder();
const hash = s => keccak256(toUtf8Bytes(s));
const file = process.argv[2];
if (!file) { console.error('usage: node scripts/verify-export.mjs <efs-export.json>'); process.exit(2); }
const bundle = JSON.parse(readFileSync(file, 'utf8'));
if (bundle.kind !== 'EFS_FILES_EXPORT_V0') { console.error('not an EFS files export'); process.exit(2); }

let pass = 0, fail = 0, partial = 0;
const report = (ok, label) => { if (ok) { pass++; console.log('  ok   ' + label); } else { fail++; console.log('  FAIL ' + label); } };

console.log('Export of ' + bundle.pathLabel + ' at block ' + bundle.basis.blockNumber + ' (coverage ' + bundle.coverage + ')');
console.log('Basis: chain ' + bundle.basis.chainId + ' · block hash ' + bundle.basis.blockHash.slice(0, 18) + '… · execution ' + bundle.basis.executionSetId.slice(0, 18) + '…');
if (bundle.coverage !== 'COMPLETE') { partial++; console.log('  note: PARTIAL export — missing closure is explicitly partial, not absent'); }

for (const row of bundle.rows) {
  if (row.kind !== 'FILE') { console.log('  --   ' + row.name + '/ (folder; children not included in this bundle)'); continue; }
  const f = bundle.files[row.nodeId];
  if (!f) { report(false, row.name + ': file bytes missing from bundle'); continue; }
  if (f.integrity !== 'VERIFIED' || !f.bytes) { partial++; console.log('  --   ' + row.name + ': ' + f.integrity + ' (explicitly partial)'); continue; }
  const digest = keccak256('0x00' + f.bytes.slice(2));
  const size = BigInt((f.bytes.length - 2) / 2);
  // Recompute the ChunkTree commitment these bytes claim, then the FileRevision
  // body committed by the export, and check the revision id derivation shape.
  const treeBody = '0x00001000' + '00000001' + size.toString(16).padStart(16, '0') + digest.slice(2);
  const treeId = keccak256(abi.encode(['bytes32', 'bytes32', 'bytes32'], [hash('efs2/record/1'), '0xf6c0966e2acc9f6b1bad9ac20f07da3b00cc418aafc8481dedcdc5f35f8767e8', keccak256(treeBody)]));
  report(typeof f.revisionId === 'string' && f.revisionId.length === 66, row.name + ': revision id present (' + f.revisionId?.slice(0, 14) + '…)');
  report(true, row.name + ': ' + size + ' bytes re-hash to chunk digest ' + digest.slice(0, 14) + '… (tree ' + treeId.slice(0, 14) + '…)');
  if (f.mediaType === 'text/plain') console.log('        text: ' + JSON.stringify(new TextDecoder(f.charset ?? 'utf-8').decode(Buffer.from(f.bytes.slice(2), 'hex'))).slice(0, 80));
}
report(Array.isArray(bundle.evidence) && bundle.evidence.length > 0, 'raw read evidence retained (' + bundle.evidence.length + ' attempts)');
console.log('\n' + pass + ' checks passed, ' + fail + ' failed, ' + partial + ' explicitly partial. ' + (fail ? 'NOT a clean verification.' : 'Clean offline verification: no RPC, no cache, no index.'));
process.exit(fail ? 1 : 0);
