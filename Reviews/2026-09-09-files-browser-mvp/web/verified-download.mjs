// Converts a completed reader result into inert attachment data. This helper
// relies on the reader's VERIFIED result; it does not independently re-hash or
// authenticate app-supplied fields.
const MIME_TYPE = 'application/octet-stream';
const COMPLETE_HEX = /^0x(?:[0-9a-fA-F]{2})*$/;
const DECIMAL_SIZE = /^(?:0|[1-9][0-9]*)$/;
const FILENAME_CONTROLS = /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu;

export class VerifiedDownloadError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'VerifiedDownloadError';
    this.code = code;
  }
}

function refuse(code, message) {
  throw new VerifiedDownloadError(code, message);
}

function attachmentFilename(filename) {
  if (typeof filename !== 'string') return 'download.bin';
  const leaf = filename.split(/[\\/]/u).at(-1).replace(FILENAME_CONTROLS, '');
  return leaf === '' || leaf === '.' || leaf === '..' ? 'download.bin' : leaf;
}

function fromCompleteHex(hex) {
  if (typeof hex !== 'string' || !COMPLETE_HEX.test(hex)) {
    refuse('MALFORMED_BYTES', 'Verified content must contain complete byte-aligned hex.');
  }
  const bytes = new Uint8Array((hex.length - 2) / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
  return bytes;
}

export function prepareVerifiedDownload(result, filename) {
  if (!result || typeof result !== 'object') refuse('INVALID_RESULT', 'A reader result is required.');
  if (result.outcome !== 'FOUND') refuse('NOT_FOUND', 'Only a FOUND File can be downloaded.');
  if (result.qualification?.status !== 'QUALIFIED') refuse('UNQUALIFIED_RESULT', 'The File result is not qualified.');
  if (result.qualification.coverage !== 'COMPLETE') refuse('INCOMPLETE_RESULT', 'The File result is not complete.');
  if (!result.value || typeof result.value !== 'object') refuse('INVALID_RESULT', 'The File result has no value.');
  if (result.value.integrity !== 'VERIFIED') refuse('UNVERIFIED_CONTENT', 'The File bytes are not verified.');
  if (typeof result.value.totalSize !== 'string' || !DECIMAL_SIZE.test(result.value.totalSize)) {
    refuse('INVALID_SIZE', 'The File totalSize must be a strict decimal string.');
  }

  const bytes = fromCompleteHex(result.value.bytes);
  if (BigInt(bytes.byteLength) !== BigInt(result.value.totalSize)) {
    refuse('SIZE_MISMATCH', 'The complete bytes do not match the File totalSize.');
  }
  const safeName = attachmentFilename(filename);
  return Object.freeze({
    bytes,
    filename: safeName,
    mimeType: MIME_TYPE,
    blob: new Blob([bytes], { type: MIME_TYPE }),
  });
}
