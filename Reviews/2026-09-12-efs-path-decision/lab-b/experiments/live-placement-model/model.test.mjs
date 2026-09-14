import test from 'node:test';
import assert from 'node:assert/strict';
import * as candidate from './candidate.mjs';
import { replay, lifetime, liveMembership, joined, position } from './reference.mjs';
import { BASE, EXPECTED, TRANSITIONS, QUERY, AUTHORS, DRAFTS, PUBLISHED, bind, unbind } from './fixtures.mjs';

const projection = entries => entries.map(e => [e.author, e.name, e.target]);
const queryTag = (concept, tagScope) => ({ ...QUERY, concept, tagScope });
const checkedUnion = (events, query = QUERY, options = {}) => {
  const actual = candidate.union(candidate.prepare(events, options), query);
  const expected = lifetime(replay(events, options), query);
  assert.equal(actual.status, expected.status);
  assert.deepEqual(actual.entries, expected.entries);
  return actual;
};

test('independent reference pins H9 L6 U4 S3, full authored tuples and 14 head probes', () => {
  const state = replay(BASE);
  const expected = lifetime(state, QUERY);
  const live = liveMembership(state, QUERY);
  assert.deepEqual(expected.entries, EXPECTED);
  assert.deepEqual(expected.counters, { coverageChecks: 3, candidateReads: 9, headProbes: 14 });
  assert.equal(live.length, 6);
  assert.equal(new Set(live.map(e => position(e.scope, e.name))).size, 4);
  assert.equal(expected.entries.length, 3);
  assert.deepEqual(projection(expected.entries), [['A', 'note', 'G'], ['A', 'alias', 'G'], ['C', 'later', 'H']]);
  assert.equal(expected.entries.some(e => e.name === 'brief'), false);
});

test('candidate complete union must equal pinned authored output, not an empty result', () => {
  const model = candidate.prepare(BASE);
  const actual = candidate.union(model, QUERY);
  assert.equal(actual.status, 'COMPLETE');
  assert.deepEqual(actual.entries, EXPECTED); // Intended first behavioral RED.
  assert.deepEqual(candidate.inspectMembership(model, QUERY), liveMembership(replay(BASE), QUERY));
  assert.equal(model.preparationCounters.effects, BASE.length);
  assert.ok(model.preparationCounters.membershipUpdates >= 14);
  assert.ok(model.preparationCounters.sortComparisons >= 0);
  assert.equal(actual.counters.coverageChecks, 3);
  assert.equal(actual.counters.membershipReads, 6);
  assert.equal(actual.counters.materialized, 6, 'one-shot union charges all raw membership materialization');
  assert.equal(actual.counters.dedupChecks, 6);
  assert.equal(actual.counters.headProbes, 6);
  assert.ok(actual.counters.sortComparisons >= 0, 'sorting is counted if used, never hidden');
});

test('ordered effects preserve reference at every publication, both scopes and both tag queries', () => {
  const events = [...BASE];
  for (const { label, actions } of TRANSITIONS) {
    events.push(...actions);
    const state = replay(events);
    const model = candidate.prepare(events);
    for (const scope of [DRAFTS, PUBLISHED]) {
      const query = { ...QUERY, scope };
      assert.deepEqual(candidate.inspectMembership(model, query), liveMembership(state, query), label);
      checkedUnion(events, query);
    }
    for (const query of [queryTag('project', 'file'), queryTag('approved', 'revision')]) {
      const got = candidate.tagged(model, query);
      const expected = joined(state, query);
      assert.equal(got.status, expected.status, label);
      assert.deepEqual(got.entries, expected.entries, label);
    }
    if (label === 'higher mask over lower H') {
      assert.equal(lifetime(state, QUERY).entries.some(e => e.name === 'alias'), false);
    }
    if (label === 'File HEAD whiteout') {
      assert.equal(lifetime(state, QUERY).entries.some(e => e.target === 'H'), true);
      assert.deepEqual(joined(state, queryTag('project', 'file')).entries, []);
      assert.deepEqual(joined(state, queryTag('approved', 'revision')).entries, []);
    }
  }
});

test('File/revision tags are assessed after placement and exact File HEAD selection', () => {
  const state = replay(BASE);
  const selected = { status: 'FOUND', head: { scope: 'head', name: 'H', author: 'A', target: 'RH',
    revision: 1, admission: 17, bindingOrdinal: 12 } };
  const expectedProject = [{ placement: EXPECTED[2], selected,
    fileTag: { status: 'FOUND', head: { scope: 'tag:H', name: 'project', author: 'A', target: 'H',
      revision: 1, admission: 19, bindingOrdinal: 14 } }, revisionTag: { status: 'ABSENT', head: null } }];
  const expectedApproved = [{ placement: EXPECTED[2], selected,
    fileTag: { status: 'ABSENT', head: null }, revisionTag: { status: 'FOUND', head: {
      scope: 'tag:RH', name: 'approved', author: 'A', target: 'H', revision: 1, admission: 21, bindingOrdinal: 16 } } }];
  for (const [query, expected] of [[queryTag('project', 'file'), expectedProject],
    [queryTag('approved', 'revision'), expectedApproved]]) {
    assert.deepEqual(joined(state, query).entries, expected);
    assert.deepEqual(candidate.tagged(candidate.prepare(BASE), query).entries, expected);
  }
});

test('all 27 absent/live/masked assignments agree with explicit first-non-absent rule', () => {
  const states = ['absent', 'live', 'masked'];
  let count = 0;
  for (const a of states) for (const b of states) for (const c of states) {
    const assignment = [a, b, c];
    const events = [];
    assignment.forEach((state, i) => {
      if (state !== 'absent') events.push(bind(AUTHORS[i], DRAFTS, 'single', `${AUTHORS[i]}-file`));
      if (state === 'masked') events.push(unbind(AUTHORS[i], DRAFTS, 'single'));
    });
    const first = assignment.findIndex(state => state !== 'absent');
    const visible = first !== -1 && assignment[first] === 'live';
    const reference = lifetime(replay(events), QUERY);
    assert.equal(reference.entries.length, visible ? 1 : 0);
    if (visible) assert.deepEqual(projection(reference.entries), [[AUTHORS[first], 'single', `${AUTHORS[first]}-file`]]);
    checkedUnion(events);
    ++count;
  }
  assert.equal(count, 27);
});

test('two churned names grow lifetime scans 2 to 4 while live-candidate reads stay 1', () => {
  const before = [bind('A', DRAFTS, 'note', 'G'), bind('A', DRAFTS, 'brief', 'F'), unbind('A', DRAFTS, 'brief')];
  const after = [...before, bind('A', DRAFTS, 'temporary-a', 'F'), unbind('A', DRAFTS, 'temporary-a'),
    bind('A', DRAFTS, 'temporary-b', 'F'), unbind('A', DRAFTS, 'temporary-b')];
  const expected = lifetime(replay(before), QUERY);
  assert.equal(expected.counters.candidateReads, 2);
  assert.equal(lifetime(replay(after), QUERY).counters.candidateReads, 4);
  assert.deepEqual(lifetime(replay(after), QUERY).entries, expected.entries);
  for (const events of [before, after]) {
    const result = checkedUnion(events);
    assert.equal(result.counters.membershipReads, 1);
    assert.deepEqual(result.entries, expected.entries);
  }
});

test('live stream pages charge candidates, no hidden union/sort, and preserve complete order', () => {
  const model = candidate.prepare(BASE);
  const preparation = structuredClone(model.preparationCounters);
  const zero = candidate.page(model, QUERY, 0);
  assert.equal(zero.status, 'PARTIAL');
  assert.deepEqual(zero.entries, []);
  assert.equal(zero.counters.membershipReads, 0);
  for (const budget of [1, 2, 6]) {
    let cursor;
    const entries = [];
    let reads = 0;
    let probes = 0;
    let completed = false;
    for (let pageNumber = 0; pageNumber < 8; ++pageNumber) {
      const result = candidate.page(model, QUERY, budget, cursor);
      assert.ok(result.counters.membershipReads <= budget);
      assert.equal(result.counters.coverageChecks, 3);
      assert.equal(result.counters.materialized, 0, 'stream never materializes a union');
      assert.equal(result.counters.dedupChecks, 0, 'higher-head masking handles duplicates');
      assert.equal(result.counters.sortComparisons, 0, 'ordered index preparation is not free page prework');
      reads += result.counters.membershipReads;
      probes += result.counters.headProbes;
      entries.push(...result.entries);
      if (result.status === 'COMPLETE') { completed = true; break; }
      assert.equal(result.status, 'PARTIAL');
      assert.ok(result.next);
      cursor = result.next;
    }
    assert.ok(completed, 'bounded fixture must exhaust');
    assert.deepEqual(entries, EXPECTED);
    assert.equal(reads, 6);
    assert.equal(probes, 11);
  }
  assert.deepEqual(model.preparationCounters, preparation, 'reads must not rebuild or sort the index');
});

test('empty before exhaustion is PARTIAL; missing later-author coverage is UNKNOWN', () => {
  const events = [bind('A', DRAFTS, 'brief', 'F'), unbind('A', DRAFTS, 'brief'),
    bind('B', DRAFTS, 'brief', 'F'), bind('C', DRAFTS, 'later', 'H')];
  const model = candidate.prepare(events);
  const first = candidate.page(model, QUERY, 1);
  assert.equal(first.status, 'PARTIAL');
  assert.deepEqual(first.entries, []);
  const last = candidate.page(model, QUERY, 1, first.next);
  assert.equal(last.status, 'COMPLETE');
  assert.deepEqual(last.entries, lifetime(replay(events), QUERY).entries);
  const incomplete = candidate.prepare(BASE, { coverage: { A: true, B: true, C: false } });
  for (const result of [candidate.union(incomplete, QUERY), candidate.page(incomplete, QUERY, 100),
    candidate.tagged(incomplete, queryTag('project', 'file'))]) {
    assert.equal(result.status, 'UNKNOWN');
    assert.deepEqual(result.entries, []);
  }
});

test('mutation, move, Lens, scope, generation and configuration reject stale continuations', () => {
  const cursor = candidate.page(candidate.prepare(BASE), QUERY, 1).next;
  assert.ok(cursor);
  const variations = [
    [candidate.prepare([...BASE, unbind('A', DRAFTS, 'note')]), QUERY],
    [candidate.prepare([...BASE, unbind('A', DRAFTS, 'note'), bind('A', PUBLISHED, 'note', 'G')]), QUERY],
    [candidate.prepare(BASE), { ...QUERY, authors: ['C', 'B', 'A'] }],
    [candidate.prepare(BASE), { ...QUERY, scope: PUBLISHED }],
    [candidate.prepare(BASE, { generation: 2 }), QUERY],
    [candidate.prepare(BASE, { configuration: 'different-code-or-module' }), QUERY],
  ];
  for (const [model, query] of variations) assert.throws(() => candidate.page(model, query, 2, cursor), /E_CURSOR/);
});

test('negative controls: ignored masks and File dedupe disagree with pinned placement tuples', () => {
  for (const fault of ['ignore-higher-masks', 'deduplicate-files']) {
    const bad = candidate.union(candidate.withFault(candidate.prepare(BASE), fault), QUERY);
    assert.equal(bad.status, 'COMPLETE');
    assert.notDeepEqual(bad.entries, EXPECTED, fault);
  }
});

test('negative controls: later coverage omission and filtering lower tags are caught', () => {
  const model = candidate.prepare(BASE, { coverage: { A: true, B: true, C: false } });
  const badCoverage = candidate.union(candidate.withFault(model, 'omit-later-coverage'), QUERY);
  assert.notEqual(badCoverage.status, 'UNKNOWN');
  const badTags = candidate.tagged(candidate.withFault(candidate.prepare(BASE), 'filter-before-selection'), queryTag('project', 'file'));
  assert.notDeepEqual(badTags.entries, joined(replay(BASE), queryTag('project', 'file')).entries);
});

test('negative controls: extra/missing live membership is caught despite claimed coverage', () => {
  const expected = liveMembership(replay(BASE), QUERY);
  for (const fault of ['extra-membership', 'missing-membership']) {
    const bad = candidate.withFault(candidate.prepare(BASE), fault);
    assert.notDeepEqual(candidate.inspectMembership(bad, QUERY), expected, fault);
    if (fault === 'missing-membership') assert.notDeepEqual(candidate.union(bad, QUERY).entries, EXPECTED);
  }
});

test('negative control: accepting old cursor after dense-set swap-delete gives mixed-basis data', () => {
  const first = candidate.page(candidate.prepare(BASE), QUERY, 1);
  assert.ok(first.next);
  const events = [...BASE, unbind('A', DRAFTS, 'note')];
  const bad = candidate.withFault(candidate.prepare(events), 'accept-stale-swap-delete');
  const rest = candidate.page(bad, QUERY, 100, first.next);
  assert.equal(rest.status, 'COMPLETE');
  assert.notDeepEqual([...first.entries, ...rest.entries], lifetime(replay(events), QUERY).entries);
});
