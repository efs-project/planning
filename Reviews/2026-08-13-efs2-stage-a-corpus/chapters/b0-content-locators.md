# B0 — Content, Locators, and Large Bytes
**Stage A chapter — post-red-team revision; not landed, adopts nothing.**

Lane 8 of the Stage A commissioned pass (2026-08-12). This chapter makes the B0
"SPINE" baseline exact for the content/byte layer: the generic application Type
Schemas that turn Locators, digests, chunked closures, releases, and
durability/availability evidence into ordinary Records, plus the client-side
staged-verification machine for the 50 GB trace.

## 0. Scope and posture

Everything in this chapter is a **generic application Type Schema** expressed
over Lane 1's canonical encoding and Lane 4's Type system. **Core knows none of
these names** [DERIVED INVARIANT — core-architecture-candidate.md "Content and
Locators": "Core knows none of these names. Their Type Schemas and declared
reference indexes are sufficient." VERIFIED]. If any deliverable below turns
out to need a bespoke Core primitive, that is a candidate falsifier for the
whole architecture [DERIVED INVARIANT — kickoff: "An application needing a
custom Core kind, contract, or private index for an ordinary typed
relationship is a candidate falsifier." VERIFIED].

Posture rules inherited by every type here:

- **A Locator is a claim about where bytes may be found, not content identity**
  [DERIVED INVARIANT — system-constitution.md "Files, bytes, and large
  content", VERIFIED].
- **Exact content identity exists only once an exact representation or closure
  commitment is known** [DERIVED INVARIANT — same section, VERIFIED].
- **Digest, size, media type, CID, manifest, provenance, rights, compatibility,
  and availability are distinct facts** — none is forced into identity unless a
  profile requires it [DERIVED INVARIANT — same section, VERIFIED].
- **Content identity is independent of storage provider; Locators are plural**
  [DERIVED INVARIANT — same section, VERIFIED].
- **Executable bytes verify fully before execution; large passive content
  verifies each consumed range before use** [DERIVED INVARIANT — same section,
  VERIFIED].
- **Scheme policy is CLIENT policy, never a Core allowlist** [PROPOSAL —
  carrying the v1 ADR-0056 direction as *evidence*, not authority:
  planning/Designs/mirror-scheme-policy.md + contracts ADR-0056 (superseded
  ADR-0023) removed the v1 scheme gate entirely, no denylist replacement,
  because an allow/denylist on an immutable contract is the wrong mechanism —
  the real boundary is client-side render isolation. No attributed owner
  ruling exists for this (the red-team verified owner-rulings.md and
  Decisions.md carry no scheme-gate entry, and the 2026-08-12 greenfield
  reset makes v1 ADRs evidence that must re-earn inclusion); the design rule
  stands here on the ADR-0056 lesson's merits].
- Claimed times inside these bodies are **testimony**, never venue order
  [DERIVED INVARIANT — assumptions-and-requirements R-D9 lesson via the intake
  audit SURVIVORS lane: claimedAt is testimony; admittedAt is venue-relative.
  VERIFIED in the audit record]. Every deterministic algorithm below orders by
  admission facts, not claimed times.

Dependencies: Lane 1 owns the canonical BODY codec and `MAX_BODY_BYTES`
(pinned at 8,192 by SR-5); Lane
2/3 own Envelope/Occurrence/admission; Lane 4 owns Type identity (axis 4
Variant A); Lane 5 owns the read ABI and ResolutionPlans consuming §10; Lane 6
owns the atomic Core. Bodies below are ordered, typed field lists that Lane
1's codec serializes; `canonicalBody` stays opaque bytes to this chapter.

## 1. Shared value: ByteDigestValue and the pinned algorithm table

### 1.1 The closed algorithm subset (of the SR-18a u16 algCode table)

[PROPOSAL — closed subset; rationale: a 50-year archive cannot depend on a
living registry, and every added algorithm is permanent verification surface.
Per SR-18a the algorithm-code vocabulary is the encoding chapter's ONE `u16`
multihash-compatible `algCode` table, used everywhere — `DIGEST` values,
ByteDigest bodies, and index keys (zero-extended). This chapter pins the
subset of that table legal under its v1 types, plus the per-code semantics.]

| algCode (u16) | Name | Digest bytes | Role | Multihash projection |
|---|---|---|---|---|
| `0xEF01` | `ALG_GIT_SHA1_OBJECT` | 20 | **Foreign-only.** SHA-1 over the canonical Git object serialization (`"<type> <len>\0"` + content) | EFS-assigned; no lossless multihash code |
| `0x0012` | `ALG_SHA2_256` | 32 | Interop digest (SRI, CIDs, TLS ecosystem) | code `0x12`, len `0x20` |
| `0x001B` | `ALG_KECCAK_256` | 32 | EFS-native digest (EVM-cheap) | code `0x1b`, len `0x20` |

- `keccak256` is the EFS-native hash [PROPOSAL — EVM-native, cheapest on-chain
  verification; per the shared skeleton's ID family rule].
- **Foreign digests enter only as algorithm-coded ByteDigest values, never as
  EFS identity** [DERIVED INVARIANT — shared skeleton ID family rule; evidence:
  the Git SHA-1→SHA-256 transition, 8+ years and unfinished because retrofitted
  (deterministic-ids.md §13.6, VERIFIED); a broken hash entering the identity
  layer is the falsifier (intake audit STANDARDS lane, VERIFIED)].
- `ALG_GIT_SHA1_OBJECT` uses the encoding owner's EFS-assigned `0xEF01`, and
  the **table row — not the number — carries the semantics** [PROPOSAL —
  preserves the framing pin under SR-18a's shared code space]: it is legal
  only as SHA-1 over the **framed** Git object bytes, foreign-only. Raw
  unframed SHA-1 is the owner's distinct `0x0011` (`sha1`) and is outside this
  chapter's v1 subset. Bare multihash cannot express Git framing, so projecting
  the digest as multihash sha1 (`0x11` over the framed object bytes) is
  explicitly lossy and never storage-canonical. SWHIDs (ISO/IEC 18670:2025)
  project from this EFS code for
  `cnt`/`rev`/etc. objects as foreign identifiers only [standards FACT:
  SWHID is an ISO standard published 2025-04-23 and is SHA-1-based — VERIFIED
  via the intake audit STANDARDS lane; EFS POLICY: cite/emit, never inherit].
- **Successor-hash seam.** Any `algCode` outside the closed subset **fails
  this content profile's bounded conformance** under every v1 type in this chapter; the subset
  extends only by a Codex revision assigning a new `u16` code in the encoding
  chapter's table (multihash registry value where one exists) — the migration
  seam per the hash-migration playbook obligation (deterministic-ids.md
  §13.6/§223 — VERIFIED). This keeps the seam warm without shipping
  unverifiable data and without a magic reserved number [PROPOSAL].
- [REJECTED — superseded arm, kept for the record: the draft's chapter-local
  `u8 algTag` table (`0x01` sha2-256, `0x02` keccak-256, `0x03`
  git-sha1-object, `0x04` successor-reserved) is retired by SR-18a. A second,
  narrower algorithm vocabulary saved one wire byte and cost the set a
  three-way digest-code fork (u8 body tags vs u16 `DIGEST` codes vs u32 index
  algIds) — the red-team's confirms-but-unreadable fragmentation case, where
  the same sha-256 could legally index under multiple keys.]

### 1.2 Wire and projection forms

`ByteDigestValue` as a codec field group (Lane 1 serializes):

```text
ByteDigestValue {
  algCode : uint16     -- from the closed subset above (SR-18a shared table)
  digest  : bytes      -- length MUST equal the table's digest length for algCode
}
```

Core structural validation of a `DIGEST` value requires a globally known
`algCode` and its Codex-pinned length. Content-profile conformance additionally
requires `algCode ∈ {0xEF01, 0x0012, 0x001B}`; otherwise the admitted Record
is `PROFILE_MALFORMED(ALGORITHM_NOT_IN_CONTENT_V1)`. Length mismatch remains a
Core structural failure.

**Multihash projection** (export/import only, never storage-canonical):
`varint(code) ‖ varint(length) ‖ digest`. The registry-backed algorithms
project exactly as `0x12 0x20 ‖ d` and `0x1b 0x20 ‖ d`. EFS-assigned
`0xEF01` has no lossless multihash projection; an exporter may emit
`0x11 0x14 ‖ d` only with an explicit loss-of-Git-framing warning. The
storage-canonical form stays fixed-width `u16`, and index keys zero-extend the
same stored code (Lane 5, SR-18a) [PROPOSAL — fixed-width storage, varint
export].
[standards FACT: multihash/CID's IETF track is dead — draft-multiformats-
multihash-07 expired 2024-02-21, never an RFC; the format is de facto stable
via the multiformats registry only. VERIFIED via intake audit STANDARDS lane.]
[EFS POLICY, PROPOSAL: adopt the wire *format* for interop, pin the exact codes
in the Codex with printable provenance notes, and treat the registry as
provenance, never a living dependency. Full CID (multibase + IPLD codec
semantics) is NOT adopted as a storage form; a CID encountered in the wild is
either parsed down to a projectable raw digest or carried as an opaque
content-addressing URI (see RepresentationBinding/1).]

**RFC 6920 (`ni:` URIs) is projection-only** [standards FACT: RFC 6920 is a
2013 Proposed Standard that never advanced, with negligible deployment —
VERIFIED via intake audit STANDARDS lane]. [EFS POLICY, PROPOSAL: clients MAY
emit/parse `ni:///sha-256;...` as a projection of `ALG_SHA2_256` values to
satisfy the standards-based self-description requirement on paper; the
canonical stored form is always the Codex-pinned `ByteDigestValue`.]

## 2. Type family overview

```text
ObjectGenesis/1 (Lane 2/4)      stable subject: "this file/project exists"
      ▲ subject                          ▲ subject
Locator/1 ──────────────┐        ArtifactRelease/1 ── runtime ──> RuntimeRequest/1
  "bytes may be here"   │           "publisher says: release R of S is A"
  (opt. observation)    │                 │ artifact
                        ▼                 ▼
ByteDigest/1     ChunkTree/1 ◄── member ── ArtifactClosure/1 (nestable)
"exact bytes      "exact bytes,            "exact named member set"
 exist" (anchor)   range-verifiable"
      ▲ external          ▲ subject             ▲ subject
      └── RepresentationBinding/1 ──────────────┘
           "external digest/CID ≡ this exact commitment"

AvailabilityObservation/1  ── locator ──> Locator/1   (probe results)
DurabilityGrade/1          ── locator ──> Locator/1   (custody-class claims)
```

Authorship for every one of these is the **Occurrence** (Envelope author), and
admission/currency is Realm-qualified (Lane 3). Identical Records asserted by
ten authors share one RecordId and keep ten provenance trails [DERIVED
INVARIANT — constitution "Minimal typed data", VERIFIED].

Index declarations below use Lane 5/6's baseline reads (exact Record reads,
unique-Records-by-Type, Occurrences by Type/Record/Principal) plus declared
`IndexSpec`s limited to the candidate's grammar: exact scalar equality, typed
reference equality, target-first backlink by role [DERIVED INVARIANT —
candidate "Indexes", VERIFIED]. Under axis 4 Variant A these declarations are
inside each `TypeSchemaId`.

**Content-digest lookup costs nothing extra** [PROPOSAL — derived design
result]: because RecordIds are deterministic, "given a sha-256, find the file"
[OWNER RULING — owner-rulings.md 2026-07-15 item 13, VERIFIED] is: compute
`RecordId(ByteDigest/1{0x0012, d})` offline → exact point read → walk declared
backlinks (bindings, closures, locators). This route needs no bespoke digest
index — the costed obligation reduces to the backlink pages every type here
already declares. Where Lane 5 additionally exposes a global digest key
family, it keys on the same `u16 algCode` (zero-extended, SR-18a), so the two
entry points can never fragment by algorithm vocabulary [PROPOSAL].

### 2.1 Core admission versus content-profile conformance

The closed Type language is intentionally small. Core validates only rules it
can derive from the canonical descriptor with bounded generic machinery; this
chapter's richer semantic profiles are deterministic reader/SDK checks, not
hidden kernel validators [PROPOSAL — no callbacks, exact disposition]:

| Rule class | Enforced by Core admission | Enforced by bounded content-profile/read conformance |
|---|---|---|
| Canonical body | MC/1 parse, field order/count, no trailing bytes, UTF-8 validity, declared scalar/bytes/array/struct bounds, body/depth limits | none; these are already structural |
| Declarative constraints | Top-level `INT_RANGE`, `NONEMPTY`, and `NAME_PROFILE` exactly as declared by the Type | sparse allowsets, arithmetic/alignment relationships, all-or-none option groups, and every other cross-field invariant |
| Digests | `DIGEST` uses a Codex-known `algCode` and its globally pinned length | this profile's closed algorithm subset, Git-framing meaning, and whether a field permits a particular algorithm |
| References | bounded extraction; every reference leaf covered exactly once; `DIRECT` or one `ARRAY_STRUCT_MEMBER`; `REF_INSTANCES_MAX=16`; target class; exact singleton `expectedType` when declared | allowed sets of multiple target Types, member `kind` to target-Type agreement, target-body size/count agreement, and semantic graph relationships |
| Locator/text meaning | declared bytes length and `NONEMPTY` where expressible | RFC-3986 URI grammar, ASCII/scheme semantics, secret-fragment warnings, path-segment rules, and host-collision policy |
| Collections | declared maximum count and total reference budget | sorted/unique members or capabilities, closure name uniqueness, and nesting/walk policy |
| Content mathematics | integer widths/ranges declared independently | chunk alignment, count/size arithmetic, nonzero-root policy, Merkle/representation equivalence, and verified range coverage |

Every conformance check above is bounded by `MAX_BODY_BYTES`, declared array
maxima, `REF_INSTANCES_MAX`, and explicit point reads of referenced Records.
There are no Type-created callbacks and no unbounded traversal during
admission. A Record that passes Core structure but fails this profile remains
immutable admitted evidence with the same RecordId; a conforming reader grades
it `PROFILE_MALFORMED(reason)` and excludes it from verified execution,
exact-closure claims, or best-locator eligibility as applicable. It is never
silently reclassified as structurally invalid or deleted.

For all multi-Type target sets below, the Type role uses
`expectedType = ANY`; the listed set is content-profile conformance. A
singleton target may use its exact `TypeSchemaId`. This closes the prior
allowed-set/kind-target ambiguity without set-valued Core constraints.

## 3. Locator/1

Purpose: an authored claim "bytes for subject S may be found at URI U",
optionally hardened into an **immutable observation** ("when I dereferenced U
at basis B, I got bytes with digest D and size N"). One type serves both
because an observation is just a locator claim with its evidence attached; a
mutable URL yields several immutable observation Records over time, each with
its own RecordId [DERIVED INVARIANT — constitution Files section, VERIFIED].

```text
Locator/1 {
  subject          : reference               -- role "subject", REQUIRED
  uri              : bytes                   -- 1..MAX_LOCATOR_URI_BYTES
  -- optional observation group: all-or-none --
  observedDigest   : ByteDigestValue?        -- digest of the bytes obtained
  observedSize     : uint64?                 -- byte length obtained
  observedAtClaim  : uint64?                 -- claimed unix seconds (testimony)
}
```

Reference roles and indexes (inside TypeSchemaId, axis 4 Variant A):

| Role | Allowed target TypeSchemas | Cardinality | Declared index |
|---|---|---|---|
| `subject` | `ObjectGenesis/1`, `ByteDigest/1`, `ChunkTree/1`, `ArtifactClosure/1` | exactly 1 | target-first backlink ("locators for T") |

Validation split (per §2.1):

1. **Core:** `1 ≤ len(uri) ≤ MAX_LOCATOR_URI_BYTES` (`MAX_LOCATOR_URI_BYTES = 2048`
   [PROPOSAL — covers real-world signed gateway URLs; anything longer is
   hostile or machinery, and bounded bodies are a Core requirement]).
2. **Profile/read:** `uri` MUST be a syntactically valid RFC 3986 absolute URI: `scheme ":"
   hier-part [ "?" query ] [ "#" fragment ]`; scheme = `ALPHA *( ALPHA / DIGIT
   / "+" / "-" / "." )`; every byte printable ASCII `0x21..0x7E` (non-ASCII
   MUST be percent-encoded). **No scheme list is consulted** [PROPOSAL — the
   v1 ADR-0056 direction cited as evidence, §0; client-policy-not-Core-
   allowlist is the design]. The TYPE pins syntax bounds; dereference/render
   policy is client policy.
3. **Profile/read:** observation group: either all three observation fields present or none.
4. **Profile/read:** `observedDigest.algCode ≠ ALG_GIT_SHA1_OBJECT` (an HTTP fetch yields raw
   bytes; the Git framing never appears on a wire) [PROPOSAL — keeps foreign
   framing out of transport observations].

Semantics and non-meanings:

- The claimant is the Occurrence author; **no claimant field exists in the
  body** [DERIVED INVARIANT — candidate "Content and Locators": "the
  claimant/author is the Occurrence, not a duplicated Record field",
  VERIFIED].
- `observedAtClaim` is testimony (§0). Freshness ranking uses admission
  ordinals, never this field.
- A Locator NEVER grounds absence: no set of locators, observations, or failed
  fetches proves bytes do not exist [DERIVED INVARIANT — the four-source
  absence discipline: budget exhaustion, partial replicas, hosted-RPC bare
  word, and deny hits never ground absence; carried from lens-spec §6.2 /
  lens-read-gotchas via the intake CARRY-IN lane, VERIFIED there].
- Client privacy policy MUST warn before publishing a `uri` containing a
  fragment: fragments are the July capability-carriage channel and must never
  reach a permanent public Record when they carry secrets [PROPOSAL —
  evidence: Tahoe-style fragment capabilities in deterministic-ids.md §184,
  VERIFIED; a structural rule cannot detect secrets, so this is client-edge
  policy, consistent with the constitution's permanent-public-data warnings].

**web3:// note.** If a Locator uses `web3://`: [standards FACT — VERIFIED via
intake audit STANDARDS lane: ERC-4804 is Final; ERC-6860 is a Draft that
"updates ERC-4804 with minor corrections, clarifications and modifications"].
[EFS POLICY, PROPOSAL: clients interpret `web3://` per **ERC-6860 at a
Codex-pinned revision** (pin the exact file revision hash of the 6860 spec
text in the Codex), citing ERC-4804 Final as the anchor — because
4804-as-published contains the defects 6860 corrects, and "Final" status does
not make defective normative text the better engineering choice. Pin the
required client subset: address+chainId resolution and calldata construction
(auto mode); name resolution (ENS) OPTIONAL; gateway use permitted with the
honest disclosure that a gateway observes the query and serves unverified
bytes — for closure-committed content the chunk proofs collapse gateway trust
to availability-only.]

## 4. ByteDigest/1

Purpose: an ownerless exact anchor Record for one byte string identified by a
single digest. It gives foreign and whole-file digests a stable RecordId
target for backlinks (the deterministic content-digest entry point of §2).

```text
ByteDigest/1 {
  digest : ByteDigestValue      -- REQUIRED; the only field
}
```

- No size, no media type, no name [DERIVED INVARIANT — distinct-facts rule,
  §0]. Size/type/naming claims attach as separate evidence or live in
  closures.
- Core structural validation is the global `DIGEST` grammar. Content-profile
  conformance applies §1.2's closed algorithm subset; nothing else.
- Declared indexes: none beyond baseline (unique-Records-by-Type and exact
  point reads suffice — the RecordId is computable from the digest alone).
- Any Principal may assert it; asserting it means "I claim bytes with this
  digest exist"; the Occurrence carries who/when.

## 5. ChunkTree/1 — the exact chunked commitment

Purpose: exact content identity for one byte string with **verified arbitrary-
range reads**: a keccak Merkle tree over fixed-size chunks with the count and
size bound into the Record (count-at-apex) [DERIVED INVARIANT — the Arweave
`data_size` lesson: only the true chunk count may reproduce the commitment,
so truncation/extension is a second-preimage, not a trusted field;
large-file-uploads.md §"The mechanism" item 2, VERIFIED].

### 5.1 Body

```text
ChunkTree/1 {
  chunkSize  : uint32     -- bytes per chunk (all chunks except possibly last)
  chunkCount : uint32     -- n
  totalSize  : uint64     -- exact byte length
  merkleRoot : bytes32    -- root per §5.2
}
```

Validation split (per §2.1):

1. **Core:** independent `INT_RANGE` constraints enforce
   `CHUNK_SIZE_MIN ≤ chunkSize ≤ CHUNK_SIZE_MAX`,
   `1 ≤ chunkCount ≤ CHUNK_COUNT_MAX`, and `totalSize ≥ 1`.
2. **Profile/read:** `chunkSize % CHUNK_SIZE_ALIGN == 0`.
3. **Profile/read:** `chunkCount == ceil(totalSize / chunkSize)`
   (equivalently `(chunkCount−1)·chunkSize < totalSize ≤ chunkCount·chunkSize`,
   checked in uint256 arithmetic — no overflow at these widths).
4. **Profile/read:** `merkleRoot ≠ 0x0`.

Named constants [PROPOSAL — each with rationale]:

| Constant | Value | Rationale |
|---|---|---|
| `CHUNK_SIZE_ALIGN` | 4,096 | page-aligned I/O; admits the state-tier size below |
| `CHUNK_SIZE_MIN` | 4,096 | smaller chunks explode manifests for no verification gain |
| `CHUNK_SIZE_MAX` | 8,388,608 (8 MiB) | keeps single-chunk memory bounded on mobile verifiers |
| `CHUNK_SIZE_DEFAULT` | 262,144 (256 KiB) | matches the IPFS default chunker for CID-adjacent convergence [PLAUSIBLE — kubo default is 256 KiB]; keeps 50 GB at 204,800 chunks, depth-18 proofs |
| `SSTORE2_RUNTIME_GUARD_BYTES` | 1 | leading `STOP` byte in the optional SSTORE2-shaped runtime; it counts against EIP-170 |
| `SSTORE2_PAYLOAD_MAX` | 24,575 | EIP-170 runtime allowance 24,576 minus the one guard byte; payload alone may never consume the full code page |
| `CHUNK_SIZE_STATE` | 20,480 | largest `CHUNK_SIZE_ALIGN` multiple ≤ `SSTORE2_PAYLOAD_MAX`; single-tx proof-verified state-tier submission for the optional venue arm (arithmetic §8.4) |
| `CHUNK_COUNT_MAX` | 16,777,216 (2^24) | bounds proof depth ≤ 24 (≤ 768-byte proofs) and manifest ≤ 512 MiB; max artifact = 8 MiB × 2^24 = 128 TiB, 256 KiB × 2^24 = 4 TiB |

`chunkSize` is a **declared field, not a hard-coded constant** [DERIVED
INVARIANT — July lesson: chunk size read at runtime so the design rides the
scaling curve, never hard-coded to a storage tier's current limit;
large-file-uploads.md §"The mechanism" item 1 and §"Forward-compat",
VERIFIED]. Determinism cost stated honestly: the same bytes chunked at two
sizes yield two ChunkTree RecordIds. Mitigation: clients SHOULD use
`CHUNK_SIZE_DEFAULT`, or `CHUNK_SIZE_STATE` when targeting contract-readable
custody; equivalence between the two is provable with a RepresentationBinding
(§6) plus re-derivation. Chunk-size normalization is also the fingerprinting
countermeasure: odd chunk sizes fingerprint files through any relay
[DERIVED INVARIANT — client-OS pressure P11, large-file-uploads.md Open
questions, VERIFIED].

The July manifest's per-chunk SHA-256 word (P11's other half) is **not
adopted**: SRI/import-map interop needs the *whole-file* sha-256, which is a
`ByteDigest/1` + `RepresentationBinding/1` pair, and per-chunk verification is
keccak-native. [REJECTED — kill source: this chapter, rationale above; revisit
only if a real fixture needs per-chunk SRI, which none of the named fixtures
does.]

### 5.2 Tree construction (exact)

All hashes keccak256. Domain tags are single bytes internal to this Type
(versioned by `ChunkTree/1` itself; a v2 type may change them).

```text
LEAF_TAG = 0x00 ; NODE_TAG = 0x01

chunk_i        = bytes[i·chunkSize : min((i+1)·chunkSize, totalSize)]   -- last chunk may be short
leaf_i         = keccak256(LEAF_TAG ‖ chunk_i)
level_0        = [leaf_0 .. leaf_{n−1}]
level_{k+1}[j] = keccak256(NODE_TAG ‖ level_k[2j] ‖ level_k[2j+1])   for 2j+1 < len(level_k)
                 level_k[len−1]                                      promoted when len(level_k) is odd
merkleRoot     = the single element of the final level                (n = 1 ⇒ merkleRoot = leaf_0)
```

- Ordered (non-commutative) pairing; **no sorted-pair hashing** [PROPOSAL —
  sorted pairs discard position and enabled the OZ multiproof CVE class the
  July red team killed batch proofs over; large-file-uploads.md "Mandatory
  fixes" item 1, VERIFIED].
- Odd levels **promote** the last node (no Bitcoin-style duplication)
  [PROPOSAL — duplication admits duplicate-leaf ambiguities; promotion is
  unambiguous and count-at-apex closes the remainder].
- Leaf/node domain separation: a chunk presented as an interior node (or vice
  versa) changes the first hashed byte, so cross-role second preimages fail.
- The **apex binding of `n`, `chunkSize`, `totalSize` is the RecordId itself**:

  ```text
  DOM_RECORD = keccak256("efs2/record/1")
  RecordId = keccak256(abi.encode(
    DOM_RECORD,
    TypeSchemaId(ChunkTree/1),
    keccak256(canonicalBody)
  ))
  ```

  The canonical body contains all three fields. No separate apex hash exists;
  the RecordId is the one commitment handle other Records reference
  (SR-1; exact formula owned by the encoding chapter).

### 5.3 Chunk proof verification (exact, implementable as a pure Solidity library)

```text
-- proof = ordered bottom-up sibling list; promoted levels consume nothing
function verifyChunk(merkleRoot, chunkCount n, chunkSize, totalSize,
                     index i, chunkBytes, proof[]) -> bool:
  if i ≥ n: return false
  expectLen = (i == n−1) ? totalSize − (n−1)·chunkSize : chunkSize
  if len(chunkBytes) ≠ expectLen: return false
  h = keccak256(0x00 ‖ chunkBytes); idx = i; len = n; p = 0
  while len > 1:
    if idx == len−1 and len is odd:
      -- promoted: no sibling at this level
      idx = idx >> 1
    else:
      if p ≥ len(proof): return false
      sib = proof[p]; p += 1
      h = (idx even) ? keccak256(0x01 ‖ h ‖ sib) : keccak256(0x01 ‖ sib ‖ h)
      idx = idx >> 1
    len = (len + 1) >> 1
  if p ≠ len(proof): return false        -- reject padded/truncated proofs
  return h == merkleRoot
```

Solidity-style signature for the shared pure library (usable by any venue
byte-store or contract consumer; no state):

```solidity
library ChunkTreeVerify {
  function verifyChunk(
    bytes32 merkleRoot, uint32 chunkCount, uint32 chunkSize, uint64 totalSize,
    uint32 index, bytes calldata chunk, bytes32[] calldata proof
  ) internal pure returns (bool);
}
```

Gas envelope [arithmetic, PLAUSIBLE — standard keccak costing 30 + 6/word]:
hashing one 20,480-byte chunk ≈ 30 + 640·6 ≈ 3.9k; one 262,144-byte chunk ≈
49.2k; plus ≤ 24 node hashes ≈ 24·(30+12) ≈ 1k; verification is never the
dominant cost of any transaction that carries the chunk bytes.

### 5.4 The chunk-hash manifest is content, not a Record

The leaf list (`n × 32` bytes) is recomputable from the bytes and is itself
large content: 50 GB at `CHUNK_SIZE_DEFAULT` ⇒ 204,800 × 32 = 6.55 MB — far
above any admittable body (§8.4 arithmetic), so it is **never a Record body**.
Acquisition paths: (a) fetch per-chunk proofs (≤ 576 B each at default size);
(b) fetch the whole manifest from any locator and verify it by recomputing
`merkleRoot` from it (one pass, no proofs needed); (c) publish the manifest
bytes as their own ChunkTree/1 (6.55 MB → 25 chunks → 800-byte second-order
manifest; recursion terminates immediately). [PROPOSAL — no ManifestRecord type; the
byte layer already handles it.]

## 6. RepresentationBinding/1

Purpose: authored evidence that an **external representation** (whole-file
digest, CID, foreign OID) and an **exact EFS commitment** identify the same
bytes. This is the bridge that lets a phone publish `sha2-256` first and the
closure later without either rewriting the other, and the SRI/CID interop
point.

```text
RepresentationBinding/1 {
  subject       : reference          -- role "subject", REQUIRED
  externalKind  : uint8              -- 0x01 RAW_DIGEST | 0x02 CONTENT_URI
  externalDigest: ByteDigestValue?   -- REQUIRED iff externalKind == 0x01
  externalUri   : bytes?             -- REQUIRED iff externalKind == 0x02;
                                     -- Locator/1 URI syntax rules, ≤ MAX_LOCATOR_URI_BYTES
}
```

| Role | Allowed targets | Cardinality | Declared index |
|---|---|---|---|
| `subject` | `ChunkTree/1`, `ArtifactClosure/1` | exactly 1 | target-first backlink ("bindings for commitment C") |

Validation split: Core enforces field encodings, option shapes, independent
bounds, and global `DIGEST` length. The content profile requires exactly one of
`externalDigest`/`externalUri`, agreement with `externalKind`, the §1.2
algorithm subset, and the §3 URI grammar. Failure is
`PROFILE_MALFORMED`, not retroactive Core invalidity.

Semantics:

- `RAW_DIGEST`: "digest(externalDigest.alg, exact bytes of subject) ==
  externalDigest.digest". Verifiable by anyone holding the bytes; false
  bindings are detectable evidence against their author, never silently
  corrected.
- `CONTENT_URI`: "the content-addressed object named by externalUri (e.g.
  `ipfs://CID`) resolves to the same bytes". A CID of a large file is a
  UnixFS-DAG root, not a raw digest [standards FACT, PLAUSIBLE — IPFS UnixFS
  chunking], so it rides as an opaque self-verifying-transport name; the
  transport verifies bytes against the CID, the binding claims CID ≡
  commitment, and re-derivation checks it [DERIVED INVARIANT — July "the CID
  they link IS the hash" analysis; large-file-uploads.md §"Files, mirrors, and
  integrity", VERIFIED. ADR-0049's rule survives greenfield re-earning here:
  off-chain hashes stay claims, never authenticated identity].
- For a *location-addressed* URL there is nothing to bind to — use a Locator/1
  observation instead. `CONTENT_URI` bindings SHOULD use content-addressed
  schemes; the type cannot enforce scheme semantics (no scheme list — §0), so
  a binding to a mutable URL is legal-but-worthless evidence, graded by Lenses
  like any other claim.
- Git interop: `RAW_DIGEST` with `ALG_GIT_SHA1_OBJECT` binds a Git blob OID to
  the ChunkTree of the blob's *content bytes* (unframed); the framing lives in
  the algorithm tag. Native Git OIDs stay native [DERIVED INVARIANT —
  constitution "Git keeps native Git OIDs", VERIFIED].

## 7. ArtifactClosure/1 — exact named member sets

Purpose: exact identity for a *package*: an ordered, named, **FINAL** member
set. What a closure commits is exactly and only its enumerated scopes: member
names, kinds, sizes, and content references. It never contains a cursor, a
"more follows", or a partial scope [DERIVED INVARIANT — closure/absence
lesson: a closure manifest commits only FINAL-enumerated scopes;
PARTIAL(cursor) scopes never yield absence; lens-spec §6.2 via intake
CARRY-IN lane, VERIFIED there]. Media types, permissions beyond the execute
bit, mtimes, ownership, rights: **not committed** — distinct facts carried by
separate evidence (§0).

```text
ArtifactClosure/1 {
  members : array of Member          -- 1..MAX_CLOSURE_MEMBERS, sorted, unique
}
Member {
  name    : bytes                    -- 1..MAX_MEMBER_NAME_BYTES, one path segment
  kind    : uint8                    -- 0x01 FILE | 0x02 EXEC_FILE | 0x03 SUBCLOSURE
  size    : uint64                   -- claimed exact byte size (FILE/EXEC_FILE);
                                     -- claimed member count (SUBCLOSURE)
  content : reference                -- role "member"
}
```

| Role | Allowed targets | Cardinality | Declared index |
|---|---|---|---|
| `member` | `ChunkTree/1` (kind FILE/EXEC_FILE), `ArtifactClosure/1` (kind SUBCLOSURE) | 1..MAX_CLOSURE_MEMBERS | target-first backlink (**reverse membership**: "closures containing C") |

The exact Type descriptor uses one role with
`selectorKind = ARRAY_STRUCT_MEMBER`, `fieldIdx = members`, and
`memberIdx = content`. The selected member descriptor is exactly `REF`; the
role's `targetClass = RECORD` and `expectedType = ANY`. The generic extractor
therefore emits one reference per array element in wire order, statically
bounded by `MAX_CLOSURE_MEMBERS = REF_INSTANCES_MAX = 16`. Names, kinds, and
sizes are not reference-path components, and no deeper path is legal. The
kind-specific allowed Type set is the content-profile check below.

The reverse-membership backlink is this chapter's contribution to the costed
reverse-membership/cited-by obligation [OWNER RULING — owner-rulings.md
2026-07-15 item B, "reverse membership + REDIRECT cited-by: ON-CHAIN",
VERIFIED; carried as an acceptance obligation in the 2026-08-12 ruling,
VERIFIED].

Validation split (per §2.1):

1. **Core:** `1 ≤ len(members) ≤ MAX_CLOSURE_MEMBERS` (`MAX_CLOSURE_MEMBERS = 16`
   [PROPOSAL — governed by SR-18e's per-leaf reference-instance bound
   `REF_INSTANCES_MAX = 16` (every member is a role-bound reference with the
   owner-obligated reverse-membership backlink, and ARRAY(REF) role counts are
   included in that bound), which is tighter than the SR-5 body-bytes
   derivation: see §8.4; nesting provides scale]).
2. **Core:** each `name` is valid UTF-8 with declared 1..255-byte bounds
   (`MAX_MEMBER_NAME_BYTES = 255`). **Profile/read:** no `0x00`, no `/`
   (0x2F), and not `.` or `..`. **Portable presentation/collision policy
   (case folding, Unicode normalization, Windows reserved names) is the mount
   lane's read-side problem; the closure commits raw bytes** and two names
   differing only by normalization are distinct members [PROPOSAL — identity
   must not depend on host-collation opinions].
3. **Profile/read:** members strictly sorted by `name` bytewise ascending; duplicates therefore
   impossible.
4. **Profile/read:** `kind` is in `{FILE, EXEC_FILE, SUBCLOSURE}` and is
   consistent with the referenced Record's Type. Core extracts and indexes the
   target but does not implement this cross-field/target-Type rule.
5. **Profile/read:** no symlinks, hardlinks, or empty directories in v1: a SUBCLOSURE target
   with zero members is impossible by bound 1's minimum. [PROPOSAL — symlink
   escape/aliasing is the classic archive-extraction attack surface; the
   mount profile is read-only and needs none of it. A later
   `ArtifactClosure/2` can add link kinds.]

Semantics:

- **Nesting**: SUBCLOSURE members give git-tree-style structure sharing;
  identical subtrees share one RecordId. Cycles are structurally impossible —
  a closure cannot reference itself because its RecordId is a hash of its body
  (no hash fixed points — kickoff technical gate). Deep DAGs are legal;
  **walks are client-bounded** at `MAX_CLOSURE_WALK_DEPTH = 16` [PROPOSAL —
  a walk bound, not an identity bound: Core cannot see global depth; a walk
  that hits the bound reports `PARTIAL`, never absence].
- `size` on a FILE member duplicates the target ChunkTree's `totalSize` so
  directory listings don't fan out N point reads. It is a **claim checked at
  read**: a walker that observes `member.size ≠ target.totalSize` (or
  SUBCLOSURE `size ≠ len(target.members)`) grades the closure
  `CLOSURE_MALFORMED` and MUST NOT present the mismatched member as verified
  [PROPOSAL — honors the "confirms-but-unreadable" lesson: every write-side
  convenience field gets a read-side check].
- Single-file artifacts do NOT use a closure: releases reference `ChunkTree/1`
  directly (§9), because a mandatory member name would drag naming into
  content identity.
- Absence semantics: "name X is not in closure C" is **provable absence**
  (members are FINAL and sorted). This is the only absence this chapter's
  types ever ground; locators and availability never ground absence (§3).

## 8. The staged 50 GB flow — exact state machines

This section is normative client-side behavior (SDK/reader), not Core state.
It implements the constitution's Large-content acceptance trace end to end
[DERIVED INVARIANT — constitution acceptance table "Large content" row,
VERIFIED].

### 8.1 Publication-side ladder (per subject)

States are facts-about-admitted-Records, so publication is monotone evidence
accretion — no state ever rewrites a prior one:

```text
P0 SUBJECT_ONLY   : ObjectGenesis/1 admitted (stable ObjectId). No content claim.
P1 LOCATED        : ≥1 Locator/1(subject) admitted, no observation group.
                    Content identity: none. Read grade: BYTES_UNBOUND.
P2 OBSERVED       : ≥1 Locator/1 with observation group and/or ByteDigest/1 +
                    RepresentationBinding intent. Content identity: CANDIDATE
                    (a digest names bytes but cannot range-verify them).
P3 COMMITTED      : ChunkTree/1 (and ArtifactClosure/1 for packages) admitted;
                    RepresentationBinding/1 links P2 digests to it.
                    Content identity: EXACT; range verification enabled.
P4 RELEASED       : ArtifactRelease/1 admitted referencing the commitment.
Transitions: P0→P1→P2→P3→P4 is the canonical ladder; any forward jump is legal
(publish a ChunkTree first ⇒ enter at P3); backward transitions do not exist —
earlier Records are never rewritten, later evidence is additive [DERIVED
INVARIANT — append-only history, constitution "One transaction and honest
mutation", VERIFIED].
```

The phone test: pasting a 50 GB URL creates P1 in one small write. Whole-file
hashing happens wherever bytes and compute meet (any relayer/worker can build
the ChunkTree — the tree has no author-secret inputs), and P3 lands later
without blocking P1 [DERIVED INVARIANT — constitution: "A pasted 50 GB URL may
begin as a Locator; it need not block on a phone hashing the entire object",
VERIFIED].

### 8.2 Acquisition-side machine (per (ChunkTree T, locator set L))

Client persistent state: `coverage` bitmap of `T.chunkCount` bits keyed by
`RecordId(T)`; `locatorStatus : map locator → {UNTRIED, LIVE, MISMATCH, DEAD}`.

```text
A0 INIT             : have T (the Record); coverage = ∅.
A1 SOURCED          : candidate locators selected (§10.3 selection — B0
                      on-chain algorithm or deferred client profile — or caller-
                      supplied); at least one UNTRIED/LIVE locator.
A2 RANGE_SERVING    : steady state. For each requested byte range [a,b):
                      i0 = ⌊a / T.chunkSize⌋ ; i1 = ⌈b / T.chunkSize⌉ − 1
                      for each i in [i0..i1] with coverage[i] == 0:
                        FETCH chunk i (+ proof, unless holding a verified manifest)
                        if verifyChunk(...) == false:
                           locatorStatus[src] = MISMATCH; do NOT emit bytes;
                           rotate to next locator (A1) — wrong bytes are a
                           locator failure, never a content failure
                        else: coverage[i] = 1; persist
                      emit bytes[a..b) sliced from verified chunks only
A3 COMPLETE         : coverage all-ones AND Σ verified chunk lengths == T.totalSize.
                      Only now may the client claim a complete Artifact.
A4 STALLED          : no LIVE locator and coverage incomplete. Report
                      PARTIAL(k, n) with the exact bitmap. NEVER report absence,
                      NEVER report COMPLETE, NEVER serve unverified bytes as a
                      fallback [DERIVED INVARIANT — constitution: partial/resume
                      exposes verified coverage and never claims a complete
                      Artifact early, VERIFIED].
Resume: A0 with persisted coverage ⇒ A1 directly; a DIFFERENT client/device
resumes from the same public evidence + its own bitmap. If local chunk bytes
are cached, client policy either re-hashes them on load (paranoid) or trusts
its own store (normal); the machine marks the difference as
REVERIFY_PENDING vs VERIFIED — local-store trust is a disclosed client-policy
boundary, not silently assumed [PROPOSAL].
Coverage vocabulary exposed to Lane 5/readers:
  BYTES_UNBOUND | BYTES_PARTIAL(k,n) | BYTES_COMPLETE | CONTENT_MISMATCH(locator)
— orthogonal to the presence axis (FOUND/ABSENT/…): coverage grades bytes for a
FOUND commitment; it never answers whether the commitment exists [DERIVED
INVARIANT — never collapse the result tuple; intake CARRY-IN read-honesty
finding, VERIFIED there. Grade names are the July BYTES-* vocabulary re-earned:
large-file-uploads.md §"The mechanism" item 6, VERIFIED].
```

### 8.3 The executable gate

A consumer executing bytes (artifact runner, script host, mount of an
EXEC_FILE) requires, before the first instruction runs:

1. the governing `ArtifactRelease/1` resolved through the risk-bearer's Lens
   (Lane 5);
2. **every** member ChunkTree of the referenced closure at `A3 COMPLETE`
   (whole-artifact, not just the ranges touched); and
3. capability grants decided by the client/OS from `RuntimeRequest/1` — the
   request itself grants nothing (§9).

Range-lazy execution (mmap-style demand paging of an executable) is
**forbidden** in v1 [DERIVED INVARIANT — "Executable bytes verify before
execution", constitution, VERIFIED; the split between full-verify executables
and range-verify passive content is the constitution's own line]. Passive
content (video seek, dataset slice) uses A2 range serving freely.

### 8.4 EIP-7825 arithmetic (protocol physics for every bound above)

[standards FACT — VERIFIED via intake audit STANDARDS lane: EIP-7825 caps
every L1 transaction at 16,777,216 gas, live since Fusaka 2025-12-03. An L2/L3
Realm may or may not enforce it; B0 sizes against L1 as the worst case and
each Realm descriptor states its own cap (Lane 3 seam).]

- **Body bound.** Inline-leaf admission (axis 5) stores canonical bodies in
  state. Cold SSTORE ≈ 22.1k gas per 32-byte word ⇒ the pinned 8,192-byte
  body ≈ 256 words ≈ 5.66M gas storage alone. SR-5 pins `MAX_BODY_BYTES =
  8,192` ([HYPOTHESIS] there; Stage B re-derives), and this chapter
  **re-derives the member ceiling against it**: worst-case member ≈ 12 words
  (384 B) under a word-aligned codec (name ≤ 255 B ⇒ 8 name words + ref +
  size + kind + len) ⇒ the body admits at most ⌊8,192 / 384⌋ = 21 worst-case
  members, or ~64 members at a ≈ 4-word (≤ ~128 B) average — names averaging
  ≤ ~64 B. The **governing bound is structural, not bytes**: SR-18e caps
  per-leaf role-bound reference instances at `REF_INSTANCES_MAX = 16`
  (including the `ARRAY_STRUCT_MEMBER(members,content)` selector), and every closure member is one
  role-bound reference, so `MAX_CLOSURE_MEMBERS = 16` — at which even
  all-worst-case names fit the body (16 × 384 = 6,144 B ≤ 8,192 B). All
  bounds are enforced; the tighter one wins. [PROPOSAL — re-derived under
  SR-5 + SR-18e. Supersedes the draft's `128` (derived from an assumed
  16 KiB body with no REF-instance bound), kept as the visible delta:
  16 KiB ⇒ 128 at a ≤ ~64 B average-name budget; the pinned 8,192 ⇒ 64;
  the SR-18e REF bound ⇒ 16.]
- **Chunk-hash manifests can never be Records**: 6.55 MB ≫ any admittable
  body (§5.4).
- **State-tier custody (optional venue module, §11):** EIP-170 allows
  24,576 runtime bytes, but SSTORE2-shaped code spends one leading `STOP`
  guard byte; therefore `SSTORE2_PAYLOAD_MAX = 24,575`, not 24,576. The
  largest page-aligned payload is `CHUNK_SIZE_STATE = 20,480`. One such chunk
  per tx costs calldata 20,480·16 ≈ 328k + keccak ≈ 3.9k + proof verify
  ≈ 1k + code deploy 200·(20,480 + 1) ≈ 4.10M + create/base overhead
  ≈ 55k ⇒ **≈ 4.5M gas ≪ 16,777,216** ✓. Two chunks cost ≈ 9.0M;
  three fit the arithmetic floor at ≈ 13.5M but are not promised before a
  venue measurement, so the optional profile conservatively retains
  `MAX_CHUNKS_PER_SUBMIT_TX = 2` [PROPOSAL — margin discipline].
- A `CHUNK_SIZE_DEFAULT` (256 KiB) chunk **cannot** reach state-tier custody
  in one L1 tx: code-deploy alone 200·262,144 ≈ 52.4M > cap, and EIP-170 caps
  a single runtime to 24,576 bytes including its guard byte anyway. This is
  exactly why
  `CHUNK_SIZE_STATE` exists and why chunk size is a declared field.
- **50 GiB at state tier** = 2,621,440 chunks (< `CHUNK_COUNT_MAX` ✓) ⇒
  ~2.62M
  transactions ≈ 11.8T gas: economically absurd on L1 and cited as such — the
  honest 50 GB posture is durable off-chain custody with graded evidence
  (§10), not state custody [derived arithmetic; consistent with the L2/L3-
  first direction, owner-rulings 2026-07-07 ruling #4 as July evidence].

## 9. ArtifactRelease/1 and RuntimeRequest/1

Purpose: the publisher-qualified semantic release: "I, the publishing
Principal (via my Occurrence), release version V of subject S as exactly
commitment A". Discovery/presentation metadata **never authorizes execution**
[DERIVED INVARIANT — constitution "Privacy, safety, and execution", VERIFIED],
so the runtime/capability ask is a separate Record the release references.

```text
ArtifactRelease/1 {
  subject       : reference        -- role "subject", REQUIRED (stable lineage)
  artifact      : reference        -- role "artifact", REQUIRED (exact commitment)
  versionLabel  : bytes            -- 1..MAX_VERSION_LABEL_BYTES (=64), testimony
  custodyFloor  : uint8            -- 0 = none, else minimum DurabilityGrade
                                   -- class ordinal (§10 table) required before
                                   -- this release reads BYTES_COMPLETE
  runtime       : reference?       -- role "runtime", OPTIONAL
  notes         : reference?       -- role "notes", OPTIONAL (any Record)
}

RuntimeRequest/1 {
  runtimeProfile : bytes32                    -- pinned profile tag (Codex table)
  capabilities   : array of bytes32           -- 0..MAX_CAPABILITY_ENTRIES (=64)
                                              -- sorted ascending, unique
}
```

| Type.role | Allowed targets | Cardinality | Declared index |
|---|---|---|---|
| Release.subject | `ObjectGenesis/1` | 1 | target-first backlink ("releases of S") |
| Release.artifact | `ArtifactClosure/1`, `ChunkTree/1` | 1 | target-first backlink ("releases shipping A") |
| Release.runtime | `RuntimeRequest/1` | 0..1 | none |
| Release.notes | any | 0..1 | none |

Core enforces only field/option/array bounds, reference extraction, and any
exact singleton expected Type. The multi-Type artifact set, custody ordinal
range, `versionLabel` meaning, and RuntimeRequest capability ordering are
bounded content-profile checks. In particular `capabilities` being sorted and
unique is not a Core admission claim; a violation grades the runtime request
`PROFILE_MALFORMED` and grants nothing.

Semantics:

- "Publisher-qualified" means: which releases count is a Lens question over
  the Occurrence authors and the risk-bearer's Plan (Lane 5); the type never
  carries an "official" bit [DERIVED INVARIANT — candidate Arcade worked
  example: "No global canonical game, no official bit", VERIFIED].
- `custodyFloor` re-earns the July `contractReadable` ruling as a generalized
  **capability floor named by property, not tier number** [PROPOSAL —
  evidence: James 2026-07-07 ruling #1 (ADOPTED there; July mechanism, so
  re-entered as a labeled proposal): the author expresses the guarantee, the
  system picks custody; read-enforced — a release with floor F does not read
  `BYTES_COMPLETE` until a locator with `AvailabilityObservation` COMPLETE at
  `DurabilityGrade.class ≥ F` is admitted; it cannot force anyone to pay,
  VERIFIED in large-file-uploads.md §"James rulings" 1].
- `RuntimeRequest/1` is inert data: grants are made by the client/OS at
  install/run ceremony, against the release resolved in trusted chrome
  (the rollback-by-presentation and freeze attacks and their repairs are the
  gate lane's conformance set — AV-15/16/17/19/20 via intake CARRY-IN,
  VERIFIED there; this chapter only pins that request ≠ grant).
- Selecting "the current release" of a subject is a Binding (Lane 2's
  `PositionKey(purpose="release-head", subject, fieldRole)`) by whichever
  curator Principal the reader's Lens trusts — never a field of this Record.

## 10. Durability, funding, and availability evidence + the best-locator seam

### 10.1 DurabilityGrade/1 — custody-class claims

```text
DurabilityGrade/1 {
  locator     : reference       -- role "locator", REQUIRED
  class       : uint8           -- table below
  fundingUri  : bytes?          -- OPTIONAL, Locator URI rules: where the
                                -- endowment/pin contract/grant is inspectable
  horizonClaim: uint64?         -- OPTIONAL claimed unix seconds (testimony)
}
```

Custody classes [PROPOSAL — ordinal table; evidence: the July BYTES grades and
the owner storage direction "on-chain > Arweave > grant-pinned IPFS >
volunteer IPFS" (owner-rulings 2026-07-10 Storage, VERIFIED); CHAIN_HISTORY is
inserted below ENDOWED because EIP-4444 partial history expiry is live
protocol direction — pre-merge history droppable since 2025-05, rolling window
unscheduled (standards FACT, VERIFIED via intake audit STANDARDS lane) — so
history-tier bytes are honestly weaker than a pay-once endowment]:

| Ordinal | Class | Meaning |
|---|---|---|
| 5 | `STATE_PERMANENT` | bytes in contract-readable Realm state |
| 4 | `ENDOWED_PERMANENT` | pay-once endowed store (Arweave-class) |
| 3 | `CHAIN_HISTORY` | bytes rode a chain's history/DA, archival-grade |
| 2 | `FUNDED_PINNED` | pinned under an inspectable funding arrangement |
| 1 | `BEST_EFFORT` | volunteer/unfunded custody |
| 0 | `EPHEMERAL` | cache/CDN/no persistence claim |

A grade is a **claim by its Occurrence author** about a locator's custody, not
a Core-verified fact; which authors' grades count is the reader's Plan. The
class ordinals are shared vocabulary so Plans and the mount/read layer can
compare claims deterministically.

### 10.2 AvailabilityObservation/1 — probe results (mirror health)

```text
AvailabilityObservation/1 {
  locator        : reference      -- role "locator", REQUIRED
  commitment     : reference      -- role "commitment", REQUIRED
  outcome        : uint8          -- 0x01 COMPLETE | 0x02 PARTIAL | 0x03 UNREACHABLE | 0x04 MISMATCH
  verifiedChunks : uint32         -- k (COMPLETE ⇒ k == n; else k < n; UNREACHABLE ⇒ 0)
  probedAtClaim  : uint64         -- claimed unix seconds (testimony)
}
```

| Role | Allowed targets | Cardinality | Declared index |
|---|---|---|---|
| `locator` | `Locator/1` | 1 | target-first backlink ("probes of L") |
| `commitment` | `ChunkTree/1`, `ArtifactClosure/1` | 1 | none (reached via locator) |

Core enforces the field encodings, independent ranges, references, and exact
singleton Locator target. The commitment target set and the cross-field
relationships (`COMPLETE ⇒ verifiedChunks == n`, `UNREACHABLE ⇒ 0`, and
otherwise `< n`) are bounded profile/read checks. A nonconforming observation
is preserved testimony but ineligible for health selection.

`MISMATCH` means proof-failing bytes were served — the strongest negative
signal a prober can publish, and it indicts the locator, never the content.
`UNREACHABLE` never grounds absence of the bytes (§3 absence discipline).

### 10.3 Best-locator selection: the B0 on-chain algorithm (cross-ref) and the deferred client profile

The constitution's costed gate is "deterministic best-locator selection from
bounded declared evidence" [DERIVED INVARIANT — constitution "On-chain graph
and indexes", line 180-184, VERIFIED]. Division of labor under SR-18c:

- **The B0 on-chain algorithm is owned by [[b0-indexes]] §7** [PROPOSAL —
  SR-18c]: a bounded deterministic selection over a **single declared score
  field**, whose examination budget bounds the TOTAL postings visited — live
  or dead (SR-10's one-way status flip is what marks the dead) — so a spray
  of self-revoked postings degrades to an honest `PARTIAL` + cursor, never an
  unbounded scan (THE LINE). That algorithm is what satisfies the on-chain
  best-mirror obligation, with zero new Core state [OWNER RULING —
  owner-rulings.md 2026-07-15 item C: best-mirror ranking ON-CHAIN, zero new
  state, VERIFIED — re-earned as generic Types feeding Lane 5's bounded
  algorithm; every input is an ordinary Record reached through declared
  indexes, and algorithm ownership sits with the index chapter per SR-18c].
- **This chapter owns the evidence shapes** the selection consumes:
  `Locator/1` (§3), `DurabilityGrade/1` (§10.1), `AvailabilityObservation/1`
  (§10.2), and the class-ordinal comparator vocabulary (§10.1).
- **B0 posture over Locator/1** [PROPOSAL — minimal posture; no body change]:
  `Locator/1` declares no `uint64` score field, so B0 on-chain selection over
  locator candidates runs in the index chapter's recency mode (latest by
  AdmissionOrdinal at basis B); a publisher wanting field-scored selection
  compiles its score into one canonical body field at publication, per the
  index chapter's SelectSpec rules.

The exact B0 selector surface consumed here is:

```solidity
function selectBestLocator(
    bytes32 targetKey,
    SelectSpec calldata spec,       // one uint64 score field or SCORE_LATEST
    uint64 basisOrdinal,
    uint256 cursor
) external view returns (
    uint64 bestOrdinal,
    uint64 bestScore,
    uint16 postingsVisited,
    uint256 nextCursor,
    Completeness completeness
);
```

`LOCATOR_POSTINGS_VISIT_MAX = 32` bounds sequential postings visited, dead
included; the owner additionally accounts for its bounded canonical-end
probes in `postingsVisited`. On an initial `cursor == 0`, `basisOrdinal == 0`
pins the current high-water once. A resumable cursor commits that exact basis,
canonical end, target, and `SelectSpec`; every continuation uses the same
basis and context. `PARTIAL` always carries a nonterminal `nextCursor`, and
`bestOrdinal == 0 && PARTIAL` never proves absence. Whole-query absence needs
an initial empty `COMPLETE` or aggregation of every window in one canonical
cursor chain. An undeclared/invalid Type-role-score profile is `UNSUPPORTED`,
not `COMPLETE + empty`; an unavailable basis is UNKNOWN at the client boundary
(and an invalid on-chain basis/cursor reverts), never a lower-priority
fallthrough. The sole B0 total order is `(score desc, AdmissionOrdinal asc)`.
For either `COMPLETE` or `PARTIAL`, no eligible winner is encoded exactly as
`bestOrdinal = 0, bestScore = 0`. Implementations track `winnerPresent`
separately from the score: an eligible real occurrence may have score zero and
then returns its nonzero ordinal (with `bestScore = 0`). Sentinel comparison
must never cause that candidate to disappear.

**`SELECT_PROFILE_V2` — the client-tier graded fold (explicitly deferred;
NOT B0)** [PROPOSAL — re-scoped by SR-18c from this chapter's draft, where
the fold below was the normative selection; kept fully specified as a
sub-variant so the profile can graduate without redesign. It is not
implemented, not evaluated on-chain, and not vectored in B0.]

For subject commitment T at Realm basis B, with admissible-author set P from
the Plan:

```text
CandidateSet(T, B, P) =
  first MAX_LOCATOR_CANDIDATES (=32) Locator/1 Records targeting T via the
  subject backlink, in admission-ordinal order at basis B, having ≥1
  Occurrence whose author ∈ P.
  If the backlink page truncates (more candidates exist), the selection result
  carries coverage = PARTIAL — a best-of-partial answer is labeled, never
  silently complete [DERIVED INVARIANT — honest pagination, constitution,
  VERIFIED].

LocatorEvidence(L, T, B, P) =            -- deterministic fold, per candidate
  grade    = max class over admitted DurabilityGrade/1(locator=L) with
             author ∈ P; 0 if none        -- max: a locator is as durable as
                                          -- its best admissible custody claim
  health   = outcome of the admissible AvailabilityObservation/1(locator=L,
             commitment=T) with the HIGHEST AdmissionOrdinal ≤ B
             (venue-relative recency — never probedAtClaim);
             0x00 UNPROBED if none
  firstOrd = lowest AdmissionOrdinal of any admissible Occurrence of L

SelectionKey(L) = ( healthRank(health),   -- COMPLETE=3, PARTIAL=2, UNPROBED=1,
                                          -- UNREACHABLE=0, MISMATCH=−1
                    grade,                -- ordinal §10.1, descending
                    −firstOrd,            -- earlier admission wins (stability)
                    RecordId(L) )         -- total-order tiebreak, bytes ascending
best = candidate with the lexicographically greatest SelectionKey;
MISMATCH-health locators are excluded entirely unless every candidate is
MISMATCH, in which case the result is CONTENT_MISMATCH, not a selection.
```

[PROPOSAL — profile design choice, deferred with the profile: the exact key
order (health before grade) means serving verified bytes now beats a better
custody class that currently fails; grade dominates among equally healthy
locators. Falsifiable by the fixture: if the Arcade tampered-primary trace
shows probe-lag flapping, swap to (grade, health, …) and re-run — the
harness measures both orderings as client-tier measurement (O5).]

Bound: `MAX_LOCATOR_CANDIDATES = 32` [PROPOSAL — profile constant, deferred
with the profile. The contract-tier sizing (32 candidates × (1 backlink read
+ ≤ 2 point reads + ≤ 1 observation read) ≈ ≤ 128 cold reads ≈ ≤ 350k gas,
PLAUSIBLE arithmetic at ~2.6k/cold read, far inside EIP-7825) is retained
only as evidence that a future on-chain graduation of the profile fits; the
B0 on-chain path is the index chapter's, above].

## 11. The venue byte-store seam (sketch only — not part of B0 Core)

B0's axis-6 pin (one atomic Core) covers **Records**; chunk *bytes* are not
Records and no byte-store is part of B0 Core. Rationale: contracts consume
byte *metadata* (commitments, sizes, locators) in bounded gas; raw large
bytes are custody, graded honestly [OWNER RULING as July evidence —
owner-rulings 2026-07-15 item 16: "if a contract can't read it in bounded gas,
it's off-chain"; the greenfield reset keeps the lesson, VERIFIED].

A Realm MAY deploy an optional, separate byte-store module; its interface is
sketched here as a **bakeoff arm** so Locator conventions have a target
(evidence: the July EFSBytes design and red-team fixes — one signature commits
every byte; chunks need no signature; anyone may submit; presence bitmap =
stateless resumable session; `submitChunkRun` batch-proof REJECTED (novel
crypto, OZ-multiproof CVE class) — large-file-uploads.md, VERIFIED):

```solidity
interface IByteStore {                       // sketch — bakeoff arm, not B0
  /// Admit chunk `index` of the commitment iff it proves against the
  /// ChunkTree parameters. msg.sender is ignored (anyone may relay).
  function submitChunk(
    bytes32 chunkTreeRecordId,               // the commitment handle (§5.2)
    uint32 chunkCount, uint32 chunkSize, uint64 totalSize, bytes32 merkleRoot,
    uint32 index, bytes calldata chunk, bytes32[] calldata proof
  ) external;                                // params re-hashed against the
                                             // RecordId preimage on first call
  function coverage(bytes32 chunkTreeRecordId, uint256 word)
    external view returns (uint256 bitmap);  // 256 chunks per word
  function readRange(bytes32 chunkTreeRecordId, uint64 offset, uint32 len)
    external view returns (bytes memory);    // bounded contract-readable reads
}
```

**CREATE2 pre-occupation note** [PROPOSAL — venue-arm deployment discipline,
repairing the red-team CREATE2 front-running finding; the harmlessness
argument is arithmetic over the CREATE2 address formula]. If the store
persists chunks SSTORE2-style, it deploys via CREATE2 **from the store
contract itself**, with a content-derived salt (e.g.
`keccak256(chunkTreeRecordId ‖ index)`) and an init code that is the standard
data-constructor **embedding runtime `0x00 ‖ chunkBytes`**, with no
environment-reading opcodes. The leading `0x00` is the SSTORE2 `STOP` guard,
so `1 + len(chunkBytes) ≤ 24,576` and the aligned venue profile uses
`CHUNK_SIZE_STATE = 20,480` (§8.4); runtime code is a pure function of init
code. Then
`address = keccak256(0xff ‖ store ‖ salt ‖ keccak256(initCode))[12:]`
commits to the chunk bytes through the init-code hash, so:

- **Pre-occupation is harmless dedup.** Only the store can create at that
  address (the deployer address is inside the formula), and the store deploys
  only after `verifyChunk` passes — so a front-runner racing the same
  `submitChunk` merely lands the identical bytes first; the later call sees
  code already present at the computed address, verifies its proof, marks
  coverage, and succeeds idempotently (`msg.sender` is ignored by design).
- **Deploying different content at the same address is impossible.**
  Different chunk bytes ⇒ different `keccak256(initCode)` ⇒ different
  address; and post-Cancun (EIP-6780) code at an address cannot be replaced
  after its creating transaction, so the address→bytes binding is permanent.
- The DoSable shape — attacker-supplied init code with only a content-derived
  **salt** carrying the commitment — is [REJECTED] for this arm: there the
  deterministic address does not commit to the content, so a squatter could
  pre-occupy it with unrelated code and permanently block state-tier custody
  of that chunk.

Corresponding Locator convention: a state-tier custody claim is an ordinary
`Locator/1` whose URI names the store and commitment (e.g.
`web3://<store>/readRange?...` under the §3 web3:// pinning) — the store is
just another locator target, selected by the §10.3 selection like any
mirror. The
one-signature/funding trilemma finding carries: authorization ≠ completion ≠
funding; an authorized-but-unfunded upload honestly reads
`BYTES_PARTIAL(k,n)` forever [DERIVED INVARIANT — large-file-uploads.md "What
one signature honestly buys", VERIFIED].

## 12. Honest behavior when a source basis is unavailable

Per the PM execution defaults (no dead-chain survival machinery; qualifying-
Realm assumptions instead): a qualifying Realm is assumed persistent and
queryable [OWNER RULING — chains-don't-die, owner-rulings 2026-07-10,
VERIFIED; its per-Realm scope for fresh L3s carries the **one set-wide
disposition** (overview §5.1): this chapter is designed to work under either
answer, and the question is surfaced to James only via proposed spine-edit
A2, not asked now]. When evidence *imported* from
another Realm (a source-qualified Locator/grade/observation copy) cannot be
checked because the source basis is unreachable, readers grade it
`UNKNOWN`-basis evidence: it may inform display, never selection ranks in
§10.3 (admissibility requires evidence admitted at the reading Realm's basis
B). Nothing here fabricates freshness for unreachable sources, and no
machinery pretends to survive a dead source Realm [PROPOSAL — the minimal
honest posture consistent with both the ruling and the directive].

## 13. Golden-vector categories and falsifiers (harness hooks)

Vector categories this chapter owes the measurement lane (cross-language:
Solidity/TypeScript/Rust):

1. **ByteDigestValue**: each algorithm round-trip; multihash projections;
   wrong-length digest Core-rejected; known-but-out-of-subset `algCode` grades
   `PROFILE_MALFORMED(ALGORITHM_NOT_IN_CONTENT_V1)` — including
   `0x0001`/`0x0002`/`0x0003` (the retired u8-tag values, catching
   implementations shipping the superseded table), `0x0011` (raw sha1), and
   `0x0013` (sha2-512): all are legal or reserved elsewhere in the encoding
   vocabulary but outside this chapter's v1 subset; `ni:` projection
   round-trip; `0xEF01` Git-framed export marked lossy when projected to raw
   sha1 multihash.
2. **ChunkTree**: n=1 (root == leaf, empty proof); n=2; n=3 (promotion); n=5
   (double promotion); n=256; last-chunk-short; `chunkCount ≠
   ceil(totalSize/chunkSize)` is Core-admitted but
   `PROFILE_MALFORMED(CHUNK_ARITHMETIC)` and never verified; tampered chunk fails; wrong-index
   proof fails; padded proof fails (trailing-hash rejection); truncated proof
   fails; chunk-bytes-as-node and node-as-chunk cross-role preimages fail;
   the same bytes at `CHUNK_SIZE_DEFAULT` vs `CHUNK_SIZE_STATE` yield
   distinct RecordIds (documented non-convergence).
3. **Closure**: valid `ARRAY_STRUCT_MEMBER(members,content)` extracts all
   references in wire order and emits all backlinks; DIRECT applied to the
   struct array, a non-reference selected member, a second-depth selector, or
   17 reference instances is Core-rejected. Unsorted members, duplicate names,
   `/`, `.`/`..`, and kind/target mismatch are Core-admitted but deterministically
   `PROFILE_MALFORMED`; a 256-byte name is Core-rejected by its bound;
   member.size mismatch detected at walk
   (`CLOSURE_MALFORMED`); nested dedup (identical subtree → one RecordId);
   walk-depth bound reports PARTIAL.
4. **Flow**: P1→P3 additive (earlier Locator RecordId unchanged after closure
   lands); A2 mismatch rotation (Arcade tampered-primary trace: primary
   serves one bad chunk → MISMATCH → fallback completes → A3); resume from a
   different client using only public Records + fresh bitmap; executable gate
   refuses at k = n−1.
5. **Selection**: B0 on-chain selection vectors (single declared score field;
   examination budget bounds TOTAL postings visited, live or dead; spray of
   self-revoked postings → honest `PARTIAL` + cursor) are owned by the index
   chapter per SR-18c. Deferred with `SELECT_PROFILE_V2` (minted only if the
   profile graduates): two implementations, one Plan, one basis →
   byte-identical selection; candidate-page truncation → PARTIAL-labeled
   result; all-MISMATCH → CONTENT_MISMATCH; claimed-time manipulation (absurd
   `probedAtClaim`) does not move the ranking (venue-ordinal recency only —
   the R-D9 misleading-clock vector).

Chapter-level falsifiers: (a) any deliverable above needs a Core primitive or
private index — falsifies the generic-types claim; (b) the member ceiling
(16, SR-18e-governed) forces real Arcade packages past nesting depth 4 —
revisit `REF_INSTANCES_MAX`/`MAX_CLOSURE_MEMBERS`/`MAX_BODY_BYTES` with
Lanes 1/5; (c) the deferred `SELECT_PROFILE_V2` fold busts its retained gas
sizing at 32 candidates if it ever graduates on-chain — return the bound per
the return-to-James rule.

## Interfaces exposed

**Shared value type** (usable in any lane's bodies):
`ByteDigestValue { algCode uint16, digest bytes }` over the encoding
chapter's `u16` algCode table (SR-18a — one table everywhere: `DIGEST`
values, ByteDigest bodies, index keys zero-extended). Closed subset legal
under this chapter's v1 types: `{0xEF01 git-sha1-object/20 (foreign-only,
framed preimage), 0x0012 sha2-256/32, 0x001B keccak-256/32}`; out-of-subset
codes fail content-profile conformance (globally unknown codes or wrong lengths
fail Core structure); multihash projections `0x12 20‖d`, `0x1b 20‖d`, while
projecting `0xEF01` as raw sha1 `0x11 14‖d` is explicitly lossy of framing.

**Type Schemas** (axis 4 Variant A; names bind, TypeSchemaIds derive via Lane
4): `Locator/1`, `ByteDigest/1`, `ChunkTree/1`, `ArtifactClosure/1`,
`RepresentationBinding/1`, `ArtifactRelease/1`, `RuntimeRequest/1`,
`DurabilityGrade/1`, `AvailabilityObservation/1` — bodies, roles, per-role
  backlink declarations, Core structural validation, and bounded profile/read
  conformance exactly as §2.1 and §§3–10.

**Deterministic entry points other lanes may rely on**:
- `RecordId(ByteDigest/1{algCode,d})` computable offline ⇒ content-digest
  lookup is a point read + declared backlinks (no bespoke index; Lane 5/6
  cost only the backlink pages; Lane 5's global digest key family keys on the
  same zero-extended `u16 algCode`, SR-18a).
- `ChunkTreeVerify.verifyChunk(root, n, chunkSize, totalSize, index, chunk,
  proof) → bool` — pure library, exact algorithm §5.3; any venue byte-store,
  contract consumer, or client verifier uses this one function.
- Coverage vocabulary `BYTES_UNBOUND | BYTES_PARTIAL(k,n) | BYTES_COMPLETE |
  CONTENT_MISMATCH(locator)` — orthogonal to Lane 5's presence axis; the
  mount and Files lanes present it, never collapse it.
- `DurabilityGrade.class` ordinal table (§10.1) — shared comparator vocabulary
  for Plans, mounts, and clients.
- Best-locator evidence shapes (§10): `Locator/1` + `DurabilityGrade/1` +
  `AvailabilityObservation/1` feed the B0 on-chain bounded selection owned by
  [[b0-indexes]] §7 (SR-18c; single declared score field, total-postings
  examination budget, canonical pinned-basis cursor, `PARTIAL + nextCursor`,
  and no false-empty result for undeclared/unavailable input). The
  `CandidateSet`/`LocatorEvidence`/`SelectionKey`
  fold is the client-tier `SELECT_PROFILE_V2`, **explicitly deferred** — Lane
  5 supplies (P, B) from the Plan only if the profile graduates.
- Executable gate rule (§8.3): full `A3 COMPLETE` before execution; request ≠
  grant.

**Named constants**: `MAX_LOCATOR_URI_BYTES 2048; CHUNK_SIZE_ALIGN 4096;
CHUNK_SIZE_MIN 4096; CHUNK_SIZE_MAX 8388608; CHUNK_SIZE_DEFAULT 262144;
SSTORE2_RUNTIME_GUARD_BYTES 1; SSTORE2_PAYLOAD_MAX 24575;
CHUNK_SIZE_STATE 20480; CHUNK_COUNT_MAX 16777216; MAX_CLOSURE_MEMBERS 16
(SR-18e-governed, §8.4); MAX_MEMBER_NAME_BYTES 255; MAX_CLOSURE_WALK_DEPTH
16; MAX_VERSION_LABEL_BYTES 64; MAX_CAPABILITY_ENTRIES 64;
MAX_LOCATOR_CANDIDATES 32 (SELECT_PROFILE_V2, deferred);
MAX_CHUNKS_PER_SUBMIT_TX 2 (venue sketch); LEAF_TAG 0x00; NODE_TAG 0x01.`

## Open items

- **O1 (Lane 1/SR-5 — updated post-red-team):** `MAX_BODY_BYTES = 8,192` is
  now pinned by SR-5 ([HYPOTHESIS] there), and §8.4's re-derivation lands
  `MAX_CLOSURE_MEMBERS = 16` (SR-18e's per-leaf REF-instance bound governs;
  the body bound alone would admit ~64 average-name members). Remaining open:
  the Stage B harness re-derives the SR-5 size constants against per-Realm
  gas caps — if either pinned constant moves, §8.4 re-runs. Closed by: the
  measurement harness.
- **O2 (Lane 4) — CLOSED:** `expectedType` expresses `ANY` or one exact
  `TypeSchemaId`; no set-valued role constraint is added. Every listed
  multi-Type target set is bounded content-profile/read conformance (§2.1).
  `Release.notes` spells `ANY`.
- **O3 (Lane 3) — CLOSED:** Core checks an exact singleton `expectedType` when
  declared. Artifact member kind/target agreement and every multi-Type target
  set are bounded profile/read checks; admission does not call a content
  validator or perform semantic set membership.
- **O4 (chains-don't-die scope — aligned to the set-wide disposition):**
  per-Realm scope of chains-don't-die for fresh L3 custody claims (§12) —
  **one disposition, set-wide** (overview §5.1): this chapter's
  honest-UNKNOWN posture is designed to work under either answer, and the
  question is surfaced to James **only** via proposed spine-edit A2, not
  asked now. Closed by: James at Stage A review via A2.
- **O5 (fixture — re-scoped to the deferred profile):** the
  `SELECT_PROFILE_V2` SelectionKey ordering (health before grade) is
  falsifiable by the Arcade tampered-primary + probe-lag trace; the harness
  runs both orderings as client-tier measurement (§10.3). Deferred with the
  profile per SR-18c — it does not gate B0. Closed by: Stage B measurement
  if/when the profile graduates.
- **O6 (Codex):** pin the exact ERC-6860 revision hash for the `web3://`
  interpretation subset (§3) and the multihash provenance notes (§1.2).
  Closed by: the Codex chapter/registry when it lands.
- **O7 (EAS seam, deferred to V2-E8 per PM directive):** these types project
  to EAS attestations losing Occurrence-vs-attestation provenance and
  deterministic IDs; the adapter's loss-map is deferred; the seam is that
  every body here is self-contained (no Core-context dependence), so an
  adapter can carry them without reinterpretation. Closed by: V2-E8.
