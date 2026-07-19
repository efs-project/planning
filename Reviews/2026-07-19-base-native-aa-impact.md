# Base native account abstraction (EIP-8130) — impact on EFS

**Date reviewed:** 2026-07-19
**Trigger:** Base Build's 2026-07-17 announcement of native account abstraction on Base
**Scope:** EFS v1/EAS write UX, v2 envelope and KEL, SDK/client submission rails, relayers, and large uploads
**Disposition:** favorable external development; integrate as a capability-detected account/submission adapter, not as EFS record identity

#kind/note #repo/planning #repo/contracts #repo/sdk #repo/client

## What changed

Base announced that [EIP-8130](https://eips.ethereum.org/EIPS/eip-8130) is planned for Base's Cobalt upgrade in September 2026, with OP Stack adoption targeted later in the year. The implementation is available early on [Base Vibenet](https://vibes.base.org/). The [Base engineering announcement](https://blog.base.dev/native-account-abstraction) describes native batching, gas sponsorship, account portability, P-256/passkey actors, session keys, subaccounts, metadata, parallel nonces, and future authenticator agility without the ERC-4337 EntryPoint/bundler path.

As reviewed on 2026-07-19, EIP-8130 is still a **Draft Core EIP**. Its exact transaction type, scope bits, canonical authenticator set, deterministic deployment addresses, RPC shape, and companion ERCs are therefore adapter inputs to version and test, not constants EFS should Etch.

Base's published comparison reports materially lower AA overhead than ERC-4337 for two USDC-transfer examples (about 60–63% less gas and 56–83% fewer transaction bytes). Those figures are not EFS write estimates: EFS's full record bodies, mandatory indexes, and byte storage can dominate total gas. Measure complete EFS operations on Vibenet before making cost claims.

## The architectural boundary

EIP-8130 answers:

> Which configured actor authorized this chain transaction, and which account pays for it?

EFS answers:

> Which stable principal authorized this portable record, was that actor authorized at the authoritative time, and how can a later verifier reproduce that fact?

They are complementary layers. An EIP-8130 sender signature is transaction- and chain-bound. The EFS envelope is deliberately chain-free, carrier-independent, and replayable by any submitter. EFS MUST therefore keep principal/authorship authority independent of `msg.sender`, the transaction sender actor, payer, wallet vendor, relayer, and submission mechanism (R-D8).

Consequences:

- Do not replace the EFS envelope witness with `getTransactionSenderActorId()` or `msg.sender`.
- Do not replace EFS `order`, claim IDs, or replay semantics with EIP-8130's 2D/nonce-free transaction nonces. Those schedule inclusion; they do not identify or order EFS records.
- Do not admit ERC-1271 as canonical portable EFS authority merely because EIP-8130 uses ERC-1271-compatible account infrastructure off the native path.
- Do not bind Etched EFS bytes to Base Account SDK, Base-specific RPCs, EIP-8130 transaction constants, or a payer service.
- Preserve ordinary transactions, EIP-5792/4337, and relayer fallbacks until the native path is activated and independently conformance-tested on each venue.

## Impact by EFS surface

### v1 / EAS writes

This is an immediate architectural fit. EIP-8130 dispatches calls directly from the configured sender, so EAS observes the user's account as `msg.sender`. A native AA batch can therefore collapse cross-schema EAS calls into one account approval while preserving the attester address that lenses and per-attester slots require. This addresses the main problem the naive `EFSUploadGateway` could not solve without per-attestation delegation signatures.

`wallet_sendCalls` remains the preferred wallet-facing API: Base explicitly says existing application APIs continue to work, while the wallet may choose the native transport underneath. A raw EIP-8130 transaction path can be an additional capability-detected SDK adapter for wallets/clients that expose it.

### v2 envelope and KEL

EIP-8130 independently validates several KEL directions: stable accounts with replaceable actors; actor IDs derived from key material; P-256/WebAuthn authenticators; scoped, expiring session actors; revocation; subaccounts/delegation; payer separation; and algorithm agility.

It does not replace the proposed KEL. EFS additionally needs stable principals independent of actors, EFS-specific action/resource scopes, authoritative-home ordering, immutable historical authorization receipts, recovery semantics separated from funds/encryption, current-versus-historical grades, and portable verification of exact EFS record witnesses.

If Base becomes an EFS authority home, the Account Configuration contract and Transaction Context precompile are plausible inputs to a **versioned authority-home/account adapter**. Reuse candidates include authenticator interfaces, actor-ID derivations, actor configuration reads, payer separation, and transaction-context evidence. The EFS HomeRegistry/KEL still owns principal identity, EFS grants, admission receipts, recovery, and cross-venue grades unless a dedicated adversarial comparison proves equivalent guarantees.

EIP-8130's `chain_id = 0` signed actor changes are replayable across chains, but must still be applied to each chain's local configuration state. They do not create one atomic global current-authority state. This reinforces, rather than weakens, EFS's home-authoritative/as-of-foreign-snapshot model.

### Client / OS authority model

Native session keys are wallet/execution authority. An EFS session grant is record authority. They may share a credential or mirror policy, but revoking one plane does not automatically revoke the other. Permission Center must continue to render at least:

1. EFS record/KEL authority;
2. wallet, transaction, token, and gas authority;
3. encryption/decryption access.

The EIP-8130 policy manager is a trust anchor: the protocol gates a restricted actor to the manager target, and the manager enforces the detailed commitment. Any EFS policy-manager adapter must therefore be narrowly scoped, non-upgradeable or equivalently governed, and treated as wallet authority—not silently promoted to EFS identity.

### Relayers and sponsorship

Native payer signatures plus the developing ERC-8168 payer-service flow can remove much of the bundler/EntryPoint infrastructure from sponsored Base writes. An EFS payer endpoint can become another `/.well-known/relayer` capability class. The mortality invariant still holds because the payer is part of the transport transaction, never the signed EFS envelope.

This does not remove service policy: sponsors still need abuse controls, budgets, authentication, privacy disclosures, availability/fallback behavior, and fee bounds. It reduces machinery; it does not make sponsorship free or permissionless.

### Large uploads

Parallel nonce lanes, nonce-free short-lived submission, native batching, and payer separation can improve chunk throughput and reduce coordination among upload workers. They do not change the signed-manifest/chunk-proof design and do not guarantee completion or fund the N chunk transactions. The upload design's honest `BYTES-PARTIAL` outcome remains necessary.

## Recommended compatibility spike

Before the KEL/envelope freeze, use Vibenet to test one bounded matrix:

1. bare EOA and passkey actors submitting the same chain-free EFS envelope;
2. v1 cross-schema EAS batches preserving the intended attester;
3. native payer sponsorship, including fee bump and expiry behavior;
4. one-phase atomic EFS batches and multi-phase failure/receipt handling;
5. parallel large-upload chunk submissions using separate nonce lanes;
6. the Transaction Context precompile's sender/actor/payer values at EFS entrypoints;
7. a prototype mapping from `{account, actorId, config sequence}` to `{principal, authorityId, authEpoch}` to identify precisely what an EFS authority-home adapter can and cannot reuse;
8. fallback behavior on a non-8130 chain and on Base before activation.

Pin the tested EIP revision/reference-implementation commit in the adapter and repeat conformance tests at Cobalt release-candidate and mainnet activation.

## Current conclusion

EIP-8130 is favorable to EFS and materially lowers the expected complexity of Base write UX. It strengthens the case for the KEL's actor/session/passkey direction while preserving the need for EFS's independent portable envelope and historical-authority model. The correct integration point is the versioned account/submission adapter boundary. No Etched EFS format should depend on the Draft EIP.
