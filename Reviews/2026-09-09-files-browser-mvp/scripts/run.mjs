// Interactive local environment: boots a disposable anvil chain, deploys the
// upgradeable Core/carrier + FilesRouter, seeds the trip/ world and serves the
// browser. Ctrl+C tears everything down; nothing survives or is published.
//   node scripts/run.mjs            — start and print the URL
//   node scripts/run.mjs --upgrade  — start, then upgrade U1->U2 after 'u'+Enter
import { compileUpgrade, withUpgrade } from '../../2026-09-08-upgradeable-foundation/scripts/local-upgrade.mjs';
import { startEnvironment, compileRouter } from './environment.mjs';

const interactiveUpgrade = process.argv.includes('--upgrade');
console.log('Compiling contracts (foundation + router)…');
compileUpgrade();
compileRouter();
console.log('Booting the disposable chain and seeding trip/ …');
await withUpgrade(async lab => {
  const { server } = await startEnvironment(lab, { write: true });
  console.log('\n  EFS Files browser:  ' + server.url + '\n');
  console.log('  Guest reads need no wallet. Pick a local test signer (top right) to write.');
  console.log('  Reset: stop with Ctrl+C and start again — the chain is disposable.');
  if (interactiveUpgrade) console.log("  Type 'u' + Enter to upgrade the populated contracts U1 -> U2 in place.");
  console.log("  Type 'q' + Enter (or Ctrl+C) to stop.\n");
  process.stdin.setEncoding('utf8');
  await new Promise(resolve => {
    process.stdin.on('data', async chunk => {
      const cmd = chunk.trim().toLowerCase();
      if (cmd === 'q') resolve();
      if (cmd === 'u' && interactiveUpgrade) {
        console.log('Upgrading the populated contracts (same addresses, same data)…');
        const result = await lab.upgrade();
        console.log('Upgrade ' + (result.receipt.status === '0x1' ? 'complete: revision 2 active. Reload the browser and read again.' : 'FAILED'));
      }
    });
    process.on('SIGINT', resolve);
  });
  await server.close();
}, { profile: 'reads', watchdogMs: 24 * 3600 * 1000 });
console.log('Stopped. The disposable chain is gone.');
process.exit(0);
