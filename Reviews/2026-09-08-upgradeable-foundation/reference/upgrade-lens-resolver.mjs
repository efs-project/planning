import { verifyUpgradeState } from './upgrade-reader.mjs';
import { parsePlan, modelLens } from '../../2026-09-05-c0-core/reference/lens-resolver.mjs';

// Never trust a supplied VERIFIED label or fold. Only the unchanged independent
// history/state verifier establishes the evidence passed to the pure B0 model.
export function resolveUpgradeLens(state, expected, planId, position, options = {}) {
  if (!state?.snapshot) return { outcome: 'UNKNOWN', reason: 'missing upgrade snapshot for Lens observation' };
  const checked = verifyUpgradeState(state.snapshot, expected);
  if (checked.outcome !== 'VERIFIED') return checked;
  const active = checked.execution.history.at(-1);
  const record = checked.snapshot.records.find(r => r.id === planId);
  const basis = { realmRevisionId: active.id, blockNumber: BigInt(checked.basis.number),
    admissionHigh: BigInt(checked.counts[4]), basisKind: 0 };
  const value = modelLens(record ? parsePlan(record.row[0], record.row[1]) : null,
    checked.fold.bindings, position, basis, options);
  return { outcome: 'VERIFIED', value, basis: checked.basis, execution: checked.execution };
}
