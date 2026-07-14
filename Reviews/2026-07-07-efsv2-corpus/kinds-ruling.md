# EFS v2 record-kind RULING — reconciliation of the maximalist and conservative kind sets against the ten-app evidence

**Role:** Kind-set reconciler and judge. **Date:** 2026-07-07.
**Inputs judged:** `tags-maximalist.md` (5-kind proposal), `kind-set-conservative.md` (9-kind proposal), `app-grounding-consumer-apps.md` (apps 1–5: personal site, blog+comments, social feed, photo archive, collections/lens), `app-grounding-infra.md` (apps 6–10: NFT metadata, DAO docs, package registry, web archive, dapp records + the Microsoft-config portability walkthrough).
**Decision rule, applied without exception:** an elegance argument loses to an app-grounding argument every time. Where the two proposals attack different designs under one name (this happened twice), the ruling adjudicates the design actually proposed, not the strawman. Where the app evidence demands something neither proposal contains, the ruling adds it and says so.
**Standing caveats inherited:** all gas figures are unmeasured estimates (both app passes flag this); the gas benchmark gates two app verdicts but no adjudication below turns on a gas number alone.

---

## 1. THE RULING — final v2 kind set

**Five record kinds, two ops, one interned object class, one frozen reserved-key table.** The maximalist's structure wins four of four contested collapses — but in every case with a material amendment forced by the app evidence, and the conservative's enforcement census is adopted wholesale as the checklist of what must re-home (nothing in §1 of the conservative doc is allowed to die silently; every guard has a named new address in §3 below).

### 1.1 Record kinds (objects — non-revocable, `op = ASSERT`)

| kindTag | body (canonical) | id | ownership | duplicate policy |
|---|---|---|---|---|
| `efs.rec.tagdef.v1` | `(bytes32 parentId, string name, bytes32 nodeKind)` — dynamic; name profile v1-A4 verbatim | `H(DOMAIN_ANCHOR, parentId, keccak(name), nodeKind)` — unchanged | unowned (Schelling) | idempotent no-op |
| `efs.rec.data.v1` | `(bytes32 salt)` — 32B, salt ≠ 0 | `H(DOMAIN_DATA, author, salt)` — unchanged | owned | byte-identical by construction ⇒ idempotent no-op |
| `efs.rec.list.v1` | `(bytes32 salt, bool appendOnly, bytes32 targetKind, uint256 maxEntries)` — 128B; `targetKind = 0` means ANY; `allowsDuplicates` DELETED (§3.3) | `H(DOMAIN_LIST, author, salt)` — unchanged | owned | byte-identical ⇒ no-op; same-id-different-config ⇒ author-equivocation evidence (the only owned-kind equivocation surface) |

### 1.2 Claim kinds (revocable via REVOKE; author = envelope-recovered signer)

| kindTag | REF body | VAL body (`targetKind == KIND_PROPERTY ⟺ VAL layout`; REF-to-property forbidden) |
|---|---|---|
| `efs.claimrole.pin.v1` (card-1) | `(bytes32 definitionId, bytes32 targetKind, bytes32 targetId, bytes32 defParentId, bytes32 defKeyHash, uint64 expiresAt)` — 192B fixed | `(bytes32 definitionId, bytes32 targetKind, bytes32 defParentId, bytes32 defKeyHash, uint64 expiresAt, bytes32 datatypeTag, bytes value)` — dynamic |
| `efs.claimrole.tag.v1` (card-N) | REF + `int256 weight` — 224B fixed | VAL + `int256 weight` — dynamic |

`expiresAt` is the one field NEITHER proposal contained and the app evidence demands (§4.1). `uint64` seconds; `0` = no expiry; semantics are **stale-not-dead** (bounds currency, never validity — §4.1).

### 1.3 Ops

- `ASSERT` (carries one of the five kinds).
- `REVOKE(uint64 seq, uint32 idx)` — **coordinates, not a bare claimId** (conservative §5.4 adopted over the infra doc's assumed `(claimId)` body): the kernel recomputes `claimId = H(DOMAIN_CLAIM, envelopeAuthor, seq, idx)`, making cross-author revocation impossible by math rather than by check. Tombstone-first admission legal; effects per revocability class (§6).

### 1.4 PROPERTY survives as a registry **object class**, not a record kind

`propertyId = H(DOMAIN_PROPERTY, datatypeTag, keccak(valueBytes))` — formula ported byte-exact. Minted only as the auto-intern side effect of VAL-edge admission (§3.4). Permanent (class P), referenceable by id in reads, **not currently a legal edge target** (REF-to-property forbidden — one spelling per fact; flip condition in §8).

### 1.5 Reserved (formats + vectors frozen, machinery not built)

CHECKPOINT; KEYGRANT/KEL identity events (freeze its vectors against the DAO time-scoped-authorization case per infra F2.2); WHITEOUT; blinded-TAGDEF disclosure record; salted TAGDEF (`DOMAIN_ANCHOR_SALTED`) — **explicitly re-stated as surviving the tag-core port** (consumer apps 1 & 4 depend on it for privacy hygiene; the handoff's silence on it was flagged as a fall-out risk); additive **duplicate-member claim role** (3-word slot with occurrence word — the `allowsDuplicates` escape hatch, §3.3); additive **author-chosen list identityKey mode** (registry F3.5); additive **REF-to-property annotation role** (§3.4 flip); datatype-tag extension constants.

**Out, confirmed by app evidence:** SORT_INFO (overlay); foreign-EAS list mode (dies with EAS); ADR-0033 raw EAS-UID containers (dead); a dedicated COMMENT/REPLY kind (consumer §7: "would not fix either gap; don't add"); a kernel like/reaction kind (TAG slot algebra already exactly-once; consumer §3.1).

---

## 2. Adjudications of the contested collapses

Format per adjudication: **winner → the evidence that decided it → enforcement re-homing map → write-count consequence → residuals/flip condition.**

### 2.1 MIRROR — **COLLAPSED** (maximalist wins, with the infra-apps dual-role amendment)

**Ruling:** MIRROR is deleted as a record kind. A mirror is a VAL-edge under reserved key `mirrors` on the DATA (`defParentId = dataId`). **Amendment forced by app evidence:** the `mirrors` row is **dual-role** — `PIN` = the author's primary mirror (a derivable cardinality-1 slot ⇒ O(1) point read), `TAG` = additional mirrors (cardinality-N, weight = priority). Read rule (one Codex sentence): *the mirror set = PIN slot value ∪ active TAGs under the key; the PIN is the defined primary.*

**The evidence that decided it.**
- *Infra app 6 (NFT metadata), §2.3 — the decisive item:* the mirror hop is the ONE non-derivable hop in the entire on-chain consumer surface. Slot-less cardinality-N MIRROR makes `tokenURI` an enumeration ("a tokenURI that scans is a tokenURI that gets more expensive every time anyone adds a mirror" — F1.1). The infra pass names two fixes and says outright: "app evidence favors the property form" (demand #4). Under the collapse, the primary mirror is a pure point read: derive key-definitionId offline → `getSlot` → `getClaim` body carries the URI. This repairs the one break in the point-lookup audit (infra §7.1).
- *Consumer app 4 (photo archive), §7 sensitivity table — the objection, answered not overruled:* "mirrors are cardinality-N (multi-transport redundancy is the point — App 4 uses 2–3 per photo)… property binding is a cardinality-1 PIN slot; the collapse forces either one-mirror-per-file or TAG-bound multi-value properties (a new mechanism = no saving)." Two findings dissolve this: (a) the maximalist's actual design is TAG-bound — cardinality-N survives fully; (b) "a new mechanism = no saving" is false on the evidence, because TAG-role reserved keys are needed **independently of mirrors** — `keyWrap` was already excluded from the PIN carve-out for exactly cardinality-N reasons (deterministic-ids §5: "they use TAG or a future additive schema"), and `sameAs`/`relatedVersion` (§2.2) also require TAG rows. The mechanism is amortized across the table; MIRROR's deletion rides it for free. The consumer objection encoded a requirement (multi-mirror redundancy), and the requirement is satisfied.
- *The conservative's own concession:* §12.1 — "MIRROR is my most marginal keep… per-author lens scoping means mirror state harms only its own author if wrong." No app in ten needed the transport-ancestry write gate; two apps (6 and, transitively, every on-chain byte consumer) needed the derivable point read that MIRROR's slot-less shape denied. Grounding beats the marginal keep.
- *Open question deleted:* coupling-audit open question #1 (claim-handle design for slot-less claims) existed because of MIRROR; it dies rather than getting answered.

**Enforcement re-homing map** (conservative census §1.5, item by item):
| v1 guard | new home |
|---|---|
| M2 target-must-be-DATA | carve-out rule: `defParentId` must be registry-instantiated with kind DATA (unchanged mechanism) |
| M4 canonical round-trip | VAL-tail canonicality discipline (§3.4) |
| M5 URI nonempty ≤ 8192 | `mirrors` row validation: nonempty; `MAX_VALUE_BYTES = 8192` (same number, wider coverage; `data:` base64 of 4KB ≈ 5.5KB < 8192 ✓) |
| M6 transport-ancestry walk | **retired as a write gate** (the genuine loss): transport = URI scheme, classified by router/client (which already string-parses the URI to serve it — ADR-0056 already ruled scheme safety client-side); `/transports/*` survives as non-gating documentation TAGDEFs. The §5 registry-read-only exception list shrinks to one |
| MirrorSet(transportDefinition indexed) log key | per-file reserved-key definitionId topic + scheme filtering off log data |
| ADR-0015 cardinality-N / no-singleton | TAG role preserves it; PIN-primary is an *addition* (a defined primary is what app 6 demanded), not a restriction |

**Conservative's four named failures, disposed:** (1) *scheme-sniffing returns* — for off-chain routers only, which already parse URIs, and the mirror author is inside the reader's chosen lens (self-harm-only surface, per the conservative's own §12.1); on-chain consumers never parse: they read the primary PIN. (2) *transport-namespace collapse* — no app in ten used write-time transport typing; extension = new scheme + optional doc TAGDEF. (3) *singleton trap* — answered by the dual-role row. (4) *N+1 hydration in ranking* — enumeration of the active TAG set returns `(propertyId, weight, claimRef)`; rank by weight with zero value fetches; only the chosen candidate's URI is hydrated. Transport-filtered enumeration costs one registry read per candidate — off-chain router territory, bounded per-author.

**Write count:** add mirror = 1 record (unchanged); single-mirror file = 1 PIN (unchanged count, gains O(1) read + slot supersession handle — re-assert same URI = idempotent in-place update instead of claim churn). VAL tail ≈ +3 words ≈ +1.6k calldata vs v1 MIRROR — buys the slot.

**Residual/flip:** flips back if a *contract* consumer materializes needing on-chain **typed** transport gating that scheme-prefix classification cannot serve (none in ten apps). Related but orthogonal Codex obligations from infra #3: chain-relative `web3://<addr>` URIs = "this chain," + the frozen CREATE2 deterministic byte-store recipe — without these the collapse is fine but S3 (bytes don't travel) still kills large-media portability.

### 2.2 REDIRECT — **COLLAPSED** (maximalist wins; the conservative refuted a different design)

**Ruling:** REDIRECT is deleted as a record kind; the uint16 taxonomy is retired. The four-plus-one relations become reserved-key **REF-edges** with per-row endpoint typing:

| relation | row | role | typing |
|---|---|---|---|
| sameAs | key `sameAs` under DATA | TAG (card-N; dedup graphs are many-to-many) | REF→DATA, target ≠ parent |
| supersededBy | key `supersededBy` under DATA | PIN (one successor per author; correct-by-re-pin) | REF→DATA, target ≠ parent |
| symlink | key `symlink` under TAGDEF | PIN (one target per path per lens — v1's multi-symlink read ambiguity, which the router resolved arbitrarily, is deleted) | REF→TAGDEF\|DATA, target ≠ parent |
| relatedVersion | key `relatedVersion` under DATA | TAG | REF→DATA; **never auto-followed** |
| movedTo | key `movedTo` under TAGDEF | PIN | REF→TAGDEF, target ≠ parent |

**The evidence that decided it.**
- *The consumer pass evaluated only the string-property variant* (§7: "As a string property it loses on-chain existence checks and typed kinds… mild preference: keep [as a claim]"). Every property that made "keep" preferable — on-chain existence checks, typed endpoints, machine-checkable follow policy, the trustless "old links never rot" walk — **is preserved by the REF-edge form**: targets are existence-validated object ids (PI4), endpoint typing is a frozen table row, follow policy keys on `defKeyHash` (a literal word in the signed body — no string parsing anywhere). The consumer preference, properly read, endorses the collapse.
- *The conservative's Variant-A demolition (§6.4.1–3) is correct and irrelevant* — nobody proposed string redirects. Its Variant-B objection ("magic-key schema smuggling… meaning dispatches on which definition it references — state-dependent record semantics") is factually wrong for this design: `defKeyHash` and `defParentId` are **in the record body**, compared against a frozen table with zero state reads. The record is self-describing; an ERC-7730 wallet renders "supersededBy: old → new" from the signed bytes alone. The state-dependent-semantics failure class is real (it kills the LIST_ENTRY dispatch-on-`kindOf(definitionId)` worry, §2.3) but does not occur here.
- *App usage:* App 1's rename (movedTo) and Apps 2/7's version chains (supersededBy) are the only redirect consumers in ten apps; both are per-author cardinality-1 relations that **gain** a slot handle (re-target = supersession, not revoke+re-attest). No app used kind ≥ 3; the open-taxonomy governance problem ("kind 3 is taken," ADR-0055) is replaced by permissionless user-minted key TAGDEFs — strictly more permissionless, because only auto-followed relations need reservation.

**Enforcement re-homing:** per-kind endpoint typing → table rows (AliasResolver L181–194 becomes five rows on the shared engine); self-loop guard → `target != defParentId`; multi-hop/SCC/depth read rules were never on-chain (AliasResolver NatSpec) — the read-spec re-keys on slot reads at reserved keys; cross-chain-provenance-is-not-a-redirect (RE4) doctrine unchanged. −210 LoC module.

**Write count:** unchanged (1 record per redirect); rename ceremony stays 4 records, one envelope (consumer §1.2 — SDK verb obligation stands).

**Residual/flip:** flips if a redirect kind must attach to a non-object source (none exists — untyped pointers are served by user keys). Mitigation carried from the maximalist ledger: the follow-policy column of the reserved-key table is frozen Codex surface with per-row golden vectors — `relatedVersion: never-follow` is a vectored row, answering the conservative's trust-hijack concern structurally.

### 2.3 LIST / LIST_ENTRY — **LIST KEPT, LIST_ENTRY COLLAPSED into TAG** (maximalist wins the merge; conservative wins the declaration node; the registry app is the tiebreak for both)

**Ruling:** LIST stays an owned, non-revocable declaration object (§1.1) — the only node kind whose reason to exist is carrying immutable machine-checked promises about future writes. LIST_ENTRY is deleted: membership = `TAG(definitionId = listId, targetId = member, weight = order)`; the edge module applies the declaration's constraints when `definitionId` resolves to a LIST. `allowsDuplicates` is deleted from the protocol (reserved additive role instead).

**The evidence that decided it.**
- *For the merge — consumer §7 sensitivity table, verbatim:* "LIST_ENTRY → cardinality-N edge (already in baseline): **Confirmed good across Apps 4/5 — no app missed a distinct entry kind; order-on-slotId + weights covered every need.**" The flagship write win (add-entry-with-order 3 records → 1; reorder = in-place weight update) was exercised by the album and collection walks and held. Structurally, the frozen slot table already contained the merge: `CLAIMROLE_LIST_ENTRY` slot `(listId, identityKey=target)` is word-for-word the `CLAIMROLE_TAG` slot with `definitionId = listId` — the row was a duplicate.
- *For keeping LIST — infra app 8 (package registry), §4.2, verbatim:* "this app is the concrete evidence for keeping the LIST declaration node… fold LIST_ENTRY into a plain cardinality-N edge and appendOnly enforcement dies **with the declaration**." The appendOnly version ledger is layer 2 of the left-pad defense; it requires an owned, immutable, write-time-readable charter. Consumer App 5 adds: a lens subscription needs one stable owned object to subscribe to (a bare TAGDEF would collide lens lists with the path namespace). Both maximalist refusal R4 and conservative §6.7 agree, and the apps confirm: **LIST is irreducible.**
- *For deleting `allowsDuplicates`:* zero of ten apps used it. Albums: `false`. Collections/lenses: `false`. The registry ledger *looks* like the duplicate case but isn't — a version rewrite mints a **new dataId**, so the second ledger entry has a different target/slot and the ledger-vs-slot divergence stays machine-detectable (registry §4.2 layer 2 survives the merge intact); re-asserting the same dataId is the same fact, and idempotency is the correct semantics. The maximalist's opaque-occurrence-key recipe (`target = H(member, occurrence)`) covers the residual; the additive 3-word-slot role is reserved, not built. Bonus: ADR-0046's duplicate-list metadata-merge open question **dies** — entry metadata binds to the TAG slot uniformly (the conservative's LE7 restriction becomes moot).
- *Dup-gate REVERT → idempotent no-op, deliberately:* the conservative's `DuplicateIdentity` REVERT is hostile to permissionless carriage — replaying a member's edges onto another chain must converge, not revert (the same §3.4 move already made for owned kinds). Any client using the REVERT as an "already a member" signal does one `getSlot` read instead. Behavior change, documented, not a bug.

**The conservative's four named failures, disposed:**
1. *Duplicate collapse* — resolved by deleting the capability no app used (evidence above), with the additive escape reserved.
2. *Occurrence-discriminator infection* — moot once (1) resolves; no slot formula changes.
3. *Bimodal record semantics* (validation dispatches on `kindOf(definitionId)` — foreign state) — the dispatch cost is **zero-added**: every TAG admission already validates its definition against the registry (instantiated TAGDEF, carve-out, or now LIST); the kind comes back with the same warm SLOAD. The *semantic* bimodality is real and is priced under (4).
4. *Revocation-policy smuggling / clear-signing* ("this write is permanent" not legible from the signed bytes) — this is the conservative's strongest point and it is an **elegance/consent principle without an app instance**: no app walk in ten produced a user tricked into a permanent entry (registry publishers are scripted keys; consumer list personas were all revocable-list users). Under the decision rule it loses to the merge's confirmed write-count and index-shape wins. **Accepted as a named residual with mandated mitigation:** the Codex signing chapter REQUIRES SDKs to render the list charter (appendOnly bit) at envelope-build time, and the appendOnly-refusal + void-tombstone pair-completion rule (conservative §5.4, adopted verbatim into §6 below) gets golden vectors. Flagged for Phase-0 sign-off as the one place v2 knowingly trades signer-legibility for kind economy.

**Enforcement re-homing map** (conservative census §1.6–1.7):
| v1 guard | new home |
|---|---|
| LE3 list-existence + config hydration | edge-module definition validation (warm registry read, cache-forever legal — LIST immutable) |
| LE4 per-mode typing (ADDR/SCHEMA/ANY) | declared `targetKind` validation against the list's declared `targetKind` (0 = ANY); ADDR ⇒ `0 < target ≤ uint160.max` — **`address(0)` now rejected** (v1 allowed it; Phase-0 sign-off item carried from deterministic-ids §3) |
| LE5 dup gate | TAG slot idempotent in-place update (semantics change, above) |
| LE6 maxEntries | per-`(listId, author)` counter in the edge module, incremented on new-slot admission only; declared **chain-local admission state** (substrate reservation, unchanged) |
| LE8 appendOnly revoke-refusal | edge module rejects REVOKE of any edge whose definition is an appendOnly LIST; out-of-order pair-completion rule per §6 (REVOKE-first ⇒ entry admits, void tombstone discarded) |
| L4/L5 LIST mode + anti-unbounded rule | LIST body slims: `targetType/targetSchema` → one `targetKind`; `appendOnly && allowsDuplicates ⇒ cap` special case **deleted** (the combination no longer exists) |
| LE7 wide EntryRecord[] iteration | kernel active-set storage carries `(target, weight, claimRef)` inline for ALL tags — the N+1 EdgeResolver wart (external getAttestation per entry, L917) dies system-wide, not just for lists |
| `_listAttesters` lens enumeration | generic per-definition attester enumeration in the edge indices |

**Write count:** add-entry-with-order 3 → **1** (≈ −40% flow gas); reorder 2 → **1** (in-place); −374 LoC module; one storage shape (EntryRecord[]) deleted.

**Residual/flip:** flips (to the reserved additive role, never back to the kind) if a real app needs protocol-level duplicate members with per-occurrence metadata AND rejects the opaque-key recipe. Registry F3.5 (author-chosen identityKey — version-keyed immutable ledger) is reserved as an additive mode; the version-keyed read is served today by the PIN slot, the ledger is the audit trail (registry's own assessment: "minor, workaround exists").

### 2.4 PROPERTY — **COLLAPSED into VAL-edges with auto-intern** (maximalist wins; the conservative's flip condition is MET; two amendments)

**Ruling:** the PROPERTY record kind is deleted. An edge whose declared `targetKind == KIND_PROPERTY` carries `(datatypeTag, valueBytes)` inline; the kernel validates canonical encoding, derives `propertyId` (formula unchanged), **auto-interns** it (first-writer, idempotent, exactly-once event), and indexes the edge against the derived id. One spelling rule enforced: `targetKind == KIND_PROPERTY ⟺ VAL layout`; REF-edges to property ids forbidden. **Amendment A (storage normalization):** the kernel stores VAL-edge state as `propertyId` + a one-time registry entry holding the value bytes; `getClaim` reconstitutes the exact body (deterministic, since canonical encoding is admission-enforced). **Amendment B:** `MAX_VALUE_BYTES = 8192` on all VAL tails.

**The evidence that decided it — the conservative's own pre-committed flip condition (§6.6), now satisfied:**
> "if the app-suite grounding pass measures a corpus where one-off values dominate AND no on-chain consumer of value-nodes materializes AND edge canonicality is protected some other way, this collapse becomes defensible."
1. *One-off values dominate the ten-app corpus:* contentHash (unique per file), size, mirror URIs, review bodies, provenance strings (`source-url`, `retrieved-at`), deprecation messages — all one-off; the shared set is a small closed vocabulary (MIME types, license strings). Every file write in every app carries ≥2 one-off values and ≤1 shared one.
2. *No value-node edge consumer materialized:* across ten apps, nothing ever targeted a PROPERTY node with an edge (no value annotation, no value-keyed provenance). Values were only ever *bound*.
3. *Canonicality protected:* the VAL layout is a single branch keyed on a declared body word (`targetKind`), REF edges keep their fixed-width exact-length check (the conservative's own strongest guard, E2, survives on the high-volume path), and the VAL tail gets the round-trip re-encode discipline + mandated Solidity↔TS differential fuzz.
- *Additional positive evidence the conservative didn't have:* (a) **on-chain consumers get one hop shorter** — the registry integrity gate and every reserved-key read become `getSlot → getClaim(body carries the value)` instead of `getSlot → getClaim → getObject(propertyId)`; this compounds with infra demand #2 (bodies-in-state normative — settled coupling-audit open question #2). (b) **Write plans become deterministic** — no intern-existence branching (consumer app walks repeatedly hedged "1–3 PROPERTY mints, count varies with intern state"; that hedge disappears). (c) **Claims become self-contained portable units** — a cherry-picked VAL-edge carries its value; the conservative form risks a copied PIN dangling on an un-copied PROPERTY record (the record-format ledger's "publish self-contained units" fix becomes structural; shrinks every closure-export in the infra portability walkthrough).

**The conservative's four named failures, disposed:**
1. *Edge canonicality tax* — confined to VAL tails (above); REF stays fixed-width.
2. *Interning economy loss* — **eliminated by Amendment A**: the conservative evaluated inline-*without*-interning ("drop the interned object"); the maximalist keeps the interned registry, and normalized storage means `image/png` is stored once forever, per-edge state is one word. The 100-year compounding cost does not exist in the design actually ruled on.
3. *Value-node erasure* — the node **exists** (registry-interned, id-referenceable in reads, derivable offline from bytes alone); only edge-targeting is foreclosed, no app used it, and the escape is additive (reserved REF-to-property annotation role — a new claim role adds a slot row without touching any frozen formula). Accepted residual.
4. *Dual-representation split-brain* — closed by the REF-to-property prohibition (one fact, one spelling).
- *Amendment B disposes the conservative's own FLAG (§4.3):* v1 PROPERTY had **no length cap** — an OOG footgun on every property-reading view (verified by the maximalist against EFSIndexer L480–504). The uniform 8192 cap (mirrors needed it anyway) is a strict improvement; nothing in ten apps needed a >8KB property value.

**Enforcement re-homing:** P2 canonical round-trip → VAL-tail canonicality; P3 valueHash dedup event → auto-intern exactly-once event (the SDK's check-before-write flow becomes moot — intern is idempotent); PR2 seeded-datatype byte-encoding validation → VAL admission (with the string-only ruling: `DATATYPE_STRING` is the only legal tag at freeze — string-only **survived both app passes** explicitly (consumer §6.5, infra F4.3: "the string-only ruling survives this grounding pass"); the `datatypeTag` word stays in the frozen formula for additive extension; `keyWrap` encodes as multibase string under string-only); ADR-0052 non-revocability → registry entry permanent, the revocable thing is the binding (unchanged).

**Write count:** set/change one property 3 (v1) → 2 (conservative) → **1, always**; publish-file-with-3-props loses the 1–3 intern-mint variance; one whole parents-first ordering group (mint-before-bind) deleted.

**Residual/flip:** REF-to-property re-opens via the reserved additive role if a value-annotation app materializes. The VAL/REF layout fork under one kindTag is the #1 new bug surface (maximalist ledger item 2) — freeze-blocking differential fuzz on the VAL tail specifically.

### 2.5 DATA — **STAYS ITS OWN KIND** (both proposals agree; trap #2 HOLDS with the rationale updated)

Both proposals refuse the merge; both app passes independently re-confirmed the trap (consumer §6.7: unowned-idempotent TAGDEFs are what make defensive inclusion and comment-copy races harmless, owned DATA is what makes permissionless carriage safe; infra §8: registry name-squatting needed unowned tags, left-pad defense needed owned DATA; NFT F1.4: don't bless content-derived salts — confirmation-oracle hole). **Adopt the maximalist's corrected rationale:** post-carrier, DATA's duplicate policy has *converged* with the shared-kind policy (body = salt = full id preimage ⇒ every same-id duplicate is byte-identical ⇒ idempotent no-op), so the handoff's stated rationale ("opposite duplicate policies") is obsolete **for DATA**; the trap survives on (1) *ownership as a per-kind admission rule* (`derivation input = recovered author` — Bob physically cannot mint under Alice's word; merging shapes would invert every TAGDEF property inside a validator branch) and (2) *port-don't-re-derive* (DOMAIN_DATA formula is frozen v1 math with golden vectors). **LIST inherits the "opposite duplicate policies" mantle** — it is now the only owned kind with real equivocation surface (config outside the id preimage). Handoff text must be updated (Phase-0 delta §9.6).

### 2.6 PIN + TAG — **STAY TWO CLAIM ROLES** (trap #1 HOLDS; three attack variants all dead)

Both proposals refuse; the apps supplied the read-side proof the trap's original statement lacked: consumer §6.7 — placement (card-1, O(1), first-wins) and accumulation (card-N, paged) "are different ops with different hot paths; a cardinality field would put a branch + degraded slot shape on the single hottest read (path resolve)"; infra app 6 — O(1) `tokenURI` exists *because* cardinality is in the kind. The conservative's §6.1 and the maximalist's R2 (including the definition-declared-arity variant the trap never considered, killed on frozen-slot-math + uninstantiated-virtual-key + hot-path-registry-read grounds) are adopted jointly. **Codex gets the sharper statement:** *cardinality is part of slot identity; slots are the supersession unit; anything that makes slot identity depend on data or state manufactures dual active claims.* The SET/ADD cosmetic rename is left to Phase-0 taste (zero mechanical content; constants pre-freeze-renameable).

**One conservative restriction overruled:** §4.6 TA2 ("no virtual carve-out for TAG in the freeze; reserved keys are PIN-only") is incompatible with the ratified MIRROR/REDIRECT collapses and with keyWrap. The carve-out extends to declared TAG-role rows (§5). This is a real delta to deterministic-ids §5's closed PIN-only enumeration and is listed as a frozen-surface change (§9.2).

### 2.7 Naming vs categorizing — **ONE TAGDEF KIND; the distinction is the EDGE (PIN vs TAG), never a node kind** (both proposals agree; apps confirm)

The conservative §7 ruling is adopted verbatim: `/pizza` the folder and `#pizza` the label are the **same tagId**; placing = PIN, labeling = TAG; splitting the node kind would fork the namespace, halve the Schelling property, and double registration cost; squatting is inert because TAGDEF registration grants no privilege. The derivation `kind` word **stays** (it does attachment-matrix and per-kind-uniqueness work orthogonal to naming-vs-categorizing). App evidence: consumer §10 hunted for a destructive folder/tag collision and found none at the record level — "the confusion risk is UI vocabulary, not model." **Carried flag:** name shadowing across kinds (`readme.md`-as-GENERIC vs -as-KIND_DATA under one parent) needs a frozen total precedence order in the Codex read-semantics chapter with vectors — now sharpened by the §4.2 matrix relaxation, which makes file-node children legal and therefore makes serving-context precedence mandatory, not optional. Also carried: the 64-hex segment-name vs container-classifier collision (consumer app 2) — SDK naming guidance.

### 2.8 TAGDEF-inline (mkdir folded into placing edges) and LIST-dissolution — **REFUSED** (maximalist refusals R3/R4 ratified)

No app contradicts either refusal; consumer §10 found TAGDEF-per-segment cost "never mattered" (folders amortize), so the R3 purchase (~1 record in the rare new-segment flow) buys nothing real, and it would create a second spelling of folder creation. R4 (LIST must be owned + non-revocable + write-time-readable) is what the registry ledger and lens subscription independently demand (§2.3). The collapse principle is confirmed as doctrine: **a kind is deleted entirely or not touched; no dual spellings.**

---

## 3. What re-homes where — consolidated (the conservative census as checklist)

Every guard class in conservative §1 now has exactly one home:

1. **Canonical-name profile, parent existence, depth 32, attachment matrix, path permanence** → TAGDEF validation (conservative §4.1 adopted as the spec table, with the §4.2 matrix amendment below).
2. **Owned-id admission (salt ≠ 0, entropy rule), unsquattability** → DATA/LIST admission + signature gate.
3. **Interned-value canonicality, dedup, permanence** → VAL-tail admission + auto-intern registry (§2.4).
4. **Cardinality-1/N state machines, slot supersession, visibility propagation, swap-and-pop** → the one edge module (PIN/TAG), per the frozen slot table (CLAIMROLE_LIST_ENTRY row deleted; zero rows changed).
5. **List charter enforcement (appendOnly, maxEntries, targetKind)** → edge-module definition-resolution branch (§2.3 map).
6. **Mirror URI bounds, data-typing; redirect endpoint typing, self-loops, follow policy** → the reserved-key table + one shared enforcement engine (§5).
7. **The §1.9 negative census stands with one carve-out:** no per-record revocability flags, no recipient, no refUID, no EAS-style lifecycle expiration — but the new `expiresAt` word is **not** that field re-grown: it is optional-and-enforced *currency grading* (stale-not-dead, §4.1), not validity lifecycle, and reads never filter records out of existence on it.

---

## 4. What BOTH proposals missed and the app evidence demands

These are additions neither `tags-maximalist.md` nor `kind-set-conservative.md` contains. Items 4.1 and 4.2 change frozen surfaces and are ruled here; the rest are flagged to their owning workstreams.

### 4.1 `expiresAt` as a claim-body word — RULED IN (the biggest miss)

**Evidence:** infra demand #1 — apps 7 (DAO delegations), 8 (registry — "breaks the doctrine's wording"), 10 (stale-endorsement monetary replay, F5.2) — plus consumer #5 (approval staleness, post ephemerality, lens freshness). The carrier decision's own revocation caveat ("apps use author-set EXPIRY") currently has **no kernel-legible home**; as a string property it is S4: "a 20-line consumer forgets and the doctrine silently fails."
**Ruling:** `uint64 expiresAt` word in PIN and TAG bodies (REF and VAL layouts), `0` = none. Semantics frozen as **stale-not-dead**: past T, the claim may not be served as CURRENT without revalidation; it is never invalid as a record; refresh = idempotent re-assert (same slot, higher seq), and refresh is optional — unrefreshed claims degrade to as-of semantics, they do not die. `getSlot` surfaces the staleness flag. **Read rule (safety-critical):** expired ⇒ resolve as STALE/unknown-currency and STOP — never fall through to the next lens author (fallthrough would convert a freshness bound into a trust transfer; this is FM1's read-grade rule applied to expiry).
**Why a body word and not the conservative's proposed reserved key (§8 note):** the reserved-key form is exactly the silent-fail S4 shape the registry app broke on. Adjudicated: body word wins. EAS-lesson guard honored: EAS's `expirationTime` was mandatory-and-meaningless; this is optional-and-enforced.
**Cost:** +1 word per claim (~32B calldata); fixed-length canonicality checks preserved (192/224B).
**Interaction with §2.3:** list-membership edges inherit the word; archive-shaped data (registry versions, archives) simply never sets it — the registry's anti-heartbeat-rot analysis (§4.5) is the normative reading and goes in the Codex verbatim: *expiry bounds currency, never validity.*

### 4.2 Attachment-matrix relaxation: generic children under KIND_DATA name-tags — RULED IN

**Evidence:** consumer #3 — comments-under-a-post, annotations-under-a-photo, reviews-under-a-package all forced into parallel containers "glued by convention" (App 2's top wart after enumeration); "either relax one matrix row… or bless + spec the parallel-container convention."
**Ruling:** relax the row. Parent `KIND_DATA` → children `{KIND_PROPERTY, KIND_GENERIC}` (was: KIND_PROPERTY only). The derivation already defines these ids; only admission gated them, so the change is pre-freeze free and convention-glue dies structurally. `KIND_PROPERTY` → no children and `KIND_LIST` → KIND_PROPERTY-only stay.
**Obligation created:** the name-shadowing/read-precedence Codex chapter (§2.7) becomes mandatory with vectors — file-serving contexts serve the DATA, path-continuation contexts descend into children; frozen total order per context.

### 4.3 Reserved-key table additions: `home` and `successor` under ADDRESS containers — RULED IN

**Evidence:** infra demand #5 (declared home + pull-latest-before-trust — registry yank sensitivity) and F2.3 (succession opacity to contracts — DAO). Both need a derivable one-read location on the **author's address container**, which no proposal's carve-out allows (conservative PI2b requires `defParentId` instantiated as KIND_DATA).
**Ruling:** reserved-key rows declare a legal **parent class** (DATA | TAGDEF | ADDRESS-container); `home` (PIN, VAL string: chainId + optional hint) and `successor` (PIN, REF targetKind=ADDRESS) are ADDRESS-parent rows. Virtual derivation works unchanged (`H(DOMAIN_ANCHOR, addrWord, keccak(name), KIND_PROPERTY)`; address-shaped parents are already legal in T4).

### 4.4 Flags to other workstream owners (kind-adjacent, not kind-set; decide before freeze)

| # | Item | Owner | Evidence |
|---|---|---|---|
| a | **Container-scoped cross-author discovery index** (bounded, per-tagId, paginated, discovery-grade, "enumeration ≠ endorsement") — THE read gap; converts apps 2–3 from indexer-dependents. This ruling's lean: **add it** (it is the same read shape as folder browsing, keyed by one id) — but it is kernel-index surface, not a record kind | kernel-index ruling | consumer #1, §6.1 |
| b | **Split-submission of one envelope** as first-class (partial-envelope admission semantics, `submitRange`, progress view) | envelope spec | consumer #2 (photo import; every migration tool) |
| c | **`getSlot` supersession evidence** (count/prior-claim link) — rewrite detection in one read | read surface | infra #4b (registry left-pad layer 1, DAO propose/execute pinning) |
| d | **Bodies-in-state normative** (`getClaim` returns reconstitutable body bytes for all kinds) — composability sale is void without it; compatible with §2.4 Amendment A | kernel storage rule | infra #2 |
| e | **Chain-relative `web3://<addr>` URIs + frozen CREATE2 byte-store recipe** | Codex transport chapter | infra #3 (S3 kills large-media portability otherwise) |
| f | **Mutable-document doctrine** (update = new DATA + re-PIN + `supersededBy`; mirror-churn on placed DATA = anti-pattern) — now phrased over reserved keys per §2.2 | Codex read semantics | consumer #4 (FM11 version-model divergence) |
| g | **Lens pin-and-diff subscription convention** (live-follow removals, prompt on additions/reorders) | Codex read semantics | consumer #5b (FM8; "the first compromised curator" scenario) |
| h | **Advisory-lens yank pattern + closed-set gating idiom + wrapper-contract pattern** | Codex composability chapter | infra §4.5c, §6.2 |
| i | **Gas benchmark of the §7 flows** — two app verdicts hostage to it | measurement | both passes, standing item |

---

## 5. The reserved-key table (frozen Codex chapter — the re-homed enforcement)

One shared enforcement engine; per-row golden vectors are **freeze-blocking** (joins the §13 gate). Rows:

| key (defKeyHash preimage) | parent class | role(s) | binding | validation | follow policy |
|---|---|---|---|---|---|
| contentType | DATA | PIN | VAL string | ≤ 8192 | — |
| name | DATA | PIN | VAL string | ≤ 8192 | — |
| contentHash | DATA | PIN | VAL string (multibase multihash) | ≤ 8192 | — |
| size | DATA | PIN | VAL string | ≤ 8192 | — |
| contentEncryption | DATA | PIN | VAL string | ≤ 8192 | — |
| keyWrap | DATA | TAG | VAL string (multibase) | ≤ 8192 | — |
| **mirrors** | DATA | **PIN (primary) + TAG (additional)** | VAL string URI | nonempty, ≤ 8192; scheme client-classified; read = PIN ∪ TAGs | — |
| sameAs | DATA | TAG | REF → DATA | target ≠ parent | never auto-follow |
| supersededBy | DATA | PIN | REF → DATA | target ≠ parent | follow per doctrine 4.4f |
| relatedVersion | DATA | TAG | REF → DATA | — | **NEVER auto-follow** (vectored) |
| symlink | TAGDEF | PIN | REF → TAGDEF\|DATA | target ≠ parent | auto-follow, depth-capped (read spec) |
| movedTo | TAGDEF | PIN | REF → TAGDEF | target ≠ parent | auto-follow (rename primitive) |
| home | ADDRESS | PIN | VAL string | ≤ 8192 | — |
| successor | ADDRESS | PIN | REF targetKind=ADDRESS | `0 < target ≤ uint160.max` | consumer convention 4.4 |

Non-reserved keys: permissionless instantiated key-TAGDEFs, untyped, never auto-followed — the open extension surface (replaces both "new schema" and "uint16 kind ≥ 3").
**Named risk carried (maximalist ledger #1, now 14 rows):** the table is a mini-schema-registry reborn; a wrong row is Etched. Mitigations mandatory: numbered Codex chapter, per-row golden vectors, ONE engine (a row bug cannot corrupt slot math). The KIND_PROPERTY naming skew for REF-binding keys (cosmetic wart — maximalist ledger #8) goes to Phase-0: optionally rename the derivation-kind preimage to `efs.kind.key.v1` before vectors freeze.

---

## 6. Revocability classes — RULED

| Class | Members | Rule |
|---|---|---|
| **P — permanent objects** | TAGDEF, DATA, LIST, interned PROPERTY registry entries, auto-intern side effects | REVOKE naming their coordinates is permanently **inert** (revocation state never consulted for objects); path/value permanence cannot be griefed, even by the author |
| **R — revocable claims** | PIN, TAG (all layouts, incl. every reserved-key form) | author-only revoke via coordinates (§1.3); monotone; revoke clears the slot iff still-current; stale revoke of a superseded claim = no-op |
| **C — conditionally revocable** | TAG whose definition is an **appendOnly LIST** | REVOKE refused at whichever admission event completes the pair: revoke-second ⇒ revert; entry-second ⇒ entry admits and the pre-existing tombstone is **discarded as void** (no time bombs). Golden-vector mandatory (conservative §5.4 adopted; new spec surface, no v1 precedent) |
| **M — monotone ops** | REVOKE | no un-revoke; REVOKE-of-REVOKE inert (ops are not revocable claims) |
| **G — genesis** | genesis blob records under `H("efs.system.v1")` | non-revocable by construction (no key exists) |

**Expiry is not a lifecycle class** — it is currency grading on R/C claims (§4.1); records never leave any class by time.

---

## 7. Duplicate-policy matrix — RULED (final)

| Kind | Same id, byte-identical | Same id, different payload | Collision trigger |
|---|---|---|---|
| TAGDEF | idempotent no-op (no re-push/re-event; duplicate author's visibility effects still run) | impossible except blinded↔plaintext forms (by design; all four form-orderings are required duplicate-matrix vectors) | anyone (unowned) — idempotency kills races and front-run griefing |
| DATA | idempotent no-op | **impossible** (body = full preimage) | author's signature only |
| LIST | idempotent no-op | **author-equivocation evidence**: recorded, first config governs forever, never merged, never batch-revert | author only |
| PROPERTY (intern side effect) | idempotent, exactly-once creation event | impossible (id commits to datatype + H(value)) | anyone |
| PIN / TAG | idempotent by claimId (byte-identical envelope replay) | n/a — distinct `(seq, idx)` = distinct claim; slot currency = max `(seq, idx, digest)`, never arrival order | author |
| list-membership TAG | idempotent in-place at the `(listId, target)` slot (**changed from v1's `DuplicateIdentity` REVERT** — replication-coherent; "already a member" = one `getSlot` read) | n/a | author |
| Envelope | byte-identical `(author, seq)` ⇒ no-op | different digest ⇒ per the envelope-layer ruling (outside kind scope; the "collisions are never duplicity" reservation binds it) | author's own devices |

v1's owned-kind REVERT retired with cause: under signature-verified carriage a duplicate can only be the author's own signed record; the stranger-merge the REVERT prevented is prevented one layer down, by the signature.

---

## 8. Cardinality placement — RULED

**Cardinality lives in the claim role (the kind), never in record data, never on the definition.** Frozen as the Codex invariant: *cardinality is part of slot identity; slots are the supersession unit; anything that makes slot identity depend on data or state manufactures dual active claims.* Grounds: the frozen per-role slot-key table (PIN keys `(definitionId, targetKind)`, TAG keys `(definitionId, targetId)`) bakes arity into slot derivation; the apps proved the read-side necessity (O(1) path resolve and O(1) `tokenURI` both exist because the slot key is derivable from public inputs without touching the record). The three merge variants (per-edge field, definition-declared arity, body-length inference) are all rejected with the maximalist R2 + conservative §6.1/§10 reasoning adopted jointly. New arities (duplicate-member role, occurrence slots) are **additive claim roles** — reserved, never retrofitted.

---

## 9. Phase-0 / Codex deltas this ruling forces upward

1. **Collapse principle is doctrine:** a kind is deleted entirely or not touched; one fact, one spelling.
2. **Reserved-key table = new frozen Codex chapter** (14 rows, §5) — replaces the MIRROR/REDIRECT resolver chapters, the uint16 taxonomy, ADR-0050's kind registry, and **extends deterministic-ids §5's PIN-only carve-out to declared TAG-role and ADDRESS-parent rows** (a frozen-surface change; per-row vectors freeze-blocking).
3. **Body-shape deltas:** `expiresAt` word in PIN/TAG (§4.1); LIST slims to `(salt, appendOnly, targetKind, maxEntries)`; REVOKE body = coordinates; VAL layouts + `MAX_VALUE_BYTES = 8192` kernel constant (adds the property cap v1 lacked).
4. **Slot table:** delete the CLAIMROLE_LIST_ENTRY row (served exactly by TAG with definitionId = listId); zero other rows change.
5. **Attachment matrix:** KIND_DATA parents admit KIND_GENERIC children (§4.2); read-precedence chapter with vectors becomes mandatory.
6. **Handoff trap-rationale updates:** trap #2 re-grounded on ownership-admission + formula-separation (duplicate-policy divergence now belongs to LIST, not DATA); trap #1 gets the sharper slot-identity statement (§8).
7. **Parents-first ordering shrinks** to `[DATA] [LIST] [TAGDEF ancestors-first] [PIN] [TAG] [REVOKE]`.
8. **String-only ratified at freeze** (`DATATYPE_STRING` sole legal tag; word retained for additive extension) — survived ten apps; the on-chain numeric consumer that would flip it did not appear (both passes note a global marketplace app could still land the blow — re-check if one enters scope).
9. **Signer-legibility residual (appendOnly entries) to Phase-0 sign-off** — the one knowing consent-legibility trade in this ruling (§2.3 disposal 4).
10. **Gas-snapshot CI baseline** = the §10 flow table below (numbers are estimates until the benchmark runs).
11. Conformance-test obligations inherited: anti-fallthrough on stale/unknown (FM1 + §4.1 read rule); void-tombstone pair-completion vectors; VAL-tail differential fuzz; blinded/salted TAGDEF duplicate-matrix orderings.

---

## 10. Write-count consequences (canonical flows, final kind set)

("cons." = conservative 9-kind; both ride one envelope = one signature; gas ±2×, unmeasured)

| Flow | v1 EAS | cons. v2 | **THIS RULING** | Δ vs cons. |
|---|---|---|---|---|
| Publish 4KB file (3 props, 1 mirror, place) | ~10–12 | 8–10 (intern-state variance) | **7, always** (DATA, TAGDEF, PIN-place, PIN-mirrors-primary VAL, 3×VAL-PIN) | −1 to −3, deterministic |
| Set/change one property | 3 | 2 | **1** | −50% |
| Add mirror | 1 | 1 | **1** (primary=PIN or extra=TAG; +~3 words) | 0, gains O(1) read + slot |
| Add list entry with order | 3 | 2–3 | **1** (weight = order) | −67% vs v1 |
| Reorder list entry | 2 | 1–2 | **1** (in-place weight) | — |
| Rename (path-permanent) | 4 | 4 | **4** (TAGDEF + PIN + REVOKE + movedTo-PIN) | 0 — SDK verb obligation |
| Redirect / like / follow / revoke | 1 | 1 | **1** | 0 |

Honest summary unchanged from the maximalist: record counts drop 12–67% per flow and become deterministic, but whole-write gas improves only ~1–5% (indices dominate). The real purchases: **4 record kinds, 3 body-encoding surfaces, 1 storage shape, 1 ordering group deleted; ≈ −500–600 LoC Etched validation; three open questions deleted rather than answered** (slot-less claim handles; duplicate-list metadata discriminator; foreign-EAS lists); self-contained portable claims; **plus, from the app amendments: the point-lookup surface is closed (mirror hop repaired), the expiry doctrine becomes machine-checkable, and annotation apps get a structural home.**

---

## 11. Residual-risk ledger (what I could not fully dispose)

1. **VAL/REF layout fork under one kindTag** — the hottest-path canonicality surface; a validator bug mints wrong propertyIds forever. Mitigations mandated (single declared-word branch, round-trip discipline, differential fuzz) but this is the ruling's #1 engineering risk.
2. **14-row reserved-key table** — re-centralizes what 4 kinds enforced; a wrong row is Etched and gets less review than a contract. Mitigations in §5; treat every row as freeze-gate surface.
3. **Signer-legibility of appendOnly permanence** (§2.3) — accepted on absence-of-app-evidence, which is weaker than presence-of-evidence; if Phase-0's clear-signing review (ERC-7730) finds a concrete harm scenario, the fallback is a distinct kindTag *alias* for list-membership edges (same body, same slot math, different tag) — cheap to add pre-freeze, pointless after.
4. **Transport write-gate loss** — garbage URIs land unchecked (v1 never validated URI syntax either; the loss is typo-catching). Accepted per ADR-0056; flips per §2.1.
5. **Expiry-word interactions** are new frozen surface designed in this pass (stale-not-dead, no-fallthrough, refresh-as-re-assert): internally consistent on paper, exercised only against the ten apps — needs its own red-team alongside the envelope questions (the conservative's §5.2 seq-collision rule and the REVOKE pair-completion vectors are already queued there).
6. **Every gas number is an estimate**; two app verdicts (NFT scale, web-archive scale) and the micro-claim-tax acceptance are hostage to the benchmark.
7. **The discovery-index decision (§4.4a) is deliberately not ruled here** — it is index surface, not a kind — but it is the single highest-leverage open item the app evidence produced; freezing reads without deciding it would ratify the indexer-dependence of two consumer apps by default.
