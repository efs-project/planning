# Research: the identity / signature-portability crux

**Agent:** identity-crux · **Date:** 2026-07-02 · **Status:** complete
**Question:** Reconcile (e) of the five hard parts — ECDSA/ecrecover verifies anywhere forever but can't rotate; smart-account (ERC-1271) signatures rotate but don't travel. Which identity architecture gives EFS both 100-year portable authenticity AND durable rotatable identity — and wins the prize (kernel recovers author from signature ⇒ gasless relaying free)?

**Verdict up front:** The crux dissolves once you stop asking one mechanism to do two jobs. *Authorization* (live, chain-scoped, replay-hostile — what ERC-1271/4337/7702 do) and *authorship* (eternal, chain-free, replay-desired — what an archive needs) have **opposite** requirements. Every system that solved the archive side converged on the same pattern: **raw-key signatures over chain-free payloads + a self-certifying, hash-chained key-event log that certifies which key spoke for which identity at which log position.** KERI is the purest form; DID:PLC and Farcaster are production deployments of degenerate forms; a blockchain is simply the best witness/ordering substrate such a log has ever had. The recommended architecture (C below) keeps the B′ smart account as the live-chain UX/execution shell, adds an EFS key-event registry + an embedded portable authorship signature, and — as a side effect — makes replication model C safe (the signature authenticates the claimed attester, so dead publishers' objects become permissionlessly replicable) and gets gasless relaying for free.

---

## 1. ECDSA / ecrecover — the portability gold standard, quantified

### 1.1 Why it is the gold standard

- `ecrecover(h, v, r, s) → address` is a **pure function of the artifact**: no state, no chain, no contract, no clock. It is precompile 0x01 since Ethereum genesis and is implemented in every mainstream language. A secp256k1 signature verified in 2026 verifies identically in 2126 given only the bytes.
- Recovery means the signature **discloses the public key** — good for verification (identity = keccak(pubkey)[12:] is recomputable from the sig alone), bad post-quantum (see §5).
- Chain-binding of ECDSA signatures is **conventional, not intrinsic**: EIP-712 domains add `chainId`/`verifyingContract` by choice. The protocol itself already blesses deliberately chain-free ECDSA artifacts: an [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) authorization tuple with `chain_id = 0` is *specified* to be "valid on any chain" — and security literature treats that as a replay hazard precisely because it makes the signature portable ([EIP-7702 phishing analysis](https://arxiv.org/html/2512.12174v1), [SlowMist best practices](https://slowmist.medium.com/in-depth-discussion-on-eip-7702-and-best-practices-968b6f57c0d5)). **Lesson: replayability and portability are the same physical property.** For value-bearing authorizations that property is a vulnerability; for idempotent archival facts it is exactly what LOCKSS replication requires. EFS writes are facts, not transfers — chain-free signing domains are safe *for EFS objects/claims specifically*, and the Codex should say why.

### 1.2 PQ risk timeline, honestly

Primary/authoritative anchors (freshness noted):

| Source | Date | Claim |
|---|---|---|
| [NIST IR 8547 (initial public draft)](https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf) | Nov 2024 (ipd; check for final rev) | ECDSA (all curves) **deprecated after 2030, disallowed after 2035** for US federal use |
| [Global Risk Institute Quantum Threat Timeline 2025](https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/) | late 2025 | 26-expert survey; probability of a CRQC (RSA-2048 < 24 h) **within 10 years: ~28–49%** depending on interpretation — highest in the series' 7-year history ([summary](https://postquantum.com/security-pqc/quantum-threat-timeline-report-2025/)) |
| [pq.ethereum.org](https://pq.ethereum.org/) (EF PQ team, formed Jan 2026) | 2026 | "Most estimates place cryptographic relevance in the **early-to-mid 2030s**"; L1 PQ upgrades "could be completed by 2029, with full execution-layer migration taking additional years" |
| [EF PQ hub launch](https://www.coindesk.com/tech/2026/03/25/ethereum-foundation-prepares-for-quantum-threat-with-new-cryptography-roadmap) | Mar 2026 | ~10 client teams building PQ consensus clients (leanXMSS/leanSig/leanSpec) |

Engineering translation for a 100-year archive: **assume secp256k1 and P-256 forgeability sometime in the 2030s and plan as if the date is unknowable.** Both curves fall to the same Shor attack; P-256 buys nothing PQ-wise.

### 1.3 The archival subtlety nobody should hand-wave

A CRQC does **not** retroactively falsify old signatures — it destroys the *evidentiary value of verification performed after* the CRQC exists, because from that point anyone can forge a signature from any exposed public key (and every on-chain ECDSA signature exposes its pubkey via recovery). The rescue is standard in long-term archival practice ([RFC 4998 Evidence Record Syntax](https://www.rfc-editor.org/rfc/rfc4998)): **prove the artifact existed before an algorithm-retirement epoch using hash-based evidence, and re-anchor before each retirement.** Hash functions survive quantum: Grover only square-roots brute force, so keccak-256 keeps ~2^128 quantum preimage cost ([ethereum.org quantum resistance](https://ethereum.org/roadmap/future-proofing/quantum-resistance/)). Block inclusion **is** a hash-based timestamp — an EFS record anchored in a block whose header chain the verifier holds is exactly an [OpenTimestamps](https://opentimestamps.org/)-style carried Merkle receipt. So the year-100 verification statement degrades gracefully from "signed by I" to **"signed by I, provably before epoch E, when forgery was infeasible"** — which is precisely the statement archives have always settled for (RFC 4998 predates blockchains and was built for 30+ year retention).

Corroborating that live chains do NOT solve this for dead ones: Vitalik's quantum-emergency plan ([ethresear.ch #18901](https://ethresear.ch/t/how-to-hard-fork-to-save-most-users-funds-in-a-quantum-emergency/18901), Mar 2024) rescues EOAs via a hard fork + STARK proofs of seed preimages — i.e., a **live** chain can migrate its ECDSA identities, but a dead chain's archive gets no fork. Archival authenticity must not terminate in bare ECDSA with no epoch anchoring and no rotation path.

### 1.4 ECDSA's real weaknesses for EFS

- **No rotation, no recovery:** the key *is* the identity. Loss = identity death; theft = permanent, undetectable impersonation (there is no revocation for an address, only per-claim EAS revocation on a live chain).
- **Custody vs UX contradiction:** signature-based gasless writes require the key on a hot device; one identity ⇒ the same key on every device ⇒ the worst custody model. (This is exactly what B′ session keys were invented to avoid.)
- **Excludes passkeys and PQ:** hard-wiring ecrecover means secp256k1 forever.

---

## 2. ERC-1271 / account-abstraction signatures: precisely why they don't travel

### 2.1 The mechanism is a query, not an artifact

[ERC-1271](https://eips.ethereum.org/EIPS/eip-1271): `isValidSignature(bytes32 _hash, bytes _signature) view returns (bytes4)` returning magic `0x1626ba7e`. The spec is explicit that validation "can call arbitrary methods … which could be **context dependent (e.g. time based or state based)**" and scheme-agnostic ("ECDSA, multisig, BLS"). Three bindings follow, each fatal to portability:

1. **Contract-identity binding.** The verifier is an address, and an address is only meaningful on one chain. Same-address ≠ same-owner across chains: the 2022 Optimism/Wintermute incident (legacy-CREATE Gnosis Safe address re-claimed by another party) is already documented in [[deterministic-ids]] §9 as the "same-address squat exception."
2. **Mutable-state binding.** Owners rotate, thresholds change, proxies upgrade. The *answer* to `isValidSignature` is a function of chain state at a block height. "Was this valid at time T" is only reconstructible with an **archival node of that chain at T** — and after the chain dies, not at all.
3. **Execution-environment binding.** The answer also depends on EVM semantics and precompiles at that block (a 1271 wallet using P256VERIFY needs the 0x100 precompile to even evaluate).

[ERC-6492](https://eips.ethereum.org/EIPS/eip-6492) (counterfactual accounts) doubles down: the verifier "MUST perform a contract deployment before attempting to call isValidSignature" — verification literally requires **simulating a deployment via `eth_call`** on the target chain. [ERC-7739](https://eips.ethereum.org/EIPS/eip-7739) (defensive rehashing, now OpenZeppelin-recommended against the [1271 replay vulnerability](https://www.alchemy.com/blog/erc-1271-signature-replay-vulnerability)) binds signatures *tighter* to `(account, chain)` on purpose. **The AA ecosystem is moving away from portability by design, because in an authorization context replay = theft.** Even EAS's own OFFCHAIN attestations sign an EIP-712 domain containing `chainId` and `verifyingContract` ([EAS offchain docs](https://docs.attest.org/docs/easscan/offchain), [eas-sdk offchain.ts](https://github.com/ethereum-attestation-service/eas-sdk/blob/master/src/offchain/offchain.ts)) — confirming the journey's step 4: not even EAS's "portable" form travels.

### 2.2 Does ANY scheme make AA signatures portable? (surveyed: no)

- **Cross-chain state proofs** (carry a storage proof that the verifier contract would have said yes at chain X, block N): technically constructible, but Base's own keystore R&D concluded the substrate is too fragile — "cross-chain messaging is fragile and relies on storage proofs that can break following hard forks" (L1Block/EIP-4788 deprecations, MPT→Verkle migrations, settlement changes) ([Base, "Exploring the Keystore"](https://blog.base.dev/exploring-the-keystore), Mar 2025). This is the same century-scale dependency-rot surface as EFS's rejected replication model B.
- **Keystore rollups / Keyspace** (Vitalik's minimal-keystore-rollup vision; Scroll and Base specs): Base's published conclusion — "the Keystore **isn't yet ready** for its originally intended use case: ensuring cross-chain signer consistency," with explicit wallet-bricking failure modes and "Keyspace currently does not provide signer revocation guarantees across chains." Status: research, not substrate.
- **[ERC-7913](https://eips.ethereum.org/EIPS/eip-7913)** (signer = `verifier ‖ key`, OpenZeppelin ships P256/RSA/WebAuthn verifiers): usefully decouples *keys* from *addresses* — but the verifier is still a contract on a chain. It generalizes the key zoo, not portability.
- **Reduction to raw keys + certification log:** the only construction in which the artifact carries eternal proof. This *is* the rotation-log pattern (§3).

**Precise statement of the impossibility:** an ERC-1271 "signature" is an authorization decision by a mutable machine; its validity is indexed by `(chain, block)`. To make it portable you must either carry a consensus/state proof of the decision context (heavy, format-rotting, dead-chain-fatal) or restate the decision as raw-key signatures plus a certification log. There is no third option, and the ecosystem's own anti-replay work (7739) actively forecloses accidental portability.

---

## 3. Rotation-log identity: the pattern that reconciles durability and portability

**Pattern definition.** Identity `I` = digest of a signed inception event (self-certifying — no registry can mint or reassign it). Key state evolves via a hash-chained log of signed events. Record verification = `SigVerify(K, artifact) ∧ CertifiedAt(I, K, position(artifact))` — where *position*, not wall-clock time, scopes validity. The verifier needs: the artifact, the log prefix, and an ordering proof between the artifact and the log's events.

### 3.1 DID:PLC (Bluesky) — production, directory-ordered

Mechanics ([spec v0.1](https://web.plc.directory/spec/v0.1/did-plc), primary): `did:plc:${base32(sha256(genesisOp))[:24]}` (120 bits of the genesis digest — "the DID itself is derived from the hash of the first operation"). Operations carry `rotationKeys` (1–5 did:keys, **ordered by descending authority**; secp256k1/P-256 only), `verificationMethods` (service signing keys), `prev` (CID of prior op), `sig`. Canonical DAG-CBOR encoding, **low-S enforced, non-canonical encodings rejected** (malleability would fork CIDs). "The operation log is self-certifying, and contains all the information needed to construct (or verify) the current state."

- **Recovery:** a 72-hour window in which a *higher-authority* rotation key may fork out ("clobber") operations signed by a lower-authority key.
- **What the directory is trusted for:** not forgery (impossible) but **ordering and fork choice** — "Misordering: in the event of a fork in DID document history, the server could choose to serve the 'wrong' fork" — plus liveness. The whole log is enumerable/exportable (`/export`, audit endpoints) so third parties can mirror and audit; Bluesky states intent to move governance out of its sole control.
- **Year-100 weakness:** the 72-hour rule is wall-clock — *whose clock?* The directory's. An archived-only verifier holding one internally-valid log cannot know whether a higher-authority fork clobbered it in-window without trusting the archived directory's timestamps/ordering. PLC works because the directory is a (transparent, auditable) ordering oracle. **Copy the exportable-audit-log discipline and canonical-encoding strictness; replace the directory with a chain.**

### 3.2 KERI — the maximalist design; the exact 100-year answer

From the [ToIP KERI spec](https://trustoverip.github.io/kswg-keri-specification/) (primary) and the [original paper](https://arxiv.org/pdf/1907.02143):

- **AID = digest of the inception event** ("any change to even one bit of the incepting information changes the digest and hence changes the derived identifier") — self-certifying, no registry.
- **Pre-rotation:** each establishment event commits to the *digests* of the next keys ("each Rotation event … makes a forward commitment to the following Rotation event via its list of pre-rotated key digests"). Compromise of current signing keys cannot forge a rotation — the attacker would need preimages of unexposed keys. Because only digests are ever published, **unexposed pre-rotated keys are protected by hash one-wayness, which survives quantum** — a rotation-log identity has a built-in PQ escape hatch that a bare keypair identity structurally lacks.
- **Seals answer "was K valid at T":** "the inclusion of a seal in a key event is equivalent to signing the external data" — and the KEL's append-only backward-chained structure means **the event's sequence number proves which key state was active. Ordering, not timestamps.** A verifier 100 years later: (1) digest of inception = AID; (2) walk the chain of signed events; (3) find the seal committing to the artifact at position n; (4) K ∈ current keys of the state after the last establishment event ≤ n. No clock, no registry, no chain required — the KEL prefix is a **carried receipt**.
- **Witnesses / KERL / duplicity:** witnesses sign receipts of each event; "there MUST be at most one valid KEL for any identifier … the existence of an alternate but verifiable KEL is provable evidence of duplicity"; watchers apply first-seen-wins. This is where KERI pays its complexity bill (KAWA agreement, watcher infrastructure) — and it is exactly the bill a blockchain pays better: **a chain is a witness pool with total ordering, global replication, and first-seen enforced by consensus.** KERI-on-chain degenerates cleanly: per-chain duplicity is impossible (the contract enforces one log), and cross-chain duplicity collapses into EFS's existing fork-doctrine workstream ([[efs-v2-holistic-redesign]] §3.2).
- **Residual for archives:** an archived verifier holding one internally-valid KEL can't disprove an unseen fork *unless* the log is anchored somewhere totally ordered. Chain anchoring closes KERI's one archival gap.

### 3.3 Farcaster — the production on-chain registry, and the trap to avoid

Mechanics ([contract docs](https://docs.farcaster.xyz/reference/contracts/reference/key-registry), [protocol spec](https://github.com/farcasterxyz/protocol/blob/main/docs/SPECIFICATION.md), primary; contracts on OP Mainnet as of fetch): IdRegistry maps **fid → custody address** (fid is a *sequential registry-minted integer — not self-certifying, chain-bound*); KeyRegistry (0x00000000Fc1237824fb747aBDE0FF18990E59b7e) maps fid → ed25519 signer keys, additions gated by a SignedKeyRequestValidator EIP-712 flow. Every message is an ed25519-signed protobuf; hubs verify signature + registry membership. **This is the gasless prize in production:** a cold custody key certifies hot app-held signers on-chain once; thereafter users sign messages locally and never pay per-message gas; verifiers check sig + registry. EFS's kernel analog is the same shape with ecrecover/P256VERIFY instead of hub software.

**The trap:** "messages … are only valid if the signing key pair is a Signer … and has **never been removed**. When a Signer is removed … all messages signed by the signer in other CRDTs should be revoked" — removal **retroactively invalidates and prunes the key's entire history**. Rational for a social feed (compromise containment); catastrophic for an archive: (a) validity is non-monotone — a record valid today can become invalid tomorrow because of a *future* registry event; (b) routine key hygiene deletes history; (c) a compromised owner key can erase a lifetime of authorship. **EFS must scope key validity [add-event, remove-event) by chain position, never retroactively.** Disavowal of a compromised window should be an explicit, lens-scoped claim ("I disavow records anchored in range [a,b]") — viewer-sovereign, like WHITEOUT — not protocol deletion.

(Convergent evolution note: [did:webvh](https://identity.foundation/didwebvh/next/) — did:web + hash-chained verifiable history + witnesses — is a third independent arrival at the same log pattern.)

### 3.4 The 100-year question, answered per system

> How does a verifier in 2126 prove key K was valid for identity I at time T?

| System | Proof of key validity at T | Portable after origin infra dies? |
|---|---|---|
| Bare EOA | vacuous (K = I, forever) | ✅ but no rotation, and post-CRQC needs epoch anchor |
| ERC-1271 account | archival `eth_call` at block(T) | ❌ requires living archival state of that chain |
| DID:PLC | carried audit log + directory's ordering/72h-window honesty | ⚠️ mostly — fork choice trusts archived directory ordering |
| KERI | carried KEL prefix; seal position n; K ∈ state after last establishment ≤ n; witness receipts against duplicity | ✅ fully self-contained (modulo unseen-fork risk without an anchor) |
| Farcaster | registry state — but validity requires K "never removed," i.e., depends on the **entire future** of the registry | ❌ chain-bound AND non-monotone |
| **EFS target** | carried log prefix + block-inclusion receipts; record anchored between log events; K active in that interval; anchor predates PQ epoch | ✅ by construction |

---

## 4. Passkeys / P-256 + RIP-7212 / EIP-7951

- **The crypto is portable.** A WebAuthn assertion is a P-256 (ES256) signature over `authenticatorData ‖ SHA-256(clientDataJSON)` ([webauthn.guide](https://webauthn.guide/), [Yubico dev guide](https://developers.yubico.com/WebAuthn/WebAuthn_Developer_Guide/WebAuthn_Client_Authentication.html)) — offline-verifiable forever given the stored public key, same portability class as secp256k1. Caveat: the **envelope must be archived** (authenticatorData bytes + clientDataJSON verbatim; the challenge binds a ceremony) — if EFS accepts WebAuthn-signed records, the Codex must freeze a canonical envelope encoding, or accept "raw P-256 over the EFS digest" only via authenticators that support it.
- **On-chain verification is now cheap and universal-ish:** [EIP-7951](https://eips.ethereum.org/EIPS/eip-7951) P256VERIFY precompile at 0x100, **6,900 gas**, live on L1 with Fusaka (mainnet 2025-12; repo-verified) after RIP-7212 shipped across major L2s. The kernel can verify passkey signatures nearly as cheaply as ecrecover (~3k).
- **The custody model disqualifies passkeys as identity roots:** non-extractable; synced only within a vendor ecosystem (Apple↔Google do not cross-sync — repo-verified in [[efs-account-system]]); no user-controlled backup; loss handled by *enrolling a new credential*, i.e., passkey workflows **presuppose a rotation layer above the key**. And P-256 is exactly as quantum-doomed as secp256k1.
- **Conclusion:** passkeys are first-class *signers* under a key-event log (each ecosystem's passkey = one certified key; loss = a rotation event, not identity death) and must never be the identity itself. This matches Route A of [[efs-account-system]] but re-roots it in the log.

---

## 5. PQ migration for signed archives

**Threat model for an archive:** forgery-after-CRQC of every exposed-pubkey discrete-log scheme (secp256k1, P-256, ed25519, BLS). *Not* harvest-now-decrypt-later — that applies to encryption (EFS's encrypted-file conventions already mandate ML-KEM hybrid). Hashes and Merkle structures survive (§1.3).

**Standards landscape (NIST, final Aug 2024):**

| Scheme | Type | Sig size | Archive fit |
|---|---|---|---|
| ML-DSA-44/65 ([FIPS 204](https://quantumsecuritydefence.com/insights/nist-fips-standards/)) | lattice | 2,420 / 3,309 B | workhorse; lattice assumptions younger |
| SLH-DSA-128s ([FIPS 205](https://asecuritysite.com/signatures/fips205)) | **hash-only** | 7,856 B | **conservative century-scale choice** — security reduces to hash preimage resistance only; explicitly recommended for long-term archival/root signing |
| FN-DSA / Falcon (FIPS 206 draft) | NTRU lattice | ~666 B | smallest; fragile floating-point signing; not final |
| XMSS/LMS (RFC 8391/8554, SP 800-208) | hash, **stateful** | ~2.5 KB | state reuse = key break; fine for controlled infrastructure signers, wrong for user wallets |

**Ethereum's own path** ([pq.ethereum.org](https://pq.ethereum.org/)): consensus → hash-based **leanXMSS** with SNARK aggregation (leanVM); execution → PQ sig precompiles (Falcon/Dilithium/SPHINCS+ candidates, milestone J*); user accounts migrate via **account abstraction signature agility** (EIP-8141 discussed for late-2026 Hegotá per [secondary reporting](https://www.coindesk.com/tech/2026/03/25/ethereum-foundation-prepares-for-quantum-threat-with-new-cryptography-roadmap); Vitalik at ETHDenver 2026: "account abstraction gives individual wallets the freedom to adopt post-quantum signature schemes … without waiting for a hard fork"). Note the irony: Ethereum's chosen migration lever (AA signature agility) is exactly the mechanism that is *not archival* (§2) — fine for live authorization, silent on dead-chain authenticity. EFS must supply the archival half itself.

**Strategies for signed archives, ranked for EFS:**

1. **Anchor renewal (RFC 4998 ERS, blockchain edition) — COPY.** ERS's insight, running in production archives for two decades: you cannot re-sign what you cannot re-key, but you can **re-timestamp evidence under fresh algorithms before old ones die** (Timestamp Renewal / Hash-Tree Renewal). EFS's block inclusion is already a hash-based timestamp; LOCKSS replication of anchors onto new (eventually PQ-native) chains **is** ERS renewal at archive scale. Requires the Codex to carry an **algorithm-retirement (epoch) table** — "signatures of class X are evidentiary only with anchors < epoch E_X" — updateable via the trust-root stewardship path. Works for dead attesters. This is the only strategy that does.
2. **Rotation-log rescue — COPY.** Live identities rotate to ML-DSA/SLH-DSA keys via ordinary log events once verifiers exist (precompile or SNARK-wrapped). Old records stay valid: ordering proofs show they were anchored while the old key was certified and before its epoch. KERI-style pre-rotation digests give even the *recovery path* PQ protection today at zero cost (32-byte digests of unexposed next keys).
3. **Hybrid signing now — DEFER.** No on-chain PQ verifier exists; 2.4–7.9 KB sigs are ~39–126k gas of calldata alone. What to do *now* is cheaper: make key encodings **algorithm-tagged** (multicodec/CESR-style prefix on every key in the registry and every signature envelope) so PQ keys are purely additive, and mandate hybrid (classical+PQ) only for the encrypted-file KEM path (already done).
4. **Mass re-signing — REJECT** as the plan of record: requires living keyholders; the archive's hard case is precisely the dead ones.

---

## 6. Three concrete architectures, with exact verification procedures

Setting: v2 deterministic IDs make every payload chain-free; "year-0" = live origin chain; "year-100" = origin chain dead, verifier holds an EFS replica bundle (payloads, key logs, block headers/receipts of anchoring chains, the Codex).

### Architecture A — Eternal-EOA (log-less identity; hardened status quo for cold-key publishers)

Identity `I` = secp256k1 address. Every owned-kind record carries `(payload, sig)` where `sig` is over `keccak256(EFS_SIG_DOMAIN ‖ payloadDigest)` — EFS-owned domain constants, **no chainId, no verifyingContract** (deliberate 7702-chainId-0-style portability; safe because records are idempotent facts).

- **Year-0 verify:** (1) recompute EFS ID from payload per Codex; (2) `ecrecover(digest, sig) == I`. On-chain: ~3k gas in the resolver.
- **Year-100 verify:** the same two steps — *nothing else needed* — plus the PQ clause: verify a carried Merkle inclusion receipt of the record in a block header predating epoch E(secp256k1); conclude "authored by I before E."
- **Properties:** maximal portability; zero infrastructure. **Fails durability:** no rotation/recovery (loss = death, theft = eternal impersonation); no passkeys; no PQ agility for the identity itself; gasless requires the one true key hot on every device. Keep it as the **degenerate case of C** (an identity with an empty log), so air-gapped cold-key publishers ([[efs-v2-holistic-redesign]] §5 persona) remain first-class.

### Architecture B — B′ smart account as attester, msg.sender authenticity (current direction, unmodified)

Identity = account contract address; authenticity = the fact that the account executed the write (session keys inside; EAS records only `attester`).

- **Year-0 verify:** read the attestation; trust the chain's execution. Perfect UX (session keys, paymasters), zero extra bytes.
- **Year-100 verify (origin dead):** to prove "account X authored payload P" you must re-verify the *transaction* — archived headers + bodies + receipts + the account's authorization logic + that block's EVM semantics and precompiles. That is: **archive and emulate the consensus of a dead chain.** No portable artifact exists at any layer (the session key's inner signature is 4337/7702 machinery bound to chainId and account nonce; ERC-1271 answers died with the chain's state). Cross-chain replay is impossible for dead attesters (replication model A's honest limit) and unsafe for same-address squats.
- **Verdict:** B alone structurally fails mission properties (2) portability and (3) verify-don't-trust at the century scale — a precise confirmation of the journey's step 4. B survives as the *execution/UX shell* of C.

### Architecture C — EFS key-event-log identity (recommended): "KERI-shaped log, Farcaster-shaped registry, the chain as witness, ERS-shaped renewal"

**Components:**
1. **Identity.** `I = keccak256(inceptionEvent)` — self-certifying, chain-free, a full bytes32 (harmonizes with v2's bytes32 attester words; richer than an address). The inception event names: initial signing keys (algorithm-tagged: secp256k1 / P-256 / future PQ), an optional pre-rotation digest (KERI-style, PQ-shielded recovery), and recovery policy. *Pragmatic variant C1:* `I` = the B′ account address with the inception content pinned into its CREATE3 salt — friendlier to "user = ONE address" ([[efs-identity-one-address]]) but inherits address-portability discipline (CREATE3 everywhere, squat exception). *Pure variant C2:* `I` is the digest; each chain's smart account is a *binding claim*. Decide at Phase 0; C2 is the archival-clean choice, C1 the UX-clean one.
2. **Key-event registry (per chain).** A contract holding the hash-chained log: `incept / addKey / removeKey / rotate / checkpoint`, each event signed by keys valid under the *previous* state, each carrying the prior event's digest, emitted as events AND state (state-walk reconstructible, EIP-4444-proof — same doctrine as [[deterministic-ids]] §4). The chain supplies total ordering, replication, and first-seen enforcement — everything KERI buys with witnesses/KAWA, for free. The log is **exportable as a self-contained artifact** (PLC's audit-log discipline).
3. **Portable authorship envelope.** Owned-kind payloads (and claims, if desired) embed `(signerKey, sig)` over the chain-free EFS digest (domain per Arch A). The kernel resolver verifies: `ecrecover`/`P256VERIFY` → key K; registry lookup → K active for I *now*; sets attester = I. **msg.sender becomes irrelevant to authorship ⇒ any relayer/paymaster can submit ⇒ gasless writes for free — the prize.** (EAS's own delegated attestations prove the recover-attester-from-EIP-712-sig + relayer-pays mechanic in production ([docs.attest.org](https://docs.attest.org/docs/easscan/offchain)); EFS's envelope drops the chainId-bound domain that makes EAS's version non-portable.) Cost: +65 bytes calldata (secp256k1) + ~3–10k gas verification per record.
4. **Validity semantics (anti-Farcaster).** K's validity = [addKey position, removeKey position) **by chain order, monotone forever**. Records verified at write time stay valid. Compromise handling: forward removal + optional lens-scoped *disavowal claim* over an anchored range — viewer-sovereign, WHITEOUT-analogous, never protocol deletion.
5. **PQ/epoch machinery.** Algorithm-tagged keys; Codex algorithm-retirement table; ERS-style re-anchoring convention (replicas onto younger chains renew the evidence); rotation to PQ keys is an ordinary log event once verifiers exist.

**Year-0 verification (exact):** (1) recompute EFS ID from payload; (2) verify envelope sig → K; (3) one registry read: K active for I at current block; (4) attester = I. Client-side reads: identical against an RPC. 

**Year-100 verification (exact):**
1. Obtain the bundle: payload; envelope (K, sig); identity I; log prefix L of I up to the record's anchor; Merkle inclusion receipts of the record and of L's events in blocks of the anchoring chain(s); header chain(s) (already required for verifying any EFS content — **no new trust is introduced**).
2. Check `I == keccak256(L.inception)` (C2) or `I == CREATE3(inceptionSalt…)` per pinned recipe (C1) — self-certifying root.
3. Walk L: each event chains by prev-digest; each event's signatures satisfy the preceding state's policy (thresholds, pre-rotation commitments).
4. Place the record: its inclusion receipt orders it between log events e_i and e_{i+1} (same-chain block order; or a checkpoint event sealing the record's digest, KERI-style).
5. Check K ∈ active set of the state after e_i, and no removeKey for K precedes the record.
6. PQ clause: the record's anchor (or its newest ERS renewal anchor) predates epoch E(algo(K)) per the Codex table.
7. Duplicity: two internally-valid conflicting logs for I on one chain are impossible (contract-enforced); across chains, fork doctrine adjudicates (existing §3.2 workstream — identity inherits it, adding nothing new).

**What this buys beyond the crux:** the envelope makes the *claimed author verifiable from the artifact alone*, which converts replication model C's fatal flaw ("identity owner moves from msg.sender into an unauthenticated payload field") into a checkable rule — **anyone may re-instantiate a dead publisher's owned objects on a new chain by carrying the signed artifact + log bundle**, and the resolver verifies rather than trusts. That closes the honest limit of model A ("a dead attester's dataId can never be instantiated on any new chain") without permissionless-squat risk, and dissolves the §6/§9 coupled REVERT dilemma for the replicated case.

**Costs, honest:** a signature-verifying kernel is new audit surface and new frozen-adjacent surface (the registry + envelope format enter the Codex); per-record gas +~3–10k plus 65–96 bytes calldata; SDK must own log export/bundling and envelope construction; the lens layer re-keys authorship on I (recovered) rather than the EAS attester field — a semantic change to "attester = user" that must be adjudicated against [[efs-write-ux-attester]] (mitigant: under C1 the EAS attester *is* still the account for on-chain writes; the envelope is additional, and can even be phased in as a client-verified convention before the kernel enforces it); wall-clock time inside the log is unnecessary (position suffices) but temporal provenance across chains remains the separate open workstream it already was.

### Recommendation

**C, with A as its explicit degenerate case, and B′ retained as the execution shell.** C is the only architecture that satisfies both halves of the crux: durability (rotation, recovery, passkeys-as-signers, PQ agility via pre-rotation + algorithm tags) and portability (raw-signature artifacts + carried self-certifying log + block-inclusion receipts; year-100 verification needs only hashes and header chains the archive already carries). It wins the gasless prize by construction and repairs the replication-model dilemma as a side effect. The genuinely new Phase-0-grade decisions it forces: C1 vs C2 identity form; envelope mandatory-vs-optional per kind; registry as EFS-native claims vs dedicated contract; and the epoch-table stewardship hook.

---

## 7. Copy / avoid lessons (condensed)

**COPY**
- KERI: self-certifying inception digest; **log-position (not wall-clock) key validity**; seals ("a seal in a key event is equivalent to signing the external data"); pre-rotation digests = hash-shielded, quantum-resistant recovery.
- DID:PLC: exportable/enumerable audit log; strict canonical encoding (DAG-CBOR, low-S rejection); small ordered rotation-key set with ranked authority.
- Farcaster: on-chain registry certifying cheap app-held signers = production-proven gasless writes; custody/signer separation.
- RFC 4998 + OpenTimestamps: carried Merkle receipts; **re-anchor evidence under fresh algorithms before old ones retire**; put an algorithm-retirement epoch table in the Codex.
- EIP-7702 chainId=0 (inverted): chain-free signatures are replayable by design — safe for idempotent archival facts, never for value-bearing authorizations; say so in the Codex.
- EAS delegated attestations: recover-attester-from-signature with relayer-pays is proven inside EAS itself — EFS only needs to un-bind the domain.

**AVOID**
- Farcaster's "never been removed": retroactive invalidation makes validity non-monotone and lets key hygiene (or a compromised owner) erase history. Time-scope by position; disavow via lens-scoped claims.
- ERC-1271/6492 as archival authenticity: they are *queries against mutable chain state*, not artifacts; anti-replay work (ERC-7739) is actively making them less portable, correctly.
- Binding chainId/verifyingContract into any signature meant to outlive the chain (EAS offchain attestations do — don't inherit).
- Bare-ECDSA-forever identity roots: no rotation, and post-CRQC only epoch-anchored signatures keep evidentiary value (NIST: deprecate 2030 / disallow 2035; experts: ~28–49% CRQC within 10 years).
- Passkeys as identity roots (vendor-locked, non-extractable, loss presumes a rotation layer) — they are signers under the log.
- Building cross-chain key-state sync on storage proofs / keystore rollups today (Base, Mar 2025: "isn't yet ready"; bricking risks across hard forks).
- Shipping PQ signatures now (no verifiers, 2.4–7.9 KB); ship algorithm-tagged key encodings instead so PQ is additive.

---

## 8. Sources

**Primary (specs/standards/first-party):** [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271) · [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492) · [ERC-7739](https://eips.ethereum.org/EIPS/eip-7739) · [ERC-7913](https://eips.ethereum.org/EIPS/eip-7913) · [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) · [EIP-7951](https://eips.ethereum.org/EIPS/eip-7951) · [did:plc spec v0.1](https://web.plc.directory/spec/v0.1/did-plc) · [KERI spec (ToIP)](https://trustoverip.github.io/kswg-keri-specification/) · [KERI paper](https://arxiv.org/pdf/1907.02143) · [Farcaster protocol spec](https://github.com/farcasterxyz/protocol/blob/main/docs/SPECIFICATION.md) · [Farcaster KeyRegistry docs](https://docs.farcaster.xyz/reference/contracts/reference/key-registry) · [EAS offchain docs](https://docs.attest.org/docs/easscan/offchain) · [eas-sdk offchain.ts](https://github.com/ethereum-attestation-service/eas-sdk/blob/master/src/offchain/offchain.ts) · [NIST IR 8547 ipd](https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf) (Nov 2024 — check for final) · [RFC 4998](https://www.rfc-editor.org/rfc/rfc4998) · [pq.ethereum.org](https://pq.ethereum.org/) · [ethresear.ch quantum-emergency fork](https://ethresear.ch/t/how-to-hard-fork-to-save-most-users-funds-in-a-quantum-emergency/18901) (Mar 2024) · [Base "Exploring the Keystore"](https://blog.base.dev/exploring-the-keystore) (2025-03-14) · [GRI Quantum Threat Timeline 2025](https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/) · [OpenTimestamps](https://opentimestamps.org/) · [webauthn.guide](https://webauthn.guide/) · [Yubico WebAuthn guide](https://developers.yubico.com/WebAuthn/WebAuthn_Developer_Guide/WebAuthn_Client_Authentication.html) · [ethereum.org quantum resistance](https://ethereum.org/roadmap/future-proofing/quantum-resistance/) · [did:webvh](https://identity.foundation/didwebvh/next/) · [OpenZeppelin cryptography/accounts docs](https://docs.openzeppelin.com/contracts/5.x/accounts).

**Secondary (commentary; treat figures as approximate):** [Alchemy on 1271 replay](https://www.alchemy.com/blog/erc-1271-signature-replay-vulnerability) · [postquantum.com GRI-2025 summary](https://postquantum.com/security-pqc/quantum-threat-timeline-report-2025/) · [CoinDesk EF PQ hub](https://www.coindesk.com/tech/2026/03/25/ethereum-foundation-prepares-for-quantum-threat-with-new-cryptography-roadmap) (2026-03-25) · [7702 phishing analysis](https://arxiv.org/html/2512.12174v1) · [FIPS 203/204/205 size comparisons](https://quantumsecuritydefence.com/insights/nist-fips-standards/), [asecuritysite FIPS 205](https://asecuritysite.com/signatures/fips205) · [Agent IO on did:plc risks](https://agent.io/posts/risks-of-did-plc/) · [Keyfactor on ERS renewal](https://www.keyfactor.com/blog/evidence-records-help-renew-expiring-timestamps/).

**Repo files read:** `/Users/james/Code/EFS/planning/Designs/deterministic-ids.md`, `efs-v2-holistic-redesign.md`, `efs-v2-transition-plan.md`, `efs-account-system.md` (the last contains repo-verified facts reused here: Fusaka/EIP-7951 live 2025-12; RIP-7212 on major L2s; Apple↔Google passkey non-sync; EAS EIP1271Verifier; MetaMask 7715 non-GA).

**Staleness:** web data fetched 2026-07-02. Fast-moving items to re-check at Phase 0: NIST IR 8547 finalization; FN-DSA (FIPS 206) status; EIP-8141/Hegotá scope; keystore-rollup progress (L1SLOAD/REMOTESTATICCALL); Farcaster contract locations (OP Mainnet as of fetch); MetaMask session-key GA; PLC directory governance transfer.
