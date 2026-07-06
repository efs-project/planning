# Architecture A — EAS-MAXIMAL: chain-carried portable records

**Role:** steelman architect for keeping EAS. **Date:** 2026-07-02.
**Inputs:** all 13 substrate research files, deterministic-ids.md, efs-v2-holistic-redesign.md, contracts/specs/overview.md.
**Audience note:** the red team reads this next. Weaknesses are listed, not softened (§14).

---

## 0. Thesis

Every autopsied system that abandoned the consensus substrate spent years rebuilding it (Farcaster hubs → Snapchain; Ceramic anchors → dead; Nostr → advisory everything) and every system that kept portable signed artifacts thrived on exactly that property (Nostr events, ATProto repos, KERI KELs). The two results are not in tension: **the chain and the portable artifact answer different questions.** Architecture A refuses the false choice. Every EFS record stays an on-chain EAS attestation — buying total order, availability-fused commitment, one-SLOAD revocation, gas-as-rate-limit, and synchronous contract reads, all of which the research shows are irreplaceable at tolerable cost — AND every record *carries* an EFS-defined, chain-free authorship envelope, making it simultaneously a portable signed artifact that any carrier can replay onto any chain, where resolvers verify rather than trust.

Slogan: **the chain is the first carrier and the best witness — never the signature domain.**

This is v2 (deterministic IDs) plus four additions, all expressible inside unmodified EAS because EAS resolvers can run arbitrary validation: (1) a Portable Authorship Envelope (PAE) inside attestation payloads, verified by ecrecover/P256VERIFY in resolver hooks; (2) a key-grant log (Farcaster/PLC-shaped) as EAS claims, giving smart-account and passkey users rotatable identity whose signatures still travel; (3) verified owner-field replication (model C hardened by the envelope), closing the dead-attester gap; (4) per-author signed state heads + cross-chain registry checkpoints (ATProto MST + CT-witness shapes), giving portable completeness, currency, and temporal provenance.

What EAS-maximal does **not** mean: adopting EAS's own portability machinery. EAS offchain attestations (EIP-712 domain binds chainId + verifyingContract + per-chain version string — confirmed from `offchain.ts`) and EAS delegation rails (same domain + sequential nonces) are rejected as portability vehicles. We keep EAS the *contract substrate* and own the *artifact format* ourselves.

---

## 1. What EAS still buys, and what we refuse

**Kept (the five load-bearing mechanisms, per the coupling audit):**

1. `attest`/`multiAttest` as the authenticated write entrypoint (attester = msg.sender), for the direct path.
2. multiAttest batch atomicity + in-order hooks (pinned by bytecode hash + per-chain conformance test) — the engine of the one-tx parents-first write.
3. The revocation registry for direct-path claims (attester-only revoke, canonical `revocationTime`).
4. The resolver-hook no-bypass guarantee — every write under an EFS schema flows through EFS validation. **This is the whole trick:** the hook is a general-purpose validator, so signature verification, key-registry lookups, seq monotonicity, and owner-field verification all fit inside EAS without modifying it.
5. The `_db` record store as the payload store, with the storage layout documented in the Codex state-walk.

Plus: audited substrate custody of the auth/store/revoke core; ecosystem legibility for direct writes; pre-deployment on most chains; Coinbase-Verifications-proven contract-read patterns.

**Refused (each with the research citation):**

- EAS offchain attestation format — chain-bound on three axes (credentials-attestations §2.2, CONFIRMED). Never used.
- EAS delegation rails as the primary signed-write path — sequential nonces serialize multi-device writers; chainId-bound domain kills replay-as-replication (coupling audit §3.7). Retained only as a legacy gasless bridge; demoted.
- `recipient`, `expirationTime`, per-attestation `revocable` mismatch cases — already rejected at write time (v2 §3).
- `refUID` index authority — v2 §7 stands.
- EAS `timestamp()`/`revokeOffchain()` registries — superseded by EFS-native heads/tombstones which are lens-keyed on the author, not msg.sender.

---

## 2. Layer map

```
L0  Chains (N of them; L1 root-of-trust, OP-Stack L2 default write plane)
L1  EAS per chain (immutable, version-pinned, conformance-tested)
L2  EFS resolvers + registry (Etched): v2 validation + PAE verification +
    key-grant registry + seq/monotonicity + revocation state
L3  Read views / router / web3:// (redeployable)
L4  Anchoring overlay: HEAD claims (per-author state roots),
    CHECKPOINT claims (cross-chain registry-root witnessing) — additive schemas
L5  SDK: envelope signing by default, salt + seq lifecycle, head maintenance,
    bundle export, replay/carry tooling
```

Objects (ANCHOR, DATA, PROPERTY, LIST) and claims (MIRROR, PIN, TAG, LIST_ENTRY, REDIRECT) are exactly v2's. New additive claim schemas, reserved at the freeze: **KEYGRANT, REVOKE, HEAD, CHECKPOINT** (and WHITEOUT as already reserved).

---

## 3. Record format (byte-level)

### 3.1 Payloads

All v2 derivations, canonical-name rules, kind tags, and the fixed-width `abi.encode` discipline are unchanged. Two schema-table amendments (these ride the v2 freeze — schema strings are Etched):

- **DATA** = `bytes32 salt, bytes32 author, bytes env`
- **LIST** = `bytes32 salt, bool allowsDuplicates, bool appendOnly, uint8 targetType, bytes32 targetKind, uint256 maxEntries, bytes32 author, bytes env`
- **MIRROR, PIN, TAG, LIST_ENTRY, REDIRECT** — each gains trailing `bytes32 author, bytes env`.
- **ANCHOR, PROPERTY** — unchanged (no author, no env). Shared Schelling objects commit to content, not a controller; they are already permissionlessly replicable in v2 and an envelope would add bytes for zero identity value.

`author` is the EFS identity word: `bytes32(uint160(accountAddress))`. Owned-kind derivations change input source, not formula:

```
dataId = keccak256(abi.encode(DOMAIN_DATA, author, salt))     // author = validated payload word
listId = keccak256(abi.encode(DOMAIN_LIST, author, salt))
slotId = keccak256(abi.encode(DOMAIN_SLOT, claimRoleTag, author, slotKeyWord1, slotKeyWord2))
```

Validation rule binding `author`:

- `env` empty ⇒ resolver requires `author == bytes32(uint160(attestation.attester))`. Chain-authenticated, non-portable record (today's semantics, still first-class — the air-gapped cold-key publisher persona).
- `env` nonzero ⇒ resolver verifies the envelope (§3.2) and requires the recovered/authorized identity to equal `author`. `attestation.attester` becomes the **carrier** and carries no EFS semantics.

### 3.2 The Portable Authorship Envelope (PAE)

`env = abi.encode(uint8 algo, uint64 seq, bytes32 prev, uint64 deadline, bytes sig)`

EIP-712, with a **deliberately chain-free domain** (no chainId, no verifyingContract, no salt — the EIP-7702 `chain_id = 0` precedent: replayability and portability are the same physical property, and EFS records are idempotent facts, not value transfers; the Codex states this rationale verbatim):

```
DOMAIN_SEPARATOR = keccak256(abi.encode(
    keccak256("EIP712Domain(string name,string version)"),
    keccak256("EFS Portable Record"),
    keccak256("1")))

Record(bytes32 kind,bytes32 digest,bytes32 author,uint64 seq,bytes32 prev,uint64 deadline)

signingHash = keccak256(0x1901 ‖ DOMAIN_SEPARATOR ‖ structHash)
```

- `kind` — the schema's spec-owned kind/claim-role constant (KIND_DATA, CLAIMROLE_PIN, …).
- `digest` — the per-schema **canonical record digest**: keccak256 over `abi.encode` of ALL payload fields except `author`/`env`, fixed-width, dynamic fields pre-hashed (labelhash pattern). One frozen table in the Codex, one formula per schema. (For objects this is close to, but distinct from, the EFS id — the digest covers all content, e.g. MIRROR's `uri`.)
- `seq` — per-`(author, slot)` monotone logical clock for slot claims (PIN/TAG/LIST_ENTRY); per-`(author, recordDigest)` unused (0) for objects; for slotless claims (MIRROR, REDIRECT) seq = 0 and identity is the digest. This is the CRDT research's retrofit-impossible item, in the signed bytes from the first real write.
- `prev` — optional digest of the author's previous record (hash-chain; equivocation-evident, Blocklace/SSB-source-chain grade). Zero allowed; the SDK populates it by default.
- `deadline` — optional expiry (EAS delegated-attestation's one good idea, kept; 0 = none). For liveness-critical claim classes lenses may require it (the CA industry's 47-day lesson).
- `sig` — algorithm-tagged: `algo 0x01` = secp256k1 ECDSA, 65 bytes `r‖s‖v`, low-S enforced, verified by ecrecover (~3k gas). `algo 0x02` = P-256/WebAuthn (EIP-7951 P256VERIFY at 0x100, 6.9k gas, live on L1 since Fusaka); the WebAuthn envelope bytes (authenticatorData ‖ clientDataJSON) are carried verbatim inside `sig` with a frozen canonical framing. `algo 0x03` = merkle-batch ECDSA: one signature over a batch root; `sig` = `rootSig ‖ proof` so a single wallet popup signs an 8-record DAG while each record stays individually carryable. Future PQ algos (ML-DSA / SLH-DSA) are additive new tags — key encodings are algorithm-tagged from genesis so PQ is a table update, not a migration.

**Replay semantics (the hard 20%, specified):**

- *Same chain, same record:* owned-object duplicates are idempotent no-ops (§5); slot claims with `seq <= currentSlotSeq(author, slot)` are accepted-but-inert (no supersession, no index churn beyond the carrier's EAS record). Stale-claim replay therefore cannot roll back an author's state — the downgrade attack EAS nonces exist to prevent is prevented by application idempotency instead, which is exactly what LOCKSS needs.
- *Other chain:* the same bytes are a valid write anywhere. This is the feature.
- *Unwanted-chain replay:* an author who wants chain scoping puts it in content (a lens-scoped provenance claim), never in the signature domain. Objects and claims are facts; a fact replayed is still true.

### 3.3 Tombstones (portable revocation records)

New claim schema **REVOKE** = `bytes32 targetKey, uint8 targetForm, bytes32 author, bytes env` where `targetForm` ∈ {SLOT (targetKey = slotId), RECORD (targetKey = recordDigest, for slotless MIRROR/REDIRECT)}. Envelope `seq` shares the slot's clock: a REVOKE at seq N beats claims with seq ≤ N and is beaten by a re-add at seq > N. Monotone, deterministic, replicates like any record. This resolves the coupling audit's open claim-handle question: slot claims revoke by slotId, slotless claims by digest.

Direct-path claims keep native `eas.revoke()` (attester == author). For enveloped claims carried by a relayer, `onRevoke` REVERTs unless the EAS attester equals the author — a carrier cannot kill what it carried. One authority for revocation state: the EFS-level flag the resolvers already maintain (`_isRevoked` becomes authoritative; EAS `revocationTime` is a compat input for the direct path only).

### 3.4 KEYGRANT (the identity log)

New claim schema: `bytes32 account, bytes32 keyId, uint8 algo, uint8 role, uint64 validFromHint, bytes32 nextKeyCommit, bytes env`

- `account` — the root identity (the ONE address: EOA or B′ smart account, per the one-address doctrine).
- `keyId` — secp256k1: `bytes32(uint160(address(K)))`; P-256: `keccak256(algoTag ‖ pubkeyBytes)`.
- `role` — `SIGNER` (may sign records/heads) or `ROTATOR` (may additionally sign KEYGRANT/key-removal records). PLC's control/data-plane split.
- `nextKeyCommit` — optional KERI pre-rotation digest of the next rotator key set; hash-shielded (quantum-safe) recovery commitment. Zero allowed.
- Authorization, checked in the hook, in order: (i) `msg.sender == account` (the account executes the grant — one tx, Farcaster KeyRegistry shape); (ii) ERC-1271 `isValidSignatureNow(account, grantDigest, env.sig)` (live-chain convenience — **explicitly chain-evidence-grade**, see §8e); (iii) `env` signed by an already-active ROTATOR key (fully portable rotation).
- Removal: a paired removal record; validity window `[grantPosition, removePosition)` **by chain position, monotone forever** — removal never retroactively invalidates records verified inside the window. The Farcaster "never been removed" trap is the named anti-pattern; disavowal of a compromised window is a lens-scoped claim (WHITEOUT-analogous), never protocol deletion.

EOA authors need none of this: `author == ecrecover(...)` short-circuits before any registry read. The simple case stays simple; the degenerate KEL is an empty log.

### 3.5 HEAD (per-author signed state root)

New claim schema: `bytes32 root, uint64 headSeq, uint64 asOfBlock, bytes32 author, bytes env`

`root` = deterministic binary Merkle tree (frozen layout in the Codex: sorted `(key, valueDigest)` leaves; key = slotId for slot claims, recordDigest for slotless claims and objects; ATProto-MST-style prefix structure with anti-DoS depth/width caps) over the author's **entire active claim-set and object-set on that chain**. Signed (enveloped), submittable by anyone. Because the chain already provides order and completeness, any third party can *compute* what the author's head must be from chain state — but only the author's signature makes it portable. The SDK signs heads lazily (piggybacked on the next write, or on a timer); no per-write UX cost.

What a head buys (consensus-existence research, Posture 2): provable **absence** ("author A has no active claim at slot S as of headSeq N" = non-inclusion proof), portable **currency** (latest anchored head wins; earliest-anchor fork choice at equal headSeq), bounded-staleness **revocation finality**, and the fix for the lens amplifier (§6).

### 3.6 CHECKPOINT (cross-chain witnessing)

New claim schema (or convention under a reserved anchor): `uint64 foreignChainId, uint64 blockNumber, bytes32 blockHash, bytes32 registryRoot`. Anyone attests chain X's registry/state root onto chain Y each epoch; lenses choose which checkpointers to trust via Sigsum-style **named, immutable quorum policy files published on EFS**. One attestation per chain-pair per epoch turns every EFS chain into a free O(1) CT witness of every other. Verification of a checkpoint never needs the checkpointer alive (OpenTimestamps property: proof + chain data suffice).

---

## 4. Identity and signatures — year-0 and year-100 procedures

**Identity =** the ONE account address (one-address doctrine preserved). **Authorship signatures =** raw keys (EOA key, or KEYGRANT-certified device/app/passkey keys). **Authorization for live writes =** msg.sender / AA machinery, as today. The crux dissolves by giving the two jobs to two mechanisms (identity-crux verdict, implemented here without a native kernel).

### Year-0 verification (origin chain live)

For record R under schema S:

1. Decode payload; recompute canonical digest and EFS id per Codex; check `registry.getObject` consistency.
2. `env` empty ⇒ author := attester (chain-authenticated). Done — the chain's consensus is the proof.
3. `env` nonzero ⇒ recover/verify key K from `sig` over `signingHash(kind, digest, author, seq, prev, deadline)`.
4. K == author ⇒ done (EOA path). Else one registry read: K active as SIGNER/ROTATOR for `author` at the current block.
5. Slot claims: `seq > currentSlotSeq` ⇒ supersede; else inert-accept.

All of this runs in the resolver hook at write time (~3–10k gas); readers trust chain state or re-run it client-side against an RPC for free.

### Year-100 verification (origin chain dead)

Verifier holds a **replica bundle**: record payloads + envelopes; the author's KEYGRANT log slice (itself EFS claims, enveloped where portable); the author's newest HEAD + Merkle proofs; block headers / inclusion receipts of the anchoring chain(s); CHECKPOINT attestations surviving on live chains; the self-hosted Codex. No new trust class: header chains are already required to verify any EFS content.

1. Recompute all EFS ids and digests from payloads (pure functions of the Codex).
2. Verify R's envelope → K. If K == author (EOA), skip to 5.
3. Walk the KEYGRANT slice: each grant/removal is either key-signed (verify recursively down to a ROTATOR) or msg.sender/1271-authorized — the latter verified as **chain evidence**: the grant attestation's inclusion receipt against an archived header whose chain is corroborated by N surviving CHECKPOINTs (reader-chosen quorum policy).
4. Place R inside K's validity window by chain position: R's inclusion receipt orders it between grant and removal.
5. Currency/completeness: verify R (or its absence) against the newest anchored HEAD root; conflicting heads at equal headSeq resolve earliest-anchor-wins (Ceramic's one good rule — anchoring converts key compromise into a race the legitimate author already won).
6. PQ clause: every signature is evidentiary only with an anchor predating the Codex's algorithm-retirement epoch for its algo (RFC 4998 ERS discipline); LOCKSS replication onto younger chains **is** the renewal mechanism — each replay/checkpoint re-anchors the evidence under fresh consensus.

**Conclusion grades, stated exactly:** EOA author — "signed by I, provably before epoch E": pure cryptography plus one header chain. Smart-account author — the same, down to the grant whose root authorization is "chain C's consensus recorded account A granting K before T, per N independent surviving witnesses": cryptography + checkpoint quorum. That second grade is where portability genuinely stops (§8e).

---

## 5. Write path

1. SDK builds the WritePlan; derives every ID offline; persists salt + per-slot seq with the plan (retry-deterministic).
2. Canonical payloads assembled; envelopes signed — by a KEYGRANT session key (zero popups), by the EOA (one typed-data popup, batch-mode via algo 0x03), or omitted (direct path).
3. One `eas.multiAttest`, parents-first per v2 §5, submitted by the user's account, the dapp, or **any relayer/paymaster** (envelope path — the attester field is now semantically the carrier).
4. Hooks run: v2 validation + §3/§4 verification; registry writes; indices keyed on `author`.
5. Duplicate policy (amends v2 §6): shared kinds unchanged (idempotent). **Owned kinds (DATA/LIST): idempotent no-op** — id = f(author, salt) and the payload fully determines the id, so a "duplicate" is byte-equivalent modulo sig; the registry keeps firstUID; nothing merges, nothing forks. The §6/§9 coupling resolves: model-C-style permissionless instantiation is safe *because* the envelope authenticates the owner field, and front-running an instantiation is a no-op that donates gas. The v1 REVERT-as-client-bug-detector moves to the SDK (registry read before resubmit).

Ancestor visibility TAGs, chunk-store deploys, and gas behavior are v2's unchanged.

## 6. Read path and lens resolution

Unchanged from v2 on-chain: registry point reads, `resolvePath` O(1), router web3:// serving, lens-scoped mirrors/properties, first-attester-wins over the ordered attester list, `system` tail. One re-keying: everywhere v1/v2 said `attestation.attester`, EFS state now keys on the verified `author` word (equal on the direct path). This re-key is total — a §7-refUID-style rule: **no semantic index keys on the EAS attester field for enveloped records**, or split-brain follows.

**Replicated-read conformance rule (new, normative):** any reader resolving a lens over replicated/off-origin state MUST distinguish "author A has no claim at S" (non-inclusion proof against A's newest anchored HEAD) from "A's state unknown here" (no head, or stale head — surface staleness, do not fall through). First-attester-wins is anti-monotone in missing data; without this rule a replica silently serves the second attester's content as if the first had nothing. On-chain reads on the origin chain are exempt (state is total).

Verification ordering (spam-hardening, SDK-normative): lens membership check → envelope/derivation check → byte fetch + hash. Cheap-first; a hostile record costs a set lookup, not bandwidth.

## 7. Currency, ordering, and anchoring

- **Within one chain:** consensus order. Slot supersession = seq-then-chain-order LWW. Nothing changes.
- **Across chains:** names always agree (deterministic IDs); presence and currency are per-chain state, never inferred across chains without explicit artifacts — the artifacts now exist: envelope `seq` (author's logical clock), HEAD roots (completeness), CHECKPOINTs + inclusion receipts (existence-by-T, temporal provenance: "which clock does a 100-year citation trust" = the earliest surviving anchor).
- **Equivocation:** same `(author, slot, seq)` with two digests, anywhere, is portable proof of author-side equivocation (or key theft); handled at the lens layer (trust demotion, KERI's duplicity doctrine), with the evidence-preservation rule KERI teaches: indexers retain conflicting records as evidence rather than discarding losers.
- **Cross-author order:** never needed (consensus-existence audit: zero EFS read semantics consume it). The three chain-order leaks are fixed in the freeze: LIST `maxEntries` declared **chain-local** admission state; REDIRECT SCC cycle tie-break re-keyed to **lowest sourceId** (not UID); registry `firstUID` remains bookkeeping with zero semantics.

---

## 8. The five hard parts — engineered answers

### (a) Revocation / mutability

Three regimes, one data model (retraction-as-new-fact everywhere; bytes are never unwritten — matching the apps finding that 5/10 apps hard-need claim revocation and 0/10 need byte un-existence):

1. **Origin chain, live (the common case, and the strongest answer any surveyed system has):** revocation is consensus state — one SLOAD, contracts see it, "not revoked" and "revocation withheld" are indistinguishable *by construction impossible to confuse*. Direct path: `eas.revoke`. Enveloped path: REVOKE tombstones or authorial `eas.revoke`; resolver-maintained authoritative flag.
2. **Replicated regime:** REVOKE tombstones are portable signed records sharing the slot's seq clock — deterministic LWW, replay-safe, carried by anyone (the NIP-09 lesson applied: the retraction is at least as replicable as the thing retracted, and monotone per slot until the author re-adds at higher seq). HEADs give bounded-staleness **finality**: a claim absent from the newest anchored head is not current, provably. Staleness = anchor cadence, surfaced by lens policy; freshness horizons and `deadline` expiry cover liveness-critical claim classes.
3. **Private data:** encryption + key destruction is the only real delete (photos persona; EDPB-compatible); WHITEOUT remains the viewer-sovereign mask; gateway/lens takedown is the legal surface.

Not promised, ever: un-signing, or instant global revocation across replicas. Promised: authoritative current-state on every live chain, and provable bounded-stale current-state everywhere else. Advisory-deletion (Nostr) is strictly below this because it lacks the completeness commitment; Arch A has one (heads).

### (b) Spam / sybil

Arch A has **no free write class** — every record everywhere is a gas-paid, consensus-ordered attestation. So gas remains the rate limiter and the write-DoS floor; and because anchoring here never amortizes registration (heads commit to state, they don't admit records), the Sidetree per-op/per-anchor confusion is structurally absent. The *defense* is lenses (the email endgame: authenticated author + receiver-side trust scoping; 40 years of evidence), already first-class. Index shapes carry the residual: per-attester indices primary, global `_children` demoted to labeled-untrusted discovery (v2 §2.8) — because gas-as-price fails exactly when gas is cheap (inscriptions, Dec 2023) and against positive-EV spam (Farcaster: 82–91% of *paying* accounts spam-labeled; npm token-farm floods). Gasless relaying moves cost to relayers/paymasters: replaceable service edges with Bluesky-style per-identity budgets, plural and refusable, with self-submission-with-gas as the censorship-resistance floor. Replication is lens-scoped (SSB's transitive-interest result): spam no lens trusts is never carried, so replicated-spam cost converges to zero without any protocol price.

Honest concession: Class-2 stranger-write apps (comments, social) need ≤$0.001/write; a sponsored single-claim L2 write is ~$0.005–0.05 today. Arch A serves crypto-native Class-2 and archival Class-1/3 fully; mass-market likes/reactions are conceded to app-layer aggregation or to fee decline. Arch A does not pretend to be a free social firehose.

### (c) Consensus on existence / currency

Per chain: total and free — the chain answers E/O/C/Q by construction; the registry consumes first-writer-wins once and serves existence as an O(1) read. Across chains: split per the four sub-problems — Existence: monotone set union; any replica + inclusion receipt suffices; CHECKPOINTs bound time. Ordering: per-author seq (signed) + chain order; cross-author order unneeded. Completeness: HEAD roots with non-inclusion proofs (the ATProto sign-the-state-root trick — the single most copyable mechanism in the corpus). Equivocation: contract-enforced impossibility per chain; across chains, earliest-anchor fork choice + duplicity evidence + lens-level trust destruction. The failure mode this dodges is exactly the one that killed the deltagraph and Nostr: replicated non-monotone state with no completeness signal. And the degradation is graceful: chain consensus is the premium grade, per-author-witnessed the survivable grade, with one identical data model across both.

### (d) On-chain composability

The trump card, and free: everything is same-chain state. `getObject` ~5k gas; active-edge slot point reads; attestation-gated contracts (Coinbase Verifications / Passport — the entire deployed demand evidence is EAS-shaped, i.e., *this architecture's* shape); `tokenURI` assembling bytes from the SSTORE2 chunk store on the NFT's own chain. Both hard-requirement app categories (NFT metadata, dapp structured records) served natively; point-lookup-shaped only, never traversal (Story's precompile is the counterexample budget). Cross-chain composability strategy = **replication, not proofs**: records land on the reader's chain as native state (Axiom is dead; storage proofs are hard-fork-fragile; ENS just reversed *into* L1 — the research is unanimous). Proofs are relegated to one-off bootstrap verification off the critical path.

### (e) Identity durability vs signature portability — and where portability stops

The reconciliation (§4): identity = the one account address; authorship = raw-key signatures under a chain-anchored key-grant log; validity scoped by log position, monotone forever; pre-rotation commitments give hash-shielded (post-quantum) recovery; passkeys are SIGNER-role keys, never identity roots; PQ algos are additive tags; disavowal is lens-scoped, never retroactive. The gasless prize follows by construction: the kernel-equivalent (resolver) recovers the author from the signature, so any relayer is a trust-free carrier and lenses stay keyed on the true author.

**Where portability genuinely stops — three fences, named plainly:**

1. **Smart-account root authorization is chain evidence, not a self-certifying artifact.** A B′ account address is not the hash of its own genesis (CREATE3 gives address determinism, not policy self-certification), so "account A granted key K" ultimately rests on origin-chain consensus, verifiable after chain death only through archived headers + surviving checkpoint quorums. Evidence-grade, not proof-grade. KERI-pure self-certification is unreachable from any address-rooted identity — Arch A accepts this and says so. (Escape hatch that stays open: an account whose inception content is pinned into its CREATE3 salt upgrades this link to recompute-and-compare; optional, not required.)
2. **ERC-1271-verified anything is chain-and-time-local.** Live grants/writes verified via `isValidSignatureNow` are conveniences whose evidentiary residue is the chain fact of acceptance, nothing more. The Codex marks every 1271-authorized event as evidence-grade.
3. **Post-CRQC, all discrete-log signatures degrade to "before epoch E."** Not Arch-A-specific, but Arch A's answer is operational: block inclusion is already a hash-based timestamp; replication/checkpointing onto younger chains is ERS renewal at archive scale; the Codex carries the epoch table and its stewardship hook. Verification performed after the epoch, of an artifact anchored before it, concludes authorship "when forgery was infeasible" — the statement archives have always settled for.

Also stopped, honestly: records written on the direct path by authors who never sign anything portable (no envelope, no head) are chain-state facts only; when their chain dies they survive as checkpointed snapshots — quorum-trust, not cryptography. The SDK's job is to make this class empty by defaulting envelopes+heads on (Jetstream's lesson: if the verified path is not the lazy path, real ecosystems drop it).

---

## 9. Cross-chain replication ("re-attestation bridges", made honest)

A "bridge" in Arch A is not a protocol component. It is **anyone re-submitting signed artifacts to another chain's EAS**, where the resolvers re-verify everything (derivations, envelopes, key-log state, seq). Properties:

- Permissionless and trust-free: the carrier can neither forge (envelope) nor squat (idempotent instantiation) nor roll back (seq monotonicity) nor kill (can't revoke what it carried).
- Ordered carry discipline (SDK/archivist tooling, not protocol): KEYGRANT log first, then objects parents-first, then claims, then REVOKEs, then HEAD. A replica whose head verifies is a **verified replica**: IDs recompute + envelope chain verifies + contentHash claims match bytes + head root reproduces.
- Dead authors: fully replicable (the artifacts carry their own proof) — model A's honest limit ("a dead attester's dataId can never be instantiated on any new chain") is closed. This was the single strongest external argument in the corpus (KERI §4.4-5) and Arch A banks it without leaving EAS.
- Rotation race, bounded not eliminated: a thief with a removed key can plant records on a chain where the removal hasn't been carried yet. Bounds: removals/REVOKEs replicate as first-class records; heads exclude planted records from currency; equal-seq conflicts are portable duplicity evidence; strict origin-time verification (checkpoint-anchored) governs archival reads. Stated as residual risk, not solved.
- What replication costs: full write gas per chain, per copy. There is no free LOCKSS — every autopsy of altruistic storage (Nostr relays, IPFS pinning, CAS, Hubble-by-grant) says subsidized availability has a 3–7-year half-life. Arch A prices copies honestly and lets archives/institutions (the personas with money and horizons) fund the chains they trust. Lens-scoped replication keeps the bill proportional to what anyone actually values.

Fork doctrine (ETH/ETC): identical IDs, diverging claim tails = a multi-value read; clients surface both; the published trusted-chain policy file (named, immutable, Sigsum-style) adjudicates. Never silent LWW across forks.

---

## 10. Gas / cost sketch (order-of-magnitude, L1 @1 gwei / OP-Stack L2 post-Fusaka)

| Item | Gas | L1 $ | L2 $ |
|---|---|---|---|
| Small-file write, v2 baseline (~7–8 records incl. virtual-anchor savings) | ~9–10M | ~$30 | ~$0.05–0.15 |
| PAE overhead per record (65–130B calldata + ecrecover + registry read) | +5–15k | — | negligible |
| PAE overhead per 8-record write | +40–120k (~1%) | +$0.3 | +<$0.01 |
| Single enveloped claim (comment/PIN via relayer) | ~150–400k | $0.5–1.3 | $0.002–0.02 |
| KEYGRANT (once per device/app) | ~100–200k | — | ~$0.01 |
| HEAD (per author per epoch, piggybacked) | ~150–250k | — | ~$0.01 |
| CHECKPOINT (per chain-pair per epoch, amortized over everyone) | ~100k | $0.3 | ~$0.005 |
| Full replica of a small file on a second chain | ~9–10M again | — | ~$0.05–0.15 |
| EAS substrate rent (vs hypothetical native kernel) | ~40–50k/record ≈ 5–10% of write | accepted | accepted |

Bulk bytes never touch consensus (two-plane doctrine: 10GB of photos ≈ $490k as calldata vs $20–50 on Arweave-class mirrors + on-chain contentHash claims). The EAS rent is the audited-substrate premium the coupling audit priced; Arch A pays it knowingly.

---

## 11. Adoption / DX story

**Dapp developer:** everything is EAS + standard EVM. `npm i @efs/sdk`; compute any ID offline; one `multiAttest` (or hand the signed batch to a relayer — no wallet in the loop at all); subscribe via bare log filters on deterministic topics; full-payload events make a subgraph a fold; contracts gate on `getObject`/slot reads exactly like Coinbase Verifications gates on attestations today. The reference "EFS access-control" contract (gate-on-lens-claim, gate-on-list-membership) ships with the SDK. EAS explorers show direct-path writes natively; ERC-7730 clear-signing metadata ships with the freeze so wallets render "write /notes.md, 3 properties, place under /home/alice" from calldata.

**End user:** one address; passkey or wallet on-ramp; session key KEYGRANT'd once (one tx, sponsorable); thereafter saves are zero-popup (session key signs envelopes; paymaster/relayer submits) with self-submit always available. Deletes work (claim revocation propagates to every default view on the chain within a block). "Your files outlive the app, the company, and the chain" is demonstrable: the SDK's export button emits the replica bundle (§4) any other chain or reader can verify.

**The verified path is the lazy path** (the one non-negotiable DX law from the corpus): the SDK signs envelopes, maintains seq/salt/heads, and verifies reads by default; doing less requires opting out.

---

## 12. Migration from today's prototype

Devnet-only, no real data — so this is a re-freeze, not a migration, and it **rides the already-planned v2 ceremony** (the coupling audit's sequencing finding — substrate decisions ride v2 or wait for a fork event — is satisfied trivially by staying on EAS). Deltas on top of the v2 bundle:

1. Schema strings: `author, env` trailing fields on DATA/LIST + five claims (Etched; in-window).
2. Owned-kind derivations read `author` from the validated payload; §6 owned-kind branch REVERT → idempotent no-op; §9 adopts verified owner-field replication (model A ∪ C). One joint Phase-0 decision, now with a determinate answer.
3. New reserved/additive schemas: KEYGRANT, REVOKE, HEAD, CHECKPOINT (WHITEOUT-pattern reservation; HEAD/CHECKPOINT can ship post-freeze, KEYGRANT/REVOKE should ship at genesis since the envelope path depends on them).
4. Resolver additions: envelope verification, key-registry, seq state per slot, tombstone processing (~300–600 new Etched LoC + the total attester→author re-key audit).
5. Chain-order leak fixes: LIST caps chain-local; SCC tie-break on lowest sourceId; firstUID semantics-free (already).
6. Codex additions: PAE format + domain constants + canonical record-digest table; key-log verification procedure; head tree layout; epoch/algorithm-retirement table + ERS renewal convention; checkpoint quorum policy format; replay semantics rationale (7702-chainId-0 argument).
7. SDK: envelope/seq/salt/head lifecycle; bundle export; carrier tooling; stale-slot three-way merge prompt.
8. v1 Sepolia freeze table and devnet data: superseded/wiped per the standing plan. EAS delegation rails: demoted to documented legacy bridge.
9. §11 non-change amended: "attester = user" becomes "**author = user; the EAS attester field is the carrier when relayed**" — the lens-integrity intent of the write-UX-attester rule is preserved (lenses key on author), its letter is updated by this ADR-supersession.

Verification gates inherit v2 §13 and add: envelope golden vectors (incl. cross-algo), key-log walk vectors, head inclusion/non-inclusion vectors, a full year-100 bundle drill (fresh implementation verifies a replica bundle from Codex + snapshot alone), and differential fuzz of the digest table.

---

## 13. What breaks first at 100 years (failure ordering)

1. **Years 0–5: off-chain mirror rot** (NFT-study grade). Mitigated, not solved: on-chain mirror lane + hash-verified cross-attester repair. Not Arch-A-specific.
2. **Years 2–10: un-enveloped direct-path records + head-coverage holes.** Authors who never signed anything portable leave chain-state-only facts. Damage control is SDK defaults; residue degrades to checkpoint-quorum evidence when their chain dies.
3. **Years 5–15: origin-chain death or history expiry.** State-walk snapshots + checkpoints + replayed replicas are the survival path; anything not carried before death survives only as quorum-attested snapshot. Also the practical bound on ERC-1271-grade links (§8e fence 2).
4. **~2030s: CRQC epoch.** All ECDSA/P-256 verification degrades to epoch-bounded evidence; live identities rotate to PQ tags via ordinary KEYGRANTs; dead authors' artifacts are "before epoch E" forever. Requires the renewal cadence to have actually run — an operational discipline, and disciplines decay; this is the most likely silent failure.
5. **Years 10–40: EAS behavioral-pin drift.** New chains whose EVM/EAS deployments fail the conformance test shrink the replication target set (zkSync-class exclusions already known). EAS immutability protects existing chains; EVM-evolution risk (EOF, repricing, extcodecopy — ADR-0059) is shared with everything on-chain.
6. **Years 20–100: economic thinning of replicas + stewardship decay** — the trusted-chain policy files, epoch table updates, and checkpoint operators are mortal institutions; the holistic-redesign §3.2 stewardship doc is load-bearing, and Urbit/Ceramic show institutions die faster than data. Arch A's mitigation is that every mechanism verifies without its operator (OpenTimestamps property) — but *selection* of what to trust remains social forever.

---

## 14. Honest weaknesses (red-team gift list)

1. **Resolvers become crypto verifiers on Etched surfaces.** ecrecover/P256/key-registry/seq logic in frozen contracts is new audit surface; the "EAS shields the auth core" benefit is partially spent. The replay-domain spec is the identified hard 20% (coupling audit §3.7) — a subtle bug here is Etched.
2. **Dual identity words (EAS attester vs EFS author) are a standing split-brain hazard.** One missed index re-key = slot equivocation. The refUID §7 lesson says this class of dual-representation bug is real; we've re-created the setup and must re-win it.
3. **Seq is client-managed state.** Multi-device authors can silently no-op their own writes (stale seq); the SDK mitigation (read slot seq first, three-way prompt) is UX, not protocol. Lost-update reports will happen.
4. **Heads are load-bearing and optional.** Every guarantee in §8a/§8c beyond the origin chain leans on head coverage; if head maintenance regresses in any popular client, the portable-completeness story silently returns to Nostr-grade for those authors. (Same class as Jetstream: measure coverage, or it decays.)
5. **The rotation race across chains is bounded, not closed** (§9). A red team will construct the stale-key replay on a lagging chain; our answer is layered damage-bounding, not impossibility.
6. **EAS legibility promise degrades for carried records** (explorer shows relayer-as-attester, "active" EAS records EFS considers revoked). The neutrality/optics benefit of ADR-0032 is partially traded away exactly where the new machinery is used most.
7. **Class-2 economics conceded** (§8b). If mass-market social is a must-win, this architecture loses it by design.
8. **Rent is permanent:** ~5–10% write-gas overhead, ~25% record-storage overhead, ~7 slots/record for a purpose payload of ~3–4, carrier UIDs accumulating in `_db` forever. Priced and accepted, but the red team should check the acceptance, not the arithmetic.
9. **Per-chain conformance burden forever:** every new replication target needs the EAS bytecode/behavior pin verified; the target set is whatever EVM-equivalent chains keep passing. "One big portable database" is bounded by EAS-compatible substrates — substrate independence is *EVM-family* independence, not universal.
10. **Smart-account year-100 authenticity is quorum-evidence, not cryptography** (§8e). If the mission's verify-don't-trust property is read as "zero social trust in any 100-year verification path for any identity type," Arch A fails that reading and no chain-state-rooted design can pass it.

---

## 15. Decision rule

Architecture A is the right choice iff **all** of the following hold:

1. **On-chain composability matters** — EFS wants the two app categories with contract readers (NFT/token metadata, dapp structured records) and the attestation-gating ecosystem; these come free here and cost coprocessor-prices (or are impossible) everywhere else.
2. **"Every statement is a paid, consensus-ordered fact" is acceptable product doctrine** — i.e., EFS is an archive with social features, not a free social firehose. If ≤$0.001 stranger-writes at Twitter scale are a must-have, choose a different architecture (and inherit its consensus rebuild).
3. **Evidence-grade archival authenticity is the accepted standard for non-EOA identities** — "signed artifact + anchored key-log + checkpoint quorum" satisfies the 100-year verify-don't-trust bar. If self-certifying-only is demanded for all identity types, no address-rooted design qualifies.
4. **The EAS rent (5–10% gas, ~25% storage, per-chain conformance pinning, dual-identity audit burden) is cheaper than re-creating the audited substrate** on a bespoke Etched kernel — the coupling audit's finding that the kernel is small in code and large in verification is believed.
5. **The envelope + key-log + head machinery is judged implementable inside resolver hooks within the v2 freeze window** with external review of the replay-domain spec — because it rides the one-and-only freeze or it never ships.

Falsifiers to watch: a credible L1SLOAD/RIP-7755 standardization wave (weakens the replication-for-composability argument), an EAS-side breaking event on a major chain (breaks the pin), envelope/head coverage metrics failing in practice (returns portability to vapor), and L2 fee floors refusing to fall (hardens the Class-2 concession).

---

## 16. v2 implications (survives / changes / dies)

**Survives intact:** deterministic IDs and every derivation constant; kind tags; the registry; parents-first atomic batches; the Codex + golden-vector religion; blinded/salted anchors; typed literals; virtual reserved-key anchors; slot IDs; refUID demotion; events; lenses and first-attester-wins; no-move doctrine; two-plane storage; state-walk reconstructibility; the one-final-freeze pledge (this rides it).

**Changes:** owned-kind derivations source `author` from the validated payload (identical word on the direct path); §6 owned-kind duplicate policy REVERT → idempotent; §9 replication model becomes "verified owner-field replication" (A ∪ C — the coupled open question closes); schema strings gain `author, env` on seven schemas; §11's "attester = user, no relayers" is superseded by "author = user, attester = carrier when relayed" (lens intent preserved); EAS delegation rails demoted; three chain-order leaks fixed; Codex gains the PAE/digest/key-log/head/epoch tables; new reserved schemas KEYGRANT/REVOKE/HEAD/CHECKPOINT.

**Dies:** pure model A (its dead-attester limit is unacceptable for the archive/DAO/registry personas — the apps with the money and the horizons); the reading of §11 that "kernel-entrypoint alternatives collapse the attester" as an argument against signature authorship (it only ever applied to wrapper-in-front-of-EAS architectures); EAS offchain attestations and chain-bound signing domains as any part of EFS's portability story; and the idea that portability requires leaving EAS at all — which was the question this architecture was asked to answer.
