'use strict';

// Independent regeneration control. This test intentionally imports no
// interpreter implementation and proves the emitter does not treat its own
// generated artifact as an input.

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const controlRoot = path.resolve(__dirname, '..');
const generatorPath = path.join(controlRoot, 'scripts/build-type-interpreter-vector.cjs');
const artifactPath = path.join(controlRoot, 'type-interpreter-v0.json');
const essentialPath = path.join(controlRoot, 'vectors/essential-v0.json');

function runGenerator(scriptPath) {
  return execFileSync(process.execPath, [scriptPath], { encoding: 'utf8' });
}

test('Type-interpreter corpus regenerates byte-for-byte from declared upstream inputs', () => {
  assert.equal(runGenerator(generatorPath), fs.readFileSync(artifactPath, 'utf8'));
});

test('Type-interpreter generator rejects self-dependency by discarding a poisoned prior output', () => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'efs2-type-interpreter-generator-'));
  try {
    fs.mkdirSync(path.join(temporaryRoot, 'scripts'));
    fs.mkdirSync(path.join(temporaryRoot, 'vectors'));
    fs.copyFileSync(generatorPath, path.join(temporaryRoot, 'scripts/build-type-interpreter-vector.cjs'));
    fs.copyFileSync(essentialPath, path.join(temporaryRoot, 'vectors/essential-v0.json'));

    const poisoned = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    poisoned.SENTINEL_SELF_DEPENDENCY = 'MUST_NOT_SURVIVE_REGENERATION';
    fs.writeFileSync(
      path.join(temporaryRoot, 'type-interpreter-v0.json'),
      `${JSON.stringify(poisoned, null, 2)}\n`,
    );

    assert.equal(
      runGenerator(path.join(temporaryRoot, 'scripts/build-type-interpreter-vector.cjs')),
      fs.readFileSync(artifactPath, 'utf8'),
    );
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
});
