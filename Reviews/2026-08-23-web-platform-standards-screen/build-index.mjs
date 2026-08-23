#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const [browserSpecsRoot, tc39Root, wasmRoot, wasiRoot, outputPath] =
  process.argv.slice(2);

if (!browserSpecsRoot || !tc39Root || !wasmRoot || !wasiRoot || !outputPath) {
  console.error(
    `Usage: ${basename(process.argv[1])} <w3c/browser-specs> <tc39/proposals> <WebAssembly/proposals> <WebAssembly/WASI> <output.tsv>`,
  );
  process.exitCode = 2;
}

function buildIndex() {
  const rows = browserSpecRows(browserSpecsRoot);

  rows.push(
    ...proposalRows(tc39Root, 'TC39-ECMAScript', 'Ecma International', [
      ['README.md', 'active'],
      ['stage-1-proposals.md', 'active'],
      ['stage-0-proposals.md', 'active'],
      ['finished-proposals.md', 'finished'],
      ['inactive-proposals.md', 'inactive'],
    ]),
    ...proposalRows(tc39Root, 'TC39-ECMA-402', 'Ecma International', [
      ['ecma402/README.md', 'active'],
      ['ecma402/stage-0-proposals.md', 'active'],
      ['ecma402/finished-proposals.md', 'finished'],
      ['ecma402/inactive-proposals.md', 'inactive'],
    ]),
    ...proposalRows(wasmRoot, 'WebAssembly-proposal', 'WebAssembly CG/WG', [
      ['README.md', 'active'],
      ['finished-proposals.md', 'finished'],
      ['inactive-proposals.md', 'inactive'],
    ]),
    ...proposalRows(wasiRoot, 'WASI-proposal', 'WASI Subgroup', [
      ['docs/Proposals.md', 'active'],
    ]),
  );

  rows.sort(
    (left, right) =>
      compareText(left.catalog, right.catalog) ||
      compareText(sortStatus(left), sortStatus(right)) ||
      compareText(left.id, right.id),
  );

  const unresolvedProposalUrls = rows.filter(
    (row) => row.relationship === 'supplement' && row.url === 'UNKNOWN_URL',
  );
  if (unresolvedProposalUrls.length) {
    console.error(
      `Unresolved proposal URLs: ${unresolvedProposalUrls.length} (${unresolvedProposalUrls.map((row) => `${row.catalog}:${row.title}`).join(', ')})`,
    );
  }

  const headers = [
    'catalog',
    'id',
    'relationship',
    'url',
    'title',
    'editor_status',
    'proposal_stage',
    'published_status',
    'published_date',
    'published_url',
    'standing',
    'organization',
    'browser_target',
    'series',
    'repository',
    'tests',
    'tags',
    'review_state',
    'source',
    'row_sha256',
  ];
  const tsv = [
    headers.join('\t'),
    ...rows.map((row) =>
      headers.map((header) => escapeTsv(row[header])).join('\t'),
    ),
  ].join('\n');
  writeFileSync(outputPath, `${tsv}\n`);

  const umbrella = rows.filter((row) => row.catalog === 'browser-specs');
  const supplemental = rows.filter((row) => row.catalog !== 'browser-specs');
  console.log(
    JSON.stringify(
      {
        totalCatalogRows: rows.length,
        browserSpecifications: umbrella.length,
        browserOrganizations: countBy(umbrella, 'organization'),
        browserStanding: countBy(umbrella, 'standing'),
        browserEditorStatus: countBy(umbrella, 'editor_status'),
        browserPublishedStatus: countBy(umbrella, 'published_status'),
        supplementalProposalRows: supplemental.length,
        supplementalCatalogs: countBy(supplemental, 'catalog'),
        supplementalStatus: countBy(supplemental, 'proposal_stage'),
        subjectHits: countTags(rows),
      },
      null,
      2,
    ),
  );
}

function browserSpecRows(root) {
  const source = join(root, 'index.json');
  const specs = JSON.parse(readFileSync(source, 'utf8'));

  return specs.map((spec) => {
    const searchable = [
      spec.shortname,
      spec.title,
      spec.shortTitle,
      ...(spec.groups ?? []).map((group) => group.name),
    ].join(' ');
    return {
      catalog: 'browser-specs',
      id: spec.shortname,
      relationship: 'umbrella',
      url: spec.url,
      title: spec.title,
      editor_status: spec.nightly?.status ?? 'UNKNOWN',
      proposal_stage: 'NOT_APPLICABLE',
      published_status: spec.release?.status ?? 'UNKNOWN',
      published_date: spec.release?.date ?? 'UNKNOWN',
      published_url: spec.release?.url ?? 'UNKNOWN',
      standing: spec.standing,
      organization: spec.organization,
      browser_target: (spec.categories ?? []).includes('browser') ? 'yes' : 'no',
      series: spec.series?.shortname ?? '',
      repository: spec.nightly?.repository ?? '',
      tests: spec.tests?.testPaths?.join(',') ?? '',
      tags: tagsFor(searchable).join(','),
      review_state: 'CATALOG_INGESTED',
      source: 'index.json',
      row_sha256: sha256(JSON.stringify(spec)),
    };
  });
}

function proposalRows(root, catalog, organization, files) {
  const rows = [];

  for (const [filename, mode] of files) {
    const source = join(root, filename);
    const text = readFileSync(source, 'utf8');
    const references = referenceDefinitions(text);
    const lines = text.split(/\r?\n/);
    let heading = '';
    let inProposalTable = false;

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);
      if (headingMatch) {
        heading = cleanText(headingMatch[2]);
        inProposalTable = false;
        continue;
      }

      if (!line.trimStart().startsWith('|')) {
        if (line.trim()) inProposalTable = false;
        continue;
      }

      const cells = markdownCells(line);
      const first = cells[0] ?? '';
      if (/^proposal\b/i.test(cleanText(first))) {
        inProposalTable = true;
        continue;
      }
      if (!inProposalTable || /^:?-{3,}:?$/.test(first.trim())) continue;

      const title = cleanText(first);
      if (!title) continue;
      const url = resolveFirstLink(first, references) || 'UNKNOWN_URL';
      const proposalStage = proposalStatus(mode, heading, filename);
      const standing =
        mode === 'inactive'
          ? 'discontinued'
          : mode === 'finished'
            ? 'good'
            : 'pending';
      const searchable = title;

      rows.push({
        catalog,
        id: `${slug(title)}-${sha256(`${filename}\n${line}`).slice(0, 8)}`,
        relationship: 'supplement',
        url,
        title,
        editor_status: 'NOT_APPLICABLE',
        proposal_stage: proposalStage,
        published_status: 'NOT_APPLICABLE',
        published_date: 'NOT_APPLICABLE',
        published_url: 'NOT_APPLICABLE',
        standing,
        organization,
        browser_target: catalog.startsWith('TC39') ? 'language' : 'portable-runtime',
        series: '',
        repository: url.startsWith('https://github.com/') ? url : '',
        tests: '',
        tags: tagsFor(searchable).join(','),
        review_state: 'CATALOG_INGESTED',
        source: relative(root, source),
        row_sha256: sha256(line),
      });
    }
  }

  return deduplicateRows(rows);
}

function proposalStatus(mode, heading, filename) {
  if (mode === 'inactive') return 'Inactive/withdrawn';
  if (mode === 'finished') {
    if (/\b(20\d{2}|ES\d{4})\b/i.test(heading)) return `Finished (${heading})`;
    return 'Finished/standardized';
  }

  const phase = heading.match(/\b(?:Stage|Phase)\s+(?:0|1|2(?:\.7)?|3|4|5)\b/i);
  if (phase) return phase[0].replace(/^./, (character) => character.toUpperCase());
  if (filename.includes('stage-1')) return 'Stage 1';
  if (filename.includes('stage-0')) return 'Stage 0';
  return 'Active proposal';
}

function referenceDefinitions(text) {
  const result = new Map();
  const pattern = /^\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm;
  for (const match of text.matchAll(pattern)) {
    result.set(match[1].toLowerCase(), match[2]);
  }
  return result;
}

function resolveFirstLink(markdown, references) {
  const inline = markdown.match(/\[[^\]]+\]\((https?:\/\/[^)\s]+)[^)]*\)/i);
  if (inline) return inline[1];

  const collapsed = markdown.match(/\[([^\]]+)\]\[\]/);
  if (collapsed) return references.get(collapsed[1].toLowerCase()) ?? '';

  const reference = markdown.match(/\[[^\]]+\]\[([^\]]+)\]/);
  if (reference) return references.get(reference[1].toLowerCase()) ?? '';

  const spacedReference = markdown.match(/\[[^\]]+\]\s+\[([^\]]+)\]/);
  if (spacedReference) {
    return references.get(spacedReference[1].toLowerCase()) ?? '';
  }

  const bare = markdown.match(/https?:\/\/[^\s<>)]+/i);
  return bare?.[0] ?? '';
}

function markdownCells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim());
}

function cleanText(value) {
  return value
    .replace(/<br\s*\/?>/gi, ' / ')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\((?:[^()]|\([^)]*\))*\)/g, '$1')
    .replace(/\[([^\]]+)\]\[\]/g, '$1')
    .replace(/\[([^\]]+)\]\[[^\]]+\]/g, '$1')
    .replace(/\[([^\]]+)\]\s+\[[^\]]+\]/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/&nbsp;|&#8209;/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function deduplicateRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = `${row.catalog}\n${row.url || row.title}\n${sortStatus(row)}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const tagPatterns = new Map([
  ['document-ui', /\b(html|dom|css|selector|layout|custom element|shadow|dialog|popover|view transition|animation)\b/i],
  ['navigation-loading', /\b(fetch|url|navigation|preload|loading|resource|compression|stream|cache|service worker)\b/i],
  ['storage-files', /\b(storage|indexeddb|database|file system|filesystem|opfs|clipboard|file handling|bucket)\b/i],
  ['security-privacy', /\b(security|privacy|csp|trusted type|permission|credential|authentication|origin|crypto|sandbox|referrer)\b/i],
  ['accessibility-i18n', /\b(accessib|wai|wcag|aria|aam|accname|apg|international|unicode|bidi|locale|language|translation|message ?format|cldr|bcp 47|intl|uax|uts)\b/i],
  ['execution-modules', /\b(javascript|ecmascript|javascript module|ecmascript module|module script|import|worker|webassembly|wasm|component model|wasi|compartment|realm)\b/i],
  ['graphics-media', /\b(audio|video|image|codec|canvas|gpu|webgl|media|xr|font|color)\b/i],
  ['network-realtime', /\b(http|websocket|webtransport|webrtc|network|socket|rtc)\b/i],
  ['device-input', /\b(pointer|keyboard|touch|sensor|device|usb|hid|serial|bluetooth|nfc|gamepad|orientation|geolocation)\b/i],
  ['performance-observability', /\b(performance|timing|scheduler|scheduling|memory|reporting|observer)\b/i],
  ['installed-offline', /\b(manifest|service worker|offline|install|launch handler|share target|file handling|badge)\b/i],
  ['agents-ml', /\b(agent|machine learning|neural|webnn|inference|webmcp|model)\b/i],
]);

function tagsFor(text) {
  return [...tagPatterns.entries()]
    .filter(([, pattern]) => pattern.test(text))
    .map(([tag]) => tag);
}

function countBy(rows, field) {
  return Object.fromEntries(
    Object.entries(
      rows.reduce((counts, row) => {
        const key = row[field] || '(none)';
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      }, {}),
    ).sort(([left], [right]) => compareText(left, right)),
  );
}

function countTags(rows) {
  const counts = {};
  for (const row of rows) {
    for (const tag of row.tags.split(',').filter(Boolean)) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => compareText(left, right)),
  );
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sortStatus(row) {
  return row.proposal_stage === 'NOT_APPLICABLE'
    ? row.editor_status
    : row.proposal_stage;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function slug(value) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72) || 'proposal';
}

function escapeTsv(value) {
  return String(value ?? '').replace(/[\t\r\n]+/g, ' ').trim();
}

if (browserSpecsRoot && tc39Root && wasmRoot && wasiRoot && outputPath) {
  buildIndex();
}
