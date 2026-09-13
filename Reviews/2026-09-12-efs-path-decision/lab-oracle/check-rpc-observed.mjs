#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { analyzeRpcObserved } from './rpc-observed.mjs';

const FROZEN_BLOBS = Object.freeze({
  profile: '6345c2246e287e9676f714491ce8aebf673f754a',
  expectations: '1fbe87f6b2bf1d095bb0979997573439a6c2bd88',
});

const KNOWN_INPUTS = Object.freeze({
  '7bd5409a4b306d8e0705187094fa482b31efcad471260ae93f57eebd0b22fcce': {
    name: 'measure2-a16d7d4.json',
    gitBlob: '1a38f6493510760ae1b97f6188d2548c795350a8',
    standing: 'candidate-designated current packet; incomplete for the frozen oracle and not authenticated chain truth',
  },
  '0a46b75442b30aec9401e6341d5a5ca3ed6a3413f308da21732bb97a9db445e8': {
    name: 'measure1-partial.json',
    gitBlob: 'f6d25f3f6dec11dd4ffabf5407dd53114383eda5',
    standing: 'superseded partial diagnostic packet retained only as incomplete-input pressure',
  },
});

function gitBlobHash(bytes) {
  return createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest('hex');
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function rejectDuplicateObjectKeys(text, label) {
  let index = 0;
  const whitespace = () => {
    while (/\s/.test(text[index] ?? '')) index += 1;
  };
  const stringToken = () => {
    const start = index;
    index += 1;
    while (index < text.length) {
      if (text[index] === '\\') {
        index += 2;
      } else if (text[index] === '"') {
        index += 1;
        return JSON.parse(text.slice(start, index));
      } else {
        index += 1;
      }
    }
    throw new TypeError(`MALFORMED_${label}_JSON_STRING`);
  };
  const value = () => {
    whitespace();
    if (text[index] === '{') {
      index += 1;
      whitespace();
      const keys = new Set();
      if (text[index] === '}') {
        index += 1;
        return;
      }
      while (index < text.length) {
        const key = stringToken();
        if (keys.has(key)) throw new TypeError(`DUPLICATE_${label}_JSON_OBJECT_KEY:${key}`);
        keys.add(key);
        whitespace();
        index += 1; // JSON.parse already established the colon.
        value();
        whitespace();
        if (text[index] === '}') {
          index += 1;
          return;
        }
        index += 1; // JSON.parse already established the comma.
        whitespace();
      }
    } else if (text[index] === '[') {
      index += 1;
      whitespace();
      if (text[index] === ']') {
        index += 1;
        return;
      }
      while (index < text.length) {
        value();
        whitespace();
        if (text[index] === ']') {
          index += 1;
          return;
        }
        index += 1;
      }
    } else if (text[index] === '"') {
      stringToken();
    } else {
      while (index < text.length && !/[\s,\]}]/.test(text[index])) index += 1;
    }
  };
  value();
}

function parse(bytes, label) {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const parsed = JSON.parse(text);
    rejectDuplicateObjectKeys(text, label);
    return parsed;
  } catch (error) {
    throw new TypeError(`MALFORMED_${label}_JSON:${error.message}`);
  }
}

async function main() {
  const [packetPath, profilePath, expectationsPath] = process.argv.slice(2);
  if (!packetPath || !profilePath || !expectationsPath) {
    throw new TypeError('USAGE: check-rpc-observed.mjs PACKET PROFILE EXPECTATIONS');
  }

  const [packetBytes, profileBytes, expectationsBytes] = await Promise.all([
    readFile(packetPath),
    readFile(profilePath),
    readFile(expectationsPath),
  ]);
  const profileBlob = gitBlobHash(profileBytes);
  const expectationsBlob = gitBlobHash(expectationsBytes);
  if (profileBlob !== FROZEN_BLOBS.profile) throw new TypeError('FROZEN_RPC_PROFILE_BLOB_MISMATCH');
  if (expectationsBlob !== FROZEN_BLOBS.expectations) throw new TypeError('FROZEN_RPC_EXPECTATIONS_BLOB_MISMATCH');

  const packetSha256 = sha256(packetBytes);
  const packetGitBlob = gitBlobHash(packetBytes);
  const known = KNOWN_INPUTS[packetSha256];
  if (known && known.gitBlob !== packetGitBlob) throw new TypeError('KNOWN_PACKET_HASH_IDENTITY_CONFLICT');

  const report = analyzeRpcObserved(
    parse(packetBytes, 'PACKET'),
    parse(profileBytes, 'PROFILE'),
    parse(expectationsBytes, 'EXPECTATIONS'),
    {
      sourceLabel: known?.name ?? packetPath,
      input: {
        byteLength: packetBytes.length,
        sha256: packetSha256,
        gitBlob: packetGitBlob,
        profileGitBlob: profileBlob,
        expectationsGitBlob: expectationsBlob,
        registryStanding: known?.standing ?? 'unregistered input; identity reported but not pre-authorized or authenticated',
      },
    },
  );
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = report.summary.OBSERVED_MISMATCH === 0 ? 0 : 1;
}

main().catch((error) => {
  process.stderr.write(`RPC_OBSERVED_ERROR:${error.message}\n`);
  process.exitCode = 2;
});
