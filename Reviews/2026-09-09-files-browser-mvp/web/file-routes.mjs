// Local prototype location state. A decoded route is a request to resolve a
// path under the configured mount; it is never ancestry, identity, or write
// authority evidence.
const PREFIX = '#/files/v1';
const LENSES = new Set(['aFirst', 'bFirst', 'exact']);
const ROUTE_KEYS = new Set(['lensId', 'pathSegments', 'fileId', 'revisionId']);
const QUERY_KEYS = new Set(['fileId', 'revisionId']);
const ID = /^0x[0-9a-fA-F]{64}$/;
const CONTROLS = /[\u0000-\u001f\u007f-\u009f]/u;

export const MAX_ROUTE_SEGMENTS = 64;
export const MAX_ROUTE_CHARACTERS = 8_192;

export class FilesRouteError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FilesRouteError';
    this.code = code;
  }
}

function refuse(code, message) {
  throw new FilesRouteError(code, message);
}

function decoded(text) {
  try {
    return decodeURIComponent(text);
  } catch {
    refuse('MALFORMED_ENCODING', 'Route contains malformed percent encoding.');
  }
}

function checkLens(lensId) {
  if (!LENSES.has(lensId)) refuse('UNSUPPORTED_LENS', 'Route uses an unsupported Lens key.');
}

function checkSegment(segment) {
  if (typeof segment !== 'string' || segment === '' || segment === '.' || segment === '..'
    || segment.includes('/') || segment.includes('\\') || CONTROLS.test(segment)) {
    refuse('INVALID_PATH_SEGMENT', 'Route contains an invalid path segment.');
  }
  return segment;
}

function checkPath(pathSegments) {
  if (!Array.isArray(pathSegments)) refuse('INVALID_ROUTE', 'pathSegments must be an array.');
  if (pathSegments.length > MAX_ROUTE_SEGMENTS) refuse('ROUTE_TOO_LARGE', 'Route exceeds the prototype depth bound.');
  const checked = [];
  for (let index = 0; index < pathSegments.length; index++) {
    if (!Object.hasOwn(pathSegments, index)) refuse('INVALID_PATH_SEGMENT', 'Route contains a missing path segment.');
    checked.push(checkSegment(pathSegments[index]));
  }
  return checked;
}

function checkId(value) {
  if (typeof value !== 'string' || !ID.test(value)) refuse('INVALID_ID', 'File and revision IDs must be bytes32 hex strings.');
  return value;
}

function checkSelection(pathSegments, fileId, revisionId) {
  if (revisionId !== undefined && fileId === undefined) {
    refuse('REVISION_WITHOUT_FILE', 'An exact revision route requires a File ID.');
  }
  if (fileId !== undefined && pathSegments.length === 0) {
    refuse('FILE_WITHOUT_PATH', 'A File route must retain its root-relative leaf name.');
  }
}

function parseQuery(text) {
  const values = {};
  if (text === undefined) return values;
  if (text === '') refuse('INVALID_ROUTE', 'Route query cannot be empty.');
  for (const item of text.split('&')) {
    const equals = item.indexOf('=');
    if (equals < 1 || equals !== item.lastIndexOf('=')) refuse('INVALID_ROUTE', 'Route query is malformed.');
    const key = decoded(item.slice(0, equals));
    const value = decoded(item.slice(equals + 1));
    if (!QUERY_KEYS.has(key)) refuse('UNKNOWN_ROUTE_KEY', 'Route contains an unknown query key.');
    if (Object.hasOwn(values, key)) refuse('DUPLICATE_ROUTE_KEY', 'Route query keys must be unique.');
    values[key] = value;
  }
  return values;
}

export function encodeFilesRoute(route) {
  if (!route || typeof route !== 'object' || Array.isArray(route)) refuse('INVALID_ROUTE', 'Route must be an object.');
  for (const key of Object.keys(route)) {
    if (!ROUTE_KEYS.has(key)) refuse('UNKNOWN_ROUTE_KEY', 'Route contains an unknown key.');
  }
  checkLens(route.lensId);
  const pathSegments = checkPath(route.pathSegments);
  const fileId = route.fileId === undefined ? undefined : checkId(route.fileId);
  const revisionId = route.revisionId === undefined ? undefined : checkId(route.revisionId);
  checkSelection(pathSegments, fileId, revisionId);

  let hash;
  try {
    hash = `${PREFIX}/${encodeURIComponent(route.lensId)}`
      + (pathSegments.length ? '/' + pathSegments.map(encodeURIComponent).join('/') : '')
      + (fileId === undefined ? '' : `?fileId=${fileId}${revisionId === undefined ? '' : `&revisionId=${revisionId}`}`);
  } catch {
    refuse('MALFORMED_ENCODING', 'Route text cannot be percent encoded.');
  }
  if (hash.length > MAX_ROUTE_CHARACTERS) refuse('ROUTE_TOO_LARGE', 'Route exceeds the prototype character bound.');
  return hash;
}

export function decodeFilesRoute(hash) {
  if (hash === '') return null;
  if (typeof hash !== 'string' || hash.length > MAX_ROUTE_CHARACTERS) {
    refuse(hash?.length > MAX_ROUTE_CHARACTERS ? 'ROUTE_TOO_LARGE' : 'INVALID_ROUTE', 'Route is not valid prototype hash text.');
  }
  const queryAt = hash.indexOf('?');
  const pathText = queryAt < 0 ? hash : hash.slice(0, queryAt);
  const queryText = queryAt < 0 ? undefined : hash.slice(queryAt + 1);
  const parts = pathText.split('/');
  if (parts[0] !== '#' || parts[1] !== 'files' || parts.length < 4) refuse('INVALID_ROUTE', 'Route does not match the Files prototype shape.');
  if (parts[2] !== 'v1') refuse('UNSUPPORTED_VERSION', 'Route uses an unsupported version.');

  const lensId = decoded(parts[3]);
  checkLens(lensId);
  const pathSegments = checkPath(parts.slice(4).map(decoded));
  const query = parseQuery(queryText);
  const fileId = query.fileId === undefined ? undefined : checkId(query.fileId);
  const revisionId = query.revisionId === undefined ? undefined : checkId(query.revisionId);
  checkSelection(pathSegments, fileId, revisionId);

  return Object.freeze({
    lensId,
    pathSegments: Object.freeze(pathSegments),
    ...(fileId === undefined ? {} : { fileId }),
    ...(revisionId === undefined ? {} : { revisionId }),
  });
}
