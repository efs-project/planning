# KEL crypto and security red team

**Audit date:** 2026-07-11  
**Verdict:** current reservation is directionally sound and not freeze-safe

## Post-synthesis specialist re-audit

The first native synthesis was attacked again before handoff. The second pass found and corrected additional freeze blockers in [[kel]]: control and authoritative admission must share one authority-home order; born-KEL derivation must exclude its own principal/witnesses; every event needs a closed purpose-bound transcript; generic `POLICY_RECONFIGURE` bypasses pre-rotation and is deleted; precommitted next control outranks pending recovery; every v1 control rotation bumps `authEpoch`; recovery and grant certificates need canonical bytes/nonces/signatures; `AuthReceipt` needs a distinct claim/envelope/action-bound `admissionId`; disavowal is advisory only; and role-independent key material prevents cross-role reuse/double counting. The detailed design, not the earlier sketches below, is controlling.

## Freeze-breaking findings

### 1. Pre-rotation is bypassable

Root `ADD_KEY`/`REMOVE_KEY` under current authority lets a thief install attacker keys or remove victim keys without revealing `nextKeysDigest`. Delete those root operations. Root change is only committed rotation or independent recovery. Operational grants live in another namespace and cannot issue control events.

### 2. Next commitment omits policy

The old state commits keys while the rotation body chooses a new threshold. A committed key set can be revealed under 1-of-n. Bind the complete next control state, including algorithm, roles, thresholds, recovery version, delegation ceiling and security floor.

### 3. Current-key fallback nullifies pre-rotation

When there is no next commitment, “current keys may rotate” restores ordinary compromise takeover. No-next is explicit `UNPROTECTED`/non-transferable and repairable only through the already committed recovery policy; if next and recovery are both lost, the principal is honestly unrecoverable.

### 4. Principal/actor is absent from the envelope

`recovered == author` makes every session key a separate namespace owner. A display-only `act` graph cannot repair LWW ownership, revocation, scope, or Tier-1 authorization. The signed seam needs principal, authority/grant, epoch, and one actor signature.

### 5. Read-time-only authorization permits backdating

A signature carries no trusted creation time. A removed key can sign after removal and use an older TID/event reference. Authoritative admission must validate current authority in home consensus order and store the basis. Historical records survive removal because their receipt proves prior authorization.

### 6. Home is not encoded or globally selectable

An address-shaped identity can have two valid inceptions on two chains. “Chains do not die” guarantees both remain readable and does not decide which is authoritative. Use one per-principal authority home selected by a sparse L1 locator, and co-locate KEL/grants with authoritative record admission so revocation and receipts share one order. Foreign venues are snapshots/evidence. An ordinary `home` claim is insufficient.

### 7. Delay cannot identify a thief without prior authority

Victim and thief holding one EOA produce indistinguishable signatures. A challenge period helps only if an independent cold/recovery/next-state commitment predates compromise. Ship that commitment at onboarding or admit the residual.

### 8. WebAuthn root profile is too weak

UV optional plus unconstrained RP/origin is inappropriate for root events. Commit per-key verification policy, require UV for control/recovery, register multiple credentials, treat counters/backup flags as risk evidence, and never make one synced passkey the century root.

## Recommended state machine

```text
Status:
  BARE
  LEGACY_UNPROTECTED
  INCEPTION_PENDING
  ACTIVE
  RECOVERY_PENDING
  LEGACY_HOME_CONTESTED
  DEACTIVATED
```

State carries identity/home/registry version, event head/number, control and authorization epochs, current/next policy hashes, recovery policy/nonce, pending recovery and security floor.

### Event authorization

- `INCEPT`: initial/bare plus new-key acceptance and commitment proof.
- `ROTATE`: exact precommitted next state signs/accepts; installs next commitment.
- `RECOVERY_PROPOSE`: committed recovery quorum plus exact new-state acceptance.
- `RECOVERY_FINALIZE`: permissionless after delay; installs only the proposal; kills sessions.
- `RECOVERY_CANCEL/REPLACE`: exact committed veto or recovery clause with consumed nonces, never current key alone.
- `MIGRATE_PREPARE`: source-home freeze/export phase of the L1-located two-phase migration.
- `DEACTIVATE`: precommitted or recovery authority.
- `GRANT`/`REVOKE`: separate actor authorization, never root policy.

During pending recovery, new root/grant actions freeze and record attempts remain disputed evidence rather than authoritative slot updates. A late sibling control event is duplicity evidence, not an eternal DoS trigger; finalized home order remains the fork choice.

## Control policy

Use a small AND-of-threshold-clauses policy. All clauses pass; keys and signatures are sorted/unique; maxima bound clauses, keys, signatures, bytes and gas. This expresses ordinary m-of-n and traditional-AND-PQ migration without a general policy VM.

Every first-installed key proves possession against the exact event. A role-independent `keyMaterialId` plus role/profile-specific `keyId` is tombstoned; the same material cannot cross roles or threshold clauses.

## Actor/grant security

A canonical root/child grant certificate binds principal, auth epoch, exact parent/issuer signature, actor descriptor + acceptance, typed audience, explicit action/kind/definition/immutable-resource/venue sets, authority-home block window, per-envelope and cumulative caps, depth and nonce.

- Children mechanically attenuate.
- Unknown actions fail closed.
- Parent revoke invalidates children.
- Recovery/auth-epoch bump invalidates all.
- App actors cannot control KEL, recovery, account/persona links, key export or content decryption.
- The `act` graph is provenance only.

## Threshold and MPC ruling

Protocol v1 uses explicit signatures on rare control events. FROST/threshold ECDSA/MPC may be key adapters after review, not constitutional semantics.

Why:

- [RFC 9591](https://www.rfc-editor.org/rfc/rfc9591.html) is Informational, excludes DKG, needs two rounds and has nonce-critical operation;
- its P-256/secp256k1 suites output Schnorr, not Ethereum ECDSA;
- threshold ECDSA implementations/protocols remain complex and less standardized;
- explicit signatures permit heterogeneous classical/PQ policies and show which controllers approved.

Consumer MPC/TEE systems may custody an operational or recovery factor, never the only next/recovery authority. Require exit/export and vendor-loss drills.

## Post-quantum ruling

[FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) ML-DSA and [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final) SLH-DSA are already final. The open work is exact parameter/profile choice, reviewed implementations, EVM cost, hardware and migration.

- ML-DSA is the likely frequent-signing candidate after benchmarks.
- SLH-DSA is a useful independent hash-based cold/recovery hedge.
- LMS/XMSS require perfect one-time/state coordination; [NIST SP 800-208](https://csrc.nist.gov/pubs/sp/800/208/final) makes this operational burden explicit. Exclude from consumer/multi-device defaults.
- Use traditional AND PQ control clauses during transition; OR is downgrade.
- Do not mint generic tags: exact suite pins parameters, edition/errata, context, pure/prehash, encodings and verifier codehash.
- [RFC 9958](https://www.rfc-editor.org/rfc/rfc9958.html) warns that external prehashing restores a hash-collision bottleneck; PQ suites should sign canonical transcripts directly where feasible.
- Draft Ethereum PQ EIPs demonstrate direction, not readiness.

## Hundred-year evidence

Preserve exact envelope/record, actor signature, suite/profile/key, grant ancestry, KEL events, receipt plus claim/envelope/action-bound admission ID, contract code/proxy history, block headers, state/account/storage proofs, consensus/finality basis, registry spec and evidence renewals. Before a primitive weakens, renew timestamp/hash evidence under a stronger anchor per [RFC 4998](https://www.rfc-editor.org/rfc/rfc4998.html).

Historical grades distinguish home-authorized admission, signature-only artifact, existed-before-retirement evidence and current controller. A block proves canonical inclusion by a point in chain history; it does not prove precise human time or uncompromised intent.

## Attack matrix

| Attack | Defense | Residual |
|---|---|---|
| EOA thief incepts first | first-use independent commitment; early optional KEL | pre-commit theft remains symmetric |
| current control stolen | full-state pre-rotation; no add/remove escape | existing actor ceiling remains until lock |
| next keys stolen | offline/threshold/PQ custody; recovery | severe root compromise |
| guardian quorum colludes | heterogeneous quorum, delay, monitor, veto policy | recovery is powerful |
| thief cancels recovery | current key cannot cancel alone | legitimate user needs stronger factor |
| session escalates | closed mechanical attenuation | issuer can use its ceiling |
| session remains after recovery | authorization epoch bump | old admitted records remain |
| removed key backdates | home admission validation/receipt | unadmitted artifact gets weak grade |
| cross-chain stale KEL | only co-located authority home mints receipts; foreign snapshots graded | proof transport/foreign liveness |
| malicious RPC | state proof/light client/independent finalized head | client verification cost |
| sibling-event DoS | home order; sibling evidence only | compromise remains visible |
| P-256 malleability | explicit low-S; exact EIP-7951 semantics | implementation risk |
| WebAuthn RP loss | multiple credentials/RPs + recovery | one actor may be unusable |
| synced-passkey compromise | cloud-factor classification; independent root | provider dependency |
| FROST nonce reuse | audited optional adapter + one-use nonce discipline | operational complexity |
| MPC vendor failure | replaceable factor, export drill | convenience loss |
| PQ downgrade | AND policy + exact suites | dual-stack complexity |
| mutable verifier capture | immutable codehash/spec | new versions need explicit adoption |
| guardian/persona linkage | salted commitments, separate KEL/key sets | recovery/use leaks remain |
| signing/encryption coupling | separate key families/recovery | identity recovery may not recover data |
| algorithm retirement ignored | monitor and evidence renewal | unattended branch degrades |

## Required external work

Formal state-machine model; two independent parsers/implementations; differential vectors; canonicalization and attenuation fuzzing; real WebAuthn hardware tests; exact PQ benchmarks; recovery abuse tabletop; walk-away/export verification; independent cryptographic and contract audit.
