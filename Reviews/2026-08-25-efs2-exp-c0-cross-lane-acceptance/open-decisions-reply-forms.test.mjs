import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { execFileSync } from 'node:child_process';

const planningRoot = path.resolve(import.meta.dirname, '../..');
const generatorSource = path.join(planningRoot, 'scripts', 'open-decisions.sh');

test('generated owner roll-up carries exact reply forms from the source inbox', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'efs-open-decisions-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'Designs', 'efsv2'), { recursive: true });
  fs.copyFileSync(generatorSource, path.join(root, 'scripts', 'open-decisions.sh'));
  fs.writeFileSync(path.join(root, 'Designs', 'efsv2', 'owner-decision-inbox.md'), `# EFS v2 owner inbox

**Last reconciled:** 2026-08-25

## Decide now — build-start handoff

### V2-C1 — Authorize replaceable nondeployable candidate engineering

**Reply forms:** \`V2-C1 YES\`, \`V2-C1 NO\`, or \`V2-C1 DEFER\`
`);

  const output = execFileSync('bash', [path.join(root, 'scripts', 'open-decisions.sh'), '--stdout'], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.match(output, /V2-C1.*Authorize replaceable nondeployable candidate engineering<br>Reply exactly: `V2-C1 YES`, `V2-C1 NO`, or `V2-C1 DEFER`/);
  assert.doesNotMatch(output, /R1A|R1B/);
  assert.match(output, /owner-decision-inbox\.md#v2-c1--authorize-replaceable-nondeployable-candidate-engineering/);
});
