# Tags-maximalist data model — the ultimate form, priced

**Role:** tags-maximalist architect. Directive (James): "tags are the only primitive really… can we get rid of other records? more efficient writes? ultimate form."
**Method:** read every resolver contract line-by-line (EFSIndexer, EdgeResolver, MirrorResolver, ListResolver, ListEntryResolver, AliasResolver), extracted what each *quietly* enforces, then attempted every collapse — including the two flagged traps — and kept only what survived my own red team.
**Baseline for comparison:** "conservative v2" = the 9 v1 kinds ported onto the native kernel (TAGDEF, DATA, PROPERTY, MIRROR, PIN, TAG, LIST, LIST_ENTRY, REDIRECT) with the deterministic-ids Codex and the §5 virtual reserved-key carve-out already applied.
**Headline result:** 9 record kinds → **5** (TAGDEF, DATA, LIST, PIN, TAG + the REVOKE op). PROPERTY, MIRROR, REDIRECT, LIST_ENTRY are deleted *entirely* as record kinds — none is "still available the old way." Both flagged traps **hold**, one on new grounds. Nothing fatal to the settled direction was found.

---

## 0. The cost-model shift that reframes the whole question

Under EAS, a record kind was expensive: a frozen schema UID (hashing a resolver proxy address), a resolver contract, a proxy/burn ceremony, a freeze-table row, a per-chain conformance surface. Minimizing kinds minimized Etched risk.

Under the native kernel, a record kind is a `kindTag` constant + a validation branch + a Codex section. The envelope already collapsed the *UX* cost of extra records (one `eth_signTypedData_v4` covers the whole DAG; one tx; anyone submits). So **record-kind count is no longer the scarce resource.** The scarce resources are now, in order:

1. **Body-shape count** — each canonical encoding is a `NonCanonicalPayload`-class bug surface (the round-trip re-encode discipline in EFSIndexer.sol:385, MirrorResolver.sol:176, EdgeResolver.sol:320/324).
2. **Index/storage-shape count** — the truly Etched surface (append-only, ADR-0009).
3. **Ways-to-say-the-same-thing count** — every dual representation is a split-brain/equivocation surface (deterministic-ids §7's refUID lesson; the forSchema imitation lesson).
4. Records-per-flow (gas, second-order: indices dominate per-record cost per the coupling audit §3.5).

This yields the one collapse principle everything below obeys:

> **Collapse a kind only if the donor kind can be deleted entirely.** If any standalone use of the kind survives, keeping the kind AND adding an inline/edge-borne variant creates two legal spellings of one fact — worse than either alone. One fact, one spelling.

That principle accepts four collapses and refuses four others.

---

## 1. Enforcement audit — what each resolver quietly enforces (verified, file:line)

| Kind | Quiet enforcement (beyond "store it") | Where |
|---|---|---|
| **ANCHOR** (→TAGDEF) | non-revocable + non-expiring (path permanence); canonical payload round-trip (one encoding per (name,kind)); canonical-name byte profile — nonempty, no `.`/`..`, reserved-byte set must be `%XX` uppercase, escapes only for bytes that *must* be escaped (one spelling per byte); parent existence + root bootstrap; per-(parent,name,kind) uniqueness; MAX_ANCHOR_DEPTH=32; maintains `_parents`/`_children`/type cache | EFSIndexer.sol:376–461, 958–1022 |
| **DATA** | refUID=0, non-revocable, non-expiring, **empty payload rejected if non-empty** (canonical-emptiness); v2: owned id = H(author,salt), salt≠0, entropy rule; duplicate policy: byte-identical ⇒ idempotent no-op (post-carrier §3.4) | EFSIndexer.sol:463–479; deterministic-ids §1,§6 |
| **PROPERTY** | refUID=0, non-revocable, non-expiring, canonical round-trip of the value; interned identity (valueHash event = dedup key); *un*owned Schelling object, idempotent dup | EFSIndexer.sol:480–504 |
| **MIRROR** | target must be DATA; revocable-required, no expiry; canonical round-trip; URI nonempty + ≤8192; transportDefinition must be an ANCHOR *and* a `/transports` descendant (walk, depth ≤8); NO scheme allowlist (ADR-0056); cardinality-N, **no slot** (revocation handle = UID only) | MirrorResolver.sol:150–196, 216–226 |
| **PIN** | exact 32-byte payload; revocable-required, no expiry; definition ≠ 0 and must be address\|schema\|attestation; target = refUID or recipient; **cardinality-1 slot** `(def, attester, targetSchema)` with O(1) supersession (prior edge fully unwound: `_activeEdge` delete, counts decremented); stale revoke of a superseded PIN = no-op; `propagateContains`/`clearContains` visibility bookkeeping gated on structural targets | EdgeResolver.sol:309–433, 531–571, 435–514 |
| **TAG** | exact 64-byte payload; same def/target validation; **cardinality-N** per-(def,attester,targetSchema) list with per-(attester,target,def) edgeHash identity; re-attest same edge = in-place UID+weight update (supersession without churn); revoke = swap-and-pop; int256 weight kernel-neutral | EdgeResolver.sol:309–433, 580–675 |
| **LIST** | exact 160-byte payload; non-revocable, no expiry, free-floating, undirected; targetType ≤ 2; SCHEMA mode ⇔ targetSchema ≠ 0; **anti-unbounded rule**: appendOnly+allowsDuplicates ⇒ maxEntries cap; stateless (all state in LIST_ENTRY resolver) | ListResolver.sol:61–93 |
| **LIST_ENTRY** | exact 64-byte payload; revocable-required, no expiry, refUID=0; listUID must be a LIST (decl hydrated+cached forever); per-mode encoding (ADDR/SCHEMA/ANY) + identityKey; dup-gate REVERT per (list, identityKey, attester) when !allowsDuplicates; maxEntries cap per attester; **appendOnly ⇒ revoke REVERTs**; wide EntryRecord[] (identityKey inline) for O(N) iteration without per-entry fetch; `_listAttesters` lens enumeration | ListEntryResolver.sol:209–320 |
| **REDIRECT** | exact 64-byte payload; revocable-required, no expiry; target ≠ 0; target ≠ source (self-loop); per-kind endpoint typing (sameAs/supersededBy: DATA↔DATA; symlink: ANCHOR→ANCHOR\|DATA); kind ≥ 3 recorded untyped; cardinality-N, no slot; **read-time resolution (multi-hop, cycles, SCC tie-break) is deliberately NOT on-chain** | AliasResolver.sol:161–209 |

Cross-cutting quiet enforcement that must survive *any* reshuffle: reject `expirationTime ≠ 0` everywhere (EFS filters on revocation, never expiry — PR#24 P2 class); reject revocability mismatches; foreign-schema guards (die naturally with EAS); canonical round-trip on every dynamic payload.

---

## 2. The four collapses (accepted)

### C4 first — value-carrying edges (PROPERTY deleted as a record kind)

**Mechanism.** Kill the PROPERTY *record*. An edge whose declared `targetKind == KIND_PROPERTY` carries the value **inline**: body tail = `(bytes32 datatypeTag, bytes valueBytes)` instead of `bytes32 targetId`. The kernel, on admission: validates canonical encoding, derives `propertyId = keccak256(abi.encode(DOMAIN_PROPERTY, datatypeTag, keccak256(valueBytes)))` (formula **unchanged**, ported byte-exact), **auto-interns** it in the registry (first-writer, idempotent — §6 shared-kind policy applies to the side effect), and indexes the edge against the derived propertyId as its target.

**Why this is legal under the Codex rules.** "IDs never appear in payloads as self-description" (§1) — deriving the target from carried preimage bytes is the *preferred* direction, the same recompute-and-compare move as the §5 virtual-anchor carve-out. PROPERTY's preimage is total (datatype + bytes = the whole object), so auto-intern is complete — nothing about the object exists outside the edge that mints it.

**One spelling rule (closes the equivocation hole I found in my own design).** REF-edges targeting `KIND_PROPERTY` are **forbidden**. A value may only ever be bound by a VAL-edge. Otherwise the same slot could hold `REF→P` and `VAL deriving P` — two representations of one claim, the §7 split-brain reborn. `targetKind == KIND_PROPERTY ⟺ VAL body layout`, enforced.

**What dies, honestly:**
- *Standalone bindingless PROPERTY publication.* No known consumer (a value with no binding is unreachable litter; the `valueHash` dedup-discovery flow becomes moot because auto-intern is idempotent — the SDK never needs to check existence before writing).
- *Uncapped values.* Replaced by a **uniform `MAX_VALUE_BYTES = 8192`** on VAL tails. This is a strict *improvement*: v1 PROPERTY had **no length cap at all** (verified — EFSIndexer.sol:480–504 checks canonicality only), an OOG footgun on every property-reading view.
- Nothing else. Non-revocability of the interned value: intact (the registry entry is permanent; revoking the edge removes the *binding*, ADR-0052 semantics preserved). Typed literals vs string-only: orthogonal — the `datatypeTag` word is already in the frozen propertyId formula; if James rules string-only, `DATATYPE_STRING` becomes the only legal tag (one `require`), the wire format doesn't move.

**What's gained:** −1 record per property binding, always (no "mint if not yet interned" branch — **write plans get a fixed record count**, a real SDK simplification); no mint-before-bind intra-batch ordering dependency (one whole ordering group deleted from the §5 parents-first rule); claims become **self-contained portable units** — a cherry-picked copied VAL-edge carries its value; the conservative form risks a copied PIN dangling on an un-copied PROPERTY record (the record-format ledger's "publish self-contained units" app-level fix becomes structural).

### C2 — MIRROR → reserved-key VAL-TAG (MIRROR deleted)

**Mechanism.** A mirror is a cardinality-N binding of a URI value to a DATA. That is exactly: `TAG(definitionId = tagId(parent=dataId, name="mirrors", KIND_PROPERTY), VAL tail = (DATATYPE_STRING, uriBytes), weight = client priority hint)`, using the §5 virtual reserved-key recompute (`defParentId = dataId`, `defKeyHash = keccak("mirrors")`; the carve-out already contemplates TAG-bound reserved keys — `keyWrap` was excluded from PIN for exactly this reason). Composed with C4, a mirror is **one record**, same as today.

**What dies, honestly (the open fork's named costs):**
- *Transport-ancestry write gate* (MirrorResolver.sol:182–188, 216–226): the on-chain check that the transport tag is a `/transports` descendant. Re-homed as: transport = URI scheme, classified by the router/client (which already string-parses the URI to serve it); `/transports/*` survives as documentation TAGDEFs (discovery, priority conventions), no longer write-gating. Genuine loss = write-time typo-catching of a nonsense transport, and the `MirrorSet(transportDefinition indexed)` log key — replaced by the reserved-key definitionId topic (per-file) + scheme filtering off log data. Also deletes a *named exception*: the MIRROR ancestry walk was one of only two exceptions to the §5 registry-read-only existence rule. The exception list shrinks to one (the virtual carve-out itself).
- *MAX_URI_LENGTH = 8192* — re-homed identically as `MAX_VALUE_BYTES = 8192` (same number, wider coverage). `data:`-inline 4KB files: base64 ≈ 5.5KB + header < 8192 ✓. No regression.
- *`dataId` must be DATA* — **survives** via the carve-out rule (defParentId must be registry-instantiated with kind DATA), unchanged.

**What's gained (this is the part the fork analysis under-priced):** MIRROR was **slot-less** — the coupling audit's open question #1 ("claim-handle design for slot-less claims: MIRROR/REDIRECT") exists *because* of it. As a TAG it gets the frozen slot machinery free: slot = `(definitionId, targetId=urlPropertyId)` ⇒ deterministic revocation handle, re-attest-same-URI = idempotent in-place update, and slot-bound metadata (region, freshness annotations) becomes possible. Lens-scoping is preserved by construction (the active set is per-attester, EdgeResolver shape). ADR-0015 cardinality-N is preserved (different URIs = different targets = coexisting slots). **The open question dies rather than getting answered.**

### C3 — REDIRECT → reserved-key edges (REDIRECT deleted; the uint16 taxonomy retired)

**Mechanism.** A redirect is an edge from a source object to a target object under a named relation. The uint16 `kind` becomes a **reserved key name**; the source becomes `defParentId`. Cardinality is declared per key — an *improvement* the uint16 couldn't express:

| v1 kind | becomes | role | endpoint typing (re-homed) |
|---|---|---|---|
| 0 sameAs | key `sameAs` under a DATA | **TAG** (card-N — dedup graphs are many-to-many) | parent kind DATA; target kind DATA; target ≠ parent |
| 1 supersededBy | key `supersededBy` under a DATA | **PIN** (one successor per lens; re-pin to correct) | DATA→DATA; ≠ parent |
| 2 symlink | key `symlink` under a TAGDEF | **PIN** (a path points one place per lens — v1's multi-symlink-per-source ambiguity, which the router had to resolve arbitrarily, is *deleted*) | parent TAGDEF; target TAGDEF\|DATA |
| 3 relatedVersion | key `relatedVersion` under a DATA | TAG (never auto-followed, per ADR-0050/0055) | DATA→DATA |
| 4 movedTo (v2 addition) | key `movedTo` under a TAGDEF | PIN | TAGDEF→TAGDEF |

**What dies, honestly:**
- *Kind typing as resolver code* — re-homed to the reserved-key table (same checks, one shared enforcement engine; AliasResolver.sol:181–192's logic becomes four table rows). LoC conserved, address changed; the table is frozen Codex surface (see §6 failure modes).
- *The open uint16 tail* (kind ≥ 3 recorded-untyped) — replaced by something strictly more permissionless: **any user-minted key TAGDEF is already an untyped pointer edge**. Only *auto-followed* relations need reservation, because routers act on them. The taxonomy governance problem ("kind 3 is taken", ADR-0055 §3) becomes name-registration under `/vocab/`, the mechanism EFS already has.
- *Cycle rules* — nothing dies: multi-hop resolution, SCC lowest-id tie-break, depth caps were **never on-chain** (AliasResolver NatSpec, verified); the read-time spec re-keys on slot reads at reserved keys instead of schema enumeration. The self-loop guard (`target != source`) re-homes as `target != defParentId` in the reserved-row check.

**Gained:** slot handles for the card-1 kinds (supersession replaces revoke+re-attest for "I picked the wrong canonical"); redirect claims join the uniform edge indices; −210 LoC module.

### C1 — LIST_ENTRY → TAG with `definitionId = listId` (LIST_ENTRY deleted; LIST kept)

**Mechanism.** A list membership is a cardinality-N edge under the list's identity: `TAG(definitionId = listId, targetId = member, targetKind per the list's declared mode, weight = order hint)`. The edge module, on seeing a definitionId that is a registered LIST object, applies the declaration's constraints (decl read is one warm kernel-internal SLOAD; the v1 cache pattern ports).

**The decisive evidence this is the right cut:** the frozen slot table already contains it. `CLAIMROLE_LIST_ENTRY` slot keys are `(listId, identityKey)` and v2 already ruled `identityKey = target` in all modes — which is *word-for-word* the `CLAIMROLE_TAG` slot `(definitionId, targetId)` with definitionId = listId. The slot table row is a duplicate; deleting the kind deletes the duplication. Slot math ports exactly; slot-bound order/label metadata (ADR-0046) binds to the identical slotId before and after.

**Constraint-by-constraint (what dies / survives):**
- **maxEntries** — survives: per-(listId, attester) counter in the edge module, incremented on new-slot admission only (in-place updates don't count). Already declared *chain-local admission state* by the carrier work — unchanged.
- **appendOnly** — survives: the module rejects `REVOKE` of any edge whose definition is an appendOnly list (ListEntryResolver.sol:303's check, relocated). Weight updates remain allowed (v1 allowed order-property supersession on appendOnly lists; membership is what's append-only).
- **dup gating** — *transforms, deliberately*: v1's `DuplicateIdentity` REVERT becomes TAG's in-place idempotent update (same (def,target) slot). This is not a loss — it is the **same move §3.4 already made for owned-kind duplicates**: REVERTs on re-submission are hostile to permissionless carriage/LOCKSS replay; idempotent no-ops are the replication-coherent semantics. A duplicate add is now a harmless re-assertion, and replaying a member's edges onto another chain converges instead of reverting.
- **allowsDuplicates** — **dropped as a protocol flag** (the one honest casualty). TAG identity is (attester, def, target); true duplicate members can't exist. The *capability* survives via the recipe v1 ANY-mode already implies: opaque member keys `target = H(member, occurrence)` — app-level occurrence discrimination with per-occurrence slots and metadata. This also kills ADR-0046's duplicate-list metadata-merge problem (deterministic-ids' open "occurrence-discriminator word vs entry-UID binding" question) — **the open question dies**. It also deletes ListResolver's anti-unbounded special case (appendOnly+allowsDuplicates⇒cap), since the combination no longer exists. If Phase-0 rules true protocol-level duplicates must-have: an additive claim role with a 3-word slot is reservable; do not build it.
- **per-mode encoding** (ADDR/SCHEMA/ANY) — subsumed by the v2 `targetKind` closed set (TARGETKIND_ADDRESS / object-kind / TARGETKIND_OPAQUE), which the edge machinery already validates. LIST's `targetType/targetSchema` pair collapses to a single declared `targetKind`. Foreign-EAS-attestation lists die with EAS (already the expected answer).
- **wide EntryRecord[] iteration** — survives at no extra cost: the kernel's active-set/slot storage already carries `target` inline (arch-B `getSlot` returns target; the enumeration arrays store `(target, weight, claimRef)`), so member enumeration needs no per-entry record fetch. This *fixes* an existing v1 wart: EdgeResolver's `getActiveTargetsByAttesterAndSchema` does an external `eas.getAttestation` per entry today (EdgeResolver.sol:917) — the N+1 pattern ADR-0046 built EntryRecord[] to avoid now disappears for *all* tags, not just list entries.
- **`_listAttesters` lens enumeration** — generic per-definition attester enumeration in the edge indices (needed for lens discovery on any predicate anyway).

**Gained:** the flagship write-count win — add-entry-with-order drops 3 records → 1 (weight carries order); entries get in-place reorder via weight update (v1 needed a PROPERTY supersession); −374 LoC module; one storage shape (EntryRecord[]) deleted.

**LIST itself is kept** (see refusals R4) — the declaration must be owned, non-revocable, and write-time-readable; nothing edge-shaped can carry immutable third-party-enforceable constraints.

---

## 3. The refusals (attempted, broken, documented)

### R1 — DATA-as-tag: the owned/unowned trap, confronted head-on

The attempt: `dataId` as a tagId with `parent = authorWord, name = salt, kind = KIND_DATA` — structurally `H(DOMAIN, author-ish, salt-ish, kind)`, nearly isomorphic to `H(DOMAIN_DATA, author, salt)`.

**Finding that must be recorded:** the trap's *stated* rationale ("opposite duplicate policies — DATA REVERTs, tags no-op") is **obsolete under the native kernel**. Post-carrier, DATA's v2 body is the salt alone, and the id covers author+salt — so any same-id duplicate is byte-identical by construction, and §3.4 makes it an idempotent no-op. DATA's duplicate policy has *converged* with the shared-kind policy. (LIST has not: its body carries constraint fields outside the id preimage, so same-id-different-body equivocation is real there.)

**Why the refusal stands anyway, on two better grounds:**
1. **Ownership enforcement is a per-kind admission rule, not a derivation.** What keeps DATA unsquattable under the kernel is `derivation input = recovered author` — Bob's envelope physically cannot mint an id under Alice's word. Merging the *record shape* with TAGDEF would force that rule to live as a branch inside the name-node validator ("if kind==DATA, parent MUST equal recovered author, name is a salt not a canonical name, entropy rule applies, no walk-enumeration semantics…") — every TAGDEF property (canonical-name profile, parent-instantiation, Schelling naming, walkability) inverts for the DATA branch. A "merge" where every rule branches is two kinds wearing one tag — worse legibility for zero mechanical gain.
2. **Port-don't-re-derive.** `DOMAIN_DATA` and the (author, salt) formula are frozen v1 math with golden vectors; the tagId form hashes `keccak(name)` and adds a kind word — byte-different. Re-deriving the owned-ID formula to save a kindTag violates the explicit porting mandate and re-opens the exact external-review surface the Codex discipline exists to close.

**Trap disposition: HOLDS — but the handoff's rationale should be updated** from "opposite duplicate policies" to "ownership admission rule + derivation-formula separation." (Also note: under an envelope kernel, "merging record kinds" is nearly meaningless — the kindTag word remains either way; only body shapes and validators could merge, and they shouldn't.)

### R2 — PIN + TAG merge: the cardinality trap, attacked three ways

1. *Cardinality as a per-edge field:* slot identity becomes data-dependent → the same logical placement can be asserted card-1 by one write and card-N by another → **two active claims at one logical slot**, the §7 equivocation class verbatim. Dead on arrival.
2. *Cardinality declared on the definition* (the variant the trap didn't consider — one edge kind, predicate declares its arity like LIST declares constraints): fails on three facts. (a) The frozen slot table bakes the role into slotId (`CLAIMROLE_PIN` keys `(definitionId, targetKind)`; `CLAIMROLE_TAG` keys `(definitionId, targetId)`) — arity is *inside the slot derivation*; moving it to the definition re-derives frozen math. (b) Definitions are not all registerable objects: folder-visibility TAG definitions are spec vocabulary constants, virtual reserved keys are deliberately *uninstantiated* — there is nowhere to hang the declaration without forcing a registration write onto first use of every predicate. (c) It adds a registry read on the hottest path to save nothing — the kindTag word is already in the record.
3. *One kind, role inferred from body length* (PIN=no-weight, TAG=weight): inference-not-declaration, the exact anti-pattern the declared-targetKind decision rejected (hook-time inference makes slot keys time/state-dependent).

**Trap disposition: HOLDS, with a sharper statement for the Codex:** *cardinality is part of slot identity; slots are the supersession unit; anything that makes slot identity depend on data or state manufactures dual active claims.* PIN and TAG remain two claim roles — they already share one module (EdgeResolver is one contract today; the kernel edge module stays one), so there is no LoC to win, only invariants to lose. (Optional cosmetic: rename PIN/TAG → SET/ADD in the Codex; the constants' preimages are pre-freeze-renameable. Zero mechanical content.)

### R3 — TAGDEF folded into the placing edge (inline path segments)

The auto-intern trick (C4) tempts a symmetric move: let the placing edge carry `(parentId, name, kind)` preimages and auto-mint TAGDEFs — mkdir-and-place in one record. Refused by the collapse principle: TAGDEF **cannot be deleted entirely** (standalone mkdir, blinded-variant records, redirect-target keys, curated namespaces need it), so the inline variant would be a *second spelling* of folder creation — duplicated validation on the hottest path, two encodings of one fact, the imitation-risk surface the derivation rules exist to prevent. The purchase would be ~1 record (≈50–90k gas, ~1% of a file write) in the one flow that creates new path segments; the envelope already made those records ride one signature. Bad trade. (The same logic keeps DATA's salt out of edge bodies: DATA is 1 one-word record; auto-minting it from a first-touch edge saves nothing measurable and forks the body.)

### R4 — LIST dissolved (into DATA+properties, or into constrained TAGDEFs)

- *Constraints as properties on a DATA:* properties are revocable/supersedable lens claims — a mutable constraint is not a constraint (appendOnly could be switched off after the fact; third parties who trusted the declaration are betrayed). Write-time-enforceable rules must be non-revocable declaration body.
- *Named lists as TAGDEFs with constraint tails:* TAGDEFs are unowned Schelling objects — anyone could pre-mint "reading-list" under your container with hostile constraints (registration is permissionless; namespace ownership ≠ node ownership). Lists must be owned (salt-derived).
- *LIST merged into DATA's record shape* (owned + optional constraint tail): body-shape inference (empty tail = file?) violates declaration-over-inference; duplicate policies genuinely differ (LIST has real equivocation surface, DATA does not); DOMAIN_DATA/DOMAIN_LIST separation is frozen math preventing cross-kind id collisions at equal (author,salt).

**LIST stays**: the only node kind whose *reason to exist* is carrying immutable machine-checked promises about future writes. Its body slims (targetType/targetSchema → one `targetKind`; `allowsDuplicates` deleted per C1): `(bytes32 salt, bool appendOnly, bytes32 targetKind, uint256 maxEntries)`.

---

## 4. The ultimate form — 5 record kinds, byte-exact sketch

**Node records** (objects; non-revocable; `op = ASSERT`):

| kindTag | body (canonical `abi.encode`, dynamic pre-hashed only inside derivations) | id | duplicate policy |
|---|---|---|---|
| `efs.rec.tagdef.v1` | `(bytes32 parentId, string name, bytes32 nodeKind)` — nodeKind ∈ {GENERIC, DATA-anchor, PROPERTY-key, LIST-anchor} | tagId = H(DOMAIN_ANCHOR, parentId, keccak(name), nodeKind) — **unchanged** | unowned; idempotent no-op |
| `efs.rec.data.v1` | `(bytes32 salt)` | H(DOMAIN_DATA, author, salt) — **unchanged** | owned; byte-identical ⇒ no-op |
| `efs.rec.list.v1` | `(bytes32 salt, bool appendOnly, bytes32 targetKind, uint256 maxEntries)` | H(DOMAIN_LIST, author, salt) — **unchanged** | owned; same-id-different-body = equivocation evidence |

**Edge records** (claims; revocable via REVOKE op; author = envelope-recovered signer):

| kindTag | REF body | VAL body (`targetKind == KIND_PROPERTY` ⟺ VAL; REF-to-property forbidden) |
|---|---|---|
| `efs.claimrole.pin.v1` (SET, card-1) | `(bytes32 definitionId, bytes32 targetKind, bytes32 targetId, bytes32 defParentId, bytes32 defKeyHash)` | `(bytes32 definitionId, bytes32 targetKind, bytes32 defParentId, bytes32 defKeyHash, bytes32 datatypeTag, bytes value)` |
| `efs.claimrole.tag.v1` (ADD, card-N) | REF + `int256 weight` | VAL + `int256 weight` |

Kernel admission for VAL tails: canonical round-trip; `value.length ∈ (0, MAX_VALUE_BYTES=8192]` (per-reserved-key non-empty rules); derive propertyId; auto-intern (registry, first-writer, exactly-once event); index edge against derived id.

**Ops:** `ASSERT`, `REVOKE(claimId)` (+ reserved CHECKPOINT and identity/KEL kinds per the substrate reservations — untouched here).

**PROPERTY survives as a registry *object kind*** (interned, referenceable, derivable offline from bytes alone) but not as a record kind.

**Frozen slot table after the collapse** (one row deleted, zero rows changed):

| claimRoleTag | slotKeyWord1 | slotKeyWord2 |
|---|---|---|
| CLAIMROLE_PIN | definitionId | targetKind |
| CLAIMROLE_TAG | definitionId | targetId (derived propertyId for VAL) |
| ~~CLAIMROLE_LIST_ENTRY~~ | — | — (served exactly by the TAG row with definitionId = listId) |

**The reserved-key table** (the re-homed enforcement — new frozen Codex section, one shared engine, golden vectors per row):

| key (defKeyHash preimage) | parent kind | role | binding | validation |
|---|---|---|---|---|
| contentType | DATA | PIN | VAL string | ≤ cap |
| name | DATA | PIN | VAL string | ≤ cap |
| contentHash | DATA | PIN | VAL string (multibase-multihash) | ≤ cap |
| size | DATA | PIN | VAL (string or uint256 per datatype ruling) | ≤ cap |
| contentEncryption | DATA | PIN | VAL string | ≤ cap |
| keyWrap | DATA | TAG | VAL bytes | ≤ cap |
| **mirrors** | DATA | TAG | VAL string (URI) | nonempty, ≤ cap; transport = scheme (client) |
| **sameAs** | DATA | TAG | REF → DATA | target ≠ parent |
| **supersededBy** | DATA | PIN | REF → DATA | target ≠ parent |
| **relatedVersion** | DATA | TAG | REF → DATA | never auto-followed |
| **symlink** | TAGDEF | PIN | REF → TAGDEF\|DATA | target ≠ parent |
| **movedTo** | TAGDEF | PIN | REF → TAGDEF | target ≠ parent |

Non-reserved keys: instantiated key-TAGDEFs, permissionless, untyped — the open extension surface (replaces both "new schema" and "kind ≥ 3").

**Parents-first ordering shrinks** to `[DATA] [LIST] [TAGDEF ancestors-first] [PIN] [TAG] [REVOKE]` — the PROPERTY, MIRROR, LIST_ENTRY, REDIRECT groups are gone; VAL-edges have no mint dependency by construction.

---

## 5. Write counts and gas — canonical flows, priced

Records per flow ("cons." = conservative 9-kind v2-native with virtual anchors; both columns ride one envelope = one signature = one tx; gas figures are order-of-magnitude from the coupling-audit per-record model — ~50–90k per dropped record (store + leaf + event; validation/index costs mostly conserved) — **unmeasured**, per the handoff's standing gas-reality caveat):

| Flow | v1 (EAS today) | cons. v2 | tags-max | Δ records | Δ gas (flow-local) |
|---|---|---|---|---|---|
| Publish 4KB `data:` file, 3 props (contentType/contentHash/size), 1 mirror, place at existing folder | ~10–12 att. | 8–10 (DATA, TAGDEF, PIN-place, MIRROR, 3×PIN, +1–3 PROPERTY mints, count varies with intern state) | **7, always** (DATA, TAGDEF, PIN-place, VAL-TAG mirror, 3×VAL-PIN) | −1 to −3 (−12–30%) | ~−100–250k of ~9M (−1–3%) |
| Set/change one property | 3 | 2 (mint+PIN, worst) | **1** | −50% | ~−60–90k of ~150–250k (≈−30%) |
| Tag a file (label = key TAGDEF) | 1 | 1 | 1 | 0 | 0 |
| Make folder (per new segment) | 1 | 1 | 1 | 0 | 0 |
| Add list entry with order | 3 (ENTRY + order PROP + PIN) | 2–3 | **1** (weight = order) | −67% | ~−150–250k of ~300–500k (≈−40%) |
| Reorder a list entry | 2 (new PROP + re-PIN) | 1–2 | **1** (weight update, in-place) | — | — |
| Add mirror to existing file | 1 | 1 | 1 (VAL tail ≈ +3 words ≈ +1.6k calldata) | 0 | ≈ +1.6k; buys a slot handle |
| Redirect (sameAs / symlink / movedTo) | 1 | 1 | 1 | 0 | 0 |
| Revoke any claim | 1 | 1 | 1 | 0 | 0 |

**Honest summary of "more efficient writes?":** record counts drop 12–67% per flow and become *deterministic* (no intern-existence branching in write plans), but whole-write gas improves only ~1–5% because indices dominate per-record cost — the envelope, not this collapse, was the big UX/write win. The real purchases are: **4 fewer record kinds, 3 fewer body-encoding surfaces, 1 fewer storage shape (EntryRecord[]), 1 fewer ordering group, net ≈ −500–600 LoC of Etched validation** (MirrorResolver 228 + AliasResolver 210 + ListEntryResolver 374 + PROPERTY branch ~40 deleted; ~150–250 added for VAL tails + reserved-key table + list-constraint checks), and **three open questions deleted rather than answered** (slot-less claim handles; duplicate-list metadata discriminator; foreign-EAS lists), plus self-contained portable claims (cherry-picked copies can't dangle on un-copied PROPERTY records).

---

## 6. Failure-mode ledger (my own design, red-teamed)

1. **The reserved-key table is a mini-schema-registry reborn.** ~12 rows re-centralize what 4 deleted kinds enforced. Named risk: a table row gets less review attention than a contract; a wrong row is Etched. Mitigations required: golden vectors per row (freeze-blocking, joins §13 gates); the table is a numbered Codex chapter; rows share ONE enforcement engine so a row bug can't corrupt slot math.
2. **VAL/REF layout fork under one kindTag** — a new canonicality surface on the hottest path. A validator bug mints wrong propertyIds forever. Mitigations: `targetKind == KIND_PROPERTY ⟺ VAL` is a single branch; round-trip re-encode discipline; Solidity↔TS differential fuzz on the VAL tail specifically; the REF-to-property prohibition closes the dual-spelling hole.
3. **Transport gate loss** (C2): garbage URIs land unchecked (v1 never validated URI syntax either — only the transport-anchor link; the loss is the typo-catch, not a safety property; ADR-0056 already ruled scheme safety client-side). Accepted, documented.
4. **allowsDuplicates removal** (C1): if a real app needs protocol-level duplicate members with per-occurrence metadata and rejects the opaque-key recipe, this flips — reserve an additive 3-word-slot claim role, don't build it.
5. **Dup-gate semantics change** (REVERT → idempotent update): any client relying on `DuplicateIdentity` as a feature ("tell me if already a member") loses the signal; it's one read (`getSlot`) instead. Replication-coherence gain outweighs; documented as a behavior change, not a bug.
6. **In-flow list-constraint reads**: every list-edge admission reads the LIST declaration (warm SLOAD, ~2.1k) — negligible; noted for the gas snapshot.
7. **Weight semantics overload** (order for lists, priority for mirrors, score for labels): kernel stays weight-neutral (ADR-0041 §4 ports verbatim); per-key weight *conventions* live in the Codex read-path chapter. No kernel interpretation, ever.
8. **KIND_PROPERTY naming skew**: reserved keys with REF bindings (sameAs, symlink…) derive their key tagIds with the KIND_PROPERTY word even though they bind objects. Cosmetic wart; pre-freeze option to rename the preimage to `efs.kind.key.v1` (one constant, before vectors freeze) — flag for Phase-0, zero mechanical content either way.
9. **Kind-level selectivity for indexers**: v1's "schema UID tells a subgraph the shape with zero decoding" becomes "(kindTag, definitionId) tells it" — events already index definition first (PinSet/TagSet shape ports). Equivalent selectivity; subgraph filters change form. Verified against EdgeResolver's event design.
10. **What would flip each collapse** — C2: a contract consumer needing *on-chain typed* transport gating that scheme-prefix matching can't serve; C3: a redirect kind that must attach to non-object sources (none exists — kind≥3 untyped pointers are served by user keys); C4: a real consumer of bindingless value publication (none known) or a >8192-byte property value use-case (v1 MIRROR had the same cap; v1 PROPERTY's *lack* of cap was a bug not a feature); C1: flip condition in item 4.

---

## 7. What this forces upward (Phase-0 / Codex deltas)

1. Confirm the collapse principle as doctrine: *a kind is deleted entirely or not touched; no dual spellings.*
2. Reserved-key table = new frozen Codex chapter (replaces MIRROR/REDIRECT resolver-semantics chapters + the uint16 taxonomy + ADR-0050's kind registry); per-row golden vectors added to the §13 gate.
3. `MAX_VALUE_BYTES = 8192` kernel constant (replaces MAX_URI_LENGTH; **adds** the property-value cap v1 lacked).
4. LIST body slims to `(salt, appendOnly, targetKind, maxEntries)`; `allowsDuplicates` deleted; opaque-occurrence-key recipe documented; additive duplicate-role reserved.
5. Slot table: delete CLAIMROLE_LIST_ENTRY row (pre-freeze, no compat issue).
6. Update the handoff's trap #2 rationale (owned/unowned): duplicate-policy divergence is obsolete for DATA post-carrier; the trap survives on ownership-admission + formula-separation grounds (this doc §3.R1).
7. Trap #1 (PIN/TAG) gets the sharper Codex statement: *cardinality is part of slot identity* (§3.R2).
8. The string-only-vs-typed ruling is orthogonal but touches the VAL tail's datatypeTag legality set — decide before vectors.
9. Gas-snapshot CI baseline should include the five flows in §5 (the handoff's "measure, everyone's been assuming" item — these numbers are estimates until then).

**Verdict on the mission directive:** "tags are the only primitive" is true at the *identity* level (one tagId namespace for paths/folders/keys/labels) and now also at the *claim* level (every claim is a SET or ADD edge; mirrors, redirects, properties, list entries are all edges under keys) — but not at the *node* level: owned identities (DATA, LIST) and the unowned namespace (TAGDEF) are irreducibly different admission policies, and flattening them buys nothing the envelope hasn't already bought. **Ultimate form: two derivation families (named/unowned, owned/salted) + two edge roles (SET/ADD) + one value-intern side effect + one revoke op. Everything else is a table row.**
