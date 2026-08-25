import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'build-index.mjs');
const selectedStatusLedger = join(here, 'selected-status-ledger.tsv');

test('keeps editor and published standards maturity in separate columns', () => {
  const fixture = createFixture();

  try {
    const result = runGenerator(fixture);
    assert.equal(result.status, 0, result.stderr);

    const rows = parseTsv(readFileSync(fixture.output, 'utf8'));
    const wcag = rows.find((row) => row.id === 'WCAG22');

    assert.equal(wcag.editor_status, "Editor's Draft");
    assert.equal(wcag.proposal_stage, 'NOT_APPLICABLE');
    assert.equal(wcag.published_status, 'Recommendation');
    assert.equal(wcag.published_date, '2024-12-12');
    assert.equal(wcag.published_url, 'https://www.w3.org/TR/WCAG22/');
    assert.equal(wcag.review_state, 'CATALOG_INGESTED');
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('resolves collapsed proposal links and labels genuinely missing URLs', () => {
  const fixture = createFixture();
  writeFixtureFile(
    fixture.tc39,
    'README.md',
    [
      '# Stage 3',
      '',
      '| Proposal | Champion |',
      '|---|---|',
      '| [Collapsed][] | EFS |',
      '| Unlinked proposal | EFS |',
      '',
      '[Collapsed]: https://example.com/collapsed',
      '',
    ].join('\n'),
  );

  try {
    const result = runGenerator(fixture);
    assert.equal(result.status, 0, result.stderr);

    const rows = parseTsv(readFileSync(fixture.output, 'utf8'));
    const collapsed = rows.find((row) => row.title === 'Collapsed');
    const unlinked = rows.find((row) => row.title === 'Unlinked proposal');

    assert.equal(collapsed.url, 'https://example.com/collapsed');
    assert.equal(unlinked.url, 'UNKNOWN_URL');
    assert.match(result.stderr, /unresolved proposal URLs: 1/i);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('derives discovery tags from semantic metadata rather than catalog boilerplate', () => {
  const fixture = createFixture();
  const browserIndex = join(fixture.browser, 'index.json');
  const browserSpecs = JSON.parse(readFileSync(browserIndex, 'utf8'));
  browserSpecs.push({
    shortname: 'http-cache-fixture',
    title: 'HTTP Cache Fixture',
    url: 'https://datatracker.ietf.org/doc/html/example',
    organization: 'IETF',
    categories: ['browser'],
    groups: [],
    standing: 'pending',
    nightly: { status: 'Internet-Draft' },
  });
  writeFileSync(browserIndex, JSON.stringify(browserSpecs));
  writeFixtureFile(
    fixture.tc39,
    'README.md',
    [
      '# Stage 2',
      '',
      '| Proposal | Champion |',
      '|---|---|',
      '| [Using declarations](https://example.com/using) | EFS |',
      '',
    ].join('\n'),
  );

  try {
    const result = runGenerator(fixture);
    assert.equal(result.status, 0, result.stderr);

    const rows = parseTsv(readFileSync(fixture.output, 'utf8'));
    const wcag = rows.find((row) => row.id === 'WCAG22');
    const http = rows.find((row) => row.id === 'http-cache-fixture');
    const using = rows.find((row) => row.title === 'Using declarations');

    assert.match(wcag.tags, /(?:^|,)accessibility-i18n(?:,|$)/);
    assert.match(http.tags, /(?:^|,)network-realtime(?:,|$)/);
    assert.doesNotMatch(http.tags, /(?:^|,)document-ui(?:,|$)/);
    assert.doesNotMatch(using.tags, /(?:^|,)execution-modules(?:,|$)/);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('pins a dated W3C status snapshot for every product-reviewed W3C row', () => {
  const rows = parseTsv(readFileSync(selectedStatusLedger, 'utf8'));
  const reviewedW3cRows = rows.filter(
    (row) =>
      row.review_state === 'PRODUCT_REVIEWED' &&
      row.primary_url.startsWith('https://www.w3.org/TR/'),
  );

  assert.ok(reviewedW3cRows.length > 0);
  for (const row of reviewedW3cRows) {
    assert.match(
      row.published_or_status_date,
      /^\d{4}-\d{2}-\d{2}$/,
      `${row.surface} lacks an exact W3C status date`,
    );
    const compactDate = row.published_or_status_date.replaceAll('-', '');
    assert.match(
      row.status_snapshot_url,
      new RegExp(
        `^https://www\\.w3\\.org/TR/\\d{4}/(?:NOTE|WD|CRD|CR|PR|REC)-[^/]+-${compactDate}/$`,
      ),
      `${row.surface} lacks its dated W3C This Version URL`,
    );
  }
});

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'efs-web-index-test-'));
  const browser = join(root, 'browser');
  const tc39 = join(root, 'tc39');
  const wasm = join(root, 'wasm');
  const wasi = join(root, 'wasi');
  const output = join(root, 'corpus.tsv');

  for (const directory of [browser, tc39, wasm, join(wasi, 'docs')]) {
    mkdirSync(directory, { recursive: true });
  }

  writeFileSync(
    join(browser, 'index.json'),
    JSON.stringify([
      {
        shortname: 'WCAG22',
        title: 'Web Content Accessibility Guidelines (WCAG) 2.2',
        url: 'https://www.w3.org/TR/WCAG22/',
        organization: 'W3C',
        categories: [],
        groups: [],
        standing: 'good',
        nightly: {
          status: "Editor's Draft",
          repository: 'https://github.com/w3c/wcag',
        },
        release: {
          status: 'Recommendation',
          date: '2024-12-12',
          url: 'https://www.w3.org/TR/WCAG22/',
        },
      },
    ]),
  );

  for (const filename of [
    'README.md',
    'stage-1-proposals.md',
    'stage-0-proposals.md',
    'finished-proposals.md',
    'inactive-proposals.md',
    'ecma402/README.md',
    'ecma402/stage-0-proposals.md',
    'ecma402/finished-proposals.md',
    'ecma402/inactive-proposals.md',
  ]) {
    writeFixtureFile(tc39, filename, '# Empty\n');
  }
  for (const filename of [
    'README.md',
    'finished-proposals.md',
    'inactive-proposals.md',
  ]) {
    writeFixtureFile(wasm, filename, '# Empty\n');
  }
  writeFixtureFile(wasi, 'docs/Proposals.md', '# Empty\n');

  return { root, browser, tc39, wasm, wasi, output };
}

function writeFixtureFile(root, filename, contents) {
  const target = join(root, filename);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function runGenerator(fixture) {
  return spawnSync(
    process.execPath,
    [
      script,
      fixture.browser,
      fixture.tc39,
      fixture.wasm,
      fixture.wasi,
      fixture.output,
    ],
    { encoding: 'utf8' },
  );
}

function parseTsv(contents) {
  const [headerLine, ...lines] = contents.trim().split('\n');
  const headers = headerLine.split('\t');
  return lines.map((line) =>
    Object.fromEntries(
      line.split('\t').map((value, index) => [headers[index], value]),
    ),
  );
}
