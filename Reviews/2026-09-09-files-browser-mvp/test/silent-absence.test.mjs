// The dominant bug CLASS in this system, tested as a class rather than as a
// list of known instances.
//
// Every reader entrypoint can answer UNKNOWN (unreadable), and UNKNOWN is not
// absence. A consumer that collapses UNKNOWN into an empty list, a `false`, or
// a silently missing section has asserted an absence it never established.
//
// This is not hypothetical discipline: three instances shipped in web/app.mjs
// — the tag display, the tag filter, and the name timeline — written AFTER the
// rule was known and AFTER the identical bug was repaired in openRemoved.
//
// HONEST LIMITS OF THIS SCANNER. It reads source text, so it sees less than a
// type-aware tool would. It does NOT check results bound by destructuring
// (`const [a, b] = await Promise.all([...])`), and it cannot follow a result
// passed into a callee that narrows it there. Its first version produced two
// false positives on correct code, which is itself the finding: a naive lint
// is not a substitute for an API shape where the unlicensed value does not
// exist. Treat a pass here as "no instance of the known textual shape", never
// as "this client handles unreadable states correctly".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const APP = readFileSync(new URL('../web/app.mjs', import.meta.url), 'utf8');
const lines = APP.split('\n');
const READ_CALLS = ['openTags', 'openRemoved', 'openHistory', 'openRevisions', 'openFile', 'lookupName'];

test('an unreadable read is never collapsed into an empty value', () => {
  const collapses = [];
  lines.forEach((line, i) => {
    const at = `app.mjs:${i + 1}: ${line.trim()}`;
    // (a) ternary whose ELSE branch (the non-FOUND side) is an empty value
    if (/outcome === 'FOUND'[^?]*\?[^:]*:\s*(\[\]|''|""|false|null)\s*[;,)]/.test(line)) collapses.push(at);
    // (b) inverted ternary putting the empty value on the non-FOUND side
    if (/outcome !== 'FOUND'[^?]*\?\s*(\[\]|''|""|false|null)\s*:/.test(line)) collapses.push(at);
    // (c) `outcome === 'FOUND' && ...` STORED as a boolean value (not used as a
    //     ternary test) — "unreadable" silently becomes "does not have it".
    if (/outcome === 'FOUND' &&/.test(line) && !/\?/.test(line.split("outcome === 'FOUND' &&")[1] ?? '')) collapses.push(at);
  });
  assert.deepEqual(collapses, [],
    'a non-FOUND (possibly UNKNOWN) read must not become an empty value — that asserts an absence never established:\n' + collapses.join('\n'));
});

test('a named reader result is narrowed on outcome before its value is read', () => {
  // Scoped to the bound name, so `row.value` (a different, already-narrowed
  // object) cannot be mistaken for the result's value.
  const unnarrowed = [];
  lines.forEach((line, i) => {
    const bind = line.match(/(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*await[^;]*\b(?:openTags|openRemoved|openHistory|openRevisions|openFile|lookupName)\(/);
    if (!bind) return;
    const name = bind[1];
    const rest = lines.slice(i, Math.min(i + 25, lines.length)).join('\n');
    const usesValue = new RegExp(`\\b${name}\\.value\\b`).test(rest);
    const narrows = new RegExp(`\\b${name}\\.outcome\\b`).test(rest);
    if (usesValue && !narrows) unnarrowed.push(`app.mjs:${i + 1}: ${line.trim()}`);
  });
  assert.deepEqual(unnarrowed, [],
    'a reader result must be narrowed on outcome before .value is read:\n' + unnarrowed.join('\n'));
});

test('unreadable states say so in the copy the user actually sees', () => {
  for (const phrase of [
    'This is NOT the same as having no tags.',
    'This is NOT the same as having no history.',
  ]) {
    assert(APP.includes(phrase), 'missing the honest unreadable-vs-empty copy: ' + phrase);
  }
  assert.match(APP, /showing nothing rather than guessing/, 'tag-filter failure must refuse to guess');
  assert.match(APP, /currently unreadable \(this is not proof of none\)/, 'removed-items unreadable state must stay honest');
});

test('the scanner itself does not fire on known-correct code', () => {
  // Guards against "fix" by loosening: these two shapes are CORRECT and must
  // stay unflagged. Both are real lines this scanner wrongly flagged once.
  const correct = [
    `      byteNote = check.outcome === 'FOUND' && check.value.integrity === 'VERIFIED' ? '' : ' Bytes are not yet readable from the carrier.';`,
    `  if (result.outcome !== 'FOUND') throw Error('unreadable');`,
  ];
  for (const line of correct) {
    const flagged = /outcome === 'FOUND'[^?]*\?[^:]*:\s*(\[\]|''|""|false|null)\s*[;,)]/.test(line)
      || /outcome !== 'FOUND'[^?]*\?\s*(\[\]|''|""|false|null)\s*:/.test(line)
      || (/outcome === 'FOUND' &&/.test(line) && !/\?/.test(line.split("outcome === 'FOUND' &&")[1] ?? ''));
    assert(!flagged, 'scanner false-positives on correct code: ' + line.trim());
  }
});
