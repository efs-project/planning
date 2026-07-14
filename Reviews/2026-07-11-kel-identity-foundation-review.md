# KEL and EFS accounts — identity-foundation review

**Date:** 2026-07-11  
**Scope:** KEL, EFS accounts, recovery, delegation, Ethereum compatibility, privacy, passkeys, organizations, PQ migration, on-chain completeness, and OS UX  
**Canonical output:** [[kel]]  
**Supporting record:** [2026-07-11-kel-research-corpus](./2026-07-11-kel-research-corpus/README.md)

## Verdict

The strategic direction survives: stable identity word, bare EOA as a zero-state entry path, in-place upgrade, KERI-style pre-rotation, one signature per record, threshold key events, home-chain authority, and no state-dependent contract signature in portable authorship.

The current reserved format does **not** survive. It must not freeze.

The replacement architecture survived the direction-level review, but the first synthesis also received a specialist **NO-GO for freezing bytes/selectors**. The corrected [[kel]] resolves the discovered consensus choices and records the remaining exact encodings, HomeRegistry proof/migration profile, formal model, vectors, hardware tests, benchmarks and independent audit as hard gates. This review recommends an architecture and work order—not a ceremony.

The replacement is a native EFS synthesis:

- slow KEL control/recovery;
- separate bounded actor/session authorization;
- complete next-control-state commitments;
- stable principal plus actual actor provenance;
- authoritative home admission while the actor is live;
- a persisted authorization receipt for history and replication;
- materialized Tier-1 current/historical reads;
- independent identity, wallet/funds, and encryption recovery; and
- separate KEL principals for privacy personas.

This is an architectural correction, not a documentation cleanup. It changes the envelope, kernel admission boundary, `act` reservation, P-256/WebAuthn activation, KEL event set, read grades, wallet/persona model, freeze gates, and the meaning of “home.”

## What the pass found

### P0 — root key changes bypass pre-rotation

The old `ADD_KEY` and `REMOVE_KEY` events are authorized by current keys. A thief uses them instead of `ROTATE`, installs attacker keys, and removes the victim. The advertised pre-rotation defense never runs.

**Ruling:** delete root add/remove. Root state changes only by exact precommitted rotation or independent recovery. Actor grants are separate and cannot emit control events.

### P0 — next commitment permits threshold downgrade

`nextKeysDigest` commits key material while the rotation body chooses `newThreshold`. The committed keys can be revealed under a weaker policy.

**Ruling:** commit the full next control state: suites, ordered key IDs, threshold clauses, roles, recovery version, delegation ceiling, security floor and home policy.

### P0 — the envelope has no stable-principal actor seam

`recovered == author` means a device/app/passkey key is its own author and owns separate slots. The client worked around that by inventing publicly linked persona fleets, but a graph label cannot enforce scope or transfer slot ownership.

**Ruling:** sign `author/principal + authorityId + authEpoch`; persist actor key and grant. Device/app keys act as the principal. An unlinkable persona remains a separate principal.

### P0 — read-time authorization cannot stop backdating

After removal, a stolen key can sign a new envelope and claim an old TID or event. There is no cryptographic creation timestamp.

**Ruling:** authoritative home admission validates the actor/grant while live and stores its basis. Old authorized admissions remain valid; never-admitted or late removed-key artifacts stay signature-only evidence.

### P0 — “home authoritative” lacks a selector

An address-shaped identity carries no chain. Victim and thief can each incept on a different chain and both call it home. Permanent/queryable chains make the ambiguity permanent; they do not choose a winner.

**Ruling after specialist re-audit:** one authority home per principal, selected by a sparse Ethereum-L1 `HomeRegistry`, with KEL/grants and authoritative record admission co-located. A split L1-control/L2-admission design has revocation lag; a universal L1 home would make every write pay L1. Foreign venues remain snapshot/evidence only. Locator/finality/migration and the honest dead-home limit are the largest remaining engineering boundary.

### P0 — a challenge window alone is security theater

Two parties holding one EOA key are cryptographically equal. Delay creates notification and denial-of-service time, not rightful-owner evidence.

**Ruling:** publish a salted independent future-control/recovery commitment at first onboarding. A committed higher-priority policy makes delay meaningful. Uncommitted legacy identities retain an explicit irreducible thief race.

### P1 — recovery could be vetoed forever by the thief

The common “guardians propose, current key cancels” pattern fails when recovery exists because the current key was stolen.

**Ruling:** priority is precommitted next > exact committed veto clause > exact recovery clause > current control. Current control may submit evidence, not cancel alone; hot actors have no standing. A valid precommitted rotation escapes pending recovery, every transition consumes a nonce, and finalization is permissionless after the home-block delay.

### P1 — P-256 availability is not KEL/WebAuthn readiness

EIP-7951 is Final and makes P-256 verification available, but current authors are address-shaped and direct recovery still expects secp256k1. WebAuthn adds RP/origin/challenge/UP/UV/backup/counter semantics.

**Ruling:** raw P-256 and WebAuthn activate only through the KEL actor seam. EIP-7951 is active on Ethereum mainnet and must be capability/conformance checked elsewhere. WebAuthn control/recovery requires UV, exact type/challenge/RP/origin/cross-origin/DER/BE-BS semantics, low-S normalization, strict parsing, and real-hardware vectors. One domain-bound passkey is never the century root.

### P1 — account abstraction must remain outside eternal authorship

7702 is replaceable by the original EOA key. ERC-1271/6492 answers can be mutable, chain/context dependent, or deployment causing. Draft modular/session standards are still moving.

**Ruling:** smart accounts execute, pay, and coordinate. A deployed account may call the authority-home registry directly once (`msg.sender` is the account) to appoint portable EFS keys; no intermediary or ERC-6492 path authorizes canonical inception. ERC-1271/6492 remain outside envelope/KEL authority; bilateral chain-account bindings remain possible.

### P1 — identity recovery, funds recovery and decryption were conflated in UX

Rotating the KEL does not move assets from a still-compromised 7702/EOA account, and does not reconstruct separately encrypted file keys.

**Ruling:** three independent recovery planes and results. Signing and KEM/vault keys remain independent by construction.

## Candidate comparison

| Candidate | Best property | Fatal mismatch as full EFS design | Disposition |
|---|---|---|---|
| KERI-faithful | pre-rotation, delegation, threshold, cryptographic depth | excessive parser/witness complexity; still needs materialized Tier-1 state | cryptographic reference |
| did:plc-shaped | understandable cold recovery and control/data split | trusted directory/order, history clobber, public recovery graph | UX/recovery reference |
| Farcaster-shaped | shipped principal+actor UX, scopes, bounded O(1) reads | weak root/recovery/PQ and older revocation mistakes | actor-plane reference |
| native EFS | combines slow safe root, fast actors, home receipts, stable namespace | larger pre-freeze scope; locator/migration/proof machinery required | **adopt** |

## Recommended architecture

### Control plane

Small AND-of-threshold-clauses policy, role-independent key-material IDs, complete canonical `ControlState`, recovery commitment, control/auth epochs, materialized current state, and a closed purpose-bound event transcript. Normal rotation is accepted by the precommitted next policy and always bumps `authEpoch` in v1. No arbitrary current-key fallback or generic reconfiguration event.

### Actor plane

Record signer, delegation authority and app/session actors all use root/child grant certificates with issuer signatures and actor acceptance. Grants have typed audience/resource scope, home-block validity, bounded counters/ancestry, selective revocation and global epoch kill. Mutable graph membership and browser origin are not treated as on-chain facts. `act` is provenance only.

### Envelope

Add `authorityId` and `authEpoch` to the signed principal. Signature witness identifies the exact actor suite/key. Bare EOA is zero authority/epoch. Logical claim IDs remain actor-carriage independent.

### Admission and history

Authority-home admission validates authorization and persists an `AuthReceipt`/`admissionId` bound to claim, envelope, actor/grant, action context, KEL head, block number/ordinal and registry semantics. The containing block hash/finality proof is attached later; a transaction cannot know its own block hash. One logical claim may have supplemental receipt evidence but one immutable primary admission. Foreign proof is a snapshot; unproven import is evidence.

### Recovery

Canonical heterogeneous recovery policy/proposal, unique salted guardian leaves, exact replacement state, new-key proof, protective pending lock, next-policy escape, exact veto/replacement clauses and nonces, delayed permissionless finalization, monotone security floor, epoch kill, and prospective history. Disavowal is advisory and cannot censor immutable historical admission truth.

### Personas and lenses

Device/app keys disappear from lens positions and resolve under their principal. A private persona is another KEL and key family, managed locally. Public link is deliberate and irreversible correlation. This reduces the common 12-keys-plus-40-friends lens from roughly 52 positions to roughly one principal per person plus intentional personas.

### Organizations

Threshold control events plus a single operational record signer. Explicit multi-signature events are the baseline. FROST/threshold ECDSA may produce one actor signature after external review; the protocol does not require them.

### PQ

NIST already finalized ML-DSA and SLH-DSA. Use exact suite profiles, not generic tags. Likely ML-DSA routine candidate after benchmarks; SLH-DSA cold diversity hedge; exclude LMS/XMSS from consumer/multi-device defaults. Require traditional AND PQ control during transition. Rotate to actual PQ keys before a CRQC; hidden classical keys are not safe after reveal.

## User experience

Default onboarding after KEL exists:

1. create or upgrade stable principal;
2. enroll two independent daily/control credentials;
3. configure and test heterogeneous recovery;
4. export recovery commitment/preimage and encrypted kits;
5. create device delegation authority;
6. let apps receive narrow short-lived actor grants;
7. show identity, funds-account and decryption recovery separately.

Bare EOA stays one-click/zero-KEL state for users who consciously accept the degraded profile. The one append-once first-use upgrade commitment should be default-on and sponsored, with its lost-preimage risk surfaced.

## Cross-system result

| Area | Result |
|---|---|
| Home/kernel | L1 locator + co-located authority-home KEL/admission before slot effect; evidence lane elsewhere |
| IDs/paths | principal remains owner; actor rotation does not rewrite |
| REVOKE | actor/grant scope replaces principal-equality-as-total-authority |
| Lenses | stable principals; batch KEL status; recovery/dispute fail closed |
| Privacy | separate persona roots; grants public after first use; blinded guardians; no key reuse |
| Time | authority-home block/order, not TID/claimedAt, establishes authorization window |
| Replication | carry KEL/grant/AuthReceipt; foreign result is explicitly as-of |
| On-chain | current and historical auth are bounded state reads; no Graph dependency |
| Client OS | Guardian-held actor keys, Permission Center, recovery health/drills |
| Packages | publisher principal stable across routine signer change |
| Encryption | identity recovery independent from KEM/archive recovery |

## Strategic forks ruled

1. Admission-time authoritative authorization, not read-time-only.
2. Actors under a principal; unlinkable personas as separate principals.
3. Precommitted + heterogeneous social recovery; MPC optional.
4. Key-bound attenuating session certificates plus epoch/revocation state.
5. Freeze a first-use future-control commitment; delay alone is insufficient.
6. Exact algorithm agility, AND hybrid control, no premature PQ tag.
7. In-place EOA word with two-phase activation and permanent bare-path demotion.
8. Per-principal co-located authority home, selected by sparse L1 locator; split control/admission rejected.
9. Change the kernel/auth seam before freeze; pure read-layer KEL rejected.

## Immediate freeze consequences

Block the existing identity/envelope/kernel freeze. Required Etched work is enumerated in [[kel]] §20 and includes:

- authority/epoch envelope fields;
- complete next-state commitment;
- separate event namespaces;
- canonical home rule;
- legacy upgrade commitment;
- full-width role-independent key-material plus suite/profile IDs;
- recovery state machine;
- typed root/child grant attenuation;
- claim/envelope/action-bound `AuthReceipt` + finalized `AuthProof`;
- `act` recut;
- WebAuthn profile;
- PQ/hybrid/evidence grammar; and
- KEL grades.

Delete/reject root add/remove, current-key fallback, arbitrary home, read-only retrofit, contract-signature authority, mutable verifier registry, public master KEL, sliding sessions, generic policy VM, one-passkey/MPC roots, signing/encryption reuse and stateful hash-signature consumer default.

## Decisions for James

1. **Authority home:** ratify the per-principal co-located KEL/admission home plus sparse L1 locator, and fund its proof/migration design (recommended).
2. **Delivery timing:** build/review KEL-aware machinery before v2's one-final freeze (recommended) or accept that delegated authorship/P-256/passkeys cannot be first class in the frozen kernel.
3. **Legacy commitment:** default-on with explicit degraded skip (recommended).
4. **Smart-account bootstrap:** permit only a deployed account's direct registry call to appoint portable EFS keys (recommended), while keeping ERC-1271/6492 out of canonical inception and record/KEL authority.
5. **Transferability:** personal KEL non-transferable by default (recommended).

Exact gas/key-count/delay constants should follow benchmarks, formal modeling, hardware tests and recovery abuse testing—not be decided in this review.

## External gates

Two independent implementations; differential golden vectors; formal state-machine model; grant/canonicalization fuzzing; two real WebAuthn authenticator families; exact PQ benchmark; home-proof and recovery-abuse tabletop; public-state-only walk-away test; funded monitor; independent cryptographic/security review.

## Primary sources

The canonical design and supporting corpus link claims to current primary sources. The highest-load-bearing are [KERI](https://trustoverip.github.io/kswg-keri-specification/), [did:plc v0.3.0 content](https://web.plc.directory/spec/v0.1/did-plc), [Farcaster KeyRegistry at `3f37e21`](https://github.com/farcasterxyz/contracts/blob/3f37e21db8e9c6319b4a3d5f62b1c514ef01c36b/src/KeyRegistry.sol), [IETF Key Transparency](https://datatracker.ietf.org/doc/draft-ietf-keytrans-architecture/), [WhatsApp AKD](https://engineering.fb.com/2023/04/13/security/whatsapp-key-transparency/), [CONIKS](https://sns.cs.princeton.edu/assets/papers/2015-sec-melara.pdf), [Keybase sigchains](https://book.keybase.io/docs/server), [ERC-7913](https://eips.ethereum.org/EIPS/eip-7913), [EIP-7951](https://eips.ethereum.org/EIPS/eip-7951), [WebAuthn Level 3 CR Snapshot](https://www.w3.org/TR/webauthn-3/), [FROST RFC 9591](https://www.rfc-editor.org/rfc/rfc9591.html), [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final), [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final), [RFC 9958](https://www.rfc-editor.org/rfc/rfc9958.html), and [RFC 4998](https://www.rfc-editor.org/rfc/rfc4998.html).
