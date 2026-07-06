# Architecture B — Native Signed-Record Kernel ("drop EAS, stay chain-native")

**Architect:** arch-B-native-kernel · **Date:** 2026-07-02
**Inputs:** all 13 substrate research files; `planning/Designs/deterministic-ids.md`, `efs-v2-holistic-redesign.md`, `efs-v2-transition-plan.md`; `contracts/specs/overview.md`.
**Status:** complete architecture for adversarial review. Weaknesses are stated, not softened (§12).

---

## 0. Thesis

Replace EAS with an EFS-owned **kernel contract per chain** whose *only* write path is a canonical **signed envelope**: an author-identified, sequence-numbered, merkle-committed batch of records, signed under a **deliberately chain-free EIP-712 domain**. The kernel recovers the author from the signature — `msg.sender` never appears in the authorship path — so gasless relaying, sponsored writes, and permissionless replication of dead authors' data all fall out of a single mechanism instead of three bolted-on ones.

Everything the v2 design already got right is kept byte-for-byte: deterministic IDs, kind tags, the object/claim split, first-attester-wins lenses, parents-first atomic batches, the registry, the Codex discipline. What changes is *who authenticates, what a write physically is, and what travels*:

1. **A write is a file.** A signed envelope is a self-contained portable artifact — it can be relayed, mailed, archived, and resubmitted to any chain's kernel by anyone, decades later, and it means the same thing everywhere (deterministic IDs) and proves the same authorship everywhere (raw-key signatures, no chainId in the domain).
2. **Revocation becomes portable.** Under EAS, a revocation is chain-local state keyed by a chain-local UID — it structurally cannot travel (research-efs-coupling-audit §3.3, research-credentials §2.2). Under the kernel, a revocation is a signed counter-record in the author's log: it replicates with the data and replays onto any chain. This is the single largest property gain of Architecture B.
3. **Identity becomes a self-certifying key-event log** hosted by the kernel (KERI-shaped, Farcaster-simple; research-identity-crux Architecture C), with bare EOAs as the zero-infrastructure degenerate case and the B′ smart account retained as UX shell and recovery controller.

The bill, stated up front: EFS assumes the audit burden EAS carried (a bespoke Etched kernel with no battle-testing), leaves the EAS ecosystem umbrella, and must land a genuinely novel replay/identity specification inside the one-freeze v2 window. §12 does not soften this.

---

## 1. System map

```
                       ┌──────────────────────────── per chain ────────────────────────────┐
 signed envelope  ──►  │  EFSKernel (Etched)                                                │
 (author, seq, prev,   │   ├── SigGate: ecrecover / P256VERIFY → author word                │
  recordsRoot, sig)    │   ├── IdentityRegistry: key-event logs (incept/add/remove/rotate)  │
 submitted by ANYONE   │   ├── AdmissionLog: (author,seq) first-seen, duplicity events      │
                       │   ├── ObjectRegistry: id → entry (write-once, first-writer)        │
                       │   ├── ClaimStore: claimId → record (+ revokedAtSeq)                │
                       │   ├── Validation modules: ported v2 resolver semantics per kind    │
                       │   ├── Indices: path tree, active slots, per-author indices, lists  │
                       │   └── Events: v2 event set, ID-keyed, full-payload                 │
                       ├────────────────────────────────────────────────────────────────────┤
                       │  Redeployable: EFSRouter (web3://), FileView, ListReader,          │
                       │  SSTORE2 chunk stores (unchanged), relayer/paymaster edges         │
                       └────────────────────────────────────────────────────────────────────┘
 Replication = resubmit the same envelopes to another chain's kernel. No bridges, no proofs.
```

The kernel replaces exactly the five load-bearing EAS mechanisms the coupling audit identified (authenticated entrypoint, batch atomicity, revocation registry, no-bypass hooks, record store) with ~500–900 new LoC; the ~2,900 LoC of v2 resolver validation ports as internal modules with 10–20% line churn (research-efs-coupling-audit §4).

---

## 2. Identity layer

### 2.1 The author word

Every record names its author as one `bytes32` **author word** — the same word that enters `dataId`/`listId`/`slotId` derivations (deterministic-ids §1 already encodes attesters as bytes32; this widens the domain, changes no formula).

Two shapes, distinguishable by construction:

- **Address-shaped** (top 96 bits zero): `bytes32(uint160(addr))`. Two sub-cases:
  - **Bare EOA** — the degenerate identity. No registry entry. Verification: recovered key == address. Zero infrastructure; the cold-key air-gapped publisher persona is first-class on day 0.
  - **Account-bound log (C1)** — the word is the B′ smart-account address; a key-event log is attached to it in the IdentityRegistry. This is the default consumer path and preserves the "user = ONE address" doctrine ([[efs-identity-one-address]]). Inception must be a transaction *from* that account (`msg.sender == account`) — a one-time chain-notarized birth (see §2.3 honesty note). Inherits the same-address squat exception (deterministic-ids §9): CREATE3 discipline required for cross-chain trust of the word itself.
- **Digest-shaped (C2)**: `author = keccak256(abi.encode(DOMAIN_IDENTITY_V1, keccak256(inceptionBody)))` — fully self-certifying, chain-free, no account needed. The archival-pure choice for orgs and institutions. A keccak output collides with the address-shaped subspace only with 2^96 grinding work (same argument as deterministic-ids §1).

One kernel, one code path: the IdentityRegistry maps `authorWord → keyState` regardless of shape; an author word with no registry entry and address shape falls back to the bare-EOA rule.

### 2.2 Key-event log (KERI-shaped, position-scoped, monotone)

```solidity
struct IdentityEvent {
    uint8   evType;      // 0 incept | 1 addKey | 2 removeKey | 3 rotate | 4 bindController | 5 unbindController
    uint64  evSeq;       // per-identity, CONTIGUOUS, kernel-enforced
    bytes32 prevEvent;   // digest of prior event (0x0 for incept)
    bytes   body;        // abi.encode per evType (below)
}
// key record inside bodies:  (bytes32 algoTag, bytes keyMaterial)
//   algoTag ∈ { keccak256("efs.keyalgo.secp256k1.v1"), keccak256("efs.keyalgo.p256.v1"), ... additive }
// incept body: initial key set, threshold (default 1), optional nextKeysDigest (KERI pre-rotation),
//              optional controller address (C1: implicit = the account)
// rotate body: new key set + new nextKeysDigest; must be signed by preimage keys of the
//              previously committed nextKeysDigest (pre-rotation), or by current keys if none committed.
```

Rules (each one is a lesson bought by a named corpse):

- **Key validity is `[addKey position, removeKey position)` by kernel admission order — monotone forever.** A record verified at admission stays valid. Removal never retroactively invalidates history (anti-Farcaster: "never been removed" deletes a lifetime of authorship — research-identity-crux §3.3). Compromise handling is forward removal plus an optional **disavowal claim** over a seq range — lens-scoped, viewer-sovereign, WHITEOUT-analogous, never protocol deletion.
- **Pre-rotation digests** (KERI): the next key set is committed as a hash before it is exposed. Recovery from signing-key theft = rotate using pre-committed keys the thief has never seen; and because only digests are published, the recovery path is quantum-shielded today at zero cost.
- **Identity logs are contiguous and small** (unlike record logs, §3): the kernel enforces `evSeq` strictly sequential and `prevEvent` matching. Replicating an identity to another chain = replaying its events in order (a few hundred bytes each).
- **Exportable audit log** (did:plc discipline): `exportIdentity(author) → IdentityEvent[]` view + full-payload events; the log is a self-contained artifact.

### 2.3 The smart account's honest role — and where portability stops at the identity layer

The B′ account is **controller, never author-of-record**:

- Daily writes: session/device keys registered via `addKey` sign envelopes silently (Farcaster's custody/signer split — the one production-proven answer to rotation + gasless, research-farcaster §2.2).
- Recovery: `keyEventByController` lets `msg.sender == boundController` inject an addKey/rotate event **without a portable signature**. Such events are flagged `chainNotarized` in the log. **Honesty rule for the Codex:** a chain-notarized event verifies at year-100 only against the origin chain's archived header chain + a merkle receipt of the event — a small but real dependency that pure-signature events do not have. Archives carry headers anyway (they need them for everything); but a log containing chain-notarized events is *receipt-portable*, not *signature-portable*. Orgs that want pure signature portability must hold raw rotation keys (cold, pre-rotated) and skip the controller path. The DAO/Safe persona pays this cost; there is no third option (ERC-1271 does not travel and the ecosystem is actively making it less portable on purpose — ERC-7739; research-identity-crux §2).
- **ERC-1271 is never an authenticity root for records.** It may gate a *chain-local convenience* (e.g., the controller path above), nothing else.
- **Identity succession** (EOA → log identity): a pair of binding claims (EOA-signed "my successor is I"; I-signed "I succeed EOA"). Owned-object IDs derived from the old word do **not** rewrite — succession is a lens/display-layer merge, never an identity rewrite. Stated to prevent overpromising.

### 2.4 Passkeys and PQ

- Passkeys are **signers, never identities**: a P-256 credential is one `addKey` (algoTag p256); loss = rotation event, not identity death. On-chain verification via P256VERIFY (EIP-7951, 6,900 gas, live on L1 since Fusaka). The Codex freezes the exact signed-bytes envelope for WebAuthn assertions (authenticatorData ‖ SHA256(clientDataJSON)) or restricts to raw-P256-over-digest authenticators — decided at Phase 0.
- PQ: algorithm-tagged keys make ML-DSA/SLH-DSA additive (new algoTag + verifier when precompiles exist); pre-rotation digests protect the rotation path now; the Codex carries an **algorithm-retirement epoch table** and the ERS re-anchoring convention (§8.e).

---

## 3. Record & envelope wire format

### 3.1 Structures

```solidity
struct EnvelopeHeader {
    bytes32 author;       // author word (§2.1)
    uint64  seq;          // TID logical clock (§3.3)
    bytes32 prev;         // digest of author's previous envelope (0x0 if none/unknown) — evidence, not admission-checked
    bytes32 recordsRoot;  // binary merkle root over record leaves (§3.2)
    uint32  count;        // leaf count (truncation-evident)
}
struct Record {
    uint8   op;           // 0 = ASSERT (object or claim) | 1 = REVOKE | 2 = CHECKPOINT
    bytes32 kindTag;      // efs.kind.* / efs.claimrole.* / efs.kind.checkpoint.v1 — spec-owned constants (deterministic-ids §1–2)
    bytes   body;         // abi.encode per v2 schema field strings (deterministic-ids §3), unchanged
}
```

### 3.2 Digests (byte-exact, all fixed-width `abi.encode`, dynamic content pre-hashed — house rule)

```
recordDigest_i = keccak256(abi.encode(DOMAIN_RECORD_V1, uint256(op_i), kindTag_i, keccak256(body_i)))
leaf_i         = keccak256(abi.encode(DOMAIN_LEAF_V1, uint256(i), recordDigest_i))          // index in leaf ⇒ order-committed
node           = keccak256(abi.encode(DOMAIN_NODE_V1, left, right))                          // domain-separated ⇒ no 2nd-preimage games
envelopeDigest = keccak256(abi.encode(DOMAIN_ENVELOPE_V1, author, uint256(seq), prev, recordsRoot, uint256(count)))

DOMAIN_* = keccak256("efs.kernel.<record|leaf|node|envelope>.v1")   // printable, versioned preimages
```

**Signature**: EIP-712 typed data over `Envelope(bytes32 author,uint64 seq,bytes32 prev,bytes32 recordsRoot,uint32 count)` with domain `{ name: "EFS", version: "1", salt: keccak256("efs.kernel.envelope.v1") }` — **no chainId, no verifyingContract**. Precedents: Farcaster's chain-unbound EIP-712 domains in production (research-farcaster §3); EIP-7702 `chain_id = 0` as protocol-blessed chain-free ECDSA (research-identity-crux §1.1). Replayability and portability are the same physical property; EFS records are idempotent facts, not value transfers, so replay is *the feature* (LOCKSS). The Codex says this in exactly those words, with the inverse warning for anything value-bearing.

**One signature per envelope** covers the whole DAG — strictly better than EAS delegation's one-sig-per-attestation with sequential nonces (research-efs-coupling-audit §3.7). Because leaves commit to indices, any single record is independently extractable: `(EnvelopeHeader, Record, merklePath, index, sig)` is a self-verifying artifact of one record — the granular replication unit.

### 3.3 `seq` — a TID logical clock, and why not a strict hash chain

`seq` is a 64-bit **TID** (ATProto-style: microsecond timestamp in the high bits, ~10 bits of per-device randomness low) — a per-author logical clock requiring **no cross-device coordination** (two devices essentially never collide; Actual Budget shipped this topology for years — research-crdt §2.5).

The kernel deliberately does **not** enforce contiguity or `prev`-linkage on record envelopes (it does on identity logs, §2.2). Reasons, each a named grave:

- SSB welded authenticity to a contiguous per-device chain: second device ⇒ forked feed ⇒ identity death; partial replication structurally impossible (research-nostr-ssb §2). Farcaster's FIP-193 rejected strict per-account sequence numbers partly for the client nonce-management burden.
- Sparse admission is what makes **partial replication and backfill** possible: replay envelopes 100, 230, 4096 to a new chain in any order; the state converges (§3.4).
- `prev` stays in the signed bytes as **tamper-evidence and duplicity material** (one bytes32 ≈ 512 gas of calldata): where the log is contiguous, year-100 verifiers get hash-chain integrity; where it isn't, they get ordering from `seq` + anchoring receipts. Weaker than KERI's full KEL, honestly so.

Admission rules:

1. `(author, seq)` is **first-seen-wins per chain**. Exact same digest again ⇒ **cheap idempotent no-op success** (makes LOCKSS resubmission and relayer races harmless — griefing by front-running someone's envelope submission is *beneficial*: their intended state lands and they didn't pay).
2. Same `(author, seq)`, different digest ⇒ **REVERT + `DuplicityDetected(author, seq, digestA, digestB)`**. The two signed envelopes together are portable, nonrepudiable proof of equivocation (KERI doctrine). Consequences are **lens-level trust destruction, never kernel-level** — the kernel records evidence; viewers and curators act on it. Indexers keep both artifacts (the evidence-preservation rule KERI has and EFS previously lacked — research-verifiable-logs §4.4.3).
3. `tidTime(seq) ≤ block.timestamp + 600` — future-dating rejected (closes the pre-signed-far-future-seq game); past is unbounded (replayed 2030 envelopes admit fine in 2090).
4. **Slot supersession keys on `(seq, recordIndex)`, not chain arrival order.** Current claim in a slot = highest `(seq, idx)` among admitted, unrevoked claims. This makes per-slot state a deterministic function of the *admitted set* — replicas holding the same envelopes agree regardless of replay order, and backfilling an old envelope can never clobber a newer placement. (Self-asserted timestamps are safe *here* because a slot has exactly one author — the only person an author can cheat with backdating is themselves. Nostr's cross-relay LWW disaster does not import: cross-author composition is lens precedence, never timestamps — research-consensus §4.)

### 3.4 Convergence property (state it once, test it forever)

For any two chains' kernels, and any subsets S₁, S₂ of an author's valid envelopes: after admitting S₁ ∪ S₂ on both, per-author object/claim/slot/revocation state is **identical** on both. (G-set objects + max-(seq,idx) LWW slots + monotone revocation-by-claimId = a join-semilattice; the BFT-CRDT recipe — signed, hash-identified ops, app-ranked authors — with the chain supplying the Byzantine and sybil layers the CRDT literature punts on; research-crdt §2.3.) This is the invariant-suite property that makes "replication = resubmission" true rather than aspirational.

---

## 4. Kernel interface (concrete)

```solidity
interface IEFSKernel {
    // ── writes (anyone may call; author comes from the signature) ─────────────
    function submit(EnvelopeHeader calldata h, Record[] calldata records, bytes calldata sig)
        external returns (bytes32 envelopeDigest);           // full batch, atomic
    function submitOne(EnvelopeHeader calldata h, Record calldata r, uint32 index,
        bytes32[] calldata proof, bytes calldata sig) external;  // single-record replication unit

    // ── identity ──────────────────────────────────────────────────────────────
    function incept(IdentityEvent calldata ev, bytes calldata sig) external returns (bytes32 author);
    function inceptForAccount(IdentityEvent calldata ev) external returns (bytes32 author); // C1: msg.sender == account
    function keyEvent(bytes32 author, IdentityEvent calldata ev, bytes calldata sig) external;
    function keyEventByController(bytes32 author, IdentityEvent calldata ev) external;      // chainNotarized-flagged
    function keyWindow(bytes32 author, bytes32 keyHash) external view returns (uint64 addedAt, uint64 removedAt);
    function exportIdentity(bytes32 author) external view returns (IdentityEvent[] memory);

    // ── point reads (the composability surface — R1-shaped, per research-onchain-composability) ─
    function getObject(bytes32 id) external view
        returns (bool exists, bytes32 kindTag, bytes32 author, bytes32 firstClaimId);
    function getSlot(bytes32 slotId) external view
        returns (bytes32 claimId, uint64 seq, uint32 idx, bytes32 target);
    function getClaim(bytes32 claimId) external view
        returns (bytes32 author, bytes32 kindTag, uint64 seq, uint64 revokedAtSeq, bytes memory body);
    function authorHead(bytes32 author) external view
        returns (uint64 highestSeq, uint64 envelopeCount, bytes32 latestCheckpointId);
    function resolvePath(bytes32 anchorId) external view returns (bool exists, bytes32 firstClaimId);
    // + ported enumeration views: children-by-author K-way pages, active claims, list entries
}
```

`claimId = keccak256(abi.encode(DOMAIN_CLAIM_V1, author, uint256(seq), uint256(idx)))` — globally unique, chain-free, client-computable **before submission**. This answers the coupling audit's open question #1 (slot-less MIRROR/REDIRECT revocation handles) with no nonce machinery: the envelope's own coordinates are the handle.

Object IDs (`anchorId, dataId, listId, propertyId, slotId`) are **unchanged from deterministic-ids §1** — same domains, same formulas, same golden vectors. The registry, duplicate policy shape, kind-attachment matrix, canonical-name profile, typed literals, virtual reserved-key anchors: all port verbatim. Two v2 flags from research-consensus §4 get resolved *for free* here: the SCC cycle tie-break re-keys on chain-free ids (lowest `sourceId`) because EAS UIDs no longer exist; LIST `maxEntries` is declared **chain-local admission state** (a replicated list's fullness is per-chain, like it already was for supersession) — written into the Codex, closing the one genuinely interleaving-dependent write rule.

**Genesis:** the bootstrap tree (root, `/transports/*`, reserved-key anchors, the Codex at `/.well-known/spec`) is written **in the kernel's deployment ceremony** under a reserved author word `keccak256("efs.system.v1")` from a frozen genesis blob — byte-identical on every chain by construction. SystemAccount-the-contract retires; there is no runtime code-governed author (a signature-only kernel cannot have one, and pretending otherwise would re-open the msg.sender hole).

---

## 5. Write path

1. **Plan (SDK, offline).** Build the parents-first record batch (v2 §5 ordering, unchanged); compute every ID; assign `seq` (TID), `prev` (local head); build `recordsRoot`.
2. **Sign (once).** Wallet signs the EIP-712 envelope — rendered human-readable via the ERC-7730 artifact ("write /notes.md, 3 properties, place under /home/alice"; deterministic IDs make calldata decodable — holistic §3.1). Daily flow: a registered session key signs silently; the wallet is touched only for key events. Cold-publisher flow: air-gapped machine signs; the envelope leaves on a USB stick.
3. **Submit (anyone).** The author's account, a relayer, a paymaster-sponsored bundler, a friend, an archivist — `submit()` is permissionless. The author's UX cost is zero gas and zero-to-one popups.
4. **Kernel admission.** Verify signature → resolve author (bare-EOA rule or keyWindow lookup; key must be in its `[add, remove)` window *now*) → `(author,seq)` dedupe/duplicity check → TID future-bound → then per record, in order: **validate-then-commit** (the ported v2 per-kind semantics: canonical round-trips, kind-attachment matrix, registry-at-admission existence rule — now with no mid-batch EAS `_db` divergence to footnote around), registry writes, slot supersession by `(seq,idx)`, index updates, full-payload ID-keyed events. Any failure reverts the whole envelope (empty-state-diff invariant); an exact-duplicate envelope short-circuits to success.
5. **Follow-ups** unchanged from v2: ancestor visibility TAGs ride a non-blocking second envelope when gas requires; large files do CREATE2 chunk deploys in parallel.

**Checkpoints (lazy, free-riding):** a CHECKPOINT record's body is `(coversSeq, stateRoot)` — a deterministic MST-style root over the author's full active claim-set (ATProto's decisive trick: **sign the state root, not just the records**, making completeness and *absence* provable — research-consensus §2.1/§5.1). The kernel stores the latest checkpoint pointer per author; it does **not** verify the root (too expensive) — but because chain state is total, *any* third party can recompute what the root must be and a lying checkpoint is one merkle-diff away from becoming duplicity evidence. The SDK appends a checkpoint to a write every N envelopes or M days; no extra signature, no extra UX.

---

## 6. Read path & lens resolution

Unchanged in shape from v2; re-keyed on kernel state:

1. Client computes `anchorId` offline → `getObject` O(1).
2. For each lens author in order: `getSlot(slotId)` for the placement PIN — **first-attester-wins** (ADR-0031, untouched). Authors in lens lists are bytes32 identity words; lens-as-LIST, subscriptions, author-first defaults all port.
3. Mirror selection lens-scoped from the winning author's claims; `contentHash` verified client-side; hash-verified cross-attester repair fallback (holistic §2.4) unchanged.
4. web3:// router serves as today (ERC-5219, SSTORE2 chunk reads, data: inline). The router now reads kernel state directly — the ~25 `eas.getAttestation()` join points disappear (coupling audit §3.5).

**Replicated-read conformance rule (Etched into the Codex, not left as SDK folklore):** a lens resolver operating over anything other than a single live chain's total state MUST distinguish "author A has no claim at S (proven: non-inclusion against A's checkpoint ≥ freshness horizon)" from "I don't know A's state," and MUST NOT fall through to the next lens author on *unknown*. First-attester-wins is anti-monotone in missing data — silent fallthrough is a wrong answer with no error (the lens amplifier, research-consensus §4). Checkpoints are what make the distinction checkable.

---

## 7. Gas & cost sketch (honest orders of magnitude)

| Item | Cost | Notes |
|---|---|---|
| Envelope overhead | 21k base + ~3k ecrecover (or 6.9k P256VERIFY) + ~2–5k EIP-712 hashing + calldata (sig 65B ≈ 1k) | once per batch; merkle verify only on `submitOne` (~1–2k) |
| Per record: kernel store | ~45–70k (packed meta + body) vs EAS's ~90–115k | drops uid-keyed `_db`, recipient, expirationTime, revocable, grind loop — the ~40–50k/record pure-substrate rent (coupling audit §3.5) |
| Per record: validation + indices | dominates, ports unchanged from v2 | path tree, slots, per-author indices |
| **Small-file write (7–8 records)** | **~8.5–9.5M gas** vs v2-on-EAS ~9–10M | ≈5–10% cheaper; **gas is not the argument** — same stance as deterministic-ids §12 |
| Identity inception | ~100–150k one-time | C1 via account tx; C2 via signed event |
| Key event | ~50–80k | rotation, device add/remove |
| Checkpoint record | ~40–60k | amortized, rides a normal write |
| Revocation | ~30–50k | one signed record |
| L2 (post-Fusaka) | cents per file write; likes/comments-class writes remain sponsored-relayer territory | matches apps-requirements Class-2 economics: relayer budgets, not protocol fees |
| L1 @1 gwei | ~$25–30/small file | archival lane |

Author pays **zero** when relayed; the relayer/paymaster pays and rate-limits (§8.b).

---

## 8. The five hard parts — engineered answers

### (a) Revocation / mutability

Three grades, all from one mechanism (a REVOKE record naming a `claimId`, signed by the claim's author, admitted to a kernel):

1. **On any live chain the record has reached:** authoritative, consensus-backed, one-SLOAD answer. `revokedAtSeq` is monotone (no un-revoke). Reads exclude revoked by default (ADR-0051 semantics). Objects stay non-revocable; only claims revoke — the objects/claims split that three package ecosystems independently converged on (yank semantics — research-apps §9).
2. **Across chains:** the revocation is a **portable signed artifact in the author's log** — it replicates with the data and replays onto any kernel. A replica that carries Alice's envelopes through seq N provably carries every revocation she issued through N; her checkpoint at N makes *absence of revocation* provable by non-inclusion. Staleness is bounded and surfaced (checkpoint age in the UI; per-lens freshness horizons). This is strictly stronger than EAS (revocation welded to one chain's state, unexportable — coupling audit §3.3) and categorically stronger than Nostr's advisory NIP-09 (no completeness commitment at all).
3. **After every chain the author used is dead:** the answer degrades to "as of the latest surviving checkpoint + admitted envelopes" — bounded-staleness, honestly labeled, which is the best any signature system can do (you cannot un-sign; research-nostr-ssb §1.2). What is *never* promised: byte un-existence. Real deletion for private data = key destruction under the encrypted-file conventions (unchanged, holistic §2.3).

Retroactive invalidation is constitutionally excluded (§2.2). Disavowal of a compromised window is a lens-scoped claim.

### (b) Spam / sybil

Architecture B **does not change the spam economics, and says so.** Writes still cost gas at admission, paid by the submitter, per-record (storage is per-record, so batching amortizes only the envelope overhead — the Sidetree per-op condition holds; research-spam §2.10). The layered posture, per the spam-economics synthesis:

- **Gas = rate limiter, not the defense.** Cheap-gas collapse (inscriptions, Dec 2023) is handled by index *shape*: per-author indices primary, global enumeration demoted to labeled-untrusted discovery (holistic §2.8) — architectural, because Etched contracts get no tunable prices.
- **Lenses = the defense** (email's 40-year verdict: authenticated author + receiver-side trust scoping). Sybil claims are definitionally invisible in lens-scoped reads; lens-scoped *replication* is the blessed LOCKSS form (spam nobody trusts is never copied).
- **Gasless edges self-defend:** relayers/paymasters are plural, replaceable, refusable services with per-author budgets (Bluesky's numbers as reference: ~5,000 points/hr), optional deposits, external-scarcity admission (funded account, DNS, aged identity — Sigsum's borrowed-scarcity pattern). A relayer's policy censors nothing: **self-submission with gas is the permanent censorship-resistance floor.**
- **Identity minting:** bare EOAs are free (writing still costs gas); log identities cost one inception (~$0.01–0.30 on L2) — a Farcaster-grade existence price, documented as friction, not filter.
- **Verification-DoS ordering rule (SDK-normative):** lens membership → signature → byte fetch. Never fetch bytes for an author the lens rejects.

### (c) Consensus on "what exists / what's current"

Decomposed per the E/O/C/Q taxonomy (research-consensus §0):

- **Per chain:** kernel state is total — existence, ordering, completeness, and non-equivocation are free, exactly as with EAS. Nothing regresses.
- **Ordering across replicas (O):** author-signed `seq` in every envelope; slot currency = max-(seq,idx) over the admitted set — deterministic, replay-order-independent (§3.4). Cross-author ordering is **never consumed** by EFS read semantics (the audit's collapse result) so it is never manufactured.
- **Completeness (C):** per-author signed **checkpoints** (state roots over the active claim-set) make "all of Alice's claims as of seq N" and "no revocation of X as of N" *provable* — inclusion and non-inclusion proofs against one signed root. Per-chain, `authorHead()` gives a cheap have-I-got-everything signal. The lens amplifier rule (§6) forbids resolving *unknown* as *absent*.
- **Equivocation (Q):** same-(author,seq)-different-digest is kernel-detected on one chain (revert + evidence event) and lens-adjudicated across chains (the two signed envelopes are self-contained proof; earliest-anchored wins as the default fork-choice rule where it matters, Ceramic's one good idea). Chain forks (ETH/ETC) remain fork-doctrine policy: identical IDs, diverging claim tails, surfaced as a multi-value read, never silently merged (research-crdt §6.5).
- **What is NOT provided, on purpose:** global freshness. A withheld newer envelope is indistinguishable from author silence; the design surfaces staleness (checkpoint age) rather than pretending to eliminate it. Every system that pretended otherwise built a sequencer and a validator committee (Snapchain: 6 validators, 2 companies, GitHub TOML — the anti-goal checklist; research-farcaster §6).

### (d) On-chain composability

Strictly ≥ v2-on-EAS, and cheaper: contracts do synchronous point reads against the kernel directly (`getObject` ~5–10k gas; `getSlot`; `getClaim` with body bytes state-resident) with no EAS join hop. The surface stays **point-lookup-shaped, never traversal-shaped** (Story's precompile is the counterexample budget — research-onchain-composability §2.9). The two hard app categories (NFT `tokenURI` composition from SSTORE2 chunks; typed-claim gating à la Coinbase Verifications) are served natively on the data's own chain. Cross-chain composability = **replication, never proofs** (Axiom is dead; storage-proof formats are hard-fork-fragile; ENS just retreated from its own L2 — §3 of that file): deterministic IDs mean "the record is on your chain too" is the trust-minimized read. Ship the reference `EFSGate` contract (gate-on-list-membership / gate-on-claim) as the composability on-ramp. What is lost vs EAS: contracts already written against `IEAS` can't read EFS without adapting — EFS forfeits the shipped EAS-reader pattern and brings its own.

### (e) Identity / signature portability — and where portability genuinely stops

The reconciliation (identity-crux Architecture C, made native): **authorization and authorship are different jobs.** Live authorization (sessions, sponsorship, recovery UX) lives in the smart account and chain-local machinery; eternal authorship lives in raw-key signatures over chain-free digests, certified by a self-certifying, position-scoped key-event log that travels with the data. The kernel recovering the author from the signature is what wins the prize: relaying is free, sponsorship is free, and a dead publisher's records are permissionlessly carriable to new chains *with authorship intact* — closing replication model A's dead-attester gap by making model C's "claimed attester" a checkable field rather than a trusted one (deterministic-ids §9, resolved).

**Verification procedures, exactly:**

- **Year 0:** recompute IDs from body per Codex → verify envelope signature (ecrecover/P256VERIFY) → `keyWindow(author, K)` says K is live → done. On-chain cost ~3–10k gas; off-chain identical against any RPC.
- **Year 100** (origin chains dead; verifier holds an EFS replica bundle): (1) bundle = payload bytes + envelope header/sig (+ merkle path if single-record) + the author's identity-event log + block-inclusion receipts of envelopes and key events on whatever anchoring chains + those chains' header chains + the Codex. (2) Self-certify the identity: C2 — recompute the inception digest; C1 — recompute the account address per the pinned CREATE3 recipe. (3) Walk the key log: contiguous evSeq, prev-digests, each event signed under the preceding state (pre-rotation checks), chain-notarized events verified by receipt-against-headers. (4) Place the record: inclusion receipt orders it relative to key events (same-chain block order), or `seq` + the log's own ordering where receipts are absent (weaker; say so). (5) K ∈ active window at that position; no removal precedes it. (6) Epoch clause: the record's anchor (or its newest ERS renewal anchor) predates the Codex's retirement epoch for algo(K). (7) Recompute all IDs; verify contentHash over bytes. Everything is hashes, ecrecover, and header chains — no living infrastructure, no RPC, no company.

**Where portability genuinely stops (the complete list — red team, start here):**

1. **Chain-notarized identity events** (controller-path recovery, C1 inception) verify only with archived origin-chain headers + receipts. Small, but a dependency pure-signature events don't have.
2. **Freshness/completeness after chain death** is bounded-staleness via checkpoints, never certainty. "Is this Alice's *latest* word?" has no trustless answer once no live chain carries her; anyone claiming otherwise is selling a sequencer.
3. **ERC-1271 / smart-account signatures never travel.** Accounts are controllers. Orgs wanting pure signature portability must manage raw cold rotation keys — a real operational burden on exactly the DAO/institution personas with the longest horizons (research-apps §8).
4. **Cross-chain duplicity is detectable and provable, not preventable.** An author *can* fork their own log across chains; the punishment is lens-level trust destruction, which requires functioning watcher/indexer culture (KERI specced this economy; nobody built theirs — budget for the minimal version: indexers retain evidence).
5. **Post-CRQC, unre-anchored ECDSA/P-256 signatures decay to "existed before epoch E"** (RFC 4998 grade). That statement is what century archives have always settled for, but it requires the re-anchoring convention to actually be operated (§11.2).
6. **The `seq` clock is self-asserted.** Safe within one author's namespace (§3.3), but a citation of the form "Alice's placement as of 2031" trusts anchoring receipts, not seq — temporal provenance remains the separate convention (holistic §3.3) that anchor receipts feed.

---

## 9. Adoption / DX story

**Dapp developer.** `npm i @efs/sdk @efs/ids`. Plan/simulate/commit; every ID computable offline before any transaction; one `submit()` on any chain the kernel lives on, or POST the signed envelope to any relay endpoint. Reads: `getObject`/`getSlot` point lookups, `web3://` URLs, log-filter subscriptions on ID-keyed topics (log-only-sync guaranteed by the v2 event acceptance test). Contracts: `IEFSKernel` point reads + the `EFSGate` reference. No EAS concepts to learn — one system, one Codex. The trade: no easscan, no existing EAS indexer tooling, no "it's just attestations" onboarding shortcut; EFS documents itself or is illegible.

**End user.** Sign once per save (session keys: zero popups); pay nothing (relayed); same identity and same links on every chain; passkey on the phone is just another device key; losing a device is a rotation, not an identity death. The demoable killer property: **a write is a file** — export the signed envelope, put it in the same shoebox as the photos, and anyone can submit it to any EFS chain in 2040 and it lands as you, with your revocations intact.

**Relayer/operator.** A relayer is ~50 lines: verify sig, apply budget policy, submit. Anyone can run one; none is trusted; the author can always bypass with gas.

---

## 10. Migration from today's prototype

Devnet-only, no real data — the cheapest this will ever be. But the one-freeze pledge binds: **the kernel rides the v2 ceremony or waits for a fork-level event** (coupling audit's sequencing finding; transition-plan §1.4). Concretely, relative to the v2 phases:

- **Phase 0 additions:** C1-vs-C2 default; envelope wire format sign-off; WebAuthn envelope decision; checkpoint cadence convention; controller-path scope. The §6/§9 coupled decision *dissolves*: signed envelopes = model A whose replay anyone can perform, with owned-kind duplicate-REVERT kept safe because a "duplicate" from a non-author cannot exist (the signature is the gate).
- **Phase 1 (Codex):** the EAS behavioral pin (§13.5.5) is **replaced** by the kernel wire-format + admission-rules chapter; the state-walk documents EFS's own storage layout instead of a third party's private mappings — a strict archival improvement. Everything else in the Codex TOC is unchanged.
- **Phase 3 (contracts):** kernel core (~500–900 new LoC: SigGate, IdentityRegistry, AdmissionLog, store) + mechanical port of ~2,900 resolver LoC into internal validation modules (deletes `onlyEAS`, foreign-schema guards, self-UID derivation, the proxy/burn machinery for resolver-addresses-in-UIDs — the ADR-0048 §2 bug class evaporates; only the kernel address is Etched). Delete the vendored EAS surface (~1,205 LoC) and the per-chain EAS conformance suite.
- **Phase 4 (SDK):** envelope builder/signer replaces the multiAttest builder; salt lifecycle, receipts, reads carry over.
- **Phase 5:** genesis blob replaces SystemAccount seeding; Sepolia v1 disposition per plan (expected zero third-party attestations).
- **Schedule honesty:** +2–4 weeks build on the 6–8 week plan, with a **disproportionate verification increment** — EAS's audited `_attest`/`_revoke`/auth core moves inside EFS's audit scope, and the envelope/identity spec needs external review by a lineage independent of this design (the forSchema lesson). If the week-3 checkpoint shows the verification bill exceeding the abort threshold, trigger (b) fires and EFS ships v2-on-EAS — that fallback must remain real, which means v2's schemas must not be contorted to presuppose the kernel.

---

## 11. What breaks first at 100 years (ranked by expected failure order)

1. **Year 1–5: the kernel itself.** A bespoke Etched contract with no battle-testing is the single largest concentration of risk in this architecture, and it fails *early* or not at all. An admission-logic bug (duplicity edge case, merkle malleability, key-window off-by-one) discovered post-burn has no upgrade path — only the hash-migration-playbook's new-domain successor deployment. This is not a year-100 risk; it is the reason the verification budget dominates the schedule.
2. **Year 3–10: gasless-edge economics.** Relayers/paymasters rot exactly like pinning services did (NFT.Storage, web3.storage, CAS — research-ceramic §2.4). Survivable by design: they are plural and replaceable, and self-submission is the floor — but consumer UX degrades to "bring gas" whenever nobody funds the edges.
3. **Year 5–15: institutional liveness of the re-anchoring convention.** ERS-style epoch renewal (re-anchor evidence onto younger chains before each algorithm retirement) is the one *ongoing obligation* the archive carries. It is cheap (one root per epoch) and anyone can do it, but "anyone can" is how CT gossip never shipped. Mitigation: make renewal a lens-visible, checkable public act (Sigsum-style named policies), and accept that unrenewed branches degrade to existed-before-epoch evidence.
4. **Year 10–30: CRQC.** Signatures stop being forgeable-proof; the epoch table + renewal machinery (item 3) is what stands between "archive intact with degraded evidentiary grammar" and "archive unverifiable." PQ key rotation for live identities is an ordinary log event once verifiers exist; dead identities rely wholly on item 3.
5. **Year 10–50: identity-log stewardship for orgs.** Lost pre-rotation keys + dead controller = frozen identity: nothing new can be authorized, but — the KERI dead-author property, and the correct behavior for an archive — everything already signed verifies forever, and anyone can keep replicating it.
6. **Year 30–100: interpretation drift.** The bits survive on N chains; the danger is the *rules* (admission semantics, lens precedence, duplicity doctrine) surviving only as folklore. The self-hosted Codex at genesis is the countermeasure; Ceramic is the corpse (anchors outlived the company that knew what they meant — research-ceramic §2.4.3). The Codex chapter for the kernel must be executable (the §13.5 acceptance test: fresh implementation, from Codex + chain snapshot alone).

---

## 12. Weaknesses, unsoftened (for the red team)

1. **EFS becomes its own EAS — and pays for it.** The audited-substrate property is forfeited and must be rebought with money and time on the most Etched artifact in the system. The ~25%/record EAS rent was buying real things: audit history, neutrality optics, ecosystem legibility, pre-deployment on every chain. Architecture B's counter-argument is that EAS's rent also bought the wrong semantics (chain-bound signatures, chain-local revocation, sequential nonces) — but the counter-argument does not make the audit bill smaller.
2. **Novel protocol surface where novelty is most expensive.** Chain-free EIP-712 domains, TID seq, sparse admission, duplicity rules, key-window semantics: each choice is defended above from production precedents, but the *composition* is new. Four of twelve reviewers copied the forSchema flaw unchallenged; the envelope spec is a bigger artifact with more places to hide a flaw. External review is a gate, not a formality; abort trigger (b) must be real.
3. **The replay-anywhere domain is a values commitment, not just a mechanism.** An author cannot keep their signed records off a chain they dislike. This is philosophically aligned (published = published, LOCKSS) but will surprise users and creates GDPR-shaped exposure at gateways/lenses, not solved here (same posture as v2: viewer-sovereign hiding + encryption; the EDPB direction makes this a live legal risk for public-personal-data claims).
4. **Identity registry = a security-critical key-management subsystem** that Holochain failed to stabilize in 8 years (DeepKey). Mitigations: the degenerate EOA path ships first-class (identity logs are opt-in), the log semantics are deliberately Farcaster-simple rather than full KERI, and B′ carries the UX. Still: key management UX is where decentralized systems go to die, and B moves it on-critical-path for every non-EOA author.
5. **seq self-assertion is safe by an argument, not by a deployment.** The "an author can only cheat themselves" analysis (§3.3) is believed sound and is invariant-testable, but no production system has run exactly this combination (TID clock + sparse admission + max-seq slots) on an adversarial public chain.
6. **Spam is not improved.** Anyone hoping the kernel dissolves hard part (b) should read §8.b again: it inherits v2's posture wholesale, plus new relayer edges to police.
7. **Ecosystem isolation.** No easscan, no EAS-native indexers, no "attestation" umbrella, and EFS-as-a-lens-over-the-EAS-universe (ADR-0033 raw containers, foreign-EAS lists) is dropped or demoted to optional view-layer reads. If EAS's network becomes the attestation lingua franca, EFS stands outside it.
8. **Schedule risk is concentrated in the one window that cannot slip quietly.** +2–4 weeks build, ≥that in verification, inside a publicly-committed last freeze. The honest failure mode is not "B ships broken" but "B forces trigger (b) and burns weeks that v2-on-EAS needed."

---

## 13. Decision rule

**Choose Architecture B iff ALL of:**

1. **Portable authorship AND portable revocation are ruled mission-critical** — i.e., the archive/DAO/registry personas (the R5/R6 irretrofittable requirements, research-apps §12) are in scope, and the journey's step 4 (portable chain-free signatures) is confirmed as a v2 property rather than a future overlay. If signatures-as-authenticity can wait, B cannot be justified: it is the only reason to leave EAS now.
2. **The envelope + identity spec survives independent external review inside the v2 window** (Phase-1 gate). A single unfixable-in-domain flaw ⇒ abort to v2-on-EAS.
3. **James accepts the substrate-owner bill**: kernel audit as first-class budget, verification-driven schedule (+2–4 weeks build, disproportionate verification), and the loss of EAS legibility/neutrality optics — traded for deleting the EAS rent, the bytecode pin, the per-chain conformance suite, the proxy/burn UID machinery, and the chain-bound delegation rails.
4. **On-chain composability demand stays point-lookup-shaped** (it does, per the apps evidence: 2 of 10 apps, both point reads) — so a purpose-built read surface suffices and no EAS-ecosystem contract-reader compatibility is owed.
5. **The fallback stays real:** v2 schemas are frozen in a form that works on EAS unchanged, so trigger (b) aborts cleanly.

**Choose against B if any of:** signatures/identity can be deferred (then ship v2-on-EAS and take the delegation-rails half-step later); the verification bill breaches trigger (b); EAS ecosystem legibility is judged strategically load-bearing; or the team is unwilling to Etch the identity decision now — B makes hard part (e) a derivation-input-class, irretrofittable, Phase-0 decision, and there is no version of B that defers it.

---

## 14. v2 implications (what survives / changes / dies)

**Survives unchanged:** every ID derivation and constant (anchorId/dataId/listId/propertyId/slotId, domains, kindTags), canonical-name profile, typed literals, registry semantics (first-writer-wins, state-walk, write-once), parents-first batch ordering, duplicate-policy shape, blinded/salted anchors, virtual reserved-key anchors, events-v2 discipline, lens model and first-attester-wins, statements-vs-things, the Codex-at-genesis doctrine, gas honesty (§12 stance), all §2 conventions (dirnodes, move doctrine, encryption, link grammar, mirror fallback).

**Changes:** the attester word generalizes to a bytes32 identity word (address-shaped or digest-shaped) — formulas untouched, domain widened; the coupled §6/§9 decision resolves (model-A replay executable by anyone, because the signature authenticates the claimed author — model C's flaw becomes a checkable rule); revocation handles move from EAS UIDs to chain-free `claimId`s; the Codex's EAS behavioral pin chapter is replaced by the kernel wire-format chapter; SCC tie-break re-keys on chain-free ids; LIST `maxEntries` is declared chain-local; "attester = user" survives but "attester = msg.sender" dies — the attester is the signature-recovered identity, which is what dissolves the no-shared-relayer constraint rather than violating it.

**Dies:** ADR-0032 (EAS as foundation — superseded); EAS schema UIDs as type discriminators; the EAS bytecode pin + per-chain conformance suite; the proxy/burn ceremony for resolver-addresses-in-UIDs; delegation rails as the gasless bridge; SystemAccount as a runtime author (genesis blob replaces it); EAS-explorer legibility; ADR-0033 raw EAS containers as kernel-level parents (view-layer option at most); the ~25 `getAttestation` join points.
