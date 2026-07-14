# EFS v2 — FS pass: James decision sheet

**Status:** draft — decisions pending James
**Target repos:** planning, contracts
**Depends on:** [[fs-pass-synthesis]], [[fs-pass-freeze-reservations]]
**Last touched:** 2026-07-10

#status/draft #kind/design #repo/planning

## How to read this

Nine decisions the synthesis could NOT make for you — everything else it decided (see [[fs-pass-synthesis]] corrected canon and [[fs-pass-freeze-reservations]] ADOPT/REJECT items). Each has a **recommendation** and, where it's a reservation, the **priced degradation if refused**. **Sequencing:** decisions 1–3 should wait on the gas snapshot ([[freeze-gates]] B) — two red teams flagged the current cost numbers as unratifiable, so pricing the bundle on estimates would ship un-ratified numbers.

---

### 1. The `admittedAt` + index bundle (P1) — the pass's biggest lever

**Decision:** store `admittedAt[claimId]` (uint64, write-once per venue, `getProof`-provable), `revokedAt` (rides it), and the target-keyed discovery index (backlinks) — priced as ONE kernel-state decision after real gas numbers.
**Recommendation:** **ADOPT the full bundle with the target index trimmed to REF-layout targets.** Four lanes plus the access lane's renewal-lapse argument converge on it; it's the substrate for windowed delegation, P13 defenses, per-lens bases, offer/accept expiry, and native backlinks.
**Priced degradation if refused:** delegation/membership becomes live-window-only with mandatory approval sweeps; P13 backdate defense becomes heuristic-only; historical gates become EXACT-anchor-only; offer/accept expiry works only via consolidation-re-assert; backlinks become indexer-lane (the OS loses "cited-by / what-links-here" as a native surface) — even on refusal, **reserve the `discoverByTarget` selector + storage namespace as the floor** so later addition stays additive rather than impossible.
**Fences (non-negotiable if adopted):** `admittedAt` is **existence-since evidence only**, never a freshness anchor (the beacon is), and is **fenced out of every comparator, supersession key, and fold** — venue-relative state would break replication convergence.

### 2. `claimedAt` row (freeze-gates A.8b)

**Decision:** is per-record author-claimed time a blessed reserved body word or an app convention?
**Recommendation:** **ADOPT as a row**, with the C3 shape: always-present `uint64` (0 = no testimony), second-to-last body word, ASSERT PIN/TAG only, **performed-at semantics only**, forward-only falsifier ("unproven-early", never "detected backdate"). A convention here can never be promoted post-freeze, and timelines/journals need per-action time that batching collapses under one `order`.
**Cost:** +8 bytes/claim forever; rides the E9 event re-cut; VAL-tail fuzz is the top engineering risk.
**Note for decisions 2–3:** [[freeze-gates]] §A.8's verification note is corrected by this pass — item (iv)'s admittedAt-freshness routing is dead (C1; the D5 beacon is the anchor) and the "optional" claimedAt wording is superseded by the C3 always-present shape. Ratify A.8a/A.8b **with those corrections, not as-written**.

### 3. `seq` → `order` rename (freeze-gates A.8a)

**Decision:** rename the envelope ordering word.
**Recommendation:** **ADOPT.** Mechanism-inert but wire-breaking (regenerates the EIP-712 typeHash, digest, 42 vectors, wallet label) — so it must ride the freeze, not follow it. The rename matters because apps kept mis-trusting `seq` as a clock; `order` states its purely-ordinal meaning.

### 4. The dual-posture ruling (ecosystem-norm-setting)

**Decision:** what is EFS's default privacy posture?
**Recommendation:** **public archive stays public-by-default; the OS personal tier is private-by-default** — "permanent ≠ public." Strengthened by the pass's sharpest structural finding: **the privacy tier is availability infrastructure, not just confidentiality** — blinding is what makes fine-grained collaboration (and coercion-resistance, and metadata hygiene) buildable at all. This is a messaging/norm decision as much as a technical one; the reservations (D3/D4 salted family, C3 encryptionKey) support either default.

### 5. `keyWrap` role — TAG-only or dual-role PIN

**Decision:** the private-file key-wrap encoding.
**Recommendation:** **TAG-only** (as [[deterministic-ids]] §5/§13 already routed it), with random-default occurrence keys. This surfaces to you *only* because the deletion lane proposed a dual-role PIN that **overturns that stated exclusion** — a dual-role PIN is an explicit override of a documented decision (with an amendment line in deterministic-ids) or it does not happen. The dual-role's only merit is O(1) owner escrow, and the reserved self-occurrence-key TAG gives that at one extra slot read.

### 6. Merge-rule declaration (fold identity) — Option A/B/C

**Decision:** how a collaborative container declares which deterministic fold defines its state — LIST charter `configBytes` (A), a reserved `mergeRule` PIN (B), or convention + registry (C). Input: the E7 LIST-charter question (can a LIST charter VAL-layout entries?).
**Recommendation:** decide with E7; whichever wins **must** pin `clientId = f(author, deviceBits)` and forbid session-random client-ids (a fold-correctness requirement). Urgency is reduced by the B3-public demotion but 100-year deterministic replay still requires the rule frozen.

### 7. B3 demotion ratification (reverses a blessed pattern)

**Decision:** ratify striking "public" from the op-fold collaboration pattern.
**Recommendation:** **ADOPT.** Public + permissionless + convergent + bounded-reader-cost is a proven four-property impossibility; public/open-world docs route to revision-DAG-plus-curation. This changes external messaging — "Google-Docs-on-EFS" is a *private-container* capability, not a public one. The op-independent CRDT family (counters, OR-sets) and records-vs-views survive intact.

### 8. Channel-observatory commissioning (a resourcing decision, not a design)

**Decision:** the P6 monitoring doctrine cites Certificate Transparency; adopting the doctrine without funding the monitor recreates the exact CT failure it warns about.
**Recommendation:** decide whether to resource the observatory. Naming it here so it isn't assumed.

### 9. web3:// safelist liaison owner (a name, not a design)

**Decision:** the C4 per-chunk-SHA-256 EFSBytes change and the web3:// serving path need a named human owner to coordinate with the safelist.
**Recommendation:** assign one before EFSBytes vectors freeze.

---

## What the synthesis already decided (for reference — not yours to re-litigate unless wrong)

Grammar superset + `MAX_NAME_BYTES=255`; WHITEOUT re-encoding; occurrence-key random defaults; falsifier forward-only direction; comparator fence restoration; P10 device-bit unification; `authorHead` demotion to a hint; the R1 REF-only trim shape; offer/accept + batch-undo repairs; lens-object encoding + conventions-registry commissioning; the full dispositions master table (native/re-homed/gone). All in [[fs-pass-synthesis]].

## Open questions

- [ ] Sequence: run the [[freeze-gates]] B gas snapshot, then finalize decisions 1–3.

## Pre-promotion checklist

- [ ] All nine decisions ruled or explicitly deferred
- [ ] Refusal-degradation memos written for any ⚖ item James defers
- [ ] Merged into [[freeze-gates]] §A at ceremony time
