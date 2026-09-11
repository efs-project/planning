// DISPOSABLE: copies a synthetic evidence graph for a small product projection.
// It does NOT verify authorization, hashes, C0 bytes, state, or semantic effect.
// The finite node bound below is a laboratory limit, not a protocol/API default.
export function capture(root, store, { profile, runId, maxNodes = 16 }) {
  if (!Number.isSafeInteger(maxNodes) || maxNodes < 1) throw new Error('EVIDENCE_LIMIT');
  const first = store.get(root);
  if (!first) throw new Error(`MISSING_EVIDENCE:${root}`);
  if (first.profile !== profile) throw new Error('PROFILE_MISMATCH');
  if (first.runId !== runId) throw new Error('RUN_MISMATCH');
  const seen = new Set();
  const nodes = [];
  const pending = [root];
  while (pending.length) {
    const id = pending.pop();
    if (seen.has(id)) continue;
    if (nodes.length >= maxNodes) throw new Error('EVIDENCE_LIMIT');
    const node = store.get(id);
    if (!node) throw new Error(`MISSING_EVIDENCE:${id}`);
    if (node.profile !== undefined && node.profile !== profile) throw new Error('PROFILE_MISMATCH');
    if (node.runId !== undefined && node.runId !== runId) throw new Error('RUN_MISMATCH');
    seen.add(id);
    nodes.push([id, structuredClone(node)]);
    pending.push(...node.refs.toReversed());
  }
  // No fabricated signature, Core acceptance, point outcome, or effect verdict.
  const summary = { family: first.family };
  if (first.stage !== undefined) summary.stage = first.stage;
  return { profile, runId, root, summary, nodes };
}
