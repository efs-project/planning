# KEL post-synthesis specialist audit

**Audit date:** 2026-07-11  
**Reviewers:** independent precedent, Ethereum-account, and cryptographic/state-machine lanes  
**Verdict:** **NO-GO for freezing bytes or selectors; architecture survives with corrections**

This audit attacked the first native-EFS synthesis rather than the older KEL reservation. The findings below were applied to [[kel]] before handoff. They explain why the canonical document is an architecture/work order, not permission to run the Etched ceremony.

## P0 findings and disposition

| Finding | Attack | Applied disposition |
|---|---|---|
| split identity/data homes | an L2 can admit against snapshot H after L1 revoked the actor | per-principal authority home co-locates KEL/grants and canonical admission; sparse L1 locator; foreign venues snapshot/evidence only |
| circular born identity | inception digest may contain the identity it derives | principal-free canonical `GenesisBodyV1`, then derive principal, then sign completed inception |
| missing event transcript | replay across principal/home/registry/epoch/purpose is implementation-dependent | closed `EventHeaderV1`, witness-free event ID, purpose-tagged suite preparation |
| generic reconfiguration | current keys bypass pre-rotation through an undefined “stronger” path | delete `POLICY_RECONFIGURE`; only committed next or recovery can change root |
| recovery priority inversion | guardian quorum can freeze out the precommitted next policy | freeze next > veto > recovery > current; valid rotate cancels pending recovery; consume nonces |
| hidden grant carry-forward | compromised delegation key stocks grants after next-state commitment | every v1 control rotation bumps `authEpoch`; no implicit actor carry |
| undefined recovery bytes | duplicate guardians, replay, delay and replacement semantics fork implementations | canonical policy/proposal, unique salted leaves, exact head/home/nonces/block bounds/replacement, monotone floor |
| legacy commitment ambiguity | EOA-signed hash is not itself independent authority and multiple commitments fork | one finalized append-once commitment; independence appears at committed-factor reveal; lost-preimage risk explicit |
| ambiguous actor authority | `authorityId` might be key or grant; issuer/PoP absent | all KEL actors use typed ROOT/CHILD grants with issuer signature and actor acceptance; zero reserved for bare EOA |
| incomplete attenuation | opaque audience hash and mutable containers cannot mechanically narrow | typed audience; exact/derived immutable resource scopes; bounded proof depth; explicit empty/broad meanings |
| receipt not bound/unique | one logical claim can have multiple actor carriages; same-tx block hash impossible | envelope receipt + claim admission ID bind exact artifact/context/basis; one primary plus supplemental spine; finalized proof attached later |
| disavowal censorship | later controller marks arbitrary old interval unsafe and GATE hides valid history | immutable home-admitted grade; disavow is advisory; only objectively pending admissions are disputed |
| Tier-1 ABI mismatch | `actionClass` omitted resources/audience/venue/size/time/signature | bounded `verifyAction(ActionRequestV1, AuthorityProofV1, SignatureWitness)` over complete canonical context |

## P1 corrections applied

- Added `keyMaterialId` over normalized key family/material so a key cannot evade tombstones through role/profile changes or raw-P-256/WebAuthn relabeling.
- Banned duplicate key material and signature counting across threshold clauses and guardian leaves.
- Collapsed recovery, delegation, security, and home commitments into one canonical `ControlStateV1` rather than duplicating fields.
- Made all first-installed key acceptances purpose-bound to the exact event; this intentionally costs setup availability.
- Required every admission to recheck the full bounded grant ancestry, including hidden children disclosed after parent revocation.
- Added cumulative use/record/byte caps; zero is explicitly unlimited and not an app-session default.
- Made app claim-revocation authority opt-in and basis-scoped; principal-wide revoke is exceptional.
- Defined home-block interval semantics instead of an undefined generic “home time.”
- Made first-use grant disclosure permanent and explicit; low-entropy hashes are not privacy.
- Required resource authority to use immutable IDs/derivation proofs, never mutable graph membership.
- Added suite capability grades: portable-readable, home-admissible, and control-eligible.
- Made `securityFloor` monotone under rotate/recover/migrate and governed by immutable/versioned suite classes, not an admin.
- Separated canonical semantic transcript from suite preparation so EIP-712, WebAuthn challenge binding, and pure/prehash PQ do not conflict.
- Expanded century exports to exact code/proxy history, headers, account/storage proofs, state root, and consensus/finality basis.
- Pinned pure state-independent secp256k1 fallback semantics because draft EIP-8151 could make `ecrecover` state-dependent.

## Ethereum and passkey corrections

- EIP-7951 is Final and active on Ethereum mainnet after Fusaka/Osaka; every other venue still needs fork/config plus edge-vector conformance. A return from `0x100` alone is not capability proof.
- WebAuthn Level 3 is a 26 May 2026 Candidate Recommendation Snapshot, not a final Recommendation.
- Root profiles pin type, challenge, RP/origin relation, cross-origin/top-origin, UP/UV, BE/BS, counter treatment, strict JSON/DER, extensions, COSE/point/length limits, and low-S normalization.
- `attestation: none` supports privacy but proves no hardware property; BE/BS proves no provider independence. A non-synced, non-RP-dependent factor remains necessary.
- A deployed Safe/4337 account may bootstrap only by calling the authority-home registry itself. ERC-6492 never authorizes canonical inception; ERC-1271/6492 never determine portable record/KEL authority.
- Account bindings are bilateral chain/address endpoint facts. Proxy bytecode and 7702 designators are not security closures unless a versioned adapter proves implementation, validators/modules/hooks, configuration, and basis.
- KEL grants constrain EFS actions only. They do not revoke token allowances, orders, arbitrary EVM calls, funds sessions, or vendor wallet permissions.
- Draft EIP-7851/8164 prefix semantics and EIP-8141/8164 transaction types conflict. The 2026 native-account proposals are competing experiments, not a stack.

## Remaining freeze blockers

1. Exact canonical byte layouts and constants for genesis, events, policies, grants, recovery, receipts, and proof wrappers.
2. Immutable/adminless L1 `HomeRegistry` proof adapters, version succession, migration finality/reorg rules, supported home classes, and dead-home posture.
3. Protocol maxima and gas/calldata benchmarks, including PQ/WebAuthn worst cases and 50–256-principal reads.
4. Formal state-machine model plus two independent differential implementations.
5. Real-hardware WebAuthn vectors and parser differential tests.
6. Exact PQ suites, capability grades, verifier implementation and hybrid downgrade tests.
7. Recovery abuse tabletop, funded monitoring, public-state-only walk-away drill, and independent cryptographic/contract audit.

## Research completeness correction

The post-pass added the lanes omitted from the first archive:

- [WhatsApp AKD](https://engineering.fb.com/2023/04/13/security/whatsapp-key-transparency/): automatic self-checking, epoch consistency, batching and independent witnesses;
- [CONIKS](https://sns.cs.princeton.edu/assets/papers/2015-sec-melara.pdf): efficient self-monitoring and privacy-preserving directory membership; and
- [Keybase sigchains](https://book.keybase.io/docs/server): reverse-signed device enrollment, prospective device revocation, paper recovery, and public-chain correlation.

Mutable load-bearing sources are version/commit pinned in [[kel]] §24 where practical. The promotion bundle still owes a content-hashed source manifest.
