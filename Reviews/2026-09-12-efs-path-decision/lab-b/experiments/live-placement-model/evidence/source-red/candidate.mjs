// Deliberately simple behavioral RED stub. Replace only after root observes RED.
// No reference import; the future live index must maintain its own membership.
export function prepare(events, options = {}) {
  return { events, options, fault: null, preparationCounters: { effects: 0, membershipUpdates: 0, sortComparisons: 0 } };
}
export function withFault(model, fault) { return { ...model, fault }; }
export function inspectMembership() { return []; }
const counters = () => ({ coverageChecks: 0, membershipReads: 0, headProbes: 0,
  dedupChecks: 0, sortComparisons: 0, materialized: 0 });
export function union() { return { status: 'COMPLETE', entries: [], counters: counters() }; }
export function page() { return { status: 'COMPLETE', entries: [], next: null, counters: counters() }; }
export function tagged() { return { status: 'COMPLETE', entries: [], counters: counters() }; }
