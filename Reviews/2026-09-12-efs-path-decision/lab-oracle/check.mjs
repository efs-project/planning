#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

import { checkSealedPacket } from './oracle.mjs';

async function main() {
  const paths = process.argv.slice(2);
  if (paths.length !== 3) {
    throw new TypeError('USAGE: node check.mjs <packet.json> <profile.json> <expectations.json>');
  }

  const [packetRaw, profileRaw, expectationsRaw] = await Promise.all(
    paths.map((path) => readFile(path, 'utf8')),
  );
  const packet = JSON.parse(packetRaw);
  const profile = JSON.parse(profileRaw);
  const expectations = JSON.parse(expectationsRaw);
  const report = checkSealedPacket(packet, profile, expectations, { profileRaw, expectationsRaw });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.discrepancies.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
