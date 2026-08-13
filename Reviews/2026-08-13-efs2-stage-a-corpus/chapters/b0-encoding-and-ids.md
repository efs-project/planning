# B0 encoding and identity
**Stage A chapter — post-red-team revision; not landed, adopts nothing.**

Lane 1 of the Stage A commissioned pass (Fable 5 program, 2026-08-12). This chapter makes the
B0 "spine" arm exact for: the bounded bootstrap meta-codec, the complete deterministic ID
formula family, recursive-Type handling, the Variant A TypeSchema layout, Type-evolution
evidence shapes, the hash-agility seam, the axis-8 (Type-identity qualification) analysis, and
the EAS adapter seam. Other chapters consume `canonicalBody`, principal descriptors, and Realm
descriptors as opaque bytes with the properties declared in "Interfaces exposed."

Label key (PM-mandated): [OWNER RULING] / [DERIVED INVARIANT] / [PROPOSAL] / [HYPOTHESIS] /
[REJECTED]. Factual claims are marked VERIFIED (exact text read) or PLAUSIBLE.

Revision note (2026-08-13): repaired to the revised SR-1..SR-18 pins of [[b0-overview]].
Landed here: SR-1 (set-wide domain table + relaxed grammar, §1.3), SR-2 (EnvelopeId — the
pinned EIP-712 form; this chapter's earlier formula kept as a sub-variant sketch, §4.2),
SR-3 (exact EIP-712-wrapped IntentId, §4), SR-4 (public-u64/stored-u48 ordinal contract,
§4.3), SR-5 (Stage B size hypotheses, §2.6), SR-7 (AuthorityBasisWord is packed evidence,
not an ID), SR-11 cross-ref (Binding-class sentinel rule, §2.2),
SR-14 (PrincipalId naming/structure, §4), SR-16 (RealmRevisionId regenerated; new
`codexConstants` artifact, §1.6/§4), SR-17 (schema on-ramp via ordinary admission, §3.4 +
harness case H-GROUPCAP), SR-18a (one u16 algCode table set-wide, §2.4), SR-18e
(`REF_INSTANCES_MAX`, §2.6/§3.1), plus the §7 hash-agility softening and write-path
playbook item (red-team lane findings).

---

## 1. Hash and word conventions

### 1.1 The hash

- [PROPOSAL] All EFS-native identity derivation uses `keccak256`. Rationale: EVM-native (the
  only hash with a dedicated opcode at 30+6/word gas), cheapest to verify on-chain, already the
  hash of every address, storage key, and EIP-712 digest EFS coexists with. Pinned by the
  orchestrating skeleton for B0; a successor hash enters only through the migration seam (§7).
- [DERIVED INVARIANT] Foreign digests (git SHA-1 OIDs, sha2-256 content digests, CIDs) enter
  EFS only as algorithm-tagged `DIGEST` values inside Record bodies — never as EFS identity and
  never raw inside any ID preimage. Evidence: Designs/efsv2/deterministic-ids.md §13.8
  (multihash convention) and the STANDARDS audit lane (Git SHA-1 finding: a broken hash
  entering the identity layer is the falsifier; VERIFIED in audit-lanes.json).

### 1.2 Preimage encoding

- [DERIVED INVARIANT] Every structural hash preimage is `abi.encode` of fixed-width typed
  words. `abi.encodePacked` over any variable-length field is banned in derivation — the
  `("ab","c") == ("a","bc")` collision class. Dynamic-length content is always pre-hashed
  before entering a preimage (labelhash pattern). Evidence: deterministic-ids.md §1 (VERIFIED,
  lines 32–34), which also records that the July draft's own first version violated the
  companion rule below and four of twelve reviewers copied the mistake.
- [DERIVED INVARIANT] Every derivation input is a spec-owned constant with a printable,
  versioned preimage — never a deployment-dependent value (no schema UIDs, resolver or contract
  addresses, chain ids, or registry state inside portable ID preimages). Evidence:
  deterministic-ids.md §1/§2 (VERIFIED); constitution "Universal identity without false
  equivalence" (chain/deployment/carrier must not change portable identity).
- Exception, stated: `RealmId`/`RealmRevisionId` deliberately DO commit to deployment facts —
  they name deployments. `AuthorityBasisWord` is not an ID at all: it is the principal
  chapter's packed admission evidence
  (`kind u8 ‖ verifierVersion u16 ‖ witnessProfile u8 ‖ basisBlock u64 ‖
  delegateOrZero u160`) plus a conditional contract-account codehash slot. The rule above
  governs *portable* ids
  (TypeSchemaId, RecordId, EnvelopeId, PrincipalId, PositionKey, BindingKey, PlanId).
  [PROPOSAL]

### 1.3 Domain constants (closed table, printable preimages)

Every ID preimage's first word is a domain word `DOM_X = keccak256(asciiBytes)` where
`asciiBytes` is a printable ASCII string from the closed table below. Grammar (relaxed
post-red-team per SR-1): `efs2/<seg>(/<seg>)*/<version>` — one or more lowercase segments
`[a-z0-9-]+` separated by `/`, the final segment the version integer, total length ≤
`MAX_DOMAIN_STRING_BYTES = 64`. Multi-segment names are legal (the earlier single-noun
grammar was too narrow for the index chapter's key/slot families). The version integer lives
inside the string; a version bump is a new constant and old constants are never reinterpreted.
[PROPOSAL — this satisfies the skeleton's `id = keccak256(DOMAIN_TAG ‖ version ‖ preimage)`
family rule with the version folded into the printable tag, matching the July evidence pattern
(deterministic-ids.md §1, VERIFIED) and costing one word instead of two.]

Per SR-1 this table is the single set-wide registry: it now absorbs EVERY domain string
minted anywhere in the doc set (red-team sweep 2026-08-13). `Class` column: `id` = portable
or Realm-naming id preimages; `key` = index/value-key preimages (index chapter §2.1); `slot` =
storage-slot region bases (never legal in any id or key preimage); `tag` = name/purpose tag
hashing; `fixture` = harness-scope only, never on-chain.

| Constant | Printable preimage | Class | Scope |
|---|---|---|---|
| `DOM_TYPEGROUP` | `efs2/typeschema-group/1` | id | Type Schema group commitment |
| `DOM_TYPESCHEMA` | `efs2/typeschema/1` | id | TypeSchemaId |
| `DOM_RECORD` | `efs2/record/1` | id | RecordId |
| `DOM_ENVELOPE` | `efs2/envelope/1` | id | EnvelopeId (SR-2 wrap, §4.2) |
| `DOM_LEAF` | `efs2/envelope-leaf/1` | id | per-leaf commitment (§4.2b sub-variant only) |
| `DOM_OCCURRENCE` | `efs2/occurrence/1` | id | single-word OccurrenceKey (also keys the SR-10 status overlay) |
| `DOM_PRINCIPAL` | `efs2/principal/1` | id | PrincipalId (SR-14; descriptor from Lane 3) |
| `DOM_REALM` | `efs2/realm/1` | id | RealmId (descriptor from Lane 4) |
| `DOM_REALM_REVISION` | `efs2/realm-revision/1` | id | RealmRevisionId (SR-16) |
| `DOM_POSITION` | `efs2/position/1` | id | PositionKey (SR-6) |
| `DOM_BINDING` | `efs2/binding/1` | id | BindingKey (SR-6) |
| `DOM_PLAN` | `efs2/plan/1` | id | PlanId (plan bytes from Lens lane) |
| `DOM_INTENT` | `efs2/admission-intent/1` | id | AdmissionIntent id (SR-3, admission lane) |
| `DOM_PROFILE` | `efs2/profile/1` | id | Realm profileId (realm §2.3; consumes §1.6 hash) |
| `DOM_REALM_GENESIS` | `efs2/realmgenesis/1` | id | Realm genesisCommitment (realm §2.4) |
| `DOM_FIELDROLE` | `efs2/fieldrole/1` | tag | named-role hash for typed positions (binding §1.1) |
| `DOM_PURPOSE` | `efs2/purpose/1` | tag | ad-hoc app purpose tag (binding chapter) |
| `DOM_PLAN_PURPOSE` | `efs2/plan-purpose/1` | tag | Lens purposeAndScope commitment (lens chapter) |
| `DOM_LENS_SEM_B0` | `efs2/lens-semantics/b0/1` | tag | Lens B0 semantics-profile constant |
| `DOM_PK` | `efs2/pk/1` | key | postings key (index §2.1) |
| `DOM_VK_SCALAR` | `efs2/vk/scalar/1` | key | scalar value key |
| `DOM_VK_CMPD` | `efs2/vk/compound/1` | key | compound value key |
| `DOM_VK_DIGEST` | `efs2/vk/digest/1` | key | ByteDigest value key (u16 algCode zero-extended, §2.4/SR-18a) |
| `DOM_VK_OCC` | `efs2/vk/occ/1` | key | occurrence-target value key |
| `DOM_VK_ADDR` | `efs2/vk/addr/1` | key | address-target value key |
| `DOM_SLOT_LOG` | `efs2/slot/log/1` | slot | admission log region |
| `DOM_SLOT_PH` | `efs2/slot/phead/1` | slot | postings head |
| `DOM_SLOT_PD` | `efs2/slot/pdata/1` | slot | postings data region |
| `DOM_SLOT_TM` | `efs2/slot/tmeta/1` | slot | TypeSchemaMeta |
| `DOM_SLOT_RM` | `efs2/slot/rmeta/1` | slot | RecordMeta |
| `DOM_SLOT_EM` | `efs2/slot/emeta/1` | slot | EnvelopeMeta |
| `DOM_SLOT_PM` | `efs2/slot/pmeta/1` | slot | PrincipalMeta |
| `DOM_SLOT_PBO` | `efs2/slot/pbyord/1` | slot | principalOrd → PrincipalId |
| `DOM_SLOT_TBO` | `efs2/slot/tbyord/1` | slot | typeOrd → TypeSchemaId |
| `DOM_SLOT_BH` | `efs2/slot/bhead/1` | slot | BindingHead |
| `DOM_SLOT_REV` | `efs2/slot/revepoch/1` | slot | RealmRevision epoch table |
| `DOM_SLOT_CTR` | `efs2/slot/counters/1` | slot | global counters slot |
| `DOM_FIXTURE_SEED` | `efs2/fixture-corpus-seed/1` | fixture | harness corpus master seed |
| `DOM_FIXTURE_CORPUS` | `efs2/fixture-corpus/1` | fixture | harness corpus version hash |

[PROPOSAL] The table is closed for B0; new domains are additive, never reused. Retired
spellings (never mint; listed so the registry stays auditable): `efs2/bindingkey/1` and
`efs2/binding-key/1` (SR-6 → `efs2/binding/1`), `efs2/realmrev/1` (SR-16 →
`efs2/realm-revision/1`), `efs2/intent/1` (SR-3 → `efs2/admission-intent/1`),
`efs2/occlife/1` (SR-10 — the lifecycle overlay is keyed by the `DOM_OCCURRENCE`-derived
occKey; no separate key domain exists). Reserved example, unminted: `efs2/record/2` (§7
migration illustration only). Bakeoff-arm domains (`*_B`, §3.6) join only if the arm is
built. Conformance harness case **H-DOMTABLE** [PROPOSAL]: the harness sweeps every chapter
and implementation for `efs2/` strings and diffs against this table; any string absent here
fails the build — the registry can never silently drift again.

### 1.4 Sentinel subspace

- [PROPOSAL] `bytes32` values `v` with `uint256(v) < 2^16` form the RESERVED_SENTINEL space.
  They are illegal as real ids everywhere (registries reject them; validators reject them in
  body REF values) and legal only where a schema-layer rule names them (§5). A keccak output
  landing in this space requires ~2^240 grinding work — treated as unreachable.
- Address-shaped words (top 96 bits zero, value > 2^16) are NOT special in B0: raw addresses
  are not ids. An account reaches the id layer only as a `PrincipalId` (full-width hash,
  Lane 3). [PROPOSAL — this deletes the v1 address-container conflation class recorded in
  deterministic-ids.md §1 "Root parent" rules (VERIFIED) rather than porting it.]

### 1.5 Salt entropy

- [DERIVED INVARIANT] Any salt entering a portable id preimage (ObjectGenesis charters, private
  namespace qualifiers, salted/private-profile body commitments) MUST carry ≥128 bits of
  CSPRNG entropy or be derived by keyed (HMAC-style) derivation from a user-held secret.
  Pure public-input-derived salts (content hash, path, counter) are forbidden — they make the
  id a confirmation oracle. Evidence: deterministic-ids.md §1 salt rule (VERIFIED, line 97);
  CARRY-IN privacy lane finding 12 (dictionary/correlation-oracle lesson set; per-leaf
  high-entropy salts required; VERIFIED in audit-lanes.json).

### 1.6 The Codex constants artifact (`codexConstantsHash`) — SR-16 obligation

[PROPOSAL — added post-red-team; the realm chapter's `profileId` (§2.3 there) and
`genesisCommitment` (§2.4 there) consume this hash, and it must be state-readable. This
chapter owns it: one canonical, ordered, versioned serialization of every constant this
chapter pins.]

```
codexConstantsBytes :=
  u16 codexRevision              // = 1 for B0; ANY change to any table below bumps it
  u16 mcVersion                  // = MC_VERSION = 1
  ---- closed domain table (§1.3): active rows only, table order ----
  u16 domainCount ‖ domainCount × ( u16 len ‖ asciiBytes )
  ---- named numeric constants (§2.6 incl. REF_INSTANCES_MAX, plus SENTINEL_BOUND = 2^16), table order ----
  u16 constCount  ‖ constCount  × ( u16 nameLen ‖ asciiName ‖ u64 value )
  ---- digest algorithm table (§2.4), ascending algCode ----
  u16 algCount    ‖ algCount    × ( u16 algCode ‖ u16 digestLen ‖ u16 nameLen ‖ asciiName )
  ---- closed code tables: field kinds (§2.2), error codes (§2.7), constraint kinds (§3.1) ----
  u16 kindCount   ‖ kindCount   × ( u8 code ‖ u16 nameLen ‖ asciiName )
  u16 errCount    ‖ errCount    × ( u16 code ‖ u16 nameLen ‖ asciiName )
  u16 cstrCount   ‖ cstrCount   × ( u8 code ‖ u16 nameLen ‖ asciiName )
  ---- derived intrinsic ids: kernel-known Types (SR-11) + intrinsic schemas (§3.4 meta-Type, §6), name order ----
  u16 idCount     ‖ idCount     × ( u16 nameLen ‖ asciiName ‖ bytes32 id )
codexConstantsHash := keccak256(codexConstantsBytes)
```

Rules: every constant appears exactly once; ordering is the printed table order (auditable
against this chapter's text); the derived-id section's values (TYPE_BINDING_SET_V1,
TYPE_BINDING_TOMBSTONE_V1, TYPE_WITHDRAWAL_V1 per SR-11's closed list, plus the intrinsic
TypeSchemaIds of §3.4/§6) are computed from intrinsic blobs at the Stage B Codex build — the
serialization is pinned here, the byte values mint in Stage B (Stage A ships no byte
vectors). State-readability: Core exposes `codexConstants()` returning the exact bytes and
`codexConstantsHash()` returning the hash (interface in "Interfaces exposed"); a reader can
therefore re-derive the hash the realm chapter's `profileId` commits to from state alone.

---

## 2. The bounded bootstrap meta-codec (MC/1)

MC/1 is the one intrinsic, versioned codec that (a) defines the canonical value encodings,
(b) defines the canonical BODY encoding of every Record, and (c) parses Type Schemas. It is
spec + code, not a Record — this is what breaks the self-typing fixed point (candidate
"bootstrap must avoid a self-typing fixed point", VERIFIED core-architecture-candidate.md
lines 102–105).

### 2.1 The body-codec decision

**Chosen for B0: (a) schema-directed fixed-width packed word encoding ("MC/1 wire form").**
[PROPOSAL] Exact position:

- Every field's byte width is statically determined by the Type Schema (fixed widths for
  scalars; fixed-width `u16` big-endian prefixes for all lengths and counts). No varints, no
  self-describing type heads, no floats, no indefinite lengths. The body is decodable only
  with its schema in hand — bodies carry zero self-description, which is exactly the
  constitution's "Canonical Records store only the bytes that define their typed semantic
  content" (VERIFIED, "Minimal typed data").
- Delta from raw `abi.encode`: bodies are PACKED (a `uint8` costs 1 byte, not 32). Hash
  *preimages* stay `abi.encode` 32-byte words (§1.2) because preimages are hashed, never
  stored, so padding there is free; bodies are stored and transmitted, so packing pays
  directly in calldata and SSTORE.

Rationale for (a) over (b):

1. [DERIVED INVARIANT] "No contract ever parses CBOR — the contract-tier artifact is one
   packed, big-endian, fixed-width, offset-free byte layout." Evidence: lens-spec.md §2.2 via
   CARRY-IN finding 8 (LR-1, VERIFIED in audit-lanes.json). Admission must structurally
   validate bodies on-chain in bounded gas (kickoff "Reject malformed canonical bodies
   structurally", VERIFIED); a fixed-width schema-directed walk is a bounded loop over
   pre-known widths, while an on-chain CBOR subset parser is a larger attack surface for the
   same guarantee.
2. Standards FACT (VERIFIED, STANDARDS audit lane): "deterministic CBOR" names a family, not a
   codec — RFC 8949 §4.2 (Internet Standard), IETF CDE (draft-ietf-cbor-cde-13, not an RFC as
   of 2026-08), dag-cbor (no SDO), and SSZ differ byte-for-byte. EFS POLICY: CDE is not stable
   enough to pin; a floating reference would be a 50-year defect.
3. Gas: keccak over packed bytes is identical either way, but validation gas is dominated by
   per-field dispatch; MC/1's dispatch is a static jump on a 1-byte kind code with no head
   decoding.

**Bakeoff alternative (sketch only — arm E-CBOR):** a pinned deterministic-CBOR profile:
definite lengths only; no floats; no tags; map keys sorted bytewise-lexicographic over their
encoded form (RFC 8949 §4.2 rule); the exact profile text pinned in the Codex, NOT a floating
CDE reference. Measured against MC/1 on: Solidity validator gas + code size, calldata bytes,
3-language implementation defect rate, and ecosystem-tooling value. Falsifier for MC/1: if
generic-tooling value (debuggers, diff tools) plus implementation-defect data beats MC/1's
validator-gas advantage in the harness, adopt E-CBOR. [HYPOTHESIS — falsified by that
measurement.]

**SSZ niche note.** SSZ's merkleization gives partial proofs — the right tool where a reader
must verify a member/range of a large closure without the whole body (the 50 GB staged
verification and `ArtifactClosure/1` chunk trees). EFS POLICY: SSZ is a candidate for the
closure-manifest *profile* only, never the general body codec (EL tooling immature —
PLAUSIBLE, STANDARDS audit lane). The closure profile is the fixtures/content lane's decision;
the seam it needs from this chapter is only `DIGEST` values and bounded `ARRAY` fields.

### 2.2 Field kinds (closed set)

| Code | Kind | Params (in schema) | Canonical wire encoding |
|---|---|---|---|
| `0x01` | `BOOL` | — | 1 byte: `0x00` or `0x01`; all else invalid |
| `0x02` | `UINT` | width `w ∈ {1,2,4,8,16,32}` | `w` bytes big-endian |
| `0x03` | `INT` | width `w` as above | `w` bytes big-endian two's complement |
| `0x04` | `BYTES_FIXED` | `n ∈ [1,32]` | `n` raw bytes |
| `0x05` | `BYTES` | `maxLen ≤ MAX_BYTES_LEN` | `u16` length `L ≤ maxLen` ‖ `L` bytes |
| `0x06` | `STRING` | `maxBytes ≤ MAX_STRING_BYTES` | `u16` length ‖ UTF-8 bytes (§2.3) |
| `0x07` | `REF` | bound by a ReferenceRole (§3) | 32 bytes (an EFS id) |
| `0x08` | `OCCREF` | bound by a ReferenceRole | 34 bytes: EnvelopeId ‖ `u16` leafIndex |
| `0x09` | `PRINCIPAL` | — | 32 bytes, full width, never truncated |
| `0x0A` | `DIGEST` | — | `u16` algCode ‖ `u16` len ‖ digest bytes (§2.4) |
| `0x0B` | `ARRAY` | element descriptor, `maxCount` | `u16` count ‖ count × enc(elem) |
| `0x0C` | `MAP` | key desc, value desc, `maxEntries` | `u16` count ‖ count × (enc(K) ‖ enc(V)), keys strictly ascending bytewise over enc(K) |
| `0x0D` | `STRUCT` | member list | concatenation of members in declared order |
| `0x0E` | `OPTION` | inner descriptor | 1 byte `0x00` (absent, nothing follows) or `0x01` ‖ enc(inner) |

[PROPOSAL] Notes making the set canonical (one meaning, one encoding):

- Widths and bounds come only from the schema; a value never chooses its own width.
- All length/count prefixes are `u16` big-endian — every bound in B0 is < 2^16, so exactly one
  prefix width exists (no CBOR-style shortest-head ambiguity by construction).
- `MAP` keys are restricted to kinds `{UINT, INT, BYTES_FIXED, STRING, BYTES}`; strict
  ascending bytewise order over the canonical key encoding (length prefix included) — this is
  RFC 8949 §4.2's ordering discipline borrowed as a rule (standards FACT: the rule's
  provenance; EFS POLICY: our encoding is not CBOR). Consequence, documented: shorter keys
  sort before longer ones regardless of content. Duplicate keys are unrepresentable (strict
  ascending).
- `OPTION` absence is `0x00`, never field omission; a body always has exactly `fieldCount`
  encoded fields. Empty `BYTES`/`STRING` (`L = 0`) is distinct from absent.
- `REF` values must not be in the sentinel space and must be nonzero; "no reference" is
  `OPTION(REF)` absent, never `bytes32(0)`. [PROPOSAL — deletes the zero-vs-root conflation
  class ADR-0033 documented in v1 evidence.]
- Kernel Binding-class bodies obey the same rule (cross-ref SR-11): when the
  `TYPE_BINDING_SET_V1` / `TYPE_BINDING_TOMBSTONE_V1` / `TYPE_WITHDRAWAL_V1` schemas mint in
  Stage B, a first write's "no predecessor" is the explicit NONE encoding — `OPTION(OCCREF)`
  absent — never raw `bytes32(0)`; the binding chapter's earlier `predecessorEnvelopeId = 0`
  first-write convention regenerates to this. [PROPOSAL — pinned direction by SR-11:
  Binding-class body conventions must be legal under this section's REF/sentinel rules.]
- `BOOL`/`OPTION` flag bytes other than `0x00`/`0x01` are structural errors (not masked).

### 2.3 Strings and Unicode policy

- Wire form: UTF-8 bytes, `u16` length prefix.
- **STRUCT-EVM tier** (what admission enforces on-chain, §2.7): well-formed UTF-8 (RFC 3629
  ranges, no surrogates, no overlongs, ≤ U+10FFFF), length bound. Nothing more — on-chain NFC
  validation is not feasible (evidence: deterministic-ids.md §1 canonical-name rule citing
  ADR-0048, VERIFIED).
- **STRUCT-FULL tier** (what defines canonical form; SDK-enforced, anyone-checkable,
  cross-language golden vectors): NFC normalization under a pinned Unicode version
  (`UNICODE_PIN = 16.0` [PROPOSAL — final pin at freeze ceremony]); unassigned codepoints
  rejected (NFC stability holds only for assigned codepoints — IDNA2008-style; evidence:
  deterministic-ids.md §1, VERIFIED); no BOM.
- **NAME_PROFILE** (a per-field constraint, §3.5, for strings used as Schelling-point names:
  type names, family names, field names): additionally rejects C0/C1 controls, requires
  nonempty, byte-exact case-sensitive.
- Honesty note: RecordId hashes exact bytes, so ID determinism never depends on normalization;
  NFC is the convergence convention that makes independent writers produce the same bytes for
  the same intended name. A Realm admitting a non-NFC string has admitted a well-defined but
  non-canonical-profile Record; Lens/read layers may grade it. [PROPOSAL]

### 2.4 DIGEST values and the ONE set-wide algCode table (SR-18a)

[PROPOSAL — pinned by SR-18a] This table is THE digest-algorithm vocabulary for the entire
doc set. The `u16 algCode` below is used (i) in `DIGEST` wire values here, (ii) in
`ByteDigest/1` bodies — the content chapter's earlier `u8 algTag` table (`0x01`/`0x02`/`0x03`)
is retired — and (iii) in index keys — the index chapter's `u32 algId` is retired; the
`DOM_VK_DIGEST` preimage takes the algCode as its `uint256` zero-extension (one `abi.encode`
word, per SR-1) and `lookupByDigest` takes `uint16 algCode`.

Closed B0 algorithm table (codes are multihash-compatible — standards FACT: the multihash
IETF draft expired 2024-02-21, never an RFC; the registry is GitHub-stewarded; VERIFIED,
STANDARDS audit lane. EFS POLICY per that lane's recommendation: adopt registry wire codes
verbatim where they exist, pin the closed subset with printable names in the Codex, cite the
registry as provenance, never as a living dependency):

| algCode | Name | Digest length | Status in EFS |
|---|---|---|---|
| `0x11` | `sha1` | 20 | foreign-only raw sha1; collision-broken; never EFS identity |
| `0x12` | `sha2-256` | 32 | content digests, closures |
| `0x13` | `sha2-512` | 64 | content digests |
| `0x1b` | `keccak-256` | 32 | EVM-adjacent content digests |
| `0xef01` | `git-sha1-object` | 20 | EFS-assigned (not a registry value): sha1 over Git's framed object preimage (`"<type> <len>\0"` ‖ content). Absorbs the content chapter's `ALG_GIT_SHA1_OBJECT` semantics — the framing is part of the meaning and bare `0x11` cannot express it. Foreign-only; never EFS identity. |

EFS-assigned codes live in `0xef00–0xefff` [PROPOSAL — chosen as unassigned in the registry
snapshot to be pinned at the freeze ceremony; if a collision with a registry assignment is
found at snapshot time, the EFS code moves BEFORE genesis and never after]. Canonical rule:
`len` must equal the table length for `algCode`; unknown codes are structural errors (the
table extends only by Codex revision, §7). Full CID (IPLD codec + multibase) is
[REJECTED] as a Core value form unless IPFS interop becomes a stated requirement — a bare
tagged digest is the smaller freezable unit (kill source: STANDARDS audit lane multihash
finding, VERIFIED).

### 2.5 Body layout and static extraction

A canonical body is the concatenation of its `fieldCount` field encodings in schema-declared
order, with two structural rules:

- **E1 (offset classes).** At schema registration, MC/1 computes for every field an offset
  class: `STATIC(byteOffset)` if all preceding fields are fixed-size, else `WALK(k)` where `k`
  is the number of length/count prefixes that must be read to locate it (computable from the
  schema alone, never from a body). Any field named by an `IndexSpec` or bound to a
  `ReferenceRole` MUST have class `STATIC` or `WALK(k ≤ MAX_EXTRACT_WALK = 16)`. This is the
  exact sense in which reference and index fields are "statically extractable": the extraction
  program derives from the schema alone and is bounded. [PROPOSAL]
- **E2 (no trailing bytes).** After decoding `fieldCount` fields, the cursor must equal the
  body length exactly. Trailing bytes are a structural error (canonical form is unique).

### 2.6 Named size constants

Names and structural relationships are [PROPOSAL]. Numeric size values, including the four
SR-5 envelope constants, are [HYPOTHESIS] to be re-derived by the Stage B harness against
each qualifying Realm's gas cap. EIP-7825 = 16,777,216 gas per-transaction cap, live on L1 since
Fusaka 2025-12-03 (VERIFIED via STANDARDS audit lane) — treated as hard protocol physics for
every one-call write.

| Constant | Value | Note |
|---|---|---|
| `MC_VERSION` | 1 | |
| `MAX_BODY_BYTES` | 8,192 | [HYPOTHESIS] one leaf may fill the envelope body budget |
| `MAX_TYPESCHEMA_BYTES` | 8,192 | one schema blob |
| `MAX_GROUP_SIZE` | 16 | schemas per group (§5) |
| `MAX_FIELDS` | 64 | per schema |
| `MAX_REFERENCE_ROLES` | 16 | per schema |
| `REF_INSTANCES_MAX` | 16 | [HYPOTHESIS] per-leaf total REF instances, ARRAY(REF) counts included (§2.7/§3.1, SR-18e) |
| `MAX_INDEX_SPECS` | 8 | per schema |
| `MAX_CONSTRAINTS` | 32 | per schema |
| `MAX_NEST_DEPTH` | 4 | root fields are depth 1 |
| `MAX_ARRAY_COUNT` | 1,024 | schema bound must be ≤ |
| `MAX_MAP_ENTRIES` | 256 | |
| `MAX_STRING_BYTES` | 4,096 | |
| `MAX_BYTES_LEN` | 8,192 | ≤ MAX_BODY_BYTES |
| `MAX_FIELD_NAME_BYTES` | 64 | NAME_PROFILE |
| `MAX_TYPE_NAME_BYTES` | 128 | NAME_PROFILE |
| `MAX_MEANING_BYTES` | 2,048 | §3.1 |
| `MAX_EXTRACT_WALK` | 16 | rule E1 |
| `MAX_ENVELOPE_LEAVES` | 64 | [HYPOTHESIS] STRUCTURAL cap — matches `leafMask uint64` (SR-5); `leafIndex` stays uint16 ABI width |
| `MAX_ENVELOPE_BODY_BYTES` | 8,192 | [HYPOTHESIS] sum of leaf bodies per envelope (SR-5; one leaf may fill it) |
| `MAX_BIND_LEAVES_PER_ENVELOPE` | 64 | [HYPOTHESIS] Binding-class leaf structural cap (SR-5) |
| `MAX_GROUP_BYTES` | 8,190 | max `groupBytes` carried by the §3.4 on-ramp (= MAX_BODY_BYTES − 2) |
| `MAX_DOMAIN_STRING_BYTES` | 64 | §1.3 |

Superseded values, kept as labeled residue [REJECTED — SR-5]: `MAX_ENVELOPE_LEAVES = 1,024`
(an id-space bound, not admissible; the structural cap is the `leafMask` width) and
`MAX_ENVELOPE_BODY_BYTES = 16,384` (a maximal envelope's one-tx admissibility is a measured
Stage B output, not a claimed property — the smaller constant removes the false one-tx claim).

EIP-7825 arithmetic (cap = 16,777,216):

- One `MAX_BODY_BYTES` body on a plain-SSTORE full-body spine: ceil(8192/32) = 256 slots ×
  20,000 = 5,120,000 gas ≈ 30.5% of the cap. Full-body state-readable spine is an owner
  obligation (owner-rulings.md 2026-07-15 items 17–18, VERIFIED: "full-body spine — PAY IT";
  "no body-elision — ETCH IT") [OWNER RULING].
- Same body in content-derived immutable code (SSTORE2-shape, prior art CARRY-IN finding 9,
  VERIFIED): 32,000 + 8192 × 200 = 1,670,400 ≈ 10.0% of cap. Physical layout is the
  storage/index lane's bakeoff; both lines shown so this chapter's constants survive either.
  Address-collision surface, documented [PROPOSAL — red-team note]: if the arm deploys via
  CREATE2, the salt MUST include the submitter — a content-only salt yields a predictable
  address that a griefer can pre-occupy with arbitrary code, permanently blocking state-tier
  custody of that body; nonce-addressed CREATE plus an explicit content→address index avoids
  the surface entirely.
- `MAX_ENVELOPE_BODY_BYTES` = 8,192 (SR-5): plain-SSTORE 5,120,000 ≈ 30.5% of cap;
  code-store form ≈ 1.67M ≈ 10.0%. Whether a MAXIMAL legal envelope (64 leaves and/or a full
  8,192-byte body plus mandatory index fan-out) admits in ONE transaction is a **measured
  Stage B output, not a claimed property** (SR-5). The shared budget formula is the
  authorship chapter's `c_occ` inequality — Σ_leaves(c_occ) + c_bodies + c_fixed ≤ G_TX_CAP —
  with this chapter supplying the byte-cost terms, the index chapter the mandatory fan-out
  terms, and the harness owning the measured number; a lower measured cap shrinks the
  constant and returns to James. A 64 KiB envelope (40.96M plain-SSTORE) is physically
  impossible in one L1 tx regardless. [HYPOTHESIS — harness-owned.]
- Effective leaves-per-tx: with minimal 96-byte bodies, schedule arithmetic gives ≈ 60k
  storage + ≈ 50k admission/indexing overhead each ⇒ ≈ 140 leaves/tx of raw budget — above
  the 64 structural cap, which is why 64 is a defensible structural pin; but the
  mandatory-index fan-out term can push a worst-declared 64-leaf envelope over the cap, and
  subset admission via `leafMask` (SR-3) is the designed relief, not a bigger constant.
  [HYPOTHESIS — falsified/refined by the harness gas run.]

### 2.7 Structural validation (STRUCT-EVM), deterministic pseudocode

```
validateBody(schema S, bytes body) -> uint16 errCode   // 0 = OK
  cur := 0
  refCount := 0
  for f in S.fields (declared order):
    (cur, refCount, err) := decodeField(S, f.desc, body, cur, depth=1, refCount)
    if err != 0: return err
  if cur != len(body): return ERR_TRAILING
  return 0

decodeField(S, desc, body, cur, depth, refCount):
  // Every direct `return ERR_X` below is shorthand for
  // `return (cur, refCount, ERR_X)`.
  if depth > MAX_NEST_DEPTH: return ERR_DEPTH
  switch desc.kind:
    BOOL:        need(1); b := body[cur]; if b > 1: return ERR_BOOL; cur += 1
    UINT/INT:    need(desc.w); cur += desc.w
    BYTES_FIXED: need(desc.n); cur += desc.n
    BYTES:       need(2); L := u16(body,cur); if L > desc.maxLen: return ERR_BOUND
                 need(L); cur += 2 + L
    STRING:      need(2); L := u16(body,cur); if L > desc.maxBytes: return ERR_BOUND
                 if !utf8WellFormed(body[cur+2 .. cur+2+L]): return ERR_UTF8
                 cur += 2 + L
    REF:         need(32); v := word(body,cur)
                 if uint256(v) < 2^16 or v == 0: return ERR_SENTINEL_IN_BODY
                 refCount += 1; if refCount > REF_INSTANCES_MAX: return ERR_REF_BUDGET
                 cur += 32
    OCCREF:      need(34)
                 refCount += 1; if refCount > REF_INSTANCES_MAX: return ERR_REF_BUDGET
                 cur += 34
    PRINCIPAL:   need(32); cur += 32
    DIGEST:      need(4); algCode := u16; L := u16
                 if !algCodeTable[algCode] or L != algCodeTable[algCode].len: return ERR_DIGEST
                 need(L); cur += 4 + L
    ARRAY:       need(2); c := u16; if c > desc.maxCount: return ERR_COUNT
                 repeat c:
                   (cur, refCount, err) := decodeField(
                     S, desc.elem, body, cur, depth+1, refCount)
                   if err != 0: return (cur, refCount, err)
    MAP:         need(2); c := u16; if c > desc.maxEntries: return ERR_COUNT
                 prevKeyEnc := ⊥
                 repeat c:
                   kStart := cur; (cur, refCount, err) := decodeField(
                     S, desc.key, body, cur, depth+1, refCount)
                   if err != 0: return (cur, refCount, err)
                   kEnc := body[kStart..cur]
                   if prevKeyEnc != ⊥ and !(prevKeyEnc < kEnc bytewise): return ERR_MAP_ORDER
                   prevKeyEnc := kEnc
                   (cur, refCount, err) := decodeField(
                     S, desc.val, body, cur, depth+1, refCount)
                   if err != 0: return (cur, refCount, err)
    STRUCT:      for m in desc.members:
                   (cur, refCount, err) := decodeField(
                     S, m, body, cur, depth+1, refCount)
                   if err != 0: return (cur, refCount, err)
    OPTION:      need(1); p := body[cur]; if p > 1: return ERR_OPTION_FLAG
                 cur += 1
                 if p == 1:
                   (cur, refCount, err) := decodeField(
                     S, desc.inner, body, cur, depth, refCount)
                   if err != 0: return (cur, refCount, err)
  return (cur, refCount, 0)
```

`need(n)` returns `ERR_TRUNCATED` if fewer than `n` bytes remain. Closed error codes:
`0 OK, 1 ERR_TRAILING, 2 ERR_TRUNCATED, 3 ERR_BOUND, 4 ERR_UTF8, 5 ERR_MAP_ORDER,
6 ERR_OPTION_FLAG, 7 ERR_BOOL, 8 ERR_SENTINEL_IN_BODY, 9 ERR_DIGEST, 11 ERR_DEPTH,
12 ERR_COUNT, 13 ERR_SCHEMA_MALFORMED, 14 ERR_CONSTRAINT, 15 ERR_REF_BUDGET`. Constraint
checks (§3.5) run after the structural walk. The runtime `refCount` guard is
defense-in-depth under the schema-time bound in §3.1 and makes
`REF_INSTANCES_MAX = 16` an explicit per-leaf structural validation rule,
including every `ARRAY(REF)` element. ARRAY, MAP-key, MAP-value, STRUCT, and
OPTION recursive calls capture and immediately propagate every nonzero error,
including `ERR_REF_BUDGET`; no recursive failure can be overwritten by a later
successful child. Gas is linear in body length with
schema-bounded loop counts — a Type
creator cannot make validation unbounded [DERIVED INVARIANT — kickoff gate "a Type creator can
make admission or reads unbounded" is candidate falsifier 5, VERIFIED].

### 2.8 No Type-created admission callbacks

[DERIVED INVARIANT] A Type Schema is pure data. It cannot name code, hooks, resolvers, or
callbacks that run at admission. The only executable validation is (i) MC/1 STRUCT-EVM above,
identical in every Realm, and (ii) Realm-versioned validator modules selected by Realm policy
(Lane 4), whose result and code/policy basis are recorded in the admission receipt WITHOUT
changing the portable RecordId. Evidence: kickoff "no arbitrary Type-created admission
callbacks" (VERIFIED, Required technical gates); constitution admission-validation acceptance
trace (VERIFIED); owner boundary "Type creators choose the bounded fields and supported index
modes" (owner-rulings.md 2026-08-12, VERIFIED) [OWNER RULING for the boundary; DERIVED for the
no-callback mechanism].

---

## 3. TypeSchema canonical layout — Variant A (B0 pin)

Axis-4 B0 pin: one `TypeSchemaId` hashes meaning + shape + constraints + reference roles +
canonical index obligations + validation profile. Consequence, stated honestly: evolving a
Type's canonical indexes mints a NEW TypeSchemaId (and thus new RecordIds for new writes);
continuity is carried by the evidence Records of §6, never by mutating the schema
[PROPOSAL — the axis-4 arm; Variant B sketched in §3.6 for bakeoff cell F4].

### 3.1 Canonical schema blob (MC/1-intrinsic layout, exact)

All integers big-endian; all strings NAME_PROFILE unless noted; `u16` prefixes throughout.

```
TypeSchemaBlob :=
  u16    metaCodecVersion            // = MC_VERSION = 1
  ---- SemanticBlock ----
  u16    typeNameLen ‖ typeName      // e.g. "Comment/1"; ≤ MAX_TYPE_NAME_BYTES
  u16    meaningLen  ‖ meaning       // normative human meaning, UTF-8 NFC, ≤ MAX_MEANING_BYTES
  u8     specDigestPresent           // 0x00 | 0x01
  [DIGEST specDigest]                // commitment to the full external normative spec text
  bytes32 namespaceQualifier         // 0 = convergent/commons; nonzero = qualification (§8)
  ---- Shape ----
  u16    fieldCount                  // 1..MAX_FIELDS
  FieldDescriptor × fieldCount
  ---- Reference roles ----
  u16    refRoleCount                // 0..MAX_REFERENCE_ROLES
  ReferenceRole × refRoleCount
  ---- Index obligations ----
  u16    indexSpecCount              // 0..MAX_INDEX_SPECS
  IndexSpec × indexSpecCount
  ---- Validation ----
  u16    validationProfile           // 0 = intrinsic STRUCT-EVM/STRUCT-FULL only (sole B0 value)
  u16    constraintCount             // 0..MAX_CONSTRAINTS
  Constraint × constraintCount
```

```
FieldDescriptor :=
  u16 nameLen ‖ name                 // ≤ MAX_FIELD_NAME_BYTES, unique within the schema
  u8  kindCode                       // §2.2
  KindParams                         // exact per kind:
    UINT/INT:    u8 width
    BYTES_FIXED: u8 n
    BYTES:       u16 maxLen
    STRING:      u16 maxBytes
    ARRAY:       u16 maxCount ‖ FieldDescriptor(elem, nameLen=0)
    MAP:         u16 maxEntries ‖ FieldDescriptor(key, nameLen=0) ‖ FieldDescriptor(val, nameLen=0)
    STRUCT:      u16 memberCount ‖ FieldDescriptor × memberCount
    OPTION:      FieldDescriptor(inner, nameLen=0)
    BOOL/REF/OCCREF/PRINCIPAL/DIGEST: (none)
```

```
ReferenceRole :=
  u8      roleId                     // dense from 0, unique
  u16     nameLen ‖ name             // e.g. "target", "replyTo"
  u8      targetClass                // 1=RECORD 2=TYPESCHEMA 3=PRINCIPAL 4=OCCURRENCE 5=OBJECT
  bytes32 expectedType               // 0 = ANY; SELF / GROUP_REF(k) sentinels (§5); or exact TypeSchemaId
  u8      fieldIdx                   // top-level field carrying the role
```

Binding rules (checked by `validateTypeSchemaGroup`, else `ERR_SCHEMA_MALFORMED`): the bound
field's kind must be `REF`, `OCCREF`, `ARRAY(REF)`, or `OPTION(REF)` (`OCCREF` only with
`targetClass = OCCURRENCE`); every `REF`/`OCCREF`-kind field is bound by exactly one role;
every role binds exactly one field; `expectedType` is meaningful only for
`targetClass ∈ {RECORD, OBJECT}`; bound fields satisfy extraction rule E1. `OBJECT` means "a
RecordId of an `ObjectGenesis/1`-charter Record" — same width, distinct declared intent.

**REF budget (SR-18e), structural validation bound.** [PROPOSAL — pinned by SR-18e]
Σ over role-bound fields of (1 for `REF`/`OCCREF`/`OPTION(REF)`; the declared `maxCount` for
`ARRAY(REF)`) ≤ `REF_INSTANCES_MAX = 16` per schema — checked by `validateTypeSchemaGroup`
with typed error `ERR_REF_BUDGET` (code 15). Because widths and counts are schema-declared,
this bounds the TOTAL reference instances any legal leaf can carry, ARRAY(REF) elements
included, at registration time. Rationale: every reference instance costs mandatory index
postings (backlink fan-out); the bound makes per-leaf index fan-out a schema-time constant,
so admission gas stays bounded by construction and backlink completeness holds — without it,
one legal `ARRAY(REF, maxCount = 1,024)` field implies ≈ 2,000+ posting appends ≈ 27.5M gas,
over the EIP-7825 cap, and the index chapter's F_MAX arithmetic collapses (red-team
derivation, VERIFIED).

```
IndexSpec :=
  u8 indexKind                       // 1 = SCALAR_EQ, 2 = REF_BACKLINK, 3 = DIGEST_EQ
  u8 target                          // SCALAR_EQ/DIGEST_EQ: fieldIdx; REF_BACKLINK: roleId
```

Eligibility: `SCALAR_EQ` fields must be `BOOL/UINT/INT/BYTES_FIXED/PRINCIPAL` with offset
class per E1; `DIGEST_EQ` fields must be `DIGEST` (this is the contentHash → content lookup
obligation [OWNER RULING — owner-rulings.md 2026-07-15 item 13, VERIFIED: "add a
contentHash → DATA/file index"]); `REF_BACKLINK` names a roleId — postings are keyed by
(target, TypeSchemaId, roleId), never by bare target [DERIVED INVARIANT — the v1→v2 headline
defect was a postings word lacking the predicate key; onchain-completeness via CARRY-IN
finding 5, VERIFIED]. Posting layout itself is the storage lane's (axis 7).

```
Constraint :=
  u8 constraintKind
    1 = INT_RANGE:    u8 fieldIdx ‖ int256 min ‖ int256 max   (32-byte words)
    2 = NONEMPTY:     u8 fieldIdx                              (BYTES/STRING/ARRAY/MAP)
    3 = NAME_PROFILE: u8 fieldIdx                              (STRING fields)
```

Closed constraint vocabulary for B0; extension is a new MC version (§7). [PROPOSAL]

### 3.2 What is deliberately inside the Variant A preimage

meaning text + spec digest + qualifier (semantic identity), the full shape, roles, index
obligations, validation profile, constraints. Changing ANY of these is a new Type. This gives
the portable query guarantee the candidate names for Variant A (VERIFIED,
core-architecture-candidate.md lines 89–95): a reader holding a TypeSchemaId knows exactly
which indexes every conforming Realm materializes — no coverage negotiation. Mandatory
automatic indexing per admitted Type/index profile is [OWNER RULING] (owner-rulings.md
2026-07-15 item 12, VERIFIED: force-indexed, opt-in rejected; and 2026-08-12 boundary,
VERIFIED).

### 3.3 TypeSchemaId (exact)

```
groupBytes  := u16 memberCount (1..MAX_GROUP_SIZE) ‖ concat_i( u16 blobLen_i ‖ TypeSchemaBlob_i )
groupHash   := keccak256(abi.encode(DOM_TYPEGROUP, keccak256(groupBytes)))
TypeSchemaId_k := keccak256(abi.encode(DOM_TYPESCHEMA, groupHash, uint256(k)))   // k = memberIndex
```

A standalone schema is the degenerate group of size 1 with `k = 0` — one formula for all
schemas. [PROPOSAL — unifies recursion (§5) with the common case at the cost of one extra
hash at schema registration, amortized forever.]

### 3.4 Schema on-ramp (SR-17: ordinary admission of the bootstrap meta-Type)

[PROPOSAL — pinned by SR-17; supersedes this chapter's earlier standalone registration
function, kept below as a rejected sketch.]

- **The bootstrap meta-Type.** `TypeSchemaGroup/1` is an intrinsic schema (same class as
  §6's four: an MC/1 `TypeSchemaBlob`, group of 1, TypeSchemaId a Codex golden vector; MC/1
  is intrinsic code, so no self-typing fixed point arises). Fields:
  `groupBytes BYTES(maxLen = MAX_GROUP_BYTES = 8,190)`. IndexSpecs: none in B0 (point read
  by RecordId; enumeration rides the index chapter's TypeSchemaMeta/typeOrd spine).
- **On-ramp = ordinary admission with atomic derived state.** A TypeSchemaGroup enters state
  as an ordinary Record of this meta-Type, published in an ordinary envelope through the sole
  Core write entrypoint `publish` (SR-12). It therefore has an author, an Occurrence, an
  AdmissionOrdinal, and full-body state-readable bytes like everything else — exactly what
  the realm chapter's reconstruction walk (W-5) needs: schemas appear IN the walk, no side
  registry exists. Core recognizes this intrinsic bootstrap Type for structural work only:
  in the same admission it runs `validateTypeSchemaGroup` (R1–R3, E1 offset-class
  precomputation, and SR-18e's REF-instance bound), derives every member
  `TypeSchemaId_k`, and atomically materializes the parsed cache keyed by each id. Validation
  or materialization failure reverts the whole publication.
- **The thin wrapper.** `registerTypeSchemaGroup(...)` is SDK/convenience code, not a second
  Core primitive. It accepts the same typed `AccountPrincipal calldata principal` channel,
  constructs or forwards the `TypeSchemaGroup/1` Record/envelope/intent, and calls the one
  repaired `publish(envelopeBytes, principal, intentBytes, intentWitness)` path. It neither
  defines a side truth nor performs a later cache write. The cache is deterministic derived
  state from the admitted full-body Record [OWNER RULING], and its materialization is
  idempotent. The intrinsic branch is not a fourth application effect: SR-11's closed
  application-effect list remains Binding set, Binding tombstone, and Withdrawal.
- **Usability gate.** Admission of an instance Record whose `typeSchemaId` has no materialized
  cache on that Realm fails with a typed error. A successfully admitted TypeSchemaGroup cannot
  exhibit that intermediate state because Record admission and cache materialization are one
  atomic call frame. [PROPOSAL]
- **Idempotence has two distinct keys.** The same `groupBytes` yields the same
  TypeSchemaGroup RecordId and therefore the same derived schema-cache contents,
  so cache materialization is content-idempotent by RecordId/TypeSchemaId. But
  admission idempotence is keyed only by `OccurrenceKey`: re-admitting the same
  `(EnvelopeId, leafIndex)` returns `ALREADY_ADMITTED`; publishing that identical
  RecordId in a new envelope is a new Occurrence, receives its own admission
  receipt/ordinal, and merely reuses the already-correct cache contents.
- **Recursion.** Group registration rides the same path unchanged: one Record carries the
  whole `groupBytes`, so R2's simultaneous group commitment is untouched.

**Named harness case H-GROUPCAP (maximal group vs tx cap — SR-17 cross-check).** The nominal
constant pair `MAX_GROUP_SIZE × MAX_TYPESCHEMA_BYTES = 16 × 8,192 = 131 KiB` vastly exceeds
what the on-ramp can carry: under SR-17 `groupBytes` rides in a Record body, so the OPERATIVE
bound is the carriage inequality `2 + Σ_i(2 + blobLen_i) ≤ MAX_GROUP_BYTES = 8,190` — by
construction, before any gas argument (a 131 KiB group would also be ≈ 82M gas plain-SSTORE
≫ the 16,777,216 cap; arithmetic VERIFIED). Honest consequence: a single blob at the
structural `MAX_TYPESCHEMA_BYTES = 8,192` maximum is NOT carriageable in B0 (max single-blob
in one group = 8,186 bytes); the pair is deliberately in tension, with the carriage
inequality binding. H-GROUPCAP: (a) registers the largest group that satisfies the carriage
inequality and measures admission + materialization gas against EIP-7825; (b) asserts
deterministic rejection (`ERR_BOUND`) of a nominal-max group. If real vocabularies need
larger groups, the constant pair returns to James with staged multi-record group commitment
as the sketched alternative. [HYPOTHESIS — harness-owned.]

**Rejected sketch (superseded by SR-17):** the earlier standalone, non-Record
`registerTypeSchemaGroup(bytes groupBytes)` entrypoint — a content-addressed side registry
with no author, no Occurrence, and its own write path. [REJECTED — it forked the state
spine: a registered-but-never-instantiated schema would be invisible to the reconstruction
walk, schema enumeration would need a side ABI, and SR-12's one-entrypoint pin would need an
exception. One uniform state-readable spine wins.]

### 3.5 Validation tiers recap

STRUCT-EVM (on-chain, §2.7) ⊂ STRUCT-FULL (canonical-form conformance: NFC, assigned
codepoints, NAME_PROFILE — SDK-enforced, vector-pinned). Realm validator modules (Lane 4) are
versioned policy ON TOP; their verdict lands in the receipt, never in the RecordId
[DERIVED INVARIANT — constitution Type-and-admission acceptance trace, VERIFIED].

### 3.6 Variant B (bakeoff cell F4 — sketched interface only)

```
TypeId         = keccak256(abi.encode(DOM_TYPE_B,    keccak256(semanticBlockBytes)))
ShapeId        = keccak256(abi.encode(DOM_SHAPE_B,   keccak256(shapeBytes)))          // fields only
IndexProfileId = keccak256(abi.encode(DOM_IDXPROF_B, typeId, shapeId, keccak256(indexSpecBytes)))
RecordId_B     = keccak256(abi.encode(DOM_RECORD_B,  typeId, shapeId, keccak256(canonicalBody)))
```

Index evolution mints a new IndexProfileId while RecordIds persist; every profile carries an
explicit start basis, and backfill coverage stays `PARTIAL` until proved complete (candidate
text, VERIFIED). Bakeoff measures: RecordId stability under index evolution vs coverage
honesty complexity vs the Variant A portability guarantee. Domains `*_B` join the closed table
only if the arm is built. [PROPOSAL — arm specification, not adopted.]

---

## 4. The ID formula family (complete, exact)

All formulas: `keccak256` over `abi.encode` of the listed words, in the listed order. Preimage
sizes are `32 × wordCount` bytes.

| Id | Formula (words in order) |
|---|---|
| `TypeSchemaId` | `(DOM_TYPESCHEMA, groupHash, uint256 memberIndex)` — §3.3 |
| `RecordId` | `(DOM_RECORD, typeSchemaId, keccak256(canonicalBody))` |
| `EnvelopeId` | `(DOM_ENVELOPE, eip712EnvelopeDigest)` — SR-2; struct owned by the authorship chapter, §4.2 |
| `leafCommit_i` | `(DOM_LEAF, uint256 i, recordId_i)` — §4.2b sub-variant only, not B0 |
| `OccurrenceKey` | `(DOM_OCCURRENCE, envelopeId, uint256 leafIndex)` — single-word form of OccurrenceRef |
| `PrincipalId` | `(DOM_PRINCIPAL, uint256(kind), keccak256(descriptorBytes))` — SR-14; per-kind fixed descriptor layout owned by Lane 3 |
| `RealmId` | `(DOM_REALM, keccak256(realmDescriptorBytes))` — descriptor owned by Lane 4 |
| `RealmRevisionId` | `(DOM_REALM_REVISION, realmId, keccak256(revisionDescriptorBytes))` — SR-16; descriptor field set owned by the realm chapter |
| `PositionKey` | `(DOM_POSITION, bytes32 purpose, bytes32 subject, bytes32 fieldRole)` |
| `BindingKey` | `(DOM_BINDING, principalId, positionKey)` |
| `PlanId` | `(DOM_PLAN, uint256 planProfile, keccak256(planBytes))` — plan bytes owned by Lens lane; fixed-width packed per LR-1 |
| `IntentId` | `(DOM_INTENT, eip712IntentDigest)` — exact SR-3 digest owned by the authorship chapter |

Superseded rows, kept as labeled residue: `PrincipalId` under the name `principalScheme`
regenerates verbatim to SR-14's `kind` (same two-level structure — one naming, one width:
`kind` is the principal chapter's `authorityKind u8`, entering the preimage zero-extended as
`uint256(kind)`; the principal chapter's inline
`abi.encode(kind, originRef, accountOrKey)` dynamic-tail variant is retired by SR-14).
`RealmRevisionId` with an explicit `uint256 generation` word is [REJECTED — superseded by
SR-16]: the revision ordinal lives INSIDE `revisionDescriptorBytes` with the
codehash/policy-commitment fields, so one owner (the realm chapter) holds the whole field
set and this chapter carries only the two-level wrap.

`AuthorityBasisWord` is deliberately absent from this ID-family table. Per SR-7 it is the
principal chapter's exact packed evidence word plus a conditional contract codehash slot,
not a hashed structural identity and not a second derivation surface.

The intent row expands mechanically to the authorship chapter's complete SR-3 commitment:

```text
EXPECTED_REVISION_TYPEHASH = keccak256(
  "ExpectedRevision(uint16 leafIndex,uint32 revision)")
expectedRevisionsHash = keccak256(concat(
  keccak256(abi.encode(EXPECTED_REVISION_TYPEHASH,
                       item.leafIndex,
                       item.revision))
  for item in expectedRevisions, in array order
))
INTENT_TYPEHASH = keccak256(
  "AdmissionIntent(bytes32 realmId,bytes32 envelopeId,uint64 leafMask,uint8 action,ExpectedRevision[] expectedRevisions,uint192 nonceKey,uint64 nonceSeq,uint64 notAfter)ExpectedRevision(uint16 leafIndex,uint32 revision)")
intentStructHash = keccak256(abi.encode(
  INTENT_TYPEHASH, realmId, envelopeId, leafMask, action,
  expectedRevisionsHash, nonceKey, nonceSeq, notAfter
))
DS_INT = keccak256(abi.encode(
  keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
  keccak256("EFS2-AdmissionIntent"), keccak256("1"),
  chainId, verifyingContract
))
eip712IntentDigest = keccak256(0x1901 ‖ DS_INT ‖ intentStructHash)
IntentId = keccak256(abi.encode(DOM_INTENT, eip712IntentDigest))
```

There is no unconstrained `intentBodyBytes` identity convention and no alternate
field-order encoding.

### 4.1 RecordId

`RecordId = keccak256(abi.encode(DOM_RECORD, typeSchemaId, keccak256(canonicalBody)))` —
96-byte preimage. Commits to exactly (type, exact bytes): author-neutral, Envelope-free,
Realm-free, carrier-free. Moving a Record between Envelopes cannot change RecordId (candidate
falsifier 3, VERIFIED — held by construction). `ObjectId` is not a separate formula: a stable
object is the RecordId of its `ObjectGenesis/1` charter Record (publisher PrincipalId + salt
under §1.5 entropy rule + optional meaning), per the candidate's ObjectGenesis pattern
(VERIFIED). [PROPOSAL]

### 4.2 EnvelopeId (B0 = the SR-2 pinned form; inline leaf bodies, axis-5 pin)

**B0 pinned (SR-2 — the authorship chapter's structure wins, expressed under SR-1).** The
signed EIP-712 envelope struct commits: `profile`, `principalId`, the reserved authority seam
(`authorityRef bytes32 = 0` and `authEpoch uint64 = 0` in B0 — the KEL graduation seam), the
replay commitment (`pubNonce`, `notAfter`), and the ordered `recordIds[]` vector — leaf
commitment = RecordId, positional, hashed per EIP-712 array rules (keccak over the
concatenated 32-byte words).

```
EnvelopeId = keccak256(abi.encode(DOM_ENVELOPE, eip712EnvelopeDigest))
```

- The exact EIP-712 type string and struct layout are owned by the authorship chapter (§2.2
  there); B0 signs under the chain-free constant EIP-712 domain [PROPOSAL — argued in the
  authorship chapter §2.3 with its replay-defense relocation table; re-verified against live
  wallets in Stage B (GV-5)].
- Record **bodies ride inline in calldata** (axis-5 B0 arm): carriage form
  `leaf_i := bytes32 typeSchemaId_i ‖ u16 bodyLen_i ‖ body_i`; admission verifies
  `recordIdOf(typeSchemaId_i, body_i) == recordIds[i]` for every selected leaf. Ids depend
  only on the committed `recordIds[]`, so carriage variation cannot move ids.
- Leaves are position-committed (the `recordIds[]` vector is ordered): reordering changes
  the digest (July red-team lesson on positional commitment, codex-envelope.md adopted core,
  VERIFIED — imported as [PROPOSAL] under greenfield rules).
- **Excluded from the preimage:** signatures, actor witnesses, authority/grant carriage, and
  any AdmissionIntent. [DERIVED INVARIANT — identity excludes actor/grant carriage so
  reauthorization or re-signing never changes identity; evidence: kel.md §8.1 via CARRY-IN
  finding 2(b), VERIFIED. Authentication is verified at admission and pinned in the receipt
  via the exact `AuthorityBasisWord` plus conditional contract codehash.] Consequence: a
  re-signed identical struct is the SAME publication
  event (same EnvelopeId; idempotent re-admission, not a duplicate); a new `pubNonce` is a
  new publication event by design.
- `OccurrenceRef = (EnvelopeId, uint16 leafIndex)` — canonical 34-byte packed form
  `EnvelopeId ‖ u16` (the `OCCREF` field kind); `OccurrenceKey` (table above) is its
  single-word index form.

**§4.2b — this chapter's earlier formula, re-labeled a sub-variant sketch (SR-2; not B0).**
[PROPOSAL — sub-variant sketch only.] Correctly characterized: it is ALSO RecordId-committed
and positional — it differs from the pinned form in the header commitment (no
`authorityRef`/`authEpoch` authority seam; replay fields opaque in one `replayCommit` word)
and in the wrap (a plain domain-separated struct hash instead of an EIP-712 typed-data
digest), NOT in body-vs-RecordId leaf commitment:

```
leafCommit_i = keccak256(abi.encode(DOM_LEAF, uint256(i), recordId_i))      // i = 0..n-1
leavesHash   = keccak256(leafCommit_0 ‖ leafCommit_1 ‖ … ‖ leafCommit_{n-1})
EnvelopeId'  = keccak256(abi.encode(DOM_ENVELOPE, uint256(1), principalId, replayCommit,
                                    uint256(n), leavesHash))
```

(The concatenation feeding `leavesHash` is n fixed 32-byte words with `n` committed in the
outer preimage — the §1.2 packed ban targets variable-length fields, which cannot arise
here.) Why the SR-2 form wins: the wallet-visible EIP-712 struct IS the identity preimage
(no parallel hash to keep in sync), and the reserved authority seam is committed from
genesis. `DOM_LEAF` remains in the closed table scoped to this sketch.

- **Bakeoff alternative (axis-5 arm, sketch):** the leaf vector as the root of a positional
  binary Merkle tree (domain-separated leaf/node constants, odd-node promotion, single-leaf
  proofs only — July evidence shape, codex-envelope.md, VERIFIED) enabling subset carriage and
  partial proofs for the RecordId-leaf variant; measured on one-tx availability + extraction
  proof cost. [PROPOSAL — arm only.]

### 4.3 Width and value rules

- `PrincipalId`, and every id above, is full-width `bytes32` in every ABI, storage key, index
  key, Binding, and Lens — never truncated to 160 bits [DERIVED INVARIANT — constitution
  "Every Principal-bearing ID … preserves the full bytes32", VERIFIED]. Golden vector: two
  principal descriptors ground distinct PrincipalIds agreeing in their low 160 bits
  (constructed fixture), exercised end-to-end.
- `AdmissionOrdinal` is Realm-local and `uint64` at every ABI, receipt, and vector.
  Its physical packed representation is `uint48` inside postings, admission-log words,
  and the authorship chapter's occurrence overlay; five u48 ordinals fit one storage slot.
  `0` is the none-sentinel and admitted ordinals start at `1`. Before assigning a successor,
  Core applies the explicit `U48_GUARD` and reverts at `2^48 - 1`; a named successor-Realm
  seam carries migration rather than overflowing or widening in place. At 10,000
  admissions/s, 2^48 lasts approximately 892 years. [PROPOSAL — SR-4]
- `leafIndex` is `uint16` (skeleton pin); `MAX_ENVELOPE_LEAVES = 64 ≪ 2^16` (SR-5) keeps
  ample headroom — raising the structural cap is a per-Realm/Stage-B question that the u16
  arithmetic already accommodates.

---

## 5. Recursive Types without hash fixed points (exact rules)

The problem: a Type whose reference role targets its own type (Comment.replyTo → Comment), or
two Types targeting each other, cannot commit to final ids inside the bytes those ids hash.

Rules (all [PROPOSAL], mechanism re-earned from the candidate's SELF requirement, VERIFIED):

- **R1 (sentinels).** In `ReferenceRole.expectedType` ONLY, these sentinel words are legal:
  `ANY = bytes32(0)`; `SELF = bytes32(uint256(1))`; `GROUP_REF(k) = bytes32(uint256(0x0100 + k))`
  for `0 ≤ k < MAX_GROUP_SIZE`. Sentinels never appear in Record bodies (§2.2 REF rule) and
  never in any hash input other than as these literal schema bytes.
- **R2 (group commitment).** Mutually recursive schemas are published as one group (§3.3): the
  group hash commits to all member blobs simultaneously; each member's final id derives from
  `(groupHash, memberIndex)`. No member's final id appears inside any member's bytes —
  no fixed point, by construction.
- **R3 (canonical uniqueness).** A member referencing itself MUST use `SELF`;
  `GROUP_REF(own index)` is malformed; `GROUP_REF(k ≥ memberCount)` is malformed; a group of
  size 1 may not use `GROUP_REF`. One meaning has exactly one encoding.
- **R4 (resolution).** At validation/read time, `SELF` resolves to the enclosing schema's own
  `TypeSchemaId` and `GROUP_REF(k)` to `keccak256(abi.encode(DOM_TYPESCHEMA, groupHash,
  uint256(k)))` — both computable from the registered group context, never stored in bodies.
- **R5 (families are evidence, not admission).** A stable Type-family reference is a
  `FamilyId := RecordId of a TypeFamilyGenesis/1 Record` (§6). `expectedType` cannot name a
  family in B0: family membership is authored evidence, so an admission check against it would
  read mutable evidence state at admission time — order-dependence the confluence lesson bans
  (kel.md §8.3 via CARRY-IN finding 2(g), VERIFIED). Family constraints are Lens/read-layer
  policy. Cross-group recursion (schema in group A targeting group B and vice versa) is
  therefore expressible only via `ANY` + read-layer policy, or by republishing as one group.

---

## 6. Type-Schema evolution evidence (exact Record shapes)

Evolution never mutates a schema; it is ordinary authored Records under intrinsic Types,
weighed per author + Lens, never admission-blocking [PROPOSAL; constitution: "Successor/
compatibility/equivalence claims … never mutate the older schema", VERIFIED]. The four
intrinsic schemas below are themselves MC/1 `TypeSchemaBlob`s (each a group of 1); their
TypeSchemaIds are Codex golden vectors. Bootstrap is non-circular: MC/1 is intrinsic code/spec
(§2), so these schemas need no schema to parse.

**`TypeSuccessor/1`** — fields:
`predecessor REF` (role 0 "predecessor", class TYPESCHEMA, backlink-indexed),
`successor REF` (role 1 "successor", class TYPESCHEMA, backlink-indexed),
`compatClass UINT(1)` — closed enum `{1 = COMPATIBLE_SUPERSET, 2 = BREAKING,
3 = REENCODE_BUGFIX, 4 = DEPRECATE}` with INT_RANGE constraint [1,4],
`note OPTION(STRING(512))`.
IndexSpecs: `REF_BACKLINK(role 0)`, `REF_BACKLINK(role 1)` — "what succeeds T" and "what T
succeeds" are both bounded point reads.

**`TypeEquivalence/1`** — fields:
`a REF` (role 0, class TYPESCHEMA), `b REF` (role 1, class TYPESCHEMA),
`equivClass UINT(1)` — `{1 = SAME_MEANING_DIFFERENT_SHAPE, 2 = REPUBLICATION,
3 = PROJECTION}`, `note OPTION(STRING(512))`.
Canonical-order constraint: `a < b` bytewise, so one unordered pair has one RecordId
[PROPOSAL — enforced as STRUCT-FULL conformance + Realm validator option, since cross-field
comparison is outside the closed B0 constraint set; promotion to a constraint kind is an open
item].
IndexSpecs: `REF_BACKLINK(role 0)`, `REF_BACKLINK(role 1)`.

**`TypeFamilyGenesis/1`** — fields:
`familyName STRING(128)` (NAME_PROFILE), `steward OPTION(PRINCIPAL)`,
`salt BYTES_FIXED(32)` (§1.5 entropy rule when unlinkability is wanted; zero permitted for
public convergent families — publicly-derivable then, by declared intent),
`charter OPTION(STRING(2048))`.
IndexSpecs: none in B0 (point lookup by RecordId; name search is off-chain [DERIVED
INVARIANT — constitution: full text / ranking stay off-chain, VERIFIED]).

**`TypeFamilyMembership/1`** — fields:
`family REF` (role 0, class RECORD, expectedType = TypeSchemaId of `TypeFamilyGenesis/1` —
an exact id, computable at Codex build, no sentinel needed),
`member REF` (role 1, class TYPESCHEMA).
IndexSpecs: `REF_BACKLINK(role 0)` (enumerate a family's claimed members),
`REF_BACKLINK(role 1)` (which families claim T).

Reading rule: none of these Records change what any Realm admits or indexes. They are inputs
to Lens policy and client UI ("v2 available", "these two communities claim equivalence").
[PROPOSAL]

---

## 7. Hash agility and the migration seam

Motivator [DERIVED INVARIANT]: Git's SHA-1 → SHA-256 transition — 8+ years, still unfinished
(SHA-256 repos non-experimental since 2.42, Git 3.0 targeted late 2026 defaults SHA-256, GitHub
still unsupported — VERIFIED via STANDARDS audit lane, secondary sources) — because the
transition was retrofitted. Evidence: deterministic-ids.md §13.6 (VERIFIED), which requires the
playbook written before the first ID is minted; that requirement survives the greenfield reset.

Seam rules [PROPOSAL]:

1. **Hash identity lives in the domain string.** Every `efs2/*/1` domain means keccak256 by
   Codex pin. A successor hash (or codec break) mints ids under new printable domains
   (`efs2/record/2`, or a new family `efs3/...` for a wholesale successor). Non-ambiguity
   rests on domain separation PLUS contextual version discrimination (rule 3) PLUS explicit
   `SameAs` evidence (rule 2) — NOT on any cross-hash-function non-collision claim:
   "different preimage ⇒ different output" is a within-one-function property, and across
   keccak and a future successor function no structural non-collision guarantee exists. None
   is needed: a reader always knows from context (the schema field's declared id version, the
   domain registry) which suite an id was minted under. [PROPOSAL — softened post-red-team;
   the earlier "any sane function differs" claim was cryptographically unsound.]
2. **Coexistence, not rewrite.** Old ids remain valid opaque NAMES forever — names and
   readability, not continued writability (that is rule 4's fifth item). Registries and
   indexes are per-id-version namespaces; v2-aware readers accept both; nothing re-hashes old
   content. Bridging is explicit evidence: a `SameAs/1`-class Record (shape owned by the
   fixtures lane, same pattern as §6) links old-domain and new-domain ids; it is authored
   evidence, Lens-weighed, never automatic.
3. **Ids are opaque 32 bytes.** No version byte inside the id (structured id bytes invite
   grinding and truncation bugs; uniformity preserved). Version discrimination is contextual:
   a schema field declares which id version it carries; cross-version references use an
   explicit tagged value form (a `STRUCT{u16 idVersion, REF}` field) when a Type needs to span
   the seam. [PROPOSAL]
4. **Playbook contents** (Codex obligation, written before genesis): successor-domain naming
   rule (this section), coexistence read semantics (rule 2), who may publish the successor
   Codex revision (trust-root stewardship — succession is a documented additive path, not a
   schema mutation; evidence: deterministic-ids.md §13.6 wording, VERIFIED), the golden
   coexistence vector (§10), and — added post-red-team — the **legacy-suite write-path
   disposition**: the criteria and mechanism by which a Realm revision freezes NEW
   registrations and admissions under a broken-suite domain. Rationale: registration (§3.4)
   and body-dedup are idempotent and keyed by content hash; once the old suite admits second
   preimages, an attacker can race differing bytes under an established id on fresh Realms —
   old ids must stay readable while MINTING under the broken domain ends. This item also
   joins the vectors chapter's AA-6 reserved-seam inventory. [PROPOSAL]
5. **MC version bumps** (`metaCodecVersion = 2`: new kinds, new constraints) ride the same
   seam: a v2 blob under `efs2/typeschema/1` domains is legal only if the Codex revision
   defining MC/2 is published; v1 validators reject unknown `metaCodecVersion` deterministically
   (additive version-skew is recoverable; arrival-order divergence is not — the July
   invariant-4 split, codex-envelope.md amendment 9, VERIFIED, imported as [PROPOSAL]).

---

## 8. Axis 8 (ANALYSIS-ONLY): publisher-qualified namespace vs semantic spec commitment

The question: when two independent publishers hash the same Type spec text, do they get the
same `TypeSchemaId`?

**Option P — publisher-qualified.** The preimage includes the publisher's PrincipalId.
Same text, different publishers ⇒ different ids, always.
For: no cross-community meaning collision; clear stewardship; matches registry intuition.
Against: shared standards fragment — the entire point of a Schelling-point Type ("Comment/1"
that every client renders) dies unless everyone imports one publisher's id, recreating the
central registry EFS removes; publisher key compromise taints a namespace; dead publishers
strand vocabularies (the LOCKSS/replication argument — deterministic-ids.md Problem #1,
VERIFIED, applies to Types with full force since Types are the most-shared objects).

**Option S — semantic spec commitment.** The preimage includes the meaning text + optional
external spec digest and NO publisher. Same text ⇒ same id, from anyone, on any Realm, forever.
For: convergent shared standards; anyone can republish (archive-grade); no stewardship
dependency for identity (stewardship moves to §6 evidence where it belongs).
Against: meaning collisions are prevented only by the committed text itself — two communities
writing byte-identical boilerplate meaning with different intent collide. Mitigations: the
SemanticBlock commits the full normative meaning (`MAX_MEANING_BYTES = 2048`) plus optional
`specDigest` of the complete external spec; identical committed normative text is, by declared
intent, the same Type. Prior-art note: EAS schema UIDs already hash the schema string without
the registrant (convergent), with the deployment-local resolver address as the impurity —
PLAUSIBLE from EAS source reading in the July round; the resolver-in-UID half is exactly what
deterministic-ids.md §2 attacked (VERIFIED).

**Recommendation [PROPOSAL]: Option S with an explicit opt-in qualifier — and S subsumes P.**
The SemanticBlock's `namespaceQualifier` (bytes32, §3.1) is `0` for convergent/commons Types;
a publisher wanting a private namespace sets it to their PrincipalId (or a §1.5-entropy salt
for an unlinkable namespace). Declared intent decides, per Type, visibly in the preimage. This
answers the candidate's bakeoff row "collision of meaning vs convergence of shared standards"
(VERIFIED) with both, chosen by the author. B0 carries S-with-qualifier; the pure-P arm
remains a bakeoff cell for the identity bakeoff, exercised with the same fixtures.

**Golden-vector pair pinning the choice:**

- `T-CONV`: two distinct publisher Principals publish byte-identical `TypeSchemaBlob`s with
  `namespaceQualifier = 0` ⇒ SAME `TypeSchemaId` (and schema registration is idempotent §3.4).
- `T-QUAL`: the same blob bytes except `namespaceQualifier = P1` vs `P2` (their PrincipalIds)
  ⇒ DIFFERENT `TypeSchemaId`s; both valid; neither is "the" Type.

Disposition: ANALYSIS-ONLY — this section is the analysis and a labeled recommendation; the
eighth axis stays a bakeoff cell and adopts nothing (PM directive: silence never adopts;
VERIFIED, pm-stage-a-directive.md).

---

## 9. The EAS adapter seam (interface stub — loss-map deferred to V2-E8)

PM directive (VERIFIED): defer the full EAS loss-map to V2-E8; specify the seam now. What an
EAS projection needs FROM the encoding layer, and nothing more:

1. **Schema-string mapping.** A deterministic, total function from a TypeSchema to an EAS
   schema string, with a losslessness flag. Kind mapping table: `BOOL→bool`,
   `UINT(w)→uint{8w}`, `INT(w)→int{8w}`, `BYTES_FIXED(32)→bytes32`,
   `BYTES_FIXED(n<32)→bytes{n}`? — EAS supports `bytesN` (PLAUSIBLE; verify in V2-E8),
   `BYTES→bytes`, `STRING→string`, `REF/PRINCIPAL→bytes32`, `OCCREF→bytes` (34 bytes, lossy
   labeling), `DIGEST/MAP/STRUCT/OPTION→bytes` (opaque, `lossless=false`), `ARRAY(T)→T[]`
   where T maps to a scalar EAS type, else `bytes`.
2. **UID non-identity.** An EAS attestation UID or schema UID never enters any EFS preimage
   and no EFS id is ever derived from one [DERIVED INVARIANT — mined-timestamp UIDs are
   unknowable pre-mining and deployment-bound; deterministic-ids.md Problem section, VERIFIED].
   The projection's linkage is an ordinary evidence Record,
   `EasProjection/1 { subject REF(RECORD), easUid BYTES_FIXED(32), chainRef BYTES(64),
   registry BYTES_FIXED(32) }` — exact shape finalized in V2-E8.
3. **Interface stub (Solidity-style; adapter lane implements):**

```solidity
interface IEasProjectionSeam {
    /// EAS schema string for a registered Type; lossless=false when any field degrades to bytes.
    function easSchemaString(bytes32 typeSchemaId)
        external view returns (string memory schemaString, bool lossless);

    /// Canonical body -> EAS ABI-encoded attestation data (per easSchemaString order).
    function projectBody(bytes32 typeSchemaId, bytes calldata canonicalBody)
        external pure returns (bytes memory easData, bool lossless);

    /// EAS attestation data -> canonical body; roundTrips=false marks any lossy lift.
    function liftBody(bytes32 typeSchemaId, bytes calldata easData)
        external pure returns (bytes memory canonicalBody, bool roundTrips);
}
```

4. **Out of scope here (V2-E8):** revocation/expiry projection, refUID conventions, resolver
   semantics, the full loss map, and any claim that a projection carries EFS admission
   semantics (it does not — it is carriage).

---

## 10. Golden-vector categories (this chapter's slice)

Cross-language (Solidity/TypeScript/Rust) per the kickoff gate (VERIFIED). Categories, each
with valid + invalid members; every write-form vector pairs with a read-back decode vector
(the dominant historical EFS bug shape is writes that confirm then never read back —
memory-level evidence, PLAUSIBLE):

1. Scalar encodings: every kind, boundary widths, `BOOL`/`OPTION` flag-byte rejection,
   truncation, trailing bytes.
2. Unicode: NFC pairs (composed/decomposed é — same string post-normalization, byte-different
   pre-normalization ⇒ SDK must converge, on-chain accepts both as distinct bytes), invalid
   UTF-8 rejection, unassigned-codepoint rejection (STRUCT-FULL), NAME_PROFILE rejections.
3. MAP ordering: correct ascending, equal-key rejection, length-first consequence documented
   (`"z" < "aa"` by encoding order).
4. TypeSchema: standalone group-of-1; SELF recursion (Comment/1-shape); mutual pair via
   GROUP_REF; R3 malformation cases; same-Occurrence re-registration returns
   `ALREADY_ADMITTED`, while the same group RecordId in a new envelope admits a new
   Occurrence and content-idempotently reuses the derived cache through the SR-17 on-ramp
   (`TypeSchemaGroup/1` Record round-trip); REF-budget rejection (`ERR_REF_BUDGET`, SR-18e);
   the H-GROUPCAP pair (largest-fitting group; nominal-max group deterministic rejection).
5. Axis-8 pair: `T-CONV`, `T-QUAL` (§8).
6. RecordId: same body two Types ⇒ different ids; same Type byte-different bodies ⇒ different
   ids; body at `MAX_BODY_BYTES`.
7. Envelope (SR-2 form): leaf-order sensitivity (swap two entries of `recordIds[]` ⇒ the
   EIP-712 digest and EnvelopeId move); same Record in two envelopes ⇒ same RecordId,
   different OccurrenceKeys; re-signed identical struct ⇒ same EnvelopeId (§4.2 exclusion
   rule); duplicate leaves (same RecordId at two indexes) ⇒ distinct positions, distinct
   OccurrenceKeys; body/`recordIds[i]` mismatch ⇒ admission rejection.
8. PrincipalId width: two descriptors with ids agreeing in the low 160 bits, distinct
   end-to-end through storage/index keys.
9. DIGEST: each table row; git SHA-1 OID carried as `0xef01 git-sha1-object` (framed
   preimage) with raw `0x11 sha1` distinct over the same 20 bytes; wrong-length and
   unknown-`algCode` rejection; one digest value round-tripped through a `ByteDigest/1` body and
   a `DOM_VK_DIGEST` key with the same u16 algCode (SR-18a set-wide vocabulary).
10. Sentinels: `SELF`/`GROUP_REF` values appearing in a body REF ⇒ `ERR_SENTINEL_IN_BODY`;
    sentinel-space registration rejection.
11. Migration seam: one preimage hashed under `efs2/record/1` vs a hypothetical
    `efs2/record/2` ⇒ different ids; unknown `metaCodecVersion` deterministic rejection.
12. Evolution shapes: one instance of each §6 Record, round-tripped.
13. Codex constants: `codexConstantsBytes` serialization + `codexConstantsHash`
    recomputation across the three languages (§1.6); H-DOMTABLE domain-registry sweep
    (§1.3).

---

## Interfaces exposed

The compact contract other chapters rely on. All functions are internal-library shape (axis-6
pin: one atomic Core, narrow logical modules as internal libraries); Core exposes thin
`external view` wrappers for clients (wrapper naming owned by the Core-surface lane).

**Declared properties of `canonicalBody` (opaque to other lanes):** deterministic (one value,
one encoding — §2.2 rules + E2), bounded (`MAX_BODY_BYTES`, schema bounds), structurally
validatable on-chain in gas linear in length (§2.7), reference/index fields extractable by a
schema-derived bounded program (E1), zero self-description (schema-directed).

```solidity
library EfsCodec {
    function validateBody(bytes calldata schemaBlob, bytes calldata body)
        internal pure returns (uint16 errCode);                    // 0 = OK; closed code table §2.7
    function extractWord(bytes calldata schemaBlob, bytes calldata body, uint8 fieldIdx)
        internal pure returns (bytes32 value, bool ok);            // SCALAR_EQ/DIGEST_EQ extraction
    function extractRefs(bytes calldata schemaBlob, bytes calldata body, uint8 roleId)
        internal pure returns (bytes32[] memory targets);          // REF / ARRAY(REF) / OPTION(REF)
    function validateTypeSchemaGroup(bytes calldata groupBytes)
        internal pure returns (uint16 errCode);                    // incl. E1/R1–R3 + SR-18e REF budget
}

library EfsIds {
    function groupHash(bytes calldata groupBytes) internal pure returns (bytes32);
    function typeSchemaId(bytes32 groupHash_, uint16 memberIndex) internal pure returns (bytes32);
    function recordId(bytes32 typeSchemaId_, bytes calldata canonicalBody) internal pure returns (bytes32);
    function envelopeId(bytes32 eip712EnvelopeDigest) internal pure returns (bytes32);
        // SR-2: keccak256(abi.encode(DOM_ENVELOPE, digest)); the typed-data digest itself is
        // computed per the authorship chapter's struct. (leafCommit exists only in the §4.2b
        // sub-variant sketch and is not part of the B0 library surface.)
    function occurrenceKey(bytes32 envelopeId_, uint16 leafIndex) internal pure returns (bytes32);
    function principalId(uint8 kind, bytes calldata descriptor) internal pure returns (bytes32);
        // SR-14: kind = the principal chapter's authorityKind, zero-extended to uint256 in the preimage
    function realmId(bytes calldata realmDescriptor) internal pure returns (bytes32);
    function realmRevisionId(bytes32 realmId_, bytes calldata revisionDescriptor)
        internal pure returns (bytes32);                           // SR-16: descriptor owned by realm chapter
    function positionKey(bytes32 purpose, bytes32 subject, bytes32 fieldRole) internal pure returns (bytes32);
    function bindingKey(bytes32 principalId_, bytes32 positionKey_) internal pure returns (bytes32);
    function planId(uint16 planProfile, bytes calldata planBytes) internal pure returns (bytes32);
    function intentId(bytes32 eip712IntentDigest) internal pure returns (bytes32);
        // SR-3: keccak256(abi.encode(DOM_INTENT, eip712IntentDigest)); exact intent
        // struct, expectedRevisions array hash, type hash, and Realm-bound domain are §4.
}

// SR-17 on-ramp: SDK/convenience wrapper over the sole Core write primitive.
interface ISchemaOnRamp {
    /// Admits the TypeSchemaGroup/1 Record through the one SR-12/SR-13 entrypoint shape,
    /// whose intrinsic branch atomically validates and materializes the cache.
    /// Returns the group Record's id; defines no second write path.
    function registerTypeSchemaGroup(
        bytes calldata envelopeBytes, AccountPrincipal calldata principal,
        bytes calldata intentBytes, bytes calldata intentWitness
    ) external returns (bytes32 groupRecordId);
}

// SR-16 obligation: state-readable Codex constants (§1.6).
interface ICodexConstants {
    function codexConstants() external view returns (bytes memory codexConstantsBytes);
    function codexConstantsHash() external view returns (bytes32);
}
```

Contract points other lanes consume: domain table §1.3 (closed, SET-WIDE per SR-1, with
scope classes and retired spellings); sentinel space §1.4; salt rule §1.5;
`codexConstantsBytes`/`codexConstantsHash` §1.6 (consumed by the realm chapter's `profileId`
and `genesisCommitment`, SR-16); the ONE u16 `algCode` table §2.4 (SR-18a — content chapter's
u8 tags and index chapter's u32 algId retired); size constants §2.6 (SR-5 values;
`REF_INSTANCES_MAX` per SR-18e); `OccurrenceRef` = `(bytes32, uint16)`, packed 34 bytes;
`AdmissionOrdinal` = `uint64` at every ABI/receipt/vector, u48 physical with
`U48_GUARD`, zero-none, start-at-one, and a successor-Realm seam (SR-4); ids never truncated; foreign
digests only as `DIGEST` values; no Type-created callbacks §2.8; the SR-17 schema on-ramp
§3.4 (`ISchemaOnRamp`; `publish` intrinsically validates/materializes the meta-Type but
does not dispatch an application effect); TypeSchema evolution via §6
evidence Records; migration seam §7 (incl. the legacy-suite write-path playbook item); EAS
seam §9 (`IEasProjectionSeam`); axis-8 vectors `T-CONV`/`T-QUAL` pin whichever arm wins.

## Open items

1. Measured caps (SR-5): whether a maximal envelope (64 leaves / 8,192 body bytes + mandatory
   index fan-out) admits in one transaction, and H-GROUPCAP's admission+materialization gas —
   the Stage-B harness gas run against EIP-7825 owns the numbers via the authorship chapter's
   `c_occ` budget inequality; a lower measured cap shrinks the constants and returns to
   James. The `MAX_TYPESCHEMA_BYTES` (8,192) vs `MAX_GROUP_BYTES` (8,190) carriage tension
   (§3.4) is resolved by the same measurement round.
2. `UNICODE_PIN` final version and the exact NAME_PROFILE codepoint table — freeze-ceremony
   pin (SDK/standards follow-up closes; Unicode 16.0 proposed).
3. EIP-712 residue after SR-2: the exact envelope type string and struct layout (authorship
   chapter owns); the chain-free constant domain is the pinned B0 arm [PROPOSAL], re-verified
   against live wallets in Stage B (GV-5). The earlier free-standing `replayCommit` word
   survives only in the §4.2b sub-variant sketch.
4. Per-kind `descriptorBytes` layouts and the `kind` registry (incl. ERC-7913
   verifier-vs-key split and P-256/WebAuthn form) — Lane 3 closes; the SR-14 outer formula is
   fixed here.
5. `revisionDescriptorBytes` field set and the chain-reference encoding (ERC-7930 binary vs
   CAIP-2 projection; 7930 is Review-status — standards FACT) — Lane 4 closes under the
   SR-16 wrap fixed here.
6. Cross-field constraint for `TypeEquivalence/1`'s `a < b` canonical order — promote to a
   B0 constraint kind (MC change) or keep as STRUCT-FULL conformance; red team + James's
   convergence preference decide.
7. Whether `BYTES_FIXED(n<32) → bytes{n}` is expressible in EAS schema strings (PLAUSIBLE
   only) — V2-E8 adapter work verifies against EAS source.
8. Axis-8 arm adoption (S-with-qualifier vs pure P) and axis-4 (Variant A vs B) — bakeoff
   evidence then James; this chapter supplies both arms' exact/sketched interfaces and the
   pinning vectors.
9. Whether the closure-manifest profile adopts SSZ merkleization for partial proofs —
   content/fixtures lane closes; only DIGEST + bounded ARRAY seams are consumed from here.
10. IndexSpec grammar reconciliation (red-team lane, unpinned by SR-1..SR-18): this
    chapter's 2-byte IndexSpec (§3.1, with DIGEST_EQ) vs the index chapter's 8-byte form
    (SCALAR_EQ/REF_EQ/BACKLINK/COMPOUND, no DIGEST_EQ), and per-Type DIGEST_EQ vs the global
    `DOM_VK_DIGEST` lookup family (whether ReferenceRole `targetClass` gains
    BYTEDIGEST/ADDRESS classes). Because IndexSpec bytes sit inside the TypeSchemaBlob and
    hence inside TypeSchemaId, Type golden vectors BLOCK on this seam — flagged to the
    synthesizer for the next pin round; the SR-18a algCode width is already resolved and is
    not blocked.
11. EFS-assigned algCode range (`0xef00–0xefff`, §2.4) — verify unassigned against the
    multihash registry snapshot pinned at the freeze ceremony; move the code before genesis
    if collided.
