'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { fixtureDocument } = require('../src/hello-files-v0.cjs');

const serialized = JSON.stringify(fixtureDocument());
if (process.argv.includes('--write')) {
  fs.writeFileSync(path.resolve(__dirname, '../hello-files-v0.json'), serialized);
} else {
  process.stdout.write(serialized);
}
