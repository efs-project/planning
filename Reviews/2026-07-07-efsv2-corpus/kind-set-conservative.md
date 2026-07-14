# EFS v2 kind set — conservative data-model architecture (permanence bias)

**Role:** Conservative data-model architect. Prior: every merge that re-homes write-time enforcement onto convention, string parsing, or foreign-state dispatch is a 50-year risk. A kind earns its keep by carrying guards other authors' state depends on; a kind is cut only when nothing enforced dies with it.
**Method:** Write-time enforcement census from the actual v1 contracts (`EFSIndexer.sol`, `EdgeResolver.sol`, `MirrorResolver.sol`, `ListResolver.sol`, `ListEntryResolver.sol`, `AliasResolver.sol` — read in full), mapped onto the v2 native-kernel envelope (`Record{op, kindTag, body}`, author = recovered signer, deterministic IDs per `deterministic-ids.md`, TAGDEF per the tag-core ruling).
**Deliverables:** §3 kind set; §4 per-kind guard tables (spec-grade, intended as kernel validation code); §5 cross-kind kernel rules; §6 collapse adjudications with named failure modes; §7 naming-vs-categorizing ruling; §8 non-revocability classes; §9 duplicate-policy matrix; §10 cardinality-in-kind defense; §11 smallest 100-year set; §12 self-red-team.

---

## 0. The finding that frames everything: the additive-schema escape hatch dies with EAS

Under EAS, a wrong kind decision was survivable: schema registration is permissionless, so a missing kind was **additive** (new schema + resolver) and a redundant kind was inert. Under the native kernel, **kernel-enforced kinds are the Etched surface**: validation modules are frozen with the kernel; a missing kind means either (a) demotion to an unenforced TAG-vocabulary convention, or (b) a successor-domain deployment (the hash-migration playbook path — git SHA-1 grade pain).

Consequently the freeze bias **inverts** relative to v1 instincts:

- **Omission is near-permanent.** Cutting LIST/LIST_ENTRY "to add later" is not the EAS-era cheap deferral it sounds like.
- **Extension splits into two lanes**, and this split is itself a spec rule:
  - **Convention lane (permissionless, forever):** new *semantics* = TAG edges under new vocabulary TAGDEFs. No kernel guards, no gating, lens-scoped meaning. This is the pressure valve that keeps the frozen kind set small-ish.
  - **Kernel lane (frozen):** new *enforced* kinds only via pre-reserved slots (blinded-TAGDEF variant, WHITEOUT, KEYGRANT/KEL records, CHECKPOINT, salted-TAGDEF) or successor deployment.
- **Kernel-kind criterion** (the earning-your-keep test used throughout): a record kind belongs in the frozen set **iff** at least one of:
  1. it **mints shared or derived identity** (needs canonical-encoding validation + a duplicate policy others rely on),
  2. it maintains **kernel index state with cardinality/lifecycle rules** readers depend on for O(1) verified reads,
  3. its **lifecycle class differs** from the default (non-revocable, or conditionally revocable) — revocability must be legible from the record, not from foreign state.
  Anything failing all three is a TAG + vocabulary convention, not a kind.

The honest bill of conservatism, stated up front: every kept kind is Etched audit surface, and the kernel's #1 failure mode is an admission-logic bug that fails early with no upgrade path (arch-B §11.1). My defense is that the guards below are ports of ~2,900 LoC of *already-reviewed, devnet-exercised* v1 validation; merged-kind designs replace reviewed code with novel composite semantics — the exact place the forSchema-class bug hides.

---

## 1. Census: what each v1 resolver actually enforces at write time

This is the ground truth the collapses must be measured against. Line numbers from the current contracts.

### 1.1 EFSIndexer — ANCHOR (`string name, bytes32 anchorSchema`, non-revocable)

| # | Guard | Code |
|---|---|---|
| A1 | `revocable == false` (permanent structural node) | L376 |
| A2 | `expirationTime == 0` (expiring anchor would resolve forever anyway — reads filter on revocation, not expiry) | L380 |
| A3 | **Canonical payload round-trip**: `keccak(data) == keccak(abi.encode(name, anchorSchema))` — abi.decode tolerates trailing bytes; without this, one name mints two permanent UIDs | L385 |
| A4 | **Canonical name profile** `_isValidAnchorName`: non-empty; not `.`/`..`; reserved byte set (C0, DEL, space, `"#%&/:=?@[\]^`{|}`) must be `%XX` UPPERCASE-escaped; escapes well-formed AND must decode to a byte that genuinely required escaping (no alias spellings — `%41` rejected); UTF-8 high bytes pass through. Exactly ONE valid encoding per name = the Schelling-point property | L958–1022 |
| A5 | Parent resolution: refUID, else recipient-as-address-container; first anchor must be generic root; thereafter parent required (`MissingParent`) | L396–413 |
| A6 | **Name uniqueness** per `(parent, name, anchorSchema)` — `DuplicateFileName` | L416 |
| A7 | **Depth cap** `MAX_ANCHOR_DEPTH = 32` via parent walk — bounds every future visibility walk | L421–429 |
| A8 | Index effects: `_nameToAnchor`, `_children`, `_childrenBySchema`, `_parents`, `_anchorSchemaOf` kind cache, attester visibility (`_containsAttestations` + deduped `_childrenByAttester`) | L432–459 |

### 1.2 EFSIndexer — DATA (empty payload, non-revocable)

| # | Guard | Code |
|---|---|---|
| D1 | `refUID == 0` (standalone) | L472 |
| D2 | `revocable == false` | L473 |
| D3 | `expirationTime == 0` | L474 |
| D4 | `data.length == 0` — EAS does not enforce schema ABI; without this, arbitrary bytes get served as valid pure-identity DATA | L475 |

### 1.3 EFSIndexer — PROPERTY (`string value`, non-revocable)

| # | Guard | Code |
|---|---|---|
| P1 | `refUID == 0`, `revocable == false`, `expirationTime == 0` | L488–490 |
| P2 | Canonical round-trip `keccak(data) == keccak(abi.encode(value))` — one interned value, one permanent UID | L499 |
| P3 | `valueHash = keccak(bytes(value))` emitted as the content dedup key | L502 |

### 1.4 EdgeResolver — PIN (`bytes32 definition`) / TAG (`bytes32 definition, int256 weight`), revocable

| # | Guard | Code |
|---|---|---|
| E1 | Schema branch **before** decode; unknown schema → revert (`UnknownEdgeSchema`) | L318–329 |
| E2 | **Exact payload length**: PIN = 32, TAG = 64 (`NonCanonicalPayload`) — fixed-width bodies make the length check itself the canonicality guard | L320, 324 |
| E3 | `revocable == true` required; `expirationTime == 0` — a welded-on or silently-expiring edge is rejected at write | L336–337 |
| E4 | `_validateDefinition`: nonzero; address-shaped OR registered schema OR existing attestation | L681–696 |
| E5 | Target resolution: refUID (must exist in EAS, schema cached) else recipient-address; else `MustTargetSomething` | L341–349, 698–702 |
| E6 | **Schema-aware edge hash** — PIN and TAG state at the same triple live in independent slots; "without it, mixing PIN and TAG at one triple corrupts the active-edge map" | L291–298 |
| E7 | PIN: cardinality-1 `_activeBySlot[def][attester][targetSchema]`; supersede-in-O(1) with full prior-edge cleanup (activeEdge delete, counters) | L531–571 |
| E8 | TAG: cardinality-N `_activeByAAS` array + position index; re-attest same edgeHash = in-place UID/weight update (**not** a second entry) | L580–622 |
| E9 | Visibility propagation only for structural edges whose definition is an ANCHOR; symmetric clearContains on revoke when the per-(def,attester) count hits zero | L418–427, 495–505 |
| E10 | Revoke: acts only if still-active UID (superseded PIN revoke = no-op); swap-and-pop with rehash for TAG | L435–514, 633–675 |

### 1.5 MirrorResolver — MIRROR (`bytes32 transportDefinition, string uri`), revocable

| # | Guard | Code |
|---|---|---|
| M1 | Foreign-schema guard | L150 |
| M2 | refUID nonzero and target schema == DATA — a mirror attaches to file identity only | L153–156 |
| M3 | `revocable == true`; `expirationTime == 0` | L163–164 |
| M4 | Canonical round-trip re-encode (dynamic string) | L176 |
| M5 | `uri` non-empty; `length <= MAX_URI_LENGTH = 8192` | L179–180 |
| M6 | **Transport typing**: transportDefinition nonzero, is an ANCHOR, and is a `/transports/` **descendant** (parent walk ≤ `MAX_TRANSPORT_DEPTH = 8`) — the neutral alternative to a scheme allowlist (ADR-0056: deliberately NO scheme check; transport identity is a declared anchor, never a parsed string) | L181–188, 216–226 |

### 1.6 ListResolver — LIST (5 fields, non-revocable, stateless validation)

| # | Guard | Code |
|---|---|---|
| L1 | Foreign-schema guard (self-derived UID) | L68 |
| L2 | Exact length 160 (5 words) | L69 |
| L3 | Non-revocable; no expiry; `refUID == 0`; `recipient == 0` (free-floating, undirected) | L70–73 |
| L4 | `targetType <= 2`; SCHEMA mode ⇒ `targetSchema != 0`, else `targetSchema == 0` | L78–84 |
| L5 | `appendOnly && allowsDuplicates ⇒ maxEntries != 0` — the only unbounded combination is capped | L87–89 |

### 1.7 ListEntryResolver — LIST_ENTRY (`bytes32 listUID, bytes32 target`), revocable-with-conditions

| # | Guard | Code |
|---|---|---|
| LE1 | Foreign-schema guard (self-derived proxy UID — the ADR-0048 §2 bug class lives here) | L214 |
| LE2 | Exact length 64; revocable == true; no expiry; `refUID == 0` | L215–220 |
| LE3 | `listUID != 0`; declaration hydrated from EAS, **must be LIST schema** (`NotAList`); cached forever (LIST immutable) | L223–236 |
| LE4 | **Per-mode typing**: ADDR ⇒ `target == 0`, identity = recipient (addr(0) *allowed* in v1); SCHEMA ⇒ recipient == 0, target nonzero, exists, `target.schema == d.targetSchema`; ANY ⇒ recipient == 0, target nonzero opaque | L241–258 |
| LE5 | `!allowsDuplicates ⇒ _entryCount[list][identityKey][attester] == 0` (`DuplicateIdentity`) — per-attester lens dedup | L261–263 |
| LE6 | `maxEntries != 0 ⇒ entries.length < maxEntries` per attester (`ListFull`) | L266–268 |
| LE7 | Wide `EntryRecord[]` (identityKey inline) for O(N) on-chain iteration without per-entry hydration; append-only attester-lens registry | L271–279 |
| LE8 | **Revoke**: idempotent for stale UID; **`appendOnly ⇒ revert ListIsAppendOnly`** — revocation *refusal* driven by the list charter; swap-and-pop + count decrement | L285–320 |

### 1.8 AliasResolver — REDIRECT (`bytes32 target, uint16 kind`), revocable

| # | Guard | Code |
|---|---|---|
| R1 | Foreign-schema guard; exact length 64; revocable == true; no expiry | L165–173 |
| R2 | `target != 0`; `target != source` (no trivial self-loop) | L178–179 |
| R3 | **Per-kind endpoint typing**: sameAs/supersededBy ⇒ source AND target are DATA; symlink ⇒ source is ANCHOR, target ANCHOR-or-DATA; kind ≥ 3 recorded but not typed (open taxonomy outside the UID — ADR-0050) | L181–194 |
| R4 | Read-time resolution (multi-hop, SCC cycle rules, follow policy per kind) deliberately NOT on-chain — write-time direct-correctness only | NatSpec L30–35 |

### 1.9 Guard classes the native kernel deletes **by construction** (the negative census)

These recur across every resolver and exist only because EAS offers footguns; they must NOT be re-invented in the kernel:

1. `expirationTime == 0` rejections (7 sites) — the kernel has no expiration field. Expiry becomes an app-layer property convention (see §8 note).
2. Per-record `revocable` flag mismatch rejections (7 sites) — revocability is a **kind class** in v2, not a per-record flag.
3. Foreign-schema guards + self-UID derivation (5 sites; the proxy/constructor brick bug class of ADR-0048 §2) — kindTag dispatch is kernel-owned.
4. `recipient` plumbing (address targets, ADDR-mode identity, `_receivedAttestations`) — field retired; addresses ride payload words.
5. refUID re-derivation checks (v2 §7's display-pointer rule) — refUID does not exist.
6. "First anchor is root" bootstrap logic + stored `transportsAnchorUID`/`sortsAnchorUID` setters — root is the constant `bytes32(0)`; `/transports` and all genesis tagIds are **spec-derivable constants** (`tagId = H(DOMAIN_ANCHOR, 0, H("transports"), KIND_GENERIC)`), written by the genesis blob. A strict improvement: transport-ancestry validation anchors to math, not deployment state.
7. The mid-batch `_db`-existence divergence (one-existence-rule footnote) — validate-then-commit kills it.

---

## 2. The v2 substrate assumed (for reference in the tables)

- Envelope: `{author, seq (TID w/ device bits), prev, recordsRoot, count}` + `Record[]{op, kindTag, body}`; one EIP-712 signature over the root, chain-free domain; author = recovered signer (or KEL-windowed key when identity records ship — reserved); `msg.sender` never in the auth path.
- Ops: `ASSERT`, `REVOKE`. `CHECKPOINT` is a **reserved** kindTag/op, not frozen semantics (no cross-chain currency sold).
- `claimId = keccak(abi.encode(DOMAIN_CLAIM_V1, author, uint256(seq), uint256(idx)))` — client-computable, chain-free, the revocation handle for slot-less claims.
- IDs per deterministic-ids §1 unchanged; `attester` word generalizes to the bytes32 author word. ANCHOR object → TAGDEF record; `anchorId` formula unchanged and is now called `tagId`.
- Registry: write-once `id → (firstClaimId, kind, …)`, kernel-internal, state-walk reconstructible.

---

## 3. The conservative kind set

**Nine kinds — four objects, five claims — plus two ops.** Same count as v1's nine schemas; ANCHOR becomes TAGDEF; every other kind survives because §1 shows it carries enforcement that dies under every proposed merge (§6).

| Kind | Class | Ownership | Revocability | Cardinality | ID |
|---|---|---|---|---|---|
| TAGDEF | object | unowned (Schelling) | non-revocable (path permanence) | n/a | `tagId = H(DOMAIN_ANCHOR, parentId, H(name), kindTag)` |
| DATA | object | **owned** (author+salt) | non-revocable | n/a | `H(DOMAIN_DATA, author, salt)` |
| PROPERTY | object | unowned (interned) | non-revocable | n/a | `H(DOMAIN_PROPERTY, datatype, H(value))` |
| LIST | object | **owned** (author+salt) | non-revocable | n/a | `H(DOMAIN_LIST, author, salt)` |
| PIN | claim | per-author | revocable | **1 per slot** | slot `H(DOMAIN_SLOT, ROLE_PIN, author, definitionId, targetKind)` |
| TAG | claim | per-author | revocable | **N per definition** | slot `H(DOMAIN_SLOT, ROLE_TAG, author, definitionId, targetId)` |
| MIRROR | claim | per-author | revocable | N per DATA, slot-less | handle = claimId |
| LIST_ENTRY | claim | per-author | **conditional** (appendOnly refuses) | N per list (gated) | slot `H(DOMAIN_SLOT, ROLE_LIST_ENTRY, author, listId, identityKey)` |
| REDIRECT | claim | per-author | revocable | N per source, slot-less | handle = claimId |

**Ops:** `ASSERT` (carries one of the nine kinds), `REVOKE` (names a claim by `(seq, idx)` coordinates — §5.4).
**Reserved (formats frozen, machinery not built):** CHECKPOINT; KEYGRANT/KEL identity events; WHITEOUT; blinded-TAGDEF variant + name-disclosure record; salted-TAGDEF (`DOMAIN_ANCHOR_SALTED`); datatype-tag extension constants.
**Out (with disposition):** SORT_INFO (overlay, never frozen — stays out); foreign-EAS-attestation LIST mode (forced out by native carrier — targetKind over EFS kinds replaces targetSchema); ADR-0033 raw EAS-UID containers (forced out — alias TAGDEFs are the only container form; resolves that open question).

---

## 4. Per-kind write-time guard tables (spec-grade — kernel validation code)

Conventions: all guards run **validate-then-commit, per record, in envelope order**; any guard failure reverts the whole envelope (empty state diff) except the two named non-revert cases (§5.2, §9). "Instantiated(x, K)" = kernel registry holds x with kind K at this record's validation point (parents-first within the envelope satisfies this for batch-minted parents). Fixed-width bodies use exact-length checks; dynamic bodies use re-encode-hash-compare (the v1 `NonCanonicalPayload` pattern).

### 4.1 TAGDEF — `(bytes32 parentId, string name, bytes32 kindTag)` (dynamic)

| # | Guard | Rule | On violation |
|---|---|---|---|
| T1 | Canonical encoding | `keccak(body) == keccak(abi.encode(parentId, name, kindTag))` | revert `NonCanonicalPayload` |
| T2 | Name profile | v1 A4 verbatim: non-empty; ≠ `.`/`..`; reserved-byte set %XX-uppercase-escaped; escapes well-formed AND decode to reserved-or-`%`; UTF-8 passthrough. (NFC + pinned Unicode version stays SDK-side per ADR-0048; on-chain validates the byte-profile half.) | revert `InvalidName` |
| T3 | Kind legality | `kindTag ∈ {KIND_GENERIC(0), KIND_DATA, KIND_PROPERTY, KIND_LIST}` (closed at freeze; new kinds only via reserved gate) | revert `InvalidKind` |
| T4 | Parent existence | `parentId == 0` (root) OR address-shaped (`0 < parentId ≤ uint160.max`) OR Instantiated(parentId, TAGDEF). Any other value reverts — this is what makes the batch-shuffle invariant hold | revert `MissingParent` |
| T5 | Attachment matrix | parent kind GENERIC → child any kind; parent KIND_DATA → child KIND_PROPERTY only; parent KIND_PROPERTY → no children; parent KIND_LIST → KIND_PROPERTY only. (Address-shaped and root parents behave as GENERIC.) | revert `IllegalAttachment` |
| T6 | Depth | parent-chain depth after insertion ≤ MAX_DEPTH = 32 (bounds all visibility/ancestry walks) | revert `TooDeep` |
| T7 | Duplicate policy | derived `tagId` already instantiated ⇒ **idempotent no-op success**: registry keeps first; no array re-push, no creation event; the duplicate author's visibility effects still run (v2 §6). Blinded/plaintext form-orderings per deterministic-ids §8 matrix | no-op |
| T8 | Non-revocable | REVOKE naming a TAGDEF-assert's coordinates is **inert** (revocation state is never consulted for object kinds — §5.4) | inert |
| Effects | registry write-once (tagId → first claim, kind cache, parent pointer); children indices (`_children`, per-kind children); author visibility bits | | |

Note subsumption: v1's `DuplicateFileName` (A6) is **subsumed by the derivation** — same `(parent, name, kind)` = same id = registry write-once. A guard becomes math; nothing to code, one less thing to get wrong.

### 4.2 DATA — `(bytes32 salt)` (fixed, 32 bytes)

| # | Guard | Rule | On violation |
|---|---|---|---|
| DA1 | Length | `body.length == 32` | revert |
| DA2 | Salt | `salt != 0` (uninitialized-memory footgun); SDK-normative ≥128-bit entropy rule (spec, not kernel-checkable) | revert `ZeroSalt` |
| DA3 | Duplicate | `dataId = H(DOMAIN_DATA, author, salt)`; id commits to the *entire* body + author, so same-id-different-payload is impossible — every duplicate is byte-identical ⇒ **idempotent no-op** | no-op |
| DA4 | Non-revocable | as T8 | inert |
| Unsquattable by construction: only the author's signature can mint their `(author, salt)` — v1's owned-kind REVERT (protecting against mirror/property merge corruption) is replaced by the signature gate itself. | | | |

### 4.3 PROPERTY — `(bytes32 datatypeTag, bytes value)` (dynamic)

| # | Guard | Rule | On violation |
|---|---|---|---|
| PR1 | Canonical encoding | re-encode-hash-compare | revert `NonCanonicalPayload` |
| PR2 | Datatype | `datatypeTag != 0`. For the seeded set {string, int256, uint256, bool, bytes32ref} the kernel additionally validates the **canonical byte-encoding** (int/uint: exactly 32 bytes big-endian; bool: exactly 1 word ∈ {0,1}; ref: exactly 32 bytes; string: raw bytes). Unknown tags: value bytes opaque, accepted (extension is permissionless via documented constants — the tag partitions the interning space, so garbage encodings pollute only their own tag) | revert `BadDatatype` / `BadEncoding` |
| PR3 | Duplicate | `propertyId = H(DOMAIN_PROPERTY, datatypeTag, H(value))` — same id ⇒ same bytes (keccak) ⇒ **idempotent no-op** | no-op |
| PR4 | Non-revocable | ADR-0052 rationale ports: interned shared value; the revocable claim is the binding | inert |
| FLAG | No length cap in v1; none added. Gas prices unbounded values; a kernel cap would punish all values to protect none (unlike MIRROR, nothing serves a property blind). Phase-0 confirm. | | |

### 4.4 LIST — `(bytes32 salt, bool allowsDuplicates, bool appendOnly, uint8 targetType, bytes32 targetKind, uint256 maxEntries)` (fixed, 192 bytes)

| # | Guard | Rule | On violation |
|---|---|---|---|
| LI1 | Length + word canonicality | `body.length == 192`; bool words ∈ {0,1}; uint8 word ≤ 255 (high bytes clean) | revert |
| LI2 | Salt | `salt != 0` | revert |
| LI3 | Mode | `targetType ∈ {ANY=0, ADDR=1, KIND=2}`. KIND mode replaces v1 SCHEMA mode: members typed by **EFS kindTag** (⇒ `targetKind ∈ {KIND_DATA, KIND_PROPERTY, KIND_LIST, TAGDEF-any}` nonzero); ANY/ADDR ⇒ `targetKind == 0`. Foreign-EAS lists dropped (no EAS in kernel) | revert |
| LI4 | Boundedness | `appendOnly && allowsDuplicates ⇒ maxEntries != 0` (v1 L5) | revert |
| LI5 | Duplicate | byte-identical ⇒ idempotent no-op. Same `(author, salt)` + **different config** ⇒ **author-equivocation evidence**: recorded, first-instantiated config governs forever, never merged, never a batch-killing revert (substrate §3.4). This is the *only* owned-kind equivocation surface (DATA can't equivocate — §4.2) | evidence event |
| LI6 | Non-revocable; `maxEntries` declared **chain-local admission state** (substrate reservation — a replicated list's fullness is per-chain) | | |

### 4.5 PIN — `(bytes32 definitionId, bytes32 targetId, bytes32 targetKind, bytes32 defParentId, bytes32 defKeyHash)` (fixed, 160 bytes)

| # | Guard | Rule | On violation |
|---|---|---|---|
| PI1 | Length | `body.length == 160` | revert |
| PI2 | Definition | `definitionId != 0` AND either (a) Instantiated(definitionId, TAGDEF) with `defParentId == defKeyHash == 0`, or (b) the **virtual reserved-key carve-out**: `defParentId != 0 && defKeyHash != 0` ⇒ require `targetKind == KIND_PROPERTY`, `defKeyHash ∈ H{contentType, contentHash, size, name, contentEncryption}` (closed; `keyWrap` excluded — cardinality-N; see §8 flag on `expiresAt`), Instantiated(defParentId, KIND_DATA TAGDEF), and `definitionId == H(DOMAIN_ANCHOR, defParentId, defKeyHash, KIND_PROPERTY)` recompute-and-compare | revert `InvalidDefinition` |
| PI3 | Declared targetKind | `targetKind ∈ {TARGETKIND_TAGDEF, TARGETKIND_ADDRESS, TARGETKIND_OPAQUE, KIND_DATA, KIND_PROPERTY, KIND_LIST}`; `0` illegal. Declared, never inferred — slot-key stability by construction (kills the re-classification two-actives attack) | revert |
| PI4 | Target validation by declared kind | object kinds ⇒ Instantiated(targetId, declared kind); TAGDEF ⇒ registry entry is a TAGDEF (any kindTag); ADDRESS ⇒ `0 < targetId ≤ uint160.max`; OPAQUE ⇒ targetId nonzero AND **not** a registered object or claim id of any canonical kind (claims are never legal targets; a registered object must be declared under its real kind) | revert `InvalidTarget` |
| PI5 | Attachment matrix (definition kind × target) | GENERIC def ⇒ KIND_DATA target (dirnode interpretation); KIND_DATA def (file slot) ⇒ KIND_DATA (placement); KIND_PROPERTY def (key) ⇒ KIND_PROPERTY (value binding, incl. carve-out); KIND_LIST def ⇒ KIND_LIST | revert `IllegalAttachment` |
| PI6 | Slot supersession | current = max `(seq, recordIdx)` among admitted unrevoked claims at the slot, with `claimDigest` as final lexicographic tie-break (§5.3) — **never chain arrival order**; replicas converge | n/a |
| PI7 | Revocable; handle = claimId; revoke clears the slot iff still-current | | |
| Effects | active-slot write; visibility propagation (walk ≤ 32) when definition is a TAGDEF; append-only discovery indices | | |

**Narrowing vs v1, deliberate:** v1 E4 accepted *any* address / schema / attestation as a definition. v2 definitions must be instantiated TAGDEFs (or the recompute carve-out). Predicates become named, canonical-validated, discoverable; the dangling-predicate class dies. Cost: one shared, one-time TAGDEF registration per novel predicate; v1's schema-UID-as-definition hack (ADR-0038 folder visibility) is replaced by genesis vocabulary TAGDEFs (recommend `/.well-known/vocab/contains` etc. in the genesis blob). Flagged for the app-suite grounding pass (§12.5).

### 4.6 TAG — `(bytes32 definitionId, bytes32 targetId, bytes32 targetKind, int256 weight)` (fixed, 128 bytes)

| # | Guard | Rule | On violation |
|---|---|---|---|
| TA1 | Length | `body.length == 128` | revert |
| TA2–TA5 | = PI2(a only — **no virtual carve-out for TAG** in the freeze; reserved keys are PIN-only, cardinality-N key bindings await an additive schema), PI3, PI4, attachment matrix with TAG legality (visibility TAGs legal at GENERIC anchors) | | revert |
| TA6 | Edge slot | slot = `H(DOMAIN_SLOT, ROLE_TAG, author, definitionId, targetId)`; re-assert = supersession by `(seq, idx)` → **in-place weight/claim update, never a second entry** (v1 E8); distinct targets accumulate under the definition | n/a |
| TA7 | Weight | raw int256, kernel is weight-neutral forever (ADR-0041 §4; "effective TAG" thresholds are client/view policy) | n/a |
| TA8 | Revocable; swap-and-pop active set; visibility clear when per-(def,author) structural count reaches zero (v1 E9 symmetric pair) | | |

### 4.7 MIRROR — `(bytes32 dataId, bytes32 transportId, string uri)` (dynamic)

| # | Guard | Rule | On violation |
|---|---|---|---|
| MI1 | Canonical encoding | re-encode-hash-compare | revert |
| MI2 | Data typing | Instantiated(dataId, KIND_DATA) | revert `InvalidData` |
| MI3 | Transport typing | Instantiated(transportId, TAGDEF) AND ancestry walk (parent pointers, ≤ MAX_TRANSPORT_DEPTH = 8) reaches `TRANSPORTS_TAGID` — now a **spec constant** `H(DOMAIN_ANCHOR, 0, H("transports"), KIND_GENERIC)`, not stored state. Named exception to the registry-read-only rule (the walk reads the parent index) | revert `InvalidTransport` |
| MI4 | URI bounds | `0 < len(uri) ≤ 8192` | revert |
| MI5 | **No scheme allow/denylist** — Etched doctrine (ADR-0056): scheme checks on immutable contracts are evadable, un-patchable, and not a security boundary; transport identity is the declared anchor | n/a |
| MI6 | Slot-less; multi-valued (ADR-0015: no singleton mirrors); handle = claimId; byte-identical envelope replay idempotent via claimId | | |
| MI7 | Revocable | | |

### 4.8 LIST_ENTRY — `(bytes32 listId, bytes32 target)` (fixed, 64 bytes)

| # | Guard | Rule | On violation |
|---|---|---|---|
| LE1 | Length | `body.length == 64` | revert |
| LE2 | List | Instantiated(listId, KIND_LIST); config = first-instantiation record (immutable ⇒ cache-forever legal) | revert `NotAList` |
| LE3 | Per-mode typing | ANY ⇒ target nonzero, and not a registered claim id; ADDR ⇒ `0 < target ≤ uint160.max` (**`address(0)` rejected — v1 allowed it; Phase-0 sign-off item, carried from deterministic-ids §3**); KIND ⇒ Instantiated(target, list.targetKind) | revert |
| LE4 | identityKey | `= target` in ALL modes (v1's recipient-derived key retired) | n/a |
| LE5 | Dedup | `!allowsDuplicates ⇒ count[listId][identityKey][author] == 0` | revert `DuplicateIdentity` |
| LE6 | Cap | `maxEntries != 0 ⇒ authorEntryCount < maxEntries` (chain-local) | revert `ListFull` |
| LE7 | Metadata slot | order/label PROPERTYs bind to `slotId(ROLE_LIST_ENTRY, author, listId, identityKey)` — **only for `!allowsDuplicates` lists** (duplicate entries share the slot; metadata would merge — open occurrence-discriminator question stays open, deterministic-ids §1) | n/a |
| LE8 | **Revoke** | hydrate list config; `appendOnly ⇒ REFUSED` (see §5.4 for the out-of-order-tombstone rule); else swap-and-pop + count decrement; stale revoke idempotent | revert `ListIsAppendOnly` |

### 4.9 REDIRECT — `(bytes32 sourceId, bytes32 targetId, uint16 kind)` (fixed, 96 bytes)

| # | Guard | Rule | On violation |
|---|---|---|---|
| RE1 | Length + canonical uint16 (high bytes clean) | `body.length == 96` | revert |
| RE2 | Basics | `targetId != 0`; `targetId != sourceId` | revert `ZeroTarget`/`SelfLoop` |
| RE3 | Per-kind typing | `0 sameAs` / `1 supersededBy` ⇒ Instantiated(source, DATA) AND Instantiated(target, DATA); `2 symlink` ⇒ Instantiated(source, TAGDEF), target TAGDEF-or-DATA instantiated; `3 relatedVersion` ⇒ recorded, RE2 only, **never auto-followed** (ADR-0050/0055 — 3 is taken); `4 movedTo` ⇒ source TAGDEF, target TAGDEF, both instantiated (the tag-core rename primitive); `≥5` reserved ⇒ recorded, RE2 only | revert per kind |
| RE4 | Cross-chain provenance is NOT a REDIRECT (existence-checked kinds are same-chain by construction; replica provenance is claim *data*, deterministic-ids §9) | | n/a |
| RE5 | Slot-less, multi-valued; handle = claimId; revocable. SCC cycle tie-break re-keyed on chain-free ids (lowest sourceId) — read-spec, recorded here because the substrate reservation requires it | | |

---

## 5. Cross-kind kernel rules (the guards that live above any single kind)

### 5.1 Envelope admission (before any record validates)
1. EIP-712 signature verifies under the chain-free domain; `author` = recovered signer; bare-EOA rule in v2 (KEL windows reserved).
2. `(author, seq)` first-seen: **byte-identical envelope digest ⇒ idempotent no-op success** (LOCKSS resubmission and relayer races are harmless; front-running a submission is a gift).
3. TID future bound: `tidTime(seq) ≤ block.timestamp + 600`; past unbounded (2030 envelopes admit in 2090).
4. Parents-first ordering `[DATA][LIST][TAGDEF ancestors-first][PROPERTY][MIRROR][PIN][TAG][LIST_ENTRY][REDIRECT]` — enforced by construction: each record's existence checks run at its own validation point, so a mis-ordered batch reverts (batch-shuffle invariant). No separate ordering validator needed.
5. Whole-envelope atomicity: any revert ⇒ empty state diff. Exceptions that do NOT revert: idempotent duplicates (T7/DA3/PR3), LIST config equivocation (LI5 — evidence event).

### 5.2 Same `(author, seq)`, different digest — a forced divergence from arch-B
Arch-B rule 2 (`REVERT + DuplicityDetected`) **contradicts** the frozen substrate reservation ("record-level seq collisions are NEVER duplicity; only KEL/head equivocation is — two honest devices must not manufacture equivocation evidence"). Conservative resolution: **admit both envelopes** (each validly signed, distinct digests, honest multi-device is the expected cause given TID device bits); slot supersession totally ordered by `(seq, recordIdx, claimDigest)` lexicographic — deterministic, replay-order-independent, no evidence event. The convergence property (identical state from any admission order of any envelope subset) must hold across this case in the invariant suite. **Flag for the envelope red-team:** this weakens per-author log integrity signaling relative to arch-B; the compensating control is `prev` as tamper-evidence and lens-level adjudication.

### 5.3 Slot supersession is a pure function of the admitted set
Current claim at slot = max `(seq, idx, digest)` among admitted, unrevoked claims. Never arrival order. This is what makes "replication = resubmission" true; it is invariant-suite property #1.

### 5.4 REVOKE semantics (op, not kind) — the out-of-order rules that make revocation portable
- **Body = `(uint64 seq, uint32 idx)` coordinates, not a bare claimId.** The kernel recomputes `claimId = H(DOMAIN_CLAIM, envelopeAuthor, seq, idx)` — cross-author revocation is impossible **by construction** (you can only ever name your own coordinates), replacing v1's `AccessDenied` check with math.
- **Tombstone-first admission is legal.** Under sparse admission and permissionless relay, a REVOKE may reach a chain before its claim. Requiring claim-existence would make state depend on replay order, breaking convergence (§5.3). So REVOKE always admits and writes a monotone tombstone keyed by claimId.
- **Effect is evaluated where the target's kind is known**, not at REVOKE admission:
  - Object kinds **never consult** revocation state — a stray tombstone on a TAGDEF/DATA/PROPERTY/LIST coordinate is permanently inert (path/value permanence cannot be griefed, even by the author).
  - `appendOnly` LIST_ENTRY: the refusal is enforced at whichever admission event completes the pair — REVOKE arriving second reverts (v1 behavior); entry arriving second admits and the pre-existing tombstone is **discarded as void** (an appendOnly entry is constitutionally irrevocable; a void tombstone must not linger as a time bomb). This rule must be a golden vector.
  - Revocation is monotone: no un-revoke; REVOKE of a REVOKE is meaningless (ops have no claimIds — only ASSERTs occupy `(seq, idx)` coordinates? No: coordinates index all records; a REVOKE naming a REVOKE's coordinates is inert by the object-rule analog — REVOKEs are not revocable claims).
- Cross-chain completeness stays best-effort (carrier decision): propagation free, absence unprovable; apps use the expiry convention (§8 note) for safety-critical data. Read-grade vocabulary is normative: *proven-absent* ≠ *unknown*; missing data never resolves as no-claim.

### 5.5 Genesis
Bootstrap tree (root children, `/transports/*`, reserved-key documentation nodes, vocab TAGDEFs, the Codex at `/.well-known/spec`) written in the deployment ceremony under reserved author word `H("efs.system.v1")` from a frozen genesis blob — byte-identical on every chain; all genesis tagIds are spec-derivable constants. No runtime code-governed author exists (SystemAccount retires).

---

## 6. Collapse adjudications

Verdict key: **REJECT** = do not do this; the named failure modes are load-bearing. **RATIFY** = collapse already made by the tag-core/deterministic-ids passes that I endorse from the conservative prior.

### 6.1 PIN + TAG → one edge kind with a cardinality field — REJECT (reaffirming flagged trap #1)
Named failures:
1. **Slot-shape indeterminacy.** A reader (contract or light client) cannot know whether a slot read returns one value or a list without hydrating the record's cardinality field — the O(1) placement read (`getSlot`, one SLOAD) becomes read-decode-branch. v1 evidence: `_edgeHash` *includes the schema* precisely because "mixing PIN and TAG at one triple corrupts the active-edge map" (EdgeResolver L291–298); `_activeBySlot` vs `_activeByAAS` are physically different storage shapes.
2. **Slot-flip equivocation.** With cardinality in the record, an author (or a buggy client) can assert cardinality-1 and cardinality-N records at the same `(author, definition)` key: two "current" placements at one logical slot — exactly the split-brain class v2 §7 kills for refUID. Cardinality-in-kind makes the state shape unforgeable.
3. **Frozen slot-arity table breaks.** deterministic-ids §1 freezes per-role slot key arity (PIN: `(definitionId, targetKind)`; TAG: `(definitionId, targetId)`). One merged kind = one slot rule = either PINs lose slot-per-targetKind or TAGs collapse to one-per-definition.
Cardinality is the single most-read bit in the system (every path resolution, every lens step); it belongs in the kind, where reading it is free.

### 6.2 DATA as an unowned tag-like object — REJECT (reaffirming flagged trap #2)
Named failure: **identity squat / stranger-merge.** DATA is owned (`H(author, salt)`) and unsquattable; TAGDEFs are unowned Schelling points with idempotent duplicates. Merge the policies either direction and you get: shared file identity where two strangers' "same" file merges mirrors and properties under one id (v1's REVERT comment names this "permanent corruption" — EFSIndexer heritage, deterministic-ids §6), or owned paths where the first claimant owns `/pizza` forever (namespace enclosure — anti-neutral). Opposite duplicate policies are not an accident; they are the ownership semantics.

### 6.3 MIRROR → reserved property key — REJECT
The proposal: mirror = TAG (or PIN) binding an interned URI PROPERTY under a reserved key on the DATA. What §1.5 enforcement dies:
1. **Scheme-sniffing dispatch returns.** MIRROR's `transportId` + `/transports` ancestry walk is the *neutral, string-free* transport type system (ADR-0056 killed the scheme allowlist because parsing attacker-controlled strings on an immutable contract is evadable and un-patchable). Property-encoded mirrors leave transport identity nowhere except the URI scheme — every ranked read re-parses attacker bytes, forever.
2. **Transport-namespace collapse.** Permissionless transport extension today = anyone attests `/transports/<new>` and mirrors ride it with full write-time typing. Under a reserved key there is either one undifferentiated "mirror" key (transport typing gone) or one reserved key per transport (the closed reserved-key enumeration becomes an open, growing magic table — a schema registry wearing a trench coat).
3. **Singleton-mirror trap** if PIN-bound: cardinality-1 per key contradicts ADR-0015 (multiple mirrors per DATA is the redundancy model). So it must be TAG — and then:
4. **N+1 hydration in the serving path.** The router's lens-scoped, transport-ranked selection reads `(dataId, author, transportId)`-keyed state; property-encoding forces per-candidate interned-value fetch + parse before ranking (v1 capped mirror scans at 500 for gas reasons — the collapse multiplies the per-candidate cost).
5. **URI bounding loses its home.** `MAX_URI_LENGTH = 8192` is mirror-specific; PROPERTY has deliberately no cap. Either properties get capped globally (wrong) or mirror URIs become unbounded permanent storage (wrong).
Retention justified under criterion (2): mirror state is the retrieval index every verify-don't-trust read depends on. Honest marginality note: §12.1.

### 6.4 REDIRECT → property — REJECT (both variants)
**Variant A — redirect as string property value:**
1. **Stringly-typed graph edge.** `targetId` becomes hex-in-a-string: case, `0x`-prefix, zero-padding, whitespace each mint a distinct interned value for one logical edge — reopening the exact encoding-alias class the canonical-name profile and round-trip guards exist to kill (§1.1 A3/A4). A graph substrate whose edges need a string parser is not verify-don't-trust.
2. **Endpoint-typing loss.** sameAs/supersededBy's DATA↔DATA and symlink/movedTo's TAGDEF-source checks (§1.8 R3) vanish; a symlink to a claim, a sameAs to a folder, a self-loop via aliased spelling all become representable and must be handled by every reader forever.
3. **Follow-rule illegibility.** Read-time policy is per-kind and safety-relevant (`movedTo` auto-follows; `relatedVersion` must NEVER auto-follow). Machine-typed uint16 makes the policy checkable; a misparsed string kind auto-follows a never-follow link = trust hijack through the rename machinery.
**Variant B — redirect as PIN/TAG under reserved per-kind definition keys:**
4. **Magic-key schema smuggling.** Per-key endpoint typing means the edge validator special-cases a frozen table of definition ids — a schema system with worse discoverability, and the record's meaning (and validation!) dispatches on *which definition it references* rather than its own kind: state-dependent record semantics (same bimodality failure as §6.5.3). You don't delete the kind; you hide it where the 50-year reader won't find it.
REDIRECT is also load-bearing for tag-core itself (rename/subsume over immutable IDs = `movedTo`); it cannot be a convention.

### 6.5 LIST_ENTRY → cardinality-N edge (TAG with definition = listId) — REJECT the kind-merge; ACCEPT machinery-sharing
This was an anchor-pass *lead*, so cause is owed. Named failures of the full merge:
1. **Duplicate collapse.** TAG's slot identity is `(author, definitionId, targetId)`; re-asserting the same target **updates in place** (v1 E8 — deliberately). An `allowsDuplicates` list needs multiplicity of one identityKey ("eggs" twice). Under TAG slot semantics multiplicity is *unrepresentable* — the second entry supersedes the first, count stays 1. 
2. **Occurrence-discriminator infection.** Fixing (1) means adding an occurrence word to the slot derivation — which either changes EVERY TAG's frozen slot formula (all tags pay for lists) or forks slot rules by definition-kind (two derivations, one kind — worse than two kinds).
3. **Bimodal record semantics.** Validation (mode typing, dedup, cap), lifecycle (appendOnly ⇒ irrevocable), and slot rules would all dispatch on `kindOf(definitionId)` — the same signed bytes mean different things depending on foreign registry state. This breaks self-description (statements-vs-things: a record's kind should be legible from the record) and makes wallet clear-signing (ERC-7730) unable to render the one warning that matters: *"this write is permanent"* (an appendOnly entry) vs "this is a revocable label" — without a chain read.
4. **Revocation-policy smuggling.** §1.7 LE8 is the only place in EFS where a *claim* refuses revocation. Hiding a conditionally-irrevocable record class inside a generically-revocable kind is a signer-consent failure, not just an engineering wart.
**Accepted form:** LIST_ENTRY keeps its kindTag and 2-word body; the kernel *implementation* may share the edge machinery (active-set storage, swap-and-pop, slot metadata binding) internally. Code sharing is free; kind merging is what breaks. Cost of keeping: one kindTag + one validation module whose logic (§4.8) must exist somewhere regardless.

### 6.6 PROPERTY → edge with inline value bytes — REJECT, with the honest counter-case recorded
The proposal: drop the interned object; PIN/TAG bodies carry `(datatypeTag, bytes value)` inline. Named failures:
1. **Edge canonicality tax.** PIN/TAG are the highest-volume kinds and currently have *fixed-width* bodies, so the exact-length check (v1 E2 — the cheapest, strongest canonicality guard in the system) does all the work. Inline values make every edge variable-length: re-encode-hash-compare on the hot path and a permanent trailing-bytes/encoding-alias attack class exactly where volume is highest.
2. **Interning economy loss.** The archive's most-repeated strings (`image/png`, license texts, vocabulary labels) are paid once under interning, per-edge forever under inlining. This compounds monotonically for 100 years — it is the one collapse whose cost *grows* with the archive's success.
3. **Value-node erasure.** `propertyId` makes a value a referenceable bytes32 node: value annotation, provenance claims, blinded-value disclosure (the §8 publish-hash-reveal-later pattern extends to values because the id commits to `H(value)`), value-keyed lists. Inline-only forecloses the node class; re-adding it later is a derivation-input change (irretrofittable class).
4. **Dual-representation split-brain** if both forms were allowed (inline AND interned): two encodings of one logical binding = the refUID lesson (v2 §7) replayed. One representation must win; the interned one is the one with a future.
**Honest counter (the maximalist is not wrong about):** inlining buys read locality (value arrives with the edge; no second lookup), one fewer record for one-off values, and dissolves the shared-value non-revocability question. **Flip condition:** if the app-suite grounding pass measures a corpus where one-off values dominate (>~80%) AND no on-chain consumer of value-nodes materializes AND edge canonicality is protected some other way, this collapse becomes defensible. Until measured, permanence bias holds: keep PROPERTY.

### 6.7 LIST → DATA + config-as-properties — PREEMPTIVE REJECT
(The maximalist symmetry: "a list is just an owned identity with metadata.") Named failure: **mutable charter.** LIST's config (dup/cap/appendOnly/mode) *gates other records' admission* (§4.8) and must be immutable and author-fixed at creation. Properties are revocable, lens-scoped **bindings** — a charter assembled from PIN-bound properties can be superseded or revoked under the entries' feet, and is only resolvable per-lens (whose charter governs admission?). Write-time gating cannot key on revocable claims. The 6-word owned object is the charter's only sound home.

### 6.8 TAGDEF + PROPERTY → one interned kind — PREEMPTIVE REJECT
Both are unowned interned Schelling objects, hence the temptation. Named failure: **name-profile leakage.** TAGDEF names carry the canonical-name profile (§4.1 T2 — reserved-byte escaping, one-spelling-per-name) because they are *path segments*; PROPERTY values are arbitrary bytes (any string, any byte, no profile) because they are *literals*. One kind = one validation rule: either values get name-restricted (breaks literals) or names lose canonical validation (breaks the Schelling property — the exact 50-year integrity property the TAGDEF record exists to carry). Also structurally different derivations (hierarchical `(parent, nameHash, kind)` vs flat `(datatype, valueHash)`) — a merge is two kinds sharing a label.

### 6.9 Collapses RATIFIED (already made; conservative endorsement with the guard-preservation shown)
1. **ANCHOR-object → TAGDEF thin record.** The record retains the two properties the red team caught (on-chain canonical-name validation §4.1 T2; non-revocability §4.1 T8); refUID-referenceability was ANCHOR's only unique capability and is already spent. The `DuplicateFileName` guard is subsumed by derivation math (§4.1 note).
2. **Naming-slot 3 writes → 2 (TAGDEF + PIN) and the virtual reserved-key carve-out.** Guards preserved via the recompute rule (§4.5 PI2b) — enforcement moved into math, not convention. The orphan-subtree hazard is closed by the "derived point-lookup only, never walk-reachable" rule.
3. **LIST foreign-EAS mode → dropped; targetKind replaces targetSchema.** Forced by the native carrier; the EAS-universe-lens capability moves to optional view-layer reads (or the EASExporter direction), never kernel.
4. **ADR-0033 raw EAS-UID root containers → dead.** Alias TAGDEFs become the only container form — resolves deterministic-ids' open question by force, and cleanly (raw UIDs were shape-indistinguishable from uninstantiated ids anyway).
5. **The §1.9 negative census** — seven guard classes deleted because the substrate stops offering the footgun. The kernel must not re-grow expiration fields, per-record revocability flags, or recipient.

---

## 7. Naming vs categorizing — the TAGDEF ruling

**Ruling: naming vs categorizing is an EDGE distinction (PIN vs TAG), not a NODE distinction. One TAGDEF record kind; folders and category labels share `KIND_GENERIC`; do NOT mint a separate "label" kindTag.**

- `/pizza` the folder and `#pizza` the label derive the **same tagId** (`H(DOMAIN_ANCHOR, parent, H("pizza"), KIND_GENERIC)`). Placing a file *at* it is a PIN (cardinality-1 name slot, first-attester-wins path semantics); labeling a file *with* it is a TAG (cardinality-N membership). Readers already separate by edge kind (different kinds, different indices) — the node kind adds nothing.
- **Failure mode of splitting** (label-kind ≠ folder-kind): **namespace fork.** The same human name registers twice; links resolved against one space silently miss the other; every client and every URL grammar must forever carry a which-space discriminator; the Schelling property ("independent clients resolve the same name to the same id") halves. Registration cost doubles for the overwhelmingly common case where a community wants `/pizza` to be both browsable and taggable.
- **Squatting is inert**, so sharing is safe: TAGDEF registration grants **no privilege** (unowned; first-instantiation just publishes the preimage; every author's edges reference the same derived id regardless of who registered it). The only "ownership" anywhere near a name is the per-author PIN slot, which is lens-scoped by construction.
- **The derivation `kind` word stays** — it is doing real type-system work *orthogonal to* naming-vs-categorizing: `KIND_DATA` (file-name slots), `KIND_PROPERTY` (key anchors), `KIND_LIST` (list slots) have different attachment matrices (§4.1 T5) and different PIN-target legality (§4.5 PI5). Deleting the kind word would collide a folder named `readme.md` with a file slot named `readme.md` under one id and destroy the per-kind uniqueness v1 encoded as `_nameToAnchor[parent][name][anchorSchema]`.
- **Flag (read-spec, not write-spec): name shadowing across kinds.** Because kind is in the id, `readme.md`-as-GENERIC and `readme.md`-as-KIND_DATA can both exist under one parent (as in v1). URL resolution needs a frozen total precedence order per context (recommend: file slot before folder in file-serving contexts, folder in directory contexts — but this must be a Codex read-semantics chapter with vectors, not folklore). Unresolved here; named in §12.4.

---

## 8. Non-revocability classes (which kinds must be permanent)

| Class | Members | Rule | Why permanent |
|---|---|---|---|
| **P — permanent objects** | TAGDEF, DATA, PROPERTY, LIST | REVOKE inert by construction (revocation state never consulted for object kinds — §5.4) | TAGDEF: links never structurally 404 (path permanence — the property the red team said the record must carry). DATA: file identity outlives placements. PROPERTY: interned value can't be yanked from under other bindings (ADR-0052). LIST: the charter gates admissions; a revocable charter is a mutable charter (§6.7) |
| **R — revocable claims** | PIN, TAG, MIRROR, REDIRECT | author-only revoke via coordinates (§5.4), monotone | claims are opinions; retracting them is the point |
| **C — conditionally revocable** | LIST_ENTRY | revocable iff `!list.appendOnly`; refusal enforced at pair-completion (§5.4), void tombstones discarded | append-only guest books / audit logs are a declared shape; the condition is legible from the entry's kind + one immutable object read |
| **M — monotone ops** | REVOKE | irrevocable; no un-revoke | revocation as a theorem on the live chain |
| **G — genesis** | all genesis records | non-revocable by construction (reserved author has no key) | bootstrap must be stable |

**Note on expiry:** the kernel has NO expiry field (§1.9.1) — do not reintroduce one. The carrier decision's "apps use author-set EXPIRY for safety-critical data" should be a **reserved property key** so there is exactly one canonical, wallet-legible place for it: recommend adding `expiresAt` (uint256 seconds, or ISO string under string-only) to the reserved virtual-key set {contentType, contentHash, size, name, contentEncryption} at Phase 0. Read layers treat it as advisory data grading, never kernel state.

---

## 9. Duplicate-policy matrix (per kind, under permissionless signature-verified relay)

| Kind | Same id, byte-identical payload | Same id, different payload | Who can trigger a collision |
|---|---|---|---|
| TAGDEF | idempotent no-op (no re-push, no re-event; duplicate author's visibility bits still run) | only via blinded↔plaintext forms (id-equal **by design**); all four form-orderings are required duplicate-matrix vectors; otherwise impossible (id commits to parent+nameHash+kind) | anyone (unowned) — hence idempotency, closing same-block races and mempool front-run griefing |
| PROPERTY | idempotent no-op | impossible (id commits to datatype + H(value)) | anyone (unowned) |
| DATA | idempotent no-op | **impossible** (body = salt = full id preimage w/ author) | only the author's own signature |
| LIST | idempotent no-op | **author-equivocation evidence** — recorded, first config governs, never merged, never batch-revert (substrate §3.4). The only owned-kind equivocation surface | only the author (signature-gated) |
| PIN / TAG | idempotent by claimId (envelope replay) | n/a — distinct `(seq, idx)` = distinct claim; slot supersession by `(seq, idx, digest)` decides currency | author |
| MIRROR / REDIRECT | idempotent by claimId | n/a — multi-valued; a second identical-content claim is just another claim | author |
| LIST_ENTRY | idempotent by claimId | n/a per-claim; **identity-level** dedup is LE5 (per identityKey per author), orthogonal to record duplication | author |
| Envelope layer | byte-identical `(author, seq)` ⇒ no-op | different digest ⇒ **both admitted**, tie-broken deterministically; NEVER duplicity evidence (substrate reservation; divergence from arch-B — §5.2) | author's own devices |

v1's owned-kind REVERT is retired with cause: under signature-verified carriage a "duplicate" can only be the author's own signed record, so the griefing scenario the REVERT guarded against (a third party colliding your id) is impossible, and reverting would brick honest replays. The corruption the REVERT prevented (stranger-merge) is prevented one layer down, by the signature.

---

## 10. Cardinality-in-kind — why it stays (the O(1) defense, consolidated)

- The **read** that must be O(1) is path resolution per lens author: `registry[tagId]` (1 read) + `slot[slotId]` (1 read) per lens entry. This works only because the slot key is derivable from public inputs *without touching the record*: `(ROLE_PIN, author, definitionId, targetKind)` — role (= cardinality) is a spec constant, not record data.
- Cardinality-as-field breaks it three ways: the slot key needs the field (hydration before addressing); the read shape (scalar vs list) is unknown until decode; and two records can claim different cardinalities at one logical key (§6.1.2).
- The frozen per-role slot table (deterministic-ids §1) is the formalization: **roles are kinds; arity is frozen per role**. New arities = new `v1`-suffixed roles, additive.
- v1 evidence that this is bought wisdom, not theory: ADR-0041 moved cardinality *into the schema UID* after the `applies`-flag model failed; `_edgeHash` includes schema to keep the state machines independent; the specs' hardened invariant states it verbatim ("cardinality is declared at the schema level, not per-attestation").

---

## 11. The smallest kind set I will defend for 100 years

**The nine of §3 (TAGDEF, DATA, PROPERTY, LIST, PIN, TAG, MIRROR, LIST_ENTRY, REDIRECT) + ops (ASSERT, REVOKE) + the reservation list.** Each kind passes the §0 criterion:

| Kind | Passes criterion via |
|---|---|
| TAGDEF | (1) shared derived identity: canonical-name validation + path permanence + attachment typing |
| DATA | (1) owned identity: unsquattable file identity |
| PROPERTY | (1) interned identity: one value, one id, one encoding |
| LIST | (1)+(3): owned identity whose immutable charter gates other records |
| PIN | (2): cardinality-1 slot — the O(1) placement read |
| TAG | (2): cardinality-N substrate — also the permissionless extension lane (§0) |
| MIRROR | (2): transport-typed, length-bounded retrieval index — the serving path's string-free dispatch |
| LIST_ENTRY | (2)+(3): gated membership + conditional irrevocability, legible from the kind |
| REDIRECT | (2): typed rename/supersession edges with per-kind follow policy — tag-core's rename primitive |

**Under duress, what I would cut and in what order** (each cut is a scope cut, not a merge — merging is what §6 rejects):
1. Nothing merges. If the freeze window forces shrinkage, cut **LIST + LIST_ENTRY together** (curated collections demote to a TAG-vocabulary convention: `TAG(def=listTagdef, target=member)` — losing dedup/cap/appendOnly enforcement, honestly documented as unenforced). This loses real, shipped v1 capability and the appendOnly class entirely; I do not recommend it, and §0's inversion (omission ≈ permanent) is the reason.
2. I would **never** cut below seven: TAGDEF, DATA, PROPERTY, PIN, TAG, MIRROR, REDIRECT. Cutting MIRROR makes retrieval a string convention (§6.3) — the product *is* retrieval. Cutting REDIRECT makes rename impossible over immutable ids. Cutting PROPERTY is §6.6. The FS/graph mission does not survive six.

**What would flip each REJECT** (pre-committed, so the next pass doesn't re-litigate blind):
- 6.1/6.2: nothing plausible; these are the tag-core flagged traps and the census confirms them.
- 6.3 (MIRROR): a design that keeps transport identity as a *typed word* and URI bounding *without* a mirror kind — none proposed survives ADR-0056.
- 6.5 (LIST_ENTRY): a slot-derivation design where occurrence discrimination is free for plain TAGs AND record kinds stay self-describing — the red team found none; if one appears, re-open.
- 6.6 (PROPERTY): the measured flip condition stated there.

---

## 12. Self-red-team (where my own rulings are weakest)

1. **MIRROR is my most marginal keep.** Its guards protect the read path, but per-author lens scoping means mirror state harms only its own author if wrong; a maximalist could argue URI bounding + transport typing are client concerns. I hold the REJECT on ADR-0056's reasoning (string dispatch on an Etched surface), but this is the adjudication most worth a second opinion.
2. **§5.2 (seq-collision ⇒ admit-both + lexicographic tie-break) is my invention** to reconcile arch-B's duplicity rule with the frozen "collisions are never duplicity" reservation. It is deterministic and convergence-safe on paper, untested anywhere. Must go to the envelope red-team as a named question.
3. **The REVOKE tombstone-first rules (§5.4)**, especially "void tombstone discarded on appendOnly pair-completion," are new spec surface with no v1 precedent (v1 never had out-of-order revocation). Golden vectors required; an ordering bug here breaks convergence silently.
4. **Name shadowing across kinds (§7 flag)** is unresolved — I kept kind-in-id (v1-consistent, collision-free) and deferred resolution precedence to a read-spec chapter. If the app-suite pass shows shadowing confuses real URLs badly, the alternative (uniqueness across kinds per parent) is a *derivation* change and must be decided before freeze, not after.
5. **Definitions narrowed to instantiated TAGDEFs (§4.5)** kills v1's address/schema/attestation-as-predicate looseness. I believe the vocab-TAGDEF replacement is strictly better, but it has not been run against the ten-app suite; if real apps need un-registered predicates at write time, the OPAQUE-definition question re-opens.
6. **Kind-count symmetry with v1 (nine) should raise suspicion of anchoring.** I checked each kind against the criterion independently (§11 table), and the census (§1) shows no v1 guard surviving without a home — but a genuinely fresh design might partition differently (e.g., splitting MIRROR into transport-claim + locator-claim). I found no partition that beats the incumbent under the permanence prior.
7. **PROPERTY unknown-datatype passthrough (§4.3 PR2)** trades encoding validation for permissionless extension. A polluted foreign-tag space is contained by construction, but "contained" is an argument, not a test — vector it.
