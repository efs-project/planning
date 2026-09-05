import { spawnSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { compile, root } from './local-chain.mjs';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} failed (${result.status ?? result.error})`);
}
if (process.version !== 'v26.0.0') throw new Error('Use pinned Node v26.0.0 for this rehearsal');
compile({ tests: true });
for (const directory of ['scripts', 'sdk', 'web']) {
  for (const file of await readdir(new URL(`../${directory}/`, import.meta.url))) {
    if (/\.(mjs|js)$/.test(file)) run(process.execPath, ['--check', `${directory}/${file}`]);
  }
}
run(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--target', 'ES2022',
  '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'sdk/sample.ts']);
const tests = (await readdir(new URL('../test/', import.meta.url))).filter(name => name.endsWith('.test.mjs')).sort();
run(process.execPath, ['--test', ...tests.map(name => `test/${name}`)]);
console.log('PASS lab Solidity, JavaScript, TypeScript consumer and local-chain integration. Browser remains a separate command.');
