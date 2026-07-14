# v2 Codex — Record kinds & the tag-core data model (Etched)

**Status:** draft
**Target repos:** contracts, sdk, planning
**Depends on:** [[codex-envelope]], [[deterministic-ids]]
**Base text:** [kinds-ruling.md](../../Reviews/2026-07-07-efsv2-corpus/kinds-ruling.md) (reconciliation of [tags-maximalist.md](../../Reviews/2026-07-07-efsv2-corpus/tags-maximalist.md) vs [kind-set-conservative.md](../../Reviews/2026-07-07-efsv2-corpus/kind-set-conservative.md), decided by the ten-app grounding) + [attack-kinds.md](../../Reviews/2026-07-07-efsv2-corpus/attack-kinds.md) (red team: kind set survives; seven pre-freeze defects, all amended below)
**Last touched:** 2026-07-07

#status/draft #kind/design #repo/contracts #repo/sdk

## What this document is

The ruling layer over the kinds adjudication. James's directive — "tags are the only primitive really; can we get rid of other records?" — is answered: **yes, four of nine record kinds are deleted entirely**, and the two collapses that looked tempting but were traps stay refused, now with app evidence. Where this document and the base text disagree, this document wins.

## The v2 kind set — FIVE record kinds + two ops

| Kind | Class | Role |
|---|---|---|
| **TAGDEF** | object, permanent, unowned (shared Schelling) | the namespace primitive: paths, folders, categories, property keys — one derived-tagId space; carries canonical-name validation + path permanence (what ANCHOR's resolver quietly enforced) |
| **DATA** | object, permanent, **owned** (author+salt) | file/content identity |
| **LIST** | object, permanent, owned | collection charter (appendOnly, targetKind, maxEntries-as-read-filter); the only kind with immutable write-time-enforceable constraints; **config folded into listId** (envelope amendment 2) |
| **PIN** | claim, revocable, cardinality-1 | naming/placement/binding edge; REF or VAL layout |
| **TAG** | claim, revocable, cardinality-N (weighted) | categorizing/membership edge; REF or VAL layout |
| ops | — | **ASSERT** (op=0), **REVOKE** (op=1, body = claimId) |

**Deleted entirely (no dual spellings — a fact has exactly one encoding):**
- **PROPERTY** → VAL-layout edges (tail = datatype word + value bytes ≤ `MAX_VALUE_BYTES = 8192`); the kernel **auto-interns**: derives propertyId with the unchanged frozen formula and registers the value object as a side effect of the edge — property set drops 3 records → 1. REF-edges targeting KIND_PROPERTY are forbidden (closes the dual-spelling equivocation hole). Interning economy preserved via normalized storage. **String-only ratified** (ten apps produced no on-chain numeric consumer; the named re-check trigger — a marketplace/sort-range app — stands); the datatype word remains in the derivation solely so the interning formula stays recomputable, with `string` the only v2 value.
- **MIRROR** → reserved-key `mirrors` with **dual role**: PIN = primary mirror (the O(1) tokenURI point read the NFT app demanded), TAG = additional mirrors (the multi-transport redundancy the consumer apps demanded). Transport-ancestry write gate retires to client scheme classification (ADR-0056 logic); URI cap re-homes as the uniform `MAX_VALUE_BYTES`.
- **REDIRECT** → five typed reserved-key REF-edge rows: `sameAs`, `relatedVersion` (TAG, cardinality-N); `symlink`, `movedTo` (PIN); **`supersededBy` gets the dual-role pattern** (PIN = designated successor, TAG = additional, union read) so many-to-one supersession is expressible (attack-kinds K4). The uint16 taxonomy retires; typing/existence checks survive as frozen table rows; permissionless extension via user key-TAGDEFs.
- **LIST_ENTRY** → TAG with `definitionId = listId` (the frozen slot table already proved the isomorphism); add-entry-with-order drops 3 records → 1. `allowsDuplicates` deleted from protocol (zero of ten apps used it; opaque-occurrence-key recipe documented; an additive duplicate-member role is reserved).

**Both flagged traps HOLD, re-grounded:** PIN/TAG stay separate kinds — *cardinality is part of slot identity* (a frozen Codex invariant; merging puts a branch on the hottest read). DATA stays owned — re-grounded on ownership-admission + formula-separation (the old duplicate-policy rationale is obsolete post-carrier and the handoff is updated).

## Amendments (normative — the red team's seven, plus app-demanded additions)

1. **appendOnly entry edges require `expiresAt == 0`** (K1 — otherwise born-expiring/retroactively-staled entries hollow the appendOnly guarantee that justified keeping LIST). One require + golden vector.
2. **All semantic refusals are inert-recorded no-ops with refusal events** (K2): the surviving admission REVERTs violated the same replication-coherence principle that deleted the dup-gate REVERT — under whole-envelope atomicity they let honest two-device flows permanently poison envelopes per chain. AppendOnly-revoke-second converts to the inert `RefusedAppendOnly`; **ListFull is deleted entirely — no counter, no event** (maxEntries is a pure read filter per envelope amendment 1 / C6). Reverts remain only for malformed bodies, unknown/reserved kindTags, and retryable missing dependencies (the envelope master invariant's set, C6).
3. **LIST charter equivocation rule** (K3): superseded structurally — config folds into listId (envelope amendment 2), so same-listId-different-charter is impossible by derivation; the per-chain first-config race and its evidence machinery are deleted.
4. **supersededBy dual-role** (K4): adopted above.
5. **Closed targetKind enumeration, frozen** (K5): the deterministic-ids no-dependency rule for OPAQUE ports intact (no negative-existence checks — non-monotone admission is banned by the master invariant); **OPAQUE is forbidden in all reserved-key rows**; the legal set per row is stated in the frozen table.
6. **Expiry read rule is context-split** (K6): machine/gating reads stop at STALE (as ruled); interactive lens reads label-and-render-stale with fallthrough only by explicit reader policy — the full rule lives in [[read-lens-spec]]; the revoke-vs-expire exit asymmetry is documented.
7. **`successor` demoted to reserved-not-active** (K7 + attack-identity B1/B2): an active successor row pre-KEL blesses key-theft trust migration (the thief holds the key and always wins the slot). Succession ships with the KEL. The interim convention is client-layer doctrine: exactly one targetKind (OPAQUE, per attack-identity B2 — ADDRESS+OPAQUE dual slots broke cardinality-1), publish-pair-at-creation, never-auto-followed, hostile MUST-NOT-authorize language. `home` stays (advisory, fail-safe).
8. **App-demanded additions** (from the grounding, missed by both kind proposals): `expiresAt uint64` in PIN/TAG bodies with stale-not-dead semantics (the package registry breaks without it); the kind-attachment matrix relaxes to admit generic children under KIND_DATA parents (annotation/comment attachment gets a legal home); `home`/`successor` reserved keys under ADDRESS containers (successor per amendment 7); the reserved-key carve-out extends to TAG-role and ADDRESS-parent rows (a deterministic-ids §5 delta).

## The deterministic-ids v2 delta (gap G3 — the consolidated frozen-math amendments)

One owner (this document), one list, re-vectored once. Amendments to [[deterministic-ids]]:
1. `claimId = keccak256(DOMAIN_CLAIM_V1, author, seq, recordDigest)` (new; envelope ruling).
2. `listId` folds `keccak256(configBytes)` (envelope amendment 2).
3. Reserved-key carve-out extends to TAG-role and ADDRESS-parent rows (amendment 8).
4. Closed targetKind set with OPAQUE-forbidden-in-reserved-rows (amendment 5).
5. anchorId → tagId renaming with unchanged math; TAGDEF domain constants finalized (`efs.id.tagdef.v1` family — the envelope vectors reference these; naming skew across corpus docs resolves here).
6. Canonical-name (NFC) profile enforcement location restated for the kernel (attack-envelope C4).
7. `home`/`successor`/`checkpoint` reserved rows (successor reserved-not-active per amendment 7; checkpoint = ordinary ADDRESS-parent reserved-key claim per the adjudicated reading, active on [[freeze-gates]] A1 ratification).

## Duplicate policy & revocability (final matrix)

Shared kinds (TAGDEF, interned values): idempotent no-op on byte-identical re-derivation; attester-side effects run. Owned kinds (DATA, LIST): byte-identical re-derivation = idempotent no-op; same-id-different-body = **impossible by construction for both** — DATA because body = salt = the full id preimage (base §7), LIST because config folds into listId (envelope amendment 2). Post-adjudication every kind is body ≡ derivation inputs; the owned-conflict evidence machinery is deleted as dead code. Claims: per-slot LWW `(seq, recordDigest)`; revoked slot reads EMPTY; revocation is the monotone G-set; five revocability classes and void-tombstone pair-completion vectors per the base text (base class C's revoke-second-reverts is re-cut to the inert `RefusedAppendOnly` per amendment 2).

## Open questions

- [ ] AppendOnly signer-legibility residual (a permanent list entry looks like a revocable TAG in the signed bytes): accepted on absence-of-evidence; the fallback kindTag-alias is named for Phase-0 if clear-signing review finds concrete harm. *James ratification tracked in [[freeze-gates]].*
- [ ] String-only + datatype-word scope confirm (shared with [[codex-envelope]]).
- [x] **Client-OS identity pressure resolved by [[kel]] (2026-07-11):** `act` is provenance targeting a full-width KEL grant/key ID, not the grant; KEL grants and `AuthReceipt` are protocol state; device/app keys are actors, while optional persona links connect full-width principals and never authorize. Re-cut the reserved-row vectors against [[fs-pass-freeze-reservations]] D1/D2 before freeze.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] Reserved-key table (13 rows — successor demoted — plus the reserved checkpoint key pending [[freeze-gates]] A1) has per-row golden vectors (it re-centralizes what 4 deleted kinds enforced — every row is freeze-gate surface)
- [ ] VAL/REF layout differential fuzz green (the ruling's #1 engineering risk)
- [ ] At least one round of `#status/review` with another agent or human comment
