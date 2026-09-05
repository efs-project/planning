const q = result => result?.qualification ?? result ?? {};

function compact(value, head = 12, tail = 8) {
  const text = String(value ?? '');
  return text.length > head + tail + 1 ? `${text.slice(0, head)}…${text.slice(-tail)}` : text;
}

function basisHash(result) {
  const basis = result?.basis ?? result;
  return typeof basis === 'string' ? basis.toLowerCase() : String(basis?.blockHash ?? '').toLowerCase();
}

function isQualifiedExact(result) {
  const qualification = q(result);
  return result?.outcome === 'FOUND' &&
    qualification.coverage === 'COMPLETE' &&
    qualification.support === 'SUPPORTED' &&
    qualification.validation === 'VALID' &&
    qualification.currentness === 'CURRENT_AT_BASIS' &&
    qualification.availability === 'AVAILABLE' &&
    Boolean(basisHash(result));
}

function displayValue(value) {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Uint8Array) return `0x${Array.from(value, byte => byte.toString(16).padStart(2, '0')).join('')}`;
  if (typeof value === 'object' && value != null) return taggedJson(value).replace(/\s+/g, ' ');
  return String(value);
}

export function humanKind(value) {
  if (String(value).toLowerCase() === '1' || /directory|folder/i.test(String(value))) return 'Folder';
  if (String(value).toLowerCase() === '2' || /^file$/i.test(String(value))) return 'File';
  return String(value ?? 'Record');
}

export function rowEvidence(qualification = {}) {
  const integrity = qualification.integrity;
  if (integrity === 'NOT_APPLICABLE' || integrity == null) return 'Observed metadata';
  if (integrity === 'VERIFIED') return 'Verified';
  if (integrity === 'FAILED') return 'Integrity failed';
  return String(integrity).toLowerCase().replaceAll('_', ' ');
}

export function formatBasisSummary(status = {}, basis) {
  const current = basis ?? status.basis;
  const profile = status.profile ?? 'efs-lab profile';
  const chain = status.chainId ?? status.chain ?? 'explicit';
  const number = current?.blockNumber;
  const hash = basisHash(current);
  if (hash) return `${profile} · chain ${chain} · ${number == null ? 'fixed basis' : `block ${number}`} · ${compact(hash)}`;
  return `${profile} · chain ${chain} · ${compact(status.realmId ?? 'basis pending')}`;
}

export function decodedFieldRows(decoded = {}) {
  if (!Array.isArray(decoded.fields)) return [];
  return decoded.fields.map((value, index) => ({ name: `Field ${index + 1}`, value: displayValue(value) }));
}

export function verifiedLaunchSelection({ selection, bytes, expectedContentId }) {
  if (!isQualifiedExact(selection) || String(selection.value?.contentId ?? '').toLowerCase() !== String(expectedContentId).toLowerCase()) {
    throw new Error('Pinned game selection is not a qualified exact content match');
  }
  const byteQualification = q(bytes);
  if (!isQualifiedExact(bytes) || byteQualification.integrity !== 'VERIFIED' || byteQualification.bytes !== 'RETURNED' || !(bytes?.bytes instanceof Uint8Array)) {
    throw new Error('Game bytes are not a qualified verified return');
  }
  if (basisHash(selection) !== basisHash(bytes)) throw new Error('Game selection and bytes do not share one fixed basis');
  return bytes.bytes;
}

export function createLaunchCoordinator(host) {
  let generation = 0;
  const current = token => token === generation;
  return {
    cancel() { generation += 1; },
    async play(context) {
      const token = ++generation;
      try {
        const selection = await host.select(context);
        if (!current(token)) return { launched: false, cancelled: true };
        const loaded = await host.load(context, selection);
        if (!current(token)) return { launched: false, cancelled: true };
        const bytes = host.admit({ context, selection, loaded });
        if (!current(token)) return { launched: false, cancelled: true };
        host.launch(bytes);
        return { launched: true, selection, loaded, bytes };
      } catch (error) {
        if (!current(token)) return { launched: false, cancelled: true };
        throw error;
      }
    },
  };
}

export function verifiedSessionGrant({ observed, expectedGrant, expectedGrantId }) {
  const actual = observed?.value?.grant;
  const fields = ['key', 'scope', 'operations', 'expiry', 'maxWrites', 'maxBytes', 'nonce'];
  const matches = actual && fields.every(field => String(actual[field]).toLowerCase() === String(expectedGrant?.[field]).toLowerCase());
  const subjectMatches = String(observed?.domain?.subject ?? '').toLowerCase() === String(expectedGrantId ?? '').toLowerCase();
  const approval = observed?.value?.approval;
  if (!isQualifiedExact(observed) || !subjectMatches || !matches || observed.value.revoked !== false || typeof approval !== 'string' || approval === '0x') {
    throw new Error('Session grant is not the qualified exact expected active grant');
  }
  return true;
}

export function classifyRead(result) {
  const qualification = q(result);
  if (result?.outcome === 'UNKNOWN' || result?.outcome === 'CONFLICT') {
    return { tone: 'warning', title: 'Cannot establish this read', detail: result?.reasonCode ?? result?.outcome };
  }
  if (qualification.coverage !== 'COMPLETE') {
    const count = result?.items?.length ?? (result?.value ? 1 : 0);
    return { tone: 'warning', title: `${count} loaded · listing incomplete`, detail: result?.reasonCode ?? 'Coverage is not complete' };
  }
  if (result?.outcome === 'ABSENT_PROVEN') return { tone: 'quiet', title: 'Absent at this basis', detail: 'Complete supported evaluation' };
  return { tone: 'good', title: 'Qualified result', detail: 'Evidence is available for inspection' };
}

export function operationPresentation(operation = {}) {
  const success = operation.stage === 'READ_BACK_VERIFIED' && operation.effect === 'COMMITTED';
  if (success) return { success, tone: 'good', title: 'Saved · read-back verified' };
  if (operation.stage === 'WORKING') return { success: false, tone: 'pending', title: 'Working · preparing exact plan' };
  if (operation.stage === 'REVERTED' || operation.effect === 'NOT_COMMITTED_PROVEN') {
    return { success: false, tone: 'danger', title: 'Write was not committed' };
  }
  return { success: false, tone: 'pending', title: 'Submitted · verifying effect' };
}

export function promptPolicy(mode, sessionReady) {
  if (mode === 'RELAYED_EOA') return { setup: 0, routine: 1, kind: 'message' };
  if (mode === 'DIRECT_EOA') return { setup: 0, routine: 1, kind: 'transaction' };
  if (mode === 'SESSION') return sessionReady
    ? { setup: 0, routine: 0, kind: 'session' }
    : { setup: 1, routine: 0, kind: 'grant setup' };
  throw new Error(`Unsupported approval mode: ${mode}`);
}

export function verifiedLaunchBytes(result) {
  const qualification = q(result);
  if (qualification.integrity !== 'VERIFIED' ||
      qualification.availability !== 'AVAILABLE' ||
      qualification.bytes !== 'RETURNED' ||
      !(result?.bytes instanceof Uint8Array)) {
    throw new Error('Game bytes were not independently verified and returned');
  }
  return result.bytes;
}

export function createGameLease(host) {
  let url;
  return {
    launch(bytes) {
      this.stop();
      url = host.createUrl(bytes);
      host.mount({ src: url, sandbox: 'allow-scripts' });
    },
    stop() {
      if (!url) return;
      const previous = url;
      url = undefined;
      host.unmount();
      host.revokeUrl(previous);
    },
  };
}

export function taggedJson(value) {
  return JSON.stringify(value, (_, item) => {
    if (typeof item === 'bigint') return { $bigint: item.toString() };
    if (item instanceof Uint8Array) return { $bytes: Array.from(item, b => b.toString(16).padStart(2, '0')).join('') };
    return item;
  }, 2);
}
