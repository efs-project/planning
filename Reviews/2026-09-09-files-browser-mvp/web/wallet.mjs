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

export async function sponsorSubmit(sponsorUrl, body, boundedJSON) {
  let response;
  try { response = await fetch(sponsorUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body, (_, v) => typeof v === 'bigint' ? String(v) : v), credentials: 'omit', cache: 'no-store' }); }
  catch (e) { e.transport = true; throw e; } // the sponsor was NOT reached
  const parsed = await boundedJSON(response, 1048576).catch(e => { e.transport = true; throw e; });
  if (!response.ok || parsed?.error !== undefined) {
    // A structured refusal: the sponsor answered and provably did not submit.
    const e = Error(parsed?.error ?? 'sponsor refused (' + response.status + ')');
    e.data = parsed?.data ?? null; e.structured = true; throw e;
  }
  return parsed.result;
}
