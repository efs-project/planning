# Ethereum accounts, passkeys, sessions, recovery, and UX

**Research date:** 2026-07-11  
**Role:** Ethereum account/key ecosystem lane

> **Post-synthesis specialist correction:** [[kel]] now requires a deployed smart account to call the authority-home registry directly (`msg.sender` is that account); ERC-6492 never authorizes canonical inception. It pins pure state-independent bare secp256k1 semantics against draft EIP-8151, treats 2026 native-account proposals as competing drafts, uses typed root/child grants with cumulative caps, and expands the WebAuthn profile. Those rulings supersede looser wording below.

## Core separation

EFS must use separate nouns for:

1. stable EFS principal;
2. canonically selected authority home (KEL + authoritative admission);
3. slow control/recovery policy;
4. routine record signer;
5. device/app/session actor;
6. Ethereum execution account;
7. payer/submitter; and
8. encryption and local-vault keys.

The current envelope's decision to ignore `msg.sender` is the right seam. The durable EFS principal controls or links Ethereum accounts; an Ethereum account never silently becomes the century principal.

## Standards matrix, checked 2026-07-11

### Adopt as adapters or design precedents

| Standard | Status | EFS ruling |
|---|---|---|
| [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) | Final; current reference EntryPoint release [v0.9.0](https://github.com/eth-infinitism/account-abstraction/releases/tag/v0.9.0) | submission, sponsorship, batching, smart-account policy mirror; detect version/codehash, do not Etch one address |
| [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) | Final/live | execution continuity, batching, sponsorship; not recovery; audited wallet-controlled delegate, atomic init and storage-layout checks required |
| [EIP-5792](https://eips.ethereum.org/EIPS/eip-5792) | Final | wallet capability discovery and batched calls |
| [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271) | Final | optional chain-account binding only; forbidden for portable record/KEL verification |
| [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492) | Final | provisional endpoint UX evidence only; never canonical KEL inception/authority because verification may deploy and call arbitrary preparation code |
| [ERC-7913](https://eips.ethereum.org/EIPS/eip-7913) | Final | copy address-less `(verifier/suite, key bytes)` abstraction and immutable/stateless verifier discipline |
| [EIP-7951](https://eips.ethereum.org/EIPS/eip-7951) | Final; active on Ethereum mainnet since Fusaka/Osaka | exact raw P-256 semantics and edge vectors; other venues need fork/config conformance proof; application still enforces low-S and WebAuthn policy |

### Track behind capability detection; do not freeze

- [ERC-7579](https://eips.ethereum.org/EIPS/eip-7579) and [ERC-6900](https://eips.ethereum.org/EIPS/eip-6900): Draft modular-account interfaces; useful policy/module adapters.
- [ERC-7710](https://eips.ethereum.org/EIPS/eip-7710) and [ERC-7715](https://eips.ethereum.org/EIPS/eip-7715): Draft delegation/permission RPCs; wallet-specific enforcement and phishing risk remain.
- [ERC-7677](https://eips.ethereum.org/EIPS/eip-7677): Review-stage paymaster service capability; privacy/availability dependency.
- [ERC-7739](https://eips.ethereum.org/EIPS/eip-7739): Draft defensive smart-account rehashing; reinforces why contract signatures are account-scoped.
- [ERC-7821](https://eips.ethereum.org/EIPS/eip-7821) and [ERC-7902](https://eips.ethereum.org/EIPS/eip-7902): Draft batch/capability adapters; 7902's 7702 authorization capability is exceptionally sensitive.
- [EIP-7851](https://eips.ethereum.org/EIPS/eip-7851) and [EIP-8151](https://eips.ethereum.org/EIPS/eip-8151): Draft proposals to burn residual ECDSA authority and make `ecrecover` state-aware; important direction, unacceptable Etched dependency while unsettled.
- [EIP-8130](https://eips.ethereum.org/EIPS/eip-8130): Draft native AA configuration with actor/authenticator roles, scopes, expiry, bounded delegation, locking.
- [EIP-8141](https://eips.ethereum.org/EIPS/eip-8141): Draft frame transactions, native validation/payment separation and P-256/PQ direction.
- [EIP-8164](https://eips.ethereum.org/EIPS/eip-8164) and [EIP-8202](https://eips.ethereum.org/EIPS/eip-8202): Draft native/PQ and Merkle one-time-key directions.
- [ERC-8152](https://eips.ethereum.org/EIPS/eip-8152): Review-stage content-addressed module packaging; useful reproducible-verifier precedent, not a trust substitute for source/build/audit verification.

EIP-7851 and EIP-8164 assign incompatible meanings to `0xef0101`; EIP-8141 and EIP-8164 both claim transaction type `0x06`. These proposals are competing experiments, not a coherent future stack.

## EIP-7702 is not recovery

7702 delegation is authorized by the original secp256k1 EOA key and may be replaced/cleared by a later valid authorization. A stolen original key can redelegate. EFS may disable the bare key inside its own KEL after inception, but that does not protect funds at the Ethereum address.

Normative UX consequence: after EOA→KEL upgrade, show two distinct facts:

- “EFS identity no longer accepts the old key”; and
- “this Ethereum address may still be controlled by the old key.”

Offer asset migration to a recoverable smart account. Never render one green “account recovered” badge.

## Smart wallets without ERC-1271 authorship

Two compatible paths:

1. **Preferred:** Safe/4337 UI collects explicit raw owner/P-256/PQ signatures into an EFS control policy. The Safe coordinates but is not the verifier.
2. **Direct bootstrap:** a deployed smart account calls the authority-home registry itself to create a digest-shaped principal and appoint portable EFS keys. The registry must observe `msg.sender == bootstrapAccount` and bind chain/account/registry/proof basis into inception. No intermediary adapter or counterfactual 6492 path authorizes it. Later records use EFS-native keys.

Do not use a chain-local contract address as a globally bare identity. The same address may have different code/controllers on another chain. Contract-rooted principals should be digest-shaped and bind their home, or all identity state should use one universal home.

## ERC-7913-inspired suite design

ERC-7913 correctly moves from “signer is an address” to arbitrary key bytes plus a verifier and says perpetual verifiers should be stateless/nonupgradeable. EFS should freeze:

```text
suiteId + canonical public key + verifierProfileHash
```

and map a suite to an immutable verifier codehash/spec per venue. Permanent artifacts must not contain one chain-specific verifier address. The ERC-7913 empty-key fallback to ERC-1271 is excluded from portable KEL authority.

## Passkeys

[WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/) makes several limits explicit:

- credentials are RP-ID/domain scoped;
- the standard defines authenticator backup-state flags, not a portable provider-neutral sync/backup protocol;
- signature counters may be zero or unsuitable as a hard clone oracle;
- synced credentials inherit provider-account recovery;
- multiple credentials/recovery are expected for robust accounts.

P-256 at `0x100` solves curve verification cost on Ethereum mainnet and confirmed conforming venues, not identity binding or WebAuthn ceremony verification. A KEL WebAuthn descriptor binds exact `type == webauthn.get`, challenge bytes/base64url, RP hash and RP/origin relation, allowed origins, `crossOrigin/topOrigin`, UP/UV, BE/BS (reject `BE=0,BS=1`), counters, strict JSON duplicate handling, extension policy, COSE/point/length caps, strict DER/no trailing bytes, and low-S normalization before witness storage. Control/recovery requires UV.

Use `attestation: none` by default and make no hardware-backed claim from it. Publishing authenticator model, device label, shared public key, flags, counters, or one RP across principals creates fingerprint/linkage. One passkey is never the sole century root; include a non-synced, non-RP-dependent factor and test loss of the RP domain.

WebAuthn PRF is a strong local-vault unlock convenience, but the PRF credential/provider must not become the KEL root or the file-encryption master key.

## Session grant synthesis

The strongest production convergence is “one actor + explicit policies + one action,” as seen in ZeroDev/Alchemy/Safe-style modules. EFS should make the grant protocol-independent:

```text
principal, authEpoch, ROOT/CHILD, parent + issuer signature,
actor descriptor + acceptance, typed audience, closed actions/kinds/definitions,
immutable exact/subtree resource scopes, venues, per-envelope + cumulative maxima,
fixed home-block interval, remainingDepth, nonce
```

Rules:

- proof-of-possession, never bearer;
- child authority is the intersection of all ancestors;
- fixed expiry; no sliding renewal;
- default depth zero; protocol maximum one or two;
- unknown actions/constraints fail closed;
- no root/recovery, persona/account binding, key export, KEM/decrypt, or other-app revoke in ordinary sessions;
- separate key per app × principal × device;
- home `authEpoch` kills all sessions O(1), selective grant/key revocation handles narrow incidents;
- scope is checked over actual canonical record bytes, not app-provided prose.
- empty sets mean none, browser origin is Guardian/OS policy rather than an on-chain fact, and mutable graph membership cannot widen scope;
- first use permanently exposes the materialized actor, ancestry, timing and scopes; “private until first use” is not ongoing privacy.

[UCAN](https://ucan.xyz/specification/) is the best public delegation/revocation precedent; [Biscuit](https://doc.biscuitsec.org/reference/specifications) contributes monotone attenuation. EFS rejects UCAN's unbounded proof DAG/JSON flexibility and Biscuit's bearer/general-Datalog runtime for Tier 1.

## Recovery UX and security

Default consumer profile:

- passkey/hardware daily key;
- second independent credential enrolled immediately;
- 2-of-3 recovery across distinct failure domains;
- guardian commitments instead of public named lists where practical;
- exact new-policy proposal + new-key acceptance;
- immediate protective pending state;
- delayed permissionless finalization;
- current key may object but cannot cancel forever;
- recovery bumps control and session/auth epochs;
- recovery-policy changes have longer delay and independent alerts.

Argent's majority-guardian/delay model is useful shipped UX, but provider/email/guardian dependencies must be named. Safe modules are powerful enough to take over accounts; they are adapters, not roots. Privy, Turnkey, Lit, Web3Auth and similar MPC/TEE systems can be optional guardians/operational custody if users have an export/exit and an independent recovery route. Their infrastructure, auth tokens, enclaves, share availability and governance are real trust assumptions.

## Threshold organizations

Baseline: explicit m-of-n signatures on rare KEL events. This supports heterogeneous keys and clear accountability.

[FROST RFC 9591](https://www.rfc-editor.org/rfc/rfc9591.html) is an IRTF/CFRG Informational RFC; DKG is out of scope, signing needs two rounds, and nonce misuse is catastrophic. Its P-256/secp256k1 suites are Schnorr, not `ecrecover` ECDSA. Threshold ECDSA can emit Ethereum-compatible signatures but has no equally stable standard and has complex preprocessing/nonce risks.

Therefore threshold/MPC is an optional actor-key adapter after external review. It may compress an organization's per-record quorum into one signature without putting threshold evaluation in every EFS verifier.

## Privacy

A KEL is public correlation. Device/app grants, common guardians, reused passkeys/P-256 keys, account factories/modules, same-address multichain bindings, paymasters and submitters all cluster activity.

For unlinkability:

- separate principal/KEL;
- fresh control/recovery/encryption/execution keys;
- no public parent grant or persona link;
- no deterministic same execution address across chains unless public continuity is intended;
- privacy-preserving submission/funding routes; and
- distinct KEM key per persona.

Guardian commitments reduce standing disclosure but recovery use still reveals timing and often participants. A simple auditable recovery remains preferable to opaque “private” recovery that users cannot execute.

## Normative account UX rule

Every recovery screen reports three independent results:

| Plane | Question |
|---|---|
| EFS identity | can this principal rotate and author future records? |
| Ethereum accounts/funds | can each bound chain account execute and move assets? |
| Encrypted data | can content keys be unwrapped/restored? |

One app may make this feel coherent. It must never make the blast radii indistinguishable.
