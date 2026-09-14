// Throwaway, independent lifetime-event replay. No candidate module imports.
import assert from 'node:assert/strict';

export const key = (author, scope, name) => JSON.stringify([author, scope, name]);
export const position = (scope, name) => JSON.stringify([scope, name]);

export function replay(events, options = {}) {
  assert.ok(events.length <= 1024, 'bounded model input');
  const heads = new Map();
  let nextBinding = 0;
  events.forEach((event, index) => {
    const k = key(event.author, event.scope, event.name);
    const old = heads.get(k);
    assert.ok(event.op === 'bind' || event.op === 'unbind');
    if (event.op === 'unbind') assert.equal(old?.state, 'live', 'legal live-to-mask transition');
    heads.set(k, {
      scope: event.scope, name: event.name, author: event.author,
      state: event.op === 'bind' ? 'live' : 'masked',
      target: event.op === 'bind' ? event.target : null,
      revision: (old?.revision ?? 0) + 1, admission: index + 1,
      bindingOrdinal: old?.bindingOrdinal ?? ++nextBinding,
    });
  });
  return { heads, basis: events.length, generation: options.generation ?? 1,
    configuration: options.configuration ?? 'model-v1', coverage: options.coverage ?? { A: true, B: true, C: true } };
}

export const tuple = ({ scope, name, author, target, revision, admission, bindingOrdinal }) =>
  ({ scope, name, author, target, revision, admission, bindingOrdinal });

export function resolve(state, authors, scope, name) {
  for (const author of authors) {
    const h = state.heads.get(key(author, scope, name));
    if (h) return { status: h.state === 'live' ? 'FOUND' : 'MASKED', head: tuple(h) };
  }
  return { status: 'ABSENT', head: null };
}

export function lifetime(state, query) {
  const counters = { coverageChecks: 0, candidateReads: 0, headProbes: 0 };
  let covered = true;
  for (const author of query.authors) {
    ++counters.coverageChecks;
    if (state.coverage[author] !== true) covered = false;
  }
  if (!covered) return { status: 'UNKNOWN', entries: [], counters };
  const entries = [];
  query.authors.forEach((author, authorIndex) => {
    // Map insertion order is the lifetime first-binding order; not live-index data.
    for (const h of state.heads.values()) {
      if (h.author !== author || h.scope !== query.scope) continue;
      ++counters.candidateReads;
      ++counters.headProbes;
      if (h.state !== 'live') continue;
      let hidden = false;
      for (let higher = 0; higher < authorIndex; ++higher) {
        ++counters.headProbes;
        if (state.heads.has(key(query.authors[higher], query.scope, h.name))) {
          hidden = true;
          break;
        }
      }
      if (!hidden) entries.push(tuple(h));
    }
  });
  return { status: 'COMPLETE', entries, counters };
}

export function liveMembership(state, query) {
  return query.authors.flatMap(author => [...state.heads.values()]
    .filter(h => h.author === author && h.scope === query.scope && h.state === 'live')
    .map(h => ({ author, scope: h.scope, name: h.name, bindingOrdinal: h.bindingOrdinal })));
}

export function joined(state, query) {
  const raw = lifetime(state, query);
  if (raw.status !== 'COMPLETE') return { status: raw.status, entries: [] };
  const entries = [];
  for (const placement of raw.entries) {
    const selected = resolve(state, query.authors, 'head', placement.target);
    const fileTag = resolve(state, query.authors, `tag:${placement.target}`, query.concept);
    const revisionTag = selected.status === 'FOUND'
      ? resolve(state, query.authors, `tag:${selected.head.target}`, query.concept)
      : { status: 'UNEVALUATED', head: null };
    const chosen = query.tagScope === 'file' ? fileTag : revisionTag;
    if (selected.status === 'FOUND' && chosen.status === 'FOUND' && chosen.head.target === placement.target) {
      entries.push({ placement, selected, fileTag, revisionTag });
    }
  }
  return { status: 'COMPLETE', entries };
}
