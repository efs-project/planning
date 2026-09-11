import test from 'node:test';
import assert from 'node:assert/strict';

const api = await import('../web/verified-download.mjs').catch(() => ({}));

function qualified(value = {}) {
  return {
    outcome: 'FOUND',
    qualification: { status: 'QUALIFIED', coverage: 'COMPLETE' },
    value: {
      fileId: '0x' + 'ab'.repeat(32),
      revisionId: '0x' + 'cd'.repeat(32),
      bytes: '0x00ff4180',
      totalSize: '4',
      integrity: 'VERIFIED',
      mediaType: 'text/html',
      ...value,
    },
  };
}

function downloadError(result, code, filename = 'file.bin') {
  assert.throws(
    () => api.prepareVerifiedDownload(result, filename),
    error => error?.name === 'VerifiedDownloadError' && error.code === code,
  );
}

test('qualified exact binary becomes inert attachment bytes without content changes', async () => {
  assert.equal(typeof api.prepareVerifiedDownload, 'function', 'verified download helper is available');
  const download = api.prepareVerifiedDownload(qualified(), 'payload.html');
  assert.equal(download.filename, 'payload.html');
  assert.equal(download.mimeType, 'application/octet-stream');
  assert.deepEqual([...download.bytes], [0, 255, 65, 128]);
  assert.equal(download.blob.type, 'application/octet-stream');
  assert.equal(download.blob.size, 4);
  assert.deepEqual([...new Uint8Array(await download.blob.arrayBuffer())], [0, 255, 65, 128]);
});

test('canonical qualified empty content remains a real zero-byte download', async () => {
  const download = api.prepareVerifiedDownload(qualified({ bytes: '0x', totalSize: '0' }), 'empty.txt');
  assert.equal(download.bytes.length, 0);
  assert.equal(download.blob.size, 0);
  assert.equal((await download.blob.arrayBuffer()).byteLength, 0);
});

test('outcome, qualification, completeness and integrity each fail closed', () => {
  downloadError(null, 'INVALID_RESULT');
  downloadError({ ...qualified(), outcome: 'UNKNOWN' }, 'NOT_FOUND');
  downloadError({ ...qualified(), qualification: { status: 'UNAVAILABLE', coverage: 'UNKNOWN' } }, 'UNQUALIFIED_RESULT');
  downloadError({ ...qualified(), qualification: { status: 'QUALIFIED', coverage: 'PARTIAL' } }, 'INCOMPLETE_RESULT');
  downloadError({ ...qualified(), qualification: undefined }, 'UNQUALIFIED_RESULT');
  downloadError({ ...qualified(), value: undefined }, 'INVALID_RESULT');
  downloadError(qualified({ integrity: 'BYTES_UNAVAILABLE', bytes: null }), 'UNVERIFIED_CONTENT');
  downloadError(qualified({ integrity: 'DIGEST_MISMATCH', bytes: null }), 'UNVERIFIED_CONTENT');
});

test('opaque, odd, non-hex and contradictory byte claims refuse rather than becoming empty', () => {
  downloadError(qualified({ bytes: undefined }), 'MALFORMED_BYTES');
  downloadError(qualified({ bytes: 'opaque' }), 'MALFORMED_BYTES');
  downloadError(qualified({ bytes: '0x0' }), 'MALFORMED_BYTES');
  downloadError(qualified({ bytes: '0xgg' }), 'MALFORMED_BYTES');
  downloadError(qualified({ totalSize: '3' }), 'SIZE_MISMATCH');
  downloadError(qualified({ totalSize: 4 }), 'INVALID_SIZE');
  downloadError(qualified({ totalSize: '04' }), 'INVALID_SIZE');
});

test('attachment filename strips path components and controls while bytes stay exact', async () => {
  const download = api.prepareVerifiedDownload(qualified(), '../private\\cache/\u0000report\u007f.bin');
  assert.equal(download.filename, 'report.bin');
  assert.deepEqual([...download.bytes], [0, 255, 65, 128]);
  assert.deepEqual([...new Uint8Array(await download.blob.arrayBuffer())], [0, 255, 65, 128]);
  assert.equal(api.prepareVerifiedDownload(qualified(), '..').filename, 'download.bin');
  assert.equal(api.prepareVerifiedDownload(qualified(), 'folder/').filename, 'download.bin');
});
