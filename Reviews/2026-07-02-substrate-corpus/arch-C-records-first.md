# Architecture C — RECORDS-FIRST
## Portable signed records as THE system; chains as witnesses, meters, and caches

**Architect:** arch-C-records-first · **Date:** 2026-07-02
**Inputs:** all 13 substrate research files; `planning/Designs/deterministic-ids.md`; `efs-v2-holistic-redesign.md`; `efs-v2-transition-plan.md`; `contracts/specs/overview.md`.
**Posture:** this is the strongest honest case for records-first. Weaknesses are stated, not softened — §14 is written for the red team.

---

## 0. Stance

**The canonical EFS artifact is a signed record, not a chain state transition.** A record is a self-contained, chain-free, byte-frozen artifact: its object IDs are the v2 deterministic derivations, its authenticity is a raw-key signature checked against a self-certifying key-event log, its position in its author's history is a monotonic sequence number and a prev-hash, and its *currency* is established by author-signed state roots ("heads") registered on chains. Chains do exactly four jobs, each because nothing else does it as well:

1. **Identity registry** — total ordering and anti-equivocation for key-event logs (the role plc.directory, KERI witnesses, and Farcaster's KeyRegistry all approximate; a chain does it natively).
2. **Head registry + batch anchoring** — existence-by-T, per-author completeness commitments, equivocation fork-choice, and revocation finality with bounded staleness.
3. **Spam cost** — the one cheap on-chain act (head registration) doubles as the sybil credential for every free service tier.
4. **Per-chain surfacing kernels** — materialized, verified caches of records on chains where contracts need to read them (the v2 kernel, re-derived as a projection).

Everything else — record creation, storage, replication, reads, lens resolution — happens on the record/repo plane, free and instant, with the chain plane consulted for currency and never for authenticity.

**Why believe this can work when Ceramic died, Farcaster retreated to a chain, and ATProto needed a central sequencer:** each of those systems lacked at least one of three load-bearing pieces this design mandates together — (i) per-author *signed state roots* making completeness/absence provable (ATProto has it; Ceramic and Farcaster-hubs did not), (ii) *permissionless chain registration* of those roots making ordering/equivocation/staleness adjudicable without a trusted operator (none had it — Ceramic's CAS was allowlisted, ATProto's directory is a company, Farcaster built a permissioned chain), and (iii) *lens-scoped replication* making spam and storage economics per-trust-graph instead of global (only SSB had it, and SSB lacked everything else). The recipe is untested as a whole. That is the honest risk profile: every ingredient is production-proven somewhere; the combination is not proven anywhere. §14 and §15 price this.

---

## 1. System map — three planes

```
RECORD PLANE (canonical truth)
  signed records → per-author logs (seq + prev-hash) → repos (MST state roots) → signed heads
       │  free, instant, offline-capable, portable, verifiable anywhere forever
       ▼
REPO PLANE (availability)
  repo hosts (any dumb storage: S3, static site, IPFS, another chain's calldata)
  relays/indexes (lens-scoped sync, negentropy/Recon-style set reconciliation)
  archives (LOCKSS: replicate the attester sets your lenses trust; hash-verified repair)
       │  best-effort by default; funded/contracted for the archival tier
       ▼
CHAIN PLANE (ordering, cost, composability — plural, interchangeable)
  per chain: IdentityRegistry (KELs) + HeadRegistry (latest head per author, monotone seq)
           + AnchorAccumulator (epoch roots, contract STATE not logs)
           + SurfacingKernel (v2 kernel: object registry, slots, indices, router)
```

The read path never *trusts* any plane: records verify by signature + derivation; heads verify by signature; anchors verify by header chains; surfaced state verifies by chain consensus. What each plane *adds* is a different grade of the answer to "does this exist and is it current" (§8c).

---

## 2. The record — byte-level format

One deterministic encoding for everything: `keccak256` over `abi.encode` of fixed-width words, dynamic content pre-hashed. **DAG-CBOR is deliberately rejected** for the signed surface: its determinism is a spec property that real decoders relax (Ceramic/IPLD autopsy §2.2), and EFS already owns a stricter, EVM-native discipline with golden vectors and cross-language fuzz (deterministic-ids §13). SSB died partly of canonicalization; EFS will not import a canonicalization layer it doesn't need. The one thing borrowed from the IPLD world is the *shape* (content-addressed records in a deterministic authenticated map), not the encoding.

### 2.1 Record header (7 words, 224-byte preimage)

```solidity
bytes32 constant RECORD_DOMAIN = keccak256("efs.record.v1");
bytes32 constant SIG_DOMAIN    = keccak256("efs.sig.record.v1");

recordPreimage = abi.encode(
    RECORD_DOMAIN,        // [0] spec-owned constant. NO chainId. NO verifyingContract. Ever.
    bytes32 author,       // [1] identity id I (§3) — address-shaped for EOA identities
    bytes32 kindTag,      // [2] v2 kind constants + new: KIND_KEYEVENT, KIND_REVOKE, KIND_HEAD
    bytes32 seqWord,      // [3] uint64 seq, per-author monotone logical clock, left-padded
    bytes32 prev,         // [4] recordHash of author's previous record; 0 at seq 0
    bytes32 timeWord,     // [5] uint64 claimed wall-clock seconds — DISPLAY ONLY, never ordering
    bytes32 payloadHash   // [6] keccak256(payload)
);
recordHash   = keccak256(recordPreimage);
signedDigest = keccak256(abi.encode(SIG_DOMAIN, recordHash));
```

The **envelope** as transported: `header fields ‖ payload ‖ sigBlock` where `sigBlock = abi.encode(bytes32 keyId, bytes32 algTag, bytes sig)`. `algTag` is a spec constant (`keccak256("efs.alg.secp256k1.v1")`, `…p256.v1`, future `…mldsa65.v1`, `…slhdsa128s.v1`) — algorithm-tagged from day one so PQ keys are purely additive (identity-crux §5). `keyId` identifies which key in the author's KEL signed (0 for EOA identities).

Design notes, each traceable to a research finding:

- **Chain-free signing domain.** Replayability and portability are the same physical property (EIP-7702 chainId=0 lesson). EFS records are idempotent facts, not value transfers — replay is *desired* (LOCKSS) and made harmless by deterministic IDs + idempotent application. EAS's `{chainId, verifyingContract, version}` domain is the named anti-pattern (credentials autopsy §2.2).
- **`seq` + `prev`** give per-author total order and make equivocation *cryptographically provable* (two signed records at one seq = duplicity evidence, KERI-style; the Blocklace/BFT-CRDT construction). This is the minimum ordering metadata the CRDT research says cannot be retrofitted (crdt report §6.4) — it is in the signed bytes from record zero.
- **`timeWord` is never load-bearing.** Datomic's uni-temporal lesson: event time is an explicit assertion, bounded above by anchors, never inferred from any clock.
- **No relay, host, schema-UID, or resolver address anywhere in the preimage** — Nostr's NIP-01 proved domain-free artifacts scale; deterministic-ids §2 already bans deployment-dependent derivation inputs. Same rule, extended to the envelope.

### 2.2 Payloads

Payloads are **byte-identical to the v2 schema field strings** (deterministic-ids §3): ANCHOR `(parentId, name, kindTag)`, DATA `(salt)`, PROPERTY `(datatype, value)`, LIST, MIRROR, PIN, TAG, LIST_ENTRY, REDIRECT — plus:

- **REVOKE** `(bytes32 targetRecordHash)` — retraction-as-new-fact (Datomic; KERI TEL; labels' `neg`). Only meaningful when `author` matches the target record's author. This *solves the slot-less claim-handle problem* the coupling audit flagged: MIRROR/REDIRECT revocation handles are simply recordHashes — deterministic, unique (seq/prev makes every record distinct), no nonce machinery.
- **KEY_EVENT** — §3.
- **HEAD** — §4.

Object IDs (`anchorId`, `dataId`, `propertyId`, `listId`, `slotId`) are computed exactly per deterministic-ids §1. **The entire v2 identity Codex survives unchanged.** What changes is what a "statement" is: a signed record instead of an EAS attestation.

---

## 3. Identity — self-certifying key-event log, chain-witnessed

The reconciliation of hard part (e), assembled from KERI (mechanics), did:plc (production ergonomics), Farcaster (on-chain registry + the retroactive-invalidation trap to avoid), and Urbit life/rift (chain as the rotation registry):

### 3.1 Identity forms

- **EOA identity (degenerate, first-class forever):** `I = bytes32(uint160(address))`. No log. Verification = `ecrecover(signedDigest, sig) == address`. This keeps the air-gapped cold-key publisher persona first-class (holistic §5) and keeps the simple case simple. Address-shaped identities occupy the 96-leading-zero-bit subspace, as in v2 doctrine.
- **Log identity:** `I = keccak256(abi.encode(DOMAIN_IDENTITY, inceptionRecordHash))` where the inception is a KEY_EVENT record with `author = bytes32(0)` (self-reference break, KERI-style). Inception payload names: initial signing keys (algorithm-tagged), an optional **pre-rotation digest** (hash of the *next* key set — unexposed keys are hash-shielded, which survives quantum; KERI's one free PQ escape hatch), an ordered **rotation-key list** (did:plc's ranked authority — up to 5, descending priority), and a **threshold policy** (m-of-n for org identities).
- **Org identity:** a log identity whose key events carry threshold policies. The DAO/registry/archive personas — the publishers with the deepest pockets and hardest portability requirements (apps report §13e) — get rotation, succession, and multi-sig *in the portable layer*. Their Safe remains the executor/gas-payer; it is never the authenticity root, because ERC-1271 answers are queries against mutable chain state, not artifacts (identity-crux §2 — this is the one impossibility result the whole design is built around).

**B′ harmonization (the one-address memory):** the user still has ONE address everywhere — the B′ smart account is deployed via CREATE3 with `salt = I`, so address ↔ identity is a pure derivation both ways. The address is the display/UX form; `I` is the archival form. On-chain writes may still be executed *by* the account; authorship is always established by the envelope signature, never by msg.sender.

### 3.2 Key-event rules (the anti-Farcaster clause)

Key validity is scoped **[addKey position, removeKey position) by log order, monotone forever.** A record verified against the key state at its log position stays valid when the key is later removed or rotated. Farcaster's "when a Signer is removed, all its messages are revoked" makes validity non-monotone and lets routine key hygiene (or a compromised root key) erase a lifetime of authorship — catastrophic for an archive, explicitly rejected. Compromise handling is forward-only: remove the key, plus an optional **disavowal claim** ("I disavow records in anchor range [a,b]") that lenses honor — viewer-sovereign, WHITEOUT-analogous, never protocol deletion.

**Rotation ordering is chain-anchored, closing 3ID's grave.** Ceramic proved that rotatable identity + portable signatures + no consensus clock = retroactively invalid signatures (js-3id issue #138). Here every KEY_EVENT is registered in the chain's IdentityRegistry (below), so "which keys were valid when record R was anchored" has a total-ordered answer; a stolen old key cannot forge history because its forgeries lose the earliest-anchor race (Ceramic's own fork-choice rule, kept — it is the one thing anchoring is sound for).

### 3.3 Per-chain IdentityRegistry

A small contract per chain: `submitKeyEvent(envelope)` — verifies the event's signature against the identity's prior registered state, enforces `seq` monotonicity and prev-chaining, stores the new key state (state-walk reconstructible, never log-dependent). Submission is **permissionless** (events are signed; anyone can carry them — the PDS-as-relayer pattern). Per-chain self-forking of a KEL is impossible (the contract enforces one chain of events); cross-chain divergence is duplicity evidence adjudicated by earliest-anchor + fork doctrine. The registry also holds a mutable **service pointer** (current repo host URL, like a DID doc's PDS endpoint) — hosting is rented and replaceable; identity is not.

### 3.4 Verification procedures (the crux, answered exactly)

**Year-0 (origin chains alive):**
1. Recompute the record's object IDs from payload per Codex; recompute `recordHash`; recompute `signedDigest`.
2. `ecrecover`/P256VERIFY → key K.
3. EOA identity: `K == I`, done. Log identity: one IdentityRegistry read — K active for I at current state (or at the record's anchor position for historical reads).
4. Author = I. Cost on-chain: ~3k (ecrecover) or 6.9k (P256VERIFY, EIP-7951) + one SLOAD-class registry read.

**Year-100 (origin chains dead; verifier holds a replica bundle):**
1. Bundle contents: payload + envelope; the author's KEL slice up to the record's anchor; the head(s) covering the record; Merkle inclusion receipts of the record/head/KEL events in anchor-chain blocks; the anchor chains' header chains (already required to verify *any* EFS content — no new trust); the Codex.
2. Check `I == keccak256(DOMAIN_IDENTITY ‖ inceptionHash)` (self-certifying root) or `I` is address-shaped.
3. Walk the KEL slice: each event chains by prev-digest; each event's signatures satisfy the preceding state's policy (thresholds, pre-rotation commitments).
4. Place the record: its anchor receipt orders it between KEL events; check K ∈ active set in that interval.
5. PQ clause: the record's anchor (or its newest ERS-renewal anchor, §9) predates the Codex's retirement epoch for `algTag`. Conclusion: "authored by I, provably before epoch E, when forgery was infeasible" — the statement archives have always settled for (RFC 4998).
6. No clock, no registry, no living chain, no ERC-1271, no `eth_call` — hashes and header chains only.

---

## 4. Repos and heads — per-author completeness made provable

### 4.1 The repo

Each author's current state is a **deterministic, history-independent authenticated map** (ATProto MST shape, keccak-flavored: fanout 4, depth by leading zero bits of `keccak(key)`, node encoding fixed in the Codex with anti-DoS caps on node width/depth; golden vectors; no CIDs — plain keccak node hashes). Keys are meaningful sorted paths, giving range locality for exactly the queries the apps need (R12: cheap lens-scoped enumeration):

```
obj/anchor/<parentId>/<nameHash>      → recordHash   (directory listing = range scan)
obj/data/<dataId>                     → recordHash
obj/prop/<propertyId>                 → recordHash
obj/list/<listId>                     → recordHash
claim/pin/<definitionId>/<targetKind> → recordHash   (the PIN slot, one entry — LWW by log order)
claim/tag/<definitionId>/<targetId>   → recordHash
claim/mirror/<dataId>/<recordHash>    → recordHash   (multi-valued)
claim/entry/<listId>/<identityKey>    → recordHash
claim/redirect/<sourceId>/<recordHash>→ recordHash
kel/<seq>                             → recordHash
```

A REVOKE or a superseding PIN *removes/replaces* the map entry — the map is the **active set**. The log keeps everything (append-only, nothing silently revised: the archive property lives in the log; the map is the current-state fold, Eg-walker style: durable artifact = event history, merge/current semantics = replayable interpretation).

### 4.2 The head

```solidity
bytes32 constant HEAD_DOMAIN = keccak256("efs.head.v1");
headPreimage = abi.encode(HEAD_DOMAIN, author, seqWord, logTip, stateRoot, timeWord);
// logTip   = recordHash of the latest record (prev-chain tip)
// stateRoot = MST root over the active set
```

A HEAD is itself a signed record. **Signing the state root is the keystone mechanism of the whole architecture** (consensus report §2.1): it converts the non-monotone completeness question ("is there no revocation / no later PIN?") into a monotone one ("give me A's latest registered head"), with **inclusion proofs for presence and non-inclusion proofs for absence** — the thing Nostr structurally lacks and the precise reason its deletion is advisory.

### 4.3 Multi-device, forks, and recovery (the SSB clause)

A per-author hash chain with two offline laptops is SSB's feed-fork suicide unless recovery is specified *in the same spec* as detection (nostr-ssb lesson 11). Rules:

- **Serialization point:** the author's repo host serializes appends (ATProto PDS pattern); self-hosters serialize trivially; the SDK does stale-head detection before publish (compare local base head vs host head — git's index check, ~20 lines).
- **Fork detection:** two signed records at one seq = duplicity evidence. Watchers/indexers **retain both** (KERI evidence-preservation doctrine — EFS indexers get an explicit retention rule, which v1/v2 lacked).
- **Fork recovery (mandatory, unlike SSB):** a **merge head** — a HEAD whose payload names both branch tips as parents and commits to a merged active set (per-slot LWW by anchor order, both values surfaced to the author's client for manual pick where they conflict). Pre-merge, the earliest-*registered* branch wins for readers. An identity is never bricked by a fork; the worst case is one manual merge prompt.

---

## 5. The chain plane — four contracts, one per chain, all interchangeable

Per chain (any EVM chain; the set is governed by the published trusted-chain policy document, Sigsum-style immutable named policies):

1. **IdentityRegistry** (§3.3).
2. **HeadRegistry** — `registerHead(envelope)`: verifies head signature against IdentityRegistry key state, enforces `seq > current`, stores `(seq, logTip, stateRoot, blockNumber)` in **contract state** (append-only history array + latest pointer; never calldata/log-dependent — the CIP-110/EIP-4444 lesson: anchor into state readable by storage proof, not into logs that expire). Permissionless submission; ~4 slots; anyone can batch N heads in one tx.
3. **AnchorAccumulator** — `anchorRoot(bytes32 root)`: epoch-batched Merkle roots over arbitrary record sets, OpenTimestamps-style, for existence-by-T of *unregistered* records. Proofs verify batcher-free. This is deliberately distinguished from head registration: **a bare anchored root buys existence-by-T only** (a spammer can put a million records under one root — it is not a spam control and not a completeness commitment); **a registered head buys completeness + currency + revocation finality**, and is per-author priced. Conflating these two is the confusion Sidetree had to engineer its way out of (spam report §2.10); the Codex names them separately.
4. **SurfacingKernel** — the v2 kernel (object registry, slot supersession, per-attester indices, path tree, router/views, SSTORE2 chunk store), with one change of entrypoint: `writeBatchSigned(records[], proofsIfNeeded)` — verifies each envelope (signature → key → IdentityRegistry state), applies v2 validation semantics unchanged (~2,900 LoC of resolver logic ports as internal modules per the coupling audit), and materializes state contracts can read. **EAS drops out**: its delegation domain is chain-bound by construction, sequential nonces serialize multi-device writers, and the audit shows the native kernel is smaller than the EAS slice EFS uses (~500–900 new LoC). The kernel is the *projection* of the record plane onto one chain — a verified cache, not the truth.

Surfacing is **permissionless carriage**: anyone may submit anyone's signed records. This is replication model C *with authentication* — the signature makes the claimed-attester field checkable, which dissolves model A's dead-attester limit (a dead archivist's owned objects are re-instantiable on new chains by anyone holding the artifacts) and removes the REVERT-as-griefing coupling (duplicate surfacing of the same recordHash is an idempotent no-op; a different record at the same `(attester, salt)` is the author's own provable equivocation, rejected against their registered log).

---

## 6. Write path

```
1. AUTHOR (offline, free, instant)
   SDK builds records (v2 payloads), assigns seq/prev, signs each envelope
   (session key certified in the KEL — one wallet ceremony per device, then silent)
2. COMMIT (local)
   append to log → recompute MST → sign new HEAD
3. PUBLISH (free tier)
   push log+MST delta to repo host(s); host serializes; relays sync lens-scoped
4. REGISTER (cents, batched, the one on-chain act)
   registerHead on ≥1 chain — self-submitted, or via a relayer (permissionless:
   the head is signed; gasless by construction — THE PRIZE, at the head layer)
5. SURFACE (optional, per record × chain, paid by whoever wants composability)
   writeBatchSigned on chains where contracts/web3:// must read this content
```

Atomicity: a file-DAG write is one head transition — all-or-nothing by construction, no multiAttest ordering pins, no EAS bytecode hash in the Codex. Steps 1–3 are Web2-speed. Step 4 is the only mandatory chain touch and it amortizes over unlimited records (a user writing 1,000 likes/day registers one head/day). Step 5 is the archival/composability tier with visible, chosen cost.

Frequency defaults (SDK, tunable per lens policy): register on every "publish" action, at most every N minutes, and always immediately for revocations and lens-list (curation) changes — curation IS mutation and gets the fast path (apps R3).

---

## 7. Read path and lens resolution

Lens semantics are **unchanged**: ordered trusted-attester list, first-attester-wins, per-attester slot states, viewer sovereignty. What changes is where per-attester state comes from:

- **Live read (SDK/gateway):** for each lens attester: fetch latest registered head (one RPC to the HeadRegistry on the reader's preferred chain — cacheable, short TTL) → fetch the needed MST path + records from any repo host/relay (hosts are fungible; bytes verify against the head) → verify → resolve slots → first-attester-wins. Directory listing = per-attester MST range scans, K-way merged. Cost scales with the lens's content, never with global spam (R12).
- **Surfaced read (contracts, web3://):** identical to v2 — `getObject`, slot reads, router serving from chunk store. Only surfaced content resolves this way; the web3:// zero-infrastructure property covers the surfaced tier only (an honest regression vs. chain-native — §14.4).
- **Archival read (year-100):** self-contained proof bundle (Sigsum shape): bytes + records + heads + KEL slices + inclusion/anchor receipts + header chains + Codex; verifies offline with no RPC.

**Two conformance rules the research makes mandatory:**

1. **The lens-amplifier rule** (consensus report §4): first-attester-wins is anti-monotone in missing data — a missing attester-1 PIN silently falls through to attester 2, a wrong answer with no error. A conforming resolver MUST distinguish "A has no claim at S (non-inclusion proof against A's registered head)" from "I don't know A's state (no head / unproven)" and MUST NOT fall through on the latter. Signed heads are what make this distinction checkable at all.
2. **Cheap-first verification order** (spam report d): lens membership check → head/signature check → byte fetch+hash, so untrusted volume can never grief reader bandwidth.

Head-age is always surfaced ("Alice's view, as of 2h ago / epoch 84,112") and lens policies may declare max-staleness horizons.

---

## 8. The five hard parts — explicit engineering

### (a) Revocation without a consensus substrate — the anchored-head answer

You cannot un-sign a signature. The design never pretends to; it makes revocation a **provable state transition with bounded staleness**, which no advisory-deletion system provides:

1. **Mechanism:** REVOKE record (or superseding PIN) → entry leaves the active set → new head → head registered on-chain. Monotone, append-only, tombstone-free at the map layer, fully preserved at the log layer.
2. **Finality grade:** a reader resolving against A's latest registered head at epoch E has *cryptographic proof of absence* (MST non-inclusion) — "revoked as of E" is a theorem, not a request. Staleness bound = head-registration cadence (blocks-to-minutes for curators on the fast path). This is strictly stronger than Nostr NIP-09 (advisory, unbounded), OCSP (soft-fail), and StatusList (issuer-liveness-dependent), and equal in kind to EAS on-chain revocation with a lag parameter.
3. **The withholding residue, stated plainly:** a validly-signed, validly-registered head can be stale because the author is silent or because a newer head is being withheld — *indistinguishable, irreducible without per-write chain consensus.* Handled by: freshness horizons in lens policy (claims older than horizon degrade to "currency unverified" in UI), mandatory head-age surfacing, and expiry+re-attestation for claim classes that need liveness (the CA industry's 47-day verdict).
4. **Surfaced-cache revocation:** a claim surfaced on chain X and revoked off-chain leaves a stale cache entry. Engineering: the kernel stores each author's latest *surfaced* head seq; **anyone** may submit (newer registered head + MST non-inclusion proof) to strike a stale surfaced claim — permissionless, ~50–150k gas, no author involvement. Contracts needing bounded staleness check `headAge(author)` on-chain and refuse claims whose author's surfaced head is too old. The incentive gap (who pays to strike?) is real: the interested party (moderator, dapp, wronged user) pays, and where nobody cares the cache stays stale — named as accepted (§14.2).
5. **Never promised:** instant global revocation; un-existence of bytes; revocation of the free unregistered periphery (a record that never had a registered head is Nostr-grade, and readers can see that grade).
6. **Private-data delete** stays what it is in every architecture: key destruction over encrypted content (apps report R4).

### (b) Spam without gas-as-write-cost

Gas never was one thing; unbundle it (spam report §1):

1. **Record creation is free and un-priced — deliberately.** Every attempt to price artifact creation failed measurably (Laurie–Clayton 2004: 5.8–346 s/message; Farcaster rent: 82–91% of *paying* accounts spam-labeled; npm token-farm floods shrug off fees). Don't fight physics.
2. **Reads are lens-scoped** — a billion sybil records are definitionally invisible to every lens-scoped reader (first-attester-wins over trusted attesters; email's 40-year answer).
3. **Replication is lens-scoped** — archives/relays replicate attester sets some lens trusts (SSB transitive-interest: spam nobody trusts is never fetched, stored, or copied; replicated-spam cost ≈ 0 without any price).
4. **The priced choke point is head registration:** per-author, per-epoch, gas-denominated, permissionlessly submittable. Registration is the sybil credential — "has a registered head on chain X, ≥N epochs old" is the borrowed-scarcity credential (Sigsum's DNS-rate-limit pattern with a better namespace) that relays, gateways, and discovery services key their free tiers on. Cost to exist ≈ one L2 tx — comparable to Farcaster's storage-unit admission, but *not* coupled to retention (nothing is ever pruned for non-payment; rent-lapse-deletion is disqualified on mission grounds).
5. **Service edges carry adjustable policy:** relayers/paymasters/hosts use Bluesky-class per-identity point budgets, deposits, paid tiers — plural, competing, refusable, never Etched. Self-submission with gas is the permanent censorship-resistance floor under every service policy.
6. **Shared on-chain surfaces keep gas** (surfacing kernel writes, registry growth) plus v2's index-shape fix (per-attester indices primary; global enumeration demoted) so integrity never depends on gas price (the Dec-2023 inscriptions lesson).
7. **Honest residual:** discovery/onboarding surfaces outside every lens are where spam lives in every studied system. Answer: published competing reputation lenses (lens-as-LIST labeler market), constitutional stewardship of the default lens chain, and acceptance that a global firehose view is a per-operator venture, not a protocol surface.

### (c) Consensus on "what exists / what's current"

Decomposed per the consensus report (E/O/C/Q), and answered by grade rather than pretended global:

| Question | Mechanism | Grade |
|---|---|---|
| Existence | record in any repo; anchored root ⇒ existed-by-T | G0 free / G1 anchored |
| Ordering | per-author seq + prev (signed); anchor epochs bound backdating across epochs | per-author total; cross-author bounded |
| Completeness/absence | signed state roots; non-inclusion proofs against registered heads | per-author, bounded staleness |
| Equivocation | prev-chain duplicity evidence; per-chain registries make self-forking impossible; earliest-registered wins; cross-chain divergence → fork doctrine + lens-level trust destruction (KERI first-seen + evidence retention) | provable, punishable at trust layer |
| Currency | latest registered head per author, per lens policy | per-author; **global currency does not exist and is not promised** |

This is exactly the consensus EFS's read semantics need and no more: the semantics audit found zero cross-author ordering requirements in PIN/TAG/lens resolution. The **one genuine casualty**: cross-author-interleaving write rules — LIST `maxEntries` across attesters — are not portable-reproducible. Ruling: capacity is enforced only at surfacing time, per chain (chain-local semantics, like v2 supersession); portable semantics are per-author and uncapped. The SCC cycle tie-break re-keys on chain-free ids (lowest `sourceId`), fixing the UID-keyed non-portability the audit flagged.

"What exists" is thus always a *scoped* claim: exists-in-this-repo, existed-by-T, complete-per-A-as-of-epoch-E, surfaced-on-chain-X. Readers and lens policies pick the grade; UIs show it. Any architecture that claims an unscoped answer is either a single chain (per-chain scope in disguise) or lying.

### (d) On-chain composability — how a contract ever reads EFS state

The bluntest constraint in the research: **there is no middle price point.** Native same-chain reads are ~5–10k gas and synchronous; every proof-mediated cross-domain read is $1–50, minutes-latency, per-chain-pair infrastructural, hard-fork-fragile, and the flagship vendor (Axiom) is dead. Contracts will never verify MST proofs against off-chain heads in the money path. Therefore:

1. **Contracts read only surfaced state.** The SurfacingKernel materializes records into v2-shaped registry/slot/byte state; `getObject(id)`, active-slot reads, and SSTORE2 chunk reassembly serve the two proven consumer classes (NFT tokenURI byte composition; typed-claim gating à la Coinbase Verifications/Passport) natively on the data's own chain. Point-lookup-shaped only; graph traversal stays off-chain forever (Story's precompile is the counterexample budget).
2. **Composability is bought per (record, chain), by whoever wants it** — the dapp, the author, a fan, a keeper. Permissionless carriage means the buyer needn't be the author. 8 of 10 apps need zero (apps report R11); the 2 that need it are precisely the ones whose economics tolerate surfacing gas (mint-time NFT metadata; treasury-funded DAO records).
3. **Cache honesty:** surfaced claims carry the author's surfaced-head seq; `headAge(author)` is contract-readable; permissionless non-inclusion strikes (§8a.4) keep caches correctable. A contract that gates value on an EFS claim SHOULD enforce a freshness horizon — this is spec'd guidance, not hope.
4. **Replication is the cross-chain composability strategy** (not proofs): chain-free IDs mean "the record is on your chain too" is a native SLOAD away — the same answer v2 gives, inherited intact.
5. **Honest cost vs. chain-native:** in Architecture A/B every write is contract-readable by default; here it is opt-in. If dapp-database composability over *most* records turns out to be load-bearing demand, records-first is the wrong architecture — that is decision-rule material (§15), not a footnote.

### (e) Signature portability vs identity durability

Resolved by splitting the jobs (identity-crux verdict): **authorization** (live, chain-scoped, replay-hostile — ERC-1271/4337/7702, session keys, the B′ account) stays on chains and never touches the archival layer; **authorship** (eternal, chain-free, replay-desired) is raw-key signatures + the carried KEL. The full construction is §3; the scorecard:

- Signatures: ECDSA/P-256, verify anywhere forever via pure functions; algorithm-tagged for PQ additivity; SLH-DSA (hash-only) named in the Codex as the conservative century successor.
- Durability: rotation, recovery (ranked rotation keys + pre-rotation digests), passkeys-as-signers (never as identity roots — vendor-locked, loss presumes a rotation layer), org thresholds, PQ migration as ordinary log events.
- Chain's role: total ordering + anti-equivocation for the KEL (what plc.directory fakes with a Swiss association and KERI buys with witness machinery, a chain does natively) — while remaining *replaceable*: the KEL is a portable artifact; chains witness it, they don't own it.
- **The prize, collected twice:** author-from-signature makes every submission relayable (gasless writes at the record layer AND the head layer, attester = user preserved, lenses intact, no shared-relayer identity — the write-UX memory constraint dissolves rather than being worked around).

---

## 9. Where portability genuinely stops

1. **Currency does not travel.** A bundle proves what existed and what A's head was as-of its anchors; it can never prove no-newer-head exists. Offline verification of *currency* is impossible in every architecture; here it is explicit and bounded rather than implicit.
2. **Anchor verification needs surviving header chains.** Existence-by-T proofs die if the archive community fails to ERS-renew anchors onto living chains before old chains' verification becomes exotic and before hash/signature epochs close (RFC 4998 renewal is a *community maintenance liveness assumption* — someone must run the cron job each decade; it does not require authors to be alive, but it requires the archive to be alive).
3. **Post-CRQC, unanchored signatures are worthless as evidence.** The free periphery (records never anchored or registered) loses evidentiary value entirely at the secp256k1/P-256 retirement epoch. Only the anchored core degrades gracefully ("before epoch E"). The tiering is honest: permanence-grade = registered + anchored (+ surfaced for bytes-on-chain).
4. **Live-authorization artifacts don't travel, by design.** Nothing signed via ERC-1271, session-key 4337 userOps, or EAS delegation is ever an archival authenticity artifact. Smart-account-only authors who never incept a KEL and never bind an EOA-class key have msg.sender-grade history only (same as Architecture B) — the SDK's job is to make KEL inception the default so this class is empty.
5. **Cross-author-interleaving semantics** (LIST caps; any future global admission rule) are chain-local, never portable.
6. **Wall-clock time is only ever bounded above** (anchor) and asserted (authorTime); a 100-year citation trusts the earliest surviving anchor, nothing else.
7. **The spam credential doesn't travel:** a chain's head-registration scarcity means nothing to a reader who doesn't trust that chain; lens policies name which chains' registrations they accept (Sigsum-style policy files).

---

## 10. Adoption / DX story

**Dapp developer:**
- `efs.write(...)` — instant, free, local; returns IDs computed offline (same as v2 promise).
- `efs.publish()` — pushes to the user's repo host + registers head (relayer-sponsored by default; the dapp's paymaster can sponsor without touching authorship).
- `efs.resolve(path, {lens})` — verified read by default (heads + proofs under the hood; the verified path must be the lazy path or developers will strip it — the Jetstream lesson).
- `efs.surface(records, chain)` — with a gas quote; the only call that costs real money.
- Contracts: `IEFSKernel.getObject/getSlot/headAge` + a reference `EFSGate` access-control contract (the Coinbase-Verifications on-ramp pattern).
- No indexer trust anywhere; a subgraph-quality index is buildable from repo sync + head registry alone.
- What's harder than Web2: two-plane mental model (published vs surfaced), head/staleness concepts in UI, and the SDK's key-management surface (session keys certified in a KEL). What's harder than v2: repos/hosting exist at all.

**End user:**
- Onboards with a wallet (EOA = identity immediately) or fresh (SDK incepts a KEL, deploys nothing on-chain until first head registration ≈ one cent, sponsorable).
- Writes feel like Web2: instant, free, no popups after the per-device key ceremony.
- One visible tier choice: "published" (free, best-effort persistence, revocable-fast) vs "made permanent" (anchored/surfaced, visible one-time cost) — the durability-class labeling v2 already mandates, now with a real price difference to label.
- Multi-device: sign in on a new device = one wallet ceremony certifying a new session key; repo host syncs state; fork = a merge prompt, never a bricked identity.
- Deletion story is honest: unpublish is fast and provable to honest readers; bytes already copied are copied; private data is encrypted and delete = key destruction.

**Who runs what:** repo hosts (commodity static storage + a tiny serializer — Sunlight-class weekend software); relays/indexes (lens-scoped, fundable per community); archives (lens-scoped LOCKSS with hash-verified repair); anyone can self-host all three from a laptop and a cron job. The design's institutional honesty requirement: each of these roles is named in the stewardship doc with a death-and-succession story — Ceramic died of an unnamed, unfunded, allowlisted service; every service here is permissionless and bypassable by self-submission.

---

## 11. Gas / cost sketch (order-of-magnitude, mid-2026 prices)

| Action | Chain gas | $ (L2, post-Fusaka) | Cadence |
|---|---|---|---|
| Create/sign record | 0 | $0 | per write |
| Repo hosting | 0 | ~$0–2/mo commodity | continuous |
| KEL inception (registry) | ~100–200k | ~$0.001–0.02 | once |
| Head registration | ~40–80k (first), ~25–45k (update) | ~$0.0005–0.01 | per epoch/publish |
| Batched head reg (aggregator, per head) | ~10–20k | ~$0.0002–0.002 | per epoch |
| Anchor root (amortized over N records) | ~50k / batch | ≈ $0 per record | per epoch |
| Surface small file DAG (full v2 indices) | ~8.5–9.5M (v2's 9–10M minus EAS overhead, plus sig verifies) | ~$0.10–0.50 L2; ~$25–30 L1 | opt-in |
| Non-inclusion strike of stale surfaced claim | ~50–150k | ~$0.001–0.02 | as needed |
| Bulk bytes | unchanged two-plane (SSTORE2 / Arweave-class ~$2–5/GB / mirrors) | — | — |

The decisive line: **a social-class user (1,000 events/day) costs ~one head registration/day ≈ $0.001–0.01/day, under Farcaster's demonstrated $7/yr ceiling with room to spare, with zero pruning.** Class-2 stranger-write apps (comments, feeds, reviews — the apps gas-as-write-cost prices out at ~$0.001/interaction) become viable without giving up authenticated authorship. This is the single largest capability delta over chain-native architectures.

---

## 12. Migration from today's prototype

Sequencing truth first: the transition plan's **one-freeze pledge means this decision cannot be made after v2 ships.** Records-first either rides the v2 ceremony (as its superset) or waits for a fork-level event. It is a Phase-0 substrate decision, same class as the §6/§9 duplicate-policy × replication-model call — which it also *answers* (model C with authentication; owned-kind duplicates idempotent).

What survives from v2 wholesale (the migration is smaller than it looks because v2 did the hard identity work):
- The entire deterministic-ID Codex: domains, kind tags, derivations, canonical names, golden vectors, `@efs/ids`, typed literals, slot IDs, blinded/salted anchors, kind-attachment matrix.
- Schema payload field strings (§3 table) — reused as record payloads byte-for-byte.
- All resolver validation logic (~2,900 LoC) — ports into the kernel as internal modules (coupling audit: 10–20% of lines touched).
- Lens semantics, first-attester-wins, viewer sovereignty, conventions bundle (dirnodes, move doctrine, encryption, link grammar, mirror fallback).
- Index shapes, event set, state-walk doctrine — now per surfacing kernel.

What changes:
- **EAS exits the trust base** (statement layer moves to records; the audit's native-kernel path, already costed at ~500–900 new LoC with verification as the real cost). EAS behavioral pins, bytecode hashes, and the multiAttest ordering protocol leave the Codex; the record/head/MST/KEL specs enter it (net: a bigger Codex — §14.5).
- **New Etched surfaces:** record envelope, sig domains, KEL event format, head format, MST node encoding, anchor/receipt formats, epoch table. Each needs golden vectors + cross-language fuzz + external review — the verification burden roughly doubles v2's, and v2's own estimate already said verification drives the schedule. Realistic increment: +4–8 weeks over the v2 plan, dominated by spec review, not code.
- **Devnet data:** none is real (devnet-only, resets weekly); re-genesis is free. Sepolia v1 disposition proceeds as already planned.
- **Deferrable without loss:** repo-host software, relays, anchoring accumulators, and the surfacing kernel's non-registry indices can all ship after the freeze — only the *artifact formats* (record/head/KEL/MST/anchor) are now-or-never. A viable staging: freeze formats in the v2 ceremony; ship chain-plane-only operation first (every record surfaced immediately = v2 behavior, records as the canonical form); grow the free tier afterward. **This staging is the risk-bounded path: EFS never operates below v2's guarantees; the record plane is strictly additive capability.**

---

## 13. What breaks first at 100 years (ranked)

1. **Free-tier availability (years 3–10).** Repo hosts and relays decay exactly like Nostr relays (95% underwater), IPFS pinning (free tiers extinct 2024–25), and pubs (grant-cliff death). Everything not lens-replicated by a funded archive or surfaced/anchored on-chain rots first. Mitigation is honesty, not hope: durability-class labels, lens-scoped archival as the blessed form, "make permanent" as a first-class product action. The free tier is a publishing medium, not an archive — the architecture must never market otherwise.
2. **Head-cadence decay (years 5–30).** Authors die or stop; their last registered head freezes; their subtree's currency degrades to "as of 2041" — by design (a dead author's state SHOULD freeze), but every reader must see the age, and lens policies must decide staleness handling. Failure mode if unspecced: clients silently serving decades-stale state as current.
3. **Anchor-renewal lapse (years 10–40).** If nobody runs the ERS re-anchoring cron before origin-chain verification exotifies and before the ECDSA epoch closes, existence-proofs become expert-only and then evidentiary-dead. This is the architecture's institutional heartbeat; it belongs in the stewardship doc with a named successor process.
4. **CRQC epoch (2030s per consensus of estimates).** Registered/anchored core degrades gracefully to "before epoch E"; the never-anchored periphery becomes unattributable. Pre-rotation digests protect rotation authority; algorithm-tagged keys make PQ additive; the epoch table is Codex-stewarded.
5. **Spec/interpretation rot (years 30–100).** The Codex is bigger than v2's (record+head+MST+KEL+anchor formats). Self-hosting at genesis, the executable acceptance test (fresh implementation from Codex + snapshots alone), and boring encodings (abi.encode, keccak, ecrecover) are the countermeasures; CESR/KERI's fate is the warning against any exotic encoding.
6. **What does NOT break:** object identity (pure functions of payloads), signature verification of anchored records (hashes + header chains), lens semantics (pure functions over per-author state), and the surfaced tier on any chain that still runs.

---

## 14. Pre-concessions for the red team

1. **The full recipe is unproven.** Signed state roots (ATProto), permissionless anchoring (OpenTimestamps), chain-registered per-author logs (nobody), lens-scoped replication (SSB) have never run *together*. Farcaster's deltagraph post-mortem is the strongest counter-evidence that "signatures + replication" ends in a chain; my rebuttal (they lacked heads, permissionless anchors, and lens-scoped sync — and their killers were global rate limits and pruning, both absent here) is an argument, not a demonstration.
2. **Revocation staleness and the strike-incentive gap are real.** Bounded-staleness is not instant; stale surfaced caches persist where nobody pays to strike them. Moderation-critical apps must live on the fast-registration path, and the freshness-horizon machinery must actually ship in contracts and SDKs or it decays into decoration (CT's lesson: an enforcement locus is required — here it is the SDK/kernel refusing unproven or over-age reads).
3. **Complexity budget.** Two planes, five new frozen formats, repo/host/relay software, fork-merge UX, head-age semantics. v2 alone is one freeze and zero new infrastructure roles. Every research autopsy says complexity kills adoption before cryptography does (KERI, SSB). The staging in §12 (formats frozen, chain-plane-first operation) is the mitigation; it is also an admission that records-first can soft-fail into "v2 with extra ceremony" if the free tier never earns its keep.
4. **web3:// and verify-with-only-an-RPC narrow to the surfaced tier.** Chain-native EFS answers every read from chain state; records-first answers only surfaced reads that way. The zero-infrastructure read story for the free tier requires repo hosts to exist — infrastructure with its own availability politics.
5. **Codex growth is freeze-risk.** More frozen bytes = more places for a forSchema-class flaw. The external-review surface roughly doubles. If review capacity is the binding constraint, that alone argues for v2-only.
6. **The one-address UX story bends.** Identity = I (32 bytes) with the B′ address derived from it keeps "one address," but org identities (threshold KELs) and the EOA-degenerate/log-identity split add real UX and support surface that Architecture B never pays.
7. **Discovery/cold-start** inherits SSB's weakness in exact proportion to how seriously lens-scoped replication is taken. Competing labeler lenses are a market design, not a guarantee.

---

## 15. Decision rule

**Choose records-first iff ALL of the following hold:**

1. **Class-2 write economics are a must-serve product goal.** EFS intends to host stranger-write apps (comments, social, reviews) at ≤$0.001/interaction with authenticated per-user authorship — and sponsored-gas-on-cheap-L2 (Architecture A/B's answer) is judged inadequate because it retains per-write chain latency/cost coupling and a per-write chain dependency for the 90% of writes nobody will ever pay to make permanent.
2. **On-chain composability is confirmed narrow** — point lookups + on-chain bytes for ≤2 app classes, acceptable as paid opt-in per (record, chain). If contracts reading *most* EFS state ever becomes load-bearing, records-first is wrong.
3. **Bounded-staleness revocation is acceptable to the curation/moderation apps** — head-registration cadence (blocks-to-minutes on the fast path) meets the "curation IS mutation" requirement, with the freshness-horizon machinery shipped and enforced, not documented and hoped.
4. **The permanence promise is re-scoped honestly and that scoping is acceptable:** the 100-year guarantee attaches to the *registered + anchored (+ surfaced)* tier; the free tier is best-effort by design. If EFS's mission requires every write to be archival-grade by default, choose chain-native.
5. **Verification capacity exists** for roughly double v2's frozen-spec review (record/head/MST/KEL/anchor formats), and the one-freeze pledge is spent on this larger bundle knowingly.

**Choose against (fall back to v2 chain-native, keeping the record *envelope* as a dormant reserved format) if any of 1–5 fails** — most likely failure points, in order: (5) review capacity, (3) revocation staleness for moderation, (1) sponsored-gas proves sufficient for the only Class-2 demand that materializes.

A cheap hedge exists and should be taken regardless of the verdict: **freeze the record envelope + sig domains + KEL event format as reserved Codex sections in the v2 ceremony** (WHITEOUT-pattern reservation, ~2 of the 5 new formats, the two that are pure byte-layout with no infrastructure). That converts a future records-first pivot from "broken pledge" to "additive deployment," at the cost of external review for two format specs.

---

## 16. What this does to the v2 designs (survives / changes / dies)

**Survives unchanged:** the deterministic-ID Codex in its entirety (domains, derivations, kind tags, canonical names, typed literals, slot IDs, salted/blinded anchors, golden-vector discipline, `@efs/ids`); schema payload field strings; lens semantics + first-attester-wins + viewer sovereignty; statements/things split (deepened: statements become portable artifacts); conventions bundle (dirnodes, move doctrine, encryption, link grammar, mirror fallback, durability labels); state-walk doctrine; no-token/no-protocol-fee doctrine; paths-under-address naming.

**Changes:** replication model — §9's open question resolves to **model C with authenticated carriage** (the signature makes claimed-attester checkable; dead-publisher objects become permissionlessly replicable; owned-kind duplicate policy flips from REVERT to idempotent-by-recordHash). Revocation handles — EAS UIDs replaced by recordHashes (solving the slot-less-claim handle question). The §6/§9 coupled Phase-0 decision is thereby answered, not reopened. Temporal provenance (§3.3 workstream) is subsumed by heads+anchors. The trust-root stewardship doc grows the anchor-renewal heartbeat and repo-host/relay role obituaries. LIST maxEntries becomes chain-local-only semantics; SCC tie-break re-keys on sourceId.

**Dies:** EAS as substrate (ADR-0032) — the statement layer is records; per-chain kernels are native (the coupling audit's ledger is the execution plan); EAS behavioral pins/bytecode hashes leave the Codex. Sequential-nonce delegation as the gasless bridge. msg.sender as an authorship source anywhere above the execution shell. The assumption that one chain's state is ever the complete answer to "what exists" — replaced by graded, scoped existence with the chain as the premium grade.
