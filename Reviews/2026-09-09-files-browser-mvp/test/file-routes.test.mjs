import test from 'node:test';
import assert from 'node:assert/strict';

const api = await import('../web/file-routes.mjs').catch(() => ({}));
const FILE = '0x' + 'ab'.repeat(32);
const REVISION = '0x' + 'cd'.repeat(32);

function routeError(fn, code) {
  assert.throws(fn, error => error?.name === 'FilesRouteError' && error.code === code);
}

test('folder routes roundtrip root-relative Unicode and case without normalization', () => {
  assert.equal(typeof api.encodeFilesRoute, 'function', 'route encoder is available');
  assert.equal(typeof api.decodeFilesRoute, 'function', 'route decoder is available');
  const route = { lensId: 'aFirst', pathSegments: ['Photos', '旅行', 'e\u0301'] };
  const hash = api.encodeFilesRoute(route);
  assert.equal(hash, '#/files/v1/aFirst/Photos/%E6%97%85%E8%A1%8C/e%CC%81');
  assert.deepEqual(api.decodeFilesRoute(hash), route);
  assert.notEqual(api.decodeFilesRoute(hash).pathSegments[2], 'é');
});

test('current-file and exact historical routes are distinct and keep the leaf name in the path', () => {
  const current = { lensId: 'bFirst', pathSegments: ['notes', 'Draft.TXT'], fileId: FILE };
  const historical = { ...current, revisionId: REVISION };
  assert.equal(
    api.encodeFilesRoute(current),
    `#/files/v1/bFirst/notes/Draft.TXT?fileId=${FILE}`,
  );
  assert.equal(
    api.encodeFilesRoute(historical),
    `#/files/v1/bFirst/notes/Draft.TXT?fileId=${FILE}&revisionId=${REVISION}`,
  );
  assert.deepEqual(api.decodeFilesRoute(api.encodeFilesRoute(current)), current);
  assert.deepEqual(api.decodeFilesRoute(api.encodeFilesRoute(historical)), historical);
});

test('an empty hash means default boot while versions, keys and IDs are strict', () => {
  assert.equal(api.decodeFilesRoute(''), null);
  routeError(() => api.decodeFilesRoute('#/files/v2/aFirst'), 'UNSUPPORTED_VERSION');
  routeError(() => api.decodeFilesRoute('#/files/v1/union'), 'UNSUPPORTED_LENS');
  routeError(() => api.decodeFilesRoute('#/files/v1/aFirst?future=yes'), 'UNKNOWN_ROUTE_KEY');
  routeError(() => api.decodeFilesRoute(`#/files/v1/aFirst/note?fileId=${FILE}&fileId=${REVISION}`), 'DUPLICATE_ROUTE_KEY');
  routeError(() => api.decodeFilesRoute('#/files/v1/aFirst/note?fileId=0x1234'), 'INVALID_ID');
  routeError(() => api.decodeFilesRoute(`#/files/v1/aFirst/note?revisionId=${REVISION}`), 'REVISION_WITHOUT_FILE');
  routeError(() => api.encodeFilesRoute({ lensId: 'aFirst', pathSegments: [], fileId: FILE }), 'FILE_WITHOUT_PATH');
  routeError(() => api.encodeFilesRoute({ lensId: 'aFirst', pathSegments: ['note'], fileId: FILE, extra: true }), 'UNKNOWN_ROUTE_KEY');
});

test('malformed encoding, traversal, separators, controls and ambiguous empty segments refuse', () => {
  routeError(() => api.decodeFilesRoute('#/files/v1/aFirst/%E0%A4%A'), 'MALFORMED_ENCODING');
  for (const segment of ['.', '..', 'a%2Fb', 'a%5Cb', '%00name', 'a%0Ab']) {
    routeError(() => api.decodeFilesRoute(`#/files/v1/aFirst/${segment}`), 'INVALID_PATH_SEGMENT');
  }
  routeError(() => api.decodeFilesRoute('#/files/v1/aFirst/a//b'), 'INVALID_PATH_SEGMENT');
});

test('sparse path arrays refuse instead of encoding an undecodable empty segment', () => {
  for (const pathSegments of [Array(1), [, 'note'], ['folder', , 'note'], ['folder', ,]]) {
    routeError(() => api.encodeFilesRoute({ lensId: 'aFirst', pathSegments }), 'INVALID_PATH_SEGMENT');
  }
});

test('old and renamed routes remain separate observations and carry no authority claim', () => {
  const oldHash = api.encodeFilesRoute({ lensId: 'exact', pathSegments: ['old.txt'], fileId: FILE });
  const renamedHash = api.encodeFilesRoute({ lensId: 'exact', pathSegments: ['new.txt'], fileId: FILE });
  assert.notEqual(oldHash, renamedHash);
  assert.deepEqual(api.decodeFilesRoute(oldHash), {
    lensId: 'exact', pathSegments: ['old.txt'], fileId: FILE,
  });
  assert.deepEqual(Object.keys(api.decodeFilesRoute(oldHash)).sort(), ['fileId', 'lensId', 'pathSegments']);
});

test('prototype route bounds refuse oversized depth and hash text', () => {
  routeError(() => api.encodeFilesRoute({ lensId: 'aFirst', pathSegments: Array(65).fill('x') }), 'ROUTE_TOO_LARGE');
  routeError(() => api.decodeFilesRoute('#/files/v1/aFirst/' + 'x'.repeat(8_193)), 'ROUTE_TOO_LARGE');
});
