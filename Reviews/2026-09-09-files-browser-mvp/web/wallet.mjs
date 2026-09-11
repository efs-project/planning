// Real-wallet path (EIP-1193): the browser talks to actual wallet software
// via window.ethereum. Every request here surfaces the wallet's OWN prompt —
// nothing is simulated, nothing auto-approved, and no private key ever
// touches the page. Roles are deliberately separate:
//   author    = the claimed principal (an EFS identity)
//   signer    = the wallet account bound to it (signs the typed intent)
//   submitter = whoever sends transactions (an explicit sponsor, or the
//               wallet itself in the labeled direct mode)
//   payer     = whoever pays gas (the sponsor, or the wallet account)
import { keccak256, concat, toUtf8Bytes } from '/Reviews/2026-09-04-mvp-rehearsal/node_modules/ethers/dist/ethers.js';
import { publicationHash, opCommitmentOf } from '/Reviews/2026-09-09-files-browser-mvp/sdk/files-actions.mjs';

export function detectProvider() {
  const p = globalThis.ethereum;
  return p && typeof p.request === 'function' ? p : null;
}

// Deterministic default principal for an account (any unclaimed bytes32 is
// claimable first-come — this is FIXTURE identity, not production account
// derivation; salt walks past a squatted default).
export function principalFor(account, salt = 0) {
  return keccak256(concat([toUtf8Bytes('efs2/files/wallet-principal/1'), account, toUtf8Bytes(String(salt))]));
}

export async function connect(provider, expectedChainId) {
  const accounts = await provider.request({ method: 'eth_requestAccounts', params: [] });
  if (!accounts?.length) throw Error('the wallet returned no account');
  const chainId = parseInt(await provider.request({ method: 'eth_chainId', params: [] }), 16);
  if (chainId !== expectedChainId) throw Error('the wallet is on chain ' + chainId + ', this fixture runs on ' + expectedChainId + ' — switch networks in the wallet');
  return { account: accounts[0], chainId };
}

// ONE wallet signature request covering the whole operation: records, op
// commitment AND byte commitment. Rejection in the wallet throws code 4001.
export async function signAuthorIntent(provider, account, plan, { core, chainId, executor, executorCodehash, executionSetId, nonce, deadline, byteCommitment }) {
  const ZERO = '0x' + '0'.repeat(64);
  const intent = {
    opCommitment: plan.op ? opCommitmentOf(plan.op) : ZERO,
    byteCommitment: byteCommitment ?? ZERO,
    executor, executorCodehash, nonce, deadline,
  };
  const payload = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' }, { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' }, { name: 'verifyingContract', type: 'address' },
      ],
      AuthorIntent: [
        { name: 'publicationHash', type: 'bytes32' }, { name: 'executionSetId', type: 'bytes32' },
        { name: 'opCommitment', type: 'bytes32' }, { name: 'byteCommitment', type: 'bytes32' },
        { name: 'executor', type: 'address' }, { name: 'executorCodehash', type: 'bytes32' },
        { name: 'nonce', type: 'uint64' }, { name: 'deadline', type: 'uint64' },
      ],
    },
    primaryType: 'AuthorIntent',
    domain: { name: 'EFS Files Authority', version: '3', chainId, verifyingContract: core },
    message: {
      publicationHash: publicationHash(plan.publication), executionSetId,
      opCommitment: intent.opCommitment, byteCommitment: intent.byteCommitment,
      executor, executorCodehash, nonce: String(nonce), deadline: String(deadline),
    },
  };
  const signature = await provider.request({ method: 'eth_signTypedData_v4', params: [account, JSON.stringify(payload)] });
  return { intent, signature, payload };
}

export const isRejection = e => e?.code === 4001 || /reject|denied|cancell?ed/i.test(e?.message ?? '');

// Labeled DIRECT mode: the wallet account itself submits (and pays for) each
// transaction — one wallet prompt per transaction, honestly counted upstream.
export async function sendTransaction(provider, { from, to, data, gas }) {
  return provider.request({ method: 'eth_sendTransaction', params: [{ from, to, data, gas }] });
}

const sponsorJSON = value => JSON.stringify(value, (_, v) => typeof v === 'bigint' ? String(v) : v);
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;

// Persist this PUBLIC identity before submission, not the signed request or
// file bytes. The server independently recomputes the same commitment. JSON
// wire normalization makes bigint/string values and object key order stable.
export function sponsorRequestIdentity(body) {
  const { requestId, requestCommitment: ignored, ...request } = JSON.parse(sponsorJSON(body));
  const requestCommitment = keccak256(toUtf8Bytes(sponsorJSON(canonical(request))));
  return { requestId: requestId ?? requestCommitment, requestCommitment };
}

function sponsorEvidence(value, identity) {
  return { ...identity, ...value,
    submitted: value?.submitted === true ? true : value?.submitted === false ? false : null,
    transactions: Array.isArray(value?.transactions) ? value.transactions : [],
  };
}

function sponsorError(message, evidence, flags = {}) {
  return Object.assign(Error(message), evidence, flags, { result: evidence, data: evidence.data ?? null });
}

async function sponsorRequest(url, body, identity, boundedJSON) {
  let response, parsed;
  try {
    response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: sponsorJSON(body), credentials: 'omit', cache: 'no-store' });
    parsed = await boundedJSON(response, 1048576);
  } catch {
    // A failed fetch/body read does NOT prove that the sponsor was not reached.
    throw sponsorError('Sponsor response unavailable; submission is unknown.', sponsorEvidence(null, identity), { transport: true });
  }
  if (!response.ok || parsed?.error !== undefined) {
    const evidence = sponsorEvidence(parsed, identity);
    // Older app versions used `structured && !submitted` as a refusal guard.
    // Do not activate that legacy guard for null/missing/invalid evidence.
    throw sponsorError(parsed?.error ?? 'sponsor refused (' + response.status + ')', evidence, { structured: evidence.submitted !== null });
  }
  if (!parsed?.result || typeof parsed.result !== 'object') {
    throw sponsorError('Sponsor response is incomplete; submission is unknown.', sponsorEvidence(null, identity), { transport: true });
  }
  return sponsorEvidence(parsed.result, identity);
}

// Read-only recovery: never carries the author signature and never broadcasts.
// Unknown/missing process state is not permission to retry a signed operation.
export async function sponsorStatus(sponsorUrl, identity, boundedJSON) {
  const publicIdentity = { requestId: identity.requestId, requestCommitment: identity.requestCommitment };
  return sponsorRequest(sponsorUrl.replace(/\/$/, '') + '/status', publicIdentity, publicIdentity, boundedJSON);
}

export async function sponsorSubmit(sponsorUrl, body, boundedJSON) {
  const identity = sponsorRequestIdentity(body);
  try { return await sponsorRequest(sponsorUrl, { ...body, ...identity }, identity, boundedJSON); }
  catch (e) {
    if (!e.transport) throw e;
    // One status lookup can recover a lost response. No automatic resubmission,
    // no polling loop, and no new signature. Caller retains the identity if
    // the sponsor itself is unavailable or the request is still processing.
    let recovered;
    try { recovered = await sponsorStatus(sponsorUrl, identity, boundedJSON); }
    catch { throw e; }
    if (recovered.status === 'completed' && !recovered.error) return recovered;
    throw sponsorError(recovered.error ?? e.message, recovered, { transport: true });
  }
}
