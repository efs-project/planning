// Public recovery hints only, never authorization or proof. Persist BEFORE any
// signature/send ambiguity. Missing/corrupt storage fails closed for new writes.
const clone = x => JSON.parse(JSON.stringify(x, (_, v) => typeof v === 'bigint' ? String(v) : v));
const pick = (x, fields) => Object.fromEntries(fields.filter(k => x?.[k] !== undefined).map(k => [k, clone(x[k])]));
const contextFields = ['environmentId', 'chainId', 'core', 'executionId', 'principal', 'account', 'mountId', 'lensId', 'sourceId', 'destinationId', 'carrier', 'router'];
const occurrence = x => x == null ? null : pick(x, ['envelopeId', 'leafIndex']);
function descriptor(x) {
  if (!x) return null;
  return { version: x.version, op: pick(x.op, ['kind', 'mountId', 'parent', 'name', 'sourceParent', 'sourceName', 'object', 'aux', 'ancestorNames']),
    publication: { ...pick(x.publication, ['envelopeId', 'recordIds', 'leafMask']), header: pick(x.publication?.header, ['profile', 'principalId', 'authorityRef', 'authEpoch', 'pubNonce', 'notAfter']), expectedRevisions: (x.publication?.expectedRevisions ?? []).map(r => pick(r, ['leafIndex', 'revision'])) },
    expectedBindings: (x.expectedBindings ?? []).map(b => ({ ...pick(b, ['leafIndex', 'recordId', 'typeId', 'purpose', 'subject', 'fieldRole', 'targetRecord']), targetOccurrence: occurrence(b.targetOccurrence), predecessor: occurrence(b.predecessor), revision: b.revision })) };
}
function clean(x) {
  for (const [key, allowed] of Object.entries({ authorization: ['not-signed', 'unknown', 'closed'], admission: ['UNKNOWN', 'ADMITTED'], selection: ['UNKNOWN', 'SELECTED', 'NOT_SELECTED'], effect: ['UNKNOWN', 'COMMITTED'], bytes: ['NOT_CHECKED', 'VERIFIED', 'UNAVAILABLE'] })) {
    if (x[key] != null && !allowed.includes(x[key])) throw Error('Invalid recovery ' + key);
  }
  return { ...pick(x, ['actionId', 'label', 'nonce', 'deadline', 'authorization', 'admission', 'selection', 'effect', 'bytes', 'requestId', 'requestCommitment', 'sponsorUrl', 'requestedFileId']),
    context: pick(x.context, contextFields), descriptor: descriptor(x.descriptor),
    content: x.content ? pick(x.content, ['treeId', 'size', 'chunkCount', 'fileId']) : null };
}
export function createActionJournal(storage, key = 'efs-files-recovery-v1') {
  let rows;
  try { const raw = storage.getItem(key); const saved = raw ? JSON.parse(raw) : { version: 1, actions: [] }; if (saved.version !== 1 || !Array.isArray(saved.actions)) throw Error('invalid journal'); rows = saved.actions.map(clean); }
  catch { throw Error('Recovery storage unavailable or corrupt; wallet submission disabled.'); }
  const save = next => { try { storage.setItem(key, JSON.stringify({ version: 1, actions: next })); } catch { throw Error('Recovery storage could not be saved; submission stopped.'); } rows = next; };
  return Object.freeze({
    begin(input) {
      if (rows.some(x => x.actionId === input.actionId)) throw Error('Action identity is immutable');
      if (!input.context?.environmentId || !input.context?.principal || !/^\d+$/.test(input.nonce) || !/^\d+$/.test(input.deadline)) throw Error('Invalid recovery identity');
      const value = clean({ ...input, authorization: 'not-signed', admission: 'UNKNOWN', selection: 'UNKNOWN', effect: 'UNKNOWN', bytes: 'NOT_CHECKED' });
      save([...rows, value]); return clone(value);
    },
    mark(id, patch) {
      if (['context', 'descriptor', 'nonce', 'deadline', 'content'].some(k => k in patch)) throw Error('Action identity is immutable');
      const i = rows.findIndex(x => x.actionId === id); if (i < 0) throw Error('Unknown recovery action');
      const next = clone(rows); next[i] = clean({ ...next[i], ...pick(patch, ['authorization', 'admission', 'selection', 'effect', 'bytes', 'requestId', 'requestCommitment', 'sponsorUrl']) }); save(next);
    },
    conflict(context, nonce, chainTimestamp) {
      return clone(rows.find(x => x.context.environmentId === context.environmentId && x.context.principal === context.principal && x.nonce === String(nonce) && x.authorization === 'unknown' && BigInt(chainTimestamp) <= BigInt(x.deadline)) ?? null);
    },
    entries: () => clone(rows), export: () => JSON.stringify({ version: 1, actions: rows.map(clean) }),
    resetDisplay() { /* Display reset deliberately cannot delete authority guards. */ },
  });
}
export async function assertWalletContext(provider, context) {
  const accounts = await provider.request({ method: 'eth_accounts', params: [] });
  const chain = await provider.request({ method: 'eth_chainId', params: [] });
  if (!accounts?.[0] || accounts[0].toLowerCase() !== context.account?.toLowerCase()) throw Error('Wallet account changed; stopped before the next prompt/send. Reconcile the original action.');
  if (BigInt(chain) !== BigInt(context.chainId)) throw Error('Wallet chain changed; stopped before the next prompt/send. Reconcile on the original chain.');
}
export async function withAuthorizationFence(locks, work) {
  if (!locks?.request) throw Error('Exclusive writer lock unavailable; writes disabled, guest reads remain available.');
  return locks.request('efs-files-authorizing-v1', { mode: 'exclusive', ifAvailable: true }, async lock => {
    if (!lock) throw Error('A Files write is active in another tab. Wait and reconcile before authorizing.');
    return work();
  });
}
export async function assertDeploymentContext(source, context) {
  const block = await source.request('eth_getBlockByNumber', ['0x1', false]);
  if (source.identity !== context.sourceId || !block?.hash || !context.environmentId.endsWith('/' + block.hash)) throw Error('Source deployment changed; stop and reopen the original environment before recovery or submission.');
}
