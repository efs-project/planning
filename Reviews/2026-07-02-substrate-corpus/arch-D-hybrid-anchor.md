# Architecture D — RECORD/KERNEL: Portable Signed Records + Per-Chain Ingesting Kernels

**Architect:** arch-D (hybrid synthesis) · **Date:** 2026-07-02
**Inputs:** all 13 substrate research reports; `planning/Designs/deterministic-ids.md`; `efs-v2-holistic-redesign.md`; `contracts/specs/overview.md`.
**Audience note:** the red team reads this next. Weaknesses are stated, not softened; §12 is the self-indictment.

---

## 0. Thesis in one page

**One artifact, many notaries.** EFS's 100-year unit of truth becomes the **Portable Record**: a self-contained, chain-free, author-signed statement whose signature verifies with nothing but hashes and public-key math, and whose object IDs are the v2 deterministic IDs. Chains stop being where truth *lives* and become where truth is **registered**: each chain runs an **EFS kernel** that ingests records — verifies the signature, checks the signing key against the author's key-event log, derives the deterministic IDs, applies the (ported, already-written) v2 validation semantics, and materializes registry + indices that contracts can read at ~5k gas.

The division of labor, stated as an equation:

```
record  = authenticity + meaning + portability        (survives every chain)
kernel  = existence + ordering + spam-cost + composability   (per chain, mortal)
anchor  = time + completeness + equivocation-resistance      (cheap, replicated)
```

This is the point where the two production journeys meet in the middle. Farcaster started with portable signatures + gossip and was forced to re-add a consensus substrate (Snapchain) because replicated non-monotone state without ordering dies (FIP-193/207). EFS v1 started chain-native and has been forced, step by step, toward portable signatures because chain-native artifacts don't survive the chain (EAS UIDs, ERC-1271, chainId-bound EIP-712 domains). Architecture D refuses to choose: **on-chain writes ARE record submissions** — the calldata *is* the portable artifact, so the archive's unit and the chain's unit are the same bytes. There is no export step, no "portable version" to forget to generate, no Jetstream-style unsigned side channel to drift to: the cheapest way to write is also the archival way.

Three write classes fall out:

| Class | What | Buys | Costs |
|---|---|---|---|
| **W1 — Full ingestion** | record in calldata → kernel validates → registry + indices + contract-readable state | chain-grade existence/ordering/revocation, R1 composability, spam-priced by gas per record | full gas (~cents on L2, ~$30 L1 for a small file DAG) |
| **W2 — Anchored head** | author's signed state-root (MST over their active claim-set) anchored into the kernel's accumulator; claim-set artifact published as EFS data | existence-by-T, per-author completeness + non-inclusion proofs, equivocation fork-choice, bounded-staleness revocation — for unbounded record volume | ~zero marginal gas (batched); no shared indices, no contract reads, staleness window |
| **W3 — Naked record** | signed record circulating off-chain (relay, file, QR code) | authenticity only | Nostr-grade everything else; explicitly labeled untrusted-currency |

Identity is the KERI-shaped reconciliation the identity research converged on from four independent lineages (KERI, did:plc, PZP, did:webvh): **identity = self-certifying digest of an inception event; agility = a hash-chained key-event log; the home chain's kernel is the log's ordering witness** (the role Farcaster's KeyRegistry and PLC's directory play, done by a contract instead of a company). Signatures in records are always raw-key (secp256k1 ecrecover, P-256 via EIP-7951, PQ later via algorithm tags) — **ERC-1271 never appears inside a record**; the B′ smart account remains the UX/execution shell and a certified controller, never the authenticity root.

The prize is collected by construction: authorship is recovered from the signature + key-log lookup, msg.sender is irrelevant to authorship, therefore **any relayer or paymaster can submit anyone's records** and lenses stay keyed on the true author. Gasless writes are not a feature; they are a corollary.

---

## 1. The Portable Record format (byte-level)

### 1.1 Design rules (inherited, non-negotiable)

- All identity-bearing hashing is `keccak256` over `abi.encode` of **fixed-width words**; dynamic content is pre-hashed (deterministic-ids §1 discipline). No dag-cbor, no JSON canonicalization, no CESR — SSB's canonicalization grave and KERI's adoption grave are both encoding graves (nostr-ssb §2.5, verifiable-logs §7-avoid-5).
- Every domain constant is spec-owned with a printable versioned preimage. **No chainId, no verifyingContract, no deployment version anywhere in any digest or signing domain** — EAS-offchain's three-axis trap (credentials-attestations §2.2), inverted. Replay across chains is not prevented; it is made **harmless** (deterministic IDs + first-writer registry + idempotent application) and, for archival facts, *desired* (EIP-7702 chainId=0 logic: replayability and portability are the same physical property; safe because records are idempotent facts, never value transfers).
- One signature suite generation at a time, algorithm-tagged for succession (multicodec discipline). No "any algorithm" acceptance (Sign Protocol's mistake).

### 1.2 Record layout

Digest preimage (frozen; the wire encoding below is a transport convenience that MUST round-trip re-derive):

```solidity
bytes32 constant DOMAIN_RECORD = keccak256("efs.record.v1");

recordDigest = keccak256(abi.encode(
    DOMAIN_RECORD,
    author,                 // bytes32 identity I (§2)
    uint256(authorSeq),     // uint64 TID, widened
    prevRecordDigest,       // bytes32; tip of the author's record chain as known to the signer; 0 allowed
    kindTag,                // bytes32 — v2 kind/claim-role constant, plus the new kinds in §1.5
    keccak256(payload),     // payload = ABI-encoded v2 schema fields for this kind (deterministic-ids §3)
    uint256(expiry)         // uint64 unix-seconds; 0 = none; MUST be 0 for object kinds
));
```

Wire encoding (big-endian, length-prefixed):

```
offset size  field
0      2     formatVersion = 0x0001
2      32    author
34     8     authorSeq        // TID: 48-bit unix-ms | 16-bit per-device sub-sequence
42     32    prevRecordDigest
74     32    kindTag
106    8     expiry
114    4     payloadLen
118    N     payload          // ABI-encoded per-kind fields (the v2 schema field strings)
118+N  ...   envelope (§1.3)
```

Field semantics:

- **`authorSeq` is a logical clock, NOT a nonce.** TID layout (ATProto's proven shape): 48-bit ms timestamp since the EFS epoch (2026-01-01T00:00:00Z) ‖ 16-bit per-device counter. It orders one author's statements across chains and devices without coordination. The kernel **never** requires gaplessness or strict monotonicity at ingestion — sequential nonces serialize multi-device authors and are the wrong idempotency tool (coupling-audit §3.7, avoid-2). Backdating is bounded, not prevented: readers clamp a record's effective time to `min(authorSeq.time, earliest anchor/inclusion time)`; a seq far in the future of its earliest anchor is display-flagged. Two *different* records signed at the *same* `(author, authorSeq)` = **equivocation evidence** (§6.3), which the 16-bit device counter makes ~impossible to hit honestly.
- **`prevRecordDigest`** is evidence, not a validity precondition (the anti-SSB rule: never couple authenticity to an ordering you don't need — nostr-ssb lesson 10; fork detection without recovery killed SSB, lesson 11). On-chain, order comes from the chain. Off-chain, the prev-chain gives Blocklace-grade duplicity evidence and cheap sync. A wrong or stale `prev` never invalidates a record.
- **`expiry`** exists for claims that want revocation-by-expiry (the CA industry's 47-day verdict, verifiable-logs §2.7). Reads exclude expired-by-default, history opt-in (consistent with ADR-0051). Object kinds (ANCHOR/DATA/PROPERTY/LIST) reject nonzero expiry — objects are permanent.
- **`payload`** is exactly the v2 schema encoding from deterministic-ids §3. Architecture D changes the envelope and the substrate, **not the data model**. Object IDs (`anchorId`, `dataId`, `propertyId`, `listId`, `slotId`) derive from payload fields precisely as specced; `attester` words in derivations become the record's `author`.

### 1.3 Signature envelope

```
algTag   bytes32   // keccak256("efs.sig.secp256k1.v1") | keccak256("efs.sig.p256.v1") | future PQ tags
signer   bytes     // empty for secp256k1 (recovered); 64-byte uncompressed pubkey for p256; PQ keys later
mode     uint8     // 0 = direct, 1 = batch-merkle
sig      bytes     // 65B (r,s,v) secp256k1; 64B (r,s) p256, low-S enforced, both curves
[batchRoot bytes32, merklePath bytes32[]]   // mode 1 only
```

Signed digest:

- mode 0: `keccak256(abi.encode(DOMAIN_SIGN, recordDigest))`, `DOMAIN_SIGN = keccak256("efs.sign.record.v1")`
- mode 1: `keccak256(abi.encode(DOMAIN_SIGN_BATCH, batchRoot))` where `batchRoot` is the root of a duplicate-resistant Merkle tree over the batch's `recordDigest`s. **One wallet interaction signs an entire file DAG**; each record stays individually portable by carrying `(batchRoot, path)` — ~32×log₂(n) extra bytes. This is EAS delegation's shape with its two mistakes (per-record signatures, sequential nonces) removed (coupling-audit copy-4).

Wallet presentation: an EIP-712 typed-data rendering with domain `{name:"EFS", version:"1"}` — **no chainId, no verifyingContract** (Farcaster proves chain-unbound EIP-712 domains work in production; farcaster §3). The typed-data hash formula is frozen in the Codex alongside the raw form; both produce the same signed digest. Clear-signing metadata (ERC-7730) renders "write /notes.md, 3 properties, place under /home/alice" from the records themselves — deterministic IDs make batches decodable (holistic §3.1).

**Doctrine, stated once: ERC-1271 signatures are never valid inside a record envelope.** An ERC-1271 result is a query against mutable chain state at a block height, not an artifact (identity-crux §2); it dies with the chain and is being made *deliberately less* portable by the ecosystem's own anti-replay work (ERC-7739). Smart accounts participate as *controllers whose certified device keys sign* (§2), and optionally as live-path submitters. This single rule is what makes every record verifiable in 2126 with `ecrecover` + hashes.

### 1.4 Statements vs things, restated for D

- **Objects** (ANCHOR, DATA, PROPERTY, LIST): identified by deterministic v2 IDs, non-revocable, no expiry. The record that mints one is a statement *about* the object's first registration; the object's identity never depends on any record digest.
- **Claims** (MIRROR, PIN, TAG, LIST_ENTRY, REDIRECT): identified by `recordDigest` — which is now **chain-free**. This quietly fixes v2's weakest portability link: in v2, the revocation handle was an EAS UID (per-chain, dies with the chain); in D, the claim handle and therefore the *retraction target* replicate with the data (§5.1).
- Slot metadata binds to `slotId` (unchanged from deterministic-ids §1).

### 1.5 New record kinds (additive to the nine v2 schemas)

| kindTag | payload | role |
|---|---|---|
| `KIND_ID_INCEPT` | `(keySet[], nextKeysDigest, recoveryKeys[], homeChainRef, boundAccountSalt?)` | identity genesis (§2.1) |
| `KIND_ID_ADDKEY` / `KIND_ID_REMOVEKEY` | `(algTag, keyDigest, role)` | device/session key certification |
| `KIND_ID_ROTATE` | `(newKeySet[], newNextKeysDigest)` | pre-rotation reveal (recovery) |
| `KIND_ID_HOME` | `(newHomeChainRef)` | home-registry migration |
| `KIND_RETRACT` | `(targetRecordDigest)` | revocation of the author's own claim (§5.1) |
| `KIND_HEAD` | `(headSeq, claimSetRoot, logTipDigest, prevHeadDigest)` | signed completeness commitment (§4.2) |
| `KIND_DISAVOW` | `(fromAnchorRef, toAnchorRef, reason)` | lens-scoped disavowal of a compromised window — never protocol deletion (anti-Farcaster; identity-crux §3.3) |

Identity events are ordinary records — **the identity layer is self-hosted on the same substrate it authenticates** (Codex-at-genesis instinct applied to key logs; credentials-attestations copy-7).

---

## 2. Identity: self-certifying log, home-registry ordered, B′-shelled

### 2.1 The identity

```
I = keccak256(abi.encode(DOMAIN_IDENTITY, keccak256(inceptionPayload)))    // log identity
I = bytes32(uint160(eoaAddress))                                            // degenerate EOA identity
```

- Full-width, domain-separated (did:plc's conceded 24-char-truncation regret, inverted — atproto avoid-8).
- The **degenerate EOA case is first-class**: an EOA identity has an implicit one-key log (the address's key, valid forever, no rotation). Air-gapped cold-key publishers stay first-class (holistic §5 persona); the address-shaped bytes32 subspace (96 leading zero bits) cleanly separates the two forms, same grinding argument as deterministic-ids §1.
- Inception payload: initial signing keys (algorithm-tagged digests), a **pre-rotation commitment** (`nextKeysDigest` — digest of the *next* key set, unexposed; KERI's PQ-shielded recovery for free), an ordered recovery-key list (PLC's ranked-authority pattern), an advisory `homeChainRef`, and optionally the CREATE3 salt binding a B′ account so `I ↔ B′ address` is bidirectionally provable. This preserves the one-address UX doctrine: the app shows the B′ address; the record layer carries I.

### 2.2 The key-event registry (per-chain kernel module; the home chain is the ordering authority)

A kernel module stores, per identity, the hash-chained event log: `incept / addKey / removeKey / rotate / home`, each event an ingested record signed by keys valid under the **previous** state, each chaining by prev-digest, held as state (state-walk reconstructible, EIP-4444-proof) and emitted as full-payload events.

- **Key validity is `[addPosition, removePosition)` by home-chain order, monotone forever.** A record verified in-window stays valid even if the key is later removed. This is the single most important divergence from Farcaster, whose "never been removed" rule makes validity non-monotone and lets routine key hygiene (or a compromised custody key) erase a lifetime of authorship (identity-crux §3.3 — the trap). Compromise handling = forward `removeKey` + optional `KIND_DISAVOW` claim over the compromised window, adjudicated per-lens, WHITEOUT-style.
- **The chain is the witness pool.** Everything KERI buys with witnesses/KAWA/watchers — receipts, first-seen, duplicity impossibility — the home chain's consensus provides natively: per-chain self-forking of a log is impossible (the contract enforces one chain of events per I). Cross-chain duplicity (conflicting logs on two chains) is provable forever and resolves by home-chain designation while the home chain lives, and by **earliest-anchor-wins** after it dies (Ceramic's one good idea, consensus-existence copy-3).
- **The log is exportable as a self-contained bundle** (PLC's `/export` discipline): events + inclusion receipts (Merkle proof of each event's transaction/state against block headers). Ingesting kernels on other chains accept identity records permissionlessly; they hold a *replica* of the log and defer ordering authority to carried home-chain receipts. `KIND_ID_HOME` moves the ordering authority — the Farcaster fid survived Goerli→OP Mainnet; this is that migration as a first-class protocol event.

### 2.3 Who signs what (custody model)

| Key | Where it lives | Signs |
|---|---|---|
| Device/session keys (secp256k1 or passkey P-256) | hot, per app/device, certified via `addKey` | records — the everyday write path; zero popups after certification |
| Root/recovery keys | cold (or the B′ account's owner set) | identity events only |
| Pre-rotated next keys | **unexposed** (digests only) | the recovery rotation, once |
| B′ smart account | on chain(s) | nothing in records; submits transactions, pays gas, hosts session policy; may be a certified *controller* whose owner keys double as identity root keys |

Passkeys are signers under the log, never the identity (vendor-locked, non-extractable, loss presumes a rotation layer — identity-crux §4). ~100% of mainstream users will delegate custody (atproto: 0.2% self-custody) — so recovery keys default into the B′ account's social-recovery machinery, with a **pre-provisionable personal escape key at higher priority** for the minority who want adversarial exit (Buchanan's adversarial-migration lesson: escape works only if pre-provisioned).

### 2.4 Verification procedures (the exam questions, answered exactly)

**Year 0 — kernel, at ingestion (on-chain):**
1. Parse record; recompute `recordDigest`; recompute object/slot IDs from payload per Codex.
2. Verify envelope: `ecrecover` (~3k gas) or `P256VERIFY` (0x100 precompile, 6.9k gas) → key K.
3. One SLOAD-class registry read: K active for `author` at current position (or record carries an in-window inclusion receipt if K was since removed).
4. Set `attester = author`. msg.sender is not consulted for authorship. Apply v2 validation semantics; write registry/indices.
Overhead vs v2: **+65–96 bytes calldata and ~3–10k gas per record** (identity-crux §6-C).

**Year 0 — client (off-chain read):** identical checks against RPC state; SDK does them by default. The verified path must be the lazy path — Jetstream proved developers strip verification the moment it costs anything (atproto avoid-2).

**Year 100 — origin chain dead; verifier holds a proof bundle** `{record(s), envelope(s), identity log prefix L, inclusion receipts for the record and for L's events, anchored heads + MST proofs, header chains of the anchoring chain(s), the Codex}`:
1. `I == keccak256(abi.encode(DOMAIN_IDENTITY, keccak256(L.inception)))` — self-certifying root; or the EOA degenerate check.
2. Walk L: each event chains by prev-digest; each event's signature satisfies the preceding key state (thresholds, pre-rotation digests).
3. Place the record: its inclusion receipt (or its membership in an anchored head) orders it between log events eᵢ and eᵢ₊₁ against the carried header chain.
4. K ∈ active set after eᵢ; no `removeKey` for K precedes the record's position.
5. Recompute `recordDigest`, object IDs, content hashes against bytes.
6. **PQ clause:** the record's earliest anchor (or its newest ERS-renewal anchor, §9.3) predates the Codex's retirement epoch for `algTag(K)`. Conclusion: *"authored by I, provably before epoch E, when forgery was infeasible"* — RFC 4998's statement, the one archives have always settled for, and the only honest year-100 claim any signature system can make (identity-crux §1.3).
No RPC, no living infrastructure, no contract execution. Hashes + header chains + ecrecover.

---

## 3. Write path

### 3.1 W1 — full ingestion (the default archival write)

```
SDK: plan → derive all IDs offline → build records (parents-first per deterministic-ids §5)
   → session key signs ONE batch root (mode-1 envelope)
   → submit kernel.ingest(records[], envelope) — by the user's B′, a relayer, a paymaster, anyone
Kernel: for each record in order — verify (§2.4) → validate (ported v2 resolver semantics)
   → registry first-writer-wins → indices → full-payload events
Atomic: any failure reverts the batch (kernel-owned loop — simpler and stronger than the EAS
   multiAttest behavioral pin, which dies here along with its bytecode-hash conformance suite)
```

- **Duplicate policy change (the §6/§9 knot, cut):** shared kinds stay idempotent no-op (unchanged). Owned kinds (DATA/LIST) flip from REVERT to **idempotent no-op** — because the signature authenticates the claimed author, a duplicate `(author, salt)` submitted by a third-party carrier is now a *verifiable replay*, not a possible squat. This is replication model C **with the authentication hole closed**: anyone may re-instantiate a dead publisher's owned objects on any chain by carrying the signed records; the kernel verifies rather than trusts. Model A's honest limit ("a dead attester's dataId can never be instantiated on a new chain") — the limit that lands hardest on the archive/institution personas — is gone. Front-run "griefing" becomes a gift: the front-runner pays your gas and the state is identical.
- Ingestion of foreign-origin records (replication) is the **same entrypoint**. A carrier ships identity-log records (ordered first) + data records + receipts in one batch. Nothing distinguishes "replication" from "writing" — that is the point.

### 3.2 W2 — anchored heads (the off-chain mass lane)

For Class-2 economics (comments, social, high-volume dapp records — the ≤$0.001 write class the apps report says decides whether EFS hosts those apps at all):

1. Author accumulates signed records off-chain (relays, app servers, local).
2. Periodically (or on demand) signs a `KIND_HEAD`: `claimSetRoot` = root of a deterministic MST over the author's **entire active claim-set** (key = slotId for slotted claims / recordDigest for multi-valued; value = recordDigest). Signing the *state root, not just records*, converts the non-monotone completeness question into a monotone one — the single most copyable trick in the whole survey (consensus-existence copy-1, ATProto).
3. The head is anchored into the kernel's **anchor accumulator**: `anchor(bytes32 root)` — permissionless, batchable by anyone OpenTimestamps-style (Merkle root over many heads; proofs verify with the batcher dead — anti-Ceramic), stored in **contract state** (append-only array + event; never logs-only — EIP-4444, Ceramic A3).
4. **Availability travels with commitment** (CT's law): the claim-set artifact (records + MST nodes) is itself published as EFS data — a DATA + mirrors + contentHash claim, eligible for third-party hash-verified repair. A head whose artifact was never mirrored is a 32-byte tombstone, and the SDK refuses to call such a write "archived" (durability-class honesty, holistic §2.10).

What W2 buys, precisely: existence-by-T; per-author completeness with **provable absence** (non-inclusion proof against the latest anchored head = "not placed / revoked as of head N"); equivocation fork-choice (earliest-anchored head wins at equal headSeq); bounded-staleness revocation (§5.1). What it does not buy: freshness (a withheld newer head is indistinguishable from silence — irreducible, surfaced as head-age in UIs), contract readability, shared-index membership.

**Promotion** is first-class: any W2 record can later be individually ingested (W1) by anyone holding it — e.g., when a comment thread becomes canon-worthy, or when a contract needs to read one claim. The record's identity, author, and seq don't change; it simply gains a chain's registration.

### 3.3 W3 — naked records

Exist by construction (any signed record is one). Doctrine: clients MUST label W3-only content as unregistered/uncurrent; it is Nostr, and Nostr's measured pathologies (per-observer currency, silent supersession, storage-as-courtesy) are the documented reason the label exists.

---

## 4. Read path, lens resolution, and what "current" means

### 4.1 Per-chain reads (unchanged surface, new floor)

Router/views/web3:// work as in v2: path → registry point lookup on client-computed anchorId → lens-scoped active PIN → same-attester mirrors/properties → bytes verified against contentHash. Contracts read `getObject(id)`, active-edge slots, chunk stores — the same O(1), point-lookup-shaped surface (never traversal — Story's precompile is the counterexample budget; onchain-composability avoid).

### 4.2 "Current," defined in three grades (say which one you mean, always)

- **G0 — chain-local (authoritative while the chain lives):** latest unrevoked, unexpired claim per `(author, slot)` in chain order, exactly v2. The chain answers completeness (state is total) and equivocation (an account cannot fork its own history) for free.
- **G1 — cross-chain, per-author:** for an author replicated on several trusted chains, current = the slot-claim with the highest `authorSeq` among trusted-chain registrations; tie or conflict at equal seq → earliest anchor wins; provable equivocation → **multi-value surface** (never silent LWW across forks or chains — crdt §6.5) + evidence retention (§6.3). The trusted-chain list is a Sigsum-style immutable named policy document, published on EFS, chosen per-lens (verifiable-logs copy-4).
- **G2 — archival/off-chain:** per-author anchored heads; current = fold of trusted attesters' latest anchored heads; absence = non-inclusion proof; staleness = anchor age, surfaced.

**The lens-amplifier conformance rule (normative, from consensus-existence §4):** first-attester-wins is anti-monotone in missing data — a missing higher-priority claim silently falls through to a lower-priority attester, a wrong answer with no error. Therefore any G1/G2 resolver MUST distinguish *"attester A has no claim here (non-inclusion proven against A's head)"* from *"I don't know A's state"* and MUST NOT fall through on unknown. G0 readers are exempt (state is total). This rule is what makes lens resolution safe to run over replicas at all.

### 4.3 Lens resolution

Unchanged in semantics: ordered trusted-author list, first-author-wins, per-author state composed read-time; `system` tail additive-only. Two D-specific notes: (1) lenses key on **I** (recovered author), rendered as the bound B′ address — the attester-is-the-user doctrine survives because the author *is* the user, independent of submitter; (2) named lenses (lens-as-LIST) and label/curation claims are themselves records, so **the moderation layer replicates with the data** — Warpcast's centralized-classifier monoculture is structurally avoided, and its 82–91%-of-paying-accounts-spam-labeled result is the standing proof that lens curation, not write pricing, is the content-quality mechanism (spam-economics §2.4).

### 4.4 Proof bundles (the archival read deliverable)

The SDK emits Sigsum-shaped self-contained bundles: `{bytes, records, envelopes, log prefixes, MST proofs, anchored heads, inclusion receipts, header-chain segments, Codex reference}` — verification fully offline, no RPC, no phone-home (No-Phone-Home is a verification-path law here, not a campaign; credentials-attestations avoid-2). This is what a 2126 reader actually holds.

---

## 5. The five hard parts — engineered answers

### 5.1 (a) Revocation / mutability

Three distinct operations, each with a mechanism (never conflated):

1. **Claim retraction** — `KIND_RETRACT(targetRecordDigest)`, author-only, monotone (no un-retract; NIP-09's one correct instinct). Because the handle is chain-free, **the retraction replicates with the claim**: ingest both on chain X and chain X's kernel state says revoked — v2's "revocation is per-chain EAS state, frozen in replicas" hole is closed. While any chain holds the pair, "is it revoked" is an SLOAD. In G2, retraction is *absence in the next anchored head* + optionally the retraction record itself; a reader with head N has bounded-staleness finality: "active as of head N, anchored at T" — with provable absence, which no advisory-deletion system has (Nostr's precise defect was no completeness commitment, not no consensus; consensus-existence §2.6).
2. **Expiry** — claims may carry `expiry`; liveness-critical claim classes (service endpoints, hot moderation) re-attest on a cadence instead of trusting revocation propagation (CA 47-day lesson).
3. **Real deletion of private data = key destruction.** Default-encrypted private content (photos persona); delete = destroy content key + retract mirrors. The only GDPR-compatible and only honest story; public bytes are permanent and the docs say so (no advisory-deletion theater — apps-requirements R3/R4).

What is *not* promised, ever: un-signing, network-wide erasure of public bytes, or instant global revocation without a live consensus substrate. The achievable target — "any reader holding a reasonably fresh replica/head sees the retraction, and can prove whether they are fresh" — is stated as the spec's guarantee.

### 5.2 (b) Spam / sybil

Decompose gas's four bundled functions (spam-economics §1) and re-provide each where it lives:

- **Shared-registry admission (the real pollution surface):** priced **per record** by W1 gas — and if registration is ever batched, per-op, never per-anchor (Sidetree's lesson; an anchor prices *canonicity of one head*, not admission of its million leaves — conflating these is how "free records, costly anchors" designs rot). Index shape does the heavy lifting price can't: per-attester indices primary, global enumeration demoted to labeled-untrusted discovery (holistic §2.8) — because the inscriptions episode proves cheap-gas chains stop pricing anything the moment speculative EV appears.
- **W2/W3 volume:** free, and deliberately outside every shared surface. Spam nobody's lens trusts is never indexed, never replicated, never fetched — SSB's structural result (replication follows trust) applied at the archive layer: **blessed LOCKSS form = lens-scoped attester sets**, not firehoses.
- **Content quality:** lenses, period. Forty years of email (authenticated sender + receiver-side reputation) and Farcaster's paid-spam experiment both point the same way; gas is a rate limiter, never the defense.
- **Relayer/paymaster edges (the gasless corollary's bill):** Bluesky-style per-identity point budgets, deposits, allowlists — at plural, redeployable, refusable services, never Etched (no tunable economics in immutable contracts). Self-submission with gas is the permanent censorship-resistance floor under every relayer policy.
- **Identity admission:** a log identity is free to *create* but useless until certified into lenses; sybils cost their creator everything and the network ~nothing. Relayers may additionally rent scarcity from external namespaces (funded account age, DNS, stake — Sigsum's borrowed-scarcity pattern) without any of it entering protocol.
- **Verification-DoS ordering (SDK-normative):** lens-membership check → signature check → byte fetch. Cheapest first.

### 5.3 (c) Consensus on existence / currency across replicated buckets

Split the question (consensus-existence §0) and answer each grade honestly:

- **Existence** is monotone: set-union across kernels and archives; any honest holder suffices; anchors add "existed by T." There is **no global enumeration of EFS** — "everything that exists" is per-chain-total + anchored-set-partial, and discovery is lens-mediated by design. (Nobody has global enumeration; systems that pretended otherwise shipped trusted indexers.)
- **Ordering** is per-author (`authorSeq` + prev-chain + chain receipts). EFS read semantics consume **zero cross-author ordering** (the audited collapse); the one residue — LIST `maxEntries` admission — is declared **chain-local semantics** (a replicated list's fullness is per-chain, like firstRecord bookkeeping), resolving the flag before freeze.
- **Completeness/absence** — the irreducible one: G0 chain state, or G2 signed heads + non-inclusion proofs. This is precisely what naked-signature systems lack and why they fail as systems of record.
- **Equivocation:** impossible per-chain; cross-chain it is *detectable and provable* (same seq / conflicting records, or forked logs), adjudicated earliest-anchor-wins, punished at the lens layer (trust destruction), with mandatory evidence preservation (§6.3).
- **Replica convergence, mechanically:** kernels never talk to each other. Convergence = carriers re-submitting records (anyone, any time, any order — idempotent). Two kernels that have ingested the same record set have **identical per-author state** (per-author fold is order-independent given seq; cross-author independence is by design — the BFT-CRDT recipe, which explicitly punts exactly sybil+liveness to gas+lenses, which D provides). Differing sets differ only in *presence*, never in *meaning of names* — deterministic IDs guarantee all replicas agree what every id denotes even while disagreeing on what exists.
- **Cheap hardening, day one:** each kernel emits a periodic registry-root checkpoint attested onto ≥1 other chain (one tx/epoch) — every other chain becomes an O(1) witness of this chain's history (CT witness economics), making post-mortem state-walk snapshots verifiable.

### 5.4 (d) On-chain composability

- The demand is real but narrow and shaped: same-chain, synchronous, point-lookup, typed-fact or byte-tier reads — 2 of 10 apps hard-require it (NFT/on-chain renderers; dapp typed records), zero apps need traversal or cross-chain reads (onchain-composability §4).
- D's answer: **W1 ingestion materializes exactly the v2 read surface per chain** — `getObject`, active-edge slots, SSTORE2 chunk stores — at native SLOAD cost. Composability-needing data chooses W1; the choosing is per-record, not per-system.
- **Cross-chain composability = replication, never proofs.** A contract on chain X reads EFS state by someone having ingested the records on chain X (~5k gas, synchronous, fork-robust) — not via storage proofs/coprocessors (asynchronous, $1–50/query, hard-fork-fragile, flagship vendor already dead: Axiom; and ENS just *reversed out of* its own L2 back to L1 native state). Deterministic IDs are what make replication substitute for proofs.
- W2 data is contract-invisible until promoted. That is a stated cost, not a bug: anchors cannot be verified synchronously at tolerable gas, and pretending otherwise re-imports the coprocessor dependency.

### 5.5 (e) Identity durability vs signature portability

Resolved by splitting the jobs (identity-crux verdict): **authorization** (live, chain-scoped, replay-hostile — B′/4337/1271, untouched, doing what it's good at) vs **authorship** (eternal, chain-free, replay-desired — raw-key signatures + the key-event log). The log gives rotation, recovery, multi-device, passkeys-as-signers, org custody (Safes as controllers), and PQ agility (pre-rotation digests are hash-shielded; algorithm tags make PQ keys additive); the raw signatures give ecrecover-forever portability; the home-chain registry gives the ordering/anti-equivocation service that every prior attempt either centralized (PLC directory), under-built (KERI watchers, DeepKey's 8 unstable years), or wired to retroactive-invalidation (Farcaster). The org-publisher personas — DAO, registry, archive: the deepest pockets and hardest portability requirements, and exactly the ERC-1271 casualties — get durable portable authorship for the first time.

Residual honesty: rotation events not yet anchored are retroactively ambiguous if contested (3ID's grave — mitigated by anchoring cadence and by the rule that verifiers order records against *anchored* log positions); a dead home chain freezes rotation authority at its last exported state until a `KIND_ID_HOME` successor recorded before death, or earliest-anchor adjudication after it.

---

## 6. Cross-chain replication protocol (what a carrier actually does)

1. **Export bundle** from origin (or from archives): identity-log records + receipts; object/claim records; retractions; heads; claim-set artifacts.
2. **Submit to target kernel** via ordinary `ingest()`: identity events first (kernel replays the log, deferring order to carried home-chain receipts), then objects parents-first, then claims, then retractions (or interleaved — idempotence makes order within an author forgiving; parents-first still required for object dependencies).
3. **Provenance:** replica records carry no new authorship (the signature is the original author's — this *is* the point); recording-time on the target chain is explicitly not event-time (Datomic's uni-temporal lesson); original publication time = earliest surviving anchor/receipt, carried as a lens-scoped provenance claim. "Which clock does a 100-year citation trust" = the earliest surviving anchor.
4. **Duplicity handling:** if the target kernel sees two valid records at one `(author, authorSeq)` slot-claim, it stores both, flags the pair in an evidence index, and surfaces multi-value to readers (KERI's first-seen + evidence preservation, which EFS previously lacked a doctrine for — indexers MUST retain losing variants as evidence, never merely drop them).
5. **Economics:** the carrier pays target-chain gas. Nothing compels replication; LOCKSS is opt-in per lens/archive ("archive what your lens trusts"). Volunteer altruism is assumed *nowhere* (95% of free Nostr relays underwater; NFT.Storage dead; CAS dead): replication is priced work someone chooses to fund, and the design's job is only to make it *possible, verifiable, and cheap to verify* — which deterministic IDs + signatures + hash-checks deliver.

---

## 7. Adoption / DX story

**Dapp developer.** `efs.write(file)` → SDK derives IDs offline, builds records, session key signs one batch, relayer submits; the dev never sees a chain unless they want one. Reads: `efs.read(path, lens)` verified by default; contracts integrate against `getObject`/slot reads with a shipped reference gating contract (Coinbase-Verifications-shaped). The W1/W2 choice is one option flag (`durability: "registered" | "anchored"`), with honest cost/latency labels. Subscriptions: bare log filters on deterministic topics from a static page. No indexer trust anywhere in the trust path.

**End user.** Onboards to a B′ account (passkey, email-style recovery); a session key is certified once (one popup, rendered clear-signed); thereafter publishing is zero-popup and gasless through relayer budgets; heavy publishers self-submit with gas. "Your files outlive every app and chain in this stack, and here is the bundle that proves it" is a *product feature* (credible exit as a testable property — publish the adversarial-exit runbook on day one, which atproto never did).

**Ecosystem cost, honest:** EFS leaves the EAS umbrella (schema explorers, attestation-ecosystem legibility, shared neutrality optics — coupling-audit §3.8) and must carry its own audited kernel. A bespoke Etched kernel with no battle-testing is the single largest new risk in this architecture; ADR-0048's burn discipline plus external audit is the mitigation, not an answer.

---

## 8. Gas / cost sketch (orders of magnitude, mid-2026 prices)

| Operation | Gas | $ on L2 | $ on L1 (1 gwei) |
|---|---|---|---|
| W1 small-file DAG (~7–8 records, incl. envelope verify) | ~9–10.5M (v2's 9–10M + ~1–2% envelope overhead; partially offset by dropping EAS's ~40–50k/record substrate rent — coupling-audit §3.5) | ~$0.10–0.50 | ~$30 |
| Identity inception (W1) | ~120–180k | <$0.01 | ~$0.50 |
| addKey / removeKey / rotate | ~60–120k | <$0.01 | ~$0.25 |
| `anchor(root)` (one head, direct) | ~50k | ~$0.001 | ~$0.15 |
| Batched anchor (10⁴ heads/root) | ~5 gas amortized | ~0 | ~0 |
| W2 record marginal cost | ~0 chain-side + storage of claim-set artifact (one small EFS file per epoch) | ~$0.001-class | — |
| Contract point read | ~5–10k | — | — |
| Cross-chain replication | full W1 gas on target, paid by carrier | — | — |

The Class-2 apps (comments/social/reviews, ceiling ~$0.0014/message per Farcaster's revealed pricing) live on W2 + relayers; Class-1 (owner-writes) and Class-3-identity live on W1; bulk bytes stay off consensus under contentHash (two-plane economics, unchanged).

---

## 9. Migration from today's prototype, and the 100-year failure order

### 9.1 Migration (rides the v2 ceremony or waits for a fork-level event — no third option)

The transition plan's one-freeze pledge makes EAS-vs-native undecidable *after* v2 (coupling-audit avoid-5). D therefore restructures the same freeze bundle:

- **Phase 0 (design):** this document's Phase-0 decisions — envelope + replay domain spec (the hard 20%, external review mandatory as a standalone artifact), identity form (I-as-digest with B′ binding), owned-kind idempotence, kind additions, MST layout, anchor accumulator. The §6/§9 coupled question in deterministic-ids resolves: **idempotent owned kinds + signature-verified model C.**
- **Phase 1 (convention rehearsal, on the current EAS prototype, devnet):** envelope-as-payload-convention — records carried inside EAS attestations, SDK signs/verifies client-side, no contract changes. De-risks the format against real flows before anything freezes.
- **Phase 2 (the freeze):** native kernel replaces EAS's five load-bearing mechanisms (entrypoint, batch atomicity, revocation, no-bypass hooks, record store). ~500–900 new kernel LoC; ~2,900 LoC of resolver validation ports as internal modules (10–20% line churn); ~25 `getAttestation` joins re-key. Devnet has no real data — this is a redesign, not a data migration. EAS demotes to an optional foreign universe the views may browse (ADR-0032 superseded; ADR-0033 foreign-EAS browsing becomes view-layer-optional).
- **Phase 3 (additive, post-freeze):** anchor accumulator + W2 lane + proof-bundle tooling — additive contracts and conventions, but their **hash/serialization formats are reserved in the Codex at freeze** (WHITEOUT-pattern reservation), because heads written under an unspecified MST layout are unmigratable.
- **Schedule honesty:** vs plain v2 this adds ~2–4 weeks of build and a disproportionate verification increment — the auth/store/revoke core moves inside EFS's audit scope, and the envelope spec needs independent external review. The verification infrastructure, not the diff, drives the schedule (same law as v2 itself).

### 9.2 What of v2 survives / changes / dies

**Survives wholesale:** the entire deterministic-ID Codex (domains, kind tags, derivations, canonical names, golden vectors, registry, kind-attachment matrix, virtual anchors, blinded/salted anchors), events discipline, state-walk doctrine, lenses/first-attester-wins, no-move/REDIRECT doctrine, two-plane storage, all §2 conventions. **Changes:** attester sourcing (recovered author, msg.sender demoted to submitter); claim/revocation handles (EAS UID → recordDigest); owned-kind duplicate policy (REVERT → idempotent); refUID policy (moot); LIST caps declared chain-local; SCC cycle tie-break re-keyed on chain-free ids (was UID — the flagged pre-freeze fix). **Dies:** the EAS behavioral pin + bytecode-hash conformance machinery, EIP-1271 delegation rails, per-chain schemaUID→kindTag maps (kindTags become the type system directly), the ~25% EAS record-storage rent, ADR-0032.

### 9.3 What breaks first at 100 years (ranked, with the countermeasure that must already be running)

1. **W2 claim-set availability** (decade-scale): heads whose artifacts lost their mirrors become tombstones. Countermeasure: SDK refuses "archived" status without a mirrored artifact + contentHash; lens-scoped archival replication as the blessed LOCKSS form; hash-verified third-party repair.
2. **Interpretive institutions** (decade-scale): trust-root stewardship, default-lens governance, Codex succession — Ceramic's anchors outlived Ceramic's *meaning*. Countermeasure: Codex self-hosted at genesis; named successors; fork doctrine and trusted-chain policy as immutable named documents on EFS; every authority's death documented.
3. **ECDSA/P-256 post-CRQC** (2030s, per NIST/GRI): verification evidentiary value collapses for un-anchored signatures. Countermeasure: the epoch table + ERS-style re-anchoring convention (replicating anchors onto younger/PQ chains IS timestamp renewal) must be *operating before* the epoch, not designed after; pre-rotation digests already PQ-shield recovery; PQ keys enter as ordinary algorithm-tagged log events.
4. **Header-chain custody of dead chains** (multi-decade): year-100 verification needs dead chains' header chains. Countermeasure: header archives are EFS-hosted artifacts (self-hosting again) with cross-chain checkpoint receipts (§5.3) making them mutually witnessing.
5. **Chain mortality economics** (continuous): L2s die on ~5-year horizons; replication + `KIND_ID_HOME` migration is the designed response; the L1 root-of-trust assumption is the last one standing and is named as such.
6. **EVM semantic drift** (extcodecopy/precompile changes) degrading the on-chain byte tier — tracked, mitigable by re-mirroring; identity/claim layers are unaffected (pure state + hashes).

---

## 10. Where portability genuinely stops (the honest fence)

1. **Freshness.** No artifact proves an author hasn't spoken since. Bounded staleness (anchor age) is the ceiling; a silent author and a withheld head are indistinguishable forever.
2. **Global currency.** After the origin chain dies, "current" degrades from G0 to per-author G1/G2. There is no global cross-author currency without a live consensus substrate, and D does not pretend otherwise.
3. **Composability.** Contract-readable state is chain-local, always. An on-chain-renderer NFT integration dies with its chain unless re-ingested *and* re-wired by a living integrator.
4. **Chain-local semantics residue:** LIST capacity admission, first-writer bookkeeping, same-block race outcomes — reproducible in meaning, not in outcome, across chains.
5. **Un-anchored tail:** W3 records and not-yet-anchored W2 records have authenticity but Nostr-grade everything else; a crash before anchoring loses currency evidence (never authenticity).
6. **The verification floor:** year-100 verification requires the Codex and at least one surviving anchoring chain's header chain. If *every* chain's headers vanish and the Codex is lost, records degrade to "internally consistent signed bytes" — no timestamps, no key-validity windows. Portability stops at "someone, somewhere, kept the 100KB of headers and the spec."
7. **Identity edge:** contested rotations in never-anchored windows; home-chain death between rotation and export. Anchoring cadence bounds, does not eliminate.
8. **People:** key succession/inheritance (the 2126-grandkids problem) is a convention + custody problem D structures (recovery keys, controllers) but cannot solve cryptographically.

---

## 11. Decision rule

**Architecture D is the right choice iff ALL of:**

1. **Both planes are load-bearing:** the mission requires contract composability (2 hard app categories + the typed-claim gating pattern) *and* sub-cent stranger-writes (3 app categories) *and* 100-year post-chain verifiability (the 3 institutional personas). Any single-plane architecture sacrifices one: pure-chain (v2-as-is) loses Class-2 economics and dead-chain authenticity; pure-portable (Nostr/AT-shaped) loses revocation-as-state, spam pricing, and composability. If James is willing to cut Class-2 apps *and* accept per-chain-mortal authenticity, plain v2 is simpler and should win.
2. **Third-party/dead-author replication is a real requirement**, not a vibe — i.e., the archive/registry/DAO personas are in scope. They are the only consumers of the identity log + model-C machinery; a living-EOA-only world makes model A on plain v2 sufficient and D's identity layer pure overhead.
3. **The v2 window can absorb it:** the freeze ceremony stretches to include a bespoke audited kernel + externally-reviewed envelope spec (~+2–4 weeks build, disproportionate verification). If the window can't stretch, D is not available later without breaking the one-freeze pledge — then ship v2 and accept that D becomes a fork-level event.
4. **Bounded-staleness currency is acceptable to the mission** for the post-chain regime (it is the best any system surveyed achieves; if instant-global-revocation-forever is a hard requirement, nothing in this design space satisfies it and the mission statement needs the edit, not the architecture).

**Kill criteria (red team: aim here):** (i) the envelope/replay-domain spec fails external review or demands >1 more freeze-window month — fall back to v2 + Phase-1 convention; (ii) session-key custody proves un-shippable UX (users can't be kept from pasting root keys into dapps) — the authorship layer degrades to EOA-degenerate + B′ msg.sender writes, i.e., v2; (iii) measured envelope overhead >5% of write gas or clear-signing tooling can't render batches — reassess W1 default-on.

---

## 12. Pre-emptive self-indictment (for the red team)

1. **The kernel is unaudited bespoke Etched code replacing a battle-tested substrate.** ~3,400–3,800 LoC of frozen surface with EFS solely responsible for auth/store/revoke correctness. This is the biggest single regression vs every EAS-retaining alternative, and no amount of porting-not-rewriting fully discharges it.
2. **Two lanes = two currencies.** W1/W2 legibility is a permanent UX tax; if popular clients blur registered vs anchored content (email's HTML lesson), the boundary — and the spam story with it — erodes. The conforming-client rule is doctrine, and doctrine is enforced by nobody.
3. **The identity log is new consensus-adjacent machinery** in exactly the place Holochain (8 years, still `unstable-dpki`), NIP-26/41 (dead/unmerged), and 3ID (retroactive invalidity) failed. D's bet is that a chain-as-witness removes the hard part; the contested-unanchored-window edge (§10.7) is where that bet is thinnest.
4. **Anchoring re-imports Ceramic's shape.** Permissionless batching, state-not-logs, availability-travels-with-commitment, and batcher-free proofs are each specifically anti-Ceramic — but the late-publish/withheld-branch attack is only *bounded* (earliest-anchor + seq clamps), not eliminated, and W2's whole value rests on an artifact-mirroring convention users can skip.
5. **authorSeq is self-asserted time.** Clamped by anchors, flagged in UIs — still gameable inside an epoch. Anyone needing intra-epoch order must use W1.
6. **Nobody has demand-proof for the portable layer.** Ceramic's epitaph — "more verifiable than Postgres, less verifiable than the chain had no durable demand" — is the market's last word on the middle position. D's rebuttal is that its middle is *the same bytes as* the chain position (no separate system to adopt), and that the empty niche (an actual archive) is empty because atproto/Farcaster chose ephemerality, not because permanence lacks demand. That rebuttal is an argument, not evidence.
7. **Solo-founder verification bandwidth** is the true rate limit: this design's schedule risk is not code but the external review + invariant + golden-vector + conformance load, roughly doubling v2's.

---

## 13. Codex additions (frozen-surface delta, for completeness)

New Etched/Codex items beyond deterministic-ids §13: `DOMAIN_RECORD/DOMAIN_SIGN/DOMAIN_SIGN_BATCH/DOMAIN_IDENTITY` preimages; the record wire layout + digest formula + EIP-712 rendering; envelope algTag table + succession rule; identity-event kinds + log validity rules (`[add,remove)` monotone, pre-rotation, recovery priority, home-chain transfer); TID layout + clamping rule; retraction/disavow semantics; MST layout + non-inclusion proof format + head schema (reserved at freeze, additive deploy later); anchor-accumulator state shape; the algorithm-retirement epoch table + ERS renewal convention; the lens-amplifier conformance rule; the G0/G1/G2 currency definitions; duplicity-evidence retention rule; golden vectors for all of the above (records, envelopes, batch trees, log walks, head proofs — target +40 vectors over v2's ~50).

*The Codex remains the first file written at genesis, and now describes the machinery of its own survival.*
