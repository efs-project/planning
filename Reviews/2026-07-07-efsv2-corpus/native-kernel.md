# EFS v2 Native Kernel — contract-suite architecture (spec-grade)

**Role:** Native kernel architect · **Date:** 2026-07-07
**Inputs:** carrier decision (2026-07-07), record-format investigation (2026-07-02), deterministic-ids Codex, substrate decision + arch-B red-team lessons, EFS↔EAS coupling audit, v1 contracts ground truth (`EFSIndexer.sol` 1,336 LoC, `EdgeResolver.sol` 994, `MirrorResolver.sol` 228, `ListEntryResolver.sol` 374, `ListResolver.sol` 99, `AliasResolver.sol` 210, `SystemAccount.sol` 463, `EFSRouter.sol` 1,158, `EFSFileView.sol` 1,021, `ListReader.sol` 164 — measured `wc -l` 2026-07-07).
**Status:** design for adversarial review. Every section carries its own failure modes; §14 is the self-red-team ledger (including three bugs found in the prior arch-B sketch and fixed here).

---

## 0. Interface assumptions (stated, not owned)

This design coordinates with the envelope spec conceptually but does not block on it. Everything below is assumed; if the envelope pass lands differently, the kernel adapts at the named seams and nowhere else.

| # | Assumption | Owner | Kernel seam if it changes |
|---|---|---|---|
| A1 | `EnvelopeHeader = {bytes32 author, uint64 seq, bytes32 prev, bytes32 recordsRoot, uint32 count}`; `Record = {uint8 op, bytes32 kindTag, bytes body}` | envelope spec | `_envelopeDigest()`, struct defs |
| A2 | Digest chain: `recordDigest_i = keccak(abi.encode(DOMAIN_RECORD_V1, uint256(op_i), kindTag_i, keccak(body_i)))`; `leaf_i = keccak(abi.encode(DOMAIN_LEAF_V1, uint256(i), recordDigest_i))` (index-committed); `node = keccak(abi.encode(DOMAIN_NODE_V1, left, right))` (domain-separated); at `count == 1`, `recordsRoot == leaf_0` (plain-typed-data degenerate case) | envelope spec | `_verifyRoot()`, `_verifyProof()` |
| A3 | EIP-712 signature over `Envelope(bytes32 author,uint64 seq,bytes32 prev,bytes32 recordsRoot,uint32 count)`; domain = `{name:"EFS", version:"1", salt:keccak256("efs.kernel.envelope.v1")}` — **no chainId, no verifyingContract** | envelope spec | one compile-time constant `EIP712_DOMAIN_HASH` |
| A4 | `seq` is a TID: microsecond wall-clock in high bits, ~10 device-discriminator bits low; `tidTime(seq) = seq >> 10` | envelope spec | `_tidTime()` |
| A5 | `prev` is evidence-only (tamper-evidence for contiguous logs); the kernel never admission-checks it | envelope spec + substrate §3.5 | none (kernel ignores it except in events) |
| A6 | ID derivations port verbatim from `planning/Designs/efsv2/deterministic-ids.md` §1 with the ANCHOR family renamed to the tag-core `tagId` (`tagId = keccak(abi.encode(DOMAIN, parentTagId, keccak(name), kind))`), and the attester word already widened to `bytes32` | ids Codex + tag-core pass | `@efs/ids` library, imported not re-derived |
| A7 | Record-kind set (working): objects `TAGDEF, DATA, PROPERTY, LIST`; claims `MIRROR, PIN, TAG, LIST_ENTRY, REDIRECT`; op `REVOKE`. The two open forks (MIRROR→reserved property key; REDIRECT→property) change the kind *table*, not kernel shape (§15) | tag-core pass | one dispatch-table row each |
| A8 | PIN cardinality-1 and TAG cardinality-N stay separate record kinds (flagged trap — not merged); DATA/LIST owned vs TAGDEF/PROPERTY unowned (opposite duplicate policies) | tag-core ruling | §3.6, §4.4 |

Terminology: **record** = one signed leaf; **claim** = an admitted record's on-chain instance (identified by `claimId`); **object** = a registry-instantiated identity (`tagId`/`dataId`/`propertyId`/`listId`); an object is created *by* a claim (its `firstClaimId`).

---

## 1. System map and contract inventory

```
                     ┌───────────────────────────── per chain ─────────────────────────────┐
signed envelope ───► │  EFSKernel (Etched, one address, zero admin, zero per-chain config)  │
(header, sig,        │   ├── SigGate         : EIP-712 digest + ecrecover → author word     │
 records[±proofs])   │   ├── Admission       : dedupe, TID bound, per-record dispatch       │
submitted by ANYONE  │   ├── Validation      : ported v1 per-kind semantics (internal libs) │
                     │   ├── ClaimStore      : claimId → meta + body   (state, not events)  │
                     │   ├── Spine           : allClaims[] append-only enumeration array    │
                     │   ├── ObjectRegistry  : id → firstClaimId       (write-once)         │
                     │   ├── SlotStore       : slotId → incumbent      (tombstone superses.)│
                     │   ├── NSets           : cardinality-N actives   (TAG/MIRROR/entries) │
                     │   ├── TagTree         : parent ptr + children   (path walk)          │
                     │   └── Events          : ID-keyed, full-payload (conveniences)        │
                     ├───────────────────────────────────────────────────────────────────── ┤
                     │  Redeployable: EFSRouter (web3://, ERC-5219) · EFSFileView ·         │
                     │  EFSKernelViews (paged enumeration) · ListReader · EASExporter ·     │
                     │  SSTORE2 chunk stores (EFSBytesStore, unchanged) · relayers          │
                     └──────────────────────────────────────────────────────────────────────┘
Replication = resubmit the same envelopes (or single proved leaves) to another chain's kernel.
```

**EIP-170 as a design forcing-function.** 24,576-byte runtime is a hard cap and ~2.5–3k LoC of dense Solidity flirts with it. The rule that follows (and independently improves the freeze): **the Etched kernel contains only writes, point reads, and raw public mappings. Every paged/enumerating/joining view is a redeployable stateless contract** (`EFSKernelViews`, `EFSFileView`, `ListReader`). This shrinks the Etched surface, keeps view bugs fixable forever, and keeps the kernel comfortably under the cap. If the kernel still busts the cap after views are evicted, the split line is per-kind validation into `internal`-library files first, then (last resort) an external `EFSValidation` contract — rejected as default because an external validator address becomes a second Etched artifact and a call-boundary to audit.

**One kernel contract, no proxy on mainnet, no constructor args, no owner.** Runtime bytecode must be byte-identical on every EVM-equivalent chain (this is load-bearing for §13 canonicity). All constants (domains, kind table, genesis blob hash, caps) are compile-time. There is no `initialize()` except `initializeGenesis(bytes blob)` (§13.3), which is permissionless, hash-gated, and idempotent.

---

## 2. Wire format and kernel-owned constants

Assumed formats are in §0. Kernel-owned constants (Codex chapter, printable preimages):

```solidity
// envelope layer (owned by envelope spec, pinned here for reference)
DOMAIN_RECORD_V1   = keccak256("efs.kernel.record.v1");
DOMAIN_LEAF_V1     = keccak256("efs.kernel.leaf.v1");
DOMAIN_NODE_V1     = keccak256("efs.kernel.node.v1");
DOMAIN_ENVELOPE_V1 = keccak256("efs.kernel.envelope.v1");

// kernel layer (owned here)
DOMAIN_CLAIMID_V1  = keccak256("efs.kernel.claimid.v1");
SYSTEM_AUTHOR      = keccak256("efs.system.v1");        // genesis author word (§13.3)

envelopeDigest = keccak256(abi.encode(DOMAIN_ENVELOPE_V1, author, uint256(seq), prev, recordsRoot, uint256(count)));
claimId        = keccak256(abi.encode(DOMAIN_CLAIMID_V1, envelopeDigest, uint256(index)));
```

### 2.1 `claimId` adjudication (the revocation/reference handle)

The kernel needs a per-admitted-record handle: REVOKE targets it, slots point at it, the registry's `firstClaimId` is it, MIRROR/REDIRECT (slot-less by ADR-0015 doctrine) are revoked by it. Candidates:

| Handle | Chain-free | Client-computable pre-submit | Unique under (author,seq) collision | Unique for identical re-signed bodies | Verdict |
|---|---|---|---|---|---|
| EAS UID (v1) | no (timestamp) | no | — | yes | dead with EAS |
| `recordDigest` | yes | yes | yes | **no** (same body twice = same digest; revoking one revokes "both") | reject |
| `H(author, seq, idx)` (arch-B) | yes | yes | **no** — two envelopes at the same `(author,seq)` (legal, §3.5) collide | yes | reject — **bug found in arch-B, fixed here** |
| `H(envelopeDigest, idx)` | yes | yes (envelope digest known before broadcast) | yes (different roots → different digests) | yes | **ruled** |

`claimId = keccak(DOMAIN_CLAIMID_V1, envelopeDigest, index)` is globally unique per admitted record, identical on every chain the same envelope lands on (so a REVOKE written once names the same claim everywhere — portable revocation), and computable offline. This closes coupling-audit open question #1 with no nonce machinery.

**Kind codes.** On the wire, `kindTag` is the full spec-owned `bytes32` constant (self-describing, survives the kernel). In storage the kernel maps it through a **frozen compile-time table** to a `uint8 kindCode` (1 byte instead of a slot). Unknown kindTag → revert `KindUnknown()`. Codes `0xE0–0xFE` are **reserved-reverting** for the KEL/KEYGRANT-class identity records (substrate reservation §3.3): the tags `keccak("efs.kind.kel.incept.v1")` etc. are *defined in the Codex now with golden vectors*, mapped to reserved codes, and `KindReserved()` reverts on them in kernel-v1 — that is the mechanical shape of "format frozen, machinery absent" (§6.2).

**Caps (Etched):** `MAX_TAG_DEPTH = 32` (ports v1 `MAX_ANCHOR_DEPTH`), `MAX_URI_LENGTH = 8192` (ports), `MAX_BODY_LENGTH = 16384` (new; bounds SSTORE loops; MIRROR's 3 words + 8,192-byte URI fits), `MAX_NAME_LENGTH = 512` (tag-core owns the final number). No cap on `count` — gas is the natural cap, and a frozen count cap is an irreversible assumption with no attack it prevents.

---

## 3. Entrypoints and admission

```solidity
interface IEFSKernel {
    // ── writes: anyone may call; author comes ONLY from the signature ──────────
    function submit(
        EnvelopeHeader calldata h,
        bytes calldata sig,
        Record[] calldata records          // full batch: all `count` leaves, in order
    ) external returns (bytes32 envelopeDigest);

    function submitSubset(
        EnvelopeHeader calldata h,
        bytes calldata sig,
        Record[] calldata records,         // any coherent subset
        uint32[] calldata indices,         // strictly increasing, each < h.count
        bytes32[][] calldata proofs        // per-record Merkle path to h.recordsRoot
    ) external returns (bytes32 envelopeDigest);

    // ── point reads (the composability surface; enumeration lives in views) ────
    function getObject(bytes32 id) external view
        returns (bool exists, uint8 kindCode, bytes32 author, bytes32 firstClaimId);
    function getClaim(bytes32 claimId) external view
        returns (ClaimStatus status, bytes32 author, uint8 kindCode, uint64 seq, uint32 idx, bytes memory body);
    function getSlot(bytes32 slotId) external view
        returns (SlotStatus status, bytes32 claimId, bytes32 targetId);   // status ∈ {Empty, Active, Tombstone}
    function getRevocation(bytes32 claimId) external view returns (bytes32 revokedBy); // 0 if unrevoked
    function getTagParent(bytes32 tagId) external view returns (bytes32);
    function claimCount() external view returns (uint256);                 // spine length
    function claimAt(uint256 i) external view returns (bytes32);           // spine read
    // raw public mappings additionally exposed for redeployable views (§4)
}
enum ClaimStatus { Absent, Active, Revoked, Evidence }   // read-grade vocabulary, §9.4
```

`msg.sender` appears nowhere in authentication, identity, or index keys. It is not even logged by the kernel (the tx already records it); relayers, paymasters, friends, and archivists are all equivalent submitters.

### 3.1 Verification order (frozen, in this exact sequence)

1. **Shape:** `count >= 1`; full-batch: `records.length == count`; subset: `indices` strictly increasing, all `< count`, `records.length == indices.length`; every `body.length <= MAX_BODY_LENGTH`.
2. **Author-kind dispatch:** `h.author != SYSTEM_AUTHOR` (closes genesis-word forgery exactly, §14.9); top-96-bits-zero → bare-EOA rule; anything else → `IdentityKindReserved()` (§6).
3. **Signature:** compute `structHash` per A3, `digest = keccak(0x1901 ‖ EIP712_DOMAIN_HASH ‖ structHash)`; `ecrecover` with low-`s` and `v ∈ {27,28}` canonicality enforced (OZ ECDSA); recovered address must equal `address(uint160(uint256(h.author)))`.
4. **Root binding:** full-batch — recompute leaves and fold the tree in memory, require `== h.recordsRoot`; subset — verify each `(leaf_i, indices[k], proofs[k])` against `h.recordsRoot` with index-committed leaves and domain-separated nodes (A2).
5. **TID hygiene bound:** `_tidTime(h.seq) <= block.timestamp + 900`. Future-dating rejected; **past unbounded** (a 2030 envelope admits fine in 2090 — replay is the feature). This is hygiene, not security: with position-scoped keying the only person an author can cheat with `seq` games is themselves, and REVOKE beats any supersession-lock. Documented consequence: an envelope rejected as future-dated on a chain whose clock lags will admit later — convergence is delayed, never broken.
6. **Per record, in submitted order:** admission (§3.2).

Steps 1–5 cost is paid once per envelope; there is no per-record signature and no nonce (avoid-list #2 of the coupling audit: sequential nonces serialize multi-device writers and are the wrong replay answer for a system that wants deliberate replay).

### 3.2 Per-record admission: validate-then-commit

For each record at envelope index `i`:

```
claimId = H(DOMAIN_CLAIMID_V1, envelopeDigest, i)
if claims[claimId] exists              → SKIP (idempotent; emit nothing)      // §3.3
op dispatch:
  ASSERT → kind dispatch → _validate<Kind>(author, body)                      // ported v1 semantics
           → duplicate-policy branch (§3.6)
           → commit: spine push, claim store, registry/slot/N-set/tree writes, events
  REVOKE → §5
  other  → revert OpUnknown()
any validation failure → revert the WHOLE call (empty-state-diff invariant)
```

**Atomicity is by construction:** one function, one revert scope, one store. There is no EAS `_db`-populated-before-hooks divergence to footnote around; the "one existence rule" of deterministic-ids §5 collapses into ordinary sequential execution.

**Parents-first is enforced as a per-record dependency-existence rule, not a kind-order rule.** Every `_validate<Kind>` checks its references against the registry *at that record's validation time* — which already contains everything committed earlier in the same call. A PIN at index 5 referencing a TAGDEF minted at index 3 validates; the reversed order reverts `MissingDependency(index, id)`. The `[DATA][LIST][TAGDEF ancestors-first][PROPERTY][MIRROR][PIN][TAG][LIST_ENTRY][REDIRECT]` ordering of deterministic-ids §5 is therefore an SDK construction convention that trivially satisfies the kernel rule; the kernel never hardcodes the group order (a frozen group list would be an irreversible assumption the dependency rule makes unnecessary). The batch-shuffle invariant test ports: any mis-ordered batch reverts with zero state diff.

**Subset admission** runs the identical loop. A subset referencing an id not yet on this chain reverts — replicators copy dependencies first (parents-first across envelopes is the replicator doctrine, §9.3). Already-admitted records inside a replayed batch SKIP rather than revert, so partial-then-full replication converges: replay of envelopes is monotone and idempotent at record granularity.

### 3.3 Idempotency and `(author, seq)` collisions

- The idempotency key is **`claimId`** (hence `envelopeDigest`), never `(author, seq)`.
- **Same `(author, seq)`, different digest → both admissible.** Per substrate reservation §3.5, record-level seq collisions are **never duplicity** (two honest devices with colliding device bits must not manufacture equivocation evidence — the SSB death). The kernel keeps no `(author, seq)` uniqueness state at all. Ordering among same-seq claims is resolved by the deterministic slot comparator (§4.3). *This deletes arch-B admission rules 1–2, which were also internally incoherent (`REVERT + DuplicityDetected` event — a revert erases its own event). Second arch-B bug found and fixed.*
- Exact resubmission (any submitter, any chain) is a cheap no-op. Front-running someone's `submit` is strictly beneficial to the author: intended state lands, someone else paid.

### 3.4 What `submit` does NOT check

- `prev` linkage (A5) — sparse admission is what makes partial replication and backfill order-free.
- Cross-record semantic coherence beyond dependencies (a self-contained-unit convention is app/SDK layer — record-format ledger row 1).
- Any freshness, head, or completeness property (not sold — substrate ruling).

### 3.5 Gas sketch per canonical flow

Orders of magnitude, cold-slot pricing, to be replaced by the CI gas-snapshot gate before freeze (deterministic-ids §12 discipline — these numbers are estimates, not measurements):

| Component | Cost | Notes |
|---|---|---|
| Envelope fixed | 21k base + ~3k ecrecover + ~1–2k EIP-712 + calldata (≈16/byte) + full-batch tree fold ≈ 0.6k×N | once per submit |
| Subset extra | ~0.4–0.6k × ⌈log2 N⌉ per record | proof hashing |
| Spine push | ~22–27k | §4.2 — the price of state-walk enumerability |
| Claim meta | ~66k (3 slots: author, envelopeDigest, packed) | §4.1 |
| Body storage | 22.1k/word | PIN 5 words ≈ 110k; TAGDEF name 2–4 words; MIRROR with 2KB `data:` inline ≈ 1.5M |
| Registry write | ~22k | objects only |
| Slot/N-set/tree/index writes | ~44–250k per record by kind | ports v1 index shapes |
| REVOKE record | ~110–150k total | spine + meta + 1-word body + revokedBy slot + N-set/slot cleanup |

Flows (single envelope unless noted): **placement update (re-PIN)** ≈ 0.25–0.35M · **new folder (TAGDEF)** ≈ 0.30–0.45M · **revoke one claim** ≈ 0.15–0.2M · **small file, 8 records, 2KB inline** ≈ 3.5–5.5M · **same file + ancestor visibility TAGs** rides a follow-up envelope exactly as v2-on-EAS specced. Directionally ≈5–10% under the v2-on-EAS baseline (drops the ~7-slot EAS record, the UID grind, per-group CALL/ABI overhead, and ~25 `getAttestation` join reads), **plus** the new spine cost (~+22k/record) — net still below EAS. Gas remains not-the-argument.

---

## 4. Storage (ERC-7201 namespaced, layout frozen in the Codex)

All state lives in namespaced structs with **documented slot derivations** — the layout is a Codex chapter because `eth_getProof` against these slots is the trustless off-chain read path (§9.2) and the state-walk decodes a raw state dump (§8). Mainnet has no proxy, so the layout is genuinely frozen (no upgrade-shift risk).

### 4.1 Claim store

```solidity
struct ClaimMeta {
    bytes32 author;          // slot +0 : identity word (bytes32, not address — reservation §3.1)
    bytes32 envelopeDigest;  // slot +1 : full digest — needed by the slot comparator (§4.3)
    uint64  seq;             // slot +2 packed: seq(8) ‖ idx(4) ‖ kindCode(1) ‖ flags(1) ‖ spare(18)
    uint32  idx;
    uint8   kindCode;
    uint8   flags;           // bit0 = evidence (§3.6); bits1–7 reserved (MUST be zero in v1)
}
mapping(bytes32 claimId => ClaimMeta)  claims;
mapping(bytes32 claimId => bytes)      bodies;      // full record body — see storage-depth ruling below
mapping(bytes32 claimId => bytes32)    revokedBy;   // claimId of the admitted REVOKE; 0 = unrevoked
```

**Storage-depth ruling (coupling-audit open q. #2): full bodies live in state, not only in events.** Three independent reasons: (a) the state-walk doctrine — EIP-4444 history expiry makes any event-dependent reconstruction a broken 100-year promise; (b) on-chain composability — `getClaim` returns body bytes synchronously (the two proven app categories are point reads of exactly this shape); (c) the read views (router mirror URIs, property values, list configs) need payloads without an external store. This is the same bytes EAS stored in `_db`, minus EAS's ~4 dead slots per record. Deferred perf lever (correct > easy > fast): per-kind body elision where indices are provably lossless — do not take it at freeze.

### 4.2 The enumeration spine (new, load-bearing — James-visible cost decision)

```solidity
bytes32[] allClaims;   // append-only; every admitted record incl. REVOKEs, evidence, genesis
```

**Why it exists — third bug found (in both arch-B and the v2-on-EAS design): mappings are not enumerable from state.** Every store above is keyed by a hash. A raw state dump gives slot→value pairs whose *keys* cannot be inverted, so without a spine, a from-state-alone reconstruction cannot even enumerate what exists — the deterministic-ids §4 pledge ("registry state reconstructible from a documented state-walk, never dependent on event logs") was **unimplementable as written** on either substrate; under EAS it silently leaned on EAS's `_db` values being self-describing structs, which EFS's own indices are not. The spine repairs it: iterate `allClaims`, read `claims[id]`+`bodies[id]`, replay admission (§8). Cost: one array push per record (~22–27k, ~7–15% of a typical record's total). Cheaper graded fallback if James rejects the cost: spine for **objects only** + envelope archives for claims — this downgrades "state alone rebuilds reads" to "state alone rebuilds the namespace; claims need archived envelopes," and must be labeled as such in the Codex. Recommended: pay full spine; it is the archival property the whole carrier decision is priced on.

### 4.3 Object registry, slots, N-sets, tag tree

```solidity
// registry — write-once, first-writer-wins, kind derivable via firstClaimId
mapping(bytes32 id => bytes32 firstClaimId) registry;

// cardinality-1 (PIN family) — tombstone supersession, §5.2
struct SlotEntry { bytes32 claimId; bytes32 targetId; }   // targetId cached for O(1) composability reads
mapping(bytes32 slotId => SlotEntry) slots;               // slotId per deterministic-ids §1 (author inside the key)

// cardinality-N (TAG, MIRROR-per-DATA, LIST_ENTRY-as-edge) — ports EdgeResolver/ListEntryResolver shapes
struct NEntry { bytes32 claimId; int256 weight; }         // weight meaningful for TAG only; 0 otherwise
mapping(bytes32 familyKey => NEntry[])                     nActive;       // familyKey = H(claimRole, defId/listId, author, targetKind/…)
mapping(bytes32 familyKey => mapping(bytes32 => uint256))  nIndexPlusOne; // O(1) membership + swap-and-pop
mapping(bytes32 listId => mapping(bytes32 identityKey => mapping(bytes32 author => uint256))) entryCount; // list dup/cap checks

// tag tree (the path structure) — ports _parents/_children/_childrenBySchema keyed on tagIds
mapping(bytes32 tagId => bytes32)                 tagParent;
mapping(bytes32 tagId => bytes32[])               tagChildren;
mapping(bytes32 tagId => mapping(uint8 => bytes32[])) tagChildrenByKind;

// per-author visibility/lens indices — ports the deterministic-ids §12 KEEP set only:
//   containsBy[tagId][author], childrenByAuthor[tagId][author][], referencingByAuthor[targetId][author][]
```

The **keep/demote line ports unchanged**: `_sentAttestations`, `_receivedAttestations`, global `_schemaAttestations`, `_allReferencing` are **not** kernel state (event-derived, labeled-untrusted discovery). `dataByContentKey` stays dead. Note the spine is not a resurrection of `_allReferencing` — it is ordered-by-admission, carries no per-target/per-author keying, and is never a read index; reads that would need demoted indices answer from events or from a state-walk replay, both labeled untrusted-discovery.

### 4.4 What the kernel deliberately does NOT keep (and how reads answer)

| Not kept | Why | How the question is answered |
|---|---|---|
| Author heads / highest-seq / envelope counts | HEAD machinery is un-sold cross-chain currency (substrate §4); a chain-local head invites misreading as freshness | "latest on this chain" = event scan or state-walk replay, labeled *as of this chain's admitted set* |
| CHECKPOINT / state-root records | same ruling; op byte has no checkpoint value in v1 | absence-of-claim on the **home chain** is proven by total state; cross-chain it is *unknown* (§9.4) |
| `(author,seq)` uniqueness / duplicity ledger | §3.3; seq collisions are never duplicity | equivocation about *objects* is the evidence flag (§3.6); log forks are lens/watcher layer with the two signed envelopes as self-contained proof |
| `prev` linkage state | sparse admission (A5) | year-100 verifiers get hash-chain integrity where logs happen to be contiguous; ordering otherwise from `seq` |
| Envelope headers/sigs in state | ~3 slots/envelope buys only artifact re-export, which archives + calldata + events already carry | portable artifacts come from calldata/logs/archives; state answers *reads*, and `claimId` binds any held envelope to state |
| Foreign-attestation indexing (v1 `index()`/`indexBatch()`, ADR-0033 raw EAS containers) | EAS is no longer the substrate | optional EAS interop lives in redeployable views only, or dies (fork routed upward, §15) |
| Global name→id directory (`_nameToAnchor`) | tagId is client-derivable; registry lookup on the derived id replaces the 3-level mapping | `getObject(deriveTagId(parent, name, kind))` — O(1), and the name bytes live in the TAGDEF body for reverse reads |

---

## 5. Revocation

### 5.1 Semantics

A REVOKE is an ordinary signed record: `op = REVOKE`, `body = abi.encode(bytes32 targetClaimId)`. Admission requires:

1. `claims[targetClaimId]` exists on this chain (else revert `MissingDependency` — replicators carry the target before/with its revoke);
2. `claims[targetClaimId].author == h.author` (only the author revokes their own claims — ports EAS `AccessDenied` semantics);
3. target kind is revocable: claims yes (PIN, TAG, MIRROR, LIST_ENTRY, REDIRECT), objects no (TAGDEF, DATA, PROPERTY, LIST → revert `Irrevocable()` — path permanence and interned values are 50-year properties);
4. target is not evidence-flagged (evidence is never "active", nothing to revoke);
5. `appendOnly` list entries → revert (ports ListEntryResolver).

Effects: the REVOKE itself is admitted as a claim (spine + store — the author's log stays complete); `revokedBy[target] = revokeClaimId` **iff currently zero** (first revoke wins; a second REVOKE of the same target admits as a record but is a state no-op — monotone, replay-friendly, never reverts). Revocation is **monotone**: no un-revoke, ever. Slot/N-set cleanup per §5.2. `ClaimRevoked` event.

Portability: `claimId` is chain-free, so one signed REVOKE names the same claim on every chain and replays everywhere the data went — propagation free and portable (strictly better than EAS's chain-local, msg.sender-keyed revocation). Completeness stays best-effort cross-chain exactly as the carrier decision prices it: the kernel can never prove a withheld revoke's absence; apps use author-set EXPIRY for safety-critical data (expiry is an app-layer property convention, deliberately **not** a kernel field — EAS's `expirationTime` was rejected by every v1 resolver and stays dead).

### 5.2 Tombstone supersession (slot semantics, convergence-bearing)

Slot state must be a pure function of the admitted set (the convergence invariant: for any two chains and any admitted subsets S1, S2 of an author's records, admitting S1 ∪ S2 on both yields identical state). Two naive options fail:

- *v1 clear-to-empty on revoke*: chain A admits {P1, P2, revoke(P2)} → empty; chain B admits {P1} then syncs {P2, revoke(P2)} → also empty; but chain C that got {P2, revoke(P2)} first and {P1} later would resurrect P1 only if comparison is against "empty" — divergent.
- *max over unrevoked set* (resurrection): requires per-slot history arrays; also resurrects placements the author already moved off — zombie reads.

**Ruled: tombstone supersession.** The slot always points at the claim with the highest position among **all** admitted claims in the slot, revoked or not; readers treat a revoked incumbent as empty (`SlotStatus.Tombstone`). Total order on claims within a slot:

```
(seq, envelopeDigest, idx)  — lexicographic
```

— within one envelope, `idx` preserves the author's intra-batch order; across envelopes at equal `seq` (legal, §3.3), `envelopeDigest` is an arbitrary-but-deterministic tie-break; across seqs, `seq` decides. Join of any two slot states = greater position wins; equal position ⇒ same claim ⇒ revocation bit ORs monotonically. This is a join-semilattice ⇒ replay-order-independent ⇒ the invariant-suite property "same admitted set, same state, any order, any chain" is testable and true. A newer claim replaces a tombstone normally; nothing ever resurrects. (Self-backdating games order only the author's own slot — the only person cheated is themselves.)

N-set members don't need the comparator (each entry is independent); revoke = swap-and-pop, ports verbatim.

---

## 6. Identity

### 6.1 Year-0 verify path (bare-EOA first-class)

```solidity
if (h.author == SYSTEM_AUTHOR) revert AuthorReserved();
if (uint256(h.author) >> 160 != 0) revert IdentityKindReserved();   // digest-shaped: reserved, §6.2
address a = address(uint160(uint256(h.author)));
require(ECDSA.recover(digest712, sig) == a, BadSignature());
```

- The author word is `bytes32` end-to-end (derivations, storage, events) — reservation §3.1 honored; address-shaped words occupy the 96-leading-zero subspace (2^96 grinding to collide from keccak outputs, same argument as deterministic-ids §1).
- EIP-7702-delegated EOAs work unchanged (the key still signs).
- **ERC-1271 is never an authenticity root** — a Safe/smart-account "signature" verifies only against live code on one chain and the ecosystem is making it deliberately less portable (ERC-7739). Consequence stated loudly: **a Safe cannot be an author in v2 year-0.** DAO/org personas either (a) write through a designated EOA signer today and merge identities at the lens layer later, or (b) wait for the KEL tier and hold raw cold pre-rotated keys. There is no third option; pretending otherwise re-opens the msg.sender hole.
- P-256/passkey: **signers-not-identities** is the reserved model; year-0 kernel verifies secp256k1 only. The P-256 verify branch (EIP-7951 precompile) arrives with the KEL tier, because without key logs a raw P-256 credential would *be* an identity — the exact one-key-trap the reservation exists to avoid.

### 6.2 The KEL reservation — mechanics adjudicated

The question with teeth: *how is the reservation additive later, concretely?* Three candidate mechanisms:

**R1 — reserved registry address (rejected).** Kernel holds an immutable pointer to a CREATE3-precomputed `IdentityRegistry` address; digest-shaped authors dispatch there iff code exists. Rejected because **you cannot cryptographically pre-commit to unwritten code**: the kernel cannot pin an EXTCODEHASH for a contract that doesn't exist, so whoever controls deployment at the reserved address on each of hundreds of chains controls digest-shaped authentication there — a per-chain trust root smuggled into an Etched artifact. Worse optics than the problem it solves.

**R2 — chained kernel succession (ruled).** Kernel-v1 is complete and closed: digest-shaped authors revert. When the KEL machinery is built, reviewed, and its formats' golden vectors already sit in the Codex, a **successor kernel** deploys (same envelope format, same IDs, same claim/slot semantics, plus the KEL module and the reserved kindCodes un-reverted). The successor holds an immutable pointer **backwards** to kernel-v1 and read-throughs:

- `registry`: v2.getObject falls back to v1 (write-once respected across the pair — v2 refuses to instantiate an id v1 already holds);
- `slots`: v2.getSlot compares its local incumbent against v1's under the §5.2 comparator;
- `revocations`: v2 checks both.

Old kernel never changes and never learns about the new one; readers and routers point at the newest kernel and get the union. Cost: one extra cold external read on fallback paths after a succession event (expected once, if ever, pre-CRQC). This is the same succession doctrine the hash-migration playbook already commits to — one mechanism for both contingencies, documented in the Codex succession chapter (§16). *Trade admitted:* until succession, digest-shaped identity exists only as frozen bytes (vectors, formats) — orgs wanting self-certifying identity now are told honestly to wait or use an EOA on-ramp.

**R3 — KEL machinery inside kernel-v1, feature-gated (rejected).** Shipping unreviewed key-management machinery in the most Etched artifact, dormant, is the audit burden without the users; Holochain's DeepKey spent 8 years here. The ruling ("machinery not built") already rejects this.

**What the reservation physically consists of in v1:** (a) the `bytes32` author word everywhere; (b) reserved-reverting kindCodes + Codex-frozen KEL event wire formats with golden vectors (incept/addKey/removeKey/rotate bodies, algoTag constants incl. `efs.keyalgo.p256.v1`, inception-digest derivation for digest-shaped words); (c) the `IdentityKindReserved` revert as the explicit seam; (d) the succession chapter. Nothing else — no dangling addresses, no admin, no toggles.

---

## 7. Events

ID-keyed first topic, EAS UID column deleted, **full payload in data** (log-only-sync capable), emitted only inside the same tx that mutates state (reverted calls emit nothing):

```solidity
event EnvelopeAdmitted(bytes32 indexed envelopeDigest, bytes32 indexed author,
                       uint64 seq, bytes32 prev, bytes32 recordsRoot, uint32 count, bytes sig);
event TagDefCreated  (bytes32 indexed tagId, bytes32 indexed parentId, bytes32 indexed author,
                      uint8 kind, bytes name, bytes32 claimId);
event DataCreated    (bytes32 indexed dataId, bytes32 indexed author, bytes32 salt, bytes32 claimId);
event PropertyInterned(bytes32 indexed propertyId, bytes32 indexed valueHash, bytes32 datatype,
                      bytes value, bytes32 claimId, bytes32 author);
event ListCreated    (bytes32 indexed listId, bytes32 indexed author, bytes body, bytes32 claimId);
event MirrorSet      (bytes32 indexed dataId, bytes32 indexed author, bytes32 transportId,
                      string uri, bytes32 claimId);
event PinSet         (bytes32 indexed slotId, bytes32 indexed definitionId, bytes32 indexed author,
                      bytes32 targetId, bytes32 targetKind, bytes32 claimId, bytes32 supersededClaimId);
event TagSet         (bytes32 indexed definitionId, bytes32 indexed targetId, bytes32 indexed author,
                      int256 weight, bytes32 claimId);
event ListEntrySet   (bytes32 indexed listId, bytes32 indexed identityKey, bytes32 indexed author,
                      bytes32 target, bytes32 claimId);
event RedirectSet    (bytes32 indexed sourceId, bytes32 indexed targetId, bytes32 indexed author,
                      uint16 redirectKind, bytes32 claimId);
event ClaimRevoked   (bytes32 indexed targetClaimId, bytes32 indexed author, bytes32 revokeClaimId);
event OwnedConflict  (bytes32 indexed id, bytes32 firstClaimId, bytes32 evidenceClaimId, bytes32 indexed author); // §3.6
event ObjectRegistered(bytes32 indexed id, uint8 kindCode, bytes32 claimId, bytes32 indexed author);
```

- **Acceptance test (ports v2 §10):** a subgraph reconstructs full placement/supersession/mirror/property/visibility state from logs alone — zero `eth_call`s during sync. Deterministic IDs make namespace subscriptions bare `eth_subscribe` filters from a static site.
- `EnvelopeAdmitted` carries the **signature**, so a log-follower can re-export complete portable artifacts (header + sig + records from the per-record events) without calldata access. Note honestly: `submitSubset` re-admissions of an already-partially-admitted envelope emit `EnvelopeAdmitted` on first touch only; artifact reconstruction from logs may need to join multiple submissions.
- **Doctrine unchanged: events are conveniences.** The archival reconstruction path is the state-walk (§8). Anything demoted from state (§4.4) is explicitly labeled event-derived/untrusted in views and docs.

### 3.6 Duplicate-instantiation policy (placed here for reading order; referenced from §3.2)

Ports deterministic-ids §6 amended by substrate §3.4, now signature-gated:

- **Unowned kinds (TAGDEF, PROPERTY):** payload re-derives to an existing id → **idempotent no-op success** (registry keeps first; no array re-push; no `ObjectRegistered` re-fire; the duplicate is still admitted to spine/claim-store as the author's record and the author's visibility indices still run — "lost race" folders still appear in the creator's lens). Note: for TAGDEF and PROPERTY the derivation inputs *are* the entire body, so a same-id-different-body case is impossible by construction.
- **Owned kinds (DATA, LIST):** the signature is the gate — only the author can produce a colliding `(author, salt)`. Byte-identical body → idempotent no-op. Same derived id, **different body** (possible only where body ⊋ derivation inputs — concretely LIST's config beyond its salt) → the record is admitted **evidence-flagged** (`flags.evidence = 1`): stored on spine + claim store, bound to nothing, never merged, never a batch-killing revert; `OwnedConflict` emitted; lenses adjudicate trust. This preserves anti-corruption (registry state never forks) while surviving permissionless resubmission (a REVERT here would let a replayed stale envelope kill honest batches).

---

## 8. State-walk reconstruction doctrine

**Claim:** from (a) the Codex and (b) one chain-state snapshot of the kernel address (e.g. `debug_dumpStorage`, a state-sync snapshot, or an archived trie), with **zero logs and zero live RPC**, a fresh implementation rebuilds the full read state.

**Procedure (Codex chapter, executable):**

1. Read `allClaims.length` at its documented ERC-7201 slot; iterate `allClaims[i]`.
2. For each `claimId`: read `claims[claimId]` (3 slots at `keccak(claimId ‖ base)`), `bodies[claimId]`, `revokedBy[claimId]` — all key-derivable because the claimIds came from the spine.
3. **Replay admission in spine order** through a reference implementation of §3.2's pure state-transition function (signatures already verified at original admission; the replay recomputes IDs from bodies via `@efs/ids` and re-derives registry/slot/N-set/tree state). Because slot state is a join-semilattice (§5.2), replay order could even be arbitrary; spine order makes it exact including first-writer registry wins.
4. Cross-check: recomputed registry/slots must byte-match the snapshot's corresponding mappings (any mismatch = corrupted snapshot or non-conformant kernel — a detectable condition, which is itself part of verify-don't-trust).

**Acceptance test (freeze-blocking, wired into the transition plan's Phase-5 slot):** kill the devnet; from the Codex + `debug_dumpStorage` output alone, a fresh implementation (no EFS repo code) recomputes all golden-vector IDs, rebuilds the registry, resolves `/<address-or-root path>` to content bytes, and verifies them against the contentHash claim. This is the dead-chain fire drill made a CI-able procedure — it has never actually been run in any prior phase (false-confidence register item #1) and MUST run before Etch.

The spine (§4.2) is what makes step 1 possible at all; without it the doctrine is prose.

---

## 9. Read and verification path

### 9.1 On-chain point reads (the composability surface)

Point-lookup-shaped, never traversal-shaped (Story-precompile counterexample budget):

- `getObject(id)` ≈ 2 SLOADs (registry → claim meta): existence + kind + author.
- `getSlot(slotId)` ≈ 2–3 SLOADs: current placement/property binding, revocation-aware status.
- `getClaim(claimId)`: meta + body bytes, state-resident, synchronous.
- Reference `EFSGate` (redeployable): gate-on-claim / gate-on-list-membership on-ramp for third-party contracts.

The ~25 `eas.getAttestation` join points across router/views (coupling audit §3.5 census) disappear; views read one contract.

### 9.2 Trustless off-chain read (verify-don't-trust, per step)

Resolve `web3://<kernel-chain>/docs/readme.md?lenses=alice,bob` without trusting any indexer:

1. **Path → ids, offline:** client derives each segment's `tagId` via `@efs/ids` (chain-free math; no chain round-trip).
2. **Existence:** `getObject(tagId)` — or, headerless-trustless: `eth_getProof(kernel, [slot(registry[tagId])], block)` verified against a block header the client trusts; the Codex's frozen storage layout (§4) makes the slot derivation client-computable. Every point read below has the same `eth_getProof` form — this is why the layout is a Codex chapter and why mainnet has no proxy.
3. **Placement:** for each lens author in order, derive `slotId` (author is inside the key) → `getSlot` → first author with `Active` wins (first-attester-wins, ADR-0031 unchanged; lens list = bytes32 identity words; lens-as-LIST ports).
4. **DATA → mirror:** winning author's mirrors only (`nActive` family read; cross-author mirror injection stays impossible by key construction); transport priority ports (ADR-0012); `data:` inline or `web3://` SSTORE2 chunks via `extcodecopy`.
5. **Bytes:** verify against the winning author's `contentHash` property claim (multibase multihash conventions port). Fallback: hash-verified cross-attester repair (holistic §2.4) unchanged.
6. **Signature-grade (optional, for replicated/archived contexts):** the reader holding the envelope artifact re-verifies `ecrecover` and re-derives ids from the body — no chain at all (the year-100 path).

### 9.3 Cross-chain reads and the replicator doctrine

Cross-chain composability = **replication, never proofs** (Axiom is dead; storage-proof formats are hard-fork-fragile). A replicator copying a subtree: submit envelopes parents-first across envelopes (objects before claims that reference them; targets before their REVOKEs). The kernel enforces per-record dependency existence (§3.2), so a lazy replicator's out-of-order subset reverts cheaply rather than corrupting. Copied state is a **provable snapshot, not a live feed** — labeled per the record-format ledger.

### 9.4 Read-grade vocabulary (normative, ports substrate §3.6)

Kernel views return typed status (`Absent/Active/Revoked/Tombstone/Evidence`) and never collapse them. On the home chain, `Absent` **is** proven-absent for that chain's admitted set (state is total). Any resolver operating over anything other than a single live chain's total state MUST distinguish *proven-absent* from *unknown* and MUST NOT fall through to the next lens author on *unknown* — first-attester-wins is anti-monotone under missing data. With checkpoints unsold, cross-chain non-inclusion is simply **unknown** — surfaced, never faked. (Etched into the Codex read-semantics chapter; the kernel's contribution is refusing to return an untyped "nothing".)

### 9.5 Router / web3:// implications

`EFSRouter` stays redeployable, ERC-5219, same URL grammar; re-keys onto kernel reads. The v1 four-flavor container classifier (Address > Schema-UID > Attestation-UID > name) loses its two EAS flavors natively; whether they survive as optional EAS-interop view reads or die is routed upward (§15) — the classifier itself is `[reasoned]`, not mine to freeze. `EFSBytesStore`/SSTORE2 chunk serving, EIP-7617 pagination, cross-chain mirror redirects (ADR-0058) port unchanged.

---

## 10. EASExporter (non-Etched, optional, per-chain)

Recovers easscan/EAS-tooling legibility without a lying carrier (~120–180 LoC, redeployable, zero kernel coupling — reads public state only):

```solidity
contract EASExporter {
    IEAS immutable eas;            // that chain's EAS deployment
    IEFSKernel immutable kernel;
    bytes32 immutable mirrorSchemaUID;   // "bytes32 claimId, bytes32 author, bytes32 kindTag,
                                         //  uint64 seq, bytes body" — revocable, no resolver
    mapping(bytes32 claimId => bytes32 easUID) exported;

    function export(bytes32 claimId) external returns (bytes32 uid);   // permissionless mint
    function syncRevocation(bytes32 claimId) external;                 // revokes the mirror iff kernel says revoked
}
```

Attester = the exporter contract, **honestly** — the payload names the real author; the schema is explicitly "derived mirror of an EFS claim", so no EAS tool is lied to (the legibility-inversion problem dissolves rather than transfers). Anyone can deploy exporters; none is canonical; the kernel never knows they exist. Drop entirely if no consumer materializes (carrier decision's flip clause).

---

## 11. Genesis and Codex self-hosting

- **Genesis blob:** the bootstrap records — root TAGDEF children (`/transports/*` twelve TAGDEFs, `/tags`, `/.well-known`), the Codex file's DATA + contentHash PROPERTY+PIN + MIRROR(s), and the `/.well-known/spec` naming TAGDEF + placement PIN — serialized as ordinary `Record[]` under `author = SYSTEM_AUTHOR`, frozen pre-deploy, `keccak(blob)` a **compile-time constant** in kernel bytecode.
- `initializeGenesis(bytes blob)`: permissionless; `require(keccak256(blob) == GENESIS_BLOB_HASH)`; idempotent (records SKIP once admitted); runs the ordinary admission loop minus signature verification — **the one non-signature admission path in the system, closed by the bytecode hash pin**. Front-running is harmless (same blob or revert). `submit()` rejects `author == SYSTEM_AUTHOR` (§3.1 step 2), so the system author can never be extended post-genesis.
- **Codex bytes availability:** the genesis MIRROR points at `web3://` SSTORE2 chunk stores whose addresses are **CREATE2-fixed by the Codex bytes themselves** (init code = chunk bytes, spec-fixed salt) — so the mirror claims are valid in the blob before the chunks exist, anyone can deploy the chunks permissionlessly on any chain, and the bytes verify against the genesis contentHash. A small `data:`-inline "kernel card" (constants + pointers, ≤4KB) rides genesis directly so a chain with lazy chunk deployment still self-describes minimally.
- SystemAccount-the-contract (463 LoC) **retires**. There is no runtime code-governed author — a signature-only kernel cannot have one, and pretending otherwise re-opens the msg.sender hole. The `system` default lens becomes the SYSTEM_AUTHOR word (default-on, user-removable, never reorderable ahead of the user — ADR-0053 semantics preserved, mechanism replaced).

---

## 12. Port plan — honest re-measure against the 500–900 LoC claim

Measured v1 (wc -l, 2026-07-07): resolver/validation surface = EFSIndexer 1,336 + EdgeResolver 994 + MirrorResolver 228 + ListEntryResolver 374 + ListResolver 99 + AliasResolver 210 = **3,241** (the audit's "~2,900" was net of comments/interfaces — same ballpark). Plus SystemAccount 463 and vendored-EAS-in-scope ~1,205 → v1 Etched-adjacent surface ≈ **4,909 LoC**. Views (router 1,158 + fileview 1,021 + listreader 164 ≈ 2,343) are redeployable and stay out of the Etched count.

| Bucket | v1 LoC | Dies | Ports (churn) | New | Notes |
|---|---|---|---|---|---|
| EAS machinery (vendored) | ~1,205 | **all** | — | — | attest/revoke/delegation/registry/resolver framework |
| SystemAccount | 463 | **all** | — | — | genesis blob replaces (§11) |
| EFSIndexer validation (ANCHOR/DATA/PROPERTY branches, name validation, depth walk) | ~350 | ~90 (EAS struct plumbing, recipient/expiry/revocable guards, `_nameToAnchor`, root-bootstrap special case) | ~260 → TAGDEF/DATA/PROPERTY validators (name validation ports byte-for-byte) | — | tag-core reshapes ANCHOR→TAGDEF |
| EFSIndexer indices + `_indexGlobal` | ~550 | ~180 (demoted global indices, `index()`/`indexBatch()`/`indexRevocation` EAS hydration, dataByContentKey) | ~370 (tree, contains/childrenByAuthor, referencingByAuthor) | — | keep/demote line §4.4 |
| EFSIndexer views (in-contract) | ~400 | — | ~400 → **evicted to redeployable `EFSKernelViews`** | — | EIP-170 rule §1 |
| EdgeResolver | 994 | ~230 (onlyEAS, foreign-schema, refUID/recipient resolution, self-UID) | ~500 (slot machinery, tag arrays, swap-and-pop) + ~260 views → evicted | — | |
| MirrorResolver | 228 | ~70 | ~150 (transport ancestry, URI caps) | — | |
| ListResolver + ListEntryResolver | 473 | ~200 | ~270 reshaped into the N-set module (LIST_ENTRY→edge collapse) | — | |
| AliasResolver (REDIRECT) | 210 | ~90 | ~120 guards | — | dies entirely if the REDIRECT→property fork lands |
| **Kernel core (new)** | — | — | — | **~800–1,250** | SigGate+envelope+Merkle ~180–250 · admission/dispatch ~150–250 · claim store+registry+spine ~150–220 · revocation ~60–100 · genesis loader ~60–120 · errors/events/interfaces ~200–300 |
| **Etched total (kernel + linked validation)** | | | ~1,400–1,700 ported | ~800–1,250 new | **≈ 2,300–2,900 LoC** |
| Redeployable re-key (router/fileview/listreader/new views/exporter) | 2,343 | — | ~2,400–2,900 touched | ~300 (views evicted + exporter) | fixable forever |

**Verdict on the carrier decision's "~500–900 LoC" claim:** it holds only for the narrowest reading — the *net-new substrate mechanics* — and even there my re-measure lands **~800–1,250** once events, errors, the genesis loader, and the enumeration spine (which the prior estimates simply missed, §4.2) are counted. The number that governs the verification bill is the **Etched artifact as reviewed: ≈2,300–2,900 LoC** — still meaningfully smaller than the ≈4,909 LoC v1 Etched-adjacent surface it replaces (direction confirmed, magnitude corrected), but nobody should budget review for 900 lines. Verification estimate: 2–4 weeks build (matches carrier decision) + **3–6 weeks verification** (invariant suite incl. convergence/join-semilattice property tests, batch-shuffle, duplicate-policy matrix, tombstone semantics, state-walk executable test, external review of the envelope+identity spec by an independent lineage — the forSchema lesson makes this non-negotiable), running against the conformance harness and the abort-to-EAS ramp until the external gate passes.

---

## 13. Deployment, canonicity, and freeze doctrine

### 13.1 Permanence tiers

- **Etched:** EFSKernel runtime bytecode (hence: admission semantics, storage layout, kind table, caps, genesis hash, event signatures), the envelope/ID/KEL formats in the Codex, the genesis blob.
- **Devnet:** kernel iterates behind an upgradeable proxy (existing devnet proxy discipline; pattern per the open QUESTIONS.md item) with ADR-0048-grade burn rehearsal — invariant suite against deployed bytecode, soak, ledgered burn. **Mainnet: direct deploy, no proxy, no admin, no delegatecall surface.** Devnet kernels progressively adopt Etched discipline well before the freeze window.
- **Redeployable forever:** router, all views, exporter, relayers, SDK.

### 13.2 Who deploys, and how a reader verifies a deployment is canonical (the fragmentation hole, confronted)

**Anyone deploys.** The ceremony is permissionless and byte-reproducible: (1) via the ubiquitous deterministic-deployment factory (`0x4e59b44847b379578588920ca78fbf26c0b4956c`) with a spec-fixed salt and the frozen init code → **the same kernel address on every EVM-equivalent chain**; (2) call `initializeGenesis(blob)`; (3) optionally deploy the Codex chunks (CREATE2-fixed, §11). No deployer key is trusted with anything: wrong init code → different address; wrong blob → revert; re-runs → idempotent. EFS.eth may run a deploy bot as a convenience with zero protocol privilege.

**Reader verification procedure (Codex chapter, in trust order):**

1. `EXTCODEHASH(kernel) == CODEX_KERNEL_CODEHASH` (runtime bytecode is constructor-arg-free and byte-identical by §1 design);
2. genesis vectors: `getObject(rootTagId)`, `getObject(transportsTagId)`, the `/.well-known/spec` DATA's contentHash claim — all must match Codex golden values;
3. (convenience Schelling point, not the root) the address equals the spec-fixed CREATE2 address.

**The honest residual, stated rather than papered over:** two same-codehash, same-genesis kernels on one chain are both *authentic* EFS instances with independently divergent admitted sets. The protocol cannot and does not pick one — any "earliest deployment wins" rule would smuggle earliest-anchor fork choice into frozen semantics (banned). What the design actually guarantees: **venue plurality splits availability, never authenticity** — every record in any instance carries the author's chain-free signature; per-author state re-converges wherever the author's envelopes are replayed (§3.4 convergence); unowned TAGDEF ids are derivation-stable and squat-proof *by having no owner and no spoils*; owned ids are signature-bound. Venue *selection* is a client/social convention anchored on the fixed CREATE2 address (the Schelling point), maintained in lens/client config — explicitly Durable, not Etched. Chains where the 0x4e59 factory can't exist or where the VM diverges (zkSync-era-class: different bytecode format ⇒ different codehash): the Codex pins **per-VM-family artifact hashes** (source + compiler pin + per-family runtime hash); EVM-equivalent chains — the hundreds that matter — share one hash; non-equivalent VMs are labeled variant deployments, out of the canonical-address story, verified by their family hash + genesis vectors. This is the fragmentation answer arch-B's red team demanded: uniqueness-of-venue is a Schelling convention and is *priced as such*; authenticity portability is unconditional and cryptographic.

### 13.3 Succession

One doctrine covers all three contingencies (KEL activation §6.2, hash migration per deterministic-ids §13.6, catastrophic kernel bug): **new domains + successor kernel + backward read-through, coexistence-not-rewrite**. Old IDs remain valid opaque names forever; old kernels keep serving; successors point backwards; nothing is ever migrated in place. The Codex succession chapter names who may publish a successor Codex revision (trust-root stewardship workstream — open, flagged, not resolved here).

---

## 14. Self-red-team ledger (tried to break it; what I found)

1. **arch-B `claimId = H(author, seq, idx)` collides** under legal same-seq envelopes → fixed: `H(envelopeDigest, idx)` (§2.1).
2. **arch-B "REVERT + DuplicityDetected event" is incoherent** (revert erases the event) and contradicts the later §3.5 reservation (seq collisions never duplicity) → fixed: no `(author,seq)` state at all; deterministic comparator (§3.3, §4.3).
3. **The state-walk pledge was unimplementable** on both EAS and arch-B designs (hash-keyed mappings aren't enumerable from a state dump) → fixed: enumeration spine, with its cost stated and a graded fallback offered (§4.2). This one is freeze-blocking if rejected — the 100-year claim silently becomes "trust an indexer's event archive."
4. **Slot revoke semantics diverged across replay orders** under v1's clear-to-empty → fixed: tombstone supersession with a join-semilattice proof obligation in the invariant suite (§5.2).
5. **Genesis front-run / SYSTEM_AUTHOR forgery** → closed by hash-pinned idempotent genesis + explicit author-word ban in `submit` (§11, §3.1). Residual: none found; `SYSTEM_AUTHOR` is a keccak constant with no known preimage-key and is additionally hard-banned.
6. **Reserved-registry KEL slot = per-chain trust root** (you cannot pin unwritten code) → rejected R1, ruled chained succession R2 with backward read-through; cost = one cold external read post-succession (§6.2).
7. **Merkle games:** second-preimage via leaf/node ambiguity → domain-separated node/leaf constants; proof-for-index-beyond-count → `index < count` required; duplicate subset indices → strictly-increasing rule; signature malleability → low-s + claimId idempotency makes malleated resubmission a no-op (§3.1, §3.2).
8. **Gas-bombing:** unbounded bodies/names/URIs/depth → four Etched caps (§2); unbounded `count` deliberately uncapped (gas is the cap; a frozen cap is an irreversible assumption with no threat model).
9. **Future-dated seq lockout of a stolen key's victim** → REVOKE beats supersession-lock (position tombstones never block revocation); plus the TID future bound as hygiene (§3.1.5).
10. **EIP-170 overflow risk on a ~3k-LoC kernel** → views evicted to redeployable contracts by rule, with a named fallback split order (§1). Must be checked at first full compile — if even the write path busts the cap, the validation-library external split re-enters review as its own Etched artifact (schedule risk, named).
11. **Withheld-revoke on foreign chains** → inherent, priced by the carrier decision; kernel adds nothing false (no fake completeness); expiry stays an app-layer property convention (§5.1).
12. **What I could not close:** (a) venue plurality on one chain has no protocol-level canonical pick — Schelling-address convention only (§13.2); (b) `EnvelopeAdmitted`-based artifact re-export across multi-subset admissions is joins-required, mildly awkward (§7); (c) the honest-author-only limit of portable revocation (arch-B red-team lesson) is unchanged — a malicious author can selectively withhold revokes from chains they dislike; only expiry defends readers there.

---

## 15. Open forks routed upward (not ruled here; kernel is shaped to absorb either side)

1. **MIRROR → reserved property key** vs standalone kind (tag-core "consider"): kernel impact = one dispatch row + whether the transport-ancestry walk lives in a MIRROR validator or the PIN validator's reserved-key branch. No storage-shape change.
2. **REDIRECT → property** vs standalone kind: same shape; AliasResolver's ~120 ported lines die if collapsed.
3. **EAS-interop view reads** (raw schema/attestation containers, foreign-EAS lists) in redeployable views: keep as optional interop or clean severance. Kernel is indifferent (views-only).
4. **Container classifier** (Address > Schema > Attestation > Tag) — `[reasoned]`, shrinks natively; needs its own pass.
5. **Visibility mechanism** — ADR-0038 visibility TAGs (out-of-batch, ports as-is) vs contains-walk derivation (~10–15× cheaper, loses revocable per-folder claims): deterministic-ids open question; both fit the N-set/contains storage above.
6. **Spine cost acceptance** (§4.2 full vs objects-only) — James call; changes the strength of the 100-year state-walk claim, not the kernel shape.

## 16. Codex additions this design forces (delta to the deterministic-ids §13.5 TOC)

- Replace TOC item 5 (EAS behavioral pin) with: **kernel wire format + admission rules** (envelope digests, claimId, verification order, duplicate/evidence policy, tombstone comparator, TID bound) with golden vectors incl. a full admitted-envelope → state-diff vector.
- TOC item 6 (state-walk) becomes the **spine-replay procedure** (§8) with the ERC-7201 slot-derivation tables, plus the acceptance test.
- New chapters: **deployment canonicity + reader verification** (§13.2, per-VM-family artifact hashes); **succession** (§13.3); **reserved identity formats** (KEL event wire formats, algoTags, inception digest, reserved kindCodes — with vectors, per substrate §3.2/3.3); **genesis blob** (bytes + hash + CREATE2 chunk addresses).
- Read-semantics chapter gains the typed status vocabulary (§9.4) and tombstone slot semantics.
