#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const [eipsRepo, ercsRepo, outputPath] = process.argv.slice(2);

if (!eipsRepo || !ercsRepo || !outputPath) {
  console.error(
    `Usage: ${basename(process.argv[1])} <ethereum/EIPs checkout> <ethereum/ERCs checkout> <output.tsv>`,
  );
  process.exitCode = 2;
} else {
  buildIndex(eipsRepo, ercsRepo, outputPath);
}

function buildIndex(eipsRoot, ercsRoot, output) {
  const roots = [
    {
      corpus: 'EIP',
      directory: join(eipsRoot, 'EIPS'),
      include: (file) => file.startsWith('eip-') && file.endsWith('.md'),
    },
    {
      corpus: 'ERC',
      directory: join(ercsRoot, 'ERCS'),
      include: (file) =>
        (file.startsWith('erc-') && file.endsWith('.md')) || file === 'eip-1.md',
    },
  ];

  const tagPatterns = new Map([
    ['account-wallet', /\b(wallet|provider|sign(?:er|ature|ing)?|account abstraction|user ?operation|userop|paymaster|passkey|webauthn|nonce|gas payer|sponsor|authorization|permission)\b/i],
    ['uri-web-content', /\b(uri|url|iri|web3|contenthash|ipfs|resource|content[- ]address|file|directory|metadata|http|https|dns|ens|name service|mime|media type|content type)\b/i],
    ['read-proof-history', /\b(merkle|proof|witness|state trie|eth_getproof|log|event|query|index(?:er)?|history|historical|archive|blob|availability|retention|offchain lookup|ccip read)\b/i],
    ['app-package-runtime', /\b(package|manifest|script|client|application|module|plugin|runtime|bytecode|wasm|proxy|upgrade|registry|interface detection)\b/i],
    ['identity-principal', /\b(identity|principal|decentralized identifier|did|attestation|credential|controller|authorship|recipient|subject)\b/i],
    ['privacy', /\b(privacy|private|confidential|stealth|zero[- ]knowledge|zk[- ]|encryption|encrypted|unlinkability|anonymity)\b/i],
    ['agent-automation', /\b(agent|artificial intelligence|machine learning|automation|intent|solver)\b/i],
    ['cross-chain', /\b(cross[- ]chain|multichain|multi[- ]chain|bridge|interoperability|chain id|chainid)\b/i],
    ['token-payment', /\b(token|payment|transfer|allowance|permit|royalty|vault|asset)\b/i],
    ['security-supply-chain', /\b(security|threat|attack|reentrancy|phishing|spoof|supply chain|provenance|dependency|revocation|sandbox)\b/i],
    ['offline-storage', /\b(offline|cache|caching|local storage|storage|persistence|sync|recovery)\b/i],
    ['human-interface', /\b(accessibility|internationali[sz]ation|unicode|user interface|display|human readable|locali[sz]ation)\b/i],
  ]);

  const rows = [];

  for (const root of roots) {
    const files = readdirSync(root.directory)
      .filter(root.include)
      .sort((left, right) => proposalNumber(left) - proposalNumber(right));

    for (const file of files) {
      const text = readFileSync(join(root.directory, file), 'utf8');
      const metadata = parseFrontMatter(text);
      const number = Number(metadata.eip ?? proposalNumber(file));
      const tags = [...tagPatterns.entries()]
        .filter(([, pattern]) => pattern.test(text))
        .map(([tag]) => tag);

      rows.push({
        corpus: root.corpus === 'ERC' && file === 'eip-1.md' ? 'ERC-support' : root.corpus,
        number,
        canonical:
          root.corpus === 'ERC' && file === 'eip-1.md'
            ? 'no-duplicate-eip-1'
            : metadata.status === 'Moved'
              ? 'no-moved-stub'
              : 'yes',
        canonical_url: `https://eips.ethereum.org/EIPS/eip-${number}`,
        title: metadata.title ?? '',
        status: metadata.status ?? '',
        type: metadata.type ?? '',
        category: metadata.category ?? '',
        created: metadata.created ?? '',
        requires: metadata.requires ?? '',
        words: text.trim().split(/\s+/).length,
        sha256: createHash('sha256').update(text).digest('hex'),
        tags: tags.join(','),
        file,
      });
    }
  }

  rows.sort(
    (left, right) =>
      left.corpus.localeCompare(right.corpus) || left.number - right.number,
  );

  const headers = [
    'corpus',
    'number',
    'canonical',
    'canonical_url',
    'title',
    'status',
    'type',
    'category',
    'created',
    'requires',
    'words',
    'sha256',
    'tags',
    'file',
  ];
  const tsv = [
    headers.join('\t'),
    ...rows.map((row) =>
      headers.map((header) => escapeTsv(row[header])).join('\t'),
    ),
  ].join('\n');
  writeFileSync(output, `${tsv}\n`);

  const canonicalRows = rows.filter((row) => row.canonical === 'yes');
  const movedRows = rows.filter((row) => row.canonical === 'no-moved-stub');
  const duplicateRows = rows.filter(
    (row) => row.canonical === 'no-duplicate-eip-1',
  );
  console.log(
    JSON.stringify(
      {
        sourceFiles: rows.length,
        canonicalSubstantive: canonicalRows.length,
        movedStubs: movedRows.length,
        duplicateSupportDocuments: duplicateRows.length,
        totalWords: rows.reduce((total, row) => total + row.words, 0),
        statuses: countBy(canonicalRows, 'status'),
        categories: countBy(canonicalRows, 'category'),
      },
      null,
      2,
    ),
  );
}

function proposalNumber(file) {
  return Number(file.match(/\d+/)?.[0] ?? Number.NaN);
}

function parseFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const result = {};
  if (!match) return result;

  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (field) {
      result[field[1].toLowerCase()] = field[2].replace(/^['"]|['"]$/g, '');
    }
  }
  return result;
}

function escapeTsv(value) {
  return String(value ?? '').replace(/[\t\r\n]+/g, ' ').trim();
}

function countBy(rows, field) {
  return Object.fromEntries(
    Object.entries(
      rows.reduce((counts, row) => {
        const key = row[field] || '(none)';
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      }, {}),
    ).sort(([left], [right]) => left.localeCompare(right)),
  );
}
