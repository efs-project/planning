# KEL cross-system integration and completeness review

**Review date:** 2026-07-11  
**Question:** does the native synthesis actually compose with EFS, the OS, privacy, and Tier-1 on-chain reads?

> **Post-synthesis correction:** the specialist re-audit rejected split identity-home/data-home authority. [[kel]] now selects one authority home per principal through a sparse L1 locator and co-locates KEL/grant state with authoritative record admission. Foreign venues are snapshots/evidence. It also replaces ambiguous direct-key/grant authority with root/child grants and binds receipts to exact admissions. Those corrections control where this lane's earlier wording differs.

## Resolution fork

### Rejected: pure read-time KEL

It preserves generic admission confluence but cannot answer when an offline signature was created. A removed key can backdate. It also lets unauthorized claims update old-kernel slots, leaving every contract to reproduce a client-side union and scope engine.

### Rejected: current old kernel plus future peer only

The old kernel persists neither actor, grant, scope nor home authorization basis. Contracts cannot apply `KEL-CONTESTED`/union logic by convention. P-256/WebAuthn/session authorship would remain second class forever.

### Adopted: home admission plus evidence lane

The principal's selected authority home co-locates KEL/grants and admission, validates the actor at the chain-observed point, stores an AuthReceipt, and applies principal-owned slots. Structurally valid but unauthorized/unproven imports may be retained as evidence. Foreign chains accept home-proven snapshots at an explicit basis. This intentionally narrows the global confluence promise: bytes converge as evidence; authoritative mutable state is ordered at one home.

## Envelope seam

The minimum signed fields are:

```text
author/principal
authorityId (root/child grantId; zero only for bare EOA)
authEpoch
order
prev actor-lane hint
recordsRoot
count
```

Actor/suite/key comes from the signature witness and must equal the key bound by `authorityId`. Bare EOA is zero authority/epoch. Slot and object derivation continue using principal, so device/app rotation never rewrites links.

## Stored admission proof

At least one `admissionId`/receipt binds:

```text
claimId, envelopeDigest, principal, actorKeyId, authorityId, authEpoch,
actionContextHash, grantProofRoot, authority home + identity head,
home block number + admission ordinal, registry/version semantics, result
```

The containing block hash/finality/state proof is attached later because a transaction cannot know its own block hash. `claimId` has one immutable primary admission plus paginated supplemental receipt evidence. This supports a complete bounded `verifyAction(ActionRequestV1, AuthorityProofV1, SignatureWitness)` and historical lookup without a KEL scan.

## Tier-1 ABI verdict

Required bounded reads:

- current identity summary;
- key by ID;
- grant by ID;
- complete current action authorization over signed action/audience/resource/venue/size/time context;
- primary admission by claim and AuthReceipt/historical authorization by receipt ID;
- pending recovery state;
- batch identity summaries for lens resolution; and
- paginated event/grant history for audit/recovery.

Current mapping reads are O(1). Proof ancestry has a strict maximum. Algorithm-specific key/signature lengths and verification gas are capped before allocation. Full event/grant/receipt bodies stay in state/spine so the no-trusted-indexer/pruning rule holds.

## Lens impact

The current client model put a user's primary, 12 device/app keys, and friends into one ordered lens. KEL eliminates the key explosion:

- one public person/principal occupies one lens position;
- actor keys resolve under that principal;
- a friend rotating keys does not invalidate lens membership;
- deliberate pseudonymous principals remain separate entries only when trusted;
- `resolveMany` batches current status/head for 50–256 principals;
- pending recovery, disputed intervals, stale snapshots and KEL unknown fail closed for GATE reads.

This is both cleaner and faster than persona expansion.

## Revocation/slot impact

Existing `revoker == claim.author` is too broad once many actors sign as one principal. Admission scope must distinguish:

- app actor may revoke claims under its exact admission basis only with explicit `revokeOwnClaims` (default off);
- app actor may not revoke another app's claims;
- explicitly authorized principal administrator may revoke across actors;
- recovery/actor removal does not retroactively revoke history.

Every claim retains actor/grant provenance. A principal-wide `authEpoch` bump prevents future use but does not rewrite slots already admitted unless a separately authorized REVOKE is published.

## Time and currency

Author `order` and `claimedAt` are not authorization time. Key/grant validity uses explicit authority-home block intervals. `admittedAt` stays outside comparators and serves as existence/authorization basis. KEL changes and record admission share that home order. Foreign data state carries its receipt/checkpoint basis and freshness; “RPC reachable” is not a grade.

## Replication/export

An export includes envelope/records, actor signature/key suite, grant proof, KEL establishment events, home AuthReceipt/checkpoint and verifier spec/codehash. A removed-key record first presented after removal cannot be upgraded from signature-only without a prior receipt. Bulk identity/data checkpoints may Merkle-batch admission evidence.

Foreign smart contracts need a verified home checkpoint/light-client/bridge adapter or remain snapshot grade. Comparing chain timestamps is not a substitute for a home proof.

## Privacy

The synthesis passes only with these rules:

- devices/apps are public actors of one principal when used;
- private persona is another principal, not a child grant;
- no key/guardian/encryption/account reuse across unlinkable principals;
- grants may stay private before first use but permanently reveal actor, ancestry, timing and typed scopes when materialized; low-entropy hashes are not privacy;
- guardian policy is committed/blinded until recovery where practical;
- account bindings are opt-in disclosures;
- public reverse indexes make clustering cheaper; accept and disclose rather than claim anonymity;
- KEL recovery and content-key recovery remain independent.

## OS/account impact

The OS Guardian/broker holds actor keys and enforces local budgets; apps receive scoped signing handles, never keys/root authority. System Chrome renders canonical grant/record bytes. The Permission Center shows actors, scopes, expiry, last use, ancestry and revoke controls. Recovery health and drills are first-class.

Ethereum accounts pay/submit or mirror policy. 4337/7702/session-wallet standards may intersect with KEL grants, but effective authority is the stricter intersection; no wallet module can expand EFS authority.

## Packages, organizations, large files

- Package identity becomes `(publisher principal, app root)`; routine publisher actor rotation is not a signer swap, while principal recovery remains a security event.
- Organization KEL uses threshold control and a single operational signer. Threshold crypto may compress a quorum to one signature.
- Large upload manifest uses one scoped actor signature; chunk completion stays permissionless.
- `act` references provenance/grant and never substitutes for authorization.

## Read grades

Reserve/reconcile:

- `HOME-ADMITTED-AUTH`;
- `SNAPSHOT-AUTH@H`;
- `PORTABLE-SIGNATURE-ONLY`;
- `CURRENT-CONTROLLER` (identity state, not record disposition);
- `RECOVERY-PENDING`;
- `DISPUTED-INTERVAL`;
- `LEGACY-HOME-CONTESTED`;
- `DUPLICITY-EVIDENCE`;
- `KEL-UNKNOWN`; and
- `EXISTED-BEFORE-EPOCH`.

The old `KEL-CONTESTED` definition is too broad. With a definite home, a divergent foreign event is evidence, not a second authoritative branch. Contested remains for an unresolved home basis or recovery dispute.

## Nine strategic forks

| Fork | Ruling |
|---|---|
| Admission vs read | authoritative admission-time + receipt; current/foreign read-time grading |
| Personas | actor keys under principal; unlinkable persona separate KEL |
| Recovery | precommitted next + heterogeneous threshold; vendor/MPC optional |
| Sessions | signed attenuating cert + epoch/revocation mapping |
| Thief window | prior independent commitment; delay alone is detection |
| PQ | exact algorithm suites; AND hybrid control; no premature tag |
| In-place EOA | stable address word, committed two-phase activation, bare disabled after |
| KEL/admission location | co-located per-principal authority home selected by sparse L1 locator |
| Kernel change | KEL-aware authoritative seam before freeze |

## Freeze completeness

Etched changes are required for envelope authority/epoch, full next state, control-vs-grant events, home rule, legacy commitment, key/suite/profile, recovery state, grant attenuation, AuthReceipt, `act`, WebAuthn and PQ/hybrid/evidence formats. Durable defaults—session duration, 2-of-3 recovery, labels, ENS UX, monitor cadence—must not be mistaken for wire rules.

Explicit rejects: root add/remove, current-key fallback, read-only retrofit, arbitrary home, contract signatures as portable authority, mutable verifier registry, public master KEL, sliding TTL, generic policy VM, sole passkey/MPC root, signing/encryption reuse and stateful hash-signature consumer default.

## Completeness verdict

The native synthesis is coherent if and only if:

1. home selection becomes globally unambiguous and KEL/admission share one order;
2. the envelope carries authority/epoch before freeze;
3. the home kernel persists actor/grant/admission basis;
4. sessions cannot issue root events or widen scope;
5. recovery cannot be vetoed forever by the stolen current key;
6. privacy principals remain separate; and
7. current and historical authorization remain distinct APIs/grades.

Without any one of those, the design reverts to the key-as-identity, backdating, or public-account-fleet failure it is intended to solve.
