# EFS v2 — FS pass: consolidated freeze-sensitive reservation set

**Status:** draft
**Target repos:** contracts, planning
**Depends on:** [[fs-pass-synthesis]], [[freeze-gates]]
**Last touched:** 2026-07-10

#status/draft #kind/design #repo/contracts #repo/planning

> **2026-07-11 identity delta.** [[kel]] is now the controlling ledger for identity-sensitive freeze items. It recuts `act` as provenance targeting a full-width grant/key ID, rejects P-256/WebAuthn un-reservation apart from the principal/actor seam, adds `authorityId` + `authEpoch` to the envelope, and requires KEL-aware home admission plus `AuthReceipt`. Rows D1, D2, D7 and the “KEL subsumes later” revocation assumption below must be reconciled before this reservation set is ceremony-ready.

## What this is

The "reserve before the ceremony" set the FS pass exists to produce — every item that touches the frozen surface (envelope/body wire, kernel stored state, reserved-key rows, derivation math, genesis manifest). Status: **ADOPT** (synthesis ratifies), **⚖ NEEDS-JAMES** ([[fs-pass-james-decisions]]), **REJECT** (recorded so silence doesn't decide). Red-team corrections are folded in. Everything the lanes produced that is *not* here is an explicit convention (§H) or Durable — see [[fs-pass-synthesis]].

**Staging note:** deep design is staged (FS now, OS next), but the reservations do NOT stage — this set must converge before the freeze ceremony alongside the earlier [[freeze-gates]] §C set.

## A. Envelope / wire (precede the envelope lock)

| # | Item | Status |
|---|---|---|
| A1 | `seq` → `order` rename (EIP-712 typeHash string; regenerate digest + 42 golden vectors + wallet label). Mechanism-inert, wire-breaking. | **⚖ NEEDS-JAMES** (freeze-gates A.8a) — recommend ADOPT |
| A2 | `claimedAt` trailing claim-body word: `uint64` seconds, always present (0 = absent), second-to-last before `expiresAt`; ASSERT PIN/TAG only; REVOKE body stays exactly `bytes32 claimId`. Performed-at only; forward-only falsifier; scheduled-for is payload (C3). Obligations: extend the S7 canonical-word check, widen VAL-tail fuzz, trailing-word vectors, private-tier-writes-0 rider. | **⚖ NEEDS-JAMES** (A.8b) — recommend ADOPT with this shape |
| A3 | Envelope `summaryHash` word (P5.1) | **REJECT** — `recordsRoot` already commits every summary input; wire-breaking for zero gain |
| A4 | Vector-clock / causal envelope fields; co-signed cross-author envelopes | **REJECT** — breaks confluence; chain-layer concern |

## B. Kernel stored state + read ABI — the P1 kernel-state gas bundle (freeze-gates A2 kernel-state-cost sign-off; price as ONE decision)

| # | Item | Status |
|---|---|---|
| B1 | `admittedAt[claimId]` stored `uint64`, **write-once per venue**, `getAdmission(claimId[])` batch read; **fenced out of every comparator / supersession / cross-chain ordering** (fix 4 restored, C4); direction-split: existence-since only, never data-freshness (C1); [[freeze-gates]] §A.8 note (iv) corrected accordingly. | **⚖ NEEDS-JAMES** (P1) — four lanes + access-lane renewal-lapse argument; the single highest-leverage Etched decision; **must precede the gas snapshot ratification** |
| B2 | Revocation G-set value = `revokedAt` `uint64` (admission time of the REVOKE), write-once per venue at first pair admission | **ADOPT** — rides B1, ~zero marginal storage |
| B3 | R1 target-keyed discovery index (`discoverByTarget` + one postings word/claim): the general **backlink / "which records point at X"** index. **REQUIRED (core), not optional** — restores v1's `getAllReferencing` and satisfies the on-chain-graph mission constraint ([[onchain-graph-queries]] §0, ruled 2026-07-10). REF-layout targets **required**; VAL-target postings the one remaining trim (optional); address-target + LIST-reverse + REDIRECT-cited-by are the §6 sub-decisions. Privacy-lane correlation-economics caveat carried. | **⚖ NEEDS-JAMES — shape/trim only, not whether** (James rules REF/VAL/address/list/redirect trim; the capability is required) |
| B4 | Postings entry layout — **REDESIGN REQUIRED** (on-chain-completeness audit, [[onchain-completeness]] §1): the `author(160) \| spineIdx(64) \| flags(32)` word carries **no `definitionId` and no live-revocation bit**, so predicate-filtered reverse ("which `mirrors`/`supersededBy`/`act` edges point at X") is O(all postings at X) not O(matches) — composability-Tier-3 wearing a Tier-2 badge. Word must carry the **predicate** (or a per-`(target,definitionId)` sub-index must be reserved), and admit ADDRESS/LIST/REDIRECT targets + author-keying. | **⚖ NEEDS-JAMES — the headline freeze change** (shape once the gas bundle prices it) |
| B5 | Revoke-echo postings append (the live-revocation bit for counts/staleness) | **REOPEN** — was REJECT; the audit shows counts are attacker-inflatable without it. Either revoke-echo decrement OR ratify an `isRevokedBatch` reconciliation view **and** rule "counts are advisory, never gate on them." |
| B6 | `isAdmitted(claimId[])` batch | **NOT Etched** — view-contract recipe (kernel minimality) |
| B7 | Etched discovery-index growth for author-filtered op enumeration | **REJECT** — redeployable view / indexer |

## C. Reserved-key rows to MINT now

| # | Item | Status |
|---|---|---|
| C1 | `lang` (BCP-47, VAL; grammar validated read-side) | **ADOPT** |
| C2 | `dir` (ltr/rtl/auto; rides lang) | **ADOPT** |
| C3 | `encryptionKey` (PIN VAL, **full-width principal parent**, algo-tagged multi-key blob) — with a **separate KEM/KEX algoTag registry** (never identity's signature registry) + per-principal guidance. The prior ADDRESS-only parent is superseded because born-KEL principals are digest-shaped. Correctness row, not UX: convention here fails as silent mis-encryption. | **ADOPT with KEL recut** |
| C4 | SHA-256 per-chunk word in EFSBytes manifests (before EFSBytes vectors freeze; painful retrofit; web3:// safelist liaison owner ⚖) | **ADOPT** |

## D. Rows/shapes to RESERVE now (layout + vectors; machinery stays Durable)

| # | Item | Status |
|---|---|---|
| D1 | **`act` provenance row, KEL recut:** it never grants authority. Parent is a full-width principal; target is a full-width KEL `grantId` or `keyId`; optional actor-principal disclosure is explicit. Scope/expiry/ancestry live in the authoritative grant, not a graph label. | **SUPERSEDED SHAPE — adopt [[kel]] §7.4; new vectors required** |
| D2 | **Optional principal-link pair** (`efs.os/persona` / `efs.os/primary`) + human label — **DISTINCT from `act` and never authority**. Both ends are full-width principals. Security device/app actors do not use it; a privacy persona publishes it only by choosing correlation. | **KEL-RECUT CONVENTION; do not freeze an automatic/public master roster** |
| D3 | **Salted TAGDEF family, fully pinned**: `DOMAIN_ANCHOR_SALTED` derivation + blinded-name-in-body rule + salted-family NFC-validation variant + vectors + **the salted/blinded resolver reserved in the registry resolver-gate set** (else the family ships dead) + wording that **permits deterministic HKDF salts** (P9 device-loss recovery). | **ADOPT** — the widest-reach reservation; under-reserving = "activation impossible post-freeze" |
| D4 | Blinded-disclosure record shape (name, salt, parentId, kindTag) + vector; docs carry the salt-compulsion caveat | **ADOPT** |
| D5 | **FS-5 recency-beacon word** in the checkpoint body (chainRef, blockNumber, blockHash), optional — the freshness anchor replacing fix 6; red-teamed twice and standing; residual = chain-dependent verifiability, labeled | **ADOPT** before checkpoint vectors freeze |
| D6 | **WHITEOUT re-encoded**: genesis `/.well-known/whiteout` TAGDEF object + ordinary REF-PIN (C5); union-mask sentence; freeze-gates §C label corrected; cross-author form = deny convention | **ADOPT** — replaces the sentinel-`targetKind` variant (REJECTED as self-contradictory) |
| D7 | P4(c) 0x02/0x03 (P-256/WebAuthn) activation through the KEL principal/actor seam, exact suite/profile rules, and two real authenticator families. Independent un-reservation while `recovered == author` remains is incoherent. | **SUPERSEDED — couple to [[kel]] §§8, 13 and external review** |

## E. Amendments / confirmations to existing Etched surface (before vectors are cut)

| # | Item | Status |
|---|---|---|
| E1 | `movedTo` follow-policy column re-word (serve-on-PRESENT / follow-on-PROVEN-ABSENT / stop-on-UNKNOWN) + vectors MUST include the nested-move / Denied / STALE / budget-accounting cases | **ADOPT — ceremony-blocking** (as-written vectors bake in broken lazy moves) |
| E2 | `symlink`/`movedTo` legal-`targetKind` sets must admit TAGDEF targets across container roots (KIND_GENERIC + KIND_DATA minimum) | **CONFIRM** — cross-container grafting dies in a table cell otherwise |
| E3 | `MAX_AUTO_FOLLOWS` re-cut per-segment (8 per segment, global visited-set) | **ADOPT** |
| E4 | Path-segment grammar pin (C2): reject-set superset + `MAX_NAME_BYTES = 255` + Unicode/NFC reconciliations + golden vectors | **ADOPT — ceremony-blocking** |
| E5 | `keyWrap` role/cardinality (C6): TAG-only + reserved self-occurrence-key escrow + random-default occurrence keys (private tier); `H(recipientEncKeyId)` = public convenience only, oracle named in row text | **ADOPT TAG-only**; ⚖ NEEDS-JAMES only if the dual-role PIN override is wanted |
| E6 | `contentEncryption`: keep row; pin PIN/cardinality-1; resolve the intern-fingerprint (fold format into the AEAD header; if an on-chain tag stays, per-file entropy) | **ADOPT** |
| E7 | LIST charter struct: confirm closed-vs-extensible + whether a LIST can charter VAL-layout (auto-interned) entries — gates collab Option A and B3-private containers | **CONFIRM** before kind-table freeze |
| E8 | Merge-rule declaration (fold identity): charter `configBytes` vs reserved `mergeRule` PIN vs convention+registry — must not be silent; whichever wins must ALSO pin `clientId = f(author, deviceBits)` and forbid session-random client-ids | **⚖ NEEDS-JAMES** (with E7 as input; urgency reduced by B3 demotion, 100-year replay still requires it) |
| E9 | R3 event-set re-cut: full record bodies (incl. `expiresAt`, and `claimedAt` if adopted) in claim events; delete deleted-kind events + OwnedConflict/ListFull; add SeqCollision/RefusedAppendOnly; genesis event parity | **ADOPT — ceremony-blocking, verified mandatory** (the drafted set falsifies log-only-sync) |
| E10 | Base-text storage survival check (tagParent/tagChildren, per-author KEEP set through the amendment-2 re-cut) | **CONFIRM** — traversal + per-author-backlink results lean on it |
| E11 | `propertyId` preimage check: interning must be value-only (key-independent) or the VAL-target selection payoff shrinks | **CONFIRM** |
| E12 | Genesis well-known namespace ruling (triggered by D6): reserved `efs.well-known` genesis subtree — membership ceremony-frozen | **ADOPT** — one manifest-scope paragraph |

## F. Explicit REJECTS (recorded so silence doesn't decide)

~~Kernel delegated revocation (`revoker == author` survives; KEL subsumes)~~ **superseded: actor self-revoke and principal-wide revoke require explicit grant scope** · any generic data-state membership / ACL / quota / cap admission check (the KEL home-authorization lane is the explicit, narrow exception to generic confluence) · lock/lease reserved row (advisory expiring-PIN convention instead) · coupled-admission "atomic pair" (LOUD reject) · `batchId` row (`(author, order)` cohort suffices) · mount reserved row (dual spelling of symlink) · pinned-graft row / `asOf` word on symlink bodies (pinning is link-layer + P7 manifests) · new record kind for CRDT ops (TAGs + interning) · validity-interval words valid-from/valid-to (content, not metadata) · quorum / LIVE-below-threshold grade (reader policy, never a grade) · `?venue=` URL key (identity-home and data-home coordinates replace a hint) · WHITEOUT-as-new-sentinel-targetKind (superseded by D6) · second cross-author tombstone row · handler-binding / freshness-beacon-key rows · ~~receipt/grant rows are conventions~~ **superseded: KEL grants and `AuthReceipt` are protocol state** · kernel causal DAG / prev-fence relaxation · revoke-echo (B5) · `summaryHash` (A3).

## G. Cross-cutting dependency flags for the ceremony sheet

- **B1 (`admittedAt`) is load-bearing for:** windowed delegation/membership (access), P13 defenses + update cooldowns (os), basis venue-conjunction (time), offer/accept expiry (consistency), watch ordering. **If refused, each has a priced degradation** — the refusal memo must list them (live-window-only + mandatory approval sweeps; heuristic-only P13; EXACT-anchor-only gates; consolidation-re-assert as the only offer/accept fix).
- **A2 (`claimedAt`)** rides E9's event re-cut; +8 bytes/claim forever; VAL-tail fuzz is the #1 engineering risk — re-open only on fuzz evidence.
- **D3/D4 (salted family)** underpin private folders, lens-config roaming (P9), B3-private containers, coercion-sensitive content.
- **E1 / E4 vectors and the reserved-key table vectors must be cut in ONE ceremony batch** or they get cut twice.

## H. Convention-not-row rulings (the registry must own these — all ADOPT as rulings)

Lens-object encoding **(write first)** · membership/lens-entry/approval shapes (approval-sweep = curator re-PIN) · union multi-target mount (`efs.fs/union`) · snapshot/basis records (with C8 view-parameter rules; ≥2 independent snapshotters for long-lived docs) · pedigree/basedOn · batch-undo inverse · offer/accept (three rules) · advisory lock key shape · mirror-health attestation · shredded attestation · device-bit allocation + `clientId` derivation (SDK-normative, launch-blocking) · handler-binding · freshness-beacon key · ~~receipt/grant (`act` is the grant)~~ **superseded by protocol KEL grants/receipts; `act` is provenance only** · padding/buckets + randomize-sensitive-VALs (MUST-level) + anon/dummy wraps + PQ-hybrid MUST (HNDL) · `claimedAt = 0` privacy rider · `.efs-bundle` format + pre-signed revoke-all abort artifact · `efs.collab/*` citation edges · saved searches/virtual folders · `contentEncoding` + copy/reflink dispositions.

## Open questions

- [ ] The ⚖ items → [[fs-pass-james-decisions]].
- [ ] Gas snapshot (freeze-gates B) before the P1 kernel-state bundle is priced.

## Pre-promotion checklist

- [ ] All `## Open questions` resolved or explicitly deferred (cite where)
- [ ] Every ceremony-blocking item (E1, E4, E9) has vectors owed listed
- [ ] Merged into [[freeze-gates]] §C at ceremony time (one consolidated reserve-set across all passes)
