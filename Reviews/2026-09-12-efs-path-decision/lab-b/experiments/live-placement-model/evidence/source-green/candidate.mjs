// Throwaway current-snapshot live index. No reference or fixture imports.
import { createHash } from 'node:crypto';

const bindingKey = (author, scope, name) => JSON.stringify([author, scope, name]);
const positionKey = (scope, name) => JSON.stringify([scope, name]);
const hash = value => createHash('sha256').update(value).digest('hex');
const tuple = h => ({ scope: h.scope, name: h.name, author: h.author, target: h.target,
  revision: h.revision, admission: h.admission, bindingOrdinal: h.bindingOrdinal });
const membership = h => ({ author: h.author, scope: h.scope, name: h.name, bindingOrdinal: h.bindingOrdinal });
const counters = () => ({ coverageChecks: 0, membershipReads: 0, headProbes: 0,
  dedupChecks: 0, sortComparisons: 0, materialized: 0, scopeReads: 0 });

export function prepare(events, options = {}) {
  if (!Array.isArray(events) || events.length > 1024) throw new Error('E_INPUT_BOUND');
  const heads = new Map();
  const scopes = new Map();
  const preparationCounters = { effects: 0, membershipUpdates: 0, sortComparisons: 0,
    indexCopies: 0, snapshotBytes: 0 };
  let nextOrdinal = 0;
  for (const event of events) {
    if (!['bind', 'unbind'].includes(event.op)
      || ![event.author, event.scope, event.name].every(v => typeof v === 'string' && v.length <= 256)
      || (event.op === 'bind' && (typeof event.target !== 'string' || event.target.length > 256))) throw new Error('E_EVENT');
    const k = bindingKey(event.author, event.scope, event.name);
    const old = heads.get(k);
    if (event.op === 'unbind' && old?.state !== 'live') throw new Error('E_NOT_LIVE');
    const h = { author: event.author, scope: event.scope, name: event.name,
      target: event.op === 'bind' ? event.target : null,
      state: event.op === 'bind' ? 'live' : 'masked', revision: (old?.revision ?? 0) + 1,
      admission: ++preparationCounters.effects, bindingOrdinal: old?.bindingOrdinal ?? ++nextOrdinal };
    heads.set(k, h);
    if (!scopes.has(event.scope)) scopes.set(event.scope, new Map());
    const authors = scopes.get(event.scope);
    if (!authors.has(event.author)) authors.set(event.author, { dense: [], slots: new Map(), ordered: [] });
    const index = authors.get(event.author);
    // Maintain membership from each ordered effect; never reconstruct it by
    // filtering retained heads after replay. Tombstone heads remain in `heads`.
    if (event.op === 'bind' && old?.state !== 'live') {
      index.slots.set(k, index.dense.length);
      index.dense.push(membership(h));
      ++preparationCounters.membershipUpdates;
    } else if (event.op === 'unbind') {
      const slot = index.slots.get(k);
      const last = index.dense.pop();
      if (slot < index.dense.length) {
        index.dense[slot] = last;
        index.slots.set(bindingKey(last.author, last.scope, last.name), slot);
      }
      index.slots.delete(k);
      ++preparationCounters.membershipUpdates;
    }
  }
  // Explicit snapshot preparation, not query-time paging prework. A real ordered
  // onchain structure has not been implemented or priced by this array model.
  for (const authors of scopes.values()) for (const index of authors.values()) {
    index.ordered = [...index.dense];
    preparationCounters.indexCopies += index.ordered.length;
    index.ordered.sort((a, b) => {
      ++preparationCounters.sortComparisons;
      return a.bindingOrdinal - b.bindingOrdinal;
    });
  }
  const coverage = { ...(options.coverage ?? { A: true, B: true, C: true }) };
  const generation = options.generation ?? 1;
  const configuration = options.configuration ?? 'model-v1';
  const serialized = JSON.stringify({ events, generation, configuration, coverage });
  preparationCounters.snapshotBytes = Buffer.byteLength(serialized);
  return { heads, scopes, basis: events.length, generation, configuration, coverage,
    snapshot: hash(serialized), preparationCounters, fault: null };
}

function validateQuery(query) {
  if (!Array.isArray(query.authors) || query.authors.length === 0 || query.authors.length > 255
    || !query.authors.every(a => typeof a === 'string') || typeof query.scope !== 'string') throw new Error('E_QUERY');
}

function members(model, author, scope, counts) {
  if (counts) ++counts.scopeReads;
  const index = model.scopes.get(scope)?.get(author);
  return (model.fault === 'accept-stale-swap-delete' ? index?.dense : index?.ordered) ?? [];
}

function covered(model, query, counts) {
  let complete = true;
  const authors = model.fault === 'omit-later-coverage' ? query.authors.slice(0, 1) : query.authors;
  for (const author of authors) {
    ++counts.coverageChecks;
    if (model.coverage[author] !== true) complete = false;
  }
  return complete;
}

function loadHead(model, author, scope, name, counts) {
  ++counts.headProbes;
  return model.heads.get(bindingKey(author, scope, name));
}

function resolve(model, authors, scope, name, counts) {
  for (const author of authors) {
    const head = loadHead(model, author, scope, name, counts);
    if (!head) continue;
    if (head.state === 'masked' && model.fault === 'ignore-higher-masks') continue;
    return { status: head.state === 'live' ? 'FOUND' : 'MASKED', head: tuple(head) };
  }
  return { status: 'ABSENT', head: null };
}

export function inspectMembership(model, query) {
  validateQuery(query);
  return query.authors.flatMap(author => members(model, author, query.scope).map(entry => ({ ...entry })));
}

export function union(model, query) {
  validateQuery(query);
  const counts = counters();
  if (!covered(model, query, counts)) return { status: 'UNKNOWN', entries: [], counters: counts };
  const materialized = [];
  for (const author of query.authors) for (const entry of members(model, author, query.scope, counts)) {
    if (materialized.length >= 4096) throw new Error('E_UNION_BOUND');
    ++counts.membershipReads;
    ++counts.materialized;
    materialized.push(entry);
  }
  const positions = new Set();
  const targets = new Set();
  const entries = [];
  // First appearance is in author/first-binding order. Any emitted position's
  // first live candidate is its winner, so output needs no extra sort here.
  for (const entry of materialized) {
    ++counts.dedupChecks;
    const key = positionKey(entry.scope, entry.name);
    if (positions.has(key)) continue;
    positions.add(key);
    const selected = resolve(model, query.authors, entry.scope, entry.name, counts);
    if (selected.status !== 'FOUND') continue;
    if (model.fault === 'deduplicate-files' && targets.has(selected.head.target)) continue;
    if (model.fault === 'deduplicate-files') targets.add(selected.head.target);
    entries.push(selected.head);
  }
  return { status: 'COMPLETE', entries, counters: counts };
}

function context(model, query) {
  return { basis: model.basis, generation: model.generation, configuration: model.configuration,
    snapshot: model.snapshot, scope: query.scope, lens: JSON.stringify(query.authors) };
}

export function page(model, query, budget, cursor) {
  validateQuery(query);
  if (!Number.isSafeInteger(budget) || budget < 0 || budget > 1024) throw new Error('E_BUDGET');
  const ctx = context(model, query);
  if (cursor && model.fault !== 'accept-stale-swap-delete'
    && Object.keys(ctx).some(k => cursor[k] !== ctx[k])) throw new Error('E_CURSOR');
  let authorIndex = cursor?.authorIndex ?? 0;
  let rawIndex = cursor?.rawIndex ?? 0;
  let selectedSoFar = cursor?.selectedSoFar ?? 0;
  if (![authorIndex, rawIndex, selectedSoFar].every(n => Number.isSafeInteger(n) && n >= 0)
    || authorIndex > query.authors.length) throw new Error('E_CURSOR');
  const counts = counters();
  if (!covered(model, query, counts)) return { status: 'UNKNOWN', entries: [], next: null, counters: counts };
  const entries = [];
  while (authorIndex < query.authors.length) {
    const author = query.authors[authorIndex];
    const list = members(model, author, query.scope, counts);
    if (rawIndex > list.length) throw new Error('E_CURSOR');
    while (rawIndex < list.length) {
      if (counts.membershipReads >= budget) return { status: 'PARTIAL', entries, counters: counts,
        next: { ...ctx, authorIndex, rawIndex, selectedSoFar } };
      const entry = list[rawIndex++];
      ++counts.membershipReads;
      const own = loadHead(model, author, entry.scope, entry.name, counts);
      if (own?.state !== 'live') continue;
      let hidden = false;
      for (let higher = 0; higher < authorIndex; ++higher) {
        const head = loadHead(model, query.authors[higher], entry.scope, entry.name, counts);
        if (head) { hidden = true; break; }
      }
      if (!hidden) { entries.push(tuple(own)); ++selectedSoFar; }
    }
    ++authorIndex;
    rawIndex = 0;
  }
  return { status: 'COMPLETE', entries, next: null, counters: counts };
}

function joinPlacement(model, query, placement, counts) {
  const selected = resolve(model, query.authors, 'head', placement.target, counts);
  const fileTag = resolve(model, query.authors, `tag:${placement.target}`, query.concept, counts);
  const revisionTag = selected.status === 'FOUND'
    ? resolve(model, query.authors, `tag:${selected.head.target}`, query.concept, counts)
    : { status: 'UNEVALUATED', head: null };
  const chosen = query.tagScope === 'file' ? fileTag : revisionTag;
  if (selected.status !== 'FOUND' || chosen.status !== 'FOUND' || chosen.head.target !== placement.target) return null;
  return { placement, selected, fileTag, revisionTag };
}

export function tagged(model, query) {
  validateQuery(query);
  if (!['file', 'revision'].includes(query.tagScope) || typeof query.concept !== 'string') throw new Error('E_TAG_QUERY');
  if (model.fault === 'filter-before-selection') {
    const counts = counters();
    if (!covered(model, query, counts)) return { status: 'UNKNOWN', entries: [], counters: counts };
    const entries = [];
    const seen = new Set();
    // Actual faulty reducer: take the first tagged live candidate for each name,
    // allowing a higher untagged live placement or a tombstone to fall through.
    for (const author of query.authors) for (const entry of members(model, author, query.scope, counts)) {
      ++counts.membershipReads;
      const head = loadHead(model, author, entry.scope, entry.name, counts);
      if (head?.state !== 'live') continue;
      const result = joinPlacement(model, query, tuple(head), counts);
      ++counts.dedupChecks;
      const key = positionKey(entry.scope, entry.name);
      if (result && !seen.has(key)) { seen.add(key); entries.push(result); }
    }
    return { status: 'COMPLETE', entries, counters: counts };
  }
  const raw = union(model, query);
  if (raw.status !== 'COMPLETE') return raw;
  const entries = [];
  for (const placement of raw.entries) {
    const result = joinPlacement(model, query, placement, raw.counters);
    if (result) entries.push(result);
  }
  return { status: 'COMPLETE', entries, counters: raw.counters };
}

export function withFault(model, fault) {
  const supported = ['ignore-higher-masks', 'deduplicate-files', 'omit-later-coverage',
    'filter-before-selection', 'extra-membership', 'missing-membership', 'accept-stale-swap-delete'];
  if (!supported.includes(fault)) throw new Error('E_FAULT');
  if (fault !== 'extra-membership' && fault !== 'missing-membership') return { ...model, fault };
  const copy = structuredClone(model);
  copy.fault = fault;
  // Corrupt only the live index; retain raw heads and claimed complete coverage.
  // Choose a real nonempty folder scope, not a hardcoded expected File/name.
  for (const [scope, authors] of copy.scopes) {
    if (!scope.startsWith('folder:')) continue;
    const nonempty = [...authors.entries()].filter(([, index]) => index.ordered.length);
    if (!nonempty.length) continue;
    const [author, index] = fault === 'missing-membership' ? nonempty.at(-1) : nonempty[0];
    if (fault === 'missing-membership') {
      const removed = index.ordered.shift();
      index.dense = index.dense.filter(e => e.name !== removed.name);
      index.slots.delete(bindingKey(author, scope, removed.name));
    } else {
      let name = 'injected-extra';
      while (copy.heads.has(bindingKey(author, scope, name))) name += '-x';
      const extra = { author, scope, name, bindingOrdinal: 0 };
      index.ordered.push(extra);
      index.dense.push(extra);
      index.slots.set(bindingKey(author, scope, name), index.dense.length - 1);
    }
    break;
  }
  return copy;
}
